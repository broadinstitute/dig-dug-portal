<template>
    <div class="pb-guide-page">
        <portal-guide />
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents" />
        <main class="container-fluid mdkp-body pbg-page pg2-page" :class="{ 'pg2-info-reserved': infoRailReserved }">
            <div class="pbg-shell">
                <div class="pbg-toolbar">
                    <div class="pbg-toolbar-left">
                        <a href="/index.html" class="pbg-home-link" aria-label="PB portal home">
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
                        <a href="/variantresult.html" class="pbg-nav-link">Variant search</a>
                        <a href="/phenotyperesult.html" class="pbg-nav-link">Phenotype</a>
                    </div>
                </div>


                <p v-if="searchGeneError" class="pg2-error pg2-card" role="alert">{{ searchGeneError }}</p>
                <p v-if="!liveDataLoaded && searchGeneLoading" class="pg2-card pg2-muted" role="status">Loading gene evidence…</p>
                <template v-if="liveDataLoaded">
                    <section class="pg2-card pg2-overview">
                        <gene-identity :gene-info="geneInfo" />
                    </section>
                    <section v-if="geneVariantLoading || geneVariantError" class="pg2-card pg2-crdc" aria-label="CRDC variants" :aria-busy="String(geneVariantLoading)">
                        <h2>Variants observed in the CRDC</h2>
                        <p v-if="geneVariantLoading" class="pg2-muted" role="status">Loading variants filtered by DP ≥20 and cohort AF &lt;1%…</p>
                        <p v-else class="pg2-error" role="alert">{{ geneVariantError }}</p>
                        <button v-if="geneVariantError && geneVariantReload" class="pg2-text-button" type="button" :disabled="geneVariantLoading" @click="retryGeneVariants">Retry variants</button>
                    </section>
                    <section v-else-if="variantRows.length" class="pg2-card pg2-crdc" aria-label="CRDC variants and carrier demographics">
                        <variant-overview :gene="geneInfo.symbol" :mix="variantMix" :total="variantRows.length" :annotated-count="predictionAnnotatedVariantCount" :carrier-count="Number(totalGeneCarriers) || 0" :filters="variantFilters" @filter="toggleVariantFilter" @filter-consequences="toggleConsequenceGroup" />
                        <div v-if="variantFiltersActive" class="pg2-variant-filter-status"><a href="#pg2-variant-evidence">{{ matchingVariantRows.length }} / {{ variantRows.length }} matching variants</a><span>{{ variantFilterLabel }}</span><button class="pg2-text-button" type="button" @click="clearVariantFilters">Clear filters</button></div>
                        <div class="pg2-carrier-overview" data-testid="gene-demographics">
                            <p v-if="carrierSelectionActive" class="pg2-demographic-scope">Carriers of {{ matchingVariantRows.length.toLocaleString() }} selected variants · {{ displayedCarrierCount.toLocaleString() }} samples</p>
                            <demographics :key="selectedCarrierKey || geneInfo.symbol" :summary="displayedCarrierSummary" :fallback="{}" :carrier-count="displayedCarrierCount" :status="displayedCarrierStatus" :scope="carrierSelectionActive ? 'selected variants' : 'gene'" overview />
                        </div>
                    </section>
                    <section v-else class="pg2-card pg2-crdc" aria-label="CRDC variants">
                        <h2>Variants observed in the CRDC (0 carriers)</h2>
                        <p class="pg2-muted">No CRDC variants meet DP≥20 and cohort AF&lt;0.01 for {{ geneInfo.symbol }}.</p>
                    </section>
                    <section class="pg2-card pg2-associations" aria-labelledby="pg2-associations-title">
                        <div class="pg2-section-heading"><div class="pg2-association-title"><h2 id="pg2-associations-title">Single-phenotype associations <help-tooltip label="Single-phenotype associations" :text="help.precomputedMethods" /></h2><span>Precomputed · CRDC</span></div></div>
                        <div class="pg2-association-controls"><label for="pg2-association-search">Find a phenotype</label><input id="pg2-association-search" v-model="associationSearch" type="search" placeholder="Search phenotype names or HPO IDs" aria-label="Find a precomputed phenotype" /></div>
                        <div class="pg2-table-scroll">
                            <table class="pg2-table pg2-association-table">
                                <thead><tr><th class="pg2-association-pin"><b-icon-pin-angle aria-label="Pin result" /></th><th>Phenotype</th>
                                    <th v-for="column in associationColumns" :key="column.key" class="pg2-numeric" :aria-sort="associationAriaSort(column.key)">
                                        <div class="pg2-column-heading">
                                            <button class="pg2-sort-button" type="button" :aria-label="'Sort by ' + column.label" @click="sortAssociationColumn(column.key)">
                                                <template v-if="column.key === 'cases'">Samples with<br>this phenotype</template>
                                                <template v-else>{{ column.label }}</template>
                                                <b-icon-sort-down v-if="associationSortKey === column.key && associationSortDirection === 'desc'" /><b-icon-sort-up v-else-if="associationSortKey === column.key" /><b-icon-arrow-down-up v-else />
                                            </button>
                                            <help-tooltip v-if="column.help" info :label="'About ' + column.label" :text="column.help" />
                                            <association-filter v-if="column.key === 'cases'" v-model="associationCaseRange" :label="column.label" range />
                                        </div>
                                        <small v-if="column.key === 'beta'" class="pg2-beta-interval">95% CI</small>
                                    </th>
                                    <th scope="col" class="pg2-numeric">
                                        <div class="pg2-column-heading">
                                            <span>Support<br>grade</span> <help-tooltip info label="About support grades" :text="associationQcHelp" />
                                            <association-filter v-model="associationQcSelection" label="Support grade" :options="associationQcOptions" />
                                        </div>
                                    </th>
                                </tr></thead>
                                <tbody data-testid="association-search-results">
                                    <tr v-for="row in associationDisplayRows" :key="row.hpoId" :class="{ 'pg2-pinned-row': isAssociationPinned(row) }">
                                        <td class="pg2-association-pin"><button class="pg2-pin" type="button" :aria-label="(isAssociationPinned(row) ? 'Unpin ' : 'Pin ') + row.label" :aria-pressed="String(isAssociationPinned(row))" @click="toggleAssociationPin(row)"><b-icon-pin-angle-fill v-if="isAssociationPinned(row)" /><b-icon-pin-angle v-else /></button></td>
                                        <td><span class="pg2-association-name">{{ row.label }}</span><a class="pg2-association-hpo" :href="phenotypeUrl(row.hpoId)">{{ row.hpoId }}</a></td>
                                        <td class="pg2-numeric">
                                            {{ contextStatistic(row.betaPer0_1Grs) }}
                                            <small class="pg2-beta-interval">{{ associationInterval(row) }}</small>
                                        </td>
                                        <td class="pg2-numeric">{{ contextStatistic(row.pValue) }}</td><td class="pg2-numeric">{{ contextStatistic(row.qValue) }}</td>
                                        <td class="pg2-numeric" :title="row.hpoLambdaTests ? row.hpoLambdaTests.toLocaleString() + ' valid gene tests for this HPO' : null">{{ Number.isFinite(row.hpoLambdaGc) ? row.hpoLambdaGc.toFixed(3) : '—' }}</td>
                                        <td class="pg2-numeric">{{ phenotypeCaseCount(row) }}</td>
                                        <td class="pg2-numeric">
                                            <span v-if="row.qc" class="pg2-association-qc" :data-status="row.qc" :title="row.caseBand + ' samples with this phenotype'">{{ row.qc }}</span>
                                            <span v-else title="Sample count or q-value unavailable">—</span>
                                        </td>
                                    </tr>
                                    <tr v-if="!associationDisplayRows.length"><td :colspan="associationColumns.length + 3" class="pg2-empty">{{ geneAssociationError || (genePhenotypeAssociations.length ? 'No results match the search and filters.' : 'No passing precomputed associations.') }}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <SummaryPager :page="associationPage" :total-pages="associationPageCount" label="Single-phenotype association pages" input-id="pg2-association-page" @change="associationPage = $event" />
                    </section>
                    <context-panel :active-context-terms="activeContextTerms" :context-term-details="contextTermDetails" :context-input.sync="contextInput" :context-loading="contextLoading || searchGeneLoading" :context-score-type.sync="contextScoreType" :context-analysis-set.sync="contextAnalysisSet" :context-significance-threshold.sync="contextSignificanceThreshold" :context-min-carriers.sync="contextMinCarriers" :context-error="contextError" :context-runs="contextRuns" :run-meta="contextRunMeta" :current-run-id="currentContextRunId" :rerunning-run-id="rerunningContextRunId" @run="runContextAnalysis" @rerun="rerunContextAnalysis" @remove="deleteContextRun" @retry-quality="loadContextQuality" @retry-sample-count="loadContextSampleCount" />
                    <section v-if="!geneVariantLoading && !geneVariantError && variantRows.length" id="pg2-variant-evidence" class="pg2-card pg2-variant-evidence">
                    <div class="pbg-variant-evidence-block">
                        <div class="pbg-variant-evidence-head">
                            <p class="pbg-section-label">
                                Variant evidence for {{ geneInfo.symbol }}
                                <span class="pbg-crdc-badge" title="Source: CRDC cohort">CRDC</span>
                            </p>
                            <span class="pg2-variant-total">{{ matchingVariantRows.length.toLocaleString() }}{{ variantFiltersActive || variantIdentifierIds !== null ? " / " + variantRows.length.toLocaleString() : "" }} variants</span><span v-if="appliedContext" class="pg2-profile-chip">{{ appliedContext.terms.map(contextTermLabel).join(" + ") }}</span>
                        </div>

                        <div class="pg2-variant-tools">
                            <form class="pbg-ve-position-search" role="search" aria-label="Find variant by position, HGVS or rsID" @submit.prevent="searchVariantPosition">
                                <label for="pbg-variant-position">Find variant</label>
                                <input id="pbg-variant-position" v-model.trim="variantPositionQuery" type="search"
                                       placeholder="Position / HGVS / rsID" title="Examples: 20189551, c.35delG, c.167delT, c.235delC, rs80338939" autocomplete="off" spellcheck="false"
                                       :aria-invalid="variantPositionError ? 'true' : 'false'">
                                <button type="submit">Find</button>
                                <span v-if="variantPositionError" class="pbg-ve-position-error" role="alert">{{ variantPositionError }}</span>
                                <span v-if="variantIdentifierIds !== null" class="pg2-identifier-search-state">{{ variantIdentifierIds.length }} variant match{{ variantIdentifierIds.length === 1 ? '' : 'es' }} · {{ appliedVariantQuery }} <button class="pg2-text-button" type="button" @click="clearVariantIdentifierSearch">Clear search</button></span>
                            </form>
                            <label class="pg2-variant-sort-select">Sort by: <select :value="variantSortSelection" aria-label="Sort variant evidence" @change="setVariantSortSelection($event.target.value)"><option value="variantScore:desc">In Silico Predictors ↓</option><option value="carriers:desc">Variant carriers ↓</option><option value="hpoCarriers:desc">Carriers with ≥1 profile HPO ↓</option><option value="matchScore:desc">Mean carrier rPheRS Z ↓</option><option value="effectScore:desc">Variant β ↓</option><option value="pValue:asc">P ↑</option><option value="variant:asc">Variant position ↑</option><option value="variant:desc">Variant position ↓</option><option v-if="!variantSortOptions.includes(variantSortSelection)" :value="variantSortSelection">{{ variantSortLabel }}</option></select></label>
                        </div>
                        <div class="pg2-variant-information-band"><span>Variant information</span><span>Phenotype-based evidence</span></div>
                        <div class="pbg-ve-table-head">
                            <span></span>
                            <div class="pg2-variant-heading">
                                <button class="pbg-ve-sort" type="button" @click="sortVariantsBy('variant')"><span>Variant</span><b-icon-arrow-down-up /></button>
                                <div class="pg2-consequence-heading">
                                    <span>Consequence</span>
                                    <association-filter label="Consequence" :value="variantFilters.consequence.length ? variantFilters.consequence : null"
                                                        :options="consequenceFilterOptions" :option-label="formatConsequence" searchable require-selection @input="applyConsequenceFilter" />
                                </div>
                            </div>
                            <div class="pg2-clinvar-heading">
                                <b-dropdown id="pg2-clinvar-filter" ref="clinvarFilter" no-caret no-flip variant="link" :popper-opts="{ modifiers: { applyStyle: { enabled: false } } }" toggle-class="pg2-clinvar-filter-toggle" menu-class="pg2-clinvar-filter-menu" :title="variantFilters.clinvar.length ? 'ClinVar: ' + variantFilters.clinvar.join(', ') : 'Filter ClinVar classifications'" :class="{ 'is-filtered': variantFilters.clinvar.length }" @show="openClinvarFilter">
                                    <template #button-content><span>ClinVar <b-icon-funnel-fill v-if="variantFilters.clinvar.length" aria-hidden="true" /><b-icon-funnel v-else aria-hidden="true" /></span><span class="pg2-sr-only">Filter variants by ClinVar classification{{ variantFilters.clinvar.length ? ': ' + variantFilters.clinvar.join(', ') : '' }}</span></template>
                                    <b-dropdown-form @submit.prevent="applyClinvarFilter">
                                        <fieldset>
                                            <legend>Filter ClinVar</legend>
                                            <div class="pg2-clinvar-filter-shortcuts"><button type="button" class="pg2-text-button" @click="toggleAllClinvarFilters">{{ allClinvarFiltersSelected ? 'Deselect all' : 'Select all' }}</button></div>
                                            <label v-for="option in clinvarFilterOptions" :key="option.value" class="pg2-clinvar-filter-option"><input v-model="clinvarFilterDraft" type="checkbox" :value="option.value"><span>{{ option.label }}</span><small>{{ option.count.toLocaleString() }}</small></label>
                                        </fieldset>
                                        <p v-if="!clinvarFilterDraft.length" class="pg2-clinvar-filter-hint">Select at least one classification.</p>
                                        <div class="pg2-clinvar-filter-actions"><button type="button" class="pg2-text-button" @click="$refs.clinvarFilter.hide(true)">Cancel</button><button type="submit" class="pg2-clinvar-filter-apply" :disabled="!clinvarFilterDraft.length">Apply</button></div>
                                    </b-dropdown-form>
                                </b-dropdown>
                            </div>
                            <div class="pg2-score-heading"><button class="pbg-ve-sort" type="button" aria-label="Sort by Variant carriers" @click="sortVariantsBy('carriers')"><span>Variant<br>carriers</span><span class="pg2-sort-indicator" aria-hidden="true">{{ variantColumnSortIndicator('carriers') }}</span></button><help-tooltip info label="About variant carriers" :text="help.totalCarriers" /></div>
                            <div class="pg2-score-heading"><button class="pbg-ve-sort" type="button" aria-label="Sort by In Silico Predictors" @click="sortVariantsBy('variantScore')"><span>In Silico<br>Predictors</span><span class="pg2-sort-indicator" aria-hidden="true">{{ variantColumnSortIndicator('variantScore') }}</span></button><help-tooltip info label="About In Silico Predictors" :text="help.pathogenicity + '\n\n' + annotationSources.predictors.text" :links="annotationSources.predictors.links" /></div>
                            <div class="pg2-score-heading pg2-profile-hpo-heading"><button class="pbg-ve-sort" type="button" aria-label="Sort by Carriers with at least one profile HPO" @click="sortVariantsBy('hpoCarriers')"><span>Carriers with<br>≥1 profile HPO</span><span class="pg2-sort-indicator" aria-hidden="true">{{ variantColumnSortIndicator('hpoCarriers') }}</span></button><help-tooltip info label="About carriers with at least one profile HPO" :text="help.hpoCarriers" /></div>
                            <div class="pg2-score-heading"><button class="pbg-ve-sort" type="button" aria-label="Sort by Mean carrier rPheRS Z" @click="sortVariantsBy('matchScore')"><span>Mean carrier<br>rPheRS Z</span><span class="pg2-sort-indicator" aria-hidden="true">{{ variantColumnSortIndicator('matchScore') }}</span></button><help-tooltip info label="About mean carrier rPheRS Z" :text="help.meanZ" /></div>
                            <div class="pg2-score-heading"><button class="pbg-ve-sort" type="button" aria-label="Sort by Variant beta" @click="sortVariantsBy('effectScore')"><span>Variant β<br><small>(rPheRS SD)</small></span><span class="pg2-sort-indicator" aria-hidden="true">{{ variantColumnSortIndicator('effectScore') }}</span></button><help-tooltip info label="About variant beta" :text="help.variantBeta" /></div>
                            <div class="pg2-score-heading"><button class="pbg-ve-sort" type="button" aria-label="Sort by P" @click="sortVariantsBy('pValue')">P<span class="pg2-sort-indicator" aria-hidden="true">{{ variantColumnSortIndicator('pValue') }}</span></button><help-tooltip info label="About variant p-value" :text="help.variantP" /></div>
                        </div>

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
                                    <span class="pg2-variant-label" :title="row.id">{{ row.id }}<small class="pg2-variant-consequence">{{ consequenceLabel(row) }}</small><small v-if="isVariantPinned(row.id) && (!matchesVariantFilters(row) || !matchesVariantIdentifier(row))" class="pg2-outside-filter">Pinned · outside filter</small><sup v-if="variantHasHighAf(row)" class="pbg-af-star" :title="variantAfWarningText(row)">*</sup></span>
                                    <button class="pg2-pin pg2-variant-pin" type="button" :aria-label="(isVariantPinned(row.id) ? 'Unpin ' : 'Pin ') + row.id" :aria-pressed="String(isVariantPinned(row.id))" :title="isVariantPinned(row.id) ? 'Unpin variant' : 'Keep this variant visible across pages and sorting'" @click.stop="toggleVariantPin(row.id)"><b-icon-pin-angle-fill v-if="isVariantPinned(row.id)" /><b-icon-pin-angle v-else /></button>
                                </span>
                                <span class="pbg-ve-clinvar" :title="row.clinvar"><span class="pbg-clinvar-badge" :class="pathogenicityClass(row.clinvar)">{{ clinvarLabel(row) }}</span></span>
                                <span class="pbg-ve-carriers">{{ Number(row.carrierCount).toLocaleString() }}</span>
                                <span><strong class="pbg-score-badge" :class="variantScoreClass(row)" :title="variantScoreTitle(row)">{{ variantScoreDisplay(row) }}<sup v-if="hasRevelOnlyScore(row)">*</sup></strong></span>
                                <span class="pg2-hpo-carriers" :title="variantHpoCountTitle(row)">{{ variantHpoCountDisplay(row) }}</span>
                                <span v-if="!activeContextTerms.length" class="pbg-no-context" title="Apply a phenotype profile to calculate this value.">—</span>
                                <strong v-else-if="row.phenotypeMatchScore != null" class="pbg-score-badge" :title="scoredCarrierTitle(row)">
                                    {{ row.phenotypeMatchScore.toFixed(2) }}
                                </strong>
                                <span v-else class="pbg-no-context" :title="row.phenotypeMatchStatus || ''">Unavailable</span>
                                <span v-if="!activeContextTerms.length" class="pbg-no-context" title="Apply a phenotype profile to calculate this value.">—</span>
                                <strong v-else-if="row.variantEffectBeta != null" class="pbg-score-badge"
                                        :title="row.variantAssociationLowCarrierCount ? 'Covariate-adjusted carrier versus noncarrier difference in residual PheRS, in reference-cohort SD units; exploratory because fewer than 10 carriers were scored.' : 'Covariate-adjusted carrier versus noncarrier difference in residual PheRS, in reference-cohort SD units.'">
                                    {{ contextStatistic(row.variantEffectBeta) }}
                                </strong>
                                <span v-else class="pbg-no-context" :title="row.variantAssociationStatus || 'not_returned'">Unavailable</span>
                                <span v-if="!activeContextTerms.length" class="pbg-no-context" title="Apply a phenotype profile to calculate this value.">—</span>
                                <strong v-else-if="row.variantEffectPValue != null" class="pbg-score-badge"
                                        :title="row.variantAssociationLowCarrierCount ? 'Unadjusted two-sided OLS p-value; exploratory because fewer than 10 carriers were scored.' : 'Unadjusted two-sided OLS p-value.'">
                                    {{ variantPValueDisplay(row.variantEffectPValue) }}
                                </strong>
                                <span v-else class="pbg-no-context" :title="row.variantAssociationStatus || 'not_returned'">Unavailable</span>
                            </div>

                            <div v-if="expandedVariantId === row.id" :id="'variant-detail-' + row.id"
                                 :key="row.id + '-details'"
                                 class="pbg-variant-expanded pg2-variant-detail">
                                <variant-annotation :items="variantEvidenceRows(row)" :variant="row" :gene-info="geneInfo" :variant-url="variantPageUrl(row)" :warning="variantHasHighAf(row) ? variantAfWarningText(row) : ''" />
                                <section class="pg2-expanded-section pg2-carrier-summary" aria-label="Variant carrier summary">
                                    <div class="pg2-expanded-heading"><h3>Carrier summary <span class="pg2-expanded-count">· {{ Number(row.carrierCount).toLocaleString() }} carriers</span> <help-tooltip label="Variant carrier summary" :text="help.carrierSummary" /></h3></div>
                                    <demographics :summary="variantCarrierSummaries[row.id] || null" :carrier-count="Number(row.carrierCount) || 0" :status="carrierSummaryProgress[row.id] || carrierSummaryErrors[row.id] || ''" :scope="row.id" compact inline-project-search />
                                </section>
                                <section class="pg2-expanded-section pg2-carrier-samples" aria-label="Variant carrier samples">
                                    <div class="pg2-expanded-heading"><h3>Carrier samples <span class="pg2-expanded-count">· {{ Number(row.carrierCount).toLocaleString() }}</span> <span class="pg2-internal-label">Internal</span> <help-tooltip label="Variant carrier samples" :text="help.carrierSamples" /></h3></div>
                                    <div class="pg2-carrier-table-tools"><input v-model="carrierTableSearch" type="search" placeholder="Find sample ID" aria-label="Find a carrier by sample ID" /><span v-if="carrierSortValues.status === 'loading'" role="status">Loading sort values… {{ carrierSortValues.completed.toLocaleString() }} / {{ row.carrierSamples.length.toLocaleString() }}</span><span v-else-if="carrierSortValues.status === 'unavailable'" role="status">Sort values unavailable. <button class="pg2-text-button" type="button" @click="loadCarrierSortValues(carrierSortRequestKey)">Retry</button></span><span class="pg2-carrier-table-range" role="status">{{ carrierTableRange }}</span></div>
                                    <div class="pg2-table-scroll"><table class="pg2-table pg2-carrier-sample-table">
                                        <colgroup><col style="width:25%"><col style="width:6%"><col style="width:8%"><col style="width:6%"><col style="width:13%"><col style="width:12%"><col style="width:21%"><col style="width:9%"></colgroup>
                                        <thead><tr>
                                            <th :aria-sort="carrierAriaSort('sample')"><button type="button" class="pg2-sort-button" @click="toggleCarrierTableSort('sample')">Sample <span class="pg2-sort-indicator" aria-hidden="true">{{ carrierSortIndicator('sample') }}</span></button></th>
                                            <th :aria-sort="carrierAriaSort('age')"><button type="button" class="pg2-sort-button" @click="toggleCarrierTableSort('age')">Age <span class="pg2-sort-indicator" aria-hidden="true">{{ carrierSortIndicator('age') }}</span></button></th><th>Sex</th><th class="pg2-carrier-gt-heading">GT <help-tooltip label="Carrier genotype" :text="help.genotype" /></th>
                                            <th class="pg2-numeric" :aria-sort="carrierAriaSort('hpoTerms')"><button type="button" class="pg2-sort-button" @click="toggleCarrierTableSort('hpoTerms')">Total HPO terms <span class="pg2-sort-indicator" aria-hidden="true">{{ carrierSortIndicator('hpoTerms') }}</span></button><help-tooltip label="About total HPO terms" :text="help.totalHpoTerms" /></th>
                                            <th class="pg2-numeric" :aria-sort="carrierAriaSort('rphers')"><button type="button" class="pg2-sort-button" @click="toggleCarrierTableSort('rphers')">rPheRS Z <span class="pg2-sort-indicator" aria-hidden="true">{{ carrierSortIndicator('rphers') }}</span></button><help-tooltip label="Individual carrier rPheRS Z" :text="help.individualZ" /></th>
                                            <th>Project</th><th>Affected</th>
                                        </tr></thead>
                                        <tbody>
                                            <tr v-for="s in visibleCarrierRows(row)" :key="row.id + '-' + s.id">
                                                <td><a class="pg2-carrier-sample-link" :href="`/sampleresult.html?query=${encodeURIComponent(s.id)}`">{{ s.id }}</a></td>
                                                <td :title="String(carrierSampleField(s, 'age') || '')">{{ carrierDisplayField(s, 'age') }}</td>
                                                <td :title="String(carrierSampleField(s, 'sex') || '')">{{ carrierDisplayField(s, 'sex') }}</td>
                                                <td>{{ s.gt == null || isMissingMetadataValue(s.gt) ? '—' : s.gt }}</td>
                                                <td class="pg2-numeric pg2-carrier-hpo-total">{{ carrierHpoTotalDisplay(s) }}</td>
                                                <td class="pg2-numeric" :class="{ 'pg2-muted': currentCarrierScores.status !== 'ready' }">{{ individualCarrierScore(s) }}</td>
                                                <td><div class="pg2-carrier-project-cell"><span :title="carrierDisplayField(s, 'project')">{{ carrierDisplayField(s, 'project') }}</span><help-tooltip v-if="!isMissingMetadataValue(carrierSampleField(s, 'project'))" :label="'Project for ' + s.id" :text="String(carrierSampleField(s, 'project'))" /></div></td>
                                                <td>{{ carrierDisplayField(s, 'affected') }}</td>
                                            </tr>
                                            <tr v-if="!visibleCarrierRows(row).length"><td colspan="8" class="pg2-empty">{{ row.carrierSamples.length ? 'No sample IDs match this search.' : 'Carrier sample IDs unavailable.' }}</td></tr>
                                        </tbody>
                                    </table></div>
                                    <div v-if="currentCarrierScores.status === 'error'" class="pg2-carrier-score-error" role="status"><span>Individual scores unavailable.</span><help-tooltip label="Individual score request error" :text="currentCarrierScores.error" /><button type="button" class="pg2-text-button" @click="loadIndividualCarrierScores">Retry</button></div>
                                    <SummaryPager :page="carrierTableCurrentPage" :total-pages="carrierTablePageCount" label="Carrier sample pages" input-id="pg2-carrier-page" @change="goToCarrierTablePage($event)" />
                                </section>
                            </div>
                        </template>
                        <p v-if="!comparisonVariantRows.length" class="pg2-empty">No variants match the current filters. <button v-if="variantFiltersActive" class="pg2-text-button" type="button" @click="clearVariantFilters">Clear filters</button></p>
                        <p v-if="variantSearchStart != null" class="pbg-ve-search-state">Closest variant centered</p>
                        <SummaryPager :page="variantPage" :total-pages="variantPageCount" label="Variant evidence pages" input-id="pg2-variant-page" @change="goToVariantPage($event)" />
                    </div>
                    </section>
                </template>
                <info-rail @reserve="infoRailReserved = $event" />
            </div>
        </main>
    </div>
