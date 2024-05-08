<template>
  <div id="c2ct">
      <div v-if="rows > 0">
          <div class="text-right mb-2">
              <data-download
                  :data="c2ctData"
                  filename="pigean_gene"
              ></data-download>
          </div>
          <b-table
              hover
              small
              responsive="sm"
              :items="pigeanGeneData"
              :fields="fields"
              :per-page="perPage"
              :current-page="currentPage"
          >
          </b-table>
          <b-pagination
              v-model="currentPage"
              class="pagination-sm justify-content-center"
              :total-rows="rows"
              :per-page="perPage"
          ></b-pagination>
      </div>
      <div v-else>
          <b-alert show variant="warning" class="text-center">
              <b-icon icon="exclamation-triangle"></b-icon> No data available
              for this query.
          </b-alert>
      </div>
  </div>
</template>
<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
export default Vue.component("pigean-gene-table", {
  components: {
      DataDownload,
  },
  props: ["pigeanGeneData"],
  data() {
      return {
          perPage: 10,
          currentPage: 1,
      };
  },
  computed: {
      rows() {
          return this.pigeanGeneData.length;
      },
  },
  methods: {
      pValueFormatter: Formatters.pValueFormatter,
      effectFormatter: Formatters.effectFormatter,
      intFormatter: Formatters.intFormatter,
      annotationFormatter: Formatters.annotationFormatter,
      tissueFormatter: Formatters.tissueFormatter,
      tpmFormatter: Formatters.tpmFormatter
  },
});
</script>
<style>
@import url("/css/effectorGenes.css");

label {
  margin: 10px;
}
</style>
