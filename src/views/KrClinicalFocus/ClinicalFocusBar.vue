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
                        :list="diseaseReferenceDatalistId"
                        :placeholder="sourceInputPlaceholder"
                        @input="loadDiseaseReferenceSuggestions"
                        @keyup.enter="resolveSourceProfile"
                    />
                    <button type="button" @click="resolveSourceProfile">Resolve to HPO profile</button>
                </div>
                <datalist v-if="diseaseReferenceDatalistId" :id="diseaseReferenceDatalistId">
                    <option
                        v-for="reference in diseaseReferenceSuggestions"
                        :key="`${reference.source}:${reference.sourceId}`"
                        :value="reference.label"
                    />
                </datalist>
                <p v-if="sourceInputHelp">{{ sourceInputHelp }}</p>
            </div>

            <div v-if="hasEditableFocusSource" class="glens-clinical-focus-draft-head">
                <span>
                    Total {{ draftTermCount }} HPO terms
                    <small v-if="draftPreviewCount < draftTermCount"> · showing {{ draftPreviewCount }} preview terms</small>
                </span>
            </div>
            <div v-if="hasEditableFocusSource" class="glens-clinical-focus-term-list">
                <div class="glens-clinical-focus-term-head">
                    <span>HPO term</span>
                    <span>HPO ID</span>
                    <span></span>
                </div>
                <div
                    v-for="term in draft.hpoTerms"
                    :key="term.id"
                    class="glens-clinical-focus-term-row"
                >
                    <span>{{ term.label }}</span>
                    <code>{{ term.id }}</code>
                    <button type="button" @click="removeTerm(term.id)">Remove</button>
                </div>
            </div>
            <div v-if="hasEditableFocusSource" class="glens-clinical-focus-add">
                <input
                    v-model.trim="newTerm"
                    type="text"
                    placeholder="Add HPO term, e.g. HP:0001250 Seizure"
                    @keyup.enter="addTerm"
                />
                <button type="button" @click="addTerm">Add term</button>
            </div>
            <p v-else class="glens-clinical-focus-no-source">
                No clinical context will be used. Search results will open in discovery mode and suggest contexts worth checking.
            </p>
            <div class="glens-clinical-focus-editor-actions">
                <button type="button" @click="saveFocus">{{ focusSaveLabel }}</button>
                <button type="button" class="glens-clinical-focus-plain" @click="cancelEditor">
                    Cancel
                </button>
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
        const selectedSource = focus ? focus.source : "orphanet";
        const profile = mockFocusProfiles[selectedSource] || mockFocusProfiles.orphanet;
        return {
            focus,
            editorOpen: this.openEditorOnMount,
            selectedSource,
            sourceQuery: focus ? focus.sourceQuery || profile.queryExample : profile.queryExample,
            draft: focus || this.cloneProfile(profile),
            newTerm: "",
            unsubscribeFocus: null,
            diseaseReferenceModule: null,
            diseaseReferenceSuggestionsCache: [],
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
            return mockFocusProfiles[this.selectedSource] || mockFocusProfiles.orphanet;
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
            return this.draft.contextTermCount || this.draft.hpoTerms.length;
        },
        draftPreviewCount() {
            return this.draft.hpoTerms.length;
        },
        diseaseReferenceDatalistId() {
            return this.isDiseaseReferenceSource(this.selectedSource) ? `clinical-focus-${this.selectedSource}-references` : "";
        },
        diseaseReferenceSuggestions() {
            return this.diseaseReferenceSuggestionsCache;
        },
    },
    mounted() {
        this.unsubscribeFocus = onClinicalFocusChange((focus) => {
            this.focus = focus;
        });
    },
    beforeDestroy() {
        if (this.unsubscribeFocus) this.unsubscribeFocus();
    },
    methods: {
        cloneProfile(profile) {
            return {
                ...profile,
                hpoTerms: profile.hpoTerms.map((term) => ({ ...term })),
            };
        },
        isDiseaseReferenceSource(source) {
            return ["orphanet", "omim", "mondo", "decipher"].includes(source);
        },
        toggleEditor() {
            if (this.editorOpen) {
                this.editorOpen = false;
                return;
            }

            const profile = mockFocusProfiles[this.selectedSource] || mockFocusProfiles.orphanet;
            this.draft = this.focus ? this.cloneProfile(this.focus) : this.cloneProfile(profile);
            this.sourceQuery = this.focus ? this.focus.sourceQuery || profile.queryExample : profile.queryExample;
            this.editorOpen = true;
            this.loadDiseaseReferenceSuggestions();
        },
        loadSourceProfile() {
            const profile = this.activeSourceProfile;
            this.sourceQuery = profile.queryExample;
            this.draft = this.cloneProfile(profile);
            this.loadDiseaseReferenceSuggestions();
        },
        async resolveSourceProfile() {
            if (!this.hasEditableFocusSource) {
                this.draft = this.cloneProfile(mockFocusProfiles.none);
                return;
            }

            const profile = this.cloneProfile(this.activeSourceProfile);
            const query = this.sourceQuery || profile.queryExample;
            const cleanQuery = query.replace(/\s+/g, " ").trim();
            let reference = null;
            if (this.isDiseaseReferenceSource(profile.source)) {
                const diseaseReference = await this.loadDiseaseReferenceModule();
                reference = diseaseReference.findPortalDiseaseReference(cleanQuery, profile.source);
            }

            if (reference) {
                this.sourceQuery = reference.label;
                this.draft = this.profileFromDiseaseReference(profile, reference);
                return;
            }

            const resolvedLabel = this.resolvedFocusLabel(profile, cleanQuery);

            this.draft = {
                ...profile,
                label: resolvedLabel,
                sourceQuery: cleanQuery,
                sourceDetail: this.resolvedSourceDetail(profile.source),
            };
        },
        profileFromDiseaseReference(profile, reference) {
            const sourceQuery = reference.label || [reference.sourceId, reference.name].filter(Boolean).join(" · ");
            return {
                ...profile,
                label: sourceQuery,
                sourceId: reference.sourceId,
                rawId: reference.rawId,
                orphaId: reference.source === "orphanet" ? reference.sourceId : undefined,
                mondoId: reference.source === "mondo" ? reference.sourceId : undefined,
                decipherId: reference.source === "decipher" ? reference.sourceId : undefined,
                sourceQuery,
                contextTermCount: reference.hpoTermCount,
                linkedGeneCount: reference.linkedGeneCount,
                hpoTerms: (reference.hpoTerms || []).map((term) => ({ ...term })),
                sourceDetail:
                    "Resolved from the generated compact disease-reference index. The full disease profile count is preserved; the editable list shows preview HPO terms for the mock UI.",
            };
        },
        resolvedFocusLabel(profile, query) {
            if (!query) return profile.label;
            if (profile.source === "omim") return `${query} HPO profile`;
            if (profile.source === "orphanet") {
                return profile.label;
            }
            if (profile.source === "mondo") return `${query} HPO profile`;
            if (profile.source === "decipher") return `${query} HPO profile`;
            if (profile.source === "sample") return `${query} sample HPO profile`;
            if (profile.source === "investigator") return `${query} phenotype signature`;
            return profile.label;
        },
        resolvedSourceDetail(source) {
            if (source === "omim") {
                return "OMIM disease names are resolved to disease HPO annotations before comparison; the disease name itself is not used as the comparison vector.";
            }
            if (source === "orphanet") {
                return "Orphanet disease labels are resolved to disease HPO annotations before comparison.";
            }
            if (source === "mondo") {
                return "MONDO disease concepts are resolved through mapped disease references to an HPO profile before comparison.";
            }
            if (source === "decipher") {
                return "DECIPHER syndrome or disorder profiles are resolved to HPO phenotype terms before comparison.";
            }
            if (source === "sample") {
                return "The selected sample is resolved to that sample's observed HPO profile.";
            }
            if (source === "investigator") {
                return "The investigator group is resolved to an enriched HPO phenotype signature.";
            }
            return "Manual context uses the editable HPO terms below.";
        },
        async loadDiseaseReferenceModule() {
            if (this.diseaseReferenceModule) return this.diseaseReferenceModule;
            this.diseaseReferenceModule = await import("./portalDiseaseReferenceData.generated");
            return this.diseaseReferenceModule;
        },
        async loadDiseaseReferenceSuggestions() {
            if (!this.isDiseaseReferenceSource(this.selectedSource)) {
                this.diseaseReferenceSuggestionsCache = [];
                return;
            }
            const diseaseReference = await this.loadDiseaseReferenceModule();
            this.diseaseReferenceSuggestionsCache = diseaseReference.portalDiseaseReferenceSuggestions(
                this.selectedSource,
                200,
                this.sourceQuery
            );
        },
        removeTerm(termId) {
            this.draft.hpoTerms = this.draft.hpoTerms.filter((term) => term.id !== termId);
        },
        addTerm() {
            if (!this.newTerm) return;

            const match = this.newTerm.match(/(HP:\d{7})/);
            const id = match ? match[1] : `HP:MOCK${String(this.draft.hpoTerms.length + 1).padStart(3, "0")}`;
            const label = this.newTerm.replace(id, "").replace(/[\[\]]/g, "").trim() || "Manual HPO term";
            this.draft.hpoTerms.push({ id, label });
            this.newTerm = "";
        },
        saveFocus() {
            if (!this.hasEditableFocusSource) {
                clearClinicalFocus();
                this.editorOpen = false;
                this.$emit("focus-confirmed");
                return;
            }

            writeClinicalFocus({
                ...this.draft,
                sourceQuery: this.sourceQuery || this.draft.sourceQuery || this.draft.label,
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
