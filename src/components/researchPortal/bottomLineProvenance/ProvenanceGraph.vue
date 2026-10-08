<template>
    <div class="provenance-graph-wrap">
        <div class="provenance-graph-heading">
            <div class="provenance-summary">{{ activityCount }} stages, {{ resourceCount }} resources</div>
            <div class="provenance-hint">Data flows from top to bottom. Scroll to zoom and drag to pan.</div>
        </div>
        <div class="graph-canvas">
            <div class="graph-controls" role="toolbar" aria-label="Graph controls">
                <b-button class="graph-control-button" size="sm" title="Zoom out" @click="zoomOut">
                    <b-icon-zoom-out aria-hidden="true"></b-icon-zoom-out>
                </b-button>
                <span class="zoom-level">{{ zoomLevel }}%</span>
                <b-button class="graph-control-button" size="sm" title="Zoom in" @click="zoomIn">
                    <b-icon-zoom-in aria-hidden="true"></b-icon-zoom-in>
                </b-button>
                <b-button class="graph-control-button" size="sm" title="Fit graph to view" @click="fitGraph">
                    <b-icon-arrows-fullscreen aria-hidden="true"></b-icon-arrows-fullscreen>
                    Fit
                </b-button>
            </div>
            <div ref="graph" class="provenance-graph" :style="{ height: `${graphHeight}px` }"></div>
        </div>
    </div>
</template>

<script>
import { DataSet } from "vis-data";
import { Network } from "vis-network";
import { BIconArrowsFullscreen, BIconZoomIn, BIconZoomOut } from "bootstrap-vue";

const RESOURCE_GROUPS = {
    c2m2_files: "C2M2 file",
    datasets: "Dataset",
    drs_objects: "DRS object",
};

const STAGE_COLORS = [
    { background: "#f5e9f7", border: "#7e3f8e" },
    { background: "#fce8ec", border: "#a03f59" },
    { background: "#fff0e1", border: "#995b14" },
    { background: "#faf3d9", border: "#806914" },
    { background: "#e8f3e4", border: "#46752b" },
    { background: "#e6f4ed", border: "#1d7452" },
    { background: "#e3f4f5", border: "#16757b" },
    { background: "#e6ebfa", border: "#3f57a0" },
];
const RESOURCE_COLORS = [
    { background: "#e4f1ff", border: "#135b9c" },
    { background: "#e4f7f1", border: "#0d7060" },
    { background: "#fff4d6", border: "#8d6300" },
    { background: "#eef0f3", border: "#4c5967" },
    { background: "#f9e9e9", border: "#994848" },
    { background: "#e8f3e4", border: "#49772d" },
];

