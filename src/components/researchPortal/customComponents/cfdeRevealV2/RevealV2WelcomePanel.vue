<template>
    <div
        v-if="open"
        class="rv2-welcome-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="rv2-welcome-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rv2-welcome-title"
            @click.stop
        >
            <button
                v-if="dismissible"
                type="button"
                class="rv2-welcome-close"
                aria-label="Close"
                @click="$emit('close')"
            >
                &times;
            </button>

            <header class="rv2-welcome-head">
                <h2 id="rv2-welcome-title" class="rv2-welcome-title">
                    Welcome to
                    <span class="rv2-welcome-brand">
                        <span class="rv2-welcome-mark">REVEAL</span>
                    </span>
                </h2>
            </header>

            <div class="rv2-welcome-body">
                <section class="rv2-welcome-section" aria-labelledby="rv2-welcome-search-title">
                    <div class="rv2-welcome-option rv2-welcome-search-wrapper">
                        <span id="rv2-welcome-search-title" class="rv2-welcome-option-title">
                            Search gene or mechanism
                        </span>
                        <span class="rv2-welcome-option-desc">
                            Enter a gene symbol, a mechanism phrase, or both (e.g.
                            <em>FANCA DNA repair</em>). Autocomplete shows gene and mechanism options.
                        </span>
                        <div class="rv2-welcome-search-row">
                            <div class="rv2-welcome-ac">
                                <input
                                    ref="searchInput"
                                    v-model="searchText"
                                    type="text"
                                    class="rv2-welcome-input"
                                    placeholder="e.g. FANCA or proximal tubule transport"
                                    autocomplete="off"
                                    aria-autocomplete="list"
                                    :aria-expanded="showSuggestions ? 'true' : 'false'"
                                    @input="onSearchInput"
                                    @keydown.down.prevent="moveHighlight(1)"
                                    @keydown.up.prevent="moveHighlight(-1)"
                                    @keydown.enter.prevent="onSearchEnter"
                                    @keydown.esc.prevent="closeSuggestions"
                                    @focus="onSearchFocus"
                                />
                                <div
                                    v-if="showSuggestions"
                                    class="rv2-welcome-suggestions"
                                    role="listbox"
                                >
                                    <div v-if="suggestionsLoading" class="rv2-welcome-sug-status">
                                        Searching…
                                    </div>
                                    <template v-else>
                                        <div v-if="geneSuggestions.length" class="rv2-welcome-sug-group">
                                            <div class="rv2-welcome-sug-heading">Genes</div>
                                            <button
                                                v-for="(item, index) in geneSuggestions"
                                                :key="`gene-${item.id}`"
                                                type="button"
                                                role="option"
                                                class="rv2-welcome-sug-item"
                                                :class="{ 'is-active': isHighlighted('gene', index) }"
                                                @mousedown.prevent="selectSuggestion(item)"
                                            >
                                                <span class="rv2-welcome-sug-label">{{ item.label }}</span>
                                                <span class="rv2-welcome-sug-kind">Gene</span>
                                            </button>
                                        </div>
                                        <div
                                            v-if="mechanismSuggestions.length"
                                            class="rv2-welcome-sug-group"
                                        >
                                            <div class="rv2-welcome-sug-heading">Mechanisms</div>
                                            <button
                                                v-for="(item, index) in mechanismSuggestions"
                                                :key="`mech-${item.id}`"
                                                type="button"
                                                role="option"
                                                class="rv2-welcome-sug-item"
                                                :class="{ 'is-active': isHighlighted('mechanism', index) }"
                                                @mousedown.prevent="selectSuggestion(item)"
                                            >
                                                <span class="rv2-welcome-sug-label">{{ item.label }}</span>
                                                <span
                                                    v-if="item.cfdeDisease"
                                                    class="rv2-welcome-sug-meta"
                                                >
                                                    {{ item.cfdeDisease }}
                                                </span>
                                                <span class="rv2-welcome-sug-kind">Mechanism</span>
                                            </button>
                                        </div>
                                        <div
                                            v-if="!geneSuggestions.length && !mechanismSuggestions.length"
                                            class="rv2-welcome-sug-status"
                                        >
                                            No matches
                                        </div>
                                    </template>
                                </div>
                            </div>
                            <button
                                type="button"
                                class="rv2-welcome-search-btn"
                                :disabled="!searchText.trim() || searchSubmitting"
                                @click="onSearchClick"
                            >
                                Search
                            </button>
                        </div>
                        <p v-if="searchError" class="rv2-welcome-search-error">{{ searchError }}</p>
                    </div>
                </section>

                <section class="rv2-welcome-section" aria-labelledby="rv2-welcome-import-title">
                    <button
                        type="button"
                        class="rv2-welcome-option rv2-welcome-option-import"
                        @click="onImportSessionClick"
                    >
                        <span id="rv2-welcome-import-title" class="rv2-welcome-option-title">
                            Import session
                        </span>
                        <span class="rv2-welcome-option-desc">
                            Load a previously exported session and pick up where you left off.
                        </span>
                    </button>
                </section>

                <section
                    ref="learnSection"
                    class="rv2-welcome-section"
                    aria-labelledby="rv2-welcome-learn-title"
                >
                    <div class="rv2-welcome-option">
                        <span id="rv2-welcome-learn-title" class="rv2-welcome-option-title">
                            Learn REVEAL
                        </span>
                        <span class="rv2-welcome-option-desc">
                            REVEAL helps you explore genes and disease mechanisms, inspect evidence,
                            and carry curated findings into downstream analysis. Start with a gene or
                            mechanism search, or import a saved session.
                        </span>
                        <ul class="rv2-welcome-learn-list">
                            <li>Search by gene symbol or mechanism phrase</li>
                            <li>Review mechanistic context and knowledge gaps</li>
                            <li>Save and reload your work with session import/export</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<script>
