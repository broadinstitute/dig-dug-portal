<template>
    <div class="vks-session-params" ref="root">
        <div class="vks-session-params-bubbles" role="group" aria-label="Search parameters">
            <button
                v-for="bubble in bubbles"
                :key="bubble.id"
                type="button"
                class="vks-session-param-bubble"
                :class="{ 'is-open': openParam === bubble.id }"
                :aria-expanded="openParam === bubble.id ? 'true' : 'false'"
                :aria-controls="openParam === bubble.id ? panelId : null"
                :aria-label="`Change ${bubble.title}: ${bubble.value}`"
                :title="`Change ${bubble.title}`"
                @click="toggleParam(bubble.id)"
            >
                <span class="vks-session-param-bubble-value">{{ bubble.value }}</span>
            </button>
        </div>

        <div
            v-if="openParam"
            :id="panelId"
            class="vks-session-param-panel"
            role="dialog"
            :aria-label="activePanelTitle"
        >
            <header class="vks-session-param-panel-head">
                <h3 class="vks-session-param-panel-title">{{ activePanelTitle }}</h3>
                <button
                    type="button"
                    class="vks-session-param-panel-close"
                    aria-label="Close"
                    @click="closePanel"
                >
                    ×
                </button>
            </header>

            <div v-if="openParam === 'project'" class="vks-session-param-panel-body">
                <label class="vks-session-param-label" :for="projectSelectId">Project</label>
                <select
                    :id="projectSelectId"
                    v-model="draftProjectId"
                    class="vks-session-param-select"
                >
                    <option
                        v-for="project in projectOptions"
                        :key="project.id || 'default'"
                        :value="project.id"
                    >
                        {{ project.label }}
                    </option>
                </select>
                <template v-if="draftUsesTokenSearch">
                    <label class="vks-session-param-label" :for="tokenInputId">
                        Token
                    </label>
                    <input
                        :id="tokenInputId"
                        v-model="draftToken"
                        type="text"
                        class="vks-session-param-input"
                        autocomplete="off"
                        spellcheck="false"
                        placeholder="GWAS-CE access token"
                    />
                </template>
            </div>

            <div v-else-if="openParam === 'phenotype'" class="vks-session-param-panel-body">
                <label class="vks-session-param-label" :for="phenotypeInputId">
                    Phenotype
                </label>
                <div class="vks-session-param-typeahead">
                    <input
                        :id="phenotypeInputId"
                        v-model="phenotypeQuery"
                        type="text"
                        class="vks-session-param-input"
                        autocomplete="off"
                        placeholder="Search phenotype"
                        @focus="phenotypeListOpen = true"
                        @input="onPhenotypeInput"
                    />
                    <div
                        v-if="phenotypeListOpen && phenotypeSuggestions.length"
                        class="vks-session-param-suggestions"
                        role="listbox"
                    >
                        <button
                            v-for="phenotype in phenotypeSuggestions"
                            :key="phenotype.name"
                            type="button"
                            class="vks-session-param-suggestion"
                            role="option"
                            @mousedown.prevent="selectPhenotype(phenotype)"
                        >
                            <span class="vks-session-param-suggestion-label">
                                {{ phenotypeSuggestionLabel(phenotype) }}
                            </span>
                            <span
                                v-if="phenotypeSuggestionMeta(phenotype)"
                                class="vks-session-param-suggestion-meta"
                            >
                                {{ phenotypeSuggestionMeta(phenotype) }}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div v-else-if="openParam === 'ancestry'" class="vks-session-param-panel-body">
                <label class="vks-session-param-label" :for="ancestrySelectId">
                    Ancestry
                </label>
                <select
                    :id="ancestrySelectId"
                    v-model="draftAncestry"
                    class="vks-session-param-select"
                >
                    <option
                        v-for="ancestry in ancestryOptions"
                        :key="ancestry"
                        :value="ancestry"
                    >
                        {{ ancestryLabel(ancestry) }}
                    </option>
                </select>
            </div>

            <div v-else-if="openParam === 'region'" class="vks-session-param-panel-body">
                <label class="vks-session-param-label" :for="locusInputId">
                    Gene, variant, or region
                </label>
                <div class="vks-session-param-typeahead">
                    <input
                        :id="locusInputId"
                        v-model="locusQuery"
                        type="text"
                        class="vks-session-param-input"
                        autocomplete="off"
                        placeholder="e.g. FTO, rs7903146, 16:53700000-54200000"
                        @focus="onLocusFocus"
                        @input="onLocusInput"
                    />
                    <div
                        v-if="geneListOpen && geneSuggestions.length"
                        class="vks-session-param-suggestions"
                        role="listbox"
                    >
                        <button
                            v-for="gene in geneSuggestions"
                            :key="gene"
                            type="button"
                            class="vks-session-param-suggestion"
                            role="option"
                            @mousedown.prevent="selectGene(gene)"
                        >
                            {{ gene }}
                        </button>
                    </div>
                </div>
                <label class="vks-session-param-label" :for="expandSelectId">
                    Region expand
                </label>
                <select
                    :id="expandSelectId"
                    v-model="draftExpandBp"
                    class="vks-session-param-select"
                >
                    <option
                        v-for="option in regionExpandOptions"
                        :key="String(option.value)"
                        :value="option.value"
                    >
                        {{ option.label }}
                    </option>
                </select>
            </div>

            <p v-if="errorMessage" class="vks-session-param-error" role="alert">
                {{ errorMessage }}
            </p>

            <footer class="vks-session-param-panel-footer">
                <button type="button" class="vks-session-param-cancel" @click="closePanel">
                    Cancel
                </button>
                <button
                    type="button"
                    class="vks-session-param-apply"
                    :disabled="applying"
                    @click="onApply"
                >
                    {{ applying ? "Updating…" : "Apply & search" }}
                </button>
            </footer>
        </div>
    </div>
