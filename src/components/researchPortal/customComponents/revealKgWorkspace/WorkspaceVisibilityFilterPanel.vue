<template>
    <aside
        v-if="open"
        class="wkb-filter-popup"
        :style="aiAssistantOpen ? { right: 'calc(12px + min(380px, calc(100% - 24px)) + 8px)' } : {}"
        role="dialog"
        aria-modal="false"
        aria-labelledby="wkb-filter-title"
        @click.stop
        @mousedown.stop
    >
        <header class="wkb-filter-head">
            <div class="wkb-filter-head-row">
                <h2 id="wkb-filter-title">Build a visibility filter</h2>
                <button
                    type="button"
                    class="wkb-filter-close"
                    aria-label="Close"
                    :disabled="loading"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </div>
            <p class="wkb-filter-intro">
                Build filters annotate nodes on the graph. Toggle filters on or off to change what
                is visible without rebuilding.
            </p>
        </header>

        <div class="wkb-filter-tabrow">
            <div
                class="wkb-filter-tabs"
                role="tablist"
                aria-label="Filter panel sections"
            >
                <button
                    :id="tabButtonId('filters')"
                    type="button"
                    role="tab"
                    class="wkb-filter-tab"
                    :class="{ 'is-active': activeTab === 'filters' }"
                    :aria-selected="activeTab === 'filters' ? 'true' : 'false'"
                    :aria-controls="tabPanelId('filters')"
                    @click="activeTab = 'filters'"
                >
                    Filters
                    <span v-if="savedFilters.length" class="wkb-filter-tab-count">{{
                        savedFilters.length
                    }}</span>
                </button>
                <button
                    :id="tabButtonId('create')"
                    type="button"
                    role="tab"
                    class="wkb-filter-tab"
                    :class="{ 'is-active': activeTab === 'create' }"
                    :aria-selected="activeTab === 'create' ? 'true' : 'false'"
                    :aria-controls="tabPanelId('create')"
                    @click="activeTab = 'create'"
                >
                    Create filters
                </button>
            </div>
        </div>

        <div class="wkb-filter-body">
            <section
                v-show="activeTab === 'filters'"
                :id="tabPanelId('filters')"
                class="wkb-filter-tab-panel"
                role="tabpanel"
                :aria-labelledby="tabButtonId('filters')"
            >
                <p v-if="!savedFilters.length" class="wkb-filter-saved-empty">
                    No filters yet. Switch to Create filters to configure and build one.
                </p>
                <ul v-else class="wkb-filter-saved-list" aria-label="Saved filters">
                    <li
                        v-for="(filter, index) in savedFilters"
                        :key="filter.id"
                        class="wkb-filter-saved-item"
                    >
                        <div
                            class="wkb-filter-bubble"
                            :class="{ 'is-disabled': filter.enabled === false }"
                        >
                            <button
                                type="button"
                                class="wkb-filter-bubble-toggle"
                                :aria-pressed="filter.enabled !== false ? 'true' : 'false'"
                                :title="
                                    filter.enabled !== false
                                        ? 'Disable filter visibility'
                                        : 'Enable filter visibility'
                                "
                                @click="$emit('toggle-filter', filter.id)"
                            >
                                <span class="wkb-filter-bubble-index">{{ index + 1 }}</span>
                                <span class="wkb-filter-bubble-label">{{ filter.name }}</span>
                            </button>
                            <button
                                type="button"
                                class="wkb-filter-bubble-remove"
                                aria-label="Remove filter"
                                @click="$emit('remove-filter', filter.id)"
                            >
                                &times;
                            </button>
                        </div>
                        <hr
                            v-if="index < savedFilters.length - 1"
                            class="wkb-filter-divider"
                            aria-hidden="true"
                        />
                    </li>
                </ul>

                <div v-if="savedFilters.length" class="wkb-filter-saved-meta">
                    {{ visibleNodeCount }} of {{ nodeCount }} nodes visible on canvas.
                </div>

                <div v-if="invisibleNodeCount > 0" class="wkb-filter-remove-invisible">
                    <hr class="wkb-filter-divider" aria-hidden="true" />
                    <p class="wkb-filter-remove-invisible-note">
                        {{ invisibleNodeCount }} node{{ invisibleNodeCount === 1 ? "" : "s" }}
                        {{ invisibleNodeCount === 1 ? "is" : "are" }} currently hidden by active
                        filters.
                    </p>
                    <button
                        v-if="!confirmRemoveInvisible"
                        type="button"
                        class="wkb-filter-btn wkb-filter-btn-danger-outline"
                        :disabled="loading || removeInvisibleDisabled"
                        @click="confirmRemoveInvisible = true"
                    >
                        Remove invisible nodes from graph
                    </button>
                    <div v-else class="wkb-filter-remove-invisible-confirm">
                        <p>Permanently remove {{ invisibleNodeCount }} hidden node(s)?</p>
                        <div class="wkb-filter-remove-invisible-actions">
                            <button
                                type="button"
                                class="wkb-filter-btn wkb-filter-btn-secondary"
                                :disabled="loading"
                                @click="confirmRemoveInvisible = false"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                class="wkb-filter-btn wkb-filter-btn-danger"
                                :disabled="loading"
                                @click="onConfirmRemoveInvisible"
                            >
                                Remove permanently
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section
                v-show="activeTab === 'create'"
                :id="tabPanelId('create')"
                class="wkb-filter-tab-panel wkb-filter-builder"
                role="tabpanel"
                :aria-labelledby="tabButtonId('create')"
            >
                <p v-if="!nodeCount" class="wkb-filter-empty">
                    Build a graph before creating filters.
                </p>

                <template v-else>
                    <p v-if="loading && progressLabel" class="wkb-filter-progress" role="status">
                        <span class="wkb-filter-spinner" aria-hidden="true" />
                        {{ progressLabel }}
                    </p>

                    <p v-if="!llmAvailable && filterNeedsLlm" class="wkb-filter-llm-note" role="note">
                        LLM filtering is not available — the interactive API did not report an LLM
                        backend.
                    </p>

                    <label class="wkb-filter-type-field">
                        <span class="wkb-filter-label">Filter type</span>
                        <select
                            :id="`${panelId}-create-filter-type`"
                            class="wkb-filter-type-select"
                            :value="createFilterType"
                            :disabled="loading"
                            @change="onCreateFilterTypeChange"
                        >
                            <option
                                v-for="option in createFilterTypeOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </label>

                    <div v-show="createFilterType === 'intent'" class="wkb-filter-option wkb-filter-intent">
                        <div class="wkb-filter-option-head">
                            <label class="wkb-filter-label" for="wkb-filter-intent">Intent</label>
                            <span class="wkb-filter-ai-badge" title="Uses LLM or semantic classification"
                                >AI</span
                            >
                        </div>
                        <small class="wkb-filter-hint">
                            Describe what should stay on the graph. When you build, nodes that match
                            this intent remain visible; others are hidden.
                        </small>
                        <textarea
                            id="wkb-filter-intent"
                            class="wkb-filter-textarea"
                            rows="2"
                            :value="filters.intent || ''"
                            :disabled="loading"
                            placeholder="e.g. genes and mechanisms linked to insulin resistance"
                            @input="onIntentInput"
                        />
                        <label class="wkb-filter-intent-suboption">
                            <input
                                type="checkbox"
                                :checked="filters.relevanceMode === 'semantic'"
                                :disabled="loading || !intentHasText"
                                @change="onSemanticToggle"
                            />
                            <span>Semantic similarity</span>
                        </label>
                        <p
                            v-if="intentHasText && filters.relevanceMode === 'semantic'"
                            class="wkb-filter-helper wkb-filter-intent-helper"
                        >
                            Matching uses semantic similarity to your intent, combined with the session
                            context.
                        </p>
                        <p
                            v-else-if="intentHasText"
                            class="wkb-filter-helper wkb-filter-intent-helper"
                        >
                            Matching uses LLM relevance to your intent, combined with the session context.
                        </p>
                    </div>

                    <fieldset
                        v-show="createFilterType === 'novelty'"
                        class="wkb-filter-option wkb-filter-novelty"
                        :disabled="loading"
                    >
                        <div class="wkb-filter-option-head">
                            <legend class="wkb-filter-novelty-legend">Known / Novel</legend>
                            <span class="wkb-filter-ai-badge" title="Uses LLM classification">AI</span>
                        </div>
                        <p class="wkb-filter-novelty-intro">
                            Annotate nodes by novelty labels from candidate classification.
                        </p>
                        <div class="wkb-filter-novelty-options">
                            <label class="wkb-filter-novelty-option">
                                <input
                                    type="checkbox"
                                    :checked="Boolean(filters.noveltyKnown)"
                                    @change="$emit('toggle-novelty', 'known')"
                                />
                                <span>Known</span>
                            </label>
                            <label class="wkb-filter-novelty-option">
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
                        v-show="createFilterType === 'expression'"
                        class="wkb-filter-option wkb-filter-expression"
                    >
                        <h4 class="wkb-filter-subsection-title">Gene expression filter</h4>
                        <WorkspaceExpressionFilterControls
                            :filters="filters"
                            :options="expressionOptions"
                            compact
                            use-select-dropdowns
                            @change="$emit('patch-filters', $event)"
                        />
                    </section>
                </template>
            </section>
        </div>

        <div v-if="activeTab === 'create' && nodeCount" class="wkb-filter-actions">
            <button
                type="button"
                class="wkb-filter-btn wkb-filter-btn-secondary"
                :disabled="loading || !canClearDraft"
                @click="$emit('clear-draft')"
            >
                Clear form
            </button>
            <button
                type="button"
                class="wkb-filter-btn wkb-filter-btn-primary"
                :disabled="loading || !canBuild || (!llmAvailable && filterNeedsLlm)"
                @click="$emit('build')"
            >
                Build filter
            </button>
        </div>
    </aside>
