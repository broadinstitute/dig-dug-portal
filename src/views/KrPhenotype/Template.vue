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
                        <p class="glens-eyebrow">Phenotype-first clinical matching</p>
                        <div class="glens-searching-line">
                            <span>We are searching with</span>
                            <a
                                v-for="term in phenotype.queryTerms.exact"
                                :key="`search-${term.id}`"
                                :href="phenotypeTermHref(term)"
                                class="glens-search-term-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {{ term.label }} [{{ term.id }}]
                            </a>
                        </div>
                        <div class="glens-query-label">Original user-entered phenotype terms</div>
                        <div class="glens-query-chips">
                            <a
                                v-for="term in phenotype.queryTerms.exact"
                                :key="term.id"
                                :href="phenotypeTermHref(term)"
                                class="glens-query-chip glens-query-chip--exact"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {{ term.label }} [{{ term.id }}]
                            </a>
                        </div>
                        <div class="glens-query-label glens-query-label--mt">
                            Related phenotype candidates used for semantic similarity
                        </div>
                        <div class="glens-query-chips">
                            <a
                                v-for="term in phenotype.queryTerms.expanded"
                                :key="term.id"
                                :href="phenotypeTermHref(term)"
                                class="glens-query-chip glens-query-chip--expanded"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {{ term.label }} [{{ term.id }}]
                            </a>
                        </div>
                    </div>
                    <div class="glens-hero-results">
                        <div class="glens-answer-grid">
                            <div
                                v-for="item in phenotype.headline"
                                :key="item.label"
                                class="glens-answer-card"
                            >
                                <span>{{ item.label }}</span>
                                <strong>{{ item.value }}</strong>
                                <small>{{ item.detail }}</small>
                            </div>
                        </div>
                        <div class="glens-hero-cohort">
                            <div>
                                <strong>132 similar samples</strong>
                                <span>14.6% of CRDC cohort · 68% proband · 77 female / 55 male</span>
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

                <section class="glens-evidence-grid">
                    <section class="glens-card glens-card--core">
                        <div class="glens-section-head">
                            <div>
                                <p class="glens-section-label">Phenotype-based patient retrieval</p>
                                <h2>Which samples best reproduce this phenotype profile?</h2>
                            </div>
                        </div>
                        <div class="glens-tab-row glens-tab-row--evidence">
                            <button
                                type="button"
                                :class="{ 'glens-tab-button--active': activeEvidenceTab === 'individual' }"
                                @click="activeEvidenceTab = 'individual'"
                            >
                                Similar samples
                            </button>
                            <button
                                type="button"
                                :class="{ 'glens-tab-button--active': activeEvidenceTab === 'group' }"
                                @click="activeEvidenceTab = 'group'"
                            >
                                Investigator context
                            </button>
                        </div>

                        <div v-if="activeEvidenceTab === 'individual'" class="glens-core-grid mt-space">
                            <div class="glens-selected-sample">
                                <p class="glens-small-heading">Closest phenotype-matched sample</p>
                                <button class="glens-sample-id-link" type="button" @click="selectSample(selectedSampleData.id)">
                                    {{ selectedSampleData.id }}
                                </button>
                                <div class="glens-score-kv">
                                    <span>Investigator group</span><strong>{{ selectedSampleData.investigator }}</strong>
                                    <span>Sex / age</span><strong>{{ selectedSampleData.sexAge }}</strong>
                                    <span>GenDX diagnosed</span>
                                    <button class="glens-diagnosis-button" type="button" @click="diagnosisOpen = !diagnosisOpen">
                                        {{ selectedSampleData.diagnosed }} · show variant
                                    </button>
                                    <div v-if="diagnosisOpen" class="glens-diagnosis-panel glens-score-kv-wide">
                                        <span>Diagnosed variant</span>
                                        <a :href="variantHref(selectedSampleData.diagnosedVariant)">
                                            {{ selectedSampleData.diagnosedVariant }}
                                        </a>
                                    </div>
                                    <span>Weighted phenotype similarity</span><strong>{{ selectedSampleData.rawScore }}</strong>
                                    <span>Expected for n_terms</span><strong>{{ selectedSampleData.expectedScore }}</strong>
                                    <span>Burden-corrected residual</span><strong>{{ selectedSampleData.residual }}</strong>
                                    <span>Residual percentile</span><strong>{{ selectedSampleData.percentile }}</strong>
                                    <span>Equal or higher residual</span><strong>{{ selectedSampleData.equalOrHigher }}</strong>
                                </div>
                            </div>

                            <div class="glens-residual-panel">
                                <div class="glens-panel-title">
                                    <span>Annotation-burden QC</span>
                                    <small>Raw similarity ranks similar patients; this plot checks whether annotation count is inflating the match.</small>
                                </div>
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
                                        :key="point.id"
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
                                <div class="glens-plot-controls glens-plot-controls--below">
                                    <button
                                        type="button"
                                        :class="{ 'glens-plot-control--active': scatterMode === 'all' }"
                                        @click="scatterMode = 'all'"
                                    >
                                        All cohort scatter
                                    </button>
                                    <button
                                        type="button"
                                        :class="{ 'glens-plot-control--active': openPanels.samples }"
                                        @click="togglePanel('samples')"
                                    >
                                        {{ openPanels.samples ? "Hide" : "Show" }} top matched samples
                                    </button>
                                </div>
                                <div class="glens-sample-accordion">
                                    <div v-if="openPanels.samples" class="glens-sample-table">
                                        <div class="glens-sample-head">
                                            <span>Rank</span>
                                            <span>Sample</span>
                                            <span>Group</span>
                                            <span>Matched query terms</span>
                                            <span>Total HPO terms</span>
                                            <span>Weighted similarity</span>
                                            <span>Residual QC</span>
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
                                            <span>{{ sample.group }}</span>
                                            <span>{{ sample.matchedTerms }}</span>
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
                                </div>
                            </div>
                        </div>
                        <div v-else class="glens-group-tab-panel">
                            <p class="glens-source-note">
                                Each investigator group is treated as a phenotype signature. Orange dot = selected patient. Blue line = group median. Box = middle 50% of annotation-burden-corrected scores.
                            </p>
                            <div class="glens-group-qc-layout">
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
                                        <div v-if="activeResidualGroup === group.name" class="glens-outlier-panel">
                                            <div class="glens-outlier-head">
                                                <strong>{{ group.name }}</strong>
                                                <span>group median corrected score {{ group.medianValue }} · selected sample corrected score {{ selectedSampleData.residual }}</span>
                                            </div>
                                            <p class="glens-outlier-threshold">
                                                Rows show high-scoring samples for this investigator phenotype signature. This is group-context evidence, not the main nearest-patient ranking.
                                            </p>
                                            <div
                                                v-for="sample in group.outliers"
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
                                </div>
                                <div class="glens-residual-panel glens-residual-panel--group">
                                    <div class="glens-panel-title">
                                        <span>Annotation-burden QC</span>
                                        <small>Group-average corrected scores by phenotype signature.</small>
                                    </div>
                                    <div class="glens-score-plot glens-score-plot--group-average">
                                        <span class="glens-axis-y glens-axis-y--top">Y-axis: group-average corrected score</span>
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
                                            :title="group.name + ' · median corrected score ' + group.medianValue"
                                            @click="activeResidualGroup = group.name"
                                        ></button>
                                        <div class="glens-selected-label glens-selected-label--group" :style="groupLabelStyle">
                                            {{ activeResidualGroupData.name }}<br>
                                            median {{ activeResidualGroupData.medianValue }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </section>

                <section class="glens-insight-tabs-card">
                    <div class="glens-insight-nav">
                        <div>
                            <p class="glens-small-heading">Phenotype-based evidence</p>
                            <div class="glens-tab-row glens-tab-row--insights">
                                <button
                                    type="button"
                                    :class="{ 'glens-tab-button--active': activeInsightTab === 'phenotypes' }"
                                    @click="activeInsightTab = 'phenotypes'"
                                >
                                    Co-observed phenotypes
                                </button>
                                <button
                                    type="button"
                                    :class="{ 'glens-tab-button--active': activeInsightTab === 'termScore' }"
                                    @click="activeInsightTab = 'termScore'"
                                >
                                    Phenotype score terms
                                </button>
                                <button
                                    type="button"
                                    :class="{ 'glens-tab-button--active': activeInsightTab === 'disease' }"
                                    @click="activeInsightTab = 'disease'"
                                >
                                    Disease context
                                </button>
                            </div>
                        </div>
                        <div class="glens-supporting-evidence">
                            <p class="glens-small-heading">Supporting molecular evidence</p>
                            <div class="glens-tab-row glens-tab-row--insights">
                                <button
                                    type="button"
                                    class="glens-tab-button--molecular"
                                    :class="{ 'glens-tab-button--active': activeInsightTab === 'molecular' }"
                                    @click="activeInsightTab = 'molecular'"
                                >
                                    Candidate genes / variants
                                </button>
                            </div>
                        </div>
                    </div>

                    <section v-if="activeInsightTab === 'phenotypes'" class="glens-step-card glens-step-card--tabbed">
                        <button class="glens-step-summary" type="button" @click="togglePanel('phenotypes')">
                            <div>
                                <strong>Co-observed phenotype structure</strong>
                                <small>What did similar samples share that the user did not necessarily enter?</small>
                            </div>
                            <b class="glens-disclosure">{{ openPanels.phenotypes ? "▾" : "▸" }}</b>
                        </button>
                        <div v-if="openPanels.phenotypes" class="glens-step-body">
                        <div class="glens-phenotype-rows">
                            <div
                                v-for="row in phenotype.coObserved"
                                :key="row.label"
                                class="glens-expand-row"
                                :class="{ 'glens-expand-row--open': activePhenotype === row.label }"
                            >
                                <button class="glens-expand-summary" type="button" @click="togglePhenotype(row.label)">
                                    <div>
                                        <strong>{{ row.label }}</strong>
                                        <span>{{ row.cluster }}</span>
                                    </div>
                                    <div class="glens-expand-metric">
                                        <span>{{ row.count }} · {{ row.score }}</span>
                                        <div class="glens-bar-shell">
                                            <div class="glens-bar-fill" :style="{ width: row.width }"></div>
                                        </div>
                                    </div>
                                    <b class="glens-disclosure">{{ activePhenotype === row.label ? "▾" : "▸" }}</b>
                                </button>
                                <div v-if="activePhenotype === row.label" class="glens-expand-panel">
                                    <div>
                                        <p class="glens-small-heading">Associated genes</p>
                                        <span v-for="gene in row.relatedGenes" :key="gene" class="glens-mini-tag">{{ gene }}</span>
                                    </div>
                                    <div>
                                        <p class="glens-small-heading">Representative samples</p>
                                        <span v-for="sample in row.samples" :key="sample" class="glens-text-pill">{{ sample }}</span>
                                    </div>
                                    <div>
                                        <p class="glens-small-heading">Disease mapping</p>
                                        <span v-for="disease in row.orpha" :key="disease" class="glens-text-pill">{{ disease }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </section>

                    <section v-if="activeInsightTab === 'termScore'" class="glens-step-card glens-step-card--tabbed">
                        <button class="glens-step-summary" type="button" @click="togglePanel('termScore')">
                            <div>
                            <strong>Phenotype matching inputs</strong>
                            <small>Original query terms define the reference profile; semantic candidates broaden matching context but are not shown as user-entered terms</small>
                            </div>
                            <b class="glens-disclosure">{{ openPanels.termScore ? "▾" : "▸" }}</b>
                        </button>
                        <div v-if="openPanels.termScore" class="glens-step-body">
                            <div class="glens-contribution-table glens-contribution-table--compact">
                                <div class="glens-contribution-head">
                                    <span>HPO term</span>
                                    <span>Prevalence in full CRDC cohort</span>
                                    <span>Phenotype weight (Wp)</span>
                                    <span>Role in workflow</span>
                                    <span>Weighted similarity contribution</span>
                                </div>
                                <div
                                    v-for="term in phenotype.termContribution"
                                    :key="term.id"
                                    class="glens-contribution-row"
                                >
                                    <span>{{ term.label }} [{{ term.id }}]</span>
                                    <span>{{ term.prevalence }}</span>
                                    <strong>{{ term.weight }}</strong>
                                    <span>{{ term.used }}</span>
                                    <strong>{{ term.contribution }}</strong>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section v-if="activeInsightTab === 'molecular'" class="glens-step-card glens-card--molecular glens-step-card--tabbed">
                    <button class="glens-step-summary" type="button" @click="togglePanel('molecular')">
                        <div>
                            <p class="glens-section-label">Candidate Gene / Variant Prioritization</p>
                            <strong>Which gene or variant should be inspected next?</strong>
                            <small>Candidate signals derived from variants carried by phenotype-similar samples</small>
                        </div>
                        <b class="glens-disclosure">{{ openPanels.molecular ? "▾" : "▸" }}</b>
                    </button>

                    <div v-if="openPanels.molecular" class="glens-step-body">
                        <p class="glens-source-note">
                            Candidate genes and variants below come from variants carried by phenotype-similar samples, then prioritized by phenotype relevance, carrier recurrence, disease-domain coherence, and pathogenicity evidence. They are supporting molecular evidence, not simply external gene lists for the searched HPO terms.
                        </p>
                        <div class="glens-candidate-grid mt-space">
                            <div>
                                <p class="glens-small-heading">Candidate genes</p>
                                <div class="glens-gene-list">
                                    <a
                                        v-for="gene in phenotype.genes"
                                        :key="gene.gene"
                                        class="glens-gene-card"
                                        href="/krVariant_V3.html"
                                    >
                                        <div>
                                            <strong>{{ gene.gene }}</strong>
                                            <span>{{ gene.domain }}</span>
                                        </div>
                                        <div>
                                            <span>{{ gene.carriers }}</span>
                                            <b>{{ gene.relevance }}</b>
                                        </div>
                                    </a>
                                </div>
                            </div>
                            <div>
                                <p class="glens-small-heading">Candidate variants</p>
                                <div class="glens-variant-list">
                                    <a
                                        v-for="variant in phenotype.candidateVariants"
                                        :key="variant.id"
                                        class="glens-variant-row"
                                        href="/krVariant_V3.html"
                                    >
                                        <strong>{{ variant.gene }}</strong>
                                        <span>{{ variant.id }}</span>
                                        <span>{{ variant.carriers }}</span>
                                        <span>{{ variant.coherence }}</span>
                                        <b>{{ variant.pathogenicity }}</b>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <a class="glens-link-pill glens-link-pill--primary mt-space" href="/krVariant_V3.html">
                            Review variant evidence
                        </a>
                    </div>
                </section>

                    <section v-if="activeInsightTab === 'disease'" class="glens-step-card glens-step-card--tabbed">
                    <button class="glens-step-summary" type="button" @click="togglePanel('disease')">
                        <div>
                            <strong>Disease domain context</strong>
                            <small>Phenotype-based public disease profile matching using Orpha/HPO annotations plus co-observed phenotype structure</small>
                        </div>
                        <b class="glens-disclosure">{{ openPanels.disease ? "▾" : "▸" }}</b>
                    </button>
                    <div v-if="openPanels.disease" class="glens-step-body">
                        <p class="glens-source-note">
                            These domains are disease hypotheses to review, not diagnoses. They summarize which public disease profiles repeatedly match the query and co-observed phenotype pattern.
                        </p>
                        <div class="glens-domain-list">
                            <div
                                v-for="row in phenotype.diseaseCategories"
                                :key="row.category"
                                class="glens-domain-row"
                            >
                                <div class="glens-domain-main">
                                    <strong>{{ row.category }}</strong>
                                    <span>{{ row.why }}</span>
                                </div>
                                <div class="glens-domain-score">
                                    <span>{{ row.diseasesWithPhenotype }}</span>
                                    <strong>{{ row.meanScore }}</strong>
                                </div>
                                <small>{{ row.examples }}</small>
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
                sexAge: "Female · 13-18",
                diagnosed: "Yes",
                diagnosedVariant: "KMT2D chr12:49,431,208 C>T | LP",
                rawScore: "3.9",
                expectedScore: "2.1",
                residual: "+1.8",
                percentile: "top 6.2%",
                equalOrHigher: "18 / 904",
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
        selectSample(sampleId) {
            this.activeOutlierSample = sampleId;
            this.diagnosisOpen = false;
        },
        phenotypeTermHref(term) {
            return `/krPhenotype.html?term=${encodeURIComponent(term.id)}&label=${encodeURIComponent(term.label)}`;
        },
        sampleHref(sampleId) {
            return `/sample.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        variantHref(query) {
            return `/krVariant_V3.html?query=${encodeURIComponent(query)}`;
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
