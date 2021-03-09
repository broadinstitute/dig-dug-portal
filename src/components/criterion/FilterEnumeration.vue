<template>
    <filter-control-template
        class="filter-col-md"
        :field="field"
        :placeholder="placeholder"
        :type="'string'"
        :predicate="predicate"
        :pillFormatter="pillFormatter"
        :labelFormatter="labelFormatter"
        :options="selectionOptions"
        @input-change="$emit('input-change', $event)"
        :color="color"
        :multiple="!!multiple"
        :inclusive="!!inclusive || !!multiple"
        :disabled="disabled"
        :computedField="computedField"
    >
        <slot> </slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
import Formatter from "@/utils/formatters";

export default Vue.component("filter-enumeration-control", {
    props: {
        field: String,
        placeholder: String,
        options: Array,
        color: String,
        multiple: {
            type: Boolean,
            default: false,
        },
        inclusive: {
            type: Boolean,
            default: false,
        },
        predicate: {
            type: Function,
            default: (string, selection) => string === selection
        },
        labelFormatter: {
            type: Function,
            default: Formatter.capitalizedFormatter,
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) =>
                `${filterDefinition.field} = ${Formatter.capitalizedFormatter(
                    filterDefinition.threshold
                )}`
        },
        disableSort: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        computedField: Function,
    },
    components: {
        FilterControlTemplate,
    },
    computed: {
        // Make options unique and sorted by default, and always
        // NOTE: Assumes that they are just strings! change?
        selectionOptions() {
            let options = this.options
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v) => v != undefined);
            if (!this.disableSort) {
                options = options.sort();
            }
            return options;
        },
    },
});
</script>
