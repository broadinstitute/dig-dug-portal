<template>
    <filter-control
        class="filter-col-md"
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="
            (filterDefinition) =>
                `${filterDefinition.field} = ${filterDefinition.threshold}`
        "
        :options="options"
        :color="color"
        :multiple="true"
        :inclusive="inclusive"
        :splitBy="splitBy"
    >
        <slot> </slot>
    </filter-control>
</template>
<script>
import Vue from "vue";
import FilterControl from "./FilterControl";
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
    },
    components: {
        FilterControl,
    },
});
</script>
