// Methods
import querystring from "querystring";
import {BIO_INDEX_TYPE} from "./lz/lzConstants";

export const BIO_INDEX_HOST = "http://18.215.38.136:5000";

export async function* beginIterableQuery(json, errHandler) {
    console.log(json);
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
    [BIO_INDEX_TYPE.Gene]: function(args) {

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

export function majorFormat(data){
    // https://stackoverflow.com/a/51285298
    if (data.constructor == Object) {
        return 'c'
    } else if (data instanceof Array) {
        return 'r'
    }
}

export function findLeastStart(start, end, indexSearch) {
    let startIndex = -1;
    let k = start;
    while (true) {
        startIndex = indexSearch(k);
        if (startIndex == -1 && k < end) {
            k++;
        } else {
            break;
        }
    }
    return startIndex;
}

export function findMostEnd(start, end, indexSearch) {
    let endIndex = -1;
    let j = end;
    while (true) {
        endIndex = indexSearch(j);
        if (endIndex == -1 && j > start) {
            j--;
        } else {
            break;
        }
    }
    return endIndex;
}

export function dataFilter(format, propertyName) {
    return function(propertyValue) {
        return function (pointData) {
            if (format === "r") {
                return pointData.filter(datum => datum[propertyName] == propertyValue);  // we want casting
            } else if (format === "c") {
                if (pointData[propertyName]) {
                    // initialize a tempData object
                    let tempData = {};
                    Object.keys(pointData).forEach(property => {
                        tempData[propertyName] = [];
                    });

                    const columnFilterSeed =
                        pointData[propertyName]
                            .map(datum => (datum == propertyValue))
                            .map((datum, index) => { if (datum) { return index } })
                            .filter(x => typeof x !== "undefined");

                    // fill tempData object with data that's matched the filter
                    columnFilterSeed.forEach(index => {
                        Object.keys(pointData).forEach(property => {
                            tempData[propertyName][index] = pointData[propertyName][index];
                        });
                    });
                    return tempData;
                }
                // column first filtering
                // get only elements of array with positions in array
                // find indecies of elements satisfying property
                return pointData;

            }
        };
    };
};

export function dataRangeFilter(format, property) {
    return function (start, end) {
        return function (rangedData) {
            let startIndex = findLeastStart(start, end,
                point => (rangedData[property] || rangedData.map(item => item[property])).indexOf(point));
            let endIndex = findMostEnd(start, end,
                point => (rangedData[property] || rangedData.map(item => item[property])).lastIndexOf(point));

            if (format === "r") {

                if (startIndex !== -1 && endIndex !== -1) {
                    const value =  rangedData.slice(startIndex, endIndex !== -1 ? endIndex + 1 : rangedData.length);
                    return value;
                }
                return [];

            } else if (format === "c") {

                // initialize a tempData object
                let tempData = {};
                Object.keys(rangedData).forEach(property => {
                    tempData[property] = [];
                });
                if (startIndex !== -1 && endIndex !== -1) {

                    Object.keys(rangedData).forEach(property => {
                        tempData[property] = rangedData[property].slice(
                            startIndex,
                            endIndex !== -1 ? endIndex + 1 : rangedData[property].length + 1
                        );
                    });
                }
                return tempData;

            }

        }

    }
}
