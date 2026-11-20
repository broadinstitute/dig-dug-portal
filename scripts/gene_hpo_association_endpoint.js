const fs = require("node:fs");
const zlib = require("node:zlib");
const readline = require("node:readline");
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const runFile = promisify(execFile);
const hpoLabels = require("../src/views/PbPhenotype/geneHpoLabels.generated.json");
const { withSingleHpoDisplayUnits } = require("../src/utils/singleHpoUnits");

const MAX_CACHE = 20;
const cache = new Map();

function finiteNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function projectAssociation(row, scope = 'gene') {
    const hpoId = String(row.hpo_id || "");
    const coefficientBoundary = value => {
        const odds = finiteNumber(value);
        return odds != null && odds > 0 ? Math.log(odds) : null;
    };
    return withSingleHpoDisplayUnits({
        hpoId,
        label: hpoLabels[hpoId] || hpoId,
        beta: finiteNumber(row.beta_gene_score_sum_approx),
        standardError: finiteNumber(row.se_gene_score_sum_approx),
        nSamples: finiteNumber(row.n_samples),
        nCases: finiteNumber(row.n_cases),
        nControls: finiteNumber(row.n_controls),
        nPositive: finiteNumber(row.n_positive_samples),
        nCarriersWithPhenotype: finiteNumber(row.n_carriers_with_phenotype),
        nCrdcCarriers: finiteNumber(row.n_crdc_carriers),
        betaCiLow: coefficientBoundary(row.ci_lower_approx),
        betaCiHigh: coefficientBoundary(row.ci_upper_approx),
        sourceRelease: process.env.PB_GENE_HPO_RELEASE_ID || "configured_gene_hpo_release",
        model: "binomial_logit_mixed_score_test",
        modelFormula: row.model_formula || null,
        outcome: "hpo_binary",
        predictor: "gene_score_sum",
        oddsRatio: finiteNumber(row.odds_ratio_approx),
        ciLow: finiteNumber(row.ci_lower_approx),
        ciHigh: finiteNumber(row.ci_upper_approx),
        pValue: finiteNumber(row.p_value),
        qValue: finiteNumber(scope === 'gene' ? row.q_by_gene : row.q_by_hpo),
        qSignificant: scope === 'gene' ? row.q_significant_by_gene === true : (row.q_significant_by_hpo ?? row.q_significant) === true,
        qByGene: finiteNumber(row.q_by_gene),
        qByHpo: finiteNumber(row.q_by_hpo),
        qScope: scope === 'gene' ? 'within_gene' : 'within_hpo',
        positiveDirection: row.positive_direction === true,
        rank: Number(row.rank) || null,
    });
}

async function readGene(filePath, gene) {
    const source = fs.createReadStream(filePath);
    const unzip = zlib.createGunzip();
    const lines = readline.createInterface({ input: source.pipe(unzip), crlfDelay: Infinity });
    try {
        for await (const line of lines) {
            if (!line.includes(`"gene": "${gene}"`) && !line.includes(`"gene":"${gene}"`)) continue;
            const record = JSON.parse(line);
            if (String(record.gene || "").toUpperCase() !== gene) continue;
            return {
                gene,
                selectionRule: record.selection_rule || "",
                nQSignificant: finiteNumber(record.n_q_significant_by_gene),
                nTestedHpos: finiteNumber(record.n_tested_hpos),
                nAssociations: finiteNumber(record.n_associations),
                associations: (Array.isArray(record.associations) ? record.associations : []).map(row => projectAssociation(row, 'gene')),
            };
        }
        return { gene, selectionRule: "", nQSignificant: 0, associations: [] };
    } finally {
        lines.close();
        source.destroy();
        unzip.destroy();
    }
}

