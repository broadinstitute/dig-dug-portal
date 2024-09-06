<template>
  <div class="col filter-col-md">
    <div class="label">Gene</div>
    <select v-model="gene" class="form-control">
      <option value="">Select gene</option>
      <option v-for="gene in geneKeys" 
        :value="gene">
          {{ gene }}
      </option>
    </select>
  </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import keyParams from "@/utils/keyParams";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

export default Vue.component("mouse-gene-select", {
  props: [],
  data() {
      return {
          gene: keyParams.gene || "",
          geneKeys: [],
      };
  },
  created(){
    this.getGeneKeys();
  },
  computed: {
      keyParamsGene() {
          return keyParams.tissue;
      },
  },
  methods: {
    async getGeneKeys() {
			let genes = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/diff-exp/2?columns=gene`)
				.then(resp => resp.json())
				.then(json => {
					if (json.count == 0) {
						return null;
					}
					return json.keys.map(key => key[0])
				});
      this.geneKeys = genes;
		},
  },
  watch: {
    gene(newGene) {
        this.$store.state.geneToQuery = newGene;
        this.$emit("onGeneChange", newGene);
    },
    keyParamsGene(newKey) {
        if (this.gene === null) {
            this.gene = newKey;
        }
    },
  },
});
</script>
