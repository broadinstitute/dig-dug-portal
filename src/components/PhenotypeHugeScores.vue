<template>
  <div>
    <research-m-plot
      :plotData="formatData(tableData)"
      :renderConfig="plotConfig"
      >
    </research-m-plot>
    <huge-scores-table
      leadTableField="gene"
      :pageKey="phenotype"
      :hugeScores="tableData"
      :phenotypeMap="phenotypeMap"
      :filter="filter"
    >
    </huge-scores-table>
  </div>
</template>
<script>
  import Vue from "vue";
  import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
  import HugeScoresTable from "@/components/HugeScoresTable.vue";
  export default Vue.component("PhenotypeHugeScores", {
    props: ["scores", "filter", "phenotypeMap", "phenotype"],
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