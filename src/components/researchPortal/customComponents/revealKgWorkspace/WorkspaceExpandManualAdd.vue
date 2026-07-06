<template>
    <div class="wkb-expand-manual">
        <p class="wkb-expand-manual-intro">
            Search for a specific node and add it to the graph with its connecting edges.
        </p>

        <label class="wkb-expand-manual-field">
            <span class="wkb-expand-manual-label">Type</span>
            <select
                class="wkb-expand-manual-select"
                :value="entityType"
                :disabled="busy"
                @change="onEntityTypeChange"
            >
                <option v-for="option in entityTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
        </label>

        <label class="wkb-expand-manual-field">
            <span class="wkb-expand-manual-label">Search</span>
            <input
                v-model="query"
                type="text"
                class="wkb-expand-manual-input"
                :placeholder="searchPlaceholder"
                :disabled="busy"
                :aria-label="searchPlaceholder"
            />
        </label>

        <p v-if="searchLoading" class="wkb-expand-manual-status" role="status">Searching…</p>
        <p
            v-else-if="geneSetSearchUnavailableNote"
            class="wkb-expand-manual-note"
        >
            {{ geneSetSearchUnavailableNote }}
        </p>

        <button
            v-if="conceptualSearchEnabled"
            type="button"
            class="wkb-expand-manual-link"
            :disabled="busy || semanticLoading || !query.trim()"
            @click="runSemanticMatch"
        >
            {{
                semanticLoading
                    ? "Finding conceptual matches…"
                    : "+ Add conceptual matches"
            }}
        </button>

        <ul v-if="catalogSuggestions.length" class="wkb-expand-manual-suggestions">
            <li v-for="(item, index) in catalogSuggestions" :key="entityKey(item) || `catalog-${index}`">
                <button
                    type="button"
                    class="wkb-expand-manual-suggestion"
                    :class="{ 'is-added': isAlreadyOnGraph(item) }"
                    :disabled="busy"
                    :aria-disabled="isAlreadyOnGraph(item)"
                    @click="addItem(item)"
                >
                    <strong>{{ displayLabel(item) }}</strong>
                    <span v-if="subtitleFor(item)" class="wkb-expand-manual-suggestion-sub">
                        {{ subtitleFor(item) }}
                    </span>
                </button>
            </li>
        </ul>

        <div v-if="semanticMatches.length" class="wkb-expand-manual-semantic">
            <p class="wkb-expand-manual-semantic-title">Conceptual matches</p>
            <button
                v-for="(item, index) in semanticMatches"
                :key="entityKey(item.candidate) || `semantic-${index}`"
                type="button"
                class="wkb-expand-manual-suggestion"
                :class="{ 'is-added': isAlreadyOnGraph(item.candidate) }"
                :disabled="busy"
                :aria-disabled="isAlreadyOnGraph(item.candidate)"
                @click="addItem(item.candidate)"
            >
                <strong>{{ displayLabel(item.candidate) }}</strong>
                <span v-if="subtitleFor(item.candidate)" class="wkb-expand-manual-suggestion-sub">
                    {{ subtitleFor(item.candidate) }}
                </span>
                <span v-if="item.rationale" class="wkb-expand-manual-suggestion-sub">
                    {{ item.rationale }}
                </span>
            </button>
        </div>

        <p v-if="!llmAvailable && entityType !== 'gene_set' && entityType !== 'gene'" class="wkb-expand-manual-note">
            Conceptual matching requires an LLM backend.
        </p>
    </div>
</template>

<script>
import {
    catalogItemAlreadyAdded,
    formatEntityDisplayLabel,
    formatEntitySearchSubtitle,
    interactiveEntityKey,
    normalizeInteractiveSemanticMatchRows,
} from "./revealKgEntityUtils.js";
import { GENE_SET_SEMANTIC_SEARCH_UNAVAILABLE_NOTE } from "./revealKgCanvasModel.js";

const ENTITY_TYPE_OPTIONS = [
    { value: "gene", label: "Gene" },
    { value: "gene_set", label: "Gene set" },
    { value: "factor", label: "Mechanism" },
    { value: "trait", label: "Trait" },
];

