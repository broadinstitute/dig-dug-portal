<template>
    <div class="factor-base-reveal-network">
        <div v-if="legendItems.length" class="network-legend mb-2">
            <span
                v-for="(item, i) in legendItems"
                :key="i"
                class="legend-item"
                :style="{ borderLeftColor: item.color }"
            >
                {{ item.label }}
            </span>
        </div>
        <div class="network-wrapper">
            <div ref="container" class="network-container" :style="{ height: height + 'px' }"></div>
            <div v-if="visNetwork" class="zoom-slider-outer">
                <div class="zoom-slider-block">
                    <label class="zoom-slider-label">Zoom</label>
                    <input
                        v-model.number="zoomLevel"
                        type="range"
                        class="zoom-slider"
                        :min="zoomMin"
                        :max="zoomMax"
                        :step="zoomStep"
                        @input="applyZoom"
                    />
                </div>
                <template v-if="showPopupButton">
                    <span class="zoom-slider-divider" aria-hidden="true">|</span>
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary network-popup-btn"
                        aria-label="Open in larger view"
                        title="Open in larger view"
                        @click="$emit('open-popup')"
                    >
                        <b-icon icon="fullscreen"></b-icon>
                    </button>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import { Network } from "vis-network";
import { DataSet } from "vis-data";

const NODE_COLORS = {
    Phenotype: "#e41a1c",
    Factor: "#377eb8",
    Pathway: "#4daf4a",
    Gene: "#984ea3",
};
const GENE_GROUP_COLORS = {
    "High GWAS": "#d95f02",
    "High Functional": "#7570b3",
    "Genetic (Established)": "#d95f02",
    "Functional (Novel)": "#7570b3",
};
const DEFAULT_NODE_COLOR = "#999";
const DEFAULT_GENE_COLOR = NODE_COLORS.Gene;

