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
        <template v-else-if="hasAnnoData">
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
                v-show="activeTab === 'annotations'"
                id="vks-ge-panel-annotations"
                class="vks-ui-tab-panel"
                role="tabpanel"
                aria-labelledby="vks-ge-tab-annotations"
            >
                <p v-if="llmRelevance.llmUsed" class="vks-ui-hint">
                    Annotation tracks show tissues classified as relevant with enrichment
                    p &lt; {{ geTrackPValueMax }} for that annotation. Re-enable filtered
                    tissues in the Tissues tab.
                </p>
                <p v-else-if="llmRelevance.error" class="vks-ui-hint" role="status">
                    {{ llmRelevance.error }} Annotation tracks show tissues with enrichment
                    p &lt; {{ geTrackPValueMax }} for each annotation.
                </p>
                <p v-else class="vks-ui-hint" role="status">
                    Annotation tracks show tissues with enrichment p &lt;
                    {{ geTrackPValueMax }} for each annotation. Optionally classify
                    tissues by phenotype relevance from the Assist panel.
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
                    on that annotation track. Reset restores the initial AI / p-value
                    selection.
                </p>

                <div class="vks-ge-tissue-actions">
                    <label class="vks-ge-tissue-select-all">
                        <input
                            type="checkbox"
                            :checked="allTissuesSelected"
                            :indeterminate.prop="someTissuesSelected && !allTissuesSelected"
                            @change="onSelectAllTissues($event)"
                        />
                        <span>Select all</span>
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
                    v-if="tissueGroups.length"
                    class="vks-ge-tissue-columns"
                >
                    <div
                        v-for="group in tissueGroups"
                        :key="group.annotation"
                        class="vks-ge-tissue-column"
                    >
                        <p class="vks-ge-muted-annotation-label">
                            {{ group.annotation }}
                            <span class="vks-ge-muted-count">
                                ({{ group.shownCount }}/{{ group.tissues.length }})
                            </span>
                        </p>
                        <ul class="vks-ge-muted-list">
                            <li
                                v-for="tissue in group.tissues"
                                :key="`${group.annotation}:::${tissue}`"
                                class="vks-ge-muted-item"
                            >
                                <label>
                                    <input
                                        type="checkbox"
                                        :checked="
                                            isTissueShownForAnnotation(
                                                group.annotation,
                                                tissue
                                            )
                                        "
                                        @change="
                                            onToggleAnnotationTissue(
                                                group.annotation,
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
                    <p class="vks-ui-section-title">Annotations</p>
                    <ul class="vks-ge-legend-list" role="group" aria-label="Annotation type filters">
                        <li
                            v-for="(annotation, index) in annotationOptions"
                            :key="`settings-${annotation}`"
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
                </section>

                <section class="vks-ui-section">
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
                    <p class="vks-ui-hint">
                        Tissues with enrichment p-value below this threshold are shown on
                        annotation tracks (and for Reset on the Tissues tab).
                    </p>
                </section>

                <section class="vks-ui-section">
                    <label class="vks-ge-track-sort">
                        <span class="vks-ge-track-sort-label">Tissue track order</span>
                        <select
                            class="vks-ge-track-sort-select"
                            :value="tissueTrackSort"
                            aria-label="Tissue track order"
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
                    <p class="vks-ui-hint">
                        Controls how tissue rows are ordered on the Global enrichment canvas
                        tracks.
                    </p>
                </section>

                <section
                    v-if="hasBiosampleMethodSourceFilters"
                    class="vks-ui-section"
                >
                    <div class="vks-ui-btn-row">
                        <button
                            type="button"
                            class="vks-ui-btn vks-ui-btn--secondary"
                            @click="onSelectAllMethodSourceFilters"
                        >
                            Select all
                        </button>
                        <button
                            type="button"
                            class="vks-ui-btn vks-ui-btn--secondary"
                            @click="onUnselectAllMethodSourceFilters"
                        >
                            Unselect all
                        </button>
                    </div>

                    <div v-if="methodOptions.length" class="vks-ge-filter-group">
                        <p class="vks-ui-section-title">Methods</p>
                        <ul class="vks-ge-muted-list">
                            <li
                                v-for="method in methodOptions"
                                :key="`method-${method}`"
                                class="vks-ge-muted-item"
                            >
                                <label>
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

                    <div v-if="sourceOptions.length" class="vks-ge-filter-group">
                        <p class="vks-ui-section-title">Sources</p>
                        <ul class="vks-ge-muted-list">
                            <li
                                v-for="source in sourceOptions"
                                :key="`source-${source}`"
                                class="vks-ge-muted-item"
                            >
                                <label>
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
            </div>

            <div class="vks-ge-table-tabs-section">
                <div
                    class="vks-ui-tabs"
                    role="tablist"
                    aria-label="Global enrichment tables"
                >
                    <button
                        v-for="tab in tableTabs"
                        :id="`vks-ge-table-tab-${tab.id}`"
                        :key="tab.id"
                        type="button"
                        role="tab"
                        class="vks-ui-tab"
                        :class="{ 'is-active': activeTableTab === tab.id }"
                        :aria-selected="activeTableTab === tab.id ? 'true' : 'false'"
                        :aria-controls="`vks-ge-table-panel-${tab.id}`"
                        @click="activeTableTab = tab.id"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <div
                    v-show="activeTableTab === 'global-enrichment'"
                    id="vks-ge-table-panel-global-enrichment"
                    role="tabpanel"
                    aria-labelledby="vks-ge-table-tab-global-enrichment"
                >
                    <VariantSifterGlobalEnrichmentTable
                        :annotations="geTableModel.annotations"
                        :rows="geTableModel.rows"
                        :subtitle="geTableSubtitle"
                    />
                </div>

                <div
                    v-show="activeTableTab === 'enriched-regions'"
                    id="vks-ge-table-panel-enriched-regions"
                    role="tabpanel"
                    aria-labelledby="vks-ge-table-tab-enriched-regions"
                >
                    <VariantSifterEnrichedRegionsTable
                        :rows="enrichedRegionsRows"
                        :subtitle="enrichedRegionsSubtitle"
                    />
                </div>
            </div>
        </template>
        <p v-else class="vks-ui-hint">
            No regulatory annotations were found for this locus.
        </p>
    </div>
</template>

<script>
import VariantSifterGlobalEnrichmentPlot from "./VariantSifterGlobalEnrichmentPlot.vue";
import VariantSifterGlobalEnrichmentTable from "./VariantSifterGlobalEnrichmentTable.vue";
import VariantSifterEnrichedRegionsTable from "./VariantSifterEnrichedRegionsTable.vue";
import {
    buildEnrichedRegionsTableRows,
    buildGeTissueStatsForAnnotation,
    buildGeTissueTableModel,
    buildSelectAllAnnotationTissueOverrides,
    buildDeselectAllAnnotationTissueOverrides,
    GE_TISSUE_TRACK_SORT_OPTIONS,
    GE_TRACK_P_VALUE_MAX,
    isGeAnnotationEmphasized,
    isGeTissueShownOnTrack,
    listAllGeTissuesByAnnotation,
    listMutedGeAnnotations,
    normalizeDisabledAnnotationTissues,
    normalizeEnabledMutedAnnotationTissues,
    normalizeGeFilterStringList,
    normalizeGeTissueTrackSort,
    normalizeGeTrackPValueMax,
    resolveSelectedGeAnnotations,
    setAnnotationTissueShown,
    solidAnnotationColor,
    sortedAnnotationKeys,
    tissuePassesDefaultGeTrackFilter,
    VKS_ANNOTATION_COLORS,
} from "./variantSifterGlobalEnrichmentData.js";

const GE_DRAWER_TABS = [
    { id: "annotations", label: "Annotations" },
    { id: "tissues", label: "Tissues" },
    { id: "settings", label: "Settings / Filters" },
];

const GE_TABLE_TABS = [
    { id: "global-enrichment", label: "Global Enrichment" },
    { id: "enriched-regions", label: "Enriched Regions" },
];

export default {
    name: "VariantSifterGlobalEnrichmentDrawer",
    components: {
        VariantSifterGlobalEnrichmentPlot,
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
            activeTab: "annotations",
            activeTableTab: "global-enrichment",
            tabs: GE_DRAWER_TABS,
            tableTabs: GE_TABLE_TABS,
            pValueInput: String(GE_TRACK_P_VALUE_MAX),
        };
    },
    watch: {
        geTrackPValueMax: {
            immediate: true,
            handler(value) {
                this.pValueInput = String(value);
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
        hasBiosampleMethodSourceFilters() {
            return this.methodOptions.length > 0 || this.sourceOptions.length > 0;
        },
        methodOptions() {
            return [...(this.globalEnrichmentState?.biosampleMethodOptions || [])].sort();
        },
        sourceOptions() {
            return [...(this.globalEnrichmentState?.biosampleSourceOptions || [])].sort();
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
                return { ...group, shownCount };
            });
        },
        tissueCheckboxItems() {
            const items = [];
            this.tissueGroups.forEach((group) => {
                group.tissues.forEach((tissue) => {
                    items.push({
                        annotation: group.annotation,
                        tissue,
                        shown: this.isTissueShownForAnnotation(group.annotation, tissue),
                    });
                });
            });
            return items;
        },
        allTissuesSelected() {
            return (
                this.tissueCheckboxItems.length > 0 &&
                this.tissueCheckboxItems.every((item) => item.shown)
            );
        },
        someTissuesSelected() {
            return this.tissueCheckboxItems.some((item) => item.shown);
        },
        geTableModel() {
            return buildGeTissueTableModel({
                geRows: this.globalEnrichmentState?.geRows || [],
                annoData: this.globalEnrichmentState?.annoData || {},
                phenotype: this.phenotypeName,
                ancestry: this.ancestryCode,
                annotations: this.selectedAnnotations,
                utils: this.utils,
                llmRelevance: this.llmRelevance,
                enabledMutedAnnotationTissues: this.enabledMutedAnnotationTissues,
                disabledAnnotationTissues: this.disabledAnnotationTissues,
                filterByTissueVisibility: true,
                pValueMax: this.geTrackPValueMax,
            });
        },
        geTableSubtitle() {
            if (!this.phenotypeName) {
                return "";
            }
            return `Filtered by selected annotations and shown tissues. Sorted by p-value. ${this.phenotypeName} (${this.ancestryCode}). p < ${this.geTrackPValueMax}.`;
        },
        enrichedRegionsRows() {
            const statsCache = {};
            return buildEnrichedRegionsTableRows(
                this.globalEnrichmentState?.annoRows || [],
                {
                    annotations: this.selectedAnnotations,
                    isTissueVisible: (annotation, tissue) =>
                        this.isTissueShownForAnnotation(annotation, tissue, statsCache),
                }
            );
        },
        enrichedRegionsSubtitle() {
            const count = this.enrichedRegionsRows.length;
            if (!count) {
                return "Filtered by selected annotations and shown tissues. Sorted by region start.";
            }
            return (
                `Filtered by selected annotations and shown tissues. ` +
                `Sorted by region start. ${count.toLocaleString()} region${
                    count === 1 ? "" : "s"
                }.`
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
        onSelectAllMethodSourceFilters() {
            this.$emit("update:selectedMethods", [...this.methodOptions]);
            this.$emit("update:selectedSources", [...this.sourceOptions]);
        },
        onUnselectAllMethodSourceFilters() {
            this.$emit("update:selectedMethods", []);
            this.$emit("update:selectedSources", []);
        },
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
                this.isAnnotationEmphasized(annotation)
                    ? baseColor
                    : `${baseColor.slice(0, 7)}55`
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
        onSelectAllTissues(event) {
            const selectAll = Boolean(event?.target?.checked);
            const next = selectAll
                ? buildSelectAllAnnotationTissueOverrides({
                      annoData: this.globalEnrichmentState?.annoData || {},
                      geRows: this.globalEnrichmentState?.geRows || [],
                      phenotype: this.phenotypeName,
                      ancestry: this.ancestryCode,
                      annotations: this.annotationOptions,
                      llmRelevance: this.llmRelevance,
                      pValueMax: this.geTrackPValueMax,
                  })
                : buildDeselectAllAnnotationTissueOverrides({
                      annoData: this.globalEnrichmentState?.annoData || {},
                      geRows: this.globalEnrichmentState?.geRows || [],
                      phenotype: this.phenotypeName,
                      ancestry: this.ancestryCode,
                      annotations: this.annotationOptions,
                      llmRelevance: this.llmRelevance,
                      pValueMax: this.geTrackPValueMax,
                  });
            this.$emit(
                "update:enabledMutedAnnotationTissues",
                next.enabledMutedAnnotationTissues
            );
            this.$emit("update:disabledAnnotationTissues", next.disabledAnnotationTissues);
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
.vks-ge-muted-group {
    margin-bottom: 12px;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fcfbfa;
}

.vks-ge-tissue-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px 16px;
}

.vks-ge-tissue-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    margin: 0 0 12px;
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

.vks-ge-tissue-column {
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fcfbfa;
    min-width: 0;
}

.vks-ge-muted-annotation-label {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: #33363d;
}

.vks-ge-muted-count {
    font-weight: 500;
    color: #6b6b6b;
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

.vks-ge-legend-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
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

.vks-ge-settings-section {
    margin: 0 0 18px;
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
    margin: 0 0 14px;
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
    font-size: 13px;
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

.vks-ge-table-tabs-section {
    margin-top: 8px;
}

</style>
