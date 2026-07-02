<template>
    <div class="vks-ge-drawer">
        <p class="vks-ge-drawer-intro">
            Global enrichment and regulatory annotations for the searched phenotype and
            locus.
        </p>

        <div v-if="loading && !hideLoadingStatus" class="vks-ge-drawer-status">
            Loading global enrichment…
        </div>
        <div v-else-if="error" class="vks-ge-drawer-error" role="alert">
            {{ error }}
        </div>
        <template v-else-if="hasAnnoData">
            <p v-if="llmRelevance.llmUsed" class="vks-ge-llm-note">
                Relevance filtering is applied. See the assistant panel for details, or use
                the controls below to re-enable muted items.
            </p>

            <div class="vks-ge-filter-row">
                <label class="vks-ge-filter-label" :for="annotationSelectId">
                    Select annotation
                </label>
                <select
                    :id="annotationSelectId"
                    v-model="annotationOnFocus"
                    class="custom-select vks-ge-filter-select"
                >
                    <option value="">Show all</option>
                    <option
                        v-for="annotation in annotationOptions"
                        :key="annotation"
                        :value="annotation"
                    >
                        {{ annotation }}
                    </option>
                </select>
            </div>

            <div
                v-if="llmRelevance.llmUsed && hasMutedItems"
                class="vks-ge-muted-panel"
            >
                <button
                    type="button"
                    class="vks-ge-muted-toggle"
                    :aria-expanded="showMutedPanel ? 'true' : 'false'"
                    @click="showMutedPanel = !showMutedPanel"
                >
                    {{ showMutedPanel ? "Hide" : "Show" }} muted items ({{
                        mutedAnnotationOptions.length + mutedTissueOptions.length
                    }})
                </button>

                <div v-if="showMutedPanel" class="vks-ge-muted-content">
                    <div v-if="mutedAnnotationOptions.length" class="vks-ge-muted-group">
                        <p class="vks-ge-muted-title">Muted annotation types</p>
                        <ul class="vks-ge-muted-list">
                            <li
                                v-for="annotation in mutedAnnotationOptions"
                                :key="annotation"
                                class="vks-ge-muted-item"
                            >
                                <label>
                                    <input
                                        type="checkbox"
                                        :checked="enabledMutedAnnotations.includes(annotation)"
                                        @change="onToggleMutedAnnotation(annotation, $event)"
                                    />
                                    <span>{{ annotation }}</span>
                                </label>
                            </li>
                        </ul>
                    </div>

                    <div v-if="mutedTissueOptions.length" class="vks-ge-muted-group">
                        <p class="vks-ge-muted-title">Muted tissues</p>
                        <ul class="vks-ge-muted-list">
                            <li
                                v-for="tissue in mutedTissueOptions"
                                :key="tissue"
                                class="vks-ge-muted-item"
                            >
                                <label>
                                    <input
                                        type="checkbox"
                                        :checked="enabledMutedTissues.includes(tissue)"
                                        @change="onToggleMutedTissue(tissue, $event)"
                                    />
                                    <span>{{ tissue }}</span>
                                </label>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="vks-ge-legend">
                <p class="vks-ge-legend-title">Global enrichment</p>
                <ul class="vks-ge-legend-list">
                    <li
                        v-for="(annotation, index) in annotationOptions"
                        :key="annotation"
                        class="vks-ge-legend-item"
                        :class="{
                            'is-muted': !isAnnotationEmphasized(annotation),
                        }"
                    >
                        <span
                            class="vks-ge-legend-swatch"
                            :style="{ backgroundColor: legendColor(annotation, index) }"
                            aria-hidden="true"
                        ></span>
                        <span>{{ annotation }}</span>
                    </li>
                </ul>
            </div>

            <VariantSifterGlobalEnrichmentPlot
                :global-enrichment-state="globalEnrichmentState"
                :search-session="searchSession"
                :annotation-on-focus="annotationOnFocus || null"
                :utils="utils"
            />

            <div class="vks-ge-annotations-section">
                <p class="vks-ge-legend-title">Annotations in this locus</p>
                <VariantSifterAnnotationsPlot
                    :global-enrichment-state="globalEnrichmentState"
                    :search-session="searchSession"
                    :selected-annotation="annotationOnFocus || null"
                    :utils="utils"
                />
            </div>
        </template>
        <p v-else class="vks-ge-drawer-hint">
            No regulatory annotations were found for this locus.
        </p>
    </div>
</template>

<script>
import VariantSifterGlobalEnrichmentPlot from "./VariantSifterGlobalEnrichmentPlot.vue";
import VariantSifterAnnotationsPlot from "./VariantSifterAnnotationsPlot.vue";
import {
    isGeAnnotationEmphasized,
    listMutedGeAnnotations,
    listMutedGeTissues,
    mutedAnnotationColor,
    sortedAnnotationKeys,
    VKS_ANNOTATION_COLORS,
} from "./variantSifterGlobalEnrichmentData.js";

let geDrawerSelectCounter = 0;

