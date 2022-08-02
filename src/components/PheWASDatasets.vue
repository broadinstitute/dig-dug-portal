<template>
    <div
        id="phewas-datasets"
        class="EGLT-table variant-datasets"
        v-if="rows > 0"
    >
        <div class="text-right mt-2">
            <csv-download
                :data="tableData"
                filename="PheWAS_associations"
            ></csv-download>
        </div>
        <b-container fluid v-if="!!phenotypeMap && !!datasetMap" class="list">
            <b-row class="top-level-header">
                <b-col cols="4" class="top-level-header-item">Phenotype</b-col>
                <b-col class="top-level-header-item">P-Value</b-col>
                <b-col class="top-level-header-item">Beta</b-col>
                <b-col class="top-level-header-item">Odds Ratio</b-col>
                <b-col cols="2" class="top-level-header-item"
                    >Effective Sample Size</b-col
                >
                <b-col class="top-level-header-item">View</b-col>
            </b-row>
            <template v-for="(item, index) in tableData">
                <b-row
                    class="top-level-value"
                    :key="index"
                    :class="
                        index < (currentPage - 1) * perPage ||
                        index >= currentPage * perPage
                            ? 'hidden'
                            : ''
                    "
                >
                    <b-col cols="4" class="top-level-value-item"
                        ><a
                            :href="`/phenotype.html?phenotype=${item.phenotype.name}`"
                            >{{ item.phenotype.description }}</a
                        ></b-col
                    >
                    <b-col
                        class="top-level-value-item pValue"
                        :class="
                            item.pValue < 1e-5 ? 'variant-table-cell high' : ''
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
                            @click="showDatasets(index)"
                            class="view-features-btn">Datasets</b-button>
                        <b-button @click="getClumpedVariants(index, item.phenotype.name, item.clump)"
                        class="view-features-btn">Top 25 variants</b-button>
                    </b-col>
                </b-row>

                <div
                    :class="`features_${index}`"
                    class="feature-content-wrapper hidden"
                    :key="`features_${index}`"
                >
                    <b-row class="feature-header">
                        <b-col cols="5" class="feature-header-item"
                            >Dataset</b-col
                        ><b-col class="feature-header-item">P-Value</b-col>
                        <b-col
                            class="feature-header-item"
                            v-if="!item.phenotype.dichotomous"
                            >Beta</b-col
                        >
                        <b-col
                            class="feature-header-item"
                            v-if="!!item.phenotype.dichotomous"
                            >Odds Ratio</b-col
                        >
                        <b-col class="feature-header-item"
                            >Effective Sample Size</b-col
                        >
                    </b-row>
                    <template v-for="(dataset, j) in item.datasets">
                        <b-row
                            v-if="!!datasetMap[dataset.dataset]"
                            :class="`features_${index}_${j}`"
                            class="feature-row"
                            :key="`features_${index}_${j}`"
                        >
                            <b-col cols="5" class="feature-content-item">
                                <a
                                    :href="`/dinspector.html?dataset=${dataset.dataset}&phenotype=${item.phenotype.name}`"
                                    >{{
                                        datasetMap[dataset.dataset].description
                                    }}</a
                                >
                            </b-col>
                            <b-col class="feature-content-item">{{
                                pValueFormatter(dataset.pValue)
                            }}</b-col>
                            <b-col
                                class="feature-content-item"
                                v-if="!item.phenotype.dichotomous"
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
                                v-if="!!item.phenotype.dichotomous"
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
                <div :class="`features_top25_${index}`" class="feature-content-wrapper hidden"
                    :key="`features_top25_${index}`">
                    <b-row class="feature-header">
                        <b-col class="feature-header-item">Variant ID</b-col>
                        <b-col class="feature-header-item">rsID</b-col>
                        <b-col class="feature-header-item">Ref/Alt</b-col>
                        <b-col class="feature-header-item">P-Value</b-col>
                        <b-col class="feature-header-item">Beta</b-col>
                        <b-col class="feature-header-item">MAF</b-col>
                        <b-col class="feature-header-item">Standard Error</b-col>
                        <b-col class="feature-header-item">Z Score</b-col>
                        <b-col cols="2" class="feature-header-item">Consequence</b-col>
                        <b-col class="feature-header-item">Nearest Genes</b-col>
                    </b-row>
                    <template v-for="i in 25">
                        <b-row :id="`top25_${index}_variant_${i - 1}`" class="feature-content">
                            <b-col class="feature-content-item" :id="`pheno${index}_var${i - 1}_varId`"></b-col>
                            <b-col class="feature-content-item" :id="`pheno${index}_var${i - 1}_dbSNP`"></b-col>
                            <b-col class="feature-content-item" :id="`pheno${index}_var${i - 1}_reference`"></b-col>
                            <b-col class="feature-content-item" :id="`pheno${index}_var${i - 1}_pValue`"></b-col>
                            <b-col class="feature-content-item" :id="`pheno${index}_var${i - 1}_beta`"></b-col>
                            <b-col class="feature-content-item" :id="`pheno${index}_var${i - 1}_maf`"></b-col>
                            <b-col class="feature-content-item" :id="`pheno${index}_var${i - 1}_stdErr`"></b-col>
                            <b-col class="feature-content-item" :id="`pheno${index}_var${i - 1}_zScore`"></b-col>
                            <b-col cols="2" class="feature-content-item" :id="`pheno${index}_var${i - 1}_consequence`"></b-col>
                            <b-col class="feature-content-item" :id="`pheno${index}_var${i - 1}_nearest`"></b-col>
                        </b-row>
                    </template>
                    <b-button class="btn btn-primary"><a :href="
                        `/research.html?pageid=clumped_variants&phenotype=${item.phenotype.name}&clump=${item.clump}`">
                        View all variants in clump</a></b-button>
                </div>
            </template>
        </b-container>
        <b-pagination
            class="pagination-sm justify-content-center"
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
            @page-click="closeAllDatasets()"
        ></b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import { orderBy, groupBy, cloneDeep } from "lodash";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import CsvDownload from "@/components/CsvDownload";
