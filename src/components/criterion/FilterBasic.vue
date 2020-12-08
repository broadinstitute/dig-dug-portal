<template>
    <filter-control-template
        class="filter-col-md"
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="
            (filterDefinition) =>
                `${filterDefinition.field} = ${filterDefinition.threshold}`
        "
        :options="options"
        @input-change="$emit('input-change', $event)"
        :color="color"
        :multiple="false"
        :inclusive="inclusive"
        :splitBy="splitBy"
    >
        <slot> </slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default Vue.component("filter-basic-control", {
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
    },
    components: {
        FilterControlTemplate,
    },
});
</script>
