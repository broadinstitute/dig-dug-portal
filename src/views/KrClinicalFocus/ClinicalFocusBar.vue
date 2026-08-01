<template>
    <section class="glens-clinical-focus-bar" aria-label="Clinical context">
        <div v-if="!hideSummary" class="glens-clinical-focus-main">
            <div>
                <span v-if="!hideKicker" class="glens-clinical-focus-kicker">Clinical context</span>
                <strong v-if="hasFocus">{{ focus.label }} · {{ focusTermCount }} HPO terms</strong>
                <strong v-else>No context set</strong>
                <p v-if="!hasFocus && showNoFocusNote">
                    You can start without a context. The portal will suggest possible contexts from the result.
                </p>
                <p v-if="hasFocus">
                    Search results will be interpreted against this resolved HPO profile as clinical context until it is edited or cleared.
                </p>
            </div>
            <div class="glens-clinical-focus-actions">
                <button type="button" @click="toggleEditor">
                    {{ hasFocus ? "Edit context" : "Set context" }}
                </button>
                <button v-if="hasFocus" type="button" class="glens-clinical-focus-plain" @click="clearFocus">
                    Clear
                </button>
                <button
                    v-if="currentPhenotypeTerms.length"
                    type="button"
                    class="glens-clinical-focus-plain"
                    @click="useCurrentPhenotypeAsFocus"
                >
                    Use this phenotype search as context
                </button>
            </div>
        </div>

        <div v-if="editorOpen" class="glens-clinical-focus-editor">
            <div class="glens-clinical-focus-editor-grid">
                <section class="glens-clinical-focus-editor-column">
                    <div class="glens-clinical-focus-source-row">
                        <label for="clinical-focus-source">Context source</label>
                        <select id="clinical-focus-source" v-model="selectedSource" @change="loadSourceProfile">
                            <option v-for="source in sourceOptions" :key="source.key" :value="source.key">
                                {{ source.label }}
                            </option>
                        </select>
                    </div>

                    <div v-if="hasEditableFocusSource" class="glens-clinical-focus-source-input">
                        <label for="clinical-focus-query">{{ sourceInputLabel }}</label>
                        <div class="glens-clinical-focus-resolve-row">
                            <input
                                id="clinical-focus-query"
                                v-model.trim="sourceQuery"
                                type="text"
                                :placeholder="sourceInputPlaceholder"
                                @input="loadDiseaseReferenceSuggestions"
                                @keyup.enter="resolveSourceProfile"
                            />
                            <button v-if="isDiseaseReferenceSource(selectedSource)" type="button" @click="resolveSourceProfile">
                                Use disease profile
                            </button>
                        </div>
                        <div v-if="diseaseReferenceSuggestions.length" class="glens-clinical-focus-suggestions">
                            <button
                                v-for="reference in diseaseReferenceSuggestions"
                                :key="`${reference.source}:${reference.sourceId}`"
                                type="button"
                                @click="selectDiseaseReference(reference)"
                            >
                                <strong>{{ reference.name }}</strong>
                                <span>{{ reference.sourceId }} · {{ reference.hpoIds.length }} HPO terms</span>
                            </button>
                        </div>
                        <p v-if="sourceInputHelp">{{ sourceInputHelp }}</p>
                        <p v-if="resolutionError" class="glens-clinical-focus-error">{{ resolutionError }}</p>
                    </div>
                    <p v-else class="glens-clinical-focus-no-source">
                        No clinical context will be used. Search results will open in discovery mode.
                    </p>
                </section>

                <section v-if="hasEditableFocusSource" class="glens-clinical-focus-editor-column">
                    <div class="glens-clinical-focus-draft-head">
                        <span>Add HPO terms</span>
                        <small>{{ referenceStatus }}</small>
                    </div>
                    <div class="glens-clinical-focus-add">
                        <input
                            v-model.trim="hpoSearchQuery"
                            type="text"
                            placeholder="Search HPO name or ID, e.g. seizure or HP:0001250"
                            @input="searchHpoTerms"
                            @keyup.enter.prevent="addFirstHpoSearchResult"
                        />
                        <button type="button" :disabled="!hpoSearchResults.length" @click="addFirstHpoSearchResult">
                            Add term
                        </button>
                    </div>
                    <p class="glens-clinical-focus-hpo-help">
                        Add terms by name or exact HP identifier.
                    </p>
                    <div v-if="hpoSearchResults.length" class="glens-clinical-focus-hpo-results">
                        <button
                            v-for="term in hpoSearchResults"
                            :key="term.id"
                            type="button"
                            :disabled="isHpoSelected(term.id)"
                            @click="addHpoTerm(term.id)"
                        >
                            <strong>{{ term.label }}</strong>
                            <code>{{ term.id }}</code>
                        </button>
                    </div>
                </section>

                <section v-if="hasEditableFocusSource" class="glens-clinical-focus-editor-column">
                    <div class="glens-clinical-focus-draft-head glens-clinical-focus-selected-head">
                        <span>Selected HPO · {{ selectedTermCount }} / {{ draftTermCount }}</span>
                        <span class="glens-clinical-focus-bulk-actions">
                            <button type="button" @click="selectAllTerms">All</button>
                            <button type="button" @click="selectNoTerms">None</button>
                        </span>
                    </div>
                    <div class="glens-clinical-focus-term-list">
                        <div
                            v-for="term in draft.hpoTerms"
                            :key="term.id"
                            class="glens-clinical-focus-term-row"
                        >
                            <label>
                                <input
                                    type="checkbox"
                                    :checked="!isTermExcluded(term.id)"
                                    @change="toggleTermSelection(term.id, $event.target.checked)"
                                />
                                <span>
                                    <strong>{{ term.label }}</strong>
                                    <code>{{ term.id }}</code>
                                </span>
                            </label>
                            <button type="button" @click="removeTerm(term.id)">Remove</button>
                        </div>
                        <p v-if="!draft.hpoTerms.length" class="glens-clinical-focus-empty">
                            Add HPO terms from the middle column.
                        </p>
                    </div>
                </section>
            </div>
            <div class="glens-clinical-focus-editor-actions">
                <button
                    v-if="hasFocus"
                    type="button"
                    class="glens-clinical-focus-clear"
                    @click="clearFocus"
                >
                    Clear context
                </button>
                <button type="button" class="glens-clinical-focus-plain" @click="cancelEditor">
                    Cancel
                </button>
                <button type="button" @click="saveFocus">{{ focusSaveLabel }}</button>
            </div>
        </div>
    </section>
