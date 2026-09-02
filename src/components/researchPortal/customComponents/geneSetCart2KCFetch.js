/**
 * Gene-set cart (KC): fetch bayes_gene/pigean and build factorData — no hypothesis gates.
 */

import { fetchBayesGenePigean } from "./revealMultiQueryWorkflow/revealMqGeneSetEntryApi.js";
import { buildFactorDataFromBayesPigean } from "./revealMultiQueryWorkflow/revealMqGeneSetEntryFactorData.js";
import { normalizeGeneList } from "./geneSetCart2KCFactorHelpers.js";
import { GENE_SET_CART_2KC_BUILD_OPTIONS } from "./geneSetCart2KCBuildOptions.js";

function parseGenesParam(rawGenesParam) {
    const withCommas = String(rawGenesParam || "").replace(/[\n;]+/g, ",");
    return normalizeGeneList([withCommas]);
}

/**
 * @param {Object} vm - geneSetCart2KC component instance (fetchWithTimeout, hybridSearchTimeoutMs, hybridSearchErrorMessage)
 * @param {string|string[]} rawGenesParam
 * @returns {Promise<{ok: boolean, reason?: string, inputGenes?: string[]}>}
 */
async function runGeneSetCartFetch(vm, rawGenesParam) {
    const genes = parseGenesParam(rawGenesParam);
    if (!genes.length) {
        return { ok: false, reason: "no_genes" };
    }

    vm.status = "loading";
    vm.error = null;
    vm.loadStatus = "Running gene-set factorization…";
    vm.inputGenes = genes.slice();
    vm.factorData = null;
    vm.pigeanResponse = null;
    vm.expandedFactorRowKeys = {};
    vm.factorConnectivityNetworks = {};

    let pigeanResponse = null;
    try {
        pigeanResponse = await fetchBayesGenePigean(vm, genes, {
            geneSets: "cfde",
            maxNumberPhenotypes: 100,
        });
    } catch (err) {
        const errMsg = err && err.message ? err.message : "Request failed.";
        vm.status = "error";
        vm.error = `Could not load factorization (bayes_gene/pigean). ${errMsg}`;
        vm.loadStatus = "";
        return { ok: false, reason: "api_error" };
    }

    vm.pigeanResponse = pigeanResponse;
    const inputGenes =
        Array.isArray(pigeanResponse.input_genes) && pigeanResponse.input_genes.length
            ? pigeanResponse.input_genes.map((g) => String(g))
            : genes;
    vm.inputGenes = inputGenes;

    vm.loadStatus = "Building gene set cluster table…";
    const factorData = buildFactorDataFromBayesPigean(
        pigeanResponse,
        inputGenes,
        GENE_SET_CART_2KC_BUILD_OPTIONS
    );
    const factorCount = Object.keys(factorData).length;
    if (!factorCount) {
        vm.status = "error";
        vm.error =
            "No gene set clusters returned for these genes. bayes_gene/pigean completed but produced no factor loadings.";
        vm.loadStatus = "";
        return { ok: false, reason: "insufficient_data" };
    }

    vm.factorData = factorData;
    vm.status = "ready";
    vm.loadStatus = "";
    return { ok: true, inputGenes };
}

export { parseGenesParam, runGeneSetCartFetch };
