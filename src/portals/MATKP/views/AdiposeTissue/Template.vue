<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>
            <!-- BODY -->
            <template>
                <div class="mat-body f-col">
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4>
                            {{
                                `Gene expression for ${$parent.tissueFormatter(
                                    $store.state.tissueName
                                )}`
                            }}
                        </h4>
                        <div v-if="$parent.documentation !== null">
                            {{ $parent.documentation[0]["Documentation"] }}
                        </div>
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
                                <div class="label">
                                    Mean TPM (&ge;)
                                </div>
                            </filter-greater-control>
                            <filter-less-control
                                class="filter-col-md"
                                field="H"
                                :pill-formatter="
                                    (filterDefinition) =>
                                        `genericity &le; ${filterDefinition.threshold}`
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
                                            :plot-name="`${$store.state.tissueName}_gene_expression`"
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
                                    :tissue="$store.state.tissueName"
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
                            Credible Sets to Cell Type (CS2CT) results
                            {{ !$store.state.selectedPhenotype 
                                        ? ''
                                        : `for ${$store.state.selectedPhenotype.description}` }}
                            (Ancestry:
                            {{
                                $store.state.selectedAncestry == ""
                                    ? "All"
                                    : $parent.ancestryFormatter(
                                          $store.state.selectedAncestry
                                      )
                            }}, Annotation:
                            {{
                                $parent.tissueFormatter(
                                    $store.state.selectedAnnotation
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
                        <div v-if="$parent.documentation !== null">
                            {{ $parent.documentation[1]["Documentation"] }}
                        </div>
                        <div
                            class="filtering-ui-wrapper container-fluid temporary-card"
                        >
                            <div class="row filtering-ui-content">
                                <div class="col filter-col-md">
                                    <span>
                                        <div class="label">
                                            Search by phenotype
                                        </div>
                                    </span>
                                    <phenotype-selectpicker
                                        :phenotypes="
                                            $store.state.bioPortal.phenotypes
                                        "
                                    >
                                    </phenotype-selectpicker>
                                </div>
                                <div class="col filter-col-md">
                                    <span>
                                        <div class="label">
                                            Search by ancestry
                                        </div>
                                    </span>
                                    <ancestry-selectpicker
                                        :ancestries="
                                            $store.state.ancestryOptions
                                        "
                                    >
                                    </ancestry-selectpicker>
                                </div>
                                <div class="col filter-col-md">
                                    <span>
                                        <div class="label">
                                            Search by annotation
                                        </div>
                                    </span>
                                    <select
                                        v-model="$parent.annotation"
                                        class="form-control"
                                        @change="$parent.onAnnotationSelected()"
                                    >
                                        <option
                                            v-for="anno in $store.state
                                                .annotationOptions"
                                            :value="anno"
                                        >
                                            {{ anno }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'source'"
                                :multiple="true"
                                :options="
                                    $parent.cs2ctData.map((d) => d.source)
                                "
                            >
                                <div class="label">Source</div>
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
                            <filter-greater-control :field="'varTotal'">
                                <div class="label">Variants (&ge;)</div>
                            </filter-greater-control>

                            <template slot="filtered" slot-scope="{ filter }">
                                <c2ct-table
                                    :c2ct-data="$parent.cs2ctData"
                                    :filter="filter"
                                    :isTissuePage="true"
                                    :phenotype="$store.state.selectedPhenotype"
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
                            {{ $parent.tissueFormatter($store.state.tissueName) }}, in
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
                        <criterion-function-group>
                            <filter-pvalue-control
                                field="P_adj_sex"
                                placeholder="Set P-Value ..."
                            >
                                <div class="label">
                                    Adjusted p-value: sex (&le;)
                                </div>
                            </filter-pvalue-control>
                            <filter-pvalue-control
                                field="P_adj_strain"
                                placeholder="Set P-Value ..."
                            >
                                <div class="label">
                                    Adjusted p-value: strain (&le;)
                                </div>
                            </filter-pvalue-control>
                            <filter-pvalue-control
                                field="P_adj_strain_sex"
                                placeholder="Set P-Value ..."
                            >
                                <div class="label">
                                    Adjusted p-value: strain and sex (&le;)
                                </div>
                            </filter-pvalue-control>
                            <template slot="filtered" slot-scope="{ filter }">
                                <mouse-summary-table
                                    :items="$store.state.mouseSummary.data"
                                    :filter="filter"
                                >
                                </mouse-summary-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4>
                            Global enrichment for 
                            {{ $parent.tissueFormatter($store.state.tissueName) }} 
                            (Ancestry:
                            {{
                                $store.state.selectedAncestry === "Mixed"
                                || $store.state.selectedAncestry === ""
                                    ? "Mixed meta-analysis"
                                    : $parent.ancestryFormatter($store.state.selectedAncestry)
                            }})
                        </h4>
                        <div v-if="$parent.documentation !== null">
                            {{ $parent.documentation[2]["Documentation"]}}
                        </div>
                        <tissue-heritability-table
                            :tissue="$store.state.tissueName"
                            :phenotype-map="$store.state.bioPortal.phenotypeMap"
                            @topPhenotypeFound="
                                (d) => $parent.getTopPhenotype(d)
                            "
                        ></tissue-heritability-table>
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
</style>
