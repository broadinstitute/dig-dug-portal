<template>
    <section class="pbs-card pbs-prioritized" role="tabpanel" id="sample-findings-panel" aria-labelledby="sample-findings-tab">
        <div class="pbs-priority-head">
            <div class="pbs-priority-title"><h2>Prioritized findings</h2><button type="button" :aria-pressed="!type" @click="type = ''; search = ''">All findings <strong>{{ connected ? records.length : '—' }}</strong></button></div>
            <div class="pbs-priority-tiers">
                <div v-for="group in groups" :key="group.title">
                    <p>{{ group.title }}</p>
                    <div class="pbs-priority-types"><button v-for="item in group.types" :key="item.number" type="button" :aria-pressed="type === item.number" @click="type = item.number; search = ''">
                        <span><strong>Type {{ item.number }}</strong><small>{{ item.label }}</small></span>
                        <strong>{{ connected ? records.filter(row => row.type === 'Type ' + item.number).length : '—' }}</strong>
                    </button></div>
                </div>
            </div>
            <p class="pbs-priority-note">Counts are evidence records; a variant may appear in more than one record.</p>
            <p class="pbs-priority-note"><strong>Tier 3:</strong> known gene + lower-impact variant; excluded from Type 1–6 prioritized findings.</p>
        </div>
        <div class="pbs-priority-body">
            <aside class="pbs-priority-list">
                <h3>{{ type ? 'Type ' + type + ' findings' : 'All findings' }} <small>{{ connected ? filtered.length : '—' }}</small></h3>
                <input v-model="search" type="search" placeholder="Filter gene or condition" aria-label="Filter prioritized findings by gene or condition" />
                <button v-for="row in filtered" :key="row.key" class="pbs-priority-result" type="button" :aria-pressed="selected && selected.key === row.key" @click="selectedKey = row.key">
                    <strong>{{ row.gene }}</strong><span>{{ row.disease ? row.disease.id : 'Disease unavailable' }}</span><small>{{ row.id }} · GT {{ row.genotype || 'Unavailable' }}</small><b-icon-chevron-right />
                </button>
                <p v-if="!filtered.length" class="pbs-priority-note">{{ connected ? 'No findings match this selection.' : 'Prioritized results are not connected for this sample.' }}</p>
                <p class="pbs-priority-list-foot">Select a finding to inspect its classification and patient context.</p>
            </aside>
            <article v-if="selected" class="pbs-priority-detail">
                <header class="pbs-priority-detail-head">
                    <div><h3>{{ selected.gene }} · {{ selected.id }}</h3><strong>{{ selected.disease ? selected.disease.id : 'Disease unavailable' }}</strong><p>{{ selected.consequence }} · GT {{ selected.genotype || 'Unavailable' }}</p></div>
                    <div><span class="pbs-type-badge">{{ selected.type }}</span> <span class="pbs-tier-badge">{{ selected.tier }}</span> <a :href="variantHref(selected)">Open variant <b-icon-box-arrow-up-right /></a></div>
                </header>
                <section class="pbs-priority-reason">
                    <b-icon-info-circle-fill /><div><h4>Why this is {{ selected.type }}</h4><p>{{ selected.typeLabel }}</p>
                        <div class="pbs-priority-comparison"><div><small>Sample cohort disease</small><strong>{{ selected.cohortDisease || 'Unavailable' }}</strong></div><div><strong>{{ scope }}</strong><small>{{ scope === 'MATCH' ? 'Same disease category' : scope === 'OUTSIDE' ? 'Different disease category' : 'Classification context' }}</small></div><div><small>Evidence-associated disease</small><strong>{{ selected.disease ? selected.disease.id : 'Unavailable' }}</strong></div></div>
                        <p>Type compares cohort disease category with variant- or gene-associated disease evidence. Patient HPO overlap is descriptive.</p>
                    </div>
                </section>
                <h4 class="pbs-priority-section-title">Phenotype relevance for this patient</h4>
                <div class="pbs-priority-relevance">
                    <div><h5>Recorded HPO overlap</h5><strong class="pbs-priority-stat">{{ disease.matchedHpoCount == null ? 'Unavailable' : disease.matchedHpoCount + ' / ' + disease.diseaseHpoCount }}</strong><small v-if="disease.phenotypeCoverage != null">{{ disease.phenotypeCoverage }}% of disease terms recorded</small></div>
                    <div><h5>Disease-specific residual PheRS</h5><strong class="pbs-priority-stat">{{ disease.samplePercentile == null ? 'Unavailable' : disease.samplePercentile + (disease.samplePercentileSuffix || 'th') + ' percentile' }}</strong>
                        <template v-if="disease.samplePercentile != null"><div class="pbs-phers-track" :style="{ '--sample-pct': disease.samplePercentile + '%', '--investigator-pct': disease.investigatorMeanPercentile + '%' }" aria-hidden="true"><span class="pbs-phers-investigator-marker"></span><span class="pbs-phers-sample-marker"></span></div><div class="pbs-priority-scale"><span>0</span><span>50</span><span>100</span></div><small>Patient {{ disease.samplePercentile }} · Investigator mean {{ disease.investigatorMeanPercentile == null ? 'Unavailable' : disease.investigatorMeanPercentile }}</small><small>{{ fixtureMode ? 'Illustrative disease-specific percentiles in the design fixture.' : disease.matchTooltip }}</small></template>
                    </div>
                </div>
                <h4 class="pbs-priority-section-title">Variant and disease evidence</h4>
                <div class="pbs-priority-evidence">
                    <div><h5>Evidence source</h5><p>{{ selected.evidenceSource || 'Unavailable' }}</p><small v-if="selected.clinvarReview">{{ selected.clinvarReview.stars }}-star review · {{ selected.clinvarReview.label }}</small><a :href="geneHref(selected.gene)">View gene <b-icon-box-arrow-up-right /></a></div>
                    <div><h5>Evidence-associated disease</h5><a v-if="disease.id" :href="diseaseHref(disease.id)" target="_blank" rel="noopener noreferrer">{{ disease.id }}</a><p v-else>Unavailable</p></div>
                    <div><h5>Disease inheritance (MOI)</h5><p>{{ disease.inheritance || 'Unavailable' }}</p></div>
                    <div><h5>Sample inheritance assessment</h5><p>GT {{ selected.genotype || 'Unavailable' }}</p><small>{{ selected.inheritanceAssessment || 'Unavailable' }}</small></div>
                </div>
                <h4 class="pbs-priority-section-title">Related samples to review</h4>
                <p class="pbs-priority-note">Related-sample results for this finding are not connected.</p>
            </article>
            <article v-else class="pbs-priority-detail pbs-priority-empty"><b-icon-info-circle /><h3>{{ connected ? 'Select a finding' : 'Prioritized findings unavailable' }}</h3><p>{{ connected ? 'Choose another Type or adjust the gene or condition filter.' : 'This sample’s precomputed Type, disease evidence and disease-specific scores have not been supplied.' }}</p></article>
        </div>
    </section>
