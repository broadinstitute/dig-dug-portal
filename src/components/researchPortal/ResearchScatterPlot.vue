<template>
	<div class="scatter-plot-content row" id="rp_scatter_plot">
		
		<div :id="'scatter_dot_value' + sectionId" 
			class="scatter-dot-value" :class="!!isDotPanelClick? 'fixed-panel':''" 
			style="display:none"></div>
		<canvas
			v-if="renderData.length > 0 && !!renderConfig && !groupsList"
			:id="'scatterPlot' + sectionId"
			class="scatter-plot"
			:width="plotDimension.width"
			:height="plotDimension.height"
			:style="'width:' +
				(plotDimension.width / 2) +
				'px;height:' +
				(plotDimension.height / 2) +
				'px;'
				"
			@mousemove="checkPosition($event, '', 'move')"
			@click="checkPosition($event,'','click')"
		>
		</canvas>
		<template v-if="renderData.length > 0 && !!renderConfig && !!groupsList">
			<div class="colors-list">
				<div v-for="anno, annoIndex in colorsList" class="anno-bubble-wrapper">
					<span class="anno-bubble" :style="'background-color:'+ compareGroupColors[annoIndex]">&nbsp;</span>
					<span>{{ anno }}</span>
				</div>
			</div>
			<canvas
				v-for="group in groupsList"
				:key="group"
				:id="'scatterPlot' + sectionId + group"
				class="scatter-plot"
				:width="plotDimension.width"
				:height="plotDimension.height"
				:style="'width:' +
					(plotDimension.width/2) +
					'px;height:' +
					(plotDimension.height/2) +
					'px;'
					"
				@click="checkPosition($event,group,'click')"
				@mousemove="checkPosition($event, group, 'move')"
			>
			</canvas>
		</template>
		<div
			v-if="!!renderConfig.label"
			class="scatter-plot-label"
			v-html="renderConfig.label"
		></div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-scatter-plot", {
	props: [
		"plotData",
		"renderConfig",
		"searchParameters",
		"dataComparisonConfig",
		"plotMargin",
		"compareGroupColors",
		"isSectionPage",
		"sectionId",
		"utils"
	],
	data() {
		return {
			groupsList:null,
			colorsList:null,
			posData:{},
			isDotPanelClick: false,
		};
	},
	modules: {
	},
	components: {},
	mounted() {
		window.addEventListener("resize", this.onResize);
		this.renderPlot();
	},
	updated() {
		this.renderPlot();
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		plotDimension() {

			let dimension = {};
			dimension["height"] = (!!this.renderConfig.height)? this.renderConfig.height * 2:600;
			dimension["width"] = (!!this.renderConfig.width) ? this.renderConfig.width * 2 : 1000;

			let plotMargin = this.plotMargin;

			if(!!this.renderConfig["plot margin"]) {
				plotMargin.topMargin = this.renderConfig["plot margin"]["top"];
				plotMargin.bottomMargin = this.renderConfig["plot margin"]["bottom"];
				plotMargin.leftMargin = this.renderConfig["plot margin"]["left"];
				plotMargin.rightMargin = this.renderConfig["plot margin"]["right"];
				plotMargin.bump = this.renderConfig["plot margin"]["bump"];
			}

			plotMargin.topMargin = plotMargin.topMargin *2;
			plotMargin.bottomMargin = plotMargin.bottomMargin * 2;
			plotMargin.leftMargin = plotMargin.leftMargin * 2;
			plotMargin.rightMargin = plotMargin.rightMargin * 2;
			plotMargin.bump = plotMargin.bump * 2;

			dimension["plotMargin"] = plotMargin;

			dimension["height"] += (plotMargin.topMargin + plotMargin.bottomMargin);
			dimension["width"] += (plotMargin.leftMargin + plotMargin.rightMargin);

			return dimension
		},
		renderData() {
			let rawData = (!!this.dataComparisonConfig)? 
					this.utils.dataConvert.object2Array(this.plotData, this.dataComparisonConfig,this.dataComparisonConfig["key field"]) : 
					this.plotData;
			let massagedData = [];
			let groups = [];
			let colors = [];


			rawData.map((r) => {
				let tempObj = {};
				tempObj["key"] = r[this.renderConfig["render by"]];
				tempObj["x"] = r[this.renderConfig["x axis field"]];
				tempObj["y"] = r[this.renderConfig["y axis field"]];
				tempObj["hover"] = {}

				if (!!this.renderConfig["group by"]) {
					tempObj["group"] = r[this.renderConfig["group by"]];
					if(!groups.includes(tempObj["group"])) {
						groups.push(tempObj["group"]);
					}
				}

				if (!!this.renderConfig["color by"]) {
					tempObj["color"] = r[this.renderConfig["color by"]];
					if (!colors.includes(tempObj["color"])) {
						colors.push(tempObj["color"]);
					}
				}

				if(!!this.renderConfig["hover content"] && this.renderConfig["hover content"].length > 0) {
					this.renderConfig["hover content"].map(h =>{
						tempObj["hover"][h] = r[h];
					})
				}
				massagedData.push(tempObj);
			});

			this.groupsList = groups.length > 0? groups.sort(): null;
			this.colorsList = colors.length > 0? colors.sort() : null;

			return massagedData;
		}
	},
	watch: {
		renderData(DATA){
			
		},
		groupsList(LIST){
		}

	},
	methods: {
		
		clearPlot() {
			
		},
		renderIndividualPlot(DATA, ID, GROUP) {

			let xAxisData = [];
			let yAxisData = [];

			let canvasWidth = this.plotDimension.width;
			let canvasHeight = this.plotDimension.height;
			let leftMargin = this.plotDimension.plotMargin.leftMargin;
			let topMargin = this.plotDimension.plotMargin.topMargin;
			let rightMargin = this.plotDimension.plotMargin.rightMargin;
			let bottomMargin = this.plotDimension.plotMargin.bottomMargin;
			let bump = this.plotDimension.plotMargin.bump;

			let c = document.getElementById(ID);
			let ctx = c.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);

			DATA.map((d) => {
				xAxisData.push(d.x);
				yAxisData.push(d.y);
			});

			let xMin = Math.min.apply(Math, xAxisData);
			let xMax = Math.max.apply(Math, xAxisData);

			let yMin = Math.min.apply(Math, yAxisData);
			let yMax = Math.max.apply(Math, yAxisData);

			let MARGIN = {top: topMargin,bottom: bottomMargin,left: leftMargin,right: rightMargin,bump:bump }
			this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "x", 5, xMin, xMax, this.renderConfig["x axis label"]);
			this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "y", 5, yMin, yMax, this.renderConfig["y axis label"]);
			
			if(!!this.colorsList) {
				let cIndex = 0
				this.colorsList.map(color =>{
					let coloredData = DATA.filter(d=>d.color == color);
					let dotColor = this.compareGroupColors[cIndex];
					this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
					cIndex++;
				})
			} else {
				let dotColor = this.compareGroupColors[0];
				this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, DATA);
			}

			if (!!GROUP) {
				ctx.font = "26px Arial";
				ctx.fillStyle = "#000000";
				ctx.textAlign = "start";
				ctx.fillText(
					GROUP,
					bump,
					bump + 26
				);

				this.posData[GROUP] = this.utils.plotUtils.getDotsPosData(canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, DATA);
			} else {
				this.posData = this.utils.plotUtils.getDotsPosData(canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, DATA);
			}
		},
		renderPlot() {
			if(this.renderData.length > 0) {
				if (!!this.groupsList) {

					this.groupsList.map(group => {
						let data = this.renderData.filter(d => d.group == group);
						let id = 'scatterPlot' + this.sectionId + group;

						
						(!!document.getElementById(id))?this.renderIndividualPlot(data, id, group):'';
					})
				} else {
					this.renderIndividualPlot(this.renderData, 'scatterPlot' + this.sectionId);
				}
			}
			
		},
		onResize(e) {
			this.renderPlot()
		},
		checkPosition(e, GROUP, EVENT_TYPE) {

			

			let data = (!!GROUP) ? this.posData[GROUP] : this.posData;
			let wrapper = document.querySelector('#scatter_dot_value' + this.sectionId);
			let canvas = document.querySelector('#scatterPlot' + this.sectionId + GROUP);

			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let y = Math.floor(e.clientY - rect.top);

			let posData = this.utils.plotUtils.getDotsInPos(x, y, data)

			if (posData.length > 0) {
				let posContent = posData.length > 5 && EVENT_TYPE == 'move' && !this.isDotPanelClick ? 
					'<strong>There are more items to disply. <br />Click to view the full list.</strong><br /><br />' : "";

				let cIndex = 0;
				posData.map(d => {
					if(EVENT_TYPE == 'move' && cIndex < 6 && !this.isDotPanelClick) {
						posContent += "<strong>" + d.key + "</strong><br />";

						for (const [hKey, hValue] of Object.entries(d.hover)) {
							posContent += "<span>" + hKey + ": ";
							posContent += this.utils.Formatters.pValueFormatter(hValue) + "</span><br />";
						}
					} else if(EVENT_TYPE == 'click'){
						posContent += "<strong>" + d.key + "</strong><br />";

						for (const [hKey, hValue] of Object.entries(d.hover)) {
							posContent += "<span>" + hKey + ": ";
							posContent += this.utils.Formatters.pValueFormatter(hValue) + "</span><br />";
						}
					}
					cIndex ++;
				})

				if (EVENT_TYPE == 'move' && !this.isDotPanelClick){
					wrapper.style.top = x + canvas.offsetLeft + 150 > canvas.width
						? y + canvas.offsetTop + 15 + "px" : y + canvas.offsetTop + "px";
					wrapper.style.left =
						x + canvas.offsetLeft + 150 > canvas.width
							? x + canvas.offsetLeft + -215 + "px"
							: x + canvas.offsetLeft + 15 + "px";
					wrapper.style.width =
						x + canvas.offsetLeft + 150 > canvas.width ? "auto" : "auto";
					wrapper.style.display = "block";

					wrapper.innerHTML = posContent;
				}

				if (EVENT_TYPE == 'click') {
					this.isDotPanelClick = true;
					wrapper.innerHTML = posContent;
				}

			} else {
				if (EVENT_TYPE == 'click') {
					this.isDotPanelClick = false;
				}
				if (EVENT_TYPE == 'move' && !this.isDotPanelClick) {
					wrapper.style.display = "none";
					wrapper.innerHTML = "";
				}
			}

		},
	},
});

