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
            <nav v-if="hpoPageCount > 1" class="pbs-detail-pager" aria-label="Matched HPO pages"><span>{{ (hpoPage - 1) * 5 + 1 }}–{{ Math.min(hpoPage * 5, matchedTerms.length) }} of {{ matchedTerms.length }} matched terms</span><button type="button" :disabled="hpoPage === 1" aria-label="Previous matched HPO page" @click="hpoPage--">‹</button><span>{{ hpoPage }} / {{ hpoPageCount }}</span><button type="button" :disabled="hpoPage === hpoPageCount" aria-label="Next matched HPO page" @click="hpoPage++">›</button></nav>
            <h5>Shared genes<span v-if="detail.genes.total != null"> · {{ detail.genes.total }}</span> <SampleInfo label="Shared genes" :text="help.sharedGenes" /></h5>
            <p v-if="detail.genes.status !== 'ready'">Processed variant evidence is unavailable for one or both samples.</p>
            <template v-else>
                <table class="pbs-comparison-table pbs-shared-gene-table">
                    <colgroup><col style="width:24%" /><col style="width:23%" /><col style="width:23%" /><col style="width:15%" /><col style="width:15%" /></colgroup>
                    <thead><tr><th>Gene comparison</th><th>Searched sample variants</th><th>Comparison sample variants</th><th>Identical variants</th><th>Gene page</th></tr></thead>
                    <tbody><template v-for="row in detail.genes.rows">
                        <tr :key="row.gene">
                            <td><button type="button" class="pbs-gene-toggle" :aria-label="'Compare variants in ' + row.gene" :aria-expanded="String(expandedGenes.includes(row.gene))" @click="toggleGene(row.gene)"><span class="pbs-gene-chevron" aria-hidden="true">{{ expandedGenes.includes(row.gene) ? '▾' : '▸' }}</span><span>{{ row.gene }}</span></button></td>
                            <td>{{ row.referenceVariantCount }}</td><td>{{ row.candidateVariantCount }}</td><td>{{ row.sharedVariantCount }}</td>
                            <td><a class="pbs-gene-page-link" :href="geneHref(row.gene)" target="_blank" rel="noopener noreferrer" :aria-label="'Open ' + row.gene + ' gene page in a new tab'">Gene page ↗</a></td>
                        </tr>
                        <tr v-if="expandedGenes.includes(row.gene)" :key="row.gene + '-variants'"><td colspan="5" class="pbs-gene-expanded">
                            <p v-if="geneErrors[row.gene]" role="alert">{{ geneErrors[row.gene] }} <button type="button" @click="fetchGene(row.gene)">Retry variants</button></p>
                            <p v-else-if="!geneDetails[row.gene]" role="status">Loading variants…</p>
                            <div v-else class="pbs-comparison-calls">
                                <section v-for="side in ['reference', 'candidate']" :key="side" :aria-label="side === 'reference' ? 'Reference variants' : 'Candidate variants'">
                                    <h6 :class="side === 'reference' ? 'pbs-searched-heading' : 'pbs-compared-heading'"><span>{{ side === 'reference' ? 'Searched sample' : 'Comparison sample' }}</span><strong><span class="pbs-sample-mark" :class="side === 'reference' ? 'pbs-searched-id' : 'pbs-compared-id'">{{ side === 'reference' ? referenceId : candidateId }}</span></strong></h6>
                                    <table class="pbs-comparison-table"><thead><tr><th>Variant</th><th>GT <SampleInfo label="GT (genotype)" :text="help.genotype" /></th></tr></thead>
                                        <tbody><tr v-for="variant in visibleCalls(row.gene, side)" :key="variant.id">
                                            <td><a :href="variantHref(variant.id, row.gene)">{{ variant.id }}</a><small v-if="isSharedVariant(row.gene, variant.id)" class="pbs-identical-label">Shared variant</small></td>
                                            <td>{{ variant.gtStatus === 'recorded' ? variant.gt : 'Unavailable' }}<small v-if="variant.gtStatus === 'conflict'">Conflicting source calls</small></td>
                                        </tr></tbody>
                                    </table>
                                    <SamplePagination v-if="callPageCount(row.gene, side) > 1" :label="side + ' variant pages for ' + row.gene" :page="callPages[row.gene + side] || 1" :page-count="callPageCount(row.gene, side)" @change="$set(callPages, row.gene + side, $event)" />
                                </section>
                            </div>
                        </td></tr>
                    </template><tr v-if="!detail.genes.rows.length"><td colspan="5">No shared genes in the processed dataset.</td></tr></tbody>
                </table>
                <div class="pbs-comparison-pagination"><span>{{ detail.genes.total ? (detail.genes.page - 1) * 5 + 1 : 0 }}–{{ Math.min(detail.genes.page * 5, detail.genes.total) }} of {{ detail.genes.total }} shared genes</span><SamplePagination v-if="detail.genes.page_count > 1" label="Shared gene pages" :page="detail.genes.page" :page-count="detail.genes.page_count" @change="loadPage($event)" /></div>
            </template>
        </template>
    </section>
</template>
<script>
import SampleInfo from './SampleInfo';
import SamplePagination from './SamplePagination';
const { requestSampleEvidence } = require('./sampleEvidence');
const ontology = require('../PbVariant/hpoTree.generated.json');
const help = require('./sampleHelp');
export default {
    components: { SampleInfo, SamplePagination },
    props: { referenceId: {type:String,required:true}, candidateId:{type:String,required:true} },
    data: () => ({ help, detail:null, loading:false, error:'', hpoPage:1, expandedGenes:[], geneDetails:{}, geneErrors:{}, callPages:{}, requestId:0, alive:true }),
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
        toggleGene(gene) {
            if (this.expandedGenes.includes(gene)) this.expandedGenes = this.expandedGenes.filter(value => value !== gene);
            else { this.expandedGenes.push(gene); if (!this.geneDetails[gene]) this.fetchGene(gene); }
        },
        async fetchGene(gene) {
            this.$set(this.geneErrors, gene, '');
            try {
                const result = await requestSampleEvidence('sample-matches', this.referenceId, {candidate_id:this.candidateId, gene});
                if (!result.genes || result.genes.status !== 'ready' || !result.genes.rows[0]) throw Error('Variant comparison is unavailable.');
                if (this.alive) this.$set(this.geneDetails, gene, result.genes.rows[0]);
            } catch (error) { if (this.alive) this.$set(this.geneErrors, gene, error.message); }
        },
        visibleCalls(gene, side) { const page = this.callPages[gene + side] || 1; return (this.geneDetails[gene][side + 'Variants'] || []).slice((page - 1) * 5, page * 5); },
        callPageCount(gene, side) { return Math.max(1, Math.ceil((this.geneDetails[gene][side + 'Variants'] || []).length / 5)); },
        isSharedVariant(gene, id) { return (this.geneDetails[gene].sharedVariantIds || []).includes(id.replace(/^chr/i, '').toUpperCase()); },
        hpoName(id) { return ontology.nodes[id] ? ontology.nodes[id][0] : id; },
        geneHref(gene) { return `/pb_gene2.html?query=${encodeURIComponent(gene)}`; },
        phenotypeHref(id) { return `/pb_phenotype.html?query=${encodeURIComponent(id)}`; },
        variantHref(id, gene) { return `/pb_variant.html?query=${encodeURIComponent(id)}&gene=${encodeURIComponent(gene)}`; },
    },
};
</script>
