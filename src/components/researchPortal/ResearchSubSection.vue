<template>
	<div>
		<div class="sub-section-header"><strong v-if="!!subectionConfig['label']">{{ subectionConfig['label'] }}</strong></div>
		<div v-if="!!subectionConfig['visualizers'] && (subectionConfig['visualizers']['wrapper type'] == 'tabs' || subectionConfig['visualizers']['wrapper type'] == 'divs')"  class="sub-plot-wrapper">
			<div class="sub-tab-ui-wrapper" :id="'tabUiGroup' + rowId">
				<div v-for="tab, tabIndex in subectionConfig['visualizers']['visualizers']" :id="'tabUi' + rowId + tabIndex"
					class="tab-ui-tab" :class="tabIndex == 0 ? 'active' : ''" @click="utils.uiUtils.setTabActive('tabUi' + rowId + tabIndex,
						'tabUiGroup' + rowId,
						'tabContent' + rowId + tabIndex, 'tabContentGroup' + rowId, true)">
					{{ tab.label/*utils.Formatters.replaceWithParams(tab.label, pageParams)*/ }}
				</div>
			</div>

			<div :id="subectionConfig['visualizers']['wrapper type'] == 'tabs' ? 'tabContentGroup' + rowId : ''"
			>

				<div v-for="plotConfig, plotIndex in subectionConfig['visualizers']['visualizers']"
					:id="subectionConfig['visualizers']['wrapper type'] == 'tabs' ? 'tabContent' + rowId + plotIndex : ''"
					class="plot-tab-content-wrapper"
					:class="(subectionConfig['visualizers']['wrapper type'] == 'tabs') ? (plotIndex == 0) ? '' : 'hidden-content' : ''">
					<h6 v-html="plotConfig.label" v-if="subectionConfig['visualizers']['wrapper type'] != 'tabs'"></h6>
					<research-section-visualizers 
						:plotConfig="plotConfig"
						:plotData="subsectionData"
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
			
		<div v-if="!!subectionConfig['visualizer']" class="sub-plot-wrapper">
			<research-section-visualizers 
				:plotConfig="subectionConfig['visualizer']"
				:plotData="subsectionData"
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
					<th v-for="head in getTopRows()">
						<span>{{ head }}</span>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in subPageData">
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
							<span>{{ "Total rows: "+ subsectionData.length }}</span>
							</b-container>
						<b-container
							class="egl-table-page-ui-wrapper subsection-page-ui-center"
						>
							<b-pagination
								class="pagination-sm justify-content-center"
								v-model="currentPage"
								:total-rows="subsectionData.length"
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
									@click="convertJson2Csv(subsectionData, rowId + '_subsection')"
								>
									CSV
								</div>
								<div
									class="convert-2-csv btn-sm"
									@click="saveJson(subsectionData, rowId + '_subsection')"
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
	props: ["sectionId","rowId","subectionConfig", "subsectionData","phenotypeMap","utils","colors","plotMargin"],
	components: {
		ResearchSectionVisualizers,
		ResearchSectionComponents,
	},
	data() {
		return {
			currentData:null,
			currentPage: 1,
			numberOfRows: 10,
		};
	},
	modules: {
	},
	created() {

	},
	mounted() {
		console.log("from mount");
		this.filterData();
	},
	computed: {
		subPageData() {
			let pageData = [];
			let rows = this.subsectionData.length;

			let startIndex = (this.currentPage - 1) * this.numberOfRows;
			let endIndex =
				rows - this.currentPage * this.numberOfRows > 0
					? this.currentPage * this.numberOfRows
					: rows;

			for (let i = startIndex; i < endIndex; i++) {
				if (!!this.subsectionData[i]) {
					pageData.push(this.subsectionData[i]);
				}
			}

			return pageData;
		},
		tableFormat() {
			if (!!this.subectionConfig['table format']) {
				return this.subectionConfig['table format'];
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
		filterData() {
			const filterConfig = this.$parent.$parent.sectionConfig.filters;
			const filtersIndex = this.$parent.$parent.filtersIndex;
			const filterValues = this.$parent.$parent.filterValues;

			console.log("filterConfig",filterConfig)
			console.log("filtersIndex",filtersIndex)
			console.log("filterValues",filterValues)

			const rawData = this.subsectionData;

			this.currentData = [];


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
						case "dropdown":
							search ===
							row[
								searchIndex.field
							].toString()
								? tempFiltered.push(row)
								: "";

							break;
						case "search":
							row[searchIndex.field]
								.toLowerCase()
								.includes(
									search.toLowerCase()
								)
								? tempFiltered.push(row)
								: "";
							break;
						case "search exact":
							search.toLowerCase() ===
							row[searchIndex.field]
								.toString()
								.toLowerCase()
								? tempFiltered.push(row)
								: "";

							break;
						case "dropdown word":
							row[searchIndex.field]
								.toLowerCase()
								.includes(
									search.toLowerCase()
								)
								? tempFiltered.push(row)
								: "";

							break;

						case "search greater than":
							typeof row[searchIndex.field] == 'number' && row[searchIndex.field] >= search
								? tempFiltered.push(row)
								: "";
							break;
						case "search lower than":
						typeof row[searchIndex.field] == 'number' && row[searchIndex.field] <= search
								? tempFiltered.push(row)
								: "";

							break;
						case "search or":
							searchVals = search.split(",");

							typeof row[searchIndex.field] == 'number' && (row[searchIndex.field] <=
								searchVals[0].trim() ||
							row[searchIndex.field] >=
								searchVals[1].trim())
								? tempFiltered.push(row)
								: "";
							break;
						case "search change direction":
							let searchDirection =
								document.getElementById(
									"filter_" + this.sectionId +
										this.getColumnId(
											searchIndex.field
										) +
										"_direction"
								).value;

							searchDirection == "lt"
								? row[searchIndex.field] <=
									search
									? tempFiltered.push(row)
									: ""
								: searchDirection == "gt"
								? row[searchIndex.field] >=
									search
									? tempFiltered.push(row)
									: ""
								: "";

							break;

						case "search and":
							searchVals = search.split(",");

							typeof row[searchIndex.field] == 'number' && (row[searchIndex.field] >=
								searchVals[0].trim() &&
							row[searchIndex.field] <=
								searchVals[1].trim())
								? tempFiltered.push(row)
								: "";
							break;

						case "slider":
							searchVals = search.split(",");

							typeof row[searchIndex.field] == 'number' && (row[searchIndex.field] >=
								searchVals[0].trim() &&
								row[searchIndex.field] <=
								searchVals[1].trim())
								? tempFiltered.push(row)
								: "";

							break;
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

			if(!!this.subectionConfig['table format'] && !!this.subectionConfig['table format']['top rows']) {
				topRows = this.subectionConfig['table format']['top rows'];
			} else {
				topRows = Object.keys(this.subsectionData[0]);
			}
			return topRows;
		},
		formatValue(tdValue, tdKey) {
			let content;
			let tableFormat = this.subectionConfig['table format']

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
