<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            page="front"
        ></page-header>

        <div class="container-fluid mdkp-body glens-page glens-page-new">
            <section class="glens-hero">
                <div class="glens-workflow-builder">
                    <header class="glens-workflow-builder-header">
                        <p class="glens-eyebrow">CRDC rare disease cohort exploration</p>
                        <h1 class="glens-title">
                            Search CRDC first, then review rare disease references.
                        </h1>
                        <p class="glens-subtitle">
                            Start from a sample, gene, variant, or HPO phenotype profile. The portal
                            first looks for CRDC cohort evidence, then adds optional HPO context from
                            HPO terms, Orphanet, or MONDO.
                        </p>
                    </header>

                    <div class="glens-workflow-steps">
                        <section
                            class="glens-workflow-step glens-workflow-step--search"
                            :class="{ 'glens-workflow-step--complete': searchSubjectConfirmed }"
                        >
                            <div class="glens-workflow-step-head">
                                <span>1</span>
                                <div>
                                    <p>Search</p>
                                    <h2>Search subject</h2>
                                </div>
                            </div>
                            <form
                                id="glens-search-form"
                                class="glens-search-card glens-search-card--embedded"
                                @submit.prevent="confirmSearchSubject"
                            >
                                <select
                                    v-model="activeMode"
                                    class="glens-search-type-select"
                                    aria-label="Search type"
                                    @change="resetSearchSubject"
                                >
                                    <option
                                        v-for="mode in searchModes"
                                        :key="mode.key"
                                        :value="mode.key"
                                    >
                                        {{ mode.shortLabel }}
                                    </option>
                                </select>
                                <div class="glens-search-shell glens-search-shell--typed">
                                    <input
                                        id="clinical-search"
                                        v-model.trim="query"
                                        class="glens-input"
                                        type="text"
                                        aria-label="Search input"
                                        :placeholder="activePlaceholder"
                                    />
                                    <button class="glens-search-submit" type="submit">Set</button>
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
                                <p v-if="pendingMessage" class="glens-pending-message" role="status" aria-live="polite">
                                    {{ pendingMessage }}
                                </p>
                            </form>
                        </section>

                        <section
                            class="glens-workflow-step"
                            :class="{ 'glens-workflow-step--complete': hasActiveContext }"
                        >
                            <div class="glens-workflow-step-head">
                                <span>2</span>
                                <div>
                                    <p>Optional</p>
                                    <h2>Clinical context</h2>
                                </div>
                            </div>
                            <div class="glens-context-heading-row">
                                <span class="glens-step-support">HPO background</span>
                                <div class="glens-context-step-actions">
                                    <button
                                        v-if="hasActiveContext"
                                        class="glens-context-clear"
                                        type="button"
                                        @click="clearContext"
                                    >
                                        Clear HPO
                                    </button>
                                    <button
                                        class="glens-context-toggle"
                                        type="button"
                                        aria-haspopup="dialog"
                                        @click="openContextEditor(false)"
                                    >
                                        <span class="glens-context-toggle-arrow">›</span>
                                        {{ hasActiveContext ? "Edit context" : "Set context" }}
                                    </button>
                                </div>
                            </div>
                            <div class="glens-context-status">
                                <span>{{ hasActiveContext ? "Session HPO context · persists across PB pages" : "No context set" }}</span>
                                <strong>{{ contextStatusLabel }}</strong>
                                <p>
                                    Active context is compared to sample, disease, or carrier HPO
                                    profiles. It is not a direct variant-similarity score.
                                </p>
                            </div>
                        </section>

                        <section class="glens-workflow-step glens-workflow-step--review">
                            <div class="glens-workflow-step-head">
                                <span>3</span>
                                <div>
                                    <p>Confirm</p>
                                    <h2>Review workflow</h2>
                                </div>
                                <button class="glens-reset-all" type="button" @click="resetFront">
                                    Reset all
                                </button>
                            </div>
                            <div class="glens-review-summary">
                                <span>Search subject</span>
                                <strong>{{ activeModeLabel }} · {{ activeSearchValue || "Not set" }}</strong>
                                <span>Clinical context</span>
                                <strong>{{ hasActiveContext ? contextStatusLabel : "No context" }}</strong>
                            </div>
                            <button
                                class="glens-review-open"
                                type="button"
                                :disabled="!searchSubjectConfirmed"
                                @click="openResults"
                            >
                                Review workflow <span aria-hidden="true">›</span>
                            </button>
                        </section>
                    </div>
                </div>

                <div
                    v-if="workflowReviewOpen"
                    class="glens-workflow-review-modal"
                    @click.self="closeWorkflowReview"
                    @keydown.esc="closeWorkflowReview"
                >
                    <section
                        class="glens-workflow-review-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="workflow-review-title"
                    >
                        <header class="glens-modal-header">
                            <div>
                                <p class="glens-card-label">Before opening results</p>
                                <h2 id="workflow-review-title">Review workflow</h2>
                                <p>Confirm the search subject and optional clinical context.</p>
                            </div>
                            <button type="button" class="glens-modal-close" @click="closeWorkflowReview">
                                Close
                            </button>
                        </header>

                        <div class="glens-workflow-review-list">
                            <section>
                                <span>Search subject</span>
                                <strong>{{ activeModeLabel }}</strong>
                                <p>{{ activeSearchValue }}</p>
                            </section>
                            <section>
                                <span>Clinical context <small>optional</small></span>
                                <strong>{{ hasActiveContext ? "HPO context included" : "No context" }}</strong>
                                <p>{{ contextStatusLabel }}</p>
                                <div class="glens-workflow-review-controls">
                                    <button type="button" @click="openContextEditor(true)">
                                        {{ hasActiveContext ? "Edit context" : "Add context" }}
                                    </button>
                                    <button
                                        v-if="hasActiveContext"
                                        type="button"
                                        class="glens-review-clear"
                                        @click="clearContext"
                                    >
                                        Clear context
                                    </button>
                                </div>
                            </section>
                            <section>
                                <span>Result behavior</span>
                                <strong>
                                    {{ hasActiveContext ? "CRDC evidence with HPO comparison" : "CRDC discovery mode" }}
                                </strong>
                                <p>
                                    {{ hasActiveContext
                                        ? "The result page keeps the search subject primary and adds the selected HPO comparison."
                                        : "The result page opens without a clinical comparison target." }}
                                </p>
                            </section>
                        </div>

                        <footer class="glens-modal-actions">
                            <button type="button" class="glens-modal-secondary" @click="closeWorkflowReview">
                                Cancel
                            </button>
                            <button type="button" class="glens-modal-primary" @click="runWorkflow">
                                Run workflow
                            </button>
                        </footer>
                    </section>
                </div>

                <div
                    v-if="contextPanelOpen"
                    class="glens-context-panel"
                    @click.self="closeContextEditor"
                    @keydown.esc="closeContextEditor"
                >
                    <section
                        class="glens-context-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="clinical-context-title"
                    >
                        <header class="glens-modal-header">
                            <div>
                                <p class="glens-card-label">Optional comparison</p>
                                <h2 id="clinical-context-title">Clinical context</h2>
                                <p>Add HPO terms directly or resolve an Orphanet or MONDO disease profile.</p>
                            </div>
                            <button type="button" class="glens-modal-close" @click="closeContextEditor">
                                Close
                            </button>
                        </header>
                        <clinical-focus-bar
                            class="glens-front-focus-bar"
                            :show-no-focus-note="true"
                            :hide-kicker="true"
                            :open-editor-on-mount="true"
                            :hide-summary="true"
                            @focus-confirmed="closeContextEditor"
                            @focus-cancelled="closeContextEditor"
                        ></clinical-focus-bar>
                    </section>
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
                                        HPO terms, an Orphanet disease profile, or a MONDO disease
                                        concept can be used as the clinical hypothesis.
                                    </p>
                                </div>
                                <div>
                                    <span>3</span>
                                    <strong>Evidence layers</strong>
                                    <p>
                                        CRDC recurrence and phenotype overlap are primary. HPO,
                                        Orphanet, and MONDO provide the optional comparison context.
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

                <section class="glens-purpose-workflows">
                    <div class="glens-purpose-strip">
                        <div>
                            <div class="glens-purpose-heading">
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
            </section>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import ClinicalFocusBar from "../KrClinicalFocus/ClinicalFocusBar.vue";
