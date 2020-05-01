/**
 * This is the module that is used to pull the uniprot data for a given gene

 */

// var convert = require('xml-js');
import $ from "jquery";
import queryString from "query-string";
import convert from "xml-js";
import jsonQuery from "json-query";

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            uniprotDoc: null,
        };
    },

    // commit methods
    mutations: {
        setUniprotDoc(state, doc) {
            state.uniprotDoc = doc;
        },

    },
    getters: {

        geneNames(state) {
            let geneNames = []
            let doc = state.uniprotDoc
            if (!!doc) {
                let geneNameInfo = doc.uniprot.entry.gene.name
                geneNames = jsonQuery('_text[*]', { data: geneNameInfo }).value
                return geneNames
            }

        },

        dbReference(state) {
            let doc = state.uniprotDoc
            let dbReferences = []
            if (!!doc) {
                let dbReferenceArrayObj = doc.uniprot.entry.dbReference
                for (let i in dbReferenceArrayObj) {
                    let attributes = jsonQuery('_attributes[*]', { data: dbReferenceArrayObj[i] }).value
                    let propertyAttributes = jsonQuery('property[**]_attributes[**][*]', { data: dbReferenceArrayObj[i] }).value
                    let values = jsonQuery('value[**]', { data: propertyAttributes }).value
                    dbReferences.push({ "source": attributes[0], "id": attributes[1], "proteinSeqID": values[0], "moleculeType": values[1] })
                }
                return dbReferences
            }
        },

        accession(state) {
            let doc = state.uniprotDoc
            if (!!doc) {
                let entryObject = doc.uniprot.entry
                // let entryAttribute = jsonQuery('_attribute[**]', { data: entryObject }).value
                let acessionIds = jsonQuery('_text[]', { data: entryObject.accession, output: [] }).value
                if (typeof (acessionIds) == "string") {
                    return [acessionIds]
                }
                return acessionIds
            }

        },

        geneFunction(state) {
            let doc = state.uniprotDoc
            if (!!doc) {
                let commentObject = doc.uniprot.entry.comment
                for (let i in commentObject) {
                    if (commentObject[i]._attributes.type == 'function') {
                        let geneFunction = jsonQuery('text[**]', { data: commentObject[i] }).value
                        return geneFunction[1]
                    }
                }

            }
        },
        //display just as text
        proteinExistence(state) {
            let doc = state.uniprotDoc
            let references = []
            references.push(_.get(doc.uniprot.entry.dbReference, '_text'))
            return references
        },
        feature(state) {

        }

    },

    // dispatch methods
    actions: {
        //this returns gene information using exact gene name in tab separated file
        async getUniprotGeneInfo(context, gene) {
            let limit = 1;
            let format = 'xml'
            let organism = 9606; // homosapein
            let query = 'gene_exact';
            let qs = queryString.stringify({ limit: 1, query: `${query}:${gene}`, format: format, organism: organism }, { skipNull: true });
            let uniprotDoc = await fetch(`https://www.uniprot.org/uniprot/?${qs}`)
                .then(response => response.text())
                .then(responseJson => JSON.parse(convert.xml2json(responseJson, { compact: true, spaces: 4 })))
            context.commit('setUniprotDoc', uniprotDoc)
        },
    },
}
