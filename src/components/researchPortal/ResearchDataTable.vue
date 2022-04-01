<template>
	<div class="research-data-table-wrapper">
		<div v-html="tableLegend" class="data-table-legend"></div>
		<div
			v-if="!!dataset"
			v-html="'Total rows: ' + this.rows"
			class="table-total-rows"
		></div>
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
		<div class="table-ui-wrapper">
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
				v-if="dataComparisonConfig == null"
				class="convert-2-csv btn-sm"
				@click="convertJson2Csv(filteredData, pageID + '_filtered')"
			>
				Save as CSV
			</div>
			<div
				class="convert-2-csv btn-sm"
				@click="saveJson(filteredData, pageID + '_filtered')"
			>
				Save as JSON
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
					<th
						v-for="(value, index) in topRows"
						:key="index"
						v-html="value"
						@click="applySorting(value)"
						:class="'sortable-th ' + value"
					></th>
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
						v-if="topRows.includes(tdKey)"
					>
						<td
							v-if="ifDataObject(tdValue) == false"
							:key="tdKey"
							v-html="formatValue(tdValue, tdKey)"
						></td>
						<td
							v-if="ifDataObject(tdValue) == true"
							:key="tdKey"
							class="multi-value-td"
						>
							<span
								v-for="(sValue, sKey, sIndex) in tdValue"
								:class="
									sKey +
									' reference bg-color-' +
									getColorIndex(sKey)
								"
								v-html="formatValue(sValue, tdKey)"
								:key="sKey"
							></span>
						</td>
					</template>
					<td v-if="tableFormat['features'] != undefined">
						<span
							href="javascript:;"
							@click="showHideFeature('feature_' + index)"
							class="show-evidence-btn btn"
							>View</span
						>
					</td>
				</tr>
				<tr
					v-if="!!tableFormat['features']"
					:id="'feature_' + index"
					:class="'hidden'"
				>
					<td :colspan="topRowNumber" class="features-td">
						<research-data-table-features
							:featuresData="value.features"
							:featuresFormat="tableFormat"
						></research-data-table-features>
					</td>
				</tr>
			</tbody>
		</table>
		<b-container
			v-if="
				!!perPageNumber && perPageNumber != null && perPageNumber != 0
			"
			class="egl-table-page-ui-wrapper"
		>
			<b-pagination
				class="pagination-sm justify-content-center"
				v-model="currentPage"
				:total-rows="rows"
				:per-page="perPageNumber"
			></b-pagination>
		</b-container>
	</div>
</template>

<script>
import Vue from "vue";
import ResearchDataTableFeatures from "@/components/researchPortal/ResearchDataTableFeatures.vue";

import Formatters from "@/utils/formatters";