export default {
    name: "FactorBaseRevealNetwork",
    props: {
        network: {
            type: Object,
            default: () => ({ nodes: [], edges: [] }),
        },
        genes: {
            type: Array,
            default: () => [],
        },
        width: { type: Number, default: 640 },
        height: { type: Number, default: 400 },
        showPopupButton: { type: Boolean, default: false },
    },
    data() {
        return {
            visNetwork: null,
            nodesDataSet: null,
            edgesDataSet: null,
            zoomLevel: 1,
            zoomMin: 0.2,
            zoomMax: 2,
            zoomStep: 0.05,
            nodeMap: {},
        };
    },
    computed: {
        geneNameToGroup() {
            const map = {};
            (this.genes || []).forEach((g) => {
                const name = g.gene != null ? String(g.gene).trim() : "";
                if (name) map[name] = g.group != null ? String(g.group).trim() : "";
            });
            return map;
        },
        legendItems() {
            const items = [];
            items.push(
                { label: "Phenotype", color: NODE_COLORS.Phenotype },
                { label: "Gene Set Cluster", color: NODE_COLORS.Factor },
                { label: "Gene Set", color: NODE_COLORS.Pathway }
            );
            const groupsUsed = new Set();
            (this.genes || []).forEach((g) => {
                if (g.group != null && String(g.group).trim()) groupsUsed.add(String(g.group).trim());
            });
            if (groupsUsed.size > 0) {
                groupsUsed.forEach((grp) => {
                    items.push({
                        label: `Gene (${grp})`,
                        color: GENE_GROUP_COLORS[grp] || DEFAULT_GENE_COLOR,
                    });
                });
            } else {
                items.push({ label: "Gene", color: DEFAULT_GENE_COLOR });
            }
            return items;
        },
    },
    watch: {
        network: {
            handler() {
                this.$nextTick(() => this.render());
            },
            deep: true,
        },
        genes: {
            handler() {
                this.$nextTick(() => this.render());
            },
            deep: true,
        },
    },
    mounted() {
        this.render();
    },
    beforeDestroy() {
        this.cleanup();
    },
    methods: {
        async exportSvg() {
            if (!this.visNetwork || !this.nodesDataSet || !this.edgesDataSet) return null;
            const nodeIds = this.nodesDataSet.getIds();
            if (!nodeIds || !nodeIds.length) return null;
            const positions = this.visNetwork.getPositions(nodeIds);
            const xs = [];
            const ys = [];
            nodeIds.forEach((id) => {
                const p = positions[id];
                if (!p) return;
                xs.push(p.x);
                ys.push(p.y);
            });
            if (!xs.length || !ys.length) return null;
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const padding = 50;
            const width = maxX - minX + padding * 2;
            const height = maxY - minY + padding * 2;

            const project = (p) => ({
                x: p.x - minX + padding,
                y: p.y - minY + padding,
            });

            const edgeIds = this.edgesDataSet.getIds();
            const edgeEls = edgeIds
                .map((id) => this.edgesDataSet.get(id))
                .filter(Boolean)
                .map((e) => {
                    const fromPos = positions[e.from];
                    const toPos = positions[e.to];
                    if (!fromPos || !toPos) return "";
                    const p1 = project(fromPos);
                    const p2 = project(toPos);
                    const title = e.title || "";
                    return `<g class="edge"><line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#999" stroke-width="1.5" stroke-opacity="0.6" />${
                        title
                            ? `<title>${String(title).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>`
                            : ""
                    }</g>`;
                })
                .join("");

            const nodeEls = nodeIds
                .map((id) => {
                    const node = this.nodesDataSet.get(id);
                    const pos = positions[id];
                    if (!node || !pos) return "";
                    const p = project(pos);
                    const r = (node.size || 18) * 1.1;
                    const fill = node.color && node.color.background ? node.color.background : "#999";
                    const stroke = node.color && node.color.border ? node.color.border : "#ffffff";
                    const label = node.label || node.id || "";
                    const safeLabel = String(label).replace(/&/g, "&amp;").replace(/</g, "&lt;");
                    return `<g class="node"><circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" /><text x="${
                        p.x
                    }" y="${p.y - r - 4}" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" fill="#333">${safeLabel}</text></g>`;
                })
                .join("");

            const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#fafafa" />
  <g class="edges">
    ${edgeEls}
  </g>
  <g class="nodes">
    ${nodeEls}
  </g>
</svg>`;

            return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        },
        async exportPng(scale = 2) {
            const container = this.$refs.container;
            if (!container) return null;
            const canvas = container.querySelector("canvas");
            if (!canvas) return null;
            const srcWidth = canvas.width;
            const srcHeight = canvas.height;
            if (!srcWidth || !srcHeight) return null;
            const outCanvas = document.createElement("canvas");
            outCanvas.width = srcWidth * scale;
            outCanvas.height = srcHeight * scale;
            const ctx = outCanvas.getContext("2d");
            if (!ctx) return null;
            ctx.scale(scale, scale);
            ctx.drawImage(canvas, 0, 0);
            return new Promise((resolve) => {
                outCanvas.toBlob(
                    (blob) => resolve(blob || null),
                    "image/png",
                    1.0
                );
            });
        },
        cleanup() {
            if (this.visNetwork) {
                this.visNetwork.destroy();
                this.visNetwork = null;
            }
            this.nodesDataSet = null;
            this.edgesDataSet = null;
        },
        buildVisNodes(nodes) {
            const geneToGroup = this.geneNameToGroup;
            return (nodes || []).map((n) => {
                const type = n.type || "Gene";
                let color = NODE_COLORS[type] || DEFAULT_NODE_COLOR;
                if (type === "Gene") {
                    const name = (n.id || n.label || "").toString().trim();
                    const group = geneToGroup[name];
                    if (group != null && group !== "") {
                        color = GENE_GROUP_COLORS[group] || DEFAULT_GENE_COLOR;
                    } else {
                        color = DEFAULT_GENE_COLOR;
                    }
                }
                const meta = n.metadata || {};
                const parts = [n.label || n.id, type];
                if (type === "Gene") {
                    const geneName = (n.id || n.label || "").toString().trim();
                    const geneEntry = (this.genes || []).find(
                        (g) => (g.gene != null ? String(g.gene).trim() : "") === geneName
                    );
                    const scores = geneEntry && geneEntry.scores ? geneEntry.scores : meta;
                    const combined = scores.combined ?? scores.c;
                    const gwas = scores.gwas ?? scores.g;
                    const functional = scores.functional ?? scores.f;
                    const combinedVal = meta.combined_score ?? meta.c ?? combined;
                    const gwasVal = meta.gwas_support ?? meta.g ?? gwas;
                    const funcVal = meta.functional_support ?? meta.f ?? functional;
                    parts.push(`Combined: ${combinedVal != null ? Number(combinedVal).toFixed(2) : "—"}`);
                    parts.push(`GWAS support: ${gwasVal != null ? Number(gwasVal).toFixed(2) : "—"}`);
                    parts.push(`Functional support: ${funcVal != null ? Number(funcVal).toFixed(2) : "—"}`);
                }
                const title = parts.join(" | ");
                const label = (n.label || n.id || "").toString();
                return {
                    id: n.id,
                    label: label.length > 12 ? label.slice(0, 10) + "…" : label,
                    title,
                    color: {
                        background: color,
                        border: "#fff",
                    },
                    font: {
                        size: 14,
                        color: "#333",
                    },
                    borderWidth: 1.5,
                    size: type === "Gene" ? 16 : 20,
                };
            });
        },
        buildVisEdges(edges) {
            const typeOrder = {
                "Gene": 0,
                "Pathway": 1,
                "Factor": 2,
                "Phenotype": 3
            };

            return (edges || []).map((e, i) => {
                const sourceNode = this.nodeMap[e.source];
                const targetNode = this.nodeMap[e.target];

                let from = e.source;
                let to = e.target;

                if (sourceNode && targetNode) {
                const sourceRank = typeOrder[sourceNode.type] ?? 0;
                const targetRank = typeOrder[targetNode.type] ?? 0;

                // enforce left → right flow
                if (sourceRank > targetRank) {
                        from = e.target;
                        to = e.source;
                    }
                }
                return{
                    id: `e-${i}-${from}-${to}`,
                    from: from,
                    to: to,
                    title: e.predicate || "",
                    //label: e.predicate || "",
                    width: 1.5,
                    color: { color: "#999", opacity: 0.6 },
                    smooth: { type: "continuous", roundness: 0.5 },
                    arrows: {
                        to: { 
                            enabled: true,
                            scaleFactor: 0.5,
                        }
                    }
                }
            });
        },
        render() {
            this.cleanup();
            const container = this.$refs.container;
            if (!container) return;

            console.log('Graph: network', this.network);

            const nodes = (this.network.nodes || []).map((n) => ({ ...n }));
            const edges = (this.network.edges || []).map((e) => ({
                source: e.source,
                target: e.target,
                predicate: e.predicate,
            }));

            if (nodes.length === 0) return;

            nodes.forEach(n => {
                this.nodeMap[n.id] = n;
            });

            const visNodes = this.buildVisNodes(nodes);
            const visEdges = this.buildVisEdges(edges);

            this.nodesDataSet = new DataSet(visNodes);
            this.edgesDataSet = new DataSet(visEdges);

            const data = {
                nodes: this.nodesDataSet,
                edges: this.edgesDataSet,
            };

            const options = {
                nodes: {
                    shape: "dot",
                    borderWidth: 1.5,
                    shadow: false,
                },
                edges: {
                    shadow: false,
                },
                physics: {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 200,
                        fit: true,
                    },
                    barnesHut: {
                        gravitationalConstant: -1200,
                        centralGravity: 0.06,
                        springLength: 120,
                        springConstant: 0.04,
                        damping: 0.3,
                        avoidOverlap: 0.5
                    },
                },
                interaction: {
                    hover: true,
                    tooltipDelay: 200,
                    dragNodes: true,
                    dragView: true,
                    zoomView: false,
                    zoomSpeed: 1,
                    navigationButtons: false,
                },
            };

            this.visNetwork = new Network(container, data, options);

            this.visNetwork.on("stabilizationIterationsDone", () => {
                this.visNetwork.setOptions({ physics: false });
                const scale = this.visNetwork.getScale();
                if (typeof scale === "number" && !Number.isNaN(scale)) {
                    this.zoomLevel = Math.max(this.zoomMin, Math.min(this.zoomMax, scale));
                }
            });

            this.visNetwork.fit({
                animation: {
                    duration: 600,
                    easingFunction: "easeInOutQuad",
                },
            });
        },
        applyZoom() {
            if (this.visNetwork && typeof this.zoomLevel === "number") {
                this.visNetwork.moveTo({
                    scale: this.zoomLevel,
                    animation: { duration: 0 },
                });
            }
        },
    },
};
</script>

<style scoped>
.factor-base-reveal-network {
    width: 100%;
}
.network-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: #555;
}
.legend-item {
    padding-left: 0.5rem;
    border-left: 3px solid #999;
}
.network-wrapper {
    position: relative;
    width: 100%;
}
.network-container {
    width: 100%;
    min-height: 200px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background: #fafafa;
}
.zoom-slider-outer {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #dee2e6;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.zoom-slider-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}
.zoom-slider-divider {
    color: #adb5bd;
    font-weight: bold;
    user-select: none;
    padding: 0 2px;
}
.network-popup-btn {
    padding: 2px 6px;
    line-height: 1;
}
.zoom-slider-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #555;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}
.zoom-slider {
    width: 100px;
    height: 6px;
    accent-color: #377eb8;
    cursor: pointer;
}
</style>