</template>
<script>
const groups = [
    { title: 'Tier 1 · ClinVar 3–4 star P/LP', types: [{ number: 1, label: 'Cohort disease: MATCH' }, { number: 2, label: 'Cohort disease: OUTSIDE' }] },
    { title: 'Tier 2 · Known gene + high impact', types: [{ number: 3, label: 'Cohort disease: MATCH' }, { number: 4, label: 'Cohort disease: OUTSIDE' }] },
    { title: 'No tier · Unknown gene + high impact', types: [{ number: 5, label: 'Top signal in own investigator group' }, { number: 6, label: 'Top signal in another investigator group' }] },
];
export default {
    props: { variants: { type: Array, default: () => [] }, connected: Boolean, fixtureMode: Boolean },
    data: () => ({ groups, type: '', search: '', selectedKey: '' }),
    computed: {
        records() { return this.variants.flatMap((variant, index) => (variant.diseases && variant.diseases.length ? variant.diseases : [null]).map((disease, d) => ({ ...variant, disease, key: `${index}:${d}` }))); },
        filtered() { const query = this.search.trim().toLowerCase(); return this.records.filter(row => (!this.type || row.type === 'Type ' + this.type) && `${row.gene} ${(row.disease || {}).id || ''} ${(row.disease || {}).label || ''}`.toLowerCase().includes(query)); },
        selected() { return this.filtered.find(row => row.key === this.selectedKey) || this.filtered[0] || null; },
        disease() { return (this.selected || {}).disease || {}; },
        scope() { const number = Number((this.selected || {}).type?.replace('Type ', '')); return [1, 3].includes(number) ? 'MATCH' : [2, 4].includes(number) ? 'OUTSIDE' : 'Unavailable'; },
    },
    methods: {
        variantHref(row) { return `/pb_variant.html?query=${encodeURIComponent(row.id)}&gene=${encodeURIComponent(row.gene)}`; },
        geneHref(gene) { return `/pb_gene2.html?query=${encodeURIComponent(gene)}`; },
        diseaseHref(id) { return id.startsWith('OMIM:') ? `https://omim.org/entry/${id.slice(5)}` : `https://www.orpha.net/en/disease/detail/${id.replace('ORPHA:', '')}`; },
    },
};
</script>
