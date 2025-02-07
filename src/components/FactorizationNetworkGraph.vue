<template>
    <div class="network-container" :style="containerStyle">
        <div v-if="error" class="error-alert">
            {{ error }}
        </div>
        <template v-if="!isEmbed">
            <button
                class="btn btn-sm control-button physics-button"
                :disabled="stabilizing"
                @click="togglePhysics"
            >
                <b-icon
                    :icon="physicsEnabled ? 'toggle-on' : 'toggle-off'"
                ></b-icon>
                Physics
            </button>
            <button
                class="btn btn-sm control-button nav-button"
                @click="toggleNavigation"
            >
                <b-icon :icon="!showNavigation ? 'eye-slash' : 'eye'"></b-icon>
                Navigation
            </button>
            <button
                class="btn btn-sm control-button fullscreen-button"
                @click="toggleFullscreen"
            >
                <b-icon
                    :icon="isFullscreen ? 'fullscreen-exit' : 'fullscreen'"
                ></b-icon>
                Fullscreen
            </button></template
        >
        <div
            v-show="!loading && !stabilizing"
            ref="networkContainer"
            class="vis-network"
        ></div>
        <div v-if="loading" class="loading">Loading data...</div>
        <div v-if="stabilizing" class="stabilization-progress">
            <div class="progress-bar">
                <div
                    class="progress-fill"
                    :style="{ width: `${stabilizationProgress}%` }"
                ></div>
            </div>
            <div class="progress-text">
                {{ Math.round(stabilizationProgress) }}%
            </div>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import { BIO_INDEX_HOST, DEFAULT_SIGMA } from "@/utils/bioIndexUtils";
import { Network, DataSet } from "vis-network";

