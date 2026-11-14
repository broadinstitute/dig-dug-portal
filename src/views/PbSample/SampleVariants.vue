<template>
    <div class="pbs-variant-browser">
        <div class="pbs-variant-scroll" role="region" aria-label="Sample variants table" tabindex="0">
            <table class="pbs-variant-table">
                <colgroup><col style="width:10%" /><col style="width:23%" /><col style="width:23%" /><col style="width:14%" /><col style="width:13%" /><col style="width:10%" /><col style="width:7%" /></colgroup>
                <thead><tr>
                    <th><ColumnHeaderFilter label="Gene" :options="geneOptions" :selected="selectedGenes" :match-count="filtered.length" @input="selectedGenes = $event" @sort="setSort('gene',$event)" /></th>
                    <th><ColumnHeaderFilter label="Variant" search-only :query="search" :match-count="filtered.length" @query="search = $event" @sort="setSort('id',$event)" /></th>
                    <th><ColumnHeaderFilter label="Consequence" :options="consequenceOptions" :selected="selectedConsequences" :match-count="filtered.length" @input="selectedConsequences = $event" @sort="setSort('consequence',$event)" /></th>
                    <th><ColumnHeaderFilter label="LoFTEE / AM" :options="annotationOptions" :selected="selectedAnnotations" :match-count="filtered.length" @input="selectedAnnotations = $event" @sort="setSort('annotation',$event)" /></th>
                    <th><ColumnHeaderFilter label="ClinVar" accent :options="clinvarOptions" :selected="selectedClinvar" :match-count="filtered.length" @input="selectedClinvar = $event" @sort="setSort('clinvar',$event)" /></th>
                    <th><button @click="sortBy('crdcAlleleFrequency')" type="button">CRDC AF <b-icon-arrow-down-up /></button></th>
                    <th><ColumnHeaderFilter label="GT" :options="genotypeOptions" :selected="selectedGenotypes" :match-count="filtered.length" @input="selectedGenotypes = $event" @sort="setSort('genotype',$event)" /></th>
                </tr></thead>
                <tbody><tr v-for="(row,index) in visible" :key="row.gene + ':' + row.id + ':' + index">
                    <td><a :href="geneHref(row.gene)">{{ row.gene }}</a></td>
                    <td><a :href="variantHref(row)">{{ row.id }}</a></td>
                    <td>{{ row.consequence }}</td>
                    <td :title="score(row).title">{{ annotation(row) }}</td>
                    <td>{{ clinvarValue(row) }}</td>
                    <td>{{ frequency(row.crdcAlleleFrequency) }}</td>
                    <td class="pbs-gt-value">{{ row.genotype }}</td>
                </tr><tr v-if="!filtered.length"><td colspan="7">No variants match these filters.</td></tr></tbody>
            </table>
        </div>
        <nav class="pbs-variant-pagination" aria-label="Sample variant pages">
            <span>{{ filtered.length ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, filtered.length) }} of {{ filtered.length }} variants</span>
            <label>Rows <select v-model.number="pageSize"><option :value="10">10</option><option :value="20">20</option><option :value="50">50</option></select></label>
            <button type="button" :disabled="page === 1" @click="page--">Previous</button>
            <label>Page <input type="number" min="1" :max="pageCount" :value="page" @change="goToPage($event.target.value)" /> / {{ pageCount }}</label>
            <button type="button" :disabled="page >= pageCount" @click="page++">Next</button>
        </nav>
    </div>
