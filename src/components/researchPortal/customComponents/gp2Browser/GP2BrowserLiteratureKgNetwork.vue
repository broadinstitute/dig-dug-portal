<template>
    <div class="gp2-lit-kg">
        <div v-if="loading" class="gp2-lit-kg-status">Building knowledge graph…</div>
        <div v-else-if="error" class="gp2-lit-kg-status gp2-lit-kg-status-error">{{ error }}</div>
        <template v-else-if="hasGraph">
            <div class="gp2-lit-kg-toolbar" @click.stop>
                <label class="gp2-lit-kg-zoom">
                    <span>Zoom</span>
                    <input
                        v-model.number="zoomPercent"
                        type="range"
                        min="25"
                        max="150"
                        step="5"
                        aria-label="Network zoom"
                    />
                    <span class="gp2-lit-kg-zoom-value">{{ zoomPercent }}%</span>
                </label>
                <button type="button" class="gp2-lit-kg-fit" @click="fitToViewport">
                    Fit
                </button>
            </div>
            <div
                ref="scroll"
                class="gp2-lit-kg-scroll"
                @click="clearFocus"
                @mouseleave="clearHover"
            >
                <div class="gp2-lit-kg-scale-wrap" :style="scaleWrapStyle">
                    <div class="gp2-lit-kg-diagram" :style="diagramStyle">
                    <!-- Layer 1: column backgrounds only (edges must paint above these). -->
                    <div
                        v-for="column in layoutColumns"
                        :key="`group-${column.type}`"
                        class="gp2-lit-kg-group"
                        :style="groupStyle(column)"
                    >
                        <div class="gp2-lit-kg-group-title">{{ column.title }}</div>
                    </div>

                    <!-- Layer 2: edge paths under nodes. -->
                    <svg
                        class="gp2-lit-kg-edges"
                        :width="diagramWidth"
                        :height="diagramHeight"
                        aria-hidden="true"
                    >
                        <defs>
                            <marker
                                id="gp2-lit-kg-arrow"
                                viewBox="0 0 10 10"
                                refX="9"
                                refY="5"
                                markerWidth="7"
                                markerHeight="7"
                                orient="auto-start-reverse"
                            >
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#8a8f98" />
                            </marker>
                            <marker
                                id="gp2-lit-kg-arrow-active"
                                viewBox="0 0 10 10"
                                refX="9"
                                refY="5"
                                markerWidth="7"
                                markerHeight="7"
                                orient="auto-start-reverse"
                            >
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2c5c97" />
                            </marker>
                            <marker
                                id="gp2-lit-kg-arrow-conflict"
                                viewBox="0 0 10 10"
                                refX="9"
                                refY="5"
                                markerWidth="7"
                                markerHeight="7"
                                orient="auto-start-reverse"
                            >
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ee3124" />
                            </marker>
                        </defs>
                        <g
                            v-for="edge in layoutEdges"
                            :key="edge.id"
                            class="gp2-lit-kg-edge"
                            :class="{
                                'is-active': edge.id === focusEdgeId,
                                'is-dimmed': isEdgeDimmed(edge),
                                'is-conflict': edge.conflict,
                            }"
                            @click.stop="selectEdge(edge)"
                            @mouseenter="hoverEdge(edge)"
                            @mouseleave="clearHover"
                        >
                            <path
                                :d="edge.path"
                                fill="none"
                                stroke="transparent"
                                stroke-width="14"
                            />
                            <path
                                :d="edge.path"
                                fill="none"
                                :stroke="edgeStroke(edge)"
                                stroke-width="1.6"
                                :marker-end="edgeMarker(edge)"
                            />
                        </g>
                    </svg>

                    <!-- Layer 3: nodes above edge paths. -->
                    <button
                        v-for="node in flatNodes"
                        :key="node.id"
                        type="button"
                        class="gp2-lit-kg-node"
                        :class="{
                            'is-active': activeNodeIds.has(node.id),
                            'is-dimmed': isNodeDimmed(node),
                        }"
                        :style="nodeStyle(node)"
                        :title="`${node.type}: ${node.label}`"
                        @click.stop="selectNode(node)"
                        @mouseenter="hoverNode(node)"
                        @mouseleave="clearHover"
                    >
                        <span class="gp2-lit-kg-node-text">{{ node.label }}</span>
                    </button>

                    <!-- Layer 4: start dots + labels above nodes so origins stay visible. -->
                    <svg
                        class="gp2-lit-kg-labels"
                        :width="diagramWidth"
                        :height="diagramHeight"
                        aria-hidden="true"
                    >
                        <g
                            v-for="edge in layoutEdges"
                            :key="`start-${edge.id}`"
                            class="gp2-lit-kg-edge-start"
                            :class="{
                                'is-active': edge.id === focusEdgeId,
                                'is-dimmed': isEdgeDimmed(edge),
                            }"
                            @click.stop="selectEdge(edge)"
                            @mouseenter="hoverEdge(edge)"
                            @mouseleave="clearHover"
                        >
                            <circle
                                :cx="edge.startX"
                                :cy="edge.startY"
                                r="3.5"
                                :fill="edgeStroke(edge)"
                            />
                        </g>
                        <g
                            v-for="edge in layoutEdges"
                            :key="`label-${edge.id}`"
                            class="gp2-lit-kg-edge-label-group"
                            :class="{
                                'is-active': edge.id === focusEdgeId,
                                'is-dimmed': isEdgeDimmed(edge),
                            }"
                            @click.stop="selectEdge(edge)"
                            @mouseenter="hoverEdge(edge)"
                            @mouseleave="clearHover"
                        >
                            <rect
                                v-if="edge.label"
                                :x="edge.labelX - edge.labelWidth / 2"
                                :y="edge.labelY - 9"
                                :width="edge.labelWidth"
                                :height="18"
                                rx="4"
                                ry="4"
                                class="gp2-lit-kg-edge-label-bg"
                            />
                            <text
                                v-if="edge.label"
                                :x="edge.labelX"
                                :y="edge.labelY + 4"
                                text-anchor="middle"
                                class="gp2-lit-kg-edge-label"
                            >
                                {{ edge.label }}
                            </text>
                        </g>
                    </svg>
                    </div>
                </div>
            </div>

            <p v-if="selectedDetail" class="gp2-lit-kg-detail">
                <strong>{{ selectedDetail.title }}</strong>
                <span v-if="selectedDetail.claims"> — evidences {{ selectedDetail.claims }}</span>
            </p>
            <p v-else class="gp2-lit-kg-hint">
                Hover or click an edge or node to highlight links and related evidences. Click empty
                space to clear a pinned selection.
            </p>
        </template>
        <p v-else class="gp2-lit-kg-status">
            No knowledge graph yet. Generate evidences first, then a graph will appear here.
        </p>
    </div>
