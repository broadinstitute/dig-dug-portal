<template>
    <div class="network-container" :style="containerStyle">
        <div v-if="error" class="error-alert">
            {{ error }}
        </div>
        <button
            class="btn btn-sm control-button physics-button"
            :disabled="stabilizing"
            @click="togglePhysics"
        >
            {{ physicsEnabled ? "Disable" : "Enable" }} Physics
        </button>
        <button
            class="btn btn-sm ml-2 control-button nav-button"
            @click="toggleNavigation"
        >
            {{ showNavigation ? "Hide" : "Show" }} Navigation
        </button>
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
import { Network, DataSet } from "vis-network";
import bioIndexUtils from "@/utils/bioIndexUtils";

export default Vue.component("NetworkGraph", {
    props: {
        phenotype: {
            type: Object,
            required: true,
            default: () => ({}),
        },
        genesetSize: {
            type: String,
            required: true,
            default: "small",
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
            physicsEnabled: false,
            error: null,
            showNavigation: false,
        };
    },
    computed: {
        containerStyle() {
            return {
                height: "400px",
                position: "relative",
                width: "100%",
                overflow: "hidden", // Prevent internal scrolling
            };
        },
    },
    watch: {
        phenotype: {
            handler(newVal, oldVal) {
                if (newVal?.name !== oldVal?.name) {
                    this.refreshGraph();
                }
            },
            deep: true,
        },
        genesetSize: {
            handler() {
                this.refreshGraph();
            },
        },
    },
    async mounted() {
        await this.$nextTick();
        await this.fetchGraphData();
    },
    beforeDestroy() {
        if (this.network) {
            this.network.destroy();
        }
    },
    methods: {
        async fetchGraphData() {
            this.loading = true;
            this.error = null;
            //just the number
            const phenotype = this.phenotype.name;
            try {
                const response = await fetch(
                    `https://bioindex-dev.hugeamp.org/api/bio/query/pigean-graph?q=${phenotype},${
                        bioIndexUtils.DEFAULT_SIGMA},${this.genesetSize}`
                );
                const data = await response.json();

                // Check if data exists
                if (!data.data?.[0]?.nodes?.length) {
                    this.error = "No data available";
                    this.nodes.clear();
                    this.edges.clear();
                    return; // Early return to prevent rerender
                }

                // Clear existing data
                this.nodes.clear();
                this.edges.clear();

                // Track seen IDs and filter duplicates
                const seenIds = new Set();
                const uniqueNodes = data.data[0].nodes.filter((node) => {
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
                this.edges.add(data.data[0].edges);
                this.edges.flush();

                await this.$nextTick();
                await this.initNetwork();

                // Initial fit after data load
                if (this.network) {
                    this.network.fit({
                        animation: false,
                    });
                }
            } catch (error) {
                this.error = error.message;
                console.error("Error:", error);
            } finally {
                this.loading = false;
            }
        },

        async loadNetworkData() {
            this.loading = true;
            const chunkSize = 1000;

            for (let i = 0; i < this.data.length; i += chunkSize) {
                const chunk = this.data.slice(i, i + chunkSize);
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        this.nodes.add(chunk);
                        resolve();
                    });
                });
            }

            this.loading = false;
        },

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

        initNetwork() {
            const container = this.$refs.networkContainer;
            const data = { nodes: this.nodes, edges: this.edges };

            const options = {
                physics: {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 150, // Fewer iterations
                        updateInterval: 40, // Slightly faster updates
                        fit: true,
                    },
                    barnesHut: {
                        gravitationalConstant: -4000,
                        centralGravity: 0.1, // Increased to prevent drift
                        springLength: 200,
                        springConstant: 0.015, // Slightly stiffer springs
                        damping: 0.15, // Less damping for more movement
                        avoidOverlap: 1,
                    },
                    minVelocity: 0.15, // Slightly higher min velocity
                    maxVelocity: 15, // Slightly higher max velocity
                    timestep: 0.35, // Slightly larger timesteps
                },
                layout: {
                    improvedLayout: true,
                    randomSeed: undefined, // Random layout each time
                    clusterThreshold: 150,
                    hierarchical: {
                        enabled: false,
                    },
                },
                interaction: {
                    navigationButtons: this.showNavigation, // Off by default
                    keyboard: true,
                    hideEdgesOnDrag: true,
                    hideEdgesOnZoom: true,
                },
                nodes: {
                    scaling: {
                        min: 8, // Smaller minimum size
                        max: 24, // Smaller maximum size
                    },
                },
                edges: {
                    smooth: {
                        type: "continuous",
                        forceDirection: "none",
                        roundness: 0.5,
                    },
                    length: 250, // Longer default edge length
                },
            };

            this.network = new Network(container, data, options);

            // Add complete physics disable after stabilization
            this.network.on("stabilizationIterationsDone", () => {
                this.stabilizing = false;
                this.stabilizationProgress = 100;

                // Completely disable physics
                this.network.setOptions({
                    physics: {
                        enabled: false,
                        stabilization: {
                            enabled: false,
                        },
                    },
                });

                // Lock positions
                const positions = this.network.getPositions();
                Object.keys(positions).forEach((nodeId) => {
                    this.nodes.update({
                        id: nodeId,
                        fixed: true,
                        x: positions[nodeId].x,
                        y: positions[nodeId].y,
                    });
                });
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

        async refreshGraph() {
            try {
                this.error = null;
                this.loading = true;
                this.stabilizing = true;
                this.stabilizationProgress = 0;

                // Cleanup existing network
                if (this.network) {
                    this.network.destroy();
                    this.network = null;
                }

                // Clear datasets
                this.nodes.clear();
                this.edges.clear();

                // Fetch new data and reinitialize
                await this.fetchGraphData();
                await this.$nextTick();
                await this.initNetwork();

                // Fit view
                if (this.network) {
                    this.network.fit({
                        animation: {
                            duration: 1000,
                            easingFunction: "easeInOutQuad",
                        },
                    });
                }
            } catch (error) {
                console.error("Failed to refresh graph:", error);
            } finally {
                this.loading = false;
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
    right: 160px; /* Make room for nav button */
}

.nav-button {
    right: 10px;
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
</style>
