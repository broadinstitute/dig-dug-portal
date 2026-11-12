<template>
    <div class="pg2-crdc-summary">
        <h2>Variants observed in the CRDC ({{ sampleCount.toLocaleString() }} samples)</h2>
        <div class="pg2-overview-columns">
            <section v-for="group in groups" :key="group.key" class="pg2-overview-column" :class="'pg2-summary-' + group.key" :aria-label="group.title">
                <h3>{{ group.title }} <span :class="{ 'pg2-annotated-total': group.key === 'predictors' }">{{ group.key === 'predictors' ? annotatedCount.toLocaleString() : total.toLocaleString() }}</span><span v-if="group.key === 'predictors'" class="pg2-overview-denominator"> / {{ total.toLocaleString() }}</span> <help-tooltip info :label="group.title + ' source'" :text="group.source.text" :links="group.source.links" /></h3>
                <div class="pg2-stacked-bar" role="group" :aria-label="group.title + ' variant counts and filters'">
                    <button v-for="item in barSegments(group)" v-if="item.count" :key="item.label" type="button" class="pg2-bar-segment" :class="[item.color, { 'pg2-bar-selected': selected(item), 'pg2-others-segment': item.members }]" :style="{ flexGrow: item.count, fontSize: segmentFontSize(item) + 'px' }" :title="item.label + ': ' + item.count.toLocaleString()" :aria-label="'Filter ' + item.label + ': ' + item.count.toLocaleString() + ' variants'" :aria-pressed="String(selected(item))" :aria-expanded="item.label === 'Annotated' ? String(showPredictors) : null" @click="activate(item)">
                        <span v-if="item.members" class="pg2-others-dividers" aria-hidden="true"><i v-for="(position, index) in otherDividers(item)" :key="index" :style="{ left: position + '%' }"></i></span>
                        <span class="pg2-segment-label">{{ item.members ? 'Others ' : '' }}{{ item.count.toLocaleString() }}</span>
                    </button>
                </div>
                <div v-if="group.key === 'consequence'" class="pg2-consequence-list">
                    <table class="pg2-consequence-table">
                        <thead><tr><th scope="col">Consequence</th><th scope="col" :aria-sort="consequenceSortDirection === 'desc' ? 'descending' : 'ascending'"><button type="button" class="pg2-consequence-sort" @click="toggleConsequenceSort">Variants <b-icon-arrow-down v-if="consequenceSortDirection === 'desc'" /><b-icon-arrow-up v-else /></button></th></tr></thead>
                        <tbody><tr v-for="item in visibleConsequences" :key="item.filterLabel">
                            <td><button type="button" :class="{ 'pg2-legend-active': selected(item) }" :aria-pressed="String(selected(item))" @click="activate(item)"><span class="pg2-legend-dot" :class="item.color" aria-hidden="true"></span>{{ item.label }}</button></td>
                            <td><button type="button" :class="{ 'pg2-legend-active': selected(item) }" :aria-label="'Filter ' + item.label + ': ' + item.count + ' variants'" :aria-pressed="String(selected(item))" @click="activate(item)">{{ item.count.toLocaleString() }}</button></td>
                        </tr></tbody>
                    </table>
                    <nav v-if="consequencePageCount > 1" class="pg2-project-pagination" aria-label="Consequence pages">
                        <button type="button" :disabled="currentConsequencePage === 1" aria-label="Previous consequence page" @click="goToConsequencePage(currentConsequencePage - 1)"><b-icon-chevron-left /></button>
                        <button v-for="page in consequencePageCount" :key="page" type="button" :class="{ 'pg2-current-page': currentConsequencePage === page }" :aria-current="currentConsequencePage === page ? 'page' : null" :aria-label="'Consequence page ' + page" @click="goToConsequencePage(page)">{{ page }}</button>
                        <button type="button" :disabled="currentConsequencePage === consequencePageCount" aria-label="Next consequence page" @click="goToConsequencePage(currentConsequencePage + 1)"><b-icon-chevron-right /></button>
                    </nav>
                </div>
                <div v-else class="pg2-bar-legend">
                    <template v-for="item in group.segments">
                        <button v-if="item.filter" :key="item.label" type="button" class="pg2-legend-item" :class="{ 'pg2-legend-active': selected(item), 'pg2-annotated-toggle': item.label === 'Annotated', 'pg2-unannotated': item.label === 'Not annotated' }" :aria-pressed="String(selected(item))" :aria-expanded="item.label === 'Annotated' ? String(showPredictors) : null" @click="activate(item)">
                            <span class="pg2-legend-dot" :class="item.color" aria-hidden="true"></span>{{ item.label }} <strong>{{ item.count.toLocaleString() }}</strong><template v-if="item.label === 'Annotated'"><b-icon-chevron-up v-if="showPredictors" /><b-icon-chevron-down v-else /></template>
                        </button>
                        <span v-else :key="item.label" class="pg2-legend-item"><span class="pg2-legend-dot" :class="item.color" aria-hidden="true"></span>{{ item.label }} <strong>{{ item.count.toLocaleString() }}</strong></span>
                    </template>
                </div>
                <template v-if="group.key === 'predictors' && showPredictors">
                    <button v-for="item in predictorRows" :key="item.label" type="button" class="pg2-predictor-row" :class="{ 'pg2-legend-active': selected(item) }" :aria-pressed="String(selected(item))" @click="$emit('filter', item.filter, item.filterLabel)">
                        <span>{{ item.label }}</span><strong>{{ item.count.toLocaleString() }}</strong><progress :max="Math.max(annotatedCount, 1)" :value="item.count" :aria-label="item.label + ': ' + item.count + ' of ' + annotatedCount + ' annotated variants'" />
                    </button>
                    <p class="pg2-overlap-note">Predictor annotations may overlap.</p>
                </template>
            </section>
        </div>
    </div>
