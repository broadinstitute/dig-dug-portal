

import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";
// import variantUtils from "@/utils/variantUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        gene: bioIndex("gene"),
        uniprot,

    },
    state: {
        geneName: keyParams.gene,
        newGeneName: keyParams.gene,
    },

    mutations: {
        setGene(state, geneName) {
            state.geneName = geneName || state.newGeneName;
            state.newGeneName = state.geneName
            keyParams.set({ gene: state.newGeneName })
        },

    },
    actions: {
        async queryGene(context) {
            let geneName = context.state.geneName
            console.log(geneName)
            context.commit('setGene', context.state.geneName);
            await context.dispatch('gene/query', { q: geneName });

            let limit = 10;
            let format = 'xml';

            let xml = await fetch(`https://www.uniprot.org/uniprot/?query=gene_exact=` + geneName + `format=` + format + `include=no&limit=` + limit)
                .then(resp => resp.text())
                .then(xmlString => xmlString.evaluate('//lineage', xmlString, null, XPathResult.STRING_TYPE, null))
                .then(data => console.log(data));


            // .then(response => response.text())
            // .then(xmlString => $.parseXML(xmlString))
            // .then(data => console.log(data))
            //process this xml using xpath
            // let uniprotObject = data.evaluate('//lineage', data, null, XPathResult.STRING_TYPE, null);
            console.log(uniprotObject)


        },

    }

});
