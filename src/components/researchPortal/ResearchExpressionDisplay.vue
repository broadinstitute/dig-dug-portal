<template>
  <div>
    <research-expression-filter
      :rawData="rawData"
      plotByField="tissue"
      @dataReady="(data) => getFilteredData(data)">
    </research-expression-filter>
    <research-expression-plot
      :plotData="filteredData"
      :highlightedDataset="datasetDetails">
    </research-expression-plot>
    <research-expression-table
      :filteredData="filteredData"
      @highlight="details => highlight(details)">
    </research-expression-table>
  </div>
</template>
<script>
  import Vue from "vue";
  import ResearchExpressionFilter from "@/components/researchPortal/ResearchExpressionFilter.vue";
  import ResearchExpressionTable from "@/components/researchPortal/ResearchExpressionTable.vue";
  import ResearchExpressionPlot from "@/components/researchPortal/ResearchExpressionPlot.vue";
  export default Vue.component("ResearchExpressionDisplay", {
    props: ["rawData"],
    data() {
      return {
        filteredData: [],
        datasetDetails: {}
      };
    },
    methods: {
      getFilteredData(data){
        this.filteredData = data;
      },
      highlight(details){
        this.datasetDetails = details;
      }
    }
  });
</script>