<template>
	<div class="byor-single-search-wrapper">
		<input
			class="form-control byor-single-search"
			type="text"
			id="byor_single_search"
			v-model="singleSearchParam"
			:placeholder="!!singleSearchConfig && !!singleSearchConfig['search instruction']? singleSearchConfig['search instruction'] 
			:'Search gene, variant, region, phenotype, or tissue'"
			@keyup.enter="onSearch"
		/>
		<!-- BYOR front page templates -->
		<div class="byor-single-search-results-wrapper" v-if="!!singleSearchConfig">

			<div
				id="byor_single_search_results"
				class="byor-single-search-results"
				v-if="anyResults() > 0"
			>
				<div v-for="gene in singleSearchResult.genes" :key="gene" class="single-search-option">
					{{ gene
					}}<span class="search-word-group"
						><a v-if="!!isParameterActive('kp genes').active"
							class="search-gene-link"
							@click="searchGene(gene)"
							href="javascript:;"
							>{{ "Search gene"
							}}<span class="gene-link-tip"
								>Alias names are converted to gene symbols</span
							></a
						>
						<span v-if="!!isParameterActive('kp region').active">|</span>
						<a v-if="!!isParameterActive('kp region').active" 
							@click="searchRegion(gene)" href="javascript:;">{{
							"Search region"
						}}</a></span
					>
				</div>
				<template v-if="!!isParameterActive('kp phenotypes').active">
					<div
						v-for="phenotype in singleSearchResult.phenotypes"
						:value="phenotype.name"
						:key="phenotype.name"
						 class="single-search-option"
					>
						<a :href="isParameterActive('kp phenotypes').url + phenotype.name">{{
							phenotype.description
						}}</a
						><span class="search-word-group">{{
							phenotype.group
						}}</span>
					</div>
				</template>

				<template v-for="param in singleSearchConfig['search parameters']">
					<template v-if="!param.values || (!!param.values && param.values != 'kp genes' && param.values != 'kp phenotypes') ">
						
						<template v-if="!!isParameterActive(param['parameter']).active">
							<div
								v-for="item in singleSearchResult[param['parameter']]"
								:value="item.value"
								:key="item.value"
								 class="single-search-option"
							>{{ item.label }}
								<a :href="isParameterActive(param['parameter']).url + item.value" class="search-word-group">{{
									'Search '+param['parameter']
								}}</a
								>
							</div>
						</template>
					</template>
				</template>
			</div>
		</div>
		<!-- For KP front pages -->
		<div class="byor-single-search-results-wrapper" v-if="!singleSearchConfig">
			<div
				id="byor_single_search_results"
				class="byor-single-search-results"
				v-if="
					singleSearchResult.genes.length > 0 ||
					singleSearchResult.phenotypes.length > 0
				"
			>
				<div v-for="gene in singleSearchResult.genes" :key="gene" class="single-search-option">
					{{ gene
					}}<span class="search-word-group"
						><a
							class="search-gene-link"
							@click="searchGene(gene)"
							href="javascript:;"
							>{{ "Search gene"
							}}<span class="gene-link-tip"
								>Alias names are converted to gene symbols</span
							></a
						>
						|
						<a @click="searchRegion(gene)" href="javascript:;">{{
							"Search region"
						}}</a></span
					>
				</div>

				<div
						v-for="tissue in singleSearchResult.tissues"
						:value="tissue.value"
						:key="tissue.value"
						 class="single-search-option"
					>
					<a :href="'/tissue.html?tissue=' + tissue.value">{{
						tissue.label
					}}</a><span class="search-word-group">{{
						'Tissue'
					}}</span>
				</div>

				<div
					v-for="phenotype in singleSearchResult.phenotypes"
					:value="phenotype.name"
					:key="phenotype.name"
					 class="single-search-option"
				>
					<a :href="'/phenotype.html?phenotype=' + phenotype.name">{{
						phenotype.description
					}}</a
					><span class="search-word-group">{{
						phenotype.group
					}}</span>
				</div>
			</div>
		</div>
		<!--  -->
	</div>
</template>

<script>
import Vue from "vue";
import { match } from "@/utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

