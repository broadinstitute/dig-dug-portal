<template>
  <div id="pigean-gene">
      <div v-if="rows > 0">
          <div class="text-right mb-2">
              <data-download
                  :data="pigeanData"
                  filename="pigean_gene"
              ></data-download>
          </div>
          <b-table
              hover
              small
              responsive="sm"
              :items="pigeanData"
              :fields="config.fields"
              :per-page="perPage"
              :current-page="currentPage"
          >
            <template #cell(gene)="r">
              <a :href="`/pigean/gene.html?gene=${r.item.gene}`">
                {{ r.item.gene }}
              </a>
            </template>
            <template #cell(phenotype)="r">
              <a v-if="!!phenotypeMap[r.item.phenotype]"
                :href="`/pigean/phenotype.html?phenotype=${r.item.phenotype}`">
                {{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
              </a>
              <span v-else>{{ r.item.phenotype }}</span>
            </template>
            <template #cell(expand)="row">
                <b-button
                    variant="outline-primary"
                    size="sm"
                    @click="getSubtable(row)"
                >
                    {{ row.detailsShowing ? "Hide" : "Show" }}
                </b-button>
            </template>
            <template #row-details="row">
              <pigean-subtable
                :joinedData="subtableData[`${row.item.phenotype},${row.item[config.queryParam]}`]"
                :fields="config.subtableFields">
              </pigean-subtable>
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
import PigeanSubtable from "./PigeanSubtable.vue";
export default Vue.component("pigean-table", {
  components: {
      DataDownload,
      PigeanSubtable
  },
  props: ["pigeanData", "phenotypeMap", "config"],
  data() {
      return {
          perPage: 10,
          currentPage: 1,
          subtableData: {}
      };
  },
  computed: {
      rows() {
          return this.pigeanData.length;
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
      async getSubtable(row) {
        let queryKey = `${row.item.phenotype},${row.item[this.config.queryParam]}`;
        if (!this.subtableData[queryKey]) {
          let data = await query(this.config.subtableEndpoint, queryKey);
          Vue.set(this.subtableData, queryKey, data);
        }
        row.toggleDetails();
      },
  },
});
</script>
<style>
@import url("/css/effectorGenes.css");

label {
  margin: 10px;
}
</style>
