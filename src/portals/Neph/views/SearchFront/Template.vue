<template>
    <div class="search-front-body">
        <!-- Header -->
        <page-header
            v-if="diseaseGroup"
            :disease-group="diseaseGroup"
            :front-contents="frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body" v-if="diseaseGroup">
            
            <!-- Page Title Header (matching gene.html) -->
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">Search</div>
                    <div class="col-md-12 gene-page-header-body">
                        <span>Cohort and Disease Reference Search</span>
                    </div>
                </div>
            </div>

            <!-- Search Configuration Card -->
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Search Browser</h4>
                    
                    <!-- Search Mode Select Tab Group -->
                    <div class="search-mode-tabs-container mb-4">
                        <b-button-group>
                            <b-button
                                v-for="mode in availableModes"
                                :key="mode.id"
                                :variant="activeMode === mode.id ? 'primary' : 'outline-secondary'"
                                @click="setSearchMode(mode.id)"
                                class="mode-tab-btn"
                            >
                                <i :class="getModeIcon(mode.id) + ' mr-1'"></i>
                                {{ mode.label }}
                            </b-button>
                        </b-button-group>
                    </div>

                    <!-- Search Input Form -->
                    <div class="search-input-group row mb-3">
                        <div class="col-md-10">
                            <input
                                type="text"
                                v-model="searchQuery"
                                class="form-control form-control-lg search-input-field"
                                :placeholder="currentModeDetails.placeholder"
                                @keyup.enter="executeSearch"
                            />
                        </div>
                        <div class="col-md-2 mt-2 mt-md-0">
                            <b-button block size="lg" variant="primary" @click="executeSearch" class="search-submit-btn">
                                Search
                            </b-button>
                        </div>
                    </div>

                    <!-- Search Info and Examples -->
                    <div class="mode-info-section mb-4">
                        <p class="text-secondary small">{{ currentModeDetails.description }}</p>
                        <div class="examples-list small text-secondary">
                            <strong>Examples: </strong>
                            <span v-for="(example, idx) in currentModeDetails.examples" :key="example">
                                <a class="example-link text-primary font-weight-bold" @click="useExample(example)">{{ example }}</a>
                                <span v-if="idx < currentModeDetails.examples.length - 1">, </span>
                            </span>
                        </div>
                    </div>

                    <!-- Error feedback alert -->
                    <b-alert v-if="errorMessage" show variant="danger" dismissible @dismissed="errorMessage = ''" class="mt-3">
                        <i class="bi bi-exclamation-triangle-fill mr-2"></i>
                        {{ errorMessage }}
                    </b-alert>

                    <!-- HPO Clinical Context Section -->
                    <div class="clinical-context-section card bg-light p-3 mt-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0 text-dark font-weight-bold">
                                <i class="bi bi-info-circle-fill mr-1 text-info"></i>
                                HPO Clinical Context
                                <span v-if="activeContextHpos.length > 0" class="badge badge-success ml-2">Active</span>
                            </h5>
                            <span class="text-muted small">{{ contextStatusText }}</span>
                        </div>

                        <!-- Active tags list -->
                        <div v-if="activeContextHpos.length > 0" class="context-terms-list mb-3">
                            <b-badge
                                v-for="hpo in activeContextHpos"
                                :key="hpo"
                                variant="secondary"
                                pill
                                class="mr-2 mb-2 p-2 context-term-tag cursor-pointer"
                                @click="removeContextHpo(hpo)"
                                title="Click to remove"
                            >
                                {{ hpo }}
                                <i class="bi bi-x-circle-fill ml-1 text-danger"></i>
                            </b-badge>
                        </div>

                        <!-- Add context form -->
                        <div class="context-input-group row">
                            <div class="col-md-9 mb-2 mb-md-0">
                                <input
                                    type="text"
                                    v-model="contextInput"
                                    placeholder="Add HPO ID (e.g., HP:0001263) to active context"
                                    class="form-control"
                                    @keyup.enter="addContextHpo"
                                />
                            </div>
                            <div class="col-md-3">
                                <b-button block variant="outline-primary" @click="addContextHpo">
                                    Add to Context
                                </b-button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Informational Guidelines (Separation of Evidence) -->
            <div class="row mt-4">
                <div class="col-md-4 mb-3">
                    <div class="card h-100 mdkp-card">
                        <div class="card-body">
                            <h5 class="card-title text-primary font-weight-bold">
                                <i class="bi bi-people-fill mr-2"></i>CRDC Internal Cohort
                            </h5>
                            <p class="card-text text-secondary small">
                                Inspect individual patient data. Compare same-variant/gene recurrence and calculate HPO clinical profile similarities across the cohort.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100 mdkp-card">
                        <div class="card-body">
                            <h5 class="card-title text-purple font-weight-bold">
                                <i class="bi bi-journal-bookmark-fill mr-2"></i>Disease Reference DB
                            </h5>
                            <p class="card-text text-secondary small">
                                Cross-reference candidates using public datasets like OMIM/HPOA, MONDO ontologies, and curated disease-HPO linkages.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100 mdkp-card">
                        <div class="card-body">
                            <h5 class="card-title text-warning font-weight-bold">
                                <i class="bi bi-tags-fill mr-2"></i>Supporting Annotations
                            </h5>
                            <p class="card-text text-secondary small">
                                Track secondary indicators (PanelApp ratings & Reactome/WikiPathways) as metadata badges without filtering out novel signals.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- Footer -->
        <div class="footer-spacer"></div>
        <page-footer v-if="diseaseGroup" :disease-group="diseaseGroup"></page-footer>
    </div>
