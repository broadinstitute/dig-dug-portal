<template>
    <div class="scp-kg">
        <div class="scp-kg-pipeline" aria-label="How CFDE KG search works">
            <p class="scp-kg-pipeline-title">How this search works</p>
            <ol class="scp-kg-pipeline-steps">
                <li class="scp-kg-pipeline-step">
                    <span class="scp-kg-pipeline-num">1</span>
                    <span class="scp-kg-pipeline-text"
                        ><strong>Mechanism candidates</strong> — semantically search for up to 25 CFDE KG Factors matching
                        the hypothesis outcome</span
                    >
                </li>
                <li class="scp-kg-pipeline-step">
                    <span class="scp-kg-pipeline-num">2</span>
                    <span class="scp-kg-pipeline-text"
                        ><strong>Select mechanisms</strong> — LLM picks 1–5 Factors most relevant to the hypothesis (not
                        forced to fill five)</span
                    >
                </li>
                <li class="scp-kg-pipeline-step">
                    <span class="scp-kg-pipeline-num">3</span>
                    <span class="scp-kg-pipeline-text"
                        ><strong>Hop 1</strong> — direct gene→trait associations for the target gene and outcome-related
                        traits</span
                    >
                </li>
                <li class="scp-kg-pipeline-step">
                    <span class="scp-kg-pipeline-num">4</span>
                    <span class="scp-kg-pipeline-text"
                        ><strong>Hop 2</strong> — gene→Factor links for the selected mechanisms</span
                    >
                </li>
                <li class="scp-kg-pipeline-step">
                    <span class="scp-kg-pipeline-num">5</span>
                    <span class="scp-kg-pipeline-text"
                        ><strong>Hop 3</strong> — gene set membership where the gene's sets link to matching traits</span
                    >
                </li>
                <li class="scp-kg-pipeline-step">
                    <span class="scp-kg-pipeline-num">6</span>
                    <span class="scp-kg-pipeline-text"
                        ><strong>Network</strong> — build the Gene / Gene set / Factor / Trait graph from confirmed
                        edges</span
                    >
                </li>
                <li
                    class="scp-kg-pipeline-step"
                    :class="{ 'scp-kg-pipeline-step--optional': !relevanceComplete }"
                >
                    <span class="scp-kg-pipeline-num">7</span>
                    <span class="scp-kg-pipeline-text">
                        <strong>Relevance to hypothesis</strong> — optional LLM labels for how each evidence edge relates
                        to the hypothesis.
                        <span v-if="!relevanceComplete" class="scp-kg-pipeline-guide"
                            >To run this step, open the Actions panel and choose
                            <em>Classify CFDE KG relevance</em> (it appears at the top of Next steps after the search
                            finishes).</span
                        >
                    </span>
                </li>
            </ol>
            <p class="scp-kg-pipeline-note">
                These three hops are independent evidence routes against digcfdekg — not a single chained path — using
                the parsed target gene and outcome (plus selected Factor disease context).
            </p>
        </div>

        <div v-if="blockedReason" class="scp-kg-callout" role="status">{{ blockedReason }}</div>

        <template v-else-if="evidence">
            <ScopeKgNetworkGraph v-if="networkGraph && networkGraph.nodes.length" :graph="networkGraph" />

            <div class="scp-kg-coverage">
                {{ evidence.coverage.kg }} — {{ evidence.coverage.scope }}
            </div>
            <div v-if="selectedMechanismLine" class="scp-kg-coverage">
                {{ selectedMechanismLine }}
            </div>
            <div v-if="relevanceLoading" class="scp-kg-relevance-status">
                <span class="scp-kg-relevance-marker"></span>
                Classifying relevance…
            </div>

            <div v-for="route in evidence.routes" :key="route.id" class="scp-kg-route">
                <div class="scp-kg-route-head">
                    <span class="scp-kg-route-title">Hop {{ route.hop }} · {{ route.label }}</span>
                </div>

                <table v-if="route.edges.length" class="scp-kg-table">
                    <thead>
                        <tr>
                            <th v-for="col in columnsFor(route.id)" :key="col.key">{{ col.label }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(edge, index) in sortedEdges(route)" :key="index">
                            <td
                                v-for="col in columnsFor(route.id)"
                                :key="col.key"
                                :class="{ 'scp-kg-cell-wrap': col.key === 'geneSetLabel' }"
                            >
                                {{ cellValue(edge, col.key) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="scp-kg-empty" role="status">
                    <div class="scp-kg-route-flag">Not found in {{ evidence.coverage.kg }} for this route.</div>
                    <div v-if="route.id === 'factor'" class="scp-kg-hop2-detail">
                        <p>
                            <strong>Target gene queried:</strong>
                            {{ hop2Detail.targetGene || "—" }}
                        </p>
                        <p>
                            <strong>Mechanism search text</strong> (used to fetch Factor candidates):
                            {{ hop2Detail.mechanismQuery || "—" }}
                        </p>
                        <p>
                            <strong>Factor candidates returned:</strong>
                            {{ hop2Detail.candidateCount }}
                            <template v-if="hop2Detail.selectedCount">
                                · <strong>Selected for Hop 2:</strong> {{ hop2Detail.selectedCount }}
                            </template>
                        </p>
                        <p v-if="hop2Detail.selectionRationale">
                            <strong>Selection rationale:</strong> {{ hop2Detail.selectionRationale }}
                        </p>
                        <template v-if="hop2Detail.selectedFactors.length">
                            <p><strong>Factors checked for gene→Factor sharing:</strong></p>
                            <ul class="scp-kg-hop2-factor-list">
                                <li v-for="factor in hop2Detail.selectedFactors" :key="factor.iri || factor.label">
                                    <span class="scp-kg-hop2-factor-label">{{ factor.label || "Unnamed factor" }}</span>
                                    <span v-if="factor.cfdeDisease" class="scp-kg-hop2-factor-meta">
                                        · disease context: {{ factor.cfdeDisease }}
                                    </span>
                                    <span v-if="factor.score != null" class="scp-kg-hop2-factor-meta">
                                        · score {{ formatScore(factor.score) }}
                                    </span>
                                </li>
                            </ul>
                            <p class="scp-kg-hop2-note">
                                No <code>geneToFactor</code> edge was found between
                                <strong>{{ hop2Detail.targetGene || "the target gene" }}</strong> and these Factors in
                                digcfdekg.
                            </p>
                        </template>
                        <p v-else-if="hop2Detail.strategy === 'trait_label_join'" class="scp-kg-hop2-note">
                            No mechanism Factor was selected, so Hop 2 fell back to joining gene→Factor and trait→Factor
                            by trait-label match
                            <template v-if="hop2Detail.traitCandidates.length">
                                (candidates:
                                {{ hop2Detail.traitCandidates.join("; ") }})
                            </template>
                            — that join also returned no edges.
                        </p>
                        <p v-else class="scp-kg-hop2-note">
                            No mechanism Factors were available to query for gene→Factor sharing.
                        </p>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import ScopeKgNetworkGraph from "@/components/researchPortal/customComponents/revealScope/ScopeKgNetworkGraph.vue";

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

/** Allow long UNDERSCORE_IDS to wrap at each `_` without widening the table. */
function wrapAtUnderscores(value) {
    return String(value == null ? "" : value).replace(/_/g, "_\u200b");
}

export default {
    name: "ScopeKgEvidenceTable",
    components: {
        ScopeKgNetworkGraph,
    },
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
        networkGraph: {
            type: Object,
            default: null,
        },
    },
    computed: {
        selectedMechanismLine() {
            const factors = this.evidence && this.evidence.resolvedFactors;
            if (!Array.isArray(factors) || !factors.length) return "";
            const labels = factors.map((f) => f && f.label).filter(Boolean);
            if (!labels.length) return "";
            const candidateCount =
                (this.evidence.factorCandidates && this.evidence.factorCandidates.length) ||
                factors.length;
            const rationale = this.evidence.selectedFactorRationale
                ? ` — ${this.evidence.selectedFactorRationale}`
                : "";
            const countLabel =
                factors.length === 1
                    ? "Selected mechanism"
                    : `Selected mechanisms (${factors.length})`;
            return `${countLabel} (from ${candidateCount} candidates): ${labels.join("; ")}${rationale}`;
        },
        relevanceComplete() {
            const routes = this.evidence && this.evidence.routes;
            if (!Array.isArray(routes)) return false;
            return routes.some(
                (route) =>
                    Array.isArray(route.edges) && route.edges.some((edge) => edge && edge.relevance)
            );
        },
        hop2Detail() {
            const evidence = this.evidence || {};
            const ctx = evidence.queryContext || {};
            const selected = Array.isArray(evidence.resolvedFactors) ? evidence.resolvedFactors : [];
            return {
                targetGene: ctx.targetGene || null,
                mechanismQuery: ctx.mechanismQuery || null,
                strategy: ctx.hop2Strategy || (selected.length ? "selected_factor_iris" : "trait_label_join"),
                traitCandidates: Array.isArray(ctx.traitCandidates) ? ctx.traitCandidates : [],
                candidateCount: Array.isArray(evidence.factorCandidates) ? evidence.factorCandidates.length : 0,
                selectedCount: selected.length,
                selectionRationale: evidence.selectedFactorRationale || null,
                selectedFactors: selected.map((f) => ({
                    iri: f && f.iri,
                    label: f && f.label,
                    cfdeDisease: f && f.cfdeDisease,
                    score: f && f.score,
                })),
            };
        },
    },
    methods: {
        columnsFor(routeId) {
            return COLUMNS_BY_ROUTE[routeId] || [];
        },
        formatScore(score) {
            const n = Number(score);
            return Number.isFinite(n) ? n.toFixed(3) : String(score);
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
            if (colKey === "geneSetLabel") {
                return wrapAtUnderscores(edge.geneSetLabel);
            }
            return edge[colKey];
        },
    },
};
</script>

<style scoped>
.scp-kg {
    padding: 18px;
    background-color: #ffffff;
    border-radius: 15px;
    border-top: solid 1px #dddddd;
}

.scp-kg-pipeline {
    margin: 0 0 16px;
    padding: 14px 16px;
    border-radius: 10px;
    background: rgb(246, 245, 242);
}

.scp-kg-pipeline-title {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.scp-kg-pipeline-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.scp-kg-pipeline-step {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.scp-kg-pipeline-num {
    flex: 0 0 22px;
    height: 22px;
    width: 22px;
    border-radius: 999px;
    background: var(--cfde-blue, #2c5c97);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    line-height: 22px;
    text-align: center;
}

.scp-kg-pipeline-step--optional .scp-kg-pipeline-num {
    background: var(--cfde-orange, #e07b39);
}

.scp-kg-pipeline-text {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
}

.scp-kg-pipeline-guide {
    display: block;
    margin-top: 4px;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-kg-pipeline-note {
    margin: 12px 0 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--cfde-muted, #6b6b6b);
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
    background: rgb(246, 245, 242);
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

.scp-kg-route-flag {
    display: inline-block;
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    font-size: 13px;
    line-height: 1.35;
    padding: 8px 14px;
    border-radius: 999px;
}

.scp-kg-empty {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
}

.scp-kg-hop2-detail {
    width: 100%;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.scp-kg-hop2-detail p {
    margin: 0 0 6px;
}

.scp-kg-hop2-factor-list {
    margin: 0 0 8px;
    padding-left: 18px;
}

.scp-kg-hop2-factor-label {
    font-weight: 600;
}

.scp-kg-hop2-factor-meta,
.scp-kg-hop2-note {
    color: var(--cfde-muted, #6b6b6b);
}

.scp-kg-hop2-note {
    margin: 0;
}

.scp-kg-hop2-note code {
    font-size: 12px;
}

.scp-kg-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 13px;
}

.scp-kg-table th,
.scp-kg-table td {
    text-align: left;
    padding: 6px 10px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
    vertical-align: top;
}

.scp-kg-table th {
    color: var(--cfde-blue, #2c5c97);
    font-weight: 600;
}

.scp-kg-table td {
    color: var(--cfde-ink, #33363d);
}

.scp-kg-cell-wrap {
    overflow-wrap: anywhere;
    word-break: break-word;
    white-space: normal;
}
</style>
