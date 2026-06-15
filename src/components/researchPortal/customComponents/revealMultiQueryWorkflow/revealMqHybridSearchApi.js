/**
 * Hybrid-search HTTP + client embedding for Multi Query REVEAL.
 * Operates on the shell component instance (`vm`) for config and request body assembly.
 */

import {
    buildHybridSearchRequestBody,
    hybridSearchEndpointUrl,
    hybridSearchErrorMessage,
} from "./revealMqHybridSearch.js";

async function fetchWithTimeout(url, options = {}, timeoutMs) {
    const ms = timeoutMs != null ? timeoutMs : 120000;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(tid);
    }
}

async function fetchHybridQueryEmbedding(vm, queryText) {
    const text = String(queryText || "").trim();
    if (!text) throw new Error("Client embedding requires non-empty query text for embedding.");
    const embResp = await fetchWithTimeout(
        vm.ollamaEmbedUrl,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: vm.hybridEmbedModel,
                input: text,
            }),
        },
        vm.hybridSearchTimeoutMs
    );
    const embJson = await embResp.json().catch(() => ({}));
    const embedding = embJson && Array.isArray(embJson.embeddings) ? embJson.embeddings[0] : null;
    if (!embResp.ok) {
        throw new Error(`Embedding API failed: ${embResp.status} ${JSON.stringify(embJson)}`);
    }
    const dim = vm.hybridEmbedExpectedDim;
    if (!Array.isArray(embedding) || embedding.length !== dim) {
        throw new Error(`Invalid embedding from Ollama: expected ${dim} floats (${vm.hybridEmbedModel}).`);
    }
    return embedding;
}

async function callHybridRevealSearch(
    vm,
    { queryEmbedding, phenotypeTerms, mechanismTerms, researchContext, genesOfInterest, constraintSpec = null }
) {
    const url = hybridSearchEndpointUrl({
        hybridSearchEndpointUrl: vm.hybridSearchEndpointUrl,
        hybridSearchBaseUrl: vm.hybridSearchBaseUrl,
    });
    const body = buildHybridSearchRequestBody({
        phenotypeTerms,
        mechanismTerms,
        researchContext,
        queryEmbedding,
        genesOfInterest: genesOfInterest != null ? genesOfInterest : vm.lastGenesOfInterest,
        constraintSpec,
        useClientEmbedding: !!vm.hybridSearchUseClientEmbedding,
    });
    if (!body.phenotype_terms.length) {
        throw new Error("422 phenotype_terms is required and must be non-empty.");
    }
    let resp;
    try {
        resp = await fetchWithTimeout(
            url,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            },
            vm.hybridSearchTimeoutMs
        );
    } catch (err) {
        if (err && err.name === "AbortError") {
            throw new Error("504 Hybrid search request timed out. Try again or increase hybridSearchTimeoutMs.");
        }
        throw err;
    }
    const json = await resp.json().catch(() => ({}));
    if (resp.ok && json && json.status === "success") {
        console.log("FactorBaseReveal: hybrid search raw response", json);
        return json;
    }
    const detail = hybridSearchErrorMessage(resp.status, json);
    if (resp.status === 404) {
        throw new Error(`404 ${detail}`);
    }
    if (resp.status === 422) {
        throw new Error(`422 ${detail}`);
    }
    if (resp.status === 504) {
        throw new Error(`504 ${detail || "Hybrid search timed out."}`);
    }
    if (resp.status >= 500) {
        throw new Error(`500 ${detail}`);
    }
    throw new Error(`Hybrid search failed at ${url}: ${resp.status} ${detail}`);
}

export { callHybridRevealSearch, fetchHybridQueryEmbedding, fetchWithTimeout };
