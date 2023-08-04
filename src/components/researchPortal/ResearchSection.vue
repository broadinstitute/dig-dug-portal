<template>
	<div :class="'wrapper-'+ sectionIndex ">
		<div class="card mdkp-card dataset-page-header">
			<div class="row card-body">
				<div class="col-md-12">
					
					<h4>{{ sectionConfig.header }}</h4>

					<research-section-filters
					v-if="!!sectionConfig.filters"
						:filters="sectionConfig.filters"
						:filterWidth="sectionConfig['filter width']"
						:dataset="pageData"
						:unfilteredDataset="originalData"
						@on-filtering="updateData"
					></research-section-filters>
					
					<research-data-table
						v-if="!!tableFormat"
						:pageID="sectionIndex"
						:dataset="pageData"
						:tableFormat="tableFormat"
						:initPerPageNumber="(!!tableFormat['rows per page'])? tableFormat['rows per page'] :10"
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


import ResearchSectionFilters from "@/components/researchPortal/ResearchSectionFilters.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";

export default Vue.component("research-section", {
	props: ["sectionConfig","keyParams","dataConvert","phenotypeMap","sectionIndex"],
	components: {
		ResearchSectionFilters,
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
			this.pageData = data;
		},
		async getData(continueToken) {
			
			let dataPoint = this.sectionConfig["data point"]
			let dataUrl = (dataPoint.type == "bioindex")? (!!continueToken)? dataPoint.url + "cont?token="+ continueToken :dataPoint.url+"query/"+ dataPoint.index +"?q=": dataPoint.type == "api"? dataPoint.url:"";
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
					let data = null;

					let dataWrapper = dataPoint["data wrapper"];

					

					switch (dataPoint["data type"]) {
						case "bioindex":
							data = contJson.data;
							break;
						case "json":
							if(!!dataWrapper) {
								let dataEntity = contJson;

								dataWrapper.map(w => {
									dataEntity = dataEntity[w];
								})

								data = dataEntity;

							} else {
								data = contJson
							}
							break;
						case "csv":
							
							if (!!dataWrapper) {
								let dataEntity = contJson;

								dataWrapper.map(w=>{
									dataEntity = dataEntity[w];
								})

								data = this.dataConvert.csv2Json(dataEntity);

							} else {
								data = this.dataConvert.csv2Json(contJson);
							}

							
							break;
					}

					let tableFormat = this.sectionConfig["table format"];

					if(!!tableFormat && !!tableFormat["data convert"]) {
						let convertConfig = tableFormat["data convert"];
						data = this.dataConvert.convertData(convertConfig,data,this.phenotypeMap);
					}

					if(dataPoint.type == "bioindex") {
						if (contJson.page == 1) {
							this.pageData = data;
							this.originalData = this.pageData;
						} else {
							this.pageData = this.pageData.concat(data);
							this.originalData = this.pageData;
						}

						if(!!contJson.continuation) {
							this.getData(contJson.continuation);
						}
					} else {
						this.pageData = data;
						this.originalData = this.pageData;
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
