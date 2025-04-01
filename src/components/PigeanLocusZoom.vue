<template>
  <div>
    <!-- <research-region-plot>
    </research-region-plot> -->
  </div>
</template>
<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
export default Vue.component("pigean-locus-zoom", {
  components: {
  },
  props: ["phenotype", "gene"],
  data() {
      return {
        assocData: [],
      };
  },
  async mounted(){
    this.assocData = await this.getAssocData();
    console.log(JSON.stringify(this.assocData));
  },
  computed: {},
  methods: {
    async getAssocData() {
      console.log(`${this.phenotype} ${this.gene}`)
      return await query("associations", `${this.phenotype},${this.gene}`);
    },
  },
  watch: {}
});
</script>

