<template>
	<div class="multi-section" :class="'wrapper-' + sectionIndex">
		<div class="row">
			<div class="col-md-12">
				<button class="btn btn-sm show-evidence-btn capture-data" @click="captureData()" title="Capture data in section"><b-icon
												icon="camera"
											></b-icon></button>
	 			<button class="btn btn-sm show-evidence-btn show-hide-section" @click="utils.uiUtils.showHideElement('section_' + sectionID)" title="Show / hide section"><b-icon
											icon="eye"
										></b-icon></button>
				<h4>{{ sectionConfig.header }}
					
					<small :class="!!utils.keyParams[parameter] ? '' : 'no-search-value'" v-for="parameter in sectionConfig['data point']['parameters']" :key="parameter" style="font-size:0.7em"
					v-html="!!utils.keyParams[parameter]? utils.keyParams[parameter] + '  ' : parameter+' not set. '"></small>
					<small :class="(loadingDataFlag == 'down')?'data-loading-flag hidden':'data-loading-flag'" :id="'flag_' + sectionID">Loading data...</small></h4>
			</div>
		</div>

		<div v-if="!!groups"><span v-for="key in groups" @click="removeData(key)" class="btn section-search-bbl show-evidence-btn">{{ key + "  x"}}</span></div>

		<div class="row card-body" :id="'section_' + sectionID">
			<div class="col-md-12" :class="'wrapper-' + sectionIndex">
				
				<research-in-section-search 
					v-if="!!sectionConfig['search parameters']"
					:searchParameters="sectionConfig['search parameters']"
					:phenotypesInUse="phenotypesInUse"
					:section="sectionConfig"
					:utils="utils"
					>
				</research-in-section-search>

				<research-page-description
					v-if="!!sectionDescription"
					:content="sectionDescription"
					:utils="utils"
				></research-page-description>
				
				<research-section-filters
					v-if="!!filters"
					:filters="filters"
					:filterWidth="sectionConfig['filter width']"
					:dataset="sectionData"
					:unfilteredDataset="originalData"
					:sectionId="sectionID"
					:utils="utils"
					:dataComparisonConfig="dataComparisonConfig"
					@on-filtering="updateData"
				></research-section-filters>

				<template v-if="!!multiVisualizers && !!sectionData && multiVisualizersType == 'tabs'">
					<div class="sub-tab-ui-wrapper" :id="'tabUiGroup' + sectionID">
						<div v-for="tab, tabIndex in multiVisualizers" 
							:id="'tabUi' + sectionID + tabIndex" class="tab-ui-tab" :class="tabIndex == 0 ? 'active' : ''"
							@click="utils.uiUtils.setTabActive('tabUi' + sectionID + tabIndex,
								 'tabUiGroup' + sectionID,
								'tabContent' + sectionID + tabIndex, 'tabContentGroup' + sectionID,true)">
							{{ tab.label }}
						</div>
					</div>
				</template>
				<div  v-if="!!multiVisualizers && !!sectionData" 	
					:id="multiVisualizersType == 'tabs'?'tabContentGroup' + sectionID:''">
					
					<div v-for="plotConfig, plotIndex in multiVisualizers"
						:id="multiVisualizersType == 'tabs' ? 'tabContent' + sectionID + plotIndex:''"
						class="plot-tab-content-wrapper"
						:class="(multiVisualizersType == 'tabs')?(plotIndex == 0) ? '' : 'hidden-content':''"
						>
						<h6 v-html="plotConfig.label"></h6>
						<research-section-visualizers
							:plotConfig="plotConfig"
							:plotData="(!groups || (!!groups && groups.length<=1))?sectionData:mergedData"
							:phenotypeMap="phenotypeMap"
							:colors="colors"
							:plotMargin="plotMargin"
							:plotLegend="getSectionPlotLegend(sectionID + plotIndex)"
							:sectionId="sectionID + plotIndex"
							:utils="utils"
							:dataComparisonConfig="dataComparisonConfig"
							:searchParameters="groupSearchParameters"
						>
						</research-section-visualizers>
					</div>
				</div>

				<research-section-visualizers
					v-if="!multiVisualizers && !!visualizer && !!sectionData"
					:plotConfig="visualizer"
					:plotData="(!groups || (!!groups && groups.length <= 1)) ? sectionData : mergedData"
					:phenotypeMap="phenotypeMap"
					:colors="colors"
					:plotMargin="plotMargin"
					:plotLegend="getSectionPlotLegend(sectionID)"
					:sectionId="sectionID"
					:utils="utils"
					:dataComparisonConfig="dataComparisonConfig"
					:searchParameters="groupSearchParameters"
				>
				</research-section-visualizers>
				<research-data-table
					v-if="!!tableFormat"
					:pageID="sectionIndex"
					:dataset="(!groups || (!!groups && groups.length <= 1)) ? sectionData : mergedData"
					:tableFormat="tableFormat"
					:initPerPageNumber="(!!tableFormat['rows per page'])? tableFormat['rows per page'] :10"
					:tableLegend="sectionTableLegend"
					:dataComparisonConfig="
						dataComparisonConfig
					"
					:searchParameters="
						groupSearchParameters
					"
					:pkgData="null"
					:pkgDataSelected="null"
					:phenotypeMap="phenotypeMap"
					:sectionId="sectionID"
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
import ResearchInSectionSearch from "@/components/researchPortal/ResearchInSectionSearch.vue";
import ResearchSectionFilters from "@/components/researchPortal/ResearchSectionFilters.vue";
import ResearchSectionVisualizers from "@/components/researchPortal/ResearchSectionVisualizers.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";

