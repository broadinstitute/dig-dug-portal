<template>
    <criterion-group-template
        :ref="Math.floor(Math.random() * 10000).toString()"
        
        :modelValue="modelValue"
        @update:modelValue="emitModelValue"

        :hide="hide"
        :filterType="'function'"
        :looseMatch="true"
        :header="header"
        :noPills="noPills"
        :inlinePills="inlinePills"
        :inclusive="inclusive"

        :filterList="filterList"
        :filterFunction="filterFunction"
        @update:filter-function="emitFilterFunction"
        @update:filter-list="emitFilterList"
    >
        <slot></slot>
        <template v-slot:filtered="{ filter }">
            <slot name="filtered" :filter="filter"></slot>
        </template>
    </criterion-group-template>
</template>
<script>
import CriterionGroupTemplate from "@/components/criterion/template/CriterionGroupTemplate.vue";
export default {
    name: "criterion-function-group",
    // the default config builds with compat, which would make value/input of a parent's v-model
    compatConfig: { COMPONENT_V_MODEL: false },
    props: {
        modelValue: {
            type: Function,
            default: function (id) {
                return true;
            },
        },
        filterList: {
            type: Array,
        },
        filterFunction: {
            type: Function,
        },
        header: String,
        hide: Boolean,
        noPills: Boolean,
        inlinePills: Boolean,
        inclusive: {
            type: Boolean,
        },
    },
    emits: ["update:modelValue", "update:filter-list", "update:filter-function"],
    components: { CriterionGroupTemplate },
    methods: {
        emitModelValue(value) {
            this.$emit("update:modelValue", value);
        },
        emitFilterList(value) {
            this.$emit("update:filter-list", value);
        },
        emitFilterFunction(value) {
            this.$emit("update:filter-function", value);
        },
    },
};
</script>
