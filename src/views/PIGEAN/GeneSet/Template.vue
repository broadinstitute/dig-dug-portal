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
                <div class="col filter-col-md">
                    <div class="label">Gene set</div>
                    <geneset-selectpicker></geneset-selectpicker>
                </div>
                <div class="col filter-col-md">
                    <div class="label">Trait group</div>
                    <trait-group-selectpicker></trait-group-selectpicker>
                </div>
                <div class="col filter-col-md">
                    <div class="label">Number of gene sets included</div>
                    <geneset-size-selectpicker></geneset-size-selectpicker>
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
                <div class="card-body pigean-title">
                    <h4 class="card-title">
                        Traits in which gene set affects genetic support
                    </h4>
                    <div>
                        Gene sets affect the log-odds of the probability 
                        that a gene is involved in a trait. Effect sizes
                        are calculated for the gene set in isolation 
                        (marginal) and in a joint model with all 
                        gene sets together (joint).
                    </div>
                </div>
                <div class="card-body">
                    <criterion-function-group>
                        <filter-enumeration-control
                            :field="'phenotype'"
                            placeholder="Select a phenotype ..."
                            :options="
                                $parent.phewasAllData.map(
                                    (d) => d.phenotype
                                )
                            "
                            :label-formatter="
                                (phenotype) =>
                                    $parent.pigeanMap[
                                            phenotype
                                        ]?.description
                                    || phenotype
                            "
                            :multiple="true"
                        >
                            <div class="label">Filter by Phenotypes</div>
                        </filter-enumeration-control>
                        <filter-greater-less
                            v-for="filterField in $parent.filterFields"
                            :key="filterField.key"
                            :field="filterField.key"
                            :label="filterField.label"
                        >
                            <div class="label">{{ filterField.label }}</div>
                        </filter-greater-less>
                        <template slot="filtered" slot-scope="{ filter }">
                            <div class="row pigean-plots">
                                <div class="col-md-8">
                                    <research-phewas-plot
                                        v-if="$parent.plotReady"
                                        canvas-id="pigeanGeneSet"
                                        :plot-name="`PIGEAN_${$store.state.geneset}`"
                                        :phenotypes-data="
                                            $parent.phewasAdjustedData
                                        "
                                        :phenotype-map="$parent.pigeanMap"
                                        :colors="$parent.plotColors"
                                        :render-config="$parent.renderConfig"
                                        :utils="$parent.utilsBox"
                                        :filter="filter"
                                        :native-dl-btn="false"
                                    >
                                    </research-phewas-plot>
                                </div>
                                <div class="col-md-4">
                                    <pigean-plot
                                        v-if="$parent.plotReady"
                                        :pigean-data="$parent.phewasAllData"
                                        :config="$parent.pigeanPlotConfig"
                                        :phenotype-map="$parent.pigeanMap"
                                        :filter="filter"
                                    >
                                    </pigean-plot>
                                </div>
                                <div class="card-body pigean-table">
                                    <pigean-table
                                        v-if="$parent.plotReady"
                                        :pigean-data="$parent.phewasAllData"
                                        :phenotype-map="$parent.pigeanMap"
                                        :config="$parent.tableConfig"
                                        :filter="filter"
                                    >
                                    </pigean-table>
                                </div>
                            </div>
                        </template>
                    </criterion-function-group>
                </div>
            </div>
        </div>
        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style scoped>
.card-body.pigean-plots {
    padding-bottom: 0;
    padding-top: 0;
}
.card-body.pigean-title {
    padding-bottom: 0;
}
.card-body.pigean-table {
    padding-top: 0;
}
</style>
