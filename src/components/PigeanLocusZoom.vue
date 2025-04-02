<template>
  <div>
    <research-region-plot
      :plotData="processAssocData"
      :renderConfig="plotConfig"
      :searchParameters="searchParameters"
      :dataComparisonConfig="dataComparisonConfig"
      :region="searchingRegion"
      :plotMargin="plotMargin"
      :compareGroupColors="colors"
      :regionZoom="0"
      :regionViewArea="0"
      :pkgData="[]"
      :pkgDataSelected="[]"
      :utils="$parent.utilsBox"
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
          "type":"gem package",
          "viewers": ["region plot","genes plot"],
          "pkg id":"testPkg",
          "ld server":{
              "pos":"Position",
              "ref":"ref",
              "alt":"alt",
              "ref variant field":"Variant ID",
              "populations field":"P-Value",
              "populations type":"fixed",
              "fixed population":"ALL",
              "populations":{"ALL":"ALL"}},
          "region viewer":{
            "x axis field":"Position",
            "y axis field":"-log10(P-Value)",
            "render by":"Variant ID",
            "y axis label":"-Log10(p-value)",
            "x axis label":"Chromosome",
            "hover content":["P-Value","Beta"],
            "height":120,
            "star key":"Variant ID",
            "ld server":{
              "pos":"Position",
              "ref":"ref",
              "alt":"alt",
              "ref variant field":"Variant ID",
              "populations field":"P-Value",
              "populations type":"fixed",
              "fixed population":"ALL",
              "populations":{"ALL":"ALL"}}},
          "credible sets viewer":{
            "credible sets server":"KP BioIndex",
            "phenotype parameter":"phenotype",
            "x axis field":"position",
            "y axis field":"posteriorProbability",
            "hover content":["posteriorProbability","credibleSetId","reference","alt","beta","pValue"],
            "render by":"Variant ID",
          "data convert":[
            {"type":"join multi","field name":"Variant ID",
              "fields to join":["chromosome","position","reference","alt"],
              "join by":[":","_","/"]},
            {"type":"raw","field name":"posteriorProbability","raw field":"posteriorProbability"},
            {"type":"raw","field name":"credibleSetId","raw field":"credibleSetId"},
            {"type":"raw","field name":"reference","raw field":"reference"},
            {"type":"raw","field name":"alt","raw field":"alt"},
            {"type":"raw","field name":"beta","raw field":"beta"},
            {"type":"raw","field name":"pValue","raw field":"pValue"},
            {"type":"raw","field name":"position","raw field":"position"},
            {"type":"raw","field name":"phenotype","raw field":"phenotype"}],
          "star key":"Variant ID"},
          "annotations viewer":{
            "annotations server":"KP BioIndex",
            "phenotype parameter":"phenotype",
            "overlapping regions":"false",
            "ui table legend":"Table is sorted by fold enrichment (SNPs/expectedSNPs) across annotations.",
            "star key":{"key":"Variant ID","position":"Position"}},
            "biosamples viewer":{
              "biosamples server":"KP BioIndex",
              "phenotype parameter":"phenotype",
              "overlapping regions":"true",
              "with annotations viewer":"true",
              "ui table legend":"Table is sorted by fold enrichment (SNPs/expectedSNPs) across annotations.",
              "star key":{"key":"Variant ID","position":"Position"}},
              "gene-links viewer":{
                "with annotations viewer":"true",
                "gene links server":"KP BioIndex",
                "phenotype parameter":"phenotype",
                "region parameter":"region",
                "overlapping regions":"true",
                "global enrichment plot labels":{"x axis":"","y axis":""},
                "star key":{"key":"Variant ID","position":"Position"}},
                "genes track":{"input type":"dynamic","dynamic parameter":"region"},
                "zoom":"true"
          },
        assocData: [],
        geneData: [],
        searchParameters: {},
        dataComparisonConfig : {
          "key field":"Variant ID",
          "fields group data key":["phenotype"],
          "fields to compare":["pValue","beta","stdErr","zScore"]
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
    this.setSearchParams();
    this.geneData = await this.getGeneData();
    this.assocData = await this.getAssocData();
    console.log(JSON.stringify(this.assocData));
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
    
    searchingRegion(){
      let border = 250000;
      let data = this.geneData;
      let start = data.start < border ? data.start - border : 0;
      let end = data.end + border;
      let region = `${data.chromosome}:${start}-${end}`;
      return region;
    },
    processAssocData(){
      let outputData = {};
      let fields = this.dataComparisonConfig["fields to compare"];
      for (let i = 0; i < this.assocData.length; i++){
        let item = this.assocData[i];
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
    async getGeneData(){
      let data = await query("gene", this.gene);
      return data[0];
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

