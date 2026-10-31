<template>
    <div class="pg2-variant-summary">
        <div class="pg2-variant-summary-heading"><strong>Selected variant · {{ variant.id }} · {{ variant.carrierCount }} carriers</strong><a :href="variantUrl">Open variant page <b-icon-box-arrow-up-right /></a></div>
        <div class="pg2-variant-summary-grid">
            <div>
                <h3>Observed carrier phenotypes</h3>
                <input v-model="phenotypeSearch" class="pg2-summary-search" type="search" placeholder="Search phenotype name or HPO ID" aria-label="Search observed carrier phenotypes" />
                <p v-if="!summary" class="pg2-muted">{{ status || 'Loading carrier phenotypes…' }}</p>
                <template v-else>
                    <p class="pg2-coverage">{{ phenotypeCoverage }}</p>
                    <table class="pg2-table"><thead><tr><th>HPO term</th><th class="pg2-numeric" :aria-sort="phenotypeSortDirection === 'desc' ? 'descending' : 'ascending'"><button class="pg2-sort-button" type="button" @click="togglePhenotypeSort">Carriers <b-icon-sort-down v-if="phenotypeSortDirection === 'desc'" /><b-icon-sort-up v-else /></button></th></tr></thead><tbody>
                        <tr v-for="term in visiblePhenotypes" :key="term.hpoId"><td>{{ label(term.hpoId) }} <small>{{ term.hpoId }}</small></td><td class="pg2-numeric">{{ term.count }} / {{ term.denominator }}</td></tr>
                        <tr v-if="!filteredPhenotypes.length"><td colspan="2" class="pg2-empty">{{ phenotypeSearch.trim() && phenotypes.length ? 'No phenotypes match this search.' : summary.phenotypeMetadataCount ? 'No HPO terms recorded.' : 'HPO metadata unavailable.' }}</td></tr>
                    </tbody></table>
                    <SummaryPager v-if="filteredPhenotypes.length > 5" compact :page="phenotypePage" :total-pages="Math.ceil(filteredPhenotypes.length / 5)" label="Observed phenotype pages" :input-id="'pg2-phenotypes-' + variant.id" @change="phenotypePage = $event" />
                </template>
                <p v-if="context && variant.phenotypeMatchScore != null" class="pg2-coverage">Mean rPheRS Z-score <strong>{{ statistic(variant.phenotypeMatchScore) }}</strong> · {{ variant.phenotypeMatchScoredCarrierCount }} / {{ variant.phenotypeMatchCarrierCount }} scored</p>
            </div>
            <div>
                <h3>Co-genes · current HPO context</h3>
                <input v-model="coGeneSearch" class="pg2-summary-search" type="search" placeholder="Search co-gene symbol" aria-label="Search co-carrier genes" />
                <p class="pg2-coverage">Shared carriers: this variant group. Gene effects: the full selected analysis cohort.</p>
                <p v-if="associationError" class="pg2-muted" role="status">{{ associationError }} <button type="button" class="pg2-text-button" @click="loadAssociations">Retry</button></p>
                <p v-if="associationLoading" class="pg2-coverage" role="status">Calculating co-gene associations… The first full-cohort calculation and download may take about a minute.</p>
                <div class="pg2-table-scroll"><table class="pg2-table pg2-co-genes"><thead><tr><th>Gene</th><th class="pg2-numeric">Shared carriers</th><th v-for="column in coGeneAssociationColumns" :key="column.key" class="pg2-numeric" :aria-sort="coGeneAriaSort(column.key)"><button class="pg2-sort-button" type="button" @click="toggleCoGeneSort(column.key)">{{ column.label }} <b-icon-sort-down v-if="coGeneSortKey === column.key && coGeneSortDirection === 'desc'" /><b-icon-sort-up v-else-if="coGeneSortKey === column.key" /><span v-else aria-hidden="true">↕</span></button></th></tr></thead><tbody>
                    <tr v-for="row in visibleCoGenes" :key="row.gene"><td><a :href="'/pb_gene2.html?query=' + encodeURIComponent(row.gene)">{{ row.gene }}</a></td><td class="pg2-numeric">{{ row.count }} / {{ row.denominator }}</td><td class="pg2-numeric">{{ associationCell(row.gene, 'beta') }}</td><td class="pg2-numeric">{{ associationCell(row.gene, 'p_value') }}</td><td class="pg2-numeric">{{ associationCell(row.gene, 'fdr') }}</td></tr>
                    <tr v-if="!filteredCoGenes.length"><td colspan="5" class="pg2-empty">{{ coGeneSearch.trim() && coGenes.length ? 'No co-genes match this search.' : summary ? 'No co-carrier gene list available.' : 'Loading carrier gene lists…' }}</td></tr>
                </tbody></table></div>
                <SummaryPager v-if="filteredCoGenes.length > 5" compact :page="coGenePage" :total-pages="Math.ceil(filteredCoGenes.length / 5)" label="Co-gene pages" :input-id="'pg2-co-genes-' + variant.id" @change="coGenePage = $event" />
            </div>
        </div>
    </div>
