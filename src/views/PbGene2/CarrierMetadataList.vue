<template>
    <details v-if="items.length" class="pg2-carrier-metadata-list">
        <summary>{{ kind === 'hpo' ? 'View terms' : 'View genes' }} <b-icon-chevron-right aria-hidden="true" /></summary>
        <div class="pg2-carrier-list-content"><input v-if="items.length > 20" v-model="search" type="search" :aria-label="kind === 'hpo' ? 'Find a carrier HPO term' : 'Find a carrier co-gene'" placeholder="Search" /><ul><li v-for="item in visibleItems" :key="item"><a :href="itemUrl(item)">{{ kind === 'hpo' ? termLabel(item) + ' · ' + item : item }}</a></li></ul><button v-if="visibleItems.length < filteredItems.length" type="button" class="pg2-text-button" @click="limit += 20">Show 20 more</button><span v-if="!filteredItems.length" class="pg2-muted">No matches</span></div>
    </details>
    <span v-else :class="{ 'pg2-muted': emptyLabel !== 'None' }">{{ emptyLabel }}</span>
</template>
<script>
import {hpoLabel} from '../PbGene/hpoContextSearch';
export default {
    name: 'Gene2CarrierMetadataList',
    props: {value: {type:[String,Array],default:null}, kind: {type:String,required:true}, gene: {type:String,default:''}},
    data:()=>({search:'',limit:20}),
    computed: {
        items() {
            const raw = this.value;
            if (raw == null || !Array.isArray(raw) && /^(?:Unavailable|Unknown|None|N\/?A|Loading.*|[-–—])$/i.test(String(raw).trim())) return [];
            if (this.kind === 'hpo') {
                const text = Array.isArray(raw) ? raw.map(item=>typeof item === 'string' ? item : item && (item.hpo_id || item.hpoId || item.id) || '').join(',') : String(raw);
                return [...new Set(text.toUpperCase().match(/HP:\d{7}/g) || [])];
            }
            const genes = Array.isArray(raw) ? raw : String(raw).split(/[,;|\s]+/);
            return [...new Set(genes.filter(item=>typeof item === 'string' && /^[A-Z0-9.-]{1,40}$/i.test(item)).map(item=>item.toUpperCase()))].filter(item=>item!==this.gene.toUpperCase());
        },
        filteredItems() {const query=this.search.trim().toLowerCase();return this.items.filter(item=>!query || `${item} ${this.kind==='hpo'?hpoLabel(item):''}`.toLowerCase().includes(query));},
        visibleItems() {return this.filteredItems.slice(0,this.limit);},
        emptyLabel() {return /^loading/i.test(String(this.value||'')) ? 'Loading…' : this.value == null || /^(?:Unavailable|Unknown|N\/?A|[-–—])$/i.test(String(this.value).trim()) ? 'Unavailable' : 'None';},
    },
    watch: {search() {this.limit=20;}, value() {this.search='';this.limit=20;}},
    methods: {termLabel:hpoLabel,itemUrl(item) {return (this.kind==='hpo'?'/pb_phenotype.html?query=':'/pb_gene2.html?query=')+encodeURIComponent(item);}},
};
</script>