export default Vue.component("research-section", {
	props: ["uId","sectionConfig","phenotypeMap","description","phenotypesInUse","sectionIndex", "plotMargin", "plotLegend", "tableLegend","colors","utils"],
	components: {
		ResearchSectionFilters,
		ResearchSectionVisualizers,
        ResearchDataTable,
		ResearchInSectionSearch
    },
	data() {
		return {
			sectionData: null,
			originalData: null,
			remoteTableFormat:null,
			remoteFilters:null,
			remoteVisualizer:null,
			remoteSectionDecription:null,
			interSectionsFilter:[],
			groups:null,
			loadingDataFlag: "down"
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
		sectionID() {
			return this.sectionConfig["section id"];
		},
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
		dataComparisonConfig() {

			let groupsLength = (!!this.groups)?this.groups.length:0;
			if(!!this.tableFormat && !!this.tableFormat["group by"] && !!this.tableFormat["compare data"] && groupsLength > 1) {
				let config = {
					"key field": this.tableFormat["compare data"]["key field"],
					"fields group data key": this.tableFormat["group by"],
					"fields to compare": this.tableFormat["compare data"]["fields to compare"]
				}
				return config;
			} else {
				return null
			}
		},
		mergedData(){
			if(!!this.dataComparisonConfig) {
				let comConfig = this.dataComparisonConfig;
				let comFields = comConfig["fields to compare"];
				let groups = this.groups;
				let merged = {};

				if(!!Array.isArray(this.sectionData)) {
					this.sectionData.map(row => {
						let groupKey = row[comConfig["fields group data key"]];
						let keyProp = row[comConfig["key field"]];

						let isNewProp = !!merged[keyProp] ? false : true
						merged[keyProp] = isNewProp == true ? {} : merged[keyProp];

						for (const [fKey, fValue] of Object.entries(row)) {
							if (isNewProp == true) {
								if (!!comFields.includes(fKey)) {
									merged[keyProp][fKey] = {};
									merged[keyProp][fKey][groupKey] = fValue;
								} else {
									merged[keyProp][fKey] = fValue;
								}
							} else {
								if (!!comFields.includes(fKey)) {

									merged[keyProp][fKey][groupKey] = fValue;
								}
							}
						}
					})
				} else {
					merged = this.sectionData;
				}
				

				//return Object.values(merged);
				return merged;
			}
		},
		groupSearchParameters() {
			if (!!this.dataComparisonConfig) {
				let comConfig = this.dataComparisonConfig;

				let params = {};
				let tempObj={};
				tempObj['search'] = this.groups;

				params[comConfig["fields group data key"]] = tempObj;

				return params;

			} else {
				return null
			}
		},
		sectionDescription() {
			if (!!this.sectionData) {
				if (!!this.description) {
					return this.description;
				} else if (!!this.remoteSectionDecription) {
					return this.remoteSectionDecription;
				} else {
					return null;
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
		multiVisualizers() {
			if (!!this.sectionData) {
				if (!!this.sectionConfig["visualizers"]) {
					return this.sectionConfig["visualizers"]["visualizers"];
				} /*else if(!!this.dataComparisonConfig) {
					let plotConfigs =[]
					let groups = this.groups;
					groups.map(group =>{
						let visualizer = Object.assign({},this.visualizer);
						plotConfigs.push(visualizer);
					})

					for(let i=0; i < groups.length; i++) {
						console.log(groups[i]);
						plotConfigs[i]["label"] = groups[i];
						if(i < groups.length-1 && !!plotConfigs[i]["genes track"]) {
							delete plotConfigs[i]["genes track"]
						}
					}

					return plotConfigs;
				}*/else {
					return null;
				}
			} else {
				return null
			}
		},
		multiVisualizersType() {
			if (!!this.sectionData) {
				if (!!this.sectionConfig["visualizers"]) {
					return this.sectionConfig["visualizers"]["wrapper type"];
				} /*else if (!!this.dataComparisonConfig) {
					return "divs";
				}*/ else {
					return null;
				}
			} else {
				return null
			}
		},
		sectionTableLegend() {
			let legend = (!!document.getElementById(this.sectionID + "_tableLegend")) ? 
				document.getElementById(this.sectionID + "_tableLegend").innerHTML :null;
			
			return legend;
		},
		
	},
	watch: {
		sectionData(DATA) {
			// interSections data filtering part
			/*if(DATA.length > 0 && !!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["sections filters"]){
				let sections = this.sectionConfig["table format"]["sections filters"]["target sections"];

				sections.map(section=>{
					let filterData = DATA.map(d => d[section["filter by"]["filter field"]]);
					this.$root.$refs[section.section].filterAcrossSections(this.sectionID, filterData, section);
				})
			}*/
		}
	},
	methods: {

		filterAcrossSections(FROM,FILTER_DATA,FILTER) {

			FILTER["data"] = FILTER_DATA;
			FILTER["from"] = FROM;

			let isFilter = false;
			if(this.interSectionsFilter.length > 0) {
				this.interSectionsFilter.map(f=>{
					if(f.from == FROM) {
						f = FILTER;
						isFilter = true;
					}
				})
			}



			if(!isFilter) {
				this.interSectionsFilter.push(FILTER);
			}
			
		},
		getGroups() {
			let groups = null;
			if(!!this.sectionData && !!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["group by"]){
				groups = [];
				let groupKeys = this.sectionConfig["table format"]["group by"];

				console.log("this.sectionData", this.sectionData);

				this.sectionData.map(row=>{
					let group = "";
					let keyIndex = 1;
					groupKeys.map(key => {
						group += row[key];
						group += (keyIndex < groupKeys.length)?", ":"";
						keyIndex++;
					})

					if(!groups.includes(group)) {
						groups.push(group);
					}
				})
			}

			return groups;
		},
		filterSectionData(GROUP) {
			let groupValues = GROUP.split(", ");
			let groupKeys = this.sectionConfig["table format"]["group by"];

			let filteredData = [];

			this.sectionData.map(row => {
				let dataFit = true;
				let keyIndex = 0;
				groupKeys.map(key => {
					if(row[key] != groupValues[keyIndex]) (dataFit = false)
					keyIndex++;
				})

				if (!!dataFit) {
					filteredData.push(row);
				}
			})

			return filteredData;
		},
		getSectionPlotLegend(ID) {
			
			let legend = (!!document.getElementById(ID + "_plotLegend")) ?
				document.getElementById(ID + "_plotLegend").innerHTML : null;

			return legend;
		},
		updateData(data) {
			this.sectionData = data;
		},
		removeData(KEY) {
			let groupKeys = this.sectionConfig["table format"]["group by"];

			let newSectionData = [];
			this.sectionData.map(row => {
				let group = "";
				let keyIndex = 1;
				groupKeys.map(key => {
					group += row[key];
					group += (keyIndex < groupKeys.length) ? ", " : "";
					keyIndex++;
				})

				if (group != KEY) {
					newSectionData.push(row);
				}
			});

			this.sectionData = newSectionData;

			let newOriginalData = [];
			this.originalData.map(row => {
				let group = "";
				let keyIndex = 1;
				groupKeys.map(key => {
					group += row[key];
					group += (keyIndex < groupKeys.length) ? ", " : "";
					keyIndex++;
				})

				if (group != KEY) {
					newOriginalData.push(row);
				}
			});

			this.originalData = newOriginalData;
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

		getData(TOKEN) {
			this.loadingDataFlag = "up";
			this.queryData(TOKEN);
		},
		
		async queryData(continueToken) {
			//let flag = document.getElementById("flag_"+ this.sectionID);
			//flag.classList.remove("hidden");
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

			if (!!this.sectionConfig["pre filters"]) {
				this.sectionConfig["pre filters"].map(f => {
					if (f.value=="search parameter" && !this.utils.keyParams[f.parameter]) {
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

					// remote sectionDescription
					if (!!this.sectionConfig["section description"] && !!this.sectionConfig["section description"]["type"]
						&& this.sectionConfig["section description"]["type"] == "remote") {
						let descriptionWrapper = this.sectionConfig["section description"]["config wrapper"];
						let description = contJson;

						descriptionWrapper.map(w => {
							description = description[w];
						})
						this.remoteSectionDecription = description;
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

						let cumulateData = (!!dataPoint["cumulate data"] && dataPoint["cumulate data"] == "true")?
							true : null;

						let isOriginalDataEmpty = (!this.originalData || (!!this.originalData.length && this.originalData.length == 0))?
							true : null;

						if (!!cumulateData) {
							
							if (dataPoint.type == "bioindex") {

								if (contJson.page == 1) {
									this.sectionData = !!isOriginalDataEmpty? data: this.sectionData.concat(data);
								} else {
									this.sectionData = this.sectionData.concat(data);
								}

								if (!!contJson.continuation) {
									this.getData(contJson.continuation);
								} else {
									this.loadingDataFlag = "down"
								}
							} else {
								this.sectionData = !!isOriginalDataEmpty ? data : this.sectionData.concat(data);
								this.loadingDataFlag = "down"
							}
						} else {
							if (dataPoint.type == "bioindex") {

								if (contJson.page == 1) {
									this.sectionData = data;
								} else {
									this.sectionData = this.sectionData.concat(data);
								}

								if (!!contJson.continuation) {
									this.getData(contJson.continuation);
								} else {
									this.loadingDataFlag = "down"
								}
							} else {
								this.sectionData = data;
								this.loadingDataFlag = "down"
							}
						}
						
					} else {
						this.sectionData = null;
					}

				} else {
					this.sectionData = null;
				}


				if (this.sectionData != null && !!this.sectionConfig["pre filters"]) {
					let filters = this.sectionConfig["pre filters"];
					let filterValues = {}

					filters.map(filter => {
						filterValues[filter.parameter] = this.utils.keyParams[filter.parameter]
					})

					this.sectionData = this.utils.filterUtils.applyFilters(filters, this.sectionData, filterValues);
				}

				//console.log("this.interSectionsFilter", this.interSectionsFilter);

				/*

			//filter data
			if(this.interSectionsFilter.length > 0) {
				let filteredData = [];
				this.originalData.map(d => {
					this.interSectionsFilter.map(f=>{
						if (!!f.data.includes(d[f["filter by"]["target field"]])) {
							filteredData.push(d);
						}
					})
				})

				this.sectionData = filteredData;
			}

				*/

				

				if(this.sectionData != null && !!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["initial sort by"]) {
					let sortBy = this.sectionConfig["table format"]["initial sort by"]
					this.sectionData = this.utils.sortUtils.sortEGLTableData(this.sectionData, sortBy.field, true, true);
				} 

				if(this.sectionData != null && !!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["group by"]) {
					let groups = [];
					let groupKeys = this.sectionConfig["table format"]["group by"];
					this.sectionData.map(row => {
						let group = "";
						let keyIndex = 1;
						groupKeys.map(key => {
							group += row[key];
							group += (keyIndex < groupKeys.length) ? ", " : "";
							keyIndex++;
						})

						if (!groups.includes(group)) {
							groups.push(group);
						}
					})

					this.groups = groups.sort();
				}

				this.originalData = this.sectionData;
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
					this.sectionID
				);

				//flag.classList.add("hidden");

				this.loadingDataFlag = "down"

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

.section-search-bbl {
	font-size: 13px !important;
    margin-right: 5px;
    margin-bottom: 3px;
    font-weight: 400;
    line-height: 1;
    text-align: center;
    border: 1px solid transparent;
    border-radius: 10rem;
    display: inline-block;
}

.data-loading-flag {
	font-size: 0.7em;
    display: inline-block;
    background-color: #bbffcc;
    border: solid 1px #99ddbb;
    border-radius: 3px;
    padding: 0 15px;
    margin-right: 10px;
    color: #006633;
}

.data-loading-flag.hidden {
	display: none;
}

.sub-tab-ui-wrapper {
	border-bottom: solid 1px #ddd;
    margin: 25px 0;
    padding: 0 25px;
}

.sub-tab-ui-wrapper .tab-ui-tab {
	padding: 5px 10px;
    border: solid 1px #ddd;
    display: inline-block;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    margin-right: 5px;
    background-color: #eee;
    margin-bottom: -1px;
	color: #0069d9;
	font-size: 13px;
}

.sub-tab-ui-wrapper .tab-ui-tab:hover {
	cursor: pointer;
}

.sub-tab-ui-wrapper .tab-ui-tab.active {
	border-bottom: solid 1px #fff;
	background-color: #fff;
}
</style>
