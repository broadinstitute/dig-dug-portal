const assert = require('assert');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const {openCarrierDiskCache} = require('./gene_carrier_disk_cache');

(async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gene-carrier-cache-test-'));
    let now = Date.now();
    try {
        let cache = await openCarrierDiskCache(root, 'source-a', () => now);
        cache.putSample('sample-1', {age: 12, project: 'Project A'});
        cache.putSample('missing', null);
        cache.putCarriers('TEST', {byVariant: new Map([
            ['variant-a', new Set(['sample-1', 'sample-2'])],
            ['variant-b', new Set(['sample-1'])],
        ])});
        cache.putSummary('TEST', {carrierTotal: 2, matchedMetadataCount: 2});
        await cache.flush();
        // An interrupted final record must not discard earlier successful lookups.
        await fs.appendFile(path.join(root, 'source-a', 'metadata.jsonl'), '{"id":');
        cache = await openCarrierDiskCache(root, 'source-a', () => now);
        assert.deepStrictEqual(cache.getSample('sample-1'), {age: 12, project: 'Project A'});
        assert.strictEqual(cache.getSample('missing'), null);
        const carriers = await cache.getCarriers('TEST');
        assert.strictEqual(carriers.all.size, 2);
        assert.strictEqual(carriers.byVariant.get('variant-b').size, 1);
        assert.strictEqual((await cache.getSummary('TEST')).carrierTotal, 2);
        assert.strictEqual((await fs.stat(path.join(root, 'source-a'))).mode & 0o777, 0o700);
        assert.strictEqual((await fs.stat(path.join(root, 'source-a', 'metadata.jsonl'))).mode & 0o777, 0o600);
        const isolated = await openCarrierDiskCache(root, 'source-b', () => now);
        assert.strictEqual(isolated.getSample('sample-1'), null);
        assert.strictEqual(await isolated.getSummary('TEST'), null);
        now += 24 * 60 * 60 * 1000 + 1;
        assert.strictEqual(cache.getSample('sample-1'), null);
        assert.strictEqual(await cache.getCarriers('TEST'), null);
        assert.strictEqual(await cache.getSummary('TEST'), null);
        cache = await openCarrierDiskCache(root, 'source-a', () => now);
        assert.strictEqual(cache.getSample('sample-1'), null);
        console.log('Private carrier disk cache: restart reuse, expiry, isolation and interrupted writes PASS');
    } finally {
        await fs.rm(root, {recursive: true, force: true});
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
