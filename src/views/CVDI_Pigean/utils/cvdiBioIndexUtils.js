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
    const phecodeMapUrl = "https://hugeampkpncms.org/sites/default/files/phenotypes_with_labels.csv";
    let phecodeText = await fetch(phecodeMapUrl)
        .then(response => response.text());
    let phecodeJson = dataConvert.csv2Json(phecodeText);
    let phecodeMap = {};
    phecodeJson.forEach(j => {
        let phecodeKey = `phecode_${j.phenotype}`;
        j.phenotype = phecodeKey;
        j.phenotype_name = j.description;
        phecodeMap[phecodeKey] = j;
    });
    return phecodeMap;
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
    BIO_INDEX_HOST,
    DEFAULT_MODEL,
    DEFAULT_SIGMA,
    DEFAULT_GENESET_SIZE,
    DEFAULT_TRAIT_GROUP,
    TRAIT_GROUPS
};
