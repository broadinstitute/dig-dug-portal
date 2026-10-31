<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents" />
        <main class="container-fluid mdkp-body pbg-page pg2-page">
            <div class="pbg-shell">
                <div class="pbg-toolbar">
                    <div class="pbg-toolbar-left">
                        <a href="/pb_front2.html" class="pbg-home-link" aria-label="PB portal home">
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
                            <button class="pbg-gene-search-submit" type="submit" :disabled="searchGeneLoading || contextLoading">
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


                <p v-if="searchGeneError" class="pg2-error pg2-card" role="alert">{{ searchGeneError }}</p>
                <p v-if="!liveDataLoaded && searchGeneLoading" class="pg2-card pg2-muted" role="status">Loading gene evidence…</p>
                <template v-if="liveDataLoaded">
                    <section class="pg2-card pg2-overview">
                        <gene-identity :gene-info="geneInfo" />
                        <div class="pg2-metrics">
                            <div><span>Distinct carriers</span><strong>{{ Number(totalGeneCarriers).toLocaleString() }}</strong></div>
                            <div><span>Variants with carriers</span><strong>{{ variantRows.length.toLocaleString() }}</strong></div>
                            <div><span>Variants with prediction annotations <button class="pg2-info" type="button" title="Variants with at least one LoFTEE, AlphaMissense or REVEL annotation. This counts available annotations, not pathogenic clinical diagnoses." aria-label="About prediction annotation coverage"><b-icon-info-circle /></button></span><strong>{{ predictionAnnotatedVariantCount.toLocaleString() }} <small>/ {{ variantRows.length.toLocaleString() }}</small></strong></div>
                            <div><span>Phenotype associations</span><strong>{{ genePhenotypeAssociations.length.toLocaleString() }}</strong></div>
                        </div>
                        <div class="pg2-variant-mix"><span>ClinVar</span><button v-for="item in variantMix.clinvar" :key="item.label" type="button" class="pg2-mix-item" :class="{ 'pg2-mix-active': variantFilters.clinvar.includes(item.label) }" :aria-pressed="String(variantFilters.clinvar.includes(item.label))" @click="toggleVariantFilter('clinvar', item.label)">{{ item.label }} <strong>{{ item.count }}</strong></button></div>
                        <div class="pg2-variant-mix"><span>Consequence / annotation</span><button v-for="item in variantMix.consequence" :key="item.label" type="button" class="pg2-mix-item" :title="item.label === 'Missense' ? 'Missense consequence: an amino-acid substitution.' : 'All non-missense consequences, including frameshift, stop-gained and splice variants. This is not a clinical classification.'" :class="{ 'pg2-mix-active': variantFilters.consequence.includes(item.label) }" :aria-pressed="String(variantFilters.consequence.includes(item.label))" @click="toggleVariantFilter('consequence', item.label)">{{ item.label }} <strong>{{ item.count }}</strong></button><button v-for="item in variantMix.annotations" :key="item.label" type="button" class="pg2-mix-item pg2-mix-annotation" :title="item.label === 'AM annotated' ? 'Variants with an AlphaMissense score, including zero. Counts annotation availability.' : 'Variants with a REVEL score, including zero. Counts annotation availability.'" :class="{ 'pg2-mix-active': variantFilters.annotations.includes(item.label) }" :aria-pressed="String(variantFilters.annotations.includes(item.label))" @click="toggleVariantFilter('annotations', item.label)">{{ item.label }} <strong>{{ item.count }}</strong></button><button type="button" class="pg2-mix-item pg2-mix-annotation" :class="{ 'pg2-mix-active': variantFilters.loftee }" :aria-pressed="String(variantFilters.loftee)" @click="toggleVariantFilter('loftee')">LoFTEE HC <strong>{{ variantMix.loftee }}</strong></button></div>
                        <div v-if="variantFiltersActive" class="pg2-variant-filter-status"><a href="#pg2-variant-evidence">{{ matchingVariantRows.length }} / {{ variantRows.length }} matching variants</a><span>{{ variantFilterLabel }}</span><button class="pg2-text-button" type="button" @click="clearVariantFilters">Clear filters</button></div>
                        <details class="pg2-detail" data-testid="gene-demographics">
                            <summary><b-icon-chevron-right /> Gene carrier demographics <small>{{ geneMetadataLabel }}</small></summary>
                            <demographics :summary="geneCarrierSummary" :fallback="{}" :carrier-count="Number(totalGeneCarriers) || 0" :status="carrierSummaryProgress.__gene__ || carrierSummaryErrors.__gene__ || ''" scope="gene" />
                        </details>
                    </section>
                    <section class="pg2-card pg2-associations" aria-labelledby="pg2-associations-title">
                        <div class="pg2-section-heading"><h2 id="pg2-associations-title">Precomputed gene–phenotype associations</h2><button type="button" class="pg2-info" aria-label="About precomputed association units" title="Approximate binary-HPO score-test coefficients in log-odds per 0.1 GRS; not residual-PheRS SD units. Original release p/q values and row order are preserved. q is adjusted across genes within each HPO."><b-icon-info-circle /></button></div>
                        <label class="pg2-association-search">Find a phenotype<input v-model="associationSearch" type="search" placeholder="Search phenotype names or HPO IDs" aria-label="Find a precomputed phenotype" /></label>
                        <div class="pg2-table-scroll">
                            <table class="pg2-table pg2-association-table">
                                <thead><tr><th>Phenotype</th>
                                    <th v-for="column in associationColumns" :key="column.key" class="pg2-numeric" :aria-sort="associationAriaSort(column.key)">
                                        <button class="pg2-sort-button" type="button" :title="column.help || 'Sort by ' + column.label" @click="sortAssociationColumn(column.key)">{{ column.label }}
                                            <small v-if="column.key === 'beta'">(log-odds)</small>
                                            <b-icon-sort-down v-if="associationSortKey === column.key && associationSortDirection === 'desc'" /><b-icon-sort-up v-else-if="associationSortKey === column.key" /><b-icon-arrow-down-up v-else />
                                        </button>
                                    </th><th><span class="pg2-sr-only">Pin result</span></th></tr></thead>
                                <tbody v-if="pinnedAssociations.length" class="pg2-pinned" data-testid="pinned-associations">
                                    <tr class="pg2-group-label"><td colspan="7"><b-icon-pin-angle-fill /> Pinned · {{ pinnedAssociations.length }}</td></tr>
                                    <tr v-for="row in sortedPinnedAssociations" :key="'pin-' + row.hpoId" class="pg2-pinned-row">
                                        <td><a :href="phenotypeUrl(row.hpoId)">{{ row.label }}</a><small>{{ row.hpoId }}</small></td><td class="pg2-numeric">{{ contextStatistic(row.betaPer0_1Grs) }}</td><td class="pg2-numeric">{{ associationInterval(row) }}</td><td class="pg2-numeric">{{ contextStatistic(row.pValue) }}</td><td class="pg2-numeric">{{ contextStatistic(row.qValue) }}</td><td class="pg2-numeric" :title="phenotypeCountTitle">{{ phenotypeCarrierCount(row.hpoId) }}</td><td><button class="pg2-pin" type="button" :aria-label="'Unpin ' + row.label" aria-pressed="true" @click="toggleAssociationPin(row)"><b-icon-pin-angle-fill /></button></td>
                                    </tr>
                                </tbody>
                                <tbody data-testid="association-search-results">
                                    <tr class="pg2-group-label"><td colspan="7">{{ associationSearch ? 'Search results' : 'Release results' }} · {{ filteredAssociations.length }}</td></tr>
                                    <tr v-for="row in visibleAssociations" :key="row.hpoId">
                                        <td><a :href="phenotypeUrl(row.hpoId)">{{ row.label }}</a><small>{{ row.hpoId }}</small></td><td class="pg2-numeric">{{ contextStatistic(row.betaPer0_1Grs) }}</td><td class="pg2-numeric">{{ associationInterval(row) }}</td><td class="pg2-numeric">{{ contextStatistic(row.pValue) }}</td><td class="pg2-numeric">{{ contextStatistic(row.qValue) }}</td><td class="pg2-numeric" :title="phenotypeCountTitle">{{ phenotypeCarrierCount(row.hpoId) }}</td><td><button class="pg2-pin" type="button" :aria-label="'Pin ' + row.label" aria-pressed="false" @click="toggleAssociationPin(row)"><b-icon-pin-angle /></button></td>
                                    </tr>
                                    <tr v-if="!filteredAssociations.length"><td colspan="7" class="pg2-empty">{{ associationSearch ? 'No other release results match this search.' : genePhenotypeAssociations.length ? 'All release results are pinned above.' : 'Precomputed results are not available for this gene.' }}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="pg2-association-foot"><span>Pinned rows stay visible when you change the search.</span><button v-if="filteredAssociations.length > 5" type="button" class="pg2-text-button" @click="showAllAssociations = !showAllAssociations">{{ showAllAssociations ? 'Show fewer' : 'Show all ' + filteredAssociations.length }}</button></div>
                    </section>
                    <context-panel :active-context-terms="activeContextTerms" :context-term-details="contextTermDetails" :context-input.sync="contextInput" :context-loading="contextLoading || searchGeneLoading" :context-score-type.sync="contextScoreType" :context-analysis-set.sync="contextAnalysisSet" :context-significance-threshold.sync="contextSignificanceThreshold" :context-min-carriers.sync="contextMinCarriers" :external-phenotype-result-url="externalPhenotypeResultUrl" :context-error="contextError" :context-runs="contextRuns" :run-meta="contextRunMeta" :current-run-id="currentContextRunId" @run="runContextAnalysis" />
                    <section id="pg2-variant-evidence" class="pg2-card pg2-variant-evidence">
                        <p class="pg2-variant-applied">{{ appliedContextLabel }}</p>
                    <div class="pbg-variant-evidence-block">
                        <div class="pbg-variant-evidence-head">
                            <p class="pbg-section-label">
                                Variant evidence for {{ geneInfo.symbol }}
                                <span class="pbg-crdc-badge" title="Source: CRDC cohort">CRDC</span>
                            </p>
                            <span>{{ matchingVariantRows.length }} / {{ variantRows.length }} variants with carriers</span>
                        </div>

                        <div class="pbg-ve-context-group-row">
                            <form class="pbg-ve-position-search" role="search" aria-label="Find variant by position, HGVS or rsID" @submit.prevent="searchVariantPosition">
                                <label for="pbg-variant-position">Find variant</label>
                                <input id="pbg-variant-position" v-model.trim="variantPositionQuery" type="search"
                                       placeholder="Position / HGVS / rsID" title="Examples: 20189551, c.35delG, c.167delT, c.235delC, rs80338939" autocomplete="off" spellcheck="false"
                                       :aria-invalid="variantPositionError ? 'true' : 'false'">
                                <button type="submit">Find</button>
                                <span v-if="variantPositionError" class="pbg-ve-position-error" role="alert">{{ variantPositionError }}</span>
                                <span v-if="variantIdentifierIds !== null" class="pg2-identifier-search-state">{{ variantIdentifierIds.length }} variant match{{ variantIdentifierIds.length === 1 ? '' : 'es' }} · {{ appliedVariantQuery }} <button class="pg2-text-button" type="button" @click="clearVariantIdentifierSearch">Clear search</button></span>
                            </form>
                            <span class="pbg-ve-context-group">Custom HPO context-based</span>
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
                                    Mean rPheRS Z-score
                                    <abbr class="pbg-score-help"
                                          title="Mean of the unique carriers' individual residual PheRS Z-scores for this HPO context, using the full scoring-cohort reference. No partial mean is shown when any carrier score is missing."
                                          aria-label="Mean rPheRS Z-score: average individual Z-score across unique carriers."
                                          @click.stop>?</abbr>
                                    <em>CRDC</em>
                                </span>
                            </button>
                            <button class="pbg-ve-sort" type="button" title="Covariate-adjusted residual PheRS difference between variant noncarriers (0) and carriers (1), in full scoring-cohort SD units. This is a regression effect, not the carrier mean." @click="sortVariantsBy('effectScore')"><i>{{ variantSortIndicator('effectScore') }}</i><span>Variant effect β (SD)</span></button>
                            <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('pValue')"><i>{{ variantSortIndicator('pValue') }}</i><span>p-value</span></button>
                        </div>
                        <details class="pg2-score-notes"><summary>Score annotation notes</summary><p class="pbg-score-legend">
                            <strong>—*</strong> REVEL available; excluded from this score.
                            <span><strong>—</strong> No LoFTEE HC, AlphaMissense, or REVEL annotation.</span>
                        </p></details>

                        <template v-for="row in comparisonVariantRows">
                            <p v-if="pinnedVariantRows.length && row.id === pinnedVariantRows[0].id" :key="row.id + '-pinned-heading'" class="pg2-variant-pin-heading"><b-icon-pin-angle-fill /> Pinned variants · {{ pinnedVariantRows.length }}</p>
                            <p v-if="pinnedVariantRows.length && unpinnedVisibleVariantRows.length && row.id === unpinnedVisibleVariantRows[0].id" :key="row.id + '-page-heading'" class="pg2-variant-page-heading">Current page results</p>
                            <div :key="row.id"
                                 :data-variant-id="row.id"
                                 class="pbg-ve-row"
                                 :class="{ 'pg2-pinned-variant-row': isVariantPinned(row.id), 'pbg-ve-row--expanded': expandedVariantId === row.id, 'pbg-ve-row--af-warning': variantHasHighAf(row), 'pbg-ve-row--search-hit': variantSearchStart != null && variantSearchResultId === row.id }"
                                 role="button"
                                tabindex="0"
                                :aria-expanded="expandedVariantId === row.id ? 'true' : 'false'"
                                :aria-controls="'variant-detail-' + row.id"
                                @click="toggleVariant(row.id)"
                                @keydown.enter.self.prevent="toggleVariant(row.id)"
                                @keydown.space.self.prevent="toggleVariant(row.id)">
                                <span class="pbg-ve-chevron"><b-icon-chevron-down v-if="expandedVariantId === row.id" /><b-icon-chevron-right v-else /></span>
                                <span class="pbg-variant-id">
                                    <span>{{ row.id }}<small v-if="isVariantPinned(row.id) && (!matchesVariantFilters(row) || !matchesVariantIdentifier(row))" class="pg2-outside-filter">Pinned · outside filter</small><sup v-if="variantHasHighAf(row)" class="pbg-af-star" :title="variantAfWarningText(row)">*</sup></span>
                                    <button class="pg2-pin pg2-variant-pin" type="button" :aria-label="(isVariantPinned(row.id) ? 'Unpin ' : 'Pin ') + row.id" :aria-pressed="String(isVariantPinned(row.id))" :title="isVariantPinned(row.id) ? 'Unpin variant' : 'Keep this variant visible across pages and sorting'" @click.stop="toggleVariantPin(row.id)"><b-icon-pin-angle-fill v-if="isVariantPinned(row.id)" /><b-icon-pin-angle v-else /></button>
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
                                        :title="row.variantAssociationLowCarrierCount ? 'Covariate-adjusted carrier versus noncarrier difference in residual PheRS, in reference-cohort SD units; exploratory because fewer than 10 carriers were scored.' : 'Covariate-adjusted carrier versus noncarrier difference in residual PheRS, in reference-cohort SD units.'">
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
                                <variant-summary :variant="row" :gene="geneInfo.symbol" :summary="variantCarrierSummaries[row.id] || null" :status="carrierSummaryProgress[row.id] || carrierSummaryErrors[row.id] || ''" :context="appliedContext" />
                                <details class="pg2-detail pg2-variant-demographics">
                                    <summary><b-icon-chevron-right /> Variant carrier demographics · {{ row.carrierCount }} carriers</summary>
                                    <demographics :summary="variantCarrierSummaries[row.id] || null" :carrier-count="Number(row.carrierCount) || 0" :status="carrierSummaryProgress[row.id] || carrierSummaryErrors[row.id] || ''" :scope="row.id" />
                                </details>
                                <details class="pg2-detail"><summary><b-icon-chevron-right /> Variant annotation</summary>
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

                                </details>
                                <details class="pg2-detail"><summary><b-icon-chevron-right /> Carrier samples · {{ row.carrierCount }}</summary>
                                <div class="pbg-selected-carriers">
                                    <p class="pbg-section-label">Carrier samples - {{ row.carrierCount }} total</p>
                                    <div class="pbg-selected-sample-table">
                                        <div class="pbg-selected-sample-head">
                                            <span>Sample</span>
                                            <span>Age</span>
                                            <span>Sex</span>
                                            <span>GT</span>
                                            <span>HPO terms</span>
                                            <span title="Individual residual PheRS relative to the scoring-cohort mean, in sample SD units; unavailable when individual scores are not supplied.">rPheRS Z-score</span>
                                            <span>Co-genes</span>
                                            <span>Project</span>
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
                                            <span class="pbg-no-context" :title="activeContextTerms.length ? 'Individual rPheRS Z-scores are not available for these carriers.' : 'Run an HPO context analysis to request matching.'">{{ activeContextTerms.length ? '—' : 'no context' }}</span>
                                            <div class="pbg-co-gene-cell">
                                                <span>{{ coGenePreview(carrierSampleField(s, 'genes')) }}</span>
                                                <details v-if="coGeneRemaining(carrierSampleField(s, 'genes')).length">
                                                    <summary>+{{ coGeneRemaining(carrierSampleField(s, 'genes')).length }} more</summary>
                                                    <span>{{ coGeneRemaining(carrierSampleField(s, 'genes')).join(', ') }}</span>
                                                </details>
                                            </div>
                                            <span>{{ carrierSampleField(s, 'project') || 'Unavailable' }}</span>
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
                                </details>
                            </div>
                        </template>
                        <p v-if="!comparisonVariantRows.length" class="pg2-empty">No variants match the current filters. <button v-if="variantFiltersActive" class="pg2-text-button" type="button" @click="clearVariantFilters">Clear filters</button></p>
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
                </template>
            </div>
        </main>
    </div>
