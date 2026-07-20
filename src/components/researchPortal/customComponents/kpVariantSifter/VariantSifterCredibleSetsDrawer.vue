<template>
    <div class="vks-cs-drawer research-data-table-wrapper">
        <div v-if="listLoading" class="vks-ui-status">Loading credible sets…</div>
        <div v-else-if="listError" class="vks-ui-error" role="alert">
            {{ listError }}
        </div>
        <template v-else>
            <section class="vks-drawer-section vks-drawer-section--controls">
                <div
                    class="vks-ui-tabs"
                    role="tablist"
                    aria-label="Credible sets controls"
                >
                    <button
                        v-for="tab in controlTabs"
                        :id="`vks-cs-tab-${tab.id}`"
                        :key="tab.id"
                        type="button"
                        role="tab"
                        class="vks-ui-tab"
                        :class="{ 'is-active': activeControlTab === tab.id }"
                        :aria-selected="activeControlTab === tab.id ? 'true' : 'false'"
                        :aria-controls="`vks-cs-panel-${tab.id}`"
                        @click="activeControlTab = tab.id"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <div
                    v-show="activeControlTab === 'credible-sets'"
                    id="vks-cs-panel-credible-sets"
                    class="vks-ui-tab-panel"
                    role="tabpanel"
                    aria-labelledby="vks-cs-tab-credible-sets"
                >
                    <div class="vks-cs-select-row">
                        <label class="vks-cs-select-label" for="vks-cs-select">
                            Select credible set
                        </label>
                        <select
                            id="vks-cs-select"
                            class="custom-select vks-cs-select"
                            :value="''"
                            @change="onSelectChange"
                        >
                            <option value="">Select credible set</option>
                            <option
                                v-for="entry in availableSets"
                                :key="optionKey(entry)"
                                :value="optionValue(entry)"
                                :disabled="isSelected(entry)"
                            >
                                {{ optionLabel(entry) }}
                            </option>
                        </select>
                    </div>

                    <div v-if="selectedEntries.length" class="vks-cs-pills">
                        <button
                            v-for="entry in selectedEntries"
                            :key="selectionKeyForEntry(entry)"
                            type="button"
                            class="vks-cs-pill"
                            :style="{
                                backgroundColor: colorBySetId[selectionKeyForEntry(entry)],
                            }"
                            :title="pillCountTitle(entry)"
                            @click="$emit('remove-set', selectionKeyForEntry(entry))"
                        >
                            <span>{{ pillLabel(entry) }}</span>
                            <span v-if="entry.loaded > 0" class="vks-cs-pill-count">
                                {{ entry.inRegion }}/{{ entry.loaded }}
                            </span>
                            <span class="vks-cs-pill-remove" aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <p v-else-if="!availableSets.length" class="vks-ui-status">
                        No credible sets are available for this locus.
                    </p>
                </div>

                <div
                    v-show="activeControlTab === 'filters'"
                    id="vks-cs-panel-filters"
                    class="vks-ui-tab-panel"
                    role="tabpanel"
                    aria-labelledby="vks-cs-tab-filters"
                >
                    <div v-if="activeFilterCount > 1" class="vks-cs-filter-reset-row">
                        <button
                            type="button"
                            class="btn btn-warning btn-sm vks-cs-filter-reset"
                            @click="clearAllFilters"
                        >
                            Clear all filters
                        </button>
                    </div>

                    <div class="vks-cs-filter-columns">
                        <section class="vks-cs-filter-column">
                            <h4 class="vks-cs-filter-column-title">Variant</h4>
                            <div class="vks-cs-filter-field">
                                <label class="vks-cs-filter-label" for="vks-cs-filter-variant">
                                    Variant ID
                                </label>
                                <input
                                    id="vks-cs-filter-variant"
                                    type="text"
                                    class="form-control vks-cs-filter-input"
                                    list="vks-cs-filter-variant-list"
                                    :value="panelFilters.variantSearch"
                                    @change="onVariantSearchChange"
                                />
                                <datalist id="vks-cs-filter-variant-list">
                                    <option
                                        v-for="option in variantSearchSuggestions"
                                        :key="option"
                                        :value="option"
                                    ></option>
                                </datalist>
                            </div>
                        </section>

                        <section class="vks-cs-filter-column">
                            <h4 class="vks-cs-filter-column-title">Scores</h4>
                            <div class="vks-cs-filter-field">
                                <label class="vks-cs-filter-label" for="vks-cs-filter-ppa">
                                    PPA (>=)
                                </label>
                                <input
                                    id="vks-cs-filter-ppa"
                                    type="text"
                                    class="form-control vks-cs-filter-input"
                                    :value="panelFilters.ppaMin"
                                    @change="onPpaMinChange"
                                />
                            </div>
                            <div class="vks-cs-filter-field">
                                <label class="vks-cs-filter-label" for="vks-cs-filter-pvalue">
                                    P-Value (<=)
                                </label>
                                <input
                                    id="vks-cs-filter-pvalue"
                                    type="text"
                                    class="form-control vks-cs-filter-input"
                                    :value="panelFilters.pValueMax"
                                    @change="onPValueMaxChange"
                                />
                            </div>
                        </section>

                        <section class="vks-cs-filter-column">
                            <h4 class="vks-cs-filter-column-title">Credible sets</h4>
                            <div
                                class="vks-cs-filter-checkboxes"
                                role="group"
                                aria-label="Selected credible sets"
                            >
                                <label
                                    v-for="entry in selectedEntries"
                                    :key="selectionKeyForEntry(entry)"
                                    class="vks-cs-filter-check"
                                >
                                    <input
                                        type="checkbox"
                                        :checked="isFilterSetSelected(selectionKeyForEntry(entry))"
                                        @change="
                                            onFilterSetToggle(
                                                selectionKeyForEntry(entry),
                                                $event
                                            )
                                        "
                                    />
                                    <span>{{ pillLabel(entry) }}</span>
                                </label>
                            </div>
                        </section>
                    </div>
                </div>
            </section>

            <section class="vks-drawer-section vks-drawer-section--table">
                <div class="vks-cs-table-section">
                    <div v-if="variantsLoading" class="vks-ui-status">
                        Loading credible variants…
                    </div>
                    <div v-else-if="variantsError" class="vks-ui-error" role="alert">
                        {{ variantsError }}
                    </div>
                    <template v-else-if="selectedEntries.length">
                        <p v-if="regionFilterNote" class="vks-ui-hint">
                            {{ regionFilterNote }}
                        </p>
                        <VariantSifterDataTableView
                            v-if="filteredTableRows.length"
                            :rows="filteredTableRows"
                            :top-rows="panelTableColumns"
                            :table-format="panelTableFormat"
                            :utils="utils"
                            :default-per-page="10"
                            :show-star-column="true"
                            :starred-variant-ids="starredVariantIds"
                            empty-message="No credible variants match the current filters."
                            @toggle-star-variant="$emit('toggle-star-variant', $event)"
                        />
                    </template>
                </div>
            </section>
        </template>
    </div>
