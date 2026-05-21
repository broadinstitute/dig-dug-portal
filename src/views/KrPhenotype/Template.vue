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
                        <div class="glens-query-match-summary">
                            <div class="glens-query-match-label">
                                <span>Phenotype-similar samples</span>
                                <button class="glens-query-info" type="button" aria-label="Phenotype-similar samples explanation">
                                    i
                                    <span class="glens-query-info-popover">raw weighted similarity search</span>
                                </button>
                            </div>
                            <strong>132 / 904</strong>
                        </div>
                        <div class="glens-semantic-plain">
                            <button class="glens-plain-disclosure" type="button" @click="togglePanel('semanticPhenotypes')">
                                <span>{{ openPanels.semanticPhenotypes ? "▾" : "▸" }}</span>
                                Semantically similar phenotypes
                            </button>
                            <div v-if="openPanels.semanticPhenotypes" class="glens-plain-term-list">
                                <span v-for="term in phenotype.queryTerms.expanded" :key="term.id">
                                    {{ term.label }} [{{ term.id }}]
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="glens-hero-results">
                        <div class="glens-summary-group glens-summary-group--cohort">
                            <div class="glens-summary-cell glens-summary-cell--chart">
                                <div class="glens-hero-cohort-copy">
                                    <strong>132 phenotype-matched samples</strong>
                                    <span>132 / 904 eligible samples (14.6%)</span>
                                    <span>Sex: 77 female · 55 male</span>
                                    <span>Proband status: 77 proband · 55 non-proband</span>
                                </div>
                                <div class="glens-hero-age-block">
                                    <div class="glens-hero-age-heading">
                                        <strong>Age distribution</strong>
                                        <span>Among 132 phenotype-matched samples</span>
                                    </div>
                                    <div class="glens-hero-age-histogram">
                                        <div
                                            v-for="bin in phenotype.ageBins"
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
                        <div class="glens-summary-group glens-summary-group--triplet">
                            <div class="glens-summary-cell">
                                <span>{{ phenotype.headline[1].label }}</span>
                                <strong>{{ phenotype.headline[1].value }}</strong>
                                <small>{{ phenotype.headline[1].detail }}</small>
                            </div>
                            <div class="glens-summary-cell">
                                <span>{{ phenotype.headline[2].label }}</span>
                                <strong>{{ phenotype.headline[2].value }}</strong>
                                <small>{{ phenotype.headline[2].detail }}</small>
                            </div>
                            <div class="glens-summary-cell glens-summary-cell--candidate">
                                <div class="glens-heading-with-info">
                                    <span>Candidate gene evidence</span>
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
                                            <span>External: Supported by external disease or gene-phenotype annotations from the input HPO terms.</span>
                                            <span>CRDC: Supported by variants observed in phenotype-matched CRDC samples.</span>
                                            <span>Genes with both labels have support from both reference annotations and CRDC cohort evidence.</span>
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
                                        <small>[{{ item.sources.join(" | ") }}]</small>
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
                            <p class="glens-small-heading">Phenotype-derived candidates</p>
                            <small>Which diseases, genes, and cohort variants are supported by the input phenotype profile?</small>
                            <p class="glens-source-note">
                                Input HPO profile → weighted PheRS/profile matching → ranked disease and gene candidates → CRDC cohort evidence overlay.
                            </p>
                            <p class="glens-source-note">
                                User-entered HPO terms are evaluated as a weighted phenotype profile, not as independent union filters. Exact matches, related HPO terms, and broad terms are scored differently. External annotations define reference disease/gene profiles, and CRDC cohort evidence is overlaid after profile-based ranking.
                            </p>
                            <div class="glens-tab-row glens-tab-row--insights">
                                <button
                                    type="button"
                                    :class="{ 'glens-tab-button--active': activeInsightTab === 'disease' }"
                                    @click="activeInsightTab = 'disease'"
                                >
                                    Disease candidates
                                </button>
                                <button
                                    type="button"
                                    class="glens-tab-button--molecular"
                                    :class="{ 'glens-tab-button--active': activeInsightTab === 'gene' }"
                                    @click="activeInsightTab = 'gene'"
                                >
                                    Gene candidates
                                </button>
                                <button
                                    type="button"
                                    :class="{ 'glens-tab-button--active': activeInsightTab === 'variant' }"
                                    @click="activeInsightTab = 'variant'"
                                >
                                    Cohort variant overlay
                                </button>
                            </div>
                        </div>
                    </div>

                    <section v-if="activeInsightTab === 'disease'" class="glens-step-card glens-step-card--tabbed">
                        <div class="glens-step-body">
                            <p class="glens-source-note">
                                Disease candidates are ranked by weighted profile match against external disease-HPO references, then checked against CRDC cohort evidence in linked genes.
                            </p>
                            <div class="glens-candidate-table glens-candidate-table--disease">
                                <div class="glens-candidate-head">
                                    <span>Disease candidate</span>
                                    <span>PheRS/profile match</span>
                                    <span>External annotation</span>
                                    <span>CRDC cohort evidence</span>
                                    <span>Why matched</span>
                                </div>
                                <div
                                    v-for="row in phenotype.diseaseCandidates"
                                    :key="row.disease"
                                    class="glens-candidate-row"
                                >
                                    <strong>{{ row.disease }}</strong>
                                    <span>{{ row.profileMatch }}</span>
                                    <span>
                                        {{ row.externalAnnotation }}
                                        <span class="glens-signal-links glens-signal-links--coobserved">
                                            <a
                                                v-for="gene in row.linkedGenes"
                                                :key="`${row.disease}-${gene}`"
                                                :href="variantHref(gene)"
                                            >
                                                {{ gene }}
                                            </a>
                                        </span>
                                    </span>
                                    <span>{{ row.crdcEvidence }}</span>
                                    <span>{{ row.whyMatched }}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section v-if="activeInsightTab === 'gene'" class="glens-step-card glens-step-card--tabbed">
                        <div class="glens-step-body">
                            <p class="glens-source-note">
                                Gene candidates are ranked from profile-matched disease/gene annotations, with CRDC variant evidence shown as an overlay.
                            </p>
                            <div class="glens-candidate-table glens-candidate-table--gene">
                                <div class="glens-candidate-head">
                                    <span>Gene</span>
                                    <span>PheRS/profile match</span>
                                    <span>External annotation</span>
                                    <span>CRDC cohort evidence</span>
                                    <span>Why matched</span>
                                </div>
                                <div
                                    v-for="row in phenotype.geneCandidates"
                                    :key="row.gene"
                                    class="glens-candidate-row"
                                >
                                    <a :href="variantHref(row.gene)">{{ row.gene }}</a>
                                    <span>{{ row.profileMatch }}</span>
                                    <span>{{ row.externalAnnotation }}</span>
                                    <span>{{ row.cohortCarrierEvidence }}</span>
                                    <span>{{ row.whyMatched }}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section v-if="activeInsightTab === 'variant'" class="glens-step-card glens-step-card--tabbed">
                        <div class="glens-step-body">
                            <p class="glens-source-note">
                                These variants are not inferred directly from the HPO terms. They are cohort variants found in genes prioritized from the input phenotype profile.
                            </p>
                            <div class="glens-candidate-table glens-candidate-table--variant">
                                <div class="glens-candidate-head">
                                    <span>Variant</span>
                                    <span>Gene</span>
                                    <span>Carriers among matched samples</span>
                                    <span>Carrier phenotype fit</span>
                                    <span>Annotation</span>
                                </div>
                                <div
                                    v-for="variant in phenotype.candidateVariants"
                                    :key="variant.id"
                                    class="glens-candidate-row"
                                >
                                    <a :href="variant.link">{{ variant.id }}</a>
                                    <a :href="variantHref(variant.gene)">{{ variant.gene }}</a>
                                    <span>{{ variant.carriers }}</span>
                                    <span>{{ variant.coherence }}</span>
                                    <span>{{ variant.pathogenicity }}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </section>

                <section class="glens-evidence-grid">
                    <section class="glens-insight-tabs-card glens-cohort-tabs-card">
                        <div class="glens-section-head">
                            <div>
                                <p class="glens-section-label">CRDC cohort evidence</p>
                                <h2>How does this phenotype profile appear across CRDC samples, phenotypes, variants, and investigator groups?</h2>
                                <p class="glens-source-note">
                                    These results are generated by applying the input phenotype profile to the CRDC cohort.
                                </p>
                            </div>
                        </div>

                        <div class="glens-tab-row glens-tab-row--insights">
                            <button
                                type="button"
                                :class="{ 'glens-tab-button--active': activeEvidenceTab === 'individual' }"
                                @click="activeEvidenceTab = 'individual'"
                            >
                                Matched samples
                            </button>
                            <button
                                type="button"
                                :class="{ 'glens-tab-button--active': activeEvidenceTab === 'coobserved' }"
                                @click="activeEvidenceTab = 'coobserved'"
                            >
                                Co-observed phenotypes
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
                                    <span>Similarity</span>
                                    <span>Residual</span>
                                    <span>Candidate signals</span>
                                </div>
                                <div
                                    v-for="sample in phenotype.topSamples"
                                    :key="sample.rank"
                                    class="glens-sample-row"
                                    :class="{ 'glens-sample-row--selected': sample.id === activeOutlierSample }"
                                >
                                    <strong>{{ sample.rank }}</strong>
                                    <button class="glens-inline-link glens-inline-link--button" type="button" @click="selectSample(sample.id)">
                                        {{ sample.id }}
                                    </button>
                                    <span>{{ sample.investigator }}</span>
                                    <span>{{ sample.queryTermsMatched }}</span>
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
                                        <span>Expected for n_terms</span><strong>{{ selectedSampleData.expectedScore }}</strong>
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
                                            <span>Terms</span>
                                            <span>Query phenotype in category</span>
                                        </div>
                                        <template v-for="row in selectedSampleData.phenotypeProfile">
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
                                                <span>{{ row.queryPhenotype || "—" }}</span>
                                            </button>
                                            <div
                                                v-if="activeSampleProfileCategory === row.category"
                                                :key="`${selectedSampleData.id}-${row.category}-terms`"
                                                class="glens-profile-expanded"
                                            >
                                                <span
                                                    v-for="term in row.phenotypeTerms"
                                                    :key="`${selectedSampleData.id}-${row.category}-${term}`"
                                                >
                                                    {{ term }}
                                                </span>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>

                            <div class="glens-support-panel mt-space">
                                <div class="glens-panel-title">
                                    <span>Annotation-burden QC</span>
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
                                    <span class="glens-axis-x">X-axis: phenotype complexity (n_terms)</span>
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
                                            <span>{{ row.queryTerms }}</span>
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
                                        <span>Status</span>
                                        <span>Burden-corrected score</span>
                                        <span>Candidate signals</span>
                                    </div>
                                    <div
                                        v-for="sample in activeResidualGroupData.outliers"
                                        :key="sample.id"
                                        class="glens-outlier-row"
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
                                        <span>{{ sample.status }}</span>
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
            unsubscribeClinicalFocus: null,
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
        },
        removeClinicalContext() {
            clearClinicalFocus();
            this.contextPopoverOpen = false;
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
