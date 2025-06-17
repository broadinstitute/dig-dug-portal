<template>
	<div class="volcano-plot-content">
		<div :id="'clicked_dot_value'+ sectionId" class="clicked-dot-value hidden"></div>

		<canvas
			v-if="!!renderConfig"
			:id="'volcanoPlot'+ sectionId"
			class="volcano-plot"
			@mouseleave="hidePanel"
			@mousemove="checkPosition"
			@click="filterTable"
			:width="renderConfig.width * 2 + 240"
			:height="renderConfig.height * 2 + 240"
			:style="
				'width:' +
				(renderConfig.width + 120) +
				'px;height:' +
				(renderConfig.height + 120) +
				'px;'
			"
		>
		</canvas>
		<div class="download-images-setting">
			<span class="btn btn-default options-gear" >Download <b-icon icon="download"></b-icon></span>
			<ul class="options" >
				<li>
					<a href="javascript:;"
					@click="downloadImage('vector_wrapper_' + sectionId, sectionId + '_volcanoPlot', 'svg')">Download SVG</a>
				</li>
				<li>
					<a href="javascript:;"
					@click="downloadImage('volcanoPlot' + sectionId, sectionId + '_volcanoPlot', 'png')">Download PNG</a>
				</li>
			</ul>
		</div>
		<research-volcano-plot-vector
		v-if="!!renderData"
			:renderData="renderData"
			:renderConfig="renderConfig"
			:margin="adjPlotMargin"
			:sectionId="sectionId"
			:utils="utils"
			:ref="sectionId + '_volcanoPlot'"
		>
		</research-volcano-plot-vector>
		<div
			v-if="!!renderConfig.label"
			class="volcano-plot-label"
			v-html="renderConfig.label"
		></div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";
