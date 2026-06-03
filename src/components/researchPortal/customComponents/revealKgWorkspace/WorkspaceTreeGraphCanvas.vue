<template>
    <div ref="root" class="wkb-tree-graph">
        <div v-if="hoverTooltip.visible" class="wkb-tree-graph-tooltip" :style="tooltipStyle">
            {{ hoverTooltip.text }}
        </div>
        <svg ref="svg" class="wkb-tree-graph-svg" aria-label="Knowledge graph tree view" />
        <p v-if="!graphNodes.length" class="wkb-tree-graph-empty">No nodes to display.</p>
    </div>
</template>

<script>
import { select } from "d3-selection";
import {
    HIERARCHY_LAYERS,
    TREE_VIEW_ANCHOR_NODE_COLOR,
    TREE_VIEW_DEFAULT_NODE_COLOR,
    TREE_VIEW_EDGE_COLOR,
    TREE_VIEW_HIGHLIGHTED_NODE_COLOR,
} from "./revealKgGraphColors.js";
import {
    buildRowLayout,
    collectHierarchyEdges,
    hierarchyEdgeKey,
    isHierarchyEdgeShown,
    treeRowY,
} from "./revealKgHierarchyGraphData.js";

const MARGIN_ROW = { top: 80, right: 140, bottom: 72, left: 168 };
const ROW_GAP_FIRST = 100;
const ROW_GAP_DEFAULT = 200;
const ROW_GAPS = { firstGap: ROW_GAP_FIRST, defaultGap: ROW_GAP_DEFAULT };
const FIXED_NODE_HORIZONTAL_GAP = 50;
const TREE_LAYOUT_MARGIN_LEFT = 168;
const ROW_HEADER_MIN_GAP_BEFORE_NODES = 32;
const ROW_HEADER_LABEL_WIDTH = 120;
const ROW_HEADER_SHIFT_LEFT = 100;
const TREE_VIEW_SCALE = 0.88;
const NODE_RADIUS_SCALE = 0.75;
const TREE_VIEW_NODE_RADIUS = 12 * NODE_RADIUS_SCALE;
const TREE_ANCHOR_RADIUS_EXTRA = 1;
const ARROW_LENGTH = 9;
const ARROW_HALF_HEIGHT = 6;
const DEFAULT_GRAPH_OPACITY = 1;
const CONTEXTUAL_GRAPH_OPACITY = 0.55;
const DIMMED_GRAPH_OPACITY = 0.1;
const DIMMED_CONTEXTUAL_GRAPH_OPACITY = 0.05;
const CONTENT_PAD_ROW = { top: 32, right: 140, bottom: 88, left: 12 };
const TREE_LABEL_REACH = 140;

function treeNodeLabelBelow(layer) {
    return layer >= 1;
}

function nodeRadius() {
    return TREE_VIEW_NODE_RADIUS;
}

function nodeShapeRadius(layer, isAnchor) {
    const radius = nodeRadius(layer);
    return isAnchor ? radius + TREE_ANCHOR_RADIUS_EXTRA : radius;
}

function anchorDiamondPoints(radius) {
    return `0,${-radius} ${radius},0 0,${radius} ${-radius},0`;
}

function truncateLabel(text, max = 28) {
    const value = String(text || "");
    if (value.length <= max) {
        return value;
    }
    return `${value.slice(0, max - 1)}…`;
}

function treeNodeLabelPlacement(entry) {
    const layer = entry.layer ?? entry.meta?.layer ?? 0;
    const radius = nodeRadius(layer);
    const below = treeNodeLabelBelow(layer);
    return {
        x: 0,
        y: below ? radius + 12 : -(radius + 10),
        angle: -45,
        textAnchor: layer === 0 ? "start" : "end",
    };
}

function flatArrowheadRow(tipX, tipY, approachFromAbove) {
    if (approachFromAbove) {
        return [
            [tipX, tipY],
            [tipX - ARROW_HALF_HEIGHT, tipY - ARROW_LENGTH],
            [tipX + ARROW_HALF_HEIGHT, tipY - ARROW_LENGTH],
        ];
    }
    return [
        [tipX, tipY],
        [tipX - ARROW_HALF_HEIGHT, tipY + ARROW_LENGTH],
        [tipX + ARROW_HALF_HEIGHT, tipY + ARROW_LENGTH],
    ];
}