import { onClinicalFocusChange, readClinicalFocus } from "../KrClinicalFocus/focusStore";
import { createFrontPageState, frontComputed, frontMethods } from "./pageModel";

export default {
    name: "KrFrontTemplate",
    components: {
        ClinicalFocusBar,
    },
    data() {
        return {
            ...createFrontPageState(),
            clinicalFocus: readClinicalFocus(),
            unsubscribeClinicalFocus: null,
        };
    },
    computed: frontComputed,
    mounted() {
        this.unsubscribeClinicalFocus = onClinicalFocusChange((focus) => {
            this.clinicalFocus = focus;
        });
    },
    beforeDestroy() {
        if (this.unsubscribeClinicalFocus) this.unsubscribeClinicalFocus();
    },
    methods: frontMethods,
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

.glens-workflow-builder,
.glens-purpose-workflows {
    border: 1px solid rgba(203, 213, 225, 0.64);
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 10px 30px rgba(22, 32, 51, 0.045);
}

.glens-workflow-builder {
    overflow: hidden;
}

.glens-purpose-workflows {
    margin-top: 1rem;
    overflow: hidden;
}

.glens-workflow-builder-header {
    padding: 1.25rem 1.45rem 1.1rem;
    border-bottom: 1px solid #d8e2ef;
}

.glens-reset-all {
    margin-left: auto;
    border: 1px solid #b45309;
    border-radius: 0.45rem;
    background: #d97706;
    color: #fff;
    padding: 0.4rem 0.7rem;
    font-size: 0.76rem;
    font-weight: 850;
    box-shadow: 0 2px 5px rgba(180, 83, 9, 0.22);
    transition: background-color 160ms ease-out, box-shadow 160ms ease-out;
}

.glens-reset-all:hover,
.glens-reset-all:focus-visible {
    background: #b45309;
    color: #fff;
    box-shadow: 0 3px 8px rgba(180, 83, 9, 0.3);
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

.glens-workflow-steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.glens-workflow-step {
    position: relative;
    min-width: 0;
    padding: 1rem 1.15rem 1.15rem;
    background: #fff;
}

.glens-workflow-step--search {
    transition: background-color 180ms ease-out, box-shadow 180ms ease-out;
}

.glens-workflow-step--search.glens-workflow-step--complete {
    background: #edf8f3;
    box-shadow: inset 0 3px 0 #21805b;
}

.glens-workflow-step--search.glens-workflow-step--complete .glens-workflow-step-head > span,
.glens-workflow-step--search.glens-workflow-step--complete .glens-search-submit {
    border-color: #21805b;
    background: #21805b;
    color: #fff;
}

.glens-workflow-step + .glens-workflow-step {
    border-left: 1px solid #d8e2ef;
}

.glens-workflow-step:not(:last-child)::after {
    content: "›";
    position: absolute;
    z-index: 2;
    top: 50%;
    right: -1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid #c7d7e8;
    border-radius: 50%;
    background: #eaf1f8;
    color: #244f7a;
    font-size: 1.6rem;
    font-weight: 800;
    line-height: 1;
    transform: translateY(-50%);
}

.glens-workflow-step--complete:not(:last-child)::after {
    border-color: #6ba7e5;
    background: #0b66c3;
    color: #fff;
}

.glens-workflow-step-head {
    display: flex;
    align-items: center;
    gap: 0.65rem;
}

.glens-workflow-step-head > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 2rem;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: #dce9f7;
    color: #244f7a;
    font-size: 0.92rem;
    font-weight: 900;
}

.glens-workflow-step-head p,
.glens-workflow-step-head h2 {
    margin: 0;
}

.glens-workflow-step-head p {
    color: #65758b;
    font-size: 0.67rem;
    font-weight: 850;
    letter-spacing: 0.09em;
    text-transform: uppercase;
}

.glens-workflow-step-head h2 {
    margin-top: 0.08rem;
    color: #162033;
    font-size: 1.05rem;
    font-weight: 850;
}

.glens-context-heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    margin: 0.9rem 0 0.42rem;
}

