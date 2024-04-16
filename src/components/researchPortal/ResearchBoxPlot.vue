<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12 box-plot-wrapper">
			<div
				class="col-md-12"
				:id="canvasId + 'boxPlotWrapper'"
				style="display: inline-block"
			>
				<div
					:id="canvasId + 'boxInfoBox'"
					class="boxplot-info-box hidden"
				>
					<div
						:id="canvasId + 'info_box_close'"
						class="fixed-info-box-close"
						@click="
							utils.uiUtils.removeOnMouseOut(canvasId + 'boxInfoBox', 100)
						"
					>
						<b-icon icon="x-circle-fill"></b-icon>
					</div>
					<span :id="canvasId + 'boxInfoBoxContent'"></span>

					<span v-for="(ptValue, ptKey) in hoverItems" :key="ptKey">
						<strong>{{ ptKey }}</strong
						><br />
						<span v-for="(dValue, dKey) in ptValue.data">
							<span>{{ dKey + ": " }}</span
							><span>{{ dValue }}</span> <br
						/></span>
						<template
							v-if="
								options != null &&
								utils.uiUtils.isIdFixed('#' + canvasId + 'boxInfoBox') ==
									true
							"
						>
							<button
								class="option-button"
								v-if="!!options.includes('add phenotype')"
								@click="addPhenotype(ptValue.id)"
							>
								Add this phenotype below
							</button>

							<button
								class="option-button"
								v-if="!!options.includes('open phenotype page')"
								v-on:click="
									openPage('phenotype.html', {
										phenotype: ptValue.id,
									})
								"
							>
								Go to phenotype page
							</button>
						</template>
						<span
							v-if="
								options != null &&
								utils.uiUtils.isIdFixed('#' + canvasId + 'boxInfoBox') ==
									false
							"
							>Click for options</span
						>
					</span>
				</div>

				<div>
					
				
				</div>

				<canvas :hidden="!showCanvas"
					:id="canvasId + 'boxPlot'"
					width=""
					height=""
					@mousemove="checkPosition($event, 'hover')"
					@click="checkPosition($event, 'click')"
					@mouseout="
						!utils.uiUtils.isIdFixed('#' + canvasId + 'boxInfoBox')
							? utils.uiUtils.removeOnMouseOut(canvasId + 'boxInfoBox', 1000)
							: ''
					"
				></canvas>
				<div class="download-images-setting">
					<span class="btn btn-default options-gear" >Download <b-icon icon="download"></b-icon></span>
					<ul class="options" >
						<li>
							<a href="javascript:;"
							@click="downloadImage('vector_wrapper_' + canvasId, canvasId + '_boxPlot', 'svg')">Download SVG</a>
						</li>
						<li>
							<a href="javascript:;"
							@click="downloadImage(canvasId + 'boxPlot', canvasId + '_boxPlot', 'png')">Download PNG</a>
						</li>
					</ul>
				</div>
				<research-box-plot-vector
				v-if="!!renderData"
					:renderData="groupData(renderData)"
					:renderConfig="renderConfig"
					:colors="colors"
					:margin="adjPlotMargin"
					:sectionId="canvasId"
					:utils="utils"
					:ref="canvasId + '_boxPlot'"
				>
				</research-box-plot-vector>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { cloneDeep } from "lodash";
