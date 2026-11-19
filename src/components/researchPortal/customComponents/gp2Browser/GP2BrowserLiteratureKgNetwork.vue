<template>
    <div class="gp2-lit-kg">
        <div v-if="loading" class="gp2-lit-kg-status">Building knowledge graph…</div>
        <div v-else-if="error" class="gp2-lit-kg-status gp2-lit-kg-status-error">{{ error }}</div>
        <template v-else-if="hasGraph">
            <div
                class="gp2-lit-kg-scroll"
                @click="clearFocus"
                @mouseleave="clearHover"
            >
                <div
                    class="gp2-lit-kg-diagram"
                    :style="{ minWidth: diagramWidth + 'px', height: diagramHeight + 'px' }"
                >
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

                    <!-- Layer 4: labels only in column corridors, above nodes. -->
                    <svg
                        class="gp2-lit-kg-labels"
                        :width="diagramWidth"
                        :height="diagramHeight"
                        aria-hidden="true"
                    >
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

            <p v-if="selectedDetail" class="gp2-lit-kg-detail">
                <strong>{{ selectedDetail.title }}</strong>
                <span v-if="selectedDetail.claims"> — claims {{ selectedDetail.claims }}</span>
                <button
                    v-if="selectedDetail.claimNumbers.length"
                    type="button"
                    class="gp2-lit-kg-detail-action"
                    @click="$emit('focus-claims', selectedDetail.claimNumbers)"
                >
                    Show claims
                </button>
            </p>
            <p v-else class="gp2-lit-kg-hint">
                Hover or click an edge or node to highlight links. Click empty space to clear a
                pinned selection.
            </p>
        </template>
        <p v-else class="gp2-lit-kg-status">
            No knowledge graph yet. Generate claims first, then a graph will appear here.
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
const CHAR_PX = 7.1;
const PORT_PAD = 6;

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

