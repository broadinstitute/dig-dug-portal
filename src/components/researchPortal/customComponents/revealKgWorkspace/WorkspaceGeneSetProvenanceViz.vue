<template>
    <div ref="root" class="wkb-gene-set-prov-viz">
        <div v-if="legendItems.length" class="wkb-gene-set-prov-viz-legend" aria-hidden="true">
            <span
                v-for="item in legendItems"
                :key="item.label"
                class="wkb-gene-set-prov-viz-legend-item"
            >
                <i class="wkb-gene-set-prov-viz-swatch" :style="{ background: item.color }" />
                {{ item.label }}
            </span>
        </div>
        <div class="wkb-gene-set-prov-viz-body" :class="{ 'has-detail': selectedDetail }">
            <aside
                v-if="selectedDetail"
                class="wkb-gene-set-prov-viz-detail"
                aria-label="Provenance item details"
            >
                <div class="wkb-gene-set-prov-viz-detail-head">
                    <h5 class="wkb-gene-set-prov-viz-detail-title">{{ selectedDetail.title }}</h5>
                    <button
                        type="button"
                        class="wkb-gene-set-prov-viz-detail-close"
                        aria-label="Close details"
                        @click="closeDetail"
                    >
                        ×
                    </button>
                </div>
                <div class="wkb-gene-set-prov-viz-detail-body">
                    <p v-if="selectedDetail.nodeType" class="wkb-gene-set-prov-viz-detail-type">
                        {{ selectedDetail.nodeType }}
                    </p>
                    <template v-if="selectedDetail.kind === 'edge'">
                        <dl class="wkb-gene-set-prov-viz-detail-dl">
                            <div v-if="selectedDetail.sourceName">
                                <dt>Source</dt>
                                <dd>
                                    {{ selectedDetail.sourceName }}
                                    <span
                                        v-if="selectedDetail.sourceType"
                                        class="wkb-gene-set-prov-viz-detail-muted"
                                    >
                                        ({{ selectedDetail.sourceType }})
                                    </span>
                                </dd>
                            </div>
                            <div v-if="selectedDetail.targetName">
                                <dt>Target</dt>
                                <dd>
                                    {{ selectedDetail.targetName }}
                                    <span
                                        v-if="selectedDetail.targetType"
                                        class="wkb-gene-set-prov-viz-detail-muted"
                                    >
                                        ({{ selectedDetail.targetType }})
                                    </span>
                                </dd>
                            </div>
                            <div v-if="selectedDetail.label">
                                <dt>Edge</dt>
                                <dd>{{ selectedDetail.label }}</dd>
                            </div>
                        </dl>
                    </template>
                    <p v-if="selectedDetail.description" class="wkb-gene-set-prov-viz-detail-text">
                        {{ selectedDetail.description }}
                    </p>
                    <dl
                        v-if="selectedDetail.fileMeta"
                        class="wkb-gene-set-prov-viz-detail-dl"
                    >
                        <div v-if="selectedDetail.fileMeta.filename">
                            <dt>Filename</dt>
                            <dd>{{ selectedDetail.fileMeta.filename }}</dd>
                        </div>
                        <div v-if="selectedDetail.fileMeta.sizeBytes != null">
                            <dt>Size</dt>
                            <dd>{{ formatFileSize(selectedDetail.fileMeta.sizeBytes) }}</dd>
                        </div>
                        <div v-if="selectedDetail.fileMeta.md5">
                            <dt>MD5</dt>
                            <dd>{{ selectedDetail.fileMeta.md5 }}</dd>
                        </div>
                    </dl>
                    <p
                        v-if="selectedDetail.analysisCommand"
                        class="wkb-gene-set-prov-viz-detail-command"
                    >
                        <span class="wkb-gene-set-prov-viz-detail-command-label">Command</span>
                        {{ selectedDetail.analysisCommand }}
                    </p>
                    <a
                        v-if="selectedDetail.httpUrl"
                        :href="selectedDetail.httpUrl"
                        class="wkb-gene-set-prov-viz-detail-link"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open link
                    </a>
                    <p
                        v-if="!hasDetailBody"
                        class="wkb-gene-set-prov-viz-detail-empty"
                    >
                        No additional description available.
                    </p>
                </div>
            </aside>
            <div ref="canvasWrap" class="wkb-gene-set-prov-viz-canvas-wrap">
                <div
                    ref="container"
                    class="wkb-gene-set-prov-viz-canvas"
                    :style="{ height: `${height}px` }"
                    role="img"
                    :aria-label="ariaLabel"
                />
                <div
                    v-if="hasGraph"
                    class="wkb-gene-set-prov-viz-zoom"
                    role="toolbar"
                    aria-label="Provenance graph zoom"
                >
                    <input
                        v-model.number="zoomLevel"
                        type="range"
                        class="wkb-gene-set-prov-viz-zoom-slider"
                        :min="zoomMin"
                        :max="zoomMax"
                        :step="zoomStep"
                        aria-label="Provenance graph zoom"
                        @input="onZoomInput"
                    />
                    <button
                        type="button"
                        class="wkb-gene-set-prov-viz-zoom-btn wkb-gene-set-prov-viz-zoom-btn--fit"
                        title="Fit graph"
                        aria-label="Fit graph"
                        @click="fitNetworkView"
                    >
                        Fit
                    </button>
                </div>
            </div>
        </div>
        <div
            v-if="hoverTooltip.visible"
            class="wkb-gene-set-prov-viz-tooltip"
            :style="tooltipStyle"
            role="button"
            tabindex="0"
            @click.stop="onTooltipClick"
            @keydown.enter.prevent="onTooltipClick"
            @keydown.space.prevent="onTooltipClick"
        >
            <span class="wkb-gene-set-prov-viz-tooltip-label">{{ hoverTooltip.text }}</span>
            <span class="wkb-gene-set-prov-viz-tooltip-hint">Click for details</span>
        </div>
        <p v-if="!hasGraph" class="wkb-gene-set-prov-viz-empty">No graph data for this path.</p>
    </div>
