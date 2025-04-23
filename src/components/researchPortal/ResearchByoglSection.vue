<template>
	<div>
		

		<div class="sub-tab-ui-wrapper" :id="'byoglTabUiGroup'+ sectionId + rowId">
			<div 
				:id="'byoglTabUi'+ sectionId + rowId + '0'" class="tab-ui-tab active" 
				@click="utils.uiUtils.setTabActive('byoglTabUi'+ sectionId + rowId + '0',
					'byoglTabUiGroup'+ sectionId + rowId,
					'byoglTabContent'+ sectionId + rowId + '0', 'byoglTabContentGroup' + sectionId + rowId)">
				Genes predicted to be in your gene list</div>
			<div 
				:id="'byoglTabUi'+ sectionId + rowId + '1'" class="tab-ui-tab" 
				@click="utils.uiUtils.setTabActive('byoglTabUi'+ sectionId + rowId + '1',
					'byoglTabUiGroup'+ sectionId + rowId,
					'byoglTabContent'+ sectionId + rowId + '1', 'byoglTabContentGroup' + sectionId + rowId)">
				CFDE gene sets that predict membership in your gene list</div>
			<div 
				:id="'byoglTabUi'+ sectionId + rowId + '2'" class="tab-ui-tab" 
				@click="utils.uiUtils.setTabActive('byoglTabUi'+ sectionId + rowId + '2',
					'byoglTabUiGroup'+ sectionId + rowId,
					'byoglTabContent'+ sectionId + rowId + '2', 'byoglTabContentGroup' + sectionId + rowId)">
				Human traits that share genes with your input list</div>
		</div>

		
		<div :id="'byoglTabContentGroup' + sectionId + rowId">
			<div 
				:id="'byoglTabContent'+ sectionId + rowId + '0'"
				class="tab-content-wrapper">{{ 'geneScores' }}</div>
			<div 
				:id="'byoglTabContent'+ sectionId + rowId + '1'"
				class="tab-content-wrapper hidden-content">{{ 'geneSetScores' }}</div>
			<div 
				:id="'byoglTabContent'+ sectionId + rowId + '2'"
				class="tab-content-wrapper hidden-content">{{ 'humanTraits' }}</div>
		</div>

		
	
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import ResearchSectionVisualizers from "@/components/researchPortal/ResearchSectionVisualizers.vue";
import ResearchSectionComponents from "@/components/researchPortal/ResearchSectionComponents.vue";

export default Vue.component("research-byogl-section", {
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

			this.currentData = this.subSectionData;

			if(!!this.subSectionConfig["share parent filters"]) {
				this.filterData()
			}
		}
	},
	methods: {
		async fetchApi(header,body,URL) {
			console.log(header,body,URL);
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

			console.log("GENES",GENES);

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
					console.log(data);
					this.geneScores = data['gene_scores'];
					this.geneSetScores = data['gene_set_scores'];
				})
				.catch(error => console.error('Error fetching GraphQL:', error));

			this.fetchApi(header,humanTraitsBody,humanTraitsURL)
				.then(data => {
					console.log(data);
					this.humanTraits = data['phenotypes'];
					//this.geneSetScores = data['gene_set_scores'];
				})
				.catch(error => console.error('Error fetching GraphQL:', error));
			
			/*const response = await fetch(URL, {
				method: 'POST',
				headers: header,
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			} else {
				let data = response.json()
				this.geneScores = data['gene_scores'];
				this.geneSetScores = data['gene_set_scores'];
				console.log(data);
			}*/

			//return response.json();

		},
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
