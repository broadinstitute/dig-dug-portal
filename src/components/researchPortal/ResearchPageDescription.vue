<template>
	<div class="col-md-12 page-description-content" v-html="pageContent"></div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters.js";
import PlotUtils from "@/utils/plotUtils.js";

export default Vue.component("research-page-description", {
	props: ["content"],
	components: {},

	data() {
		return {
			plotData: [],
			plotMargin: {
				left: 50.5,
				right: 10.5,
				top: 10.5,
				bottom: 30.5,
				bump: 5,
			},
		};
	},
	mounted() {
		this.renderPlots();
	},
	computed: {
		pageContent() {
			let formattedContent = this.content
				.replace(/&lt;plot&gt;/g, "<div class='plot'>")
				.replace(/&lt;plot-end&gt;/g, "</div>");
			return formattedContent;
		},
	},
	methods: {
		renderPlots() {
			var plots = document.querySelectorAll("div.plot");

			for (let i = 0; i < plots.length; ++i) {
				//console.log(plots[i].innerHTML);
				//[/<p>&nbsp;<\/p>/g,""],
				let innerHtml = plots[i].innerHTML
					.replace(/<p>/g, "")
					.replace(/<\/p>/g, "")
					.replace(/<br>/g, "");
				this.plotData[i] = JSON.parse(innerHtml);

				let plotContent =
					"<canvas id='plot" +
					i +
					"' width='" +
					this.plotData[i].width +
					"' height='" +
					this.plotData[i].height +
					"'></canvas>";

				plots[i].innerHTML = plotContent;
			}

			this.plotData.map((p, pIndex) => {
				let c, ctx;

				c = document.getElementById("plot" + pIndex);
				ctx = c.getContext("2d");
				//ctx.fillRect(20, 20, 150, 100);
				switch (p.type) {
					case "bar":
						this.renderBarPlot(
							ctx,
							p.data,
							p.width,
							p.height,
							p.color
						);
						break;

					case "pie":
						this.renderPiePlot(
							ctx,
							p.data,
							p.width,
							p.height,
							p.color
						);
						break;

					case "line":
						this.renderLinePlot(ctx, p.data, p.width, p.height);
						break;
				}
			});
		},
		renderBarPlot(CTX, DATA, WIDTH, HEIGHT, COLOR) {
			//console.log("color", COLOR);
			let margin = this.plotMargin;
			let spacer = 10;
			let valueHiLow = { high: null, low: null };

			for (const [key, value] of Object.entries(DATA)) {
				if (valueHiLow.high == null) {
					valueHiLow.high = value;
				}

				if (valueHiLow.low == null) {
					valueHiLow.low = value;
				}

				valueHiLow.high =
					value > valueHiLow.high ? value : valueHiLow.high;
				valueHiLow.low =
					value < valueHiLow.low ? value : valueHiLow.low;
			}

			PlotUtils.renderAxis(
				CTX,
				WIDTH,
				HEIGHT,
				margin,
				"y",
				5,
				valueHiLow.low,
				valueHiLow.high,
				2
			);

			PlotUtils.renderGuideLine(
				CTX,
				WIDTH,
				HEIGHT,
				margin,
				"y",
				5,
				valueHiLow.low,
				valueHiLow.high
			);

			PlotUtils.renderAxis(CTX, WIDTH, HEIGHT, margin, "x", null);

			PlotUtils.renderTicksByKeys(
				CTX,
				WIDTH,
				HEIGHT,
				margin,
				"x",
				Object.keys(DATA),
				spacer
			);

			///render bars
			PlotUtils.renderBars(
				CTX,
				WIDTH,
				HEIGHT,
				margin,
				"x",
				5,
				DATA,
				valueHiLow.low,
				valueHiLow.high,
				spacer,
				COLOR
			);
		},
		renderPiePlot(CTX, DATA, WIDTH, HEIGHT, COLOR) {
			PlotUtils.renderPie(CTX, DATA, WIDTH, HEIGHT, COLOR);
		},
		renderLinePlot(CTX, DATA, WIDTH, HEIGHT) {
			//console.log(CTX, DATA, WIDTH, HEIGHT);
			let margin = this.plotMargin;
			let valueHiLow = { high: null, low: null };

			for (const [key, value] of Object.entries(DATA)) {
				for (const [vKey, vValue] of Object.entries(value)) {
					if (valueHiLow.high == null) {
						valueHiLow.high = vValue;
					}

					if (valueHiLow.low == null) {
						valueHiLow.low = vValue;
					}

					valueHiLow.high =
						vValue > valueHiLow.high ? vValue : valueHiLow.high;
					valueHiLow.low =
						vValue < valueHiLow.low ? vValue : valueHiLow.low;
				}
			}

			PlotUtils.renderAxis(
				CTX,
				WIDTH,
				HEIGHT,
				margin,
				"y",
				5,
				valueHiLow.low,
				valueHiLow.high,
				2
			);

			PlotUtils.renderAxis(CTX, WIDTH, HEIGHT, margin, "x", null);

			let keys = Object.keys(DATA[Object.keys(DATA)[0]]);

			PlotUtils.renderTicksByKeys(
				CTX,
				WIDTH,
				HEIGHT,
				margin,
				"x",
				keys,
				0
			);

			PlotUtils.renderGuideLine(
				CTX,
				WIDTH,
				HEIGHT,
				margin,
				"y",
				5,
				valueHiLow.low,
				valueHiLow.high
			);

			PlotUtils.renderLine(
				CTX,
				WIDTH,
				HEIGHT,
				margin,
				"x",
				5,
				DATA,
				valueHiLow.low,
				valueHiLow.high
			);
		},
	},
	watch: {},
});
</script>

<style>
</style>