export default Vue.component("research-single-search", {
	props: ["singleSearchConfig", "phenotypes","utils"],
	modules: {},

	data() {
		return {
			singleSearchParam: null,
			singleSearchResult: {
				genes: [],
				phenotypes: [],
				tissues: [],
				diseases: []
			},
			customList:{}
		};
	},
	created() {
		if(!!this.singleSearchConfig && !!this.singleSearchConfig["search parameters"]) {
			this.singleSearchConfig["search parameters"].map(S => {
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
			this.getTissues();
		}
	},
	mounted() {},
	computed: {},
	watch: {
		singleSearchParam(PARAM) {
			if (PARAM.length >= 2) {
				this.lookupGenes(PARAM);
				let paramWords = PARAM.split(" ");
				let searchPhenotypes = [];

				this.phenotypes.map((p) => {
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
				});

				let shorterFirst = searchPhenotypes.sort((a, b) => a.name.length - b.name.length);

				this.singleSearchResult.phenotypes = shorterFirst;

				/// for custom parameters
				let searchFields = Object.keys(this.customList);

				searchFields.map(P => {
					let searchItems = [];
					this.customList[P].map(item=>{
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
				this.singleSearchResult.phenotypes = [];
				let searchFields = Object.keys(this.customList);

				searchFields.map(P => {
					this.singleSearchResult[P] = [];
				})
			}
		},
	},
	methods: {
		async getTissues() {
			let tissues = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/gene-expression-tissue/1`)
				.then(resp => resp.json())
				.then(json => {
					if (json.count == 0) {
						return null;
					}

					return json.keys;
				});

				//return tissues;
				if(!!tissues) {
					let tissuesList = [];
					tissues.map(tissue =>{
						let labelString = tissue[0].charAt(0).toUpperCase() + tissue[0].slice(1);
						let tempObj = {label: labelString.replace("_"," "),value: tissue[0]};

						tissuesList.push(tempObj)
					});
					this.customList["tissues"] = tissuesList;
				}
		},
		anyResults() {
			let parameters = Object.keys(this.singleSearchResult) 

			let totalResults = 0;
			parameters.map(p=>{
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
			}
		},
		isParameterActive(PARAM) {
			let returnParam = {active: null, url:''};

			if(!!this.singleSearchConfig) {
				this.singleSearchConfig["search parameters"].map(param =>{
					if(param.values == PARAM) {
						returnParam.active = true;
						returnParam.url = '/research.html?pageid='
							+param['target page']['page id'];
						returnParam.url += (!!param['target page']['entity'])? '&' + param['target page']['entity parameter'] + '='+param['target page']['entity']:"";
						returnParam.url += '&'+param['parameter']+'=';
					} else {
						if(param.parameter == PARAM) {
							returnParam.active = true;
							returnParam.url = '/research.html?pageid='
								+ param['target page']['page id'];
							returnParam.url += (!!param['target page']['entity']) ? '&' + param['target page']['entity parameter'] + '=' + param['target page']['entity'] : "";
							returnParam.url += '&' + param['parameter'] + '=';
						}
					}
				})
			}

			return returnParam;

		},
		async getList( PARAM,URL,TYPE,WRAPPER) {
			if(!!URL) {
				
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

						list = dataEntity;

					} else {
						list = paramList
					}
					this.customList[PARAM] = list;

				} else {
					console.log("there is an error");
				}
			}
			
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

		async searchRegion(KEY) {
			let region = await this.utils.regionUtils.parseRegion(KEY, true, 50000);
			let isCustomRegion = this.isParameterActive('kp region');

			if (region) {
				let regionPageUrl;

				if(!isCustomRegion.active) {
					regionPageUrl =
						"/region.html?chr=" +
						region.chr +
						"&end=" +
						region.end +
						"&start=" +
						region.start;
				} else if(!!isCustomRegion.active) {
					regionPageUrl = isCustomRegion.url +=
						region.chr +
						":" +
						region.start +
						"-" +
						region.end;
				}

				location.href = regionPageUrl;
			}
		},

		async lookupGenes(input) {
			let matches = await match("gene", input, { limit: 10 });
			this.singleSearchResult.genes = matches;
		},
	},
});
</script>

<style>
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
