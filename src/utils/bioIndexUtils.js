/* BioIndex Utilities
   - Data and methods useful for BioIndex that aren't worth keeping within a Vuex store
   - Includes constants like hostname (which can still be set via an environmental variable)
*/

import querystring from "query-string";

// Constants
export const BIO_INDEX_HOST = "http://18.215.38.136:5000";
export const BIO_INDEX_TYPE = Object.freeze({
    test: 'test',
    Gene: 'Gene',
    Genes: 'Genes',
    PhenotypeAssociations: 'PhenotypeAssociations',
    GlobalEnrichment: 'GlobalEnrichment',
    AnnotatedRegions: 'AnnotatedRegions',
    Associations: 'Associations',
    TopAssociations: 'TopAssociations',
    Variant: 'Variant',
    Variants: 'Variants',
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
    } while (json.continuation);
}

async function portalFetch(query, errHandler) {
    return await fetch(query)
        .then(resp => {
            if (resp.status !== 200) {
                throw Error(resp.status.toString());
            }
            return resp;
        })
        .then(resp => resp.json())
        .catch(errHandler);
};


// Private methods
function makeBioIndexQueryStr(json) {
    let { index, q, limit, continuation } = json;

    // handle null limit
    limit = (!!limit) ? limit : null;

    // check for the continuation first, since index && q are going to be true in all valid cases
    // (they will only be false in malformed/invalid cases)
    if (continuation) {
        const qs = querystring.stringify({ token: continuation });
        return `${BIO_INDEX_HOST}/api/bio/cont?${qs}`;
    } else if (index && q) {
        const qs = querystring.stringify({ q, limit }, { skipNull: true });
        return `${BIO_INDEX_HOST}/api/bio/query/${index}?${qs}`
    }
};

export function majorFormat(data) {
    // https://stackoverflow.com/a/51285298
    if (data.constructor == Object) {
        return 'c'
    } else if (data instanceof Array) {
        return 'r'
    }
}

const arityFilter = {
    [BIO_INDEX_TYPE.Associations]: function (args) {
        const { phenotype, chromosome, start, end } = args;
        return { phenotype, chromosome, start, end };
    },
    [BIO_INDEX_TYPE.PhenotypeAssociations]: function (args) {
        const { phenotype } = args;
        return { phenotype };
    },
    [BIO_INDEX_TYPE.TopAssociations]: function (args) {
        const { chromosome, start, end } = args;
        return { chromosome, start, end };
    },
    [BIO_INDEX_TYPE.Gene]: function (args) {

    }
};

function queryTemplate(args) {
    let queryTemplateStr = '';
    if (args) {
        const { phenotype, varId, chromosome, start, end, position } = args;
        // logic below is based on the hierarchy of arities for bioIndex.
        if (phenotype) {
            queryTemplateStr = queryTemplateStr.concat(phenotype)
        } else if (varId) {
            queryTemplateStr = queryTemplateStr.concat(varId)
        }

        if (chromosome && (position || start && end)) {
            if (!(queryTemplateStr === '')) {
                queryTemplateStr = queryTemplateStr.concat(',');
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

export function buildModuleQuery(module, params) {
    return queryTemplate(arityFilter[module](params))
}