async function readHpo(filePath, hpoId) {
    const source = fs.createReadStream(filePath);
    const unzip = zlib.createGunzip();
    const lines = readline.createInterface({ input: source.pipe(unzip), crlfDelay: Infinity });
    const associations = [];
    try {
        for await (const line of lines) {
            const record = JSON.parse(line);
            const match = (Array.isArray(record.associations) ? record.associations : [])
                .find(row => row.hpo_id === hpoId && (row.q_significant_by_hpo ?? row.q_significant) === true && row.positive_direction === true);
            if (!match) continue;
            const projected = projectAssociation(match, 'hpo');
            const perTenth = value => value == null || value <= 0 ? null : Math.pow(value, 0.1);
            associations.push({ gene: String(record.gene || ""), ...projected,
                oddsRatio: perTenth(projected.oddsRatio), ciLow: perTenth(projected.ciLow),
                ciHigh: perTenth(projected.ciHigh) });
        }
        associations.sort((a, b) => (a.qValue ?? Infinity) - (b.qValue ?? Infinity)
            || (a.pValue ?? Infinity) - (b.pValue ?? Infinity) || a.gene.localeCompare(b.gene));
        return { hpoId, total: associations.length, associations: associations.slice(0, 20) };
    } finally {
        lines.close();
        source.destroy();
        unzip.destroy();
    }
}