</template>

<script>
import {
    REGION_EXPAND_OPTIONS,
    ancestryLabel,
    filterPhenotypes,
    formatRegion,
    isGeneLookupQuery,
    lookupGeneMatches,
    resolveGeneOrVariantToRegion,
} from "./variantSifterSearchUtils.js";
import {
    getProjectConfig,
    listVksProjects,
    normalizeGwasCeToken,
    normalizeProjectId,
    projectAncestryOptions,
    projectHidesAncestry,
    projectPhenotypes,
    projectUsesTokenSearch,
    VKS_PROJECT_DEFAULT_ID,
} from "./variantSifterProjects.js";
import {
    activeRegionTrimmedMessage,
    ensureRegionWithinActiveDataLimit,
} from "./variantSifterRegionPan.js";

let paramFieldCounter = 0;
const GENE_LOOKUP_DEBOUNCE_MS = 200;

export default {
    name: "VariantSifterSessionParamBubbles",
    props: {
        searchSession: {
            type: Object,
            required: true,
        },
        projectId: {
            type: String,
            default: VKS_PROJECT_DEFAULT_ID,
        },
        phenotypesInUse: {
            type: Array,
            default: () => [],
        },
        utils: {
            type: Object,
            default: null,
        },
        bioIndexHost: {
            type: String,
            default: "",
        },
    },
    data() {
        paramFieldCounter += 1;
        const suffix = paramFieldCounter;
        return {
            panelId: `vks-session-param-panel-${suffix}`,
            projectSelectId: `vks-session-param-project-${suffix}`,
            tokenInputId: `vks-session-param-token-${suffix}`,
            phenotypeInputId: `vks-session-param-phenotype-${suffix}`,
            ancestrySelectId: `vks-session-param-ancestry-${suffix}`,
            locusInputId: `vks-session-param-locus-${suffix}`,
            expandSelectId: `vks-session-param-expand-${suffix}`,
            openParam: null,
            draftProjectId: VKS_PROJECT_DEFAULT_ID,
            draftToken: "",
            draftAncestry: "Mixed",
            draftExpandBp: null,
            selectedPhenotype: null,
            phenotypeQuery: "",
            phenotypeListOpen: false,
            locusQuery: "",
            geneListOpen: false,
            geneSuggestions: [],
            geneSuggestionSuppressed: false,
            geneLookupToken: 0,
            geneLookupTimer: null,
            errorMessage: "",
            applying: false,
            regionExpandOptions: REGION_EXPAND_OPTIONS,
        };
    },
    computed: {
        projectOptions() {
            return listVksProjects();
        },
        draftUsesTokenSearch() {
            return projectUsesTokenSearch(this.draftProjectId);
        },
        draftPhenotypes() {
            return projectPhenotypes(this.draftProjectId, this.phenotypesInUse || []);
        },
        ancestryOptions() {
            return projectAncestryOptions(this.projectId);
        },
        phenotypeSuggestions() {
            return filterPhenotypes(this.draftPhenotypes, this.phenotypeQuery);
        },
        bubbles() {
            const session = this.searchSession || {};
            const project = getProjectConfig(this.projectId);
            const phenotype =
                String(session.phenotype?.description || "").trim() ||
                String(session.phenotype?.name || "").trim() ||
                "Phenotype";
            const ancestry = session.ancestry || "Mixed";
            const region =
                session.regionLabel ||
                formatRegion(session.region) ||
                "Region";

            const items = [
                {
                    id: "project",
                    title: "Project",
                    value: project.label || "Default (KP)",
                },
                {
                    id: "phenotype",
                    title: "Phenotype",
                    value: phenotype,
                },
            ];
            if (!projectHidesAncestry(this.projectId)) {
                items.push({
                    id: "ancestry",
                    title: "Ancestry",
                    value: ancestry,
                });
            }
            items.push({
                id: "region",
                title: "Region",
                value: region,
            });
            return items;
        },
        activePanelTitle() {
            const titles = {
                project: "Change project",
                phenotype: "Change phenotype",
                ancestry: "Change ancestry",
                region: "Change region",
            };
            return titles[this.openParam] || "Change search parameter";
        },
    },
    watch: {
        searchSession() {
            this.closePanel();
        },
        projectId() {
            this.closePanel();
        },
        draftProjectId(next) {
            if (!projectUsesTokenSearch(next)) {
                return;
            }
            if (!this.draftToken) {
                this.draftToken = normalizeGwasCeToken(
                    this.searchSession?.gwasCeToken
                );
            }
        },
    },
    mounted() {
        document.addEventListener("click", this.onDocumentClick, true);
        document.addEventListener("keydown", this.onDocumentKeydown);
    },
    beforeDestroy() {
        document.removeEventListener("click", this.onDocumentClick, true);
        document.removeEventListener("keydown", this.onDocumentKeydown);
        if (this.geneLookupTimer) {
            clearTimeout(this.geneLookupTimer);
        }
    },
    methods: {
        ancestryLabel,
        toggleParam(paramId) {
            if (this.openParam === paramId) {
                this.closePanel();
                return;
            }
            this.openPanel(paramId);
        },
        openPanel(paramId) {
            this.errorMessage = "";
            this.openParam = paramId;
            this.syncDraftFromSession(paramId);
        },
        closePanel() {
            this.openParam = null;
            this.errorMessage = "";
            this.phenotypeListOpen = false;
            this.geneListOpen = false;
            this.applying = false;
        },
        syncDraftFromSession(paramId) {
            const session = this.searchSession || {};
            this.draftProjectId = normalizeProjectId(this.projectId);
            this.draftToken = normalizeGwasCeToken(session.gwasCeToken);
            this.draftAncestry = session.ancestry || "Mixed";
            this.draftExpandBp =
                session.regionExpandBp != null ? session.regionExpandBp : null;
            this.selectedPhenotype = session.phenotype || null;
            this.phenotypeQuery = this.selectedPhenotype
                ? this.phenotypeSuggestionLabel(this.selectedPhenotype)
                : "";
            this.locusQuery =
                session.geneOrVariantQuery ||
                session.regionLabel ||
                formatRegion(session.region) ||
                "";
            this.geneSuggestions = [];
            this.geneSuggestionSuppressed = false;
            this.phenotypeListOpen = paramId === "phenotype";
            this.geneListOpen = false;
        },
        onDocumentClick(event) {
            if (!this.openParam || !this.$refs.root) {
                return;
            }
            if (!this.$refs.root.contains(event.target)) {
                this.closePanel();
            }
        },
        onDocumentKeydown(event) {
            if (event.key === "Escape" && this.openParam) {
                this.closePanel();
            }
        },
        onPhenotypeInput() {
            this.phenotypeListOpen = true;
            this.selectedPhenotype = null;
            this.errorMessage = "";
        },
        selectPhenotype(phenotype) {
            this.selectedPhenotype = phenotype;
            this.phenotypeQuery = this.phenotypeSuggestionLabel(phenotype);
            this.phenotypeListOpen = false;
            this.errorMessage = "";
        },
        phenotypeSuggestionLabel(phenotype) {
            const description = String(phenotype?.description || "").trim();
            if (description) {
                return description;
            }
            return String(phenotype?.name || "").trim();
        },
        phenotypeSuggestionMeta(phenotype) {
            const name = String(phenotype?.name || "").trim();
            const description = String(phenotype?.description || "").trim();
            if (name && description && name !== description) {
                return name;
            }
            return "";
        },
        onLocusFocus() {
            if (isGeneLookupQuery(this.locusQuery) && !this.geneSuggestionSuppressed) {
                this.geneListOpen = true;
                this.scheduleGeneLookup();
            }
        },
        onLocusInput() {
            this.geneSuggestionSuppressed = false;
            this.errorMessage = "";
            this.scheduleGeneLookup();
        },
        selectGene(gene) {
            if (this.geneLookupTimer) {
                clearTimeout(this.geneLookupTimer);
                this.geneLookupTimer = null;
            }
            this.geneSuggestionSuppressed = true;
            this.locusQuery = gene;
            this.geneSuggestions = [];
            this.geneListOpen = false;
            this.errorMessage = "";
        },
        scheduleGeneLookup() {
            if (this.geneLookupTimer) {
                clearTimeout(this.geneLookupTimer);
            }
            if (!isGeneLookupQuery(this.locusQuery) || this.geneSuggestionSuppressed) {
                this.geneSuggestions = [];
                this.geneListOpen = false;
                return;
            }
            this.geneLookupTimer = setTimeout(() => {
                this.fetchGeneSuggestions();
            }, GENE_LOOKUP_DEBOUNCE_MS);
        },
        async fetchGeneSuggestions() {
            const query = this.locusQuery.trim();
            if (!isGeneLookupQuery(query) || this.geneSuggestionSuppressed) {
                this.geneSuggestions = [];
                return;
            }
            const token = ++this.geneLookupToken;
            const matches = await lookupGeneMatches(
                query,
                10,
                this.bioIndexHost || null
            );
            if (token !== this.geneLookupToken) {
                return;
            }
            this.geneSuggestions = matches;
            this.geneListOpen = matches.length > 0 && !this.geneSuggestionSuppressed;
        },
        resolvePhenotypeForApply() {
            if (this.openParam === "phenotype") {
                if (this.selectedPhenotype) {
                    return this.selectedPhenotype;
                }
                const match = (this.draftPhenotypes || []).find(
                    (entry) =>
                        entry.name === this.phenotypeQuery ||
                        entry.description === this.phenotypeQuery
                );
                return match || null;
            }
            if (this.openParam === "project") {
                const phenotypes = projectPhenotypes(
                    this.draftProjectId,
                    this.phenotypesInUse || []
                );
                const currentName = this.searchSession?.phenotype?.name;
                return (
                    phenotypes.find((entry) => entry.name === currentName) || null
                );
            }
            return this.searchSession?.phenotype || null;
        },
        async onApply() {
            if (!this.searchSession || this.applying) {
                return;
            }
            this.errorMessage = "";
            this.applying = true;

            try {
                const nextProjectId =
                    this.openParam === "project"
                        ? normalizeProjectId(this.draftProjectId)
                        : normalizeProjectId(this.projectId);

                if (
                    this.openParam === "project" &&
                    projectUsesTokenSearch(nextProjectId) &&
                    !normalizeGwasCeToken(this.draftToken)
                ) {
                    this.errorMessage = "Enter a GWAS-CE access token.";
                    return;
                }

                const phenotype = this.resolvePhenotypeForApply();
                if (!phenotype) {
                    this.errorMessage =
                        this.openParam === "project"
                            ? "Current phenotype is not available in that project. Change phenotype after switching, or pick another project."
                            : "Select a phenotype to continue.";
                    return;
                }

                let ancestry = this.searchSession.ancestry || "Mixed";
                if (this.openParam === "ancestry") {
                    ancestry = this.draftAncestry || "Mixed";
                } else if (projectHidesAncestry(nextProjectId)) {
                    ancestry = "Mixed";
                } else if (this.openParam === "project") {
                    const options = projectAncestryOptions(nextProjectId);
                    if (!options.includes(ancestry)) {
                        ancestry = options[0] || "Mixed";
                    }
                }

                let region = this.searchSession.region;
                let regionLabel = this.searchSession.regionLabel;
                let geneOrVariantQuery = this.searchSession.geneOrVariantQuery;
                let regionExpandBp = this.searchSession.regionExpandBp ?? null;

                if (this.openParam === "region") {
                    if (!this.locusQuery.trim()) {
                        this.errorMessage =
                            "Enter a gene, variant, location, or region.";
                        return;
                    }
                    if (!this.utils?.regionUtils) {
                        this.errorMessage = "Search utilities are not available.";
                        return;
                    }
                    regionExpandBp =
                        this.draftExpandBp != null ? this.draftExpandBp : null;
                    region = await resolveGeneOrVariantToRegion(
                        this.locusQuery,
                        this.utils.regionUtils,
                        regionExpandBp,
                        this.bioIndexHost || null
                    );
                    if (!region) {
                        this.errorMessage =
                            "Could not resolve that gene, variant, location, or region.";
                        return;
                    }
                    const ensured = ensureRegionWithinActiveDataLimit(region);
                    if (ensured.trimmed) {
                        window.alert(
                            activeRegionTrimmedMessage(
                                ensured.originalRegion,
                                ensured.region
                            )
                        );
                    }
                    region = ensured.region;
                    regionLabel = formatRegion(region);
                    geneOrVariantQuery = this.locusQuery.trim();
                }

                const nextSession = {
                    ...this.searchSession,
                    phenotype,
                    ancestry,
                    region,
                    regionLabel,
                    geneOrVariantQuery,
                    regionExpandBp,
                    gwasCeToken: projectUsesTokenSearch(nextProjectId)
                        ? normalizeGwasCeToken(
                              this.openParam === "project"
                                  ? this.draftToken
                                  : this.searchSession.gwasCeToken
                          )
                        : null,
                };

                this.$emit("apply-search", {
                    session: nextSession,
                    projectId: nextProjectId,
                });
                this.closePanel();
            } finally {
                this.applying = false;
            }
        },
    },
};
</script>

