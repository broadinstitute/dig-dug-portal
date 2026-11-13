const assert = require('node:assert/strict');
const register = require('./gene_carrier_summary_endpoint');
const originalFetch = global.fetch;
const routes = {};
let calls = 0;
global.fetch = async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/gene-variants-crdc')) return {ok:true,json:async()=>({data:[{chromosome:'1',position:100,reference:'A',alt:'G',samples:['A','B']}]})};
    if (parsed.pathname.endsWith('/samples-info')) {
        calls++;
        const id = parsed.searchParams.get('q');
        return {ok:true,json:async()=>({data:[{SampleInVCF:id,age:10,sex:'F',genes:['TEST','OTHER'],phenotypes:id==='A'?[{hpo_id:'HP:0001250',is_observed:true},{hpo_id:'HP:0001256',is_observed:false}]:[]}]})};
    }
    throw new Error('Unexpected upstream route');
};
register({get(route,handler){routes[route]=handler;},post(route,...handlers){routes[route]=handlers.at(-1);}},'http://test.local',{diskCache:false,
    readHpoCounts:()=>({counts:{A:7},source:{matrix:'approved.tsv.gz',sha256:'a'.repeat(64)}})});
const body={gene:'TEST',variant:'chr1:100:A:G',sample_ids:['A','B']};
async function call(data, session='') {
    let status=200;
    return new Promise(resolve=>routes['/__pb_variant_carrier_metadata__']({body:data,headers:{cookie:session?`session=${session}`:''}}, {
        set(){},status(code){status=code;return this;},json(data){resolve({status,data});},
    }));
}
(async()=>{
    const cold=await call(body);
    assert.equal(cold.status,200);assert.equal(calls,2);
    assert.deepEqual(cold.data.metadata.A.observedHpoIds,['HP:0001250'],'negative HPO terms must not enter the observed hierarchy');
    assert.equal(cold.data.metadata.A.hpoIds.length,2,'phenotype data presence remains separate from observed-positive terms');
    assert.deepEqual(cold.data.metadata.B.hpoIds,[]);
    assert.equal(cold.data.metadata.A.n_terms,7,'use the scoring matrix count, not metadata HPO list length');
    assert.equal(cold.data.metadata.A.n_terms_status,'scoring_matrix');
    assert.equal(cold.data.metadata.B.n_terms,0,'known empty metadata remains zero outside the scoring roster');
    assert.equal(cold.data.metadata.B.n_terms_status,'empty_phenotype_record');
    assert.equal(cold.data.n_terms_source.matrix,'approved.tsv.gz');
    const warm=await call(body);
    assert.deepEqual(warm,cold);assert.equal(calls,2,'Variant must reuse Gene cached metadata without new upstream lookups');
    assert.equal((await call({...body,sample_ids:['OUTSIDE']})).status,400,'only exact-variant carrier metadata may be returned');
    assert.equal((await call({...body,sample_ids:Array(101).fill('A')})).status,400);
    assert.equal(calls,2);
    await call(body,'another-session');assert.equal(calls,4,'authorization scopes must not share metadata');
    console.log('PB_VARIANT_METADATA_BATCH_CACHE_AND_SCOPE_PASS');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.fetch=originalFetch;});
