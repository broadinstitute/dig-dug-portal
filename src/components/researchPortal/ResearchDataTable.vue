<template>
	<div class="research-data-table-wrapper" :class="(!!tableFormat.display && tableFormat.display == 'false') ? 'hidden' : ''">
		<div v-html="tableLegend" class="data-table-legend"></div>
		<div
			v-if="
				!!searchParameters &&
				dataComparisonConfig != null &&
				compareGroups.length > 1
			"
			class="table-total-rows"
		>
			<span
				v-for="(item, itemIndex) in compareGroups"
				v-html="item"
				:key="item"
				:class="'group-item-bubble reference bg-color-' + itemIndex"
			></span>
		</div>
		<research-summary-plot
			v-if="
				!!tableFormat['summary plot'] &&
				tableFormat['summary plot']['plots'].includes('table')
			"
			v-bind:summaryPlot="tableFormat['summary plot']"
			v-bind:rawData="dataset"
			v-bind:isPlotByRow="false"
		>
		</research-summary-plot>
		<div
			v-if="!!dataset"
			v-html="'Total rows: ' + this.rows"
			class="table-total-rows"
		></div>
		<div v-if="!!dataset" class="table-ui-wrapper">
			<label
				>Rows per page:
				<select v-model="perPageNumber" class="number-per-page">
					<option value="10">10</option>
					<option value="20">20</option>
					<option value="40">40</option>
					<option value="100">100</option>
					<option value="0">
						<span style="color: #f00">All</span>
					</option>
				</select>
			</label>
			<div
				class="convert-2-csv btn-sm"
				@click="convertJson2Csv(filteredData, pageID + sectionId+ '_filtered')"
			>
				Save as CSV
			</div>
			<div
				class="convert-2-csv btn-sm"
				@click="saveJson(filteredData, pageID + sectionId + '_filtered')"
			>
				Save as JSON
			</div>
			<div
				class="convert-2-csv btn-sm"
				@click="showHidePanel('#showHideColumnsBox' + sectionId)"
			>
				show/hide columns
			</div>
			<div v-if="!!tableFormat" :id="'showHideColumnsBox'+sectionId" class="hidden">
				<div
					class="show-hide-columns-box-close"
					@click="showHidePanel('#showHideColumnsBox'+sectionId)"
				>
					<b-icon icon="x-circle-fill"></b-icon>
				</div>
				<h4 style="text-align: center">Show/hide columns</h4>
				<p></p>
				<div class="table-wrapper">
					<table class="table table-sm">
						<thead>
							<tr>
								<th></th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="column in tableFormat['top rows']"
								:key="column"
							>
								<td>
									<input
										type="checkbox"
										name="visible_top_rows"
										:id="getColumnId(column)"
										:value="column"
										checked
										@click="addRemoveColumn($event)"
									/>
									{{ " " + column }}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
		<table
			:class="'table table-sm research-data-table ' + pageID"
			cellpadding="0"
			cellspacing="0"
			v-if="!!dataset && !!tableFormat"
		>
			<thead class="">
				<tr>
					<th v-if="!!tableFormat['star column']">
						<b-icon
							:icon="!!stared ? 'star-fill' : 'star'"
							style="color: #ffcc00; cursor: pointer"
							@click="showHideStared()"
						></b-icon>
					</th>
					<template v-for="(value, index) in topRows">
						<th
							v-if="getIfChecked(value) == true"
							:key="index"
							@click="!!multiSectionPage?callFilter(value):applySorting(value)"
							class="byor-tooltip"
							:class="
								'sortable-th ' +
								value +
								' ' +
								getColumnId(value)
							"
						>
							<span v-html="value"></span>
							<span
								v-if="
									!!tableFormat['tool tips'] &&
									!!tableFormat['tool tips'][value]
								"
								class="tooltiptext"
								v-html="tableFormat['tool tips'][value]"
							></span>
						</th>
					</template>
					<th
						class="th-evidence"
						v-if="tableFormat['features'] != undefined"
					>
						Evidence
					</th>
				</tr>
			</thead>

			<tbody v-for="(value, index) in pagedData" :key="index" class="">
				<tr>
					<td v-if="!!tableFormat['star column']">
						<span v-if="checkStared('1', value) == false"
							><b-icon
								icon="star"
								style="color: #aaaaaa; cursor: pointer"
								@click="addStar(value)"
							></b-icon
						></span>
						<span v-if="checkStared('2', value) == true"
							><b-icon
								icon="star-fill"
								style="color: #ffcc00; cursor: pointer"
								@click="removeStar(value)"
							></b-icon
						></span>
					</td>
					<template
						v-for="(tdValue, tdKey) in value"
						v-if="
							topRows.includes(tdKey) &&
							getIfChecked(tdKey) == true
						"
					>
						<td
								v-if="ifDataObject(tdValue) == false"
								:key="tdKey"
								:class="getColumnId(tdKey)"
							>
							<span v-if="!!ifSetParameterColumn(tdKey)" class="set-parameter-options"> {{ tdValue }}
								<span class="btns-wrapper">
									<button v-for="section in getParameterTargets(tdKey)" class="btn btn-sm show-evidence-btn set-search-btn" 
										v-html="section.label" @click="setParameter(tdValue, tdKey, section.section)" ></button>
								</span>
								
							</span>
							
							<span v-else v-html="formatValue(tdValue, tdKey)"></span>
						</td>
						<td
							v-if="
								ifDataObject(tdValue) == true
							"
							:key="tdKey"
							class="multi-value-td"
							:class="getColumnId(tdKey)"
						>
							<span
								v-for="(sValue, sKey, sIndex) in tdValue"
								:class="
									sKey +
									' reference bg-color-' +
									getColorIndex(sKey)
								"
								:key="sKey"
							>

								<span v-if="!!ifSetParameterColumn(tdKey)" class="set-parameter-options"> {{ sValue }}
									<span class="btns-wrapper">
										<button v-for="section in getParameterTargets(tdKey)" class="btn btn-sm show-evidence-btn set-search-btn" 
											v-html="section.label" @click="setParameter(sValue, tdKey, section.section)" ></button>
									</span>
								</span>
								<span v-else v-html="formatValue(sValue, tdKey)"></span></span>
						</td>
					</template>
					<td v-if="tableFormat['features'] != undefined">
						<span
							href="javascript:;"
							@click="showHideFeature('feature_' + sectionId + index)"
							class="show-evidence-btn btn"
							>View</span
						>
					</td>
				</tr>
				<tr
					v-if="!!tableFormat['features']"
					:id="'feature_' + sectionId + index"
					:class="'hidden'"
				>
					<td :colspan="topRowNumber" class="features-td">
						<research-data-table-features
							:featuresData="value.features"
							:featuresFormat="tableFormat"
							:utils="utils"
						></research-data-table-features>
					</td>
				</tr>
			</tbody>
		</table>
		<b-container
			v-if="
				!!dataset && !!perPageNumber && perPageNumber != null && perPageNumber != 0
			"
			class="egl-table-page-ui-wrapper"
		>
			<b-pagination
				class="pagination-sm justify-content-center"
				v-model="currentPage"
				:total-rows="rows"
				:per-page="perPageNumber"
				:phenotypeMap="phenotypeMap"
			></b-pagination>
		</b-container>
	</div>
