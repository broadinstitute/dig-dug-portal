<template>
    <result-card-template :title="title">
        <template #subheader>
            <a @click="dispatchQuery('top-associations', locusFormatter(region))">
                Find Phenotypes Associations for {{gene.name}}
            </a>
        </template>
        <template #content>

            <div class="col-md-8">

                <div v-if="geneFunction">
                    <h4>
                        Function
                        <tooltip-documentation
                            name="gene.function.tooltip.hover"
                            :isHover="true"
                            :noIcon="false"
                        ></tooltip-documentation>
                    </h4>
                    <div>{{geneFunction}}</div>
                </div>
                <div v-else>
                    <h5>Gene function not found</h5>
                </div>

            </div>

            <div class="col-md-4">

                <h4>Info</h4>
                <div v-if="geneNames" class="alternative-names">
                    <strong>Alternative names:&nbsp;</strong>
                    <span
                        v-for="gene in alternateNames"
                        v-if="gene.source == 'alias'"
                        :key="gene.name"
                    >{{gene.name}}</span>&nbsp;
                </div>
                <div v-if="region">
                    <strong>Length:</strong>
                    {{" "+(region.end - region.start).toLocaleString()}} bp
                </div>
                <div>
                    <strong>Assembly:</strong> GRCh37
                </div>
                <div>
                    <strong>Gene sources:</strong>
                    <span>&nbsp;Ensembl, HGNC, UCSC, RGD, MGD</span>
                </div>

            </div>

            <div v-if="dbReference">
                <h4 class="card-title">
                    UniProt cross-references
                    <tooltip-documentation
                        name="gene.xref.tooltip.hover"
                        :isHover="true"
                        :noIcon="false"
                    ></tooltip-documentation>
                </h4>
                <uniprot-references-table v-bind:references="dbReference"></uniprot-references-table>
            </div>

        </template>
        <template #sidebar>
        </template>
    </result-card-template>
</template>
<script>
import Vue from "vue"
import Vuex from "vuex"
import ResultCardTemplate from "./ResultCardTemplate"

import uniprot from "@/modules/uniprot";
import bioIndex from "@/modules/bioIndex";
import UniprotReferenceTable from "@/components/UniprotReferencesTable"

import Formatters from "@/utils/formatters"

Vue.use(Vuex)

const store = new Vuex.Store({
    modules: {
        uniprot,
        genes: bioIndex('genes')
    },

   mutations: {
        setGeneName(state, geneName) {
            state.geneName = geneName || state.geneName;
            keyParams.set({ gene: state.geneName });
        
        },
        setGene(state, { name, chromosome, start, end }) {
            state.geneName = name;
            state.geneRegion = `${chromosome}:${start}-${end}`;
        }
    },

    getters: {
        region(state) {
            let data = state.gene.data;

            if (data.length > 0) {
                let gene = data[0];

                return {
                    chromosome: gene.chromosome,
                    start: gene.start,
                    end: gene.end,
                }
            }
        },

        canonicalSymbol(state) {
            let data = state.genes.data;

            for (let i in data) {
                if (data[i].source === 'symbol') {
                    return data[i].name;
                }
            }
        }
    },
    actions: {
        // // TODO refactor to computed property => region
        // async queryGeneName(context, symbol) {
        //     let name = symbol || context.state.geneName;
        //     context.commit('setGeneName', name);

        //     if (!!name) {
        //         context.dispatch('gene/query', { q: name });
        //     }
        // },

        // // TODO refactor to computed property => region
        async queryGeneRegion(context, region) {
            let { chromosome, start, end } = region;
            let q = `${chromosome}:${start}-${end}`;

            context.dispatch('genes/query', { q });
        },

        // TODO refactor to computed property => symbol
        async queryUniprot(context, symbol) {
            let name = symbol;
            console.log('getting uniprot info in card', symbol)
            if (!!symbol) {
                context.dispatch('uniprot/getUniprotGeneInfo', name);
            }
        }
    },
})

export default Vue.component('gene-result-card', {
    store,
    props: ["title", "geneData"],
    components: {
        ResultCardTemplate,
    },
    mounted() {
        const gene = this.geneData[0];
        // this.$store.dispatch('tapCard', 'hello');
        this.$store.dispatch('queryUniprot', gene.name);
    },
    methods: {
        locusFormatter: Formatters.locusFormatter,
        dispatchQuery(index, query) {
            this.$emit('pushQuery', { index, query })
        }
    },
    computed: {
        gene() {
            let data = this.geneData;
            if (data.length > 0) {
                return data[0];
            }
            return {};
        },
        region() {
            return {
                chromosome: this.gene.chromosome,
                start: this.gene.start,
                end: this.gene.end,
            }
        },
        alternateNames() {
            return this.$store.state.genes.data
                .filter(g => g.source !== "symbol")
                .sort((a, b) => {
                    if (a.source < b.source) return -1;
                    if (a.source > b.source) return 1;
                    return 0;
                });
        },
        dbReference() {
            return this.$store.getters["uniprot/dbReference"];
        },

        accession() {
            return this.$store.getters["uniprot/accession"];
        },

        geneFunction() {
            return this.$store.getters["uniprot/geneFunction"];
        },
        geneNames() {
            return this.$store.getters["uniprot/geneNames"];
        },
    },
    watch: {
        region(newRegion) {
            this.$store.dispatch('queryGeneRegion', newRegion)
        }
    }
})
</script>
