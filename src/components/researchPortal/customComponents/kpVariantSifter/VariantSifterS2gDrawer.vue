<template>
    <div class="vks-s2g-drawer">
        <p class="vks-ui-intro">
            SNP-to-gene linking evidence for this locus (BioIndex
            <code>variant-links</code>). Load links for the active region, then
            filter by method and gene. Bars are colored by linking method.
        </p>

        <div v-if="loading" class="vks-ui-status">
            Loading SNP-to-gene links…
        </div>
        <div v-else-if="error" class="vks-ui-error vks-ui-error--boxed" role="alert">
            {{ error }}
        </div>

        <div class="vks-ui-tabs" role="tablist" aria-label="SNP-to-gene panels">
            <button
                v-for="tab in tabs"
                :id="`vks-s2g-tab-${tab.id}`"
                :key="tab.id"
                type="button"
                role="tab"
                class="vks-ui-tab"
                :class="{ 'is-active': activeTab === tab.id }"
                :aria-selected="activeTab === tab.id ? 'true' : 'false'"
                :aria-controls="`vks-s2g-panel-${tab.id}`"
                @click="activeTab = tab.id"
            >
                {{ tab.label }}
            </button>
        </div>

        <div
            v-show="activeTab === 'settings'"
            id="vks-s2g-panel-settings"
            class="vks-ui-tab-panel"
            role="tabpanel"
            aria-labelledby="vks-s2g-tab-settings"
        >
            <section class="vks-ui-section">
                <p class="vks-ui-section-title">Data</p>
                <p class="vks-ui-hint">
                    Loads <code>variant-links</code> for the current viewed locus
                    region{{ regionLabel ? ` (${regionLabel})` : "" }}.
                </p>
                <div class="vks-ui-btn-row">
                    <button
                        type="button"
                        class="vks-ui-btn vks-ui-btn--primary"
                        :disabled="!canLoad || loading"
                        @click="$emit('load')"
                    >
                        {{ hasTrackData ? "Reload SNP 2 gene" : "Load SNP 2 gene" }}
                    </button>
                    <button
                        type="button"
                        class="vks-ui-btn vks-ui-btn--secondary"
                        :disabled="!hasTrackData || loading"
                        @click="$emit('clear')"
                    >
                        Clear
                    </button>
                </div>
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
                                class="vks-s2g-method-label"
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

        <div class="vks-s2g-table-block">
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
    hasV2gTrackData,
    solidV2gMethodColor,
    VKS_V2G_METHOD_COLORS,
} from "./variantSifterV2gData.js";
import { formatRegion } from "./variantSifterSearchUtils.js";

const S2G_DRAWER_TABS = [{ id: "settings", label: "Settings / Filters" }];

export default {
    name: "VariantSifterS2gDrawer",
    components: {
        VariantSifterV2gTable,
    },
    props: {
        s2gState: {
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
        return {
            tabs: S2G_DRAWER_TABS,
            activeTab: "settings",
        };
    },
    computed: {
        tissueData() {
            return this.s2gState?.tissueData || {};
        },
        hasTrackData() {
            return hasV2gTrackData(this.s2gState);
        },
        loading() {
            return Boolean(this.s2gState?.loadingTissue);
        },
        error() {
            return this.s2gState?.error || null;
        },
        regionLabel() {
            const region = this.viewRegion || this.searchSession?.region;
            return formatRegion(region) || this.searchSession?.regionLabel || "";
        },
        canLoad() {
            return Boolean(this.viewRegion || this.searchSession?.region);
        },
        methodOptions() {
            return collectMethodsFromTissueData(this.tissueData);
        },
        geneOptions() {
            return collectGenesFromTissueData(this.tissueData);
        },
        deselectedMethods() {
            return Array.isArray(this.s2gState?.deselectedMethods)
                ? this.s2gState.deselectedMethods
                : [];
        },
        deselectedGenes() {
            return Array.isArray(this.s2gState?.deselectedGenes)
                ? this.s2gState.deselectedGenes
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
            if (!this.hasTrackData) {
                return "Load SNP-to-gene links for this locus.";
            }
            return `${this.tableRows.length.toLocaleString()} SNP-to-gene links.`;
        },
    },
    methods: {
        methodColor(index) {
            return solidV2gMethodColor(
                VKS_V2G_METHOD_COLORS[index % VKS_V2G_METHOD_COLORS.length]
            );
        },
        isMethodSelected(method) {
            return !this.deselectedMethods.includes(method);
        },
        isGeneSelected(gene) {
            return !this.deselectedGenes.includes(gene);
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
.vks-s2g-method-label {
    padding-bottom: 2px;
    border-bottom: 3px solid transparent;
}

.vks-s2g-table-block {
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
}
</style>