</template>
<script>
import ColumnHeaderFilter from './ColumnHeaderFilter';
const { burdenPathogenicScore } = require('./variantEvidence');
const { clinvarDisplayLabel } = require('../../utils/clinvarLabels');
export default {
    components: { ColumnHeaderFilter },
    props: { variants: { type: Array, default: () => [] } },
    data: () => ({ search:'', selectedGenes:null, selectedConsequences:null, selectedAnnotations:null, selectedClinvar:null, selectedGenotypes:null, sortKey:'gene', sortDirection:1, page:1, pageSize:10 }),
    computed: {
        geneOptions() { return this.valueOptions(row => row.gene); },
        consequenceOptions() { return this.valueOptions(row => row.consequence); },
        annotationOptions() { const labels = { HC:'LoFTEE HC', AM:'AlphaMissense', REVEL:'REVEL only', none:'Unannotated' }; return this.valueOptions(this.annotationKind).map(item => ({ ...item,label:labels[item.value] })); },
        clinvarOptions() { return this.valueOptions(this.clinvarValue); },
        genotypeOptions() { return this.valueOptions(row => row.genotype); },
        filtered() {
            const search = this.search.trim().toLowerCase();
            return this.variants.filter(row => (this.selectedGenes === null || this.selectedGenes.includes(row.gene))
                && (!search || [row.id, row.gene, row.hgvsc, row.hgvsp, row.rsid].join(' ').toLowerCase().includes(search))
                && (this.selectedConsequences === null || this.selectedConsequences.includes(row.consequence))
                && (this.selectedClinvar === null || this.selectedClinvar.includes(this.clinvarValue(row)))
                && (this.selectedAnnotations === null || this.selectedAnnotations.includes(this.annotationKind(row)))
                && (this.selectedGenotypes === null || this.selectedGenotypes.includes(row.genotype)));
        },
        sorted() { return [...this.filtered].sort((a,b) => {
            const left = this.sortKey === 'annotation' ? this.annotation(a) : a[this.sortKey], right = this.sortKey === 'annotation' ? this.annotation(b) : b[this.sortKey];
            if (this.sortKey === 'crdcAlleleFrequency') {
                const missing = value => value == null || value === '' || !Number.isFinite(Number(value));
                if (missing(left) !== missing(right)) return missing(left) ? 1 : -1;
                if (!missing(left)) return (Number(left) - Number(right)) * this.sortDirection;
            }
            return String(left || '').localeCompare(String(right || ''), undefined, { numeric: true }) * this.sortDirection || a.id.localeCompare(b.id);
        }); },
        pageCount() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); },
        visible() { return this.sorted.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); },
        filterSignature() { return JSON.stringify([this.search, this.selectedGenes, this.selectedConsequences, this.selectedAnnotations, this.selectedClinvar, this.selectedGenotypes, this.pageSize, this.variants]); },
    },
    watch: { filterSignature() { this.page = 1; } },
    methods: {
        score: burdenPathogenicScore,
        valueOptions(getValue) { const counts = new Map(); this.variants.forEach(row => { const value = getValue(row) || 'Unavailable'; counts.set(value,(counts.get(value) || 0) + 1); }); return [...counts].map(([value,count]) => ({value,count})).sort((a,b)=>a.value.localeCompare(b.value)); },
        setSort(key,direction) { this.sortKey = key; this.sortDirection = direction; this.page = 1; },
        clinvarValue(row) { const value = String(row.clinvar == null ? '' : row.clinvar).trim(); return ['', '-', '—', '.'].includes(value) ? 'Unavailable' : clinvarDisplayLabel(value); },
        annotationKind(row) { return row.loftee === 'HC' ? 'HC' : row.alphaMissense != null ? 'AM' : row.revel != null ? 'REVEL' : 'none'; },
        annotation(row) { const kind = this.annotationKind(row); return kind === 'HC' ? 'LoFTEE HC' : kind === 'AM' ? `AlphaMissense ${this.score(row).display}` : this.score(row).display; },
        frequency(value) { if (value == null || value === '' || !Number.isFinite(Number(value))) return 'Unavailable'; return Number(value).toPrecision(4); },
        sortBy(key) { this.sortDirection = this.sortKey === key ? -this.sortDirection : 1; this.sortKey = key; this.page = 1; },
        goToPage(value) { const number = Number(value); this.page = Number.isFinite(number) ? Math.max(1, Math.min(this.pageCount, Math.trunc(number))) : 1; },
        geneHref(gene) { return `/pb_gene2.html?query=${encodeURIComponent(gene)}`; },
        variantHref(row) { return `/pb_variant.html?query=${encodeURIComponent(row.id)}&gene=${encodeURIComponent(row.gene)}`; },
    },
};
</script>
