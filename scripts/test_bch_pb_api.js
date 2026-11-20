const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const { createServer, prefix } = require('./bch_pb_api');

async function main() {
    assert.throws(() => createServer({}), /PB_INGRESS_SECRET/);
    const secret = randomBytes(32).toString('hex');
    const app = createServer({
        PB_INGRESS_SECRET: secret,
        BIOINDEX_HOST_PRIVATE: 'http://bioindex.invalid',
        PB_PHENOTYPE_PROFILE_HOST_PRIVATE: 'http://profile.invalid',
    });
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}${prefix}`;
    const clientFetch = global.fetch;
    const requests = [];
    global.fetch = async (url, options) => {
        requests.push({ url: url.href, options });
        return Response.json(url.hostname === 'bioindex.invalid'
            ? { data: [], continuation: null }
            : { counts: { 'HP:0001250': 1 } });
    };
    const headers = { 'X-CRDC-Ingress': secret, Cookie: 'session=test-bioindex-token' };
    try {
        const hpoPath = '/__pb_phenotype_profile__/hpo-counts';
        for (const testHeaders of [{}, { 'X-CRDC-Ingress': 'untrusted' }]) {
            const response = await clientFetch(base + hpoPath, { headers: testHeaders });
            assert.equal(response.status, 401);
            assert.equal(response.headers.get('cache-control'), 'private, no-store');
        }
        assert.equal(requests.length, 0);
        let response = await clientFetch(base + hpoPath, { headers });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { counts: { 'HP:0001250': 1 } });
        assert.equal(requests[0].url, 'http://profile.invalid/phenotype-analyzer-api/hpo-counts');
        assert.deepEqual(requests[0].options.headers, { Accept: 'application/json' });

        response = await clientFetch(base + '/bioindex/api/bio/cont?token=page%2B2', { headers });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { data: [], continuation: null });
        assert.equal(requests[1].url, 'http://bioindex.invalid/api/bio/cont?token=page%2B2');
        assert.equal(requests[1].options.headers['x-bioindex-access-token'], 'test-bioindex-token');

        response = await clientFetch(base + '/__pb_phenotype_profile__/sample-match-inputs', {
            method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}',
        });
        assert.equal(response.status, 404);
        response = await clientFetch(base + '/gene-context/analyze', { method: 'POST', headers });
        assert.equal(response.status, 503);
        assert.equal(requests.length, 2);
    } finally {
        global.fetch = clientFetch;
        await new Promise(resolve => server.close(resolve));
    }
    console.log('BCH API authorization, private forwarding and unavailable service checks passed');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
