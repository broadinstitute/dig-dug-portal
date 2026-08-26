<template>
    <div class="bng">
        <div class="bng-legend">
            <div class="bng-legend-row">
                <span v-for="item in legendItems" :key="item.type" class="bng-legend-item">
                    <span class="bng-swatch" :style="{ backgroundColor: item.color }" aria-hidden="true"></span>
                    {{ item.label }}
                </span>
            </div>
            <div class="bng-legend-row bng-legend-metrics">
                <span class="bng-legend-item">
                    <span class="bng-size-demo" aria-hidden="true">
                        <i class="bng-size-circle bng-size-circle--sm"></i>
                        <i class="bng-size-circle bng-size-circle--lg"></i>
                    </span>
                    Larger disease node = higher aggregated PIGEAN score
                </span>
                <span class="bng-legend-item">
                    <span class="bng-edge-demo" aria-hidden="true">
                        <i class="bng-edge-line bng-edge-line--short"></i>
                        <i class="bng-edge-line bng-edge-line--long"></i>
                    </span>
                    Shorter edge = higher gene loading / PIGEAN score
                </span>
                <span class="bng-legend-item bng-legend-hint">
                    Click a disease or gene node for actions
                </span>
            </div>
        </div>

        <div class="bng-wrapper">
            <div ref="container" class="bng-canvas" :style="{ height: height + 'px' }"></div>

            <div
                v-if="tooltip.visible"
                class="bng-tooltip"
                :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
                v-html="tooltip.html"
            ></div>

            <div
                v-if="menu.visible"
                class="bng-menu"
                :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
                role="menu"
                @click.stop
            >
                <div class="bng-menu-title">{{ menu.label }}</div>
                <button
                    v-if="menu.nodeType === 'Phenotype'"
                    type="button"
                    class="bng-menu-btn"
                    role="menuitem"
                    @click="emitViewSharedGenes"
                >
                    View shared genes
                </button>
                <button
                    v-if="menu.nodeType === 'Phenotype' && menu.hasLoadedGenes"
                    type="button"
                    class="bng-menu-btn"
                    role="menuitem"
                    @click="emitHideGenes"
                >
                    Hide genes
                </button>
                <button
                    v-if="menu.nodeType === 'Phenotype' || menu.nodeType === 'Gene'"
                    type="button"
                    class="bng-menu-btn"
                    role="menuitem"
                    @click="highlightConnected"
                >
                    Highlight connected nodes
                </button>
            </div>

            <div v-if="ready" class="bng-zoom">
                <label class="bng-zoom-label" for="bng-zoom-range">Zoom</label>
                <input
                    id="bng-zoom-range"
                    v-model.number="zoom"
                    type="range"
                    class="bng-zoom-range"
                    :min="zoomMin"
                    :max="zoomMax"
                    step="0.05"
                    @input="applyZoom"
                />
            </div>
        </div>
    </div>
</template>

<script>
import { Network } from "vis-network";
import { DataSet } from "vis-data";

const TYPE_COLORS = {
    Factor: "#377eb8",
    Phenotype: "#e41a1c",
    Gene: "#984ea3",
};
const FETCHED_DISEASE_BORDER = "#e67e22";
const NODE_BORDER = "#ffffff";
const EDGE_COLOR = "#b3b3b3";

/** Size ranges per node type, in vis-network node size units. */
const SIZE_RANGES = {
    Phenotype: [16, 36],
    Gene: [16, 30],
};
const FACTOR_SIZE = 26;
/** Higher edge strength pulls endpoints closer, so the range is inverted. */
const EDGE_LENGTH_RANGE = [95, 260];
const DIM_OPACITY = 0.18;
const FULL_OPACITY = 1;

function absOrNull(value) {
    if (value == null || value === "" || Number.isNaN(Number(value))) return null;
    return Math.abs(Number(value));
}

function scale(value, min, max, outMin, outMax) {
    if (value == null || min == null || max == null) return (outMin + outMax) / 2;
    if (max === min) return (outMin + outMax) / 2;
    const t = (value - min) / (max - min);
    return outMin + t * (outMax - outMin);
}

function truncate(text, limit = 12) {
    const s = String(text == null ? "" : text);
    return s.length > limit ? `${s.slice(0, limit - 2)}…` : s;
}

