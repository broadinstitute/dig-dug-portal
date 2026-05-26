<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            page="front"
        ></page-header>

        <div class="container-fluid mdkp-body glens-page glens-page-new">
            <section class="glens-hero">
                <div class="glens-hero-grid">
                    <div class="glens-hero-copy glens-hero-copy--combined">
                        <p class="glens-eyebrow">CRDC rare disease cohort exploration</p>
                        <h1 class="glens-title">
                            Search CRDC first, then review rare disease references.
                        </h1>
                        <p class="glens-subtitle">
                            Start from a sample, variant/gene, or HPO phenotype profile. The portal
                            first looks for CRDC cohort evidence, then layers Orphanet/HPO reference
                            matches, DECIPHER/MONDO/OMIM review references, and secondary annotation
                            badges.
                        </p>

                        <form class="glens-search-card glens-search-card--embedded" @submit.prevent="openResults">
                            <span class="glens-query-step">Search subject</span>

                            <div class="glens-search-shell glens-search-shell--typed">
                                <select
                                    v-model="activeMode"
                                    class="glens-search-type-select"
                                    aria-label="Search type"
                                >
                                    <option
                                        v-for="mode in searchModes"
                                        :key="mode.key"
                                        :value="mode.key"
                                    >
                                        {{ mode.shortLabel }}
                                    </option>
                                </select>
                                <input
                                    id="clinical-search"
                                    v-model.trim="query"
                                    class="glens-input"
                                    type="text"
                                    aria-label="Search input"
                                    :placeholder="activePlaceholder"
                                />
                                <button class="glens-button" type="submit">
                                    Start workflow
                                </button>
                            </div>

                            <div class="glens-example-row">
                                <button
                                    v-for="example in activeExamples"
                                    :key="example"
                                    class="glens-example-token"
                                    type="button"
                                    @click="query = example"
                                >
                                    {{ example }}
                                </button>
                            </div>
                            <p v-if="activeFixture.hint" class="glens-search-hint">
                                {{ activeFixture.hint }}
                            </p>
                            <p v-if="pendingMessage" class="glens-pending-message">
                                {{ pendingMessage }}
                            </p>
                        </form>
                    </div>

                    <aside class="glens-principle-card glens-principle-card--context">
                        <div class="glens-principle-copy">
                            <div class="glens-principle-head">
                                <span class="glens-badge">Our purpose</span>
                                <button
                                    class="glens-info-button"
                                    type="button"
                                    aria-label="Open workflow summary"
                                    @click="summaryOpen = true"
                                >
                                    <img src="/images/context_info.png" alt="" />
                                </button>
                            </div>
                            <strong>Find cohort evidence before over-interpreting references.</strong>
                            <p>
                                CRDC recurrence, phenotype overlap, carrier groups, and investigator
                                patterns are the primary evidence. References help interpret what the
                                internal cohort signal may mean.
                            </p>
                        </div>

                        <div class="glens-principle-context">
                            <div class="glens-context-heading-row">
                                <span class="glens-query-step">
                                    Clinical context <small>(HPO background)</small>
                                </span>
                                <button
                                    class="glens-context-toggle"
                                    type="button"
                                    :aria-expanded="contextPanelOpen ? 'true' : 'false'"
                                    @click="contextPanelOpen = !contextPanelOpen"
                                >
                                    <span class="glens-context-toggle-arrow">{{ contextPanelOpen ? "▾" : "▸" }}</span>
                                    {{ hasActiveContext ? "Edit context" : "Set context" }}
                                </button>
                            </div>
                            <div class="glens-context-status">
                                <span>{{ hasActiveContext ? "Active HPO context" : "No context set" }}</span>
                                <strong>{{ contextStatusLabel }}</strong>
                                <p>
                                    Active context is compared to sample, disease, or carrier HPO
                                    profiles. It is not a direct variant-similarity score.
                                </p>
                            </div>
                            <div v-if="contextPanelOpen" class="glens-context-panel">
                                <clinical-focus-bar
                                    class="glens-front-focus-bar"
                                    :show-no-focus-note="true"
                                    :hide-kicker="true"
                                    :open-editor-on-mount="true"
                                    :hide-summary="true"
                                    @focus-confirmed="contextPanelOpen = false"
                                    @focus-cancelled="contextPanelOpen = false"
                                ></clinical-focus-bar>
                            </div>
                        </div>
                    </aside>
                </div>

                <div
                    v-if="summaryOpen"
                    class="glens-summary-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Workflow summary"
                    @click.self="summaryOpen = false"
                >
                    <div class="glens-summary-modal-card">
                        <button type="button" @click="summaryOpen = false">Close</button>
                        <div class="glens-summary-modal-copy">
                            <p class="glens-card-label">Workflow summary</p>
                            <h2>Search subject, optional HPO context, then evidence layers.</h2>
                            <p>
                                The portal starts with the object being searched, optionally compares it
                                against a resolved HPO context, and then separates CRDC cohort evidence
                                from rare disease references and secondary annotation.
                            </p>
                            <div class="glens-summary-step-grid">
                                <div>
                                    <span>1</span>
                                    <strong>Search subject</strong>
                                    <p>
                                        Sample ID, variant/gene, or phenotype profile defines what the
                                        current page should explain first.
                                    </p>
                                </div>
                                <div>
                                    <span>2</span>
                                    <strong>Optional HPO context</strong>
                                    <p>
                                        Orphanet, OMIM, MONDO, DECIPHER, sample, investigator, or manual
                                        HPO profiles can be used as the clinical hypothesis.
                                    </p>
                                </div>
                                <div>
                                    <span>3</span>
                                    <strong>Evidence layers</strong>
                                    <p>
                                        CRDC recurrence and phenotype overlap are primary. Orphanet/HPO,
                                        DECIPHER, MONDO, and OMIM are review references. PanelApp and
                                        pathways remain badges.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <img
                            src="/images/context_summary_20260519.png"
                            alt="Clinical context, search subject, interpretation engine, and evidence outputs"
                        />
                    </div>
                </div>

                <div class="glens-workflow-grid">
                    <article
                        v-for="workflow in workflows"
                        :key="workflow.key"
                        class="glens-workflow-card"
                    >
                        <p class="glens-card-label">{{ workflow.kicker }}</p>
                        <h2>{{ workflow.title }}</h2>
                        <ol>
                            <li v-for="step in workflow.steps" :key="step">{{ step }}</li>
                        </ol>
                    </article>
                </div>
            </section>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import ClinicalFocusBar from "../KrClinicalFocus/ClinicalFocusBar.vue";
