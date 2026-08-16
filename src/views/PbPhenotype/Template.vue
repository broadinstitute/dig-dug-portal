<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <main class="container-fluid mdkp-body pbp-page">
            <div class="pbp-shell">
                <div class="pbp-toolbar">
                    <div class="pbp-crumb"><a href="/pb_Front.html">⌂ Home</a><span>›</span><strong>Phenotype search</strong></div>
                    <form class="pbp-search" role="search" @submit.prevent="submitSearch">
                        <input v-model.trim="searchQuery" aria-label="Phenotype name or HPO ID" placeholder="Phenotype name or HPO ID">
                        <button type="submit">Search</button>
                    </form>
                </div>

                <section v-if="term" class="pbp-card pbp-reference" aria-labelledby="phenotype-title">
                    <div class="pbp-definition">
                        <h1 id="phenotype-title">{{ term.name }}</h1>
                        <p class="pbp-id">{{ hpoId }}</p>
                        <p>{{ term.definition || 'No definition is available in the selected HPO release.' }}</p>
                        <div class="pbp-relations">
                            <p><strong>Parent {{ term.parents.length }}:</strong> {{ relationText(term.parents) || 'None' }}</p>
                            <p><strong>Child terms {{ term.children.length }}:</strong> {{ relationText(term.children.slice(0, 3)) || 'None' }}<button v-if="term.children.length > 3" class="pbp-link-button" type="button" @click="showAllChildren = !showAllChildren">{{ showAllChildren ? 'show less' : `+${term.children.length - 3} more` }}</button></p>
                            <p v-if="showAllChildren" class="pbp-more">{{ relationText(term.children.slice(3)) }}</p>
                        </div>
                        <p class="pbp-source">Definition and ontology: HPO OBO · {{ reference.meta.hpoOBO }}</p>
                    </div>

                    <div class="pbp-overview">
                        <h2 id="orphanet-title">Orphanet reference overview</h2>
                        <p class="pbp-muted">Choose a count or frequency to inspect the matching entries below.</p>
                        <div class="pbp-metrics">
                            <button :class="{ active: filter === 'all' }" type="button" @click="selectFilter('all')"><strong>{{ rows.length.toLocaleString() }}</strong><span>Associated entries</span></button>
                            <button :class="{ active: filter === 'obligate' }" type="button" @click="selectFilter('obligate')"><strong>{{ summary.obligate.toLocaleString() }}</strong><span>Obligate (100%)</span></button>
                            <button :class="{ active: filter === 'diagnostic' }" type="button" @click="selectFilter('diagnostic')"><strong>{{ summary.diagnostic.toLocaleString() }}</strong><span>Diagnostic criterion</span></button>
                        </div>
                        <div class="pbp-frequency">
                            <button v-for="item in frequencies" :key="item.label" :class="{ active: filter === item.label }" type="button" @click="selectFilter(item.label)"><span>{{ item.short }}</span><strong>{{ item.count.toLocaleString() }}</strong></button>
                        </div>
                        <p class="pbp-source">Orphadata Products 4 and 6 · July 2026 reference snapshot</p>
                    </div>
                </section>

                <section v-if="term" class="pbp-card pbp-orphanet-list-card" aria-labelledby="diseases-title">
                    <div class="pbp-section-head"><div><h2 id="diseases-title">Diseases and related genes</h2><p class="pbp-muted">The selected overview filter controls this Orphanet list · separate from CRDC gene burden results · not a diagnosis</p></div><span>{{ filteredRows.length.toLocaleString() }} matching entries</span></div>
                    <label class="pbp-within-search">Filter this list by disease or gene<input v-model.trim="withinQuery" type="search" placeholder="For example: epilepsy or SCN1A"></label>
                    <div v-if="visibleRows.length" class="pbp-table-wrap">
                        <table>
                            <thead><tr><th>Disease</th><th>Frequency</th><th>Phenotype details</th><th>Related genes</th></tr></thead>
                            <tbody>
                                <template v-for="row in visibleRows">
                                    <tr :key="row.code" class="pbp-expandable-row" :class="{ 'pbp-diagnostic-row': row.diagnostic }" @click="handleRowClick(row.code, $event)">
                                        <td><strong>{{ row.name }}</strong><a class="pbp-orpha-link" :href="`https://www.orpha.net/en/disease/detail/${row.code}`" target="_blank" rel="noopener noreferrer" :aria-label="`Open ORPHA:${row.code} in Orphanet`">ORPHA:{{ row.code }} ↗</a></td>
                                        <td>{{ row.frequency }}</td>
                                        <td class="pbp-detail-cell" role="button" tabindex="0" :aria-expanded="String(expandedCriteria.includes(row.code))" :aria-controls="`pbp-criteria-${row.code}`" @click.stop="toggleCriteria(row.code)" @keydown.enter="toggleCriteria(row.code)" @keydown.space.prevent="toggleCriteria(row.code)"><span v-if="row.diagnostic" class="pbp-criterion">Included *</span><span v-else class="pbp-detail-cue">Details</span><span class="pbp-detail-chevron" aria-hidden="true">{{ expandedCriteria.includes(row.code) ? '▴' : '▾' }}</span></td>
                                        <td><template v-if="row.genes.length"><a v-for="gene in visibleGenes(row)" :key="gene[0]" class="pbp-gene-link" :href="`/pb_Gene.html?query=${encodeURIComponent(gene[0])}`">{{ gene[0] }}</a></template><span v-else>Not listed</span><button v-if="row.genes.length > 4" class="pbp-link-button" type="button" @click="toggleGenes(row.code)">{{ expandedGenes.includes(row.code) ? 'show less' : `+${row.genes.length - 4} more` }}</button><small v-if="row.genes.length">{{ row.genes.length }} Orphanet disease-associated {{ row.genes.length === 1 ? 'gene' : 'genes' }}</small></td>
                                    </tr>
                                    <tr v-if="expandedCriteria.includes(row.code)" :id="`pbp-criteria-${row.code}`" :key="`${row.code}-criteria`" class="pbp-detail-row"><td colspan="4"><p><strong>Why this disease appears:</strong> {{ whyDiseaseAppears(row) }}</p><h3>Other features to check</h3><table class="pbp-feature-table"><thead><tr><th>Reported frequency</th><th>Phenotypes</th></tr></thead><tbody><tr v-for="group in supportingGroups(row)" :key="group.frequency"><td><strong>{{ group.label }}</strong><small>{{ group.items.length }} terms</small></td><td><span v-for="item in visibleGroupItems(group, row)" :key="item.hpoId" class="pbp-feature-term">{{ phenotypeName(item.hpoId) }} <small>{{ item.hpoId }}</small></span></td></tr></tbody></table><button v-if="hiddenFeatureCount(row)" class="pbp-feature-more" type="button" @click="togglePhenotypes(row.code)">{{ expandedPhenotypes.includes(row.code) ? 'Show fewer features' : 'Show lower-frequency and remaining features' }}</button></td></tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                    <p v-else class="pbp-empty">No Orphanet reference entries match this selection.</p>
                    <button v-if="visibleCount < filteredRows.length" class="pbp-load" type="button" @click="visibleCount += 5">Load 5 more</button>
                    <p class="pbp-footnote">* Included in an established diagnostic criteria set; this finding alone does not establish a diagnosis. Excluded (0%) annotations are omitted from this list.</p>
                </section>

                <section v-if="term" class="pbp-card" aria-labelledby="genes-title">
                    <span class="pbp-badge">CRDC · PRECOMPUTED</span>
                    <h2 id="genes-title">Top associated genes</h2>
                    <p class="pbp-muted">Genes whose burden scores are positively associated with this binary HPO phenotype.</p>
                    <div class="pbp-unavailable">Precomputed CRDC gene burden association results have not been connected for {{ hpoId }}.</div>
                </section>

                <section v-if="term" class="pbp-card" aria-labelledby="crdc-title">
                    <span class="pbp-badge pbp-badge--teal">CRDC</span>
                    <h2 id="crdc-title">Explore this phenotype in CRDC</h2>
                    <p class="pbp-muted">Investigator, exact-age statistics, and matching samples will appear when the test server HPO data source is connected.</p>
                    <div class="pbp-unavailable">CRDC phenotype observations are currently unavailable.</div>
                </section>

                <section v-else class="pbp-card pbp-empty">
                    <h1>Phenotype not found</h1>
                    <p>Enter an HPO ID such as HP:0001250 or an exact HPO term such as Seizure.</p>
                </section>
            </div>
        </main>
    </div>
