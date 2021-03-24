<template>
    <criterion-group-template
        :ref="Math.floor(Math.random() * 10000).toString()"
        :value="value"
        :hide="hide"
        :filterType="'list'"
        :looseMatch="true"
        :header="header"
        @input="emitInput"
        @update-filter-function="emitFilterFunction"
        @update-filter-list="emitFilterList"
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

export default Vue.component("criterion-list-group", {
    props: {
        hide: Boolean,
        value: {
            type: Array,
            default: function () {
                return [];
            },
            validator: function (predicateSpecs) {
                if (Array.isArray(predicateSpecs)) {
                    if (predicateSpecs.length > 0) {
                        return predicateSpecs.every((predicateSpec) => {
                            return (
                                typeof predicateSpec.field !== "undefined" &&
                                typeof predicateSpec.threshold !== "undefined"
                            );
                        });
                    } else {
                        return true;
                    }
                }
            },
        },
        header: String,
    },
    components: { CriterionGroupTemplate },
    methods: {
        emitInput(value) {
            this.$emit("input", value);
        },
        emitFilterList(value) {
            this.$emit("update-filter-list", value);
        },
        emitFilterFunction(value) {
            this.$emit("update-filter-function", value);
        },
    },
});
</script>
