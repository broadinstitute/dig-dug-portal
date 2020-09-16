<template>
    <filter-widget-control
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} = ${filterDefinition.threshold}`"
        :options="uniqify(options)"
        :color="color"
        :multiple="true">
        <slot>
            Match
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
import { uniq, uniqBy } from "lodash";

export default Vue.component('filter-unique-control', {
    props: ['field', 'options'],
    components: {
        FilterWidgetControl,
    },
    methods: {
        uniqify(options) {
            // sample the options for their element type by taking the first option and assuming homogeneity
            const optionType = typeof options[0];
            if (optionType === 'object') {
                return uniqBy(options, this.field);
            } else if (optrionType === 'string') {
                return uniq(options);
            }
        }
    }
})
</script>
