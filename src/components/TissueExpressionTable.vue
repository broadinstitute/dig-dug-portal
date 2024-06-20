<template>
  <div>
    <b-table
      v-if="tableData.length > 0"
      v-model="currentTable"
      id="big-table"
      small
      responsive="sm"
      :items="tableData"
      sort-by="Q"
      :sort-desc="true"
      :fields="newTableFields"
      :per-page="perPage"
      :current-page="currentPage"
      :filter-function="filter"
    >
      <template #cell(gene)="row">
          <a :href="`/gene.html?gene=${row.item.gene}`">
              {{ row.item.gene }}
          </a>
      </template>
      <template #cell(show_datasets)="row">
          <b-button
              variant="outline-primary"
              size="sm"
              @click="showEvidence(row)"
          >
              {{ row.detailsShowing ? "Hide" : "Show" }} Datasets
          </b-button>
      </template>
      <template #row-details="row">
          <tissue-expression-subtable
            v-if="!!evidence[row.item.gene]"
            :datasets="evidence[row.item.gene]"
            @highlight="(details) => highlight(details)">
          </tissue-expression-subtable>
      </template>
    </b-table>
    <b-pagination
        v-model="currentPage"
        class="pagination-sm justify-content-center"
        :total-rows="tableData.length"
        :per-page="perPage"
      >
    </b-pagination>
  </div>
</template>
<style>
@import url("/css/table.css");
</style>
<script>
  import Vue from "vue";
  import { query } from "@/utils/bioIndexUtils";
  import Formatters from "@/utils/formatters";
  import TissueExpressionSubtable from "@/components/TissueExpressionSubtable.vue";
  export default Vue.component("TissueExpressionTable", {
      props: ["tissueData", "tissue", "filter"],
      data() {
          return {
              perPage: 10,
              currentPage: 1,
              currentTable: [],
              genePlotData: [],
              evidence: {},
              datasetDetails: {},
              newTableFields: [
                  { key: "gene",
                      label: "Gene",
                      sortable: true,
                      tdClass: "gene-findable" },
                  { key: "nSamples",
                      label: "Samples",
                      sortable: true },
                  { key: "meanTpm",
                      label: "Mean TPM",
                      sortable: true,
                      formatter: Formatters.tpmFormatter },
                  { key: "Q",
                    label: "Combined score",
                    sortable: true,
                    formatter: Formatters.tpmFormatter },
                  { key: "H",
                    label: "Entropy (genericity)",
                    sortable: true },
                  { key: "show_datasets",
                    label: "Datasets"
                  }
              ],
          };
      },
      computed: {
        tableData(){
            let data = this.tissueData;
            if (this.filter){
                data = data.filter(this.filter);
            }
            return data;
        },
        currentGenes(){
            return this.currentTable.map(d => d.gene);
        },
      },
      methods: {
        tissueFormatter: Formatters.tissueFormatter,
        async showEvidence(row) {
          if (row.item.gene) {
              let gene = row.item.gene;
              //check if evidence object already has key equal gene
              if (!this.evidence[gene]) {
                  let data = await query("gene-expression", gene);
                  data = data.filter(
                      (d) => d.tissue === this.tissue.replace(" ", "_")
                  );
                  Vue.set(this.evidence, gene, this.parseData(data));
              }
          }
          row.toggleDetails();
        },
        parseData(data){
          data.forEach((entry) => {
            if(typeof entry.tpmForAllSamples === 'string'){
                let tpms = entry.tpmForAllSamples
                    .split(",")
                    .map((i) => !!Number.isNaN(parseFloat(i)) ? 0 : parseFloat(i));
                entry["tpmForAllSamples"] = tpms;
            }
            entry["keyField"] = entry.gene;
            entry["tissue"] = Formatters.tissueFormatter(entry["tissue"]);
            entry["Min TPM"] = parseFloat(entry.minTpm);
            entry["Q1 TPM"] = parseFloat(entry.firstQuTpm);
            entry["Median TPM"] = parseFloat(entry.medianTpm);
            entry["Q3 TPM"] = parseFloat(entry.thirdQuTpm);
            entry["Max TPM"] = parseFloat(entry.maxTpm);
            entry["nSamples"] = parseInt(entry.nSamples);
            entry["tpmLogs"] = entry.tpmForAllSamples.map(tpm => Math.log10(tpm + 1));
          });
          return data;
        },
        highlight(details) {
            this.$emit("highlight", details);
        },
      },
  });
</script>