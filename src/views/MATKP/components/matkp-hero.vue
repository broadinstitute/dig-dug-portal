<template>
    <div class="hero-wrap f-col align-h-center align-v-center">
        <div class="hero-interact fill-width fill-height"></div>
        <div class="logo f-row">
            <div style="align-self:flex-start;transform: scale(1.25);transform-origin: center;">
                Mammalian<br>Adipose<br>Tissue<br><span style="font-size:9.2px;display: block;">Knowledge Portal</span>
            </div>
        </div>
        <div class="tagline">The place for fat.</div>
    </div>
</template>

<script>
import Vue from "vue";
//import * as d3 from "d3";

export default Vue.component("matkp-hero", {
    components: {
    },
    props: [],
    data() {
        return {
            
        };
    },
    computed: {
    },
    mounted() {
        //inject latest d3 //TODO update package to load latest
        this.injectScript('https://cdn.jsdelivr.net/npm/d3@7');
    },
    created() {
        
    },
    methods: {
        injectScript(scriptPath){
            // Dynamically create a <script> tag to load library from CDN
            const script = document.createElement('script');
            script.src = scriptPath;
            script.onload = () => {
                console.log('Library loaded', scriptPath);
                this.drawVoronoi();
            };
            script.onerror = () => {
                console.error('Error loading library', scriptPath);
            };
            document.head.appendChild(script);
        },
        drawVoronoi(){
            const container = document.querySelector('.hero-interact');
            const width = container.offsetWidth * 2;
            const height = container.offsetHeight * 2;

            const canvas = document.createElement('canvas');
            const context = canvas.getContext("2d");
            canvas.style.width = (width*0.5)+'px';
            canvas.width = width;
            canvas.height = height;
            container.appendChild(canvas);
            

            const n = 100;
            const particles = Array.from({length: n}, () => [Math.random() * width, Math.random() * height]);
            const originalPositions = particles.map(p => [...p]); // Store original positions

            const radius = 200; // Radius around the mouse for interaction
            const moveFactor = 0.02; // Factor to control how much particles move towards the mouse

            function update() {
                const delaunay = d3.Delaunay.from(particles);
                const voronoi = delaunay.voronoi([0.5, 0.5, width - 0.5, height - 0.5]);
                context.clearRect(0, 0, width, height);

                context.beginPath();
                voronoi.render(context);
                voronoi.renderBounds(context);
                context.strokeStyle = "#000";
                context.stroke();

                context.beginPath();
                delaunay.renderPoints(context);
                context.fill();
            }

            function distance(point1, point2) {
                return Math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2);
            }

            context.canvas.ontouchmove = 
            context.canvas.onmousemove = event => {
                event.preventDefault();
                const mousePos = [event.layerX*2, event.layerY*2];
                particles[0] = [mousePos[0], mousePos[1]];

                particles.forEach((particle, index) => {
                const dist = distance(particle, mousePos);
                const originalPos = originalPositions[index];
                
                if (dist < radius) {
                    // Move particle towards mouse maintaining distance from original position
                    const angle = Math.atan2(mousePos[1] - originalPos[1], mousePos[0] - originalPos[0]);
                    const targetX = originalPos[0] + radius * Math.cos(angle);
                    const targetY = originalPos[1] + radius * Math.sin(angle);
                    
                    particle[0] -= moveFactor * (targetX - particle[0]);
                    particle[1] -= moveFactor * (targetY - particle[1]);
                } else {
                    // Move particle back to original position smoothly
                    particle[0] += (originalPos[0] - particle[0]) * moveFactor;
                    particle[1] += (originalPos[1] - particle[1]) * moveFactor;
                }
                });

                update();
            };

            update();
        }
    },
});
</script>

<style scoped>
.hero-wrap{
    min-height: 500px;
    background: rgb(183, 183, 183);
    position: relative;
}
.logo{
    margin: 50px;
}
.hero-interact {
    position: absolute;
    top: 0;
    left: 0;
}
</style>