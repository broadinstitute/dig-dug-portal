<template>
    <section class="pg2-expanded-section pg2-annotation" aria-label="Variant annotation">
        <div class="pg2-expanded-heading"><h3>Variant annotation <help-tooltip label="Variant annotation" :text="sources.annotation.text" :links="sources.annotation.links" /><a class="pg2-variant-page-arrow" :href="variantUrl" aria-label="Open this variant in Variant page" title="Open Variant page"><b-icon-arrow-up-right aria-hidden="true" /></a></h3><help-tooltip v-if="warning" class="pg2-annotation-warning" label="Allele frequency review" :text="warning" /></div>
        <div class="pg2-annotation-columns">
            <dl v-for="(column,index) in columns" :key="index" class="pg2-annotation-list">
                <div v-for="item in column" :key="item.label" class="pg2-annotation-row" :class="{ 'pg2-annotation-group-start': item.groupStart }">
                    <dt>{{ item.displayLabel }} <help-tooltip v-if="item.help" :label="'About ' + item.displayLabel" :text="item.source ? item.source.text : item.help" :links="item.source ? item.source.links : []" /><small v-if="item.variantScore" class="pg2-annotation-score-source">(variant score)</small></dt>
                    <dd :class="[{ 'pg2-muted': !present(item.value), 'pg2-annotation-clinvar': item.label === 'ClinVar' && present(item.value) }, item.label === 'ClinVar' ? clinvarTone(item.value) : '']"><a v-if="item.href && present(item.value)" :href="item.href" target="_blank" rel="noopener noreferrer">{{ item.value }} <b-icon-arrow-up-right aria-hidden="true" /></a><span v-else :class="{ 'pg2-annotation-marker': item.highlight && present(item.value) }">{{ present(item.value) ? item.value : 'Unavailable' }}</span></dd>
                </div>
            </dl>
        </div>
    </section>