.glens-step-support {
    color: #65758b;
    font-size: 0.78rem;
    font-weight: 750;
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

.glens-context-step-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.glens-context-clear {
    min-height: 1.75rem;
    border: 1px solid #dc9d9d;
    border-radius: 0.4rem;
    background: #fff1f1;
    color: #a12828;
    padding: 0.22rem 0.5rem;
    font-size: 0.74rem;
    font-weight: 850;
}

.glens-review-summary {
    display: grid;
    gap: 0.22rem;
    margin-top: 0.9rem;
}

.glens-review-summary span {
    margin-top: 0.35rem;
    color: #65758b;
    font-size: 0.7rem;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
}

.glens-review-summary strong {
    color: #162033;
    font-size: 0.84rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
}

.glens-review-open {
    width: 100%;
    min-height: 2.35rem;
    margin-top: 0.9rem;
    border: 1px solid #6f8fb2;
    border-radius: 0.45rem;
    background: #eaf1f8;
    color: #244f7a;
    font-size: 0.86rem;
    font-weight: 850;
}

.glens-review-open span {
    margin-left: 0.3rem;
    color: #b85d00;
    font-size: 1rem;
}

.glens-review-open:disabled {
    cursor: not-allowed;
    opacity: 0.48;
}

.glens-purpose-strip {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.15rem;
    border-bottom: 1px solid #d8e2ef;
}

.glens-purpose-heading {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.glens-purpose-strip strong {
    display: block;
    margin-top: 0.35rem;
    color: #162033;
    font-size: 1.02rem;
}

.glens-purpose-strip p {
    max-width: 56rem;
    margin: 0.3rem 0 0;
    color: #526276;
    font-size: 0.86rem;
    line-height: 1.4;
}

.glens-context-panel {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.42);
}

.glens-workflow-review-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.42);
}

