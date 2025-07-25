<template>
	<div>
		<div class="sub-tab-ui-wrapper" :id="'byoglTabUiGroup'+ sectionId + rowId">
			<div 
				v-if="!!tableFormat.features.includes('genes in list')"
				:id="'byoglTabUi'+ sectionId + rowId + '0'" class="tab-ui-tab active" 
				@click="utils.uiUtils.setTabActive('byoglTabUi'+ sectionId + rowId + '0',
					'byoglTabUiGroup'+ sectionId + rowId,
					'byoglTabContent'+ sectionId + rowId + '0', 'byoglTabContentGroup' + sectionId + rowId)">
				Genes predicted to be in your gene list</div>
			<div 
				v-if="!!tableFormat.features.includes('cfde gene set')"
				:id="'byoglTabUi'+ sectionId + rowId + '1'" class="tab-ui-tab" 
				@click="utils.uiUtils.setTabActive('byoglTabUi'+ sectionId + rowId + '1',
					'byoglTabUiGroup'+ sectionId + rowId,
					'byoglTabContent'+ sectionId + rowId + '1', 'byoglTabContentGroup' + sectionId + rowId)">
				CFDE gene sets that predict membership in your gene list</div>
			<div 
				v-if="!!tableFormat.features.includes('human traits')"
				:id="'byoglTabUi'+ sectionId + rowId + '2'" class="tab-ui-tab" 
				@click="utils.uiUtils.setTabActive('byoglTabUi'+ sectionId + rowId + '2',
					'byoglTabUiGroup'+ sectionId + rowId,
					'byoglTabContent'+ sectionId + rowId + '2', 'byoglTabContentGroup' + sectionId + rowId)">
				Human traits that share genes with your input list</div>
		</div>

		
		<div :id="'byoglTabContentGroup' + sectionId + rowId">
			<div v-if="!!geneScores"
				:id="'byoglTabContent'+ sectionId + rowId + '0'"
				class="tab-content-wrapper">
				<table class="table table-sm table-striped research-data-table subsection-table">
					<thead>
						<tr>
							<th>
								Gene
							</th>
							<th>
								Predicted probability
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(row, rowIndex) in getSubPageData(geneScores,tab0Page)">
							<td>{{ row['gene'] }}</td>
							<td>{{ utils.Formatters.pValueFormatter(row['score']) }}</td>
						</tr>
						<tr>
							<td colspan="2">
							<b-container
								class="egl-table-page-ui-wrapper subsection-page-ui-left"
							>
								<span>{{ "Total rows: "+ geneScores.length }}</span>
								</b-container>
							<b-container
								class="egl-table-page-ui-wrapper subsection-page-ui-center"
							>
								<b-pagination
									class="pagination-sm justify-content-center"
									v-model="tab0Page"
									:total-rows="geneScores.length"
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
											@click="convertJson2Csv(geneScores, rowId + '_geneScores')"
										>
											CSV
										</div>
										<div
											class="convert-2-csv btn-sm"
											@click="saveJson(geneScores, rowId + '_geneScores')"
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
			<div v-if="!!geneSetScores"
				:id="'byoglTabContent'+ sectionId + rowId + '1'"
				class="tab-content-wrapper hidden-content">
				<table class="table table-sm table-striped research-data-table subsection-table">
					<thead>
						<tr>
							<th>
								Gene set
							</th>
							<th>
								Marginal effect
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(row, rowIndex) in getSubPageData(geneSetScores,tab1Page)">
							<td>{{ row['geneSet'] }}</td>
							<td>{{ utils.Formatters.pValueFormatter(row['score']) }}</td>
						</tr>
						<tr>
							<td colspan="2">
							<b-container
								class="egl-table-page-ui-wrapper subsection-page-ui-left"
							>
								<span>{{ "Total rows: "+ geneSetScores.length }}</span>
								</b-container>
							<b-container
								class="egl-table-page-ui-wrapper subsection-page-ui-center"
							>
								<b-pagination
									class="pagination-sm justify-content-center"
									v-model="tab1Page"
									:total-rows="geneSetScores.length"
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
											@click="convertJson2Csv(geneSetScores, rowId + '_geneSetScores')"
										>
											CSV
										</div>
										<div
											class="convert-2-csv btn-sm"
											@click="saveJson(geneSetScores, rowId + '_geneSetScores')"
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
			<div v-if="!!humanTraits"
				:id="'byoglTabContent'+ sectionId + rowId + '2'"
				class="tab-content-wrapper hidden-content">
				<table class="table table-sm table-striped research-data-table subsection-table">
					<thead>
						<tr>
							<th>
								Phenotype
							</th>
							<th>
								P-value
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(row, rowIndex) in getSubPageData(humanTraits,tab2Page)">
							<td>{{ row['phenotype'] }}</td>
							<td>{{ utils.Formatters.pValueFormatter(row['p_value']) }}</td>
						</tr>
						<tr>
							<td colspan="2">
							<b-container
								class="egl-table-page-ui-wrapper subsection-page-ui-left"
							>
								<span>{{ "Total rows: "+ humanTraits.length }}</span>
								</b-container>
							<b-container
								class="egl-table-page-ui-wrapper subsection-page-ui-center"
							>
								<b-pagination
									class="pagination-sm justify-content-center"
									v-model="tab2Page"
									:total-rows="humanTraits.length"
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
											@click="convertJson2Csv(humanTraits, rowId + '_humanTraitsScores')"
										>
											CSV
										</div>
										<div
											class="convert-2-csv btn-sm"
											@click="saveJson(humanTraits, rowId + '_humanTraitsScores')"
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
		</div>	
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

