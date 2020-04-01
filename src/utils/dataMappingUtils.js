import { BIO_INDEX_TYPE } from "@/utils/bioIndexUtils";
import { calcLog, LZ_TYPE } from "@/utils/lz/lzUtils";
import { isFunction, isPlainObject, flatten } from "lodash";

export const BIO_INDEX_TO_LZ = Object.freeze({
    [BIO_INDEX_TYPE.PhenotypeAssociations]: LZ_TYPE.assoc,
    [BIO_INDEX_TYPE.Associations]: LZ_TYPE.assoc,
    [BIO_INDEX_TYPE.TopAssociations]: LZ_TYPE.assoc,
    [BIO_INDEX_TYPE.Genes]: LZ_TYPE.gene,
});

export const bioIndexMappings = {
    [BIO_INDEX_TYPE.Associations]: {
        // an example of a simple way of specifying schema mappings, including computed parameters (log_pvalue)
        [LZ_TYPE.assoc]: {
            phenotype: 'phenotype',
            id: 'varId',
            chr: 'chromosome',
            position: 'position',
            pvalue: 'pValue',
            log_pvalue: { func: calcLog, key: 'pValue' },
            ref_allele: 'reference',
            variant: 'varId',
        },
    },
    [BIO_INDEX_TYPE.Variant]: {
        // TODO
        ['transcriptConsequence']: parseVariantDataForTranscriptConsequences,
        // TODO
        [LZ_TYPE.assoc]: parseVariantDataForAssociations
    },
    [BIO_INDEX_TYPE.Variants]: {
        // an example of a custom function used for parsing, can be any function you want as long as it takes an array of data
        [LZ_TYPE.assoc]: parseVariantsDataForAssociations,
    },
}

let parseVariantDataForTranscriptConsequences = function (data) { return data.map(datum => datum.transcriptConsequence); };
let parseVariantDataForAssociations = function (data) { return data; };
function parseVariantsDataForAssociations(variants) {
    return flatten(variants.filter(variant => typeof variant.associations != 'undefined').map(variant => {
        return variant.associations.map(association => ({
            chr: variant.chromosome,
            position: variant.position,
            ref_allele: variant.varId,
            pvalue: association.pValue,
            log_pvalue: calcLog(association.pValue),
            phenotype: association.phenotype,
        }));
    }));
};

export function createSchemaTranslator(schemaTo, bioIndexFrom, basicMappings) {
    //console.log(basicMappings, bioIndexFrom, schemaTo);
    const translationMap = basicMappings[bioIndexFrom][schemaTo];
    /*
    * translation mappings obey the following structure:
    * - { access: <optional string>, mapping: <object> } OR { ...mapping }
    * and values inside of mapping obey the following structure:
    * - <string> OR { func: <optional function>, key: <string> }
    * */
    // TODO: refactor so that schemaParserAndMapper can be used as a function?
    return function (data) {
        if (isFunction(translationMap)) {
            return translationMap(data)
        } else if (isPlainObject(translationMap)) {
            return schemaParserAndMapper(data, translationMap);
        };
    };
};

const schemaParserAndMapper = function (data, translationMap) {

    // STEP 0: get the property mapping from schema A to schema B
    // Note that the order matters: translationMap will always return the whole object,
    // so if we don't have a sub-object called 'mapping' that encodes the information we want,
    // then we assume that the whole object is actually the mapping.
    // (This means that 'mapping' is a reserved keyword that BioIndex can't use but it's unlikely it would)
    let mapping = translationMap.mapping || translationMap;

    // STEP 1: focus data down to the operable collection for re-mapping (this process is called "lensing" in FP parlance)
    // We assume that if no `access` rules are defined, then we assume the original data is properly lensed
    // else if we have accessors then we traverse the data we were given until we get the data we want to translate schemas for
    // TODO: Note that this means we only support depth-first access patterns on data, and are also assuming the resulting lens is an mappable collection

    let lensedData = data;
    // access rules are only tenable in the format where the `mapping` property exists, so we'll check for that first
    if (translationMap.mapping && translationMap.access) {
        // parse accessor string, then
        translationMap.access.split(':').every(accessor => {
            // sometimes we don't get an accessor
            if (lensedData[accessor]) {
                lensedData = lensedData[accessor]
            }
            return typeof lensedData[accessor] != 'undefined'
        });
    };

    // STEP 2: apply the remapping upon the operable collection,
    // including computed properties not inside the original data, like log_pvalue for BioIndex -> LocusZoom
    let remappedData = [];
    // traverse the extracted data
    lensedData.forEach(datum => {
        // create a temporary object that will eventually hold our translated datapoint
        let tempDatum = {};
        // parse the mapping
        // forEach key in mapping, get the data from datum from value in mapping for key
        Object.keys(mapping).forEach((property, index) => {

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

            } else {  // mapping[property] must be a string if it's not an object

                // CASE: the mapping property encodes a string which points to another property in the data
                if (mapping[property].charAt(0) === '@') {

                    // i.e. nothing on the left side of '@'
                    const accessPatternOrProperty = mapping[property].split('@');
                    if (accessPatternOrProperty[0] === '') {
                        const oldProperty = accessPatternOrProperty[1];
                        tempDatum[property] = data[oldProperty];
                    }

                    // CASE: the mapping property encodes for string which can be straightforwardly accessed in the object
                } else {
                    tempDatum[property] = datum[mapping[property]];
                }

            }

        });

        // add our remapped datapoint to the data that will be returned
        remappedData.push(tempDatum);

    });

    return remappedData;

}


