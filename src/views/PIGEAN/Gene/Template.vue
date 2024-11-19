<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$parent.rawPhenotypes"
        >
        </page-header>
        <!-- warning in case gene name isn't valid -->
        <div id="invalidGeneWarning" class="invalid-gene-warning hidden">
            <a
                class="invalid-gene-hide-warning"
                @click="$parent.hideGeneWarning()"
            >
                X
            </a>
            <div id="invalidGeneMessage"></div>
            <div>
                <a id="invalidGeneRedirect" href="" class="btn btn-primary"
                    >GO</a
                >
            </div>
        </div>
        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>
                <!-- Wrap page level searchs with "pageSearchParameters" div -->
                <span class="gene-search-tip">
                    <sup>*</sup>
                    Alias names are converted to gene symbols
                </span>
                <div class="col filter-col-md">
                    <div class="label">Gene</div>
                    <gene-selectpicker></gene-selectpicker>
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
                        @click="$store.dispatch('queryGeneName')"
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
                                $store.state.geneName.toUpperCase()
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
                        Traits with genetic support
                    </h4>
                    <div>
                        Combined genetic support is composed of direct support 
                        (from GWAS associations near the gene) and indirect support 
                        (membership in gene sets with genetic support). 
                        Units are log-odds of probability.
                    </div>
                </div>
                <div class="card-body">
                    <criterion-function-group>
                        <filter-enumeration-control
                            :field="'phenotype'"
                            placeholder="Select a phenotype ..."
                            :options="
                                $store.state.pigeanGene.data.map(
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
                                        canvas-id="pigeanGene"
                                        :plot-name="`PIGEAN_${$store.state.geneName}`"
                                        :phenotypes-data="
                                            $parent.phewasAdjustedData
                                        "
                                        :phenotype-map="
                                            $parent.pigeanMap
                                        "
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
                                        :pigean-data="
                                            $parent.pigeanFilteredData
                                        "
                                        :config="$parent.pigeanPlotConfig"
                                        :phenotype-map="
                                            $parent.pigeanMap
                                        "
                                        :filter="filter"
                                    >
                                    </pigean-plot>
                                </div>
                            </div>
                            <div class="card-body pigean-table">
                                <pigean-table
                                    v-if="$parent.plotReady"
                                    :pigean-data="$parent.pigeanFilteredData"
                                    :phenotype-map="
                                        $parent.pigeanMap
                                    "
                                    :config="$parent.tableConfig"
                                    :filter="filter"
                                >
                                </pigean-table>
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

<style>
* {
    box-sizing: border-box;
}
.invalid-gene-warning {
    position: fixed;
    z-index: 20000;
    background-color: #ffcccc;
    width: 500px;
    padding: 15px 25px;
    border: solid 1px #cccccc;
    border-radius: 5px;
    left: calc(50% - 275px);
    top: calc(20% - 50px);
    text-align: center;
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.25);
    font-size: 20px;
}

.invalid-gene-hide-warning {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 15px;
    height: 15px;
    border-radius: 15px;
    font-size: 10px;
    background-color: #666666;
    color: #ffffff !important;
}

.invalid-gene-hide-warning:hover {
    cursor: pointer;
}

#invalidGeneRedirect {
    color: #ffffff !important;
    margin-top: 15px;
}

.gene-search-tip {
    position: absolute;
    font-weight: 300;
    font-size: 14px;
    top: 10px;
    left: 20px;
    color: #28a745;
}

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