</template>

<script>
import { clearClinicalFocus, readClinicalFocus, writeClinicalFocus, onClinicalFocusChange } from "./focusStore";
import { createFocusFromTerms, focusSourceOptions, mockFocusProfiles } from "./mockFocusData";
import { hasClinicalFocus } from "./focusComparison";
import "./style.css";

export default {
    name: "ClinicalFocusBar",
    props: {
        showNoFocusNote: {
            type: Boolean,
            default: false,
        },
        currentPhenotypeTerms: {
            type: Array,
            default: () => [],
        },
        hideKicker: {
            type: Boolean,
            default: false,
        },
        openEditorOnMount: {
            type: Boolean,
            default: false,
        },
        hideSummary: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        const focus = readClinicalFocus();
        const allowedSource = focusSourceOptions.some((source) => focus && source.key === focus.source);
        const selectedSource = allowedSource ? focus.source : "orphanet";
        const profile = mockFocusProfiles[selectedSource] || mockFocusProfiles.orphanet;
        return {
            focus,
            editorOpen: this.openEditorOnMount,
            selectedSource,
            sourceQuery: focus ? focus.sourceQuery || profile.queryExample : profile.queryExample,
            draft: focus ? this.cloneProfile(focus) : this.cloneProfile(profile),
            unsubscribeFocus: null,
            referenceModule: null,
            referencePromise: null,
            referenceLoading: false,
            referenceLoaded: false,
            hpoTermsById: null,
            hpoSearchQuery: "",
            hpoSearchResultsCache: [],
            diseaseReferenceSuggestionsCache: [],
            resolutionError: "",
            excludedHpoIds: [],
        };
    },
    computed: {
        hasFocus() {
            return hasClinicalFocus(this.focus);
        },
        focusTermCount() {
            if (!this.focus) return 0;
            return this.focus.contextTermCount || this.focus.hpoTerms.length;
        },
        sourceOptions() {
            return focusSourceOptions;
        },
        activeSourceProfile() {
            return mockFocusProfiles[this.selectedSource] || mockFocusProfiles.manual;
        },
        hasEditableFocusSource() {
            return this.selectedSource !== "none";
        },
        focusSaveLabel() {
            return "Confirm";
        },
        sourceInputLabel() {
            return this.activeSourceProfile.sourceInputLabel;
        },
        sourceInputPlaceholder() {
            return this.activeSourceProfile.sourceInputPlaceholder;
        },
        sourceInputHelp() {
            return this.activeSourceProfile.sourceInputHelp;
        },
        draftTermCount() {
            return this.draft.hpoTerms.length;
        },
        selectedDraftTerms() {
            return this.draft.hpoTerms.filter((term) => !this.excludedHpoIds.includes(term.id));
        },
        selectedTermCount() {
            return this.selectedDraftTerms.length;
        },
        diseaseReferenceSuggestions() {
            return this.diseaseReferenceSuggestionsCache;
        },
        hpoSearchResults() {
            return this.hpoSearchResultsCache;
        },
        referenceStatus() {
            if (this.referenceLoading) return "Loading ontology…";
            if (this.referenceLoaded) return "HPO ontology loaded";
            return "Loads when opened";
        },
    },
    mounted() {
        this.unsubscribeFocus = onClinicalFocusChange((focus) => {
            this.focus = focus;
        });
        if (this.editorOpen) this.loadReferenceData();
    },
    beforeDestroy() {
        if (this.unsubscribeFocus) this.unsubscribeFocus();
    },
    methods: {
        cloneProfile(profile) {
            return {
                ...profile,
                hpoTerms: (profile.hpoTerms || []).map((term) => ({ ...term })),
            };
        },
        isDiseaseReferenceSource(source) {
            return ["orphanet", "mondo"].includes(source);
        },
        async toggleEditor() {
            if (this.editorOpen) {
                this.editorOpen = false;
                return;
            }

            const profile = mockFocusProfiles[this.selectedSource] || mockFocusProfiles.manual;
            this.draft = this.focus ? this.cloneProfile(this.focus) : this.cloneProfile(profile);
            this.sourceQuery = this.focus ? this.focus.sourceQuery || profile.queryExample : profile.queryExample;
            this.excludedHpoIds = [];
            this.editorOpen = true;
            await this.loadReferenceData();
            await this.loadDiseaseReferenceSuggestions();
        },
        async loadSourceProfile() {
            const profile = this.activeSourceProfile;
            this.sourceQuery = profile.queryExample;
            this.draft = this.cloneProfile(profile);
            this.excludedHpoIds = [];
            this.resolutionError = "";
            this.diseaseReferenceSuggestionsCache = [];
            if (this.hasEditableFocusSource) await this.loadReferenceData();
        },
        async resolveSourceProfile() {
            if (!this.hasEditableFocusSource) {
                this.draft = this.cloneProfile(mockFocusProfiles.none);
                this.excludedHpoIds = [];
                return;
            }

            if (!this.isDiseaseReferenceSource(this.selectedSource)) return;
            await this.loadDiseaseReferenceSuggestions();
            const reference = this.diseaseReferenceSuggestionsCache[0];
            if (!reference) {
                this.resolutionError = "No matching disease profile. Search by disease name or source ID.";
                return;
            }
            this.selectDiseaseReference(reference);
        },
        profileFromDiseaseReference(profile, reference) {
            const sourceQuery = `${reference.sourceId} · ${reference.name}`;
            return {
                ...profile,
                label: sourceQuery,
                sourceId: reference.sourceId,
                orphaId: reference.source === "orphanet" ? reference.sourceId : undefined,
                mondoId: reference.source === "mondo" ? reference.sourceId : undefined,
                sourceQuery,
                contextTermCount: reference.hpoIds.length,
                hpoTerms: reference.hpoIds
                    .filter((id) => this.hpoTermsById.has(id))
                    .map((id) => ({ id, label: this.hpoTermsById.get(id) })),
                sourceDetail: this.resolvedSourceDetail(reference.source),
            };
        },
        resolvedSourceDetail(source) {
            if (source === "orphanet") {
                return "Orphanet disease annotations resolved to the complete available HPO profile.";
            }
            if (source === "mondo") {
                return "MONDO disease concept resolved through mapped Orphanet disease HPO annotations.";
            }
            return "HPO terms selected by term name or HP identifier.";
        },
        async loadReferenceData() {
            if (this.referenceModule) return this.referenceModule;
            if (this.referencePromise) return this.referencePromise;
            this.referenceLoading = true;
            this.referencePromise = import("./clinicalContextReference.generated").then((reference) => {
                this.referenceModule = reference;
                this.hpoTermsById = new Map(reference.hpoTerms);
                this.referenceLoaded = true;
                return reference;
            }).finally(() => {
                this.referenceLoading = false;
                this.referencePromise = null;
            });
            return this.referencePromise;
        },
        async loadDiseaseReferenceSuggestions() {
            if (!this.isDiseaseReferenceSource(this.selectedSource)) {
                this.diseaseReferenceSuggestionsCache = [];
                return;
            }
            const reference = await this.loadReferenceData();
            const query = this.sourceQuery.toLowerCase().replace(/\s+/g, " ").trim();
            if (query.length < 2) {
                this.diseaseReferenceSuggestionsCache = [];
                return;
            }

            const profiles = this.selectedSource === "orphanet"
                ? reference.orphanetProfiles
                : reference.mondoProfiles;
            const suggestions = [];
            for (const profile of profiles) {
                const [sourceId, name, hpoIds] = profile;
                if (!`${sourceId} ${name}`.toLowerCase().includes(query)) continue;
                suggestions.push({ source: this.selectedSource, sourceId, name, hpoIds });
                if (suggestions.length === 8) break;
            }
            this.diseaseReferenceSuggestionsCache = suggestions;
            this.resolutionError = "";
        },
        selectDiseaseReference(reference) {
            this.sourceQuery = `${reference.sourceId} · ${reference.name}`;
            this.draft = this.profileFromDiseaseReference(this.activeSourceProfile, reference);
            this.excludedHpoIds = [];
            this.diseaseReferenceSuggestionsCache = [];
            this.resolutionError = "";
        },
        async searchHpoTerms() {
            await this.loadReferenceData();
            const query = this.hpoSearchQuery.toLowerCase().trim();
            if (query.length < 2) {
                this.hpoSearchResultsCache = [];
                return;
            }

            const prefixMatches = [];
            const otherMatches = [];
            for (const [id, label] of this.referenceModule.hpoTerms) {
                const normalizedLabel = label.toLowerCase();
                if (id.toLowerCase().startsWith(query) || normalizedLabel.startsWith(query)) {
                    prefixMatches.push({ id, label });
                } else if (normalizedLabel.includes(query)) {
                    otherMatches.push({ id, label });
                }
                if (prefixMatches.length >= 12) break;
            }
            this.hpoSearchResultsCache = [...prefixMatches, ...otherMatches].slice(0, 12);
        },
        addHpoTerm(termId) {
            if (!this.hpoTermsById || !this.hpoTermsById.has(termId) || this.isHpoSelected(termId)) return;
            this.draft.hpoTerms.push({ id: termId, label: this.hpoTermsById.get(termId) });
            this.excludedHpoIds = this.excludedHpoIds.filter((id) => id !== termId);
            this.$set(this.draft, "contextTermCount", this.draft.hpoTerms.length);
            this.hpoSearchQuery = "";
            this.hpoSearchResultsCache = [];
        },
        async addFirstHpoSearchResult() {
            await this.searchHpoTerms();
            const term = this.hpoSearchResultsCache.find(({ id }) => !this.isHpoSelected(id));
            if (term) this.addHpoTerm(term.id);
        },
        removeTerm(termId) {
            this.draft.hpoTerms = this.draft.hpoTerms.filter((term) => term.id !== termId);
            this.excludedHpoIds = this.excludedHpoIds.filter((id) => id !== termId);
            this.$set(this.draft, "contextTermCount", this.draft.hpoTerms.length);
        },
        isHpoSelected(termId) {
            return this.draft.hpoTerms.some((term) => term.id === termId);
        },
        isTermExcluded(termId) {
            return this.excludedHpoIds.includes(termId);
        },
        toggleTermSelection(termId, checked) {
            this.excludedHpoIds = checked
                ? this.excludedHpoIds.filter((id) => id !== termId)
                : [...new Set([...this.excludedHpoIds, termId])];
        },
        selectAllTerms() {
            this.excludedHpoIds = [];
        },
        selectNoTerms() {
            this.excludedHpoIds = this.draft.hpoTerms.map((term) => term.id);
        },
        saveFocus() {
            if (!this.hasEditableFocusSource) {
                clearClinicalFocus();
                this.editorOpen = false;
                this.$emit("focus-confirmed");
                return;
            }

            if (!this.selectedDraftTerms.length) {
                this.resolutionError = "Select at least one HPO term before confirming context.";
                return;
            }

            const manualLabel = this.sourceQuery || "Selected HPO context";

            writeClinicalFocus({
                ...this.draft,
                label: this.selectedSource === "manual" ? manualLabel : this.draft.label,
                source: this.selectedSource,
                sourceQuery: this.sourceQuery || this.draft.sourceQuery || this.draft.label,
                hpoTerms: this.selectedDraftTerms.map((term) => ({ ...term })),
                contextTermCount: this.selectedDraftTerms.length,
            });
            this.editorOpen = false;
            this.$emit("focus-confirmed");
        },
        cancelEditor() {
            this.editorOpen = false;
            this.$emit("focus-cancelled");
        },
        clearFocus() {
            clearClinicalFocus();
            this.editorOpen = false;
            this.$emit("focus-confirmed");
        },
        useCurrentPhenotypeAsFocus() {
            writeClinicalFocus(createFocusFromTerms("Current phenotype search", this.currentPhenotypeTerms));
            this.editorOpen = false;
            this.$emit("focus-confirmed");
        },
    },
};
</script>
