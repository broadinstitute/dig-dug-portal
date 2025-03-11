<template>
	<div>
		<div class="sub-section-header"><strong v-if="!!subSectionConfig['label']">{{ subSectionConfig['label'] }}</strong></div>
		<div v-if="!!subSectionConfig['visualizers'] && (subSectionConfig['visualizers']['wrapper type'] == 'tabs' || subSectionConfig['visualizers']['wrapper type'] == 'divs')"  class="sub-plot-wrapper">
			<div class="sub-tab-ui-wrapper" :id="'tabUiGroup' + rowId">
				<div v-for="tab, tabIndex in subSectionConfig['visualizers']['visualizers']" :id="'tabUi' + rowId + tabIndex"
					class="tab-ui-tab" :class="tabIndex == 0 ? 'active' : ''" @click="utils.uiUtils.setTabActive('tabUi' + rowId + tabIndex,
						'tabUiGroup' + rowId,
						'tabContent' + rowId + tabIndex, 'tabContentGroup' + rowId, true)">
					{{ tab.label/*utils.Formatters.replaceWithParams(tab.label, pageParams)*/ }}
				</div>
			</div>

			<div :id="subSectionConfig['visualizers']['wrapper type'] == 'tabs' ? 'tabContentGroup' + rowId : ''"
			>

				<div v-for="plotConfig, plotIndex in subSectionConfig['visualizers']['visualizers']"
					:id="subSectionConfig['visualizers']['wrapper type'] == 'tabs' ? 'tabContent' + rowId + plotIndex : ''"
					class="plot-tab-content-wrapper"
					:class="(subSectionConfig['visualizers']['wrapper type'] == 'tabs') ? (plotIndex == 0) ? '' : 'hidden-content' : ''">
					<h6 v-html="plotConfig.label" v-if="subSectionConfig['visualizers']['wrapper type'] != 'tabs'"></h6>
					<research-section-visualizers 
						:plotConfig="plotConfig"
						:plotData="currentData"
						:phenotypeMap="phenotypeMap" 
						:colors="colors" 
						:plotMargin="plotMargin"
						:sectionId="(rowId + plotIndex).replaceAll(',','')"
						:utils="utils"
						:searchParameters="rowId">
					</research-section-visualizers>
				</div>
			</div>
		
		</div>
			
		<div v-if="!!subSectionConfig['visualizer']" class="sub-plot-wrapper">
			<research-section-visualizers 
				:plotConfig="subSectionConfig['visualizer']"
				:plotData="currentData"
				:phenotypeMap="phenotypeMap" 
				:colors="colors" 
				:plotMargin="plotMargin"
				:sectionId="rowId.replaceAll(',','')"
				:utils="utils" 
				:searchParameters="rowId">
			</research-section-visualizers>
		</div>
		
		<table class="table table-sm table-striped research-data-table subsection-table">
			<thead>
				<tr>
					<th v-if="!!tableFormat['star column']" class="star-items-control">
						<b-icon
							:icon="!!stared ? 'star-fill' : 'star'"
							style="color: #ffcc00; cursor: pointer"
						>
						</b-icon>
						<span class="star-items-options">
							<ul>
								<li><a href="javascript:;" @click="showHideStared()">Show stard only</a></li>
								<li><a href="javascript:;" @click="starAll()">Star / unstar all</a></li>
							</ul>
						</span>
					</th>
					<th v-for="head in getTopRows()">
						<span>{{ head }}</span>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(row, rowIndex) in subPageData">
					<td v-if="!!tableFormat['star column']">
						<span v-if="checkStared('1', row) == false"
							><b-icon
								icon="star"
								style="color: #aaaaaa; cursor: pointer"
								@click="addStar(row)"
							></b-icon
						></span>
						<span v-if="checkStared('2', row) == true"
							><b-icon
								icon="star-fill"
								style="color: #ffcc00; cursor: pointer"
								@click="removeStar(row)"
							></b-icon
						></span>
					</td>
					<td  v-for="head in getTopRows()">
						
						<span v-html="formatValue(row[head],head)"></span>
						<!-- column formatting contains copy to clipboard -->

						<b-btn class="copy-to-clipboard" v-if="tableFormat['column formatting'] && tableFormat['column formatting'][head] &&
							tableFormat['column formatting'][head].type.includes('copy to clipboard')"
							@click="utils.uiUtils.copy2Clipboard(row[head])">Copy</b-btn>
					</td>
				</tr>
				<tr>
					<td :colspan="getTopRows().length">
						<b-container
									class="egl-table-page-ui-wrapper subsection-page-ui-left"
								>
							<span>{{ "Total rows: "+ currentData.length }}</span>
							</b-container>
						<b-container
							class="egl-table-page-ui-wrapper subsection-page-ui-center"
						>
							<b-pagination
								class="pagination-sm justify-content-center"
								v-model="currentPage"
								:total-rows="currentData.length"
								:per-page="numberOfRows"
								:phenotypeMap="phenotypeMap"
							></b-pagination>
						</b-container>
						<b-container
								class="egl-table-page-ui-wrapper subsection-page-ui-right"
							>
							<div>
								<strong>Save data in section: </strong>
								<div
									class="convert-2-csv btn-sm"
									@click="convertJson2Csv(currentData, rowId + '_subsection')"
								>
									CSV
								</div>
								<div
									class="convert-2-csv btn-sm"
									@click="saveJson(currentData, rowId + '_subsection')"
								>
									JSON
								</div>
							</div>
						</b-container>
					</td>
					
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import ResearchSectionVisualizers from "@/components/researchPortal/ResearchSectionVisualizers.vue";
import ResearchSectionComponents from "@/components/researchPortal/ResearchSectionComponents.vue";

