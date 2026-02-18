<template>
    <div class="hero-interact fill-width fill-height"></div>
</template>

<script>
import Vue from "vue";
//import * as d3 from "d3";

export default Vue.component("matkp-hero", {
    components: {},
    props: [],
    data() {
        return {
            delauneyActive: false,
        };
    },
    computed: {},
    mounted() {
        //inject latest d3 //TODO update package to load latest
        this.injectScript("https://cdn.jsdelivr.net/npm/d3@7");
    },
    created() {
        window.addEventListener("resize", () => {
            this.drawVoronoi();
        });
    },
    methods: {
        injectScript(scriptPath) {
            // Dynamically create a <script> tag to load library from CDN
            const script = document.createElement("script");
            script.src = scriptPath;
            script.onload = () => {
                console.log("Library loaded", scriptPath);
                this.drawVoronoi();
            };
            script.onerror = () => {
                console.error("Error loading library", scriptPath);
            };
            document.head.appendChild(script);
        },
        drawVoronoi() {
            const container = document.querySelector(".hero-interact");
            container.innerHTML = "";
            const width = container.offsetWidth * 2;
            const height = container.offsetHeight * 2;
            console.log(container.offsetWidth, container.offsetHeight);

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.style.width = width * 0.5 + "px";
            canvas.style.height = height * 0.5 + "px";
            canvas.width = width;
            canvas.height = height;
            container.appendChild(canvas);

            const n = 200;
            const particles = Array.from({ length: n }, () => [
                Math.random() * width,
                Math.random() * height,
            ]);
            const originalPositions = particles.map((p) => [...p]); // Store original positions

            const radius = 200; // Radius around the mouse for interaction
            const moveFactor = 0.02; // Factor to control how much particles move towards the mouse

            const update = () => {
                const delaunay = d3.Delaunay.from(particles);
                const voronoi = delaunay.voronoi([
                    0.5,
                    0.5,
                    width - 0.5,
                    height - 0.5,
                ]);
                context.clearRect(0, 0, width, height);

                for (let i = 0; i < particles.length; i++) {
                    const cell = voronoi.cellPolygon(i);
                    if (cell) {
                        context.beginPath();
                        const path = new Path2D(smoothPolygonPath(cell));

                        // Generate yellowish colors based on the index
                        var red = 255; // Fixed red component
                        var green = Math.floor(180 + (i % 76)); // Vary green component based on the index
                        var blue = Math.floor(0.1 * 255); // Keep blue component low
                        var alpha = 0.56; // Fixed alpha for consistent transparency
                        //context.strokeStyle = "#ffa50080";
                        context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                        context.lineWidth = calculatePolygonArea(cell) * 0.0005;
                        context.stroke(path);

                        red = 255; // Fixed red component
                        green = Math.floor(200 + (i % 46)); // Vary green component based on the index
                        blue = Math.floor(0.1 * 255); // Keep blue component low
                        alpha = 0.56; // Fixed alpha for consistent transparency
                        //context.fillStyle = "#fff20090";
                        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                        context.fill(path);
                    }
                }

                if (this.delauneyActive) {
                    context.beginPath();
                    voronoi.render(context);
                    voronoi.renderBounds(context);
                    context.lineWidth = 1;
                    context.strokeStyle = "gray";
                    context.stroke();

                    context.beginPath();
                    delaunay.renderPoints(context);
                    context.fillStyle = "gray";
                    context.fill();
                }
            };

            const smoothPolygonPath = (cellData) => {
                // Extract polygon vertices from the data bound to the Voronoi cell
                const vertices = cellData
                    ? cellData
                          .map((d) => (d ? [d[0], d[1]] : null))
                          .filter(Boolean)
                    : [];

                // Remove last point (its a copy of the first) so we can make nice closed loop
                vertices.pop();

                // Smooth out the curves
                const interpolate = d3
                    .line()
                    .x((d) => d[0])
                    .y((d) => d[1])
                    .curve(d3.curveBasisClosed);

                return interpolate(vertices);
            };

            const distance = (point1, point2) => {
                return Math.sqrt(
                    (point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2
                );
            };

            const calculatePolygonArea = (cellData) => {
                const vertices = cellData
                    ? cellData
                          .map((d) => (d ? [d[0], d[1]] : null))
                          .filter(Boolean)
                    : [];
                let area = 0;
                const n = vertices.length;

                for (let i = 0; i < n; i++) {
                    const [x1, y1] = vertices[i];
                    const [x2, y2] = vertices[(i + 1) % n];
                    area += x1 * y2 - y1 * x2;
                }
                return Math.abs(area);
            };

            context.canvas.onclick = () => {
                this.delauneyActive = !this.delauneyActive;
                update();
            };
            context.canvas.ontouchmove = context.canvas.onmousemove = (
                event
            ) => {
                event.preventDefault();
                const mousePos = [event.layerX * 2, event.layerY * 2];
                //mouse as particle
                particles[0] = [mousePos[0], mousePos[1]];

                particles.forEach((particle, index) => {
                    const dist = distance(particle, mousePos);
                    const originalPos = originalPositions[index];

                    if (dist < radius) {
                        // Move particle towards mouse maintaining distance from original position
                        const angle = Math.atan2(
                            mousePos[1] - originalPos[1],
                            mousePos[0] - originalPos[0]
                        );
                        const targetX =
                            originalPos[0] + radius * Math.cos(angle);
                        const targetY =
                            originalPos[1] + radius * Math.sin(angle);

                        particle[0] -= moveFactor * (targetX - particle[0]);
                        particle[1] -= moveFactor * (targetY - particle[1]);
                    } else {
                        // Move particle back to original position smoothly
                        particle[0] +=
                            (originalPos[0] - particle[0]) * moveFactor;
                        particle[1] +=
                            (originalPos[1] - particle[1]) * moveFactor;
                    }
                });

                update();
            };
            update();
        },
    },
});
</script>

<style scoped>
.hero-interact {
    position: fixed;
    top: 0;
    left: 0;
    background: #ffea4e;
    background: linear-gradient(to top, #ffb254, #ffea4e);
}
</style>
