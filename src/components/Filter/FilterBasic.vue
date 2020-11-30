<template>
    <filter-control
        class="filter-col-md"
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} == ${filterDefinition.threshold}`"
        :options="options"
        :color="color"
        :multiple="true"
        :inclusive="false"
        :splitBy="splitBy">
        <slot>
        </slot>
    </filter-control>
</template>
<script>
import Vue from "vue";
import FilterControl from "./FilterControl"
export default Vue.component('filter-basic-control', {
    props: {
        field: String,
        options: {
            type: Array,
            required: false,
        },
        splitBy: String,
        inclusive: {
            type: Boolean,
            default: true,
        }
    },
    components: {
        FilterControl,
    },
})
</script>
