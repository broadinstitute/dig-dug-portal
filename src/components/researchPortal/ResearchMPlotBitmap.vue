<template>
	<div class="mbm-plot-content">
		<div :id="'clicked_dot_value_' + sectionId" class="clicked-dot-value hidden">
			<div :id="'clicked_dot_value_content_' + sectionId" class="clicked-dot-value-content"></div>
		</div>
		<div :id="'dot_value_full_list_'+ sectionId " class="dot-value-full-list hidden">
			<div
				class="clicked-dot-value-close"
				@click="hidePanel('dot_value_full_list_' + sectionId)"
			>
				<b-icon icon="x-circle-fill"></b-icon>
			</div>
			<div :id="'dot_value_full_list_content_'+ sectionId" class="dot-value-full-list-content"></div>
		</div>
		<div
			v-if="!!renderConfig.legend"
			class="mbm-plot-legend"
			v-html="renderConfig.legend"
		></div>
		<div v-for="item in plotsList" :key="item" :id="sectionId+ 'mPlotWrapper'">
			<h4 v-if="item != 'default'">{{ item }}</h4>
			<canvas
				v-if="!!renderConfig"
				:id="'manhattanPlot_'+ sectionId + item"
				class="manhattan-plot"
				@mouseleave="hidePanel"
				@mousemove="checkPosition($event, item)"
				@resize="onResize"
				@click="getFullList($event, item)"
				width=""
				height=""
			>
			</canvas>
			<div class="download-images-setting">
				<span class="btn btn-default options-gear" >Download <b-icon icon="download"></b-icon></span>
				<ul class="options" >
					<li>
						<a href="javascript:;"
						@click="downloadImage('vector_wrapper_' + sectionId, sectionId + '_mPlot', 'svg', 'vector_m_plot_' + sectionId,item)">Download SVG</a>
					</li>
					<li>
						<a href="javascript:;"
						@click="downloadImage('manhattanPlot_' + sectionId + item, sectionId + '_mPlot', 'png')">Download PNG</a>
					</li>
				</ul>
			</div>
		</div>
		
		<research-m-bitmap-plot-vector
			v-if="!!renderData"
			:renderData="renderData"
			:renderConfig="renderConfig"
			:colors="chromosomeColors"
			:margin="adjPlotMargin"
			:chrLengths="chromosomeLength"
			:sectionId="sectionId"
			:utils="utils"
			:ref="sectionId + '_mPlot'"
		>
		</research-m-bitmap-plot-vector>
		<div
			v-if="!!renderConfig.label"
			class="mbm-plot-label"
			v-html="renderConfig.label"
		></div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";
