<template>
    <div id="dataset-associations" class="EGLT-table datasets" v-if="rows > 0">
        <b-container fluid v-if="!!phenotypeMap && !!datasetMap">
            <b-row class="top-level-header">
                <b-col class="top-level-header-item">Phenotype</b-col>
                <b-col class="top-level-header-item">P-Value</b-col>
                <b-col class="top-level-header-item">Beta</b-col>
                <b-col class="top-level-header-item">Odds Ratio</b-col>
                <b-col class="top-level-header-item">Sample Size</b-col>
                <b-col class="top-level-header-item">View</b-col>
            </b-row>
            <template v-for="(phenotype, name, index) in groupedAssociations">
                <b-row
                    :key="name"
                    :class="
                        index < (currentPage - 1) * perPage ||
                        index >= currentPage * perPage
                            ? 'hidden'
                            : ''
                    "
                >
                    <b-col class="top-level-value-item"
                        ><a :href="`/phenotype.html?phenotype=${name}`">{{
                            phenotypeMap[name].description
                        }}</a></b-col
                    >
                    <b-col class="top-level-value-item pValue">{{
                        pValueFormatter(phenotype[0].pValue)
                    }}</b-col>
                    <b-col class="top-level-value-item beta">
                        <template v-if="!phenotypeMap[name].dichotomous">
                            <span
                                :class="
                                    phenotype[0].beta < 0
                                        ? 'effect negative'
                                        : 'effect positive'
                                "
                                >{{
                                    phenotype[0].beta < 0
                                        ? "&#9660;"
                                        : "&#9650;"
                                }}</span
                            >
                            <span>{{
                                effectFormatter(phenotype[0].beta)
                            }}</span>
                        </template>
                    </b-col>
                    <b-col class="top-level-value-item beta">
                        <template v-if="!!phenotypeMap[name].dichotomous">
                            <span
                                :class="
                                    Math.exp(phenotype[0].beta) < 1
                                        ? 'effect negative'
                                        : 'effect positive'
                                "
                                >{{
                                    Math.exp(phenotype[0].beta) < 1
                                        ? "&#9660;"
                                        : "&#9650;"
                                }}</span
                            >
                            <span>{{
                                effectFormatter(Math.exp(phenotype[0].beta))
                            }}</span>
                        </template>
                    </b-col>
                    <b-col class="top-level-value-item">{{
                        intFormatter(phenotype[0].n)
                    }}</b-col>
                    <b-col class="top-level-value-item">
                        <b-button
                            @click="showDatasets(index)"
                            class="view-features-btn"
                            >Datasets</b-button
                        >
                    </b-col>
                </b-row>

                <div
                    :class="`feature-headers-${index}`"
                    class="feature-content-wrapper hidden"
                    :key="`features_${index}`"
                >
                    <b-row class="feature-header">
                        <b-col class="feature-header-item">Dataset</b-col
                        ><b-col class="feature-header-item">P-Value</b-col>
                        <b-col
                            class="feature-header-item"
                            v-if="!phenotypeMap[name].dichotomous"
                            >Beta</b-col
                        >
                        <b-col
                            class="feature-header-item"
                            v-if="!!phenotypeMap[name].dichotomous"
                            >Odds Ratio</b-col
                        >
                        <b-col class="feature-header-item">Sample Size</b-col>
                    </b-row>
                    <template v-for="(dataset, j) in phenotype">
                        <b-row
                            class="features"
                            :class="`features_${index}_${j}`"
                            :key="`features_${index}_${j}`"
                        >
                            <b-col class="feature-content-item">
                                <a
                                    v-if="!!datasetMap[dataset.dataset]"
                                    :href="`/dinspector.html?dataset=${dataset.dataset}`"
                                    >{{
                                        datasetMap[dataset.dataset].description
                                    }}</a
                                >
                                <span v-else>{{ dataset.dataset }}</span>
                            </b-col>
                            <b-col class="feature-content-item">{{
                                pValueFormatter(dataset.pValue)
                            }}</b-col>
                            <b-col
                                class="feature-content-item"
                                v-if="!phenotypeMap[name].dichotomous"
                            >
                                <span
                                    :class="
                                        dataset.beta < 0
                                            ? 'effect negative'
                                            : 'effect positive'
                                    "
                                    >{{
                                        dataset.beta < 0 ? "&#9660;" : "&#9650;"
                                    }}</span
                                >
                                {{ effectFormatter(dataset.beta) }}
                            </b-col>
                            <b-col
                                class="feature-content-item"
                                v-if="!!phenotypeMap[name].dichotomous"
                            >
                                <span
                                    :class="
                                        Math.exp(dataset.beta) < 1
                                            ? 'effect negative'
                                            : 'effect positive'
                                    "
                                    >{{
                                        Math.exp(dataset.beta) < 1
                                            ? "&#9660;"
                                            : "&#9650;"
                                    }}</span
                                >
                                {{ effectFormatter(Math.exp(dataset.beta)) }}
                            </b-col>
                            <b-col class="feature-content-item">{{
                                intFormatter(dataset.n)
                            }}</b-col>
                        </b-row>
                    </template>
                </div>
            </template>

            <b-pagination
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </b-container>
    </div>
</template>

<script>
import Vue from "vue";
import { orderBy, groupBy } from "lodash";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("dataset-associations", {
    props: ["associations", "phenotypeMap", "datasetMap"],
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
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        showDatasets(index) {
            uiUtils.showHideElement("feature-headers-" + index);
        },
    },
});
</script>

<style>
@import url("/css/effectorGenes.css");
</style>
