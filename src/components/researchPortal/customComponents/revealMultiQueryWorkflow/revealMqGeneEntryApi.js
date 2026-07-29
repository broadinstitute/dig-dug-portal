/**
 * HTTP calls for the genes-first entry point: Broad Translator Bayes-gene API (pigean factors,
 * phenotypes, flat gene/gene-set scores) plus the existing per-phenotype pigean-factor GET,
 * reused here as a leaner primitive independent of the Query Helper modal's UI state.
 */

const BAYES_GENE_BASE_URL = "https://translator.broadinstitute.org/genetics_provider/bayes_gene";

/**
 * POST bayes_gene/pigean for the gene list. Returns raw parsed JSON:
 * { input_genes, "pigean-factor": {data:[...]}, "gene-factor": {...}, "gene-set-factor": {...},
 *   gene_sets: [...], gene_scores: {...}, gene_set_scores: {...}, network_graph: [...] }
 */
async function fetchGenePigeanFactors(vm, genes, { geneSets = "cfde", maxNumberPhenotypes = 100 } = {}) {
    const resp = await vm.fetchWithTimeout(
        `${BAYES_GENE_BASE_URL}/pigean`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                genes,
                gene_sets: geneSets,
                max_number_phenotypes: maxNumberPhenotypes,
                calculate_gene_scores: true,
            }),
        },
        vm.hybridSearchTimeoutMs
    );
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        throw new Error(`bayes_gene/pigean failed: ${resp.status} ${vm.hybridSearchErrorMessage(resp.status, json)}`);
    }
    return json;
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
 * POST bayes_gene/gene_scores for the gene list. Returns raw parsed JSON:
 * { gene_scores: {gene: score}, gene_set_scores: {gene_set: score} } -- plain object maps.
 */
async function fetchGeneScoresFlat(vm, genes, { geneSets = "cfde", pValue = "0.05", maxNumberGeneSets = 150 } = {}) {
    const resp = await vm.fetchWithTimeout(
        `${BAYES_GENE_BASE_URL}/gene_scores`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                genes,
                gene_sets: geneSets,
                p_value: pValue,
                max_number_gene_sets: maxNumberGeneSets,
            }),
        },
        vm.hybridSearchTimeoutMs
    );
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        throw new Error(`bayes_gene/gene_scores failed: ${resp.status} ${vm.hybridSearchErrorMessage(resp.status, json)}`);
    }
    return json;
}

/**
 * Per-trait factor rows via the existing pigean-factor GET template (phenotype-scoped bioindex,
 * separate from the gene-derived pigean call above). One GET per trait, all in parallel; each
 * trait catches its own error/empty-result internally so a single failing or empty trait never
 * aborts the batch -- empty `data: []` is a normal, expected outcome (translator-discovered
 * phenotype ids only partially overlap this bioindex's own phenotype vocabulary).
 */
async function fetchPigeanFactorsForTraits(vm, traitIds) {
    const template = String(vm.queryHelperPigeanFactorUrlTemplate || "").trim();
    const ids = Array.isArray(traitIds) ? traitIds : [];
    return Promise.all(
        ids.map(async (traitId) => {
            if (!template || !template.includes("$phenotype")) {
                return { traitId, ok: false, factors: [], error: "Factor API template is missing or invalid." };
            }
            const url = template.replace("$phenotype", encodeURIComponent(String(traitId)));
            try {
                const resp = await vm.fetchWithTimeout(url, { method: "GET" }, vm.hybridSearchTimeoutMs);
                const json = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    return {
                        traitId,
                        ok: false,
                        factors: [],
                        error: `${resp.status} ${vm.hybridSearchErrorMessage(resp.status, json)}`,
                    };
                }
                const rows = Array.isArray(json && json.data) ? json.data : [];
                const factors = rows.map((row) => ({
                    factor: row && (row.factor != null ? row.factor : row.cluster) != null
                        ? String(row.factor != null ? row.factor : row.cluster)
                        : "",
                    label: row && row.label != null ? String(row.label) : "",
                    topGeneSets: row && row.top_gene_sets != null ? String(row.top_gene_sets) : "",
                }));
                return { traitId, ok: true, factors, error: null };
            } catch (err) {
                return { traitId, ok: false, factors: [], error: err && err.message ? err.message : "Request failed." };
            }
        })
    );
}

export {
    fetchGenePhenotypes,
    fetchGenePigeanFactors,
    fetchGeneScoresFlat,
    fetchPigeanFactorsForTraits,
};
