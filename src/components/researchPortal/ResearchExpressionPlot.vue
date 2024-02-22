<template>
  <div>
    <research-expression-filter
      :rawData="rawData"
      plotByField="tissue"
      @dataReady="(data) => getFilteredData(data)">
    </research-expression-filter>
    <research-gene-expression-plot
      :plotData="filteredData">
    </research-gene-expression-plot>
    <research-expression-table
      :filteredData="filteredData">
    </research-expression-table>
  </div>
</template>
<script>
  import Vue from "vue";
  import ResearchExpressionFilter from "@/components/researchPortal/ResearchExpressionFilter.vue";
  import ResearchExpressionTable from "@/components/researchPortal/ResearchExpressionTable.vue";
  import ResearchGeneExpressionPlot from "@/components/researchPortal/ResearchGeneExpressionPlot.vue";
  export default Vue.component("ResearchExpressionPlot", {
    props: ["rawData"],
    data() {
      return {
        filteredData: []
      };
    },
    methods: {
      getFilteredData(data){
        this.filteredData = data;
      },
    }
  });
</script>