function cubicPath(x1, y1, x2, y2) {
    const dx = Math.max(56, (x2 - x1) * 0.55);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/** Same-side U-turn: both ports on x, arched outward (positive = right). */
function sameSidePath(x, y1, y2, bulge) {
    return `M ${x} ${y1} C ${x + bulge} ${y1}, ${x + bulge} ${y2}, ${x} ${y2}`;
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
        };
    },
    computed: {
        hasGraph() {
            return Boolean(this.kg?.nodes?.length && this.kg?.edges?.length);
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

            const drafted = raw.map((edge) => {
                const y1 =
                    exitY.get(edge.id) ?? edge.fromNode.y + edge.fromNode.height / 2;
                const y2 =
                    entryY.get(edge.id) ?? edge.toNode.y + edge.toNode.height / 2;
                const fromIdx = presentTypes.indexOf(edge.fromType);
                const toIdx = presentTypes.indexOf(edge.toType);

                let path;
                let labelX;
                let labelY = (y1 + y2) / 2;
                let labelWidth = estimateLabelWidth(edge.label);
                let corridorKey;

                if (edge.sameColumn) {
                    const col = columnByType.get(edge.fromType);
                    const onRight = edge.sameSide === "right";
                    const x = onRight
                        ? edge.fromNode.x + edge.fromNode.width
                        : edge.fromNode.x;
                    const dy = Math.abs(y2 - y1);
                    const rank = sameColRank.get(edge.id) || 0;
                    const bulgeMag = Math.max(40, Math.min(160, 32 + dy * 0.55 + rank * 18));
                    const bulge = onRight ? bulgeMag : -bulgeMag;
                    path = sameSidePath(x, y1, y2, bulge);

                    // Label sits on the arch, in the open corridor beside the column.
                    if (onRight) {
                        const nextType = presentTypes[fromIdx + 1];
                        const nextCol = nextType ? columnByType.get(nextType) : null;
                        const gapLeft = (col ? col.x + col.width : x) + 10;
                        const gapRight = nextCol
                            ? nextCol.x - 10
                            : gapLeft + Math.max(bulgeMag + 24, 120);
                        corridorKey = `${edge.fromType}->${nextType || "end"}`;
                        labelWidth = Math.min(labelWidth, Math.max(40, gapRight - gapLeft - 8));
                        labelX = Math.min(
                            Math.max(x + bulgeMag * 0.7, gapLeft + labelWidth / 2),
                            gapRight - labelWidth / 2
                        );
                    } else {
                        const prevType = presentTypes[fromIdx - 1];
                        const prevCol = prevType ? columnByType.get(prevType) : null;
                        const gapRight = (col ? col.x : x) - 10;
                        const gapLeft = prevCol
                            ? prevCol.x + prevCol.width + 10
                            : gapRight - Math.max(bulgeMag + 24, 120);
                        corridorKey = `${prevType || "start"}->${edge.fromType}`;
                        labelWidth = Math.min(labelWidth, Math.max(40, gapRight - gapLeft - 8));
                        labelX = Math.max(
                            Math.min(x - bulgeMag * 0.7, gapRight - labelWidth / 2),
                            gapLeft + labelWidth / 2
                        );
                    }
                } else {
                    const x1 = edge.fromNode.x + edge.fromNode.width;
                    const x2 = edge.toNode.x;
                    path = cubicPath(x1, y1, x2, y2);

                    const leftIdx = Math.min(fromIdx, toIdx);
                    const rightIdx = Math.max(fromIdx, toIdx);
                    const corridorLeftType = presentTypes[leftIdx];
                    const corridorRightType =
                        rightIdx === leftIdx + 1
                            ? presentTypes[rightIdx]
                            : presentTypes[Math.min(leftIdx + 1, presentTypes.length - 1)];
                    const leftCol = columnByType.get(corridorLeftType);
                    const rightCol = columnByType.get(corridorRightType);
                    const gapLeft = leftCol ? leftCol.x + leftCol.width + 10 : x1 + 10;
                    const gapRight = rightCol ? rightCol.x - 10 : x2 - 10;
                    corridorKey = `${corridorLeftType}->${corridorRightType}`;
                    labelWidth = Math.min(labelWidth, Math.max(40, gapRight - gapLeft - 8));
                    labelX = (gapLeft + gapRight) / 2;
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
                    corridorKey,
                    path,
                };
            });

            // Nudge overlapping labels apart within the same corridor.
            const byCorridor = new Map();
            drafted.forEach((edge) => {
                if (!byCorridor.has(edge.corridorKey)) {
                    byCorridor.set(edge.corridorKey, []);
                }
                byCorridor.get(edge.corridorKey).push(edge);
            });
            byCorridor.forEach((edges) => {
                edges.sort((a, b) => a.labelY - b.labelY || a.id.localeCompare(b.id));
                for (let i = 1; i < edges.length; i += 1) {
                    const prev = edges[i - 1];
                    const cur = edges[i];
                    const minGap = 20;
                    if (cur.labelY - prev.labelY < minGap) {
                        cur.labelY = prev.labelY + minGap;
                    }
                }
            });

            return drafted.map(({ corridorKey, ...edge }) => edge);
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
        },
    },
    methods: {
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
        selectEdge(edge) {
            this.selectedEdgeId = edge.id;
            this.selectedNodeId = null;
            this.clearHoverNow();
        },
        selectNode(node) {
            this.selectedNodeId = node.id;
            this.selectedEdgeId = null;
            this.clearHoverNow();
        },
        clearFocus() {
            this.selectedEdgeId = null;
            this.selectedNodeId = null;
            this.clearHoverNow();
        },
    },
    beforeDestroy() {
        this.cancelHoverClear();
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

.gp2-lit-kg-scroll {
    width: 100%;
    overflow: auto;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
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
.gp2-lit-kg-edge-label-group.is-dimmed {
    opacity: 0.16;
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

.gp2-lit-kg-detail-action {
    margin-left: 8px;
    padding: 0;
    border: none;
    background: none;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
    text-decoration: underline;
}
</style>
