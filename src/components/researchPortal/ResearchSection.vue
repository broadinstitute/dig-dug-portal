<template>
	<div class="multi-section" :class="'wrapper-' + sectionIndex"
		:style="!!sectionData || sectionConfig['section type'] == 'primary' ? '' : 'display:none;'">


		<!--<div class="multi-section" :class="'wrapper-' + sectionIndex" >-->
		<div class="row">
			<div class="col-md-12">
				<button class="btn btn-sm show-evidence-btn capture-data" @click="captureData()"
					title="Capture data in section"><b-icon icon="camera"></b-icon></button>
				<button class="btn btn-sm show-evidence-btn show-hide-section"
					@click="utils.uiUtils.showHideElement('section_' + sectionID)" title="Show / hide section"><b-icon
						icon="eye"></b-icon></button>
				<h4>{{ sectionConfig.header }}

					<small :class="!!utils.keyParams[parameter] ? '' : 'no-search-value'"
						v-for="parameter in sectionConfig['data point']['parameters']" :key="parameter"
						style="font-size:0.7em"
						v-html="!!utils.keyParams[parameter] ? utils.keyParams[parameter] + '  ' : parameter + ' not set. '"></small>
					<small :class="(loadingDataFlag == 'down') ? 'data-loading-flag hidden' : 'data-loading-flag'"
						:id="'flag_' + sectionID">Loading data...</small>
				</h4>
			</div>
		</div>

		<div v-if="!!groups"><span v-for="key in groups" @click="removeData(key)"
				class="btn section-search-bbl show-evidence-btn">{{ key.label + " x" }}</span></div>

		<div class="row card-body" :id="'section_' + sectionID">
			<div class="col-md-12" :class="'wrapper-' + sectionIndex">

				<research-in-section-search v-if="!!sectionConfig['search parameters']"
					:searchParameters="sectionConfig['search parameters']" :phenotypesInUse="phenotypesInUse"
					:section="sectionConfig" :utils="utils">
				</research-in-section-search>

				<research-page-description v-if="!!sectionDescription" :content="sectionDescription"
					:utils="utils"></research-page-description>

				<research-section-filters v-if="!!filters" :filters="filters" :filterWidth="sectionConfig['filter width']"
					:dataset="sectionData" :unfilteredDataset="originalData" :sectionId="sectionID" :utils="utils"
					:dataComparisonConfig="null" @on-filtering="updateData"></research-section-filters>

				<template v-if="!!multiVisualizers && !!sectionData && multiVisualizersType == 'tabs'">
					<div class="sub-tab-ui-wrapper" :id="'tabUiGroup' + sectionID">
						<div v-for="tab, tabIndex in multiVisualizers" :id="'tabUi' + sectionID + tabIndex"
							class="tab-ui-tab" :class="tabIndex == 0 ? 'active' : ''" @click="utils.uiUtils.setTabActive('tabUi' + sectionID + tabIndex,
								'tabUiGroup' + sectionID,
								'tabContent' + sectionID + tabIndex, 'tabContentGroup' + sectionID, true)">
							{{ tab.label }}
						</div>
					</div>
				</template>
				<div v-if="!!multiVisualizers && !!sectionData"
					:id="multiVisualizersType == 'tabs' ? 'tabContentGroup' + sectionID : ''">

					<div v-for="plotConfig, plotIndex in multiVisualizers"
						:id="multiVisualizersType == 'tabs' ? 'tabContent' + sectionID + plotIndex : ''"
						class="plot-tab-content-wrapper"
						:class="(multiVisualizersType == 'tabs') ? (plotIndex == 0) ? '' : 'hidden-content' : ''">
						<h6 v-html="plotConfig.label"></h6>
						<research-section-visualizers :plotConfig="plotConfig"
							:plotData="(!groups || (!!groups && groups.length <= 1) || !dataComparisonConfig) ? sectionData : mergedData"
							:phenotypeMap="phenotypeMap" :colors="colors" :plotMargin="plotMargin"
							:plotLegend="getSectionPlotLegend(sectionID + plotIndex)" :sectionId="sectionID + plotIndex"
							:utils="utils" :dataComparisonConfig="dataComparisonConfig"
							:searchParameters="groupSearchParameters">
						</research-section-visualizers>
					</div>
				</div>
				<research-section-visualizers v-if="!multiVisualizers && !!visualizer && !!sectionData"
					:plotConfig="visualizer"
					:plotData="(!groups || (!!groups && groups.length <= 1) || !dataComparisonConfig) ? sectionData : mergedData"
					:phenotypeMap="phenotypeMap" :colors="colors" :plotMargin="plotMargin"
					:plotLegend="getSectionPlotLegend(sectionID)" :sectionId="sectionID" :utils="utils"
					:dataComparisonConfig="dataComparisonConfig" :searchParameters="groupSearchParameters">
				</research-section-visualizers>
				<research-data-table v-if="!!tableFormat" :pageID="sectionIndex"
					:dataset="(!groups || (!!groups && groups.length <= 1) || !dataComparisonConfig) ? sectionData : mergedData"
					:tableFormat="tableFormat"
					:initPerPageNumber="(!!tableFormat['rows per page']) ? tableFormat['rows per page'] : 10"
					:tableLegend="sectionTableLegend" :dataComparisonConfig="dataComparisonConfig
						" :searchParameters="groupSearchParameters
		" :pkgData="null" :pkgDataSelected="null" :phenotypeMap="phenotypeMap" :sectionId="sectionID"
					:multiSectionPage="true" :utils="utils" @clicked-sort="sortData">
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
	props: ["uId", "sectionConfig", "phenotypeMap", "description", "phenotypesInUse", "sectionIndex", "plotMargin", "plotLegend", "tableLegend", "colors", "utils"],
	components: {
		ResearchSectionFilters,
		ResearchSectionVisualizers,
		ResearchDataTable,
		ResearchInSectionSearch
	},
	data() {
		return {
			sectionData: null,
			mergedData: null,
			originalData: null,
			tableFormat: null,
			remoteTableFormat: null,
			remoteFilters: null,
			remoteVisualizer: null,
			remoteSectionDecription: null,
			interSectionsFilters: [],
			groups: null,
			searched: [],
			loadingDataFlag: "down"
		};
	},
	modules: {
	},
	created() {
		this.$root.$refs[this.sectionConfig["section id"]] = this;

		if (!!this.sectionConfig["table format"] &&
			(!this.sectionConfig["table format"]["type"] || this.sectionConfig["table format"]["type"] != "remote")) {
			this.tableFormat = this.sectionConfig["table format"];
		}

	},
	mounted() {
		this.getData();
	},
	computed: {
		sectionID() {
			return this.sectionConfig["section id"];
		},
		dataComparisonConfig() {
			let groupsLength = (!!this.groups) ? this.groups.length : 0;
			if (!!this.tableFormat && !!this.tableFormat["group by"] && !!this.tableFormat["compare data"] && groupsLength > 1) {
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

		groupSearchParameters() {
			if (!!this.dataComparisonConfig) {
				let comConfig = this.dataComparisonConfig;

				let params = {};
				let tempObj = {};
				tempObj['search'] = [...new Set(this.groups.map(g => g.label))];

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
				} else {
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
				} else {
					return null;
				}
			} else {
				return null
			}
		},
		sectionTableLegend() {
			let legend = (!!document.getElementById(this.sectionID + "_tableLegend")) ?
				document.getElementById(this.sectionID + "_tableLegend").innerHTML : null;

			return legend;
		},
	},
	watch: {
		sectionData(DATA) {
			if (!this.tableFormat && !this.remoteTableFormat) {
				let topRows = Object.keys(this.sectionData[0]);
				this.tableFormat = { "top rows": topRows };
			}
			if (!!this.dataComparisonConfig) {
				this.mergedData = this.getMergedData();
			}
		},
		originalData(DATA) {
			if (this.loadingDataFlag == "down") {
				/// filter data by interSectionsFilters
				if (this.sectionData != null && this.interSectionsFilters.length > 0) {
					this.interSectionsFilters.map(filter => {

						let FilterKey = filter["filter by"]["filter field"],
							TargetKey = filter["filter by"]["target field"],
							TYPE = filter["filter by"]["type"],
							FilterData = filter["data"],
							TargetData = DATA;
						this.sectionData = this.utils.filterUtils.filterMulti2Multi(FilterKey, TargetKey, TYPE, FilterData, TargetData);
					});
				}

				/// fire interSectionsFilters

				// interSections data filtering part
				if (!!DATA && DATA.length > 0 && !!this.tableFormat && !!this.tableFormat["sections filters"]) {
					let sections = this.tableFormat["sections filters"]["target sections"];

					sections.map(section => {
						this.$root.$refs[section.section].filterAcrossSections(this.sectionID, DATA, section, null);
					})
				} else if ((!DATA || (!!DATA && DATA.length == 0)) && !!this.tableFormat && !!this.tableFormat["sections filters"]) {
					let sections = this.tableFormat["sections filters"]["target sections"];

					sections.map(section => {
						this.$root.$refs[section.section].filterAcrossSections(this.sectionID, null, section, "reset");
					})
				}
			}
		},
		interSectionsFilters(FILTERS) {
			if (this.loadingDataFlag == "down") {
				if (this.originalData != null && this.interSectionsFilters.length > 0) {
					this.interSectionsFilters.map(filter => {

						let FilterKey = filter["filter by"]["filter field"],
							TargetKey = filter["filter by"]["target field"],
							TYPE = filter["filter by"]["type"],
							FilterData = filter["data"],
							TargetData = this.originalData;
						this.sectionData = this.utils.filterUtils.filterMulti2Multi(FilterKey, TargetKey, TYPE, FilterData, TargetData);
					});
				}
			}
		}
	},
	methods: {
		resetAll() {
			this.sectionData = null,
				this.mergedData = null,
				this.originalData = null,
				this.interSectionsFilters = [],
				this.groups = null,
				this.searched = [],
				this.loadingDataFlag = "down"
		},
		filterAcrossSections(FROM, FILTER_DATA, FILTER, RESET) {
			let interSectionsFilters = [...new Set(this.interSectionsFilters)];
			this.interSectionsFilters = [];
			if (RESET != "reset") {
				FILTER["data"] = FILTER_DATA;
				FILTER["from"] = FROM;

				let isFilter = false;
				if (interSectionsFilters.length > 0) {
					interSectionsFilters.map(f => {
						if (f.from == FROM) {
							f = FILTER;
							isFilter = true;
						}
					})
				}

				if (!isFilter) {
					interSectionsFilters.push(FILTER);
				}


			} else if (RESET == 'reset') {
				interSectionsFilters = interSectionsFilters.filter(f => f.from != FROM);
				this.sectionData = this.originalData;
			}

			this.interSectionsFilters = interSectionsFilters;
		},
		filterSectionData(GROUP) {
			let groupValues = GROUP.split(", ");
			let groupKeys = this.sectionConfig["table format"]["group by"];

			let filteredData = [];

			this.sectionData.map(row => {
				let dataFit = true;
				let keyIndex = 0;
				groupKeys.map(key => {
					if (row[key] != groupValues[keyIndex]) (dataFit = false)
					keyIndex++;
				})

				if (!!dataFit) {
					filteredData.push(row);
				}
			})

			return filteredData;
		},
		getMergedData() {
			if (!!this.dataComparisonConfig) {
				let comConfig = this.dataComparisonConfig;
				let comFields = comConfig["fields to compare"];
				let groups = this.groups;
				let merged = {};

				if (!!Array.isArray(this.sectionData)) {
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

				return merged;
			}
		},
		getSectionPlotLegend(ID) {

			let legend = (!!document.getElementById(ID + "_plotLegend")) ?
				document.getElementById(ID + "_plotLegend").innerHTML : null;

			return legend;
		},
		updateData(data) {
			this.sectionData = data;
		},
		sortData(KEY) {
			if (!!this.tableFormat['locus field'] && KEY.key == this.tableFormat['locus field']) {
				this.sectionData = this.utils.sortUtils.sortLocusField(this.sectionData, KEY.key, KEY.direction);
			} else {
				let isNumeric = this.checkIfNumeric(this.sectionData, KEY.key);
				this.sectionData = this.utils.sortUtils.sortEGLTableData(this.sectionData, KEY.key, isNumeric, KEY.direction);
			}
		},
		checkIfNumeric(DATA, KEY) {
			let checkNumbers = [
				"0",
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
				"7",
				"8",
				"9",
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9,
				"e",
				"E",
				"-",
				".",
			];
			let ifNumber = true;

			DATA.map((d) => {
				for (let i in d[KEY]) {
					if (!checkNumbers.includes(d[KEY][i])) {
						ifNumber = false;
					}
				}
			});

			return ifNumber;
		},
		removeData(KEY) {

			console.log(KEY);
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

				if (group != KEY.label) {
					newSectionData.push(row);
				}
			});

			this.sectionData = (newSectionData.length === 0) ? null : newSectionData;

			let newOriginalData = [];
			this.originalData.map(row => {
				let group = "";
				let keyIndex = 1;
				groupKeys.map(key => {
					group += row[key];
					group += (keyIndex < groupKeys.length) ? ", " : "";
					keyIndex++;
				})

				if (group != KEY.label) {
					newOriginalData.push(row);
				}
			});

			this.originalData = newOriginalData.length === 0 ? null : newOriginalData;

			if (!this.originalData) {
				this.groups = null;
				this.searched = [];
			} else {
				this.groups = this.groups.filter(g => g.label != KEY.label);
				this.searched = this.searched.filter(params => params != KEY.params)
			}
		},
		captureData() {
			let title = [this.sectionConfig.header];

			if (!!this.sectionConfig['data point']['parameters']) {
				this.sectionConfig['data point']['parameters'].map(p => {
					title.push(this.utils.keyParams[p])
				})
			}

			title = title.join(":");

			this.$store.dispatch("capturedData", { action: 'add', title: title, data: this.sectionData });
		},

		getParamString() {
			let dataPoint = this.sectionConfig["data point"];

			let queryParams = {}; // collect search parameters
			let queryParamsString = []; // search parameters into one string
			let queryParamsSet = true; // if search requirements don't meet set it null

			/// check if all required search parameters are there. If not set queryParamsSet null.
			//1. collect all parameters and put them in queryParams

			if (!!dataPoint.parameters) {
				dataPoint.parameters.map(p => {
					if (!!this.utils.keyParams[p]) {
						queryParams[p] = this.utils.keyParams[p].split(",");
					} else {
						queryParamsSet = null;
					}
				})
			}

			/// check if one of the pre filters require a value from search parameters. If no value, set queryParamsSet null.
			if (!!this.sectionConfig["pre filters"]) {
				this.sectionConfig["pre filters"].map(f => {
					if (f.value == "search parameter" && !this.utils.keyParams[f.parameter]) {
						queryParamsSet = null;
					}
				})
			}

			//2. build parameters sets from queryParams and put them in queryParamsString

			if (!!queryParamsSet) {
				let paramsLength = queryParams[dataPoint.parameters[0]].length;

				for (let i = 0; i < paramsLength; i++) {
					let pramsString = ""
					dataPoint.parameters.map(p => {
						pramsString += queryParams[p][i] + ",";
					})
					queryParamsString.push(pramsString.slice(0, -1));
				}
			}

			//3. compare strigns in queryParamsString to this.searched and leave only the ones don't overlap

			queryParamsString = queryParamsString.filter(q => !this.searched.includes(q));

			//5. Check if return the first item in the queryParamsString

			if (queryParamsString.length > 0) {
				return queryParamsString[0];
			} else {
				return "invalid";
			}

		},
		getData() {
			this.loadingDataFlag = "up";
			this.queryData();
		},

		queryData() {
			let queryType = this.sectionConfig["data point"]["type"];
			let paramsType = this.sectionConfig["data point"]["parameters type"]
			let params = this.sectionConfig["data point"]["parameters"]

			let paramsString = this.getParamString();

			if (paramsString != "invalid") {
				switch (queryType) {
					case "bioindex":
						// Parameters type for BI is always 'array,' it doesn't need to pass paramsType and params
						this.queryBioindex(paramsString);
						break;
					case "api":
						this.queryApi(paramsString, paramsType, params);
						break;
					case "file":
						this.queryFile(paramsString, paramsType, params);
						break;
				}
			}

		},

		async queryBioindex(QUERY) {
			console.log("QUERY", QUERY)
			this.searched.push(QUERY);
			let dataPoint = this.sectionConfig["data point"];
			let dataUrl = dataPoint.url + "query/" + dataPoint.index + "?q=" + QUERY;

			let contentJson = await fetch(dataUrl).then((resp) => resp.json());

			if (contentJson.error == null && !!Array.isArray(contentJson.data) && contentJson.data.length > 0) {
				this.processLoadedBI(contentJson, QUERY);
			} else {
				// fetch failed
				this.sectionData = null;
				this.loadingDataFlag = "down"
			}
		},

		async queryBiContinue(TOKEN, QUERY) {
			let dataPoint = this.sectionConfig["data point"];
			let dataUrl = dataPoint.url + "cont?token=" + TOKEN;

			let contentJson = await fetch(dataUrl).then((resp) => resp.json());

			if (contentJson.error == null && !!Array.isArray(contentJson.data) && contentJson.data.length > 0) {
				this.processLoadedBI(contentJson, QUERY);
			} else {
				// fetch failed
				this.sectionData = null;
				this.loadingDataFlag = "down"
			}
		},

		async queryApi(QUERY, TYPE, PARAMS) {
			let dataPoint = this.sectionConfig["data point"];
			let dataUrl = dataPoint.url;
		},

		async queryFile(FILE, TYPE, PARAMS) {
			let dataPoint = this.sectionConfig["data point"];
			let dataUrl = "https://hugeampkpncms.org/sites/default/files/users/user" + this.uId + "/" + FILE;
		},

		processLoadedBI(CONTENT, QUERY) {

			let data = CONTENT.data;
			let dataPoint = this.sectionConfig["data point"];

			// if loaded data is processed
			let tableFormat = this.sectionConfig["table format"];

			if (!!tableFormat && !!tableFormat["data convert"]) {
				let convertConfig = tableFormat["data convert"];
				data = this.utils.dataConvert.convertData(convertConfig, data, this.phenotypeMap); /// convert raw data
			}

			let cumulateData = (!!dataPoint["cumulate data"] && dataPoint["cumulate data"] == "true") ? true : null;

			let isOriginalDataEmpty = (!this.originalData || (!!this.originalData.length && this.originalData.length == 0)) ?
				true : null;

				console.log("isOriginalDataEmpty", isOriginalDataEmpty);

			if (!!cumulateData) {

				if (CONTENT.page == 1) {
					this.sectionData = !!isOriginalDataEmpty ? data : this.sectionData.concat(data);
				} else {
					this.sectionData = this.sectionData.concat(data);
				}

				if (!!CONTENT.continuation) {
					this.queryBiContinue(CONTENT.continuation, QUERY);
				} else {
					let paramsString = this.getParamString();

					console.log("paramsString 2", paramsString);

					if (paramsString == "invalid") {
						this.loadingDataFlag = "down"
						this.completeDataLoad(QUERY);
					} else {
						this.originalData = this.sectionData;
						this.queryBioindex(paramsString,)
					}
				}
			} else {
				if (CONTENT.page == 1) {
					this.sectionData = data;
				} else {
					this.sectionData = this.sectionData.concat(data);
				}

				if (!!CONTENT.continuation) {
					this.queryBiContinue(CONTENT.continuation, QUERY);
				} else {
					this.loadingDataFlag = "down"
					this.completeDataLoad(QUERY);
				}
			}
		},

		processLoadedApi(CONTENT) {

			console.log(CONTENT)
		},

		processLoadedFile(CONTENT) {

			console.log(CONTENT)
		},

		completeDataLoad(QUERY) {
			//Apply pre-filters
			if (this.sectionData != null && !!this.sectionConfig["pre filters"]) {
				let filters = this.sectionConfig["pre filters"];
				let filterValues = {}

				filters.map(filter => {
					filterValues[filter.parameter] = this.utils.keyParams[filter.parameter]
				})

				this.sectionData = this.utils.filterUtils.applyFilters(filters, this.sectionData, filterValues);
			}

			if (this.sectionData != null && !!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["initial sort by"]) {
				let sortBy = this.sectionConfig["table format"]["initial sort by"]
				let isNumeric = this.checkIfNumeric(this.sectionData, sortBy.field);
				/* implement sort direction */
				this.sectionData = this.utils.sortUtils.sortEGLTableData(this.sectionData, sortBy.field, isNumeric, true);
			}

			if (this.sectionData != null && !!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["group by"]) {
				let groups = (!!this.groups) ? [...new Set(this.groups.map(g => g.label))] : [];
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
						this.groups = (!!this.groups) ? this.groups : [];
						this.groups.push({ "label": group, "params": QUERY });
					}
				})
			}
			this.originalData = this.sectionData;
		}

	},
});

$(function () { });
</script>
<style>
.multi-section {
	border-bottom: solid 1px #ddd;
	position: relative;
}

button.show-hide-section,
button.capture-data {
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
