<template>
  <div id="pigean-gene" :class="isSubtable ? 'pigean-subtable' : ''">
      <div v-if="tableData.length > 0">
          <div v-if="!isSubtable" class="text-right mb-2">
              <data-download
                  :data="probData"
                  filename="pigean_gene"
              ></data-download>
          </div>
          <div v-html="'Total rows: ' + rows" class="table-total-rows"></div>
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
                  <!-- Link to where? -->
                  <a>
                      {{ r.item.gene }}
                  </a>
              </template>
              <template #cell(expand)="row">
                  <b-button
                      variant="outline-primary"
                      size="sm"
                      @click="showDetails(row, 1)"
                  >
                      {{ row.detailsShowing ? "Hide" : "Show" }}
                  </b-button>
              </template>
              <template #cell(expand1)="row">
                  <b-dropdown
                      split
                      right
                      :text="
                          row.detailsShowing && row.item.subtableActive === 1
                              ? 'Hide'
                              : 'Show'
                      "
                      variant="outline-primary"
                      size="sm"
                      @click="showDetails(row, 1)"
                  >
                      <b-dropdown-header id="dropdown-header-label">
                          Top 5 Genes
                      </b-dropdown-header>
                      <b-dropdown-item
                          v-for="gene in row.item.top_genes.split(';')"
                          :key="gene"
                          :href="`/pigean/gene.html?gene=${gene}${suffix}`"
                      >
                          {{ gene }}
                      </b-dropdown-item>
                  </b-dropdown>
              </template>
              <template #cell(expand2)="row">
                  <b-dropdown
                      split
                      right
                      :text="
                          row.detailsShowing && row.item.subtableActive === 2
                              ? 'Hide'
                              : 'Show'
                      "
                      variant="outline-primary"
                      size="sm"
                      @click="showDetails(row, 2)"
                  >
                      <b-dropdown-header id="dropdown-header-label">
                          Top 5 Gene Sets
                      </b-dropdown-header>
                      <b-dropdown-item
                          v-for="geneSet in row.item.top_gene_sets.split(';')"
                          :key="geneSet"
                          :href="`/pigean/geneset.html?geneset=${geneSet}${suffix}`"
                      >
                          {{
                              geneSet.length > 40
                                  ? `${geneSet.slice(0, 40)}...`
                                  : geneSet
                          }}
                      </b-dropdown-item>
                  </b-dropdown>
              </template>
              <template #row-details="row">
                <div v-if="
                          row.item.subtableActive === 1 &&
                          subtableData[subtableKey(row.item)]?.length > 0"
                  >
                  <div class="row">
                    <div class="col-md-6">
                      <bulk-violin-plot 
                            :data="subtableData[subtableKey(row.item)]"
                        />
                    </div>
                    <div class="col-md-6">
                      <scatterplot
                        :plotData="subtableData[subtableKey(row.item)]"
                        :config="scatterConfig"
                        :plotId="`bulk_${row.item.gene}`">

                      </scatterplot>
                    </div>
                  </div>
                  <bulk-table              
                      :bulkData="subtableData[subtableKey(row.item)]"
                      :config="{ 
                        fields: Object.keys(subtableData[subtableKey(row.item)][0]) }"
                      :isSubtable="true"
                  >
                  </bulk-table>
                </div>
                  
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
import keyParams from "@/utils/keyParams";
import BulkTable from "./BulkTable.vue";
import uiUtils from "@/utils/uiUtils";
import alertUtils from "@/utils/alertUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import dataConvert from "@/utils/dataConvert";
import { cloneDeep } from "lodash";
export default Vue.component("bulk-table", {
    components: {
        DataDownload,
        BulkTable,
    },
    props: [
        "bulkData",
        "config",
        "isSubtable",
        "filter",
        "scatterConfig"
    ],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            subtableData: {},
            subtable2Data: {},
            plotColors: plotUtils.plotColors(),
        };
    },
    computed: {
        utilsBox() {
            let utils = {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
            };
            return utils;
        },
        probFields() {
            return this.collateFields();
        },
        probData() {
            return this.computeProbabilities();
        },
        rows() {
            return this.bulkData.length || 0;
        },
        sortBy() {
            return this.bulkData.length === 0
                ? 0
                : this.config.fields
                      .map((field) => field.key)
                      .includes("factor_value")
                ? "factor_value"
                : this.config.sortBy
                ? this.config.sortBy
                : this.bulkData[0]["combined"] !== undefined
                ? "combined"
                : "beta_uncorrected";
        },
        tableData() {
            let data = this.probData;
            //add subtableActive to each row
            data.forEach((row) => {
                row.subtableActive = 0;
            });
            if (this.filter) {
                data = data.filter(this.filter);
            }
            return data;
        },
        genesetSize() {
            return keyParams.genesetSize;
        },
        traitGroup(){
            return keyParams.traitGroup;
        },
        suffix() {
            return `&genesetSize=${this.genesetSize}&traitGroup=${this.traitGroup}`;
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
        async getSubtable(row, whichSubtable) {
            let queryKey = this.subtableKey(row.item);
            if (!this.subtableData[queryKey] && whichSubtable === 1) {
                let data = await query(this.config.subtableEndpoint, queryKey);
                Vue.set(this.subtableData, queryKey, this.toNumeric(data));
            }
            if (
                !!this.config.subtable2Endpoint &&
                !this.subtable2Data[queryKey] &&
                whichSubtable === 2
            ) {
                let data2 = await query(
                    this.config.subtable2Endpoint,
                    queryKey
                );
                Vue.set(this.subtable2Data, queryKey, data2);
            }
        },
        async showDetails(row, tableNum) {
            this.toggleTable(row, tableNum);
            await this.getSubtable(row, tableNum);
        },
        toggleTable(row, subtable) {
            let show = false;
            if (subtable === row.item.subtableActive) {
                show = false;
            } else {
                show = true;
            }
            // Toggle active table
            row.item.subtableActive = !show ? 0 : subtable;
            // Hide details if it's currently showing and no tables should be active
            if (
                !show &&
                row.detailsShowing &&
                row.item.subtableActive === 0
            ) {
                row.toggleDetails();
            }
            // Show details if it's currently not showing but it should be
            if (
                show &&
                !row.detailsShowing && row.item.subtableActive !== 0
            ) {
                row.toggleDetails();
            }
        },
        subtableKey(item) {
            return `${item.dataset},${item[this.config.queryParam]}`;
        },
        generateId(label) {
            return label.replaceAll(",", "").replaceAll(" ", "_");
        },
        probability(val, prior = 0.05) {
            let a = Math.exp(Math.log(prior) + val);
            return a / (1 + a);
        },
        computeProbabilities() {
            let data = structuredClone(this.bulkData);
            for (let i = 0; i < this.config.fields.length; i++) {
                let fieldConfig = this.config.fields[i];
                if (!fieldConfig.showProbability) {
                    continue;
                }
                let field = fieldConfig.key;
                for (let j = 0; j < data.length; j++) {
                    if (!!data[j][field]) {
                        data[j][`${field}_probability`] = this.tpmFormatter(
                            this.probability(data[j][field])
                        );
                    }
                }
            }
            return data;
        },
        collateFields() {
            let allFields = [];
            this.config.fields.forEach((field) => {
                if (field.showProbability) {
                    allFields.push({
                        key: `${field.key}_probability`,
                        sortable: true,
                    });
                }
                allFields.push(field);
            });
            return allFields;
        },
        toNumeric(geneData){
          let fieldsToConvert = ["lognorm_counts", "cont__bmi", "cont__custom__age",
              "cont__custom__hdl", "cont__custom__homa-ir", "cont__custom__ldl",
              "cont__custom__tg"
          ];
          let outputData = structuredClone(geneData);
          for (let i = 0; i < fieldsToConvert.length; i++){
            let field = fieldsToConvert[i];
            outputData = outputData.map(item => {
              item[field] = parseFloat(item[field]);
              return item;
            })
          }
          return outputData;
        }
    },
});
</script>
<style scoped>
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
ul.top-list {
    font-size: 0.8rem;
}
</style>
