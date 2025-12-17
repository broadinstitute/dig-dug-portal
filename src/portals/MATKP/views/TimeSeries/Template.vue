<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>
            <!-- BODY -->
            <template>
                <div class="mat-body f-col">
                    <h2 class="matkp-static-content-title">
                        Time Series Data (sample)
                    </h2>
                    <div class="card mdkp-card">
                        <div class="card-body">
                            <b-tabs v-model="$parent.activeTab">
                                <b-tab title="Top Transcripts">
                                    <div>
                                        <h4>
                                            Time series data for {{ $parent.timeSeriesId }} (top 100 transcripts by max difference)
                                        </h4>
                                        <div id="zoom-checkbox">
                                            <label>
                                                <input v-model="$parent.zoomedIn" type="checkbox" />
                                                Zoom in
                                            </label>
                                        </div>
                                        <div v-if="$parent.timeSeriesData !== null && $parent.activeTab === 0"
                                            class="time-series-content">
                                            <time-series-heatmap
                                                :heatmapData="$parent.processedData"
                                                :renderConfig="$parent.heatmapConfig"
                                                :utils="$parent.utilsBox"
                                                sectionId="time-series-heatmap"
                                                :linePlotConfig="$parent.linePlotConfig"
                                                :zoomedIn="$parent.zoomedIn"
                                                :activeTab="$parent.activeTab">
                                            </time-series-heatmap>
                                        </div>
                                    <div>
                                    <b-table v-if="$parent.conditions.length > 0"
                                        small
                                        v-model="$parent.currentTable"
                                        :items="$parent.timeSeriesData"
                                        :fields="$parent.tableFields"
                                        :per-page="10"
                                        :current-page="$parent.currentPage">
                                    </b-table>

                                <b-pagination
                                    v-model="$parent.currentPage"
                                    class="pagination-sm justify-content-center"
                                    :total-rows="$parent.timeSeriesData.length"
                                    :per-page="10"
                                ></b-pagination>
                            </div>
                                    </div>
                                </b-tab>
                                <b-tab title="Search by Gene">
                                    <div>
                                        <h4>
                                            Search up to 10 genes to create a custom heatmap.
                                        </h4>
                                        <div v-if="$parent.allTimeSeriesData !== null && $parent.activeTab === 1"
                                            class="time-series-content">
                                            <criterion-function-group>
                                                <!-- <filter-enumeration-control
                                                    field="gene"
                                                    placeholder="Select genes ..."
                                                    :options="$parent.allProcessedData.map((d) => d.gene)"
                                                    :multiple="true"
                                                >
                                                    <div class="label">Filter by Genes</div>
                                                </filter-enumeration-control> -->
                                                <label>
                                                    Search by Genes
                                                    <input class="form-control" 
                                                        type="textarea" 
                                                        v-model="$parent.geneSearchQuery"/>
                                                </label>
                                                <button class="btn btn-primary"
                                                    @click="$parent.queryGenes()">
                                                    Search
                                                </button>
                                                <button class="btn btn-secondary">Clear</button>
                                                <template slot="filtered" slot-scope="{ filter }">
                                                    <time-series-heatmap
                                                        :heatmapData="$parent.geneSearchResults"
                                                        :filter="filter"
                                                        :renderConfig="$parent.heatmapConfig"
                                                        :utils="$parent.utilsBox"
                                                        sectionId="search-heatmap"
                                                        :linePlotConfig="$parent.linePlotConfig"
                                                        :zoomedIn="true">
                                                    </time-series-heatmap>
                                                </template>
                                            </criterion-function-group>
                                        </div>
                                    </div>
                                </b-tab>
                            </b-tabs>
                        </div>
                    </div>
                </div>
            </template>
            <!-- FOOTER -->
            <matkp-footer></matkp-footer>
        </div>
    </div>
  </template>

        <!-- Body -->
        

<style scoped>
.row .pagination.b-pagination {
    border: none !important;
    margin-bottom: 10px !important;
}

.row li.page-item .page-link {
    width: 30px !important;
    height: 30px !important;
    min-width: 30px !important;
    padding: 5px;
    margin: 0 1px;
}

tr.b-table-details > td {
    padding: 0 !important;
}

div.card >>> span.badge.badge-secondary.badge-pill.btn.filter-pill-H {
    background-color: #14a433;
}
.blue-search {
    background-color: #66bbff30 !important;
    border: solid 1px #3399ff30 !important;
}
.matkp-tool-documentation {
    font-size: 16px;
}
.time-series-content {
    padding: 20px;
    overflow-x: scroll;
}
.zoom-checkbox {
	text-align: left;
	padding-left: 25px;
}
</style>
