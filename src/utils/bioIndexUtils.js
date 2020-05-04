/* BioIndex Utilities
   - Data and methods useful for BioIndex that aren't worth keeping within a Vuex store
   - Includes constants like hostname (which can still be set via an environmental variable)
*/

import querystring from "query-string";
import * as _ from "lodash";

// Constants
export const BIO_INDEX_HOST = "http://18.215.38.136:5000";
export const BIO_INDEX_TYPE = Object.freeze({
    Gene: "gene",
    Genes: "genes",
    PhenotypeAssociations: "phenotype-associations",
    GlobalEnrichment: "global-enrichment",
    Associations: "associations",
    TopAssociations: "top-associations",
    Variant: "variant",
    Variants: "variants"
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
}

async function* iterateOnQuery(json, errHandler) {
    // NOTE: we're implicitly guarded by beginIterableQuery having correct base case information,
    // i.e. `{ index, q, limit }` – but this should be OK as long as iterateOnQuery is respected as private.
    do {
        let queryStr = makeBioIndexQueryStr(json);
        json = await portalFetch(queryStr, errHandler);
        yield json;
    } while (json.continuation);
}

export async function portalFetch(query, errHandler) {
    let resp = await fetch(query);
    let json = await resp.json();
    if (resp.status === 200) {
        return json;
    } else {
        errHandler(json);
    }
}

export async function fullQuery(
    queryJson,
    { condition, resolveHandler, errHandler }
) {
    let query = await beginIterableQuery(queryJson, errHandler);
    let accumulatedData = [];
    let done = false;

    do {
        let responseJson = await query.next();
        done = responseJson.done;

        if (!done) {
            accumulatedData = accumulatedData.concat(responseJson.value.data);
            resolveHandler(responseJson.value);
        }
    } while (condition() && !done);

    return accumulatedData;
}

export async function fullQueryFromUrl(initialUrl, resolveHandler, errHandler) {
    let { data, continuation } = await portalFetch(initialUrl, errHandler);
    let collectedData = [].concat(data);
    let currentContinuation = continuation;

    do {
        const newUrl = makeBioIndexQueryStr({
            continuation: currentContinuation
        });
        let response = await portalFetch(newUrl, errHandler);
        let { data, continuation } = response;
        collectedData = collectedData.concat(data);
        currentContinuation = continuation;
    } while (currentContinuation);

    return collectedData;
}

// Private methods
function makeBioIndexQueryStr(json) {
    const { index, q, limit, continuation } = json;
    // check for the continuation first, since index && q are going to be true in all valid cases
    // (they will only be false in malformed/invalid cases)
    if (continuation) {
        const qs = querystring.stringify(
            { token: continuation },
            { skipNull: true }
        );
        return `${BIO_INDEX_HOST}/api/bio/cont?${qs}`;
    } else if (index && q) {
        const qs = querystring.stringify({ q, limit }, { skipNull: true });
        return `${BIO_INDEX_HOST}/api/bio/query/${index}?${qs}`;
    }
}

const arityFilter = {
    [BIO_INDEX_TYPE.Associations]: function(args) {
        const { phenotype, chromosome, start, end } = args;
        return { phenotype, chromosome, start, end };
    },
    [BIO_INDEX_TYPE.PhenotypeAssociations]: function(args) {
        const { phenotype } = args;
        return { phenotype };
    },
    [BIO_INDEX_TYPE.TopAssociations]: function(args) {
        const { chromosome, start, end } = args;
        return { chromosome, start, end };
    },
    [BIO_INDEX_TYPE.Variants]: function(args) {
        const { chromosome, start, end } = args;
        return { chromosome, start, end };
    }
};

function queryTemplate(args) {
    let queryTemplateStr = "";
    if (args) {
        const { phenotype, varId, chromosome, start, end, position } = args;
        // logic below is based on the hierarchy of arities for bioIndex.
        if (phenotype) {
            queryTemplateStr = queryTemplateStr.concat(phenotype);
        } else if (varId) {
            queryTemplateStr = queryTemplateStr.concat(varId);
        }
        if (chromosome && (position || (start && end))) {
            if (!(queryTemplateStr === "")) {
                queryTemplateStr = queryTemplateStr.concat(",");
            }
            queryTemplateStr = queryTemplateStr.concat(`${chromosome}:`);
            if (position) {
                queryTemplateStr = queryTemplateStr.concat(`${position}`);
            } else if (start && end) {
                queryTemplateStr = queryTemplateStr.concat(`${start}-${end}`);
            }
        }
    }
    return queryTemplateStr;
}

export function moduleQueryTemplate(module, args) {
    return queryTemplate(arityFilter[module](args));
}

export function camelKebab(kebabcase) {
    const words = kebabcase.split("-");
    const capitalWords = words
        .splice(1)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1));
    return []
        .concat(words[0])
        .concat(capitalWords)
        .join("");
}
