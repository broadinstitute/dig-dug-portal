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
				searchParameters[dataComparisonConfig.fieldsGroupDataKey].search
					.length > 1
			"
			class="table-total-rows"
		>
			<span
				v-for="(item, itemIndex) in searchParameters[
					dataComparisonConfig.fieldsGroupDataKey
				].search"
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
				@click="saveJson(rawData, pageID + '_filtered')"
			>
				Save as JSON
			</div>
		</div>

		<table
			:class="'table table-sm research-data-table ' + pageID"
			cellpadding="0"
			cellspacing="0"
			v-if="!!dataset && !!newTableFormat"
		>
			<thead class="">
				<tr>
					<th
						v-for="(value, index) in topRows"
						:key="index"
						v-html="value"
						@click="applySorting(value)"
						:class="'sortable-th ' + value"
					></th>
					<th
						class="th-evidence"
						v-if="newTableFormat['features'] != undefined"
					>
						Evidence
					</th>
				</tr>
			</thead>

			<tbody v-for="(value, index) in pagedData" :key="index" class="">
				<tr>
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
								:style="
									'height:' +
									100 / Object.keys(tdValue).length +
									'%;'
								"
								v-html="formatValue(sValue, tdKey)"
								:key="sKey"
							></span>
						</td>
					</template>
					<td v-if="newTableFormat['features'] != undefined">
						<span
							href="javascript:;"
							@click="showHideFeature('feature_' + index)"
							class="show-evidence-btn btn"
							>View</span
						>
					</td>
				</tr>
				<tr
					v-if="newTableFormat['features'] != undefined"
					:id="'feature_' + index"
					:class="'hidden'"
				>
					<td :colspan="topRowNumber" class="features-td">
						<research-gem-table-features
							:featuresData="value.features"
							:featuresFormat="newTableFormat"
						></research-gem-table-features>
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
import ResearchGEMTableFeatures from "@/components/researchPortal/ResearchGEMTableFeatures.vue";

import Formatters from "@/utils/formatters";

import uiUtils from "@/utils/uiUtils";
import sortUtils from "@/utils/sortUtils";

