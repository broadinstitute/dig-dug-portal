<template>
  <div id="pigean-gene" :class="isSubtable ? 'pigean-subtable' : ''">
      <div v-if="tableData.length > 0">
          <div v-if="!isSubtable" class="text-right mb-2">
              <data-download
                  :data="bulkData"
                  filename="pigean_gene"
              ></data-download>
          </div>
          <div v-html="'Total rows: ' + rows" class="table-total-rows"></div>
          <b-table
              :hover="isSubtable"
              small
              responsive="sm"
              :items="tableData"
              :fields="config.fields"
              :per-page="perPage"
              :current-page="currentPage"
              :sort-by="isSubtable? 'sample_id' : '-log10P'"
              :sort-desc="!isSubtable"
              :sort-icon-left="true"
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
              <template #row-details="row">
                <div class="subtable-all" v-if="
                          subtableData[subtableKey(row.item)]?.length > 0"
                  >
                  <div class="row subtable-selectors">
                    <div class="col-md-1"></div>
                    <div class="col-md-4">
                        <div class="label">View data by categorical field.</div>
                        <select v-model="catField">
                            <option v-for="field in catFields"
                                :value="field">
                                {{ field.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-md-2"></div>
                    <div class="col-md-4">
                        
                        <div class="label">View data by continuous field.</div>
                        <select v-model="contField">
                            <option v-for="field in contFields"
                                :value="field">
                                {{ field.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-md-1"></div>
                  </div>
                  <div class="row subtable-plots">
                    <div class="col-md-6">
                        <bulk-violin-plot 
                            :data="subtableData[subtableKey(row.item)]"
                            :gene="row.item.gene"
                            :xField="catField?.key || catFields[0].key"
                            :xLabel="catField?.label || catFields[0].label"
                        />
                    </div>
                    <div class="col-md-6">
                      <scatterplot
                        :plotData="subtableData[subtableKey(row.item)]"
                        :config="scatterConfig"
                        :plotId="`bulk_${row.item.gene}`"
                        :hideDownload="true"
                        :tightenLeft="true">

                      </scatterplot>
                    </div>
                  </div>
                  <bulk-table              
                      :bulkData="subtableData[subtableKey(row.item)]"
                      :config="{fields : subtableFields[subtableKey(row.item)]}"
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
        "dataset"
    ],
    data() {
        return {
            perPage: 20,
            currentPage: 1,
            subtableData: {},
            subtableFields: {},
            contFields: [
              {
                key: "cont__custom__age",
                label: "Age",
                sortable: true,
              },
              {
                key: "cont__custom__hdl",
                label: "HDL",
                sortable: true,
              },
              {
                key: "cont__custom__homa-ir",
                label: "HOMA-IR",
                sortable: true
              },
              {
                key: "cont__custom__ldl",
                label: "LDL",
                sortable: true
              },
              {
                key: "cont__custom__tg",
                label: "Triglycerides",
                sortable: true
              }
            ],
            contField: null,
            catFields: [
                {
                    key: "cat__bmi__group",
                    label: "BMI Group",
                    sortable: true
                },
                {
                    key: "cat__custom__cell_type",
                    label: "Cell type",
                    sortable: true
                },
                {
                    key: "cat__custom__surgery",
                    label: "Surgery",
                    sortable: true
                }
            ],
            catField: null
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
        scatterConfig(){
            if (this.contField === null){
                this.contField = this.contFields[0];
            }
            let config = {
                xField: this.contField.key,
                xAxisLabel: this.contField.label,
                yField: "norm_counts",
                yAxisLabel: "Norm counts",
                dotKey: "sample_id",
                hoverBoxPosition: "both",
                plotHeight: 350,
                hoverFields: [
                    {key: "sample_id", label: "Sample"},
                    {key: this.contField.key, label: this.contField.label},
                    {key: "norm_counts", label: "Norm"}
                ],
            };
            return config;
        },
        rows() {
            return this.bulkData.length || 0;
        },
        tableData() {
            let data = structuredClone(this.bulkData);
            if (this.filter) {
                data = data.filter(this.filter);
            }
            return data;
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
            let queryKey = this.subtableKey(row.item);
            if (!this.subtableData[queryKey]) {
                let data = await query(this.config.subtableEndpoint, queryKey);
                console.log(JSON.stringify(data[0]));
                let fields = this.getFields(data[0]);
                Vue.set(this.subtableData, queryKey, this.toNumeric(data, fields));
                Vue.set(this.subtableFields, queryKey, fields);
            }
        },
        async showDetails(row) {
            row.toggleDetails();
            await this.getSubtable(row);
        },
        subtableKey(item) {
            let mySubtableKey = `${this.dataset},${item[this.config.queryParam]}`;
            return mySubtableKey;
        },
        generateId(label) {
            return label.replaceAll(",", "").replaceAll(" ", "_");
        },
        getFields(data){
            let fields = [
                {
                    key: "sample_id",
                    label: "Sample",
                    sortable: true,
                },
                {
                    key: "norm_counts",
                    label: "Norm counts",
                    sortable: true,
                },
            ];
            let dataKeys = Object.keys(data);
            let catFields = dataKeys.filter(field => field.startsWith("cat__"))
                .map(field => { return {
                    key: field,
                    label: field.replace("cat__", ""),
                    sortable: true
                }});
            let contFields = dataKeys.filter(field => field.startsWith("cont__"))
                .map(field => { return {
                    key: field,
                    label: field.replace("cont__", ""),
                    sortable: true,
                    isNumerical: true
                }});
            fields = fields.concat(catFields);
            fields = fields.concat(contFields);
            return fields;
        },
        toNumeric(geneData, fields){
          let fieldsToConvert = fields.filter(field => field.isNumerical)
            .map(field => field.key);
          fieldsToConvert.push("norm_counts");
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
    mounted(){
        this.catField = this.catFields[0];
    }
});
</script>
<style scoped>
@import url("/css/effectorGenes.css");

label {
    margin: 10px;
}
.pigean-subtable {
    margin-left: 15px;
    padding-left: 30px;
    background-color: #efefef;
}
.pigean-subtable .row .col-12 {
    padding: 0 0 0 5px !important;
}
ul.top-list {
    font-size: 0.8rem;
}
button {
    padding-bottom: 0px !important;
    padding-top: 0px !important;
}
.subtable-selectors{
    margin-bottom: 20px;
    padding-top: 20px;
}
.subtable-all {
    background-color: #efefef;
}
</style>
