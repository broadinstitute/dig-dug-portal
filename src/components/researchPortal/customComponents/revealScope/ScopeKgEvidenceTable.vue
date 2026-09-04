<template>
    <div class="scp-kg">
        <div v-if="blockedReason" class="scp-kg-callout" role="status">{{ blockedReason }}</div>

        <template v-else-if="evidence">
            <div class="scp-kg-coverage">
                {{ evidence.coverage.kg }} — {{ evidence.coverage.scope }}
            </div>
            <div v-if="relevanceLoading" class="scp-kg-relevance-status">
                <span class="scp-kg-relevance-marker"></span>
                Classifying relevance…
            </div>

            <div v-for="route in evidence.routes" :key="route.id" class="scp-kg-route">
                <div class="scp-kg-route-head">
                    <span class="scp-kg-route-title">Hop {{ route.hop }} · {{ route.label }}</span>
                    <span
                        class="scp-kg-route-state"
                        :class="{ 'is-unexplored': route.state !== 'VERIFIED' }"
                    >
                        {{ route.state }}
                    </span>
                </div>

                <table v-if="route.edges.length" class="scp-kg-table">
                    <thead>
                        <tr>
                            <th v-for="col in columnsFor(route.id)" :key="col.key">{{ col.label }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(edge, index) in sortedEdges(route)" :key="index">
                            <td v-for="col in columnsFor(route.id)" :key="col.key">
                                {{ cellValue(edge, col.key) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p v-else class="scp-kg-route-empty">
                    Not found in {{ evidence.coverage.kg }} for this route.
                </p>
            </div>
        </template>
    </div>
</template>

<script>
const RELEVANCE_COLUMNS = [
    { key: "relevanceLabel", label: "Relevance" },
    { key: "relevanceRationale", label: "Relevance rationale" },
];

const COLUMNS_BY_ROUTE = {
    direct: [
        { key: "geneLabel", label: "Gene" },
        { key: "traitLabel", label: "Trait" },
        { key: "weight", label: "Weight" },
        ...RELEVANCE_COLUMNS,
    ],
    factor: [
        { key: "geneLabel", label: "Gene" },
        { key: "factorLabel", label: "Factor" },
        { key: "geneFactorWeight", label: "Gene→Factor weight" },
        { key: "traitLabel", label: "Trait" },
        { key: "traitFactorWeight", label: "Trait→Factor weight" },
        { key: "matchedVia", label: "Matched via" },
        { key: "searchScore", label: "Search score" },
        ...RELEVANCE_COLUMNS,
    ],
    geneSet: [
        { key: "geneLabel", label: "Gene" },
        { key: "geneSetLabel", label: "Gene set" },
        { key: "traitLabel", label: "Trait" },
        { key: "weight", label: "Weight" },
        ...RELEVANCE_COLUMNS,
    ],
};

const RELEVANCE_LABELS = {
    on_topic: "On topic",
    same_domain_mismatched_context: "Same domain, mismatched context",
    unrelated: "Unrelated",
};

/** Sort rank so on_topic sorts first, unrelated last; not-yet-triaged edges keep their original order (tie at the end). */
const RELEVANCE_RANK = {
    on_topic: 0,
    same_domain_mismatched_context: 1,
    unrelated: 2,
};

function relevanceRank(edge) {
    const label = edge && edge.relevance && edge.relevance.label;
    return Object.prototype.hasOwnProperty.call(RELEVANCE_RANK, label)
        ? RELEVANCE_RANK[label]
        : Number.MAX_SAFE_INTEGER;
}

export default {
    name: "ScopeKgEvidenceTable",
    props: {
        evidence: {
            type: Object,
            default: null,
        },
        blockedReason: {
            type: String,
            default: null,
        },
        relevanceLoading: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        columnsFor(routeId) {
            return COLUMNS_BY_ROUTE[routeId] || [];
        },
        sortedEdges(route) {
            return (route.edges || []).slice().sort((a, b) => relevanceRank(a) - relevanceRank(b));
        },
        cellValue(edge, colKey) {
            if (colKey === "relevanceLabel") {
                if (this.relevanceLoading) return "…";
                if (!edge.relevance) return "—";
                return RELEVANCE_LABELS[edge.relevance.label] || edge.relevance.label;
            }
            if (colKey === "relevanceRationale") {
                return edge.relevance ? edge.relevance.rationale : "";
            }
            return edge[colKey];
        },
    },
};
</script>

<style scoped>
.scp-kg {
    padding: 18px;
}

.scp-kg-callout {
    display: inline-block;
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    font-size: 13px;
    line-height: 1.35;
    padding: 8px 14px;
    border-radius: 999px;
}

.scp-kg-coverage {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
    margin-bottom: 8px;
}

.scp-kg-relevance-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
    margin-bottom: 16px;
}

.scp-kg-relevance-marker {
    flex: 0 0 10px;
    height: 10px;
    width: 10px;
    border-radius: 999px;
    background: var(--cfde-orange, #e07b39);
    animation: scp-kg-relevance-pulse 1.1s ease-in-out infinite;
}

@keyframes scp-kg-relevance-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.4;
    }
}

.scp-kg-route {
    margin-bottom: 16px;
    padding: 14px 16px;
    border-radius: 10px;
    background: #fff;
}

.scp-kg-route-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
}

.scp-kg-route-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.scp-kg-route-state {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.scp-kg-route-state.is-unexplored {
    color: var(--cfde-muted, #6b6b6b);
}

.scp-kg-route-empty {
    margin: 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-kg-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.scp-kg-table th,
.scp-kg-table td {
    text-align: left;
    padding: 6px 10px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.scp-kg-table th {
    color: var(--cfde-blue, #2c5c97);
    font-weight: 600;
}

.scp-kg-table td {
    color: var(--cfde-ink, #33363d);
}
</style>
