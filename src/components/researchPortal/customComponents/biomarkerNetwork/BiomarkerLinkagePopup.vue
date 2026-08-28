<template>
    <div
        class="blp"
        :style="panelStyle"
        @mouseenter="$emit('mouseenter')"
        @mouseleave="$emit('mouseleave')"
    >
        <div class="blp-title">{{ title }}</div>
        <div v-if="subtitle" class="blp-subtitle">{{ subtitle }}</div>
        <div class="blp-canvas-wrap">
            <div ref="container" class="blp-canvas" :style="{ height: height + 'px' }"></div>
            <div class="blp-node-labels" aria-hidden="true">
                <div
                    v-for="item in labelOverlays"
                    :key="item.id"
                    class="blp-node-label blp-node-label--below"
                    :style="{ left: item.x + 'px', top: item.y + 'px' }"
                >
                    {{ item.text }}
                </div>
            </div>
            <div
                v-if="tooltip.visible"
                class="blp-tooltip"
                :class="'blp-tooltip--' + tooltip.placement"
                :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
            >
                {{ tooltip.text }}
            </div>
        </div>
        <div class="blp-legend">
            <span v-for="item in legendItems" :key="item.type" class="blp-legend-item">
                <i class="blp-swatch" :style="{ backgroundColor: item.color }" aria-hidden="true" />
                {{ item.label }}
            </span>
        </div>
    </div>
</template>

<script>
import { Network } from "vis-network";
import { DataSet } from "vis-data";

const TYPE_COLORS = {
    Biomarker: "#e4572e",
    Factor: "#377eb8",
    Phenotype: "#e41a1c",
    Gene: "#b9a0c4",
    MappedGene: "#984ea3",
};
const NODE_BORDER = "#ffffff";
const EDGE_COLOR = "#b3b3b3";
const LABEL_GAP = 6;
const STATIC_LABEL_LIMIT = 14;
const TOOLTIP_GAP = 8;

function truncate(text, limit = 14) {
    const s = String(text == null ? "" : text);
    return s.length > limit ? `${s.slice(0, limit - 2)}…` : s;
}