</template>
<script>
import { createPbGeneState, pbGeneComputed, pbGeneMethods } from "../PbGene/pageModel";
import { hpoLabel } from "../PbGene/hpoContextSearch";
import { filterAssociations, togglePinnedAssociation, sortAssociationRows } from "./associationRows";
import { variantFacets, matchesVariantFacets } from "./variantFacets";
import { findPositionWindow, parsePositionQuery, VARIANT_PAGE_SIZE } from "../PbGene/variantTableNavigation";
import { matchVariantIdentifiers } from "../PbGene/variantLookup";
import GeneIdentity from "./GeneIdentity";
import Demographics from "./Demographics";
import ContextPanel from "./ContextPanel";
import VariantSummary from "./VariantSummary";
import "../PbGene/style.css";
import "./style.css";

export default {
    name: "PbGene2Template",
    components: { GeneIdentity, Demographics, ContextPanel, VariantSummary },
    data() {
        return { ...createPbGeneState(), associationSearch: '', associationSortKey: '', associationSortDirection: 'asc', pinnedAssociations: [], pinnedVariantIds: [], variantIdentifierIds: null, appliedVariantQuery: '', variantFilters: { clinvar: [], consequence: [], annotations: [], loftee: false }, showAllAssociations: false, contextRunMeta: {}, currentContextRunId: '', appliedContext: null, receivedContextReference: null };
    },
    mounted() { this.loadLiveGeneData(this.searchGeneQuery, false).catch(() => {}); },
    computed: {
        ...pbGeneComputed,
        facetMatchingVariantRows() { return this.variantRows.filter(this.matchesVariantFilters); },
        matchingVariantRows() { return this.facetMatchingVariantRows.filter(this.matchesVariantIdentifier); },
        sortedVariantRows() { return pbGeneComputed.sortedVariantRows.call(this).filter(row => this.matchesVariantFilters(row) && this.matchesVariantIdentifier(row)); },
        positionSortedVariantRows() { return pbGeneComputed.positionSortedVariantRows.call(this).filter(row => this.matchesVariantFilters(row) && this.matchesVariantIdentifier(row)); },
        variantPageCount() { return Math.ceil(this.matchingVariantRows.length / VARIANT_PAGE_SIZE); },
        variantFiltersActive() { return Boolean(this.variantFilters.clinvar.length || this.variantFilters.consequence.length || this.variantFilters.annotations.length || this.variantFilters.loftee); },
        variantFilterLabel() { return [...this.variantFilters.clinvar, ...this.variantFilters.consequence, ...this.variantFilters.annotations, ...(this.variantFilters.loftee ? ['LoFTEE HC'] : [])].join(' · '); },
        pinnedVariantRows() { const rows = new Map(this.variantRows.map(row => [row.id, row])); return this.pinnedVariantIds.map(id => rows.get(id)).filter(Boolean); },
        unpinnedVisibleVariantRows() { const pinned = new Set(this.pinnedVariantIds); return this.visibleVariantRows.filter(row => !pinned.has(row.id)); },
        comparisonVariantRows() { return [...this.pinnedVariantRows, ...this.unpinnedVisibleVariantRows]; },
        associationColumns() { return [ { key: 'beta', label: 'β per 0.1 GRS' }, { key: 'ci', label: '95% CI', help: 'Sort by lower confidence limit, then upper limit' }, { key: 'p', label: 'p' }, { key: 'q', label: 'q' }, { key: 'carriers', label: 'Carriers with term', help: 'Sort by recorded HPO carrier count; partial HPO metadata coverage is labelled' } ]; },
        filteredAssociations() { return filterAssociations(this.genePhenotypeAssociations, this.associationSearch, this.pinnedAssociations); },
        sortedAssociations() { return sortAssociationRows(this.filteredAssociations, this.associationSortKey, this.associationSortDirection, this.associationCarrierCountValue); },
        sortedPinnedAssociations() { return sortAssociationRows(this.pinnedAssociations, this.associationSortKey, this.associationSortDirection, this.associationCarrierCountValue); },
        visibleAssociations() { return this.showAllAssociations ? this.sortedAssociations : this.sortedAssociations.slice(0, 5); },
        geneMetadataLabel() { const summary = this.geneCarrierSummary; return summary ? `${Number(summary.matchedMetadataCount).toLocaleString()} / ${Number(total(summary, this.totalGeneCarriers)).toLocaleString()} records` : 'Loading metadata'; },
        phenotypeCountTitle() { const summary = this.geneCarrierSummary; return summary && summary.phenotypeMetadataCount != null ? `${summary.phenotypeMetadataCount} / ${this.totalGeneCarriers} gene carriers have HPO metadata${summary.status === 'ready' ? '' : '; partial results'}.` : 'HPO carrier counts are not supplied by the current metadata service.'; },
        appliedContextLabel() { return this.appliedContext ? `Applied HPO: ${this.appliedContext.terms.map(hpoLabel).join(' + ')} · ${this.appliedContext.scoreType === 'sum' ? 'Sum' : 'Max'} · ${this.appliedContext.analysisSet === 'affected' ? 'Affected only' : 'All'}` : 'Custom HPO context not calculated'; },
        variantMix() {
            const clinvar = { 'P/LP': 0, VUS: 0, 'B/LB': 0, 'Other classification': 0, 'No ClinVar': 0 };
            const consequence = { Missense: 0, Other: 0 };
            const annotations = { 'AM annotated': 0, 'REVEL annotated': 0 };
            let loftee = 0;
            this.variantRows.forEach(row => {
                const facets = this.variantRowFacets(row);
                clinvar[facets.clinvar]++;
                consequence[facets.consequence]++;
                if (facets.loftee) loftee++;
                facets.annotations.forEach(label => annotations[label]++);
            });
            return { clinvar: Object.entries(clinvar).filter(([, count]) => count || this.variantRows.length === 0).map(([label, count]) => ({ label, count })), consequence: Object.entries(consequence).map(([label, count]) => ({ label, count })), annotations: Object.entries(annotations).map(([label, count]) => ({ label, count })), loftee };
        },
    },
    methods: {
        ...pbGeneMethods,
        // Gene2 intentionally has no locus surface or locus-filter requests.
        refreshLocusFilter() {},
        variantRowFacets(row) { return variantFacets(row, this.variantEvidenceValue(row, 'LOFTEE'), this.parseEvidenceNumber(row, 'AlphaMissense'), this.parseEvidenceNumber(row, 'REVEL')); },
        matchesVariantFilters(row) { return matchesVariantFacets(this.variantRowFacets(row), this.variantFilters); },
        toggleVariantFilter(group, label) {
            if (group === 'loftee') this.variantFilters.loftee = !this.variantFilters.loftee;
            else this.variantFilters[group] = this.variantFilters[group].includes(label) ? this.variantFilters[group].filter(value => value !== label) : [...this.variantFilters[group], label];
            this.goToVariantPage(1);
        },
        clearVariantFilters() { this.variantFilters = { clinvar: [], consequence: [], annotations: [], loftee: false }; this.goToVariantPage(1); },
        isVariantPinned(id) { return this.pinnedVariantIds.includes(id); },
        toggleVariantPin(id) {
            if (!this.variantRows.some(row => row.id === id)) return;
            if (this.isVariantPinned(id)) {
                this.pinnedVariantIds = this.pinnedVariantIds.filter(value => value !== id);
                if (this.expandedVariantId === id && !this.visibleVariantRows.some(row => row.id === id)) this.setGeneTab('gene');
            } else this.pinnedVariantIds = [...this.pinnedVariantIds, id];
        },
        selectVariant(id) {
            const page = { variantPage: this.variantPage, variantSearchStart: this.variantSearchStart, variantSearchResultId: this.variantSearchResultId };
            const selected = pbGeneMethods.selectVariant.call(this, id);
            if (selected && this.isVariantPinned(id)) Object.assign(this, page);
            return selected;
        },
        retainPinnedExpansion(action, argument) {
            const id = this.expandedVariantId;
            pbGeneMethods[action].call(this, argument);
            if (id && this.isVariantPinned(id)) { this.expandedVariantId = id; this.geneTab = 'variant'; }
        },
        goToVariantPage(page) { this.retainPinnedExpansion('goToVariantPage', page); if (this.variantIdentifierIds !== null) this.variantPositionQuery = this.appliedVariantQuery; },
        matchesVariantIdentifier(row) { return this.variantIdentifierIds === null || this.variantIdentifierIds.includes(row.id); },
        clearVariantIdentifierSearch() { this.variantIdentifierIds = null; this.appliedVariantQuery = ''; this.goToVariantPage(1); },
        searchVariantPosition() {
            const input = this.variantPositionQuery.trim();
            const selected = this.expandedVariantId;
            if (!parsePositionQuery(input)) {
                const result = matchVariantIdentifiers(this.facetMatchingVariantRows, input);
                if (result.error) { this.variantPositionError = result.error; return; }
                if (!result.matches.length) {
                    const existsOutsideFilters = this.variantFiltersActive && matchVariantIdentifiers(this.variantRows, input).matches.length;
                    this.variantPositionError = existsOutsideFilters ? 'Matching variants are outside the current category filters. Clear filters to view them.' : `No matching variant in ${this.geneInfo.symbol}.`;
                    return;
                }
                this.variantIdentifierIds = result.matches.map(row => row.id);
                this.appliedVariantQuery = input;
                this.variantPage = 1; this.variantSearchStart = null; this.variantSearchResultId = null;
                this.variantPositionError = result.unmatched.length ? `No match for: ${result.unmatched.join(', ')}` : '';
            } else {
                const found = findPositionWindow(this.facetMatchingVariantRows, this.geneInfo, input);
                if (found.error) { this.variantPositionError = found.error; return; }
                this.variantIdentifierIds = null; this.appliedVariantQuery = '';
                this.variantPositionError = ''; this.variantSearchStart = found.start; this.variantSearchResultId = found.match.id;
                this.variantPage = Math.floor(found.nearestIndex / VARIANT_PAGE_SIZE) + 1;
            }
            this.variantSortKey = 'variant'; this.variantSortDir = 'asc'; this.pendingVariantId = null;
            if (!selected || !this.isVariantPinned(selected)) { this.expandedVariantId = null; this.geneTab = 'gene'; }
        },
        sortVariantsBy(key) { this.retainPinnedExpansion('sortVariantsBy', key); if (this.variantIdentifierIds !== null) this.variantPositionQuery = this.appliedVariantQuery; },
        async submitGeneSearch() { if (!this.contextLoading) await pbGeneMethods.submitGeneSearch.call(this); },
        associationAriaSort(key) { return this.associationSortKey !== key ? 'none' : this.associationSortDirection === 'asc' ? 'ascending' : 'descending'; },
        sortAssociationColumn(key) { this.associationSortDirection = this.associationSortKey === key && this.associationSortDirection === 'asc' ? 'desc' : 'asc'; this.associationSortKey = key; },
        associationCarrierCountValue(hpoId) {
            const summary = this.geneCarrierSummary;
            if (!summary || !summary.phenotypeMetadataCount) return null;
            const term = (summary.observedPhenotypes || []).find(item => item.hpoId === hpoId);
            return term ? Number(term.count) : 0;
        },
        phenotypeUrl(hpoId) { return '/pb_phenotype.html?query=' + encodeURIComponent(hpoId); },
        toggleAssociationPin(row) { this.pinnedAssociations = togglePinnedAssociation(this.pinnedAssociations, row); },
        associationInterval(row) { return row.betaCiLowPer0_1Grs == null || row.betaCiHighPer0_1Grs == null ? '—' : `${this.contextStatistic(row.betaCiLowPer0_1Grs)}–${this.contextStatistic(row.betaCiHighPer0_1Grs)}`; },
        phenotypeCarrierCount(hpoId) {
            const summary = this.geneCarrierSummary;
            if (!summary || !summary.phenotypeMetadataCount) return '—';
            const term = (summary.observedPhenotypes || []).find(item => item.hpoId === hpoId);
            return `${term ? Number(term.count).toLocaleString() : '0'} / ${Number(summary.phenotypeMetadataCount).toLocaleString()}${summary.status !== 'ready' || summary.phenotypeMetadataCount < summary.carrierTotal ? ' (partial)' : ''}`;
        },
        applyVariantContextScores(result) {
            pbGeneMethods.applyVariantContextScores.call(this, result);
            this.receivedContextReference = result.rphers_standardization || null;
        },
        async runContextAnalysis() {
            const before = new Set(this.contextRuns.map(run => run.id));
            const scoreType = this.contextScoreType;
            const analysisSet = this.contextAnalysisSet;
            await pbGeneMethods.runContextAnalysis.call(this);
            const run = this.contextRuns.find(item => !before.has(item.id));
            if (!run) return;
            this.$set(this.contextRunMeta, run.id, { scoreType, analysisSet });
            this.currentContextRunId = run.id;
            this.appliedContext = { terms: [...this.activeContextTerms], scoreType, analysisSet, reference: this.receivedContextReference };
        },
        async loadLiveGeneData(query, updateUrl = false) {
            const previousGene = this.geneInfo.symbol;
            await pbGeneMethods.loadLiveGeneData.call(this, query, false);
            if (this.geneInfo.symbol !== previousGene) {
                this.associationSearch = ''; this.associationSortKey = ''; this.associationSortDirection = 'asc'; this.pinnedAssociations = []; this.pinnedVariantIds = []; this.variantIdentifierIds = null; this.appliedVariantQuery = ''; this.variantFilters = { clinvar: [], consequence: [], annotations: [], loftee: false }; this.showAllAssociations = false;
            }
            this.contextRunMeta = {}; this.currentContextRunId = ''; this.appliedContext = null;
            if (updateUrl) {
                const url = new URL(window.location.href);
                url.pathname = '/pb_gene2.html'; url.searchParams.set('query', this.geneInfo.symbol);
                url.searchParams.delete('locus'); url.searchParams.delete('locusView');
                if (this.geneInfo.symbol !== previousGene) url.searchParams.delete('variant');
                window.history.pushState({}, '', url.toString());
            }
        },
    },
    watch: {
        associationSearch() { this.showAllAssociations = false; },
        'geneInfo.symbol'(symbol, previous) {
            if (symbol === previous) return;
            this.associationSearch = ''; this.associationSortKey = ''; this.associationSortDirection = 'asc'; this.pinnedAssociations = []; this.pinnedVariantIds = []; this.variantIdentifierIds = null; this.appliedVariantQuery = ''; this.variantFilters = { clinvar: [], consequence: [], annotations: [], loftee: false }; this.showAllAssociations = false;
            this.contextRunMeta = {}; this.currentContextRunId = ''; this.appliedContext = null;
        },
    },
};
function total(summary, fallback) { return summary.carrierTotal == null ? fallback : summary.carrierTotal; }
</script>
