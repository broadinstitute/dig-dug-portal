<template>
	<div>
		<div :id="'vector_wrapper_'+sectionId" :class="'vector-wrapper-'+ canvasId">

		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import * as d3 from "d3";
import { cloneDeep } from "lodash";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-region-track-vector", {
	props: [
		"renderData",
		"renderConfig",
		"colors",
		"margin",
		"region",
		"sectionId",
		"utils"
	],
	data() {
		return {
		};
	},
	modules: {
	},
	components: {},
	created: function () {
	},
	mounted: function () {
		//this.renderRegionTrack()
	},
	beforeDestroy() {
	},
	computed: {
		canvasId() {
			let canvasId = this.sectionId.replaceAll("_","-").toLowerCase();
			return canvasId;
		},
	},
	watch: {
		canvasId(ID) {
		},
	},
	methods: {
		renderPlot() {
			let wrapperClass = `.vector-wrapper-${this.canvasId}`;

			// this part needed to get exact width of legend texts
			let canvas = document.createElement('canvas'),
				context = canvas.getContext('2d');

			let getWidth = function (text, fontSize, fontFace) {
				context.font = fontSize + 'px ' + fontFace;
				return context.measureText(text).width;
			}

			///

			let bitmapWrapper = document.querySelector(
				"#region_track_wrapper" + this.sectionId
			);

			let margin = {
				left: this.margin.left/2,
				right: this.margin.right / 2,
				top: this.margin.top / 2,
				bottom: this.margin.bottom / 2,
				bump: this.margin.bump / 2,
			}

			let trackGroups = Object.keys(this.renderData).sort();
			let colorGroups = [];
			
			Object.values(this.renderData).map(value=>{
				Object.values(value).map(region=>{
					region.map(r => {
						colorGroups.push(r[this.renderConfig['color by']])
					})
				})
			})

			colorGroups = [...new Set(colorGroups)].sort();

			let colorGroupsWidth = 0;
			colorGroups.map(c => colorGroupsWidth += (getWidth(c, 12, "Arial") + 20));
			
			let width = !!this.renderConfig['width']? this.renderConfig['width']: 
				bitmapWrapper.clientWidth - (margin.left + margin.right);

			let legendLines =  Math.ceil(((colorGroups.length * 20)+colorGroupsWidth) /width);
			margin.top = margin.top + (20 * legendLines);

			let height = this.renderConfig['track height'] * trackGroups.length;

			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "vector_region_track_"+this.sectionId )
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);

			svg.append("g")
				.attr("id", "tracksGroup")
				.attr("transform", "translate(0,0)")
				.style("font-family", "Arial")
				.style("font-size", 12)
				.style("text-anchor", "start");

			// render legends first

			let prevX = margin.bump;
			let yPos = 20;
			colorGroups.map( (text, tIndex) => {
				let colorIndex = !!this.renderConfig["color by"] ? tIndex % this.colors.length : null,
					fillColor = !!colorIndex || colorIndex === 0 ? this.colors[colorIndex] : "#00000066";

				svg.select("#tracksGroup")
					.append("rect")
					.attr("x", prevX)
					.attr("y", yPos - 12)
					.attr("height", 12)
					.attr("width", 12)
					.style("fill", fillColor)

				let txtWidth = getWidth(text, 12, "Arial")

				svg.select("#tracksGroup")
					.append("text")
					.attr("x", prevX + 15)
					.attr("y", yPos)
					.text(text);

				txtWidth = txtWidth + getWidth(colorGroups[tIndex+1], 12, "Arial")

				if((prevX + txtWidth + 20) > (width + margin.left)) {
					prevX = margin.bump;
					yPos += 20;
				} else {
					prevX += getWidth(text, 12, "Arial") + 20;
				}
			})

			let x = d3.scaleLinear().domain([this.region.start, this.region.end]).range([margin.left, width + margin.left]);

			svg.select("#tracksGroup")
				.append('line')
				.attr('x1', margin.left - margin.bump)
				.attr('y1', margin.top + height + margin.bump)
				.attr('x2', margin.left + width + margin.bump)
				.attr('y2', margin.top + height + margin.bump)
				.attr("stroke", "#000000")
				.style("stroke-width", 0.75)

			let xStep = Math.ceil((this.region.end - this.region.start) / 5);

			for (let i = 0; i < 6; i++) {

				let tickXPos = x(this.region.start + (xStep * i));

				svg.select("#tracksGroup")
					.append('line')
					.attr('x1', tickXPos)
					.attr('y1', margin.top + height + margin.bump)
					.attr('x2', tickXPos)
					.attr('y2', margin.top + height + (margin.bump*2))
					.attr("stroke", "#000000")
					.style("stroke-width", 0.75)

				let xMaxMinGap = this.region.end - this.region.start;
				let xDecimal = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;

				let positionLabel = this.utils.Formatters.decimalFormatter(
					this.region.start + i * xStep,
					xDecimal
				);

				positionLabel =
					positionLabel >= 100000
						? Math.round(positionLabel * 0.001) + "k"
						: positionLabel;

				svg.select("#tracksGroup")
					.append("text")
					.attr("x", tickXPos)
					.attr("y", margin.top + height + 20)
					.style("text-anchor", "middle")
					.text(positionLabel);
			}


			svg.select("#tracksGroup")
				.append('line')
				.attr('x1', margin.left - margin.bump)
				.attr('y1', margin.top)
				.attr('x2', margin.left - margin.bump)
				.attr('y2', margin.top + height + margin.bump)
				.attr("stroke", "#000000")
				.style("stroke-width", 0.75)

			svg.select("#tracksGroup")
				.append('line')
				.attr('x1', margin.left + width + margin.bump)
				.attr('y1', margin.top)
				.attr('x2', margin.left + width + margin.bump)
				.attr('y2', margin.top + height + margin.bump)
				.attr("stroke", "#000000")
				.style("stroke-width", 0.75)

			//svg.select("#tracksGroup")

			trackGroups.map((group,gIndex) =>{

				let trackLabel = "";
				let txtWidth = getWidth(group, 12, "Arial")

				if (txtWidth > (margin.left - margin.bump)) {
					for (let i = 0; i < group.length; i++) {
						if (getWidth(trackLabel + group[i], 12, "Arial") < (margin.left - (margin.bump*6))) {
							trackLabel = trackLabel + group[i];
						}
					}
					trackLabel += "..."
				} else {
					trackLabel = group;
				}

				svg.select("#tracksGroup")
					.append("text")
					.attr("x", margin.bump)
					.attr("y", (gIndex * this.renderConfig['track height']) + margin.top + 10)
					.text(trackLabel);

				if(gIndex%2 == 0) {
					svg.select("#tracksGroup")
						.append("rect")
						.attr("x", margin.left)
						.attr("y", (gIndex * this.renderConfig['track height']) + margin.top)
						.attr("height", this.renderConfig['track height'])
						.attr("width", width)
						.style("fill", "#eeeeee")
				}

				Object.keys(this.renderData[group]).map(key=>{
					let region = key.split("-"),
						start = x(region[0]) < x(this.region.start)? x(this.region.start) : x(region[0]),
						end = x(region[1]) > x(this.region.end) ? x(this.region.end) : x(region[1]),
						blockWidth = ((end - start) < 1)? 1 : end - start;

					this.renderData[group][key].map(block=>{
						let colorIndex = !!this.renderConfig["color by"] ? (colorGroups.indexOf(block[this.renderConfig["color by"]]) % this.colors.length) : null,
							fillColor = !!colorIndex || colorIndex === 0 ? this.colors[colorIndex] : "#00000066";


						svg.select("#tracksGroup")
							.append("rect")
							.attr("x", start)
							.attr("y", (gIndex * this.renderConfig['track height']) + margin.top)
							.attr("height", this.renderConfig['track height'])
							.attr("width", blockWidth)
							.style("fill", fillColor)
					})
				})
			})

		
		},
	},
});

$(function () {});
</script>

<style>
</style>



