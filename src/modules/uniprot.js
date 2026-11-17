
import queryString from "query-string";
import convert from "xml-js";
import jsonQuery from "json-query";
import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

export default {
    namespaced: true,

    state() {
        return {
            uniprotDoc: null
        };
    },

    mutations: {
        setUniprotDoc(state, doc) {
            state.uniprotDoc = doc;
        }
    },
    getters: {

        geneNames(state) {
            let doc = state.uniprotDoc;
            if (!!doc) {
                return doc.genes.map(g => g.geneName.value);
            }
        },


        dbReference(state) {
            let doc = state.uniprotDoc;

            if (!!doc) {
                let dbReferenceArrayObj = doc.uniProtKBCrossReferences;
                let attributes = dbReferenceArrayObj.map(item => {
                    return {
                        source: item.database,
                        id: item.id,
                        proteinSeqID: item.properties.find(
                            e => e["key"] === "ProteinId"
                        )?.value,
                        moleculeType: item.properties.find(
                            e => e["key"] === "MoleculeType"
                        )?.value
                    };
                });
                return attributes;
            }
        },


        assession(state) {
            let doc = state.uniprotDoc;
            let assessions = [];
            if (!!doc) {
                assessions.push(doc.primaryAccession);
                assessions.push(...doc.secondaryAccessions);
            }
            return assessions;
        },




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

        proteinExistence(state) {
            let doc = state.uniprotDoc;
            return !!doc ? doc.proteinExistence : "";
        }
    },

    actions: {
        async getUniprotGeneInfo(context, gene) {
            let format = "json";
            let organism_id = 9606;
            let query = "gene_exact";
            let qs = `limit=1&query=(${query}:${gene})+AND+(organism_id:${organism_id})+AND+(reviewed:true)&format:${format}`;

            let alertID = postAlertNotice("Loading Uniprot data...");

            let uniprotDoc = await fetch(
                `https://rest.uniprot.org/uniprotkb/search?${qs}`
            )
                .then(response => {
                    if (!response.ok) {
                        throw new Error(
                            "HTTP error, status = " + response.status
                        );
                    }
                    return response.json();
                })
                .catch(error => {
                    postAlertError(error);
                })
                .finally(() => closeAlert(alertID));

            if (!!uniprotDoc) {
                context.commit("setUniprotDoc", uniprotDoc.results[0]);
            } else {
            }
        }
    }
};
