<template>
    <aside
        v-if="open"
        class="wkb-assistant-popup"
        role="dialog"
        aria-modal="false"
        aria-labelledby="wkb-assistant-title"
        @click.stop
        @mousedown.stop
    >
        <header class="wkb-assistant-head">
            <div class="wkb-assistant-head-row">
                <h2 id="wkb-assistant-title">Canvas assistant</h2>
                <button
                    type="button"
                    class="wkb-assistant-close"
                    aria-label="Close"
                    :disabled="executing"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </div>
            <div class="wkb-assistant-tabs" role="tablist" aria-label="Assistant sections">
                <button
                    id="wkb-assistant-tab-request"
                    type="button"
                    role="tab"
                    class="wkb-assistant-tab"
                    :class="{ 'is-active': activeTab === 'request' }"
                    :aria-selected="activeTab === 'request' ? 'true' : 'false'"
                    aria-controls="wkb-assistant-panel-request"
                    :disabled="executing"
                    @click="activeTab = 'request'"
                >
                    Request
                </button>
                <button
                    id="wkb-assistant-tab-actions"
                    type="button"
                    role="tab"
                    class="wkb-assistant-tab"
                    :class="{ 'is-active': activeTab === 'actions' }"
                    :aria-selected="activeTab === 'actions' ? 'true' : 'false'"
                    aria-controls="wkb-assistant-panel-actions"
                    :disabled="executing"
                    @click="activeTab = 'actions'"
                >
                    Actions
                </button>
            </div>
            <p v-if="activeTab === 'request'" class="wkb-assistant-autocomplete-hint">
                Suggestions appear as you type. Use
                <kbd class="wkb-assistant-kbd">↑</kbd><kbd class="wkb-assistant-kbd">↓</kbd>
                to move,
                <kbd class="wkb-assistant-kbd">Tab</kbd> or
                <kbd class="wkb-assistant-kbd">Enter</kbd> to accept,
                <kbd class="wkb-assistant-kbd">Esc</kbd> to close.
            </p>
            <p v-if="activeTab === 'request'" class="wkb-assistant-intro">
                Describe graph changes in plain language. The assistant builds a step-by-step
                plan, then runs those steps for you.
            </p>
            <p v-else class="wkb-assistant-intro">
                Actions you can ask for in plain language. Switch to Request to try an example.
            </p>
        </header>

        <div
            v-show="activeTab === 'request'"
            id="wkb-assistant-panel-request"
            ref="messageScroll"
            role="tabpanel"
            aria-labelledby="wkb-assistant-tab-request"
            class="wkb-assistant-body"
        >
            <div v-if="!hasThread" class="wkb-assistant-welcome">
                <p class="wkb-assistant-welcome-lead">You can ask things like:</p>
                <ul class="wkb-assistant-examples">
                    <li>Explain selected nodes</li>
                    <li>Select top 5 genes connected to Type 2 diabetes</li>
                    <li>Filter genes related to insulin resistance, then expand from selected nodes</li>
                    <li>Show jumping edges on the graph</li>
                </ul>
            </div>

            <div v-else class="wkb-assistant-thread" role="log" aria-live="polite">
                <div
                    v-for="entry in threadEntries"
                    :key="entry.id"
                    :class="[
                        'wkb-assistant-message',
                        entry.role === 'user'
                            ? 'wkb-assistant-message--user'
                            : 'wkb-assistant-message--assistant',
                        entry.isClarify ? 'wkb-assistant-message--clarify' : '',
                        entry.isStepResult ? 'wkb-assistant-message--step-result' : '',
                    ]"
                >
                    <span class="wkb-assistant-message-label">
                        {{
                            entry.role === "user"
                                ? "You"
                                : entry.isStepResult
                                  ? "Step"
                                  : "Assistant"
                        }}
                    </span>
                    <p>{{ entry.text }}</p>
                </div>

                <p v-if="planning" class="wkb-assistant-status" role="status">
                    Planning canvas actions…
                </p>
                <p v-if="executing && executingStepLabel" class="wkb-assistant-status" role="status">
                    Running: {{ executingStepLabel }}
                </p>
                <p v-if="showStandaloneError" class="wkb-assistant-error" role="alert">{{ error }}</p>

                <div
                    v-if="clarification && clarification.message"
                    class="wkb-assistant-clarify"
                    role="status"
                >
                    <p class="wkb-assistant-clarify-lead">
                        Please improve your request, then edit and plan again.
                    </p>
                    <p class="wkb-assistant-clarify-message">{{ clarification.message }}</p>
                    <ul
                        v-if="clarification.issues && clarification.issues.length"
                        class="wkb-assistant-clarify-list"
                    >
                        <li v-for="(issue, index) in clarification.issues" :key="`issue-${index}`">
                            {{ issue }}
                        </li>
                    </ul>
                    <ul
                        v-if="clarification.suggestions && clarification.suggestions.length"
                        class="wkb-assistant-clarify-suggestions"
                    >
                        <li
                            v-for="(suggestion, index) in clarification.suggestions"
                            :key="`suggestion-${index}`"
                        >
                            {{ suggestion }}
                        </li>
                    </ul>
                </div>

                <div v-if="plan && plan.steps.length" class="wkb-assistant-plan">
                    <button
                        ref="executeAllButton"
                        type="button"
                        class="wkb-assistant-execute-all"
                        :disabled="!canExecuteAll"
                        @click="onExecuteAll"
                        @keydown.enter.prevent="onExecuteAll"
                    >
                        Execute all
                    </button>
                    <ol class="wkb-assistant-steps">
                        <li
                            v-for="(step, index) in plan.steps"
                            :key="step.id"
                            class="wkb-assistant-step"
                        >
                            <div class="wkb-assistant-step-main">
                                <span
                                    class="wkb-assistant-step-status"
                                    :class="`is-${stepStatus(step.id)}`"
                                    :aria-label="stepStatusLabel(step.id)"
                                />
                                <span class="wkb-assistant-step-label">
                                    {{ index + 1 }}. {{ step.label }}
                                </span>
                            </div>
                            <button
                                type="button"
                                class="wkb-assistant-step-run"
                                :disabled="planning || executing || stepStatus(step.id) === 'done'"
                                @click="$emit('execute-step', step.id)"
                            >
                                Run
                            </button>
                        </li>
                    </ol>
                </div>
            </div>
        </div>

        <div
            v-show="activeTab === 'actions'"
            id="wkb-assistant-panel-actions"
            role="tabpanel"
            aria-labelledby="wkb-assistant-tab-actions"
            class="wkb-assistant-body wkb-assistant-actions-panel"
        >
            <section
                v-for="group in actionCatalog"
                :key="group.group"
                class="wkb-assistant-action-group"
            >
                <h3 class="wkb-assistant-action-group-title">{{ group.group }}</h3>
                <ul class="wkb-assistant-action-list">
                    <li
                        v-for="action in group.actions"
                        :key="action.id"
                        class="wkb-assistant-action-item"
                    >
                        <div class="wkb-assistant-action-head">
                            <span class="wkb-assistant-action-label">{{ action.label }}</span>
                            <button
                                type="button"
                                class="wkb-assistant-action-try"
                                :disabled="planning || executing"
                                @click="tryExample(action.examples[0])"
                            >
                                Try
                            </button>
                        </div>
                        <p class="wkb-assistant-action-desc">{{ action.description }}</p>
                        <ul v-if="action.examples.length" class="wkb-assistant-action-examples">
                            <li v-for="(example, index) in action.examples" :key="`${action.id}-${index}`">
                                {{ example }}
                            </li>
                        </ul>
                    </li>
                </ul>
            </section>
        </div>

        <footer v-if="activeTab === 'request'" class="wkb-assistant-footer">
            <label class="wkb-assistant-input-label" for="wkb-assistant-input">
                Your request
            </label>
            <div class="wkb-assistant-input-wrap">
                <textarea
                    id="wkb-assistant-input"
                    ref="requestInput"
                    v-model="draft"
                    class="wkb-assistant-input"
                    rows="3"
                    :disabled="planning || executing"
                    placeholder="e.g. Explain selected nodes"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    aria-autocomplete="list"
                    :aria-expanded="showAutocomplete ? 'true' : 'false'"
                    aria-controls="wkb-assistant-suggest"
                    @input="onDraftInput"
                    @keydown="onDraftKeydown"
                    @click="updateAutocomplete"
                    @focus="updateAutocomplete"
                    @blur="onDraftBlur"
                />
                <ul
                    v-if="showAutocomplete"
                    id="wkb-assistant-suggest"
                    class="wkb-assistant-suggest"
                    role="listbox"
                    aria-label="Matching actions and graph nodes"
                >
                    <li
                        v-for="(item, index) in autocompleteSuggestions"
                        :key="item.id"
                        role="presentation"
                    >
                        <button
                            type="button"
                            class="wkb-assistant-suggest-item"
                            :class="{ 'is-active': index === suggestHighlight }"
                            role="option"
                            :aria-selected="index === suggestHighlight ? 'true' : 'false'"
                            @mousedown.prevent="selectSuggestion(item)"
                        >
                            <span class="wkb-assistant-suggest-label">{{ item.label }}</span>
                            <span
                                class="wkb-assistant-suggest-hint"
                                :class="{
                                    'wkb-assistant-suggest-hint--action': item.kind === 'action',
                                    'wkb-assistant-suggest-hint--entity': item.kind === 'entity',
                                    'wkb-assistant-suggest-hint--term': item.kind === 'term',
                                    'wkb-assistant-suggest-hint--phrase': item.kind === 'phrase',
                                    'wkb-assistant-suggest-hint--node': item.kind === 'node',
                                }"
                            >
                                {{ item.hint }}
                            </span>
                        </button>
                    </li>
                </ul>
            </div>
            <button
                type="button"
                class="wkb-assistant-send"
                :disabled="!draft.trim() || planning || executing"
                @click="onPlan"
            >
                Plan
            </button>
        </footer>
    </aside>
