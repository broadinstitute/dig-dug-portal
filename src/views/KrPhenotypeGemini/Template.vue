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
                            <strong>Query phenotype profile</strong>
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
                            <div class="glens-summary-cell glens-summary-cell--chart">
                                <div class="glens-hero-cohort-copy">
                                    <strong>{{ cohortSummary.primary }}</strong>
                                    <span>{{ cohortSummary.eligible }}</span>
                                    <span>{{ cohortSummary.sex }}</span>
                                    <span>{{ cohortSummary.proband }}</span>
                                    <span>{{ annotationBurdenSummary.label }}: {{ annotationBurdenSummary.value }}</span>
                                    <span>{{ annotationBurdenSummary.detail }}</span>
                                </div>
                                <div class="glens-hero-age-block">
                                    <div class="glens-hero-age-heading">
                                        <strong>Age distribution</strong>
                                        <span>{{ cohortSummary.ageLabel }}</span>
                                    </div>
                                    <div class="glens-hero-age-histogram">
                                        <div
                                            v-for="bin in cohortAgeBins"
                                            :key="bin.label"
                                            class="glens-hero-age-col"
                                        >
                                            <div class="glens-age-pair">
                                                <span>
                                                    <b>{{ bin.female }}</b>
                                                    <i class="glens-age-bar glens-age-bar--female" :style="{ height: bin.femaleHeight }"></i>
                                                </span>
                                                <span>
                                                    <b>{{ bin.male }}</b>
                                                    <i class="glens-age-bar glens-age-bar--male" :style="{ height: bin.maleHeight }"></i>
                                                </span>
                                            </div>
                                            <small>{{ bin.label }}</small>
                                        </div>
                                    </div>
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
                                    <span>Matched disease HPO terms</span>
                                    <span>CRDC overlay</span>
                                    <span>Core rare disease reference</span>
                                </div>
                                <template v-for="row in phenotype.diseaseCandidates">
                                    <div
                                        :key="`${row.disease}-row`"
                                        class="glens-candidate-row"
                                    >
                                        <strong>{{ row.disease }}</strong>
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
                                        <span>{{ normalizedExternalAnnotation(row.externalAnnotation) }}</span>
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
                                                v-for="term in referenceDiseaseTermRows(row)"
                                                :key="`${row.disease}-accordion-${term.id}-${term.name}`"
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
                                            v-for="term in referenceGeneTermRows(row)"
                                            :key="`${row.gene}-accordion-${term.id}-${term.name}`"
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
                                        <span>Age</span><strong>{{ selectedSampleData.ageBand }}</strong>
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

                            <div class="glens-support-panel mt-space">
                                <div class="glens-panel-title">
                                <span>Annotation-burden check</span>
                                    <small>Does annotation burden inflate the phenotype match?</small>
                                </div>
                                <p class="glens-source-note">
                                    This plot compares weighted phenotype similarity against total HPO annotation burden, so users can see whether highly ranked samples are matched because of the query profile or simply because they have many HPO terms.
                                </p>
                                <div
                                    class="glens-score-plot"
                                    :class="'glens-score-plot--' + scatterMode"
                                >
                                    <span class="glens-axis-y glens-axis-y--top">Y-axis: weighted phenotype similarity</span>
                                    <span class="glens-axis-y glens-axis-y--bottom">0</span>
                                    <span class="glens-axis-x">X-axis: total HPO terms</span>
                                    <div class="glens-trend-line"></div>
                                    <div class="glens-residual-line"></div>
                                    <button
                                        v-for="point in phenotype.scorePoints"
                                        :key="`individual-qc-${point.id}`"
                                        class="glens-score-point"
                                        :class="[
                                            'glens-score-point--' + point.group,
                                            {
                                                'glens-score-point--selected': point.id === activeOutlierSample,
                                                'glens-score-point--outlier': point.outlier
                                            }
                                        ]"
                                        :style="{ left: point.x, bottom: point.y }"
                                        type="button"
                                        :title="point.id + ' · residual ' + point.residual"
                                        @click="selectSample(point.id)"
                                    ></button>
                                    <div class="glens-selected-label" :style="selectedLabelStyle">
                                        {{ selectedSampleData.id }}<br>
                                        residual {{ selectedSampleData.residual }}
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
                            <div class="glens-residual-panel glens-residual-panel--group mt-space">
                                <div class="glens-panel-title">
                                    <span>Investigator-level scatter plot</span>
                                    <small>Group-average burden-corrected scores by phenotype signature.</small>
                                </div>
                                <div class="glens-score-plot glens-score-plot--group-average">
                                    <span class="glens-axis-y glens-axis-y--top">Y-axis: group-average burden-corrected score</span>
                                    <span class="glens-axis-y glens-axis-y--bottom">0</span>
                                    <span class="glens-axis-x">X-axis: group phenotype complexity</span>
                                    <div class="glens-trend-line glens-trend-line--group"></div>
                                    <button
                                        v-for="group in phenotype.residualGroups"
                                        :key="`group-point-${group.name}`"
                                        class="glens-score-point glens-score-point--group-average"
                                        :class="{ 'glens-score-point--selected': activeResidualGroup === group.name }"
                                        :style="{ left: group.x, bottom: group.y }"
                                        type="button"
                                        :title="group.name + ' · median burden-corrected score ' + group.medianValue"
                                        @click="activeResidualGroup = group.name"
                                    ></button>
                                    <div class="glens-selected-label glens-selected-label--group" :style="groupLabelStyle">
                                        {{ activeResidualGroupData.name }}<br>
                                        median burden-corrected score {{ activeResidualGroupData.medianValue }}
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
import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { clearClinicalFocus, onClinicalFocusChange, readClinicalFocus } from "../KrClinicalFocus/focusStore";
import { createKrPhenotypeState } from "./mockData";
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
            cohortInfoOpen: false,
            activeReferenceDetail: "",
            activeQueryMatchSampleId: "",
            unsubscribeClinicalFocus: null,
            activeEvidenceTab: "coobserved",
            activeSampleProfileCategory: "Abnormality of head or neck [HP:0000152]",
        };
    },
    computed: {
        currentPhenotypeTermsForFocus() {
            return this.phenotype.queryTerms.exact.map((term) => ({
                id: term.id,
                label: term.label,
            }));
        },
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        activeContextTerms() {
            return (this.clinicalFocus.hpoTerms || []).slice(0, 5);
        },
        queryContextOverlapText() {
            if (!this.hasActiveContext) return "";
            const queryIds = this.phenotype.queryTerms.exact.map((term) => term.id);
            const contextIds = (this.clinicalFocus.hpoTerms || []).map((term) => term.id);
            const shared = queryIds.filter((id) => contextIds.includes(id));
            return `${shared.length} / ${queryIds.length} query HPO terms overlap active context`;
        },
        cohortSummary() {
            const headline = this.phenotype.headline[0] || {};
            const value = headline.value || `${this.phenotype.topSamples.length} / —`;
            const [matchedRaw, eligibleRaw] = String(value).split("/").map((part) => part.trim());
            const matched = Number.parseInt(matchedRaw, 10);
            const eligible = Number.parseInt(eligibleRaw, 10);
            const percent = Number.isFinite(matched) && Number.isFinite(eligible) && eligible > 0
                ? ` (${((matched / eligible) * 100).toFixed(1)}%)`
                : "";
            const samples = this.phenotype.topSamples || [];
            const denominator = Number.isFinite(matched) ? matched : samples.length;
            const summaryUsesAllMatched = samples.length === denominator;
            const sexCounts = this.countByNormalized(samples, "sex");
            const probandYes = samples.filter((sample) => String(sample.proband).toLowerCase() === "yes").length;
            const probandNo = samples.filter((sample) => String(sample.proband).toLowerCase() === "no").length;
            const sexParts = [];
            if (sexCounts.female) sexParts.push(`${sexCounts.female} female`);
            if (sexCounts.male) sexParts.push(`${sexCounts.male} male`);
            const knownSex = (sexCounts.female || 0) + (sexCounts.male || 0);
            if (summaryUsesAllMatched && denominator > knownSex) sexParts.push(`${denominator - knownSex} sex not available`);
            const probandParts = [];
            if (probandYes) probandParts.push(`${probandYes} proband`);
            if (probandNo) probandParts.push(`${probandNo} non-proband`);
            if (summaryUsesAllMatched && denominator > probandYes + probandNo) {
                probandParts.push(`${denominator - probandYes - probandNo} proband status not available`);
            }
            const dbSummary = this.phenotype.matchedCohortSummary || {};
            return {
                value,
                primary: Number.isFinite(matched) ? `${matched} phenotype-matched samples` : `${samples.length} phenotype-matched samples`,
                eligible: Number.isFinite(eligible) ? `${value} eligible samples${percent}` : `${value} eligible samples`,
                sex: dbSummary.sex || `${summaryUsesAllMatched ? "Sex" : "Sex in displayed rows"}: ${sexParts.join(" · ") || "not available"}`,
                proband: dbSummary.proband || `${summaryUsesAllMatched ? "Proband status" : "Proband status in displayed rows"}: ${probandParts.join(" · ") || "not available"}`,
                matchedCount: Number.isFinite(matched) ? matched : samples.length,
                ageLabel: Number.isFinite(matched)
                    ? `Among ${matched} phenotype-matched samples`
                    : "Among phenotype-matched samples",
            };
        },
        cohortAgeBins() {
            const target = this.cohortSummary.matchedCount || 0;
            const bins = this.phenotype.ageBins || [];
            if (bins.length && bins.every((bin) => bin.femaleHeight && bin.maleHeight)) {
                return bins;
            }
            const total = bins.reduce((sum, bin) => sum + Number(bin.female || 0) + Number(bin.male || 0), 0);
            if (!target || !total) return bins;
            const rawParts = [];
            bins.forEach((bin, binIndex) => {
                ["female", "male"].forEach((key) => {
                    const original = Number(bin[key] || 0);
                    const scaled = (original / total) * target;
                    rawParts.push({
                        binIndex,
                        key,
                        value: Math.floor(scaled),
                        remainder: scaled - Math.floor(scaled),
                    });
                });
            });
            let assigned = rawParts.reduce((sum, part) => sum + part.value, 0);
            rawParts
                .sort((a, b) => b.remainder - a.remainder)
                .slice(0, Math.max(target - assigned, 0))
                .forEach((part) => {
                    part.value += 1;
                    assigned += 1;
                });
            const scaledBins = bins.map((bin) => ({
                label: bin.label,
                female: 0,
                male: 0,
            }));
            rawParts.forEach((part) => {
                scaledBins[part.binIndex][part.key] = part.value;
            });
            const maxCount = Math.max(...scaledBins.map((bin) => bin.female), ...scaledBins.map((bin) => bin.male), 1);
            return scaledBins.map((bin) => ({
                ...bin,
                femaleHeight: `${Math.max((bin.female / maxCount) * 70, bin.female ? 12 : 0)}px`,
                maleHeight: `${Math.max((bin.male / maxCount) * 70, bin.male ? 12 : 0)}px`,
            }));
        },
        annotationBurdenSummary() {
            const sample = this.phenotype.topSamples[0] || {};
            const residual = sample.residual || "not calculated";
            return {
                label: "Top matched sample check",
                value: sample.id || "No selected sample",
                detail: residual === "not calculated"
                    ? "Annotation-burden residual is not calculated in the current fixture"
                    : `${residual} after total HPO-term correction`,
            };
        },
        topPhenotypeDomainSummary() {
            const terms = this.specificCoObservedTerms.slice(0, 3);
            return {
                label: "Top phenotype domains in matched samples",
                domains: terms.map((term) => ({
                    label: this.termName(term.label),
                    count: term.count,
                })),
            };
        },
        referenceGeneCandidates() {
            return (this.phenotype.geneCandidates || []).filter((row) => this.geneExactQuerySupportCount(row) > 0);
        },
        crdcOnlyGeneNames() {
            const genes = (this.phenotype.candidateEvidenceSummary || []).map((item) => item.gene).filter(Boolean);
            return genes.length ? genes.join(", ") : "the CRDC-linked genes";
        },
        specificCoObservedTerms() {
            return (this.phenotype.coObserved || []).filter((term) => !this.isBroadOntologyTerm(term.label));
        },
        compactContextLabel() {
            if (!this.hasActiveContext) return "";
            const contextId = this.clinicalFocus.orphaId || this.clinicalFocus.sourceId || "";
            return [this.clinicalFocus.label, contextId].filter(Boolean).join(" · ");
        },
        activeResidualGroupData() {
            return this.phenotype.residualGroups.find(
                (group) => group.name === this.activeResidualGroup
            ) || this.phenotype.residualGroups[0];
        },
        selectedSampleData() {
            return this.phenotype.topSamples.find(
                (sample) => sample.id === this.activeOutlierSample
            ) || {
                id: this.activeOutlierSample,
                investigator: "Investigator 2",
                proband: "Yes",
                affected: "Yes",
                sex: "Female",
                ageBand: "13-18",
                sexAge: "Female · 13-18",
                diagnosed: "Yes",
                diagnosedVariant: "KMT2D chr12:49,431,208 C>T | LP",
                queryTermsMatched: "2 / 2 query terms",
                scoringTermsMatched: "4 expanded scoring terms",
                totalTerms: 38,
                rawScore: "3.9",
                expectedScore: "2.1",
                residual: "+1.8",
                percentile: "top 6.2%",
                equalOrHigher: "18 / 904",
                signals: "KMT2D, CHD7",
                phenotypeProfile: [
                    { category: "Abnormality of the nervous system", terms: "18 terms", queryPhenotype: "Developmental delay [HP:0001263]", phenotypeTerms: ["Developmental delay [HP:0001263]", "Speech delay [HP:0000750]", "Seizure [HP:0001250]", "Hypotonia [HP:0001252]"] },
                    { category: "Abnormality of head or neck", terms: "9 terms", queryPhenotype: "Cleft palate [HP:0000175]", phenotypeTerms: ["Cleft palate [HP:0000175]", "Micrognathia [HP:0000347]", "Low-set ears [HP:0000369]"] },
                    { category: "Growth abnormality", terms: "8 terms", queryPhenotype: "", phenotypeTerms: ["Failure to thrive [HP:0001508]", "Short stature [HP:0004322]", "Poor weight gain [HP:0004325]"] },
                ],
            };
        },
        selectedSamplePhenotypeProfile() {
            const totalTerms = Number.parseInt(this.selectedSampleData.totalTerms, 10) || 0;
            if (this.selectedSampleData.phenotypeProfile && this.selectedSampleData.phenotypeProfile.length) {
                return this.selectedSampleData.phenotypeProfile.map((row) => ({
                    category: row.category,
                    terms: row.terms,
                    share: this.profileShare(row.terms, totalTerms),
                    queryMatch: row.queryPhenotype || "—",
                    phenotypeTerms: this.sortedPhenotypeTerms(row.phenotypeTerms || []).map((term) => this.termObject(term, this.isQueryTermText(term) ? "Query term" : "Selected sample term")),
                }));
            }
            const queryTerms = this.phenotype.queryTerms.exact.map((term) => ({
                ...this.termObject(`${term.label} [${term.id}]`, "Query term"),
                matched: true,
            }));
            const coObserved = this.specificCoObservedTerms.map((term) => this.termObject(term.label, "Co-observed in matched cohort"));
            const rowSpecs = [
                {
                    category: "Abnormality of head or neck [HP:0000152]",
                    count: Math.min(totalTerms || 107, 32),
                    queryMatch: queryTerms.find((term) => /oral|palate|head|neck/i.test(term.name)) ? "Query term present" : "—",
                    terms: [
                        ...queryTerms.filter((term) => /oral|palate|head|neck/i.test(term.name)),
                        ...coObserved.filter((term) => /head|neck|face|oral/i.test(term.name)).slice(0, 6),
                    ],
                },
                {
                    category: "Abnormality of metabolism/homeostasis [HP:0001939]",
                    count: Math.min(totalTerms || 107, 24),
                    queryMatch: queryTerms.find((term) => /purine|circulating|metabol/i.test(term.name)) ? "Query term present" : "—",
                    terms: [
                        ...queryTerms.filter((term) => /purine|circulating|metabol/i.test(term.name)),
                        ...coObserved.filter((term) => /metabol|circulating|blood|homeostasis/i.test(term.name)).slice(0, 5),
                    ],
                },
                {
                    category: "Abnormality of the nervous system [HP:0000707]",
                    count: Math.min(totalTerms || 107, 18),
                    queryMatch: "—",
                    terms: coObserved.filter((term) => /nervous|seizure|development|brain|neurolog/i.test(term.name)).slice(0, 6),
                },
                {
                    category: "Abnormality of the digestive system [HP:0025031]",
                    count: Math.min(totalTerms || 107, 9),
                    queryMatch: "—",
                    terms: coObserved.filter((term) => /digestive|feeding|reflux|constipation/i.test(term.name)).slice(0, 5),
                },
            ];
            return rowSpecs
                .map((row) => ({
                    category: row.category,
                    terms: `${row.count} / ${totalTerms || "—"} terms`,
                    share: totalTerms ? `${((row.count / totalTerms) * 100).toFixed(1)}%` : "Not available",
                    queryMatch: row.queryMatch,
                    phenotypeTerms: row.terms.length ? row.terms : [this.termObject("Term-level profile not available in current fixture", "Fixture gap")],
                }))
                .filter((row) => row.phenotypeTerms.length);
        },
        selectedScorePoint() {
            return this.phenotype.scorePoints.find(
                (point) => point.id === this.activeOutlierSample
            ) || this.phenotype.scorePoints[0];
        },
        selectedLabelStyle() {
            const left = parseFloat(this.selectedScorePoint.x || "76");
            const bottom = parseFloat(this.selectedScorePoint.y || "78");
            return {
                left: `${Math.min(Math.max(left - 18, 3), 62)}%`,
                bottom: `${Math.min(Math.max(bottom + 7, 10), 84)}%`,
            };
        },
        groupLabelStyle() {
            const left = parseFloat(this.activeResidualGroupData.x || "62");
            const bottom = parseFloat(this.activeResidualGroupData.y || "66");
            return {
                left: `${Math.min(Math.max(left - 12, 3), 68)}%`,
                bottom: `${Math.min(Math.max(bottom + 7, 10), 84)}%`,
            };
        },
    },
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
    methods: {
        closeToolPopovers() {
            this.contextPopoverOpen = false;
            this.optionsPopoverOpen = false;
            this.candidateInfoOpen = false;
            this.referenceInfoOpen = false;
            this.cohortInfoOpen = false;
            this.activeReferenceDetail = "";
        },
        removeClinicalContext() {
            clearClinicalFocus();
            this.contextPopoverOpen = false;
        },
        countByNormalized(rows, key) {
            return rows.reduce((acc, row) => {
                const value = String(row[key] || "").toLowerCase();
                acc[value] = (acc[value] || 0) + 1;
                return acc;
            }, {});
        },
        candidateEvidenceDetail(gene) {
            const row = this.phenotype.geneCandidates.find((candidate) => candidate.gene === gene);
            return row ? row.cohortCarrierEvidence : "";
        },
        compactCandidateSourceLabel(gene, sources = []) {
            const hasExternal = sources.some((source) => /external/i.test(source));
            const row = this.phenotype.geneCandidates.find((candidate) => candidate.gene === gene);
            const carrierCount = row ? this.carrierCountLabel(row.cohortCarrierEvidence) : "";
            const parts = [];
            if (hasExternal) parts.push("External");
            if (carrierCount) parts.push(`CRDC ${carrierCount}`);
            if (!parts.length && sources.length) parts.push(sources.join(" | "));
            return parts.join(" | ") || "CRDC";
        },
        carrierCountLabel(value) {
            const match = String(value || "").match(/(\d+)\s*\/\s*(\d+)/);
            return match ? `${match[1]}/${match[2]}` : "";
        },
        readableCarrierEvidence(row) {
            const count = this.carrierCountLabel(row.cohortCarrierEvidence);
            if (count) {
                return `${count} phenotype-matched CRDC samples carry rare ${row.gene} variants`;
            }
            return row.cohortCarrierEvidence || "Not available";
        },
        normalizedExternalAnnotation(value) {
            if (!value || /shown when available/i.test(value)) {
                return "No Orphanet / HPO / OMIM annotation available in current fixture";
            }
            return value;
        },
        termName(value) {
            return String(value || "").replace(/\s*\[HP:\d+\]\s*$/, "");
        },
        termObject(value, role = "Phenotype term") {
            const text = String(value || "");
            const match = text.match(/^(.*?)\s*\[(HP:\d+)\]\s*$/);
            const name = match ? match[1].trim() : text;
            const id = match ? match[2] : "";
            return {
                name,
                id,
                role,
                matched: this.isQueryTermText(text),
            };
        },
        profileShare(termText, totalTerms) {
            const count = Number.parseInt(String(termText || "").match(/\d+/)?.[0], 10);
            if (!Number.isFinite(count) || !totalTerms) return "Not available";
            return `${((count / totalTerms) * 100).toFixed(1)}%`;
        },
        isBroadOntologyTerm(value) {
            const text = String(value || "").toLowerCase();
            return text.startsWith("all ") || text.startsWith("phenotypic abnormality");
        },
        diseaseHpoCount(value) {
            const match = String(value || "").match(/(\d+\s*\/\s*\d+)\s+disease HPO terms/i);
            return match ? `${match[1].replace(/\s/g, "")} disease HPO terms` : "Matched disease HPO terms";
        },
        referenceMatchedTerms(row) {
            const queryTerms = this.phenotype.queryTerms.exact.map((term) => `${term.label} [${term.id}]`);
            const coObservedTerms = this.specificCoObservedTerms.slice(0, 12).map((term) => term.label);
            if (row && row.gene) {
                return [...queryTerms, ...coObservedTerms.slice(0, 4)];
            }
            const target = Number.parseInt(String(row.profileMatch || "").match(/(\d+)\s*\//)?.[1], 10) || 6;
            return [...queryTerms, ...coObservedTerms].slice(0, target);
        },
        referenceDiseaseTermRows(row) {
            const matchedTerms = this.referenceMatchedTerms(row).map((term) => ({
                ...this.termObject(term, "Matched overlap"),
                matched: true,
                root: this.rootCategoryForTerm(term),
            }));
            const denominator = Number.parseInt(String(row.profileMatch || "").match(/\/\s*(\d+)/)?.[1], 10);
            const remaining = Number.isFinite(denominator)
                ? Math.max(denominator - matchedTerms.length, 0)
                : 0;
            if (remaining > 0) {
                matchedTerms.push({
                    matched: false,
                    name: `+${remaining} disease-profile terms not included in the current term-level fixture`,
                    id: "",
                    root: "Full reference profile",
                    role: "Fixture gap",
                });
            }
            return matchedTerms;
        },
        referenceGeneTermRows(row) {
            if (row && Array.isArray(row.hpoTerms) && row.hpoTerms.length) {
                return row.hpoTerms.map((term) => ({
                    matched: Boolean(term.matched),
                    name: term.hpoTerm || term.hpoId,
                    id: term.hpoId || "",
                    role: term.evidenceRole || (term.related ? "Related HPO term" : "Gene phenotype annotation"),
                }));
            }
            return this.phenotype.queryTerms.exact.map((term) => ({
                ...this.termObject(`${term.label} [${term.id}]`, "Original query HPO term not exported for this gene"),
                matched: false,
            }));
        },
        geneHpoSupportLabel(row) {
            if (row && row.profileMatch) return row.profileMatch;
            const terms = Array.isArray(row?.hpoTerms) ? row.hpoTerms : [];
            const exact = this.geneExactQuerySupportCount(row);
            const related = terms.filter((term) => term.related).length;
            const parts = [`${exact} / ${this.phenotype.queryTerms.exact.length} exact query HPO terms`];
            if (related) parts.push(`${related} related HPO terms`);
            return parts.join(" · ");
        },
        geneExactQuerySupportCount(row) {
            const terms = Array.isArray(row?.hpoTerms) ? row.hpoTerms : [];
            return terms.filter((term) => term.matched).length;
        },
        referenceCrdcSamples() {
            return (this.phenotype.topSamples || []).slice(0, 6);
        },
        rootCategoryForTerm(value) {
            const text = String(value || "").toLowerCase();
            if (/oral|palate|head|neck|face/.test(text)) return "Head or neck";
            if (/purine|circulating|metabol|blood|homeostasis/.test(text)) return "Metabolism / homeostasis";
            if (/nervous|seizure|development|brain|neurolog/.test(text)) return "Nervous system";
            if (/digestive|feeding|reflux|constipation/.test(text)) return "Digestive system";
            return "Other disease HPO category";
        },
        toggleReferenceDetail(key) {
            this.activeReferenceDetail = this.activeReferenceDetail === key ? "" : key;
        },
        activeReferenceDetailRow(id) {
            return this.activeReferenceDetail.endsWith(`-${id}`);
        },
        referenceDetailHeading(row) {
            if (this.activeReferenceDetail.includes("-crdc-")) {
                return row.gene ? `${row.gene} CRDC carrier evidence` : `${row.disease} CRDC overlay`;
            }
            if (this.activeReferenceDetail.includes("-terms-")) {
                return row.gene ? `${row.gene} matched HPO terms` : `${row.disease} matched disease HPO terms`;
            }
            return row.gene ? `${row.gene} query phenotype overlap` : `${row.disease} HPO profile overlap`;
        },
        referenceDetailNote(row) {
            if (this.activeReferenceDetail.includes("-crdc-")) {
                return row.gene
                    ? `${this.readableCarrierEvidence(row)}. Rows below show phenotype-matched CRDC samples currently available in the fixture.`
                    : `${row.crdcEvidence} means phenotype-matched CRDC samples whose profiles overlap this external disease reference in the current mock overlay. It is not the same object as the disease-HPO term list.`;
            }
            if (row.gene) {
                return "Rows show this gene's external HPO annotations from the test DB. Checkmarks mark exact searched HPO terms; related hierarchy terms are not counted as exact query support.";
            }
            return "The checkmark marks HPO terms that are currently represented as matched overlap terms. The full disease-profile denominator is shown, but the current fixture does not expose every disease HPO term.";
        },
        rowHasQueryTerm(row) {
            const joined = [
                row.queryPhenotype,
                ...(row.phenotypeTerms || []),
                row.category,
            ].join(" ");
            return this.isQueryTermText(joined);
        },
        sortedPhenotypeTerms(terms) {
            return [...terms].sort((a, b) => {
                const aBroad = this.isBroadOntologyTerm(a) ? 1 : 0;
                const bBroad = this.isBroadOntologyTerm(b) ? 1 : 0;
                if (aBroad !== bBroad) return aBroad - bBroad;
                const aQuery = this.isQueryTermText(a) ? 0 : 1;
                const bQuery = this.isQueryTermText(b) ? 0 : 1;
                if (aQuery !== bQuery) return aQuery - bQuery;
                return String(a).localeCompare(String(b));
            });
        },
        matchedQueryTermsForSample(sample) {
            const match = String(sample.queryTermsMatched || "").match(/^(\d+)\s*\/\s*(\d+)/);
            const matchedCount = match ? Number.parseInt(match[1], 10) : this.phenotype.queryTerms.exact.length;
            return this.phenotype.queryTerms.exact.slice(0, matchedCount);
        },
        unmatchedQueryTermsForSample(sample) {
            const matchedIds = new Set(this.matchedQueryTermsForSample(sample).map((term) => term.id));
            return this.phenotype.queryTerms.exact.filter((term) => !matchedIds.has(term.id));
        },
        splitTerms(value) {
            if (!value || value === "—") return ["—"];
            return String(value)
                .split(/[,·]/)
                .map((term) => term.trim())
                .filter(Boolean);
        },
        isQueryTermText(value) {
            return this.phenotype.queryTerms.exact.some((term) => (
                String(value).includes(term.id) || String(value).includes(term.label)
            ));
        },
        sampleRecord(sampleId) {
            return this.phenotype.topSamples.find((sample) => sample.id === sampleId);
        },
        sampleProband(sample) {
            const record = this.sampleRecord(sample.id);
            if (record && record.proband) return record.proband;
            const status = String(sample.status || "").toLowerCase();
            if (status.includes("non-proband")) return "No";
            if (status.includes("proband")) return "Yes";
            return "Not available";
        },
        sampleAffected(sample) {
            const record = this.sampleRecord(sample.id);
            if (record && record.affected) return record.affected;
            const status = String(sample.status || "").toLowerCase();
            if (status.includes("affected") || status.includes("proband")) return "Yes";
            return "Not available";
        },
        investigatorPhenotypeSignature(group) {
            const terms = this.specificCoObservedTerms.slice(0, 3).map((term) => this.termName(term.label));
            return terms.length
                ? `${terms.join(" · ")}`
                : "Matched-set phenotype signature not available";
        },
        investigatorExampleSamples(group) {
            return (group.outliers || []).slice(0, 3).map((sample) => sample.id).join(" · ") || "Not available";
        },
        togglePanel(panel) {
            this.openPanels[panel] = !this.openPanels[panel];
        },
        togglePhenotype(label) {
            this.activePhenotype = this.activePhenotype === label ? "" : label;
        },
        toggleResidualGroup(groupName) {
            this.activeResidualGroup = this.activeResidualGroup === groupName ? "" : groupName;
        },
        toggleExactCategory(category) {
            this.activeExactCategory = this.activeExactCategory === category ? "" : category;
        },
        toggleSampleProfileCategory(category) {
            this.activeSampleProfileCategory = this.activeSampleProfileCategory === category ? "" : category;
        },
        selectSample(sampleId) {
            this.activeOutlierSample = sampleId;
            this.diagnosisOpen = false;
            this.activeSampleProfileCategory = "Abnormality of the nervous system";
        },
        phenotypeTermHref(term) {
            return `/krPhenotype.html?term=${encodeURIComponent(term.id)}&label=${encodeURIComponent(term.label)}`;
        },
        sampleHref(sampleId) {
            return `/krSample.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        variantHref(query) {
            return `/krVariant.html?query=${encodeURIComponent(query)}`;
        },
        signalGenes(signals) {
            return String(signals || "")
                .split(",")
                .map((signal) => signal.trim())
                .filter(Boolean);
        },
    },
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
    font-size: 0.72rem;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
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
    font-weight: 700;
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
    font-size: 0.62rem;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.glens-accordion-table > div:first-child span {
    color: #526276;
    font-weight: 850;
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
