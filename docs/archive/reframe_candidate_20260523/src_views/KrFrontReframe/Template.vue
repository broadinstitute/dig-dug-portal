<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body glens-reframe-page">
            <main class="glens-reframe-shell">
                <div class="glens-reframe-topbar">
                    <div class="glens-reframe-workflow">
                        <span>Current workflow</span>
                        <strong>Rare disease cohort portal</strong>
                    </div>
                    <reframe-context-control
                        baseline-question="Which search entry point should be used to explore CRDC rare disease cohort evidence?"
                        baseline-purpose="Start from a sample, variant or gene, or phenotype profile, then inspect CRDC evidence and rare disease references."
                        active-question="How should the active HPO context guide the next search?"
                        active-purpose="Use the same HPO-based clinical hypothesis across sample, variant/gene, and phenotype workflows."
                        @focus-changed="clinicalFocus = $event"
                    ></reframe-context-control>
                </div>

                <span class="glens-reframe-candidate-label">reframe candidate layout</span>

                <section class="glens-reframe-card">
                    <p class="glens-reframe-eyebrow">Search entry point</p>
                    <h1>Explore CRDC evidence from a sample, variant, gene, or phenotype profile</h1>
                    <p class="glens-reframe-copy">
                        Users can start from a sample, variant/gene, or phenotype profile. The same active HPO context can be used as a clinical hypothesis across pages.
                    </p>
                    <div class="glens-reframe-workflow-band" aria-label="Shared cohort exploration workflow">
                        <div>
                            <b>1. Choose an entry point</b>
                            <p>Sample, variant/gene, and phenotype searches start from different inputs but enter the same CRDC evidence space.</p>
                        </div>
                        <div>
                            <b>2. Apply optional HPO context</b>
                            <p>The active context is a phenotype hypothesis reused across pages without becoming a genotype similarity score.</p>
                        </div>
                        <div>
                            <b>3. Inspect evidence layers</b>
                            <p>Prioritize CRDC recurrence and phenotype groups, then compare Orphanet/HPO/OMIM references and secondary badges.</p>
                        </div>
                    </div>

                    <form class="glens-front-reframe-search" @submit.prevent="openResults">
                        <div class="glens-front-reframe-modes" role="tablist" aria-label="Search mode">
                            <button
                                v-for="mode in searchModes"
                                :key="mode.key"
                                type="button"
                                :class="{ 'glens-front-reframe-mode--active': activeSearchMode === mode.key }"
                                class="glens-front-reframe-mode"
                                @click="selectMode(mode.key)"
                            >
                                <span>{{ mode.label }}</span>
                                <small>{{ mode.example }}</small>
                            </button>
                        </div>
                        <div class="glens-front-reframe-input-row">
                            <input
                                v-model="query"
                                class="glens-front-reframe-input"
                                type="text"
                                :placeholder="activeMode.placeholder"
                            >
                            <button class="glens-front-reframe-submit" type="submit">
                                Search
                            </button>
                        </div>
                        <p class="glens-reframe-note">{{ activeMode.hint }}</p>
                    </form>
                </section>

                <section v-if="hasActiveContext" class="glens-reframe-section glens-reframe-card">
                    <div class="glens-reframe-section-head">
                        <div>
                            <p class="glens-reframe-eyebrow">Active HPO context</p>
                            <h2>{{ activeContextLabel }}</h2>
                            <p class="glens-reframe-note">
                                This context is used as an HPO phenotype hypothesis, not as a direct genetic similarity filter.
                            </p>
                        </div>
                        <div class="glens-front-reframe-context-actions">
                            <button type="button" @click="clearContext">Clear context</button>
                        </div>
                    </div>
                    <div class="glens-reframe-evidence-band">
                        <div>
                            <h3>Context source</h3>
                            <p class="glens-reframe-note">{{ clinicalFocus.sourceDetail || clinicalFocus.source || "Selected clinical context" }}</p>
                        </div>
                        <div>
                            <h3>Selected HPO terms</h3>
                            <div class="glens-reframe-term-list">
                                <span v-for="term in activeContextTerms" :key="term.id || term.label">
                                    {{ term.label }}<template v-if="term.id"> [{{ term.id }}]</template>
                                </span>
                            </div>
                        </div>
                        <div>
                            <h3>Use across pages</h3>
                            <p class="glens-reframe-note">
                                Sample pages compare sample HPO profiles to context. Variant pages compare carrier HPO profiles to context. Phenotype pages keep query terms and context terms separate.
                            </p>
                        </div>
                    </div>
                </section>

                <section class="glens-reframe-section glens-reframe-grid glens-reframe-grid--three">
                    <article v-for="mode in searchModes" :key="`workflow-${mode.key}`" class="glens-reframe-card">
                        <p class="glens-reframe-eyebrow">{{ mode.kicker }}</p>
                        <h2>{{ mode.label }}</h2>
                        <p class="glens-reframe-copy">{{ mode.description }}</p>
                        <a class="glens-reframe-link" :href="mode.destination">Open example</a>
                    </article>
                </section>
            </main>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import ReframeContextControl from "../KrReframeCommon/ReframeContextControl.vue";
