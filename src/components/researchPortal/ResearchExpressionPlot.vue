<template>
	<div class="chart-wrapper">
		<div class="filtering-ui-wrapper container-fluid">
			<div class="row filtering-ui-content">
				<div class="col filter-col-md">
					<div class="label">Scale</div>
					<select v-model="logScale" class="form-control">
						<option :value="false">Linear</option>
						<option :value="true">Logarithmic: log10(TPM+1)</option>
					</select>
				</div>
				<div class="col filter-col-md">
					<div class="label">Minimum sample count (>=)</div>
					<input
						class="form-control"
						v-model="minSamples"
						type="number"
					/>
				</div>
				<div class="col filter-col-md">
					<div class="label">Collection</div>
					<select
						class="form-control"
						v-model="collection"
						@change="applyFilter()"
					>
						<option value="all" selected>All</option>
						<template v-for="collection in processedCollection">
							<option :value="collection" :key="collection">
								{{ collection }}
							</option>
						</template>
					</select>
				</div>
			</div>
		</div>
		<research-gene-expression-plot
			:flatBoth="flatBoth"
			:colorMap="colorMap"
			:keyField="keyField"
			:logScale="logScale"
		>
		</research-gene-expression-plot>
		<research-expression-table
			:tableData="tableData">
		</research-expression-table>
	</div>
</template>
<script>
import Vue from "vue";
import * as d3 from "d3";
import uiUtils from "@/utils/uiUtils";
import colors from "@/utils/colors";
import Formatters from "@/utils/formatters";
import ResearchExpressionTable from "@/components/researchPortal/ResearchExpressionTable.vue";
import ResearchGeneExpressionPlot from "./ResearchGeneExpressionPlot.vue";
export default Vue.component("ResearchExpressionPlot", {
	props: ["rawData", "filter", "plotByField", "skipSort"],
	data() {
		return {
			logScale: true,
			keyField: this.$props.plotByField,
			keyFieldList: [],
			processedData: [],
			processedCollection: null,
			flatBoth: null,
			minSamples: 1,
			collection: "all",
			colorMap: {},
		};
	},
	computed: {
		tableData() {
			let keyFieldVals = [];
			this.processedData.forEach(item => {
				if (!keyFieldVals.includes(item[this.keyField])){
					keyFieldVals.push(item[this.keyField]);
				}
			});
			let dataRows = [];
			keyFieldVals.forEach(item => {
				let filteredDatasets = this.processedData.filter(entry => entry[this.keyField] === item);
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
			this.keyFieldList = keyFieldVals;
			return dataRows;
		},
	},
	watch: {
		rawData() {
			this.processData();
		},
		minSamples() {
			this.processData();
		},
	},
	mounted() {
		this.processData();
	},
	methods: {
		...uiUtils,

		applyFilter() {
			this.processData();
		},

		tpmFormat(value) {
			return Formatters.floatFormatter(`${value}`);
		},
		processData() {
			let processedCollection = [];
			let processedData = this.$props.rawData;
			processedData = processedData.filter(
				(distinctEntry) => {
					return distinctEntry && parseInt(distinctEntry["nSamples"]) >= this.minSamples
				}
			);
			processedData.map((d) => {
				d.collection.map((c, cIndex) => {
					d.collection[cIndex] = c.trim();
					processedCollection.push(c.trim());
				});
			});

			this.processedCollection = [...new Set(processedCollection)].sort();

			if (this.collection != "all") {
				processedData = processedData.filter(
					(d) => !!d.collection.includes(this.collection)
				);
			}

			processedData.forEach((entry) => {
                if(typeof entry.tpmForAllSamples === 'string'){
                    let tpms = entry.tpmForAllSamples
                        .split(",")
                        .map((i) => !!Number.isNaN(parseFloat(i)) ? 0 : parseFloat(i));
                    entry["tpmForAllSamples"] = tpms;
                }
				entry["tissue"] = Formatters.tissueFormatter(entry["tissue"]);
				entry["Min TPM"] = parseFloat(entry.minTpm);
				entry["Q1 TPM"] = parseFloat(entry.firstQuTpm);
				entry["Median TPM"] = parseFloat(entry.medianTpm);
				entry["Q3 TPM"] = parseFloat(entry.thirdQuTpm);
				entry["Max TPM"] = parseFloat(entry.maxTpm);
				entry["nSamples"] = parseInt(entry.nSamples);
			});
			if (!this.$props.skipSort){
				processedData.sort((a, b) => {
					if (a[this.keyField] > b[this.keyField]) {
						return 1;
					}
					if (a[this.keyField] < b[this.keyField]) {
						return -1;
					}
					return 0;
				});
			}
			let flatBoth = [];

			for (let item of processedData) {
				for (let tpmVal of item.tpmForAllSamples) {
					let flatEntry = {};
					flatEntry["tissue"] = item["tissue"];
					flatEntry["gene"] = item["gene"];
					flatEntry["linear"] = tpmVal;
					flatEntry["log"] = Math.log10(tpmVal + 1);
					flatEntry["noise"] = Math.random();
					flatEntry["biosample"] = Formatters.tissueFormatter(
						item.biosample
					);
					flatEntry["dataset"] = item.dataset;
					flatBoth.push(flatEntry);
				}
			}
			this.processedData = processedData;
			this.flatBoth = flatBoth;
			this.mapColors();
		},
		mapColors() {
			let colorMap = {};
			let colorIndex = 0;
			this.processedData.forEach((entry) => {
				if (!colorMap[entry[this.keyField]]) {
					colorMap[entry[this.keyField]] = colors[colorIndex];
					colorIndex++;
					if (colorIndex >= colors.length) {
						colorIndex = 0;
					}
				}
			});
			this.colorMap = colorMap;
		},
	},
});
</script>
