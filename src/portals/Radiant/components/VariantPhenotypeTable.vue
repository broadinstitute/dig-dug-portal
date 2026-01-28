<template>
    <div>
        <div v-if="rows > 0">
            <b-row>
                <b-col class="text-right mb-2">
                    <data-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="phenotypes-table"
                    ></data-download
                ></b-col>
            </b-row>
            <div v-show="tableData.length">
                <b-table
                    hover
                    small
                    responsive="sm"
                    :items="tableData"
                    :fields="fields"
                    :per-page="perPage"
                    :current-page="currentPage"
                    :tbody-tr-class="rowPickClass"
                >
                    <template #cell(varId)="data">
                        <a :href="`/variant.html?variant=${data.item.varId}`">{{
                            data.item.varId
                        }}</a>
                    </template>
                    <template #head(transcriptId)="data">
                        <span class="external_source">Feature</span>
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
                    <template #cell(position)="data">
                        {{
                            data.item.proteinStart !== data.item.proteinEnd
                                ? `${data.item.proteinStart}-${data.item.proteinEnd}`
                                : data.item.proteinStart
                        }}
                    </template>
                    <template #cell(consequenceTerms)="data">
                        <div class="border-color" :class="data.item.impact">
                            <span
                                v-for="(c, i) in data.item.consequenceTerms"
                                :key="c"
                                >{{ consequenceFormatter(c)
                                }}{{
                                    i < data.item.consequenceTerms.length - 1
                                        ? ", "
                                        : ""
                                }}</span
                            >
                        </div></template
                    >
                    <template #cell(siftPrediction)="data">
                        {{ siftFormatter(data.item.siftPrediction) }}
                    </template>
                </b-table>
                <b-pagination
                    v-if="rows > perPage"
                    class="pagination-sm justify-content-center"
                    v-model="currentPage"
                    :total-rows="rows"
                    :per-page="perPage"
                ></b-pagination>
            </div>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No predicted
                transcript consequences found.</b-alert
            >
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
import { query } from "@/utils/bioIndexUtils";

