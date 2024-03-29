<template>
  <div>
    <b-table
			v-if="tableData.length > 0"
			id="big-table"
			hover
			small
			responsive="sm"
			:items="tableData"
			:fields="tableConfig['top rows']"
			:per-page="perPage"
			:current-page="currentPage"
		>
      <template #cell(tissue)="row">
        <a :href="`/tissue.html?tissue=${toSnakeFormatter(row.item.tissue)}`" 
          >
            {{ tissueFormatter(row.item.tissue) }}
        </a>
      </template>
      <template #cell(gene)="row">
        <a :href="`/gene.html?gene=${row.item.gene}`" 
          >
            {{ row.item.gene}}
        </a>
      </template>
			<template #cell(show_datasets)="row">
				<b-button
          variant="outline-primary"
					size="sm"
					@click="row.toggleDetails"
				>
					{{ row.detailsShowing ? "Hide" : "Show" }} Datasets
				</b-button>
			</template>
			<template #row-details="row">
				<research-dataset-subtable
          :row="row"
          :fields="tableConfig['Datasets']"
          :plotByField="plotByField"
          @highlight="details => highlight(details)">
        </research-dataset-subtable>
			</template>
		</b-table>
		<b-pagination v-if="plotByField === 'tissue'"
			v-model="currentPage"
			class="pagination-sm justify-content-center"
			:total-rows="tableData.length"
			:per-page="perPage"
		></b-pagination>
  </div>
</template>
<script>
  import Vue from "vue";
  import * as d3 from "d3";
  import Formatters from "@/utils/formatters";
  import ResearchDatasetSubtable from "@/components/researchPortal/ResearchDatasetSubtable.vue";
  export default Vue.component("ResearchExpressionTable", {
	  props: {
      filteredData: Array,
      plotByField: {
        type: String,
        default: "tissue"
      }
    },
    data() {
      return {
        tableConfig: {
          "top rows": [
            { key: `${this.$props.plotByField}`, sortable: true },
            { key: "Min TPM", sortable: true, formatter: Formatters.tpmFormatter },
            { key: "Q1 TPM", sortable: true, formatter: Formatters.tpmFormatter },
            { key: "Median TPM", sortable: true, formatter: Formatters.tpmFormatter,},
            { key: "Q3 TPM", sortable: true, formatter: Formatters.tpmFormatter },
            { key: "Max TPM", sortable: true, formatter: Formatters.tpmFormatter },
            { key: "Total samples", sortable: true },
            { key: "show_datasets", label: "Evidence", sortable: false },
          ],
          features: ["Datasets"],
          Datasets: [
            { key: "biosample", formatter: Formatters.tissueFormatter, sortable: true },
            { key: "collection", formatter: (value) => value.toString(", ") },
            { key: "dataset", sortable: true},
            { key: "diseaseTermName", label: "Disease", sortable: true,
              formatter: (value) => !value ? "Not available" : Formatters.tissueFormatter(value)},
            { key: "Min TPM", formatter: Formatters.tpmFormatter, sortable: true },
            { key: "Q1 TPM", formatter: Formatters.tpmFormatter, sortable: true },
            { key: "Median TPM", formatter: Formatters.tpmFormatter, sortable: true },
            { key: "Q3 TPM", formatter: Formatters.tpmFormatter, sortable: true },
            { key: "Max TPM", formatter: Formatters.tpmFormatter, sortable: true },
            { key: "nSamples", label: "Samples", sortable: true },
          ],
        },
        currentPage: 1,
        perPage: 10,
        tableData: [],
        keyField: this.$props.plotByField
      };
    },
    mounted(){
      this.getTableData();
    },
    watch: {
      filteredData(){
        this.getTableData();
      }
    },
    methods: {
      toSnakeFormatter: Formatters.toSnakeFormatter,
      tissueFormatter: Formatters.tissueFormatter,
      getTableData() {
        let processedData = this.$props.filteredData;
        let keyFieldVals = [];
        processedData.forEach(item => {
          if (!keyFieldVals.includes(item[this.keyField])){
            keyFieldVals.push(item[this.keyField]);
          }
        });
        let dataRows = [];
        keyFieldVals.forEach(item => {
          let filteredDatasets = processedData.filter(entry => entry[this.keyField] === item);
          let tpms = filteredDatasets.reduce((list, entry) =>
            list.concat(entry.tpmForAllSamples), []).sort(d3.ascending);
          let singleRow = {
            "Min TPM": tpms[0],
            "Q1 TPM": d3.quantile(tpms, 0.25),
            "Median TPM": d3.quantile(tpms, 0.5),
            "Q3 TPM": d3.quantile(tpms, 0.75),
            "Max TPM": tpms[tpms.length - 1],
            "Total samples": tpms.length,
            "Datasets": filteredDatasets,
          }
          singleRow[this.keyField] = item; // use keyField property as object key
          dataRows.push(singleRow);
        });
        this.tableData = dataRows;
      },
      datasetRowClass(d){
        //let parentRow = this.plotByField === "gene" ? d.gene : this.toSnakeFormatter(d.tissue);
        let parentRow = this.toSnakeFormatter(d[this.plotByField]);
        return `data_${parentRow}_${d.dataset}`;
      },
      highlight(details){
        this.$emit("highlight", details);
      }
    }
  });
</script>
