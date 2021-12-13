<template>
	<div class="mbm-plot-content row">
		<div
			id="annotationsPlotWrapper"
			class="col-md-12 annotations-plot-wrapper"
			v-if="searchingRegion != null"
		>
			<div class="col-md-9 anno-plot-wrapper">
				<canvas
					id="annotationsPlot"
					@resize="onResize"
					width=""
					height=""
				></canvas>
			</div>
			<div
				id="annotationsUIWrapper"
				class="col-md-3 anno-plot-ui-wrapper"
			>
				<div class="filtering-ui-wrapper">
					<div class="filtering-ui-content">
						<div class="col">
							<span
								v-for="(
									annoValue, annoKey, annoIndex
								) in annoData"
								class="anno-bubble"
								v-html="annoKey"
								:style="
									'background-color:' +
									compareGroupColors[annoIndex] +
									';'
								"
								:key="annoKey"
							></span>
							<select
								class="custom-select"
								@change="updateTissuesList($event)"
							>
								<option>{{ "Select annotation" }}</option>
								<option
									:value="'all'"
									v-html="'All annotations'"
								></option>
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
									v-for="(
										tissueValue, tissueKey
									) in selectedAnno"
									:key="tissueKey"
									:value="tissueKey"
									v-html="tissueKey"
								></option>
							</select>
						</div>
					</div>
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

Vue.use(BootstrapVueIcons);

