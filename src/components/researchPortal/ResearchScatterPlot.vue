<template>
	<div class="scatter-plot-content row" id="rp_scatter_plot" style="display: flex; flex-direction: row; justify-content: center;">
		
		
		<div class="" style="display: flex;">
			<div class="">
				<div :id="'scatter_dot_value' + sectionId" 
					class="scatter-dot-value" 
					:class="!!isDotPanelClick? 'fixed-panel':''" 
					style="display:none"></div>
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
					<div style="display:flex; flex-direction: column;">
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
							v-if="renderData.length > 0 && !!renderConfig && !!colorByList"
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
					</div>
				</div>
				<!--
				<template v-if="renderData.length > 0 && !!renderConfig && !!colorByList">
				<div class="scatter-plot-groups" style="display: flex; flex-wrap: wrap;">
					<div class="scatter-plot-group" v-for="color in colorByList[colorByField]">
						<canvas
							
							:key="color"
							:id="'scatterPlot' + sectionId + color"
							class="scatter-plot"
							:width="plotDimension.width/2"
							:height="plotDimension.height/2"
							:style="'width:' +
								(plotDimension.width/4) +
								'px;height:' +
								(plotDimension.height/4) +
								'px;'"
							@click="checkPosition($event,color,'click')"
							@mousemove="checkPosition($event, color, 'move')"
						>
						</canvas>
					</div>
				</div>
				</template>
				-->
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
		<!--
		<div
			v-if="!!renderConfig.label"
			class="scatter-plot-label"
			v-html="renderConfig.label"
		></div>
		-->
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
			//what is dataComparisonConfig?
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

			//check render type
			if(this.renderConfig["render type"] === 'single plot'){

				if(this.renderConfig["x axis fields"]){
					//index of the values each field should display; default: 0
					this.renderConfig["x axis field"] = this.renderConfig["x axis fields"][0];
					this.renderConfig["y axis field"] = this.renderConfig["y axis fields"][0];
				}else{
					this.renderConfig["x axis fields"] = [this.renderConfig["x axis field"]]
					this.renderConfig["y axis fields"] = [this.renderConfig["y axis field"]]
				}
				
				//save field labels
				this.renderConfig["x axis fields"].forEach(field => {
					filterFields.push(field)
				});
				//save field labels
				this.renderConfig["y axis fields"].forEach(field => {
					filterFields.push(field)
				});

			}else if (this.renderConfig["render type"] === 'multi plot'){

				//save array of x,y field pairs for each plot
				this.renderConfig["axis fields"].forEach(fieldpair => {
					//TODO: should be object
					multi.push( [ fieldpair["x axis field"], fieldpair["y axis field"], fieldpair["color by"] ] );
				});

			}

			//check if "color by" is array, if not make it one
			//allows users to enter a string or an array in config without having to condition check later
			if(this.renderConfig["color by"].constructor !== Array){
				this.renderConfig["color by"] = [this.renderConfig["color by"]];
			}

			/*
				//save field labels
				//TODO: cleanup
				this.renderConfig["color by"].forEach(field => {
					filterFields.push(field)
				});
			*/
			console.log('alex filters', filterFields);
			//use collected field names from "x axis fields", "y axis fields", "color by"
			//filter and exclude if any of those fields has 'NA' value
			/*
			const filteredDATA = rawData.filter(d => {
				for (const field of filterFields) {
					if(d[field] === 'NA') return false;
				}
				return true;
			})

			console.log("alex filtered (remove rows with NA values)", rawData.length, filteredDATA.length);
			*/
			
			//create an object of objects for each field requested in "color by"
			//to be filled with arrays of all possible values for each field
			//eg: colorsBy: { "Sex": ["male", "female"], "Field": [1, 2, 3], ... }
			colorsBy = {};
			this.renderConfig["color by"].forEach(colorBy => {
				colorsBy = { ...colorsBy, [colorBy]:[] };
			})
			this.colorByField = this.renderConfig["color field"] = this.renderConfig["color by"][0];
			this.renderConfig["color highlight"] = null;

			console.log('alex render config', this.renderConfig);

			//use filtereredDATA here
			//map data for rendering
			rawData.map((r) => {
				let tempObj = {};
				
				if(this.renderConfig["render type"] === 'single plot'){
					//single plot

					tempObj["x"] = {};
					this.renderConfig["x axis fields"].forEach((field) => {
						let key = field;
						let value = typeof(r[field]) == 'string' ? 0 : r[field]; //TODO: filter out? not here though
						tempObj["x"] = { ...tempObj["x"], [key]:value }
					})
					
					tempObj["y"] = {};
					this.renderConfig["y axis fields"].forEach((field) => {
						let key = field;
						let value = typeof(r[field]) == 'string' ? 0 : r[field]; //TODO: filter out? not here though
						tempObj["y"] = { ...tempObj["y"], [key]:value }
					})

				}else if(this.renderConfig["render type"] === 'multi plot'){
					//multi plot

					tempObj["x"] = {};
					tempObj["y"] = {};
					tempObj["color"] = {};
					//loop through each axis fields pair
					this.renderConfig["axis fields"].forEach(fieldpair => {
						//get x,y values for each pair
						let xvalue = typeof(r[fieldpair["x axis field"]]) == 'string' ? 0 : r[fieldpair["x axis field"]]; //TODO: filter out? not here though
						let yvalue = typeof(r[fieldpair["y axis field"]]) == 'string' ? 0 : r[fieldpair["y axis field"]]; //TODO: filter out? not here though
						tempObj["x"] = { ...tempObj["x"], [fieldpair["x axis field"]]:xvalue };
						tempObj["y"] = { ...tempObj["y"], [fieldpair["y axis field"]]:yvalue };

						//optional 'color by' param available for each color fields pair
						//if there is one, add it to the color by options
						//this will override the global 'color by' param if there is one
						if( fieldpair["color by"] ){
							const key = fieldpair["color by"];
							const value = r[ key ];
							tempObj["color"] = {...tempObj["color"], [key]: value };
							//console.log(tempObj["color"])
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
						//create object of objects containing the fields and their values as requested in "color by"
						//renderConfig["color by"]: [ "Sex", "Time of Day" ]
						//   >    tempObj["color"]: { "Sex": ["male", "female"], "Time of Day": ["night", "day", "all day"], ...}
						
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

			console.log('alex data mapped (used for visuals)', massagedData);

			//TODO: create gratient style legends for 'color by' fields
			//if field has more than 10 unique values, and is numerical
			if(colorsBy){
				let cb = Object.keys(colorsBy);
				cb.forEach(colorBy => {
					if(colorsBy[colorBy].length > 10){
						console.log(`color field '${colorBy}' has ${colorsBy[colorBy].length} unique options`)
						if(typeof colorsBy[colorBy][0] === 'number'){
							console.log(`	it is numberical; make gradient`);
						}
					}
				})
			}

			this.groupsList = groups.length > 0? groups.sort(): null;
			this.colorsList = colors.length > 0? colors.sort() : null;
			this.multiList = multi.length > 0 ? multi : null;
			this.colorByList = Object.keys(colorsBy).length > 0 ? colorsBy : null;

			console.log('alex groups list', this.groupsList);
			console.log('alex colorsby list', this.colorByList );
			console.log('alex colors list', this.colorsList);
			console.log('alex multi', this.multiList);

			console.log('\n- - - - - - - -\n\n')

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

			//if MINMAX_VALUES is present, it means we are rendering smaller breakout plots
			//make those half the size of the combined plot
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

			console.log('alex has group '+ID+':', GROUP);

			if(GROUP && GROUP.constructor === Array){
				
				DATA.map(d => {
					d.xValue = d["x"][GROUP[0]];
					d.yValue = d["y"][GROUP[1]];
					xAxisData.push(d.xValue);
					yAxisData.push(d.yValue);
				})

			}else{

				DATA.map((d) => {
					//check if data has muiltple x field properties
					if(d.x.constructor === Object){
						d.xValue = d["x"][this.renderConfig["x axis field"]];
						xAxisData.push(d.xValue)
					}else{
						xAxisData.push(d.x);
					}
					//check if data has muiltple y field properties
					if(d.y.constructor === Object){
						d.yValue = d["y"][this.renderConfig["y axis field"]];
						yAxisData.push(d.yValue);
					}else{
						yAxisData.push(d.y);
					}
				});

			}

			//if MINMAX_VALUES have been passed to this function use those instead
			let xMin = MINMAX_VALUES ? MINMAX_VALUES.xMin : Math.min.apply(Math, xAxisData);
			let xMax = MINMAX_VALUES ? MINMAX_VALUES.xMax : Math.max.apply(Math, xAxisData);

			let yMin = MINMAX_VALUES ? MINMAX_VALUES.yMin : Math.min.apply(Math, yAxisData);
			let yMax = MINMAX_VALUES ? MINMAX_VALUES.yMax : Math.max.apply(Math, yAxisData);

			let MARGIN = {top: topMargin,bottom: bottomMargin,left: leftMargin,right: rightMargin,bump:bump }

			if(this.multiList){
				this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "x", 5, xMin, xMax, GROUP[0]);
				this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "y", 5, yMin, yMax, GROUP[1]);
			}else{
				//single
				this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "x", 5, xMin, xMax, [this.renderConfig["x axis field"]]);
				this.utils.plotUtils.renderAxisWBump(ctx, canvasWidth, canvasHeight, MARGIN, "y", 5, yMin, yMax, [this.renderConfig["y axis field"]]);
			}
			
			if(!!this.colorsList && !this.multiList) {
				//single + group by
				let cIndex = 0
				this.colorsList.map(color =>{
					let coloredData = DATA.filter(d=>d.color[ this.renderConfig["color field"] ] === color);
					let dotColor = this.compareGroupColors[cIndex];
					this.utils.plotUtils.renderDots(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
					cIndex++;
				})
			} else if(!!this.colorByList){
				//TODO: combine with above, clean up
				let cIndex = 0

				if(GROUP){

					if(GROUP.constructor === Array){
						//multi
						cIndex = 0
						let colorField = this.renderConfig["color field"];
						if(GROUP[2]) colorField = GROUP[2]; //GROUP var for 'multi plot' is multi
						this.colorByList[ colorField ].map(color => {
							let coloredData = DATA.filter(d => d.color[ colorField ] === color);
							let dotColor = this.compareGroupColors[cIndex];
							this.utils.plotUtils.renderDotsWithBestFit(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
							cIndex++;
						});

					}else{

						
						cIndex = 0
						this.colorByList[ this.renderConfig["color field"] ].map(color => {
							if(GROUP === color){
								let coloredData = DATA.filter(d=>d.color[ this.renderConfig["color field"] ] == color);
								let dotColor = this.compareGroupColors[cIndex];
								this.utils.plotUtils.renderDotsWithBestFit(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
								cIndex++;
							}
						})

					}
					
				}else{
					//single + options

					cIndex = 0
					
					let highlight = this.renderConfig["color highlight"];
					let hi = '90';
					let lo = '05';
					
					let arr = [...this.colorByList[ this.renderConfig["color field"] ]];
					arr.push(arr.splice(arr.indexOf(highlight), 1)[0]);

					this.colorByList[ this.renderConfig["color field"] ].map(color => {
						let coloredData = DATA.filter(d=>d.color[ this.renderConfig["color field"] ] == color);
						let dotColor = this.compareGroupColors[cIndex];
						if(highlight){
							dotColor = dotColor.substring(0, dotColor.length - 2);
							dotColor += highlight === color ? hi : lo;
						}
						this.utils.plotUtils.renderDotsWithBestFit(ctx, canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, dotColor, coloredData);
						cIndex++;
					});

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
					plotLabel, //adding "group by" to plot title (TODO: make optional?)
					canvasWidth/2 + leftMargin/2,	//position title over plot
					bump + 26
				);
				

				//this.posData[GROUP] = this.utils.plotUtils.getDotsPosData(canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, DATA);
				this.posData[groupID] = this.utils.plotUtils.getDotsPosData(canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, DATA);
				//console.log('alex posData GROUP '+ID+':', GROUP.constructor === Array, this.renderConfig["group by"], GROUP, this.posData);
			} else {
				this.posData = this.utils.plotUtils.getDotsPosData(canvasWidth, canvasHeight, MARGIN, xMin, xMax, yMin, yMax, DATA);
				//console.log('alex posData '+ID+':', this.posData);
				//console.log('alex posData', xMin, xMax, yMin, yMax);
			}

			//return min/max values (used by combined + breakout plots)
			return {xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax};
		},
		renderPlot() {
			console.log('alex render data', this.renderData);

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

						//draw combined plot and save the min/max axis values
						let maxAxisValues = this.renderIndividualPlot(this.renderData, 'scatterPlot' + this.sectionId);

						//draw individual plots by color group
						//TODO: unused
						/*
						this.colorByList[ this.renderConfig["color field"] ].map(color => {
								let data = this.renderData.filter(d => d.color[ this.renderConfig["color field"] ] === color);
								let id = 'scatterPlot' + this.sectionId + color;
								
								//pass min/max axis values from combined plot
								//so that the indivudual plots render using the same relative scale on each axis
								(!!document.getElementById(id))?this.renderIndividualPlot(data, id, color, maxAxisValues):'';
						})
						*/
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
			this.renderConfig["color highlight"] = null;

			this.colorByField = this.renderConfig["color field"] = e.target.value;
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
		onResize(e) {
			this.renderPlot()
		},
		checkPosition(e, GROUP, EVENT_TYPE) {

			let data = (!!GROUP) ? this.posData[GROUP] : this.posData;
			let wrapper = document.querySelector('#scatter_dot_value' + this.sectionId);
			//let canvas = document.querySelector('#scatterPlot' + this.sectionId + GROUP);
			let canvas = e.target;

			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let y = Math.floor(e.clientY - rect.top);

			let posData = this.utils.plotUtils.getDotsInPos(x, y, data)

			if (posData.length > 0) {
				//console.log("dot", posData.length);
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
						console.log('alex dot data:', d.hover);
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
    display: flex;
    align-items: center;
    margin-left: 0;
    margin-right: 3px;
    margin-bottom: 3px;
	color: #4e4e4e;
	user-select: none;
}

.anno-bubble-wrapper span {
    font-size: 12px;
    display: inline-block;
}

.anno-bubble-wrapper span.anno-bubble {
    border-radius: 12px;
    margin-right: 4px;
    width: 12px;
    height: 12px;
    vertical-align: -3px;
}

.anno-bubble-wrapper:hover .anno-bubble {
    outline: 1px solid rgba(0,0,0,.5);
}

.anno-bubble-wrapper.selected span.anno-bubble {
    background: radial-gradient(circle, rgba(0,0,0,.5) 30%, rgba(0, 0, 0, 0) 30%);
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


/* */

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


/* custom styles, move to CMS */
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



