<template>
    <filter-control-template
        class="filter-col-md"
        :field="field"
        :placeholder="placeholder"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="
            (filterDefinition) =>
                `${filterDefinition.field} = ${filterDefinition.threshold}`
        "
        :options="options"
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
        placeholder: String,
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
