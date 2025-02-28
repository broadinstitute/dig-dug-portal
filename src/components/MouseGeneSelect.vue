<template>
    <autocomplete
      :placeholder="
        !$store.state.geneToQuery ? 'Search gene' : $store.state.geneToQuery
      "
      :matches="matchingGenes"
      ref="geneSelect"
      @input-change="lookupGenes($event)"
      @item-select="selectGene($event)"
    >
    </autocomplete>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Autocomplete from "@/components/Autocomplete.vue";
import keyParams from "@/utils/keyParams";
import { match } from "@/utils/bioIndexUtils";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);
Vue.component("autocomplete", Autocomplete);

export default Vue.component("mouse-gene-select", {
  props: [],
  data() {
      return {
          gene: keyParams.gene || "",
          matchingGenes: []
      };
  },
  computed: {
      geneKeys(){
        return this.$store.state.geneKeys || [];
      }
  },
  methods: {
    setFocus() {
			this.$nextTick(() => {
				this.$refs.geneSelect.$refs.input.focus();
			});
		},
    async lookupGenes(input) {
			if (!!input) {
				let matches = await match("diff-exp-summary-gene", input, { limit: 10 });
				this.matchingGenes = matches;
			}
		},
    selectGene(geneSymbol) {
			if (geneSymbol) {
				this.$store.dispatch("selectGeneName", geneSymbol);
				this.$emit("onGeneChange", geneSymbol);
			}
		},
  },
  watch: {
  },
});
</script>
