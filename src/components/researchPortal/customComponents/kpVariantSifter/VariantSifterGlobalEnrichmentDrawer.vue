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
            <p v-else-if="llmRelevance.error" class="vks-ge-llm-note" role="status">
                {{ llmRelevance.error }} Showing full global enrichment data.
            </p>

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

            <div v-if="llmRelevance.llmUsed" class="vks-ge-track-filter">
                <label class="vks-ge-track-filter-label">
                    <input
                        type="checkbox"
                        class="vks-ge-track-filter-input"
                        :checked="showFilteredTissuesInTracks"
                        @change="onToggleShowFilteredTissuesInTracks"
                    />
                    <span>Show filtered tissues in annotation tracks</span>
                </label>
                <p class="vks-ge-track-filter-hint">
                    Filtered tissues appear dimmed when shown. When off, they are hidden
                    from the workspace tracks.
                </p>
            </div>

            <ul class="vks-ge-legend-list" role="group" aria-label="Annotation types">
                <li
                    v-for="(annotation, index) in annotationOptions"
                    :key="annotation"
                    class="vks-ge-legend-item"
                    :class="{ 'is-muted': !isAnnotationSelected(annotation) }"
                >
                    <label class="vks-ge-legend-checkbox">
                        <input
                            type="checkbox"
                            class="vks-ge-legend-input"
                            :checked="isAnnotationSelected(annotation)"
                            :style="{ accentColor: legendSolidColor(annotation, index) }"
                            @change="onToggleAnnotation(annotation, $event)"
                        />
                        <span class="vks-ge-legend-label">
                            {{ annotation }}
                        </span>
                    </label>
                </li>
            </ul>

            <VariantSifterGlobalEnrichmentPlot
                :global-enrichment-state="globalEnrichmentState"
                :search-session="searchSession"
                :selected-annotations="selectedAnnotations"
                :utils="utils"
            />

            <VariantSifterGlobalEnrichmentTable
                :annotations="geTableModel.annotations"
                :rows="geTableModel.rows"
                :subtitle="geTableSubtitle"
                :llm-relevance="llmRelevance"
                :enabled-muted-tissues="enabledMutedTissues"
            />
        </template>
        <p v-else class="vks-ge-drawer-hint">
            No regulatory annotations were found for this locus.
        </p>
    </div>
</template>

<script>
import VariantSifterGlobalEnrichmentPlot from "./VariantSifterGlobalEnrichmentPlot.vue";
import VariantSifterGlobalEnrichmentTable from "./VariantSifterGlobalEnrichmentTable.vue";
import {
    buildGeTissueTableModel,
    isGeAnnotationEmphasized,
    listMutedGeAnnotations,
    listMutedGeTissues,
    resolveSelectedGeAnnotations,
    solidAnnotationColor,
    sortedAnnotationKeys,
    VKS_ANNOTATION_COLORS,
} from "./variantSifterGlobalEnrichmentData.js";

export default {
    name: "VariantSifterGlobalEnrichmentDrawer",
    components: {
        VariantSifterGlobalEnrichmentPlot,
        VariantSifterGlobalEnrichmentTable,
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
                selectedAnnotations: [],
                showFilteredTissuesInTracks: false,
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
        return {
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
        showFilteredTissuesInTracks() {
            return Boolean(this.globalEnrichmentState?.showFilteredTissuesInTracks);
        },
        annotationOptions() {
            return sortedAnnotationKeys(this.globalEnrichmentState?.annoData || {});
        },
        selectedAnnotations() {
            return resolveSelectedGeAnnotations(
                this.globalEnrichmentState?.selectedAnnotations,
                this.annotationOptions
            );
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
        geTableModel() {
            return buildGeTissueTableModel({
                geRows: this.globalEnrichmentState?.geRows || [],
                annoData: this.globalEnrichmentState?.annoData || {},
                phenotype: this.searchSession?.phenotype?.name || "",
                ancestry: this.searchSession?.ancestry || "Mixed",
                annotations: this.selectedAnnotations,
                utils: this.utils,
            });
        },
        geTableSubtitle() {
            const phenotype = this.searchSession?.phenotype?.name;
            if (!phenotype) {
                return "";
            }
            const ancestry = this.searchSession?.ancestry || "Mixed";
            return `Sorted by p-value. ${phenotype} (${ancestry}).`;
        },
    },
    methods: {
        isAnnotationSelected(annotation) {
            return this.selectedAnnotations.includes(annotation);
        },
        isAnnotationEmphasized(annotation) {
            return isGeAnnotationEmphasized(annotation, {
                llmRelevance: this.llmRelevance,
                enabledMutedAnnotations: this.enabledMutedAnnotations,
            });
        },
        legendSolidColor(annotation, index) {
            const baseColor =
                VKS_ANNOTATION_COLORS[index % VKS_ANNOTATION_COLORS.length];
            return solidAnnotationColor(
                this.isAnnotationEmphasized(annotation) ? baseColor : `${baseColor.slice(0, 7)}55`
            );
        },
        onToggleAnnotation(annotation, event) {
            const checked = Boolean(event?.target?.checked);
            const next = new Set(this.selectedAnnotations);
            if (checked) {
                next.add(annotation);
            } else {
                next.delete(annotation);
            }
            const ordered = this.annotationOptions.filter((item) => next.has(item));
            this.$emit("update:selectedAnnotations", ordered);
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
        onToggleShowFilteredTissuesInTracks(event) {
            this.$emit(
                "update:showFilteredTissuesInTracks",
                Boolean(event?.target?.checked)
            );
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

.vks-ge-legend-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
}

.vks-ge-track-filter {
    margin: 0 0 12px;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fcfbfa;
}

.vks-ge-track-filter-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: #33363d;
    cursor: pointer;
}

.vks-ge-track-filter-input {
    width: 14px;
    height: 14px;
    margin: 0;
    flex-shrink: 0;
    cursor: pointer;
}

.vks-ge-track-filter-hint {
    margin: 6px 0 0 22px;
    font-size: 0.8rem;
    line-height: 1.4;
    color: #666666;
}

.vks-ge-legend-item.is-muted {
    opacity: 0.55;
}

.vks-ge-legend-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    cursor: pointer;
    font-size: 0.82rem;
    color: #33363d;
}

.vks-ge-legend-input {
    width: 14px;
    height: 14px;
    margin: 0;
    flex-shrink: 0;
    cursor: pointer;
}

.vks-ge-legend-label {
    line-height: 1.3;
}
</style>
