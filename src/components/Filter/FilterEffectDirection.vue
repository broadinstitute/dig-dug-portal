<template>
    <filter-control
        class="filter-col-sm"
        :field="field"
        :type="'string'"
        :predicate="(beta, direction) => {
            // must be positive
            if (direction === 'positive') {
                return Math.sign(beta) === 1;
            // must be negative
            } else if (direction === 'negative') {
                return Math.sign(beta) === -1;
            }
        }"
        :pillFormatter="filterDefinition => `effect size ${filterDefinition.threshold}`"
        :options="['positive', 'negative']"
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
    },
    methods: {
        tap(value) {
            if (value === true) {
                return 'positive'
            } else if (value === false) {
                return 'negative'
            };
        }
    }
})
</script>
