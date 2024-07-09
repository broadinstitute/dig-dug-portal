<template>
    <div>
      <canvas ref="umapCanvas" class="umap"></canvas>
    </div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  
  export default Vue.component('umap-plot', {
    props: {
      points: {
        type: Array,
        required: true,
      },
      colors: {
        type: Array,
        required: false,
      },
      width:{
        type: Number,
        deafult: 200,
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
      }
    },
    watch: {
      colors: {
        handler() {
          this.drawUMAP();
        },
        deep: true,
      },
    },
    mounted() {
      this.drawUMAP();
    },
    methods: {
      drawUMAP(){
            const {points, colors, width} = this;

            console.log('drawUMAP', points, colors);

            if(!points) return;


            const canvas = this.$refs.umapCanvas;
            const ctx = canvas.getContext("2d");
            const canvasWidth = width;

            canvas.width = canvasWidth*2;
            canvas.height = canvasWidth*2;
            canvas.style.width = canvasWidth+'px';
            canvas.style.height = canvasWidth+'px';

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            this.resetPlot(canvas);

            if(!this.pointBoundsCalculated){
                console.log('calculating umap point bounds');
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

                console.log(this.pointBounds);

                this.calculateScaleFactor(canvas);

                this.pointBoundsCalculated = true;
            }
            
            const boundsCenter = {
                x: (this.center.x ),
                y: (this.center.y )
            }

            //draw points
            points.forEach((coord, index) => {
                const px = coord.X;
                const py = coord.Y;

                const x = ((px - this.pointBounds.w) * this.zoom) + this.boundsOffset.x/2;
                const y = ((this.pointBounds.s - py) * this.zoom) + this.boundsOffset.y/2;

                ctx.beginPath();
                ctx.arc(x, y, 0.5, 0, 2 * Math.PI);
                ctx.fillStyle = colors[index] || '#ccc';
                ctx.fill();
            });

            return;
            //debug
            ctx.beginPath();
            var x = this.center.x;
            var y = this.center.y;
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();

            ctx.beginPath();
            var x = boundsCenter.x;
            var y = boundsCenter.y;
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();

            ctx.strokeStyle = "green";
            ctx.strokeRect(boundsCenter.x - boundsSizeScaled/2, boundsCenter.y - boundsHeight/2, boundsSizeScaled, boundsHeight);
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
    },
  });
  </script>
  
  <style scoped>
  </style>
  