import { onClinicalFocusChange, readClinicalFocus } from "../KrClinicalFocus/focusStore";
import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";

export default {
    name: "KrFrontNewTemplate",
    components: {
        ClinicalFocusBar,
    },
    data() {
        return {
            activeMode: "cohort",
            query: "",
            pendingMessage: "",
            summaryOpen: false,
            contextPanelOpen: false,
            clinicalFocus: readClinicalFocus(),
            unsubscribeClinicalFocus: null,
            searchModes: [
                { key: "cohort", label: "Search by sample ID", shortLabel: "Sample ID" },
                { key: "phenotype", label: "Search by phenotype profile", shortLabel: "Phenotype" },
                { key: "variant", label: "Search by variant / gene", shortLabel: "Variant / gene" },
            ],
            fixtures: {
                variant: {
                    destination: "/krVariant.html",
                    placeholder: "chr2:231222761:AT:A / ARMC9",
                    fallback: "chr2:231222761:AT:A",
                    examples: [
                        "chr2:231222761:AT:A",
                        "ARMC9",
                        "rare damaging carrier set",
                    ],
                    hint: "Use this when you want exact-variant or same-gene carrier evidence. Counts should stay labeled by scope.",
                },
                phenotype: {
                    destination: "/krPhenotype.html",
                    placeholder:
                        "Abnormal oral morphology [HP:0031816], abnormal circulating purine concentration [HP:0004352]",
                    fallback: "Abnormal oral morphology [HP:0031816]",
                    examples: [
                        "Abnormal oral morphology [HP:0031816]",
                        "Abnormal circulating purine concentration [HP:0004352]",
                        "oral morphology, immune phenotype",
                    ],
                    hint: "Use this for a phenotype profile. Runtime PheRS/GRS can remain not calculated until backend support exists.",
                },
                cohort: {
                    destination: "/krSample.html",
                    queryParam: "sample_id",
                    placeholder: "BCH-22-44945-01",
                    fallback: "BCH-22-44945-01",
                    examples: [
                        "BCH-22-44945-01",
                        "BCH-19-86295-01",
                    ],
                    hint: "Open the searched sample first, then inspect similar samples, profile references, and recurrent gene/variant evidence.",
                },
            },
            workflows: [
                {
                    key: "sample",
                    kicker: "Sample ID-first workflow",
                    title: "Searched sample hub",
                    steps: [
                        "Understand the sample phenotype and genotype profile",
                        "Check similar samples or phenotype-defined groups",
                        "Review disease profile references and recurrent gene or variant evidence",
                    ],
                },
                {
                    key: "phenotype",
                    kicker: "Phenotype-first workflow",
                    title: "Matched cohort signal",
                    steps: [
                        "Search an HPO profile without merging it with active context",
                        "Inspect matched CRDC samples and co-observed phenotypes",
                        "Overlay external disease or gene references after the cohort signal is visible",
                    ],
                },
                {
                    key: "variant",
                    kicker: "Variant-first workflow",
                    title: "Carrier profile in context",
                    steps: [
                        "Separate exact queried-variant, same-gene, and nearby-region evidence",
                        "Inspect carrier HPO profile and carrier sample recurrence",
                        "If context is active, compare context HPO terms to carrier HPO profiles",
                    ],
                },
            ],
        };
    },
    computed: {
        activeFixture() {
            return this.fixtures[this.activeMode];
        },
        activePlaceholder() {
            return this.activeFixture.placeholder;
        },
        activeExamples() {
            return this.activeFixture.examples;
        },
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        contextStatusLabel() {
            if (!this.hasActiveContext) return "Search runs in CRDC discovery mode";

            const sourceId =
                this.clinicalFocus.orphaId ||
                this.clinicalFocus.mondoId ||
                this.clinicalFocus.decipherId ||
                this.clinicalFocus.sourceId;
            const termCount = this.clinicalFocus.contextTermCount || this.clinicalFocus.hpoTerms.length;
            const terms = `${termCount} HPO terms`;
            return [this.clinicalFocus.label, sourceId, terms].filter(Boolean).join(" · ");
        },
    },
    mounted() {
        this.unsubscribeClinicalFocus = onClinicalFocusChange((focus) => {
            this.clinicalFocus = focus;
        });
    },
    beforeDestroy() {
        if (this.unsubscribeClinicalFocus) this.unsubscribeClinicalFocus();
    },
    methods: {
        openResults() {
            const value = this.query || this.activeFixture.fallback;
            this.pendingMessage = "";

            if (!this.activeFixture.destination) {
                this.pendingMessage = `Search captured, but this workflow does not have a target page yet: ${value}`;
                return;
            }

            const param = this.activeFixture.queryParam || "query";
            window.location.assign(
                `${this.activeFixture.destination}?${param}=${encodeURIComponent(value)}`
            );
        },
    },
};
</script>

