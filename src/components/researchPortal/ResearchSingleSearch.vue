<template>
	<div>
		<input type="text" id="kp_single_search" v-model="singleSearchParam" />
		<div id="single_search_results">
			<div v-for="gene in singleSearchResult.genes" :key="gene">
				{{ gene }}{{ " gene" }}
			</div>
			<div
				v-for="phenotype in singleSearchResult.phenotypes"
				:value="phenotype.name"
				:key="phenotype.name"
			>
				{{ phenotype.description }}{{ phenotype.group }}
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
</style>
