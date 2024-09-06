<template>
  <div class="col filter-col-md">
    <div class="label">Tissue</div>
    <select v-model="tissue" class="form-control">
      <option value="">Select tissue</option>
      <option v-for="tissue in tissueKeys" 
        :value="tissue">
          {{ tissue }}
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

export default Vue.component("mouse-tissue-select", {
  props: [],
  data() {
      return {
          tissue: keyParams.tissue || "",
      };
  },
  created(){
    if (this.$store.state.tissueKeys.length === 0){
      this.$store.dispatch("getTissueKeys");
    }
  },
  computed: {
      keyParamsTissue() {
          return keyParams.tissue;
      },
      tissueKeys(){
        return this.$store.state.tissueKeys || [];
      }
  },
  methods: {
  },
  watch: {
      tissue(newTissue) {
          this.$store.state.tissueToQuery = newTissue;
          this.$emit("onTissueChange", newTissue);
      },
      keyParamsTissue(newKey) {
          if (this.tissue === null) {
              this.tissue = newKey;
          }
      },
  },
});
</script>