</template>

<script>
import { SEARCH_MODES, getTargetRoute, getContextStatusLabel } from "./pageModel.js";

export default {
    name: "SearchFrontTemplate",
    data() {
        return {
            activeMode: "sample",
            searchQuery: "",
            errorMessage: "",
            contextInput: "",
        };
    },
    computed: {
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        frontContents() {
            const contents = this.$store.state.kp4cd.frontContents;
            return contents && contents.length > 0 ? contents[0] : {};
        },
        availableModes() {
            return Object.values(SEARCH_MODES);
        },
        currentModeDetails() {
            return SEARCH_MODES[this.activeMode.toUpperCase()] || SEARCH_MODES.SAMPLE;
        },
        activeContextHpos() {
            return this.$store.state.activeContextHpos || [];
        },
        contextStatusText() {
            return getContextStatusLabel(this.activeContextHpos);
        }
    },
    created() {
        this.$store.dispatch("loadContext");
    },
    methods: {
        setSearchMode(modeId) {
            this.activeMode = modeId;
            this.searchQuery = "";
            this.errorMessage = "";
        },
        useExample(example) {
            this.searchQuery = example;
            this.errorMessage = "";
            this.executeSearch();
        },
        executeSearch() {
            this.errorMessage = "";
            try {
                const url = getTargetRoute(this.activeMode, this.searchQuery);
                window.location.href = url;
            } catch (err) {
                this.errorMessage = err.message;
            }
        },
        getModeIcon(modeId) {
            switch (modeId) {
                case "sample":
                    return "bi bi-person-badge-fill";
                case "phenotype":
                    return "bi bi-activity";
                case "variant_gene":
                    return "bi bi-dna";
                default:
                    return "bi bi-search";
            }
        },
        addContextHpo() {
            if (!this.contextInput || !this.contextInput.trim()) return;
            const input = this.contextInput.trim().toUpperCase();
            
            // Validate HPO format
            if (!/^HP[:.]\d+$/i.test(input)) {
                this.errorMessage = "Invalid HPO ID format. Example: HP:0001263";
                return;
            }

            const current = [...this.activeContextHpos];
            if (!current.includes(input)) {
                current.push(input);
                this.$store.dispatch("saveContext", current);
            }
            this.contextInput = "";
            this.errorMessage = "";
        },
        removeContextHpo(hpo) {
            const current = this.activeContextHpos.filter(t => t !== hpo);
            this.$store.dispatch("saveContext", current);
        }
    }
};
</script>

<style src="./style.css"></style>
