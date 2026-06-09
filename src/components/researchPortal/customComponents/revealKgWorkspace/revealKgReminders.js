/** Contextual reminders for REVEAL KG Canvas (one visible at a time). */

export const REMINDER_ACTION = {
    EXPLAIN_GRAPH: "explain_graph",
    BUILD_HYPOTHESES: "build_hypotheses",
    FIND_DATASETS: "find_datasets",
    SAVE_LIBRARY: "save_library",
    EXPORT_GRAPH: "export_graph",
    DOWNLOAD_SNAPSHOT: "download_snapshot",
    BUILD_GRAPH: "build_graph",
    DISMISS: "dismiss",
};

export const REMINDER_ID = {
    NEW_GRAPH: "new_graph",
    LIBRARY_LOAD: "library_load",
    IMPORT_GRAPH: "import_graph",
    EXPAND_GRAPH: "expand_graph",
    NODES_ADDED_SAVE: "nodes_added_save",
    AFTER_ANALYSIS_PERSIST: "after_analysis_persist",
    AFTER_SAVE_EXPORT: "after_save_export",
    PENDING_GRAPH_REBUILD: "pending_graph_rebuild",
};

export const NODES_ADDED_SAVE_THRESHOLD = 5;
export const REMINDER_AUTO_DISMISS_MS = 10000;
export const GRAPH_REBUILD_DELAY_MS = 10000;

export function createGraphReminderTracker(instanceKey = "") {
    return {
        instanceKey: String(instanceKey || Date.now()),
        shown: {},
        nodeCountAtLastSave: 0,
    };
}

export function resetGraphReminderTracker(instanceKey) {
    return createGraphReminderTracker(instanceKey);
}

export function reminderWasShown(tracker, id) {
    return Boolean(tracker?.shown?.[id]);
}

export function markReminderShown(tracker, id) {
    if (!tracker || !id) {
        return tracker;
    }
    return {
        ...tracker,
        shown: {
            ...(tracker.shown || {}),
            [id]: true,
        },
    };
}

export function syncSaveBaseline(tracker, nodeCount) {
    const count = Number(nodeCount) || 0;
    return {
        ...tracker,
        nodeCountAtLastSave: count,
    };
}

export function nodesAddedSinceSave(tracker, nodeCount) {
    const current = Number(nodeCount) || 0;
    const baseline = Number(tracker?.nodeCountAtLastSave) || 0;
    return Math.max(0, current - baseline);
}

function action(id, label, { primary = false } = {}) {
    return { id, label, primary };
}

export function buildNewGraphReminder() {
    return {
        id: REMINDER_ID.NEW_GRAPH,
        message:
            "Your graph is ready. Summarize it with Explain graph, or save a checkpoint in My library.",
        actions: [
            action(REMINDER_ACTION.EXPLAIN_GRAPH, "Explain graph", { primary: true }),
            action(REMINDER_ACTION.SAVE_LIBRARY, "Save to library"),
            action(REMINDER_ACTION.EXPORT_GRAPH, "Export graph"),
            action(REMINDER_ACTION.DISMISS, "Dismiss"),
        ],
    };
}

export function buildLibraryLoadReminder() {
    return {
        id: REMINDER_ID.LIBRARY_LOAD,
        message:
            "Loaded from My library (layout only). Inspector evidence is fetched when you inspect nodes.",
        actions: [action(REMINDER_ACTION.DISMISS, "Got it", { primary: true })],
    };
}

export function buildImportGraphReminder() {
    return {
        id: REMINDER_ID.IMPORT_GRAPH,
        message:
            "Graph imported with session data. Explain graph to summarize, or continue expanding.",
        actions: [
            action(REMINDER_ACTION.EXPLAIN_GRAPH, "Explain graph", { primary: true }),
            action(REMINDER_ACTION.DISMISS, "Dismiss"),
        ],
    };
}

export function buildExpandGraphReminder() {
    return {
        id: REMINDER_ID.EXPAND_GRAPH,
        message:
            "Graph expanded. Explain the updated graph or save changes to My library.",
        actions: [
            action(REMINDER_ACTION.EXPLAIN_GRAPH, "Explain graph", { primary: true }),
            action(REMINDER_ACTION.SAVE_LIBRARY, "Save to library"),
            action(REMINDER_ACTION.DISMISS, "Dismiss"),
        ],
    };
}

export function buildNodesAddedSaveReminder(addedCount) {
    const count = Number(addedCount) || NODES_ADDED_SAVE_THRESHOLD;
    return {
        id: REMINDER_ID.NODES_ADDED_SAVE,
        message: `You added ${count} node${count === 1 ? "" : "s"} since last save. Save to My library?`,
        actions: [
            action(REMINDER_ACTION.SAVE_LIBRARY, "Save to library", { primary: true }),
            action(REMINDER_ACTION.DISMISS, "Not now"),
        ],
    };
}

export function buildAfterAnalysisPersistReminder({ analysisLabel = "Analysis" } = {}) {
    return {
        id: REMINDER_ID.AFTER_ANALYSIS_PERSIST,
        message: `${analysisLabel} finished. Save this graph to My library, export it, or download a graph snapshot?`,
        actions: [
            action(REMINDER_ACTION.SAVE_LIBRARY, "Save to library", { primary: true }),
            action(REMINDER_ACTION.EXPORT_GRAPH, "Export graph"),
            action(REMINDER_ACTION.DOWNLOAD_SNAPSHOT, "Download graph snapshot"),
            action(REMINDER_ACTION.DISMISS, "Not now"),
        ],
    };
}

export function buildAfterSaveExportReminder() {
    return {
        id: REMINDER_ID.AFTER_SAVE_EXPORT,
        message:
            "Saved to My library (layout only). Export graph to keep inspector data with the file.",
        actions: [
            action(REMINDER_ACTION.EXPORT_GRAPH, "Export graph", { primary: true }),
            action(REMINDER_ACTION.DISMISS, "Dismiss"),
        ],
    };
}

export function buildPendingGraphRebuildReminder(pendingCount = 1) {
    const count = Number(pendingCount) || 1;
    const nodeLabel =
        count === 1 ? "A node was" : `${count} nodes were`;
    const seconds = Math.round(GRAPH_REBUILD_DELAY_MS / 1000);
    return {
        id: REMINDER_ID.PENDING_GRAPH_REBUILD,
        message: `${nodeLabel} added. Rebuild the graph to connect them and refresh the layout. Rebuild will run automatically in ${seconds} seconds.`,
        actions: [
            action(REMINDER_ACTION.BUILD_GRAPH, "Build graph now", { primary: true }),
        ],
    };
}

export function showReminder(_state, reminder) {
    if (!reminder?.id) {
        return { active: null };
    }
    return { active: reminder };
}

export function dismissActiveReminder(state, tracker) {
    if (!state?.active) {
        return { state: { active: null }, tracker };
    }
    const nextTracker = markReminderShown(tracker, state.active.id);
    return {
        state: { active: null },
        tracker: nextTracker,
    };
}

export function tryShowReminder(state, tracker, reminder, { oncePerGraph = true } = {}) {
    if (!reminder?.id) {
        return { state: { active: null }, tracker, shown: false };
    }
    const hasActive = Boolean(state?.active);
    if (oncePerGraph && !hasActive && reminderWasShown(tracker, reminder.id)) {
        return { state, tracker, shown: false };
    }
    return {
        state: showReminder(state, reminder),
        tracker,
        shown: true,
    };
}
