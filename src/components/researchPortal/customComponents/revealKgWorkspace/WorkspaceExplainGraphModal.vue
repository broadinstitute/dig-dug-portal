<template>
    <div
        v-if="open"
        class="wkb-explain-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-explain-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-explain-title"
            @click.stop
        >
            <header class="wkb-explain-head">
                <div class="wkb-explain-head-row">
                    <h2 id="wkb-explain-title">{{ isViewMode ? "Graph explanation" : "Explain graph" }}</h2>
                    <button
                        type="button"
                        class="wkb-explain-close"
                        aria-label="Close"
                        :disabled="loading"
                        @click="$emit('close')"
                    >
                        &times;
                    </button>
                </div>
                <p v-if="!isViewMode" class="wkb-explain-intro">
                    Generate an LLM summary of the current graph. Edit the question and context
                    before running.
                </p>
            </header>

            <div class="wkb-explain-body">
            <fieldset v-if="!isViewMode" class="wkb-explain-scope" :disabled="loading">
                <legend class="wkb-explain-scope-legend">Explain scope</legend>
                <label class="wkb-explain-scope-option">
                    <input
                        type="radio"
                        name="wkb-explain-scope"
                        :value="scopeKeyNodes"
                        :checked="scope === scopeKeyNodes"
                        @change="$emit('update:scope', scopeKeyNodes)"
                    />
                    <span class="wkb-explain-scope-copy">
                        <strong>Selected nodes only</strong>
                        <span class="wkb-explain-scope-meta">
                            {{ keyNodeCount }} selected node{{ keyNodeCount === 1 ? "" : "s" }} on
                            canvas
                        </span>
                    </span>
                </label>
                <label class="wkb-explain-scope-option">
                    <input
                        type="radio"
                        name="wkb-explain-scope"
                        :value="scopeEntireGraph"
                        :checked="scope === scopeEntireGraph"
                        @change="$emit('update:scope', scopeEntireGraph)"
                    />
                    <span class="wkb-explain-scope-copy">
                        <strong>All visible nodes</strong>
                        <span class="wkb-explain-scope-meta">
                            {{ nodeCount }} node{{ nodeCount === 1 ? "" : "s" }},
                            {{ edgeCount }} edge{{ edgeCount === 1 ? "" : "s" }}
                            <template v-if="contextualEdgeCount">
                                (+ {{ contextualEdgeCount }} contextual)
                            </template>
                        </span>
                    </span>
                </label>
            </fieldset>

            <p v-if="!isViewMode && helperText" class="wkb-explain-helper">{{ helperText }}</p>

            <p v-if="!isViewMode && !llmAvailable" class="wkb-explain-llm-note" role="note">
                LLM explanation is not available — the interactive API did not report an LLM
                backend.
            </p>

            <div v-if="loading" class="wkb-explain-loading" role="status">
                <span class="wkb-explain-spinner" aria-hidden="true" />
                <div>
                    <strong>Generating explanation…</strong>
                    <p>This may take a moment.</p>
                </div>
            </div>

            <div v-else-if="entry && entry.status === 'success' && entry.interpretation" class="wkb-explain-result">
                <div class="wkb-explain-result-head">
                    <span class="wkb-explain-result-label">Explanation</span>
                    <span v-if="entry.timestamp_label" class="wkb-explain-result-meta">
                        {{ entry.timestamp_label }}
                    </span>
                </div>
                <WorkspaceMarkdownBlock :text="displayInterpretation" />
                <details v-if="entry.prompt_preview" class="wkb-explain-prompt">
                    <summary>See prompt</summary>
                    <pre class="wkb-explain-prompt-pre">{{ entry.prompt_preview }}</pre>
                </details>
            </div>

            <section
                v-if="showKeyNodeSuggestions"
                class="wkb-explain-suggestions"
                aria-label="Suggested selected nodes"
            >
                <div class="wkb-explain-suggestions-head">
                    <h3 class="wkb-explain-suggestions-title">Suggested selected nodes</h3>
                    <button
                        v-if="addableSuggestionCount"
                        type="button"
                        class="wkb-explain-btn wkb-explain-btn-primary wkb-explain-suggestions-batch"
                        @click="$emit('add-all-suggested-key-nodes')"
                    >
                        Add all ({{ addableSuggestionCount }})
                    </button>
                </div>
                <p class="wkb-explain-suggestions-intro">
                    From the LLM explanation — add nodes to your selected set for hypothesis work.
                </p>
                <ul class="wkb-explain-suggestions-list">
                    <li
                        v-for="item in keyNodeSuggestions"
                        :key="item.node_id"
                        class="wkb-explain-suggestion-item"
                        :class="{ 'is-key-node': item.is_key_node }"
                    >
                        <div class="wkb-explain-suggestion-main">
                            <span class="wkb-explain-suggestion-label">{{ item.label }}</span>
                            <span v-if="item.node_type" class="wkb-explain-suggestion-type">
                                {{ item.node_type }}
                            </span>
                            <span v-if="item.is_key_node" class="wkb-explain-suggestion-badge">
                                Selected node
                            </span>
                        </div>
                        <p v-if="item.rationale" class="wkb-explain-suggestion-rationale">
                            {{ item.rationale }}
                        </p>
                        <button
                            type="button"
                            class="wkb-explain-suggestion-add"
                            :disabled="item.is_key_node"
                            @click="$emit('add-suggested-key-node', item.node_id)"
                        >
                            {{ item.is_key_node ? "Already a selected node" : "Add as selected node" }}
                        </button>
                    </li>
                </ul>
            </section>

            <div v-else-if="entry && entry.status === 'error'" class="wkb-explain-error" role="alert">
                {{ entry.error || "Explanation failed." }}
            </div>

            <div v-if="!loading && (!entry || entry.status !== 'success')" class="wkb-explain-form">
                <label class="wkb-explain-label" for="wkb-explain-query">
                    Query sent to the LLM
                </label>
                <textarea
                    id="wkb-explain-query"
                    class="wkb-explain-textarea"
                    rows="5"
                    :value="entry ? entry.query_text : ''"
                    placeholder="Question to ask the LLM"
                    :disabled="loading || !entry"
                    @input="onQueryInput"
                />

                <label class="wkb-explain-label" for="wkb-explain-context">
                    Additional intent / context
                </label>
                <textarea
                    id="wkb-explain-context"
                    class="wkb-explain-textarea"
                    rows="3"
                    :value="entry ? entry.additional_context : ''"
                    placeholder="Optional context or intent to add to the prompt"
                    :disabled="loading || !entry"
                    @input="onContextInput"
                />
            </div>

            <div v-if="!isViewMode && !loading" class="wkb-explain-actions">
                <button
                    type="button"
                    class="wkb-explain-btn wkb-explain-btn-primary"
                    :disabled="!canRun"
                    @click="$emit('run')"
                >
                    Run LLM
                </button>
            </div>
            </div>
        </div>
    </div>