<style scoped>
.glens-page {
    padding: 1.15rem 2.5rem 2.2rem;
    background: #f3f6fa;
}

.glens-hero {
    max-width: 1240px;
    margin: 0 auto;
}

.glens-hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(21rem, 0.95fr);
    gap: 1rem;
    align-items: stretch;
}

.glens-hero-copy,
.glens-principle-card,
.glens-workflow-grid {
    border: 1px solid rgba(203, 213, 225, 0.64);
    border-radius: 1.45rem;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 18px 48px rgba(22, 32, 51, 0.055);
}

.glens-hero-copy {
    padding: 1.25rem 1.45rem 1.15rem;
}

.glens-principle-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1rem;
}

.glens-eyebrow,
.glens-card-label,
.glens-query-step,
.glens-tier-label {
    margin: 0;
    color: #526276;
    font-size: 0.72rem;
    font-weight: 850;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.glens-title,
.glens-principle-card strong,
.glens-workflow-card h2,
.glens-entry-flow strong,
.glens-reference-stack strong {
    margin: 0;
    color: #162033;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-weight: 850;
}

.glens-title {
    max-width: 56rem;
    margin-top: 0.2rem;
    font-size: clamp(1.85rem, 3.2vw, 2.65rem);
    line-height: 1.04;
    letter-spacing: -0.045em;
}

.glens-subtitle,
.glens-principle-card p,
.glens-entry-flow p,
.glens-reference-stack p {
    color: #526276;
    font-size: 0.9rem;
    line-height: 1.45;
}

.glens-subtitle {
    max-width: 57rem;
    margin: 0.35rem 0 0;
}

.glens-entry-flow,
.glens-reference-stack {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 1rem;
    border: 1px solid #d8e2ef;
    border-radius: 1rem;
    background: #fff;
    overflow: hidden;
}

.glens-entry-flow > div,
.glens-reference-stack > div {
    padding: 0.82rem 0.9rem;
    border-right: 1px solid #d8e2ef;
}

.glens-entry-flow > div:last-child,
.glens-reference-stack > div:last-child {
    border-right: 0;
}

.glens-entry-flow span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.4rem;
    height: 1.4rem;
    margin-bottom: 0.35rem;
    border-radius: 50%;
    background: #eef4ff;
    color: #0055ff;
    font-size: 0.76rem;
    font-weight: 850;
}

