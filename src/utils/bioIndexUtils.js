/* BioIndex Utilities
   - Data and methods useful for BioIndex that aren't worth keeping within a Vuex store
   - Includes constants like hostname (which can still be set via an environmental variable)
*/

import querystring from "query-string";
import * as _ from "lodash";

// Constants
export const BIO_INDEX_HOST = "http://18.215.38.136:5000";
export const BIO_INDEX_TYPE = Object.freeze({
    Gene: 'gene',
    Genes: 'genes',
    PhenotypeAssociations: 'phenotype-associations',
    GlobalEnrichment: 'global-enrichment',
    Associations: 'associations',
    TopAssociations: 'top-associations',
    Variant: 'variant',
    Variants: 'variants',
});

// Methods
/*  bioIndex Query Chain Iterator
    - Why? Because we want to encapsulate the behavior of continuations without duplicating them as state on the client.
    - Features like "pausing" and "more of..." need to maintain a sense of where on a chain of continuations they are,
        so that when users unpause or get more data after some time, they don't get data they already downloaded.
*/
export async function* beginIterableQuery(json, errHandler) {
    const { index, q, limit } = json;
    yield* iterateOnQuery({ index, q, limit }, errHandler);
};

async function* iterateOnQuery(json, errHandler) {
    // NOTE: we're implicitly guarded by beginIterableQuery having correct base case information,
    // i.e. `{ index, q, limit }` – but this should be OK as long as iterateOnQuery is respected as private.
    do {
        let queryStr = makeBioIndexQueryStr(json);
        json = await portalFetch(queryStr, errHandler);
        yield json;
    } while(json.continuation);
}

async function portalFetch(query, errHandler) {
    let json = await fetch(query)
        .then(resp => {
            if (resp.status !== 200) {
                throw Error(resp.status.toString());
            }
            return resp;
        })
        .then(resp => resp.json())
        .catch(errHandler);
    return json;
};

// return all of the data in the query chain at once
async function fullQuery(json, errHandler) {
    let query = await beginIterableQuery(json,errHandler);
    let data = [];
    let continuation;

    do {
        const { currentData, currentContinuation } = query.next();
        data.push(currentData);
        continuation = currentContinuation;
    } while(continuation);

    return data;
};


// Private methods
function makeBioIndexQueryStr(json) {
    const { index, q, limit, continuation } = json;
    // check for the continuation first, since index && q are going to be true in all valid cases
    // (they will only be false in malformed/invalid cases)
    if (continuation) {
        const qs = querystring.stringify({ token: continuation }, { skipNull: true });
        return `${BIO_INDEX_HOST}/api/bio/cont?${qs}`;
    } else if (index && q) {
        const qs = querystring.stringify({ q, limit }, { skipNull: true });
        return `${BIO_INDEX_HOST}/api/bio/query/${index}?${qs}`
    }
};
