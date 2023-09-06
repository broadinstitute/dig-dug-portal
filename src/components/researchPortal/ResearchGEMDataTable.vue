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
				:key="item + itemIndex"
				:class="'group-item-bubble reference bg-color-' + itemIndex"
			></span>
		</div>
		<div class="table-ui-wrapper">
			<label
				>Compare annotated regions:
				<select v-model="filterTissueType" class="number-per-page">
					<option value="or">Or</option>
					<option value="and">And</option>
				</select>
			</label>
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
				@click="convertJson2Csv(rawData, pageID + '_filtered')"
			>
				Save as CSV
			</div>
			<div
				class="convert-2-csv btn-sm"
				@click="saveJson(rawData, pageID + '_filtered')"
			>
				Save as JSON
			</div>
			<div
				class="convert-2-csv btn-sm"
				@click="showHidePanel('#showHideColumnsBox')"
			>
				show/hide columns
			</div>
			<div v-if="!!newTableFormat" id="showHideColumnsBox" class="hidden">
				<div
					class="show-hide-columns-box-close"
					@click="showHidePanel('#showHideColumnsBox')"
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
								v-for="column in newTableFormat['top rows']"
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
									<span
										v-html="
											column == 'Credible Set'
												? ' PPA'
												: ' ' + column
										"
									></span>
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
			v-if="!!dataset && !!newTableFormat"
		>
			<thead class="">
				<tr>
					<!--<th
						v-for="(value, index) in topRows"
						:key="index"
						v-html="value"
						@click="
							!!tableFormat['top rows'].includes(value)
								? applySorting(value)
								: ''
						"
						:class="
							!!tableFormat['top rows'].includes(value)
								? 'sortable-th ' + value
								: value
						"
					></th>-->
					<th v-if="!!newTableFormat['star column']">
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
							@click="
								!!tableFormat['top rows'].includes(value) ||
								value == 'Credible Set'
									? applySorting(value)
									: ''
							"
							class="byor-tooltip"
							:class="
								!!tableFormat['top rows'].includes(value) ||
								value == 'Credible Set'
									? 'sortable-th ' +
									  value +
									  ' ' +
									  getColumnId(value)
									: '' + getColumnId(value)
							"
						>
							<span
								v-html="value == 'Credible Set' ? 'PPA' : value"
							></span>
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
						v-if="newTableFormat['features'] != undefined"
					>
						Evidence
					</th>
				</tr>
			</thead>

			<tbody v-for="(value, index) in pagedData" :key="index" class="">
				<tr>
					<td v-if="!!newTableFormat['star column']">
						<span v-if="checkStared(value) == false"
							><b-icon
								icon="star"
								style="color: #aaaaaa; cursor: pointer"
								@click="addStar(value)"
							></b-icon
						></span>
						<span v-if="checkStared(value) == true"
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
							v-if="
								ifDataObject(tdValue) == false &&
								getIfChecked(tdKey) == true
							"
							:key="tdKey"
							v-html="formatValue(tdValue, tdKey)"
							:class="getColumnId(tdKey)"
						></td>
						<td
							v-if="
								ifDataObject(tdValue) == true &&
								getIfChecked(tdKey) == true
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
							:utils="utils"
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

//import Formatters from "@/utils/formatters";

