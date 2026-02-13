<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>
            <!-- BODY -->
            <template>
                <div class="mat-body f-col">
                    <h2 class="matkp-static-content-title">
                        Adipogenesis Datasets
                    </h2>
                    <research-single-cell-info :data="$parent.datasetMetadata"/>
                    <div class="card mdkp-card">
                        <div class="card-body">
                            <div id="checkboxes">
                                <div>
                                    <label>
                                        <input v-model="$parent.avgRep" type="checkbox" />
                                        Display average of all replicates per time point
                                    </label>
                                </div>
                                <div>
                                    <label>
                                        <input v-model="$parent.rowNorm" type="checkbox" />
                                        Show row-normalized values
                                    </label>
                                </div>
                                <div>
                                    <label>
                                        <input v-model="$parent.clusterOn" type="checkbox" />
                                        Show data by clusters
                                    </label>
                                </div>
                            </div>
                            <div id="tabs-below-checkboxes">
                                <b-tabs v-model="$parent.activeTab">
                                    <b-tab title="Top Transcripts">
                                        <div class="tab-inner">
                                            <h4>
                                                Top 100 transcripts by max difference
                                            </h4>
                                            <div id="zoom-checkbox">
                                                <label>
                                                    <input v-model="$parent.zoomedIn" type="checkbox" />
                                                    Zoom in
                                                </label>
                                            </div>
                                            <div v-if="$parent.ready" class="time-series-content">
                                                <time-series-display
                                                    :heatmapData="$parent.paginatedData"
                                                    :minScore="$parent.minScore"
                                                    :maxScore="$parent.maxScore"
                                                    :utils="$parent.utilsBox"
                                                    :zoomedIn="$parent.zoomedIn"
                                                    sectionId="adipogenesis"
                                                    :activeTab="$parent.activeTab"
                                                    :avgRep="$parent.avgRep"
                                                    :rowNorm="$parent.rowNorm">
                                                </time-series-display>
                                            </div>
                                        <div>
                                        <div class="table-background">
                                            <b-table v-if="$parent.ready"
                                                small
                                                v-model="$parent.currentTable"
                                                :items="$parent.timeSeriesData"
                                                :fields="$parent.tableFields"
                                                :per-page="10"
                                                :current-page="$parent.currentPage">
                                            </b-table>
                                            <b-pagination v-if="$parent.ready"
                                                v-model="$parent.currentPage"
                                                class="pagination-sm justify-content-center"
                                                :total-rows="$parent.timeSeriesData.length"
                                                :per-page="10"
                                            ></b-pagination>
                                        </div>
                                </div>
                            </div>
                                    </b-tab>
                                    <b-tab title="Search by Gene">
                                        <div class="tab-inner">
                                            <h4>
                                                Search up to 10 genes to create a custom heatmap.
                                            </h4>
                                            <div v-if="$parent.allTimeSeriesData !== null && $parent.activeTab === 1"
                                                class="time-series-content">
                                                <criterion-function-group>
                                                    <div class="gene-search-controls">
                                                        <label>
                                                        <textarea class="form-control" 
                                                            cols="40" rows="3"
                                                            v-model="$parent.geneSearchQuery">
                                                        </textarea>
                                                    </label>
                                                    </div>
                                                    <div class="gene-search-controls">
                                                        <button class="btn btn-primary"
                                                            @click="$parent.queryGenes()">
                                                            Search
                                                        </button>
                                                    </div>
                                                </criterion-function-group>
                                                <div v-if="$parent.geneSearchResults.length > 0">
                                                    <time-series-display
                                                        :heatmapData="$parent.processedGeneSearch"
                                                        :minScore="$parent.minScore"
                                                        :maxScore="$parent.maxScore"
                                                        :utils="$parent.utilsBox"
                                                        :zoomedIn="true"
                                                        sectionId="gene_search"
                                                        :activeTab="$parent.activeTab"
                                                        :avgRep="$parent.avgRep"
                                                        :rowNorm="$parent.rowNorm">
                                                    </time-series-display>
                                                    <div class="table-background">
                                                        <b-table
                                                            small
                                                            :items="$parent.geneSearchResults"
                                                            :fields="$parent.tableFields.filter(f => f.key !== 'order')">
                                                        </b-table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </b-tab>
                                </b-tabs>
                            </div>
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
.tab-inner {
    padding: 25px;
}
button {
    margin: 5px;
}
#checkboxes {
    margin-bottom: 10px;
}
.gene-search-controls {
    display: inline;
    vertical-align: top;
}
.table-background {
    border: 10px solid #eeeeee;
    padding-bottom: 10px;
}
</style>
