<template>
	<div :class="'wrapper-'+ sectionIndex ">
		<div class="card mdkp-card dataset-page-header">
			<div class="row card-body">
				<div class="col-md-12">
					
					<h4>{{ sectionConfig.header }}</h4>
					
					<research-data-table
						v-if="!!tableFormat"
						:pageID="sectionIndex"
						:dataset="pageData"
						:tableFormat="tableFormat"
						:initPerPageNumber="5"
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
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import bioIndex from "@/modules/bioIndex";

import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";

export default Vue.component("research-section", {
	props: ["sectionConfig","keyParams","dataConvert","phenotypeMap","sectionIndex"],
	components: {
        ResearchDataTable,
    },
	data() {
		return {
			pageData: null,
			originalData: null,
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
					let topRows = Object.keys(this.pageData[0]);
					let tableFormat = { "top rows": topRows };
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
			this.originalData = this.pageData;
			this.pageData = data;

			console.log("o", this.originalData[0]);
		},
		async getData(continueToken) {
			
			let dataPoint = this.sectionConfig["data point"]
			let dataUrl = (dataPoint.type == "api" || dataPoint.type == "bioindex")? (!!continueToken)? dataPoint.url + "cont?token="+ continueToken :dataPoint.url+"query/"+ dataPoint.index +"?q=":"";
			let queryParams = {}
			let queryParamsSet = true;

			dataPoint.parameters.map(p=>{
				if(!!this.keyParams[p]) {
					queryParams[p] = this.keyParams[p]
				} else {
					queryParamsSet = false;
				}
			})

			if(!!queryParamsSet) {
				let queryString = ""

				if (dataPoint["parameters type"] == "parameters") {
					dataPoint.parameters.map(p => {
						queryString += p + "=" + queryParams[p] + "&&";

					})
				} else if (dataPoint["parameters type"] == "array") {
					dataPoint.parameters.map(p => {
						queryString += queryParams[p] + ",";
					})

					queryString = queryString.substring(0, queryString.length - 1);
				}

				if(!continueToken) {
					if (dataPoint.type == "api") {
						dataUrl += queryString;
					} else if (dataPoint.type == "bioindex") {
						dataUrl += queryString;
					}
				}
				
				let contJson = await fetch(dataUrl).then((resp) => resp.json());

				if (contJson.error == null) {	
					let data = (dataPoint.type == "bioindex") ? contJson.data : contJson;//dataConvert.csv2Json(contJson[0]["field_data_points"])
					let tableFormat = this.sectionConfig["table format"];

					if(!!tableFormat && !!tableFormat["data convert"]) {
						let convertConfig = tableFormat["data convert"];
						data = this.dataConvert.convertData(convertConfig,data,this.phenotypeMap);
					}

					console.log(dataPoint.type, contJson.page,data.length)

					if(dataPoint.type == "bioindex") {
						if (contJson.page == 1) {
							this.pageData = data;
						} else {
							this.pageData = this.pageData.concat(data);
						}

						if(!!contJson.continuation) {
							this.getData(contJson.continuation);
						}

					} else {
						this.pageData = data;
					}
				}
			}
			
		},
		
	},
});

$(function () {});
</script>
<style>
</style>
