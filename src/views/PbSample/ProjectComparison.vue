<template>
    <section class="pbs-project-detail" :aria-label="'Statistics for ' + project">
        <h4>{{ project }} <SampleInfo label="Project comparison statistics" :text="help.projectComparison" /></h4>
        <p class="pbs-project-coverage"><strong>{{ statistics.total.toLocaleString() }}</strong> samples · Phenotype scores <strong>{{ statistics.phenotypeAvailable.toLocaleString() }} / {{ statistics.total.toLocaleString() }}</strong> · Variant evidence <strong>{{ statistics.genotypeAvailable.toLocaleString() }} / {{ statistics.total.toLocaleString() }}</strong></p>
        <div class="pbs-project-statistics">
            <section><h5>Within-project summary</h5><table class="pbs-comparison-table"><thead><tr><th>Measure</th><th>Median</th><th>IQR</th><th>Available n</th></tr></thead>
                <tbody><tr v-for="metric in statistics.metrics" :key="metric.key"><td>{{ metric.label }}</td><td>{{ format(metric.median) }}</td><td>{{ metric.n ? format(metric.q1) + '–' + format(metric.q3) : 'Unavailable' }}</td><td>{{ metric.n.toLocaleString() }}</td></tr></tbody>
            </table></section>
            <section><h5>HPO match distribution</h5><table class="pbs-comparison-table"><thead><tr><th>Matched HPO</th><th>Samples</th><th>% of project</th></tr></thead>
                <tbody><tr v-for="row in visibleDistribution" :key="row.matched == null ? 'unavailable' : row.matched"><td>{{ row.matched == null ? 'Unavailable' : row.matched + ' / ' + referenceHpoCount }}</td><td>{{ row.n.toLocaleString() }}</td><td>{{ row.percentage.toFixed(1) }}%</td></tr></tbody>
            </table><SamplePagination v-if="distributionPageCount > 1" label="Project HPO distribution pages" :page="distributionPage" :page-count="distributionPageCount" @change="distributionPage = $event" /></section>
        </div>
        <h5>Samples in this project</h5>
        <table class="pbs-comparison-table pbs-project-members"><thead><tr><th>Global rank</th><th>Sample</th><th>Matched HPO</th><th>rPheRS Z-score</th><th>Shared genes</th><th>Shared variants</th></tr></thead>
            <tbody><template v-for="row in visibleSamples"><tr :key="row.sampleId"><td>#{{ row.rank }}</td><td><button class="pbs-disclosure" type="button" :aria-label="'Compare project sample ' + row.sampleId" :aria-expanded="String(expandedSamples.includes(row.sampleId))" @click="toggleSample(row.sampleId)">{{ expandedSamples.includes(row.sampleId) ? '▾' : '▸' }}</button><a class="pbs-sample-mark pbs-compared-id" :href="sampleHref(row.sampleId)">{{ row.sampleId }}</a></td><td>{{ row.matchedHpo == null ? 'Unavailable' : row.matchedHpo + ' / ' + referenceHpoCount }}</td><td>{{ format(row.rphersZ) }}</td><td>{{ row.sharedGenes == null ? 'Unavailable' : row.sharedGenes }}</td><td>{{ row.sharedVariants == null ? 'Unavailable' : row.sharedVariants }}</td></tr><tr v-if="expandedSamples.includes(row.sampleId)" :key="row.sampleId+'-detail'"><td colspan="6"><SampleComparison :reference-id="referenceId" :candidate-id="row.sampleId" /></td></tr></template></tbody>
        </table>
        <div class="pbs-comparison-pagination"><span>{{ rows.length ? (page-1)*5+1 : 0 }}–{{ Math.min(page*5,rows.length) }} of {{ rows.length }} project samples</span><SamplePagination v-if="pageCount > 1" label="Project sample pages" :page="page" :page-count="pageCount" @change="page = $event" /></div>
    </section>
</template>
<script>
import SampleComparison from './SampleComparison';
import SampleInfo from './SampleInfo';
import SamplePagination from './SamplePagination';
const { projectComparison } = require('./projectComparisonStats');
const help = require('./sampleHelp');
export default {
    components:{ SampleComparison, SampleInfo, SamplePagination },
    props:{ project:{type:String,required:true}, rows:{type:Array,default:()=>[]}, referenceId:{type:String,required:true}, referenceHpoCount:{type:Number,default:0} },
    data:()=>({ help, page:1, distributionPage:1, expandedSamples:[] }),
    computed:{
        statistics(){return projectComparison(this.rows);},
        visibleSamples(){return this.rows.slice((this.page-1)*5,this.page*5);},
        pageCount(){return Math.max(1,Math.ceil(this.rows.length/5));},
        visibleDistribution(){return this.statistics.matchedDistribution.slice((this.distributionPage-1)*5,this.distributionPage*5);},
        distributionPageCount(){return Math.max(1,Math.ceil(this.statistics.matchedDistribution.length/5));},
    },
    watch:{ rows(){this.page=1;this.distributionPage=1;} },
    methods:{
        format(value){return value==null?'Unavailable':Number.isInteger(value)?String(value):value.toFixed(2);},
        toggleSample(id){this.expandedSamples=this.expandedSamples.includes(id)?this.expandedSamples.filter(value=>value!==id):[...this.expandedSamples,id];},
        sampleHref(id){return `/sampleresult.html?query=${encodeURIComponent(id)}`;},
    },
};
</script>
