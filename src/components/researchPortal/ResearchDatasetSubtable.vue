<template>
  <div>
    <b-table
      :class="`dataset-subtable ${toSnakeFormatter(row.item[plotByField])}`"
      small
      responsive="sm"
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
      toSnakeFormatter: Formatters.toSnakeFormatter,
      tissueFormatter: Formatters.tissueFormatter,
      datasetRowClass(d){
        let parentRow = this.plotByField === "gene" ? d.gene : this.toSnakeFormatter(d.tissue);
        return `misc-class dataset--${parentRow}--${d.dataset}`;
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
            let detailsObject = { violin: details[1], dataset: details[2]};
            this.$emit("highlight", detailsObject);
          }
        });
      }
    }
  });
</script>