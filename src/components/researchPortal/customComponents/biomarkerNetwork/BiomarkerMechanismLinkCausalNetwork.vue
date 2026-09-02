<template>
    <div v-if="hasNetwork" class="bn-causal-network">
        <div class="bn-causal-network__legend">
            <span v-for="item in legendItems" :key="item.type" class="bn-causal-network__legend-item">
                <span
                    class="bn-causal-network__swatch"
                    :style="{ backgroundColor: item.color }"
                    aria-hidden="true"
                />
                {{ item.label }}
            </span>
        </div>
        <div class="bn-causal-network__wrapper">
            <div ref="container" class="bn-causal-network__canvas" :style="{ height: height + 'px' }"></div>
            <div v-if="ready" class="bn-causal-network__zoom">
                <label class="bn-causal-network__zoom-label" for="bn-causal-zoom-range">Zoom</label>
                <input
                    id="bn-causal-zoom-range"
                    v-model.number="zoom"
                    type="range"
                    class="bn-causal-network__zoom-range"
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
import {
    buildCausalPathNetwork,
    causalPathNetworkHasContent,
} from "./biomarkerMechanismLinkNetwork.js";

const NODE_COLORS = {
    Biomarker: { background: "#e4572e", border: "#c94a24" },
    Gene: { background: "#984ea3", border: "#7a3d82" },
    Mechanism: { background: "#377eb8", border: "#2a6294" },
};

const LEGEND_ITEMS = [
    { type: "Biomarker", label: "Biomarker", color: NODE_COLORS.Biomarker.background },
    { type: "Gene", label: "Gene", color: NODE_COLORS.Gene.background },
    { type: "Mechanism", label: "Mechanism", color: NODE_COLORS.Mechanism.background },
];

export default {
    name: "BiomarkerMechanismLinkCausalNetwork",
    props: {
        summary: {
            type: Object,
            default: null,
        },
        mechanismLabel: {
            type: String,
            default: "Mechanism",
        },
        height: {
            type: Number,
            default: 320,
        },
    },
    data() {
        return {
            network: null,
            nodesDataSet: null,
            edgesDataSet: null,
            legendItems: LEGEND_ITEMS,
            ready: false,
            zoom: 1,
            zoomMin: 0.25,
            zoomMax: 2.5,
        };
    },
    computed: {
        graphInput() {
            return buildCausalPathNetwork(this.summary, this.mechanismLabel);
        },
        hasNetwork() {
            return causalPathNetworkHasContent(this.graphInput);
        },
    },
    watch: {
        graphInput: {
            deep: true,
            handler() {
                this.$nextTick(() => this.renderNetwork());
            },
        },
    },
    mounted() {
        this.renderNetwork();
    },
    beforeDestroy() {
        this.destroyNetwork();
    },
    methods: {
        destroyNetwork() {
            if (this.network) {
                this.network.destroy();
                this.network = null;
            }
            this.nodesDataSet = null;
            this.edgesDataSet = null;
            this.ready = false;
        },
        renderNetwork() {
            this.destroyNetwork();
            if (!this.hasNetwork || !this.$refs.container) return;

            const visNodes = this.graphInput.nodes.map((node) => {
                const type = node.type || "Gene";
                const colors = NODE_COLORS[type] || NODE_COLORS.Gene;
                const size = type === "Mechanism" ? 24 : type === "Gene" ? 18 : 14;
                return {
                    id: node.id,
                    label: node.label,
                    title: node.title || node.label,
                    level: node.level,
                    color: {
                        background: colors.background,
                        border: colors.border,
                        highlight: {
                            background: colors.background,
                            border: colors.border,
                        },
                    },
                    font: { size: 11, color: "#333" },
                    shape: "dot",
                    size,
                    borderWidth: 2,
                };
            });

            const visEdges = this.graphInput.edges.map((edge) => ({
                id: edge.id,
                from: edge.from,
                to: edge.to,
                arrows: { to: { enabled: true, scaleFactor: 0.55 } },
                color: { color: "#b3b3b3", highlight: "#888" },
                width: 1.2,
                smooth: { type: "cubicBezier", forceDirection: "vertical", roundness: 0.35 },
            }));

            this.nodesDataSet = new DataSet(visNodes);
            this.edgesDataSet = new DataSet(visEdges);
            this.ready = false;
            this.zoom = 1;

            this.network = new Network(
                this.$refs.container,
                { nodes: this.nodesDataSet, edges: this.edgesDataSet },
                {
                    autoResize: true,
                    interaction: {
                        hover: true,
                        tooltipDelay: 120,
                        dragView: true,
                        zoomView: false,
                    },
                    layout: {
                        hierarchical: {
                            enabled: true,
                            direction: "DU",
                            levelSeparation: 120,
                            nodeSpacing: 80,
                            sortMethod: "directed",
                        },
                    },
                    physics: {
                        enabled: true,
                        hierarchicalRepulsion: {
                            nodeDistance: 110,
                        },
                    },
                }
            );

            this.network.on("zoom", this.onZoomChanged);

            this.network.once("stabilizationIterationsDone", () => {
                if (!this.network) return;
                this.network.setOptions({ physics: false });
                this.network.fit({ padding: 36, animation: false });
                this.syncZoomFromNetwork();
                this.ready = true;
            });
        },
        syncZoomFromNetwork() {
            if (!this.network) return;
            try {
                this.zoom = Math.max(
                    this.zoomMin,
                    Math.min(this.zoomMax, this.network.getScale())
                );
            } catch (e) {
                /* layout not ready */
            }
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
.bn-causal-network {
    margin: 10px 0 12px;
    border: 1px solid #ececec;
    border-radius: 4px;
    background: #fff;
    overflow: hidden;
}

.bn-causal-network__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    padding: 8px 10px;
    border-bottom: 1px solid #ececec;
    background: #fafafa;
}

.bn-causal-network__legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #555;
}

.bn-causal-network__swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.bn-causal-network__wrapper {
    position: relative;
}

.bn-causal-network__canvas {
    width: 100%;
    min-height: 220px;
}

.bn-causal-network__zoom {
    position: absolute;
    right: 10px;
    bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.92);
    font-size: 11px;
    color: #666;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.bn-causal-network__zoom-label {
    margin: 0;
    white-space: nowrap;
}

.bn-causal-network__zoom-range {
    width: 88px;
    margin: 0;
}
</style>
