/**
 * This is the module that is used to pull the uniprot data for a given gene

 */

import queryString from "query-string";
import convert from "xml-js";
import jsonQuery from "json-query";
import {
    postAlertNotice,
    postAlertError,
    closeAlert,
} from "@/components/Alert";

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            gene: null,
            uniprotDoc: null,
        };
    },

    // commit methods
    mutations: {
        setUniprotDoc(state, doc) {
            state.uniprotDoc = doc;
        },
        setGene(state, gene) {
            state.gene = gene;
        },
    },
    getters: {
        // geneNames(state) {
        //     let geneNames = [];
        //     let doc = state.uniprotDoc;
        //     if (!!doc) {
        //         let geneNameInfo = doc.uniprot.entry.gene.name;
        //         geneNames = jsonQuery("_text[*]", { data: geneNameInfo }).value;
        //         return geneNames;
        //     }
        // },

        geneNames(state) {
            let doc = state.uniprotDoc;
            if (!!doc) {
                return doc.genes.map((g) => g.geneName.value);
            }
        },

        // dbReference(state) {
        //     let doc = state.uniprotDoc;
        //     let dbReferences = [];
        //     if (!!doc) {
        //         let dbReferenceArrayObj = doc.uniprot.entry.dbReference;
        //         for (let i in dbReferenceArrayObj) {
        //             let attributes = jsonQuery("_attributes[*]", {
        //                 data: dbReferenceArrayObj[i]
        //             }).value;
        //             let propertyAttributes = jsonQuery(
        //                 "property[**]_attributes[**][*]",
        //                 { data: dbReferenceArrayObj[i] }
        //             ).value;
        //             let values = jsonQuery("value[**]", {
        //                 data: propertyAttributes
        //             }).value;
        //             dbReferences.push({
        //                 source: attributes[0],
        //                 id: attributes[1],
        //                 proteinSeqID: values[0],
        //                 moleculeType: values[1]
        //             });
        //         }
        //         return dbReferences;
        //     }
        // },

        dbReference(state) {
            let doc = state.uniprotDoc;

            if (!!doc) {
                let dbReferenceArrayObj = doc.uniProtKBCrossReferences;
                let attributes = dbReferenceArrayObj.map((item) => {
                    return {
                        source: item.database,
                        id: item.id,
                        proteinSeqID: item.properties.find(
                            (e) => e["key"] === "ProteinId"
                        )?.value,
                        moleculeType: item.properties.find(
                            (e) => e["key"] === "MoleculeType"
                        )?.value,
                    };
                });
                return attributes;
            }
        },

        // accession(state) {
        //     let doc = state.uniprotDoc;
        //     if (!!doc) {
        //         let entryObject = doc.uniprot.entry;
        //         // let entryAttribute = jsonQuery('_attribute[**]', { data: entryObject }).value
        //         let acessionIds = jsonQuery("_text[]", {
        //             data: entryObject.accession,
        //             output: []
        //         }).value;
        //         if (typeof acessionIds == "string") {
        //             return [acessionIds];
        //         }
        //         return acessionIds;
        //     }
        // },

        assession(state) {
            let doc = state.uniprotDoc;
            let assessions = [];
            if (!!doc) {
                assessions.push(doc.primaryAccession);
                assessions.push(...doc.secondaryAccessions);
            }
            return assessions;
        },

        // geneFunction(state) {
        //     let doc = state.uniprotDoc;
        //     if (!!doc) {
        //         let commentObject = doc.uniprot.entry.comment;

        //         // most uniprot comments are an array, so ensure that
        //         if (!Array.isArray(commentObject)) {
        //             commentObject = [commentObject];
        //         }

        //         for (let i in commentObject) {
        //             if (commentObject[i]._attributes.type == "function") {
        //                 let geneFunction = jsonQuery("text[**]", {
        //                     data: commentObject[i]
        //                 }).value;
        //                 return geneFunction[1];
        //             }
        //         }
        //     }
        // },

        geneFunction(state) {
            let doc = state.uniprotDoc;
            if (!!doc) {
                let commentObject = doc.comments;
                for (let i in commentObject) {
                    if (commentObject[i].commentType == "FUNCTION") {
                        return commentObject[i].texts[0].value;
                    }
                }
            }
        },

        //display just as text
        // proteinExistence(state) {
        //     let doc = state.uniprotDoc;
        //     let references = [];
        //     // eliminated lodash here in to remove dependencies
        //     // previously was _.get
        //     references.push(
        //         !!doc.uniprot.entry.dbReference
        //             ? doc.uniprot.entry.dbReference
        //             : "_text"
        //     );
        //     return references;
        // }
        proteinExistence(state) {
            let doc = state.uniprotDoc;
            return !!doc ? doc.proteinExistence : "";
        },
    },

    // dispatch methods
    actions: {
        //this returns gene information using exact gene name in tab separated file
        async getUniprotGeneInfo(context, gene) {
            context.commit("setGene", gene);
            let format = "json";
            let organism_id = 9606; // homosapein
            let query = "gene_exact";
            // let qs = queryString.stringify(
            //     {
            //         limit: 1,
            //         query: `${query}:${gene}`,
            //         format: format,
            //         organism_id: organism_id
            //     },
            //     { skipNull: true }
            // );
            let qs = `limit=1&query=(${query}:${gene})+AND+(organism_id:${organism_id})+AND+(reviewed:true)&format=${format}`;

            let alertID = postAlertNotice("Loading Uniprot data...");

            let uniprotDoc = await fetch(
                `https://rest.uniprot.org/uniprotkb/search?${qs}`
            )
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            "HTTP error, status = " + response.status
                        );
                    }
                    return response.json();
                })
                .catch((error) => {
                    postAlertError(error);
                })
                .finally(() => closeAlert(alertID));

            if (!!uniprotDoc) {
                context.commit("setUniprotDoc", uniprotDoc.results[0]);
            } else {
                // TODO: postAlertError(some error message);
            }
        },
    },
};
