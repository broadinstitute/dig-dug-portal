<template>
    <div class="vks-genes-drawer">
        <p class="vks-genes-drawer-intro">
            Choose which gene biotypes appear on the genes track for this locus.
        </p>

        <div v-if="loading" class="vks-genes-drawer-status">Loading genes…</div>
        <div v-else-if="error" class="vks-genes-drawer-error" role="alert">
            {{ error }}
        </div>
        <template v-else-if="!geneTypeOptions.length">
            <p class="vks-genes-drawer-hint">No gene biotypes are available for this locus.</p>
        </template>
        <template v-else>
            <div class="vks-genes-select-row">
                <label class="vks-genes-select-label" :for="geneTypesSelectId">
                    Gene types in this locus
                </label>
                <select
                    :id="geneTypesSelectId"
                    :key="selectedTypesKey"
                    class="custom-select vks-genes-select"
                    multiple
                    :size="selectSize"
                    @change="onTypesChange"
                >
                    <option
                        v-for="geneType in geneTypeOptions"
                        :key="geneType"
                        :value="geneType"
                        :selected="selectedTypes.includes(geneType)"
                    >
                        {{ formatGeneTypeLabel(geneType) }}
                    </option>
                </select>
                <p class="vks-genes-drawer-hint">
                    Hold {{ modifierLabel }} to select multiple types. Default is coding
                    genes only.
                </p>
                <div class="vks-genes-quick-actions">
                    <button type="button" class="vks-genes-quick-btn" @click="selectCodingOnly">
                        Coding only
                    </button>
                    <button type="button" class="vks-genes-quick-btn" @click="selectAllTypes">
                        All types
                    </button>
                </div>
            </div>

            <div class="vks-genes-legend">
                <p class="vks-genes-legend-title">Color key</p>
                <ul class="vks-genes-legend-list">
                    <li
                        v-for="geneType in geneTypeOptions"
                        :key="geneType"
                        class="vks-genes-legend-item"
                    >
                        <span
                            class="vks-genes-legend-swatch"
                            :style="{ backgroundColor: geneTypeColors[geneType] }"
                            aria-hidden="true"
                        ></span>
                        <span>{{ formatGeneTypeLabel(geneType) }}</span>
                    </li>
                </ul>
            </div>

            <p class="vks-genes-drawer-meta">
                Showing {{ visibleGeneCount.toLocaleString() }} of
                {{ totalGeneCount.toLocaleString() }} genes in this locus.
            </p>
        </template>
    </div>
</template>

<script>
import {
    buildGeneTypeOptions,
    filterGenesByTypes,
    formatGeneTypeLabel,
    resolveSelectedGeneTypesForData,
    VKS_DEFAULT_GENE_TYPES,
} from "./variantSifterGenesFilter.js";
import { buildGeneTypeColorMap } from "./variantSifterGenesColors.js";

let genesDrawerSelectCounter = 0;

export default {
    name: "VariantSifterGenesDrawer",
    props: {
        genesState: {
            type: Object,
            default: () => ({
                ready: false,
                loading: false,
                error: null,
                data: null,
                selectedTypes: [...VKS_DEFAULT_GENE_TYPES],
            }),
        },
    },
    data() {
        genesDrawerSelectCounter += 1;
        return {
            geneTypesSelectId: `vks-genes-types-${genesDrawerSelectCounter}`,
            isMac: typeof navigator !== "undefined" && /Mac/i.test(navigator.platform),
        };
    },
    computed: {
        loading() {
            return Boolean(this.genesState?.loading);
        },
        error() {
            return this.genesState?.error || null;
        },
        allGenes() {
            return Array.isArray(this.genesState?.data) ? this.genesState.data : [];
        },
        selectedTypes() {
            return resolveSelectedGeneTypesForData(
                this.genesState?.selectedTypes,
                this.allGenes
            );
        },
        geneTypeOptions() {
            return buildGeneTypeOptions(this.allGenes);
        },
        geneTypeColors() {
            return buildGeneTypeColorMap(this.geneTypeOptions);
        },
        visibleGenes() {
            return filterGenesByTypes(this.allGenes, this.selectedTypes);
        },
        visibleGeneCount() {
            return this.visibleGenes.length;
        },
        totalGeneCount() {
            return this.allGenes.length;
        },
        selectSize() {
            return Math.min(10, Math.max(4, this.geneTypeOptions.length));
        },
        modifierLabel() {
            return this.isMac ? "Command" : "Ctrl";
        },
        selectedTypesKey() {
            return this.selectedTypes.join(",");
        },
    },
    methods: {
        formatGeneTypeLabel,
        onTypesChange(event) {
            const selected = Array.from(event.target.selectedOptions).map(
                (option) => option.value
            );
            this.$emit(
                "update:selectedTypes",
                resolveSelectedGeneTypesForData(
                    selected.length ? selected : VKS_DEFAULT_GENE_TYPES,
                    this.allGenes
                )
            );
        },
        selectCodingOnly() {
            if (this.geneTypeOptions.includes("protein_coding")) {
                this.$emit("update:selectedTypes", ["protein_coding"]);
                return;
            }
            this.$emit("update:selectedTypes", [...this.geneTypeOptions]);
        },
        selectAllTypes() {
            this.$emit("update:selectedTypes", [...this.geneTypeOptions]);
        },
    },
};
</script>

<style scoped>
.vks-genes-drawer-intro,
.vks-genes-drawer-hint,
.vks-genes-drawer-meta,
.vks-genes-drawer-status {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-genes-drawer-error {
    margin: 0;
    font-size: 13px;
    color: #b42318;
}

.vks-genes-select-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.vks-genes-select-label {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-genes-select {
    width: 100%;
    min-height: 120px;
    font-size: 13px;
}

.vks-genes-quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.vks-genes-quick-btn {
    padding: 4px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}

.vks-genes-quick-btn:hover {
    background: rgba(44, 92, 151, 0.08);
}

.vks-genes-legend {
    margin-bottom: 12px;
}

.vks-genes-legend-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-genes-legend-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.vks-genes-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    line-height: 1.35;
    color: var(--cfde-ink, #33363d);
}

.vks-genes-legend-swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
}
</style>
