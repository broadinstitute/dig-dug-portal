<template>
    <div id="dataset-associations" v-if="rows > 0">
        <div
            v-for="(phenotype, name, index) in groupedAssociations"
            :key="index"
            :class="
                index < (currentPage - 1) * perPage ||
                index >= currentPage * perPage
                    ? 'hidden'
                    : ''
            "
        >
            <b-col>{{ phenotypeMap[name].description }}</b-col>
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
            return Object.keys(this.groupedAssociations).length;
        },
        // itemList() {
        //     return this.groupedAssociations.splice(
        //         (this.currentPage - 1) * this.perPage,
        //         this.currentPage * this.perPage
        //     );
        // },
    },
});
</script>

<style>
</style>
