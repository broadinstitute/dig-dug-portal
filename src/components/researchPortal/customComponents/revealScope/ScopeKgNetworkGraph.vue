<template>
    <div v-if="graph && graph.nodes.length" class="scp-kgnet">
        <svg :viewBox="`0 0 ${width} ${height}`" class="scp-kgnet-svg" preserveAspectRatio="xMidYMid meet">
            <line
                v-for="(edge, index) in positionedEdges"
                :key="'edge-' + index"
                :x1="edge.x1"
                :y1="edge.y1"
                :x2="edge.x2"
                :y2="edge.y2"
                :stroke-width="edge.strokeWidth"
                :stroke-opacity="edge.opacity"
                stroke="#6b6b6b"
            >
                <title>{{ edge.title }}</title>
            </line>
            <g v-for="node in positionedNodes" :key="node.id">
                <circle :cx="node.x" :cy="node.y" :r="6" :fill="rowColor(node.type)">
                    <title>{{ node.label }}</title>
                </circle>
                <text :x="node.x" :y="node.y + 18" text-anchor="middle" class="scp-kgnet-label">
                    {{ truncate(node.label) }}
                </text>
            </g>
            <text
                v-for="row in rowOrder"
                :key="'row-label-' + row"
                :x="12"
                :y="rowY(row) + 4"
                class="scp-kgnet-row-label"
            >
                {{ rowLabel(row) }}
            </text>
        </svg>
    </div>
</template>

<script>
const ROW_LABELS = {
    gene: "Gene",
    geneSet: "Gene set",
    factor: "Factor",
    trait: "Trait",
};

const ROW_COLORS = {
    gene: "#2c5c97",
    geneSet: "#e07b39",
    factor: "#7c5ec9",
    trait: "#6b6b6b",
};

const WIDTH = 900;
const ROW_GAP = 80;
const TOP_PADDING = 50;
const LEFT_PADDING = 90;

export default {
    name: "ScopeKgNetworkGraph",
    props: {
        graph: {
            type: Object,
            default: null,
        },
    },
    computed: {
        rowOrder() {
            return (this.graph && this.graph.rowOrder) || ["gene", "geneSet", "factor", "trait"];
        },
        width() {
            return WIDTH;
        },
        height() {
            return TOP_PADDING * 2 + ROW_GAP * (this.rowOrder.length - 1);
        },
        nodesByRow() {
            const byRow = {};
            this.rowOrder.forEach((row) => {
                byRow[row] = [];
            });
            (this.graph ? this.graph.nodes : []).forEach((node) => {
                if (!byRow[node.type]) byRow[node.type] = [];
                byRow[node.type].push(node);
            });
            return byRow;
        },
        positionedNodes() {
            const positioned = [];
            this.rowOrder.forEach((row) => {
                const nodesInRow = this.nodesByRow[row] || [];
                const usableWidth = this.width - LEFT_PADDING - 20;
                nodesInRow.forEach((node, index) => {
                    const x = LEFT_PADDING + ((index + 1) * usableWidth) / (nodesInRow.length + 1);
                    positioned.push({ ...node, x, y: this.rowY(row) });
                });
            });
            return positioned;
        },
        nodePositionById() {
            const byId = {};
            this.positionedNodes.forEach((node) => {
                byId[node.id] = node;
            });
            return byId;
        },
        maxAbsWeight() {
            const weights = (this.graph ? this.graph.edges : [])
                .map((e) => (e.weight == null ? null : Math.abs(e.weight)))
                .filter((w) => w != null);
            return weights.length ? Math.max(...weights) : 1;
        },
        positionedEdges() {
            return (this.graph ? this.graph.edges : [])
                .map((edge) => {
                    const source = this.nodePositionById[edge.source];
                    const target = this.nodePositionById[edge.target];
                    if (!source || !target) return null;
                    const normalized = edge.weight == null ? 0.5 : Math.abs(edge.weight) / this.maxAbsWeight;
                    return {
                        x1: source.x,
                        y1: source.y,
                        x2: target.x,
                        y2: target.y,
                        opacity: 0.3 + normalized * 0.55,
                        strokeWidth: 1 + normalized * 2,
                        title: `${source.label} → ${target.label}${edge.weight == null ? "" : ` (weight ${edge.weight})`}`,
                    };
                })
                .filter(Boolean);
        },
    },
    methods: {
        rowY(row) {
            const index = this.rowOrder.indexOf(row);
            return TOP_PADDING + Math.max(index, 0) * ROW_GAP;
        },
        rowLabel(row) {
            return ROW_LABELS[row] || row;
        },
        rowColor(row) {
            return ROW_COLORS[row] || "#6b6b6b";
        },
        truncate(label) {
            const text = String(label || "");
            return text.length > 22 ? `${text.slice(0, 21)}…` : text;
        },
    },
};
</script>

<style scoped>
.scp-kgnet {
    padding: 18px 18px 6px;
}

.scp-kgnet-svg {
    width: 100%;
    height: auto;
    display: block;
}

.scp-kgnet-label {
    font-size: 10px;
    fill: var(--cfde-ink, #33363d);
}

.scp-kgnet-row-label {
    font-size: 11px;
    font-weight: 700;
    fill: var(--cfde-muted, #6b6b6b);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
</style>
