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
			for (let item of processedData){
				item.keyField = item[this.keyField];
				item.tpmsToUse = this.logScale ? 
					item.tpmForAllSamples.map(tpm => Math.log10(tpm + 1)) : 
					item.tpmForAllSamples;
			}
			this.$emit("dataReady", processedData);
		},
	},
});
</script>
