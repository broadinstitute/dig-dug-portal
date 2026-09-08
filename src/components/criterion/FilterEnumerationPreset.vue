<template>
    <filter-control-preset
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
        :label="label"
        :multiple="!!multiple"
        :inclusive="!!inclusive || !!multiple"
        :disabled="disabled"
        :computedField="computedField"
        :fillFirstItem="fillFirstItem"
    >
        <slot> </slot>
    </filter-control-preset>
</template>
<script>
import Vue from "vue";
import FilterControlPreset from "@/components/criterion/template/FilterControlPreset";
import Formatter from "@/utils/formatters";

export default Vue.component("filter-enumeration-preset", {
    props: {
        field: String,
        placeholder: String,
        options: Array,
        color: String,
        label: String,
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
            default: (string, selection) => string === selection,
        },
        labelFormatter: {
            type: Function,
            default: Formatter.capitalizedFormatter,
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) =>
                `${filterDefinition.field} = ${
                    !!filterDefinition.labelFormatter
                        ? filterDefinition.labelFormatter(
                              filterDefinition.threshold
                          )
                        : filterDefinition.threshold
                }`,
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
        fillFirstItem: {
            type: Boolean,
            default: false
        }
    },
    components: {
        FilterControlPreset,
    },
    computed: {
        // Make options unique and sorted by default, and always
        // NOTE: Assumes that they are just strings! change?
        selectionOptions() {
            if (this.options !== null) {
                let options = this.options
                    .filter((v, i, arr) => arr.indexOf(v) == i)
                    .filter((v) => v != undefined);
                if (!this.disableSort) {
                    options = options.sort();
                }
                return options;
            } else {
                return [];
            }
        },
    },
});
</script>
