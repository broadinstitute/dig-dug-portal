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
						<option value="" selected>All</option>
						<template v-for="collection in processedCollection">
							<option :value="collection" :key="collection">
								{{ collection }}
							</option>
						</template>
					</select>
				</div>
				<div class="col filter-col-md" v-if="showDiseaseFilter">
					<div class="label">Disease</div>
					<select
						class="form-control"
						v-model="disease"
						@change="applyFilter()"
						:disabled="!diseases.length"
					>
						<option value="" selected>All</option>
						<template v-for="diseaseName in diseases">
							<option :value="diseaseName" :key="diseaseName">
								{{ tissueFormatter(diseaseName) }}
							</option>
						</template>
					</select>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import Vue from "vue";
import * as d3 from "d3";
import uiUtils from "@/utils/uiUtils";
import Formatters from "@/utils/formatters";
export default Vue.component("ResearchExpressionFilter", {
	props: ["rawData", "filter", "plotByField", "skipSort"],
	data() {
		return {
			logScale: true,
			keyField: this.$props.plotByField,
			processedCollection: null,
			minSamples: 1,
			collection: "all",
			showDiseaseFilter: false,
			diseases: [],
			disease: ""
		};
	},
	watch: {
		rawData() {
			this.processData();
		},
		minSamples() {
			this.processData();
		},
		logScale(){
			this.processData();
		}
	},
	mounted() {
		this.processData();
		if (this.diseases.length > 0){
			this.showDiseaseFilter = true;
		}
	},
	methods: {
		...uiUtils,
		tissueFormatter: Formatters.tissueFormatter,
		toSnakeFormatter: Formatters.toSnakeFormatter,
		snakeFormatter: Formatters.snakeFormatter,
		applyFilter() {
			this.processData();
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
			if (!processedCollection.includes(this.collection)){
				this.collection = "";
			}
			if (this.collection) {
				processedData = processedData.filter(
					(d) => !!d.collection.includes(this.collection)
				);
			}
			let diseases = processedData.filter(d => !!d.diseaseTermName).map(d => d.diseaseTermName);
			if (!diseases.includes(this.disease)){
				this.disease = "";
			}
			this.diseases = [...new Set(diseases)].sort();
			if (this.disease){
				processedData = processedData.filter(d => d.diseaseTermName === this.disease);
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
			for (let item of processedData){
				// Round-trip formatting is essential to prevent any discrepancies on the plot.
				item.keyField = this.keyField === "tissue"
					? this.snakeFormatter(this.toSnakeFormatter(item.tissue))
					: item[this.keyField];
				item.tpmsToUse = this.logScale ? 
					item.tpmForAllSamples.map(tpm => Math.log10(tpm + 1)) : 
					item.tpmForAllSamples;
			}
			this.$emit("dataReady", processedData);
		},
	},
});
</script>
