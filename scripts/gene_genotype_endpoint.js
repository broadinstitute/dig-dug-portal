const { callKey } = require('./processed_genotype_source');
const path = require('node:path');

module.exports = function registerGeneGenotypes(app, provider, options = {}) {
    const readGene = options.readGenotypes || require('./processed_genotype_source')();
    const readVariant = options.readVariantGenotypes || require('./variant_vcf_genotype_source')();
    app.get('/__pb_gene_genotypes__', async (request, response) => {
        response.set('Cache-Control', 'private, no-store');
        response.set('X-Content-Type-Options', 'nosniff');
        const gene = request.query.gene;
        const requestedVariant = request.query.variant;
        if (typeof gene !== 'string' || !/^[A-Z0-9][A-Z0-9.-]{0,39}$/.test(gene)) {
            response.status(400).json({ error: 'Enter a valid gene symbol.' }); return;
        }
        if (requestedVariant != null && (typeof requestedVariant !== 'string' || !/^chr(?:[0-9]{1,2}|X|Y|M|MT):[1-9][0-9]*:[ACGTN*.-]+:[ACGTN*.-]+$/i.test(requestedVariant))) {
            response.status(400).json({error:'Enter an exact variant ID.'}); return;
        }
        try {
            const processed = await readGene(gene);
            if (!processed && !requestedVariant) { response.status(503).json({ error: 'Processed genotype index is not configured.' }); return; }
            const result = processed || {calls:new Map(),source:null};
            // Restrict the frozen GT source to the current, authorized CRDC
            // carrier universe. Do not return extra source samples/variants.
            const carriers = await provider.carriersForGene(gene, provider.accessToken(request));
            if (requestedVariant && !carriers.byVariant.has(requestedVariant)) {
                response.status(400).json({error:'The variant is unavailable for this gene.'}); return;
            }
            const rows = [];
            for (const [variant, samples] of carriers.byVariant) {
                for (const sample of samples) {
                    const call = result.calls.get(callKey(variant, sample));
                    if (call) rows.push({ variant_id: variant, sample_id: sample, ...call });
                }
            }
            let vcfStatus = null;
            if (requestedVariant) {
                const samples = [...carriers.byVariant.get(requestedVariant)];
                const missing = samples.filter(sid => !result.calls.has(callKey(requestedVariant,sid)));
                if (missing.length) {
                    try {
                        const supplemental = await readVariant(requestedVariant, missing);
                        const source = { ...supplemental.source };
                        if (source.source_file) source.source_file = path.basename(source.source_file);
                        for (const row of supplemental.rows) {
                            if (row.variant_id === requestedVariant && missing.includes(row.sample_id))
                                rows.push({ ...row, source });
                        }
                        vcfStatus = 'ready';
                    } catch (_) { vcfStatus = 'unavailable'; }
                }
            }
            if (!processed && vcfStatus !== 'ready') {
                response.status(503).json({error:'Neither the processed index nor the original VCF genotype lookup is available.'}); return;
            }
            response.json({ gene, rows, source: result.source, ...(requestedVariant ? {requested_variant:requestedVariant} : {}),
                ...(vcfStatus ? {vcf_lookup_status:vcfStatus} : {}) });
        } catch (_) {
            response.status(502).json({ error: 'Private variant genotypes are unavailable.' });
        }
    });
};
