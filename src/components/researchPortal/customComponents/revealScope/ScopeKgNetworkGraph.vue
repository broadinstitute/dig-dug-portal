<template>
    <div v-if="graph && graph.nodes.length" class="scp-kgnet">
        <div class="scp-kgnet-toolbar">
            <div class="scp-kgnet-legend">
                <span v-for="item in legendItems" :key="item.type" class="scp-kgnet-legend-item">
                    <i class="scp-kgnet-swatch" :style="{ background: item.color }"></i>
                    {{ item.label }}
                </span>
            </div>
            <div class="scp-kgnet-zoom" role="toolbar" aria-label="Network graph zoom">
                <input
                    v-model.number="zoomLevel"
                    type="range"
                    class="scp-kgnet-zoom-slider"
                    :min="zoomMin"
                    :max="zoomMax"
                    :step="zoomStep"
                    aria-label="Network graph zoom"
                    @input="onZoomInput"
                />
                <button
                    type="button"
                    class="scp-kgnet-zoom-fit"
                    title="Fit graph"
                    aria-label="Fit graph"
                    @click="fitNetworkView"
                >
                    Fit
                </button>
            </div>
        </div>
        <div
            ref="canvasWrap"
            class="scp-kgnet-canvas-wrap"
            @pointerleave="onCanvasPointerLeave"
        >
            <div
                ref="container"
                class="scp-kgnet-canvas"
                role="img"
                aria-label="Gene, gene set, factor, and trait network"
            />
            <button
                v-if="isHighlightView"
                type="button"
                class="scp-kgnet-back"
                title="Full network"
                aria-label="Full network"
                @click="showFullNetwork"
            >
                ←
            </button>
            <div
                v-if="hoverTooltip.visible"
                class="scp-kgnet-tooltip"
                :style="tooltipStyle"
                role="dialog"
                :aria-label="hoverTooltip.label"
                @pointerenter="onTooltipEnter"
                @pointerleave="onTooltipLeave"
            >
                <p class="scp-kgnet-tooltip-label">{{ hoverTooltip.label }}</p>
                <button
                    v-if="!isHighlightView"
                    type="button"
                    class="scp-kgnet-tooltip-action"
                    @click.stop="onHighlightAction"
                >
                    Highlight connected nodes
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { neighborhoodOf, toDisplayNetwork } from "./scopeKgNetworkGraph.js";

const COLUMN_ORDER = ["gene", "geneSet", "factor", "trait"];
const COLUMN_LABELS = {
    gene: "Genes",
    geneSet: "Gene sets",
    factor: "Factors",
    trait: "Traits",
};
const COLUMN_COLORS = {
    gene: "#2c5c97",
    geneSet: "#e07b39",
    factor: "#7c5ec9",
    trait: "#6b6b6b",
};
const EDGE_HEX = "#b0a890";
const NODE_SIZE = 9;
const LABEL_GAP = 6;
const LABEL_FONT = '13px Inter, "Segoe UI", system-ui, sans-serif';
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;
const CANVAS_HEIGHT = 520;
const LEVEL_SEPARATION = Math.round(220 * 1.1);
const MAX_NODES_BY_TYPE = {
    gene: 8,
    geneSet: 12,
    factor: 8,
    trait: 12,
};

function visEdgeColor() {
    return {
        color: EDGE_HEX,
        highlight: EDGE_HEX,
        hover: EDGE_HEX,
        inherit: false,
        opacity: 1,
    };
}

function truncateLabel(text, max = 22) {
    const value = String(text || "");
    if (value.length <= max) return value;
    return `${value.slice(0, max - 1)}…`;
}

function createNodeCtxRenderer({ displayLabel, backgroundColor, borderColor, size }) {
    const dimensions = { width: size * 2, height: size * 2 };
    return function nodeCtxRenderer({ ctx, x, y, state }) {
        return {
            nodeDimensions: dimensions,
            drawNode() {
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = backgroundColor;
                ctx.fill();
                ctx.lineWidth = state.selected ? 2 : 1;
                ctx.strokeStyle = borderColor;
                ctx.stroke();
            },
            drawExternalLabel() {
                if (!displayLabel) return;
                ctx.font = LABEL_FONT;
                ctx.fillStyle = "#33363d";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillText(displayLabel, x, y + size + LABEL_GAP);
            },
        };
    };
}

