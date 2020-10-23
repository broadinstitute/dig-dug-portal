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

/* Returns the path for any BioIndex API end-point.
 */
export function apiUrl(path) {
    if (path.startsWith("/")) {
        path = path.substr(1);
    }

    return `${BIO_INDEX_HOST}/${path}`;
}

/* Useful for /api/raw end-points with query parameters.
 */
export function rawUrl(path, query_params) {
    let qs = querystring.stringify(query_params, { skipNull: true });

    return `${apiUrl(path)}${qs ? "?" + qs : ""}`;
}

/* Build a generic request to a BioIndex end-point.
 */
export async function request(path, query_params) {
    return fetch(rawUrl(path, query_params), {
        headers: {
            "x-bioindex-access-token": session_cookie
        }
    });
}

/* Perform a BioIndex query.
 */
export async function query(index, q, opts = {}) {
    let { limit, resolveHandler, errHandler, finishHandler, limitWhile } = opts;
    let req = request(`/api/bio/query/${index}`, { q, limit });

    return await processRequest(req, resolveHandler, errHandler, finishHandler, limitWhile);
}

/* Perform a BioIndex match.
 */
export async function match(index, q, opts = {}) {
    let { limit, finishHandler, resolveHandler, errHandler } = opts;
    let req = request(`/api/bio/match/${index}`, { q, limit });

    // perform the fetch, make sure it succeeds
    return await processRequest(req, resolveHandler, errHandler, finishHandler);
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
async function processRequest(req, resolveHandler, errHandler, finishHandler, limitWhile) {
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

        if (!!resolveHandler && typeof errHandler === 'function') {
            resolveHandler(json);
        }

        // this will also fail if resp.status !== 200
        while (!!json.continuation) {
            let req = request(`/api/bio/cont`, { token: json.continuation });

            // follow the continuation
            resp = await req;
            json = await resp.json();

            if (resp.status === 200) {
                data = data.concat(limitRecordsWhile(json, limitWhile));

                if (!!resolveHandler) {
                    resolveHandler(json);
                }
            }
        }

        // done
        if (!!finishHandler && typeof finishHandler === 'function'
        ) {
            finishHandler(json);
        }
    }

    if (resp.status !== 200) {
        if (!!errHandler && typeof errHandler === 'function') {
            errHandler(json);
        }
    }
    return data;
}