</template>

<script>
const COLUMN_ORDER = ["variant", "gene", "mechanism", "phenotype"];
const COLUMN_TITLES = {
    variant: "variants",
    gene: "genes",
    mechanism: "mechanisms",
    phenotype: "phenotype",
};

const NODE_MIN_WIDTH = 110;
const NODE_MAX_WIDTH = 200;
const NODE_HEIGHT = 40;
const NODE_GAP_Y = 18;
const GROUP_PAD_X = 16;
const GROUP_PAD_TOP = 30;
const GROUP_PAD_BOTTOM = 16;
const COLUMN_GAP_MIN = 180;
const DIAGRAM_PAD = 16;
const DIAGRAM_MARGIN = 10;
const CHAR_PX = 7.1;
const PORT_PAD = 6;
const ZOOM_MIN = 25;
const ZOOM_MAX = 150;
/** Cross-column labels sit this far right of the edge start, at start Y. */
const CROSS_LABEL_OFFSET_X = 50;

function humanizeRelation(relation) {
    return String(relation || "")
        .replace(/_/g, " ")
        .trim();
}

function estimateTextWidth(text, maxWidth = NODE_MAX_WIDTH) {
    const value = String(text || "");
    return Math.max(NODE_MIN_WIDTH, Math.min(maxWidth, value.length * CHAR_PX + 24));
}

function estimateLabelWidth(label) {
    const text = String(label || "");
    return Math.max(40, Math.min(180, text.length * 6.4 + 14));
}

function cubicControls(x1, y1, x2, y2) {
    const dx = Math.max(56, (x2 - x1) * 0.55);
    return {
        p0: { x: x1, y: y1 },
        p1: { x: x1 + dx, y: y1 },
        p2: { x: x2 - dx, y: y2 },
        p3: { x: x2, y: y2 },
    };
}

function sameSideControls(x, y1, y2, bulge) {
    return {
        p0: { x, y: y1 },
        p1: { x: x + bulge, y: y1 },
        p2: { x: x + bulge, y: y2 },
        p3: { x, y: y2 },
    };
}

function cubicPathFromControls({ p0, p1, p2, p3 }) {
    return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}

function cubicPointAt({ p0, p1, p2, p3 }, t) {
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;
    return {
        x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
        y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
    };
}

