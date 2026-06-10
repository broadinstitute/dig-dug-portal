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
                    ]"
                >
                    <span class="wkb-assistant-message-label">
                        {{ entry.role === "user" ? "You" : "Assistant" }}
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
                        type="button"
                        class="wkb-assistant-execute-all"
                        :disabled="planning || executing"
                        @click="$emit('execute-all')"
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
                    :aria-expanded="showNodeSuggestions ? 'true' : 'false'"
                    aria-controls="wkb-assistant-node-suggest"
                    @input="onDraftInput"
                    @keydown="onDraftKeydown"
                    @click="updateNodeSuggestions"
                    @focus="updateNodeSuggestions"
                    @blur="onDraftBlur"
                />
                <ul
                    v-if="showNodeSuggestions"
                    id="wkb-assistant-node-suggest"
                    class="wkb-assistant-node-suggest"
                    role="listbox"
                    aria-label="Matching graph nodes"
                >
                    <li
                        v-for="(item, index) in nodeSuggestions"
                        :key="item.node_id"
                        role="presentation"
                    >
                        <button
                            type="button"
                            class="wkb-assistant-node-suggest-item"
                            :class="{ 'is-active': index === suggestHighlight }"
                            role="option"
                            :aria-selected="index === suggestHighlight ? 'true' : 'false'"
                            @mousedown.prevent="selectNodeSuggestion(item)"
                        >
                            <span class="wkb-assistant-node-suggest-label">{{ item.label }}</span>
                            <span class="wkb-assistant-node-suggest-type">{{ item.typeLabel }}</span>
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
import {
    getActiveToken,
    matchAssistantSuggestNodes,
    replaceActiveToken,
} from "./revealKgAssistantNodeSuggest.js";

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
            nodeSuggestions: [],
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
        showNodeSuggestions() {
            return this.nodeSuggestions.length > 0 && this.activeTab === "request";
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
            if (!nextPlan?.summary) {
                return;
            }
            this.replacePendingAssistantMessage(nextPlan.summary);
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
            this.$emit("error-acknowledged");
        },
    },
    methods: {
        getRequestInput() {
            return this.$refs.requestInput || null;
        },
        closeNodeSuggestions() {
            this.nodeSuggestions = [];
            this.suggestHighlight = -1;
        },
        updateNodeSuggestions() {
            const input = this.getRequestInput();
            if (!input || this.planning || this.executing) {
                this.closeNodeSuggestions();
                return;
            }
            const { token, start, end } = getActiveToken(this.draft, input.selectionStart);
            const matches = matchAssistantSuggestNodes(token, this.graphNodes);
            this.suggestTokenStart = start;
            this.suggestTokenEnd = end;
            this.nodeSuggestions = matches;
            this.suggestHighlight = matches.length ? 0 : -1;
        },
        onDraftInput() {
            this.updateNodeSuggestions();
        },
        onDraftBlur() {
            window.setTimeout(() => {
                this.closeNodeSuggestions();
            }, 120);
        },
        onDraftKeydown(event) {
            if (this.nodeSuggestions.length) {
                if (event.key === "ArrowDown") {
                    event.preventDefault();
                    this.suggestHighlight = Math.min(
                        this.suggestHighlight + 1,
                        this.nodeSuggestions.length - 1
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
                    this.closeNodeSuggestions();
                    return;
                }
                if (event.key === "Tab" && this.suggestHighlight >= 0) {
                    event.preventDefault();
                    this.selectNodeSuggestion(this.nodeSuggestions[this.suggestHighlight]);
                    return;
                }
                if (event.key === "Enter" && !event.shiftKey && this.suggestHighlight >= 0) {
                    event.preventDefault();
                    this.selectNodeSuggestion(this.nodeSuggestions[this.suggestHighlight]);
                    return;
                }
            }
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                this.onPlan();
            }
        },
        selectNodeSuggestion(node) {
            if (!node?.label) {
                return;
            }
            const { text, caret } = replaceActiveToken(
                this.draft,
                this.suggestTokenStart,
                this.suggestTokenEnd,
                node.label
            );
            this.draft = text;
            this.closeNodeSuggestions();
            this.$nextTick(() => {
                const input = this.getRequestInput();
                if (input) {
                    input.focus();
                    input.setSelectionRange(caret, caret);
                }
                this.updateNodeSuggestions();
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
                this.updateNodeSuggestions();
            });
        },
        tryExample(example) {
            const text = String(example || "").trim();
            if (!text || this.planning || this.executing) {
                return;
            }
            this.activeTab = "request";
            this.draft = text;
            this.closeNodeSuggestions();
            this.$nextTick(() => {
                const input = this.getRequestInput();
                input?.focus();
            });
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
            this.closeNodeSuggestions();
            this.$emit("plan-request", text);
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
    top: 12px;
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

.wkb-assistant-intro {
    margin: 8px 0 0;
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

.wkb-assistant-node-suggest {
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

.wkb-assistant-node-suggest-item {
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

.wkb-assistant-node-suggest-item:hover,
.wkb-assistant-node-suggest-item.is-active {
    background: #eef4fb;
}

.wkb-assistant-node-suggest-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wkb-assistant-node-suggest-type {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    text-transform: uppercase;
    letter-spacing: 0.03em;
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