</template>

<script>
import { ORPHANET_REFERENCE } from "./orphanetReference.generated";

const FREQUENCIES = [
    ["Obligate (100%)", "Obligate"], ["Very frequent (99-80%)", "Very frequent"],
    ["Frequent (79-30%)", "Frequent"], ["Occasional (29-5%)", "Occasional"],
    ["Very rare (<4-1%)", "Very rare"],
];

const DISEASE_PROFILES = {};
Object.entries(ORPHANET_REFERENCE.associations).forEach(([hpoId, associations]) => {
    associations.forEach(([diseaseIndex, frequency, diagnostic]) => {
        if (!DISEASE_PROFILES[diseaseIndex]) DISEASE_PROFILES[diseaseIndex] = [];
        DISEASE_PROFILES[diseaseIndex].push({ hpoId, frequency, diagnostic: Boolean(diagnostic) });
    });
});

function resolveHpoId(query) {
    const id = String(query || "").match(/HP:\d{7}/i);
    if (id) return id[0].toUpperCase();
    const normalized = String(query || "").trim().toLocaleLowerCase();
    return Object.keys(ORPHANET_REFERENCE.terms).find((key) => ORPHANET_REFERENCE.terms[key][0].toLocaleLowerCase() === normalized) || "";
}

export default {
    name: "PbPhenotypeTemplate",
    data() {
        const query = new URLSearchParams(window.location.search).get("query") || "HP:0001250";
        return { reference: ORPHANET_REFERENCE, hpoId: resolveHpoId(query), searchQuery: query, filter: "all", withinQuery: "", visibleCount: 5, showAllChildren: false, expandedGenes: [], expandedCriteria: [], expandedPhenotypes: [] };
    },
    computed: {
        term() {
            const item = this.reference.terms[this.hpoId];
            return item ? { name: item[0], definition: item[1], parents: item[2], children: item[3] } : null;
        },
        rows() {
            return (this.reference.associations[this.hpoId] || []).filter(([, frequency]) => frequency !== "Excluded (0%)").map(([index, frequency, diagnostic]) => {
                const [code, name, genes, criteria] = this.reference.diseases[index];
                return { code, name, genes, criteria, frequency, diagnostic: Boolean(diagnostic), profile: DISEASE_PROFILES[index] || [] };
            }).sort((a, b) => Number(b.diagnostic) - Number(a.diagnostic));
        },
        summary() {
            return { obligate: this.rows.filter((row) => row.frequency === "Obligate (100%)").length, diagnostic: this.rows.filter((row) => row.diagnostic).length };
        },
        frequencies() {
            return FREQUENCIES.map(([label, short]) => ({ label, short, count: this.rows.filter((row) => row.frequency === label).length }));
        },
        filteredRows() {
            const query = this.withinQuery.toLocaleLowerCase();
            return this.rows.filter((row) => {
                const matchesFilter = this.filter === "all" || (this.filter === "obligate" && row.frequency === "Obligate (100%)") || (this.filter === "diagnostic" && row.diagnostic) || row.frequency === this.filter;
                const matchesQuery = !query || row.name.toLocaleLowerCase().includes(query) || row.genes.some((gene) => gene[0].toLocaleLowerCase().includes(query));
                return matchesFilter && matchesQuery;
            });
        },
        visibleRows() { return this.filteredRows.slice(0, this.visibleCount); },
    },
    methods: {
        submitSearch() { window.location.assign(`/pb_phenotype.html?query=${encodeURIComponent(this.searchQuery)}`); },
        selectFilter(value) { this.filter = value; this.visibleCount = 5; },
        relationText(ids) { return ids.map((id) => `${this.reference.terms[id] ? this.reference.terms[id][0] : id} [${id}]`).join(" · "); },
        toggleGenes(code) { this.expandedGenes = this.expandedGenes.includes(code) ? this.expandedGenes.filter((item) => item !== code) : [...this.expandedGenes, code]; },
        handleRowClick(code, event) { if (!event.target.closest("a, button")) this.toggleCriteria(code); },
        visibleGenes(row) { return row.genes.slice(0, this.expandedGenes.includes(row.code) ? row.genes.length : 4); },
        toggleCriteria(code) { this.expandedCriteria = this.expandedCriteria.includes(code) ? this.expandedCriteria.filter((item) => item !== code) : [...this.expandedCriteria, code]; },
        whyDiseaseAppears(row) { return `${this.term.name} is reported as ${row.frequency.toLocaleLowerCase()}${row.diagnostic ? " and is included in an established diagnostic criteria set" : " in the Orphanet phenotype profile"}.`; },
        togglePhenotypes(code) { this.expandedPhenotypes = this.expandedPhenotypes.includes(code) ? this.expandedPhenotypes.filter((item) => item !== code) : [...this.expandedPhenotypes, code]; },
        supportingPhenotypes(row) {
            const rank = { "Obligate (100%)": 0, "Very frequent (99-80%)": 1, "Frequent (79-30%)": 2, "Occasional (29-5%)": 3, "Very rare (<4-1%)": 4 };
            return row.profile.filter((item) => item.hpoId !== this.hpoId && rank[item.frequency] !== undefined).sort((a, b) => rank[a.frequency] - rank[b.frequency]);
        },
        allSupportingGroups(row) { return FREQUENCIES.map(([frequency, label]) => ({ frequency, label, items: this.supportingPhenotypes(row).filter((item) => item.frequency === frequency) })).filter((group) => group.items.length); },
        supportingGroups(row) { const groups = this.allSupportingGroups(row); if (this.expandedPhenotypes.includes(row.code)) return groups; const high = groups.filter((group) => ["Obligate (100%)", "Very frequent (99-80%)", "Frequent (79-30%)"].includes(group.frequency)); return high.length ? high : groups.slice(0, 1); },
        visibleGroupItems(group, row) { return group.items.slice(0, this.expandedPhenotypes.includes(row.code) ? group.items.length : 4); },
        hiddenFeatureCount(row) { return this.expandedPhenotypes.includes(row.code) ? 1 : this.supportingPhenotypes(row).length - this.supportingGroups(row).reduce((count, group) => count + Math.min(4, group.items.length), 0); },
        phenotypeName(hpoId) { return this.reference.terms[hpoId] ? this.reference.terms[hpoId][0] : hpoId; },
    },
};
</script>

<style src="./style.css"></style>
