<template>
    <section class="wkb-trait-association-scores">
        <h4 class="wkb-trait-association-scores-title">Association scores</h4>
        <p class="wkb-trait-association-scores-lead">
            For connected genes and mechanisms on the graph.
        </p>
        <p v-if="loading" class="wkb-inspector-note">
            <span class="wkb-inspector-spinner" aria-hidden="true" />
            Loading association scores…
        </p>
        <p v-else-if="error" class="wkb-inspector-note wkb-inspector-note--warn">
            {{ error }}
        </p>
        <template v-else-if="summary">
            <p class="wkb-inspector-note wkb-trait-association-scores-summary">
                <strong>Genes scored:</strong> {{ summary.geneRows.length }}.
                <strong>Mechanisms scored:</strong> {{ summary.factorRows.length }}.
            </p>
            <WorkspaceEvidenceTable
                title="Trait × gene scores"
                :rows="summary.geneRows"
                :columns="geneTraitColumns"
                pagination-label="Trait gene score pages"
            />
            <WorkspaceEvidenceTable
                title="Trait × mechanism relevance"
                :rows="summary.factorRows"
                :columns="factorTraitColumns"
                pagination-label="Trait mechanism score pages"
            />
        </template>
        <p v-else class="wkb-inspector-note">
            No association scores were returned for connected genes or mechanisms on
            this graph.
        </p>
    </section>
</template>

<script>
import {
    GENE_TRAIT_PROBABILITY_COLUMNS,
    buildTraitSigChainSummaryRows,
} from "./revealKgSigChainUtils.js";
import WorkspaceEvidenceTable from "./WorkspaceEvidenceTable.vue";

export default {
    name: "WorkspaceTraitSigChainEvidence",
    components: {
        WorkspaceEvidenceTable,
    },
    props: {
        node: {
            type: Object,
            required: true,
        },
        packet: {
            type: Object,
            default: null,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        error: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            geneTraitColumns: GENE_TRAIT_PROBABILITY_COLUMNS,
            factorTraitColumns: [
                { key: "factor", label: "Mechanism" },
                { key: "relevance_score", label: "Score", digits: 3 },
                { key: "family", label: "Family" },
            ],
        };
    },
    computed: {
        summary() {
            if (!this.packet?.matrices) {
                return null;
            }
            const rows = buildTraitSigChainSummaryRows(this.node, this.packet);
            if (!rows.geneRows.length && !rows.factorRows.length) {
                return null;
            }
            return rows;
        },
    },
};
</script>

<style scoped>
.wkb-trait-association-scores {
    margin-top: 12px;
}

.wkb-trait-association-scores-title {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-trait-association-scores-lead {
    margin: 0 0 8px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-trait-association-scores-summary {
    margin-bottom: 4px;
}

.wkb-inspector-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-right: 6px;
    border: 2px solid #e6e1d6;
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    vertical-align: -2px;
    animation: wkb-inspector-spin 0.7s linear infinite;
}

@keyframes wkb-inspector-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-inspector-note {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-note--warn {
    color: #9a3412;
}
</style>