export default {
    name: "VariantSifterGlobalEnrichmentDrawer",
    components: {
        VariantSifterGlobalEnrichmentPlot,
        VariantSifterAnnotationsPlot,
    },
    props: {
        globalEnrichmentState: {
            type: Object,
            default: () => ({
                loading: false,
                error: null,
                geRows: [],
                annoRows: [],
                annoData: {},
                catalog: { annotations: [], tissues: [] },
                llmRelevance: {
                    loading: false,
                    error: null,
                    llmUsed: false,
                    relevantAnnotations: [],
                    relevantTissues: [],
                    rationaleById: {},
                },
                enabledMutedAnnotations: [],
                enabledMutedTissues: [],
            }),
        },
        searchSession: {
            type: Object,
            default: null,
        },
        utils: {
            type: Object,
            default: null,
        },
        hideLoadingStatus: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        geDrawerSelectCounter += 1;
        return {
            annotationOnFocus: "",
            annotationSelectId: `vks-ge-annotation-${geDrawerSelectCounter}`,
            showMutedPanel: false,
        };
    },
    computed: {
        loading() {
            return Boolean(this.globalEnrichmentState?.loading);
        },
        error() {
            return this.globalEnrichmentState?.error || null;
        },
        hasAnnoData() {
            return Object.keys(this.globalEnrichmentState?.annoData || {}).length > 0;
        },
        llmRelevance() {
            return (
                this.globalEnrichmentState?.llmRelevance || {
                    loading: false,
                    error: null,
                    llmUsed: false,
                    relevantAnnotations: [],
                    relevantTissues: [],
                    rationaleById: {},
                }
            );
        },
        enabledMutedAnnotations() {
            return this.globalEnrichmentState?.enabledMutedAnnotations || [];
        },
        enabledMutedTissues() {
            return this.globalEnrichmentState?.enabledMutedTissues || [];
        },
        annotationOptions() {
            return sortedAnnotationKeys(this.globalEnrichmentState?.annoData || {});
        },
        tissueOptions() {
            return this.globalEnrichmentState?.catalog?.tissues || [];
        },
        mutedAnnotationOptions() {
            return listMutedGeAnnotations(this.annotationOptions, {
                llmRelevance: this.llmRelevance,
                enabledMutedAnnotations: this.enabledMutedAnnotations,
            });
        },
        mutedTissueOptions() {
            return listMutedGeTissues(this.tissueOptions, {
                llmRelevance: this.llmRelevance,
                enabledMutedTissues: this.enabledMutedTissues,
            });
        },
        hasMutedItems() {
            return this.mutedAnnotationOptions.length > 0 || this.mutedTissueOptions.length > 0;
        },
    },
    methods: {
        isAnnotationEmphasized(annotation) {
            return isGeAnnotationEmphasized(annotation, {
                llmRelevance: this.llmRelevance,
                enabledMutedAnnotations: this.enabledMutedAnnotations,
            });
        },
        legendColor(annotation, index) {
            const baseColor =
                VKS_ANNOTATION_COLORS[index % VKS_ANNOTATION_COLORS.length];
            return this.isAnnotationEmphasized(annotation)
                ? baseColor
                : mutedAnnotationColor(baseColor);
        },
        onToggleMutedAnnotation(annotation, event) {
            const enabled = Boolean(event?.target?.checked);
            const next = new Set(this.enabledMutedAnnotations);
            if (enabled) {
                next.add(annotation);
            } else {
                next.delete(annotation);
            }
            this.$emit("update:enabledMutedAnnotations", [...next].sort());
        },
        onToggleMutedTissue(tissue, event) {
            const enabled = Boolean(event?.target?.checked);
            const next = new Set(this.enabledMutedTissues);
            if (enabled) {
                next.add(tissue);
            } else {
                next.delete(tissue);
            }
            this.$emit("update:enabledMutedTissues", [...next].sort());
        },
    },
};
</script>

<style scoped>
.vks-ge-drawer-intro {
    margin: 0 0 12px;
    color: #4a4a4a;
    font-size: 0.92rem;
    line-height: 1.45;
}

.vks-ge-drawer-status,
.vks-ge-drawer-hint,
.vks-ge-llm-note {
    color: #666666;
    font-size: 0.9rem;
}

.vks-ge-llm-note {
    margin: 0 0 12px;
    line-height: 1.4;
}

.vks-ge-drawer-error {
    color: #b42318;
    font-size: 0.9rem;
}

.vks-ge-filter-row {
    margin-bottom: 12px;
}

.vks-ge-filter-label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.85rem;
    font-weight: 600;
}

.vks-ge-filter-select {
    width: 100%;
    max-width: 360px;
}

.vks-ge-muted-panel {
    margin-bottom: 12px;
}

.vks-ge-muted-toggle {
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #faf9f7;
    color: #4a4a4a;
    font-size: 0.85rem;
    padding: 6px 10px;
    cursor: pointer;
}

.vks-ge-muted-content {
    margin-top: 10px;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fcfbfa;
}

.vks-ge-muted-group + .vks-ge-muted-group {
    margin-top: 12px;
}

.vks-ge-muted-title {
    margin: 0 0 8px;
    font-size: 0.82rem;
    font-weight: 700;
    color: #4a4a4a;
}

.vks-ge-muted-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
}

.vks-ge-muted-item label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    color: #4a4a4a;
    cursor: pointer;
}

.vks-ge-legend {
    margin-bottom: 8px;
}

.vks-ge-legend-title {
    margin: 0 0 8px;
    font-size: 0.9rem;
    font-weight: 700;
}

.vks-ge-legend-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.vks-ge-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
}

.vks-ge-legend-item.is-muted {
    color: #8a8a8a;
}

.vks-ge-legend-swatch {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.vks-ge-annotations-section {
    margin-top: 16px;
}
</style>
