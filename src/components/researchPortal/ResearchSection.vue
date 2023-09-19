<template>
	<div class="multi-section" :class="'wrapper-' + sectionIndex">
		<div class="row">
			<div class="col-md-12">
				<button class="btn btn-sm show-evidence-btn capture-data" @click="captureData()" title="Capture data in section"><b-icon
												icon="camera"
											></b-icon></button>
	 			<button class="btn btn-sm show-evidence-btn show-hide-section" @click="utils.uiUtils.showHideElement('section_' + sectionConfig['section id'])" title="Show / hide section"><b-icon
											icon="eye"
										></b-icon></button>
				<h4>{{ sectionConfig.header }}
					<small :class="!!utils.keyParams[parameter] ? '' : 'no-search-value'" v-for="parameter in sectionConfig['data point']['parameters']" :key="parameter" style="font-size:0.7em"
					v-html="!!utils.keyParams[parameter]? utils.keyParams[parameter] + '  ' : parameter+' not set. '"></small></h4>
			</div>
		</div>
		<div class="row card-body" :id="'section_' + sectionConfig['section id']">
			<div class="col-md-12" :class="'wrapper-' + sectionIndex">
				
				
				
				<research-section-filters
					v-if="!!filters"
					:filters="filters"
					:filterWidth="sectionConfig['filter width']"
					:dataset="sectionData"
					:unfilteredDataset="originalData"
					:sectionId="sectionConfig['section id']"
					:utils="utils"
					@on-filtering="updateData"
				></research-section-filters>
				<research-section-visualizers
					v-if="!!visualizer && !!sectionData"
					:plotConfig="visualizer"
					:plotData="sectionData"
					:phenotypeMap="phenotypeMap"
					:colors="colors"
					:plotMargin="plotMargin"
					:plotLegend="sectionPlotLegend"
					:sectionId="sectionConfig['section id']"
					:utils="utils"
				>
				</research-section-visualizers>
				<research-data-table
					v-if="!!tableFormat"
					:pageID="sectionIndex"
					:dataset="sectionData"
					:tableFormat="tableFormat"
					:initPerPageNumber="(!!tableFormat['rows per page'])? tableFormat['rows per page'] :10"
					:tableLegend="sectionTableLegend"
					:dataComparisonConfig="
						null
					"
					:searchParameters="
						null
					"
					:pkgData="null"
					:pkgDataSelected="null"
					:phenotypeMap="phenotypeMap"
					:sectionId="sectionConfig['section id']"
					:multiSectionPage="true"
					:utils="utils"
					@clicked-sort="updateData"
				>
				</research-data-table>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import ResearchSectionFilters from "@/components/researchPortal/ResearchSectionFilters.vue";
import ResearchSectionVisualizers from "@/components/researchPortal/ResearchSectionVisualizers.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";

