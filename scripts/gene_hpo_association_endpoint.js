// Serve a gene-scoped projection of Kyuryung's precomputed browser release.
// Configure PB_GENE_HPO_FILE to the local/server-side browser_gene_hpo.jsonl.gz.
const fs = require("node:fs");
const zlib = require("node:zlib");
const readline = require("node:readline");
const hpoLabels = require("../src/views/PbPhenotype/geneHpoLabels.generated.json");

const MAX_CACHE = 20;
const cache = new Map();

function finiteNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function projectAssociation(row) {
    const hpoId = String(row.hpo_id || "");
    return {
        hpoId,
        label: hpoLabels[hpoId] || hpoId,
        oddsRatio: finiteNumber(row.odds_ratio_approx),
        ciLow: finiteNumber(row.ci_lower_approx),
        ciHigh: finiteNumber(row.ci_upper_approx),
        pValue: finiteNumber(row.p_value),
        qValue: finiteNumber(row.q_by_hpo),
        qSignificant: row.q_significant === true,
        positiveDirection: row.positive_direction === true,
        rank: Number(row.rank) || null,
    };
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
                nQSignificant: Number(record.n_q_significant) || 0,
                associations: (Array.isArray(record.associations) ? record.associations : []).map(projectAssociation),
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
                .find(row => row.hpo_id === hpoId && row.q_significant === true && row.positive_direction === true);
            if (!match) continue;
            const projected = projectAssociation(match);
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
            const key = `hpo:${hpoId}`;
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
            if (!cache.has(gene)) {
                if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
                cache.set(gene, readGene(filePath, gene).catch(error => {
                    cache.delete(gene);
                    throw error;
                }));
            }
            response.json(await cache.get(gene));
        } catch (error) {
            response.status(502).json({ error: "Gene-HPO associations could not be loaded." });
        }
    });
};