</template>
<script>
import HelpTooltip from './HelpTooltip';
import { VARIANT_ANNOTATION_SOURCES } from './referenceProvenance';
export default {
    name: 'Gene2VariantOverview',
    components: { HelpTooltip },
    props: {
        mix: { type: Object, required: true },
        total: { type: Number, required: true },
        annotatedCount: { type: Number, required: true },
        sampleCount: { type: Number, required: true },
        filters: { type: Object, required: true },
        gene: { type: String, default: '' },
    },
    data: () => ({ showPredictors: false, consequencePage: 1, consequenceSortDirection: 'desc' }),
    computed: {
        groups() {
            const clinvarColors = { 'P/LP': 'pg2-bar-pathogenic', VUS: 'pg2-bar-vus', 'B/LB': 'pg2-bar-benign', 'Other classification': 'pg2-bar-other', 'No ClinVar': 'pg2-bar-missing' };
            return [
                { key: 'consequence', source: VARIANT_ANNOTATION_SOURCES.consequence, title: 'Consequence', segments: this.mix.consequence.map(item => ({ ...item, label: item.label.replace(/_/g, ' '), filterLabel: item.label, color: this.consequenceColor(item.label), filter: 'consequence' })) },
                { key: 'predictors', source: VARIANT_ANNOTATION_SOURCES.predictors, title: 'In Silico Predictors', segments: [
                    { label: 'Annotated', count: this.annotatedCount, color: 'pg2-bar-benign', filter: 'predictionCoverage' },
                    { label: 'Not annotated', count: Math.max(0, this.total - this.annotatedCount), color: 'pg2-bar-missing', filter: 'predictionCoverage' },
                ] },
                { key: 'clinvar', source: VARIANT_ANNOTATION_SOURCES.clinvar, title: 'ClinVar pathogenicity', segments: this.mix.clinvar.map(item => ({ ...item, label: item.label === 'Other classification' ? 'Other' : item.label, filterLabel: item.label, color: clinvarColors[item.label], filter: 'clinvar' })) },
            ];
        },
        predictorRows() {
            return [
                ...this.mix.annotations.map(item => ({ ...item, label: item.label === 'AM annotated' ? 'AlphaMissense' : 'REVEL', filterLabel: item.label, filter: 'annotations' })),
                { label: 'LoFTEE HC', count: this.mix.loftee, filter: 'loftee' },
            ];
        },
        consequenceBarSegments() {
            const rows = [...this.groups[0].segments].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
            const top = rows.slice(0, 4);
            const rest = rows.slice(4);
            return rest.length ? [...top, { label: 'Others', count: rest.reduce((sum, row) => sum + row.count, 0), color: 'pg2-bar-consequence-others', filter: 'consequence', members: rest }] : top;
        },
        sortedConsequences() {
            const direction = this.consequenceSortDirection === 'desc' ? -1 : 1;
            return [...this.groups[0].segments].sort((a, b) => (a.count - b.count) * direction || a.label.localeCompare(b.label));
        },
        consequencePageCount() { return Math.max(1, Math.ceil(this.sortedConsequences.length / 4)); },
        currentConsequencePage() { return Math.min(this.consequencePage, this.consequencePageCount); },
        visibleConsequences() { return this.sortedConsequences.slice((this.currentConsequencePage - 1) * 4, this.currentConsequencePage * 4); },
    },
    methods: {
        selected(item) {
            if (item.members) return item.members.every(member => (this.filters.consequence || []).includes(member.filterLabel));
            return item.filter === 'loftee' ? this.filters.loftee : (this.filters[item.filter] || []).includes(item.filterLabel || item.label);
        },
        activate(item) {
            if (item.members) { this.$emit('filter-consequences', item.members.map(member => member.filterLabel)); return; }
            if (item.filter === 'predictionCoverage' && item.label === 'Annotated') this.showPredictors = !this.showPredictors;
            this.$emit('filter', item.filter, item.filterLabel || item.label);
        },
        segmentFontSize(item) {
            if (item.members) return 18;
            if (item.label === 'Not annotated') return 18;
            const fraction = item.count / Math.max(this.total, 1);
            return fraction < 0.05 ? 16 : fraction < 0.08 ? 18 : 22;
        },
        consequenceColor(label) {
            if (label === 'Unavailable') return 'pg2-bar-missing';
            const fixedColors = {
                '3_prime_UTR_variant': 0, intron_variant: 1, upstream_gene_variant: 2, missense_variant: 3,
                '5_prime_UTR_variant': 4, synonymous_variant: 5, frameshift_variant: 6, stop_gained: 7,
                downstream_gene_variant: 8, splice_acceptor_variant: 9, splice_donor_variant: 10, inframe_deletion: 11,
            };
            const index = Object.prototype.hasOwnProperty.call(fixedColors, label) ? fixedColors[label]
                : [...label].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0) % 12;
            return 'pg2-consequence-color-' + index;
        },
        barSegments(group) { return group.key === 'consequence' ? this.consequenceBarSegments : group.segments; },
        otherDividers(item) {
            let count = 0;
            return item.members.slice(0, -1).map(member => { count += member.count; return 100 * count / Math.max(item.count, 1); });
        },
        goToConsequencePage(page) { this.consequencePage = Math.max(1, Math.min(Number(page) || 1, this.consequencePageCount)); },
        toggleConsequenceSort() { this.consequenceSortDirection = this.consequenceSortDirection === 'desc' ? 'asc' : 'desc'; this.consequencePage = 1; },
    },
    watch: { gene() { this.showPredictors = false; this.consequencePage = 1; this.consequenceSortDirection = 'desc'; } },
};
</script>