</template>
<script>
import SummaryPager from "../PbGene/SummaryPager";
import PortalGuide from "@/components/pb/PortalGuide.vue";
import { createPbGeneState, pbGeneComputed, pbGeneMethods } from "../PbGene/pageModel";
import { hpoLabel, resolveHpoTerms } from "../PbGene/hpoContextSearch";
import { requireCrdcHpos } from '../../utils/crdcHpoAvailability';
import { filterAssociations, togglePinnedAssociation, sortAssociationRows, associationCaseCount, associationCaseBand, associationSupport, associationSupportHelp, associationSupportOptions } from "./associationRows";
import { profileAssociationQc } from './profileAssociationQc';
import { variantFacets, matchesVariantFacets } from "./variantFacets";
import { findPositionWindow, parsePositionQuery, VARIANT_PAGE_SIZE } from "../PbGene/variantTableNavigation";
import { matchVariantIdentifiers } from "../PbGene/variantLookup";
import GeneIdentity from "./GeneIdentity";
import Demographics from "./Demographics";
import ContextPanel from "./ContextPanel";
import VariantOverview from "./VariantOverview";
import HelpTooltip from "./HelpTooltip";
import AssociationFilter from './AssociationFilter';
import { carrierScoreMixin } from "./carrierScores";
import { filteredCarrierDemographicsMixin } from "./filteredCarrierDemographics";
import help from './evidenceHelp';
import { VARIANT_ANNOTATION_SOURCES } from './referenceProvenance';
import { pageNumbers } from './evidencePagination';
import { fetchGeneCarrierHpoCount, variantHpoCountsMixin } from './variantHpoCounts';
import InfoRail from './InfoRail';
import VariantAnnotation from './VariantAnnotation';
import {carrierTableMixin} from './carrierTable';
import {carrierHpoTotalsMixin} from './carrierHpoTotals';
import "../PbGene/style.css";
import "./style.css";

