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
			<template #cell(show_datasets)="row">
				<b-button
					class="btn view-features-btn btn-secondary mr-2"
					size="sm"
					@click="row.toggleDetails"
				>
					{{ row.detailsShowing ? "Hide" : "Show" }} Datasets
				</b-button>
			</template>
			<template #row-details="row">
				<b-table
					class="dataset-subtable"
					hover
					small
					responsive="sm"
					:items="row.item['Datasets']"
					:fields="tableConfig['Datasets']"
				>
					<template #cell(dataset)="data">
						<a
							:href="`https://cmdga.org/annotations/${data.value}/`"
							target="_blank"
						>
							{{ data.value }}
						</a>
					</template>
				</b-table>
			</template>
		</b-table>
		<b-pagination
			v-model="currentPage"
			class="pagination-sm justify-content-center"
			:total-rows="tableData.length"
			:per-page="perPage"
		></b-pagination>
  </div>
</template>
<script>
  import Vue from "vue";
  import Formatters from "@/utils/formatters";
  export default Vue.component("ResearchExpressionTable", {
	  props: ["tableData"],
    data() {
      return {
        tableConfig: {
          "top rows": [
            { key: "tissue", sortable: true }, // Table is only visible when keying by tissue anyway
            { key: "Min TPM", sortable: true, formatter: "tpmFormat" },
            { key: "Q1 TPM", sortable: true, formatter: "tpmFormat" },
            {
              key: "Median TPM",
              sortable: true,
              formatter: "tpmFormat",
            },
            { key: "Q3 TPM", sortable: true, formatter: "tpmFormat" },
            { key: "Max TPM", sortable: true, formatter: "tpmFormat" },
            { key: "Total samples", sortable: true },
            { key: "show_datasets", sortable: false },
          ],
          features: ["Datasets"],
          Datasets: [
            {
              key: "biosample",
              formatter: (value) => Formatters.tissueFormatter(value),
            },
            {
              key: "collection",
              formatter: (value) => value.toString(", "),
            },
            {
              key: "dataset",
            },
            {
              key: "Min TPM",
              formatter: (value) =>
                Formatters.floatFormatter(`${value}`),
            },
            {
              key: "Q1 TPM",
              formatter: (value) =>
                Formatters.floatFormatter(`${value}`),
            },
            {
              key: "Median TPM",
              formatter: (value) =>
                Formatters.floatFormatter(`${value}`),
            },
            {
              key: "Q3 TPM",
              formatter: (value) =>
                Formatters.floatFormatter(`${value}`),
            },
            {
              key: "Max TPM",
              formatter: (value) =>
                Formatters.floatFormatter(`${value}`),
            },
            { key: "nSamples", label: "Samples" },
          ],
        },
        currentPage: 1,
        perPage: 10
      };
    },
    mounted(){
      console.log("THIS IS THE RESEARCH EXPRESSION TABLE.");
    }
  });
</script>
