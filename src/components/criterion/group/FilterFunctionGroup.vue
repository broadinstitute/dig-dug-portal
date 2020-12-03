<template>
    <filter-group-template
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
    </filter-group-template>
</template>
<script>
import Vue from "vue";
import FilterGroupTemplate from "@/components/criterion/template/FilterGroupTemplate.vue"
export default Vue.component('filter-function-group', {
    props: ['value', 'header', 'inclusive'],
    components:{ FilterGroupTemplate },
    methods: {
        emitInput(value) {
            this.$emit('input', value)
        }
    }
})
</script>
