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
export function apiUrl(path, query_private = false) {
    //console.log("apiURL call");
    if (path.startsWith("/")) {
        path = path.substr(1);
    }

    if (query_private) {
        //console.log("query_private:", query_private, path);
        return `${BIO_INDEX_HOST_PRIVATE}/${path}`;
    } else {
        //console.log("query_private is false:", query_private, path);
        return `${BIO_INDEX_HOST}/${path}`;
    }
}

/* Useful for /api/raw end-points with query parameters.
 */
export function rawUrl(path, query_params, query_private=false) {
    let qs = querystring.stringify(query_params, { skipNull: true });

    return `${apiUrl(path, query_private)}${qs ? "?" + qs : ""}`;
}

/* Build a generic request to a BioIndex end-point.
 */
export async function request(path, query_params, query_private=false) {
    return fetch(rawUrl(path, query_params, query_private), {
        headers: {
            "x-bioindex-access-token": session_cookie,
        },
    });
}

/* Perform a BioIndex query.
 */
export async function query(index, q, opts = {}, query_private=false) {
    //console.log("query function:"+index+"|"+query_private);
    let { limit, onResolve, onError, onLoad, limitWhile} = opts;
    let req = request(`/api/bio/query/${index}`, { q, limit }, query_private);

    return await processRequest(req, onResolve, onError, onLoad, limitWhile, query_private);
}

/* Perform a BioIndex match.
 */
export async function match(index, q, opts = {},query_private=false) {
    let { limit, onLoad, onResolve, onError } = opts;
    let req = request(`/api/bio/match/${index}`, { q, limit }, query_private);

    // perform the fetch, make sure it succeeds
    return await processRequest(req, onResolve, onError, onLoad, query_private);
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
async function processRequest(req, onResolve, onError, onLoad, limitWhile, query_private=false) {
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
            let req = request(`/api/bio/cont`, { token: json.continuation }, query_private);

            // follow the continuation
            resp = await req;
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

export default {
    query,
    match,
    apiUrl,
    request,
    rawUrl,
    BIO_INDEX_HOST,
    BIO_INDEX_HOST_PRIVATE,
};
