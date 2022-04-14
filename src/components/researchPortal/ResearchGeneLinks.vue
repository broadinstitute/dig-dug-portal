<template>
	<div class="mbm-plot-content row">
		<div
			class="col-md-12 gene-links-plot-wrapper"
			v-if="searchingRegion != null"
		>
			<div class="col-md-9 gene-link-plot-wrapper">
				<div id="geneLinksUIWrapper">
					<div
						class="filtering-ui-wrapper add-content"
						style="width: 100%; padding: 0 10px; text-align: left"
					>
						<div class="filtering-ui-content">
							<div class="col" style="padding: 2px">
								<div
									class="label"
									style="
										display: inline-block;
										margin-right: 10px;
									"
								>
									Select Tissue
								</div>
								<select
									class="custom-select"
									@change="getGeneLinks($event)"
								>
									<option value="">
										{{ "Select Tissue" }}
									</option>
									<template v-for="tissue in GLTissues">
										<option
											:key="tissue.tissue"
											:value="tissue.tissue"
											v-html="getTissueLabel(tissue)"
										></option>
									</template>
								</select>
							</div>
						</div>
						<div
							class=""
							v-if="
								!!this.pkgData.GLData &&
								Object.keys(this.pkgData.GLData).length > 0 &&
								!renderConfig['no search key bubbles']
							"
							style="position: absolute; right: 10px; top: 7px"
						>
							<template
								v-for="tissue in Object.keys(
									this.pkgData.GLData
								)"
							>
								<span
									:key="tissue"
									:class="'btn GL-search-bubble '"
									style="
										'background-color:#aaaaaa'
									"
									v-html="
										tissue +
										'&nbsp;<span class=\'remove\'>X</span>'
									"
									@click="removeGLTissue(tissue)"
								></span>
							</template>
						</div>
					</div>
				</div>
				<div id="geneLinksPlotWrapper">
					<div id="GLInfoBox" class="hidden"></div>

					<canvas
						id="geneLinksPlot"
						@resize="onResize"
						width=""
						height=""
					></canvas>
				</div>
			</div>
			<div class="col-md-3 anno-plot-ui-wrapper reference-area">
				<div
					v-if="
						!!this.pkgData.GLData &&
						Object.keys(this.pkgData.GLData).length > 0
					"
				>
					<h6><strong>Methods</strong></h6>

					<div
						v-for="(m, mIndex) in methodsArr"
						:key="m"
						style="display: inline-block"
					>
						<label
							:style="
								'padding-right: 5px; margin-right: 5px; border-bottom: solid 3px ' +
								methodsColors[mIndex] +
								';'
							"
							><input
								type="checkbox"
								:class="m.replace(/ /g, '_')"
								:value="m"
								checked
							/>{{ " " + m + " " }}
						</label>
					</div>

					<h6><strong>Genes</strong></h6>
					<div
						v-for="g in genesArr"
						:key="g"
						style="display: inline-block"
					>
						<label style="padding-right: 10px"
							><input
								type="checkbox"
								:class="g.replace(/ /g, '_')"
								:value="g"
								checked
							/>{{ " " + g + " " }}
						</label>
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
import plotUtils from "@/utils/plotUtils";
import alertUtils from "@/utils/alertUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";
import keyParams from "@/utils/keyParams";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-gene-links-plot", {
	props: [
		"region",
		"phenotype",
		"renderConfig",
		"plotMargin",
		"methodsColors",
		"dataComparison",
		"plotData",
		"pkgData",
		"pkgDataSelected",
		"regionZoom",
		"regionViewArea",
	],
	data() {
		return {
			spaceBy: 10,
			GEData: {},
			trigger: 0,
		};
	},
	modules: {
		uiUtils,
		Formatters,
		keyParams,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		this.getGlobalEnrichment(this.searchingRegion);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		GLTissues() {
			console.log(this.trigger);
			if (Object.keys(this.GEData).length == 0) {
				return null;
			} else {
				let tempObject = {};
				for (const [pKey, tissues] of Object.entries(this.GEData)) {
					tissues.map((t) => {
						if (!tempObject[t.tissue]) {
							tempObject[t.tissue] = [];
							tempObject[t.tissue].push(pKey);
						} else {
							if (tempObject[t.tissue].indexOf(pKey) <= -1) {
								tempObject[t.tissue].push(pKey);
							}
						}
					});
				}

				let tempArray = [];

				for (const [key, arr] of Object.entries(tempObject)) {
					let tempObj = {};
					tempObj["tissue"] = key;
					tempObj["phenotypes"] = arr;
					tempArray.push(tempObj);
				}

				return tempArray;
			}
		},
		renderData() {
			console.log(this.trigger);
			let renderObj = {};
			for (const [tKey, tValue] of Object.entries(this.pkgData.GLData)) {
				if (!renderObj[tKey]) {
					renderObj[tKey] = {};
				}

				tValue.map((t) => {
					if (!renderObj[tKey][t.targetGene]) {
						renderObj[tKey][t.targetGene] = {};
					}
					if (!renderObj[tKey][t.targetGene][t.method]) {
						renderObj[tKey][t.targetGene][t.method] = [];
					}
					renderObj[tKey][t.targetGene][t.method].push({
						start: t.start,
						end: t.end,
					});
				});
			}

			return renderObj;
		},
		methodsArr() {
			let methodIndex = [];

			for (const [tKey, tValue] of Object.entries(this.renderData)) {
				for (const [gKey, gValue] of Object.entries(tValue)) {
					for (const [mKey, mValue] of Object.entries(gValue)) {
						methodIndex.push(mKey);
					}
				}
			}
			methodIndex = [...new Set(methodIndex)].sort();

			return methodIndex;
		},
		genesArr() {
			let genes = [];

			for (const [tKey, tValue] of Object.entries(this.renderData)) {
				for (const [gKey, gValue] of Object.entries(tValue)) {
					genes.push(gKey);
				}
			}
			genes = [...new Set(genes)].sort();

			return genes;
		},
		viewingRegion() {
			if (this.region == null) {
				return null;
			} else {
				let returnObj = {};

				returnObj["chr"] = parseInt(this.region.split(":")[0], 10);

				let regionArr = this.region.split(":")[1].split("-");
				let chr = this.region.split(":")[0];
				let start = parseInt(regionArr[0], 10);
				let end = parseInt(regionArr[1], 10);
				let distance = end - start;
				if (this.regionZoom > 0) {
					let zoomNum = Math.round(
						distance * (this.regionZoom / 200)
					);
					let viewPointShift = Math.round(
						zoomNum * (this.regionViewArea / 100)
					);
					returnObj["chr"] = chr;
					returnObj["start"] = start + zoomNum + viewPointShift;
					returnObj["end"] = end - zoomNum + viewPointShift;
				} else if (this.regionZoom == 0) {
					returnObj["chr"] = chr;
					returnObj["start"] = start;
					returnObj["end"] = end;
				}

				return returnObj;
			}
		},
		searchingParameters() {
			if (
				this.searchingRegion != null &&
				this.searchingPhenotype != null
			) {
				return this.searchingRegion + "," + this.searchingPhenotype;
			}
		},
		searchingRegion() {
			let returnObj = {};
			let regionArr = this.region.split(":");
			returnObj["chr"] = regionArr[0];
			returnObj["start"] = regionArr[1].split("-")[0];
			returnObj["end"] = regionArr[1].split("-")[1];

			return returnObj;
		},
		searchingPhenotype() {
			if (this.phenotype != null) {
				let returnPhenotype = !!this.renderConfig["phenotype match"]
					? this.renderConfig["phenotype match"][this.phenotype]
					: this.phenotype;

				return returnPhenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig["phenotype parameter"]]) {
					return keyParams[this.renderConfig["phenotype parameter"]];
				} else {
					return null;
				}
			}
		},
	},
	watch: {
		searchingParameters(PARAM) {
			console.log("searchingParameters called");
			this.getGlobalEnrichment(this.searchingRegion);
		},
		viewingRegion: {
			handler: function (n, o) {
				this.renderGLPlot();
			},
			deep: true,
			immediate: true,
		},
	},
	methods: {
		...uiUtils,
		onResize(e) {
			uiUtils.showElement("geneLinksPlotWrapper");
			this.renderGLPlot();
		},
		renderGLPlot() {
			if (
				!!this.pkgData.GLData &&
				Object.keys(this.pkgData.GLData).length > 0
			) {
				let staredPositions = [];

				if (!!this.renderConfig["star key"]) {
					let plotData = !!Array.isArray(this.plotData)
						? this.array2Object(
								this.renderConfig["star key"]["key"],
								this.plotData
						  )
						: this.plotData;

					let starKey = this.renderConfig["star key"]["key"];
					let starPosition =
						this.renderConfig["star key"]["position"];

					this.pkgDataSelected
						.filter((s) => s.type == starKey)
						.map((s) => s.id)
						.map((s) => {
							staredPositions.push(plotData[s][starPosition]);
						});
				}

				let tempHeight = 0;
				let tissueTitleH = this.spaceBy * 2;
				let btwnTissues = this.spaceBy * 5;
				let perMethod = this.spaceBy;
				let btwnGenes = this.spaceBy * 0;
				let topMargin = this.spaceBy * 2;
				let bottomMargin = this.spaceBy * 2;
				let regionStart = this.viewingRegion.start;
				let regionEnd = this.viewingRegion.end;

				for (const [tKey, tValue] of Object.entries(this.renderData)) {
					tempHeight += tissueTitleH;
					for (const [gKey, gValue] of Object.entries(tValue)) {
						tempHeight +=
							btwnGenes + Object.keys(gValue).length * perMethod;
					}
					tempHeight += btwnTissues;
				}
				tempHeight -= btwnTissues;

				let wrapper = document.querySelector("#geneLinksPlotWrapper");
				let canvas = document.querySelector("#geneLinksPlot");

				if (!!canvas && !!wrapper) {
					let canvasWidth = document.querySelector(
						"#geneLinksPlotWrapper"
					).clientWidth;

					let canvasHeight = tempHeight + topMargin + bottomMargin;

					let plotWidth =
						canvasWidth - this.plotMargin.leftMargin * 2;

					let plotHeight = tempHeight;
					let bump = 5.5;

					let xPerPixel = plotWidth / (regionEnd - regionStart);

					let c, ctx;
					c = document.querySelector("#geneLinksPlot");
					c.setAttribute("width", canvasWidth);
					c.setAttribute("height", canvasHeight);
					ctx = c.getContext("2d");

					ctx.clearRect(0, 0, canvasWidth, canvasHeight);

					let renderHeight = tissueTitleH;

					for (const [tKey, tValue] of Object.entries(
						this.renderData
					)) {
						ctx.font = "14px Arial";
						ctx.textAlign = "left";
						ctx.fillStyle = "#00000075";
						ctx.fillText(tKey, bump, renderHeight);

						let blockHeight = 0;
						let yAxisTop = renderHeight + perMethod;
						renderHeight = yAxisTop;
						let geneIndex = 0;

						for (const [gKey, gValue] of Object.entries(tValue)) {
							ctx.font = "12px Arial";
							ctx.textAlign = "left";
							ctx.fillStyle = "#000000";
							ctx.fillText(gKey, bump, renderHeight + perMethod);

							if (geneIndex % 2 == 0) {
								ctx.fillStyle = "#00000010";
								ctx.fillRect(
									this.plotMargin.leftMargin,
									renderHeight,
									plotWidth,
									perMethod * Object.keys(gValue).length
								);
							}

							for (const [mKey, mValue] of Object.entries(
								gValue
							)) {
								//renderHeight -= tissueTitleH;

								console.log("this.methodsArr", this.methodsArr);

								let colorIndex = this.methodsArr.indexOf(mKey);
								let methodColor =
									this.methodsColors[colorIndex];

								mValue.map((m) => {
									if (
										m.start <= regionEnd &&
										m.end >= regionStart
									) {
										let xPosStart =
											(m.start - regionStart) *
												xPerPixel +
											this.plotMargin.leftMargin;

										xPosStart =
											xPosStart <=
											this.plotMargin.leftMargin
												? this.plotMargin.leftMargin
												: xPosStart;
										let xPosEnd =
											(m.end - regionStart) * xPerPixel +
											this.plotMargin.leftMargin;

										xPosEnd =
											xPosEnd >
											this.plotMargin.leftMargin +
												plotWidth
												? this.plotMargin.leftMargin +
												  plotWidth
												: xPosEnd;

										let xPosWidth =
											xPosEnd - xPosStart < 1
												? 1
												: xPosEnd - xPosStart;

										ctx.fillStyle = methodColor;

										ctx.fillRect(
											xPosStart,
											renderHeight,
											xPosWidth,
											perMethod - 1
										);
										/*let xPosBtn =
											xPosStart +
											"_" +
											(xPosStart + xPosWidth);
										this.annoPosData[yPosBtn].regions[
											xPosBtn
										] = {
											start: p.start,
											end: p.end,
										};*/
									}
								});

								renderHeight += perMethod;
							}

							blockHeight +=
								btwnGenes +
								Object.keys(gValue).length * perMethod;
							renderHeight += btwnGenes;
							geneIndex++;
						}

						this.renderGLAxis(
							ctx,
							plotWidth,
							blockHeight,
							Number(regionEnd),
							Number(regionStart),
							yAxisTop,
							bump
						);

						renderHeight += btwnTissues;
					}
				}
			} else {
				if (!!document.querySelector("#geneLinksPlot")) {
					let c, ctx;
					c = document.querySelector("#geneLinksPlot");
					c.setAttribute("width", 1);
					c.setAttribute("height", 1);
					ctx = c.getContext("2d");

					ctx.clearRect(0, 0, 1, 1);
				}
			}
		},
		renderGLAxis(CTX, WIDTH, HEIGHT, xMax, xMin, yPos, bump) {
			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#999999";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			// render y axis
			CTX.moveTo(this.plotMargin.leftMargin - bump, yPos);
			CTX.lineTo(this.plotMargin.leftMargin - bump, yPos + HEIGHT + bump);
			CTX.stroke();

			// render recombination Rate y axis
			let recomXpos =
				Math.round(this.plotMargin.leftMargin + WIDTH + bump) + 0.5;

			CTX.moveTo(recomXpos, yPos);
			CTX.lineTo(recomXpos, yPos + HEIGHT + bump);
			CTX.stroke();

			//render x axis
			CTX.moveTo(this.plotMargin.leftMargin - bump, yPos + HEIGHT + bump);
			CTX.lineTo(recomXpos, yPos + HEIGHT + bump);
			CTX.stroke();

			// X ticks

			let xStep = Math.ceil((xMax - xMin) / 5);
			let xTickDistance = WIDTH / 5;

			for (let i = 0; i < 6; i++) {
				let tickXPos = this.plotMargin.leftMargin + i * xTickDistance;
				let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
				CTX.moveTo(adjTickXPos, yPos + HEIGHT + bump);
				CTX.lineTo(adjTickXPos, yPos + HEIGHT + bump * 2);
				CTX.stroke();

				CTX.textAlign = "center";
				let positionLabel = i < 5 ? xMin + i * xStep : xMax;
				CTX.font = "12px Arial";
				CTX.fillStyle = "#999999";
				CTX.fillText(
					positionLabel,
					adjTickXPos,
					yPos + HEIGHT + bump * 4
				);
			}
		},
		removeGLTissue(TISSUE) {
			//delete this.GLData[TISSUE];
			delete this.pkgData["GLData"][TISSUE];
			//this.pkgData["GLData"] = this.GLData;
			if (Object.keys(this.pkgData["GLData"]).length == 0) {
				delete this.pkgData["GLData"];
			}
			this.$store.dispatch("pkgDataSelected", {
				type: "GLTissue",
				id: TISSUE,
				action: "remove",
			});

			this.trigger--;
			this.renderGLPlot();
		},
		getTissueLabel(TISSUE) {
			return TISSUE.tissue + " (" + TISSUE.phenotypes.join() + ")";
		},

		async getGeneLinks(event) {
			if (event.target.value != "") {
				let geneLinksServer =
					this.renderConfig["gene links server"] == "KP BioIndex"
						? "https://bioindex.hugeamp.org/api/bio"
						: this.renderConfig["gene links server"];

				let tissue = event.target.value;
				let region = this.searchingRegion;

				let GLURL =
					geneLinksServer +
					"/query/gene-links?q=" +
					tissue +
					"," +
					region.chr +
					":" +
					region.start +
					"-" +
					region.end;

				let GLJson = await fetch(GLURL).then((resp) => resp.json());

				if (GLJson.error == null) {
					if (GLJson.data.length == 0) {
						alertUtils.popAlert(tissue + " has no linked genes.");
					} else {
						//this.GLData[tissue] = GLJson.data;
						this.$store.dispatch("pkgDataSelected", {
							type: "GLTissue",
							id: tissue,
							action: "add",
						});
						if (!this.pkgData["GLData"]) {
							this.pkgData["GLData"] = {};
						}
						this.pkgData["GLData"][tissue] = GLJson.data;
					}

					this.trigger++;
					this.renderGLPlot();
				}
			}
		},
		async getGlobalEnrichment(REGION_OBJ) {
			if (
				!!REGION_OBJ &&
				!!REGION_OBJ.chr &&
				!!REGION_OBJ.start &&
				REGION_OBJ.end
			) {
				let geneLinksServer =
					this.renderConfig["gene links server"] == "KP BioIndex"
						? "https://bioindex.hugeamp.org/api/bio"
						: this.renderConfig["gene links server"];

				let phenotype = this.searchingPhenotype;

				let GEURL =
					geneLinksServer + "/query/global-enrichment?q=" + phenotype;

				let GEJson = await fetch(GEURL).then((resp) => resp.json());

				if (GEJson.error == null) {
					if (this.dataComparison == "newSearch") {
						this.GEData = {};
					}
					this.GEData[this.searchingPhenotype] = GEJson.data;

					this.trigger++;
				}
			}
		},
	},
});

