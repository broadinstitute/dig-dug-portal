<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$parent.rawPhenotypes"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>
                <!-- Wrap page level searchs with "pageSearchParameters" div -->

                <div
                    class="col filter-col-md hidden"
                    style="vertical-align: -8px !important"
                >
                    <div class="label">Phenotype</div>
                    <div class="form-control new-phenotype-search-key">
                        {{
                            !$parent.newPhenotypeSearchKey
                                ? "Search phenotype"
                                : $parent.newPhenotypeSearchKey
                        }}
                    </div>
                    <input
                        v-model="$parent.phenotypeSearchKey"
                        class="form-control phenotype-search-input"
                        type="text"
                    />

                    <ul
                        v-if="!!$parent.phenotypeSearchKey"
                        class="page-phenotypes-list"
                    >
                        <template v-for="item in $parent.phenotypesInSession">
                            <li
                                v-if="
                                    !!$parent.ifPhenotypeInSearch(
                                        item.description
                                    )
                                "
                                :key="item.name"
                            >
                                <a
                                    href="javascript:;"
                                    @click="$parent.setSelectedPhenotype(item)"
                                    v-html="item.description"
                                ></a>
                            </li>
                        </template>
                    </ul>
                </div>
                <div class="col filter-col-md">
                    <div class="label">Gene set size preference</div>
                    <sigma-selectpicker></sigma-selectpicker>
                </div>
                <div class="col filter-col-md">
                    <div class="label">Number of gene sets included</div>
                    <geneset-size-selectpicker></geneset-size-selectpicker>
                </div>
                <div class="region-search col filter-col-md hidden">
                    <div class="label">Search</div>
                    <button
                        id="regionSearchGo"
                        class="btn btn-light btn-sm go"
                        type="button"
                        @click="$store.dispatch('queryPhenotype')"
                    >
                        GO
                    </button>
                </div>
            </search-header-wrapper>

            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
                        Phenotype
                    </div>

                    <div class="col-md-12 gene-page-header-body">
                        <span v-if="$store.state.phenotype">
                            {{ $store.state.phenotype.description }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <criterion-function-group>
                        <filter-enumeration-control
                            field="gene"
                            placeholder="Select a gene ..."
                            :options="
                                $store.state.pigeanPhenotype.data.map(
                                    (d) => d.gene
                                )
                            "
                            :multiple="true"
                        >
                            <div class="label">Filter by Genes</div>
                        </filter-enumeration-control>
                        <filter-greater-less
                            v-for="filterField in $parent.geneFilterFields"
                            :key="filterField.key"
                            :field="filterField.key"
                            :label="filterField.label"
                        >
                            <div class="label">{{ filterField.label }}</div>
                        </filter-greater-less>
                        <template slot="filtered" slot-scope="{ filter }">
                            <pigean-plot
                                v-if="$parent.plotReady"
                                :pigeanData="$store.state.pigeanPhenotype.data"
                                :config="$parent.genePigeanPlotConfig"
                                :phenotypeMap="
                                    $store.state.bioPortal.phenotypeMap
                                "
                                :filter="filter"
                            >
                            </pigean-plot>
                            <pigean-table
                                v-if="$parent.plotReady"
                                :pigeanData="$store.state.pigeanPhenotype.data"
                                :config="$parent.tableConfig"
                                :filter="filter"
                            >
                            </pigean-table>
                        </template>
                    </criterion-function-group>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <criterion-function-group>
                        <filter-enumeration-control
                            field="gene_set"
                            placeholder="Select a gene set..."
                            :options="
                                $store.state.genesetPhenotype.data.map(
                                    (d) => d.gene_set
                                )
                            "
                            :multiple="true"
                        >
                            <div class="label">Filter by Gene Sets</div>
                        </filter-enumeration-control>
                        <filter-greater-less
                            v-for="filterField in $parent.genesetFilterFields"
                            :key="filterField.key"
                            :field="filterField.key"
                            :label="filterField.label"
                        >
                            <div class="label">{{ filterField.label }}</div>
                        </filter-greater-less>

                        <template slot="filtered" slot-scope="{ filter }">
                            <pigean-plot
                                v-if="$parent.plotReady"
                                :pigeanData="$store.state.genesetPhenotype.data"
                                :config="$parent.genesetPigeanPlotConfig"
                                :phenotypeMap="
                                    $store.state.bioPortal.phenotypeMap
                                "
                                :filter="filter"
                            >
                            </pigean-plot>
                            <pigean-table
                                v-if="$parent.plotReady"
                                :pigeanData="$store.state.genesetPhenotype.data"
                                :config="$parent.genesetTableConfig"
                                :filter="filter"
                            >
                            </pigean-table>
                        </template>
                    </criterion-function-group>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 v-if="$parent.phewasPlotData.length > 0">
                        {{$store.state.phenotype.name}}, {{ $parent.phewasPlotLabel }}
                    </h4>
                    <research-phewas-plot
                        v-if="$parent.phewasPlotData.length > 0"
                        :canvas-id="`pigean_${$store.state.phenotype.name}_${$parent.phewasPlotLabel}`"
                        :plot-name="`PIGEAN_${$store.state.phenotype.name}`"
                        :phenotypes-data="
                            $parent.phewasPlotData
                        "
                        :phenotype-map="
                            $store.state.bioPortal.phenotypeMap
                        "
                        :colors="$parent.plotColors"
                        :render-config="$parent.renderConfig"
                        :utils="$parent.utilsBox"
                        :native-dl-btn="false"
                    >
                    </research-phewas-plot>
                    <pigean-table
                        v-if="$parent.plotReady"
                        :pigeanData="$store.state.pigeanFactor.data"
                        :config="$parent.factorTableConfig"
                        @phewasPlotShow="(details) => $parent.plotPhewas(details)"
                    >
                    </pigean-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style scoped>
.phenotype-search-input {
    display: block !important;
    position: absolute;
    top: 25px;
    background: none;
    border: none;
}

.phenotype-search-input:focus {
    background-color: #fff;
}

.new-phenotype-search-key {
    text-align: left;
    overflow: hidden;
}

.page-phenotypes-list {
    position: absolute;
    z-index: 20;
    list-style: none;
    text-align: left;
    white-space: nowrap;
    padding: 0;
    display: block;
    overflow-x: hidden;
    overflow-y: auto;
    max-height: 300px;
    border-radius: 5px;
    border: solid 1px #eeeeee;
}

.page-phenotypes-list li {
    background-color: #fff;
    padding: 3px 12px;
    border-bottom: solid 1px #eeeeee;
}
</style>
