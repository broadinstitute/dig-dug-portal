let entryCounter = 0;

export function emptyAssistantState() {
    return {
        activeTab: "request",
        threadEntries: [],
        executing: false,
        executionProgressLabel: "",
        llmAvailable: null,
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

export function createAssistantStatusMessage(text, { pending = false } = {}) {
    entryCounter += 1;
    return {
        id: `assistant-status-${entryCounter}`,
        role: "assistant",
        text: String(text || "").trim(),
        pending,
    };
}

export function appendAssistantEntries(entries = [], nextEntries = []) {
    return [...entries, ...nextEntries.filter((entry) => String(entry?.text || "").trim())];
}

export function replacePendingAssistantEntry(entries = [], text, { isClarify = false } = {}) {
    const list = [...entries];
    const last = list[list.length - 1];
    if (last?.role === "assistant" && last.pending) {
        list[list.length - 1] = {
            ...last,
            text: String(text || "").trim(),
            pending: false,
            isClarify,
        };
        return list;
    }
    return appendAssistantEntries(list, [createAssistantStatusMessage(text, { isClarify })]);
}

export function removePendingAssistantEntry(entries = []) {
    const list = [...entries];
    const last = list[list.length - 1];
    if (last?.role === "assistant" && last.pending) {
        return list.slice(0, -1);
    }
    return list;
}
