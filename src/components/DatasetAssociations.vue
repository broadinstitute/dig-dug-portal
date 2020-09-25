<template>
    <div id="dataset-associations">hello</div>
</template>

<script>
import Vue from "vue";
import { orderBy, groupBy } from "lodash";
export default Vue.component("dataset-associations", {
    data() {
        return {
            perPage: 25,
            currentPage: 1,
        };
    },
    computed: {
        associations() {
            return this.$store.state.datasetAssociations.data;
        },
        groupedAssociations() {
            let ordered = orderBy(this.associations, "pValue");
            return groupBy(ordered, "phenotype");
        },
    },
});
</script>

<style>
</style>