export default {
    name: "ProvenanceGraph",
    components: {
        BIconArrowsFullscreen,
        BIconZoomIn,
        BIconZoomOut,
    },
    props: {
        provenance: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            network: null,
            graphHeight: 600,
            zoomLevel: 100,
        };
    },
    computed: {
        graphData() {
            const resources = new Map();
            const activities = this.provenance.activities || [];
            const connectedResourceIds = new Set([
                ...(this.provenance.used_edges || []).map((edge) => edge.object),
                ...(this.provenance.was_generated_by_edges || []).map((edge) => edge.subject),
            ]);

            Object.keys(RESOURCE_GROUPS).forEach((group) => {
                (this.provenance[group] || []).forEach((resource) => {
                    resources.set(resource.id, {
                        id: resource.id,
                        name: resource.name || resource.filename || resource.id,
                        type: RESOURCE_GROUPS[group],
                    });
                });
            });

            const ensureResource = (id) => {
                if (!resources.has(id)) {
                    resources.set(id, { id, name: id, type: "Resource" });
                }
            };
            (this.provenance.used_edges || []).forEach((edge) => ensureResource(edge.object));
            (this.provenance.was_generated_by_edges || []).forEach((edge) => ensureResource(edge.subject));

            const producerByResource = new Map();
            (this.provenance.was_generated_by_edges || []).forEach((edge) => {
                producerByResource.set(edge.subject, edge.object);
            });

            const activityIds = new Set(activities.map((activity) => activity.id));
            const dependencies = new Map(activities.map((activity) => [activity.id, new Set()]));
            (this.provenance.used_edges || []).forEach((edge) => {
                const producer = producerByResource.get(edge.object);
                if (producer && producer !== edge.subject && activityIds.has(edge.subject)) {
                    dependencies.get(edge.subject).add(producer);
                }
            });

            const activityRanks = this.activityRanks(activities, dependencies);
            const graphResources = Array.from(resources.values()).filter((resource) => connectedResourceIds.has(resource.id));
            const resourceRanks = new Map();
            graphResources.forEach((resource) => {
                const producer = producerByResource.get(resource.id);
                resourceRanks.set(resource.id, producer ? (activityRanks.get(producer) || 0) + 1 : 0);
            });

            const stageColors = this.colorMap(activities.map((activity) => activity.activity_type || "Activity"), STAGE_COLORS);
            const resourceColors = this.colorMap(graphResources.map((resource) => resource.type), RESOURCE_COLORS);
            const nodes = [
                ...graphResources.map((resource) => ({
                    id: `resource-${resource.id}`,
                    label: this.graphLabel(resource.type, resource.name),
                    level: resourceRanks.get(resource.id) || 0,
                    color: this.nodeColor(resourceColors[resource.type]),
                    group: "resource",
                    title: this.escapeHtml(`${resource.type}: ${resource.name}`),
                })),
                ...activities.map((activity) => {
                    const type = activity.activity_type || "Activity";
                    const name = activity.name || activity.description || activity.id;
                    return {
                        id: `activity-${activity.id}`,
                        label: this.graphLabel(this.stageLabel(type), name),
                        level: activityRanks.get(activity.id) || 1,
                        color: this.nodeColor(stageColors[type]),
                        group: "stage",
                        title: this.escapeHtml(`${this.stageLabel(type)}: ${name}`),
                    };
                }),
            ];
            const edges = [
                ...(this.provenance.used_edges || []).map((edge, index) => ({
                    id: `used-${index}`,
                    from: `resource-${edge.object}`,
                    to: `activity-${edge.subject}`,
                })),
                ...(this.provenance.was_generated_by_edges || []).map((edge, index) => ({
                    id: `generated-${index}`,
                    from: `activity-${edge.object}`,
                    to: `resource-${edge.subject}`,
                })),
            ];

            return { nodes, edges };
        },
        activityCount() {
            return (this.provenance.activities || []).length;
        },
        resourceCount() {
            return this.graphData.nodes.length - this.activityCount;
        },
    },
    watch: {
        provenance: {
            handler() {
                this.renderGraph();
            },
            deep: true,
        },
    },
    mounted() {
        this.renderGraph();
        window.addEventListener("resize", this.renderGraph);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.renderGraph);
        if (this.network) {
            this.network.destroy();
        }
    },
    methods: {
        activityRanks(activities, dependencies) {
            const remaining = new Map(activities.map((activity) => [activity.id, activity]));
            const ranks = new Map();

            while (remaining.size) {
                const ready = Array.from(remaining.values()).filter((activity) => {
                    return Array.from(dependencies.get(activity.id)).every((id) => ranks.has(id));
                });
                const current = ready.length ? ready : Array.from(remaining.values());

                current.forEach((activity) => {
                    const parentRanks = Array.from(dependencies.get(activity.id)).map((id) => ranks.get(id) || 0);
                    ranks.set(activity.id, parentRanks.length ? Math.max(...parentRanks) + 2 : 1);
                    remaining.delete(activity.id);
                });
            }

            return ranks;
        },
        colorMap(values, colors) {
            const result = {};
            Array.from(new Set(values)).sort().forEach((value, index) => {
                result[value] = colors[index % colors.length];
            });
            return result;
        },
        nodeColor(colors) {
            return {
                background: colors.background,
                border: colors.border,
                highlight: { background: colors.background, border: "#123f66" },
                hover: { background: colors.background, border: "#123f66" },
            };
        },
        stageLabel(value) {
            return value.replace(/Stage$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
        },
        shortLabel(value) {
            const label = String(value);
            return label.length > 48 ? `${label.slice(0, 45)}…` : label;
        },
        graphLabel(type, name) {
            return `<b>${this.escapeHtml(type)}</b>\n${this.escapeHtml(this.shortLabel(name))}`;
        },
        graphDimensions() {
            const nodesByLevel = new Map();
            this.graphData.nodes.forEach((node) => {
                if (!nodesByLevel.has(node.level)) {
                    nodesByLevel.set(node.level, 0);
                }
                nodesByLevel.set(node.level, nodesByLevel.get(node.level) + 1);
            });

            const maxLevel = Math.max(...Array.from(nodesByLevel.keys()), 0);
            const maxRows = Math.max(...Array.from(nodesByLevel.values()), 1);
            return { width: 120 + maxRows * 290, height: 140 + maxLevel * 165 };
        },
        orderedNodes() {
            const ranks = new Map();
            const parents = new Map();
            const children = new Map();

            this.graphData.nodes.forEach((node) => {
                if (!ranks.has(node.level)) {
                    ranks.set(node.level, []);
                }
                ranks.get(node.level).push(node);
                parents.set(node.id, []);
                children.set(node.id, []);
            });
            this.graphData.edges.forEach((edge) => {
                if (parents.has(edge.to) && children.has(edge.from)) {
                    parents.get(edge.to).push(edge.from);
                    children.get(edge.from).push(edge.to);
                }
            });

            const levels = Array.from(ranks.keys()).sort((first, second) => first - second);
            levels.forEach((level) => ranks.get(level).sort((first, second) => first.label.localeCompare(second.label)));
            const positions = new Map();
            const updatePositions = () => {
                levels.forEach((level) => ranks.get(level).forEach((node, index) => positions.set(node.id, index)));
            };
            const sortByNeighbours = (nodes, neighbours) => {
                nodes.sort((first, second) => {
                    const firstNeighbours = neighbours.get(first.id).map((id) => positions.get(id)).filter((index) => index !== undefined);
                    const secondNeighbours = neighbours.get(second.id).map((id) => positions.get(id)).filter((index) => index !== undefined);
                    const firstAverage = firstNeighbours.length
                        ? firstNeighbours.reduce((sum, index) => sum + index, 0) / firstNeighbours.length
                        : positions.get(first.id);
                    const secondAverage = secondNeighbours.length
                        ? secondNeighbours.reduce((sum, index) => sum + index, 0) / secondNeighbours.length
                        : positions.get(second.id);

                    return firstAverage - secondAverage || first.label.localeCompare(second.label);
                });
            };

            updatePositions();
            for (let pass = 0; pass < 4; pass += 1) {
                levels.slice(1).forEach((level) => {
                    sortByNeighbours(ranks.get(level), parents);
                    updatePositions();
                });
                levels.slice(0, -1).reverse().forEach((level) => {
                    sortByNeighbours(ranks.get(level), children);
                    updatePositions();
                });
            }

            const crossingsForLevelPair = (firstLevel, secondLevel) => {
                const firstPositions = new Map(ranks.get(firstLevel).map((node, index) => [node.id, index]));
                const secondPositions = new Map(ranks.get(secondLevel).map((node, index) => [node.id, index]));
                const edges = this.graphData.edges.filter((edge) => firstPositions.has(edge.from) && secondPositions.has(edge.to));
                let crossings = 0;

                for (let firstIndex = 0; firstIndex < edges.length; firstIndex += 1) {
                    for (let secondIndex = firstIndex + 1; secondIndex < edges.length; secondIndex += 1) {
                        const firstEdge = edges[firstIndex];
                        const secondEdge = edges[secondIndex];
                        const sourceOrder = firstPositions.get(firstEdge.from) - firstPositions.get(secondEdge.from);
                        const targetOrder = secondPositions.get(firstEdge.to) - secondPositions.get(secondEdge.to);
                        if (sourceOrder * targetOrder < 0) {
                            crossings += 1;
                        }
                    }
                }

                return crossings;
            };
            const localCrossings = (levelIndex) => {
                let crossings = 0;
                if (levelIndex > 0) {
                    crossings += crossingsForLevelPair(levels[levelIndex - 1], levels[levelIndex]);
                }
                if (levelIndex < levels.length - 1) {
                    crossings += crossingsForLevelPair(levels[levelIndex], levels[levelIndex + 1]);
                }
                return crossings;
            };

            for (let pass = 0; pass < 3; pass += 1) {
                levels.forEach((level, levelIndex) => {
                    const nodes = ranks.get(level);
                    for (let index = 0; index < nodes.length - 1; index += 1) {
                        const before = localCrossings(levelIndex);
                        [nodes[index], nodes[index + 1]] = [nodes[index + 1], nodes[index]];
                        const after = localCrossings(levelIndex);
                        if (after >= before) {
                            [nodes[index], nodes[index + 1]] = [nodes[index + 1], nodes[index]];
                        }
                    }
                });
            }

            return levels.flatMap((level) => {
                const nodes = ranks.get(level);
                return nodes.map((node, index) => ({
                    ...node,
                    x: (index - (nodes.length - 1) / 2) * 280,
                    y: level * 165,
                }));
            });
        },
        renderGraph() {
            this.$nextTick(() => {
                const dimensions = this.graphDimensions();
                const availableWidth = this.$el.clientWidth || 1;
                const scale = Math.min(1, availableWidth / dimensions.width);
                this.graphHeight = Math.max(600, Math.round(dimensions.height * scale));

                this.$nextTick(() => {
                    if (this.network) {
                        this.network.destroy();
                    }
                    this.network = new Network(this.$refs.graph, {
                        nodes: new DataSet(this.orderedNodes()),
                        edges: new DataSet(this.graphData.edges),
                    }, {
                        autoResize: true,
                        layout: { improvedLayout: false },
                        physics: false,
                        nodes: {
                            shape: "box",
                            margin: { top: 7, right: 9, bottom: 7, left: 9 },
                            font: { color: "#39424c", face: "Arial", size: 10, multi: "html" },
                        },
                        groups: {
                            stage: {
                                margin: { top: 12, right: 14, bottom: 12, left: 14 },
                                widthConstraint: { minimum: 210, maximum: 210 },
                                heightConstraint: { minimum: 70 },
                                font: { color: "#39424c", face: "Arial", size: 12, multi: "html" },
                            },
                            resource: {
                                widthConstraint: { minimum: 145, maximum: 145 },
                                heightConstraint: { minimum: 46 },
                                font: { color: "#39424c", face: "Arial", size: 10, multi: "html" },
                            },
                        },
                        edges: {
                            arrows: { to: { enabled: true, scaleFactor: 0.65 } },
                            color: { color: "#9da7b0", highlight: "#20517f", hover: "#20517f" },
                            smooth: { enabled: true, type: "cubicBezier", forceDirection: "vertical", roundness: 0.35 },
                            width: 1.5,
                        },
                        interaction: { hover: true, navigationButtons: true, keyboard: false, zoomSpeed: 0.35 },
                    });
                    this.network.on("zoom", (event) => {
                        this.zoomLevel = Math.round(event.scale * 100);
                    });
                    this.network.once("afterDrawing", () => this.fitGraph(false));
                });
            });
        },
        fitGraph(animate = true) {
            if (!this.network) {
                return;
            }

            this.network.fit({ animation: animate ? { duration: 200, easingFunction: "easeInOutQuad" } : false });
            this.updateZoomLevel();
        },
        zoomIn() {
            this.setZoom(1.2);
        },
        zoomOut() {
            this.setZoom(1 / 1.2);
        },
        setZoom(factor) {
            if (!this.network) {
                return;
            }

            this.network.moveTo({
                position: this.network.getViewPosition(),
                scale: this.network.getScale() * factor,
                animation: { duration: 120, easingFunction: "easeInOutQuad" },
            });
            this.updateZoomLevel();
        },
        updateZoomLevel() {
            this.$nextTick(() => {
                if (this.network) {
                    this.zoomLevel = Math.round(this.network.getScale() * 100);
                }
            });
        },
        escapeHtml(value) {
            return String(value).replace(/[&<>'"]/g, (character) => {
                return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
            });
        },
    },
};
</script>

