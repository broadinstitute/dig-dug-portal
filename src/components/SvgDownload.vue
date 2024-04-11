<template>
    <button
      class="btn btn-primary btn-sm download-chart"
      @click="downloadChart()"
    >
      Download plot (.svg)
  </button>
</template>
<script>
import Vue from "vue";
import * as d3 from "d3";

export default Vue.component("SvgDownload", {
    props: {
        chartId: {
            type: String,
            default: ''
        },
        chartClass: {
            type: String,
            default: ''
        },
        filename: {
            type: String,
            default: 'chart'
        }
    },
    data() {
        return {};
    },
    methods: {
      downloadChart() {
        let selector = !!this.chartId ? `#${this.chartId}` 
          : !!this.chartClass ? `.${this.chartClass}` : "";
        // Serialize the SVG to a string
        const svgString = new XMLSerializer().serializeToString(
            d3.select(`svg${selector}`).node()
        );

        // Create a data URL
        const blob = new Blob([svgString], {
            type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);

        // Create a link element and programmatically click it to start the download
        const link = document.createElement("a");
        link.href = url;
        link.download = `${this.filename}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    },
});
</script>
<style>
  button.download-chart {
      float: right;
      margin-bottom: 25px;
  }
</style>