<template>
    <div v-if="associations.length > 0" class="EGLT-table fiftytwo">
        <b-container fluid>
            <div class="text-right mt-2 mb-2 border-0">
                <data-download
                    :data="associations"
                    filename="rare_variant_gene_associations"
                ></data-download>
            </div>
            <b-row class="top-level-header">
                <b-col class="top-level-header-item" cols="4">Phenotype</b-col>
                <b-col class="top-level-header-item" cols="2">pValue</b-col>
                <b-col class="top-level-header-item" cols="2">Beta</b-col>
                <b-col class="top-level-header-item" cols="2">Odds Ratio</b-col>
                <b-col class="top-level-header-item" cols="2">View</b-col>
            </b-row>
            <template v-for="(row, i) in paginatedAssociations">
                <b-row
                    v-if="phenotypeMap[row.phenotype]"
                    :key="row.phenotype + i"
                    class="data top-level-value"
                >
                    <b-col class="top-level-value-item" cols="4">
                        <a
                            :href="`/phenotype.html?phenotype=${row.phenotype}`"
                            >{{ phenotypeMap[row.phenotype].description }}</a
                        >
                    </b-col>
                    <b-col class="top-level-value-item pValue" cols="2">{{
                        pValueFormatter(row.pValue)
                    }}</b-col>
                    <b-col class="top-level-value-item beta" cols="2">
                        <template
                            v-if="!phenotypeMap[row.phenotype].dichotomous"
                        >
                            <span
                                :class="
                                    row.beta < 0
                                        ? 'effect negative'
                                        : 'effect positive'
                                "
                                >{{
                                    row.beta < 0 ? "&#9660;" : "&#9650;"
                                }}</span
                            >
                            <span>{{ effectFormatter(row.beta) }}</span>
                        </template>
                    </b-col>
                    <b-col class="top-level-value-item beta" cols="2">
                        <template
                            v-if="!!phenotypeMap[row.phenotype].dichotomous"
                        >
                            <span
                                :class="
                                    Math.exp(row.beta) < 1
                                        ? 'effect negative'
                                        : 'effect positive'
                                "
                                >{{
                                    Math.exp(row.beta) < 1
                                        ? "&#9660;"
                                        : "&#9650;"
                                }}</span
                            >
                            <span>{{
                                effectFormatter(Math.exp(row.beta))
                            }}</span>
                        </template>
                    </b-col>
                    <b-col class="top-level-value-item" cols="2">
                        <b-button
                            :disabled="!row.masks.length"
                            class="view-features-btn"
                            @click="
                                showFeatures((currentPage - 1) * perPage + i)
                            "
                            >Masks + Plot</b-button
                        >
                    </b-col>
                </b-row>
                <mask-table
                    v-if="!!phenotypeMap[row.phenotype]"
                    :key="(currentPage - 1) * perPage + i"
                    :mask-data="row.masks"
                    :index="(currentPage - 1) * perPage + i"
                    :dichotomous="!!phenotypeMap[row.phenotype].dichotomous"
                    :is-hidden="true"
                ></mask-table>
            </template> </b-container
        ><b-pagination
            v-model="currentPage"
            class="pagination-sm justify-content-center mt-3"
            :total-rows="filteredAssociations.length"
            :per-page="perPage"
        ></b-pagination>
    </div>
    <div v-else>No data available for this query.</div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import Formatters from "@/utils/formatters";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import MaskTable from "@/components/MaskTable";
import DataDownload from "@/components/DataDownload";

export default Vue.component("GeneAssociationsMasks", {
    props: ["associations", "phenotypeMap", "filter"],
    component: { MaskTable, DataDownload },
    data() {
        return {
            visible: false,
            currentPage: 1,
            perPage: 10,
        };
    },
    computed: {
        paginatedAssociations() {
            return (
                this.filteredAssociations.slice(
                    (this.currentPage - 1) * this.perPage,
                    this.currentPage * this.perPage
                ) || []
            );
        },
        //filter associations that only exist in the phenotypeMap
        filteredAssociations() {
            let assocs = !this.filter ? this.associations : this.associations.filter(this.filter);
            return (
                assocs.filter((row) => {
                    return this.phenotypeMap[row.phenotype];
                }) || []
            );
        },
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        showFeatures(index) {
            //console.log("index: ", index);
            uiUtils.showHideElement("feature-headers-" + index);
            uiUtils.showHideElement("feature-plot-" + index);
        },
    },
});
</script>

<style>
@import url("/css/effectorGenes.css");
</style>
