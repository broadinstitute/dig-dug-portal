<template>
	<div class="mbm-plot-content row">
		<div id="clicked_dot_value" class="clicked-dot-value hidden">
			<div id="clicked_dot_value_content"></div>
		</div>
		<div id="dot_value_full_list" class="dot-value-full-list hidden">
			<div
				class="clicked-dot-value-close"
				@click="hidePanel('dot_value_full_list')"
			>
				<b-icon icon="x-circle-fill"></b-icon>
			</div>
			<div id="dot_value_full_list_content"></div>
		</div>
		<div
			v-if="!!renderConfig.legend"
			class="mbm-plot-legend"
			v-html="renderConfig.legend"
		></div>
		<div class="col-md-12">
			<div class="score-plot-bubbles" v-if="dataComparisonConfig != null">
				<span
					class="plot-item-bubble reference"
					style="background-color: #00000030"
					>Avarage</span
				>
				<span
					v-for="(item, itemIndex) in searchParameters[
						dataComparisonConfig.fieldsGroupDataKey
					].search"
					v-html="item"
					:key="item"
					:class="'plot-item-bubble reference bg-color-' + itemIndex"
				></span>
			</div>
			<div class="plot-score-options-ui">
				<label v-if="dataComparisonConfig != null"
					>Render plot by:
					<select
						v-model="plotRenderBy"
						class="score-plot-render-by"
						@change="renderPlot()"
					>
						<option value="avarage">Avarage Score</option>
						<option value="high">Highest Score</option>
						<option value="all">All</option>
					</select>
				</label>
				<label v-if="renderConfig['recalculate score'] == true"
					>Score by:
					<div
						v-for="(option, opIndex) in renderConfig['score by']"
						:key="opIndex"
						class="plot-score-option"
					>
						<input
							type="checkbox"
							:id="'score_chkbox_' + opIndex"
							:name="'score_chkbox_' + opIndex"
							checked
							@click="calculateScore"
						/>
						<label
							:for="'score_chkbox_' + opIndex"
							v-html="option.field"
						></label>
					</div>
				</label>
			</div>
		</div>
		<div id="scorePlotWrapper" class="col-md-12">
			<canvas
				v-if="!!renderConfig"
				id="scorePlot"
				@mouseleave="hidePanel"
				@mousemove="checkPosition"
				@resize="onResize"
				@click="getFullList"
				width=""
				height=""
			>
			</canvas>
		</div>
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

Vue.use(BootstrapVueIcons);

