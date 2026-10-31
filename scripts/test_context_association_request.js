const assert = require('node:assert/strict');
const { fetchContextAssociations } = require('../src/utils/contextAssociationRequest');

async function main() {
    const payload = { gene: 'GJB2', terms: ['HP:0031352'], co_genes: ['TTN'], score_type: 'max', affected_only: false };
    const result = { gene_associations: { TTN: { status: 'ok', p_value: 0.1 } } };
    const received = await fetchContextAssociations(payload, async (url, options) => {
        assert.equal(url, '/phenotype-analyzer-api/co-gene-associations');
        assert.deepEqual(JSON.parse(options.body), payload);
        assert.ok(options.signal instanceof AbortSignal);
        return { ok: true, json: async () => result };
    });
    assert.equal(received, result);
    await assert.rejects(fetchContextAssociations(payload, async () => ({ok: false, status: 503})), /503.*retry/i);
    const waitForAbort = signal => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('Aborted')), {once: true});
    });
    await assert.rejects(fetchContextAssociations(payload, (_, options) => waitForAbort(options.signal), 10), /timed out.*retry/i);
    await assert.rejects(fetchContextAssociations(payload, async (_, options) => ({
        ok: true, json: () => waitForAbort(options.signal),
    }), 10), /timed out.*retry/i, 'The deadline also bounds a stalled response body');
    await assert.rejects(fetchContextAssociations(payload, async () => { throw new Error('Connection lost'); }), /Connection lost/);
    console.log('Context association request: payload, HTTP/network failures, fetch/body deadlines PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