//import uiUtils from "@/utils/uiUtils";
//import sortUtils from "@/utils/sortUtils";

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
		"region",
		"regionZoom",
		"regionViewArea",
		"utils"
	],
	data() {
		return {
			currentPage: 1,
			perPageNumber: null,
			filterTissueType: "or",
			newTableFormat: null,
			compareGroups: [],
			sortByCredibleSet: false,
			sortDirection: "asc",
			stared: false,
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
			let newTableFormat = Object.assign({}, this.tableFormat);
			var updatedData = {};
			var rawData = {};

			//If the data queried is not compared, convert it from array to object
			if (this.dataComparisonConfig == null) {
				let keyField =
					newTableFormat["custom table"]["Credible Set"]["key field"];
				this.dataset.map((d) => {
					rawData[d[keyField]] = d;
				});
			} else {
				rawData = { ...this.dataset }; //create copy of original data to avoid modifying original data which is shared with other components.
			}

			if (!!this.tableFormat["data zoom"]) {
				let chrField = this.tableFormat["data zoom"].chromosome;
				let posField = this.tableFormat["data zoom"].position;
				let startPos = this.viewingRegion.start;
				let endPos = this.viewingRegion.end;

				for (const [vKey, vValue] of Object.entries(rawData)) {
					if (
						vValue[posField] < startPos ||
						vValue[posField] > endPos
					) {
						delete rawData[vKey];
					}
				}
			}

			// Add original index to each items in the rawData, so it can be sorted back to original order after processing;
			let vIndex = 0;
			for (const [vKey, vValue] of Object.entries(rawData)) {
				vValue["indexNum"] = vIndex;
				vIndex++;
			}

			var newRows = [];
			var selectedBy = {};

			// Add "Credible sets" and selected tissues to the top rows

			if (this.pkgDataSelected.length > 0) {
				// get the list of the types of filtering credible sets, and tissues X annotations
				var selectedTypes = this.pkgDataSelected.map((p) => p.type);

				//newRows = [...new Set(this.pkgDataSelected.map((p) => p.type))];
				if (selectedTypes.indexOf("Credible Set") > -1) {
					newRows.push("Credible Set");
				}
				if (selectedTypes.indexOf("Tissue") > -1) {
					newRows.push("Tissue");
				}
				if (selectedTypes.indexOf("Biosample") > -1) {
					newRows.push("Biosample");
				}

				//Remove "Annotation" from newRows since we are going to have annotations in tissues column
				const annoIndex = newRows.indexOf("Annotation");
				if (annoIndex > -1) {
					newRows.splice(annoIndex, 1);
				}

				//Replace "Tissue" with "Annotation Overlap"
				const tissueIndex = newRows.indexOf("Tissue");
				if (tissueIndex > -1) {
					newRows[tissueIndex] = "Annotation Overlap";
				}

				//Replace "Tissue" with "Annotation Overlap"
				const biosampleIndex = newRows.indexOf("Biosample");
				if (biosampleIndex > -1) {
					newRows[biosampleIndex] = "Biosample Overlap";
				}

				this.pkgDataSelected.map((p) => {
					if (p.type == "Tissue") {
						newRows.push(p.id);
					}

					if (p.type == "Biosample") {
						if (!newRows.includes(p.id.split(" / ")[2] + "(b)")) {
							newRows.push(p.id.split(" / ")[2] + "(b)");
						}
					}
				});

				//Merge new top rows original top rows
				var oldRows = newTableFormat["top rows"];
				var newTopRows = oldRows.concat(newRows);
				newTableFormat["top rows"] = newTopRows;

				// add "features" to table format if there isn't one. Then add "Credible Set" or "Biosample"

				if (
					!!newTopRows.includes("Credible Set") ||
					!!newTopRows.includes("Biosample Overlap")
				) {
					if (!this.tableFormat["features"]) {
						newTableFormat["features"] = [];
					}
				}

				if (!!newTopRows.includes("Credible Set")) {
					if (!newTableFormat["features"].includes("Credible Set")) {
						newTableFormat["features"].push("Credible Set");
					}

					newTableFormat["Credible Set"] = [];
				}

				if (!!newTopRows.includes("Biosample Overlap")) {
					this.pkgDataSelected.map((p) => {
						if (p.type == "Biosample") {
							if (
								!newTableFormat["features"].includes(
									"Biosamples"
								)
							) {
								newTableFormat["features"].push("Biosamples");
								newTableFormat["Biosamples"] = [];
							}
						}
					});
				}

				let isBiosample = null;

				this.pkgDataSelected.map((p) => {
					if (!selectedBy[p.type]) {
						selectedBy[p.type] = [];
					}
					selectedBy[p.type].push(p.id);

					// add filtering CS and tissues to Evidence list
					if (p.type == "Credible Set") {
						newTableFormat["Credible Set"].push(p.id);
					}

					if (p.type == "Biosample") {
						isBiosample = true;
					}
				});

				!!isBiosample
					? (newTableFormat["Biosamples"] = ["Biosamples:array"])
					: "";
			}

			//Let's filter rawData by credible sets
			if (
				!!selectedBy["Credible Set"] &&
				selectedBy["Credible Set"].length > 0
			) {
				// get variant id field name and ppa field name
				let keyField =
					newTableFormat["custom table"]["Credible Set"]["key field"];
				let PPAField =
					newTableFormat["custom table"]["Credible Set"]["PPA"];

				selectedBy["Credible Set"].map((CS) => {
					for (const [phenotype, CSData] of Object.entries(
						this.pkgData.CSData
					)) {
						if (!!CSData[CS]) {
							CSData[CS].map((CSItem) => {
								let variant = CSItem[keyField];
								let PPA = Number(CSItem[PPAField]);

								// first check if a variant from CS exist in the rawData
								if (!!rawData[variant]) {
									///Add the variant information to updatedData
									if (!updatedData[variant]) {
										updatedData[variant] = {
											...rawData[variant],
										};
									}
									//Add PPA to each CS property
									updatedData[variant][CS] = PPA;

									//Add highest PPA from each of the CS to "Credible Set" property which will be placed under "PPA" column
									//Case of no data comparison
									if (this.dataComparisonConfig == null) {
										if (
											!updatedData[variant][
												"Credible Set"
											]
										) {
											updatedData[variant][
												"Credible Set"
											] = PPA;
										} else if (
											!!updatedData[variant][
												"Credible Set"
											]
										) {
											let previousPPA =
												updatedData[variant][
													"Credible Set"
												];
											updatedData[variant][
												"Credible Set"
											] =
												PPA > previousPPA
													? PPA
													: previousPPA;
										}
									} else {
										// if multiple dataset are compared
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
											][phenotype] = PPA;
										} else if (
											!!updatedData[variant][
												"Credible Set"
											][phenotype]
										) {
											let previousPPA =
												updatedData[variant][
													"Credible Set"
												][phenotype];
											updatedData[variant][
												"Credible Set"
											][phenotype] =
												PPA > previousPPA
													? PPA
													: previousPPA;
										}
									}
								}
							});
						}
					}
				});

				updatedData = Object.entries(updatedData)
					.sort()
					.reduce((o, [k, v]) => ((o[k] = v), o), {}); // reduce

				/// feed null to value for phenotype in Credible sets column. It runs only data comparion is configured
				if (!!this.dataComparisonConfig) {
					for (const [vKey, vValue] of Object.entries(updatedData)) {
						let compareField =
							this.dataComparisonConfig["fields to compare"][1];
						let activePhenotypes = Object.keys(
							vValue[compareField]
						);
						let tempObj = {};
						activePhenotypes.map((p) => {
							///custom table
							/// custom data other than KP data is loaded
							let phenotype =
								!!newTableFormat["custom table"][
									"phenotype match"
								] &&
								!!newTableFormat["custom table"][
									"phenotype match"
								][p]
									? newTableFormat["custom table"][
											"phenotype match"
									  ][p]
									: p;
							///

							if (!!vValue["Credible Set"][phenotype]) {
								tempObj[p] = vValue["Credible Set"][phenotype];
							} else {
								tempObj[p] = "N/A";
							}
						});
						vValue["Credible Set"] = tempObj;
					}
				}
			} else {
				updatedData = rawData;
				if (!!newTableFormat["features"]) {
					let CSIndex =
						newTableFormat["features"].indexOf("Credible Set");
					if (CSIndex > -1) {
						newTableFormat["features"].splice(CSIndex, 1);
					}
				}
			}

			///Filter data if tissues and annotations selected

			if (
				!!selectedBy["Tissue"] &&
				selectedBy["Tissue"].length > 0 &&
				!!selectedBy["Annotation"] &&
				selectedBy["Annotation"].length > 0
			) {
				//first get all enriched positions
				var enrichedPosition = null;

				selectedBy["Annotation"].map((a) => {
					selectedBy["Tissue"].map((t) => {
						if (
							!!this.pkgData.annoData[a] &&
							!!this.pkgData.annoData[a][t]
						) {
							let tempArr = [];
							this.pkgData.annoData[a][t].region.map((r) => {
								for (let i = r.start; i <= r.end; i++) {
									tempArr.push(i);
								}
							});

							if (enrichedPosition == null) {
								enrichedPosition = tempArr;
							} else {
								enrichedPosition =
									this.filterTissueType == "or"
										? enrichedPosition.concat(tempArr)
										: this.getArraysIntersection(
												enrichedPosition,
												tempArr
										  ); // getting only intersecting positions
							}
						}
					});
				});

				//sort enriched position so I can remove position between start and end positions
				enrichedPosition.sort(function (a, b) {
					return a - b;
				});

				//leave only start and end of overlapping regions
				var enrichedRegion = [];

				for (let i = 0; i < enrichedPosition.length; i++) {
					if (i == 0 || i == enrichedPosition.length - 1) {
						enrichedRegion.push(enrichedPosition[i]);
					} else {
						let pos1 = enrichedPosition[i - 1] + 1;
						let pos2 = enrichedPosition[i];

						if (pos2 > pos1) {
							enrichedRegion.push(enrichedPosition[i - 1]);
							enrichedRegion.push(enrichedPosition[i]);
						}
					}
				}

				///build object of overlapping regions
				var overlappingRegions = [];

				for (let i = 0; i < enrichedRegion.length - 1; i += 2) {
					let tempObj = {};
					tempObj["start"] = enrichedRegion[i];
					tempObj["end"] = enrichedRegion[i + 1];
					overlappingRegions.push(tempObj);
				}

				//filter out unoverlapping variants and add overlapping region info to each variants
				var overlappingVariants = {};
				for (const [vKey, vValue] of Object.entries(updatedData)) {
					let position = vValue.Position;

					overlappingRegions.map((r) => {
						if (position >= r.start && position <= r.end) {
							overlappingVariants[vKey] = vValue;
							overlappingVariants[vKey]["overStart"] = r.start;
							overlappingVariants[vKey]["overEnd"] = r.end;
						}
					});
				}

				updatedData = overlappingVariants;

				//Add tissue content
				for (const [vKey, vValue] of Object.entries(updatedData)) {
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
							if (!!this.pkgData.tissuesData[t][a]) {
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
							}
						});
						if (inTissue == 0) {
							if (this.filterTissueType == "and") {
								delete updatedData[vKey];
							}
						}
					});

					if (!!updatedData[vKey]) {
						/// feed "Tissue" column content
						let tissueColmContent = "";

						for (const [tissue, annotations] of Object.entries(
							annotationContent
						)) {
							let enrichedAnnotations = "";
							for (const [annoKey, annoValue] of Object.entries(
								annotations
							)) {
								if (annoValue != null) {
									enrichedAnnotations +=
										annoKey +
										": " +
										annoValue.start +
										"-" +
										annoValue.end +
										", ";
								}
							}

							if (enrichedAnnotations != "") {
								updatedData[vKey][tissue] =
									enrichedAnnotations.slice(0, -2);
							}
						}

						updatedData[vKey]["Annotation Overlap"] =
							updatedData[vKey].overStart +
							"-" +
							updatedData[vKey].overEnd;
					}
				}
			}

			///Filter data if biosamples

			// get list of BS methods and sources to filter them out

			let removedBSMethods = this.$store.state.pkgDataSelected
				.filter((s) => s.type == "BS-Method")
				.map((s) => s.id);

			let removedBSSources = this.$store.state.pkgDataSelected
				.filter((s) => s.type == "BS-Source")
				.map((s) => s.id);

			if (
				!!selectedBy["Biosample"] &&
				selectedBy["Biosample"].length > 0
			) {
				//first get all enriched positions
				let enrichedPosition = null;

				selectedBy["Biosample"].map((b) => {
					let pathArr = b.split(" / ");
					let annotation = pathArr[0];
					let tissue = pathArr[1];
					let biosample = pathArr[2];

					if (
						!!this.pkgData.biosamplesData[annotation] &&
						!!this.pkgData.biosamplesData[annotation][tissue] &&
						!!this.pkgData.biosamplesData[annotation][tissue][
							biosample
						]
					) {
						let regions =
							this.pkgData.biosamplesData[annotation][tissue][
								biosample
							];
						let tempArr = [];
						regions.map((r) => {
							if (
								removedBSMethods.indexOf(r.method) == -1 &&
								removedBSSources.indexOf(r.source) == -1
							) {
								for (let i = r.start; i <= r.end; i++) {
									tempArr.push(i);
								}
							}
						});

						if (enrichedPosition == null) {
							enrichedPosition = tempArr;
						} else {
							enrichedPosition =
								this.filterTissueType == "or"
									? enrichedPosition.concat(tempArr)
									: this.getArraysIntersection(
											enrichedPosition,
											tempArr
									  ); // getting only intersecting positions
						}
					}
				});

				//sort enriched position so I can remove position between start and end positions
				if (enrichedPosition != null) {
					enrichedPosition.sort(function (a, b) {
						return a - b;
					});
				}

				//leave only start and end of overlapping regions
				let enrichedRegion = [];

				if (enrichedPosition != null) {
					for (let i = 0; i < enrichedPosition.length; i++) {
						if (i == 0 || i == enrichedPosition.length - 1) {
							enrichedRegion.push(enrichedPosition[i]);
						} else {
							let pos1 = enrichedPosition[i - 1] + 1;
							let pos2 = enrichedPosition[i];

							if (pos2 > pos1) {
								enrichedRegion.push(enrichedPosition[i - 1]);
								enrichedRegion.push(enrichedPosition[i]);
							}
						}
					}
				}

				///build object of overlapping regions
				var overlappingRegions = [];

				for (let i = 0; i < enrichedRegion.length - 1; i += 2) {
					let tempObj = {};
					tempObj["start"] = enrichedRegion[i];
					tempObj["end"] = enrichedRegion[i + 1];
					overlappingRegions.push(tempObj);
				}

				//filter out unoverlapping variants and add overlapping region info to each variants
				var overlappingVariants = {};
				for (const [vKey, vValue] of Object.entries(updatedData)) {
					let position = vValue.Position;

					overlappingRegions.map((r) => {
						if (position >= r.start && position <= r.end) {
							overlappingVariants[vKey] = vValue;
							overlappingVariants[vKey]["bioStart"] = r.start;
							overlappingVariants[vKey]["bioEnd"] = r.end;
						}
					});
				}

				updatedData = overlappingVariants;

				//Add tissue content
				for (const [vKey, vValue] of Object.entries(updatedData)) {
					let biosampleContent = {};
					selectedBy["Biosample"].map((bi) => {
						let bsArr = bi.split(" / "); //0= annotation, 1= tissue, 2=biosample
						let a = bsArr[0];
						let b = bsArr[2];
						if (!biosampleContent[b]) {
							biosampleContent[b] = {};
						}
						if (!biosampleContent[b][a]) {
							biosampleContent[b][a] = null;
						}
					});

					selectedBy["Biosample"].map((bi) => {
						let inBiosample = 0;

						let bsArr = bi.split(" / "); //0= annotation, 1= tissue, 2=biosample
						let a = bsArr[0];
						let t = bsArr[1];
						let b = bsArr[2];

						let inAnnotation = 0;
						//if (!!this.pkgData.biosamplesData[a][t]) {
						this.pkgData.biosamplesData[a][t][b].map((r) => {
							if (
								vValue.Position >= r.start &&
								vValue.Position <= r.end &&
								removedBSMethods.indexOf(r.method) == -1 &&
								removedBSSources.indexOf(r.source) == -1
							) {
								inAnnotation = 1;
								if (!biosampleContent[b][a]) {
									biosampleContent[b][a] = {
										start: r.start,
										end: r.end,
									};
								} else {
									biosampleContent[b][a].start =
										r.start < biosampleContent[b][a].start
											? r.start
											: biosampleContent[b][a].start;
									biosampleContent[b][a].end =
										r.end > biosampleContent[b][a].end
											? r.end
											: biosampleContent[b][a].end;
								}
							}
						});
						if (inAnnotation == 1) {
							inBiosample = 1;
						}

						if (inBiosample == 0) {
							if (this.filterTissueType == "and") {
								delete updatedData[vKey];
							}
						}
					});

					if (!!updatedData[vKey]) {
						/// feed "Biosample" column content
						//let tissueColmContent = "";

						for (const [biosample, annotations] of Object.entries(
							biosampleContent
						)) {
							let enrichedAnnotations = "";
							for (const [annoKey, annoValue] of Object.entries(
								annotations
							)) {
								if (annoValue != null) {
									enrichedAnnotations +=
										annoKey +
										": " +
										annoValue.start +
										"-" +
										annoValue.end +
										", ";
								}
							}

							if (enrichedAnnotations != "") {
								updatedData[vKey][biosample + "(b)"] =
									enrichedAnnotations.slice(0, -2);
							}
						}

						updatedData[vKey]["Biosample Overlap"] =
							updatedData[vKey].bioStart +
							"-" +
							updatedData[vKey].bioEnd;

						///feed feature contents for biosamples

						let bSamplesArr = [];

						selectedBy["Biosample"].map((bi) => {
							let inBiosample = 0;

							let bsArr = bi.split(" / "); //0= annotation, 1= tissue, 2=biosample
							let a = bsArr[0];
							let t = bsArr[1];
							let b = bsArr[2];

							let inAnnotation = 0;

							this.pkgData.biosamplesData[a][t][b].map((r) => {
								if (
									vValue.Position >= r.start &&
									vValue.Position <= r.end &&
									removedBSMethods.indexOf(r.method) == -1 &&
									removedBSSources.indexOf(r.source) == -1
								) {
									let tempObject = {
										region:
											r.chromosome +
											":" +
											r.start +
											"-" +
											r.end,

										method: r.method,
										source: r.source,
										dataset:
											"<a href='https://cmdga.org/annotations/" +
											r.dataset +
											"' target='_blank'>" +
											r.dataset +
											"</a>",

										annotation: r.annotation,
										tissue: r.tissue,
										biosample: r.biosample,
									};
									bSamplesArr.push(tempObject);
								}
							});
						});
						if (bSamplesArr.length > 0) {
							vValue["Biosamples:array"] = bSamplesArr;
						}
					}
				}
			}

			//usually data sorting happens with applySorting() function.
			//but for credible sets case it happens here to avoide destroying original data
			//if data is not sorted by PPA, sort gets done by original index

			var sortedData = [];

			for (const [vKey, vValue] of Object.entries(updatedData)) {
				sortedData.push(vValue);
			}

			if (
				this.sortByCredibleSet == true &&
				!!selectedBy["Credible Set"] &&
				selectedBy["Credible Set"].length > 0
			) {
				sortedData.map((s) => {
					let CSValue = null;

					if (!!this.dataComparisonConfig) {
						for (const [cKey, cValue] of Object.entries(
							s["Credible Set"]
						)) {
							if (CSValue == null) {
								CSValue = cValue;
							}

							if (CSValue == "N/A") {
								CSValue = 0;
							} else {
								CSValue = cValue > CSValue ? cValue : CSValue;
							}
						}
					} else {
						let cValue = s["Credible Set"];
						if (CSValue == null) {
							CSValue = cValue;
						}

						if (CSValue == "N/A") {
							CSValue = 0;
						} else {
							CSValue = cValue > CSValue ? cValue : CSValue;
						}
					}

					s["CSValue"] = CSValue;
				});

				sortedData = sortedData.sort((a, b) =>
					a.CSValue < b.CSValue ? 1 : -1
				);
			} else {
				sortedData.sort((a, b) => (a.indexNum > b.indexNum ? 1 : -1));
			}

			updatedData = {};

			sortedData.map((s) => {
				updatedData[s["Variant ID"]] = s;
			});

			//convert data back to array if data is not compared
			if (this.dataComparisonConfig == null) {
				let uDataNoCompare = [];
				for (const [dKey, dValue] of Object.entries(updatedData)) {
					uDataNoCompare.push(dValue);
				}

				updatedData = uDataNoCompare;
			}

			///check if table shows only stared

			if (this.stared == true) {
				let tempData = this.dataComparisonConfig == null ? [] : {};
				for (const [dKey, dValue] of Object.entries(updatedData)) {
					if (this.checkStared(dValue) == true) {
						if (this.dataComparisonConfig == null) {
							tempData.push(dValue);
						} else {
							tempData[dKey] = dValue;
						}
					}
				}
				updatedData = tempData;
			} else {
				updatedData = updatedData;
			}

			/** somehow newTableFormat doesn't reset  */
			if (!!newTableFormat["features"]) {
				const index = newTableFormat["features"].indexOf("GENES");

				if (index > -1) {
					newTableFormat["features"].splice(index, 1);
				}
			}

			// replace global tableFormat with newTableFormat

			this.newTableFormat = newTableFormat;

			/// format data before adding linked genes

			let formattedData = this.formattedData(updatedData);

			///Let's filter data by linked genes
			///This is a messy solution but easier to understand

			if (
				!!this.pkgData["GLData"] &&
				Object.keys(this.pkgData["GLData"]).length > 0
			) {
				// add "features" to table format if there isn't one. Then add "GENES"
				newTopRows.push("Linked Genes");

				if (!this.tableFormat["features"]) {
					if (!newTableFormat["features"]) {
						newTableFormat["features"] = [];
					}
				}
				if (!newTableFormat["features"].includes("GENES")) {
					newTableFormat["features"].push("GENES");
				}

				if (!!newTableFormat["features"].includes("GENES")) {
					newTableFormat["GENES"] = [
						"Region",
						"Target Gene",
						"Target Region in Gene",
						"Method",
						"Source",
						"Dataset",
						"Assay",
						"Tissue",
						"Biosample",
					];
				}

				let tempData = {};

				let removedGenes = this.$store.state.pkgDataSelected
					.filter((s) => s.type == "GL-Gene")
					.map((s) => s.id);

				let removedMethods = this.$store.state.pkgDataSelected
					.filter((s) => s.type == "GL-Method")
					.map((s) => s.id);

				updatedData = !!Array.isArray(updatedData)
					? this.array2Object(
							this.tableFormat["star column"],
							updatedData
					  )
					: updatedData;

				for (const [vKey, vValue] of Object.entries(updatedData)) {
					let position = vValue["Position"];

					let linkedGenes = "";
					let featureArr = [];

					for (const [tissue, region] of Object.entries(
						this.pkgData["GLData"]
					)) {
						let overlappingOnes = region.filter(
							(r) =>
								r.start <= position &&
								r.end >= position &&
								removedGenes.indexOf(r.targetGene) == -1 &&
								removedMethods.indexOf(r.method) == -1
						);

						if (overlappingOnes.length > 0) {
							overlappingOnes.map((o) => {
								linkedGenes += o["targetGene"] + ",";
								let tempObj = {
									Region: o["start"] + "-" + o["end"],
									"Target Gene": o["targetGene"],
									"Target Region in Gene":
										o["targetGeneStart"] +
										"-" +
										o["targetGeneEnd"],
									Method: o["method"],
									Source: o["source"],
									Dataset:
										"<a href='https://cmdga.org/annotations/" +
										o["dataset"] +
										"' target='_blank'>" +
										o["dataset"] +
										"</a>",
									Assay: o["assay"],
									Tissue: o["tissue"],
									Biosample: o["biosample"],
								};
								featureArr.push(tempObj);
							});
						}

						if (linkedGenes.length > 0) {
							let linkedGenesArr = linkedGenes.split(",");
							linkedGenesArr = [...new Set(linkedGenesArr)]
								.filter((g) => g != "")
								.sort();

							let genesWithLinks = [];

							linkedGenesArr.map((g) => {
								genesWithLinks.push(
									"<a href='/gene.html?gene=" +
										g +
										"'>" +
										g +
										"</a>"
								);
							});

							let tempObj = {};
							tempObj["Linked Genes"] = genesWithLinks.join(", ");
							tempObj["GENES"] = featureArr;

							tempData[vKey] = tempObj;
						}
					}
				}

				let dataWGL = [];
				for (const [vKey, vValue] of Object.entries(tempData)) {
					formattedData.map((v) => {
						if (v["Variant ID"] == vKey) {
							v["Linked Genes"] = vValue["Linked Genes"];

							if (!v["features"]) {
								v["features"] = {};
							}
							v["features"]["GENES"] = vValue["GENES"].sort(
								(a, b) =>
									a["Target Gene"] > b["Target Gene"] ? 1 : -1
							);
							dataWGL.push(v);
						}
					});
				}

				formattedData = dataWGL;
			} else {
				if (!!newTableFormat["features"]) {
					const index = newTableFormat["features"].indexOf("GENES");

					if (index > -1) {
						newTableFormat["features"].splice(index, 1);
					}
				}
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
					this.rows - this.currentPage * perPage > perPage
						? this.currentPage * perPage
						: this.rows;

				for (let i = startIndex; i < endIndex; i++) {
					paged.push(formattedData[i]);
				}

				return paged;
			} else {
				return this.dataInRegion;
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

			topRows += !!this.newTableFormat["star column"] ? 1 : 0;
			return topRows;
		},
	},
	watch: {
		pkgDataSelected: {
			handler: function (n, o) {
				if (n.length > 0) {
				}
			},
			deep: true,
			immediate: true,
		},
		dataset(DATA) {
			if (!!this.dataComparisonConfig) {
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
		//...Formatters,
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
		formattedData(DATA) {
			let rawData = DATA;

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

			return formattedData;
		},
		addStar(ITEM) {
			let value = ITEM[this.tableFormat["star column"]];
			this.$store.dispatch("pkgDataSelected", {
				type: this.tableFormat["star column"],
				id: value,
				action: "add",
			});
		},
		removeStar(ITEM) {
			let value = ITEM[this.tableFormat["star column"]];
			this.$store.dispatch("pkgDataSelected", {
				type: this.tableFormat["star column"],
				id: value,
				action: "remove",
			});
		},
		checkStared(ITEM) {
			let selectedItems = this.pkgDataSelected
				.filter((s) => s.type == this.tableFormat["star column"])
				.map((s) => s.id);

			let value = ITEM[this.tableFormat["star column"]];

			if (!!selectedItems.includes(value)) {
				return true;
			} else {
				return false;
			}
		},
		getArraysIntersection(a1, a2) {
			return a1.filter(function (n) {
				return a2.indexOf(n) !== -1;
			});
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
		showHideStared() {
			if (this.stared == false) {
				this.stared = true;
			} else {
				this.stared = false;
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
			/*
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
						cellValue = this.utils.Formatters.pValueFormatter(tdValue);

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
			}*/
		},
		object2Array(DATASET, KEY, SORT_DIRECTION) {
			let arrayedObject = [];

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
		array2Object(KEY, ARRAY) {
			var convertedObj = {};
			ARRAY.map((a) => {
				let key = a[KEY];
				convertedObj[key] = a;
			});
			return convertedObj;
		},
		array2Object4Filter(DATASET, RAW_DATASET, KEY) {
			let objectedArray = {};
			DATASET.map((d) => {
				let keyField = d[KEY];
				objectedArray[keyField] = RAW_DATASET[keyField];
			});

			return objectedArray;
		},
		applySorting(key) {
			let sortDirection = this.sortDirection == "asc" ? false : true;
			this.sortDirection = this.sortDirection == "asc" ? "desc" : "asc";
			this.sortByCredibleSet = false;
			if (
				key != this.newTableFormat["locus field"] &&
				key != "Credible Set"
			) {
				let filtered =
					this.dataComparisonConfig == null
						? this.dataset
						: this.object2Array(this.dataset, key, sortDirection);

				// In case of the data with null values mixed, we separate it to withValues and WO values.
				let filteredWValues = [];
				let filteredWNull = [];

				filtered.map((v) => {
					if (!!v[key]) {
						filteredWValues.push(v);
					} else {
						filteredWNull.push(v);
					}
				});

				let keyData = filteredWValues[0][key];
				let isNumeric = typeof keyData != "number" ? false : true;

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
						: this.array2Object4Filter(
								sortedValues,
								this.dataset,
								this.dataComparisonConfig["key field"]
						  );
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

				this.utils.sortUtils.sortEGLTableData(filtered, "bp", true, sortDirection);
				this.utils.sortUtils.sortEGLTableData(
					filtered,
					"chr",
					true,
					sortDirection
				);
				this.$store.dispatch("filteredData", filtered);
			} else if (key == "Credible Set") {
				let returnData = this.dataset;
				this.sortByCredibleSet = true;
				this.$store.dispatch("filteredData", returnData);
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
#showHideColumnsBox {
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
