<template>
    <div class="wkb-entity-column">
        <div class="wkb-entity-column-head">
            <h4>{{ title }}</h4>
            <button
                type="button"
                class="wkb-entity-add-link"
                :aria-label="addModalTitle"
                @click="openAddModal"
            >
                Add +
            </button>
        </div>

        <div v-if="items.length" class="wkb-entity-chips">
            <div
                v-for="item in items"
                :key="item.node_id"
                class="wkb-entity-chip"
            >
                <div class="wkb-entity-chip-text">
                    <strong>{{ displayLabel(item) }}</strong>
                    <span
                        v-if="showChipSubtitle(item)"
                        class="wkb-entity-chip-sub"
                    >
                        {{ item.subtitle }}
                    </span>
                </div>
                <button
                    type="button"
                    class="wkb-entity-chip-remove"
                    :aria-label="`Remove ${item.label}`"
                    @click="$emit('remove', item.node_id)"
                >
                    &times;
                </button>
            </div>
        </div>
        <p v-else class="wkb-entity-empty">
            No {{ title.toLowerCase() }} selected yet.
        </p>

        <div
            v-if="addModalOpen"
            class="wkb-entity-add-backdrop"
            role="presentation"
        >
            <div
                class="wkb-entity-add-modal"
                role="dialog"
                aria-modal="true"
                :aria-labelledby="`wkb-entity-add-title-${columnKey}`"
                @click.stop
            >
                <button
                    type="button"
                    class="wkb-entity-add-close"
                    aria-label="Close"
                    @click="closeAddModal"
                >
                    &times;
                </button>
                <h3 :id="`wkb-entity-add-title-${columnKey}`">{{ addModalTitle }}</h3>

                <div class="wkb-entity-add-search">
                    <div class="wkb-entity-add-search-field">
                        <input
                            ref="searchInput"
                            v-model="autocompleteQuery"
                            type="text"
                            class="wkb-entity-add-input"
                            :placeholder="searchPlaceholder"
                            :aria-label="searchPlaceholder"
                        />
                        <button
                            v-if="autocompleteQuery"
                            type="button"
                            class="wkb-entity-search-clear"
                            aria-label="Clear search"
                            @click="clearSearchInput"
                        >
                            <span class="wkb-entity-search-clear-glyph" aria-hidden="true">×</span>
                        </button>
                    </div>
                    <p v-if="autocompleteLoading" class="wkb-entity-add-status">
                        Searching…
                    </p>
                    <transition name="wkb-entity-added-fade">
                        <p
                            v-if="selectedFeedbackVisible"
                            class="wkb-entity-added-note"
                            role="status"
                        >
                            {{ selectedFeedbackMessage }}
                        </p>
                    </transition>
                    <button
                        v-if="conceptualSearchEnabled"
                        type="button"
                        class="wkb-entity-conceptual-link"
                        :disabled="semanticLoading || !autocompleteQuery.trim()"
                        @click="runSemanticMatch"
                    >
                        {{
                            semanticLoading
                                ? "Finding conceptual matches…"
                                : "+ Add conceptual matches"
                        }}
                    </button>
                </div>

                <template v-if="!showConceptualTabs">
                    <ul v-if="autocompleteSuggestions.length" class="wkb-entity-suggestions">
                        <li
                            v-for="(item, index) in autocompleteSuggestions"
                            :key="entityKey(item) || `catalog-${index}`"
                        >
                            <button
                                type="button"
                                class="wkb-entity-suggestion"
                                @click="addItem(item)"
                            >
                                <strong>{{ displayLabel(item) }}</strong>
                                <span v-if="subtitleFor(item)">{{ subtitleFor(item) }}</span>
                            </button>
                        </li>
                    </ul>
                </template>
                <template v-else>
                    <div class="wkb-entity-result-tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            :aria-selected="matchTab === 'catalog'"
                            :class="[
                                'wkb-entity-result-tab',
                                matchTab === 'catalog' && 'is-active',
                            ]"
                            @click="matchTab = 'catalog'"
                        >
                            From catalog
                        </button>
                        <button
                            type="button"
                            role="tab"
                            :aria-selected="matchTab === 'conceptual'"
                            :class="[
                                'wkb-entity-result-tab',
                                matchTab === 'conceptual' && 'is-active',
                            ]"
                            @click="matchTab = 'conceptual'"
                        >
                            By conceptual search
                        </button>
                    </div>
                    <ul
                        v-show="matchTab === 'catalog' && autocompleteSuggestions.length"
                        class="wkb-entity-suggestions"
                    >
                        <li
                            v-for="(item, index) in autocompleteSuggestions"
                            :key="entityKey(item) || `catalog-${index}`"
                        >
                            <button
                                type="button"
                                class="wkb-entity-suggestion"
                                @click="addItem(item)"
                            >
                                <strong>{{ displayLabel(item) }}</strong>
                                <span v-if="subtitleFor(item)">{{ subtitleFor(item) }}</span>
                            </button>
                        </li>
                    </ul>
                    <ul
                        v-show="matchTab === 'conceptual' && semanticMatches.length"
                        class="wkb-entity-suggestions"
                    >
                        <li
                            v-for="(item, index) in semanticMatches"
                            :key="entityKey(item) || `conceptual-${index}`"
                        >
                            <button
                                type="button"
                                class="wkb-entity-suggestion"
                                @click="addItem(item)"
                            >
                                <strong>{{ displayLabel(item) }}</strong>
                                <span v-if="subtitleFor(item)">{{ subtitleFor(item) }}</span>
                                <span v-if="item.rationale" class="wkb-entity-rationale">
                                    {{ item.rationale }}
                                </span>
                            </button>
                        </li>
                    </ul>
                </template>

                <p v-if="entityType !== 'gene_set' && !llmAvailable" class="wkb-entity-llm-note">
                    Conceptual search requires LLM support on the server.
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import {
    anchorChipShouldShowSubtitle,
    formatEntityDisplayLabel,
    formatEntitySearchSubtitle,
    interactiveEntityKey,
    normalizeInteractiveSemanticMatchRows,
} from "./revealKgEntityUtils.js";

