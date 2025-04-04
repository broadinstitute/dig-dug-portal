<template>
  <div>
    <research-region-plot
      v-if="!!region"
      :plotData="processAssocData"
      :renderConfig="plotConfig"
      :searchParameters="searchParameters"
      :dataComparisonConfig="dataComparisonConfig"
      :region="region"
      :plotMargin="plotMargin"
      :compareGroupColors="colors"
      :regionZoom="0"
      :regionViewArea="0"
      :pkgData="[]"
      :pkgDataSelected="[]"
      :utils="utilsBox"
      sectionId=""
    ></research-region-plot>
  </div>
</template>
<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import sessionUtils from "@/utils/sessionUtils";
import filterUtils from "@/utils/filterUtils";
import regionUtils from "@/utils/regionUtils";
import userUtils from "@/utils/userUtils.js";
import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
export default Vue.component("pigean-locus-zoom", {
  components: {
    ResearchRegionPlot
  },
  props: ["phenotype", "gene"],
  data() {
      return {
        plotConfig: {
            "x axis field":"position",
            "y axis field":"minusLog10P",
            "render by":"varId",
            "y axis label":"-log10 (p)",
            "x axis label":"Chromosome",
            "hover content":["pValue","beta"],
            "height":120,
            "star key":"Variant ID",
            "ld server":{
              "pos":"Position",
              "ref":"ref",
              "alt":"alt",
              "ref variant field":"varId",
              "populations field":"minusLog10P",
              "populations type":"fixed",
              "fixed population":"ALL",
              "populations":{"ALL":"ALL"}}},
        assocData: [],
        geneData: [],
        region: "",
        searchParameters: {},
        dataComparisonConfig : {
          "key field":"Variant ID",
          "fields group data key":["phenotype"],
          "fields to compare":["minusLog10P","beta","stdErr","zScore"]
          },
        plotMargin: {
            leftMargin: 150,
            rightMargin: 40,
            topMargin: 20,
            bottomMargin: 100,
            bump: 11,
          },
        colors: [
              "#007bff50",
              "#04884550",
              "#8490C850",
              "#BF61A550",
              "#EE312450",
              "#FCD70050",
              "#5555FF50",
              "#7aaa1c50",
              "#9F78AC50",
              "#F8808450",
              "#F5A4C750",
              "#CEE6C150",
              "#cccc0050",
              "#6FC7B650",
              "#D5A76850",
              "#d4d4d450",
          ],
      };
  },
  async mounted(){
    this.region = await this.getGeneRegion();
    this.assocData = await this.getAssocData();
    this.setSearchParams();
  },
  computed: {
    utilsBox() {
        let utils = {
            Formatters: Formatters,
            uiUtils: uiUtils,
            alertUtils: alertUtils,
            keyParams: keyParams,
            dataConvert: dataConvert,
            sortUtils: sortUtils,
            plotUtils: plotUtils,
            filterUtils: filterUtils,
            regionUtils: regionUtils,
            userUtils: userUtils,
        };
        return utils;
    },
    processAssocData(){
      let outputData = {};
      let fields = this.dataComparisonConfig["fields to compare"];
      for (let i = 0; i < this.assocData.length; i++){
        let item = this.assocData[i];
        item.varId = this.fixVarId(item.varId);
        item.minusLog10P = -Math.log10(item.pValue);
        outputData[item.varId] = item;
        // This is how output data looks on Variant Sifter
        for (let j = 0; j < fields.length; j++){
          let field = fields[j];
          let objData = {};
          objData[this.phenotype] = item[field];
          outputData[item.varId][field] = objData;
        }
      }
      return outputData;
    }
  },
  methods: {
    async getAssocData() {
      console.log(`${this.phenotype} ${this.gene}`)
      return await query("associations", `${this.phenotype},${this.gene}`);
    },
    async getGeneRegion(){
      let geneData = await query("gene", this.gene);
      let data = geneData[0];
      let margin = 250000;
      let start = data.start < margin ? 0 : data.start - margin;
      let region = `${data.chromosome}:${start}-${data.end + margin}`;
      return region;
    },
    fixVarId(varId){
      let parts = varId.split(":");
      if (parts.length !== 4){
        //how should we handle this?
        return varId;
      }
      return `${parts[0]}:${parts[1]}_${parts[2]}/${parts[3]}`;
    },
    setSearchParams(){
      this.searchParameters = {
        "phenotype":{"type":"list","field":"phenotype","search":[this.phenotype]},
        "gene":{"type":"input","field":"gene","search":[this.gene]}}
    },
  },
  watch: {}
});
</script>

