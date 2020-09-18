<template>
    <!-- `value` is the filter function -->
    <FilterProvider :value="value">
        <!-- slotted element must have filter consumer (e.g. has a FilterContextReceiver) -->
        <slot></slot>
    </FilterProvider>
</template>
<script>
import Vue from "vue";
import { Provider as FilterProvider } from "@/utils/filterHelpers";
export default Vue.component('filter-context-giver', {
    // NOTE: using the prop name `value`, although generic, lets us use v-model smoothly
    props: ['value'],
    components: {
        FilterProvider,
    },
})
</script>