const assert = require('node:assert/strict');
const register = require('./gene_carrier_summary_endpoint');
const originalFetch = global.fetch;
const a = 'chr1:10:C:T', b = 'chr1:20:C:T', c = 'chr1:30:C:T';
const handlers = {};
let qualityCalls = 0, bad = false;
const app = {get(path, cb) {handlers[path] = cb;}, post(path, ...cbs) {handlers[path] = cbs.at(-1);}};
global.fetch = async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('gene-variants-crdc') && parsed.searchParams.get('q') === 'EMPTY') {
        return {ok:true,json:async()=>({data:[]})};
    }
    if (parsed.pathname.endsWith('gene-variants-crdc')) return {ok:true,json:async()=>({data:[
        {chromosome:'1',position:10,reference:'C',alt:'T',af:.5,samples:['A_E38','LOW_E38']},
        {chromosome:'1',position:20,reference:'C',alt:'T',af:.005,samples:['A_E38','B_E38']},
        {chromosome:'1',position:30,reference:'C',alt:'T',af:.005,samples:['C_E38']},
    ]})};
    if (parsed.pathname.endsWith('samples-info')) return {ok:true,json:async()=>({data:[{SampleInVCF:parsed.searchParams.get('q'),gender:'female'}]})};
    throw Error('Unexpected request');
};
register(app, 'http://bio.test', {diskCache:false,readVariantQuality:async () => {
    qualityCalls++;
    if (bad) throw Error('VCF offline');
    return {min_depth:20,max_af_exclusive:.01,source:{kind:'original_vcf_dp20_af001'},variants:[
        {variant_id:a,sample_ids:['A_G38'],ac:1,an:200,af:.005},
        {variant_id:b,sample_ids:['A_G38','B_G38'],ac:2,an:400,af:.005},
        {variant_id:c,sample_ids:[],ac:2,an:200,af:.01},
    ]};
}});
function call(path, query, body, token='') {
    return new Promise(resolve => handlers[path]({query,body,headers:{cookie:token ? 'session='+token : ''}}, {
        code:200,set(){},status(code){this.code=code;return this;},json(data){resolve({code:this.code,data});},
    }));
}
async function summary(quality, gene = 'TEST') {
    for (let i=0;i<100;i++) {
        const result=await call('/__gene_carrier_summary__',{gene,quality});
        if (result.data.status==='ready') return result.data;
        if (result.data.status==='error') throw Error(result.data.error);
        await new Promise(resolve=>setTimeout(resolve,5));
    }
    throw Error('Summary timeout');
}
(async()=>{
    const result=await call('/__gene_qualified_variants__',{gene:'TEST'});
    assert.equal(result.code,200);
    assert.deepEqual(result.data.variantRows.map(row=>row.samples),[['A_E38'],['A_E38','B_E38']]);
    assert.equal(result.data.variantRows[0].af,.005,'Use DP20 AF from the VCF, rather than the old unfiltered AF');
    assert.equal((await summary('dp20_af001')).carrierTotal,2,'One person with two variants counts once');
    assert.equal((await summary('')).carrierTotal,4,'Legacy and qualified source caches remain separate');
    const hpos=await call('/__gene_variant_hpo_counts__',{}, {gene:'TEST',variant_ids:[a,b],hpo_terms:['HP:0001250'],quality:'dp20_af001'});
    assert.equal(hpos.data.variants[a].carrierTotal,1,'HPO reference counts use the same DP20 membership');
    bad=true;
    const empty=await call('/__gene_qualified_variants__',{gene:'EMPTY'});
    assert.equal(empty.code,200,'A successful empty BioIndex lookup does not require the VCF service');
    assert.equal(empty.data.status,'no_source_variants');
    assert.deepEqual(empty.data.variantRows,[]);
    assert.equal((await summary('dp20_af001', 'EMPTY')).carrierTotal,0);
    const failed=await call('/__gene_qualified_variants__',{gene:'TEST'},null,'new-scope');
    assert.equal(failed.code,502,'A VCF failure cannot fall back to unfiltered carrier statistics');
    assert.equal(qualityCalls,2,'Authorization scopes never reuse another scope’s membership');
    console.log('Gene VCF quality endpoint: depth membership, AF, person union, scoped summaries/HPO and failure isolation PASS');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.fetch=originalFetch;});
