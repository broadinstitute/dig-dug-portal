<template>
    <div class="factor-base-reveal-network">
        <div v-if="legendItems.length || showMetricLegends" class="network-legend mb-2">
            <div v-if="legendItems.length" class="network-legend-row">
                <span
                    v-for="(item, i) in legendItems"
                    :key="'c-' + i"
                    class="legend-item"
                >
                    <span
                        class="legend-swatch"
                        :style="{ backgroundColor: item.color }"
                        aria-hidden="true"
                    ></span>
                    {{ item.label }}
                </span>
            </div>
            <div v-if="showMetricLegends" class="network-legend-row network-legend-metrics">
                <span v-if="showNodeSizeLegend" class="legend-metric-item">
                    <span class="legend-size-demo" aria-hidden="true">
                        <span class="legend-size-circle legend-size-circle--sm"></span>
                        <span class="legend-size-circle legend-size-circle--lg"></span>
                    </span>
                    <span>{{ nodeSizeLegendText }}</span>
                </span>
                <span v-if="showEdgeLengthLegend" class="legend-metric-item">
                    <span class="legend-edge-demo" aria-hidden="true">
                        <span class="legend-edge-line legend-edge-line--short"></span>
                        <span class="legend-edge-line legend-edge-line--long"></span>
                    </span>
                    <span>{{ edgeLengthLegendText }}</span>
                </span>
            </div>
        </div>
        <div class="network-wrapper">
            <div ref="container" class="network-container" :style="{ height: height + 'px' }"></div>
            <div
                v-if="hoverTooltip.visible"
                class="network-hover-tooltip"
                :style="{ left: hoverTooltip.x + 'px', top: hoverTooltip.y + 'px' }"
                v-html="hoverTooltip.content"
            ></div>
            <div
                v-if="diseaseNodeMenu.visible"
                class="network-disease-action-menu"
                :style="{ left: diseaseNodeMenu.x + 'px', top: diseaseNodeMenu.y + 'px' }"
                role="menu"
                :aria-label="diseaseNodeMenuLabel"
                @mouseenter="cancelDiseaseMenuHide"
                @mouseleave="scheduleDiseaseMenuHide"
                @click.stop
            >
                <button
                    type="button"
                    class="network-disease-action-btn"
                    role="menuitem"
                    @click="onDiseaseMenuViewSharedGenes"
                >
                    View shared genes
                </button>
            </div>
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
                <template v-if="showHypothesisMapViewToggle">
                    <span class="zoom-slider-divider" aria-hidden="true">|</span>
                    <label class="hypothesis-map-original-label">
                        <input
                            type="checkbox"
                            class="hypothesis-map-original-input"
                            :checked="showOriginalHypothesisMap"
                            @change="$emit('hypothesis-original-map', $event.target.checked)"
                        />
                        Original map
                    </label>
                </template>
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
        <workflow-heatmap-node-action-menu
            v-if="nodeSelectionEnabled"
            :open="networkNodeMenuOpen"
            :target="networkNodeMenuTarget"
            :is-selected="networkNodeMenuIsSelected"
            :left="networkNodeMenuLeft"
            :top="networkNodeMenuTop"
            @close="closeNetworkNodeMenu"
            @toggle-select="onNetworkNodeMenuToggle"
        />
    </div>
</template>

<script>
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { resolveCfdeFactorClusterDisplayLabel } from "@/utils/cfdeUtils";
import { colorForGeneRole, DEFAULT_GENE_NODE_COLOR } from "@/utils/factorRevealGeneColors";
import WorkflowHeatmapNodeActionMenu from "./revealMultiQueryWorkflow/WorkflowHeatmapNodeActionMenu.vue";
import {
    SELECTION_HIGHLIGHT_ORANGE,
    buildNetworkEdgeSelectionNode,
    buildNetworkNodeSelectionNode,
    isNetworkEdgeHighlighted,
    isNetworkNodeHighlighted,
    isSelectionNodeSelected,
    toggleSelectionNode,
} from "./revealMultiQueryWorkflow/revealMqHeatmapSelection.js";
import {
    canonicalGeneNodeId,
    geneSymbolFromNodeId,
    normalizeGeneSymbol,
} from "./biomarkerNetwork/geneNodeIds.js";

const DATA_TAB_GENE_COLOR = { background: DEFAULT_GENE_NODE_COLOR, border: "#7a3d82" };

const NODE_COLORS = {
    Phenotype: "#e41a1c",
    Factor: "#377eb8",
    Pathway: "#4daf4a",
    Gene: DEFAULT_GENE_NODE_COLOR,
    Process: "#984ea3",
    Metabolite: "#ff7f00",
    Cell: "#7570b3",
    Drug: "#e7298a",
    Entity: "#666666",
};
const BIOLINK_COLORS = {
    "biolink:Gene": "#984ea3",
    "biolink:Protein": "#984ea3",
    "biolink:SmallMolecule": "#ff7f00",
    "biolink:ChemicalEntity": "#ff7f00",
    "biolink:ChemicalSubstance": "#ff7f00",
    "biolink:MolecularEntity": "#ff7f00",
    "biolink:BiologicalProcess": "#e41a1c",
    "biolink:PhenotypicFeature": "#e41a1c",
    "biolink:Disease": "#e41a1c",
};

function colorFromBiolinkClass(biolinkClass) {
    const raw = String(biolinkClass || "").trim();
    if (!raw) return null;
    if (BIOLINK_COLORS[raw]) return BIOLINK_COLORS[raw];
    const c = raw.toLowerCase().replace(/\s+/g, "");
    if (c.includes("gene") || c.includes("protein")) return BIOLINK_COLORS["biolink:Gene"];
    if (
        c.includes("smallmolecule") ||
        c.includes("chemicalentity") ||
        c.includes("chemicalsubstance") ||
        c.includes("molecularentity") ||
        c.includes("drug")
    ) {
        return BIOLINK_COLORS["biolink:SmallMolecule"];
    }
    if (c.includes("biologicalprocess") || c.includes("pathway") || c.includes("activity")) {
        return BIOLINK_COLORS["biolink:BiologicalProcess"];
    }
    if (c.includes("phenotypicfeature") || c.includes("disease") || c.includes("phenotype")) {
        return BIOLINK_COLORS["biolink:PhenotypicFeature"];
    }
    return null;
}
const DEFAULT_NODE_COLOR = "#999";
const DEFAULT_GENE_COLOR = DEFAULT_GENE_NODE_COLOR;
const GENES_FETCHED_DISEASE_BORDER = "#e67e22";

