import {pageNumbers} from './evidencePagination';
export const carrierTableMixin = {
    data:()=>({carrierTablePage:1,carrierTableSearch:'',carrierTableSort:'asc',carrierTableSortKey:'sample',carrierSortValues:{key:'',status:'idle',values:{},completed:0},carrierSortRevision:0}),
    computed: {
        carrierTablePageSize() {return 5;},
        expandedCarrierVariant() {return this.variantRows.find(row=>row.id===this.expandedVariantId)||null;},
        matchingCarrierSamples() {
            const query=this.carrierTableSearch.trim().toLowerCase();
            return [...((this.expandedCarrierVariant||{}).carrierSamples||[])].filter(sample=>!query||String(sample.id).toLowerCase().includes(query))
                .sort((a,b)=>{
                    const tie=String(a.id).localeCompare(String(b.id));
                    if(this.carrierTableSortKey==='sample')return tie*(this.carrierTableSort==='asc'?1:-1);
                    const av=this.carrierNumericSortValue(a),bv=this.carrierNumericSortValue(b);
                    if(av==null&&bv==null)return tie;
                    if(av==null)return 1;if(bv==null)return -1;
                    return (av-bv)*(this.carrierTableSort==='asc'?1:-1)||tie;
                });
        },
        carrierTablePageCount() {return Math.max(1,Math.ceil(this.matchingCarrierSamples.length/this.carrierTablePageSize));},
        carrierTableCurrentPage() {return Math.max(1,Math.min(this.carrierTablePage,this.carrierTablePageCount));},
        carrierTablePageNumbers() {return pageNumbers(this.carrierTableCurrentPage,this.carrierTablePageCount);},
        currentCarrierTableRows() {const start=(this.carrierTableCurrentPage-1)*this.carrierTablePageSize;return this.matchingCarrierSamples.slice(start,start+this.carrierTablePageSize);},
        carrierTableRange() {const count=this.matchingCarrierSamples.length;const from=count?(this.carrierTableCurrentPage-1)*this.carrierTablePageSize+1:0;return `${from.toLocaleString()}–${Math.min(from+this.carrierTablePageSize-1,count).toLocaleString()} of ${count.toLocaleString()}`;},
        carrierTableRequestKey() {return this.liveDataLoaded && this.expandedCarrierVariant?JSON.stringify([this.geneInfo.symbol,this.expandedVariantId,this.currentCarrierTableRows.map(row=>row.id)]):'';},
        carrierSortRequestKey() {
            return this.liveDataLoaded&&this.expandedCarrierVariant&&['age','hpoTerms'].includes(this.carrierTableSortKey)
                ?JSON.stringify([this.geneInfo.symbol,this.expandedVariantId,this.carrierTableSortKey,this.expandedCarrierVariant.carrierSamples.map(row=>row.id)]):'';
        },
    },
    watch: {
        expandedVariantId() {this.carrierTablePage=1;this.carrierTableSearch='';},
        carrierTableSearch() {this.carrierTablePage=1;},
        carrierTableSort() {this.carrierTablePage=1;},
        carrierTableSortKey() {this.carrierTablePage=1;},
        carrierSortRequestKey:{immediate:true,handler:'loadCarrierSortValues'},
        carrierTableRequestKey: {immediate:true,handler(key) {if(key)this.fetchVisibleCarrierSampleDetails(this.expandedVariantId);}},
    },
    beforeDestroy(){this.carrierSortRevision++;if(this._carrierSortAbort)this._carrierSortAbort.abort();},
    methods: {
        visibleCarrierRows(row) {return row.id===this.expandedVariantId?this.currentCarrierTableRows:(row.carrierSamples||[]).slice(0,this.carrierTablePageSize);},
        goToCarrierTablePage(value) {this.carrierTablePage=Math.max(1,Math.min(Number(value)||1,this.carrierTablePageCount));},
        toggleCarrierTableSort(key='sample') {
            this.carrierTableSort=this.carrierTableSortKey===key&&this.carrierTableSort==='asc'?'desc':'asc';
            this.carrierTableSortKey=key;this.carrierTablePage=1;
        },
        carrierSortIndicator(key){return this.carrierTableSortKey===key?(this.carrierTableSort==='asc'?'↑':'↓'):'↕';},
        carrierAriaSort(key){return this.carrierTableSortKey===key?(this.carrierTableSort==='asc'?'ascending':'descending'):'none';},
        carrierNumericSortValue(sample){
            let value=null;
            if(this.carrierTableSortKey==='rphers'){
                const state=this.currentCarrierScores;
                value=state&&state.status==='ready'?state.scores[String(sample.id).toLowerCase()]:null;
            }else if(this.carrierSortValues.key===this.carrierSortRequestKey&&this.carrierSortValues.status==='ready'){
                value=this.carrierSortValues.values[sample.id];
            }
            return typeof value==='number'&&Number.isFinite(value)?value:null;
        },
        async loadCarrierSortValues(key){
            const revision=++this.carrierSortRevision;
            if(this._carrierSortAbort)this._carrierSortAbort.abort();
            this.carrierSortValues={key,status:key?'loading':'idle',values:{},completed:0};
            if(!key)return;
            const [gene,variant,field,ids]=JSON.parse(key);
            const controller=new AbortController();this._carrierSortAbort=controller;
            const values={};let next=0,completed=0;
            try{
                await Promise.all(Array.from({length:Math.min(4,Math.ceil(ids.length/100))},async()=>{
                    while(next<ids.length){
                        const batch=ids.slice(next,next+100);next+=100;
                        const response=await fetch('/__gene_carrier_sort_values__',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({gene,variant,field,sample_ids:batch})});
                        if(!response.ok)throw new Error('Carrier sorting values are unavailable.');
                        const result=await response.json();
                        if(result.gene!==gene||result.variant!==variant||result.field!==field||!result.values||batch.some(id=>!Object.prototype.hasOwnProperty.call(result.values,id)||result.values[id]!==null&&(typeof result.values[id]!=='number'||!Number.isFinite(result.values[id]))))throw new Error('Carrier sorting values did not match the request.');
                        Object.assign(values,result.values);completed+=batch.length;
                        if(revision===this.carrierSortRevision)this.carrierSortValues.completed=completed;
                    }
                }));
                if(revision===this.carrierSortRevision&&key===this.carrierSortRequestKey)this.carrierSortValues={key,status:'ready',values,completed};
            }catch(_){
                controller.abort();
                if(revision===this.carrierSortRevision&&key===this.carrierSortRequestKey)this.carrierSortValues={key,status:'unavailable',values:{},completed};
            }
        },
        variantPageUrl(row) {return '/pb_variant.html?'+new URLSearchParams({query:row.id,gene:this.geneInfo.symbol}).toString();},
        carrierDisplayField(sample,field) {
            const value=this.carrierSampleField(sample,field);
            if(value==null||value===''||/^(?:Unavailable|Unknown|N\/?A|[-–—])$/i.test(String(value).trim())||field==='sex'&&String(value)==='0')return '—';
            if(field==='sex'&&/^(female|male)$/i.test(String(value)))return value.charAt(0).toUpperCase()+value.slice(1).toLowerCase();
            return value;
        },
    },
};