export default Vue.component("research-section", {
	props: ["uId","sectionConfig","phenotypeMap","sectionIndex", "plotMargin", "plotLegend", "tableLegend","colors","utils"],
	components: {
		ResearchSectionFilters,
		ResearchSectionVisualizers,
        ResearchDataTable,
    },
	data() {
		return {
			sectionData: null,
			originalData: null,
			remoteTableFormat:null,
			remoteFilters:null,
			remoteVisualizer:null,
		};
	},
	modules: {
	},
	created() {
		this.$root.$refs[this.sectionConfig["section id"]] = this;
	},
	mounted() {
		this.getData();
	},
	computed: {
		
		tableFormat() {
			if(!!this.sectionData) {
				if(!!this.sectionConfig["table format"] && 
					(!this.sectionConfig["table format"]["type"] || this.sectionConfig["table format"]["type"]!="remote")) {
					return this.sectionConfig["table format"];
				} else if(!!this.remoteTableFormat) {
					return this.remoteTableFormat;
				}else {
					let topRows = Object.keys(this.sectionData[0]);
					let tableFormat = { "top rows": topRows };
					return tableFormat;
				}
			} else {
				return null
			}
		},
		filters() {
			if (!!this.sectionData) {
				if (!!this.sectionConfig["filters"] &&
					(!this.sectionConfig["filters"]["type"] || this.sectionConfig["filters"]["type"] != "remote")) {
					return this.sectionConfig["filters"];
				} else if (!!this.remoteFilters) {
					return this.remoteFilters;
				} else {
					return null;
				}
			} else {
				return null
			}
		},
		visualizer() {
			if (!!this.sectionData) {
				if (!!this.sectionConfig["visualizer"] &&
					(!this.sectionConfig["visualizer"]["type"] || this.sectionConfig["visualizer"]["type"] != "remote")) {
					return this.sectionConfig["visualizer"];
				} else if (!!this.remoteVisualizer) {
					return this.remoteVisualizer;
				} else {
					return null;
				}
			} else {
				return null
			}
		},
		sectionTableLegend() {
			let sectionID = this.sectionConfig["section id"];
			let legendContainer = document.querySelector('#tableLegend');
			let legend = (!!legendContainer.querySelector('#' + sectionID)) ? legendContainer.querySelector('#' + sectionID).innerHTML : "";

			return legend;
		},
		sectionPlotLegend() {
			let sectionID = this.sectionConfig["section id"];
			let legendContainer = document.querySelector('#plotLegend');
			let legend = (!!legendContainer.querySelector('#' + sectionID))?legendContainer.querySelector('#'+ sectionID).innerHTML:"";

			return legend;
		},
		
	},
	watch: {
	},
	methods: {
		updateData(data) {
			this.sectionData = data;
		},
		captureData() {
			let title = [this.sectionConfig.header];

			if(!!this.sectionConfig['data point']['parameters']) {
				this.sectionConfig['data point']['parameters'].map(p => {
					title.push(this.utils.keyParams[p])
				})
			}

			title= title.join(":");

			this.$store.dispatch("capturedData", {action:'add',title: title,data:this.sectionData});
		},
		
		async getData(continueToken) {
			let dataPoint = this.sectionConfig["data point"]
			let dataUrl = (dataPoint.type == "bioindex")? (!!continueToken)? dataPoint.url + "cont?token="+ continueToken :
				dataPoint.url+"query/"+ dataPoint.index +"?q=": 
				dataPoint.type == "api"? dataPoint.url: 
				dataPoint.type == "file" ? "https://hugeampkpncms.org/sites/default/files/users/user" + this.uId + "/" + dataPoint.file :"";
			let queryParams = {}
			let queryParamsSet = true;

			if(!!dataPoint.parameters) {
				dataPoint.parameters.map(p => {
					if (!!this.utils.keyParams[p]) {
						queryParams[p] = this.utils.keyParams[p]
					} else {
						queryParamsSet = false;
					}
				})
			}

			if(!!queryParamsSet) {
				
				if(!!dataPoint["parameters type"]){
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
				}

				if(dataPoint.type == "file") {
					dataUrl = "https://hugeampkpncms.org/servedata/dataset?dataset=" + dataUrl;
				}
				
				
				let contJson = await fetch(dataUrl).then((resp) => resp.json());

				let isData = true;

				if (contJson.error == null) {
					if(!!Array.isArray(contJson) && contJson.length == 0) {
						isData = false
					} else if(!Array.isArray(contJson)) {

					}
				} else {
					isData = false
				}

				if (!!isData) {	
					let data = null;
					let dataWrapper = dataPoint["data wrapper"];

					// remote table format
					if(!!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["type"] 
						&& this.sectionConfig["table format"]["type"] == "remote") {
							let tableFormatWrapper = this.sectionConfig["table format"]["config wrapper"];
							let tableFormats = contJson;

							tableFormatWrapper.map(w => {
								tableFormats = tableFormats[w];
							})
							this.remoteTableFormat = JSON.parse(tableFormats);
					}

					// remote filters
					if (!!this.sectionConfig["filters"] && !!this.sectionConfig["filters"]["type"]
						&& this.sectionConfig["filters"]["type"] == "remote") {
						let filtersWrapper = this.sectionConfig["filters"]["config wrapper"];
						let filters = contJson;

						filtersWrapper.map(w => {
							filters = filters[w];
						})
						this.remoteFilters = JSON.parse(filters);
					}
					
					// remote visualizer
					if (!!this.sectionConfig["visualizer"] && !!this.sectionConfig["visualizer"]["type"]
						&& this.sectionConfig["visualizer"]["type"] == "remote") {
						let visualizerWrapper = this.sectionConfig["visualizer"]["config wrapper"];
						let visualizer = contJson;

						visualizerWrapper.map(w => {
							visualizer = visualizer[w];
						})
						this.remoteVisualizer = JSON.parse(visualizer);
					}
					
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

								data = this.utils.dataConvert.csv2Json(dataEntity);

							} else {
								data = this.utils.dataConvert.csv2Json(contJson);
							}

							
							break;
					}

					if(data.length > 0){
						let tableFormat = (!!this.remoteTableFormat)? this.remoteTableFormat : this.sectionConfig["table format"];

						if (!!tableFormat && !!tableFormat["data convert"]) {
							let convertConfig = tableFormat["data convert"];
							data = this.utils.dataConvert.convertData(convertConfig, data, this.phenotypeMap);
						}

						if (dataPoint.type == "bioindex") {
							if (contJson.page == 1) {
								this.sectionData = data;
								this.originalData = this.sectionData;
							} else {
								this.sectionData = this.sectionData.concat(data);
								this.originalData = this.sectionData;
							}

							if (!!contJson.continuation) {
								this.getData(contJson.continuation);
							}
						} else {
							this.sectionData = data;
							this.originalData = this.sectionData;
						}
					} else {
						
						this.sectionData = null;
						this.originalData = null;
					}
				} else {
					this.sectionData = null;
					this.originalData = null;
				}
			} else {
				if(dataPoint.type == "file") {
					let fetchUrl = "https://hugeampkpncms.org/servedata/dataset?dataset=" + dataUrl;
					let fileData = await fetch(fetchUrl).then(resp => resp.text(fetchUrl));

					if (fileData.error == null) {
						console.log(fileData);
					}
				}
				
			}

			if(!this.originalData || (!!this.originalData.length && this.originalData.length == 0)) {
				
				this.utils.alertUtils.popSectionAlert(
					"No data is returned for " + this.sectionConfig.header + ".",
					this.sectionConfig["section id"]
				);

			}
		},		
	},
});

$(function () {});
</script>
<style>
.multi-section {
	border-bottom: solid 1px #ddd;
	position: relative;
}

button.show-hide-section, button.capture-data {
	position: absolute;
    z-index: 10;
    right: 15px;
    top: 5px;
}

button.capture-data {
	right: 55px;
}

.no-search-value {
	color: #ff0000 !important;
}
</style>
