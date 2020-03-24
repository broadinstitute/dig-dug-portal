// Methods
import querystring from "querystring";
import {BIO_INDEX_TYPE} from "./lz/lzConstants";

export const BIO_INDEX_HOST = "http://18.215.38.136:5000";

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

function makeBioIndexQueryStr(json) {
    const { index, q, limit, continuation } = json;
    // check for the continuation first, since index && q are going to be true in all valid cases
    // (they will only be false in malformed/invalid cases)
    if (continuation) {
        const qs = querystring.encode({ token: continuation });
        return `${BIO_INDEX_HOST}/api/cont?${qs}`;
    } else if (index && q) {
        const qs = querystring.encode({ q, limit });
        return `${BIO_INDEX_HOST}/api/query/${index}?${qs}`
    }
};

export const arityFilter = {
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
    [BIO_INDEX_TYPE.Gene]: function(args) {

    }
};

export function queryTemplate({ phenotype, varId, chromosome, start, end, position }) {
    let queryTemplateStr = '';

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

    return queryTemplateStr;
}
