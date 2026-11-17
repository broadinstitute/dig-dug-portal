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
        },
    },
    methods: {
        async searchVariants() {
            let varinfo = this.variantId.split(":");
            let searchquery = varinfo[0] + ":" + varinfo[1];
            this.variant = await query("variant-phenotype", searchquery, {}, true);

            if (this.variant){
                let gnomdisplay = [];
                let flag = 0;
                for (var k in this.variant[0].gnomAD_info) {
                    if (k.includes('gnomADg') && this.variant[0].gnomAD_info[k] != "-" && this.variant[0].gnomAD_info[k] != "NA"){
                        flag = 1;
                    }
                }
                if (flag){
                    gnomdisplay[0] = {};
                    gnomdisplay[0].name = "Total";
                    gnomdisplay[0].AC = this.variant[0].gnomAD_info["gnomADg_AC"];
                    gnomdisplay[0].AF = parseFloat(this.variant[0].gnomAD_info["gnomADg_AF"]).toExponential(2);
                    gnomdisplay[0].AN = this.variant[0].gnomAD_info["gnomADg_AN"];
                    let j = 1;
                    
                    for (var k in this.InfoFields) {
                        console.log(k);
                        if (this.InfoFields[k] != undefined) {
                            gnomdisplay[j] = {};
                            gnomdisplay[j].name = this.InfoFields[k];
                            gnomdisplay[j].AC = this.variant[0].gnomAD_info["gnomADg_AC_"+k];
                            gnomdisplay[j].AF = parseFloat(this.variant[0].gnomAD_info["gnomADg_AF_"+k]).toExponential(2);
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
            
            

        },
        formatAlleleFrequency(count, number) {
			if (count === 0 || number === 0) return 0;
			else return Number.parseFloat(count / number).toExponential(2);
		},
		
    },
});
</script>
