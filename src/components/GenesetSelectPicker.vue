<template>
	<autocomplete
		:placeholder="
			!$store.state.genesetToQuery ? 'Search gene set' : $store.state.genesetToQuery
		"
		:matches="matchingGenesets"
		ref="genesetSelect"
		@input-change="lookupGenesets($event)"
		@item-select="selectGeneset($event)"
	></autocomplete>
</template>

<script>
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Autocomplete from "@/components/Autocomplete.vue";
import { match } from "@/utils/bioIndexUtils";


export default {
	name: "geneset-selectpicker",
	components: {
		Autocomplete,
	},
	props: [],
	emits: ["onGenesetChange"],

	data() {
		return {
			matchingGenesets: [],
		};
	},
	computed: {},
	methods: {
		setFocus() {
			this.$nextTick(() => {
				this.$refs.genesetSelect.$refs.input.focus();
			});
		},
		async lookupGenesets(input) {
			if (!!input) {
				let matches = await match("pigean-gene-set", input, { limit: 10 });
				this.matchingGenesets = matches;
			}
		},
		async selectGeneset(geneset) {
			//let geneSymbol = await regionUtils.geneSymbol(gene);

			this.$store.state.genesetToQuery = geneset;
			this.$emit("onGenesetChange", geneset);
		},
	},
};
</script>
