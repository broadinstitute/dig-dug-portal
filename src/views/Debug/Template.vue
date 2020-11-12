<template>
    <!-- Header -->
    <div>
        <filter-list-group
            v-model="$parent.geneFinderSearchCriterion"
            :looseMatch="true"
            :header="'Search Criterion'"
        >
            <!-- Phenotype Selector -->
            <filter-enumeration-control
                class="filter-col-lg"
                :field="'phenotype'"
                :options="
                    []
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
                    <strong>Select phenotypes</strong>
                </div>
            </filter-enumeration-control>

            <!-- pValue filter -->
            <filter-pvalue-control class="filter-col-sm" :field="'pValue'">
                <div>
                    <strong>P-Value (&le;)</strong>
                </div>
            </filter-pvalue-control>
        </filter-list-group>
    </div>
</template>
