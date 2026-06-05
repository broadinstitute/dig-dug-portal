<template>
    <div class="wkb-locuszoom-pane">
        <div v-if="!hasInput" class="wkb-locuszoom-empty">
            Locus plot unavailable for this edge because the gene or trait identifier is missing.
        </div>
        <template v-else>
            <div class="wkb-locuszoom-head">
                <div>
                    <h4 class="wkb-locuszoom-title">Locus plot</h4>
                    <p class="wkb-inspector-note">
                        {{
                            region
                                ? `${region.gene} ± ${formatCoordinate(region.flank)} bp on chr${region.chromosome}:${formatCoordinate(region.start)}-${formatCoordinate(region.end)}`
                                : `${locusZoom.gene} ± ${formatCoordinate(locusZoom.flank || 250000)} bp`
                        }}
                    </p>
                </div>
                <span v-if="status !== 'ready'" class="wkb-locuszoom-status">
                    <span class="wkb-locuszoom-spinner" aria-hidden="true" />
                    {{ status === "loading-region" ? "Loading region" : "Loading associations" }}
                </span>
                <div v-else class="wkb-locuszoom-head-meta">
                    <div class="wkb-locuszoom-legend" aria-label="Locus plot color legend">
                        <span><i class="wkb-locuszoom-dot wkb-locuszoom-dot-positive" /> beta &gt;= 0</span>
                        <span><i class="wkb-locuszoom-dot wkb-locuszoom-dot-negative" /> beta &lt; 0</span>
                    </div>
                    <span class="wkb-locuszoom-status">{{ associations.length }} variants</span>
                </div>
            </div>
            <p v-if="error" class="wkb-inspector-note wkb-inspector-note--warn">{{ error }}</p>
            <div class="wkb-locuszoom-plot">
                <canvas
                    ref="plotCanvas"
                    class="wkb-locuszoom-canvas"
                    :aria-label="`Association plot for ${locusZoom.gene} and ${locusZoom.trait_id}`"
                    @mousemove="onPlotMouseMove"
                    @mouseleave="hovered = null"
                />
                <div
                    v-if="hovered"
                    class="wkb-locuszoom-tooltip"
                    :style="{ left: `${hovered.x}px`, top: `${hovered.y}px` }"
                >
                    <strong>{{ hovered.variant || hovered.id }}</strong>
                    <span>p-value: {{ formatPValue(hovered.pValue) }}</span>
                    <span>beta: {{ hovered.beta ?? "NA" }}</span>
                    <span>consequence: {{ hovered.consequence || "NA" }}</span>
                    <span>nearest: {{ nearestLabel(hovered.nearest) }}</span>
                </div>
            </div>
            <div v-if="region" class="wkb-locuszoom-gene-track-panel">
                <div class="wkb-locuszoom-gene-track-toolbar">
                    <span>
                        {{
                            includeNonProteinCodingGenes
                                ? `${allGeneCount} genes shown`
                                : `${proteinCodingGeneCount} protein-coding genes shown`
                        }}
                    </span>
                    <label class="wkb-locuszoom-gene-toggle">
                        <input
                            v-model="includeNonProteinCodingGenes"
                            type="checkbox"
                        />
                        Show non-protein-coding genes
                    </label>
                </div>
                <p v-if="region.gene_track_error" class="wkb-locuszoom-track-warning">
                    Gene-track lookup timed out; showing the focus gene only.
                </p>
                <canvas
                    ref="geneCanvas"
                    class="wkb-locuszoom-gene-canvas"
                    :aria-label="`Gene track for ${region.region || locusZoom.gene}`"
                    @mousemove="onGeneMouseMove"
                    @mouseleave="hoveredGene = null"
                />
                <div
                    v-if="hoveredGene"
                    class="wkb-locuszoom-tooltip"
                    :style="{ left: `${hoveredGene.x}px`, top: `${hoveredGene.y}px` }"
                >
                    <strong>{{ hoveredGene.symbol }}</strong>
                    <span>
                        {{ hoveredGene.chromosome }}:{{ formatCoordinate(hoveredGene.start) }}-{{
                            formatCoordinate(hoveredGene.end)
                        }}
                    </span>
                    <span>{{ hoveredGene.type || "gene" }}</span>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import {
    drawGeneTrack,
    drawLocusPlot,
    formatLocusCoordinate,
    formatLocusPValue,
    genesForRegion,
    nearestLocusLabel,
    visibleGenesForRegion,
} from "./revealKgLocusZoomCanvas.js";

