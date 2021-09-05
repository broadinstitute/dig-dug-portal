<template>
    <div id="app">
        <!-- KP Header -->
        <page-header
            v-if="$parent.displayOnKP == true"
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!--  Research page Header -->
        <research-page-header
            :class="
                $parent.displayOnKP == true
                    ? 'research-portal-header-compact'
                    : 'research-portal-header'
            "
            :researchMenu="$parent.researchMenu"
        ></research-page-header>

        <!-- Body -->
        <div
            class="container-fluid mdkp-body"
            v-if="$parent.researchMode == 'no_set'"
        >
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h3>
                            Sorry, this page is not published yet. Please come
                            back later.
                        </h3>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="container-fluid mdkp-body"
            v-if="$parent.researchMode == 'dev' && $parent.researchPage == null"
        >
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <div class="filtering-ui-wrapper">
                            <div class="filtering-ui-content row">
                                <div class="col">
                                    <div class="label">Reviewer ID</div>
                                    <div>
                                        <input
                                            type="text"
                                            class="form-control"
                                            v-model="$parent.devID"
                                        />
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="label">Reviewer P/W</div>
                                    <div>
                                        <input
                                            type="password"
                                            class="form-control"
                                            v-model="$parent.devPW"
                                        />
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="label">&nbsp;</div>
                                    <div>
                                        <button
                                            type="button"
                                            class="btn btn-primary"
                                            @click="$parent.fetchDevPage()"
                                        >
                                            Load page
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="container-fluid mdkp-body"
            v-if="$parent.researchPage != null"
        >
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h3 v-html="$parent.pageTitle"></h3>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card" v-if="$parent.isLandingPage == true">
                <div class="row card-body">
                    <div
                        class="col-md-12"
                        v-html="$parent.pageDescription"
                    ></div>
                </div>
            </div>
            <div class="card mdkp-card" v-if="$parent.isLandingPage == null">
                <div class="row card-body">
                    <b-tabs align="center" class="container-fluid">
                        <b-tab title="View data" active>
                            <div
                                class="col-md-12"
                                v-html="$parent.pageDescription"
                            ></div>
                            <div
                                class="col-md-12"
                                v-if="
                                    ($parent.dataFilters != null &&
                                        $parent.researchData != null &&
                                        $store.state.filteredData != '') ||
                                    $parent.dataFiles.length > 1 ||
                                    $parent.apiParameters != null
                                "
                            >
                                <research-page-filters
                                    :dataFiles="$parent.dataFiles"
                                    :filesListLabels="
                                        $parent.dataFiles.length > 1
                                            ? $parent.dataFilesLabels
                                            : null
                                    "
                                    :apiParameters="$parent.apiParameters"
                                    :dataComparisonConfig="
                                        $parent.dataComparisonConfig
                                    "
                                    :dataType="$parent.dataType"
                                    :uid="$parent.uid"
                                    :filters="$parent.dataFilters"
                                    :filterWidth="$parent.filterWidth"
                                    :dataset="$store.state.filteredData"
                                    :unfilteredDataset="
                                        $store.state.unfilteredData
                                    "
                                ></research-page-filters>
                            </div>
                            <!-- plots -->
                            <div
                                :class="'col-md-12 ' + $parent.plotClass"
                                v-if="$store.state.filteredData != ''"
                            >
                                <div
                                    class="plot-legend"
                                    v-html="$parent.plotLegend"
                                ></div>
                                <research-m-plot
                                    v-if="$parent.plotType == 'm_plot'"
                                    :plotData="$store.state.filteredData"
                                    :locusKey="$parent.plotConfig['locusKey']"
                                    :scoreKey="$parent.plotConfig['scoreKey']"
                                    :renderBy="$parent.plotConfig['renderBy']"
                                    :yAxisLabel="
                                        $parent.plotConfig['yAxisLabel']
                                    "
                                    :xAxisLabel="
                                        $parent.plotConfig['xAxisLabel']
                                    "
                                    :popUpContent="
                                        $parent.plotConfig['hoverContent']
                                    "
                                    :renderConfig="$parent.plotConfig"
                                ></research-m-plot>

                                <research-m-bitmap-plot
                                    v-if="$parent.plotType == 'mbm_plot'"
                                    :plotData="$store.state.filteredData"
                                    :renderConfig="$parent.plotConfig"
                                    :filtersIndex="$store.state.filtersIndex"
                                ></research-m-bitmap-plot>
                                <research-region-plot
                                    v-if="$parent.plotType == 'region_plot'"
                                    :genesInRegion="$store.state.genesInRegion"
                                    :plotData="$store.state.filteredData"
                                    :renderConfig="$parent.plotConfig"
                                    :filtersIndex="$store.state.filtersIndex"
                                    :searchParameters="
                                        $store.state.searchParameters
                                    "
                                    :dataComparisonConfig="
                                        $parent.dataComparisonConfig
                                    "
                                ></research-region-plot>

                                <research-score-plot
                                    v-if="$parent.plotType == 'score_plot'"
                                    :plotData="$store.state.filteredData"
                                    :renderConfig="$parent.plotConfig"
                                    :dataComparisonConfig="
                                        $parent.dataComparisonConfig
                                    "
                                    :region="$store.state.searchingRegion"
                                    :searchParameters="
                                        $store.state.searchParameters
                                    "
                                ></research-score-plot>

                                <research-genes-track
                                    v-if="
                                        $parent.plotConfig != null &&
                                        !!$parent.plotConfig.genesTrack &&
                                        $store.state.codingGenesData != null
                                    "
                                    :region="$store.state.searchingRegion"
                                    :genesData="$store.state.codingGenesData"
                                    :plotConfig="$parent.plotConfig"
                                    :plotType="$parent.plotType"
                                ></research-genes-track>
                                <research-volcano-plot
                                    v-if="$parent.plotType == 'volcano_plot'"
                                    :plotData="$store.state.filteredData"
                                    :renderConfig="$parent.plotConfig"
                                ></research-volcano-plot>

                                <research-heatmap
                                    v-if="$parent.plotType == 'h_map'"
                                    :heatmapData="$store.state.filteredData"
                                    :renderConfig="$parent.plotConfig"
                                ></research-heatmap>
                            </div>
                            <div
                                class="col-md-12"
                                v-if="
                                    $store.state.filteredData != '' &&
                                    $parent.dataTableFormat != null
                                "
                            >
                                <research-data-table
                                    :pageID="$parent.pageID"
                                    :dataset="$store.state.filteredData"
                                    :tableFormat="$parent.dataTableFormat"
                                    :initPerPageNumber="
                                        $parent.tablePerPageNumber
                                    "
                                    :tableLegend="$parent.tableLegend"
                                    :dataComparisonConfig="
                                        $parent.dataComparisonConfig
                                    "
                                    :searchParameters="
                                        $store.state.searchParameters
                                    "
                                >
                                </research-data-table>
                            </div>
                        </b-tab>
                        <b-tab title="Research Method">
                            <div
                                class="col-md-12"
                                v-html="$parent.researchMethod"
                            ></div>
                        </b-tab>
                    </b-tabs>
                </div>
            </div>
            <div
                class="data-loading-indicator"
                v-if="$parent.dataPoints != false"
            >
                Loading data...
            </div>
        </div>

        <!-- Research portal Footer-->
        <research-page-footer
            v-if="$parent.displayOnKP == null"
        ></research-page-footer>

        <!-- KP Footer-->
        <page-footer
            v-if="$parent.displayOnKP == true"
            :disease-group="$parent.diseaseGroup"
        ></page-footer>
    </div>
</template>

<style>
@import url("/css/effectorGenes.css");
</style>
