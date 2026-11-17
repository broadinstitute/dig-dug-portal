<template>
	<div class="scatter-plot-content row" id="rp_scatter_plot" style="display: flex; flex-direction: row; justify-content: center;">
		
		
		<div class="" style="display: flex;">
			<div class="">
				<div :id="'scatter_dot_value' + sectionId" 
					class="scatter-dot-value hidden"
					>
					<div :style="!!isDotPanelClick ? 'display:block' : 'display:none'" class="fixed-info-box-close" @click="utils.uiUtils.showHidePanel('#scatter_dot_value'+ sectionId)">
						<b-icon icon="x-circle-fill"></b-icon>
					</div>
					<div class="scatter-dot-value-content" :id="'scatter_dot_value_content' + sectionId"></div>
				</div>
				<canvas
					v-if="renderData.length > 0 && !!renderConfig && !groupsList && !multiList"
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
			</div>

			<template v-if="renderData.length > 0 && !!renderConfig && !!multiList">
				<div class="scatter-plot-groups" style="display: flex; flex-wrap: wrap;">
					<div class="scatter-plot-group" v-for="(fieldpair, index) in multiList">
						<div class="colors-list">
							<div v-for="anno, annoIndex in colorsList" class="anno-bubble-wrapper">
								<span class="anno-bubble" :style="'background-color:'+ compareGroupColors[annoIndex]">&nbsp;</span>
								<span>{{ anno }}</span>
							</div>
						</div>
						<canvas
							:key="sectionId + 'multi' + index"
							:id="'scatterPlot' + sectionId + 'multi' + index"
							class="scatter-plot"
							:width="plotDimension.width"
							:height="plotDimension.height"
							:style="'width:' +
								(plotDimension.width/2) +
								'px;height:' +
								(plotDimension.height/2) +
								'px;'"
							@click="checkPosition($event, 'multi'+index, 'click')"
							@mousemove="checkPosition($event, 'multi'+index, 'move')"
						>
						</canvas>
					</div>
				</div>
			</template>

			
			<div v-if="!multiList && !groupsList" class="plot-extras" style="padding-top: 35px;">
				<div style="display:flex; flex-direction: column;">
					<div style="display:flex; flex-direction: column;">
						<label 
							v-if="renderData.length > 0 && !!renderConfig && renderConfig['y axis fields'].length > 1"
						>
							Y Axis
						</label>
						<select 
							class="y-axis-select" 
							@change="setPlotAxisIndex($event, 'y')">
							<option 
								v-for="(option, index) in renderConfig['y axis fields']" 
								:value="option"
								:selected="renderConfig['y axis index'] === option"
							>
								{{ option }}
							</option>
						</select>

						<label 
							v-if="renderData.length > 0 && !!renderConfig && renderConfig['x axis fields'].length > 1"
						>
							X Axis
						</label>
						<select 
							class="x-axis-select" 
							@change="setPlotAxisIndex($event, 'x')">
							<option 
								v-for="(option, index) in renderConfig['x axis fields']" 
								:value="option"
								:selected="renderConfig['x axis field'] === option"
							>
								{{ option }}
							</option>
						</select>
					</div>
					<div class="color-key-options" style="display:flex; flex-direction: column;">
						<label 
							v-if="renderData.length > 0 && !!renderConfig && renderConfig['color by'].length > 1"
						>
							Color by
						</label>
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

						<div 
							class="color-key"
							v-if="renderData.length > 0 && !!renderConfig && !!colorByList 
							&& !colorByGradient"
						>
							<div style="text-align: right; font-size: 10px; font-style: italic;">click key to highlight</div>
							<div 
								v-for="anno, annoIndex in colorByList[ colorByField ]" 
								class="anno-bubble-wrapper"
								@click="setHighlightField($event, anno)"
								style="cursor:pointer;"
							>
								<span class="anno-bubble" :style="'background-color:'+ compareGroupColors[annoIndex]">&nbsp;</span>
								<span>{{ anno }}</span>
							</div>
						</div>

						<div 
							class="color-key"
							v-if="renderData.length > 0 && !!renderConfig && !!colorByList 
							&& !!colorByGradient"
						>
							<div style="text-align: right; font-size: 10px; font-style: italic;">drag sliders to highlight in range</div>
							<div 
								class="color-gradient-wrapper"
								@mousedown="gradientHandleDown($event)"
								@mousemove="gradientHandleMove($event)"
							>
								<div class="color-gradient"
									:style="colorGradient()"	
								></div>
								<div 
									class="color-gradient-handle color-gradient-max"
									data-val=""
								>
									{{ gradientMinMax.currMax }}
								</div>
								<div 
									class="color-gradient-handle color-gradient-min"
									data-val=""
								>
									{{ gradientMinMax.currMin }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
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
			multiList:null,
			groupsList:null,
			colorsList:null,
			colorByList:null,
			colorByField:null,
			colorByGradient:null,
			gradientMinMax:{},
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
			let rawData = (!!this.dataComparisonConfig) 
					? 
					this.utils.dataConvert.object2Array(this.plotData, this.dataComparisonConfig,this.dataComparisonConfig["key field"]) 
					: 
					this.plotData;
			let massagedData = [];
			let groups = [];
			let colors = [];
			let multi = [];
			let colorsBy = {};
			let filterFields = [];

			if(this.renderConfig["render type"] === 'single plot'){

				if(this.renderConfig["x axis fields"]){
					this.renderConfig["x axis field"] = this.renderConfig["x axis fields"][0];
					this.renderConfig["y axis field"] = this.renderConfig["y axis fields"][0];
				}else{
					this.renderConfig["x axis fields"] = [this.renderConfig["x axis field"]]
					this.renderConfig["y axis fields"] = [this.renderConfig["y axis field"]]
				}
				
				this.renderConfig["x axis fields"].forEach(field => {
					filterFields.push(field)
				});
				this.renderConfig["y axis fields"].forEach(field => {
					filterFields.push(field)
				});

			}else if (this.renderConfig["render type"] === 'multi plot'){

				this.renderConfig["axis fields"].forEach(fieldpair => {
					multi.push( [ fieldpair["x axis field"], fieldpair["y axis field"], fieldpair["color by"] ] );
				});

			}

			if(this.renderConfig["color by"].constructor !== Array){
				this.renderConfig["color by"] = [this.renderConfig["color by"]];
			}

			
			colorsBy = {};
			this.renderConfig["color by"].forEach(colorBy => {
				colorsBy = { ...colorsBy, [colorBy]:[] };
			})
			this.colorByField = this.renderConfig["color field"] = this.renderConfig["color by"][0];
			this.renderConfig["color highlight"] = null;


			rawData.map((r) => {
				let tempObj = {};
				
				if(this.renderConfig["render type"] === 'single plot'){

					tempObj["x"] = {};
					this.renderConfig["x axis fields"].forEach((field) => {
						let key = field;
						let value = typeof(r[field]) == 'string' ? 0 : r[field];
						tempObj["x"] = { ...tempObj["x"], [key]:value }
					})
					
					tempObj["y"] = {};
					this.renderConfig["y axis fields"].forEach((field) => {
						let key = field;
						let value = typeof(r[field]) == 'string' ? 0 : r[field];
						tempObj["y"] = { ...tempObj["y"], [key]:value }
					})

				}else if(this.renderConfig["render type"] === 'multi plot'){

					tempObj["x"] = {};
					tempObj["y"] = {};
					tempObj["color"] = {};
					this.renderConfig["axis fields"].forEach(fieldpair => {
						let xvalue = typeof(r[fieldpair["x axis field"]]) == 'string' ? 0 : r[fieldpair["x axis field"]];
						let yvalue = typeof(r[fieldpair["y axis field"]]) == 'string' ? 0 : r[fieldpair["y axis field"]];
						tempObj["x"] = { ...tempObj["x"], [fieldpair["x axis field"]]:xvalue };
						tempObj["y"] = { ...tempObj["y"], [fieldpair["y axis field"]]:yvalue };

						if( fieldpair["color by"] ){
							const key = fieldpair["color by"];
							const value = r[ key ];
							tempObj["color"] = {...tempObj["color"], [key]: value };
							if(!colorsBy[key]){
								colorsBy = { ...colorsBy, [key]:[value] };
							}else{
								if( !colorsBy[key].includes( value ) ){
									colorsBy[key].push( value )
								}
							}
						}
					})
				}
				

				tempObj["key"] = r[this.renderConfig["render by"]];

				tempObj["hover"] = {};

				if (!!this.renderConfig["group by"]) {
					tempObj["group"] = r[this.renderConfig["group by"]];
					if(!groups.includes(tempObj["group"])) {
						groups.push(tempObj["group"]);
					}
				}

				if (!!this.renderConfig["color by"] && !tempObj["color"]) {

					tempObj["color"] = {};
					if(this.renderConfig["color by"].length > 1){
						
						this.renderConfig["color by"].forEach((colorBy, index) => {
							tempObj["color"] = { ...tempObj["color"], [colorBy]: r[ this.renderConfig["color by"][index] ] };
	
							if( !colorsBy[colorBy].includes( r[ this.renderConfig["color by"][index] ] ) ){
								colorsBy[colorBy].push( r[ this.renderConfig["color by"][index] ] )
							}
						});
					}else{
						this.renderConfig["color by"].forEach((colorBy, index) => {
							tempObj["color"] = { ...tempObj["color"], [colorBy]: r[ colorBy ] };
	
							if( !colors.includes( r[ colorBy ] ) ){
								colors.push( r[ colorBy ] )
							}
						});
					}
				}

				if(!!this.renderConfig["hover content"] && this.renderConfig["hover content"].length > 0) {
					this.renderConfig["hover content"].map(h =>{
						tempObj["hover"][h] = r[h];
					})
				}
				massagedData.push(tempObj);
			});


			if(colorsBy){
				let cb = Object.keys(colorsBy);
				cb.forEach(colorBy => {
					if(colorsBy[colorBy].length > 10){
						if(typeof colorsBy[colorBy][0] === 'number'){
							const numbersOnly = colorsBy[colorBy].filter(value => typeof value === 'number');
							numbersOnly.sort( (a, b) => a - b );
							colorsBy[colorBy] = numbersOnly;
						}
					}
				})
			}

			this.groupsList = groups.length > 0? groups.sort(): null;
			this.colorsList = colors.length > 0? colors.sort() : null;
			this.multiList = multi.length > 0 ? multi : null;
			this.colorByList = Object.keys(colorsBy).length > 0 ? colorsBy : null;


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
		renderIndividualPlot(DATA, ID, GROUP, MINMAX_VALUES) {
			let xAxisData = [];
			let yAxisData = [];

			let canvasWidth = MINMAX_VALUES ? this.plotDimension.width/2 : this.plotDimension.width;
			let canvasHeight = MINMAX_VALUES ? this.plotDimension.height/2 : this.plotDimension.height;
			let leftMargin = this.plotDimension.plotMargin.leftMargin;
			let topMargin = this.plotDimension.plotMargin.topMargin;
			let rightMargin = this.plotDimension.plotMargin.rightMargin;
			let bottomMargin = this.plotDimension.plotMargin.bottomMargin;
			let bump = this.plotDimension.plotMargin.bump;

			let c = document.getElementById(ID);
			let ctx = c.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);


			if(GROUP && GROUP.constructor === Array){
				
				DATA.map(d => {
					d.xValue = d["x"][GROUP[0]];
					d.yValue = d["y"][GROUP[1]];
					xAxisData.push(d.xValue);
					yAxisData.push(d.yValue);
				})

			}else{

				DATA.map((d) => {
					if(d.x.constructor === Object){
						d.xValue = d["x"][this.renderConfig["x axis field"]];
						xAxisData.push(d.xValue)
					}else{
						xAxisData.push(d.x);
					}
					if(d.y.constructor === Object){
						d.yValue = d["y"][this.renderConfig["y axis field"]];
						yAxisData.push(d.yValue);
					}else{
						yAxisData.push(d.y);
					}
				});

			}

			let xMin = MINMAX_VALUES ? MINMAX_VALUES.xMin : Math.min.apply(Math, xAxisData);
			let xMax = MINMAX_VALUES ? MINMAX_VALUES.xMax : Math.max.apply(Math, xAxisData);

			let yMin = MINMAX_VALUES ? MINMAX_VALUES.yMin : Math.min.apply(Math, yAxisData);
			let yMax = MINMAX_VALUES ? MINMAX_VALUES.yMax : Math.max.apply(Math, yAxisData);

			let MARGIN = {top: topMargin,bottom: bottomMargin,left: leftMargin,right: rightMargin,bump:bump }

			if(this.multiList){
				this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "x", 5, xMin, xMax, GROUP[0]);
				this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "y", 5, yMin, yMax, GROUP[1]);
			}else{
				this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "x", 5, xMin, xMax, [this.renderConfig["x axis field"]]);
				this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "y", 5, yMin, yMax, [this.renderConfig["y axis field"]]);
			}
			
			if(!!this.colorsList && !this.multiList) {
				let cIndex = 0
				this.colorsList.map(color =>{
					let coloredData = DATA.filter(d=>d.color[ this.renderConfig["color field"] ] === color);
					let dotColor = this.compareGroupColors[cIndex];
					this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
					cIndex++;
				})
			} else if(!!this.colorByList){
				let cIndex = 0

				if(GROUP){

					if(GROUP.constructor === Array){
						cIndex = 0
						let colorField = this.renderConfig["color field"];
						if(GROUP[2]) colorField = GROUP[2];
						this.colorByList[ colorField ].map(color => {
							let coloredData = DATA.filter(d => d.color[ colorField ] === color);
							let dotColor = this.compareGroupColors[cIndex];
							this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
							this.utils.plotUtils.renderBestFitLine(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
							cIndex++;
						});

					}else{

						
						cIndex = 0
						this.colorByList[ this.renderConfig["color field"] ].map(color => {
							if(GROUP === color){
								let coloredData = DATA.filter(d=>d.color[ this.renderConfig["color field"] ] == color);
								let dotColor = this.compareGroupColors[cIndex];
								this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
								this.utils.plotUtils.renderBestFitLine(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
								cIndex++;
							}
						})

					}
					
				}else{

					if(this.renderConfig["color field gradient"]) {
						this.colorByList[ this.renderConfig["color field"] ].map(color => {
							const coloredData = DATA.filter(d=>d.color[ this.renderConfig["color field"] ] == color);
							let dotColor = '#00000001';
							if(color >= this.gradientMinMax.currMin && color <= this.gradientMinMax.currMax){
								dotColor = this.colorFromGradientByValue(
									color, 
									this.colorByList[ this.renderConfig["color field"] ][0], 
									this.colorByList[ this.renderConfig["color field"] ][this.colorByList[ this.renderConfig["color field"] ].length-1]
								);
							}
							this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
						});

						const coloredData = DATA.filter(d=>d.color[ this.renderConfig["color field"] ] >= this.gradientMinMax.currMin && d.color[ this.renderConfig["color field"] ] <= this.gradientMinMax.currMax);
						const dotColor = '#00000050';
						this.utils.plotUtils.renderBestFitLine(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
						
					}else{

						let highlight = this.renderConfig["color highlight"];
						

						cIndex = 0
						this.colorByList[ this.renderConfig["color field"] ].map(color => {
							const coloredData = DATA.filter(d=>d.color[ this.renderConfig["color field"] ] == color);
							let dotColor = this.compareGroupColors[cIndex];
							if(highlight){
								dotColor = dotColor.substring(0, dotColor.length - 2);
								dotColor += highlight === color ? '90' : '05';
							}
							this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
							this.utils.plotUtils.renderBestFitLine(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
							cIndex++;
						});

					}

					
				}

				

			} else {
				let dotColor = this.compareGroupColors[0];
				this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, DATA);
			}

			
			if (!!GROUP) {
				ctx.font = "26px Arial";
				ctx.fillStyle = "#000000";
				ctx.textAlign = "center";
				let plotLabel = this.renderConfig["group by"]+": "+GROUP;
				let groupID = GROUP;
				if(GROUP.constructor === Array) {
					plotLabel = `${GROUP[1]} : ${GROUP[0]}`;
					groupID = 'multi'+ID.substring(ID.length-1, ID.length)
				}
				ctx.fillText(
					plotLabel,
					canvasWidth/2 + leftMargin/2,
					bump + 26
				);
				

				this.posData[groupID] = this.utils.plotUtils.getDotsPosData(canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, DATA);
			} else {
				this.posData = this.utils.plotUtils.getDotsPosData(canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, DATA);
			}

			return {xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax};
		},
		renderPlot() {

			if(this.renderData.length > 0) {

				if(this.multiList){

					this.multiList.forEach((fieldpair, index) => {
						let id = 'scatterPlot' + this.sectionId + "multi" + index; 
						(!!document.getElementById(id)) ? this.renderIndividualPlot(this.renderData, id, fieldpair):'';
					});

				}else{

					
					if (!!this.groupsList) {
						this.groupsList.map(group => {
							let data = this.renderData.filter(d => d.group == group);
							let id = 'scatterPlot' + this.sectionId + group;

							(!!document.getElementById(id))?this.renderIndividualPlot(data, id, group):'';
						})

					} else if(!!this.colorByList){

						let maxAxisValues = this.renderIndividualPlot(this.renderData, 'scatterPlot' + this.sectionId);

					} else {

						this.renderIndividualPlot(this.renderData, 'scatterPlot' + this.sectionId);

					}
				}
			}
			
		},
		setPlotAxisIndex(e, axis){
			this.renderConfig[axis+" axis field"] = e.target.value;
			this.renderPlot();
		},
		setColorField(e){
			e.target.parentNode.querySelector('.color-key').childNodes.forEach(node => {
				node.classList.remove('selected');
			})
			this.colorByField = this.renderConfig["color highlight"] = null;
			this.colorByGradient = this.renderConfig["color field gradient"] = null;

			this.colorByField = this.renderConfig["color field"] = e.target.value;
			if(this.renderConfig["color field"] === "Ambient Temp. (C)") {
				this.colorByGradient = this.renderConfig["color field gradient"] = this.renderConfig["color field"];
				this.gradientMinMax.max = this.colorByList[ this.renderConfig["color field"] ][this.colorByList[ this.renderConfig["color field"] ].length-1];
				this.gradientMinMax.min = this.colorByList[ this.renderConfig["color field"] ][0];
				this.gradientMinMax.currMax = this.gradientMinMax.max;
				this.gradientMinMax.currMin = this.gradientMinMax.min;
				this.gradientMinMax.activeEl = null;
			}
			this.renderPlot();
		},	
		setHighlightField(e, highlight){
			e.target.closest('.color-key').childNodes.forEach(node => {
				node.classList.remove('selected');
			})
			
			if(this.renderConfig["color highlight"]){
				if(this.renderConfig["color highlight"] === highlight){
					this.renderConfig["color highlight"] = null;
				}else{
					this.renderConfig["color highlight"] = highlight;
					e.target.closest('.anno-bubble-wrapper').classList.add('selected');
				}
			}else{
				this.renderConfig["color highlight"] = highlight;
				e.target.closest('.anno-bubble-wrapper').classList.add('selected');
			}
			this.renderPlot();
		},
		colorGradient(){
			const viridisColors = ['#450c54', '#481668', '#482677', '#453681', '#3e4788', '#39558c', '#31648d', '#2e708e', '#277d8e', '#218a8d', '#21968b', '#20a286', '#28af7f', '#3dbc75', '#56c667', '#75d056', '#94d841', '#b9de28', '#dce318', '#fde724'];
			const gradientColors = viridisColors;
			let gradientCSS = 'linear-gradient(0deg, ';
			gradientColors.forEach((color, i) => {
				gradientCSS += color;
				gradientCSS += i < gradientColors.length-1 ? ',' : ')'
			});
			return { 
				'width': '30px',
				'height': '100px',
				'background': gradientCSS
			}
		},
		colorFromGradientByValue(value, min, max){
			const viridisColors = ['#450c54', '#481668', '#482677', '#453681', '#3e4788', '#39558c', '#31648d', '#2e708e', '#277d8e', '#218a8d', '#21968b', '#20a286', '#28af7f', '#3dbc75', '#56c667', '#75d056', '#94d841', '#b9de28', '#dce318', '#fde724'];
			const range = max - min;
			const position = value - min;
			const percentile = position / range * 100;
			const index = Math.floor(percentile / 100 * (viridisColors.length - 1));
			return viridisColors[index];
		},
		gradientHandleDown(e){
			if(e.target.classList.contains('color-gradient-handle')){
				this.gradientMinMax.activeEl = e.target;
				this.gradientMinMax.yOffset = e.target.getBoundingClientRect().y - e.clientY; 
				window.addEventListener('mouseup', this.gradientHandleUp);
			}
		},
		gradientHandleMove(e){
			if(!this.gradientMinMax.activeEl){
				return;
			}

			const el = this.gradientMinMax.activeEl;
			const isMax = el.classList.contains('color-gradient-max') ? true : false;
			
			var rect = el.closest('.color-gradient-wrapper').getBoundingClientRect();
			var y = (e.clientY - rect.top) + this.gradientMinMax.yOffset;
			y = Math.min(Math.max(y, 0), 100); 

			const range = this.gradientMinMax.max - this.gradientMinMax.min;
			el.dataset.val = (this.gradientMinMax.min + range * ((100-y)/100)).toFixed(2);
			if(isMax){
				this.gradientMinMax.currMax = Number(el.dataset.val);
			}else{
				this.gradientMinMax.currMin = Number(el.dataset.val);
			}
			el.innerHTML = el.dataset.val;
			  
			if(isMax) 	el.style.top = `${y + 2}px`;
			if(!isMax) 	el.style.bottom = `${(100-y) + 2}px`;
		},
		gradientHandleUp(){
			if(this.gradientMinMax.activeEl){
				this.gradientMinMax.activeEl = null;
				window.removeEventListener('mouseup', this.gradientHandleUp);
				this.renderPlot();
			}
		},
		onResize(e) {
			this.renderPlot()
		},
		checkPosition(e, GROUP, EVENT_TYPE) {

			let data = (!!GROUP) ? this.posData[GROUP] : this.posData;
			let wrapper = document.querySelector('#scatter_dot_value' + this.sectionId);
			let wrapperContent = document.querySelector('#scatter_dot_value_content' + this.sectionId);
			let canvas = e.target;

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
								if(typeof hValue === Number){
								posContent += this.utils.Formatters.pValueFormatter(hValue) + "</span><br />";
							}else{
								posContent += hValue + "</span><br />";
							}
						}
					} else if(EVENT_TYPE == 'click'){
						posContent += "<strong>" + d.key + "</strong><br />";
						for (const [hKey, hValue] of Object.entries(d.hover)) {
							posContent += "<span>" + hKey + ": ";
							if(typeof hValue === Number){
								posContent += this.utils.Formatters.pValueFormatter(hValue) + "</span><br />";
							}else{
								posContent += hValue + "</span><br />";
							}
							
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
					wrapper.setAttribute("class", "scatter-dot-value")

					wrapperContent.innerHTML = posContent;
				}

				if (EVENT_TYPE == 'click') {
					this.isDotPanelClick = true;
					wrapper.setAttribute("class", "scatter-dot-value fixed-panel");
					wrapperContent.innerHTML = posContent;
				}

			} else {
				if (EVENT_TYPE == 'click') {
					this.isDotPanelClick = false;
				}
				if (EVENT_TYPE == 'move' && !this.isDotPanelClick) {
					wrapperContent.innerHTML = "";
					wrapper.setAttribute("class", "scatter-dot-value hidden")
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


.color-key-options .anno-bubble-wrapper {
	width: auto;
    display: flex;
    align-items: center;
    margin-left: 0;
    margin-right: 3px;
    margin-bottom: 3px;
	color: #4e4e4e;
	user-select: none;
}

.color-key-options .anno-bubble-wrapper span {
    font-size: 12px;
    display: inline-block;
}

.color-key-options .anno-bubble-wrapper span.anno-bubble {
    border-radius: 12px;
    margin-right: 4px;
    width: 12px;
    height: 12px;
    vertical-align: -3px;
}

.color-key-options .anno-bubble-wrapper:hover .anno-bubble {
    outline: 1px solid rgba(0,0,0,.5);
}

.color-key-options .anno-bubble-wrapper.selected span.anno-bubble {
    background: radial-gradient(circle, rgba(0,0,0,.5) 30%, rgba(0, 0, 0, 0) 30%);
}

.color-gradient-wrapper {
    display: flex;
    flex-direction: row;
    position: relative;
    padding: 10px 0;
}
.color-gradient-handle {
    position: absolute;
	cursor:grab;
	user-select: none;
    left: 40px;
    height: 16px;
    min-width: 30px;
    border-left: 1px solid gray;
    background: linear-gradient(90deg, #f1f1f1, transparent);
    font-size: 12px;
    line-height: 12px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 3px;
}
.color-gradient-handle:active{
	cursor:grabbing;
}
.color-gradient-handle::after {
    content: '';
    display: block;
    width: 10px;
    height: 1px;
    position: absolute;
    left: -10px;
    border-style: solid;
    border-width: 3px 10px 3px 0;
    border-color: transparent gray transparent transparent;
}
.color-gradient-max {
	top: 2px;
}
.color-gradient-min {
	bottom: 2px;
}

.scatter-dot-value {
	position: absolute;
    background-color: #fff;
    border: solid 1px #ddd;
    border-radius: 5px;
    padding: 20px 0 0 15px;
    z-index: 11;
    font-size: 14px;
}

.scatter-dot-value.hidden {
	display: none;
}

.scatter-dot-value.fixed-panel {
	position: fixed;
	width: auto;
	height: auto;
	max-width: 50%;
	max-height: 50%;
	left: calc(50% - 200px) !important;
	top: calc(50% - 150px) !important;
	padding: 20px 0 0 15px;
	border-radius: 5px;
	border: solid 1px #ddd;
	background-color: #fff;
	z-index: 100;
	box-shadow: 0px 5px 15px #00000050;
}

.scatter-dot-value-content {
	height: 450px;
    overflow: auto;
}

.fixed-info-box-close {
	position: absolute;
}

.plot-extras label {
    margin: 10px 0 0 0;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 10px;
    color: #1c1c1c;
}
.plot-extras .color-key {
    margin: 5px 0 0 0;
    display: flex;
    flex-direction: column;
}

select {
    word-wrap: normal;
    border: 1px solid rgba(0,0,0,.25);
    color: #4e4e4e;
    padding: 3px;
    font-size: 12px;
}
select:hover {
    border: 1px solid rgba(0,0,0,.5);
}


span.v-light {
	width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffe04f;
}
span.v-dark {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
	background: #c8c6c6;
}
span.v-fullday {
	width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
	background: linear-gradient(
		145deg, 
		#ffe04f 0%, 
		#ffe04f 50%, 
		#c8c6c6 50%, 
		#c8c6c6 100%
  );
}
</style>



