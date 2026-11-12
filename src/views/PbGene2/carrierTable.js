import {pageNumbers} from './evidencePagination';
export const carrierTableMixin = {
    data:()=>({carrierTablePage:1,carrierTableSearch:'',carrierTableSort:'asc'}),
    computed: {
        carrierTablePageSize() {return 5;},
        expandedCarrierVariant() {return this.variantRows.find(row=>row.id===this.expandedVariantId)||null;},
        matchingCarrierSamples() {
            const query=this.carrierTableSearch.trim().toLowerCase();
            return [...((this.expandedCarrierVariant||{}).carrierSamples||[])].filter(sample=>!query||String(sample.id).toLowerCase().includes(query))
                .sort((a,b)=>String(a.id).localeCompare(String(b.id))*(this.carrierTableSort==='asc'?1:-1));
        },
        carrierTablePageCount() {return Math.max(1,Math.ceil(this.matchingCarrierSamples.length/this.carrierTablePageSize));},
        carrierTableCurrentPage() {return Math.max(1,Math.min(this.carrierTablePage,this.carrierTablePageCount));},
        carrierTablePageNumbers() {return pageNumbers(this.carrierTableCurrentPage,this.carrierTablePageCount);},
        currentCarrierTableRows() {const start=(this.carrierTableCurrentPage-1)*this.carrierTablePageSize;return this.matchingCarrierSamples.slice(start,start+this.carrierTablePageSize);},
        carrierTableRange() {const count=this.matchingCarrierSamples.length;const from=count?(this.carrierTableCurrentPage-1)*this.carrierTablePageSize+1:0;return `${from.toLocaleString()}–${Math.min(from+this.carrierTablePageSize-1,count).toLocaleString()} of ${count.toLocaleString()}`;},
        carrierTableRequestKey() {return this.liveDataLoaded && this.expandedCarrierVariant?JSON.stringify([this.geneInfo.symbol,this.expandedVariantId,this.currentCarrierTableRows.map(row=>row.id)]):'';},
    },
    watch: {
        expandedVariantId() {this.carrierTablePage=1;this.carrierTableSearch='';},
        carrierTableSearch() {this.carrierTablePage=1;},
        carrierTableSort() {this.carrierTablePage=1;},
        carrierTableRequestKey: {immediate:true,handler(key) {if(key)this.fetchVisibleCarrierSampleDetails(this.expandedVariantId);}},
    },
    methods: {
        visibleCarrierRows(row) {return row.id===this.expandedVariantId?this.currentCarrierTableRows:(row.carrierSamples||[]).slice(0,this.carrierTablePageSize);},
        goToCarrierTablePage(value) {this.carrierTablePage=Math.max(1,Math.min(Number(value)||1,this.carrierTablePageCount));},
        toggleCarrierTableSort() {this.carrierTableSort=this.carrierTableSort==='asc'?'desc':'asc';},
        variantPageUrl(row) {return '/pb_variant.html?'+new URLSearchParams({query:row.id,gene:this.geneInfo.symbol}).toString();},
        carrierDisplayField(sample,field) {
            const value=this.carrierSampleField(sample,field);
            if(value==null||value===''||/^(?:Unavailable|Unknown|N\/?A|[-–—])$/i.test(String(value).trim())||field==='sex'&&String(value)==='0')return '—';
            if(field==='sex'&&/^(female|male)$/i.test(String(value)))return value.charAt(0).toUpperCase()+value.slice(1).toLowerCase();
            return value;
        },
    },
};
