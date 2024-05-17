<template>
  <div id="pigean-gene" :class="`${!!isSubtable ? 'pigean-subtable' : ''}`">
      <div v-if="rows > 0">
          <div class="text-right mb-2" v-if="!isSubtable">
              <data-download
                  :data="probData"
                  filename="pigean_gene"
              ></data-download>
          </div>
          <b-table
            :hover="isSubtable"
            small
            responsive="sm"
            :items="probData"
            :fields="config.fields"
            :per-page="perPage"
            :current-page="currentPage"
            :sort-by="sortBy"
            :sort-desc="true"
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
            <template #cell(gene_set)="r">
              <a :href="`/pigean/geneset.html?geneset=${r.item.gene_set}`">
                {{ r.item.gene_set }}
              </a>
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
              <pigean-table
                :pigeanData="subtableData[`${row.item.phenotype},${row.item[config.queryParam]}`]"
                :config="{fields:config.subtableFields}"
                :isSubtable="true">
              </pigean-table>
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
import PigeanTable from "./PigeanTable.vue";
export default Vue.component("pigean-table", {
  components: {
      DataDownload,
      PigeanTable
  },
  props: ["pigeanData", "phenotypeMap", "config", "isSubtable"],
  data() {
      return {
          perPage: 10,
          currentPage: 1,
          subtableData: {},
          probFields: ["combined"],
          probData: this.computeProbabilities(),
      };
  },
  computed: {
      rows() {
          return this.pigeanData.length;
      },
      sortBy(){
        return this.pigeanData.length === 0 ? 0 
          : this.pigeanData[0]["combined"] !== undefined
            ? "combined" : "beta_uncorrected";
      }
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
      probability(val, prior=0.05){
        let a = Math.exp(Math.log(prior) + val);
        return a / (1 + a);
      },
      computeProbabilities(){
        let probFields = ["combined"];
        let fieldsInUse = this.config.fields.map(field => field.key);
        let data = JSON.parse(JSON.stringify(this.pigeanData)); // Deep copy
        for (let i = 0; i < probFields.length; i++){
          let field = probFields[i];
          if (!fieldsInUse.includes(field)) { continue; }
          for (let j = 0; j < data.length; j++){
            console.log(this.probability(data[j][field]))
            if (!!data[j][field] && !Number.isNaN(data[j][field])){
              data[j][`${field}_probability`] = this.probability(data[j][field]);
            }
          }
        }
        return data;
      }

  },
});
</script>
<style>
@import url("/css/effectorGenes.css");

label {
  margin: 10px;
}
.pigean-subtable {
    font-size: smaller;
    margin-left: 15px;
    background-color: #efefef;
}
.pigean-subtable .row .col-12 {
    padding: 0 0 0 5px !important;
}
</style>
