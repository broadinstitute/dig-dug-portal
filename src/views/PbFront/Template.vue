<template>
    <div class="crdc-front" @click="closeOverlays">
        <main class="crdc-front-main">
            <h1>
                <span class="headline-line"><span class="brand">CRDC</span> is a rare disease</span>
                <span class="headline-line">cohort explorer</span>
                <span class="headline-line">
                    connecting
                    <span class="sample-break"><a class="page-link" href="/pb_sample.html">Sample</a>,</span>
                </span>
                <span class="headline-line">
                    <span class="keep-together">
                        <a class="page-link" href="/pb_Gene.html">Gene</a>,
                        <a class="page-link" href="/pb_variant.html">Variant</a>,
                    </span>
                    and
                </span>
                <span class="headline-line">
                    <a class="page-link" href="/pb_phenotype.html">Phenotype</a> evidence.
                </span>
            </h1>

            <form class="search-form" @submit.prevent="submitSearch" @click.stop>
                <label for="front-search-input">
                    <span class="prompt-text">And you are searching for</span>
                </label>

                <div class="input-box">
                    <input
                        id="front-search-input"
                        ref="searchInput"
                        v-model="query"
                        aria-describedby="front-search-hint"
                        aria-label="Search"
                        aria-autocomplete="list"
                        aria-controls="front-search-suggestions"
                        :aria-expanded="String(showSuggestions)"
                        :aria-activedescendant="activeDescendant"
                        autocomplete="off"
                        autocapitalize="off"
                        spellcheck="false"
                        @input="handleInput"
                        @focus="openSuggestions"
                        @blur="scheduleCloseSuggestions"
                        @keydown="handleKeydown"
                    />

                    <ul
                        v-if="showSuggestions"
                        id="front-search-suggestions"
                        class="suggestions"
                        role="listbox"
                    >
                        <li v-for="(option, index) in visibleOptions" :key="`${option.kind}-${option.label}`">
                            <button
                                :id="`front-search-option-${index}`"
                                class="suggestion-button"
                                type="button"
                                role="option"
                                :aria-selected="String(index === activeOption)"
                                :aria-label="[option.kind, option.label, option.id].filter(Boolean).join(' ')"
                                @mousedown.prevent
                                @click="selectOption(option)"
                            >
                                <span class="suggestion-kind">{{ option.kind }}</span>
                                <span class="suggestion-label">
                                    {{ option.label }}
                                    <span v-if="option.id" class="suggestion-id">{{ option.id }}</span>
                                </span>
                            </button>
                        </li>
                    </ul>
                </div>

                <div class="hint-row">
                    <p id="front-search-hint" class="hint" aria-live="polite">{{ hint }}</p>
                    <div class="help-wrap" :data-open="String(helpOpen)">
                        <button
                            class="help-button"
                            type="button"
                            aria-label="Show accepted search formats"
                            :aria-expanded="String(helpOpen)"
                            aria-controls="front-format-help"
                            @click.stop="toggleHelp"
                        >
                            ?
                        </button>
                        <div id="front-format-help" class="format-help" role="tooltip">
                            <strong>Accepted search formats</strong>
                            <span>Sample · BCH-22-44945-01</span>
                            <span>Gene · SLC6A7</span>
                            <span>Variant · chr12:102912793:CA:C</span>
                            <span>Phenotype · Progressive muscle weakness [HP:0003323]</span>
                            <span>Separate multiple phenotypes with commas.</span>
                            <span>Gene and phenotype matching ignores capitalization.</span>
                        </div>
                    </div>
                </div>
            </form>
        </main>
    </div>
</template>

<script>
import { hpoTerms } from "../KrClinicalFocus/clinicalContextReference.generated";
import { PB_GENE_ID_REFERENCE } from "../PbGene/geneIdReference.generated";

const {
    buildSearchHref,
    findSearchOptions,
    normalizeSearchValue,
    resolveSearchTarget,
} = require("./searchModel");

const HPO_ALIASES = {
    "HP:0000750": ["speech delay", "delayed speech"],
    "HP:0001249": ["cognitive impairment"],
    "HP:0001250": ["seizures", "epilepsy", "convulsion"],
    "HP:0001252": ["low muscle tone"],
    "HP:0001263": ["developmental delay", "delayed development"],
    "HP:0001270": ["delayed motor development"],
    "HP:0001337": ["shaking"],
};

