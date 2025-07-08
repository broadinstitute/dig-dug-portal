<template>
	<div class="byor-single-search-wrapper">
		<!-- <input class="form-control byor-single-search" type="text" id="byor_single_search" v-model="singleSearchParam"
			:placeholder="!!multiSearchConfig && !!multiSearchConfig['search instruction'] ? multiSearchConfig['search instruction']
				: 'Search gene, variant, region, phenotype, or tissue'" @keyup.enter="onSearch" /> -->
        <input class="form-control byor-single-search" type="text" id="byor_single_search" v-model="singleSearchParam"
			:placeholder="!!multiSearchConfig && !!multiSearchConfig['search instruction'] ? multiSearchConfig['search instruction']: 'Search gene'"
			@keyup.enter="onSearch" />
		
		<!-- For KP front pages -->
        <input type="hidden" :value="multiSearchResult" @input="$emit('update:multiSearchResult', $event.target.value)" >
        <div>Gene list:
			<b-badge
				pill
				v-for="gene in multiSearchResult"
				:key="gene"
				:class="`btn filter-pill-gene`"
				:style="{
					'background-color': `green`,
				}"
				@click="unset(gene)"
			>
				{{gene}}
				<span class="remove">X</span>
			</b-badge>
			<!-- <b-btn v-if="!!multiSearchResult" class="btn btn-default" @click="resetSearch()"><b-icon
				icon="x-circle-fill"></b-icon></b-btn> -->
				
			</div>
		
		<div class="byor-single-search-results-wrapper" v-if="!multiSearchConfig">
			<div id="byor_single_search_results" class="byor-single-search-results" v-if="singleSearchResult.genes.length > 0">
				<div v-for="gene in singleSearchResult.genes" :key="gene" class="single-search-option">
					{{ gene
					}}<span class="search-word-group">
                        <a class="search-gene-link" @click="addGene(gene)"
							href="javascript:;">{{ "Add gene to search list"
							}}<span class="gene-link-tip">Alias names are converted to gene symbols</span></a>
                        </span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import { match } from "@/utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import alertUtils from "@/utils/alertUtils";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("research-multi-search", {
	props: ["multiSearchConfig", "phenotypes", "utils"], //, "multiSearchResult"
	modules: {},

	data() {
		return {
			singleSearchParam: null,
			singleSearchResult: {
				genes: [],
				//phenotypes: [],
				//tissues: [],
				//diseases: []
			},
			customList: {},
			multiSearchResult: [],
		};
	},
	created() {
		console.log("multi search created");
		if (!!this.multiSearchConfig && !!this.multiSearchConfig["search parameters"]) {
			this.multiSearchConfig["search parameters"].map(S => {
				if (!!S["data point"]) {
					let listPoint = S["data point"];
					this.getList(
						S["parameter"],
						listPoint["url"],
						listPoint["data type"],
						listPoint["data wrapper"]
					)
				}
			})
		} else {
			//this.getTissues();
		}
	},
	mounted() { },
	computed: {},
	watch: {
		singleSearchParam(PARAM) {
			if (!!PARAM && PARAM.length >= 2) {

				// in case there is custom searchConfig, make sure kp gene search is there. Otherwise, gene search is active in default.
				if (!!this.multiSearchConfig && !!this.multiSearchConfig["search parameters"]) {

					let isKpGenes = null;

					this.multiSearchConfig["search parameters"].map(S => {
						if (!!S["values"] && S["values"] == "kp genes") {
							isKpGenes = true
						}
					})

					if (!!isKpGenes) { this.lookupGenes(PARAM); }

				} else {

					this.lookupGenes(PARAM);
				}

				let paramWords = PARAM.split(" ");
				//let searchPhenotypes = [];

				/*this.phenotypes.map((p) => {
					let isInPhenotype = 0;
					paramWords.map((w) => {
						if (
							!!p.description
								.toLowerCase()
								.includes(w.toLowerCase())
						) {
							isInPhenotype++;
						}
					});

					if (isInPhenotype == paramWords.length) {
						searchPhenotypes.push(p);
					}
				});*/

				//let shorterFirst = searchPhenotypes.sort((a, b) => a.name.length - b.name.length);

				//this.singleSearchResult.phenotypes = shorterFirst;

				/// for custom parameters
				let searchFields = Object.keys(this.customList);

				searchFields.map(P => {
					let searchItems = [];
					this.customList[P].map(item => {
						let isInList = 0;
						paramWords.map((w) => {
							if (
								!!item.label
									.toLowerCase()
									.includes(w.toLowerCase())
							) {
								isInList++;
							}
						});

						if (isInList == paramWords.length) {
							searchItems.push(item);
						}
					})
					this.singleSearchResult[P] = searchItems;
				})
			} else {
				this.singleSearchResult.genes = [];
				//this.singleSearchResult.phenotypes = [];
				let searchFields = Object.keys(this.customList);

				searchFields.map(P => {
					this.singleSearchResult[P] = [];
				})
			}
		},
	},
	methods: {
		...alertUtils,
		resetSearch() {
			console.log("reset search called");
			this.multiSearchResult =[];
		},
		unset(gene) {
			let idx = this.multiSearchResult.indexOf(gene);
			if (idx > -1) { // only splice array when item is found
				this.multiSearchResult.splice(idx, 1); // 2nd parameter means remove one item only
			}
		},
		anyResults() {
			let parameters = Object.keys(this.singleSearchResult)

			let totalResults = 0;
			parameters.map(p => {
				totalResults += this.singleSearchResult[p].length;
			})

			return totalResults;
		},
		onSearch() {
			let searchKey = this.singleSearchParam.replace(/,/g, "").trim();
			if (
				!!this.singleSearchParam.includes("rs") ||
				!!this.singleSearchParam.includes(":")
			) {
				if (!!this.singleSearchParam.includes("-")) {
					let chr = searchKey.split(":")[0];
					let region = searchKey.split(":")[1].split("-");

					let regionPageUrl =
						"/region.html?chr=" +
						chr +
						"&end=" +
						region[1] +
						"&start=" +
						region[0];

					this.singleSearchParam = "";
					location.href = regionPageUrl;
				} else {
					location.href = "/variant.html?variant=" + searchKey;
				}
			} else if (
				!!this.singleSearchParam.includes("_") &&
				!!this.singleSearchParam.includes("-")
			) {
				//on search for a variant in chr3_12489012-C-T format
				location.href = "/variant.html?variant=" + searchKey;
			} else {
				let anyResults = this.anyResults();

				if (anyResults === 0) {
					alertUtils.popAlert("Your search term was not found. Please try again.")
				} else if (anyResults === 1) {

					let reDirectUrl;

					if (!this.multiSearchConfig) {

						for (const [sKey, sValue] of Object.entries(this.singleSearchResult)) {
							if (sValue.length == 1) {
								switch (sKey) {
									case 'phenotypes':
										reDirectUrl = "/phenotype.html?phenotype=" + sValue[0].name;
										break;
									case 'genes':
										reDirectUrl = "/gene.html?gene=" + sValue[0];
										break;
									case 'tissues':
										reDirectUrl = "/tissue.html?tissue=" + sValue[0].value;
										break;
									case 'diseases':
										reDirectUrl = "/disease.html?disease=" + sValue[0].value;
										break;
								}
							}
						}

						location.href = reDirectUrl;
					}

				} else if (anyResults > 1) {
					alertUtils.popAlert("Multiple search options are available. Please select one from the list.")
				}
			}
		},
		isParameterActive(PARAM) {
			let returnParam = { active: null, url: '' };

			if (!!this.multiSearchConfig) {
				this.multiSearchConfig["search parameters"].map(param => {
					if (param.values == PARAM) {
						returnParam.active = true;
						if (!!param['target page']['page id']) {
							returnParam.url = '/research.html?pageid='
								+ param['target page']['page id'];
						} else if (!!param['target page']['url']) {
							returnParam.url = param['target page']['url'];
						}

						returnParam.url += (!!param['target page']['entity']) ? '&' + param['target page']['entity parameter'] + '=' + param['target page']['entity'] : "";

						if (!!param['target page']['page id']) {
							returnParam.url += '&' + param['parameter'] + '=';
						} else if (!!param['target page']['url']) {
							returnParam.url += param['parameter'] + '=';
						}

					} else {
						if (param.parameter == PARAM) {
							returnParam.active = true;
							if (!!param['target page']['page id']) {
								returnParam.url = '/research.html?pageid='
									+ param['target page']['page id'];
							} else if (!!param['target page']['url']) {
								returnParam.url = param['target page']['url'];
							}

							returnParam.url += (!!param['target page']['entity']) ? '&' + param['target page']['entity parameter'] + '=' + param['target page']['entity'] : "";

							if (!!param['target page']['page id']) {
								returnParam.url += '&' + param['parameter'] + '=';
							} else if (!!param['target page']['url']) {
								returnParam.url += param['parameter'] + '=';
							}
						}
					}
				})
			}

			return returnParam;

		},
		async getList(PARAM, URL, TYPE, WRAPPER) {
			if (!!URL) {

				let paramList = await fetch(URL).then((resp) => resp.json());
				let list;

				if (paramList.error == null) {

					if (typeof paramList == "string") {
						paramList = (TYPE == "json") ? JSON.parse(paramList) : (TYPE == "csv") ? this.utils.dataConvert.csv2Json(paramList) : paramList;
					}
					if (!!WRAPPER) {

						let dataEntity = paramList;

						WRAPPER.map(w => {
							dataEntity = dataEntity[w];
						})

						if (typeof dataEntity == "string") {
							dataEntity = (TYPE == "json") ? JSON.parse(dataEntity) : (TYPE == "csv") ? this.utils.dataConvert.csv2Json(dataEntity) : dataEntity;
						}

						//console.log("dataEntity", PARAM, typeof dataEntity)

						let values = [];

						if (dataEntity.length > 0) {
							dataEntity.map(item => {
								if (typeof item == 'string' || typeof item == 'number') {
									values.push({ "label": item, "value": item })
								} else if (typeof item == 'object' && !!Array.isArray(item)) {
									values.push({ "label": item[0], "value": item[0] })
								} else if (typeof item == 'object' && !Array.isArray(item)) {
									values.push(item);
								}
							})
						}


						//list = dataEntity;

						list = values;

					} else {
						list = paramList
					}
					this.customList[PARAM] = list;

				} else {
					console.log("there is an error");
				}
			}

		},
        addGene(gene) {
			if (!this.multiSearchResult){
				console.log("add gene multisearchresult null");
				this.multiSearchResult = [];
			}
            if (!this.multiSearchResult.includes(gene)){
                this.multiSearchResult.push(gene);
            }
            this.singleSearchParam = null;

			let keys = Object.keys(this.singleSearchResult);

			keys.map(key => {
				this.singleSearchResult[key] = [];
			})
        },
        getValue() {
            return this.multiSearchResult;
        },
		async searchGene(KEY) {

			let geneSymbol = await this.utils.regionUtils.geneSymbol(KEY);
			let isCustomGene = this.isParameterActive('kp genes');

			if (geneSymbol) {

				let genePageUrl;

				if (!isCustomGene.active) {
					genePageUrl = "/gene.html?gene=" + geneSymbol;
				} else if (!!isCustomGene.active) {
					genePageUrl = isCustomGene.url + geneSymbol;
				}

				location.href = genePageUrl;
			}
		},
        async lookupGenes(input) {
			let matches = await match("gene", input, { limit: 10 });
			this.singleSearchResult.genes = matches;
		},
	},
});
</script>

