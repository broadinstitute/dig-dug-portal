<template>
    <div
        ref="umapContainer"
        class="umap-container"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
        @mouseover="onMouseOver"
        @mouseout="onMouseOut"
        @wheel.prevent="onWheel"
        @contextmenu.prevent
        style="width:100%; position:relative; overflow-x:hidden;"
    >
        <div v-if="expression" style="display:flex; flex-direction: column; position:absolute; top:4px; left:5px;" class="legend">
            <div class="label">Expression</div>
            <div class="gradient" :style="`background: linear-gradient(to right, ${colorScaleArray()}); height:5px;`"></div>
            <div style="display:flex" class="marks"><div>{{ minExpressionValue() }}</div><div>{{ maxExpressionValue() }}</div></div>
        </div>
        <div
            v-if="points"
            style="display:flex; align-items: center; justify-content: flex-end; gap:5px; position: absolute; right: 5px; top: 5px; z-index: 1"
        >
            <button @click="showTooltips = !showTooltips" v-b-tooltip.hover.bottom title="toggle cell info" :style="!showTooltips ? 'background:#ddd' : 'background:white'">
                <svg style="width:12px;margin:0 4px;" viewBox="0 0 15.098 18.794" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(-.27 -.301)">
                        <path d="M.77 14.361V.801h14.098v13.56H10.51l-2.853 4.234-2.605-4.234z" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="7.845" cy="4.296" r=".979"/>
                        <path d="M7.094 5.928h1.501v5.876H7.094z"/>
                    </g>
                </svg>
            </button>
            <button @click="toggleLabels" v-b-tooltip.hover.bottom title="toggle labels" :style="!showLabels ? 'background:#ddd' : 'background:white'">
                <svg style="width:20px;" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" transform="rotate(270)">
                    <path d="M24.896 9.463a.997.997 0 0 0-.707-.293l-12.957-.001a1 1 0 0 0-1 .996l-.046 13.005a.998.998 0 0 0 .293.711l16.995 16.995a.997.997 0 0 0 1.414 0l13.004-13.004a.999.999 0 0 0 0-1.414L24.896 9.463zm3.285 29.292L12.188 22.761l.041-11.592 11.547.001 15.995 15.995-11.59 11.59z" />
                    <circle cx="20.362" cy="19.346" r="2.61" />
                </svg>
            </button>
            <button @click="resetPanZoom" v-b-tooltip.hover.bottom title="recenter">
                <svg style="width:18px;" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12H4V4h8v2H6v6zM28 12h-2V6h-6V4h8v8zM12 28H4v-8h2v6h6v2zM28 28h-8v-2h6v-6h2v8zM15 10h2v4h-2zM10 15h4v2h-4zM18 15h4v2h-4zM15 18h2v4h-2z" />
                    <path fill="none" d="M0 0h32v32H0z" />
                </svg>
            </button>
            <button
                v-b-tooltip.hover.bottom.html
                :title="is3dMode ? 'zoom: mouse wheel<br>rotate: click + drag<br>pan: shift + drag or right drag' : 'zoom: mouse wheel<br>pan: click + drag'"
            >
                <svg style="width:18px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 19.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm0 1.5a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm.75-6v1.5h-1.5V15h1.5Zm-2.25-4.568C10.5 9.662 11.15 9 12 9s1.5.663 1.5 1.432c0 .307-.185.671-.592 1.084-.395.4-.898.743-1.315 1.013l-.343.222v1.499h1.5v-.688c.381-.259.833-.595 1.225-.992.507-.514 1.025-1.24 1.025-2.138C15 8.79 13.635 7.5 12 7.5s-3 1.291-3 2.932h1.5Z" fill="#000" />
                </svg>
            </button>
            <button @click="download" v-b-tooltip.hover.bottom title="Download">
                <svg style="width:24px;" fill="#000000" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_iconCarrier">
                        <path d="M512 666.5L367.2 521.7l36.2-36.2 83 83V256h51.2v312.5l83-83 36.2 36.2L512 666.5zm-204.8 50.3V768h409.6v-51.2H307.2z"></path>
                    </g>
                </svg>
            </button>
        </div>

        <canvas ref="umapCanvas" class="umap-canvas" @click="onClick"></canvas>
        <canvas ref="umapLabelCanvas" class="umap-label-canvas" :style="`display:${showLabels ? 'block' : 'none'}`"></canvas>
        <canvas v-if="is3dMode" ref="axisIndicatorCanvas" class="umap-axis-indicator"></canvas>
    </div>
</template>

<script>
import * as d3 from 'd3';
import Vue from 'vue';
import EventBus from "@/utils/eventBus";
import sharedUmapData from "@/components/researchPortal/singleCellBrowser/sharedUmapData.js";
import mouseTooltip from '@/components/researchPortal/singleCellBrowser/mouseTooltip.js';
import { llog } from "./llog.js";

const DEG_TO_RAD = Math.PI / 180;
const EPSILON = 0.000001;
const VIEW_PADDING = 0.1;
const RESET_CAMERA_DISTANCE_3D_MULTIPLIER = 0.9;
const PAN_SENSITIVITY_3D = 1.2;
const AXIS_INDICATOR_SIZE = 50;
const MIN_ZOOM_RATIO_2D = 0.1;
const MAX_ZOOM_RATIO_2D = 20;
const IDENTITY_MATRIX = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]);

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function addVec3(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function subtractVec3(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scaleVec3(v, scalar) {
    return [v[0] * scalar, v[1] * scalar, v[2] * scalar];
}

function dotVec3(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function crossVec3(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}

function lengthVec3(v) {
    return Math.hypot(v[0], v[1], v[2]);
}

function normalizeVec3(v) {
    const len = lengthVec3(v);
    if (len < EPSILON) return [0, 0, 0];
    return [v[0] / len, v[1] / len, v[2] / len];
}

function perspectiveMatrix(fovRadians, aspect, near, far) {
    const f = 1.0 / Math.tan(fovRadians / 2);
    const rangeInv = 1 / (near - far);

    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0,
    ]);
}

function orthographicMatrix(left, right, bottom, top, near, far) {
    return new Float32Array([
        2 / (right - left), 0, 0, 0,
        0, 2 / (top - bottom), 0, 0,
        0, 0, -2 / (far - near), 0,
        -((right + left) / (right - left)),
        -((top + bottom) / (top - bottom)),
        -((far + near) / (far - near)),
        1,
    ]);
}

function lookAtMatrix(eye, target, up) {
    const zAxis = normalizeVec3(subtractVec3(eye, target));
    const xAxis = normalizeVec3(crossVec3(up, zAxis));
    const yAxis = crossVec3(zAxis, xAxis);

    return new Float32Array([
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -dotVec3(xAxis, eye), -dotVec3(yAxis, eye), -dotVec3(zAxis, eye), 1,
    ]);
}

function multiplyMatrices(a, b) {
    const out = new Float32Array(16);

    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
            let sum = 0;
            for (let i = 0; i < 4; i++) {
                sum += a[i * 4 + row] * b[col * 4 + i];
            }
            out[col * 4 + row] = sum;
        }
    }

    return out;
}