<style scoped>
.provenance-graph-heading {
    display: flex;
    gap: 16px;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 10px;
}

.provenance-summary,
.provenance-hint {
    color: #555;
    font-size: 13px;
}

.provenance-graph {
    grid-area: 1 / 1;
    width: 100%;
    min-height: 600px;
    overflow: hidden;
    border: 1px solid #d7d7d7;
    border-radius: 4px;
    background: #fff;
}

.graph-canvas {
    display: grid;
}

.graph-controls {
    position: sticky;
    top: 10px;
    z-index: 3;
    display: flex;
    gap: 4px;
    align-items: center;
    grid-area: 1 / 1;
    justify-self: end;
    align-self: start;
    margin: 10px;
    pointer-events: auto;
}

.graph-control-button {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    border-color: #8ba7c8;
    background: #fff;
    color: #20517f;
    font-size: 12px;
}

.graph-control-button:hover,
.graph-control-button:focus {
    border-color: #426f9f;
    background: #e4eef8;
    color: #123f66;
}

.zoom-level {
    min-width: 46px;
    padding: 4px 6px;
    border: 1px solid #8ba7c8;
    border-radius: 3px;
    background: #fff;
    color: #39424c;
    font-size: 12px;
    text-align: center;
}

@media (max-width: 767px) {
    .provenance-graph-heading {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>
