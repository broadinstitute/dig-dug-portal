<template>
    <div v-if="groups.length || workspaceFilterActive" class="vks-mapping-bar">
        <p class="vks-mapping-bar-intro">
            Mapping has three layers that stay independent:
            <strong>loaded workspace data</strong>,
            <strong>mappable options</strong> (chips below — checked or not), and an
            optional <strong>Filter workspace to mapped data</strong> view. Filtering
            only changes what visualizers render; it does not rewrite loaded data or
            clear your mapping/track selections. <strong>Or</strong> keeps variants
            that match any checked category; <strong>And</strong> keeps only variants
            that match every checked category. Turn the filter off to restore the full
            workspace view with the same selections. Click a chip to apply or cancel
            mapping; click <strong>×</strong> to remove that option from the list.
        </p>

        <div class="vks-mapping-bar-controls">
            <label class="vks-mapping-bar-mode">
                Compare mapped features:
                <select
                    class="vks-mapping-bar-select"
                    :value="mappingMode"
                    @change="onModeChange"
                >
                    <option
                        v-for="option in modeOptions"
                        :key="option.id"
                        :value="option.id"
                    >
                        {{ option.label }}
                    </option>
                </select>
            </label>
            <div class="vks-ui-btn-row vks-mapping-bar-actions">
                <button
                    type="button"
                    class="vks-ui-btn vks-ui-btn--secondary"
                    :disabled="!categories.length"
                    @click="selectAll"
                >
                    Select all
                </button>
                <button
                    type="button"
                    class="vks-ui-btn vks-ui-btn--secondary"
                    :disabled="!selectedCategoryIds.length"
                    @click="clearAll"
                >
                    Clear mapping
                </button>
                <label class="vks-mapping-bar-toggle">
                    <input
                        type="checkbox"
                        :checked="workspaceFilterActive"
                        :disabled="!workspaceFilterActive && !selectedCategoryIds.length"
                        @change="onWorkspaceFilterToggle"
                    />
                    <span>Filter workspace to mapped data</span>
                </label>
            </div>
        </div>

        <p v-if="workspaceFilterActive" class="vks-mapping-bar-applied">
            Workspace filter on:
            {{ workspaceFilterRowCount.toLocaleString() }} mapped variant(s) driving
            visualizers. Turn off to restore the full workspace view.
        </p>

        <section
            v-for="group in groups"
            :key="group.id"
            class="vks-mapping-bar-group"
        >
            <p class="vks-ui-section-title">{{ group.label }}</p>
            <div class="vks-mapping-bar-chips" role="group" :aria-label="group.label">
                <div
                    v-for="category in group.categories"
                    :key="category.id"
                    class="vks-mapping-bar-chip"
                    :class="{ 'is-selected': isSelected(category.id) }"
                >
                    <button
                        type="button"
                        class="vks-mapping-bar-chip-toggle"
                        :aria-pressed="isSelected(category.id) ? 'true' : 'false'"
                        :title="
                            isSelected(category.id)
                                ? 'Cancel mapping for this option'
                                : 'Apply mapping for this option'
                        "
                        @click="toggleCategory(category.id)"
                    >
                        {{ category.label }}
                    </button>
                    <button
                        type="button"
                        class="vks-mapping-bar-chip-remove"
                        :aria-label="`Remove ${category.label}`"
                        title="Remove this option"
                        @click.stop="removeCategory(category.id)"
                    >
                        ×
                    </button>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import {
    groupMappingCategories,
    normalizeMappingMode,
    VKS_MAPPING_MODES,
} from "./variantSifterMappingData.js";

export default {
    name: "VariantSifterMappingBar",
    props: {
        categories: {
            type: Array,
            default: () => [],
        },
        selectedCategoryIds: {
            type: Array,
            default: () => [],
        },
        mappingMode: {
            type: String,
            default: "or",
        },
        workspaceFilterActive: {
            type: Boolean,
            default: false,
        },
        workspaceFilterRowCount: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
            modeOptions: VKS_MAPPING_MODES,
        };
    },
    computed: {
        groups() {
            return groupMappingCategories(this.categories);
        },
    },
    methods: {
        isSelected(categoryId) {
            return (this.selectedCategoryIds || []).includes(categoryId);
        },
        toggleCategory(categoryId) {
            const next = new Set(this.selectedCategoryIds || []);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            this.$emit("update:selectedCategoryIds", [...next]);
        },
        removeCategory(categoryId) {
            this.$emit("remove-category", categoryId);
        },
        selectAll() {
            this.$emit(
                "update:selectedCategoryIds",
                this.categories.map((category) => category.id)
            );
        },
        clearAll() {
            this.$emit("update:selectedCategoryIds", []);
        },
        onModeChange(event) {
            this.$emit(
                "update:mappingMode",
                normalizeMappingMode(event?.target?.value)
            );
        },
        onWorkspaceFilterToggle(event) {
            this.$emit(
                "update:workspaceFilterActive",
                Boolean(event?.target?.checked)
            );
        },
    },
};
</script>

<style scoped>
.vks-mapping-bar {
    margin: 0 0 14px;
    padding: 12px 14px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: var(--cfde-header-bg, #f6f5f2);
}

.vks-mapping-bar-intro {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-mapping-bar-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 16px;
    margin-bottom: 12px;
}

.vks-mapping-bar-mode {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-mapping-bar-select {
    min-width: 72px;
    height: 32px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    font-size: 13px;
    padding: 0 8px;
}

.vks-mapping-bar-actions {
    margin: 0;
    align-items: center;
}

.vks-mapping-bar-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
    user-select: none;
}

.vks-mapping-bar-toggle input {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.vks-mapping-bar-toggle:has(input:disabled) {
    opacity: 0.55;
    cursor: not-allowed;
}

.vks-mapping-bar-applied {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.vks-mapping-bar-group + .vks-mapping-bar-group {
    margin-top: 12px;
}

.vks-mapping-bar-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.vks-mapping-bar-chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    max-width: 100%;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 999px;
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.3;
    padding: 0;
    overflow: hidden;
}

.vks-mapping-bar-chip-toggle {
    appearance: none;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: 600;
    line-height: 1.3;
    padding: 5px 6px 5px 10px;
    cursor: pointer;
    text-align: left;
    min-width: 0;
}

.vks-mapping-bar-chip-remove {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    padding: 5px 9px 5px 4px;
    cursor: pointer;
    flex: 0 0 auto;
}

.vks-mapping-bar-chip:hover {
    border-color: var(--cfde-blue, #2c5c97);
    color: var(--cfde-blue, #2c5c97);
}

.vks-mapping-bar-chip:hover .vks-mapping-bar-chip-remove {
    color: var(--cfde-blue, #2c5c97);
}

.vks-mapping-bar-chip.is-selected {
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
    color: #ffffff;
}

.vks-mapping-bar-chip.is-selected .vks-mapping-bar-chip-remove {
    color: rgba(255, 255, 255, 0.85);
}

.vks-mapping-bar-chip.is-selected .vks-mapping-bar-chip-remove:hover {
    color: #ffffff;
}
</style>
