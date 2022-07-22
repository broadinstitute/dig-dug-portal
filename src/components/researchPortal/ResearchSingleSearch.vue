<template>
	<div class="byor-single-search-wrapper">
		<input
			class="form-control byor-single-search"
			type="text"
			id="byor_single_search"
			v-model="singleSearchParam"
			placeholder="Search"
			@keyup.enter="onSearch"
		/>
		<div class="byor-single-search-results-wrapper">
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
						><a :href="'/gene.html?gene=' + gene">{{
							"Search gene"
						}}</a>
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
	</div>
</template>

<script>
import Vue from "vue";

import uiUtils from "@/utils/uiUtils";
import { match } from "@/utils/bioIndexUtils";

export default Vue.component("research-single-search", {
	props: ["singleSearchConfig", "phenotypes"],
	modules: {},

	data() {
		return {
			singleSearchParam: null,
			singleSearchResult: {
				genes: [],
				phenotypes: [],
				diseases: [],
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
				this.singleSearchResult.phenotypes = this.phenotypes.filter(
					(p) =>
						!!p.description
							.toLowerCase()
							.includes(PARAM.toLowerCase())
				);
			} else {
				this.singleSearchResult.genes = [];
				this.singleSearchResult.phenotypes = [];
			}
		},
	},
	methods: {
		...uiUtils,

		onSearch() {
			if (
				!!this.singleSearchParam.includes("rs") ||
				!!this.singleSearchParam.includes(":")
			) {
				let searchKey = this.singleSearchParam.replace(/,/g, "");

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
			}
		},

		async searchRegion(KEY) {
			let searchPoint =
				"https://bioindex.hugeamp.org/api/bio/query/gene?q=" + KEY;

			var geneJson = await fetch(searchPoint).then((resp) => resp.json());

			if (geneJson.error == null) {
				let regionPageUrl =
					"/region.html?chr=" +
					geneJson.data[0].chromosome +
					"&end=" +
					geneJson.data[0].end +
					"&start=" +
					geneJson.data[0].start;

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
	width: 500px;

	margin-left: auto;
	margin-right: auto;
}

.byor-single-search-results-wrapper {
	position: relative;
	width: 500px;
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
}

.search-word-group {
	color: #cccccc;
	font-size: 12px;
	display: block;
	float: right;
}
</style>