export default {
    name: "BiomarkerLinkagePopup",
    props: {
        graph: {
            type: Object,
            default: () => ({ nodes: [], edges: [] }),
        },
        title: {
            type: String,
            default: "Associated ↔ shared gene map",
        },
        subtitle: {
            type: String,
            default: "",
        },
        left: { type: Number, default: 0 },
        top: { type: Number, default: 0 },
        height: { type: Number, default: 220 },
        width: { type: Number, default: 360 },
    },
    data() {
        return {
            tooltip: { visible: false, x: 0, y: 0, text: "", placement: "right" },
            labelOverlays: [],
        };
    },
    created() {
        this.network = null;
        this.nodesDataSet = null;
        this.edgesDataSet = null;
        this.fullNodeLabels = {};
        this.fullEdgeLabels = {};
        this.nodeLabelMeta = {};
    },
    computed: {
        panelStyle() {
            return {
                left: `${this.left}px`,
                top: `${this.top}px`,
                width: `${this.width}px`,
            };
        },
        legendItems() {
            const labels = {
                Biomarker: "Biomarker",
                Factor: "Mechanism",
                Phenotype: "Disease",
                Gene: "Associated gene",
                MappedGene: "Mapped shared gene",
            };
            const order = ["Biomarker", "Factor", "Phenotype", "MappedGene", "Gene"];
            const present = new Set();
            (this.graph.nodes || []).forEach((n) => {
                if (!n || n.type !== "Gene") {
                    if (n && n.type) present.add(n.type);
                    return;
                }
                present.add(
                    n.metadata && n.metadata.isShared ? "MappedGene" : "Gene"
                );
            });
            return order
                .filter((type) => present.has(type))
                .map((type) => ({
                    type,
                    color: TYPE_COLORS[type],
                    label: labels[type] || type,
                }));
        },
    },
    watch: {
        graph: {
            deep: true,
            handler() {
                this.applyGraph(true);
            },
        },
    },
    mounted() {
        document.body.appendChild(this.$el);
        this.$nextTick(this.initNetwork);
    },
    beforeDestroy() {
        this.teardownNetwork();
        if (this.$el && this.$el.parentNode === document.body) {
            document.body.removeChild(this.$el);
        }
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
                    autoResize: true,
                    nodes: {
                        shape: "dot",
                        borderWidth: 1.5,
                        size: 14,
                        font: { size: 0, color: "transparent" },
                        color: {
                            border: NODE_BORDER,
                            highlight: { border: NODE_BORDER },
                        },
                    },
                    edges: {
                        color: { color: EDGE_COLOR, highlight: "#888", inherit: false },
                        arrows: { to: { enabled: true, scaleFactor: 0.45 } },
                        font: { size: 9, align: "middle", strokeWidth: 0 },
                        smooth: { enabled: true, type: "continuous", roundness: 0.35 },
                        width: 1,
                    },
                    layout: {
                        hierarchical: {
                            enabled: true,
                            direction: "LR",
                            sortMethod: "directed",
                            levelSeparation: 90,
                            nodeSpacing: 70,
                        },
                    },
                    physics: {
                        enabled: false,
                    },
                    interaction: {
                        hover: true,
                        dragNodes: true,
                        dragView: true,
                        zoomView: true,
                        selectConnectedEdges: false,
                        hoverConnectedEdges: false,
                    },
                }
            );

            this.network.on("hoverNode", this.onHoverNode);
            this.network.on("blurNode", this.hideTooltip);
            this.network.on("hoverEdge", this.onHoverEdge);
            this.network.on("blurEdge", this.hideTooltip);
            this.network.on("dragStart", this.hideTooltip);
            this.network.on("dragging", this.hideTooltip);
            this.network.on("afterDrawing", this.updateLabelOverlays);
            this.network.on("dragEnd", this.updateLabelOverlays);
            this.network.on("zoom", this.updateLabelOverlays);

            this.applyGraph(true);
        },
        teardownNetwork() {
            if (this.network) {
                this.network.destroy();
                this.network = null;
            }
            this.nodesDataSet = null;
            this.edgesDataSet = null;
            this.fullNodeLabels = {};
            this.fullEdgeLabels = {};
            this.nodeLabelMeta = {};
            this.labelOverlays = [];
        },
        isMechanismNode(node) {
            return node && (node.level === 3 || node.type === "Factor");
        },
        nodeLabelSide(node) {
            return this.isMechanismNode(node) ? "left" : "right";
        },
        nodeRadius(node) {
            if (!node) return 14;
            if (node.type === "Factor") return 18;
            if (node.type === "Biomarker") return 16;
            return 14;
        },
        nodeOverlayText(node) {
            if (!node) return "";
            return truncate(node.fullLabel || node.label || node.id, STATIC_LABEL_LIMIT);
        },
        rebuildLabelMaps() {
            this.fullNodeLabels = {};
            this.nodeLabelMeta = {};
            (this.graph.nodes || []).forEach((n) => {
                if (!n || n.id == null) return;
                const id = String(n.id);
                const text = n.fullLabel || n.label || id;
                this.fullNodeLabels[id] = text;
                this.nodeLabelMeta[id] = {
                    text: this.nodeOverlayText(n),
                    tooltipPlacement: this.nodeLabelSide(n),
                    radius: this.nodeRadius(n),
                };
            });
            this.fullEdgeLabels = {};
            (this.graph.edges || []).forEach((e) => {
                if (!e || e.id == null || !e.label) return;
                this.fullEdgeLabels[String(e.id)] = String(e.label);
            });
        },
        updateLabelOverlays() {
            if (!this.network || !this.nodeLabelMeta) {
                this.labelOverlays = [];
                return;
            }
            let positions;
            try {
                positions = this.network.getPositions();
            } catch (e) {
                return;
            }
            const overlays = [];
            Object.keys(this.nodeLabelMeta).forEach((id) => {
                const pos = positions[id];
                const meta = this.nodeLabelMeta[id];
                if (!pos || !meta) return;
                const dom = this.network.canvasToDOM({ x: pos.x, y: pos.y });
                const offset = (meta.radius || 14) + LABEL_GAP;
                overlays.push({
                    id,
                    text: meta.text,
                    x: dom.x,
                    y: dom.y + offset,
                });
            });
            this.labelOverlays = overlays;
        },
        pointerPosition(params) {
            const container = this.$refs.container;
            if (!container) return { x: 0, y: 0 };
            const rect = container.getBoundingClientRect();
            const ev =
                params &&
                params.event &&
                (params.event.srcEvent || params.event);
            const clientX = ev && ev.clientX != null ? ev.clientX : rect.left;
            const clientY = ev && ev.clientY != null ? ev.clientY : rect.top;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top,
            };
        },
        showTooltip(params, text, placement = "right") {
            const label = String(text || "").trim();
            if (!label) return;
            const point = this.pointerPosition(params);
            const side = placement === "left" ? "left" : "right";
            const gap = TOOLTIP_GAP;
            let x = side === "left" ? point.x - gap : point.x + gap;
            let y = point.y + gap;
            const container = this.$refs.container;
            if (container) {
                const height = container.clientHeight || 0;
                if (y + 48 > height) {
                    y = Math.max(gap, height - 48);
                }
            }
            this.tooltip = {
                visible: true,
                x,
                y,
                text: label,
                placement: side,
            };
        },
        hideTooltip() {
            if (this.tooltip.visible) {
                this.tooltip = { ...this.tooltip, visible: false };
            }
        },
        onHoverNode(params) {
            const nodeId = params && params.node;
            if (nodeId == null) return;
            const key = String(nodeId);
            const text = this.fullNodeLabels[key];
            if (!text) return;
            const meta = this.nodeLabelMeta[key];
            this.showTooltip(params, text, (meta && meta.tooltipPlacement) || "right");
        },
        onHoverEdge(params) {
            const edgeId = params && params.edge;
            if (edgeId == null) return;
            const text = this.fullEdgeLabels[String(edgeId)];
            if (!text) return;
            this.showTooltip(params, text, "right");
        },
        applyGraph(fit) {
            if (!this.nodesDataSet || !this.edgesDataSet) return;

            this.rebuildLabelMaps();
            this.hideTooltip();

            const nodes = (this.graph.nodes || []).map((n) => {
                const isMappedGene =
                    n.type === "Gene" && n.metadata && n.metadata.isShared;
                const colorKey = isMappedGene ? "MappedGene" : n.type;
                return {
                    id: n.id,
                    label: "",
                    level: n.level,
                    color: {
                        background: TYPE_COLORS[colorKey] || "#999",
                        border: isMappedGene ? "#e4572e" : NODE_BORDER,
                        highlight: {
                            background: TYPE_COLORS[colorKey] || "#999",
                            border: isMappedGene ? "#e4572e" : NODE_BORDER,
                        },
                    },
                    borderWidth: isMappedGene ? 2.5 : 1.5,
                    size: this.nodeRadius(n),
                };
            });

            const edges = (this.graph.edges || []).map((e) => ({
                id: e.id,
                from: e.source,
                to: e.target,
                label: e.label ? truncate(e.label, 20) : undefined,
                title: e.label || "",
                arrows: e.bidirectional
                    ? {
                          to: { enabled: true, scaleFactor: 0.45 },
                          from: { enabled: true, scaleFactor: 0.45 },
                      }
                    : { to: { enabled: true, scaleFactor: 0.45 } },
            }));

            this.nodesDataSet.clear();
            this.edgesDataSet.clear();
            if (nodes.length) this.nodesDataSet.add(nodes);
            if (edges.length) this.edgesDataSet.add(edges);

            if (fit && this.network) {
                this.$nextTick(() => {
                    this.network.fit({
                        animation: false,
                        padding: { left: 16, top: 16, right: 16, bottom: 28 },
                    });
                    this.$nextTick(this.updateLabelOverlays);
                });
            } else {
                this.updateLabelOverlays();
            }
        },
    },
};
</script>