$(function () { });
</script>

<style>
.scatter-plot {
	margin: 10px;
}

.colors-list {
	display: block;
    width: 100%;
    text-align: center;
}

.anno-bubble-wrapper {
	width: auto;
    display: inline-block;
    margin-left: 3px;
    margin-right: 3px;
    margin-bottom: 3px;
}

.anno-bubble-wrapper span {
    font-size: 13px;
    display: inline-block;
}

.anno-bubble-wrapper span.anno-bubble {
    border-radius: 12px;
    margin-right: 3px;
    width: 12px;
    height: 12px;
    vertical-align: -3px;
}

.scatter-dot-value {
	position: absolute;
    background-color: #fff;
    border: solid 1px #ddd;
    border-radius: 5px;
    padding: 5px 15px;
    z-index: 11;
    font-size: 14px;
}

.scatter-dot-value.fixed-panel {
	position: fixed;
	width: auto;
	height: auto;
	max-width: 50%;
	max-height: 50%;
	left: calc(50% - 200px) !important;
	top: calc(50% - 150px) !important;
	padding: 20px 15px;
	border-radius: 5px;
	border: solid 1px #ddd;
	background-color: #fff;
	z-index: 100;
	overflow: auto;
	box-shadow: 0px 5px 15px #00000050;
}
</style>



