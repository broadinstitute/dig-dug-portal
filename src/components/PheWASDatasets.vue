<template>
    <div>
        <div
            v-if="rows > 0"
            id="phewas-datasets"
            class="EGLT-table variant-datasets"
        >
            <div class="text-right mt-2">
                <data-download
                    :data="downloadData"
                    filename="PheWAS_associations"
                ></data-download>
            </div>
            <b-container
                v-if="!!phenotypeMap && !!datasetMap"
                fluid
                class="list"
            >
                <b-row class="top-level-header">
                    <b-col cols="4" class="top-level-header-item"
                        >Phenotype</b-col
                    >
                    <b-col class="top-level-header-item">P-Value</b-col>
                    <b-col class="top-level-header-item">Beta</b-col>
                    <b-col class="top-level-header-item">Odds Ratio</b-col>
                    <b-col cols="2" class="top-level-header-item"
                        >Effective Sample Size</b-col
                    >
                    <b-col class="top-level-header-item">View</b-col>
                </b-row>
                <template v-for="(item, index) in tableData">
                    <b-row :key="index" class="top-level-value">
                        <b-col cols="4" class="top-level-value-item"
                            ><a
                                :href="`/phenotype.html?phenotype=${item.phenotype.name}`"
                                >{{ item.phenotype.description }}</a
                            ></b-col
                        >
                        <b-col
                            class="top-level-value-item pValue"
                            :class="
                                item.pValue < 1e-5
                                    ? 'variant-table-cell high'
                                    : ''
                            "
                            >{{ pValueFormatter(item.pValue) }}</b-col
                        >
                        <b-col class="top-level-value-item beta">
                            <template v-if="!item.phenotype.dichotomous">
                                <span
                                    :class="
                                        item.beta < 0
                                            ? 'effect negative'
                                            : 'effect positive'
                                    "
                                    >{{
                                        item.beta < 0 ? "&#9660;" : "&#9650;"
                                    }}</span
                                >
                                <span>{{ effectFormatter(item.beta) }}</span>
                            </template>
                        </b-col>
                        <b-col class="top-level-value-item beta">
                            <template v-if="!!item.phenotype.dichotomous">
                                <span
                                    :class="
                                        Math.exp(item.beta) < 1
                                            ? 'effect negative'
                                            : 'effect positive'
                                    "
                                    >{{
                                        Math.exp(item.beta) < 1
                                            ? "&#9660;"
                                            : "&#9650;"
                                    }}</span
                                >
                                <span>{{
                                    effectFormatter(Math.exp(item.beta))
                                }}</span>
                            </template>
                        </b-col>
                        <b-col class="top-level-value-item">{{
                            intFormatter(item.n)
                        }}</b-col>
                        <b-col class="top-level-value-item">
                            <b-button
                                class="view-features-btn"
                                @click="showDatasets(index)"
                                >Datasets</b-button
                            >
                            <b-button
                                class="view-features-btn"
                                :disabled="!item.clump"
                                @click="
                                    getClumpedVariants(
                                        index,
                                        item.phenotype.name,
                                        item.clump
                                    )
                                "
                                >Top 25 variants</b-button
                            >
                        </b-col>
                    </b-row>

                    <div
                        :key="`features_${index}`"
                        :class="`features_${index}`"
                        class="feature-content-wrapper hidden"
                    >
                        <b-row class="feature-header">
                            <b-col cols="5" class="feature-header-item"
                                >Dataset</b-col
                            ><b-col class="feature-header-item">P-Value</b-col>
                            <b-col
                                v-if="!item.phenotype.dichotomous"
                                class="feature-header-item"
                                >Beta</b-col
                            >
                            <b-col
                                v-if="!!item.phenotype.dichotomous"
                                class="feature-header-item"
                                >Odds Ratio</b-col
                            >
                            <b-col class="feature-header-item"
                                >Effective Sample Size</b-col
                            >
                        </b-row>
                        <template v-for="(dataset, j) in item.datasets">
                            <b-row
                                v-if="!!datasetMap[dataset.dataset]"
                                :key="`features_${index}_${j}`"
                                :class="`features_${index}_${j}`"
                                class="feature-row"
                            >
                                <b-col cols="5" class="feature-content-item">
                                    <a
                                        :href="`/dinspector.html?dataset=${dataset.dataset}&phenotype=${item.phenotype.name}`"
                                        >{{
                                            datasetMap[dataset.dataset]
                                                .description
                                        }}</a
                                    >
                                </b-col>
                                <b-col class="feature-content-item">{{
                                    pValueFormatter(dataset.pValue)
                                }}</b-col>
                                <b-col
                                    v-if="!item.phenotype.dichotomous"
                                    class="feature-content-item"
                                >
                                    <span
                                        :class="
                                            dataset.beta < 0
                                                ? 'effect negative'
                                                : 'effect positive'
                                        "
                                        >{{
                                            dataset.beta < 0
                                                ? "&#9660;"
                                                : "&#9650;"
                                        }}</span
                                    >
                                    {{ effectFormatter(dataset.beta) }}
                                </b-col>
                                <b-col
                                    v-if="!!item.phenotype.dichotomous"
                                    class="feature-content-item"
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
                                    {{
                                        effectFormatter(Math.exp(dataset.beta))
                                    }}
                                </b-col>
                                <b-col class="feature-content-item">{{
                                    intFormatter(dataset.n)
                                }}</b-col>
                            </b-row>
                        </template>
                    </div>
                    <div
                        :key="`features_top25_${index}`"
                        :class="`features_top25_${index}`"
                        class="feature-content-wrapper hidden"
                    >
                        <b-row class="feature-header">
                            <b-col class="feature-header-item"
                                >Variant ID</b-col
                            >
                            <b-col class="feature-header-item">rsID</b-col>
                            <b-col class="feature-header-item">Ref/Alt</b-col>
                            <b-col class="feature-header-item">P-Value</b-col>
                            <b-col class="feature-header-item">Beta</b-col>
                            <b-col class="feature-header-item">MAF</b-col>
                            <b-col class="feature-header-item"
                                >Standard Error</b-col
                            >
                            <b-col class="feature-header-item">Z Score</b-col>
                            <b-col cols="2" class="feature-header-item"
                                >Consequence</b-col
                            >
                            <b-col class="feature-header-item"
                                >Nearest Genes</b-col
                            >
                        </b-row>
                        <template v-for="i in 25">
                            <b-row
                                :key="`features_top25_${index}_${i}`"
                                :id="`${index}_${item.phenotype.name}_variant_${
                                    i - 1
                                }`"
                                class="feature-content hidden"
                            >
                                <b-col
                                    :id="`${index}_${item.phenotype.name}_var${
                                        i - 1
                                    }_varId`"
                                    class="feature-content-item"
                                ></b-col>
                                <b-col
                                    :id="`${index}_${item.phenotype.name}_var${
                                        i - 1
                                    }_dbSNP`"
                                    class="feature-content-item"
                                ></b-col>
                                <b-col
                                    :id="`${index}_${item.phenotype.name}_var${
                                        i - 1
                                    }_reference`"
                                    class="feature-content-item"
                                ></b-col>
                                <b-col
                                    :id="`${index}_${item.phenotype.name}_var${
                                        i - 1
                                    }_pValue`"
                                    class="feature-content-item"
                                ></b-col>
                                <b-col
                                    :id="`${index}_${item.phenotype.name}_var${
                                        i - 1
                                    }_beta`"
                                    class="feature-content-item"
                                ></b-col>
                                <b-col
                                    :id="`${index}_${item.phenotype.name}_var${
                                        i - 1
                                    }_maf`"
                                    class="feature-content-item"
                                ></b-col>
                                <b-col
                                    :id="`${index}_${item.phenotype.name}_var${
                                        i - 1
                                    }_stdErr`"
                                    class="feature-content-item"
                                ></b-col>
                                <b-col
                                    :id="`${index}_${item.phenotype.name}_var${
                                        i - 1
                                    }_zScore`"
                                    class="feature-content-item"
                                ></b-col>
                                <b-col
                                    :id="`${index}_${item.phenotype.name}_var${
                                        i - 1
                                    }_consequence`"
                                    cols="2"
                                    class="feature-content-item"
                                ></b-col>
                                <b-col
                                    :id="`${index}_${item.phenotype.name}_var${
                                        i - 1
                                    }_nearest`"
                                    class="feature-content-item"
                                ></b-col>
                            </b-row>
                        </template>
                        <b-button class="btn btn-primary">
                            <a
                                :href="
                                    viewAllVariantsLink(
                                        item.phenotype.name,
                                        item.clump
                                    )
                                "
                            >
                                View all variants in clump</a
                            >
                        </b-button>
                    </div>
                </template>
            </b-container>
            <b-pagination
                v-model="currentPage"
                class="pagination-sm justify-content-center"
                :total-rows="rows"
                :per-page="perPage"
                @page-click="closeAllDatasets()"
            ></b-pagination>
        </div>
        <p v-else>No PheWAS associations available for this query.</p>
    </div>
</template>

<script>
import Vue from "vue";
import { BIO_INDEX_HOST } from "../utils/bioIndexUtils";
import { orderBy, groupBy, cloneDeep } from "lodash";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import DataDownload from "@/components/DataDownload";
export default Vue.component("PhewasDatasets", {
    components: { DataDownload },
    props: [
        "associations",
        "datasets",
        "phenotypeMap",
        "datasetMap",
        "filter",
        "ancestry",
    ],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            phenotypesLoaded: {},
        };
    },
    computed: {
        groupedDatasets() {
            let filteredDatasets = [];
            if (!!this.ancestry) {
                for (let dataset of this.datasets) {
                    let datasetKey = dataset.dataset;
                    if (!!this.datasetMap[datasetKey]) {
                        let datasetAncestry =
                            this.datasetMap[datasetKey].ancestry;
                        if (datasetAncestry == this.ancestry) {
                            filteredDatasets.push(dataset);
                        }
                    }
                }
            } else {
                filteredDatasets = this.datasets;
            }
            let ordered = orderBy(filteredDatasets, ["pValue"], ["asc"]);
            return groupBy(ordered, "phenotype");
        },
        pheWASAssociations() {
            if (!this.associations) {
                return [];
            }

            let phenotypes = this.phenotypeMap;
            let assocs = this.associations.map((a) => {
                return {
                    ...a,
                    phenotype: phenotypes[a.phenotype],
                    datasets: this.groupedDatasets[a.phenotype],
                };
            });

            return assocs
                .filter((a) => !!a.phenotype)
                .sort((a, b) => a.pValue - b.pValue);
        },
        rows() {
            return this.downloadData.length;
        },
        downloadData() {
            let dataRows = this.pheWASAssociations;

            if (this.filter) {
                dataRows = dataRows.filter((association) => {
                    const regularAssociation = Object.assign(
                        cloneDeep(association),
                        { phenotype: association.phenotype.name }
                    );
                    return this.filter(regularAssociation);
                });
            }

            return dataRows;
        },
        tableData() {
            let dataRows = this.downloadData;

            let tempArr = [];

            let arrIndex = (this.currentPage - 1) * this.perPage;
            let arrIndexLimit = arrIndex + this.perPage;

            for (let i = arrIndex; i < arrIndexLimit; i++) {
                if (dataRows[i]) {
                    tempArr.push(dataRows[i]);
                }
            }

            return tempArr;
        },
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        viewAllVariantsLink(phenotype, clump) {
            if (!this.ancestry) {
                return `/research.html?pageid=clumped_variants&phenotype=${phenotype}&clump=${clump}`;
            }
            return `/research.html?pageid=ancestry_clumped_variants&phenotype=${phenotype}&ancestry=${this.ancestry}&clump=${clump}`;
        },
        showDatasets(index) {
            uiUtils.hideElement(`features_top25_${index}`);
            uiUtils.showHideElement(`features_${index}`);
        },
        showTop25(index) {
            uiUtils.hideElement(`features_${index}`);
            uiUtils.showHideElement(`features_top25_${index}`);
        },
        closeAllDatasets() {
            let datasets = document.getElementsByClassName(
                "feature-content-wrapper"
            );

            Array.from(datasets).forEach((element) => {
                element.classList.add("hidden");
            });
        },
        fillTopClumpedVariants(index, phenotype, top25) {
            const dataFields = [
                "pValue",
                "maf",
                "stdErr",
                "zScore",
                "consequence",
            ];
            for (let i = 0; i < 25; i++) {
                let item = top25[i];
                let itemRow = document.getElementById(
                    `${index}_${phenotype}_variant_${i}`
                );
                if (item) {
                    itemRow.classList.remove("hidden");
                    let zScoreNumber = Number(item.zScore);
                    item.zScore = zScoreNumber.toPrecision(5);
                    item.pValue = this.pValueFormatter(item.pValue);
                    dataFields.forEach((dataField) => {
                        let tableCellId = `${index}_${phenotype}_var${i}_${dataField}`;
                        let tableCell = document.getElementById(tableCellId);
                        tableCell.innerText = item[dataField];
                    });
                    // Other fields: varId, dbSNP, nearest, beta, reference
                    let varIdCell = document.getElementById(
                        `${index}_${phenotype}_var${i}_varId`
                    );
                    varIdCell.innerHTML = `<a href="/variant.html?variant=
						${item.varId}">${item.varId}</a>`;

                    let dbSNPCell = document.getElementById(
                        `${index}_${phenotype}_var${i}_dbSNP`
                    );
                    dbSNPCell.innerHTML = `<a href="/variant.html?variant=
						${item.dbSNP}">${item.dbSNP}</a>`;

                    let nearestCell = document.getElementById(
                        `${index}_${phenotype}_var${i}_nearest`
                    );
                    nearestCell.innerHTML = `<a href="/gene.html?gene=
						${item.nearest}">${item.nearest}</a>`;

                    let betaCell = document.getElementById(
                        `${index}_${phenotype}_var${i}_beta`
                    );
                    let betaClass =
                        item.beta < 0 ? "effect negative" : "effect positive";
                    let betaSymbol = item.beta < 0 ? "&#9660;" : "&#9650;";
                    betaCell.innerHTML = `<span class="${betaClass}">
						${betaSymbol}</span>${item.beta}`;

                    let refAltCell = document.getElementById(
                        `${index}_${phenotype}_var${i}_reference`
                    );
                    refAltCell.innerText = `${item.reference}/${item.alt}`;
                }
            }
        },
        async getClumpedVariants(index, phenotype, clump) {
            // if already loaded, just toggle it open
            let clumpQuery = `${phenotype},${clump}`;
            let ancestryClumpQuery = `${phenotype},${this.ancestry},${clump}`;
            let query = !this.ancestry ? clumpQuery : ancestryClumpQuery;

            let clumpData = this.phenotypesLoaded[query];
            if (clumpData) {
                console.log(`${query} has already been loaded.`);
            } else {
                let prefix = `${BIO_INDEX_HOST}/api/bio/query`;
                let endpoint = !this.ancestry
                    ? "clumped-variants"
                    : "ancestry-clumped-variants";
                let cvURL = `${prefix}/${endpoint}?q=${query}`;
                let cvJSON = await fetch(cvURL).then((response) =>
                    response.json()
                );
                let cvData = cvJSON.data;
                cvData.sort((a, b) => {
                    a.pValue - b.pValue;
                });
                clumpData = cvData.slice(0, 25);
                this.phenotypesLoaded[query] = clumpData;
            }
            this.fillTopClumpedVariants(index, phenotype, clumpData);
            this.showTop25(index);
        },
    },
});
</script>

<style>
@import url("/css/effectorGenes.css");
.btn-primary a {
    color: white !important;
}

.btn-primary {
    margin-top: 15px;
    margin-bottom: 25px;
}
</style>
