<template>
    <div ref="umapContainer" class="umap-container" 
        @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp"
        @mouseover="onMouseOver" @mouseout="onMouseOut" @wheel.prevent="onWheel"
        style="width:100%; position:relative; overflow-x:hidden;">
        <div v-if="points"
            style="display:flex; align-items: center; justify-content: flex-end; gap:5px; position: absolute; right: 5px; top: 5px; z-index: 1">
            <!--<div><span style="font-family: monospace;">{{ points.length.toLocaleString() }}</span> cells</div>-->
            <button @click="showTooltips = !showTooltips" v-b-tooltip.hover.bottom title="toggle cell info" :style="!showTooltips?'background:#ddd':'background:white'">
                <svg style="width:12px;margin:0 4px;" viewBox="0 0 15.098 18.794" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(-.27 -.301)">
                        <path d="M.77 14.361V.801h14.098v13.56H10.51l-2.853 4.234-2.605-4.234z" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="7.845" cy="4.296" r=".979"/>
                        <path d="M7.094 5.928h1.501v5.876H7.094z"/>
                    </g>
                </svg>
            </button>
            <button @click="showLabels = !showLabels" v-b-tooltip.hover.bottom title="toggle labels" :style="!showLabels?'background:#ddd':'background:white'">
                <svg style="width:20px;" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" xml:space="preserve"
                    transform="rotate(270)">
                    <path
                        d="M24.896 9.463a.997.997 0 0 0-.707-.293l-12.957-.001a1 1 0 0 0-1 .996l-.046 13.005a.998.998 0 0 0 .293.711l16.995 16.995a.997.997 0 0 0 1.414 0l13.004-13.004a.999.999 0 0 0 0-1.414L24.896 9.463zm3.285 29.292L12.188 22.761l.041-11.592 11.547.001 15.995 15.995-11.59 11.59z" />
                    <circle cx="20.362" cy="19.346" r="2.61" />
                </svg>
            </button>
            <button @click="resetPanZoom" v-b-tooltip.hover.bottom title="recenter">
                <svg style="width:18px;" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M6 12H4V4h8v2H6v6zM28 12h-2V6h-6V4h8v8zM12 28H4v-8h2v6h6v2zM28 28h-8v-2h6v-6h2v8zM15 10h2v4h-2zM10 15h4v2h-4zM18 15h4v2h-4zM15 18h2v4h-2z" />
                    <path fill="none" d="M0 0h32v32H0z" />
                </svg>
            </button>
            <button v-b-tooltip.hover.bottom.html title="zoom: mouse wheel or pinch<br>pan: click + drag">
                <svg style="width:18px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M12 19.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm0 1.5a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm.75-6v1.5h-1.5V15h1.5Zm-2.25-4.568C10.5 9.662 11.15 9 12 9s1.5.663 1.5 1.432c0 .307-.185.671-.592 1.084-.395.4-.898.743-1.315 1.013l-.343.222v1.499h1.5v-.688c.381-.259.833-.595 1.225-.992.507-.514 1.025-1.24 1.025-2.138C15 8.79 13.635 7.5 12 7.5s-3 1.291-3 2.932h1.5Z"
                        fill="#000" />
                </svg>
            </button>
            <button @click="download" v-b-tooltip.hover.bottom title="Download">
                <svg style="width:24px;" fill="#000000" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                        <path d="M512 666.5L367.2 521.7l36.2-36.2 83 83V256h51.2v312.5l83-83 36.2 36.2L512 666.5zm-204.8 50.3V768h409.6v-51.2H307.2z"></path>
                    </g>
                </svg>
            </button>
        </div>
        <!-- 1) WebGL canvas for points -->
        <canvas ref="umapCanvas" class="umap-canvas" @click="onClick"></canvas>

        <!-- 2) 2D overlay canvas for text labels (unchanged) -->
        <canvas ref="umapLabelCanvas" class="umap-label-canvas"
            :style="`display:${showLabels ? 'block' : 'none'}`"></canvas>
    </div>
</template>

<script>
// We'll import the color scales from d3
import * as d3 from 'd3';
import Vue from 'vue';
import EventBus from "@/utils/eventBus";
import sharedUmapData from "@/components/researchPortal/singleCellBrowser/sharedUmapData.js"
import mouseTooltip from '@/components/researchPortal/singleCellBrowser/mouseTooltip.js';
import {llog} from "./llog.js";

