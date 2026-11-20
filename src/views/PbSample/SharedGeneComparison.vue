<template>
    <div class="pbs-shared-comparison">
        <p v-if="loading" role="status">Loading shared variant annotations…</p>
        <p v-else-if="error" role="alert">{{ error }} <button type="button" @click="load">Retry shared variants</button></p>
        <template v-else-if="model">
            <div class="pbs-shared-summary">
                <div class="pbs-shared-bar" role="img" :aria-label="`${model.identicalGenes} genes with an identical variant; ${model.differentGenes} genes with different variants only`"><span :style="{width:(model.totalGenes ? model.identicalGenes / model.totalGenes * 100 : 0)+'%'}"></span></div>
                <span><strong>{{ model.identicalGenes }}</strong> genes with an identical variant</span><span>·</span><span><strong>{{ model.differentGenes }}</strong> genes with different variants only</span>
            </div>
            <div class="pbs-shared-section-heading"><h5>Identical variants · {{ model.identical.length }} <SampleInfo label="Identical variants" :text="identicalHelp" /></h5><span>the same variant is present in both samples</span></div>
            <div class="pbs-shared-scroll" role="region" aria-label="Identical variants table" tabindex="0">
                <table class="pbs-comparison-table pbs-identical-table">
                    <colgroup><col style="width:10%"/><col style="width:18%"/><col style="width:10%"/><col style="width:12%"/><col style="width:14%"/><col style="width:11%"/><col style="width:11%"/><col style="width:14%"/></colgroup>
                    <thead><tr>
                        <th :aria-sort="ariaSort('identical','sharedCount')"><button type="button" @click="sortBy('identical','sharedCount','desc')">Gene <b-icon-arrow-down v-if="active('identical','sharedCount') && sorts.identical.direction==='desc'"/><b-icon-arrow-up v-else-if="active('identical','sharedCount')"/><b-icon-arrow-down-up v-else/></button></th>
                        <th :aria-sort="ariaSort('identical','id')"><button type="button" @click="sortBy('identical','id')">Identical variant <b-icon-arrow-down-up/></button></th>
                        <th><span class="pbs-pair-label"><span class="pbs-sample-dot pbs-searched-dot"></span>Searched GT</span></th>
                        <th><span class="pbs-pair-label"><span class="pbs-sample-dot pbs-compared-dot"></span>Comparison GT</span></th>
                        <th :aria-sort="ariaSort('identical','consequence')"><button type="button" @click="sortBy('identical','consequence')">Consequence <b-icon-arrow-down-up/></button></th>
                        <th :aria-sort="ariaSort('identical','af')"><span class="pbs-column-heading"><button type="button" @click="sortBy('identical','af')">gnomAD AF <b-icon-arrow-down-up/></button><SampleInfo label="gnomAD allele frequency" :text="afHelp" /></span></th>
                        <th :aria-sort="ariaSort('identical','clinvar')"><button type="button" @click="sortBy('identical','clinvar')">ClinVar <b-icon-arrow-down-up/></button></th>
                        <th :aria-sort="ariaSort('identical','score')"><span class="pbs-column-heading"><button type="button" @click="sortBy('identical','score','desc')">Variant score <b-icon-arrow-down-up/></button><SampleInfo label="Variant score" :text="scoreHelp" /></span></th>
                    </tr></thead>
                    <tbody><tr v-for="row in visibleIdentical" :key="row.key">
                        <td v-if="row.geneSpan" :rowspan="row.geneSpan" class="pbs-shared-gene-cell"><div v-for="item in row.geneCounts" :key="item.gene"><a :href="geneHref(item.gene)">{{ item.gene }}</a><small>{{ item.count }} identical</small></div></td>
                        <td class="pbs-identical-id"><a :href="variantHref(row)">{{ row.id }}</a></td>
                        <td class="pbs-gt-value">{{ row.referenceGt || 'Unavailable' }}</td><td class="pbs-gt-value">{{ row.candidateGt || 'Unavailable' }}</td>
                        <td>{{ row.consequence || 'Unavailable' }}</td><td class="pbs-shared-number">{{ frequency(row.af) }}</td>
                        <td :class="{'pbs-plp-text':isPathogenic(row.clinvar),'pbs-shared-muted':!row.clinvar}">{{ row.clinvar || 'Not annotated' }}</td>
                        <td><template v-if="row.score != null">{{ row.score.toFixed(2) }} <small class="pbs-score-source">{{ row.scoreSource === 'HC' ? 'LoFTEE HC' : 'AlphaMissense' }}</small></template><span v-else class="pbs-shared-muted">{{ row.scoreSource === 'varies' ? 'Varies by gene' : 'No score available' }}</span></td>
                    </tr><tr v-if="!model.identical.length"><td colspan="8">No identical variants in the processed dataset.</td></tr></tbody>
                </table>
            </div>
            <div class="pbs-comparison-pagination"><span>{{ range('identical') }} of {{ model.identical.length }} identical variants<span v-if="sorts.identical.key === 'sharedCount'"> · sorted by identical variants per gene</span></span><SamplePagination compact label="Identical variant pages" :page="pages.identical" :page-count="pageCount('identical')" @change="pages.identical=$event" /></div>
            <div class="pbs-shared-section-heading"><h5>Same gene, different variants · {{ model.differentGenes }} genes <SampleInfo label="Same gene, different variants" :text="differentHelp" /></h5><span>both samples have a variant in the gene, but not the same one</span></div>
            <div class="pbs-shared-scroll" role="region" aria-label="Different variants in shared genes table" tabindex="0">
                <table class="pbs-comparison-table pbs-different-table"><colgroup><col style="width:20%"/><col style="width:21%"/><col style="width:23%"/><col style="width:36%"/></colgroup>
                    <thead><tr><th :aria-sort="ariaSort('different','gene')"><button type="button" @click="sortBy('different','gene')">Gene <b-icon-arrow-down-up/></button></th>
                        <th :aria-sort="ariaSort('different','referenceCount')"><button type="button" @click="sortBy('different','referenceCount','desc')"><span class="pbs-sample-dot pbs-searched-dot"></span>Searched sample variants <b-icon-arrow-down-up/></button></th>
                        <th :aria-sort="ariaSort('different','candidateCount')"><button type="button" @click="sortBy('different','candidateCount','desc')"><span class="pbs-sample-dot pbs-compared-dot"></span>Comparison sample variants <b-icon-arrow-down-up/></button></th>
                        <th :aria-sort="ariaSort('different','plpOrder')"><span class="pbs-column-heading"><button type="button" @click="sortBy('different','plpOrder','desc')">ClinVar pathogenic / likely pathogenic <b-icon-arrow-down-up/></button><SampleInfo label="ClinVar in the two samples" :text="clinicalHelp" /></span></th>
                    </tr></thead><tbody><tr v-for="row in visibleDifferent" :key="row.gene"><td><a :href="geneHref(row.gene)">{{ row.gene }}</a></td><td class="pbs-shared-number">{{ row.referenceCount }}</td><td class="pbs-shared-number">{{ row.candidateCount }}</td><td><span :class="['pbs-plp-label','pbs-plp-'+row.plp]">{{ clinicalLabels[row.plp] }}</span></td></tr><tr v-if="!model.different.length"><td colspan="4">No shared genes with different variants only in the processed dataset.</td></tr></tbody>
                </table>
            </div>
            <div class="pbs-comparison-pagination"><span>{{ range('different') }} of {{ model.differentGenes }} genes</span><SamplePagination compact label="Different variant gene pages" :page="pages.different" :page-count="pageCount('different')" @change="pages.different=$event" /></div>
        </template>
    </div>
