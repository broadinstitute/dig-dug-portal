<template>
  <div id="pigean-subtable">
      <div v-if="rows > 0">
          <b-table
              hover
              small
              responsive="sm"
              :items="joinedData"
              :fields="fields"
              :per-page="perPage"
              :current-page="currentPage"
          >
            <template #cell(gene_set)="r">
              <a :href="`/pigean/geneset.html?geneset=${r.item.gene_set}`">
                {{ r.item.gene_set }}
              </a>
            </template>
            <template #cell(gene)="r">
              <a :href="`/pigean/gene.html?gene=${r.item.gene}`">
                {{ r.item.gene }}
              </a>
            </template>
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
export default Vue.component("pigean-subtable", {
  components: {
      DataDownload,
  },
  props: ["joinedData", "fields"],
  data() {
      return {
          perPage: 10,
          currentPage: 1,
      };
  },
  computed: {
      rows() {
          return this.joinedData.length;
      },
  },
  methods: {
      tissueFormatter: Formatters.tissueFormatter,
  },
});
</script>
<style>
@import url("/css/effectorGenes.css");

label {
  margin: 10px;
}
</style>