<style scoped>
/* alert UI */


.reset-search {
	position: absolute;
	top: 4px;
	right: 4px;
	color: #999999;
	font-size: 14px;
}

.reset-search:hover {
	color: #333333;
}

.byor-single-search-wrapper {
	width: 100%;
}

.byor-single-search {
	width: 100%;
	margin-left: auto;
	margin-right: auto;
}

.byor-single-search-results-wrapper {
	position: relative;
	margin-left: auto;
	margin-right: auto;
}

.byor-single-search-results {
	position: absolute;
	width: 100%;
	background-color: #fff;
	font-size: 14px;
	z-index: 100;
	padding: 10px 15px;
	border-radius: 0.25rem;
	box-shadow: 10px 10px 10px 10px rgba(0, 0, 0, 0.2);
	overflow-y: scroll;
	max-height: 500px;
	text-align: left;
}

.single-search-option:hover {
	border-bottom: solid 2px #dddddd;
	margin-bottom: -2px;
}

.search-word-group {
	color: #cccccc;
	font-size: 12px;
	display: block;
	float: right;
}

.search-gene-link {
	position: relative;
}

.search-gene-link .gene-link-tip {
	display: none;
	position: absolute;
	text-decoration: none;
	white-space: nowrap;
	background-color: #00000099;
	color: #ffffff !important;
	font-size: 12px;
	padding: 0px 4px;
	border-radius: 5px;
	top: -3px;
	left: -220px;
}

.search-gene-link:hover .gene-link-tip {
	display: block;
}
</style>