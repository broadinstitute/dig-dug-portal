import { parseLlmJsonResponse } from "@/utils/llmUsageUtils.js";
import {
    isLlmTimeoutError,
    runLlmWithRetry,
} from "../revealMultiQueryWorkflow/revealMqOrchestratorShared.js";
import {
    BIOMARKER_MECHANISM_LINK_SYSTEM_PROMPT,
    buildBiomarkerMechanismLinkUserPrompt,
} from "./biomarkerMechanismLinkPrompt.js";

const DEFAULT_MAX_ATTEMPTS = 2;

/**
 * One Bedrock/Claude call: mechanism + full step-3 table → single JSON summary.
 *
 * @param {object} vm
 * @param {object} batchInput - from buildMechanismLinkBatchInputFromVm
 * @param {{ onStatus?: (msg: string) => void }} [opts]
 * @returns {Promise<{ ok: boolean, summary?: object, error?: Error }>}
 */
export async function fetchBiomarkerMechanismLinkSummary(vm, batchInput, opts = {}) {
    if (!vm || !vm.llmMechanismLink) {
        return { ok: false, error: new Error("LLM client is not configured.") };
    }

    const userPrompt = buildBiomarkerMechanismLinkUserPrompt(batchInput);
    const result = await runLlmWithRetry(vm, {
        caller: vm.llmMechanismLink,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
        sendArgs: {
            systemPrompt: BIOMARKER_MECHANISM_LINK_SYSTEM_PROMPT,
            userPrompt,
        },
        isRetryableError: isLlmTimeoutError,
        incompleteMessage: "Incomplete LLM response.",
        parseResponse: (raw) => {
            const parsed = parseLlmJsonResponse(raw);
            return parsed.ok ? parsed.json : null;
        },
        onAttemptStart: (attempt, max) => {
            opts.onStatus?.(`Generating mechanistic summary… (attempt ${attempt}/${max})`);
        },
    });

    if (!result.ok) {
        return {
            ok: false,
            error: result.err || new Error("Mechanistic summary request failed."),
        };
    }

    const summary = result.json;
    if (!summary || typeof summary !== "object") {
        return { ok: false, error: new Error("Could not parse LLM JSON response.") };
    }

    return { ok: true, summary };
}