function makeSearchOption(kind, label, id = "", aliases = []) {
    const normalizedLabel = normalizeSearchValue(label);
    const normalizedId = normalizeSearchValue(id);
    const normalizedAliases = aliases.map(normalizeSearchValue);
    return {
        kind,
        label,
        id,
        aliases: normalizedAliases,
        normalizedLabel,
        normalizedId,
        searchKey: [normalizedLabel, normalizedId, ...normalizedAliases].filter(Boolean).join(" "),
    };
}

const GENE_OPTIONS = Object.keys(PB_GENE_ID_REFERENCE).map((gene) => makeSearchOption("Gene", gene));
const HPO_OPTIONS = hpoTerms.map(([id, label]) => makeSearchOption("Phenotype", label, id, HPO_ALIASES[id]));
const SEARCH_OPTIONS = [...GENE_OPTIONS, ...HPO_OPTIONS];
const GENE_SYMBOLS = new Set(GENE_OPTIONS.map((option) => option.normalizedLabel));

export default {
    name: "PbFrontTemplate",
    data() {
        return {
            query: "",
            hint: "Type, then press Enter",
            selectedKind: "",
            visibleOptions: [],
            suggestionsOpen: false,
            activeOption: -1,
            helpOpen: false,
            closeTimer: null,
        };
    },
    computed: {
        showSuggestions() {
            return this.suggestionsOpen && this.visibleOptions.length > 0;
        },
        activeDescendant() {
            return this.activeOption >= 0 ? `front-search-option-${this.activeOption}` : null;
        },
    },
    mounted() {
        this.$nextTick(() => this.$refs.searchInput.focus());
    },
    beforeDestroy() {
        if (this.closeTimer) window.clearTimeout(this.closeTimer);
    },
    methods: {
        updateSuggestions() {
            this.visibleOptions = findSearchOptions(SEARCH_OPTIONS, this.query);
            this.suggestionsOpen = this.visibleOptions.length > 0;
            this.activeOption = -1;
        },
        handleInput() {
            this.hint = "Type, then press Enter";
            this.selectedKind = "";
            this.helpOpen = false;
            this.updateSuggestions();
        },
        openSuggestions() {
            this.updateSuggestions();
        },
        closeSuggestions() {
            this.suggestionsOpen = false;
            this.activeOption = -1;
        },
        scheduleCloseSuggestions() {
            this.closeTimer = window.setTimeout(() => this.closeSuggestions(), 120);
        },
        selectOption(option) {
            if (this.closeTimer) window.clearTimeout(this.closeTimer);
            const selectedValue = option.id ? `${option.label} [${option.id}]` : option.label;
            const comma = this.query.lastIndexOf(",");
            this.query = comma < 0 ? selectedValue : `${this.query.slice(0, comma + 1)} ${selectedValue}`;
            this.selectedKind = option.kind;
            this.hint = `${option.kind} selected · press Enter`;
            this.closeSuggestions();
            this.$nextTick(() => this.$refs.searchInput.focus());
        },
        handleKeydown(event) {
            if (event.key === "Escape") {
                this.helpOpen = false;
                this.closeSuggestions();
                return;
            }

            if (!this.showSuggestions) return;

            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1;
                const start = step > 0 ? 0 : this.visibleOptions.length - 1;
                const next = this.activeOption < 0 ? start : this.activeOption + step;
                this.activeOption = (next + this.visibleOptions.length) % this.visibleOptions.length;
            } else if (event.key === "Enter") {
                event.preventDefault();
                this.selectOption(this.visibleOptions[this.activeOption < 0 ? 0 : this.activeOption]);
            }
        },
        toggleHelp() {
            this.closeSuggestions();
            this.helpOpen = !this.helpOpen;
        },
        closeOverlays() {
            this.helpOpen = false;
            this.closeSuggestions();
        },
        submitSearch() {
            const target = resolveSearchTarget(this.query, this.selectedKind, GENE_SYMBOLS);
            if (!target) {
                this.hint = "Enter a search value first";
                this.$refs.searchInput.focus();
                return;
            }

            window.location.assign(buildSearchHref(target));
        },
    },
};
</script>

<style scoped>
.crdc-front {
    --surface: #fafaf7;
    --ink: #20242a;
    --accent: #365e5a;
    --muted-ink: #62666b;
    position: fixed;
    z-index: 1000;
    inset: 0;
    overflow: auto;
    background: var(--surface);
    color: var(--ink);
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
}

.crdc-front,
.crdc-front * {
    box-sizing: border-box;
}

.crdc-front-main {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    width: min(1400px, calc(100% - 10vw));
    min-height: 100svh;
    margin-inline: auto;
    padding-block: clamp(56px, 6.7vh, 68px) clamp(42px, 7vh, 72px);
}

