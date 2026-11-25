<template>
    <criterion-group-template
        :ref="Math.floor(Math.random() * 10000).toString()"
        
        :modelValue="value"
        @update:modelValue="emitInput"

        :hide="hide"
        :filterType="'list'"
        :looseMatch="true"
        :header="header"
        
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
    name: "criterion-list-group",
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
        filterList: {
            type: Array,
        },
        filterFunction: {
            type: Function,
        },
        header: String,
    },
    emits: ["input", "update-filter-list", "update-filter-function"],
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
};
</script>
