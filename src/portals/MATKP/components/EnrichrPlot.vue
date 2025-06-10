<template>
	<div class="mbm-plot-content row">
		<div class="label">{{ canvasId }} gene pathways</div>
		<div class="col-md-12 bar-plot-wrapper">
			<div
				class="col-md-12"
				:id="canvasId + 'barPlotWrapper'"
				style="display: inline-block"
			>
				<div
					:id="canvasId + 'barInfoBox'"
					class="barplot-info-box hidden"
				>
					<div
						:id="canvasId + 'info_box_close'"
						class="fixed-info-box-close"
						@click="
							utils.uiUtils.removeOnMouseOut(canvasId + 'barInfoBox', 100)
						"
					>
						<b-icon icon="x-circle-fill"></b-icon>
					</div>
					<span :id="canvasId + 'barInfoBoxContent'"></span>

					<span v-for="(ptValue, ptKey) in hoverItems" :key="ptKey">
						<strong>{{ ptKey }}</strong
						><br />
						<span v-for="(dValue, dKey) in ptValue.data">
							<span>{{ dKey + ": " }}</span
							><span>{{ typeof dValue === "number" ? dValue.toFixed(4) : dValue }}</span> <br
						/></span>
						<template
							v-if="
								options != null &&
								utils.uiUtils.isIdFixed('#' + canvasId + 'barInfoBox') ==
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
								utils.uiUtils.isIdFixed('#' + canvasId + 'barInfoBox') ==
									false
							"
							>Click for options</span
						>
					</span>
				</div>

				<canvas :hidden="!showCanvas"
					:id="canvasId + 'barPlot'"
					width=""
					height=""
					@mousemove="checkPosition($event, 'hover')"
					@click="checkPosition($event, 'click')"
					@mouseout="
						!utils.uiUtils.isIdFixed('#' + canvasId + 'barInfoBox')
							? utils.uiUtils.removeOnMouseOut(canvasId + 'barInfoBox', 1000)
							: ''
					"
				></canvas>
				<div class="download-images-setting">
					<span class="btn btn-default options-gear" >Download <b-icon icon="download"></b-icon></span>
					<ul class="options" >
						<li>
							<a href="javascript:;"
							@click="downloadImage('vector_wrapper_' + canvasId, canvasId + '_barPlot', 'svg')">Download SVG</a>
						</li>
						<li>
							<a href="javascript:;"
							@click="downloadImage(canvasId + 'barPlot', canvasId + '_barPlot', 'png')">Download PNG</a>
						</li>
					</ul>
				</div>
				<research-bar-plot-vector
					v-if="!!renderData"
					:renderData="groupData(renderData)"
					:renderConfig="renderConfig"
					:colors="colors"
					:margin="adjPlotMargin"
					:sectionId="canvasId"
					:utils="utils"
					:ref="canvasId + '_barPlot'"
				>
				</research-bar-plot-vector>
				<div v-if="renderData === null">
					The ENRICHR server has encountered an error.
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { cloneDeep } from "lodash";
import { BootstrapVueIcons } from "bootstrap-vue";
import barPlotVector from "@/components/researchPortal/vectorPlots/ResearchBarPlotVector.vue";
const BIO_INDEX_HOST = "https://matkp.hugeampkpnbi.org";

Vue.use(BootstrapVueIcons);

