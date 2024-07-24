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
                Healthy: "Healthy",
                Sensitive: "Steroid Sensitive Nephrotic Syndrome",
                AdultSensitive: "Steroid Sensitive Nephrotic Syndrome (Adult)",
                PediatricSensitive:
                    "Steroid Sensitive Nephrotic Syndrome (Pediatric)",
                Uncategorized: "Uncategorized Nephrotic Syndrome",
                AdultUncategorized: "Uncategorized Nephrotic Syndrome (Adult)",
                PediatricUncategorized:
                    "Uncategorized Nephrotic Syndrome (Pediatric)",
                Resistant: "Steroid Resistant Nephrotic Syndrome",
                AdultResistant: "Steroid Resistant Nephrotic Syndrome (Adult)",
                PediatricResistant:
                    "Steroid Resistant Nephrotic Syndrome (Pediatric)",
                AllSamples: "All Samples",
            },
            fields: [
                {
                    key: "hpoterms",
                    label: "Phenotype",
                },
                {
                    key: "allelecount",
                    label: "Allele Count",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "allelnumber",
                    label: "Allele Number",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "n_hom_var_case",
                    label: "Homozygotes",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "allelefrequency",
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
            //console.log("variant id:" + this.variantId);
            let varinfo = this.variantId.split(":");
            let searchquery = varinfo[0] + ":" + varinfo[1];
            this.variant = await query("variants", searchquery, {}, true);
            let hpdisplay = [];
            let j = 0;

            for (let k = 0; k < this.variant[0].hprecords.length; k++) {
                let hp = this.variant[0].hprecords[k];
                //if (hp.HP != "AllControl") {
                hpdisplay[j] = {};
                //hpdisplay[j].hpoterms = this.HPOTerms[hp.HP];
                hpdisplay[j].hp = hp.HP;
                hpdisplay[j].hpoterms = Formatters.snakeFormatter(
                    this.HPOTerms[hp.HP]
                );
                hpdisplay[j].allelecount =
                    2 * hp.n_hom_var_case + hp.n_het_case;
                hpdisplay[j].allelnumber =
                    2 * (hp.n_hom_ref_case + hp.n_het_case + hp.n_hom_var_case);
                hpdisplay[j].allelefrequency = this.calculateAlleleFrequency(
                    hpdisplay[j].allelecount,
                    hpdisplay[j].allelnumber
                );

                hpdisplay[j].n_hom_var_case = hp.n_hom_var_case;
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
                "AllSamples",
                "Resistant",
                "PediatricResistant",
                "AdultResistant",
                "Sensitive",
                "PediatricSensitive",
                "AdultSensitive",
                "Uncategorized",
                "PediatricUncategorized",
                "AdultUncategorized",
                "Healthy",
                "AllNephroticSyndCases",
            ];

            //remove Healthy and AllNephroticSyndCases
            hpdisplay = hpdisplay.filter(
                (hp) => hp.hp != "Healthy" && hp.hp != "AllNephroticSyndCases"
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