</template>
<script>
import SummaryPager from "../PbGene/SummaryPager";
import { hpoLabel } from "../PbGene/hpoContextSearch";
import { fetchContextAssociations } from "../../utils/contextAssociationRequest";
import { standardizedField, contextMatches, sameReference } from "../../utils/rphersUnits";
export default {
    name: 'Gene2VariantSummary',
    components: { SummaryPager },
    props: {
        variant: { type: Object, required: true },
        gene: { type: String, required: true },
        summary: { type: Object, default: null },
        status: { type: String, default: '' },
        context: { type: Object, default: null },
    },
    data: () => ({ phenotypePage: 1, coGenePage: 1, phenotypeSearch: '', coGeneSearch: '', phenotypeSortDirection: 'desc', coGeneSortKey: '', coGeneSortDirection: 'asc', associations: {}, standardization: null, associationLoading: false, associationError: '', requestSequence: 0 }),
    computed: {
        phenotypes() { return (this.summary || {}).observedPhenotypes || []; },
        filteredPhenotypes() {
            const query = this.phenotypeSearch.trim().toLowerCase();
            return this.phenotypes.filter(row => !query || `${this.label(row.hpoId)} ${row.hpoId}`.toLowerCase().includes(query))
                .sort((a, b) => (Number(a.count) - Number(b.count)) * (this.phenotypeSortDirection === 'desc' ? -1 : 1) || String(a.hpoId).localeCompare(String(b.hpoId)));
        },
        visiblePhenotypes() { return this.filteredPhenotypes.slice((this.phenotypePage - 1) * 5, this.phenotypePage * 5); },
        phenotypeCoverage() {
            const count = this.summary.phenotypeMetadataCount;
            return count == null ? 'HPO coverage unavailable' : `${Number(count).toLocaleString()} / ${this.variant.carrierCount.toLocaleString()} carriers have HPO metadata${this.summary.status === 'ready' ? '' : ' · partial results'}`;
        },
        coGenes() { return (this.summary || {}).coCarrierGenes || []; },
        filteredCoGenes() { const query = this.coGeneSearch.trim().toLowerCase(); return this.coGenes.filter(row => !query || String(row.gene).toLowerCase().includes(query)); },
        coGeneAssociationColumns() { return [{ key: 'beta', label: 'Effect β per 0.1 GRS (SD)' }, { key: 'p_value', label: 'p' }, { key: 'fdr', label: 'q (FDR)' }]; },
        sortedCoGenes() {
            if (!this.coGeneSortKey) return this.filteredCoGenes;
            const values = new Map(this.filteredCoGenes.map(row => [row.gene, this.associationValue(row.gene, this.coGeneSortKey)]));
            return [...this.filteredCoGenes].sort((a, b) => {
                const left = values.get(a.gene), right = values.get(b.gene);
                if (left == null && right != null) return 1;
                if (right == null && left != null) return -1;
                return (left != null && right != null ? (left - right) * (this.coGeneSortDirection === 'desc' ? -1 : 1) : 0) || a.gene.localeCompare(b.gene);
            });
        },
        visibleCoGenes() { return this.sortedCoGenes.slice((this.coGenePage - 1) * 5, this.coGenePage * 5); },
        requestKey() { return JSON.stringify([this.gene, this.variant.id, this.context, this.summary && this.summary.status, this.summary && this.summary.geneListMetadataCount, this.coGenes.map(row => row.gene)]); },
        variantUrl() {
            const query = new URLSearchParams({ query: this.variant.id, gene: this.gene });
            // PB Variant already reads the shared clinical focus. Do not invent URL
            // parameters that its existing input handler does not consume.
            return '/pb_variant.html?' + query.toString();
        },
    },
    watch: {
        requestKey: { immediate: true, handler() { this.loadAssociations(); } },
        phenotypeSearch() { this.phenotypePage = 1; },
        coGeneSearch() { this.coGenePage = 1; },
    },
    beforeDestroy() { this.requestSequence += 1; },
    methods: {
        label: hpoLabel,
        togglePhenotypeSort() { this.phenotypeSortDirection = this.phenotypeSortDirection === 'desc' ? 'asc' : 'desc'; this.phenotypePage = 1; },
        toggleCoGeneSort(key) {
            if (!this.coGeneAssociationColumns.some(column => column.key === key)) return;
            this.coGeneSortDirection = this.coGeneSortKey === key && this.coGeneSortDirection === 'asc' ? 'desc' : 'asc';
            this.coGeneSortKey = key;
            this.coGenePage = 1;
        },
        coGeneAriaSort(key) { return this.coGeneSortKey === key ? (this.coGeneSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'; },
        statistic(value) { return value == null || !Number.isFinite(Number(value)) ? '—' : Math.abs(Number(value)) > 0 && Math.abs(Number(value)) < .001 ? Number(value).toExponential(2) : Number(value).toFixed(3); },
        associationValue(gene, field) {
            if (!this.context || this.associationLoading) return null;
            const row = this.associations[gene];
            if (!row || row.status !== 'ok') return null;
            const value = field === 'beta' ? standardizedField(row, 'beta_sd_per_0_1_grs', this.standardization) : row[field];
            return value != null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
        },
        associationCell(gene, field) {
            if (!this.context) return 'No context';
            if (this.associationLoading) return '…';
            return this.statistic(this.associationValue(gene, field));
        },
        async loadAssociations() {
            const sequence = ++this.requestSequence;
            this.associations = {}; this.standardization = null; this.associationLoading = false; this.associationError = '';
            if (!this.context || !this.summary || this.summary.status !== 'ready') return;
            if (this.summary.geneListMetadataCount !== this.summary.carrierTotal) {
                this.associationError = 'Complete carrier gene lists are required for co-gene association and FDR.'; return;
            }
            this.associationLoading = true;
            const context = this.context;
            try {
                const result = await fetchContextAssociations({ gene: this.gene, terms: context.terms.join(','), co_genes: this.coGenes.map(row => row.gene).filter(gene => gene !== this.gene), score_type: context.scoreType, affected_only: context.analysisSet === 'affected' });
                if (sequence !== this.requestSequence) return;
                if (result.target_gene !== this.gene || !Array.isArray(result.query_hpo) || [...result.query_hpo].sort().join(',') !== [...context.terms].sort().join(',') || result.score_type !== context.scoreType || result.affected_only !== (context.analysisSet === 'affected')) throw new Error('Co-gene results did not match the applied HPO profile.');
                if (!contextMatches(result.rphers_standardization, context.terms) || !sameReference(result.rphers_standardization, context.reference)) throw new Error('Co-gene results use a different or unavailable scoring reference.');
                this.associations = result.gene_associations || {};
                this.standardization = result.rphers_standardization;
            } catch (error) {
                if (sequence === this.requestSequence) this.associationError = String(error.message || error);
            } finally { if (sequence === this.requestSequence) this.associationLoading = false; }
        },
    },
};
</script>