</template>

<script>
import { ASSISTANT_ACTION_CATALOG } from "./revealKgAssistantActionCatalog.js";
import { buildAssistantAutocompleteSuggestions } from "./revealKgAssistantActionSuggest.js";
import { getActiveToken, replaceActiveToken } from "./revealKgAssistantNodeSuggest.js";

let entryCounter = 0;

export default {
    name: "WorkspaceAiAssistantPanel",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        planning: {
            type: Boolean,
            default: false,
        },
        executing: {
            type: Boolean,
            default: false,
        },
        executingStepLabel: {
            type: String,
            default: "",
        },
        plan: {
            type: Object,
            default: null,
        },
        stepStates: {
            type: Object,
            default: () => ({}),
        },
        error: {
            type: String,
            default: "",
        },
        clarification: {
            type: Object,
            default: null,
        },
        graphNodes: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            activeTab: "request",
            draft: "",
            threadEntries: [],
            lastSubmittedQuery: "",
            actionCatalog: ASSISTANT_ACTION_CATALOG,
            autocompleteSuggestions: [],
            suggestHighlight: -1,
            suggestTokenStart: 0,
            suggestTokenEnd: 0,
        };
    },
    computed: {
        hasThread() {
            return (
                this.threadEntries.length > 0 ||
                this.planning ||
                Boolean(this.plan) ||
                Boolean(this.clarification?.message)
            );
        },
        showStandaloneError() {
            if (!this.error) {
                return false;
            }
            const last = this.threadEntries[this.threadEntries.length - 1];
            return !(last?.role === "assistant" && last.isClarify && last.text === this.error);
        },
        showAutocomplete() {
            return this.autocompleteSuggestions.length > 0 && this.activeTab === "request";
        },
        canExecuteAll() {
            return (
                Boolean(this.plan?.steps?.length) &&
                !this.planning &&
                !this.executing
            );
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.$nextTick(() => {
                    if (this.activeTab === "request") {
                        document.getElementById("wkb-assistant-input")?.focus();
                    }
                });
            }
        },
        plan(nextPlan) {
            if (nextPlan?.summary) {
                this.replacePendingAssistantMessage(nextPlan.summary);
                this.scrollMessagePanelToEnd();
            }
            if (nextPlan?.steps?.length) {
                this.focusExecuteAllButton();
            }
        },
        clarification(nextClarification) {
            if (!nextClarification?.message) {
                return;
            }
            this.activeTab = "request";
            this.replacePendingAssistantMessage(nextClarification.message, { isClarify: true });
            this.restoreDraftToInput(
                nextClarification.restoreQuery || this.lastSubmittedQuery
            );
            this.scrollMessagePanelToEnd();
        },
        planning(isPlanning, wasPlanning) {
            if (isPlanning) {
                this.scrollMessagePanelToEnd();
                return;
            }
            if (wasPlanning) {
                this.scrollMessagePanelToEnd();
                if (this.canExecuteAll) {
                    this.focusExecuteAllButton();
                }
            }
        },
        error(message) {
            if (!message) {
                return;
            }
            const last = this.threadEntries[this.threadEntries.length - 1];
            if (last?.role === "assistant" && last.pending) {
                this.threadEntries = [
                    ...this.threadEntries.slice(0, -1),
                    {
                        ...last,
                        text: message,
                        pending: false,
                        isClarify: true,
                    },
                ];
            }
            this.restoreDraftToInput(this.lastSubmittedQuery);
            this.scrollMessagePanelToEnd();
            this.$emit("error-acknowledged");
        },
    },
    methods: {
        scrollMessagePanelToEnd() {
            this.$nextTick(() => {
                requestAnimationFrame(() => {
                    const el = this.$refs.messageScroll;
                    if (el) {
                        el.scrollTop = el.scrollHeight;
                    }
                });
            });
        },
        getRequestInput() {
            return this.$refs.requestInput || null;
        },
        getExecuteAllButton() {
            return this.$refs.executeAllButton || null;
        },
        focusExecuteAllButton() {
            if (!this.canExecuteAll || this.activeTab !== "request") {
                return;
            }
            this.$nextTick(() => {
                requestAnimationFrame(() => {
                    const button = this.getExecuteAllButton();
                    if (button && !button.disabled) {
                        button.focus();
                    }
                });
            });
        },
        onExecuteAll() {
            if (!this.canExecuteAll) {
                return;
            }
            this.$emit("execute-all");
        },
        closeAutocomplete() {
            this.autocompleteSuggestions = [];
            this.suggestHighlight = -1;
        },
        updateAutocomplete() {
            const input = this.getRequestInput();
            if (!input || this.planning || this.executing) {
                this.closeAutocomplete();
                return;
            }
            const { token, start, end } = getActiveToken(this.draft, input.selectionStart);
            const matches = buildAssistantAutocompleteSuggestions({
                token,
                text: this.draft,
                tokenStart: start,
                graphNodes: this.graphNodes,
            });
            this.suggestTokenStart = start;
            this.suggestTokenEnd = end;
            this.autocompleteSuggestions = matches;
            this.suggestHighlight = matches.length ? 0 : -1;
        },
        onDraftInput() {
            this.updateAutocomplete();
        },
        onDraftBlur() {
            window.setTimeout(() => {
                this.closeAutocomplete();
            }, 120);
        },
        onDraftKeydown(event) {
            if (this.autocompleteSuggestions.length) {
                if (event.key === "ArrowDown") {
                    event.preventDefault();
                    this.suggestHighlight = Math.min(
                        this.suggestHighlight + 1,
                        this.autocompleteSuggestions.length - 1
                    );
                    return;
                }
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    this.suggestHighlight = Math.max(this.suggestHighlight - 1, 0);
                    return;
                }
                if (event.key === "Escape") {
                    event.preventDefault();
                    this.closeAutocomplete();
                    return;
                }
                if (event.key === "Tab" && this.suggestHighlight >= 0) {
                    event.preventDefault();
                    this.selectSuggestion(this.autocompleteSuggestions[this.suggestHighlight]);
                    return;
                }
                if (event.key === "Enter" && !event.shiftKey && this.suggestHighlight >= 0) {
                    event.preventDefault();
                    this.selectSuggestion(this.autocompleteSuggestions[this.suggestHighlight]);
                    return;
                }
            }
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (this.canExecuteAll && !String(this.draft || "").trim()) {
                    this.onExecuteAll();
                    return;
                }
                this.onPlan();
            }
        },
        selectSuggestion(item) {
            if (!item?.insertText) {
                return;
            }
            const replacement =
                item.kind === "action" ||
                item.kind === "entity" ||
                item.kind === "term"
                    ? `${item.insertText} `
                    : String(item.insertText);
            const { text, caret } = replaceActiveToken(
                this.draft,
                this.suggestTokenStart,
                this.suggestTokenEnd,
                replacement
            );
            this.draft = text;
            this.closeAutocomplete();
            this.$nextTick(() => {
                const input = this.getRequestInput();
                if (input) {
                    input.focus();
                    input.setSelectionRange(caret, caret);
                }
            });
        },
        restoreDraftToInput(query) {
            const restored = String(query || "").trim();
            if (!restored) {
                return;
            }
            this.draft = restored;
            this.activeTab = "request";
            this.$nextTick(() => {
                const input = this.getRequestInput();
                input?.focus();
                if (input && typeof input.setSelectionRange === "function") {
                    const end = restored.length;
                    input.setSelectionRange(end, end);
                }
                this.updateAutocomplete();
            });
        },
        tryExample(example) {
            const text = String(example || "").trim();
            if (!text || this.planning || this.executing) {
                return;
            }
            this.activeTab = "request";
            this.draft = text;
            this.closeAutocomplete();
            this.$nextTick(() => {
                const input = this.getRequestInput();
                input?.focus();
            });
        },
        buildThreadHistory() {
            return this.threadEntries
                .filter((entry) => !entry.pending && String(entry.text || "").trim())
                .map((entry) => ({
                    role: entry.role,
                    text: String(entry.text).trim(),
                }))
                .slice(-12);
        },
        appendStepResult(text) {
            const message = String(text || "").trim();
            if (!message) {
                return;
            }
            entryCounter += 1;
            this.threadEntries = [
                ...this.threadEntries,
                {
                    id: `step-result-${entryCounter}`,
                    role: "assistant",
                    text: message,
                    isStepResult: true,
                },
            ];
            this.scrollMessagePanelToEnd();
        },
        replacePendingAssistantMessage(text, { isClarify = false } = {}) {
            const last = this.threadEntries[this.threadEntries.length - 1];
            if (last?.role === "assistant" && last.pending) {
                this.threadEntries = [
                    ...this.threadEntries.slice(0, -1),
                    {
                        ...last,
                        text,
                        pending: false,
                        isClarify,
                    },
                ];
                this.scrollMessagePanelToEnd();
                return;
            }
            entryCounter += 1;
            this.threadEntries = [
                ...this.threadEntries,
                {
                    id: `assistant-${entryCounter}`,
                    role: "assistant",
                    text,
                    isClarify,
                },
            ];
            this.scrollMessagePanelToEnd();
        },
        onPlan() {
            const text = String(this.draft || "").trim();
            if (!text || this.planning || this.executing) {
                return;
            }
            this.lastSubmittedQuery = text;
            entryCounter += 1;
            this.threadEntries = [
                ...this.threadEntries,
                { id: `user-${entryCounter}`, role: "user", text },
                {
                    id: `assistant-pending-${entryCounter}`,
                    role: "assistant",
                    text: "Planning…",
                    pending: true,
                },
            ];
            this.draft = "";
            this.closeAutocomplete();
            this.scrollMessagePanelToEnd();
            this.$emit("plan-request", {
                query: text,
                threadHistory: this.buildThreadHistory(),
            });
        },
        stepStatus(stepId) {
            return this.stepStates?.[stepId] || "pending";
        },
        stepStatusLabel(stepId) {
            const status = this.stepStatus(stepId);
            if (status === "running") {
                return "Running";
            }
            if (status === "done") {
                return "Done";
            }
            if (status === "error") {
                return "Error";
            }
            return "Pending";
        },
    },
};
</script>

