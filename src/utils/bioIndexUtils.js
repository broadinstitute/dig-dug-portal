/* BioIndex Utilities
   - Data and methods useful for BioIndex that aren't worth keeping within a Vuex store
   - Includes constants like hostname (which can still be set via an environmental variable)
*/

import querystring from "querystring";

// Constants
export const BIO_INDEX_HOST = "http://18.215.38.136:5000";

// Methods
/*  bioIndex Query Chain Iterator
    - Why? Because we want to encapsulate the behavior of continuations without duplicating them as state on the client.
    - Features like "pausing" and "more of..." need to maintain a sense of where on a chain of continuations they are,
        so that when users unpause or get more data after some time, they don't get data they already downloaded.
*/
async function* continuedIterableQuery(json, errHandler = null) {
    // NOTE: an existing response has to be passed in to *iterateQuery on initialization
    // if the continuation from the previous response isn't null, we can move the generator forward
    while (json.continuation) {
        let qs = querystring.encode({ token: json.continuation });
        json = await fetch(`${BIO_INDEX_HOST}/api/cont?${qs}`)
            .then(resp => {
                if (resp.status !== 200) {
                    throw Error(resp.status.toString());
                }

                return resp;
            })
            .then(resp => resp.json())
            .catch(errHandler);

        // note that generators are implicitly recursive:
        // they pass in their previous yields
        // into their args the next time they are called
        yield json;
    }
}

export async function* iterableQuery(index, { q, limit }, errHandler = null) {
    let qs = querystring.encode({ q, limit });
    let json = await fetch(`${BIO_INDEX_HOST}/api/query/${index}?${qs}`)
        .then(resp => {
            if (resp.status !== 200) {
                throw Error(resp.status.toString());
            }

            return resp;
        })
        .then(resp => resp.json())
        .catch(errHandler);

    // yield the result of the base case
    yield json;
    yield* continuedIterableQuery(json, errHandler);
};