</template>

<script>
import VariantSifterDataTableView from "./VariantSifterDataTableView.vue";
import {
    CREDIBLE_VARIANTS_TABLE_COLUMNS,
    credibleSetOptionLabel,
    credibleSetShortLabel,
    makeCredibleSetSelectionKey,
} from "./variantSifterCredibleSetsFormat.js";
import {
    applyCredibleSetsPanelFilters,
    cloneCredibleSetsPanelFilters,
    countActiveCredibleSetsPanelFilters,
    createCredibleSetsPanelFilters,
} from "./variantSifterCredibleSetsFilters.js";
import { countCredibleSetVariantsInRegion } from "./variantSifterCredibleSetsRegion.js";
import { formatRegion } from "./variantSifterSearchUtils.js";
import { buildCredibleVariantsPanelRows } from "./variantSifterVariantDataTable.js";

export default {
    name: "VariantSifterCredibleSetsDrawer",
    components: {
        VariantSifterDataTableView,
    },
    props: {
        credibleSetsState: {
            type: Object,
            default: () => ({
                listLoading: false,
                listError: null,
                available: [],
                selectedIds: [],
                variantsBySet: {},
                variantsLoading: false,
                variantsError: null,
            }),
        },
        colorBySetId: {
            type: Object,
            default: () => ({}),
        },
        searchSession: {
            type: Object,
            default: null,
        },
        utils: {
            type: Object,
            default: null,
        },
        starredVariantIds: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            activeControlTab: "credible-sets",
            controlTabs: [
                { id: "credible-sets", label: "Credible sets" },
                { id: "filters", label: "Filters" },
            ],
            panelFilters: createCredibleSetsPanelFilters(),
        };
    },
    computed: {
        listLoading() {
            return Boolean(this.credibleSetsState?.listLoading);
        },
        listError() {
            return this.credibleSetsState?.listError || null;
        },
        availableSets() {
            return this.credibleSetsState?.available || [];
        },
        selectedIds() {
            return this.credibleSetsState?.selectedIds || [];
        },
        variantsLoading() {
            return Boolean(this.credibleSetsState?.variantsLoading);
        },
        variantsError() {
            return this.credibleSetsState?.variantsError || null;
        },
        filterRegion() {
            return this.searchSession?.region || null;
        },
        regionLabel() {
            if (this.searchSession?.regionLabel) {
                return this.searchSession.regionLabel;
            }
            return this.filterRegion ? formatRegion(this.filterRegion) : "";
        },
        selectedEntries() {
            return this.selectedIds
                .map((selectionKey) => {
                    const setState =
                        this.credibleSetsState?.variantsBySet?.[selectionKey];
                    const fromState = setState?.meta;
                    const counts = countCredibleSetVariantsInRegion(
                        setState,
                        this.filterRegion
                    );
                    if (fromState) {
                        return {
                            selectionKey,
                            credibleSetId: fromState.credibleSetId || selectionKey,
                            phenotype: fromState.phenotype || "",
                            ancestry: fromState.ancestry || "Mixed",
                            label: fromState.label,
                            loaded: counts.loaded,
                            inRegion: counts.inRegion,
                        };
                    }
                    return {
                        selectionKey,
                        credibleSetId: selectionKey,
                        phenotype: "",
                        ancestry: "Mixed",
                        loaded: counts.loaded,
                        inRegion: counts.inRegion,
                    };
                })
                .filter(Boolean);
        },
        totalLoaded() {
            return this.selectedEntries.reduce((sum, entry) => sum + (entry.loaded || 0), 0);
        },
        totalInRegion() {
            return this.selectedEntries.reduce(
                (sum, entry) => sum + (entry.inRegion || 0),
                0
            );
        },
        regionFilterNote() {
            if (!this.filterRegion || !this.selectedEntries.length || !this.totalLoaded) {
                return null;
            }
            const outside = this.totalLoaded - this.totalInRegion;
            if (outside <= 0) {
                return null;
            }
            const regionPart = this.regionLabel ? ` (${this.regionLabel})` : "";
            return (
                `Showing ${this.totalInRegion.toLocaleString()} of ` +
                `${this.totalLoaded.toLocaleString()} loaded credible variants that fall ` +
                `inside the searching region${regionPart}. ` +
                `${outside.toLocaleString()} variant${outside === 1 ? "" : "s"} ` +
                `outside this region ${outside === 1 ? "is" : "are"} loaded but not ` +
                `listed or plotted.`
            );
        },
        panelTableRows() {
            return buildCredibleVariantsPanelRows(
                this.credibleSetsState,
                this.filterRegion
            );
        },
        filteredTableRows() {
            return applyCredibleSetsPanelFilters(this.panelTableRows, this.panelFilters);
        },
        activeFilterCount() {
            return countActiveCredibleSetsPanelFilters(this.panelFilters);
        },
        variantSearchSuggestions() {
            const values = new Set();
            this.panelTableRows.forEach((row) => {
                const variantId = row?.["Variant ID"] || row?.varId;
                if (variantId) {
                    values.add(String(variantId));
                }
                if (row?.rsID) {
                    values.add(String(row.rsID));
                }
            });
            return Array.from(values)
                .sort((a, b) => a.localeCompare(b))
                .slice(0, 500);
        },
        panelTableColumns() {
            return [...CREDIBLE_VARIANTS_TABLE_COLUMNS, "credibleSetId"];
        },
        panelTableFormat() {
            return {
                "star column": "Variant ID",
                "tool tips": {},
                "column formatting": {
                    "P-Value": { type: ["scientific notation"] },
                    PPA: { type: ["scientific notation"] },
                    "Variant ID": {
                        type: ["link"],
                        "link to": "/variant.html?variant=",
                        "new tab": "true",
                    },
                },
            };
        },
    },
    watch: {
        selectedIds: {
            immediate: true,
            handler(ids) {
                const allowed = new Set(ids || []);
                const nextKeys = (this.panelFilters.selectedSetKeys || []).filter((key) =>
                    allowed.has(key)
                );
                if (
                    nextKeys.length === this.panelFilters.selectedSetKeys.length &&
                    nextKeys.every((key, index) => key === this.panelFilters.selectedSetKeys[index])
                ) {
                    return;
                }
                this.panelFilters = {
                    ...this.panelFilters,
                    selectedSetKeys: nextKeys,
                };
            },
        },
    },
    methods: {
        optionLabel(entry) {
            return credibleSetOptionLabel(entry);
        },
        optionKey(entry) {
            return makeCredibleSetSelectionKey(
                entry.credibleSetId,
                entry.ancestry || "Mixed"
            );
        },
        optionValue(entry) {
            return [
                entry.credibleSetId || "",
                entry.phenotype || "",
                entry.ancestry || "Mixed",
            ].join(",");
        },
        pillLabel(entry) {
            return entry.label || credibleSetShortLabel(entry);
        },
        pillCountTitle(entry) {
            if (!entry?.loaded) {
                return "";
            }
            return (
                `${entry.inRegion.toLocaleString()} of ${entry.loaded.toLocaleString()} ` +
                "loaded variants fall inside the searching region"
            );
        },
        selectionKeyForEntry(entry) {
            return (
                entry.selectionKey ||
                makeCredibleSetSelectionKey(
                    entry.credibleSetId,
                    entry.ancestry || "Mixed"
                )
            );
        },
        isSelected(entry) {
            return this.selectedIds.includes(this.selectionKeyForEntry(entry));
        },
        isFilterSetSelected(selectionKey) {
            return this.panelFilters.selectedSetKeys.includes(selectionKey);
        },
        onSelectChange(event) {
            const value = event.target.value;
            event.target.value = "";
            if (!value) {
                return;
            }
            const [credibleSetId, phenotype, ancestry] = value.split(",");
            this.$emit("add-set", {
                credibleSetId,
                phenotype,
                ancestry: ancestry || "Mixed",
            });
        },
        onVariantSearchChange(event) {
            this.panelFilters = {
                ...this.panelFilters,
                variantSearch: event.target.value.trim(),
            };
        },
        onPpaMinChange(event) {
            this.panelFilters = {
                ...this.panelFilters,
                ppaMin: event.target.value.trim(),
            };
        },
        onPValueMaxChange(event) {
            this.panelFilters = {
                ...this.panelFilters,
                pValueMax: event.target.value.trim(),
            };
        },
        onFilterSetToggle(selectionKey, event) {
            const next = cloneCredibleSetsPanelFilters(this.panelFilters);
            const checked = Boolean(event?.target?.checked);
            const index = next.selectedSetKeys.indexOf(selectionKey);
            if (checked && index < 0) {
                next.selectedSetKeys.push(selectionKey);
            } else if (!checked && index >= 0) {
                next.selectedSetKeys.splice(index, 1);
            }
            this.panelFilters = next;
        },
        clearAllFilters() {
            this.panelFilters = createCredibleSetsPanelFilters();
        },
    },
};
</script>

