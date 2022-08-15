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
		pageContent(content) {
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
				let innerHtml = plots[i].innerHTML
					.replace(/<p>/g, "")
					.replace(/<\/p>/g, "")
					.replace(/<br>/g, "");
				this.plotData[i] = JSON.parse(innerHtml);

				let labelSpace = !!this.plotData[i]["label space"]
					? this.plotData[i]["label space"]
					: 0;

				let plotContent =
					"<canvas id='plot" +
					i +
					"' width='" +
					this.plotData[i].width +
					"' height='" +
					(this.plotData[i].height + labelSpace) +
					"'></canvas>";

				plots[i].innerHTML = plotContent;
				plots[i].setAttribute("class", "");
			}

			this.plotData.map((p, pIndex) => {
				if (!p["x label angle"]) {
					p["x label angle"] = null;
				}
				if (!p["y label angle"]) {
					p["y label angle"] = null;
				}
			});

			this.plotData.map((p, pIndex) => {
				let c, ctx;

				c = document.getElementById("plot" + pIndex);
				ctx = c.getContext("2d");

				switch (p.type) {
					case "bar":
						this.renderBarPlot(
							ctx,
							p.data,
							p.width,
							p.height,
							p.color,
							p["x label angle"],
							p["y label angle"]
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
						this.renderLinePlot(
							ctx,
							p.data,
							p.width,
							p.height,
							p["x label angle"],
							p["y label angle"]
						);
						break;
				}
			});
		},
		renderBarPlot(
			CTX,
			DATA,
			WIDTH,
			HEIGHT,
			COLOR,
			X_LBL_ANGLE,
			Y_LBL_ANGLE
		) {
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

			let minMaxGap = valueHiLow.high * 0.2;
			valueHiLow.high = Math.ceil(valueHiLow.high + minMaxGap);

			if (
				Math.floor(valueHiLow.low) >= 0 &&
				Math.floor(valueHiLow.low - minMaxGap) < 0
			) {
				valueHiLow.low = 0;
			} else {
				valueHiLow.low = Math.floor(valueHiLow.low - minMaxGap);
			}

			PlotUtils.renderAxis(
				CTX,
				WIDTH,
				HEIGHT,
				margin,
				"y",
				5,
				valueHiLow.low,
				valueHiLow.high
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
				spacer,
				X_LBL_ANGLE
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

			let minMaxGap = valueHiLow.high * 0.2;
			valueHiLow.high = Math.ceil(valueHiLow.high + minMaxGap);
			//valueHiLow.low = Math.floor(valueHiLow.low - minMaxGap);

			if (
				Math.floor(valueHiLow.low) >= 0 &&
				Math.floor(valueHiLow.low - minMaxGap) < 0
			) {
				valueHiLow.low = 0;
			} else {
				valueHiLow.low = Math.floor(valueHiLow.low - minMaxGap);
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
	watch: {
		pageContent() {
			this.renderPlots();
		},
	},
});
</script>

<style>
</style>
