<template>
    <aside
        v-if="open"
        class="wkb-expand-popup"
        role="dialog"
        aria-modal="false"
        aria-labelledby="wkb-expand-title"
        @click.stop
        @mousedown.stop
    >
        <header class="wkb-expand-head">
            <div class="wkb-expand-head-row">
                <h2 id="wkb-expand-title">Expand graph</h2>
                <button
                    type="button"
                    class="wkb-expand-close"
                    aria-label="Close"
                    :disabled="loading || manualAddBusy"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </div>
            <p class="wkb-expand-intro">
                <template v-if="expandFromSingleNode">
                    Fetch neighbors connected to this node. Use Discover to rank candidates, or Add
                    nodes to place a specific node on the graph.
                </template>
                <template v-else-if="expandFromEdge">
                    Fetch neighbors connected to both endpoints of this edge. Use Discover to rank
                    candidates, or Add nodes to place a specific node on the graph.
                </template>
                <template v-else>
                    Fetch neighbors from your selected nodes. Use Discover to rank candidates, or
                    Add nodes to place a specific node on the graph.
                </template>
            </p>
            <p v-if="expandSeedSummary" class="wkb-expand-anchors">
                <strong>{{ expandSeedLabel }}:</strong> {{ expandSeedSummary }}
            </p>
        </header>

        <div class="wkb-expand-tabrow">
            <div class="wkb-expand-tabs" role="tablist" aria-label="Expand graph modes">
                <button
                    :id="tabButtonId('discover')"
                    type="button"
                    role="tab"
                    class="wkb-expand-tab"
                    :class="{ 'is-active': activeTab === 'discover' }"
                    :aria-selected="activeTab === 'discover' ? 'true' : 'false'"
                    :aria-controls="tabPanelId('discover')"
                    :disabled="loading || manualAddBusy"
                    @click="activeTab = 'discover'"
                >
                    Discover
                </button>
                <button
                    :id="tabButtonId('manual')"
                    type="button"
                    role="tab"
                    class="wkb-expand-tab"
                    :class="{ 'is-active': activeTab === 'manual' }"
                    :aria-selected="activeTab === 'manual' ? 'true' : 'false'"
                    :aria-controls="tabPanelId('manual')"
                    :disabled="loading || manualAddBusy"
                    @click="activeTab = 'manual'"
                >
                    Add nodes
                </button>
                <button
                    :id="tabButtonId('history')"
                    type="button"
                    role="tab"
                    class="wkb-expand-tab"
                    :class="{ 'is-active': activeTab === 'history' }"
                    :aria-selected="activeTab === 'history' ? 'true' : 'false'"
                    :aria-controls="tabPanelId('history')"
                    :disabled="loading || manualAddBusy"
                    @click="activeTab = 'history'"
                >
                    History
                    <span v-if="expansionHistoryCount > 0" class="wkb-expand-tab-count">{{
                        expansionHistoryCount
                    }}</span>
                </button>
            </div>
        </div>

        <div class="wkb-expand-body">
            <section
                v-show="activeTab === 'discover'"
                :id="tabPanelId('discover')"
                class="wkb-expand-tab-panel"
                role="tabpanel"
                :aria-labelledby="tabButtonId('discover')"
            >
                <p v-if="!llmAvailable && expandNeedsLlm" class="wkb-expand-llm-note" role="note">
                    LLM expansion filters are not available — the interactive API did not report an
                    LLM backend.
                </p>

                <label class="wkb-expand-field">
                    <span class="wkb-expand-label">Target node type</span>
                    <select
                        class="wkb-expand-select"
                        :value="controls.targetType || 'all'"
                        :disabled="loading"
                        @change="onTargetTypeChange"
                    >
                        <option
                            v-for="option in targetTypeOptions"
                            :key="option.value"
                            :value="option.value"
                            :disabled="isTargetTypeDisabled(option.value)"
                        >
                            {{ option.label }}
                        </option>
                    </select>
                </label>

                <div class="wkb-expand-controls-row">
                    <label class="wkb-expand-field">
                        <span class="wkb-expand-label">Match to selected nodes</span>
                        <select
                            class="wkb-expand-select"
                            :value="controls.reducer || 'mean'"
                            :disabled="loading || expandFromSingleNode"
                            @change="onReducerChange"
                        >
                            <option
                                v-for="option in matchRequirementOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                        <small v-if="expandFromSingleNode" class="wkb-expand-hint">
                            Not applicable when expanding from a single node.
                        </small>
                        <small v-else class="wkb-expand-hint">{{ matchReducerHelp }}</small>
                    </label>
                    <label class="wkb-expand-field wkb-expand-field--narrow">
                        <span class="wkb-expand-label">Count</span>
                        <input
                            class="wkb-expand-input"
                            type="number"
                            min="1"
                            max="20"
                            :value="controls.limit"
                            :disabled="loading"
                            @change="onLimitChange"
                        />
                        <small class="wkb-expand-hint">
                            Max neighbors to add. AI classification often stops early once this many
                            pass your filters.
                        </small>
                        <p v-if="showBulkWorkflowHint" class="wkb-expand-workflow-hint" role="status">
                            Need more than {{ expandMaxNeighbors }} neighbors at once?
                            <a
                                class="wkb-expand-workflow-link"
                                :href="workflowUrl"
                                target="_blank"
                                rel="noopener noreferrer"
                            >Open {{ workflowTitle }}</a>
                            for bulk discovery of genes, gene sets, and traits from your research
                            intention.
                        </p>
                    </label>
                </div>

                <label class="wkb-expand-hop-option">
                    <input
                        type="checkbox"
                        :checked="controls.connectionScope === 'expanded'"
                        :disabled="loading"
                        @change="onTwoHopToggle"
                    />
                    <span>Allow two-hop</span>
                </label>

                <hr class="wkb-expand-divider" aria-hidden="true" />

                <label class="wkb-expand-type-field">
                    <span class="wkb-expand-label">Expand with</span>
                    <select
                        :id="`${panelId}-expand-filter-type`"
                        class="wkb-expand-type-select"
                        :value="expandFilterType"
                        :disabled="loading"
                        @change="onExpandFilterTypeChange"
                    >
                        <option
                            v-for="option in expandFilterTypeOptions"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
                    </select>
                </label>

                <div
                    v-show="expandFilterType === 'intent'"
                    class="wkb-expand-option wkb-expand-intent"
                >
                    <div class="wkb-expand-option-head">
                        <label class="wkb-expand-label" for="wkb-expand-intent">Intent</label>
                        <span
                            class="wkb-expand-ai-badge"
                            title="Uses LLM or semantic classification"
                            >AI</span
                        >
                    </div>
                    <small class="wkb-expand-hint">
                        Optional focus for relevance when ranking new connections.
                    </small>
                    <textarea
                        id="wkb-expand-intent"
                        class="wkb-expand-textarea"
                        rows="2"
                        :value="filters.intent || ''"
                        :disabled="loading"
                        placeholder="e.g. mechanisms linked to insulin resistance"
                        @input="onIntentInput"
                    />
                    <label class="wkb-expand-intent-suboption">
                        <input
                            type="checkbox"
                            :checked="filters.relevanceMode === 'semantic'"
                            :disabled="loading || !intentHasText"
                            @change="onSemanticToggle"
                        />
                        <span>Rank with semantic similarity</span>
                    </label>
                    <p
                        v-if="intentHasText && filters.relevanceMode === 'semantic'"
                        class="wkb-expand-hint wkb-expand-intent-helper"
                    >
                        Prefer neighbors whose descriptions match your intent (embedding-based),
                        combined with session context, instead of LLM relevance labels.
                    </p>
                    <p
                        v-else-if="intentHasText"
                        class="wkb-expand-hint wkb-expand-intent-helper"
                    >
                        Neighbors are ranked by LLM relevance to your intent and session context.
                    </p>
                </div>

                <fieldset
                    v-show="expandFilterType === 'novelty'"
                    class="wkb-expand-option wkb-expand-novelty"
                    :disabled="loading"
                >
                    <div class="wkb-expand-option-head">
                        <legend class="wkb-expand-novelty-legend">Known / Novel</legend>
                        <span class="wkb-expand-ai-badge" title="Uses LLM classification">AI</span>
                    </div>
                    <p class="wkb-expand-novelty-intro">
                        Only add nodes classified as known or novel when expanding.
                    </p>
                    <div class="wkb-expand-novelty-options">
                        <label class="wkb-expand-novelty-option">
                            <input
                                type="checkbox"
                                :checked="Boolean(filters.noveltyKnown)"
                                @change="$emit('toggle-novelty', 'known')"
                            />
                            <span>Known</span>
                        </label>
                        <label class="wkb-expand-novelty-option">
                            <input
                                type="checkbox"
                                :checked="Boolean(filters.noveltyNovel)"
                                @change="$emit('toggle-novelty', 'novel')"
                            />
                            <span>Novel</span>
                        </label>
                    </div>
                </fieldset>

                <section
                    v-show="expandFilterType === 'expression'"
                    class="wkb-expand-option wkb-expand-expression"
                >
                    <h4 class="wkb-expand-subsection-title">Gene expression filter</h4>
                    <WorkspaceExpressionFilterControls
                        :filters="filters"
                        :options="expressionOptions"
                        compact
                        use-select-dropdowns
                        @change="$emit('patch-filters', $event)"
                    />
                </section>
            </section>

            <section
                v-show="activeTab === 'manual'"
                :id="tabPanelId('manual')"
                class="wkb-expand-tab-panel wkb-expand-add-nodes"
                role="tabpanel"
                :aria-labelledby="tabButtonId('manual')"
            >
                <div class="wkb-add-nodes-accordions">
                    <div
                        class="wkb-add-nodes-accordion"
                        :class="{ 'is-open': addNodesAccordion === 'intent' }"
                    >
                        <button
                            type="button"
                            class="wkb-add-nodes-accordion-trigger"
                            :aria-expanded="addNodesAccordion === 'intent' ? 'true' : 'false'"
                            :aria-controls="addNodesAccordionPanelId('intent')"
                            :disabled="loading || manualAddBusy"
                            @click="toggleAddNodesAccordion('intent')"
                        >
                            <span>Add nodes with research intention</span>
                            <span class="wkb-add-nodes-accordion-chevron" aria-hidden="true" />
                        </button>
                        <div
                            v-show="addNodesAccordion === 'intent'"
                            :id="addNodesAccordionPanelId('intent')"
                            class="wkb-add-nodes-accordion-panel"
                            role="region"
                            :aria-label="'Add nodes with research intention'"
                        >
                            <WorkspaceExpandIntentAdd
                                :llm-available="llmAvailable"
                                :busy="intentAddBusy || manualAddBusy"
                                :status-message="intentAddStatus"
                                :last-explanation="intentAddExplanation"
                                @run="$emit('intent-add-nodes', $event)"
                            />
                        </div>
                    </div>

                    <div
                        class="wkb-add-nodes-accordion"
                        :class="{ 'is-open': addNodesAccordion === 'search' }"
                    >
                        <button
                            type="button"
                            class="wkb-add-nodes-accordion-trigger"
                            :aria-expanded="addNodesAccordion === 'search' ? 'true' : 'false'"
                            :aria-controls="addNodesAccordionPanelId('search')"
                            :disabled="loading || manualAddBusy"
                            @click="toggleAddNodesAccordion('search')"
                        >
                            <span>Add nodes with search</span>
                            <span class="wkb-add-nodes-accordion-chevron" aria-hidden="true" />
                        </button>
                        <div
                            v-show="addNodesAccordion === 'search'"
                            :id="addNodesAccordionPanelId('search')"
                            class="wkb-add-nodes-accordion-panel"
                            role="region"
                            :aria-label="'Add nodes with search'"
                        >
                            <WorkspaceExpandManualAdd
                                :api-client="apiClient"
                                :llm-available="llmAvailable"
                                :busy="manualAddBusy"
                                @add="$emit('add-manual-node', $event)"
                                @error="$emit('manual-add-error', $event)"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section
                v-show="activeTab === 'history'"
                :id="tabPanelId('history')"
                class="wkb-expand-tab-panel"
                role="tabpanel"
                :aria-labelledby="tabButtonId('history')"
            >
                <WorkspaceExpandHistoryPanel
                    :entries="expansionHistoryEntries"
                    :loading="loading"
                    @remove-entry="$emit('remove-history-entry', $event)"
                />
            </section>
        </div>

        <div v-if="activeTab === 'discover'" class="wkb-expand-actions">
            <button
                type="button"
                class="wkb-expand-btn wkb-expand-btn-primary"
                :disabled="loading || (!llmAvailable && expandNeedsLlm)"
                @click="$emit('expand')"
            >
                Expand graph
            </button>
        </div>
    </aside>
