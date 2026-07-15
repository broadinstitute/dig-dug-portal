<template>
    <div class="vks-v2g-drawer">
        <p class="vks-ui-intro">
            Tissue-specific variant-to-gene linking evidence for this locus. Select
            tissues to show tracks in the workspace; bars are colored by linking method.
        </p>

        <div v-if="loadingTissue" class="vks-ui-status">
            Loading gene links for {{ loadingTissue }}…
        </div>
        <div v-else-if="error" class="vks-ui-error vks-ui-error--boxed" role="alert">
            {{ error }}
        </div>

        <div class="vks-ui-tabs" role="tablist" aria-label="Variant-to-gene panels">
            <button
                v-for="tab in tabs"
                :id="`vks-v2g-tab-${tab.id}`"
                :key="tab.id"
                type="button"
                role="tab"
                class="vks-ui-tab"
                :class="{ 'is-active': activeTab === tab.id }"
                :aria-selected="activeTab === tab.id ? 'true' : 'false'"
                :aria-controls="`vks-v2g-panel-${tab.id}`"
                @click="activeTab = tab.id"
            >
                {{ tab.label }}
            </button>
        </div>

        <div
            v-show="activeTab === 'settings'"
            id="vks-v2g-panel-settings"
            class="vks-ui-tab-panel"
            role="tabpanel"
            aria-labelledby="vks-v2g-tab-settings"
        >
            <section class="vks-ui-section">
                <p class="vks-ui-section-title">Visualization</p>
                <div class="vks-v2g-view-mode" role="radiogroup" aria-label="V2G visualization">
                    <label
                        v-for="option in viewModeOptions"
                        :key="option.id"
                        class="vks-v2g-view-mode-option"
                    >
                        <input
                            type="radio"
                            name="vks-v2g-view-mode"
                            :value="option.id"
                            :checked="viewMode === option.id"
                            @change="onViewModeChange(option.id)"
                        />
                        <span>{{ option.label }}</span>
                    </label>
                </div>
                <p class="vks-ui-hint">
                    Tracks view shows one row per gene and method. Ribbons and Arcs views
                    show one row per gene (still colored by method), with region-to-region
                    fills or 1px curves to promoters.
                </p>
            </section>

            <section class="vks-ui-section">
                <p class="vks-ui-section-title">Tissues</p>
                <p class="vks-ui-hint">
                    Hold {{ modifierLabel }} to select multiple tissues. Each selected
                    tissue adds gene-links tracks to the workspace.
                </p>
                <div v-if="geLoading" class="vks-ui-status">
                    Loading tissue options…
                </div>
                <template v-else-if="tissueOptions.length">
                    <select
                        :id="tissueSelectId"
                        :key="selectedTissuesKey"
                        class="custom-select vks-v2g-tissue-select"
                        multiple
                        :size="tissueSelectSize"
                        @change="onTissuesChange"
                    >
                        <option
                            v-for="tissue in tissueOptions"
                            :key="tissue"
                            :value="tissue"
                            :selected="selectedTissues.includes(tissue)"
                        >
                            {{ tissue }}
                        </option>
                    </select>
                    <div class="vks-ui-btn-row">
                        <button
                            type="button"
                            class="vks-ui-btn vks-ui-btn--secondary"
                            @click="clearTissues"
                        >
                            Clear tissues
                        </button>
                    </div>
                    <ul v-if="selectedTissues.length" class="vks-ui-chip-list">
                        <li
                            v-for="tissue in selectedTissues"
                            :key="tissue"
                            class="vks-ui-chip"
                        >
                            <span>{{ tissue }}</span>
                            <button
                                type="button"
                                class="vks-ui-chip-remove"
                                :aria-label="`Remove ${tissue}`"
                                @click="removeTissue(tissue)"
                            >
                                ×
                            </button>
                        </li>
                    </ul>
                </template>
                <p v-else class="vks-ui-hint">
                    Tissue options come from global enrichment for this phenotype. Run a
                    phenotype search to populate them.
                </p>
            </section>

            <template v-if="hasTrackData">
                <div class="vks-ui-btn-row">
                    <button
                        type="button"
                        class="vks-ui-btn vks-ui-btn--secondary"
                        @click="selectAllFilters"
                    >
                        Select all
                    </button>
                    <button
                        type="button"
                        class="vks-ui-btn vks-ui-btn--secondary"
                        @click="unselectAllFilters"
                    >
                        Unselect all
                    </button>
                </div>

                <section v-if="methodOptions.length" class="vks-ui-section">
                    <p class="vks-ui-section-title">Methods</p>
                    <ul class="vks-ui-filter-list" role="group" aria-label="Methods">
                        <li
                            v-for="(method, index) in methodOptions"
                            :key="method"
                            class="vks-ui-filter-item"
                        >
                            <label
                                class="vks-v2g-method-label"
                                :style="{ borderBottomColor: methodColor(index) }"
                            >
                                <input
                                    type="checkbox"
                                    :checked="isMethodSelected(method)"
                                    @change="onToggleMethod(method, $event)"
                                />
                                <span>{{ method }}</span>
                            </label>
                        </li>
                    </ul>
                </section>

                <section v-if="geneOptions.length" class="vks-ui-section">
                    <p class="vks-ui-section-title">Genes</p>
                    <ul class="vks-ui-filter-list" role="group" aria-label="Genes">
                        <li
                            v-for="gene in geneOptions"
                            :key="gene"
                            class="vks-ui-filter-item"
                        >
                            <label>
                                <input
                                    type="checkbox"
                                    :checked="isGeneSelected(gene)"
                                    @change="onToggleGene(gene, $event)"
                                />
                                <span>{{ gene }}</span>
                            </label>
                        </li>
                    </ul>
                </section>
            </template>
        </div>

        <div class="vks-v2g-table-block">
            <VariantSifterV2gTable
                :rows="tableRows"
                :tissue-data="tissueData"
                :subtitle="tableSubtitle"
            />
        </div>
    </div>