import uiUtils from "@/utils/uiUtils";
import sortUtils from "@/utils/sortUtils";

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
	components: { ResearchDataTableFeatures },
	created() {},
	beforeMount() {},

	mounted() {
		this.perPageNumber = this.initPerPageNumber;
	},
	updated() {},
	computed: {
		filteredData() {
			return this.$store.state.filteredData;
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
					if (
						columnFormatting[column].type.includes(
							"render background percent"
						)
					) {
						scores[column] = { high: null, low: null };
					}
				}

				this.dataset.map((row) => {
					for (const field in scores) {
						let fieldValue =
							typeof row[field] != "number"
								? columnFormatting[field]["percent if empty"]
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

				return scores;
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
		rawData() {
			let rawData = this.dataset;

			let formattedData = [];

			if (this.dataComparisonConfig == null) {
				rawData.map((d) => {
					let tempObj = {};

					this.tableFormat["top rows"].map((t) => {
						tempObj[t] = d[t];
					});

					if (this.tableFormat["features"] != undefined) {
						tempObj["features"] = {};
						this.tableFormat["features"].map((f) => {
							tempObj["features"][f] = [];

							let fTempObj = {};
							this.tableFormat[f].map((fItem) => {
								fTempObj[fItem] = d[fItem];
							});

							tempObj["features"][f].push(fTempObj);
						});
					}
					formattedData.push(tempObj);
				});
			} else {
				for (const [key, value] of Object.entries(rawData)) {
					let tempObj = {};

					this.tableFormat["top rows"].map((t) => {
						tempObj[t] = value[t];
					});

					if (this.tableFormat["features"] != undefined) {
						tempObj["features"] = {};
						this.tableFormat["features"].map((f) => {
							tempObj["features"][f] = [];

							let fTempObj = {};
							this.tableFormat[f].map((fItem) => {
								fTempObj[fItem] = value[fItem];
							});

							tempObj["features"][f].push(fTempObj);
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

				//let filtered = this.dataset;
				let paged = [];
				let perPage =
					Number(this.perPageNumber) != 0
						? Number(this.perPageNumber)
						: formattedData.length;

				let startIndex = (this.currentPage - 1) * perPage;
				let endIndex =
					this.rows - this.currentPage * perPage > perPage
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
		},
	},
	methods: {
		...Formatters,
		addStar(ITEM) {
			let value = ITEM[this.tableFormat["star column"]];
			this.$store.dispatch("pkgDataSelected", {
				type: this.tableFormat["star column"],
				id: value,
				action: "add",
			});
			//console.log("pkgDataSelected", this.pkgDataSelected);
		},
		removeStar(ITEM) {
			let value = ITEM[this.tableFormat["star column"]];
			this.$store.dispatch("pkgDataSelected", {
				type: this.tableFormat["star column"],
				id: value,
				action: "remove",
			});

			//console.log("pkgDataSelected", this.pkgDataSelected);
		},
		checkStared(WHERE, ITEM) {
			//console.log("WHERE", WHERE, ITEM);
			if (!!ITEM) {
				let selectedItems = this.pkgDataSelected
					.filter((s) => s.type == this.tableFormat["star column"])
					.map((s) => s.id);

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
			uiUtils.showHideElement(ELEMENT);
		},
		convertJson2Csv(DATA, FILENAME) {
			uiUtils.convertJson2Csv(DATA, FILENAME);
		},
		saveJson(DATA, FILENAME) {
			uiUtils.saveJson(DATA, FILENAME);
		},
		formatValue(tdValue, tdKey) {
			if (
				this.tableFormat["column formatting"] != undefined &&
				this.tableFormat["column formatting"][tdKey] != undefined
			) {
				let formatTypes =
					this.tableFormat["column formatting"][tdKey]["type"];

				let linkToNewTab = !!this.tableFormat["column formatting"][
					tdKey
				]["new tab"]
					? this.tableFormat["column formatting"][tdKey]["new tab"]
					: null;

				let cellValue = tdValue;

				formatTypes.map((type) => {
					if (type == "scientific notation") {
						cellValue = Formatters.pValueFormatter(tdValue);

						cellValue = cellValue == "-" ? 0 : cellValue;
					}

					if (type == "link") {
						let linkString =
							"<a href='" +
							this.tableFormat["column formatting"][tdKey][
								"link to"
							] +
							cellValue;

						linkString +=
							!!this.tableFormat["column formatting"][tdKey][
								"link type"
							] &&
							this.tableFormat["column formatting"][tdKey][
								"link type"
							] == "button"
								? "' class='btn btn-sm btn-outline-secondary link-button"
								: "";

						let linkLabel = !!this.tableFormat["column formatting"][
							tdKey
						]["link label"]
							? this.tableFormat["column formatting"][tdKey][
									"link label"
							  ]
							: cellValue;

						linkString +=
							linkToNewTab == "true"
								? "' target='_blank'>" + linkLabel + "</a>"
								: "'>" + linkLabel + "</a>";

						cellValue = linkString;
					}

					if (type == "render background percent") {
						let fieldValue =
							typeof tdValue != "number"
								? this.tableFormat["column formatting"][tdKey][
										"percent if empty"
								  ]
								: tdValue;

						let weight = Math.floor(
							((Number(fieldValue) - this.dataScores[tdKey].low) /
								(this.dataScores[tdKey].high -
									this.dataScores[tdKey].low)) *
								100
						);

						let weightClasses = "cell-weight-" + weight + " ";

						weightClasses +=
							tdValue < 0 ? "weight-negative" : "weight-positive";

						cellValue =
							"<span class='" +
							weightClasses +
							"'>" +
							cellValue +
							"</span>";
					}
				});

				return cellValue;
			} else {
				return tdValue;
			}
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
							if (SORT_DIRECTION == false) {
								tempObj[iKey] = Math.min(...arr);
							} else {
								tempObj[iKey] = Math.max(...arr);
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
		applySorting(key) {
			let sortDirection = this.sortDirection == "asc" ? false : true;
			this.sortDirection = this.sortDirection == "asc" ? "desc" : "asc";
			if (key != this.tableFormat["locus field"]) {
				let filtered =
					this.dataComparisonConfig == null
						? this.dataset
						: this.object2Array(this.dataset, key, sortDirection);

				let keyData = filtered[0][key];
				let isNumeric = typeof keyData != "number" ? false : true;

				sortUtils.sortEGLTableData(
					filtered,
					key,
					isNumeric,
					sortDirection
				);
				let returnData =
					this.dataComparisonConfig == null
						? filtered
						: this.array2Object(filtered, this.dataset, key);
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

				sortUtils.sortEGLTableData(filtered, "bp", true, sortDirection);
				sortUtils.sortEGLTableData(
					filtered,
					"chr",
					true,
					sortDirection
				);
				this.$store.dispatch("filteredData", filtered);
			}
		},
	},
});
</script>

<style>
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
	margin-bottom: -15px;
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

.research-data-table td.multi-value-td span {
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
</style>
