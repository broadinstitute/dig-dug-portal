<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12">
			<div class="genes-track-setting" v-if="!!localGeneTypes" >
				<span class="btn btn-default options-gear" >Genes <b-icon icon="gear-fill"></b-icon></span>
				<ul class="options" >
						<li>
							<input type="checkbox" class="chkbox"
								@click="utils.uiUtils.showHideElement('genesTrackWrapper' + sectionId)"
							/><label> Hide track</label>
						</li>
						<li>
							<input type="checkbox" class="chkbox"
							:id="sectionId + 'GenesTrackAll'"
							@click="checkAll()"
							:checked = "(!!plotConfig['genes track']['show all biotypes'])? true:false"
							/><label> Show all biotypes</label>
						</li>
						<li v-for="geneType in localGeneTypes"
							:key="geneType">
							<!--
							<input type="checkbox" class="chkbox"
								v-if="geneType == 'protein_coding'"
								:id="sectionId + geneType"
								:value="geneType"
								checked
								@click="renderTrack(localGenesData)"
							/>
							-->
							<input type="checkbox" class="chkbox"
									:id="sectionId + geneType"
									:value="geneType"
									:checked = "(geneType == 'protein_coding' || !!plotConfig['genes track']['show all biotypes'])? true:false"
									@click="renderTrack(localGenesData)"
								/>
							<label :for="geneType">{{ geneType.replaceAll("_"," ") }}</label>
						</li>
						<li>
							<a href="javascript:;"
							@click="downloadImage('vector_wrapper_' + sectionId, sectionId + '_genesTrack', 'svg')">Download SVG</a>
						</li>
						<li>
							<a href="javascript:;"
							@click="downloadImage('genesTrack' + sectionId, sectionId + '_genesTrack', 'png')">Download PNG</a>
						</li>
					</ul>
			</div>
			<!-- place info modal here-->
			<div
				:id="'genesTrackWrapper' + sectionId"
				class="genes-plot-wrapper"
			>
				<canvas
					:id="'genesTrack'+sectionId"
					@resize="onResize"
					width=""
					height=""
				></canvas>
			</div>
		</div>
		<research-genes-track-vector
		v-if="renderingGenes.length > 0"
			:genesData="renderingGenes"
			:renderConfig="plotConfig"
			:margin="adjPlotMargin"
			:region="viewingRegion"
			:sectionId="sectionId"
			:utils="utils"
			:ref="sectionId + '_genesTrack'"
		>
		</research-genes-track-vector>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";
