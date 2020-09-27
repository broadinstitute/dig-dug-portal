<template>
    <div id="dataset-associations" v-if="rows > 0">
        <b-row
            v-for="(phenotype, name, index) in groupedAssociations"
            :key="name"
            :class="
                index < (currentPage - 1) * perPage ||
                index >= currentPage * perPage
                    ? 'hidden'
                    : ''
            "
        >
            <b-col>{{ phenotypeMap[name].description }}</b-col>
            <b-col>{{ phenotype }}</b-col>
            <b-col>{{ name }}</b-col
            ><b-col>{{ index }}</b-col>
            <b-col>{{ pValueFormatter(phenotype[0].pValue) }}</b-col>
        </b-row>
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
import Formatters from "@/utils/formatters";
export default Vue.component("dataset-associations", {
    props: ["associations", "phenotypeMap"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
        };
    },
    computed: {
        groupedAssociations() {
            let ordered = orderBy(this.associations, ["pValue"], ["asc"]);
            return groupBy(ordered, "phenotype");
        },
        rows() {
            return Object.keys(this.groupedAssociations).length;
        },
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        betaFormatter: Formatters.betaFormatter,
    },
});
</script>

<style>
</style>
