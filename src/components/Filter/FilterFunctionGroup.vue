<template>
    <filter-group
        :value="value"
        :looseMatch="looseMatch"
        :header="header"
        @input="emitInput">
        <slot></slot>
    </filter-group>
</template>
<script>
import Vue from "vue"
import FilterControl from "./FilterControl.vue"
export default Vue.component('filter-list-group', {
    props: ['value', 'looseMatch', 'header'],
    components:{ FilterControl },
    methods: {
        emitInput(value) {
            this.$emit('input', value)
        }
    }
})
</script>
