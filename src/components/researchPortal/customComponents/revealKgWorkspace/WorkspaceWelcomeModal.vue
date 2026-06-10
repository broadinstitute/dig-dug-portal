<template>
    <div
        v-if="open"
        class="wkb-welcome-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-welcome-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-welcome-title"
            @click.stop
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
                        <span class="wkb-welcome-option-desc">
                            Search and select starting genes, gene sets, mechanisms, and
                            traits. Use conceptual search when you have a topic but not a
                            specific entity.
                        </span>
                        <button
                            type="button"
                            class="wkb-welcome-action wkb-welcome-action-primary"
                            @click="$emit('create')"
                        >
                            Create
                        </button>
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
                class="wkb-welcome-panel wkb-welcome-learn"
            >
                <section class="wkb-welcome-learn-section">
                    <h3 class="wkb-welcome-learn-title">Starting a graph</h3>
                    <p class="wkb-welcome-learn-lead">
                        New sessions begin with a small set of starting nodes—not a large
                        auto-built neighborhood.
                    </p>
                    <ul class="wkb-welcome-learn-list">
                        <li>
                            <strong>Search &amp; select</strong>
                            <p>
                                From <em>Manage → New graph</em>, search genes, gene sets,
                                mechanisms, and traits in four columns. Use catalog typeahead
                                for exact names, or <em>By conceptual search</em> when you
                                have a topic (for example “insulin resistance”) but not a
                                specific entity. Pick one or two entities to start, add
                                optional context, then click <em>Build a KG</em>.
                            </p>
                        </li>
                        <li>
                            <strong>Neighboring nodes (optional)</strong>
                            <p>
                                By default, the initial build adds only your starting
                                entities and the links that connect them directly. Check
                                <em>Add neighboring nodes</em> if you want REVEAL to fetch
                                extra neighbors in the first pass. Most sessions grow the
                                graph gradually with <em>Expand KG</em> instead.
                            </p>
                        </li>
                        <li>
                            <strong>Load or import</strong>
                            <p>
                                <em>My library → Open on canvas</em> restores a browser-saved
                                layout. <em>Manage → Import graph</em> restores a full
                                workflow file (including inspector caches and analysis runs).
                            </p>
                        </li>
                    </ul>
                    <p class="wkb-welcome-learn-more">
                        For the full guide (menus, toolbar, filters, and analysis), open
                        <strong>Help → Documentation</strong>.
                    </p>
                </section>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceWelcomeModal",
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

.wkb-welcome-learn {
    padding-top: 4px;
}

.wkb-welcome-learn-section {
    margin: 0;
}

.wkb-welcome-learn-title {
    margin: 0 0 8px;
    font-size: 1rem;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-welcome-learn-lead {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-ink, #33363d);
}

.wkb-welcome-learn-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.wkb-welcome-learn-list li strong {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
}

.wkb-welcome-learn-list li p {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-welcome-learn-more {
    margin: 16px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
