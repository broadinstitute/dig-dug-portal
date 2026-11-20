<template>
    <div class="pbs-rank-evidence">
        <h3>Why rank {{ disease.rank }} · {{ disease.name }}</h3>
        <p>{{ disease.matchedIds.length }} of {{ ids.length }} selected phenotypes match · {{ disease.profile.length }} disease phenotype annotations in {{ sourceLabel }}.</p>
        <div class="pbs-table-wrap"><table class="pbs-table"><thead><tr><th>Your phenotype</th><th>Matching disease annotation</th><th>Reported frequency</th><th>Weight</th></tr></thead><tbody><tr v-for="item in evidence" :key="item.id"><td>{{ name(item.id) }}</td><td><template v-if="item.annotation">{{ name(item.annotation.hpoId) }}<small>{{ item.annotation.hpoId }}</small></template><span v-else>Not matched</span></td><td>{{ item.annotation ? item.annotation.frequency || 'Not supplied by this source' : '—' }}</td><td>{{ item.annotation && item.annotation.weight != null ? item.annotation.weight.toFixed(4) : '—' }}</td></tr></tbody></table></div>
        <template v-if="disease.source === 'orphanet'">
            <p class="pbs-rank-formula">Matched weight sum = {{ fixed(disease.numerator) }}<br>Query coverage = {{ fixed(disease.numerator) }} / {{ ids.length }} = {{ fixed(disease.queryCoverage) }}<br>Disease coverage = min(1, {{ fixed(disease.numerator) }} / {{ fixed(disease.denominator) }}) = {{ fixed(disease.diseaseCoverage) }}<br>Rank score = 2 × query coverage × disease coverage / (query coverage + disease coverage) = <strong>{{ fixed(disease.score) }}</strong></p>
            <p>The disease denominator reduces ancestor–descendant duplication. Each query uses its highest-frequency matching annotation; the same annotation can match more than one query. Ties use query coverage, then disease name. This score is a reference ranking, not a diagnostic probability.</p>
            <details><summary>Frequency weights</summary><ul><li v-for="frequency in frequencies" :key="frequency[0]">{{ frequency[0] }} → {{ frequency[2].toFixed(4) }}</li></ul><p>Excluded (0%) annotations are ignored.</p></details>
        </template>
        <p v-else>Rank uses {{ disease.overlapCount }} matching disease annotations / {{ disease.profile.length }} total annotations, then the number of selected phenotypes matched, then disease coverage. Frequency weights are not supplied or used for this source.</p>
    </div>
</template>
<script>
import { FREQUENCIES } from './phenotypeModel';
import { diseaseRankEvidence } from './diseaseRankEvidence';
export default {
    props: { disease: Object, ids: Array, terms: Object, sourceLabel: String },
    computed: { evidence() { return diseaseRankEvidence(this.disease, this.ids, this.terms); }, frequencies() { return FREQUENCIES; } },
    methods: { name(id) { return this.terms[id]?.[0] || id; }, fixed(value) { return value == null ? '—' : value.toFixed(4); } },
};
</script>
