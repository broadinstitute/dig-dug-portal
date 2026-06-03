<template>
    <div
        v-if="open"
        class="wkb-initial-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-initial-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-initial-title"
            @click.stop
        >
            <button
                type="button"
                class="wkb-initial-close"
                aria-label="Close"
                @click="$emit('close')"
            >
                &times;
            </button>

            <header class="wkb-initial-head">
                <h2 id="wkb-initial-title">{{ modalTitle }}</h2>
                <p>{{ modalDescription }}</p>
            </header>

            <div class="wkb-initial-tabrow">
                <div class="wkb-initial-tabs" role="tablist" aria-label="How to add starting entities">
                    <button
                        type="button"
                        role="tab"
                        :aria-selected="buildMode === 'search'"
                        :class="['wkb-initial-tab', buildMode === 'search' && 'is-active']"
                        @click="buildMode = 'search'"
                    >
                        Search &amp; select
                    </button>
                    <button
                        type="button"
                        role="tab"
                        :aria-selected="buildMode === 'ai'"
                        :class="['wkb-initial-tab', buildMode === 'ai' && 'is-active']"
                        @click="buildMode = 'ai'"
                    >
                        AI assisted
                    </button>
                </div>
            </div>

            <div class="wkb-initial-body">
                <div
                    v-show="buildMode === 'search'"
                    role="tabpanel"
                    class="wkb-initial-panel"
                >
                    <div class="wkb-initial-columns">
                        <WorkspaceEntityColumn
                            v-for="column in starterColumns"
                            :key="column.columnKey"
                            :column-key="column.columnKey"
                            :entity-type="column.entityType"
                            :title="column.title"
                            :items="buckets[column.entityType]"
                            :api-client="apiClient"
                            :llm-available="llmAvailable"
                            @add="onAdd(column.entityType, $event)"
                            @remove="onRemove(column.entityType, $event)"
                            @error="onColumnError"
                        />
                    </div>
                    <div class="wkb-initial-context">
                        <label for="wkb-initial-context-textarea">
                            Any other context we should know about? (optional)
                        </label>
                        <textarea
                            id="wkb-initial-context-textarea"
                            :value="context"
                            rows="4"
                            placeholder="Specifying additional context will help us retrieve and explain the data that we show."
                            @input="$emit('update:context', $event.target.value)"
                        />
                    </div>
                    <div class="wkb-initial-neighbor-wrap">
                        <label class="wkb-initial-neighbor-option">
                            <input
                                type="checkbox"
                                :checked="addNeighboringNodes"
                                @change="$emit('update:addNeighboringNodes', $event.target.checked)"
                            />
                            <span>
                                Add neighboring nodes (otherwise only directly connecting nodes will be added)
                            </span>
                        </label>
                    </div>
                    <p v-if="columnError" class="wkb-initial-error">{{ columnError }}</p>
                </div>

                <div
                    v-show="buildMode === 'ai'"
                    role="tabpanel"
                    class="wkb-initial-panel wkb-initial-panel-ai"
                >
                    <p class="wkb-initial-ai-lead">
                        Describe your research interest and we will suggest starting
                        genes, traits, and mechanisms. This mode will be available in a
                        follow-up step.
                    </p>
                    <textarea
                        class="wkb-initial-ai-textarea"
                        rows="5"
                        disabled
                        placeholder="Example: genes involved in adipose tissue expansion and adverse metabolic outcomes."
                    />
                </div>
            </div>

            <footer class="wkb-initial-footer">
                <button
                    v-if="buildMode === 'search'"
                    type="button"
                    class="wkb-initial-reset"
                    @click="$emit('reset')"
                >
                    Reset
                </button>
                <button
                    type="button"
                    class="wkb-initial-build"
                    :disabled="buildMode === 'search' ? !starterCount : true"
                    @click="onContinue"
                >
                    Build a KG
                </button>
            </footer>
        </div>
    </div>
</template>

<script>
import WorkspaceEntityColumn from "./WorkspaceEntityColumn.vue";
import {
    mergeUniqueItems,
    normalizeStarterItem,
    STARTER_COLUMN_CONFIG,
    totalStarterCount,
} from "./revealKgEntityUtils.js";