import ResearchMPlotBitmapVector from "@/components/researchPortal/vectorPlots/ResearchMPlotBitmapVector.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-m-bitmap-plot", {
	props: [
		"plotData",
		"renderConfig",
		"dataComparisonConfig",
		"compareGroupColors",
		"utils",
		"sectionId"
	],
	data() {
		return {
			plotRendered: 0,
			chromosomeLength: {
				1: 248956422,
				2: 242193529,
				3: 198295559,
				4: 190214555,
				5: 181538259,
				6: 170805979,
				7: 159345973,
				8: 145138636,
				9: 138394717,
				10: 133797422,
				11: 135086622,
				12: 133275309,
				13: 114364328,
				14: 107043718,
				15: 101991189,
				16: 90338345,
				17: 83257441,
				18: 80373285,
				19: 58617616,
				20: 64444167,
				21: 46709983,
				22: 50818468,
				23: 156040895,
				24: 57227415,
				X: 156040895,
				Y: 57227415,
			},
			chromosomeColors: [
				"#08306b",
				"#41ab5d",
				"#000000",
				"#f16913",
				"#3f007d",
				"#cb181d",
			],
			leftMargin: 150, // -0.5 to draw crisp line. adding space to the right incase dots go over the border
			rightMargin: 40,
			topMargin: 40, // -0.5 to draw crisp line
			bottomMargin: 100,
			dotPosData: {},
			compareGroups: null,
			groupsList:null,
		};
	},
	modules: {
	},
	components: {
		ResearchMPlotBitmapVector
	},
	mounted: function () {
		this.renderPlot(this.renderData);
		window.addEventListener("resize", this.onResize);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		plotsList() {
			let rawData = this.plotData;
			let compareGroups = [];
			//console.log("this.dataComparisonConfig",this.dataComparisonConfig);

			if (!!rawData) {
				if (this.dataComparisonConfig != null) {
					let compareKey =
						this.dataComparisonConfig["fields to compare"][0];

					for (const [key, value] of Object.entries(rawData)) {
						Object.keys(value[compareKey]).map((k) => {
							if (compareGroups.indexOf(k) < 0) {
								compareGroups.push(k);
							}
						});
					}
				} else {
					compareGroups = ["default"];
				}
				return compareGroups;
			} else {
				return null;
			}
		},
		renderData() {
			let rawData = this.plotData;
			let compareGroups = [];
			let massagedData = {};
			let plotsList = [...this.plotsList];

			plotsList.map((c) => {
				let tempObj = { sorted: {}, unsorted: [] };
				massagedData[c] = tempObj;
			});

			for (const chr in this.chromosomeLength) {
				for (const [key, value] of Object.entries(massagedData)) {
					value.sorted[chr] = [];
				}
			}

			if (this.dataComparisonConfig != null) {
				for (const [key, value] of Object.entries(rawData)) {
					plotsList.map((c) => {
						let region = value[this.renderConfig["x axis field"]];

						if (
							region != undefined &&
							region != "" &&
							region != null
						) {
							let tempObj = {};
							tempObj[this.renderConfig["render by"]] =
								value[this.renderConfig["render by"]];

							if (!!this.renderConfig["hover content"]) {
								let hoverContent =
									this.renderConfig["hover content"];

								hoverContent.map((h) => {
									let ifInCompare =
										this.dataComparisonConfig[
											"fields to compare"
										].indexOf(h);
									tempObj[h] =
										ifInCompare < 0
											? value[h]
											: value[h][c];
								});
							}

							let locationArr =
								value[this.renderConfig["x axis field"]].split(
									":"
								);

							let chr = locationArr[0].trim();

							let regionArr = locationArr[1].split("-");

							tempObj["locus"] =
								regionArr.length > 1
									? (Number(regionArr[0].trim()) +
											Number(regionArr[1].trim())) /
									  2
									: Number(regionArr[0].trim());

							tempObj[this.renderConfig["y axis field"]] =
								value[this.renderConfig["y axis field"]][c];

							massagedData[c].sorted[chr].push(tempObj);
							massagedData[c].unsorted.push(tempObj);
						}
					});
				}
			} else {
				rawData.map((r) => {
					let region = r[this.renderConfig["x axis field"]];

					if (region != undefined && region != "" && region != null) {
						let tempObj = {};
						tempObj[this.renderConfig["render by"]] =
							r[this.renderConfig["render by"]];

						if (!!this.renderConfig["hover content"]) {
							let hoverContent =
								this.renderConfig["hover content"];

							hoverContent.map((h) => {
								tempObj[h] = r[h];
							});
						}

						let locationArr =
							r[this.renderConfig["x axis field"]].split(":");

						let chr = locationArr[0].trim();

						let regionArr = locationArr[1].split("-");

						tempObj["locus"] =
							regionArr.length > 1
								? (Number(regionArr[0].trim()) +
										Number(regionArr[1].trim())) /
								  2
								: Number(regionArr[0].trim());

						tempObj[this.renderConfig["y axis field"]] =
							r[this.renderConfig["y axis field"]];

						massagedData["default"].sorted[chr].push(tempObj);
						massagedData["default"].unsorted.push(tempObj);
					}
				});
			}

			return massagedData;
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
					left: this.leftMargin,
					right: this.rightMargin,
					top: this.topMargin,
					bottom: this.bottomMargin,
					bump: 10,
				};

			return plotMargin;
		},
	},
	watch: {
		renderData(CONTENT) {
			//when data gets updated, hold it for little until vue.js renders <canvas> for the each datasets
			setTimeout(function () {
				window.dispatchEvent(new Event("resize"));
			}, 100);
		},
	},
	methods: {
		downloadImage(ID, NAME, TYPE, SVG, DATA) {
			if (TYPE == 'svg') {
				let refName = this.sectionId + '_mPlot';
				this.$refs[refName].renderPlot(DATA);
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE, SVG);
			} else if (TYPE == 'png') {
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE)
			}
		},
		hidePanel(element) {
			this.utils.uiUtils.hideElement(element);
		},
		onResize(e) {
			this.renderPlot(this.renderData);
		},
		getFullList(event, ID) {
			let wrapper = document.getElementById("dot_value_full_list_" + this.sectionId);
			wrapper.classList.remove("hidden");
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let y = Math.floor(e.clientY - rect.top);

			let clickedDotValue = "";

			for (let h = -5; h <= 5; h++) {
				for (let v = -5; v <= 5; v++) {
					if (this.dotPosData[ID][x + h] != undefined) {
						if (this.dotPosData[ID][x + h][y + v] != undefined) {
							let dotObject = this.dotPosData[ID][x + h][y + v];
							clickedDotValue +=
								'<span class="gene-on-clicked-dot-mplot"><b>' +
								dotObject[this.renderConfig["render by"]] +
								"</b></span>";

							if (!!this.renderConfig["hover content"]) {
								let hoverContent =
									this.renderConfig["hover content"];

								hoverContent.map((h) => {
									clickedDotValue +=
										'<span class="content-on-clicked-dot">' +
										h +
										": " +
										 this.utils.Formatters.getHoverValue(dotObject[h]) +
										"</span>";
								});
							}
						}
					}
				}
			}
			let contentWrapper = document.getElementById(
				"dot_value_full_list_content_" + this.sectionId
			);

			if (clickedDotValue != "") {
				contentWrapper.innerHTML = clickedDotValue;
				document
					.getElementById("manhattanPlot_" + this.sectionId + ID)
					.classList.add("hover");
				document
					.getElementById("clicked_dot_value_" + this.sectionId)
					.classList.add("hidden");
			} else {
				wrapper.classList.add("hidden");
				document
					.getElementById("manhattanPlot_" + this.sectionId + ID)
					.classList.remove("hover");
			}
		},
		getHoverValue(VALUE) {
			let formatted;

			if (typeof VALUE == 'number' && !isNaN(VALUE)) {
				formatted = this.utils.Formatters.pValueFormatter(VALUE);
			} else {
				formatted = VALUE;
			}
			return formatted;
		},
		checkPosition(event, ID) {

			let wrapper = document.getElementById("clicked_dot_value_" + this.sectionId);
			let canvas = document.getElementById("manhattanPlot_" + this.sectionId + ID);
			wrapper.classList.remove("hidden");
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let y = Math.floor(e.clientY - rect.top);
			wrapper.style.top = y + canvas.offsetTop + "px";
			wrapper.style.left = x + canvas.offsetLeft + 15 + "px";

			let clickedDotValue = "";

			let numOfValues = 0;

			for (let h = -5; h <= 5; h++) {
				for (let v = -5; v <= 5; v++) {
					if (this.dotPosData[ID][x + h] != undefined) {
						if (this.dotPosData[ID][x + h][y + v] != undefined) {
							if (numOfValues < 6) {
								let dotObject =
									this.dotPosData[ID][x + h][y + v];
								clickedDotValue +=
									'<span class="gene-on-clicked-dot-mplot"><b>' +
									dotObject[this.renderConfig["render by"]] +
									"</b></span>";

								if (!!this.renderConfig["hover content"]) {
									let hoverContent =
										this.renderConfig["hover content"];

									hoverContent.map((h) => {
										clickedDotValue +=
											'<span class="content-on-clicked-dot">' +
											h +
											": " +
											this.utils.Formatters.getHoverValue(dotObject[h]) +
											"</span>";
									});
								}
							}

							numOfValues += 1;
						}
					}
				}
			}

			if (numOfValues > 5) {
				clickedDotValue +=
					'<span class="gene-on-clicked-dot-mplot" style="color: #36c;"><b>Viewing 5 of ' +
					numOfValues +
					" items. Click to view full list.<b><span>";
			}

			let contentWrapper = document.getElementById(
				"clicked_dot_value_content_" + this.sectionId
			);

			if (clickedDotValue != "") {
				contentWrapper.innerHTML = clickedDotValue;

				document
					.getElementById("manhattanPlot_" + this.sectionId + ID)
					.classList.add("hover");
			} else {
				wrapper.classList.add("hidden");
				document
					.getElementById("manhattanPlot_" + this.sectionId + ID)
					.classList.remove("hover");
			}
		},
		renderPlot(DATA) {

			this.dotPosData = {};

			let wrapper = document.getElementById("clicked_dot_value_" + this.sectionId);
			wrapper.classList.add("hidden");

			let canvasRenderWidth = !!this.renderConfig.width
				? this.renderConfig.width * 2 +
				  this.leftMargin +
				  this.rightMargin
				: (window.innerWidth - 115) * 2;

			let canvasRenderHeight = !!this.renderConfig.height
				? this.renderConfig.height * 2 +
				  this.topMargin +
				  this.bottomMargin
				: 800;

			let xBump = canvasRenderWidth * 0.02;
			let yBump = canvasRenderHeight * 0.02;
			let bump = 10;

			let plotWidth =
				canvasRenderWidth -
				(this.leftMargin + this.rightMargin + xBump);
			let plotHeight =
				canvasRenderHeight -
				(this.topMargin + yBump + this.bottomMargin);

			for (const [dKey, dValue] of Object.entries(DATA)) {
				let c = document.getElementById("manhattanPlot_" + this.sectionId + dKey);
				if (!!c) {
					c.setAttribute("width", canvasRenderWidth);
					c.setAttribute("height", canvasRenderHeight);
					c.setAttribute(
						"style",
						"width:" +
							canvasRenderWidth / 2 +
							"px;height:" +
							canvasRenderHeight / 2 +
							"px;"
					);
					let ctx = c.getContext("2d");

					ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight);

					ctx.beginPath();
					ctx.lineWidth = 1;
					ctx.strokeStyle = "#000000";
					ctx.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

					// render y axis
					ctx.moveTo(this.leftMargin - bump, this.topMargin);
					ctx.lineTo(
						this.leftMargin - bump,
						plotHeight + this.topMargin + yBump + bump
					);

					//render x axis
					ctx.moveTo(
						this.leftMargin - bump,
						plotHeight + this.topMargin + yBump + bump
					);
					ctx.lineTo(
						plotWidth + this.leftMargin + bump,
						plotHeight + this.topMargin + yBump + bump
					);

					// render y ticker

					let yMin = null;
					let yMax = null;

					dValue.unsorted.map((d) => {
						//yAxisData.push(d[this.renderConfig["y axis field"]]);

						let yValue = d[this.renderConfig["y axis field"]];

						if (yMin == null) {
							yMin = yValue;
						}
						if (yMax == null) {
							yMax = yValue;
						}

						if (yValue < yMin) {
							yMin = yValue;
						}
						if (yValue > yMax) {
							yMax = yValue;
						}
					});

					let yStep = (yMax - yMin) / 4;

					//let yAxisTicks = uiUtils.getAxisTicks(yMin, yMax);

					let yTickDistance = plotHeight / 4;

					for (let i = 0; i < 5; i++) {
						let tickYPos = this.topMargin + i * yTickDistance;
						let adjTickYPos = Math.floor(tickYPos);
						ctx.moveTo(this.leftMargin - bump * 2, adjTickYPos);
						ctx.lineTo(this.leftMargin - bump, adjTickYPos);
						ctx.stroke();

						ctx.font = "24px Arial";
						ctx.textAlign = "right";
						ctx.fillStyle = "#000000";

						let yTickText = this.utils.Formatters.floatFormatter(
							yMin + i * yStep
						);

						yTickText = yTickText == "-" ? 0 : yTickText;

						ctx.fillText(
							yTickText,
							this.leftMargin - bump * 3,
							this.topMargin + plotHeight + 10 - i * yTickDistance
						);
					}

					ctx.stroke();

					//Render y axis label
					ctx.font = "28px Arial";
					ctx.textAlign = "center";
					ctx.fillStyle = "#000000";
					ctx.rotate(-(Math.PI * 2) / 4);
					ctx.fillText(
						this.renderConfig["y axis label"],
						-(this.topMargin + plotHeight / 2),
						this.leftMargin - this.leftMargin / 2 - 28
					);

					let dnaLength = 0;

					//get list of chrs with variants
					let chrs = Object.keys(dValue.sorted).filter(
						(key) => dValue.sorted[key].length > 0
					);

					// compare length of chromosomes in the data to the defalt

					chrs.map((chr) => {
						let chrLength = 0;
						dValue.sorted[chr].map((v) => {
							chrLength =
								v.locus > chrLength ? v.locus : chrLength;
						});

						this.chromosomeLength[chr] =
							chrLength > this.chromosomeLength[chr]
								? chrLength
								: this.chromosomeLength[chr];
					});

					chrs.map((chr) => {
						dnaLength += this.chromosomeLength[chr];
					});

					let chrByPixel = plotWidth / dnaLength;

					let xStart = this.leftMargin;
					ctx.textAlign = "center";
					ctx.rotate((Math.PI * 2) / 4);

					chrs.map((chr) => {
						let chrLength = this.chromosomeLength[chr] * chrByPixel;
						xStart += chrLength;
						let chrPos = xStart - chrLength / 2;

						ctx.fillText(
							chr,
							chrPos,
							this.topMargin + plotHeight + yBump + 28 + bump
						);
					});

					//Render x axis label

					ctx.fillText(
						this.renderConfig["x axis label"],
						plotWidth / 2 + this.leftMargin,
						this.topMargin + plotHeight + yBump + 88
					);

					//Render Dots

					xStart = 0;
					let exChr = "";
					let chrNum = 1;

					chrs.map((chr) => {
						dValue.sorted[chr].map((g) => {
							let xPos =
								(xStart + g.locus) * chrByPixel +
								this.leftMargin;

							let yPosByPixel = plotHeight / (yMax - yMin);

							let yPos =
								this.topMargin +
								plotHeight -
								(g[this.renderConfig["y axis field"]] - yMin) *
									yPosByPixel;

							let dotColor =
								this.chromosomeColors[
									chrNum % this.chromosomeColors.length
								];

							ctx.fillStyle = dotColor + "75";

							ctx.lineWidth = 0;
							ctx.beginPath();
							ctx.arc(xPos, yPos, 8, 0, 2 * Math.PI);
							ctx.fill();

							let xLoc = Math.round(
								xPos.toString().split(".")[0] / 2
							);
							let yLoc = Math.round(
								yPos.toString().split(".")[0] / 2
							);

							let hoverContent;

							if (!!this.renderConfig["hover content"]) {
								hoverContent =
									this.renderConfig["hover content"];
							}

							if (!this.dotPosData[dKey]) {
								this.dotPosData[dKey] = {};
							}

							if (!this.dotPosData[dKey][xLoc]) {
								this.dotPosData[dKey][xLoc] = {};
							}
							this.dotPosData[dKey][xLoc][yLoc] = {};
							this.dotPosData[dKey][xLoc][yLoc][
								this.renderConfig["render by"]
							] = g[this.renderConfig["render by"]];
							if (!!this.renderConfig["hover content"]) {
								hoverContent.map((h) => {
									this.dotPosData[dKey][xLoc][yLoc][h] = g[h];
								});
							}
						});

						xStart += this.chromosomeLength[chr];

						chrNum++;
					});
				}
			}
		},
	},
});

$(function () {});
</script>

<style>
.manhattan-plot.hover {
	cursor: pointer;
}
.gene-on-clicked-dot-mplot,
.content-on-clicked-dot {
	display: block !important;
}

.clicked-dot-value {
	position: absolute;
    background-color: #fff;
    border: solid 1px #aaa;
    box-shadow: 0 0 5px #00000075;
    font-size: 12px;
    max-width: 300px;
    border-radius: 5px;
    z-index: 10;
    width: auto;
	padding: 8px 20px 8px 10px !important;
}

.clicked-dot-value-close {
	position: absolute;
	top: 0;
	right: 3px;
	font-size: 14px;
	color: #69f;
}

.clicked-dot-value-close:hover {
	color: #36c;
}

.dot-value-full-list {
	position: fixed;
	width: 400px;
	height: 300px;
	left: calc(50% - 200px);
	top: calc(50% - 150px);
	padding: 20px 0px 3px 15px;
	border-radius: 5px;
	border: solid 1px #ddd;
	background-color: #fff;
	z-index: 100;
}

.dot-value-full-list-content {
	width: 100%;
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
	font-size: 14px;
}
</style>