</template>

<script>
import WorkspaceExpressionFilterControls from "./WorkspaceExpressionFilterControls.vue";

let filterPanelIdCounter = 0;

const CREATE_FILTER_TYPE_OPTIONS = [
    { value: "intent", label: "Intent" },
    { value: "novelty", label: "Known / Novel" },
    { value: "expression", label: "Expression" },
];

export default {
    name: "WorkspaceVisibilityFilterPanel",
    components: {
        WorkspaceExpressionFilterControls,
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
        progressLabel: {
            type: String,
            default: "",
        },
        filters: {
            type: Object,
            required: true,
        },
        savedFilters: {
            type: Array,
            default: () => [],
        },
        expressionOptions: {
            type: Object,
            default: null,
        },
        llmAvailable: {
            type: Boolean,
            default: false,
        },
        filterNeedsLlm: {
            type: Boolean,
            default: false,
        },
        canClearDraft: {
            type: Boolean,
            default: false,
        },
        canBuild: {
            type: Boolean,
            default: false,
        },
        nodeCount: {
            type: Number,
            default: 0,
        },
        visibleNodeCount: {
            type: Number,
            default: 0,
        },
        invisibleNodeCount: {
            type: Number,
            default: 0,
        },
        removeInvisibleDisabled: {
            type: Boolean,
            default: false,
        },
        aiAssistantOpen: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        filterPanelIdCounter += 1;
        return {
            panelId: `wkb-filter-panel-${filterPanelIdCounter}`,
            activeTab: "filters",
            createFilterType: "intent",
            confirmRemoveInvisible: false,
        };
    },
    watch: {
        open(isOpen) {
            if (!isOpen) {
                this.confirmRemoveInvisible = false;
                return;
            }
            this.activeTab = this.savedFilters.length ? "filters" : "create";
        },
        invisibleNodeCount(count) {
            if (count < 1) {
                this.confirmRemoveInvisible = false;
            }
        },
        savedFilters(newFilters, oldFilters) {
            if ((newFilters?.length || 0) > (oldFilters?.length || 0)) {
                this.activeTab = "filters";
            }
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    computed: {
        createFilterTypeOptions() {
            return CREATE_FILTER_TYPE_OPTIONS;
        },
        intentHasText() {
            return Boolean(String(this.filters?.intent || "").trim());
        },
    },
    methods: {
        tabButtonId(tab) {
            return `${this.panelId}-tab-${tab}`;
        },
        tabPanelId(tab) {
            return `${this.panelId}-panel-${tab}`;
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
        onCreateFilterTypeChange(event) {
            this.createFilterType = event.target.value;
        },
        onConfirmRemoveInvisible() {
            this.confirmRemoveInvisible = false;
            this.$emit("remove-invisible-nodes");
        },
        onKeyDown(event) {
            if (this.open && !this.loading && event.key === "Escape") {
                this.$emit("close");
            }
        },
    },
};
</script>

<style scoped>
.wkb-filter-popup {
    position: absolute;
    top: var(--wkb-side-panel-top, 56px);
    right: 12px;
    bottom: 12px;
    z-index: 10;
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

.wkb-filter-head {
    flex-shrink: 0;
    padding: 16px 18px 12px;
}

.wkb-filter-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.wkb-filter-head-row h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
    line-height: 1.35;
}

.wkb-filter-close {
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
}

.wkb-filter-close:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-filter-intro {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-filter-tabrow {
    flex-shrink: 0;
    padding: 0.4rem 18px 0;
    background: #e8e3da;
    border-top: 1px solid #d4cdc2;
}

.wkb-filter-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.15rem;
}

.wkb-filter-tab {
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

.wkb-filter-tab:not(.is-active):hover {
    background: rgba(255, 255, 255, 0.45);
}

.wkb-filter-tab.is-active {
    background: #fff;
    color: var(--cfde-ink, #33363d);
    font-weight: 700;
    border-color: #d4cdc2;
    border-bottom: 1px solid #fff;
    z-index: 1;
}

.wkb-filter-tab:focus-visible {
    outline: 2px solid var(--cfde-blue, #2c5c97);
    outline-offset: 2px;
}

.wkb-filter-tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
}

.wkb-filter-body {
    flex: 1;
    overflow: auto;
    padding: 14px 18px 16px;
    background: #fff;
}

.wkb-filter-tab-panel {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.wkb-filter-divider {
    border: none;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
    margin: 14px 0;
}

.wkb-filter-option {
    margin: 0;
}

.wkb-filter-option-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.wkb-filter-ai-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
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
    line-height: 1;
}

.wkb-filter-subsection-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-filter-saved-empty {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-filter-saved-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.wkb-filter-saved-item {
    margin: 0;
}

.wkb-filter-bubble {
    display: flex;
    align-items: stretch;
    width: 100%;
    border: 1px solid var(--cfde-blue, #2c5c97);
    border-radius: 999px;
    background: #e8f0fa;
    overflow: hidden;
}

.wkb-filter-bubble.is-disabled {
    opacity: 0.55;
    border-color: var(--cfde-border, #e6e1d6);
    background: var(--cfde-bg, #f6f5f2);
}

.wkb-filter-bubble-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    padding: 6px 8px 6px 6px;
    border: none;
    background: transparent;
    color: var(--cfde-blue, #2c5c97);
    font-size: 12px;
    line-height: 1.3;
    cursor: pointer;
    text-align: left;
}

.wkb-filter-bubble.is-disabled .wkb-filter-bubble-toggle {
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-filter-bubble-index {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
}

.wkb-filter-bubble.is-disabled .wkb-filter-bubble-index {
    background: var(--cfde-muted, #6b6b6b);
}

.wkb-filter-bubble-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wkb-filter-bubble-remove {
    flex-shrink: 0;
    width: 28px;
    border: none;
    border-left: 1px solid rgba(44, 92, 151, 0.2);
    background: transparent;
    color: var(--cfde-blue, #2c5c97);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
}

.wkb-filter-bubble.is-disabled .wkb-filter-bubble-remove {
    border-left-color: var(--cfde-border, #e6e1d6);
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-filter-saved-meta {
    margin-top: 12px;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-filter-remove-invisible {
    margin-top: 0;
}

.wkb-filter-remove-invisible-note {
    margin: 0 0 8px;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-filter-remove-invisible-confirm p {
    margin: 0 0 8px;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-filter-remove-invisible-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.wkb-filter-builder {
    gap: 14px;
}

.wkb-filter-type-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 2px;
}

.wkb-filter-type-select {
    width: 100%;
    padding: 8px 28px 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    background-color: #ffffff;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2333363d' d='M1.5 1.5 6 6l4.5-4.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 10px 6px;
    cursor: pointer;
}

.wkb-filter-type-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--cfde-bg, #f6f5f2);
}

.wkb-filter-empty,
.wkb-filter-helper,
.wkb-filter-llm-note {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.45;
}

.wkb-filter-llm-note {
    padding: 10px 12px;
    border-radius: 8px;
    background: #fff8ef;
    color: #7a4b12;
}

.wkb-filter-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-filter-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid #ddd;
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    animation: wkb-filter-spin 0.8s linear infinite;
    flex-shrink: 0;
}

@keyframes wkb-filter-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-filter-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-filter-hint {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-filter-textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
    font-family: inherit;
    resize: vertical;
}

.wkb-filter-intent {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-filter-intent-suboption {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 13px;
    cursor: pointer;
}

.wkb-filter-intent-suboption input:disabled + span {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-filter-intent-helper {
    margin: 0;
}

.wkb-filter-novelty {
    padding: 0;
    border: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-filter-novelty-legend {
    padding: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-filter-novelty-intro {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-filter-novelty-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.wkb-filter-novelty-option {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
}

.wkb-filter-actions {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 18px 16px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-filter-btn {
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
}

.wkb-filter-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-filter-btn-primary {
    background: var(--cfde-orange, #e07b39);
    border-color: var(--cfde-orange, #e07b39);
    color: #ffffff;
}

.wkb-filter-btn-secondary {
    background: #ffffff;
    border-color: var(--cfde-border, #e6e1d6);
    color: var(--cfde-ink, #33363d);
}

.wkb-filter-btn-danger-outline {
    width: 100%;
    background: #ffffff;
    border-color: #d97757;
    color: #b45309;
}

.wkb-filter-btn-danger {
    background: #c45c3a;
    border-color: #c45c3a;
    color: #ffffff;
}
</style>
