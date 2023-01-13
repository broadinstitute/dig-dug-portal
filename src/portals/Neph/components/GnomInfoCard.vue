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
				"gnomADg_AC": "Total Allele Count",
				"gnomADg_AF": "Total Allele Frequency",
                "gnomADg_AN": "Total Allele Number",
				"gnomADg_AFR_AC": "African Allele Count",
                "gnomADg_AFR_AF": "African Allele Frequency",
                "gnomADg_AFR_AN": "African Allele Number",
                "gnomADg_AMR_AC": "Amerindian Allele Count",
                "gnomADg_AMR_AF": "Amerindian Allele Frequency",
                "gnomADg_AMR_AN": "Amerindian Allele Number",
                "gnomADg_ASJ_AC": "Ashkenazi Jewish Allele Count",
                "gnomADg_ASJ_AF": "Ashkenazi Jewish Allele Frequency",
                "gnomADg_ASJ_AN": "Ashkenazi Jewish Allele Number",
                "gnomADg_EAS_AC": "East Asian Allele Count",
                "gnomADg_EAS_AF": "East Asian Allele Frequency",
                "gnomADg_EAS_AN": "East Asian Allele Number",
                "gnomADg_FIN_AC": "Finnish Allele Count",
                "gnomADg_FIN_AF": "Finnish Allele Frequency",
                "gnomADg_FIN_AN": "Finnish Allele Number",
                "gnomADg_NFE_AC": "Non-Finnish European Allele Count",
                "gnomADg_NFE_AF": "Non-Finnish European Allele Frequency",
                "gnomADg_NFE_AN": "Non-Finnish European Allele Number",
                "gnomADg_SAS_AC": "South Asian Allele Count",
                "gnomADg_SAS_AF": "South Asian Allele Frequency",
                "gnomADg_SAS_AN": "South Asian Allele Number",
                "gnomADg_OTH_AC": "Other Allele Count",
                "gnomADg_OTH_AF": "Other Allele Frequency",
                "gnomADg_OTH_AN": "Other Allele Number",
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
                    thClass: 'text-right',
    				tdClass: 'text-right',
                },
                {
                    key: "AN",
                    label: "Allele Number",
                    thClass: 'text-right',
    				tdClass: 'text-right',
                },
                {
                    key: "AF",
                    label: "Allele Frequency",
                    thClass: 'text-right',
    				tdClass: 'text-right',
                },
                
            ],
            gnomAD_info: [],
            perPage: 10,
            currentPage: 1,
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
            //alert(this.gnomAD_info.length);
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

            if (this.variant){
                let gnomdisplay = [];
                //alert("gnomAD_info:"+this.variant.length);
                //for (var k in this.variant[0].gnomAD_info) {
                let flag = 0;
                for (var k in this.variant[0].gnomAD_info) {
                    if (k.includes('gnomADg') && this.variant[0].gnomAD_info[k] != "-" && this.variant[0].gnomAD_info[k] != "NA"){
                        flag = 1;
                    }
                }
                //alert(flag);
                if (flag){
                    gnomdisplay[0] = {};
                    gnomdisplay[0].name = "Total";
                    gnomdisplay[0].AC = this.variant[0].gnomAD_info["gnomADg_AC"];
                    gnomdisplay[0].AF = parseFloat(this.variant[0].gnomAD_info["gnomADg_AF"]).toExponential(2);
                    //gnomdisplay[0].AF = this.variant[0].gnomAD_info["gnomADg_AF"]
                    gnomdisplay[0].AN = this.variant[0].gnomAD_info["gnomADg_AN"];
                    let j = 1;
                    
                    for (var k in this.InfoFields) {
                        console.log(k);
                        if (this.InfoFields[k] != undefined) {
                            gnomdisplay[j] = {};
                            gnomdisplay[j].name = this.InfoFields[k];
                            gnomdisplay[j].AC = this.variant[0].gnomAD_info["gnomADg_AC_"+k];
                            gnomdisplay[j].AF = parseFloat(this.variant[0].gnomAD_info["gnomADg_AF_"+k]).toExponential(2);
                            //gnomdisplay[j].AF = this.variant[0].gnomAD_info["gnomADg_"+k+"_AF"]
                            gnomdisplay[j].AN = this.variant[0].gnomAD_info["gnomADg_AN_"+k];
                            j++;
                        }
                    }

                    this.gnomAD_info = gnomdisplay;
                } else {
                    this.gnomAD_info = [];
                }
            } else {
                this.gnomAD_info = [];
            }
            
            

            //console.log("results:"+JSON.stringify(this.variant[0].hprecords));
        },
        formatAlleleFrequency(count, number) {
			if (count === 0 || number === 0) return 0;
			else return Number.parseFloat(count / number).toExponential(2);
		},
		
    },
});
</script>
