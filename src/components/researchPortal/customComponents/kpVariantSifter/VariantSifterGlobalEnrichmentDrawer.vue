<template>
    <div class="vks-ge-drawer">
        <p class="vks-ui-intro">
            Global enrichment and regulatory annotations for the searched phenotype and
            locus.
        </p>

        <div v-if="loading && !hideLoadingStatus" class="vks-ui-status">
            Loading global enrichment…
        </div>
        <div v-else-if="error" class="vks-ui-error" role="alert">
            {{ error }}
        </div>
        <div v-else-if="hasAnnoData" class="vks-ge-drawer-body">
            <section class="vks-drawer-section vks-drawer-section--controls">
                <div class="vks-ui-tabs" role="tablist" aria-label="Global enrichment panels">
                    <button
                        v-for="tab in tabs"
                        :id="`vks-ge-tab-${tab.id}`"
                        :key="tab.id"
                        type="button"
                        role="tab"
                        class="vks-ui-tab"
                        :class="{ 'is-active': activeTab === tab.id }"
                        :aria-selected="activeTab === tab.id ? 'true' : 'false'"
                        :aria-controls="`vks-ge-panel-${tab.id}`"
                        @click="activeTab = tab.id"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <div
                    v-show="activeTab === 'tissues'"
                    id="vks-ge-panel-tissues"
                    class="vks-ui-tab-panel"
                    role="tabpanel"
                    aria-labelledby="vks-ge-tab-tissues"
                >
                    <p class="vks-ui-hint">
                        All tissues available for each annotation. Checked tissues are shown
                        on that annotation track. Reset restores the initial CS2CT / p-value
                        selection.
                    </p>

                    <div
                        v-if="mutedAnnotationOptions.length"
                        class="vks-ge-muted-group"
                    >
                        <p class="vks-ui-section-title">Muted annotation types</p>
                        <p class="vks-ui-hint">
                            These annotation types were filtered out. Check to show them again.
                        </p>
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

                    <div v-if="tissueGroups.length">
                        <div class="vks-ge-tissue-toolbar">
                            <label class="vks-ge-annotation-select">
                                <span class="vks-ge-track-sort-label">Annotation</span>
                                <select
                                    class="vks-ge-track-sort-select"
                                    :value="activeTissueAnnotation"
                                    aria-label="Annotation for tissue filters"
                                    @change="onTissueAnnotationChange"
                                >
                                    <option
                                        v-for="group in tissueGroups"
                                        :key="group.annotation"
                                        :value="group.annotation"
                                    >
                                        {{ annotationDropdownLabel(group) }}
                                    </option>
                                </select>
                            </label>
                            <button
                                type="button"
                                class="vks-ui-btn vks-ui-btn--secondary"
                                @click="onResetTissueSelection"
                            >
                                Reset
                            </button>
                        </div>

                        <div
                            v-if="activeTissueGroup"
                            class="vks-ge-tissue-panel"
                        >
                            <label class="vks-ge-tissue-select-all">
                                <input
                                    type="checkbox"
                                    :checked="activeTissueGroup.allShown"
                                    :indeterminate.prop="
                                        activeTissueGroup.someShown && !activeTissueGroup.allShown
                                    "
                                    :aria-label="
                                        `Select all tissues for ${activeTissueGroup.annotation}`
                                    "
                                    @change="
                                        onSelectAllTissuesForAnnotation(
                                            activeTissueGroup.annotation,
                                            $event
                                        )
                                    "
                                />
                                <span>Select all</span>
                            </label>
                            <ul
                                class="vks-ge-tissue-list"
                                role="group"
                                :aria-label="`Tissues for ${activeTissueGroup.annotation}`"
                            >
                                <li
                                    v-for="tissue in activeTissueGroup.tissues"
                                    :key="`${activeTissueGroup.annotation}:::${tissue}`"
                                    class="vks-ge-tissue-item"
                                >
                                    <label class="vks-ge-tissue-check">
                                        <input
                                            type="checkbox"
                                            :checked="
                                                isTissueShownForAnnotation(
                                                    activeTissueGroup.annotation,
                                                    tissue
                                                )
                                            "
                                            @change="
                                                onToggleAnnotationTissue(
                                                    activeTissueGroup.annotation,
                                                    tissue,
                                                    $event
                                                )
                                            "
                                        />
                                        <span>{{ tissue }}</span>
                                    </label>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <p v-else class="vks-ui-hint">
                        No tissues are available for the current annotations.
                    </p>
                </div>

                <div
                    v-show="activeTab === 'settings'"
                    id="vks-ge-panel-settings"
                    class="vks-ui-tab-panel"
                    role="tabpanel"
                    aria-labelledby="vks-ge-tab-settings"
                >
                    <section class="vks-ui-section">
                        <p class="vks-ui-section-title">Filters</p>

                        <label class="vks-ge-pvalue-filter">
                            <span class="vks-ge-track-sort-label">P-value</span>
                            <input
                                type="text"
                                class="vks-ge-pvalue-input"
                                :value="pValueInput"
                                inputmode="decimal"
                                aria-label="Maximum enrichment p-value for tissues shown on tracks"
                                @input="onPValueInput"
                                @change="onPValueCommit"
                                @blur="onPValueCommit"
                            />
                        </label>

                        <div class="vks-ge-filter-group">
                            <p class="vks-ge-track-sort-label">Methods</p>
                            <ul
                                class="vks-ge-tissue-list"
                                role="group"
                                aria-label="Methods"
                            >
                                <li
                                    v-for="method in methodOptions"
                                    :key="`method-${method}`"
                                    class="vks-ge-tissue-item"
                                >
                                    <label class="vks-ge-tissue-check">
                                        <input
                                            type="checkbox"
                                            :checked="isMethodSelected(method)"
                                            @change="onToggleMethod(method, $event)"
                                        />
                                        <span>{{ method }}</span>
                                    </label>
                                </li>
                            </ul>
                        </div>

                        <div class="vks-ge-filter-group">
                            <p class="vks-ge-track-sort-label">Sources</p>
                            <ul
                                class="vks-ge-tissue-list"
                                role="group"
                                aria-label="Sources"
                            >
                                <li
                                    v-for="source in sourceOptions"
                                    :key="`source-${source}`"
                                    class="vks-ge-tissue-item"
                                >
                                    <label class="vks-ge-tissue-check">
                                        <input
                                            type="checkbox"
                                            :checked="isSourceSelected(source)"
                                            @change="onToggleSource(source, $event)"
                                        />
                                        <span>{{ source }}</span>
                                    </label>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section class="vks-ui-section">
                        <p class="vks-ui-section-title">Settings</p>
                        <label class="vks-ge-track-sort">
                            <span class="vks-ge-track-sort-label">Sort tracks in:</span>
                            <select
                                class="vks-ge-track-sort-select"
                                :value="tissueTrackSort"
                                aria-label="Sort tracks in"
                                @change="onTissueTrackSortChange"
                            >
                                <option
                                    v-for="option in tissueTrackSortOptions"
                                    :key="option.id"
                                    :value="option.id"
                                >
                                    {{ option.label }}
                                </option>
                            </select>
                        </label>
                    </section>
                </div>
            </section>

            <section class="vks-drawer-section vks-drawer-section--table">
                <div v-if="tableAnnotationTabs.length" class="vks-ge-table-toolbar">
                    <label class="vks-ge-annotation-select">
                        <span class="vks-ge-track-sort-label">Annotation</span>
                        <select
                            class="vks-ge-track-sort-select"
                            :value="activeTableAnnotation"
                            aria-label="Annotation for data tables"
                            @change="onTableAnnotationChange"
                        >
                            <option
                                v-for="annotation in tableAnnotationTabs"
                                :key="annotation"
                                :value="annotation"
                            >
                                {{ annotation }}
                            </option>
                        </select>
                    </label>
                </div>
                <p v-else class="vks-ui-hint">
                    No annotation plot tissues are available for the table.
                </p>

                <div v-if="activeTableAnnotation" class="vks-ge-table-section">
                    <div class="vks-ge-table-panel">
                        <p class="vks-ui-section-title">Global enrichment</p>
                        <VariantSifterGlobalEnrichmentTable
                            :rows="geTableRows"
                            :utils="utils"
                        />
                    </div>
                    <div class="vks-ge-table-panel">
                        <p class="vks-ui-section-title">Enriched regions</p>
                        <VariantSifterEnrichedRegionsTable
                            :rows="enrichedRegionsRows"
                            :utils="utils"
                        />
                    </div>
                </div>
            </section>
        </div>
        <p v-else class="vks-ui-hint">
            No regulatory annotations were found for this locus.
        </p>
    </div>