export default Vue.component("enrichr-plot", {
	props: [
		"canvasId",
		"phenotypeMap",
		"phenotypesData",
		"pkgData",
		"pkgDataSelected",
		"colors",
		"colorScale",
		"plotMargin",
		"filter",
		"options",
		"sectionId",
		"utils",
	],
	data() {
		return {
			barData: null,
			barPosData: {},
			spaceBy: 7,
			trigger: 0,
			hoverItems: {},
			showCanvas: true,
			renderConfig: {
                type: "bar plot",
                label: "Enrichr Results",
                "group by": "rankLabel",
                "y axis field": "Combined score",
                "convert y -log10": null,
                "y ticks decimal point": "2",
                "render by": "Term name",
                "y axis label": "Combined score",
                "x axis label": "",
                "beta field": null,
                "hover content": [
                    "Combined score",
                    "P-value",
                    "Adjusted p-value",
										"Overlapping genes"
                ],
                thresholds: [],
                height: 300,
                "plot margin": {
                    top: 50,
                    bottom: 250,
                    left: 150,
                    right: 175
                }
            },
		};
	},
	modules: {
	},
	components: {
		barPlotVector,
	},
	async created() {
		//this.renderBarPlot();
	},
	async mounted() {
		window.addEventListener("resize", this.onResize);
		this.renderBarPlot();
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
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
	},
	watch: {
		renderData(content) {
			this.renderBarPlot();
		},
	},
	methods: {
		downloadImage(ID, NAME, TYPE) {
			if (TYPE == 'svg') {
				this.$refs[this.canvasId + '_barPlot'].renderPlot();
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE, "vector_bar_plot_" + this.canvasId);
			} else if (TYPE == 'png') {
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
			/*
			for (const [key, value] of Object.entries(phenotypeGroupsObj)) {
				value.sort((a, b) =>
					a[this.renderConfig["y axis field"]] >
					b[this.renderConfig["y axis field"]]
						? 1
						: -1
				);
			}*/

			return phenotypeGroupsObj;
		},
		onResize() {
			this.renderBarPlot();
		},
		checkPosition(event, TYPE) {
			let e = event;
			let rect = e.target.getBoundingClientRect();

			let rawX = e.clientX - rect.left;
			let rawY = e.clientY - rect.top;

			let customPlotMargin = !!this.renderConfig["plot margin"]? this.renderConfig["plot margin"]:null;

			let plotMargin = !!customPlotMargin?{
						left: customPlotMargin.left,
						right: customPlotMargin.right,
						top: customPlotMargin.top,
						bottom: customPlotMargin.bottom,
						bump: 10,
					}:
					{
						left: this.plotMargin.leftMargin / 2,
						right: (this.plotMargin.leftMargin / 2) * 1.5,
						top: (this.plotMargin.bottomMargin / 2) * 3.5,
						bottom: (this.plotMargin.bottomMargin / 2) * 2.5,
						bump: 10,
					};

			let y = Math.ceil(e.clientY - rect.top);
			let x = Math.ceil(e.clientX - rect.left);

			const infoBox = document.querySelector(
				"#" + this.canvasId + "barInfoBox"
			);
			const infoBoxContent = document.querySelector(
				"#" + this.canvasId + "barInfoBoxContent"
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
					for (const [yKey, yValue] of Object.entries(
						this.barPosData
					)) {
						let yLoc = yKey.split("-");
						if (y >= yLoc[0] && y <= yLoc[1]) {
							yValue.map((xPos) => {
								if (x >= xPos.start && x <= xPos.end) {
									this.hoverItems[xPos.name] = xPos;

									infoContent +=
										"<strong>" +
										xPos.name +
										"</strong><br />";

									this.renderConfig["hover content"].map(
										(h) => {
											infoContent +=
												h +
												":" +
												xPos.data[h] +
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
							infoBox.setAttribute("class", "hidden");
							infoBoxClose.setAttribute("class", "hidden");
						}
					} else {
						if (
							infoBox.getAttribute("class").includes("fixed") ==
							false
						) {
							//infoBoxContent.innerHTML = infoContent;
							infoBox.setAttribute("class", "barplot-info-box");
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
						//infoBoxContent.innerHTML = "";
						infoBox.setAttribute("class", "hidden");
					} else {
						//infoBoxContent.innerHTML = infoContent;
						infoBox.setAttribute("class", "barplot-info-box fixed");
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
		renderBarPlot() {

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
				"#" + this.canvasId + "barPlotWrapper"
			);
			let canvas = document.querySelector(
				"#" + this.canvasId + "barPlot"
			);

			if (!!canvas && !!wrapper) {
				let canvasWidth = wrapper.clientWidth * 2;
				let canvasHeight = Number(this.renderConfig["height"]) * 2;

				let c, ctx;
				c = document.querySelector("#" + this.canvasId + "barPlot");
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

				this.barPosData = {};

				let renderData = this.groupData(this.renderData);

				let bars = {};
				let totalNum = 0;

				let minY = null;
				let maxY = null;

				for (const [key, value] of Object.entries(renderData)) {
					bars[key] = value[0];
					totalNum += value.length;
					value.map((p) => {
						let yValue =
							this.renderConfig["convert y -log10"] == "true"
								? p[
										this.renderConfig["y axis field"] +
											"-log10"
								  ]
								: Number(p[this.renderConfig["y axis field"]]);
						minY =
							minY == null
								? yValue
								: yValue < minY
								? yValue
								: minY;
						maxY =
							maxY == null
								? yValue
								: yValue > maxY
								? yValue
								: maxY;
					});
				}
				minY = (minY > 0)? 0 : Math.floor(minY);
				maxY = (maxY < 0)? 0 : Math.ceil(maxY);

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
					this.renderConfig["x axis label"] // We don't need an x-axis label under this plot
				);

				this.renderTicksByGroup(
					ctx,
					canvasWidth,
					canvasHeight,
					plotMargin,
					bars
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

				this.renderConfig["thresholds"].map((t) => {
					ctx.beginPath();
					let tValue =
						this.renderConfig["convert y -log10"] == "true"
							? -Math.log10(Number(t))
							: Number(t);

					let yFromMinYGuide = -minY + tValue;

					let guidelineYpos =
						canvasHeight -
						plotMargin.bottom -
						yFromMinYGuide * yStep;

					ctx.setLineDash([20, 10]);
					ctx.moveTo(
						plotMargin.left - plotMargin.bump,
						guidelineYpos
					);
					ctx.lineTo(
						canvasWidth + plotMargin.bump - plotMargin.right,
						guidelineYpos
					);
					ctx.strokeStyle = "#FFAA00";
					ctx.lineWidth = 2;
					ctx.stroke();
					ctx.closePath();
				});

				ctx.setLineDash([]); // Set annoying line dash back to normal

				let groupsArr = Object.keys(bars).sort();

				let dotIndex = -0.5;

				let barWidth = ((canvasWidth - (plotMargin.left + plotMargin.right))/totalNum) - 10;
				barWidth = barWidth <= 4 ? 4 : barWidth >= 80? 80 : barWidth;

				if (totalNum >0) {
					for (const [key, value] of Object.entries(renderData)) {
						let colorKey = -Math.log10(value[0]["Adjusted p-value"]);
						let fillColor = this.colorScale(colorKey);


						let yPos0 = canvasHeight - plotMargin.bottom - (-minY * yStep);
						value.map((p) => {
							if (
								this.phenotypeMapConfig == null ||
								(this.phenotypeMapConfig == "kpPhenotypeMap" &&
									!!this.phenotypeMap[
										p[this.renderConfig["render by"]]
									])
							) {

								let xPos = plotMargin.left + xStep * (dotIndex + .5);

								let yValue =
									this.renderConfig["convert y -log10"] ==
									"true"
										? p[
												this.renderConfig[
													"y axis field"
												] + "-log10"
										  ]
										: p[this.renderConfig["y axis field"]];

								let yFromMinY = -minY + yValue;

								let yPos =
									canvasHeight -
									plotMargin.bottom -
									yFromMinY * yStep;

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

								
								ctx.fillStyle = fillColor;
								ctx.lineWidth = 1;
								ctx.strokeStyle = "1px solid black";

								ctx.fillRect(xPos, yPos, barWidth, yPos0-yPos);

								let yRangeStart = (yPos >= yPos0) ? Math.round(yPos0)/2 : Math.round(yPos)/2;
								let yRangeEnd = (yPos >= yPos0) ? Math.round(yPos)/2 : Math.round(yPos0)/2;
								let yRange = yRangeStart + "-" + yRangeEnd;
								let tempObj = {};
								this.renderConfig["hover content"].map((c) => {
									tempObj[c] = p[c];
								});
								let xRange = {
									start: Math.round(xPos)/2,
									end: Math.round(xPos + barWidth)/2,
									data: tempObj,
									name: pName,
									id: p[this.renderConfig["render by"]],
								};

								if (!this.barPosData[yRange]) {
									this.barPosData[yRange] = [];
								}
								this.barPosData[yRange].push(xRange);
								dotIndex++;
							}
						});
					}
				} 
			}
		},

		renderTicksByGroup(CTX, WIDTH, HEIGHT, MARGIN, GROUPS) {
			let groupsArr = Object.keys(GROUPS).sort();
			let totalNum = groupsArr.length;

			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#000000";
			CTX.font = "22px Arial";
			CTX.fillStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			let xTickDistance =
						(WIDTH - MARGIN.left - MARGIN.right) / totalNum;

					let previousGroup = 0;
					for (const [key, value] of Object.entries(GROUPS)) {
						let tickXPos = MARGIN.left + previousGroup * xTickDistance;
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
							let adjP = value["Adjusted p-value"];
							let color = this.colorScale(-Math.log10(adjP));
							CTX.fillStyle = color;
							CTX.save();
							CTX.translate(
								adjTickXPos,
								HEIGHT - MARGIN.bottom + MARGIN.bump * 2
							);
							CTX.rotate((45 * Math.PI) / 180);
							CTX.textAlign = "start";
							CTX.fillText(key.substring(4), 0, 15); // 3 digit numerical prefix plus underscore
							CTX.restore();

							previousGroup += 1;
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

<style scoped>
.fixed-info-box-close {
	position: absolute;
	top: 0;
	right: 3px;
	font-size: 14px;
	color: #69f;
}
.barplot-info-box {
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
.label {
	font-weight: bold;
	margin-left: 20px;
}
</style>



