<template>
    <div class="vks-s2g-drawer research-data-table-wrapper">
        <div v-if="loading" class="vks-ui-status">
            Loading SNP-to-gene links…
        </div>
        <div v-else-if="error" class="vks-ui-error vks-ui-error--boxed" role="alert">
            {{ error }}
        </div>

        <section class="vks-drawer-section vks-drawer-section--controls">
            <div class="vks-ui-btn-row">
                <button
                    type="button"
                    class="vks-ui-btn vks-ui-btn--primary"
                    :disabled="!canLoad || loading"
                    @click="$emit('load')"
                >
                    {{ hasTrackData ? "Reload SNP to gene data" : "Load SNP to gene data" }}
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

            <template v-if="hasTrackData && geneOptions.length">
                <section class="vks-ui-section">
                    <p class="vks-ui-section-title">Genes</p>
                    <label class="vks-s2g-gene-select-all">
                        <input
                            type="checkbox"
                            :checked="allGenesSelected"
                            :indeterminate.prop="someGenesSelected && !allGenesSelected"
                            aria-label="Select all genes"
                            @change="onSelectAllGenes($event)"
                        />
                        <span>Select all</span>
                    </label>
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
        </section>

        <section class="vks-drawer-section vks-drawer-section--table">
            <VariantSifterV2gTable
                :rows="tableRows"
                :utils="utils"
                :columns="s2gTableColumns"
                :show-promoter="false"
                :show-tissue-biosample="false"
                empty-message=""
            />
        </section>
    </div>
</template>

<script>
import VariantSifterV2gTable from "./VariantSifterV2gTable.vue";
import {
    buildV2gTableRows,
    collectGenesFromTissueData,
    hasV2gTrackData,
} from "./variantSifterV2gData.js";

const S2G_TABLE_COLUMNS = ["Regulatory element", "Gene", "Method"];

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
        utils: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            s2gTableColumns: S2G_TABLE_COLUMNS,
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
        canLoad() {
            return Boolean(this.viewRegion || this.searchSession?.region);
        },
        geneOptions() {
            return collectGenesFromTissueData(this.tissueData);
        },
        deselectedGenes() {
            return Array.isArray(this.s2gState?.deselectedGenes)
                ? this.s2gState.deselectedGenes
                : [];
        },
        tableRows() {
            return buildV2gTableRows(this.tissueData, [], this.deselectedGenes);
        },
        allGenesSelected() {
            return this.geneOptions.length > 0 && this.deselectedGenes.length === 0;
        },
        someGenesSelected() {
            if (!this.geneOptions.length) {
                return false;
            }
            const deselected = new Set(this.deselectedGenes);
            return this.geneOptions.some((gene) => !deselected.has(gene));
        },
    },
    methods: {
        isGeneSelected(gene) {
            return !this.deselectedGenes.includes(gene);
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
        onSelectAllGenes(event) {
            if (event?.target?.checked) {
                this.$emit("update:deselectedGenes", []);
            } else {
                this.$emit("update:deselectedGenes", [...this.geneOptions]);
            }
        },
    },
};
</script>

<style scoped>
.vks-s2g-drawer {
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
}

.vks-s2g-drawer >>> .vks-table-settings {
    margin: 0;
}

.vks-s2g-gene-select-all {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: #33363d;
    cursor: pointer;
}
</style>