.glens-context-modal-card,
.glens-workflow-review-card {
    width: min(42rem, 92vw);
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
    border: 1px solid #d8e2ef;
    border-radius: 0.75rem;
    background: #fff;
    box-shadow: 0 2px 14px rgba(15, 23, 42, 0.08);
    animation: glens-modal-enter 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.glens-context-modal-card {
    width: min(72rem, 94vw);
}

.glens-workflow-review-card {
    display: flex;
    flex-direction: column;
    width: min(36rem, 92vw);
}

.glens-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1.25rem 1.35rem 1rem;
    border-bottom: 1px solid #e1e8f2;
}

.glens-modal-header h2 {
    margin: 0.22rem 0 0;
    color: #162033;
    font-size: 1.35rem;
    font-weight: 850;
    letter-spacing: -0.02em;
}

.glens-modal-header p:not(.glens-card-label) {
    margin: 0.35rem 0 0;
    color: #526276;
    font-size: 0.88rem;
    line-height: 1.45;
}

.glens-modal-close {
    flex: 0 0 auto;
    border: 0;
    background: transparent;
    color: #526276;
    font-size: 0.82rem;
    font-weight: 800;
    padding: 0.25rem 0;
}

.glens-workflow-review-list {
    display: flex;
    flex-direction: column;
    padding: 0 1.35rem;
}

.glens-workflow-review-list section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding: 1rem 0;
    border-bottom: 0;
}

