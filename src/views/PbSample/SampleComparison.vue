<template>
    <section :id="'pbs-comparison-' + candidateId" class="pbs-comparison" :aria-label="'Comparison with ' + candidateId">
        <div class="pbs-comparison-samples">
            <div class="pbs-searched-sample"><span>Searched sample</span><strong><span class="pbs-sample-mark pbs-searched-id">{{ referenceId }}</span></strong><p class="pbs-pair-score">rPheRS Z-score <strong>{{ profileScore('reference') }}</strong></p></div>
            <div class="pbs-compared-sample"><span>Comparison sample</span><strong><span class="pbs-sample-mark pbs-compared-id">{{ candidateId }}</span></strong><p class="pbs-pair-score">rPheRS Z-score <strong>{{ profileScore('candidate') }}</strong></p></div>
        </div>
        <p v-if="loading" role="status">Loading comparison…</p>
        <p v-else-if="error" role="alert">{{ error }} <button type="button" @click="loadPage(1)">Retry comparison</button></p>
        <template v-else-if="detail">
            <h5>Matched HPO terms · {{ matchedTerms.length }} <SampleInfo label="Matched term details" :text="help.matchDetails" /></h5>
            <table class="pbs-comparison-table pbs-hpo-comparison">
                <thead><tr><th>Searched sample HPO</th><th>Match in comparison sample</th></tr></thead>
                <tbody><tr v-for="term in visibleHpos" :key="term.id">
                    <td>{{ hpoName(term.id) }} <a :href="phenotypeHref(term.id)">{{ term.id }}</a></td>
                    <td>{{ term.matched == null ? 'Unavailable' : !term.matched ? 'Not matched' : term.matchType === 'recorded' ? 'Recorded term' : 'Parent-expanded term' }}</td>
                </tr><tr v-if="!matchedTerms.length"><td colspan="2">{{ matchingAvailable ? 'No matched HPO terms.' : 'Phenotype matching information is unavailable.' }}</td></tr></tbody>
            </table>
            <SummaryPager :page="hpoPage" :total-pages="hpoPageCount" label="Matched HPO pages" @change="hpoPage = $event" />
            <h5 class="pbs-evidence-divider">Shared genes<span v-if="detail.genes.total != null"> · {{ detail.genes.total }}</span> <SampleInfo label="Shared genes" :text="help.sharedGenes" /></h5>
            <p v-if="detail.genes.status !== 'ready'">Processed variant evidence is unavailable for one or both samples.</p>
            <SharedGeneComparison v-else :reference-id="referenceId" :candidate-id="candidateId" :expected-genes="detail.genes.total" />
        </template>
    </section>
</template>
<script>
import SummaryPager from "../PbGene/SummaryPager";
import SampleInfo from './SampleInfo';
import SharedGeneComparison from './SharedGeneComparison.vue';
const { requestSampleEvidence } = require('./sampleEvidence');
const ontology = require('../PbVariant/hpoTree.generated.json');
const help = require('./sampleHelp');
export default {
    components: { SummaryPager, SampleInfo, SharedGeneComparison },
    props: { referenceId: {type:String,required:true}, candidateId:{type:String,required:true} },
    data: () => ({ help, detail:null, loading:false, error:'', hpoPage:1, requestId:0, alive:true }),
    computed: {
        matchedTerms() { return this.detail ? this.detail.hpo_matches.filter(row => row.matched === true) : []; },
        matchingAvailable() { return Boolean(this.detail && this.detail.hpo_matches.some(row => row.matched != null)); },
        hpoPageCount() { return Math.max(1, Math.ceil(this.matchedTerms.length / 5)); },
        visibleHpos() { return this.matchedTerms.slice((this.hpoPage - 1) * 5, this.hpoPage * 5); },
    },
    created() { this.loadPage(1); },
    beforeDestroy() { this.alive = false; this.requestId++; },
    methods: {
        profileScore(side) { const scores = this.detail && this.detail[side + '_scores']; return scores && scores.rphersZ != null ? scores.rphersZ.toFixed(2) : 'Unavailable'; },
        async loadPage(page) {
            const requestId = ++this.requestId;
            this.loading = true; this.error = '';
            try {
                const result = await requestSampleEvidence('sample-matches', this.referenceId, {candidate_id:this.candidateId, gene_page:page});
                if (this.alive && requestId === this.requestId) this.detail = result;
            } catch (error) { if (this.alive && requestId === this.requestId) this.error = error.message; }
            finally { if (this.alive && requestId === this.requestId) this.loading = false; }
        },
        hpoName(id) { return ontology.nodes[id] ? ontology.nodes[id][0] : id; },
        geneHref(gene) { return `/pb_gene2.html?query=${encodeURIComponent(gene)}`; },
        phenotypeHref(id) { return `/pb_phenotype.html?query=${encodeURIComponent(id)}`; },
        variantHref(id, gene) { return `/pb_variant.html?query=${encodeURIComponent(id)}&gene=${encodeURIComponent(gene)}`; },
    },
};
</script>
