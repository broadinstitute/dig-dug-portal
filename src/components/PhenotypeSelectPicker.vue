<template>
	<vue-typeahead-bootstrap
		v-model="userText"
		ref="phenotypeSelect"
		:placeholder="placeholder || 'Type in a phenotype ...'"
		:data="phenotypeOptions"
		:serializer="(s) => s.description"
		:maxMatches="1000"
		:minMatchingChars="0"
		:showOnFocus="true"
		@hit="onPhenotypeSelected($event)"
	>
		<template slot="suggestion" slot-scope="{ data, htmlText }">
			<span v-html="htmlText"></span>&nbsp;
			<small class="text-secondary">{{ data.group }}</small>
		</template>
	</vue-typeahead-bootstrap>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("phenotype-selectpicker", {
	props: [
		"phenotypes",
		"clearOnSelected",
		"defaultPhenotype",
		"placeholder",
		"useInLocal",
		"localPlace",
	],

	data() {
		return {
			userText: this.defaultPhenotype || "",
		};
	},
	computed: {
		phenotypeOptions() {
			if (!this.phenotypes) {
				return [];
			}

			return this.phenotypes.sort((a, b) => {
				if (a.group < b.group) return -1;
				if (b.group < a.group) return 1;

				if (a.description < b.description) return -1;
				if (b.description < a.description) return 1;

				return 0;
			});
		},
	},
	methods: {
		onPhenotypeSelected(event) {
			if (!!this.useInLocal) {
				switch (this.localPlace) {
					case "diseaseSystems":
						this.getPhenotypeCorrelation(event.name);
						break;
				}
			} else {
				this.$store.dispatch("onPhenotypeChange", event);

				if (this.clearOnSelected) {
					this.userText = "";
					this.$refs.phenotypeSelect.inputValue = "";
				}
			}
		},

		setFocus() {
			this.$nextTick(() => {
				this.$refs.phenotypeSelect.$refs.input.focus();
			});
		},

		async getPhenotypeCorrelation(phenotype) {
			let searchPoint =
				"https://bioindex-dev.hugeamp.org/api/bio/query/genetic-correlation?q=" +
				phenotype;

			var correlationJson = await fetch(searchPoint).then((resp) =>
				resp.json()
			);

			if (correlationJson.error == null) {
				this.$store.dispatch("phenotypeCorrelation", correlationJson);
			}
		},
	},
});
</script>
