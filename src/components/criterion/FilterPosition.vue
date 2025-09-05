<template>
    <filter-control-template
        class="filter-col-sm"
        :field="field"
        :predicate="
                (number, bounds) => fitsCriteria(number, bounds)
            "
        :pillFormatter="pillFormatter"
        :placeholder="placeholder"
        :color="color"
        :computedField="computedField"
        :multiple="false"
        :disabled="disabled"
        @input-change="getInput()"
    >
        <slot>{{ field }}</slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default Vue.component("filter-position", {
    props: {
        field: {
            type: String,
            default: "position"
        },
        computedField: Function,
        pillFormatter: {
            type: Function,
            default: filterDefinition =>
                `${filterDefinition.field} ${filterDefinition.threshold}`
        },
        color: {
            type: String
        },
        placeholder: String,
        disabled: {
            type: Boolean,
            default: true
        }
    },
    components: {
        FilterControlTemplate
    },
    methods: {
        fitsCriteria(number, bounds){
            let region = bounds.split("-");
            let start = parseInt(region[0].trim())
            if (isNaN(start)){
                return false; // Bad input
            }
            let end = region.length >= 2 ? parseInt(region[1].trim()) : null;
            console.log(start, end);
            return end !== null 
                ? (number >= start && number <= end)
                : (number >= start);
        }
    }
});
</script>