<style scoped>
.vks-session-params {
    position: relative;
    grid-column: 2;
    justify-self: stretch;
    min-width: 0;
    max-width: 100%;
}

.vks-session-params-bubbles {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 6px;
}

.vks-session-param-bubble {
    display: inline-flex;
    align-items: center;
    max-width: min(100%, 280px);
    padding: 2px 7px;
    border: none;
    border-radius: 999px;
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    box-shadow: none;
    cursor: pointer;
    text-align: left;
}

.vks-session-param-bubble:hover,
.vks-session-param-bubble.is-open {
    border: none;
    background: #234a7a;
    box-shadow: none;
}

.vks-session-param-bubble-value {
    font-size: 12px;
    font-weight: 700;
    line-height: 1.25;
    color: #ffffff;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.vks-session-param-panel {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 40;
    width: min(360px, 86vw);
    padding: 12px 14px 14px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 12px 28px rgba(20, 22, 30, 0.16);
}

.vks-session-param-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
}

.vks-session-param-panel-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-session-param-panel-close {
    border: none;
    background: transparent;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    padding: 0 2px;
}

.vks-session-param-panel-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.vks-session-param-label {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-session-param-input,
.vks-session-param-select {
    box-sizing: border-box;
    width: 100%;
    min-height: 34px;
    padding: 6px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
}

.vks-session-param-typeahead {
    position: relative;
}

.vks-session-param-suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 8;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(20, 22, 30, 0.12);
}

.vks-session-param-suggestion {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
    background: #ffffff;
    text-align: left;
    cursor: pointer;
}

.vks-session-param-suggestion:last-child {
    border-bottom: none;
}

.vks-session-param-suggestion:hover {
    background: rgba(44, 92, 151, 0.06);
}

.vks-session-param-suggestion-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-session-param-suggestion-meta {
    font-size: 11px;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-session-param-error {
    margin: 10px 0 0;
    font-size: 12px;
    color: #b42318;
}

.vks-session-param-panel-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
}

.vks-session-param-cancel,
.vks-session-param-apply {
    min-height: 32px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.vks-session-param-cancel {
    border: 1px solid var(--cfde-border, #e6e1d6);
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
}

.vks-session-param-apply {
    border: 1px solid var(--cfde-blue, #2c5c97);
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
}

.vks-session-param-apply:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
