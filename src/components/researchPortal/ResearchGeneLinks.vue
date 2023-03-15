<template>
	<div class="mbm-plot-content row">
		<div
			class="col-md-12 gene-links-plot-wrapper"
			v-if="searchingRegion != null"
		>
			<div class="col-md-12">
				<div id="geneLinksUIWrapper">
					<strong
						>Filter associated variants by links to genes.
					</strong>
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
							<!-- this part is for SNP to Gene options -->
							<!--<div class="col divider" style="background: none">
								<span class="or-text">or</span>
							</div>-->
							<div
								class="col"
								style="padding: 2px; margin-left: 15px"
							>
								<div
									class="label"
									style="
										display: inline-block;
										margin-right: 10px;
									"
								>
									Select SNP 2 Gene
								</div>

								<select
									class="custom-select"
									@change="getS2GeneLinks($event)"
								>
									<option value="">
										{{ "Select one" }}
									</option>
									<option
										value="s2g"
										v-html="'SNP to Gene'"
									></option>
								</select>
							</div>
							<!-- -->
						</div>
						<div
							class=""
							v-if="
								GLData != null &&
								!renderConfig['no search key bubbles']
							"
							style="position: absolute; right: 10px; top: 7px"
						>
							<template v-for="tissue in Object.keys(GLData)">
								<span
									:key="tissue"
									:class="'btn GL-search-bubble '"
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
			</div>
			<div class="col-md-9 gene-link-plot-wrapper">
				<div
					id="geneLinksPlotWrapper"
					:class="
						pkgDataSelected.filter((s) => s.type == 'GLTissue')
							.length == 0
							? 'height-1px'
							: 'height-auto'
					"
				>
					<div id="GLInfoBox" class="hidden">
						<div
							id="info_box_close"
							class="fixed-info-box-close"
							@click="removeOnMouseOut('GLInfoBox', 100)"
						>
							<b-icon icon="x-circle-fill"></b-icon>
						</div>
						<span id="GLInfoBoxContent"></span>
					</div>

					<canvas
						id="geneLinksPlot"
						@resize="onResize"
						@mousemove="checkPosition($event, 'hover')"
						@click="checkPosition($event, 'click')"
						@mouseout="
							!isIdFixed('#GLInfoBox')
								? removeOnMouseOut('GLInfoBox', 1000)
								: ''
						"
						width=""
						height=""
					></canvas>
				</div>
			</div>
			<div
				class="col-md-3 GL-plot-ui-wrapper reference-area"
				v-if="GLData != null"
			>
				<div>
					<button
						class="btn btn-sm btn-outline-secondary"
						style="margin-right: 5px; margin-bottom: 10px"
						@click="checkUncheckAll('check')"
					>
						Select all
					</button>
					<button
						class="btn btn-sm btn-outline-secondary"
						style="margin-bottom: 10px"
						@click="checkUncheckAll('uncheck')"
					>
						Unselect all
					</button>
					<h6><strong>Methods</strong></h6>

					<div
						v-for="(m, mIndex) in getMethodsArr(GLData)"
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
								@click="addRemoveParameter(m, 'GL-Method')"
								:checked="
									!pkgDataSelected
										.filter((s) => s.type == 'GL-Method')
										.map((s) => s.id)
										.includes(m)
								"
							/>{{ " " + m + " " }}
						</label>
					</div>

					<h6><strong>Genes</strong></h6>
					<div
						v-for="g in getGenesArr(GLData)"
						:key="g"
						style="display: inline-block"
					>
						<label style="padding-right: 10px"
							><input
								type="checkbox"
								:class="g.replace(/ /g, '_')"
								:value="g"
								@click="addRemoveParameter(g, 'GL-Gene')"
								:checked="
									!pkgDataSelected
										.filter((s) => s.type == 'GL-Gene')
										.map((s) => s.id)
										.includes(g)
								"
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
			spaceBy: 20,
			GEData: {},
			trigger: 0,
			GLPosData: {},
			GLData: null,
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
			this.trigger--;
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

				tempArray.sort((a, b) => (a.tissue > b.tissue ? 1 : -1));

				return tempArray;
			}
		},
		renderData() {
			this.trigger--;

			let renderObj = {};

			for (const [tKey, tValue] of Object.entries(this.pkgData.GLData)) {
				if (!renderObj[tKey]) {
					renderObj[tKey] = {};
				}

				tValue.map((t) => {
					let removedGenes = this.$store.state.pkgDataSelected
						.filter((s) => s.type == "GL-Gene")
						.map((s) => s.id);

					let removedMethods = this.$store.state.pkgDataSelected
						.filter((s) => s.type == "GL-Method")
						.map((s) => s.id);

					if (
						removedGenes.indexOf(t.targetGene) == -1 &&
						removedMethods.indexOf(t.method) == -1
					) {
						if (!renderObj[tKey][t.targetGene]) {
							renderObj[tKey][t.targetGene] = {};
						}

						if (!renderObj[tKey][t.targetGene][t.method]) {
							renderObj[tKey][t.targetGene][t.method] = [];
						}
						renderObj[tKey][t.targetGene][t.method].push({
							start: t.start,
							end: t.end,
							method: t.method,
							biosample: t.biosample,
							targetGene: t.targetGene,
							targetGeneStart: t.targetGeneStart,
							targetGeneEnd: t.targetGeneEnd,
						});
					}
				});
			}

			return renderObj;
		},
		methodsArr() {
			this.trigger--;

			if (!!this.pkgData.GLData) {
				let methodIndex = [];
				for (const [tKey, tValue] of Object.entries(
					this.pkgData.GLData
				)) {
					tValue.map((t) => {
						methodIndex.push(t.method);
					});
				}
				methodIndex = [...new Set(methodIndex)].sort();
				return methodIndex;
			} else {
				return null;
			}
		},
		genesArr() {
			this.trigger--;

			if (!!this.pkgData.GLData) {
				let genes = [];
				for (const [tKey, tValue] of Object.entries(
					this.pkgData.GLData
				)) {
					tValue.map((t) => {
						genes.push(t.targetGene);
					});
				}
				genes = [...new Set(genes)].sort();
				return genes;
			} else {
				return null;
			}
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
			this.getGlobalEnrichment(this.searchingRegion);
		},
		pkgDataSelected: {
			handler: function (DATA) {
				if (DATA.length == 0) {
					this.resetAll();
				} else {
					this.renderGLPlot();
				}
			},
			deep: true,
			immediate: true,
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
		isIdFixed: uiUtils.isIdFixed,
		removeOnMouseOut: uiUtils.removeOnMouseOut,
		resetAll() {
			//this.GEData = {};
			this.trigger = 0;
			this.GLPosData = {};
			this.GLData = null;

			this.renderGLPlot();
		},
		checkUncheckAll(CHECK) {
			switch (CHECK) {
				case "check":
					[
						{
							type: "GL-Method",
							items: this.getMethodsArr(this.GLData),
						},
						{
							type: "GL-Gene",
							items: this.getGenesArr(this.GLData),
						},
					].map((o) => {
						o.items.map((g) => {
							this.removeParameter(g, o.type);
						});
					});

					break;
				case "uncheck":
					[
						{
							type: "GL-Method",
							items: this.getMethodsArr(this.GLData),
						},
						{
							type: "GL-Gene",
							items: this.getGenesArr(this.GLData),
						},
					].map((o) => {
						o.items.map((g) => {
							this.addParameter(g, o.type);
						});
					});
					break;
			}

			this.trigger++;
		},
		getMethodsArr(DATA) {
			let methodIndex = [];

			for (const [tKey, tValue] of Object.entries(DATA)) {
				tValue.map((t) => {
					methodIndex.push(t.method);
				});
			}
			methodIndex = [...new Set(methodIndex)].sort();

			return methodIndex;
		},
		getGenesArr(DATA) {
			let genes = [];

			for (const [tKey, tValue] of Object.entries(DATA)) {
				tValue.map((t) => {
					genes.push(t.targetGene);
				});
			}
			genes = [...new Set(genes)].sort();

			return genes;
		},
		checkPosition(event, TYPE) {
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.ceil(e.clientX - rect.left);
			let rawX = e.clientX - rect.left;
			let rawY = e.clientY - rect.top;

			let y = Math.ceil(e.clientY - rect.top);

			const infoBox = document.querySelector("#GLInfoBox");
			const infoBoxContent = document.querySelector("#GLInfoBoxContent");
			const infoBoxClose = document.querySelector("#info_box_close");
			let infoContent = "";

			if (
				x >= this.plotMargin.leftMargin / 2 &&
				x <= rect.width - this.plotMargin.leftMargin / 2
			) {
				for (const [vKey, vValue] of Object.entries(this.GLPosData)) {
					let vLoc = vKey.split("-");

					if (y >= vLoc[0] && y <= vLoc[1]) {
						infoContent +=
							"<strong>" +
							vValue.targetGene +
							" / " +
							vValue.method +
							"</strong>";

						for (const [rKey, rValue] of Object.entries(
							this.GLPosData[vKey].region
						)) {
							let hLoc = rKey.split("-");

							if (x >= hLoc[0] && x <= hLoc[1]) {
								rValue.map((r) => {
									infoContent +=
										"<br /><strong>Biosample</strong> <br />" +
										r.biosample;
									infoContent +=
										"<br /><strong>Regulatory element</strong> <br />" +
										r.start +
										"-" +
										r.end;
									infoContent +=
										"<br /><strong>Promoter</strong><br /> " +
										r.targetGeneStart +
										"-" +
										r.targetGeneEnd +
										"<br />";
								});
							}
						}
					}
				}
			}

			if (TYPE == "hover") {
				if (infoContent == "") {
					if (infoBox.getAttribute("class") != "fixed") {
						infoBoxContent.innerHTML = "";
						infoBox.setAttribute("class", "hidden");
						infoBoxClose.setAttribute("class", "hidden");
					}
				} else {
					if (infoBox.getAttribute("class") != "fixed") {
						infoBoxContent.innerHTML = infoContent;
						infoBox.setAttribute("class", "");
						infoBox.style.left = rawX + 25 + "px";
						infoBox.style.top = rawY + this.spaceBy / 2 + "px";
						infoBoxClose.setAttribute("class", "hidden");
					}
				}
			}

			if (TYPE == "click") {
				infoBoxClose.setAttribute("class", "fixed-info-box-close");
				if (infoContent == "") {
					infoBoxContent.innerHTML = "";
					infoBox.setAttribute("class", "hidden");
				} else {
					infoBoxContent.innerHTML = infoContent;
					infoBox.setAttribute("class", "fixed");
					infoBox.style.left = rawX + 25 + "px";
					infoBox.style.top = rawY + this.spaceBy / 2 + "px";
				}
			}
		},
		addParameter(ID, TYPE) {
			if (
				this.pkgDataSelected.filter((p) => p.id == ID && p.type == TYPE)
					.length == 0
			) {
				this.$store.dispatch("pkgDataSelected", {
					type: TYPE,
					id: ID,
					action: "add",
				});
			}

			this.trigger++;

			this.renderGLPlot();
		},
		removeParameter(ID, TYPE) {
			if (
				this.pkgDataSelected.filter((p) => p.id == ID && p.type == TYPE)
					.length > 0
			) {
				this.$store.dispatch("pkgDataSelected", {
					type: TYPE,
					id: ID,
					action: "remove",
				});
			}

			this.trigger++;

			this.renderGLPlot();
		},
		addRemoveParameter(ID, TYPE) {
			if (
				this.pkgDataSelected.filter((p) => p.id == ID && p.type == TYPE)
					.length > 0
			) {
				this.$store.dispatch("pkgDataSelected", {
					type: TYPE,
					id: ID,
					action: "remove",
				});
			} else {
				this.$store.dispatch("pkgDataSelected", {
					type: TYPE,
					id: ID,
					action: "add",
				});
			}

			this.trigger++;

			this.renderGLPlot();
		},
		onResize(e) {
			uiUtils.showElement("geneLinksPlotWrapper");
			this.renderGLPlot();
		},
		renderStaredPositions(
			CTX,
			WIDTH,
			HEIGHT,
			STARED,
			XPERPIXEL,
			xMax,
			xMin,
			yPos,
			bump
		) {
			CTX.beginPath();
			CTX.lineWidth = 2;
			CTX.strokeStyle = "#FFAA00";
			CTX.setLineDash([6, 6]); // cancel dashed line incase dashed lines rendered some where

			// render dased lines
			STARED.map((s) => {
				let xPos = (s - xMin) * XPERPIXEL + this.plotMargin.leftMargin;
				CTX.moveTo(xPos, yPos - bump);
				CTX.lineTo(xPos, yPos + HEIGHT + bump);
				CTX.stroke();
			});
		},
		array2Object(KEY, ARRAY) {
			var convertedObj = {};
			ARRAY.map((a) => {
				let key = a[KEY];
				convertedObj[key] = a;
			});
			return convertedObj;
		},
		renderGLPlot() {
			if (
				!!this.pkgData.GLData &&
				Object.keys(this.pkgData.GLData).length > 0
			) {
				let staredPositions = [];
				this.GLPosData = {};

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
					let canvasWidth =
						document.querySelector("#geneLinksPlotWrapper")
							.clientWidth * 2;

					let canvasHeight = tempHeight + topMargin + bottomMargin;

					let plotWidth =
						canvasWidth - this.plotMargin.leftMargin * 2;

					//let plotHeight = tempHeight;
					let bump = 11;

					let xPerPixel = plotWidth / (regionEnd - regionStart);

					let c, ctx;
					c = document.querySelector("#geneLinksPlot");
					c.setAttribute("width", canvasWidth);
					c.setAttribute("height", canvasHeight);
					c.setAttribute(
						"style",
						"width:" +
							canvasWidth / 2 +
							"px;height:" +
							canvasHeight / 2 +
							"px;"
					);
					ctx = c.getContext("2d");

					ctx.clearRect(0, 0, canvasWidth, canvasHeight);

					let renderHeight = tissueTitleH;

					let tissues = Object.keys(this.renderData).sort();

					/*for (const [tKey, tValue] of Object.entries(
						this.renderData
					)) {*/
					tissues.map((tKey) => {
						let tValue = this.renderData[tKey];

						ctx.font = "28px Arial";
						ctx.textAlign = "left";
						ctx.fillStyle = "#00000075";
						ctx.fillText(tKey, bump, renderHeight);

						let blockHeight = 0;
						let yAxisTop = renderHeight + perMethod;
						renderHeight = yAxisTop;
						let geneIndex = 0;

						//for (const [gKey, gValue] of Object.entries(tValue)) {
						this.genesArr.map((gKey) => {
							if (!!tValue[gKey]) {
								let gValue = tValue[gKey];
								ctx.font = "24px Arial";
								ctx.textAlign = "left";
								ctx.fillStyle = "#000000";
								ctx.fillText(
									gKey,
									bump,
									renderHeight + perMethod
								);

								if (geneIndex % 2 == 0) {
									ctx.fillStyle = "#00000010";
									ctx.fillRect(
										this.plotMargin.leftMargin,
										renderHeight,
										plotWidth,
										perMethod * Object.keys(gValue).length
									);
								}

								this.methodsArr.map((mKey) => {
									if (!!gValue[mKey]) {
										let mValue = gValue[mKey];
										let colorIndex =
											this.methodsArr.indexOf(mKey);
										let methodColor =
											this.methodsColors[colorIndex];

										mValue.map((m) => {
											/// add vertical locations of each method tracks to GLPosdata to check back on hover
											let yPosBtn =
												Math.ceil(renderHeight / 2) +
												"-" +
												Math.ceil(
													(renderHeight + perMethod) /
														2
												);

											if (!this.GLPosData[yPosBtn]) {
												this.GLPosData[yPosBtn] = {
													region: {},
												};
											}

											this.GLPosData[yPosBtn][
												"targetGene"
											] = m.targetGene;
											this.GLPosData[yPosBtn]["method"] =
												m.method;

											///

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
														? this.plotMargin
																.leftMargin
														: xPosStart;
												let xPosEnd =
													(m.end - regionStart) *
														xPerPixel +
													this.plotMargin.leftMargin;

												xPosEnd =
													xPosEnd >
													this.plotMargin.leftMargin +
														plotWidth
														? this.plotMargin
																.leftMargin +
														  plotWidth
														: xPosEnd;

												let xPosWidth =
													xPosEnd - xPosStart < 1
														? 2
														: xPosEnd - xPosStart;

												ctx.fillStyle = methodColor;

												ctx.fillRect(
													xPosStart,
													renderHeight,
													xPosWidth,
													perMethod - 2
												);

												/// add vertical locations of each method tracks to GLPosdata to check back on hover

												let xPosBtn =
													Math.ceil(xPosStart / 2) +
													"-" +
													Math.ceil(
														(xPosStart +
															xPosWidth) /
															2
													);

												if (
													!this.GLPosData[yPosBtn]
														.region[xPosBtn]
												) {
													this.GLPosData[
														yPosBtn
													].region[xPosBtn] = [];
												}

												this.GLPosData[yPosBtn].region[
													xPosBtn
												].push({
													start: m.start,
													end: m.end,
													biosample: m.biosample,
													targetGene: m.targetGene,
													targetGeneStart:
														m.targetGeneStart,
													targetGeneEnd:
														m.targetGeneEnd,
												});
											}
										});

										renderHeight += perMethod;

										blockHeight += perMethod;
									}
								});
								blockHeight += btwnGenes;
								renderHeight += btwnGenes;
								geneIndex++;
							}
						});
						if (
							!!this.renderConfig["star key"] &&
							staredPositions.length > 0
						) {
							this.renderStaredPositions(
								ctx,
								plotWidth,
								blockHeight,
								staredPositions,
								xPerPixel,
								Number(regionEnd),
								Number(regionStart),
								yAxisTop,
								bump
							);
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
					});
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
			CTX.strokeStyle = "#000000";
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
				//let positionLabel = i < 5 ? xMin + i * xStep : xMax;
				CTX.font = "24px Arial";
				CTX.fillStyle = "#000000";

				let xMaxMinGap = xMax - xMin;
				let xDecimal = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;

				let positionLabel = Formatters.decimalFormatter(
					xMin + i * xStep,
					xDecimal
				);

				positionLabel =
					positionLabel >= 100000
						? Math.round(positionLabel * 0.001) + "k"
						: positionLabel;

				CTX.fillText(
					positionLabel,
					adjTickXPos,
					yPos + HEIGHT + bump * 4
				);
			}
		},
		removeGLTissue(TISSUE) {
			delete this.pkgData["GLData"][TISSUE];
			delete this.GLData[TISSUE];

			if (Object.keys(this.pkgData["GLData"]).length == 0) {
				delete this.pkgData["GLData"];
				this.GLData = null;
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
			let label =
				TISSUE.phenotypes.length > 0
					? TISSUE.tissue + " (" + TISSUE.phenotypes.join() + ")"
					: TISSUE.tissue;
			return label;
		},

		async getGeneLinks(event) {
			if (event.target.value != "") {
				let geneLinksServer =
					this.renderConfig["gene links server"] == "KP BioIndex"
						? uiUtils.biDomain() + "/api/bio"
						: this.renderConfig["gene links server"];

				let tissue = event.target.value.replaceAll(" ", "_");
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
						if (GLJson.continuation == null) {
							this.runAfterGLDataLoad(GLJson.data, tissue);
						} else {
							this.loadContinue(GLJson, tissue);
						}
					}
				}
			}
		},

		async loadContinue(CONTENT, TISSUE) {
			let biosamplesServer =
				this.renderConfig["gene links server"] == "KP BioIndex"
					? uiUtils.biDomain() + "/api/bio"
					: this.renderConfig["gene links server"];

			let contURL =
				biosamplesServer + "/cont?token=" + CONTENT.continuation;

			let contJson = await fetch(contURL).then((resp) => resp.json());

			if (contJson.error == null) {
				let prevData = CONTENT.data;
				let newData = prevData.concat(contJson.data);

				contJson.data = newData;

				if (contJson.continuation == null) {
					this.runAfterGLDataLoad(contJson.data, TISSUE);
				} else {
					this.loadContinue(contJson, TISSUE);
				}
			}
		},

		runAfterGLDataLoad(GLJson, tissue) {
			this.$store.dispatch("pkgDataSelected", {
				type: "GLTissue",
				id: tissue,
				action: "add",
			});
			if (!this.pkgData["GLData"]) {
				this.pkgData["GLData"] = {};
				this.GLData = {};
			}
			this.pkgData["GLData"][tissue] = GLJson;
			this.GLData[tissue] = GLJson;

			this.trigger++;
			this.renderGLPlot();
		},

		async getS2GeneLinks(event) {
			if (!!event.target.value && event.target.value != "") {
				let geneLinksServer =
					this.renderConfig["gene links server"] == "KP BioIndex"
						? uiUtils.biDomain() + "/api/bio"
						: this.renderConfig["gene links server"];

				let region = this.searchingRegion;

				let GLURL =
					geneLinksServer +
					"/query/variant-links?q=" +
					region.chr +
					":" +
					region.start +
					"-" +
					region.end;

				let S2GLJson = await fetch(GLURL).then((resp) => resp.json());

				let S2GTissue = "SNP to gene";

				if (S2GLJson.error == null) {
					if (S2GLJson.data.length == 0) {
						alertUtils.popAlert(
							"No SNP to gene data found in the region."
						);
					} else {
						///adding this part since data model for variant-links is different from gene-links
						S2GLJson.data.map((g) => {
							g["targetGene"] = g.gene;
						});

						this.$store.dispatch("pkgDataSelected", {
							type: "GLTissue",
							id: S2GTissue,
							action: "add",
						});
						if (!this.pkgData["GLData"]) {
							this.pkgData["GLData"] = {};
							this.GLData = {};
						}
						this.pkgData["GLData"][S2GTissue] = S2GLJson.data;
						this.GLData[S2GTissue] = S2GLJson.data;
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
						? uiUtils.biDomain() + "/api/bio"
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
.height-1px {
	height: 1px !important;
}
.height-auto {
	height: auto;
}
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

.gene-links-plot-wrapper {
	padding: 0 !important;
}
.gene-link-plot-wrapper,
.GL-plot-ui-wrapper {
	display: inline-block;
	vertical-align: top;
	height: auto;
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
#GLPlotWrapper {
	position: relative;
}

#GLInfoBox {
	position: absolute;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 5px 15px;
	z-index: 11;
	font-size: 13px;
	min-width: 200px !important;
}
</style>