export default Vue.component("research-annotations-plot", {
	props: ["region", "plotMargin", "compareGroupColors"],
	data() {
		return { annoData: {}, tissuesData: {}, selectedAnno: {} };
	},
	modules: {
		uiUtils,
		Formatters,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		//this.renderTrack(this.genesData);
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
			this.selectedAnno = this.annoData[event.target.value];
		},
		getColorIndex(anno) {
			let annoArry = Object.keys(this.annoData);
			let i = annoArry.indexOf(anno);
			return this.compareGroupColors[i];
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
					this.tissuesData = {};

					annotationsJson.data.map((a) => {
						// annoData
						if (!this.annoData[a.annotation]) {
							this.annoData[a.annotation] = {};
						}
						if (!this.annoData[a.annotation][a.tissue]) {
							this.annoData[a.annotation][a.tissue] = [];
						}

						this.annoData[a.annotation][a.tissue].push(a);

						//tissuesData
						if (!this.tissuesData[a.tissue]) {
							this.tissuesData[a.tissue] = {};
						}

						if (!this.tissuesData[a.tissue][a.annotation]) {
							this.tissuesData[a.tissue][a.annotation] = [];
						}
						this.tissuesData[a.tissue][a.annotation].push(a);
					});
					this.renderAnnoPlot();
				}
			}
		},
		renderAnnoPlot() {
			var sortedTissues = Object.keys(this.tissuesData)
				.sort()
				.reduce((a, c) => ((a[c] = this.tissuesData[c]), a), {});

			console.log("sortedTissues", sortedTissues);

			var tempHeight = 0;
			let fontSize = 14;
			let perAnnotation = 14;
			let spaceBtnTissue = 10;

			for (const [tissue, annotations] of Object.entries(sortedTissues)) {
				tempHeight += fontSize;
				tempHeight += Object.keys(annotations).length * perAnnotation;
				tempHeight += spaceBtnTissue;
			}

			// findout width and height of canvas and actual plots. use #rp_region_plot to measure
			let canvasWidth =
				document.querySelector("#annotationsPlotWrapper").clientWidth *
					0.75 -
				30; //30 <- left & right padding of wrapper

			let canvasHeight =
				tempHeight +
				this.plotMargin.topMargin +
				this.plotMargin.bottomMargin;

			let plotWidth = canvasWidth - this.plotMargin.leftMargin * 2;
			let plotHeight = tempHeight;
			let bump = 5.5;

			let perPixel =
				plotWidth /
				(this.searchingRegion.end - this.searchingRegion.start);

			let c, ctx;
			c = document.querySelector("#annotationsPlot");
			c.setAttribute("width", canvasWidth);
			c.setAttribute("height", canvasHeight);
			ctx = c.getContext("2d");

			this.renderByTissues(
				ctx,
				sortedTissues,
				canvasWidth,
				canvasHeight,
				plotWidth,
				perPixel,
				fontSize,
				perAnnotation,
				spaceBtnTissue,
				bump
			);
		},
		renderByTissues(
			ctx,
			sortedTissues,
			canvasWidth,
			canvasHeight,
			plotWidth,
			perPixel,
			fontSize,
			perAnnotation,
			spaceBtnTissue,
			bump
		) {
			let renderHeight = fontSize;

			console.log("this.searchingRegion", this.searchingRegion);
			// render by tissues
			for (const [tissue, annotations] of Object.entries(sortedTissues)) {
				ctx.font = fontSize + "px Arial";
				ctx.textAlign = "left";
				ctx.fillStyle = "#000000";
				ctx.fillText(tissue, bump, renderHeight);
				renderHeight += fontSize;
				for (const [annoKey, position] of Object.entries(annotations)) {
					//console.log("position", position);
					ctx.font = fontSize - 2 + "px Arial";
					ctx.textAlign = "left";
					ctx.fillStyle = "#000000";
					ctx.fillText(
						annoKey,
						this.plotMargin.leftMargin + plotWidth + bump * 2,
						renderHeight
					);

					//console.log("color", this.getColorIndex(annoKey));

					//this.renderAxisPerTrack(ctx,);

					ctx.fillStyle = this.getColorIndex(annoKey);

					position.map((p) => {
						///
						ctx.strokeStyle = "#aaaaaa";
						ctx.moveTo(
							this.plotMargin.leftMargin - bump,
							renderHeight - fontSize * 0.75
						);
						ctx.lineTo(
							this.plotMargin.leftMargin - bump,
							renderHeight - fontSize * 0.75 + perAnnotation
						);
						//ctx.stroke();

						ctx.moveTo(
							Math.round(
								this.plotMargin.leftMargin + plotWidth + bump
							) + 0.5,
							renderHeight - fontSize * 0.75
						);
						ctx.lineTo(
							Math.round(
								this.plotMargin.leftMargin + plotWidth + bump
							) + 0.5,
							renderHeight - fontSize * 0.75 + perAnnotation
						);
						ctx.stroke();

						ctx.strokeStyle = "#eaeaea";
						ctx.moveTo(
							this.plotMargin.leftMargin - bump,
							Math.round(renderHeight + fontSize * 0.25) - 0.5
						);
						ctx.lineTo(
							Math.round(
								this.plotMargin.leftMargin + plotWidth + bump
							) + 0.5,
							Math.round(renderHeight + fontSize * 0.25) - 0.5
						);
						ctx.stroke();
						///
						let xPosStart =
							(p.start - this.searchingRegion.start) * perPixel +
							this.plotMargin.leftMargin;

						xPosStart =
							xPosStart <= this.plotMargin.leftMargin
								? this.plotMargin.leftMargin
								: xPosStart;
						let xPosEnd =
							(p.end - this.searchingRegion.start) * perPixel +
							this.plotMargin.leftMargin;

						xPosEnd =
							xPosEnd > this.plotMargin.leftMargin + plotWidth
								? this.plotMargin.leftMargin + plotWidth
								: xPosEnd;

						let xPosWidth = xPosEnd - xPosStart;

						ctx.fillRect(
							xPosStart,
							renderHeight - fontSize * 0.75,
							xPosWidth,
							perAnnotation
						);
					});
					renderHeight += perAnnotation;
				}
				renderHeight += spaceBtnTissue;
			}
		},
	},
});

$(function () {});
</script>

<style>
.annotations-plots-wrapper {
	padding: 0 !important;
}

.annotations-plot-wrapper {
	padding: 0 !important;
}
.anno-plot-wrapper,
.anno-plot-ui-wrapper {
	display: inline-block;
	vertical-align: top;
}
.anno-bubble {
	display: block;
	font-size: 14px;
	margin-left: 3px;
	margin-right: 3px;
	padding: 0px 8px;
	border-radius: 8px;
	float: left;
	margin-bottom: 3px;
}
</style>



