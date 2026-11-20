const { timingSafeEqual } = require('node:crypto');
const cookie = require('cookie');
const express = require('express');

const prefix = '/phenotype-analyzer-api/pb';
const bioindexRoutes = [
    '/api/bio/cont',
    ...['gene', 'gene-variants-crdc', 'samples-info', 'transcript-consequences']
        .map(index => '/api/bio/query/' + index),
];

function createRouter(env = process.env) {
    const router = express.Router();
    router.use((_request, response, next) => {
        response.set('Cache-Control', 'private, no-store');
        response.set('X-Content-Type-Options', 'nosniff');
        next();
    });

    const bioindex = env.BIOINDEX_HOST_PRIVATE;
    const profile = env.PB_PHENOTYPE_PROFILE_HOST_PRIVATE;
    require('./gene_hpo_association_endpoint')(router, env.PB_GENE_HPO_FILE);
    if (bioindex) {
        require('./gene_carrier_summary_endpoint')(router, bioindex, { sampleProfileBase: profile });
    }

    function forward(host, targetPath, { bioIndex = false, timeout = 240000 } = {}) {
        const target = host && new URL(targetPath, host);
        return async function proxy(request, response) {
            if (!target) {
                response.status(503).json({ error: 'This service is not configured.' });
                return;
            }
            try {
                const url = new URL(target);
                const headers = { Accept: 'application/json' };
                if (bioIndex) {
                    url.search = new URL(request.originalUrl, 'http://localhost').search;
                    const token = cookie.parse(request.headers.cookie || '').session;
                    if (token) headers['x-bioindex-access-token'] = token;
                }
                let body;
                if (request.method === 'POST') {
                    if (!request.is('application/json') || !request.body) {
                        response.status(415).json({ error: 'A JSON request is required.' });
                        return;
                    }
                    headers['Content-Type'] = 'application/json';
                    body = JSON.stringify(request.body);
                }
                const upstream = await fetch(url, {
                    method: request.method, headers, body, redirect: 'error',
                    signal: AbortSignal.timeout(timeout),
                });
                if (!upstream.headers.get('content-type')?.includes('application/json') || !upstream.body) {
                    await upstream.body?.cancel();
                    throw new Error('The upstream response was not JSON.');
                }
                // Read the complete reply before sending its status. An upstream
                // timeout after headers must stay a recoverable JSON error.
                const payload = await upstream.json();
                if (!response.destroyed) response.status(upstream.status).json(payload);
            } catch (error) {
                if (!response.headersSent && !response.destroyed) {
                    response.status(error.name === 'TimeoutError' ? 504 : 502)
                        .json({ error: 'The upstream service is unavailable. Please retry.' });
                }
            }
        };
    }

    for (const path of bioindexRoutes) {
        router.get('/bioindex' + path, forward(bioindex, path, { bioIndex: true, timeout: 60000 }));
    }

    const json = express.json({ limit: '2mb' });
    function register(method, group, host, operation, timeout) {
        router[method](`/${group}/${operation}`, json,
            forward(host, `/phenotype-analyzer-api/${operation}`, { timeout }));
    }
    register('get', '__pb_phenotype_profile__', profile, 'hpo-counts');
    register('post', '__pb_phenotype_profile__', profile, 'profile');
    register('post', '__pb_phenotype_profile__', profile, 'sample-variants');
    // The R worker allows 600 seconds for a gene-score fit. Leave time for
    // the upstream to return its own result or error before the proxy times out.
    const analysisTimeout = 610000;
    register('post', 'gene-context', env.PB_GENE_CONTEXT_HOST_PRIVATE, 'analyze', analysisTimeout);
    register('post', 'gene-context', env.PB_GENE_CONTEXT_HOST_PRIVATE, 'co-gene-associations', analysisTimeout);
    register('post', '__pb_variant_context__', env.PB_VARIANT_CONTEXT_HOST_PRIVATE, 'analyze', analysisTimeout);
    register('post', '__pb_variant_context__', env.PB_VARIANT_CONTEXT_HOST_PRIVATE, 'co-gene-associations', analysisTimeout);
    register('post', '__pb_sample_gene_scores__', env.PB_SAMPLE_GENE_SCORE_HOST, 'sample-gene-scores');
    router.use((_request, response) => response.status(404).json({ error: 'Unknown CRDC operation.' }));
    router.use((error, _request, response, next) => {
        if (response.headersSent) return next(error);
        const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
        response.status(status).json({ error: 'The CRDC request could not be processed.' });
    });
    return router;
}

function createServer(env = process.env) {
    // Only the authenticating portal ingress holds this credential. It must
    // overwrite the header after applying its session and cohort-access policy.
    const secret = Buffer.from(env.PB_INGRESS_SECRET || '');
    if (secret.length < 32) throw new Error('Set PB_INGRESS_SECRET to a secret of at least 32 bytes.');
    const app = express();
    app.disable('x-powered-by');
    app.use(prefix, (request, response, next) => {
        const supplied = Buffer.from(request.get('X-CRDC-Ingress') || '');
        if (supplied.length !== secret.length || !timingSafeEqual(supplied, secret)) {
            response.set('Cache-Control', 'private, no-store');
            response.status(401).json({ error: 'An authorized CRDC portal session is required.' });
            return;
        }
        next();
    }, createRouter(env));
    return app;
}

if (require.main === module) {
    const port = Number(process.env.PB_API_PORT || 8100);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PB_API_PORT.');
    createServer().listen(port, '127.0.0.1', () => console.log(`CRDC API listening on loopback port ${port}.`));
}

module.exports = { prefix, createRouter, createServer };