</template>

<script>
import {
    EXPLAIN_SCOPE,
    enrichSuggestedKeyNodes,
    interpretationMarkdownForDisplay,
    parseSuggestedKeyNodesFromInterpretation,
} from "./revealKgExplainUtils.js";
import WorkspaceMarkdownBlock from "./WorkspaceMarkdownBlock.vue";

export default {
    name: "WorkspaceExplainGraphModal",
    components: {
        WorkspaceMarkdownBlock,
    },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        entry: {
            type: Object,
            default: null,
        },
        scope: {
            type: String,
            default: EXPLAIN_SCOPE.KEY_NODES,
        },
        helperText: {
            type: String,
            default: "",
        },
        loading: {
            type: Boolean,
            default: false,
        },
        llmAvailable: {
            type: Boolean,
            default: false,
        },
        keyNodeCount: {
            type: Number,
            default: 0,
        },
        nodeCount: {
            type: Number,
            default: 0,
        },
        edgeCount: {
            type: Number,
            default: 0,
        },
        contextualEdgeCount: {
            type: Number,
            default: 0,
        },
        keyNodeIds: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            scopeKeyNodes: EXPLAIN_SCOPE.KEY_NODES,
            scopeEntireGraph: EXPLAIN_SCOPE.ENTIRE_GRAPH,
        };
    },
    computed: {
        isViewMode() {
            return Boolean(
                this.entry?.status === "success" && this.entry?.interpretation
            );
        },
        displayInterpretation() {
            if (!this.entry?.interpretation) {
                return "";
            }
            return (
                this.entry.interpretation_display ||
                interpretationMarkdownForDisplay(this.entry.interpretation)
            );
        },
        showKeyNodeSuggestions() {
            return (
                this.isViewMode &&
                this.entry?.scope === this.scopeEntireGraph &&
                this.keyNodeSuggestions.length > 0
            );
        },
        keyNodeSuggestions() {
            const stored = this.entry?.suggested_key_nodes || [];
            const suggestions =
                stored.length || this.entry?.scope !== this.scopeEntireGraph
                    ? stored
                    : parseSuggestedKeyNodesFromInterpretation(
                          this.entry?.interpretation,
                          this.entry?.graph_nodes || []
                      );
            return enrichSuggestedKeyNodes(suggestions, this.keyNodeIds);
        },
        addableSuggestionCount() {
            return this.keyNodeSuggestions.filter((item) => !item.is_key_node).length;
        },
        canRun() {
            if (this.loading || !this.llmAvailable || !this.entry) {
                return false;
            }
            const query = String(this.entry.query_text || "").trim();
            const context = String(this.entry.additional_context || "").trim();
            if (this.scope === EXPLAIN_SCOPE.KEY_NODES && this.keyNodeCount < 1) {
                return false;
            }
            if (this.scope === EXPLAIN_SCOPE.ENTIRE_GRAPH && this.nodeCount < 1) {
                return false;
            }
            return Boolean(query || context);
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
            if (!this.open || this.loading) {
                return;
            }
            if (event.key === "Escape") {
                this.$emit("close");
            }
        },
        onQueryInput(event) {
            if (!this.entry) {
                return;
            }
            this.$emit("update-entry", { query_text: event.target.value });
        },
        onContextInput(event) {
            if (!this.entry) {
                return;
            }
            this.$emit("update-entry", { additional_context: event.target.value });
        },
    },
};
</script>

