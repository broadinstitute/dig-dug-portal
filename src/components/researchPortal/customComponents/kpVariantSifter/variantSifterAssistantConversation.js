let entryCounter = 0;

export function emptyAssistantState() {
    return {
        activeTab: "request",
        threadEntries: [],
        executing: false,
        executionProgressLabel: "",
        llmAvailable: null,
        plan: null,
        stepStates: {},
        cs2ctStarPrompt: null,
        understudiedStarPrompt: null,
        understudiedAncestry: null,
    };
}

export function createUserMessage(text) {
    entryCounter += 1;
    return {
        id: `user-${entryCounter}`,
        role: "user",
        text: String(text || "").trim(),
    };
}

export function createAssistantMessage(text, { isClarify = false } = {}) {
    entryCounter += 1;
    return {
        id: `assistant-${entryCounter}`,
        role: "assistant",
        text: String(text || "").trim(),
        isClarify,
    };
}

export function createAssistantStepMessage(text, { isClarify = false } = {}) {
    entryCounter += 1;
    return {
        id: `assistant-step-${entryCounter}`,
        role: "assistant",
        text: String(text || "").trim(),
        isStepResult: true,
        isClarify,
    };
}

export function createAssistantStatusMessage(text, { pending = false, isStepResult = false } = {}) {
    entryCounter += 1;
    return {
        id: `assistant-status-${entryCounter}`,
        role: "assistant",
        text: String(text || "").trim(),
        pending,
        isStepResult,
    };
}

export function appendAssistantEntries(entries = [], nextEntries = []) {
    return [...entries, ...nextEntries.filter((entry) => String(entry?.text || "").trim())];
}

export function replacePendingAssistantEntry(
    entries = [],
    text,
    { isClarify = false, isStepResult = true } = {}
) {
    const list = [...entries];
    const last = list[list.length - 1];
    if (last?.role === "assistant" && last.pending) {
        list[list.length - 1] = {
            ...last,
            text: String(text || "").trim(),
            pending: false,
            isClarify,
            isStepResult: Boolean(last.isStepResult || isStepResult),
        };
        return list;
    }
    return appendAssistantEntries(list, [
        createAssistantStatusMessage(text, { isClarify, isStepResult }),
    ]);
}

export function removePendingAssistantEntry(entries = []) {
    const list = [...entries];
    const last = list[list.length - 1];
    if (last?.role === "assistant" && last.pending) {
        return list.slice(0, -1);
    }
    return list;
}

export function createAssistantPlan(steps = [], { executeLabel = "Execute" } = {}) {
    const normalizedSteps = (steps || [])
        .filter((step) => step?.actionId || step?.id)
        .map((step, index) => ({
            id: step.id || `step-${step.actionId || index}`,
            actionId: step.actionId || step.id,
            label: step.label || step.actionId || `Step ${index + 1}`,
        }));
    if (!normalizedSteps.length) {
        return null;
    }
    return {
        executeLabel,
        steps: normalizedSteps,
    };
}
