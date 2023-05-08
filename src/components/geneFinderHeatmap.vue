
<template>
	<div class="heatmap-wrapper">
		<div id="clicked_cell_value" class="clicked-cell-value hidden">
			<div id="clicked_cell_value_content"></div>
		</div>
		<div class="heatmap-content" id="heatmapContent">
			<div class="heatmap-scale-legend" id="heatmap_scale_legend"></div>
			<div class="heatmap-canvas-wrapper" id="heatmapPlotWrapper">
				<div
					v-if="!!displayColumns && displayColumns.length > 0"
					class="heatmap-columns-wrapper"
					id="heatmapColumnsWrapper"
					:style="'font-size: ' + fontSize + 'px'"
				>
					<template v-for="column in displayColumns">
						<div :style="'height: ' + boxSize + 'px'">
							<a
								:href="'#' + column"
								@click="setCurrentGene(column)"
								>{{ column }}</a
							>
						</div>
					</template>
				</div>
				<!--<div
					class="heatmap-columns-wrapper"
					id="heatmapColumnsWrapper"
				></div>-->
				<div class="heatmap-rows-wrapper" id="heatmapRowsWrapper"></div>
				<div class="heatmap-canvas-wrapper" id="heatmapCanvasWrapper">
					<canvas
						id="heatmap"
						@mouseleave="hidePanel"
						@mousemove="checkPosition"
						width=""
						height=""
					>
					</canvas>
				</div>
			</div>
			<div class="heatmap-label" v-html=""></div>
		</div>
		<pre></pre>
		<b-pagination
			class="pagination-sm justify-content-center"
			v-model="plotCurrentPage"
			:total-rows="renderData.columns.length"
			:per-page="boxesPerPage"
			size="sm"
		></b-pagination>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import sortUtils from "@/utils/sortUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("gene-finder-heatmap", {
	props: [
		"heatmapData",
		"phenotypes",
		"minMaxTPM",
		"eglsMap",
		"pThreshold",
		"currentPage",
	],
	data() {
		return {
			squareData: {},
			canvasHover: false,
			fontSize: 14,
			plotCurrentPage: 1,
			boxesPerPage: 0,
		};
	},
	modules: {
		uiUtils,
		Formatters,
	},
	mounted: function () {
		this.renderHeatmap();
		this.renderScaleLegend();
	},
	beforeDestroy() {},
	computed: {
		renderData() {
			let dataInOrder = sortUtils.sortArrOfObjects(
				this.heatmapData,
				"chiSquared",
				"number",
				"asc"
			);

			let massagedData = { columns: [], rows: {}, data: {} };
			let phenotypes = this.phenotypes;
			let tissues = [];
			let egls = [];

			dataInOrder.map((d) => {
				if (d.chiSquared < 0.05) {
					massagedData.columns.push(d.gene);
					massagedData.data[d.gene] = {};

					phenotypes.map((p) => {
						massagedData.data[d.gene][p + ":pValue"] =
							d[p + ":pValue"];
						massagedData.data[d.gene][p + ":huge"] = !d[p + ":huge"]
							? 0
							: d[p + ":huge"];
					});
					if (!!d.tissuesArr && d.tissuesArr.length > 0) {
						d.tissuesArr.map((t) => {
							massagedData.data[d.gene][t.tissue] = t.meanTpm;
							if (!tissues.includes(t.tissue)) {
								tissues.push(t.tissue);
							}
						});
					}

					if (!!d.eglsArr && d.eglsArr.length > 0) {
						d.eglsArr.map((e) => {
							massagedData.data[d.gene][e.shortName] = e.eglId;

							if (!egls.includes(e.shortName)) {
								egls.push(e.shortName);
							}
						});
					}

					massagedData.rows["phenotypes"] = phenotypes;
					massagedData.rows["tissues"] =
						tissues.length > 0 ? tissues : null;
					massagedData.rows["egls"] = egls.length > 0 ? egls : null;
				}
			});

			return massagedData;
		},

		displayColumns() {
			let returnList = [];
			let boxesPerPage = this.boxesPerPage;
			let startIndex = this.plotCurrentPage * boxesPerPage - boxesPerPage;
			let endIndex = this.plotCurrentPage * boxesPerPage - 1;
			for (let i = startIndex; i <= endIndex; i++) {
				if (!!this.renderData.columns[i]) {
					returnList.push(this.renderData.columns[i]);
				}
			}

			//let displayData = this.renderData;

			//displayData.columns = returnList;

			/*

			let startIndex = this.plotCurrentPage * cLimit - cLimit;
			let endIndex = this.plotCurrentPage * cLimit - 1;

			endIndex =
				endIndex >= renderData.columns.length
					? renderData.columns.length - 1
					: endIndex;
					
			*/

			return returnList;
		},

		boxSize() {
			return this.fontSize * 1.5;
		},
	},
	watch: {
		renderData() {
			this.renderHeatmap();
			this.renderScaleLegend();
		},
		plotCurrentPage(newPage, oldPage) {
			this.renderHeatmap();
			if (newPage != this.currentPage) {
				this.$store.dispatch("currentPage", newPage);
			}
		},
		pThreshold() {
			this.renderHeatmap();
			this.renderScaleLegend();
		},
		currentPage(newPage, oldPage) {
			this.plotCurrentPage = newPage;
		},
	},
	methods: {
		...uiUtils,

		setCurrentGene(COLUMN) {
			console.log("got here");
			this.$store.dispatch("currentGene", COLUMN);
		},

		hidePanel() {
			uiUtils.hideElement("clicked_cell_value");
			this.renderHeatmap();
		},
		renderScaleLegend() {
			let scaleLegendWrapper = document.getElementById(
				"heatmap_scale_legend"
			);

			let renderData = this.renderData;
			let scaleLegendContent = "";

			if (renderData.columns.length > 0) {
				if (
					renderData.rows.phenotypes &&
					renderData.rows.phenotypes.length > 0
				) {
					scaleLegendContent +=
						"<div class='col-md-12' style='font-size: 16px; white-space: nowrap'><strong>Matching genes:</strong>" +
						renderData.columns.length +
						"</div>";

					if (this.pThreshold.length > 0) {
						scaleLegendContent +=
							'<div\
						class="col-md-12"\
						style="font-size: 14px; white-space: nowrap"\
					><strong>P-Value:</strong>';

						let dotMaxR = this.boxSize * 0.75;
						let spanScale;
						let steps = this.pThreshold;

						steps.map((s, sindex) => {
							spanScale =
								dotMaxR *
								((steps.length - sindex) / steps.length);
							scaleLegendContent +=
								"<div class='sub-legend-steps'> <= ";

							scaleLegendContent +=
								s +
								": <span style = 'display: inline-block; background-color: #00000075; width:" +
								spanScale +
								"px; height:" +
								spanScale +
								"px; border-radius:" +
								spanScale / 2 +
								"px;'></span></div>";
						});

						scaleLegendContent += "</div>";
					}

					scaleLegendContent +=
						'<div\
						class="col-md-12"\
						style="font-size: 14px; white-space: nowrap"\
					>\
						<strong>HuGE Score:</strong> <span class="compelling">Compelling</span>\
						&gt;= 350 |\
						<span class="extreme">Extreme</span> &gt;=100 |\
						<span class="very-strong">Very Strong</span>: &gt;=30 |\
						<span class="strong">Strong</span>: &gt;=10 |\
						<span class="moderate">Moderate</span>: &gt;=3 |<span\
							class="anecdotal"\
						>\
							Anecdotal</span\
						>: &gt;1 | <span class="no-evidence">No Evidence</span>:\
						&lt;=1\
					</div>';
				}

				if (
					renderData.rows.tissues &&
					renderData.rows.tissues.length > 0
				) {
					scaleLegendContent +=
						'<div class="col-md-12"\
						style="font-size: 14px; white-space: nowrap"><strong>Tissue gene expression mean TPM: </strong>Min(' +
						this.minMaxTPM.min +
						") <span style='color:#70bfff;font-stretch: ultra-expanded;'>&#9664;</span> Max(" +
						this.minMaxTPM.max +
						")</div>";
				}

				if (renderData.rows.egls && renderData.rows.egls.length > 0) {
					/*scaleLegendContent +=
						"<div>Predicted effector genes:</div>";*/
				}
			}

			scaleLegendWrapper.innerHTML = scaleLegendContent;
		},
		checkPosition(event) {
			let e = event;
			let rect = e.target.getBoundingClientRect();

			let xPos = Math.floor(e.clientX - rect.left);
			let yPos = Math.floor(e.clientY - rect.top);
			let x = Math.floor((e.clientX - rect.left) / this.boxSize);
			let y = Math.floor((e.clientY - rect.top) / this.boxSize);

			let clickedCellValue = "";
			if (
				x >= 0 &&
				y >= 0 &&
				!!this.squareData[x] &&
				!!this.squareData[x][y]
			) {
				clickedCellValue += this.squareData[x][y];
			}

			let wrapper = document.getElementById("clicked_cell_value");
			let contentWrapper = document.getElementById(
				"clicked_cell_value_content"
			);

			let wrapperRect = document
				.getElementById("heatmapCanvasWrapper")
				.getBoundingClientRect();
			let wrapperXPos = wrapperRect.left;
			let wrapperYPos =
				document.getElementById("heatmapContent").offsetHeight -
				document.getElementById("heatmapPlotWrapper").offsetHeight +
				document.getElementById("heatmapColumnsWrapper").offsetWidth;

			if (clickedCellValue != "") {
				contentWrapper.innerHTML = clickedCellValue;
				wrapper.classList.remove("hidden");
				wrapper.style.top = wrapperYPos + yPos + "px";
				wrapper.style.left = wrapperXPos - 30 + xPos + "px"; //minus 15 for the padding of the plot wrapper
			} else {
				wrapper.classList.add("hidden");
			}
			this.renderHeatmap(x, y);
		},
		renderHeatmap(X, Y) {
			this.squareData = {};

			let rowsArr = [];
			let renderData = this.renderData;

			renderData.rows.phenotypes.map((p) => {
				rowsArr.push({ type: "phenotype", value: p });
			});

			if (!!renderData.rows.tissues) {
				renderData.rows.tissues.map((t) => {
					rowsArr.push({ type: "tissue", value: t });
				});
			}

			if (!!renderData.rows.egls) {
				renderData.rows.egls.map((e) => {
					rowsArr.push({ type: "egl", value: e });
				});
			}

			//document.getElementById("heatmapColumnsWrapper").innerHTML = "";
			document.getElementById("heatmapRowsWrapper").innerHTML = "";

			rowsArr.map((r) => {
				let div = document.createElement("div");
				let a = document.createElement("a");
				let t = document.createTextNode(r.value);
				div.appendChild(a);
				a.appendChild(t);

				if (r.type == "phenotype") {
					a.setAttribute(
						"href",
						"/phenotype.html?phenotype=" + r.value
					);
				}
				if (r.type == "egl") {
					let egl;
					for (const [eKey, eValue] of Object.entries(this.eglsMap)) {
						if (eValue.short_name == r.value) {
							egl = eValue;
						}
					}

					a.setAttribute(
						"href",
						"/research.html?pageid=" + egl["Page ID"]
					);
				}

				div.setAttribute("style", "height: " + this.boxSize + "px;");
				document.getElementById("heatmapRowsWrapper").appendChild(div);
			});

			let cLimit = Math.round(
				(document.getElementById("heatmapContent").offsetWidth - 300) /
					(this.fontSize * 1.5)
			);

			cLimit =
				cLimit < renderData.columns.length
					? cLimit
					: renderData.columns.length;

			this.boxesPerPage = cLimit;
			this.$store.dispatch("perPage", cLimit);

			/*document.getElementById("heatmapColumnsWrapper").style.fontSize =
				this.fontSize + "px";*/
			document.getElementById("heatmapRowsWrapper").style.fontSize =
				this.fontSize + "px";

			let cIndex = 0;

			let startIndex = this.plotCurrentPage * cLimit - cLimit;
			let endIndex = this.plotCurrentPage * cLimit - 1;

			endIndex =
				endIndex >= renderData.columns.length
					? renderData.columns.length - 1
					: endIndex;

			let canvasWidth =
				this.fontSize * 1.5 * (endIndex + 1 - startIndex) * 2;

			let canvasHeight = this.boxSize * rowsArr.length * 2;

			/*renderData.columns.map((c) => {
				//this.displayColumns = [];
				if (cIndex >= startIndex && cIndex <= endIndex) {
					//this.displayColumns.push(c);
					let div = document.createElement("div");
					let a = document.createElement("a");
					let t = document.createTextNode(c);
					a.appendChild(t);
					div.appendChild(a);
					//a.setAttribute("href", "/gene.html?gene=" + c);
					a.setAttribute("href", "#" + c);
					div.setAttribute(
						"style",
						"height: " + this.boxSize + "px;"
					);
					document
						.getElementById("heatmapColumnsWrapper")
						.appendChild(div);
				}
				cIndex++;
			});*/

			/*let columnTopSpace =
				document.getElementById("heatmapColumnsWrapper").offsetHeight -
				document.getElementById("heatmapColumnsWrapper").offsetWidth -
				10;*/
			let aboveColumnPadding = !!document.getElementById(
				"heatmapColumnsWrapper"
			)
				? document.getElementById("heatmapColumnsWrapper").offsetWidth +
				  20
				: 120;

			if (!!document.getElementById("heatmapColumnsWrapper")) {
				document.getElementById("heatmapColumnsWrapper").style.left =
					document.getElementById("heatmapRowsWrapper").offsetWidth +
					(this.boxSize - this.fontSize) / 2 +
					"px";
			}

			document.getElementById("heatmapPlotWrapper").style.paddingTop =
				aboveColumnPadding + "px";

			let c = document.getElementById("heatmap");
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
			let ctx = c.getContext("2d");

			let renderBoxSize = this.boxSize * 2;

			cIndex = 0;
			let leftPosIndex = 0;

			renderData.columns.map((c) => {
				if (cIndex >= startIndex && cIndex <= endIndex) {
					let geneData = renderData.data[c];
					this.squareData[leftPosIndex] = {};

					let rIndex = 0;
					rowsArr.map((r) => {
						let boxContent = "";
						let left = renderBoxSize * leftPosIndex;
						let top = renderBoxSize * rIndex;

						let rType = r.type;
						let rValue = r.value;
						let colorString =
							rType == "phenotype"
								? c[rValue + ":huge"] >= 350
									? "#4ebf59ff"
									: geneData[rValue + ":huge"] >= 100
									? "#4ebf59ff"
									: geneData[rValue + ":huge"] >= 30
									? "#4ebf598f"
									: geneData[rValue + ":huge"] >= 10
									? "#4ebf5966"
									: geneData[rValue + ":huge"] >= 3
									? "#4ebf5944"
									: geneData[rValue + ":huge"] >= 1
									? "#4ebf5922"
									: "#ffffff"
								: rType == "tissue"
								? "#70bfff"
								: "#007bff";

						if (X == cIndex && Y == rIndex) {
							ctx.beginPath();
							ctx.rect(left, top, renderBoxSize, renderBoxSize);
							ctx.fillStyle = "black";
							ctx.fill();

							ctx.beginPath();
							ctx.rect(
								left + 2,
								top + 2,
								renderBoxSize - 4,
								renderBoxSize - 4
							);
							ctx.fillStyle = "#ffffff";
							ctx.fill();
						}

						if (rType == "phenotype") {
							boxContent +=
								"<div>P-Value: " +
								geneData[rValue + ":pValue"] +
								"</div>";
							boxContent +=
								"<div>HuGE Score: " +
								geneData[rValue + ":huge"] +
								"</div>";

							ctx.beginPath();
							ctx.rect(left, top, renderBoxSize, renderBoxSize);
							ctx.fillStyle = colorString;
							ctx.fill();

							let steps = this.pThreshold;
							let subDirection = "negative";
							let dotMaxR = (renderBoxSize * 0.75) / 2;
							let centerPos = renderBoxSize / 2;

							let stepVal = 0;
							let subValue = geneData[rValue + ":pValue"];
							let dotR;

							let dotRUnit = dotMaxR / steps.length;

							for (let i = steps.length - 1; i >= 0; i--) {
								stepVal += subValue <= steps[i] ? 1 : 0;
							}
							//}
							dotR = dotRUnit * stepVal;

							ctx.fillStyle = "#00000075";
							ctx.lineWidth = 0;
							ctx.beginPath();
							ctx.arc(
								left + centerPos,
								top + centerPos,
								dotR,
								0,
								2 * Math.PI
							);
							ctx.fill();
						}

						if (rType == "tissue") {
							boxContent +=
								"<div>Mean TPM: " +
								Formatters.pValueFormatter(geneData[rValue]) +
								"</div>";
							let tpmPercent =
								(geneData[rValue] - this.minMaxTPM.min) /
								(this.minMaxTPM.max - this.minMaxTPM.min);

							let boxHeight = renderBoxSize * tpmPercent;
							boxHeight = boxHeight < 1 ? 1 : boxHeight;
							let newTop = top + renderBoxSize - boxHeight;

							ctx.beginPath();
							ctx.rect(left, newTop, renderBoxSize, boxHeight);
							ctx.fillStyle = colorString;
							ctx.fill();
						}

						if (rType == "egl") {
							if (!!this.eglsMap[geneData[rValue]]) {
								// this condition needed in case egl data gets loaded later than rendering
								boxContent +=
									"<div>" +
									this.eglsMap[geneData[rValue]]["Title"] +
									". " +
									this.eglsMap[geneData[rValue]]["Citation"] +
									"</div>";
							}
							if (!!geneData[rValue]) {
								let centerPos = renderBoxSize / 2;
								let dotR = renderBoxSize / 8;

								ctx.fillStyle = "#007bff";
								ctx.lineWidth = 0;
								ctx.beginPath();
								ctx.arc(
									left + centerPos,
									top + centerPos,
									dotR,
									0,
									2 * Math.PI
								);
								ctx.fill();
							}
						}

						this.squareData[leftPosIndex][rIndex] = boxContent;

						rIndex++;
					});
					leftPosIndex++;
				}
				cIndex++;
			});
		},
	},
});

