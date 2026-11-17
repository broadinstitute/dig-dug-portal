// Unified search box for the front page: a sample ID, gene, variant or one or
// more phenotypes. Mirrors the PbFront search, using the portal's own pages.
import { hpoTerms } from "../GeneResult/clinicalContextReference.generated";
import { PB_GENE_ID_REFERENCE } from "../Analyzer_new/geneIdReference.generated";

const { findSearchOptions, normalizeSearchValue, resolveSearchTarget } = require("../GeneResult/searchModel");

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
        kind, label, id, aliases: normalizedAliases, normalizedLabel, normalizedId,
        searchKey: [normalizedLabel, normalizedId, ...normalizedAliases].filter(Boolean).join(" "),
    };
}

const GENE_OPTIONS = Object.keys(PB_GENE_ID_REFERENCE).map(gene => makeSearchOption("Gene", gene));
const HPO_OPTIONS = hpoTerms.filter(([id]) => id !== "HP:0000001").map(([id, label]) => makeSearchOption("Phenotype", label, id, HPO_ALIASES[id]));
const SEARCH_OPTIONS = [...GENE_OPTIONS, ...HPO_OPTIONS];
const GENE_SYMBOLS = new Set(GENE_OPTIONS.map(option => option.normalizedLabel));
const PHENOTYPE_PATH = "./phenotyperesult.html";

const normalizeTerm = value => normalizeSearchValue(value).replace(/\s*,\s*/g, ", ");

export function resolvePhenotypeSearchIds(value, options = HPO_OPTIONS) {
    const byText = new Map();
    for (const option of options) {
        for (const text of [option.id, option.label, `${option.label} [${option.id}]`, ...(option.aliases || [])])
            byText.set(normalizeTerm(text), option.id);
    }
    const parts = String(value || "").split(",").map(part => part.trim()).filter(Boolean);
    const ids = [];
    while (parts.length) {
        let id, consumed = 0;
        // Prefer a complete known label, including labels that contain commas.
        for (let end = parts.length; end > 0; end--) {
            const text = parts.slice(0, end).join(", ");
            id = byText.get(normalizeTerm(text));
            if (!id && end === 1 && /^HP:\d{7}$/i.test(text)) id = text.toUpperCase();
            if (id) { consumed = end; break; }
        }
        if (!id) throw new Error(`Unknown phenotype: ${parts[0]}. Select a suggestion or enter an HPO ID.`);
        ids.push(id);
        parts.splice(0, consumed);
    }
    if (!ids.length) throw new Error("Enter a phenotype first.");
    return [...new Set(ids)];
}

export const frontSearchMixin = {
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
        showSuggestions() { return this.suggestionsOpen && this.visibleOptions.length > 0; },
        activeDescendant() { return this.activeOption >= 0 ? `front-search-option-${this.activeOption}` : null; },
    },
    beforeDestroy() { if (this.closeTimer) window.clearTimeout(this.closeTimer); },
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
        closeSuggestions() { this.suggestionsOpen = false; this.activeOption = -1; },
        scheduleCloseSuggestions() { this.closeTimer = window.setTimeout(() => this.closeSuggestions(), 120); },
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
            if (event.key === "Escape") { this.helpOpen = false; this.closeSuggestions(); return; }
            if (!this.showSuggestions) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1, count = this.visibleOptions.length;
                this.activeOption = this.activeOption < 0 ? (step > 0 ? 0 : count - 1) : (this.activeOption + step + count) % count;
            } else if (event.key === "Enter" && this.activeOption >= 0) {
                event.preventDefault();
                this.selectOption(this.visibleOptions[this.activeOption]);
            }
        },
        toggleHelp() { this.closeSuggestions(); this.helpOpen = !this.helpOpen; },
        closeOverlays() { this.helpOpen = false; this.closeSuggestions(); },
        submitSearch() {
            let target = resolveSearchTarget(this.query, this.selectedKind, GENE_SYMBOLS);
            if (!target) {
                this.hint = "Enter a search value first";
                this.$refs.searchInput.focus();
                return;
            }
            if (target.path === PHENOTYPE_PATH) {
                try {
                    target = { ...target, value: resolvePhenotypeSearchIds(target.value).join(",") };
                } catch (error) {
                    this.hint = error.message;
                    this.$refs.searchInput.focus();
                    return;
                }
            }
            const href = `${target.path}?${target.param}=${encodeURIComponent(target.value)}`;
            window.location.assign(target.path === PHENOTYPE_PATH ? `${href}&match=all` : href);
        },
    },
};
