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

    return `${apiUrl(path)}?${qs || ""}`;
}

/* Build a generic request to a BioIndex end-point.
 */
export async function request(path, query_params) {
    return fetch(rawUrl(path, query_params), {
        headers: {
            // "x-bioindex-access-token": session_cookie,
            // "Content-Type": "text/plain",
            // "Access-Control-Max-Age": 600
        }
    });
}

/* Perform a BioIndex query.
 */
export async function query(index, q, opts = {}) {
    let { limit, resolveHandler, errHandler, finishHandler } = opts;
    let req = request(`/api/bio/query/${index}`, { q, limit });

    return await processRequest(req, resolveHandler, errHandler, finishHandler);
}

/* Perform a BioIndex match.
 */
export async function match(index, q, opts = {}) {
    let { limit, finishHandler, resolveHandler, errHandler } = opts;
    let req = request(`/api/bio/match/${index}`, { q, limit });

    // perform the fetch, make sure it succeeds
    return await processRequest(req, resolveHandler, errHandler, finishHandler);
}

/* Follow continuations and continue reading all data.
 */
async function processRequest(req, resolveHandler, errHandler, finishHandler) {
    let resp = await req;
    let json = await resp.json();
    let data = [];

    // resolve or error
    if (resp.status === 200) {
        data = json.data;

        if (!!resolveHandler) {
            resolveHandler(json);
        }

        // this will also fail if resp.status !== 200
        while (!!json.continuation) {
            let req = request(`/api/bio/cont`, { token: json.continuation });

            // follow the continuation
            resp = await req;
            json = await resp.json();

            if (resp.status === 200) {
                data = data.concat(json.data);

                if (!!resolveHandler) {
                    resolveHandler(json);
                }
            }
        }
        if (!!finishHandler) {
            finishHandler(json);
        }
    }

    if (resp.status !== 200) {
        if (!!errHandler) {
            errHandler(json);
        }
    }
    return data;
}
