<template>
    <span>
        <filter-control-template
            class="filter-col-sm"
            :field="field"
            :type="'number'"
            :predicate="(number, bound) => filterGreater ? 
                number >= bound : number <= bound"
            :pillFormatter="filterDefinition => filterGreater ?
                    `${filterDefinition.field} ≥ ${filterDefinition.threshold}` : 
                    `${filterDefinition.field} <= ${filterDefinition.threshold}`"
            :placeholder="field"
            :color="color"
            :computedField="computedField"
            :multiple="false"
        >
            <slot>{{ field }}</slot>
        </filter-control-template>
        <select v-model="filterGreater">
            <option :value="true">&ge;</option>
            <option :value="false">&le;</option>
        </select>
    </span>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default Vue.component("filter-greater-less", {
    props: {
        field: String,
        computedField: Function,
        predicate: {
            type: Function,
            default: (number, lowerBound) => number >= lowerBound
        },
        pillFormatter: {
            type: Function,
            default: filterDefinition =>
                `${filterDefinition.field} ≥ ${filterDefinition.threshold}`
        },
        color: {
            type: String
        },
        placeholder: String
    },
    components: {
        FilterControlTemplate
    },
    data() { 
        return {
            filterGreater : true
        }
    }
});
</script>
