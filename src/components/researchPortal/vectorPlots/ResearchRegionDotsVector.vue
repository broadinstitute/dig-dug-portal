<template>
	<div>
		<div :id="'vector_wrapper_'+sectionId" :class="'vector-wrapper-'+ sectionId">

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

export default Vue.component("research-region-dots-vector", {
	props: [
		"renderData",
		"colorGroups",
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
		console.log("Research region dots vector created");
	},
	mounted: function () {
		//this.renderPlot()
	},
	beforeDestroy() {
	},
	computed: {
		canvasId() {
			let canvasId = this.sectionId.replaceAll("_","-").toLowerCase();
			return canvasId;
		}
	},
	watch: {
		canvasId(ID) {
		}
	},
	methods: {
		renderPlot() {

			// this part needed to get exact width of legend texts
			let canvas = document.createElement('canvas'),
				context = canvas.getContext('2d');

			let getWidth = function (text, fontSize, fontFace) {
				context.font = fontSize + 'px ' + fontFace;
				return context.measureText(text).width;
			}

			let margin = {
				left: this.margin.left / 2,
				right: this.margin.right / 2,
				top: this.margin.top / 2,
				bottom: this.margin.bottom / 2,
				bump: this.margin.bump / 2,
			}

			let wrapperClass = `.vector-wrapper-${this.sectionId}`;

			let bitmapWrapper = document.querySelector(
				'#region_track_wrapper' + this.sectionId
			);

			let colorGroupsWidth = 0;
			this.colorGroups.map(c => colorGroupsWidth += (getWidth(c, 12, "Arial") + 20));

			let width = !!this.renderConfig['width'] ? this.renderConfig['width'] : bitmapWrapper.clientWidth - (margin.left + margin.right);

			let legendLines = Math.ceil(((this.colorGroups.length * 20) + colorGroupsWidth) / width);
			margin.top = margin.top + (20 * legendLines);

			let height = !!this.renderConfig['track height'] ? this.renderConfig['track height'] : 200;


			// set up svg 
			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "vector_region_dots_" + this.sectionId)
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);
			//.attr("style","border: solid 1px #999999;");

			svg.append("g")
				.attr("id", "plot")
				.attr("transform", "translate(0,0)");

			//render legends

			let prevX = margin.bump;
			let yPos = 20;
			this.colorGroups.map((text, tIndex) => {
				let colorIndex = !!this.renderConfig["color by"] ? tIndex % this.colors.moderate.length : null,
					fillColor = !!colorIndex || colorIndex === 0 ? this.colors.moderate[colorIndex] : "#00000066";

				svg.select("#plot")
					.append("rect")
					.attr("x", prevX)
					.attr("y", yPos - 12)
					.attr("height", 12)
					.attr("width", 12)
					.style("fill", fillColor)

				let txtWidth = getWidth(text, 12, "Arial")

				svg.select("#plot")
					.append("text")
					.attr("x", prevX + 15)
					.attr("y", yPos)
					.style("text-anchor", "start")
					.text(text);

				txtWidth = txtWidth + getWidth(this.colorGroups[tIndex + 1], 12, "Arial")

				if ((prevX + txtWidth + 20) > (width + margin.left)) {
					prevX = margin.bump;
					yPos += 20;
				} else {
					prevX += getWidth(text, 12, "Arial") + 20;
				}
			})


			//render Labels
			svg.select("#plot")
				.style("font-family", "Arial")
				.style("font-size", "12px")
				.style("text-anchor", "middle")

			svg.select("#plot")
				.append("text")
				.attr("transform", "translate(" + (margin.bump + 20) + "," + (margin.top + (height / 2)) + ")rotate(-90)")
				.attr("x", 0)
				.attr("y", 0)
				.text(this.renderConfig['y axis label']);

			// render axis

			let x = d3.scaleLinear().domain([this.region.start, this.region.end]).range([margin.left, width + margin.left]);

			svg.select("#plot")
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

				svg.select("#plot")
					.append('line')
					.attr('x1', tickXPos)
					.attr('y1', margin.top + height + margin.bump)
					.attr('x2', tickXPos)
					.attr('y2', margin.top + height + (margin.bump * 2))

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

				svg.select("#plot")
					.append("text")
					.attr("x", tickXPos)
					.attr("y", margin.top + height + 20)
					.style("text-anchor", "middle")
					.text(positionLabel);
			}

			let xField = this.renderConfig["x axis field"],
				yField = this.renderConfig["y axis field"];

			let maxY = this.renderData.high,
				minY = this.renderData.low;

			
			let yStep = (maxY - minY) / 2;
			let yArr = []

			for (let i = 0; i < 3; i++) {
				
				let yMayMinGap = maxY - minY;
				let yDecimal = yMayMinGap <= 1 ? 2 : yMayMinGap <= 50 ? 1 : 0;

				let yNum = this.utils.Formatters.decimalFormatter(
					maxY - i * yStep,
					yDecimal
				);

				yNum =
					yNum >= 100000
						? Math.round(yNum * 0.001) + "k"
						: yNum;

				yArr.push(yNum)
			}

			minY = Number(yArr[2]), maxY = Number(yArr[0]);				

			let y = d3.scaleLinear().domain([minY, maxY]).range([margin.top + height, margin.top]);

			svg.select("#plot")
				.append("g")
				.attr("transform", "translate(" + (margin.left - margin.bump) + ",0)")
				.call(d3.axisLeft(y).ticks(2));


			//render dots

			this.colorGroups.map((color, cIndex) => {

				let coloredData = this.renderData.data.filter(d => d[this.renderConfig["color by"]] === color);
				let colorIndex = cIndex % this.colors.moderate.length;
				let dotColor = !!colorIndex || colorIndex === 0 ? this.colors.moderate[colorIndex] : "#00000066";

				coloredData.map((value, vIndex) => {
					let xVal = value[xField];
					let yVal = value[yField];

					if (xVal >= this.region.start && xVal <= this.region.end && !!yVal) {
						let xPos = x(xVal);
						let yPos = y(yVal);

						svg.select("#plot")
							.append('circle')
							.attr('cx', xPos)
							.attr('cy', yPos)
							.attr('r', 5)
							.style('fill', dotColor);

					}
				})
			})
		},
	},
});

$(function () {});
</script>

<style>
</style>



