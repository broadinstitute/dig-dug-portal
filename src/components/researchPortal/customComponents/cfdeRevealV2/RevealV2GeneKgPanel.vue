<template>
    <div class="rv2-gene-kg">
        <header class="rv2-gene-kg-head">
            <div class="rv2-gene-kg-title-row">
                <h3 class="rv2-gene-kg-title">
                    <span class="rv2-gene-kg-gene">{{ geneLabel }}</span>
                    <span class="rv2-gene-kg-subtitle">CFDE knowledge graph</span>
                </h3>
                <p v-if="loading" class="rv2-gene-kg-status">Loading associations…</p>
                <p v-else-if="error" class="rv2-gene-kg-error">{{ error }}</p>
            </div>
            <div v-if="!loading && !error && geneKg" class="rv2-gene-kg-counts">
                <span class="rv2-gene-kg-count">
                    <strong>{{ traitCount }}</strong> traits
                </span>
                <span class="rv2-gene-kg-count">
                    <strong>{{ factorCount }}</strong> factors
                </span>
                <span class="rv2-gene-kg-count">
                    <strong>{{ edgeCount }}</strong> edges
                </span>
            </div>
        </header>

        <div v-if="loading" class="rv2-gene-kg-loading" aria-busy="true">
            Fetching gene↔trait, gene↔factor, then trait↔factor links among those sets…
        </div>

        <template v-else-if="geneKg && !error">
            <div v-if="!hasGraph" class="rv2-gene-kg-empty">
                No CFDE KG associations found for this gene.
            </div>
            <template v-else>
                <ScopeKgNetworkGraph
                    v-if="geneKg.graph && geneKg.graph.nodes.length"
                    :graph="geneKg.graph"
                    :node-caps="false"
                    :weight-filters="true"
                />

                <div class="rv2-gene-kg-lists">
                    <section class="rv2-gene-kg-list-panel" aria-labelledby="rv2-kg-traits">
                        <div class="rv2-gene-kg-list-head">
                            <h4 id="rv2-kg-traits" class="rv2-gene-kg-list-title">Traits</h4>
                            <span class="rv2-gene-kg-list-meta">
                                {{ traitCount }} total · gene↔trait weight
                            </span>
                        </div>
                        <div class="rv2-gene-kg-table-wrap" v-if="allTraits.length">
                            <table class="rv2-gene-kg-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Trait</th>
                                        <th scope="col" class="rv2-gene-kg-score-col">Weight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in pagedTraits" :key="row.trait">
                                        <td>{{ row.traitLabel || row.trait }}</td>
                                        <td class="rv2-gene-kg-score-col">
                                            {{ formatWeight(row.weight) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <b-pagination
                                v-if="traitCount > perPage"
                                v-model="traitPage"
                                class="rv2-gene-kg-pagination pagination-sm justify-content-center"
                                :total-rows="traitCount"
                                :per-page="perPage"
                                size="sm"
                                aria-controls="rv2-kg-traits"
                            />
                        </div>
                        <p v-else class="rv2-gene-kg-list-empty">None</p>
                    </section>

                    <section class="rv2-gene-kg-list-panel" aria-labelledby="rv2-kg-factors">
                        <div class="rv2-gene-kg-list-head">
                            <h4 id="rv2-kg-factors" class="rv2-gene-kg-list-title">Factors</h4>
                            <span class="rv2-gene-kg-list-meta">
                                {{ factorCount }} total · gene↔factor weight
                            </span>
                        </div>
                        <div class="rv2-gene-kg-table-wrap" v-if="allFactors.length">
                            <table class="rv2-gene-kg-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Factor</th>
                                        <th scope="col" class="rv2-gene-kg-score-col">Weight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in pagedFactors" :key="row.factor">
                                        <td>{{ row.factorLabel || row.factor }}</td>
                                        <td class="rv2-gene-kg-score-col">
                                            {{ formatWeight(row.weight) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <b-pagination
                                v-if="factorCount > perPage"
                                v-model="factorPage"
                                class="rv2-gene-kg-pagination pagination-sm justify-content-center"
                                :total-rows="factorCount"
                                :per-page="perPage"
                                size="sm"
                                aria-controls="rv2-kg-factors"
                            />
                        </div>
                        <p v-else class="rv2-gene-kg-list-empty">None</p>
                    </section>
                </div>
            </template>
        </template>
    </div>
</template>

<script>
import ScopeKgNetworkGraph from "@/components/researchPortal/customComponents/revealScope/ScopeKgNetworkGraph.vue";

const PER_PAGE = 10;

export default {
    name: "RevealV2GeneKgPanel",
    components: {
        ScopeKgNetworkGraph,
    },
    props: {
        geneKg: {
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
    },
    data() {
        return {
            perPage: PER_PAGE,
            traitPage: 1,
            factorPage: 1,
        };
    },
    computed: {
        geneLabel() {
            if (this.geneKg && this.geneKg.geneLabel) return this.geneKg.geneLabel;
            if (this.geneKg && this.geneKg.gene) return this.geneKg.gene;
            return "Gene";
        },
        hasGraph() {
            const g = this.geneKg && this.geneKg.graph;
            return !!(g && Array.isArray(g.nodes) && g.nodes.length);
        },
        allTraits() {
            return (this.geneKg && this.geneKg.geneToTrait) || [];
        },
        allFactors() {
            return (this.geneKg && this.geneKg.geneToFactor) || [];
        },
        traitCount() {
            return this.allTraits.length;
        },
        factorCount() {
            return this.allFactors.length;
        },
        edgeCount() {
            const g = this.geneKg && this.geneKg.graph;
            return (g && g.edges && g.edges.length) || 0;
        },
        pagedTraits() {
            const start = (this.traitPage - 1) * this.perPage;
            return this.allTraits.slice(start, start + this.perPage);
        },
        pagedFactors() {
            const start = (this.factorPage - 1) * this.perPage;
            return this.allFactors.slice(start, start + this.perPage);
        },
    },
    watch: {
        geneKg() {
            this.traitPage = 1;
            this.factorPage = 1;
        },
    },
    methods: {
        formatWeight(w) {
            if (w == null || w === "") return "—";
            const n = Number(w);
            if (Number.isNaN(n)) return "—";
            if (Math.abs(n) >= 10) return n.toFixed(1);
            if (Math.abs(n) >= 1) return n.toFixed(2);
            return n.toFixed(3);
        },
    },
};
</script>

<style scoped>
.rv2-gene-kg {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.rv2-gene-kg-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px 20px;
}

.rv2-gene-kg-title {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 12px;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.rv2-gene-kg-gene {
    font-weight: 800;
    color: var(--cfde-orange, #e07b39);
    letter-spacing: 0.02em;
}

.rv2-gene-kg-subtitle {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-muted, #6b6b6b);
}

.rv2-gene-kg-status {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.rv2-gene-kg-error {
    margin: 4px 0 0;
    font-size: 13px;
    color: #b42318;
}

.rv2-gene-kg-counts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
}

.rv2-gene-kg-count {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.rv2-gene-kg-count strong {
    color: var(--cfde-blue, #2c5c97);
    font-weight: 700;
}

.rv2-gene-kg-loading,
.rv2-gene-kg-empty {
    padding: 20px 18px;
    background: #fff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 10px;
    font-size: 14px;
    color: var(--cfde-muted, #6b6b6b);
}

.rv2-gene-kg-lists {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 14px;
}

.rv2-gene-kg-list-panel {
    padding: 14px 16px;
    background: #fff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 10px;
}

.rv2-gene-kg-list-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px 12px;
    margin-bottom: 10px;
}

.rv2-gene-kg-list-title {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--cfde-blue, #2c5c97);
}

.rv2-gene-kg-list-meta {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.rv2-gene-kg-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.rv2-gene-kg-table th,
.rv2-gene-kg-table td {
    padding: 7px 0;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
    vertical-align: top;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
}

.rv2-gene-kg-table thead th {
    border-top: none;
    padding-top: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--cfde-muted, #6b6b6b);
}

.rv2-gene-kg-score-col {
    width: 4.5rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    white-space: nowrap;
    color: var(--cfde-blue, #2c5c97);
}

.rv2-gene-kg-table thead .rv2-gene-kg-score-col {
    color: var(--cfde-muted, #6b6b6b);
    font-weight: 700;
}

.rv2-gene-kg-pagination {
    margin: 12px 0 0;
}

.rv2-gene-kg-list-empty {
    margin: 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