</template>

<script>
import VariantSifterGlobalEnrichmentTable from "./VariantSifterGlobalEnrichmentTable.vue";
import VariantSifterEnrichedRegionsTable from "./VariantSifterEnrichedRegionsTable.vue";
import {
    buildEnrichedRegionsTableRows,
    buildGeAnnotationTissueTableRows,
    buildGeTissueStatsForAnnotation,
    buildSelectAllAnnotationTissueOverrides,
    buildDeselectAllAnnotationTissueOverrides,
    GE_TISSUE_TRACK_SORT_OPTIONS,
    GE_TRACK_P_VALUE_MAX,
    isGeTissueShownOnTrack,
    listAllGeTissuesByAnnotation,
    listGePlotVisibleTissuesForAnnotation,
    listMutedGeAnnotations,
    listUniqueRegionPropValues,
    normalizeDisabledAnnotationTissues,
    normalizeEnabledMutedAnnotationTissues,
    normalizeGeFilterStringList,
    normalizeGeTissueTrackSort,
    normalizeGeTrackPValueMax,
    resolveSelectedGeAnnotations,
    setAnnotationTissueShown,
    sortedAnnotationKeys,
    tissuePassesDefaultGeTrackFilter,
} from "./variantSifterGlobalEnrichmentData.js";

