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
                        <span class="pbg-breadcrumb-link">Gene search</span>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <form class="pbg-gene-search-form"
                              role="search"
                              aria-label="Search another gene"
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
                        </form>
                    </div>
                    <div class="pbg-toolbar-right">
                        <a href="/krVariant.html" class="pbg-nav-link">Variant search</a>
                        <a href="/krPublicGene.html" class="pbg-nav-link">Public view</a>
                    </div>
                </div>

                <!-- ══════════════════════════════════════════════════════
                     BLOCK 1 — Gene identity + Primary CRDC evidence
                ═══════════════════════════════════════════════════════════ -->
                <section class="pbg-hero-card">

                    <!-- Left: gene identity + reference annotation (no sample-derived data) -->
                    <div class="pbg-hero-identity">
                        <div class="pbg-gene-title-row">
                            <h1 class="pbg-gene-symbol">{{ geneInfo.symbol }}</h1>
                        </div>
                        <p class="pbg-gene-fullname"><span>HGNC:</span> {{ geneInfo.fullName }}</p>
                        <p v-if="geneInfo.description" class="pbg-gene-description"><span>NCBI:</span> {{ geneInfo.description }}</p>
                        <p class="pbg-gene-location">{{ geneInfo.location }} <span>{{ geneInfo.build }}</span></p>

                        <div class="pbg-gene-meta-row">
                            <span class="pbg-meta-pill">OMIM {{ geneInfo.omim }}</span>
                            <span class="pbg-meta-pill">Ensembl {{ geneInfo.ensemblId }}</span>
                        </div>

                        <!-- Reference annotation table (source: reference_db) -->
                        <table class="pbg-ref-table">
                            <tbody>
                                <tr>
                                    <td class="pbg-ref-source">DDG2P</td>
                                    <td>
                                        <span v-if="geneInfo.referenceAnnotation.ddg2p.support" class="pbg-ref-val pbg-ref-val--pos">
                                            {{ geneInfo.referenceAnnotation.ddg2p.confidenceCategories }}
                                            · {{ geneInfo.referenceAnnotation.ddg2p.diseaseNames }}
                                        </span>
                                        <span v-else class="pbg-ref-val pbg-ref-val--none">No entry</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="pbg-ref-source">PanelApp</td>
                                    <td>
                                        <span v-if="geneInfo.referenceAnnotation.panelapp.greenSupport" class="pbg-ref-val pbg-ref-val--pos">
                                            {{ geneInfo.referenceAnnotation.panelapp.panelCount }} green panels
                                            · MOI: {{ geneInfo.referenceAnnotation.panelapp.modesOfInheritance }}
                                        </span>
                                        <span v-else class="pbg-ref-val pbg-ref-val--none">No green panels</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="pbg-ref-source">Pathway</td>
                                    <td>
                                        <div v-if="geneInfo.referenceAnnotation.pathways.count > 0" class="pbg-ref-val pbg-ref-val--pathway">
                                            <span>{{ geneInfo.referenceAnnotation.pathways.displayNames.join(" · ") }}</span>
                                            <button v-if="geneInfo.referenceAnnotation.pathways.moreCount > 0"
                                                    class="pbg-ref-more"
                                                    type="button"
                                                    :aria-expanded="showPathwayDetails ? 'true' : 'false'"
                                                    @click="togglePathwayDetails">
                                                +{{ geneInfo.referenceAnnotation.pathways.moreCount }} more
                                            </button>
                                            <div v-if="showPathwayDetails" class="pbg-pathway-list">
                                                <div v-for="item in pathwayDetailItems" :key="item.source + '-' + item.name" class="pbg-pathway-item">
                                                    <span>{{ item.source }}</span>
                                                    <strong>{{ item.name }}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <span v-else class="pbg-ref-val pbg-ref-val--none">No annotation</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <p class="pbg-ref-source-note">Source: gene_annotation_summary (DDG2P / PanelApp / Reactome / WikiPathways)</p>
                    </div>

                    <!-- Right: gene-level CRDC summary + representative evidence -->
                    <div class="pbg-hero-summary">
                        <div class="pbg-metric-strip" aria-label="Gene-level CRDC summary">
                            <div class="pbg-metric-item">
                                <img class="pbg-metric-icon" :src="metricIcons.carriers" alt="" aria-hidden="true">
                                <strong>{{ totalGeneCarriers }}</strong>
                                <em>Carriers</em>
                            </div>
                            <div class="pbg-metric-item">
                                <img class="pbg-metric-icon" :src="metricIcons.affected" alt="" aria-hidden="true">
                                <strong :class="{ 'pbg-unavailable-value': isUnavailableValue(crdcEvidence.affected) }">{{ displayMetric(crdcEvidence.affected) }}</strong>
                                <em>Affected</em>
                            </div>
                            <div class="pbg-metric-item">
                                <img class="pbg-metric-icon" :src="metricIcons.probands" alt="" aria-hidden="true">
                                <strong :class="{ 'pbg-unavailable-value': isUnavailableValue(crdcEvidence.probands) }">{{ displayMetric(crdcEvidence.probands) }}</strong>
                                <em>Probands</em>
                            </div>
                            <div class="pbg-metric-item">
                                <img class="pbg-metric-icon" :src="metricIcons.gendx" alt="" aria-hidden="true">
                                <strong :class="{ 'pbg-unavailable-value': isUnavailableValue(crdcEvidence.genDxDiagnosed) }">{{ displayMetric(crdcEvidence.genDxDiagnosed) }}</strong>
                                <em>GenDx diagnosed</em>
                            </div>
                            <div class="pbg-metric-item">
                                <img class="pbg-metric-icon" :src="metricIcons.variants" alt="" aria-hidden="true">
                                <strong>{{ crdcEvidence.variantCount }}</strong>
                                <em>Variants in this gene</em>
                            </div>
                        </div>

                        <div class="pbg-mini-card-grid">
                            <article class="pbg-mini-card pbg-pheno-spotlight-card">
                                <div class="pbg-mini-card-head">
                                    <h2>Carrier phenotype profile</h2>
                                    <span>Top 4 categories</span>
                                </div>
                                <div v-if="topHeroPhenotypeCategories.length" class="pbg-pheno-spotlight">
                                    <strong>{{ topHeroPhenotypeCategories[0].allPct }}%</strong>
                                    <div>
                                        <span :title="shortPhenotypeCategory(topHeroPhenotypeCategories[0].category)">
                                            {{ shortPhenotypeCategory(topHeroPhenotypeCategories[0].category) }}
                                        </span>
                                        <em>{{ topHeroPhenotypeCategories[0].termCount }} terms</em>
                                    </div>
                                </div>
                                <div class="pbg-pheno-rank-list">
                                    <div v-for="cat in topHeroPhenotypeCategories.slice(1)" :key="cat.category" class="pbg-pheno-rank-row">
                                        <span :title="shortPhenotypeCategory(cat.category)">{{ shortPhenotypeCategory(cat.category) }}</span>
                                        <strong>{{ cat.allPct }}%</strong>
                                        <em>{{ cat.termCount }} terms</em>
                                    </div>
                                </div>
                            </article>

                            <article v-if="topVariant" class="pbg-mini-card pbg-score-spotlight-card">
                                <div class="pbg-mini-card-head">
                                    <h2>Most severe observed variant</h2>
                                    <span class="pbg-crdc-badge" title="Source: CRDC cohort">CRDC</span>
                                </div>
                                <div class="pbg-score-spotlights">
                                    <div>
                                        <span>Mean carrier burden</span>
                                        <strong>{{ meanCarrierBurdenScore != null ? meanCarrierBurdenScore.toFixed(2) : '—' }}</strong>
                                        <em>variant score × GT dosage</em>
                                    </div>
                                    <div>
                                        <span>Variant severity score</span>
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
                            <span v-for="tick in locusMajorTicks" :key="'major-' + tick.pos"
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
                                <strong>Variant positions ({{ variantRows.length }})</strong>
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
                                <strong>Carrier count</strong>
                            </div>
                            <div class="pbg-window-density-plot" :style="{ height: locusDensityPlotHeightPx + 'px' }">
                                <button v-for="col in locusDensityColumns" :key="'density-col-' + col.pos"
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
                                {{ geneInfo.symbol }} · {{ totalGeneCarriers }} current gene carriers
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

                    <div class="pbg-summary-panel-grid">
                        <article class="pbg-summary-card"
                                 :class="{ 'pbg-summary-card--expanded': isSummaryCardExpanded('phenotype') }">
                            <button class="pbg-summary-card-head pbg-summary-card-head--button"
                                    type="button"
                                    :aria-expanded="isSummaryCardExpanded('phenotype') ? 'true' : 'false'"
                                    @click="toggleSummaryCard('phenotype')">
                                <strong>Carrier phenotype profile</strong>
                                <span>{{ summaryPhenotypeCardLabel }}</span>
                            </button>
                            <div class="pbg-summary-card-body pbg-summary-pheno-list">
                                <div v-for="cat in summaryPhenotypeRows"
                                     :key="'summary-pheno-' + cat.category"
                                     class="pbg-summary-pheno-row">
                                    <span :title="shortPhenotypeCategory(cat.category)">{{ shortPhenotypeCategory(cat.category) }}</span>
                                    <div><i :style="{ width: cat.allPct + '%' }"></i></div>
                                    <strong>{{ cat.allPct }}%</strong>
                                    <em>({{ cat.termCount }} terms)</em>
                                </div>
                                <p v-if="!summaryPhenotypeRows.length" class="pbg-empty-note">No HPO category data</p>
                            </div>
                            <div v-if="summaryPhenotypeHiddenCount" class="pbg-summary-card-foot">
                                <button class="pbg-summary-more-btn" type="button" @click="toggleSummaryCard('phenotype')">
                                    {{ isSummaryCardExpanded('phenotype') ? 'Show less' : '+' + summaryPhenotypeHiddenCount + ' more categories' }}
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

                    <div class="pbg-variant-evidence-block">
                        <div class="pbg-variant-evidence-head">
                            <p class="pbg-section-label">
                                Variant evidence for {{ geneInfo.symbol }}
                                <span class="pbg-crdc-badge" title="Source: CRDC cohort">CRDC</span>
                            </p>
                            <span>{{ variantRows.length }} variants</span>
                        </div>

                        <div class="pbg-ve-table-head">
                            <span></span>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('variant')">
                                Variant <i>{{ variantSortIndicator('variant') }}</i>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('carriers')">
                                Carriers (affected) <i>{{ variantSortIndicator('carriers') }}</i>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('crdcAF')">
                                CRDC AF <i>{{ variantSortIndicator('crdcAF') }}</i>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('classification')">
                                Classification <i>{{ variantSortIndicator('classification') }}</i>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('variantScore')">
                                Variant score <em>CRDC</em> <i>{{ variantSortIndicator('variantScore') }}</i>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('matchScore')">
                                Match score <em>CRDC</em> <i>{{ variantSortIndicator('matchScore') }}</i>
                            </button>
                        </div>

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
                                    <strong class="pbg-score-badge" :class="variantScoreClass(row)">{{ variantScoreDisplay(row) }}</strong>
                                </span>
                                <span class="pbg-no-context">no context</span>
                            </div>

                            <div v-if="expandedVariantId === row.id"
                                 :key="row.id + '-details'"
                                 class="pbg-variant-expanded">
                                <div class="pbg-selected-variant-evidence">
                                    <p class="pbg-section-label">
                                        Selected variant evidence
                                        <span class="pbg-crdc-badge">CRDC</span>
                                    </p>
                                    <div v-if="variantHasHighAf(row)" class="pbg-af-warning-note">
                                        <strong>* High AF review</strong>
                                        <span>{{ variantAfWarningText(row) }}</span>
                                    </div>
                                    <div class="pbg-selected-kv">
                                        <div v-for="item in variantEvidenceRows(row)" :key="'evidence-' + item.label" class="pbg-selected-kv-row">
                                            <span>{{ item.label }}</span>
                                            <a v-if="item.href" class="pbg-ext-link"
                                               :href="item.href" target="_blank" rel="noopener noreferrer"
                                               @click.stop>{{ item.value }} ↗</a>
                                            <strong v-else>{{ item.value }}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div class="pbg-selected-carriers">
                                    <p class="pbg-section-label">Carrier samples - {{ row.carrierCount }} total</p>
                                    <div class="pbg-selected-sample-table">
                                        <div class="pbg-selected-sample-head">
                                            <span>Sample</span>
                                            <span>Age</span>
                                            <span>Sex</span>
                                            <span>GT</span>
                                            <span>HPO</span>
                                            <span>Co-genes</span>
                                            <span>Investigator</span>
                                            <span>Affected</span>
                                            <span>GenDx</span>
                                        </div>
                                        <div v-for="s in visibleCarrierRows(row)" :key="row.id + '-' + s.id" class="pbg-selected-sample-row">
                                            <a class="pbg-sample-link" :href="`/krSample.html?query=${s.id}`" @click.stop>{{ s.id }}</a>
                                            <span>{{ s.age }}</span>
                                            <span>{{ s.sex }}</span>
                                            <span>{{ s.gt }}</span>
                                            <span>{{ s.hpo }}</span>
                                            <span>{{ s.genes }}</span>
                                            <span>{{ s.group }}</span>
                                            <span>{{ s.affected }}</span>
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
                            +10 more ({{ hiddenVariantCount }} remaining)
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
import carriersIcon from "./carriers.png";
import affectedIcon from "./affected.png";
import probandsIcon from "./proband.png";
import gendxIcon from "./gendx.png";
import variantsIcon from "./variants.png";
import "./style.css";

const metricIcons = {
    carriers: carriersIcon,
    affected: affectedIcon,
    probands: probandsIcon,
    gendx: gendxIcon,
    variants: variantsIcon,
};

export default {
    name: "PbGeneTemplate",
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