</template>

<script>
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import {
    ACTIVE_SET_NODE_COLOR,
    TREE_VIEW_DEFAULT_NODE_COLOR,
    TREE_VIEW_EDGE_COLOR,
    TREE_VIEW_KEY_NODE_COLOR,
} from "./revealKgGraphColors.js";
import { provenanceLayoutSpacing } from "./revealKgGeneSetProvenanceViz.js";

const LEGEND_ITEMS = [
    { label: "Gene set", color: ACTIVE_SET_NODE_COLOR },
    { label: "Analysis", color: TREE_VIEW_KEY_NODE_COLOR },
    { label: "File", color: TREE_VIEW_DEFAULT_NODE_COLOR },
];

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;

export default {
    name: "WorkspaceGeneSetProvenanceViz",
    props: {
        network: {
            type: Object,
            default: () => ({ nodes: [], edges: [] }),
        },
        height: {
            type: Number,
            default: 340,
        },
        ariaLabel: {
            type: String,
            default: "Gene set provenance graph",
        },
    },
    data() {
        return {
            visNetwork: null,
            resizeObserver: null,
            legendItems: LEGEND_ITEMS,
            zoomLevel: 1,
            zoomMin: ZOOM_MIN,
            zoomMax: ZOOM_MAX,
            zoomStep: ZOOM_STEP,
            suppressZoomSync: false,
            viewportReady: false,
            preservingViewport: false,
            selectedDetail: null,
            nodeDetailsById: {},
            edgeDetailsById: {},
            hoveredTarget: null,
            hoverTooltip: {
                visible: false,
                text: "",
                left: 0,
                top: 0,
            },
        };
    },
    computed: {
        hasGraph() {
            return (this.network?.nodes || []).length > 0;
        },
        tooltipStyle() {
            return {
                left: `${this.hoverTooltip.left}px`,
                top: `${this.hoverTooltip.top}px`,
            };
        },
        hasDetailBody() {
            const detail = this.selectedDetail;
            if (!detail) {
                return false;
            }
            return Boolean(
                detail.description ||
                    detail.analysisCommand ||
                    detail.httpUrl ||
                    detail.fileMeta ||
                    (detail.kind === "edge" &&
                        (detail.sourceName || detail.targetName || detail.label))
            );
        },
    },
    watch: {
        network: {
            deep: true,
            handler() {
                this.closeDetail();
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
    methods: {
        formatFileSize(bytes) {
            const value = Number(bytes);
            if (!Number.isFinite(value) || value < 0) {
                return "";
            }
            if (value < 1024) {
                return `${value} B`;
            }
            if (value < 1024 * 1024) {
                return `${(value / 1024).toFixed(1)} KB`;
            }
            return `${(value / (1024 * 1024)).toFixed(1)} MB`;
        },
        hideTooltip() {
            this.hoverTooltip.visible = false;
            this.hoverTooltip.text = "";
        },
        showTooltip(clientX, clientY, text) {
            const root = this.$refs.root;
            if (!root || !text) {
                return;
            }
            const rect = root.getBoundingClientRect();
            this.hoverTooltip.visible = true;
            this.hoverTooltip.text = text;
            this.hoverTooltip.left = Math.min(
                Math.max(8, clientX - rect.left + 12),
                rect.width - 240
            );
            this.hoverTooltip.top = Math.min(
                Math.max(8, clientY - rect.top + 12),
                rect.height - 56
            );
        },
        closeDetail() {
            const viewport = this.captureViewport();
            this.preservingViewport = true;
            this.selectedDetail = null;
            this.hoveredTarget = null;
            this.$nextTick(() => {
                requestAnimationFrame(() => {
                    this.restoreViewport(viewport);
                    this.preservingViewport = false;
                    if (this.visNetwork) {
                        this.visNetwork.redraw();
                    }
                });
            });
        },
        detailForNodeId(nodeId) {
            return this.nodeDetailsById[nodeId] || null;
        },
        detailForEdgeId(edgeId) {
            return this.edgeDetailsById[edgeId] || null;
        },
        resolveClickTarget(params) {
            const items = Array.isArray(params?.items) ? params.items : [];
            for (const item of items) {
                if (item?.nodeId) {
                    return { kind: "node", id: item.nodeId };
                }
                if (item?.edgeId) {
                    return { kind: "edge", id: item.edgeId };
                }
            }
            const pointer = params?.pointer?.DOM;
            if (this.visNetwork && pointer) {
                const nodeId = this.visNetwork.getNodeAt(pointer);
                if (nodeId) {
                    return { kind: "node", id: nodeId };
                }
                const edgeId = this.visNetwork.getEdgeAt(pointer);
                if (edgeId) {
                    return { kind: "edge", id: edgeId };
                }
            }
            if (this.hoveredTarget?.id) {
                return this.hoveredTarget;
            }
            const legacyNodeId = params?.nodes?.[0];
            if (legacyNodeId) {
                return { kind: "node", id: legacyNodeId };
            }
            const legacyEdgeId = params?.edges?.[0];
            if (legacyEdgeId) {
                return { kind: "edge", id: legacyEdgeId };
            }
            return null;
        },
        openDetailForTarget(target) {
            if (!target?.id) {
                return;
            }
            const detail =
                target.kind === "edge"
                    ? this.detailForEdgeId(target.id)
                    : this.detailForNodeId(target.id);
            this.openDetail(detail);
        },
        onTooltipClick() {
            this.openDetailForTarget(this.hoveredTarget);
        },
        openDetail(detail) {
            if (!detail) {
                return;
            }
            const viewport = this.captureViewport();
            this.preservingViewport = true;
            this.hideTooltip();
            this.selectedDetail = { ...detail };
            this.$nextTick(() => {
                requestAnimationFrame(() => {
                    this.restoreViewport(viewport);
                    this.preservingViewport = false;
                    if (this.visNetwork) {
                        this.visNetwork.redraw();
                    }
                });
            });
        },
        captureViewport() {
            if (!this.visNetwork) {
                return null;
            }
            return {
                scale: this.visNetwork.getScale(),
                position: this.visNetwork.getViewPosition(),
            };
        },
        restoreViewport(viewport) {
            if (!this.visNetwork || !viewport) {
                return;
            }
            const scale = Number(viewport.scale);
            const position = viewport.position;
            if (!Number.isFinite(scale) || !position) {
                return;
            }
            this.suppressZoomSync = true;
            this.visNetwork.moveTo({
                scale,
                position: { ...position },
                animation: false,
            });
            this.suppressZoomSync = false;
            this.zoomLevel = Math.min(this.zoomMax, Math.max(this.zoomMin, scale));
        },
        pointerClientCoords(params) {
            const event = params.event;
            const container = this.$refs.container;
            const rect = container?.getBoundingClientRect() || { left: 0, top: 0 };
            return {
                clientX: event?.clientX ?? rect.left + (params.pointer?.DOM?.x || 0),
                clientY: event?.clientY ?? rect.top + (params.pointer?.DOM?.y || 0),
            };
        },
        detachNetworkEvents() {
            if (!this.visNetwork) {
                return;
            }
            this.visNetwork.off("hoverNode");
            this.visNetwork.off("blurNode");
            this.visNetwork.off("hoverEdge");
            this.visNetwork.off("blurEdge");
            this.visNetwork.off("click");
            this.visNetwork.off("zoom");
        },
        attachNetworkEvents(nodeDataSet, edgeDataSet) {
            if (!this.visNetwork) {
                return;
            }
            this.visNetwork.on("hoverNode", (params) => {
                this.hoveredTarget = { kind: "node", id: params.node };
                const node = nodeDataSet.get(params.node);
                const text = node?.fullLabel || node?.label || "";
                if (!text) {
                    return;
                }
                const { clientX, clientY } = this.pointerClientCoords(params);
                this.showTooltip(clientX, clientY, text);
            });
            this.visNetwork.on("blurNode", () => {
                this.hideTooltip();
            });
            this.visNetwork.on("hoverEdge", (params) => {
                this.hoveredTarget = { kind: "edge", id: params.edge };
                const edge = edgeDataSet.get(params.edge);
                const text =
                    edge?.detail?.label ||
                    edge?.detail?.title ||
                    `${edge?.detail?.sourceName || ""} → ${edge?.detail?.targetName || ""}`.trim();
                if (!text) {
                    return;
                }
                const { clientX, clientY } = this.pointerClientCoords(params);
                this.showTooltip(clientX, clientY, text);
            });
            this.visNetwork.on("blurEdge", () => {
                this.hideTooltip();
            });
            this.visNetwork.on("click", (params) => {
                const target = this.resolveClickTarget(params);
                this.openDetailForTarget(target);
            });
            this.visNetwork.on("zoom", (params) => {
                if (this.suppressZoomSync) {
                    return;
                }
                const scale = Number(params?.scale);
                if (Number.isFinite(scale)) {
                    this.zoomLevel = Math.min(this.zoomMax, Math.max(this.zoomMin, scale));
                }
            });
        },
        onZoomInput() {
            this.applyZoom(this.zoomLevel);
        },
        applyZoom(scale) {
            if (!this.visNetwork) {
                return;
            }
            const nextScale = Math.min(this.zoomMax, Math.max(this.zoomMin, Number(scale) || 1));
            this.suppressZoomSync = true;
            this.visNetwork.moveTo({ scale: nextScale, animation: false });
            this.suppressZoomSync = false;
        },
        syncZoomFromNetwork() {
            if (!this.visNetwork) {
                return;
            }
            const scale = Number(this.visNetwork.getScale());
            if (Number.isFinite(scale)) {
                this.zoomLevel = Math.min(this.zoomMax, Math.max(this.zoomMin, scale));
            }
        },
        fitNetworkView() {
            if (!this.visNetwork) {
                return;
            }
            this.visNetwork.fit({
                animation: false,
                padding: 28,
            });
            this.syncZoomFromNetwork();
            this.viewportReady = true;
        },
        handleCanvasResize() {
            if (!this.visNetwork || !this.viewportReady || this.preservingViewport) {
                return;
            }
            const viewport = this.captureViewport();
            requestAnimationFrame(() => {
                this.restoreViewport(viewport);
                if (this.visNetwork) {
                    this.visNetwork.redraw();
                }
            });
        },
        observeResize() {
            const element = this.$refs.canvasWrap;
            if (!element || typeof ResizeObserver === "undefined") {
                return;
            }
            this.resizeObserver = new ResizeObserver(() => {
                this.handleCanvasResize();
            });
            this.resizeObserver.observe(element);
        },
        renderNetwork() {
            this.hideTooltip();
            this.hoveredTarget = null;
            if (!this.$refs.container) {
                return;
            }
            this.detachNetworkEvents();
            if (this.visNetwork) {
                this.visNetwork.destroy();
                this.visNetwork = null;
            }
            this.selectedDetail = null;
            this.viewportReady = false;
            if (!this.hasGraph) {
                this.nodeDetailsById = {};
                this.edgeDetailsById = {};
                return;
            }
            const rawNodes = this.network.nodes || [];
            const rawEdges = this.network.edges || [];
            this.nodeDetailsById = Object.fromEntries(
                rawNodes.filter((node) => node?.id && node?.detail).map((node) => [node.id, node.detail])
            );
            this.edgeDetailsById = Object.fromEntries(
                rawEdges.filter((edge) => edge?.id && edge?.detail).map((edge) => [edge.id, edge.detail])
            );
            const nodes = new DataSet(rawNodes);
            const edges = new DataSet(rawEdges);
            const layoutSpacing = provenanceLayoutSpacing(nodes.length);
            this.visNetwork = new Network(
                this.$refs.container,
                { nodes, edges },
                {
                    layout: {
                        hierarchical: {
                            enabled: true,
                            direction: "LR",
                            sortMethod: "directed",
                            levelSeparation: layoutSpacing.levelSeparation,
                            nodeSpacing: layoutSpacing.nodeSpacing,
                        },
                    },
                    physics: { enabled: false },
                    interaction: {
                        dragNodes: true,
                        dragView: true,
                        zoomView: true,
                        hover: true,
                        hoverConnectedEdges: false,
                        selectable: false,
                    },
                    edges: {
                        chosen: false,
                        color: {
                            color: TREE_VIEW_EDGE_COLOR,
                            highlight: TREE_VIEW_EDGE_COLOR,
                            hover: TREE_VIEW_EDGE_COLOR,
                        },
                        width: 1,
                        arrowStrikethrough: false,
                        smooth: {
                            type: "cubicBezier",
                            forceDirection: "horizontal",
                            roundness: 0.35,
                        },
                    },
                    nodes: {
                        margin: 8,
                        widthConstraint: false,
                    },
                }
            );
            this.attachNetworkEvents(nodes, edges);
            this.visNetwork.once("stabilized", () => {
                this.fitNetworkView();
            });
            this.$nextTick(() => {
                requestAnimationFrame(() => this.fitNetworkView());
            });
        },
    },
};
</script>

<style scoped>
.wkb-gene-set-prov-viz {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-gene-set-prov-viz-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    font-size: 11px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-gene-set-prov-viz-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.wkb-gene-set-prov-viz-swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.wkb-gene-set-prov-viz-body {
    display: flex;
    align-items: stretch;
    min-height: 220px;
}

.wkb-gene-set-prov-viz-detail {
    flex: 0 0 300px;
    width: 300px;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-right: none;
    border-radius: 8px 0 0 8px;
    background: #fffef9;
    overflow: hidden;
}

.wkb-gene-set-prov-viz-body.has-detail .wkb-gene-set-prov-viz-canvas-wrap {
    flex: 1;
    min-width: 0;
}

.wkb-gene-set-prov-viz-body.has-detail .wkb-gene-set-prov-viz-canvas {
    border-radius: 0 8px 8px 0;
}

.wkb-gene-set-prov-viz-detail-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 10px 8px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
    background: #f6f5f2;
}

.wkb-gene-set-prov-viz-detail-title {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
    color: var(--cfde-ink, #33363d);
    overflow-wrap: anywhere;
}

.wkb-gene-set-prov-viz-detail-close {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    margin: 0;
    padding: 0;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fff;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
}

.wkb-gene-set-prov-viz-detail-close:hover {
    color: var(--cfde-ink, #33363d);
    border-color: #c9c2b6;
}

.wkb-gene-set-prov-viz-detail-body {
    flex: 1;
    overflow: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.wkb-gene-set-prov-viz-detail-type {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.wkb-gene-set-prov-viz-detail-text {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-gene-set-prov-viz-detail-dl {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-gene-set-prov-viz-detail-dl dt {
    margin: 0;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-gene-set-prov-viz-detail-dl dd {
    margin: 2px 0 0;
    font-size: 12px;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
    overflow-wrap: anywhere;
}

.wkb-gene-set-prov-viz-detail-muted {
    color: var(--cfde-muted, #6b6b6b);
    font-weight: 400;
}

.wkb-gene-set-prov-viz-detail-command {
    margin: 0;
    font-size: 11px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
    overflow-wrap: anywhere;
}

.wkb-gene-set-prov-viz-detail-command-label {
    display: block;
    margin-bottom: 4px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-gene-set-prov-viz-detail-link {
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    text-decoration: none;
}

.wkb-gene-set-prov-viz-detail-link:hover {
    text-decoration: underline;
}

.wkb-gene-set-prov-viz-detail-empty {
    margin: 0;
    font-size: 12px;
    font-style: italic;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-gene-set-prov-viz-canvas-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
}

.wkb-gene-set-prov-viz-canvas {
    width: 100%;
    min-height: 220px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
}

.wkb-gene-set-prov-viz-zoom {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.wkb-gene-set-prov-viz-zoom-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
}

.wkb-gene-set-prov-viz-zoom-btn--fit {
    width: auto;
    min-width: 32px;
    padding: 0 6px;
    font-size: 11px;
    font-weight: 600;
}

.wkb-gene-set-prov-viz-zoom-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-gene-set-prov-viz-zoom-slider {
    width: 96px;
    height: 8px;
    margin: 0;
    accent-color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.wkb-gene-set-prov-viz-tooltip {
    position: absolute;
    z-index: 3;
    max-width: 240px;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(30, 32, 38, 0.92);
    color: #fff;
    font-size: 13px;
    line-height: 1.4;
    cursor: pointer;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.wkb-gene-set-prov-viz-tooltip-label {
    display: block;
}

.wkb-gene-set-prov-viz-tooltip-hint {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.78);
}

.wkb-gene-set-prov-viz-empty {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
    font-style: italic;
}
</style>
