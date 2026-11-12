<template>
    <div>
        <p v-if="(!overview && !compact) || showCoverage" class="pg2-coverage" role="status">{{ coverage }}</p>
        <div class="pg2-demographics" :class="{ 'pg2-demographics-overview': overview, 'pg2-demographics-compact': compact }">
            <div v-for="(column, index) in columns" :key="index" class="pg2-demo-column">
                <div v-for="group in column" :key="group.key" class="pg2-demo-group">
                    <div class="pg2-demo-heading"><h3>{{ overview || compact ? overviewTitles[group.key] : group.label }} <help-tooltip v-if="compact" :label="'About variant carrier ' + overviewTitles[group.key]" :text="compactHelp[group.key]" /></h3><span v-if="group.key === 'byProject'">{{ (overview || compact) ? `${projects.length.toLocaleString()} projects` : `${filteredProjects.length} / ${projects.length}` }}</span></div>
                    <template v-if="(overview || compact) && group.key === 'byProject'">
                        <input v-model="projectSearch" type="search" class="pg2-project-search" placeholder="Search projects" :aria-label="'Search ' + scope + ' projects and investigators'" />
                        <table class="pg2-project-table">
                            <thead><tr><th scope="col">Project / Investigator</th><th scope="col" :aria-sort="projectSortDirection === 'desc' ? 'descending' : 'ascending'"><button type="button" class="pg2-project-sort" @click="toggleProjectSort">{{ compact ? 'Carriers' : 'Samples' }} <b-icon-arrow-down v-if="projectSortDirection === 'desc'" /><b-icon-arrow-up v-else /></button></th></tr></thead>
                            <tbody>
                                <tr v-for="row in visibleProjects" :key="row.label">
                                    <td>{{ row.label }}<small :class="{ 'pg2-muted': !row.investigator }">{{ row.investigator ? 'Investigator: ' + row.investigator : 'Investigator unavailable' }}</small></td>
                                    <td><div class="pg2-project-count"><strong>{{ row.count.toLocaleString() }}</strong><progress :max="Math.max(Number(carrierCount), 1)" :value="row.count" :aria-label="`${row.label}: ${row.count} of ${carrierCount} samples`" /></div></td>
                                </tr>
                                <tr v-if="!visibleProjects.length"><td colspan="2" class="pg2-muted">{{ projectSearch.trim() && projects.length ? 'No projects match this search.' : 'Project metadata unavailable.' }}</td></tr>
                            </tbody>
                        </table>
                        <nav v-if="projectPageCount > 1" class="pg2-project-pagination" :aria-label="scope + ' project pages'">
                            <button type="button" :disabled="currentProjectPage === 1" aria-label="Previous project page" @click="goToProjectPage(currentProjectPage - 1)"><b-icon-chevron-left /></button>
                            <template v-for="(page, index) in projectPageItems">
                                <span v-if="page === null" :key="'gap-' + index" aria-hidden="true">…</span>
                                <button v-else :key="page" type="button" :class="{ 'pg2-current-page': currentProjectPage === page }" :aria-current="currentProjectPage === page ? 'page' : null" :aria-label="'Project page ' + page" @click="goToProjectPage(page)">{{ page }}</button>
                            </template>
                            <button type="button" :disabled="currentProjectPage === projectPageCount" aria-label="Next project page" @click="goToProjectPage(currentProjectPage + 1)"><b-icon-chevron-right /></button>
                        </nav>
                    </template>
                    <template v-else>
                    <input v-if="group.key === 'byProject'" v-model="projectSearch" type="search" class="pg2-project-search" placeholder="Search project groups" :aria-label="'Search ' + scope + ' project groups'" />
                    <div :class="{ 'pg2-project-list': group.key === 'byProject', 'pg2-project-list-expanded': expandProjects }" :tabindex="group.key === 'byProject' ? 0 : null" :aria-label="group.key === 'byProject' ? 'Project groups and carrier counts' : null">
                        <p v-if="!rows(group).length" class="pg2-muted">{{ group.key === 'byProject' && projectSearch.trim() ? 'No project groups match this search.' : 'Unavailable' }}</p>
                        <div v-for="row in rows(group)" :key="row.label" class="pg2-demo-row" :class="{ 'pg2-project-row': group.key === 'byProject' }">
                            <span :title="row.label">{{ overview || compact ? displayLabel(row.label) : row.label }}</span><strong>{{ row.count.toLocaleString() }}</strong>
                            <progress :max="Math.max(Number(carrierCount), 1)" :value="row.count" :aria-label="`${row.label}: ${row.count} of ${carrierCount} carriers`" />
                        </div>
                    </div>
                    <button v-if="group.key === 'byProject' && filteredProjects.length > 8" class="pg2-text-button pg2-project-expand" type="button" :aria-expanded="String(expandProjects)" @click="expandProjects = !expandProjects">{{ expandProjects ? 'Compact list' : 'Expand full list' }}</button>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { normalizeCarrierAgeDemographics } from "../PbGene/carrierAge";