import {
    searchGenes,
    searchMechanisms,
    classifySearchQuery,
    runRoutedSearch,
} from "@/components/researchPortal/customComponents/cfdeRevealV2/revealV2SearchApi.js";

const DEBOUNCE_MS = 280;

export default {
    name: "RevealV2WelcomePanel",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        dismissible: {
            type: Boolean,
            default: true,
        },
        initialSearchText: {
            type: String,
            default: "",
        },
        focusLearn: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            searchText: this.initialSearchText,
            geneSuggestions: [],
            mechanismSuggestions: [],
            suggestionsLoading: false,
            suggestionsOpen: false,
            suggestionsSeq: 0,
            highlightIndex: -1,
            searchSubmitting: false,
            searchError: null,
            debounceTimer: null,
            abortController: null,
        };
    },
    computed: {
        flatSuggestions() {
            return [
                ...this.geneSuggestions.map((item, index) => ({ item, group: "gene", index })),
                ...this.mechanismSuggestions.map((item, index) => ({
                    item,
                    group: "mechanism",
                    index,
                })),
            ];
        },
        showSuggestions() {
            return (
                this.suggestionsOpen &&
                this.searchText.trim().length >= 2 &&
                (this.suggestionsLoading ||
                    this.geneSuggestions.length > 0 ||
                    this.mechanismSuggestions.length > 0 ||
                    (!this.suggestionsLoading && this.searchText.trim().length >= 2))
            );
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.searchText = this.initialSearchText;
                this.resetSuggestions();
                this.searchError = null;
                if (this.focusLearn) {
                    this.$nextTick(() => this.scrollToLearn());
                }
            } else {
                this.clearDebounce();
                this.abortInFlight();
            }
        },
        focusLearn(shouldFocus) {
            if (this.open && shouldFocus) {
                this.$nextTick(() => this.scrollToLearn());
            }
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
        this.clearDebounce();
        this.abortInFlight();
    },
    methods: {
        onSearchInput() {
            this.searchError = null;
            this.suggestionsOpen = true;
            this.highlightIndex = -1;
            this.clearDebounce();
            const q = this.searchText.trim();
            if (q.length < 2) {
                this.resetSuggestions();
                return;
            }
            this.debounceTimer = setTimeout(() => {
                this.fetchSuggestions(q);
            }, DEBOUNCE_MS);
        },
        onSearchFocus() {
            if (this.searchText.trim().length >= 2) {
                this.suggestionsOpen = true;
                if (!this.geneSuggestions.length && !this.mechanismSuggestions.length) {
                    this.fetchSuggestions(this.searchText.trim());
                }
            }
        },
        async fetchSuggestions(query) {
            const seq = ++this.suggestionsSeq;
            this.suggestionsLoading = true;
            this.abortInFlight();
            const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
            this.abortController = controller;
            try {
                const [genes, mechanisms] = await Promise.all([
                    searchGenes(query, { limit: 8 }),
                    searchMechanisms(query, { limit: 8, signal: controller && controller.signal }),
                ]);
                if (seq !== this.suggestionsSeq) return;
                this.geneSuggestions = genes;
                this.mechanismSuggestions = mechanisms;
            } catch (error) {
                if (controller && error && error.name === "AbortError") return;
                if (seq !== this.suggestionsSeq) return;
                this.geneSuggestions = [];
                this.mechanismSuggestions = [];
            } finally {
                if (seq === this.suggestionsSeq) {
                    this.suggestionsLoading = false;
                }
            }
        },
        isHighlighted(group, index) {
            const flat = this.flatSuggestions;
            const hi = this.highlightIndex;
            if (hi < 0 || hi >= flat.length) return false;
            return flat[hi].group === group && flat[hi].index === index;
        },
        moveHighlight(delta) {
            const flat = this.flatSuggestions;
            if (!flat.length) return;
            this.suggestionsOpen = true;
            const next = this.highlightIndex + delta;
            if (next < 0) {
                this.highlightIndex = flat.length - 1;
            } else if (next >= flat.length) {
                this.highlightIndex = 0;
            } else {
                this.highlightIndex = next;
            }
        },
        selectSuggestion(item) {
            if (!item) return;
            this.searchText = item.kind === "gene" ? item.label : item.label;
            this.closeSuggestions();
            if (item.kind === "gene") {
                this.emitSearchResult({
                    searchType: "gene",
                    mode: "gene",
                    gene: item.label,
                    query: item.label,
                    results: [item],
                    selected: item,
                });
                return;
            }
            this.emitSearchResult({
                searchType: "mechanism",
                mode: "mechanism",
                gene: null,
                query: item.label,
                results: [item],
                selected: item,
            });
        },
        onSearchEnter() {
            if (this.highlightIndex >= 0 && this.flatSuggestions[this.highlightIndex]) {
                this.selectSuggestion(this.flatSuggestions[this.highlightIndex].item);
                return;
            }
            this.onSearchClick();
        },
        async onSearchClick() {
            const query = this.searchText.trim();
            if (!query || this.searchSubmitting) return;
            this.searchSubmitting = true;
            this.searchError = null;
            this.closeSuggestions();
            try {
                // Ensure gene suggestions exist for classification (gene vs gene+mechanism).
                let geneSuggestions = this.geneSuggestions;
                if (!geneSuggestions.length) {
                    geneSuggestions = await searchGenes(query, { limit: 10 });
                }
                const classified = classifySearchQuery(query, geneSuggestions);
                const routed = await runRoutedSearch(query, {
                    geneSuggestions,
                    limit: 10,
                });
                this.emitSearchResult({
                    ...routed,
                    mode: classified.mode,
                    selected: null,
                });
            } catch (error) {
                this.searchError = "Search failed. Try again.";
                // eslint-disable-next-line no-console
                console.warn("[RevealV2WelcomePanel] search failed", error);
            } finally {
                this.searchSubmitting = false;
            }
        },
        emitSearchResult(payload) {
            this.$emit("search", payload);
            this.$emit("close");
        },
        closeSuggestions() {
            this.suggestionsOpen = false;
            this.highlightIndex = -1;
        },
        resetSuggestions() {
            this.geneSuggestions = [];
            this.mechanismSuggestions = [];
            this.suggestionsLoading = false;
            this.suggestionsOpen = false;
            this.highlightIndex = -1;
        },
        clearDebounce() {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = null;
            }
        },
        abortInFlight() {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
        },
        onImportSessionClick() {
            this.$emit("import-session");
        },
        scrollToLearn() {
            const el = this.$refs.learnSection;
            if (el && typeof el.scrollIntoView === "function") {
                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        },
        onBackdropClick(event) {
            if (event.target !== event.currentTarget || !this.dismissible) {
                return;
            }
            this.$emit("close");
        },
        onKeyDown(event) {
            if (this.open && event.key === "Escape" && this.dismissible) {
                if (this.suggestionsOpen) {
                    event.preventDefault();
                    this.closeSuggestions();
                    return;
                }
                event.preventDefault();
                this.$emit("close");
            }
        },
    },
};
</script>

