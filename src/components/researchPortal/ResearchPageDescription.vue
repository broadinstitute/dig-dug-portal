<template>
	<div class="col-md-12 page-description-content" v-html="pageContent"></div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters.js";

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
				this.plotData[i] = JSON.parse(plots[i].innerHTML);

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
						this.renderBarPlot(ctx, p.data, p.width, p.height);
						break;

					case "pie":
						this.renderPiePlot(ctx, p.data, p.width, p.height);
						break;

					case "line":
						this.renderlinePlot(ctx, p.data, p.width, p.height);
						break;
				}
			});
		},
		renderBarPlot(CTX, DATA, WIDTH, HEIGHT) {
			let margin = this.plotMargin;
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

			let valueBump = (valueHiLow.high - valueHiLow.low) / 5;

			valueHiLow.high = Math.round(valueHiLow.high + valueBump);
			valueHiLow.low = Math.round(valueHiLow.low - valueBump);

			CTX.beginPath();
			CTX.lineWidth = 0.5;
			CTX.strokeStyle = "#000000";
			CTX.font = "12px Arial";
			CTX.fillStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			// render y axis
			CTX.moveTo(margin.left, margin.top);
			CTX.lineTo(margin.left, HEIGHT - margin.bottom);
			CTX.stroke();

			// render x axis
			CTX.moveTo(margin.left, HEIGHT - margin.bottom);
			CTX.lineTo(WIDTH - margin.right, HEIGHT - margin.bottom);
			CTX.stroke();

			// Y ticks
			let yStep = (valueHiLow.high - valueHiLow.low) / 5;
			let yTickDistance = (HEIGHT - margin.top - margin.bottom) / 5;
			for (let i = 0; i < 6; i++) {
				let tickYPos = margin.top + i * yTickDistance;
				let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
				CTX.moveTo(margin.left, adjTickYPos);
				CTX.lineTo(margin.left - margin.bump, adjTickYPos);
				CTX.stroke();

				CTX.textAlign = "right";

				let tickValue =
					i == 5
						? valueHiLow.low
						: Formatters.floatFormatter(
								valueHiLow.high - i * yStep
						  );

				CTX.fillText(
					tickValue,
					margin.left - margin.bump * 2,
					adjTickYPos + 3
				);
			}

			///render bars
			var spacer = 5;
			var barWidth =
				(WIDTH -
					margin.left -
					margin.right -
					spacer * (Object.keys(DATA).length + 1)) /
				Object.keys(DATA).length;

			for (const [key, value] of Object.entries(DATA)) {
			}
		},
		renderPiePlot(CTX, DATA, WIDTH, HEIGHT) {
			console.log(CTX, DATA, WIDTH, HEIGHT);
		},
		renderLinePlot(CTX, DATA, WIDTH, HEIGHT) {
			console.log(CTX, DATA, WIDTH, HEIGHT);
		},
	},
	watch: {},
});
</script>

<style>
</style>