export default {
    name: "ScopeKgNetworkGraph",
    props: {
        graph: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            visNetwork: null,
            nodeDataSet: null,
            edgeDataSet: null,
            displayNetwork: { nodes: [], edges: [] },
            resizeObserver: null,
            zoomLevel: 1,
            zoomMin: ZOOM_MIN,
            zoomMax: ZOOM_MAX,
            zoomStep: ZOOM_STEP,
            suppressZoomSync: false,
            viewportReady: false,
            highlightedNodeId: null,
            tooltipPinned: false,
            tooltipHideTimer: null,
            hoverTooltip: {
                visible: false,
                nodeId: null,
                label: "",
                left: 0,
                top: 0,
            },
            legendItems: COLUMN_ORDER.map((type) => ({
                type,
                label: COLUMN_LABELS[type],
                color: COLUMN_COLORS[type],
            })),
        };
    },
    watch: {
        graph: {
            deep: true,
            handler() {
                this.highlightedNodeId = null;
                this.hideTooltip();
                this.renderNetwork();
            },
        },
    },
    mounted() {
        this.observeResize();
        this.renderNetwork();
    },
    beforeDestroy() {
        this.clearTooltipTimer();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.destroyNetwork();
    },
    computed: {
        isHighlightView() {
            return Boolean(this.highlightedNodeId);
        },
        degreeById() {
            const degree = {};
            (this.graph && this.graph.edges ? this.graph.edges : []).forEach((edge) => {
                if (edge.source) degree[edge.source] = (degree[edge.source] || 0) + 1;
                if (edge.target) degree[edge.target] = (degree[edge.target] || 0) + 1;
            });
            return degree;
        },
        visibleNodeIds() {
            const byType = {};
            COLUMN_ORDER.forEach((type) => {
                byType[type] = [];
            });
            (this.graph.nodes || []).forEach((node) => {
                const type = COLUMN_ORDER.includes(node.type) ? node.type : "trait";
                byType[type].push(node);
            });
            const degree = this.degreeById;
            const ids = new Set();
            COLUMN_ORDER.forEach((type) => {
                byType[type]
                    .slice()
                    .sort((a, b) => (degree[b.id] || 0) - (degree[a.id] || 0))
                    .slice(0, MAX_NODES_BY_TYPE[type])
                    .forEach((node) => ids.add(node.id));
            });
            return ids;
        },
        tooltipStyle() {
            return {
                left: `${this.hoverTooltip.left}px`,
                top: `${this.hoverTooltip.top}px`,
            };
        },
    },
    methods: {
        visLevel(node) {
            if (Number.isFinite(node && node.level)) return node.level;
            const typeIndex = COLUMN_ORDER.indexOf(node && node.type);
            return typeIndex >= 0 ? typeIndex : 0;
        },
        toVisNodes(displayNodes) {
            return (displayNodes || []).map((node) => {
                const color = COLUMN_COLORS[node.type] || COLUMN_COLORS.trait;
                const fullLabel = node.label || node.id;
                const displayLabel = truncateLabel(fullLabel);
                return {
                    id: node.id,
                    label: "",
                    fullLabel,
                    level: this.visLevel(node),
                    shape: "custom",
                    size: NODE_SIZE,
                    width: NODE_SIZE * 2,
                    height: NODE_SIZE * 2,
                    borderWidth: 0,
                    color: {
                        background: color,
                        border: color,
                        highlight: { background: color, border: color },
                        hover: { background: color, border: color },
                    },
                    font: {
                        size: 13,
                        color: "#33363d",
                        face: "Inter, Segoe UI, system-ui, sans-serif",
                        strokeWidth: 0,
                    },
                    ctxRenderer: createNodeCtxRenderer({
                        displayLabel,
                        backgroundColor: color,
                        borderColor: color,
                        size: NODE_SIZE,
                    }),
                };
            });
        },
        toVisEdges(displayEdges, displayNodes) {
            const levelById = {};
            (displayNodes || []).forEach((node) => {
                levelById[node.id] = this.visLevel(node);
            });
            let curvedCount = 0;
            return (displayEdges || []).map((edge) => {
                const fromLevel = levelById[edge.from];
                const toLevel = levelById[edge.to];
                const span =
                    Number.isFinite(fromLevel) && Number.isFinite(toLevel)
                        ? Math.abs(toLevel - fromLevel)
                        : 1;
                const visEdge = {
                    id: edge.id,
                    from: edge.from,
                    to: edge.to,
                    arrows: { to: { enabled: true, scaleFactor: 0.65 } },
                    color: visEdgeColor(),
                    width: 1,
                };
                // A straight edge that skips a column runs through whatever node sits
                // in the skipped column, so it reads as two connections that don't exist.
                if (span > 1) {
                    curvedCount += 1;
                    visEdge.smooth = {
                        enabled: true,
                        type: curvedCount % 2 === 1 ? "curvedCW" : "curvedCCW",
                        roundness: Math.min(0.6, 0.2 + 0.15 * (span - 1)),
                    };
                }
                return visEdge;
            });
        },
        networkOptions() {
            return {
                layout: {
                    hierarchical: {
                        enabled: true,
                        direction: "LR",
                        sortMethod: "directed",
                        levelSeparation: LEVEL_SEPARATION,
                        nodeSpacing: 68,
                        treeSpacing: 72,
                        blockShifting: true,
                        edgeMinimization: true,
                        parentCentralization: true,
                    },
                },
                physics: { enabled: false },
                interaction: {
                    dragNodes: false,
                    dragView: true,
                    zoomView: false,
                    hover: true,
                    hoverConnectedEdges: false,
                    selectable: false,
                },
                edges: {
                    chosen: false,
                    arrowStrikethrough: false,
                    color: visEdgeColor(),
                    width: 1,
                    smooth: {
                        type: "cubicBezier",
                        forceDirection: "horizontal",
                        roundness: 0.35,
                    },
                },
                nodes: {
                    chosen: false,
                    margin: 8,
                    widthConstraint: false,
                },
                height: `${CANVAS_HEIGHT}px`,
            };
        },
        destroyNetwork() {
            this.detachNetworkEvents();
            if (this.visNetwork) {
                this.visNetwork.destroy();
                this.visNetwork = null;
            }
            this.nodeDataSet = null;
            this.edgeDataSet = null;
            this.viewportReady = false;
        },
        mountNetwork(displayNodes, displayEdges) {
            if (!this.$refs.container) return;
            this.destroyNetwork();
            const nodes = new DataSet(this.toVisNodes(displayNodes));
            const edges = new DataSet(this.toVisEdges(displayEdges, displayNodes));
            this.nodeDataSet = nodes;
            this.edgeDataSet = edges;
            this.visNetwork = new Network(
                this.$refs.container,
                { nodes, edges },
                this.networkOptions()
            );
            this.attachNetworkEvents();
            this.visNetwork.once("stabilized", () => {
                this.fitNetworkView();
            });
            this.$nextTick(() => {
                requestAnimationFrame(() => this.fitNetworkView());
            });
        },
        renderNetwork() {
            if (!this.$refs.container) return;
            this.destroyNetwork();
            this.displayNetwork = { nodes: [], edges: [] };
            this.highlightedNodeId = null;
            if (!this.graph || !this.graph.nodes || !this.graph.nodes.length) return;
            this.displayNetwork = toDisplayNetwork(this.graph, this.visibleNodeIds);
            this.mountNetwork(this.displayNetwork.nodes, this.displayNetwork.edges);
        },
        showHighlightNetwork(nodeId) {
            if (!nodeId || !this.displayNetwork.nodes.length) return;
            const { keepNodes, keepEdges } = neighborhoodOf(this.displayNetwork, nodeId);
            const nodes = this.displayNetwork.nodes.filter((node) => keepNodes.has(node.id));
            const edges = this.displayNetwork.edges.filter((edge) => keepEdges.has(edge.id));
            if (!nodes.length) return;
            this.highlightedNodeId = nodeId;
            this.hideTooltip();
            this.mountNetwork(nodes, edges);
        },
        showFullNetwork() {
            if (!this.isHighlightView) return;
            this.highlightedNodeId = null;
            this.hideTooltip();
            if (!this.graph || !this.graph.nodes || !this.graph.nodes.length) return;
            this.displayNetwork = toDisplayNetwork(this.graph, this.visibleNodeIds);
            this.mountNetwork(this.displayNetwork.nodes, this.displayNetwork.edges);
        },
        detachNetworkEvents() {
            if (!this.visNetwork) return;
            this.visNetwork.off("zoom");
            this.visNetwork.off("hoverNode");
            this.visNetwork.off("blurNode");
        },
        attachNetworkEvents() {
            if (!this.visNetwork) return;
            this.visNetwork.on("zoom", (params) => {
                if (this.suppressZoomSync) return;
                const scale = Number(params && params.scale);
                if (Number.isFinite(scale)) {
                    this.zoomLevel = Math.min(this.zoomMax, Math.max(this.zoomMin, scale));
                }
            });
            this.visNetwork.on("hoverNode", (params) => {
                this.clearTooltipTimer();
                const nodeId = params && params.node;
                if (!nodeId) return;
                const node = this.nodeDataSet && this.nodeDataSet.get(nodeId);
                const label = (node && (node.fullLabel || node.label)) || String(nodeId);
                const coords = this.pointerClientCoords(params);
                this.showTooltip(nodeId, label, coords.clientX, coords.clientY);
            });
            this.visNetwork.on("blurNode", () => {
                if (this.tooltipPinned) return;
                this.scheduleHideTooltip();
            });
        },
        pointerClientCoords(params) {
            const event =
                params && params.event && params.event.srcEvent
                    ? params.event.srcEvent
                    : params && params.event;
            const container = this.$refs.container;
            const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
            const pointer = params && params.pointer && params.pointer.DOM;
            return {
                clientX:
                    event && event.clientX != null
                        ? event.clientX
                        : rect.left + (pointer ? pointer.x : 0),
                clientY:
                    event && event.clientY != null
                        ? event.clientY
                        : rect.top + (pointer ? pointer.y : 0),
            };
        },
        positionTooltip(clientX, clientY) {
            const wrap = this.$refs.canvasWrap;
            if (!wrap) return;
            const rect = wrap.getBoundingClientRect();
            const maxLeft = Math.max(8, rect.width - 280);
            const maxTop = Math.max(8, rect.height - 88);
            this.hoverTooltip.left = Math.min(Math.max(8, clientX - rect.left + 12), maxLeft);
            this.hoverTooltip.top = Math.min(Math.max(8, clientY - rect.top + 12), maxTop);
        },
        showTooltip(nodeId, label, clientX, clientY) {
            this.hoverTooltip.visible = true;
            this.hoverTooltip.nodeId = nodeId;
            this.hoverTooltip.label = label;
            this.positionTooltip(clientX, clientY);
        },
        hideTooltip() {
            this.clearTooltipTimer();
            this.tooltipPinned = false;
            this.hoverTooltip.visible = false;
            this.hoverTooltip.nodeId = null;
            this.hoverTooltip.label = "";
        },
        scheduleHideTooltip() {
            this.clearTooltipTimer();
            this.tooltipHideTimer = setTimeout(() => {
                if (!this.tooltipPinned) this.hideTooltip();
            }, 160);
        },
        clearTooltipTimer() {
            if (this.tooltipHideTimer) {
                clearTimeout(this.tooltipHideTimer);
                this.tooltipHideTimer = null;
            }
        },
        onCanvasPointerLeave(event) {
            const wrap = this.$refs.canvasWrap;
            const next = event.relatedTarget;
            if (wrap && next && wrap.contains(next)) return;
            if (!this.tooltipPinned) this.scheduleHideTooltip();
        },
        onTooltipEnter() {
            this.clearTooltipTimer();
            this.tooltipPinned = true;
        },
        onTooltipLeave() {
            this.tooltipPinned = false;
            this.scheduleHideTooltip();
        },
        onHighlightAction() {
            if (this.isHighlightView) return;
            const nodeId = this.hoverTooltip.nodeId;
            if (!nodeId) return;
            this.hideTooltip();
            this.showHighlightNetwork(nodeId);
        },
        onZoomInput() {
            this.applyZoom(this.zoomLevel);
        },
        applyZoom(scale) {
            if (!this.visNetwork) return;
            const nextScale = Math.min(this.zoomMax, Math.max(this.zoomMin, Number(scale) || 1));
            this.suppressZoomSync = true;
            this.visNetwork.moveTo({ scale: nextScale, animation: false });
            this.suppressZoomSync = false;
        },
        syncZoomFromNetwork() {
            if (!this.visNetwork) return;
            const scale = Number(this.visNetwork.getScale());
            if (Number.isFinite(scale)) {
                this.zoomLevel = Math.min(this.zoomMax, Math.max(this.zoomMin, scale));
            }
        },
        fitNetworkView() {
            if (!this.visNetwork) return;
            this.visNetwork.fit({ animation: false, padding: 48 });
            this.syncZoomFromNetwork();
            this.viewportReady = true;
        },
        captureViewport() {
            if (!this.visNetwork) return null;
            return {
                scale: this.visNetwork.getScale(),
                position: this.visNetwork.getViewPosition(),
            };
        },
        restoreViewport(viewport) {
            if (!this.visNetwork || !viewport || !viewport.position) return;
            const scale = Number(viewport.scale);
            if (!Number.isFinite(scale)) return;
            this.suppressZoomSync = true;
            this.visNetwork.moveTo({
                scale,
                position: { ...viewport.position },
                animation: false,
            });
            this.suppressZoomSync = false;
            this.zoomLevel = Math.min(this.zoomMax, Math.max(this.zoomMin, scale));
        },
        handleCanvasResize() {
            if (!this.visNetwork || !this.viewportReady) return;
            const viewport = this.captureViewport();
            requestAnimationFrame(() => {
                this.restoreViewport(viewport);
                if (this.visNetwork) this.visNetwork.redraw();
            });
        },
        observeResize() {
            const element = this.$refs.canvasWrap;
            if (!element || typeof ResizeObserver === "undefined") return;
            this.resizeObserver = new ResizeObserver(() => {
                this.handleCanvasResize();
            });
            this.resizeObserver.observe(element);
        },
    },
};
</script>