const GE_DRAWER_TABS = [
    { id: "tissues", label: "Tissues" },
    { id: "settings", label: "Filters / Settings" },
];

export default {
    name: "VariantSifterGlobalEnrichmentDrawer",
    components: {
        VariantSifterGlobalEnrichmentTable,
        VariantSifterEnrichedRegionsTable,
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
                enabledMutedAnnotationTissues: {},
                disabledAnnotationTissues: {},
                selectedAnnotations: [],
                tissueTrackSort: "alphabetical",
                geTrackPValueMax: GE_TRACK_P_VALUE_MAX,
                selectedMethods: null,
                selectedSources: null,
                activeAnnotation: null,
                selectedTissues: [],
                selectedBiosamples: [],
                biosampleMethodOptions: [],
                biosampleSourceOptions: [],
                biosampleRegionsByAnnotation: {},
                biosampleLoading: false,
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
            activeTab: "tissues",
            activeTableAnnotation: null,
            tabs: GE_DRAWER_TABS,
            pValueInput: String(GE_TRACK_P_VALUE_MAX),
            tissueFilterAnnotation: null,
        };
    },
    watch: {
        geTrackPValueMax: {
            immediate: true,
            handler(value) {
                this.pValueInput = String(value);
            },
        },
        annotationOptions: {
            immediate: true,
            handler(options) {
                this.ensureTissueFilterAnnotation(options);
            },
        },
        tableAnnotationTabs: {
            immediate: true,
            handler(tabs) {
                if (!tabs.length) {
                    this.activeTableAnnotation = null;
                    return;
                }
                if (!tabs.includes(this.activeTableAnnotation)) {
                    this.activeTableAnnotation = tabs[0];
                }
            },
        },
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
        enabledMutedAnnotationTissues() {
            return normalizeEnabledMutedAnnotationTissues(
                this.globalEnrichmentState?.enabledMutedAnnotationTissues
            );
        },
        disabledAnnotationTissues() {
            return normalizeDisabledAnnotationTissues(
                this.globalEnrichmentState?.disabledAnnotationTissues
            );
        },
        tissueTrackSort() {
            return normalizeGeTissueTrackSort(
                this.globalEnrichmentState?.tissueTrackSort
            );
        },
        tissueTrackSortOptions() {
            return GE_TISSUE_TRACK_SORT_OPTIONS;
        },
        geTrackPValueMax() {
            return normalizeGeTrackPValueMax(
                this.globalEnrichmentState?.geTrackPValueMax
            );
        },
        methodOptions() {
            const values = new Set(
                this.globalEnrichmentState?.biosampleMethodOptions || []
            );
            (this.globalEnrichmentState?.annoRows || []).forEach((row) => {
                const method = row?.method;
                if (method != null && method !== "") {
                    values.add(String(method));
                }
            });
            const annoData = this.globalEnrichmentState?.annoData || {};
            Object.values(annoData).forEach((tissues) => {
                Object.values(tissues || {}).forEach((entry) => {
                    listUniqueRegionPropValues(entry?.region || [], "method").forEach(
                        (method) => values.add(method)
                    );
                });
            });
            return [...values].sort();
        },
        sourceOptions() {
            const values = new Set(
                this.globalEnrichmentState?.biosampleSourceOptions || []
            );
            (this.globalEnrichmentState?.annoRows || []).forEach((row) => {
                const source = row?.source;
                if (source != null && source !== "") {
                    values.add(String(source));
                }
            });
            const annoData = this.globalEnrichmentState?.annoData || {};
            Object.values(annoData).forEach((tissues) => {
                Object.values(tissues || {}).forEach((entry) => {
                    listUniqueRegionPropValues(entry?.region || [], "source").forEach(
                        (source) => values.add(source)
                    );
                });
            });
            return [...values].sort();
        },
        selectedMethods() {
            return normalizeGeFilterStringList(
                this.globalEnrichmentState?.selectedMethods
            );
        },
        selectedSources() {
            return normalizeGeFilterStringList(
                this.globalEnrichmentState?.selectedSources
            );
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
        mutedAnnotationOptions() {
            return listMutedGeAnnotations(this.annotationOptions, {
                llmRelevance: this.llmRelevance,
                enabledMutedAnnotations: this.enabledMutedAnnotations,
            });
        },
        phenotypeName() {
            return this.searchSession?.phenotype?.name || "";
        },
        ancestryCode() {
            return this.searchSession?.ancestry || "Mixed";
        },
        tissueGroups() {
            const groups = listAllGeTissuesByAnnotation(
                this.globalEnrichmentState?.annoData || {},
                this.annotationOptions
            );
            return groups.map((group) => {
                const shownCount = group.tissues.reduce(
                    (count, tissue) =>
                        count +
                        (this.isTissueShownForAnnotation(group.annotation, tissue) ? 1 : 0),
                    0
                );
                return {
                    ...group,
                    shownCount,
                    allShown: shownCount === group.tissues.length && group.tissues.length > 0,
                    someShown: shownCount > 0,
                };
            });
        },
        activeTissueAnnotation() {
            const options = this.tissueGroups.map((group) => group.annotation);
            if (
                this.tissueFilterAnnotation &&
                options.includes(this.tissueFilterAnnotation)
            ) {
                return this.tissueFilterAnnotation;
            }
            return options[0] || null;
        },
        activeTissueGroup() {
            const annotation = this.activeTissueAnnotation;
            if (!annotation) {
                return null;
            }
            return (
                this.tissueGroups.find((group) => group.annotation === annotation) ||
                null
            );
        },
        plotVisibleTissuesByAnnotation() {
            const annoData = this.globalEnrichmentState?.annoData || {};
            const geRows = this.globalEnrichmentState?.geRows || [];
            const map = {};
            this.selectedAnnotations.forEach((annotation) => {
                map[annotation] = listGePlotVisibleTissuesForAnnotation({
                    annotation,
                    annoData,
                    geRows,
                    phenotype: this.phenotypeName,
                    ancestry: this.ancestryCode,
                    llmRelevance: this.llmRelevance,
                    enabledMutedAnnotations: this.enabledMutedAnnotations,
                    enabledMutedAnnotationTissues: this.enabledMutedAnnotationTissues,
                    disabledAnnotationTissues: this.disabledAnnotationTissues,
                });
            });
            return map;
        },
        tableAnnotationTabs() {
            return this.selectedAnnotations.filter(
                (annotation) =>
                    (this.plotVisibleTissuesByAnnotation[annotation] || []).length > 0
            );
        },
        activePlotVisibleTissues() {
            const annotation = this.activeTableAnnotation;
            if (!annotation) {
                return [];
            }
            return this.plotVisibleTissuesByAnnotation[annotation] || [];
        },
        geTableRows() {
            const annotation = this.activeTableAnnotation;
            if (!annotation) {
                return [];
            }
            return buildGeAnnotationTissueTableRows({
                annotation,
                tissues: this.activePlotVisibleTissues,
                geRows: this.globalEnrichmentState?.geRows || [],
                phenotype: this.phenotypeName,
                ancestry: this.ancestryCode,
                utils: this.utils,
            });
        },
        enrichedRegionsRows() {
            const annotation = this.activeTableAnnotation;
            if (!annotation) {
                return [];
            }
            const allowedTissues = new Set(this.activePlotVisibleTissues);
            return buildEnrichedRegionsTableRows(
                this.globalEnrichmentState?.annoRows || [],
                {
                    annotations: [annotation],
                    isTissueVisible: (_annotation, tissue) => allowedTissues.has(tissue),
                }
            );
        },
    },
    methods: {
        geTissueStatsForAnnotation(annotation, cache = null) {
            if (cache && cache[annotation]) {
                return cache[annotation];
            }
            const stats = buildGeTissueStatsForAnnotation({
                geRows: this.globalEnrichmentState?.geRows || [],
                annotation,
                phenotype: this.phenotypeName,
                ancestry: this.ancestryCode,
            });
            if (cache) {
                cache[annotation] = stats;
            }
            return stats;
        },
        isTissueDefaultShown(annotation, tissue, cache = null) {
            return tissuePassesDefaultGeTrackFilter(tissue, {
                annotation,
                geTissueStats: this.geTissueStatsForAnnotation(annotation, cache),
                llmRelevance: this.llmRelevance,
                pValueMax: this.geTrackPValueMax,
            });
        },
        isTissueShownForAnnotation(annotation, tissue, cache = null) {
            return isGeTissueShownOnTrack(tissue, {
                annotation,
                geTissueStats: this.geTissueStatsForAnnotation(annotation, cache),
                llmRelevance: this.llmRelevance,
                enabledMutedAnnotationTissues: this.enabledMutedAnnotationTissues,
                disabledAnnotationTissues: this.disabledAnnotationTissues,
                pValueMax: this.geTrackPValueMax,
            });
        },
        isMethodSelected(method) {
            if (this.selectedMethods == null) {
                return true;
            }
            return this.selectedMethods.includes(method);
        },
        isSourceSelected(source) {
            if (this.selectedSources == null) {
                return true;
            }
            return this.selectedSources.includes(source);
        },
        onPValueInput(event) {
            this.pValueInput = event?.target?.value ?? "";
        },
        onPValueCommit() {
            const parsed = Number(String(this.pValueInput).trim());
            if (!Number.isFinite(parsed) || parsed < 0) {
                this.pValueInput = String(this.geTrackPValueMax);
                return;
            }
            const next = normalizeGeTrackPValueMax(parsed);
            this.pValueInput = String(next);
            if (next !== this.geTrackPValueMax) {
                this.$emit("update:geTrackPValueMax", next);
            }
        },
        onToggleMethod(method, event) {
            const checked = Boolean(event?.target?.checked);
            const base =
                this.selectedMethods == null
                    ? [...this.methodOptions]
                    : [...this.selectedMethods];
            const next = new Set(base);
            if (checked) {
                next.add(method);
            } else {
                next.delete(method);
            }
            this.$emit(
                "update:selectedMethods",
                this.methodOptions.filter((item) => next.has(item))
            );
        },
        onToggleSource(source, event) {
            const checked = Boolean(event?.target?.checked);
            const base =
                this.selectedSources == null
                    ? [...this.sourceOptions]
                    : [...this.selectedSources];
            const next = new Set(base);
            if (checked) {
                next.add(source);
            } else {
                next.delete(source);
            }
            this.$emit(
                "update:selectedSources",
                this.sourceOptions.filter((item) => next.has(item))
            );
        },
        ensureTissueFilterAnnotation(options = this.annotationOptions) {
            const list = Array.isArray(options) ? options : [];
            if (!list.length) {
                this.tissueFilterAnnotation = null;
                return;
            }
            if (!list.includes(this.tissueFilterAnnotation)) {
                this.tissueFilterAnnotation = list[0];
            }
        },
        annotationDropdownLabel(group) {
            if (!group) {
                return "";
            }
            return `${group.annotation} (${group.shownCount}/${group.tissues.length})`;
        },
        onTissueAnnotationChange(event) {
            const next = event?.target?.value || null;
            this.tissueFilterAnnotation = next;
        },
        onTableAnnotationChange(event) {
            this.activeTableAnnotation = event?.target?.value || null;
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
        onToggleAnnotationTissue(annotation, tissue, event) {
            const shown = Boolean(event?.target?.checked);
            const next = setAnnotationTissueShown({
                enabledMutedAnnotationTissues: this.enabledMutedAnnotationTissues,
                disabledAnnotationTissues: this.disabledAnnotationTissues,
                annotation,
                tissue,
                shown,
                defaultShown: this.isTissueDefaultShown(annotation, tissue),
            });
            this.$emit(
                "update:enabledMutedAnnotationTissues",
                next.enabledMutedAnnotationTissues
            );
            this.$emit("update:disabledAnnotationTissues", next.disabledAnnotationTissues);
        },
        onSelectAllTissuesForAnnotation(annotation, event) {
            if (!annotation) {
                return;
            }
            const selectAll = Boolean(event?.target?.checked);
            const next = selectAll
                ? buildSelectAllAnnotationTissueOverrides({
                      annoData: this.globalEnrichmentState?.annoData || {},
                      geRows: this.globalEnrichmentState?.geRows || [],
                      phenotype: this.phenotypeName,
                      ancestry: this.ancestryCode,
                      annotations: [annotation],
                      llmRelevance: this.llmRelevance,
                      pValueMax: this.geTrackPValueMax,
                  })
                : buildDeselectAllAnnotationTissueOverrides({
                      annoData: this.globalEnrichmentState?.annoData || {},
                      geRows: this.globalEnrichmentState?.geRows || [],
                      phenotype: this.phenotypeName,
                      ancestry: this.ancestryCode,
                      annotations: [annotation],
                      llmRelevance: this.llmRelevance,
                      pValueMax: this.geTrackPValueMax,
                  });

            const enabled = {
                ...normalizeEnabledMutedAnnotationTissues(
                    this.enabledMutedAnnotationTissues
                ),
            };
            const disabled = {
                ...normalizeDisabledAnnotationTissues(this.disabledAnnotationTissues),
            };
            delete enabled[annotation];
            delete disabled[annotation];
            if (next.enabledMutedAnnotationTissues[annotation]?.length) {
                enabled[annotation] = next.enabledMutedAnnotationTissues[annotation];
            }
            if (next.disabledAnnotationTissues[annotation]?.length) {
                disabled[annotation] = next.disabledAnnotationTissues[annotation];
            }

            this.$emit("update:enabledMutedAnnotationTissues", enabled);
            this.$emit("update:disabledAnnotationTissues", disabled);
        },
        onResetTissueSelection() {
            this.$emit("update:enabledMutedAnnotationTissues", {});
            this.$emit("update:disabledAnnotationTissues", {});
        },
        onTissueTrackSortChange(event) {
            this.$emit(
                "update:tissueTrackSort",
                normalizeGeTissueTrackSort(event?.target?.value)
            );
        },
    },
};
</script>

<style scoped>
.vks-ge-drawer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
}

