<template>
    <div class="gp2-qtl-drawer">
        <p class="vks-ui-intro">
            QTL associations for the 50 kb viewing region. Check at least one QTL
            type and one tissue, then close this drawer to load data.
        </p>

        <section class="vks-drawer-section vks-drawer-section--controls">
            <div class="vks-ui-tabs" role="tablist" aria-label="QTL evidence panels">
                <button
                    v-for="tab in tabs"
                    :id="`gp2-qtl-tab-${tab.id}`"
                    :key="tab.id"
                    type="button"
                    role="tab"
                    class="vks-ui-tab"
                    :class="{ 'is-active': activeTab === tab.id }"
                    :aria-selected="activeTab === tab.id ? 'true' : 'false'"
                    :aria-controls="`gp2-qtl-panel-${tab.id}`"
                    @click="activeTab = tab.id"
                >
                    {{ tab.label }}
                </button>
            </div>

            <div
                v-show="activeTab === 'type-tissue'"
                id="gp2-qtl-panel-type-tissue"
                class="vks-ui-tab-panel"
                role="tabpanel"
                aria-labelledby="gp2-qtl-tab-type-tissue"
            >
                <section class="vks-ui-section">
                    <p class="vks-ui-section-title">QTL types</p>
                    <ul class="gp2-qtl-check-list" role="group" aria-label="QTL types">
                        <li
                            v-for="type in typeOptions"
                            :key="`type-${type}`"
                            class="gp2-qtl-check-item"
                        >
                            <label class="gp2-qtl-check">
                                <input
                                    type="checkbox"
                                    :checked="isTypeSelected(type)"
                                    @change="onToggleType(type, $event)"
                                />
                                <span>{{ type }}</span>
                            </label>
                        </li>
                    </ul>
                </section>

                <section class="vks-ui-section">
                    <p class="vks-ui-section-title">Tissues</p>
                    <ul class="gp2-qtl-check-list" role="group" aria-label="Tissues">
                        <li
                            v-for="tissue in tissueOptions"
                            :key="`tissue-${tissue}`"
                            class="gp2-qtl-check-item"
                        >
                            <label class="gp2-qtl-check">
                                <input
                                    type="checkbox"
                                    :checked="isTissueSelected(tissue)"
                                    @change="onToggleTissue(tissue, $event)"
                                />
                                <span>{{ tissue }}</span>
                            </label>
                        </li>
                    </ul>
                </section>
            </div>

            <div
                v-show="activeTab === 'filter-setting'"
                id="gp2-qtl-panel-filter-setting"
                class="vks-ui-tab-panel"
                role="tabpanel"
                aria-labelledby="gp2-qtl-tab-filter-setting"
            >
                <section class="vks-ui-section">
                    <p class="vks-ui-section-title">Filters</p>
                    <label class="gp2-qtl-pvalue-filter">
                        <span class="gp2-qtl-field-label">P-value</span>
                        <input
                            type="text"
                            class="gp2-qtl-pvalue-input"
                            :value="pValueMax"
                            inputmode="decimal"
                            placeholder="No maximum"
                            aria-label="Maximum QTL p-value"
                            @input="onPValueInput"
                        />
                    </label>
                    <p class="vks-ui-hint">
                        Hides loaded rows with a p-value above this cutoff. Leave blank
                        to show every loaded row.
                    </p>
                </section>
            </div>
        </section>

        <section class="vks-drawer-section vks-drawer-section--table">
            <p class="vks-ui-section-title">QTL associations</p>
            <div v-if="loading" class="vks-ui-status">Loading QTL associations…</div>
            <div v-else-if="error" class="vks-ui-error" role="alert">{{ error }}</div>
            <GP2BrowserQtlTable
                v-if="showTable"
                :rows="filteredRows"
                :utils="utils"
            />
            <p v-else-if="!loading && !error" class="vks-ui-hint">
                Select at least one QTL type and one tissue, then close the drawer
                to load data.
            </p>
        </section>
    </div>
</template>

<script>
import GP2BrowserQtlTable from "./GP2BrowserQtlTable.vue";
import {
    GP2_QTL_TISSUE_OPTIONS,
    GP2_QTL_TYPE_OPTIONS,
} from "./gp2BrowserQtlApi.js";

const QTL_DRAWER_TABS = [
    { id: "type-tissue", label: "Type / Tissue" },
    { id: "filter-setting", label: "Filter / Setting" },
];

function parsePValueMax(value) {
    const text = String(value || "").trim();
    if (!text) {
        return null;
    }
    const number = Number(text);
    if (!Number.isFinite(number) || number < 0) {
        return null;
    }
    return number;
}

export default {
    name: "GP2BrowserQtlDrawer",
    components: {
        GP2BrowserQtlTable,
    },
    props: {
        qtlState: {
            type: Object,
            default: () => ({
                loading: false,
                error: null,
                rows: [],
                selectedTypes: [],
                selectedTissues: [],
                pValueMax: "",
                loadedRegionKey: null,
            }),
        },
        utils: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            tabs: QTL_DRAWER_TABS,
            activeTab: "type-tissue",
            typeOptions: GP2_QTL_TYPE_OPTIONS,
            tissueOptions: GP2_QTL_TISSUE_OPTIONS,
        };
    },
    computed: {
        selectedTypes() {
            return this.qtlState?.selectedTypes || [];
        },
        selectedTissues() {
            return this.qtlState?.selectedTissues || [];
        },
        pValueMax() {
            return this.qtlState?.pValueMax != null ? String(this.qtlState.pValueMax) : "";
        },
        loading() {
            return Boolean(this.qtlState?.loading);
        },
        error() {
            return this.qtlState?.error || null;
        },
        hasLoaded() {
            return Boolean(this.qtlState?.loadedRegionKey);
        },
        showTable() {
            return this.hasLoaded || (this.qtlState?.rows || []).length > 0;
        },
        filteredRows() {
            const rows = this.qtlState?.rows || [];
            const max = parsePValueMax(this.pValueMax);
            if (max == null) {
                return rows;
            }
            return rows.filter((row) => {
                const pValue = Number(row?.pValue);
                return Number.isFinite(pValue) && pValue <= max;
            });
        },
    },
    methods: {
        isTypeSelected(type) {
            return this.selectedTypes.includes(type);
        },
        isTissueSelected(tissue) {
            return this.selectedTissues.includes(tissue);
        },
        onToggleType(type, event) {
            const next = new Set(this.selectedTypes);
            if (event?.target?.checked) {
                next.add(type);
            } else {
                next.delete(type);
            }
            this.$emit(
                "update:selectedTypes",
                this.typeOptions.filter((option) => next.has(option))
            );
        },
        onToggleTissue(tissue, event) {
            const next = new Set(this.selectedTissues);
            if (event?.target?.checked) {
                next.add(tissue);
            } else {
                next.delete(tissue);
            }
            this.$emit(
                "update:selectedTissues",
                this.tissueOptions.filter((option) => next.has(option))
            );
        },
        onPValueInput(event) {
            this.$emit("update:pValueMax", event?.target?.value ?? "");
        },
    },
};
</script>

<style scoped>
.gp2-qtl-drawer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
}

.gp2-qtl-check-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.gp2-qtl-check {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
}

.gp2-qtl-pvalue-filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0 0 8px;
}

.gp2-qtl-field-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.gp2-qtl-pvalue-input {
    width: 140px;
    max-width: 100%;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    font-size: 13px;
    line-height: 1.3;
    padding: 6px 8px;
}
</style>