export default {
    name: "FactorBaseRevealNetwork",
    components: { WorkflowHeatmapNodeActionMenu },
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
        /** LLM biological mechanism map: keep causal order, show action labels, legend from node types. */
        isMechanismFlowMap: { type: Boolean, default: false },
        /**
         * Keep physics running after initial layout (cluster subtable / popup graphs).
         * Default Data-tab networks freeze after stabilize for a static layout.
         */
        keepPhysicsEnabled: { type: Boolean, default: false },
        /** Keep source→target as given (skip Phenotype/Factor rank reorder). */
        preserveEdgeDirection: { type: Boolean, default: false },
        /** When true, render Biolink-oriented legend labels/colors for mechanism flow maps. */
        isBiolinkMap: { type: Boolean, default: false },
        /** Show “Original map” checkbox between zoom and fullscreen (when Biolink network exists). */
        showHypothesisMapViewToggle: { type: Boolean, default: false },
        /** Checked ⇒ LLM/original spine; unchecked ⇒ Biolink map. */
        showOriginalHypothesisMap: { type: Boolean, default: false },
        /** Optional: scale Gene node size by this numeric metadata key (e.g., "gwas_support"). */
        geneNodeMetricKey: { type: String, default: "" },
        /** Optional: scale Pathway (gene set) node size by this numeric metadata key (e.g., "gene_set_score"). */
        geneSetNodeMetricKey: { type: String, default: "" },
        /** Optional: scale Phenotype (disease) node size by this numeric metadata key. */
        phenotypeNodeMetricKey: { type: String, default: "" },
        /** When true, color Gene nodes by metadata.gwas_support tiers (data-tab network view). */
        geneColorByGwasSupport: { type: Boolean, default: false },
        /** Optional: map edge distance from this numeric metadata key (e.g., "functional_support"). */
        edgeDistanceMetricKey: { type: String, default: "" },
        /** Shared heatmap/network selected nodes (shell-owned). */
        selectedNodes: { type: Array, default: () => [] },
        /** Enable click-to-select UX (data-tab graph only). */
        nodeSelectionEnabled: { type: Boolean, default: false },
        /**
         * When true (e.g. heatmap "Only selected" view), keep original node/edge colors
         * instead of painting the whole visible graph orange.
         */
        suppressSelectionHighlight: { type: Boolean, default: false },
        /**
         * Color Gene nodes by candidate_genes[].group (role palette). Off for supporting
         * networks so fills match the type legend (purple Gene).
         */
        useGeneRoleColors: { type: Boolean, default: true },
        /**
         * Paint search-anchor genes (candidate_genes[].is_input) with the Selected / Anchor color.
         */
        highlightAnchorGenes: { type: Boolean, default: false },
        /**
         * Remap node-type legend labels (e.g. Phenotype → Disease). Empty keeps REVEAL names.
         */
        legendTypeLabels: { type: Object, default: () => ({}) },
        /** Hide the Selected / Anchor swatch (biomarker network has no selection). */
        showSelectedAnchorLegend: { type: Boolean, default: true },
        /** Show a hover action menu on Phenotype (disease) nodes. */
        diseaseNodeMenuEnabled: { type: Boolean, default: false },
        /** Disease node ids that already have shared genes loaded in the network. */
        genesFetchedDiseaseIds: { type: Array, default: () => [] },
    },
    data() {
        return {
            visNetwork: null,
            nodesDataSet: null,
            edgesDataSet: null,
            zoomLevel: 1,
            zoomMin: 0.05,
            zoomMax: 2,
            zoomStep: 0.05,
            nodeMap: {},
            hoverTooltip: {
                visible: false,
                x: 0,
                y: 0,
                content: "",
            },
            baseVisNodeStyles: {},
            baseVisEdgeStyles: {},
            networkNodeMenuOpen: false,
            networkNodeMenuLeft: 0,
            networkNodeMenuTop: 0,
            networkNodeMenuTarget: null,
            lastNetworkSignature: "",
            pendingSelectionNodes: null,
            selectionRefreshRafId: null,
            resizeObserver: null,
            resizeFitTimer: null,
            lastContainerWidth: 0,
            isRendering: false,
            pendingResize: false,
            layoutFitTimer: null,
            diseaseNodeMenu: {
                visible: false,
                x: 0,
                y: 0,
                nodeId: "",
            },
            diseaseMenuHideTimer: null,
        };
    },
    computed: {
        diseaseNodeMenuLabel() {
            const node = this.nodeMap[this.diseaseNodeMenu.nodeId];
            return node && node.label ? `Actions for ${node.label}` : "Disease actions";
        },
        genesFetchedDiseaseIdSet() {
            return new Set((this.genesFetchedDiseaseIds || []).map((id) => String(id)));
        },
        networkNodeMenuIsSelected() {
            const sel = this.networkNodeMenuTarget && this.networkNodeMenuTarget.node;
            if (!sel) return false;
            return isSelectionNodeSelected(this.selectedNodes, sel);
        },
        geneNameToGroup() {
            const map = {};
            (this.genes || []).forEach((g) => {
                const name = g.gene != null ? String(g.gene).trim() : "";
                if (name) map[name] = g.group != null ? String(g.group).trim() : "";
            });
            return map;
        },
        legendItems() {
            if (this.isMechanismFlowMap && this.isBiolinkMap) {
                return [
                    { label: "Gene / Protein", color: BIOLINK_COLORS["biolink:Gene"] },
                    { label: "Small molecule / chemical", color: BIOLINK_COLORS["biolink:SmallMolecule"] },
                    { label: "Biological process / phenotype", color: BIOLINK_COLORS["biolink:BiologicalProcess"] },
                    { label: "Unmapped concept (gray border)", color: "#6b7280" },
                    { label: "Edge supported in Translator (solid)", color: "#333333" },
                    { label: "Edge inferred / not in Translator (dashed)", color: "#bbbbbb" },
                ];
            }
            if (this.isMechanismFlowMap) {
                const types = new Set();
                (this.network.nodes || []).forEach((n) => {
                    const t = n && n.type != null ? String(n.type).trim() : "";
                    if (t) types.add(t);
                });
                if (!types.size) {
                    return [{ label: "Entity", color: NODE_COLORS.Entity || DEFAULT_NODE_COLOR }];
                }
                return [...types]
                    .sort((a, b) => a.localeCompare(b))
                    .map((t) => ({
                        label: t,
                        color: NODE_COLORS[t] || DEFAULT_NODE_COLOR,
                    }));
            }
            if (this.geneColorByGwasSupport) {
                return [
                    { label: "Phenotype", color: NODE_COLORS.Phenotype },
                    { label: "Gene set cluster", color: NODE_COLORS.Factor },
                    { label: "Gene Set", color: NODE_COLORS.Pathway },
                    { label: "Gene", color: DATA_TAB_GENE_COLOR.background },
                ];
            }
            // Supporting / factorization network: legend tracks types present + Selected / Anchor.
            const typeLabel = (type, fallback) => {
                const custom = this.legendTypeLabels && this.legendTypeLabels[type];
                return custom ? String(custom) : fallback;
            };
            const typesPresent = new Set();
            (this.network.nodes || []).forEach((n) => {
                const t = n && n.type != null ? String(n.type).trim() : "";
                if (t) typesPresent.add(t);
            });
            const items = [];
            if (typesPresent.has("Entity")) {
                items.push({ label: typeLabel("Entity", "Entity"), color: NODE_COLORS.Entity });
            }
            if (typesPresent.has("Phenotype")) {
                items.push({ label: typeLabel("Phenotype", "Phenotype"), color: NODE_COLORS.Phenotype });
            }
            if (typesPresent.has("Factor") || !typesPresent.size) {
                items.push({ label: typeLabel("Factor", "Gene set cluster"), color: NODE_COLORS.Factor });
            }
            if (typesPresent.has("Pathway") || !typesPresent.size) {
                items.push({ label: typeLabel("Pathway", "Gene set"), color: NODE_COLORS.Pathway });
            }
            if (typesPresent.has("Gene") || !typesPresent.size) {
                items.push({ label: typeLabel("Gene", "Gene"), color: DEFAULT_GENE_COLOR });
            }
            if (this.showSelectedAnchorLegend) {
                items.push({
                    label: "Selected / Anchor",
                    color: SELECTION_HIGHLIGHT_ORANGE.nodeBackground,
                });
            }
            return items;
        },
        showNodeSizeLegend() {
            return !!(
                String(this.geneNodeMetricKey || "").trim() ||
                String(this.geneSetNodeMetricKey || "").trim() ||
                String(this.phenotypeNodeMetricKey || "").trim()
            );
        },
        showEdgeLengthLegend() {
            return !!String(this.edgeDistanceMetricKey || "").trim();
        },
        showMetricLegends() {
            return this.showNodeSizeLegend || this.showEdgeLengthLegend;
        },
        nodeSizeLegendText() {
            const geneKey = String(this.geneNodeMetricKey || "").trim();
            const geneSetKey = String(this.geneSetNodeMetricKey || "").trim();
            const phenotypeKey = String(this.phenotypeNodeMetricKey || "").trim();
            if (phenotypeKey === "aggregatePigeanScore") {
                return "Larger disease node = higher aggregated PIGEAN score";
            }
            if (geneKey === "node_score" && geneSetKey === "node_score") {
                return "Larger node = higher gene / gene-set score";
            }
            if (geneKey === "combined_score") {
                return "Larger gene node = higher combined score";
            }
            if (geneKey === "pigeanScore") {
                return "Larger gene node = higher PIGEAN score";
            }
            return "Larger node = higher score";
        },
        edgeLengthLegendText() {
            const key = String(this.edgeDistanceMetricKey || "").trim();
            if (key === "edgeStrength") {
                return "Shorter edge = higher gene loading / PIGEAN score";
            }
            if (key === "factor_value") {
                return "Shorter edge = higher Overall gene set cluster value";
            }
            return "Shorter edge = stronger association";
        },
    },
    watch: {
        network: {
            handler(newVal) {
                const sig = this.networkSignature(newVal);
                if (sig === this.lastNetworkSignature) return;
                this.lastNetworkSignature = sig;
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
        isMechanismFlowMap() {
            this.$nextTick(() => this.render());
        },
        isBiolinkMap() {
            this.$nextTick(() => this.render());
        },
        geneColorByGwasSupport() {
            this.$nextTick(() => this.render());
        },
        keepPhysicsEnabled() {
            this.$nextTick(() => this.render());
        },
        selectedNodes: {
            handler(next) {
                this.pendingSelectionNodes = next;
                this.$nextTick(() => this.applySelectionHighlights(next));
            },
            deep: true,
        },
        suppressSelectionHighlight() {
            this.$nextTick(() => this.applySelectionHighlights());
        },
        genesFetchedDiseaseIds: {
            handler() {
                this.$nextTick(() => this.applyDiseaseFetchedBorders());
            },
            deep: true,
        },
    },
    mounted() {
        this.bindResizeObserver();
        this.$nextTick(() => this.render());
    },
    beforeDestroy() {
        this.unbindResizeObserver();
        this.cleanup();
    },
    methods: {
        readNumericMetric(obj, key) {
            if (!obj || !key) return null;
            const raw = obj[key];
            if (raw == null || raw === "" || Number.isNaN(Number(raw))) return null;
            return Number(raw);
        },
        scaleLinear(value, minIn, maxIn, minOut, maxOut) {
            if (value == null || minIn == null || maxIn == null || maxIn <= minIn) {
                return (minOut + maxOut) / 2;
            }
            const t = Math.max(0, Math.min(1, (value - minIn) / (maxIn - minIn)));
            return minOut + t * (maxOut - minOut);
        },
        async exportSvg() {
            if (!this.visNetwork || !this.nodesDataSet || !this.edgesDataSet) return null;
            const selectedNodes = this.pendingSelectionNodes || this.selectedNodes || [];
            const orange = SELECTION_HIGHLIGHT_ORANGE;
            const highlightOn = !this.suppressSelectionHighlight;
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
                    const selected = highlightOn && isNetworkEdgeHighlighted(e, selectedNodes);
                    const stroke = selected ? orange.edge : "#999";
                    const strokeWidth = selected ? 3 : 1.5;
                    const strokeOpacity = selected ? 1 : 0.6;
                    return `<g class="edge"><line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />${
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
                    const highlighted = highlightOn && isNetworkNodeHighlighted(id, selectedNodes);
                    const fill = highlighted
                        ? orange.nodeBackground
                        : node.color && node.color.background
                          ? node.color.background
                          : "#999";
                    const stroke = highlighted
                        ? orange.nodeBorder
                        : node.color && node.color.border
                          ? node.color.border
                          : "#ffffff";
                    const labelColor = highlighted ? orange.label : "#333";
                    const label = node.label || node.id || "";
                    const safeLabel = String(label).replace(/&/g, "&amp;").replace(/</g, "&lt;");
                    return `<g class="node"><circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${highlighted ? 2.5 : 1.5}" /><text x="${
                        p.x
                    }" y="${p.y - r - 4}" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" fill="${labelColor}">${safeLabel}</text></g>`;
                })
                .join("");

            const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff" />
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
            if (this.nodeSelectionEnabled) {
                this.applySelectionHighlights();
                if (this.visNetwork) this.visNetwork.redraw();
                await new Promise((resolve) => {
                    requestAnimationFrame(() => requestAnimationFrame(resolve));
                });
            }
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
            if (this.layoutFitTimer) {
                clearTimeout(this.layoutFitTimer);
                this.layoutFitTimer = null;
            }
            if (this.selectionRefreshRafId != null && typeof cancelAnimationFrame === "function") {
                cancelAnimationFrame(this.selectionRefreshRafId);
            }
            this.selectionRefreshRafId = null;
            if (this.visNetwork) {
                this.visNetwork.destroy();
                this.visNetwork = null;
            }
            this.nodesDataSet = null;
            this.edgesDataSet = null;
            this.baseVisNodeStyles = {};
            this.baseVisEdgeStyles = {};
            this.lastContainerWidth = 0;
            this.closeNetworkNodeMenu();
            this.hideHoverTooltip();
            this.hideDiseaseNodeMenu();
            this.nodeMap = {};
        },
        refreshSelectionStylesSoon() {
            if (!this.nodeSelectionEnabled) return;
            if (this.selectionRefreshRafId != null && typeof cancelAnimationFrame === "function") {
                cancelAnimationFrame(this.selectionRefreshRafId);
            }
            this.selectionRefreshRafId = requestAnimationFrame(() => {
                this.selectionRefreshRafId = null;
                this.applySelectionHighlights();
            });
        },
        closeNetworkNodeMenu() {
            this.networkNodeMenuOpen = false;
            this.networkNodeMenuTarget = null;
        },
        openNetworkNodeMenu(clickParams, selectionNode) {
            if (!selectionNode || !this.nodeSelectionEnabled) return;
            let left = 0;
            let top = 0;
            const native =
                clickParams && clickParams.event
                    ? clickParams.event.srcEvent || clickParams.event
                    : null;
            if (native && native.clientX != null) {
                left = native.clientX;
                top = native.clientY;
            } else if (
                clickParams &&
                clickParams.pointer &&
                clickParams.pointer.DOM &&
                this.$refs.container
            ) {
                const rect = this.$refs.container.getBoundingClientRect();
                left = rect.left + clickParams.pointer.DOM.x;
                top = rect.top + clickParams.pointer.DOM.y;
            }
            this.networkNodeMenuTarget = { node: selectionNode };
            this.networkNodeMenuLeft = left;
            this.networkNodeMenuTop = top;
            this.$nextTick(() => {
                this.networkNodeMenuOpen = true;
            });
        },
        onNetworkNodeMenuToggle(target) {
            const node = target && target.node;
            if (!node) return;
            const next = toggleSelectionNode(this.selectedNodes, node);
            this.pendingSelectionNodes = next;
            this.$emit("update:selectedNodes", next);
            this.applySelectionHighlights(next);
        },
        applySelectionHighlights(selectedNodes = this.pendingSelectionNodes || this.selectedNodes) {
            if (!this.nodesDataSet || !this.edgesDataSet || !this.nodeSelectionEnabled) return;
            // "Only selected" already scopes the graph — keep type/metric colors, not orange paint.
            if (this.suppressSelectionHighlight) {
                const nodeUpdates = [];
                this.nodesDataSet.getIds().forEach((id) => {
                    const base = this.baseVisNodeStyles[id];
                    if (!base) return;
                    nodeUpdates.push({
                        id,
                        color: base.color,
                        borderWidth: base.borderWidth,
                        font: base.font,
                    });
                });
                if (nodeUpdates.length) this.nodesDataSet.update(nodeUpdates);
                const edgeUpdates = [];
                this.edgesDataSet.getIds().forEach((id) => {
                    const base = this.baseVisEdgeStyles[id];
                    if (!base) return;
                    edgeUpdates.push({
                        id,
                        color: base.color,
                        width: base.width,
                    });
                });
                if (edgeUpdates.length) this.edgesDataSet.update(edgeUpdates);
                if (this.visNetwork) {
                    try {
                        this.visNetwork.setSelection({ nodes: [], edges: [] });
                    } catch (e) {
                        /* ignore */
                    }
                    this.visNetwork.redraw();
                }
                return;
            }
            const orange = SELECTION_HIGHLIGHT_ORANGE;
            const orangeEdgeColor = {
                color: orange.edge,
                highlight: orange.edge,
                hover: orange.edge,
                inherit: false,
                opacity: 1,
            };
            const nodeUpdates = [];
            this.nodesDataSet.getIds().forEach((id) => {
                const base = this.baseVisNodeStyles[id];
                if (!base) return;
                if (isNetworkNodeHighlighted(id, selectedNodes)) {
                    nodeUpdates.push({
                        id,
                        color: {
                            background: orange.nodeBackground,
                            border: orange.nodeBorder,
                            highlight: { background: orange.nodeBackground, border: orange.nodeBorder },
                        },
                        borderWidth: 2.5,
                        font: { ...(base.font || {}), color: orange.label },
                    });
                } else {
                    nodeUpdates.push({
                        id,
                        color: base.color,
                        borderWidth: base.borderWidth,
                        font: base.font,
                    });
                }
            });
            if (nodeUpdates.length) this.nodesDataSet.update(nodeUpdates);

            const edgeUpdates = [];
            this.edgesDataSet.getIds().forEach((id) => {
                const edge = this.edgesDataSet.get(id);
                const base = this.baseVisEdgeStyles[id];
                if (!edge || !base) return;
                if (isNetworkEdgeHighlighted(edge, selectedNodes)) {
                    edgeUpdates.push({
                        id,
                        color: orangeEdgeColor,
                        width: Math.max(3, (base.width || 1.5) + 1),
                    });
                } else {
                    edgeUpdates.push({
                        id,
                        color: base.color,
                        width: base.width,
                    });
                }
            });
            if (edgeUpdates.length) this.edgesDataSet.update(edgeUpdates);

            this.syncVisEdgeSelection(selectedNodes);
            if (this.visNetwork) this.visNetwork.redraw();
        },
        networkSignature(net) {
            const nodes = (net && net.nodes ? net.nodes : [])
                .map((n) => (n && n.id != null ? String(n.id) : ""))
                .filter(Boolean)
                .sort()
                .join(",");
            const edges = (net && net.edges ? net.edges : [])
                .map((e) => `${e && e.source}|${e && e.target}`)
                .sort()
                .join(",");
            return `${nodes}::${edges}`;
        },
        syncVisEdgeSelection(selectedNodes) {
            if (!this.visNetwork || !this.edgesDataSet || !this.nodeSelectionEnabled) return;
            const edgeIds = [];
            this.edgesDataSet.getIds().forEach((id) => {
                const edge = this.edgesDataSet.get(id);
                if (edge && isNetworkEdgeHighlighted(edge, selectedNodes)) {
                    edgeIds.push(id);
                }
            });
            if (!edgeIds.length) {
                try {
                    this.visNetwork.unselectAll();
                } catch (err) {
                    // Ignore during teardown.
                }
                return;
            }
            try {
                this.visNetwork.setSelection({ edges: edgeIds, nodes: [] });
            } catch (err) {
                // Ignore stale edge ids during re-render.
            }
        },
        escapeHtml(raw) {
            return String(raw == null ? "" : raw)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        },
        formatTooltipHtml(title) {
            const text = String(title == null ? "" : title);
            if (!text.trim()) return "";
            return text
                .split("|")
                .map((part) => this.escapeHtml(part.trim()))
                .filter(Boolean)
                .join("<br>");
        },
        resolveNodeMenuPosition(nodeId) {
            const menuWidth = 168;
            const menuHeight = 40;
            if (this.visNetwork && nodeId != null) {
                try {
                    const positions = this.visNetwork.getPositions([nodeId]);
                    const canvasPos = positions && positions[nodeId];
                    if (canvasPos) {
                        const dom = this.visNetwork.canvasToDOM({
                            x: canvasPos.x,
                            y: canvasPos.y,
                        });
                        if (dom && Number.isFinite(dom.x) && Number.isFinite(dom.y)) {
                            const visNode = this.nodesDataSet && this.nodesDataSet.get(nodeId);
                            const nodeRadius = (visNode && visNode.size) || 20;
                            return this.clampOverlayPosition(
                                dom.x - menuWidth / 2,
                                dom.y + nodeRadius + 6,
                                menuWidth,
                                menuHeight
                            );
                        }
                    }
                } catch (e) {
                    /* ignore */
                }
            }
            return { x: 14, y: 14 };
        },
        clampOverlayPosition(x, y, width = 0, height = 0) {
            const container = this.$refs.container;
            const pad = 8;
            if (!container) return { x, y };
            const maxX = Math.max(pad, container.clientWidth - width - pad);
            const maxY = Math.max(pad, container.clientHeight - height - pad);
            return {
                x: Math.min(Math.max(pad, x), maxX),
                y: Math.min(Math.max(pad, y), maxY),
            };
        },
        resolveOverlayPosition(nodeId, pointer, offset = { x: 14, y: 14 }) {
            if (this.visNetwork && nodeId != null) {
                try {
                    const positions = this.visNetwork.getPositions([nodeId]);
                    const canvasPos = positions && positions[nodeId];
                    if (canvasPos) {
                        const dom = this.visNetwork.canvasToDOM({
                            x: canvasPos.x,
                            y: canvasPos.y,
                        });
                        if (dom && Number.isFinite(dom.x) && Number.isFinite(dom.y)) {
                            const visNode = this.nodesDataSet && this.nodesDataSet.get(nodeId);
                            const nodeRadius = (visNode && visNode.size) || 20;
                            return {
                                x: dom.x + nodeRadius + offset.x,
                                y: dom.y - nodeRadius + offset.y,
                            };
                        }
                    }
                } catch (e) {
                    /* ignore */
                }
            }
            if (
                pointer &&
                Number.isFinite(Number(pointer.x)) &&
                Number.isFinite(Number(pointer.y))
            ) {
                return {
                    x: Number(pointer.x) + offset.x,
                    y: Number(pointer.y) + offset.y,
                };
            }
            return { x: offset.x, y: offset.y };
        },
        showHoverTooltip(params) {
            if (!params || params.node == null || !this.nodesDataSet) return;
            const node = this.nodesDataSet.get(params.node);
            if (!node) return;
            const graphNode = this.nodeMap[params.node];
            const html = this.formatTooltipHtml(node.title || "");
            const pointer = params.event && params.event.pointer && params.event.pointer.DOM
                ? params.event.pointer.DOM
                : null;
            if (html) {
                this.hoverTooltip.visible = true;
                if (this.diseaseNodeMenuEnabled) {
                    const tipPos = this.clampOverlayPosition(8, 8, 280, 120);
                    this.hoverTooltip.x = tipPos.x;
                    this.hoverTooltip.y = tipPos.y;
                } else {
                    const tipPos = this.resolveOverlayPosition(params.node, pointer, { x: 14, y: 14 });
                    this.hoverTooltip.x = tipPos.x;
                    this.hoverTooltip.y = tipPos.y;
                }
                this.hoverTooltip.content = html;
            }
            if (
                this.diseaseNodeMenuEnabled &&
                graphNode &&
                graphNode.type === "Phenotype"
            ) {
                this.showDiseaseNodeMenu(params.node);
            }
        },
        moveHoverTooltip(params) {
            if (this.diseaseNodeMenuEnabled) {
                if (this.hoverTooltip.visible) {
                    const tipPos = this.clampOverlayPosition(8, 8, 280, 120);
                    this.hoverTooltip.x = tipPos.x;
                    this.hoverTooltip.y = tipPos.y;
                }
                if (this.diseaseNodeMenu.visible && this.diseaseNodeMenu.nodeId) {
                    const menuPos = this.resolveNodeMenuPosition(this.diseaseNodeMenu.nodeId);
                    this.diseaseNodeMenu.x = menuPos.x;
                    this.diseaseNodeMenu.y = menuPos.y;
                }
                return;
            }
            const pointer = params && params.pointer && params.pointer.DOM
                ? params.pointer.DOM
                : (params && params.event && params.event.pointer && params.event.pointer.DOM
                    ? params.event.pointer.DOM
                    : null);
            if (this.hoverTooltip.visible && params && params.node != null) {
                const tipPos = this.resolveOverlayPosition(params.node, pointer, { x: 14, y: 14 });
                this.hoverTooltip.x = tipPos.x;
                this.hoverTooltip.y = tipPos.y;
            } else if (pointer && this.hoverTooltip.visible) {
                this.hoverTooltip.x = Number(pointer.x) + 14;
                this.hoverTooltip.y = Number(pointer.y) + 14;
            }
        },
        hideHoverTooltip() {
            this.hoverTooltip.visible = false;
            this.hoverTooltip.content = "";
        },
        cancelDiseaseMenuHide() {
            if (this.diseaseMenuHideTimer) {
                clearTimeout(this.diseaseMenuHideTimer);
                this.diseaseMenuHideTimer = null;
            }
        },
        scheduleDiseaseMenuHide() {
            this.cancelDiseaseMenuHide();
            this.diseaseMenuHideTimer = setTimeout(() => {
                this.diseaseMenuHideTimer = null;
                this.hideDiseaseNodeMenu();
            }, 350);
        },
        showDiseaseNodeMenu(nodeId) {
            this.cancelDiseaseMenuHide();
            const menuPos = this.resolveNodeMenuPosition(nodeId);
            this.diseaseNodeMenu.visible = true;
            this.diseaseNodeMenu.nodeId = nodeId;
            this.diseaseNodeMenu.x = menuPos.x;
            this.diseaseNodeMenu.y = menuPos.y;
        },
        hideDiseaseNodeMenu() {
            this.cancelDiseaseMenuHide();
            this.diseaseNodeMenu.visible = false;
            this.diseaseNodeMenu.nodeId = "";
        },
        onDiseaseMenuViewSharedGenes() {
            const nodeId = this.diseaseNodeMenu.nodeId;
            const graphNode = nodeId ? this.nodeMap[nodeId] : null;
            if (graphNode) {
                this.$emit("view-shared-genes", {
                    nodeId,
                    node: graphNode,
                });
            }
            this.hideDiseaseNodeMenu();
            this.hideHoverTooltip();
        },
        /**
         * Drop the entire gene layer, then rebuild it from the caller's
         * gene-keyed node/edge lists and let physics settle the new positions.
         * One gene symbol in, one gene node out — no incremental merging.
         */
        replaceGeneNodes(geneNodes = [], geneEdges = [], hints = {}) {
            if (!this.nodesDataSet || !this.edgesDataSet) return { nodes: 0, edges: 0 };

            this.removeAllGeneNodes();

            const graphNodes = [];
            (geneNodes || []).forEach((n) => {
                if (!n || n.id == null) return;
                const sym = normalizeGeneSymbol(
                    (n.metadata && n.metadata.geneSymbol) || n.label || geneSymbolFromNodeId(n.id)
                );
                if (!sym) return;
                const graphNode = {
                    id: canonicalGeneNodeId(sym),
                    type: "Gene",
                    label: sym,
                    metadata: { ...(n.metadata || {}), geneSymbol: sym },
                };
                this.nodeMap[graphNode.id] = graphNode;
                graphNodes.push(graphNode);
            });

            (hints.diseaseIds || []).forEach((diseaseId) => {
                this.removeEdgeBetween(hints.factorId, diseaseId);
            });

            if (graphNodes.length) {
                this.seedGenePositions(graphNodes, hints);
                const metricScope = Object.values(this.nodeMap);
                const visNodes = this.buildVisNodes(graphNodes, metricScope);
                visNodes.forEach((vn) => {
                    const sym = geneSymbolFromNodeId(vn.id);
                    if (sym) vn.label = sym;
                    this.baseVisNodeStyles[vn.id] = {
                        color: vn.color,
                        borderWidth: vn.borderWidth,
                        font: vn.font,
                    };
                });
                this.nodesDataSet.add(visNodes);
            }

            const visEdges = this.buildVisEdges(geneEdges || [], geneEdges || []).filter(
                (edge) =>
                    edge &&
                    this.nodesDataSet.get(edge.from) &&
                    this.nodesDataSet.get(edge.to) &&
                    !this.edgesDataSet.get(edge.id)
            );
            visEdges.forEach((ve) => {
                this.baseVisEdgeStyles[ve.id] = {
                    color: ve.color,
                    width: ve.width,
                    arrows: ve.arrows,
                };
            });
            if (visEdges.length) this.edgesDataSet.add(visEdges);

            this.restartPhysics();
            this.applyDiseaseFetchedBorders();
            return { nodes: graphNodes.length, edges: visEdges.length };
        },
        removeAllGeneNodes() {
            if (!this.nodesDataSet || !this.edgesDataSet) return;
            const geneIds = new Set();
            (this.nodesDataSet.get() || []).forEach((visNode) => {
                if (!visNode || visNode.id == null) return;
                const graphNode = this.nodeMap[visNode.id];
                const isGene = graphNode
                    ? graphNode.type === "Gene"
                    : Boolean(geneSymbolFromNodeId(visNode.id));
                if (isGene) geneIds.add(String(visNode.id));
            });
            if (!geneIds.size) return;

            (this.edgesDataSet.get() || []).forEach((edge) => {
                if (!edge) return;
                if (geneIds.has(String(edge.from)) || geneIds.has(String(edge.to))) {
                    this.edgesDataSet.remove(edge.id);
                    delete this.baseVisEdgeStyles[edge.id];
                }
            });
            geneIds.forEach((id) => {
                this.nodesDataSet.remove(id);
                delete this.nodeMap[id];
                delete this.baseVisNodeStyles[id];
            });
        },
        /** Initial placement so physics has a sensible starting point per gene. */
        seedGenePositions(graphNodes, hints = {}) {
            if (!this.visNetwork) return;
            const factorId = hints.factorId;
            let factorPos = null;
            try {
                factorPos = factorId ? this.visNetwork.getPositions([factorId])[factorId] : null;
            } catch (e) {
                factorPos = null;
            }
            const originX = factorPos ? factorPos.x : 0;
            const originY = factorPos ? factorPos.y : 0;
            const radius = 180;
            const count = graphNodes.length;
            graphNodes.forEach((n, i) => {
                const angle = count <= 1 ? 0 : ((Math.PI * 2) * i) / count;
                n.x = originX + Math.cos(angle) * radius;
                n.y = originY + Math.sin(angle) * radius;
            });
        },
        restartPhysics() {
            if (!this.visNetwork) return;
            try {
                this.visNetwork.setOptions({
                    physics: {
                        enabled: true,
                        stabilization: { enabled: true, iterations: 200, fit: false },
                    },
                });
                this.visNetwork.stabilize(200);
            } catch (e) {
                // vis teardown race — nothing to settle.
            }
        },
        applyDiseaseFetchedBorders() {
            if (!this.nodesDataSet) return;
            const fetched = this.genesFetchedDiseaseIdSet;
            const updates = [];
            Object.values(this.nodeMap).forEach((n) => {
                if (!n || n.type !== "Phenotype") return;
                const isFetched = fetched.has(String(n.id));
                const visNode = this.nodesDataSet.get(n.id);
                if (!visNode) return;
                const base = this.baseVisNodeStyles[n.id] || {};
                const borderColor = isFetched
                    ? GENES_FETCHED_DISEASE_BORDER
                    : (base.color && base.color.border) || "#fff";
                const borderWidth = isFetched ? 3 : base.borderWidth || 1.5;
                updates.push({
                    id: n.id,
                    color: {
                        ...(visNode.color || {}),
                        border: borderColor,
                    },
                    borderWidth,
                });
                this.baseVisNodeStyles[n.id] = {
                    ...base,
                    color: {
                        ...(base.color || {}),
                        border: borderColor,
                    },
                    borderWidth,
                };
            });
            if (updates.length) this.nodesDataSet.update(updates);
        },
        removeEdgeBetween(sourceId, targetId) {
            if (!this.edgesDataSet || sourceId == null || targetId == null) return;
            [`e-${sourceId}-${targetId}`, `e-${targetId}-${sourceId}`].forEach((id) => {
                if (this.edgesDataSet.get(id)) {
                    delete this.baseVisEdgeStyles[id];
                    this.edgesDataSet.remove(id);
                }
            });
        },
        /** First GO:####### found in metadata or node fields (Biolink tooltips). */
        extractGoIdForBiolinkTooltip(meta, n) {
            const tryStr = (v) => {
                const t = String(v || "").trim();
                const m = t.match(/\bGO:\d+\b/i);
                return m ? m[0].replace(/^go:/i, "GO:") : "";
            };
            let id = tryStr(meta.primary_identifier) || tryStr(meta.curie);
            if (!id) id = tryStr(n && n.id != null ? n.id : "");
            if (!id) id = tryStr(n && n.label != null ? n.label : "");
            const eq = meta.equivalents;
            if (!id && Array.isArray(eq)) {
                for (const x of eq) {
                    id = tryStr(typeof x === "string" ? x : x && x.identifier);
                    if (id) break;
                }
            }
            return id;
        },
        buildVisNodes(nodes, metricScopeNodes = null) {
            const geneToGroup = this.geneNameToGroup;
            const geneMetricKey = String(this.geneNodeMetricKey || "").trim();
            const geneSetMetricKey = String(this.geneSetNodeMetricKey || "").trim();
            const phenotypeMetricKey = String(this.phenotypeNodeMetricKey || "").trim();
            const geneMetricValues = [];
            const geneSetMetricValues = [];
            const phenotypeMetricValues = [];
            const metricNodes = metricScopeNodes || nodes;
            if (geneMetricKey || geneSetMetricKey || phenotypeMetricKey) {
                (metricNodes || []).forEach((n) => {
                    if (!n) return;
                    if (geneMetricKey && n.type === "Gene") {
                        const v = this.readNumericMetric(n.metadata || {}, geneMetricKey);
                        if (v != null) geneMetricValues.push(Math.abs(v));
                    }
                    if (geneSetMetricKey && n.type === "Pathway") {
                        const v = this.readNumericMetric(n.metadata || {}, geneSetMetricKey);
                        if (v != null) geneSetMetricValues.push(Math.abs(v));
                    }
                    if (phenotypeMetricKey && n.type === "Phenotype") {
                        const v = this.readNumericMetric(n.metadata || {}, phenotypeMetricKey);
                        if (v != null) phenotypeMetricValues.push(Math.abs(v));
                    }
                });
            }
            const geneMetricMin = geneMetricValues.length ? Math.min(...geneMetricValues) : null;
            const geneMetricMax = geneMetricValues.length ? Math.max(...geneMetricValues) : null;
            const geneSetMetricMin = geneSetMetricValues.length ? Math.min(...geneSetMetricValues) : null;
            const geneSetMetricMax = geneSetMetricValues.length ? Math.max(...geneSetMetricValues) : null;
            const phenotypeMetricMin = phenotypeMetricValues.length
                ? Math.min(...phenotypeMetricValues)
                : null;
            const phenotypeMetricMax = phenotypeMetricValues.length
                ? Math.max(...phenotypeMetricValues)
                : null;
            return (nodes || []).map((n) => {
                const type = n.type || "Gene";
                let color = NODE_COLORS[type] || DEFAULT_NODE_COLOR;
                const meta = n.metadata || {};
                const biolinkClass = meta.biolink_class != null ? String(meta.biolink_class).trim() : "";
                const biolinkColor = colorFromBiolinkClass(biolinkClass);
                if (biolinkColor) color = biolinkColor;
                const rawDisplay = (n.label || n.id || "").toString();
                let headlineLabel =
                    type === "Factor"
                        ? resolveCfdeFactorClusterDisplayLabel(rawDisplay)
                        : rawDisplay;
                if (type === "Gene") {
                    headlineLabel =
                        geneSymbolFromNodeId(n.id) ||
                        normalizeGeneSymbol(meta.geneSymbol) ||
                        headlineLabel;
                }
                const parts = [`Full label: ${headlineLabel}`, `Type: ${type}`];
                let geneBorder = meta.biolink_unmapped ? "#6b7280" : "#fff";
                if (type === "Gene") {
                    const geneName = headlineLabel
                        .toString()
                        .trim()
                        .replace(/^gene:/i, "");
                    const candidateGeneRow = (this.genes || []).find(
                        (g) => (g.gene != null ? String(g.gene).trim() : "") === geneName
                    );
                    const scores = candidateGeneRow && candidateGeneRow.scores ? candidateGeneRow.scores : meta;
                    const combined = scores.combined ?? scores.c;
                    const gwas = scores.gwas ?? scores.g;
                    const functional = scores.functional ?? scores.f;
                    const combinedVal = meta.combined_score ?? meta.c ?? combined;
                    const gwasVal = meta.gwas_support ?? meta.g ?? gwas;
                    const funcVal = meta.functional_support ?? meta.f ?? functional;
                    const geneScoreVal = meta.gene_score ?? scores.gene_score;
                    parts.push(`Combined: ${combinedVal != null ? Number(combinedVal).toFixed(2) : "—"}`);
                    parts.push(`GWAS support: ${gwasVal != null ? Number(gwasVal).toFixed(2) : "—"}`);
                    parts.push(`Functional support: ${funcVal != null ? Number(funcVal).toFixed(2) : "—"}`);
                    if (geneScoreVal != null && !Number.isNaN(Number(geneScoreVal))) {
                        parts.push(`Gene score: ${Number(geneScoreVal).toFixed(3)}`);
                    }
                    if (meta.pigeanScore != null && !Number.isNaN(Number(meta.pigeanScore))) {
                        parts.push(`PIGEAN score: ${Number(meta.pigeanScore).toFixed(2)}`);
                    }
                    if (meta.factorLoading != null && !Number.isNaN(Number(meta.factorLoading))) {
                        parts.push(`Factor loading: ${Number(meta.factorLoading).toFixed(4)}`);
                    }
                    if (this.geneColorByGwasSupport) {
                        color = DATA_TAB_GENE_COLOR.background;
                        geneBorder = DATA_TAB_GENE_COLOR.border;
                    } else {
                        const isAnchor =
                            this.highlightAnchorGenes &&
                            candidateGeneRow &&
                            (candidateGeneRow.is_input === true || candidateGeneRow.in_search === true);
                        if (isAnchor) {
                            color = SELECTION_HIGHLIGHT_ORANGE.nodeBackground;
                            geneBorder = SELECTION_HIGHLIGHT_ORANGE.nodeBorder;
                        } else if (this.useGeneRoleColors) {
                            const group = geneToGroup[geneName];
                            color = colorForGeneRole(group);
                            if (biolinkColor) color = biolinkColor;
                        } else {
                            color = DEFAULT_GENE_COLOR;
                            if (biolinkColor) color = biolinkColor;
                        }
                    }
                }
                if (type === "Pathway") {
                    const gsScore = meta.gene_set_score;
                    const pVal = meta.p_value;
                    if (pVal != null && !Number.isNaN(Number(pVal))) {
                        parts.push(`P-value: ${Number(pVal).toExponential(2)}`);
                    }
                    if (gsScore != null && !Number.isNaN(Number(gsScore))) {
                        parts.push(`-log10(p): ${Number(gsScore).toFixed(2)}`);
                    }
                    if (meta.factor_value != null && !Number.isNaN(Number(meta.factor_value))) {
                        parts.push(`Overall gene set cluster value: ${Number(meta.factor_value).toFixed(3)}`);
                    }
                }
                if (type === "Phenotype") {
                    if (meta.aggregatePigeanScore != null && !Number.isNaN(Number(meta.aggregatePigeanScore))) {
                        parts.push(`Aggregated PIGEAN score: ${Number(meta.aggregatePigeanScore).toFixed(2)}`);
                    }
                    if (meta.sharedGeneCount != null && !Number.isNaN(Number(meta.sharedGeneCount))) {
                        parts.push(`Shared genes: ${Number(meta.sharedGeneCount)}`);
                    }
                }
                if (biolinkClass) {
                    parts.push(`Biolink class: ${biolinkClass}`);
                }
                if (this.isBiolinkMap && this.isMechanismFlowMap) {
                    const goId = this.extractGoIdForBiolinkTooltip(meta, n);
                    if (goId) parts.push(`GO ID: ${goId}`);
                }
                if (meta.primary_identifier && String(meta.primary_identifier) !== String(headlineLabel)) {
                    parts.push(`ID: ${meta.primary_identifier}`);
                }
                if (meta.curie) {
                    parts.push(`CURIE: ${meta.curie}`);
                }
                if (
                    meta.original_label &&
                    this.isMechanismFlowMap &&
                    String(meta.original_label) !== String(headlineLabel)
                ) {
                    parts.push(`Original label: ${meta.original_label}`);
                }
                if (meta.biolink_unmapped) {
                    parts.push("Biolink mapping: unmapped concept");
                }
                const title = parts.join(" | ");
                const rawLabel = headlineLabel.toString();
                const label =
                    type === "Gene" || this.isMechanismFlowMap
                        ? rawLabel
                        : rawLabel.length > 12
                          ? `${rawLabel.slice(0, 10)}…`
                          : rawLabel;
                let size = 20;
                if (type === "Factor") {
                    size = 26;
                } else if (type === "Gene") {
                    if (!geneMetricKey) size = 16;
                    else {
                        const v = this.readNumericMetric(meta, geneMetricKey);
                        size = this.scaleLinear(
                            v != null ? Math.abs(v) : null,
                            geneMetricMin,
                            geneMetricMax,
                            16,
                            30
                        );
                    }
                } else if (type === "Pathway" && geneSetMetricKey) {
                    const v = this.readNumericMetric(meta, geneSetMetricKey);
                    size = this.scaleLinear(
                        v != null ? Math.abs(v) : null,
                        geneSetMetricMin,
                        geneSetMetricMax,
                        12,
                        28
                    );
                } else if (type === "Phenotype" && phenotypeMetricKey) {
                    const v = this.readNumericMetric(meta, phenotypeMetricKey);
                    size = this.scaleLinear(
                        v != null ? Math.abs(v) : null,
                        phenotypeMetricMin,
                        phenotypeMetricMax,
                        16,
                        36
                    );
                }
                const genesFetched =
                    type === "Phenotype" && this.genesFetchedDiseaseIdSet.has(String(n.id));
                let borderColor =
                    type === "Gene" && this.geneColorByGwasSupport
                        ? geneBorder
                        : meta.biolink_unmapped
                          ? "#6b7280"
                          : "#fff";
                if (genesFetched) borderColor = GENES_FETCHED_DISEASE_BORDER;
                const borderWidth = genesFetched
                    ? 3
                    : meta.biolink_unmapped
                      ? 3
                      : 1.5;
                return {
                    id: n.id,
                    label,
                    title,
                    color: {
                        background: color,
                        border: borderColor,
                    },
                    font: {
                        size: 14,
                        color: "#333",
                    },
                    borderWidth,
                    size,
                    ...(Number.isFinite(n.x) && Number.isFinite(n.y) ? { x: n.x, y: n.y } : {}),
                };
            });
        },
        buildVisEdges(edges, metricScopeEdges = null) {
            const typeOrder = {
                Gene: 0,
                Pathway: 1,
                Factor: 2,
                Phenotype: 3,
            };
            const distanceMetricKey = String(this.edgeDistanceMetricKey || "").trim();
            const edgeMetricValues = [];
            const metricEdges = metricScopeEdges || edges;
            if (distanceMetricKey) {
                (metricEdges || []).forEach((e) => {
                    const v = this.readNumericMetric(e.metadata || {}, distanceMetricKey);
                    if (v != null) edgeMetricValues.push(Math.abs(v));
                });
            }
            const edgeMetricMin = edgeMetricValues.length ? Math.min(...edgeMetricValues) : null;
            const edgeMetricMax = edgeMetricValues.length ? Math.max(...edgeMetricValues) : null;
            return (edges || []).map((e, i) => {
                const sourceNode = this.nodeMap[e.source];
                const targetNode = this.nodeMap[e.target];

                let from = e.source;
                let to = e.target;

                if (!this.isMechanismFlowMap && !this.preserveEdgeDirection && sourceNode && targetNode) {
                    const sourceRank = typeOrder[sourceNode.type] ?? 0;
                    const targetRank = typeOrder[targetNode.type] ?? 0;
                    if (sourceRank > targetRank) {
                        from = e.target;
                        to = e.source;
                    }
                }

                const action = String(e.predicate || e.label || "").trim();

                const edge = {
                    id: `e-${from}-${to}`,
                    from,
                    to,
                    title: action,
                    width: 1.5,
                    selectable: !!this.nodeSelectionEnabled,
                    color: { color: "#999", opacity: 0.6, inherit: false },
                    smooth: { type: "continuous", roundness: 0.5 },
                    arrows: {
                        to: {
                            enabled: true,
                            scaleFactor: 0.5,
                        },
                    },
                };
                if (this.isMechanismFlowMap && action) {
                    edge.label = action;
                    edge.font = { size: 11, color: "#444", strokeWidth: 0, align: "horizontal" };
                }
                if (this.isMechanismFlowMap && (e.dashes || (e.metadata && e.metadata.inferred_edge))) {
                    edge.dashes = true;
                }
                if (distanceMetricKey) {
                    const rawDistanceMetric = this.readNumericMetric(e.metadata || {}, distanceMetricKey);
                    if (rawDistanceMetric != null) {
                        // Higher metric (e.g. Overall factor value / functional support) -> shorter spring.
                        edge.length = this.scaleLinear(
                            Math.abs(rawDistanceMetric),
                            edgeMetricMin,
                            edgeMetricMax,
                            210,
                            80
                        );
                    }
                }
                return edge;
            });
        },
        render() {
            if (this.isRendering) {
                this.pendingResize = true;
                return;
            }
            this.isRendering = true;
            try {
                this.renderNetwork();
            } finally {
                this.isRendering = false;
                if (this.pendingResize) {
                    this.pendingResize = false;
                    this.$nextTick(() => this.onContainerResize());
                }
            }
        },
        renderNetwork() {
            this.cleanup();
            this.bindResizeObserver();
            const container = this.$refs.container;
            if (!container) return;

            const nodes = (this.network.nodes || []).map((n) => ({ ...n }));
            const edges = (this.network.edges || []).map((e) => ({
                source: e.source,
                target: e.target,
                predicate: e.predicate != null && String(e.predicate) !== "" ? e.predicate : e.label,
                label: e.label,
                dashes: !!e.dashes,
                metadata: e.metadata || null,
            }));

            if (nodes.length === 0) {
                this.$emit("network-ready");
                return;
            }

            if (container.clientWidth < 8 || container.clientHeight < 8) {
                return;
            }

            this.nodeMap = {};
            nodes.forEach((n) => {
                this.nodeMap[n.id] = n;
            });

            const visNodes = this.buildVisNodes(nodes);
            const visEdges = this.buildVisEdges(edges);

            this.baseVisNodeStyles = {};
            visNodes.forEach((vn) => {
                this.baseVisNodeStyles[vn.id] = {
                    color: vn.color,
                    borderWidth: vn.borderWidth,
                    font: vn.font,
                };
            });
            this.baseVisEdgeStyles = {};
            visEdges.forEach((ve) => {
                this.baseVisEdgeStyles[ve.id] = {
                    color: ve.color,
                    width: ve.width,
                    arrows: ve.arrows,
                };
            });

            this.nodesDataSet = new DataSet(visNodes);
            this.edgesDataSet = new DataSet(visEdges);

            const data = {
                nodes: this.nodesDataSet,
                edges: this.edgesDataSet,
            };

            const options = {
                autoResize: true,
                width: `${container.clientWidth}px`,
                height: `${container.clientHeight}px`,
                nodes: {
                    shape: "dot",
                    borderWidth: 1.5,
                    shadow: false,
                },
                edges: {
                    shadow: false,
                    ...(this.nodeSelectionEnabled
                        ? {
                              color: {
                                  color: "#999",
                                  opacity: 0.6,
                                  highlight: SELECTION_HIGHLIGHT_ORANGE.edge,
                                  hover: "#bbbbbb",
                                  inherit: false,
                              },
                              selectionWidth: 2,
                          }
                        : {}),
                    ...(this.isMechanismFlowMap
                        ? {
                              font: { size: 11, color: "#444", strokeWidth: 0 },
                          }
                        : {}),
                },
                layout: { randomSeed: 2 },
                physics: {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 200,
                        fit: true,
                    },
                    barnesHut: this.keepPhysicsEnabled || this.isMechanismFlowMap
                        ? {
                              gravitationalConstant: -2200,
                              centralGravity: 0.015,
                              springLength: 160,
                              springConstant: 0.018,
                              damping: 0.5,
                              avoidOverlap: 0.85,
                          }
                        : {
                              gravitationalConstant: -1200,
                              centralGravity: 0.06,
                              springLength: 120,
                              springConstant: 0.04,
                              damping: 0.3,
                              avoidOverlap: 0.5,
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
                    selectConnectedEdges: false,
                    hoverConnectedEdges: !this.nodeSelectionEnabled,
                },
            };

            this.visNetwork = new Network(container, data, options);
            this.lastContainerWidth = container.clientWidth;
            this.visNetwork.setSize(`${container.clientWidth}px`, `${container.clientHeight}px`);
            let readyEmitted = false;
            const emitNetworkReady = () => {
                if (readyEmitted || !this.visNetwork) return;
                readyEmitted = true;
                // Results hypothesis maps and cluster-connectivity graphs keep physics on;
                // other Data-tab networks freeze after layout.
                if (!this.isMechanismFlowMap && !this.keepPhysicsEnabled) {
                    this.visNetwork.setOptions({ physics: false });
                }
                this.fitNetworkToViewport();
                if (this.keepPhysicsEnabled) {
                    if (this.layoutFitTimer) clearTimeout(this.layoutFitTimer);
                    this.layoutFitTimer = window.setTimeout(() => {
                        this.layoutFitTimer = null;
                        this.fitNetworkToViewport();
                    }, 700);
                }
                this.applySelectionHighlights();
                this.applyDiseaseFetchedBorders();
                this.$emit("network-ready");
            };

            this.visNetwork.on("hoverNode", (params) => this.showHoverTooltip(params));
            this.visNetwork.on("blurNode", () => {
                this.hideHoverTooltip();
                this.scheduleDiseaseMenuHide();
            });
            this.visNetwork.on("dragStart", (params) => {
                this.hideHoverTooltip();
                this.hideDiseaseNodeMenu();
                this.onNodeDragStart(params);
            });
            this.visNetwork.on("dragEnd", (params) => this.onNodeDragEnd(params));
            this.visNetwork.on("zoom", (params) => this.moveHoverTooltip(params));
            this.visNetwork.on("dragging", (params) => this.moveHoverTooltip(params));
            this.visNetwork.on("selectEdge", () => this.refreshSelectionStylesSoon());
            this.visNetwork.on("deselectEdge", () => this.refreshSelectionStylesSoon());
            this.visNetwork.on("selectNode", () => this.refreshSelectionStylesSoon());
            this.visNetwork.on("deselectNode", () => this.refreshSelectionStylesSoon());

            if (this.nodeSelectionEnabled) {
                this.visNetwork.on("click", (params) => this.onNetworkClick(params));
            }

            this.visNetwork.on("stabilizationIterationsDone", emitNetworkReady);
            this.visNetwork.on("stabilized", emitNetworkReady);
            setTimeout(emitNetworkReady, 2500);
        },
        bindResizeObserver() {
            if (this.resizeObserver || typeof ResizeObserver === "undefined") return;
            const el = this.$refs.container;
            if (!el) return;
            this.resizeObserver = new ResizeObserver(() => {
                if (this.resizeFitTimer) clearTimeout(this.resizeFitTimer);
                this.resizeFitTimer = setTimeout(() => {
                    this.resizeFitTimer = null;
                    this.onContainerResize();
                }, 80);
            });
            this.resizeObserver.observe(el);
        },
        unbindResizeObserver() {
            if (this.resizeFitTimer) {
                clearTimeout(this.resizeFitTimer);
                this.resizeFitTimer = null;
            }
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
        },
        onContainerResize() {
            if (this.isRendering) {
                this.pendingResize = true;
                return;
            }
            const container = this.$refs.container;
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            if (width < 8 || height < 8) {
                this.lastContainerWidth = width;
                return;
            }
            const becameVisible = this.lastContainerWidth < 8;
            this.lastContainerWidth = width;
            if (!this.visNetwork) {
                this.render();
                return;
            }
            this.visNetwork.setSize(`${width}px`, `${height}px`);
            this.visNetwork.redraw();
            if (becameVisible) this.fitNetworkToViewport();
        },
        fitNetworkToViewport() {
            if (!this.visNetwork) return;
            const container = this.$refs.container;
            if (container && container.clientWidth >= 8 && container.clientHeight >= 8) {
                this.visNetwork.setSize(`${container.clientWidth}px`, `${container.clientHeight}px`);
                this.visNetwork.redraw();
            }
            this.visNetwork.fit({
                padding: 48,
                animation: false,
            });
            const scale = this.visNetwork.getScale();
            if (typeof scale === "number" && !Number.isNaN(scale)) {
                this.zoomLevel = Math.max(this.zoomMin, Math.min(this.zoomMax, scale));
            }
        },
        physicsRemainsEnabled() {
            return !!(this.keepPhysicsEnabled || this.isMechanismFlowMap);
        },
        onNodeDragStart(params) {
            if (!this.physicsRemainsEnabled() || !this.nodesDataSet) return;
            const ids = (params && params.nodes) || [];
            if (!ids.length) return;
            // Temporarily release any prior pin so the node can move freely while dragging.
            this.nodesDataSet.update(
                ids.map((id) => ({
                    id,
                    fixed: { x: false, y: false },
                    physics: true,
                }))
            );
        },
        onNodeDragEnd(params) {
            if (!this.physicsRemainsEnabled() || !this.visNetwork || !this.nodesDataSet) return;
            const ids = (params && params.nodes) || [];
            if (!ids.length) return;
            const positions = this.visNetwork.getPositions(ids);
            const updates = ids
                .map((id) => {
                    const pos = positions[id];
                    if (!pos) return null;
                    return {
                        id,
                        x: pos.x,
                        y: pos.y,
                        fixed: { x: true, y: true },
                        physics: false,
                    };
                })
                .filter(Boolean);
            if (updates.length) this.nodesDataSet.update(updates);
        },
        onNetworkClick(params) {
            if (!this.nodeSelectionEnabled || !params) return;
            this.hideHoverTooltip();
            this.closeNetworkNodeMenu();
            const native = params.event ? params.event.srcEvent || params.event : null;
            if (native && typeof native.stopPropagation === "function") {
                native.stopPropagation();
            }
            let selectionNode = null;
            if (params.edges && params.edges.length) {
                const visEdge = this.edgesDataSet.get(params.edges[0]);
                if (visEdge) selectionNode = buildNetworkEdgeSelectionNode(visEdge, this.nodeMap);
            } else if (params.nodes && params.nodes.length) {
                const graphNode = this.nodeMap[params.nodes[0]];
                if (graphNode) selectionNode = buildNetworkNodeSelectionNode(graphNode);
            }
            if (selectionNode) this.openNetworkNodeMenu(params, selectionNode);
            this.refreshSelectionStylesSoon();
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
    flex-direction: column;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.45rem 0.75rem;
    font-size: 0.8rem;
    color: #555;
    background: transparent;
    border: none;
    padding: 0;
}
.network-legend-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem 1rem;
}
.legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}
.legend-swatch {
    display: inline-block;
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.12);
    flex: 0 0 auto;
}
.network-legend-metrics {
    color: #666;
}
.legend-metric-item {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
}
.legend-size-demo {
    display: inline-flex;
    align-items: flex-end;
    gap: 0.2rem;
    height: 0.95rem;
}
.legend-size-circle {
    display: inline-block;
    border-radius: 50%;
    background: #888;
    border: 1px solid rgba(0, 0, 0, 0.15);
}
.legend-size-circle--sm {
    width: 0.4rem;
    height: 0.4rem;
}
.legend-size-circle--lg {
    width: 0.85rem;
    height: 0.85rem;
}
.legend-edge-demo {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
}
.legend-edge-line {
    display: inline-block;
    height: 2px;
    background: #999;
    border-radius: 1px;
}
.legend-edge-line--short {
    width: 0.55rem;
}
.legend-edge-line--long {
    width: 1.35rem;
}
.network-wrapper {
    position: relative;
    width: 100%;
}
.network-disease-action-menu {
    position: absolute;
    z-index: 35;
    min-width: 10.5rem;
    padding: 0.35rem;
    border-radius: 8px;
    border: 1px solid #ead9c8;
    background: #fffef9;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    pointer-events: auto;
}
.network-disease-action-btn {
    display: block;
    width: 100%;
    margin: 0;
    padding: 0.4rem 0.55rem;
    border: 1px solid transparent;
    border-radius: 6px;
    background: #fffdfa;
    color: #3d342c;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.35;
    text-align: left;
    cursor: pointer;
}
.network-disease-action-btn:hover,
.network-disease-action-btn:focus {
    background: #fff5eb;
    border-color: #efc39c;
    outline: none;
}
.network-hover-tooltip {
    position: absolute;
    z-index: 30;
    max-width: 420px;
    pointer-events: none;
    background: rgba(33, 37, 41, 0.96);
    color: #fff;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 12px;
    line-height: 1.35;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
    white-space: normal;
}
.network-container {
    width: 100%;
    min-height: 200px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background: #ffffff;
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
.hypothesis-map-original-label {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0;
    font-size: 0.72rem;
    font-weight: 500;
    color: #444;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
}
.hypothesis-map-original-input {
    margin: 0;
    cursor: pointer;
    flex-shrink: 0;
}
</style>
