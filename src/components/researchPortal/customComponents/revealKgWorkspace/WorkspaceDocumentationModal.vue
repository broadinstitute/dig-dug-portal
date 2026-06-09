<template>
    <div
        v-if="open"
        class="wkb-docs-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-docs-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-docs-modal-title"
            @click.stop
        >
            <button
                type="button"
                class="wkb-docs-close"
                aria-label="Close"
                @click="$emit('close')"
            >
                &times;
            </button>

            <header class="wkb-docs-head">
                <h2 id="wkb-docs-modal-title">REVEAL KG Canvas Documentation</h2>
                <p>
                    A short guide to the canvas: what each part is for, when to
                    use it, and how it fits into a typical session.
                </p>
            </header>

            <div class="wkb-docs-body">
                <section class="wkb-docs-section">
                    <h3>Canvas model</h3>
                    <p class="wkb-docs-lead">
                        REVEAL KG Canvas is a browser-based graph canvas where you
                        work on one graph over time—adding structure, interpreting it,
                        and saving checkpoints as you go.
                    </p>
                    <p>
                        Exploration stays open-ended: you are not forced through a
                        fixed pipeline. Use the canvas toolbar and element menus to
                        grow or narrow the graph, open the Inspector when you need
                        provenance, run Analyze when you want interpretation, and save
                        when the graph reaches a state worth returning to.
                    </p>
                </section>

                <section class="wkb-docs-section">
                    <h3>Top menus</h3>
                    <ul class="wkb-docs-feature-list">
                        <li>
                            <strong>Analyze</strong>
                            <p>
                                Use Analyze once the graph is in a useful shape and you
                                want interpretation rather than more structure.
                                <em>Explain graph</em> summarizes patterns with an LLM;
                                <em>Build hypotheses</em> ranks gene → mechanism → trait
                                pathways among your selected nodes; <em>Find related datasets</em>
                                searches CFDE gene sets linked to selected genes. Each run can
                                be reopened from numbered bubbles on the canvas while you keep
                                working.
                            </p>
                        </li>
                        <li>
                            <strong>Manage</strong>
                            <p>
                                Use Manage when you want a checkpoint or a portable copy.
                                New graph starts fresh; Save graph to library keeps the
                                layout in this browser; Export graph writes a file with
                                inspector data you can Import graph later; Download review
                                snapshot (when available) writes an HTML file for reading
                                outside the canvas.
                            </p>
                        </li>
                        <li>
                            <strong>My library</strong>
                            <p>
                                My library is where browser-saved graphs live when you are not
                                building from scratch. Open on canvas to continue a prior session,
                                duplicate it for a variant, remove what you no longer need, or
                                move collections between machines with Back up library and
                                Restore library backup. Open it from the top bar whenever you
                                want to browse saved work instead of continuing on the canvas.
                            </p>
                        </li>
                        <li>
                            <strong>Documentation</strong>
                            <p>
                                Opens this guide from the top bar at any time.
                            </p>
                        </li>
                    </ul>
                </section>

                <section class="wkb-docs-section">
                    <h3>Canvas toolbar</h3>
                    <p class="wkb-docs-lead">
                        Controls on the right side of the graph legend row act on the
                        current session.
                    </p>
                    <ul class="wkb-docs-feature-list">
                        <li>
                            <strong>Expand KG (+)</strong>
                            <p>
                                Opens the expand panel from your <em>selected nodes</em> (blue
                                fill). Use <em>Discover</em> to fetch ranked neighbors with optional
                                filters, or <em>Add nodes</em> to search for a specific node.
                                From a node’s pointer menu, <em>Expand graph from node</em> opens
                                the same panel scoped to that node only.
                            </p>
                        </li>
                        <li>
                            <strong>Visibility filters (funnel)</strong>
                            <p>
                                Opens the visibility filter panel. A numbered badge on
                                the icon shows how many saved filters are currently
                                enabled. See the Visibility filters section below.
                            </p>
                        </li>
                        <li>
                            <strong>Zoom</strong>
                            <p>
                                Drag the slider to zoom the tree layout in or out.
                            </p>
                        </li>
                        <li>
                            <strong>Graph data (table)</strong>
                            <p>
                                Opens a tabbed table of retrieved nodes from build and
                                expansion— including candidates not yet on the canvas.
                                Add or remove nodes from the graph directly from this
                                table. See Graph data table below.
                            </p>
                        </li>
                        <li>
                            <strong>View options (eye)</strong>
                            <p>
                                Toggle <em>Hide contextual edges</em> and
                                <em>Hide jumping edges</em>. These only affect display;
                                they do not remove links from the saved graph.
                            </p>
                        </li>
                    </ul>
                </section>

                <section class="wkb-docs-section">
                    <h3>Visibility filters</h3>
                    <p class="wkb-docs-lead">
                        Visibility filters annotate nodes on the graph and control what
                        stays visible— without deleting nodes from the session until you
                        choose to remove them.
                    </p>
                    <ul class="wkb-docs-feature-list">
                        <li>
                            <strong>Build a filter</strong>
                            <p>
                                Open the funnel icon and switch to <em>Create filters</em>.
                                Choose a filter type from the dropdown— <em>Intent</em>,
                                <em>Known / Novel</em>, or <em>Expression</em>— configure
                                that type, then click <em>Build filter</em>. Intent filters
                                can optionally use semantic similarity instead of LLM
                                relevance. You can build multiple filters over a session;
                                each becomes a saved layer.
                            </p>
                        </li>
                        <li>
                            <strong>Toggle filters on or off</strong>
                            <p>
                                On the <em>Filters</em> tab, each saved filter appears as a
                                numbered bubble. Click a bubble to enable or disable it
                                without rebuilding. All enabled filters apply together
                                (a node must pass every enabled layer to stay visible).
                            </p>
                        </li>
                        <li>
                            <strong>All nodes are filtered equally</strong>
                            <p>
                                Starting nodes, manually added nodes, and nodes returned
                                from build or expansion are treated the same. If a starting
                                node does not pass an enabled filter, it is hidden like any
                                other node.
                            </p>
                        </li>
                        <li>
                            <strong>Remove invisible nodes</strong>
                            <p>
                                When filters hide nodes, the panel shows how many are
                                invisible and offers to remove them permanently from the
                                graph. This is distinct from toggling a filter off, which
                                only restores visibility.
                            </p>
                        </li>
                    </ul>
                </section>

                <section class="wkb-docs-section">
                    <h3>Graph data table</h3>
                    <p>
                        The graph data table lists nodes REVEAL retrieved during build
                        and expansion, grouped by type (genes, gene sets, mechanisms,
                        traits). Rows highlighted in blue are selected nodes. Use
                        <em>Add to graph</em> to place a retrieved node on the canvas, or
                        <em>Remove</em> to drop one that is already there. Download the
                        current tab as CSV when you need a spreadsheet copy.
                    </p>
                </section>

                <section class="wkb-docs-section">
                    <h3>Node and edge menus</h3>
                    <p class="wkb-docs-lead">
                        Click a node or edge on the canvas to open a short action menu.
                        Click the same element again to dismiss it.
                    </p>
                    <ul class="wkb-docs-feature-list">
                        <li>
                            <strong>Node menu</strong>
                            <p>
                                <em>Inspect node</em> selects the node and opens the
                                Inspector. <em>Mark as selected node</em> / <em>Remove from
                                selected nodes</em> updates your focus set (blue fill).
                                <em>Expand graph from node</em> opens the expand panel scoped
                                to that node only. <em>Remove node</em> deletes
                                the node from the graph; unmark a non-starting selected node
                                before removing it.
                            </p>
                        </li>
                        <li>
                            <strong>Edge menu</strong>
                            <p>
                                <em>Inspect edge</em> opens edge provenance in the Inspector
                                when available. <em>Expand graph from edge</em> grows the
                                graph from both endpoints of the link.
                            </p>
                        </li>
                    </ul>
                </section>

                <section class="wkb-docs-section">
                    <h3>Tree view: nodes and edges</h3>
                    <p class="wkb-docs-lead">
                        The canvas uses a fixed four-row layout (genes, gene sets,
                        mechanisms, traits). Symbols in the toolbar legend match what
                        you see on the graph.
                    </p>
                    <ul class="wkb-docs-feature-list">
                        <li>
                            <strong>Selected node</strong>
                            <p>
                                Blue circles or blue diamonds are nodes you marked as
                                important for this session. New graphs start with your
                                initial picks as selected nodes. Use <em>Mark as selected node</em>
                                on the node menu to add or remove them. Selected nodes drive
                                connection ranking in the Inspector and are saved with
                                the graph.
                            </p>
                        </li>
                        <li>
                            <strong>Starting node</strong>
                            <p>
                                Gray diamonds are entities you chose when you built or
                                duplicated the graph. They mark where the session began
                                and stay visually distinct from nodes you added later.
                                Visibility filters apply to starting nodes the same as any
                                other node. If you also mark a starting node as a selected
                                node, it appears blue like other selected nodes.
                            </p>
                        </li>
                        <li>
                            <strong>Active edges</strong>
                            <p>
                                Solid lines are links that belong to your working graph:
                                connections returned when you built, loaded, or expanded
                                the graph. They are part of what Save graph to library stores. Some
                                active links skip one or more rows (“jumping” edges); use
                                <em>Hide jumping edges</em> in graph options to keep the
                                view quiet, then hover a node to see jumping links tied to
                                that node.
                            </p>
                        </li>
                        <li>
                            <strong>Contextual edges</strong>
                            <p>
                                Dashed lines are extra associations between nodes already
                                on the canvas, fetched from REVEAL but not added as
                                active graph links. They help you spot plausible
                                connections you might expand into the graph later. By
                                default they stay hidden until you hover a node (or turn
                                off <em>Hide contextual edges</em> to show non-jumping
                                dashed links at once). When contextual edges are hidden,
                                every dashed link stays off—including dashed links that
                                skip a row. When contextual edges are shown, dashed links
                                that skip a row still follow <em>Hide jumping edges</em>.
                            </p>
                        </li>
                    </ul>
                    <p>
                        Graph options (eye icon) combine as follows when nothing is
                        hovered: both hides on — only adjacent active (solid) links;
                        hide contextual only — jumping active links plus adjacent active;
                        hide jumping only — adjacent active plus non-jumping dashed
                        contextual; both off — every link. Hover always reveals edges
                        tied to the node under the pointer, even when a hide option is on.
                    </p>
                </section>

                <section class="wkb-docs-section">
                    <h3>Inspector drawer</h3>
                    <p>
                        The Inspector sits on the right edge of the canvas and shows
                        element-level evidence—association detail for the node or edge
                        you select—so you can read provenance without losing sight of
                        the graph. Open the Inspector tab, click an element on the
                        canvas, and review what supports that connection while you keep
                        exploring.
                    </p>
                    <p>
                        For genes, traits, mechanisms, and gene sets, the Inspector can
                        show top connections, expression profiles, factor loadings, and
                        association-score tables depending on node type. Fetched evidence
                        is cached for the current session; nodes and edges with cached
                        Inspector data show an orange highlight on the graph.
                    </p>
                </section>

                <section class="wkb-docs-section">
                    <h3>Analyze features</h3>
                    <ul class="wkb-docs-feature-list">
                        <li>
                            <strong>Explain graph</strong>
                            <p>
                                Choose <em>Selected nodes only</em> to focus the narrative
                                on your blue selected nodes, or <em>All visible nodes</em>
                                to summarize everything currently shown on the canvas
                                (respecting visibility filters). Edit the question and
                                optional context before running. Saved explanations appear
                                in the Explanation bubble on the canvas.
                            </p>
                        </li>
                        <li>
                            <strong>Build hypotheses</strong>
                            <p>
                                Requires at least one selected node. REVEAL ranks gene →
                                mechanism → trait pathways that connect your selection,
                                then lets you generate an LLM hypothesis per pathway or
                                open association-score tables. Saved runs appear in the
                                Hypotheses bubble.
                            </p>
                        </li>
                        <li>
                            <strong>Find related datasets</strong>
                            <p>
                                Requires at least one selected gene. Searches CFDE gene
                                sets linked to those genes and shows overlap and
                                enrichment-style scores. Saved runs appear in the Datasets
                                bubble.
                            </p>
                        </li>
                    </ul>
                </section>

                <section class="wkb-docs-section">
                    <h3>Analysis bubbles</h3>
                    <p>
                        After you run Explain graph, Build hypotheses, or Find related
                        datasets, a numbered bubble appears above the canvas (for example
                        <em>Explanation 1</em> or <em>Hypotheses 2</em>). Click a bubble
                        to reopen that result while continuing to edit the graph. Bubbles
                        hide while their modal is open and return when you close it.
                    </p>
                </section>

                <section class="wkb-docs-section">
                    <h3>Suggested user flow</h3>
                    <ol class="wkb-docs-flow">
                        <li>Add or load a graph (Manage → New graph, My library, or Import graph).</li>
                        <li>Grow the graph from node or edge menus; add retrieved nodes from Graph data.</li>
                        <li>Narrow the view with visibility filters when the canvas gets busy.</li>
                        <li>Mark selected nodes and use the Inspector for evidence.</li>
                        <li>Run Analyze when you are ready to explain, hypothesize, or find datasets.</li>
                        <li>Save to My library or Export graph when you work across machines.</li>
                    </ol>
                </section>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceDocumentationModal",
    props: {
        open: {
            type: Boolean,
            default: false,
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
    },
};
</script>

