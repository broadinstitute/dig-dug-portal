<template>
    <div
        v-if="open"
        class="wkb-welcome-backdrop"
        :class="{ 'wkb-welcome-backdrop--companion': showLearnCompanion }"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-welcome-shell"
            :class="{ 'wkb-welcome-shell--companion': showLearnCompanion }"
            @click.stop
        >
            <div
                class="wkb-welcome-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wkb-welcome-title"
            >
                <button
                    v-if="dismissible"
                    type="button"
                    class="wkb-welcome-close"
                    aria-label="Close"
                    @click="$emit('close')"
                >
                    &times;
                </button>
                <header class="wkb-welcome-head">
                    <h2 id="wkb-welcome-title" class="wkb-welcome-title">
                        Welcome to
                        <span class="wkb-welcome-brand">
                            <span class="wkb-welcome-mark">REVEAL</span>
                            <span class="wkb-welcome-name">KG Canvas</span>
                        </span>
                    </h2>
                    <div class="wkb-welcome-tabs" role="tablist" aria-label="Welcome sections">
                        <button
                            id="wkb-welcome-tab-start"
                            type="button"
                            role="tab"
                            class="wkb-welcome-tab"
                            :class="{ 'is-active': activeTab === 'start' }"
                            :aria-selected="activeTab === 'start' ? 'true' : 'false'"
                            aria-controls="wkb-welcome-panel-start"
                            @click="activeTab = 'start'"
                        >
                            Start Canvas
                        </button>
                        <button
                            id="wkb-welcome-tab-learn"
                            type="button"
                            role="tab"
                            class="wkb-welcome-tab"
                            :class="{ 'is-active': activeTab === 'learn' }"
                            :aria-selected="activeTab === 'learn' ? 'true' : 'false'"
                            aria-controls="wkb-welcome-panel-learn"
                            @click="activeTab = 'learn'"
                        >
                            Learn Canvas
                        </button>
                    </div>
                </header>

                <div
                    v-show="activeTab === 'start'"
                    id="wkb-welcome-panel-start"
                    role="tabpanel"
                    aria-labelledby="wkb-welcome-tab-start"
                    class="wkb-welcome-panel"
                >
                    <p class="wkb-welcome-intro">
                        Start a new graph, open one from <strong>My library</strong>, or import
                        a graph file you exported earlier.
                    </p>
                    <div class="wkb-welcome-options">
                        <div class="wkb-welcome-option wkb-welcome-option-primary">
                            <span class="wkb-welcome-option-title">Create a new graph</span>

                            <div class="wkb-welcome-create-path">
                                <span class="wkb-welcome-create-path-desc">
                                    Find genes, gene sets, mechanisms, and traits one at a time
                                    and choose what to start with.
                                </span>
                                <button
                                    type="button"
                                    class="wkb-welcome-action wkb-welcome-action-primary"
                                    @click="$emit('create')"
                                >
                                    Search catalog
                                </button>
                            </div>

                            <div class="wkb-welcome-create-path">
                                <span class="wkb-welcome-create-path-desc">
                                    Tell the AI assistant what you want to explore; it finds
                                    relevant nodes and adds them to your graph.
                                </span>
                                <button
                                    type="button"
                                    class="wkb-welcome-action wkb-welcome-action-primary"
                                    @click="$emit('create-with-assistant')"
                                >
                                    Describe with AI
                                </button>
                            </div>
                        </div>

                        <div class="wkb-welcome-option">
                            <span class="wkb-welcome-option-title">Open from My library</span>
                            <span class="wkb-welcome-option-desc">
                                {{
                                    hasSavedGraphs
                                        ? "Open graphs saved in this browser (layout only, no inspector data)."
                                        : "No saved graphs in this browser yet. Open My library to restore a backup from another machine."
                                }}
                            </span>
                            <button
                                type="button"
                                class="wkb-welcome-action"
                                @click="$emit('load-library')"
                            >
                                Open My library
                            </button>
                        </div>

                        <div class="wkb-welcome-option">
                            <span class="wkb-welcome-option-title">Import graph</span>
                            <span class="wkb-welcome-option-desc">
                                Load a JSON workflow file exported from
                                <strong>Manage → Export graph</strong>, including inspector data.
                            </span>
                            <button
                                type="button"
                                class="wkb-welcome-action"
                                @click="$emit('import-graph')"
                            >
                                Import graph
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    v-show="activeTab === 'learn'"
                    id="wkb-welcome-panel-learn"
                    role="tabpanel"
                    aria-labelledby="wkb-welcome-tab-learn"
                    class="wkb-welcome-panel"
                >
                    <WorkspaceLearnCanvasPanel variant="tab" />
                </div>
            </div>

            <WorkspaceLearnCanvasPanel
                v-if="showLearnCompanion"
                variant="companion"
                :canvas-open-count="canvasOpenCount"
                :learn-companion-max-opens="learnCompanionMaxOpens"
            />
        </div>
    </div>
