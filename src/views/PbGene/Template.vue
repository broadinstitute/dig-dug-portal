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
                        <a href="/pb_phenotype.html" class="pbg-nav-link">Phenotype</a>
                    </div>
                </div>

                <details class="pbg-context-disclosure" open>
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
                        :context-loading="contextLoading || searchGeneLoading"
                        :context-score-type.sync="contextScoreType"
                        :context-analysis-set.sync="contextAnalysisSet"
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
                                                    Shows the gene–HPO rows and order supplied by the precomputed browser release. Displayed OR and 95% CI are approximate effects per 0.1-point increase in gene burden score. q is adjusted across genes within each HPO.
                                                </span>
                                            </button>
                                        </div>
                                        <p>Precomputed associations across binary HPO phenotypes</p>
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
                                            <small>indexed variants</small>
                                        </span>
                                    </div>
                                    <small class="pbg-pathogenic-coverage-sources">LoFTEE · AlphaMissense · REVEL</small>
                                </section>

                                <div v-if="topVariant" class="pbg-severe-variant-section">
                                    <div class="pbg-mini-card-head">
                                        <h2>Highest scored indexed variant</h2>
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
                                        <a class="pbg-table-link" :href="`/pb_variant.html?query=${encodeURIComponent(topVariant.id)}&gene=${encodeURIComponent(geneInfo.symbol)}`" @click.stop>{{ topVariant.id }}</a>
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
                            <select v-model="carrierScopeFilter" aria-label="Carrier scope" class="pbg-filter-select pbg-filter-select--scope">
                                <option v-for="option in carrierScopeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                            </select>
                            <select v-model="ageFilter" aria-label="Carrier age" class="pbg-filter-select">
                                <option v-for="a in availableAges" :key="a" :value="a">{{ a }}</option>
                            </select>
                            <select v-model="investigatorFilter" aria-label="Carrier investigator" class="pbg-filter-select">
                                <option v-for="inv in availableInvestigators" :key="inv" :value="inv">{{ inv }}</option>
                            </select>
                            <select v-model="sexFilter" aria-label="Carrier sex" class="pbg-filter-select">
                                <option v-for="option in sexFilterOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                            </select>
                        </div>
                    </div>
                    <p v-if="locusFilterActive && (locusFilterProgress || locusFilterError)" class="pbg-locus-filter-status" role="status">{{ locusFilterError || locusFilterProgress }}</p>

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
                                <div v-if="genomeWindow.exons.length" class="pbg-window-intron-line"
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
                                <span v-if="locusWindowDistinctCarrierCount != null">{{ locusWindowDistinctCarrierCount.toLocaleString() }} people in view{{ locusFilterActive && locusFilterResult && locusFilterResult.status !== 'ready' ? ' (partial)' : '' }}</span>
                                <span v-else>{{ locusFilterProgress || 'Unavailable for this view' }}</span>
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
                            <h2 class="pbg-carrier-evidence-title">{{ geneInfo.symbol }} carrier evidence <span class="pbg-crdc-badge" title="Source: CRDC cohort">CRDC</span></h2>
                            <p class="pbg-carrier-evidence-scope" v-if="geneTab === 'variant' && selectedEvidenceVariant">
                                Scope: carriers of <code>{{ selectedEvidenceVariant.id }}</code>
                                <strong>{{ Number(selectedEvidenceVariant.carrierCount || 0).toLocaleString() }}</strong> carriers
                                <button type="button" @click="setGeneTab('gene')">Back to gene level</button>
                            </p>
                            <p class="pbg-carrier-evidence-scope" v-else>Scope: all <strong>{{ variantRows.length.toLocaleString() }}</strong> variants with carriers</p>
                        </div>
                        <div class="pbg-summary-mode">
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

                    <section class="pbg-summary-band" aria-label="Carrier summary details">
                        <CarrierSummaryKpis :summary="activeCarrierSummary" :carrier-count="Number(summaryCarrierTotal) || 0"
                                            :gene-carrier-count="Number(totalGeneCarriers) || 0" :gene-symbol="geneInfo.symbol"
                                            :variant-id="geneTab === 'variant' && selectedEvidenceVariant ? selectedEvidenceVariant.id : ''"
                                            :association="genePhenotypeAssociations[0] || null" :co-carrier-genes="summaryCoCarrierGenes" />
                        <div class="pbg-summary-panel-grid">
                        <article class="pbg-summary-card">
                            <div class="pbg-summary-card-head">
                                <div class="pbg-association-heading">
                                    <div class="pbg-association-title-line">
                                        <strong>Top phenotype associations</strong>
                                        <button class="pbg-info-button pbg-info-button--small" type="button" aria-label="About phenotype association results" aria-describedby="pbg-association-help-summary">
                                            ?
                                            <span id="pbg-association-help-summary" class="pbg-info-tooltip" role="tooltip">
                                                Gene-level rows and rank come from the precomputed browser release. Displayed OR and 95% CI are approximate effects per 0.1-point increase in gene burden score. q is adjusted across genes within each HPO.
                                            </span>
                                        </button>
                                    </div>
                                    <p>Gene-level · binary HPO phenotypes</p>
                                </div>
                                <span>{{ phenotypeAssociationCardLabel }}</span>
                            </div>
                            <div class="pbg-summary-card-body pbg-summary-association-table">
                                <div v-if="summaryAssociationRows.length" class="pbg-summary-association-head">
                                    <button class="pbg-summary-sort" type="button" @click="sortSummaryColumn('phenotype', 'label')">Phenotype <i>{{ summarySortIndicator('phenotype', 'label') }}</i></button>
                                    <button class="pbg-summary-sort" type="button" @click="sortSummaryColumn('phenotype', 'oddsRatio')">OR <i>{{ summarySortIndicator('phenotype', 'oddsRatio') }}</i></button>
                                    <button class="pbg-summary-sort" type="button" @click="sortSummaryColumn('phenotype', 'pValue')">p <i>{{ summarySortIndicator('phenotype', 'pValue') }}</i></button>
                                    <button class="pbg-summary-sort" type="button" title="Adjusted across genes within each HPO" @click="sortSummaryColumn('phenotype', 'qValue')">q <i>{{ summarySortIndicator('phenotype', 'qValue') }}</i></button>
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
                            <div v-if="summaryAssociationPageCount > 1" class="pbg-summary-card-foot">
                                <SummaryPager :page="summaryPages.phenotype" :total-pages="summaryAssociationPageCount" label="Phenotype association pages" input-id="pb-gene-association-page" @change="setSummaryPage('phenotype', $event)" />
                            </div>
                        </article>

                        <article class="pbg-summary-card">
                            <div class="pbg-summary-card-head">
                                <strong>Carrier genotype profile</strong>
                                <span>{{ summaryCoCarrierCardLabel }}</span>
                            </div>
                            <div class="pbg-summary-card-body pbg-summary-mini-table">
                                <div class="pbg-summary-mini-head">
                                    <button class="pbg-summary-sort" type="button" @click="sortSummaryColumn('genotype', 'gene')">Co-carrier gene <i>{{ summarySortIndicator('genotype', 'gene') }}</i></button>
                                    <button class="pbg-summary-sort" type="button" @click="sortSummaryColumn('genotype', 'count')">Carriers <i>{{ summarySortIndicator('genotype', 'count') }}</i></button>
                                    <button class="pbg-summary-sort" type="button" title="Carriers whose samples-info genes include this co-carrier gene, divided by all carriers of the current gene or selected variant. Missing metadata can lower this percentage." @click="sortSummaryColumn('genotype', 'overlap')">% overlap <i>{{ summarySortIndicator('genotype', 'overlap') }}</i></button>
                                </div>
                                <div v-for="gene in summaryCoCarrierGenesVisible" :key="'summary-gene-' + gene.gene" class="pbg-summary-mini-row">
                                    <a class="pbg-table-link" :href="`/pb_Gene.html?query=${gene.gene}`" @click.stop>{{ gene.gene }}</a>
                                    <span>{{ gene.count }}</span>
                                    <span>{{ activeCarrierSummary && activeCarrierSummary.status === 'ready' ? `${Math.round(gene.count / Math.max(gene.denominator || summaryCarrierTotal, 1) * 100)}%` : '—' }}</span>
                                </div>
                                <p v-if="!summaryCoCarrierGenesVisible.length" class="pbg-empty-note">{{ activeCarrierSummaryStatus || 'No co-carrier gene summary' }}</p>
                                <p v-else-if="activeCarrierSummaryStatus" class="pbg-empty-note">{{ activeCarrierSummaryStatus }}</p>
                            </div>
                            <div v-if="summaryCoCarrierPageCount > 1" class="pbg-summary-card-foot">
                                <SummaryPager :page="summaryPages.genotype" :total-pages="summaryCoCarrierPageCount" label="Co-carrier gene pages" input-id="pb-gene-cocarrier-page" @change="setSummaryPage('genotype', $event)" />
                            </div>
                        </article>

                        <article class="pbg-summary-card pbg-summary-card--demo">
                            <div class="pbg-summary-card-head">
                                <strong>Carrier demographics</strong>
                                <span>{{ activeCarrierSummary ? `${activeCarrierSummary.matchedMetadataCount}/${activeCarrierSummary.carrierTotal} metadata records` : `${summaryCarrierTotal} carriers` }}</span>
                            </div>
                            <div v-if="summaryCarrierDemographicsHasRows" class="pbg-summary-card-body pbg-summary-demo-grid">
                                <div class="pbg-summary-demo-investigators">
                                    <p class="pbg-summary-demo-heading"><button class="pbg-summary-sort pbg-summary-demo-sort" type="button" @click="sortSummaryColumn('investigator', 'inv')">By investigator <i>{{ summarySortIndicator('investigator', 'inv') }}</i></button><button class="pbg-summary-sort pbg-summary-demo-sort" type="button" @click="sortSummaryColumn('investigator', 'count')">Count <i>{{ summarySortIndicator('investigator', 'count') }}</i></button></p>
                                    <div v-for="row in summaryCarrierDemographicsVisible.byInvestigator" :key="'inv-' + row.inv" class="pbg-summary-demo-row">
                                        <span :title="row.inv">{{ row.inv }}</span>
                                        <i><b class="pbg-demo-fill--inv" :style="{ width: summaryDemoBarWidth(row.count) }"></b></i>
                                        <strong>{{ row.count }}</strong>
                                    </div>
                                    <SummaryPager v-if="summaryInvestigatorPageCount > 1" compact class="pbg-summary-investigator-pager"
                                                  :page="summaryPages.investigator" :total-pages="summaryInvestigatorPageCount"
                                                  label="Investigator pages" input-id="pb-gene-investigator-page"
                                                  @change="setSummaryPage('investigator', $event)" />
                                </div>
                                <div>
                                    <p>By age</p>
                                    <div v-for="row in summaryCarrierDemographicsVisible.byAge" :key="'age-' + row.band" class="pbg-summary-demo-row">
                                        <span>{{ row.band }}</span>
                                        <i><b :style="{ width: summaryDemoBarWidth(row.count) }"></b></i>
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
                                    <p>Affected</p>
                                    <div v-for="row in summaryCarrierDemographicsVisible.byAffected" :key="'aff-' + row.label" class="pbg-summary-demo-row">
                                        <span>{{ row.label }}</span>
                                        <i><b class="pbg-demo-fill--aff" :style="{ width: summaryDemoBarWidth(row.count) }"></b></i>
                                        <strong>{{ row.count }}</strong>
                                    </div>
                                </div>
                            </div>
                            <p v-else class="pbg-empty-note pbg-summary-empty-note">{{ activeCarrierSummaryStatus || 'No sample metadata available' }}</p>
                            <p v-if="summaryCarrierDemographicsHasRows && activeCarrierSummaryStatus" class="pbg-empty-note pbg-summary-empty-note">{{ activeCarrierSummaryStatus }}</p>
                        </article>
                        </div>
                    </section>

                    <p class="pbg-summary-bridge">↑ {{ geneTab === 'variant' && selectedEvidenceVariant
                        ? 'Summary above shows only carriers of the selected variant.'
                        : 'Summary above is aggregated from the variants below and updates with your selection.' }}</p>

                    <div class="pbg-variant-evidence-block">
                        <div class="pbg-variant-evidence-head">
                            <p class="pbg-section-label">
                                Variant evidence for {{ geneInfo.symbol }}
                                <span class="pbg-crdc-badge" title="Source: CRDC cohort">CRDC</span>
                            </p>
                            <span>{{ variantRows.length }} variants with carriers in gene-variants-crdc</span>
                        </div>

                        <div class="pbg-ve-context-group-row">
                            <form class="pbg-ve-position-search" role="search" aria-label="Find variant by genomic position" @submit.prevent="searchVariantPosition">
                                <label for="pbg-variant-position">Position</label>
                                <input id="pbg-variant-position" v-model.trim="variantPositionQuery" type="search"
                                       :placeholder="variantPositionPlaceholder" autocomplete="off" spellcheck="false"
                                       :aria-invalid="variantPositionError ? 'true' : 'false'">
                                <button type="submit">Find</button>
                                <span v-if="variantPositionError" class="pbg-ve-position-error" role="alert">{{ variantPositionError }}</span>
                            </form>
                            <span class="pbg-ve-context-group">Custom HPO Context-Based</span>
                        </div>
                        <div class="pbg-ve-table-head">
                            <span></span>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('variant')">
                                <i>{{ variantSortIndicator('variant') }}</i><span>Variant</span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('carriers')">
                                <i>{{ variantSortIndicator('carriers') }}</i><span>Carriers</span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('consequence')">
                                <i>{{ variantSortIndicator('consequence') }}</i><span>Consequence</span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('clinvar')">
                                <i>{{ variantSortIndicator('clinvar') }}</i><span>ClinVar</span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('variantScore')">
                                <i>{{ variantSortIndicator('variantScore') }}</i>
                                <span>
                                    Variant Score
                                    <abbr class="pbg-score-help"
                                          title="In silico Variant Effect Prediction Score(LOFTEE-HC, AlphaMissense)"
                                          aria-label="In silico Variant Effect Prediction Score(LOFTEE-HC, AlphaMissense)"
                                          @click.stop>?</abbr>
                                    <em>CRDC</em>
                                </span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('matchScore')">
                                <i>{{ variantSortIndicator('matchScore') }}</i>
                                <span>
                                    Match Score
                                    <abbr class="pbg-score-help"
                                          title="Mean residual PheRS across the unique carriers of this variant for the selected HPO context. No partial mean is shown when any carrier score is missing."
                                          aria-label="Match Score calculation: mean residual PheRS across unique carriers of this variant for the selected HPO context."
                                          @click.stop>?</abbr>
                                    <em>CRDC</em>
                                </span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('effectScore')"><i>{{ variantSortIndicator('effectScore') }}</i><span>Effect Score (β)</span></button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('pValue')"><i>{{ variantSortIndicator('pValue') }}</i><span>p-value</span></button>
                        </div>
                        <p class="pbg-score-legend">
                            <strong>—*</strong> REVEL available; excluded from this score.
                            <span><strong>—</strong> No LoFTEE HC, AlphaMissense, or REVEL annotation.</span>
                        </p>

                        <template v-for="row in visibleVariantRows">
                            <div :key="row.id"
                                 :data-variant-id="row.id"
                                 class="pbg-ve-row"
                                 :class="{ 'pbg-ve-row--expanded': expandedVariantId === row.id, 'pbg-ve-row--af-warning': variantHasHighAf(row), 'pbg-ve-row--search-hit': variantSearchStart != null && variantSearchResultId === row.id }"
                                 role="button"
                                tabindex="0"
                                :aria-expanded="expandedVariantId === row.id ? 'true' : 'false'"
                                :aria-controls="'variant-detail-' + row.id"
                                @click="toggleVariant(row.id)"
                                @keydown.enter.self.prevent="toggleVariant(row.id)"
                                @keydown.space.self.prevent="toggleVariant(row.id)">
                                <span class="pbg-ve-chevron">{{ expandedVariantId === row.id ? '⌄' : '›' }}</span>
                                <span class="pbg-variant-id">
                                    {{ row.id }}<sup v-if="variantHasHighAf(row)" class="pbg-af-star" :title="variantAfWarningText(row)">*</sup>
                                </span>
                                <span class="pbg-ve-carriers">
                                    {{ row.carrierCount }}
                                </span>
                                <span class="pbg-ve-consequence">{{ row.consequence || 'Unavailable' }}</span>
                                <span class="pbg-ve-clinvar"><span class="pbg-clinvar-badge" :class="pathogenicityClass(row.clinvar)">{{ row.clinvar || 'Unavailable' }}</span></span>
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
                                <span v-if="!activeContextTerms.length" class="pbg-no-context">no context</span>
                                <strong v-else-if="row.variantEffectBeta != null" class="pbg-score-badge"
                                        :title="row.variantAssociationLowCarrierCount ? 'Adjusted carrier effect in residual PheRS units; exploratory because fewer than 10 carriers were scored.' : 'Adjusted carrier effect in residual PheRS units.'">
                                    {{ contextStatistic(row.variantEffectBeta) }}
                                </strong>
                                <span v-else class="pbg-no-context" :title="row.variantAssociationStatus || 'not_returned'">Unavailable</span>
                                <span v-if="!activeContextTerms.length" class="pbg-no-context">no context</span>
                                <strong v-else-if="row.variantEffectPValue != null" class="pbg-score-badge"
                                        :title="row.variantAssociationLowCarrierCount ? 'Unadjusted two-sided OLS p-value; exploratory because fewer than 10 carriers were scored.' : 'Unadjusted two-sided OLS p-value.'">
                                    {{ variantPValueDisplay(row.variantEffectPValue) }}
                                </strong>
                                <span v-else class="pbg-no-context" :title="row.variantAssociationStatus || 'not_returned'">Unavailable</span>
                            </div>

                            <div v-if="expandedVariantId === row.id" :id="'variant-detail-' + row.id"
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
                                            <span>HPO terms</span>
                                            <span title="Carrier residual PheRS for the selected HPO context; unavailable when not supplied.">Match (residual PheRS)</span>
                                            <span>Co-genes</span>
                                            <span>Investigator</span>
                                            <span>Affected</span>
                                            <span>Proband</span>
                                            <span>GenDx</span>
                                        </div>
                                        <div v-for="s in visibleCarrierRows(row)" :key="row.id + '-' + s.id" class="pbg-selected-sample-row">
                                            <a class="pbg-sample-link" :href="`/pb_sample.html?query=${encodeURIComponent(s.id)}`" @click.stop>{{ s.id }}</a>
                                            <span>{{ carrierSampleField(s, 'age') }}</span>
                                            <span>{{ carrierSampleField(s, 'sex') }}</span>
                                            <span>{{ s.gt }}</span>
                                            <span>{{ carrierSampleField(s, 'hpo') || '—' }}</span>
                                            <span class="pbg-no-context" :title="activeContextTerms.length ? 'Carrier residual PheRS is not supplied by the current data source.' : 'Run an HPO context analysis to request matching.'">{{ activeContextTerms.length ? '—' : 'no context' }}</span>
                                            <div class="pbg-co-gene-cell">
                                                <span>{{ coGenePreview(carrierSampleField(s, 'genes')) }}</span>
                                                <details v-if="coGeneRemaining(carrierSampleField(s, 'genes')).length">
                                                    <summary>+{{ coGeneRemaining(carrierSampleField(s, 'genes')).length }} more</summary>
                                                    <span>{{ coGeneRemaining(carrierSampleField(s, 'genes')).join(', ') }}</span>
                                                </details>
                                            </div>
                                            <span>{{ carrierSampleField(s, 'group') }}</span>
                                            <span>{{ carrierSampleField(s, 'affected') }}</span>
                                            <span>{{ carrierSampleField(s, 'proband') }}</span>
                                            <span :class="{ 'pbg-gendx-conflict': s.gendxConflict }"
                                                  :title="s.gendxNote || carrierSampleField(s, 'gendx') || '-'">{{ carrierSampleField(s, 'gendx') || '-' }}</span>
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
                        <nav v-if="variantPageCount > 1" class="pbg-ve-pagination" aria-label="Variant evidence pages">
                            <span v-if="variantSearchStart != null" class="pbg-ve-search-state">Closest variant centered</span>
                            <button type="button" :disabled="variantPage <= 1" @click.stop="goToVariantPage(variantPage - 1)">Previous</button>
                            <button v-for="page in variantPageNumbers" :key="page" type="button"
                                    :class="{ 'pbg-ve-page-active': variantSearchStart == null && variantPage === page }"
                                    :aria-current="variantSearchStart == null && variantPage === page ? 'page' : null"
                                    @click.stop="goToVariantPage(page)">{{ page }}</button>
                            <button type="button" :disabled="variantPage >= variantPageCount" @click.stop="goToVariantPage(variantPage + 1)">Next</button>
                            <form class="pbg-ve-page-jump" aria-label="Go to variant page" @submit.prevent="jumpToVariantPage">
                                <label for="pbg-variant-page-jump">Page</label>
                                <input id="pbg-variant-page-jump" v-model.trim="variantPageJump" type="text" inputmode="numeric"
                                       :aria-invalid="variantPageJumpError ? 'true' : 'false'" :placeholder="String(variantPageCount)">
                                <button type="submit">Go</button>
                                <span v-if="variantPageJumpError" class="pbg-ve-page-jump-error" role="alert">{{ variantPageJumpError }}</span>
                            </form>
                            <span class="pbg-ve-page-total">{{ variantPage }} / {{ variantPageCount }}</span>
                        </nav>
                    </div>
                </section>

            </div>
        </div>

    </div>
</template>

<script>
import { createPbGeneState, pbGeneComputed, pbGeneMethods } from "./pageModel";
import GeneIdentityPanel from "./GeneIdentityPanel";
import HpoContextPanel from "./HpoContextPanel";
import SummaryPager from "./SummaryPager";
import CarrierSummaryKpis from "./CarrierSummaryKpis";
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
    components: { GeneIdentityPanel, HpoContextPanel, SummaryPager, CarrierSummaryKpis },
    data() {
        return {
            ...createPbGeneState(),
            metricIcons,
        };
    },
    mounted() {
        if (this.expandedVariantId) this.selectVariant(this.expandedVariantId);
        this.loadLiveGeneData(this.searchGeneQuery, false).catch(() => {});
    },
    computed: pbGeneComputed,
    methods: pbGeneMethods,
    watch: {
        locusFilterRequestKey() { this.refreshLocusFilter(); },
    },
};
</script>
