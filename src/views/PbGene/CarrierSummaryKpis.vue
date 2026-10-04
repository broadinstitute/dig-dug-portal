<template>
    <div class="pbg-summary-overview">
        <div class="pbg-summary-progress" role="status">
            <span class="pbg-summary-progress-track"><span :style="{ width: progressPercent + '%' }"></span></span>
            <span>{{ progressLabel }}</span>
        </div>
        <div class="pbg-summary-kpis">
            <div class="pbg-summary-kpi">
                <span>Carriers</span><strong>{{ format(carrierCount) }}</strong>
                <small>{{ variantId && geneCarrierCount ? `${carrierShare}% of ${geneSymbol} carriers` : 'distinct people with an observed variant' }}</small>
            </div>
            <div class="pbg-summary-kpi">
                <span>Affected</span><strong>{{ affectedPercent }}</strong>
                <small>{{ affectedCount == null ? 'Metadata pending' : `${format(affectedCount)} of ${format(checkedCount)} metadata records` }}</small>
            </div>
            <div class="pbg-summary-kpi">
                <span>{{ variantId ? 'Top phenotype · gene-level' : 'Top phenotype' }}</span>
                <strong class="pbg-summary-kpi-phenotype" :title="association ? association.label : ''">{{ association ? association.label : 'Unavailable' }}</strong>
                <small>{{ association ? `OR ${formatStatistic(association.oddsRatio)} · q ${formatStatistic(association.qValue)}` : 'No precomputed association' }}</small>
            </div>
            <div class="pbg-summary-kpi">
                <span>Top co-carrier gene</span><strong>{{ topGene ? topGene.gene : 'Unavailable' }}</strong>
                <small>{{ topGene ? `${format(topGene.count)} shared carriers` : 'Metadata pending' }}</small>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "CarrierSummaryKpis",
    props: {
        summary: { type: Object, default: null },
        carrierCount: { type: Number, default: 0 },
        geneCarrierCount: { type: Number, default: 0 },
        geneSymbol: { type: String, required: true },
        variantId: { type: String, default: "" },
        association: { type: Object, default: null },
        coCarrierGenes: { type: Array, default: () => [] },
    },
    computed: {
        carrierShare() {
            const percent = this.geneCarrierCount ? this.carrierCount / this.geneCarrierCount * 100 : 0;
            return percent > 0 && percent < 1 ? "<1" : String(Math.round(percent));
        },
        checkedCount() { return Number((this.summary || {}).matchedMetadataCount || 0); },
        affectedCount() {
            if (!this.checkedCount) return null;
            const rows = (((this.summary || {}).geneCarrierDemographics || {}).byAffected || []);
            const row = rows.find(item => String(item.label).toLowerCase() === "yes");
            return row ? Number(row.count) : 0;
        },
        affectedPercent() {
            return this.affectedCount == null ? "—" : `${Math.round(this.affectedCount / this.checkedCount * 100)}%`;
        },
        topGene() {
            return [...this.coCarrierGenes].sort((a, b) => Number(b.count) - Number(a.count) || String(a.gene).localeCompare(String(b.gene)))[0] || null;
        },
        progressPercent() {
            const completed = Number((this.summary || {}).completed || 0);
            const total = Number((this.summary || {}).total || this.carrierCount || 0);
            return total ? Math.max(0, Math.min(100, Math.round(completed / total * 100))) : 0;
        },
        progressLabel() {
            if (!this.summary) return "Loading carrier metadata…";
            const total = Number(this.summary.total || this.carrierCount || 0);
            const completed = Number(this.summary.completed || 0);
            return `${this.summary.status === "ready" ? "Complete" : "Partial results"} · ${this.format(completed)} / ${this.format(total)} carriers checked`;
        },
    },
    methods: {
        format(value) { return Number(value || 0).toLocaleString(); },
        formatStatistic(value) {
            const number = Number(value);
            if (value == null || !Number.isFinite(number)) return "—";
            return number !== 0 && Math.abs(number) < 0.001 ? number.toExponential(2) : number.toFixed(3);
        },
    },
};
</script>
