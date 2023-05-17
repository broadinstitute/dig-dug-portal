<template>
    <div id="variant-search">
        <b-row>
            <b-col cols="9">
                <div v-show="tableData.length" class="legends">
                    <strong class="mr-2">Impact:</strong>
                    <b-btn
                        disabled
                        variant="outline-danger"
                        size="sm"
                        class="mr-1 btn-mini"
                        >HIGH</b-btn
                    >
                    <b-btn
                        disabled
                        variant="outline-warning"
                        size="sm"
                        class="mr-1 btn-mini"
                        >MODERATE</b-btn
                    >
                    <b-btn
                        disabled
                        variant="outline-success"
                        size="sm"
                        class="mr-1 btn-mini"
                        >LOW</b-btn
                    >
                    <b-btn
                        disabled
                        variant="outline-secondary"
                        size="sm"
                        class="btn-mini"
                        >MODIFIER</b-btn
                    >
                </div>
            </b-col>
            <b-col class="text-right mb-2">
                <data-download
                    v-if="tableData.length"
                    :data="tableData"
                    filename="variants"
                ></data-download
            ></b-col>
        </b-row>
        <div v-show="tableData.length">
            <b-table
                hover
                small
                sort-icon-left
                responsive="sm"
                :fields="fields"
                :items="tableData"
                :per-page="perPage"
                :current-page="currentPage"
                ><template #thead-top="data">
                    <b-tr>
                        <b-th colspan="3"
                            ><span class="sr-only"
                                >Variant, dbSNP, Consequence</span
                            ></b-th
                        >
                        <b-th
                            colspan="3"
                            class="text-center"
                            variant="secondary"
                            >Allele</b-th
                        >
                        <b-th><span class="sr-only">Max AF</span></b-th>
                        <b-th
                            colspan="2"
                            class="text-center"
                            variant="secondary"
                            >Heterozygous</b-th
                        >
                        <b-th
                            colspan="2"
                            class="text-center"
                            variant="secondary"
                            style="border-left: 1px solid #dee2e6"
                            >Homozygous</b-th
                        >
                        <b-th><span class="sr-only">View VEP Data</span></b-th>
                    </b-tr>
                </template>
                <template #cell(varId)="data">
                    <a :href="`/variant.html?variant=${data.item.varId}`">{{
                        data.item.varId
                    }}</a> </template
                ><template #cell(dbSNP)="data">
                    <a :href="`/variant.html?variant=${data.item.dbSNP}`">{{
                        data.item.dbSNP
                    }}</a>
                </template>
                <template #cell(consequence)="data">
                    <div class="border-color" :class="data.item.impact">
                        {{ consequenceFormatter(data.item.consequence) }}
                    </div></template
                >
                <template #cell(view)="data">
                    <b-btn
                        v-if="!data.item.consequence"
                        disabled
                        size="sm"
                        class="btn-mini"
                        variant="outline-secondary"
                        >No Annotation</b-btn
                    >
                    <b-button
                        v-else
                        size="sm"
                        variant="outline-primary"
                        class="btn-mini showData"
                        @click="
                            showVariantData(data.item.varId);
                            data.toggleDetails();
                        "
                        ><span v-if="!!loadingData[data.item.varId]"
                            ><b-spinner small></b-spinner>
                            <span class="sr-only">Loading...</span></span
                        ><span v-else>
                            {{ data.detailsShowing ? "Hide" : "Show" }}
                            Annotations</span
                        >
                    </b-button>
                </template>

                <template #row-details="row">
                    <div class="details">
                        <div
                            v-if="
                                variantData[escapedVarID(row.item.varId)] &&
                                variantData[escapedVarID(row.item.varId)].length
                            "
                        >
                            <b-table
                                :items="
                                    variantData[escapedVarID(row.item.varId)]
                                "
                                :fields="subFields"
                                :per-page="perPage"
                                :tbody-tr-class="rowPickClass"
                                ><template #cell(varId)="data">
                                    <a
                                        :href="`/variant.html?variant=${data.item.varId}`"
                                        >{{ data.item.varId }}</a
                                    >
                                </template>
                                <template #head(transcriptId)="data">
                                    <span class="external_source"
                                        >Feature
                                        <b-badge
                                            pill
                                            disabled
                                            class="ml-1"
                                            variant="secondary"
                                            title="Link to external source."
                                            >E</b-badge
                                        ></span
                                    >
                                </template>
                                <template #cell(transcriptId)="data">
                                    <a
                                        v-if="data.item.transcriptId"
                                        :href="`https://grch37.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=${data.item.transcriptId}`"
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        >{{ data.item.transcriptId }}</a
                                    >
                                </template>
                                <!-- <template #cell(gene_symbol)="data">
                                    <a
                                        v-if="
                                            data.item.gene_symbol_source ===
                                            'HGNC'
                                        "
                                        :href="`/gene.html?gene=${data.item.gene_symbol}`"
                                        >{{ data.item.gene_symbol }}</a
                                    ><span
                                        v-else-if="
                                            data.item.gene_id &&
                                            data.item.gene_id.indexOf(
                                                'ENSG'
                                            ) !== -1
                                        "
                                        class="external_source"
                                    >
                                        <a
                                            :href="`https://grch37.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=${data.item.gene_id}`"
                                            target="_blank"
                                            >{{ data.item.gene_symbol }}</a
                                        ><b-badge
                                            pill
                                            disabled
                                            class="ml-1"
                                            variant="secondary"
                                            title="Link to external source."
                                            >E</b-badge
                                        ></span
                                    >

                                    <span
                                        v-else
                                        title="There's no data available for this gene."
                                        >{{ data.item.gene_symbol }}</span
                                    >
                                </template> -->
                                <template #cell(position)="data">
                                    {{
                                        data.item.proteinStart !==
                                        data.item.proteinEnd
                                            ? `${data.item.proteinStart}-${data.item.proteinEnd}`
                                            : data.item.proteinStart
                                    }}
                                </template>
                                <template #cell(consequenceTerms)="data">
                                    <div
                                        class="border-color"
                                        :class="data.item.impact"
                                    >
                                        <span
                                            v-for="(c, i) in data.item
                                                .consequenceTerms"
                                            :key="c"
                                            >{{ consequenceFormatter(c)
                                            }}{{
                                                i <
                                                data.item.consequenceTerms
                                                    .length -
                                                    1
                                                    ? ", "
                                                    : ""
                                            }}</span
                                        >
                                    </div></template
                                >
                                <template #cell(siftPrediction)="data">
                                    {{
                                        siftFormatter(data.item.siftPrediction)
                                    }}
                                </template>
                            </b-table>
                        </div>
                        <div
                            v-else-if="
                                variantData[escapedVarID(row.item.varId)] &&
                                variantData[escapedVarID(row.item.varId)]
                                    .length === 0
                            "
                        >
                            <b-alert show variant="warning">
                                No predicted transcript consequences found for
                                this variant.</b-alert
                            >
                        </div>
                    </div>
                </template>
            </b-table>
            <b-pagination
                v-model="currentPage"
                size="sm"
                :total-rows="rows"
                :per-page="perPage"
                aria-controls="my-table"
            ></b-pagination>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload";