.glens-workflow-review-list section:not(:last-child)::after {
    content: "↓";
    align-self: center;
    margin: 0.75rem 0 -0.45rem;
    color: #7d98b7;
    font-size: 1.55rem;
    font-weight: 800;
    line-height: 1;
}

.glens-workflow-review-list span {
    display: block;
    color: #526276;
    font-size: 0.72rem;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.glens-workflow-review-list span small {
    font-size: inherit;
    letter-spacing: inherit;
}

.glens-workflow-review-list strong {
    display: block;
    margin-top: 0.28rem;
    color: #162033;
    font-size: 1rem;
    line-height: 1.3;
}

.glens-workflow-review-list p {
    margin: 0.28rem 0 0;
    color: #526276;
    font-size: 0.88rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
}

.glens-workflow-review-list button {
    margin-top: 0.6rem;
    border: 1px solid #c9d6e7;
    border-radius: 0.35rem;
    background: #fff;
    color: #243b5a;
    font-size: 0.82rem;
    font-weight: 800;
    padding: 0.42rem 0.65rem;
}

.glens-workflow-review-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
}

.glens-workflow-review-list .glens-review-clear {
    border-color: transparent;
    color: #75504c;
}

.glens-modal-actions {
    position: sticky;
    bottom: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.55rem;
    padding: 1rem 1.35rem 1.2rem;
    border-top: 1px solid #e1e8f2;
    background: #fff;
}

.glens-modal-actions button {
    min-height: 2.35rem;
    border-radius: 0.35rem;
    font-size: 0.86rem;
    font-weight: 850;
    padding: 0.48rem 0.85rem;
}

.glens-modal-secondary {
    border: 1px solid #c9d6e7;
    background: #fff;
    color: #243b5a;
}

.glens-modal-primary {
    border: 1px solid #162033;
    background: #162033;
    color: #fff;
}

.glens-modal-primary:active,
.glens-workflow-review-list button:active {
    transform: scale(0.98);
}

@keyframes glens-modal-enter {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
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
    margin-top: 0.35rem;
}

.glens-search-type-select {
    width: auto;
    min-height: 1.7rem;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #162033;
    font-weight: 850;
    padding: 0 1.25rem 0 0;
}

.glens-input {
    flex: 1 1 auto;
    min-width: 0;
    padding: 0.62rem 0.65rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.3rem;
    background: #fff;
    color: #162033;
    font-size: 1rem;
}

.glens-input:focus {
    border-color: #6f8fb2;
    outline: 2px solid #dbeafe;
    outline-offset: 0;
}

.glens-search-submit {
    min-height: 1.9rem;
    padding: 0.28rem 0.55rem;
    border: 1px solid #6f8fb2;
    border-radius: 0.3rem;
    background: #eaf1f8;
    transition: background-color 180ms ease-out, border-color 180ms ease-out, color 180ms ease-out;
    color: #244f7a;
    font-size: 0.76rem;
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
    margin-top: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
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
    .glens-workflow-steps,
    .glens-entry-flow,
    .glens-workflow-grid {
        grid-template-columns: 1fr;
    }

    .glens-workflow-step + .glens-workflow-step {
        border-top: 1px solid #d8e2ef;
        border-left: 0;
    }

    .glens-workflow-step:not(:last-child)::after {
        top: auto;
        right: 50%;
        bottom: -1rem;
        transform: translateX(50%) rotate(90deg);
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

    .glens-workflow-card {
        padding: 1.05rem;
    }

    .glens-search-shell {
        flex-direction: column;
        align-items: stretch;
    }

    .glens-context-panel,
    .glens-workflow-review-modal {
        align-items: flex-start;
        padding: 0.75rem;
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

@media (prefers-reduced-motion: reduce) {
    .glens-workflow-step--search,
    .glens-search-submit,
    .glens-reset-all {
        transition: none;
    }

    .glens-context-modal-card,
    .glens-workflow-review-card {
        animation: none;
    }
}
</style>
