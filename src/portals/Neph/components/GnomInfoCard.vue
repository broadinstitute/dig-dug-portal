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
                    :tbody-tr-class="rowPickClass"
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

export default Vue.component("gnominfo-card", {
    props: ["variantId"],
    data() {
        return {
            
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
            gnomAd_info: [],
            
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
                console.log("here:"+this.gnomAD_info);
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
            //console.log("variant id:" + this.variantId);
            let varinfo = this.variantId.split(":");
            let searchquery = varinfo[0]+":"+varinfo[1];
            this.variant = await query("variant-phenotype",searchquery,{},true);
            let gnomdisplay = [];
            let j = 0;

            for (k in gnomAD_info) {
                gnomdisplay[j]={};
                gnomdisplay[j].name = k;
                gnomdisplay[j].value = gnomAD_info[k];
                j++
            }
            
            this.gnomAD_info = gnomdisplay;

            //console.log("results:"+JSON.stringify(this.variant[0].hprecords));
        },
    },
})

</script>