export default {
    name: "WorkspaceGeneTraitLocusZoomPane",
    props: {
        locusZoom: {
            type: Object,
            default: null,
        },
        apiClient: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            region: null,
            associations: [],
            status: "idle",
            error: "",
            hovered: null,
            hoveredGene: null,
            includeNonProteinCodingGenes: false,
            hitPoints: [],
            hitGenes: [],
        };
    },
    computed: {
        hasInput() {
            return Boolean(this.locusZoom?.gene && this.locusZoom?.trait_id);
        },
        allGeneCount() {
            return genesForRegion(this.region).length;
        },
        proteinCodingGeneCount() {
            return visibleGenesForRegion(this.region, false).length;
        },
    },
    watch: {
        locusZoom: {
            immediate: true,
            handler() {
                this.loadLocusData();
            },
        },
        region() {
            this.scheduleRedraw();
        },
        associations() {
            this.scheduleRedraw();
        },
        includeNonProteinCodingGenes() {
            this.scheduleRedraw();
        },
    },
    mounted() {
        window.addEventListener("resize", this.scheduleRedraw);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.scheduleRedraw);
    },
    methods: {
        formatCoordinate: formatLocusCoordinate,
        formatPValue: formatLocusPValue,
        nearestLabel: nearestLocusLabel,
        scheduleRedraw() {
            this.$nextTick(() => {
                requestAnimationFrame(() => this.redraw());
            });
        },
        redraw() {
            this.hitPoints = drawLocusPlot(
                this.$refs.plotCanvas,
                this.region,
                this.associations
            );
            this.hitGenes = drawGeneTrack(
                this.$refs.geneCanvas,
                this.region,
                this.includeNonProteinCodingGenes
            );
        },
        async loadLocusData() {
            if (!this.hasInput || !this.apiClient?.getInteractiveLocusZoomRegion) {
                this.region = null;
                this.associations = [];
                this.status = "idle";
                this.error = "";
                return;
            }
            this.status = "loading-region";
            this.error = "";
            this.region = null;
            this.associations = [];
            this.hovered = null;
            this.hoveredGene = null;
            try {
                const region = await this.apiClient.getInteractiveLocusZoomRegion(
                    this.locusZoom.gene,
                    this.locusZoom.trait_id,
                    this.locusZoom.flank || 250000
                );
                this.region = region;
                this.status = "loading-associations";
                const payload = await this.apiClient.getInteractiveLocusZoomAssociations({
                    traitId: this.locusZoom.trait_id,
                    chromosome: region.chromosome,
                    start: region.start,
                    end: region.end,
                });
                this.associations = payload?.associations || [];
                this.status = "ready";
            } catch (loadError) {
                this.error =
                    String(loadError?.message || loadError) ||
                    "Unable to load locus plot.";
                this.status = "error";
            }
        },
        onPlotMouseMove(event) {
            const canvas = this.$refs.plotCanvas;
            if (!canvas) {
                return;
            }
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            let best = null;
            let bestDistance = 64;
            for (const point of this.hitPoints) {
                const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
                if (distance < bestDistance) {
                    best = point;
                    bestDistance = distance;
                }
            }
            this.hovered = best
                ? { ...best.row, x: x + 12, y: y + 12, pValue: best.row.pValue ?? best.row.p_value }
                : null;
        },
        onGeneMouseMove(event) {
            const canvas = this.$refs.geneCanvas;
            if (!canvas) {
                return;
            }
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const hit = this.hitGenes.find(
                (entry) =>
                    x >= entry.x1 &&
                    x <= entry.x2 &&
                    y >= entry.y &&
                    y <= entry.y + entry.height
            );
            this.hoveredGene = hit ? { ...hit.gene, x: x + 12, y: y + 12 } : null;
        },
    },
};
</script>

<style scoped>
.wkb-locuszoom-pane {
    margin-top: 8px;
}

.wkb-locuszoom-empty {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-locuszoom-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px 12px;
    margin-bottom: 8px;
}

.wkb-locuszoom-title {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 700;
}

.wkb-locuszoom-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-locuszoom-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(224, 123, 57, 0.25);
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    animation: wkb-locuszoom-spin 0.75s linear infinite;
}

@keyframes wkb-locuszoom-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-locuszoom-head-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.wkb-locuszoom-legend {
    display: flex;
    gap: 10px;
    font-size: 11px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-locuszoom-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    vertical-align: middle;
}

.wkb-locuszoom-dot-positive {
    background: #c18f2c;
}

.wkb-locuszoom-dot-negative {
    background: #4f78c4;
}

.wkb-locuszoom-plot,
.wkb-locuszoom-gene-track-panel {
    position: relative;
}

.wkb-locuszoom-canvas,
.wkb-locuszoom-gene-canvas {
    display: block;
    width: 100%;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fff;
}

.wkb-locuszoom-gene-track-panel {
    margin-top: 10px;
}

.wkb-locuszoom-gene-track-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-locuszoom-gene-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 12px;
}

.wkb-locuszoom-track-warning {
    margin: 0 0 6px;
    font-size: 12px;
    color: #9a3412;
}

.wkb-locuszoom-tooltip {
    position: absolute;
    z-index: 2;
    max-width: 220px;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 6px 18px rgba(20, 22, 30, 0.12);
    font-size: 11px;
    line-height: 1.35;
    pointer-events: none;
}

.wkb-locuszoom-tooltip strong {
    display: block;
    margin-bottom: 4px;
}

.wkb-locuszoom-tooltip span {
    display: block;
}
</style>
