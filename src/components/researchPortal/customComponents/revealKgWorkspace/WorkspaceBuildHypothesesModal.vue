<template>
    <div
        v-if="open"
        class="wkb-hypotheses-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-hypotheses-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-hypotheses-title"
            @click.stop
        >
            <header class="wkb-hypotheses-head">
                <div class="wkb-hypotheses-head-row">
                    <h2 id="wkb-hypotheses-title">Build hypotheses</h2>
                    <button
                        type="button"
                        class="wkb-hypotheses-close"
                        aria-label="Close"
                        :disabled="loading"
                        @click="$emit('close')"
                    >
                        &times;
                    </button>
                </div>
                <p class="wkb-hypotheses-intro">
                    Rank gene → mechanism → trait pathways among your selected nodes. Each
                    result shows how those nodes connect — click Generate hypothesis for an
                    LLM-written hypothesis, or open Association scores for evidence tables.
                </p>
            </header>

            <div class="wkb-hypotheses-body">
                <p v-if="!selectedNodeCount" class="wkb-hypotheses-empty">
                    Mark nodes as selected on the canvas before building hypotheses.
                </p>

                <template v-else>
                    <p class="wkb-hypotheses-helper">
                        Using {{ selectedNodeCount }} selected node{{
                            selectedNodeCount === 1 ? "" : "s"
                        }}
                        as the focus for connection ranking.
                    </p>

                    <p v-if="!llmAvailable" class="wkb-hypotheses-llm-note" role="note">
                        LLM prioritization and hypotheses are not available — the interactive API
                        did not report an LLM backend.
                    </p>

                    <div v-if="loading" class="wkb-hypotheses-loading" role="status">
                        <span class="wkb-hypotheses-spinner" aria-hidden="true" />
                        <div>
                            <strong>Finding connections…</strong>
                            <p>This may take a moment.</p>
                        </div>
                    </div>

                    <section
                        v-if="resultRun && resultRun.status === 'success' && !draftRun"
                        class="wkb-hypotheses-results"
                    >
                        <WorkspaceSigChainRunCard
                            :run="resultRun"
                            :anchor-items="anchorItems"
                            :selected-node-ids="selectedNodeIds"
                            :session-context="sessionContext"
                            :api-client="apiClient"
                            :llm-available="llmAvailable"
                            @pathway-state-update="$emit('pathway-state-update', $event)"
                        />
                    </section>

                    <section v-if="draftRun" class="wkb-hypotheses-form">
                        <label class="wkb-hypotheses-label" for="wkb-hypotheses-query">
                            Query sent to the LLM
                        </label>
                        <textarea
                            id="wkb-hypotheses-query"
                            class="wkb-hypotheses-textarea"
                            rows="5"
                            :value="draftRun.queryText || ''"
                            placeholder="Question for ranking gene → mechanism → trait connections"
                            :disabled="loading || !draftRun"
                            @input="onQueryInput"
                        />

                        <label class="wkb-hypotheses-label" for="wkb-hypotheses-context">
                            Additional intent / context
                        </label>
                        <textarea
                            id="wkb-hypotheses-context"
                            class="wkb-hypotheses-textarea"
                            rows="3"
                            :value="draftRun ? draftRun.additionalContext : ''"
                            placeholder="Optional context or intent to add to the prompt"
                            :disabled="loading || !draftRun"
                            @input="onContextInput"
                        />

                        <fieldset class="wkb-hypotheses-novelty" :disabled="loading">
                            <legend class="wkb-hypotheses-novelty-legend">Novelty filter</legend>
                            <p class="wkb-hypotheses-novelty-intro">
                                Each node on your graph can carry a novelty label (see the
                                Graph data table). Use this filter to prefer pathways built
                                from more established versus more exploratory nodes. Ranking
                                still prioritizes mechanistic coherence — novelty is a loose
                                filter, not the main criterion.
                            </p>
                            <div class="wkb-hypotheses-novelty-options">
                                <label class="wkb-hypotheses-novelty-option">
                                    <input
                                        type="checkbox"
                                        :checked="noveltyKnown"
                                        @change="onNoveltyKnownChange"
                                    />
                                    <span class="wkb-hypotheses-novelty-option-text">
                                        <strong>Known</strong>
                                        <span class="wkb-hypotheses-novelty-option-desc">
                                            Prefer pathways whose nodes are judged
                                            well-supported or already mapped in the literature
                                            for your session context.
                                        </span>
                                    </span>
                                </label>
                                <label class="wkb-hypotheses-novelty-option">
                                    <input
                                        type="checkbox"
                                        :checked="noveltyNovel"
                                        @change="onNoveltyNovelChange"
                                    />
                                    <span class="wkb-hypotheses-novelty-option-text">
                                        <strong>Novel</strong>
                                        <span class="wkb-hypotheses-novelty-option-desc">
                                            Prefer pathways with less-established or more
                                            speculative connections that may be impactful but
                                            are not yet widely documented.
                                        </span>
                                    </span>
                                </label>
                            </div>
                            <p class="wkb-hypotheses-novelty-note">
                                Leave both unchecked to include any novelty label. Nodes marked
                                NYA (not yet assessed) are included unless you restrict to Known
                                or Novel only.
                            </p>
                        </fieldset>

                        <details v-if="draftRun?.promptPreview" class="wkb-hypotheses-prompt">
                            <summary>See prompt preview</summary>
                            <pre class="wkb-hypotheses-prompt-pre">{{ draftRun.promptPreview }}</pre>
                        </details>
                    </section>

                    <div v-if="draftRun?.status === 'error'" class="wkb-hypotheses-error" role="alert">
                        {{ draftRun.error || "Could not rank connections." }}
                    </div>
                </template>
            </div>

            <div
                v-if="selectedNodeCount && (draftRun || resultRun) && !loading"
                class="wkb-hypotheses-actions"
            >
                <button
                    v-if="resultRun && !draftRun"
                    type="button"
                    class="wkb-hypotheses-btn wkb-hypotheses-btn-secondary"
                    @click="$emit('new-run')"
                >
                    Find connections again
                </button>
                <button
                    v-if="draftRun"
                    type="button"
                    class="wkb-hypotheses-btn wkb-hypotheses-btn-primary"
                    :disabled="!canRun"
                    @click="$emit('run')"
                >
                    Find connections
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import WorkspaceSigChainRunCard from "./WorkspaceSigChainRunCard.vue";

