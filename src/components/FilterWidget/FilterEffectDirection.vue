<template>
    <filter-widget-control
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
        :color="color"
        :multiple="false">
        <slot>
            Effect (+/-)
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
export default Vue.component('filter-effect-direction-control', {
    props: ['field', 'color'],
    components: {
        FilterWidgetControl,
    }
})
</script>
