import Vue from "vue";
import App from "./App.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PhenotypeSelect from "@/components/PhenotypeSelect.vue";
import DatasetSelect from "@/components/DatasetSelect.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";

new Vue({
  store,
  data() {
    return { pValue: 12 };
  },
  render: h => h(App),

  created() {
    this.$store.dispatch("phenotypeModule/getPhenotypes");
    this.$store.commit("table/setLimit", 25);
    this.$store.commit("manhattan/setLimit", 500);
  },
  methods: {
    current_pvalue(obj) {
      let p = Object.values(obj)[0];
      let d = Object.keys(p)[0];
      return p[d];
    }
  },
  computed: {
    computedPvalue: function() {
      return this.current_pvalue(this.pValue);
    }
  },

  watch: {
    selectedPhenotype(newPhenotype) {
      this.$store.commit("table/clearData");
      this.$store.commit("manhattan/clearData");
      this.$store.dispatch("datasetModule/getDatasets", newPhenotype);
    },
    selectedDataset(newDataset) {
      let dataset = newDataset;
      let phenotype = this.$store.state.selectedPhenotype;

      this.$store.commit("table/clearData");
      this.$store.commit("manhattan/clearData");

      this.$store.dispatch("table/getData", { dataset, phenotype });
      this.$store.dispatch("manhattan/getData", { dataset, phenotype });
    }
  }
}).$mount("#app");
