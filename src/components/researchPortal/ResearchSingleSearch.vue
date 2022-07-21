<template>
	<div class="byor-single-search-wrapper">
		<input
			class="form-control byor-single-search"
			type="text"
			id="byor_single_search"
			v-model="singleSearchParam"
			placeholder="Search"
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
					}}<span class="search-word-group">{{ "gene" }}</span>
				</div>
				<div
					v-for="phenotype in singleSearchResult.phenotypes"
					:value="phenotype.name"
					:key="phenotype.name"
				>
					{{ phenotype.description
					}}<span class="search-word-group">{{
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
}

.search-word-group {
	color: #cccccc;
	font-size: 12px;
	display: block;
	float: right;
}
</style>
