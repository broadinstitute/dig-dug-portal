<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body glens-page">
            <div class="glens-phenotype" :class="{ 'glens-large-text': largeText }">
                <div class="glens-access-toolbar" aria-label="Display options">
                    <div class="glens-page-mode-label" aria-label="Current workflow">
                        <span>Current workflow</span>
                        <strong>Phenotype search</strong>
                    </div>
                    <div class="glens-result-tools">
                        <span
                            class="glens-result-context-badge"
                            :class="{ 'glens-result-context-badge--active': hasActiveContext }"
                        >
                            {{ hasActiveContext ? "Context active" : "No context" }}
                        </span>
                        <div class="glens-result-context-tool" @click.stop>
                            <button
                                class="glens-result-tool-button"
                                type="button"
                                @click="contextPopoverOpen = !contextPopoverOpen; optionsPopoverOpen = false"
                            >
                                Edit Context
                            </button>
                            <div v-if="contextPopoverOpen" class="glens-result-context-popover">
                                <button
                                    class="glens-result-popover-close"
                                    type="button"
                                    aria-label="Close context editor"
                                    @click="contextPopoverOpen = false"
                                >
                                    ×
                                </button>
                                <clinical-focus-bar
                                    class="glens-result-focus-bar"
                                    :open-editor-on-mount="true"
                                    :hide-summary="true"
                                    @focus-confirmed="contextPopoverOpen = false"
                                    @focus-cancelled="contextPopoverOpen = false"
                                ></clinical-focus-bar>
                                <button
                                    v-if="hasActiveContext"
                                    class="glens-result-remove-context"
                                    type="button"
                                    @click="removeClinicalContext"
                                >
                                    Remove Context
                                </button>
                            </div>
                        </div>
                        <div class="glens-result-options-tool" @click.stop>
                            <button
                                class="glens-result-options-button"
                                type="button"
                                aria-label="Options"
                                @click="optionsPopoverOpen = !optionsPopoverOpen; contextPopoverOpen = false"
                            >
                                ⋮
                            </button>
                            <div v-if="optionsPopoverOpen" class="glens-result-options-popover">
                                <button
                                    class="glens-result-popover-close"
                                    type="button"
                                    aria-label="Close options"
                                    @click="optionsPopoverOpen = false"
                                >
                                    ×
                                </button>
                                <label class="glens-text-toggle glens-text-toggle--popover">
                                    <input v-model="largeText" type="checkbox" />
                                    Large text
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <section class="glens-hero">
                    <div class="glens-query">
                        <div class="glens-query-plain">
                            <strong>Query phenotype term check</strong>
                            <span v-for="term in phenotype.queryTerms.exact" :key="term.id">
                                {{ term.label }} [{{ term.id }}]
                            </span>
                        </div>
                        <div v-if="hasActiveContext" class="glens-new-context-compare">
                            <span>Active HPO context</span>
                            <strong>{{ queryContextOverlapText }}</strong>
                            <small
                                v-for="term in activeContextTerms"
                                :key="term.id || term.label"
                            >
                                {{ term.label }}<template v-if="term.id"> [{{ term.id }}]</template>
                            </small>
                        </div>
                        <div class="glens-query-match-summary">
                            <div class="glens-query-match-label">
                                <span>Phenotype-similar samples</span>
                                <button class="glens-query-info" type="button" aria-label="Phenotype-similar samples explanation">
                                    i
                                    <span class="glens-query-info-popover">raw weighted similarity search</span>
                                </button>
                            </div>
                            <strong>{{ cohortSummary.value }}</strong>
                        </div>
                    </div>
                    <div class="glens-hero-results">
                        <div class="glens-summary-group glens-summary-group--cohort">
                            <div class="glens-summary-cell">
                                <div class="glens-hero-cohort-copy">
                                    <strong>{{ cohortSummary.primary }}</strong>
                                    <span>{{ cohortSummary.eligible }}</span>
                                    <span>{{ cohortSummary.sex }}</span>
                                    <span>{{ cohortSummary.proband }}</span>
                                    <span class="glens-hero-cohort-copy__check">{{ annotationBurdenSummary.label }}: {{ annotationBurdenSummary.value }}</span>
                                    <span>{{ annotationBurdenSummary.detail }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="glens-summary-group glens-summary-group--pair">
                            <div class="glens-summary-cell">
                                <span>{{ topPhenotypeDomainSummary.label }}</span>
                                <div class="glens-domain-summary-list">
                                    <div
                                        v-for="domain in topPhenotypeDomainSummary.domains"
                                        :key="domain.label"
                                    >
                                        <strong>{{ domain.label }}</strong>
                                        <small>{{ domain.count }}</small>
                                    </div>
                                </div>
                            </div>
                            <div class="glens-summary-cell glens-summary-cell--candidate">
                                <div class="glens-heading-with-info">
                                    <span>CRDC-linked gene evidence</span>
                                    <span class="glens-query-info-wrap">
                                        <button
                                            class="glens-query-info"
                                            type="button"
                                            aria-label="Candidate gene evidence source explanation"
                                            @click.stop="candidateInfoOpen = !candidateInfoOpen"
                                        >
                                            i
                                        </button>
                                        <span
                                            v-if="candidateInfoOpen"
                                            class="glens-query-info-popover glens-query-info-popover--wide glens-query-info-popover--candidate glens-query-info-popover--open"
                                        >
                                            <button
                                                class="glens-query-info-close"
                                                type="button"
                                                aria-label="Close evidence source explanation"
                                                @click.stop="candidateInfoOpen = false"
                                            >
                                                ×
                                            </button>
                                            <span>Evidence source</span>
                                            <span>External: exact searched HPO terms are supported by external disease or gene-phenotype annotations.</span>
                                            <span>CRDC: rare variants in this gene are observed among phenotype-matched CRDC samples.</span>
                                            <span>CRDC-only genes are cohort recurrence signals, not reference-derived gene matches.</span>
                                        </span>
                                    </span>
                                </div>
                                <div class="glens-candidate-source-list">
                                    <div
                                        v-for="item in phenotype.candidateEvidenceSummary"
                                        :key="item.gene"
                                        class="glens-candidate-source-row"
                                    >
                                        <strong>{{ item.gene }}</strong>
                                        <small>[{{ compactCandidateSourceLabel(item.gene, item.sources) }}]</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="glens-hero-decision">
                        <button class="glens-link-pill glens-link-pill--ghost" type="button" @click="togglePanel('query')">
                            <span>{{ openPanels.query ? "▾" : "▸" }}</span>
                            {{ openPanels.query ? "Hide matching logic" : "Show matching logic" }}
                        </button>
                    </div>
                    <div v-if="openPanels.query" class="glens-hero-logic">
                        <div class="glens-term-layout">
                            <div class="glens-term-group">
                                <p class="glens-small-heading">Original query terms used directly</p>
                                <div
                                    v-for="term in phenotype.queryTerms.exact"
                                    :key="term.id"
                                    class="glens-term-row"
                                >
                                    <strong>{{ term.label }}</strong>
                                    <span>{{ term.id }}</span>
                                    <small>{{ term.reason }}</small>
                                </div>
                            </div>
                            <div class="glens-term-group">
                                <p class="glens-small-heading">Semantic similarity candidates</p>
                                <p class="glens-helper-text">
                                    Related terms used to find samples with a similar phenotype pattern. These are candidates, not user-entered query terms.
                                </p>
                                <div
                                    v-for="term in phenotype.queryTerms.expanded"
                                    :key="term.id"
                                    class="glens-term-row"
                                >
                                    <strong>{{ term.label }}</strong>
                                    <span>{{ term.id }}</span>
                                    <small>{{ term.reason }}</small>
                                </div>
                            </div>
                            <div class="glens-term-group">
                                <p class="glens-small-heading">Broad terms reduced in scoring</p>
                                <div
                                    v-for="term in phenotype.queryTerms.downWeighted"
                                    :key="term.id"
                                    class="glens-term-row glens-term-row--muted"
                                >
                                    <strong>{{ term.label }}</strong>
                                    <span>{{ term.id }}</span>
                                    <small>{{ term.reason }}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="glens-insight-tabs-card">
                    <div class="glens-insight-nav">
                        <div>
                            <div class="glens-heading-with-info glens-heading-with-info--section">
                                <p class="glens-small-heading">Reference-derived candidates</p>
                                <span class="glens-query-info-wrap">
                                    <button
                                        class="glens-query-info"
                                        type="button"
                                        aria-label="Reference-derived candidate logic"
                                        @click.stop="referenceInfoOpen = !referenceInfoOpen"
                                    >
                                        i
                                    </button>
                                    <span
                                        v-if="referenceInfoOpen"
                                        class="glens-query-info-popover glens-query-info-popover--wide glens-query-info-popover--open glens-reference-info-popover"
                                    >
                                        <button
                                            class="glens-query-info-close"
                                            type="button"
                                            aria-label="Close reference candidate explanation"
                                            @click.stop="referenceInfoOpen = false"
                                        >
                                            ×
                                        </button>
                                        <span>Input HPO profile → weighted phenotype-profile matching → ranked disease and gene candidates → CRDC cohort evidence overlay.</span>
                                        <span>User-entered HPO terms are evaluated as a weighted phenotype profile, not as independent union filters. Exact matches, related HPO terms, and broad terms are scored differently.</span>
                                        <span>External annotations define reference disease/gene profiles first; CRDC sample and variant evidence is then overlaid so internal recurrence is visible without treating secondary annotation as a filter.</span>
                                    </span>
                                </span>
                            </div>
                            <small>External disease and gene references matched to the searched HPO profile.</small>
                            <div class="glens-tab-row glens-tab-row--insights">
                                <button
                                    type="button"
                                    :class="{ 'glens-tab-button--active': activeInsightTab === 'disease' }"
                                    @click="activeInsightTab = 'disease'"
                                >
                                    Disease profile candidates
                                </button>
                                <button
                                    type="button"
                                    class="glens-tab-button--molecular"
                                    :class="{ 'glens-tab-button--active': activeInsightTab === 'gene' }"
                                    @click="activeInsightTab = 'gene'"
                                >
                                    Gene candidates
                                </button>
                            </div>
                        </div>
                    </div>

                    <section v-if="activeInsightTab === 'disease'" class="glens-step-card glens-step-card--tabbed">
                        <div class="glens-step-body">
                            <p class="glens-source-note">
                                Disease candidates are reference profiles matched to the searched HPO profile. CRDC cohort evidence is shown as overlay evidence, not as diagnosis certainty.
                            </p>
                            <div class="glens-candidate-table glens-candidate-table--disease">
                                <div class="glens-candidate-head">
                                    <span>Disease profile</span>
                                    <span class="glens-candidate-head-info">
                                        Disease-profile overlap
                                        <span class="glens-query-info-wrap">
                                            <button
                                                class="glens-query-info"
                                                type="button"
                                                aria-label="Disease-profile overlap explanation"
                                                @click.stop="diseaseOverlapInfoOpen = !diseaseOverlapInfoOpen"
                                            >
                                                i
                                            </button>
                                            <span
                                                v-if="diseaseOverlapInfoOpen"
                                                class="glens-query-info-popover glens-query-info-popover--wide glens-query-info-popover--open glens-disease-overlap-info-popover"
                                            >
                                                <button
                                                    class="glens-query-info-close"
                                                    type="button"
                                                    aria-label="Close disease-profile overlap explanation"
                                                    @click.stop="diseaseOverlapInfoOpen = false"
                                                >
                                                    ×
                                                </button>
                                                <span>Disease-profile overlap</span>
                                                <span>This is not the count of original query terms. The searched profile has {{ phenotype.queryTerms.exact.length }} user-entered HPO terms.</span>
                                                <span>For example, 11 / 74 means 11 HPO terms from the external disease profile are represented in the currently exported matched-CRDC-sample overlap summary; 74 is the size of that disease-HPO reference profile.</span>
                                                <span>Use the CRDC overlay column separately to see how many phenotype-matched CRDC samples carry this disease-profile overlap signal.</span>
                                            </span>
                                        </span>
                                    </span>
                                    <span>CRDC overlay</span>
                                    <span>Source</span>
                                </div>
                                <template v-for="row in phenotype.diseaseCandidates">
                                    <div
                                        :key="`${row.disease}-row`"
                                        class="glens-candidate-row"
                                    >
                                        <a
                                            class="glens-table-link"
                                            :href="diseaseReferenceHref(row)"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {{ diseaseReferenceLabel(row) }}
                                        </a>
                                        <span>
                                            <button
                                                class="glens-inline-link glens-inline-link--button"
                                                type="button"
                                                @click.stop="toggleReferenceDetail(`disease-terms-${row.disease}`)"
                                            >
                                                {{ diseaseHpoCount(row.profileMatch) }}
                                            </button>
                                        </span>
                                        <span>
                                            <button
                                                class="glens-inline-link glens-inline-link--button"
                                                type="button"
                                                @click.stop="toggleReferenceDetail(`disease-crdc-${row.disease}`)"
                                            >
                                                {{ row.crdcEvidence }}
                                            </button>
                                        </span>
                                        <span>{{ diseaseReferenceSource(row) }}</span>
                                    </div>
                                    <div
                                        v-if="activeReferenceDetailRow(row.disease)"
                                        :key="`${row.disease}-detail`"
                                        class="glens-candidate-accordion"
                                    >
                                        <div class="glens-accordion-title-row">
                                            <strong>{{ referenceDetailHeading(row) }}</strong>
                                            <button
                                                class="glens-accordion-close"
                                                type="button"
                                                aria-label="Close detail"
                                                @click.stop="activeReferenceDetail = ''"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <p v-if="referenceDetailNote(row)">{{ referenceDetailNote(row) }}</p>
                                        <div
                                            v-if="activeReferenceDetail.includes('-crdc-')"
                                            class="glens-accordion-table glens-accordion-table--samples"
                                        >
                                            <div>
                                                <span>Sample</span>
                                                <span>Query match</span>
                                                <span>Total HPO terms</span>
                                                <span>Candidate signals</span>
                                            </div>
                                            <div
                                                v-for="sample in referenceCrdcSamples(row)"
                                                :key="`${row.disease}-${sample.id}`"
                                            >
                                                <span>{{ sample.id }}</span>
                                                <span>{{ sample.queryTermsMatched }}</span>
                                                <span>{{ sample.totalTerms }}</span>
                                                <span>{{ sample.signals }}</span>
                                            </div>
                                        </div>
                                        <div v-else class="glens-accordion-table glens-accordion-table--terms">
                                            <div>
                                                <span>Matched</span>
                                                <span>HPO term</span>
                                                <span>HPO ID</span>
                                                <span>Root category</span>
                                            </div>
                                            <div
                                                v-for="(term, termIndex) in referenceDiseaseTermRows(row)"
                                                :key="`${row.disease}-accordion-${term.id}-${term.name}-${termIndex}`"
                                            >
                                                <span>{{ term.matched ? "✓" : "" }}</span>
                                                <span>{{ term.name }}</span>
                                                <span>{{ term.id }}</span>
                                                <span>{{ term.root }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </section>

                    <section v-if="activeInsightTab === 'gene'" class="glens-step-card glens-step-card--tabbed">
                        <div class="glens-step-body">
                            <p class="glens-source-note">
                                Gene candidates are shown here only when the searched HPO terms have exact external gene-phenotype support. CRDC-only recurrent genes are shown as cohort-linked evidence, not as reference-derived gene candidates.
                            </p>
                            <div
                                v-if="referenceGeneCandidates.length"
                                class="glens-candidate-table glens-candidate-table--gene"
                            >
                                <div class="glens-candidate-head">
                                    <span>Gene</span>
                                    <span>Matched HPO terms</span>
                                    <span>Core rare disease reference</span>
                                    <span>CRDC carrier evidence</span>
                                </div>
                                <template v-for="row in referenceGeneCandidates">
                                    <div
                                        :key="`${row.gene}-row`"
                                        class="glens-candidate-row"
                                    >
                                        <a :href="variantHref(row.gene)">{{ row.gene }}</a>
                                        <span>
                                            <button
                                                class="glens-inline-link glens-inline-link--button"
                                                type="button"
                                                @click.stop="toggleReferenceDetail(`gene-terms-${row.gene}`)"
                                            >
                                                {{ geneHpoSupportLabel(row) }}
                                            </button>
                                        </span>
                                        <span>{{ normalizedExternalAnnotation(row.externalAnnotation) }}</span>
                                        <span>
                                            <button
                                                class="glens-inline-link glens-inline-link--button"
                                                type="button"
                                                @click.stop="toggleReferenceDetail(`gene-crdc-${row.gene}`)"
                                            >
                                                {{ carrierCountLabel(row.cohortCarrierEvidence) }} phenotype-matched CRDC samples
                                            </button>
                                        </span>
                                    </div>
                                    <div
                                        v-if="activeReferenceDetailRow(row.gene)"
                                        :key="`${row.gene}-detail`"
                                        class="glens-candidate-accordion"
                                    >
                                        <div class="glens-accordion-title-row">
                                            <strong>{{ referenceDetailHeading(row) }}</strong>
                                            <button
                                                class="glens-accordion-close"
                                                type="button"
                                                aria-label="Close detail"
                                                @click.stop="activeReferenceDetail = ''"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <p v-if="referenceDetailNote(row)">{{ referenceDetailNote(row) }}</p>
                                        <div
                                            v-if="activeReferenceDetail.includes('-crdc-')"
                                            class="glens-accordion-table glens-accordion-table--samples"
                                        >
                                            <div>
                                                <span>Sample</span>
                                                <span>Query match</span>
                                                <span>Total HPO terms</span>
                                                <span>Candidate signals</span>
                                            </div>
                                            <div
                                                v-for="sample in referenceCrdcSamples(row)"
                                                :key="`${row.gene}-${sample.id}`"
                                            >
                                                <span>{{ sample.id }}</span>
                                                <span>{{ sample.queryTermsMatched }}</span>
                                                <span>{{ sample.totalTerms }}</span>
                                                <span>{{ sample.signals }}</span>
                                            </div>
                                        </div>
                                        <div v-else class="glens-accordion-table glens-accordion-table--terms">
                                            <div>
                                                <span>Matched</span>
                                                <span>HPO term</span>
                                                <span>HPO ID</span>
                                                <span>Evidence role</span>
                                            </div>
                                        <div
                                            v-for="(term, termIndex) in referenceGeneTermRows(row)"
                                            :key="`${row.gene}-accordion-${term.id}-${term.name}-${termIndex}`"
                                        >
                                                <span>{{ term.matched ? "✓" : "" }}</span>
                                                <span>{{ term.name }}</span>
                                                <span>{{ term.id }}</span>
                                                <span>{{ term.role }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                            <div v-else class="glens-empty-reference-note">
                                <strong>No exact reference-derived gene candidates in the current test fixture.</strong>
                                <span>The searched HPO terms are not directly annotated to genes in the current external gene-phenotype tables. Genes such as {{ crdcOnlyGeneNames }} are therefore shown only as CRDC-linked recurrence signals among phenotype-matched samples.</span>
                            </div>
                        </div>
                    </section>
                </section>

                <section class="glens-evidence-grid">
                    <section class="glens-insight-tabs-card glens-cohort-tabs-card">
                        <div class="glens-section-head">
                            <div>
                                <p class="glens-section-label">CRDC cohort evidence</p>
                                <div class="glens-heading-with-info">
                                    <h2>How does this phenotype profile appear across CRDC samples, phenotypes, variants, and investigator groups?</h2>
                                    <button
                                        class="glens-query-info"
                                        type="button"
                                        aria-label="CRDC cohort evidence explanation"
                                        @click.stop="cohortInfoOpen = !cohortInfoOpen"
                                    >
                                        i
                                    </button>
                                    <span
                                        v-if="cohortInfoOpen"
                                        class="glens-query-info-popover glens-query-info-popover--wide glens-query-info-popover--open glens-cohort-info-popover"
                                    >
                                        <button
                                            class="glens-query-info-close"
                                            type="button"
                                            aria-label="Close CRDC cohort explanation"
                                            @click.stop="cohortInfoOpen = false"
                                        >
                                            ×
                                        </button>
                                        <span>These results are generated by applying the searched HPO profile to the CRDC cohort.</span>
                                        <span>Read this as internal cohort support and drill-down evidence: matched samples, recurring phenotypes, investigator-level patterns, and annotation-burden checks.</span>
                                        <span>This section is separate from the external reference-derived disease and gene candidates above.</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="glens-tab-row glens-tab-row--insights">
                            <button
                                type="button"
                                :class="{ 'glens-tab-button--active': activeEvidenceTab === 'coobserved' }"
                                @click="activeEvidenceTab = 'coobserved'"
                            >
                                Co-observed phenotypes
                            </button>
                            <button
                                type="button"
                                :class="{ 'glens-tab-button--active': activeEvidenceTab === 'individual' }"
                                @click="activeEvidenceTab = 'individual'"
                            >
                                Matched samples
                            </button>
                            <button
                                type="button"
                                :class="{ 'glens-tab-button--active': activeEvidenceTab === 'group' }"
                                @click="activeEvidenceTab = 'group'"
                            >
                                Investigator-level evidence
                            </button>
                        </div>

                        <div v-if="activeEvidenceTab === 'individual'" class="glens-cohort-tab-panel glens-step-card glens-step-card--tabbed">
                            <div class="glens-sample-table glens-sample-table--primary mt-space">
                                <div class="glens-sample-head">
                                    <span>Rank</span>
                                    <span>Sample</span>
                                    <span>Investigator</span>
                                    <span>Query terms matched</span>
                                    <span>Total HPO terms</span>
                                    <span>
                                        Profile similarity
                                        <button class="glens-query-info" type="button" aria-label="Profile similarity range explanation">
                                            i
                                            <span class="glens-query-info-popover glens-query-info-popover--wide">
                                                Profile similarity is shown on the current mock scale. In the test fixture, values are overlap-derived and can be shown as 0 to 1. Backend weighted profile scores may use a different positive scale and should be labeled with that scale when connected.
                                            </span>
                                        </button>
                                    </span>
                                    <span>
                                        Burden-corrected residual
                                        <button class="glens-query-info" type="button" aria-label="Burden-corrected residual explanation">
                                            i
                                            <span class="glens-query-info-popover glens-query-info-popover--wide">
                                                Residual compares observed phenotype-profile similarity with the similarity expected for a sample with the same total HPO-term burden. Positive values mean the sample matches better than expected after correcting for annotation burden.
                                            </span>
                                        </button>
                                    </span>
                                    <span>Candidate signals</span>
                                </div>
                                <template v-for="sample in phenotype.topSamples">
                                    <div
                                        :key="`${sample.id}-row`"
                                        class="glens-sample-row"
                                        :class="{ 'glens-sample-row--selected': sample.id === activeOutlierSample }"
                                    >
                                        <strong>{{ sample.rank }}</strong>
                                        <button class="glens-inline-link glens-inline-link--button" type="button" @click="selectSample(sample.id)">
                                            {{ sample.id }}
                                        </button>
                                        <span>{{ sample.investigator }}</span>
                                        <span class="glens-match-cell">
                                            <button
                                                class="glens-inline-link glens-inline-link--button"
                                                type="button"
                                                @click.stop="activeQueryMatchSampleId = activeQueryMatchSampleId === sample.id ? '' : sample.id"
                                            >
                                                {{ sample.queryTermsMatched }}
                                            </button>
                                        </span>
                                        <span>{{ sample.totalTerms }}</span>
                                        <span>{{ sample.rawScore }}</span>
                                        <strong>{{ sample.residual }}</strong>
                                        <span class="glens-signal-links">
                                            <a
                                                v-for="gene in signalGenes(sample.signals)"
                                                :key="`${sample.id}-${gene}`"
                                                :href="variantHref(gene)"
                                            >
                                                {{ gene }}
                                            </a>
                                        </span>
                                    </div>
                                    <div
                                        v-if="activeQueryMatchSampleId === sample.id"
                                        :key="`${sample.id}-query-detail`"
                                        class="glens-sample-accordion"
                                    >
                                        <div>
                                            <strong>Matched query terms</strong>
                                            <button
                                                class="glens-accordion-close"
                                                type="button"
                                                aria-label="Close matched query terms"
                                                @click.stop="activeQueryMatchSampleId = ''"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <span
                                            v-for="term in matchedQueryTermsForSample(sample)"
                                            :key="`${sample.id}-${term.id}-matched`"
                                        >
                                            {{ term.label }} [{{ term.id }}]
                                        </span>
                                        <template v-if="unmatchedQueryTermsForSample(sample).length">
                                            <strong class="glens-accordion-subhead">Not matched</strong>
                                            <span
                                                v-for="term in unmatchedQueryTermsForSample(sample)"
                                                :key="`${sample.id}-${term.id}-unmatched`"
                                            >
                                                {{ term.label }} [{{ term.id }}]
                                            </span>
                                        </template>
                                    </div>
                                </template>
                            </div>

                            <div class="glens-core-grid glens-core-grid--cohort mt-space">
                                <div class="glens-selected-sample">
                                    <p class="glens-small-heading">Selected matched sample</p>
                                    <button class="glens-sample-id-link" type="button" @click="selectSample(selectedSampleData.id)">
                                        {{ selectedSampleData.id }}
                                    </button>
                                    <div class="glens-score-kv">
                                        <span>Investigator group</span><strong>{{ selectedSampleData.investigator }}</strong>
                                        <span>Proband</span><strong>{{ selectedSampleData.proband }}</strong>
                                        <span>Affected</span><strong>{{ selectedSampleData.affected }}</strong>
                                        <span>Sex</span><strong>{{ selectedSampleData.sex }}</strong>
                                        <span>Age at enrollment</span><strong>{{ ageAtEnrollmentLabel(selectedSampleData) }}</strong>
                                        <span>GenDx diagnosed</span><strong>{{ selectedSampleData.diagnosed }}</strong>
                                        <span>Variant</span>
                                        <a
                                            v-if="selectedSampleData.diagnosed !== 'N/A' && selectedSampleData.diagnosedVariant"
                                            :href="variantHref(selectedSampleData.diagnosedVariant)"
                                        >
                                            {{ selectedSampleData.diagnosedVariant }}
                                        </a>
                                        <strong v-else>Not available</strong>
                                        <span>Weighted phenotype similarity</span><strong>{{ selectedSampleData.rawScore }}</strong>
                                        <span>Expected for total HPO terms</span><strong>{{ selectedSampleData.expectedScore }}</strong>
                                        <span>Burden-corrected residual</span><strong>{{ selectedSampleData.residual }}</strong>
                                        <span>Residual percentile</span><strong>{{ selectedSampleData.percentile }}</strong>
                                        <span>Equal or higher residual</span><strong>{{ selectedSampleData.equalOrHigher }}</strong>
                                        <span>Candidate molecular signals</span>
                                        <span class="glens-signal-links">
                                            <a
                                                v-for="gene in signalGenes(selectedSampleData.signals)"
                                                :key="`${selectedSampleData.id}-selected-${gene}`"
                                                :href="variantHref(gene)"
                                            >
                                                {{ gene }}
                                            </a>
                                        </span>
                                    </div>
                                </div>

                                <div class="glens-phenotype-profile-panel">
                                    <p class="glens-small-heading">Selected sample phenotype profile</p>
                                    <small>What additional phenotypes does this matched sample have beyond the query terms?</small>
                                    <div class="glens-profile-metrics">
                                        <span>Total HPO terms: <strong>{{ selectedSampleData.totalTerms }}</strong></span>
                                        <span>Query terms matched: <strong>{{ selectedSampleData.queryTermsMatched }}</strong></span>
                                    </div>
                                    <div class="glens-profile-table">
                                        <div class="glens-profile-head">
                                            <span>HPO root category</span>
                                            <span>Terms in sample</span>
                                            <span>Share</span>
                                            <span>Query match</span>
                                        </div>
                                        <template v-for="row in selectedSamplePhenotypeProfile">
                                            <button
                                                :key="`${selectedSampleData.id}-${row.category}-summary`"
                                                class="glens-profile-row glens-profile-toggle"
                                                type="button"
                                                @click="toggleSampleProfileCategory(row.category)"
                                            >
                                                <strong>
                                                    <b>{{ activeSampleProfileCategory === row.category ? "▾" : "▸" }}</b>
                                                    {{ row.category }}
                                                </strong>
                                                <span>{{ row.terms }}</span>
                                                <span>{{ row.share }}</span>
                                                <span>{{ row.queryMatch || "—" }}</span>
                                            </button>
                                            <div
                                                v-if="activeSampleProfileCategory === row.category"
                                                :key="`${selectedSampleData.id}-${row.category}-terms`"
                                                class="glens-profile-expanded"
                                            >
                                                <div class="glens-accordion-table glens-accordion-table--terms">
                                                    <div>
                                                        <span>Matched</span>
                                                        <span>HPO term</span>
                                                        <span>HPO ID</span>
                                                        <span>Role</span>
                                                    </div>
                                                    <div
                                                        v-for="term in row.phenotypeTerms"
                                                        :key="`${selectedSampleData.id}-${row.category}-${term.id}-${term.name}`"
                                                    >
                                                        <span>{{ term.matched ? "✓" : "" }}</span>
                                                        <span>{{ term.name }}</span>
                                                        <span>{{ term.id }}</span>
                                                        <span>{{ term.role }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div v-else-if="activeEvidenceTab === 'coobserved'" class="glens-cohort-tab-panel glens-step-card glens-step-card--tabbed">
                            <div class="glens-coobserved-panel mt-space">
                                <div class="glens-heading-with-info">
                                    <p class="glens-small-heading">Co-observed phenotypes among matched samples</p>
                                    <button class="glens-query-info" type="button" aria-label="Co-observed phenotype summary explanation">
                                        i
                                        <span class="glens-query-info-popover glens-query-info-popover--wide">
                                            <strong>Co-observed phenotypes</strong>
                                            <span>Co-observed phenotypes are additional HPO terms that repeatedly appear among the phenotype-matched samples. They help explain why certain disease domains, genes, or variants may be relevant to the input phenotype profile.</span>
                                            <span>Examples:</span>
                                            <span>Feeding difficulty: 61 / 132 matched samples → linked to CHD7 and KMT2D signals</span>
                                            <span>Micrognathia: 54 / 132 matched samples → linked to SATB2 and IRF6 signals</span>
                                            <span>Speech delay: 49 / 132 matched samples → supports a neurodevelopmental disease-domain signal</span>
                                            <span>These are not the original query terms. They are additional phenotype signals observed among the matched samples.</span>
                                        </span>
                                    </button>
                                </div>
                                <small>Which additional phenotypes recur across the phenotype-matched CRDC sample set?</small>
                                <p class="glens-source-note">
                                    These are additional HPO terms recurring across the phenotype-matched sample set. They are not the original query terms and they are not specific to the selected sample.
                                </p>
                                <div class="glens-profile-table">
                                    <div class="glens-profile-head glens-profile-head--coobserved">
                                        <span>HPO root category</span>
                                        <span>Sample support</span>
                                        <span>Query term(s) in this category</span>
                                        <span>Top additional phenotype terms</span>
                                    </div>
                                    <template v-for="row in phenotype.exactQueryMatchedSummary">
                                        <button
                                            :key="`${row.category}-coobserved-summary`"
                                            class="glens-profile-row glens-profile-row--coobserved glens-profile-toggle"
                                            type="button"
                                            @click="toggleExactCategory(row.category)"
                                        >
                                            <strong>
                                                <b>{{ activeExactCategory === row.category ? "▾" : "▸" }}</b>
                                                {{ row.category }}
                                            </strong>
                                            <span>{{ row.sampleSupport }}</span>
                                                <span>
                                                    <b
                                                        v-for="term in splitTerms(row.queryTerms)"
                                                        :key="`${row.category}-${term}-query`"
                                                        class="glens-query-term-mark"
                                                    >
                                                        {{ term }}
                                                    </b>
                                                </span>
                                                <span>{{ row.topAdditionalTerms }}</span>
                                            </button>
                                        <div
                                            v-if="activeExactCategory === row.category"
                                            :key="`${row.category}-coobserved-terms`"
                                            class="glens-profile-expanded"
                                        >
                                            <span
                                                    v-for="term in row.phenotypeTerms"
                                                    :key="`${row.category}-${term}`"
                                                    :class="{ 'glens-query-term-mark': isQueryTermText(term) }"
                                                >
                                                    {{ term }}
                                                </span>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="activeEvidenceTab === 'group'" class="glens-group-tab-panel glens-step-card glens-step-card--tabbed">
                            <p class="glens-source-note">
                                This view shows whether the phenotype-matched cohort signal is broadly distributed or driven by specific investigator groups.
                            </p>
                            <div class="glens-investigator-composition">
                                <div class="glens-profile-head glens-profile-head--investigator">
                                    <span>Investigator group</span>
                                    <span>Matched samples</span>
                                    <span>Predominant phenotype structure</span>
                                    <span>Example matched samples</span>
                                </div>
                                <button
                                    v-for="group in phenotype.residualGroups"
                                    :key="`${group.name}-composition`"
                                    class="glens-profile-row glens-profile-row--investigator"
                                    type="button"
                                    @click="activeResidualGroup = group.name"
                                >
                                    <strong>{{ group.name }}</strong>
                                    <span>{{ group.extreme }}</span>
                                    <span>{{ investigatorPhenotypeSignature(group) }}</span>
                                    <span>{{ investigatorExampleSamples(group) }}</span>
                                </button>
                            </div>
                            <div class="glens-group-qc-layout glens-group-qc-layout--support">
                                <div class="glens-boxplot-grid">
                                    <div
                                        v-for="group in phenotype.residualGroups"
                                        :key="group.name"
                                        class="glens-boxplot-entry"
                                    >
                                        <button
                                            class="glens-boxplot-row"
                                            :class="{ 'glens-boxplot-row--active': activeResidualGroup === group.name }"
                                            type="button"
                                            @click="toggleResidualGroup(group.name)"
                                        >
                                            <span class="glens-boxplot-label">
                                                <b>{{ activeResidualGroup === group.name ? "▾" : "▸" }}</b>
                                                {{ group.name }}
                                            </span>
                                            <div class="glens-boxplot-line">
                                                <span class="glens-boxplot-whisker"></span>
                                                <i :style="{ left: group.low, width: group.width }"></i>
                                                <b :style="{ left: group.median }"></b>
                                                <em :style="{ left: group.selected }"></em>
                                            </div>
                                            <strong>{{ group.extreme }}</strong>
                                        </button>
                                    </div>
                                </div>
                                <div class="glens-outlier-panel glens-outlier-panel--support">
                                    <div class="glens-outlier-head">
                                        <strong>{{ activeResidualGroupData.name }}</strong>
                                        <span>Group median burden-corrected score: {{ activeResidualGroupData.medianValue }} · Selected sample burden-corrected score: {{ selectedSampleData.residual }}</span>
                                    </div>
                                    <p class="glens-outlier-threshold">
                                        This table shows high-scoring samples within the selected investigator group. This is group-context evidence, not the nearest-patient ranking.
                                    </p>
                                    <div class="glens-outlier-row glens-outlier-row--head">
                                        <span>Sample</span>
                                        <span>Proband</span>
                                        <span>Affected</span>
                                        <span>
                                            Burden-corrected score
                                            <button class="glens-query-info" type="button" aria-label="Burden-corrected score explanation">
                                                i
                                                <span class="glens-query-info-popover glens-query-info-popover--wide">
                                                    Burden-corrected score compares each sample's phenotype-profile match against the score expected from its total HPO-term burden. It helps identify group-context evidence that is not explained only by having many phenotype annotations.
                                                </span>
                                            </button>
                                        </span>
                                        <span>Candidate signals</span>
                                    </div>
                                    <div
                                        v-for="sample in activeResidualGroupData.outliers"
                                        :key="sample.id"
                                        class="glens-outlier-row"
                                        @click="selectSample(sample.id)"
                                    >
                                        <button
                                            class="glens-inline-link glens-inline-link--button"
                                            :class="{
                                                'glens-inline-link--outlier': sample.id === activeOutlierSample,
                                                'glens-inline-link--selected': sample.id === activeOutlierSample
                                            }"
                                            type="button"
                                            @click="selectSample(sample.id)"
                                        >
                                            {{ sample.id }}
                                        </button>
                                        <span>{{ sampleProband(sample) }}</span>
                                        <span>{{ sampleAffected(sample) }}</span>
                                        <span>{{ sample.score }}</span>
                                        <span class="glens-signal-links">
                                            <a
                                                v-for="gene in signalGenes(sample.signal)"
                                                :key="`${sample.id}-${gene}`"
                                                :href="variantHref(gene)"
                                            >
                                                {{ gene }}
                                            </a>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </section>

            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import ClinicalFocusBar from "../KrClinicalFocus/ClinicalFocusBar.vue";
import { onClinicalFocusChange, readClinicalFocus } from "../KrClinicalFocus/focusStore";
import { createKrPhenotypeState } from "./mockData";
import { phenotypeComputed, phenotypeMethods } from "./pageModel";
import "./style.css";

export default {
    name: "KrPhenotypeTemplate",
    components: {
        ClinicalFocusBar,
    },
    data() {
        return {
            ...createKrPhenotypeState(),
            clinicalFocus: readClinicalFocus(),
            contextPopoverOpen: false,
            optionsPopoverOpen: false,
            candidateInfoOpen: false,
            referenceInfoOpen: false,
            diseaseOverlapInfoOpen: false,
            cohortInfoOpen: false,
            activeReferenceDetail: "",
            activeQueryMatchSampleId: "",
            unsubscribeClinicalFocus: null,
            activeEvidenceTab: "coobserved",
            activeSampleProfileCategory: "Abnormality of head or neck [HP:0000152]",
        };
    },
    computed: phenotypeComputed,
    mounted() {
        this.unsubscribeClinicalFocus = onClinicalFocusChange((focus) => {
            this.clinicalFocus = focus;
        });
        document.addEventListener("click", this.closeToolPopovers);
    },
    beforeDestroy() {
        if (this.unsubscribeClinicalFocus) this.unsubscribeClinicalFocus();
        document.removeEventListener("click", this.closeToolPopovers);
    },
    methods: phenotypeMethods,
};
</script>

<style scoped>
.glens-new-context-compare {
    display: grid;
    gap: 0.22rem;
    margin-top: 0.85rem;
    padding: 0.62rem 0.7rem;
    border: 1px solid #d8e2ef;
    border-radius: 0.75rem;
    background: #f8fafc;
    color: #42526a;
}

.glens-new-context-compare span {
    color: #526276;
    font-size: 0.86rem;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
}

.glens-new-context-compare strong {
    color: #162033;
    font-size: 0.86rem;
    line-height: 1.25;
}

.glens-new-context-compare small {
    color: #526276;
    font-size: 0.78rem;
    font-weight: 500;
    line-height: 1.3;
}

.glens-match-cell {
    position: relative;
}

.glens-popover-subhead {
    margin-top: 0.55rem;
}

.glens-query-term-mark {
    display: block;
    color: #162033;
    font-weight: 600;
}

.glens-profile-row .glens-query-term-mark {
    display: inline;
    margin-right: 0.35rem;
}

.glens-group-tab-panel .glens-outlier-row {
    grid-template-columns: minmax(10rem, 1.1fr) minmax(5rem, 0.45fr) minmax(5rem, 0.45fr) minmax(10rem, 0.9fr) minmax(12rem, 1.15fr);
    cursor: pointer;
}

.glens-sample-head .glens-query-info,
.glens-outlier-row--head .glens-query-info {
    margin-left: 0.25rem;
    vertical-align: middle;
    text-transform: none;
}

.glens-candidate-source-row {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.glens-candidate-source-row small:last-child {
    flex-basis: auto;
    margin-left: 0;
    font-weight: 500;
}

.glens-domain-summary-list {
    display: grid;
    gap: 0.32rem;
    margin-top: 0.25rem;
}

.glens-domain-summary-list div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: baseline;
}

.glens-domain-summary-list strong {
    color: #162033;
    font-size: 0.78rem;
    font-weight: 650;
    line-height: 1.25;
}

.glens-domain-summary-list small {
    color: #526276;
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
}

.glens-candidate-table--disease .glens-candidate-head,
.glens-candidate-table--disease .glens-candidate-row {
    grid-template-columns: minmax(12rem, 1fr) minmax(14rem, 1fr) minmax(14rem, 1fr) minmax(16rem, 1.2fr);
    min-width: 64rem;
}

.glens-candidate-table--gene .glens-candidate-head,
.glens-candidate-table--gene .glens-candidate-row {
    grid-template-columns: minmax(7rem, 0.55fr) minmax(13rem, 1fr) minmax(16rem, 1.2fr) minmax(16rem, 1.2fr);
    min-width: 58rem;
}

.glens-summary-group--pair {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    border-top: 1px solid #e2e8f0;
    padding-top: 0.72rem;
}

.glens-candidate-row > span {
    position: relative;
}

.glens-reference-info-popover,
.glens-cohort-info-popover,
.glens-reference-detail-popover {
    left: 0;
    text-align: left;
}

.glens-reference-detail-popover {
    top: calc(100% + 0.35rem);
}

.glens-heading-with-info--section {
    align-items: center;
    gap: 0.35rem;
}

.glens-phenotype-profile-panel .glens-profile-head,
.glens-phenotype-profile-panel .glens-profile-row {
    grid-template-columns: minmax(15rem, 1.15fr) minmax(8rem, 0.55fr) minmax(6rem, 0.45fr) minmax(10rem, 0.75fr);
    min-width: 46rem;
}

.glens-match-check {
    margin-right: 0.35rem;
    color: #0055ff;
    font-weight: 700;
}

.glens-investigator-composition {
    overflow-x: auto;
    overflow-y: hidden;
    margin-bottom: 1rem;
    border: 1px solid #dbe5ef;
    border-radius: 0.85rem;
}

.glens-profile-head--investigator,
.glens-profile-row--investigator {
    grid-template-columns: minmax(12rem, 1fr) minmax(9rem, 0.7fr) minmax(20rem, 1.55fr) minmax(18rem, 1.4fr);
    min-width: 68rem;
}

.glens-profile-row--investigator {
    width: 100%;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    background: #fff;
    text-align: left;
}

.glens-query-info-popover strong {
    font-weight: 500;
}

.glens-hero .glens-hero-cohort-copy {
    gap: 0.24rem;
}

.glens-hero .glens-hero-cohort-copy span {
    color: #42526a;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0;
    line-height: 1.35;
    text-transform: none;
}

.glens-hero .glens-hero-cohort-copy__check {
    margin-top: 0.55rem;
}

.glens-hero .glens-hero-cohort-copy strong {
    letter-spacing: 0;
    text-transform: none;
}

.glens-sample-accordion,
.glens-candidate-accordion {
    display: grid;
    gap: 0.4rem;
    padding: 0.75rem 0.95rem;
    border-top: 1px solid #dbe5ef;
    background: #f8fafc;
    color: #42526a;
    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.35;
}

.glens-sample-accordion > .glens-accordion-title-row,
.glens-candidate-accordion > .glens-accordion-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.glens-sample-accordion strong,
.glens-candidate-accordion strong {
    color: #162033;
    font-weight: 650;
}

.glens-sample-accordion span,
.glens-candidate-accordion span {
    display: block;
}

.glens-candidate-accordion p {
    margin: 0;
    color: #526276;
    font-weight: 500;
}

.glens-accordion-close {
    border: 0;
    background: transparent;
    color: #526276;
    font-size: 1rem;
    line-height: 1;
}

.glens-accordion-subhead {
    margin-top: 0.35rem;
}

.glens-accordion-table {
    display: grid;
    border: 1px solid #dbe5ef;
    border-radius: 0.7rem;
    overflow: hidden;
    background: #fff;
}

.glens-accordion-table > div {
    display: grid;
    gap: 0.55rem;
    align-items: center;
    padding: 0.48rem 0.6rem;
    border-top: 1px solid #eef2f7;
}

.glens-accordion-table > div:first-child {
    border-top: 0;
    background: #f8fafc;
    color: #526276;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
}

.glens-accordion-table > div:first-child span {
    color: #526276;
    font-weight: 500;
}

.glens-accordion-table span {
    display: block;
    color: #42526a;
    font-size: 0.78rem;
    font-weight: 500;
    line-height: 1.3;
}

.glens-accordion-table--terms > div {
    grid-template-columns: minmax(4rem, 0.35fr) minmax(14rem, 1.35fr) minmax(7rem, 0.65fr) minmax(12rem, 1fr);
}

.glens-accordion-table--samples > div {
    grid-template-columns: minmax(12rem, 1fr) minmax(10rem, 0.85fr) minmax(8rem, 0.65fr) minmax(12rem, 1fr);
}

.glens-empty-reference-note {
    display: grid;
    gap: 0.35rem;
    margin-top: 0.8rem;
    padding: 0.85rem 1rem;
    border: 1px solid #dbe5ef;
    border-radius: 0.75rem;
    background: #f8fafc;
    color: #42526a;
    font-size: 0.84rem;
    line-height: 1.45;
}

.glens-empty-reference-note strong {
    color: #162033;
    font-weight: 650;
}
</style>
