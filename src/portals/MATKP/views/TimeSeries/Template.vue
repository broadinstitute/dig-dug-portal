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
                        <h4>
                            Sample time series data
                        </h4>
                    </div>
                    <div v-if="$parent.timeSeriesData !== null">
                        <time-series-line-plot
                            :plotData="$parent.processedData"
                            :tx="$parent.transcripts"
                            :config="$parent.linePlotConfig">

                        </time-series-line-plot>
                        <time-series-heatmap
                            :heatmapData="$parent.processedData"
                            :renderConfig="$parent.heatmapConfig"
                            :utils="$parent.utilsBox"
                            sectionId="time-series-heatmap"
                            @hover="(e) => $parent.showLinePlot(e)"
                            :linePlotConfig="$parent.linePlotConfig">
                        </time-series-heatmap>
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
</style>
