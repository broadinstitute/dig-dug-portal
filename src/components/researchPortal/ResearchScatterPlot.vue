<template>
	<div class="scatter-plot-content row" id="rp_scatter_plot">
		
		<div :id="'scatter_dot_value' + sectionId" 
			class="scatter-dot-value" 
			:class="!!isDotPanelClick? 'fixed-panel':''" 
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

		<div class="plot-extras">
			<div style="display:flex; flex-direction: column;">
				<label 
					v-if="renderData.length > 0 && !!renderConfig && renderConfig['y axis fields'].length > 1"
				>
					Y Axis:
					<select 
						class="y-axis-select" 
						@change="setPlotAxisIndex($event, 'y')">
						<option 
							v-for="(option, index) in renderConfig['y axis fields']" 
							:value="index"
							:selected="renderConfig['y axis index'] === index"
						>
							{{ option.label }}
						</option>
					</select>
				</label>

				<label 
					v-if="renderData.length > 0 && !!renderConfig && renderConfig['x axis fields'].length > 1"
				>
					X Axis:
					<select 
						class="x-axis-select" 
						@change="setPlotAxisIndex($event, 'x')">
						<option 
							v-for="(option, index) in renderConfig['x axis fields']" 
							:value="index"
							:selected="renderConfig['x axis index'] === index"
						>
							{{ option.label }}
						</option>
					</select>
				</label>

				<label 
					v-if="renderData.length > 0 && !!renderConfig && renderConfig['color by'].length > 1"
				>
				Color by:
					<select 
						class="color-by-select" 
						@change="setColorField($event)">
						<option 
							v-for="(option, index) in renderConfig['color by']" 
							:value="option"
							:selected="renderConfig['color by'] === index"
						>
							{{ option }}
						</option>
					</select>
				</label>

				<div v-if="renderData.length > 0 && !!renderConfig && !!colorByList">
					<div 
						v-for="anno, annoIndex in colorByList[ colorByField ]" 
						class="anno-bubble-wrapper"
					>
						<span class="anno-bubble" :style="'background-color:'+ compareGroupColors[annoIndex]">&nbsp;</span>
						<span>{{ anno }}</span>
					</div>
				</div>

			</div>

			<template v-if="renderData.length > 0 && !!renderConfig && !!colorByList">
			<div class="scatter-plot-groups">
				<div class="scatter-plot-group" v-for="color in colorByList[colorByField]">
					<canvas
						
						:key="color"
						:id="'scatterPlot' + sectionId + color"
						class="scatter-plot"
						:width="plotDimension.width"
						:height="plotDimension.height"
						:style="'width:' +
							(plotDimension.width/3) +
							'px;height:' +
							(plotDimension.height/3) +
							'px;'
							"
						@click="checkPosition($event,color,'click')"
						@mousemove="checkPosition($event, color, 'move')"
					>
					</canvas>
				</div>
			</div>
			</template>
		</div>

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
			colorByList:null,
			colorByField:null,
			posData:{},
			isDotPanelClick: false,
		};
	},
	modules: {},
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
			console.log('alex scatter data', this.plotData, this.dataComparisonConfig);
			let rawData = (!!this.dataComparisonConfig)? 
					this.utils.dataConvert.object2Array(this.plotData, this.dataComparisonConfig,this.dataComparisonConfig["key field"]) : 
					this.plotData;
			let massagedData = [];
			let groups = [];
			let colors = [];

			//TODO: check if empy
			let multipleColorsBy = !!this.renderConfig["color by"] ? ( this.renderConfig["color by"].constructor === Array ? true : false) : false;

			//index of the values each field should display; default: 0
			//TODO: these should get set after dropdown change
			let xAxisFieldIndex = 0;
			let yAxisFieldIndex = 0;
			let xAxisMultipleOptions = false;
			let yAxisMultipleOptions = false;
			this.renderConfig["x axis index"] = xAxisFieldIndex;
			this.renderConfig["y axis index"] = yAxisFieldIndex;
			this.colorByField = this.renderConfig["color field"] = this.renderConfig["color by"][0];

			console.log('alex raw data (premap)', rawData);
			console.log('alex render config', this.renderConfig);

			//check if 'single plot' render type has multiple fields for either x or y axis
			if(this.renderConfig["render type"] === 'single plot'){
				if(!!this.renderConfig["x axis fields"]){
					if(this.renderConfig["x axis fields"].length > 1){
						//x field should have dropdown
						console.log("alex x", this.renderConfig["x axis fields"].length);
						xAxisMultipleOptions = true;
					}
				}
				if(!!this.renderConfig["y axis fields"]){
					if(this.renderConfig["y axis fields"].length > 1){
						//y field should have dropdown
						console.log("alex y", this.renderConfig["y axis fields"].length);
						yAxisMultipleOptions = true;
					}
				}
			}

			//create an object of objects for each field requested in "color by"
			//to be filled with arrays of all possible values for each field
			//eg: colorsBy: { "Sex": ["male", "female"], "Field": [1, 2, 3], ... }
			let colorsBy = null;
			if(multipleColorsBy){
				colorsBy = {};
				this.renderConfig["color by"].forEach(colorBy => {
					colorsBy = { ...colorsBy, [colorBy]:[] };
				})
			}

			rawData.map((r) => {
				let tempObj = {};

				if(xAxisMultipleOptions){
					//TODO: should be adding to object not array
					tempObj["x"] = [];
					this.renderConfig["x axis fields"].forEach((field) => {
						let key = field["label"];
						let value = typeof(r[field["value"]]) == 'string' ? 0 : r[field["value"]];
						tempObj["x"].push({[key]:value});
					})
				}else{
					//TODO: if field is missing value, exclude from plot
					//currently checking for string and setting to 0
					//TODO: consider making tempObj[x] an array here also (even though its only 1 value)
					let x = typeof(r[this.renderConfig["x axis fields"][xAxisFieldIndex]["value"]]) == 'string' ? 0 : r[this.renderConfig["x axis fields"][xAxisFieldIndex]["value"]];
					tempObj["x"] = x;
				}

				if(yAxisMultipleOptions){
					tempObj["y"] = [];
					this.renderConfig["y axis fields"].forEach((field) => {
						let key = field["label"];
						let value = typeof(r[field["value"]]) == 'string' ? 0 : r[field["value"]];
						tempObj["y"].push({[key]:value});
					})
				}else{
					//TODO: if field is missing value, exclude from plot
					//currently checking for string and setting to 0
					//TODO: consider making tempObj[x] an array here also (even though its only 1 value)
					let y = typeof(r[this.renderConfig["y axis fields"][yAxisFieldIndex]["value"]]) == 'string' ? 0 : r[this.renderConfig["y axis fields"][yAxisFieldIndex]["value"]];
					tempObj["y"] = y;
				}

				tempObj["key"] = r[this.renderConfig["render by"]];
				tempObj["hover"] = {}
				

				if (!!this.renderConfig["group by"]) {
					tempObj["group"] = r[this.renderConfig["group by"]];
					if(!groups.includes(tempObj["group"])) {
						groups.push(tempObj["group"]);
					}
				}

				if (!!this.renderConfig["color by"]) {
					if(multipleColorsBy){
						//create array of objects containing the fields and their values as requested in "color by"
						//eg: "color by": [ "Sex", "Time of Day" ]
						//    >  "color": [ { "Sex": "male" }, { "Time of Day": "night" }, ...]
						//TODO: should be adding to object not array
						tempObj["color"] = {};
						
						this.renderConfig["color by"].forEach((colorBy, index) => {
							//let col = {[colorBy]: r[ this.renderConfig["color by"][index] ] };
							tempObj["color"] = {...tempObj["color"], [colorBy]: r[ this.renderConfig["color by"][index] ] };

							if( !colorsBy[colorBy].includes( r[ this.renderConfig["color by"][index] ] ) ){
								colorsBy[colorBy].push( r[ this.renderConfig["color by"][index] ] )
							}
						})


						//tempObj["color"] = r[this.renderConfig["color by"][this.renderConfig["color field"]];
						//if (!colors.includes(tempObj["color"])) {
						//	colors.push(tempObj["color"]);
						//}
					}else{
						tempObj["color"] = r[this.renderConfig["color by"]];
						if (!colors.includes(tempObj["color"])) {
							colors.push(tempObj["color"]);
						}
					}
				}

				if(!!this.renderConfig["hover content"] && this.renderConfig["hover content"].length > 0) {
					this.renderConfig["hover content"].map(h =>{
						tempObj["hover"][h] = r[h];
					})
				}
				massagedData.push(tempObj);
			});

			console.log('alex massaged data', massagedData);

			this.groupsList = groups.length > 0? groups.sort(): null;
			this.colorsList = colors.length > 0? colors.sort() : null;
			this.colorByList = colorsBy;

			console.log('alex groups list', this.groupsList);
			console.log('alex colorsby list', this.colorByList )
			console.log('alex colors list', this.colorsList);

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
				//check if data has muiltple x field properties
				if(d.x.constructor === Array){
					xAxisData.push(Object.values(d["x"][this.renderConfig["x axis index"]])[0])
					d.xValue = Object.values(d["x"][this.renderConfig["x axis index"]])[0];
				}else{
					xAxisData.push(d.x);
				}
				//check if data has muiltple y field properties
				if(d.y.constructor === Array){
					yAxisData.push(Object.values(d["y"][this.renderConfig["y axis index"]])[0])
					d.yValue = Object.values(d["y"][this.renderConfig["y axis index"]])[0];
				}else{
					yAxisData.push(d.y);
				}
			});

			let xMin = Math.min.apply(Math, xAxisData);
			let xMax = Math.max.apply(Math, xAxisData);

			let yMin = Math.min.apply(Math, yAxisData);
			let yMax = Math.max.apply(Math, yAxisData);

			let MARGIN = {top: topMargin,bottom: bottomMargin,left: leftMargin,right: rightMargin,bump:bump }
			this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "x", 5, xMin, xMax, this.renderConfig["x axis fields"][this.renderConfig["x axis index"]]["label"]);
			this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "y", 5, yMin, yMax, this.renderConfig["y axis fields"][this.renderConfig["y axis index"]]["label"]);
			
			if(!!this.colorsList) {
				let cIndex = 0
				this.colorsList.map(color =>{
					let coloredData = DATA.filter(d=>d.color == color);
					let dotColor = this.compareGroupColors[cIndex];
					this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
					cIndex++;
				})
			} else if(!!this.colorByList){
				//TODO: combine with above
				let cIndex = 0
				this.colorByList[ this.renderConfig["color field"] ].map(color => {
					let coloredData = DATA.filter(d=>d.color[ this.renderConfig["color field"] ] == color);
					let dotColor = this.compareGroupColors[cIndex];
					this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
					cIndex++;
				})
			} else {
				let dotColor = this.compareGroupColors[0];
				this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, DATA);
			}

			console.log('alex has group '+ID+':', GROUP);
			if (!!GROUP) {
				ctx.font = "26px Arial";
				ctx.fillStyle = "#000000";
				ctx.textAlign = "center";
				console.log("alex canvas", canvasWidth);
				ctx.fillText(
					this.renderConfig["group by"]+": "+GROUP, //adding "group by" to plot title (TODO: make optional?)
					canvasWidth/2 + leftMargin/2,	//position title over plot
					bump + 26
				);

				this.posData[GROUP] = this.utils.plotUtils.getDotsPosData(canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, DATA);
			} else {
				this.posData = this.utils.plotUtils.getDotsPosData(canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, DATA);
				console.log('alex posData '+ID+':', this.posData, DATA);
				console.log('alex posData', xMin, xMax, yMin, yMax);
			}
		},
		renderPlot() {
			console.log('alex render data', this.renderData);
			if(this.renderData.length > 0) {
				if (!!this.groupsList) {
					this.groupsList.map(group => {
						let data = this.renderData.filter(d => d.group == group);
						let id = 'scatterPlot' + this.sectionId + group;

						
						(!!document.getElementById(id))?this.renderIndividualPlot(data, id, group):'';
					})
				} else if(!!this.colorByList){
					this.renderIndividualPlot(this.renderData, 'scatterPlot' + this.sectionId);
					//create individual plots by color group
					this.colorByList[ this.renderConfig["color field"] ].map(color => {
						let data = this.renderData.filter(d => d.color[ this.renderConfig["color field"] ] === color);
						let id = 'scatterPlot' + this.sectionId + color;

						console.log('!!!', document.getElementById(id));
						
						(!!document.getElementById(id))?this.renderIndividualPlot(data, id, color):'';
					})
				}
				else {
					this.renderIndividualPlot(this.renderData, 'scatterPlot' + this.sectionId);
				}
			}
			
		},
		setPlotAxisIndex(e, axis){
			this.renderConfig[axis+" axis index"] = e.target.value;
			this.renderPlot();
		},
		setColorField(e){
			this.colorByField = this.renderConfig["color field"] = e.target.value;
			this.renderPlot();
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



