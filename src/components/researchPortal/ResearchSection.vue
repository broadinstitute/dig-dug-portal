<template>
	<div>
		{{ sectionConfig.header }}
		
		<research-data-table
			v-if="!!tableFormat"
			pageID="1"
			:dataset="pageData"
			:tableFormat="tableFormat"
			:initPerPageNumber="20"
			:tableLegend="''"
			:dataComparisonConfig="
				null
			"
			:searchParameters="
				null
			"
			:pkgData="null"
			:pkgDataSelected="null"
			:phenotypeMap="
				null
			"
			:multiSectionPage="true"
			@clicked-sort="updateData"
		>
		</research-data-table>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import bioIndex from "@/modules/bioIndex";
import dataConvert from "@/utils/dataConvert";

import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";

export default Vue.component("research-section", {
	props: ["sectionConfig"],
	components: {
        ResearchDataTable,
    },
	data() {
		return {
			pageData: null,
		};
	},
	modules: {
		bioIndex
	},
	mounted: function () {
		this.getData();
	},
	computed: {
		tableFormat() {
			if(!!this.pageData) {

				if(!!this.sectionConfig["table format"]) {

					return this.sectionConfig["table format"];

				} else {
					let tableFormat = {"top rows":["title","body","field_page_id"]}
					return tableFormat;
				}
			} else {
				return null
			}
			
			
		}
	},
	watch: {
		
	},
	methods: {
		updateData(data) {
			console.log(data);
			this.pageData = data;
		},
		async getData() {
			
			let dataPoint = this.sectionConfig["data point"]
			let dataUrl = (dataPoint.type == "api" || dataPoint.type == "bioindex")? dataPoint.url:"";
			let queryParam = {gene: "pcsk9" ,phenotype:"t2d"}


			let queryString = ""

			if(dataPoint["parameters type"] == "parameters") {
				dataPoint.parameters.map(p=>{
					queryString += p + "=" + queryParam[p] + "&&";
					
				})
			} else if (dataPoint["parameters type"] == "array") {
				dataPoint.parameters.map(p => {
					queryString += queryParam[p] + ",";
				})

				queryString = queryString.substring(0, queryString.length - 1);
			}

			dataUrl += queryString;

			console.log("dataUrl",dataUrl);

            let contJson = await fetch(dataUrl).then((resp) => resp.json());

            if (contJson.error == null) {
				console.log(contJson);
                let data = (dataPoint.type == "bioindex")? contJson.data:contJson;//dataConvert.csv2Json(contJson[0]["field_data_points"])
                
				console.log("data",data);

				this.pageData = data;
                
            }
		}
		
	},
});

$(function () {});
</script>
<style>
</style>