export default Vue.component("variant-phenotype-table", {
    components: {
        DataDownload,
    },
    props: ["variantId", "filter"],
    data() {
        return {
            HPOTerms: {
                "NonProgressive":"NonProgressive",
                "mTORpathway":"mTORpathway",
                "LeanPCOS":"LeanPCOS",
                "SMAD5":"SMAD5",
                "ANID":"ANID",
                "CongenetalPancreatic":"CongenetalPancreatic",
                "Fulminant":"Fulminant",
                "IRS2Haploinsuff":"IRS2Haploinsuff",
                "EIF2S1":"EIF2S1",
                "ADIPOQ":"ADIPOQ",
                "LMNTD2":"LMNTD2",
                "CERS2":"CERS2",
                "Syndromic":"Syndromic",
                "NFKB1":"NFKB1",
                "Mitochondrial":"Mitochondrial",
                "PTPMT1":"PTPMT1",
                "Insulindeficien_VLIR":"Insulindeficien_VLIR",
                "LeanGDM":"LeanGDM",
                "IGF1R":"IGF1R",
                "AnegBposKPDM":"AnegBposKPDM",
                "IDH2":"IDH2",
                "PAX6":"PAX6",
                "SevereINSResistance":"SevereINSResistance",
                "AnegBnegKPDM":"AnegBnegKPDM",
                "Lipodystrophy":"Lipodystrophy",
                "FFAR1":"FFAR1",
                "PrepubertalT2D":"PrepubertalT2D",
                "INSR":"INSR",
                "INS":"INS",
                "MODYLike":"MODYLike",
                "SLIT2ROBO1":"SLIT2ROBO1",
                "GLUT4pathway":"GLUT4pathway",
                "NOII":"NOII",
            },
            fields: [
                {
                    key: "hpoterms",
                    label: "Phenotype",
                },
                {
                    key: "alleleCountCases",
                    label: "Allele Count",
                    sortable: true,
                    tdClass: "text-left pr-3",
                    thClass: "text-left",
                },
                {
                    key: "alleleNumber",
                    label: "Allele Number",
                    sortable: true,
                    tdClass: "text-left pr-3",
                    thClass: "text-left",
                },
                /*{
                    key: "homozygousCount",
                    label: "Homozygotes",
                    sortable: true,
                    tdClass: "text-left pr-3",
                    thClass: "text-left",
                },*/
                {
                    key: "alleleFrequency",
                    label: "Allele Frequency",
                    sortable: true,
                    tdClass: "text-left pl-5",
                    thClass: "text-left pl-5",
                    formatter: "formatAlleleFrequency",
                },
            ],
            hprecords: [],
            perPage: 24,
            currentPage: 1,
            variant: [],
        };
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            if (this.hprecords && this.hprecords.length) {
                //console.log("here:"+this.hprecords);
                return this.hprecords;
            } else {
                return [];
            }
            /*let dataRows = this.variant.hprecords;
            if (!!this.filter) {
                dataRows = dataRows.filter((association) => {
                    return this.filter(association);
                });
            }
            return dataRows;*/
        },
    },
    created() {
        console.log("Variant Phenotype Table:"+ this.variantId);
        if (this.variantId) {
            this.searchVariants();
        }
    },
    methods: {
        consequenceFormatter: Formatters.consequenceFormatter,
        siftFormatter(name) {
            return Formatters.snakeFormatter(name);
        },
        async searchVariants() {
            console.log("variant id:" + this.variantId);
            let varinfo = this.variantId.split(":");
            let searchquery = varinfo[0] + ":" + varinfo[1];
            //this.variant = await query("variants", searchquery, {});
            console.log("variants page: Phenotype table ->"+searchquery);
            this.variant = await query("gene-locus", searchquery, {}, true);
            console.log(this.variant);
            let hpdisplay = [];
            let j = 0;

            for (let k = 0; k < this.variant[0].hprecords.length; k++) {
                let hp = this.variant[0].hprecords[k];
                //if (hp.HP != "AllControl") {
                hpdisplay[j] = {};
                //hpdisplay[j].hpoterms = this.HPOTerms[hp.HP];
                hpdisplay[j].hp = hp.phenotype;
                hpdisplay[j].hpoterms = Formatters.snakeFormatter(
                    this.HPOTerms[hp.phenotype]
                );
                hpdisplay[j].alleleCountCases = hp.alleleCountCases;
                hpdisplay[j].alleleNumber = hp.alleleNumber;
                hpdisplay[j].alleleFrequency = hp.alleleFrequency;

                hpdisplay[j].homozygousCount = hp.homozygousCount;
                j++;
                //}
            }
            //nolonger sort by allele count
            // hpdisplay = hpdisplay.sort(function (a, b) {
            //     //console.log(a.allelecount+"|"+b.allelecount+"|"+(a.allelecount>b.allelecount));
            //     if (a.allelecount > b.allelecount) {
            //         return -1;
            //     } else if (a.allelecount < b.allelecount) {
            //         return 1;
            //     }
            //     return 0;
            // });

            let sortOrder = [
                "Antibody Negative Insulin Deficient (abr. ANID)",
                "Lipodystrophic",
                "Non-Obese Inulin Insufficient (abr. NOII)",
                "Possible Monogenic or Oligogenic (abr. PMO)",
                "Non-Progressive",
                "Syndromic",
                "Very Low Insulin Requirements (abr. VLIR)",
                "Antibody Negative Beta Cell Negative Ketosis-Prone DM (abr. A (-) B (-) KPDM)",
                "Antibody Negative Beta Cell Positive Ketosis-Prone DM (abr. A (-) B (+) KPDM)",
                "Severe Insulin Resistance (SIR)",
                "Beta Cell Dysfunction",
                "IGF1R",
                "INS",
                "NFKB1",
                "PAX6",
                "PTPMT1",
                "SMAD5",
                "INSR",
                "LMNTD2",
                "SLIT2 or ROB1",
                "CERS2",
                "IDH2",
                "IRS2 Haploinsufficiency",
                "EIF2S1",
                "Mammalian Target of Rapamycin Pathway (abr. mTOR pathway)",
                "GLUT4",
            ];

            //remove Healthy and AllNephroticSyndCases
            hpdisplay = hpdisplay.filter(
                (hp) => hp.hp != "Healthy" && hp.hp != "AllNephroticSyndCases"
            );

            hpdisplay = hpdisplay.filter((item) =>
							item.alleleCountCases > 0
				);

            //sort hpdisplay by sortOrder
            hpdisplay.sort(function (a, b) {
                return sortOrder.indexOf(a.hp) - sortOrder.indexOf(b.hp);
            });

            this.hprecords = hpdisplay;

            //console.log("results:"+JSON.stringify(this.variant[0].hprecords));
        },
        calculateAlleleFrequency(count, number) {
            if (count === 0 || number === 0) return "";
            else return count / number;
        },
        formatAlleleFrequency(frequency) {
            if (!frequency) return "";
            if (frequency < 0.0001) {
                return parseFloat(frequency).toExponential(5);
            } else {
                return parseFloat(frequency).toFixed(5);
            }
        },
        rowPickClass(item, type) {
            if (!item || type !== "row") return;
            if (item.PICK === true) return "row-pick";
        },
    },
});
</script>
<style>
@import url("/css/table.css");
</style>