import HelpTooltip from './HelpTooltip';
const PROJECT_PAGE_SIZE = 4;
export default {
    name: "Gene2Demographics",
    components: {HelpTooltip},
    props: {
        summary: { type: Object, default: null },
        fallback: { type: Object, default: () => ({}) },
        carrierCount: { type: Number, default: 0 },
        status: { type: String, default: "" },
        scope: { type: String, required: true },
        overview: { type: Boolean, default: false },
        compact: { type: Boolean, default: false },
    },
    data: () => ({ projectSearch: '', expandProjects: false, projectPage: 1, projectSortDirection: 'desc', overviewTitles: { byProject: 'Project', byAge: 'Age', bySex: 'Sex', byAffected: 'Affected' }, compactHelp: {
        byProject: 'Project counts among distinct observed carriers of this variant. Project and investigator labels come from carrier metadata. Search matches both projects and investigators.',
        byAge: 'Age at enrollment, grouped into the same age bands as the gene overview. Unknown ages remain a separate group.',
        bySex: 'Sex recorded in variant-carrier metadata. Unknown values are kept separate.',
        byAffected: 'Affected status recorded in variant-carrier metadata. It is independent of the HPO profile and residual-score availability.',
    } }),
    computed: {
        showCoverage() { return !this.summary || this.summary.status !== 'ready' || Number(this.summary.matchedMetadataCount) < this.carrierCount; },
        coverage() {
            if (!this.summary) return this.status || 'Carrier metadata not supplied';
            return `${this.summary.matchedMetadataCount.toLocaleString()} / ${this.carrierCount.toLocaleString()} metadata records · ${this.summary.status === 'ready' ? 'Complete' : 'Partial results'}`;
        },
        groups() {
            const demo = normalizeCarrierAgeDemographics(this.summary ? this.summary.geneCarrierDemographics : this.fallback);
            const sexCounts = new Map();
            (demo.bySex || []).forEach(row => {
                const raw = String(row.label).trim();
                const label = /^(0|unknown)$/i.test(raw) ? 'Unknown' : raw;
                sexCounts.set(label, (sexCounts.get(label) || 0) + (Number(row.count) || 0));
            });
            demo.bySex = [...sexCounts].map(([label, count]) => ({ label, count }));
            return [ ['byProject', 'By project', 'project'], ['byAge', 'By age', 'band'], ['bySex', 'By sex', 'label'], ['byAffected', 'Affected', 'label'] ]
                .map(([key, label, field]) => ({ key, label, rows: (demo[key] || []).map(row => ({ label: String(row[field]), count: Number(row.count) || 0, investigator: this.investigatorLabel(row, key === 'byProject' && (demo.projectInvestigators || {})[row[field]]) })) }));
        },
        columns() { return [[this.groups[0]], [this.groups[1]], [this.groups[2], this.groups[3]]]; },
        projects() { return this.groups[0].rows; },
        filteredProjects() { const query = this.projectSearch.trim().toLowerCase(); return this.projects.filter(row => !query || `${row.label} ${row.investigator}`.toLowerCase().includes(query)); },
        sortedProjects() { const direction = this.projectSortDirection === 'desc' ? -1 : 1; return [...this.filteredProjects].sort((a, b) => (a.count - b.count) * direction || a.label.localeCompare(b.label)); },
        projectPageCount() { return Math.max(1, Math.ceil(this.filteredProjects.length / PROJECT_PAGE_SIZE)); },
        currentProjectPage() { return Math.max(1, Math.min(this.projectPage, this.projectPageCount)); },
        visibleProjects() { return this.sortedProjects.slice((this.currentProjectPage - 1) * PROJECT_PAGE_SIZE, this.currentProjectPage * PROJECT_PAGE_SIZE); },
        projectPageItems() {
            const total = this.projectPageCount;
            const current = this.currentProjectPage;
            const pages = Array.from({ length: total }, (_, index) => index + 1).filter(page => page === 1 || page === total || (current <= 3 ? page <= 5 : current >= total - 2 ? page >= total - 4 : Math.abs(page - current) <= 1));
            return pages.reduce((items, page, index) => [...items, ...(index && page > pages[index - 1] + 1 ? [null] : []), page], []);
        },
    },
    watch: {
        projectSearch() { this.projectPage = 1; },
        scope() { this.projectSearch = ''; this.projectPage = 1; this.projectSortDirection = 'desc'; },
        summary() { this.projectPage = 1; },
    },
    methods: {
        rows(group) { return group.key === 'byProject' ? this.filteredProjects : group.rows; },
        investigatorLabel(row, projectInvestigators) {
            const value = row.investigators || row.investigator || row.inv || projectInvestigators;
            const label = Array.isArray(value) ? value.join(' · ') : String(value || '').trim();
            return /^(?:unavailable|unknown|n\/?a|[-–—])$/i.test(label) ? '' : label;
        },
        displayLabel(label) { return /^(female|male)$/i.test(label) ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : label; },
        goToProjectPage(page) { this.projectPage = Math.max(1, Math.min(Number(page) || 1, this.projectPageCount)); },
        toggleProjectSort() { this.projectSortDirection = this.projectSortDirection === 'desc' ? 'asc' : 'desc'; this.projectPage = 1; },
    },
};
</script>
