<template>
    <filter-widget-control
        :field="field"
        :predicate="(beta, direction) => (beta >= 0 || beta < 0) === direction"
        :pillFormatter="filterDefinition => `effect size ${filterDefinition.threshold ? 'positive' : 'negative'}`"
        :options="[{ value: true, text: 'positive' }, { value: false, text: 'negative' }]"
        :color="'warning'"
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
    props: ['field'],
    components: {
        FilterWidgetControl,
    }
})
</script>