import { BootstrapVueIcons } from "bootstrap-vue";
import boxPlotVector from "@/components/researchPortal/vectorPlots/ResearchBoxPlotVector.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-box-plot", {
	props: [
		"phenotypeMap",
		"phenotypesData",
		"renderConfig",
		"pkgData",
		"pkgDataSelected",
		"colors",
		"plotMargin",
		"filter",
		"options",
		"canvasId",
		"utils"
	],
	data() {
		return {
			boxData: null,
			boxPosData: {},
			spaceBy: 7,
			trigger: 0,
			hoverItems: {},
			showCanvas: true,
		};
	},
	modules: {
	},
	components: {
		boxPlotVector,
	},
	created: function () {
		this.renderBoxPlot();
	},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		this.renderBoxPlot();
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		phenotypeMapConfig() {
			if (this.renderConfig["phenotype map"] == "null") {
				return null;
			} else if (
				this.renderConfig["phenotype map"] == "kp phenotype map"
			) {
				return "kpPhenotypeMap";
			}
		},
		renderData() {
			this.showCanvas = true;
			let content = {};
			content["data"] = [];

			if (!!this.phenotypesData) {
				let phenotypesData = cloneDeep(this.phenotypesData);

				phenotypesData.map((d) => {
					let pValue =
						typeof d[this.renderConfig["y axis field"]] == "string"
							? Number(d[this.renderConfig["y axis field"]])
							: d[this.renderConfig["y axis field"]];
					d["rawPValue"] = pValue;

					if (this.renderConfig["convert y -log10"] == "true") {
						d[this.renderConfig["y axis field"] + "-log10"] =
							-Math.log10(pValue);
					}

					if (
						this.phenotypeMapConfig == "kpPhenotypeMap" &&
						!!this.phenotypeMap[d[this.renderConfig["render by"]]]
					) {
						content["data"].push(d);
					} else if (this.phenotypeMapConfig == null) {
						content["data"].push(d);
					}
				});
			}
			if (!!this.filter) {
				content.data = content.data.filter(this.filter);
			}

			if (!!content.data && content.data.length > 0) {
				return content;
			} else {
				this.showCanvas = false;
				return null;
			}
		},
		adjPlotMargin() {

			let customPlotMargin = !!this.renderConfig["plot margin"] ? this.renderConfig["plot margin"] : null;



			let plotMargin = !!customPlotMargin ? {
				left: customPlotMargin.left,
				right: customPlotMargin.right,
				top: customPlotMargin.top,
				bottom: customPlotMargin.bottom,
				bump: !!customPlotMargin.bump ? customPlotMargin.bump : 10,
			} :
				{
					left: this.plotMargin.leftMargin,
					right: this.plotMargin.rightMargin,
					top: this.plotMargin.topMargin,
					bottom: this.plotMargin.bottomMargin,
					bump: this.plotMargin.bump,
				};

			return plotMargin;
		},
	},
	watch: {
		renderData(content) {
			this.renderBoxPlot();
		},
	},
	methods: {
		downloadImage( ID,NAME,TYPE) {
			if(TYPE == 'svg') {
				this.$refs[this.canvasId + '_boxPlot'].renderBoxPlot();
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE, "vector_box_plot_" + this.canvasId);
			} else if(TYPE == 'png') {
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE)
			}
			
		},
		openPage(PAGE, PARAMETER) {
			this.utils.uiUtils.openPage(PAGE, PARAMETER);
		},
		addPhenotype(PHENOTYPE) {
			this.$parent.$parent.pushCriterionPhenotype(PHENOTYPE);
			window.location.href = "#associations-table";
		},
		groupData(DATA) {
			
			let phenotypeGroups = [];
			let phenotypeGroupsObj = {};

			if (this.phenotypeMapConfig == null) {
				phenotypeGroups = [
					...new Set(
						DATA.data.map((p) => p[this.renderConfig["group by"]])
					),
				].sort();
			} else {
				for (const [key, value] of Object.entries(this.phenotypeMap)) {
					phenotypeGroups.push(value);
				}

				phenotypeGroups = [
					...new Set(phenotypeGroups.map((p) => p.group)),
				].sort();
			}

			phenotypeGroups.map((p) => {
				phenotypeGroupsObj[p] = [];
			});

			DATA.data.map((p) => {
				let group =
					this.phenotypeMapConfig == "kpPhenotypeMap" &&
					!!this.phenotypeMap[p[this.renderConfig["render by"]]]
						? this.phenotypeMap[p[this.renderConfig["render by"]]]
								.group
						: p[this.renderConfig["group by"]];

				phenotypeGroupsObj[group].push(p);
			});

			return phenotypeGroupsObj;
		},
		onResize() {
			this.renderBoxPlot();
		},
		checkPosition(event, TYPE) {
			let e = event;
			let rect = e.target.getBoundingClientRect();

			let rawX = e.clientX - rect.left;
			let rawY = e.clientY - rect.top;

			let customPlotMargin = !!this.renderConfig["plot margin"]? this.renderConfig["plot margin"]:null;

			let plotMargin = this.adjPlotMargin;

			let y = Math.ceil(e.clientY - rect.top);
			let x = Math.ceil(e.clientX - rect.left);

			const infoBox = document.querySelector(
				"#" + this.canvasId + "boxInfoBox"
			);
			const infoBoxContent = document.querySelector(
				"#" + this.canvasId + "boxInfoBoxContent"
			);
			const infoBoxClose = document.querySelector(
				"#" + this.canvasId + "info_box_close"
			);
			if (infoBox.getAttribute("class").includes("fixed") == false) {
				let infoContent = "";
				this.hoverItems = {};

				if (
					x >= (plotMargin.left / 2) &&
					x <= rect.width - (plotMargin.right / 2)
				) {
					for (const [xKey, xValue] of Object.entries(
						this.boxPosData
					)) {
						let xLoc = xKey.split("-");

						if (x >= xLoc[0] && x <= xLoc[1]) {
							xValue.map((yPos) => {
								if (y >= yPos.start && y <= yPos.end) {
									this.hoverItems[yPos.name] = yPos;
									infoContent +=
										"<strong>" +
										yPos.name +
										"</strong><br />";

									this.renderConfig["hover content"].map(
										(h) => {
											infoContent +=
												h +
												":" +
												yPos.data[h] +
												"<br />";
										}
									);
								}
							});
						}
					}
				}

				if (TYPE == "hover") {
					if (infoContent == "") {
						if (
							infoBox.getAttribute("class").includes("fixed") ==
							false
						) {
							//infoBoxContent.innerHTML = "";
							infoBox.setAttribute("class", "hidden");
							infoBoxClose.setAttribute("class", "hidden");
						}
					} else {
						if (
							infoBox.getAttribute("class").includes("fixed") ==
							false
						) {
							//infoBoxContent.innerHTML = infoContent;
							infoBox.setAttribute("class", "boxplot-info-box");
							infoBoxClose.setAttribute("class", "hidden");
							if (x < rect.width - 300) {
								infoBox.style.left = rawX + 25 + "px";
								infoBox.style.top = rawY + this.spaceBy + "px";
							} else {
								infoBox.style.left = rawX - 325 + "px";
								infoBox.style.width = "300px !important";
								infoBox.style.top = rawY + this.spaceBy + "px";
							}
						}
					}
				}

				if (TYPE == "click") {
					infoBoxClose.setAttribute("class", "fixed-info-box-close");
					if (infoContent == "") {
						
						infoBox.setAttribute("class", "hidden");
					} else {
						
						infoBox.setAttribute("class", "boxplot-info-box fixed");
						if (x < rect.width - 300) {
							infoBox.style.left = rawX + 25 + "px";
							infoBox.style.top = rawY + this.spaceBy + "px";
						} else {
							infoBox.style.left = rawX - 325 + "px";
							infoBox.style.width = "300px !important";
							infoBox.style.top = rawY + this.spaceBy + "px";
						}
					}
				}
			}
		},
		renderBoxPlot() {

			if(!!this.renderConfig["thresholds"] && this.renderConfig["thresholds"] == "calculate") {

				let threshholds = [];
				this.renderConfig["thresholds calculate"].map(expression =>{
					let calcString = "";

					expression.map(e => {
						let eValue = !!["+", "-", "*", "/", "(", ")"].includes(e) ? e : 
							(typeof e === 'number') ? e : 
							(typeof e === 'string') ? (e == "data length")? this.renderData.data.length:null:null;

						calcString += eValue;
					});
					
					let threshold = eval(calcString);
					threshholds.push(threshold);
				})
				this.renderConfig["thresholds"] = threshholds;
			}

			let wrapper = document.querySelector(
				"#" + this.canvasId + "boxPlotWrapper"
			);
			let canvas = document.querySelector(
				"#" + this.canvasId + "boxPlot"
			);

			if (!!canvas && !!wrapper) {
				let canvasWidth = wrapper.clientWidth * 2;
				let canvasHeight = Number(this.renderConfig["height"]) * 2;

				let c, ctx;
				c = document.querySelector("#" + this.canvasId + "boxPlot");
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

				this.boxPosData = {};

				let renderData = this.groupData(this.renderData);

				let groups = {};
				let totalNum = 0;

				let minY = null;
				let maxY = null;

				for (const [key, value] of Object.entries(renderData)) {
					groups[key] = value.length;
					totalNum += value.length;
					value.map((p) => {
						let yValue = p;
						minY =
							minY == null
								? yValue[this.renderConfig["y axis field"].min]
								: yValue[this.renderConfig["y axis field"].min] < minY
								? yValue[this.renderConfig["y axis field"].min]
								: minY;
						maxY =
							maxY == null
								? yValue[this.renderConfig["y axis field"].max]
								: yValue[this.renderConfig["y axis field"].max] > maxY
								? yValue[this.renderConfig["y axis field"].max]
								: maxY;
					});
				}
				minY = Math.floor(minY);
				maxY = Math.ceil(maxY);

				ctx.stroke();

				let customPlotMargin = !!this.renderConfig["plot margin"] ? this.renderConfig["plot margin"] : null;
				let plotMargin = !!customPlotMargin ? {
					left: customPlotMargin.left,
					right: customPlotMargin.right,
					top: customPlotMargin.top,
					bottom: customPlotMargin.bottom,
					bump: 10,
				} :
					{
						left: this.plotMargin.leftMargin / 2,
						right: (this.plotMargin.leftMargin / 2) * 1.5,
						top: (this.plotMargin.bottomMargin / 2) * 3.5,
						bottom: (this.plotMargin.bottomMargin / 2) * 2.5,
						bump: 10,
					};

				this.utils.plotUtils.renderAxisWBump(
					ctx,
					canvasWidth,
					canvasHeight,
					plotMargin,
					"y",
					5,
					minY,
					maxY,
					this.renderConfig["y axis label"]
				);

				this.utils.plotUtils.renderAxisWBump(
					ctx,
					canvasWidth,
					canvasHeight,
					plotMargin,
					"x",
					null,
					null,
					null,
					this.renderConfig["x axis label"]
				);

				this.renderTicksByGroup(
					ctx,
					canvasWidth,
					canvasHeight,
					plotMargin,
					"x",
					groups
				);

				let xStep =
					(canvasWidth - plotMargin.left - plotMargin.right) /
					totalNum;

				let yMax = maxY;
				let yMin = minY;

				// render Y ticks
				let yStep =
					(canvasHeight - (plotMargin.top + plotMargin.bottom)) /
					(yMax - yMin);

				/// render guide line

				ctx.setLineDash([]); // Set annoying line dash back to normal

				let groupsArr = Object.keys(groups).sort();

				let dotIndex = 0;

				let boxWidth = ((canvasWidth - (plotMargin.left + plotMargin.right))/totalNum) - 40;
				boxWidth = boxWidth <= 20 ? 20 : boxWidth >= 80 ? 80 : boxWidth;

				if (totalNum > 0) {
					for (const [key, value] of Object.entries(renderData)) {
						let keyIndex =
							groupsArr.indexOf(key) % this.colors.length;
						let fillColor = this.colors[keyIndex];
						let strokeColor = "#00000075"; 

						let labelIndex = 0;
						let labelOrigin = 0;
						let maxWidthPerGroup =
							plotMargin.left +
							xStep * dotIndex +
							xStep * value.length -
							24;

						let yPos0 = canvasHeight - plotMargin.bottom - (-minY) * yStep;
						value.map((p) => {
							if (
								this.phenotypeMapConfig == null ||
								(this.phenotypeMapConfig == "kpPhenotypeMap" &&
									!!this.phenotypeMap[
										p[this.renderConfig["render by"]]
									])
							) {

								let xPos = plotMargin.left + xStep * (dotIndex + .5);

								let yValue = {
									min:p[this.renderConfig["y axis field"].min],
									max: p[this.renderConfig["y axis field"].max],
									median: p[this.renderConfig["y axis field"].median],
									q1: p[this.renderConfig["y axis field"].q1],
									q3: p[this.renderConfig["y axis field"].q3]
								}

								let centerY0, centerY1, medianY, q1Y, q3Y;

								centerY0 = canvasHeight - plotMargin.bottom - yValue.min * yStep;
								centerY1 = canvasHeight - plotMargin.bottom - yValue.max * yStep;
								medianY = canvasHeight - plotMargin.bottom - yValue.median * yStep;
								q1Y = canvasHeight - plotMargin.bottom - yValue.q1 * yStep;
								q3Y = canvasHeight - plotMargin.bottom - yValue.q3 * yStep;

								/// render center line
								ctx.strokeStyle = fillColor;
								ctx.lineWidth = 1;

								ctx.beginPath();c
								ctx.moveTo(
									xPos + boxWidth/2,
									centerY0
								);
								ctx.lineTo(
									xPos + boxWidth / 2,
									centerY1
								);
								ctx.stroke();

								/// render box by q1 and q3
								ctx.strokeStyle = fillColor;
								ctx.lineWidth = 2;
								ctx.fillStyle = "#ffffff";
								ctx.fillRect(xPos, q1Y, boxWidth, q3Y - q1Y);

								ctx.beginPath(); 
								ctx.rect(xPos, q1Y, boxWidth, q3Y-q1Y);
								ctx.stroke();

								/// render median line
								ctx.strokeStyle = fillColor;
								ctx.lineWidth = 3;

								ctx.beginPath();
								ctx.moveTo(
									xPos,
									medianY
								);
								ctx.lineTo(
									xPos + boxWidth,
									medianY
								);
								ctx.stroke();

								let pName =
									this.phenotypeMapConfig == null
										? p[this.renderConfig["render by"]]
										: this.phenotypeMap[
										p[
										this.renderConfig[
										"render by"
										]
										]
										]["description"];

								///organize data by position
								let xRangeStart = Math.round(xPos / 2);//Math.round(q3Y / 2);
								let xRangeEnd = Math.round((xPos + boxWidth) / 2);//Math.round(q1Y / 2);
								let xRange = xRangeStart + "-" + xRangeEnd;
								let yRangeStart = Math.round(q3Y / 2);
								let yRangeEnd = Math.round(q1Y / 2);
								//let yRange = yRangeStart + "-" + yRangeEnd;
								let tempObj = {};
								this.renderConfig["hover content"].map((c) => {
									tempObj[c] = p[c];
								});
								let yRange = {
									start: yRangeStart,
									end: yRangeEnd,
									data: tempObj,
									name: pName,
									id: p[this.renderConfig["render by"]],
								};

								if (!this.boxPosData[xRange]) {
									this.boxPosData[xRange] = [];
								}
								this.boxPosData[xRange].push(yRange);

								///add labels if p-value above 2.5e-6
								if (labelIndex == 0) {
									labelOrigin = xPos;
								}

								let labelXpos = labelOrigin + 24 * labelIndex;

								labelXpos = xPos > labelXpos ? xPos : labelXpos;

								
								ctx.font = "22px Arial";

								ctx.fillStyle = "#000000"

								let labelYPos = yPos0;

								ctx.save();
								ctx.translate(labelXpos + (boxWidth / 2) + 10, centerY1 - 24);
								ctx.rotate((90 * -Math.PI) / 180);
								ctx.textAlign = "start";
								ctx.fillText(pName, 0, 0);
								ctx.restore();


								ctx.lineWidth = 1;
								ctx.moveTo((xPos + (boxWidth/2)), centerY1 - 5);
								ctx.lineTo(labelXpos + (boxWidth / 2), centerY1 - 20);
								ctx.strokeStyle = "#00000080";
								ctx.stroke();

								labelIndex++;
								dotIndex++;
							}
						});
						keyIndex++;
					}

				} 
			}
		},

		renderDot(CTX, XPOS, YPOS, DOT_COLOR, STROKE_COLOR) {
			CTX.beginPath();
			CTX.arc(XPOS, YPOS, 10, 0, 2 * Math.PI);

			CTX.fillStyle = DOT_COLOR;
			CTX.fill();
			CTX.lineWidth = 1;
			CTX.strokeStyle = STROKE_COLOR;
			CTX.stroke();
			//
		},

		renderTriangle(CTX, XPOS, YPOS, DOT_COLOR, STROKE_COLOR, EFFECT) {
			CTX.beginPath();
			if (EFFECT == 1) {
				CTX.moveTo(XPOS - 10, YPOS + 10);
				CTX.lineTo(XPOS + 10, YPOS + 10);
				CTX.lineTo(XPOS, YPOS - 10);
			}
			if (EFFECT == -1) {
				CTX.moveTo(XPOS - 10, YPOS - 10);
				CTX.lineTo(XPOS, YPOS + 10);
				CTX.lineTo(XPOS + 10, YPOS - 10);
			}
			CTX.closePath();

			CTX.fillStyle = DOT_COLOR;
			CTX.fill();
			CTX.lineWidth = 1;
			CTX.strokeStyle = STROKE_COLOR;
			CTX.stroke();
		},

		renderTicksByGroup(CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, GROUPS) {
			let groupsArr = Object.keys(GROUPS).sort();
			let totalNum = 0;
			for (const [key, value] of Object.entries(GROUPS)) {
				totalNum += value;
			}

			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#000000";
			CTX.font = "22px Arial";
			CTX.fillStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			switch (DIRECTION) {
				case "x":
					let xTickDistance =
						(WIDTH - MARGIN.left - MARGIN.right) / totalNum;

					let previousGroup = 0;
					for (const [key, value] of Object.entries(GROUPS)) {
						if (value > 0) {
							let tickXPos =
								MARGIN.left + previousGroup * xTickDistance;
							let adjTickXPos = Math.floor(tickXPos);
							CTX.moveTo(
								adjTickXPos,
								HEIGHT - MARGIN.bottom + MARGIN.bump
							);
							CTX.lineTo(
								adjTickXPos,
								HEIGHT - MARGIN.bottom + MARGIN.bump * 2
							);
							CTX.stroke();

							let keyIndex =
								groupsArr.indexOf(key) % this.colors.length;
							CTX.fillStyle = this.colors[keyIndex];
							CTX.save();
							CTX.translate(
								adjTickXPos,
								HEIGHT - MARGIN.bottom + MARGIN.bump * 2
							);
							CTX.rotate((45 * Math.PI) / 180);
							CTX.textAlign = "start";
							CTX.fillText(key, 0, 15);
							//CTX.rotate((45 * Math.PI) / 180);
							CTX.restore();

							previousGroup += value;
						}
					}

					break;
				case "y":
					/// leave it empty in case we need it later
					break;
			}
		},

		checkStared(ITEM) {
			let selectedItems = this.pkgDataSelected
				.filter((s) => s.type == this.renderConfig["star key"])
				.map((s) => s.id);

			if (!!selectedItems.includes(ITEM)) {
				return true;
			} else {
				return false;
			}
		},
		addStarItem(ITEM) {
			this.$store.dispatch("pkgDataSelected", {
				type: this.renderConfig["star key"],
				id: ITEM,
				action: "add",
			});
		},
		removeStarItem(ITEM) {
			this.$store.dispatch("pkgDataSelected", {
				type: this.renderConfig["star key"],
				id: ITEM,
				action: "remove",
			});
		},
	},
});

$(function () {});
</script>

<style>
.fixed-info-box-close {
	position: absolute;
	top: 0;
	right: 3px;
	font-size: 14px;
	color: #69f;
}
.boxplot-info-box {
	position: absolute;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 5px 15px;
	z-index: 11;
	font-size: 13px;
	min-width: 200px !important;
	max-width: 400px !important;
}
.option-button {
	font-size: 12px;
	border: solid 1px #aaaaaa;
	border-radius: 10px;
	display: block;
	/* padding: 1px 5px; */
	margin-bottom: 3px;
}
</style>