<style scoped>
.blp {
    position: fixed;
    z-index: 10050;
    background: #fff;
    border: 1px solid #e6e1d6;
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    padding: 8px 10px 10px;
    pointer-events: auto;
}

.blp-title {
    font-size: 12px;
    font-weight: 600;
    color: #333;
    margin-bottom: 2px;
}

.blp-subtitle {
    font-size: 11px;
    color: #666;
    margin-bottom: 6px;
}

.blp-canvas-wrap {
    position: relative;
}

.blp-canvas {
    width: 100%;
    border: 1px solid #eee;
    border-radius: 4px;
    background: #fafafa;
}

.blp-node-labels {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

.blp-node-label {
    position: absolute;
    font-size: 11px;
    line-height: 1.25;
    color: #333;
    pointer-events: none;
}

.blp-node-label--below {
    transform: translate(-50%, 0);
    text-align: center;
    white-space: nowrap;
    max-width: 72px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.blp-tooltip {
    position: absolute;
    z-index: 2;
    max-width: 280px;
    padding: 6px 9px;
    border-radius: 4px;
    background: rgba(33, 33, 33, 0.94);
    color: #fff;
    font-size: 12px;
    line-height: 1.4;
    pointer-events: none;
    word-break: break-word;
}

.blp-tooltip--right {
    transform: translate(0, 0);
}

.blp-tooltip--left {
    transform: translate(-100%, 0);
}

.blp-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-top: 6px;
}

.blp-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: #666;
}

.blp-swatch {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
}
</style>
