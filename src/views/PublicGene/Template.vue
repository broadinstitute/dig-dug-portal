<template>
    <div class="public-gene-page">
        <div class="demo-notice" role="note">Public gene reference preview</div>
        <p class="demo-empty" role="status">Public gene annotations and aggregate evidence are shown here. Sample identities remain hidden.</p>

        <div class="container-fluid mdkp-body pbg-page">
            <div class="pbg-shell">
                <div class="pbg-toolbar">
                    <div class="pbg-toolbar-left">
                        <a href="/" class="pbg-home-link" aria-label="Portal home"><span>Home</span></a>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <span class="pbg-breadcrumb-link">Gene search</span>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <form class="pbg-gene-search-form" role="search" aria-label="Search another gene" @submit.prevent="submitPublicGeneSearch">
                            <input v-model.trim="searchGeneQuery" class="pbg-gene-search-input" type="search"
                                   autocomplete="off" spellcheck="false" aria-label="Gene symbol" placeholder="Gene symbol">
                            <button class="pbg-gene-search-submit" type="submit">Search</button>
                            <span v-if="searchGeneError" class="pbg-gene-search-error" role="status">{{ searchGeneError }}</span>
                        </form>
                    </div>
                    <div class="pbg-toolbar-right">
                        <span class="pbg-nav-link public-gene-pending" aria-disabled="true">Variant search</span>
                        <span class="pbg-nav-link public-gene-pending" aria-disabled="true">Phenotype</span>
                    </div>
                </div>

                <details class="pbg-context-disclosure" open>
                    <summary>
                        <strong>HPO Context</strong>
                        <span class="pbg-context-summary-sub">enter HPO terms for this gene</span>
                        <span class="pbg-context-summary-pill">{{ publicContextTerms.length ? 'Terms selected' : 'On-demand tool' }}</span>
                    </summary>
                    <section class="pbg-context-card" aria-labelledby="public-gene-context-title">
                        <div class="pbg-context-head">
                            <div>
                                <h2 id="public-gene-context-title">HPO context</h2>
                                <p>Enter HPO terms to calculate aggregate gene and variant associations.</p>
                            </div>
                            <span class="pbg-context-status" :class="{ 'pbg-context-status--active': publicContextTerms.length }">
                                {{ publicContextTerms.length ? 'Terms selected' : 'No context' }}
                            </span>
                        </div>
                        <form class="pbg-context-form public-gene-context-form" @submit.prevent="selectPublicHpoContext">
                            <hpo-term-input v-model="publicContextInput"></hpo-term-input>
                            <label class="pbg-context-option">GRS <select v-model="publicContextScoreType" aria-label="Gene score aggregation"><option value="max">Max</option><option value="sum">Sum</option></select></label>
                            <label class="pbg-context-option">Samples <select v-model="publicContextAnalysisSet" aria-label="Analysis samples"><option value="all">All</option><option value="affected">Affected only</option></select></label>
                            <button type="submit" :disabled="publicContextLoading">{{ publicContextLoading ? 'Calculating' : 'Go' }}</button>
                        </form>
                        <p v-if="publicContextError" class="pbg-context-error" role="alert">{{ publicContextError }}</p>
                        <div v-if="publicContextTerms.length" class="pbg-context-imported-terms" aria-label="Selected HPO context">
                            <span v-for="term in publicContextTerms" :key="term"><strong>{{ term }}</strong></span>
                        </div>
                        <div v-if="publicContextTerms.length" class="pbg-context-results">
                            <div class="pbg-context-result-head"><span>HPOs (Entered terms)</span><span>Beta (Effect Size)</span><span>P-value</span><span>Status / model</span><span>Note</span></div>
                            <div v-if="publicGeneAssociation" class="pbg-context-result-row">
                                <span>{{ publicContextTerms.join(', ') }}<small>Public aggregate</small></span>
                                <strong>{{ publicStatistic(publicGeneAssociation.beta) }}</strong>
                                <strong>{{ publicPValue(publicGeneAssociation.p_value) }}</strong>
                                <span class="pbg-context-result-diagnostic"><strong>{{ publicGeneAssociation.status === 'ok' ? 'Calculated · GRS association' : 'Unavailable' }}</strong><small v-if="publicGeneAssociation.status === 'ok'">{{ String(publicGeneAssociation.model || 'lm').toUpperCase() }} · GRS {{ publicGeneAssociation.score_type }} · {{ publicGeneAssociation.affected_only ? 'Affected only' : 'All samples' }}</small></span>
                                <span>Unadjusted p-value</span>
                            </div>
                            <p v-else class="pbg-context-empty">{{ publicContextLoading ? 'Calculating aggregate association…' : 'No aggregate result returned.' }}</p>
                        </div>
                        <p class="public-gene-context-note">Supported aggregate β, p-values, and mean carrier Match Scores are shown. Sample-level evidence remains hidden.</p>
                    </section>
                </details>

                <section class="pbg-hero-card">
                    <gene-identity-panel v-if="referenceAvailable" :gene-info="geneInfo"></gene-identity-panel>
                    <div v-else class="pbg-hero-identity">
                        <h1 class="pbg-gene-symbol">{{ geneInfo.symbol }}</h1>
                        <p class="pbg-gene-description">No public gene reference is available for this query.</p>
                    </div>
                    <div class="pbg-hero-summary">
                        <div class="pbg-cohort-strip" aria-label="Cohort evidence availability">
                            <span><small>Cohort evidence:</small><strong>{{ variantsLoading ? 'Loading' : variantsError ? 'Unavailable' : 'Aggregate carrier counts' }}</strong></span>
                        </div>
                        <div class="pbg-mini-card-grid">
                            <article class="pbg-mini-card pbg-pheno-spotlight-card">
                                <div class="pbg-mini-card-head">
                                    <div class="pbg-association-heading">
                                        <div class="pbg-association-title-line">
                                            <h2>Top phenotype associations</h2>
                                            <button class="pbg-info-button" type="button" aria-label="About top phenotype associations" aria-describedby="public-gene-association-help-hero">
                                                ?<span id="public-gene-association-help-hero" class="pbg-info-tooltip" role="tooltip">Displayed OR and 95% CI are approximate effects per 0.1-point increase in gene burden score. q is adjusted across genes within each HPO.</span>
                                            </button>
                                        </div>
                                        <p>Precomputed associations across binary HPO phenotypes</p>
                                    </div>
                                    <span>Precomputed</span>
                                </div>
                                <div v-if="genePhenotypeAssociations.length" class="pbg-association-spotlight">
                                    <strong>OR {{ publicStatistic(genePhenotypeAssociations[0].oddsRatio) }}</strong>
                                    <div>
                                        <span>{{ genePhenotypeAssociations[0].label }}</span>
                                        <em>{{ genePhenotypeAssociations[0].hpoId }} · 95% CI {{ publicStatistic(genePhenotypeAssociations[0].ciLow) }}–{{ publicStatistic(genePhenotypeAssociations[0].ciHigh) }}</em>
                                        <small>p {{ publicPValue(genePhenotypeAssociations[0].pValue) }} · q {{ publicPValue(genePhenotypeAssociations[0].qValue) }}</small>
                                    </div>
                                </div>
                                <div v-if="genePhenotypeAssociations.length" class="pbg-association-rank-list">
                                    <div v-for="association in genePhenotypeAssociations.slice(1, 4)" :key="association.hpoId" class="pbg-association-rank-row">
                                        <span>{{ association.label }} <small>{{ association.hpoId }}</small></span>
                                        <strong>OR {{ publicStatistic(association.oddsRatio) }}</strong>
                                        <em>p {{ publicPValue(association.pValue) }}<br>q {{ publicPValue(association.qValue) }}</em>
                                    </div>
                                </div>
                                <p v-else class="pbg-association-empty">{{ associationsLoading ? 'Loading precomputed associations…' : associationsError || 'No precomputed associations are listed for this gene.' }}</p>
                            </article>
                            <article class="pbg-mini-card pbg-score-spotlight-card">
                                <section class="pbg-pathogenic-coverage" aria-label="Pathogenic score coverage">
                                    <span class="pbg-pathogenic-coverage-heading">Pathogenic score coverage</span>
                                    <div class="pbg-pathogenic-coverage-metric">
                                        <span class="pbg-pathogenic-coverage-stat"><strong class="pbg-pathogenic-coverage-value--annotated">{{ variantsLoading || variantsError ? '—' : annotatedVariantCount }}</strong><small>annotated</small></span>
                                        <span class="pbg-pathogenic-coverage-slash" aria-hidden="true">/</span>
                                        <span class="pbg-pathogenic-coverage-stat"><strong>{{ variantsLoading || variantsError ? '—' : variantRows.length }}</strong><small>variants with carriers</small></span>
                                    </div>
                                    <small class="pbg-pathogenic-coverage-sources">LoFTEE · AlphaMissense; sample evidence hidden</small>
                                </section>
                                <div v-if="topScoredVariant" class="pbg-severe-variant-section">
                                    <div class="pbg-mini-card-head"><h2>Highest scored indexed variant</h2><span>Public annotation</span></div>
                                    <div class="pbg-score-spotlights"><div><span>Burden Pathogenic Score</span><strong>{{ variantScoreDisplay(topScoredVariant) }}</strong><em>{{ String(topScoredVariant.loftee).toUpperCase() === 'HC' ? 'LoFTEE HC' : 'AlphaMissense' }}</em></div></div>
                                    <div class="pbg-top-variant-line"><span>Most severe variant</span><strong>{{ topScoredVariant.id }}</strong></div>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                <section class="pbg-locus-card pbg-window-card pbg-window-card--whole public-gene-reference-locus" aria-label="Public gene locus">
                    <div class="pbg-window-head">
                        <div class="pbg-locus-title">
                            <strong>{{ geneInfo.symbol }} gene locus ({{ geneInfo.build }})</strong>
                            <span>{{ geneInfo.location }}</span>
                        </div>
                        <div class="pbg-locus-filterbar" aria-label="Carrier filters">
                            <select v-model="carrierScopeFilter" class="pbg-filter-select pbg-filter-select--scope" aria-label="Carrier scope"><option value="All">All carriers</option><option value="Affected">Affected only</option><option value="Proband">Probands only</option></select>
                            <select v-model="ageFilter" class="pbg-filter-select" aria-label="Carrier age"><option v-for="age in publicAvailableAges" :key="age" :value="age">{{ age }}</option></select>
                            <select v-model="projectFilter" class="pbg-filter-select" aria-label="Carrier project"><option v-for="project in publicAvailableProjects" :key="project" :value="project">{{ project }}</option></select>
                            <select v-model="sexFilter" class="pbg-filter-select" aria-label="Carrier sex"><option value="All">All sexes</option><option value="Female">Female</option><option value="Male">Male</option><option value="n/a">n/a</option></select>
                        </div>
                    </div>
                    <p v-if="publicLocusFilterActive && (locusFilterProgress || locusFilterError)" class="pbg-locus-filter-status" role="status">{{ locusFilterError || locusFilterProgress }}</p>
                    <div class="pbg-window-canvas">
                        <div class="pbg-window-major-axis">
                            <span v-for="(tick, index) in genomeWindow.axisTicks" :key="index"
                                  :class="index === 0 ? 'pbg-window-axis-tick--start' : index === genomeWindow.axisTicks.length - 1 ? 'pbg-window-axis-tick--end' : ''"
                                  :style="{ left: tick.left }">{{ tick.label }}</span>
                        </div>
                        <div class="pbg-window-row pbg-window-row--gene">
                            <div class="pbg-window-track-label"><strong>{{ geneInfo.symbol }}</strong></div>
                            <div class="pbg-window-gene-track" aria-label="Reference exon positions">
                                <div v-if="genomeWindow.exons.length" class="pbg-window-intron-line"
                                     :class="geneInfo.strand === '-' ? 'pbg-window-intron-line--rev' : 'pbg-window-intron-line--fwd'"></div>
                                <span v-for="exon in genomeWindow.exons" :key="exon.label + '-' + exon.start"
                                      class="pbg-window-exon-block public-gene-exon"
                                      :style="{ left: exon.left, width: exon.width }"
                                      :title="`${exon.label}: ${exon.start.toLocaleString()}–${exon.end.toLocaleString()}`">
                                    <span class="pbg-window-exon-label">{{ exon.label.replace('E', '') }}</span>
                                </span>
                            </div>
                        </div>
                        <div class="pbg-window-row pbg-window-row--variants">
                            <div class="pbg-window-track-label"><strong>Variant positions</strong><span>{{ variantsLoading ? 'Loading' : locusPositionCount + ' positions · ' + locusVariantMarkers.length + ' variants in view' }}</span></div>
                            <div class="pbg-window-variant-track">
                                <button v-for="marker in locusVariantMarkers" :key="marker.id" type="button"
                                        class="pbg-window-variant-dot public-gene-marker" :style="{ left: marker.left }"
                                        :title="marker.id" :aria-label="`Show ${marker.id} in variant table`"
                                        @click="selectVariantMarker(marker.id)"><span></span></button>
                            </div>
                        </div>
                        <div class="pbg-window-row pbg-window-row--density">
                            <div class="pbg-window-track-label"><strong>Distinct carriers</strong><span>{{ variantsLoading ? 'Loading' : publicLocusFilterActive && !locusFilterResult ? locusFilterProgress || 'Filtering…' : publicLocusDistinctCarriers == null ? 'Unavailable for this view' : `${publicLocusDistinctCarriers.toLocaleString()} people in view${publicLocusFilterActive && locusFilterResult && locusFilterResult.status !== 'ready' ? ' (partial)' : ''}` }}</span></div>
                            <div class="pbg-window-density-plot public-gene-density-plot" aria-label="Distinct carrier density by genomic bin">
                                <div v-for="(bin, index) in publicCarrierDensityColumns" :key="index"
                                     class="pbg-window-density-col" :class="{ 'pbg-window-density-col--zero': bin.count === 0 }"
                                     :style="{ left: bin.left, width: bin.width, height: bin.height }"
                                     :title="`${bin.count} distinct carriers in this genomic bin`"></div>
                                <span v-if="!publicCarrierDensityColumns.length" class="public-gene-density-empty">{{ variantsLoading ? 'Loading carrier density…' : locusFilterProgress || 'Carrier density unavailable' }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="pbg-locus-bottom-row">
                        <div class="pbg-locus-legend"><span><i class="pbg-locus-legend-exon"></i>Exon</span><span><i class="pbg-locus-legend-intron"></i>Intron</span></div>
                        <div class="pbg-zoom-controls" role="group" aria-label="Locus zoom"><button class="pbg-zoom-btn" type="button" disabled>Full</button><span class="pbg-zoom-label">whole gene</span></div>
                    </div>
                    <p class="public-gene-caption">Reference exons, indexed variant positions, and aggregate distinct carrier density are shown. Sample identities are hidden.</p>
                    <p v-if="!genomeWindow.exons.length" class="pbg-empty-note">Reference exon coordinates are unavailable for this gene.</p>
                </section>

                <section class="pbg-variants-card pbg-evidence-card public-gene-evidence" aria-label="Gene evidence availability">
                    <div class="pbg-evidence-summary-head">
                        <div>
                            <h2 class="pbg-carrier-evidence-title">{{ geneInfo.symbol }} carrier evidence</h2>
                            <p class="pbg-carrier-evidence-scope" v-if="expandedVariantId">
                                Scope: carriers of <code>{{ expandedVariantId }}</code>
                                <strong>{{ Number(publicSummaryCarrierCount || 0).toLocaleString() }}</strong> carriers
                                <button type="button" @click="setPublicGeneMode">Back to gene level</button>
                            </p>
                            <p class="pbg-carrier-evidence-scope" v-else>Scope: all <strong>{{ variantRows.length.toLocaleString() }}</strong> variants with carriers</p>
                        </div>
                        <div class="pbg-summary-mode">
                            <button class="pbg-mode-check" :class="{ 'pbg-mode-check--active': !expandedVariantId }" type="button" @click="setPublicGeneMode"><i></i> Gene</button>
                            <button class="pbg-mode-check" :class="{ 'pbg-mode-check--active': !!expandedVariantId }" type="button" :disabled="!expandedVariantId"><i></i> Variant</button>
                        </div>
                    </div>
                    <section class="pbg-summary-band" aria-label="Carrier summary details">
                        <CarrierSummaryKpis :summary="activePublicCarrierSummary" :carrier-count="publicSummaryCarrierCount"
                                            :gene-carrier-count="Number(distinctCarriers) || 0" :gene-symbol="geneInfo.symbol"
                                            :variant-id="expandedVariantId || ''" :association="genePhenotypeAssociations[0] || null"
                                            :co-carrier-genes="publicCoCarrierGenes" />
                        <div class="pbg-summary-panel-grid">
                            <article class="pbg-summary-card">
                                <div class="pbg-summary-card-head"><div class="pbg-association-heading"><div class="pbg-association-title-line">
                                    <strong>Top phenotype associations</strong>
                                    <button class="pbg-info-button pbg-info-button--small" type="button" aria-label="About phenotype association results" aria-describedby="public-gene-association-help-summary">
                                        ?<span id="public-gene-association-help-summary" class="pbg-info-tooltip" role="tooltip">Displayed OR and 95% CI are approximate effects per 0.1-point increase in gene burden score. q is adjusted across genes within each HPO.</span>
                                    </button>
                                </div><p>Gene-level · binary HPO phenotypes</p></div><span>{{ genePhenotypeAssociations.length ? `${genePhenotypeAssociations.length} release associations` : 'Unavailable' }}</span></div>
                                <div class="pbg-summary-card-body pbg-summary-association-table">
                                    <div v-if="publicSummaryAssociations.length" class="pbg-summary-association-head">
                                        <button class="pbg-summary-sort" type="button" @click="sortSummaryColumn('phenotype', 'label')">Phenotype <i>{{ summarySortIndicator('phenotype', 'label') }}</i></button>
                                        <button class="pbg-summary-sort" type="button" @click="sortSummaryColumn('phenotype', 'oddsRatio')">OR <i>{{ summarySortIndicator('phenotype', 'oddsRatio') }}</i></button>
                                        <button class="pbg-summary-sort" type="button" @click="sortSummaryColumn('phenotype', 'pValue')">p <i>{{ summarySortIndicator('phenotype', 'pValue') }}</i></button>
                                        <button class="pbg-summary-sort" type="button" title="Adjusted across genes within each HPO" @click="sortSummaryColumn('phenotype', 'qValue')">q <i>{{ summarySortIndicator('phenotype', 'qValue') }}</i></button>
                                    </div>
                                    <div v-for="association in publicSummaryAssociations" :key="association.hpoId" class="pbg-summary-association-row">
                                        <span>{{ association.label }} <small>{{ association.hpoId }}</small></span>
                                        <strong>{{ publicStatistic(association.oddsRatio) }}</strong>
                                        <span>{{ publicPValue(association.pValue) }}</span>
                                        <span>{{ publicPValue(association.qValue) }}</span>
                                    </div>
                                    <p v-if="!publicSummaryAssociations.length" class="pbg-empty-note">{{ associationsLoading ? 'Loading precomputed associations…' : associationsError || 'No precomputed associations are listed for this gene.' }}</p>
                                </div>
                                <div v-if="publicAssociationPageCount > 1" class="pbg-summary-card-foot">
                                    <SummaryPager :page="summaryPages.phenotype" :total-pages="publicAssociationPageCount" label="Phenotype association pages" input-id="public-gene-association-page" @change="setSummaryPage('phenotype', $event)" />
                                </div>
                            </article>
                            <article class="pbg-summary-card">
                                <div class="pbg-summary-card-head"><strong>Carrier genotype profile</strong><span>{{ activePublicCarrierSummary ? `${activePublicCarrierSummary.coCarrierGenes.length} co-carrier genes` : 'Loading' }}</span></div>
                                <div class="pbg-summary-card-body pbg-summary-mini-table">
                                    <div class="pbg-summary-mini-head">
                                        <button class="pbg-summary-sort" type="button" @click="sortSummaryColumn('genotype', 'gene')">Co-carrier gene <i>{{ summarySortIndicator('genotype', 'gene') }}</i></button>
                                        <button class="pbg-summary-sort" type="button" @click="sortSummaryColumn('genotype', 'count')">Carriers <i>{{ summarySortIndicator('genotype', 'count') }}</i></button>
                                        <button class="pbg-summary-sort" type="button" title="Carriers whose samples-info genes include this co-carrier gene, divided by all carriers of the current gene or selected variant. Missing metadata can lower this percentage." @click="sortSummaryColumn('genotype', 'overlap')">% overlap <i>{{ summarySortIndicator('genotype', 'overlap') }}</i></button>
                                    </div>
                                    <div v-for="gene in visiblePublicCoCarrierGenes" :key="'public-cogene-' + gene.gene" class="pbg-summary-mini-row">
                                        <a class="pbg-table-link" :href="`/public_Gene.html?query=${gene.gene}`">{{ gene.gene }}</a>
                                        <span>{{ gene.count }}</span>
                                        <span>{{ activePublicCarrierSummary && activePublicCarrierSummary.status === 'ready' ? `${Math.round(gene.count / Math.max(gene.denominator || 1, 1) * 100)}%` : '—' }}</span>
                                    </div>
                                    <p v-if="!visiblePublicCoCarrierGenes.length" class="pbg-empty-note">{{ publicCarrierSummaryStatus || 'No co-carrier genes were returned.' }}</p>
                                    <p v-else-if="publicCarrierSummaryStatus" class="pbg-empty-note">{{ publicCarrierSummaryStatus }}</p>
                                </div>
                                <div v-if="publicCoCarrierPageCount > 1" class="pbg-summary-card-foot">
                                    <SummaryPager :page="summaryPages.genotype" :total-pages="publicCoCarrierPageCount" label="Co-carrier gene pages" input-id="public-gene-cocarrier-page" @change="setSummaryPage('genotype', $event)" />
                                </div>
                            </article>
                            <article class="pbg-summary-card pbg-summary-card--demo">
                                <div class="pbg-summary-card-head"><strong>Carrier demographics</strong><span>{{ activePublicCarrierSummary ? `${activePublicCarrierSummary.matchedMetadataCount}/${activePublicCarrierSummary.carrierTotal} carriers` : 'Loading' }}</span></div>
                                <div v-if="publicDemographicsHasRows" class="pbg-summary-card-body pbg-summary-demo-grid">
                                    <div class="pbg-summary-demo-investigators">
                                        <p class="pbg-summary-demo-heading"><button class="pbg-summary-sort pbg-summary-demo-sort" type="button" @click="sortSummaryColumn('project', 'project')">By Project <i>{{ summarySortIndicator('project', 'project') }}</i></button><button class="pbg-summary-sort pbg-summary-demo-sort" type="button" @click="sortSummaryColumn('project', 'count')">Count <i>{{ summarySortIndicator('project', 'count') }}</i></button></p>
                                        <div v-for="row in visiblePublicProjects" :key="'public-project-' + row.project" class="pbg-summary-demo-row"><span :title="row.project">{{ row.project }}</span><i><b class="pbg-demo-fill--inv" :style="{ width: publicDemoBarWidth(row.count) }"></b></i><strong>{{ row.count }}</strong></div>
                                        <SummaryPager v-if="publicProjectPageCount > 1" compact class="pbg-summary-investigator-pager"
                                                      :page="summaryPages.project" :total-pages="publicProjectPageCount"
                                                      label="Project pages" input-id="public-gene-project-page"
                                                      @change="setSummaryPage('project', $event)" />
                                    </div>
                                    <div>
                                        <p>By age</p>
                                        <div v-for="row in publicDemographics.byAge" :key="'public-age-' + row.band" class="pbg-summary-demo-row"><span>{{ row.band }}</span><i><b :style="{ width: publicDemoBarWidth(row.count) }"></b></i><strong>{{ row.count }}</strong></div>
                                    </div>
                                    <div>
                                        <p>By sex</p>
                                        <div v-for="row in publicDemographics.bySex" :key="'public-sex-' + row.label" class="pbg-summary-demo-row"><span>{{ row.label }}</span><i><b class="pbg-demo-fill--sex" :style="{ width: publicDemoBarWidth(row.count) }"></b></i><strong>{{ row.count }}</strong></div>
                                        <p>Affected</p>
                                        <div v-for="row in publicDemographics.byAffected" :key="'public-aff-' + row.label" class="pbg-summary-demo-row"><span>{{ row.label }}</span><i><b class="pbg-demo-fill--aff" :style="{ width: publicDemoBarWidth(row.count) }"></b></i><strong>{{ row.count }}</strong></div>
                                    </div>
                                </div>
                                <p v-else class="pbg-empty-note pbg-summary-empty-note">{{ publicCarrierSummaryStatus || 'No carrier metadata was returned.' }}</p>
                                <p v-if="publicDemographicsHasRows && publicCarrierSummaryStatus" class="pbg-empty-note pbg-summary-empty-note">{{ publicCarrierSummaryStatus }}</p>
                            </article>
                        </div>
                    </section>
                    <p class="pbg-summary-bridge">↑ {{ expandedVariantId
                        ? 'Summary above shows only carriers of the selected variant.'
                        : 'Summary above is aggregated from the variants below and updates with your selection.' }}</p>
                    <div class="pbg-variant-evidence-block">
                        <div class="pbg-variant-evidence-head">
                            <p class="pbg-section-label">Variant evidence for {{ geneInfo.symbol }}</p>
                            <span>{{ variantsLoading ? 'Loading variant annotations' : variantsError || `${variantRows.length} variants with carriers · sample IDs hidden` }}</span>
                        </div>
                        <div class="pbg-ve-context-group-row">
                            <form class="pbg-ve-position-search" role="search" aria-label="Find variant by genomic position" @submit.prevent="searchVariantPosition">
                                <label for="public-gene-variant-position">Position</label>
                                <input id="public-gene-variant-position" v-model.trim="variantPositionQuery" type="search"
                                       :placeholder="variantPositionPlaceholder" autocomplete="off" spellcheck="false"
                                       :aria-invalid="variantPositionError ? 'true' : 'false'">
                                <button type="submit">Find</button>
                                <span v-if="variantPositionError" class="pbg-ve-position-error" role="alert">{{ variantPositionError }}</span>
                            </form>
                            <span class="pbg-ve-context-group">Custom HPO Context-Based</span>
                        </div>
                        <div v-if="publicContextTerms.length && !publicContextLoading && !publicContextError" class="public-gene-effect-availability" role="status">
                            <span>{{ supportedPublicEffectCount }} of {{ variantRows.length }} variants have public Effect Score (β) and p-value results. Values are shown when the analysis returns a valid result, including variants with one carrier.</span>
                            <button v-if="supportedPublicEffectCount" type="button" @click="showSupportedPublicEffects">Show β/p results first</button>
                        </div>
                        <div class="pbg-ve-table-head" aria-label="Variant evidence columns">
                            <span></span>
                            <button class="pbg-ve-sort" type="button" @click="sortVariants('position')"><i>{{ variantSortIndicator('position') }}</i><span>Variant</span></button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariants('carriers')"><i>{{ variantSortIndicator('carriers') }}</i><span>Carriers</span></button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariants('consequence')"><i>{{ variantSortIndicator('consequence') }}</i><span>Consequence</span></button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariants('clinvar')"><i>{{ variantSortIndicator('clinvar') }}</i><span>ClinVar</span></button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariants('score')">
                                <i>{{ variantSortIndicator('score') }}</i>
                                <span>
                                    Variant Score
                                    <abbr class="pbg-score-help"
                                          title="In silico Variant Effect Prediction Score(LOFTEE-HC, AlphaMissense)"
                                          aria-label="In silico Variant Effect Prediction Score(LOFTEE-HC, AlphaMissense)"
                                          @click.stop>?</abbr>
                                </span>
                            </button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariants('matchScore')"><i>{{ variantSortIndicator('matchScore') }}</i><span>Match Score</span></button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariants('effectScore')"><i>{{ variantSortIndicator('effectScore') }}</i><span>Effect Score (β)</span></button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariants('pValue')"><i>{{ variantSortIndicator('pValue') }}</i><span>p-value</span></button>
                        </div>
                        <p class="pbg-score-legend"><strong>—*</strong> REVEL available for reference; excluded from Variant Score. <span>Sample IDs and CRDC frequency are hidden; carrier counts include all carriers. Match Score is the mean carrier residual PheRS. Supported aggregate β and p-values appear after HPO analysis.</span></p>
                        <template v-for="row in visibleVariantRows">
                            <div :key="row.id" :data-variant-id="row.id" class="pbg-ve-row" :class="{ 'pbg-ve-row--expanded': expandedVariantId === row.id, 'pbg-ve-row--search-hit': variantSearchStart != null && variantSearchResultId === row.id }"
                                 role="button" tabindex="0" :aria-expanded="expandedVariantId === row.id ? 'true' : 'false'"
                                 @click="toggleVariant(row.id)" @keydown.enter.prevent="toggleVariant(row.id)" @keydown.space.prevent="toggleVariant(row.id)">
                                <span class="pbg-ve-chevron">{{ expandedVariantId === row.id ? '⌄' : '›' }}</span>
                                <span class="pbg-variant-id">{{ row.id }}</span>
                                <span class="pbg-ve-carriers">{{ row.carrierCount.toLocaleString() }}</span>
                                <span class="pbg-ve-consequence">{{ row.consequence || 'Unavailable' }}</span>
                                <span class="pbg-ve-clinvar"><span class="pbg-clinvar-badge" :class="pathogenicityClass(row.clinvar)">{{ row.clinvar || 'Unavailable' }}</span></span>
                                <span><strong class="pbg-score-badge">{{ variantScoreDisplay(row) }}</strong></span>
                                <span v-if="!publicContextTerms.length" class="pbg-no-context">no context</span>
                                <strong v-else-if="row.phenotypeMatchScore != null" class="pbg-score-badge">{{ publicStatistic(row.phenotypeMatchScore) }}</strong>
                                <span v-else class="pbg-no-context">Unavailable</span>
                                <span v-if="!publicContextTerms.length" class="pbg-no-context">no context</span>
                                <strong v-else-if="row.variantEffectBeta != null" class="pbg-score-badge">{{ publicStatistic(row.variantEffectBeta) }}</strong>
                                <span v-else class="pbg-no-context" title="No valid public effect result was returned">Unavailable</span>
                                <span v-if="!publicContextTerms.length" class="pbg-no-context">no context</span>
                                <strong v-else-if="row.variantEffectPValue != null" class="pbg-score-badge">{{ publicPValue(row.variantEffectPValue) }}</strong>
                                <span v-else class="pbg-no-context" title="No valid public p-value result was returned">Unavailable</span>
                            </div>
                            <div v-if="expandedVariantId === row.id" :key="row.id + '-details'" class="pbg-variant-expanded">
                                <div class="pbg-selected-variant-evidence">
                                    <div class="pbg-selected-variant-head"><p class="pbg-section-label">Selected variant evidence</p></div>
                                    <section class="pbg-evidence-group">
                                        <p class="pbg-evidence-group-title">Variant identity</p>
                                        <div class="pbg-selected-kv">
                                            <div class="pbg-selected-kv-row"><span>Variant</span><strong>{{ row.id }}</strong></div>
                                            <div class="pbg-selected-kv-row"><span>Consequence</span><strong>{{ row.consequence || 'Unavailable' }}</strong></div>
                                            <div class="pbg-selected-kv-row"><span>HGVS.c</span><strong>{{ hgvsNotation(row.hgvsc, 'c') }}</strong></div>
                                            <div class="pbg-selected-kv-row"><span>HGVS.p</span><strong>{{ hgvsNotation(row.hgvsp, 'p') }}</strong></div>
                                        </div>
                                    </section>
                                    <section class="pbg-evidence-group">
                                        <p class="pbg-evidence-group-title">Public annotations</p>
                                        <div class="pbg-selected-kv">
                                            <div class="pbg-selected-kv-row"><span>gnomAD AF</span><a class="pbg-ext-link" :href="publicGnomadHref(row.id)" target="_blank" rel="noopener noreferrer" @click.stop>{{ row.gnomadAF || 'Unavailable' }} ↗</a></div>
                                            <div class="pbg-selected-kv-row"><span>ClinVar</span><a class="pbg-ext-link pbg-selected-clinvar" :class="pathogenicityClass(row.clinvar)" :href="publicClinvarHref(row.id)" target="_blank" rel="noopener noreferrer" @click.stop>{{ row.clinvar || 'Unavailable' }} ↗</a></div>
                                            <div class="pbg-selected-kv-row"><span>REVEL</span><strong>{{ row.revel || 'Unavailable' }}</strong></div>
                                            <div class="pbg-selected-kv-row"><span>AlphaMissense</span><strong>{{ row.alphaMissense || 'Unavailable' }}</strong></div>
                                            <div class="pbg-selected-kv-row"><span>LOFTEE</span><strong>{{ row.loftee || 'Unavailable' }}</strong></div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </template>
                        <p v-if="!variantsLoading && !variantRows.length" class="public-gene-empty public-gene-table-empty">{{ variantsError || 'No variants with confirmed carriers were returned for this gene.' }}</p>
                        <nav v-if="variantPageCount > 1" class="pbg-ve-pagination" aria-label="Variant evidence pages">
                            <span v-if="variantSearchStart != null" class="pbg-ve-search-state">Closest variant centered</span>
                            <button type="button" :disabled="variantPage <= 1" @click.stop="goToVariantPage(variantPage - 1)">Previous</button>
                            <button v-for="page in variantPageNumbers" :key="page" type="button"
                                    :class="{ 'pbg-ve-page-active': variantSearchStart == null && variantPage === page }"
                                    :aria-current="variantSearchStart == null && variantPage === page ? 'page' : null"
                                    @click.stop="goToVariantPage(page)">{{ page }}</button>
                            <button type="button" :disabled="variantPage >= variantPageCount" @click.stop="goToVariantPage(variantPage + 1)">Next</button>
                            <form class="pbg-ve-page-jump" aria-label="Go to variant page" @submit.prevent="jumpToVariantPage">
                                <label for="public-gene-variant-page-jump">Page</label>
                                <input id="public-gene-variant-page-jump" v-model.trim="variantPageJump" type="text" inputmode="numeric"
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
import HpoTermInput from "../PbGene/HpoTermInput";
import GeneIdentityPanel from "../PbGene/GeneIdentityPanel";
import { createPublicGeneState, loadPublicCarrierSummary, loadPublicGeneAssociations, loadPublicVariants, publicVariantPageCount, publicVariantPageNumbers, selectPublicHpoContext, sortedPublicVariants, submitPublicGeneSearch, variantScore } from "./pageModel";
import { VARIANT_PAGE_SIZE, findPositionWindow, positionOrderedVariants, positionSearchPlaceholder } from "../PbGene/variantTableNavigation";
import { normalizeCarrierAgeDemographics } from "../PbGene/carrierAge";
import { locusFilterActive, locusFilterKey, refreshLocusFilter } from "../PbGene/locusFilters";
import { ASSOCIATION_PAGE_SIZE, CO_CARRIER_PAGE_SIZE, INVESTIGATOR_PAGE_SIZE, paginate, sortAssociations, sortCoCarrierGenes, sortProjects } from "../PbGene/summaryTable";
import SummaryPager from "../PbGene/SummaryPager";
import CarrierSummaryKpis from "../PbGene/CarrierSummaryKpis";
import { pathogenicityClass } from "../PbGene/clinvarBadge";
import { hgvsNotation } from "../PbGene/hgvsNotation";
import "../PbGene/style.css";
import "./public.css";

export default {
    name: "PublicGeneTemplate",
    components: { HpoTermInput, GeneIdentityPanel, SummaryPager, CarrierSummaryKpis },
    data: createPublicGeneState,
    computed: {
        publicLocusFilterActive() { return locusFilterActive(this); },
        publicLocusFilterRequestKey() {
            const exons = this.genomeWindow.exons;
            if (!exons.length) return "";
            const start = Math.min(...exons.map(row => row.start));
            const end = Math.max(...exons.map(row => row.end));
            return locusFilterKey(this, start, end, 60, !this.variantsLoading && this.referenceAvailable);
        },
        publicAvailableAges() {
            const demographics = this.geneCarrierSummary && this.geneCarrierSummary.geneCarrierDemographics;
            return ["All ages", ...(demographics ? demographics.byAge || [] : []).map(row => row.band)];
        },
        publicAvailableProjects() {
            const demographics = this.geneCarrierSummary && this.geneCarrierSummary.geneCarrierDemographics;
            return ["All projects", ...(demographics ? demographics.byProject || [] : []).map(row => row.project).sort()];
        },
        publicLocusDistinctCarriers() {
            return this.publicLocusFilterActive ? this.locusFilterResult && this.locusFilterResult.distinctCarriers : this.distinctCarriers;
        },
        publicSummaryCarrierCount() {
            if (this.activePublicCarrierSummary) return Number(this.activePublicCarrierSummary.carrierTotal) || 0;
            if (this.expandedVariantId) {
                const row = this.variantRows.find(item => item.id === this.expandedVariantId);
                return row ? Number(row.carrierCount) || 0 : 0;
            }
            return Number(this.distinctCarriers) || 0;
        },
        sortedVariants: sortedPublicVariants,
        positionSortedVariants() { return positionOrderedVariants(this.variantRows); },
        variantPositionPlaceholder() { return positionSearchPlaceholder(this.variantRows); },
        variantPageCount: publicVariantPageCount,
        variantPageNumbers: publicVariantPageNumbers,
        visibleVariantRows() {
            if (this.variantSearchStart != null) {
                return this.positionSortedVariants.slice(this.variantSearchStart, this.variantSearchStart + VARIANT_PAGE_SIZE);
            }
            const page = Math.max(1, Math.min(this.variantPage, this.variantPageCount || 1));
            return this.sortedVariants.slice((page - 1) * VARIANT_PAGE_SIZE, page * VARIANT_PAGE_SIZE);
        },
        annotatedVariantCount() { return this.variantRows.filter(row => variantScore(row) != null).length; },
        supportedPublicEffectCount() { return this.variantRows.filter(row => row.variantEffectBeta != null && row.variantEffectPValue != null).length; },
        publicSummaryAssociations() {
            const sort = this.summarySort.phenotype;
            return paginate(sortAssociations(this.genePhenotypeAssociations, sort.key, sort.dir), this.summaryPages.phenotype, ASSOCIATION_PAGE_SIZE);
        },
        publicAssociationPageCount() { return Math.ceil(this.genePhenotypeAssociations.length / ASSOCIATION_PAGE_SIZE); },
        activePublicCarrierSummary() {
            return this.expandedVariantId
                ? this.variantCarrierSummaries[this.expandedVariantId] || null
                : this.geneCarrierSummary;
        },
        publicCarrierSummaryStatus() {
            const key = this.expandedVariantId || "__gene__";
            if (this.carrierSummaryPending[key]) return this.carrierSummaryProgress[key] || "Loading carrier metadata…";
            return this.carrierSummaryErrors[key] || "";
        },
        publicCoCarrierGenes() { return this.activePublicCarrierSummary ? this.activePublicCarrierSummary.coCarrierGenes || [] : []; },
        visiblePublicCoCarrierGenes() {
            const sort = this.summarySort.genotype;
            return paginate(sortCoCarrierGenes(this.publicCoCarrierGenes, sort.key, sort.dir), this.summaryPages.genotype, CO_CARRIER_PAGE_SIZE);
        },
        publicCoCarrierPageCount() { return Math.ceil(this.publicCoCarrierGenes.length / CO_CARRIER_PAGE_SIZE); },
        publicDemographics() {
            return this.activePublicCarrierSummary
                ? normalizeCarrierAgeDemographics(this.activePublicCarrierSummary.geneCarrierDemographics)
                : { byAge: [], byProject: [], bySex: [], byAffected: [] };
        },
        publicDemographicsHasRows() {
            return ["byAge", "byProject", "bySex", "byAffected"].some(key => (this.publicDemographics[key] || []).length);
        },
        visiblePublicProjects() {
            return paginate(sortProjects(this.publicDemographics.byProject || [], this.summarySort.project.key, this.summarySort.project.dir), this.summaryPages.project, INVESTIGATOR_PAGE_SIZE);
        },
        publicProjectPageCount() { return Math.ceil((this.publicDemographics.byProject || []).length / INVESTIGATOR_PAGE_SIZE); },
        topScoredVariant() {
            return this.variantRows
                .filter(row => variantScore(row) != null)
                .sort((a, b) => variantScore(b) - variantScore(a))[0] || null;
        },
        publicCarrierDensityColumns() {
            const counts = this.publicLocusFilterActive
                ? this.locusFilterResult ? this.locusFilterResult.carrierDensity : []
                : this.carrierDensity;
            const max = Math.max(1, ...counts);
            return counts.map((count, index) => ({
                count,
                left: `${((index + 0.5) / counts.length * 100).toFixed(2)}%`,
                width: `${(100 / counts.length).toFixed(2)}%`,
                height: `${Math.max(2, Math.round(118 * count / max))}px`,
            }));
        },
        locusPositionCount() { return new Set(this.locusVariantMarkers.map(row => row.position)).size; },
        locusVariantMarkers() {
            const exons = this.genomeWindow.exons;
            if (!exons.length) return [];
            const start = Math.min(...exons.map(row => row.start));
            const end = Math.max(...exons.map(row => row.end));
            return this.variantRows
                .filter(row => row.position >= start && row.position <= end)
                .map(row => ({ id: row.id, position: row.position, left: `${((row.position - start) / Math.max(end - start, 1) * 100).toFixed(2)}%` }));
        },
    },
    methods: {
        pathogenicityClass,
        hgvsNotation,
        publicGnomadHref(id) {
            const parts = String(id || "").replace(/^chr/i, "").split(":");
            return parts.length === 4 ? `https://gnomad.broadinstitute.org/variant/${parts.join("-")}` : "";
        },
        publicClinvarHref(id) {
            return id ? `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(id)}` : "";
        },
        refreshLocusFilter,
        submitPublicGeneSearch,
        selectPublicHpoContext,
        showSupportedPublicEffects() {
            this.variantSortKey = "effectScore";
            this.variantSortAsc = false;
            this.variantPage = 1;
            this.variantSearchStart = null;
            this.variantSearchResultId = null;
            this.variantPositionQuery = "";
            this.variantPositionError = "";
        },
        loadPublicGeneAssociations,
        loadPublicVariants,
        loadPublicCarrierSummary,
        setSummaryPage(kind, page) {
            const counts = { phenotype: this.publicAssociationPageCount, genotype: this.publicCoCarrierPageCount, project: this.publicProjectPageCount };
            if (!(kind in counts)) return;
            this.$set(this.summaryPages, kind, Math.max(1, Math.min(Number(page) || 1, counts[kind] || 1)));
        },
        resetSummaryPages() { this.summaryPages = { phenotype: 1, genotype: 1, project: 1 }; },
        setPublicGeneMode() { this.expandedVariantId = null; this.resetSummaryPages(); },
        sortSummaryColumn(kind, key) {
            const current = this.summarySort[kind];
            if (!current) return;
            const defaultDir = (kind === "genotype" && key !== "gene") || (kind === "project" && key === "count") ? "desc" : "asc";
            const dir = current.key === key ? (current.dir === "asc" ? "desc" : "asc") : defaultDir;
            this.$set(this.summarySort, kind, { key, dir });
            this.setSummaryPage(kind, 1);
        },
        summarySortIndicator(kind, key) {
            const sort = this.summarySort[kind];
            return !sort || sort.key !== key ? "▵" : sort.dir === "asc" ? "▲" : "▼";
        },
        variantSortIndicator(key) {
            return this.variantSortKey !== key ? "▵" : this.variantSortAsc ? "▲" : "▼";
        },
        publicDemoBarWidth(count) {
            const total = Math.max(1, (this.activePublicCarrierSummary || {}).carrierTotal || 1);
            return `${Math.min(100, Math.round(count / total * 100))}%`;
        },
        publicStatistic(value) {
            if (value == null || !Number.isFinite(Number(value))) return "—";
            const number = Number(value);
            return number !== 0 && Math.abs(number) < 0.001 ? number.toExponential(2) : number.toFixed(3);
        },
        publicPValue(value) {
            if (value == null || !Number.isFinite(Number(value))) return "—";
            return Number(value) === 0 ? "<1e-300" : this.publicStatistic(value);
        },
        variantScoreDisplay(row) {
            const score = variantScore(row);
            return score == null ? (row.revel ? "—*" : "—") : score.toFixed(2);
        },
        toggleVariant(id) {
            this.expandedVariantId = this.expandedVariantId === id ? null : id;
            this.resetSummaryPages();
            if (this.expandedVariantId) this.loadPublicCarrierSummary(this.expandedVariantId);
        },
        selectVariantMarker(id) {
            this.resetSummaryPages();
            if (this.visibleVariantRows.some(row => row.id === id)) {
                this.expandedVariantId = id;
                this.loadPublicCarrierSummary(id);
                this.$nextTick(() => {
                    const row = [...this.$el.querySelectorAll('[data-variant-id]')].find(node => node.dataset.variantId === id);
                    if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
                });
                return;
            }
            const index = this.sortedVariants.findIndex(row => row.id === id);
            if (index < 0) return;
            this.variantSearchStart = null;
            this.variantSearchResultId = null;
            this.variantPositionQuery = "";
            this.variantPositionError = "";
            this.variantPage = Math.floor(index / VARIANT_PAGE_SIZE) + 1;
            this.expandedVariantId = id;
            this.loadPublicCarrierSummary(id);
            this.$nextTick(() => {
                const row = [...this.$el.querySelectorAll('[data-variant-id]')].find(node => node.dataset.variantId === id);
                if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
            });
        },
        sortVariants(key) {
            if (this.variantSortKey === key) this.variantSortAsc = !this.variantSortAsc;
            else { this.variantSortKey = key; this.variantSortAsc = !["score", "carriers", "matchScore", "effectScore"].includes(key); }
            this.variantSearchStart = null;
            this.variantSearchResultId = null;
            this.variantPositionQuery = "";
            this.variantPositionError = "";
            const index = this.sortedVariants.findIndex(row => row.id === this.expandedVariantId);
            this.variantPage = index >= 0 ? Math.floor(index / VARIANT_PAGE_SIZE) + 1 : 1;
        },
        searchVariantPosition() {
            const found = findPositionWindow(this.variantRows, this.geneInfo, this.variantPositionQuery);
            if (found.error) {
                this.variantPositionError = found.error;
                return;
            }
            this.variantPositionError = "";
            this.variantSortKey = "position";
            this.variantSortAsc = true;
            this.variantSearchStart = found.start;
            this.variantSearchResultId = found.match.id;
            this.variantPage = Math.floor(found.nearestIndex / VARIANT_PAGE_SIZE) + 1;
            this.expandedVariantId = null;
        },
        goToVariantPage(page) {
            this.variantPage = Math.max(1, Math.min(Number(page) || 1, this.variantPageCount || 1));
            this.variantSearchStart = null;
            this.variantSearchResultId = null;
            this.variantPositionQuery = "";
            this.variantPositionError = "";
            this.variantPageJumpError = "";
            this.expandedVariantId = null;
        },
        jumpToVariantPage() {
            const input = String(this.variantPageJump || "").trim();
            const page = Number(input);
            if (!/^\d+$/.test(input) || !Number.isSafeInteger(page) || page < 1 || page > this.variantPageCount) {
                this.variantPageJumpError = "Invalid page";
                return;
            }
            this.goToVariantPage(page);
            this.variantPageJump = "";
        },
    },
    created() { this.loadPublicVariants(); this.loadPublicGeneAssociations(); },
    watch: {
        publicLocusFilterRequestKey() { this.refreshLocusFilter(); },
    },
};
</script>
