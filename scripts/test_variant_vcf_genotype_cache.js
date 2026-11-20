const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const {EventEmitter} = require('node:events');

(async()=>{
    const directory = await fs.mkdtemp(path.join(os.tmpdir(),'pb-vcf-gt-cache-test-'));
    const filename = path.join(__dirname,'variant_vcf_genotype_source.js');
    const code = await fs.readFile(filename,'utf8');
    let networkCalls=0, online=true;
    const http = {request(url,options,callback) {
        const request = new EventEmitter();
        request.setTimeout = ()=>{};
        request.destroy = error=>request.emit('error',error);
        request.end = body=>process.nextTick(()=>{
            networkCalls++;
            if (!online) {request.emit('error',Error('offline'));return;}
            const selected = JSON.parse(body);
            const response = new EventEmitter(); response.statusCode=200;response.setEncoding=()=>{};
            callback(response);
            response.emit('data',JSON.stringify({variant_id:selected.variant_id,
                rows:selected.sample_ids.map(sample_id=>({sample_id,variant_id:selected.variant_id,gt:'1/1',status:'matched'})),
                source:{kind:'original_vcf',source_file:'fixture.vcf.gz'}}));
            response.emit('end');
        });
        return request;
    }};
    function reader() {
        const output={exports:{}}; const req=createRequire(filename);
        vm.runInNewContext(code,{module:output,exports:output.exports,require:name=>['http','https'].includes(name)?http:req(name),__dirname,URL,Buffer,process});
        return output.exports('http://127.0.0.1:12345',directory);
    }
    try {
        const first=await reader()('chr13:20189546:AC:A',['A_E38','B_E38']);
        assert.equal(first.rows.length,2); assert.equal(networkCalls,1);
        online=false;
        const restarted=await reader()('chr13:20189546:AC:A',['B_E38','A_E38']);
        assert.equal(restarted.rows[0].gt,'1/1');assert.equal(networkCalls,1,'A new process reuses the verified exact-selection cache while offline');
        await assert.rejects(()=>reader()('chr13:20189546:AC:A',['OUTSIDE']),/offline/,'A different sample scope cannot reuse private GT cache entries');
        const cached=(await fs.readdir(directory)).find(name=>name.endsWith('.json'));
        const stored=JSON.parse(await fs.readFile(path.join(directory,cached),'utf8'));
        stored.result.rows[0].gt='0/1';await fs.writeFile(path.join(directory,cached),JSON.stringify(stored));
        await assert.rejects(()=>reader()('chr13:20189546:AC:A',['A_E38','B_E38']),/offline/,'Corrupt cached calls must not be trusted');
        console.log('VCF_GT_PERSISTENT_RESTART_OFFLINE_SCOPE_AND_INTEGRITY_PASS');
    } finally {await fs.rm(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