h1 {
    margin: 0;
    color: var(--ink);
    font: 500 clamp(54px, 4.25vw, 71px) / 1.12 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    letter-spacing: -0.06em;
}

.headline-line,
.sample-break {
    display: block;
}

.brand {
    font-weight: 800;
}

.page-link {
    color: var(--accent) !important;
    font-style: italic;
    font-weight: 600;
    text-decoration-line: underline;
    text-decoration-thickness: 0.065em;
    text-underline-offset: 0.14em;
}

.page-link:hover,
.page-link:focus-visible {
    color: var(--ink) !important;
}

.keep-together {
    white-space: nowrap;
}

.search-form {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    align-items: end;
    column-gap: 32px;
    width: 100%;
    margin-top: clamp(76px, 9vh, 120px);
    text-align: left;
}

label {
    display: block;
    margin-bottom: 14px;
    color: #50545a;
    font: 500 clamp(38px, 3.1vw, 52px) / 1.2 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    letter-spacing: -0.07em;
    white-space: nowrap;
}

.input-box {
    position: relative;
    min-width: 0;
    min-height: clamp(58px, 6vw, 76px);
    border: 3px solid var(--ink);
    transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}

.input-box:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(54, 94, 90, 0.18);
}

input {
    position: absolute;
    inset: 0;
    width: 100%;
    padding-inline: 18px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink);
    caret-color: var(--accent);
    font: 500 clamp(28px, 2.3vw, 38px) / 1.1 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    letter-spacing: -0.06em;
    text-align: center;
}

.suggestions {
    position: absolute;
    z-index: 3;
    right: -3px;
    bottom: calc(100% + 8px);
    left: -3px;
    max-height: 232px;
    margin: 0;
    padding: 5px 0;
    overflow-y: auto;
    border: 2px solid var(--accent);
    background: var(--surface);
    list-style: none;
}

.suggestion-button {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    align-items: center;
    width: 100%;
    min-height: 42px;
    padding: 7px 12px;
    border: 0;
    background: transparent;
    color: var(--ink);
    cursor: pointer;
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    text-align: left;
}

.suggestion-button:hover,
.suggestion-button[aria-selected="true"] {
    background: rgba(54, 94, 90, 0.11);
}

.suggestion-kind {
    color: var(--accent);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.suggestion-label {
    overflow: hidden;
    font-size: 13px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.suggestion-id {
    margin-left: 7px;
    color: var(--muted-ink);
    font-size: 11px;
    font-weight: 500;
}

.hint-row {
    position: relative;
    grid-column: 2;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 13px;
}

.hint {
    margin: 0;
    color: var(--accent);
    font: 700 13px / 1.2 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.help-wrap {
    position: relative;
}

.help-button {
    display: grid;
    width: 22px;
    height: 22px;
    padding: 0;
    place-items: center;
    border: 2px solid var(--accent);
    border-radius: 50%;
    background: transparent;
    color: var(--accent);
    cursor: help;
    font: 800 13px / 1 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
}

.help-button:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 3px;
}

.format-help {
    position: absolute;
    z-index: 5;
    right: 0;
    bottom: calc(100% + 10px);
    width: min(430px, 82vw);
    padding: 16px 18px;
    border: 2px solid var(--accent);
    background: var(--surface);
    color: var(--ink);
    opacity: 0;
    visibility: hidden;
    transform: translateY(6px);
    transition: opacity 150ms ease-out, transform 150ms ease-out, visibility 150ms;
    font: 600 13px / 1.55 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    letter-spacing: -0.02em;
    text-align: left;
    pointer-events: none;
}

.format-help strong,
.format-help span {
    display: block;
}

.format-help strong {
    margin-bottom: 7px;
    color: var(--accent);
    font-size: 14px;
}

.help-wrap:hover .format-help,
.help-wrap[data-open="true"] .format-help {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
}

@media (min-width: 761px) and (max-width: 1100px) {
    .search-form {
        column-gap: 20px;
    }

    label {
        font-size: 34px;
    }

    .prompt-text {
        letter-spacing: -0.13em;
    }
}

@media (max-width: 760px) {
    .crdc-front-main {
        width: calc(100% - 40px);
        min-height: max(100svh, 680px);
        padding-block: 40px 32px;
    }

    h1 {
        font-size: clamp(34px, 10vw, 54px);
    }

    .search-form {
        grid-template-columns: 1fr;
        row-gap: 18px;
        margin-top: 70px;
    }

    label {
        margin-bottom: 0;
        font-size: clamp(24px, 7vw, 38px);
        white-space: normal;
    }

    .hint-row {
        grid-column: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .input-box,
    .format-help {
        transition: none;
    }
}
</style>