module.exports = function registerGeneHpoAssociationEndpoint(app, filePath) {
    let lambdaCache;
    function hpoLambdaForRelease() {
        const directory = path.dirname(filePath);
        const releaseId = process.env.PB_GENE_HPO_RELEASE_ID || path.basename(directory);
        const lambdaPath = path.join(directory, 'hpo_lambda_gc.json');
        try {
            const info = fs.statSync(lambdaPath);
            const key = `${releaseId}:${info.mtimeMs}:${info.size}`;
            if (lambdaCache?.key === key) return lambdaCache.values;
            const result = JSON.parse(fs.readFileSync(lambdaPath, 'utf8'));
            const values = new Map();
            if (result.releaseId === releaseId && result.method === 'median_chi_square_1df' && Array.isArray(result.rows)) {
                for (const { hpoId, lambdaGc, nValidTests } of result.rows) {
                    if (!/^HP:\d{7}$/.test(hpoId) || values.has(hpoId) || !Number.isFinite(lambdaGc) ||
                        lambdaGc < 0 || !Number.isSafeInteger(nValidTests) || nValidTests < 1)
                        throw new Error('Invalid HPO lambda result.');
                    values.set(hpoId, { hpoLambdaGc: lambdaGc, hpoLambdaTests: nValidTests });
                }
            }
            lambdaCache = { key, values };
            return values;
        } catch (_) {
            lambdaCache = undefined;
            return new Map();
        }
    }

    if (typeof app.post === 'function') {
        const comparisons = new Map();
        app.post('/__hpo_gene_carrier_comparison__', require('express').json({ limit: '1mb' }), async (request, response) => {
            response.set('Cache-Control', 'private, no-store');
            const body = request.body || {};
            if (!Array.isArray(body.hpo_ids) || body.hpo_ids.length < 2 || body.hpo_ids.length > 20 ||
                !Array.isArray(body.sample_ids) || body.sample_ids.length > 20000 ||
                body.hpo_ids.some(id => typeof id !== 'string' || !/^HP:\d{7}$/.test(id)) ||
                body.sample_ids.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_.-]{1,120}$/.test(id)) ||
                !Number.isInteger(body.minimum) || body.minimum < 1 || body.minimum > body.hpo_ids.length) {
                response.status(400).json({ error: 'Invalid phenotype profile or sample selection.' }); return;
            }
            const snapshot = process.env.PB_GRS_MEMBERSHIP_SNAPSHOT ||
                path.join(__dirname, '../.pb-private-data/precomputed/grs-membership');
            try {
                const metadata = fs.statSync(path.join(snapshot, 'metadata.json'));
                const normalized = { hpo_ids: body.hpo_ids, minimum: body.minimum, sample_ids: [...new Set(body.sample_ids)].sort() };
                const key = require('crypto').createHash('sha256').update(JSON.stringify(normalized) + metadata.mtimeMs).digest('hex');
                if (!comparisons.has(key)) {
                    if (comparisons.size >= 12) comparisons.delete(comparisons.keys().next().value);
                    const work = runFile(process.env.PB_INDEX_PYTHON || 'python3', ['-m', 'scripts.pb_phenotype_carrier_counts', '--destination', snapshot, '--compare'], { cwd: path.join(__dirname, '..'), maxBuffer: 32 * 1024 * 1024 });
                    work.child.stdin.end(JSON.stringify(normalized));
                    comparisons.set(key, work.then(({stdout}) => JSON.parse(stdout)).catch(error => { comparisons.delete(key); throw error; }));
                }
                response.json(await comparisons.get(key));
            } catch (_) { response.status(503).json({ error: 'Profile carrier comparison is unavailable.' }); }
        });
    }
    function sourceKey() {
        const stat = fs.statSync(filePath);
        return `${filePath}:${stat.size}:${stat.mtimeMs}:${process.env.PB_GENE_HPO_RELEASE_ID || ''}:page-q-v2`;
    }
    app.get("/__hpo_gene_associations__", async (request, response) => {
        response.set("Cache-Control", "private, no-store");
        const hpoId = String(request.query.hpo || "").trim().toUpperCase();
        if (!/^HP:\d{7}$/.test(hpoId)) {
            response.status(400).json({ error: "Enter a valid HPO ID." });
            return;
        }
        if (!filePath || !fs.existsSync(filePath)) {
            response.status(503).json({ error: "Gene-HPO release is not configured on this server." });
            return;
        }
        try {
            if (request.query.view === 'all-genes') {
                const index = process.env.PB_HPO_GENE_INDEX || path.join(__dirname, '../.pb-private-data/precomputed/gene_hpo_release_20261112/hpo-gene.sqlite');
                if (!fs.existsSync(index)) {
                    response.status(503).json({ error: 'The complete precomputed HPO-gene index is not configured.' });
                    return;
                }
                const indexStat = fs.statSync(index);
                const key = `${index}:${indexStat.size}:${indexStat.mtimeMs}:all-genes:${hpoId}`;
                if (!cache.has(key)) {
                    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
                    cache.set(key, runFile(process.env.PB_INDEX_PYTHON || 'python3', ['-m', 'scripts.pb_hpo_gene_index', '--database', index, '--hpo', hpoId], { cwd: path.join(__dirname, '..'), maxBuffer: 32 * 1024 * 1024 }).then(({ stdout }) => {
                        const result = JSON.parse(stdout);
                        const coverage = result.carrierCounts;
                        const associations = result.associations.map(row => {
                            const counts = coverage && coverage.genes[row.gene];
                            return { gene: row.gene, ...projectAssociation({ ...row,
                                n_carriers_with_phenotype: counts ? counts.withPhenotype : null,
                                n_crdc_carriers: counts ? counts.all : null }, 'hpo') };
                        });
                        return { hpoId, total: associations.length, associations,
                            releaseId: result.metadata.release_id, sourceSha256: result.metadata.source_sha256,
                            selectionRule: 'p_value_lt_0.05', qScope: 'within_hpo',
                            effectDirections: 'both', completeDelivery: true, carrierCoverage: coverage ? { ...coverage, genes: undefined } : null };
                    }).catch(error => { cache.delete(key); throw error; }));
                }
                response.json(await cache.get(key));
                return;
            }
            const key = `${sourceKey()}:hpo:${hpoId}`;
            if (!cache.has(key)) {
                if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
                cache.set(key, readHpo(filePath, hpoId).catch(error => { cache.delete(key); throw error; }));
            }
            response.json(await cache.get(key));
        } catch (error) {
            response.status(502).json({ error: "HPO-gene associations could not be loaded." });
        }
    });
    app.get("/__gene_hpo_associations__", async (request, response) => {
        response.set("Cache-Control", "private, no-store");
        const gene = String(request.query.gene || "").trim().toUpperCase();
        if (!/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene)) {
            response.status(400).json({ error: "Enter a valid gene symbol." });
            return;
        }
        if (!filePath || !fs.existsSync(filePath)) {
            response.status(503).json({ error: "Gene-HPO release is not configured on this server." });
            return;
        }
        try {
            const key = `${sourceKey()}:gene:${gene}`;
            if (!cache.has(key)) {
                if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
                cache.set(key, readGene(filePath, gene).catch(error => {
                    cache.delete(key);
                    throw error;
                }));
            }
            const result = await cache.get(key);
            const lambdaValues = hpoLambdaForRelease();
            response.json({
                ...result,
                associations: result.associations.map(row => ({ ...row, ...lambdaValues.get(row.hpoId) })),
            });
        } catch (error) {
            response.status(502).json({ error: "Gene-HPO associations could not be loaded." });
        }
    });
};
