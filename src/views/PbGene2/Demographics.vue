<template>
    <div>
        <p class="pg2-coverage" role="status">{{ coverage }}</p>
        <div class="pg2-demographics">
            <div v-for="(column, index) in columns" :key="index" class="pg2-demo-column">
                <div v-for="group in column" :key="group.key" class="pg2-demo-group">
                    <div class="pg2-demo-heading"><h3>{{ group.label }}</h3><span v-if="group.key === 'byProject'">{{ filteredProjects.length }} / {{ projects.length }}</span></div>
                    <input v-if="group.key === 'byProject'" v-model="projectSearch" type="search" class="pg2-project-search" placeholder="Search project groups" :aria-label="'Search ' + scope + ' project groups'" />
                    <div :class="{ 'pg2-project-list': group.key === 'byProject', 'pg2-project-list-expanded': expandProjects }" :tabindex="group.key === 'byProject' ? 0 : null" :aria-label="group.key === 'byProject' ? 'Project groups and carrier counts' : null">
                        <p v-if="!rows(group).length" class="pg2-muted">{{ group.key === 'byProject' && projectSearch.trim() ? 'No project groups match this search.' : 'Unavailable' }}</p>
                        <div v-for="row in rows(group)" :key="row.label" class="pg2-demo-row" :class="{ 'pg2-project-row': group.key === 'byProject' }">
                            <span :title="row.label">{{ row.label }}</span><strong>{{ row.count.toLocaleString() }}</strong>
                            <progress :max="Math.max(Number(carrierCount), 1)" :value="row.count" :aria-label="`${row.label}: ${row.count} of ${carrierCount} carriers`" />
                        </div>
                    </div>
                    <button v-if="group.key === 'byProject' && filteredProjects.length > 8" class="pg2-text-button pg2-project-expand" type="button" :aria-expanded="String(expandProjects)" @click="expandProjects = !expandProjects">{{ expandProjects ? 'Compact list' : 'Expand full list' }}</button>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { normalizeCarrierAgeDemographics } from "../PbGene/carrierAge";
export default {
    name: "Gene2Demographics",
    props: {
        summary: { type: Object, default: null },
        fallback: { type: Object, default: () => ({}) },
        carrierCount: { type: Number, default: 0 },
        status: { type: String, default: "" },
        scope: { type: String, required: true },
    },
    data: () => ({ projectSearch: '', expandProjects: false }),
    computed: {
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
                .map(([key, label, field]) => ({ key, label, rows: (demo[key] || []).map(row => ({ label: String(row[field]), count: Number(row.count) || 0 })) }));
        },
        columns() { return [[this.groups[0]], [this.groups[1]], [this.groups[2], this.groups[3]]]; },
        projects() { return this.groups[0].rows; },
        filteredProjects() { const query = this.projectSearch.trim().toLowerCase(); return this.projects.filter(row => !query || row.label.toLowerCase().includes(query)); },
    },
    methods: { rows(group) { return group.key === 'byProject' ? this.filteredProjects : group.rows; } },
};
</script>
