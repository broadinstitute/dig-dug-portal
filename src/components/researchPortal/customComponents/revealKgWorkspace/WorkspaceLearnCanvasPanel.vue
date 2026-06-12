<template>
    <section
        class="wkb-learn-panel"
        :class="[
            `wkb-learn-panel--${variant}`,
            { 'wkb-learn-panel--standalone': standalone && variant === 'companion' },
        ]"
        :aria-labelledby="titleId"
    >
        <header v-if="variant === 'companion'" class="wkb-learn-head">
            <h2 :id="titleId" class="wkb-learn-title">Learn Canvas</h2>
            <p v-if="visitLabel" class="wkb-learn-visit">{{ visitLabel }}</p>
            <p class="wkb-learn-lead">
                Core ideas for using the graph and the <strong>AI assistant</strong>.
            </p>
        </header>

        <template v-if="variant === 'companion'">
            <ul class="wkb-learn-list">
                <li>
                    <strong>Build step by step</strong>
                    <p>
                        Start with a few genes, traits, or mechanisms. Grow the graph with
                        <em>Expand KG</em> instead of loading everything at once.
                    </p>
                </li>
                <li>
                    <strong>Selection matters</strong>
                    <p>
                        <em>Selected nodes</em> (blue) are what most assistant commands use.
                        “All visible nodes” means everything currently shown on the canvas.
                    </p>
                </li>
                <li>
                    <strong>Key actions</strong>
                    <p>
                        <em>Expand</em> adds neighbors · <em>Add</em> adds one entity ·
                        <em>Filter</em> hides nodes · <em>Select</em> marks nodes ·
                        <em>Explain</em> summarizes what you see.
                    </p>
                </li>
                <li>
                    <strong>AI assistant</strong>
                    <p>
                        Click the <strong class="wkb-learn-emphasis">AI</strong> button on the
                        toolbar and describe changes in plain language. Suggestions appear as you
                        type — use
                        <kbd class="wkb-learn-kbd">↑</kbd><kbd class="wkb-learn-kbd">↓</kbd>,
                        <kbd class="wkb-learn-kbd">Tab</kbd>, or
                        <kbd class="wkb-learn-kbd">Enter</kbd>
                        to accept.
                    </p>
                </li>
            </ul>
            <div class="wkb-learn-examples">
                <p class="wkb-learn-examples-title">Try asking:</p>
                <ul>
                    <li>Explain selected nodes</li>
                    <li>Select top 5 genes connected to Type 2 diabetes</li>
                    <li>Filter genes related to insulin resistance</li>
                </ul>
            </div>
            <p class="wkb-learn-more">
                For menus, filters, and analysis details, open
                <strong>Help → Documentation</strong>. You can reopen this guide anytime from
                <strong>Help → Learn Canvas</strong>.
            </p>
        </template>

        <template v-else>
            <h3 class="wkb-learn-section-title">Starting a graph</h3>
            <p class="wkb-learn-lead">
                New sessions begin with a small set of starting nodes—not a large auto-built
                neighborhood.
            </p>
            <ul class="wkb-learn-list">
                <li>
                    <strong>Search &amp; select</strong>
                    <p>
                        From <em>Manage → New graph</em>, search genes, gene sets, mechanisms,
                        and traits in four columns. Use catalog typeahead for exact names, or
                        <em>By conceptual search</em> when you have a topic (for example
                        “insulin resistance”) but not a specific entity. Pick one or two
                        entities to start, add optional context, then click
                        <em>Build a KG</em>.
                    </p>
                </li>
                <li>
                    <strong>Neighboring nodes (optional)</strong>
                    <p>
                        By default, the initial build adds only your starting entities and the
                        links that connect them directly. Check <em>Add neighboring nodes</em> if
                        you want REVEAL to fetch extra neighbors in the first pass. Most
                        sessions grow the graph gradually with <em>Expand KG</em> instead.
                    </p>
                </li>
                <li>
                    <strong>Load or import</strong>
                    <p>
                        <em>My library → Open on canvas</em> restores a browser-saved layout.
                        <em>Manage → Import graph</em> restores a full workflow file (including
                        inspector caches and analysis runs).
                    </p>
                </li>
                <li>
                    <strong>AI assistant</strong>
                    <p>
                        After you have a graph, use the toolbar <strong>AI</strong> button to
                        describe changes in plain language. Selected nodes (blue) are the usual
                        target. See the companion guide on your first few visits for examples.
                    </p>
                </li>
            </ul>
            <p class="wkb-learn-more">
                For the full guide (menus, toolbar, filters, and analysis), open
                <strong>Help → Documentation</strong>.
            </p>
        </template>
    </section>
</template>

<script>
export default {
    name: "WorkspaceLearnCanvasPanel",
    props: {
        variant: {
            type: String,
            default: "tab",
            validator(value) {
                return value === "tab" || value === "companion";
            },
        },
        canvasOpenCount: {
            type: Number,
            default: 0,
        },
        learnCompanionMaxOpens: {
            type: Number,
            default: 5,
        },
        standalone: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        titleId() {
            return this.variant === "companion" ? "wkb-learn-companion-title" : "wkb-learn-tab-title";
        },
        visitLabel() {
            if (!this.canvasOpenCount || this.canvasOpenCount > this.learnCompanionMaxOpens) {
                return "";
            }
            return `Visit ${this.canvasOpenCount} of ${this.learnCompanionMaxOpens}`;
        },
    },
};
</script>

<style scoped>
.wkb-learn-panel {
    color: var(--cfde-ink, #33363d);
}

.wkb-learn-panel--companion {
    width: min(380px, 100%);
    max-height: min(90vh, 720px);
    display: flex;
    flex-direction: column;
    padding: 22px 24px 24px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
    overflow-y: auto;
}

.wkb-learn-panel--companion.wkb-learn-panel--standalone {
    width: min(520px, 100%);
}

.wkb-learn-panel--tab {
    padding-top: 4px;
}

.wkb-learn-head {
    margin-bottom: 12px;
}

.wkb-learn-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-learn-visit {
    margin: 6px 0 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-orange, #e07b39);
}

.wkb-learn-section-title {
    margin: 0 0 8px;
    font-size: 1rem;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-learn-lead {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-ink, #33363d);
}

.wkb-learn-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.wkb-learn-list > li > strong {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
}

.wkb-learn-list li p {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-learn-emphasis {
    display: inline;
    color: var(--cfde-ink, #33363d);
}

.wkb-learn-kbd {
    display: inline-block;
    margin: 0 1px;
    padding: 1px 5px;
    border: 1px solid #c8c2b8;
    border-radius: 4px;
    background: #eceae6;
    color: var(--cfde-ink, #33363d);
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
}

.wkb-learn-examples {
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
}

.wkb-learn-examples-title {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-learn-examples ul {
    margin: 0;
    padding-left: 18px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.wkb-learn-more {
    margin: 16px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
