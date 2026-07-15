<template>
    <aside
        v-if="open"
        class="vks-assistant-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="vks-assistant-title"
        @click.stop
        @mousedown.stop
    >
        <header class="vks-assistant-head">
            <div class="vks-assistant-head-row">
                <h2 id="vks-assistant-title">Variant Sifter assistant</h2>
                <button
                    type="button"
                    class="vks-assistant-close"
                    aria-label="Close assistant"
                    :disabled="executing"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </div>
            <div class="vks-ui-tabs" role="tablist" aria-label="Assistant sections">
                <button
                    id="vks-assistant-tab-request"
                    type="button"
                    role="tab"
                    class="vks-ui-tab"
                    :class="{ 'is-active': activeTab === 'request' }"
                    :aria-selected="activeTab === 'request' ? 'true' : 'false'"
                    aria-controls="vks-assistant-panel-request"
                    :disabled="executing"
                    @click="$emit('update:activeTab', 'request')"
                >
                    Request
                </button>
                <button
                    id="vks-assistant-tab-actions"
                    type="button"
                    role="tab"
                    class="vks-ui-tab"
                    :class="{ 'is-active': activeTab === 'actions' }"
                    :aria-selected="activeTab === 'actions' ? 'true' : 'false'"
                    aria-controls="vks-assistant-panel-actions"
                    :disabled="executing"
                    @click="$emit('update:activeTab', 'actions')"
                >
                    Actions
                </button>
            </div>
            <p v-if="activeTab === 'request' && !hasThread" class="vks-assistant-autocomplete-hint">
                Suggestions appear as you type. Hover or use
                <kbd class="vks-assistant-kbd">↑</kbd><kbd class="vks-assistant-kbd">↓</kbd>
                to see the full name above the list for long labels. Press
                <kbd class="vks-assistant-kbd">Tab</kbd> or
                <kbd class="vks-assistant-kbd">Enter</kbd> to accept,
                <kbd class="vks-assistant-kbd">Esc</kbd> to close.
            </p>
            <p v-if="activeTab === 'request' && !hasThread" class="vks-assistant-intro">
                Describe workspace changes in plain language. Suggested steps appear here; run them
                when you are ready.
            </p>
            <p v-else-if="activeTab === 'actions'" class="vks-assistant-intro">
                What you can ask for on the Request tab. Type similar requests in your own words —
                this list does not run actions directly.
            </p>
        </header>

        <div
            v-show="activeTab === 'request'"
            id="vks-assistant-panel-request"
            ref="messageScroll"
            role="tabpanel"
            aria-labelledby="vks-assistant-tab-request"
            class="vks-assistant-body"
        >
            <div v-if="!hasThread" class="vks-assistant-welcome">
                <p class="vks-assistant-welcome-lead">You can ask things like:</p>
                <ul class="vks-assistant-examples">
                    <li
                        v-for="(example, index) in welcomeExamples"
                        :key="`welcome-example-${index}`"
                    >
                        {{ example }}
                    </li>
                </ul>
                <p v-if="llmAvailable === false" class="vks-assistant-llm-note" role="note">
                    LLM service is not available. Relevance classification and other LLM actions
                    cannot run until the interactive API is configured.
                </p>
            </div>

            <div v-else class="vks-assistant-thread" role="log" aria-live="polite">
                <div
                    v-for="entry in threadEntries"
                    :key="entry.id"
                    :class="[
                        'vks-assistant-message',
                        entry.role === 'user'
                            ? 'vks-assistant-message--user'
                            : 'vks-assistant-message--assistant',
                        entry.isClarify ? 'vks-assistant-message--clarify' : '',
                        entry.isStepResult ? 'vks-assistant-message--step-result' : '',
                    ]"
                >
                    <span class="vks-assistant-message-label">
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

                <div v-if="hasPlan" class="vks-assistant-plan">
                    <button
                        type="button"
                        class="vks-assistant-execute-all"
                        :disabled="!canExecutePlan"
                        @click="onExecuteAll"
                    >
                        {{ plan.executeLabel || "Execute" }}
                    </button>
                    <ol class="vks-assistant-steps">
                        <li
                            v-for="(step, index) in plan.steps"
                            :key="step.id"
                            class="vks-assistant-step"
                        >
                            <div class="vks-assistant-step-main">
                                <span
                                    class="vks-assistant-step-status"
                                    :class="`is-${stepStatus(step.id)}`"
                                    :aria-label="stepStatusLabel(step.id)"
                                />
                                <span class="vks-assistant-step-label">
                                    {{ index + 1 }}. {{ step.label }}
                                </span>
                            </div>
                            <button
                                type="button"
                                class="vks-ui-btn vks-ui-btn--secondary vks-assistant-step-run"
                                :disabled="
                                    executing ||
                                        !canRunActions ||
                                        stepStatus(step.id) === 'done'
                                "
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
            id="vks-assistant-panel-actions"
            role="tabpanel"
            aria-labelledby="vks-assistant-tab-actions"
            class="vks-assistant-body vks-assistant-actions-panel"
        >
            <section
                v-for="section in actionCatalogSections"
                :key="section.section"
                class="vks-assistant-action-section"
            >
                <h2 class="vks-assistant-action-section-title">{{ section.section }}</h2>
                <p class="vks-assistant-action-section-intro">{{ section.intro }}</p>
                <section
                    v-for="group in section.groups"
                    :key="`${section.section}-${group.group}`"
                    class="vks-assistant-action-group"
                >
                    <h3 class="vks-assistant-action-group-title">{{ group.group }}</h3>
                    <ul class="vks-assistant-action-list">
                        <li
                            v-for="action in group.actions"
                            :key="action.id"
                            class="vks-assistant-action-item"
                        >
                            <span class="vks-assistant-action-label">{{ action.label }}</span>
                            <p class="vks-assistant-action-desc">{{ action.description }}</p>
                            <template v-if="action.examples && action.examples.length">
                                <p class="vks-assistant-action-examples-label">Example requests</p>
                                <ul class="vks-assistant-action-examples">
                                    <li
                                        v-for="(example, index) in action.examples"
                                        :key="`${action.id}-${index}`"
                                    >
                                        {{ example }}
                                    </li>
                                </ul>
                            </template>
                        </li>
                    </ul>
                </section>
            </section>
        </div>

        <div
            v-if="activeTab === 'request' && showExecutionProgress"
            class="vks-assistant-execution-progress"
            role="status"
            aria-live="polite"
        >
            <p class="vks-assistant-execution-progress-label">{{ executionProgressLabel }}</p>
            <div
                class="vks-assistant-execution-progress-track"
                role="progressbar"
                aria-busy="true"
                :aria-label="executionProgressLabel"
            >
                <span class="vks-assistant-execution-progress-fill" aria-hidden="true" />
            </div>
        </div>

        <footer v-if="activeTab === 'request'" class="vks-assistant-footer">
            <label class="vks-assistant-input-label" for="vks-assistant-input">
                Your request
            </label>
            <div class="vks-assistant-input-wrap">
                <textarea
                    id="vks-assistant-input"
                    ref="requestInput"
                    v-model="draft"
                    class="vks-assistant-input"
                    rows="3"
                    :disabled="executing"
                    placeholder="e.g. Zoom in, Classify tissues by phenotype relevance"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    aria-autocomplete="list"
                    :aria-expanded="showAutocomplete ? 'true' : 'false'"
                    aria-controls="vks-assistant-suggest"
                    @input="onDraftInput"
                    @keydown="onDraftKeydown"
                    @click="updateAutocomplete"
                    @focus="updateAutocomplete"
                    @blur="onDraftBlur"
                />
                <div v-if="showAutocomplete" class="vks-assistant-suggest-wrap">
                    <div
                        v-if="showSuggestionPreview"
                        class="vks-assistant-suggest-preview"
                        role="status"
                        aria-live="polite"
                    >
                        <span class="vks-assistant-suggest-preview-label">
                            {{ previewSuggestionLabel }}
                        </span>
                        <span
                            v-if="previewSuggestionHint"
                            class="vks-assistant-suggest-preview-hint"
                        >
                            {{ previewSuggestionHint }}
                        </span>
                    </div>
                    <ul
                        id="vks-assistant-suggest"
                        class="vks-assistant-suggest"
                        role="listbox"
                        aria-label="Matching assistant actions"
                    >
                        <li
                            v-for="(item, index) in autocompleteSuggestions"
                            :key="item.id"
                            role="presentation"
                        >
                            <button
                                type="button"
                                class="vks-assistant-suggest-item"
                                :class="{ 'is-active': index === suggestHighlight }"
                                role="option"
                                :aria-selected="index === suggestHighlight ? 'true' : 'false'"
                                :title="suggestionFullLabel(item)"
                                @mouseenter="suggestHoverIndex = index"
                                @mouseleave="suggestHoverIndex = -1"
                                @mousedown.prevent="selectSuggestion(item)"
                            >
                                <span class="vks-assistant-suggest-label">{{ item.label }}</span>
                                <span
                                    class="vks-assistant-suggest-hint"
                                    :class="{
                                        'vks-assistant-suggest-hint--action':
                                            item.kind === 'action',
                                        'vks-assistant-suggest-hint--phrase':
                                            item.kind === 'phrase',
                                    }"
                                >
                                    {{ item.hint }}
                                </span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
            <button
                type="button"
                class="vks-ui-btn vks-ui-btn--primary vks-assistant-send"
                :disabled="!draft.trim() || executing"
                @click="onSubmitRequest"
            >
                Run
            </button>
        </footer>
    </aside>
