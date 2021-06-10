<template>
    <filter-control-template
        class="filter-col-md"
        :field="field"
        :placeholder="placeholder"
        :type="'string'"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="
            (filterDefinition) =>
                `${filterDefinition.field} = ${labelFormatter(
                    filterDefinition.threshold
                )}`
        "
        :labelFormatter="labelFormatter"
        :options="selectionOptions"
        @input-change="$emit('input-change', $event)"
        :color="color"
        :multiple="!!multiple"
        :inclusive="!!inclusive || !!multiple"
        :disabled="disabled"
    >
        <slot> </slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
import Formatter from "@/utils/formatters";

export default Vue.component("filter-object-control", {
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
        labelFormatter: {
            type: Function,
            default: Formatter.capitalizedFormatter,
        },
        disableSort: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: Object
        }
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
