<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12 bar-plot-wrapper">
			<div
				class="col-md-12"
				:id="canvasId + 'barInCellPlotWrapper'"
				style="display: inline-block"
			>
				<!-- <div
					:id="canvasId + 'barInCellInfoBox'"
					class="bar-in-cell-plot-info-box hidden"
				>
					<div
						:id="canvasId + 'info_box_close'"
						class="fixed-info-box-close"
						@click="
							utils.uiUtils.removeOnMouseOut(canvasId + 'barInCellInfoBox', 100)
						"
					>
						<b-icon icon="x-circle-fill"></b-icon>
					</div>
					<span :id="canvasId + 'barInCellInfoBoxContent'"></span>

					<span v-for="(ptValue, ptKey) in hoverItems" :key="ptKey">
						<strong>{{ ptKey }}</strong
						><br />
						<span v-for="(dValue, dKey) in ptValue.data">
							<span>{{ dKey + ": " }}</span
							><span>{{ dValue }}</span> <br
						/></span>
						<template
							v-if="
								options != null &&
								utils.uiUtils.isIdFixed('#' + canvasId + 'barInCellInfoBox') ==
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
								utils.uiUtils.isIdFixed('#' + canvasId + 'barInCellInfoBox') ==
									false
							"
							>Click for options</span
						>
					</span>
				</div>-->

				<canvas :hidden="!showCanvas"
					:id="canvasId + 'barInCellPlot'"
					width=""
					height=""
				></canvas>
				<!--<div class="download-images-setting">
					<span class="btn btn-default options-gear" >Download <b-icon icon="download"></b-icon></span>
					<ul class="options" >
						<li>
							<a href="javascript:;"
							@click="downloadImage('vector_wrapper_' + canvasId, canvasId + '_barInCellPlot', 'svg')">Download SVG</a>
						</li>
						<li>
							<a href="javascript:;"
							@click="downloadImage(canvasId + 'barInCellPlot', canvasId + '_barInCellPlot', 'png')">Download PNG</a>
						</li>
					</ul>
				</div>
				<research-bar-plot-vector
				v-if="!!renderData"
					:renderData="groupData(renderData)"
					:plotConfig="plotConfig"
					:colors="colors"
					:margin="adjPlotMargin"
					:sectionId="canvasId"
					:utils="utils"
					:ref="canvasId + '_barInCellPlot'"
				>
				</research-bar-plot-vector>-->
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

Vue.use(BootstrapVueIcons);

/* Example config:
{
  "is multi section": "true",
  "sections": [
    {
      "section id": "plotTest",
      "header": "Bar in cell plot test",
      "data point": {
        "type": "api",
        "url": "https://hugeampkpncms.org/rest/directcsv?id=sysbio_program_x_tissue",
        "data type": "csv",
        "data wrapper": [
          0,
          "field_data_points"
        ]
      },
      "visualizer": {
        "type": "bar in cell plot",
        "label": "Plot name",
        "x axis field": "Tissue Type",
        "y axis field": "Program",
        "bars in cell": [
          {
            "field": "Number of Control",
            "color": "#ff0000",
            "value type": "number"
          },
          {
            "field": "Number of Treatment",
            "color": "#0000ff",
            "value type": "number"
          },
          {
            "field": "Assay Type",
            "color": "#666666",
            "value type": "string"
          }
        ],
        "bar width": 100,
        "bar height": 20,
        "plot margin": {
          "left": 270,
          "right": 30,
          "top": 50,
          "bottom": 40,
          "bump": 10
        }
      }
    }
  ]
}

*/

