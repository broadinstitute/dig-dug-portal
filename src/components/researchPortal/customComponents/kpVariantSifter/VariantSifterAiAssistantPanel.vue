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
            <div class="vks-assistant-tabs" role="tablist" aria-label="Assistant sections">
                <button
                    id="vks-assistant-tab-request"
                    type="button"
                    role="tab"
                    class="vks-assistant-tab"
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
                    class="vks-assistant-tab"
                    :class="{ 'is-active': activeTab === 'actions' }"
                    :aria-selected="activeTab === 'actions' ? 'true' : 'false'"
                    aria-controls="vks-assistant-panel-actions"
                    :disabled="executing"
                    @click="$emit('update:activeTab', 'actions')"
                >
                    Actions
                </button>
            </div>
            <p v-if="activeTab === 'request' && !hasThread" class="vks-assistant-intro">
                Automated assistant steps for this workspace appear here as actions run.
            </p>
            <p v-else-if="activeTab === 'actions'" class="vks-assistant-intro">
                Available assistant actions for Variant Sifter. Use Run to execute an action
                on the current search session.
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
                <p class="vks-assistant-welcome-lead">When global enrichment loads, the assistant will:</p>
                <ul class="vks-assistant-examples">
                    <li>List annotation×tissue pairs in this locus</li>
                    <li>Ask the LLM which tissues are relevant to your phenotype and ancestry</li>
                    <li>Report what was highlighted vs muted on the GE plot</li>
                </ul>
                <p v-if="llmAvailable === false" class="vks-assistant-llm-note" role="note">
                    LLM service is not available. Relevance filtering will be skipped until the
                    interactive API is configured.
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
                v-for="group in actionCatalog"
                :key="group.group"
                class="vks-assistant-action-group"
            >
                <h3 class="vks-assistant-action-group-title">{{ group.group }}</h3>
                <ul class="vks-assistant-action-list">
                    <li
                        v-for="action in group.actions"
                        :key="action.id"
                        class="vks-assistant-action-item"
                    >
                        <div class="vks-assistant-action-head">
                            <span class="vks-assistant-action-label">{{ action.label }}</span>
                            <button
                                v-if="action.runnable"
                                type="button"
                                class="vks-assistant-action-run"
                                :disabled="executing || !canRunActions"
                                @click="$emit('run-action', action.id)"
                            >
                                Run
                            </button>
                        </div>
                        <p class="vks-assistant-action-desc">{{ action.description }}</p>
                        <template v-if="action.examples && action.examples.length">
                            <p class="vks-assistant-action-examples-label">Example uses</p>
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
    </aside>
</template>

<script>
import { VKS_ASSISTANT_ACTION_CATALOG } from "./variantSifterAssistantActionCatalog.js";

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
        actionCatalog: {
            type: Array,
            default: () => VKS_ASSISTANT_ACTION_CATALOG,
        },
    },
    computed: {
        hasThread() {
            return this.threadEntries.length > 0;
        },
        showExecutionProgress() {
            return Boolean(this.executing && this.executionProgressLabel);
        },
    },
    watch: {
        threadEntries: {
            handler() {
                this.$nextTick(() => this.scrollMessagePanelToEnd());
            },
            deep: true,
        },
        executing() {
            this.$nextTick(() => this.scrollMessagePanelToEnd());
        },
    },
    methods: {
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
    position: absolute;
    top: var(--vks-side-panel-top, 12px);
    right: calc(var(--vks-drawer-tab-width, 30px) + var(--vks-side-panel-inset, 12px));
    bottom: var(--vks-side-panel-inset, 12px);
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

.vks-assistant-tabs {
    display: flex;
    gap: 4px;
    margin-top: 12px;
    padding: 3px;
    border-radius: 8px;
    background: #f6f5f2;
}

.vks-assistant-tab {
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

.vks-assistant-tab.is-active {
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    box-shadow: 0 1px 3px rgba(20, 22, 30, 0.08);
}

.vks-assistant-tab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.vks-assistant-intro {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
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
    font-size: 12px;
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

.vks-assistant-execution-progress {
    flex-shrink: 0;
    padding: 10px 18px 12px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
    background: #fdfaf6;
}

.vks-assistant-execution-progress-label {
    margin: 0 0 8px;
    font-size: 12px;
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

.vks-assistant-actions-panel {
    padding-top: 4px;
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

.vks-assistant-action-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
}

.vks-assistant-action-label {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-assistant-action-run {
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

.vks-assistant-action-run:hover:not(:disabled) {
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    border-color: var(--cfde-blue, #2c5c97);
}

.vks-assistant-action-run:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.vks-assistant-action-examples-label {
    margin: 8px 0 4px;
    font-size: 11px;
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
    font-size: 12px;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
}
</style>
