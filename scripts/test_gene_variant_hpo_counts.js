const assert = require('node:assert/strict');
const register = require('./gene_variant_hpo_counts_endpoint');
let handler;
const a = 'chr1:100:A:G', b = 'chr1:200:C:T';
let lookups = 0;
register({post(path, ...callbacks) {handler = callbacks[callbacks.length - 1];}}, {
    accessToken: request => request.headers.session || '',
    carriersForGene: async () => ({byVariant: new Map([[a, new Set(['A','B','D','E','F'])], [b, new Set(['A','C'])]])}),
    sampleInfo: async id => {lookups++; return {hpoIds: {
        A:['HP:0001250','HP:0001252','HP:0000365'],
        B:['HP:0001250','HP:0001252'], C:null, D:['HP:0000365'], E:[], F:['HP:9999999'],
    }[id]};},
});
async function call(body, session = '') {
    const response = {code:200, set() {}, status(code) {this.code=code;return this;}, json(value) {this.value=value;}};
    await handler({body,headers:{session}},response);return response;
}
(async () => {
    const body = {gene:'TEST',variant_ids:[a,b,a],hpo_terms:['HP:0001250','HP:0001252','HP:0000365','HP:0001250']};
    const result = await call(body);
    assert.equal(result.code,200);
    assert.equal(result.value.match,'any');
    assert.deepEqual(result.value.variants[a],{count:3,metadataCount:5,carrierTotal:5,complete:true},
        '1/3, 2/3 and 3/3 matches each count once; empty and unrelated HPO lists do not count');
    assert.deepEqual(result.value.variants[b],{count:1,metadataCount:1,carrierTotal:2,complete:false});
    assert.equal(lookups,6,'Overlapping carriers are fetched once per profile request');
    await call(body);assert.equal(lookups,6,'Identical requests reuse the count result');
    await call(body,'different-session');assert.equal(lookups,12,'Different authorization scopes do not reuse results');
    const single = await call({...body,hpo_terms:['HP:0001250']});
    assert.equal(single.value.variants[a].count,2,'HPO presence is independent of residual score availability');
    const missing = await call({...body,variant_ids:[b],hpo_terms:['HP:9999999']});
    assert.equal(missing.value.variants[b].count,0);
    assert.equal(missing.value.variants[b].complete,false,'Missing metadata is not a confirmed HPO absence');
    assert.equal((await call({...body,variant_ids:['chr2:1:A:C']})).code,400);
    assert.equal((await call({...body,hpo_terms:['invalid']})).code,400);
    console.log('Recorded variant HPO counts: any-term matching, distinct carriers, empty/unrelated/missing metadata, sessions and validation PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