/* TESTS */
const TEST = false;
if (TEST) {

    const flatData = [{ property1a: 'hello', property1b: 'my', property1c: 'good', property1d: 'friend' }];
    const nestData = [{ property1b: 'my', property1c: 'good', property1d: 'friend' }]

    const struct1Data = [{
        property1a: 'goodbye',
        struct1: flatData,
    }];
    const struct2Data = [{
        struct2: struct1Data,
    }];

    const testMappings = {
        a1: {
            b: {
                property2a: 'property1a',
                property2b: 'property1b',
                property2c: { key: 'property1c' },
                property2d: { func: id => id.concat(':a1'), key: 'property1d' }
            }
        },
        a2: {
            b: {
                mapping: {
                    property2a: 'property1a',
                    property2b: 'property1b',
                    property2c: { key: 'property1c' },
                    property2d: { func: id => id.concat(':a2'), key: 'property1d' }
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
                    property2d: { func: id => id.concat(':a3'), key: 'property1d' }
                }
            }
        },
        a4: {
            b: {
                access: 'struct1',
                mapping: {
                    property2a: '@property1a',
                    property2b: 'property1b',
                    property2c: { key: 'property1c' },
                    property2d: { func: id => id.concat(':a4'), key: 'property1d' }
                }
            }
        }
    };

    // Positive Cases

    // Case 1/2: No accessors (i.e. the Associations case)
    console.log('case1/2');
    // create schema remapping generator
    const abTranslator1 = createSchemaTranslator('b', 'a1', testMappings);  // schema
    const abTranslator2 = createSchemaTranslator('b', 'a2', testMappings);  // mapping: { ...schema }
    console.log(abTranslator1(flatData));  // Case 1: basic schema definition syntax
    // RESULT: [ { 'property2a': 'hello', 'property2b': 'my', 'property2c': 'good', 'property2d': 'friend:a1',  } ]
    console.log(abTranslator2(flatData));  // Case 2: expanded schema definition syntax
    // RESULT: [ { 'property2a': 'hello', 'property2b': 'my', 'property2c': 'good', 'property2d': 'friend:a2',  } ]

    // Case 3: Single accessor
    console.log('case3');
    // TODO: recover the structure of the accessor as an option?
    const abTranslator3 = createSchemaTranslator('b', 'a3', testMappings);
    console.log(struct1Data.map(datum => abTranslator3(datum))[0]);
    // RESULT: [ { 'property2a': 'hello', 'property2b': 'my', 'property2c': 'good', 'property2d': 'friend:a3',  } ]

    // Case 4: Single accessor with property injection (i.e. the Variant case)
    console.log('case4');
    const abTranslator4 = createSchemaTranslator('b', 'a4', testMappings);
    console.log(struct1Data.map(datum => abTranslator4(datum))[0]);
    // RESULT: [ { 'property2a': 'goodbye', 'property2b': 'my', 'property2c': 'good', 'property2d': 'friend:a4',  } ]


    // Test: it can take a function
    const testMapWithFunction = {
        a: { b: function (data) { console.log("i'm a function"); return data; } }
    };
    const identityTranslator = createSchemaTranslator('b', 'a', testMapWithFunction);
    // console.log(identityTranslator(flatData));
    // RESULT: [ { 'property2a': 'hello', 'property2b': 'my', 'property2c': 'good', 'property2d': 'friend:a1',  } ]


    // TODO: Negative Cases (these should throw exceptions)
    // Case 1: Non-existent accessors (underdrill)
    // Case 2: Non-existent accessors (overdrill)
    // Case 2: No such property in source data

};
