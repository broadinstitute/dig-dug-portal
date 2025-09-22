<template>
	<div>
		SPLICE TRACK GOES HERE
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

export default Vue.component("research-splice-track-vector", {
	props: [
		"genesData",
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
		//this.renderPlot()
	},
	beforeDestroy() {
	},
	computed: {
		selectedSplice(){
			return this.$store.state.selectedSplice;
		}
	},
	watch: {
		selectedSplice(newData){
			console.log("Component received", newData);
		}
	},
	methods: {
		renderPlot() {
			let wrapperClass = `.vector-wrapper-${this.sectionId}`;

			let bitmapWrapper = document.querySelector(
				"#genesTrackWrapper" + this.sectionId
			);

			let margin = {
				left: this.margin.left/2,
				right: this.margin.right / 2,
				top: this.margin.top / 2,
				bottom: this.margin.bottom / 2,
				bump: this.margin.bump / 2,
			}

			let width = !!this.renderConfig['width'] ? this.renderConfig['width'] :
				bitmapWrapper.clientWidth - (margin.left + margin.right);

			let geneTrackHeight = 30;

			let	height = geneTrackHeight * this.genesData.length;

			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "genesTrack" + this.sectionId)
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top);
				//.attr("style","border: solid 1px #999999;");

			svg.append("g")
				.attr("id", "genesTrackVector")
				.attr("transform", "translate(0,0)")
				.style("font-family", "Arial")
				.style("font-size", "12px")
				.style("text-anchor", "middle");

			let x = d3.scaleLinear().domain([this.region.start, this.region.end]).range([margin.left, width + margin.left]);

			this.genesData.map((genesArray, geneIndex) => {
				genesArray.map(gene => {

					let yPos = margin.top + geneIndex * geneTrackHeight;

					var left = "\u{2190}";
					var right = "\u{2192}";

					let geneName =
						gene.strand == "+"
							? gene.gene_name + " " + right
							: left + " " + gene.gene_name;

					let geneStart = (gene.start <= this.region.start)? this.region.start : gene.start,
						geneEnd = (gene.end >= this.region.end) ? this.region.end : gene.end,
						nameXpos = geneStart + (geneEnd - geneStart)/2;

					svg.select("#genesTrackVector")
						.append("text")
						.attr("x", x(nameXpos))
						.attr("y", yPos)
						.attr("font-weight", "700")
						.attr("font-style", "italic")
						.text(geneName);

					svg.select("#genesTrackVector")
						.append('line')
						.attr('x1', x(geneStart))
						.attr('y1', yPos + 10)
						.attr('x2', x(geneEnd))
						.attr('y2', yPos + 10)
						.attr("stroke", "#000000")
						.style("stroke-width", 0.75)

					

					gene.exons.map((exon) => {

						if (exon.start < this.region.end && exon.end > this.region.start) {

							let exonWidth = x(exon.end) - x(exon.start);
								exonWidth = exonWidth < 1 ? 1 : exonWidth;

							svg.select("#genesTrackVector")
								.append("rect")
								.attr("x", x(exon.start))
								.attr("y", yPos + 5)
								.attr("height", 10)
								.attr("width", exonWidth)
								.style("fill", "#000000")

						}
					});
				})
			})
		},
	},
});

$(function () {});
</script>

<style>
</style>



