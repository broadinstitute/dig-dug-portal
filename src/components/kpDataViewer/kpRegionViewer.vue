<template>
	<div class="mbm-plot-content">
		<div
			class="kp-region-viewer-wrapper"
			v-for="(item, itemKey) in gatheredData"
		>
			<h5 v-html="itemKey"></h5>
			<div class="row">
				<div class="col-md-8 association-plot-wrapper">
					<canvas
						:id="pkgID + '_' + itemKey + '_associationPlot'"
						width=""
						height=""
					>
					</canvas>
				</div>
				<div class="col-md-4 ld-plot-wrapper">
					<canvas
						:id="pkgID + '_' + itemKey + '_ldPlot'"
						width=""
						height=""
					>
					</canvas>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import umLdServer from "@/modules/umLdServer.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("kp-region-viewer", {
	props: ["plotData", "plotLayout", "renderConfig", "region", "pkgID"],
	data() {
		return {
			gatheredData: {},
			ldColor: [
				"#2074B620",
				"#32AFD520",
				"#4DB05220",
				"#EE982D20",
				"#D0363320",
			],
			compareGroupColors: [
				"#007bff50",
				"#04884550",
				"#8490C850",
				"#BF61A550",
				"#EE312450",
				"#FCD70050",
				"#5555FF50",
				"#7aaa1c50",
				"#9F78AC50",
				"#F8808450",
				"#F5A4C750",
				"#CEE6C150",
				"#cccc0050",
				"#6FC7B650",
				"#D5A76850",
				"#d4d4d450",
			],
		};
	},
	modules: {},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		plotsList() {
			//let plotsKeys = [];
			if (this.plotData != null) {
				let plotsKeys = this.plotData.map(
					(p) => p[this.renderConfig.multiPlotsBy]
				);

				plotsKeys = [...new Set(plotsKeys)];

				return plotsKeys;
			} else {
				return null;
			}
		},
		associationData() {
			if (this.plotsList != null) {
				this.gatheredData = {};
				/// add each plotting groups data wrappers to gatheredData
				this.plotsList.map((p) => {
					this.gatheredData[p] = {};
					this.gatheredData[p]["association"] = {};
					this.gatheredData[p]["associationHi"] = null;
					this.gatheredData[p]["associationLow"] = null;

					//set this.gateredData object for LD & recombination rate, or any other features in the future
					if (this.renderConfig.features.length > 0) {
						this.renderConfig.features.map((f) => {
							this.gatheredData[p][f] = {};
							if (f == "LD") {
								this.gatheredData[p]["ldReference"] = {
									variant: null,
									ldPopulation: !!this.renderConfig
										.ldPopulation.ifStatic
										? this.renderConfig.ldPopulation.value
										: null,
								};
							}
						});
					}
				});
				// gather data for association plot
				var populationsObj = {};
				this.plotData.map((p) => {
					let group = p[this.renderConfig.multiPlotsBy];

					let xFieldValue = p[this.renderConfig.xAxisField];
					let yFieldValue = p[this.renderConfig.yAxisField];

					let tempObj = {};
					tempObj[this.renderConfig.xAxisField] = xFieldValue;
					tempObj[this.renderConfig.yAxisField] = yFieldValue;

					this.renderConfig.hoverContent.map((h) => {
						tempObj[h] = p[h];
					});
					this.gatheredData[group].association[
						p[this.renderConfig.renderBy]
					] = tempObj;

					// set high and low values of association data
					// set association high
					let assoHi = this.gatheredData[group].associationHi;
					this.gatheredData[group].associationHi =
						assoHi == null
							? yFieldValue
							: yFieldValue > assoHi
							? yFieldValue
							: assoHi;
					// set ld reference variant
					this.gatheredData[group].ldReference.variant =
						assoHi == null
							? p[this.renderConfig.renderBy]
							: yFieldValue > assoHi
							? p[this.renderConfig.renderBy]
							: this.gatheredData[group].ldReference.variant;

					// set association low
					let assoLow = this.gatheredData[group].associationLow;

					this.gatheredData[group].associationLow =
						assoLow == null
							? yFieldValue
							: yFieldValue < assoLow
							? yFieldValue
							: assoLow;

					//gather population IDs for the next step, setting LD population

					populationsObj[group] = !!populationsObj[group]
						? populationsObj[group]
						: [];

					populationsObj[group].push(
						p[this.renderConfig.ldPopulation.value]
					);
				});

				this.plotsList.map((p) => {
					if (this.gatheredData[p].ldReference.ldPopulation == null) {
						let ldPopulationArr = [...new Set(populationsObj[p])];
						this.gatheredData[p].ldReference.ldPopulation =
							ldPopulationArr.length == 1
								? ldPopulationArr[0]
								: "ALL";
					}
				});

				return this.gatheredData;
			}
		},
	},
	watch: {
		associationData(DATA) {
			this.callLD();
		},
	},
	methods: {
		onResize() {},
		callLD() {
			console.log("callLD is called", this.gatheredData);
			for (const [key, value] of Object.entries(this.gatheredData)) {
				this.getLDData(
					value.ldReference.variant,
					value.ldReference.ldPopulation,
					key
				);
			}
		},
		async getLDData(REF_VARIANT, ANCESTRY, GROUP) {
			let ldUrl =
				"https://portaldev.sph.umich.edu/ld/genome_builds/GRCh37/references/1000G/populations/" +
				ANCESTRY +
				"/variants?correlation=rsquare&variant=" +
				REF_VARIANT +
				"&chrom=" +
				this.region.chr +
				"&start=" +
				this.region.start +
				"&stop=" +
				this.region.end +
				"&limit=100000";

			let json = await fetch(ldUrl).then((resp) => resp.json());

			console.log("LD json", json);
		},
	},
});
</script>

<style>
.association-plot-wrapper,
.ld-plot-wrapper {
	padding: 0 !important;
}
</style>


async getVariantCorrelations(context, param) {

            let json = await fetch(
                param.ldUrl
            ).then(resp => resp.json());

            context.commit("setVariantCorrelations", json);
        }
