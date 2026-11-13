const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const source = require('./processed_genotype_source');
const register = require('./gene_genotype_endpoint');
const { applyCarrierGenotypes } = require('../src/views/PbGene/carrierGenotypes');
const { sampleVariantRows } = require('../src/views/PbSample/sampleEvidence');

(async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pb-gt-test-'));
    try {
        const bytes = zlib.gzipSync(JSON.stringify([
            ['A', 'chr1:100:A:G', '0/1'], ['A', 'chr1:200:C:T', '1|1'],
            ['B', 'chr1:100:A:G', '0/2'], ['C', 'chr1:100:A:G', '1'],
            ['OUTSIDE', 'chr1:100:A:G', '1/1'],
            ['CONFLICT', 'chr1:100:A:G', '0/1'], ['CONFLICT', 'chr1:100:A:G', '1/1'],
            ['MISSING', 'chr1:100:A:G', './.'],
        ]));
        const hash = crypto.createHash('sha256').update(bytes).digest('hex');
        const filename = `genotypes-${hash}.bin`;
        await fs.writeFile(path.join(directory, filename), bytes);
        await fs.writeFile(path.join(directory, 'manifest.json'), JSON.stringify({format:1,
            source_sha256:'e602b847ccdba8961f788701b43004514346490f55164dd3023be23aa7c6bbc7',
            source_file:'sample_variant_gene.jsonl.gz', data_version:'2025_crdc_16366_dp20_af001_20260907',
            packed_file:filename, packed_sha256:hash, genes:{TEST:[0,bytes.length,8]}}));
        const readGenotypes = source(directory);
        const indexed = await readGenotypes('TEST');
        assert.equal(indexed.calls.get(source.callKey('1:100:A:G','A_E38')).gt,'0/1');
        assert.equal(indexed.calls.get(source.callKey('chr1:200:C:T','A_G38')).gt,'1|1');
        assert.equal(indexed.calls.get(source.callKey('chr1:100:A:G','CONFLICT')).status,'conflict');
        assert.equal(indexed.calls.has(source.callKey('chr1:100:A:G','MISSING')),false);
        assert.equal((await readGenotypes('ABSENT')).calls.size,0);
        let handler;
        register({get(_,fn){handler=fn;}},{accessToken:req=>req.token,
            carriersForGene:async(gene,token)=>({byVariant:new Map([
                ['chr1:100:A:G',new Set(token==='restricted'?['B']:['A_E38','B','C','CONFLICT','MISSING','NEW'])],
                ['chr1:200:C:T',new Set(['A_G38'])],
            ])})},{readGenotypes});
        async function call(gene='TEST',token='normal') {
            let status=200;
            return new Promise(resolve=>handler({query:{gene},token},{set(){},status(code){status=code;return this;},json(data){resolve({status,data});}}));
        }
        const response = await call();
        assert.equal(response.status,200);
        assert.equal(response.data.rows.some(row=>row.sample_id==='OUTSIDE'),false);
        assert.deepEqual((await call('TEST','restricted')).data.rows.map(row=>row.sample_id),['B','A_G38']);
        assert.equal((await call('../bad')).status,400);
        const variants=[{id:'chr1:100:A:G',carrierSamples:['A_E38','B','C','CONFLICT','MISSING','NEW'].map(id=>({id,age:10}))},
            {id:'chr1:200:C:T',carrierSamples:[{id:'A_G38'}]}];
        const merged=applyCarrierGenotypes(variants,response.data);
        assert.deepEqual(merged[0].carrierSamples.map(row=>row.gt),['0/1','0/2','1','Unavailable','Unavailable','Unavailable']);
        assert.equal(merged[1].carrierSamples[0].gt,'1|1');
        assert.equal(merged[0].carrierSamples[0].age,10);
        assert.equal(variants[0].carrierSamples[0].gt,undefined,'do not mutate the shared original state');
        assert.equal(merged[0].carrierSamples.length,variants[0].carrierSamples.length,'GT source must not change carrier counts');
        assert.equal(merged[0].carrierSamples[3].gtStatus,'conflict');
        assert.equal(sampleVariantRows([{gene_symbol:'TEST',variant_id:'chr1:100:A:G',gt:'0/2'}])[0].genotype,merged[0].carrierSamples[1].gt);
        await fs.writeFile(path.join(directory,filename),Buffer.from('corrupted'));
        await assert.rejects(()=>source(directory)('TEST'),/checksum/);
        console.log('PROCESSED_GT_EXACT_JOIN_SCOPE_PHASE_MULTIALLELIC_CONFLICT_AND_INTEGRITY_PASS');
    } finally { await fs.rm(directory,{recursive:true,force:true}); }
})().catch(error=>{console.error(error);process.exitCode=1;});
