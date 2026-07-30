/**
 * HTTP calls for the genes-first entry point:
 * - Broad Translator bayes_gene/phenotypes (top traits for the gene list)
 * - Per-phenotype cfde bioindex: pigean-gene-phenotype, pigean-gene-set-phenotype
 * - Per (phenotype, gene set) membership: pigean-joined-gene-set
 *
 * Empty/missing results are normal (phenotype id vocabularies only partially overlap) and never throw.
 */

const BAYES_GENE_BASE_URL = "https://translator.broadinstitute.org/genetics_provider/bayes_gene";

/**
 * Builds a cfde bioindex query URL from the configured pigean-factor template's host/path prefix.
 * Example template: https://host/api/bio/query/pigean-factor?q=$phenotype,cfde
 * → https://host/api/bio/query/{index}?q={qParts joined}&limit={limit}
 */
function cfdeBioQueryUrl(vm, index, qParts, { limit = 10000 } = {}) {
    const template = String(vm.queryHelperPigeanFactorUrlTemplate || "").trim();
    const match = template.match(/^(https?:\/\/.+\/query\/)/);
    if (!match || !index) return "";
    const q = (Array.isArray(qParts) ? qParts : [])
        .map((p) => encodeURIComponent(String(p)))
        .join(",");
    if (!q) return "";
    return `${match[1]}${index}?q=${q}&limit=${limit}`;
}

/**
 * POST bayes_gene/phenotypes for the gene list. Returns raw parsed JSON:
 * { phenotypes: [{phenotype, p_value}, ...] } -- already sorted ascending by p_value.
 */
async function fetchGenePhenotypes(vm, genes, { maxNumberGeneSets = 100 } = {}) {
    const resp = await vm.fetchWithTimeout(
        `${BAYES_GENE_BASE_URL}/phenotypes`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ genes, max_number_gene_sets: maxNumberGeneSets }),
        },
        vm.hybridSearchTimeoutMs
    );
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        throw new Error(`bayes_gene/phenotypes failed: ${resp.status} ${vm.hybridSearchErrorMessage(resp.status, json)}`);
    }
    return json;
}

/**
 * Per-phenotype gene-level pigean scores: GET pigean-gene-phenotype?q=$phenotype,cfde.
 * Rows share the same per-phenotype `factor` id vocabulary as pigean-gene-set-phenotype.
 * Never throws.
 */
async function fetchGenePigeanScoresForPhenotype(vm, phenotypeId, { limit = 10000 } = {}) {
    const url = cfdeBioQueryUrl(vm, "pigean-gene-phenotype", [phenotypeId, "cfde"], { limit });
    if (!url) {
        return { phenotypeId, ok: false, rows: [], error: "URL template is missing or invalid." };
    }
    try {
        const resp = await vm.fetchWithTimeout(url, { method: "GET" }, vm.hybridSearchTimeoutMs);
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            return { phenotypeId, ok: false, rows: [], error: `${resp.status} ${vm.hybridSearchErrorMessage(resp.status, json)}` };
        }
        const rows = Array.isArray(json && json.data) ? json.data : [];
        const parsed = rows
            .map((row) => ({
                gene: row && row.gene != null ? String(row.gene) : "",
                factor: row && row.factor != null ? String(row.factor) : "",
                label: row && row.label != null ? String(row.label) : "",
                // Header-row mapping for FactorBaseRevealHeatmap2:
                // combined → Combined score, log_bf → GWAS support, prior → Gene set support
                combined: row && row.combined != null && !isNaN(Number(row.combined)) ? Number(row.combined) : null,
                gwasSupport: row && row.log_bf != null && !isNaN(Number(row.log_bf)) ? Number(row.log_bf) : null,
                geneSetSupport: row && row.prior != null && !isNaN(Number(row.prior)) ? Number(row.prior) : null,
            }))
            .filter((r) => r.gene);
        return { phenotypeId, ok: true, rows: parsed, error: null };
    } catch (err) {
        return { phenotypeId, ok: false, rows: [], error: err && err.message ? err.message : "Request failed." };
    }
}

/**
 * Per-phenotype gene-set-level pigean scores: GET pigean-gene-set-phenotype?q=$phenotype,cfde.
 * Never throws.
 */
async function fetchGeneSetPigeanScoresForPhenotype(vm, phenotypeId, { limit = 10000 } = {}) {
    const url = cfdeBioQueryUrl(vm, "pigean-gene-set-phenotype", [phenotypeId, "cfde"], { limit });
    if (!url) {
        return { phenotypeId, ok: false, rows: [], error: "URL template is missing or invalid." };
    }
    try {
        const resp = await vm.fetchWithTimeout(url, { method: "GET" }, vm.hybridSearchTimeoutMs);
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            return { phenotypeId, ok: false, rows: [], error: `${resp.status} ${vm.hybridSearchErrorMessage(resp.status, json)}` };
        }
        const rows = Array.isArray(json && json.data) ? json.data : [];
        const parsed = rows
            .map((row) => ({
                geneSet: row && row.gene_set != null ? String(row.gene_set) : "",
                factor: row && row.factor != null ? String(row.factor) : "",
                label: row && row.label != null ? String(row.label) : "",
                rsScore: row && row.rs_score != null && !isNaN(Number(row.rs_score)) ? Number(row.rs_score) : null,
                // Effect size; genes-first keeps only gene sets with beta > MIN_GENE_SET_BETA.
                beta: row && row.beta != null && !isNaN(Number(row.beta)) ? Number(row.beta) : null,
                description: row && row.gene_set_description != null ? String(row.gene_set_description) : "",
                program: row && row.gene_set_program != null ? String(row.gene_set_program) : "",
            }))
            .filter((r) => r.geneSet);
        return { phenotypeId, ok: true, rows: parsed, error: null };
    } catch (err) {
        return { phenotypeId, ok: false, rows: [], error: err && err.message ? err.message : "Request failed." };
    }
}

