<template>
    <criterion-group-template
        :value="value"
        type='function'
        :looseMatch="true"
        :header="header"
        :inclusive="inclusive"
        @input="emitInput">
        <slot></slot>
        <template slot=filtered slot-scope="{ filter }">
            <slot name="filtered" :filter="filter"></slot>
        </template>
    </criterion-group-template>
</template>
<script>
import Vue from "vue";
import CriterionGroupTemplate from "@/components/criterion/template/CriterionGroupTemplate.vue"
export default Vue.component('criterion-function-group', {
    props: ['value', 'header', 'inclusive'],
    components:{ CriterionGroupTemplate },
    methods: {
        emitInput(value) {
            this.$emit('input', value)
        }
    }
})
</script>