function graphEdgeGeometryRow(from, to, fromRadius, toRadius) {
    const x0 = from.x;
    const x1 = to.x;
    let y0;
    let y1;
    if (to.y >= from.y) {
        y0 = from.y + fromRadius;
        y1 = to.y - toRadius;
    } else {
        y0 = from.y - fromRadius;
        y1 = to.y + toRadius;
    }
    const dx = x1 - x0;
    const dy = y1 - y0;
    if (Math.hypot(dx, dy) < 1) {
        return null;
    }
    const my = (y0 + y1) / 2;
    const path = `M${x0},${y0} C${x0},${my} ${x1},${my} ${x1},${y1}`;
    const arrow = flatArrowheadRow(x1, y1, to.y >= from.y);
    return { path, arrow };
}

/** Place category labels right-aligned just left of the node band, clear of angled node labels. */
function computeRowHeaderEndX(positions) {
    const bandStart = TREE_LAYOUT_MARGIN_LEFT;
    let leftmostLabelEdge = bandStart;
    for (const pos of positions.values()) {
        const layer = pos.layer ?? pos.meta?.layer ?? 0;
        if (treeNodeLabelBelow(layer)) {
            continue;
        }
        const radius = nodeShapeRadius(layer, pos.meta?.isAnchor);
        const labelReach = TREE_LABEL_REACH * 0.72 + radius + 12;
        leftmostLabelEdge = Math.min(leftmostLabelEdge, pos.x - labelReach);
    }
    const maxEndX = bandStart - ROW_HEADER_MIN_GAP_BEFORE_NODES;
    return Math.max(48, Math.min(maxEndX, leftmostLabelEdge - 20));
}

