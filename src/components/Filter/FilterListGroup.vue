<template>
    <filter-group
        :value="value"
        :looseMatch="looseMatch"
        :filterMaker="id=>id"
        :predicateMaker="id=>id"
        :header="header"
        @input="emitInput">
        <slot></slot>
    </filter-group>
</template>
<script>
import Vue from "vue"
import FilterGroup from "./FilterGroup.vue"
export default Vue.component('filter-list-group', {
    props: {
        value: {
            type: Array,
            validator: function (predicateSpecs) {
                if (Array.isArray(predicateSpecs)) {
                    if (predicateSpecs.length > 0) {
                        return predicateSpecs.every(predicateSpec => {
                            return typeof predicateSpec.field !== 'undefined' &&
                                    typeof predicateSpec.threshold !== 'undefined' &&
                                    typeof predicateSpec.pill !== 'undefined' &&
                                    typeof predicateSpec.pill.label !== 'undefined';
                        });
                    } else {
                        return true;
                    }
                }
            }
        },
        looseMatch: Boolean,
        header: String,
    },
    components:{ FilterGroup },
    methods: {
        emitInput(value) {
            this.$emit('input', value)
        }
    }
})
</script>