<style scoped>
.wkb-docs-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2100;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 48px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.wkb-docs-modal {
    position: relative;
    width: min(860px, 100%);
    max-height: calc(100vh - 96px);
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
    overflow: hidden;
}

.wkb-docs-close {
    position: absolute;
    top: 10px;
    right: 12px;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    padding: 4px 8px;
}

.wkb-docs-head {
    padding: 18px 24px 14px;
}

.wkb-docs-head h2 {
    margin: 0 0 6px;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-docs-head p {
    margin: 0;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 0.92rem;
    line-height: 1.5;
}

.wkb-docs-body {
    overflow-y: auto;
    padding: 0 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 28px;
}

.wkb-docs-section h3 {
    margin: 0 0 10px;
    font-size: 1rem;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-docs-lead {
    margin: 0 0 8px;
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--cfde-ink, #33363d);
}

.wkb-docs-section p {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.55;
    color: var(--cfde-ink, #33363d);
}

.wkb-docs-feature-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.wkb-docs-feature-list li {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.wkb-docs-feature-list strong {
    color: var(--cfde-blue, #2c5c97);
    font-size: 0.92rem;
}

.wkb-docs-feature-list p {
    margin: 0;
}

.wkb-docs-flow {
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-docs-flow li {
    font-size: 0.88rem;
    line-height: 1.55;
    color: var(--cfde-ink, #33363d);
}
</style>
