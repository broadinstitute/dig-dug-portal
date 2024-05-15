<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$parent.rawPhenotypes"
        >
        </page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>
                <!-- Wrap page level searchs with "pageSearchParameters" div -->
                <div class="col filter-col-md">
                    <div class="label">Gene set</div>
                    Gene set search coming soon
                </div>
                <div class="col filter-col-md">
                    <div class="label">Search</div>
                    <button
                        id="regionSearchGo"
                        class="btn btn-light btn-sm go"
                        type="button"
                        @click="$store.dispatch('queryGeneset')"
                    >
                        GO
                    </button>
                </div>
            </search-header-wrapper>
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">Gene</div>
                    <div class="col-md-4 gene-page-header-title">Navigate</div>
                    <div class="col-md-8 gene-page-header-body">
                        <div>
                            <span>{{
                                $store.state.geneset.toUpperCase()
                            }}</span>
                        </div>
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <div v-if="$parent.symbolName" class="input-group">
                            <button
                                class="btn btn-primary input-group-prepend explore-region-btn"
                                style="margin-right: 20px"
                                :title="$parent.regionText"
                                @click="$parent.exploreRegion()"
                            >
                                Explore Region
                            </button>
                            <button
                                class="btn btn-primary input-group-append explore-region-btn"
                                :title="$parent.regionTextExpanded"
                                @click="$parent.exploreRegion(50000)"
                            >
                                Explore &plusmn; 50 kb
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body title">
                    <h4 class="card-title">
                        Gene set
                        {{ $store.state.geneset }}
                    </h4>
                </div>
                <div class="row card-body plots">
                    <div class="col-md-8">
                        <research-phewas-plot
                            v-if="$store.state.pigeanGeneset.data.length > 0"
                            canvas-id="pigeanGeneSet"
                            :plotName="`PIGEAN_${$store.state.geneset}`"
                            :phenotypes-data="$store.state.pigeanGeneset.data"
                            :phenotype-map="
                                $store.state.bioPortal.phenotypeMap
                            "
                            :colors="$parent.plotColors"
                            :render-config="$parent.renderConfig"
                            :pkg-data="null"
                            :pkg-data-selected="null"
                            :utils="$parent.utilsBox"
                        >
                        </research-phewas-plot>
                    </div>
                    <div class="col-md-4">
                        <pigean-plot v-if="$store.state.pigeanGeneset.data.length > 0"
                            :pigeanData="$store.state.pigeanGeneset.data"
                            xField="beta_uncorrected"
                            yField="beta"
                            dotKey="phenotype">
                        </pigean-plot>
                    </div>
                    <div class="card-body pigean-table">
                        <pigean-table
                            :pigeanData="$store.state.pigeanGeneset.data"
                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                            :config="$parent.tableConfig">
                        </pigean-table>    
                    </div>
                </div>
            </div>
        </div>
        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style scoped></style>