<style scoped>
.scp-kgnet {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.scp-kgnet-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
}

.scp-kgnet-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-kgnet-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.scp-kgnet-swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.scp-kgnet-canvas-wrap {
    position: relative;
}

.scp-kgnet-canvas {
    width: 100%;
    height: 520px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
}

.scp-kgnet-back {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 24px;
    padding: 0 8px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    color: var(--cfde-blue, #2c5c97);
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
}

.scp-kgnet-back:hover {
    color: #fff;
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
}

.scp-kgnet-zoom {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.scp-kgnet-zoom-fit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 24px;
    padding: 0 8px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
}

.scp-kgnet-zoom-fit:hover {
    color: #fff;
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
}

.scp-kgnet-zoom-slider {
    width: 96px;
    height: 8px;
    margin: 0;
    accent-color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.scp-kgnet-tooltip {
    position: absolute;
    z-index: 3;
    max-width: 260px;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    pointer-events: auto;
}

.scp-kgnet-tooltip-label {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
    overflow-wrap: anywhere;
}

.scp-kgnet-tooltip-action {
    display: block;
    margin: 8px 0 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--cfde-blue, #2c5c97);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    cursor: pointer;
}

.scp-kgnet-tooltip-action:hover {
    color: var(--cfde-orange, #e07b39);
}
</style>