function escapeHtml(text) {
    return String(text == null ? "" : text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatNumber(value, digits = 2) {
    if (value == null || value === "" || Number.isNaN(Number(value))) return null;
    return Number(value).toFixed(digits);
}

/**
 * Purpose-built renderer for the biomarker mechanism network.
 *
 * Fully declarative: the parent owns graph state and passes the complete
 * node/edge list. Every apply reconciles the vis DataSets against that list by
 * id, so a node's label and metrics always come from its own graph entry and a
 * given id can only ever exist once.
 */
export default {
    name: "BiomarkerNetworkGraph",
    props: {
        graph: {
            type: Object,
            default: () => ({ nodes: [], edges: [] }),
        },
        height: {
            type: Number,
            default: 480,
        },
        genesFetchedDiseaseIds: {
            type: Array,
            default: () => [],
        },
        typeLabels: {
            type: Object,
            default: () => ({ Factor: "Mechanism", Phenotype: "Disease", Gene: "Gene" }),
        },
    },
    data() {
        return {
            ready: false,
            zoom: 1,
            zoomMin: 0.2,
            zoomMax: 2.5,
            tooltip: { visible: false, x: 0, y: 0, html: "" },
            menu: {
                visible: false,
                x: 0,
                y: 0,
                nodeId: "",
                label: "",
                nodeType: "",
                hasLoadedGenes: false,
            },
        };
    },
    created() {
        // These must never be declared in data(). Vue 2 deeply observes anything
        // reachable from data, which turns vis-network's shared global node
        // options into accessor properties. Each node's options object is
        // Object.create(globalOptions), so writes to a node's own options would
        // then hit the prototype setter and every node would end up sharing the
        // last node's label, colour and size.
        this.network = null;
        this.nodesDataSet = null;
        this.edgesDataSet = null;
        this.resizeObserver = null;
        this.tooltipHtmlById = {};
        this.highlightRootId = null;
    },
    computed: {
        fetchedDiseaseSet() {
            return new Set((this.genesFetchedDiseaseIds || []).map((id) => String(id)));
        },
        presentTypes() {
            const seen = new Set();
            (this.graph.nodes || []).forEach((n) => {
                if (n && n.type) seen.add(n.type);
            });
            return seen;
        },
        legendItems() {
            return ["Factor", "Phenotype", "Gene"]
                .filter((type) => this.presentTypes.has(type))
                .map((type) => ({
                    type,
                    color: TYPE_COLORS[type],
                    label: (this.typeLabels && this.typeLabels[type]) || type,
                }));
        },
    },
    watch: {
        graph: {
            deep: true,
            handler() {
                this.applyGraph();
            },
        },
        genesFetchedDiseaseIds() {
            this.applyGraph();
        },
        height() {
            this.$nextTick(this.resize);
        },
    },
    mounted() {
        this.$nextTick(this.initNetwork);
    },
    beforeDestroy() {
        this.teardown();
    },
    methods: {
        initNetwork() {
            const container = this.$refs.container;
            if (!container || this.network) return;

            this.nodesDataSet = new DataSet([]);
            this.edgesDataSet = new DataSet([]);
            this.network = new Network(
                container,
                { nodes: this.nodesDataSet, edges: this.edgesDataSet },
                {
                    autoResize: false,
                    nodes: { shape: "dot", borderWidth: 1.5, shadow: false },
                    edges: {
                        color: { color: EDGE_COLOR, highlight: "#888", inherit: false },
                        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
                        smooth: { enabled: true, type: "continuous", roundness: 0.4 },
                        shadow: false,
                    },
                    layout: { randomSeed: 2, improvedLayout: false },
                    physics: {
                        enabled: true,
                        stabilization: { enabled: true, iterations: 200, fit: false },
                        barnesHut: {
                            gravitationalConstant: -2200,
                            centralGravity: 0.015,
                            springLength: 160,
                            springConstant: 0.018,
                            damping: 0.5,
                            avoidOverlap: 0.85,
                        },
                    },
                    interaction: {
                        hover: true,
                        dragNodes: true,
                        dragView: true,
                        zoomView: false,
                        selectConnectedEdges: false,
                        hoverConnectedEdges: false,
                    },
                }
            );

            this.network.on("hoverNode", this.onHoverNode);
            this.network.on("blurNode", this.hideTooltip);
            this.network.on("dragStart", this.onInteractionStart);
            this.network.on("dragging", this.hideTooltip);
            this.network.on("zoom", this.onZoomChanged);
            this.network.on("click", this.onClick);

            this.ready = true;
            this.observeResize();
            this.applyGraph(true);
        },
        teardown() {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
            if (this.network) {
                this.network.destroy();
                this.network = null;
            }
            this.nodesDataSet = null;
            this.edgesDataSet = null;
            this.tooltipHtmlById = {};
            this.highlightRootId = null;
            this.ready = false;
        },
        observeResize() {
            if (typeof ResizeObserver === "undefined" || !this.$refs.container) return;
            this.resizeObserver = new ResizeObserver(() => this.resize());
            this.resizeObserver.observe(this.$refs.container);
        },
        resize() {
            const container = this.$refs.container;
            if (!this.network || !container) return;
            if (container.clientWidth < 8 || container.clientHeight < 8) return;
            this.network.setSize(`${container.clientWidth}px`, `${container.clientHeight}px`);
            this.network.redraw();
        },
        /**
         * Reconcile the vis DataSets against the graph prop. Nodes already on
         * screen keep their settled positions; only newly added ones are seeded.
         */
        applyGraph(isFirstApply = false) {
            if (!this.nodesDataSet || !this.edgesDataSet) return;

            const graphNodes = (this.graph.nodes || []).filter((n) => n && n.id != null);
            const graphEdges = (this.graph.edges || []).filter(
                (e) => e && e.source != null && e.target != null
            );

            const ranges = this.metricRanges(graphNodes);
            const existingNodeIds = new Set(this.nodesDataSet.getIds().map((id) => String(id)));
            const newGraphNodes = graphNodes.filter((n) => !existingNodeIds.has(String(n.id)));
            const seeded = this.seedPositions(newGraphNodes, graphEdges);

            // Tooltip markup is held outside vis so it renders only in our own
            // panel rather than also as vis-network's native popup.
            this.tooltipHtmlById = {};
            const visNodes = graphNodes.map((n) => {
                const built = this.buildVisNode(n, ranges);
                this.tooltipHtmlById[String(n.id)] = this.tooltipHtml(
                    n,
                    String(n.label == null ? n.id : n.label)
                );
                const pos = seeded[String(n.id)];
                if (pos) {
                    built.x = pos.x;
                    built.y = pos.y;
                }
                return built;
            });

            const edgeRange = this.edgeStrengthRange(graphEdges);
            const visEdges = graphEdges.map((e) => this.buildVisEdge(e, edgeRange));

            const desiredNodeIds = new Set(visNodes.map((n) => String(n.id)));
            const desiredEdgeIds = new Set(visEdges.map((e) => String(e.id)));
            const staleNodeIds = this.nodesDataSet
                .getIds()
                .filter((id) => !desiredNodeIds.has(String(id)));
            const staleEdgeIds = this.edgesDataSet
                .getIds()
                .filter((id) => !desiredEdgeIds.has(String(id)));

            // Edges first so no edge ever references a removed endpoint.
            if (staleEdgeIds.length) this.edgesDataSet.remove(staleEdgeIds);
            if (staleNodeIds.length) this.nodesDataSet.remove(staleNodeIds);
            this.nodesDataSet.update(visNodes);
            this.edgesDataSet.update(visEdges);

            const changed =
                newGraphNodes.length > 0 || staleNodeIds.length > 0 || staleEdgeIds.length > 0;
            if (isFirstApply) {
                this.$nextTick(() => {
                    this.resize();
                    this.fit();
                    this.applyHighlightStyles();
                });
            } else if (changed) {
                this.restabilize();
                this.applyHighlightStyles();
            } else {
                this.applyHighlightStyles();
            }
        },
        metricRanges(graphNodes) {
            const values = { Phenotype: [], Gene: [] };
            (graphNodes || []).forEach((n) => {
                const v = absOrNull(this.metricValue(n));
                if (v != null && values[n.type]) values[n.type].push(v);
            });
            const range = {};
            Object.keys(values).forEach((type) => {
                const list = values[type];
                range[type] = list.length
                    ? { min: Math.min(...list), max: Math.max(...list) }
                    : { min: null, max: null };
            });
            return range;
        },
        metricValue(node) {
            const meta = (node && node.metadata) || {};
            if (node.type === "Phenotype") return meta.aggregatePigeanScore;
            if (node.type === "Gene") return meta.pigeanScore;
            return null;
        },
        edgeStrengthRange(graphEdges) {
            const values = [];
            (graphEdges || []).forEach((e) => {
                const v = absOrNull(e.metadata && e.metadata.edgeStrength);
                if (v != null) values.push(v);
            });
            return values.length
                ? { min: Math.min(...values), max: Math.max(...values) }
                : { min: null, max: null };
        },
        buildVisNode(node, ranges) {
            const type = node.type || "Gene";
            const label = String(node.label == null ? node.id : node.label);
            const isFetchedDisease =
                type === "Phenotype" && this.fetchedDiseaseSet.has(String(node.id));

            let size = FACTOR_SIZE;
            if (type !== "Factor") {
                const [outMin, outMax] = SIZE_RANGES[type] || SIZE_RANGES.Gene;
                const range = (ranges && ranges[type]) || { min: null, max: null };
                size = scale(absOrNull(this.metricValue(node)), range.min, range.max, outMin, outMax);
            }

            return {
                id: node.id,
                // Genes show their full symbol; longer disease/mechanism names are clipped.
                label: type === "Gene" ? label : truncate(label),
                color: {
                    background: TYPE_COLORS[type] || "#999999",
                    border: isFetchedDisease ? FETCHED_DISEASE_BORDER : NODE_BORDER,
                },
                borderWidth: isFetchedDisease ? 3 : 1.5,
                size,
                font: { size: 14, color: "#333333" },
            };
        },
        buildVisEdge(edge, edgeRange) {
            const strength = absOrNull(edge.metadata && edge.metadata.edgeStrength);
            const length = scale(
                strength,
                edgeRange.min,
                edgeRange.max,
                EDGE_LENGTH_RANGE[1],
                EDGE_LENGTH_RANGE[0]
            );
            return {
                id: this.edgeId(edge.source, edge.target),
                from: edge.source,
                to: edge.target,
                length,
                width: 1,
            };
        },
        edgeId(source, target) {
            return `e|${source}|${target}`;
        },
        /** Places new nodes near an already-positioned neighbour, else near the factor. */
        seedPositions(newGraphNodes, graphEdges) {
            const seeded = {};
            if (!newGraphNodes.length || !this.network) return seeded;

            const neighbourOf = {};
            (graphEdges || []).forEach((e) => {
                const s = String(e.source);
                const t = String(e.target);
                if (!neighbourOf[s]) neighbourOf[s] = [];
                if (!neighbourOf[t]) neighbourOf[t] = [];
                neighbourOf[s].push(t);
                neighbourOf[t].push(s);
            });

            let positions = {};
            try {
                positions = this.network.getPositions();
            } catch (e) {
                positions = {};
            }

            newGraphNodes.forEach((n, i) => {
                const id = String(n.id);
                const anchorId = (neighbourOf[id] || []).find((other) => positions[other]);
                const anchor = anchorId ? positions[anchorId] : null;
                const angle = (Math.PI * 2 * i) / newGraphNodes.length;
                const radius = anchor ? 70 : 180;
                seeded[id] = {
                    x: (anchor ? anchor.x : 0) + Math.cos(angle) * radius,
                    y: (anchor ? anchor.y : 0) + Math.sin(angle) * radius,
                };
            });
            return seeded;
        },
        restabilize() {
            if (!this.network) return;
            try {
                this.network.stabilize(200);
            } catch (e) {
                /* network torn down mid-update */
            }
        },
        fit() {
            if (!this.network) return;
            try {
                this.network.fit({ padding: 48, animation: false });
                this.zoom = Math.max(this.zoomMin, Math.min(this.zoomMax, this.network.getScale()));
            } catch (e) {
                /* nothing laid out yet */
            }
        },
        tooltipHtml(node, fullLabel) {
            const type = node.type || "Gene";
            const meta = node.metadata || {};
            const typeLabel = (this.typeLabels && this.typeLabels[type]) || type;
            const rows = [
                `<div class="bng-tip-title">${escapeHtml(fullLabel)}</div>`,
                `<div class="bng-tip-row">${escapeHtml(typeLabel)}</div>`,
            ];
            const add = (label, value) => {
                if (value == null) return;
                rows.push(`<div class="bng-tip-row">${label}: <b>${value}</b></div>`);
            };
            if (type === "Phenotype") {
                add("Aggregated PIGEAN score", formatNumber(meta.aggregatePigeanScore));
                add("Shared genes", meta.sharedGeneCount != null ? meta.sharedGeneCount : null);
            }
            if (type === "Gene") {
                add("PIGEAN score", formatNumber(meta.pigeanScore));
                add("Factor loading", formatNumber(meta.factorLoading, 4));
                add("Linked diseases", meta.diseaseCount != null ? meta.diseaseCount : null);
            }
            return rows.join("");
        },
        onHoverNode(params) {
            const nodeId = params && params.node;
            if (nodeId == null) return;
            const html = this.tooltipHtmlById[String(nodeId)];
            if (!html) return;
            const point = this.pointerPosition(params);
            this.tooltip = { visible: true, x: point.x + 14, y: point.y + 14, html };
        },
        hideTooltip() {
            if (this.tooltip.visible) this.tooltip = { ...this.tooltip, visible: false };
        },
        onInteractionStart() {
            this.hideTooltip();
            this.hideMenu();
        },
        onClick(params) {
            this.hideTooltip();
            const nodeId = (params && params.nodes && params.nodes[0]) != null ? params.nodes[0] : null;
            if (nodeId == null) {
                this.hideMenu();
                this.clearHighlight();
                return;
            }
            const graphNode = (this.graph.nodes || []).find((n) => String(n.id) === String(nodeId));
            if (!graphNode || (graphNode.type !== "Phenotype" && graphNode.type !== "Gene")) {
                this.hideMenu();
                return;
            }
            const point = this.pointerPosition(params);
            this.menu = {
                visible: true,
                x: point.x,
                y: point.y + 12,
                nodeId: String(nodeId),
                label: truncate(graphNode.label || nodeId, 28),
                nodeType: graphNode.type,
                hasLoadedGenes:
                    graphNode.type === "Phenotype" && this.fetchedDiseaseSet.has(String(nodeId)),
            };
        },
        hideMenu() {
            if (this.menu.visible) {
                this.menu = {
                    visible: false,
                    x: this.menu.x,
                    y: this.menu.y,
                    nodeId: "",
                    label: "",
                    nodeType: "",
                    hasLoadedGenes: false,
                };
            }
        },
        emitViewSharedGenes() {
            const nodeId = this.menu.nodeId;
            this.hideMenu();
            if (nodeId) this.$emit("view-shared-genes", { nodeId });
        },
        emitHideGenes() {
            const nodeId = this.menu.nodeId;
            this.hideMenu();
            if (nodeId) this.$emit("hide-genes", { nodeId });
        },
        /**
         * Keep the clicked node and its 1-hop non-Factor neighbours bright;
         * dim everything else. Empty-canvas click clears via clearHighlight().
         */
        highlightConnected() {
            const nodeId = this.menu.nodeId;
            this.hideMenu();
            if (!nodeId) return;
            this.highlightRootId = String(nodeId);
            this.applyHighlightStyles();
        },
        clearHighlight() {
            if (this.highlightRootId == null) return;
            this.highlightRootId = null;
            this.applyHighlightStyles();
        },
        connectedFocusIds(rootId) {
            const root = String(rootId);
            const typeById = {};
            (this.graph.nodes || []).forEach((n) => {
                if (n && n.id != null) typeById[String(n.id)] = n.type;
            });
            if (!typeById[root] || typeById[root] === "Factor") return new Set();

            const focus = new Set([root]);
            (this.graph.edges || []).forEach((e) => {
                if (!e || e.source == null || e.target == null) return;
                const a = String(e.source);
                const b = String(e.target);
                if (a !== root && b !== root) return;
                const other = a === root ? b : a;
                if (typeById[other] && typeById[other] !== "Factor") focus.add(other);
            });
            return focus;
        },
        applyHighlightStyles() {
            if (!this.nodesDataSet || !this.edgesDataSet) return;

            if (this.highlightRootId) {
                const stillPresent = (this.graph.nodes || []).some(
                    (n) => n && String(n.id) === String(this.highlightRootId)
                );
                if (!stillPresent) this.highlightRootId = null;
            }

            const focus = this.highlightRootId
                ? this.connectedFocusIds(this.highlightRootId)
                : null;
            const highlighting = !!(focus && focus.size);

            const nodeUpdates = this.nodesDataSet.getIds().map((id) => {
                const keep = !highlighting || focus.has(String(id));
                return { id, opacity: keep ? FULL_OPACITY : DIM_OPACITY };
            });
            if (nodeUpdates.length) this.nodesDataSet.update(nodeUpdates);

            const edgeUpdates = this.edgesDataSet.get().map((edge) => {
                const keep =
                    !highlighting ||
                    (focus.has(String(edge.from)) && focus.has(String(edge.to)));
                return {
                    id: edge.id,
                    color: {
                        color: EDGE_COLOR,
                        highlight: "#888",
                        opacity: keep ? FULL_OPACITY : DIM_OPACITY,
                    },
                };
            });
            if (edgeUpdates.length) this.edgesDataSet.update(edgeUpdates);
        },
        pointerPosition(params) {
            const dom = params && params.pointer && params.pointer.DOM;
            const container = this.$refs.container;
            const maxX = container ? container.clientWidth - 40 : 9999;
            const maxY = container ? container.clientHeight - 40 : 9999;
            return {
                x: Math.max(0, Math.min(dom ? dom.x : 0, maxX)),
                y: Math.max(0, Math.min(dom ? dom.y : 0, maxY)),
            };
        },
        onZoomChanged(params) {
            const scaleValue = params && params.scale;
            if (typeof scaleValue !== "number" || Number.isNaN(scaleValue)) return;
            this.zoom = Math.max(this.zoomMin, Math.min(this.zoomMax, scaleValue));
        },
        applyZoom() {
            if (!this.network) return;
            this.network.moveTo({ scale: this.zoom, animation: { duration: 0 } });
        },
    },
};
</script>

<style scoped>
.bng {
    width: 100%;
}
.bng-legend {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 6px;
    font-size: 12px;
    color: #555;
}
.bng-legend-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
}
.bng-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}
.bng-swatch {
    display: inline-block;
    width: 11px;
    height: 11px;
    border-radius: 50%;
}
.bng-legend-metrics {
    color: #777;
}
.bng-legend-hint {
    font-style: italic;
}
.bng-size-demo,
.bng-edge-demo {
    display: inline-flex;
    align-items: center;
    gap: 3px;
}
.bng-size-circle {
    display: inline-block;
    border-radius: 50%;
    background: #bbb;
}
.bng-size-circle--sm {
    width: 6px;
    height: 6px;
}
.bng-size-circle--lg {
    width: 11px;
    height: 11px;
}
.bng-edge-line {
    display: inline-block;
    height: 2px;
    background: #bbb;
}
.bng-edge-line--short {
    width: 8px;
}
.bng-edge-line--long {
    width: 16px;
}
.bng-wrapper {
    position: relative;
    border: 1px solid #e3e3e3;
    border-radius: 4px;
    background: #fff;
}
.bng-canvas {
    width: 100%;
}
.bng-tooltip {
    position: absolute;
    z-index: 20;
    max-width: 260px;
    padding: 8px 10px;
    border-radius: 5px;
    background: rgba(33, 33, 33, 0.94);
    color: #fff;
    font-size: 12px;
    line-height: 1.45;
    pointer-events: none;
}
.bng-tooltip >>> .bng-tip-title {
    font-weight: 600;
    margin-bottom: 2px;
}
.bng-menu {
    position: absolute;
    z-index: 25;
    min-width: 150px;
    padding: 4px;
    border: 1px solid #d5d5d5;
    border-radius: 5px;
    background: #fff;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16);
}
.bng-menu-title {
    padding: 3px 7px;
    font-size: 11px;
    font-weight: 600;
    color: #666;
    border-bottom: 1px solid #eee;
}
.bng-menu-btn {
    display: block;
    width: 100%;
    padding: 6px 8px;
    border: 0;
    border-radius: 3px;
    background: transparent;
    text-align: left;
    font-size: 12px;
    color: #21618c;
    cursor: pointer;
}
.bng-menu-btn:hover {
    background: #f0f6fb;
}
.bng-zoom {
    position: absolute;
    right: 10px;
    bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    font-size: 11px;
    color: #666;
}
.bng-zoom-label {
    margin: 0;
}
.bng-zoom-range {
    width: 96px;
}
</style>