.glens-entry-flow strong,
.glens-reference-stack strong {
    display: block;
    font-size: 0.94rem;
    line-height: 1.22;
}

.glens-entry-flow p,
.glens-reference-stack p {
    margin: 0.38rem 0 0;
    font-size: 0.8rem;
}

.glens-reference-stack {
    grid-template-columns: 1fr;
    margin-top: 0.75rem;
}

.glens-reference-stack > div {
    border-right: 0;
    border-bottom: 1px solid #d8e2ef;
}

.glens-reference-stack > div:last-child {
    border-bottom: 0;
}

.glens-tier-label {
    display: block;
    margin-bottom: 0.28rem;
    font-size: 0.66rem;
}

.glens-badge {
    display: inline-flex;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    background: #eef2f7;
    color: #526276;
    font-size: 0.72rem;
    font-weight: 800;
}

.glens-principle-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.45rem;
}

.glens-principle-card strong {
    display: block;
    font-size: 1.08rem;
    line-height: 1.18;
}

.glens-principle-card p {
    margin: 0.45rem 0 0;
}

.glens-info-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: 1px solid #2f73c9;
    border-radius: 0.55rem;
    background: #eef5ff;
    color: #0b66c3;
    padding: 0.22rem;
}

.glens-info-button:hover,
.glens-info-button:focus-visible {
    border-color: #0b66c3;
    background: #e2efff;
}

.glens-info-button img {
    display: block;
    width: 1rem;
    height: 1rem;
    filter: invert(34%) sepia(90%) saturate(1470%) hue-rotate(190deg) brightness(88%) contrast(94%);
    object-fit: contain;
}

.glens-principle-context {
    position: relative;
    margin-top: 0.85rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e1e8f2;
}

.glens-query-step small {
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
}

.glens-context-heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    margin-bottom: 0.42rem;
}

.glens-context-heading-row .glens-query-step {
    margin-bottom: 0;
}

.glens-front-focus-bar {
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
}

.glens-context-status {
    display: grid;
    gap: 0.18rem;
    padding: 0.55rem 0.65rem;
    border: 1px solid #d8e2ef;
    border-radius: 0.72rem;
    background: #f8fafc;
}

.glens-context-status span {
    color: #526276;
    font-size: 0.72rem;
    font-weight: 850;
}

.glens-context-status strong {
    color: #162033;
    font-size: 0.88rem;
    line-height: 1.25;
}

.glens-context-status p {
    margin-top: 0.25rem;
    font-size: 0.78rem;
}

.glens-context-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    min-height: 1.75rem;
    border: 1px solid #c9d6e7;
    border-radius: 999px;
    background: #f8fafc;
    color: #243b5a;
    padding: 0.22rem 0.55rem;
    font-size: 0.76rem;
    font-weight: 850;
    line-height: 1;
}

.glens-context-toggle-arrow {
    color: #d97706;
    margin-right: 0.35rem;
}

.glens-context-panel {
    position: absolute;
    z-index: 20;
    top: calc(100% + 0.45rem);
    right: 0;
    width: min(35rem, 78vw);
    padding: 0.85rem;
    border: 1px solid #d8e2ef;
    border-radius: 0.95rem;
    background: #fff;
    box-shadow: 0 18px 46px rgba(22, 32, 51, 0.14);
}

.glens-search-card {
    padding: 0.7rem;
}

.glens-search-card--embedded {
    margin-top: 0.9rem;
    padding: 0.65rem 0 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
}

.glens-search-shell {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin-top: 0.45rem;
    padding: 0.38rem;
    border: 1px solid rgba(203, 213, 225, 0.72);
    border-radius: 1rem;
    background: #fff;
}

.glens-search-type-select {
    flex: 0 0 10.2rem;
    min-height: 2.35rem;
    border: 1px solid #d8e2ef;
    border-radius: 0.78rem;
    background: #f8fafc;
    color: #162033;
    font-weight: 850;
    padding: 0 0.7rem;
}

.glens-input {
    flex: 1 1 auto;
    min-width: 0;
    padding: 0.62rem 0.65rem;
    border: 0;
    border-radius: 0.85rem;
    background: transparent;
    color: #162033;
    font-size: 1rem;
}

.glens-input:focus {
    outline: none;
    box-shadow: none;
}

.glens-button {
    padding: 0.65rem 0.9rem;
    border: 0;
    border-radius: 0.85rem;
    background: #162033;
    color: #fff;
    font-weight: 850;
    white-space: nowrap;
}

.glens-example-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.55rem;
}

