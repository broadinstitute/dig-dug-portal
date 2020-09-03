<template>
    <!-- To use the filterable wrapper, just use your component's applyFilter function when the @change event is emitted -->
    <!-- The contract: it should get the new function and apply it. In general these should be simple predicate functions applied on arrays of structs-->
    <filterable-wrapper @change="applyFilter($event)">
        <div>This component can use a filter</div>
    </filterable-wrapper>
</template>
<script>
import Vue from "vue";
import FilterableWrapper from "./Filter/FilterableWrapper.vue"

export default Vue.component('filter-user', {
    components: {
        FilterableWrapper,
    },
    methods: {
        applyFilter: function(filter) {
            console.log('filter function change');
        }
    }
})
</script>