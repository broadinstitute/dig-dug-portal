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
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Autocomplete from "@/components/Autocomplete.vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { match } from "@/utils/bioIndexUtils";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);
Vue.component("autocomplete", Autocomplete);

export default Vue.component("geneset-selectpicker", {
	props: [],

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
});
</script>
