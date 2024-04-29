<template>
	<div class="row">
		<div class="m-plot-content col-md-6" :id="'mPlotWrapper'+ sectionId">
			<div :id="'m_clicked_dot_value' + sectionId" class="m-clicked-dot-value hidden">
				<div :id="'m_clicked_dot_value_content' + sectionId"></div>
			</div>
			<div
				:id="'m_dot_value_full_list' + sectionId"
				class="m-dot-value-full-list hidden"
			>
				<div
					class="m-clicked-dot-value-close"
					@click="hidePanel('m_dot_value_full_list'+ sectionId)"
				>
					<b-icon icon="x-circle-fill"></b-icon>
				</div>
				<div :id="'m_dot_value_full_list_content' + sectionId"></div>
			</div>
			<div
				v-if="!!renderConfig.legend"
				class="m-plot-legend"
				v-html="renderConfig.legend"
			></div>
			<div v-for="item in plotsList" :key="item">
				<h4 v-if="item != 'default'">{{ item }}</h4>

				<canvas
					v-if="!!renderConfig"
					:id="'mPlot' + sectionId + item"
					@mouseleave="hidePanel"
					@mousemove="checkPosition($event, item, 'm')"
					@resize="onResize"
					@click="getFullList($event, item, 'm')"
					width=""
					height=""
				>
				</canvas>
				<div class="download-images-setting">
					<span class="btn btn-default options-gear" >Download <b-icon icon="download"></b-icon></span>
					<ul class="options" >
						<li>
							<a href="javascript:;"
							@click="downloadImage('vector_wrapper_' + sectionId, sectionId + '_mPlot', 'svg', 'vector_m_plot_' + sectionId, item)">Download SVG</a>
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
				class="m-plot-label"
				v-html="renderConfig.label"
			></div>
		</div>
		<div class="qq-plot-content col-md-6" :id="'qqPlotWrapper' + sectionId">
			<div :id="'qq_clicked_dot_value' + sectionId" class="qq-clicked-dot-value hidden">
				<div :id="'qq_clicked_dot_value_content' + sectionId"></div>
			</div>
			<div
				:id="'qq_dot_value_full_list' + sectionId"
				class="qq-dot-value-full-list hidden"
			>
				<div
					class="qq-clicked-dot-value-close"
					@click="hidePanel('qq_dot_value_full_list' + sectionId)"
				>
					<b-icon icon="x-circle-fill"></b-icon>
				</div>
				<div :id="'qq_dot_value_full_list_content' + sectionId"></div>
			</div>
			<div
				v-if="!!renderConfig.legend"
				class="qq-plot-legend"
				v-html="renderConfig.legend"
			></div>
			<div v-for="item in plotsList" :key="item">
				<h4 v-if="item != 'default'">{{ item }}</h4>

				<canvas
					v-if="!!renderConfig"
					:id="'qqPlot' + sectionId + item"
					@mouseleave="hidePanel"
					@mousemove="checkPosition($event, item, 'qq')"
					@resize="onResize"
					@click="getFullList($event, item, 'qq')"
					width=""
					height=""
				>
				</canvas>
			</div>
			<div
				v-if="!!renderConfig.label"
				class="qq-plot-label"
				v-html="renderConfig.label"
			></div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";
