<template>
    <div class="wkb-lead-snp-support">
        <h5 class="wkb-lead-snp-title">Lead SNPs</h5>
        <template v-if="snps.length">
            <div class="wkb-lead-snp-list">
                <div
                    v-for="(snp, index) in snps"
                    :key="`${snp.location_hg19}-${index}`"
                    class="wkb-lead-snp-row"
                >
                    <p>
                        <strong>Location (hg19):</strong>
                        <span class="wkb-lead-snp-location">{{ snp.location_hg19 || "NA" }}</span>
                    </p>
                    <p>
                        <strong>P-value:</strong> {{ formatPValue(snp.p_value) }}
                    </p>
                    <p>
                        <strong>Effector probability:</strong>
                        {{ formatProbability(snp.effector_probability) }}
                    </p>
                </div>
            </div>
            <small v-if="total > snps.length">
                Showing {{ snps.length }} of {{ total }} SNPs.
            </small>
        </template>
        <p v-else><strong>Location (hg19):</strong> NA</p>
    </div>
</template>

<script>
import {
    formatEdgeProvenancePValue,
    formatEdgeProvenanceProbability,
} from "./revealKgEdgeProvenanceUtils.js";

export default {
    name: "WorkspaceLeadSnpSummary",
    props: {
        directSupport: {
            type: Object,
            default: null,
        },
    },
    computed: {
        snps() {
            return this.directSupport?.lead_snps || [];
        },
        total() {
            return Number(this.directSupport?.lead_snp_count) || 0;
        },
    },
    methods: {
        formatPValue: formatEdgeProvenancePValue,
        formatProbability: formatEdgeProvenanceProbability,
    },
};
</script>

<style scoped>
.wkb-lead-snp-support {
    margin-top: 10px;
}

.wkb-lead-snp-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-lead-snp-row {
    margin-bottom: 8px;
}

.wkb-lead-snp-row p,
.wkb-lead-snp-support > p {
    margin: 0 0 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
}

.wkb-lead-snp-location {
    font-family: Menlo, Monaco, monospace;
}

.wkb-lead-snp-support small {
    font-size: 11px;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