export default Vue.component("phewas-datasets", {
    props: ["associations", "datasets", "phenotypeMap", "datasetMap", "filter"],
    components: { CsvDownload },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
        };
    },
    computed: {
        groupedDatasets() {
            let ordered = orderBy(this.datasets, ["pValue"], ["asc"]);
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
            return this.tableData.length;
        },
        tableData() {
            let dataRows = this.pheWASAssociations;

            if (!!this.filter) {
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
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        showDatasets(index) {
            uiUtils.hideElement(`features_top25_${index}`);
            uiUtils.showHideElement(`features_${index}`);
        },
        showTop25(index){
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
        fillTopClumpedVariants(index, top25){
            const dataFields = ["pValue", "maf", "stdErr", "zScore", "consequence"];
            for(let i = 0; i < 25; i++){
                let item = top25[i];
                let zScoreNumber = Number(item.zScore);
                item.zScore = zScoreNumber.toPrecision(5);
                dataFields.forEach(dataField => {
                    let tableCellId = `pheno${index}_var${i}_${dataField}`;
                    let tableCell = document.getElementById(tableCellId);
                    tableCell.innerText = item[dataField];
                });
                // Other fields: varId, dbSNP, nearest, beta
                let varIdCell = document.getElementById(`pheno${index}_var${i}_varId`);
                varIdCell.innerHTML = `<a href="/variant.html?variant=${item.varId}">${item.varId}</a>`;
                let dbSNPCell = document.getElementById(`pheno${index}_var${i}_dbSNP`);
                dbSNPCell.innerHTML = `<a href="/variant.html?variant=${item.dbSNP}">${item.dbSNP}</a>`;
                let nearestCell = document.getElementById(`pheno${index}_var${i}_nearest`);
                nearestCell.innerHTML = `<a href="/gene.html?gene=${item.nearest}">${item.nearest}</a>`;
                let betaCell = document.getElementById(`pheno${index}_var${i}_beta`);
                let betaClass = item.beta < 0 ? "effect negative" : "effect positive";
                let betaSymbol = item.beta < 0 ? "&#9660;" : "&#9650;";
                betaCell.innerHTML = `<span class="${betaClass}">${betaSymbol}</span>${item.beta}`;
                let refAltCell = document.getElementById(`pheno${index}_var${i}_reference`);
                refAltCell.innerText = `${item.reference}/${item.alt}`;
            }
        },
        async getClumpedVariants(index, phenotype, clump){
            // if already loaded, just toggle it open
            let testCell = document.getElementById(`pheno${index}_var0_varId`);
            if (testCell.innerText != ""){
                console.log(`Phenotype #${index} has already been loaded.`)
            } else {
                let cvURL = 
                    `https://bioindex.hugeamp.org/api/bio/query/clumped-variants?q=${phenotype},${clump}`;
                let cvJSON = await fetch(cvURL).then((response) => response.json());
                let cvData = cvJSON.data;
                cvData.sort((a, b) => {a.pValue - b.pValue});
                let top25 = cvData.slice(0,25);
                this.fillTopClumpedVariants(index, top25)
            }
            this.showTop25(index);
        },
    },
});
</script>

<style>
.btn-primary a {
    color: white !important;
}

.btn-primary {
    margin-top: 15px;
    margin-bottom: 25px;
}

</style>
