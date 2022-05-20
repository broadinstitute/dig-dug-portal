<template>
    <div>
        <div v-if="rows > 0">
            <b-row>
                <b-col class="text-right mb-2">
                    <csv-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="gnomAD-info"
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
                    :per-page="perPage"
                    :current-page="currentPage"
                    id="gnomad"
                >
                
                </b-table>
                <!--<b-pagination
                    class="pagination-sm justify-content-center"
                    v-model="currentPage"
                    :total-rows="rows"
                    :per-page="perPage"
                    aria-controls="gnomad"
                ></b-pagination> -->
            </div>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No gnomAD
                information found.</b-alert
            >
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import { match, query } from "@/utils/bioIndexUtils";

export default Vue.component("gnominfo-card", {
    props: ["variantId"],
    data() {
        return {
            /*InfoFields: {
				"gnomAD_exomes_AC": "Total Allele Count",
				"gnomAD_exomes_AF": "Total Allele Frequency",
                "gnomAD_exomes_AN": "Total Allele Number",
				"gnomAD_exomes_AFR_AC": "African Allele Count",
                "gnomAD_exomes_AFR_AF": "African Allele Frequency",
                "gnomAD_exomes_AFR_AN": "African Allele Number",
                "gnomAD_exomes_AMR_AC": "Amerindian Allele Count",
                "gnomAD_exomes_AMR_AF": "Amerindian Allele Frequency",
                "gnomAD_exomes_AMR_AN": "Amerindian Allele Number",
                "gnomAD_exomes_ASJ_AC": "Ashkenazi Jewish Allele Count",
                "gnomAD_exomes_ASJ_AF": "Ashkenazi Jewish Allele Frequency",
                "gnomAD_exomes_ASJ_AN": "Ashkenazi Jewish Allele Number",
                "gnomAD_exomes_EAS_AC": "East Asian Allele Count",
                "gnomAD_exomes_EAS_AF": "East Asian Allele Frequency",
                "gnomAD_exomes_EAS_AN": "East Asian Allele Number",
                "gnomAD_exomes_FIN_AC": "Finnish Allele Count",
                "gnomAD_exomes_FIN_AF": "Finnish Allele Frequency",
                "gnomAD_exomes_FIN_AN": "Finnish Allele Number",
                "gnomAD_exomes_NFE_AC": "Non-Finnish European Allele Count",
                "gnomAD_exomes_NFE_AF": "Non-Finnish European Allele Frequency",
                "gnomAD_exomes_NFE_AN": "Non-Finnish European Allele Number",
                "gnomAD_exomes_SAS_AC": "South Asian Allele Count",
                "gnomAD_exomes_SAS_AF": "South Asian Allele Frequency",
                "gnomAD_exomes_SAS_AN": "South Asian Allele Number",
                "gnomAD_exomes_OTH_AC": "Other Allele Count",
                "gnomAD_exomes_OTH_AF": "Other Allele Frequency",
                "gnomAD_exomes_OTH_AN": "Other Allele Number",
			},*/
            InfoFields: {
				"AFR": "African",
                "AMR": "Amerindian",
                "ASJ": "Ashkenazi Jewish",
                "EAS": "East Asian",
                "FIN": "Finnish",
                "NFE": "Non-Finnish European",
                "SAS": "South Asian",
                "OTH": "Other",
            },
            fields: [
                {
                    key: "name",
                    label: "Cohort",
                },
                {
                    key: "AC",
                    label: "Allele Count",
                },
                {
                    key: "AN",
                    label: "Allele Number",
                },
                {
                    key: "AF",
                    label: "Allele Frequency",
                },
                
            ],
            gnomAD_info: [],
            //perPage: 10,
            //currentPage: 1,
        };
    },
    created() {
        if (this.variantId) {
            //alert(this.variantId);
            this.searchVariants();
        }
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            if (this.gnomAD_info && this.gnomAD_info.length) {
                return this.gnomAD_info;
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
        async searchVariants() {
            //alert("variant id:" + this.variantId);
            //console.log("variant id:" + this.variantId);
            let varinfo = this.variantId.split(":");
            let searchquery = varinfo[0] + ":" + varinfo[1];
            this.variant = await query("variant-phenotype", searchquery, {}, true);
            let gnomdisplay = [];
            //alert("gnomAD_info:"+this.variant.length);
            //for (var k in this.variant[0].gnomAD_info) {
            gnomdisplay[0] = {};
            gnomdisplay[0].name = "Total";
            gnomdisplay[0].AC = this.variant[0].gnomAD_info["gnomAD_exomes_AC"];
            gnomdisplay[0].AF = this.variant[0].gnomAD_info["gnomAD_exomes_AF"].toExponential(2);
            gnomdisplay[0].AN = this.variant[0].gnomAD_info["gnomAD_exomes_AN"];
            let j = 1;
            
            for (var k in this.InfoFields) {
                //console.log(k);
                if (this.InfoFields[k] != undefined) {
                    gnomdisplay[j] = {};
                    gnomdisplay[j].name = this.InfoFields[k];
                    gnomdisplay[j].AC = this.variant[0].gnomAD_info["gnomAD_exomes_"+k+"_AC"];
                    gnomdisplay[j].AF = this.variant[0].gnomAD_info["gnomAD_exomes_"+k+"_AF"].toExponential(2);
                    gnomdisplay[j].AN = this.variant[0].gnomAD_info["gnomAD_exomes_"+k+"_AN"];
                    j++;
                }
            }

            this.gnomAD_info = gnomdisplay;

            //console.log("results:"+JSON.stringify(this.variant[0].hprecords));
        },
        formatAlleleFrequency(count, number) {
			if (count === 0 || number === 0) return 0;
			else return Number.parseFloat(count / number).toExponential(2);
		},
		
    },
});
</script>
