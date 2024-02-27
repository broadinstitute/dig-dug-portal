<template>
  <div>
    <research-expression-filter
      :rawData="rawData"
      plotByField="tissue"
      @dataReady="(data) => getFilteredData(data)">
    </research-expression-filter>
    <research-expression-plot
      :plotData="filteredData">
    </research-expression-plot>
    <research-expression-table
      :filteredData="filteredData">
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