/** Evenly spaced Y ports along a node side so edges don't share one anchor. */
function assignSidePorts(count, nodeTop, nodeHeight) {
    if (count <= 0) {
        return [];
    }
    const usable = Math.max(8, nodeHeight - PORT_PAD * 2);
    if (count === 1) {
        return [nodeTop + nodeHeight / 2];
    }
    return Array.from({ length: count }, (_, index) => {
        const t = index / (count - 1);
        return nodeTop + PORT_PAD + t * usable;
    });
}

function sideKey(nodeId, side) {
    return `${nodeId}::${side}`;
}

function nodeType(node) {
    return COLUMN_ORDER.includes(node?.type) ? node.type : "mechanism";
}

export default {
    name: "GP2BrowserLiteratureKgNetwork",
    props: {
        kg: {
            type: Object,
            default: null,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        error: {
            type: String,
            default: null,
        },
        visible: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            selectedEdgeId: null,
            selectedNodeId: null,
            hoveredEdgeId: null,
            hoveredNodeId: null,
            hoverClearTimer: null,
            zoomPercent: 100,
            viewportWidth: 0,
            resizeObserver: null,
        };
    },
    computed: {
        hasGraph() {
            return Boolean(this.kg?.nodes?.length && this.kg?.edges?.length);
        },
        zoomScale() {
            return this.zoomPercent / 100;
        },
        scaleWrapStyle() {
            return {
                width: `${this.diagramWidth * this.zoomScale + DIAGRAM_MARGIN * 2}px`,
                height: `${this.diagramHeight * this.zoomScale + DIAGRAM_MARGIN * 2}px`,
            };
        },
        diagramStyle() {
            return {
                width: `${this.diagramWidth}px`,
                height: `${this.diagramHeight}px`,
                transform: `scale(${this.zoomScale})`,
                transformOrigin: "top left",
            };
        },
        // Click pins focus; hover previews the same dimming when nothing is pinned.
        focusEdgeId() {
            return this.selectedEdgeId || this.hoveredEdgeId;
        },
        focusNodeId() {
            if (this.selectedEdgeId || this.selectedNodeId) {
                return this.selectedNodeId;
            }
            return this.hoveredNodeId;
        },
        nodesById() {
            const map = new Map();
            (this.kg?.nodes || []).forEach((node) => {
                if (node?.id) {
                    map.set(node.id, node);
                }
            });
            return map;
        },
        orderedBuckets() {
            const buckets = {
                variant: [],
                gene: [],
                mechanism: [],
                phenotype: [],
            };
            (this.kg?.nodes || []).forEach((node) => {
                buckets[nodeType(node)].push(node);
            });

            // Light crossing reduction: order each column by average neighbor
            // rank from the previous column.
            const rank = new Map();
            COLUMN_ORDER.forEach((type, columnIndex) => {
                if (columnIndex === 0) {
                    buckets[type].forEach((node, index) => rank.set(node.id, index));
                    return;
                }
                const prevTypes = new Set(COLUMN_ORDER.slice(0, columnIndex));
                const scored = buckets[type].map((node) => {
                    const neighborRanks = (this.kg?.edges || [])
                        .filter((edge) => edge.to === node.id && this.nodesById.has(edge.from))
                        .map((edge) => rank.get(edge.from))
                        .filter((value) => value != null);
                    const avg = neighborRanks.length
                        ? neighborRanks.reduce((sum, value) => sum + value, 0) /
                          neighborRanks.length
                        : Number.POSITIVE_INFINITY;
                    return { node, avg };
                });
                scored.sort((a, b) => a.avg - b.avg || a.node.label.localeCompare(b.node.label));
                buckets[type] = scored.map((entry) => entry.node);
                buckets[type].forEach((node, index) => rank.set(node.id, index));
            });

            // Prefer phenotype "Parkinson..." near the vertical center of genes.
            if (buckets.phenotype.length > 1) {
                buckets.phenotype.sort((a, b) => {
                    const aPd = /parkinson/i.test(a.label) ? 0 : 1;
                    const bPd = /parkinson/i.test(b.label) ? 0 : 1;
                    return aPd - bPd || a.label.localeCompare(b.label);
                });
            }

            return buckets;
        },
        layoutColumns() {
            if (!this.hasGraph) {
                return [];
            }
            const buckets = this.orderedBuckets;
            const columnWidths = {};
            COLUMN_ORDER.forEach((type) => {
                const labels = buckets[type].map((node) => node.label);
                columnWidths[type] = labels.length
                    ? Math.max(...labels.map((label) => estimateTextWidth(label)))
                    : NODE_MIN_WIDTH;
            });

            // Corridor width grows with the longest edge label crossing it.
            const corridorGaps = {};
            for (let i = 0; i < COLUMN_ORDER.length - 1; i += 1) {
                const left = COLUMN_ORDER[i];
                const right = COLUMN_ORDER[i + 1];
                const key = `${left}->${right}`;
                let maxLabel = 0;
                (this.kg?.edges || []).forEach((edge) => {
                    const from = this.nodesById.get(edge.from);
                    const to = this.nodesById.get(edge.to);
                    if (!from || !to) {
                        return;
                    }
                    if (nodeType(from) === left && nodeType(to) === right) {
                        maxLabel = Math.max(
                            maxLabel,
                            estimateLabelWidth(humanizeRelation(edge.relation))
                        );
                    }
                });
                corridorGaps[key] = Math.max(COLUMN_GAP_MIN, maxLabel + 56);
            }

            const presentTypes = COLUMN_ORDER.filter((type) => buckets[type].length);
            let x = DIAGRAM_PAD;
            return presentTypes.map((type, index) => {
                const nodeWidth = columnWidths[type];
                const groupX = x;
                const groupY = DIAGRAM_PAD;
                const nodes = buckets[type].map((node, nodeIndex) => ({
                    ...node,
                    x: groupX + GROUP_PAD_X,
                    y: groupY + GROUP_PAD_TOP + nodeIndex * (NODE_HEIGHT + NODE_GAP_Y),
                    width: nodeWidth,
                    height: NODE_HEIGHT,
                }));
                const height =
                    GROUP_PAD_TOP +
                    GROUP_PAD_BOTTOM +
                    nodes.length * NODE_HEIGHT +
                    Math.max(0, nodes.length - 1) * NODE_GAP_Y;
                const width = nodeWidth + GROUP_PAD_X * 2;
                const column = {
                    type,
                    title: COLUMN_TITLES[type] || type,
                    x: groupX,
                    y: groupY,
                    width,
                    height,
                    nodes,
                };
                const nextType = presentTypes[index + 1];
                const nextGap = nextType
                    ? corridorGaps[`${type}->${nextType}`] || COLUMN_GAP_MIN
                    : 0;
                x += width + nextGap;
                return column;
            });
        },
        flatNodes() {
            return this.layoutColumns.flatMap((column) => column.nodes);
        },
        layoutNodeMap() {
            const map = new Map();
            this.flatNodes.forEach((node) => map.set(node.id, node));
            return map;
        },
        diagramWidth() {
            if (!this.layoutColumns.length) {
                return 640;
            }
            const last = this.layoutColumns[this.layoutColumns.length - 1];
            return last.x + last.width + DIAGRAM_PAD;
        },
        diagramHeight() {
            if (!this.layoutColumns.length) {
                return 280;
            }
            const maxGroup = Math.max(...this.layoutColumns.map((column) => column.height));
            return maxGroup + DIAGRAM_PAD * 2 + 24;
        },
        layoutEdges() {
            const columnByType = new Map(
                this.layoutColumns.map((column) => [column.type, column])
            );
            const presentTypes = this.layoutColumns.map((column) => column.type);

            const raw = (this.kg?.edges || [])
                .map((edge, index) => {
                    const from = this.layoutNodeMap.get(edge.from);
                    const to = this.layoutNodeMap.get(edge.to);
                    if (!from || !to) {
                        return null;
                    }
                    const fromType = nodeType(from);
                    const toType = nodeType(to);
                    const sameColumn = fromType === toType;
                    // Same-column edges stay on one side and arc outside the
                    // column: prefer the right corridor, left only for the last column.
                    const colIdx = presentTypes.indexOf(fromType);
                    const sameSide =
                        !sameColumn
                            ? null
                            : colIdx >= 0 && colIdx === presentTypes.length - 1
                              ? "left"
                              : "right";
                    return {
                        id: `e-${index}`,
                        from: edge.from,
                        to: edge.to,
                        relation: edge.relation,
                        conflict: Boolean(edge.conflict),
                        claimNumbers: edge.claimNumbers || [],
                        label: humanizeRelation(edge.relation),
                        fromNode: from,
                        toNode: to,
                        fromType,
                        toType,
                        sameColumn,
                        sameSide,
                    };
                })
                .filter(Boolean);

            // Attachments per node-side so same-column and cross edges never
            // share one port, and same-column uses the same side on both ends.
            const attachments = new Map();
            const addAttachment = (nodeId, side, edge, role) => {
                const key = sideKey(nodeId, side);
                if (!attachments.has(key)) {
                    attachments.set(key, []);
                }
                attachments.get(key).push({ edge, role });
            };
            raw.forEach((edge) => {
                if (edge.sameColumn) {
                    addAttachment(edge.from, edge.sameSide, edge, "exit");
                    addAttachment(edge.to, edge.sameSide, edge, "entry");
                } else {
                    addAttachment(edge.from, "right", edge, "exit");
                    addAttachment(edge.to, "left", edge, "entry");
                }
            });

            const exitY = new Map();
            const entryY = new Map();
            attachments.forEach((items, key) => {
                const nodeId = key.split("::")[0];
                const node = this.layoutNodeMap.get(nodeId);
                items.sort((a, b) => {
                    const aOther = a.role === "exit" ? a.edge.toNode : a.edge.fromNode;
                    const bOther = b.role === "exit" ? b.edge.toNode : b.edge.fromNode;
                    return aOther.y - bOther.y || a.edge.id.localeCompare(b.edge.id);
                });
                const ports = assignSidePorts(items.length, node.y, node.height);
                items.forEach((item, index) => {
                    if (item.role === "exit") {
                        exitY.set(item.edge.id, ports[index]);
                    } else {
                        entryY.set(item.edge.id, ports[index]);
                    }
                });
            });

            // Stagger same-column arch depths within a column so parallel loops
            // don't stack on top of each other.
            const sameColRank = new Map();
            const bySameColumn = new Map();
            raw.filter((edge) => edge.sameColumn).forEach((edge) => {
                if (!bySameColumn.has(edge.fromType)) {
                    bySameColumn.set(edge.fromType, []);
                }
                bySameColumn.get(edge.fromType).push(edge);
            });
            bySameColumn.forEach((edges) => {
                edges.sort((a, b) => {
                    const aSpan = Math.abs(a.fromNode.y - a.toNode.y);
                    const bSpan = Math.abs(b.fromNode.y - b.toNode.y);
                    return aSpan - bSpan || a.id.localeCompare(b.id);
                });
                edges.forEach((edge, index) => sameColRank.set(edge.id, index));
            });

            return raw.map((edge) => {
                const y1 =
                    exitY.get(edge.id) ?? edge.fromNode.y + edge.fromNode.height / 2;
                const y2 =
                    entryY.get(edge.id) ?? edge.toNode.y + edge.toNode.height / 2;
                const fromIdx = presentTypes.indexOf(edge.fromType);
                const labelWidth = estimateLabelWidth(edge.label);

                let controls;
                let labelX;
                let labelY;

                if (edge.sameColumn) {
                    const onRight = edge.sameSide === "right";
                    const x = onRight
                        ? edge.fromNode.x + edge.fromNode.width
                        : edge.fromNode.x;
                    const dy = Math.abs(y2 - y1);
                    const rank = sameColRank.get(edge.id) || 0;
                    const bulgeMag = Math.max(40, Math.min(160, 32 + dy * 0.55 + rank * 18));
                    const bulge = onRight ? bulgeMag : -bulgeMag;
                    controls = sameSideControls(x, y1, y2, bulge);
                    // Keep same-column labels on the arch (not the 50px rule).
                    const onArch = cubicPointAt(controls, 0.5);
                    labelX = onArch.x;
                    labelY = onArch.y;
                } else {
                    const x1 = edge.fromNode.x + edge.fromNode.width;
                    const x2 = edge.toNode.x;
                    controls = cubicControls(x1, y1, x2, y2);
                    // Cross-column: 50px right of the start port, same Y as start.
                    labelX = x1 + CROSS_LABEL_OFFSET_X;
                    labelY = y1;

                    // Keep the pill inside the first corridor after the source.
                    const nextType = presentTypes[fromIdx + 1];
                    const col = columnByType.get(edge.fromType);
                    const nextCol = nextType ? columnByType.get(nextType) : null;
                    const gapLeft = (col ? col.x + col.width : x1) + 8;
                    const gapRight = nextCol ? nextCol.x - 8 : x2 - 8;
                    const minX = gapLeft + labelWidth / 2;
                    const maxX = gapRight - labelWidth / 2;
                    if (maxX >= minX) {
                        labelX = Math.min(Math.max(labelX, minX), maxX);
                    }
                }

                return {
                    id: edge.id,
                    from: edge.from,
                    to: edge.to,
                    relation: edge.relation,
                    conflict: edge.conflict,
                    claimNumbers: edge.claimNumbers,
                    label: edge.label,
                    labelWidth,
                    labelX,
                    labelY,
                    startX: controls.p0.x,
                    startY: controls.p0.y,
                    path: cubicPathFromControls(controls),
                };
            });
        },
        activeNodeIds() {
            const ids = new Set();
            if (this.focusNodeId) {
                ids.add(this.focusNodeId);
            }
            const edge = this.layoutEdges.find((entry) => entry.id === this.focusEdgeId);
            if (edge) {
                ids.add(edge.from);
                ids.add(edge.to);
            }
            if (this.focusNodeId) {
                this.layoutEdges.forEach((entry) => {
                    if (entry.from === this.focusNodeId || entry.to === this.focusNodeId) {
                        ids.add(entry.from);
                        ids.add(entry.to);
                    }
                });
            }
            return ids;
        },
        selectedDetail() {
            if (this.selectedEdgeId) {
                const edge = this.layoutEdges.find((entry) => entry.id === this.selectedEdgeId);
                if (!edge) {
                    return null;
                }
                const from = this.nodesById.get(edge.from);
                const to = this.nodesById.get(edge.to);
                return {
                    title: `${from?.label || edge.from} → ${edge.label} → ${to?.label || edge.to}`,
                    claims: (edge.claimNumbers || []).join(", "),
                    claimNumbers: edge.claimNumbers || [],
                };
            }
            if (this.selectedNodeId) {
                const node = this.nodesById.get(this.selectedNodeId);
                if (!node) {
                    return null;
                }
                const related = this.layoutEdges.filter(
                    (edge) => edge.from === node.id || edge.to === node.id
                );
                const claimNumbers = [
                    ...new Set(related.flatMap((edge) => edge.claimNumbers || [])),
                ].sort((a, b) => a - b);
                return {
                    title: `${node.type}: ${node.label}`,
                    claims: claimNumbers.join(", "),
                    claimNumbers,
                };
            }
            return null;
        },
    },
    watch: {
        kg() {
            this.selectedEdgeId = null;
            this.selectedNodeId = null;
            this.clearHoverNow();
            this.emitFocusClaims([]);
            this.$nextTick(() => this.fitToViewport());
        },
        visible(isVisible) {
            if (isVisible) {
                this.$nextTick(() => this.fitToViewport());
            }
        },
        hasGraph(ready) {
            if (ready) {
                this.$nextTick(() => {
                    this.observeViewport();
                    this.fitToViewport();
                });
            }
        },
    },
    mounted() {
        this.$nextTick(() => {
            this.observeViewport();
            this.fitToViewport();
        });
    },
    methods: {
        observeViewport() {
            if (typeof ResizeObserver === "undefined" || !this.$refs.scroll) {
                return;
            }
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            this.resizeObserver = new ResizeObserver(() => {
                const el = this.$refs.scroll;
                if (!el) {
                    return;
                }
                const next = el.clientWidth;
                const wasEmpty = this.viewportWidth < 40;
                if (Math.abs(next - this.viewportWidth) < 2) {
                    return;
                }
                this.viewportWidth = next;
                // Refit when the panel first gets a real width; otherwise leave
                // the user's slider choice alone until they hit Fit.
                if (wasEmpty && next >= 40) {
                    this.fitToViewport();
                }
            });
            this.resizeObserver.observe(this.$refs.scroll);
            this.viewportWidth = this.$refs.scroll.clientWidth;
        },
        fitToViewport() {
            const el = this.$refs.scroll;
            if (!el || !this.hasGraph || !this.diagramWidth) {
                return;
            }
            const available = Math.max(120, el.clientWidth - DIAGRAM_MARGIN * 2 - 8);
            const fit = Math.floor((available / this.diagramWidth) * 100);
            this.zoomPercent = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fit));
        },
        groupStyle(column) {
            return {
                left: `${column.x}px`,
                top: `${column.y}px`,
                width: `${column.width}px`,
                height: `${column.height}px`,
            };
        },
        nodeStyle(node) {
            return {
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.width}px`,
                height: `${node.height}px`,
            };
        },
        isEdgeDimmed(edge) {
            if (!this.focusEdgeId && !this.focusNodeId) {
                return false;
            }
            if (this.focusEdgeId) {
                return edge.id !== this.focusEdgeId;
            }
            return edge.from !== this.focusNodeId && edge.to !== this.focusNodeId;
        },
        isNodeDimmed(node) {
            if (!this.focusEdgeId && !this.focusNodeId) {
                return false;
            }
            return !this.activeNodeIds.has(node.id);
        },
        edgeStroke(edge) {
            if (edge.id === this.focusEdgeId) {
                return "#2c5c97";
            }
            if (
                this.focusNodeId &&
                (edge.from === this.focusNodeId || edge.to === this.focusNodeId)
            ) {
                return "#2c5c97";
            }
            return edge.conflict ? "#ee3124" : "#8a8f98";
        },
        edgeMarker(edge) {
            if (edge.id === this.focusEdgeId) {
                return "url(#gp2-lit-kg-arrow-active)";
            }
            if (
                this.focusNodeId &&
                (edge.from === this.focusNodeId || edge.to === this.focusNodeId)
            ) {
                return "url(#gp2-lit-kg-arrow-active)";
            }
            return edge.conflict ? "url(#gp2-lit-kg-arrow-conflict)" : "url(#gp2-lit-kg-arrow)";
        },
        cancelHoverClear() {
            if (this.hoverClearTimer) {
                clearTimeout(this.hoverClearTimer);
                this.hoverClearTimer = null;
            }
        },
        hoverEdge(edge) {
            this.cancelHoverClear();
            this.hoveredEdgeId = edge.id;
            this.hoveredNodeId = null;
        },
        hoverNode(node) {
            this.cancelHoverClear();
            this.hoveredNodeId = node.id;
            this.hoveredEdgeId = null;
        },
        clearHover() {
            // Short delay so moving between a node and its edge doesn't flash.
            this.cancelHoverClear();
            this.hoverClearTimer = setTimeout(() => {
                this.hoveredEdgeId = null;
                this.hoveredNodeId = null;
                this.hoverClearTimer = null;
            }, 60);
        },
        clearHoverNow() {
            this.cancelHoverClear();
            this.hoveredEdgeId = null;
            this.hoveredNodeId = null;
        },
        claimNumbersForEdge(edge) {
            return Array.isArray(edge?.claimNumbers) ? [...edge.claimNumbers] : [];
        },
        claimNumbersForNode(nodeId) {
            const related = this.layoutEdges.filter(
                (edge) => edge.from === nodeId || edge.to === nodeId
            );
            return [
                ...new Set(related.flatMap((edge) => edge.claimNumbers || [])),
            ].sort((a, b) => a - b);
        },
        emitFocusClaims(claimNumbers) {
            this.$emit("focus-claims", claimNumbers || []);
        },
        selectEdge(edge) {
            this.selectedEdgeId = edge.id;
            this.selectedNodeId = null;
            this.clearHoverNow();
            this.emitFocusClaims(this.claimNumbersForEdge(edge));
        },
        selectNode(node) {
            this.selectedNodeId = node.id;
            this.selectedEdgeId = null;
            this.clearHoverNow();
            this.emitFocusClaims(this.claimNumbersForNode(node.id));
        },
        clearFocus() {
            this.selectedEdgeId = null;
            this.selectedNodeId = null;
            this.clearHoverNow();
            this.emitFocusClaims([]);
        },
        /**
         * Self-contained SVG snapshot of the current layout (no hover/selection
         * dimming). Used by the Literature evidence HTML download.
         */
        exportSvgString() {
            if (!this.hasGraph) {
                return "";
            }
            const escapeXml = (value) =>
                String(value || "")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");
            const width = this.diagramWidth;
            const height = this.diagramHeight;
            const parts = [
                `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Literature evidence knowledge graph">`,
                "<defs>",
                `<marker id="gp2-lit-kg-export-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8a8f98"/></marker>`,
                `<marker id="gp2-lit-kg-export-arrow-conflict" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ee3124"/></marker>`,
                "</defs>",
            ];
            this.layoutColumns.forEach((column) => {
                parts.push(
                    `<rect x="${column.x}" y="${column.y}" width="${column.width}" height="${column.height}" rx="8" ry="8" fill="#f3f4f6" stroke="#d5d8de"/>`
                );
                parts.push(
                    `<text x="${column.x + 12}" y="${column.y + 18}" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#6b6b6b">${escapeXml(
                        column.title
                    )}</text>`
                );
            });
            this.layoutEdges.forEach((edge) => {
                const stroke = edge.conflict ? "#ee3124" : "#8a8f98";
                const marker = edge.conflict
                    ? "url(#gp2-lit-kg-export-arrow-conflict)"
                    : "url(#gp2-lit-kg-export-arrow)";
                parts.push(
                    `<path d="${escapeXml(edge.path)}" fill="none" stroke="${stroke}" stroke-width="1.6" marker-end="${marker}"/>`
                );
                parts.push(
                    `<circle cx="${edge.startX}" cy="${edge.startY}" r="3.5" fill="${stroke}"/>`
                );
                if (edge.label) {
                    const lx = edge.labelX - edge.labelWidth / 2;
                    const ly = edge.labelY - 9;
                    parts.push(
                        `<rect x="${lx}" y="${ly}" width="${edge.labelWidth}" height="18" rx="4" ry="4" fill="#ffffff" stroke="#d8dbe0"/>`
                    );
                    parts.push(
                        `<text x="${edge.labelX}" y="${edge.labelY + 4}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#33363d">${escapeXml(
                            edge.label
                        )}</text>`
                    );
                }
            });
            this.flatNodes.forEach((node) => {
                parts.push(
                    `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="8" ry="8" fill="#ffffff" stroke="#c9ced6"/>`
                );
                parts.push(
                    `<text x="${node.x + node.width / 2}" y="${
                        node.y + node.height / 2 + 4
                    }" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="600" fill="#33363d">${escapeXml(
                        node.label
                    )}</text>`
                );
            });
            parts.push("</svg>");
            return parts.join("");
        },
    },
    beforeDestroy() {
        this.cancelHoverClear();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    },
};
</script>

