<template>
	<div class="research-knowledge-map" id="research_knowledge_map">
		<div id="k_map_lines_wrapper">
			<svg id="k_map_lines_svg" style="border: solid 1px #000000"></svg>
		</div>
		<div class="k-map-rows-wrapper">
			<div v-for="row in renderConfig['rows']" :key="row.row" class="k-map-row">
				<div v-for="column in row.columns" :key="column.id" :id="'k_map_box_' + column.id" class="k-map-box" :style="getBoxStyles()"
				@mouseenter="highlightMap(column.id, column.highlight)" @mouseleave="cancelHighlights()">
					<div v-if="column.label" class="k-map-box-label">{{ column.label }}</div>
					<div v-if="column.image" class="k-map-box-img"><img :src="column.image.path" /></div>
				</div>
			</div>
		</div>
		
		<div id="k_map_box_detail">
			<research-page-description
				:utils="utils"
				:content="boxDetail"
			></research-page-description>
		</div>
		{{ detailedInfo }}
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import * as d3 from "d3";
import PageDescription from "@/components/researchPortal/ResearchPageDescription.vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-knowledge-map", {
	props: [
		"renderConfig",
		'mapDetails',
		"colors",
		"utils"
	],
	data() {
		return {
			detailedInfo: null,
			boxDetail: "",
			defaultStyle: {
				width: 100,
				height: 75,
				corner: 5,
				hSpace: 15,
				vSpace: 5,
				bgColor: "#ffaa00",
				textColor: "#ffffff",
				textSize: 16
			},
			mapElements: {},
		};
	},
	modules: {
	},
	components: {
		PageDescription,
	},
	created: function () {
		
	},
	mounted: function () {
		this.setMapElements();
	},
	beforeDestroy() {
	},
	computed: {
	},
	watch: {
	},
	methods: {
		highlightMap(FOCUS,ITEMS) {
			let boxes = document.querySelectorAll('.k-map-box');

			[].forEach.call(boxes, function (box) {
				box.classList.add("dimmed");
			});

			ITEMS.map(i =>{
				document.querySelector('#k_map_box_'+i.from).classList.remove("dimmed");
				document.querySelector('#k_map_box_' + i.to).classList.remove("dimmed");
			})

			this.renderLines(FOCUS, ITEMS);

			this.boxDetail = "<div>" + this.mapDetails[FOCUS] + "</div>";

		},
		cancelHighlights() {
			let boxes = document.querySelectorAll('.k-map-box');

			[].forEach.call(boxes, function (box) {
				box.classList.remove("dimmed");
			});

			this.boxDetail = "";

			d3.selectAll("svg > *").remove();
		},

		setMapElements() {

			this.mapElements["rowsLength"] = this.renderConfig.rows.length;
			this.mapElements["columnsLength"] = 0;
			this.mapElements["boxWidth"] = (!!this.renderConfig.styles && this.renderConfig.styles.box) ? this.renderConfig.styles.box.width : this.defaultStyle.width;
			this.mapElements["boxHeight"] = (!!this.renderConfig.styles && this.renderConfig.styles.box) ? this.renderConfig.styles.box.height : this.defaultStyle.height;
			this.mapElements["hSpace"] = (!!this.renderConfig.styles && this.renderConfig.styles.box) ? this.renderConfig.styles.box['h space'] : this.defaultStyle.hSpace;
			this.mapElements["vSpace"] = (!!this.renderConfig.styles && this.renderConfig.styles.box) ? this.renderConfig.styles.box['v space'] : this.defaultStyle.vSpace;

			this.renderConfig.rows.map(row => {
				this.mapElements["columnsLength"] = (this.mapElements["columnsLength"] >= row.columns.length) ? this.mapElements["columnsLength"] : row.columns.length;
			})

			let width = this.mapElements["columnsLength"] * (this.mapElements["boxWidth"] + (this.mapElements["hSpace"] * 2)),
				height = this.mapElements["rowsLength"] * (this.mapElements["boxHeight"] + (this.mapElements["vSpace"] * 2));

				this.mapElements["width"] = width;
				this.mapElements["height"] = height;

				document.querySelector("#research_knowledge_map").setAttribute("style", "height: "+height+"px;")
				document.querySelector("#k_map_lines_svg").setAttribute("style", "width:" + width + "px; height: " + height + "px; border: solid 1px #000000;")

		},

		renderLines(FOCUS, ITEMS) {
			let dimension = this.mapElements;

			let svg = d3.select("#k_map_lines_svg" )
				.append("g")
				.attr("transform", "translate(0,0)");

				svg.append("text")
				.attr("x", (dimension.width / 2))
				.attr("y", (dimension.height /2))
				.style("font-family", "Arial").style("font-size", 12)
				.style("text-anchor", "middle")
				.text('test');

				/*
				
			let localData = [];
			for (const [key, value] of Object.entries(this.renderData)) {
				localData = localData.concat(value);
			}

			let maxField = this.renderConfig['y axis field'].max, 
				minField = this.renderConfig['y axis field'].min,
				medianField = this.renderConfig['y axis field'].median,
				q1Field = this.renderConfig['y axis field'].q1,
				q3Field = this.renderConfig['y axis field'].q3,
				groupField = this.renderConfig['group by'],
				renderField = this.renderConfig['render by'];

			let maxVals = [...new Set(localData.map(d => d[maxField]))],
				minVals = [...new Set(localData.map(d => d[minField]))],
				groupVals = [...new Set(localData.map(d => d[groupField]))],
				colors = this.colors;

			let maxVal = Math.ceil(maxVals.reduce((prev, next) => prev > next ? prev : next)),
				minVal = Math.floor(minVals.reduce((prev, next) => prev < next ? prev : next));

			let sumstat = d3.nest()
				.key(function (d) { return d[renderField] })
				.rollup(function (d) {
					let D= d[0];
					let interQuantileRange = D[q3Field] - D[q1Field];
					return ({ q1: D[q1Field], median: D[medianField], q3: D[q3Field], 
						interQuantileRange: interQuantileRange, min: D[minField], max: D[maxField], name: D[renderField], group: D[groupField] })
				})
				.entries(localData);

			//render axis labels

			svg.append("text")
				.attr("x", (width / 2))
				.attr("y", (height + margin.top - 12))
				.style("font-family", "Arial").style("font-size", 12)
				.style("text-anchor", "middle")
				.text(this.renderConfig['x axis label']);

			svg.append("text")
				.attr("transform", function (d) {
					return "translate("+(-margin.left + 20)+"," + (height/2) + ")rotate(-90)";
				})
				.attr("x", 0)
				.attr("y", 0)
				.style("font-family", "Arial").style("font-size", 12)
				.style("text-anchor", "middle")
				.text(this.renderConfig['y axis label']);



			let x = d3.scaleBand()
				.range([0, width])
				.domain(sumstat.map(s=>s.key))
				.paddingInner(1)
				.paddingOuter(.5);

			let y = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);
				svg.append("g").call(d3.axisLeft(y));

			svg.append("g")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x).tickFormat(() => ""))

			///render group Label
			let groupName = "";
			svg
				.selectAll("groupText")
				.data(sumstat)
				.enter()
				.append("text")
				.attr("transform", function (d) {
					return "translate(" + (x(d.key)-6) + "," + (y(0) + 12) + ")rotate(45)";
				})
				.attr("x", 0)
				.attr("y", 0)
				.style("font-family", "Arial").style("font-size", 11)
				.style("fill", function (d) {
					let keyIndex = groupVals.indexOf(d.value.group) % colors.length;
					let fillColor = colors[keyIndex];
					return fillColor
				})
				.text(function (d) { 
						if(groupName == "") {
							groupName = d.value.group
							return d.value.group
						} else if(d.value.group == groupName) {
							groupName = d.value.group
							return "";
						} else if(d.value.group != groupName) {
							groupName = d.value.group
							return d.value.group;
						}
					}
				);

				// render the main vertical line
			svg
				.selectAll("vertLines")
				.data(sumstat)
				.enter()
				.append("line")
				.attr("x1", function (d) { return (x(d.key)) })
				.attr("x2", function (d) { return (x(d.key)) })
				.attr("y1", function (d) { return (y(d.value.min)) })
				.attr("y2", function (d) { return (y(d.value.max)) })
				.attr("stroke", function (d) {
					let keyIndex = groupVals.indexOf(d.value.group) % colors.length;
					let fillColor = colors[keyIndex];
					return fillColor
				})
				.style("stroke-width", 1)

				//render label lines

			svg
				.selectAll("labelLines")
				.data(sumstat)
				.enter()
				.append("line")
				.attr("x1", function (d) { return (x(d.key)) })
				.attr("x2", function (d) { return (x(d.key)) })
				.attr("y1", function (d) { return (y(d.value.max)) - 3 })
				.attr("y2", function (d) { return (y(d.value.max) - 8 ) })
				.attr("stroke", function (d) {
					let fillColor = "#999999";
					return fillColor
				})
				.style("stroke-width", 1)

				//render labels

			svg
				.selectAll("labelText")
				.data(sumstat)
				.enter()
				.append("text")
				.attr("transform", function (d) {
					return "translate(" + (x(d.key)+3) + "," + (y(d.value.max) - 11) + ")rotate(-90)";
				})
				.attr("x", 0)
				.attr("y", 0)
				.style("font-family", "Arial").style("font-size", 11)
				.text( function(d) { return d.key});


			let boxWidth = ((width - (margin.left + margin.right)) / sumstat.length) - 20;
			boxWidth = boxWidth <= 10 ? 10 : boxWidth >= 40 ? 40 : boxWidth;

			svg
				.selectAll("boxes")
				.data(sumstat)
				.enter()
				.append("rect")
				.attr("x", function (d) { return (x(d.key) - boxWidth / 2) })
				.attr("y", function (d) { return (y(d.value.q3)) })
				.attr("height", function (d) { return (y(d.value.q1) - y(d.value.q3)) })
				.attr("width", boxWidth)
				.attr("stroke", function(d) {
					let keyIndex = groupVals.indexOf(d.value.group) % colors.length;
					let fillColor = colors[keyIndex];
					return fillColor
				})
				.style("fill", "#ffffff")

			svg
				.selectAll("medianLines")
				.data(sumstat)
				.enter()
				.append("line")
				.attr("x1", function (d) { return (x(d.key) - boxWidth / 2) })
				.attr("x2", function (d) { return (x(d.key) + boxWidth / 2) })
				.attr("y1", function (d) { return (y(d.value.median)) })
				.attr("y2", function (d) { return (y(d.value.median)) })
				.attr("stroke", function (d) {
					let keyIndex = groupVals.indexOf(d.value.group) % colors.length;
					let fillColor = colors[keyIndex];
					return fillColor
				})
				.style("stroke-width", 2)
				*/
			
		},
		getBoxStyles() {
			let styles = "";
			let defaultStyle = this.defaultStyle;
			

			if(!!this.renderConfig['styles']) {
				let boxStyles = this.renderConfig['styles']['box'];

				styles += "width:"+((!!boxStyles['width'])? boxStyles['width'] : defaultStyle.width) +"px;";
				styles += "height:" + ((!!boxStyles['height']) ? boxStyles['height'] : defaultStyle.height) + "px;";
				styles += "border-radius:" + ((!!boxStyles['corner']) ? boxStyles['corner'] : defaultStyle.corner) + "px;";
				styles += "margin-left:" + ((!!boxStyles['h space']) ? boxStyles['h space'] : defaultStyle.hSpace) + "px;";
				styles += "margin-right:" + ((!!boxStyles['h space']) ? boxStyles['h space'] : defaultStyle.hSpace) + "px;";
				styles += "margin-top:" + ((!!boxStyles['v space']) ? boxStyles['v space'] : defaultStyle.vSpace) + "px;";
				styles += "margin-bottom:" + ((!!boxStyles['v space']) ? boxStyles['v space'] : defaultStyle.vSpace) + "px;";
				styles += "background-color:" + ((!!boxStyles['color']) ? boxStyles['color'] : defaultStyle.bgColor) + ";";
				styles += "color:" + ((!!boxStyles['text color']) ? boxStyles['text color'] : defaultStyle.textColor) + ";";
				styles += "font-size:" + ((!!boxStyles['text size']) ? boxStyles['text size'] : defaultStyle.textSize) + "px;";
			}

			return styles;
		},
		async getDetails(CONFIG) {
			
			let detailsUrl = CONFIG['data point']['url'];

			let detailsContent = await fetch(detailsUrl).then((resp) => resp.json());

			if (detailsContent.error == null) {
				let details = null;

				// often data is wrapped by multiple layers of wrappers
				let dataWrapper = CONFIG['data point']["data wrapper"];

				// process data by data type
				switch (CONFIG['data point']["data type"]) {

					case "json":
						if (!!dataWrapper) {

							let dataEntity = detailsContent;

							dataWrapper.map(w => {
								dataEntity = dataEntity[w];
							})

							if (!Array.isArray(dataEntity)) {
								dataEntity = [dataEntity];
							}

							details = dataEntity;

						} else {
							details = detailsContent
						}

						break;

					case "csv":

						if (!!dataWrapper) {
							let dataEntity = detailsContent;

							dataWrapper.map(w => {
								dataEntity = dataEntity[w];
							})

							details = this.utils.dataConvert.csv2Json(dataEntity); // convert csv data to json format

						} else {
							details = this.utils.dataConvert.csv2Json(CONTENT); // convert csv data to json format
						}

						break;
				}
				this.detailedInfo = details;

			} else {
				//fetch failed

				
			}
		}
	},
});

$(function () {});
</script>

<style scoped>
.research-knowledge-map {

}
.k-map-row {
	width: 100%;
	text-align: center;
}

#k_map_lines_wrapper, .k-map-rows-wrapper {
	position:absolute;
	left: 50%;
	transform: translate(-50%, 0);
	white-space: nowrap;
}

.k-map-box {
	display: inline-block;
	position: relative;
	opacity: 1;
}

.k-map-box.dimmed {
	opacity: 0.35;
	transition: opacity .15s ease-in-out;
	-moz-transition: opacity .15s ease-in-out;
	-webkit-transition: opacity .15s ease-in-out;
}

.k-map-box-label {
	position:absolute;
	height: auto;
	width: 100%;
	text-align: center;
	white-space: nowrap;
	top: 50%;
	transform: translate(0, -50%)
}

.k-map-box-img {
	position:absolute;
	height: auto;
	width: 100%;
	text-align: center;
	top: 50%;
	transform: translate(0, -50%)
}

.k-map-box-img img {
	width: 90%;
}

</style>



