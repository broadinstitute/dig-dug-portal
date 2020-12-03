<template>
    <filter-group-template
        :value="value"
        type='list'
        :looseMatch="true"
        :header="header"
        @input="emitInput">
        <slot></slot>
        <template slot=filtered slot-scope="{ filter }">
            <slot name="filtered" :filter="filter"></slot>
        </template>
    </filter-group-template>
</template>

<script>
import Vue from "vue"
import FilterGroupTemplate from "@/components/criterion/template/FilterGroupTemplate.vue"

export default Vue.component('filter-list-group', {
    props: {
        value: {
            type: Array,
            validator: function (predicateSpecs) {
                if (Array.isArray(predicateSpecs)) {
                    if (predicateSpecs.length > 0) {
                        return predicateSpecs.every(predicateSpec => {
                            return typeof predicateSpec.field !== 'undefined' &&
                                    typeof predicateSpec.threshold !== 'undefined'
                                    // &&
                                    // typeof predicateSpec.pill !== 'undefined' &&
                                    // typeof predicateSpec.pill.label !== 'undefined';
                        });
                    } else {
                        return true;
                    }
                }
            }
        },
        header: String,
    },
    components:{ FilterGroupTemplate },
    methods: {
        emitInput(value) {
            this.$emit('input', value)
        }
    }
})
</script>