function transformPoint(matrix, point) {
    const [x, y, z] = point;
    return [
        matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
        matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
        matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
        matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15],
    ];
}

function colorToRgba(color, alpha = 255) {
    const rgb = d3.color(color || "#000000").rgb();
    return [rgb.r, rgb.g, rgb.b, alpha];
}

export default Vue.component('research-umap-plot-gl', {
    props: {
        group: {
            type: String,
            required: true,
        },
        points: {
            type: Array,
            required: true,
        },
        labels: {
            type: Object,
            required: true,
        },
        colors: {
            type: Object,
            required: true,
        },
        cellTypeField: {
            type: String,
            required: false,
        },
        colorByField: {
            type: String,
            required: false,
        },
        hoverFields: {
            type: Array,
            required: false,
        },
        width: {
            type: Number,
            default: 800,
        },
        height: {
            type: Number,
            default: 800,
        },
        highlightLabel: {
            type: String,
            default: null,
        },
        highlightLabels: {
            type: Array,
            default: () => [],
        },
        expression: {
            type: Array,
            default: null,
        },
        expressionColorScale: {
            type: String,
            required: false,
            default: "blue"
        }
    },
    data() {
        return {
            gl: null,
            program: null,
            locations: null,
            buffers: {
                points: {},
                axes: {},
                hover: {},
            },
            showLabels: true,
            showTooltips: true,
            pointBounds: {
                minX: 0,
                maxX: 0,
                minY: 0,
                maxY: 0,
                minZ: 0,
                maxZ: 0,
                center: [0, 0, 0],
                size: [0, 0, 0],
                radius: 1,
            },
            camera: {
                target: [0, 0, 0],
                distance: 1,
                yaw: 0,
                pitch: 0,
            },
            resetCamera: {
                target: [0, 0, 0],
                distance: 1,
                yaw: 0,
                pitch: 0,
            },
            projection: {
                fov: 45 * DEG_TO_RAD,
                near: 0.1,
                far: 10000,
                aspect: 1,
            },
            orthoBaseHalfHeight: 1,
            isHovering: false,
            interactionMode: null,
            lastMouse: { x: 0, y: 0 },
            vertexCount: 0,
            axisVertexCount: 0,
            clusterCenters: [],
            expressionScale: null,
            expressionExtent: {
                min: null,
                max: null,
            },
            resizeTimeout: null,

            colorOptions: {
                red: d3.interpolateReds,
                blue: d3.interpolate("lightgrey", "blue")
            },
            projectedPoints: [],
            projectedLabels: [],
            renderMatrix: null,
            viewMatrix: IDENTITY_MATRIX,
            orthoBounds: null,
            hoveredPointIndex: -1,
            pointDrawOrder: [],
            cameraVectors: {
                eye: [0, 0, 1],
                forward: [0, 0, -1],
                right: [1, 0, 0],
                up: [0, 1, 0],
            },
            sharedGroupAttached: false,
            renderQueued: false,
            renderProjectionDirty: true,
            syncPending: false,
            rafId: null,
            hoverVertexCount: 0,
        };
    },
    computed: {
        is3dMode() {
            return this.points.some(point => (point.Z ?? 0) !== 0);
        },
        currColorOption(){
            return this.colorOptions[this.expressionColorScale];
        }
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
                this.cleanUpBuffers();
                this.calculateClusterCenters();
                this.setupBuffers();
                this.requestRender(true);
            },
        },
        cellTypeField(){
            if(!this.points) return;
            this.cleanUp();
            this.init();
        },
        colorByField() {
            this.setupBuffers({
                rebuildPositions: false,
                rebuildColors: true,
                rebuildOrder: false,
                rebuildHighlight: true,
                rebuildAxes: false,
            });
            this.requestRender(true);
        },
        highlightLabel() {
            this.updateHighlightBuffer();
            this.requestRender(true);
        },
        highlightLabels() {
            this.updateHighlightBuffer();
            this.requestRender(true);
        },
        expression() {
            this.updateExpressionScale();
            this.setupBuffers({
                rebuildPositions: !this.is3dMode,
                rebuildColors: true,
                rebuildOrder: !this.is3dMode,
                rebuildHighlight: !this.is3dMode,
                rebuildAxes: false,
            });
            this.requestRender(true);
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
        colorScaleArray() {
            return d3.range(0, 1.01, 0.1).map(t => this.currColorOption(t)).join(', ');
        },
        minExpressionValue(){
            return this.expressionExtent.min
        },
        maxExpressionValue(){
            return this.expressionExtent.max
        },
        handleResize() {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.init();
            }, 100);
        },

        toggleLabels() {
            this.showLabels = !this.showLabels;
            this.requestRender(true);
        },

        init() {
            llog("---glUMAP init");

            if (!this.$refs.umapContainer || !this.points || this.points.length === 0) return;

            if (this.sharedGroupAttached) {
                sharedUmapData.release(this.group);
            }
            sharedUmapData.initPoints(this.group, this.points);
            this.sharedGroupAttached = true;

            const parentWidth = this.$refs.umapContainer.parentElement.offsetWidth;
            this.$refs.umapContainer.style.height = `${this.height}px`;

            const pixelRatio = window.devicePixelRatio || 1;
            const canvas = this.$refs.umapCanvas;
            canvas.width = parentWidth * pixelRatio;
            canvas.height = this.height * pixelRatio;
            canvas.style.width = `${parentWidth}px`;
            canvas.style.height = `${this.height}px`;

            const labelCanvas = this.$refs.umapLabelCanvas;
            labelCanvas.width = parentWidth * pixelRatio;
            labelCanvas.height = this.height * pixelRatio;
            labelCanvas.style.width = `${parentWidth}px`;
            labelCanvas.style.height = `${this.height}px`;

            this.setupAxisIndicatorCanvas(pixelRatio);

            this.calculatePointBounds();
            this.calculateClusterCenters();
            this.resetCameraFromBounds();
            this.initializeWebGL();
            this.updateExpressionScale();
            this.setupBuffers();
            this.requestRender(true);
        },

        cleanUpBuffers() {
            const gl = this.gl;
            if (!gl) return;

            Object.values(this.buffers.points).forEach(buffer => {
                if (buffer) gl.deleteBuffer(buffer);
            });
            Object.values(this.buffers.axes).forEach(buffer => {
                if (buffer) gl.deleteBuffer(buffer);
            });
            Object.values(this.buffers.hover).forEach(buffer => {
                if (buffer) gl.deleteBuffer(buffer);
            });

            this.buffers = { points: {}, axes: {}, hover: {} };
        },

        cleanUp() {
            this.cleanUpBuffers();

            if (this.gl && this.program) {
                this.gl.deleteProgram(this.program);
            }

            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }

            this.program = null;
            this.gl = null;
            this.locations = null;
            mouseTooltip.hide();
            if (this.sharedGroupAttached) {
                sharedUmapData.release(this.group);
                this.sharedGroupAttached = false;
            }
        },

        setupAxisIndicatorCanvas(pixelRatio) {
            const canvas = this.$refs.axisIndicatorCanvas;
            if (!canvas) return;

            canvas.width = AXIS_INDICATOR_SIZE * pixelRatio;
            canvas.height = AXIS_INDICATOR_SIZE * pixelRatio;
            canvas.style.width = `${AXIS_INDICATOR_SIZE}px`;
            canvas.style.height = `${AXIS_INDICATOR_SIZE}px`;
        },

        calculatePointBounds() {
            const bounds = {
                minX: Infinity,
                maxX: -Infinity,
                minY: Infinity,
                maxY: -Infinity,
                minZ: Infinity,
                maxZ: -Infinity,
            };

            this.points.forEach(point => {
                const z = point.Z ?? 0;
                if (point.X < bounds.minX) bounds.minX = point.X;
                if (point.X > bounds.maxX) bounds.maxX = point.X;
                if (point.Y < bounds.minY) bounds.minY = point.Y;
                if (point.Y > bounds.maxY) bounds.maxY = point.Y;
                if (z < bounds.minZ) bounds.minZ = z;
                if (z > bounds.maxZ) bounds.maxZ = z;
            });

            const size = [
                Math.max(bounds.maxX - bounds.minX, 1),
                Math.max(bounds.maxY - bounds.minY, 1),
                Math.max(bounds.maxZ - bounds.minZ, 1),
            ];

            const center = [
                (bounds.minX + bounds.maxX) / 2,
                (bounds.minY + bounds.maxY) / 2,
                (bounds.minZ + bounds.maxZ) / 2,
            ];

            this.pointBounds = {
                ...bounds,
                size,
                center,
                radius: Math.max(...size) / 2 || 1,
            };
        },

        calculateClusterCenters() {
            this.clusterCenters = [];
            const labelField = this.cellTypeField || Object.keys(this.labels.metadata_labels)[0];
            const metadata = this.labels.metadata[labelField];
            const metadataLabels = this.labels.metadata_labels[labelField];

            const sums = {};
            this.points.forEach((point, index) => {
                const labelIndex = metadata[index];
                const label = metadataLabels[labelIndex] || 'Unlabeled';
                if (!sums[label]) {
                    sums[label] = { xSum: 0, ySum: 0, zSum: 0, count: 0 };
                }
                sums[label].xSum += point.X;
                sums[label].ySum += point.Y;
                sums[label].zSum += this.is3dMode ? (point.Z ?? 0) : 0;
                sums[label].count++;
            });

            Object.entries(sums).forEach(([label, info]) => {
                this.clusterCenters.push({
                    label,
                    position: [
                        info.xSum / info.count,
                        info.ySum / info.count,
                        info.zSum / info.count,
                    ],
                });
            });
        },

        resetCameraFromBounds() {
            this.projection.aspect = this.$refs.umapCanvas.width / Math.max(this.$refs.umapCanvas.height, 1);

            const viewportUsage = 1 - (VIEW_PADDING * 2);
            let distance;

            if (this.is3dMode) {
                const yaw = -Math.PI / 4;
                const pitch = Math.PI / 7;
                const eyeDirection = normalizeVec3([
                    Math.cos(pitch) * Math.sin(yaw),
                    Math.sin(pitch),
                    Math.cos(pitch) * Math.cos(yaw),
                ]);
                const forward = normalizeVec3(scaleVec3(eyeDirection, -1));
                const right = normalizeVec3(crossVec3(forward, [0, 1, 0]));
                const up = normalizeVec3(crossVec3(right, forward));
                const tanHalfFovY = Math.tan(this.projection.fov / 2) * viewportUsage;
                const tanHalfFovX = tanHalfFovY * this.projection.aspect;
                const [sx, sy, sz] = this.pointBounds.size;
                const halfSizes = [sx / 2, sy / 2, sz / 2];

                distance = this.projection.near;
                for (const dx of [-halfSizes[0], halfSizes[0]]) {
                    for (const dy of [-halfSizes[1], halfSizes[1]]) {
                        for (const dz of [-halfSizes[2], halfSizes[2]]) {
                            const offset = [dx, dy, dz];
                            const x = Math.abs(dotVec3(offset, right));
                            const y = Math.abs(dotVec3(offset, up));
                            const z = dotVec3(offset, forward);

                            distance = Math.max(
                                distance,
                                (x / Math.max(tanHalfFovX, EPSILON)) - z,
                                (y / Math.max(tanHalfFovY, EPSILON)) - z
                            );
                        }
                    }
                }
                distance *= RESET_CAMERA_DISTANCE_3D_MULTIPLIER;
            } else {
                const halfWidth = Math.max(this.pointBounds.size[0] / 2, EPSILON);
                const halfHeight = Math.max(this.pointBounds.size[1] / 2, EPSILON);
                this.orthoBaseHalfHeight = Math.max(
                    halfHeight,
                    halfWidth / Math.max(this.projection.aspect, EPSILON)
                ) / Math.max(viewportUsage, EPSILON);
                distance = 1;
            }

            const camera = {
                target: [...this.pointBounds.center],
                distance,
                yaw: this.is3dMode ? -Math.PI / 4 : 0,
                pitch: this.is3dMode ? Math.PI / 7 : 0,
            };

            this.camera = {
                target: [...camera.target],
                distance: camera.distance,
                yaw: camera.yaw,
                pitch: camera.pitch,
            };
            this.resetCamera = {
                target: [...camera.target],
                distance: camera.distance,
                yaw: camera.yaw,
                pitch: camera.pitch,
            };
            this.updateCameraState();
        },

        initializeWebGL() {
            const canvas = this.$refs.umapCanvas;
            const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
            if (!gl) {
                console.error('WebGL not supported');
                return;
            }

            this.gl = gl;

            const vertexShaderSource = `
                attribute vec3 a_position;
                attribute vec4 a_color;
                attribute float a_isHighlight;

                uniform mat4 u_matrix;
                uniform float u_pointSize;
                uniform float u_renderPoints;
                uniform float u_hoverScale;
                uniform float u_minPointScale;
                uniform float u_maxPointScale;
                uniform float u_highlightMode;

                varying vec4 v_color;
                varying float v_renderPoints;

                void main() {
                    if (u_highlightMode < 1.5 && a_isHighlight < 0.5) {
                        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
                        gl_PointSize = 0.0;
                        v_color = vec4(0.0);
                        v_renderPoints = u_renderPoints;
                        return;
                    }

                    if (u_highlightMode > 1.5 && a_isHighlight > 0.5) {
                        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
                        gl_PointSize = 0.0;
                        v_color = vec4(0.0);
                        v_renderPoints = u_renderPoints;
                        return;
                    }

                    gl_Position = u_matrix * vec4(a_position, 1.0);
                    float pointScale = mix(u_minPointScale, u_maxPointScale, a_isHighlight);
                    gl_PointSize = u_pointSize * pointScale * u_hoverScale;
                    v_color = a_color;
                    v_renderPoints = u_renderPoints;
                }
            `;

            const fragmentShaderSource = `
                precision mediump float;
                varying vec4 v_color;
                varying float v_renderPoints;

                void main() {
                    if (v_renderPoints > 0.5) {
                        vec2 centered = gl_PointCoord - vec2(0.5);
                        if (dot(centered, centered) > 0.25) {
                            discard;
                        }
                    }

                    gl_FragColor = v_color;
                }
            `;

            const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
            const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
            this.program = this.createProgram(gl, vertexShader, fragmentShader);
            gl.useProgram(this.program);
            this.locations = {
                position: gl.getAttribLocation(this.program, 'a_position'),
                color: gl.getAttribLocation(this.program, 'a_color'),
                highlight: gl.getAttribLocation(this.program, 'a_isHighlight'),
                matrix: gl.getUniformLocation(this.program, 'u_matrix'),
                pointSize: gl.getUniformLocation(this.program, 'u_pointSize'),
                renderPoints: gl.getUniformLocation(this.program, 'u_renderPoints'),
                hoverScale: gl.getUniformLocation(this.program, 'u_hoverScale'),
                minPointScale: gl.getUniformLocation(this.program, 'u_minPointScale'),
                maxPointScale: gl.getUniformLocation(this.program, 'u_maxPointScale'),
                highlightMode: gl.getUniformLocation(this.program, 'u_highlightMode'),
            };
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.DEPTH_TEST);
        },

        getActiveLabelField() {
            return this.colorByField || this.cellTypeField || Object.keys(this.labels.metadata_labels)[0];
        },

        updateExpressionScale() {
            if (!this.expression || this.expression.length === 0) {
                this.expressionScale = null;
                this.expressionExtent = { min: null, max: null };
                return;
            }

            let min = Infinity;
            let max = -Infinity;
            for (let index = 0; index < this.expression.length; index++) {
                const value = this.expression[index];
                if (value == null || Number.isNaN(value)) continue;
                if (value < min) min = value;
                if (value > max) max = value;
            }

            if (min === Infinity || max === -Infinity) {
                this.expressionScale = null;
                this.expressionExtent = { min: null, max: null };
                return;
            }

            this.expressionExtent = { min, max };
            this.expressionScale = d3.scaleSequential(this.currColorOption).domain([0, max]);
        },

        buildPointOrder() {
            const count = this.points.length;
            const indices = Array.from({ length: count }, (_, index) => index);

            if (!this.is3dMode && this.expression) {
                indices.sort((a, b) => {
                    const va = this.expression[a] ?? -Infinity;
                    const vb = this.expression[b] ?? -Infinity;
                    return va - vb;
                });
            }

            return indices;
        },

        buildPositionBuffer(indices) {
            const count = indices.length;
            const originalPositions = sharedUmapData.getPositions(this.group);
            const positions = new Float32Array(count * 3);

            for (let drawIndex = 0; drawIndex < count; drawIndex++) {
                const index = indices[drawIndex];
                positions[drawIndex * 3] = originalPositions[index * 3];
                positions[drawIndex * 3 + 1] = originalPositions[index * 3 + 1];
                positions[drawIndex * 3 + 2] = this.is3dMode ? originalPositions[index * 3 + 2] : 0;
            }

            return positions;
        },

        buildColorBuffer(indices) {
            const labelField = this.getActiveLabelField();
            const metadata = this.labels.metadata[labelField];
            const metadataLabels = this.labels.metadata_labels[labelField];
            const colors = new Uint8Array(indices.length * 4);
            const labelColors = this.colors[labelField] || {};

            for (let drawIndex = 0; drawIndex < indices.length; drawIndex++) {
                const index = indices[drawIndex];

                let rgba;
                if (this.expressionScale && this.expression[index] != null) {
                    rgba = colorToRgba(this.expressionScale(this.expression[index]));
                } else {
                    const labelIndex = metadata[index];
                    const label = metadataLabels[labelIndex];
                    rgba = colorToRgba(labelColors[label] || "#000000");
                }

                rgba[3] = 255;
                colors.set(rgba, drawIndex * 4);
            }

            return colors;
        },

        buildAxisBuffers() {
            const [sx, sy, sz] = this.pointBounds.size;
            const axisLength = Math.max(sx, sy, sz) * 0.65 || 1;
            const [cx, cy, cz] = this.pointBounds.center;

            const positions = new Float32Array([
                cx - axisLength, cy, cz, cx + axisLength, cy, cz,
                cx, cy - axisLength, cz, cx, cy + axisLength, cz,
                cx, cy, cz - axisLength, cx, cy, cz + axisLength,
            ]);

            const xColor = colorToRgba("#d64545");
            const yColor = colorToRgba("#2e9b46");
            const zColor = colorToRgba("#2f6fe4");
            const colors = new Uint8Array([
                ...xColor, ...xColor,
                ...yColor, ...yColor,
                ...zColor, ...zColor,
            ]);
            const highlight = new Uint8Array([255, 255, 255, 255, 255, 255]);

            return { positions, colors, highlight, vertexCount: 6 };
        },

        makeBuffer(data, existingBuffer = null) {
            const gl = this.gl;
            const buffer = existingBuffer || gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            return buffer;
        },

        setupBuffers(options = {}) {
            const gl = this.gl;
            if (!gl) return;

            const {
                rebuildPositions = true,
                rebuildColors = true,
                rebuildOrder = true,
                rebuildHighlight = true,
                rebuildAxes = true,
            } = options;

            if (rebuildOrder || this.pointDrawOrder.length !== this.points.length) {
                this.pointDrawOrder = this.buildPointOrder();
            }

            this.vertexCount = this.points.length;

            if (rebuildPositions) {
                const positions = this.buildPositionBuffer(this.pointDrawOrder);
                this.buffers.points.position = this.makeBuffer(positions, this.buffers.points.position);
            }

            if (rebuildColors) {
                const colors = this.buildColorBuffer(this.pointDrawOrder);
                this.buffers.points.color = this.makeBuffer(colors, this.buffers.points.color);
            }

            if (rebuildHighlight) {
                this.updateHighlightBuffer(this.pointDrawOrder);
            }

            if (rebuildAxes) {
                const axisData = this.buildAxisBuffers();
                this.axisVertexCount = axisData.vertexCount;
                this.buffers.axes.position = this.makeBuffer(axisData.positions, this.buffers.axes.position);
                this.buffers.axes.color = this.makeBuffer(axisData.colors, this.buffers.axes.color);
                this.buffers.axes.highlight = this.makeBuffer(axisData.highlight, this.buffers.axes.highlight);
            }

            this.updateHoverBuffer();
        },

        updateHoverBuffer() {
            const gl = this.gl;
            if (!gl) return;

            if (this.hoveredPointIndex === -1) {
                this.hoverVertexCount = 0;
                return;
            }

            const point = this.points[this.hoveredPointIndex];
            if (!point) {
                this.hoverVertexCount = 0;
                return;
            }

            const positions = new Float32Array([
                point.X,
                point.Y,
                this.is3dMode ? (point.Z ?? 0) : 0,
            ]);
            const colors = new Uint8Array([0, 0, 0, 255]);
            const highlight = new Uint8Array([255]);

            this.buffers.hover.position = this.makeBuffer(positions, this.buffers.hover.position);
            this.buffers.hover.color = this.makeBuffer(colors, this.buffers.hover.color);
            this.buffers.hover.highlight = this.makeBuffer(highlight, this.buffers.hover.highlight);
            this.hoverVertexCount = 1;
        },

        updateHighlightBuffer(sortedIndices = null) {
            const gl = this.gl;
            if (!gl) return;

            const indices = sortedIndices || this.pointDrawOrder || Array.from({ length: this.vertexCount }, (_, index) => index);
            const labelField = this.getActiveLabelField();
            const metadata = this.labels.metadata[labelField];
            const metadataLabels = this.labels.metadata_labels[labelField];
            const hasHighlightFilter = !!this.highlightLabel || this.highlightLabels.length > 0;
            const highlight = new Uint8Array(indices.length);

            for (let drawIndex = 0; drawIndex < indices.length; drawIndex++) {
                const pointIndex = indices[drawIndex];
                if (!hasHighlightFilter) {
                    highlight[drawIndex] = 255;
                    continue;
                }

                const labelIndex = metadata[pointIndex];
                const label = metadataLabels[labelIndex];
                highlight[drawIndex] = label === this.highlightLabel || this.highlightLabels.includes(label) ? 255 : 0;
            }

            this.buffers.points.highlight = this.makeBuffer(highlight, this.buffers.points.highlight);
        },

        getEyePosition() {
            const { target, distance, yaw, pitch } = this.camera;
            return [
                target[0] + distance * Math.cos(pitch) * Math.sin(yaw),
                target[1] + distance * Math.sin(pitch),
                target[2] + distance * Math.cos(pitch) * Math.cos(yaw),
            ];
        },

        updateCameraState() {
            if (this.is3dMode) {
                const eye = this.getEyePosition();
                const target = this.camera.target;
                const forward = normalizeVec3(subtractVec3(target, eye));
                const right = normalizeVec3(crossVec3(forward, [0, 1, 0]));
                const up = normalizeVec3(crossVec3(right, forward));

                this.cameraVectors = { eye, forward, right, up };
                this.orthoBounds = null;
                this.viewMatrix = lookAtMatrix(eye, target, up);
                this.renderMatrix = multiplyMatrices(
                    perspectiveMatrix(this.projection.fov, this.projection.aspect, this.projection.near, this.projection.far),
                    this.viewMatrix
                );
                return;
            }

            const zoomRatio = this.camera.distance / this.resetCamera.distance;
            const halfHeight = Math.max(this.orthoBaseHalfHeight * zoomRatio, 0.1);
            const halfWidth = halfHeight * this.projection.aspect;
            const [cx, cy] = this.camera.target;
            this.orthoBounds = {
                left: cx - halfWidth,
                right: cx + halfWidth,
                top: cy + halfHeight,
                bottom: cy - halfHeight,
            };

            this.cameraVectors = {
                eye: [cx, cy, this.camera.distance],
                forward: [0, 0, -1],
                right: [1, 0, 0],
                up: [0, 1, 0],
            };
            this.viewMatrix = IDENTITY_MATRIX;
            this.renderMatrix = orthographicMatrix(
                cx - halfWidth,
                cx + halfWidth,
                cy - halfHeight,
                cy + halfHeight,
                -Math.max(this.pointBounds.radius * 4, 10),
                Math.max(this.pointBounds.radius * 4, 10)
            );
        },

        projectWorldPoint(point) {
            if (!this.renderMatrix) return null;

            const clip = transformPoint(this.renderMatrix, point);
            const w = clip[3];
            if (Math.abs(w) < EPSILON) return null;

            const ndcX = clip[0] / w;
            const ndcY = clip[1] / w;
            const ndcZ = clip[2] / w;

            const canvas = this.$refs.umapCanvas;
            return {
                x: (ndcX * 0.5 + 0.5) * canvas.width,
                y: (1 - (ndcY * 0.5 + 0.5)) * canvas.height,
                depth: ndcZ,
                visible: ndcX >= -1 && ndcX <= 1 && ndcY >= -1 && ndcY <= 1 && ndcZ >= -1 && ndcZ <= 1,
            };
        },

        updateProjectedGeometry() {
            if (this.is3dMode) {
                this.projectedPoints = this.points.map(point => this.projectWorldPoint([point.X, point.Y, point.Z ?? 0]));
            } else {
                this.projectedPoints = [];
            }
            this.projectedLabels = this.clusterCenters
                .map(cluster => {
                    const projection = this.projectWorldPoint(cluster.position);
                    return projection && projection.visible ? { ...cluster, projection } : null;
                })
                .filter(Boolean);
        },

        requestRender(forceProjection = false) {
            if (forceProjection) {
                this.renderProjectionDirty = true;
            }
            if (this.renderQueued) return;

            this.renderQueued = true;
            this.rafId = requestAnimationFrame(() => {
                this.renderQueued = false;
                this.rafId = null;
                this.renderUMAP();
                if (this.syncPending) {
                    this.syncPending = false;
                    this.updateViewTransform();
                }
            });
        },

        scheduleSync() {
            this.syncPending = true;
        },

        renderUMAP() {
            if (!this.gl || !this.program) return;

            this.projection.aspect = this.$refs.umapCanvas.width / Math.max(this.$refs.umapCanvas.height, 1);
            this.updateCameraState();

            if (this.renderProjectionDirty || !this.interactionMode || !this.is3dMode) {
                this.updateProjectedGeometry();
                this.renderProjectionDirty = false;
            }

            this.renderPoints();
            this.drawLabels();
            this.drawAxisIndicator();
        },

        drawAxisIndicator() {
            const canvas = this.$refs.axisIndicatorCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const pixelRatio = window.devicePixelRatio || 1;
            const center = canvas.width / 2;
            const axisLength = canvas.width * 0.24;
            const labelOffset = canvas.width * 0.09;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!this.is3dMode) return;

            const axes = [
                { label: 'X', vector: [1, 0, 0], color: '#d64545' },
                { label: 'Y', vector: [0, 1, 0], color: '#2e9b46' },
                { label: 'Z', vector: [0, 0, 1], color: '#2f6fe4' },
            ].map(axis => {
                const screenX = dotVec3(axis.vector, this.cameraVectors.right);
                const screenY = dotVec3(axis.vector, this.cameraVectors.up);
                const depth = dotVec3(axis.vector, this.cameraVectors.forward);
                return { ...axis, screenX, screenY, depth };
            }).sort((a, b) => a.depth - b.depth);

            ctx.font = `${11 * pixelRatio}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            axes.forEach(axis => {
                const endX = center + (axis.screenX * axisLength);
                const endY = center - (axis.screenY * axisLength);
                const textX = center + (axis.screenX * (axisLength + labelOffset));
                const textY = center - (axis.screenY * (axisLength + labelOffset));

                ctx.strokeStyle = axis.color;
                ctx.lineWidth = 2.5 * pixelRatio;
                ctx.beginPath();
                ctx.moveTo(center, center);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                ctx.fillStyle = axis.color;
                ctx.beginPath();
                ctx.arc(endX, endY, 3 * pixelRatio, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillText(axis.label, textX, textY);
            });
        },

        bindAttributes(bufferSet) {
            const gl = this.gl;

            gl.bindBuffer(gl.ARRAY_BUFFER, bufferSet.position);
            gl.enableVertexAttribArray(this.locations.position);
            gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, bufferSet.color);
            gl.enableVertexAttribArray(this.locations.color);
            gl.vertexAttribPointer(this.locations.color, 4, gl.UNSIGNED_BYTE, true, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, bufferSet.highlight);
            gl.enableVertexAttribArray(this.locations.highlight);
            gl.vertexAttribPointer(this.locations.highlight, 1, gl.UNSIGNED_BYTE, true, 0, 0);
        },

        renderPoints() {
            const gl = this.gl;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.useProgram(this.program);

            gl.uniformMatrix4fv(this.locations.matrix, false, this.renderMatrix);

            const baseSize = this.is3dMode
                ? clamp(Math.max(1.25, 4.5 - Math.log10(Math.max(this.camera.distance / this.pointBounds.radius, 1))), 1.25, 5)
                : clamp(2.2 / (this.camera.distance / this.resetCamera.distance), 1.15, 3.0);
            const hasHighlightFilter = !!this.highlightLabel || this.highlightLabels.length > 0;

            if (this.is3dMode) {
                gl.enable(gl.DEPTH_TEST);
            } else {
                gl.disable(gl.DEPTH_TEST);
            }

            if (this.is3dMode) {
                this.bindAttributes(this.buffers.axes);
                gl.uniform1f(this.locations.renderPoints, 0);
                gl.uniform1f(this.locations.pointSize, 1);
                gl.uniform1f(this.locations.hoverScale, 1);
                gl.uniform1f(this.locations.minPointScale, 1);
                gl.uniform1f(this.locations.maxPointScale, 1);
                gl.uniform1f(this.locations.highlightMode, 0);
                gl.drawArrays(gl.LINES, 0, this.axisVertexCount);
            }

            this.bindAttributes(this.buffers.points);
            gl.uniform1f(this.locations.renderPoints, 1);
            gl.uniform1f(this.locations.pointSize, baseSize * (window.devicePixelRatio || 1));
            gl.uniform1f(this.locations.hoverScale, 1);
            if (!hasHighlightFilter) {
                gl.uniform1f(this.locations.minPointScale, 1);
                gl.uniform1f(this.locations.maxPointScale, 1);
                gl.uniform1f(this.locations.highlightMode, 0);
                gl.drawArrays(gl.POINTS, 0, this.vertexCount);
            } else {
                gl.uniform1f(this.locations.minPointScale, this.is3dMode ? 0.3 : 0.2);
                gl.uniform1f(this.locations.maxPointScale, this.is3dMode ? 1.6 : 2.0);
                gl.uniform1f(this.locations.highlightMode, 2);
                gl.drawArrays(gl.POINTS, 0, this.vertexCount);
                gl.uniform1f(this.locations.highlightMode, 1);
                gl.drawArrays(gl.POINTS, 0, this.vertexCount);
            }

            if (this.hoverVertexCount > 0) {
                this.bindAttributes(this.buffers.hover);
                gl.uniform1f(this.locations.renderPoints, 1);
                gl.uniform1f(this.locations.pointSize, baseSize * 1.75 * (window.devicePixelRatio || 1));
                gl.uniform1f(this.locations.hoverScale, 1);
                gl.uniform1f(this.locations.minPointScale, 1);
                gl.uniform1f(this.locations.maxPointScale, 1);
                gl.uniform1f(this.locations.highlightMode, 0);
                gl.drawArrays(gl.POINTS, 0, this.hoverVertexCount);
            }
        },

        drawLabels() {
            const labelCanvas = this.$refs.umapLabelCanvas;
            const ctx = labelCanvas.getContext('2d');
            ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
            if (!this.showLabels) return;
            if (this.is3dMode && this.interactionMode) return;

            ctx.font = `${14 * (window.devicePixelRatio || 1)}px Arial`;
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 5;

            this.projectedLabels.forEach(cluster => {
                ctx.strokeText(cluster.label, cluster.projection.x, cluster.projection.y);
                ctx.fillText(cluster.label, cluster.projection.x, cluster.projection.y);
            });
        },

        panCamera(dx, dy) {
            const canvas = this.$refs.umapCanvas;
            let scale;
            let xScale;

            if (this.is3dMode) {
                const worldUnitsPerPixel = (2 * this.camera.distance * Math.tan(this.projection.fov / 2)) / Math.max(canvas.height, 1);
                scale = worldUnitsPerPixel * PAN_SENSITIVITY_3D;
                xScale = scale;
            } else {
                scale = (this.camera.distance / this.resetCamera.distance) * (this.pointBounds.radius * 0.0045);
                xScale = scale * (canvas.width / Math.max(canvas.height, 1));
            }

            const move = addVec3(
                scaleVec3(this.cameraVectors.right, -dx * xScale),
                scaleVec3(this.cameraVectors.up, dy * scale)
            );
            this.camera.target = addVec3(this.camera.target, move);
        },

        rotateCamera(dx, dy) {
            if (!this.is3dMode) return;
            this.camera.yaw -= dx * 0.01;
            this.camera.pitch = clamp(this.camera.pitch + dy * 0.01, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
        },

        onWheel(e) {
            const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
            if (this.is3dMode) {
                this.camera.distance = clamp(
                    this.camera.distance * zoomFactor,
                    this.pointBounds.radius * 0.2,
                    this.pointBounds.radius * 30
                );
            } else {
                this.camera.distance = clamp(
                    this.camera.distance * zoomFactor,
                    this.resetCamera.distance * MIN_ZOOM_RATIO_2D,
                    this.resetCamera.distance * MAX_ZOOM_RATIO_2D
                );
            }
            this.scheduleSync();
            this.requestRender(true);
        },

        onMouseDown(e) {
            this.interactionMode = (!this.is3dMode || e.button === 2 || e.shiftKey) ? 'pan' : 'rotate';
            this.lastMouse.x = e.clientX;
            this.lastMouse.y = e.clientY;
        },

        onMouseMove(e) {
            const dx = e.clientX - this.lastMouse.x;
            const dy = e.clientY - this.lastMouse.y;

            if (this.interactionMode) {
                if (this.interactionMode === 'rotate') {
                    this.rotateCamera(dx, dy);
                } else {
                    this.panCamera(dx, dy);
                }

                this.lastMouse.x = e.clientX;
                this.lastMouse.y = e.clientY;
                mouseTooltip.hide();
                this.scheduleSync();
                this.requestRender(false);
                return;
            }

            this.lastMouse.x = e.clientX;
            this.lastMouse.y = e.clientY;

            if (this.isHovering && this.showTooltips) {
                this.handleHover(e);
            }
        },

        handleHover(e) {
            const rect = this.$refs.umapCanvas.getBoundingClientRect();
            const pixelRatio = this.$refs.umapCanvas.width / Math.max(rect.width, 1);
            const mouseX = (e.clientX - rect.left) * pixelRatio;
            const mouseY = (e.clientY - rect.top) * pixelRatio;

            if (!this.is3dMode) {
                const nearestIdx = this.find2DHoverIndex(mouseX, mouseY);
                this.updateHoveredPoint(nearestIdx);
                if (nearestIdx === -1) {
                    mouseTooltip.hide();
                    return;
                }
                this.showHoverTooltip(nearestIdx);
                return;
            }

            let nearestIdx = -1;
            let nearestDist = Infinity;
            const maxDist = 12 * (window.devicePixelRatio || 1);

            for (let i = 0; i < this.projectedPoints.length; i++) {
                const projected = this.projectedPoints[i];
                if (!projected || !projected.visible) continue;

                const dx = projected.x - mouseX;
                const dy = projected.y - mouseY;
                const dist = Math.hypot(dx, dy);

                if (dist < maxDist && dist < nearestDist) {
                    nearestDist = dist;
                    nearestIdx = i;
                }
            }

            this.updateHoveredPoint(nearestIdx);
            if (nearestIdx === -1) {
                mouseTooltip.hide();
                return;
            }
            this.showHoverTooltip(nearestIdx);
        },

        find2DHoverIndex(mouseX, mouseY) {
            if (!this.orthoBounds) return -1;

            const canvas = this.$refs.umapCanvas;
            const dataX = this.orthoBounds.left + (mouseX / canvas.width) * (this.orthoBounds.right - this.orthoBounds.left);
            const dataY = this.orthoBounds.top - (mouseY / canvas.height) * (this.orthoBounds.top - this.orthoBounds.bottom);
            const radius = Math.max(
                ((this.orthoBounds.right - this.orthoBounds.left) / canvas.width) * 8,
                ((this.orthoBounds.top - this.orthoBounds.bottom) / canvas.height) * 8
            );

            const point = sharedUmapData.getQuadtree(this.group)?.find(dataX, dataY, radius);
            if (!point) return -1;
            const index = sharedUmapData.getPointIndex(this.group, point);
            return index == null ? -1 : index;
        },

        updateHoveredPoint(nextIndex) {
            if (this.hoveredPointIndex === nextIndex) return;
            this.hoveredPointIndex = nextIndex;
            this.updateHoverBuffer();
            this.requestRender(false);
        },

        showHoverTooltip(index) {
            let hoverHTML = '<div style="display:grid; grid-template-columns: max-content 1fr; grid-column-gap: 5px; font-size: 12px;">';
            hoverHTML += `<div style="font-weight:bold">Cell ID</div><div>${(this.labels.NAME || this.labels.ID)[index]}</div>`;
            if (this.expression) hoverHTML += `<div style="font-weight:bold">Expression</div><div>${this.expression[index]}</div>`;

            Object.keys(this.labels.metadata_labels).forEach(field => {
                if (!this.isHoverField(field)) return;
                const value = this.labels.metadata_labels[field][this.labels.metadata[field][index]];
                if (value && value !== "") {
                    hoverHTML += `<div style="font-weight:bold;">${field}</div><div>${value}</div>`;
                }
            });

            hoverHTML += '</div>';
            mouseTooltip.show(hoverHTML);
        },

        isHoverField(field) {
            if (!this.hoverFields || this.hoverFields.length === 0) return true;
            return this.hoverFields.includes(field);
        },

        onMouseOver() {
            this.isHovering = true;
        },

        onMouseOut() {
            this.isHovering = false;
            this.updateHoveredPoint(-1);
            mouseTooltip.hide();
        },

        onMouseUp() {
            this.interactionMode = null;
            this.requestRender(true);
        },

        onMouseLeave() {
            this.interactionMode = null;
            this.isHovering = false;
            this.updateHoveredPoint(-1);
            mouseTooltip.hide();
            this.requestRender(true);
        },

        onClick() {},

        resetPanZoom() {
            this.camera = {
                target: [...this.resetCamera.target],
                distance: this.resetCamera.distance,
                yaw: this.resetCamera.yaw,
                pitch: this.resetCamera.pitch,
            };
            this.scheduleSync();
            this.requestRender(true);
        },

        updateViewTransform() {
            EventBus.$emit('view-transform-change', {
                id: this.group,
                viewMode: this.is3dMode ? '3d' : '2d',
                camera: {
                    target: [...this.camera.target],
                    distance: this.camera.distance,
                    yaw: this.camera.yaw,
                    pitch: this.camera.pitch,
                }
            });
        },

        handleUpdateViewTransform(newViewTransform) {
            if (newViewTransform.id !== this.group || newViewTransform.viewMode !== (this.is3dMode ? '3d' : '2d') || !newViewTransform.camera) {
                return;
            }

            this.camera = {
                target: [...newViewTransform.camera.target],
                distance: newViewTransform.camera.distance,
                yaw: newViewTransform.camera.yaw,
                pitch: newViewTransform.camera.pitch,
            };
            this.requestRender(true);
        },

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

        download() {
            const canvas1 = this.$refs.umapCanvas;
            const canvas2 = this.$refs.umapLabelCanvas;
            const scaleFactor = 2;

            const combinedCanvas = document.createElement('canvas');
            combinedCanvas.width = canvas1.width * scaleFactor;
            combinedCanvas.height = canvas1.height * scaleFactor;
            const ctx = combinedCanvas.getContext('2d');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(canvas1, 0, 0, combinedCanvas.width, combinedCanvas.height);
            ctx.drawImage(canvas2, 0, 0, combinedCanvas.width, combinedCanvas.height);

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

.umap-canvas {
    display: block;
    width: 100%;
    height: 100%;
}

.umap-label-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    width: 100%;
    height: 100%;
}

.umap-axis-indicator {
    position: absolute;
    right: 5px;
    bottom: 5px;
    pointer-events: none;
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

.legends {
    gap: 20px;
}
.legend {
    margin: 0 10px 0 0;
    gap:1px;
}
.legend .label {
    font-size: 11px !important;
    line-height: 11px;
}
.legend .gradient {
    height: 15px;
    width: 100px;
    border-radius: 20px;
}
.legend .marks {
    justify-content: space-between;
    font-size: 11px;
    line-height: 11px;
}
</style>
