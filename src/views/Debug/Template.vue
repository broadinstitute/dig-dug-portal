<template>
    <!-- Header -->
    <div>
        <filter-list-group
            v-model="$parent.searchCriterionList"
            :looseMatch="true"
            :header="'Search Criterion'">
            <!-- Phenotype Selector -->
            <filter-enumeration-control
                class="filter-col-lg"
                :field="'phenotype'"
                :options="['hi', 'hello']"
                :disableSort="true"
                :multiple="true">
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
