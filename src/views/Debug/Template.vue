<template>
    <div>
        <input type="checkbox" id="checkbox" v-model="$parent.inclusive">
        <label for="checkbox">{{ $parent.inclusive ? "inclusive filter" : "exclusive filter" }}</label>

        <!-- FilterWidget -->
        <filter-widget v-model="$parent.filterFunction" :inclusive="$parent.inclusive">

            <filter-pvalue-control 
                :field="'pValue'">
            </filter-pvalue-control>

            <filter-effect-direction-control 
                :field="'beta'">
            </filter-effect-direction-control>

            <filter-enumeration-control 
                :field="'test'"
                :options="$parent.matches">
            </filter-enumeration-control>

        </filter-widget>


        <!-- FilterContext is required in the page and must wrap around components with a filterable-wrapper -->
        <filter-context v-model="$parent.filterFunction">
            <!-- Div is dummy to fit components in slot -->
            <div>
                <associations-table
                    :associations="$parent.associations"
                    :phenotypes="$parent.phenotypes"
                ></associations-table>
                <filter-user></filter-user>
            </div>
        </filter-context>
        

    </div>
</template>
