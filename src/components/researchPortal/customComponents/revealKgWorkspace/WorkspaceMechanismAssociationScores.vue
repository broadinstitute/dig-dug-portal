<template>
    <section class="wkb-mechanism-association-scores">
        <h4 class="wkb-mechanism-association-scores-title">Association scores</h4>
        <p class="wkb-mechanism-association-scores-lead">
            For connected genes and traits on the graph.
        </p>
        <p v-if="loading" class="wkb-inspector-note">
            <span class="wkb-inspector-spinner" aria-hidden="true" />
            Loading association scores…
        </p>
        <p v-else-if="error" class="wkb-inspector-note wkb-inspector-note--warn">
            {{ error }}
        </p>
        <template v-else-if="summary">
            <p class="wkb-inspector-note wkb-mechanism-association-scores-summary">
                <strong>Genes scored:</strong> {{ summary.geneRows.length }}.
                <strong>Traits scored:</strong> {{ summary.traitRows.length }}.
                <strong>Gene sets:</strong> {{ summary.geneSetRows.length }}.
            </p>
            <WorkspaceEvidenceTable
                title="Mechanism × gene loadings"
                :rows="summary.geneRows"
                :columns="geneColumns"
                pagination-label="Mechanism gene loading pages"
            />
            <WorkspaceEvidenceTable
                title="Mechanism × trait relevance"
                :rows="summary.traitRows"
                :columns="traitColumns"
                pagination-label="Mechanism trait score pages"
            />
            <WorkspaceEvidenceTable
                v-if="summary.geneSetRows.length"
                title="Top mechanism gene sets"
                :rows="summary.geneSetRows"
                :columns="geneSetColumns"
                :page-size="10"
                pagination-label="Mechanism gene set pages"
            />
        </template>
        <p v-else class="wkb-inspector-note">
            No association scores were returned for connected genes or traits on
            this graph.
        </p>
    </section>
</template>

<script>
import { buildFactorSigChainSummaryRows } from "./revealKgSigChainUtils.js";
import WorkspaceEvidenceTable from "./WorkspaceEvidenceTable.vue";

export default {
    name: "WorkspaceMechanismAssociationScores",
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
            geneColumns: [
                { key: "gene", label: "Gene", wrap: true },
                { key: "loading", label: "Loading", digits: 3 },
                { key: "relative_loading", label: "Relative", digits: 3 },
                { key: "combined_loading", label: "Combined", digits: 3 },
            ],
            traitColumns: [
                { key: "trait", label: "Trait", wrap: true },
                { key: "relevance_score", label: "Score", digits: 3 },
                { key: "family", label: "Family", wrap: true },
            ],
            geneSetColumns: [
                { key: "gene_set", label: "Gene set", wrap: true },
                { key: "loading", label: "Loading", digits: 3 },
                { key: "beta_uncorrected", label: "Beta uncorr.", digits: 3 },
            ],
        };
    },
    computed: {
        summary() {
            if (!this.packet?.matrices && !this.packet?.factor_details) {
                return null;
            }
            const rows = buildFactorSigChainSummaryRows(this.node, this.packet);
            if (
                !rows.geneRows.length &&
                !rows.traitRows.length &&
                !rows.geneSetRows.length
            ) {
                return null;
            }
            return rows;
        },
    },
};
</script>

<style scoped>
.wkb-mechanism-association-scores {
    margin-top: 12px;
}

.wkb-mechanism-association-scores-title {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-mechanism-association-scores-lead {
    margin: 0 0 8px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-mechanism-association-scores-summary {
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
