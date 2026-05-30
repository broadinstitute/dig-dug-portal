<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body glens-page">
            <div class="glens-variant" :class="{ 'glens-large-text': largeText }">
                <div class="glens-access-toolbar" aria-label="Display options">
                    <div class="glens-page-mode-label" aria-label="Current workflow">
                        <span>Current workflow</span>
                        <strong>Variant / gene search <em>GRCh38</em></strong>
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
                <section class="glens-header-card">
                    <div class="glens-header-row">
                        <div>
                            <div class="glens-title-row">
                                <h1 class="glens-page-title">{{ variant.query.label }}</h1>
                                <span v-if="variant.query.cytoband" class="glens-cytoband-chip">{{ variant.query.cytoband }}</span>
                                <span
                                    class="glens-pathogenicity-badge"
                                    :class="{ 'glens-pathogenicity-badge--unknown': variant.query.pathogenicity === 'Pathogenicity not available' }"
                                >
                                    {{ variant.query.pathogenicity }}
                                </span>
                            </div>
                            <div class="glens-inline-meta">
                                <span>{{ variant.query.window }}</span>
                                <span>|</span>
                                <span>{{ variant.query.build }}</span>
                            </div>
                            <div class="glens-carrier-subline">
                                {{ variantHeaderSubline }}
                            </div>
                        </div>
                    </div>

                    <div class="glens-new-summary-band" aria-label="Variant interpretation summary">
                        <div class="glens-new-summary-grid">
                            <article
                                v-for="item in variantNewSummary"
                                :key="item.label"
                                class="glens-new-summary-item"
                            >
                                <span>{{ item.label }}</span>
                                <strong>{{ item.value }}</strong>
                                <p>{{ item.note }}</p>
                            </article>
                        </div>
                        <div
                            class="glens-context-contrast"
                            :class="{ 'glens-context-contrast--active': hasActiveContext }"
                        >
                            <div>
                                <span>{{ variantContextPanel.label }}</span>
                                <strong>{{ variantContextPanel.value }}</strong>
                                <p>{{ variantContextPanel.note }}</p>
                            </div>
                            <ul v-if="hasActiveContext && carrierContextOverlapPreview.length">
                                <li
                                    v-for="term in carrierContextOverlapPreview"
                                    :key="term"
                                >
                                    {{ term }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section class="glens-panel-card">
                    <div class="glens-primary-grid">
                        <div class="glens-locus-card" :style="locusGridStyle">
                            <div class="glens-locus-header">
                                <div>
                                    <p class="glens-section-label">Queried variant window</p>
                                    <strong>{{ queryWindowLabel }}</strong>
                                </div>
                                <div class="glens-checkbox-row glens-checkbox-row--tracks">
                                    <button
                                        class="glens-check-option"
                                        type="button"
                                        @click="showDiseaseTrack = !showDiseaseTrack"
                                    >
                                        <span class="glens-check-box" :class="{ 'glens-check-box--checked': showDiseaseTrack }"></span>
                                        Disease track
                                    </button>
                                    <button
                                        class="glens-check-option"
                                        type="button"
                                        @click="showGeneTrack = !showGeneTrack"
                                    >
                                        <span class="glens-check-box" :class="{ 'glens-check-box--checked': showGeneTrack }"></span>
                                        Gene track
                                    </button>
                                </div>
                            </div>
                            <div class="glens-axis-row">
                                <span v-for="tick in variant.axisTicks" :key="tick">{{ tick }}</span>
                            </div>
                            <div class="glens-minor-axis-row">
                                <span
                                    v-for="tick in variant.minorTicks"
                                    :key="tick.label"
                                    class="glens-minor-tick"
                                    :class="{ 'glens-minor-tick--labeled': tick.label }"
                                    :style="{ left: tick.left }"
                                >
                                    <span v-if="tick.label">{{ tick.label }}</span>
                                </span>
                            </div>
                            <div
                                class="glens-query-position-band"
                                :style="{
                                    left: focusOverlayLeft,
                                    width: variant.query.focusBandWidth,
                                }"
                            ></div>
                            <div class="glens-focus-line" :style="{ left: focusOverlayLeft }"></div>

                            <div v-if="showDiseaseTrack" class="glens-track-row glens-track-row--optional">
                                <div class="glens-track-label">Disease</div>
                                <div class="glens-window-signal-track">
                                    <div class="glens-window-signal-head">
                                        <span>Disease</span>
                                        <span>Evidence in ±25bp view</span>
                                    </div>
                                    <div
                                        v-for="signal in variant.diseaseSignals"
                                        :key="signal.label"
                                        class="glens-window-signal-row"
                                    >
                                        <a
                                            v-if="diseaseReferenceHref(signal)"
                                            class="glens-table-link"
                                            :href="diseaseReferenceHref(signal)"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {{ diseaseReferenceDisplay(signal) }}
                                        </a>
                                        <strong v-else>{{ diseaseReferenceDisplay(signal) }}</strong>
                                        <span>{{ signal.scope }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="showGeneTrack" class="glens-track-row glens-track-row--optional">
                                <div class="glens-track-label">Exon</div>
                                    <div class="glens-exon-context">
                                        <div class="glens-exon-context-head">
                                        <strong>{{ queryGeneLabel }} coding context</strong>
                                        <span>base-level window · queried base highlighted</span>
                                    </div>
                                    <div class="glens-base-strip" aria-label="Reference bases around queried variant">
                                        <span
                                            v-for="base in variant.exonBases"
                                            :key="base.position"
                                            class="glens-base-cell"
                                            :class="{ 'glens-base-cell--variant': base.variant }"
                                        >
                                            <small>{{ base.position }}</small>
                                            <b>{{ base.base }}</b>
                                        </span>
                                    </div>
                                    <div class="glens-codon-strip" aria-label="Codon context around queried variant">
                                        <span
                                            v-for="codon in variant.codons"
                                            :key="codon.label"
                                            class="glens-codon-cell"
                                            :class="{
                                                'glens-codon-cell--variant': codon.variant,
                                                'glens-codon-cell--special': codon.special,
                                            }"
                                        >
                                            <small>{{ codon.label }}</small>
                                            <b>{{ codon.ref }}</b>
                                            <span class="glens-aa-label">{{ codon.aa }}</span>
                                            <span v-if="codon.altAa" class="glens-aa-change">
                                                {{ codon.aa }} → {{ codon.altAa }}
                                            </span>
                                            <em v-if="codon.alt">{{ codon.alt }}</em>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="glens-track-row glens-track-row--compact">
                                <div class="glens-track">
                                    <div
                                        v-for="marker in visibleMarkers"
                                        :key="marker.label + marker.left"
                                        class="glens-marker"
                                        :class="{
                                            'glens-marker--focus': marker.focal,
                                            'glens-marker--nearby': !marker.focal,
                                        }"
                                        :style="{ left: marker.left }"
                                    >
                                        <span v-if="marker.badge" class="glens-marker-badge">{{ marker.badge }}</span>
                                        <span class="glens-marker-shape">{{ marker.focal ? "●" : marker.label }}</span>
                                        <span v-if="marker.pathogenicity" class="glens-marker-status">
                                            {{ marker.pathogenicity }}
                                        </span>
                                        <span class="glens-marker-coordinate">
                                            {{ marker.coordinate }} | {{ marker.classification }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="glens-track-row glens-track-row--density glens-track-row--compact">
                                <div>
                                    <div class="glens-density-title">
                                        Per-position carrier count
                                        <span class="glens-density-query-count">{{ queriedVariantCarrierCountLabel }}</span>
                                    </div>
                                    <div class="glens-density-track" :title="`Hover each bar to see carrier count. ${queriedVariantCarrierCountLabel}.`">
                                        <div class="glens-density-y-axis">
                                            <span v-for="label in densityYAxisLabels" :key="label">{{ label }}</span>
                                        </div>
                                        <div
                                            v-for="series in renderedDensitySeries"
                                            :key="series.key"
                                            class="glens-density-series"
                                            :class="[
                                                `glens-density-series--${series.key}`,
                                                { 'glens-density-series--active': series.active }
                                            ]"
                                        >
                                            <span
                                                v-for="(height, index) in series.bins"
                                                :key="`${series.key}-${index}`"
                                                class="glens-density-bar"
                                                :class="{
                                                    'glens-density-bar--query': series.active && index === queryDensityIndex
                                                }"
                                                :data-count="height"
                                                :style="{ height: densityBarHeight(height) }"
                                            ></span>
                                        </div>
                                    </div>
                                    <div class="glens-density-filters">
                                        <button
                                            v-for="mode in densityModes"
                                            :key="mode.key"
                                            class="glens-check-option glens-check-option--density"
                                            type="button"
                                            @click="activeDensity = mode.key"
                                        >
                                            <span
                                                class="glens-check-box"
                                                :class="{ 'glens-check-box--checked': activeDensity === mode.key }"
                                            ></span>
                                            {{ mode.label }}
                                        </button>
                                        <div class="glens-density-sex-filter" aria-label="Sex filter">
                                            <span>Sex</span>
                                            <button
                                                v-for="sex in densitySexOptions"
                                                :key="sex.key"
                                                type="button"
                                                class="glens-check-option glens-check-option--density"
                                                @click="activeDensitySex = sex.key"
                                            >
                                                <span
                                                    class="glens-check-box"
                                                    :class="{ 'glens-check-box--checked': activeDensitySex === sex.key }"
                                                ></span>
                                                {{ sex.label }}
                                            </button>
                                        </div>
                                        <label class="glens-select-label glens-select-label--inline" for="carrier-age">
                                            Age at enrollment
                                            <select
                                                id="carrier-age"
                                                v-model="activeCarrierAge"
                                                class="glens-select glens-select--compact"
                                            >
                                                <option
                                                    v-for="age in carrierAgeOptions"
                                                    :key="age.key"
                                                    :value="age.key"
                                                >
                                                    {{ age.label }}
                                                </option>
                                            </select>
                                        </label>
                                        <label class="glens-select-label glens-select-label--inline" for="density-investigator">
                                            Investigator
                                            <select
                                                id="density-investigator"
                                                v-model="activeInvestigator"
                                                class="glens-select"
                                            >
                                                <option
                                                    v-for="investigator in investigatorOptions"
                                                    :key="investigator.key"
                                                    :value="investigator.key"
                                                >
                                                    {{ investigator.label }}
                                                </option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <aside class="glens-evidence-stack" id="variant-evidence">
                            <div class="glens-evidence-panel glens-evidence-panel--variant">
                                <p class="glens-section-label">Queried variant evidence</p>
                                <div class="glens-kv-grid">
                                    <div v-for="item in variant.variantEvidence" :key="item.label" class="glens-kv-row">
                                        <span>{{ item.label }}</span>
                                        <a
                                            v-if="variantEvidenceHref(item)"
                                            class="glens-external-evidence-link"
                                            :href="variantEvidenceHref(item)"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {{ item.value }}
                                        </a>
                                        <strong v-else>{{ item.value }}</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="glens-evidence-panel">
                                <p class="glens-section-label">Gene / locus context</p>
                                <div class="glens-kv-grid">
                                    <div v-for="item in variant.geneContext" :key="item.label" class="glens-kv-row">
                                        <span>{{ item.label }}</span>
                                        <strong>{{ item.value }}</strong>
                                    </div>
                                    <button
                                        class="glens-kv-row glens-kv-row--button"
                                        type="button"
                                        @click="showDiseaseRegions = !showDiseaseRegions"
                                    >
                                        <span><b class="glens-row-disclosure">{{ showDiseaseRegions ? "▾" : "▸" }}</b> Disease signals</span>
                                        <strong>2 signals</strong>
                                    </button>
                                </div>
                                <div v-if="showDiseaseRegions" class="glens-disease-list">
                                    <div
                                        v-for="disease in variant.relatedDiseases"
                                        :key="disease.name"
                                        class="glens-disease-item"
                                    >
                                        <a
                                            v-if="diseaseReferenceHref(disease)"
                                            class="glens-table-link"
                                            :href="diseaseReferenceHref(disease)"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {{ diseaseReferenceDisplay(disease) }}
                                        </a>
                                        <strong v-else>{{ diseaseReferenceDisplay(disease) }}</strong>
                                        <span>{{ disease.domain }} | {{ disease.signal }}</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </section>

                <section class="row glens-bottom-grid">
                    <div class="col-12">
                        <div id="phenotype-details" class="glens-card">
                            <div class="glens-shared-level-row">
                                <div>
                                    <p class="glens-section-label">Carrier profile</p>
                                    <span class="glens-small-meta">{{ carrierReference.levelLabel }} reference set</span>
                                </div>
                                <div class="glens-carrier-context-actions">
                                    <div class="glens-level-toggle" aria-label="Carrier reference level">
                                        <button
                                            v-for="level in summaryLevels"
                                            :key="`carrier-${level.key}`"
                                            class="glens-level-button"
                                            :class="{ 'glens-level-button--active': activeSummaryLevel === level.key }"
                                            type="button"
                                            @click="setSummaryLevel(level.key)"
                                        >
                                            {{ level.label }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="glens-carrier-filter-row" aria-label="Carrier profile filters">
                                <label class="glens-select-label glens-select-label--inline" for="carrier-subset-filter">
                                    Carrier subset
                                    <select
                                        id="carrier-subset-filter"
                                        v-model="carrierSubsetFilter"
                                        class="glens-select"
                                        @change="resetCarrierSampleLimit"
                                    >
                                        <option
                                            v-for="option in carrierSubsetOptions"
                                            :key="option.key"
                                            :value="option.key"
                                        >
                                            {{ option.label }}
                                        </option>
                                    </select>
                                </label>
                                <label class="glens-select-label glens-select-label--inline" for="carrier-sex-filter">
                                    Sex
                                    <select
                                        id="carrier-sex-filter"
                                        v-model="activeCarrierSexFilter"
                                        class="glens-select"
                                        @change="resetCarrierSampleLimit"
                                    >
                                        <option
                                            v-for="sex in densitySexOptions"
                                            :key="`carrier-sex-${sex.key}`"
                                            :value="sex.key"
                                        >
                                            {{ sex.label }}
                                        </option>
                                    </select>
                                </label>
                                <label class="glens-select-label glens-select-label--inline" for="carrier-gene-filter">
                                    Gene
                                    <select
                                        id="carrier-gene-filter"
                                        v-model="carrierGeneFilter"
                                        class="glens-select"
                                        @change="resetCarrierSampleLimit"
                                    >
                                        <option
                                            v-for="option in carrierGeneFilterOptions"
                                            :key="option.key"
                                            :value="option.key"
                                        >
                                            {{ option.label }}
                                        </option>
                                    </select>
                                </label>
                                <label class="glens-select-label glens-select-label--inline" for="carrier-age-filter">
                                    Age at enrollment
                                    <select
                                        id="carrier-age-filter"
                                        v-model="activeCarrierAge"
                                        class="glens-select"
                                        @change="resetCarrierSampleLimit"
                                    >
                                        <option
                                            v-for="age in carrierAgeOptions"
                                            :key="age.key"
                                            :value="age.key"
                                        >
                                            {{ age.label }}
                                        </option>
                                    </select>
                                </label>
                                <label class="glens-select-label glens-select-label--inline" for="carrier-investigator-filter">
                                    Investigator
                                    <select
                                        id="carrier-investigator-filter"
                                        v-model="carrierInvestigatorFilter"
                                        class="glens-select"
                                        @change="resetCarrierSampleLimit"
                                    >
                                        <option
                                            v-for="option in carrierInvestigatorFilterOptions"
                                            :key="option.key"
                                            :value="option.key"
                                        >
                                            {{ option.label }}
                                        </option>
                                    </select>
                                </label>
                                <span class="glens-carrier-filter-summary">{{ filteredCarrierSamples.length }} / {{ activeCarrierSamples.length }} carrier samples in current view</span>
                                <button
                                    type="button"
                                    class="glens-filter-reset-button"
                                    :disabled="!isCarrierFilterActive"
                                    @click="resetCarrierFilters"
                                >
                                    Reset
                                </button>
                            </div>
                            <section class="glens-carrier-sample-overview" aria-label="Carrier sample overview">
                                <div
                                    class="glens-carrier-sample-table glens-carrier-sample-table--overview"
                                    :class="{ 'glens-carrier-sample-table--gene': activeSummaryLevel === 'gene' }"
                                >
                                    <div class="glens-carrier-sample-overview-head">
                                        <div>
                                            <p class="glens-section-label">Carrier samples</p>
                                            <span>{{ filteredCarrierSamples.length }} / {{ activeCarrierSamples.length }} current subset</span>
                                        </div>
                                    </div>
                                    <div class="glens-carrier-table-head">
                                        <button type="button" @click="setCarrierSampleSort('id')">
                                            Sample {{ sortIndicator('sample', 'id') }}
                                        </button>
                                        <button type="button" @click="setCarrierSampleSort('age')">
                                            Age at enrollment {{ sortIndicator('sample', 'age') }}
                                        </button>
                                        <button type="button" @click="setCarrierSampleSort('sex')">
                                            Sex {{ sortIndicator('sample', 'sex') }}
                                        </button>
                                        <button
                                            v-if="activeSummaryLevel === 'variant'"
                                            type="button"
                                            @click="setCarrierSampleSort('genotype')"
                                        >
                                            GT {{ sortIndicator('sample', 'genotype') }}
                                        </button>
                                        <button type="button" @click="setCarrierSampleSort('hpoCount')">
                                            HPO terms {{ sortIndicator('sample', 'hpoCount') }}
                                        </button>
                                        <button type="button" @click="setCarrierSampleSort('geneCount')">
                                            Carrier genes {{ sortIndicator('sample', 'geneCount') }}
                                        </button>
                                        <button type="button" @click="setCarrierSampleSort('group')">
                                            Investigator {{ sortIndicator('sample', 'group') }}
                                        </button>
                                        <button type="button" @click="setCarrierSampleSort('proband')">
                                            Proband {{ sortIndicator('sample', 'proband') }}
                                        </button>
                                        <button type="button" @click="setCarrierSampleSort('affected')">
                                            Affected {{ sortIndicator('sample', 'affected') }}
                                        </button>
                                        <button type="button" @click="setCarrierSampleSort('diagnosed')">
                                            GenDx {{ sortIndicator('sample', 'diagnosed') }}
                                        </button>
                                    </div>
                                    <div
                                        v-for="sample in visibleCarrierSamples"
                                        :key="sample.id"
                                        class="glens-carrier-table-row"
                                    >
                                        <a class="glens-sample-link" :href="sampleHref(sample.id)">
                                            {{ sample.id }}
                                        </a>
                                        <span>{{ ageAtEnrollmentLabel(sample) }}</span>
                                        <span>{{ carrierSexLabel(sample) }}</span>
                                        <span v-if="activeSummaryLevel === 'variant'">{{ sample.genotype || "-" }}</span>
                                        <span>{{ carrierSampleHpoCount(sample) }}</span>
                                        <span>{{ carrierSampleGeneCount(sample) }}</span>
                                        <span>{{ sample.group }}</span>
                                        <span>{{ sample.proband }}</span>
                                        <span>{{ sample.affected }}</span>
                                        <span>{{ sample.diagnosed }}</span>
                                    </div>
                                </div>
                                <div class="glens-carrier-sample-actions">
                                    <span>Showing {{ visibleCarrierSamples.length }} of {{ sortedCarrierSamples.length }} filtered carrier samples</span>
                                    <button
                                        v-if="hasMoreCarrierSamples"
                                        type="button"
                                        @click="showMoreCarrierSamples"
                                    >
                                        Show {{ nextCarrierSampleCount }} more
                                    </button>
                                    <button
                                        v-if="carrierSampleVisibleCount > 5"
                                        type="button"
                                        @click="resetCarrierSampleLimit"
                                    >
                                        Show top 5
                                    </button>
                                </div>
                                <div class="glens-carrier-summary-panel glens-carrier-summary-panel--sample" aria-label="Carrier sample summary">
                                    <div class="glens-carrier-summary-head">
                                        <span>Carrier sample summary</span>
                                        <span>{{ filteredCarrierSamples.length }} / {{ activeCarrierSamples.length }} current subset</span>
                                    </div>
                                    <div class="glens-carrier-summary-section">
                                        <span>Sex distribution</span>
                                        <div class="glens-summary-chip-row">
                                            <button
                                                v-for="item in carrierSexSummaryItems"
                                                :key="item.key"
                                                type="button"
                                                class="glens-summary-chip"
                                                :class="[
                                                    `glens-summary-chip--${item.key}`,
                                                    {
                                                        'glens-summary-chip--active': activeCarrierSummarySex === item.key,
                                                        'glens-summary-chip--muted': carrierSummarySexFilterActive && activeCarrierSummarySex !== item.key
                                                    }
                                                ]"
                                                @click="setCarrierSummarySex(item.key)"
                                            >
                                                {{ item.label }} {{ item.count }}
                                            </button>
                                        </div>
                                    </div>
                                    <div class="glens-carrier-summary-section">
                                        <span>Age at enrollment</span>
                                        <div class="glens-summary-age-bars">
                                            <div
                                                v-for="bin in carrierAgeSummaryBins"
                                                :key="bin.label"
                                                class="glens-summary-age-bin"
                                            >
                                                <small>{{ bin.count }}</small>
                                                <div class="glens-summary-age-stack" :class="{ 'glens-summary-age-stack--split': activeCarrierSummarySex === 'all' }">
                                                    <span
                                                        v-for="segment in bin.segments"
                                                        :key="segment.key"
                                                        class="glens-summary-age-segment-wrap"
                                                        :title="`${segment.key === 'unknown' ? 'n/a' : segment.key}: ${segment.count}`"
                                                    >
                                                        <em v-if="activeCarrierSummarySex === 'all' && segment.count">{{ segment.count }}</em>
                                                        <i
                                                            :class="`glens-summary-age-segment--${segment.key}`"
                                                            :style="{ height: segment.height }"
                                                        ></i>
                                                    </span>
                                                </div>
                                                <span>{{ bin.label }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="glens-carrier-summary-section">
                                        <span>Investigator distribution</span>
                                        <div class="glens-investigator-summary">
                                            <div
                                                v-for="row in visibleCarrierInvestigatorSummaryRows"
                                                :key="row.label"
                                            >
                                                <span>{{ row.label }}</span>
                                                <span>{{ row.count }} ({{ row.percent }}%)</span>
                                            </div>
                                        </div>
                                        <button
                                            v-if="carrierInvestigatorSummaryRows.length > 5"
                                            type="button"
                                            class="glens-summary-more-button"
                                            @click="toggleCarrierInvestigatorSummary"
                                        >
                                            {{ carrierInvestigatorSummaryExpanded ? "Show top 5" : `Show ${hiddenCarrierInvestigatorSummaryCount} more` }}
                                        </button>
                                    </div>
                                </div>
                            </section>
                            <div class="glens-carrier-profile-tabs glens-carrier-profile-tabs--labels" aria-label="Carrier profile sections">
                                <div class="glens-carrier-profile-tab">
                                    <span>Carrier phenotype profile</span>
                                </div>
                                <div class="glens-carrier-profile-tab">
                                    <span>Carrier Genotype profile</span>
                                </div>
                            </div>
                            <div class="row glens-carrier-inspection-row">
                                <div class="col-lg-6">
                                    <div class="glens-section-head">
                                        <div class="glens-section-title-group">
                                            <p class="glens-section-label">Carrier phenotype profile</p>
                                            <span class="glens-inline-context">
                                                {{ carrierSampleCountDisplay }} carriers · {{ carrierHpoCountDisplay }} HPO terms
                                            </span>
                                        </div>
                                        <div
                                            class="glens-filter-scope-summary"
                                            aria-label="Phenotype summary carrier subset"
                                        >
                                            <span>Current subset:</span>
                                            <span>{{ carrierPhenotypeSummaryScopeLabel }}</span>
                                        </div>
                                    </div>
                                    <div class="glens-legend">
                                        <span><i class="glens-dot glens-dot--blue"></i>All</span>
                                        <span v-if="isCarrierFilterActive"><i class="glens-dot glens-dot--orange"></i>Subset</span>
                                    </div>
                                    <template v-if="phenotypeRows.length">
                                        <div
                                            v-for="phenotype in phenotypeRows"
                                            :key="phenotype.label"
                                            class="glens-bar-group"
                                            :class="{ 'glens-bar-group--active': activePhenotypeCategory === phenotype.label }"
                                            @click="togglePhenotypeCategory(phenotype.label)"
                                        >
                                            <div class="glens-bar-header">
                                                <span>{{ phenotype.label }}</span>
                                                <span>
                                                    All {{ phenotype.all }}% ({{ phenotype.allCount }} / {{ phenotype.allDenominator }})
                                                    <template v-if="isCarrierFilterActive">
                                                        | Subset {{ phenotype.subset }}% ({{ phenotype.subsetCount }} / {{ phenotype.subsetDenominator }})
                                                    </template>
                                                </span>
                                            </div>
                                            <div class="glens-bar-shell">
                                                <div class="glens-bar glens-bar--blue" :style="{ width: phenotype.all + '%' }"></div>
                                            </div>
                                            <div v-if="isCarrierFilterActive" class="glens-bar-shell glens-bar-shell--sub">
                                                <div class="glens-bar glens-bar--orange" :style="{ width: phenotype.subset + '%' }"></div>
                                            </div>
                                            <div
                                                v-if="activePhenotypeCategory === phenotype.label"
                                                class="glens-phenotype-detail"
                                            >
                                                <div class="glens-detail-head">
                                                    <span>Shared</span>
                                                    <span>HPO term</span>
                                                    <span>Subset samples</span>
                                                </div>
                                                <div
                                                    v-for="item in activePhenotypeDetails"
                                                    :key="item.label"
                                                    class="glens-detail-row"
                                                >
                                                    <span>{{ item.shared ? "✓" : "" }}</span>
                                                    <span>{{ item.label }}</span>
                                                    <span class="glens-detail-sample-cell">
                                                        <button
                                                            v-if="item.sampleIds && item.sampleIds.length"
                                                            type="button"
                                                            class="glens-detail-sample-button"
                                                            @click.stop="togglePhenotypeDetailSamples(item.label)"
                                                        >
                                                            {{ item.supportLabel }}
                                                        </button>
                                                        <template v-else>
                                                            {{ item.supportLabel || (item.value !== undefined && item.value !== "" ? `${item.value}%` : "-") }}
                                                        </template>
                                                        <div
                                                            v-if="activePhenotypeDetailLabel === item.label"
                                                            class="glens-detail-sample-popover"
                                                        >
                                                            <a
                                                                v-for="sampleId in item.samplePreview"
                                                                :key="sampleId"
                                                                :href="sampleHref(sampleId)"
                                                            >
                                                                {{ sampleId }}
                                                            </a>
                                                            <span v-if="item.hiddenSampleCount">+{{ item.hiddenSampleCount }} more</span>
                                                        </div>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="hasMoreCarrierPhenotypes" class="glens-carrier-table-actions glens-phenotype-actions">
                                            <span>Showing {{ phenotypeRows.length }} carrier phenotype groups</span>
                                            <button type="button" @click="showMoreCarrierPhenotypes">
                                                Show {{ nextCarrierPhenotypeCount }} more
                                            </button>
                                        </div>
                                    </template>
                                    <div v-else class="glens-empty-state glens-empty-state--summary">
                                        Carrier HPO profile unavailable for this reference set.
                                        The filtered carrier sample set has no informative HPO terms beyond broad ontology roots in the current test fixture.
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <section class="glens-carrier-genotype-section glens-carrier-genotype-section--inline" aria-label="Carrier genotype profile">
                                        <div class="glens-carrier-genotype-head">
                                            <div>
                                                <p class="glens-section-label">Carrier Genotype profile</p>
                                                <span>
                                                    {{ carrierSampleCountDisplay }} carriers · {{ coCarrierGeneRows.length }} co-carrier genes
                                                </span>
                                            </div>
                                        </div>
                                        <div class="glens-co-carrier-table">
                                            <div class="glens-co-carrier-head">
                                                <button type="button" @click="setCoCarrierGeneSort('gene')">
                                                    Co-carrier gene {{ sortIndicator('coGene', 'gene') }}
                                                </button>
                                                <button type="button" @click="setCoCarrierGeneSort('count')">
                                                    Current subset {{ sortIndicator('coGene', 'count') }}
                                                </button>
                                                <button type="button" @click="setCoCarrierGeneSort('diseaseReference')">
                                                    Gene-disease overlap {{ sortIndicator('coGene', 'diseaseReference') }}
                                                </button>
                                                <button type="button" @click="setCoCarrierGeneSort('secondaryAnnotation')">
                                                    Secondary annotation {{ sortIndicator('coGene', 'secondaryAnnotation') }}
                                                </button>
                                            </div>
                                            <template v-for="row in visibleCoCarrierGeneRows">
                                                <div
                                                    :key="`${row.gene}-row`"
                                                    class="glens-co-carrier-row"
                                                >
                                                    <a class="glens-table-link" :href="variantHref(row.gene)">{{ row.gene }}</a>
                                                    <button
                                                        type="button"
                                                        class="glens-co-carrier-count-button"
                                                        @click="toggleCoCarrierGeneSamples(row.gene)"
                                                    >
                                                        {{ row.count }} / {{ row.denominator }} ({{ row.percent }}%)
                                                    </button>
                                                    <a
                                                        v-if="row.diseaseReferenceHref"
                                                        class="glens-table-link"
                                                        :href="row.diseaseReferenceHref"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {{ row.diseaseReference }}
                                                    </a>
                                                    <span v-else>{{ row.diseaseReference }}</span>
                                                    <span>{{ row.secondaryAnnotation }}</span>
                                                </div>
                                                <div
                                                    v-if="activeCoCarrierGene === row.gene"
                                                    :key="`${row.gene}-samples`"
                                                    class="glens-co-carrier-sample-accordion"
                                                >
                                                    <div class="glens-co-carrier-sample-head">
                                                        <span>{{ row.gene }} shared carrier samples</span>
                                                        <span>{{ activeCoCarrierGeneSamples.length }} / {{ filteredCarrierSamples.length }} current subset</span>
                                                    </div>
                                                    <div
                                                        class="glens-carrier-sample-table glens-carrier-sample-table--nested"
                                                        :class="{ 'glens-carrier-sample-table--gene': activeSummaryLevel === 'gene' }"
                                                    >
                                                        <div class="glens-carrier-table-head">
                                                            <span>Sample</span>
                                                            <span>Age at enrollment</span>
                                                            <span>Sex</span>
                                                            <span v-if="activeSummaryLevel === 'variant'">GT</span>
                                                            <span>HPO terms</span>
                                                            <span>Carrier genes</span>
                                                            <span>Investigator</span>
                                                            <span>Proband</span>
                                                            <span>Affected</span>
                                                            <span>GenDx</span>
                                                        </div>
                                                        <div
                                                            v-for="sample in visibleActiveCoCarrierGeneSamples"
                                                            :key="`${row.gene}-${sample.id}`"
                                                            class="glens-carrier-table-row"
                                                        >
                                                            <a class="glens-sample-link" :href="sampleHref(sample.id)">
                                                                {{ sample.id }}
                                                            </a>
                                                            <span>{{ ageAtEnrollmentLabel(sample) }}</span>
                                                            <span>{{ carrierSexLabel(sample) }}</span>
                                                            <span v-if="activeSummaryLevel === 'variant'">{{ sample.genotype || "-" }}</span>
                                                            <span>{{ carrierSampleHpoCount(sample) }}</span>
                                                            <span>{{ carrierSampleGeneCount(sample) }}</span>
                                                            <span>{{ sample.group }}</span>
                                                            <span>{{ sample.proband }}</span>
                                                            <span>{{ sample.affected }}</span>
                                                            <span>{{ sample.diagnosed }}</span>
                                                        </div>
                                                        <div class="glens-carrier-table-actions">
                                                            <span>Showing {{ visibleActiveCoCarrierGeneSamples.length }} of {{ activeCoCarrierGeneSamples.length }} shared carrier samples</span>
                                                            <button
                                                                v-if="hasMoreActiveCoCarrierGeneSamples"
                                                                type="button"
                                                                @click="showMoreCoCarrierGeneSamples"
                                                            >
                                                                Show {{ nextCoCarrierSampleCount }} more
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                            <div v-if="!coCarrierGeneRows.length" class="glens-empty-state">
                                                No additional variant-gene summary is available for the current carrier subset.
                                            </div>
                                            <div class="glens-carrier-table-actions glens-co-carrier-actions">
                                                <span>Showing {{ visibleCoCarrierGeneRows.length }} of {{ sortedCoCarrierGeneRows.length }} co-carrier genes</span>
                                                <button
                                                    v-if="hasMoreCoCarrierGeneRows"
                                                    type="button"
                                                    @click="showMoreCoCarrierGeneRows"
                                                >
                                                    Show {{ nextCoCarrierGeneCount }} more
                                                </button>
                                                <button
                                                    v-if="coCarrierGeneVisibleCount > 5"
                                                    type="button"
                                                    @click="resetCoCarrierGeneLimit"
                                                >
                                                    Show top 5
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import ClinicalFocusBar from "../KrClinicalFocus/ClinicalFocusBar.vue";
import { onClinicalFocusChange, readClinicalFocus } from "../KrClinicalFocus/focusStore";
import { createKrVariantState } from "./mockData";
import { variantComputed, variantMethods } from "./pageModel";
import "./style.css";

export default {
    name: "KrVariantTemplate",
    components: {
        ClinicalFocusBar,
    },
    data() {
        return {
            ...createKrVariantState(),
            clinicalFocus: readClinicalFocus(),
            contextPopoverOpen: false,
            optionsPopoverOpen: false,
            selectedCarrierSampleIds: [],
            selectedCarrierPhenotypeLabels: [],
            carrierContextDraftOpen: false,
            carrierContextDraftType: "",
            carrierContextDraftItems: [],
            carrierContextDraftAddValue: "",
            carrierSubsetFilter: "all",
            carrierInvestigatorFilter: "all",
            carrierGeneFilter: "all",
            activeDensitySex: "all",
            activeCarrierSexFilter: "all",
            activeCarrierSummarySex: "all",
            carrierSampleVisibleCount: 5,
            carrierPhenotypeVisibleCount: 5,
            carrierInvestigatorSummaryExpanded: false,
            coCarrierGeneSort: { key: "count", direction: "desc" },
            coCarrierGeneVisibleCount: 5,
            activeCoCarrierGene: "",
            coCarrierSampleVisibleCount: 5,
            activePhenotypeDetailLabel: "",
            unsubscribeClinicalFocus: null,
        };
    },
    computed: variantComputed,
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
    methods: variantMethods,
};
</script>