export default Vue.component("VariantSearch", {
    components: {
        DataDownload,
    },
    props: {
        gene: [String, Array],
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,

            variants: [],
            consequences: {},
            fields: [
                {
                    key: "varId",
                    label: "Variant",
                },
                {
                    key: "dbSNP",
                    label: "dbSNP",
                },
                {
                    key: "consequence",
                    label: "Consequence",
                },

                {
                    key: "alleleCountCases",
                    label: "Cases",
                    sortable: true,
                },
                {
                    key: "alleleCountControls",
                    label: "Controls",
                    sortable: true,
                },
                {
                    key: "alleleCount",
                    label: "Count",
                    sortable: true,
                },
                {
                    key: "maf",
                    label: "Max AF",
                    sortable: true,
                    thStyle: "min-width: 120px;",
                },
                {
                    key: "heterozygousCases",
                    label: "Cases",
                    sortable: true,
                },
                {
                    key: "heterozygousControls",
                    label: "Controls",
                    sortable: true,
                },
                {
                    key: "homozygousCases",
                    label: "Cases",
                    sortable: true,
                },
                {
                    key: "homozygousControls",
                    label: "Controls",
                    sortable: true,
                },

                {
                    key: "view",
                    label: "View VEP Data",
                    class: "nowrap",
                },
            ],
            subFields: [
                {
                    key: "transcriptId",
                    label: "Feature",
                },
                {
                    key: "position",
                    label: "Position",
                },
                {
                    key: "aminoAcids",
                    label: "Amino Acids",
                },
                {
                    key: "consequenceTerms",
                    label: "Consequence",
                    tdClass: "border-color",
                },
                {
                    key: "hgncId",
                    label: "HGNC",
                },
                {
                    key: "hgvsc",
                    label: "HGVSc",
                },
                {
                    key: "hgvsp",
                    label: "HGVSp",
                },
                {
                    key: "polyphen2HdivPred",
                    label: "PolyPhen (HDIV)",
                },
                {
                    key: "polyphen2HvarPred",
                    label: "PolyPhen (HVAR)",
                },
                {
                    key: "siftPrediction",
                    label: "SIFT Prediction",
                },
                {
                    key: "lrtPred",
                    label: "LRT",
                },
                {
                    key: "mutationTaster",
                    label: "Mutation Taster",
                },
                {
                    key: "caddRawRankscore",
                    label: "CADD-Phred Score",
                },
                {
                    key: "gnomadGenomesPopmaxAf",
                    label: "gnomAD AF",
                },
            ],
            variantData: {},
            loadingData: {},
        };
    },
    // created() {
    //     if (this.gene) {
    //         this.searchVariants();
    //     }
    // },
    computed: {
        //This works to display all data fro BI
        tableData() {
            if (this.variants && this.variants.length) {
                return this.variants;
            } else {
                return [];
            }
        },
        rows() {
            if (this.tableData) return this.tableData.length;
        },
    },
    watch: {
        gene: {
            handler(val) {
                if (val) this.searchVariants();
            },
            immediate: true,
        },
    },
    methods: {
        async searchVariants() {
            this.currentPage = 1; //reset on new search
            this.variants = await query("gene-variants", this.gene);
        },
        async getTranscriptConsequences(varID) {
            if (varID) {
                let data = await query("transcript-consequences", varID);
                return data;
            }
        },
        consequenceFormatter(consequence) {
            if (consequence) {
                let trim = consequence
                    .replace("_prime_", "' ")
                    .replace("_variant", "");
                return Formatters.snakeFormatter(trim);
            }
            return;
        },
        siftFormatter(name) {
            return Formatters.snakeFormatter(name);
        },
        async showVariantData(varID) {
            let escapedVarID = this.escapedVarID(varID);

            if (this.variantData[escapedVarID] === undefined) {
                this.loadingData[escapedVarID] = true;
                let tcQuery = await this.getTranscriptConsequences(varID);
                Vue.set(this.variantData, escapedVarID, tcQuery);
                this.loadingData[escapedVarID] = false;
            }
        },
        escapedVarID(varID) {
            if (varID) return varID.replace(/:\s*/g, "_");
            else {
                return "";
            }
        },
        rowPickClass(item, type) {
            if (!item || type !== "row") return;
            if (item.pick === 1) return "row-pick";
        },
    },
});
</script>
<style>
@import url("/css/table.css");
</style>