</template>

<script>
import {
    buildVksAssistantWelcomeExamples,
    VKS_ASSISTANT_ACTION_CATALOG_SECTIONS,
} from "./variantSifterAssistantActionCatalog.js";
import {
    assistantSuggestFullLabel,
    buildVksAssistantAutocompleteSuggestions,
    getActiveToken,
    replaceActiveToken,
    shouldShowAssistantSuggestPreview,
} from "./variantSifterAssistantActionSuggest.js";

export default {
    name: "VariantSifterAiAssistantPanel",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        activeTab: {
            type: String,
            default: "request",
        },
        threadEntries: {
            type: Array,
            default: () => [],
        },
        executing: {
            type: Boolean,
            default: false,
        },
        executionProgressLabel: {
            type: String,
            default: "",
        },
        llmAvailable: {
            type: Boolean,
            default: null,
        },
        canRunActions: {
            type: Boolean,
            default: false,
        },
        plan: {
            type: Object,
            default: null,
        },
        stepStates: {
            type: Object,
            default: () => ({}),
        },
        actionCatalogSections: {
            type: Array,
            default: () => VKS_ASSISTANT_ACTION_CATALOG_SECTIONS,
        },
    },
    data() {
        return {
            draft: "",
            welcomeExamples: buildVksAssistantWelcomeExamples(),
            autocompleteSuggestions: [],
            suggestHighlight: -1,
            suggestHoverIndex: -1,
            suggestTokenStart: 0,
            suggestTokenEnd: 0,
        };
    },
    computed: {
        hasThread() {
            return this.threadEntries.length > 0;
        },
        hasPlan() {
            return Boolean(this.plan?.steps?.length);
        },
        canExecutePlan() {
            return (
                this.canRunActions &&
                !this.executing &&
                this.hasPlan &&
                this.plan.steps.some((step) => this.stepStatus(step.id) !== "done")
            );
        },
        showExecutionProgress() {
            return Boolean(this.executing && this.executionProgressLabel);
        },
        showAutocomplete() {
            return this.autocompleteSuggestions.length > 0 && this.activeTab === "request";
        },
        previewSuggestionIndex() {
            if (this.suggestHoverIndex >= 0) {
                return this.suggestHoverIndex;
            }
            if (this.suggestHighlight >= 0) {
                return this.suggestHighlight;
            }
            return -1;
        },
        previewSuggestionLabel() {
            const item = this.autocompleteSuggestions[this.previewSuggestionIndex];
            return item ? this.suggestionFullLabel(item) : "";
        },
        previewSuggestionHint() {
            const item = this.autocompleteSuggestions[this.previewSuggestionIndex];
            return item?.hint || "";
        },
        showSuggestionPreview() {
            return shouldShowAssistantSuggestPreview(
                this.autocompleteSuggestions,
                this.previewSuggestionIndex
            );
        },
    },
    watch: {
        threadEntries: {
            handler() {
                this.$nextTick(() => this.scrollMessagePanelToEnd());
            },
            deep: true,
        },
        plan: {
            handler() {
                this.$nextTick(() => this.scrollMessagePanelToEnd());
            },
            deep: true,
        },
        executing(isExecuting) {
            if (isExecuting) {
                this.closeAutocomplete();
            }
            this.$nextTick(() => this.scrollMessagePanelToEnd());
        },
        open(isOpen) {
            if (isOpen) {
                this.$nextTick(() => this.scrollMessagePanelToEnd());
            } else {
                this.closeAutocomplete();
            }
        },
    },
    methods: {
        stepStatus(stepId) {
            return this.stepStates?.[stepId] || "pending";
        },
        stepStatusLabel(stepId) {
            const status = this.stepStatus(stepId);
            if (status === "done") {
                return "Completed";
            }
            if (status === "running") {
                return "Running";
            }
            if (status === "error") {
                return "Failed";
            }
            return "Pending";
        },
        getRequestInput() {
            return this.$refs.requestInput || null;
        },
        closeAutocomplete() {
            this.autocompleteSuggestions = [];
            this.suggestHighlight = -1;
            this.suggestHoverIndex = -1;
        },
        updateAutocomplete() {
            const input = this.getRequestInput();
            if (!input || this.executing) {
                this.closeAutocomplete();
                return;
            }
            const { token, start, end } = getActiveToken(this.draft, input.selectionStart);
            const matches = buildVksAssistantAutocompleteSuggestions({ token });
            this.suggestTokenStart = start;
            this.suggestTokenEnd = end;
            this.autocompleteSuggestions = matches;
            this.suggestHighlight = matches.length ? 0 : -1;
            this.suggestHoverIndex = -1;
        },
        suggestionFullLabel(item) {
            return assistantSuggestFullLabel(item);
        },
        scrollActiveSuggestionIntoView() {
            this.$nextTick(() => {
                const active = this.$el?.querySelector?.(
                    ".vks-assistant-suggest-item.is-active"
                );
                active?.scrollIntoView?.({ block: "nearest" });
            });
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
                    this.scrollActiveSuggestionIntoView();
                    return;
                }
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    this.suggestHighlight = Math.max(this.suggestHighlight - 1, 0);
                    this.scrollActiveSuggestionIntoView();
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
                if (this.canExecutePlan && !String(this.draft || "").trim()) {
                    this.onExecuteAll();
                    return;
                }
                this.onSubmitRequest();
            }
        },
        selectSuggestion(item) {
            if (!item?.insertText) {
                return;
            }
            const replacement =
                item.kind === "action" ? `${item.insertText} ` : String(item.insertText);
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
                    if (typeof input.setSelectionRange === "function") {
                        input.setSelectionRange(caret, caret);
                    }
                }
            });
        },
        onExecuteAll() {
            if (!this.canExecutePlan) {
                return;
            }
            this.$emit("execute-all");
        },
        onSubmitRequest() {
            const text = String(this.draft || "").trim();
            if (!text || this.executing) {
                return;
            }
            this.$emit("plan-request", { text });
            this.draft = "";
            this.closeAutocomplete();
        },
        scrollMessagePanelToEnd() {
            const panel = this.$refs.messageScroll;
            if (!panel) {
                return;
            }
            panel.scrollTop = panel.scrollHeight;
        },
    },
};
</script>

