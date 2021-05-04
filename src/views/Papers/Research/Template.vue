<template>
    <div id="app">
        <!-- Header -->
        <research-page-header
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
                            Sorry, this page is not open yet. Please come back
                            later.
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
                        <h3>
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
                        </h3>
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
            <div class="card mdkp-card">
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
                                    $parent.dataFilters != null &&
                                    $parent.researchData != null
                                "
                            >
                                <research-page-filters
                                    ref="dataFilters"
                                    :filters="$parent.dataFilters"
                                    :dataset="$store.state.filteredData"
                                    :unfilteredDataset="$parent.researchData"
                                    :filtersIndex="$store.state.filtersIndex"
                                ></research-page-filters>
                            </div>
                            <!-- plots -->
                            <div
                                class="col-md-12 egl-m-plot-wrapper"
                                v-if="
                                    !!$store.state.filteredData &&
                                    $parent.plotType == 'm_plot'
                                "
                            >
                                <effector-genes-m-plot
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
                                ></effector-genes-m-plot>
                            </div>
                            <div
                                v-if="
                                    !!$store.state.filteredData &&
                                    $parent.plotType == 'mbm_plot'
                                "
                                class="mbm-plot-wrapper"
                            >
                                <research-m-bitmap-plot
                                    :plotData="$store.state.filteredData"
                                    :renderConfig="$parent.plotConfig"
                                    :filtersIndex="$store.state.filtersIndex"
                                ></research-m-bitmap-plot>
                            </div>

                            <div class="col-md-12">
                                <research-data-table
                                    :pageID="$parent.pageID"
                                    :dataset="$store.state.filteredData"
                                    :tableFormat="$parent.dataTableFormat"
                                    :perPageNumber="$parent.tableperPageNumber"
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
        </div>

        <!-- Footer-->
        <research-page-footer></research-page-footer>
    </div>
</template>

<style>
@import url("/css/effectorGenes.css");
</style>
