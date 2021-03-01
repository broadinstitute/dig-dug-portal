<template>
    <filter-control-template
        class="filter-col-md"
        :field="field"
        :predicate="predicate"
        :pillFormatter="pillFormatter"
        :options="options"
        @input-change="$emit('input-change', $event)"
        :color="color"
        :multiple="true"
        :inclusive="inclusive"
        :splitBy="splitBy">
        <slot></slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default Vue.component("filter-multi-control", {
    props: {
        field: String,
        options: {
            type: Array,
            required: false,
        },
        color: String,
        splitBy: String,
        inclusive: {
            type: Boolean,
            default: true,
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) => `${filterDefinition.field} = ${filterDefinition.threshold}`
        },
        predicate: {
            type: Function,
            default: (string, selection) => string === selection
        }
    },
    components: {
        FilterControlTemplate,
    },
});
</script>