export default {
    name: "WorkspaceEntityColumn",
    props: {
        columnKey: {
            type: String,
            required: true,
        },
        entityType: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        items: {
            type: Array,
            default: () => [],
        },
        apiClient: {
            type: Object,
            required: true,
        },
        llmAvailable: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            addModalOpen: false,
            autocompleteQuery: "",
            autocompleteSuggestions: [],
            autocompleteLoading: false,
            semanticMatches: [],
            semanticLoading: false,
            matchTab: "catalog",
            searchTimer: null,
            catalogRequestId: 0,
            selectedFeedbackVisible: false,
            selectedFeedbackMessage: "",
            selectedFeedbackTimer: null,
        };
    },
    computed: {
        addModalTitle() {
            if (this.entityType === "gene") {
                return "Add genes";
            }
            if (this.entityType === "gene_set") {
                return "Add gene sets";
            }
            if (this.entityType === "trait") {
                return "Add traits";
            }
            return "Add mechanisms";
        },
        searchPlaceholder() {
            if (this.entityType === "gene_set") {
                return "Search by name or describe a biology question";
            }
            return `Search ${this.title.toLowerCase()}`;
        },
        conceptualSearchEnabled() {
            return (
                this.entityType !== "gene_set" &&
                this.entityType !== "gene" &&
                this.llmAvailable
            );
        },
        showConceptualTabs() {
            return this.semanticMatches.length > 0;
        },
    },
    watch: {
        autocompleteQuery() {
            this.scheduleCatalogSearch();
        },
        addModalOpen(isOpen) {
            if (!isOpen) {
                this.clearSearchState();
            }
        },
        showConceptualTabs(hasTabs) {
            if (!hasTabs) {
                this.matchTab = "catalog";
            }
        },
    },
    beforeDestroy() {
        this.cancelCatalogSearch();
        this.clearSelectedFeedback();
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        displayLabel(item) {
            return formatEntityDisplayLabel(this.entityType, item.label);
        },
        entityKey(item) {
            return interactiveEntityKey(item);
        },
        subtitleFor(item) {
            return formatEntitySearchSubtitle(this.entityType, item);
        },
        showChipSubtitle(item) {
            return anchorChipShouldShowSubtitle(this.entityType, item.subtitle);
        },
        openAddModal() {
            this.semanticMatches = [];
            this.matchTab = "catalog";
            this.clearSelectedFeedback();
            this.addModalOpen = true;
            document.addEventListener("keydown", this.onKeyDown);
            this.$nextTick(() => {
                this.$refs.searchInput?.focus();
            });
        },
        closeAddModal() {
            this.addModalOpen = false;
            this.clearSelectedFeedback();
            document.removeEventListener("keydown", this.onKeyDown);
        },
        onKeyDown(event) {
            if (event.key === "Escape" && this.addModalOpen) {
                this.closeAddModal();
            }
        },
        clearSearchState() {
            this.clearSearchInput();
            this.clearSelectedFeedback();
        },
        clearSearchInput() {
            this.cancelCatalogSearch();
            this.autocompleteQuery = "";
            this.autocompleteSuggestions = [];
            this.semanticMatches = [];
            this.matchTab = "catalog";
            this.autocompleteLoading = false;
        },
        clearSelectedFeedback() {
            if (this.selectedFeedbackTimer) {
                clearTimeout(this.selectedFeedbackTimer);
                this.selectedFeedbackTimer = null;
            }
            this.selectedFeedbackVisible = false;
            this.selectedFeedbackMessage = "";
        },
        isAlreadySelected(item) {
            const nodeId = item?.node_id || item?.id;
            if (!nodeId) {
                return false;
            }
            return this.items.some((entry) => entry.node_id === nodeId);
        },
        showSelectedFeedback(message) {
            this.clearSelectedFeedback();
            this.selectedFeedbackMessage = message;
            this.selectedFeedbackVisible = true;
            this.selectedFeedbackTimer = setTimeout(() => {
                this.selectedFeedbackVisible = false;
                this.selectedFeedbackTimer = null;
            }, 2200);
        },
        cancelCatalogSearch() {
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
                this.searchTimer = null;
            }
        },
        scheduleCatalogSearch() {
            this.cancelCatalogSearch();
            const query = this.autocompleteQuery.trim();
            if (!query) {
                this.autocompleteSuggestions = [];
                this.semanticMatches = [];
                this.matchTab = "catalog";
                this.autocompleteLoading = false;
                return;
            }
            this.autocompleteLoading = true;
            const requestId = ++this.catalogRequestId;
            this.searchTimer = setTimeout(() => {
                this.runCatalogSearch(query, requestId);
            }, 180);
        },
        async runCatalogSearch(query, requestId) {
            try {
                const payload =
                    this.entityType === "gene_set"
                        ? await this.apiClient.searchInteractiveGeneSets(query, 8)
                        : await this.apiClient.searchInteractiveCatalog(
                              this.entityType,
                              query,
                              8
                          );
                if (requestId !== this.catalogRequestId) {
                    return;
                }
                this.autocompleteSuggestions = payload.items || [];
            } catch (error) {
                if (requestId === this.catalogRequestId) {
                    this.$emit("error", String(error));
                    this.autocompleteSuggestions = [];
                }
            } finally {
                if (requestId === this.catalogRequestId) {
                    this.autocompleteLoading = false;
                }
            }
        },
        async runSemanticMatch() {
            const query = this.autocompleteQuery.trim();
            if (!query) {
                return;
            }
            this.semanticLoading = true;
            try {
                const payload = await this.apiClient.getInteractiveSemanticMatches({
                    entity_type: this.entityType,
                    query,
                    limit: 8,
                });
                if (!this.addModalOpen) {
                    return;
                }
                const next = normalizeInteractiveSemanticMatchRows(payload);
                this.semanticMatches = next;
                if (next.length > 0) {
                    this.matchTab = "conceptual";
                }
            } catch (error) {
                this.$emit("error", String(error));
                this.semanticMatches = [];
            } finally {
                this.semanticLoading = false;
            }
        },
        addItem(item) {
            if (!item?.node_id && !item?.id) {
                return;
            }
            if (this.isAlreadySelected(item)) {
                this.showSelectedFeedback("Already selected");
                return;
            }
            this.$emit("add", item);
            this.showSelectedFeedback("Selected term added");
            const query = this.autocompleteQuery.trim();
            if (query) {
                this.runCatalogSearch(query, ++this.catalogRequestId);
            }
            this.$nextTick(() => {
                this.$refs.searchInput?.focus();
            });
        },
    },
};
</script>

