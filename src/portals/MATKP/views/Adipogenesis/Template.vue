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
                    <div class="matkp-tool-documentation">
                        <p>This page lets you explore time-series gene expression from adipogenesis experiments. Use <strong>Top Transcripts</strong> to view the top 100 transcripts ranked by maximum change across time points, or <strong>Search by Gene</strong> to build a custom view for up to 10 genes (enter gene symbols, one per line or separated by spaces or commas, then click Search). For both views you get a heatmap (transcripts as rows, time points as columns), a line plot that updates when you hover over a heatmap cell, and a table with transcript IDs, genes, and expression values per time point.</p>
                        <p>Above the tabs you can turn <strong>Display average of all replicates per time point</strong> on to show one column per day, or off to see individual replicates. <strong>Show row-normalized values</strong> rescales each transcript’s row so that the minimum and maximum across time points define the color range, making patterns across time easier to compare. In the Top Transcripts tab, <strong>Show only rows displayed in table</strong> limits the heatmap to the transcripts on the current table page so the heatmap and table stay in sync. Use the table pagination to change pages; you can download the heatmap as PNG from the Download button on the heatmap.</p>
                    </div>
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
                                                <span id="zoom-checkbox">
                                                    <label>
                                                        <input v-model="$parent.zoomedIn" type="checkbox" />
                                                        Show only rows displayed in table
                                                    </label>
                                                </span>
                                            </h4>
                                            
                                            <div v-if="$parent.ready" class="time-series-content">
                                                <time-series-display
                                                    :heatmapData="$parent.paginatedData"
                                                    :days="$parent.conditionsMap.timePoints"
                                                    :minScore="$parent.minScore"
                                                    :maxScore="$parent.maxScore"
                                                    :utils="$parent.utilsBox"
                                                    :zoomedIn="$parent.zoomedIn"
                                                    sectionId="adipogenesis"
                                                    :avgRep="$parent.avgRep"
                                                    :rowNorm="$parent.rowNorm"
                                                    :activeTab="$parent.activeTab">
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
                                            <div v-if="$parent.allTimeSeriesData !== null"
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
                                                        <button class="btn btn-primary btn-sm"
                                                            @click="$parent.queryGenes()">
                                                            Search
                                                        </button>
                                                    </div>
                                                </criterion-function-group>
                                                <div v-if="$parent.geneSearchResults.length > 0">
                                                    <time-series-display
                                                        :heatmapData="$parent.processedGeneSearch"
                                                        :days="$parent.conditionsMap.timePoints"
                                                        :minScore="$parent.minScore"
                                                        :maxScore="$parent.maxScore"
                                                        :utils="$parent.utilsBox"
                                                        :zoomedIn="true"
                                                        sectionId="gene_search"
                                                        :avgRep="$parent.avgRep"
                                                        :rowNorm="$parent.rowNorm"
                                                        :activeTab="$parent.activeTab">
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
.mat-body {
    max-width: 1400px !important;
    margin: 0 auto !important;
    width: -webkit-fill-available !important;
}

.mdkp-card {
    background: rgb(248, 248, 248) !important;
    border: none !important;
    border-radius: 0px !important;
    margin-top: -20px !important;
    padding-top: 30px;
}

.tab-inner {
    background: rgb(255, 255, 255) !important;
    border: solid 1px #dddddd !important;
    border-top: none !important;
    padding: 25px;
}

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
.matkp-tool-documentation, .matkp-tool-documentation p {
    font-size: 16px;
}
.time-series-content {
    padding: 20px;
}
#zoom-checkbox {
	text-align: left;
    font-size: 14px;
    margin-left: 20px;
}

button {
    margin: 5px;
}
#checkboxes {
    margin-bottom: -30px;
    margin-top: 10px;
    text-align: right;
}

#checkboxes > div {
    display: inline-block;
    vertical-align: top;
    margin-right: 15px;
}
.gene-search-controls {
    display: inline;
    vertical-align: top;
}
.gene-search-controls button {
    background-color: #ff6c02;
    border: none; 
    margin-top: 25px
}
.table-background {
    border: 10px solid #ffffff;
    padding-bottom: 10px;
}
</style>
