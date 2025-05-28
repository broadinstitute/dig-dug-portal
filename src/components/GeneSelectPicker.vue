<template>
	<autocomplete
		:placeholder="'Search gene'"
		:matches="matchingGenes"
		ref="geneSelect"
		@input-change="lookupGenes($event)"
		@item-select="selectGene($event)"
	></autocomplete>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Autocomplete from "@/components/Autocomplete.vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { match } from "@/utils/bioIndexUtils";

import regionUtils from "@/utils/regionUtils";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);
Vue.component("autocomplete", Autocomplete);

export default Vue.component("gene-selectpicker", {
	props: [],

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
});
</script>
