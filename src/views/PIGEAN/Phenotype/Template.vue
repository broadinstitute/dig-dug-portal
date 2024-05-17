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
                    <pigean-plot v-if="$parent.plotReady"
                        :pigeanData="$store.state.pigeanPhenotype.data"
                        xField="prior"
                        yField="log_bf"
                        dotKey="gene"
                        :hoverFields="['combined']"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap">
                    </pigean-plot>
                    <pigean-table v-if="$parent.plotReady"
                        :pigeanData="$store.state.pigeanPhenotype.data"
                        :config="$parent.tableConfig">
                    </pigean-table>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <pigean-plot v-if="$parent.plotReady"
                        :pigeanData="$store.state.genesetPhenotype.data"
                        xField="beta_uncorrected"
                        yField="beta"
                        dotKey="gene_set"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap">
                    </pigean-plot>
                    <pigean-table v-if="$parent.plotReady"
                        :pigeanData="$store.state.genesetPhenotype.data"
                        :config="$parent.genesetTableConfig">
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
