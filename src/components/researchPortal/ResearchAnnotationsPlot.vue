<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12 annotations-plot-wrapper">
			<div id="annotationsPlotWrapper" class="col-md-9 anno-plot-wrapper">
				<canvas
					id="genesTrack"
					@resize="onResize"
					width=""
					height=""
				></canvas>
			</div>
			<div
				id="annotationsUIWrapper"
				class="col-md-3 anno-plot-ui-wrapper"
			>
				<select
					class="custom-select"
					@change="updateTissuesList($event)"
				>
					<option>{{ "Select annotation" }}</option>
					<option
						v-for="(annoValue, annoKey) in annoData"
						:key="annoKey"
						:value="annoKey"
						v-html="annoKey"
					></option>
				</select>
				<select class="custom-select">
					<option>{{ "Select tissue" }}</option>
					<option
						v-for="(tissueValue, tissueKey) in selectedAnno"
						:key="tissueKey"
						:value="tissueKey"
						v-html="tissueKey"
					></option>
				</select>
			</div>
		</div>
		{{ searchingRegion }}
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-annotations-plot", {
	props: ["region"],
	data() {
		return { annoData: {}, selectedAnno: {} };
	},
	modules: {
		uiUtils,
		Formatters,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		this.renderTrack(this.genesData);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		searchingRegion() {
			console.log(this.region);
			let returnObj = {};
			let regionArr = this.region.split(":");
			returnObj["chr"] = regionArr[0];
			returnObj["start"] = regionArr[1].split("-")[0];
			returnObj["end"] = regionArr[1].split("-")[1];

			this.getAnnotations(returnObj);

			return returnObj;
		},
		testReferencing() {
			if (this.searchingRegion != null) {
				console.log("it works");
			}
		},
	},
	watch: {},
	methods: {
		...uiUtils,
		onResize(e) {
			//this.renderTrack(this.genesData);
		},
		updateTissuesList(event) {
			console.log("updateTissuesList", event.target.value);
			this.selectedAnno = this.annoData[event.target.value];
		},
		async getAnnotations(REGION_OBJ) {
			if (
				!!REGION_OBJ &&
				!!REGION_OBJ.chr &&
				!!REGION_OBJ.start &&
				REGION_OBJ.end
			) {
				var annotationsURL =
					"https://bioindex.hugeamp.org/api/bio/query/regions?q=" +
					REGION_OBJ.chr +
					":" +
					REGION_OBJ.start +
					"-" +
					REGION_OBJ.end;

				var annotationsJson = await fetch(annotationsURL).then((resp) =>
					resp.json()
				);

				if (annotationsJson.error == null) {
					this.annoData = {};

					annotationsJson.data.map((a) => {
						if (!this.annoData[a.annotation]) {
							this.annoData[a.annotation] = {};
						}
						if (!this.annoData[a.annotation][a.tissue]) {
							this.annoData[a.annotation][a.tissue] = [];
						}

						this.annoData[a.annotation][a.tissue].push(a);
					});

					console.log("annoData", this.annoData);
				}
			}
		},
		renderTrack(DATA) {},
	},
});

$(function () {});
</script>

<style>
.annotations-plots-wrapper {
	padding: 0 !important;
}
.anno-plot-wrapper,
.anno-plot-ui-wrapper {
	display: inline-block;
}
</style>



