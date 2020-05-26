/* BioIndex Utilities
   - Data and methods useful for BioIndex that aren't worth keeping within a Vuex store
   - Includes constants like hostname (which can still be set via an environmental variable)
*/

import querystring from "query-string";

// Constants
export const BIO_INDEX_HOST = "http://18.215.38.136:5000";


/* Perform a BioIndex query.
 */
export async function query(index, q, { limit, resolveHandler, errHandler }) {
    let qs = querystring.stringify({ q, limit }, { skipNull: true });
    let req = fetch(`${BIO_INDEX_HOST}/api/bio/query/${index}?${qs}`);

    // perform the fetch, make sure it succeeds
    return await processRequest(req, resolveHandler, errHandler);
}

/* Perform a BioIndex match.
 */
export async function match(index, q, { limit, resolveHandler, errHandler }) {
    let qs = querystring.stringify({ q, limit }, { skipNull: true });
    let req = fetch(`${BIO_INDEX_HOST}/api/bio/match/${index}?${qs}`);

    // perform the fetch, make sure it succeeds
    return await processRequest(req, resolveHandler, errHandler);
}

/* Follow continuations and continue reading all data.
 */
async function processRequest(req, resolveHandler, errHandler) {
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
            let qs = querystring.stringify({ token: json.continuation });

            // follow the continuation
            resp = await fetch(`${BIO_INDEX_HOST}/api/bio/cont?${qs}`);
            json = await resp.json();

            if (resp.status === 200) {
                data = data.concat(json.data);

                if (!!resolveHandler) {
                    resolveHandler(json);
                }
            }
        }
    }

    if (resp.status !== 200) {
        if (!!errHandler) {
            errHandler(json);
        }
    }

    return data;
}
