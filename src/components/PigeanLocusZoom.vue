<template>
  <div>
    <research-region-plot
      :plotData="assocData"
      :renderConfig="plotConfig"
      :searchParameters="searchParameters"
      :dataComparisonConfig="dataComparisonConfig"
      :region="$store.state.searchingRegion"
      :plotMargin="$parent.plotMargin"
      :compareGroupColors="$parent.colors.moderate"
      :regionZoom="$parent.regionZoom"
      :regionViewArea="$parent.regionViewArea"
      :pkgData="$store.state.pkgData"
      :pkgDataSelected="$store.state.pkgDataSelected"
      :utils="$parent.utilsBox"
      sectionId=""
    ></research-region-plot>
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
        plotConfig: {
          "type":"gem package",
          "viewers": ["region plot","genes plot"],
          "pkg id":"testPkg",
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
        searchParameters: {},
        dataComparisonConfig : {
          "key field":"Variant ID",
          "fields group data key":["phenotype"],
          "fields to compare":["-log10(P-Value)","P-Value","Beta","MAF","Standard Error","Z Score","LDS"]
        }
      };
  },
  async mounted(){
    this.setSearchParams();
    this.assocData = await this.getAssocData();
    console.log(JSON.stringify(this.assocData));
  },
  computed: {},
  methods: {
    async getAssocData() {
      console.log(`${this.phenotype} ${this.gene}`)
      return await query("associations", `${this.phenotype},${this.gene}`);
    },
    setSearchParams(){
      this.searchParameters = {
        "phenotype":{"type":"list","field":"phenotype","search":[this.phenotype]},
        "gene":{"type":"input","field":"gene","search":[this.gene]}}
    }
  },
  watch: {}
});
</script>

