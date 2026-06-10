/** Client-side LLM planning via hugeamp passthrough (HybridSearchReveal pattern). */

import { createLLMClient } from "@/utils/llmClient";
import { buildAssistantSessionContext } from "./revealKgAssistantContext.js";
import {
    buildAssistantSystemPrompt,
    buildAssistantUserPrompt,
} from "./revealKgAssistantPrompt.js";
import { parseAssistantLlmJson, validateAssistantClarification, validateAssistantPlan } from "./revealKgAssistantPlan.js";
import {
    prepareAssistantPlannerJson,
    validationErrorToClarifyJson,
} from "./revealKgAssistantPlanRepair.js";

let plannerClient = null;

function getPlannerClient() {
    if (!plannerClient) {
        plannerClient = createLLMClient({
            llm: "openai",
            model: "gpt-5-mini",
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
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, response) => {
            if (settled) {
                return;
            }
            settled = true;
            if (error) {
                reject(error);
                return;
            }
            resolve(response);
        };
        client.sendPrompt({
            userPrompt,
            systemPrompt: buildAssistantSystemPrompt(),
            onResponse: (response) => finish(null, response),
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
    { interactiveLlmAvailable = false, viewOptions = {} } = {}
) {
    const sessionContext = buildAssistantSessionContext(session, {
        interactiveLlmAvailable,
        viewOptions,
    });
    const userPrompt = buildAssistantUserPrompt(userQuery, sessionContext);
    const raw = await sendPlannerPrompt(userPrompt);
    const json = parseAssistantLlmJson(raw);
    if (!json) {
        throw new Error("Could not parse planner response as JSON.");
    }

    const prepared = prepareAssistantPlannerJson(json, userQuery, sessionContext);
    if (prepared.type === "clarify") {
        return {
            result: validateAssistantClarification(prepared.json),
            raw,
        };
    }

    try {
        return {
            result: validateAssistantPlan(prepared.json),
            raw,
        };
    } catch (error) {
        return {
            result: validateAssistantClarification(
                validationErrorToClarifyJson(error, userQuery)
            ),
            raw,
        };
    }
}
