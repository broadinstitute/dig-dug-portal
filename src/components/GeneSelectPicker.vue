<template>
	<autocomplete
		:placeholder="
			!$store.state.geneToQuery ? 'Search gene' : $store.state.geneToQuery
		"
		:matches="matchingGenes"
		ref="geneSelect"
		@input-change="lookupGenes($event)"
		@item-select="selectGene($event)"
	></autocomplete>
</template>

<script>
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Autocomplete from "@/components/Autocomplete.vue";
import { match } from "@/utils/bioIndexUtils";

import regionUtils from "@/utils/regionUtils";


export default {
	name: "gene-selectpicker",
	components: {
		Autocomplete,
	},
	props: [],
	emits: ["onGeneChange"],

	data() {
		return {
			matchingGenes: [],
		};
	},
	computed: {},
	methods: {
		setFocus() {
			this.$nextTick(() => {
				this.$refs.geneSelect.$refs.input.focus();
			});
		},
		async lookupGenes(input) {
			if (!!input) {
				let matches = await match("gene", input, { limit: 10 });
				this.matchingGenes = matches;
			}
		},
		async selectGene(gene) {
			let geneSymbol = await regionUtils.geneSymbol(gene);

			if (geneSymbol) {
				this.$store.state.geneToQuery = geneSymbol;
				this.$emit("onGeneChange", geneSymbol);
			}
		},
	},
};
</script>
