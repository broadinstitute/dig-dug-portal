<template>
    <div class="bottom-line-provenance">
        <div v-if="showPageTitle || showLinkBack" class="page-heading">
            <h2 v-if="showPageTitle" class="page-title">Bottom-Line Provenance</h2>
            <a v-if="showLinkBack" class="provenance-page-link" :href="standaloneProvenanceUrl">
                View full provenance page
            </a>
        </div>
        <div
            v-if="showSearch"
            ref="traitPicker"
            class="trait-picker"
            :class="{ 'has-selection': !!selectedAncestry }"
        >
            <div class="search-control">
                <div class="search-label">Search</div>
                <div class="search-input-wrap">
                    <input
                        id="bottom_line_trait_search"
                        v-model="searchText"
                        class="form-control trait-search"
                        type="text"
                        autocomplete="off"
                        placeholder="trait name"
                        @focus="openTraitList"
                        @click="openTraitList"
                    />
                    <button
                        v-if="selectedAncestry && listExpanded"
                        class="clear-search"
                        type="button"
                        aria-label="Clear search and close trait list"
                        title="Clear search and close trait list"
                        @click="clearAndCloseTraitList"
                    >
                        &times;
                    </button>
                </div>
                <span class="trait-count">{{ traitCountLabel }}</span>
            </div>

            <div v-if="traitError" class="alert alert-danger mt-3 mb-0">
                {{ traitError }}
            </div>

            <div
                v-if="showTraitList"
                class="trait-list"
                :class="{ 'dropdown-list': !!selectedAncestry }"
            >
                <div class="trait-list-columns">
                    <span>Traits</span>
                    <span>Ancestries</span>
                </div>
                <div v-if="loadingTraits" class="trait-list-status">
                    Loading traits...
                </div>
                <div v-else-if="filteredTraits.length === 0" class="trait-list-status">
                    No traits match this search.
                </div>
                <div
                    v-for="trait in filteredTraits"
                    :key="traitKey(trait)"
                    class="trait-list-item"
                >
                    <button
                        class="trait-name"
                        type="button"
                        title="View Mixed ancestry provenance"
                        @click="selectDefaultAncestry(trait)"
                        @mouseenter="hoveredTraitKey = traitKey(trait)"
                        @mouseleave="hoveredTraitKey = ''"
                        @focus="hoveredTraitKey = traitKey(trait)"
                        @blur="hoveredTraitKey = ''"
                    ><span v-html="highlightTraitName(trait)"></span></button>
                    <div class="ancestry-pill-group">
                        <button
                            v-for="ancestry in traitAncestries(trait)"
                            :key="ancestry.id || ancestry.ancestry_id"
                            class="ancestry-pill"
                            :class="{ 'highlighted-default': hoveredTraitKey === traitKey(trait) && isMixedAncestry(ancestry) }"
                            type="button"
                            @click="selectAncestry(trait, ancestry)"
                        >
                            {{ ancestry.ancestry_name || ancestry.ancestry_id || "Unknown" }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="selectedTrait" class="provenance-detail">
            <div class="detail-header">
                <div>
                    <div class="metadata-label">trait</div>
                    <h3>{{ selectedTitle }}</h3>
                </div>
                <div v-if="loadingProvenance" class="detail-loading">
                    Loading provenance...
                </div>
            </div>

            <div class="selected-ancestry-group">
                <div class="ancestry-actions">
                    <div class="ancestry-selector-group">
                        <div class="metadata-label">
                            selected ancestry <span v-if="showAncestrySelect" class="results-ancestry">— click to select</span>
                        </div>
                        <div class="ancestry-switcher">
                            <button
                                v-for="ancestry in visibleSelectedTraitAncestries"
                                :key="ancestry.id || ancestry.ancestry_id"
                                class="ancestry-pill"
                                :class="{ selected: isSelectedAncestry(ancestry) }"
                                type="button"
                                :disabled="!showAncestrySelect"
                                @click="showAncestrySelect && selectAncestry(selectedTrait, ancestry)"
                            >
                                {{ ancestry.ancestry_name || ancestry.ancestry_id || "Unknown" }}
                            </button>
                        </div>
                    </div>
                    <div v-if="bottomLineResultsUrl" class="download-results-group">
                        <div class="metadata-label">
                            bottom-line results <span class="results-ancestry">— {{ selectedAncestry.ancestry_name || selectedAncestry.ancestry_id }}</span>
                        </div>
                        <b-button
                            class="download-results-button"
                            variant="primary"
                            :href="bottomLineResultsUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <b-icon-download aria-hidden="true"></b-icon-download>
                            Download summary statistics
                        </b-button>
                    </div>
                </div>
            </div>

            <p v-if="!selectedAncestry" class="ancestry-selection-note">
                Select an ancestry to view its provenance.
            </p>

            <div v-if="provenanceError" class="alert alert-danger mt-3">
                {{ provenanceError }}
            </div>

            <template v-if="selectedProvenance">
                <div v-if="selectedProvenance.description" class="provenance-description">
                        <span class="metadata-label">description</span>
                        <span>{{ selectedProvenance.description }}</span>
                </div>

                <div class="provenance-metadata-row">
                    <div class="metadata-field">
                        <span class="metadata-label">pipeline_type</span>
                        <input
                            id="bottom_line_pipeline_type"
                            class="form-control"
                            type="text"
                            readonly
                            :value="selectedProvenance.pipeline_type || 'Unavailable'"
                            @focus="$event.target.select()"
                        />
                    </div>
                    <div class="metadata-field">
                        <span class="metadata-label">trait_legacy_id</span>
                        <input
                            id="bottom_line_trait_legacy_id"
                            class="form-control"
                            type="text"
                            readonly
                            :value="selectedProvenance.trait_legacy_id || 'Unavailable'"
                            @focus="$event.target.select()"
                        />
                    </div>
                    <div class="metadata-field">
                        <span class="metadata-label">ancestry_id</span>
                        <input
                            id="bottom_line_ancestry_id"
                            class="form-control"
                            type="text"
                            readonly
                            :value="selectedProvenance.ancestry_id || 'Unavailable'"
                            @focus="$event.target.select()"
                        />
                    </div>
                    <div class="metadata-field">
                        <label class="metadata-label" for="bottom_line_provenance_link">
                        provenance data link
                        </label>
                        <div class="link-copyable-input">
                            <input
                                id="bottom_line_provenance_link"
                                class="form-control"
                                type="text"
                                readonly
                                :value="selectedProvenanceLink"
                                @focus="$event.target.select()"
                            />
                            <button
                                class="copy-icon-button"
                                type="button"
                                aria-label="Copy provenance graph data link"
                                title="Copy provenance graph data link"
                                @click="copyProvenanceLink"
                            >
                                <b-icon-check v-if="copyMessage === 'Copied.'"></b-icon-check>
                                <b-icon-clipboard v-else></b-icon-clipboard>
                            </button>
                        </div>
                    </div>
                </div>
                <div v-if="copyMessage && copyMessage !== 'Copied.'" class="copy-message">{{ copyMessage }}</div>

                <div class="code-box-group">
                    <div class="metadata-label">provenance data</div>
                    <div class="provenance-tabs" role="tablist" aria-label="Provenance data view">
                        <button
                            class="provenance-tab"
                            :class="{ active: provenanceView === 'graph' }"
                            type="button"
                            role="tab"
                            :aria-selected="provenanceView === 'graph'"
                            @click="provenanceView = 'graph'"
                        >
                            Graph
                        </button>
                        <button
                            class="provenance-tab"
                            :class="{ active: provenanceView === 'table' }"
                            type="button"
                            role="tab"
                            :aria-selected="provenanceView === 'table'"
                            @click="provenanceView = 'table'"
                        >
                            Table
                        </button>
                        <button
                            class="provenance-tab"
                            :class="{ active: provenanceView === 'json' }"
                            type="button"
                            role="tab"
                            :aria-selected="provenanceView === 'json'"
                            @click="provenanceView = 'json'"
                        >
                            JSON
                        </button>
                    </div>
                    <div v-if="provenanceView === 'json'" class="provenance-code-wrap">
                        <button
                            class="copy-icon-button provenance-json-copy"
                            type="button"
                            aria-label="Copy provenance JSON"
                            title="Copy provenance JSON"
                            @click="copyProvenanceJson"
                        >
                            <b-icon-check v-if="copiedProvenanceJson"></b-icon-check>
                            <b-icon-clipboard v-else></b-icon-clipboard>
                        </button>
                        <pre class="provenance-code"><code>{{ formattedProvenanceJson }}</code></pre>
                    </div>
                    <provenance-table v-else-if="provenanceView === 'table'" :provenance="selectedProvenance.provenance"></provenance-table>
                    <provenance-graph v-else :provenance="selectedProvenance.provenance"></provenance-graph>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
import { BIconCheck, BIconClipboard, BIconDownload } from "bootstrap-vue";
import ProvenanceTable from "./ProvenanceTable.vue";
import ProvenanceGraph from "./ProvenanceGraph.vue";

const TRAIT_LIST_URL = "https://translator.broadinstitute.org/artifact_provenance/ws/bottom_line/trait_list_full";
const PROVENANCE_URL = "https://translator.broadinstitute.org/artifact_provenance/get_provenance?id=";
const BOTTOM_LINE_RESULTS_URL = "https://dig-open-bottom-line-analysis.s3.amazonaws.com/bottom-line";

export default {
    name: "BottomLineProvenance",
    props: {
        updateQueryParams: {
            type: Boolean,
            default: true,
        },
        showSearch: {
            type: Boolean,
            default: true,
        },
        showAncestrySelect: {
            type: Boolean,
            default: true,
        },
        showLinkBack: {
            type: Boolean,
            default: false,
        },
        showPageTitle: {
            type: Boolean,
            default: true,
        },
    },
    components: {
        BIconCheck,
        BIconClipboard,
        BIconDownload,
        ProvenanceTable,
        ProvenanceGraph,
    },
    data() {
        return {
            traits: [],
            searchText: "",
            loadingTraits: false,
            traitError: "",
            listExpanded: true,
            selectedTrait: null,
            selectedAncestry: null,
            selectedProvenance: null,
            loadingProvenance: false,
            provenanceError: "",
            copyMessage: "",
            provenanceView: "graph",
            copiedProvenanceJson: false,
            hoveredTraitKey: "",
        };
    },
    computed: {
        filteredTraits() {
            const query = this.searchText.trim().toLowerCase();

            if (!query) {
                return this.traits;
            }

            return this.traits.filter((trait) => {
                return this.traitName(trait).toLowerCase().includes(query);
            });
        },
        traitCountLabel() {
            const total = this.traits.length;

            if (!this.searchText.trim()) {
                return `${total.toLocaleString()} traits`;
            }

            return `${this.filteredTraits.length.toLocaleString()} of ${total.toLocaleString()} matches`;
        },
        showTraitList() {
            if (!this.showSearch) {
                return false;
            }

            if (!this.selectedTrait) {
                return true;
            }

            return this.listExpanded && (this.loadingTraits || this.filteredTraits.length > 0 || !!this.traitError || !!this.searchText);
        },
        selectedTraitAncestries() {
            return this.selectedTrait ? this.traitAncestries(this.selectedTrait) : [];
        },
        visibleSelectedTraitAncestries() {
            if (this.showAncestrySelect) {
                return this.selectedTraitAncestries;
            }

            return this.selectedAncestry ? [this.selectedAncestry] : [];
        },
        selectedTitle() {
            if (!this.selectedTrait) {
                return "";
            }

            const traitName = this.selectedAncestry && this.selectedAncestry.trait_name
                ? this.selectedAncestry.trait_name
                : this.traitName(this.selectedTrait);
            if (!this.selectedAncestry) {
                return traitName;
            }

            return traitName;
        },
        selectedProvenanceLink() {
            if (!this.selectedAncestry || !this.selectedAncestry.id) {
                return "";
            }

            return `${PROVENANCE_URL}${encodeURIComponent(this.selectedAncestry.id)}`;
        },
        formattedProvenanceJson() {
            const provenance = this.selectedProvenance && this.selectedProvenance.provenance
                ? this.selectedProvenance.provenance
                : {};

            return JSON.stringify(provenance, null, 2);
        },
        bottomLineResultsUrl() {
            if (!this.selectedAncestry) {
                return "";
            }

            const traitLegacyId = this.selectedProvenance && this.selectedProvenance.trait_legacy_id
                ? this.selectedProvenance.trait_legacy_id
                : this.selectedTrait.legacy_id;
            const selectedAncestry = this.selectedAncestry.ancestry_name || this.selectedAncestry.ancestry_id;
            const ancestryDirectory = this.isMixedAncestry(this.selectedAncestry) ? "Mixed" : selectedAncestry;

            if (!traitLegacyId || !ancestryDirectory) {
                return "";
            }

            return `${BOTTOM_LINE_RESULTS_URL}/${encodeURIComponent(ancestryDirectory)}/${encodeURIComponent(traitLegacyId)}.sumstats.tsv.gz`;
        },
        standaloneProvenanceUrl() {
            const traitLegacyId = this.selectedTrait && this.selectedTrait.legacy_id;

            if (!traitLegacyId) {
                return "/bottom-line.html";
            }

            const parameters = new URLSearchParams({ trait: traitLegacyId });
            if (this.selectedAncestry && !this.isMixedAncestry(this.selectedAncestry)) {
                parameters.set("ancestry", this.selectedAncestry.ancestry_id);
            }

            return `/bottom-line.html?${parameters.toString()}`;
        },
    },
    created() {
        this.loadTraits();
        document.addEventListener("click", this.closeTraitListOnOutsideClick);
        window.addEventListener("popstate", this.applySelectionFromQuery);
    },
    beforeDestroy() {
        document.removeEventListener("click", this.closeTraitListOnOutsideClick);
        window.removeEventListener("popstate", this.applySelectionFromQuery);
    },
    methods: {
        async loadTraits() {
            this.loadingTraits = true;
            this.traitError = "";

            try {
                const response = await fetch(TRAIT_LIST_URL);

                if (!response.ok) {
                    throw new Error(`Trait list request failed with ${response.status}`);
                }

                const traits = await response.json();
                this.traits = Array.isArray(traits) ? traits : [];
                await this.applySelectionFromQuery();
            } catch (error) {
                this.traitError = "Unable to load the bottom-line trait list.";
                // eslint-disable-next-line no-console
                console.error(error);
            } finally {
                this.loadingTraits = false;
            }
        },
        async selectAncestry(trait, ancestry, updateQuery = true) {
            if (!ancestry || !ancestry.id) {
                return;
            }

            this.selectedTrait = trait;
            this.selectedAncestry = ancestry;
            this.selectedProvenance = null;
            this.provenanceError = "";
            this.copyMessage = "";
            this.copiedProvenanceJson = false;
            this.provenanceView = "graph";
            this.listExpanded = false;
            this.loadingProvenance = true;

            if (updateQuery) {
                this.updateSelectionQuery(trait, ancestry);
            }

            try {
                const response = await fetch(this.selectedProvenanceLink);

                if (!response.ok) {
                    throw new Error(`Provenance request failed with ${response.status}`);
                }

                this.selectedProvenance = await response.json();
            } catch (error) {
                this.provenanceError = "Unable to load provenance for this ancestry.";
                // eslint-disable-next-line no-console
                console.error(error);
            } finally {
                this.loadingProvenance = false;
            }
        },
        selectDefaultAncestry(trait) {
            const ancestry = this.defaultAncestry(trait);

            if (ancestry) {
                this.selectAncestry(trait, ancestry);
            }
        },
        openTraitList() {
            this.listExpanded = true;
        },
        clearAndCloseTraitList() {
            this.searchText = "";
            this.listExpanded = false;
        },
        closeTraitListOnOutsideClick(event) {
            if (this.selectedTrait && this.$refs.traitPicker && !this.$refs.traitPicker.contains(event.target)) {
                this.listExpanded = false;
            }
        },
        async applySelectionFromQuery() {
            const parameters = new URLSearchParams(window.location.search);
            const usesPhenotype = parameters.has("phenotype");
            const traitLegacyId = usesPhenotype ? parameters.get("phenotype") : parameters.get("trait");
            const ancestryId = parameters.get("ancestry");

            if (!traitLegacyId) {
                this.resetSelection();
                if (ancestryId) {
                    parameters.delete("ancestry");
                    this.replaceQuery(parameters);
                }
                return;
            }

            const trait = this.traits.find((item) => item.legacy_id === traitLegacyId);
            if (!trait) {
                this.resetSelection();
                return;
            }

            this.selectedTrait = trait;
            this.selectedAncestry = null;
            this.selectedProvenance = null;
            this.provenanceError = "";
            this.copyMessage = "";
            this.copiedProvenanceJson = false;
            this.provenanceView = "graph";
            this.listExpanded = false;

            let ancestry = ancestryId
                ? this.traitAncestries(trait).find((item) => item.ancestry_id === ancestryId)
                : this.defaultAncestry(trait);
            if (ancestryId && !ancestry) {
                parameters.delete("ancestry");
                this.replaceQuery(parameters);
                ancestry = this.defaultAncestry(trait);
            }

            if (ancestry && this.isMixedAncestry(ancestry) && ancestryId) {
                parameters.delete("ancestry");
                this.replaceQuery(parameters);
            }

            if (ancestry) {
                await this.selectAncestry(trait, ancestry, false);
            }
        },
        updateSelectionQuery(trait, ancestry) {
            const parameters = new URLSearchParams(window.location.search);
            const traitParameter = parameters.has("phenotype") ? "phenotype" : "trait";

            parameters.set(traitParameter, trait.legacy_id);
            if (traitParameter === "phenotype") {
                parameters.delete("trait");
            }
            if (this.isMixedAncestry(ancestry)) {
                parameters.delete("ancestry");
            } else {
                parameters.set("ancestry", ancestry.ancestry_id);
            }
            this.pushQuery(parameters);
        },
        resetSelection() {
            this.selectedTrait = null;
            this.selectedAncestry = null;
            this.selectedProvenance = null;
            this.provenanceError = "";
            this.copyMessage = "";
            this.copiedProvenanceJson = false;
            this.provenanceView = "graph";
            this.listExpanded = true;
        },
        pushQuery(parameters) {
            if (!this.updateQueryParams) {
                return;
            }

            window.history.pushState({}, "", this.queryUrl(parameters));
        },
        replaceQuery(parameters) {
            if (!this.updateQueryParams) {
                return;
            }

            window.history.replaceState({}, "", this.queryUrl(parameters));
        },
        queryUrl(parameters) {
            const query = parameters.toString();
            return `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
        },
        traitName(trait) {
            return trait.name || trait.description || trait.legacy_id || "Untitled trait";
        },
        traitKey(trait) {
            return trait.kpn_id || trait.legacy_id || this.traitName(trait);
        },
        traitAncestries(trait) {
            return Array.isArray(trait.ancestries) ? trait.ancestries : [];
        },
        defaultAncestry(trait) {
            const ancestries = this.traitAncestries(trait);

            return ancestries.find((ancestry) => this.isMixedAncestry(ancestry)) || ancestries[0] || null;
        },
        isMixedAncestry(ancestry) {
            const identifier = ancestry.ancestry_id || ancestry.ancestry_name || "";

            return identifier.toLowerCase() === "mixed";
        },
        highlightTraitName(trait) {
            const name = this.escapeHtml(this.traitName(trait));
            const query = this.searchText.trim();

            if (!query) {
                return name;
            }

            const pattern = new RegExp(`(${this.escapeRegExp(query)})`, "ig");
            return name.replace(pattern, "<mark>$1</mark>");
        },
        isSelectedAncestry(ancestry) {
            return !!this.selectedAncestry && this.selectedAncestry.id === ancestry.id;
        },
        copyProvenanceLink() {
            if (!this.selectedProvenanceLink) {
                return;
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(this.selectedProvenanceLink).then(() => {
                    this.copyMessage = "Copied.";
                }).catch(() => {
                    this.copyMessage = "Select the link text to copy.";
                });
            } else {
                this.copyMessage = "Select the link text to copy.";
            }
        },
        copyProvenanceJson() {
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                return;
            }

            navigator.clipboard.writeText(this.formattedProvenanceJson).then(() => {
                this.copiedProvenanceJson = true;
            }).catch(() => {
                this.copiedProvenanceJson = false;
            });
        },
        escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, (character) => {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                }[character];
            });
        },
        escapeRegExp(value) {
            return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        },
    },
};
</script>

<style scoped>
.bottom-line-provenance {
    color: #222;
}

.page-heading {
    display: flex;
    gap: 16px;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 18px;
}

.page-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
}

.provenance-page-link {
    margin-left: auto;
    white-space: nowrap;
}

.trait-picker {
    position: relative;
}

.metadata-label {
    display: block;
    margin-bottom: 6px;
    color: #555;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
}

.search-control {
    display: flex;
    align-items: center;
    width: 100%;
}

.search-label{
    font-weight: bold;
    font-size: 1rem;
    line-height: 1.5;
    background: #175a9c;
    color: white;
    height: calc(1.5em + 0.75rem + 3px);
    padding: 0.375rem 0.75rem;
    border-radius: 5px 0 0 5px;
}

.search-input-wrap {
    position: relative;
    min-width: 0;
    flex: 1 1 auto;
}

.trait-search {
    padding-right: 40px;
    height: calc(1.5em + 0.75rem + 3px);
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #495057;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid #175a9c;
    border-right: 0;
    border-radius: 0;
}

.clear-search {
    position: absolute;
    top: 50%;
    right: 6px;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: #edf1f5;
    color: #666;
    font-size: 21px;
    line-height: 1;
    transform: translateY(-50%);
    cursor: pointer;
}

.clear-search:hover,
.clear-search:focus {
    background: #dce5ee;
    color: #222;
}

.trait-count {
    flex: 0 0 auto;
    color: #555;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    white-space: nowrap;
    height: calc(1.5em + 0.75rem + 3px);
    padding: 0.375rem 0.75rem;
    border-radius: 0 5px 5px 0;
    background: #eee;
    border: 1px solid #175a9c;
    border-left: 0;
}

.trait-list {
    max-height: 420px;
    margin-top: 12px;
    overflow-y: scroll;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
}

.trait-list.dropdown-list {
    position: absolute;
    right: 0;
    left: 0;
    z-index: 20;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.16);
}

.trait-list-columns {
    position: sticky;
    top: 0;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    padding: 8px 14px;
    border-bottom: 1px solid #eee;
    background: #fff;
    color: #555;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
}

.trait-list-columns span:last-child {
    text-align: right;
}

.trait-list-item {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid #eee;
}

.trait-list-item:last-child {
    border-bottom: 0;
}

.trait-name {
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
}

.trait-name:hover,
.trait-name:focus {
    color: #175a9c;
    text-decoration: underline;
}

.trait-name >>> mark {
    padding: 0 2px;
    background: #fff2a8;
}

.ancestry-pill-group,
.ancestry-switcher {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
}

.ancestry-pill {
    border: 1px solid #8ba7c8;
    border-radius: 999px;
    padding: 5px 12px;
    background: #f3f7fb;
    color: #20517f;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.2;
    cursor: pointer;
}

.ancestry-pill:hover,
.ancestry-pill:focus {
    border-color: #426f9f;
    background: #e4eef8;
}

.ancestry-pill.selected {
    border-color: #175a9c;
    background: #175a9c;
    color: #fff;
}

.ancestry-pill:disabled {
    cursor: default;
}

.ancestry-pill.highlighted-default {
    border-color: #20517f;
    background: #cfe5fb;
    color: #123f66;
    box-shadow: inset 0 0 0 1px #8eb9e4;
}

.trait-list-status {
    padding: 16px;
    color: #666;
}

.provenance-detail {
    margin-top: 20px;
    border: 1px solid #ccc;
    padding: 20px;
    border-radius: 10px;
    background: #fafafa;
}

.detail-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
}

.detail-header h3 {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
}

.detail-subtitle {
    margin: 8px 0 0;
    color: #555;
    font-size: 16px;
}

.detail-loading {
    color: #666;
    white-space: nowrap;
}

.ancestry-switcher {
    justify-content: flex-start;
}

.selected-ancestry-group {
    margin-top: 16px;
}

.ancestry-actions {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
}

.ancestry-selector-group {
    min-width: 0;
}

.download-results-group {
    flex: 0 0 auto;
}

.results-ancestry {
    font-weight: 400;
    letter-spacing: normal;
    text-transform: none;
}

.download-results-button,
.download-results-button:hover,
.download-results-button:focus {
    padding: 5px 12px;
    color: #fff !important;
    font-size: 13px;
    line-height: 1.2;
    border-color: #175a9c;
    background: #175a9c;
}

.ancestry-selection-note {
    margin: 18px 0 0;
    color: #555;
}

.provenance-description {
    margin-top: 22px;
    color: #555;
}

.provenance-metadata-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(240px, 2fr);
    gap: 14px;
    margin-top: 22px;
}

.metadata-field {
    min-width: 0;
}

.metadata-field > .form-control {
    width: 100%;
    font-family: Menlo, Consolas, monospace;
    font-size: 13px;
}

.code-box-group {
    margin-top: 22px;
}

.provenance-tabs {
    display: flex;
    gap: 2px;
    margin-bottom: 10px;
    border-bottom: 1px solid #d7d7d7;
}

.provenance-tab {
    padding: 7px 11px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #555;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.provenance-tab:hover,
.provenance-tab:focus {
    color: #20517f;
}

.provenance-tab.active {
    border-bottom-color: #20517f;
    color: #20517f;
}

.provenance-tab:disabled {
    color: #999;
    cursor: not-allowed;
}

.link-row {
    display: flex;
    gap: 8px;
}

.link-copyable-input {
    position: relative;
    min-width: 0;
    flex: 1 1 auto;
}

.link-copyable-input input {
    width: 100%;
    padding-right: 40px;
    font-family: Menlo, Consolas, monospace;
    font-size: 13px;
}

.copy-icon-button {
    position: absolute;
    top: 50%;
    right: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: #20517f;
    transform: translateY(-50%);
    cursor: pointer;
}

.copy-icon-button:hover,
.copy-icon-button:focus {
    background: #e4f1ff;
    color: #123f66;
}

.copy-message {
    margin-top: 6px;
    color: #555;
    font-size: 13px;
}

.provenance-code {
    max-height: 520px;
    margin: 0;
    padding: 42px 16px 16px;
    overflow: auto;
    border: 1px solid #d7d7d7;
    border-radius: 4px;
    background: #f7f7f7;
    color: #242424;
    font-size: 13px;
}

.provenance-code-wrap {
    position: relative;
}

.provenance-json-copy {
    top: 8px;
    right: 8px;
    transform: none;
}

@media (max-width: 767px) {
    .search-control {
        flex-wrap: wrap;
    }

    .search-input-wrap {
        flex-basis: calc(100% - 42px);
    }

    .trait-count {
        width: 100%;
    }

    .trait-list-item,
    .detail-header,
    .link-row {
        display: block;
    }

    .ancestry-pill-group {
        justify-content: flex-start;
        margin-top: 10px;
    }

    .ancestry-actions {
        align-items: flex-start;
        flex-direction: column;
    }

    .provenance-metadata-row {
        grid-template-columns: 1fr;
    }

}
</style>
