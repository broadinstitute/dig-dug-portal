<template>
	<div>
		<div class="research-knowledge-map-header" v-text="renderConfig.header"></div>
		<div class="research-knowledge-map" id="research_knowledge_map">
			<div id="k_map_lines_wrapper">
				<svg id="k_map_lines_svg"></svg>
			</div>
			<div class="k-map-rows-wrapper">
				<div v-for="(row) in renderConfig['rows']" :key="row.row" class="k-map-row">
					<div v-for="(column) in row.columns" :key="column.id" :id="'k_map_box_' + column.id" class="k-map-box" :style="getBoxStyles()"
					@mouseenter="highlightMap(column.id, column.highlight)" @mouseleave="cancelHighlights()">
						<div v-if="column.label" class="k-map-box-label">{{ column.label }}</div>
						<div v-if="column.image" class="k-map-box-img"><img :src="column.image.path" /></div>
					</div>
				</div>
			</div>
			
			<div id="k_map_box_detail" class="k-map-box-detail" :style="'margin-left: '+ (mapElements.width + 20)+'px;'">
				<research-page-description
					:utils="utils"
					:content="boxDetail"
				></research-page-description>
			</div>
		</div>
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
		this.boxDetail = "<div>" + this.mapDetails['initial'] + "</div>";
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

			if(!!this.renderConfig.connector && this.renderConfig.connector.includes("highlight")) {
				[].forEach.call(boxes, function (box) {
					box.classList.add("dimmed");
				});

				ITEMS.map(i => {
					document.querySelector('#k_map_box_' + i.from).classList.remove("dimmed");
					document.querySelector('#k_map_box_' + i.to).classList.remove("dimmed");
				})
			}
			console.log('ITEMS', ITEMS)
			if (!!this.renderConfig.connector && this.renderConfig.connector.includes("line")) {
				this.renderLines(ITEMS);
			}

			this.boxDetail = "<div>" + this.mapDetails[FOCUS] + "</div>";

		},
		cancelHighlights() {
			let boxes = document.querySelectorAll('.k-map-box');

			[].forEach.call(boxes, function (box) {
				box.classList.remove("dimmed");
			});

			d3.selectAll("svg > *").remove();

			this.boxDetail = "<div>" + this.mapDetails['initial'] + "</div>";
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
				document.querySelector("#k_map_lines_svg").setAttribute("style", "width:" + width + "px; height: " + height + "px; border-bottom: solid 1px #ff0000")

		},

		renderLines(ITEMS) {
			//map containers
			const svg = document.querySelector("#k_map_lines_svg" );
			const boxesContainer = document.querySelector('.k-map-rows-wrapper');
			const parentRect = boxesContainer.getBoundingClientRect();

			//get elements to connect
			const elements = [];
			ITEMS.map(i => {
				elements.push({
					from: document.querySelector('#k_map_box_' + i.from),
					to: document.querySelector('#k_map_box_' + i.to)
				})
			})

			//creates line svg element
			const drawLine = (x1, y1, x2, y2) => {
				const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				line.setAttribute('x1', x1);
				line.setAttribute('y1', y1);
				line.setAttribute('x2', x2);
				line.setAttribute('y2', y2);
				line.setAttribute('stroke', 'black');
				line.setAttribute('stroke-width', '2');
				svg.appendChild(line);
			}

			//loop through elements and connect by positions
			elements.forEach(box => {
				const fromRect = box.from.getBoundingClientRect();
				const toRect = box.to.getBoundingClientRect();

				let fromAnchor = 0;
				let toAnchor = 0;
				if(fromRect.top === toRect.top){
					//boxes are at same height, line from center to center
					fromAnchor = fromRect.height/2;
					toAnchor = toRect.height/2;
				}else if(fromRect.top < toRect.top){
					//from box is higher up than to box, anchor should be at bottom of from box
					fromAnchor = fromRect.height; 
				}else{
					//from box is lower down than to box, anchor should be at bottom of to box
					toAnchor = toRect.height; 
				}

				const x1 = (fromRect.left - parentRect.left) + fromRect.width/2;
				const y1 = (fromRect.top - parentRect.top) + fromAnchor;
				const x2 = (toRect.left - parentRect.left) + toRect.width/2;
				const y2 = (toRect.top - parentRect.top) + toAnchor;

				drawLine(x1, y1, x2, y2);
			});

			/*
			let getRowColumn = function(ID, renderConfig) {

				let temObj = { row: null, column: null, cLength: null }

				renderConfig.rows.map((row, rIndex) => {
					let cLength = row.columns.length;
					row.columns.map((column, cIndex) => {
						if(column.id == ID) {
							temObj.row = rIndex + 1;
							temObj.column = cIndex + 1;
							temObj.cLength = cLength;
						}
					})
				})

				return temObj
			}

			let linesArr = []

			ITEMS.map(item => {
				let tempObj = {from: null, to: null};

				tempObj.from = getRowColumn(item.from, this.renderConfig);
				tempObj.to = getRowColumn(item.to, this.renderConfig)

				linesArr.push(tempObj);

			})

			console.log('linesArr', linesArr);

			console.log('mapElements', this.mapElements);

			let svg = d3.select("#k_map_lines_svg" );

			linesArr.map(line => {

				let x1, y1, x2, y2;
				let boxColumnDistance = this.mapElements["boxWidth"] + (this.mapElements["hSpace"] * 2),
					boxRowDistance = this.mapElements["boxHeight"] + (this.mapElements["vSpace"] * 2);

					console.log(boxColumnDistance, boxRowDistance);
				
				// First get 'from' position

				let fromColumnWidth = line.from.cLength * boxColumnDistance,
					maxWidth = this.mapElements.width,
					fromWidthDiff = maxWidth - fromColumnWidth;

				x1 = (fromWidthDiff / 2) + (line.from.column * boxColumnDistance) - (boxColumnDistance / 2);
				y1 = (line.from.row * boxRowDistance) - (boxRowDistance / 2);

				// Then get 'to' position
				let toColumnWidth = line.to.cLength * boxColumnDistance,
					toWidthDiff = maxWidth - toColumnWidth;

				x2 = (toWidthDiff / 2) + (line.to.column * boxColumnDistance) - (boxColumnDistance / 2);
				y2 = (line.to.row * boxRowDistance) - (boxRowDistance / 2);

				y1 = (y1 < y2) ? y1 + (this.mapElements["boxHeight"]/2) :
					(y1 > y2) ? y1 - (this.mapElements["boxHeight"] / 2) : y1;

				y2 = (y2 < y1) ? y2 + (this.mapElements["boxHeight"] / 2) :
					(y2 > y1) ? y2 - (this.mapElements["boxHeight"] / 2) : y2;	


				svg.append("line")
					.attr("x1", x1)
					.attr("x2", x2)
					.attr("y1", y1)
					.attr("y2", y2)
					.attr("stroke", "#000000")
					.style("stroke-width", 1)
			})
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
		/*
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
			*/
	},
});

$(function () {});
</script>

<style scoped>
.research-knowledge-map {

}

.research-knowledge-map-header {
	font-size: 26px;
}
.k-map-row {
	width: 100%;
	text-align: center;
}

#k_map_lines_wrapper, .k-map-rows-wrapper {
	position:absolute;
	/*left: 50%;
	transform: translate(-50%, 0);*/

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

.k-map-box-detail {
	position: relative;
}

</style>