import genesTrackVector from "@/components/researchPortal/vectorPlots/ResearchGenesTrackVector.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("multi-genes-track", {
	props: [
		"region",
		"genesData",
		"plotConfig",
		"plotType",
		"plotMargin",
		"regionZoom",
		"regionViewArea",
		"utils",
		"sectionId",
		"starItems",
		"hoverPos"
	],
	data() {
		return {
			plotRendered: 0,
			localGenesData: null,
			localGeneTypes: null,
			renderingGenes: [],
		};
	},
	modules: {
		//uiUtils,
		//Formatters,
	},
	components: { genesTrackVector },
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		if(!!this.genesData) {
			this.renderTrack(this.genesData);
		} else {
			this.getGenesInRegion(this.region)
		}
	},
	created() {
		//this.$root.$refs.genesTrack = this;
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
		searchingRegion() {
			let returnObj = {};
			let regionArr = this.region.split(":")[1].split("-");
			returnObj["start"] = regionArr[0];
			returnObj["end"] = regionArr[1];

			return returnObj;
		},
		viewingRegion() {
			if (this.region == null) {
				return null;
			} else {
				let returnObj = {};

				returnObj["chr"] = parseInt(this.region.split(":")[0], 10);

				let regionArr = this.region.split(":")[1].split("-");
				let chr = this.region.split(":")[0];
				let start = parseInt(regionArr[0], 10);
				let end = parseInt(regionArr[1], 10);
				let distance = end - start;
				if (this.regionZoom > 0) {
					let zoomNum = Math.round(
						distance * (this.regionZoom / 200)
					);
					let viewPointShift = Math.round(
						zoomNum * (this.regionViewArea / 100)
					);
					returnObj["chr"] = chr;
					returnObj["start"] = start + zoomNum + viewPointShift;
					returnObj["end"] = end - zoomNum + viewPointShift;
				} else if (this.regionZoom == 0) {
					returnObj["chr"] = chr;
					returnObj["start"] = start;
					returnObj["end"] = end;
				}

				return returnObj;
			}
		},
		codingGenes() {
			let codingGenesData = this.genesData;
			return codingGenesData;
		},
	},
	watch: {
		codingGenes(DATA) {
			this.renderTrack(this.genesData);
		},
		viewingRegion: {
			handler: function (n, o) {
				if(!!this.genesData){
					this.renderTrack(this.genesData);
				} else {
					this.getGenesInRegion(n.chr+":"+n.start+"-"+n.end);
				}
			},
			deep: true,
			immediate: true,
		},
		starItems(STARS){
			if (!this.genesData) {
				this.renderTrack(this.localGenesData);
			} else {
				this.renderTrack(this.genesData);
			}
		}
	},
	methods: {
		//...uiUtils,
		downloadImage(ID, NAME, TYPE) {
			if (TYPE == 'svg') {
				this.$refs[this.sectionId + '_genesTrack'].renderPlot();
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE, "genesTrack"+this.sectionId);
			} else if (TYPE == 'png') {
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE)
			}
		},
		onResize(e) {
			if(!this.genesData){
				this.renderTrack(this.localGenesData);
			} else {
				this.renderTrack(this.genesData);
			}
			
		},

		checkAll() {

			if(!!document.getElementById(this.sectionId + 'GenesTrackAll').checked) {
				this.localGeneTypes.map(t => {
					document.getElementById(this.sectionId + t).checked = true;
				})
			} else {
				this.localGeneTypes.map(t => {
					if(t != 'protein_coding') {
						document.getElementById(this.sectionId + t).checked = false;
					}
					
				})
			}

			this.renderTrack(this.localGenesData)
		},

		sortGenesByRegion(GENES) {
			let tracks = [];
			let gIndex = 0;

			// canvas is required to use getWidth function
			let canvas = document.createElement('canvas'),
				context = canvas.getContext('2d');

			GENES.map(g => {
				tracks[gIndex] = [];
				gIndex ++;
			})


			let checkedTypes = [...new Set(this.localGeneTypes.filter(type =>
				!!document.getElementById(this.sectionId + type) && !!document.getElementById(this.sectionId + type).checked))];

			GENES.map(g => {
				if(!!checkedTypes.includes(g.gene_type)) {
					if (tracks[0].length == 0) {
						tracks[0].push(g);
					} else {
						let gTaken = false;
						tracks.map(t => {
							if (t.length > 0 && gTaken == false) {

								let lastGene = t[t.length - 1];

								//measuring if the regioon of the last gene is bigger than the gene label
								//console.log("t", t);
								let lastGeneWidth = lastGene.xEndPos - lastGene.xStartPos;
								let newGeneWidth = g.xEndPos - g.xStartPos;
								

								let geneLabelWidth = this.getWidth(context, g.gene_name + " " +"\u{2190}", 24, "Arial");

								let endPos = (lastGeneWidth <= geneLabelWidth) ? ((geneLabelWidth - lastGeneWidth)/2)+lastGene.xEndPos: lastGene.xEndPos;
								let startPos = (newGeneWidth <= geneLabelWidth) ? g.xStartPos - ((geneLabelWidth - newGeneWidth) / 2) : g.xStartPos;

								/*
								let endPos = (lastGeneWidth <= 100) ? ((100- lastGeneWidth)/2)+lastGene.xEndPos: lastGene.xEndPos;
								let startPos = (newGeneWidth <= 100) ? g.xStartPos - ((100 - newGeneWidth) / 2) : g.xStartPos;
								*/

								if (endPos <= startPos) {
									t.push(g)
									gTaken = true;
								}
							} else if (t.length == 0 && gTaken == false) {
								t.push(g)
								gTaken = true;
							}
						})
					}
				}
			})

			tracks = tracks.filter(t => t.length > 0);

			return tracks;
		},

		getWidth (ctx, text, fontSize, fontFace) {
			ctx.font = fontSize + 'px ' + fontFace;
			return ctx.measureText(text).width;
		},

		renderTrack(GENES) {

			let canvasRenderWidth, canvasRenderHeight;

			if (!!document.getElementById("genesTrackWrapper"+this.sectionId)) {

				
				let eachGeneTrackHeight = 60; //15: gene name, 10: gene track, 5: space between tracks

				canvasRenderWidth = !!this.plotConfig.width
					? this.plotConfig.width * 2 +
					  this.adjPlotMargin.left +
					  this.adjPlotMargin.right
					: document.getElementById("genesTrackWrapper" + this.sectionId).clientWidth *2;

				let plotWidth =
					this.plotType == "region plot"
						? canvasRenderWidth - this.adjPlotMargin.left * 2
						: canvasRenderWidth -
						(this.adjPlotMargin.left +
							this.adjPlotMargin.right);

				//let plotHeight = eachGeneTrackHeight * geneTracksArray.length;

				let xMin = Number(this.viewingRegion.start),
					xMax = Number(this.viewingRegion.end);

				let xStart = this.adjPlotMargin.left;
				let yStart = this.adjPlotMargin.top;
				let xPosByPixel = plotWidth / (xMax - xMin);

				let genesSorted = this.utils.sortUtils.sortArrOfObjects(GENES, 'start', 'number', 'asc')
									.filter(g => g.start <= xMax && g.end >= xMin);

				genesSorted.map(gene =>{

					let xStartPos =
						gene.start > xMin
							? xStart + (gene.start - xMin) * xPosByPixel
							: xStart;
					let xEndPos =
						gene.end < xMax
							? xStart + (gene.end - xMin) * xPosByPixel
							: xStart + (xMax - xMin) * xPosByPixel;

					gene["xStartPos"] = xStartPos;
					gene["xEndPos"] = xEndPos;
				})

				let geneTracksArray = this.sortGenesByRegion(genesSorted);

				this.renderingGenes = geneTracksArray;

				canvasRenderHeight =
					this.adjPlotMargin.top +
					eachGeneTrackHeight * geneTracksArray.length;

				let bump = this.adjPlotMargin.bump;

				let c = document.getElementById("genesTrack" + this.sectionId);
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

				ctx.font = "italic bold 24px Arial";
				ctx.textAlign = "center";
				ctx.fillStyle = "#000000";

				geneTracksArray.map((genesArray, geneIndex) => {
					genesArray.map(gene => {

						let yPos = this.adjPlotMargin.top + geneIndex * eachGeneTrackHeight;

						var left = "\u{2190}";
						var right = "\u{2192}";

						let geneName =
							gene.strand == "+"
								? gene.gene_name + " " + right
								: left + " " + gene.gene_name;

						ctx.fillText(
							geneName,
							gene.xStartPos + (gene.xEndPos - gene.xStartPos) / 2,
							yPos
						);

						ctx.beginPath();
						ctx.lineWidth = 1;
						ctx.strokeStyle = "#000000";
						ctx.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

						ctx.moveTo(gene.xStartPos, yPos + 20);
						ctx.lineTo(gene.xEndPos, yPos + 20);
						ctx.stroke();

						gene.exons.map((exon) => {

							if (exon.start < xMax && exon.end > xMin) {
								let xonStartPos =
									exon.start > xMin
										? xStart +
										(exon.start - xMin) * xPosByPixel
										: xStart;
								let xonEndPos =
									exon.end < xMax
										? xStart +
										(exon.end - xMin) * xPosByPixel
										: xStart + (xMax - xMin) * xPosByPixel;

								let xonWidth =
									xonEndPos - xonStartPos <= 1
										? 1
										: xonEndPos - xonStartPos;

								ctx.fillRect(
									xonStartPos,
									yPos + 10,
									xonWidth,
									20
								);
							}
						});
					})
				})

				if(!!this.starItems) {
					let yPos1 = this.adjPlotMargin.top - (this.adjPlotMargin.bump * 3);
					let yPos2 = this.adjPlotMargin.top + (GENES.length * eachGeneTrackHeight);

					this.starItems.map(star => {
						let xPos = xStart + (star.columns[this.plotConfig["x axis field"]] - xMin) * xPosByPixel;

						this.utils.plotUtils.renderDashedLine(ctx, xPos, yPos1, xPos, yPos2, 3, "#FFAA0055", [6, 2]);
					})
				}

			}			
			
		},
		async getGenesInRegion(region) {

			let fetchUrl;
			let searchPoint = this.plotConfig["genes track"]["search point"];

			if (!!searchPoint) {
				fetchUrl = searchPoint + "/api/bio/query/genes?q=" + region;
			} else {
				fetchUrl = this.utils.uiUtils.biDomain() + "/api/bio/query/genes?q=" + region;
			}

			let genes = await fetch(fetchUrl).then(resp => resp.text(fetchUrl));

			if (genes.error == null) {

				
				let genesInRegion = JSON.parse(genes);
				let codingGenes = "";

				if (!!genesInRegion["data"] && genesInRegion["data"].length > 1) {
					genesInRegion["data"].map((gene) => {
						if ((gene.type = "protein_coding")) {
							codingGenes += "'" + gene.name + "',";
						}
					});

					codingGenes = codingGenes.slice(0, -1);
					
					if (codingGenes.length > 1) {
						this.getGenesData(codingGenes);
					}
				}
			}
		},
		async getGenesData(GENES) {
			
			let fetchUrl;
			if (!!this.plotConfig["genome reference"] && this.plotConfig["genome reference"] == "GRCh38") {
				fetchUrl = "https://portaldev.sph.umich.edu/api/v1/annotation/genes/?filter=source in 1 and gene_name in " + GENES;
			} else if (!this.plotConfig["genome reference"] ||
				(!!this.plotConfig["genome reference"] && 
				(this.plotConfig["genome reference"] == "GRCh37" || this.plotConfig["genome reference"] == "hg19"))) {
				fetchUrl = "https://portaldev.sph.umich.edu/api/v1/annotation/genes/?filter=source in 3 and gene_name in " + GENES;
			}

			let genesData = await fetch(fetchUrl).then(resp => resp.text(fetchUrl));

			if (genesData.error == null) {

				this.localGenesData = JSON.parse(genesData).data;

				this.localGeneTypes = [...new Set(this.localGenesData.map(g => g.gene_type))].sort()

				this.renderTrack(this.localGenesData);
			}
		},
	},
});

$(function () {});
</script>

<style>
.genes-track-setting {
	position: absolute;
	top: -10px;
	right: 5px;
}

.genes-track-setting .options-gear {
	color: #333333;
	padding: 3px 10px;
    border-radius: 15px;
    font-size: 12px;
    margin-right: 10px;
    border: solid 1px #dddddd;
}

.genes-track-setting .options-gear > svg {
	font-size: 12px !important;
}

.genes-track-setting:hover .options-gear {
	color: #000000;
}

.genes-track-setting ul.options {
	display: none;
	position: absolute;
    background-color: #ffffff;
    padding: 15px;
    border: solid 1px #dddddd;
    border-radius: 5px;
    z-index: 10;
    list-style: none;
	right: 0;
	box-shadow: 0px 5px 5px 5px rgb(0 0 0 / 20%)
}

.genes-track-setting ul.options li {
	white-space: nowrap;
}

.genes-track-setting ul.options li label {
	padding-left: 5px;
}

.genes-track-setting:hover ul.options {
	display: block;
}

.genes-plot-wrapper {
	padding: 0 !important;
	width: 100% !important;
}
</style>



