<template>
    <div style="display:flex; flex-direction: column; width: min-content; position:relative">
        <strong>{{ title }}</strong>
        <div v-if="points" style="display:flex; align-items: center; justify-content: flex-end; gap:5px; position: absolute; right: 5px; top: 5px; z-index: 1">
            <!--<div><span style="font-family: monospace;">{{ points.length.toLocaleString() }}</span> cells</div>-->
            <button @click="showLabels = !showLabels">
                <svg style="width:20px;" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"  xml:space="preserve" transform="rotate(270)"><path d="M24.896 9.463a.997.997 0 0 0-.707-.293l-12.957-.001a1 1 0 0 0-1 .996l-.046 13.005a.998.998 0 0 0 .293.711l16.995 16.995a.997.997 0 0 0 1.414 0l13.004-13.004a.999.999 0 0 0 0-1.414L24.896 9.463zm3.285 29.292L12.188 22.761l.041-11.592 11.547.001 15.995 15.995-11.59 11.59z"/><circle cx="20.362" cy="19.346" r="2.61"/></svg>
            </button>
            <button @click="resetPanZoom">
                <svg style="width:18px;" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M6 12H4V4h8v2H6v6zM28 12h-2V6h-6V4h8v8zM12 28H4v-8h2v6h6v2zM28 28h-8v-2h6v-6h2v8zM15 10h2v4h-2zM10 15h4v2h-4zM18 15h4v2h-4zM15 18h2v4h-2z"/><path fill="none" d="M0 0h32v32H0z"/></svg>
            </button>
        </div>
        <div class="umap-wrap" :style="`min-width:${width}px;`">
            <div class="umap-overlay" v-if="!points || isLoading">
                {{isLoading ? 'Loading' : 'No data'}}
            </div>
            <canvas ref="umapCanvas" class="umap"></canvas>
            <canvas ref="umapCanvasLabels" class="umap" 
                    @wheel="handleWheel"
                    @mousedown="startPan"
                    @mousemove="handleMouseMove"
                    @mouseup="endPan"
                    @mouseout="umapUnHover"
                    @mouseleave="endPan"
            >
            </canvas>
            <div ref="umapTooltip" class="umapTooltip"></div>
        </div>
    </div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  
  export default Vue.component('research-umap-plot', {
    props: {
      title: {
        type: String,
        required: false,
      },
      points: {                             //expects array of point vector objects [{X:0, Y:0},...]
        type: (Array, null),
        required: true,
      },
      colors: {                             //expects array of hex strings, parallels points ["#fff", ...]
        type: Array,
        required: false,
      },
      cellLabels: {                         //exects array of strings of cell labels ["cell1", "cell2",...]
        type: Array,
        required: false,
      },
      cellLabelsMap: {                      //expects array of ints that are indeces of cellLabels array, parallels points [0, 1, 0, 2,...]
        type: Array,
        required: false,
      },
      highlightLabel: {
        type: String,
        required: false,
      },
      width:{                               //desired width of umap plot, plot is rendered with square aspect ratio
        type: Number,
        deafult: 400,
        required: false,
      },
      labelSizePx: {                        //desired size of cluster labels on umap
        type: Number,
        default: 20,
        required: false,
      },
      dotSize: {                            //desired size of dots on umap
        type: Number,
        default: 2,
        required: false,
      },
      isLoading: {
        type: Boolean,
        default: false,
        required: false,
      }
    },
    data() {
      return {
        center: null,
        pointsCenter: null,
        calculatedScaleFactor: null,
        scaleFactor: null,
        scale: null,
        zoom: null,
        pointBounds: {n: 0, s: 0, e: 0, w: 0},
        pointBoundsCalculated: false,
        boundsSizeScaled: null,
        boundsOffset: null,
        clusterCenters: {},
        showLabels: true,  
        umapTooltipEl: null,
        viewTransform: {
            x: 0,
            y: 0,
            scale: 1
        },
        isPanning: false,
        lastX: null,
        lastY: null
      }
    },
    watch: {
        points: {
            handler(){
                this.pointBoundsCalculated = false;
                this.drawUMAP();
            }
        },
        highlightLabel: {
            handler(){
                this.drawUMAP();
            }
        },
        cellLabels:{
            handler(){
                if(this.cellLabelsMap) this.addClusterLabels();
            }
        },
        cellLabelsMap:{
            handler(){
                if(this.cellLabels) this.addClusterLabels();
            }
        },
        colors: {
            handler() {
                this.drawUMAP();
            }
        },
        showLabels() {
            this.addClusterLabels();
        }
    },
    mounted() {
        this.drawUMAP();
    },
    methods: {
        //
        //umap rendering
        //
        drawUMAP(){
            const {points, colors, width} = this;

            console.log('drawingUMAP');
            //console.log('drawUMAP', points, colors);

            if(!points) return;

            this.umapTooltipEl = this.$refs.umapTooltip;

            const canvas = this.$refs.umapCanvas;
            const ctx = canvas.getContext("2d");
            const canvasWidth = width;

            canvas.style.width = canvasWidth+'px';
            canvas.style.height = canvasWidth+'px';
            canvas.width = canvasWidth*2;
            canvas.height = canvasWidth*2;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            this.resetPlot(canvas);

            if(!this.pointBoundsCalculated){
                //console.log('calculating umap point bounds');
                this.pointBounds = {n: 0, s: 0, e: 0, w: 0};
                //get point bounds by storing outermost points in each cardinal direction
                points.forEach(coord => {
                    const px = coord.X;
                    const py = coord.Y;
                    if(px>0) this.pointBounds.e = px > this.pointBounds.e ? px : this.pointBounds.e;
                    if(px<0) this.pointBounds.w = px < this.pointBounds.w ? px : this.pointBounds.w;
                    if(py>0) this.pointBounds.s = py > this.pointBounds.s ? py : this.pointBounds.s;
                    if(py<0) this.pointBounds.n = py < this.pointBounds.n ? py : this.pointBounds.n;
                });

                //console.log(this.pointBounds);

                this.calculateScaleFactor(canvas);

                this.pointBoundsCalculated = true;
            }
            
            const boundsCenter = {
                x: (this.center.x ),
                y: (this.center.y )
            }

            this.clusterCenters = {};
            //console.log('--', this.cellLabels, this.cellLabelsMap);

            // Save the current state
            ctx.save();
            
            // Apply view transformation
            ctx.translate(this.viewTransform.x, this.viewTransform.y);
            ctx.scale(this.viewTransform.scale, this.viewTransform.scale);

            const wantHighlight = this.highlightLabel !== '';
            const haveLabels = (this.cellLabels && this.cellLabelsMap);
            let label;

            //draw points
            points.forEach((coord, index) => {
                //calc dot positions
                const px = coord.X;
                const py = coord.Y;
                
                const x = ((px - this.pointBounds.w) * this.zoom) + this.boundsOffset.x/2;
                const y = ((this.pointBounds.s - py) * this.zoom) + this.boundsOffset.y/2;

                //console.log(px, py, x, y)

                //calc cluster centers
                label = null;
                if(haveLabels){
                    label = this.cellLabels[this.cellLabelsMap[index]];
                    if(!label || label.trim()==='' || label === undefined) return;
                    if (!this.clusterCenters[label]) {
                        this.clusterCenters[label] = { x: 0, y: 0, count: 0 };
                    }
                    this.clusterCenters[label].x += x;
                    this.clusterCenters[label].y += y;
                    this.clusterCenters[label].count += 1;
                }

                //draw dots
                const isLabelToHighlight = (label && wantHighlight) && (label === this.highlightLabel);
                ctx.beginPath();
                ctx.arc(x, y, this.dotSize / this.viewTransform.scale, 0, 2 * Math.PI);
                ctx.fillStyle = colors ? wantHighlight ? isLabelToHighlight ? colors[index] : '#eee' : colors[index] : '#666';
                ctx.fill();
            });

            ctx.restore();

            //calc cluster centers
            if(Object.keys(this.clusterCenters).length>0){
                Object.keys(this.clusterCenters).forEach(label => {
                    const center = this.clusterCenters[label];
                    center.x /= center.count;
                    center.y /= center.count;
                });
            }

            //console.log('clusterCenters', this.clusterCenters);

            this.addClusterLabels();
        },
        addClusterLabels(){
            //console.log('addClusterLabels', this.clusterCenters);
            const canvas = this.$refs.umapCanvasLabels;
            const ctx = canvas.getContext("2d");
            const canvasWidth = this.width;

            canvas.width = canvasWidth*2;
            canvas.height = canvasWidth*2;
            canvas.style.width = canvasWidth+'px';
            canvas.style.height = canvasWidth+'px';

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if(!this.showLabels) return;

            ctx.save();
            ctx.translate(this.viewTransform.x, this.viewTransform.y);
            ctx.scale(this.viewTransform.scale, this.viewTransform.scale);

            if(Object.keys(this.clusterCenters).length>0){
                ctx.font = `${this.labelSizePx / this.viewTransform.scale}px Arial`;
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.strokeStyle = "white";
                ctx.lineWidth = 5;

                Object.entries(this.clusterCenters).forEach(([label, center]) => {
                    const xOffset = 0;
                    const yOffset = 0;
                    ctx.strokeText(label, center.x + xOffset, center.y + yOffset);
                    ctx.fillText(label, center.x + xOffset, center.y + yOffset);
                });
            }

            ctx.restore();
        },
        calculateScaleFactor(canvas) {
            const paddingPct = 10;
            const boundsSize = {
                w: Math.abs(this.pointBounds.w) + Math.abs(this.pointBounds.e),
                h: Math.abs(this.pointBounds.n) + Math.abs(this.pointBounds.s)
            }
            const scaleDiff = {
                w: canvas.width / boundsSize.w,
                h: canvas.height / boundsSize.h
            }
            this.calculatedScaleFactor = Math.min(scaleDiff.w, scaleDiff.h) * ((100-paddingPct)/100);
            this.zoom = this.calculatedScaleFactor;
            this.boundsSizeScaled = {
                w: (Math.abs(this.pointBounds.e)+Math.abs(this.pointBounds.w))*this.zoom,
                h: (Math.abs(this.pointBounds.s)+Math.abs(this.pointBounds.n))*this.zoom
            }
            this.boundsOffset = {
                x: canvas.width - this.boundsSizeScaled.w,
                y: canvas.height - this.boundsSizeScaled.h
            }
        },
        resetPlot(canvas){
            this.center = { x: canvas.width / 2, y: canvas.height / 2 };
            this.center.x += 0.5;
            this.center.y += 0.5;
            this.scaleFactor = this.calculatedScaleFactor ? this.calculatedScaleFactor : 1;
            this.scale = 1;
            this.zoom = this.scale * this.scaleFactor;  
        },

        //
        //event handlers
        //
        handleWheel(e) {
            e.preventDefault();
            
            // get mouse position relative to canvas
            const rect = this.$refs.umapCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // calculate zoom
            const zoom = e.deltaY < 0 ? 1.1 : 0.9;
            
            this.viewTransform.scale *= zoom;
            
            // zoom towards mouse position
            this.viewTransform.x = mouseX - (mouseX - this.viewTransform.x) * zoom;
            this.viewTransform.y = mouseY - (mouseY - this.viewTransform.y) * zoom;
            
            this.drawUMAP();
        },
        startPan(e) {
            this.isPanning = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        },
        endPan() {
            this.isPanning = false;
        },
        handlePan(e) {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            
            this.viewTransform.x += dx;
            this.viewTransform.y += dy;
            
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            
            this.drawUMAP();
        },
        resetPanZoom(){
            this.viewTransform = {x: 0, y: 0, scale: 1};
            this.drawUMAP();
        },
        handleMouseMove(e) {
            if (this.isPanning) {
                this.handlePan(e);
            } else {
                this.umapHover(e);
            }
        },
        umapHover(e){
            const rect = this.$refs.umapCanvas.getBoundingClientRect();
            const mouseX = (e.clientX*2) - (rect.left*2);
            const mouseY = (e.clientY*2) - (rect.top*2);

            this.checkHover(mouseX, mouseY);
        },
        checkHover(x, y) {
            let radius = 0.05;
                
            //adjust for pan/zoom
            x = (x - this.viewTransform.x) / this.viewTransform.scale;
            y = (y - this.viewTransform.y) / this.viewTransform.scale;

            // revert mouse position to UMAP coordinates space
            const mouseX = ((x - this.boundsOffset.x/2) / this.zoom) + this.pointBounds.w;
            const mouseY = this.pointBounds.s - ((y - this.boundsOffset.y/2) / this.zoom);

            const nearbyPointIndices = [];

            this.points.forEach((point, index) => {
                const dx = point.X - mouseX;
                const dy = point.Y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < radius) {
                    nearbyPointIndices.push(index);
                }
            });

            //console.log(`Found ${nearbyPointIndices.length} points within radius ${radius}`);

            if(nearbyPointIndices.length>0){
                this.umapTooltipEl.innerHTML = this.cellLabels[this.cellLabelsMap[nearbyPointIndices[0]]];
                this.umapTooltipEl.classList.remove('hidden');
            }else{
                this.umapTooltipEl.classList.add('hidden');
            }
        },
        umapUnHover(){
            this.umapTooltipEl.classList.add('hidden');
        },
    },
  });
  </script>
  
  <style scoped>
 .umap-wrap{
    position: relative;
    aspect-ratio: 1;
    border:1px solid #ccc;
    width: fit-content;
 }
 .umap-overlay{
    position:absolute;
    width: 100%;
    height: 100%;
    display:flex;
    align-items: center;
    justify-content: center;
    background: #ccc;
    z-index: 50;
 }
 .umap{
    width: 0;
    height: 0;
    position:absolute;
 }
 .umapTooltip{
    position: absolute;
    width: auto;
    height: auto;
    background: #eee;
    top:5px;
    left:5px;
    padding: 2px 5px;
 }
 .umapTooltip.hidden{
    display:none;
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
  