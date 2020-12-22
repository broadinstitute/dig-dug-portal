<template>
    <filter-control-template
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
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate"
export default Vue.component('filter-less-control', {
    props: ['field', 'color'],
    components: {
        FilterControlTemplate,
    }
})
</script>
