<template>
    <section class="pg2-expanded-section pg2-annotation" aria-label="Variant annotation">
        <div class="pg2-expanded-heading"><h3>Variant annotation <help-tooltip label="Variant annotation" :text="sources.annotation.text" :links="sources.annotation.links" /><a class="pg2-variant-page-arrow" :href="variantUrl" aria-label="Open this variant in Variant page" title="Open Variant page"><b-icon-arrow-up-right aria-hidden="true" /></a></h3><help-tooltip v-if="warning" class="pg2-annotation-warning" label="Allele frequency review" :text="warning" /></div>
        <div class="pg2-annotation-columns">
            <dl v-for="(column,index) in columns" :key="index" class="pg2-annotation-list">
                <div v-for="item in column" :key="item.label" class="pg2-annotation-row"><dt>{{ item.displayLabel }} <help-tooltip v-if="item.help" :label="'About ' + item.displayLabel" :text="item.source ? item.source.text : item.help" :links="item.source ? item.source.links : []" /></dt><dd :class="{ 'pg2-muted': !present(item.value) }"><a v-if="item.href && present(item.value)" :href="item.href" target="_blank" rel="noopener noreferrer">{{ item.value }} <b-icon-box-arrow-up-right aria-hidden="true" /></a><span v-else>{{ present(item.value) ? item.value : '—' }}</span></dd></div>
            </dl>
        </div>
    </section>
</template>
<script>
import HelpTooltip from './HelpTooltip';
import help from './evidenceHelp';
import { VARIANT_ANNOTATION_SOURCES } from './referenceProvenance';
export default {
    name: 'Gene2VariantAnnotation',
    components: {HelpTooltip},
    props: {items: {type:Array,required:true}, variantUrl: {type:String,required:true}, warning: {type:String,default:''}},
    data: () => ({help, sources: VARIANT_ANNOTATION_SOURCES}),
    computed: {
        columns() {
            const pick = label => this.items.find(item => item.label.toLowerCase() === label.toLowerCase()) || {label,value:null};
            const frequency = this.items.find(item => /^CRDC /i.test(item.label)) || {label:'CRDC AF',value:null};
            return [[pick('HGVS.c'),pick('HGVS.p'),pick('ClinVar'),frequency], [pick('AlphaMissense'),pick('REVEL'),pick('LOFTEE'),pick('gnomAD AF')]].map(column=>column.map(item=>({...item,
                source: ({ClinVar:this.sources.clinvar,AlphaMissense:this.sources.alphaMissense,REVEL:this.sources.revel,LOFTEE:this.sources.loftee,'gnomAD AF':this.sources.gnomadAF})[item.label],
                displayLabel: /^CRDC /i.test(item.label) && !/carrier/i.test(item.label) ? 'CRDC AF' : item.label === 'LOFTEE' ? 'LoFTEE' : item.label,
                help: /^CRDC /i.test(item.label) ? /carrier/i.test(item.label) ? help.carrierFrequency : help.crdcAF : ({ClinVar:help.clinvarAnnotation,AlphaMissense:help.alphaMissense,REVEL:help.revel,LOFTEE:help.loftee,'gnomAD AF':help.gnomadAF})[item.label],
            })));
        },
    },
    methods: {present(value) {return value != null && !/^(?:\s*|Unavailable|Unknown|N\/?A|[-–—])$/i.test(String(value).trim());}},
};
</script>
