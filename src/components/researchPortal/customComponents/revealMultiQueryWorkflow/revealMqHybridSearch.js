/**
 * Hybrid-search request shaping and response normalization for Multi Query REVEAL.
 */

import { normalizeLlmTermList } from "./revealMqExtraction.js";

function prepareHybridSearchRequestFields(phenotypeTerms, mechanismTerms, researchContext, queryEmbedding) {
    const NONE = "(none extracted)";
    const phenotype_terms = (phenotypeTerms || [])
        .map((t) => String(t || "").trim())
        .filter((t) => t && t !== NONE);
    let mechanism_terms = (mechanismTerms || [])
        .map((t) => String(t || "").trim())
        .filter((t) => t && t !== NONE);
    let research_context = researchContext != null ? String(researchContext).trim() : "";
    if (research_context === NONE) research_context = "";

    const hasEmbedding = Array.isArray(queryEmbedding) && queryEmbedding.length > 0;
    const hasMech = mechanism_terms.length > 0;
    const hasContext = research_context.length > 0;
    if (!hasEmbedding && !hasMech && !hasContext) {
        research_context = `Phenotype-focused retrieval: ${phenotype_terms.join("; ")}.`;
    }

    return { phenotype_terms, mechanism_terms, research_context };
}

function buildHybridSearchRequestBody({
    phenotypeTerms,
    mechanismTerms,
    researchContext,
    queryEmbedding = null,
    genesOfInterest = [],
    constraintSpec = null,
    useClientEmbedding = false,
} = {}) {
    const fields = prepareHybridSearchRequestFields(
        phenotypeTerms,
        mechanismTerms,
        researchContext,
        useClientEmbedding ? queryEmbedding : null
    );
    const goi = normalizeLlmTermList(genesOfInterest);
    const body = {
        phenotype_terms: fields.phenotype_terms,
        genes_of_interest: goi,
        mechanism_terms: fields.mechanism_terms,
        research_context: fields.research_context,
    };
    if (useClientEmbedding && Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
        body.query_embedding = queryEmbedding;
    }
    if (constraintSpec && typeof constraintSpec === "object") {
        if (constraintSpec.constraint_mode != null) body.constraint_mode = constraintSpec.constraint_mode;
        if (constraintSpec.constraint_scope != null) body.constraint_scope = constraintSpec.constraint_scope;
        if (constraintSpec.constraint_behavior != null) body.constraint_behavior = constraintSpec.constraint_behavior;
    }
    return body;
}

function hybridSearchErrorMessage(status, json) {
    if (json == null || typeof json !== "object") {
        return `HTTP ${status}`;
    }
    if (typeof json.message === "string" && json.message.trim()) return json.message.trim();
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail.trim();
    if (json.detail != null && typeof json.detail === "object") {
        try {
            return JSON.stringify(json.detail);
        } catch (e) {
            return String(json.detail);
        }
    }
    if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
    try {
        return JSON.stringify(json);
    } catch (e) {
        return `HTTP ${status}`;
    }
}

function normalizeHybridFactorsToFactorData(hybridJson, phenotypeTerms = []) {
    const out = {};
    const data = hybridJson && hybridJson.data ? hybridJson.data : {};
    const factors = Array.isArray(data.factors) ? data.factors : [];
    const fallbackPhenotype = data.phenotype != null
        ? String(data.phenotype).trim()
        : ((phenotypeTerms && phenotypeTerms[0]) ? String(phenotypeTerms[0]).trim() : "");

    factors.forEach((item, idx) => {
        const phenotype = item && item.phenotype != null && String(item.phenotype).trim() !== ""
            ? String(item.phenotype).trim()
            : fallbackPhenotype;
        if (!phenotype) return;
        if (!out[phenotype]) out[phenotype] = { genes: {}, factors: [], allFactors: [] };

        const factorId = item && item.factor_id != null && String(item.factor_id).trim() !== ""
            ? String(item.factor_id).trim()
            : `factor${idx + 1}`;
        const explicitApiLabel = item && item.label != null && String(item.label).trim() !== ""
            ? String(item.label).trim()
            : "";
        const factorLabel = explicitApiLabel || factorId;
        const topGeneSets = Array.isArray(item && item.top_gene_sets)
            ? item.top_gene_sets.map((s) => String(s || "").trim()).filter(Boolean)
            : (item && item.top_gene_sets != null ? String(item.top_gene_sets).split(/[;,]/).map((s) => s.trim()).filter(Boolean) : []);
        const geneSetPrograms = Array.isArray(item && item.gene_set_programs)
            ? item.gene_set_programs.map((s) => String(s || "").trim()).filter(Boolean)
            : (item && item.gene_set_program != null ? String(item.gene_set_program).split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean) : []);

        const factorObj = {
            factor: factorId,
            label: factorLabel,
            labelFromApi: explicitApiLabel !== "" ? explicitApiLabel : null,
            top_gene_sets: topGeneSets.join(";"),
            gene_set_description: "",
            gene_set_program: geneSetPrograms.join(" | "),
            genes: {},
            geneSets: {},
        };

        topGeneSets.forEach((gs) => {
            factorObj.geneSets[gs] = { genes: [] };
        });

        const genes = Array.isArray(item && item.genes) ? item.genes : [];
        genes.forEach((g) => {
            const gene = g && g.gene != null ? String(g.gene).trim() : "";
            if (!gene) return;
            const rel = g && g.relevance != null && !isNaN(Number(g.relevance)) ? Number(g.relevance) : null;
            const includedFromRequest = g && g.included_from_request === true;
            const geneSetIds = Array.isArray(g && g.gene_set_ids)
                ? g.gene_set_ids.map((x) => String(x || "").trim()).filter(Boolean)
                : (g && g.gene_set_ids != null
                    ? String(g.gene_set_ids).split(/[;,]/).map((x) => x.trim()).filter(Boolean)
                    : []);
            factorObj.genes[gene] = {
                factorRelevance: rel != null ? rel : 1,
                factor_value: rel,
                includedFromRequest,
                geneSetIds,
            };
            geneSetIds.forEach((gs) => {
                if (!factorObj.geneSets[gs]) factorObj.geneSets[gs] = { genes: [] };
                const members = Array.isArray(factorObj.geneSets[gs].genes) ? factorObj.geneSets[gs].genes : [];
                if (!members.includes(gene)) members.push(gene);
                factorObj.geneSets[gs].genes = members;
            });
            if (out[phenotype].genes[gene] == null) {
                out[phenotype].genes[gene] = {
                    combined: g && g.combined_score != null ? g.combined_score : null,
                    gwasSupport: g && g.gwas_support != null ? g.gwas_support : null,
                    geneSetSupport: g && g.functional_support != null ? g.functional_support : null,
                };
            }
        });

        out[phenotype].factors.push(factorObj);
    });

    Object.keys(out).forEach((p) => {
        out[p].allFactors = [...(out[p].factors || [])];
    });
    return out;
}

function hybridSearchEndpointUrl(config = {}) {
    const configured =
        config.hybridSearchEndpointUrl != null && String(config.hybridSearchEndpointUrl).trim() !== "";
    if (configured) {
        return String(config.hybridSearchEndpointUrl).trim().replace(/\/$/, "");
    }
    return `${String(config.hybridSearchBaseUrl || "").replace(/\/$/, "")}/api/reveal/hybrid-search`;
}

export {
    buildHybridSearchRequestBody,
    hybridSearchEndpointUrl,
    hybridSearchErrorMessage,
    normalizeHybridFactorsToFactorData,
    prepareHybridSearchRequestFields,
};
