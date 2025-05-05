<template>
    <div style="display:flex; flex-direction: column; width: min-content; position:relative">
        <strong>{{ title }}</strong>
        <div v-if="points" style="display:flex; align-items: center; justify-content: flex-end; gap:5px; position: absolute; right: 5px; top: 5px; z-index: 1">
            <!--<div><span style="font-family: monospace;">{{ points.length.toLocaleString() }}</span> cells</div>-->
            <button @click="showLabels = !showLabels" v-b-tooltip.hover.bottom title="toggle labels">
                <svg style="width:20px;" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"  xml:space="preserve" transform="rotate(270)"><path d="M24.896 9.463a.997.997 0 0 0-.707-.293l-12.957-.001a1 1 0 0 0-1 .996l-.046 13.005a.998.998 0 0 0 .293.711l16.995 16.995a.997.997 0 0 0 1.414 0l13.004-13.004a.999.999 0 0 0 0-1.414L24.896 9.463zm3.285 29.292L12.188 22.761l.041-11.592 11.547.001 15.995 15.995-11.59 11.59z"/><circle cx="20.362" cy="19.346" r="2.61"/></svg>
            </button>
            <button @click="resetPanZoom" v-b-tooltip.hover.bottom title="recenter">
                <svg style="width:18px;" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M6 12H4V4h8v2H6v6zM28 12h-2V6h-6V4h8v8zM12 28H4v-8h2v6h6v2zM28 28h-8v-2h6v-6h2v8zM15 10h2v4h-2zM10 15h4v2h-4zM18 15h4v2h-4zM15 18h2v4h-2z"/><path fill="none" d="M0 0h32v32H0z"/></svg>
            </button>
            <button v-b-tooltip.hover.bottom.html title="zoom: mouse wheel or pinch<br>pan: click + drag">
                <svg style="width:18px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 19.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm0 1.5a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm.75-6v1.5h-1.5V15h1.5Zm-2.25-4.568C10.5 9.662 11.15 9 12 9s1.5.663 1.5 1.432c0 .307-.185.671-.592 1.084-.395.4-.898.743-1.315 1.013l-.343.222v1.499h1.5v-.688c.381-.259.833-.595 1.225-.992.507-.514 1.025-1.24 1.025-2.138C15 8.79 13.635 7.5 12 7.5s-3 1.291-3 2.932h1.5Z" fill="#000"/></svg>   
            </button>
        </div>
        <div class="umap-wrap" :style="`min-width:${width}px;`">
            <div class="umap-overlay" v-if="!points">
                {{'No data'}}
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
            <div ref="umapTooltip" class="scb-tooltip"></div>
        </div>
    </div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  import EventBus from "@/utils/eventBus"
  import {llog} from "./llog.js";
  
  export default Vue.component('research-umap-plot', {
    props: {
        sectionId: {
            type: String,
            required: false,
        },
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

        fields: {                             //expects BioIndex fields object
            type: Object,
            required: false,
        },
        fieldColors: {
            type: Object,
            required: false,
        },
        cellTypeField: {                      //expects string of the "cell type" key (from fields object)
            type: String,
            required: false,
        },
        colorByField:{                        //expects string of the key to color by (from fields object)
            type: String,
            required: false,
        },
        hoverFields: {                        //expects string or array of strings of keys to show on cell hover (from fields object)
            type: (String, Array),            //will automatically show cell id from NAMES array in fields object
            required: false,
        },
        expression: {                         //expects array of expression values, parallels points [2.56, ...]
            type: Array,
            required: false,
        },
        expressionGene: {                     //name of gene whose expression is being dislayed
            type: String,
            required: false,
        },  
        highlightLabel: {
            type: String,
            required: false,
        },
        highlightLabels: {
            type: Array,
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
            default: 4,
            required: false,
        },
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
        clusterCentersInitialized: false,
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
        lastY: null,
      }
    },
    watch: {
        points: {
            handler(){
                this.pointBoundsCalculated = false;
                this.clusterCentersInitialized = false;
                this.drawUMAP('points');
            }
        },
        highlightLabel: {
            handler(){
                this.drawUMAP('highlightLabel');
            }
        },
        highlightLabels: {
            handler(){
                this.drawUMAP('highlightLabels');
            }
        },
        cellTypeField:{
            handler(){
                this.drawUMAP('cellTypeField');
            }
        },
        expression: {
            handler() {
                this.drawUMAP('expression');
            }
        },
        showLabels() {
            this.addClusterLabels();
        }
    },
    mounted() {
        this.drawUMAP('mounted');

        EventBus.$on('view-transform-change', this.handleUpdateViewTransform)
    },
    beforeDestroy() {
        EventBus.$off('view-transform-change', this.handleUpdateViewTransform)
    },
    methods: {
        //
        //umap rendering
        //
        drawUMAP(from=''){
            const {points, colors, width, fieldColors} = this;

            llog('drawingUMAP', from);
            //llog('drawUMAP', points, colors);

            if(!points) return;

            this.umapTooltipEl = this.$refs.umapTooltip;

            const canvas = this.$refs.umapCanvas;
            const ctx = canvas.getContext("2d");
            const canvasWidth = width;

            canvas.style.width = canvasWidth+'px';
            canvas.style.height = canvasWidth+'px';
            canvas.width = canvasWidth*2;
            canvas.height = canvasWidth*2;

            let getExpressionColor;
            if(this.expression) {
                getExpressionColor = d3.scaleSequential(d3.interpolatePlasma)
                .domain([d3.max(this.expression), 0]);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            this.resetPlot(canvas);

            if(!this.pointBoundsCalculated){
                //llog('calculating umap point bounds');
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

                //llog(this.pointBounds);

                this.calculateScaleFactor(canvas);

                this.pointBoundsCalculated = true;
            }

            if (this.fields && !this.clusterCentersInitialized) {
                this.clusterCenters = {};

                points.forEach((coord, index) => {
                    const px = coord.X;
                    const py = coord.Y;

                    const x = ((px - this.pointBounds.w) * this.zoom) + this.boundsOffset.x/2;
                    const y = ((this.pointBounds.s - py) * this.zoom) + this.boundsOffset.y/2;

                    let label = this.fields.metadata_labels[this.cellTypeField][this.fields.metadata[this.cellTypeField][index]];
                    if (!label || label.trim() === '') return;

                    // Initialize cluster center if not already present
                    if (!this.clusterCenters[label]) {
                        this.clusterCenters[label] = { x: 0, y: 0, count: 0 };
                    }
                    
                    // Accumulate x, y positions and count
                    this.clusterCenters[label].x += x;
                    this.clusterCenters[label].y += y;
                    this.clusterCenters[label].count += 1;
                });

                // Average the positions for each cluster center
                Object.keys(this.clusterCenters).forEach(label => {
                    const center = this.clusterCenters[label];
                    center.x /= center.count;
                    center.y /= center.count;
                });

                this.clusterCentersInitialized = true;
            }

            // Save the current state
            ctx.save();

            // Apply view transformation
            ctx.translate(this.viewTransform.x, this.viewTransform.y);
            ctx.scale(this.viewTransform.scale, this.viewTransform.scale);
            
            const wantHighlight = this.highlightLabel !== '';

            //optimization: used to cull points from rendering based on zoom level
            const cullMod = points.length > 20000 ? Math.round(10-this.viewTransform.scale) : 1;
            let pointsCount = 0;

            //draw points
            points.forEach((coord, index) => {
                //skip every 1 in X points
                if(index % Math.max(1, cullMod)) return;

                pointsCount++;

                //calc dot positions
                const px = coord.X;
                const py = coord.Y;
                
                const x = ((px - this.pointBounds.w) * this.zoom) + this.boundsOffset.x/2;
                const y = ((this.pointBounds.s - py) * this.zoom) + this.boundsOffset.y/2;

                //llog(px, py, x, y)

                const labelField = this.colorByField || this.cellTypeField;
                const label = this.fields.metadata_labels[labelField][this.fields.metadata[labelField][index]];
                
                //draw dots
                const isLabelToHighlight = (label && wantHighlight) && (label === this.highlightLabel);
                const isLabelSelected = this.highlightLabels.includes(label);

                let color = '#eee';
                if(fieldColors){
                    const labelIdx = this.fields.metadata[labelField][index];
                    const label = this.fields.metadata_labels[labelField][labelIdx];
                    color = this.fieldColors[labelField][label];
                }
                if(this.expression){
                    color = getExpressionColor(this.expression[index]);
                }
                //if(fieldColors){
                    if(isLabelToHighlight){
                        //color = colors[index];
                    }else{
                        if(wantHighlight){
                            color = 'rgba(100,100,100,0.05)';
                        }else{
                            if(isLabelSelected){
                                //color = colors[index];
                            }else{
                                if(this.highlightLabels.length===0){
                                    //color = colors[index];
                                }else{
                                    color = 'rgba(100,100,100,0.05)';
                                }
                            }
                        }
                        
                    }
                //}
                let dotSize = this.dotSize / this.viewTransform.scale
                //if(isLabelToHighlight) dotSize *= 2;
                //dotSize /= this.viewTransform.scale;

                ctx.beginPath();
                ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
            });

            llog("    POINTS RENDERED", pointsCount);

            ctx.restore();

            this.addClusterLabels();
        },
        addClusterLabels(){
            //llog('addClusterLabels', this.clusterCenters);
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
                ctx.lineWidth = 5 / (this.viewTransform.scale * 0.75);

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
            const paddingPct = 20;
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
            const mouseX = (e.clientX*2) - (rect.left*2);
            const mouseY = (e.clientY*2) - (rect.top*2);

            // calculate zoom
            const zoom = e.deltaY < 0 ? 1.1 : 0.9;
            
            this.viewTransform.scale *= zoom;
            
            // zoom towards mouse position
            this.viewTransform.x = mouseX - (mouseX - this.viewTransform.x) * zoom;
            this.viewTransform.y = mouseY - (mouseY - this.viewTransform.y) * zoom;
            
            this.drawUMAP();
            this.updateViewTransform();
        },
        startPan(e) {
            this.umapUnHover();
            this.isPanning = true;
            const rect = this.$refs.umapCanvas.getBoundingClientRect();
            this.lastX = (e.clientX*2) - (rect.left*2);
            this.lastY = (e.clientY*2) - (rect.top*2);
        },
        endPan() {
            this.isPanning = false;
        },
        handlePan(e) {
            if (!this.isPanning) return;

            const rect = this.$refs.umapCanvas.getBoundingClientRect();
            const dx = (e.clientX*2) - (rect.left*2) - this.lastX;
            const dy = (e.clientY*2) - (rect.top*2) - this.lastY;

            this.viewTransform.x += dx;
            this.viewTransform.y += dy;

            if (!this.panAnimationFrame) {
                this.panAnimationFrame = requestAnimationFrame(() => {
                    this.drawUMAP();
                    this.updateViewTransform();
                    this.panAnimationFrame = null;
                });
            }

            this.lastX = (e.clientX*2) - (rect.left*2);
            this.lastY = (e.clientY*2) - (rect.top*2);
        },
        resetPanZoom(){
            this.viewTransform = {x: 0, y: 0, scale: 1};
            this.drawUMAP();
            this.updateViewTransform();
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
            const mX = e.clientX;
            const mY = e.clientY;

            this.checkHover(mouseX, mouseY, mX, mY);
        },
        checkHover(x, y, xx, yy) {
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

            //llog(`Found ${nearbyPointIndices.length} points within radius ${radius}`);

            if(nearbyPointIndices.length>0 && !this.isPanning){
                let hoverHTML = `<div style="display:flex"><div style="width:100px; font-weight:bold">Cell ID</div>${this.fields.NAME[nearbyPointIndices[0]]}</div>`;
                if(this.expression) hoverHTML += `<div style="display:flex"><div style="width:100px; font-weight:bold">Expression</div>${this.expression[nearbyPointIndices[0]]} ${this.expressionGene?'('+this.expressionGene+')':''}</div>`;
                if(!this.hoverFields.includes(this.cellTypeField)) hoverHTML += `<div style="display:flex"><div style="width:100px; font-weight:bold; text-transform: capitalize;">${this.cellTypeField.replaceAll('_', ' ')}</div>${this.fields.metadata_labels[this.cellTypeField][this.fields.metadata[this.cellTypeField][nearbyPointIndices[0]]]}</div>`
                if(!this.hoverFields.includes(this.colorByField) && this.colorByField !== this.cellTypeField) hoverHTML += `<div style="display:flex"><div style="width:100px; font-weight:bold; text-transform: capitalize;">${this.colorByField.replaceAll('_', ' ')}</div>${this.fields.metadata_labels[this.colorByField][this.fields.metadata[this.colorByField][nearbyPointIndices[0]]]}</div>`
                this.hoverFields.forEach(field=>{
                    if(this.fields.metadata_labels[field])
                        hoverHTML += `<div style="display:flex"><div style="width:100px; font-weight:bold; text-transform: capitalize;">${field.replaceAll('_', ' ')}</div>${this.fields.metadata_labels[field][this.fields.metadata[field][nearbyPointIndices[0]]]}</div>`
                })
                this.umapTooltipEl.innerHTML = hoverHTML;
                this.umapTooltipEl.style.top = (yy - 10) + "px";
                this.umapTooltipEl.style.left = (xx + 10) + "px";
                this.umapTooltipEl.classList.add('show');
            }else{
                this.umapTooltipEl.classList.remove('show');
                this.umapTooltipEl.style.top = -1000 + "px";
                this.umapTooltipEl.style.left = -1000 + "px";
            }
        },
        umapUnHover(){
            this.umapTooltipEl.classList.remove('show');
            this.umapTooltipEl.style.top = -1000 + "px";
            this.umapTooltipEl.style.left = -1000 + "px";
        },
        updateViewTransform(){
            EventBus.$emit('view-transform-change', {id: this.sectionId, transform:this.viewTransform})
        },
        handleUpdateViewTransform(newViewTransform) {
            if(newViewTransform.id===this.sectionId){
                this.viewTransform = newViewTransform.transform;
                this.drawUMAP();
            }
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
.scb-tooltip{
    position:fixed;
    top:-1000px;
    left:-1000px;
    background: white;
    padding: 5px 10px;
    box-shadow: rgba(0, 0, 0, 0.5) -4px 9px 25px -6px;
}
.scb-tooltip.show{
    opacity: 1;
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
  