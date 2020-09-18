<template>

    <!-- To use the filterable wrapper, just use your component's applyFilter function when the @change event is emitted -->
    <!-- The contract: it should get the new function and apply it. In general these should be simple predicate functions applied on arrays of structs -->
    <filter-context-receiver @change="applyFilter($event)">
        <div>This component can consume a filter context</div>
        <pre>{{listOfStructs}}</pre>
    </filter-context-receiver>

</template>
<script>
import Vue from "vue";
import FilterContextReceiver from "@/components/FilterContext/FilterContextReceiver.vue"

export default Vue.component('filter-user', {
    components: {
        FilterContextReceiver,
    },
    data() {
        return {
            initialData: [
                { pValue: 0.01, beta: 3 },
                { pValue: 0.001, beta: 3 },
                { pValue: 0.2, beta: 3 },
                { pValue: 0.01, beta: 4 },
                { pValue: 0.01, beta:2 },
                { test: 'no matches' },
                { test: 'some matches' },
                { test: 'all matches' },
            ],
            listOfStructs: [],
        }
    },
    created() {
        this.listOfStructs = this.initialData;
    },
    methods: {
        applyFilter: function(filter) {
            this.listOfStructs = this.initialData.filter(filter);
        }
    }
})
</script>
