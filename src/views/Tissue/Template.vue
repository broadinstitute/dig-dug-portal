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
                    <div class="card-body temporary-card">
                        <documentation
                            name="tissue.explore.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4>
                            {{
                                `Gene expression for ${$parent.tissueFormatter(
                                    $parent.tissue
                                )}`
                            }}
                        </h4>
                        <documentation
                            name="tissue.gene-expression.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>
                        <criterion-function-group>
                            <filter-greater-control
                                class="filter-col-md"
                                field="meanTpm"
                            >
                                <div>
                                    <strong>Mean TPM (&ge;)</strong>
                                </div>
                            </filter-greater-control>
                            <filter-less-control
                                class="filter-col-md"
                                field="H"
                                :pill-formatter="
                                    (filterDefinition) =>
                                        `genericity ≤ ${filterDefinition.threshold}`
                                "
                            >
                                <div class="label">Genericity (&le;)</div>
                            </filter-less-control>
                            <template slot="filtered" slot-scope="{ filter }">
                                <scatterplot
                                    v-if="$parent.tissueData.length > 0"
                                    :plotData="$parent.tissueData"
                                    :config="$parent.plotConfig"
                                    :plotName="`${$parent.tissue}_gene_expression`"
                                    :filter="filter"
                                >
                                </scatterplot>
                                <div class="mt-4"></div>
                                <tissue-expression-table
                                    :tissueData="$parent.tissueData"
                                    :tissue="$parent.tissue"
                                    :filter="filter"
                                >
                                </tissue-expression-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>
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
