<template>
	<div class="research-data-table-wrapper" :class="(!!tableFormat.display && tableFormat.display == 'false') ? 'hidden' : ''">
		<div :class="['info-page-nav', openCard ? 'open' : '']">
			<div class="info-cards-back" @click="hideFeatures()" v-if="!!tableFormat['rows as info cards']['minimum view']"><span class="btn">&#x276E; Back</span></div>
			<div class="info-cards-help">
				<div class="info-cards-glossary" v-if="!!tableFormat['glossary']"><span class="btn"><span class="btn-icon">?</span>Glossary</span></div>
				<div class="info-cards-tour" v-if="!!tableFormat['tour']"><span class="btn"><span class="btn-icon">i</span>Tour</span></div>
			</div>
		</div>
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

		<div :class="['thumbnails-wrapper', openCard ? '' : 'hidden']" v-if="!!tableFormat['rows as info cards']['minimum view']">
			<template  v-for="(value, index) in rawData">

				<div :class="['info-card', openCard && openCard == value[tableFormat['rows as info cards']['key']] ? 'selected' : '']"
					@click="showHideFeature(sectionId + index + featureKey, value[tableFormat['rows as info cards']['key']])">

						<div :class="['row-value', rowKey]" 
							 v-for="(rowKey, rowIndex) in tableFormat['rows as info cards']['minimum view']" 
							:key="index + '-' + rowIndex"
							v-html="formatValue(value[rowKey], rowKey)">
						</div>

				</div>

			</template>
		</div>

		<div :class="['details-wrapper', openCard ? 'feature' : '']">
			
			 <template  v-for="(value, index) in rawData">
				<div :class="['info-card', !openCard || openCard == value[tableFormat['rows as info cards']['key']] ? '' : 'hidden']">

					<div class="info-card-header">

						<div v-for="(rowKey, rowIndex) in tableFormat['logo row']" 
							:key="index + '-' + rowIndex"
							:class="'row-value ' + rowKey" 
							v-html="formatValue(value[rowKey], rowKey)">
						</div>

						<div class="info-card-header-extra">
							<div v-for="(rowKey, rowIndex) in tableFormat['title rows']" 
								:key="index + '-' + rowIndex"
								:class="rowKey" v-html="formatValue(value[rowKey], rowKey)">
							</div>
						</div>

					</div>

					<template  v-for="(rowKey, rowIndex) in tableFormat['top rows']">
						<div
							:key="index + '-' + rowIndex" 
							class="info-card-row"
							v-if="!!value[rowKey]">

							<div :class="'row-key ' + rowKey">{{ rowKey }}</div>
							<div :class="'row-value ' + rowKey" v-html="formatValue(value[rowKey], rowKey)"></div>

						</div>
					</template>

					<div v-for="(featureKey, featureIndex) in tableFormat['features']" 
						:key="index + '-feature-' + featureIndex" 
						:class="['info-card-more', openCard && openCard == value[tableFormat['rows as info cards']['key']] ? 'hidden' : '']">

						<a href="javascript:;" @click="showHideFeature(sectionId + index + featureKey, value[tableFormat['rows as info cards']['key']])">
							&plus; More
						</a>
					
					</div>

					<div v-for="(featureKey, featureIndex) in tableFormat['features']" 
						:key="featureIndex" 
						:id="sectionId + index + featureKey" 
						class="info-card-more-wrapper" 
						:class="[featureKey, openCard && openCard == value[tableFormat['rows as info cards']['key']] ? '' : 'hidden']">

						<template v-for="(fRowKey, fRowIndex) in tableFormat[featureKey]">
						<div v-if="!!value[fRowKey]"
							:key="fRowIndex" 
							class="info-card-row">

							<div class="feature" :class="'row-key ' + fRowKey">{{ fRowKey }}</div>
							<div class="feature" v-html="formatValue(value[fRowKey], fRowKey)" :class="'row-value ' + fRowKey"></div>
						
						</div>
						</template>

					</div>
				</div>
			</template>
			
		</div>
		<!--
		<div class="details-wrapper" 
			:style="(!!openCard)?'width:calc(100% - ' + (thumbnailWidth + 20) + 'px)':''">
			
			<template  v-for="(value, index) in rawData">
			<div :key="index" class="info-card" v-if="!!openCard && openCard == value[tableFormat['rows as info cards']['key']]">
				<div v-for="(rowKey, rowIndex) in tableFormat['top rows']" :key="index+'-'+rowIndex" class="" >
					<div class="" :class="'row-key '+rowKey">
						{{ rowKey }}
					</div>
					<div :class="'row-value ' + rowKey" v-html="formatValue(value[rowKey], rowKey)"></div>
				</div>
				<div v-for="(featureKey, featureIndex) in tableFormat['features']" :key="featureIndex" 
					:id="sectionId+index+featureKey" class="container-fluid info-card-feature" :class="featureKey">
					<div v-for="(fRowKey, fRowIndex) in tableFormat[featureKey]" :key="fRowIndex" class="">
						<div :class="'row-key ' + fRowKey">
							{{ fRowKey }}
						</div>
						<div v-html="formatValue(value[fRowKey], fRowKey)" :class="'row-value ' + fRowKey"></div>
					</div>
				</div>
			</div>
			</template>

		</div>
		-->
		<!--<b-container
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
		</b-container>-->
	</div>
