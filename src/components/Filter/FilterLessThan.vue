<template>
    <filter-control
        class="filter-col-sm"
        :field="field"
        :type="Number"
        :predicate="(number, upperBound) => number <= upperBound"
        :pillFormatter="filterDefinition => `${filterDefinition.field} <= ${filterDefinition.threshold}`"
        :color="color"
        :multiple="false">
        <slot>
            {{field}}
        </slot>
    </filter-control>
</template>
<script>
import Vue from "vue";
import FilterControl from "./FilterControl"
export default Vue.component('filter-less-control', {
    props: ['field', 'color'],
    components: {
        FilterControl,
    }
})
</script>
