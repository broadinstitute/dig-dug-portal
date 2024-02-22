<template>
  <div>
    <research-expression-filter
      :rawData="rawData"
      plotByField="tissue"
      @plotDataReady="(data) => getPlotData(data)"
      @tableDataReady="(data) => getTableData(data)">
    </research-expression-filter>
    <research-gene-expression-plot
      :plotData="plotData">
    </research-gene-expression-plot>
    <research-expression-table
      :filteredData="tableData">
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
        plotData: [],
        tableData: []
      };
    },
    methods: {
      getPlotData(data){
        this.plotData = data;
      },
      getTableData(data){
        this.tableData = data;
      }
    }
  });
</script>