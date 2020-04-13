<template>
    <div>
        <div class="filtering-tools">
            <table class="mb-4" width="100%">
                <thead>
                    <th>Phenotype</th>
                    <th>P-Value</th>
                    <th>Sample Size (N)</th>
                    <th>Effect</th>
                    <th>Chromosome</th>
                </thead>
                <tbody>
                    <tr v-if="applyAll">
                        <td>
                            <button
                                type="button"
                                class="btn btn-sm btn-light"
                                @click="applyAll = false"
                            >&#x2195;</button>
                        </td>
                        <td>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">&lt;</span>
                                </div>
                                <input
                                    v-model="allFilters.pValue"
                                    type="number"
                                    class="form-control"
                                />
                            </div>
                        </td>
                        <td>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">&gt;</span>
                                </div>
                                <input v-model="allFilters.n" type="number" class="form-control" />
                            </div>
                        </td>
                        <td>
                            <div class="input-group input-group-sm">
                                <select v-model="allFilters.beta" class="custom-select">
                                    <option selected value></option>
                                    <option value="negative">Negative (beta &lt; 0)</option>
                                    <option value="positive">Positive (beta &gt; 0)</option>
                                </select>
                            </div>
                        </td>
                        <td>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">=</span>
                                </div>
                                <input v-model="allFilters.chr" type="text" class="form-control" />
                            </div>
                        </td>
                    </tr>
                    <tr v-else v-for="(phenotype, i) in phenotypes">
                        <td>
                            <span
                                class="reference p-1 rounded"
                                style="color:white"
                                :class="'color-' + (i+1)"
                            >{{phenotype.description}}</span>
                        </td>
                        <td>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">&lt;=</span>
                                </div>
                                <input
                                    v-model="filters[phenotype.name].pValue"
                                    @change="updateFilters()"
                                    type="number"
                                    class="form-control"
                                />
                            </div>
                        </td>
                        <td>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">&gt;=</span>
                                </div>
                                <input
                                    v-model="filters[phenotype.name].n"
                                    @change="updateFilters()"
                                    type="number"
                                    class="form-control"
                                />
                            </div>
                        </td>
                        <td>
                            <div class="input-group input-group-sm">
                                <select
                                    v-model="filters[phenotype.name].beta"
                                    @change="updateFilters()"
                                    class="custom-select"
                                >
                                    <option selected value></option>
                                    <option value="negative">Negative (beta &lt; 0)</option>
                                    <option value="positive">Positive (beta &gt; 0)</option>
                                </select>
                            </div>
                        </td>
                        <td>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">=</span>
                                </div>
                                <input
                                    v-model="filters[phenotype.name].chr"
                                    @change="updateFilters()"
                                    type="text"
                                    class="form-control"
                                />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <manhattan-plot class="mb-3" :associations="associationsByPhenotype" :colors="colors"></manhattan-plot>
        <associations-table
            :associations="filteredAssociations"
            :phenotypes="phenotypes"
            :per-page="10"
        ></associations-table>
    </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import AssociationsTable from "@/components/AssociationsTable.vue";
import Formatters from "@/utils/formatters";
import colorIndex from "@/utils/colors";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

export default Vue.component("variant-finder", {
    props: ["phenotypes", "associations"],

    components: {
        ManhattanPlot,
        AssociationsTable
    },

    data() {
        return {
            loadedPhenotypes: [],
            updateKey: 0,
            filters: {},
            allFilters: {
                pValue: null,
                beta: null,
                n: null,
                chr: null
            },
            applyAll: true
        };
    },

    methods: {
        updateFilters() {
            this.updateKey += 1;
        }
    },

    computed: {
        appliedFilters() {
            let filters = {};

            // apply global filters to all phenotypes
            if (this.applyAll) {
                this.filters = {};

                // update the filters
                for (let i in this.phenotypes) {
                    let name = this.phenotypes[i].name;

                    // apply to each phenotype
                    this.filters[name] = Object.assign({}, this.allFilters);
                }
            } else {
                filters = Object.assign(filters, this.filters);
            }

            // tack the update key in there to force an update
            filters[0] = this.updateKey;

            // update all the filters
            return filters;
        },

        phenotypeFilters() {
            let filters = this.appliedFilters;
            let phenotypeFilters = {};

            for (let i in this.phenotypes) {
                let phenotype = this.phenotypes[i];
                let filters = this.filters[phenotype.name];

                // filter for each parameter
                let pFilter = !!filters.pValue
                    ? a => a.pValue < filters.pValue
                    : a => true;
                let nFilter = !!filters.n ? a => a.n > filters.n : a => true;
                let cFilter = !!filters.chr
                    ? a => a.chromosome === filters.chr
                    : a => true;
                let bFilter = a => true;

                // set the beta filter if a choice is made
                switch (filters.beta) {
                    case "negative":
                        bFilter = a => a.beta < 0;
                        break;
                    case "positive":
                        bFilter = a => a.beta > 0;
                        break;
                }

                // combine the filters together
                phenotypeFilters[phenotype.name] = a => {
                    return pFilter(a) && nFilter(a) && cFilter(a) && bFilter(a);
                };
            }

            return phenotypeFilters;
        },

        filteredAssociations() {
            let filters = this.phenotypeFilters;

            return this.associations.filter(r => {
                return filters[r.phenotype](r);
            });
        },

        // For the manhattan plot, the associations need to be in a map like
        // so: { [phenotype]: [associations] }.
        associationsByPhenotype() {
            let assocs = {};

            for (let i in this.filteredAssociations) {
                let r = this.filteredAssociations[i];

                if (!assocs[r.phenotype]) {
                    assocs[r.phenotype] = [r];
                } else {
                    assocs[r.phenotype].push(r);
                }
            }

            return assocs;
        },

        colors() {
            let colors = {};
            let phenotypes = this.phenotypes;

            for (let i in phenotypes) {
                colors[phenotypes[i].name] = colorIndex[i];
            }

            return colors;
        }
    }
});
</script>
