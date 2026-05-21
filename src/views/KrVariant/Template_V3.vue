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
                        <strong>Variant / gene search</strong>
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
                                <span class="glens-cytoband-chip">15q11.3</span>
                                <span class="glens-pathogenicity-badge">{{ variant.query.pathogenicity }}</span>
                            </div>
                            <div class="glens-inline-meta">
                                <span>{{ variant.query.window }}</span>
                                <span>|</span>
                                <span>{{ variant.query.build }}</span>
                            </div>
                            <div class="glens-carrier-subline">
                                18 queried-variant carriers · 12 probands · 17 affected
                            </div>
                        </div>
                        <div class="glens-demographic-panel glens-demographic-panel--header">
                            <div class="glens-section-head">
                                <p class="glens-section-label">Demographic Summary</p>
                                <div class="glens-level-toggle">
                                    <button
                                        v-for="level in summaryLevels"
                                        :key="`header-demo-${level.key}`"
                                        class="glens-level-button"
                                        :class="{ 'glens-level-button--active': activeDemographicLevel === level.key }"
                                        type="button"
                                        @click="activeDemographicLevel = level.key"
                                    >
                                        {{ level.label }}
                                    </button>
                                </div>
                            </div>
                            <div class="glens-age-card glens-age-card--compact">
                                <div class="glens-age-bars">
                                    <div
                                        v-for="bin in demographicPanelAgeBins"
                                        :key="`header-panel-${bin.label}`"
                                        class="glens-age-col"
                                    >
                                        <div class="glens-age-pair">
                                            <div class="glens-age-sex-col">
                                                <div class="glens-age-sex-count">{{ bin.female }}</div>
                                                <div class="glens-age-female" :style="{ height: bin.femaleHeight }"></div>
                                            </div>
                                            <div class="glens-age-sex-col">
                                                <div class="glens-age-sex-count">{{ bin.male }}</div>
                                                <div class="glens-age-male" :style="{ height: bin.maleHeight }"></div>
                                            </div>
                                        </div>
                                        <div class="glens-age-bin-label">{{ bin.label }}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="glens-demography-line">
                                <span><i class="glens-dot glens-dot--female"></i>Female {{ demographicPanelScope.female }}</span>
                                <span><i class="glens-dot glens-dot--male"></i>Male {{ demographicPanelScope.male }}</span>
                                <span>All {{ demographicPanelScope.all }}</span>
                                <span>Proband {{ demographicPanelScope.proband }} ({{ demographicPanelScope.probandPercent }}%)</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="glens-panel-card">
                    <div class="glens-primary-grid">
                        <div class="glens-locus-card" :style="locusGridStyle">
                            <div class="glens-locus-header">
                                <div>
                                    <p class="glens-section-label">Queried variant window</p>
                                    <strong>chr15:22,000,195-22,000,245 (±25bp)</strong>
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
                                        <strong>{{ signal.label }}</strong>
                                        <span>{{ signal.scope }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="showGeneTrack" class="glens-track-row glens-track-row--optional">
                                <div class="glens-track-label">Exon</div>
                                <div class="glens-exon-context">
                                    <div class="glens-exon-context-head">
                                        <strong>UBE3A coding exon</strong>
                                        <span>base-level window · codon containing queried base highlighted</span>
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
                                    </div>
                                    <div class="glens-density-track" title="Hover each bar to see carrier count. Queried variant carrier count = 18.">
                                        <div class="glens-density-y-axis">
                                            <span>20</span>
                                            <span>10</span>
                                            <span>0</span>
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
                                        <label class="glens-select-label glens-select-label--inline" for="carrier-age">
                                            Age
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
                                        <strong>{{ item.value }}</strong>
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
                                        <strong>{{ disease.name }}</strong>
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
                                    <p class="glens-section-label">Carrier phenotype profile</p>
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
                                    <button
                                        class="glens-main-context-button"
                                        type="button"
                                        :disabled="!hasCarrierContextSelection"
                                        @click="openCarrierContextDraft"
                                    >
                                        Set as context
                                    </button>
                                </div>
                            </div>
                            <div v-if="carrierContextDraftOpen" class="glens-context-draft-panel">
                                <div class="glens-context-draft-head">
                                    <div>
                                        <strong>Edit context</strong>
                                        <span>{{ carrierContextDraftType === 'samples' ? 'Carrier samples selected as context source' : 'Phenotype items selected as context source' }}</span>
                                    </div>
                                    <button type="button" aria-label="Close edit context panel" @click="closeCarrierContextDraft">×</button>
                                </div>
                                <div class="glens-context-draft-list">
                                    <span v-for="item in carrierContextDraftItems" :key="item" class="glens-context-draft-item">
                                        {{ item }}
                                        <button type="button" :aria-label="`Remove ${item}`" @click="removeCarrierContextDraftItem(item)">×</button>
                                    </span>
                                </div>
                                <div class="glens-context-draft-add">
                                    <select v-model="carrierContextDraftAddValue" class="glens-select">
                                        <option value="">Add another {{ carrierContextDraftType === 'samples' ? 'carrier sample' : 'phenotype item' }}</option>
                                        <option
                                            v-for="option in carrierContextDraftAddOptions"
                                            :key="option.value"
                                            :value="option.value"
                                        >
                                            {{ option.label }}
                                        </option>
                                    </select>
                                    <button type="button" :disabled="!carrierContextDraftAddValue" @click="addCarrierContextDraftItem">Add</button>
                                </div>
                                <div class="glens-context-draft-actions">
                                    <button type="button" :disabled="!carrierContextDraftItems.length" @click="clearCarrierContextDraftItems">Clear all</button>
                                    <div>
                                        <button type="button" @click="closeCarrierContextDraft">Cancel</button>
                                        <button type="button" :disabled="!carrierContextDraftItems.length" @click="confirmCarrierContextDraft">
                                            Confirm context
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-lg-6">
                                    <div class="glens-carrier-profile-card">
                                        <p>
                                            {{ carrierReference.description }}
                                        </p>
                                        <div class="glens-carrier-tabs" role="tablist" aria-label="Carrier phenotype signal views">
                                            <button
                                                class="glens-carrier-tab"
                                                :class="{ 'glens-carrier-tab--active': activeCarrierDetail === 'samples' }"
                                                type="button"
                                                @click="toggleCarrierDetail('samples')"
                                            >
                                                <span>{{ activeCarrierDetail === 'samples' ? '▾' : '▸' }}</span>
                                                <strong>{{ carrierReference.sampleCount }}</strong>
                                                <span>carrier samples</span>
                                            </button>
                                            <button
                                                class="glens-carrier-tab"
                                                :class="{ 'glens-carrier-tab--active': activeCarrierDetail === 'phenotypes' }"
                                                type="button"
                                                @click="toggleCarrierDetail('phenotypes')"
                                            >
                                                <span>{{ activeCarrierDetail === 'phenotypes' ? '▾' : '▸' }}</span>
                                                <strong>{{ carrierReference.hpoCount }}</strong>
                                                <span>carrier HPO profile</span>
                                            </button>
                                            <button
                                                class="glens-carrier-tab glens-carrier-tab--residual"
                                                :class="{ 'glens-carrier-tab--active': activeCarrierDetail === 'residual' }"
                                                type="button"
                                                @click="toggleCarrierDetail('residual')"
                                            >
                                                <span>{{ activeCarrierDetail === 'residual' ? '▾' : '▸' }}</span>
                                                <strong>{{ hasActiveContext ? carrierReference.contextRank : "Set context" }}</strong>
                                                <span>Context position in CRDC</span>
                                            </button>
                                        </div>
                                        <div v-if="activeCarrierDetail" class="glens-carrier-detail-panel">
                                            <div v-if="activeCarrierDetail === 'samples'" class="glens-carrier-sample-table">
                                                <div class="glens-carrier-table-head">
                                                    <span>Context</span>
                                                    <button type="button" @click="setCarrierSampleSort('id')">
                                                        Sample {{ sortIndicator('sample', 'id') }}
                                                    </button>
                                                    <button type="button" @click="setCarrierSampleSort('age')">
                                                        Age {{ sortIndicator('sample', 'age') }}
                                                    </button>
                                                    <button type="button" @click="setCarrierSampleSort('group')">
                                                        Group {{ sortIndicator('sample', 'group') }}
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
                                                    v-for="sample in sortedCarrierSamples"
                                                    :key="sample.id"
                                                    class="glens-carrier-table-row"
                                                >
                                                    <label class="glens-context-checkbox" @click.stop>
                                                        <input
                                                            type="checkbox"
                                                            :checked="selectedCarrierSampleIds.includes(sample.id)"
                                                            :disabled="isCarrierSampleContextDisabled(sample.id)"
                                                            @change="toggleCarrierSampleContext(sample.id)"
                                                        >
                                                    </label>
                                                    <a class="glens-sample-link" :href="sampleHref(sample.id)">
                                                        {{ sample.id }}
                                                    </a>
                                                    <span>{{ sample.age }}</span>
                                                    <span>{{ sample.group }}</span>
                                                    <span>{{ sample.proband }}</span>
                                                    <span>{{ sample.affected }}</span>
                                                    <span>{{ sample.diagnosed }}</span>
                                                </div>
                                            </div>
                                            <div v-else-if="activeCarrierDetail === 'phenotypes'" class="glens-hpo-category-grid">
                                                <div class="glens-hpo-category-head">
                                                    <button type="button" @click="setCarrierHpoSort('category')">
                                                        HPO root category {{ sortIndicator('hpo', 'category') }}
                                                    </button>
                                                    <button type="button" @click="setCarrierHpoSort('count')">
                                                        Terms {{ sortIndicator('hpo', 'count') }}
                                                    </button>
                                                    <button type="button" @click="setCarrierHpoSort('topTerms')">
                                                        Representative terms {{ sortIndicator('hpo', 'topTerms') }}
                                                    </button>
                                                </div>
                                                <button
                                                    v-for="category in sortedCarrierPhenotypeCategories"
                                                    :key="category.category"
                                                    class="glens-hpo-category"
                                                    :class="{ 'glens-hpo-category--active': activePhenotypeCategory === category.category }"
                                                    type="button"
                                                    @click="selectPhenotypeCategory(category.category)"
                                                >
                                                    <strong>{{ category.category }}</strong>
                                                    <span>{{ category.count }} terms</span>
                                                    <span>{{ category.topTerms.join(' · ') }}</span>
                                                </button>
                                            </div>
                                            <div v-else class="glens-residual-accordion">
                                                <div v-if="!hasActiveContext" class="glens-context-guide">
                                                    <p>
                                                        No active context. Carrier samples and carrier HPO profile are shown as cohort-wide summaries only. Set a clinical context to score this carrier profile against a disease, sample, investigator cohort, or HPO profile.
                                                    </p>
                                                    <span>Set context to evaluate whether this carrier HPO profile is unusual for your clinical question.</span>
                                                </div>
                                                <template v-else>
                                                    <p>
                                                        {{ carrierReference.contextDescription }}
                                                    </p>
                                                    <div class="glens-context-position-summary">
                                                        <div>
                                                            <span>Active context</span>
                                                            <strong>{{ compactContextLabel || carrierReference.contextPosition.activeContext }}</strong>
                                                        </div>
                                                        <div>
                                                            <span>Carrier reference</span>
                                                            <strong>{{ carrierReference.contextPosition.carrierReference }}</strong>
                                                        </div>
                                                        <div>
                                                            <span>Match to context</span>
                                                            <strong>{{ carrierReference.contextPosition.contextMatch }}</strong>
                                                        </div>
                                                        <div>
                                                            <span>Position vs CRDC</span>
                                                            <strong>{{ carrierReference.contextPosition.crdcPosition }}</strong>
                                                        </div>
                                                    </div>
                                                </template>
                                                <label v-if="hasActiveContext" class="glens-residual-select-label" for="carrier-context-investigator">
                                                    Inspect group
                                                    <select
                                                        id="carrier-context-investigator"
                                                        v-model="activeResidualGroupName"
                                                        class="glens-select"
                                                        @change="syncPhenotypeSummaryToResidualGroup"
                                                    >
                                                        <option
                                                            v-for="group in activeResidualGroups"
                                                            :key="`residual-option-${group.name}`"
                                                            :value="group.name"
                                                        >
                                                            {{ group.name }}
                                                        </option>
                                                    </select>
                                                </label>
                                                <div v-if="hasActiveContext" class="glens-residual-mini">
                                                    <button
                                                        v-for="group in activeResidualGroups"
                                                        :key="group.name"
                                                        type="button"
                                                        class="glens-residual-row"
                                                        :class="{ 'glens-residual-row--active': activeResidualGroupName === group.name }"
                                                        @click="setResidualGroup(group.name)"
                                                    >
                                                        <span>{{ group.name }}</span>
                                                        <div class="glens-residual-boxplot" aria-label="Residual boxplot">
                                                            <span class="glens-boxplot-whisker"></span>
                                                            <i :style="{ left: group.low, width: group.width }"></i>
                                                            <b :style="{ left: group.median }"></b>
                                                            <em :style="{ left: group.selected }"></em>
                                                        </div>
                                                        <strong>{{ residualGroupLabel(group) }}</strong>
                                                    </button>
                                                </div>
                                                <div v-if="hasActiveContext" class="glens-residual-sample-panel">
                                                    <div class="glens-residual-sample-head">
                                                        <strong>{{ activeResidualGroupName }}</strong>
                                                        <span>{{ residualCarrierSamples.length }} carrier samples shown</span>
                                                    </div>
                                                    <div class="glens-residual-sample-list">
                                                        <a
                                                            v-for="sample in residualCarrierSamples"
                                                            :key="`residual-${sample.id}`"
                                                            class="glens-sample-link"
                                                            :href="sampleHref(sample.id)"
                                                        >
                                                            {{ sample.id }}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-lg-6">
                                    <div class="glens-section-head">
                                        <div class="glens-section-title-group">
                                            <p class="glens-section-label">Phenotype Summary</p>
                                            <span
                                                v-if="activeCarrierDetail === 'phenotypes'"
                                                class="glens-inline-context"
                                            >
                                                {{ carrierReference.hpoCount }} HPO carrier profile selected
                                            </span>
                                        </div>
                                        <label class="glens-select-label" for="phenotype-investigator">
                                            Investigator
                                            <select
                                                id="phenotype-investigator"
                                                v-model="activePhenotypeInvestigator"
                                                class="glens-select"
                                            >
                                                <option
                                                    v-for="investigator in investigatorOptions"
                                                    :key="`phenotype-${investigator.key}`"
                                                    :value="investigator.key"
                                                >
                                                    {{ investigator.label }}
                                                </option>
                                            </select>
                                        </label>
                                    </div>
                                    <div class="glens-legend">
                                        <span><i class="glens-dot glens-dot--blue"></i>All</span>
                                        <span><i class="glens-dot glens-dot--orange"></i>Proband</span>
                                    </div>
                                    <div
                                        v-for="phenotype in phenotypeRows"
                                        :key="phenotype.label"
                                        class="glens-bar-group"
                                        :class="{ 'glens-bar-group--active': activePhenotypeCategory === phenotype.label }"
                                        @click="togglePhenotypeCategory(phenotype.label)"
                                    >
                                        <div class="glens-bar-header">
                                            <label class="glens-phenotype-context-check" @click.stop>
                                                <input
                                                    type="checkbox"
                                                    :checked="selectedCarrierPhenotypeLabels.includes(phenotype.label)"
                                                    :disabled="isCarrierPhenotypeContextDisabled(phenotype.label)"
                                                    @change="toggleCarrierPhenotypeContext(phenotype.label)"
                                                >
                                                <span>{{ phenotype.label }}</span>
                                            </label>
                                            <span>
                                                All {{ phenotype.all }}% ({{ phenotypeCount(phenotype.all, summaryScope.all) }} / {{ summaryScope.all }})
                                                |
                                                Proband {{ phenotype.proband }}% ({{ phenotypeCount(phenotype.proband, summaryScope.proband) }} / {{ summaryScope.proband }})
                                            </span>
                                        </div>
                                        <div class="glens-bar-shell">
                                            <div class="glens-bar glens-bar--blue" :style="{ width: phenotype.all + '%' }"></div>
                                        </div>
                                        <div class="glens-bar-shell glens-bar-shell--sub">
                                            <div class="glens-bar glens-bar--orange" :style="{ width: phenotype.proband + '%' }"></div>
                                        </div>
                                        <div
                                            v-if="activePhenotypeCategory === phenotype.label"
                                            class="glens-phenotype-detail"
                                        >
                                            <div class="glens-detail-head">
                                                <strong>{{ activePhenotypeCategory }}</strong>
                                                <span>all terms sorted by frequency</span>
                                            </div>
                                            <div
                                                v-for="item in activePhenotypeDetails"
                                                :key="item.label"
                                                class="glens-detail-row"
                                            >
                                                <label class="glens-phenotype-term-check" @click.stop>
                                                    <input
                                                        type="checkbox"
                                                        :checked="selectedCarrierPhenotypeLabels.includes(item.label)"
                                                        :disabled="isCarrierPhenotypeContextDisabled(item.label)"
                                                        @change="toggleCarrierPhenotypeContext(item.label)"
                                                    >
                                                    <span>{{ item.label }}</span>
                                                </label>
                                                <strong>{{ item.value }}%</strong>
                                            </div>
                                        </div>
                                    </div>
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
import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { clearClinicalFocus, onClinicalFocusChange, readClinicalFocus, writeClinicalFocus } from "../KrClinicalFocus/focusStore";
import { createKrVariantState } from "./mockData";
import "./style.css";

export default {
    name: "KrVariantTemplateV3",
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
            unsubscribeClinicalFocus: null,
        };
    },
    computed: {
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        compactContextLabel() {
            if (!this.hasActiveContext) return "";
            const contextId = this.clinicalFocus.orphaId || this.clinicalFocus.sourceId || "";
            return [this.clinicalFocus.label, contextId].filter(Boolean).join(" · ");
        },
        carrierContextSelectionType() {
            if (this.selectedCarrierSampleIds.length) return "samples";
            if (this.selectedCarrierPhenotypeLabels.length) return "phenotypes";
            return "";
        },
        hasCarrierContextSelection() {
            return Boolean(this.carrierContextSelectionType);
        },
        carrierContextSelectionMessage() {
            if (this.carrierContextSelectionType === "samples") {
                return `${this.selectedCarrierSampleIds.length} carrier sample${this.selectedCarrierSampleIds.length === 1 ? "" : "s"} selected. Phenotype row selection is disabled until samples are cleared.`;
            }
            if (this.carrierContextSelectionType === "phenotypes") {
                return `${this.selectedCarrierPhenotypeLabels.length} phenotype item${this.selectedCarrierPhenotypeLabels.length === 1 ? "" : "s"} selected. Carrier sample selection is disabled until phenotype items are cleared.`;
            }
            return "";
        },
        carrierContextDraftAddOptions() {
            if (this.carrierContextDraftType === "samples") {
                return this.sortedCarrierSamples
                    .filter((sample) => !this.carrierContextDraftItems.includes(sample.id))
                    .map((sample) => ({ value: sample.id, label: sample.id }));
            }
            if (this.carrierContextDraftType === "phenotypes") {
                const options = [
                    ...this.phenotypeRows.map((phenotype) => ({ value: phenotype.label, label: phenotype.label })),
                    ...Object.values(this.variant.phenotypeDetails)
                        .flat()
                        .map((term) => ({ value: term.label, label: term.label })),
                ];
                const seen = new Set();
                return options.filter((option) => {
                    if (seen.has(option.value) || this.carrierContextDraftItems.includes(option.value)) return false;
                    seen.add(option.value);
                    return true;
                });
            }
            return [];
        },
        investigatorOptions() {
            return [
                { key: "all-investigators", label: "All investigators" },
                { key: "investigator-1", label: "Investigator 1" },
                { key: "investigator-2", label: "Investigator 2" },
                { key: "investigator-3", label: "Investigator 3" },
            ];
        },
        densityModes() {
            return [
                { key: "all", label: "All" },
                { key: "affected", label: "Affected" },
                { key: "proband", label: "Proband" },
            ];
        },
        carrierAgeOptions() {
            return [
                { key: "all-ages", label: "All ages" },
                { key: "0-1", label: "0-1" },
                { key: "2-4", label: "2-4" },
                { key: "5-12", label: "5-12" },
                { key: "13-18", label: "13-18" },
                { key: "adult", label: "Adult" },
            ];
        },
        summaryLevels() {
            return [
                { key: "variant", label: "Variant level" },
                { key: "gene", label: "Gene level" },
            ];
        },
        summaryScope() {
            return this.variant.summaryScopes[this.activeSummaryLevel];
        },
        carrierReference() {
            const references = {
                variant: {
                    levelLabel: "queried-variant carrier",
                    sampleCount: 18,
                    hpoCount: 47,
                    contextRank: "top 9.1%",
                    description: "Variant level: inspect the 18 exact queried-variant carriers, then the 47-term carrier HPO profile, then context position in CRDC.",
                    contextDescription: "The 47-term queried-variant carrier phenotype profile is compared with the active clinical context, then positioned against CRDC background profiles after total HPO-term correction.",
                    contextPosition: {
                        activeContext: "Kabuki syndrome profile",
                        carrierReference: "18 queried-variant carriers",
                        contextMatch: "11 / 18 context HPO terms",
                        crdcPosition: "top 9.1%",
                    },
                },
                gene: {
                    levelLabel: "UBE3A gene carrier",
                    sampleCount: 132,
                    hpoCount: 86,
                    contextRank: "top 13.4%",
                    description: "Gene level: inspect UBE3A carrier samples, then the gene-carrier HPO profile, then context position in CRDC.",
                    contextDescription: "The UBE3A carrier phenotype profile is compared with the active clinical context, then positioned against CRDC background profiles after total HPO-term correction.",
                    contextPosition: {
                        activeContext: "Kabuki syndrome profile",
                        carrierReference: "132 UBE3A gene carriers",
                        contextMatch: "13 / 18 context HPO terms",
                        crdcPosition: "top 13.4%",
                    },
                },
            };

            return references[this.activeSummaryLevel];
        },
        activeCarrierSamples() {
            return this.activeSummaryLevel === "variant"
                ? this.variant.carrierSamples
                : this.variant.geneCarrierSamples;
        },
        sortedCarrierSamples() {
            return this.sortRows(this.activeCarrierSamples, this.carrierSampleSort.key, this.carrierSampleSort.direction);
        },
        carrierPhenotypeCategories() {
            return this.activeSummaryLevel === "variant"
                ? this.variant.carrierPhenotypesByCategory
                : this.variant.geneCarrierPhenotypesByCategory;
        },
        sortedCarrierPhenotypeCategories() {
            return this.sortRows(this.carrierPhenotypeCategories, this.carrierHpoSort.key, this.carrierHpoSort.direction);
        },
        activeResidualGroups() {
            return this.activeSummaryLevel === "variant"
                ? this.variant.residualGroups
                : this.variant.geneResidualGroups;
        },
        residualCarrierSamples() {
            if (this.activeResidualGroupName === "All CRDC") return this.sortedCarrierSamples;
            return this.sortedCarrierSamples.filter((sample) => sample.group === this.activeResidualGroupName);
        },
        demographicPanelScope() {
            return this.variant.summaryScopes[this.activeDemographicLevel];
        },
        demographicPanelAgeBins() {
            const source = this.activeDemographicLevel === "variant"
                ? this.variant.variantDemographics
                : this.variant.demographics;

            return source[this.activeDemographic];
        },
        activeDensityGroup() {
            const baseGroup = this.variant.densitySeries[this.activeInvestigator];
            const ageScale = {
                "all-ages": 1,
                "0-1": 0.18,
                "2-4": 0.28,
                "5-12": 0.46,
                "13-18": 0.58,
                adult: 0.38,
            }[this.activeCarrierAge] || 1;

            return Object.keys(baseGroup).reduce((group, key) => {
                group[key] = baseGroup[key].map((count) => {
                    if (this.activeCarrierAge === "all-ages") return count;
                    return Math.max(0, Math.round(count * ageScale));
                });
                const investigatorScale = {
                    "all-investigators": 1,
                    "investigator-1": 0.55,
                    "investigator-2": 0.62,
                    "investigator-3": 0.45,
                }[this.activeInvestigator] || 1;
                const queriedVariantCount = {
                    all: 18,
                    affected: 14,
                    proband: 12,
                }[key];
                group[key][25] = Math.max(
                    1,
                    Math.round(queriedVariantCount * investigatorScale * ageScale),
                );
                return group;
            }, {});
        },
        visibleMarkers() {
            return this.variant.markers.filter((marker) => marker.visibleInWindow);
        },
        renderedDensitySeries() {
            return this.densityModes
                .map((mode) => ({
                    key: mode.key,
                    label: mode.label,
                    bins: this.activeDensityGroup[mode.key],
                    active: this.activeDensity === mode.key,
                }))
                .sort((left, right) => Number(left.active) - Number(right.active));
        },
        phenotypeRows() {
            return this.phenotypeRowsForInvestigator(this.activePhenotypeInvestigator);
        },
        activePhenotypeDetails() {
            return this.variant.phenotypeDetails[this.activePhenotypeCategory] || [];
        },
        demographicAgeBins() {
            const source = this.activeSummaryLevel === "variant"
                ? this.variant.variantDemographics
                : this.variant.demographics;

            return source[this.activeDemographic];
        },
        locusGridStyle() {
            const majorSegments = Math.max(this.variant.axisTicks.length - 1, 1);
            const minorSegments = majorSegments * 10;

            return {
                "--major-step": `${100 / majorSegments}%`,
                "--minor-step": `${100 / minorSegments}%`,
            };
        },
        focusOverlayLeft() {
            const ratio = parseFloat(this.variant.query.focusLeft) / 100;
            return `calc(var(--locus-pad) + (100% - (var(--locus-pad) * 2)) * ${ratio})`;
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
        toggleCarrierSampleContext(sampleId) {
            if (this.carrierContextSelectionType === "phenotypes") return;
            const selectedSampleIds = this.selectedCarrierSampleIds.includes(sampleId)
                ? this.selectedCarrierSampleIds.filter((id) => id !== sampleId)
                : [...this.selectedCarrierSampleIds, sampleId];
            this.selectedCarrierSampleIds = selectedSampleIds;
            if (selectedSampleIds.length) {
                this.syncCarrierContextDraft("samples", selectedSampleIds);
            } else {
                this.closeCarrierContextDraft();
            }
        },
        toggleCarrierPhenotypeContext(label) {
            if (this.carrierContextSelectionType === "samples") return;
            const selectedPhenotypeLabels = this.selectedCarrierPhenotypeLabels.includes(label)
                ? this.selectedCarrierPhenotypeLabels.filter((item) => item !== label)
                : [...this.selectedCarrierPhenotypeLabels, label];
            this.selectedCarrierPhenotypeLabels = selectedPhenotypeLabels;
            if (selectedPhenotypeLabels.length) {
                this.syncCarrierContextDraft("phenotypes", selectedPhenotypeLabels);
            } else {
                this.closeCarrierContextDraft();
            }
        },
        isCarrierSampleContextDisabled(sampleId) {
            return this.carrierContextSelectionType === "phenotypes" && !this.selectedCarrierSampleIds.includes(sampleId);
        },
        isCarrierPhenotypeContextDisabled(label) {
            return this.carrierContextSelectionType === "samples" && !this.selectedCarrierPhenotypeLabels.includes(label);
        },
        clearCarrierContextSelection() {
            this.selectedCarrierSampleIds = [];
            this.selectedCarrierPhenotypeLabels = [];
            this.closeCarrierContextDraft();
        },
        openCarrierContextDraft() {
            if (!this.hasCarrierContextSelection) return;
            const type = this.carrierContextSelectionType;
            this.syncCarrierContextDraft(type, type === "samples" ? this.selectedCarrierSampleIds : this.selectedCarrierPhenotypeLabels);
        },
        syncCarrierContextDraft(type, items) {
            this.carrierContextDraftType = type;
            this.carrierContextDraftItems = [...items];
            this.carrierContextDraftAddValue = "";
            this.carrierContextDraftOpen = true;
        },
        closeCarrierContextDraft() {
            this.carrierContextDraftOpen = false;
            this.carrierContextDraftType = "";
            this.carrierContextDraftItems = [];
            this.carrierContextDraftAddValue = "";
        },
        addCarrierContextDraftItem() {
            if (!this.carrierContextDraftAddValue || this.carrierContextDraftItems.includes(this.carrierContextDraftAddValue)) return;
            const nextItems = [...this.carrierContextDraftItems, this.carrierContextDraftAddValue];
            this.carrierContextDraftItems = nextItems;
            if (this.carrierContextDraftType === "samples") {
                this.selectedCarrierSampleIds = nextItems;
            }
            if (this.carrierContextDraftType === "phenotypes") {
                this.selectedCarrierPhenotypeLabels = nextItems;
            }
            this.carrierContextDraftAddValue = "";
        },
        removeCarrierContextDraftItem(item) {
            const nextItems = this.carrierContextDraftItems.filter((current) => current !== item);
            this.carrierContextDraftItems = nextItems;
            if (this.carrierContextDraftType === "samples") {
                this.selectedCarrierSampleIds = nextItems;
            }
            if (this.carrierContextDraftType === "phenotypes") {
                this.selectedCarrierPhenotypeLabels = nextItems;
            }
        },
        clearCarrierContextDraftItems() {
            this.carrierContextDraftItems = [];
            if (this.carrierContextDraftType === "samples") {
                this.selectedCarrierSampleIds = [];
            }
            if (this.carrierContextDraftType === "phenotypes") {
                this.selectedCarrierPhenotypeLabels = [];
            }
            this.carrierContextDraftAddValue = "";
        },
        confirmCarrierContextDraft() {
            if (!this.carrierContextDraftItems.length) return;
            const type = this.carrierContextDraftType;
            const items = [...this.carrierContextDraftItems];
            const label = type === "samples"
                ? `${items.length} selected ${this.carrierReference.levelLabel} sample${items.length === 1 ? "" : "s"}`
                : `${items.length} selected carrier phenotype item${items.length === 1 ? "" : "s"}`;
            const hpoTerms = type === "phenotypes"
                ? this.hpoTermsFromPhenotypeRows(items)
                : this.hpoTermsFromCarrierProfile();
            writeClinicalFocus({
                source: type === "samples" ? "carrier-sample-selection" : "carrier-phenotype-selection",
                label,
                sourceDetail: type === "samples"
                    ? `Mock context created from selected ${this.carrierReference.levelLabel} samples: ${items.join(", ")}.`
                    : `Mock context created from selected carrier phenotype rows: ${items.join(", ")}.`,
                sourceQuery: items.join(", "),
                hpoTerms,
            });
            this.clinicalFocus = readClinicalFocus();
            this.activeCarrierDetail = "residual";
            if (type === "samples") {
                this.selectedCarrierSampleIds = items;
                this.selectedCarrierPhenotypeLabels = [];
            } else {
                this.selectedCarrierPhenotypeLabels = items;
                this.selectedCarrierSampleIds = [];
            }
            this.closeCarrierContextDraft();
        },
        hpoTermsFromPhenotypeRows(labels) {
            const selectedTerms = labels
                .flatMap((label) => {
                    const categoryTerms = this.variant.phenotypeDetails[label];
                    return categoryTerms ? categoryTerms.map((term) => term.label) : [label];
                });
            return [...new Set(selectedTerms)]
                .slice(0, 12)
                .map((termLabel) => ({
                    id: termLabel.match(/\[(HP:[0-9]+)\]/)?.[1] || "",
                    label: termLabel.replace(/\s*\[HP:[0-9]+\]/, ""),
                }));
        },
        hpoTermsFromCarrierProfile() {
            return this.sortedCarrierPhenotypeCategories
                .flatMap((category) => category.terms || [])
                .slice(0, 12)
                .map((term) => ({
                    id: term.match(/\[(HP:[0-9]+)\]/)?.[1] || "",
                    label: term.replace(/\s*\[HP:[0-9]+\]/, ""),
                }));
        },
        sampleHref(sampleId) {
            return `krSample.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        setSummaryLevel(level) {
            this.activeSummaryLevel = level;
            this.activeDemographicLevel = level;
            this.activePhenotypeCategory = "";
            this.clearCarrierContextSelection();
            this.syncPhenotypeSummaryToResidualGroup();
        },
        setResidualGroup(groupName) {
            this.activeResidualGroupName = groupName;
            this.syncPhenotypeSummaryToResidualGroup();
        },
        syncPhenotypeSummaryToResidualGroup() {
            const investigatorKey = this.residualGroupToInvestigatorKey(this.activeResidualGroupName);
            if (this.phenotypeRowsForInvestigator(investigatorKey).length) {
                this.activePhenotypeInvestigator = investigatorKey;
            }
        },
        residualGroupToInvestigatorKey(groupName) {
            if (!groupName || groupName === "All CRDC") return "all-investigators";
            const normalized = groupName.toLowerCase().replace(/\s+/g, "-");
            return this.investigatorOptions.some((option) => option.key === normalized)
                ? normalized
                : "all-investigators";
        },
        phenotypeRowsForInvestigator(investigatorKey) {
            const source = this.activeSummaryLevel === "variant"
                ? this.variant.variantPhenotypes
                : this.variant.phenotypes;
            return source[investigatorKey] || [];
        },
        selectPhenotypeCategory(label) {
            this.activePhenotypeCategory = label;
        },
        densityBarHeight(count) {
            const max = 20;
            return `${Math.max((count / max) * 100, count > 0 ? 8 : 0)}%`;
        },
        phenotypeCount(percent, denominator) {
            return Math.round((percent / 100) * denominator);
        },
        toggleCarrierDetail(panel) {
            this.activeCarrierDetail = this.activeCarrierDetail === panel ? "" : panel;
            if (this.activeCarrierDetail === "phenotypes") {
                const firstCategory = this.carrierPhenotypeCategories[0];
                this.activePhenotypeCategory = firstCategory ? firstCategory.category : "";
            }
        },
        togglePhenotypeCategory(label) {
            this.activePhenotypeCategory = this.activePhenotypeCategory === label ? "" : label;
        },
        setCarrierSampleSort(key) {
            this.carrierSampleSort = {
                key,
                direction: this.carrierSampleSort.key === key && this.carrierSampleSort.direction === "asc" ? "desc" : "asc",
            };
        },
        setCarrierHpoSort(key) {
            this.carrierHpoSort = {
                key,
                direction: this.carrierHpoSort.key === key && this.carrierHpoSort.direction === "asc" ? "desc" : "asc",
            };
        },
        sortIndicator(type, key) {
            const sortState = type === "sample" ? this.carrierSampleSort : this.carrierHpoSort;
            if (sortState.key !== key) return "↕";
            return sortState.direction === "asc" ? "↑" : "↓";
        },
        residualGroupLabel(group) {
            if (group.name === "All CRDC") return group.extreme;
            const count = this.activeCarrierSamples.filter((sample) => sample.group === group.name).length;
            return `${count} carrier samples`;
        },
        sortRows(rows, key, direction) {
            const ageOrder = { "0-1": 1, "2-4": 2, "5-12": 3, "13-18": 4, Adult: 5 };
            const valueForSort = (row) => {
                if (key === "id") return row.id || "";
                if (key === "topTerms") return (row.topTerms || []).join(" ");
                if (key === "age") return ageOrder[row.age] || row.age || "";
                return row[key] || "";
            };
            return [...rows].sort((left, right) => {
                const leftValue = valueForSort(left);
                const rightValue = valueForSort(right);
                const result = typeof leftValue === "number" && typeof rightValue === "number"
                    ? leftValue - rightValue
                    : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true });
                return direction === "asc" ? result : -result;
            });
        },
    },
};
</script>
