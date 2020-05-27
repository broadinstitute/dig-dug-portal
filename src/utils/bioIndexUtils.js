/* BioIndex Utilities
   - Data and methods useful for BioIndex that aren't worth keeping within a Vuex store
   - Includes constants like hostname (which can still be set via an environmental variable)
*/

import querystring from "query-string";

// Constants
export const BIO_INDEX_HOST = "http://18.215.38.136:5000";

export function buildBioIndexQueryString(queryObj) {
    const { feature, coords } = queryObj;
    let bis = '';
    switch(true) {
        case !!feature:
            bis = bis.concat(feature);
        case !!coords.chr:
            if (!!feature) {
                bis = bis.concat(',');
            }
            bis = bis.concat(coords.chr);
        // TODO: add compatibility for coords.position
        case !!coords.start || coords.start  === 0:
            bis = bis.concat(':', coords.start)
        case (!!coords.start || coords.start  === 0) && !!coords.end || coords.end === 0:
            bis = bis.concat('-', coords.end)
    }
    return bis;
}

/* Perform a BioIndex query.
 */
// NOTE: does pattern matching on the final three args make them necessary/mandatory for function to execute without errors?
// => it does mean that in order for this code to not throw errors, those final parameters cannot be optional per se,
//    but require an empty object for errors not to be reported.
export async function query(index, q, { limit, resolveHandler, errHandler, finishHandler }) {
    let qs = querystring.stringify({ q, limit }, { skipNull: true });
    let req = fetch(`${BIO_INDEX_HOST}/api/bio/query/${index}?${qs}`);

    // perform the fetch, make sure it succeeds
    return await processRequest(req, resolveHandler, errHandler, finishHandler);
}

/* Perform a BioIndex match.
 */
export async function match(index, q, { limit, resolveHandler, errHandler, finishHandler }) {
    let qs = querystring.stringify({ q, limit }, { skipNull: true });
    let req = fetch(`${BIO_INDEX_HOST}/api/bio/match/${index}?${qs}`);

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
    finishHandler(resp);
    return data;
}