export default Vue.component("research-bar-in-cell-plot", {
	props: [
		"canvasId",
		"plotData",
		"plotConfig",
		"plotMargin",
		"utils"
	],
	data() {
		return {
			barData: null,
			barPosData: {},
			spaceBy: 7,
			trigger: 0,
			hoverItems: {},
			showCanvas: true,
		};
	},
	modules: {
	},
	components: {
		barPlotVector,
	},
	created: function () {
		this.renderPlot();
	},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		this.renderPlot();
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		adjPlotMargin() {

			let customPlotMargin = !!this.plotConfig["plot margin"] ? this.plotConfig["plot margin"] : null;



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
        plotGroups() {
            let plotGroups = {xAxis:[],yAxis:[],barFields:{},barFieldsType:{},max:null,min:null}

            const xAxis = this.plotConfig["x axis field"];
            const yAxis = this.plotConfig["y axis field"];
            const barFields = this.plotConfig["bars in cell"];

            for (const obj of barFields) {
                plotGroups.barFields[obj['field']] = obj['color'];
                plotGroups.barFieldsType[obj['field']] = obj['value type'];
            }

            this.plotData.map( item => {
                if(!!item[xAxis]) {
                    if(!plotGroups.xAxis.includes(item[xAxis])) plotGroups.xAxis.push(item[xAxis])
                } 

                if(!!item[yAxis]) {
                    if(!plotGroups.yAxis.includes(item[yAxis])) plotGroups.yAxis.push(item[yAxis])
                } 

                Object.keys(plotGroups.barFields).map(field => {
                    const fValue = item[field];

                    plotGroups.max = (!fValue)? plotGroups.max : 
                        (!plotGroups.max || plotGroups.max < fValue)? fValue : plotGroups.max;

                    plotGroups.min = (!fValue)? plotGroups.min : 
                        (!plotGroups.min || plotGroups.min > fValue)? fValue : plotGroups.min;
                })
            })

            plotGroups.min = (plotGroups.min > 0)? 0 : plotGroups.min;

            return plotGroups;
        },
		renderData() {
            
            return this.plotData;
			
		},
	},
	watch: {
		renderData(content) {
			this.renderPlot();
		},
	},
	methods: {
		onResize() {
			this.renderPlot();
		},
		renderPlot() {

			const wrapper = document.querySelector(
				"#" + this.canvasId + "barInCellPlotWrapper"
			);
			const canvas = document.querySelector(
				"#" + this.canvasId + "barInCellPlot"
			);
            const margin = this.adjPlotMargin;
            const groups = this.plotGroups;
            const config = this.plotConfig;
            const barWidth = config['bar width'];
            const barHeight = config['bar height'];
            const columnWidth = (barWidth * Object.keys(groups.barFields).length) + margin.bump;
            const columnHeight = barHeight + margin.bump;
            const xPixel = barWidth / groups.max;
            const xPosStart = (margin.left * 2) + margin.bump;
            const yPosStart = (margin.top * 2) + margin.bump;

			if (!!canvas && !!wrapper) {
				let canvasWidth = (margin.left + margin.right + (groups.xAxis.length * columnWidth)) * 2;
				let canvasHeight = (margin.top + margin.bottom + (groups.yAxis.length * columnHeight)) * 2;

				let ctx;
				
				canvas.setAttribute("width", canvasWidth);
				canvas.setAttribute("height", canvasHeight);
				canvas.setAttribute(
					"style",
					"width:" +
						canvasWidth/2 +
						"px;height:" +
						canvasHeight/2 +
						"px;"
				);
				ctx = canvas.getContext("2d");

                let getWidth = function (text, fontSize, fontFace) {
                    ctx.font = fontSize + 'px ' + fontFace;
                    return ctx.measureText(text).width;
                }

				ctx.clearRect(0, 0, canvasWidth, canvasHeight);

				this.barPosData = {};

                /// render legends

                let legendXpos = margin.bump * 2;
                Object.keys(groups.barFields).map(bar => {

                    ctx.fillStyle = groups.barFields[bar];
                    ctx.fillRect(legendXpos, margin.bump * 2, 24, 24);

                    legendXpos += 24 + margin.bump;

                    ctx.textAlign = "start";
                    ctx.font = "26px Arial";
                    ctx.fillStyle = "#000000"

					ctx.fillText(bar, 
                        legendXpos, 
                        margin.bump * 2 + 24 );

                    legendXpos += getWidth(bar, 26, "Arial") + (margin.bump * 2);

                })

                /// first render y axis labels

                ctx.font = "26px Arial";
                ctx.fillStyle = "#000000"

                groups.yAxis.map((label, labelIndex) => {
                    let yPos = yPosStart + (columnHeight *2) * labelIndex

                    ctx.textAlign = "end";
					ctx.fillText(label, 
                        (margin.left * 2) - (margin.bump /2), 
                        yPos + (barHeight * 2 - margin.bump));

                    ctx.moveTo(
						xPosStart - margin.bump / 2 + ((columnWidth * 2) * labelIndex),
						yPosStart - margin.bump / 2
					);
                    ctx.lineTo(
                        xPosStart - margin.bump / 2 + ((columnWidth * 2) * labelIndex),
                        yPosStart + (groups.yAxis.length * (columnHeight * 2) - margin.bump / 2)
                    );
                    ctx.strokeStyle = "#666666";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                })

                /// then render x axis labels

                groups.xAxis.map((label, labelIndex) => {
                    ctx.textAlign = "center";
					ctx.fillText(label, 
                        (margin.left * 2) + (columnWidth * 2) * (labelIndex + 1) - columnWidth, 
                        (margin.top * 2) - margin.bump );
                })

                const maxWidth = (xPixel * groups.max) * 2;

                groups.xAxis.map((x,xIndex) => {

                    groups.yAxis.map((y,yIndex) => {

                        Object.keys(groups.barFields).map((bar, barIndex) => {

                        let yPos = yPosStart + (columnHeight *2) * yIndex,
                        xPos = xPosStart + ((columnWidth * 2) * xIndex) + ((barWidth * 2) * barIndex);

                        ctx.fillStyle = "#999999";
                        ctx.fillRect(xPos, yPos + barHeight, maxWidth, 2);    

                        })

                    })

                })

                this.plotData.map( item => {
                    let xIndex = groups.xAxis.indexOf(item[config['x axis field']]),
                    yIndex = groups.yAxis.indexOf(item[config['y axis field']]);

                    Object.keys(groups.barFields).map((bar, barIndex) => {

                        let yPos = yPosStart + (columnHeight *2) * yIndex,
                        xPos = xPosStart + ((columnWidth * 2) * xIndex) + ((barWidth * 2) * barIndex),
                        eachBarWidth = (xPixel * item[bar]) * 2;

                        ///first cleanup the bar space
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(xPos, yPos, maxWidth, (barHeight * 2));

                        

                        if(groups.barFieldsType[bar] == "number") {

                            ctx.fillStyle = "#eeeeee";

                            ctx.fillRect(xPos, yPos, maxWidth, (barHeight * 2));

                            ctx.fillStyle = groups.barFields[bar];
                            
                            ctx.fillRect(xPos, yPos, eachBarWidth, (barHeight * 2));

                            let valueWidth = getWidth(item[bar], 26, "Arial");

                            if (( valueWidth + eachBarWidth) > maxWidth ) {

                                ctx.textAlign = "end";
                                ctx.fillStyle = "#ffffff";

                                ctx.fillText(item[bar],xPos + eachBarWidth - margin.bump , yPos + (barHeight * 2 - margin.bump) );
                            } else {

                                ctx.textAlign = "start";
                                ctx.fillStyle = "#000000";

                                ctx.fillText(item[bar],xPos + eachBarWidth + margin.bump , yPos + (barHeight * 2 - margin.bump) );
                            }
                        } else if(groups.barFieldsType[bar] == "string") {
                            ctx.textAlign = "start";

                            ctx.fillStyle = groups.barFields[bar];

                            ctx.fillText(item[bar],xPos + margin.bump , yPos + (barHeight * 2 - margin.bump) );
                        }
                    })
                })

                /// render label
                ctx.textAlign = "center";
                ctx.font = "700 30px Arial";
                ctx.fillStyle = "#000000";
                ctx.fillText(config.label, canvasWidth/2 , canvasHeight - margin.bump);
			}
		},
	},
});

$(function () {});
</script>

<style>
</style>



