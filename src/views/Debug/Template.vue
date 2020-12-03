<template>
    <!-- Header -->
    <div>

        <criterion-function-group
            v-model="$parent.searchCriterionList"
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

            <template slot=filtered slot-scope="{ filter }">
                {{filter}}
            </template>

        </criterion-function-group>

    </div>
</template>
