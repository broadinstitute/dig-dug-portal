<template>
	<!--<div class="multi-section" :class="'wrapper-' + sectionIndex"
		:style="!!sectionData || sectionsConfig['section type'] == 'primary' ? '' : 'display:none;'">-->


	<div class="multi-section" :class="'wrapper-' + sectionIndex" >


		<div class="row" v-if="!isInTab">
			<div class="col-md-12">
				<button class="btn btn-sm show-evidence-btn capture-data" @click="captureData()"
					title="Capture data in section"><b-icon icon="camera"></b-icon></button>
				<button class="btn btn-sm show-evidence-btn show-hide-section"
					@click="utils.uiUtils.showHideElement('section_' + sectionID)" title="Show / hide section"><b-icon
						icon="eye"></b-icon></button>
				<h4>{{ sectionsConfig.header }}
				</h4>
			</div>
		</div>
		<div>
			<div v-for="(section,sIndex) in sectionsConfig.sections['sub sections']" class="summary-filter-wrapper">
				<input type="checkbox" :id="'filter_'+ sectionID+'_'+section.section" class="summary-filter-chkbox" :value="section.section"
				@change="buildSummary()" checked/>
				<label :for="section.section">{{ section.label}}</label>
			</div>
		</div>
		
		<div class="row card-body" :id="'section_' + sectionID">
			<div class="col-md-12" :class="'wrapper-' + sectionIndex">
				<research-data-table 
					v-if="!!sectionData"
					:pageID="sectionIndex"
					:dataset="sectionData"
					:tableFormat="tableFormat"
					:initPerPageNumber="10"
					:tableLegend="null" 
					:dataComparisonConfig="null" 
					:searchParameters="null" 
					:pkgData="null" 
					:pkgDataSelected="null" 
					:phenotypeMap="null" 
					:sectionId="sectionsConfig['section id']"
					:multiSectionPage="true" 
					:starItems="starItems"
					:utils="utils" 
					@clicked-sort="sortData"
					@on-star="starColumn"
					:region="regionParam"
					:regionZoom="regionZoom"
					:regionViewArea="regionViewArea"
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