</template>

<script>
import WorkspaceLearnCanvasPanel from "./WorkspaceLearnCanvasPanel.vue";

export default {
    name: "WorkspaceWelcomeModal",
    components: {
        WorkspaceLearnCanvasPanel,
    },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        hasSavedGraphs: {
            type: Boolean,
            default: false,
        },
        initialTab: {
            type: String,
            default: "start",
            validator(value) {
                return value === "start" || value === "learn";
            },
        },
        dismissible: {
            type: Boolean,
            default: false,
        },
        showLearnCompanion: {
            type: Boolean,
            default: false,
        },
        canvasOpenCount: {
            type: Number,
            default: 0,
        },
        learnCompanionMaxOpens: {
            type: Number,
            default: 5,
        },
    },
    data() {
        return {
            activeTab: "start",
        };
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.activeTab = this.initialTab;
            }
        },
        initialTab(tab) {
            if (this.open) {
                this.activeTab = tab;
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
            if (event.target !== event.currentTarget || !this.dismissible) {
                return;
            }
            this.$emit("close");
        },
        onKeyDown(event) {
            if (this.open && event.key === "Escape") {
                if (this.dismissible) {
                    event.preventDefault();
                    this.$emit("close");
                } else {
                    event.preventDefault();
                }
            }
        },
    },
};
</script>

<style scoped>
.wkb-welcome-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.wkb-welcome-shell {
    display: flex;
    align-items: stretch;
    justify-content: center;
    max-width: 100%;
}

.wkb-welcome-shell--companion {
    gap: 16px;
    width: min(940px, 100%);
}

.wkb-welcome-modal {
    position: relative;
    width: min(520px, 100%);
    max-height: min(90vh, 720px);
    display: flex;
    flex-direction: column;
    padding: 24px 26px 26px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-welcome-shell--companion .wkb-welcome-modal {
    flex: 1 1 520px;
    min-width: 0;
}

.wkb-welcome-close {
    position: absolute;
    top: 10px;
    right: 12px;
    z-index: 1;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    padding: 4px 8px;
}

.wkb-welcome-head h2 {
    margin: 0 0 12px;
}

.wkb-welcome-title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35em;
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-welcome-brand {
    display: inline-flex;
    align-items: baseline;
    gap: 7px;
}

.wkb-welcome-mark {
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cfde-orange, #e07b39);
}

.wkb-welcome-name {
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-welcome-tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    border-radius: 8px;
    background: #f6f5f2;
}

.wkb-welcome-tab {
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

.wkb-welcome-tab.is-active {
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    box-shadow: 0 1px 3px rgba(20, 22, 30, 0.08);
}

.wkb-welcome-panel {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

.wkb-welcome-intro {
    margin: 0 0 16px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-welcome-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wkb-welcome-option {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    text-align: left;
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--cfde-bg, #f6f5f2);
}

.wkb-welcome-option-primary {
    background: var(--cfde-orange-soft, #fbeee3);
}

.wkb-welcome-action {
    margin-top: 4px;
    border: 1px solid var(--cfde-blue, #2c5c97);
    background: #fff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 13px;
    font-weight: 600;
    padding: 7px 16px;
    border-radius: 6px;
    cursor: pointer;
}

.wkb-welcome-create-path {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    width: 100%;
}

.wkb-welcome-create-path-desc {
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.wkb-welcome-action-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
}

.wkb-welcome-action-primary {
    border-color: var(--cfde-orange, #e07b39);
    background: var(--cfde-orange, #e07b39);
    color: #fff;
}

.wkb-welcome-action-primary:hover {
    background: var(--cfde-orange-dark, #c2662b);
}

.wkb-welcome-option-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-welcome-option-desc {
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

@media (max-width: 860px) {
    .wkb-welcome-shell--companion {
        flex-direction: column;
        align-items: stretch;
        width: min(520px, 100%);
    }
}
</style>