import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { clearClinicalFocus, readClinicalFocus } from "../KrClinicalFocus/focusStore";
import "../KrReframeCommon/style.css";
import "./style.css";

export default {
    name: "KrFrontReframeTemplate",
    components: {
        ReframeContextControl,
    },
    data() {
        return {
            clinicalFocus: readClinicalFocus(),
            activeSearchMode: "sample",
            query: "BCH-12-34567-01",
            searchModes: [
                {
                    key: "sample",
                    label: "Search by sample",
                    kicker: "Sample first",
                    example: "BCH-12-34567-01",
                    placeholder: "BCH sample ID",
                    hint: "Explain one searched sample, then compare similar patients, groups, diseases, genes, and variants.",
                    description: "Start from a known patient or sample ID and ask where it sits in CRDC phenotype and genotype evidence.",
                    destination: "/krSample_reframe.html?sample_id=BCH-12-34567-01",
                },
                {
                    key: "variant",
                    label: "Search by variant",
                    kicker: "Variant or gene first",
                    example: "chr15:22,000,220 G>C",
                    placeholder: "Variant, coordinate, or gene symbol",
                    hint: "Inspect carrier recurrence, carrier phenotype profile, and carrier group patterns.",
                    description: "Start from a queried variant or gene and inspect whether carriers form a phenotype or cohort group.",
                    destination: "/krVariant_reframe.html?query=chr15%3A22000220%3AG%3AC",
                },
                {
                    key: "phenotype",
                    label: "Search by phenotype",
                    kicker: "Phenotype first",
                    example: "Cleft palate, developmental delay",
                    placeholder: "HPO terms or phenotype text",
                    hint: "Find patients, groups, diseases, genes, and variants associated with a searched phenotype profile.",
                    description: "Start from HPO terms and keep searched phenotype terms visually separate from any active context.",
                    destination: "/krPhenotype_reframe.html?query=cleft%20palate%2Cdevelopmental%20delay",
                },
            ],
        };
    },
    computed: {
        activeMode() {
            return this.searchModes.find((mode) => mode.key === this.activeSearchMode) || this.searchModes[0];
        },
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        activeContextLabel() {
            if (!this.hasActiveContext) return "";
            const contextId = this.clinicalFocus.orphaId || this.clinicalFocus.sourceId || "";
            return [this.clinicalFocus.label, contextId].filter(Boolean).join(" · ");
        },
        activeContextTerms() {
            return (this.clinicalFocus.hpoTerms || []).slice(0, 6);
        },
    },
    methods: {
        selectMode(mode) {
            this.activeSearchMode = mode;
            this.query = this.activeMode.example;
        },
        openResults() {
            const value = this.query || this.activeMode.example;
            const param = this.activeSearchMode === "sample" ? "sample_id" : "query";
            window.location.assign(`${this.activeMode.destination.split("?")[0]}?${param}=${encodeURIComponent(value)}`);
        },
        clearContext() {
            clearClinicalFocus();
            this.clinicalFocus = readClinicalFocus();
        },
    },
};
</script>
