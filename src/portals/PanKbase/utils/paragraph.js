const cypherAPI = 'HTTPS://vcr7lwcrnh.execute-api.us-east-1.amazonaws.com/development/api';

export const cyphers =  {
    // 1. Gene Overview
    gene_overview: `MATCH (g:gene {name:"$gene"})
        RETURN {
        name: g.name,
        labels: labels(g),
        properties: properties(g)
        } AS gene
        LIMIT 1`,
    // 2. Variant Details
    variant_details: `MATCH (v:sequence_variant)-[r:fine_mapped_eQTL]->(g:gene {name:"$gene"})
        RETURN v.id AS variant_id,
            r.tissue_id AS tissue,
            properties(r) AS eqtl_stats
        LIMIT 200`,
    // 3. Regulators of the Gene
    gene_regulators: `MATCH (src)-[r:regulation]->(g:gene {name:"$gene"})
        RETURN coalesce(src.name, src.id) AS regulator,
            labels(src) AS regulator_labels,
            r.experimental_system AS exp_system,
            r.experimental_system_type AS exp_type,
            r.throughput AS throughput,
            r.publication_source AS publication,
            r.author AS author
        LIMIT 200`,
    // 4. Targets Regulated by the Gene
    gene_targets: `MATCH (g:gene {name:"$gene"})-[r:regulation]->(tgt)
        RETURN coalesce(tgt.name, tgt.id) AS target,
            labels(tgt) AS target_labels,
            r.experimental_system AS exp_system,
            r.experimental_system_type AS exp_type,
            r.throughput AS throughput,
            r.publication_source AS publication,
            r.author AS author
        LIMIT 200`,
    // 5. Expression Context
    expression_context: `MATCH (g:gene {name:"$gene"})-[r:expression_level]->(ctx)
        RETURN coalesce(ctx.name, ctx.id) AS context,
            labels(ctx) AS context_labels,
            r.All__expression_mean AS all_mean,
            r.All__expression_median AS all_median,
            r.All__expression_min AS all_min,
            r.All__expression_max AS all_max,
            r.All__expression_25_quantile AS all_q25,
            r.All__expression_75_quantile AS all_q75,
            r.NonDiabetic__expression_mean AS nondiabetic_mean,
            r.NonDiabetic__expression_median AS nondiabetic_median,
            r.NonDiabetic__expression_min AS nondiabetic_min,
            r.NonDiabetic__expression_max AS nondiabetic_max,
            r.NonDiabetic__expression_25_quantile AS nondiabetic_q25,
            r.NonDiabetic__expression_75_quantile AS nondiabetic_q75,
            r.Type1Diabetic__expression_mean AS t1d_mean,
            r.Type1Diabetic__expression_median AS t1d_median,
            r.Type1Diabetic__expression_min AS t1d_min,
            r.Type1Diabetic__expression_max AS t1d_max,
            r.Type1Diabetic__expression_25_quantile AS t1d_q25,
            r.Type1Diabetic__expression_75_quantile AS t1d_q75,
            r.data_source AS data_source,
            r.data_version AS data_version
        ORDER BY context
        LIMIT 300`,
    // 6. Disease/Phenotype Associations
    // a. Gene/Disease links
    gene_disease_links: `MATCH (g:gene {name:"$gene"})-[r:effector_gene]->(o:ontology)
        RETURN o.id AS ontology_id,
            coalesce(o.name, o.id) AS ontology_name,
            r.ConfidenceLevel AS confidence,
            r.ResearchMethod AS research_method,
            r.EpigenomeEvidence AS epigenome_evidence,
            r.QtlEvidence AS qtl_evidence,
            r.data_source AS data_source,
            r.data_version AS data_version,
            r.data_source_url AS source_url`,
    // b. Tissues behind the disease links
    tissue_disease_links: `MATCH (v)-[r_eqtl:fine_mapped_eQTL]->(g:gene {name:"$gene"})
        MATCH (g)-[:effector_gene]->(o:ontology)
        RETURN o.id AS ontology_id,
            COUNT(DISTINCT v) AS n_variants,
            collect(DISTINCT r_eqtl.tissue_id) AS tissues`,
    // EQTLs by tissue too?
    eqtls_by_tissue: `
        MATCH (v:sequence_variant)-[r:fine_mapped_eQTL]->(g:gene {name:"$gene"})
        RETURN r.tissue_id AS tissue,
            COUNT(DISTINCT v) AS n_variants,
            collect(DISTINCT v.id) AS variant_ids
        ORDER BY n_variants DESC`
}

function dedent(str) {
    // removes excess indentation and leading/trailing blank lines
    if (!str) return "";
    const lines = str.replace(/\r\n?/g, "\n").split("\n");

    // trim blank first/last lines
    while (lines.length && lines[0].trim() === "") lines.shift();
    while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

    if (!lines.length) return "";

    const baseIndent = (lines[0].match(/^(\s*)/) || ["", ""])[1].length;

    return lines.map(line =>
        line.startsWith(" ".repeat(baseIndent)) ? line.slice(baseIndent) : line
    ).join("\n");
}

export async function runCypherQuery(cypher, params = {}) {
    // render + dedent + param-substitute just like your curl
    const rendered = renderCypher(dedent(cypher), params);
    const compact = rendered.replace(/\s+/g, " ").trim();

    const response = await fetch(cypherAPI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: compact }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Cypher API error ${response.status}: ${text}`);
    }
    return response.json();
}

export function renderCypher(cypher, params = {}) {
    //fix indentation for display
    let query = dedent(cypher);
    //replace params
    for (const [key, val] of Object.entries(params)) {
        const safeVal = typeof val === "string" ? `${val}` : val;
        query = query.replace(new RegExp("\\$" + key, "g"), safeVal);
    }
    return query;
}
export function renderCypherCurl(cypher, params = {}) {
    // substitute params
    let query = renderCypher(cypher, params);
    //remove line breaks
    const compact = query.replace(/\s+/g, " ").trim();
    //escape quotes
    const payload = `{ "query": "${compact.replace(/"/g, '\\"')}" }`;
    //compile query
    const curl = `
    curl -X POST '${cypherAPI}' \\
        -H 'Content-Type: application/json' \\
        -d '${payload}'`;
    //dedent
    const prettyCurl = dedent(curl)
    //generate curl command
    return prettyCurl;
}