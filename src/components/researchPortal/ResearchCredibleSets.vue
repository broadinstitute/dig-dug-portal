<template>
	<div class="mbm-plot-content row">
		<div
			v-if="searchingRegion != null"
			class="col-md-12 annotations-plot-wrapper"
		>
			<div class="col-md-9"></div>
			<div class="col-md-3">
				<h6>Add Credible Sets Track</h6>
				<div id="CSUIWrapper">
					{{ credibleSets }}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";
import keyParams from "@/utils/keyParams";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-credible-sets-plot", {
	props: [
		"region",
		"phenotype",
		"renderConfig",
		"compareGroupColors",
		"plotMargin",
	],
	data() {
		return { credibleSets: [] };
	},
	modules: {
		uiUtils,
		Formatters,
		keyParams,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		searchingRegion() {
			let returnObj = {};
			let regionArr = this.region.split(":");
			returnObj["chr"] = regionArr[0];
			returnObj["start"] = regionArr[1].split("-")[0];
			returnObj["end"] = regionArr[1].split("-")[1];

			let phenotype = null;
			if (this.phenotype != null) {
				phenotype = this.phenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig.phenotypeParameter]) {
					phenotype = keyParams[this.renderConfig.phenotypeParameter];
				} else {
					phenotype = null;
				}
			}

			if (phenotype != null) {
				this.getCredibleSetsList(returnObj, phenotype);
			}

			return returnObj;
		},
		searchingPhenotype() {
			let phenotype = null;
			if (this.phenotype != null) {
				phenotype = this.phenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig.phenotypeParameter]) {
					phenotype = keyParams[this.renderConfig.phenotypeParameter];
				} else {
					phenotype = null;
				}
			}
			return phenotype;
		},
	},
	watch: {},
	methods: {
		...uiUtils,
		onResize(e) {},
		async getCredibleSetsList(REGION, PHENOTYPE) {
			console.log("CS called");

			let CSServer =
				this.renderConfig.credibleSetsServer == "KP BioIndex"
					? "https://bioindex.hugeamp.org/api/bio"
					: this.renderConfig.annotationsServer;

			var CSURL =
				CSServer +
				"/query/credible-sets?q=" +
				PHENOTYPE +
				"," +
				REGION.chr +
				":" +
				REGION.start +
				"-" +
				REGION.end;

			var CSJson = await fetch(CSURL).then((resp) => resp.json());

			if (CSJson.error == null) {
				console.log("CSJson", CSJson);
				this.credibleSets = CSJson.data;
			}
		},
	},
});

$(function () {});
</script>

<style>
</style>