</template>

<script>
import WorkspaceExpressionFilterControls from "./WorkspaceExpressionFilterControls.vue";
import WorkspaceExpandIntentAdd from "./WorkspaceExpandIntentAdd.vue";
import WorkspaceExpandManualAdd from "./WorkspaceExpandManualAdd.vue";
import WorkspaceExpandHistoryPanel from "./WorkspaceExpandHistoryPanel.vue";
import {
    EXPAND_TARGET_TYPE_OPTIONS,
    MATCH_REDUCER_HELP,
    MATCH_REQUIREMENT_OPTIONS,
} from "./revealKgGraphFilterUtils.js";
import {
    CANVAS_EXPAND_MAX_NEIGHBORS,
    REVEAL_WORKFLOW_TITLE,
    REVEAL_WORKFLOW_URL,
} from "./revealKgBulkWorkflowGuidance.js";

let expandPanelIdCounter = 0;

const EXPAND_FILTER_TYPE_OPTIONS = [
    { value: "intent", label: "Intent" },
    { value: "novelty", label: "Known / Novel" },
    { value: "expression", label: "Expression" },
];

export default {
    name: "WorkspaceExpandGraphPanel",
    components: {
        WorkspaceExpressionFilterControls,
        WorkspaceExpandIntentAdd,
        WorkspaceExpandManualAdd,
        WorkspaceExpandHistoryPanel,
    },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        manualAddBusy: {
            type: Boolean,
            default: false,
        },
        intentAddBusy: {
            type: Boolean,
            default: false,
        },
        intentAddStatus: {
            type: String,
            default: "",
        },
        intentAddExplanation: {
            type: String,
            default: "",
        },
        filters: {
            type: Object,
            required: true,
        },
        controls: {
            type: Object,
            required: true,
        },
        expandSeedSummary: {
            type: String,
            default: "",
        },
        expandSeedLabel: {
            type: String,
            default: "Selected nodes",
        },
        expandFromSingleNode: {
            type: Boolean,
            default: false,
        },
        expandFromEdge: {
            type: Boolean,
            default: false,
        },
        expansionHistoryEntries: {
            type: Array,
            default: () => [],
        },
        availableTargetTypes: {
            type: Array,
            default: () => [],
        },
        expressionOptions: {
            type: Object,
            default: () => ({}),
        },
        apiClient: {
            type: Object,
            default: null,
        },
        llmAvailable: {
            type: Boolean,
            default: true,
        },
        expandNeedsLlm: {
            type: Boolean,
            default: false,
        },
        initialTab: {
            type: String,
            default: "",
        },
    },
    data() {
        expandPanelIdCounter += 1;
        return {
            panelId: `wkb-expand-panel-${expandPanelIdCounter}`,
            expandFilterType: "intent",
            activeTab: "discover",
            addNodesAccordion: null,
            showBulkWorkflowHint: false,
        };
    },
    computed: {
        expandMaxNeighbors() {
            return CANVAS_EXPAND_MAX_NEIGHBORS;
        },
        workflowUrl() {
            return REVEAL_WORKFLOW_URL;
        },
        workflowTitle() {
            return REVEAL_WORKFLOW_TITLE;
        },
        expandFilterTypeOptions() {
            return EXPAND_FILTER_TYPE_OPTIONS;
        },
        matchRequirementOptions() {
            return MATCH_REQUIREMENT_OPTIONS;
        },
        matchReducerHelp() {
            return MATCH_REDUCER_HELP;
        },
        targetTypeOptions() {
            return EXPAND_TARGET_TYPE_OPTIONS;
        },
        intentHasText() {
            return Boolean(String(this.filters?.intent || "").trim());
        },
        expansionHistoryCount() {
            return (this.expansionHistoryEntries || []).length;
        },
    },
    watch: {
        open(isOpen) {
            if (!isOpen) {
                this.addNodesAccordion = null;
                return;
            }
            const tab = String(this.initialTab || "").trim();
            if (tab === "manual" || tab === "discover" || tab === "history") {
                this.activeTab = tab;
            } else {
                this.activeTab = "discover";
            }
            if (this.activeTab === "manual") {
                this.addNodesAccordion = null;
            }
        },
        activeTab(tab) {
            if (tab === "manual") {
                this.addNodesAccordion = null;
            }
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        tabButtonId(name) {
            return `${this.panelId}-tab-${name}`;
        },
        tabPanelId(name) {
            return `${this.panelId}-panel-${name}`;
        },
        addNodesAccordionPanelId(name) {
            return `${this.panelId}-add-nodes-${name}`;
        },
        toggleAddNodesAccordion(section) {
            this.addNodesAccordion = this.addNodesAccordion === section ? null : section;
        },
        isTargetTypeDisabled(value) {
            if (value === "all") {
                return false;
            }
            return !this.availableTargetTypes.includes(value);
        },
        onKeyDown(event) {
            if (this.open && !this.loading && !this.manualAddBusy && event.key === "Escape") {
                this.$emit("close");
            }
        },
        onExpandFilterTypeChange(event) {
            this.expandFilterType = event.target.value;
        },
        onIntentInput(event) {
            const intent = event.target.value;
            const trimmed = intent.trim();
            const patch = {
                intent,
                relevanceEnabled: Boolean(trimmed),
            };
            if (!trimmed) {
                patch.relevanceMode = "llm";
            }
            this.$emit("patch-filters", patch);
        },
        onSemanticToggle(event) {
            this.$emit("patch-filters", {
                relevanceMode: event.target.checked ? "semantic" : "llm",
            });
        },
        onReducerChange(event) {
            this.$emit("patch-controls", { reducer: event.target.value });
        },
        onLimitChange(event) {
            const limit = Number(event.target.value) || 15;
            if (limit > CANVAS_EXPAND_MAX_NEIGHBORS) {
                this.showBulkWorkflowHint = true;
            }
            this.$emit("patch-controls", {
                limit: Math.min(CANVAS_EXPAND_MAX_NEIGHBORS, Math.max(1, limit)),
            });
        },
        onTargetTypeChange(event) {
            this.$emit("patch-controls", { targetType: event.target.value });
        },
        onTwoHopToggle(event) {
            this.$emit("patch-controls", {
                connectionScope: event.target.checked ? "expanded" : "direct",
            });
        },
    },
};
</script>