</template>

<script>
import VariantSifterV2gTable from "./VariantSifterV2gTable.vue";
import {
    buildV2gTableRows,
    collectGenesFromTissueData,
    collectMethodsFromTissueData,
    collectTissueOptionsFromGeRows,
    hasV2gTrackData,
    normalizeV2gViewMode,
    solidV2gMethodColor,
    VKS_V2G_METHOD_COLORS,
    VKS_V2G_VIEW_MODES,
} from "./variantSifterV2gData.js";

const V2G_DRAWER_TABS = [{ id: "settings", label: "Settings / Filters" }];

let v2gTissueSelectCounter = 0;

export default {
    name: "VariantSifterV2gDrawer",
    components: {
        VariantSifterV2gTable,
    },
    props: {
        v2gState: {
            type: Object,
            default: null,
        },
        globalEnrichmentState: {
            type: Object,
            default: null,
        },
        searchSession: {
            type: Object,
            default: null,
        },
        viewRegion: {
            type: Object,
            default: null,
        },
    },
    data() {
        v2gTissueSelectCounter += 1;
        return {
            tabs: V2G_DRAWER_TABS,
            activeTab: "settings",
            viewModeOptions: VKS_V2G_VIEW_MODES,
            tissueSelectId: `vks-v2g-tissues-${v2gTissueSelectCounter}`,
            isMac:
                typeof navigator !== "undefined" && /Mac/i.test(navigator.platform),
        };
    },
    computed: {
        modifierLabel() {
            return this.isMac ? "⌘" : "Ctrl";
        },
        viewMode() {
            return normalizeV2gViewMode(this.v2gState?.viewMode);
        },
        geLoading() {
            return Boolean(this.globalEnrichmentState?.loading);
        },
        tissueOptions() {
            return collectTissueOptionsFromGeRows(this.globalEnrichmentState?.geRows);
        },
        selectedTissues() {
            return Array.isArray(this.v2gState?.selectedTissues)
                ? this.v2gState.selectedTissues
                : [];
        },
        selectedTissuesKey() {
            return this.selectedTissues.join("|");
        },
        tissueSelectSize() {
            return Math.min(12, Math.max(4, this.tissueOptions.length || 4));
        },
        tissueData() {
            return this.v2gState?.tissueData || {};
        },
        hasTrackData() {
            return hasV2gTrackData(this.v2gState);
        },
        loadingTissue() {
            return this.v2gState?.loadingTissue || null;
        },
        error() {
            return this.v2gState?.error || null;
        },
        methodOptions() {
            return collectMethodsFromTissueData(this.tissueData);
        },
        geneOptions() {
            return collectGenesFromTissueData(this.tissueData);
        },
        deselectedMethods() {
            return Array.isArray(this.v2gState?.deselectedMethods)
                ? this.v2gState.deselectedMethods
                : [];
        },
        deselectedGenes() {
            return Array.isArray(this.v2gState?.deselectedGenes)
                ? this.v2gState.deselectedGenes
                : [];
        },
        tableRows() {
            return buildV2gTableRows(
                this.tissueData,
                this.deselectedMethods,
                this.deselectedGenes
            );
        },
        tableSubtitle() {
            const tissueCount = this.selectedTissues.length;
            if (!tissueCount) {
                return "Select tissues to load links.";
            }
            return `${this.tableRows.length.toLocaleString()} links across ${tissueCount} tissue${
                tissueCount === 1 ? "" : "s"
            }.`;
        },
    },
    methods: {
        methodColor(index) {
            return solidV2gMethodColor(
                VKS_V2G_METHOD_COLORS[index % VKS_V2G_METHOD_COLORS.length]
            );
        },
        onViewModeChange(viewMode) {
            this.$emit("update:viewMode", normalizeV2gViewMode(viewMode));
        },
        isMethodSelected(method) {
            return !this.deselectedMethods.includes(method);
        },
        isGeneSelected(gene) {
            return !this.deselectedGenes.includes(gene);
        },
        onTissuesChange(event) {
            const selected = Array.from(event.target.selectedOptions).map(
                (option) => option.value
            );
            this.$emit("update:selectedTissues", selected);
        },
        clearTissues() {
            this.$emit("update:selectedTissues", []);
        },
        removeTissue(tissue) {
            this.$emit(
                "update:selectedTissues",
                this.selectedTissues.filter((entry) => entry !== tissue)
            );
        },
        onToggleMethod(method, event) {
            const checked = Boolean(event?.target?.checked);
            const next = new Set(this.deselectedMethods);
            if (checked) {
                next.delete(method);
            } else {
                next.add(method);
            }
            this.$emit("update:deselectedMethods", [...next].sort());
        },
        onToggleGene(gene, event) {
            const checked = Boolean(event?.target?.checked);
            const next = new Set(this.deselectedGenes);
            if (checked) {
                next.delete(gene);
            } else {
                next.add(gene);
            }
            this.$emit("update:deselectedGenes", [...next].sort());
        },
        selectAllFilters() {
            this.$emit("update:deselectedMethods", []);
            this.$emit("update:deselectedGenes", []);
        },
        unselectAllFilters() {
            this.$emit("update:deselectedMethods", [...this.methodOptions]);
            this.$emit("update:deselectedGenes", [...this.geneOptions]);
        },
    },
};
</script>

<style scoped>
.vks-v2g-view-mode {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 8px;
}

.vks-v2g-view-mode-option {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
}

.vks-v2g-tissue-select {
    width: 100%;
    max-width: 100%;
    min-height: 6rem;
    margin-bottom: 8px;
    font-size: 13px;
}

.vks-v2g-method-label {
    padding-bottom: 2px;
    border-bottom: 3px solid transparent;
}

.vks-v2g-table-block {
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
}
</style>
