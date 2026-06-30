<template>
    <div class="vks-cs-drawer">
        <p class="vks-cs-drawer-intro">
            Filter associated variants by credible set membership to view the set(s) of
            fine-mapped variants most likely to include the causal variant for this locus.
        </p>

        <div v-if="listLoading" class="vks-cs-drawer-status">Loading credible sets…</div>
        <div v-else-if="listError" class="vks-cs-drawer-error" role="alert">
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
                        :key="entry.credibleSetId + ',' + entry.phenotype"
                        :value="entry.credibleSetId + ',' + entry.phenotype"
                        :disabled="isSelected(entry.credibleSetId)"
                    >
                        {{ optionLabel(entry) }}
                    </option>
                </select>
            </div>

            <div v-if="selectedEntries.length" class="vks-cs-pills">
                <button
                    v-for="entry in selectedEntries"
                    :key="entry.credibleSetId"
                    type="button"
                    class="vks-cs-pill"
                    :style="{ backgroundColor: colorBySetId[entry.credibleSetId] }"
                    @click="$emit('remove-set', entry.credibleSetId)"
                >
                    <span>{{ entry.credibleSetId }}, {{ entry.phenotype }}</span>
                    <span class="vks-cs-pill-remove" aria-hidden="true">&times;</span>
                </button>
            </div>
            <p v-else-if="availableSets.length" class="vks-cs-drawer-hint">
                Choose a credible set to add its variants to the workspace track and
                Variant data table.
            </p>
            <p v-else class="vks-cs-drawer-hint">
                No credible sets are available for this locus.
            </p>

            <div v-if="variantsLoading" class="vks-cs-drawer-status">
                Loading credible variants…
            </div>
            <div v-else-if="variantsError" class="vks-cs-drawer-error" role="alert">
                {{ variantsError }}
            </div>
            <template v-else-if="panelTableRows.length">
                <h4 class="vks-cs-table-title">Credible variants</h4>
                <VariantSifterDataTableView
                    :rows="panelTableRows"
                    :top-rows="panelTableColumns"
                    :table-format="panelTableFormat"
                    :utils="utils"
                    :default-per-page="10"
                    empty-message="No credible variants loaded."
                />
            </template>
        </template>
    </div>
</template>

<script>
import VariantSifterDataTableView from "./VariantSifterDataTableView.vue";
import {
    CREDIBLE_VARIANTS_TABLE_COLUMNS,
    credibleSetOptionLabel,
} from "./variantSifterCredibleSetsFormat.js";
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
        selectedEntries() {
            return this.selectedIds
                .map((credibleSetId) => {
                    const fromList = this.availableSets.find(
                        (entry) => entry.credibleSetId === credibleSetId
                    );
                    const fromState =
                        this.credibleSetsState?.variantsBySet?.[credibleSetId]?.meta;
                    return (
                        fromList || {
                            credibleSetId,
                            phenotype: fromState?.phenotype || "",
                        }
                    );
                })
                .filter(Boolean);
        },
        panelTableRows() {
            return buildCredibleVariantsPanelRows(this.credibleSetsState);
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
        isSelected(credibleSetId) {
            return this.selectedIds.includes(credibleSetId);
        },
        onSelectChange(event) {
            const value = event.target.value;
            event.target.value = "";
            if (!value) {
                return;
            }
            const [credibleSetId, phenotype] = value.split(",");
            this.$emit("add-set", { credibleSetId, phenotype });
        },
    },
};
</script>

<style scoped>
.vks-cs-drawer-intro {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.vks-cs-drawer-status,
.vks-cs-drawer-hint {
    margin: 10px 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-cs-drawer-error {
    margin: 10px 0;
    font-size: 13px;
    color: #b42318;
}

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
    font-size: 12px;
    color: #ffffff;
    cursor: pointer;
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
