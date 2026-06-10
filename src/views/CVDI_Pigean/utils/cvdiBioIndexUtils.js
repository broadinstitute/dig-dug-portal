/* CVDI BioIndex adapter
   - Reuses the shared BioIndex transport (src/utils/bioIndexUtils) but points
     all requests at the CVDI BioIndex host.
   - Only the CVDI-specific host, config constants, and getPhecodeMap live here;
     the transport logic is NOT duplicated.
*/

import {
    query as biQuery,
    match as biMatch,
    apiUrl as biApiUrl,
    rawUrl as biRawUrl,
    request as biRequest,
} from "@/utils/bioIndexUtils";
import dataConvert from "@/utils/dataConvert";

// CVDI-specific BioIndex server
export const BIO_INDEX_HOST = "https://cvdi.hugeampkpnbi.org";

// Thin wrappers that bind the shared transport to the CVDI host.
export function apiUrl(path) {
    return biApiUrl(path, false, BIO_INDEX_HOST);
}

export function rawUrl(path, query_params) {
    return biRawUrl(path, query_params, BIO_INDEX_HOST);
}

export function request(path, query_params) {
    return biRequest(path, query_params, BIO_INDEX_HOST);
}

export function query(index, q, opts = {}) {
    return biQuery(index, q, { ...opts, host: BIO_INDEX_HOST });
}

export function match(index, q, opts = {}) {
    return biMatch(index, q, { ...opts, host: BIO_INDEX_HOST });
}

export async function getPhecodeMap(){
    const phecodeMapUrl = `${BIO_INDEX_HOST}/api/raw/file/pigean/phenotypes/phenotypes_with_labels.tsv`;
    let phecodeText = await fetch(phecodeMapUrl)
        .then(response => response.text());
    // BioIndex serves the raw TSV unescaped, so a trim is all that's needed
    // (unlike the old CMS servedata endpoint, which quoted+escaped the payload).
    phecodeText = phecodeText.trim();
    let phecodeJson = dataConvert.tsv2Json(phecodeText);
    let phecodeMap = {};
    phecodeJson.forEach(j => {
        j.phenotype_name = j.description;
        j.trait_group = jurgensTraitGroup(j.phenotype);
        j.trait_group_description = TRAIT_GROUPS[j.trait_group];
        phecodeMap[j.phenotype] = j;
    });
    return phecodeMap;
}

export async function getAllGenesets(){
    let url = `${BIO_INDEX_HOST
        }/api/bio/keys/pigean-gene-set/3?columns=gene_set`;
    try {
        let params = await fetch(url).then(response => response.json());
        return params.keys.map(i => i[0]);
    } catch (error) {
        console.error("Failed to fetch gene sets", error);
        return [];
    }
}

function jurgensTraitGroup(phenotypeId){
    let delimiter = "___";
    let delimited = phenotypeId.split(delimiter);
    if (delimited.length === 1){
        return "jurgens_exomes";
    }
    let suffix = delimited[1];
    if (suffix.startsWith("gcat_trait")){
        return "jurgens_exomes___gcat_trait";
    }
    return "jurgens_exomes___portal";
}

export const DEFAULT_MODEL = "mouse_msigdb";
export const DEFAULT_SIGMA = 2;
export const DEFAULT_GENESET_SIZE = "small";
export const DEFAULT_TRAIT_GROUP = "jurgens_exomes";
export const TRAIT_GROUPS = {
    "jurgens_exomes": "Jurgens Exomes",
    "jurgens_exomes___portal": "Jurgens Exomes - Portal",
    "jurgens_exomes___gcat_trait": "Jurgens Exomes - GCAT"
};

export default {
    query,
    match,
    apiUrl,
    request,
    rawUrl,
    getPhecodeMap,
    getAllGenesets,
    BIO_INDEX_HOST,
    DEFAULT_MODEL,
    DEFAULT_SIGMA,
    DEFAULT_GENESET_SIZE,
    DEFAULT_TRAIT_GROUP,
    TRAIT_GROUPS
};