.glens-example-token {
    display: inline-flex;
    border: 0;
    padding: 0.34rem 0.55rem;
    border-radius: 999px;
    background: #f1f5f9;
    color: #526276;
    font-size: 0.76rem;
    font-weight: 750;
}

.glens-example-token:hover,
.glens-example-token:focus-visible {
    background: #e6eef8;
    color: #162033;
}

.glens-search-hint,
.glens-pending-message {
    margin: 0.55rem 0 0;
    color: #526276;
    font-size: 0.84rem;
    line-height: 1.42;
}

.glens-pending-message {
    font-weight: 800;
}

.glens-summary-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: rgba(15, 23, 42, 0.54);
}

.glens-summary-modal-card {
    position: relative;
    width: min(92vw, 70rem);
    max-height: 88vh;
    padding: 1rem;
    border-radius: 1rem;
    background: #fff;
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
    overflow: auto;
}

.glens-summary-modal-card button {
    position: sticky;
    top: 0;
    margin-left: auto;
    display: block;
    border: 1px solid #cdd9e7;
    border-radius: 0.55rem;
    background: #fff;
    color: #162033;
    font-weight: 800;
    padding: 0.35rem 0.6rem;
}

.glens-summary-modal-copy {
    margin: 0.4rem 0 0.85rem;
    padding-right: 3.2rem;
}

.glens-summary-modal-copy h2 {
    margin: 0.25rem 0 0;
    color: #162033;
    font-size: 1.25rem;
    line-height: 1.2;
    font-weight: 850;
}

.glens-summary-modal-copy > p:not(.glens-card-label) {
    max-width: 62rem;
    margin: 0.45rem 0 0;
    color: #526276;
    font-size: 0.92rem;
    line-height: 1.45;
}

.glens-summary-step-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 0.8rem;
    border: 1px solid #d8e2ef;
    border-radius: 0.9rem;
    overflow: hidden;
    background: #f8fafc;
}

.glens-summary-step-grid > div {
    padding: 0.75rem 0.82rem;
    border-right: 1px solid #d8e2ef;
}

.glens-summary-step-grid > div:last-child {
    border-right: 0;
}

.glens-summary-step-grid span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.35rem;
    height: 1.35rem;
    margin-bottom: 0.32rem;
    border-radius: 50%;
    background: #eef4ff;
    color: #0055ff;
    font-size: 0.72rem;
    font-weight: 850;
}

.glens-summary-step-grid strong {
    display: block;
    color: #162033;
    font-size: 0.92rem;
    line-height: 1.22;
}

.glens-summary-step-grid p {
    margin: 0.35rem 0 0;
    color: #526276;
    font-size: 0.78rem;
    line-height: 1.4;
}

.glens-summary-modal-card img {
    display: block;
    width: 100%;
    height: auto;
    margin-top: 0.65rem;
}

.glens-workflow-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    margin-top: 1rem;
    overflow: hidden;
}

.glens-workflow-card {
    padding: 1rem 1.15rem;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}

.glens-workflow-card + .glens-workflow-card {
    border-left: 1px solid #d8e2ef;
}

.glens-workflow-card h2 {
    margin-top: 0.35rem;
    font-size: 1.18rem;
    line-height: 1.18;
}

.glens-workflow-card ol {
    margin: 0.75rem 0 0;
    padding-left: 1.05rem;
    color: #526276;
}

.glens-workflow-card li {
    margin-top: 0.42rem;
    line-height: 1.38;
    font-size: 0.88rem;
}

@media (max-width: 991.98px) {
    .glens-hero-grid,
    .glens-entry-flow,
    .glens-workflow-grid {
        grid-template-columns: 1fr;
    }

    .glens-entry-flow > div,
    .glens-workflow-card + .glens-workflow-card {
        border-left: 0;
        border-top: 1px solid #d8e2ef;
    }

    .glens-entry-flow > div {
        border-right: 0;
    }
}

@media (max-width: 767.98px) {
    .glens-page {
        padding: 1.25rem 0.9rem 2rem;
    }

    .glens-hero-copy,
    .glens-principle-card,
    .glens-workflow-card {
        padding: 1.05rem;
    }

    .glens-search-shell {
        flex-direction: column;
        align-items: stretch;
    }

    .glens-search-type-select {
        flex: 0 0 auto;
        width: 100%;
    }

    .glens-button {
        width: 100%;
    }

    .glens-summary-step-grid {
        grid-template-columns: 1fr;
    }

    .glens-summary-step-grid > div {
        border-right: 0;
        border-bottom: 1px solid #d8e2ef;
    }

    .glens-summary-step-grid > div:last-child {
        border-bottom: 0;
    }
}
</style>
