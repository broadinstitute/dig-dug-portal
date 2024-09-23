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
                            :contentFill="$parent.docDetails"
                            :contentMap="$store.state.bioPortal.documentations"
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
                            :contentFill="$parent.docDetails"
                            :contentMap="$store.state.bioPortal.documentations"
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
                                <scatterplot
                                    v-if="$parent.tissueData.length > 0"
                                    :logScale="$parent.logScale"
                                    :plotData="$parent.tissueData"
                                    :config="$parent.plotConfig"
                                    :plotName="`${$parent.tissue}_gene_expression`"
                                    :filter="filter"
                                    :translucentDots="true"
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
                <div
                    class="card mdkp-card"
                    v-if="$store.state.mouseSummary.data.length > 0"
                >
                    <div class="card-body">
                        <h4 class="card-title">
                            Differential gene expression in
                            {{ $parent.tissueFormatter($parent.tissue) }}, in
                            mouse founder strains
                            <tooltip-documentation
                                name="tissue.mice-diff-exp.tooltip"
                                :contentFill="$parent.docDetails"
                                :is-hover="true"
                                :no-icon="false"
                                :contentMap="
                                    $store.state.bioPortal.documentations
                                "
                            >
                            </tooltip-documentation>
                        </h4>
                        <documentation
                            name="tissue.mice-diff-exp.subheader"
                            :contentFill="$parent.docDetails"
                            :contentMap="$store.state.bioPortal.documentations"
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
                        <h4 class="card-title">
                            Credible Sets to Cell Type (CS2CT) results for
                            {{ $parent.topPhenotype }}
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
                                :contentFill="$parent.docDetails"
                                :is-hover="true"
                                :no-icon="false"
                                :contentMap="$store.state.bioPortal.documentations"
                            ></tooltip-documentation>
                        </h4>
                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'annotation'"
                                :options="
                                    $store.state.cs2ct.data.map(
                                        (d) => d.annotation
                                    )
                                "
                            >
                                <div class="label">Annotation</div>
                            </filter-enumeration-control>
                            <filter-enumeration-control
                                :field="'tissue'"
                                :options="
                                    $store.state.cs2ct.data.map((d) => d.tissue)
                                "
                            >
                                <div class="label">Tissue</div>
                            </filter-enumeration-control>
                            <filter-enumeration-control
                                :field="'biosample'"
                                :options="
                                    $parent.cs2ctData.map((d) => d.biosample)
                                "
                            >
                                <div class="label">Biosample</div>
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
                                    :c2ctData="$parent.cs2ctData"
                                    :filter="filter"
                                    :phenotype="$parent.topPhenotype"
                                >
                                </c2ct-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <tissue-heritability-table
                            :tissue="$parent.tissue"
                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                            @topPhenotypeFound="(d) => $parent.getTopPhenotype(d)"
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
