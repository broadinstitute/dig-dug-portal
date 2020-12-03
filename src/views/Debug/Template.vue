<template>
    <!-- Header -->
    <div>

        <filter-list-group
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

        </filter-list-group>

    </div>
</template>