<style scoped>
.wkb-expand-popup {
    position: absolute;
    top: var(--wkb-side-panel-top, 56px);
    right: 12px;
    bottom: 12px;
    z-index: 25;
    display: flex;
    flex-direction: column;
    width: min(380px, calc(100% - 24px));
    max-width: 420px;
    overflow: hidden;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 8px 32px rgba(20, 22, 30, 0.16);
    pointer-events: auto;
}

.wkb-expand-head {
    flex-shrink: 0;
    padding: 16px 18px 12px;
}

.wkb-expand-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.wkb-expand-head-row h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
    line-height: 1.35;
}

.wkb-expand-close {
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
}

.wkb-expand-close:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-expand-intro,
.wkb-expand-anchors {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-anchors strong {
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-tabrow {
    flex-shrink: 0;
    padding: 0.4rem 18px 0;
    background: #e8e3da;
    border-top: 1px solid #d4cdc2;
}

.wkb-expand-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.15rem;
}

.wkb-expand-tab {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 -1px;
    padding: 0.5rem 0.85rem 0.6rem;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 10px 10px 0 0;
    background: transparent;
    color: #5a5248;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
    cursor: pointer;
    appearance: none;
}

.wkb-expand-tab:not(.is-active):hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.45);
}

.wkb-expand-tab.is-active {
    background: #fff;
    color: var(--cfde-ink, #33363d);
    font-weight: 700;
    border-color: #d4cdc2;
    border-bottom: 1px solid #fff;
    z-index: 1;
}

.wkb-expand-tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--cfde-blue, #2c5c97);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
}