<style scoped>
.rv2-welcome-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.rv2-welcome-modal {
    position: relative;
    width: min(520px, 100%);
    max-height: min(90vh, 720px);
    display: flex;
    flex-direction: column;
    padding: 24px 26px 26px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.rv2-welcome-close {
    position: absolute;
    top: 10px;
    right: 12px;
    z-index: 1;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    padding: 4px 8px;
}

.rv2-welcome-head h2 {
    margin: 0 0 18px;
}

.rv2-welcome-title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35em;
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.rv2-welcome-brand {
    display: inline-flex;
    align-items: baseline;
    gap: 7px;
}

.rv2-welcome-mark {
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cfde-orange, #e07b39);
}

.rv2-welcome-body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.rv2-welcome-section {
    margin: 0;
}

.rv2-welcome-option {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    text-align: left;
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--cfde-bg, #f6f5f2);
    border: none;
}

.rv2-welcome-option-import {
    background: #fff;
    border: 1px solid var(--cfde-orange, #e07b39);
    cursor: pointer;
}

.rv2-welcome-option-import:hover {
    background: var(--cfde-orange, #e07b39);
}

.rv2-welcome-option-import:hover .rv2-welcome-option-title,
.rv2-welcome-option-import:hover .rv2-welcome-option-desc {
    color: #fff;
}

.rv2-welcome-option-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.rv2-welcome-option-desc {
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.rv2-welcome-search-row {
    display: flex;
    gap: 8px;
    width: 100%;
    margin-top: 4px;
    align-items: flex-start;
}

.rv2-welcome-ac {
    position: relative;
    flex: 1;
    min-width: 0;
}

.rv2-welcome-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
    background: #fff;
    box-sizing: border-box;
}

.rv2-welcome-input:focus {
    outline: none;
    border-color: var(--cfde-blue, #2c5c97);
}

.rv2-welcome-suggestions {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    z-index: 5;
    max-height: 260px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    box-shadow: 0 10px 28px rgba(20, 22, 30, 0.14);
}

.rv2-welcome-sug-group + .rv2-welcome-sug-group {
    border-top: 1px solid var(--cfde-border, #e6e1d6);
}

.rv2-welcome-sug-heading {
    padding: 8px 12px 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--cfde-muted, #6b6b6b);
}

.rv2-welcome-sug-item {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 10px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
}

.rv2-welcome-sug-item:hover,
.rv2-welcome-sug-item.is-active {
    background: var(--cfde-orange-soft, #fbeee3);
}

.rv2-welcome-sug-label {
    flex: 1 1 auto;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.rv2-welcome-sug-meta {
    flex: 1 1 100%;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.rv2-welcome-sug-kind {
    flex: 0 0 auto;
    font-size: 11px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.rv2-welcome-sug-status {
    padding: 12px;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.rv2-welcome-search-btn {
    flex: 0 0 auto;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.rv2-welcome-search-btn:hover:not(:disabled) {
    background: var(--cfde-orange-dark, #c2662b);
}

.rv2-welcome-search-btn:disabled {
    opacity: 0.5;
    cursor: default;
}

.rv2-welcome-search-error {
    margin: 4px 0 0;
    font-size: 12px;
    color: #b42318;
}

.rv2-welcome-learn-list {
    margin: 4px 0 0;
    padding-left: 18px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-ink, #33363d);
}

.rv2-welcome-learn-list li + li {
    margin-top: 4px;
}
</style>
