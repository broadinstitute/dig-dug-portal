<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            page="front"
        ></page-header>

        <div class="container-fluid mdkp-body glens-page">
            <section class="glens-hero">
                <div class="glens-hero-grid">
                    <div class="glens-hero-copy">
                        <p class="glens-eyebrow">Clinical Evidence Matching</p>
                        <h1 class="glens-title">
                            Rare disease cohort evidence workflow
                        </h1>
                        <p class="glens-subtitle">
                            Start with a sample ID, phenotype profile, or rare variant/gene.
                            The portal helps compare patient-level clues against CRDC cohort
                            evidence before moving toward candidate gene or variant interpretation.
                        </p>
                    </div>

                    <div class="glens-principle-card">
                        <span class="glens-badge">Our purpose</span>
                        <strong>Not a genome browser.</strong>
                        <p>
                            A workflow for testing whether a patient variant or phenotype profile
                            has supporting evidence across cohort-level signals.
                        </p>
                    </div>
                </div>

                <form class="glens-search-card" @submit.prevent="openResults">
                    <div class="glens-mode-row">
                        <button
                            v-for="mode in searchModes"
                            :key="mode.key"
                            type="button"
                            class="glens-mode-button"
                            :class="{ 'glens-mode-button--active': activeMode === mode.key }"
                            @click="activeMode = mode.key"
                        >
                            {{ mode.label }}
                        </button>
                    </div>

                    <label class="glens-label" for="clinical-search">
                        Unified search input
                    </label>
                    <div class="glens-search-shell">
                        <input
                            id="clinical-search"
                            v-model.trim="query"
                            class="glens-input"
                            type="text"
                            :placeholder="activePlaceholder"
                        />
                        <button class="glens-button" type="submit">
                            Start workflow
                        </button>
                    </div>

                    <div class="glens-example-row">
                        <span v-for="example in activeExamples" :key="example">{{ example }}</span>
                    </div>
                    <p v-if="activeFixture.hint" class="glens-search-hint">
                        {{ activeFixture.hint }}
                    </p>
                    <p v-if="pendingMessage" class="glens-pending-message">
                        {{ pendingMessage }}
                    </p>
                </form>

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
export default {
    name: "KrFrontTemplate",
    data() {
        return {
            activeMode: "cohort",
            query: "",
            pendingMessage: "",
            searchModes: [
                { key: "cohort", label: "Search by ID" },
                { key: "phenotype", label: "Search by phenotype" },
                { key: "variant", label: "Search by variant / gene" },
            ],
            fixtures: {
                variant: {
                    destination: "/krVariant_V3.html",
                    placeholder:
                        "chr15:22,000,220 G>C / UBE3A / 15q11-q13 microdeletion syndrome",
                    fallback: "chr15:22,000,220 G>C",
                    examples: [
                        "chr15:22,000,220 G>C",
                        "UBE3A",
                        "15q11-q13 microdeletion syndrome",
                    ],
                    hint: "Use this when you already have a variant, gene, or disease-related term.",
                },
                phenotype: {
                    destination: "/krPhenotype.html",
                    placeholder:
                        "cleft palate [HP:0000175], developmental delay [HP:0001263]",
                    fallback: "cleft palate [HP:0000175]",
                    examples: [
                        "cleft palate [HP:0000175]",
                        "HP:0001248, HP:0000343",
                        "hypotonia, developmental delay",
                    ],
                    hint: "For multiple HPO terms, separate terms with commas. The backend can treat them as a phenotype profile.",
                },
                cohort: {
                    destination: "/sample.html",
                    queryParam: "sample_id",
                    placeholder:
                        "BCH-12-34567-01",
                    fallback: "BCH-12-34567-01",
                    examples: [
                        "BCH-12-34567-01",
                    ],
                    hint: "Search one sample ID to open the sample-centered evidence hub.",
                },
            },
            workflows: [
                {
                    key: "sample",
                    kicker: "Sample ID-first workflow",
                    title: "Where does this patient fit in the cohort?",
                    steps: [
                        "Start with one BCH sample ID",
                        "Review HPO count, GenDX status, sex, age, and investigator group",
                        "Find phenotype-similar patients and their genetic signals",
                        "Compare investigator phenotype-signature affinity and public disease hypotheses",
                        "Move toward candidate gene and variant evidence only after the similarity context is clear",
                    ],
                },
                {
                    key: "phenotype",
                    kicker: "Phenotype-first workflow",
                    title: "How does this phenotype profile recur across the cohort?",
                    steps: [
                        "Search cohort samples using one or more phenotype terms",
                        "Identify similar patients and correlated phenotype structure",
                        "Explore co-observed phenotypes and disease domains",
                        "Review matched genes, variants, and supporting evidence",
                        "Navigate toward phenotype-supported candidate interpretation",
                    ],
                },
                {
                    key: "variant",
                    kicker: "Variant-first workflow",
                    title: "Does this rare finding recur across the cohort?",
                    steps: [
                        "Identify exact or gene-level carriers in CRDC cohorts",
                        "Review affected, proband, investigator, and department patterns",
                        "Explore shared phenotypes and disease-domain consistency",
                        "Evaluate recurrence strength and supporting cohort evidence",
                        "Navigate toward candidate variant interpretation",
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
    },
    methods: {
        openResults() {
            const value = this.query || this.activeFixture.fallback;
            this.pendingMessage = "";

            if (!this.activeFixture.destination) {
                this.pendingMessage = `Cohort filter search is planned for version 02. Example filter captured: ${value}`;
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

.glens-hero-grid,
.glens-workflow-grid {
    display: grid;
    gap: 1rem;
}

.glens-hero-grid {
    grid-template-columns: minmax(0, 1.65fr) minmax(18rem, 0.72fr);
}

.glens-workflow-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.glens-hero-copy,
.glens-principle-card,
.glens-search-card,
.glens-workflow-card {
    border: 1px solid rgba(203, 213, 225, 0.58);
    border-radius: 1.6rem;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 18px 48px rgba(22, 32, 51, 0.06);
}

.glens-hero-copy {
    padding: 1rem 1.45rem;
}

.glens-principle-card {
    padding: 0.95rem 1.15rem;
    background: rgba(255, 255, 255, 0.9);
}

.glens-eyebrow,
.glens-label,
.glens-card-label {
    margin: 0;
    color: #526276;
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
}

.glens-title,
.glens-principle-card strong,
.glens-workflow-card h2,
.glens-priority-panel h2 {
    margin: 0;
    color: #162033;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-weight: 850;
}

.glens-title {
    max-width: 54rem;
    margin-top: 0.2rem;
    font-size: clamp(1.75rem, 3.35vw, 2.75rem);
    line-height: 1.02;
    letter-spacing: -0.055em;
}

.glens-subtitle,
.glens-principle-card p {
    color: #526276;
    font-size: 0.88rem;
    line-height: 1.42;
}

.glens-subtitle {
    max-width: 50rem;
    margin: 0.55rem 0 0;
}

.glens-badge {
    display: inline-flex;
    margin-bottom: 0.45rem;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    background: #eef2f7;
    color: #526276;
    font-size: 0.72rem;
    font-weight: 800;
}

.glens-principle-card strong {
    display: block;
    font-size: 1.08rem;
    line-height: 1.12;
}

.glens-search-card {
    margin-top: 0.9rem;
    padding: 1.3rem;
}

.glens-mode-row {
    display: inline-flex;
    gap: 0.35rem;
    padding: 0.25rem;
    border-radius: 999px;
    background: #eef2f7;
}

.glens-mode-button {
    padding: 0.58rem 0.95rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #526276;
    font-weight: 850;
    cursor: pointer;
}

.glens-mode-button--active {
    background: #162033;
    color: #fff;
}

.glens-label {
    display: block;
    margin-top: 1.1rem;
}

.glens-search-shell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.7rem;
    padding: 0.6rem;
    border: 1px solid rgba(203, 213, 225, 0.72);
    border-radius: 1.25rem;
    background: #fff;
}

.glens-input {
    flex: 1 1 auto;
    min-width: 0;
    padding: 1rem 1rem;
    border: 0;
    border-radius: 1rem;
    background: transparent;
    color: #162033;
    font-size: 1rem;
}

.glens-input:focus {
    outline: none;
    box-shadow: none;
}

.glens-button {
    padding: 0.95rem 1.25rem;
    border: 0;
    border-radius: 1rem;
    background: #162033;
    color: #fff;
    font-weight: 850;
}

.glens-example-row,
.glens-priority-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.glens-example-row {
    margin-top: 0.8rem;
}

.glens-search-hint,
.glens-pending-message {
    margin: 0.8rem 0 0;
    color: #526276;
    font-size: 0.84rem;
    line-height: 1.45;
}

.glens-pending-message {
    color: #526276;
    font-weight: 800;
}

.glens-example-row span,
.glens-priority-list span {
    display: inline-flex;
    padding: 0.44rem 0.7rem;
    border-radius: 999px;
    background: #f1f5f9;
    color: #526276;
    font-size: 0.78rem;
    font-weight: 750;
}

.glens-workflow-grid {
    margin-top: 1rem;
}

.glens-workflow-card {
    padding: 1.45rem;
}

.glens-workflow-card h2 {
    margin-top: 0.45rem;
    font-size: 1.45rem;
    line-height: 1.2;
}

.glens-workflow-card ol {
    margin: 1rem 0 0;
    padding-left: 1.2rem;
    color: #526276;
}

.glens-workflow-card li {
    margin-top: 0.55rem;
    line-height: 1.45;
}

@media (max-width: 991.98px) {
    .glens-hero-grid,
    .glens-workflow-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 767.98px) {
    .glens-page {
        padding: 1.25rem 0.9rem 2rem;
    }

    .glens-hero-copy,
    .glens-principle-card,
    .glens-search-card,
    .glens-workflow-card {
        padding: 1.1rem;
    }

    .glens-search-shell,
    .glens-mode-row {
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .glens-button {
        width: 100%;
    }
}
</style>
