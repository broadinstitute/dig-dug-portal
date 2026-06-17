<template>
    <div class="mq-viz-toolbar-menus">
        <b-dropdown
            text="Analyze"
            size="sm"
            variant="link"
            class="mq-viz-analyze-menu"
            toggle-class="mq-viz-menu-toggle"
            menu-class="mq-viz-menu-list"
            right
        >
            <b-dropdown-item
                :disabled="!selectedNodes.length"
                @click="$emit('analyze-explain')"
            >
                Explain selected…
            </b-dropdown-item>
            <b-dropdown-item
                :disabled="!hasGeneSetSelections"
                @click="$emit('analyze-provenance')"
            >
                Find dataset provenance (gene sets only)
            </b-dropdown-item>
        </b-dropdown>
        <b-dropdown
            v-if="savedExplanations.length"
            :text="explanationsMenuLabel"
            size="sm"
            variant="link"
            class="mq-viz-analyze-menu"
            toggle-class="mq-viz-menu-toggle"
            menu-class="mq-viz-menu-list"
            right
        >
            <b-dropdown-item
                v-for="item in savedExplanations"
                :key="item.id"
                :title="item.title"
                @click="$emit('open-saved-explanation', item.id)"
            >
                {{ item.menuLabel }}
            </b-dropdown-item>
        </b-dropdown>
        <b-dropdown
            v-if="savedDatasetRuns.length"
            :text="datasetsMenuLabel"
            size="sm"
            variant="link"
            class="mq-viz-analyze-menu"
            toggle-class="mq-viz-menu-toggle"
            menu-class="mq-viz-menu-list"
            right
        >
            <b-dropdown-item
                v-for="item in savedDatasetRuns"
                :key="item.id"
                :title="item.title"
                @click="$emit('open-saved-dataset', item.id)"
            >
                {{ item.menuLabel }}
            </b-dropdown-item>
        </b-dropdown>
    </div>
</template>

<script>
import { geneSetIdsFromSelectedNodes } from "./revealMqSelectedNodesAnalyze.js";

export default {
    name: "WorkflowVizToolbarMenus",
    props: {
        selectedNodes: { type: Array, default: () => [] },
        savedExplanations: { type: Array, default: () => [] },
        savedDatasetRuns: { type: Array, default: () => [] },
    },
    computed: {
        hasGeneSetSelections() {
            return geneSetIdsFromSelectedNodes(this.selectedNodes).length > 0;
        },
        explanationsMenuLabel() {
            const count = (this.savedExplanations || []).length;
            return count === 1 ? "Explanations" : `Explanations (${count})`;
        },
        datasetsMenuLabel() {
            const count = (this.savedDatasetRuns || []).length;
            return count === 1 ? "Datasets" : `Datasets (${count})`;
        },
    },
};
</script>

<style scoped>
.mq-viz-toolbar-menus {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 4px 8px;
    flex: 0 0 auto;
    margin-left: auto;
    padding-bottom: 0.35rem;
}

.mq-viz-menu-toggle {
    padding: 0 4px;
    font-size: 12px;
    font-weight: 600;
    color: #e07b39;
    text-decoration: none;
}

.mq-viz-menu-toggle:hover,
.mq-viz-menu-toggle:focus {
    color: #c45a00;
    text-decoration: none;
}
</style>
