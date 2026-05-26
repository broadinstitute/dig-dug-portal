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
                            <span>{{ sample.sex }} | Age {{ displayAgeGroup }} | GenDx: {{ sample.gendx.shortStatus }}</span>
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
                                    <div v-for="position in sample.positionMetrics" :key="position.label" class="glens-position-row">
                                        <button type="button" class="glens-position-summary" @click="toggleMetric(position.label)">
                                            <i>{{ openMetrics[position.label] ? "▾" : "▸" }}</i>
                                            <strong>{{ position.label }}</strong>
                                            <span>{{ position.value }}</span>
                                        </button>
                                        <p v-if="openMetrics[position.label]" class="glens-position-explain">{{ position.text }}</p>
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
                                    <p v-if="affinityMethodOpen" class="glens-source-note">
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
                                    <h2>Who looks most like this sample?</h2>
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
                                            The searched sample is not compared to itself here. Rows show other CRDC samples ranked by raw weighted phenotype similarity: query-term overlap, rare phenotype weight, and semantic/related-term consistency. Residual is not used for this nearest-patient ranking.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="glens-similar-table">
                            <div class="glens-table-head glens-table-head--phenotype">
                                <span>Sample</span>
                                <span>Similarity rank</span>
                                <span>Shared phenotype counts</span>
                                <span>Shared genes</span>
                                <span>Investigator</span>
                                <span>Sex</span>
                                <span>Age band</span>
                                <span>Note</span>
                            </div>
                            <div
                                v-for="row in sample.phenotypeMatches"
                                :key="row.sampleId"
                                class="glens-table-row glens-table-row--phenotype"
                            >
                                <a class="glens-table-link" :href="sampleHref(row.sampleId)">{{ row.sampleId }}</a>
                                <span class="glens-table-plain">{{ row.similarityRank }}</span>
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
                                    <a class="glens-table-link" :href="variantHref(row.topSignalVariantId)">{{ sharedGenesLabel(row) }}</a>
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
                                            <li v-for="gene in row.sharedGenes" :key="gene">{{ gene }}</li>
                                        </ul>
                                    </div>
                                </span>
                                <span>{{ row.investigator }}</span>
                                <span>{{ row.sex }}</span>
                                <span>{{ formatAgeBand(row.ageBand) }}</span>
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

                        <div class="glens-genotype-query-variant" aria-label="Searched sample reference variant">
                            <span>Reference variant for searched sample</span>
                            <a class="glens-table-link" :href="variantHref(sample.gendx.variantId)">{{ sample.gendx.variantId }}</a>
                            <strong>{{ sample.gendx.gene }}</strong>
                            <em>{{ sample.gendx.consequence }} · {{ sample.gendx.pathogenicity }}</em>
                        </div>

                        <div class="glens-genotype-groups">
                            <article v-for="group in sample.genotypeGroups" :key="group.label" class="glens-genotype-card">
                                <button class="glens-genotype-head" type="button" @click="toggleGenotypeGroup(group.label)">
                                    <span>{{ openGenotypeGroups[group.label] ? "▾" : "▸" }}</span>
                                    <strong>{{ group.label }}</strong>
                                    <small>{{ group.summary }}</small>
                                </button>
                                <div v-if="openGenotypeGroups[group.label]" class="glens-similar-table glens-similar-table--compact">
                                    <div class="glens-table-head glens-table-head--genotype">
                                        <span>Sample</span>
                                        <span>Genetic similarity</span>
                                        <span>Shared gene</span>
                                        <span>Variant evidence</span>
                                        <span>Phenotype overlap</span>
                                        <span>Key HPO terms</span>
                                    </div>
                                    <div
                                        v-for="row in group.rows"
                                        :key="row.sampleId"
                                        class="glens-table-row glens-table-row--genotype"
                                    >
                                        <a v-if="row.sampleId !== 'none'" class="glens-table-link" :href="sampleHref(row.sampleId)">{{ row.sampleId }}</a>
                                        <span v-else class="glens-table-plain">{{ row.sampleLabel }}</span>
                                        <span class="glens-table-plain">{{ row.similarity }}</span>
                                        <a v-if="row.sharedGene" class="glens-table-link" :href="variantHref(row.sharedGene)">{{ row.sharedGene }}</a>
                                        <span v-else class="glens-table-plain">-</span>
                                        <span class="glens-genotype-variant-evidence">
                                            <span>{{ row.queryVariantEvidence }}</span>
                                            <span>{{ row.matchedVariantEvidence }}</span>
                                        </span>
                                        <span>{{ row.phenotypeOverlap }}</span>
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
                                <span>Disease profile</span>
                                <span>Source</span>
                                <span>Matched HPO terms</span>
                                <span>Total disease HPO terms</span>
                                <span>Overlap</span>
                                <span>Notes</span>
                            </div>
                            <div
                                v-for="disease in sample.diseaseMatches"
                                :key="disease.name"
                                class="glens-table-row glens-table-row--disease"
                            >
                                <strong>{{ disease.name }}</strong>
                                <span>{{ disease.source }}</span>
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
                            <article v-for="gene in sample.candidateGenes" :key="gene.gene" class="glens-gene-card">
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
                                        <a class="glens-table-link" :href="diseaseProfileHref(gene.diseaseLink)">{{ gene.diseaseLink }}</a>
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
                                        <strong>{{ gene.gendxSupport }}</strong>
                                    </div>
                                    <div class="glens-gene-check-row">
                                        <span>Priority reason</span>
                                        <strong>{{ gene.priorityReason }}</strong>
                                    </div>
                                </div>

                                <div v-if="expandedGenes[gene.gene]" class="glens-variant-table">
                                    <div class="glens-table-head glens-table-head--variant">
                                        <span>Variant</span>
                                        <span>Consequence</span>
                                        <span>Transcript</span>
                                        <span>gnomAD AF</span>
                                        <span>DP</span>
                                        <span>REVEL</span>
                                        <span>AlphaMissense</span>
                                        <span>LoF</span>
                                        <span>ClinVar</span>
                                        <span>Tier</span>
                                        <span>Carriers</span>
                                        <span>Phenotype consistency</span>
                                    </div>
                                    <div
                                        v-for="variant in gene.variants"
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
                                        <span>{{ variant.clinvar }}</span>
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
import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { clearClinicalFocus, onClinicalFocusChange, readClinicalFocus } from "../KrClinicalFocus/focusStore";
import { createKrSampleState } from "./mockData";
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
            activeOverviewCardTab: "summary",
            phenotypeInfoOpen: false,
            genotypeInfoOpen: false,
            activeSharedPhenotypeSampleId: null,
            activeSharedGeneSampleId: null,
            activeDiseaseMatchName: null,
            activeGenePhenotypeFit: null,
            expandedSharedHpoSampleIds: {},
            expandedDomainTerms: {},
            unsubscribeClinicalFocus: null,
        };
    },
    computed: {
        tabs() {
            return [
                { id: "overview", label: "Overview" },
                { id: "phenotype", label: "Similar samples" },
                { id: "genotype", label: "Similar by genotype" },
                { id: "disease", label: "Disease profile matches" },
                { id: "genes", label: "Gene / variant evidence" },
            ];
        },
        overviewCardTabs() {
            return [
                { id: "summary", label: "Sample overview" },
                { id: "phenotype", label: "Phenotype profile" },
            ];
        },
        allInvestigatorOptions() {
            return [...this.sample.groupAffinityTop, ...this.sample.groupAffinityOther];
        },
        selectedInvestigatorAffinity() {
            return this.allInvestigatorOptions.find((group) => group.label === this.selectedInvestigatorGroup);
        },
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        compactContextLabel() {
            if (!this.hasActiveContext) return "";
            const contextId = this.clinicalFocus.orphaId || this.clinicalFocus.sourceId || "";
            return [this.clinicalFocus.label, contextId].filter(Boolean).join(" · ");
        },
        topAnswers() {
            const metricByLabel = (needle) => this.sample.positionMetrics.find((metric) => metric.label.toLowerCase().includes(needle));
            const closest = metricByLabel("closest");
            const group = metricByLabel("investigator");
            const disease = metricByLabel("disease profile");
            return [
                {
                    label: "Closest phenotype match",
                    value: closest ? closest.value : "-",
                },
                {
                    label: "Group affinity",
                    value: group ? group.value : "-",
                },
                {
                    label: "Disease profile reference",
                    value: disease ? disease.value : "-",
                },
            ];
        },
        overviewItems() {
            return [
                { label: "Proband", value: this.sample.probandStatus },
                { label: "Affected", value: this.sample.affectedStatus },
                { label: "Sex", value: this.sample.sex },
                { label: "Age group", value: this.displayAgeGroup },
                { label: "Investigator", value: this.sample.investigator },
                { label: "Total HPO term count", value: this.sample.overviewHpoTermCount },
                { label: "Dominant HPO group", value: this.sample.overviewDominantHpoGroup },
                { label: "Rare coding variant carrier genes", value: this.sample.rareCodingGenes },
            ];
        },
        contextComparisonItems() {
            return [
                { label: "Context HPO term count", value: this.sample.contextComparison.hpoTermCount },
                { label: "Context dominant HPO group", value: this.sample.contextComparison.dominantHpoGroup },
                { label: "Sample-context HPO overlap", value: this.sample.contextComparison.overlap },
                { label: "Dominant overlap group", value: this.sample.contextComparison.dominantOverlapGroup },
            ];
        },
        gendxPanelTitle() {
            return "GenDx panel";
        },
        gendxRows() {
            return [
                { label: "Status", value: this.sample.gendx.status },
                { label: "Gene", value: this.sample.gendx.gene },
                { label: "Variant", value: this.sample.gendx.variantId, href: this.variantHref(this.sample.gendx.variantId) },
                { label: "Pathogenicity", value: this.sample.gendx.pathogenicity },
            ];
        },
        phenotypeQueryHref() {
            return `/krPhenotype.html?query=${encodeURIComponent(this.sample.fullHpoTerms.join(", "))}`;
        },
        displaySampleId() {
            const params = new URLSearchParams(window.location.search);
            const requestedSampleId = params.get("sample_id") || params.get("query");
            if (!requestedSampleId || requestedSampleId === "CRDC-2031") {
                return this.sample.sampleId;
            }
            return requestedSampleId;
        },
        displayAgeGroup() {
            return this.formatAgeBand(this.sample.ageGroup || this.sample.ageBand || this.sample.age || "Unknown / not available");
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
            this.contextInfoOpen = false;
            this.contextPopoverOpen = false;
            this.optionsPopoverOpen = false;
            this.sampleInfoOpen = false;
            this.gendxInfoOpen = false;
            this.overviewInfoOpen = false;
            this.phenotypeInfoOpen = false;
            this.genotypeInfoOpen = false;
            this.activeSharedPhenotypeSampleId = null;
            this.activeSharedGeneSampleId = null;
            this.activeDiseaseMatchName = null;
            this.activeGenePhenotypeFit = null;
        },
        removeClinicalContext() {
            clearClinicalFocus();
            this.contextPopoverOpen = false;
        },
        sampleHref(sampleId) {
            return `/krSample.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        variantHref(variantId) {
            return `/krVariant.html?query=${encodeURIComponent(variantId)}`;
        },
        phenotypeMatchHref(row) {
            return `/krPhenotype.html?query=${encodeURIComponent(row.sharedHpoTerms.join(", "))}`;
        },
        diseaseProfileHref(diseaseName) {
            return `/krSample.html?sample_id=${encodeURIComponent(this.displaySampleId)}&view=disease&profile=${encodeURIComponent(diseaseName)}`;
        },
        toggleSharedPhenotypes(sampleId) {
            this.activeSharedPhenotypeSampleId = this.activeSharedPhenotypeSampleId === sampleId ? null : sampleId;
        },
        visibleSharedHpoTerms(row) {
            return this.isSharedHpoExpanded(row.sampleId) ? row.sharedHpoTerms : row.sharedHpoTerms.slice(0, 5);
        },
        sharedHpoMoreCount(row) {
            return Math.max(row.sharedHpoTerms.length - 5, 0);
        },
        isSharedHpoExpanded(sampleId) {
            return Boolean(this.expandedSharedHpoSampleIds[sampleId]);
        },
        toggleSharedHpoExpanded(sampleId) {
            this.$set(this.expandedSharedHpoSampleIds, sampleId, !this.expandedSharedHpoSampleIds[sampleId]);
        },
        sharedGenesLabel(row) {
            const genes = row.sharedGenes || [row.gene];
            if (genes.length === 1) return genes[0];
            if (genes.length <= 3) return `${genes.length} genes: ${genes.join(", ")}`;
            return `${genes.length} genes: ${genes.slice(0, 3).join(", ")} +${genes.length - 3} more`;
        },
        sharedGeneMoreCount(row) {
            const genes = row.sharedGenes || [row.gene];
            return Math.max(genes.length - 3, 0);
        },
        toggleSharedGenes(sampleId) {
            this.activeSharedGeneSampleId = this.activeSharedGeneSampleId === sampleId ? null : sampleId;
        },
        toggleDiseaseMatchTerms(diseaseName, anchor) {
            const key = `${diseaseName}:${anchor}`;
            this.activeDiseaseMatchName = this.activeDiseaseMatchName === key ? null : key;
        },
        toggleGenePhenotypeFit(gene) {
            this.activeGenePhenotypeFit = this.activeGenePhenotypeFit === gene ? null : gene;
        },
        formatAgeBand(ageBand) {
            return String(ageBand || "").replace("-", "–");
        },
        hpoTermName(term) {
            return String(term).replace(/\s*\[[^\]]+\]\s*$/, "");
        },
        hpoTermId(term) {
            const match = String(term).match(/\[([^\]]+)\]$/);
            return match ? match[1] : "";
        },
        domainFillPercent(domain) {
            const ratio = this.sample.hpoTotal ? (domain.count / this.sample.hpoTotal) * 100 : 0;
            return `${Math.max(0, Math.min(100, ratio))}%`;
        },
        isDomainExpanded(domainName) {
            return Boolean(this.expandedDomainTerms[domainName]);
        },
        visibleDomainTerms(domain) {
            const terms = domain.representativeTerms || [];
            return this.isDomainExpanded(domain.name) ? terms : terms.slice(0, 2);
        },
        domainMoreCount(domain) {
            const terms = domain.representativeTerms || [];
            return Math.max(terms.length - 2, 0);
        },
        toggleDomainTerms(domainName) {
            this.$set(this.expandedDomainTerms, domainName, !this.expandedDomainTerms[domainName]);
        },
        togglePanel(panel) {
            this.$set(this.openPanels, panel, !this.openPanels[panel]);
        },
        toggleMetric(metric) {
            this.$set(this.openMetrics, metric, !this.openMetrics[metric]);
        },
        toggleGene(gene) {
            this.$set(this.expandedGenes, gene, !this.expandedGenes[gene]);
        },
        toggleGenotypeGroup(group) {
            this.$set(this.openGenotypeGroups, group, !this.openGenotypeGroups[group]);
        },
        toggleDisease(disease) {
            this.$set(this.openDiseases, disease, !this.openDiseases[disease]);
        },
    },
};
</script>
