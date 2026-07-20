<template>
    <div class="vks-v2g-drawer research-data-table-wrapper">
        <div v-if="loadingTissue" class="vks-ui-status">
            Loading gene links for {{ loadingTissue }}…
        </div>
        <div v-else-if="error" class="vks-ui-error vks-ui-error--boxed" role="alert">
            {{ error }}
        </div>

        <section class="vks-drawer-section vks-drawer-section--controls">
            <div
                class="vks-ui-tabs"
                role="tablist"
                aria-label="Variant-to-gene controls"
            >
                <button
                    v-for="tab in controlTabs"
                    :id="`vks-v2g-tab-${tab.id}`"
                    :key="tab.id"
                    type="button"
                    role="tab"
                    class="vks-ui-tab"
                    :class="{ 'is-active': activeControlTab === tab.id }"
                    :aria-selected="activeControlTab === tab.id ? 'true' : 'false'"
                    :aria-controls="`vks-v2g-panel-${tab.id}`"
                    @click="activeControlTab = tab.id"
                >
                    {{ tab.label }}
                </button>
            </div>

            <div
                v-show="activeControlTab === 'tissues'"
                id="vks-v2g-panel-tissues"
                class="vks-ui-tab-panel"
                role="tabpanel"
                aria-labelledby="vks-v2g-tab-tissues"
            >
                <div v-if="geLoading" class="vks-ui-status">
                    Loading tissue options…
                </div>
                <template v-else-if="tissueOptions.length">
                    <ul
                        class="vks-v2g-tissue-list"
                        role="group"
                        aria-label="Tissues"
                    >
                        <li
                            v-for="tissue in tissueOptions"
                            :key="tissue"
                            class="vks-v2g-tissue-item"
                        >
                            <label class="vks-v2g-tissue-check">
                                <input
                                    type="checkbox"
                                    :checked="isTissueSelected(tissue)"
                                    @change="onToggleTissue(tissue, $event)"
                                />
                                <span>{{ tissue }}</span>
                            </label>
                        </li>
                    </ul>
                    <div class="vks-ui-btn-row">
                        <button
                            type="button"
                            class="vks-ui-btn vks-ui-btn--secondary"
                            :disabled="!selectedTissues.length"
                            @click="clearTissues"
                        >
                            Clear tissues
                        </button>
                    </div>
                </template>
            </div>

            <div
                v-show="activeControlTab === 'filters'"
                id="vks-v2g-panel-filters"
                class="vks-ui-tab-panel"
                role="tabpanel"
                aria-labelledby="vks-v2g-tab-filters"
            >
                <template v-if="hasTrackData">
                    <div v-if="methodOptions.length" class="vks-v2g-settings-block">
                        <p class="vks-v2g-settings-label">Methods</p>
                        <ul
                            class="vks-v2g-filter-list"
                            role="group"
                            aria-label="Methods"
                        >
                            <li
                                v-for="method in methodOptions"
                                :key="method"
                                class="vks-v2g-filter-item"
                            >
                                <label class="vks-v2g-filter-check">
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

                    <div v-if="geneOptions.length" class="vks-v2g-settings-block">
                        <div class="vks-v2g-settings-head">
                            <p class="vks-v2g-settings-label">Genes</p>
                            <div class="vks-ui-btn-row vks-v2g-settings-actions">
                                <button
                                    type="button"
                                    class="vks-ui-btn vks-ui-btn--secondary"
                                    @click="selectAllGenes"
                                >
                                    Select all
                                </button>
                                <button
                                    type="button"
                                    class="vks-ui-btn vks-ui-btn--secondary"
                                    @click="unselectAllGenes"
                                >
                                    Unselect all
                                </button>
                            </div>
                        </div>
                        <ul
                            class="vks-v2g-filter-list"
                            role="group"
                            aria-label="Genes"
                        >
                            <li
                                v-for="gene in geneOptions"
                                :key="gene"
                                class="vks-v2g-filter-item"
                            >
                                <label class="vks-v2g-filter-check">
                                    <input
                                        type="checkbox"
                                        :checked="isGeneSelected(gene)"
                                        @change="onToggleGene(gene, $event)"
                                    />
                                    <span>{{ gene }}</span>
                                </label>
                            </li>
                        </ul>
                    </div>

                    <div v-if="loadedTissueOptions.length" class="vks-v2g-settings-block">
                        <p class="vks-v2g-settings-label">Tissue</p>
                        <ul
                            class="vks-v2g-filter-list"
                            role="group"
                            aria-label="Filter tissues"
                        >
                            <li
                                v-for="tissue in loadedTissueOptions"
                                :key="`filter-tissue-${tissue}`"
                                class="vks-v2g-filter-item"
                            >
                                <label class="vks-v2g-filter-check">
                                    <input
                                        type="checkbox"
                                        :checked="isFilterTissueSelected(tissue)"
                                        @change="onToggleFilterTissue(tissue, $event)"
                                    />
                                    <span>{{ tissue }}</span>
                                </label>
                            </li>
                        </ul>
                    </div>

                    <div v-if="biosampleGroups.length" class="vks-v2g-settings-block">
                        <div class="vks-v2g-settings-head">
                            <p class="vks-v2g-settings-label">Biosamples</p>
                            <div class="vks-ui-btn-row vks-v2g-settings-actions">
                                <button
                                    type="button"
                                    class="vks-ui-btn vks-ui-btn--secondary"
                                    @click="selectAllBiosamples"
                                >
                                    Select all
                                </button>
                                <button
                                    type="button"
                                    class="vks-ui-btn vks-ui-btn--secondary"
                                    @click="unselectAllBiosamples"
                                >
                                    Unselect all
                                </button>
                            </div>
                        </div>
                        <div
                            v-for="group in biosampleGroups"
                            :key="`biosample-group-${group.tissue}`"
                            class="vks-v2g-biosample-group"
                        >
                            <p class="vks-v2g-biosample-group-title">{{ group.tissue }}</p>
                            <ul
                                class="vks-v2g-filter-list"
                                role="group"
                                :aria-label="`Biosamples for ${group.tissue}`"
                            >
                                <li
                                    v-for="biosample in group.biosamples"
                                    :key="biosampleFilterKey(group.tissue, biosample)"
                                    class="vks-v2g-filter-item"
                                >
                                    <label class="vks-v2g-filter-check">
                                        <input
                                            type="checkbox"
                                            :checked="
                                                isBiosampleSelected(group.tissue, biosample)
                                            "
                                            @change="
                                                onToggleBiosample(
                                                    group.tissue,
                                                    biosample,
                                                    $event
                                                )
                                            "
                                        />
                                        <span>{{ biosample }}</span>
                                    </label>
                                </li>
                            </ul>
                        </div>
                    </div>
                </template>
            </div>
        </section>

        <section class="vks-drawer-section vks-drawer-section--table">
            <div class="vks-v2g-table-section">
                <VariantSifterV2gTable
                    :rows="tableRows"
                    :utils="utils"
                />
            </div>
        </section>
    </div>
