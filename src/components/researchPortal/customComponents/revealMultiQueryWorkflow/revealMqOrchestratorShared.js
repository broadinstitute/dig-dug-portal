/**
 * Shared orchestration helpers for Multi Query REVEAL (extraction / retrieval / hypothesis phases).
 * Operates on the shell component instance (`vm`) for session mutation and step UI.
 */

function isLlmTimeoutError(err) {
    if (!err) return false;
    const status = err.status;
    if (status === 504) return true;
    const msg = (err.message || "").toString();
    return /504|Gateway Timeout|timeout|Timeout|Failed to fetch|Load failed|net::ERR_FAILED|CORS|Access-Control/i.test(
        msg
    );
}

/**
 * Runs an LLM call with a bounded retry loop. Supports an optional client-side
 * timeout race (extraction phase) and an optional in-loop response parse that
 * treats a parse failure as terminal (hypothesis phase) — both existing call
 * sites had subtly different shapes before this was unified.
 */
async function runLlmWithRetry(vm, {
    caller,
    maxAttempts = 3,
    timeoutMs = null,
    sendArgs = {},
    onState,
    parseResponse = null,
    isRetryableError = isLlmTimeoutError,
    buildTimeoutError = (secs) => {
        const err = new Error(`Request timed out after ${secs}s.`);
        err.status = 504;
        return err;
    },
    onAttemptStart = null,
    incompleteMessage = "Incomplete response.",
} = {}) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (onAttemptStart) onAttemptStart(attempt, maxAttempts);
        const result = await new Promise((resolve) => {
            let done = false;
            let timerId = null;
            const finish = (payload) => {
                if (done) return;
                done = true;
                if (timerId) clearTimeout(timerId);
                resolve(payload);
            };
            if (timeoutMs) {
                timerId = setTimeout(() => {
                    try {
                        caller.abort();
                    } catch {
                        /* ignore */
                    }
                    finish({
                        ok: false,
                        retry: attempt < maxAttempts,
                        err: buildTimeoutError(Math.round(timeoutMs / 1000)),
                    });
                }, timeoutMs);
            }
            caller.sendPrompt({
                ...sendArgs,
                onState,
                onResponse: (raw) => {
                    if (!parseResponse) {
                        finish({ ok: true, response: raw });
                        return;
                    }
                    const json = parseResponse(raw);
                    if (!json) {
                        finish({ ok: false, retry: false, err: new Error("Could not parse LLM JSON.") });
                        return;
                    }
                    finish({ ok: true, response: raw, json });
                },
                onError: (err) => {
                    const retry = isRetryableError(err) && attempt < maxAttempts;
                    finish({ ok: false, retry, err });
                },
                onEnd: () => {
                    if (done) return;
                    finish({ ok: false, retry: false, err: new Error(incompleteMessage) });
                },
            });
        });
        if (result.ok) return result;
        lastError = result.err || new Error("Request failed.");
        if (!result.retry) break;
    }
    return { ok: false, err: lastError };
}

/**
 * Classifies an error against an ordered bucket list (last bucket = catch-all) and
 * reports it consistently: error flags, load status text, and a step-error entry.
 */
function classifyAndReportError(vm, err, {
    buckets,
    errorFlag = null,
    errorMessageField = null,
    errorMessageFallback = "An error occurred.",
    reportLoadStatus = false,
    loadStatusStopTimer = true,
    markLoadComplete = false,
    onBeforeReport = null,
} = {}) {
    const message = err && err.message ? String(err.message) : "";
    const bucket = buckets.find((b) => b.test(err, message)) || buckets[buckets.length - 1];
    if (onBeforeReport) onBeforeReport(vm);
    if (errorFlag) vm[errorFlag] = true;
    if (errorMessageField) {
        vm[errorMessageField] = bucket.statusMessage ? bucket.statusMessage(message) : (message || errorMessageFallback);
    }
    if (reportLoadStatus) {
        const text = typeof reportLoadStatus === "function"
            ? reportLoadStatus(bucket, message)
            : (bucket.statusMessage ? bucket.statusMessage(message) : message);
        vm.setLoadStatus(text, loadStatusStopTimer);
    }
    vm.setStep({ type: "error", title: bucket.stepTitle ? bucket.stepTitle(message) : "An error occurred." });
    if (markLoadComplete) vm.loadComplete = true;
}

function resetMechanismResultState(vm) {
    vm.mechanisms = null;
    vm.mechanisms_summary = null;
    vm.mechanismDiagnosticAssessment = null;
    vm.hypothesisLastRunMode = null;
}

function resetRetrievalResultState(vm) {
    vm.factorData = {};
    vm.lastHybridSearchMeta = {};
    vm.lastHybridSearchResponse = null;
    vm.lastKgTriples = [];
}

/**
 * Returns the cached KG triples for `factorData`, building (and caching) them if absent
 * or if `forceRebuild` is set. Do not use this for ad-hoc single-pair KG subsets — those
 * must not overwrite the full-dataset `vm.lastKgTriples` cache.
 */
function getOrBuildKgTriples(vm, factorData, { factorsKey = "factors", forceRebuild = false } = {}) {
    if (!forceRebuild && Array.isArray(vm.lastKgTriples) && vm.lastKgTriples.length) return vm.lastKgTriples;
    const triples = vm.transformMergedDataToKG(factorData, factorsKey);
    vm.lastKgTriples = triples;
    return triples;
}

export {
    classifyAndReportError,
    getOrBuildKgTriples,
    isLlmTimeoutError,
    resetMechanismResultState,
    resetRetrievalResultState,
    runLlmWithRetry,
};
