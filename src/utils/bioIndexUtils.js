/* BioIndex Utilities
   - Data and methods useful for BioIndex that aren't worth keeping within a Vuex store
   - Includes constants like hostname (which can still be set via an environmental variable)
*/

import querystring from "query-string";
import cookie from "cookie";

// set cookie for authenticated requests
let session_cookie = undefined;

// lookup the one in the document
if (!!document.cookie) {
    session_cookie = cookie.parse(document.cookie).session;
}

// updated at compile-time to the dev or production BioIndex server
export const BIO_INDEX_HOST = "SERVER_IP_ADDRESS";
export const BIO_INDEX_HOST_PRIVATE = "SERVER_IP_PRIVATE";

/* Returns the path for any BioIndex API end-point.
 */
export function apiUrl(path, query_private = false, host) {
    if (path.startsWith("/")) {
        path = path.substr(1);
    }

    // an explicit host (e.g. a portal-specific BioIndex server) wins;
    // otherwise fall back to the compile-time default/private host.
    let baseHost = host || (query_private ? BIO_INDEX_HOST_PRIVATE : BIO_INDEX_HOST);
    return `${baseHost}/${path}`;
}

/* Useful for /api/raw end-points with query parameters.
 */
export function rawUrl(path, query_params, host) {
    let qs = querystring.stringify(query_params, { skipNull: true });

    return `${apiUrl(path, false, host)}${qs ? "?" + qs : ""}`;
}

/* Build a generic request to a BioIndex end-point.
 */
export async function request(path, query_params, host) {
    return fetch(rawUrl(path, query_params, host), {
        headers: {
            "x-bioindex-access-token": session_cookie,
        },
    });
}

/**
 * POST JSON body to a BioIndex path (no query-string params).
 * Used when callers need to keep sensitive keys out of the URL.
 */
export async function requestPost(path, body, host) {
    return fetch(apiUrl(path, false, host), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-bioindex-access-token": session_cookie,
        },
        body: JSON.stringify(body || {}),
    });
}

/**
 * Start a BioIndex query via GET or POST.
 * @param {"GET"|"POST"} method
 */
function startQueryRequest(index, q, { limit, fmt, host, method = "GET" } = {}) {
    if (String(method).toUpperCase() === "POST") {
        const body = { q };
        if (limit != null) {
            body.limit = limit;
        }
        if (fmt != null) {
            body.fmt = fmt;
        }
        return requestPost(`/api/bio/query/${index}`, body, host);
    }
    const params = { q, limit };
    if (fmt != null) {
        params.fmt = fmt;
    }
    return request(`/api/bio/query/${index}`, params, host);
}

function startContinuationRequest(token, { host, method = "GET" } = {}) {
    if (String(method).toUpperCase() === "POST") {
        return requestPost(`/api/bio/cont`, { token }, host);
    }
    return request(`/api/bio/cont`, { token }, host);
}

/* Perform a BioIndex query.
 */
export async function query(index, q, opts = {}) {
    let { limit, onResolve, onError, onLoad, limitWhile, host, method, fmt } = opts;
    let req = startQueryRequest(index, q, { limit, fmt, host, method });

    return await processRequest(req, onResolve, onError, onLoad, limitWhile, host, method);
}

/* Perform a BioIndex match.
 */
export async function match(index, q, opts = {}) {
    let { limit, onLoad, onResolve, onError, host } = opts;
    let req = request(`/api/bio/match/${index}`, { q, limit }, host);

    // perform the fetch, make sure it succeeds
    return await processRequest(req, onResolve, onError, onLoad, undefined, host);
}

/* Alters the json to filter results and stop continuing.
 */
function limitRecordsWhile(json, limitWhile) {
    let data = json.data;

    if (!!limitWhile) {
        data = json.data.filter(limitWhile);

        // no continuations if less data
        if (data.length < json.count) {
            json.continuation = null;
        }
    }

    return data;
}

/* Follow continuations and continue reading all data.
 */
async function processRequest(req, onResolve, onError, onLoad, limitWhile, host, method = "GET") {
    let resp = await req;
    let json = await resp.json();
    let data = [];

    // The `limitWhile` parameter assumes that the results of the
    // query are ordered in some way (e.g. by pValue), so that
    // when the test fails, we know that no more records will meet
    // the criteria either.

    // resolve or error
    if (resp.status === 200) {
        data = limitRecordsWhile(json, limitWhile);

        if (!!onResolve) {
            onResolve(json);
        }

        // this will also fail if resp.status !== 200
        while (!!json.continuation) {
            let contReq = startContinuationRequest(json.continuation, {
                host,
                method,
            });

            // follow the continuation
            resp = await contReq;
            json = await resp.json();

            if (resp.status === 200) {
                data = data.concat(limitRecordsWhile(json, limitWhile));

                if (!!onResolve) {
                    onResolve(json);
                }
            }
        }

        // done
        if (!!onLoad) {
            onLoad(json);
        }
    }

    if (resp.status !== 200) {
        if (!!onError) {
            onError(json);
        }
    }
    return data;
}
export const DEFAULT_SIGMA = 2;
export const DEFAULT_GENESET_SIZE = "small";
export const DEFAULT_TRAIT_GROUP = "all_but_hpo";
export const TRAIT_GROUPS = {
    "portal": "A2F", 
    "gcat_trait": "GWAS Catalog",
    "rare_v2": "Orphanet",
    "hpo": "HPO",
    "portal_exomes": "Exomes"};

export default {
    query,
    match,
    apiUrl,
    request,
    requestPost,
    rawUrl,
    BIO_INDEX_HOST,
    BIO_INDEX_HOST_PRIVATE,
    DEFAULT_SIGMA,
    DEFAULT_GENESET_SIZE,
    DEFAULT_TRAIT_GROUP,
    TRAIT_GROUPS
};
