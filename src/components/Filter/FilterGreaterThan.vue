<template>
    <filter-control
        class="filter-col-sm"
        :field="field"
        :type="'number'"
        :predicate="(number, lowerBound) => number >= lowerBound"
        :pillFormatter="filterDefinition => `${filterDefinition.field} >= ${filterDefinition.threshold}`"
        :color="'#dc3545'"
        :multiple="false">
        <slot>
            {{field}}
        </slot>
    </filter-control>
</template>
<script>
import Vue from "vue";
import FilterControl from "./FilterControl"
export default Vue.component('filter-greater-control', {
    props: ['field', 'color'],
    components: {
        FilterControl,
    }
})
</script>