/**
 * Exact gene membership for one (phenotype, gene set): GET pigean-joined-gene-set?q=$phenotype,$geneSet.
 * Never throws.
 */
async function fetchJoinedGeneSetMembers(vm, phenotypeId, geneSet, { limit = 10000 } = {}) {
    const url = cfdeBioQueryUrl(vm, "pigean-joined-gene-set", [phenotypeId, geneSet], { limit });
    if (!url) {
        return { phenotypeId, geneSet, ok: false, genes: [], error: "URL template is missing or invalid." };
    }
    try {
        const resp = await vm.fetchWithTimeout(url, { method: "GET" }, vm.hybridSearchTimeoutMs);
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            return {
                phenotypeId,
                geneSet,
                ok: false,
                genes: [],
                error: `${resp.status} ${vm.hybridSearchErrorMessage(resp.status, json)}`,
            };
        }
        const rows = Array.isArray(json && json.data) ? json.data : [];
        const genes = rows
            .map((row) => ({
                gene: row && row.gene != null ? String(row.gene) : "",
                combined: row && row.combined != null && !isNaN(Number(row.combined)) ? Number(row.combined) : null,
            }))
            .filter((r) => r.gene);
        return { phenotypeId, geneSet, ok: true, genes, error: null };
    } catch (err) {
        return {
            phenotypeId,
            geneSet,
            ok: false,
            genes: [],
            error: err && err.message ? err.message : "Request failed.",
        };
    }
}

/**
 * Runs async work over `items` with at most `concurrency` in flight at once.
 * Preserves input order in the returned results array.
 * Optional `onProgress({ completed, total })` fires after each item settles.
 */
async function mapInBatches(items, concurrency, mapper, onProgress) {
    const list = Array.isArray(items) ? items : [];
    const limit = Math.max(1, Number(concurrency) || 1);
    const out = new Array(list.length);
    let nextIndex = 0;
    let completed = 0;
    const total = list.length;

    async function worker() {
        while (nextIndex < list.length) {
            const i = nextIndex;
            nextIndex += 1;
            out[i] = await mapper(list[i], i);
            completed += 1;
            if (typeof onProgress === "function") onProgress({ completed, total });
        }
    }

    const workers = Array.from({ length: Math.min(limit, list.length || 1) }, () => worker());
    await Promise.all(workers);
    return out;
}

const DEFAULT_FETCH_CONCURRENCY = 10;

/**
 * Fetches gene + gene-set phenotype scores for each phenotype.
 * Individual GETs are capped at `concurrency` in flight (default 10).
 * Empty rows on failure are normal (id-vocabulary mismatch).
 */
async function fetchGeneAndGeneSetScoresForPhenotypes(
    vm,
    phenotypeIds,
    { concurrency = DEFAULT_FETCH_CONCURRENCY, onProgress } = {}
) {
    const ids = Array.isArray(phenotypeIds) ? phenotypeIds : [];
    const tasks = ids.flatMap((phenotypeId) => [
        { phenotypeId, kind: "gene" },
        { phenotypeId, kind: "geneSet" },
    ]);
    const results = await mapInBatches(
        tasks,
        concurrency,
        async ({ phenotypeId, kind }) => {
            if (kind === "gene") {
                return { phenotypeId, kind, result: await fetchGenePigeanScoresForPhenotype(vm, phenotypeId) };
            }
            return { phenotypeId, kind, result: await fetchGeneSetPigeanScoresForPhenotype(vm, phenotypeId) };
        },
        onProgress
    );

    const byId = {};
    ids.forEach((phenotypeId) => {
        byId[phenotypeId] = { phenotypeId, geneRows: [], geneSetRows: [], ok: false, error: null };
    });
    results.forEach(({ phenotypeId, kind, result }) => {
        const entry = byId[phenotypeId];
        if (!entry) return;
        if (kind === "gene") {
            entry.geneRows = result.rows;
            if (result.ok) entry.ok = true;
            else if (!entry.error) entry.error = result.error;
        } else {
            entry.geneSetRows = result.rows;
            if (result.ok) entry.ok = true;
            else if (!entry.error) entry.error = result.error;
        }
    });
    return ids.map((id) => byId[id]);
}

/**
 * Fetches joined membership for many (phenotype, geneSet) pairs (batched concurrency).
 * @param {Array<{phenotypeId: string, geneSet: string}>} pairs
 */
async function fetchJoinedGeneSetMembersForPairs(
    vm,
    pairs,
    { concurrency = DEFAULT_FETCH_CONCURRENCY, onProgress } = {}
) {
    const list = Array.isArray(pairs) ? pairs : [];
    return mapInBatches(
        list,
        concurrency,
        ({ phenotypeId, geneSet }) => fetchJoinedGeneSetMembers(vm, phenotypeId, geneSet),
        onProgress
    );
}

export {
    DEFAULT_FETCH_CONCURRENCY,
    cfdeBioQueryUrl,
    fetchGeneAndGeneSetScoresForPhenotypes,
    fetchGenePhenotypes,
    fetchGenePigeanScoresForPhenotype,
    fetchGeneSetPigeanScoresForPhenotype,
    fetchJoinedGeneSetMembers,
    fetchJoinedGeneSetMembersForPairs,
    mapInBatches,
};
