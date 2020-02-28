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
export async function *continuedIterableQuery (response, errHandler=null) {
    // NOTE: an existing response has to be passed in to *iterateQuery on initialization
    // if the continuation from the previous response isn't null, we can move the generator forward
    while (response.continuation) {
        let qs = querystring.encode({ token: response.continuation });
        response = await fetch(`${BIO_INDEX_HOST}/api/cont?${qs}`)
            .then(resp => {
                if (resp.status === 200) {
                    return resp;
                } else if (resp.status >= 400) {
                    throw Error(resp.status.toString());
                }
            })
            .then(resp => resp.json())
            .catch(error => {
                if (error.message == 400) {  // we want type coercion
                    // TODO: reset the query?
                    // I can't and probably shouldn't do that in here...
                    // TODO: it would require me to internalize the base query case?
                    return errHandler(error);
                }
            });

        // note that generators are implicitly recursive:
        // they pass in their previous yields
        // into their args the next time they are called
        yield response;
    }
}

export async function *iterableQuery (index, {q, limit}, errHandler = null) {
    let qs = querystring.encode({q, limit});
    let response = await fetch(
        `${BIO_INDEX_HOST}/api/query/${index}?${qs}`
    ).then(resp => resp.json());
    // yield the result of the base case
    yield response;
    yield* continuedIterableQuery(response, errHandler);
};
