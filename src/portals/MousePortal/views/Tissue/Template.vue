<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$parent.rawPhenotypes"
        ></page-header>

        <!-- Body -->
        <template>
            <div class="container-fluid mdkp-body">
                <search-header-wrapper>
                    <div class="region-search col filter-col-md">
                        <div class="label">Begin new search</div>
                        <research-single-search
                            :single-search-config="null"
                            :phenotypes="$parent.phenotypesInSession"
                            :utils="$parent.utilsBox"
                        ></research-single-search>
                    </div>
                </search-header-wrapper>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4>Mouse Differential Expression by Tissue</h4>
                        <documentation
                            name="mouse.diff-exp-browser.subheader"
                            :contentMap="$store.state.bioPortal.documentations"
                        ></documentation>
                        <criterion-function-group>
                            <mouse-gene-select></mouse-gene-select>
                            <button
                                class="btn btn-primary btn-sm"
                                @click="$parent.searchDiffExp()"
                            >
                                Search
                            </button>
                        </criterion-function-group>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <div v-if="$parent.diffExpData.length > 0">
                            <h4>
                                Differential Expression for
                                {{ $store.state.gene }} in
                                {{
                                    $parent.tissueFormatter($store.state.tissue)
                                }}
                            </h4>
                            <div class="row">
                                <div class="col-md-2"></div>
                                <div class="col-md-8">
                                    <mouse-whisker-plot
                                        :plotName="`mouse_diff_exp_${
                                            $store.state.gene
                                        }_${$parent.tissueFormatter(
                                            $store.state.tissue
                                        )}`"
                                        :data="$parent.diffExpData"
                                    >
                                    </mouse-whisker-plot>
                                </div>
                                <div class="col-md-2"></div>
                            </div>
                            <mouse-diff-exp-table
                                v-if="$parent.diffExpData.length > 0"
                                :items="$parent.diffExpData"
                            >
                            </mouse-diff-exp-table>
                        </div>
                        <div v-else-if="!$store.state.gene || !$store.state.tissue">
                            Select a tissue and a gene to view differential expression data.
                        </div>
                        <div v-else-if="!$store.state.loadingExpression">
                            No differential expression data found for this
                            query.
                        </div>
                        <div v-else>Loading...</div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

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
</style>
