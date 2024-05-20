<template>
  <div id="pigean-gene" :class="`${!!isSubtable ? 'pigean-subtable' : ''}`">
      <div v-if="tableData.length > 0">
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
            :items="tableData"
            :fields="probFields"
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
              :total-rows="tableData.length"
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
  props: ["pigeanData", "phenotypeMap", "config", "isSubtable", "filter"],
  data() {
      return {
          perPage: 10,
          currentPage: 1,
          subtableData: {},
          probFields: ["combined"],
          probData: this.computeProbabilities(), // only need to do this once
          probFields: this.collateFields()
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
      },
      tableData(){
        let data = this.probData;
        if (this.filter){
          data = data.filter(this.filter);
        }
        return data;
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
        let data = JSON.parse(JSON.stringify(this.pigeanData)); // Deep copy
        for (let i = 0; i < this.config.fields.length; i++){
          let fieldConfig = this.config.fields[i];
          if (!fieldConfig.showProbability) { continue; }
          let field = fieldConfig.key;
          for (let j = 0; j < data.length; j++){
            if (!!data[j][field]){
              data[j][`${field}_probability`] = 
                this.tpmFormatter(this.probability(data[j][field]));
            }
          }
        }
        return data;
      },
      collateFields(){
        let allFields = [];
        this.config.fields.forEach(field => {
          if (field.showProbability){
            allFields.push({
              key: `${field.key}_probability`,
              label: `${field.label} Probability`,
              sortable: true
            });
          }
          allFields.push(field);
        });
        return allFields
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
