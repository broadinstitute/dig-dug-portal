<template>
	<div class="mbm-plot-content">
		<div
			class="kp-region-viewer-wrapper row"
			v-for="(item, itemKey) in gatheredData"
		>
			<div class="col-md-12">
				<h4 v-html="itemKey"></h4>
				<div class="col-md-8"></div>
				<div class="col-md-4"></div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("kp-region-viewer", {
	props: ["plotData", "plotLayout", "renderConfig", "region"],
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
			let plotsKeys = [];
			if (this.plotData != null) {
				this.plotData.map((p) => {
					plotsKeys.push(p[this.renderConfig.multiPlotsBy]);
				});

				plotsKeys = [...new Set(plotsKeys)];

				return plotsKeys;
			} else {
				return null;
			}
		},
		variantData() {
			if (this.plotsList != null) {
				this.gatheredData = {};
				/// add each plotting groups data wrappers to gatheredData
				this.plotsList.map((p) => {
					this.gatheredData[p] = {};
					this.gatheredData[p]["variantsData"] = {};
					if (this.renderConfig.features.length > 0) {
						this.renderConfig.features.map((f) => {
							this.gatheredData[p][f] = {};
						});
					}
				});
				this.plotData.map((p) => {
					let group = p[this.renderConfig.multiPlotsBy];
					let tempObj = {};
					tempObj[this.renderConfig.xAxisField] =
						p[this.renderConfig.xAxisField];
					tempObj[this.renderConfig.yAxisField] =
						p[this.renderConfig.yAxisField];

					this.renderConfig.hoverContent.map((h) => {
						tempObj[h] = p[h];
					});
					this.gatheredData[group]["variantsData"][
						p[this.renderConfig.renderBy]
					] = tempObj;
				});

				return this.gatheredData;
			}
		},
	},
	watch: {
		variantData(DATA) {
			this.renderPlots(DATA);
		},
	},
	methods: {
		onResize() {},
		renderPlots(DATA) {},
	},
});
</script>

<style>
</style>



