<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$parent.rawPhenotypes"
        ></page-header>

        <!-- Body -->
        <div v-if="!$parent.tissue">
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No tissue
                selected. Please go back and select a tissue.
            </b-alert>
        </div>
        <template v-else>
            <div class="container-fluid mdkp-body">
                <div class="card mdkp-card">
                    <div class="card-body temporary-card">
                        <search-header-wrapper>
                            <!-- Wrap page level searchs with "pageSearchParameters" div -->
                            <div class="col filter-col-md">
                                <div class="label">Tissue</div>
                                <tissue-selectpicker></tissue-selectpicker>
                            </div>
                            <div class="col filter-col-md">
                                <div class="label">Search</div>
                                <button
                                    id="regionSearchGo"
                                    class="btn btn-light btn-sm go"
                                    type="button"
                                    @click="$store.dispatch('queryTissue')"
                                >
                                    GO
                                </button>
                            </div>
                        </search-header-wrapper>
                        <documentation
                            name="tissue.explore.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <tissue-expression-display
                            v-if="$parent.tissueData.length > 0"
                            :tissue-data="$parent.tissueData"
                            :tissue="$parent.tissue"
                        ></tissue-expression-display>
                    </div>
                </div>

                <!-- Add filters here when data is ready -->
                <!-- <div class="filtering-ui-wrapper container-fluid">
                    <div class="row filtering-ui-content">
                        <div class="col filter-col-md filter-col-lg">
                            Filters
                        </div>
                    </div>
                </div> -->

                <div class="card mdkp-card">
                    <div class="card-body">
                        <tissue-heritability-table
                            :tissue="$parent.tissue"
                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                        ></tissue-heritability-table>
                    </div>
                </div>
            </div>
        </template>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style>
.row .pagination.b-pagination {
    border: none !important;
    margin-bottom: 10px !important;
}

.row li.page-item .page-link  {
    width: 30px !important;
    height: 30px !important;
    min-width: 30px !important;
    padding: 5px;
    margin: 0 1px;
}

tr.b-table-details > td {
    padding: 0 !important;
}
</style>
