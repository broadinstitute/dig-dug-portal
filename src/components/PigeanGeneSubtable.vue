<template>
  <div id="pigean-gene-subtable">
      <div v-if="rows > 0">
      <!-- <div class="text-right mb-2">
              <data-download
                  :data="pigeanGeneData"
                  filename="pigean_gene"
              ></data-download>
          </div> -->
          <b-table
              hover
              small
              responsive="sm"
              :items="joined"
              :fields="fields"
              :per-page="perPage"
              :current-page="currentPage"
          >
            <template #cell(gene_set)="r">
              <a :href="`/pigean/geneset.html?geneset=${r.item.gene_set}`">
                {{ r.item.gene_set }}
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
export default Vue.component("pigean-gene-subtable", {
  components: {
      DataDownload,
  },
  props: ["joined"],
  data() {
      return {
          perPage: 10,
          currentPage: 1,
          fields: [
            { key: "gene_set", sortable: true },
            { key: "beta", sortable: true },
          ],
      };
  },
  computed: {
      rows() {
          return this.joined.length;
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
