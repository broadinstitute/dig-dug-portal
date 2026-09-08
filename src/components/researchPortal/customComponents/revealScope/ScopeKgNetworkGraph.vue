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
        <div ref="canvasWrap" class="scp-kgnet-canvas-wrap">
            <div
                ref="container"
                class="scp-kgnet-canvas"
                role="img"
                aria-label="Gene, gene set, factor, and trait network"
            />
        </div>
    </div>
</template>

<script>
import { Network } from "vis-network";
import { DataSet } from "vis-data";

const COLUMN_ORDER = ["gene", "geneSet", "factor", "trait"];
const COLUMN_LEVEL = {
    gene: 0,
    geneSet: 1,
    factor: 2,
    trait: 3,
};
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
const LABEL_PLACEMENT = {
    gene: "left",
    geneSet: "left",
    factor: "right",
    trait: "right",
};
const EDGE_COLOR = "#b0a890";
const NODE_SIZE = 9;
const LABEL_GAP = 6;
const LABEL_FONT = '13px Inter, "Segoe UI", system-ui, sans-serif';
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;
const CANVAS_HEIGHT = 520;
const MAX_NODES_BY_TYPE = {
    gene: 8,
    geneSet: 12,
    factor: 8,
    trait: 12,
};

function truncateLabel(text, max = 22) {
    const value = String(text || "");
    if (value.length <= max) return value;
    return `${value.slice(0, max - 1)}…`;
}

function createNodeCtxRenderer({ displayLabel, backgroundColor, borderColor, size, labelPlacement }) {
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
                if (labelPlacement === "left") {
                    ctx.textAlign = "right";
                    ctx.textBaseline = "middle";
                    ctx.fillText(displayLabel, x - size - LABEL_GAP, y);
                    return;
                }
                if (labelPlacement === "right") {
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    ctx.fillText(displayLabel, x + size + LABEL_GAP, y);
                    return;
                }
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
            resizeObserver: null,
            zoomLevel: 1,
            zoomMin: ZOOM_MIN,
            zoomMax: ZOOM_MAX,
            zoomStep: ZOOM_STEP,
            suppressZoomSync: false,
            viewportReady: false,
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
                this.renderNetwork();
            },
        },
    },
    mounted() {
        this.observeResize();
        this.renderNetwork();
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.detachNetworkEvents();
        if (this.visNetwork) {
            this.visNetwork.destroy();
            this.visNetwork = null;
        }
    },
    computed: {
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
    },
    methods: {
        nodeLevel(node) {
            return Object.prototype.hasOwnProperty.call(COLUMN_LEVEL, node.type)
                ? COLUMN_LEVEL[node.type]
                : 0;
        },
        toVisNodes() {
            const visible = this.visibleNodeIds;
            return (this.graph.nodes || [])
                .filter((node) => visible.has(node.id))
                .map((node) => {
                    const color = COLUMN_COLORS[node.type] || COLUMN_COLORS.trait;
                    const fullLabel = node.label || node.id;
                    const displayLabel = truncateLabel(fullLabel);
                    const labelPlacement = LABEL_PLACEMENT[node.type] || "right";
                    return {
                        id: node.id,
                        label: "",
                        title: fullLabel,
                        level: this.nodeLevel(node),
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
                            labelPlacement,
                        }),
                    };
                });
        },
        toVisEdges() {
            const visible = this.visibleNodeIds;
            const levelById = {};
            (this.graph.nodes || []).forEach((node) => {
                levelById[node.id] = this.nodeLevel(node);
            });
            return (this.graph.edges || [])
                .filter(
                    (edge) =>
                        edge.source &&
                        edge.target &&
                        edge.source !== edge.target &&
                        visible.has(edge.source) &&
                        visible.has(edge.target)
                )
                .map((edge, index) => {
                    const sourceLevel = levelById[edge.source];
                    const targetLevel = levelById[edge.target];
                    const reverse =
                        sourceLevel != null && targetLevel != null && sourceLevel > targetLevel;
                    const from = reverse ? edge.target : edge.source;
                    const to = reverse ? edge.source : edge.target;
                    const weight = edge.weight == null ? "" : ` (weight ${edge.weight})`;
                    return {
                        id: `${edge.type || "edge"}|${from}|${to}|${index}`,
                        from,
                        to,
                        title: `${edge.type || "link"}${weight}`,
                        arrows: { to: { enabled: true, scaleFactor: 0.65 } },
                        color: {
                            color: EDGE_COLOR,
                            highlight: EDGE_COLOR,
                            hover: EDGE_COLOR,
                        },
                        width: 1,
                    };
                });
        },
        renderNetwork() {
            if (!this.$refs.container) return;
            this.detachNetworkEvents();
            if (this.visNetwork) {
                this.visNetwork.destroy();
                this.visNetwork = null;
            }
            this.viewportReady = false;
            if (!this.graph || !this.graph.nodes || !this.graph.nodes.length) return;

            const nodes = new DataSet(this.toVisNodes());
            const edges = new DataSet(this.toVisEdges());
            this.visNetwork = new Network(
                this.$refs.container,
                { nodes, edges },
                {
                    layout: {
                        hierarchical: {
                            enabled: true,
                            direction: "LR",
                            sortMethod: "directed",
                            levelSeparation: 220,
                            nodeSpacing: 48,
                            treeSpacing: 56,
                            blockShifting: true,
                            edgeMinimization: true,
                            parentCentralization: true,
                        },
                    },
                    physics: { enabled: false },
                    interaction: {
                        dragNodes: false,
                        dragView: true,
                        zoomView: true,
                        hover: true,
                        hoverConnectedEdges: false,
                        selectable: false,
                    },
                    edges: {
                        chosen: false,
                        arrowStrikethrough: false,
                        color: {
                            color: EDGE_COLOR,
                            highlight: EDGE_COLOR,
                            hover: EDGE_COLOR,
                        },
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
                }
            );
            this.attachNetworkEvents();
            this.visNetwork.once("stabilized", () => {
                this.fitNetworkView();
            });
            this.$nextTick(() => {
                requestAnimationFrame(() => this.fitNetworkView());
            });
        },
        detachNetworkEvents() {
            if (!this.visNetwork) return;
            this.visNetwork.off("zoom");
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
</style>