<style scoped>
.vks-assistant-panel {
    position: fixed;
    top: 0;
    right: calc(var(--vks-drawer-tab-width, 30px) + var(--vks-side-panel-inset, 12px));
    z-index: 25;
    display: flex;
    flex-direction: column;
    width: min(380px, calc(100% - 24px));
    max-width: 420px;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 12px 0 0 12px;
    background: #ffffff;
    box-shadow: 0 8px 32px rgba(20, 22, 30, 0.16);
    pointer-events: auto;
}

.vks-assistant-head {
    flex-shrink: 0;
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.vks-assistant-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.vks-assistant-head-row h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
    line-height: 1.35;
}

.vks-assistant-close {
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0 4px;
}

.vks-assistant-close:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.vks-assistant-intro {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-assistant-autocomplete-hint {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-assistant-kbd {
    display: inline-block;
    margin: 0 2px;
    padding: 1px 5px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 4px;
    background: #f6f5f2;
    font-size: 11px;
    font-family: inherit;
    line-height: 1.35;
}

.vks-assistant-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 0 18px 12px;
}

.vks-assistant-welcome-lead {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-assistant-examples {
    margin: 0;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.vks-assistant-examples li {
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.vks-assistant-llm-note {
    margin: 12px 0 0;
    font-size: 13px;
    line-height: 1.45;
    color: #a34b2d;
}

.vks-assistant-thread {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 8px;
}

.vks-assistant-message--step-result {
    padding-left: 10px;
    border-left: 3px solid var(--cfde-orange, #e07b39);
}

.vks-assistant-message--step-result .vks-assistant-message-label {
    color: var(--cfde-orange, #e07b39);
}

.vks-assistant-message-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.vks-assistant-message--user .vks-assistant-message-label {
    color: var(--cfde-ink, #33363d);
}

.vks-assistant-message--clarify .vks-assistant-message-label {
    color: #a34b2d;
}

.vks-assistant-message p {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.vks-assistant-plan {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 4px;
}

.vks-assistant-execute-all {
    width: 100%;
    border: none;
    background: #f0c3a8;
    color: #5a2e16;
    font-size: 13px;
    font-weight: 700;
    padding: 10px 14px;
    border-radius: 8px;
    cursor: pointer;
}

.vks-assistant-execute-all:hover:not(:disabled) {
    filter: brightness(0.98);
}

.vks-assistant-execute-all:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.vks-assistant-steps {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.vks-assistant-step {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
}

.vks-assistant-step-main {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
}

.vks-assistant-step-status {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    margin-top: 6px;
    border-radius: 50%;
    background: var(--cfde-blue, #2c5c97);
}

.vks-assistant-step-status.is-done {
    background: #3d7a5f;
}

.vks-assistant-step-status.is-running {
    background: var(--cfde-orange, #e07b39);
}

.vks-assistant-step-status.is-error {
    background: #b42318;
}

.vks-assistant-step-label {
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.vks-assistant-step-run {
    flex-shrink: 0;
}

.vks-assistant-execution-progress {
    flex-shrink: 0;
    padding: 10px 18px 12px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
    background: #fdfaf6;
}

.vks-assistant-execution-progress-label {
    margin: 0 0 8px;
    font-size: 13px;
    line-height: 1.45;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-assistant-execution-progress-track {
    height: 4px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(224, 123, 57, 0.18);
}

.vks-assistant-execution-progress-fill {
    display: block;
    width: 40%;
    height: 100%;
    border-radius: 999px;
    background: var(--cfde-orange, #e07b39);
    animation: vks-assistant-execution-progress-slide 1.25s ease-in-out infinite;
}

@keyframes vks-assistant-execution-progress-slide {
    0% {
        transform: translateX(-120%);
    }
    100% {
        transform: translateX(320%);
    }
}

.vks-assistant-footer {
    flex-shrink: 0;
    padding: 12px 18px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
    background: #ffffff;
}

.vks-assistant-input-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-assistant-input-wrap {
    position: relative;
}

.vks-assistant-suggest-wrap {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(100% + 4px);
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.vks-assistant-suggest-preview {
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #f8fafc;
    box-shadow: 0 4px 16px rgba(20, 22, 30, 0.1);
}

.vks-assistant-suggest-preview-label {
    display: block;
    font-size: 12px;
    line-height: 1.45;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
    overflow-wrap: anywhere;
    word-break: break-word;
}

.vks-assistant-suggest-preview-hint {
    display: block;
    margin-top: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-assistant-suggest {
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

.vks-assistant-suggest-item {
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

.vks-assistant-suggest-item:hover,
.vks-assistant-suggest-item.is-active {
    background: #eef4fb;
}

.vks-assistant-suggest-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.vks-assistant-suggest-hint {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.vks-assistant-suggest-hint--action {
    color: var(--cfde-orange, #e07b39);
}

.vks-assistant-suggest-hint--phrase {
    color: #6b5b95;
}

.vks-assistant-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
    resize: vertical;
    min-height: 72px;
}

.vks-assistant-input:disabled {
    opacity: 0.65;
}

.vks-assistant-send {
    align-self: flex-end;
}

.vks-assistant-actions-panel {
    padding-top: 4px;
}

.vks-assistant-action-section + .vks-assistant-action-section {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
}

.vks-assistant-action-section-title {
    margin: 0 0 6px;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-assistant-action-section-intro {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-assistant-action-group + .vks-assistant-action-group {
    margin-top: 16px;
}

.vks-assistant-action-group-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.vks-assistant-action-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.vks-assistant-action-item {
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #faf9f7;
}

.vks-assistant-action-label {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-assistant-action-examples-label {
    margin: 8px 0 4px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--cfde-muted, #6b7280);
}

.vks-assistant-action-desc {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-assistant-action-examples {
    margin: 6px 0 0;
    padding-left: 1.1rem;
    font-size: 13px;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
}
</style>
