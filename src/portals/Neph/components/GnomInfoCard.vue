<template>
    <div>
        <div v-if="rows > 0">
            <b-row>
                <b-col class="text-right mb-2">
                    <csv-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="variant-phenotypes"
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
                    >
                    
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
                <b-icon icon="exclamation-triangle"></b-icon> No gnomAD information found.</b-alert
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
				"gnomAD_exomes_AN": "Allele Number",
				"gnomAD_exomes_AC": "Allele Count",
				"gnomAD_exomes_AF": "Allele Frequency",
			},
            fields: [
                {
					key: "name",
					label: "Field Name",
				},
				{
					key: "value",
					label: "Value",
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
            let searchquery = varinfo[0]+":"+varinfo[1];
            this.variant = await query("variant-phenotype",searchquery,{},true);
            let gnomdisplay = [];
            let j = 0;
            //console.log("gnomAD_info:"+this.variant[0].gnomAD_info);
            for (var k in this.variant[0].gnomAD_info) {
                console.log(k);
                if (this.InfoFields[k] != undefined){
                    gnomdisplay[j]={};
                    gnomdisplay[j].name = this.InfoFields[k];
                    gnomdisplay[j].value = this.variant[0].gnomAD_info[k];
                    j++
                }
                
            }
            
            this.gnomAD_info = gnomdisplay;

            //console.log("results:"+JSON.stringify(this.variant[0].hprecords));
        },
        
    },
})

</script>