export default Vue.component("FactorizationNetworkGraph", {
    props: {
        factorGraphData: {
            type: Object,
            required: true,
            default: () => ({nodes: [], edges:[]})
        },
        isEmbed: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            network: null,
            loading: false,
            stabilizing: false,
            stabilizationProgress: 0,
            nodes: new DataSet({
                queue: true, // Enable queue mode for batch updates
            }),
            edges: new DataSet({
                queue: true,
            }),
            physicsEnabled: !this.isEmbed || false,
            error: null,
            showNavigation: false,
            isFullscreen: false,
        };
    },
    computed: {
        containerStyle() {
            return {
                height: !this.isEmbed ? "80vh" : "400px",
                width: "100%",
                position: this.isFullscreen ? "fixed" : "relative",
                top: this.isFullscreen ? "0" : "auto",
                left: this.isFullscreen ? "0" : "auto",
                zIndex: this.isFullscreen ? "9999" : "1",
                background: "#fff",
            };
        },
    },
    watch: {
        factorGraphData: {
            // Can we get away with this, or too computationally expensive?
            handler(newVal, oldVal) {
                if (newVal !== oldVal){
                    //this.setupGraphData(newVal);
                    this.refreshGraph(newVal);
                }
            },
            deep: true,
        },
    },
    async mounted() {
        await this.$nextTick();
        document.addEventListener("fullscreenchange", () => {
            this.isFullscreen = !!document.fullscreenElement;
            if (this.network) {
                this.network.fit();
            }
        });
    },
    beforeDestroy() {
        if (this.network) {
            this.network.destroy();
        }
        document.removeEventListener("fullscreenchange", () => {});
    },
    methods: {
        /* async setupGraphData(newVal) {
            this.loading = true;
            this.error = null;

            // Clear existing data
            this.nodes.clear();
            this.edges.clear();

            // Return if data does not exist
            if (newVal.nodes.length === 0 || newVal.edges.length === 0) {
                this.error = "No data available";
                return; // Early return to prevent rerender
            }    

            // Track seen IDs and filter duplicates
            const seenIds = new Set();
            const uniqueNodes = newVal.nodes.filter((node) => {
                if (seenIds.has(node.id)) {
                    console.warn(`Duplicate node ID found: ${node.id}`);
                    return false;
                }
                seenIds.add(node.id);
                return true;
            });

            // Add filtered nodes
            this.nodes.add(uniqueNodes);
            this.nodes.flush();

            // Add edges after node validation
            this.edges.add(newVal.edges);
            this.edges.flush();

            await this.$nextTick();
            await this.initNetwork();

            // Initial fit after data load
            if (this.network) {
                this.network.fit({
                    animation: false,
                });
            }

            this.loading = false;
            // REFRESH??
        } */

        // Pre-process data before adding to network
        preprocessData(rawData) {
            return rawData.map((item) => ({
                id: item.id,
                label: item.label,
                // Only include necessary properties
                // Remove unnecessary nesting
                ...this.getVisualProperties(item),
            }));
        },

        getNetworkOptions() {
            return {
                physics: {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 10,
                        updateInterval: 50,
                        fit: true,
                    },
                    timestep: 0.5,
                    adaptiveTimestep: true,
                    barnesHut: {
                        gravitationalConstant: -10000,
                        centralGravity: 0.5,
                        springLength: 100,
                        springConstant: 0.05,
                        damping: 0.5,
                        avoidOverlap: 0,
                    },
                    minVelocity: 0.1,
                    maxVelocity: 50,
                    solver: "barnesHut",
                },
                interaction: {
                    dragNodes: !this.isEmbed,
                    navigationButtons: this.showNavigation,
                    keyboard: !this.isEmbed,
                    dragView: !this.isEmbed,
                    zoomView: !this.isEmbed,
                },
            };
        },

        processGraphData(data) {
            // Process nodes with unique IDs
            const uniqueNodes = Array.from(
                new Map(
                    data.nodes.map((node) => [
                        String(node.id),
                        { ...node, id: String(node.id) },
                    ])
                ).values()
            );

            // Process edges
            const validEdges = data.edges.map((edge) => ({
                ...edge,
                from: String(edge.from),
                to: String(edge.to),
            }));

            return { uniqueNodes, validEdges };
        },

        async resetNetworkState() {
            if (this.network) {
                this.network.destroy();
                this.network = null;
            }
            this.nodes = new DataSet({ queue: true });
            this.edges = new DataSet({ queue: true });
        },

        async refreshGraph(graphData) {
            this.error = null;
            this.loading = true;
            this.stabilizing = true;
            this.stabilizationProgress = 0;

            await this.resetNetworkState();

            if (graphData.nodes.length === 0) {
                this.error = "No data available";
                return;
            }

            const { uniqueNodes, validEdges } = this.processGraphData(graphData);

            await this.nodes.add(uniqueNodes);
            await this.nodes.flush();
            await this.edges.add(validEdges);
            await this.edges.flush();

            await this.$nextTick();
            await this.initNetwork();
            this.loading = false;
        },

        async initNetwork() {
            const container = this.$refs.networkContainer;
            if (!container) return;

            const data = { nodes: this.nodes, edges: this.edges };
            const options = this.getNetworkOptions();

            // In the network initialization code
            this.network = new Network(container, data, options);

            // Add multiple event listeners for proper stabilization and fitting
            this.network.on("stabilizationStart", () => {
                this.stabilizing = true;
                this.stabilizationProgress = 0;
            });

            this.network.on("stabilizationProgress", (params) => {
                this.stabilizationProgress = Math.round(
                    (params.iterations / params.total) * 100
                );
            });

            this.network.on("stabilizationIterationsDone", () => {
                this.stabilizing = false;
                this.stabilizationProgress = 100;
                // Add slight delay to ensure nodes are in final position
                setTimeout(() => {
                    this.network.fit({
                        animation: {
                            duration: 1000,
                            easingFunction: "easeInOutQuad",
                        },
                        padding: 50, // Add padding around nodes
                    });
                }, 100);
            });

            // Add event listeners
            this.setupNetworkEvents();
        },

        setupNetworkEvents() {
            this.network.on("stabilizationProgress", (params) => {
                this.stabilizationProgress =
                    (params.iterations / params.total) * 100;
            });

            this.network.on("stabilizationIterationsDone", () => {
                this.stabilizing = false;
                this.stabilizationProgress = 100;
                this.network.fit();
                if (this.isEmbed) {
                    this.network.setOptions({
                        physics: {
                            enabled: false,
                        },
                    });
                }
            });
        },

        togglePhysics() {
            this.physicsEnabled = !this.physicsEnabled;

            // Update physics settings
            this.network.setOptions({
                physics: {
                    enabled: this.physicsEnabled,
                    stabilization: {
                        enabled: false, // Don't re-stabilize on toggle
                    },
                },
            });

            // Update node fixed states
            const positions = this.network.getPositions();
            Object.keys(positions).forEach((nodeId) => {
                this.nodes.update({
                    id: nodeId,
                    fixed: !this.physicsEnabled,
                });
            });
        },

        toggleNavigation() {
            this.showNavigation = !this.showNavigation;
            this.network?.setOptions({
                interaction: {
                    navigationButtons: this.showNavigation,
                },
            });
        },

        async toggleFullscreen() {
            try {
                if (!this.isFullscreen) {
                    await this.$refs.networkContainer.requestFullscreen();
                } else {
                    await document.exitFullscreen();
                }
            } catch (error) {
                console.error("Fullscreen error:", error);
            }
        },
    },
});
</script>

<style scoped>
.network-container {
    background: #ffffff;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.vis-network {
    outline: none;
    will-change: transform;
}

.stabilization-progress {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    text-align: center;
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-bar {
    width: 100%;
    height: 20px;
    background: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
}

.progress-fill {
    height: 100%;
    background: #4caf50;
    transition: width 0.3s ease;
}

.progress-text {
    color: #333;
    font-size: 14px;
}

.vis-network {
    width: 100%;
    height: 100%;
    border: 1px solid #ddd;
}

.loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

:fullscreen {
    overflow: hidden;
    margin: 0;
    padding: 0;
    background: white;
}

.control-button {
    position: absolute;
    top: 10px;
    padding: 8px 16px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    z-index: 9;
}

.physics-button {
    right: 274px; /* Position for first button */
}

.nav-button {
    right: 140px; /* Position for middle button */
}

.fullscreen-button {
    right: 10px; /* Position for last button */
}

.control-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.control-button:hover:not(:disabled) {
    background: #f5f5f5;
}

.error-alert {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff3f3;
    border: 1px solid #ff4444;
    padding: 1rem;
    border-radius: 4px;
    z-index: 1000;
}

.fullscreen-button {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
}
</style>