export default Vue.component("research-byogl-section", {
	props: ["sectionId","rowId","subSectionConfig", "subSectionData","phenotypeMap","utils","colors","starItems","plotMargin","multiSectionPage"],
	components: {
	},
	data() {
		return {
			currentData:null,
			tab0Page: 1,
			tab1Page: 1,
			tab2Page: 1,
			numberOfRows: 10,
			stared: false,
			staredAll: false,
			geneScores: null,
			geneSetScores: null,
			humanTraits: null,
		};
	},
	modules: {
	},
	created() {
		this.currentData = this.subSectionData;

		if(!!this.subSectionConfig["share parent filters"]) {
			this.filterData()
		}
	},
	mounted() {
		
		this.getByoglData(this.customGeneSet)
	},
	computed: {
		customGeneSet() {
			let genes = [...new Set(this.currentData.map(G => G[this.tableFormat['genes']]))];

			return genes;
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

			this.currentData = this.subSectionData;

			if(!!this.subSectionConfig["share parent filters"]) {
				this.filterData()
			}
		}
	},
	methods: {
		getSubPageData(DATA, PAGE) {
			let pageData = [];
			let rows = DATA.length;

			let startIndex = (PAGE - 1) * this.numberOfRows;
			let endIndex =
				rows - PAGE * this.numberOfRows > 0
					? PAGE * this.numberOfRows
					: rows;

			for (let i = startIndex; i < endIndex; i++) {
				if (!!DATA[i]) {
					pageData.push(DATA[i]);
				}
			}

			return pageData;
		},
		async fetchApi(header,body,URL) {
			
			const response = await fetch(URL, {
				method: 'POST',
				headers: header,
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}

			return response.json();
		},
		getByoglData(GENES) {

			let geneScoresURL = "https://translator.broadinstitute.org/genetics_provider/bayes_gene/gene_scores";
			let humanTraitsURL = "https://translator.broadinstitute.org/genetics_provider/bayes_gene/phenotypes";
			let header = {
				"Content-Type": "application/json"
			}

			let geneScoresBody = {
				"p_value": "0.05",
				"max_number_gene_sets": 150,
				"gene_sets": "cfde",
				"genes": GENES
				}

			let humanTraitsBody = {
				"max_number_gene_sets": 150,
				"genes": GENES
				}

			this.fetchApi(header,geneScoresBody,geneScoresURL)
				.then(data => {
					let geneScores = [];
					Object.keys(data['gene_scores']).map(geneKey => {
						geneScores.push({gene: geneKey, score: data['gene_scores'][geneKey]});
					})
					this.geneScores = geneScores;

					let geneSetScores = [];
					Object.keys(data['gene_set_scores']).map(geneSetKey => {
						geneSetScores.push({geneSet: geneSetKey, score: data['gene_set_scores'][geneSetKey]});
					})

					this.geneSetScores = geneSetScores
				})
				.catch(error => console.error('Error fetching GraphQL:', error));

			this.fetchApi(header,humanTraitsBody,humanTraitsURL)
				.then(data => {
					this.humanTraits = data['phenotypes'];
				})
				.catch(error => console.error('Error fetching GraphQL:', error));

		},
		getColumns(ID) {
			let item = this.currentData.filter(p => p[this.tableFormat["star column"]] == ID)[0];
			return item;
		},
		starAll() {

			if(this.staredAll == true) {
				this.staredAll = false;

				if (!!this.multiSectionPage) {

					let stard = [...new Set(this.starItems)]

					stard = stard.filter(s => s.section != this.sectionId + "_" + this.rowId);

					this.$parent.$emit('on-star', stard);
				} 

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
				}

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
			}
		},
		removeStar(ITEM) {
			let value = ITEM[this.tableFormat["star column"]];
			if (!!this.multiSectionPage) {
				let stard = [...new Set(this.starItems)].filter(s => s.id != value);
				this.$parent.$emit('on-star', stard);
			}
		},
		checkStared(WHERE, ITEM) {
			if (!!ITEM) {
				let selectedItems;

				if(!!this.multiSectionPage) {
					selectedItems = this.starItems
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
		formatValue(tdValue, tdKey, rowValue) {
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
						null,
						rowValue
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