<style scoped>
.wkb-assistant-popup {
    position: absolute;
    top: var(--wkb-side-panel-top, 56px);
    right: 12px;
    bottom: 12px;
    z-index: 25;
    display: flex;
    flex-direction: column;
    width: min(380px, calc(100% - 24px));
    max-width: 420px;
    overflow: hidden;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 8px 32px rgba(20, 22, 30, 0.16);
    pointer-events: auto;
}

.wkb-assistant-head {
    flex-shrink: 0;
    padding: 16px 18px 12px;
}

.wkb-assistant-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.wkb-assistant-head-row h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
    line-height: 1.35;
}

.wkb-assistant-close {
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
}

.wkb-assistant-close:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-assistant-tabs {
    display: flex;
    gap: 4px;
    margin-top: 12px;
    padding: 3px;
    border-radius: 8px;
    background: #f6f5f2;
}

.wkb-assistant-tab {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
    font-weight: 600;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
}

.wkb-assistant-tab.is-active {
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    box-shadow: 0 1px 3px rgba(20, 22, 30, 0.08);
}

.wkb-assistant-tab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.wkb-assistant-autocomplete-hint {
    margin: 10px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-assistant-kbd {
    display: inline-block;
    margin: 0 1px;
    padding: 1px 5px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 4px;
    background: #f6f5f2;
    color: var(--cfde-ink, #33363d);
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
}

.wkb-assistant-intro {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-assistant-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 18px 12px;
}

.wkb-assistant-welcome-lead {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-examples {
    margin: 0;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-assistant-examples li {
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-thread {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wkb-assistant-message--step-result {
    padding-left: 10px;
    border-left: 3px solid var(--cfde-orange, #e07b39);
}

.wkb-assistant-message--step-result .wkb-assistant-message-label {
    color: var(--cfde-orange, #e07b39);
}

.wkb-assistant-message-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-assistant-message--user .wkb-assistant-message-label {
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-message p {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-status {
    margin: 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-assistant-error {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: #a34b2d;
}

.wkb-assistant-message--clarify .wkb-assistant-message-label {
    color: #a34b2d;
}

.wkb-assistant-clarify {
    padding: 10px 12px;
    border-radius: 8px;
    background: #fdf6f0;
    border: 1px solid #ecd9c8;
}

.wkb-assistant-clarify-lead {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 600;
    color: #a34b2d;
}

.wkb-assistant-clarify-message {
    margin: 0 0 8px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-clarify-list,
.wkb-assistant-clarify-suggestions {
    margin: 0 0 8px;
    padding-left: 1.2rem;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-clarify-suggestions {
    margin-bottom: 0;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-assistant-plan {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.wkb-assistant-execute-all {
    align-self: stretch;
    border: none;
    background: var(--cfde-orange, #e07b39);
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    padding: 9px 14px;
    border-radius: 8px;
    cursor: pointer;
}

.wkb-assistant-execute-all:hover:not(:disabled) {
    background: var(--cfde-orange-dark, #c2662b);
}

.wkb-assistant-execute-all:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-assistant-steps {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-assistant-step {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.wkb-assistant-step-main {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
}

.wkb-assistant-step-status {
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #d8d2c8;
}

.wkb-assistant-step-status.is-running {
    background: var(--cfde-blue, #2c5c97);
}

.wkb-assistant-step-status.is-done {
    background: #3d8b63;
}

.wkb-assistant-step-status.is-error {
    background: #c45c3a;
}

.wkb-assistant-step-label {
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-step-run {
    flex-shrink: 0;
    border: 1px solid var(--cfde-border, #e6e1d6);
    background: #ffffff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 13px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
}

.wkb-assistant-step-run:hover:not(:disabled) {
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    border-color: var(--cfde-blue, #2c5c97);
}

.wkb-assistant-step-run:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-assistant-footer {
    flex-shrink: 0;
    padding: 12px 18px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-assistant-input-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-input-wrap {
    position: relative;
}

.wkb-assistant-suggest {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(100% + 4px);
    z-index: 3;
    margin: 0;
    padding: 4px;
    max-height: 200px;
    overflow-y: auto;
    list-style: none;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.12);
}

.wkb-assistant-suggest-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
}

.wkb-assistant-suggest-item:hover,
.wkb-assistant-suggest-item.is-active {
    background: #eef4fb;
}

.wkb-assistant-suggest-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wkb-assistant-suggest-hint {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.wkb-assistant-suggest-hint--action {
    color: var(--cfde-orange, #e07b39);
}

.wkb-assistant-suggest-hint--entity {
    color: #3d7a5f;
}

.wkb-assistant-suggest-hint--term {
    color: #5a6a7a;
}

.wkb-assistant-suggest-hint--phrase {
    color: #6b5b95;
}

.wkb-assistant-suggest-hint--node {
    color: var(--cfde-blue, #2c5c97);
}

.wkb-assistant-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
    resize: vertical;
    min-height: 72px;
}

.wkb-assistant-input:disabled {
    opacity: 0.65;
}

.wkb-assistant-send {
    align-self: flex-end;
    border: none;
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
}

.wkb-assistant-send:hover:not(:disabled) {
    filter: brightness(1.05);
}

.wkb-assistant-send:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-assistant-actions-panel {
    padding-top: 4px;
}

.wkb-assistant-action-group + .wkb-assistant-action-group {
    margin-top: 16px;
}

.wkb-assistant-action-group-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.wkb-assistant-action-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.wkb-assistant-action-item {
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #faf9f7;
}

.wkb-assistant-action-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.wkb-assistant-action-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-action-try {
    flex-shrink: 0;
    border: 1px solid var(--cfde-border, #e6e1d6);
    background: #ffffff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    cursor: pointer;
}

.wkb-assistant-action-try:hover:not(:disabled) {
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    border-color: var(--cfde-blue, #2c5c97);
}

.wkb-assistant-action-try:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-assistant-action-desc {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-assistant-action-examples {
    margin: 6px 0 0;
    padding-left: 1.1rem;
    font-size: 12px;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
}
</style>
