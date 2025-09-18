const cypherAPI = 'HTTPS://vcr7lwcrnh.execute-api.us-east-1.amazonaws.com/development/api';

export const cyphers =  { 
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