export default {
    name: "WorkspaceInitialGraphModal",
    components: {
        WorkspaceEntityColumn,
    },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        buckets: {
            type: Object,
            required: true,
        },
        context: {
            type: String,
            default: "",
        },
        addNeighboringNodes: {
            type: Boolean,
            default: true,
        },
        apiClient: {
            type: Object,
            required: true,
        },
        llmAvailable: {
            type: Boolean,
            default: false,
        },
        duplicateSourceLabel: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            buildMode: "search",
            columnError: "",
        };
    },
    computed: {
        starterColumns() {
            return STARTER_COLUMN_CONFIG;
        },
        starterCount() {
            return totalStarterCount(this.buckets);
        },
        isDuplicateFlow() {
            return Boolean(String(this.duplicateSourceLabel || "").trim());
        },
        modalTitle() {
            return this.isDuplicateFlow ? "Duplicate graph" : "Build your initial graph";
        },
        modalDescription() {
            if (this.isDuplicateFlow) {
                const name = String(this.duplicateSourceLabel).trim();
                return (
                    `Starting nodes from “${name}” are pre-selected below. Add or remove ` +
                    "entities, then build a new graph on the canvas."
                );
            }
            return (
                "Choose starting genes, gene sets, mechanisms, and traits. REVEAL " +
                "will use them to place nodes and find connections on the canvas."
            );
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.buildMode = "search";
                this.columnError = "";
            }
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onBackdropClick(event) {
            if (event.target === event.currentTarget) {
                this.$emit("close");
            }
        },
        onKeyDown(event) {
            if (this.open && event.key === "Escape") {
                this.$emit("close");
            }
        },
        onAdd(entityType, item) {
            const normalized = normalizeStarterItem(entityType, item);
            if (!normalized) {
                return;
            }
            const next = {
                ...this.buckets,
                [entityType]: mergeUniqueItems(this.buckets[entityType], [normalized]),
            };
            this.$emit("update:buckets", next);
            this.columnError = "";
        },
        onRemove(entityType, nodeId) {
            const next = {
                ...this.buckets,
                [entityType]: (this.buckets[entityType] || []).filter(
                    (entry) => entry.node_id !== nodeId
                ),
            };
            this.$emit("update:buckets", next);
        },
        onColumnError(message) {
            this.columnError = message;
        },
        onContinue() {
            if (this.buildMode === "search" && !this.starterCount) {
                return;
            }
            if (this.buildMode === "ai") {
                return;
            }
            this.$emit("continue", {
                buckets: this.buckets,
                context: this.context,
                addNeighboringNodes: this.addNeighboringNodes,
            });
        },
    },
};
</script>

<style scoped>
.wkb-initial-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2300;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 32px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.wkb-initial-modal {
    position: relative;
    width: min(1080px, 100%);
    max-height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
    overflow: hidden;
}

.wkb-initial-close {
    position: absolute;
    top: 10px;
    right: 12px;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    z-index: 1;
}

.wkb-initial-head {
    padding: 20px 24px 12px;
    padding-right: 48px;
}

.wkb-initial-head h2 {
    margin: 0 0 6px;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-initial-head p {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-initial-tabrow {
    padding: 0 24px 14px;
}

.wkb-initial-tabs {
    display: flex;
    gap: 0;
    padding: 4px;
    border-radius: 10px;
    background: var(--cfde-bg, #f6f5f2);
}

.wkb-initial-tab {
    border: none;
    background: transparent;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
}

.wkb-initial-tab.is-active {
    background: #fff;
    color: var(--cfde-ink, #33363d);
    box-shadow: 0 1px 4px rgba(20, 22, 30, 0.08);
}

.wkb-initial-reset {
    border: none;
    background: var(--cfde-blue, #2c5c97);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 14px;
    border-radius: 6px;
    cursor: pointer;
}

.wkb-initial-reset:hover {
    filter: brightness(1.05);
}

.wkb-initial-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 24px 16px;
}

.wkb-initial-columns {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    margin: 30px 0;
}

.wkb-initial-columns > * {
    padding: 0 20px;
    min-width: 0;
}

.wkb-initial-columns > :first-child {
    padding-left: 0;
}

.wkb-initial-columns > :last-child {
    padding-right: 0;
}

.wkb-initial-columns > :not(:first-child) {
    border-left: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-initial-context label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-initial-context textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
    resize: vertical;
}

.wkb-initial-neighbor-wrap {
    margin-top: 30px;
    display: flex;
    justify-content: center;
}

.wkb-initial-neighbor-option {
    display: inline-flex;
    align-items: flex-start;
    gap: 10px;
    max-width: 560px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
    text-align: left;
}

.wkb-initial-neighbor-option input {
    margin-top: 3px;
    flex-shrink: 0;
}

.wkb-initial-error {
    margin: 12px 0 0;
    font-size: 13px;
    color: #c45c3a;
}

.wkb-initial-panel-ai {
    padding: 8px 0 16px;
}

.wkb-initial-ai-lead {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-initial-ai-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    opacity: 0.7;
}

.wkb-initial-footer {
    padding: 12px 24px 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
}

.wkb-initial-build {
    border: none;
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    padding: 10px 28px;
    border-radius: 8px;
    cursor: pointer;
}

.wkb-initial-build:hover:not(:disabled) {
    background: var(--cfde-orange-dark, #c2662b);
}

.wkb-initial-build:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

@media (max-width: 840px) {
    .wkb-initial-columns {
        grid-template-columns: 1fr;
        gap: 0;
    }

    .wkb-initial-columns > * {
        padding: 16px 0 0;
    }

    .wkb-initial-columns > :first-child {
        padding-top: 0;
    }

    .wkb-initial-columns > :not(:first-child) {
        border-left: none;
        border-top: 1px solid var(--cfde-border, #e6e1d6);
    }
}
</style>
