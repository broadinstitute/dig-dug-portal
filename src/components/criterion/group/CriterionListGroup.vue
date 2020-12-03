<template>
    <criterion-group-template
        :value="value"
        type='list'
        :looseMatch="true"
        :header="header"
        @input="emitInput">
        <slot></slot>
        <template slot=filtered slot-scope="{ filter }">
            <slot name="filtered" :filter="filter"></slot>
        </template>
    </criterion-group-template>
</template>

<script>
import Vue from "vue"
import CriterionGroupTemplate from "@/components/criterion/template/CriterionGroupTemplate.vue"

export default Vue.component('criterion-function-group', {
    props: {
        value: {
            type: Array,
            validator: function (predicateSpecs) {
                if (Array.isArray(predicateSpecs)) {
                    if (predicateSpecs.length > 0) {
                        return predicateSpecs.every(predicateSpec => {
                            return typeof predicateSpec.field !== 'undefined' &&
                                    typeof predicateSpec.threshold !== 'undefined'
                        });
                    } else {
                        return true;
                    }
                }
            }
        },
        header: String,
    },
    components:{ CriterionGroupTemplate },
    methods: {
        emitInput(value) {
            this.$emit('input', value)
        }
    }
})
</script>