$(function () {});
</script>

<style>
.GL-search-bubble {
	background-color: #999999;
	font-size: 12px;
	margin-right: 5px;
	border-radius: 5px;
	margin-bottom: 3px;
	color: #fff;
	float: left;
	font-weight: 400;
	line-height: 1;
	text-align: center;
	white-space: nowrap;
	vertical-align: baseline;
	user-select: none;
	border: 1px solid transparent;
	padding: 0.25em 0.4em;
	padding-right: 0.6em;
	padding-left: 0.6em;
	border-radius: 10rem;
}

.GL-search-bubble.hidden {
	display: none !important;
}
.phenotype-tissue-td {
	vertical-align: top !important;
}

.annotations-table-wrapper {
	max-height: 300px;
	overflow: auto;
	padding: 15px;
	background-color: #eee;
	border: solid 1px #ddd;
	border-radius: 5px;
	margin-bottom: 15px;
}
.annotations-plots-wrapper {
	padding: 0 !important;
}

.gene-links-plot-wrapper {
	padding: 0 !important;
}
.gene-link-plot-wrapper,
.anno-plot-ui-wrapper {
	display: inline-block;
	vertical-align: top;
}
.anno-bubble-wrapper {
	width: auto;
	display: inline-block;
	margin-left: 3px;
	margin-right: 3px;
	margin-bottom: 3px;
}
.anno-bubble-wrapper span {
	font-size: 12px;
	display: inline-block;
}
.anno-bubble {
	border-radius: 12px;
	margin-right: 3px;
	width: 12px;
	height: 12px;
	vertical-align: -3px;
}

#GEPlotWrapper,
#tissuesPlotWrapper,
#annotationsPlotWrapper {
	position: relative;
}

#tissueInfoBox,
#selectedTissueInfoBox,
#GEInfoBox {
	position: absolute;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 5px 15px;
	z-index: 11;
	font-size: 14px;
}
#annoInitialMessage,
#tissueInitialMessage {
	width: 300px;
	border: solid 1px #ddd;
	color: #666;
	margin: 0 auto;
	border-radius: 25px;
	text-align: center;
	font-size: 13px;
}

table.ge-data-table {
	border-top: solid 1px #ddd;
	border-right: solid 1px #ddd;
	border-collapse: inherit;
	text-align: center;
	background-color: #fff;
}

.ge-data-table table {
	border: none;
}

.ge-data-table th {
	background-color: #cccccc;
	color: #333333;
	border: none !important;
	border-left: solid 1px #ddd !important;
	border-bottom: solid 1px #ddd !important;
	font-size: 13px;
}

.ge-data-table td {
	border: none !important;
	border-left: solid 1px #eee !important;
	border-bottom: solid 1px #ddd !important;
	vertical-align: middle;
	font-size: 14px;
}
</style>