</template>
<script>
import SampleInfo from './SampleInfo';
import SamplePagination from './SamplePagination';
const {requestSampleEvidence}=require('./sampleEvidence');
const {buildSharedComparison,comparisonRows,visibleVariantRows,pathogenic}=require('./sharedComparison');
const help=require('./sampleHelp');
export default {
    components:{SampleInfo,SamplePagination},
    props:{referenceId:{type:String,required:true},candidateId:{type:String,required:true},expectedGenes:{type:Number,default:null}},
    data:()=>({loading:false,error:'',model:null,requestId:0,alive:true,pages:{identical:1,different:1},sorts:{identical:{key:'sharedCount',direction:'desc'},different:{key:'plpOrder',direction:'desc'}},
        identicalHelp:'Identical means the same GRCh38 chromosome, position, REF and ALT in both samples. Genotype (GT) may differ. Each variant is counted once even when it has multiple gene annotations. Gene subcounts cover the full comparison; merged gene cells cover only consecutive rows on this page. This is processed evidence, not genome-wide similarity.',
        differentHelp:'These shared genes have no identical variant. Counts are distinct variants per sample in each gene in the processed release. No extra gene expansion is needed; the gene name opens Gene2.',
        afHelp:'gnomAD exome allele frequency from the processed source field gnomade_af, not CRDC allele frequency. Missing frequency is unavailable, never zero. Missing values remain last in either sort direction. The source does not specify a gnomAD release here.',
        scoreHelp:help.inSilicoScore+' Missing scores are shown as No score available. If gene-specific annotations disagree, the score is Varies by gene rather than selecting a maximum.',
        clinicalHelp:'Pathogenic / likely pathogenic annotations recorded in the processed source. In both samples means different variants in this gene carry P/LP annotations in the two samples; it does not mean an identical variant. Conflicting classifications do not count as P/LP. None recorded means no P/LP annotation in the available records; Not annotated means no ClinVar annotation was supplied. Missing annotations do not prove absence from current ClinVar.',
        clinicalLabels:{both:'In both samples · different variants',reference:'Searched sample only',candidate:'Comparison sample only',none:'None recorded',unavailable:'Not annotated'}}),
    computed:{sortedIdentical(){return this.model?comparisonRows(this.model.identical,this.sorts.identical):[];},visibleIdentical(){return visibleVariantRows(this.sortedIdentical,this.pages.identical);},visibleDifferent(){return this.model?comparisonRows(this.model.different,this.sorts.different).slice((this.pages.different-1)*5,this.pages.different*5):[];}},
    created(){this.load();},beforeDestroy(){this.alive=false;this.requestId++;},
    watch:{referenceId(){this.load();},candidateId(){this.load();}},
    methods:{
        async load(){const id=++this.requestId;this.loading=true;this.error='';this.model=null;this.pages={identical:1,different:1};try{
            const [a,b]=await Promise.all([requestSampleEvidence('sample-variants',this.referenceId),requestSampleEvidence('sample-variants',this.candidateId)]);
            const model=buildSharedComparison(a,b,this.expectedGenes);if(this.alive&&id===this.requestId)this.model=model;
        }catch(e){if(this.alive&&id===this.requestId)this.error=e.message;}finally{if(this.alive&&id===this.requestId)this.loading=false;}},
        isPathogenic:pathogenic,active(group,key){return this.sorts[group].key===key;},
        ariaSort(group,key){return this.active(group,key)?(this.sorts[group].direction==='asc'?'ascending':'descending'):'none';},
        sortBy(group,key,first='asc'){this.sorts[group]={key,direction:this.active(group,key)?(this.sorts[group].direction==='asc'?'desc':'asc'):first};this.pages[group]=1;},
        pageCount(group){return Math.max(1,Math.ceil(this.model[group].length/5));},range(group){const n=this.model[group].length;return `${n?(this.pages[group]-1)*5+1:0}–${Math.min(this.pages[group]*5,n)}`;},
        frequency(value){if(value==null)return 'Unavailable';if(value===0)return '0';return value<.001?value.toExponential(2):Number(value.toPrecision(4)).toString();},
        geneHref(gene){return `/generesult.html?query=${encodeURIComponent(gene)}`;},variantHref(row){return `/variantresult.html?query=${encodeURIComponent(row.id)}&gene=${encodeURIComponent(row.genes[0])}`;},
    },
};
</script>
