<template>
    <div>
        <!-- Header -->
        <research-page-header
            :researchMenu="$parent.researchMenu"
        ></research-page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h3 v-html="$parent.pageTitle"></h3>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="row card-body">
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
                            :filters="$parent.dataFilters"
                            :dataset="$store.state.filteredData"
                            :unfilteredDataset="$parent.researchData"
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
                            :yAxisLabel="$parent.plotConfig['yAxisLabel']"
                            :xAxisLabel="$parent.plotConfig['xAxisLabel']"
                            :popUpContent="$parent.plotConfig['hoverContent']"
                        ></effector-genes-m-plot>
                    </div>
                    <div
                        v-if="
                            !!$store.state.filteredData &&
                            $parent.plotType == 'mbm_plot'
                        "
                        class="mbm-plot-wrapper"
                    >
                        <m-bitmap-plot
                            :plotData="$store.state.filteredData"
                            :renderConfig="$parent.plotConfig"
                        ></m-bitmap-plot>
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
