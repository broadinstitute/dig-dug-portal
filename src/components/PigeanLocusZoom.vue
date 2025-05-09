<template>
  <div>
    <div v-if="!!region">
      <research-region-plot
        :plotData="assocData"
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
        :sectionId="`${sectionId}_region`"
      ></research-region-plot>
      <research-genes-track
          :region="region"
          :plotConfig="plotConfig"
          plotType="region plot"
          :plotMargin="plotMargin"
          :regionZoom="0"
          :regionViewArea="0"
          :utils="utilsBox"
          :sectionId="`${sectionId}_genes`"
      ></research-genes-track>
    </div>
    <div v-else class="loading">
      <b-spinner label="Loading..."></b-spinner>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import filterUtils from "@/utils/filterUtils";
import regionUtils from "@/utils/regionUtils";
import userUtils from "@/utils/userUtils.js";
import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
import ResearchGenesTrack from "@/components/researchPortal/ResearchGenesTrack.vue";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
export default Vue.component("pigean-locus-zoom", {
  components: {
    ResearchRegionPlot,
    ResearchGenesTrack
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
            "star key":"varId",
            "ld server":{
              "pos":"position",
              "ref":"reference",
              "alt":"alt",
              "ref variant field":"varId",
              "populations field":"minusLog10P",
              "populations type":"fixed",
              "fixed population":"ALL",
          "populations":{"ALL":"ALL"}}
        },
        sectionId: "",
        assocData: [],
        genesTrackData: [],
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
    this.sectionId = Math.floor(Math.random() * 10e9);
    this.region = await this.getGeneRegion();
    this.assocData = await this.processAssocData();
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
  },
  methods: {
    async getAssocData(CONTENT=null) {
      let query = `${this.phenotype},${this.region}`;
      let url = `${BIO_INDEX_HOST}/api/bio/query/associations?q=${query}`;
      if (CONTENT === null) {
        let json = await fetch(url).then(resp => resp.json());
        if (json.continuation !== null){
          return await this.getAssocData(json);
        } else {
          return json.data; 
        }
      } else {
        let contURL = `${BIO_INDEX_HOST}/api/bio/cont?token=${CONTENT.continuation}`;
        let contJson = await fetch(contURL).then((resp) => resp.json());

        if (contJson.error == null) {
          let prevData = CONTENT.data;
          let newData = prevData.concat(contJson.data);
          contJson.data = newData;
          if (contJson.continuation == null) {
            return contJson.data;
          } else {
            return await this.getAssocData(contJson);
          }
        }
      }
    },
    async processAssocData(){
      let inputData = await this.getAssocData();
      let outputData = {};
      let fields = this.dataComparisonConfig["fields to compare"];
      for (let i = 0; i < inputData.length; i++){
        let item = inputData[i];
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
    },
    async getGeneRegion(){
      let data = await regionUtils.parseRegion(this.gene, true, 250000);
      let region = `${data.chr}:${data.start}-${data.end}`;
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
});
</script>
<style scoped>
  .loading {
    margin-left: 50px;
  }
</style>

