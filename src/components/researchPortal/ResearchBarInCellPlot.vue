<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12 bar-plot-wrapper">
			<div
				class="col-md-12"
				:id="canvasId + 'barInCellPlotWrapper'"
				style="display: inline-block"
			>
				<div
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
				</div>

				<canvas :hidden="!showCanvas"
					:id="canvasId + 'barInCellPlot'"
					width=""
					height=""
					@mousemove="checkPosition($event, 'hover')"
					@click="checkPosition($event, 'click')"
					@mouseout="
						!utils.uiUtils.isIdFixed('#' + canvasId + 'barInCellInfoBox')
							? utils.uiUtils.removeOnMouseOut(canvasId + 'barInCellInfoBox', 1000)
							: ''
					"
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

export default Vue.component("research-bar-in-cell-plot", {
	props: [
		"canvasId",
		"phenotypeMap",
		"plotData",
		"plotConfig",
		"pkgData",
		"pkgDataSelected",
		"colors",
		"plotMargin",
		"filter",
		"options",
		"sectionId",
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
		//this.renderPlot();
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
		phenotypeMapConfig() {
			if (this.plotConfig["phenotype map"] == "null") {
				return null;
			} else if (
				this.plotConfig["phenotype map"] == "kp phenotype map"
			) {
				return "kpPhenotypeMap";
			}
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
			/*this.showCanvas = true;
			let content = {};
			content["data"] = [];

			if (!!this.plotData) {
				let plotData = cloneDeep(this.plotData);

				plotData.map((d) => {
					let pValue =
						typeof d[this.plotConfig["y axis field"]] == "string"
							? Number(d[this.plotConfig["y axis field"]])
							: d[this.plotConfig["y axis field"]];
					d["rawPValue"] = pValue;

					if (this.plotConfig["convert y -log10"] == "true") {
						d[this.plotConfig["y axis field"] + "-log10"] =
							-Math.log10(pValue);
					}

					if (
						this.phenotypeMapConfig == "kpPhenotypeMap" &&
						!!this.phenotypeMap[d[this.plotConfig["render by"]]]
					) {
						content["data"].push(d);
					} else if (this.phenotypeMapConfig == null) {
						content["data"].push(d);
					}
				});
			}
			if (!!this.filter) {
				content.data = content.data.filter(this.filter);
			}

			if (!!content.data && content.data.length > 0) {
				return content;
			} else {
				this.showCanvas = false;
				return null;
			}*/
		},
	},
	watch: {
		renderData(content) {
			//this.renderPlot();
		},
	},
	methods: {
		downloadImage(ID, NAME, TYPE) {
			if (TYPE == 'svg') {
				this.$refs[this.canvasId + '_barInCellPlot'].renderPlot();
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE, "vector_bar_in_cell_plot_" + this.canvasId);
			} else if (TYPE == 'png') {
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE)
			}

		},
		openPage(PAGE, PARAMETER) {
			this.utils.uiUtils.openPage(PAGE, PARAMETER);
		},
		addPhenotype(PHENOTYPE) {
			this.$parent.$parent.pushCriterionPhenotype(PHENOTYPE);
			window.location.href = "#associations-table";
		},
		groupData(DATA) {
			
			let phenotypeGroups = [];
			let phenotypeGroupsObj = {};

			if (this.phenotypeMapConfig == null) {
				phenotypeGroups = [
					...new Set(
						DATA.data.map((p) => p[this.plotConfig["group by"]])
					),
				].sort();
			} else {
				for (const [key, value] of Object.entries(this.phenotypeMap)) {
					phenotypeGroups.push(value);
				}

				phenotypeGroups = [
					...new Set(phenotypeGroups.map((p) => p.group)),
				].sort();
			}

			phenotypeGroups.map((p) => {
				phenotypeGroupsObj[p] = [];
			});

			DATA.data.map((p) => {
				let group =
					this.phenotypeMapConfig == "kpPhenotypeMap" &&
					!!this.phenotypeMap[p[this.plotConfig["render by"]]]
						? this.phenotypeMap[p[this.plotConfig["render by"]]]
								.group
						: p[this.plotConfig["group by"]];

				phenotypeGroupsObj[group].push(p);
			});
			/*
			for (const [key, value] of Object.entries(phenotypeGroupsObj)) {
				value.sort((a, b) =>
					a[this.plotConfig["y axis field"]] >
					b[this.plotConfig["y axis field"]]
						? 1
						: -1
				);
			}*/

			return phenotypeGroupsObj;
		},
		onResize() {
			//this.renderPlot();
		},
		checkPosition(event, TYPE) {
			let e = event;
			let rect = e.target.getBoundingClientRect();

			let rawX = e.clientX - rect.left;
			let rawY = e.clientY - rect.top;

			let customPlotMargin = !!this.plotConfig["plot margin"]? this.plotConfig["plot margin"]:null;

			let plotMargin = !!customPlotMargin?{
						left: customPlotMargin.left,
						right: customPlotMargin.right,
						top: customPlotMargin.top,
						bottom: customPlotMargin.bottom,
						bump: 10,
					}:
					{
						left: this.plotMargin.leftMargin / 2,
						right: (this.plotMargin.leftMargin / 2) * 1.5,
						top: (this.plotMargin.bottomMargin / 2) * 3.5,
						bottom: (this.plotMargin.bottomMargin / 2) * 2.5,
						bump: 10,
					};

			let y = Math.ceil(e.clientY - rect.top);
			let x = Math.ceil(e.clientX - rect.left);

			const infoBox = document.querySelector(
				"#" + this.canvasId + "barInCellInfoBox"
			);
			const infoBoxContent = document.querySelector(
				"#" + this.canvasId + "barInCellInfoBoxContent"
			);
			const infoBoxClose = document.querySelector(
				"#" + this.canvasId + "info_box_close"
			);
			if (infoBox.getAttribute("class").includes("fixed") == false) {
				let infoContent = "";
				this.hoverItems = {};

				if (
					x >= (plotMargin.left / 2) &&
					x <= rect.width - (plotMargin.right / 2)
				) {
					for (const [yKey, yValue] of Object.entries(
						this.barPosData
					)) {
						let yLoc = yKey.split("-");
						if (y >= yLoc[0] && y <= yLoc[1]) {
							yValue.map((xPos) => {
								if (x >= xPos.start && x <= xPos.end) {
									this.hoverItems[xPos.name] = xPos;

									infoContent +=
										"<strong>" +
										xPos.name +
										"</strong><br />";

									this.plotConfig["hover content"].map(
										(h) => {
											infoContent +=
												h +
												":" +
												xPos.data[h] +
												"<br />";
										}
									);
								}
							});
						}
					}
				}

				

				if (TYPE == "hover") {
					if (infoContent == "") {
						if (
							infoBox.getAttribute("class").includes("fixed") ==
							false
						) {
							infoBox.setAttribute("class", "hidden");
							infoBoxClose.setAttribute("class", "hidden");
						}
					} else {
						if (
							infoBox.getAttribute("class").includes("fixed") ==
							false
						) {
							//infoBoxContent.innerHTML = infoContent;
							infoBox.setAttribute("class", "bar-in-cell-plot-info-box");
							infoBoxClose.setAttribute("class", "hidden");
							if (x < rect.width - 300) {
								infoBox.style.left = rawX + 25 + "px";
								infoBox.style.top = rawY + this.spaceBy + "px";
							} else {
								infoBox.style.left = rawX - 325 + "px";
								infoBox.style.width = "300px !important";
								infoBox.style.top = rawY + this.spaceBy + "px";
							}
						}
					}
				}

				if (TYPE == "click") {
					infoBoxClose.setAttribute("class", "fixed-info-box-close");
					if (infoContent == "") {
						//infoBoxContent.innerHTML = "";
						infoBox.setAttribute("class", "hidden");
					} else {
						//infoBoxContent.innerHTML = infoContent;
						infoBox.setAttribute("class", "bar-in-cell-plot-info-box fixed");
						if (x < rect.width - 300) {
							infoBox.style.left = rawX + 25 + "px";
							infoBox.style.top = rawY + this.spaceBy + "px";
						} else {
							infoBox.style.left = rawX - 325 + "px";
							infoBox.style.width = "300px !important";
							infoBox.style.top = rawY + this.spaceBy + "px";
						}
					}
				}
			}
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
				//c = document.querySelector("#" + this.canvasId + "barInCellPlot");
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
.fixed-info-box-close {
	position: absolute;
	top: 0;
	right: 3px;
	font-size: 14px;
	color: #69f;
}
.bar-in-cell-plot-info-box {
	position: absolute;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 5px 15px;
	z-index: 11;
	font-size: 13px;
	min-width: 200px !important;
	max-width: 400px !important;
}
.option-button {
	font-size: 12px;
	border: solid 1px #aaaaaa;
	border-radius: 10px;
	display: block;
	/* padding: 1px 5px; */
	margin-bottom: 3px;
}
</style>