<style scoped>
.wkb-entity-column {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
}

.wkb-entity-column-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.wkb-entity-column-head h4 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-entity-add-link {
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
}

.wkb-entity-add-link:hover {
    color: var(--cfde-orange-dark, #c2662b);
}

.wkb-entity-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.wkb-entity-chip {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 6px 8px;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
    max-width: 100%;
}

.wkb-entity-chip-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.wkb-entity-chip-text strong {
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
    overflow-wrap: break-word;
    word-break: normal;
}

.wkb-entity-chip-sub {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-entity-chip-remove {
    border: none;
    background: transparent;
    color: #8a8a8a;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 2px;
}

.wkb-entity-empty {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-entity-add-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2400;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 48px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.wkb-entity-add-modal {
    position: relative;
    width: min(480px, 100%);
    max-height: calc(100vh - 96px);
    overflow-y: auto;
    padding: 20px 22px 22px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-entity-add-close {
    position: absolute;
    top: 10px;
    right: 12px;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
}

.wkb-entity-add-modal h3 {
    margin: 0 28px 14px 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-entity-add-search {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.wkb-entity-add-search-field {
    position: relative;
    display: flex;
    align-items: center;
}

.wkb-entity-add-input {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 36px 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
}

.wkb-entity-search-clear {
    position: absolute;
    right: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0 0 2px 0;
    border: none;
    border-radius: 50%;
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    cursor: pointer;
}

.wkb-entity-search-clear:hover {
    background: var(--cfde-orange-dark, #c2662b);
}

.wkb-entity-search-clear:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 1px;
}

.wkb-entity-search-clear-glyph {
    font-size: 14px;
    font-weight: 700;
    line-height: 0;
}

.wkb-entity-add-status,
.wkb-entity-llm-note {
    margin: 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-entity-added-note {
    margin: 0;
    font-size: 13px;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-entity-added-fade-enter-active,
.wkb-entity-added-fade-leave-active {
    transition: opacity 0.35s ease;
}

.wkb-entity-added-fade-enter,
.wkb-entity-added-fade-leave-to {
    opacity: 0;
}

.wkb-entity-conceptual-link {
    align-self: flex-start;
    border: none;
    background: transparent;
    color: var(--cfde-blue, #2c5c97);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    text-align: left;
}

.wkb-entity-conceptual-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.wkb-entity-result-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
}

.wkb-entity-result-tab {
    border: none;
    background: var(--cfde-bg, #f6f5f2);
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 999px;
    cursor: pointer;
}

.wkb-entity-result-tab.is-active {
    background: var(--cfde-orange-soft, #fbeee3);
    color: var(--cfde-orange, #e07b39);
}

.wkb-entity-suggestions {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.wkb-entity-suggestion {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: left;
    padding: 10px 12px;
    border: none;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
    cursor: pointer;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
}

.wkb-entity-suggestion:hover {
    background: var(--cfde-orange-soft, #fbeee3);
}

.wkb-entity-suggestion strong {
    font-weight: 700;
    overflow-wrap: break-word;
    word-break: normal;
}

.wkb-entity-suggestion span {
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-entity-rationale {
    font-style: italic;
}
</style>
