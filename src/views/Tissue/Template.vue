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
                            :content-fill="$parent.docDetails"
                            :content-map="$store.state.bioPortal.documentations"
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
                            :content-fill="$parent.docDetails"
                            :content-map="$store.state.bioPortal.documentations"
                        ></documentation>
                        <criterion-function-group>
                            <div class="col filter-col-md">
                                <div class="label">Plot Scale</div>
                                <select
                                    v-model="$parent.logScale"
                                    class="form-control"
                                >
                                    <option :value="false">Linear</option>
                                    <option :value="true">
                                        Logarithmic: log10(TPM+1)
                                    </option>
                                </select>
                            </div>
                            <filter-enumeration-control
                                field="gene"
                                placeholder="Select a gene ..."
                                :options="$parent.tissueData.map((d) => d.gene)"
                                :multiple="true"
                            >
                                <div class="label">Filter by Genes</div>
                            </filter-enumeration-control>
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
                                <div class="row">
                                    <div class="col-md-2"></div>
                                    <div class="col-md-8">
                                        <scatterplot
                                            v-if="$parent.tissueData.length > 0"
                                            :log-scale="$parent.logScale"
                                            :plot-data="$parent.tissueData"
                                            :config="$parent.plotConfig"
                                            :plot-name="`${$parent.tissue}_gene_expression`"
                                            :filter="filter"
                                            :translucent-dots="true"
                                        >
                                        </scatterplot>
                                    </div>
                                    <div class="col-md-2"></div>
                                </div>
                                <div class="mt-4"></div>
                                <tissue-expression-table
                                    :tissue-data="$parent.tissueData"
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
                        <h4 class="card-title">
                            Credible Sets to Cell Type (CS2CT) results for
                            {{ $parent.phenotypeDisplayName }}
                            (Ancestry:
                            {{
                                $parent.cs2ctAncestry == ""
                                    ? "All"
                                    : $parent.ancestryFormatter(
                                          $parent.cs2ctAncestry
                                      )
                            }})
                            <tooltip-documentation
                                name="phenotype.cs2ct.tooltip"
                                :content-fill="$parent.docDetails"
                                :is-hover="true"
                                :no-icon="false"
                                :content-map="
                                    $store.state.bioPortal.documentations
                                "
                            ></tooltip-documentation>
                        </h4>
                        <documentation
                            name="tissue.cs2ct.subheader"
                            :content-fill="$parent.docDetails"
                            :content-map="$store.state.bioPortal.documentations"
                        ></documentation>
                        <div
                            class="filtering-ui-wrapper container-fluid temporary-card"
                        >
                            <div class="row filtering-ui-content">
                                <span>
                                    <div class="label">Search by phenotype</div>
                                </span>
                                <phenotype-selectpicker
                                    :phenotypes="
                                        $store.state.bioPortal.phenotypes
                                    "
                                    class="col filter-col-md"
                                >
                                </phenotype-selectpicker>
                            </div>
                        </div>
                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'annotation'"
                                :multiple="true"
                                :options="
                                    $store.state.cs2ct.data.map(
                                        (d) => d.annotation
                                    )
                                "
                            >
                                <div class="label">Annotation</div>
                            </filter-enumeration-control>
                            <filter-less-control
                                :field="'totalEntropy'"
                                :pill-formatter="
                                    (filterDefinition) =>
                                        `genericity ≤ ${filterDefinition.threshold}`
                                "
                            >
                                <div class="label">Genericity (&le;)</div>
                            </filter-less-control>

                            <template slot="filtered" slot-scope="{ filter }">
                                <c2ct-table
                                    :c2ct-data="$parent.cs2ctData"
                                    :filter="filter"
                                    :phenotype="
                                        $store.state.credibleSetPhenotype
                                    "
                                >
                                </c2ct-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>
                <div
                    v-if="
                        $parent.deployment !== 'production' &&
                        $store.state.mouseSummary.data.length > 0
                    "
                    class="card mdkp-card"
                >
                    <div class="card-body">
                        <h4 class="card-title">
                            Differential gene expression in
                            {{ $parent.tissueFormatter($parent.tissue) }}, in
                            mouse founder strains
                            <tooltip-documentation
                                name="tissue.mice-diff-exp.tooltip"
                                :content-fill="$parent.docDetails"
                                :is-hover="true"
                                :no-icon="false"
                                :content-map="
                                    $store.state.bioPortal.documentations
                                "
                            >
                            </tooltip-documentation>
                        </h4>
                        <documentation
                            name="tissue.mice-diff-exp.subheader"
                            :content-fill="$parent.docDetails"
                            :content-map="$store.state.bioPortal.documentations"
                        >
                        </documentation>
                        <mouse-summary-table
                            :items="$store.state.mouseSummary.data"
                        >
                        </mouse-summary-table>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <tissue-heritability-table
                            :tissue="$parent.tissue"
                            :phenotype-map="$store.state.bioPortal.phenotypeMap"
                            @topPhenotypeFound="
                                (d) => $parent.getTopPhenotype(d)
                            "
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
.blue-search {
    background-color: #66bbff30 !important;
    border: solid 1px #3399ff30 !important;
}
</style>
