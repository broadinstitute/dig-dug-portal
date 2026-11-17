import queryString from "query-string";
const myGeneAPI = 'https://mygene.info/v3';
export default {
    namespaced: true,

    state() {
        return {
            geneInfo: []
        };
    },

    mutations: {
        setGeneInfo(state, geneInfo) {
            state.geneInfo = geneInfo;
        }
    },

    actions: {
        async infoForGeneSymbol(context, { geneSymbol, fields=[] }) {
            let qs = queryString.stringify({
                q: geneSymbol,
                fields,
            }, { arrayFormat: 'comma' });
            let json = await fetch(`${myGeneAPI}/query?${qs}`, { contentType: "application/json" })
                .then(async resp => {
                    if (resp.status === 200) {
                        const geneSymbolMatches = await resp.json();
                        return geneSymbolMatches.hits;
                    } else {
                        throw new Error(`MyGene Info returning non-successful code ${resp.status}`);
                    }
                })
                .then(json => context.commit('setGeneInfo', json))
                .catch(error => console.error(error));
            return json;
        }
    }
};
