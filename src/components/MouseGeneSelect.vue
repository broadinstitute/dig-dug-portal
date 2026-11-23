<template>
  <div class="col filter-col-md">
    <div class="label">Gene</div>
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
  </div>
</template>

<script>
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Autocomplete from "@/components/Autocomplete.vue";
import keyParams from "@/utils/keyParams";
import { match } from "@/utils/bioIndexUtils";

export default {
  name: "mouse-gene-select",
  components: {
    Autocomplete,
  },
  props: [],
  emits: ["onGeneChange"],
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
};
</script>