</template>

<script>
import Vue from "vue";
import ResearchDataTableFeatures from "@/components/researchPortal/ResearchDataTableFeatures.vue";
import ResearchSummaryPlot from "@/components/researchPortal/ResearchSummaryPlot.vue";

export default Vue.component("research-info-cards", { 
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
		"summarySection",
		"starItems",
		"sectionId",
		"utils",
		"region",
		"regionZoom",
		"regionViewArea",
		"thumbnailWidth",
		'openCardPreset'
	],
	data() {
		return {
			currentPage: 1,
			perPageNumber: null,
			featureRowsNumber: 10,
			compareGroups: [],
			stared: false,
			minimumView: null,
			openCard: null,
			minVidsReady: false
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
	updated() {
		if (!!this.openCardPreset) {
			this.openCard = this.openCardPreset;
		}
		//alex remove this after making min-video into component
		this.$nextTick(() => {
			if(!this.minVidsReady){
				this.minVidsReady = true;
				document.querySelectorAll('.mini-card-video video').forEach(vid => {
					vid.addEventListener('ended', e => {
						e.target.classList.add('paused');
					});
					vid.addEventListener('mouseover', e => {
						if(e.target.classList.contains('paused')){
							e.target.play();
						}
					});
					vid.addEventListener('mouseout', e => {
						if(e.target.classList.contains('paused')){
							e.target.pause();
						}
					});
				})
			}
		});
	},
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
			let rawData = [...new Set(this.dataset)];
			return rawData;
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
		featureRowsNumber(NUMBER) {
			this.$emit('on-feature-rows-change', NUMBER);
		},
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
		setParameter(VALUE,KEY,SECTION,PARAMETERS){

			//console.log("section component", VALUE, ":", KEY, ":", SECTION, ":", PARAMETERS);

			let targetSections = SECTION == "all" ? "":[SECTION];

			if (typeof PARAMETERS === "object") {
				let values = VALUE.split(",");

				PARAMETERS.map((p, pIndex) => {
					document.getElementById("search_param_" + p).value = values[pIndex];
					this.$root.$refs.multiSectionSearch.updateSearch(p, targetSections);
				})

			} else {
				document.getElementById("search_param_" + PARAMETERS).value = VALUE;
				this.$root.$refs.multiSectionSearch.updateSearch(PARAMETERS, targetSections);
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
		getParameterColumnLabel(KEY){
			if (!!this.ifSetParameterColumn(KEY)) {
				let label = (!!this.tableFormat['column formatting'][KEY].label)? this.tableFormat['column formatting'][KEY].label : null;
				return label;
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
		hideFeatures() {
			let featureContents = document.querySelectorAll("div.info-card-feature");

			featureContents.forEach(fContent => {
				let fId = fContent.getAttribute("id");
				this.utils.uiUtils.hideElement(fId);
			})
			this.minimumView = null;
			this.openCard = null;
			this.$emit('on-openCard', null);
		},
		showHideFeature(ELEMENT, KEY) {
			let featureContents = document.querySelectorAll("div.info-card-feature");

			featureContents.forEach(fContent =>{
				let fId = fContent.getAttribute("id");
				this.utils.uiUtils.hideElement(fId);
			})
			this.utils.uiUtils.showElement(ELEMENT);
			this.minimumView = true;
			this.openCard = KEY;
			this.$emit('on-openCard', KEY);
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
/* info cards styling */
.thumbnails-wrapper {
	display: inline-block;
	vertical-align: top;
}
.details-wrapper {
	display: inline-block;
	vertical-align: top;
}
.info-card {
 background-color: #fff;
 padding: 1.25em;
 border-radius: 5px;
 margin: 10px 0;
}

.row-key {
	font-weight: bold;
}

.row-value {

}

.egl-table-page-ui-wrapper ul {
	background-color: #fff !important;
}
/* end */
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
}
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
*/
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

.research-data-table-wrapper > .table-wrapper {
	overflow-x:auto;
	overflow-y: hidden;
	width: 100%;
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