</template>

<script>
import Vue from "vue";
import ResearchDataTableFeatures from "@/components/researchPortal/ResearchDataTableFeatures.vue";
import ResearchSummaryPlot from "@/components/researchPortal/ResearchSummaryPlot.vue";

export default Vue.component("research-data-table", {
	props: [
		"pageID",
		"dataset",
		"tableFormat",
		"initPerPageNumber",
		"tableLegend",
		"dataComparisonConfig",
		"searchParameters",
		"pkgData",
		"pkgDataSelected",
		"phenotypeMap",
		"multiSectionPage",
		"starItems",
		"sectionId",
		"utils",
		"region",
		"regionZoom",
		"regionViewArea"
	],
	data() {
		return {
			currentPage: 1,
			perPageNumber: null,
			compareGroups: [],
			stared: false,
		};
	},
	modules: {},
	components: { ResearchDataTableFeatures, ResearchSummaryPlot },
	created() {},
	beforeMount() {},

	mounted() {
		this.perPageNumber = this.initPerPageNumber;
		//console.log(this.dataset);
	},
	updated() {},
	computed: {
		filteredData() {
			if(!!this.multiSectionPage){
				return this.dataset;
			} else {
				return this.$store.state.filteredData;
			}
			
		},
		dataScores() {
			if (
				!!this.dataset &&
				!!this.tableFormat &&
				this.tableFormat["column formatting"] != undefined
			) {
				let scores = {};
				let columnFormatting = this.tableFormat["column formatting"];

				for (const column in columnFormatting) {
					let isRequired = null;
					if (
						columnFormatting[column].type.includes(
							"render background percent"
						) ||
						columnFormatting[column].type.includes(
							"render background percent negative"
						)
					) {
						isRequired = true;
					}

					if (!!isRequired) {
						for (const column in columnFormatting) {
							scores[column] = { high: null, low: null };
						}

						this.dataset.map((row) => {
							for (const field in scores) {
								let fieldValue =
									typeof row[field] != "number"
										? columnFormatting[field][
												"percent if empty"
										  ]
										: row[field];
								scores[field].high =
									scores[field].high == null
										? fieldValue
										: scores[field].high < fieldValue
										? fieldValue
										: scores[field].high;

								scores[field].low =
									scores[field].low == null
										? fieldValue
										: scores[field].low > fieldValue
										? fieldValue
										: scores[field].low;
							}
						});

						//return scores;
					}
				}

				if (Object.keys(scores).length > 0) {
					return scores;
				} else {
					return null;
				}
			} else {
				return null;
			}
		},
		rows() {
			if (!!this.dataset) {
				if (this.dataComparisonConfig == null) {
					return this.rawData.length;
				} else {
					return Object.keys(this.rawData).length;
				}
			}
		},
		viewingRegion() {
			if (this.region == null) {
				return null;
			} else {
				let returnObj = {};

				returnObj["chr"] = parseInt(this.region.split(":")[0], 10);

				let regionArr = this.region.split(":")[1].split("-");
				let chr = this.region.split(":")[0];
				let start = parseInt(regionArr[0], 10);
				let end = parseInt(regionArr[1], 10);
				let distance = end - start;
				if (this.regionZoom > 0) {
					let zoomNum = Math.round(
						distance * (this.regionZoom / 200)
					);
					let viewPointShift = Math.round(
						zoomNum * (this.regionViewArea / 100)
					);
					returnObj["chr"] = chr;
					returnObj["start"] = start + zoomNum + viewPointShift;
					returnObj["end"] = end - zoomNum + viewPointShift;
				} else if (this.regionZoom == 0) {
					returnObj["chr"] = chr;
					returnObj["start"] = start;
					returnObj["end"] = end;
				}

				return returnObj;
			}
		},
		rawData() {

			let posField = !!this.tableFormat["data zoom"]? this.tableFormat["data zoom"].position:null;
			let startPos = !!this.viewingRegion? this.viewingRegion.start:null;
			let endPos = !!this.viewingRegion ? this.viewingRegion.end:null;

			let formattedData = [];

			if (this.dataComparisonConfig == null) {

				let rawData = [...new Set(this.dataset)];

				if (!!this.tableFormat["data zoom"]) {
					rawData.filter(vValue => vValue[posField] < startPos || vValue[posField] > endPos);
				}

				rawData.map((d) => {
					let tempObj = {};
					
					this.tableFormat["top rows"].map((t) => {
						tempObj[t] = d[t];
					});

					if (this.tableFormat["features"] != undefined) {
						tempObj["features"] = {};

						this.tableFormat["features"].map((f) => {
							if (!!d[f]) {
								tempObj["features"][f] = d[f];
							} else {
								tempObj["features"][f] = [];

								let fTempObj = {};
								this.tableFormat[f].map((fItem) => {
									fTempObj[fItem] = d[fItem];
								});

								tempObj["features"][f].push(fTempObj);
							}
						});
					}
					formattedData.push(tempObj);
				});
			} else {

				let rawData = {...this.dataset};

				if (!!this.tableFormat["data zoom"]) {

					for (const [vKey, vValue] of Object.entries(rawData)) {
						if (
							vValue[posField] < startPos ||
							vValue[posField] > endPos
						) {
							delete rawData[vKey];
						}
					}
				}

				for (const [key, value] of Object.entries(rawData)) {
					let tempObj = {};

					this.tableFormat["top rows"].map((t) => {
						tempObj[t] = value[t];
					});

					if (this.tableFormat["features"] != undefined) {
						tempObj["features"] = {};
						this.tableFormat["features"].map((f) => {
							if (!!value[f]) {
								tempObj["features"][f] = value[f];
							} else {
								tempObj["features"][f] = [];

								let fTempObj = {};
								this.tableFormat[f].map((fItem) => {
									fTempObj[fItem] = value[fItem];
								});

								tempObj["features"][f].push(fTempObj);
							}
						});
					}
					formattedData.push(tempObj);
				}
			}

			if (this.stared == true) {
				let tempData = [];

				formattedData.map((r) => {
					if (this.checkStared("3", r) == true) {
						tempData.push(r);
					}
				});
				formattedData = tempData;
			} else {
				formattedData = formattedData;
			}

			return formattedData;
		},
		pagedData() {
			if (!!this.perPageNumber && this.perPageNumber != null) {
				let formattedData = this.rawData;

				let paged = [];
				let perPage =
					Number(this.perPageNumber) != 0
						? Number(this.perPageNumber)
						: formattedData.length;

				let startIndex = (this.currentPage - 1) * perPage;
				let endIndex =
					this.rows - this.currentPage * perPage > 0
						? this.currentPage * perPage
						: this.rows;

				for (let i = startIndex; i < endIndex; i++) {
					if (!!formattedData[i]) {
						paged.push(formattedData[i]);
					}
				}

				return paged;
			} else {
				let rawData = this.rawData;
				if (this.stared == true) {
					let tempData = [];

					rawData.map((r) => {
						if (this.checkStared("4", r) == true) {
							tempData.push(r);
						}
					});
					rawData = tempData;
				} else {
					rawData = rawData;
				}

				return rawData;
			}
		},
		topRows() {
			return this.tableFormat["top rows"];
		},
		topRowNumber() {
			let topRows =
				this.tableFormat["features"] != undefined
					? this.tableFormat["top rows"].length + 1
					: this.tableFormat["top rows"].length;

			topRows += !!this.tableFormat["star column"] ? 1 : 0;

			return topRows;
		},
	},
	watch: {
		dataset(DATA) {
			if (this.dataComparisonConfig != null) {
				this.compareGroups = [];
				let loopNum =
					this.searchParameters[
						this.dataComparisonConfig["fields group data key"][0]
					].search.length;

				for (let i = 0; i < loopNum; i++) {
					let groupString = "";
					this.dataComparisonConfig["fields group data key"].map(
						(gKey) => {
							groupString +=
								this.searchParameters[gKey].search[i] + " ";
						}
					);

					this.compareGroups.push(groupString.slice(0, -1));
				}
			}
		},
	},
	methods: {
		setParameter(VALUE,KEY,SECTION){

			let targetSections = SECTION == "all" || !SECTION ? this.tableFormat['column formatting'][KEY]['target sections'] : [SECTION];
			let parameter = [];

			targetSections.map(section => {
				this.tableFormat['column formatting'][KEY]['target sections'].map(tgSection => {
					if(tgSection.section == section) {
						parameter = parameter.concat(tgSection['parameter']);
					}
				})
				
			})

			if(typeof parameter === "object") {
				let values = VALUE.split(",");

				let vIndex = 0;
				parameter.map(p=>{
					document.getElementById("search_param_" + p).value = values[vIndex];
					this.$root.$refs.multiSectionSearch.updateSearch(p, targetSections);
					vIndex++;
				})

			} else {
				document.getElementById("search_param_" + parameter).value = VALUE;
				this.$root.$refs.multiSectionSearch.updateSearch(parameter, targetSections);
			}
		},
		ifSetParameterColumn(KEY){
			if(!!this.tableFormat['column formatting'] && !!this.tableFormat['column formatting'][KEY]
			 && !!this.tableFormat['column formatting'][KEY]['type'].includes('set parameter')) {
				return true;
			 } else {
				return null;
			 }
		},
		getParameterTargets(KEY) {
			return this.tableFormat['column formatting'][KEY]['target sections'];
		},
		showHidePanel(PANEL) {
			let wrapper = document.querySelector(PANEL);
			if (wrapper.classList.contains("hidden")) {
				wrapper.classList.remove("hidden");
			} else {
				wrapper.classList.add("hidden");
			}
		},
		getIfChecked(LABEL) {
			let id = this.getColumnId(LABEL);

			let content = !!document.querySelector("#" + id)
				? document.querySelector("#" + id).checked
				: true;
			return content;
		},
		getColumnId(LABEL) {
			return LABEL.replace(/\W/g, "").toLowerCase();
		},
		addRemoveColumn(EVENT) {
			this.$forceUpdate();
		},
		getColumns(ID) {
			let item;
			if (this.dataComparisonConfig != null) {
				for (const [key, value] of Object.entries(
					this.dataset
				)) {
					if (value[this.tableFormat["star column"]] == ID) {
						item = value;
					}
				}
			} else {
				item = this.dataset.filter(p => p[this.tableFormat["star column"]] == ID)[0];
			}
			return item;
		},
		addStar(ITEM) {
			let value = ITEM[this.tableFormat["star column"]];
			if (!!this.multiSectionPage) {
				
				let stard = [...new Set(this.starItems)]
				let tempObj = {
					type: this.tableFormat["star column"],
					id: value,
					columns: this.getColumns(value)
				}
				stard.push(tempObj);
				this.$emit('on-star', stard);
			} else {
				this.$store.dispatch("pkgDataSelected", {
					type: this.tableFormat["star column"],
					id: value,
					action: "add",
				});
			}
		},
		removeStar(ITEM) {
			let value = ITEM[this.tableFormat["star column"]];
			if (!!this.multiSectionPage) {
				let stard = [...new Set(this.starItems)].filter(s => s.id != value);
				this.$emit('on-star', stard);
			} else {
				this.$store.dispatch("pkgDataSelected", {
					type: this.tableFormat["star column"],
					id: value,
					action: "remove",
				});
			}
		},
		checkStared(WHERE, ITEM) {
			if (!!ITEM) {
				let selectedItems;

				if(!!this.multiSectionPage) {
					selectedItems = this.starItems
					.filter((s) => s.type == this.tableFormat["star column"])
					.map((s) => s.id);
				} else {
					selectedItems = this.pkgDataSelected
					.filter((s) => s.type == this.tableFormat["star column"])
					.map((s) => s.id);
				}
				
				let value = ITEM[this.tableFormat["star column"]];

				if (!!selectedItems.includes(value)) {
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		},
		showHideStared() {
			if (this.stared == false) {
				this.stared = true;
			} else {
				this.stared = false;
			}
		},
		getColorIndex(SKEY) {
			let colorIndex = "";
			let compareGroups = this.compareGroups;
			if (compareGroups.length > 1) {
				this.compareGroups.map((sValue, sIndex) => {
					if (SKEY == sValue) {
						colorIndex = sIndex;
					}
				});
			}

			return colorIndex;
		},
		ifDataObject(VALUE) {
			if (
				typeof VALUE === "object" &&
				VALUE !== null &&
				!Array.isArray(VALUE)
			) {
				return true;
			} else {
				return false;
			}
		},
		showHideFeature(ELEMENT) {
			this.utils.uiUtils.showHideElement(ELEMENT);
		},
		convertJson2Csv(DATA, FILENAME) {
			this.utils.uiUtils.saveByorCsv(DATA, FILENAME);
		},
		saveJson(DATA, FILENAME) {
			this.utils.uiUtils.saveJson(DATA, FILENAME);
		},
		formatValue(tdValue, tdKey) {
			let content;

			if (
				!!this.tableFormat &&
				!!this.tableFormat["column formatting"] &&
				!!this.tableFormat["column formatting"][tdKey]
			) {
				
				let types = this.tableFormat["column formatting"][tdKey].type;

				if (
					!!types.includes("render background percent") ||
					!!types.includes("render background percent negative")
				) {
					content = this.utils.Formatters.BYORColumnFormatter(
						tdValue,
						tdKey,
						this.tableFormat,
						null,
						this.dataScores
					);
				} else if (!!types.includes("kp phenotype link")) {
					content = this.utils.Formatters.BYORColumnFormatter(
						tdValue,
						tdKey,
						this.tableFormat,
						this.phenotypeMap,
						null
					);
				} else {
					content = this.utils.Formatters.BYORColumnFormatter(
						tdValue,
						tdKey,
						this.tableFormat,
						null,
						null
					);
				}
			} else {
				content = tdValue;
			}

			return content;
		},
		object2Array(DATASET, KEY, SORT_DIRECTION) {
			let arrayedObject = [];

			let firstItem = DATASET[Object.keys(DATASET)[0]];
			let isObjct = !!this.dataComparisonConfig[
				"fields to compare"
			].includes(KEY)
				? true
				: false;

			for (const [dKey, dValue] of Object.entries(DATASET)) {
				if (isObjct == true) {
					let tempObj = {};
					for (const [iKey, iValue] of Object.entries(dValue)) {
						if (iKey == KEY) {
							let arr = Object.values(iValue);
							if (arr.length == 1) {
								tempObj[iKey] = arr[0];
							} else {
								if (SORT_DIRECTION == false) {
									tempObj[iKey] = Math.min(...arr);
								} else {
									tempObj[iKey] = Math.max(...arr);
								}
							}
						} else {
							tempObj[iKey] = iValue;
						}
						arrayedObject.push(tempObj);
					}
				} else {
					arrayedObject.push(dValue);
				}
			}
			return arrayedObject;
		},
		array2Object(DATASET, RAW_DATASET, KEY) {
			let objectedArray = {};
			DATASET.map((d) => {
				let keyField = d[this.dataComparisonConfig["key field"]];
				objectedArray[keyField] = RAW_DATASET[keyField];
			});

			return objectedArray;
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
		callFilter(key){
			let sortDirection = this.sortDirection == "asc" ? false : true;
			this.sortDirection = this.sortDirection == "asc" ? "desc" : "asc";

			this.$emit('clicked-sort', {"key":key,"direction": sortDirection});
		},
		applySorting(key) {
			let sortDirection = this.sortDirection == "asc" ? false : true;
			this.sortDirection = this.sortDirection == "asc" ? "desc" : "asc";

			/*let filtered =
				this.dataComparisonConfig == null
					? this.dataset
					: this.object2Array(this.dataset, key, sortDirection);*/

			if (key != this.tableFormat["locus field"]) {
				let filtered =
					this.dataComparisonConfig == null
						? this.dataset
						: this.object2Array(this.dataset, key, sortDirection);

				// In case of the data with null values mixed, we separate it to with Values and W/O values.
				let filteredWValues = [];
				let filteredWNull = [];

				filtered.map((v) => {
					if (!!v[key] || v[key] === 0) {
						filteredWValues.push(v);
					} else {
						filteredWNull.push(v);
					}
				});

				let isNumeric = this.checkIfNumeric(filtered, key);
				//console.log("isNumeric",isNumeric)

				//sort the data with values, then merge the data WO values to the sorted.
				let sortedValues = this.utils.sortUtils
					.sortEGLTableData(
						filteredWValues,
						key,
						isNumeric,
						sortDirection
					)
					.concat(filteredWNull);

				let returnData =
					this.dataComparisonConfig == null
						? sortedValues
						: this.array2Object(sortedValues, this.dataset, key);

				
					this.$store.dispatch("filteredData", returnData);
				
			} else if (key == this.tableFormat["locus field"]) {
				let sortKey = this.tableFormat["locus field"];
				let filtered = this.dataset;

				filtered.map(function (g) {
					let locusArr = g[sortKey].split(":");
					let chrNum = locusArr[0].trim();
					let bpNum;
					if (!!locusArr[1]) {
						bpNum =
							locusArr[1].includes("-") == true
								? (Number(locusArr[1].split("-")[0].trim()) +
										Number(
											locusArr[1].split("-")[1].trim()
										)) /
								  2
								: Number(locusArr[1]);
					} else {
						bpNum = 0;
					}

					g["chr"] =
						chrNum != "X" && chrNum != "Y"
							? Number(chrNum)
							: chrNum == "X"
							? 23
							: 24;

					g["bp"] = bpNum;
				});

				this.utils.sortUtils.sortEGLTableData(filtered, "bp", true, sortDirection);
				this.utils.sortUtils.sortEGLTableData(
					filtered,
					"chr",
					true,
					sortDirection
				);

				
				if(!!this.multiSectionPage) {
					this.$emit('clicked-sort', filtered);
				} else {
					this.$store.dispatch("filteredData", filtered);
				}
			}
		},
	},
});
</script>

<style>
.show-hide-columns-box-close {
	position: absolute;
	top: 5px;
	right: 8px;
	font-size: 14px;
	color: #69f;
}

.show-hide-columns-box-close:hover {
	color: #36c;
}
/*#showHideColumnsBox {
	position: fixed;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	z-index: 11;
	font-size: 14px;
	width: 400px;
	height: 50%;
	text-align: left;
	top: 25%;
	left: calc(50% - 200px);
	box-shadow: 0px 5px 5px 5px rgb(0 0 0 / 20%);
	padding: 20px;
}

#showHideColumnsBox .table-wrapper {
	overflow: auto !important;
	padding: 0;
	height: calc(100% - 35px);
}

#showHideColumnsBox th,
#showHideColumnsBox td {
	border: none;
}*/
[id*="showHideColumnsBox"] {
	position: fixed;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	z-index: 11;
	font-size: 14px;
	width: 400px;
	height: 50%;
	text-align: left;
	top: 25%;
	left: calc(50% - 200px);
	box-shadow: 0px 5px 5px 5px rgb(0 0 0 / 20%);
	padding: 20px;
}

[id*="showHideColumnsBox"] .table-wrapper {
	overflow: auto !important;
	padding: 0;
	height: calc(100% - 35px);
}

[id*="showHideColumnsBox"] th,
[id*="showHideColumnsBox"] td {
	border: none;
}
.group-item-bubble {
	margin-left: 3px;
	margin-right: 3px;
	padding: 2px 8px;
	border-radius: 8px;
}
.table-total-rows {
	float: left;
	font-size: 12px;
	padding-top: 10px;
}
.data-table-legend {
	/*margin-bottom: -15px;*/
}
.research-data-table-wrapper {
	margin-top: 25px;
	font-size: 14px;
	line-height: 18px;
}

table.research-data-table {
	border-top: solid 1px #ddd;
	border-right: solid 1px #ddd;
	border-collapse: inherit;
	text-align: center;
	clear: both;
}

.research-data-table > thead > tr > th {
	background-color: #eeeeee;
	border: none !important;
	border-left: solid 1px #ddd !important;
	border-bottom: solid 2px #ccc !important;
	font-size: 13px;
}

.research-data-table > thead > tr > th.sortable-th {
	color: #007bff;
}

.research-data-table > thead > tr > th.sortable-th:hover {
	color: #004bcf;
	cursor: pointer;
}

.research-data-table td {
	border: none !important;
	border-left: solid 1px #eee !important;
	border-bottom: solid 1px #ddd !important;
	height: 27px;
	vertical-align: middle;
}

.research-data-table td.multi-value-td {
	padding: 0 !important;
}

.research-data-table td.multi-value-td > span {
	display: block;
	padding: 0.3rem;
	border-bottom: solid 1px #fff;
}

.research-data-table .features-td {
	padding: 0 !important;
}

.show-evidence-btn {
	display: block;
	background-color: #55aaee !important;
	border: solid 1px #3388cc;
	font-size: 10px !important;
	color: #ffffff;
	padding: 1px 10px !important;
	margin-right: 5px;
}

.show-evidence-btn:hover {
	background-color: #55aaee50 !important;
	color: #3388cc;
	cursor: pointer;
}

.table-ui-wrapper {
	text-align: right;
	font-size: 12px;
	float: right;
}

.convert-2-csv {
	border: solid 1px #aaa;
	background-color: #fff;
	padding: 3px 10px;
	border-radius: 15px;
	font-size: 12px;
	margin-right: 10px;
	display: inline-block;
}

.convert-2-csv:hover {
	cursor: pointer;
	background-color: #eee;
}

.number-per-page {
	font-size: 12px;
	padding: 4px 10px;
	border-radius: 15px;
	border: solid 1px #aaa;
	background-color: #fff;
	display: inline-block;
	margin-right: 10px;
}

.number-per-page:hover {
	cursor: pointer;
	background-color: #eee;
}

.set-parameter-options, .reference .set-parameter-options  {
	position: relative;
    background-color: #dddddd;
    padding: 1px 7px;
    border: solid 1px #cccccc;
    border-radius: 3px;
    font-size: 13px;
}

.set-parameter-options:hover, .reference .set-parameter-options:hover  {
    background-color: #333333;
    border: solid 1px #000000;
	color: #ffffff;
}

.set-parameter-options .btns-wrapper, .reference .set-parameter-options .btns-wrapper {
	display: none !important;
    position: absolute;
    background-color: #ffffff;
    padding: 5px 5px 2px 5px;
    top: 25%;
    left: 50%;
    text-align: left;
    width: auto;
    z-index: 100;
    border: solid 1px #dddddd;
    box-shadow: 5px 5px 5px #00000050;
}

.set-parameter-options:hover .btns-wrapper, .reference .set-parameter-options:hover .btns-wrapper {
 display: block !important;
}

.set-parameter-options .show-evidence-btn.set-search-btn, .reference .set-parameter-options .show-evidence-btn.set-search-btn {
    font-size: 13px !important;
    padding: 3px 7px !important;
    display: inline !important;
    margin-bottom: 3px;
	text-align: left;
	white-space: nowrap;
}

</style>
