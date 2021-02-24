<template>
    <filter-control-template
        class="filter-col-sm"
        :field="field"
        :type="'string'"
        :predicate="
            (beta, direction) => {
                // must be positive
                if (direction === 'positive') {
                    return Math.sign(beta) === 1;
                    // must be negative
                } else if (direction === 'negative') {
                    return Math.sign(beta) === -1;
                }
            }
        "
        :pillFormatter="
            (filterDefinition) => `effect size ${filterDefinition.threshold}`
        "
        :options="['positive', 'negative']"
        @input-change="$emit('input-change', $event)"
        :multiple="false"
    >
        <slot></slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default Vue.component("filter-effect-direction-control", {
    props: ["field"],
    components: {
        FilterControlTemplate,
    },
    methods: {
        tap(value) {
            if (value === true) {
                return "positive";
            } else if (value === false) {
                return "negative";
            }
        },
    },
});
</script>
