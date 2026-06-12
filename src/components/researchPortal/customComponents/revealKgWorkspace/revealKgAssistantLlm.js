/** Client-side LLM planning via hugeamp passthrough (HybridSearchReveal pattern). */

import { createLLMClient } from "@/utils/llmClient";
import { buildAssistantSessionContext } from "./revealKgAssistantContext.js";
import { buildConversationPromptSection } from "./revealKgAssistantConversation.js";
import {
    buildAssistantSystemPrompt,
    buildAssistantUserPrompt,
} from "./revealKgAssistantPrompt.js";
import { parseAssistantLlmJson, validateAssistantClarification, validateAssistantPlan } from "./revealKgAssistantPlan.js";
import {
    prepareAssistantPlannerJson,
    validationErrorToClarifyJson,
} from "./revealKgAssistantPlanRepair.js";
import { recordAssistantPlanUsage } from "./revealKgAssistantUsage.js";

let plannerClient = null;
const ASSISTANT_PLANNER_MODEL = "gpt-5-mini";

function getPlannerClient() {
    if (!plannerClient) {
        plannerClient = createLLMClient({
            llm: "openai",
            model: ASSISTANT_PLANNER_MODEL,
            system_prompt: buildAssistantSystemPrompt(),
        });
    }
    return plannerClient;
}

export function abortAssistantPlan() {
    plannerClient?.abort();
}

function sendPlannerPrompt(userPrompt) {
    const client = getPlannerClient();
    const systemPrompt = buildAssistantSystemPrompt();
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    return new Promise((resolve, reject) => {
        let settled = false;
        let usage = null;
        const finish = (error, response) => {
            if (settled) {
                return;
            }
            settled = true;
            if (error) {
                reject(error);
                return;
            }
            resolve({ response, usage, duration_ms: Math.round(
                (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt
            ) });
        };
        client.sendPrompt({
            userPrompt,
            systemPrompt,
            onResponse: (response) => finish(null, response),
            onUsage: (nextUsage) => {
                usage = nextUsage;
            },
            onError: (error) =>
                finish(error || new Error("Canvas assistant planner failed.")),
            onEnd: () => {
                if (!settled) {
                    finish(new Error("Incomplete planner response."));
                }
            },
        });
    });
}

export async function planAssistantQuery(
    userQuery,
    session,
    {
        interactiveLlmAvailable = false,
        viewOptions = {},
        savedLibraryGraphs = [],
        conversation = [],
        lastPlan = null,
    } = {}
) {
    const sessionContext = buildAssistantSessionContext(session, {
        interactiveLlmAvailable,
        viewOptions,
        savedLibraryGraphs,
    });
    const conversationSection = buildConversationPromptSection({
        conversation,
        lastPlan,
    });
    const userPrompt = buildAssistantUserPrompt(userQuery, sessionContext, {
        conversationSection,
    });
    const { response: raw, usage, duration_ms } = await sendPlannerPrompt(userPrompt);
    const json = parseAssistantLlmJson(raw);
    if (!json) {
        throw new Error("Could not parse planner response as JSON.");
    }

    const prepared = prepareAssistantPlannerJson(json, userQuery, sessionContext);
    if (prepared.type === "clarify") {
        const result = validateAssistantClarification(prepared.json);
        recordAssistantPlanUsage({
            usage,
            model: ASSISTANT_PLANNER_MODEL,
            outcome: "clarify",
            duration_ms,
        });
        if (process.env.NODE_ENV === "development") {
            console.info("[Canvas Assist] planner tokens", usage);
        }
        return {
            result,
            raw,
            usage,
        };
    }

    try {
        const result = validateAssistantPlan(prepared.json);
        recordAssistantPlanUsage({
            usage,
            model: ASSISTANT_PLANNER_MODEL,
            outcome: "plan",
            duration_ms,
        });
        if (process.env.NODE_ENV === "development") {
            console.info("[Canvas Assist] planner tokens", usage);
        }
        return {
            result,
            raw,
            usage,
        };
    } catch (error) {
        const result = validateAssistantClarification(
            validationErrorToClarifyJson(error, userQuery)
        );
        recordAssistantPlanUsage({
            usage,
            model: ASSISTANT_PLANNER_MODEL,
            outcome: "clarify",
            duration_ms,
        });
        if (process.env.NODE_ENV === "development") {
            console.info("[Canvas Assist] planner tokens", usage);
        }
        return {
            result,
            raw,
            usage,
        };
    }
}