</template>
<script>
import HelpTooltip from './HelpTooltip';
import help from './evidenceHelp';
import { VARIANT_ANNOTATION_SOURCES } from './referenceProvenance';
import { query } from '@/utils/bioIndexUtils';
import { buildTranscriptIdentity, canonicalVariantId, resolveVariantReference, gnomadVariantHref, splitHgvs } from '../PbVariant/variantIdentifiers';
const transcriptCache = new Map();
const { clinvarDisplayLabel } = require('../../utils/clinvarLabels');
export default {
    name: 'Gene2VariantAnnotation',
    components: {HelpTooltip},
    props: {
        items: {type:Array,required:true}, variantUrl: {type:String,required:true}, warning: {type:String,default:''},
        variant: {type:Object,default:()=>({})}, geneInfo: {type:Object,default:()=>({})},
    },
    data: () => ({help, sources: VARIANT_ANNOTATION_SOURCES, transcriptRows: [], transcriptStatus: 'idle', transcriptRevision: 0}),
    watch: { annotationKey: {immediate:true,handler:'loadTranscriptRows'} },
    beforeDestroy() { this.transcriptRevision++; },
    computed: {
        annotationKey() { return this.variant.id ? canonicalVariantId(this.variant.id) : ''; },
        transcriptIdentity() { return buildTranscriptIdentity(this.transcriptRows, this.geneInfo); },
        scoreSource() {
            const loftee = this.items.find(item=>/^loftee$/i.test(item.label));
            if (loftee && String(loftee.value).trim().toUpperCase() === 'HC') return 'LOFTEE';
            const am = this.items.find(item=>item.label === 'AlphaMissense');
            return am && this.present(am.value) && Number.isFinite(Number(am.value)) ? 'AlphaMissense' : '';
        },
        columns() {
            const pick = label => this.items.find(item => item.label.toLowerCase() === label.toLowerCase()) || {label,value:null};
            const transcript = this.transcriptIdentity;
            const missingTranscript = this.transcriptStatus === 'loading' ? 'Loading…' : null;
            const reference = resolveVariantReference(this.variant.id);
            const rsid = transcript.rsid || (Array.isArray(this.variant.rsids) ? this.variant.rsids : []).find(id=>/^rs\d+$/i.test(id)) || (reference && reference.assembly === 'GRCh38' && reference.rsid) || null;
            const frequency = this.items.find(item => /^CRDC /i.test(item.label)) || {label:'CRDC AF',value:null};
            const left = [
                {label:'rsID (dbSNP)',value:rsid || missingTranscript,href:rsid ? `https://www.ncbi.nlm.nih.gov/snp/${rsid}` : null},
                {label:'HGVSc',value:transcript.hgvsc || pick('HGVS.c').value || splitHgvs(this.variant.hgvsc).notation || missingTranscript},
                {label:'HGVSp',value:transcript.hgvsp || pick('HGVS.p').value || splitHgvs(this.variant.hgvsp).notation || missingTranscript},
                {label:'NCBI RefSeq transcript',value:transcript.refseqTranscript || missingTranscript},
                {label:'Ensembl transcript',value:transcript.ensemblTranscript || missingTranscript},
                {label:'Ensembl protein',value:transcript.ensemblProtein || missingTranscript},
            ];
            const right = [
                {label:'Consequence',value:this.variant.consequence,source:this.sources.consequence,help:this.sources.consequence.text},
                pick('ClinVar'), {...frequency,groupStart:true,highlight:true},
                {...pick('gnomAD AF'),href:gnomadVariantHref(this.variant.id) || pick('gnomAD AF').href},
                {...pick('LOFTEE'),groupStart:true}, pick('AlphaMissense'), pick('REVEL'),
            ];
            return [left,right].map(column=>column.map(item=>{
                const variantScore = item.label === this.scoreSource;
                const source = item.source || ({ClinVar:this.sources.clinvar,AlphaMissense:this.sources.alphaMissense,REVEL:this.sources.revel,LOFTEE:this.sources.loftee,'gnomAD AF':this.sources.gnomadAF})[item.label];
                return {...item,source,variantScore,highlight:item.highlight || variantScore,
                    value:item.label === 'ClinVar' ? clinvarDisplayLabel(item.value) : item.label === 'LOFTEE' && variantScore ? `${item.value} = 1.00` : item.value,
                    displayLabel: /^CRDC /i.test(item.label) && !/carrier/i.test(item.label) ? 'CRDC AF' : item.label === 'LOFTEE' ? 'LoFTEE' : item.label,
                    help:item.help || (/^CRDC /i.test(item.label) ? /carrier/i.test(item.label) ? help.carrierFrequency : help.crdcAF : source && source.text),
                };
            }));
        },
    },
    methods: {
        present(value) {return value != null && !/^(?:\s*|Unavailable|Unknown|N\/?A|[-–—])$/i.test(String(value).trim());},
        clinvarTone(value) {
            const text = String(value || '').toLowerCase();
            return /conflict|uncertain/.test(text) ? 'is-uncertain' : /pathogenic/.test(text) ? 'is-pathogenic' : /benign/.test(text) ? 'is-benign' : 'is-other';
        },
        async loadTranscriptRows(key) {
            const revision = ++this.transcriptRevision;
            this.transcriptRows = [];
            this.transcriptStatus = key ? 'loading' : 'idle';
            if (!key) return;
            try {
                if (!transcriptCache.has(key)) {
                    const pending = query('transcript-consequences', key, {}, true).then(rows=>Object.freeze(rows || [])).catch(error=>{transcriptCache.delete(key);throw error;});
                    transcriptCache.set(key,pending);
                    if (transcriptCache.size > 32) transcriptCache.delete(transcriptCache.keys().next().value);
                }
                const rows = await transcriptCache.get(key);
                if (revision !== this.transcriptRevision || key !== this.annotationKey) return;
                this.transcriptRows = rows;
                this.transcriptStatus = 'ready';
            } catch (_) {
                if (revision === this.transcriptRevision && key === this.annotationKey) this.transcriptStatus = 'unavailable';
            }
        },
    },
};
</script>
