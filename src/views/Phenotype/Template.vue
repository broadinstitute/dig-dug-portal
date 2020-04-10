<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">Phenotypes</div>
                    <div class="col-md-4 gene-page-header-title">Add Phenotype</div>
                    <div class="col-md-8 gene-page-header-body">
                        <button
                            v-for="(phenotype, i) in $store.state.phenotypes"
                            class="btn mr-1 reference p-2 rounded"
                            style="color:white"
                            :class="'color-' + (i+1)"
                            @click="$store.commit('removePhenotype', phenotype.name);"
                        >{{phenotype.description}}</button>
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <div style="font-size: 16px">
                            <phenotype-selectpicker
                                :phenotypes="$store.state.bioPortal.phenotypes"
                                :clear-selected="true"
                            ></phenotype-selectpicker>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <table class="mb-4" width="100%">
                        <thead>
                            <th>Phenotype</th>
                            <th>P-Value</th>
                            <th>Sample Size (N)</th>
                            <th>Effect</th>
                            <th>Chromosome</th>
                        </thead>
                        <tbody>
                            <tr v-if="$store.state.applyAll">
                                <td>
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-light"
                                        @click="$store.commit('expandFilters')"
                                    >&#x2195;</button>
                                </td>
                                <td>
                                    <div class="input-group input-group-sm">
                                        <div class="input-group-prepend">
                                            <span class="input-group-text">&lt;</span>
                                        </div>
                                        <input
                                            v-model="$store.state.allFilters.pValue"
                                            @change="$store.commit('updateFilters')"
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
                                        <input
                                            v-model="$store.state.allFilters.n"
                                            @change="$store.commit('updateFilters')"
                                            type="number"
                                            class="form-control"
                                        />
                                    </div>
                                </td>
                                <td>
                                    <div class="input-group input-group-sm">
                                        <select
                                            v-model="$store.state.allFilters.beta"
                                            @change="$store.commit('updateFilters')"
                                            class="custom-select"
                                        >
                                            <option selected value></option>
                                            <option value="negative">Negative (beta &lt; 0.0)</option>
                                            <option value="positive">Positive (beta &gt; 0.0)</option>
                                        </select>
                                    </div>
                                </td>
                                <td>
                                    <div class="input-group input-group-sm">
                                        <div class="input-group-prepend">
                                            <span class="input-group-text">=</span>
                                        </div>
                                        <input
                                            v-model="$store.state.allFilters.chr"
                                            @change="$store.commit('updateFilters')"
                                            type="text"
                                            class="form-control"
                                        />
                                    </div>
                                </td>
                            </tr>
                            <tr v-else v-for="(phenotype, i) in $store.state.phenotypes">
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
                                            v-model="$store.state.newFilters[phenotype.name].pValue"
                                            @change="$store.commit('updateFilters')"
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
                                            v-model="$store.state.filters[phenotype.name].n"
                                            @change="$store.commit('updateFilters')"
                                            type="number"
                                            class="form-control"
                                        />
                                    </div>
                                </td>
                                <td>
                                    <div class="input-group input-group-sm">
                                        <select
                                            v-model="$store.state.filters[phenotype.name].beta"
                                            @change="$store.commit('updateFilters')"
                                            class="custom-select"
                                        >
                                            <option selected value></option>
                                            <option value="negative">Negative (beta &lt; 0.0)</option>
                                            <option value="positive">Positive (beta &gt; 0.0)</option>
                                        </select>
                                    </div>
                                </td>
                                <td>
                                    <div class="input-group input-group-sm">
                                        <div class="input-group-prepend">
                                            <span class="input-group-text">=</span>
                                        </div>
                                        <input
                                            v-model="$store.state.filters[phenotype.name].chr"
                                            @change="$store.commit('updateFilters')"
                                            type="text"
                                            class="form-control"
                                        />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <manhattan-plot
                        class="mb-3"
                        :loaded-associations="$parent.associationsByPhenotype"
                        :unloaded-associations="$parent.unloadedPhenotypes"
                        :colors="$parent.colors"
                    ></manhattan-plot>
                    <mplot-variants-table
                        :variants="$parent.associationsByVarId"
                        :phenotypes="$store.state.phenotypes"
                        :per-page="10"
                    ></mplot-variants-table>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Globally enriched tissues for:
                        <span
                            v-for="phenotype in $store.state.phenotypes"
                            class="item"
                        >{{phenotype.description}}</span>
                    </h4>
                    <tissue-enrichment
                        :phenotypes="$store.state.phenotypes"
                        :tissues="$parent.tissues"
                        :per-page="10"
                    ></tissue-enrichment>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
