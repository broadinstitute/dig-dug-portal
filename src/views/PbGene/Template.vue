<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body pbg-page">
            <div class="pbg-shell">

                <!-- ── Toolbar ──────────────────────────────────────────── -->
                <div class="pbg-toolbar">
                    <div class="pbg-toolbar-left">
                        <a href="/pb_Front.html" class="pbg-home-link" aria-label="PB portal home">
                            <b-icon-house-door-fill aria-hidden="true"></b-icon-house-door-fill>
                            <span>Home</span>
                        </a>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <span class="pbg-breadcrumb-link">Gene search</span>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <form class="pbg-gene-search-form"
                              role="search"
                              aria-label="Search another gene"
                              :aria-busy="searchGeneLoading ? 'true' : 'false'"
                              @submit.prevent="submitGeneSearch">
                            <input class="pbg-gene-search-input"
                                   v-model.trim="searchGeneQuery"
                                   type="search"
                                   autocomplete="off"
                                   spellcheck="false"
                                   aria-label="Gene symbol"
                                   placeholder="Gene symbol">
                            <button class="pbg-gene-search-submit" type="submit" :disabled="searchGeneLoading">
                                {{ searchGeneLoading ? 'Loading' : 'Search' }}
                            </button>
                            <span v-if="searchGeneError" class="pbg-gene-search-error">{{ searchGeneError }}</span>
                            <span v-if="searchGeneLoading"
                                  class="pbg-gene-search-progress"
                                  role="status"
                                  aria-live="polite">
                                <span class="pbg-loading-spinner" aria-hidden="true"></span>
                                <span class="pbg-loading-text">{{ searchGeneProgress || 'Loading gene evidence' }}</span>
                                <span class="pbg-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                            </span>
                        </form>
                    </div>
                    <div class="pbg-toolbar-right">
                        <a href="/pb_variant.html" class="pbg-nav-link">Variant search</a>
                        <a href="https://a2f.hugeamp.org/"
                           class="pbg-nav-link pbg-nav-link--a2fkp"
                           target="_blank"
                           rel="noopener noreferrer"
                           title="Open the A2F Knowledge Portal">A2FKP</a>
                    </div>
                </div>

                <details class="pbg-context-disclosure">
                    <summary>
                        <strong>HPO Context</strong>
                        <span class="pbg-context-summary-sub">gene burden and carrier matching</span>
                        <span class="pbg-context-summary-pill">
                            {{ contextLoading ? 'Calculating' : activeContextTerms.length ? 'Context active' : 'On-demand tool' }}
                        </span>
                    </summary>
                    <hpo-context-panel
                        :active-context-terms="activeContextTerms"
                        :context-term-details="contextTermDetails"
                        :context-input.sync="contextInput"
                        :context-loading="contextLoading"
                        :context-significance-metric.sync="contextSignificanceMetric"
                        :context-significance-threshold.sync="contextSignificanceThreshold"
                        :context-min-carriers.sync="contextMinCarriers"
                        :external-phenotype-result-url="externalPhenotypeResultUrl"
                        :context-error="contextError"
                        :context-runs="contextRuns"
                        @run="runContextAnalysis"
                    ></hpo-context-panel>
                </details>

                <!-- ══════════════════════════════════════════════════════
                     BLOCK 1 — Gene identity + Primary CRDC evidence
                ═══════════════════════════════════════════════════════════ -->
                <section class="pbg-hero-card">

                    <!-- Left: gene identity + reference annotation (no sample-derived data) -->
                    <gene-identity-panel :gene-info="geneInfo"></gene-identity-panel>

                    <!-- Right: gene-level CRDC summary + representative evidence -->
                    <div class="pbg-hero-summary">
                        <div class="pbg-cohort-strip" aria-label="CRDC cohort denominator">
                            <span>
                                <small>CRDC cohort:</small>
                                <strong>{{ cohortCount(crdcEvidence.crdcCohortCount) }}</strong>
                            </span>
                        </div>

                        <div class="pbg-mini-card-grid">
                            <article class="pbg-mini-card pbg-pheno-spotlight-card">
                                <div class="pbg-mini-card-head">
                                    <div class="pbg-association-heading">
                                        <div class="pbg-association-title-line">
                                            <h2>Top phenotype associations</h2>
                                            <button class="pbg-info-button" type="button" aria-label="About top phenotype associations" aria-describedby="pbg-association-help-hero">
                                                ?
                                                <span id="pbg-association-help-hero" class="pbg-info-tooltip" role="tooltip">
                                                    Shows precomputed binary HPO phenotypes positively associated with higher gene burden scores. OR is per one-unit increase in score. Only results passing p &lt; 0.05 and the configured FDR q threshold are included; negative associations are not displayed.
                                                </span>
                                            </button>
                                        </div>
                                        <p>Positive associations across binary HPO phenotypes</p>
                                    </div>
                                    <span>{{ liveDataLoaded ? 'Precomputed' : 'Preview data' }}</span>
                                </div>
                                <div v-if="topPhenotypeAssociations.length" class="pbg-association-spotlight">
                                    <strong>OR {{ contextStatistic(topPhenotypeAssociations[0].oddsRatio) }}</strong>
                                    <div>
                                        <span>{{ topPhenotypeAssociations[0].label }}</span>
                                        <em>{{ topPhenotypeAssociations[0].hpoId }} · 95% CI {{ contextStatistic(topPhenotypeAssociations[0].ciLow) }}–{{ contextStatistic(topPhenotypeAssociations[0].ciHigh) }}</em>
                                        <small>p {{ contextStatistic(topPhenotypeAssociations[0].pValue) }} · q {{ contextStatistic(topPhenotypeAssociations[0].qValue) }}</small>
                                    </div>
                                </div>
                                <div v-if="topPhenotypeAssociations.length" class="pbg-association-rank-list">
                                    <div v-for="association in topPhenotypeAssociations.slice(1)" :key="association.hpoId" class="pbg-association-rank-row">
                                        <span>{{ association.label }} <small>{{ association.hpoId }}</small></span>
                                        <strong>OR {{ contextStatistic(association.oddsRatio) }}</strong>
                                        <em>p {{ contextStatistic(association.pValue) }}<br>q {{ contextStatistic(association.qValue) }}</em>
                                    </div>
                                </div>
                                <p v-else class="pbg-association-empty">Precomputed phenotype association results have not been connected for this gene.</p>
                            </article>

                            <article class="pbg-mini-card pbg-score-spotlight-card">
                                <section class="pbg-pathogenic-coverage" aria-label="Pathogenic score coverage">
                                    <span class="pbg-pathogenic-coverage-heading">Pathogenic score coverage</span>
                                    <div class="pbg-pathogenic-coverage-metric">
                                        <span class="pbg-pathogenic-coverage-stat">
                                            <strong class="pbg-pathogenic-coverage-value--annotated">{{ predictionAnnotatedVariantCount.toLocaleString() }}</strong>
                                            <small>annotated</small>
                                        </span>
                                        <span class="pbg-pathogenic-coverage-slash" aria-hidden="true">/</span>
                                        <span class="pbg-pathogenic-coverage-stat">
                                            <strong>{{ variantRows.length.toLocaleString() }}</strong>
                                            <small>observed variants</small>
                                        </span>
                                    </div>
                                    <small class="pbg-pathogenic-coverage-sources">LoFTEE · AlphaMissense · REVEL</small>
                                </section>

                                <div v-if="topVariant" class="pbg-severe-variant-section">
                                    <div class="pbg-mini-card-head">
                                        <h2>Most severe observed variant</h2>
                                        <span class="pbg-crdc-badge" title="Source: CRDC cohort">CRDC</span>
                                    </div>
                                    <div class="pbg-score-spotlights">
                                        <div>
                                            <span>Extended Pathogenic Score</span>
                                            <strong>{{ topVariant.topScore.toFixed(2) }}</strong>
                                            <em>{{ topVariant.scoreSource }}</em>
                                        </div>
                                    </div>
                                    <div class="pbg-top-variant-line">
                                        <span>Most severe variant</span>
                                        <a class="pbg-table-link" :href="`/krVariant.html?query=${topVariant.id}`" @click.stop>{{ topVariant.id }}</a>
                                    </div>
                                    <div class="pbg-score-chip-row">
                                        <span>REVEL <strong>{{ topVariant.revel }}</strong></span>
                                        <span>AlphaMissense <strong>{{ topVariant.am }}</strong></span>
                                        <span>LOFTEE <strong>{{ topVariant.loftee }}</strong></span>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                <!-- ══════════════════════════════════════════════════════
                     BLOCK 2 — Gene locus view
                ═══════════════════════════════════════════════════════════ -->
                <section class="pbg-locus-card pbg-window-card" :class="{ 'pbg-window-card--base': isBaseLevel, 'pbg-window-card--whole': isWholeGeneView }">
                    <div class="pbg-window-head">
                        <div class="pbg-locus-title">
                            <strong>{{ geneInfo.symbol }} gene locus ({{ geneInfo.build }})</strong>
                            <span>{{ geneLocusRangeLabel }}</span>
                        </div>
                        <div class="pbg-locus-filterbar">
                            <select v-model="carrierScopeFilter" class="pbg-filter-select pbg-filter-select--scope">
                                <option v-for="option in carrierScopeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                            </select>
                            <select v-model="ageFilter" class="pbg-filter-select">
                                <option v-for="a in availableAges" :key="a" :value="a">{{ a }}</option>
                            </select>
                            <select v-model="investigatorFilter" class="pbg-filter-select">
                                <option v-for="inv in availableInvestigators" :key="inv" :value="inv">{{ inv }}</option>
                            </select>
                            <select v-model="sexFilter" class="pbg-filter-select">
                                <option v-for="option in sexFilterOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                            </select>
                        </div>
                    </div>

                    <div class="pbg-window-canvas"
                         @mousedown="startLocusDrag"
                         @mousemove="moveLocusDrag"
                         @mouseup="endLocusDrag"
                         @mouseleave="endLocusDrag">
                        <div v-if="!isWholeGeneView" class="pbg-window-guide" :style="{ left: queriedGuideLeftPct + '%' }"></div>

                        <div class="pbg-window-major-axis">
                            <span v-for="(tick, tickIndex) in locusMajorTicks" :key="'major-' + tickIndex + '-' + tick.pos"
                                  :class="'pbg-window-axis-tick--' + tick.edge"
                                  :style="{ left: tick.leftPct + '%' }">{{ tick.label }}</span>
                        </div>
                        <div v-if="isBaseLevel" class="pbg-window-minor-axis">
                            <span v-for="tick in locusMinorTicks" :key="'minor-' + tick.pos"
                                  :style="{ left: tick.leftPct + '%' }">{{ tick.label }}</span>
                        </div>

                        <div class="pbg-window-row pbg-window-row--gene">
                            <div class="pbg-window-track-label">
                                <strong>{{ geneInfo.symbol }}</strong>
                            </div>
                            <div class="pbg-window-gene-track">
                                <div class="pbg-window-intron-line"
                                     :class="geneInfo.strand === '-' ? 'pbg-window-intron-line--rev' : 'pbg-window-intron-line--fwd'"></div>
                                <button v-for="exon in winExons" :key="'win-exon-' + exon.label"
                                        class="pbg-window-exon-block"
                                        :class="{ 'pbg-window-exon-block--query': exon.queried }"
                                        :style="{ left: exon.left, width: exon.width }"
                                        :title="exon.label"
                                        type="button"
                                        @mousedown.stop>
                                    <span class="pbg-window-exon-label">{{ exon.label.replace('E', '') }}</span>
                                </button>
                                <div v-if="geneTrackSequenceMode"
                                     class="pbg-window-sequence-lane"
                                     :class="'pbg-window-sequence-lane--' + geneTrackSequenceMode">
                                    <template v-if="geneTrackSequenceMode === 'base'">
                                        <span v-for="b in geneTrackBases" :key="'track-base-' + b.pos"
                                              class="pbg-window-seq-base"
                                              :class="{ 'pbg-window-seq-base--query': b.isVariant }"
                                              :style="{ left: b.leftPct + '%', width: b.widthPct + '%' }">
                                            <strong>{{ b.base }}</strong>
                                            <small v-if="b.isVariant">{{ b.alt }}</small>
                                        </span>
                                    </template>
                                    <template v-else>
                                        <span v-for="codon in geneTrackCodons" :key="'track-codon-' + codon.codonStart"
                                              class="pbg-window-seq-codon"
                                              :class="{ 'pbg-window-seq-codon--query': codon.isQueried }"
                                              :style="{ left: codon.leftPct + '%', width: codon.widthPct + '%' }">
                                            <strong>{{ codon.bases }}</strong>
                                            <em>{{ codon.aa }}</em>
                                        </span>
                                    </template>
                                </div>
                                <div v-if="!isWholeGeneView" class="pbg-window-gene-name">{{ geneInfo.symbol }}</div>
                            </div>
                        </div>

                        <div class="pbg-window-row pbg-window-row--variants">
                            <div class="pbg-window-track-label">
                                <strong>Variant positions</strong>
                                <span>{{ locusWindowPositionCount.toLocaleString() }} positions · {{ locusWindowVariantCount.toLocaleString() }} variants in view</span>
                            </div>
                            <div class="pbg-window-variant-track">
                                <button v-for="m in locusVariantMarkerItems" :key="'variant-marker-' + m.id"
                                        class="pbg-window-variant-dot"
                                        :class="{ 'pbg-window-variant-dot--query': m.isQueried, 'pbg-window-variant-dot--clustered': m.clusterSize > 1 }"
                                        :style="{ left: m.leftPct + '%', top: (m.yIndex * 0.42) + 'rem', '--x-nudge': m.xNudge + 'px' }"
                                        :title="m.title"
                                        type="button"
                                        @mousedown.stop
                                        @click.stop="selectQueriedVariant(m.id, false)">
                                    <span></span>
                                </button>
                            </div>
                        </div>

                        <div v-if="isBaseLevel" class="pbg-window-query-callout" :style="{ left: queriedGuideLeftPct + '%' }">
                            <span>{{ queriedVariantShortLabel }}</span>
                            <i></i>
                            <strong>{{ queriedVariantDisplayLabel }}</strong>
                        </div>

                        <div class="pbg-window-row pbg-window-row--density">
                            <div class="pbg-window-track-label">
                                <strong>Distinct carriers</strong>
                                <span v-if="locusWindowDistinctCarrierCount != null">{{ locusWindowDistinctCarrierCount.toLocaleString() }} people in view</span>
                                <span v-else>Unavailable for this view</span>
                            </div>
                            <div class="pbg-window-density-plot" :style="{ height: locusDensityPlotHeightPx + 'px' }">
                                <button v-for="(col, colIndex) in locusDensityColumns" :key="'density-col-' + colIndex + '-' + col.pos"
                                        class="pbg-window-density-col"
                                        :class="{ 'pbg-window-density-col--query': col.isQueried, 'pbg-window-density-col--zero': col.count === 0 }"
                                        :style="{ left: col.leftPct + '%', width: col.widthPct + '%', height: col.heightPx + 'px' }"
                                        :title="col.title"
                                        type="button"
                                        @mousedown.stop
                                        @click.stop="col.variantIds.length && selectQueriedVariant(col.variantIds[0], true)">
                                    <span v-if="col.count > 0">{{ col.count }}</span>
                                </button>
                                <div class="pbg-window-density-axis">
                                    <span v-for="tick in locusDensityAxisTicks" :key="'density-axis-' + tick">{{ tick }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pbg-locus-bottom-row">
                        <div class="pbg-locus-legend">
                            <span><i class="pbg-locus-legend-exon"></i>Exon</span>
                            <span><i class="pbg-locus-legend-intron"></i>Intron</span>
                            <span><i class="pbg-locus-legend-variant"></i>Variant</span>
                        </div>
                        <div class="pbg-zoom-controls" role="group" aria-label="Locus zoom">
                            <button class="pbg-zoom-btn" type="button" @click="setLocusView('gene')" title="Show whole gene">Full</button>
                            <button class="pbg-zoom-btn" type="button" @click="zoomOut" :disabled="zoomLevel <= 1" title="Zoom out">−</button>
                            <span class="pbg-zoom-label">{{ winLabel }}</span>
                            <button class="pbg-zoom-btn" type="button" @click="zoomIn" :disabled="zoomLevel >= maxZoomLevel" title="Zoom in">+</button>
                        </div>
                    </div>
                </section>

                <!-- ══════════════════════════════════════════════════════
                     BLOCK 3 — Gene / variant carrier evidence
                ═══════════════════════════════════════════════════════════ -->
                <section class="pbg-variants-card pbg-evidence-card">
                    <div class="pbg-evidence-summary-head">
                        <div>
                            <p class="pbg-section-label">
                                {{ geneTab === 'variant' && selectedEvidenceVariant ? 'Variant-level carrier summary' : 'Gene-level carrier summary' }}
                                <span class="pbg-crdc-badge" title="Source: CRDC cohort">CRDC</span>
                            </p>
                            <strong v-if="geneTab === 'variant' && selectedEvidenceVariant">
                                {{ selectedEvidenceVariant.id }} · {{ selectedEvidenceVariant.carrierCount }} carriers
                            </strong>
                            <strong v-else>
                                {{ geneInfo.symbol }} · {{ totalGeneCarriers }} distinct people with at least one observed variant
                            </strong>
                        </div>
                        <div class="pbg-summary-mode">
                            <span>Click a variant row below to switch to variant summary.</span>
                            <button class="pbg-mode-check"
                                    :class="{ 'pbg-mode-check--active': geneTab === 'gene' || !selectedEvidenceVariant }"
                                    type="button"
                                    @click="setGeneTab('gene')">
                                <i></i> Gene
                            </button>
                            <button class="pbg-mode-check"
                                    :class="{ 'pbg-mode-check--active': geneTab === 'variant' && selectedEvidenceVariant }"
                                    :disabled="!selectedEvidenceVariant"
                                    type="button"
                                    @click="setGeneTab('variant')">
                                <i></i> Variant
                            </button>
                        </div>
                    </div>

                    <details class="pbg-context-disclosure pbg-summary-panels-disclosure">
                        <summary>
                            <strong>Carrier summary details</strong>
                            <span class="pbg-context-summary-sub">3 panels</span>
                        </summary>
                        <div class="pbg-summary-panel-grid">
                        <article class="pbg-summary-card"
                                 :class="{ 'pbg-summary-card--expanded': isSummaryCardExpanded('phenotype') }">
                            <div class="pbg-summary-card-head">
                                <div class="pbg-association-heading">
                                    <div class="pbg-association-title-line">
                                        <strong>Top phenotype associations</strong>
                                        <button class="pbg-info-button pbg-info-button--small" type="button" aria-label="About phenotype association results" aria-describedby="pbg-association-help-summary">
                                            ?
                                            <span id="pbg-association-help-summary" class="pbg-info-tooltip" role="tooltip">
                                                Gene-level results are precomputed outside the portal. OR is the change in phenotype odds per one-unit increase in gene burden score. Only positive associations passing the configured p-value and FDR q-value thresholds are shown.
                                            </span>
                                        </button>
                                    </div>
                                    <p>Gene-level · binary HPO phenotypes</p>
                                </div>
                                <span>{{ phenotypeAssociationCardLabel }}</span>
                            </div>
                            <div class="pbg-summary-card-body pbg-summary-association-table">
                                <div v-if="summaryAssociationRows.length" class="pbg-summary-association-head" aria-hidden="true">
                                    <span>Phenotype</span><span>OR</span><span>p</span><span>q</span>
                                </div>
                                <div v-for="association in summaryAssociationRows"
                                     :key="'summary-association-' + association.hpoId"
                                     class="pbg-summary-association-row">
                                    <span>{{ association.label }} <small>{{ association.hpoId }}</small></span>
                                    <strong>{{ contextStatistic(association.oddsRatio) }}</strong>
                                    <span>{{ contextStatistic(association.pValue) }}</span>
                                    <span>{{ contextStatistic(association.qValue) }}</span>
                                </div>
                                <p v-if="!summaryAssociationRows.length" class="pbg-empty-note">Precomputed association results are not available yet.</p>
                            </div>
                            <div v-if="summaryAssociationHiddenCount" class="pbg-summary-card-foot">
                                <button class="pbg-summary-more-btn" type="button" @click="toggleSummaryCard('phenotype')">
                                    {{ isSummaryCardExpanded('phenotype') ? 'Show less' : '+' + summaryAssociationHiddenCount + ' more associations' }}
                                </button>
                            </div>
                        </article>

                        <article class="pbg-summary-card"
                                 :class="{ 'pbg-summary-card--expanded': isSummaryCardExpanded('genotype') }">
                            <button class="pbg-summary-card-head pbg-summary-card-head--button"
                                    type="button"
                                    :aria-expanded="isSummaryCardExpanded('genotype') ? 'true' : 'false'"
                                    @click="toggleSummaryCard('genotype')">
                                <strong>Carrier genotype profile</strong>
                                <span>{{ summaryCoCarrierCardLabel }}</span>
                            </button>
                            <div class="pbg-summary-card-body pbg-summary-mini-table">
                                <div class="pbg-summary-mini-head">
                                    <span>Co-carrier gene</span>
                                    <span>Carriers</span>
                                    <span>% overlap</span>
                                </div>
                                <div v-for="gene in summaryCoCarrierGenesVisible" :key="'summary-gene-' + gene.gene" class="pbg-summary-mini-row">
                                    <a class="pbg-table-link" :href="`/pb_Gene.html?query=${gene.gene}`" @click.stop>{{ gene.gene }}</a>
                                    <span>{{ gene.count }}</span>
                                    <span>{{ Math.round(gene.count / Math.max(gene.denominator || summaryCarrierTotal, 1) * 100) }}%</span>
                                </div>
                                <p v-if="!summaryCoCarrierGenesVisible.length" class="pbg-empty-note">No co-carrier gene summary</p>
                            </div>
                            <div v-if="summaryCoCarrierHiddenCount" class="pbg-summary-card-foot">
                                <button class="pbg-summary-more-btn" type="button" @click="toggleSummaryCard('genotype')">
                                    {{ isSummaryCardExpanded('genotype') ? 'Show less' : '+' + summaryCoCarrierHiddenCount + ' more genes' }}
                                </button>
                            </div>
                        </article>

                        <article class="pbg-summary-card pbg-summary-card--demo"
                                 :class="{ 'pbg-summary-card--expanded': isSummaryCardExpanded('demographics') }">
                            <button class="pbg-summary-card-head pbg-summary-card-head--button"
                                    type="button"
                                    :aria-expanded="isSummaryCardExpanded('demographics') ? 'true' : 'false'"
                                    @click="toggleSummaryCard('demographics')">
                                <strong>Carrier demographics</strong>
                                <span>{{ summaryCarrierTotal }} carriers</span>
                            </button>
                            <div v-if="summaryCarrierDemographicsHasRows" class="pbg-summary-card-body pbg-summary-demo-grid">
                                <div>
                                    <p>By age</p>
                                    <div v-for="row in summaryCarrierDemographicsVisible.byAge" :key="'age-' + row.band" class="pbg-summary-demo-row">
                                        <span>{{ row.band }}</span>
                                        <i><b :style="{ width: summaryDemoBarWidth(row.count) }"></b></i>
                                        <strong>{{ row.count }}</strong>
                                    </div>
                                </div>
                                <div>
                                    <p>By investigator</p>
                                    <div v-for="row in summaryCarrierDemographicsVisible.byInvestigator" :key="'inv-' + row.inv" class="pbg-summary-demo-row">
                                        <span>{{ row.inv }}</span>
                                        <i><b class="pbg-demo-fill--inv" :style="{ width: summaryDemoBarWidth(row.count) }"></b></i>
                                        <strong>{{ row.count }}</strong>
                                    </div>
                                </div>
                                <div>
                                    <p>By sex</p>
                                    <div v-for="row in summaryCarrierDemographicsVisible.bySex" :key="'sex-' + row.label" class="pbg-summary-demo-row">
                                        <span>{{ row.label }}</span>
                                        <i><b class="pbg-demo-fill--sex" :style="{ width: summaryDemoBarWidth(row.count) }"></b></i>
                                        <strong>{{ row.count }}</strong>
                                    </div>
                                    <p>Affected / proband</p>
                                    <div v-for="row in summaryCarrierDemographicsVisible.byAffected" :key="'aff-' + row.label" class="pbg-summary-demo-row">
                                        <span>{{ row.label }}</span>
                                        <i><b class="pbg-demo-fill--aff" :style="{ width: summaryDemoBarWidth(row.count) }"></b></i>
                                        <strong>{{ row.count }}</strong>
                                    </div>
                                </div>
                            </div>
                            <p v-else class="pbg-empty-note pbg-summary-empty-note">No sample metadata available</p>
                            <div v-if="summaryCarrierDemographicsHiddenCount" class="pbg-summary-card-foot">
                                <button class="pbg-summary-more-btn" type="button" @click="toggleSummaryCard('demographics')">
                                    {{ isSummaryCardExpanded('demographics') ? 'Show less' : '+' + summaryCarrierDemographicsHiddenCount + ' more rows' }}
                                </button>
                            </div>
                        </article>
                        </div>
                    </details>

                    <div class="pbg-variant-evidence-block">
                        <div class="pbg-variant-evidence-head">
                            <p class="pbg-section-label">
                                Variant evidence for {{ geneInfo.symbol }}
                                <span class="pbg-crdc-badge" title="Source: CRDC cohort">CRDC</span>
                            </p>
                            <span>{{ variantRows.length }} distinct variants · each observed in at least one carrier</span>
                        </div>

                        <div class="pbg-ve-table-head">
                            <span></span>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('variant')">
                                <i>{{ variantSortIndicator('variant') }}</i><span>Variant</span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('carriers')">
                                <i>{{ variantSortIndicator('carriers') }}</i><span>Carriers (affected)</span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('crdcAF')">
                                <i>{{ variantSortIndicator('crdcAF') }}</i><span>CRDC carrier frequency</span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('classification')">
                                <i>{{ variantSortIndicator('classification') }}</i><span>Classification</span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('variantScore')">
                                <i>{{ variantSortIndicator('variantScore') }}</i><span>Burden Pathogenic Score <em>CRDC</em></span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('matchScore')">
                                <i>{{ variantSortIndicator('matchScore') }}</i>
                                <span>
                                    Match Score (Context-based)
                                    <abbr class="pbg-score-help"
                                          title="Mean residual PheRS across the unique carriers of this variant for the selected HPO context. No partial mean is shown when any carrier score is missing."
                                          aria-label="Match Score calculation: mean residual PheRS across unique carriers of this variant for the selected HPO context."
                                          @click.stop>?</abbr>
                                    <em>CRDC</em>
                                </span>
                            </button>
                        </div>
                        <p class="pbg-score-legend">
                            <strong>—*</strong> REVEL available; excluded from this score.
                            <span><strong>—</strong> No LoFTEE HC, AlphaMissense, or REVEL annotation.</span>
                        </p>

                        <template v-for="row in visibleVariantRows">
                            <div :key="row.id"
                                 :data-variant-id="row.id"
                                 class="pbg-ve-row"
                                 :class="{ 'pbg-ve-row--expanded': expandedVariantId === row.id, 'pbg-ve-row--af-warning': variantHasHighAf(row) }"
                                 @click="toggleVariant(row.id)">
                                <span class="pbg-ve-chevron">{{ expandedVariantId === row.id ? '⌄' : '›' }}</span>
                                <span class="pbg-variant-id">
                                    {{ row.id }}<sup v-if="variantHasHighAf(row)" class="pbg-af-star" :title="variantAfWarningText(row)">*</sup>
                                </span>
                                <span class="pbg-ve-carriers">
                                    {{ row.carrierCount }}
                                    <small v-if="variantAffectedCount(row)">({{ variantAffectedCount(row) }} affected)</small>
                                </span>
                                <span class="pbg-ve-af">
                                    <span :class="{ 'pbg-unavailable-inline': isUnavailableValue(crdcAF(row)) }">{{ crdcAF(row) }}</span>
                                    <small v-if="variantHasHighAf(row)" class="pbg-af-warning-badge" :title="variantAfWarningText(row)">High AF</small>
                                </span>
                                <span class="pbg-ve-classification">
                                    <span class="pbg-clinvar-badge" :class="pathogenicityClass(variantClassification(row))">
                                        {{ variantClassification(row) }}
                                    </span>
                                    <small>{{ row.consequence }}</small>
                                </span>
                                <span>
                                    <strong class="pbg-score-badge"
                                            :class="variantScoreClass(row)"
                                            :title="variantScoreTitle(row)">
                                        {{ variantScoreDisplay(row) }}<sup v-if="hasRevelOnlyScore(row)" class="pbg-revel-only-star">*</sup>
                                    </strong>
                                </span>
                                <span v-if="!activeContextTerms.length" class="pbg-no-context">no context</span>
                                <strong v-else-if="row.phenotypeMatchScore != null" class="pbg-score-badge">
                                    {{ row.phenotypeMatchScore.toFixed(2) }}
                                </strong>
                                <span v-else class="pbg-no-context" :title="row.phenotypeMatchStatus || ''">Unavailable</span>
                            </div>

                            <div v-if="expandedVariantId === row.id"
                                 :key="row.id + '-details'"
                                 class="pbg-variant-expanded">
                                <div class="pbg-selected-variant-evidence">
                                    <div class="pbg-selected-variant-head">
                                        <p class="pbg-section-label">Selected variant evidence</p>
                                        <a class="pbg-nav-link pbg-nav-link--variant-page"
                                           :href="`/pb_variant.html?query=${row.id}&gene=${geneInfo.symbol}`"
                                           @click.stop>Variant ↗</a>
                                    </div>
                                    <div v-if="variantHasHighAf(row)" class="pbg-af-warning-note">
                                        <strong>* High AF review</strong>
                                        <span>{{ variantAfWarningText(row) }}</span>
                                    </div>
                                    <div class="pbg-selected-kv">
                                        <div v-for="item in variantEvidenceRows(row)" :key="'evidence-' + item.label" class="pbg-selected-kv-row">
                                            <span>{{ item.label }}</span>
                                            <a v-if="item.href" class="pbg-ext-link"
                                               :class="[
                                                   item.label === 'ClinVar' ? 'pbg-selected-clinvar' : '',
                                                   item.label === 'ClinVar' ? pathogenicityClass(item.value) : ''
                                               ]"
                                               :href="item.href" target="_blank" rel="noopener noreferrer"
                                               @click.stop>{{ item.value }} ↗</a>
                                            <strong v-else
                                                    :class="[
                                                        item.label === 'ClinVar' ? 'pbg-selected-clinvar' : '',
                                                        item.label === 'ClinVar' ? pathogenicityClass(item.value) : ''
                                                    ]">
                                                {{ item.value }}<sup v-if="item.label === 'REVEL' && hasRevelOnlyScore(row)"
                                                                    class="pbg-revel-only-star"
                                                                    title="REVEL is available but excluded from Burden Pathogenic Score.">*</sup>
                                            </strong>
                                        </div>
                                    </div>
                                    <p v-if="hasRevelOnlyScore(row)" class="pbg-revel-only-note">
                                        <strong>*</strong> REVEL is available for reference but excluded from Burden Pathogenic Score.
                                    </p>
                                </div>

                                <div class="pbg-selected-carriers">
                                    <p class="pbg-section-label">Carrier samples - {{ row.carrierCount }} total</p>
                                    <div class="pbg-selected-sample-table">
                                        <div class="pbg-selected-sample-head">
                                            <span>Sample</span>
                                            <span>Age</span>
                                            <span>Sex</span>
                                            <span>GT</span>
                                            <span>Co-genes</span>
                                            <span>Investigator</span>
                                            <span>Affected</span>
                                            <span>Proband</span>
                                            <span>GenDx</span>
                                        </div>
                                        <div v-for="s in visibleCarrierRows(row)" :key="row.id + '-' + s.id" class="pbg-selected-sample-row">
                                            <a class="pbg-sample-link" :href="`/krSample.html?query=${s.id}`" @click.stop>{{ s.id }}</a>
                                            <span>{{ s.age }}</span>
                                            <span>{{ s.sex }}</span>
                                            <span>{{ s.gt }}</span>
                                            <div class="pbg-co-gene-cell">
                                                <span>{{ coGenePreview(s.genes) }}</span>
                                                <details v-if="coGeneRemaining(s.genes).length">
                                                    <summary>+{{ coGeneRemaining(s.genes).length }} more</summary>
                                                    <span>{{ coGeneRemaining(s.genes).join(', ') }}</span>
                                                </details>
                                            </div>
                                            <span>{{ s.group }}</span>
                                            <span>{{ s.affected }}</span>
                                            <span>{{ s.proband }}</span>
                                            <span :class="{ 'pbg-gendx-conflict': s.gendxConflict }"
                                                  :title="s.gendxNote || s.gendx || '-'">{{ s.gendx || '-' }}</span>
                                        </div>
                                    </div>
                                    <button v-if="(showCountCarrierMap[row.id] || 5) < row.carrierSamples.length"
                                            class="pbg-show-more-btn" type="button"
                                            @click.stop="showMoreCarriers(row.id, row.carrierSamples.length)">
                                        +5 more ({{ row.carrierSamples.length - (showCountCarrierMap[row.id] || 5) }} remaining)
                                    </button>
                                </div>
                            </div>
                        </template>
                        <button v-if="hiddenVariantCount"
                                class="pbg-show-more-btn pbg-show-more-btn--variants"
                                type="button"
                                @click.stop="showMoreVariants">
                            +5 more ({{ hiddenVariantCount }} remaining)
                        </button>
                    </div>
                </section>

            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import { createPbGeneState, pbGeneComputed, pbGeneMethods } from "./pageModel";
import GeneIdentityPanel from "./GeneIdentityPanel";
import HpoContextPanel from "./HpoContextPanel";
import affectedIcon from "./affected.png";
import probandsIcon from "./proband.png";
import variantsIcon from "./variants.png";
import "./style.css";

const metricIcons = {
    affected: affectedIcon,
    probands: probandsIcon,
    variants: variantsIcon,
};

export default {
    name: "PbGeneTemplate",
    components: { GeneIdentityPanel, HpoContextPanel },
    data() {
        return {
            ...createPbGeneState(),
            metricIcons,
        };
    },
    mounted() {
        this.loadLiveGeneData(this.searchGeneQuery, false).catch(() => {});
    },
    computed: pbGeneComputed,
    methods: pbGeneMethods,
};
</script>
