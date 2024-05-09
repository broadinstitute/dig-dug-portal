<template>
  <div id="pigean-gene">
      <div v-if="rows > 0">
          <div class="text-right mb-2">
              <data-download
                  :data="genesetData"
                  filename="pigean_geneset"
              ></data-download>
          </div>
          <b-table
              hover
              small
              responsive="sm"
              :items="genesetData"
              :fields="fields"
              :per-page="perPage"
              :current-page="currentPage"
          >
            <template #cell(phenotype)="r">
              <a v-if="!!phenotypeMap[r.item.phenotype]"
                :href="`/pigean/phenotype.html?phenotype=${r.item.phenotype}`">
                {{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
              </a>
              <span v-else>{{ r.item.phenotype }}</span>
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
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
export default Vue.component("pigean-geneset-table", {
  components: {
      DataDownload,
  },
  props: ["genesetData", "phenotypeMap"],
  data() {
      return {
          perPage: 10,
          currentPage: 1,
          fields: [
            { key: "phenotype", sortable: true },
            { key: "beta", sortable: true },
            { key: "beta_uncorrected", sortable: true },
            { key: "genes"}
          ],
      };
  },
  computed: {
      rows() {
          return this.genesetData.length;
      },
  },
  methods: {
      phenotypeFormatter: Formatters.phenotypeFormatter,
      pValueFormatter: Formatters.pValueFormatter,
      effectFormatter: Formatters.effectFormatter,
      intFormatter: Formatters.intFormatter,
      annotationFormatter: Formatters.annotationFormatter,
      tissueFormatter: Formatters.tissueFormatter,
      tpmFormatter: Formatters.tpmFormatter,
  },
});
</script>
<style>
@import url("/css/effectorGenes.css");

label {
  margin: 10px;
}
</style>
