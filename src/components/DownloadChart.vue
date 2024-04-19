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
        required: true,
      },
      filename: {
        type: String,
        default: 'chart'
      },
      transparentPng: {
        type: Boolean,
        default: true
      },
    },
    data() {
        return {};
    },
    computed: {
      isCanvas(){
        return document.querySelector(`canvas#${this.chartId}`) !== null;
      }
    },
    methods: {
      svgUrl(){
        // Serialize the SVG to a string
        const svgString = new XMLSerializer().serializeToString(
            d3.select(`svg#${this.chartId}`).node()
        );
        // Create a data URL
        const blob = new Blob([svgString], {
            type: "image/svg+xml;charset=utf-8",
        });
        return URL.createObjectURL(blob);
      },
      downloadSvg() {
        if (this.isCanvas){
          this.downloadCanvasToSvg();
          return;
        }
        uiUtils.downloadChart(this.svgUrl(), `${this.filename}.svg`);
      },
      downloadPng() {
        if (this.isCanvas){
          this.downloadCanvasToPng();
          return;
        }
        let img = new Image();
        img.src = this.svgUrl();
        let filename = `${this.filename}.png`;
        let transparent = this.transparentPng;
        img.onload = function(){
            let canvas = document.createElement("canvas");
            canvas.width = this.width;
            canvas.height = this.height;
            let ctx = canvas.getContext("2d");
            if (!transparent){
              ctx.fillStyle = "white";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(this, 0, 0);
            let dataUrl = canvas.toDataURL("image/png");
            uiUtils.downloadChart(dataUrl, filename);
        }
      },
      downloadCanvasToPng(){
        let canvas = document.querySelector(`canvas#${this.chartId}`);
        let dataUrl = canvas.toDataURL("image/png");
        uiUtils.downloadChart(dataUrl, `${this.filename}.png`);
      },
      downloadCanvasToSvg(){
        let canvas = document.querySelector(`canvas#${this.chartId}`);
        let dataUrl = canvas.toDataURL("image/png");
        let image = `<image height="${canvas.height}" width="${canvas.width
          }" y="0" x="0" xlink:href="${dataUrl}" id="importedCanvas_0"/>`;
        let svg = `<svg xmlns:xlink="http://www.w3.org/1999/xlink" height="${canvas.height
          }" width="${canvas.width}" xmlns="http://www.w3.org/2000/svg" id="svg">${image}</svg>`
        console.log(svg);
      }
    },
});
</script>
<style>
  .download-chart {
      float: right;
      margin-bottom: 25px;
  }
</style>