export default Vue.component("research-sections-summary", {
	props: ["sectionIndex","uId", "sectionsConfig", "sectionsData","utils","starItems", "regionZoom",
		"regionViewArea","isInTab"],
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
			loadingDataFlag: "down",
			regionParam: null,
			
		};
	},
	modules: {
	},
	created() {
		this.$root.$refs[this.sectionsConfig["section id"]] = this;

	},
	mounted() {
	},
	computed: {
		sectionID() {
			return this.sectionsConfig["section id"];
		},
		

		wholeDataCounts() {
			let rowsTotalNum = 0;
			let sections = [this.sectionsConfig.sections["primary section"]];
			let subSections = this.sectionsConfig.sections["sub sections"];

			subSections.map(sub=>{
				sections.push(sub.section);
			})
			this.sectionsData.map(data => {
				if(!!sections.includes(data.id)){
					rowsTotalNum += (!!data.data)?data.data.length:0;
				}
			})
			return rowsTotalNum > 0? rowsTotalNum : null;
		}
	},
	watch: {
		wholeDataCounts(NUM) {
			this.buildSummary();
		}
	},
	methods: {
		buildSummary() {

			let primarySection = [...new Set(this.sectionsData.filter(data => data.id == this.sectionsConfig.sections["primary section"]))];
			this.tableFormat = !!primarySection[0] ? JSON.parse(JSON.stringify(primarySection[0].config['table format'])) : null;
			let primaryData = !!primarySection[0] ? primarySection[0].data : null;
			let subSections = this.sectionsConfig.sections["sub sections"];

			let targetData = JSON.parse(JSON.stringify(primaryData));//Deep cloning is required.
			let filteredData = [];

			if (!!primaryData) {


				subSections.map((section, sIndex) => {

					let filterSection = this.sectionsData.filter(data => data.id == section.section)[0]

					let filterData = !!filterSection ? [...new Set(filterSection.data)] : null;


					if (!!filterData && filterData.length > 0) {
						section.actions.map(action => {
							switch (action.action) {
								case "filter":
									// filters data by each sub section data but, doesn't remove filtered out rows.
									filteredData[sIndex] = this.applyFilter(targetData, filterData, action["target field"], action["filter field"], action.type);
									break;
							}
						})

						section.actions.map(action => {
							switch (action.action) {

								case "add top columns":

									action.columns.map(column => {
										filteredData[sIndex] = this.addField(filteredData[sIndex], filterData, column["key field"], column.column, column["if multiple values"]);
										if (!!this.tableFormat) {
											this.tableFormat["top rows"].push(column.column);
										}
									})

									break;

								case "add features":

									this.tableFormat["features"] = !this.tableFormat["features"] ? [] : this.tableFormat["features"];

									this.tableFormat["features"].push(action.feature);

									this.tableFormat[action.feature] = action.columns;
									filteredData[sIndex] = this.addFeatureField(filteredData[sIndex], filterData, action["key field"], action.feature, action.columns, action["if multiple values"]);

									break;
							}
						})
					}
				})

				let collapsedData = [];
				let filterLogic = this.sectionsConfig.sections["inter sections filter logic"];


				if (filterLogic == 'and') {
					targetData.map(row => {
						let meetFilter = true;

						subSections.map((section, sIndex) => {
							let ifSectionChecked = document.getElementById('filter_' + this.sectionID + '_' + section.section).checked
							if (!!filteredData[sIndex] && filteredData[sIndex].length > 0 && ifSectionChecked) {
								section.actions.map(action => {
									switch (action.action) {
										case "add top columns":
											action.columns.map(column => {
												if (!row[column.column] || row[column.column] == "") { meetFilter = false }
											})
											break;
									}
								})
							}
						})
						if (meetFilter == true) {
							collapsedData.push(row);
						}

					});
				}

				/*targetData.map(row => {
					
					let meetFilter = filterLogic == "and"? true: false;

					subSections.map((section, sIndex) => {
						if(!!filteredData[sIndex] && filteredData[sIndex].length > 0) {
							section.actions.map(action => {
								switch (action.action) {
									case "add top columns":
										action.columns.map(column => {
											if (filterLogic == "or" && row[column.column]) { meetFilter = true }
											else if (filterLogic == "and" && !row[column.column]) { meetFilter = false }
										})
										break;
								}
							})
						}
						
						if (meetFilter == true) {
							collapsedData.push(row);
						}
					})
				})*/

				this.sectionData = collapsedData;
			}
		},
		addFeatureField(TG_DATA, FTL_DATA, KEY_FIELD, FEATURE, COLUMNS, IF_MULTIPLE) {
			let filterDataObj = {};

			let fdIndex = 0;
			FTL_DATA.map(FD => {
				filterDataObj[FD[KEY_FIELD]] = !filterDataObj[FD[KEY_FIELD]]? []: filterDataObj[FD[KEY_FIELD]];
				filterDataObj[FD[KEY_FIELD]].push(fdIndex);
				fdIndex ++;
			})

			TG_DATA.map(TD => {
				TD[FEATURE] = [];
				if(!!filterDataObj[TD[KEY_FIELD]]) {
					filterDataObj[TD[KEY_FIELD]].map(num => {
						let tempObj = {};

						COLUMNS.map(column => {
							tempObj[column] = FTL_DATA[num][column];
						})

						switch (IF_MULTIPLE) //add, replace, pick greater, pick lower
						{
							case "add":
								TD[FEATURE].push(tempObj);
								break;
							case "replace":
								TD[FEATURE] = [tempObj];
								break;
							case "pick greater":
								break;
							case "pick lower":
								break;
						}

					});
				}
				
			})
			return TG_DATA;
		},
		addField(TG_DATA, FTL_DATA, KEY_FIELD, COLUMN, IF_MULTIPLE){
			let filterDataObj = {};
			
			FTL_DATA.map((FD,fdIndex) => {
				filterDataObj[FD[KEY_FIELD]] = !filterDataObj[FD[KEY_FIELD]] ? [] : filterDataObj[FD[KEY_FIELD]];
				filterDataObj[FD[KEY_FIELD]].push(fdIndex);
			})

			TG_DATA.map(TD => {

				if(!!filterDataObj[TD[KEY_FIELD]]) {
					filterDataObj[TD[KEY_FIELD]].map(fdIndex => {

						let colValue = !!FTL_DATA[fdIndex][COLUMN]? FTL_DATA[fdIndex][COLUMN]: null;

						if(!!colValue) {
							switch (IF_MULTIPLE) //add, replace, pick greater, pick lower
							{
								case "add":
									if(!TD[COLUMN]) { TD[COLUMN] = [] };
									TD[COLUMN].push(colValue);

									break;
								case "replace":
									TD[COLUMN] = colValue;
									break;
								case "pick greater":
									colValue = !TD[COLUMN] ? colValue :
										TD[COLUMN] >= colValue ? TD[COLUMN] : colValue;

									TD[COLUMN] = colValue;
									break;
								case "pick lower":
									colValue = !TD[COLUMN] ? colValue :
										TD[COLUMN] <= colValue ? TD[COLUMN] : colValue;

									TD[COLUMN] = colValue;
									break;
							}
						}
						
					})
				}
				
			})

			TG_DATA.map(TD => {
				if (!!TD[COLUMN] && typeof TD[COLUMN] == "object") {
					TD[COLUMN] = [...new Set(TD[COLUMN])].sort().toString();
				}
			})
			return TG_DATA;
		},
		applyFilter(targetData,filterData,targetField,filterField,TYPE){

			let returnData = [];
			let filterFieldArr;
			switch (TYPE) {
				case "search":
					
					filterFieldArr = [...new Set(filterData.map(d=>d[filterField]))];

					targetData.map(d=>{
						if(!!filterFieldArr.includes(d[targetField])) {
							if(!d[filterField]) {
								d[filterField] = d[targetField];
							}
							returnData.push(d);
						}
					})
					break;

				case "search and":

					filterFieldArr = [...new Set(filterData.map(d => d[filterField]))];

					targetData.map(d => {
						filterFieldArr.map(ff =>{
							let ffSplit = ff.split(",");
							if(d[targetField] >= ffSplit[0] && d[targetField] <= ffSplit[1]) {
								if (!d[filterField]) {
									d[filterField] = ff;
								}
								returnData.push(d);
							}
						})
					})
					
					break;
			}

			return returnData;
		},
		//work on this
		jsonToTsv(jsonObject) {
			// Extract keys and values
			const keys = Object.keys(jsonObject[0]);
			const values = Object.values(jsonObject);

			// Create header row
			let tsvString = `${keys.join("\t")}\n`;

			// Convert each value to string and join with tabs
			values.forEach((value) => {
				// Check for nested objects and arrays
				if (typeof value === "object") {
					tsvString += `${JSON.stringify(value)}\n`;
				} else if (Array.isArray(value)) {
					tsvString += `${value.join("\t")}\n`;
				} else {
					tsvString += `${value}\n`;
				}
			});

			return tsvString;
		},
		captureData() {
			let title = [this.sectionsConfig.header];
			//let tsvData = this.jsonToTsv(this.sectionData);

			//console.log("tsvData:", tsvData);

			this.$store.dispatch("capturedData", { action: 'add', title: title, data: this.sectionData });
		},
		starColumn(ARRAY) {
			this.$emit('on-star', ARRAY);
		},
		getData() {
			//console.log("data getting updated");
		},
		sortData(KEY) {
			console.log("KEY",KEY);
			console.log("this.tableFormat", this.tableFormat);
			console.log("this.sectionData", this.sectionData);
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
	},
});

$(function () { });
</script>
<style>
.summary-filter-wrapper {
	display: inline-block;
}

.summary-filter-chkbox {
	margin-right: 5px; 
	margin-left: 10px;
}

.multi-section {
	/*border-bottom: solid 1px #ddd;*/
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
