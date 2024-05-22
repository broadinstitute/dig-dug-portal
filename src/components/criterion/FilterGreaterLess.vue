<template>
    <span class="greater-less-filter">
        <select v-model="filterGreater" class="form-control form-control-sm">
            <option :value="true">&ge;</option>
            <option :value="false">&le;</option>
        </select>
        <filter-control-template
            :field="field"
            :type="'number'"
            :predicate="
                (number, bound) =>
                    filterGreater ? number >= bound : number <= bound
            "
            :pillFormatter="
                (filterDefinition) =>
                    filterGreater
                        ? `${label} ≥ ${filterDefinition.threshold}`
                        : `${label} ≤ ${filterDefinition.threshold}`
            "
            :placeholder="`${label} ${filterGreater ? '≥' : '≤'}`"
            :color="color"
            :computedField="computedField"
            :multiple="false"
        >
            <slot>{{ field }}</slot>
        </filter-control-template>
    </span>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default Vue.component("filter-greater-less", {
    props: {
        field: String,
        label: String,
        computedField: Function,
        predicate: {
            type: Function,
            default: (number, lowerBound) => number >= lowerBound,
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) =>
                `${filterDefinition.field} ≥ ${filterDefinition.threshold}`,
        },
        color: {
            type: String,
        },
        placeholder: String,
    },
    components: {
        FilterControlTemplate,
    },
    data() {
        return {
            filterGreater: true,
        };
    },
});
</script>
<style scoped>
select.form-control {
    display: inline-block;
    width: auto;
}
</style>
