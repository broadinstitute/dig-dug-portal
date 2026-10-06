const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const babel = require(path.join(root, 'node_modules/@babel/core'));
const compiler = require(path.join(root, 'node_modules/vue-template-compiler'));
const reference = fs.readFileSync(path.join(root, 'src/views/KrClinicalFocus/clinicalContextReference.generated.js'), 'utf8');
const hpoTerms = JSON.parse(reference.split('\n')[1].replace('export const hpoTerms = ', '').replace(/;$/, ''));
function load(relative, imports = {}, fetch) {
    const filename = path.join(root, relative);
    let source = fs.readFileSync(filename, 'utf8');
    if (relative.endsWith('.vue')) {
        const parsed = compiler.parseComponent(source);
        assert.deepEqual(compiler.compile(parsed.template.content).errors, []);
        source = parsed.script.content;
    }
    const code = babel.transformSync(source, { filename, babelrc:false, configFile:false, plugins:['@babel/plugin-transform-modules-commonjs'] }).code;
    const exports = {};
    vm.runInNewContext(code, { exports, require: name => imports[name] || {}, fetch, window:{location:{search:''}}, URLSearchParams, process:{env:{}} });
    return exports;
}
const helper = load('src/views/PbGene/hpoContextSearch.js', {
    '../KrClinicalFocus/clinicalContextReference.generated': {hpoTerms},
    '../PbFront/searchModel': require(path.join(root,'src/views/PbFront/searchModel.js')),
});
const array = value => Array.from(value);
assert.deepEqual(array(helper.resolveHpoTerms('Seizure, low muscle tone; HP:0001250')), ['HP:0001250','HP:0001252']);
assert.deepEqual(array(helper.resolveHpoTerms('hp:0011880 hp:0011874,HP:0033565,')), ['HP:0011880','HP:0011874','HP:0033565']);
assert.equal(helper.hpoSuggestions('seizure')[0].id, 'HP:0001250');
assert.ok(helper.hpoSuggestions('developmental delay').some(term => term.id === 'HP:0001263'));
assert.equal(helper.selectHpoSuggestion('HP:0001250, muscle tone', 'HP:0001252'), 'HP:0001250, HP:0001252, ');
assert.throws(() => helper.resolveHpoTerms('random nonsense'), /Select an HPO suggestion/);
assert.throws(() => helper.resolveHpoTerms('HP:123'), /not a valid HPO ID/);
const component = load('src/views/PbGene/HpoTermInput.vue', {'./hpoContextSearch': helper}).default;
const emissions = [];
component.methods.choose.call({value:'HP:0001250, low muscle', $emit:(event,value)=>emissions.push(value)}, {id:'HP:0001252'});
assert.equal(emissions[0], 'HP:0001250, HP:0001252, ');
let prevented = false;
let chosen;
component.methods.onEnter.call({open:true, active:1, suggestions:[{id:'a'},{id:'b'}], choose:term=>chosen=term.id}, {preventDefault:()=>prevented=true});
assert.equal(chosen,'b'); assert.equal(prevented,true);
async function main() {
    const bad = () => ({ok:false,status:400,json:async()=>({error:'invalid_request',detail:'missing query HPO columns: HP:0011874, HP:0011880, HP:0033565'})});
    const message = await helper.contextApiError(bad());
    assert.match(message, /These phenotypes are not in our cohort HPO list/);
    assert.match(message, /HP:0033565/);
    const failure = await helper.contextApiFailure(bad());
    assert.deepEqual(array(failure.missingTerms), ['HP:0011874', 'HP:0011880', 'HP:0033565']);
    assert.equal(failure.message, message);
    assert.equal(await helper.contextApiError({status:502,json:async()=>{throw Error();}}),'HPO analysis returned 502.');
    let privateSent;
    const pb = load('src/views/PbGene/pageModel.js', {'./hpoContextSearch':helper}, async(url, options)=>{ privateSent=JSON.parse(options.body); return bad(); });
    const privateState = {contextInput:'HP:0011880,HP:0011874,HP:0033565', contextSignificanceThreshold:.05, contextMinCarriers:10, contextSignificanceMetric:'p_value', contextScoreType:'sum', contextAnalysisSet:'affected', geneInfo:{symbol:'ADCY10'}};
    await pb.pbGeneMethods.runContextAnalysis.call(privateState);
    assert.equal(privateState.contextError,message);
    assert.equal(privateState.contextLoading,false);
    assert.equal(privateSent.score_type, 'sum');
    assert.equal(privateSent.affected_only, true);
    let sent;
    const pub = load('src/views/PublicGene/pageModel.js', {'../PbGene/hpoContextSearch':helper}, async(url, options)=>{ sent=JSON.parse(options.body); return bad(); });
    const publicState = {publicContextInput:'HP:0011880,HP:0011874,HP:0033565',publicContextScoreType:'sum',publicContextAnalysisSet:'affected',geneInfo:{symbol:'ADCY10'},variantRows:[]};
    await pub.selectPublicHpoContext.call(publicState);
    assert.equal(publicState.publicContextError,message);
    assert.equal(sent.score_type, 'sum');
    assert.equal(sent.affected_only, true);
    publicState.publicContextInput='Seizure, low muscle tone';
    await pub.selectPublicHpoContext.call(publicState);
    assert.deepEqual(sent.terms,['HP:0001250','HP:0001252']);
    console.log('HPO_CONTEXT_SEARCH_AND_PB_PUBLIC_ERRORS_PASS; ontology terms:', hpoTerms.length);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
