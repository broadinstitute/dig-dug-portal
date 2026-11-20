<template>
    <section class="pg2-card pg2-context" aria-labelledby="pg2-context-title">
        <div class="pg2-section-heading"><h2 id="pg2-context-title">Test a phenotype profile <help-tooltip label="Test a phenotype profile" :text="help.customMethods" /></h2></div>
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
                    <th class="pg2-numeric pg2-context-beta">
                        β <help-tooltip info label="About profile beta and 95% confidence interval" :text="help.customBeta + ' ' + help.customCI" />
                        <small class="pg2-beta-interval">95% CI</small>
                    </th>
                    <th class="pg2-numeric pg2-context-p">P</th>
                    <th class="pg2-numeric pg2-context-q">q <help-tooltip info label="About profile q" :text="help.customQ" /></th>
                    <th class="pg2-numeric pg2-context-lambda">Profile λ <help-tooltip info label="About profile lambda" :text="help.customLambda" /></th>
                    <th class="pg2-numeric pg2-context-sample-count">Gene carriers with<br>≥1 profile HPO <help-tooltip info label="About gene carriers with at least one profile HPO" :text="help.customSampleCount" /></th>
                    <th class="pg2-context-settings">Settings <help-tooltip info label="About GRS settings" :text="help.settings" /></th>
                    <th class="pg2-context-action"><span class="pg2-sr-only">Result actions</span></th>
                </tr></thead>
                <tbody>
                    <tr v-for="run in contextRuns" :key="run.id" :class="{ 'pg2-applied-row': run.id === currentRunId }">
                        <td><strong>{{ profileLabel(run.hpos) }}</strong><span v-if="run.id === currentRunId" class="pg2-applied-tag">Applied</span><small><a :href="phenotypeResultUrl(run)" target="_blank" rel="noopener noreferrer">{{ run.hpos }}</a><help-tooltip v-if="run.noteIsWarning" label="About this analysis result" :text="analysisDetails(run)" info /></small></td>
                        <td class="pg2-numeric">
                            {{ run.beta }}
                            <small class="pg2-beta-interval">{{ run.betaInterval || '—' }}</small>
                        </td>
                        <td class="pg2-numeric">{{ run.pValue }}</td>
                        <td class="pg2-numeric">
                            <span v-if="run.quality && run.quality.qValue != null">{{ run.quality.qValue.toPrecision(3) }}</span>
                            <small v-else-if="run.quality && run.quality.status === 'loading'" role="status">Calculating…</small>
                            <button v-else-if="run.quality && run.quality.status === 'error'" type="button" class="pg2-quality-retry" :title="run.quality.message" @click="$emit('retry-quality', run)">Retry q and λ</button>
                            <span v-else title="A matching gene test is required to report q">—</span>
                        </td>
                        <td class="pg2-numeric" :title="run.quality && run.quality.nTests ? run.quality.nTests.toLocaleString() + ' valid gene tests for this profile' : null">{{ run.quality && run.quality.lambda != null ? run.quality.lambda.toFixed(3) : '—' }}</td>
                        <td class="pg2-numeric">
                            <span v-if="run.profileSampleCount && run.profileSampleCount.status === 'ready'" :title="profileSampleCountTitle(run.profileSampleCount)">{{ profileSampleCountText(run.profileSampleCount) }}</span>
                            <small v-else-if="run.profileSampleCount && run.profileSampleCount.status === 'loading'" role="status">Counting…</small>
                            <button v-else-if="run.profileSampleCount && run.profileSampleCount.status === 'error'" type="button" class="pg2-quality-retry" :title="run.profileSampleCount.message" @click="$emit('retry-sample-count', run)">Retry count</button>
                            <span v-else>—</span>
                        </td>
                        <td><span>GRS: {{ runSettings(run).scoreType }}</span><br><span>Samples: {{ runSettings(run).analysisSet }}</span><help-tooltip info label="Analysis result details" :text="analysisDetails(run)" /></td>
                        <td class="pg2-context-action"><div class="pg2-context-actions">
                            <button type="button" class="pg2-result-action pg2-rerun" :class="{ 'pg2-rerun-loading': contextLoading && rerunningRunId === run.id }" :disabled="contextLoading || !canRerun(run)" :aria-label="'Re-run ' + profileLabel(run.hpos)" :aria-busy="String(contextLoading && rerunningRunId === run.id)" :title="canRerun(run) ? 'Re-run' : 'Saved settings unavailable'" @click="rerunProfile(run)"><b-icon-arrow-clockwise aria-hidden="true" /></button>
                            <button type="button" class="pg2-result-action pg2-remove-run" :disabled="contextLoading" :aria-label="'Delete result for ' + profileLabel(run.hpos)" title="Delete row" @click="$emit('remove', run)"><b-icon-x aria-hidden="true" /></button>
                        </div></td>
                    </tr>
                    <tr v-if="!contextRuns.length"><td colspan="8" class="pg2-empty">Add a phenotype profile and select Apply.</td></tr>
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
        applyProfile() { if (this.$refs.profile.finish() === false) return; this.$emit('run'); },
        rerunProfile(run) { if (this.contextLoading || !this.canRerun(run)) return; this.$refs.profile.resetDraft(); this.$emit('rerun', run); },
        canRerun(run) {
            const meta = this.runMeta[run.id];
            return Boolean(meta && ['max','sum'].includes(meta.scoreType) && ['all','affected'].includes(meta.analysisSet) && Number.isFinite(meta.significanceThreshold) && Number.isInteger(meta.minCarriers));
        },
        runSettings(run) {
            const meta = this.runMeta[run.id];
            return { scoreType: meta ? meta.scoreType === 'sum' ? 'Sum' : 'Max' : 'Unavailable', analysisSet: meta ? meta.analysisSet === 'affected' ? 'Affected only' : 'All' : 'Unavailable' };
        },
        analysisDetails(run) {
            const sampleCount = Number.isSafeInteger(run.nAnalysisSamples) ? `${run.nAnalysisSamples.toLocaleString()} samples in the model` : null;
            return [run.statusLabel, sampleCount, run.modelLabel, run.referenceLabel, run.note, run.sourceLabel].filter(Boolean).join('. ');
        },
        profileSampleCountText({ count, carrierTotal, metadataCount }) {
            if (count == null) return '—';
            const lowerBound = metadataCount < carrierTotal ? '≥' : '';
            return `${lowerBound}${count.toLocaleString()} / ${carrierTotal.toLocaleString()}`;
        },
        profileSampleCountTitle({ carrierTotal, metadataCount }) {
            return `HPO metadata available for ${metadataCount.toLocaleString()} of ${carrierTotal.toLocaleString()} observed gene carriers.`;
        },
        phenotypeResultUrl(run) {
            const terms = [...new Set(String(run.hpos || '').toUpperCase().match(/HP:\d{7}/g) || [])];
            return terms.length ? '/phenotyperesult.html?query=' + encodeURIComponent(terms.join(',')) : '';
        },
        profileLabel(value) { return String(value || '').split(/[,;\s]+/).filter(Boolean).map(hpoLabel).join(' + '); },
        settings(run) {
            const meta = this.runMeta[run.id];
            return meta ? `${meta.scoreType === 'sum' ? 'Sum' : 'Max'} · ${meta.analysisSet === 'affected' ? 'Affected only' : 'All'}` : 'See analysis details';
        },
    },
};
</script>
