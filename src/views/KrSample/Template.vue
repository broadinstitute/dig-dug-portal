<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body glens-page">
            <main class="glens-sample" :class="{ 'glens-large-text': largeText }">
                <div class="glens-access-toolbar" aria-label="Display options">
                    <div class="glens-page-mode-label" aria-label="Current workflow">
                        <span>Workflow</span>
                        <strong>Sample search</strong>
                        <div class="glens-sample-info-tool" @click.stop>
                            <button
                                class="glens-sample-info-button"
                                type="button"
                                aria-label="Sample search explanation"
                                @click="sampleInfoOpen = !sampleInfoOpen"
                            >
                                i
                            </button>
                            <div v-if="sampleInfoOpen" class="glens-sample-info-popover">
                                <button
                                    class="glens-sample-info-close"
                                    type="button"
                                    aria-label="Close sample search explanation"
                                    @click="sampleInfoOpen = false"
                                >
                                    ×
                                </button>
                                <p>
                                    Similar-patient search excludes this sample itself. The main score asks which other CRDC samples best reproduce this sample's HPO profile; rarer HPO terms contribute more than common broad terms.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="glens-result-tools">
                        <div class="glens-sample-context-info-tool" @click.stop>
                            <button
                                class="glens-sample-context-info-button"
                                type="button"
                                aria-label="Context status explanation"
                                @click="contextInfoOpen = !contextInfoOpen; contextPopoverOpen = false; optionsPopoverOpen = false"
                            >
                                i
                            </button>
                            <div v-if="contextInfoOpen" class="glens-sample-context-info-popover">
                                <div v-if="!hasActiveContext">
                                    <p class="glens-sample-context-info-kicker">Core question</p>
                                    <p>
                                        What are the unique clinical (phenotype) and genetic (genotype) characteristics of this sample, and where does it lie within the overall cohort?
                                    </p>
                                    <p class="glens-sample-context-info-kicker">Purpose</p>
                                    <ul>
                                        <li>Establish the baseline profile of the searched sample (HPO profile, rare variants, cohort position).</li>
                                        <li>Workflow priority: understand the searched sample itself, match against known disease patterns, then explore similar samples.</li>
                                    </ul>
                                </div>
                                <div v-else>
                                    <p class="glens-sample-context-info-kicker">Core question</p>
                                    <p>
                                        How well do this sample's clinical and genetic features align with the current clinical hypothesis (active context), and does the variant evidence support that hypothesis?
                                    </p>
                                    <p class="glens-sample-context-info-kicker">Purpose</p>
                                    <ul>
                                        <li>Hypothesis-driven interpretation and validation.</li>
                                        <li>Focus on identifying and evaluating the overlap between the sample profile and the active context.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
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
                                @click="contextPopoverOpen = !contextPopoverOpen; contextInfoOpen = false; optionsPopoverOpen = false"
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
                                @click="optionsPopoverOpen = !optionsPopoverOpen; contextInfoOpen = false; contextPopoverOpen = false"
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
                <section class="glens-hero-card">
                    <div class="glens-identity">
                        <h1>{{ displaySampleId }}</h1>
                        <div class="glens-sample-header-meta" aria-label="Sample metadata summary">
                            <span>{{ sample.sex }} | Age at enrollment {{ displayAgeAtEnrollment }} | GenDx: {{ sample.gendx.shortStatus }}</span>
                            <span>{{ sample.hpoTotal }} HPO terms | {{ sample.rareCodingGenes }} genes with rare coding variants</span>
                        </div>
                    </div>

                    <div class="glens-answer-grid" aria-label="Top evidence summary">
                        <article class="glens-answer-card glens-answer-card--compact">
                            <div v-for="answer in topAnswers" :key="answer.label" class="glens-answer-item">
                                <span>{{ answer.label }}</span>
                                <strong>{{ answer.value }}</strong>
                            </div>
                        </article>
                    </div>
                </section>

                <section class="glens-tab-card">
                    <nav class="glens-tab-strip" aria-label="Sample evidence sections">
                        <button
                            v-for="tab in tabs"
                            :key="tab.id"
                            type="button"
                            class="glens-tab-button"
                            :class="{ 'glens-tab-button--active': activeTab === tab.id }"
                            @click="activeTab = tab.id"
                        >
                            {{ tab.label }}
                        </button>
                    </nav>

                    <section v-if="activeTab === 'overview'" class="glens-tab-panel">
                        <div class="glens-overview-layout">
                            <article class="glens-panel glens-panel--wide">
                                <div class="glens-section-head">
                                    <div>
                                        <div class="glens-title-with-info" @click.stop>
                                            <h2>Who is closest to this sample, and which investigator phenotype signatures fit this sample?</h2>
                                            <button
                                                class="glens-section-info-button"
                                                type="button"
                                                aria-label="Overview score basis explanation"
                                                @click="overviewInfoOpen = !overviewInfoOpen"
                                            >
                                                i
                                            </button>
                                            <div v-if="overviewInfoOpen" class="glens-section-info-popover">
                                                <button
                                                    class="glens-section-info-close"
                                                    type="button"
                                                    aria-label="Close overview score basis explanation"
                                                    @click="overviewInfoOpen = false"
                                                >
                                                    ×
                                                </button>
                                                <p>
                                                    Score basis: similar-patient retrieval uses raw weighted phenotype similarity with self excluded. Investigator context is a separate signature-affinity analysis: each investigator group contributes an enriched HPO signature, and this sample is scored against those group signatures using annotation-burden-corrected z-scores.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="glens-sim-mode-panel glens-sim-mode-panel--overview">
                                    <span>Similarity basis</span>
                                    <strong>Phenotype-based</strong>
                                </div>

                                <div class="glens-position-list">
                                    <div v-for="position in sample.positionMetrics" :key="position.label" class="glens-position-row" @click.stop>
                                        <div class="glens-position-summary glens-position-summary--plain">
                                            <span class="glens-position-label">
                                                <strong>{{ position.label }}</strong>
                                                <button
                                                    type="button"
                                                    class="glens-inline-info-button"
                                                    :aria-label="`${position.label} explanation`"
                                                    @click="toggleMetricInfo(position.label)"
                                                >
                                                    i
                                                </button>
                                            </span>
                                            <span>{{ position.value }}</span>
                                        </div>
                                        <div v-if="activeMetricInfoLabel === position.label" class="glens-metric-info-popover">
                                            <button
                                                type="button"
                                                class="glens-section-info-close"
                                                :aria-label="`Close ${position.label} explanation`"
                                                @click="activeMetricInfoLabel = null"
                                            >
                                                ×
                                            </button>
                                            <p>{{ position.text }}</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="glens-affinity-box">
                                    <div class="glens-affinity-head">
                                        <div>
                                            <strong>Investigator phenotype-signature affinity</strong>
                                            <button type="button" class="glens-affinity-method" @click="affinityMethodOpen = !affinityMethodOpen">
                                                <i>{{ affinityMethodOpen ? "▾" : "▸" }}</i>
                                                {{ sample.groupScanSummary }}
                                            </button>
                                        </div>
                                        <em>Top 3 shown</em>
                                    </div>
                                    <p v-if="affinityMethodOpen" class="glens-source-note glens-source-note--affinity">
                                        Each investigator group is converted into a phenotype signature from HPO terms enriched in that group. {{ sample.sampleId }} is scored against every group signature, corrected for HPO annotation burden, and standardized against all CRDC samples for that signature. z = 0 means average similarity to that group signature; higher z means the sample is more group-like.
                                    </p>
                                    <div class="glens-affinity-columns">
                                        <span>Rank</span>
                                        <span>Investigator</span>
                                        <div class="glens-affinity-scale">
                                            <span>less group-like</span>
                                            <div class="glens-affinity-ruler" aria-hidden="true">
                                                <span>0</span>
                                            </div>
                                            <span>more group-like</span>
                                        </div>
                                        <span>z-score</span>
                                    </div>
                                    <div class="glens-affinity-list">
                                        <div v-for="group in sample.groupAffinityTop" :key="group.label" class="glens-affinity-row">
                                            <span class="glens-affinity-rank">{{ group.rank }}</span>
                                            <strong>{{ group.label }}</strong>
                                            <div class="glens-affinity-track" :aria-label="group.zScore">
                                                <i></i>
                                                <b :style="{ left: group.dotLeft }"></b>
                                            </div>
                                            <span>{{ group.zScore }}</span>
                                        </div>
                                    </div>
                                    <div class="glens-affinity-select">
                                        <label for="investigator-affinity-select">Inspect one investigator group</label>
                                        <select id="investigator-affinity-select" v-model="selectedInvestigatorGroup">
                                            <option v-for="group in allInvestigatorOptions" :key="group.label" :value="group.label">
                                                {{ group.label }}
                                            </option>
                                        </select>
                                        <p v-if="selectedInvestigatorAffinity">
                                            Rank {{ selectedInvestigatorAffinity.rank }} · z-score {{ selectedInvestigatorAffinity.zScore }}
                                        </p>
                                    </div>
                                </div>
                            </article>

                            <article class="glens-panel">
                                <div class="glens-section-head">
                                    <div>
                                        <p class="glens-eyebrow">Sample overview</p>
                                    </div>
                                </div>

                                <nav class="glens-card-tabs" aria-label="Sample overview card sections">
                                    <button
                                        v-for="tab in overviewCardTabs"
                                        :key="tab.id"
                                        type="button"
                                        class="glens-card-tab-button"
                                        :class="{ 'glens-card-tab-button--active': activeOverviewCardTab === tab.id }"
                                        @click="activeOverviewCardTab = tab.id"
                                    >
                                        {{ tab.label }}
                                    </button>
                                </nav>

                                <div v-if="activeOverviewCardTab === 'summary'" class="glens-card-tab-panel">
                                    <div class="glens-kv-grid">
                                        <div v-for="item in overviewItems" :key="item.label" class="glens-kv-row">
                                            <span>{{ item.label }}</span>
                                            <strong>{{ item.value }}</strong>
                                        </div>
                                    </div>

                                    <div v-if="hasActiveContext" class="glens-context-comparison">
                                        <h3>Context comparison</h3>
                                        <div class="glens-kv-grid glens-kv-grid--compact">
                                            <div v-for="item in contextComparisonItems" :key="item.label" class="glens-kv-row">
                                                <span>{{ item.label }}</span>
                                                <strong>{{ item.value }}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="glens-gendx-card" @click.stop>
                                        <div class="glens-gendx-head">
                                            <h3>{{ gendxPanelTitle }}</h3>
                                            <div v-if="sample.gendx.resultCount > 1" class="glens-gendx-dots" aria-label="Reported GenDx variants">
                                                <button
                                                    v-for="index in sample.gendx.resultCount"
                                                    :key="index"
                                                    type="button"
                                                    :class="{ 'glens-gendx-dot--active': index === 1 }"
                                                    :aria-label="`GenDx reported variant ${index}`"
                                                ></button>
                                            </div>
                                            <button
                                                class="glens-gendx-info-button"
                                                type="button"
                                                aria-label="GenDx panel explanation"
                                                @click="gendxInfoOpen = !gendxInfoOpen"
                                            >
                                                i
                                            </button>
                                            <div v-if="gendxInfoOpen" class="glens-gendx-info-popover">
                                                <button
                                                    class="glens-gendx-info-close"
                                                    type="button"
                                                    aria-label="Close GenDx panel explanation"
                                                    @click="gendxInfoOpen = false"
                                                >
                                                    ×
                                                </button>
                                                <p>{{ sample.gendx.interpretation }}</p>
                                            </div>
                                        </div>
                                        <div class="glens-kv-grid glens-kv-grid--compact glens-gendx-table">
                                            <div v-for="item in gendxRows" :key="item.label" class="glens-kv-row">
                                                <span>{{ item.label }}</span>
                                                <a
                                                    v-if="item.href"
                                                    class="glens-gendx-variant-link"
                                                    :href="item.href"
                                                >
                                                    {{ item.value }}
                                                </a>
                                                <strong v-else>{{ item.value }}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="activeOverviewCardTab === 'phenotype'" class="glens-card-tab-panel">
                                    <h3 class="glens-card-tab-heading">Phenotype profile composition</h3>
                                    <div class="glens-domain-stack-grid" aria-label="Phenotype category composition">
                                        <article v-for="domain in sample.phenotypeDomains" :key="domain.name" class="glens-domain-stack-card">
                                            <div class="glens-domain-stack-copy">
                                                <strong>{{ domain.name }}</strong>
                                                <div class="glens-domain-stack-metric">
                                                    <span>{{ domain.count }} / {{ sample.hpoTotal }} HPO terms</span>
                                                    <div class="glens-domain-stack-plot" aria-hidden="true">
                                                        <div class="glens-domain-stack-fill" :style="{ width: domainFillPercent(domain) }"></div>
                                                    </div>
                                                </div>
                                                <div class="glens-hpo-term-list">
                                                    <div v-for="term in visibleDomainTerms(domain)" :key="term" class="glens-hpo-term-row">{{ term }}</div>
                                                    <button
                                                        v-if="domainMoreCount(domain) > 0"
                                                        class="glens-inline-more-button"
                                                        type="button"
                                                        @click="toggleDomainTerms(domain.name)"
                                                    >
                                                        {{ isDomainExpanded(domain.name) ? "Show less" : `+${domainMoreCount(domain)} more` }}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    </div>

                                    <button class="glens-accordion-toggle glens-accordion-toggle--small" type="button" @click="togglePanel('allHpo')">
                                        <span>{{ openPanels.allHpo ? "▾" : "▸" }}</span>
                                        Full HPO term list
                                    </button>
                                    <div v-if="openPanels.allHpo" class="glens-hpo-table" aria-label="Full HPO term list">
                                        <div class="glens-hpo-table-head">
                                            <span>HPO term</span>
                                            <span>HPO ID</span>
                                        </div>
                                        <div v-for="term in sample.fullHpoTerms" :key="term" class="glens-hpo-table-row">
                                            <span>{{ hpoTermName(term) }}</span>
                                            <strong>{{ hpoTermId(term) }}</strong>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>

                    <section v-if="activeTab === 'phenotype'" class="glens-tab-panel">
                        <div class="glens-section-head">
                            <div>
                                <div class="glens-title-with-info" @click.stop>
                                    <h2>Phenotype-based similar samples</h2>
                                    <button
                                        class="glens-section-info-button"
                                        type="button"
                                        aria-label="Similar phenotype explanation"
                                        @click="phenotypeInfoOpen = !phenotypeInfoOpen"
                                    >
                                        i
                                    </button>
                                    <div v-if="phenotypeInfoOpen" class="glens-section-info-popover">
                                        <button
                                            class="glens-section-info-close"
                                            type="button"
                                            aria-label="Close similar phenotype explanation"
                                            @click="phenotypeInfoOpen = false"
                                        >
                                            ×
                                        </button>
                                        <p>
                                            The searched sample is not compared to itself here. Rows show other CRDC samples ranked by a PheRS-like weighted phenotype profile similarity scaled from 0 to 1. More specific shared HPO terms contribute more than broad ontology terms. Residual is not used for this nearest-patient ranking.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="glens-similar-table">
                            <div class="glens-table-head glens-table-head--phenotype">
                                <button type="button" class="glens-sort-header" @click="setTableSort('phenotype', 'sampleId')">Sample {{ tableSortIndicator('phenotype', 'sampleId') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('phenotype', 'similarity')">Phenotype profile similarity (0-1) {{ tableSortIndicator('phenotype', 'similarity') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('phenotype', 'sharedCount')">Shared phenotype counts {{ tableSortIndicator('phenotype', 'sharedCount') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('phenotype', 'sharedGenes')">Shared genes {{ tableSortIndicator('phenotype', 'sharedGenes') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('phenotype', 'investigator')">Investigator {{ tableSortIndicator('phenotype', 'investigator') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('phenotype', 'sex')">Sex {{ tableSortIndicator('phenotype', 'sex') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('phenotype', 'age')">Age at enrollment {{ tableSortIndicator('phenotype', 'age') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('phenotype', 'notes')">Note {{ tableSortIndicator('phenotype', 'notes') }}</button>
                            </div>
                            <div
                                v-for="row in sortedPhenotypeMatches"
                                :key="row.sampleId"
                                class="glens-table-row glens-table-row--phenotype"
                            >
                                <a class="glens-table-link" :href="sampleHref(row.sampleId)">{{ row.sampleId }}</a>
                                <span class="glens-table-plain">{{ row.phenotypeProfileSimilarityLabel || row.similarityRank }}</span>
                                <span class="glens-shared-count-cell" @click.stop>
                                    <button
                                        class="glens-table-link glens-table-link-button"
                                        type="button"
                                        @click="toggleSharedPhenotypes(row.sampleId)"
                                    >
                                        {{ row.sharedPhenotypeCount }}
                                    </button>
                                    <div v-if="activeSharedPhenotypeSampleId === row.sampleId" class="glens-shared-hpo-popover">
                                        <button
                                            class="glens-section-info-close"
                                            type="button"
                                            aria-label="Close shared HPO terms"
                                            @click="activeSharedPhenotypeSampleId = null"
                                        >
                                            ×
                                        </button>
                                        <strong>Shared HPO terms: {{ row.sharedPhenotypeCount }}</strong>
                                        <ul>
                                            <li v-for="term in visibleSharedHpoTerms(row)" :key="term">{{ term }}</li>
                                            <li v-if="sharedHpoMoreCount(row) > 0">
                                                <button class="glens-inline-more-button" type="button" @click="toggleSharedHpoExpanded(row.sampleId)">
                                                    {{ isSharedHpoExpanded(row.sampleId) ? "Show less" : `+${sharedHpoMoreCount(row)} more` }}
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </span>
                                <span class="glens-shared-gene-cell" @click.stop>
                                    <a
                                        v-for="gene in visibleSharedGeneItems(row)"
                                        :key="`${row.sampleId}-${gene.gene}`"
                                        class="glens-table-link glens-gene-chip-link"
                                        :href="variantHref(gene.gene)"
                                    >
                                        {{ gene.gene }}
                                    </a>
                                    <button
                                        v-if="sharedGeneMoreCount(row) > 0"
                                        class="glens-inline-more-button"
                                        type="button"
                                        @click.prevent="toggleSharedGenes(row.sampleId)"
                                    >
                                        {{ activeSharedGeneSampleId === row.sampleId ? "Show less" : `+${sharedGeneMoreCount(row)} more` }}
                                    </button>
                                    <div v-if="activeSharedGeneSampleId === row.sampleId" class="glens-shared-gene-popover">
                                        <button
                                            class="glens-section-info-close"
                                            type="button"
                                            aria-label="Close shared genes"
                                            @click="activeSharedGeneSampleId = null"
                                        >
                                            ×
                                        </button>
                                        <strong>Shared genes</strong>
                                        <ul>
                                            <li v-for="gene in sharedGeneItems(row)" :key="gene.gene">
                                                <a class="glens-table-link" :href="variantHref(gene.gene)">{{ gene.gene }}</a>
                                            </li>
                                        </ul>
                                    </div>
                                </span>
                                <span>{{ row.investigator }}</span>
                                <span>{{ row.sex }}</span>
                                <span>{{ ageAtEnrollmentLabel(row) || formatAgeBand(row.ageBand) }}</span>
                                <span>{{ row.notes }}</span>
                            </div>
                        </div>

                    </section>

                    <section v-if="activeTab === 'genotype'" class="glens-tab-panel">
                        <div class="glens-section-head">
                            <div>
                                <p class="glens-eyebrow">Genotype similarity</p>
                                <div class="glens-title-with-info" @click.stop>
                                    <h2>Who shares a relevant genetic mechanism?</h2>
                                    <button
                                        class="glens-section-info-button"
                                        type="button"
                                        aria-label="Similar genotype explanation"
                                        @click="genotypeInfoOpen = !genotypeInfoOpen"
                                    >
                                        i
                                    </button>
                                    <div v-if="genotypeInfoOpen" class="glens-section-info-popover">
                                        <button
                                            class="glens-section-info-close"
                                            type="button"
                                            aria-label="Close similar genotype explanation"
                                            @click="genotypeInfoOpen = false"
                                        >
                                            ×
                                        </button>
                                        <p>
                                            This is genotype-first context for the same searched sample. Exact same variant, same gene, and same mechanism are separated because they imply different evidence strength and should not be interpreted as equivalent.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="glens-genotype-query-builder" aria-label="Searched sample variant query builder">
                            <div class="glens-genotype-builder-head">
                                <div>
                                    <span>Variant query builder for searched sample</span>
                                    <p>Choose one or more sample variants to find other samples sharing the selected genetic mechanism.</p>
                                </div>
                                <button class="glens-add-query-row" type="button" @click="addVariantQueryRow">+ Add query</button>
                            </div>
                            <div class="glens-genotype-query-row glens-genotype-query-row--head">
                                <span>Source</span>
                                <span>Gene</span>
                                <span>Variant</span>
                                <span>Consequence</span>
                                <span></span>
                            </div>
                            <div
                                v-for="row in variantQueryRows"
                                :key="row.id"
                                class="glens-genotype-query-row"
                            >
                                <span class="glens-query-source">
                                    {{ row.sourceLabel }}<span v-if="row.isGendx" aria-label="GenDx-confirmed variant">*</span>
                                </span>
                                <select
                                    :value="row.gene"
                                    @change="setVariantQueryGene(row.id, $event.target.value)"
                                >
                                    <option v-for="gene in sampleVariantGeneOptions" :key="gene" :value="gene">{{ gene }}</option>
                                </select>
                                <select
                                    :value="row.variantId"
                                    @change="setVariantQueryVariant(row.id, $event.target.value)"
                                >
                                    <option
                                        v-for="variant in variantOptionsForGene(row.gene)"
                                        :key="variant.variantId"
                                        :value="variant.variantId"
                                    >
                                        {{ variantQueryOptionLabel(variant) }}
                                    </option>
                                </select>
                                <select
                                    :value="row.consequence"
                                    @change="setVariantQueryConsequence(row.id, $event.target.value)"
                                >
                                    <option
                                        v-for="consequence in consequenceOptionsForGeneVariant(row.gene, row.variantId)"
                                        :key="consequence"
                                        :value="consequence"
                                    >
                                        {{ consequence }}
                                    </option>
                                </select>
                                <button
                                    class="glens-remove-query-row"
                                    type="button"
                                    :disabled="variantQueryRows.length === 1"
                                    @click="removeVariantQueryRow(row.id)"
                                >
                                    Remove
                                </button>
                            </div>
                            <p class="glens-genotype-builder-note">
                                GenDx-confirmed variants are placed first when available<span v-if="hasGenDxVariantQuery"> and marked with *</span>. Current genotype tables below use the selected variant/gene mechanisms as the mock search context.
                            </p>
                        </div>

                        <div class="glens-genotype-groups">
                            <article v-for="group in genotypeGroupsForDisplay" :key="group.label" class="glens-genotype-card">
                                <button class="glens-genotype-head" type="button" @click="toggleGenotypeGroup(group.label)">
                                    <span>{{ openGenotypeGroups[group.label] ? "▾" : "▸" }}</span>
                                    <strong>{{ group.label }}</strong>
                                    <small>{{ group.summary }}</small>
                                </button>
                                <div v-if="openGenotypeGroups[group.label]" class="glens-similar-table glens-similar-table--compact">
                                    <div
                                        class="glens-table-head glens-table-head--genotype"
                                        :class="{ 'glens-table-head--genotype-no-variant': !groupHasVariantEvidence(group) }"
                                    >
                                        <button type="button" class="glens-sort-header" @click="setGenotypeSort(group.label, 'sampleId')">
                                            Sample {{ genotypeSortIndicator(group.label, 'sampleId') }}
                                        </button>
                                        <button type="button" class="glens-sort-header" @click="setGenotypeSort(group.label, 'age')">
                                            Age at enrollment {{ genotypeSortIndicator(group.label, 'age') }}
                                        </button>
                                        <button type="button" class="glens-sort-header" @click="setGenotypeSort(group.label, 'sharedGene')">
                                            Shared gene {{ genotypeSortIndicator(group.label, 'sharedGene') }}
                                        </button>
                                        <span v-if="groupHasVariantEvidence(group)">Variant evidence</span>
                                        <button
                                            type="button"
                                            class="glens-sort-header"
                                            @click="setGenotypeSort(group.label, 'phenotypeOverlap')"
                                        >
                                            Phenotype overlap {{ genotypeSortIndicator(group.label, 'phenotypeOverlap') }}
                                        </button>
                                        <button
                                            type="button"
                                            class="glens-sort-header"
                                            @click="setGenotypeSort(group.label, 'profileSimilarity')"
                                        >
                                            Phenotype profile similarity (0-1) {{ genotypeSortIndicator(group.label, 'profileSimilarity') }}
                                        </button>
                                        <button type="button" class="glens-sort-header" @click="setGenotypeSort(group.label, 'keyPhenotypes')">
                                            Key HPO terms {{ genotypeSortIndicator(group.label, 'keyPhenotypes') }}
                                        </button>
                                    </div>
                                    <div
                                        v-for="row in sortedGenotypeRows(group)"
                                        :key="`${group.label}-${row.sampleId}-${row.sharedGene || 'none'}`"
                                        class="glens-table-row glens-table-row--genotype"
                                        :class="{ 'glens-table-row--genotype-no-variant': !groupHasVariantEvidence(group) }"
                                    >
                                        <a v-if="row.sampleId !== 'none'" class="glens-table-link" :href="sampleHref(row.sampleId)">{{ row.sampleId }}</a>
                                        <span v-else class="glens-table-plain">{{ row.sampleLabel }}</span>
                                        <span class="glens-table-plain">{{ genotypeAgeLabel(row) }}</span>
                                        <a v-if="row.sharedGene" class="glens-table-link" :href="variantHref(row.sharedGene)">{{ row.sharedGene }}</a>
                                        <span v-else class="glens-table-plain">-</span>
                                        <span v-if="groupHasVariantEvidence(group)" class="glens-genotype-variant-evidence">
                                            <a
                                                v-if="variantEvidenceLabel(row) !== '-'"
                                                class="glens-table-link"
                                                :href="variantHref(variantEvidenceLabel(row))"
                                            >
                                                {{ variantEvidenceLabel(row) }}
                                            </a>
                                            <span v-else>-</span>
                                        </span>
                                        <span class="glens-shared-count-cell" @click.stop>
                                            <button
                                                class="glens-table-link glens-table-link-button"
                                                type="button"
                                                @click="toggleGenotypeSharedHpo(group.label, row)"
                                            >
                                                {{ row.phenotypeOverlap }}
                                            </button>
                                            <div v-if="activeGenotypeHpoKey === genotypeSharedHpoKey(group.label, row)" class="glens-shared-hpo-popover">
                                                <button
                                                    class="glens-section-info-close"
                                                    type="button"
                                                    aria-label="Close genotype shared HPO terms"
                                                    @click="activeGenotypeHpoKey = null"
                                                >
                                                    ×
                                                </button>
                                                <strong>Shared HPO terms: {{ row.phenotypeOverlap }}</strong>
                                                <p class="glens-popover-note">{{ genotypeHpoPopoverNote(row) }}</p>
                                                <ul>
                                                    <li v-for="term in visibleGenotypeSharedHpoTerms(group.label, row)" :key="term">{{ term }}</li>
                                                    <li v-if="!genotypeSharedHpoTerms(row).length">No non-broad shared HPO terms in the current fixture.</li>
                                                    <li v-if="genotypeSharedHpoMoreCount(row) > 0">
                                                        <button class="glens-inline-more-button" type="button" @click="toggleGenotypeSharedHpoExpanded(group.label, row)">
                                                            {{ isGenotypeSharedHpoExpanded(group.label, row) ? "Show less" : `+${genotypeSharedHpoMoreCount(row)} more` }}
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </span>
                                        <span>{{ row.phenotypeProfileSimilarityLabel || "-" }}</span>
                                        <span>{{ row.keyPhenotypes }}</span>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>

                    <section v-if="activeTab === 'disease'" class="glens-tab-panel">
                        <div class="glens-section-head">
                            <div>
                                <p class="glens-eyebrow">Public disease profile matches</p>
                                <h2>Which public disease-HPO profiles resemble this sample?</h2>
                            </div>
                        </div>
                        <p class="glens-method-note">
                            Disease profile matches compare this sample's HPO profile against public disease phenotype annotations. They are reference matches for review, not final clinical conclusions.
                        </p>

                        <div class="glens-disease-table">
                            <div class="glens-table-head glens-table-head--disease">
                                <button type="button" class="glens-sort-header" @click="setTableSort('disease', 'name')">Disease profile {{ tableSortIndicator('disease', 'name') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('disease', 'source')">Source {{ tableSortIndicator('disease', 'source') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('disease', 'matched')">Matched HPO terms {{ tableSortIndicator('disease', 'matched') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('disease', 'total')">Total disease HPO terms {{ tableSortIndicator('disease', 'total') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('disease', 'overlap')">Overlap {{ tableSortIndicator('disease', 'overlap') }}</button>
                                <button type="button" class="glens-sort-header" @click="setTableSort('disease', 'notes')">Notes {{ tableSortIndicator('disease', 'notes') }}</button>
                            </div>
                            <div
                                v-for="disease in sortedDiseaseMatches"
                                :key="disease.name"
                                class="glens-table-row glens-table-row--disease"
                            >
                                <a
                                    class="glens-table-link"
                                    :href="diseaseReferenceHref(disease)"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {{ disease.name }}
                                </a>
                                <a
                                    class="glens-table-link glens-table-link--subtle"
                                    :href="diseaseReferenceHref(disease)"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {{ disease.source }}
                                </a>
                                <span class="glens-disease-overlap-cell" @click.stop>
                                    <button
                                        class="glens-table-link glens-table-link-button"
                                        type="button"
                                        @click="toggleDiseaseMatchTerms(disease.name, 'matched')"
                                    >
                                        {{ disease.matchedHpoCount }}
                                    </button>
                                    <div v-if="activeDiseaseMatchName === `${disease.name}:matched`" class="glens-disease-hpo-popover">
                                        <button
                                            class="glens-section-info-close"
                                            type="button"
                                            aria-label="Close matched HPO terms"
                                            @click="activeDiseaseMatchName = null"
                                        >
                                            ×
                                        </button>
                                        <strong>{{ disease.name }} matched HPO terms</strong>
                                        <ul>
                                            <li v-for="term in disease.matchedHpoTerms" :key="term">{{ term }}</li>
                                        </ul>
                                    </div>
                                </span>
                                <span>{{ disease.totalDiseaseHpoTerms }}</span>
                                <span class="glens-disease-overlap-cell" @click.stop>
                                    <button
                                        class="glens-table-link glens-table-link-button"
                                        type="button"
                                        @click="toggleDiseaseMatchTerms(disease.name, 'overlap')"
                                    >
                                        {{ disease.overlap }}
                                    </button>
                                    <div v-if="activeDiseaseMatchName === `${disease.name}:overlap`" class="glens-disease-hpo-popover">
                                        <button
                                            class="glens-section-info-close"
                                            type="button"
                                            aria-label="Close matched HPO terms"
                                            @click="activeDiseaseMatchName = null"
                                        >
                                            ×
                                        </button>
                                        <strong>{{ disease.name }} matched HPO terms</strong>
                                        <ul>
                                            <li v-for="term in disease.matchedHpoTerms" :key="term">{{ term }}</li>
                                        </ul>
                                    </div>
                                </span>
                                <span>{{ disease.notes }}</span>
                            </div>
                        </div>
                    </section>

                    <section v-if="activeTab === 'genes'" class="glens-tab-panel">
                        <div class="glens-section-head">
                            <div>
                                <p class="glens-eyebrow">Candidate genetic explanations</p>
                                <h2>Which gene or variant best explains the sample?</h2>
                            </div>
                        </div>
                        <p class="glens-method-note">
                            Genes are prioritized when rare sample variants align with phenotype evidence, known disease links, internal same-gene carriers, and GenDx support.
                        </p>

                        <div class="glens-gene-list">
                            <article v-for="gene in candidateGenesForDisplay" :key="gene.gene" class="glens-gene-card">
                                <button class="glens-gene-summary" type="button" @click="toggleGene(gene.gene)">
                                    <span>{{ expandedGenes[gene.gene] ? "▾" : "▸" }}</span>
                                    <strong>{{ gene.gene }}</strong>
                                    <em>{{ gene.priorityReason }}</em>
                                </button>
                                <div class="glens-gene-checklist">
                                    <div class="glens-gene-check-row">
                                        <span>Gene</span>
                                        <a class="glens-table-link" :href="variantHref(gene.gene)">{{ gene.gene }}</a>
                                    </div>
                                    <div class="glens-gene-check-row">
                                        <span>Best variant</span>
                                        <strong>{{ gene.bestVariant }}</strong>
                                    </div>
                                    <div class="glens-gene-check-row">
                                        <span>Disease link</span>
                                        <a
                                            class="glens-table-link"
                                            :href="diseaseReferenceHref(gene.diseaseLink)"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {{ gene.diseaseLink }}
                                        </a>
                                    </div>
                                    <div class="glens-gene-check-row glens-gene-check-row--popover" @click.stop>
                                        <span>Phenotype fit</span>
                                        <button
                                            class="glens-table-link glens-table-link-button"
                                            type="button"
                                            @click="toggleGenePhenotypeFit(gene.gene)"
                                        >
                                            {{ gene.phenotypeFit }}
                                        </button>
                                        <div v-if="activeGenePhenotypeFit === gene.gene" class="glens-gene-hpo-popover">
                                            <button
                                                class="glens-section-info-close"
                                                type="button"
                                                aria-label="Close phenotype fit terms"
                                                @click="activeGenePhenotypeFit = null"
                                            >
                                                ×
                                            </button>
                                            <strong>Phenotype fit: {{ gene.phenotypeFit }}</strong>
                                            <p>Matched HPO terms:</p>
                                            <ul>
                                                <li v-for="term in gene.phenotypeFitTerms" :key="term">{{ term }}</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div class="glens-gene-check-row">
                                        <span>Internal support</span>
                                        <strong>{{ gene.internalSupport }}</strong>
                                    </div>
                                    <div class="glens-gene-check-row">
                                        <span>GenDx</span>
                                        <strong>{{ gene.gendxDisplay }}</strong>
                                    </div>
                                    <div class="glens-gene-check-row">
                                        <span>Priority reason</span>
                                        <strong>{{ gene.priorityReason }}</strong>
                                    </div>
                                </div>
                                <div class="glens-additional-annotation">
                                    <div class="glens-additional-annotation-head">
                                        <span>Additional annotation</span>
                                        <small>Secondary references only</small>
                                    </div>
                                    <div
                                        v-for="annotation in gene.additionalAnnotations"
                                        :key="`${gene.gene}-${annotation.source}-${annotation.value}`"
                                        class="glens-additional-annotation-row"
                                    >
                                        <span>{{ annotation.source }}</span>
                                        <strong>{{ annotation.value }}</strong>
                                        <button
                                            v-if="annotation.info"
                                            class="glens-annotation-info"
                                            type="button"
                                            aria-label="PanelApp Green annotation explanation"
                                        >
                                            i
                                            <span class="glens-annotation-info-popover">{{ annotation.info }}</span>
                                        </button>
                                    </div>
                                    <p v-if="!gene.additionalAnnotations.length">
                                        No PanelApp, Reactome, WikiPathways, MONDO, or DECIPHER secondary annotation in the current display fixture.
                                    </p>
                                </div>

                                <div v-if="expandedGenes[gene.gene]" class="glens-variant-table">
                                    <div class="glens-table-head glens-table-head--variant">
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'variantId')">Variant {{ variantSortIndicator(gene.gene, 'variantId') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'consequence')">Consequence {{ variantSortIndicator(gene.gene, 'consequence') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'transcript')">Transcript {{ variantSortIndicator(gene.gene, 'transcript') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'gnomad')">gnomAD AF {{ variantSortIndicator(gene.gene, 'gnomad') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'dp')">DP {{ variantSortIndicator(gene.gene, 'dp') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'revel')">REVEL {{ variantSortIndicator(gene.gene, 'revel') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'alphaMissense')">AlphaMissense {{ variantSortIndicator(gene.gene, 'alphaMissense') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'lof')">LoF {{ variantSortIndicator(gene.gene, 'lof') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'clinvar')">ClinVar {{ variantSortIndicator(gene.gene, 'clinvar') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'tier')">Tier {{ variantSortIndicator(gene.gene, 'tier') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'carriers')">Carriers {{ variantSortIndicator(gene.gene, 'carriers') }}</button>
                                        <button type="button" class="glens-sort-header" @click="setVariantSort(gene.gene, 'consistency')">Phenotype consistency {{ variantSortIndicator(gene.gene, 'consistency') }}</button>
                                    </div>
                                    <div
                                        v-for="variant in sortedGeneVariants(gene)"
                                        :key="variant.variantId"
                                        class="glens-table-row glens-table-row--variant"
                                    >
                                        <a class="glens-table-link" :href="variantHref(variant.variantId)">{{ variant.variantId }}</a>
                                        <span>{{ variant.consequence }}</span>
                                        <span>{{ variant.transcript }}</span>
                                        <span>{{ variant.gnomad }}</span>
                                        <span>{{ variant.dp }}</span>
                                        <span>{{ variant.revel }}</span>
                                        <span>{{ variant.alphaMissense }}</span>
                                        <span>{{ variant.lof }}</span>
                                        <a
                                            v-if="variant.clinvar && variant.clinvar !== '-'"
                                            class="glens-table-link"
                                            :href="clinVarHref(variant.variantId)"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {{ variant.clinvar }}
                                        </a>
                                        <span v-else>{{ variant.clinvar }}</span>
                                        <span>{{ variant.tier }}</span>
                                        <span>{{ variant.carriers }}</span>
                                        <span>{{ variant.consistency }}</span>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>

                </section>
            </main>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import ClinicalFocusBar from "../KrClinicalFocus/ClinicalFocusBar.vue";
import { onClinicalFocusChange, readClinicalFocus } from "../KrClinicalFocus/focusStore";
import { createKrSampleState } from "./mockData";
import { sampleComputed, sampleMethods } from "./pageModel";
import "./style.css";

export default {
    name: "KrSampleTemplate",
    components: {
        ClinicalFocusBar,
    },
    data() {
        return {
            ...createKrSampleState(),
            clinicalFocus: readClinicalFocus(),
            contextPopoverOpen: false,
            contextInfoOpen: false,
            optionsPopoverOpen: false,
            sampleInfoOpen: false,
            gendxInfoOpen: false,
            overviewInfoOpen: false,
            activeMetricInfoLabel: null,
            activeOverviewCardTab: "summary",
            phenotypeInfoOpen: false,
            genotypeInfoOpen: false,
            activeSharedPhenotypeSampleId: null,
            activeSharedGeneSampleId: null,
            activeDiseaseMatchName: null,
            activeGenePhenotypeFit: null,
            activeGenotypeHpoKey: null,
            expandedSharedHpoSampleIds: {},
            expandedGenotypeHpoKeys: {},
            expandedDomainTerms: {},
            variantQueryRows: [],
            variantQueryNextId: 1,
            tableSorts: {
                phenotype: { key: "similarity", direction: "desc" },
                disease: { key: "matched", direction: "desc" },
            },
            variantSorts: {},
            genotypeSorts: {
                "Same variant": { key: "profileSimilarity", direction: "desc" },
                "Same gene": { key: "profileSimilarity", direction: "desc" },
            },
            unsubscribeClinicalFocus: null,
        };
    },
    computed: sampleComputed,
    mounted() {
        this.unsubscribeClinicalFocus = onClinicalFocusChange((focus) => {
            this.clinicalFocus = focus;
        });
        this.initializeVariantQueryRows();
        document.addEventListener("click", this.closeToolPopovers);
    },
    beforeDestroy() {
        if (this.unsubscribeClinicalFocus) this.unsubscribeClinicalFocus();
        document.removeEventListener("click", this.closeToolPopovers);
    },
    methods: sampleMethods,
};
</script>
