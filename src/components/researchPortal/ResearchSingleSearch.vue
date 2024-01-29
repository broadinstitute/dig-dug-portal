<template>
	<div class="byor-single-search-wrapper">
		<input
			class="form-control byor-single-search"
			type="text"
			id="byor_single_search"
			v-model="singleSearchParam"
			:placeholder="!!singleSearchConfig && !!singleSearchConfig['search instruction']? singleSearchConfig['search instruction'] 
			:'Search gene, variant, region or phenotype'"
			@keyup.enter="onSearch"
		/>
		<!-- BYOR front page templates -->
		<div class="byor-single-search-results-wrapper" v-if="!!singleSearchConfig">
			<div
				id="byor_single_search_results"
				class="byor-single-search-results"
				v-if="singleSearchResult.genes.length > 0 ||
					singleSearchResult.phenotypes.length > 0
					"
			>
				<div v-for="gene in singleSearchResult.genes" :key="gene">
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
					>
						<a :href="isParameterActive('kp phenotypes').url + phenotype.name">{{
							phenotype.description
						}}</a
						><span class="search-word-group">{{
							phenotype.group
						}}</span>
					</div>
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
				<div v-for="gene in singleSearchResult.genes" :key="gene">
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
					v-for="phenotype in singleSearchResult.phenotypes"
					:value="phenotype.name"
					:key="phenotype.name"
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

export default Vue.component("research-single-search", {
	props: ["singleSearchConfig", "phenotypes","utils"],
	modules: {},

	data() {
		return {
			singleSearchParam: null,
			singleSearchResult: {
				genes: [],
				phenotypes: [],
				diseases: [],
				custom:{}
			},
		};
	},
	created() {},
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

				this.singleSearchResult.phenotypes = searchPhenotypes;
			} else {
				this.singleSearchResult.genes = [];
				this.singleSearchResult.phenotypes = [];
			}
		},
	},
	methods: {

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
							+param['target page']['page id']+'&'+param['parameter']+'='
					}
				})
			}

			return returnParam;

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