<style scoped>
.wkb-explain-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(24, 26, 32, 0.45);
}

.wkb-explain-modal {
    display: flex;
    flex-direction: column;
    width: min(680px, 100%);
    max-height: min(88vh, 900px);
    overflow: hidden;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-explain-head {
    flex-shrink: 0;
    padding: 20px 26px 14px;
    background: #ffffff;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-explain-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 18px 26px 22px;
}

.wkb-explain-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.wkb-explain-head-row h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-explain-close {
    flex-shrink: 0;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
}

.wkb-explain-close:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-explain-intro {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-explain-scope {
    margin: 0 0 14px;
    padding: 0;
    border: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.wkb-explain-scope-legend {
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-explain-scope-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
    cursor: pointer;
    font-size: 13px;
}

.wkb-explain-scope-option input {
    margin-top: 3px;
}

.wkb-explain-scope-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.wkb-explain-scope-meta {
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
}

.wkb-explain-helper {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-explain-llm-note {
    margin: 0 0 14px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #ead9c8;
    background: #fff9f3;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-explain-loading {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding: 14px;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
    font-size: 13px;
}

.wkb-explain-loading p {
    margin: 4px 0 0;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-explain-spinner {
    width: 22px;
    height: 22px;
    border: 2px solid #ddd;
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    animation: wkb-explain-spin 0.8s linear infinite;
    flex-shrink: 0;
}

@keyframes wkb-explain-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-explain-result {
    margin-bottom: 16px;
    padding: 14px;
    border-radius: 8px;
    background: #faf9f7;
}

.wkb-explain-result-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
}

.wkb-explain-result-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-explain-result-meta {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-explain-prompt {
    margin-top: 12px;
    font-size: 13px;
}

.wkb-explain-prompt-pre {
    margin: 8px 0 0;
    padding: 10px;
    border-radius: 6px;
    background: #ffffff;
    font-size: 12px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow: auto;
    max-height: 200px;
}

.wkb-explain-error {
    margin-bottom: 16px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #fff0f0;
    color: #8b2e2e;
    font-size: 13px;
    line-height: 1.45;
}

.wkb-explain-form {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
}

.wkb-explain-label {
    display: block;
    margin-top: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-explain-textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
    font-family: inherit;
    color: var(--cfde-ink, #33363d);
    resize: vertical;
}

.wkb-explain-actions {
    display: flex;
    justify-content: flex-end;
}

.wkb-explain-btn {
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
}

.wkb-explain-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-explain-btn-primary {
    background: var(--cfde-orange, #e07b39);
    border-color: var(--cfde-orange, #e07b39);
    color: #ffffff;
}

.wkb-explain-suggestions {
    margin-top: 4px;
}

.wkb-explain-suggestions-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
}

.wkb-explain-suggestions-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-explain-suggestions-intro {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-explain-suggestions-batch {
    flex-shrink: 0;
    padding: 6px 12px;
    font-size: 13px;
}

.wkb-explain-suggestions-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.wkb-explain-suggestion-item {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
    font-size: 13px;
    line-height: 1.45;
}

.wkb-explain-suggestion-item.is-key-node {
    opacity: 0.62;
}

.wkb-explain-suggestion-main {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
}

.wkb-explain-suggestion-label {
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-explain-suggestion-type {
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
}

.wkb-explain-suggestion-badge {
    padding: 1px 8px;
    border-radius: 999px;
    background: #e8f0fa;
    color: var(--cfde-blue, #2c5c97);
    font-size: 13px;
    font-weight: 600;
}

.wkb-explain-suggestion-rationale {
    margin: 0 0 8px;
    color: var(--cfde-ink, #33363d);
}

.wkb-explain-suggestion-add {
    padding: 0;
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
}

.wkb-explain-suggestion-add:disabled {
    opacity: 0.75;
    cursor: default;
    text-decoration: none;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