.vks-ge-drawer-body {
    display: flex;
    flex-direction: column;
    gap: 30px;
    min-height: 0;
}

.vks-drawer-section--controls {
    flex: 0 0 auto;
}

.vks-drawer-section--table {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.vks-ge-table-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px 12px;
}

.vks-ge-table-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-height: 0;
}

.vks-ge-table-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.vks-ge-muted-group {
    margin-bottom: 12px;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fcfbfa;
}

.vks-ge-tissue-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px 12px;
    margin: 0 0 12px;
}

.vks-ge-annotation-select {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0;
    flex: 0 0 auto;
}

.vks-ge-annotation-select .vks-ge-track-sort-select {
    width: auto;
    min-width: 0;
    flex: 0 0 auto;
    max-width: 100%;
}

.vks-ge-tissue-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.vks-ge-tissue-select-all {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #33363d;
    cursor: pointer;
}

.vks-ge-tissue-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.vks-ge-tissue-item {
    margin: 0;
}

.vks-ge-tissue-check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 12px;
    line-height: 1.35;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
}

.vks-ge-tissue-check input {
    margin: 0;
    flex: 0 0 auto;
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
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: #4a4a4a;
    cursor: pointer;
}

.vks-ge-track-sort {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0 0 8px;
}

.vks-ge-track-sort-label {
    font-size: 13px;
    font-weight: 600;
    color: #4a4a4a;
}

.vks-ge-track-sort-select {
    min-width: 200px;
    height: 32px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: #33363d;
    font-size: 13px;
    padding: 0 8px;
}

.vks-ge-pvalue-filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0 0 8px;
}

.vks-ge-pvalue-input {
    width: 96px;
    height: 32px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: #33363d;
    font-size: 13px;
    padding: 0 8px;
}

.vks-ge-filter-group {
    margin: 12px 0 14px;
}
</style>
