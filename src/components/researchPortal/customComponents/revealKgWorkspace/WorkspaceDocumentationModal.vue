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
                <h2 id="wkb-docs-modal-title">REVEAL KG Workspace Documentation</h2>
                <p>
                    A short guide to the workspace: what each part is for, when to
                    use it, and how it fits into a typical session.
                </p>
            </header>

            <div class="wkb-docs-body">
                <section class="wkb-docs-section">
                    <h3>Workspace model</h3>
                    <p class="wkb-docs-lead">
                        REVEAL KG Workspace is a browser-based graph canvas where you
                        work on one graph over time—adding structure, interpreting it,
                        and saving checkpoints as you go.
                    </p>
                    <p>
                        Exploration stays open-ended: you are not forced through a
                        fixed pipeline. Change, Analyze, and Save give you deliberate
                        ways to mutate the graph, read meaning from it, and keep work
                        you may want again. Start from anchors or a saved graph, shape
                        the canvas with expand and filter, open the Inspector when you
                        need provenance, and save when the graph reaches a state worth
                        returning to.
                    </p>
                </section>

                <section class="wkb-docs-section">
                    <h3>Top menus</h3>
                    <ul class="wkb-docs-feature-list">
                        <li>
                            <strong>Change</strong>
                            <p>
                                Use Change when you need to reshape what is on the
                                canvas—broader context, a tighter view, or new starting
                                nodes. Expand KG, Filter KG, and Add nodes live here;
                                pick the action that matches your intent and apply it to
                                the current session.
                            </p>
                        </li>
                        <li>
                            <strong>Analyze</strong>
                            <p>
                                Use Analyze once the graph is in a useful shape and you
                                want interpretation rather than more structure. Explain
                                KG, Build hypotheses, and Data provenance help you
                                summarize patterns, draft mechanistic stories, and trace
                                CFDE-linked evidence—on the whole graph or on a
                                selection you have marked as key nodes.
                            </p>
                        </li>
                        <li>
                            <strong>Save</strong>
                            <p>
                                Use Save when you want a checkpoint or a portable copy.
                                New graph starts fresh; Save KG keeps the session in this
                                browser; Download snapshot writes a file you can archive
                                or share outside the workspace.
                            </p>
                        </li>
                        <li>
                            <strong>Library</strong>
                            <p>
                                Library is where saved graphs live when you are not
                                building from scratch. Load a prior session, duplicate
                                it for a variant, remove what you no longer need, or
                                move collections between machines with Import and Export.
                                Open it from the top bar whenever you want to browse
                                saved work instead of continuing on the canvas.
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
                            <strong>Starting node</strong>
                            <p>
                                Gray diamonds mark anchors—the genes, traits, or other
                                entities you chose when building or expanding the graph.
                                They show where exploration started, not every node on
                                the canvas.
                            </p>
                        </li>
                        <li>
                            <strong>Key node</strong>
                            <p>
                                Blue circles or blue diamonds are nodes you marked as
                                important for this session (including starting nodes
                                when you keep them in the key set). Use
                                <em>Mark as key node</em> on the node menu to add or
                                remove them; key nodes are saved with the graph.
                            </p>
                        </li>
                        <li>
                            <strong>Active edges</strong>
                            <p>
                                Solid lines are links that belong to your working graph:
                                connections returned when you built, loaded, or expanded
                                the graph. They are part of what Save KG stores. Some
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
                </section>

                <section class="wkb-docs-section">
                    <h3>Suggested user flow</h3>
                    <ol class="wkb-docs-flow">
                        <li>Add or load a graph (Change or Library).</li>
                        <li>Shape it with Expand and Filter; use the Inspector for evidence.</li>
                        <li>Run Analyze when you are ready to explain, hypothesize, or trace provenance.</li>
                        <li>Save locally and use Library Import/Export when you work across machines.</li>
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