export default {
    name: "PbGene2Template",
    mixins: [carrierScoreMixin, filteredCarrierDemographicsMixin, variantHpoCountsMixin, carrierTableMixin, carrierHpoTotalsMixin],
    components: { SummaryPager, PortalGuide, GeneIdentity, Demographics, ContextPanel, VariantOverview, HelpTooltip, InfoRail, VariantAnnotation, AssociationFilter },
    data() {
        return {
            ...createPbGeneState(), geneVariantQuality: 'dp20_af001', help, annotationSources: VARIANT_ANNOTATION_SOURCES, infoRailReserved: false, clinvarFilterDraft: [], associationSearch: '', associationPage: 1, associationSortKey: '', associationSortDirection: 'asc', pinnedAssociations: [], pinnedVariantIds: [], variantIdentifierIds: null, appliedVariantQuery: '', variantFilters: { clinvar: [], consequence: [], annotations: [], predictionCoverage: [], loftee: false }, contextRunMeta: {}, currentContextRunId: '', rerunningContextRunId: '', appliedContext: null, receivedContextReference: null,
            associationQcSelection: null,
            associationCaseRange: null,
        };
    },
    mounted() { this.loadLiveGeneData(this.searchGeneQuery, false).catch(() => {}); },
    computed: {
        ...pbGeneComputed,
        allClinvarFiltersSelected() { return this.clinvarFilterOptions.every(option => this.clinvarFilterDraft.includes(option.value)); },
        clinvarFilterOptions() {
            const counts = new Map(this.variantMix.clinvar.map(item => [item.label, item.count]));
            return [
                ['P/LP', 'Pathogenic / Likely pathogenic'],
                ['VUS', 'Uncertain significance (VUS)'],
                ['B/LB', 'Benign / Likely benign'],
                ['Conflict', 'Conflict'],
                ['No ClinVar', 'No ClinVar'],
            ].concat([...counts.keys()].filter(value => !['P/LP', 'VUS', 'B/LB', 'Conflict', 'No ClinVar'].includes(value)).map(value => [value, value]))
                .map(([value, label]) => ({ value, label, count: counts.get(value) || 0 }));
        },
        consequenceFilterOptions() {
            return this.variantMix.consequence.map(item => item.label)
                .sort((left, right) => this.formatConsequence(left).localeCompare(this.formatConsequence(right)));
        },
        facetMatchingVariantRows() { return this.variantRows.filter(this.matchesVariantFilters); },
        matchingVariantRows() { return this.facetMatchingVariantRows.filter(this.matchesVariantIdentifier); },
        sortedVariantRows() { return pbGeneComputed.sortedVariantRows.call(this).filter(row => this.matchesVariantFilters(row) && this.matchesVariantIdentifier(row)); },
        positionSortedVariantRows() { return pbGeneComputed.positionSortedVariantRows.call(this).filter(row => this.matchesVariantFilters(row) && this.matchesVariantIdentifier(row)); },
        variantPageCount() { return Math.ceil(this.matchingVariantRows.length / VARIANT_PAGE_SIZE); },
        variantFiltersActive() { return Boolean(this.variantFilters.clinvar.length || this.variantFilters.consequence.length || this.variantFilters.annotations.length || (this.variantFilters.predictionCoverage || []).length || this.variantFilters.loftee); },
        variantFilterLabel() { return [...this.variantFilters.clinvar, ...this.variantFilters.consequence.map(this.formatConsequence), ...this.variantFilters.annotations, ...(this.variantFilters.predictionCoverage || []), ...(this.variantFilters.loftee ? ['LoFTEE HC'] : [])].join(' · '); },
        pinnedVariantRows() { const rows = new Map(this.variantRows.map(row => [row.id, row])); return this.pinnedVariantIds.map(id => rows.get(id)).filter(Boolean); },
        unpinnedVisibleVariantRows() { const pinned = new Set(this.pinnedVariantIds); return this.visibleVariantRows.filter(row => !pinned.has(row.id)); },
        comparisonVariantRows() { return [...this.pinnedVariantRows, ...this.unpinnedVisibleVariantRows]; },
        variantSortSelection() { return `${this.variantSortKey}:${this.variantSortDir}`; },
        variantSortOptions() { return ['variantScore:desc', 'carriers:desc', 'hpoCarriers:desc', 'matchScore:desc', 'effectScore:desc', 'pValue:asc', 'variant:asc', 'variant:desc']; },
        variantSortLabel() { return `${{ variant: 'Variant', carriers: 'Variant carriers', hpoCarriers: 'Carriers with ≥1 profile HPO', consequence: 'Consequence', clinvar: 'ClinVar', variantScore: 'In Silico Predictors', matchScore: 'Mean carrier rPheRS Z', effectScore: 'Variant β', pValue: 'P' }[this.variantSortKey] || this.variantSortKey} ${this.variantSortDir === 'asc' ? '↑' : '↓'}`; },
        variantEvidencePages() { return pageNumbers(this.variantPage, this.variantPageCount); },
        associationColumns() {
            return [
                { key: 'beta', label: 'β', help: help.precomputedBeta + ' ' + help.precomputedCI },
                { key: 'p', label: 'P' },
                { key: 'q', label: 'q', help: help.geneQ },
                { key: 'lambda', label: 'HPO λ', help: help.precomputedLambda },
                { key: 'cases', label: 'Samples with this phenotype', help: 'Number of people in the original CRDC analysis who had the phenotype listed on this row.' },
            ];
        },
        filteredAssociations() {
            return filterAssociations(this.genePhenotypeAssociations, this.associationSearch, this.pinnedAssociations)
                .filter(row => row.pValue != null && row.pValue < .05 && this.matchesAssociationFilters(row));
        },
        sortedAssociations() { return sortAssociationRows(this.filteredAssociations, this.associationSortKey, this.associationSortDirection); },
        sortedPinnedAssociations() {
            const rows = this.pinnedAssociations.filter(this.matchesAssociationFilters);
            return sortAssociationRows(rows, this.associationSortKey, this.associationSortDirection);
        },
        associationPageCount() { return Math.max(1, Math.ceil(this.filteredAssociations.length / 5)); },
        associationPageNumbers() { return pageNumbers(this.associationPage, this.associationPageCount); },
        visibleAssociations() { return this.sortedAssociations.slice((this.associationPage - 1) * 5, this.associationPage * 5); },
        associationDisplayRows() {
            return [...this.sortedPinnedAssociations, ...this.visibleAssociations].map(row => ({
                ...row, qc: associationSupport(row), caseBand: associationCaseBand(row),
            }));
        },
        associationQcHelp() { return associationSupportHelp; },
        associationQcOptions() { return associationSupportOptions; },
        appliedContextLabel() { return this.appliedContext ? `Applied HPO: ${this.appliedContext.terms.map(hpoLabel).join(' + ')} · ${this.appliedContext.scoreType === 'sum' ? 'Sum' : 'Max'} · ${this.appliedContext.analysisSet === 'affected' ? 'Affected only' : 'All'}` : 'Custom HPO context not calculated'; },
        variantMix() {
            const clinvar = { 'P/LP': 0, VUS: 0, 'B/LB': 0, Conflict: 0, 'No ClinVar': 0 };
            const consequence = new Map();
            const annotations = { 'AM annotated': 0, 'REVEL annotated': 0 };
            let loftee = 0;
            this.variantRows.forEach(row => {
                const facets = this.variantRowFacets(row);
                clinvar[facets.clinvar] = (clinvar[facets.clinvar] || 0) + 1;
                consequence.set(facets.consequence, (consequence.get(facets.consequence) || 0) + 1);
                if (facets.loftee) loftee++;
                facets.annotations.forEach(label => annotations[label]++);
            });
            return { clinvar: Object.entries(clinvar).filter(([, count]) => count || this.variantRows.length === 0).map(([label, count]) => ({ label, count })), consequence: [...consequence].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)), annotations: Object.entries(annotations).map(([label, count]) => ({ label, count })), loftee };
        },
    },
    methods: {
        ...pbGeneMethods,
        toggleAllClinvarFilters() {
            this.clinvarFilterDraft = this.allClinvarFiltersSelected ? [] : this.clinvarFilterOptions.map(option => option.value);
        },
        openClinvarFilter() {
            this.clinvarFilterDraft = this.variantFilters.clinvar.length ? [...this.variantFilters.clinvar] : this.clinvarFilterOptions.map(option => option.value);
        },
        applyClinvarFilter() {
            if (!this.clinvarFilterDraft.length) return;
            this.variantFilters.clinvar = this.clinvarFilterOptions.every(option => this.clinvarFilterDraft.includes(option.value)) ? [] : [...this.clinvarFilterDraft];
            this.goToVariantPage(1);
            if (this.$refs.clinvarFilter) this.$refs.clinvarFilter.hide(true);
        },
        applyConsequenceFilter(selected) {
            this.variantFilters.consequence = selected || [];
            this.goToVariantPage(1);
        },
        visibleCarrierRows: carrierTableMixin.methods.visibleCarrierRows,
        refreshLocusFilter() {},
        variantRowFacets(row) { return variantFacets(row, this.variantEvidenceValue(row, 'LOFTEE'), this.parseEvidenceNumber(row, 'AlphaMissense'), this.parseEvidenceNumber(row, 'REVEL'), ['LOFTEE', 'AlphaMissense', 'REVEL'].some(label => !this.isMissingMetadataValue(this.variantEvidenceValue(row, label)))); },
        matchesVariantFilters(row) { return matchesVariantFacets(this.variantRowFacets(row), this.variantFilters); },
        toggleVariantFilter(group, label) {
            if (group === 'loftee') this.variantFilters.loftee = !this.variantFilters.loftee;
            else { const selected = this.variantFilters[group] || []; this.$set(this.variantFilters, group, selected.includes(label) ? selected.filter(value => value !== label) : [...selected, label]); }
            this.goToVariantPage(1);
        },
        toggleConsequenceGroup(labels) {
            const selected = this.variantFilters.consequence;
            this.variantFilters.consequence = labels.every(label => selected.includes(label))
                ? selected.filter(label => !labels.includes(label))
                : [...new Set([...selected, ...labels])];
            this.goToVariantPage(1);
        },
        clearVariantFilters() { this.variantFilters = { clinvar: [], consequence: [], annotations: [], predictionCoverage: [], loftee: false }; this.goToVariantPage(1); },
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
        variantColumnSortIndicator(key) { return this.variantSortKey === key ? (this.variantSortDir === 'asc' ? '↑' : '↓') : '↕'; },
        variantSortValue(row, key) {
            if (key === 'hpoCarriers') {
                const record = this.variantHpoCountStatus === 'ready' && this.appliedContext && this.variantHpoCounts[row.id];
                return record && record.count != null ? Number(record.count) : null;
            }
            return pbGeneMethods.variantSortValue.call(this, row, key);
        },
        setVariantSortSelection(value) { const [key, direction] = value.split(':'); this.sortVariantsBy(key); this.variantSortDir = direction; },
        contextTermLabel(id) { return hpoLabel(id); },
        consequenceLabel(row) { return this.formatConsequence(String(row.consequence || '').replace(/_variant\b/g, '')); },
        formatConsequence(value) {
            return String(value || 'Unavailable').split('&').map(term => term.trim()
                .replace(/_/g, ' ').replace(/^./, letter => letter.toUpperCase())).join(' + ');
        },
        clinvarLabel(row) {
            const value = String(row.clinvar || 'Unavailable');
            return this.clinvarDisplayLabel(({'Pathogenic/Likely_pathogenic': 'P/LP', 'Benign/Likely_benign': 'B/LB', 'Uncertain_significance': 'VUS'})[value] || value.replace(/_/g, ' '));
        },
        async submitGeneSearch() { if (!this.contextLoading) await pbGeneMethods.submitGeneSearch.call(this); },
        associationAriaSort(key) { return this.associationSortKey !== key ? 'none' : this.associationSortDirection === 'asc' ? 'ascending' : 'descending'; },
        sortAssociationColumn(key) { this.associationSortDirection = this.associationSortKey === key && this.associationSortDirection === 'asc' ? 'desc' : 'asc'; this.associationSortKey = key; this.associationPage = 1; },
        matchesAssociationFilters(row) {
            const count = associationCaseCount(row);
            const range = this.associationCaseRange;
            if (range) {
                if (count == null || (range.min != null && count < range.min) || (range.max != null && count > range.max)) return false;
            }
            const selected = this.associationQcSelection;
            return selected === null || selected.includes(associationSupport(row));
        },
        phenotypeUrl(hpoId) { return '/phenotyperesult.html?query=' + encodeURIComponent(hpoId); },
        isAssociationPinned(row) { return this.pinnedAssociations.some(item => item.hpoId === row.hpoId); },
        toggleAssociationPin(row) { this.pinnedAssociations = togglePinnedAssociation(this.pinnedAssociations, row); this.associationPage = 1; },
        associationInterval(row) { return row.betaCiLowPer0_1Grs == null || row.betaCiHighPer0_1Grs == null ? '—' : `${this.contextStatistic(row.betaCiLowPer0_1Grs)} – ${this.contextStatistic(row.betaCiHighPer0_1Grs)}`; },
        phenotypeCaseCount(row) {
            return associationCaseCount(row)?.toLocaleString() ?? '—';
        },
        applyVariantContextScores(result) {
            pbGeneMethods.applyVariantContextScores.call(this, result);
            this.receivedContextReference = result.rphers_standardization || null;
        },
        deleteContextRun(run) {
            if (this.contextLoading || this.searchGeneLoading || !this.contextRuns.some(item => item.id === run.id)) return;
            this.contextRuns = this.contextRuns.filter(item => item.id !== run.id);
            this.$delete(this.contextRunMeta, run.id);
            if (this.currentContextRunId === run.id) {
                this.currentContextRunId = '';
                this.appliedContext = null;
                this.activeContextTerms = [];
                this.contextTermDetails = [];
                this.contextError = '';
                this.applyVariantContextScores({});
            }
        },
        async rerunContextAnalysis(run) {
            if (this.contextLoading || this.searchGeneLoading || !this.contextRuns.some(item => item.id === run.id)) return;
            const meta = this.contextRunMeta[run.id];
            if (!meta || !['max','sum'].includes(meta.scoreType) || !['all','affected'].includes(meta.analysisSet) || !Number.isFinite(meta.significanceThreshold) || !Number.isInteger(meta.minCarriers)) return;
            this.contextInput = run.hpos;
            this.contextScoreType = meta.scoreType;
            this.contextAnalysisSet = meta.analysisSet;
            this.contextSignificanceThreshold = meta.significanceThreshold;
            this.contextMinCarriers = meta.minCarriers;
            this.rerunningContextRunId = run.id;
            try { await this.runContextAnalysis(); }
            finally { this.rerunningContextRunId = ''; }
        },
        async runContextAnalysis() {
            if (this.contextLoading || this.searchGeneLoading) return;
            const requestedGene = this.geneInfo.symbol;
            this.contextLoading = true;
            try { await requireCrdcHpos(resolveHpoTerms(this.contextInput), hpoLabel); }
            catch (error) { this.contextError = error.message; return; }
            finally { this.contextLoading = false; }
            if (requestedGene !== this.geneInfo.symbol || this.searchGeneLoading) return;
            const before = new Set(this.contextRuns.map(run => run.id));
            const scoreType = this.contextScoreType;
            const analysisSet = this.contextAnalysisSet;
            const significanceThreshold = Number(this.contextSignificanceThreshold);
            const minCarriers = Number(this.contextMinCarriers);
            await pbGeneMethods.runContextAnalysis.call(this);
            const run = this.contextRuns.find(item => !before.has(item.id));
            if (!run) return;
            this.$set(this.contextRunMeta, run.id, { scoreType, analysisSet, significanceThreshold, minCarriers });
            this.currentContextRunId = run.id;
            this.appliedContext = { terms: [...this.activeContextTerms], scoreType, analysisSet, reference: this.receivedContextReference };
            this.variantSortKey = 'matchScore';
            this.variantSortDir = 'desc';
            this.goToVariantPage(1);
            this.loadContextSampleCount(run);
            this.loadContextQuality(run);
        },
        async loadContextSampleCount(run) {
            const meta = this.contextRunMeta[run.id];
            if (!meta || run.profileSampleCount?.status === 'loading') return;

            this.$set(run, 'profileSampleCount', { status: 'loading' });
            let profileSampleCount;
            try {
                const counts = await fetchGeneCarrierHpoCount(this.geneInfo.symbol.toUpperCase(), run.hpos.split(', '),
                    this.geneVariantQuality, Number(this.totalGeneCarriers) || 0);
                profileSampleCount = { status: 'ready', ...counts };
            } catch (error) {
                profileSampleCount = { status: 'error', message: error.message };
            }
            if (this.contextRunMeta[run.id] === meta) this.$set(run, 'profileSampleCount', profileSampleCount);
        },
        async loadContextQuality(run) {
            const meta = this.contextRunMeta[run.id];
            if (!meta || run.status !== 'ok' || !run.geneScoreModel || run.quality?.status === 'loading') return;

            const gene = this.geneInfo.symbol;
            const terms = run.hpos.split(', ');
            this.$set(run, 'quality', { status: 'loading' });
            let quality;
            try {
                const { fetchProfileGeneAssociations } = await import('../PbPhenotype/profileGeneApi');
                const family = await fetchProfileGeneAssociations(terms, undefined, undefined, {
                    scoreType: meta.scoreType, affectedOnly: meta.analysisSet === 'affected',
                });
                const qc = profileAssociationQc(family, gene, run, { ...meta, terms });
                quality = qc ? { status: 'ready', ...qc } : { status: 'unavailable' };
            } catch (error) {
                quality = { status: 'error', message: error.message };
            }
            if (this.geneInfo.symbol === gene && this.contextRunMeta[run.id] === meta) {
                this.$set(run, 'quality', quality);
            }
        },
        async loadLiveGeneData(query, updateUrl = false) {
            const previousGene = this.geneInfo.symbol;
            await pbGeneMethods.loadLiveGeneData.call(this, query, false);
            if (this.geneInfo.symbol !== previousGene) {
                this.associationQcSelection = null;
                this.associationCaseRange = null;
                this.associationSearch = ''; this.associationSortKey = ''; this.associationSortDirection = 'asc'; this.pinnedAssociations = []; this.pinnedVariantIds = []; this.variantIdentifierIds = null; this.appliedVariantQuery = ''; this.variantFilters = { clinvar: [], consequence: [], annotations: [], predictionCoverage: [], loftee: false }; this.associationPage = 1;
            }
            this.contextRunMeta = {}; this.currentContextRunId = ''; this.appliedContext = null;
            if (updateUrl) {
                const url = new URL(window.location.href);
                url.pathname = '/generesult.html'; url.searchParams.set('query', this.geneInfo.symbol);
                url.searchParams.delete('locus'); url.searchParams.delete('locusView');
                if (this.geneInfo.symbol !== previousGene) url.searchParams.delete('variant');
                window.history.pushState({}, '', url.toString());
            }
        },
    },
    watch: {
        associationSearch() { this.associationPage = 1; },
        associationQcSelection() { this.associationPage = 1; },
        associationCaseRange() { this.associationPage = 1; },
        associationPageCount(count) { this.associationPage = Math.min(this.associationPage, count); },
        'geneInfo.symbol'(symbol, previous) {
            if (symbol === previous) return;
            this.associationQcSelection = null;
            this.associationCaseRange = null;
            this.associationSearch = ''; this.associationSortKey = ''; this.associationSortDirection = 'asc'; this.pinnedAssociations = []; this.pinnedVariantIds = []; this.variantIdentifierIds = null; this.appliedVariantQuery = ''; this.variantFilters = { clinvar: [], consequence: [], annotations: [], predictionCoverage: [], loftee: false }; this.associationPage = 1;
            this.contextRunMeta = {}; this.currentContextRunId = ''; this.appliedContext = null;
        },
    },
};
</script>
