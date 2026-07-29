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
export default Vue.component("DownloadChart", {
    props: {
      chartId: {
        type: String,
        required: true,
      },
      titleText: {
        type: String,
        default: ""
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
        return this.getSvgNodes().length === 0 && this.getCanvasNode() !== null;
      }
    },
    methods: {
      createSvgElement(tagName){
        return document.createElementNS("http://www.w3.org/2000/svg", tagName);
      },
      getTargetElement(id = this.chartId){
        return document.getElementById(id);
      },
      getCanvasNode(){
        const target = this.getTargetElement();
        if(!target){
          return null;
        }
        if(target.tagName?.toLowerCase() === "canvas"){
          return target;
        }
        const canvases = Array.from(target.querySelectorAll("canvas"));
        const visibleCanvas = canvases.find((canvas) => {
          const style = window.getComputedStyle(canvas);
          return style.display !== "none" && style.visibility !== "hidden";
        });
        return visibleCanvas || canvases[0] || null;
      },
      getSvgNodes(id = this.chartId){
        const target = this.getTargetElement(id);
        if(!target){
          return [];
        }
        if(target.tagName?.toLowerCase() === "svg"){
          return [target];
        }
        return Array.from(target.querySelectorAll("svg"));
      },
      getSvgSize(svgNode){
        const viewBox = svgNode.viewBox?.baseVal;
        const width = parseFloat(svgNode.getAttribute("width")) || svgNode.clientWidth || viewBox?.width || 0;
        const height = parseFloat(svgNode.getAttribute("height")) || svgNode.clientHeight || viewBox?.height || 0;
        return { width, height };
      },
      escapeXml(text = ""){
        return String(text)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
      },
      getTextMarkup(element, yOffset){
        const text = element.innerText?.trim();
        if(!text){
          return null;
        }

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const fontSize = parseFloat(style.fontSize) || 16;
        const lineHeight = parseFloat(style.lineHeight) || rect.height || fontSize * 1.2;
        const fontWeight = style.fontWeight || "400";
        const fontFamily = style.fontFamily || "Arial";
        const fill = style.color || "#000";
        const opacity = style.opacity || "1";
        const x = parseFloat(style.paddingLeft) || 0;

        return {
          width: rect.width,
          height: Math.max(rect.height, lineHeight),
          x,
          y: yOffset,
          text,
          fontSize,
          fontWeight,
          fontFamily,
          fill,
          opacity
        };
      },
      getTitleMarkup(yOffset, width){
        if(!this.titleText){
          return null;
        }

        return {
          width,
          height: 32,
          x: 0,
          y: yOffset,
          text: this.titleText,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "Arial",
          fill: "#212529",
          opacity: 1
        };
      },
      appendTextNode(svgRoot, textItem){
        const textNode = this.createSvgElement("text");
        textNode.setAttribute("x", `${textItem.x}`);
        textNode.setAttribute("y", `${textItem.y}`);
        textNode.setAttribute("font-size", `${textItem.fontSize}`);
        textNode.setAttribute("font-weight", `${textItem.fontWeight}`);
        textNode.setAttribute("font-family", textItem.fontFamily);
        textNode.setAttribute("fill", textItem.fill);
        textNode.setAttribute("opacity", `${textItem.opacity}`);
        textNode.setAttribute("dominant-baseline", "hanging");
        textNode.textContent = textItem.text;
        svgRoot.appendChild(textNode);
      },
      appendSvgNode(svgRoot, svgNode, yOffset){
        const groupNode = this.createSvgElement("g");
        groupNode.setAttribute("transform", `translate(0, ${yOffset})`);
        Array.from(svgNode.childNodes).forEach((childNode) => {
          groupNode.appendChild(childNode.cloneNode(true));
        });
        svgRoot.appendChild(groupNode);
      },
      collectContainerItems(node, items){
        const tagName = node.tagName?.toLowerCase();
        if(tagName === "svg"){
          items.push({ type: "svg", node });
          return;
        }

        const children = Array.from(node.children || []);
        if(children.length === 0){
          if(node.innerText?.trim()){
            items.push({ type: "text", node });
          }
          return;
        }

        const hasSvgDescendant = children.some((child) => {
          return child.tagName?.toLowerCase() === "svg" || child.querySelector("svg");
        });

        if(!hasSvgDescendant && node.innerText?.trim()){
          items.push({ type: "text", node });
          return;
        }

        children.forEach((child) => this.collectContainerItems(child, items));
      },
      getContainerItems(container){
        const items = [];
        Array.from(container.children).forEach((child) => {
          this.collectContainerItems(child, items);
        });
        return items;
      },
      getCombinedSvgMarkup(id = this.chartId){
        const target = this.getTargetElement(id);
        if(!target){
          return null;
        }

        const targetWidth = target.clientWidth || parseFloat(target.getAttribute?.("width")) || 0;

        if(target.tagName?.toLowerCase() === "svg" && !this.titleText){
          return new XMLSerializer().serializeToString(target);
        }

        const items = target.tagName?.toLowerCase() === "svg"
          ? [{ type: "svg", node: target }]
          : this.getContainerItems(target);
        if(items.length === 0 && !this.titleText){
          return null;
        }

        const svgItems = items.filter((item) => item.type === "svg");
        if(items.length === 1 && svgItems.length === 1 && !this.titleText){
          return new XMLSerializer().serializeToString(svgItems[0].node);
        }

        let totalHeight = 0;
        let maxWidth = targetWidth;
        const titleItem = this.getTitleMarkup(totalHeight, targetWidth);
        const svgRoot = this.createSvgElement("svg");
        svgRoot.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svgRoot.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        if(titleItem){
          totalHeight += titleItem.height;
          maxWidth = Math.max(maxWidth, titleItem.width);
          this.appendTextNode(svgRoot, titleItem);
        }
        items.forEach((item) => {
          if(item.type === "text"){
            const textItem = this.getTextMarkup(item.node, totalHeight);
            if(!textItem){
              return;
            }
            this.appendTextNode(svgRoot, textItem);
            totalHeight += textItem.height;
            maxWidth = Math.max(maxWidth, textItem.width);
            return;
          }

          const { width, height } = this.getSvgSize(item.node);
          this.appendSvgNode(svgRoot, item.node, totalHeight);
          totalHeight += height;
          maxWidth = Math.max(maxWidth, width);
        });

        svgRoot.setAttribute("width", `${maxWidth}`);
        svgRoot.setAttribute("height", `${totalHeight}`);
        svgRoot.setAttribute("viewBox", `0 0 ${maxWidth} ${totalHeight}`);

        return new XMLSerializer().serializeToString(svgRoot);
      },
      svgUrl(id=""){
        const svgString = this.getCombinedSvgMarkup(id || this.chartId);
        if(!svgString){
          return null;
        }
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
        const url = this.svgUrl();
        if(!url){
          return;
        }
        uiUtils.downloadChart(url, `${this.filename}.svg`);
        setTimeout(() => URL.revokeObjectURL(url), 0);
      },
      downloadPng() {
        if (this.isCanvas){
          this.downloadCanvasToPng();
          return;
        }
        const url = this.svgUrl();
        if(!url){
          return;
        }
        let img = new Image();
        img.src = url;
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
            URL.revokeObjectURL(url);
        }
        img.onerror = function(){
            URL.revokeObjectURL(url);
        }
      },
      downloadCanvasToPng(){
        let canvas = this.getCanvasNode();
        if(!canvas){
          return;
        }
        let dataUrl = canvas.toDataURL("image/png");
        uiUtils.downloadChart(dataUrl, `${this.filename}.png`);
      },
      downloadCanvasToSvg(){
        let canvas = this.getCanvasNode();
        if(!canvas){
          return;
        }
        let dataUrl = canvas.toDataURL("image/png");
        let height = canvas.height;
        let width = canvas.width;
        let image = `<image height="${height}" width="${width
          }" y="0" x="0" xlink:href="${dataUrl}" id="importedCanvas_0"/>`;
        let svg = `<svg xmlns:xlink="http://www.w3.org/1999/xlink" height="${height
          }" width="${width}" xmlns="http://www.w3.org/2000/svg" id="new-svg">${image}</svg>`;
        const newDiv = document.createElement("div");
        newDiv.innerHTML = svg;
        newDiv.hidden = true;
        document.body.appendChild(newDiv);
        const url = this.svgUrl("new-svg");
        if(url){
          uiUtils.downloadChart(url, `${this.filename}.svg`);
          setTimeout(() => URL.revokeObjectURL(url), 0);
        }
        document.body.removeChild(newDiv);
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
