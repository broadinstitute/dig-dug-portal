<template>
  <research-m-plot
    :plotData="formatData(tableData)"
    :renderConfig="plotConfig"
    >

  </research-m-plot>
</template>
<script>
  import Vue from "vue";
  import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
  export default Vue.component("PhenotypeHugeScores", {
    props: ["scores", "filter"],
    data() {
        return {
          plotConfig: {
                "type": "manhattan plot",
                "x axis field": "position",
                "y axis field": "logHugeScore",
                "render by": "gene",
                "x axis label": "Position",
                "y axis label": "NaturalLog(HugeScore)",
                "height": 300,
                "link to": "/region.html",
                "hover content": ["huge"]
            }
        }
    },
    computed: {
      tableData() {
        if (this.filter) {
            return this.scores.filter(this.filter);
        }
        return this.scores;
    },
    },
    watch: {
    },
    methods: {
      formatData(data){
        data.forEach(entry => {
          entry.position = `${entry.chromosome} : ${entry.start} - ${entry.end}`;
          entry.logHugeScore = Math.log(entry.huge);
        });
        return data;
      }
    },
});
</script>