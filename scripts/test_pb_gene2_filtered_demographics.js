const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const Vue = require('vue');

const pending = [];
const filename = require('node:path').resolve(__dirname, '../src/views/PbGene2/filteredCarrierDemographics.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {filename, babelrc:false, configFile:false, plugins:['@babel/plugin-transform-modules-commonjs']}).code;
const exportsObject = {};
vm.runInNewContext(code, {exports:exportsObject, setTimeout, clearTimeout, fetch:(url, options) => new Promise(resolve => pending.push({url, body:JSON.parse(options.body), resolve}))});
const mixin = exportsObject.filteredCarrierDemographicsMixin;
const a = {id:'chr1:1:A:G',carrierSamples:[{id:'A'},{id:'B'}]};
const b = {id:'chr1:2:C:T',carrierSamples:[{id:'B'},{id:'C'}]};
const geneSummary = {status:'ready',carrierTotal:3,matchedMetadataCount:3,geneCarrierDemographics:{byProject:[{project:'All projects',count:3}]}};
const ready = (count, label) => ({ok:true,json:async()=>({status:'ready',carrierTotal:count,matchedMetadataCount:count,geneCarrierDemographics:{byProject:[{project:label,count}]}})});

(async () => {
    const page = new Vue({mixins:[mixin],data:()=>({geneInfo:{symbol:'TEST'},variantFiltersActive:false,variantIdentifierIds:null,matchingVariantRows:[a,b],geneCarrierSummary:geneSummary,totalGeneCarriers:3,carrierSummaryProgress:{},carrierSummaryErrors:{},variantPage:1})});
    assert.equal(page.displayedCarrierSummary, page.geneCarrierSummary);
    page.variantFiltersActive = true;
    page.matchingVariantRows = [a];
    await Vue.nextTick();
    clearTimeout(page._selectedCarrierTimer);
    assert.equal(page.displayedCarrierSummary,null,'Changing selection clears the previous demographic scope immediately');
    assert.equal(page.displayedCarrierCount,2);
    const first = page.loadSelectedCarrierDemographics(page.selectedCarrierKey,page.selectedCarrierRevision);
    const firstRequest = pending.shift();
    assert.equal(firstRequest.url,'/__gene_carrier_demographics__');
    assert.deepEqual(firstRequest.body,{gene:'TEST',variant_ids:[a.id]});
    firstRequest.resolve(ready(2,'Project A'));
    await first;
    assert.equal(page.displayedCarrierSummary.geneCarrierDemographics.byProject[0].project,'Project A');

    // Resolve a previous request after a newer selection: it must not replace the current scope.
    page.matchingVariantRows = [b];
    await Vue.nextTick(); clearTimeout(page._selectedCarrierTimer);
    const stale = page.loadSelectedCarrierDemographics(page.selectedCarrierKey,page.selectedCarrierRevision);
    const staleRequest = pending.shift();
    page.matchingVariantRows = [a,b];
    await Vue.nextTick(); clearTimeout(page._selectedCarrierTimer);
    assert.equal(page.displayedCarrierCount,3,'Carriers shared by two variants are deduplicated before the server result');
    const latest = page.loadSelectedCarrierDemographics(page.selectedCarrierKey,page.selectedCarrierRevision);
    const latestRequest = pending.shift();
    latestRequest.resolve(ready(3,'Current selection'));
    await latest;
    staleRequest.resolve(ready(2,'Stale selection'));
    await stale;
    assert.equal(page.displayedCarrierCount,3);
    assert.equal(page.displayedCarrierSummary.geneCarrierDemographics.byProject[0].project,'Current selection');
    const revision=page.selectedCarrierRevision;
    page.matchingVariantRows=[b,a]; page.variantPage=2;
    await Vue.nextTick();
    assert.equal(page.selectedCarrierRevision,revision,'Sorting or paging the same variants does not reload demographics');

    page.matchingVariantRows=[b];
    await Vue.nextTick(); clearTimeout(page._selectedCarrierTimer);
    const clearing=page.loadSelectedCarrierDemographics(page.selectedCarrierKey,page.selectedCarrierRevision);
    const clearingRequest=pending.shift();
    page.variantFiltersActive=false;
    await Vue.nextTick();
    assert.equal(page.displayedCarrierSummary,page.geneCarrierSummary,'Clearing filters restores the gene-wide demographics');
    clearingRequest.resolve(ready(2,'Late result after clear'));
    await clearing;
    assert.equal(page.displayedCarrierSummary,page.geneCarrierSummary);

    page.variantIdentifierIds=[b.id];
    await Vue.nextTick(); clearTimeout(page._selectedCarrierTimer);
    assert.equal(page.carrierSelectionActive,true,'Identifier search scopes demographics as well');
    page.matchingVariantRows=[];
    await Vue.nextTick();
    assert.equal(page.displayedCarrierCount,0);
    assert.equal(page.displayedCarrierSummary.status,'ready');
    assert.deepEqual(Object.keys(page.displayedCarrierSummary.geneCarrierDemographics),[]);
    assert.equal(pending.length,0,'An empty selection does not request an unrelated gene-wide summary');
    page.$destroy();
    console.log('Gene2 selected-carrier demographics: deduplication, scope, empty selection, sorting/paging and stale responses PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