<style scoped>
.gp2-lit-kg {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.gp2-lit-kg-status {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-kg-status-error {
    color: #ee3124;
}

.gp2-lit-kg-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
}

.gp2-lit-kg-zoom {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-kg-zoom input[type="range"] {
    width: 140px;
    vertical-align: middle;
}

.gp2-lit-kg-zoom-value {
    min-width: 40px;
    font-variant-numeric: tabular-nums;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-kg-fit {
    padding: 2px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 4px;
    background: #ffffff;
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.gp2-lit-kg-scroll {
    width: 100%;
    overflow: auto;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
}

.gp2-lit-kg-scale-wrap {
    position: relative;
}

.gp2-lit-kg-diagram {
    position: relative;
    margin: 10px;
}

.gp2-lit-kg-group {
    position: absolute;
    z-index: 1;
    box-sizing: border-box;
    border: 1px solid #d5d8de;
    border-radius: 10px;
    background: #f3f4f6;
    pointer-events: none;
}

.gp2-lit-kg-group-title {
    position: absolute;
    top: 8px;
    left: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #6b6b6b;
}

.gp2-lit-kg-edges {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: visible;
    pointer-events: none;
}

.gp2-lit-kg-edge {
    pointer-events: stroke;
    cursor: pointer;
}

.gp2-lit-kg-edge.is-dimmed,
.gp2-lit-kg-edge-start.is-dimmed,
.gp2-lit-kg-edge-label-group.is-dimmed {
    opacity: 0.16;
}

.gp2-lit-kg-edge-start {
    pointer-events: all;
    cursor: pointer;
}

.gp2-lit-kg-labels {
    position: absolute;
    inset: 0;
    z-index: 4;
    overflow: visible;
    pointer-events: none;
}

.gp2-lit-kg-edge-label-group {
    pointer-events: all;
    cursor: pointer;
}

.gp2-lit-kg-edge-label-bg {
    fill: #ffffff;
    stroke: #d8dbe0;
    stroke-width: 1;
}

.gp2-lit-kg-edge-label {
    fill: #33363d;
    font-size: 11px;
    font-family: Inter, "Segoe UI", system-ui, sans-serif;
}

.gp2-lit-kg-edge-label-group.is-active .gp2-lit-kg-edge-label-bg {
    fill: #e8f0fa;
    stroke: #2c5c97;
}

.gp2-lit-kg-edge-label-group.is-active .gp2-lit-kg-edge-label {
    fill: #2c5c97;
}

.gp2-lit-kg-node {
    position: absolute;
    z-index: 3;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 4px 10px;
    border: 1px solid #c9ced6;
    border-radius: 6px;
    background: #ffffff;
    color: #33363d;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.25;
    text-align: center;
    cursor: pointer;
}

.gp2-lit-kg-node-text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    white-space: normal;
    word-break: break-word;
}

.gp2-lit-kg-node.is-active {
    border-color: #2c5c97;
    box-shadow: 0 0 0 2px rgba(44, 92, 151, 0.18);
}

.gp2-lit-kg-node.is-dimmed {
    opacity: 0.28;
}

.gp2-lit-kg-detail,
.gp2-lit-kg-hint {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-kg-hint {
    color: var(--cfde-muted, #6b6b6b);
}
</style>