export default Vue.component("research-score-plot", {
	props: [
		"region",
		"plotData",
		"renderConfig",
		"dataComparisonConfig",
		"searchParameters",
		"utils"
	],
	data() {
		return {
			plotRenderBy: "avarage",
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
			leftMargin: 150, // adding space to the right incase dots go over the border
			rightMargin: 1,
			topMargin: 20,
			bottomMargin: 100,
			dotPosData: {},
		};
	},
	modules: {
	},
	components: {},
	mounted: function () {
		this.renderPlot();
		window.addEventListener("resize", this.onResize);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		searchingRegion() {
			if (this.region == null) {
				return null;
			} else {
				let returnObj = {};
				let regionArr = this.region.split(":")[1].split("-");
				returnObj["start"] = regionArr[0];
				returnObj["end"] = regionArr[1];

				return returnObj;
			}
		},
		renderData() {
			//console.log(this.plotData);
			let rawData = this.plotData;
			let massagedData = { sorted: {}, unsorted: [] };

			for (const chr in this.chromosomeLength) {
				massagedData.sorted[chr] = [];
			}

			let renderConfig = this.renderConfig;

			let feedMassagedData = function (r) {
				let region = r[renderConfig["x axis field"]];

				if (region != undefined && region != "" && region != null) {
					let tempObj = {};
					tempObj[renderConfig["render by"]] =
						r[renderConfig["render by"]];

					if (!!renderConfig["hover content"]) {
						let hoverContent = renderConfig["hover content"];

						hoverContent.map((h) => {
							tempObj[h] = r[h];
						});
					}

					let locationArr =
						r[renderConfig["x axis field"]].split(":");

					let chr = locationArr[0].trim();

					let regionArr = locationArr[1].split("-");

					tempObj["locus"] =
						regionArr.length > 1
							? (Number(regionArr[0].trim()) +
									Number(regionArr[1].trim())) /
							  2
							: Number(regionArr[0].trim());

					tempObj[renderConfig["y axis field"]] =
						r[renderConfig["y axis field"]];

					massagedData.sorted[chr].push(tempObj);
					massagedData.unsorted.push(tempObj);
				}
			};

			if (!!this.dataComparisonConfig) {
				for (const [rKey, r] of Object.entries(rawData)) {
					feedMassagedData(r);
				}
			} else {
				rawData.map((r) => {
					feedMassagedData(r);
				});
			}

			return massagedData;
		},
	},
	watch: {
		renderData() {
			this.renderPlot();
		},
	},
	methods: {
		calculateScore() {
			let scoreColumns = function (row, scoreBy) {
				let fieldValue = 0;
				let fieldsLength = scoreBy.length;

				scoreBy.map((f) => {
					let scoreType = f.type;
					let fName = f.field;
					switch (scoreType) {
						case "boolean":
							let value2Score =
								f["value to score"][row[fName]] * f.weight;
							fieldValue += value2Score;
							break;
					}
				});

				return fieldValue / fieldsLength;
			};

			let countingFields = [];

			this.renderConfig["score by"].map((f, fIndex) => {
				if (document.getElementById("score_chkbox_" + fIndex).checked) {
					countingFields.push(f);
				}
			});

			let dataWithNewScore = this.plotData;
			this.plotData.map((d, dIndex) => {
				let score = scoreColumns(d, countingFields);
				dataWithNewScore[dIndex][
					this.renderConfig["score column table header"]
				] = score;
			});

			this.$store.dispatch("filteredData", dataWithNewScore);
		},
		hidePanel(element) {
			this.utils.uiUtils.hideElement(element);
		},
		onResize(e) {
			this.renderPlot();
		},
		getFullList(event) {
			let wrapper = document.getElementById("dot_value_full_list");
			let canvas = document.getElementById("scorePlot");
			wrapper.classList.remove("hidden");
			let e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);

			let clickedDotValue = "";

			for (let h = -5; h <= 5; h++) {
				for (let v = -5; v <= 5; v++) {
					if (this.dotPosData[x + h] != undefined) {
						if (this.dotPosData[x + h][y + v] != undefined) {
							let dotObject = this.dotPosData[x + h][y + v];
							clickedDotValue +=
								'<span class="gene-on-clicked-dot-mplot"><b>' +
								dotObject[this.renderConfig["render by"]] +
								"</b></span>";

							if (!!this.renderConfig["hover content"]) {
								let hoverContent =
									this.renderConfig["hover content"];

								hoverContent.map((hc) => {
									if (
										this.dataComparisonConfig != null &&
										this.dataComparisonConfig.fieldsToCompare.includes(
											hc
										)
									) {
										clickedDotValue +=
											'<span class="content-on-clicked-dot">' +
											hc +
											":</span>";

										for (const [
											hcKey,
											hcValue,
										] of Object.entries(dotObject[hc])) {
											clickedDotValue +=
												'<span class="content-on-clicked-dot">&nbsp;&nbsp;' +
												hcKey +
												": " +
												hcValue +
												"</span>";
										}
									} else {
										clickedDotValue +=
											'<span class="content-on-clicked-dot">' +
											hc +
											": " +
											dotObject[hc] +
											"</span>";
									}
								});
							}
						}
					}
				}
			}
			let contentWrapper = document.getElementById(
				"dot_value_full_list_content"
			);

			if (clickedDotValue != "") {
				contentWrapper.innerHTML = clickedDotValue;
				document.getElementById("scorePlot").classList.add("hover");
				document
					.getElementById("clicked_dot_value")
					.classList.add("hidden");
			} else {
				wrapper.classList.add("hidden");
				document.getElementById("scorePlot").classList.remove("hover");
			}
		},
		checkPosition(event) {
			let wrapper = document.getElementById("clicked_dot_value");
			let canvas = document.getElementById("scorePlot");
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
					if (this.dotPosData[x + h] != undefined) {
						if (this.dotPosData[x + h][y + v] != undefined) {
							if (numOfValues < 6) {
								let dotObject = this.dotPosData[x + h][y + v];
								clickedDotValue +=
									'<span class="gene-on-clicked-dot-mplot"><b>' +
									dotObject[this.renderConfig["render by"]] +
									"</b></span>";

								if (!!this.renderConfig["hover content"]) {
									let hoverContent =
										this.renderConfig["hover content"];

									hoverContent.map((hc) => {
										if (
											this.dataComparisonConfig != null &&
											this.dataComparisonConfig.fieldsToCompare.includes(
												hc
											)
										) {
											clickedDotValue +=
												'<span class="content-on-clicked-dot">' +
												hc +
												":</span>";

											for (const [
												hcKey,
												hcValue,
											] of Object.entries(
												dotObject[hc]
											)) {
												clickedDotValue +=
													'<span class="content-on-clicked-dot">&nbsp;&nbsp;' +
													hcKey +
													": " +
													hcValue +
													"</span>";
											}
										} else {
											clickedDotValue +=
												'<span class="content-on-clicked-dot">' +
												hc +
												": " +
												dotObject[hc] +
												"</span>";
										}
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
				"clicked_dot_value_content"
			);

			if (clickedDotValue != "") {
				contentWrapper.innerHTML = clickedDotValue;

				document.getElementById("scorePlot").classList.add("hover");
			} else {
				wrapper.classList.add("hidden");
				document.getElementById("scorePlot").classList.remove("hover");
			}
		},
		getColorIndex(SKEY) {
			//console.log(this.searchParameters);
			let keyField = this.dataComparisonConfig.fieldsGroupDataKey;
			let keyParameterSeach = this.searchParameters[keyField].search;
			let colorIndex = "";
			//if (keyParameterSeach.length > 1) {
			keyParameterSeach.map((sValue, sIndex) => {
				if (SKEY == sValue) {
					colorIndex = sIndex;
				}
			});
			//}

			return colorIndex;
		},
		renderPlot() {
			this.dotPosData = {};

			let wrapper = document.getElementById("clicked_dot_value");
			wrapper.classList.add("hidden");

			let canvasRenderWidth = !!this.renderConfig.width
				? this.renderConfig.width * 2 +
				  this.leftMargin +
				  this.rightMargin
				: document.getElementById("scorePlotWrapper").clientWidth * 2 -
				  60; //

			let canvasRenderHeight = !!this.renderConfig.height
				? this.renderConfig.height * 2 +
				  this.topMargin +
				  this.bottomMargin
				: 800;

			let xBump = canvasRenderWidth * 0.03;
			let yBump = canvasRenderHeight * 0.03;

			let plotWidth =
				canvasRenderWidth -
				(this.leftMargin + this.rightMargin + xBump);
			let plotRenderWidth = plotWidth - 10;
			let plotHeight =
				canvasRenderHeight -
				(this.topMargin + yBump + this.bottomMargin);

			let c = document.getElementById("scorePlot");
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
			ctx.moveTo(this.leftMargin, this.topMargin);
			ctx.lineTo(this.leftMargin, plotHeight + this.topMargin + yBump);

			//render x axis
			ctx.moveTo(this.leftMargin, plotHeight + this.topMargin + yBump);
			ctx.lineTo(
				plotWidth + this.leftMargin,
				plotHeight + this.topMargin + yBump
			);

			// render y ticker
			let yMin = null;
			let yMax = null;

			this.renderData.unsorted.map((d) => {
				if (
					!!this.dataComparisonConfig &&
					this.dataComparisonConfig.fieldsToCompare.includes(
						this.renderConfig["y axis field"]
					) == true
				) {
					for (const [key, value] of Object.entries(
						d[this.renderConfig["y axis field"]]
					)) {
						let yValue = value;

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
					}
				} else {
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
				}
			});

			let yStep = (yMax - yMin) / 4;

			let yTickDistance = plotHeight / 4;
			for (let i = 0; i < 5; i++) {
				let tickYPos = this.topMargin + i * yTickDistance;
				let adjTickYPos = Math.floor(tickYPos);
				ctx.moveTo(this.leftMargin - 10, adjTickYPos);
				ctx.lineTo(this.leftMargin, adjTickYPos);
				ctx.stroke();

				ctx.font = "24px Arial";
				ctx.textAlign = "right";
				ctx.fillStyle = "#000000";

				let yTickText = this.utils.Formatters.floatFormatter(yMin + i * yStep);

				yTickText = yTickText == "-" ? 0 : yTickText;

				ctx.fillText(
					yTickText,
					this.leftMargin - 20,
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

			ctx.rotate((Math.PI * 2) / 4);
			let dnaLength = 0;

			//get list of chrs with variants
			let chrs = Object.keys(this.renderData.sorted).filter(
				(key) => this.renderData.sorted[key].length > 0
			);

			// compare length of chromosomes in the data to the defalt
			let chrLengthMax = 0;
			let chrLengthMin = 0;

			if (chrs.length == 1) {
				let chr = chrs[0];

				if (this.searchingRegion != null) {
					chrLengthMin = Number(this.searchingRegion.start);
					chrLengthMax = Number(this.searchingRegion.end);
				} else {
					this.renderData.sorted[chr].map((v) => {
						if (chrLengthMin == 0) {
							chrLengthMin = v.locus;
						}
						if (chrLengthMax == 0) {
							chrLengthMax = v.locus;
						}
						if (v.locus < chrLengthMin) {
							chrLengthMin = v.locus;
						}
						if (v.locus > chrLengthMax) {
							chrLengthMax = v.locus;
						}
					});
				}

				this.chromosomeLength[chr] = chrLengthMax;

				dnaLength = chrLengthMax - chrLengthMin;

				let xStep = Math.ceil((chrLengthMax - chrLengthMin) / 4);

				// X ticks
				let xTickDistance = (plotWidth - 10) / 4;

				//console.log("xTickDistance", xTickDistance);

				for (let i = 0; i < 5; i++) {
					let tickXPos = this.leftMargin + i * xTickDistance + 10;
					let adjTickXPos = Math.floor(tickXPos);
					ctx.moveTo(
						adjTickXPos,
						this.topMargin + plotHeight + yBump
					);
					ctx.lineTo(
						adjTickXPos,
						this.topMargin + plotHeight + yBump + 10
					);
					ctx.stroke();

					ctx.font = "24px Arial";
					ctx.textAlign = "center";
					ctx.fillStyle = "#000000";

					let posNum =
						i < 4 ? chrLengthMin + i * xStep : chrLengthMax;
					ctx.fillText(
						posNum,
						adjTickXPos,
						this.topMargin + plotHeight + yBump + 30
					);
				}
			} else {
				chrs.map((chr) => {
					let chrLength = 0;
					this.renderData.sorted[chr].map((v) => {
						chrLength = v.locus > chrLength ? v.locus : chrLength;
					});

					this.chromosomeLength[chr] =
						chrLength > this.chromosomeLength[chr]
							? chrLength
							: this.chromosomeLength[chr];
				});

				chrs.map((chr) => {
					dnaLength += this.chromosomeLength[chr];
				});
			}

			let chrByPixel = plotRenderWidth / dnaLength;

			let xStart = this.leftMargin + 10;
			ctx.textAlign = "center";
			if (chrs.length > 1) {
				/*ctx.fillText(
                    chrLengthMin,
                    this.leftMargin + 5,
                    this.topMargin + plotHeight + yBump + 20
                );

                ctx.fillText(
                    chrLengthMax,
                    plotWidth + this.leftMargin,
                    this.topMargin + plotHeight + yBump + 20
                );
            } else {*/
				chrs.map((chr) => {
					let chrLength = this.chromosomeLength[chr] * chrByPixel;
					xStart += chrLength;
					let chrPos = xStart - chrLength / 2;

					ctx.fillText(
						chr,
						chrPos,
						this.topMargin + plotHeight + yBump + 28
					);
				});
			}

			//Render x axis label

			ctx.fillText(
				this.renderConfig["x axis label"],
				plotWidth / 2 + this.leftMargin,
				this.topMargin + plotHeight + yBump + 88
			);

			//Render Dots
			if (chrs.length == 1) {
				xStart = chrLengthMin;
				let chr = chrs[0];
				this.renderData.sorted[chr].map((g) => {
					let xPos =
						(g.locus - xStart) * chrByPixel + this.leftMargin + 10;

					let yPosByPixel = plotHeight / (yMax - yMin);

					if (
						!!this.dataComparisonConfig &&
						this.dataComparisonConfig.fieldsToCompare.includes(
							this.renderConfig["y axis field"]
						) == true
					) {
						let yField = g[this.renderConfig["y axis field"]];
						let yPos,
							xLoc,
							yLoc,
							colorKey,
							dotColor,
							yFieldValue,
							yFieldKey,
							entries,
							yFieldValues;

						switch (this.plotRenderBy) {
							case "avarage":
								entries = 0;
								yFieldValues = 0;
								yFieldKey = "";
								for (const [yKey, yValue] of Object.entries(
									yField
								)) {
									entries++;
									yFieldValues += yValue;
									yFieldKey = yKey;
								}

								yFieldValue = yFieldValues / entries;

								yPos =
									this.topMargin +
									plotHeight -
									(yFieldValue - yMin) * yPosByPixel;

								colorKey = this.getColorIndex(yFieldKey);

								dotColor =
									entries == 1
										? this.compareGroupColors[colorKey]
										: "#00000030";

								ctx.fillStyle = dotColor;

								ctx.lineWidth = 0;
								ctx.beginPath();
								ctx.arc(xPos, yPos, 8, 0, 2 * Math.PI);
								ctx.fill();

								xLoc = Math.round(
									xPos.toString().split(".")[0] / 2
								);
								yLoc = Math.round(
									yPos.toString().split(".")[0] / 2
								);

								this.add2HoverContent(xLoc, yLoc, g);
								break;
							case "high":
								yFieldValue = 0;
								yFieldKey = "";
								entries = 0;
								for (const [yKey, yValue] of Object.entries(
									yField
								)) {
									yFieldKey =
										entries == 0
											? yKey
											: yValue > yFieldValue
											? yKey
											: yFieldKey;

									yFieldValue =
										entries == 0
											? yValue
											: yValue > yFieldValue
											? yValue
											: yFieldValue;

									entries++;
								}

								yPos =
									this.topMargin +
									plotHeight -
									(yFieldValue - yMin) * yPosByPixel;

								colorKey = this.getColorIndex(yFieldKey);

								dotColor = this.compareGroupColors[colorKey];

								ctx.fillStyle = dotColor;

								ctx.lineWidth = 0;
								ctx.beginPath();
								ctx.arc(xPos, yPos, 8, 0, 2 * Math.PI);
								ctx.fill();

								xLoc = Math.round(
									xPos.toString().split(".")[0] / 2
								);
								yLoc = Math.round(
									yPos.toString().split(".")[0] / 2
								);

								this.add2HoverContent(xLoc, yLoc, g);
								break;
							case "all":
								let yPosArr = [];
								for (const [yKey, yValue] of Object.entries(
									yField
								)) {
									yPos =
										this.topMargin +
										plotHeight -
										(yValue - yMin) * yPosByPixel;

									yPosArr.push(yPos);

									colorKey = this.getColorIndex(yKey);

									dotColor =
										this.compareGroupColors[colorKey];

									ctx.fillStyle = dotColor;

									ctx.lineWidth = 0;
									ctx.beginPath();
									ctx.arc(xPos, yPos, 8, 0, 2 * Math.PI);
									ctx.fill();

									xLoc = Math.round(
										xPos.toString().split(".")[0] / 2
									);
									yLoc = Math.round(
										yPos.toString().split(".")[0] / 2
									);

									this.add2HoverContent(xLoc, yLoc, g);
								}

								if (yPosArr.length > 1) {
									yPosArr.sort(function (a, b) {
										return a - b;
									});

									ctx.beginPath();
									ctx.lineWidth = 1;
									ctx.strokeStyle = "#00000030";
									ctx.moveTo(xPos, yPosArr[0]);
									ctx.lineTo(
										xPos,
										yPosArr[yPosArr.length - 1]
									);
									ctx.stroke();
								}
								break;
						}
					} else {
						let yPos =
							this.topMargin +
							plotHeight -
							(g[this.renderConfig["y axis field"]] - yMin) *
								yPosByPixel;

						let dotColor =
							this.chromosomeColors[
								chr % this.chromosomeColors.length
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

						this.add2HoverContent(xLoc, yLoc, g);
					}
				});
			} else {
				xStart = 0;
				let exChr = "";
				let chrNum = 1;

				chrs.map((chr) => {
					this.renderData.sorted[chr].map((g) => {
						let xPos =
							(xStart + g.locus) * chrByPixel +
							this.leftMargin +
							10;

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
						this.add2HoverContent(xLoc, yLoc, g);
					});

					xStart += this.chromosomeLength[chr];
					chrNum++;
				});
			}
		},
		add2HoverContent(xLoc, yLoc, g) {
			let hoverContent;

			if (!!this.renderConfig["hover content"]) {
				hoverContent = this.renderConfig["hover content"];
			}

			if (!this.dotPosData[xLoc]) {
				this.dotPosData[xLoc] = {};
			}
			this.dotPosData[xLoc][yLoc] = {};
			this.dotPosData[xLoc][yLoc][this.renderConfig["render by"]] =
				g[this.renderConfig["render by"]];
			if (!!this.renderConfig["hover content"]) {
				hoverContent.map((h) => {
					this.dotPosData[xLoc][yLoc][h] = g[h];
				});
			}
		},
	},
});

$(function () {});
</script>

<style>
.score-plot-bubbles {
	float: left;
	font-size: 12px;
	padding-top: 10px;
}

.plot-item-bubble {
	margin-left: 3px;
	margin-right: 3px;
	padding: 2px 8px;
	border-radius: 8px;
}
.score-plot-ui-wrapper {
	text-align: left;
	font-size: 12px;
	float: left;
}

.score-plot-render-by {
	font-size: 12px;
	padding: 4px 10px;
	border-radius: 15px;
	border: solid 1px #aaa;
	background-color: #fff;
	display: inline-block;
	margin-right: 10px;
}

.score-plot-render-by:hover {
	cursor: pointer;
	background-color: #eee;
}

.plot-score-options-ui {
	font-size: 12px;
	text-align: right;
	padding-right: 20px;
}

.plot-score-options-ui > label {
	margin-bottom: 0 !important;
}

.plot-score-option {
	display: inline-block;
	margin-right: 10px;
	vertical-align: top;
}

.plot-score-option input[type="checkbox"] {
	margin-right: 5px;
}

.plot-score-option label {
	vertical-align: middle;
}

#manhattanPlot.hover {
	cursor: pointer;
}
.gene-on-clicked-dot-mplot,
.content-on-clicked-dot {
	display: block !important;
}

#clicked_dot_value {
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

#dot_value_full_list_content {
	width: 100%;
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
	font-size: 14px;
}
</style>



