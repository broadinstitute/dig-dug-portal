<template>
    <div class="network-container">
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
                Stabilizing: {{ Math.round(stabilizationProgress) }}%
            </div>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import { Network } from "vis-network";
import { DataSet } from "vis-data";

export default Vue.component("NetworkGraph", {
    //props: phenotype, sigma and geneset size
    data() {
        return {
            network: null,
            loading: false,
            stabilizing: false,
            stabilizationProgress: 0,
            nodes: new DataSet([]),
            edges: new DataSet([]),
        };
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
            try {
                const response = await fetch(
                    "https://bioindex-dev.hugeamp.org/api/bio/query/pigean-graph?q=T2D,2,small"
                );
                const data = await response.json();

                this.nodes.clear();
                this.edges.clear();
                this.nodes.add(data.data[0].nodes);
                this.edges.add(data.data[0].edges);

                await this.$nextTick();
                await this.initNetwork();

                // Initial fit after data load
                if (this.network) {
                    this.network.fit({
                        animation: false,
                    });
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                this.loading = false;
            }
        },

        initNetwork() {
            if (!this.$refs.networkContainer) return;

            const container = this.$refs.networkContainer;
            const data = {
                nodes: this.nodes,
                edges: this.edges,
            };
            const options = {
                physics: {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 100,
                        updateInterval: 50,
                        fit: true,
                    },
                },
            };

            this.network = new Network(container, data, options);

            // Add stabilization events
            this.network.on("startStabilizing", () => {
                this.stabilizing = true;
            });

            this.network.on("stabilizationProgress", (params) => {
                this.stabilizationProgress =
                    (params.iterations / params.total) * 100;
            });

            this.network.on("stabilizationIterationsDone", () => {
                this.stabilizing = false;
                this.stabilizationProgress = 100;
                this.network.setOptions({ physics: false });

                // Final fit after stabilization with animation
                setTimeout(() => {
                    if (this.network) {
                        this.network.fit({
                            animation: {
                                duration: 1000,
                                easingFunction: "easeInOutQuad",
                            },
                            scale: 1.2, // Zoom out slightly more
                        });
                    }
                }, 500);
            });
        },
    },
});
</script>

<style scoped>
.network-container {
    position: relative;
    width: 100%;
    height: 400px;
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
</style>
