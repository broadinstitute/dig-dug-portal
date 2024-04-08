<template>
  <div class="row">
    <div class="col-12">
      <b-table
        class="dataset-subtable"
        :items="row.item['Datasets']"
        :current-page="row.item.currentPage"
        :per-page="perPage"
        :fields="fields"
        :tbody-tr-class="(d) => datasetRowClass(d)"
      >
        <template #cell(dataset)="data">
          <a
            :href="`https://cmdga.org/annotations/${data.value}/`"
            target="_blank"
          >
            {{ data.value }}
          </a>
        </template>
      </b-table>
    </div>
    <b-pagination
      v-model="row.item.currentPage"
      :total-rows="row.item['Datasets'].length"
      :per-page="perPage">
    </b-pagination>
  </div>
</template>
<script>
  import Vue from "vue";
  import Formatters from "@/utils/formatters";
  export default Vue.component("ResearchDatasetSubtable", {
	  props: ["row", "fields", "plotByField"],
    data() {
      return {
        perPage: 10
      }
    },
    mounted(){
      this.setupDatasets();
    },
    watch: {
      
    },
    methods: {
      snakeFormatter: Formatters.snakeFormatter,
      toSnakeFormatter: Formatters.toSnakeFormatter,
      tissueFormatter: Formatters.tissueFormatter,
      datasetRowClass(d){
        let parentRow = this.plotByField === "tissue" 
          ? this.toSnakeFormatter(d.tissue)
          : d[this.plotByField];
        let biosample = this.toSnakeFormatter(d.biosample);
        return `misc-class dataset--${parentRow}--${d.dataset}--${biosample}`;
      },
      setupDatasets(){
        let rows = document.querySelectorAll(".dataset-subtable tbody tr");
        rows.forEach(row => row.addEventListener("mouseenter", 
          () => this.highlightDatasets(row.className)));
      },
      highlightDatasets(classesString){
        classesString.split(' ').forEach(c => {
          if (c.startsWith("dataset--")){
            let details = c.split("--");
            let violinString = this.plotByField === "tissue"
              ? this.snakeFormatter(details[1])
              : details[1];
            let detailsObject = { 
              violin: violinString, 
              dataset: details[2],
              biosample: details[3]
            };
            this.$emit("highlight", detailsObject);
          }
        });
      }
    }
  });
</script>
<style scoped>
  .row {
    /*font-size: smaller;*/
    margin-left: 15px;
    margin-right: 0;
    background-color: #efefef;
  }
  .row .col-12 {
    padding: 0 0 0 5px !important;
  }
  .b-popover{
    background-color: #fff;
  }
  .active .activeIcon {
    color: #007bff;
  }
</style>