$(function () {});
</script>

<style>
div.filtering-ui-wrapper .list-group {
	text-align: left;
	width: fit-content !important;
	white-space: nowrap !important;
}

.heatmap-content {
	text-align: center;
	overflow-x: auto;
}

.heatmap-wrapper {
	position: relative;
}

.heatmap-canvas-wrapper {
	text-align: left;
	display: inline-block;
	position: relative;
	white-space: nowrap;
	background-color: #fff;
}

#heatmapColumnsWrapper {
	transform-origin: left top;
	transform: rotate(-90deg);
	position: absolute;
	/*left: 0;*/
}
#heatmapColumnsWrapper div {
	/*transform-origin: left center;
    transform: rotate(45deg);*/
	white-space: nowrap;
	padding-left: 10px;
}
#heatmapRowsWrapper {
	padding-right: 10px;
	display: inline-block;
	vertical-align: top;
	white-space: nowrap;
	text-align: right;
}
#heatmapCanvasWrapper {
	display: inline-block;
	vertical-align: top;
}

#heatmapCanvasWrapper canvas {
	border: solid 1px #aaa;
}

#heatmap:hover {
	cursor: pointer;
}

#clicked_cell_value {
	text-align: left;
	padding: 8px 20px 8px 10px !important;
}
.field-on-clicked-cell,
.content-on-clicked-cell {
	display: block !important;
}

.clicked-cell-value-close {
	position: absolute;
	top: 2px;
	right: 2px;
	font-size: 12px;
	color: #69f;
}

.clicked-cell-value-close:hover {
	color: #36c;
}

.heatmap-label {
	font-size: 16px;
	font-weight: bold;
	text-align: center;
}

.heatmap-legend {
	font-size: 14px;
	text-align: left;
}

.heatmap-scale-legend {
	font-size: 14px;
	text-align: left;
}

.heatmap-scale-legend div {
	display: inline-block;
}
.heatmap-scale-legend div.scale-color {
	padding: 0 3px;
	font-size: 12px;
	border-left: solid 1px #fff;
}

.scale-legend-main-field .field-label,
.scale-legend-sub-field .field-label {
	font-weight: bold;
}

.scale-legend-main-colors {
	margin-right: 10px;
}

.sub-legend-steps {
	padding-left: 5px;
}
</style>