export default {
    name: "WorkspaceBuildHypothesesModal",
    components: {
        WorkspaceSigChainRunCard,
    },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        draftRun: {
            type: Object,
            default: null,
        },
        resultRun: {
            type: Object,
            default: null,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        llmAvailable: {
            type: Boolean,
            default: false,
        },
        selectedNodeCount: {
            type: Number,
            default: 0,
        },
        selectedNodeIds: {
            type: Array,
            default: () => [],
        },
        anchorItems: {
            type: Array,
            default: () => [],
        },
        sessionContext: {
            type: String,
            default: "",
        },
        apiClient: {
            type: Object,
            default: null,
        },
    },
    computed: {
        canRun() {
            if (this.loading || !this.llmAvailable || !this.draftRun) {
                return false;
            }
            const query = String(this.draftRun.queryText || "").trim();
            const context = String(this.draftRun.additionalContext || "").trim();
            return Boolean(query || context);
        },
        noveltyKnown() {
            return this.draftRun?.noveltyFilter === "known";
        },
        noveltyNovel() {
            return this.draftRun?.noveltyFilter === "novel";
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onBackdropClick() {
            if (!this.loading) {
                this.$emit("close");
            }
        },
        onKeyDown(event) {
            if (this.open && !this.loading && event.key === "Escape") {
                this.$emit("close");
            }
        },
        onQueryInput(event) {
            this.$emit("update-draft", { queryText: event.target.value });
        },
        onContextInput(event) {
            this.$emit("update-draft", { additionalContext: event.target.value });
        },
        onNoveltyKnownChange(event) {
            this.$emit("update-draft", {
                noveltyFilter: this.resolveNoveltyFilter(event.target.checked, this.noveltyNovel),
            });
        },
        onNoveltyNovelChange(event) {
            this.$emit("update-draft", {
                noveltyFilter: this.resolveNoveltyFilter(this.noveltyKnown, event.target.checked),
            });
        },
        resolveNoveltyFilter(known, novel) {
            if (known && !novel) {
                return "known";
            }
            if (novel && !known) {
                return "novel";
            }
            return "any";
        },
    },
};
</script>

<style scoped>
.wkb-hypotheses-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(24, 26, 32, 0.45);
}

.wkb-hypotheses-modal {
    display: flex;
    flex-direction: column;
    width: min(760px, 100%);
    max-height: min(90vh, 920px);
    overflow: hidden;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-hypotheses-head {
    flex-shrink: 0;
    padding: 20px 26px 14px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-hypotheses-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.wkb-hypotheses-head-row h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-hypotheses-close {
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
}

.wkb-hypotheses-close:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-hypotheses-intro {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-hypotheses-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 18px 26px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.wkb-hypotheses-empty,
.wkb-hypotheses-helper {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-hypotheses-helper {
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-hypotheses-llm-note {
    margin: 0;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #ead9c8;
    background: #fff9f3;
    font-size: 13px;
    line-height: 1.45;
}

.wkb-hypotheses-loading {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
    font-size: 13px;
}

.wkb-hypotheses-loading p {
    margin: 4px 0 0;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-hypotheses-spinner {
    width: 22px;
    height: 22px;
    border: 2px solid #ddd;
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    animation: wkb-hypotheses-spin 0.8s linear infinite;
}

@keyframes wkb-hypotheses-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-hypotheses-form {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.wkb-hypotheses-label {
    margin-top: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-hypotheses-textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
    font-family: inherit;
    resize: vertical;
}

.wkb-hypotheses-novelty {
    margin: 10px 0 0;
    padding: 0;
    border: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.wkb-hypotheses-novelty-legend {
    width: 100%;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-hypotheses-novelty-intro {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-hypotheses-novelty-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-hypotheses-novelty-option {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
}

.wkb-hypotheses-novelty-option-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.4;
}

.wkb-hypotheses-novelty-option-desc {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-hypotheses-novelty-note {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-hypotheses-prompt-pre {
    margin: 8px 0 0;
    padding: 10px;
    border-radius: 6px;
    background: #faf9f7;
    font-size: 11px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow: auto;
    max-height: 200px;
}

.wkb-hypotheses-error {
    padding: 10px 12px;
    border-radius: 8px;
    background: #fff0f0;
    color: #8b2e2e;
    font-size: 13px;
}

.wkb-hypotheses-actions {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 0 26px 20px;
}

.wkb-hypotheses-btn {
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
}

.wkb-hypotheses-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-hypotheses-btn-primary {
    background: var(--cfde-orange, #e07b39);
    border-color: var(--cfde-orange, #e07b39);
    color: #ffffff;
}

.wkb-hypotheses-btn-secondary {
    background: #fff;
    border-color: var(--cfde-border, #e6e1d6);
    color: var(--cfde-ink, #33363d);
}
</style>
