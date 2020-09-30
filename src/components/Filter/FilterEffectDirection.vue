<template>
    <filter-control
        :field="field"
        :type="'boolean'"
        :predicate="(beta, direction) => {
            // must be positive
            if (direction === true) {
                return Math.sign(beta) === 1;
            // must be negative
            } else {
                return Math.sign(beta) === -1;
            }
        }"
        :pillFormatter="filterDefinition => `effect size ${filterDefinition.threshold ? 'positive' : 'negative'}`"
        :options="[{ value: true, text: 'positive' }, { value: false, text: 'negative' }]"
        :color="'#007bff'"
        :multiple="false">
        <slot>
            Effect (+/-)
        </slot>
    </filter-control>
</template>
<script>
import Vue from "vue";
import FilterControl from "./FilterControl"
export default Vue.component('filter-effect-direction-control', {
    props: ['field'],
    components: {
        FilterControl,
    }
})
</script>