export default {
    name: "WorkspaceExpandManualAdd",
    props: {
        apiClient: {
            type: Object,
            required: true,
        },
        llmAvailable: {
            type: Boolean,
            default: false,
        },
        geneSetSemanticSearchAvailable: {
            type: Boolean,
            default: true,
        },
        existingNodeIds: {
            type: Array,
            default: () => [],
        },
        busy: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            entityType: "gene",
            query: "",
            catalogSuggestions: [],
            semanticMatches: [],
            searchLoading: false,
            semanticLoading: false,
            searchTimer: null,
            catalogRequestId: 0,
        };
    },
    computed: {
        entityTypeOptions() {
            return ENTITY_TYPE_OPTIONS;
        },
        searchPlaceholder() {
            if (this.entityType === "gene_set") {
                if (!this.geneSetSemanticSearchAvailable) {
                    return "Search gene sets by name";
                }
                return "Search by name or describe a biology question";
            }
            const label =
                ENTITY_TYPE_OPTIONS.find((option) => option.value === this.entityType)?.label ||
                "node";
            return `Search ${label.toLowerCase()} nodes`;
        },
        conceptualSearchEnabled() {
            return (
                this.llmAvailable &&
                this.entityType !== "gene_set" &&
                this.entityType !== "gene"
            );
        },
        geneSetSearchUnavailableNote() {
            if (
                this.entityType !== "gene_set" ||
                this.geneSetSemanticSearchAvailable ||
                !this.query.trim()
            ) {
                return "";
            }
            return GENE_SET_SEMANTIC_SEARCH_UNAVAILABLE_NOTE;
        },
    },
    watch: {
        query() {
            this.scheduleCatalogSearch();
        },
        entityType() {
            this.catalogSuggestions = [];
            this.semanticMatches = [];
            this.scheduleCatalogSearch();
        },
    },
    beforeDestroy() {
        this.cancelCatalogSearch();
    },
    methods: {
        entityKey(item) {
            return interactiveEntityKey(item);
        },
        isAlreadyOnGraph(item) {
            return catalogItemAlreadyAdded(item, this.existingNodeIds);
        },
        displayLabel(item) {
            return formatEntityDisplayLabel(this.entityType, item?.label);
        },
        subtitleFor(item) {
            return formatEntitySearchSubtitle(this.entityType, item);
        },
        onEntityTypeChange(event) {
            this.entityType = event.target.value;
        },
        cancelCatalogSearch() {
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
                this.searchTimer = null;
            }
        },
        scheduleCatalogSearch() {
            this.cancelCatalogSearch();
            const trimmed = this.query.trim();
            if (!trimmed) {
                this.catalogSuggestions = [];
                this.semanticMatches = [];
                this.searchLoading = false;
                return;
            }
            this.searchLoading = true;
            const requestId = ++this.catalogRequestId;
            this.searchTimer = setTimeout(() => {
                this.runCatalogSearch(trimmed, requestId);
            }, 180);
        },
        async runCatalogSearch(query, requestId) {
            try {
                if (
                    this.entityType === "gene_set" &&
                    !this.geneSetSemanticSearchAvailable
                ) {
                    if (requestId !== this.catalogRequestId) {
                        return;
                    }
                    this.catalogSuggestions = [];
                    return;
                }
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
                this.catalogSuggestions = payload.items || [];
            } catch (error) {
                if (requestId === this.catalogRequestId) {
                    this.$emit("error", String(error?.message || error));
                    this.catalogSuggestions = [];
                }
            } finally {
                if (requestId === this.catalogRequestId) {
                    this.searchLoading = false;
                }
            }
        },
        async runSemanticMatch() {
            const query = this.query.trim();
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
                this.semanticMatches = normalizeInteractiveSemanticMatchRows(payload);
            } catch (error) {
                this.$emit("error", String(error?.message || error));
                this.semanticMatches = [];
            } finally {
                this.semanticLoading = false;
            }
        },
        addItem(item) {
            if (!item?.node_id && !item?.id) {
                return;
            }
            if (this.isAlreadyOnGraph(item)) {
                return;
            }
            this.$emit("add", {
                node_id: item.node_id || item.id,
                node_type: item.node_type || item.type || this.entityType,
                type: item.node_type || item.type || this.entityType,
                label: item.label || item.node_id || item.id,
                subtitle: item.subtitle || "",
            });
            this.query = "";
            this.catalogSuggestions = [];
            this.semanticMatches = [];
        },
    },
};
</script>

<style scoped>
.wkb-expand-manual {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wkb-expand-manual-intro {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-manual-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.wkb-expand-manual-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-manual-select,
.wkb-expand-manual-input {
    width: 100%;
    padding: 8px 28px 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    background-color: #ffffff;
}

.wkb-expand-manual-select {
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2333363d' d='M1.5 1.5 6 6l4.5-4.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 10px 6px;
    cursor: pointer;
}

.wkb-expand-manual-input {
    padding-right: 10px;
}

.wkb-expand-manual-status {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-manual-link {
    align-self: flex-start;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--cfde-blue, #2c5c97);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}

.wkb-expand-manual-link:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-expand-manual-suggestions {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 180px;
    overflow: auto;
}

.wkb-expand-manual-suggestion {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #faf9f7;
    text-align: left;
    cursor: pointer;
}

.wkb-expand-manual-suggestion:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-expand-manual-suggestion.is-added {
    opacity: 0.45;
    cursor: default;
}

.wkb-expand-manual-suggestion.is-added:hover {
    background: #faf9f7;
}

.wkb-expand-manual-suggestion strong {
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-manual-suggestion-sub {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
    line-height: 1.35;
}

.wkb-expand-manual-semantic {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.wkb-expand-manual-semantic-title {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-manual-note {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
