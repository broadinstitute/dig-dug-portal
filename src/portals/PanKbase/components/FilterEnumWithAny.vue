<template>
    <filter-enum-any-template
        class="filter-col-md"
        :field="field"
        :placeholder="null"
        :type="'string'"
        :options="selectionOptions"
        @input-change="$emit('input-change', $event)"
        :color="color"
        :label="label"
        :multiple="!!multiple"
        :inclusive="!!inclusive || !!multiple"
        :disabled="disabled"
        :computedField="computedField"
        :clear="false"
    >
        <slot> </slot>
    </filter-enum-any-template>
</template>
<script>
import Vue from "vue";
import FilterEnumAnyTemplate from "./FilterEnumAnyTemplate.vue";
import Formatter from "@/utils/formatters";

export default Vue.component("filter-enum-with-any", {
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
        disableSort: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        clearFilter: {
            type: Boolean,
            default: true,
        },
        computedField: Function,
    },
    components: {
        FilterEnumAnyTemplate,
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
