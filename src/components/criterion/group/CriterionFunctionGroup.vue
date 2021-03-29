<template>
    <criterion-group-template
        :ref="Math.floor(Math.random() * 10000).toString()"
        :value="value"
        :hide="hide"
        :filterType="'function'"
        :looseMatch="true"
        :header="header"
        :inclusive="inclusive"

        :filterList="filterList"
        :filterFunction="filterFunction"
        @update:filter-function="emitFilterFunction"
        @update:filter-list="emitFilterList"
    >
        <slot></slot>
        <template slot="filtered" slot-scope="{ filter }">
            <slot name="filtered" :filter="filter"></slot>
        </template>
    </criterion-group-template>
</template>
<script>
import Vue from "vue";
import CriterionGroupTemplate from "@/components/criterion/template/CriterionGroupTemplate.vue";
export default Vue.component("criterion-function-group", {
    props: {
        value: {
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
        inclusive: {
            type: Boolean,
        },
    },
    components: { CriterionGroupTemplate },
    methods: {
        emitInput(value) {
            this.$emit("input", value);
        },
        emitFilterList(value) {
            this.$emit("update:filter-list", value);
        },
        emitFilterFunction(value) {
            this.$emit("update:filter-function", value);
        },
    },
});
</script>
