<template>
  <b-dropdown class="download-chart" variant="secondary" right size="sm" text="Download chart">
      <b-dropdown-text>Save chart as</b-dropdown-text>
      <b-dropdown-divider></b-dropdown-divider>
      <b-dropdown-item @click="downloadSvg()">SVG</b-dropdown-item>
      <b-dropdown-item @click="downloadPng()">PNG</b-dropdown-item>
  </b-dropdown>
</template>
<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import * as d3 from "d3";
export default Vue.component("DownloadChart", {
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
      svgUrl(){
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
        return URL.createObjectURL(blob);
      },
      downloadSvg() {
        uiUtils.downloadChart(this.svgUrl(), `${this.filename}.svg`);
      },
      downloadPng() {
        let img = new Image();
        img.src = this.svgUrl();
        let filename = `${this.filename}.png`;
        img.onload = function(){
            let canvas = document.createElement("canvas");
            canvas.width = this.width;
            canvas.height = this.height;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0);
            let dataUrl = canvas.toDataURL("image/png");
            uiUtils.downloadChart(dataUrl, filename);
        }
      },
    },
});
</script>
<style>
  .download-chart {
      float: right;
      margin-bottom: 25px;
  }
</style>