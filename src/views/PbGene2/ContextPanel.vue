<template>
    <section class="pg2-card pg2-context" aria-labelledby="pg2-context-title">
        <div class="pg2-section-heading"><h2 id="pg2-context-title">Test a phenotype profile <help-tooltip label="Test a phenotype profile" :text="help.settings + ' ' + help.customBeta + ' ' + help.meanZ" /></h2></div>
        <form class="pg2-context-form" @submit.prevent="applyProfile">
            <label id="pg2-profile-input-label" class="pg2-profile-input-label">Phenotype profile</label>
            <hpo-term-input :key="currentRunId" ref="profile" v-model="contextInputModel" />
            <button class="pg2-primary" type="submit" :disabled="contextLoading">{{ contextLoading ? 'Calculating…' : 'Apply' }}</button>
            <details class="pg2-advanced"><summary><b-icon-gear aria-hidden="true" /> Advanced options <b-icon-chevron-down aria-hidden="true" /></summary><div>
                <label>GRS<select v-model="scoreTypeModel" aria-label="Gene score aggregation"><option value="max">Max</option><option value="sum">Sum</option></select></label>
                <label>Samples<select v-model="analysisSetModel" aria-label="Analysis samples"><option value="all">All</option><option value="affected">Affected only</option></select></label>
                <label>Threshold<input v-model.number="thresholdModel" type="number" min="0.000001" max="1" step="any"></label>
                <label>Minimum carriers<input v-model.number="minCarriersModel" type="number" min="10" step="1"></label>
                <button type="submit" :disabled="contextLoading">Apply</button>
            </div></details>
        </form>
        <p v-if="contextError" class="pg2-error" role="alert">{{ contextError }}</p>
        <div class="pg2-table-scroll">
            <table class="pg2-table pg2-context-history">
                <thead><tr>
                    <th>Phenotype profile</th>
                    <th class="pg2-numeric">Gene β <help-tooltip info label="About Custom Gene beta" :text="help.customBeta" /></th>
                    <th class="pg2-numeric">P</th>
                    <th class="pg2-numeric">Samples with<br>positive GRS <help-tooltip info label="About samples with positive GRS" :text="help.positiveGRS" /></th>
                    <th>Settings <help-tooltip info label="About GRS settings" :text="help.settings" /></th>
                    <th class="pg2-context-action"><span class="pg2-sr-only">Result actions</span></th>
                </tr></thead>
                <tbody>
                    <tr v-for="run in contextRuns" :key="run.id" :class="{ 'pg2-applied-row': run.id === currentRunId }">
                        <td><strong>{{ profileLabel(run.hpos) }}</strong><span v-if="run.id === currentRunId" class="pg2-applied-tag">Applied</span><small><a :href="phenotypeResultUrl(run)" target="_blank" rel="noopener noreferrer">{{ run.hpos }}</a><help-tooltip v-if="run.noteIsWarning" label="About this analysis result" :text="analysisDetails(run)" info /></small></td>
                        <td class="pg2-numeric">{{ run.beta }}</td><td class="pg2-numeric">{{ run.pValue }}</td>
                        <td class="pg2-numeric">{{ positiveCount(run) }}</td>
                        <td><span>GRS: {{ runSettings(run).scoreType }}</span><br><span>Samples: {{ runSettings(run).analysisSet }}</span><help-tooltip info label="Analysis result details" :text="analysisDetails(run)" /></td>
                        <td class="pg2-context-action"><div class="pg2-context-actions">
                            <button type="button" class="pg2-result-action pg2-rerun" :class="{ 'pg2-rerun-loading': contextLoading && rerunningRunId === run.id }" :disabled="contextLoading || !canRerun(run)" :aria-label="'Re-run ' + profileLabel(run.hpos)" :aria-busy="String(contextLoading && rerunningRunId === run.id)" :title="canRerun(run) ? 'Re-run' : 'Saved settings unavailable'" @click="rerunProfile(run)"><b-icon-arrow-clockwise aria-hidden="true" /></button>
                            <button type="button" class="pg2-result-action pg2-remove-run" :disabled="contextLoading" :aria-label="'Delete result for ' + profileLabel(run.hpos)" title="Delete row" @click="$emit('remove', run)"><b-icon-x aria-hidden="true" /></button>
                        </div></td>
                    </tr>
                    <tr v-if="!contextRuns.length"><td colspan="6" class="pg2-empty">Add a phenotype profile and select Apply.</td></tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
<script>
import HpoContextPanel from "../PbGene/HpoContextPanel";
import { hpoLabel } from "../PbGene/hpoContextSearch";
import HelpTooltip from './HelpTooltip';
import help from './evidenceHelp';
import ProfileInput from './ProfileInput';
export default {
    name: "Gene2ContextPanel",
    extends: HpoContextPanel,
    components: { HelpTooltip, HpoTermInput: ProfileInput },
    data: () => ({ help }),
    props: {
        runMeta: { type: Object, default: () => ({}) },
        currentRunId: { type: [String, Number], default: "" },
        rerunningRunId: { type: [String, Number], default: "" },
    },
    computed: {
        appliedRun() { return this.contextRuns.find(run => run.id === this.currentRunId); },
        appliedLabel() { return this.appliedRun ? this.profileLabel(this.appliedRun.hpos) : ''; },
        appliedSettings() { return this.appliedRun ? this.settings(this.appliedRun) : ''; },
    },
    methods: {
        applyProfile() { this.$refs.profile.finish(); this.$emit('run'); },
        rerunProfile(run) { if (this.contextLoading || !this.canRerun(run)) return; this.$refs.profile.resetDraft(); this.$emit('rerun', run); },
        canRerun(run) {
            const meta = this.runMeta[run.id];
            return Boolean(meta && ['max','sum'].includes(meta.scoreType) && ['all','affected'].includes(meta.analysisSet) && Number.isFinite(meta.significanceThreshold) && Number.isInteger(meta.minCarriers));
        },
        runSettings(run) {
            const meta = this.runMeta[run.id];
            return { scoreType: meta ? meta.scoreType === 'sum' ? 'Sum' : 'Max' : 'Unavailable', analysisSet: meta ? meta.analysisSet === 'affected' ? 'Affected only' : 'All' : 'Unavailable' };
        },
        positiveCount(run) { return run.nPositiveBurden == null || !Number.isFinite(Number(run.nPositiveBurden)) ? 'Unavailable' : Number(run.nPositiveBurden).toLocaleString(); },
        analysisDetails(run) { return [run.statusLabel, run.coverageLabel, run.modelLabel, run.referenceLabel, run.note, run.sourceLabel].filter(Boolean).join('. '); },
        phenotypeResultUrl(run) {
            const terms = [...new Set(String(run.hpos || '').toUpperCase().match(/HP:\d{7}/g) || [])];
            return terms.length ? '/pb_phenotype.html?query=' + encodeURIComponent(terms.join(',')) : '';
        },
        profileLabel(value) { return String(value || '').split(/[,;\s]+/).filter(Boolean).map(hpoLabel).join(' + '); },
        settings(run) {
            const meta = this.runMeta[run.id];
            return meta ? `${meta.scoreType === 'sum' ? 'Sum' : 'Max'} · ${meta.analysisSet === 'affected' ? 'Affected only' : 'All'}` : 'See analysis details';
        },
    },
};
</script>
