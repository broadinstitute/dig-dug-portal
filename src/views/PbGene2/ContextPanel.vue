<template>
    <section class="pg2-card pg2-context" aria-labelledby="pg2-context-title">
        <div class="pg2-section-heading"><h2 id="pg2-context-title">Custom HPO context</h2><span class="pg2-status" :class="{ 'pg2-status-active': currentRunId }">{{ contextLoading ? 'Calculating…' : currentRunId ? 'Context active' : 'No calculation yet' }}</span></div>
        <p class="pg2-muted">Enter an HPO profile to calculate context-based results.</p>
        <form class="pg2-context-form" @submit.prevent="$emit('run')">
            <hpo-term-input v-model="contextInputModel" />
            <label>GRS<select v-model="scoreTypeModel" aria-label="Gene score aggregation"><option value="max">Max</option><option value="sum">Sum</option></select></label>
            <label>Samples<select v-model="analysisSetModel" aria-label="Analysis samples"><option value="all">All</option><option value="affected">Affected only</option></select></label>
            <button class="pg2-primary" type="submit" :disabled="contextLoading">{{ contextLoading ? 'Calculating…' : 'Go' }}</button>
            <details class="pg2-advanced"><summary>Advanced</summary><div>
                <label>Threshold<input v-model.number="thresholdModel" type="number" min="0.000001" max="1" step="any"></label>
                <label>Minimum carriers<input v-model.number="minCarriersModel" type="number" min="10" step="1"></label>
                <button type="submit" :disabled="contextLoading">Apply &amp; run</button>
            </div></details>
        </form>
        <div class="pg2-context-applied">
            <span v-if="currentRunId">Applied to variants below: <strong>{{ appliedLabel }}</strong><span v-if="appliedSettings"> · {{ appliedSettings }}</span></span>
            <span v-else class="pg2-muted">Variant context values appear after a successful calculation.</span>
            <a v-if="externalPhenotypeResultUrl" :href="externalPhenotypeResultUrl" target="_blank" rel="noopener noreferrer">Open phenotype result <b-icon-box-arrow-up-right /></a>
        </div>
        <p v-if="contextError" class="pg2-error" role="alert">{{ contextError }}</p>
        <div class="pg2-table-scroll">
            <table class="pg2-table pg2-context-history">
                <thead><tr><th>HPO profile (entered terms)</th><th class="pg2-numeric">Effect per 0.1 GRS (SD)</th><th class="pg2-numeric">p-value</th><th>Settings</th><th>Status / score coverage</th></tr></thead>
                <tbody>
                    <tr v-for="run in contextRuns" :key="run.id" :class="{ 'pg2-applied-row': run.id === currentRunId }">
                        <td><strong>{{ profileLabel(run.hpos) }}</strong><span v-if="run.id === currentRunId" class="pg2-applied-tag">Applied</span><small>{{ run.hpos }}</small></td>
                        <td class="pg2-numeric">{{ run.beta }}</td><td class="pg2-numeric">{{ run.pValue }}</td>
                        <td>{{ settings(run) }}</td>
                        <td><span :class="{ 'pg2-error': run.noteIsWarning }">{{ run.statusLabel }}</span><small>{{ run.coverageLabel }}</small>
                            <details class="pg2-method"><summary>Analysis details</summary><div><p>{{ run.modelLabel }}</p><p>{{ run.referenceLabel }}</p><p>{{ run.note }}</p><p>Source: {{ run.sourceLabel }}</p></div></details>
                        </td>
                    </tr>
                    <tr v-if="!contextRuns.length"><td colspan="5" class="pg2-empty">Enter an HPO profile and select Go to add a result.</td></tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
<script>
import HpoContextPanel from "../PbGene/HpoContextPanel";
import { hpoLabel } from "../PbGene/hpoContextSearch";
export default {
    name: "Gene2ContextPanel",
    extends: HpoContextPanel,
    props: {
        runMeta: { type: Object, default: () => ({}) },
        currentRunId: { type: [String, Number], default: "" },
    },
    computed: {
        appliedRun() { return this.contextRuns.find(run => run.id === this.currentRunId); },
        appliedLabel() { return this.appliedRun ? this.profileLabel(this.appliedRun.hpos) : ''; },
        appliedSettings() { return this.appliedRun ? this.settings(this.appliedRun) : ''; },
    },
    methods: {
        profileLabel(value) { return String(value || '').split(/[,;\s]+/).filter(Boolean).map(hpoLabel).join(' + '); },
        settings(run) {
            const meta = this.runMeta[run.id];
            return meta ? `${meta.scoreType === 'sum' ? 'Sum' : 'Max'} · ${meta.analysisSet === 'affected' ? 'Affected only' : 'All'}` : 'See analysis details';
        },
    },
};
</script>