.wkb-expand-tab:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-expand-body {
    flex: 1;
    overflow: auto;
    padding: 14px 18px 16px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.wkb-expand-tab-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.wkb-expand-add-nodes {
    gap: 10px;
}

.wkb-add-nodes-accordions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.wkb-add-nodes-accordion {
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 10px;
    background: #faf9f7;
    overflow: hidden;
}

.wkb-add-nodes-accordion-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    border: none;
    background: transparent;
    color: var(--cfde-ink, #33363d);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    text-align: left;
    cursor: pointer;
}

.wkb-add-nodes-accordion-trigger:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-add-nodes-accordion-trigger:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.65);
}

.wkb-add-nodes-accordion.is-open .wkb-add-nodes-accordion-trigger {
    background: #ffffff;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-add-nodes-accordion-chevron {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-right: 2px solid var(--cfde-muted, #6b6b6b);
    border-bottom: 2px solid var(--cfde-muted, #6b6b6b);
    transform: rotate(-45deg);
    transition: transform 0.15s ease;
}

.wkb-add-nodes-accordion.is-open .wkb-add-nodes-accordion-chevron {
    transform: rotate(45deg);
    margin-top: -4px;
}

.wkb-add-nodes-accordion-panel {
    padding: 12px 14px 14px;
    background: #ffffff;
}

.wkb-expand-llm-note {
    margin: 0;
    padding: 10px 12px;
    border-radius: 8px;
    background: #fff8ef;
    color: #7a4b12;
    font-size: 13px;
    line-height: 1.45;
}

.wkb-expand-type-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.wkb-expand-type-select,
.wkb-expand-select,
.wkb-expand-input {
    width: 100%;
    padding: 8px 28px 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    background-color: #ffffff;
}

.wkb-expand-type-select,
.wkb-expand-select {
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2333363d' d='M1.5 1.5 6 6l4.5-4.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 10px 6px;
    cursor: pointer;
}

.wkb-expand-input {
    padding-right: 10px;
}

.wkb-expand-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-hint {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
    line-height: 1.45;
}

.wkb-expand-workflow-hint {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-workflow-link {
    color: var(--cfde-blue, #2c5c97);
    font-weight: 600;
    text-decoration: none;
}

.wkb-expand-workflow-link:hover {
    text-decoration: underline;
}

.wkb-expand-option-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.wkb-expand-ai-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 20px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid #c4b5fd;
    background: #f3efff;
    color: #6d28d9;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
}

.wkb-expand-textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
    font-family: inherit;
    resize: vertical;
}

.wkb-expand-intent-suboption {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    font-size: 13px;
    cursor: pointer;
}

.wkb-expand-intent-helper {
    margin-top: 6px;
}

.wkb-expand-novelty {
    padding: 0;
    border: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-expand-novelty-legend {
    padding: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-novelty-intro {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-novelty-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.wkb-expand-novelty-option {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
}

.wkb-expand-subsection-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-divider {
    border: none;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
    margin: 0;
}

.wkb-expand-controls-row {
    display: grid;
    grid-template-columns: 1fr 88px;
    gap: 12px;
}

.wkb-expand-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.wkb-expand-hop-option {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    cursor: pointer;
}

.wkb-expand-actions {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 18px 16px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-expand-btn {
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
}

.wkb-expand-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-expand-btn-primary {
    background: var(--cfde-orange, #e07b39);
    color: #ffffff;
}
</style>
