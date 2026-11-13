const { callKey } = require('./processed_genotype_source');

module.exports = function registerGeneGenotypes(app, provider, options = {}) {
    const readGene = options.readGenotypes || require('./processed_genotype_source')();
    app.get('/__pb_gene_genotypes__', async (request, response) => {
        response.set('Cache-Control', 'private, no-store');
        response.set('X-Content-Type-Options', 'nosniff');
        const gene = request.query.gene;
        if (typeof gene !== 'string' || !/^[A-Z0-9][A-Z0-9.-]{0,39}$/.test(gene)) {
            response.status(400).json({ error: 'Enter a valid gene symbol.' }); return;
        }
        try {
            const result = await readGene(gene);
            if (!result) { response.status(503).json({ error: 'Processed genotype index is not configured.' }); return; }
            // Restrict the frozen GT source to the current, authorized CRDC
            // carrier universe. Do not return extra source samples/variants.
            const carriers = await provider.carriersForGene(gene, provider.accessToken(request));
            const rows = [];
            for (const [variant, samples] of carriers.byVariant) {
                for (const sample of samples) {
                    const call = result.calls.get(callKey(variant, sample));
                    if (call) rows.push({ variant_id: variant, sample_id: sample, ...call });
                }
            }
            response.json({ gene, rows, source: result.source });
        } catch (_) {
            response.status(502).json({ error: 'Private variant genotypes are unavailable.' });
        }
    });
};