function computeContentBounds(positions, visibleRowLayers, populatedLayerIndices, rowHeaderEndX) {
    const xs = [];
    const ys = [];
    const pad = {
        ...CONTENT_PAD_ROW,
        bottom: Math.max(CONTENT_PAD_ROW.bottom, 36 + Math.round(ROW_GAP_DEFAULT * 0.35)),
    };

    const headerEndX = rowHeaderEndX ?? TREE_LAYOUT_MARGIN_LEFT - ROW_HEADER_MIN_GAP_BEFORE_NODES;
    xs.push(
        headerEndX - ROW_HEADER_LABEL_WIDTH - ROW_HEADER_SHIFT_LEFT,
        headerEndX
    );
    for (const row of visibleRowLayers || []) {
        const layer = row.layer ?? HIERARCHY_LAYERS.findIndex((entry) => entry.key === row.key);
        ys.push(treeRowY(layer, MARGIN_ROW.top, ROW_GAP_DEFAULT, populatedLayerIndices, ROW_GAPS));
    }
    if (visibleRowLayers?.length) {
        const lastLayer =
            visibleRowLayers[visibleRowLayers.length - 1].layer ??
            HIERARCHY_LAYERS.findIndex(
                (entry) => entry.key === visibleRowLayers[visibleRowLayers.length - 1].key
            );
        ys.push(
            treeRowY(lastLayer, MARGIN_ROW.top, ROW_GAP_DEFAULT, populatedLayerIndices, ROW_GAPS) +
                TREE_LABEL_REACH
        );
    }

    for (const pos of positions.values()) {
        const layer = pos.layer ?? pos.meta?.layer ?? 0;
        const radius = nodeShapeRadius(layer, pos.meta?.isAnchor);
        xs.push(pos.x - radius, pos.x + radius);
        ys.push(pos.y - radius, pos.y + radius);

        const { x: labelX, y: labelY } = treeNodeLabelPlacement({
            meta: pos.meta,
            layer: pos.layer,
        });
        xs.push(pos.x + labelX);
        ys.push(pos.y + labelY);
        if (treeNodeLabelBelow(layer)) {
            ys.push(pos.y + labelY + TREE_LABEL_REACH);
        } else {
            ys.push(pos.y + labelY - TREE_LABEL_REACH);
        }
    }

    if (!xs.length) {
        return { minX: 0, minY: 0, width: 400, height: 300 };
    }

    const minX = Math.min(...xs) - pad.left;
    const maxX = Math.max(...xs) + pad.right;
    const minY = Math.min(...ys) - pad.top;
    const maxY = Math.max(...ys) + pad.bottom;
    return {
        minX,
        minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

function fitTransform(viewWidth, viewHeight, bounds) {
    const baseScale = TREE_VIEW_SCALE;
    const fitScaleX = viewWidth / Math.max(1, bounds.width);
    const fitScaleY = viewHeight / Math.max(1, bounds.height);
    const scale = Math.min(baseScale, fitScaleX, fitScaleY);
    const offsetX = (viewWidth - bounds.width * scale) / 2 - bounds.minX * scale;
    const offsetY = (viewHeight - bounds.height * scale) / 2 - bounds.minY * scale;
    return { offsetX, offsetY, scale };
}

function buildHighlightSets(highlight, hierarchyEdges) {
    const activeNodes = new Set();
    const activeEdges = new Set();
    if (!highlight) {
        return { activeNodes, activeEdges, hasHighlight: false };
    }
    if (highlight.edgeKey) {
        activeEdges.add(highlight.edgeKey);
        const entry = hierarchyEdges.find((edge) => hierarchyEdgeKey(edge) === highlight.edgeKey);
        if (entry) {
            activeNodes.add(entry.sourceId);
            activeNodes.add(entry.targetId);
        }
    } else if (highlight.nodeId) {
        activeNodes.add(highlight.nodeId);
        for (const entry of hierarchyEdges) {
            if (entry.sourceId === highlight.nodeId || entry.targetId === highlight.nodeId) {
                activeEdges.add(hierarchyEdgeKey(entry));
                activeNodes.add(entry.sourceId);
                activeNodes.add(entry.targetId);
            }
        }
    }
    return {
        activeNodes,
        activeEdges,
        hasHighlight: Boolean(highlight.nodeId || highlight.edgeKey),
    };
}

function isInteractiveGraphHoverTarget(node) {
    let element = node;
    while (element) {
        const className = element.getAttribute?.("class") || "";
        if (
            className.includes("wkb-tree-graph-node-shape") ||
            (className.includes("wkb-tree-graph-label") &&
                !className.includes("wkb-tree-graph-row-header")) ||
            className.includes("wkb-tree-graph-link-hit")
        ) {
            return true;
        }
        element = element.parentNode;
    }
    return false;
}

function hierarchyEdgeTooltip(entry, nodeMetaById) {
    const sourceLabel = nodeMetaById.get(entry.sourceId)?.label || entry.sourceId;
    const targetLabel = nodeMetaById.get(entry.targetId)?.label || entry.targetId;
    return `${sourceLabel} → ${targetLabel}`;
}

function highlightedNodeIdSet(ids) {
    return new Set((ids || []).filter(Boolean));
}

function nodeFillColor(entry, highlightedIds) {
    if (highlightedIds.has(entry.id)) {
        return TREE_VIEW_HIGHLIGHTED_NODE_COLOR;
    }
    if (entry.meta?.isAnchor) {
        return TREE_VIEW_ANCHOR_NODE_COLOR;
    }
    return TREE_VIEW_DEFAULT_NODE_COLOR;
}

export default {
    name: "WorkspaceTreeGraphCanvas",
    props: {
        graphNodes: {
            type: Array,
            default: () => [],
        },
        graphEdges: {
            type: Array,
            default: () => [],
        },
        contextualEdges: {
            type: Array,
            default: () => [],
        },
        selectedNodeId: {
            type: String,
            default: null,
        },
        highlightedNodeIds: {
            type: Array,
            default: () => [],
        },
        zoomLevel: {
            type: Number,
            default: 1,
        },
        hideContextualEdges: {
            type: Boolean,
            default: true,
        },
        hideJumpingEdges: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            size: { width: 0, height: 0 },
            layoutRetryCount: 0,
            hoverTooltip: {
                visible: false,
                text: "",
                left: 0,
                top: 0,
            },
        };
    },
    computed: {
        tooltipStyle() {
            return {
                left: `${this.hoverTooltip.left}px`,
                top: `${this.hoverTooltip.top}px`,
            };
        },
        graphSignature() {
            const nodeIds = (this.graphNodes || []).map((node) => node.id).join("|");
            const edgeIds = (this.graphEdges || []).map((edge) => edge.id).join("|");
            const contextualIds = (this.contextualEdges || []).map((edge) => edge.id).join("|");
            return `${nodeIds}::${edgeIds}::${contextualIds}`;
        },
    },
    watch: {
        graphSignature() {
            this._panOffset = { x: 0, y: 0 };
            this.layoutRetryCount = 0;
            this.scheduleRender();
        },
        selectedNodeId() {
            this._graphInteraction?.updateNodeChromeStyles?.();
        },
        highlightedNodeIds() {
            this._graphInteraction?.updateNodeFillStyles?.();
        },
        zoomLevel() {
            this.applyViewportTransform();
        },
        hideContextualEdges() {
            this.syncGraphEdgeVisibility();
        },
        hideJumpingEdges() {
            this.syncGraphEdgeVisibility();
        },
    },
    created() {
        this._highlight = { nodeId: null, edgeKey: null };
        this._hoveredNodeId = null;
        this._graphInteraction = null;
        this._viewportG = null;
        this._baseTransform = null;
        this._panOffset = { x: 0, y: 0 };
        this._panDrag = null;
    },
    mounted() {
        this.observeResize();
        this.scheduleRender();
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.teardownPanDrag();
        select(this.$refs.svg).on("mouseleave", null);
        this._graphInteraction = null;
    },
    methods: {
        getGraphHighlight() {
            if (this._highlight.nodeId || this._highlight.edgeKey) {
                return this._highlight;
            }
            return null;
        },
        isEdgeShown(entry) {
            const highlight = this.getGraphHighlight();
            return isHierarchyEdgeShown(entry, {
                hideJumpingEdges: this.hideJumpingEdges,
                hideContextualEdges: this.hideContextualEdges,
                highlight,
                hoveredNodeId: this._hoveredNodeId,
            });
        },
        syncGraphEdgeVisibility() {
            this.$nextTick(() => {
                requestAnimationFrame(() => {
                    const interaction = this._graphInteraction;
                    if (!interaction) {
                        return;
                    }
                    interaction.applyEdgeVisibility();
                    interaction.updateHighlightVisuals();
                });
            });
        },
        clearGraphHover({ skipVisuals = false } = {}) {
            this._hoveredNodeId = null;
            this._highlight = { nodeId: null, edgeKey: null };
            this.hideTooltip();
            if (!skipVisuals && this._graphInteraction) {
                this._graphInteraction.applyEdgeVisibility();
                this._graphInteraction.updateHighlightVisuals();
            }
        },
        handlePointerLeaveInteractiveTarget(event) {
            const related = event.relatedTarget;
            if (related && event.currentTarget?.contains?.(related)) {
                return;
            }
            if (isInteractiveGraphHoverTarget(related)) {
                return;
            }
            this.clearGraphHover();
        },
        handlePointerLeaveViewport(event) {
            const root = this.$refs.root;
            if (root && event.relatedTarget && root.contains(event.relatedTarget)) {
                return;
            }
            this.clearGraphHover();
        },
        applyViewportTransform() {
            if (!this._viewportG || !this._baseTransform) {
                return;
            }
            const zoom = Math.max(0.2, Math.min(2, Number(this.zoomLevel) || 1));
            const { offsetX, offsetY, scale } = this._baseTransform;
            const viewWidth = this.size.width;
            const viewHeight = this.size.height;
            const cx = viewWidth / 2;
            const cy = viewHeight / 2;
            const effectiveScale = scale * zoom;
            const panX = this._panOffset?.x || 0;
            const panY = this._panOffset?.y || 0;
            const effectiveOffsetX = cx - zoom * (cx - offsetX) + panX;
            const effectiveOffsetY = cy - zoom * (cy - offsetY) + panY;
            this._viewportG.attr(
                "transform",
                `translate(${effectiveOffsetX},${effectiveOffsetY}) scale(${effectiveScale})`
            );
        },
        teardownPanDrag() {
            if (this._panWindowMove) {
                window.removeEventListener("pointermove", this._panWindowMove);
                window.removeEventListener("pointerup", this._panWindowUp);
                window.removeEventListener("pointercancel", this._panWindowUp);
                this._panWindowMove = null;
                this._panWindowUp = null;
            }
            this._panDrag = null;
            this.setPanningUi(false);
        },
        setPanningUi(active) {
            const root = this.$refs.root;
            const svgEl = this.$refs.svg;
            if (root) {
                root.classList.toggle("is-panning", Boolean(active));
            }
            if (svgEl) {
                select(svgEl)
                    .select(".wkb-tree-graph-pan-bg")
                    .style("cursor", active ? "grabbing" : "grab");
            }
        },
        onPanPointerDown(event) {
            if (event.button !== 0) {
                return;
            }
            event.preventDefault();
            this.clearGraphHover();
            this._panDrag = {
                startX: event.clientX,
                startY: event.clientY,
                baseX: this._panOffset.x,
                baseY: this._panOffset.y,
            };
            this.setPanningUi(true);
            this._panWindowMove = (moveEvent) => this.onPanPointerMove(moveEvent);
            this._panWindowUp = () => this.onPanPointerUp();
            window.addEventListener("pointermove", this._panWindowMove);
            window.addEventListener("pointerup", this._panWindowUp);
            window.addEventListener("pointercancel", this._panWindowUp);
        },
        onPanPointerMove(event) {
            if (!this._panDrag) {
                return;
            }
            this._panOffset = {
                x: this._panDrag.baseX + (event.clientX - this._panDrag.startX),
                y: this._panDrag.baseY + (event.clientY - this._panDrag.startY),
            };
            this.applyViewportTransform();
        },
        onPanPointerUp() {
            this.teardownPanDrag();
        },
        setupPanSurface(svg) {
            this.teardownPanDrag();
            svg.select(".wkb-tree-graph-pan-bg")
                .style("cursor", "grab")
                .on("pointerdown", (event) => this.onPanPointerDown(event));
        },
        scheduleRender() {
            this.$nextTick(() => {
                requestAnimationFrame(() => this.renderGraph());
            });
        },
        measureContainerSize() {
            const element = this.$refs.root;
            if (!element) {
                return false;
            }
            const rect = element.getBoundingClientRect();
            const width = Math.round(rect.width);
            const height = Math.round(rect.height);
            if (width < 16 || height < 16) {
                return false;
            }
            const nextWidth = Math.max(320, width);
            const nextHeight = Math.max(320, height);
            if (nextWidth !== this.size.width || nextHeight !== this.size.height) {
                this.size = { width: nextWidth, height: nextHeight };
            }
            return true;
        },
        observeResize() {
            const element = this.$refs.root;
            if (!element || typeof ResizeObserver === "undefined") {
                return;
            }
            this.resizeObserver = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (!entry) {
                    return;
                }
                const { width, height } = entry.contentRect;
                const nextWidth = Math.max(320, Math.round(width));
                const nextHeight = Math.max(320, Math.round(height));
                if (nextWidth !== this.size.width || nextHeight !== this.size.height) {
                    this.size = { width: nextWidth, height: nextHeight };
                    this.layoutRetryCount = 0;
                    this.renderGraph();
                }
            });
            this.resizeObserver.observe(element);
            this.measureContainerSize();
        },
        hideTooltip() {
            this.hoverTooltip.visible = false;
            this.hoverTooltip.text = "";
        },
        showTooltip(event, text) {
            const root = this.$refs.root;
            if (!root || !text) {
                return;
            }
            const rect = root.getBoundingClientRect();
            this.hoverTooltip.visible = true;
            this.hoverTooltip.text = text;
            this.hoverTooltip.left = Math.min(
                Math.max(8, event.clientX - rect.left + 12),
                rect.width - 240
            );
            this.hoverTooltip.top = Math.min(
                Math.max(8, event.clientY - rect.top + 12),
                rect.height - 40
            );
        },
        renderGraph() {
            const svgEl = this.$refs.svg;
            if (!svgEl) {
                return;
            }
            if (!this.measureContainerSize()) {
                if (this.layoutRetryCount < 8) {
                    this.layoutRetryCount += 1;
                    requestAnimationFrame(() => this.renderGraph());
                }
                return;
            }
            this.layoutRetryCount = 0;

            const visibleNodes = (this.graphNodes || []).filter((node) => node?.id);
            const structuralEdges = (this.graphEdges || []).filter(
                (edge) => edge?.source && edge?.target
            );
            const contextualEdgeList = (this.contextualEdges || []).filter(
                (edge) => edge?.source && edge?.target
            );
            const svg = select(svgEl);
            svg.on("mouseleave", null);
            this.teardownPanDrag();
            svg.selectAll("*").remove();
            this._graphInteraction = null;
            this._viewportG = null;
            this._baseTransform = null;
            this.clearGraphHover({ skipVisuals: true });

            if (!visibleNodes.length) {
                return;
            }

            const viewWidth = this.size.width;
            const viewHeight = this.size.height;

            const layoutDegreeEdges = [...structuralEdges, ...contextualEdgeList];
            const layout = buildRowLayout(visibleNodes, structuralEdges, {
                marginLeft: TREE_LAYOUT_MARGIN_LEFT,
                marginTop: MARGIN_ROW.top,
                rowGaps: ROW_GAPS,
                fixedNodeHorizontalGap: FIXED_NODE_HORIZONTAL_GAP,
                sortEdges: layoutDegreeEdges,
            });

            if (!layout) {
                return;
            }

            const {
                positions,
                nodeMetaById,
                visibleRowLayers = [],
                populatedLayerIndices = [],
            } = layout;

            const contextualEdgeIds = new Set(contextualEdgeList.map((edge) => edge.id));
            const hierarchyEdges = collectHierarchyEdges(
                [...structuralEdges, ...contextualEdgeList],
                nodeMetaById,
                contextualEdgeIds
            );

            const rowHeaderEndX = computeRowHeaderEndX(positions);
            const bounds = computeContentBounds(
                positions,
                visibleRowLayers,
                populatedLayerIndices,
                rowHeaderEndX
            );
            const { offsetX, offsetY, scale } = fitTransform(viewWidth, viewHeight, bounds);

            svg
                .attr("width", viewWidth)
                .attr("height", viewHeight)
                .attr("viewBox", `0 0 ${viewWidth} ${viewHeight}`)
                .attr("preserveAspectRatio", "xMidYMid meet");

            svg.append("rect")
                .attr("class", "wkb-tree-graph-pan-bg")
                .attr("width", viewWidth)
                .attr("height", viewHeight)
                .attr("fill", "transparent")
                .attr("pointer-events", "all");

            const g = svg.append("g").attr("class", "wkb-tree-graph-viewport");
            this._viewportG = g;
            this._baseTransform = { offsetX, offsetY, scale };
            this.applyViewportTransform();
            this.setupPanSurface(svg);

            g.append("g")
                .attr("class", "wkb-tree-graph-row-headers")
                .selectAll("text")
                .data(visibleRowLayers.length ? visibleRowLayers : HIERARCHY_LAYERS, (row) => row.layer ?? row.key)
                .join("text")
                .attr("class", "wkb-tree-graph-row-header")
                .text((row) => row.label)
                .attr("x", rowHeaderEndX - ROW_HEADER_SHIFT_LEFT)
                .attr("y", (row) => {
                    const layer = row.layer ?? HIERARCHY_LAYERS.findIndex((entry) => entry.key === row.key);
                    return treeRowY(layer, MARGIN_ROW.top, ROW_GAP_DEFAULT, populatedLayerIndices, ROW_GAPS);
                })
                .attr("text-anchor", "end")
                .attr("dominant-baseline", "middle");

            const edgeGeometries = new Map();
            const edgeGroup = g.append("g").attr("class", "wkb-tree-graph-edges");
            hierarchyEdges.forEach((entry) => {
                const fromPos = positions.get(entry.sourceId);
                const toPos = positions.get(entry.targetId);
                if (!fromPos || !toPos) {
                    return;
                }
                const fromMeta = nodeMetaById.get(entry.sourceId);
                const toMeta = nodeMetaById.get(entry.targetId);
                const geometry = graphEdgeGeometryRow(
                    { x: fromPos.x, y: fromPos.y },
                    { x: toPos.x, y: toPos.y },
                    nodeShapeRadius(fromMeta?.layer ?? 0, fromMeta?.isAnchor),
                    nodeShapeRadius(toMeta?.layer ?? 0, toMeta?.isAnchor)
                );
                if (!geometry) {
                    return;
                }
                const edgeKey = hierarchyEdgeKey(entry);
                edgeGeometries.set(edgeKey, geometry);
                const isContextual = Boolean(entry.isContextual);
                const baseOpacity = isContextual ? CONTEXTUAL_GRAPH_OPACITY : DEFAULT_GRAPH_OPACITY;
                const group = edgeGroup
                    .append("g")
                    .attr("class", "wkb-tree-graph-edge")
                    .datum(entry)
                    .attr("opacity", baseOpacity);
                group
                    .append("path")
                    .attr("class", "wkb-tree-graph-link")
                    .attr("d", geometry.path)
                    .attr("fill", "none")
                    .attr("stroke", TREE_VIEW_EDGE_COLOR)
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", isContextual ? "6,5" : null);
                group
                    .append("polygon")
                    .attr("class", "wkb-tree-graph-arrowhead")
                    .attr("points", geometry.arrow.map((point) => point.join(",")).join(" "))
                    .attr("fill", TREE_VIEW_EDGE_COLOR);
            });

            const linkHitGroup = g.append("g").attr("class", "wkb-tree-graph-edge-hits");
            const edgesWithGeometry = hierarchyEdges.filter((entry) =>
                edgeGeometries.has(hierarchyEdgeKey(entry))
            );
            linkHitGroup
                .selectAll("path.wkb-tree-graph-link-hit")
                .data(edgesWithGeometry, (entry) => hierarchyEdgeKey(entry))
                .join("path")
                .attr("class", "wkb-tree-graph-link-hit")
                .attr("d", (entry) => edgeGeometries.get(hierarchyEdgeKey(entry)).path)
                .attr("fill", "none")
                .attr("stroke", "transparent")
                .attr("stroke-width", 10)
                .style("cursor", "pointer");

            const nodeEntries = Array.from(positions.entries()).map(([id, pos]) => ({
                id,
                ...pos,
            }));

            const nodeGroups = g
                .append("g")
                .attr("class", "wkb-tree-graph-nodes")
                .selectAll("g.wkb-tree-graph-node")
                .data(nodeEntries, (entry) => entry.id)
                .join("g")
                .attr("class", (entry) => {
                    const classes = ["wkb-tree-graph-node"];
                    if (entry.meta?.isAnchor) {
                        classes.push("is-anchor");
                    }
                    if (entry.id === this.selectedNodeId) {
                        classes.push("is-selected");
                    }
                    return classes.join(" ");
                })
                .attr("transform", (entry) => `translate(${entry.x},${entry.y})`)
                .attr("opacity", DEFAULT_GRAPH_OPACITY)
                .style("cursor", "pointer");

            const vm = this;

            function applyEdgeVisibility() {
                g.selectAll("g.wkb-tree-graph-edge").style("display", (entry) =>
                    vm.isEdgeShown(entry) ? null : "none"
                );
                g.selectAll("path.wkb-tree-graph-link-hit").style("display", (entry) =>
                    vm.isEdgeShown(entry) ? null : "none"
                );
            }

            function updateHighlightVisuals() {
                applyEdgeVisibility();
                const highlightState = vm.getGraphHighlight();
                const { activeNodes, activeEdges, hasHighlight } = buildHighlightSets(
                    highlightState,
                    hierarchyEdges.filter((entry) => vm.isEdgeShown(entry))
                );
                g.selectAll("g.wkb-tree-graph-edge").attr("opacity", (entry) => {
                    if (!vm.isEdgeShown(entry)) {
                        return 0;
                    }
                    const key = hierarchyEdgeKey(entry);
                    const baseOpacity = entry.isContextual ? CONTEXTUAL_GRAPH_OPACITY : DEFAULT_GRAPH_OPACITY;
                    if (!hasHighlight) {
                        return baseOpacity;
                    }
                    const dimmedOpacity = entry.isContextual
                        ? DIMMED_CONTEXTUAL_GRAPH_OPACITY
                        : DIMMED_GRAPH_OPACITY;
                    return activeEdges.has(key) ? baseOpacity : dimmedOpacity;
                });
                g.selectAll("g.wkb-tree-graph-node").attr("opacity", (entry) => {
                    if (!hasHighlight) {
                        return DEFAULT_GRAPH_OPACITY;
                    }
                    return activeNodes.has(entry.id) ? DEFAULT_GRAPH_OPACITY : DIMMED_GRAPH_OPACITY;
                });
            }

            function updateNodeChromeStyles() {
                g.selectAll("g.wkb-tree-graph-node")
                    .classed("is-selected", (entry) => entry.id === vm.selectedNodeId)
                    .each(function updateNodeRings(entry) {
                        const group = select(this);
                        group.selectAll(".wkb-tree-graph-node-selection-ring").remove();

                        if (entry.id !== vm.selectedNodeId) {
                            return;
                        }
                        const layer = entry.meta?.layer ?? 0;
                        const radius = nodeRadius(layer);
                        const anchorRadius = nodeShapeRadius(layer, true);
                        const isAnchor = entry.meta?.isAnchor;
                        const shapeRadius = isAnchor ? anchorRadius : radius;
                        group
                            .append("circle")
                            .attr("class", "wkb-tree-graph-node-selection-ring")
                            .attr("r", shapeRadius + 4)
                            .attr("fill", "none")
                            .attr("stroke", "#ff6600")
                            .attr("stroke-width", 2)
                            .style("pointer-events", "none");
                    });
            }

            function updateNodeFillStyles() {
                const highlightedIds = highlightedNodeIdSet(vm.highlightedNodeIds);
                g.selectAll("g.wkb-tree-graph-node .wkb-tree-graph-node-shape").attr(
                    "fill",
                    (entry) => nodeFillColor(entry, highlightedIds)
                );
            }

            function handleNodePointerEnter(event, entry) {
                vm._hoveredNodeId = entry.id;
                vm._highlight = { nodeId: entry.id, edgeKey: null };
                vm.showTooltip(event, entry.meta?.label || entry.id);
                updateHighlightVisuals();
            }

            function handleEdgePointerEnter(event, entry) {
                vm._hoveredNodeId = null;
                vm._highlight = { nodeId: null, edgeKey: hierarchyEdgeKey(entry) };
                vm.showTooltip(event, hierarchyEdgeTooltip(entry, nodeMetaById));
                updateHighlightVisuals();
            }

            const pointerLeave = (event) => vm.handlePointerLeaveInteractiveTarget(event);

            nodeGroups.each(function renderNodeShape(entry) {
                const group = select(this);
                const layer = entry.meta?.layer ?? 0;
                const radius = nodeRadius(layer);
                const anchorRadius = nodeShapeRadius(layer, true);
                const highlightedIds = highlightedNodeIdSet(vm.highlightedNodeIds);
                const fill = nodeFillColor(entry, highlightedIds);

                const onClick = (event) => {
                    event.stopPropagation();
                    vm.$emit("node-menu-open", {
                        nodeId: entry.id,
                        label: entry.meta?.label || entry.id,
                        isAnchor: Boolean(entry.meta?.isAnchor),
                        left: event.clientX + 10,
                        top: event.clientY + 10,
                    });
                };

                if (entry.meta?.isAnchor) {
                    group
                        .append("polygon")
                        .attr("class", "wkb-tree-graph-node-shape")
                        .attr("points", anchorDiamondPoints(anchorRadius))
                        .attr("fill", fill)
                        .on("click", onClick)
                        .on("mouseenter", (event) => handleNodePointerEnter(event, entry))
                        .on("mouseleave", pointerLeave);
                } else {
                    group
                        .append("circle")
                        .attr("class", "wkb-tree-graph-node-shape")
                        .attr("r", radius)
                        .attr("fill", fill)
                        .on("click", onClick)
                        .on("mouseenter", (event) => handleNodePointerEnter(event, entry))
                        .on("mouseleave", pointerLeave);
                }

                const placement = treeNodeLabelPlacement(entry);
                group
                    .append("text")
                    .attr("class", "wkb-tree-graph-label")
                    .attr("font-size", 13)
                    .text(truncateLabel(entry.meta?.label))
                    .attr("text-anchor", placement.textAnchor)
                    .attr("dominant-baseline", "middle")
                    .attr("x", placement.x)
                    .attr("y", placement.y)
                    .attr("transform", `rotate(${placement.angle},${placement.x},${placement.y})`)
                    .style("cursor", "pointer")
                    .on("click", onClick)
                    .on("mouseenter", (event) => handleNodePointerEnter(event, entry))
                    .on("mouseleave", pointerLeave);
            });

            g.selectAll("path.wkb-tree-graph-link-hit")
                .on("mouseenter", (event, entry) => handleEdgePointerEnter(event, entry))
                .on("mouseleave", pointerLeave);

            svg.on("mouseleave", (event) => vm.handlePointerLeaveViewport(event));

            this._graphInteraction = {
                applyEdgeVisibility,
                updateHighlightVisuals,
                updateNodeChromeStyles,
                updateNodeFillStyles,
            };

            applyEdgeVisibility();
            updateNodeChromeStyles();
            updateNodeFillStyles();
            if (this.getGraphHighlight()) {
                updateHighlightVisuals();
            }
        },
    },
};
</script>

<style scoped>
.wkb-tree-graph {
    position: absolute;
    inset: 0;
    background: var(--cfde-bg, #f6f5f2);
    overflow: hidden;
}

.wkb-tree-graph-svg {
    display: block;
    width: 100%;
    height: 100%;
}

.wkb-tree-graph.is-panning {
    user-select: none;
}

.wkb-tree-graph-row-header {
    fill: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
}

.wkb-tree-graph-label {
    fill: var(--cfde-ink, #33363d);
    pointer-events: stroke;
}

.wkb-tree-graph-tooltip {
    position: absolute;
    z-index: 3;
    max-width: 240px;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(30, 32, 38, 0.92);
    color: #fff;
    font-size: 13px;
    line-height: 1.4;
    pointer-events: none;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.wkb-tree-graph-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
