<template>
    <div>
        <div v-if="rows > 0">
            <b-row>
                <b-col class="text-right mb-2">
                    <csv-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="phenotypes-table"
                    ></csv-download
                ></b-col>
            </b-row>
            <div v-show="tableData.length">
                <b-table
                    hover
                    small
                    sort-icon-left
                    responsive="sm"
                    :items="tableData"
                    :fields="fields"
                    :current-page="currentPage"
				    :per-page="perPage"
                    >
                    <template #cell(varId)="data">
                        <a :href="`/variant.html?variant=${data.item.varId}`">{{
                            data.item.varId
                        }}</a>
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
import { match, query } from "@/utils/bioIndexUtils";

export default Vue.component("variant-phenotype-table", {
    props: ["variantId", "filter"],
    data() {
        return {
            HPOTerms: {
				"HP-0000119": "Abnormality of the genitourinary system",
				"HP-0000152": "Abnormality of head or neck",
				"HP-0000478": "Abnormality of the eye",
				"HP-0000598": "Abnormality of the ear",
				"HP-0000707": "Abnormality of the nervous system",
				"HP-0000769": "Abnormality of the breast",
				"HP-0000818": "Abnormality of the endocrine system",
				"HP-0001197": "Abnormality of prenatal development or birth",
				"HP-0001507": "Growth abnormality",
				"HP-0001574": "Abnormality of the integument",
				"HP-0001608": "Abnormality of the voice",
				"HP-0001626": "Abnormality of the cardiovascular system",
				"HP-0001871": "Abnormality of blood and blood-forming tissues",
				"HP-0001939": "Abnormality of metabolism/homeostasis",
				"HP-0002086": "Abnormality of the respiratory system",
				"HP-0002664": "Neoplasm",
				"HP-0002715": "Abnormality of the immune system",
				"HP-0025031": "Abnormality of the digestive system",
				"HP-0025142": "Constitutional symptom",
				"HP-0025354": "Abnormal cellular phenotype",
				"HP-0033127": "Abnormality of the musculoskeletal system",
				"HP-0040064": "Abnormality of limbs",
				"HP-0045027": "Abnormality of the thoracic cavity",
				"AllControl": "Controls",
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
				},
				{
					key: "allelnumber",
					label: "Allele Number",
					sortable: true,
				},

				{
					key: "allelefrequency",
					label: "Allele Frequency",
					sortable: true,
				},
				{
					key: "TWO_ALT_GENO_CTS",
					label: "Homozygotes",
					sortable: true,
				},
            ],
            hprecords: [],
            perPage: 10,
            currentPage: 1,
        };
    },
    created() {
		if (this.variantId) {
			this.searchVariants();
		}
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
    methods: {
        consequenceFormatter: Formatters.consequenceFormatter,
        siftFormatter(name) {
            return Formatters.snakeFormatter(name);
        },
        async searchVariants() {
            //console.log("variant id:" + this.variantId);
            let varinfo = this.variantId.split(":");
            let searchquery = varinfo[0]+":"+varinfo[1];
            this.variant = await query("variant-phenotype",searchquery,{},true);
            console.log(JSON.stringify(this.variant))
            let hpdisplay = [];
            let j = 0;

            for (
                let k = 0;
                k < this.variant[0].hprecords.length;
                k++
            ) {
                let hp = this.variant[0].hprecords[k];
                //if (hp.HP != "AllControl") {
                    hpdisplay[j] = {};
                    //hpdisplay[j].hpoterms = this.HPOTerms[hp.HP];
                    hpdisplay[j].hp = hp.HP;
                    hpdisplay[j].hpoterms =
                        Formatters.snakeFormatter(
                            this.HPOTerms[hp.HP]
                        );
                    hpdisplay[j].allelecount =2 * hp.TWO_ALT_GENO_CTS +hp.HET_REF_ALT_CTS;
                    hpdisplay[j].allelnumber =2 *(hp.HOM_REF_CT +hp.HET_REF_ALT_CTS +hp.TWO_ALT_GENO_CTS);
                    hpdisplay[j].allelefrequency =
                        this.formatAlleleFrequency(
                            hpdisplay[j].allelecount,
                            hpdisplay[j].allelnumber
                        );

                    hpdisplay[j].TWO_ALT_GENO_CTS =
                        hp.TWO_ALT_GENO_CTS;
                    j++;
                //}
            }
            hpdisplay = hpdisplay.sort(function (a, b) {
                //console.log(a.allelecount+"|"+b.allelecount+"|"+(a.allelecount>b.allelecount));
                if (a.allelecount > b.allelecount) {
                    return -1;
                } else if (a.allelecount < b.allelecount) {
                    return 1;
                }
                return 0;
            });
            this.hprecords = hpdisplay;

            //console.log("results:"+JSON.stringify(this.variant[0].hprecords));
        },
        formatAlleleFrequency(count, number) {
			if (count === 0 || number === 0) return 0;
			else return Number.parseFloat(count / number).toExponential(2);
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