import ResearchMPlotBitmapVector from "@/components/researchPortal/vectorPlots/ResearchMPlotBitmapVector.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-m-qq-plot", {
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
			leftMargin: 150,
			rightMargin: 1,
			topMargin: 20,
			bottomMargin: 100,
			mDotPosData: {},
			qqDotPosData: {},
			compareGroups: null,
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
		plotsList() {
			let rawData = this.plotData;
			let compareGroups = [];
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
			let lambdaValue = !!this.plotData[0].lambda
				? this.plotData[0].lambda
				: null;

			//console.log("lambdaValue", lambdaValue);

			plotsList.map((c) => {
				let tempObj = { lambda: lambdaValue, sorted: {}, unsorted: [] };
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

			//console.log("massagedData", massagedData);

			return massagedData;
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
				this.$refs[refName].renderMPlot(DATA);
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
		getFullList(event, ID, PLOT) {
			let wrapper = document.getElementById(
				PLOT + "_dot_value_full_list" + this.sectionId
			);
			let canvas = document.getElementById(PLOT + "Plot" + this.sectionId + ID);
			wrapper.classList.remove("hidden");
			let e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);
			/*wrapper.style.top = y + canvas.offsetTop + "px";
            wrapper.style.left = x + canvas.offsetLeft + 15 + "px";*/

			let clickedDotValue = "";

			for (let h = -5; h <= 5; h++) {
				for (let v = -5; v <= 5; v++) {
					if (this[PLOT + "DotPosData"][ID][x + h] != undefined) {
						if (
							this[PLOT + "DotPosData"][ID][x + h][y + v] !=
							undefined
						) {
							let dotObject =
								this[PLOT + "DotPosData"][ID][x + h][y + v];
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
										dotObject[h] +
										"</span>";
								});
							}
						}
					}
				}
			}
			let contentWrapper = document.getElementById(
				PLOT + "_dot_value_full_list_content" + this.sectionId
			);

			if (clickedDotValue != "") {
				contentWrapper.innerHTML = clickedDotValue;
				document
					.getElementById(PLOT + "Plot" + this.sectionId + ID)
					.classList.add("hover");
				document
					.getElementById(PLOT + "_clicked_dot_value" + this.sectionId)
					.classList.add("hidden");
			} else {
				wrapper.classList.add("hidden");
				document
					.getElementById(PLOT + "Plot" + this.sectionId + ID)
					.classList.remove("hover");
			}
		},
		checkPosition(event, ID, PLOT) {
			let wrapper = document.getElementById(PLOT + "_clicked_dot_value" + this.sectionId);
			let canvas = document.getElementById(PLOT + "Plot" + this.sectionId + ID);
			wrapper.classList.remove("hidden");
			let e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);
			wrapper.style.top = y + canvas.offsetTop + "px";
			wrapper.style.left = x + canvas.offsetLeft + 15 + "px";

			let clickedDotValue = "";

			let numOfValues = 0;

			for (let h = -5; h <= 5; h++) {
				for (let v = -5; v <= 5; v++) {
					if (this[PLOT + "DotPosData"][ID][x + h] != undefined) {
						if (
							this[PLOT + "DotPosData"][ID][x + h][y + v] !=
							undefined
						) {
							if (numOfValues < 6) {
								let dotObject =
									this[PLOT + "DotPosData"][ID][x + h][y + v];
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
											dotObject[h] +
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
				PLOT + "_clicked_dot_value_content" + this.sectionId
			);

			if (clickedDotValue != "") {
				contentWrapper.innerHTML = clickedDotValue;

				document
					.getElementById(PLOT + "Plot" + this.sectionId + ID)
					.classList.add("hover");
			} else {
				wrapper.classList.add("hidden");
				document
					.getElementById(PLOT + "Plot" + this.sectionId + ID)
					.classList.remove("hover");
			}
		},
		renderPlot(DATA) {
			this.renderMPlot(DATA);
			this.renderQQPlot(DATA);
		},
		renderQQPlot(DATA) {
			this.qqDotPosData = {};

			let wrapper = document.getElementById("qq_clicked_dot_value" + this.sectionId);
			wrapper.classList.add("hidden");

			//mPlotWrapper

			let canvasWrapper = document.getElementById("qqPlotWrapper" + this.sectionId);

			let canvasRenderWidth = !!this.renderConfig.width
				? this.renderConfig.width * 2 +
				  this.leftMargin +
				  this.rightMargin
				: canvasWrapper.clientWidth * 2 - 60;

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
				//console.log("renderData", dKey, dValue);

				let c = document.getElementById("qqPlot" + this.sectionId + dKey);

				if (!!c) {
					c.setAttribute("width", canvasRenderWidth);
					c.setAttribute("height", canvasRenderHeight);
					c.setAttribute(
						"style",
						"margin-left: -15px; width:" +
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

					let vTotal = 0;

					let qqData = this.utils.sortUtils.sortArrOfObjects(
						dValue.unsorted,
						this.renderConfig["y axis field"],
						"number",
						"desc"
					);

					//console.log("DATA.lambda", dValue.lambda);

					if (!!dValue.lambda) {
						ctx.font = "26px Arial";
						ctx.textAlign = "end";
						ctx.fillText(
							"lambda(0.95): " + dValue.lambda.toFixed(4),
							plotWidth + this.leftMargin + bump,
							plotHeight + this.topMargin + yBump
						);
					}

					qqData.map((d) => {
						let yValue = d[this.renderConfig["y axis field"]];

						vTotal += yValue;

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

					let yTickDistance = plotHeight / 4;

					for (let i = 0; i < 5; i++) {
						let tickYPos = this.topMargin + i * yTickDistance;
						let adjTickYPos = Math.floor(tickYPos);
						ctx.moveTo(this.leftMargin - bump * 2, adjTickYPos);
						ctx.lineTo(this.leftMargin - bump, adjTickYPos);
						ctx.stroke();

						ctx.font = "22px Arial";
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
					ctx.font = "24px Arial";
					ctx.textAlign = "center";
					ctx.fillStyle = "#000000";
					ctx.rotate(-(Math.PI * 2) / 4);
					ctx.fillText(
						this.renderConfig["qq-plot y axis label"],
						-(this.topMargin + plotHeight / 2),
						this.leftMargin - this.leftMargin / 2 - 28
					);

					//render xAxis

					let segByPixel = plotWidth / 8;

					let xStart = this.leftMargin;
					ctx.textAlign = "center";
					ctx.rotate((Math.PI * 2) / 4);

					for (let i = 0; i < 9; i++) {
						let segPos = xStart + segByPixel * i;

						ctx.fillText(
							i,
							segPos,
							this.topMargin + plotHeight + yBump + 28 + bump
						);
					}

					ctx.fillText(
						this.renderConfig["qq-plot x axis label"],
						plotWidth / 2 + this.leftMargin,
						this.topMargin + plotHeight + yBump + 88
					);

					//Render Dots

					//let plotData = dValue.unsorted;
					let expected = [];
					for (let i = 1; i <= qqData.length; i++) {
						expected.push(Math.log10(i + 1 / qqData.length));
					}

					let maxExpPxLoc =
						plotWidth *
						((expected[expected.length - 1] - expected[0]) / 8);

					let yPosByPixel = plotHeight / (yMax - yMin);
					let xPosByPixel =
						maxExpPxLoc /
						(expected[expected.length - 1] - expected[0]);

					/// render expected p-value line to 8;
					ctx.beginPath();
					ctx.strokeStyle = "#ff0000";
					ctx.moveTo(this.leftMargin, this.topMargin + plotHeight);
					ctx.lineTo(
						this.leftMargin + plotWidth,
						this.topMargin + plotHeight - 8 * yPosByPixel
					);

					ctx.stroke();

					qqData.map((g, gIndex) => {
						let dPValue =
							g[this.renderConfig["y axis field"]] - yMin;
						let yPos =
							this.topMargin + plotHeight - dPValue * yPosByPixel;

						let xPos =
							this.leftMargin +
							maxExpPxLoc -
							(expected[gIndex] * xPosByPixel +
								expected[0] * xPosByPixel);

						let dotColor = "#0066FF";

						ctx.fillStyle = dotColor;

						ctx.lineWidth = 0;
						ctx.beginPath();
						ctx.arc(xPos, yPos, 4, 0, 2 * Math.PI);
						ctx.fill();

						let xLoc = Math.round(
							xPos.toString().split(".")[0] / 2
						);
						let yLoc = Math.round(
							yPos.toString().split(".")[0] / 2
						);

						let hoverContent;

						if (!!this.renderConfig["hover content"]) {
							hoverContent = this.renderConfig["hover content"];
						}

						if (!this.qqDotPosData[dKey]) {
							this.qqDotPosData[dKey] = {};
						}

						if (!this.qqDotPosData[dKey][xLoc]) {
							this.qqDotPosData[dKey][xLoc] = {};
						}
						this.qqDotPosData[dKey][xLoc][yLoc] = {};
						this.qqDotPosData[dKey][xLoc][yLoc][
							this.renderConfig["render by"]
						] = g[this.renderConfig["render by"]];
						if (!!this.renderConfig["hover content"]) {
							hoverContent.map((h) => {
								this.qqDotPosData[dKey][xLoc][yLoc][h] = g[h];
							});
						}
					});
				}
			}
		},
		renderMPlot(DATA) {
			this.mDotPosData = {};

			let wrapper = document.getElementById("m_clicked_dot_value" + this.sectionId);
			wrapper.classList.add("hidden");

			//mPlotWrapper

			let canvasWrapper = document.getElementById("mPlotWrapper" + this.sectionId);

			let canvasRenderWidth = !!this.renderConfig.width
				? this.renderConfig.width * 2 +
				  this.leftMargin +
				  this.rightMargin
				: canvasWrapper.clientWidth * 2 - 60;

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
				//console.log("renderData", dKey, dValue);
				let c = document.getElementById("mPlot" + this.sectionId + dKey);
				if (!!c) {
					c.setAttribute("width", canvasRenderWidth);
					c.setAttribute("height", canvasRenderHeight);
					c.setAttribute(
						"style",
						"margin-left: -15px; width:" +
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

					//let yAxisTicks = this.utils.uiUtils.getAxisTicks(yMin, yMax);

					let yTickDistance = plotHeight / 4;

					for (let i = 0; i < 5; i++) {
						let tickYPos = this.topMargin + i * yTickDistance;
						let adjTickYPos = Math.floor(tickYPos);
						ctx.moveTo(this.leftMargin - bump * 2, adjTickYPos);
						ctx.lineTo(this.leftMargin - bump, adjTickYPos);
						ctx.stroke();

						ctx.font = "22px Arial";
						ctx.textAlign = "right";
						ctx.fillStyle = "#000000";

						let yTickText = this.utils.Formatters.floatFormatter(
							yMin + i * yStep
						);

						yTickText = yTickText == "-" ? 0 : yTickText;

						ctx.fillText(
							yTickText,
							this.leftMargin - bump * 3,
							this.topMargin + plotHeight + 5 - i * yTickDistance
						);
					}

					ctx.stroke();

					//Render y axis label
					ctx.font = "24px Arial";
					ctx.textAlign = "center";
					ctx.fillStyle = "#000000";
					ctx.rotate(-(Math.PI * 2) / 4);
					ctx.fillText(
						this.renderConfig["m-plot y axis label"],
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
						this.renderConfig["m-plot x axis label"],
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
							ctx.arc(xPos, yPos, 6, 0, 2 * Math.PI);
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

							if (!this.mDotPosData[dKey]) {
								this.mDotPosData[dKey] = {};
							}

							if (!this.mDotPosData[dKey][xLoc]) {
								this.mDotPosData[dKey][xLoc] = {};
							}
							this.mDotPosData[dKey][xLoc][yLoc] = {};
							this.mDotPosData[dKey][xLoc][yLoc][
								this.renderConfig["render by"]
							] = g[this.renderConfig["render by"]];
							if (!!this.renderConfig["hover content"]) {
								hoverContent.map((h) => {
									this.mDotPosData[dKey][xLoc][yLoc][h] =
										g[h];
								});
							}
						});

						xStart += this.chromosomeLength[chr];

						chrNum++;
					});

					/// render guide line
					if (!!this.renderConfig["m-plot thresholds"]) {
						this.renderConfig["m-plot thresholds"].map((t) => {
							let tValue = -Math.log10(Number(t));

							//console.log("thresholds", t, tValue);

							let yPosByPixel = plotHeight / (yMax - yMin);

							let guidelineYpos =
								this.topMargin +
								plotHeight -
								(tValue - yMin) * yPosByPixel;

							ctx.beginPath();

							ctx.setLineDash([10, 5]);
							ctx.lineWidth = 2;
							ctx.moveTo(this.leftMargin - yBump, guidelineYpos);
							ctx.lineTo(
								canvasRenderWidth + yBump - this.rightMargin,
								guidelineYpos
							);
							ctx.strokeStyle = "#FFAA00";
							ctx.stroke();

							ctx.closePath();
						});
					}
				}
			}
		},
	},
});

