<template>
    <div class="vks-cs-drawer">
        <p class="vks-ui-intro">
            Filter associated variants by credible set membership to view the set(s) of
            fine-mapped variants most likely to include the causal variant for this locus.
        </p>

        <div v-if="listLoading" class="vks-ui-status">Loading credible sets…</div>
        <div v-else-if="listError" class="vks-ui-error" role="alert">
            {{ listError }}
        </div>
        <template v-else>
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
            <p v-else-if="availableSets.length" class="vks-ui-hint">
                Choose a credible set to add its variants to the workspace track and
                Variant data table.
            </p>
            <p v-else class="vks-ui-hint">
                No credible sets are available for this locus.
            </p>

            <div v-if="variantsLoading" class="vks-ui-status">
                Loading credible variants…
            </div>
            <div v-else-if="variantsError" class="vks-ui-error" role="alert">
                {{ variantsError }}
            </div>
            <template v-else-if="selectedEntries.length">
                <h4 class="vks-cs-table-title">Credible variants</h4>
                <p v-if="regionFilterNote" class="vks-ui-hint">
                    {{ regionFilterNote }}
                </p>
                <VariantSifterDataTableView
                    v-if="panelTableRows.length"
                    :rows="panelTableRows"
                    :top-rows="panelTableColumns"
                    :table-format="panelTableFormat"
                    :utils="utils"
                    :default-per-page="10"
                    empty-message="No credible variants in the searching region."
                />
                <p v-else class="vks-ui-hint">
                    No loaded credible variants fall inside the searching region
                    <template v-if="regionLabel"> ({{ regionLabel }})</template>.
                </p>
            </template>
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
        panelTableColumns() {
            return [...CREDIBLE_VARIANTS_TABLE_COLUMNS, "credibleSetId"];
        },
        panelTableFormat() {
            return {
                "tool tips": {},
                "column formatting": {
                    "P-Value": { type: ["scientific notation"] },
                    PPA: { type: ["scientific notation"] },
                    "Variant ID": {
                        type: ["link"],
                        "link to": "/variant.html?variant=",
                        "new tab": "true",
                    },
                    rsID: {
                        type: ["link"],
                        "link to": "/variant.html?variant=",
                        "new tab": "true",
                    },
                },
            };
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
    },
};
</script>

<style scoped>



.vks-cs-select-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #e8f4fb;
    border-radius: 6px;
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
    margin: 12px 0;
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

.vks-cs-table-title {
    margin: 16px 0 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}
</style>
