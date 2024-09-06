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
      };
  },
  created(){
    if (this.$store.state.geneKeys.length === 0){
      this.$store.dispatch("getGeneKeys");
    }
  },
  computed: {
      keyParamsGene() {
          return keyParams.gene;
      },
      geneKeys(){
        return this.$store.state.geneKeys || [];
      }
  },
  methods: {
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