export default Vue.component("research-sub-section", {
	props: ["sectionId","rowId","subSectionConfig", "subSectionData","phenotypeMap","utils","colors","starItems","plotMargin","multiSectionPage"],
	components: {
		ResearchSectionVisualizers,
		ResearchSectionComponents,
	},
	data() {
		return {
			currentData:null,
			currentPage: 1,
			numberOfRows: 10,
			stared: false,
			staredAll: false,
		};
	},
	modules: {
	},
	created() {
		console.log("from mount");
		this.filterData();
	},
	mounted() {
		
	},
	computed: {
		subPageData() {
			let pageData = [];
			let rows = this.currentData.length;

			let startIndex = (this.currentPage - 1) * this.numberOfRows;
			let endIndex =
				rows - this.currentPage * this.numberOfRows > 0
					? this.currentPage * this.numberOfRows
					: rows;

			for (let i = startIndex; i < endIndex; i++) {
				if (!!this.currentData[i]) {
					pageData.push(this.currentData[i]);
				}
			}

			return pageData;
		},
		tableFormat() {
			if (!!this.subSectionConfig['table format']) {
				return this.subSectionConfig['table format'];
			} else {
				return null;
			}
		},
	},
	watch: {
		'$parent.$parent.filterValues'(FILTERS) {
			console.log("from watch");
			this.filterData()
		}
	},
	methods: {
		getColumns(ID) {
			let item;
			/*if (this.dataComparisonConfig != null) {
				for (const [key, value] of Object.entries(
					this.dataset
				)) {
					if (value[this.tableFormat["star column"]] == ID) {
						item = value;
					}
				}
			} else {*/
				item = this.currentData.filter(p => p[this.tableFormat["star column"]] == ID)[0];
			//}
			return item;
		},
		starAll() {

			if(this.staredAll == true) {
				this.staredAll = false;

				if (!!this.multiSectionPage) {

					let stard = [...new Set(this.starItems)]

					//this.subSectionData.map(row => {
						//let value = row[this.tableFormat["star column"]];

						//stard = stard.filter(s => s.section != this.sectionId);
					//})

					stard = stard.filter(s => s.section != this.sectionId + "_" + this.rowId);

					this.$parent.$emit('on-star', stard);
				} /*else {
					this.rawData.map(row => {
						let value = row[this.tableFormat["star column"]];

						this.$store.dispatch("pkgDataSelected", {
							type: this.tableFormat["star column"],
							id: value,
							action: "remove",
						});

					})
				}*/

			} else {
				this.staredAll = true;

				if (!!this.multiSectionPage) {

					let stard = [...new Set(this.starItems)]

					this.subSectionData.map(row => {
						let value = row[this.tableFormat["star column"]];

						let tempObj = {
							type: this.tableFormat["star column"],
							id: value,
							columns: this.getColumns(value),
							section: this.sectionId + "_" + this.rowId,
						}
						stard.push(tempObj);
					})

					this.$parent.$emit('on-star', stard);
				} /*else {
					this.rawData.map(row => {
						let value = row[this.tableFormat["star column"]];

						this.$store.dispatch("pkgDataSelected", {
							type: this.tableFormat["star column"],
							id: value,
							action: "add",
						});

					})
				}*/

			}
			
		},
		addStar(ITEM) {
			let value = ITEM[this.tableFormat["star column"]];
			if (!!this.multiSectionPage) {
				
				let stard = [...new Set(this.starItems)]
				let tempObj = {
					type: this.tableFormat["star column"],
					id: value,
					columns: this.getColumns(value),
					section: this.sectionId + "_" + this.rowId,
				}
				stard.push(tempObj);
				this.$parent.$emit('on-star', stard);
			} /*else {
				this.$store.dispatch("pkgDataSelected", {
					type: this.tableFormat["star column"],
					id: value,
					action: "add",
				});
			}*/
		},
		removeStar(ITEM) {
			let value = ITEM[this.tableFormat["star column"]];
			if (!!this.multiSectionPage) {
				let stard = [...new Set(this.starItems)].filter(s => s.id != value);
				this.$parent.$emit('on-star', stard);
			} /*else {
				this.$store.dispatch("pkgDataSelected", {
					type: this.tableFormat["star column"],
					id: value,
					action: "remove",
				});
			}*/
		},
		checkStared(WHERE, ITEM) {
			if (!!ITEM) {
				let selectedItems;

				if(!!this.multiSectionPage) {
					selectedItems = this.starItems
					.filter((s) => s.type == this.tableFormat["star column"])
					.map((s) => s.id);
				}/* else {
					selectedItems = this.pkgDataSelected
					.filter((s) => s.type == this.tableFormat["star column"])
					.map((s) => s.id);
				}*/
				
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
		filterData() {
			const preFilters = this.$parent.$parent.sectionConfig["pre filters"];
			const filterConfig = this.$parent.$parent.sectionConfig.filters;
			const filtersIndex = this.$parent.$parent.filtersIndex;
			const filterValues = this.$parent.$parent.filterValues;

			const rawData = this.subSectionData;

			/// prefilters


			/// dynamic filters

			if(filterValues.length < 1) {
				this.currentData = [];

				rawData.map( row => {
					filterConfig.map(filter => {
						if(filter.type == 'checkbox' && !!filter.uncheck) {
							if(!filter.uncheck.includes(row[filter.field])) {
								this.currentData.push(row);
							}
						}
					})
				})
			} else {
				this.currentData = [];

				rawData.map( row => {
					let meetFilters = true;

					filterConfig.map(filter => {
						let search = filter.type == 'checkbox'? filterValues : filtersIndex[filter.field].search;

						

						if (!!row[filter.field] && row[filter.field] != undefined && !!search && search.length > 0) {

							let value = row[filter.field];
							
							switch (filter.type) {
								case "checkbox":
									if(!search.includes(value)) {
										meetFilters = false;
									}

									break;
									
								case "search greater than":

									typeof value == 'number' && value < search[0]? meetFilters = false :"";
									break;
								case "search lower than":

									typeof value == 'number' && value > search[0]? meetFilters = false :"";

									break;
								case "dropdown":

									value.toString() != search[0]? meetFilters = false :"";

									break;
								
								case "dropdown word":
									value.toLowerCase()
										.includes(
											search[0].toLowerCase()
										)
										? ""
										: meetFilters = false;

									break;
								case "search":
									value.toLowerCase()
										.includes(
											search[0].toLowerCase()
										)
										? ""
										: meetFilters = false;
									break;
								case "search exact":
									search[0].toLowerCase() ===
									value
										.toString()
										.toLowerCase()
										? "":meetFilters = false;

									break;
								
								case "search or":
									searchVals = search[0].split(",");

									typeof value == 'number' && (value <=
										searchVals[0].trim() ||
									value >=
										searchVals[1].trim())
										? "":meetFilters = false;

									break;

								/*case "search change direction":
									let searchDirection =
										document.getElementById(
											"filter_" + this.sectionId +
												this.getColumnId(
													searchIndex.field
												) +
												"_direction"
										).value;

									searchDirection == "lt"
										? value <=
											search
											? "":meetFilters = false
										: searchDirection == "gt"
										? value >=
											search
											? "":meetFilters = false
											: "";

									break;*/

								case "search and":
									searchVals = search[0].split(",");

									typeof value == 'number' && (value >=
										searchVals[0].trim() &&
									value <=
										searchVals[1].trim())
										? "":meetFilters = false;
									break;

								case "slider":
									searchVals = search[0].split(",");

									typeof value == 'number' && (value >=
										searchVals[0].trim() &&
										value <=
										searchVals[1].trim())
										? "":meetFilters = false;

									break;
							}
						}
					});

					if( meetFilters == true) {
						this.currentData.push(row)
					}
				});
			}

			


/*			if(!!filtersIndex) {
				console.log("Start")

				for (var f in filtersIndex) {

					let searchIndex = filtersIndex[f];

					if (searchIndex.type != "checkbox" && searchIndex.search.length > 0) {


						searchIndex.search
						.filter((v, i, arr) => arr.indexOf(v) == i)
						.map((s) => {
							let targetData = filtered;
							let search = s;
							let searchVals;

						rawData.filter((row) => {
				if (
					!!row[searchIndex.field] &&
					row[searchIndex.field] != undefined
				) {
					switch (searchIndex.type) {
						

						
					}
				}
			})
		
			})*/

		},
		convertJson2Csv(DATA, FILENAME) {

			// First wrap strings with comma or typeof object, and flatten the data
			let jsonData = this.utils.dataConvert.flatJson(DATA);

			//next convert json to csv
			this.utils.uiUtils.saveByorCsv(jsonData, FILENAME);
		},
		saveJson(DATA, FILENAME) {
			this.utils.uiUtils.saveJson(DATA, FILENAME);
		},
		getTopRows(){
			let topRows = [];

			if(!!this.subSectionConfig['table format'] && !!this.subSectionConfig['table format']['top rows']) {
				topRows = this.subSectionConfig['table format']['top rows'];
			} else {
				topRows = Object.keys(this.subSectionData[0]);
			}
			return topRows;
		},
		formatValue(tdValue, tdKey) {
			let content;
			let tableFormat = this.subSectionConfig['table format']

			if (
				!!tableFormat &&
				!!tableFormat["column formatting"] &&
				!!tableFormat["column formatting"][tdKey]
			) {

				let types = tableFormat["column formatting"][tdKey].type;

				if (!!types.includes("kp phenotype link")) {
					content = this.utils.Formatters.BYORColumnFormatter(
						tdValue,
						tdKey,
						tableFormat,
						this.phenotypeMap,
						null
					);
				} else {
					content = this.utils.Formatters.BYORColumnFormatter(
						tdValue,
						tdKey,
						tableFormat,
						null,
						null
					);
				}

			} else {
				content = tdValue;
			}

			return content;
		},
	},
});

$(function () { });
</script>
<style scoped>
.sub-section-header {
	color: #ffffff;
	padding: 2px 0px;
}
.subsection-table, .sub-plot-wrapper{
	width: calc(100% - 20px);
	margin-left: 20px;
	background-color: #eeeeee;
	margin-bottom: 1px !important;
}

.sub-plot-wrapper {
	background-color: #ffffff !important;
}

.sub-tab-ui-wrapper {
    border-bottom: solid 1px #ddd;
    padding: 25px 25px 0px 25px;
	margin :0 !important;
}

.plot-tab-content-wrapper {
	padding-top: 25px;
}

.star-items-options {
	display: none;
    position: absolute;
    background-color: #ffffff;
    padding: 10px;
    border: solid 1px #dddddd;
    border-radius: 5px;
    z-index: 10;
    top: 0;
    left: 20px;
	text-align: left;
	white-space: nowrap;
}

.star-items-options ul {
	list-style: none;
	padding: 0;
	margin: 0;
}
.star-items-control:hover .star-items-options {
	display: block;
}

.subsection-table tr{
	border-bottom: solid 1px 
}

.subsection-table td {
	position: relative;
}

.subsection-table td .copy-to-clipboard {
	font-size: 10px;
    padding: 0 2px;
    position: absolute;
    top: 0px;
    right: 0px;
	opacity: 0.3;
	border-radius: 0;
}

.subsection-table td:hover .copy-to-clipboard {
	opacity: 1;
}

.egl-table-page-ui-wrapper {
	margin-top: 10px !important;
}

.subsection-page-ui-left, .subsection-page-ui-center, .subsection-page-ui-right{
	width: 33%;
	display: inline-block;
}
.subsection-page-ui-left {
	text-align: left;
}

.subsection-page-ui-center {
	text-align: center;
}

.subsection-page-ui-right {
	text-align: right;
}
</style>
