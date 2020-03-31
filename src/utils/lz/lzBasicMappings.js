import { BIO_INDEX_TYPE } from "@/utils/bioIndexUtils";
import { LZ_TYPE } from "@/utils/lz/lzSchemas";
import { calcLog } from "@/utils/lz/lzUtils";

const bioIndexToLzMappings = {
    [BIO_INDEX_TYPE.Associations]: {
        [LZ_TYPE.assoc]: {
            phenotype: 'phenotype',
            id: 'varId',
            chr: 'chromosome',
            position: 'position',
            pvalue: 'pvalue',
            log_pvalue: { func: calcLog, key: 'pvalue' },
            ref_allele: 'reference',
            variant: 'varId',
        }
    },
    [BIO_INDEX_TYPE.Variants]: {
        [LZ_TYPE.assoc]: {
            access: 'associations',
            mapping: {
                phenotype: 'phenotype',
                id: 'varId',
                chr: 'chromosome',
                position: 'position',
                pvalue: 'pvalue',
                log_pvalue: { func: calcLog, key: 'pvalue' },
                ref_allele: 'reference',
                variant: 'varId',
            },
        },
    },
}

export function lzCreateSchemaMap(schemaTo, bioIndexFrom, basicMappings) {
    const translationMap = basicMappings[bioIndexFrom][schemaTo];
    /*
    * translation mappings obey the following structure:
    * - { access: <optional string>, mapping: <object> } OR { ...mapping }
    * and values inside of mapping obey the following structure:
    * - <string> OR { func: <optional function>, key: <string> }
    * */
    return function (data) {
        // STEP 0: get the property mapping from schema A to schema B
        // Note that the order matters: translationMap will always return the whole object,
        // so if we don't have a sub-object called 'mapping' that encodes the information we want,
        // then we assume that the whole object is actually the mapping.
        // (This means that 'mapping' is a reserved keyword that BioIndex can't use but it's unlikely it would)
        let mapping = translationMap.mapping || translationMap;
        console.log(mapping);
        // STEP 1: focus data down to the operable collection for re-mapping (this process is called "lensing" in FP parlance)
        // We assume that if no `access` rules are defined, then we assume the original data is properly lensed
        // else if we have accessors then we traverse the data we were given until we get the data we want to translate schemas for
        // TODO: Note that this means we only support depth-first access patterns on data, and are also assuming the resulting lens is an mappable collection
        let lensedData = data;
        console.log(data);

        // access rules are only tenable in the format where the `mapping` property exists, so we'll check for that first
        if (translationMap.mapping) {
            if (translationMap.access) {
                // parse accessor string, then
                // sequential access: drill in through assumed levels of the object
                translationMap.access.split(':').forEach(accessor => {
                    // assume access path is correct
                    // TODO: if not throw error? or fail nicely? throw error out-loop (breaking) or in-loop (not-breaking?)
                    try {
                        // apply accesses to data
                        // extract out data we wanted to access
                        lensedData = lensedData[accessor];
                    } catch (e) {
                        throw new Error(e);
                    }
                });
            };
        };

        // STEP 2: apply the remapping upon the operable collection,
        // including computed properties not inside the original data, like log_pvalue for BioIndex -> LocusZoom
        let remappedData = [];
        // traverse the extracted data
        lensedData.forEach(datum => {
            console.log(datum);

            // create a temporary object that will eventually hold our translated datapoint
            let tempDatum = {};
            // parse the mapping
            try {
                // forEach key in mapping, get the data from datum from value in mapping for key
                Object.keys(mapping).forEach(property => {
                    console.log(mapping[property], property);

                    // apply the mapping for property in the target schema, from the equivalent property in the source data

                    if (mapping[property].constructor == Object) {

                        // CASE: the mapping encodes for { func: <optional function>, key: <string> }
                        // i.e. target[property] = func(source[key])
                        // e.g. target['log_pvalue'] = calcLog(source['pvalue'])
                        // NOTE: we only apply 'func' if it's available.
                        let tempDatumProp = datum[mapping[property].key];
                        if (mapping[property].func) {
                            tempDatumProp = mapping[property].func(tempDatumProp);
                        }
                        tempDatum[property] = tempDatumProp;

                    } else {

                        // CASE: the mapping property encodes for string which can be straightforwardly accessed in the object
                        tempDatum[property] = datum[mapping[property]];

                    }

                });

                // add our remapped datapoint to the data that will be returned
                remappedData.push(tempDatum);

            } catch (e) {
                throw new Error(e);
            }

        });

        return remappedData;

    };
};

/* TESTS */
const flatData = [{ property1a: 'hello', property1b: 'my', property1c: 'good', property1d: 'friend' }];
const struct1Data = {
    struct1: flatData,
};
const struct2Data = {
    struct2: struct1Data,
};
const testMappings = {
    a1: {
        b: {
            property2a: 'property1a',
            property2b: 'property1b',
            property2c: { key: 'property1c' },
            property2d: { func: id => id.concat(':a1'), key: 'property1d'}
        }
    },
    a2: {
        b: {
            mapping: {
                property2a: 'property1a',
                property2b: 'property1b',
                property2c: { key: 'property1c' },
                property2d: { func: id => id.concat(':a2'), key: 'property1d'}
            }
        }
    },
    a3: {
        b: {
            access: 'struct1',
            mapping: {
                property2a: 'property1a',
                property2b: 'property1b',
                property2c: { key: 'property1c' },
                property2d: { func: id => id.concat(':a3'), key: 'property1d'}
            }
        }
    },
    a4: {
        b: {
            access: 'struct2:struct1',
            mapping: {
                property2a: 'property1a',
                property2b: 'property1b',
                property2c: { key: 'property1c' },
                property2d: { func: id => id.concat(':a4'), key: 'property1d'}
            }
        }
    },
};



// Positive Cases

// Case 1: No accessors
console.log('case1');
// create schema remapping generator
const abTranslator1 = lzCreateSchemaMap('b', 'a1', testMappings);  // schema
const abTranslator2 = lzCreateSchemaMap('b', 'a2', testMappings);  // mapping: { ...schema }

console.log(abTranslator1(flatData));
// RESULT: [ { 'property2a': 'hello', 'property2b': 'my', 'property2c': 'good', 'property2d': 'friend:a1',  } ]
console.log(abTranslator2(flatData));
// RESULT: [ { 'property2a': 'hello', 'property2b': 'my', 'property2c': 'good', 'property2d': 'friend:a2',  } ]

// Case 2: Single accessor
console.log('case2');
// TODO: recover the structure of the accessor as an option?
const abTranslator3 = lzCreateSchemaMap('b', 'a3', testMappings);
console.log(abTranslator3(struct1Data));
// RESULT: [ { 'property2a': 'hello', 'property2b': 'my', 'property2c': 'good', 'property2d': 'friend:a3',  } ]

// Case 3: Nested accessors
console.log('case3');
const abTranslator4 = lzCreateSchemaMap('b', 'a4', testMappings);
console.log(abTranslator4(struct2Data));
// RESULT: [ { 'property2a': 'hello', 'property2b': 'my', 'property2c': 'good', 'property2d': 'friend:a4',  } ]

// Negative Cases
// Case 1: Non-existent accessors (underdrill)
// Case 2: Non-existent accessors (overdrill)
// Case 2: No such property in source data

// Ecological Cases
// Case 1: Associations -> assoc (=== flatData)
// Case 2: Variants -> Associations -> assoc (=== struct1Data)