export default Vue.component('research-umap-plot-gl', {
    props: {
        group: {
            type: String,     //multiple umaps for same points can share data, use this to group them
            required: true,     
        },
        points: {             //umap coordinates
            type: Array,
            required: true,
        },
        labels: {             //fields object
            type: Object,
            required: true,
        },
        colors: {             //object of label colors
            type: Object,
            required: true,
        },
        cellTypeField: {      //key name of field which contains the cell cluster labels
            type: String,
            required: false,
        },
        colorByField: {       //key name of field by which to color the clusters
            type: String,
            required: false,
        },
        hoverFields: {        //array of field key names to show on hover. none specified will show all
            type: Array,
            required: false
        },
        width: {
            type: Number,
            default: 800,
        },
        height: {
            type: Number,
            default: 800,
        },
        highlightLabel: {       //label name of cluster points to highlight
            type: String,
            default: null,
        },
        highlightLabels: {      //array of label names of clusters to highlights
            type: Array,
            default: () => [],
        },
        expression: {           //if expression is given, clusters will be colored by expression
            type: Array,
            default: null,
        },
    },
    data() {
        return {
            gl: null,
            program: null,
            buffers: {},
            showLabels: true,
            showTooltips: true,
            scale: 1.0,
            translate: { x: 0.0, y: 0.0 },
            resetScale: 1.0,
            resetTranslate: { x: 0.0, y: 0.0 },
            pointBounds: { n: 0, s: 0, e: 0, w: 0 },
            isDragging: false,
            lastMouse: { x: 0, y: 0 },
            isHovering: false,

            // We'll store cluster center info here: { label, x, y }
            clusterCenters: [],

            // For coloring expression, define a plasma scale
            expressionScale: null,

            resizeTimeout: null,
        };
    },
    watch: {
        points: {
            handler() {
                this.cleanUp();
                this.init();
            },
        },
        labels: {
            handler() {
                this.init();
            },
        },
        colorByField() {
            if (this.buffers.color && this.gl) {
                this.gl.deleteBuffer(this.buffers.color);
                this.buffers.color = null;
            }
            this.setupBuffers();
            this.renderUMAP();
        },
        highlightLabel() {
            // Rebuild buffers if highlightLabel changes
            this.setupBuffers();
            this.renderUMAP();
        },
        highlightLabels() {
            // Rebuild buffers if highlightLabel changes
            this.setupBuffers();
            this.renderUMAP();
        },
        // If expression changes, recalc colors
        expression() {
            if (this.buffers.color && this.gl) {
                this.gl.deleteBuffer(this.buffers.color);
                this.buffers.color = null;
            }
            //this.expressionScale = d3.scaleSequential(d3.interpolatePlasma).domain([d3.max(this.expression), 0]),
            this.expressionScale = d3.scaleLinear().domain([0, d3.max(this.expression)]).range(["lightgrey", "blue"]);
            this.setupBuffers();
            this.renderUMAP();
        },
    },
    mounted() {
        EventBus.$on('view-transform-change', this.handleUpdateViewTransform);
        window.addEventListener('resize', this.handleResize);
        this.init();
    },
    beforeDestroy() {
        EventBus.$off('view-transform-change', this.handleUpdateViewTransform);
        window.removeEventListener('resize', this.handleResize);
        this.cleanUp();
    },
    methods: {
        handleResize(){
            clearTimeout(this.resizeTimeout);
            d3.select(this.$refs.umapCanvas).style('position', 'absolute');
            this.resizeTimeout = setTimeout(() => {
                this.init();
            }, 100);
        },
        init() {
            //console.log("---glUMAP init");

            sharedUmapData.initPoints(this.group, this.points);

            const parentWidth = this.$refs.umapContainer.parentElement.offsetWidth;
            this.$refs.umapContainer.style.height = this.height+'px';

            // 1) Setup canvases
            const canvas = this.$refs.umapCanvas;
            canvas.width = parentWidth * window.devicePixelRatio;
            canvas.height = this.height * window.devicePixelRatio;
            canvas.style.width = `${parentWidth}px`;
            canvas.style.height = `${this.height}px`;
            canvas.getContext("webgl", { preserveDrawingBuffer: true });

            const labelCanvas = this.$refs.umapLabelCanvas;
            labelCanvas.width = parentWidth * window.devicePixelRatio;
            labelCanvas.height = this.height * window.devicePixelRatio;
            labelCanvas.style.width = `${parentWidth}px`;
            labelCanvas.style.height = `${this.height}px`;

            // 2) Calculate bounds & cluster centers
            this.calculatePointBounds();
            this.calculateClusterCenters();

            // 3) WebGL
            this.initializeWebGL();
            this.setupBuffers();
            this.renderUMAP();
        },

        cleanUp() {
            //console.log("   cleanUp");
            const gl = this.gl;
            if (!gl) return;

            if (this.buffers.position) {
                gl.deleteBuffer(this.buffers.position);
                this.buffers.position = null;
            }
            if (this.buffers.color) {
                gl.deleteBuffer(this.buffers.color);
                this.buffers.color = null;
            }
            if (this.buffers.highlight) {
                gl.deleteBuffer(this.buffers.highlight);
                this.buffers.highlight = null;
            }

            sharedUmapData.release(this.group);
        },

        calculatePointBounds() {
            this.pointBounds = { n: Infinity, s: -Infinity, e: -Infinity, w: Infinity };

            this.points.forEach(({ X, Y }) => {
                if (X > this.pointBounds.e) this.pointBounds.e = X;
                if (X < this.pointBounds.w) this.pointBounds.w = X;
                if (Y > this.pointBounds.s) this.pointBounds.s = Y;
                if (Y < this.pointBounds.n) this.pointBounds.n = Y;
            });

            const boundsWidth = this.pointBounds.e - this.pointBounds.w;
            const boundsHeight = this.pointBounds.s - this.pointBounds.n;

            const canvasWidth = this.$refs.umapCanvas.width;
            const canvasHeight = this.$refs.umapCanvas.height;

            const shorterCanvasDim = Math.min(canvasWidth, canvasHeight);
            const largestDataDim = Math.max(boundsWidth, boundsHeight);

            // Scale so the data fits into 90% of the shorter canvas side
            this.scale = (shorterCanvasDim * 0.8) / largestDataDim;
            this.resetScale = this.scale;

            // Center data on canvas
            const xCenterData = 0.5 * (this.pointBounds.w + this.pointBounds.e);
            const yCenterData = 0.5 * (this.pointBounds.n + this.pointBounds.s);

            this.translate.x = (canvasWidth * 0.5) / this.scale - xCenterData;
            this.translate.y = (canvasHeight * 0.5) / this.scale - yCenterData;
            this.resetTranslate.x = this.translate.x;
            this.resetTranslate.y = this.translate.y;
        },

        // build cluster center info { label, x, y }
        calculateClusterCenters() {
            //llog("   calculateClusterCenters");
            this.clusterCenters = [];
            const labelField = this.cellTypeField || Object.keys(this.labels.metadata_labels)[0];
            const metadata = this.labels.metadata[labelField];
            const metadataLabels = this.labels.metadata_labels[labelField];

            const sums = {};
            this.points.forEach((pt, i) => {
                const labelIndex = metadata[i];
                const label = metadataLabels[labelIndex] || 'Unlabeled';
                if (!sums[label]) {
                    sums[label] = { xSum: 0, ySum: 0, count: 0 };
                }
                sums[label].xSum += pt.X;
                sums[label].ySum += pt.Y;
                sums[label].count++;
            });

            Object.entries(sums).forEach(([label, info]) => {
                const centerX = info.xSum / info.count;
                const centerY = info.ySum / info.count;
                this.clusterCenters.push({ label, x: centerX, y: centerY });
            });
        },

        initializeWebGL() {
            //llog("   initializeWebGL");
            const canvas = this.$refs.umapCanvas;
            const gl = canvas.getContext('webgl');
            if (!gl) {
                console.error('WebGL not supported');
                return;
            }
            this.gl = gl;

            // Same vertex + fragment shaders,
            // but we decide color in 'setupBuffers()' depending on expression or labels
            const vertexShaderSource = `
          attribute vec2 a_position;
          attribute vec4 a_color;
          attribute float a_isHighlight;
  
          uniform vec2 u_resolution;
          uniform float u_scale;
          uniform float u_scale_base;
          uniform vec2 u_translate;
  
          varying vec4 v_color;
          varying float v_isHighlight;
  
          void main() {
            vec2 scaledPos = (a_position + u_translate) * u_scale;
            vec2 zeroToOne = scaledPos / u_resolution;
            vec2 clipSpace = (zeroToOne * 2.0 - 1.0) * vec2(1, 1);
  
            float baseSize = 1.0;
            float extraSize = 1.0;
            gl_Position = vec4(clipSpace, 0, 1);
            float scalar = u_scale > u_scale_base ? 0.5 : 1.0;
            gl_PointSize = (baseSize + (extraSize * a_isHighlight)) * ((u_scale / u_scale_base) * scalar);
  
            v_color = a_color;
            v_isHighlight = a_isHighlight;
          }
        `;

            const fragmentShaderSource = `
          precision mediump float;
          varying vec4 v_color;
          varying float v_isHighlight;
  
          void main() {
            // Grey out non-highlighted
            vec4 grey = vec4(0.5, 0.5, 0.5, 1.0);
            gl_FragColor = mix(grey, v_color, v_isHighlight);
          }
        `;

            const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
            const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
            this.program = this.createProgram(gl, vertexShader, fragmentShader);
            gl.useProgram(this.program);
        },

        // --- THE KEY PART: Decide whether to color by expression or by label
        setupBuffers() {
            //llog("   setupBuffers");
            const gl = this.gl;
            if (!gl) return;

            // Decide color for each cell
            const labelField = this.colorByField || this.cellTypeField || Object.keys(this.labels.metadata_labels)[0];
            const metadata = this.labels.metadata[labelField];
            const metadataLabels = this.labels.metadata_labels[labelField];

            // Positions
            if (!this.buffers.position) {
                //llog("      positions")
                const positionBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, sharedUmapData.getPositions(this.group), gl.STATIC_DRAW);
                this.buffers.position = positionBuffer;
            }

            if (!this.buffers.color) {
                //llog("      colors")

                const colors = new Uint8Array(this.points.length * 4);
                if(this.expression){
                    this.expressionScale = d3.scaleLinear().domain([0, d3.max(this.expression)]).range(["lightgrey", "blue"]);
                }

                for (let i = 0; i < this.points.length; i++) {
                    let r, g, b, a;
                    if (this.expression && this.expression[i] != null) {
                        // 1) Color by expression
                        const val = this.expression[i];
                        // clamp or assume 0..3
                        const colorStr = this.expressionScale(val);
                        const rgb = d3.color(colorStr).rgb();
                        r = rgb.r;
                        g = rgb.g;
                        b = rgb.b;
                        a = 255;
                    } else {
                        // 2) Fallback: color by label
                        const labelIndex = metadata[i];
                        const label = metadataLabels[labelIndex];
                        const color = this.colors[labelField][label] || '#000000';
                        const rgb = d3.color(color).rgb();
                        r = rgb.r;
                        g = rgb.g;
                        b = rgb.b;
                        a = 255;
                    }
                    const idx = i * 4;
                    colors[idx] = r;
                    colors[idx + 1] = g;
                    colors[idx + 2] = b;
                    colors[idx + 3] = a;
                }


                const colorBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
                this.buffers.color = colorBuffer;
            }

            //llog("      highlight")
            // Highlight array
            const highlightArray = new Float32Array(this.points.length);
            if (!this.highlightLabel && this.highlightLabels.length === 0) {
                highlightArray.fill(1.0);
            } else {
                for (let i = 0; i < this.points.length; i++) {
                    const labelIndex = metadata[i];
                    const label = metadataLabels[labelIndex];
                    highlightArray[i] = (label === this.highlightLabel || this.highlightLabels.includes(label)) ? 1.0 : 0.0;
                }
            }
            const highlightBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, highlightBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, highlightArray, gl.STATIC_DRAW);
            this.buffers.highlight = highlightBuffer;
        },

        renderUMAP() {
            // 1) Render points via WebGL
            this.renderPoints();

            // 2) Render text labels onto the 2D canvas
            this.drawLabels();
        },

        renderPoints() {
            //llog("   renderPoints");
            const gl = this.gl;
            if (!gl) return;

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(this.program);

            // Uniforms
            const resolutionLoc = gl.getUniformLocation(this.program, 'u_resolution');
            gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

            const scaleLoc = gl.getUniformLocation(this.program, 'u_scale');
            gl.uniform1f(scaleLoc, this.scale);

            const scaleLocBase = gl.getUniformLocation(this.program, 'u_scale_base');
            gl.uniform1f(scaleLocBase, this.resetScale);

            const translateLoc = gl.getUniformLocation(this.program, 'u_translate');
            gl.uniform2f(translateLoc, this.translate.x, this.translate.y);

            // Position attribute
            const positionLoc = gl.getAttribLocation(this.program, 'a_position');
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
            gl.enableVertexAttribArray(positionLoc);
            gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

            // Color attribute
            const colorLoc = gl.getAttribLocation(this.program, 'a_color');
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
            gl.enableVertexAttribArray(colorLoc);
            gl.vertexAttribPointer(colorLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);

            // Highlight attribute
            const highlightLoc = gl.getAttribLocation(this.program, 'a_isHighlight');
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.highlight);
            gl.enableVertexAttribArray(highlightLoc);
            gl.vertexAttribPointer(highlightLoc, 1, gl.FLOAT, false, 0, 0);

            // Draw
            gl.drawArrays(gl.POINTS, 0, this.points.length);
        },

        drawLabels() {
            const labelCanvas = this.$refs.umapLabelCanvas;
            const ctx = labelCanvas.getContext('2d');
            ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

            // Pick a font
            ctx.font = `${14 * window.devicePixelRatio}px Arial`;
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 5;

            this.clusterCenters.forEach(c => {
                const xScreen = (c.x + this.translate.x) * this.scale;
                const yScreen = (c.y + this.translate.y) * this.scale;
                const flipY = labelCanvas.height - yScreen;
                ctx.strokeText(c.label, xScreen, flipY);
                ctx.fillText(c.label, xScreen, flipY);
            });
        },

        // --- Mouse + Wheel for Pan/Zoom ---
        onWheel(e) {
            const rect = this.$refs.umapCanvas.getBoundingClientRect();
            const canvasWidth = this.$refs.umapCanvas.width;
            const canvasHeight = this.$refs.umapCanvas.height;

            const mxScreen = (e.clientX - rect.left) * (canvasWidth / rect.width);
            const myScreen = canvasHeight - ((e.clientY - rect.top) * (canvasHeight / rect.height));

            const oldScale = this.scale;
            const zoomFactor = 1.05;
            const newScale = e.deltaY < 0 ? oldScale * zoomFactor : oldScale / zoomFactor;

            const mxData = mxScreen / oldScale - this.translate.x;
            const myData = myScreen / oldScale - this.translate.y;

            this.scale = newScale;
            this.translate.x = (mxData + this.translate.x) * (oldScale / newScale) - mxData;
            this.translate.y = (myData + this.translate.y) * (oldScale / newScale) - myData;

            this.updateViewTransform();
            this.renderUMAP();
        },

        onMouseDown(e) {
            this.isDragging = true;
            this.lastMouse.x = e.clientX;
            this.lastMouse.y = e.clientY;
        },

        onMouseMove(e) {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouse.x;
                const dy = e.clientY - this.lastMouse.y;
                this.lastMouse.x = e.clientX;
                this.lastMouse.y = e.clientY;

                this.translate.x += dx / (this.scale / 2);
                this.translate.y -= dy / (this.scale / 2);
                this.updateViewTransform();
                this.renderUMAP();
            }
            if (this.isHovering && this.showTooltips) {
                // Convert to data coords
                const rect = this.$refs.umapCanvas.getBoundingClientRect();
                const canvasWidth = this.$refs.umapCanvas.width;
                const canvasHeight = this.$refs.umapCanvas.height;
                const mxScreen = (e.clientX - rect.left) * (canvasWidth / rect.width);
                const myScreen = (e.clientY - rect.top) * (canvasHeight / rect.height);
                const myScreenFlipped = canvasHeight - myScreen;
                const mxData = (mxScreen / this.scale) - this.translate.x;
                const myData = (myScreenFlipped / this.scale) - this.translate.y;

                // Search quadtree
                const radius = 0.05; // or some finite number
                const nearestPt = sharedUmapData.getQuadtree(this.group).find(mxData, myData, radius);
                const nearestPtIdx = this.points.indexOf(nearestPt);

                if (nearestPt) {
                    let hoverHTML = '<div style="display:grid; grid-template-columns: max-content 1fr; grid-column-gap: 5px; font-size: 12px;">';
                    hoverHTML += `<div style="font-weight:bold">Cell ID</div><div>${(this.labels.NAME || this.labels.ID)[nearestPtIdx]}</div>`;
                    if (this.expression) hoverHTML += `<div style="font-weight:bold">Expression</div><div>${this.expression[nearestPtIdx]} ${this.expressionGene ? '(' + this.expressionGene + ')' : ''}</div>`;
                    Object.keys(this.labels.metadata_labels).forEach(field => {
                        if (!this.isHoverField(field)) return;
                        const value = this.labels.metadata_labels[field][this.labels.metadata[field][nearestPtIdx]];
                        if (value && value !== "") {
                            hoverHTML += `<div style="font-weight:bold;">${field}</div><div>${value}</div>`
                        }
                    })
                    hoverHTML += '</div>'


                    mouseTooltip.show(hoverHTML);
                } else {
                    mouseTooltip.hide();
                }
            }
        },

        isHoverField(field) {
            if (!this.hoverFields || this.hoverFields.length === 0) return true;
            if (this.hoverFields.includes(field)) return true;
            return false;
        },

        onMouseOver(e) {
            this.isHovering = true;
        },

        onMouseOut(e) {
            this.isHovering = false;
            mouseTooltip.hide();
        },

        onMouseUp() {
            this.isDragging = false;
        },

        onClick(event) {
            // handle click
        },

        resetPanZoom() {
            this.scale = this.resetScale;
            this.translate.x = this.resetTranslate.x;
            this.translate.y = this.resetTranslate.y;
            this.updateViewTransform();
            this.renderUMAP();
        },

        updateViewTransform() {
            EventBus.$emit('view-transform-change', {
                id: this.group,
                scale: this.scale,
                transform: this.translate
            })
        },
        handleUpdateViewTransform(newViewTransform) {
            if (newViewTransform.id === this.group) {
                this.scale = newViewTransform.scale;
                this.translate.x = newViewTransform.transform.x;
                this.translate.y = newViewTransform.transform.y;
                this.renderUMAP();
            }
        },

        // --- WebGL helpers
        createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        },

        createProgram(gl, vertexShader, fragmentShader) {
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Program linking failed:', gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null;
            }
            return program;
        },

        download(){
            const canvas1 = this.$refs.umapCanvas;
            const canvas2 = this.$refs.umapLabelCanvas;

            const width = canvas1.width;
            const height = canvas1.height;

            const scaleFactor = 2;

            const combinedCanvas = document.createElement('canvas');
            combinedCanvas.width = width * scaleFactor;
            combinedCanvas.height = height * scaleFactor;
            const ctx = combinedCanvas.getContext('2d');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(canvas1, 0, 0, combinedCanvas.width, combinedCanvas.height);
            ctx.drawImage(canvas2, 0, 0, combinedCanvas.width, combinedCanvas.height);

            /*
            const combinedCanvas = document.createElement('canvas');
            combinedCanvas.width = width;
            combinedCanvas.height = height;
            const ctx = combinedCanvas.getContext('2d');

            ctx.drawImage(canvas1, 0, 0);
            ctx.drawImage(canvas2, 0, 0);
            */

            const link = document.createElement('a');
            link.download = 'umap.png';
            link.href = combinedCanvas.toDataURL('image/png');
            link.click();
        },
    },
});
</script>

<style scoped>
.umap-container {
    position: relative;
    border: 1px solid #ccc;
    user-select: none;
}

/* 1) WebGL canvas */
.umap-canvas {
    display: block;
    width: 100%;
    height: 100%;
    /*cursor: grab;*/
}

/* 2) 2D label canvas, stacked on top */
.umap-label-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    /* so we can still drag/zoom on the container */
    width: 100%;
    height: 100%;
}

/* grabbing cursor for drag */
.umap-canvas:active {
    /*cursor: grabbing;*/
}

button {
    border: 1px solid rgba(0, 0, 0, .25);
    background: white;
    color: #4e4e4e;
    padding: 1px 3px;
    font-size: 14px !important;
}

button:hover {
    border: 1px solid rgba(0, 0, 0, .5);
}
</style>