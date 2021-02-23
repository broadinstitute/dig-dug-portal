<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">Variant Finder</h1>

                    <documentation
                        style="margin-bottom: 30px"
                        name="tools.variantfinder.subheader"
                    ></documentation>

                    <h4 class="card-title">Build search criteria</h4>

                    <!-- phenotype loading -->
                    <criterion-list-group
                        v-model="$parent.variantFinderSearchCriterion"
                        :header="'Search Criterion'"
                    >
                        <!-- Phenotype Selector -->
                        <filter-enumeration-control
                            class="filter-col-lg"
                            :field="'phenotype'"
                            :options="
                                $parent.secondaryPhenotypeOptions.map(
                                    (phenotype) => phenotype.name
                                )
                            "
                            :multiple="true"
                            :labelFormatter="
                                (phenotype) =>
                                    !!$store.state.bioPortal.phenotypeMap[
                                        phenotype
                                    ]
                                        ? $store.state.bioPortal.phenotypeMap[
                                              phenotype
                                          ].description
                                        : phenotype
                            "
                        >
                            <div>
                                <strong>{{
                                    !$store.getters.leadPhenotype
                                        ? "Choose lead phenotype"
                                        : "Select additional phenotypes"
                                }}</strong>
                            </div>
                        </filter-enumeration-control>
                    </criterion-list-group>

                    <!-- filter options per phenotype -->
                    <criterion-function-group
                        v-model="$parent.variantFinderFilter"
                        v-show="
                            $store.state.phenotypes.length > 0 ||
                            $parent.filteredAssociations.length > 0
                        "
                    >
                        <filter-pvalue-control :field="'pValue'">
                            <div class="label">P-Value (&le;)</div>
                        </filter-pvalue-control>

                        <filter-effect-direction-control :field="'alignedBeta'">
                            <div class="label">Aligned Effect (+/-)</div>
                        </filter-effect-direction-control>
                    </criterion-function-group>

                    <hr />

                    <!-- plot of all overlapping clumps -->
                    <div>
                        <manhattan-plot
                            v-show="
                                $store.state.phenotypes.length > 0 ||
                                $parent.filteredAssociations.length > 0
                            "
                            :associations="$parent.filteredAssociations"
                            :phenotypes="$store.state.phenotypes"
                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                            :colorByPhenotype="true"
                            class="mt-2 mb-2"
                        ></manhattan-plot>
                    </div>

                    <!-- table of overlapping associations -->
                    <div>
                        <clumped-associations-table
                            v-show="
                                $store.state.phenotypes.length > 0 ||
                                $parent.filteredAssociations.length > 0
                            "
                            :phenotypes="$store.state.phenotypes"
                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                            :associations="$parent.filteredAssociations"
                            :rowsPerPage="30"
                            :exclusive="true"
                        ></clumped-associations-table>
                    </div>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