$(function () {});
</script>

<style>
#manhattanPlot.hover,
#qqPlot.hover,.manhattan-plot:hover, .qq-plot:hover {
	cursor: pointer;
}
.gene-on-clicked-dot-mplot,
.m-content-on-clicked-dot,
.qq-content-on-clicked-dot {
	display: block !important;
}

#m_clicked_dot_value,
#qq_clicked_dot_value,
.m-clicked-dot-value,
.qq-clicked-dot-value {
	padding: 8px 20px 8px 10px !important;
	position: absolute;
	background-color: #fff;
	border: solid 1px #aaa;
	box-shadow: 0 0 5px #00000075;
	font-size: 12px;
	padding: 0px 10px 5px 10px;
	max-width: 300px;
	border-radius: 5px;
	z-index: 10;
	width: auto;
	white-space: nowrap;
}

.m-clicked-dot-value-close,
.qq-clicked-dot-value-close {
	position: absolute;
	top: 0;
	right: 3px;
	font-size: 14px;
	color: #69f;
}

.m-clicked-dot-value-close:hover,
.qq-clicked-dot-value-close:hover {
	color: #36c;
}

.m-dot-value-full-list,
.qq-dot-value-full-list {
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

#m_dot_value_full_list_content,
#qq_dot_value_full_list_content,
.m-dot-value-full-list-content,
.qq-dot-value-full-list-content {
	width: 100%;
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
	font-size: 14px;
}
</style>



