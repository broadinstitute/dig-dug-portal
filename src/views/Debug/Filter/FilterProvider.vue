<template>
    <!-- `value` is the filter function -->
    <FilterP :value="value">
        <!-- slotted element must have filter consumer -->
        <slot></slot>
    </FilterP>
</template>
<script>
import Vue from "vue";
import { Provider as FilterP } from "./filterContext";
export default Vue.component('filter-context', {
    // NOTE: using the prop name `value`, although generic, lets us use v-model smoothly
    // TODO: expand value to have function as its prop type?
    props: ['value'],
    components: {
        FilterP,
    },
})
</script>