export default Vue.component("research-gem-data-table", {
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
			newTableFormat: null,
			newRawData: null,
		};
	},
	modules: {},
	components: { ResearchGEMTableFeatures },
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
				!!this.rawData &&
				!!this.newTableFormat &&
				this.newTableFormat["column formatting"] != undefined
			) {
				let scores = {};
				let columnFormatting = this.newTableFormat["column formatting"];

				for (const column in columnFormatting) {
					if (
						columnFormatting[column].type.includes(
							"render background percent"
						)
					) {
						scores[column] = { high: null, low: null };
					}
				}

				this.rawData.map((row) => {
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
				//console.log("scores", scores);
				return scores;
			}
		},
		rows() {
			if (!!this.rawData) {
				if (this.dataComparisonConfig == null) {
					return this.rawData.length;
				} else {
					return Object.keys(this.rawData).length;
				}
			}
		},

		rawData() {
			var updatedData = {};
			var rawData = { ...this.dataset };
			var newTableFormat = { ...this.tableFormat };
			var newRows = [];
			var selectedBy = {};

			if (this.pkgDataSelected.length > 0) {
				newRows = [...new Set(this.pkgDataSelected.map((p) => p.type))];
				var oldRows = newTableFormat["top rows"];
				var newTopRows = oldRows.concat(newRows);
				newTableFormat["top rows"] = newTopRows;
				newTableFormat["features"] = ["Evidence"];
				newTableFormat["Evidence"] = [];
				this.pkgDataSelected.map((p) => {
					if (!selectedBy[p.type]) {
						selectedBy[p.type] = [];
					}
					selectedBy[p.type].push(p.id);
				});

				if (!!selectedBy["Credible Set"]) {
					selectedBy["Credible Set"].map((p) => {
						newTableFormat["Evidence"].push(p);
					});
				}

				if (!!selectedBy["Tissue"]) {
					selectedBy["Tissue"].map((p) => {
						newTableFormat["Evidence"].push(p);
					});
				}

				if (!!selectedBy["Annotation"]) {
					selectedBy["Annotation"].map((p) => {
						newTableFormat["Evidence"].push(p);
					});
				}
			}

			if (newRows.length > 0) {
				if (!!selectedBy["Credible Set"]) {
					let keyField =
						this.tableFormat["custom table"]["Credible Set"][
							"key field"
						];
					let PPAField =
						this.tableFormat["custom table"]["Credible Set"]["PPA"];

					selectedBy["Credible Set"].map((CS) => {
						for (const [phenotype, CSData] of Object.entries(
							this.pkgData.CSData
						)) {
							if (!!CSData[CS]) {
								CSData[CS].map((CSItem) => {
									let variant = CSItem[keyField];
									let PPA = CSItem[PPAField];

									if (!!rawData[variant]) {
										if (!updatedData[variant]) {
											updatedData[variant] = {
												...rawData[variant],
											};
										}
										updatedData[variant][CS] = PPA;

										///add credible set value

										if (
											!updatedData[variant][
												"Credible Set"
											]
										) {
											updatedData[variant][
												"Credible Set"
											] = {};
										}

										if (
											!updatedData[variant][
												"Credible Set"
											][phenotype]
										) {
											updatedData[variant][
												"Credible Set"
											][phenotype] =
												"<strong>" +
												CS +
												"</strong>(" +
												PPA +
												")";
										} else if (
											!!updatedData[variant][
												"Credible Set"
											][phenotype]
										) {
											updatedData[variant][
												"Credible Set"
											][phenotype] +=
												", " +
												"<strong>" +
												CS +
												"</strong>(" +
												PPA +
												")";
										}
									}
								});
							}
						}
					});
					updatedData = Object.entries(updatedData)
						.sort()
						.reduce((o, [k, v]) => ((o[k] = v), o), {});

					/// feed null to value for phenotype under Credible sets

					for (const [vKey, vValue] of Object.entries(updatedData)) {
						let compareField =
							this.dataComparisonConfig.fieldsToCompare[1];
						let activePhenotypes = Object.keys(
							vValue[compareField]
						);
						let tempObj = {};
						activePhenotypes.map((p) => {
							if (!!vValue["Credible Set"][p]) {
								tempObj[p] = vValue["Credible Set"][p];
							} else {
								tempObj[p] = "N/A";
							}
						});
						vValue["Credible Set"] = tempObj;
					}

					if (
						!!selectedBy["Credible Set"] &&
						selectedBy["Credible Set"].length > 0 &&
						!!selectedBy["Tissue"] &&
						selectedBy["Tissue"].length > 0 &&
						!!selectedBy["Annotation"] &&
						selectedBy["Annotation"].length > 0
					) {
						//console.log("selectedBy", selectedBy);

						for (const [vKey, vValue] of Object.entries(
							updatedData
						)) {
							let annotationContent = {};
							selectedBy["Tissue"].map((t) => {
								annotationContent[t] = {};
								selectedBy["Annotation"].map((a) => {
									annotationContent[t][a] = null;
								});
							});

							selectedBy["Tissue"].map((t) => {
								let inTissue = 0;

								selectedBy["Annotation"].map((a) => {
									let inAnnotation = 0;
									let tissueContent = "";
									this.pkgData.tissuesData[t][a].region.map(
										(r) => {
											if (
												vValue.Position >= r.start &&
												vValue.Position <= r.end
											) {
												inAnnotation = 1;
												annotationContent[t][a] = {
													start: r.start,
													end: r.end,
												};
											}
										}
									);
									if (inAnnotation == 1) {
										inTissue = 1;
									}
								});
								if (inTissue == 0) {
									delete updatedData[vKey];
								}
							});

							if (!!updatedData[vKey]) {
								/// feed "Tissue" column content
								let tissueColmContent = "";
								let overStart = null;
								let overEnd = null;

								for (const [
									tissue,
									annotations,
								] of Object.entries(annotationContent)) {
									tissueColmContent +=
										"<strong>" +
										tissue +
										"</strong><br />Annotations: ";
									for (const [
										annoKey,
										annoValue,
									] of Object.entries(annotations)) {
										if (annoValue != null) {
											tissueColmContent += annoKey + ", ";
											overStart =
												overStart == null
													? annoValue.start
													: overStart <
													  annoValue.start
													? annoValue.start
													: overStart;

											overEnd =
												overEnd == null
													? annoValue.end
													: overEnd > annoValue.end
													? annoValue.end
													: overEnd;

											//Feed feature column
										}
									}
									tissueColmContent = tissueColmContent.slice(
										0,
										-2
									);
									tissueColmContent += "<br />";
								}
								tissueColmContent +=
									"<strong>Overlapping Region</strong>: " +
									overStart +
									"-" +
									overEnd;

								updatedData[vKey]["Tissue"] = tissueColmContent;

								///Feed "Annotation" column content
								let compareField =
									this.dataComparisonConfig
										.fieldsToCompare[1];

								let activePhenotypes = Object.keys(
									vValue[compareField]
								);

								updatedData[vKey]["Annotation"] = {};

								activePhenotypes.map((p) => {
									let annoColmContent = "";
									for (const [
										tissue,
										annotations,
									] of Object.entries(annotationContent)) {
										annoColmContent +=
											"<strong>" +
											tissue +
											"</strong><br />";
										for (const [
											annoKey,
											annoValue,
										] of Object.entries(annotations)) {
											let annoParams =
												this.pkgData.GEByTissueData[p][
													tissue
												][annoKey];
											annoColmContent += annoKey + "(";
											annoColmContent +=
												"P-Value:" +
												Formatters.pValueFormatter(
													annoParams.pValue
												) +
												", Fold: " +
												Formatters.pValueFormatter(
													annoParams.fold
												) +
												")<br />";
											/*for (const [
												param,
												paramValue,
											] of Object.entries(annoParams)) {
												annoColmContent +=
													param +
													": " +
													Formatters.pValueFormatter(
														paramValue
													) +
													"<br />";
											}*/
										}
									}
									updatedData[vKey]["Annotation"][p] =
										annoColmContent;
								});
							}
						}
					}
				}
			} else {
				updatedData = rawData;
			}

			this.newTableFormat = newTableFormat;

			console.log("updatedData", updatedData);

			return updatedData;
		},

		pagedData() {
			if (!!this.perPageNumber && this.perPageNumber != null) {
				let rawData = this.rawData;

				//console.log("this.rawData", this.rawData);

				let formattedData = [];

				if (this.dataComparisonConfig == null) {
					rawData.map((d) => {
						let tempObj = {};

						this.newTableFormat["top rows"].map((t) => {
							tempObj[t] = d[t];
						});

						if (this.newTableFormat["features"] != undefined) {
							tempObj["features"] = {};
							this.newTableFormat["features"].map((f) => {
								tempObj["features"][f] = [];

								let fTempObj = {};
								this.newTableFormat[f].map((fItem) => {
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

						this.newTableFormat["top rows"].map((t) => {
							tempObj[t] = value[t];
						});

						if (this.newTableFormat["features"] != undefined) {
							tempObj["features"] = {};
							this.newTableFormat["features"].map((f) => {
								tempObj["features"][f] = [];

								let fTempObj = {};
								this.newTableFormat[f].map((fItem) => {
									fTempObj[fItem] = value[fItem];
								});

								tempObj["features"][f].push(fTempObj);
							});
						}
						formattedData.push(tempObj);
					}
				}

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
					paged.push(formattedData[i]);
				}

				//console.log("paged", paged);

				return paged;
			} else {
				return this.rawData;
			}
		},
		topRows() {
			return this.newTableFormat["top rows"];
		},
		topRowNumber() {
			let topRows =
				this.newTableFormat["features"] != undefined
					? this.topRows.length + 1
					: this.topRows.length;
			return topRows;
		},
	},
	watch: {
		pkgDataSelected: {
			handler: function (n, o) {
				if (n.length > 0) {
					//console.log("this.rawData", this.rawData);
					console.log("this.pkgData", this.pkgData);
					//console.log("this.pkgDataSelected", this.pkgDataSelected);
				}
			},
			deep: true,
			immediate: true,
		},
	},
	methods: {
		...Formatters,
		getColorIndex(SKEY) {
			let keyField = this.dataComparisonConfig.fieldsGroupDataKey;
			let keyParameterSeach = this.searchParameters[keyField].search;
			let colorIndex = "";
			if (keyParameterSeach.length > 1) {
				keyParameterSeach.map((sValue, sIndex) => {
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
				this.newTableFormat["column formatting"] != undefined &&
				this.newTableFormat["column formatting"][tdKey] != undefined
			) {
				let formatTypes =
					this.newTableFormat["column formatting"][tdKey]["type"];

				let linkToNewTab = !!this.newTableFormat["column formatting"][
					tdKey
				]["new tab"]
					? this.newTableFormat["column formatting"][tdKey]["new tab"]
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
							this.newTableFormat["column formatting"][tdKey][
								"link to"
							] +
							cellValue;

						linkString +=
							linkToNewTab == "true"
								? "' target='_blank'>" + cellValue + "</a>"
								: "'>" + cellValue + "</a>";

						cellValue = linkString;
					}

					if (type == "render background percent") {
						let fieldValue =
							typeof tdValue != "number"
								? this.newTableFormat["column formatting"][
										tdKey
								  ]["percent if empty"]
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
			let isObjct = !!this.dataComparisonConfig.fieldsToCompare.includes(
				KEY
			)
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
				let keyField = d[this.dataComparisonConfig.keyField];
				objectedArray[keyField] = RAW_DATASET[keyField];
			});

			//console.log(objectedArray);
			return objectedArray;
		},
		applySorting(key) {
			/*
			let sortDirection = this.sortDirection == "asc" ? false : true;
			this.sortDirection = this.sortDirection == "asc" ? "desc" : "asc";
			if (key != this.newTableFormat["locus field"]) {
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
			} else if (key == this.newTableFormat["locus field"]) {
				let sortKey = this.newTableFormat["locus field"];
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
			}*/
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