</template>

<script>
import VariantSifterV2gTable from "./VariantSifterV2gTable.vue";
import {
    buildV2gTableRows,
    collectBiosampleGroupsFromTissueData,
    collectGenesFromTissueData,
    collectLoadedTissuesFromTissueData,
    collectMethodsFromTissueData,
    collectTissueOptionsFromGeRows,
    hasV2gTrackData,
    v2gBiosampleFilterKey,
} from "./variantSifterV2gData.js";

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
        utils: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            activeControlTab: "tissues",
            controlTabs: [
                { id: "tissues", label: "Tissues" },
                { id: "filters", label: "Filters / Settings" },
            ],
        };
    },
    computed: {
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
        loadedTissueOptions() {
            return collectLoadedTissuesFromTissueData(this.tissueData);
        },
        biosampleGroups() {
            return collectBiosampleGroupsFromTissueData(this.tissueData);
        },
        biosampleFilterKeys() {
            const keys = [];
            this.biosampleGroups.forEach((group) => {
                group.biosamples.forEach((biosample) => {
                    keys.push(v2gBiosampleFilterKey(group.tissue, biosample));
                });
            });
            return keys;
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
        deselectedTissues() {
            return Array.isArray(this.v2gState?.deselectedTissues)
                ? this.v2gState.deselectedTissues
                : [];
        },
        deselectedBiosamples() {
            return Array.isArray(this.v2gState?.deselectedBiosamples)
                ? this.v2gState.deselectedBiosamples
                : [];
        },
        tableRows() {
            return buildV2gTableRows(
                this.tissueData,
                this.deselectedMethods,
                this.deselectedGenes,
                this.deselectedTissues,
                this.deselectedBiosamples
            );
        },
    },
    watch: {
        loadedTissueOptions(tissues) {
            const allowed = new Set(tissues || []);
            const next = this.deselectedTissues.filter((tissue) => allowed.has(tissue));
            if (
                next.length === this.deselectedTissues.length &&
                next.every((tissue, index) => tissue === this.deselectedTissues[index])
            ) {
                return;
            }
            this.$emit("update:deselectedTissues", next);
        },
        biosampleFilterKeys(keys) {
            const allowed = new Set(keys || []);
            const next = this.deselectedBiosamples.filter((entry) => allowed.has(entry));
            if (
                next.length === this.deselectedBiosamples.length &&
                next.every((entry, index) => entry === this.deselectedBiosamples[index])
            ) {
                return;
            }
            this.$emit("update:deselectedBiosamples", next);
        },
    },
    methods: {
        biosampleFilterKey(tissue, biosample) {
            return v2gBiosampleFilterKey(tissue, biosample);
        },
        isTissueSelected(tissue) {
            return this.selectedTissues.includes(tissue);
        },
        isFilterTissueSelected(tissue) {
            return !this.deselectedTissues.includes(tissue);
        },
        isBiosampleSelected(tissue, biosample) {
            return !this.deselectedBiosamples.includes(
                v2gBiosampleFilterKey(tissue, biosample)
            );
        },
        isMethodSelected(method) {
            return !this.deselectedMethods.includes(method);
        },
        isGeneSelected(gene) {
            return !this.deselectedGenes.includes(gene);
        },
        onToggleTissue(tissue, event) {
            const checked = Boolean(event?.target?.checked);
            const next = new Set(this.selectedTissues);
            if (checked) {
                next.add(tissue);
            } else {
                next.delete(tissue);
            }
            this.$emit(
                "update:selectedTissues",
                [...next].sort((a, b) => (a > b ? 1 : -1))
            );
        },
        clearTissues() {
            this.$emit("update:selectedTissues", []);
        },
        onToggleFilterTissue(tissue, event) {
            const checked = Boolean(event?.target?.checked);
            const next = new Set(this.deselectedTissues);
            if (checked) {
                next.delete(tissue);
            } else {
                next.add(tissue);
            }
            this.$emit("update:deselectedTissues", [...next].sort());
        },
        onToggleBiosample(tissue, biosample, event) {
            const checked = Boolean(event?.target?.checked);
            const key = v2gBiosampleFilterKey(tissue, biosample);
            const next = new Set(this.deselectedBiosamples);
            if (checked) {
                next.delete(key);
            } else {
                next.add(key);
            }
            this.$emit("update:deselectedBiosamples", [...next].sort());
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
        selectAllGenes() {
            this.$emit("update:deselectedGenes", []);
        },
        unselectAllGenes() {
            this.$emit("update:deselectedGenes", [...this.geneOptions]);
        },
        selectAllBiosamples() {
            this.$emit("update:deselectedBiosamples", []);
        },
        unselectAllBiosamples() {
            this.$emit("update:deselectedBiosamples", [...this.biosampleFilterKeys]);
        },
    },
};
</script>

<style scoped>
.vks-v2g-drawer {
    display: flex;
    flex-direction: column;
    gap: 18px;
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
    align-items: center;
}

.vks-v2g-table-section {
    width: 100%;
    max-width: 100%;
    min-height: 0;
}

.vks-v2g-tissue-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
}

.vks-v2g-tissue-item {
    margin: 0;
}

.vks-v2g-tissue-check,
.vks-v2g-filter-check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 12px;
    line-height: 1.35;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
}

.vks-v2g-tissue-check input,
.vks-v2g-filter-check input {
    margin: 0;
    flex: 0 0 auto;
}

.vks-v2g-settings-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
}

.vks-v2g-settings-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
}

.vks-v2g-settings-label {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-v2g-settings-actions {
    margin: 0;
}

.vks-v2g-filter-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.vks-v2g-filter-item {
    margin: 0;
}

.vks-v2g-biosample-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
}

.vks-v2g-biosample-group + .vks-v2g-biosample-group {
    margin-top: 10px;
}

.vks-v2g-biosample-group-title {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}
</style>
