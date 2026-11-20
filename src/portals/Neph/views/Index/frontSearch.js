// Unified search box for the front page: a sample ID, gene, variant or one or
// more phenotypes. Mirrors the PbFront search, using the portal's own pages.
import { hpoTerms } from "@/views/KrClinicalFocus/clinicalContextReference.generated";
import { PB_GENE_ID_REFERENCE } from "@/views/PbGene/geneIdReference.generated";

import { findSearchOptions, normalizeSearchValue, resolveSearchTarget } from "@/views/PbFront/searchModel";
import { frontPhenotypeSearchMixin } from "@/views/PbFront/phenotypeSearch";

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

export const frontSearchMixin = {
    mixins: [frontPhenotypeSearchMixin],
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
            this.visibleOptions = findSearchOptions(
                SEARCH_OPTIONS.filter(option => this.frontOptionAvailability(option).enabled),
                this.query,
            );
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
            const availability = this.frontOptionAvailability(option);
            if (!availability.enabled) {
                this.hint = availability.reason;
                return;
            }
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
                const step = event.key === "ArrowDown" ? 1 : -1;
                const available = this.visibleOptions.map((option, index) => this.frontOptionAvailability(option).enabled ? index : -1).filter(index => index >= 0);
                if (!available.length) return;
                const current = available.indexOf(this.activeOption);
                const next = current < 0 ? (step > 0 ? 0 : available.length - 1) : (current + step + available.length) % available.length;
                this.activeOption = available[next];
            } else if (event.key === "Enter" && this.activeOption >= 0) {
                event.preventDefault();
                this.selectOption(this.visibleOptions[this.activeOption]);
            }
        },
        toggleHelp() { this.closeSuggestions(); this.helpOpen = !this.helpOpen; },
        closeOverlays() { this.helpOpen = false; this.closeSuggestions(); },
        submitSearch() {
            const target = resolveSearchTarget(this.query, this.selectedKind, GENE_SYMBOLS);
            if (!target) {
                this.hint = "Enter a search value first";
                this.$refs.searchInput.focus();
                return;
            }
            return this.navigateFrontSearch(target, HPO_OPTIONS);
        },
    },
};
