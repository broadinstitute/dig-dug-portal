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
                    <div class="matkp-tool-documentation" v-if="$parent.ready" style="font-size: 16px">
                        {{ $parent.getHeaderContent('page_top') }}
                    </div>
                    <research-single-cell-info :data="$parent.datasetMetadata"/>
                    <div class="card mdkp-card" id="adipogenesis-card">
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
                            </div>
                            <div id="tabs-below-checkboxes">
                                <b-tabs v-model="$parent.activeTab">
                                    <b-tab title="Patterns">
                                        <div class="tab-inner">
                                            <h4>View transcripts by adipogenesis pattern</h4>
                                            <div v-if="$parent.ready" class="documentation">
                                                {{ $parent.getHeaderContent('pattern') }}
                                            </div>
                                            <div v-if="$parent.patterns.length > 0">
                                                <pattern-selector @patternSelected="(p) => $parent.viewPattern(p)"
                                                    :patterns="$parent.patterns">
                                                </pattern-selector>
                                            </div>
                                            <div v-if="!$parent.ready">Loading...</div>
                                            <div v-if="$parent.ready" class="time-series-content">
                                                <time-series-display v-if="!!$parent.patternHeatmapData"
                                                    :heatmapData="$parent.patternHeatmapData"
                                                    :days="$parent.conditionsMap.timePoints"
                                                    :minScore="$parent.minScore"
                                                    :maxScore="$parent.maxScore"
                                                    :utils="$parent.utilsBox"
                                                    :zoomedIn="true"
                                                    sectionId="adipogenesis_patterns"
                                                    :avgRep="$parent.avgRep"
                                                    :rowNorm="$parent.rowNorm"
                                                    :activeTab="$parent.activeTab">
                                                </time-series-display>
                                                <div v-else>Loading pattern data...</div>
                                            </div>
                                            <div class="table-background">
                                            <b-table v-if="$parent.ready"
                                                small
                                                v-model="$parent.currentPatternTable"
                                                :items="$parent.singlePatternTableData"
                                                :fields="$parent.tableFields.filter(f => f.key !== 'order' && f.key !== 'pattern')"
                                                :per-page="10"
                                                :current-page="$parent.currentPatternPage"
                                                :sort-by="'max_diff'"
                                                :sort-desc="true">
                                                    <template #cell(gene)="r">
                                                        <a :href='`/gene.html?gene=${r.item.gene.toUpperCase()}`'>
                                                            {{ r.item.gene }}
                                                        </a>
                                                    </template>
                                            </b-table>
                                            <b-pagination v-if="$parent.ready"
                                                v-model="$parent.currentPatternPage"
                                                class="pagination-sm justify-content-center"
                                                :total-rows="$parent.timeSeriesData.length"
                                                :per-page="10"
                                            ></b-pagination>
                                        </div>
                                        </div>
                                    </b-tab>
                                    <b-tab title="Top Transcripts">
                                        <div class="tab-inner">
                                            <h4>
                                                Top 100 transcripts by max difference
                                                <span class="zoom-checkbox">
                                                    <label>
                                                        <input v-model="$parent.zoomedIn" type="checkbox" />
                                                        Show only rows displayed in table
                                                    </label>
                                                </span>
                                            </h4>
                                            <div v-if="$parent.ready" class="documentation">
                                                    {{ $parent.getHeaderContent('top_transcripts') }}
                                                </div>
                                            <div v-if="$parent.ready" class="time-series-content">
                                                <time-series-display v-if="$parent.pageHeatmapData.length > 0"
                                                    :heatmapData="$parent.pageHeatmapData"
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
                                                    <template #cell(gene)="r">
                                                        <a :href='`/gene.html?gene=${r.item.gene.toUpperCase()}`'>
                                                            {{ r.item.gene }}
                                                        </a>
                                                    </template>
                                                    <template #cell(pattern)="r">
                                                        <button class="btn btn-sm pattern-button" @click="$parent.viewPattern(r.item.pattern)">
                                                            View pattern cluster
                                                        </button>
                                                    </template>
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
                                            <div v-if="$parent.ready" class="documentation">
                                                {{ $parent.getHeaderContent('genes_search') }}
                                            </div>
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
                                                                <template #cell(gene)="r">
                                                                    <a :href='`/gene.html?gene=${r.item.gene.toUpperCase()}`'>
                                                                        {{ r.item.gene }}
                                                                    </a>
                                                                </template>
                                                                <template #cell(pattern)="r">
                                                                    <button class="btn btn-sm pattern-button" @click="$parent.viewPattern(r.item.pattern)">
                                                                        View pattern cluster
                                                                    </button>
                                                                </template>
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
#adipogenesis-card {
    margin-top: 0px !important;
}
.time-series-content {
    padding: 20px;
}
.zoom-checkbox {
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
.pattern-button {
    background-color: #ff6c02;
    margin: 0px;
    color: white;
}
.table-background {
    border: 10px solid #ffffff;
    padding-bottom: 10px;
}
.documentation {
    margin-bottom: 10px;
}
</style>