import { evaluate } from 'mathjs';
import volcanoPlotVector from "@/components/researchPortal/vectorPlots/ResearchVolcanoPlotVector.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-volcano-plot", {
	props: ["plotData", "renderConfig", "geneOfInterest","utils","sectionId","colors"],
	data() {
		return { posData: {} };
	},
	modules: {
	},
	components: {
		volcanoPlotVector,
	},
	mounted: function () {
		this.renderPlot();
	},
	computed: {
		adjPlotMargin() {

			let customPlotMargin = !!this.renderConfig["plot margin"] ? this.renderConfig["plot margin"] : null;

			let plotMargin = !!customPlotMargin ? {
				left: customPlotMargin.left,
				right: customPlotMargin.right,
				top: customPlotMargin.top,
				bottom: customPlotMargin.bottom,
				bump: !!customPlotMargin.bump ? customPlotMargin.bump : 5,
			} :
				{
					left: 80,
					right: 20,
					top: 20,
					bottom: 60,
					bump: 5
				};

			return plotMargin;
		},
		renderingGene() {
			return this.geneOfInterest;
		},
		renderData() {
			let rawData = this.plotData;
			let massagedData = [];

			rawData.map((r) => {
				let tempObj = {};
				tempObj[this.renderConfig["render by"]] = r[this.renderConfig["render by"]];
				tempObj[this.renderConfig["x axis field"]] = r[this.renderConfig["x axis field"]];
				tempObj[this.renderConfig["y axis field"]] = r[this.renderConfig["y axis field"]];
					this.renderConfig["on hover"]?.forEach(item => {
						tempObj[item] = r[item];
					})

				massagedData.push(tempObj);
			});

			return massagedData;
		},
	},
	watch: {
		renderData() {
			this.clearPlot();
			this.renderPlot();
		},
		renderingGene() {
			this.clearPlot();
			this.renderPlot();
		},
	},
	methods: {
		downloadImage(ID, NAME, TYPE) {
			if (TYPE == 'svg') {
				this.$refs[this.sectionId + '_volcanoPlot'].renderPlot();
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE, "vector_volcano_plot_" + this.sectionId);
			} else if (TYPE == 'png') {
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE)
			}
		},
		hidePanel() {
			this.utils.uiUtils.hideElement("clicked_dot_value"+this.sectionId);
			//this.renderPlot();
		},
		filterTable() {
			let wrapper = document.getElementById("clicked_dot_value" + this.sectionId);

			if (wrapper.innerText != "") {
				let items = wrapper.innerText.split("\n");
				const filterEl = document.getElementById(
					"filter_" + this.renderConfig["render by"].replace(/ /g, "")
				)
				if(filterEl) filterEl.value = items.join(", ");
			}
		},
		checkPosition(event) {
			let wrapper = document.getElementById("clicked_dot_value" + this.sectionId);
			wrapper.classList.remove("hidden");

			let e = event;
			var rect = document
				.getElementById("volcanoPlot" + this.sectionId)
				.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);

			//console.log(x, y);
			let canvas = document.getElementById("volcanoPlot" + this.sectionId);

			wrapper.style.top = y + canvas.offsetTop + "px";
			wrapper.style.left = x + canvas.offsetLeft + 15 + "px";

			let clickedDotValue = "";
			let redDotsArr = [];

			for (let h = -3; h <= 3; h++) {
				if (!!this.posData[x + h]) {
					for (let v = -3; v <= 3; v++) {
						if (!!this.posData[x + h][y + v]) {
							let tempObj = {};
							tempObj["x"] = x + h;
							tempObj["y"] = y + v;

							redDotsArr.push(tempObj);

							this.posData[x + h][y + v].map((g, i) => {
								clickedDotValue +=
									`<span class="gene-on-clicked-dot-volcano">
									${(this.renderConfig["on hover"] ? '<b>'+this.renderConfig["on hover"][i]+':</b> ' : '')}
									${g}
									</span><br>`;
							});

							//add horizontal lines between data groups if "on hover" param exists
							clickedDotValue += this.renderConfig["on hover"] ? '<hr>' : '';
						}
					}
				}
			}

			if (clickedDotValue != "") {
				wrapper.innerHTML = clickedDotValue;
				document.getElementById("volcanoPlot" + this.sectionId).classList.add("hover");
				//this.renderPlot(redDotsArr);
			} else {
				wrapper.innerHTML = clickedDotValue;
				wrapper.classList.add("hidden");
				document
					.getElementById("volcanoPlot" + this.sectionId)
					.classList.remove("hover");
			}
		},
		clearPlot() {
			var c = document.getElementById("volcanoPlot" + this.sectionId);
			var ctx = c.getContext("2d");
			ctx.clearRect(
				0,
				0,
				this.renderConfig.width * 2 + 240,
				this.renderConfig.height * 2 + 240
			);
		},
		renderPlot(REDDOTS) {
			
// Dynamically add thresholds
			let calculateCondition = function(EXP,LENGTH) {
				let calcString = "";

				EXP.map(e => {
					let eValue = !!["+", "-", "*", "/", "(", ")"].includes(e) ? e :
						(typeof e === 'number') ? e :
							(typeof e === 'string') ? (e == "data length") ? LENGTH : e : null;

					calcString += eValue;
				});

				console.log("calcString",calcString);

				//let threshold = eval(calcString);
				let threshold = evaluate(calcString);
				return threshold;
			}

			let conditions = [["x condition","lower than"], ["x condition", "greater than"],
								["y condition", "lower than"], ["y condition", "greater than"]]

			conditions.map(condition =>{
				if(this.renderConfig[condition[0]][condition[1]] && this.renderConfig[condition[0]][condition[1]] == "calculate") {
					let expression = this.renderConfig[condition[0]]["condition calculate"][condition[1]];
					this.renderConfig[condition[0]][condition[1]] = calculateCondition(expression, this.renderData.length)
				}
			})			

			let xAxisData = [];
			let yAxisData = [];
			let expData = [];

			let canvasWidth = this.renderConfig.width * 2;
			let canvasHeight = this.renderConfig.height * 2;
			let leftMargin = 74.5 * 2; // -0.5 to draw crisp line. adding space to the right incase dots go over the border
			let topMargin = 44.5 * 2; // -0.5 to draw crisp line

			let xBump = canvasWidth * 0.04;
			let yBump = canvasHeight * 0.04;

			var c = document.getElementById("volcanoPlot" + this.sectionId);
			var ctx = c.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth + 240, canvasHeight + 240);

			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#000000";
			ctx.setLineDash([]);

			this.renderData.map((d) => {
				xAxisData.push(d[this.renderConfig["x axis field"]]);
				yAxisData.push(d[this.renderConfig["y axis field"]]);
				if(this.renderConfig["dot scale"]){
					expData.push(d[this.renderConfig["dot scale"]]);
				}
			});

			let dotSizeMin = 8;
			let dotSizeMax = 16;
			let dotScaleMin = 8;
			let dotScaleMax = 16;

			if(this.renderConfig["dot scale"]){
				dotScaleMin = Math.min.apply(Math, expData);
				dotScaleMax = Math.max.apply(Math, expData);
			}

			let xMin = Math.min.apply(Math, xAxisData);
			let xMax = Math.max.apply(Math, xAxisData);

			let yMin = Math.min.apply(Math, yAxisData);
			let yMax = Math.max.apply(Math, yAxisData);

			const xAbsMax = Math.abs(xMin) > Math.abs(xMax) ? Math.abs(xMin) : Math.abs(xMax);

			//original
			let xAxisTicks = this.utils.uiUtils.getAxisTicks(xMin, xMax);
			let yAxisTicks = this.utils.uiUtils.getAxisTicks(yMin, yMax);

			//todo: add config param for making x-axis values symmetrical
			//check getAxisTicks to make the ticks nice
			//new
			//let xAxisTicks = this.utils.uiUtils.getAxisTicks(-xAbsMax, xAbsMax);
			//let yAxisTicks = this.utils.uiUtils.getAxisTicks(yMin, yMax);



			ctx.moveTo(leftMargin, canvasHeight + topMargin + yBump);
			ctx.lineTo(
				canvasWidth + leftMargin + xBump,
				canvasHeight + topMargin + yBump
			);
			ctx.stroke();

			let xTickDistance = canvasWidth / 5;
			for (let i = 0; i < 6; i++) {
				ctx.moveTo(
					leftMargin + i * xTickDistance + xBump,
					topMargin + canvasHeight + yBump
				);
				ctx.lineTo(
					leftMargin + i * xTickDistance + xBump,
					canvasHeight + topMargin + 10 + yBump
				);
				ctx.stroke();

				ctx.font = "24px Arial";
				ctx.textAlign = "center";
				ctx.fillStyle = "#000000";

				if (xAxisTicks.lo + i * xAxisTicks.step == 0) {
					ctx.fillText(
						0,
						leftMargin + i * xTickDistance + xBump,
						topMargin + canvasHeight + 34 + yBump
					);
				} else {
					ctx.fillText(
						this.utils.Formatters.floatFormatter(
							xAxisTicks.lo + i * xAxisTicks.step
						),
						leftMargin + i * xTickDistance + xBump,
						topMargin + canvasHeight + 34 + yBump
					);
				}
			}
			//Render x axis label
			ctx.font = "28px Arial";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000000";
			ctx.fillText(
				this.renderConfig["x axis label"],
				leftMargin + canvasWidth / 2,
				topMargin + canvasHeight + 70 + yBump
			);

			// render y axis
			ctx.moveTo(leftMargin, topMargin);
			ctx.lineTo(leftMargin, canvasHeight + topMargin + yBump);
			ctx.stroke();
			let yTickDistance = canvasHeight / 5;
			for (let i = 0; i < 6; i++) {
				ctx.moveTo(leftMargin - 5, topMargin + i * yTickDistance);
				ctx.lineTo(leftMargin, topMargin + i * yTickDistance);
				ctx.stroke();

				ctx.font = "24px Arial";
				ctx.textAlign = "right";
				ctx.fillStyle = "#000000";

				if (yAxisTicks.lo + yAxisTicks.step * i == 0) {
					ctx.fillText(
						0,
						leftMargin - 14,
						topMargin + (5 - i) * yTickDistance + 3
					);
				} else {
					ctx.fillText(
						this.utils.Formatters.floatFormatter(
							yAxisTicks.lo + yAxisTicks.step * i
						),
						leftMargin - 14,
						topMargin + (5 - i) * yTickDistance + 3
					);
				}
			}

			//Render y axis label
			ctx.font = "28px Arial";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000000";
			ctx.rotate(-(90 * Math.PI) / 180);
			ctx.fillText(
				this.renderConfig["y axis label"],
				-(topMargin + canvasHeight / 2),
				leftMargin - 110
			);

			//render dots

			ctx.rotate((90 * Math.PI) / 180);
			let xPosMax = xAxisTicks.lo + xAxisTicks.step * 5;
			let yPosMax = yAxisTicks.lo + yAxisTicks.step * 5;

			let xCondition = this.renderConfig["x condition"];

			this.renderData.map((d, dIndex) => {
				//rendering position
				let xPos =
					leftMargin +
					xBump +
					canvasWidth *
						((d[this.renderConfig["x axis field"]] -
							xAxisTicks.lo) /
							(xPosMax - xAxisTicks.lo));
				let yPos =
					topMargin +
					canvasHeight -
					canvasHeight *
						((d[this.renderConfig["y axis field"]] -
							yAxisTicks.lo) /
							(yPosMax - yAxisTicks.lo));

				///Feed posData

				if (!this.posData[Math.round(xPos / 2)]) {
					this.posData[Math.round(xPos / 2)] = {};
				}

				//clear previous data so no duplicates
				this.posData[Math.round(xPos / 2)][Math.round(yPos / 2)] = [];
				
				if(this.renderConfig["on hover"]){
					this.renderConfig["on hover"].forEach(item => {
						this.posData[Math.round(xPos / 2)][Math.round(yPos / 2)].push(
							d[item]
						);
					});
				}else{
					this.posData[Math.round(xPos / 2)][Math.round(yPos / 2)].push(
						d[this.renderConfig["render by"]]
					);
				}

				let fillScore = 0;

				if (!!this.renderConfig["x condition"]) {
					let xCondiCombi =
						this.renderConfig["x condition"].combination;
					let xFieldVal = d[this.renderConfig["x axis field"]];

					if (
						xCondiCombi == "greater than" &&
						xFieldVal >
							this.renderConfig["x condition"]["greater than"]
					) {
						fillScore++;
					}
					if (
						xCondiCombi == "lower than" &&
						xFieldVal <
							this.renderConfig["x condition"]["lower than"]
					) {
						fillScore++;
					}
					if (
						xCondiCombi == "and" &&
						xFieldVal >
							this.renderConfig["x condition"]["greater than"] &&
						xFieldVal <
							this.renderConfig["x condition"]["lower than"]
					) {
						fillScore++;
					}
					if (
						(xCondiCombi == "or" &&
							xFieldVal >
								this.renderConfig["x condition"][
									"greater than"
								]) ||
						xFieldVal <
							this.renderConfig["x condition"]["lower than"]
					) {
						fillScore++;
					}
				}

				if (!!this.renderConfig["y condition"]) {
					let yCondiCombi =
						this.renderConfig["y condition"].combination;
					let yFieldVal = d[this.renderConfig["y axis field"]];

					if (
						yCondiCombi == "greater than" &&
						yFieldVal >
							this.renderConfig["y condition"]["greater than"]
					) {
						fillScore++;
					}
					if (
						yCondiCombi == "lower than" &&
						yFieldVal <
							this.renderConfig["y condition"]["lower than"]
					) {
						fillScore++;
					}
					if (
						yCondiCombi == "and" &&
						yFieldVal >
							this.renderConfig["y condition"]["greater than"] &&
						yFieldVal <
							this.renderConfig["y condition"]["lower than"]
					) {
						fillScore++;
					}
					if (
						(yCondiCombi == "or" &&
							yFieldVal >
								this.renderConfig["y condition"][
									"greater than"
								]) ||
						yFieldVal <
							this.renderConfig["y condition"]["lower than"]
					) {
						fillScore++;
					}
				}

				switch (fillScore) {
					case 0:
						ctx.fillStyle = "#00000050";
						break;
					case 1:
						ctx.fillStyle = "#09910980";
						break;
					case 2:
						ctx.fillStyle = "#ff003780";
						break;
				}

				//if renderConfig has "dot scale" param set
				//adjust size of dots relative to eachother	
				function normalize(value, minInput, maxInput, minOutput, maxOutput) {
					return ((value - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
				}
				const dotSize = this.renderConfig["dot scale"] ?
					normalize(d[this.renderConfig["dot scale"]], dotScaleMin, dotScaleMax, dotSizeMin, dotSizeMax) : 
					dotScaleMin;

				ctx.lineWidth = 0;
				ctx.beginPath();
				ctx.arc(xPos, yPos, dotSize, 0, 2 * Math.PI); //radius
				ctx.fill();

				//TODO: "dot label score" labels all dots
				//that meet pVal and FC values
				//but sometimes this is still too many labels to show at once
				//need a better method to labels only most extreme outliers
				if (
					(!!this.renderConfig["dot label score"] &&
					fillScore >= this.renderConfig["dot label score"]) 
					//&& dIndex < 10
				) {
					ctx.font = "24px Arial";
					ctx.textAlign = "center";
					ctx.fillStyle = "#000000";
					ctx.fillText(
						d[this.renderConfig["render by"]],
						xPos,
						yPos - 16
					);
				}
			});

			// reder hovering dots in red

			if (REDDOTS != undefined) {
				REDDOTS.map((dot) => {
					let redXPos = dot.x;
					let redYPos = dot.y;
					ctx.fillStyle = "#ff0000";
					ctx.lineWidth = 0;
					ctx.beginPath();
					ctx.arc(redXPos, redYPos, 8, 0, 2 * Math.PI);
					ctx.fill();
				});
			}

			//if selectedGene is not undefined
			if (this.geneOfInterest != undefined) {
				let targetGene = this.$parent.convert2RenderBy(
					this.geneOfInterest
				);

				this.renderData.map((d) => {
					if (
						d[this.renderConfig["render by"]].toLowerCase() ==
						targetGene.toLowerCase()
					) {
						let xPos =
							leftMargin +
							xBump +
							canvasWidth *
								((d[this.renderConfig["x axis field"]] -
									xAxisTicks.lo) /
									(xPosMax - xAxisTicks.lo));
						let yPos =
							topMargin +
							canvasHeight -
							canvasHeight *
								((d[this.renderConfig["y axis field"]] -
									yAxisTicks.lo) /
									(yPosMax - yAxisTicks.lo));

						ctx.fillStyle = "#ff0000";
						ctx.lineWidth = 0;

						ctx.beginPath();
						ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
						ctx.fill();

						ctx.font = "24px Arial";
						ctx.textAlign = "center";
						ctx.fillStyle = "#FF0000";
						ctx.fillText(
							d[this.renderConfig["render by"]],
							xPos,
							yPos - 12
						);
					}
				});
			}

			//render dashed line
			if (!!this.renderConfig["x condition"]) {
				let xCondiCombi = this.renderConfig["x condition"].combination;

				let xGTPos = null,
					xLTPos = null;

				if (
					xCondiCombi == "greater than" ||
					xCondiCombi == "or" ||
					xCondiCombi == "and"
				) {
					xGTPos =
						leftMargin +
						xBump +
						canvasWidth *
							((this.renderConfig["x condition"]["greater than"] -
								xAxisTicks.lo) /
								(xPosMax - xAxisTicks.lo));
				}

				if (
					xCondiCombi == "lower than" ||
					xCondiCombi == "or" ||
					xCondiCombi == "and"
				) {
					xLTPos =
						leftMargin +
						xBump +
						canvasWidth *
							((this.renderConfig["x condition"]["lower than"] -
								xAxisTicks.lo) /
								(xPosMax - xAxisTicks.lo));
				}

				if (xGTPos != null) {
					this.renderDash(
						xGTPos,
						xGTPos,
						topMargin,
						canvasHeight + topMargin + yBump,
						"#999999",
						1,
						[5, 5]
					);
				}

				if (xLTPos != null) {
					this.renderDash(
						xLTPos,
						xLTPos,
						topMargin,
						canvasHeight + topMargin + yBump,
						"#999999",
						1,
						[5, 5]
					);
				}
			}

			if (!!this.renderConfig["y condition"]) {
				let yCondiCombi = this.renderConfig["y condition"].combination;

				let yGTPos = null,
					yLTPos = null;

				if (
					yCondiCombi == "greater than" ||
					yCondiCombi == "or" ||
					yCondiCombi == "and"
				) {
					yGTPos =
						topMargin +
						canvasHeight -
						canvasHeight *
							((this.renderConfig["y condition"]["greater than"] -
								yAxisTicks.lo) /
								(yPosMax - yAxisTicks.lo));
				}

				if (
					yCondiCombi == "lower than" ||
					yCondiCombi == "or" ||
					yCondiCombi == "and"
				) {
					yLTPos =
						topMargin +
						canvasHeight -
						canvasHeight *
							((this.renderConfig["y condition"]["lower than"] -
								yAxisTicks.lo) /
								(yPosMax - yAxisTicks.lo));
				}

				if (yGTPos != null) {
					this.renderDash(
						leftMargin,
						leftMargin + canvasWidth + xBump,
						yGTPos,
						yGTPos,
						"#999999",
						1,
						[5, 5]
					);
				}

				if (yLTPos != null) {
					this.renderDash(
						leftMargin,
						leftMargin + canvasWidth + xBump,
						yLTPos,
						yLTPos,
						"#999999",
						1,
						[5, 5]
					);
				}
			}
		},
		renderDash(X1, X2, Y1, Y2, COLOR, WIDTH, DASH) {
			var d = document.getElementById("volcanoPlot" + this.sectionId);
			var dtx = d.getContext("2d");
			dtx.strokeStyle = COLOR;
			dtx.lineWidth = WIDTH;
			dtx.setLineDash(DASH);
			dtx.moveTo(X1, Y1);
			dtx.lineTo(X2, Y2);
			dtx.stroke();
		},
	},
});

$(function () {});
</script>
<style>
#volcanoPlot.hover, .volcano-plot:hover {
	cursor: pointer;
}

.clicked-dot-value {
	position: absolute;
    background-color: #fff;
    border: solid 1px #aaa;
    box-shadow: 0 0 5px #00000075;
    font-size: 14px;
    padding: 0px 10px 5px 10px;
    max-width: 300px;
    border-radius: 5px;
    z-index: 10;
    width: auto;
	padding: 8px 20px 8px 10px!important;
}

.gene-on-clicked-dot-volcano {
	display: block;
	float: left;
	padding: 0 5px;
	text-align: left;
}
</style>



