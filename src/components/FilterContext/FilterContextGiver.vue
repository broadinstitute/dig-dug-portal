<template>
    <!-- `value` is the filter function -->
    <!-- `name` is some metadata used to negotiate how to treat multiple filter functions -->
    <FilterProvider :value="filter">
        <!-- slotted element must have filter consumer (e.g. has a FilterContextReceiver) -->
        <slot><span></span></slot>
    </FilterProvider>
</template>
<script>
import Vue from "vue";
import { Provider as FilterProvider } from "@/utils/filterHelpers";
export default Vue.component('filter-context-giver', {
    // NOTE: using the prop name `value`, although generic, lets us use v-model smoothly
    props: ['value', 'name'],
    components: {
        FilterProvider,
    },
    created() {
        console.log('provider', this.value, this.name)
    },
    computed: {
        filter() {
            return {
                value: this.value,
                name: this.name
            }
        }
    }
})
</script>
