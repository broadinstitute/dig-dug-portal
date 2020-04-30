/**
 * This is the module that is used to pull the uniprot data for a given gene

 */

// var convert = require('xml-js');
import $ from "jquery";
import queryString from "query-string";
import convert from "xml-js";
import jq from "node-jq"

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
            geneNames.push({ 'gene': _.get(doc.uniprot.entry.gene.name[0], '_text') })
            return geneNames
        },
        references(state) {
            let doc = state.uniprotDoc
            let references = []
            if (!!doc) {
                references.push({ 'references': _.get(doc.uniprot.entry.dbReference[0].property[0]._attributes, 'type') })

            }
            return references
        },
        //get the accession ids
        accession(state) {
            let doc = state.uniprotDoc
            let references = []
            references.push(_.get(doc.uniprot.entry.dbReference, '_text'))
            return references
        }

    },

    // dispatch methods
    actions: {
        //this returns gene information using exact gene name in tab separated file
        async getUniprotGeneInfo(context, gene) {
            let limit = 1;
            let format = 'xml'
            let organism = 9606
            let qs = queryString.stringify({ limit: 1, query: `gene_exact:${gene}`, format: format, organism: organism }, { skipNull: true });
            let uniprotDoc = await fetch(`https://www.uniprot.org/uniprot/?${qs}`)
                .then(response => response.text())
                .then(responseJson => JSON.parse(convert.xml2json(responseJson, { compact: true, spaces: 4 })))
            context.commit('setUniprotDoc', uniprotDoc)
        },
    },
}
