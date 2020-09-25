<template>
    <div id="dataset-associations" v-if="rows > 0">
        <div v-for="(phenotype, index) in groupedAssociations" :key="phenotype">
            <b-col>{{ phenotypeMap[index].description }}</b-col>
        </div>
        <b-pagination
            class="pagination-sm justify-content-center"
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
        ></b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import { orderBy, groupBy } from "lodash";
export default Vue.component("dataset-associations", {
    props: ["associations", "phenotypeMap"],
    data() {
        return {
            perPage: 25,
            currentPage: 1,
        };
    },
    computed: {
        groupedAssociations() {
            let ordered = orderBy(this.associations, ["pValue"], ["desc"]);
            return groupBy(ordered, "phenotype");
        },
        rows() {
            return this.associations.length;
        },
    },
});
</script>

<style>
</style>