<style scoped>
.vks-cs-drawer {
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

.vks-cs-table-section {
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
}

.vks-cs-select-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
}

.vks-cs-select-label {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-cs-select {
    flex: 1 1 240px;
    min-width: 200px;
    max-width: 100%;
}

.vks-cs-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0 0;
}

.vks-cs-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 13px;
    color: #ffffff;
    cursor: pointer;
}

.vks-cs-pill-count {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.95;
    white-space: nowrap;
}

.vks-cs-pill-remove {
    font-size: 14px;
    line-height: 1;
    opacity: 0.9;
}

.vks-cs-filter-reset-row {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 10px;
}

.vks-cs-filter-reset {
    font-size: 13px;
    font-weight: 700;
    padding: 6px 14px;
}

.vks-cs-filter-columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px 24px;
}

.vks-cs-filter-column {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 25px;
}

.vks-cs-filter-column-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.vks-cs-filter-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.vks-cs-filter-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-cs-filter-input {
    width: 100%;
    max-width: 180px;
    height: 30px;
    font-size: 13px;
    padding: 2px 6px;
}

.vks-cs-filter-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 220px;
    overflow: auto;
    padding: 2px 0;
}

.vks-cs-filter-check {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0;
    font-size: 12px;
    line-height: 1.35;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
}

.vks-cs-filter-check input {
    margin: 2px 0 0;
    flex: 0 0 auto;
}

.vks-cs-filter-empty {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

@media (max-width: 900px) {
    .vks-cs-filter-columns {
        grid-template-columns: 1fr;
    }
}
</style>
