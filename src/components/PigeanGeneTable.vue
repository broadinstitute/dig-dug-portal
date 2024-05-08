<template>
  <div id="pigean-gene">
      <div v-if="rows > 0">
          <div class="text-right mb-2">
              <data-download
                  :data="pigeanGeneData"
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
            <template #cell(phenotype)="r">
              <a v-if="!!phenotypeMap[r.item.phenotype]"
                :href="`/pigean/phenotype.html?phenotype=${r.item.phenotype}`">
                {{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
              </a>
              <span v-else>{{ r.item.phenotype }}</span>
            </template>
            <template #cell(genesets)="row">
                <b-button
                    variant="outline-primary"
                    size="sm"
                    @click="getJoinedGenes(row)"
                >
                    {{ row.detailsShowing ? "Hide" : "Show" }} Genesets
                </b-button>
            </template>
            <template #row-details="row">
              <pigean-gene-subtable
                :joined="joinedGenes[`${row.item.phenotype},${row.item.gene}`]">
              </pigean-gene-subtable>
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
import PigeanGeneSubtable from "./PigeanGeneSubtable.vue";
export default Vue.component("pigean-gene-table", {
  components: {
      DataDownload,
      PigeanGeneSubtable
  },
  props: ["pigeanGeneData", "phenotypeMap"],
  data() {
      return {
          perPage: 10,
          currentPage: 1,
          fields: [
            { key: "phenotype", sortable: true },
            { key: "combined", sortable: true },
            { key: "log_bf", sortable: true },
            { key: "prior", sortable: true },
            { key: "genesets" } 
          ],
          joinedGenes: {}
      };
  },
  computed: {
      rows() {
          return this.pigeanGeneData.length;
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
      async getJoinedGenes(row) {
        let queryKey = `${row.item.phenotype},${row.item.gene}`;
        if (!this.joinedGenes[queryKey]) {
          console.log("we don't have this");
          let data = await query("pigean-joined-gene", queryKey);
          Vue.set(this.joinedGenes, queryKey, data);
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
