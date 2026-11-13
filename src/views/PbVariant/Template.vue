<template>
    <div>
        <div class="container-fluid mdkp-body pbg-page pbv-page" :class="{ 'pbv-info-reserved': infoReserved }">
            <div class="pbg-shell">
                <div class="pbg-toolbar">
                    <div class="pbg-toolbar-left">
                        <a href="/pb_Front.html" class="pbg-home-link" aria-label="PB portal home">
                            <b-icon-house-door-fill aria-hidden="true"></b-icon-house-door-fill>
                            <span>Home</span>
                        </a>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <span class="pbg-breadcrumb-link">Variant search</span>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <form
                            class="pbg-gene-search-form"
                            role="search"
                            aria-label="Search an exact variant"
                            :aria-busy="searchLoading ? 'true' : 'false'"
                            @submit.prevent="submitVariantSearch"
                        >
                            <input
                                v-model.trim="searchQuery"
                                class="pbg-gene-search-input"
                                style="width:19rem;text-transform:none;"
                                type="search"
                                autocomplete="off"
                                spellcheck="false"
                                aria-label="Exact variant chr:pos:ref:alt or rsID"
                                placeholder="chr:pos:ref:alt or rsID"
                            >
                            <button class="pbg-gene-search-submit" type="submit" :disabled="searchLoading">
                                {{ searchLoading ? 'Loading' : 'Search' }}
                            </button>
                            <span v-if="searchLoading" class="pbg-gene-search-progress" role="status" aria-live="polite">
                                <span class="pbg-loading-spinner" aria-hidden="true"></span>
                                <span class="pbg-loading-text">{{ searchProgress }}</span>
                                <span class="pbg-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                            </span>
                        </form>
                    </div>
                    <div class="pbg-toolbar-right">
                        <span v-if="geneQuery" class="pbv-toolbar-gene-label">{{ geneQuery }} gene</span>
                        <a :href="geneQuery ? `/pb_gene2.html?query=${geneQuery}` : '/pb_gene2.html'" class="pbg-nav-link">
                            {{ geneQuery ? 'Gene view →' : 'Gene search' }}
                        </a>
                    </div>
                </div>

                <p v-if="searchError" class="pbg-context-error" role="alert">{{ searchError }}</p>
                <p v-else-if="!variantAvailable && !searchLoading" class="pbg-context-empty">
                    <template v-if="emptyResultMessage">
                        {{ emptyResultMessage }}
                        <a :href="clinvarHref(searchQuery)" target="_blank" rel="noopener noreferrer">Search this variant in ClinVar ↗</a>
                    </template>
                    <template v-else>Enter an exact <code>chr:pos:ref:alt</code> ID or an <code>rsID</code>. Gene context is resolved automatically when available.</template>
                </p>

                <template v-if="variantAvailable">
                    <section class="pbg-hero-card pbv-identity-card pg2-card">
                        <div class="pbg-selected-variant-evidence">
                            <p class="pbg-section-label">Variant identity <help-tooltip label="Variant annotation source" :text="sources.annotation.text" :links="sources.annotation.links" /></p>
                            <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;margin-bottom:0.35rem;">
                                <a class="pbv-identity-gene-link" :href="`/pb_gene2.html?query=${variantIdentity.gene}`">{{ variantIdentity.gene }}</a>
                                <strong style="font-size:1.25rem;color:var(--pbg-text-strong);">{{ variantIdentity.displayLabel }}</strong>
                                <span class="pbg-crdc-badge">{{ variantIdentity.build }}</span>
                                <span v-if="variantIdentity.classification" class="pbg-context-status pbg-context-status--active">
                                    {{ variantIdentity.classification }}
                                </span>
                            </div>

                            <div class="pbg-selected-kv pbv-kv-grid-2col">
                                <div>
                                    <div class="pbg-selected-kv-row">
                                        <span>rsID (dbSNP)</span>
                                        <a
                                            v-if="variantIdentity.rsid"
                                            class="pbg-table-link"
                                            :href="`https://www.ncbi.nlm.nih.gov/snp/${variantIdentity.rsid}`"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >{{ variantIdentity.rsid }} ↗</a>
                                        <strong v-else class="pbg-unavailable-value">Unavailable</strong>
                                    </div>
                                    <div class="pbg-selected-kv-row"><span>HGVSc</span><strong :class="{ 'pbg-unavailable-value': !variantIdentity.hgvsc }">{{ variantIdentity.hgvsc || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row"><span>HGVSp</span><strong :class="{ 'pbg-unavailable-value': !variantIdentity.hgvsp }">{{ variantIdentity.hgvsp || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row"><span>NCBI RefSeq transcript</span><strong :class="{ 'pbg-unavailable-value': !variantIdentity.refseqTranscript }">{{ variantIdentity.refseqTranscript || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row"><span>Ensembl transcript</span><strong :class="{ 'pbg-unavailable-value': !variantIdentity.ensemblTranscript }">{{ variantIdentity.ensemblTranscript || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row"><span>Ensembl protein</span><strong :class="{ 'pbg-unavailable-value': !variantIdentity.ensemblProtein }">{{ variantIdentity.ensemblProtein || 'Unavailable' }}</strong></div>
                                </div>
                                <div>
                                    <div class="pbg-selected-kv-row"><span>Consequence <help-tooltip label="Consequence source" :text="sources.consequence.text" :links="sources.consequence.links" /></span><strong>{{ variantIdentity.consequence || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row">
                                        <span>ClinVar <help-tooltip label="ClinVar source" :text="sources.clinvar.text" :links="sources.clinvar.links" /></span>
                                        <a
                                            v-if="variantIdentity.clinvar"
                                            class="pbv-evidence-value"
                                            :class="clinvarClass(variantIdentity.clinvar)"
                                            :href="clinvarHref(variantIdentity.canonicalId)"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >{{ variantIdentity.clinvar }} ↗</a>
                                        <strong v-else class="pbv-evidence-value pbv-evidence--other">Unavailable</strong>
                                    </div>
                                    <div class="pbg-selected-kv-row pbv-kv-group-start"><span>{{ variantIdentity.crdcFrequencyKind === 'carrier' ? 'CRDC carrier frequency' : 'CRDC AF' }} <help-tooltip label="About CRDC frequency" :text="variantIdentity.crdcFrequencyKind === 'carrier' ? help.carrierFrequency : help.crdcAF" /></span><strong :class="{ 'pbv-crdc-af-highlight': !isUnavailableValue(variantIdentity.crdcAF) }">{{ variantIdentity.crdcAF || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row">
                                        <span>gnomAD AF <help-tooltip label="gnomAD AF source" :text="sources.gnomadAF.text" :links="sources.gnomadAF.links" /></span>
                                        <a
                                            v-if="variantIdentity.gnomadHref"
                                            class="pbg-table-link"
                                            :href="variantIdentity.gnomadHref"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >{{ variantIdentity.gnomadAF || 'View in gnomAD' }} ↗</a>
                                        <strong v-else class="pbg-unavailable-value">Unavailable</strong>
                                    </div>
                                    <div class="pbg-selected-kv-row pbv-variant-score-row pbv-kv-group-start">
                                        <span>LoFTEE <help-tooltip label="LoFTEE source" :text="sources.loftee.text" :links="sources.loftee.links" /> <small v-if="variantScoreSource === 'loftee'" class="pbv-variant-score-source">(variant score)</small></span>
                                        <strong class="pbv-evidence-value" :class="[lofteeClass(variantIdentity.loftee), { 'pbv-variant-score-highlight': variantScoreSource === 'loftee' }]">
                                            {{ variantIdentity.loftee || 'Unavailable' }}<template v-if="variantScoreSource === 'loftee'"> = {{ variantScore.toFixed(2) }}</template>
                                        </strong>
                                    </div>
                                    <div class="pbg-selected-kv-row pbv-variant-score-row">
                                        <span>AlphaMissense <help-tooltip label="AlphaMissense source" :text="sources.alphaMissense.text" :links="sources.alphaMissense.links" /> <small v-if="variantScoreSource === 'alphaMissense'" class="pbv-variant-score-source">(variant score)</small></span>
                                        <strong :class="{ 'pbv-variant-score-highlight': variantScoreSource === 'alphaMissense' }">{{ variantIdentity.alphaMissense || 'Unavailable' }}</strong>
                                    </div>
                                    <div class="pbg-selected-kv-row"><span>REVEL <help-tooltip label="REVEL source" :text="sources.revel.text" :links="sources.revel.links" /></span><strong>{{ variantIdentity.revel || 'Unavailable' }}</strong></div>
                                </div>
                            </div>
                        </div>

                    </section>

                    <section class="pbv-card pg2-card pbv-crdc-carriers" aria-labelledby="pbv-crdc-carriers-title">
                        <div class="pbv-section-heading">
                            <h2 id="pbv-crdc-carriers-title"><span class="pbv-inline-total">{{ variantIdentity.distinctCarriers.toLocaleString() }} {{ variantIdentity.distinctCarriers === 1 ? 'carrier' : 'carriers' }}</span> observed in CRDC <help-tooltip label="About observed CRDC carriers" :text="help.carrierSummary" /></h2>
                        </div>
                        <carrier-demographics :summary="carrierDemographicSummary" :carrier-count="variantIdentity.distinctCarriers" :scope="variantIdentity.canonicalId" compact inline-project-search />
                    </section>

                    <section class="pbv-card pg2-card pbv-profile" aria-labelledby="pbv-context-title">
                        <div class="pbv-section-heading">
                            <h2 id="pbv-context-title">Test a phenotype profile</h2>
                            <span class="pbv-methods"><help-tooltip label="Phenotype profile methods" :text="profileMethods" /> Methods</span>
                        </div>
                        <form class="pbv-profile-form" @submit.prevent="applyVariantProfile">
                            <label id="pg2-profile-input-label" class="pbv-profile-label">Phenotype profile</label>
                            <hpo-term-input ref="profile" v-model="contextInput" />
                            <button class="pbv-primary" type="submit" :disabled="contextLoading">{{ contextLoading ? 'Calculating…' : 'Apply' }}</button>
                            <details class="pbv-advanced">
                                <summary><b-icon-gear aria-hidden="true" /> Advanced options <b-icon-chevron-down aria-hidden="true" /></summary>
                                <div>
                                    <label>GRS <help-tooltip label="About GRS settings" :text="profileSettingsHelp" /><select v-model="contextScoreTypeInput" aria-label="Gene score aggregation"><option value="max">Max</option><option value="sum">Sum</option></select></label>
                                    <label>Samples<select v-model="contextAnalysisSetInput" aria-label="Analysis samples"><option value="all">All</option><option value="affected">Affected only</option></select></label>
                                    <button class="pbv-primary" type="submit" :disabled="contextLoading">Apply</button>
                                </div>
                            </details>
                        </form>
                        <p v-if="contextError" class="pbg-context-error" role="alert">{{ contextError }}</p>
                        <p v-if="contextWarning" class="pbv-context-warning" role="status">{{ contextWarning }}</p>
                        <div class="pbv-profile-table-scroll">
                            <table class="pbv-profile-table">
                                <thead><tr>
                                    <th>Phenotype profile</th>
                                    <th>β <help-tooltip label="About Variant beta" :text="help.variantBeta" /></th>
                                    <th>P <help-tooltip label="About Variant P" :text="help.variantP" /></th>
                                    <th>Mean carrier<br>rPheRS Z <help-tooltip label="About mean carrier rPheRS Z" :text="help.meanZ" /></th>
                                    <th>Settings <help-tooltip label="Applied analysis details" :text="profileSettingsHelp + '. Default: Max GRS and All samples.'" /></th>
                                    <th class="pbv-profile-actions-heading"><span class="pbv-sr-only">Result actions</span></th>
                                </tr></thead>
                                <tbody>
                                    <tr v-for="run in profileRuns" :key="run.id" :class="{ 'pbv-profile-applied': run.id === currentProfileRunId }">
                                        <td><strong>{{ run.label }}</strong><span v-if="run.id === currentProfileRunId" class="pbv-applied-tag">Applied</span><small>{{ run.terms.join(', ') }} <help-tooltip v-if="run.warning" :label="'Analysis warning for ' + run.label" :text="run.warning" /></small></td>
                                        <td>{{ run.association ? displayMean(run.association.beta) : 'Unavailable' }}</td>
                                        <td>{{ run.association ? displayPValue(run.association.pValue) : 'Unavailable' }}</td>
                                        <td>{{ run.match ? displayMean(run.match.matchScore) : 'Unavailable' }}</td>
                                        <td>{{ run.scoreType === 'sum' ? 'Sum' : 'Max' }} · {{ run.analysisSet === 'affected' ? 'Affected only' : 'All' }} <help-tooltip :label="'Analysis details for ' + run.label" :text="run.analysisDetails" /></td>
                                        <td class="pbv-profile-actions-cell"><div class="pbv-profile-actions">
                                            <button type="button" class="pbv-profile-action" :class="{ 'pbv-profile-rerunning': contextLoading && rerunningProfileRunId === run.id }" :disabled="contextLoading || searchLoading" :aria-label="'Re-run ' + run.label" :aria-busy="String(contextLoading && rerunningProfileRunId === run.id)" title="Re-run" @click="rerunVariantProfile(run)"><b-icon-arrow-clockwise aria-hidden="true" /></button>
                                            <button type="button" class="pbv-profile-action pbv-remove-profile" :disabled="contextLoading || searchLoading" :aria-label="'Delete result for ' + run.label" title="Delete row" @click="deleteVariantProfile(run)"><b-icon-x aria-hidden="true" /></button>
                                        </div></td>
                                    </tr>
                                    <tr v-if="contextLoading && profileRuns.length"><td colspan="6" class="pbv-profile-empty" role="status">Calculating another phenotype profile…</td></tr>
                                    <tr v-if="!profileRuns.length"><td colspan="6" class="pbv-profile-empty">{{ contextLoading ? 'Calculating phenotype profile…' : 'Add a phenotype profile and select Apply.' }}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div class="pbv-workspace pg2-card" :class="{ 'pbv-single-phenotype-carrier': phenotypeCarrierSelection.present.length <= 1 }">
                    <section class="pbv-recompute-results pbv-carrier-samples">
                        <div class="pbv-section-heading pbv-carrier-samples-heading">
                            <h2>{{ variantIdentity.distinctCarriers.toLocaleString() }} {{ variantIdentity.distinctCarriers === 1 ? 'carrier sample' : 'carrier samples' }}</h2><span class="pbv-internal-tag">Internal only</span>
                        </div>
                        <div class="pbv-variant-evidence-group" :class="{ 'is-expanded': carrierSamplesExpanded }">
                        <div class="pbv-variant-evidence-scroll">
                            <table class="pbv-variant-evidence-table" aria-label="Selected variant information and phenotype-based evidence">
                                <colgroup><col class="pbv-evidence-variant-col"><col class="pbv-evidence-clinvar-col"><col class="pbv-evidence-total-col"><col class="pbv-evidence-predictor-col"><col class="pbv-evidence-hpo-col"><col class="pbv-evidence-mean-col"><col class="pbv-evidence-beta-col"><col class="pbv-evidence-p-col"></colgroup>
                                <thead>
                                    <tr class="pbv-evidence-bands"><th colspan="4" scope="colgroup">Variant information</th><th colspan="4" scope="colgroup">Phenotype-based evidence</th></tr>
                                    <tr>
                                        <th scope="col">Variant</th>
                                        <th scope="col">ClinVar <help-tooltip label="About ClinVar classification" :text="help.clinvarAnnotation" /></th>
                                        <th scope="col">Total<br>carriers <help-tooltip label="About total variant carriers" :text="help.totalCarriers" /></th>
                                        <th scope="col">In Silico<br>Predictors <help-tooltip label="About In Silico Predictors" :text="help.pathogenicity + '\n\n' + sources.predictors.text" :links="sources.predictors.links" /></th>
                                        <th scope="col">Carriers<br>with HPO <help-tooltip label="About carriers with the applied HPO profile" :text="variantHpoCountTitle" /></th>
                                        <th scope="col">Mean carrier<br>rPheRS Z <help-tooltip label="About variant mean carrier rPheRS Z" :text="meanZHelp" /></th>
                                        <th scope="col">Variant β<br><small>(rPheRS SD)</small> <help-tooltip label="About variant beta" :text="help.variantBeta" /></th>
                                        <th scope="col">P <help-tooltip label="About variant P-value" :text="help.variantP" /></th>
                                    </tr>
                                </thead>
                                <tbody><tr class="pbv-variant-evidence-row" :class="{ 'is-expanded': carrierSamplesExpanded }" @click="carrierSamplesExpanded = !carrierSamplesExpanded">
                                    <td><button type="button" class="pbv-evidence-expand" :aria-label="(carrierSamplesExpanded ? 'Hide' : 'Show') + ' carrier samples for ' + variantIdentity.canonicalId" :aria-expanded="String(carrierSamplesExpanded)" aria-controls="pbv-carrier-sample-details" @click.stop="carrierSamplesExpanded = !carrierSamplesExpanded"><b-icon-chevron-down v-if="carrierSamplesExpanded" aria-hidden="true" /><b-icon-chevron-right v-else aria-hidden="true" /><span>{{ variantIdentity.canonicalId }}<small>{{ variantConsequenceLabel }}</small></span></button></td>
                                    <td><span class="pbv-evidence-clinvar" :class="{ 'is-pathogenic': /pathogenic/i.test(variantIdentity.clinvar || variantIdentity.classification || '') }">{{ variantIdentity.clinvar || variantIdentity.classification || 'Unavailable' }}</span></td>
                                    <td>{{ variantIdentity.distinctCarriers.toLocaleString() }}</td>
                                    <td><strong v-if="variantScore != null" class="pbv-evidence-score">{{ variantScore.toFixed(2) }}</strong><span v-else>—</span></td>
                                    <td :title="variantHpoCountTitle">{{ variantHpoCountDisplay }}</td>
                                    <td>{{ !appliedProfileTerms.length ? '—' : contextMatch ? displayMean(contextMatch.matchScore) : 'Unavailable' }}</td>
                                    <td>{{ !appliedProfileTerms.length ? '—' : contextAssociation ? displayMean(contextAssociation.beta) : 'Unavailable' }}</td>
                                    <td>{{ !appliedProfileTerms.length ? '—' : contextAssociation ? displayPValue(contextAssociation.pValue) : 'Unavailable' }}</td>
                                </tr></tbody>
                            </table>
                        </div>
                        <div v-show="carrierSamplesExpanded" id="pbv-carrier-sample-details" class="pbv-carrier-sample-details" role="region" aria-label="Individual carrier samples">
                            <div class="pbv-carrier-table" role="region" aria-label="Carrier sample table">
                                <div class="pbv-carrier-table-body">
                                    <p v-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                                    <template v-else>
                                        <div class="pbg-selected-sample-table">
                                            <div class="pbg-selected-sample-head">
                                                <span><button type="button" @click="sortTableColumn('carriers', 'sample')">Sample <i>{{ tableSortIndicator('carriers', 'sample') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'age')">Age <i>{{ tableSortIndicator('carriers', 'age') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'sex')">Sex <i>{{ tableSortIndicator('carriers', 'sex') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'gt')">GT <i>{{ tableSortIndicator('carriers', 'gt') }}</i></button> <help-tooltip label="Carrier genotype source" :text="help.genotype" /></span>
                                                <span class="pbv-rphers-head">
                                                    <button type="button" @click="sortTableColumn('carriers', 'residual')">rPheRS Z-score <i>{{ tableSortIndicator('carriers', 'residual') }}</i></button>
                                                    <help-tooltip label="What is an rPheRS Z-score?" :text="help.individualZ" />
                                                </span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'hpoCount')">Total HPO terms <i>{{ tableSortIndicator('carriers', 'hpoCount') }}</i></button> <help-tooltip label="About total HPO terms" text="The n_terms value used by residual PheRS: the row sum of the parent-expanded binary HPO input matrix, independent of the applied profile. A known empty phenotype record is shown as 0 even when the sample is outside the scoring matrix. Unknown counts remain unavailable; 0 does not establish scoring eligibility." /></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'affected')">Affected <i>{{ tableSortIndicator('carriers', 'affected') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'project')">Project <i>{{ tableSortIndicator('carriers', 'project') }}</i></button></span>
                                            </div>
                                            <div v-for="carrier in visibleCarrierRows" :key="carrier.key" class="pbg-selected-sample-row">
                                                <a class="pbg-sample-link" :href="`/pb_sample.html?query=${encodeURIComponent(carrier.id)}`">{{ carrier.id }}</a>
                                                <span>{{ carrierAge(carrier) }}</span>
                                                <span>{{ carrierMetadataField(carrier, 'sex') }}</span>
                                                <span>{{ displayCarrierValue(carrier.genotype) }}</span>
                                                <span :title="contextMatch ? 'Individual rPheRS Z-score for the selected HPO context; unavailable if this sample is outside the analysis roster or reference scores are unavailable.' : 'Test a phenotype profile to request matching.'">{{ carrierResidualScore(carrier) }}</span>
                                                <span>{{ carrierHpoCount(carrier) }}</span>
                                                <span>{{ carrierMetadataField(carrier, 'affected') }}</span>
                                                <span :title="carrierMetadataField(carrier, 'project')">{{ carrierMetadataField(carrier, 'project') }}</span>
                                            </div>
                                        </div>
                                        <SummaryPager class="pbv-result-pagination" :page="resultPages.carriers" :total-pages="carrierPageCount"
                                                      label="Carrier sample pages" input-id="pb-variant-carrier-page"
                                                      @change="setResultPage('carriers', $event)" />
                                    </template>
                                </div>
                            </div>
                        </div>
                        </div>
                    </section>

                    <div class="pbv-analysis-layout">
                    <section class="pbv-carrier-workspace-card">
                <div class="pbv-carrier-heading">
                    <div class="pbv-carrier-heading-main">
                        <h2>Carrier phenotypes <help-tooltip label="About carrier phenotypes" :text="carrierPhenotypesHelp" /></h2>
                        <div class="pbv-match-block" aria-live="polite">
                            <strong class="pbv-match-number">{{ phenotypePopulationLabel }}</strong>
                            <button v-if="filtersActive" class="pbv-clear-filters" type="button" @click="clearFilters">Clear filters</button>
                        </div>
                    </div>
                    </div>

                    <section class="pbv-filter-bar-card" aria-label="Carrier phenotype filters">
                        <div class="pbv-filter-groups">
                            <div v-for="facet in simpleFacetDefinitions" :key="facet.key" class="pbv-filter-group">
                                <p class="pbv-filter-group-label">{{ facet.label }}</p>
                                <div class="pbv-add-row">
                                    <select
                                        v-model="filterDrafts[facet.key]"
                                        :aria-label="`Select ${facet.label} to add`"
                                        :title="carrierFacetOptions[facet.key].length ? '' : 'Unavailable from the current API'"
                                        :disabled="!carrierFacetOptions[facet.key].length"
                                        @change="addFacet(facet.key)"
                                    >
                                        <option value="">All</option>
                                        <option v-for="option in carrierFacetOptions[facet.key]" :key="option.value" :value="option.value">
                                            {{ option.label }}
                                        </option>
                                    </select>
                                </div>
                                <div class="pbv-selected-chip-row">
                                    <span v-for="value in filters[facet.key]" :key="value" class="pbv-selected-chip">
                                        <span class="pbv-selected-chip-text">{{ formatFacetValue(facet.key, value) }}</span>
                                        <button type="button" :aria-label="`Remove ${formatFacetValue(facet.key, value)}`" @click="removeFacet(facet.key, value)">&times;</button>
                                    </span>
                                </div>
                            </div>

                            <div class="pbv-filter-group">
                                <p class="pbv-filter-group-label">Age</p>
                                <div class="pbv-add-row">
                                    <select v-model="filterDrafts.age" aria-label="Select an age band or exact age to add" :title="ageOptions.length ? '' : 'Unavailable from the current API'" :disabled="!ageOptions.length" @change="addFacet('age')">
                                        <option value="">All</option>
                                        <template v-for="group in ageOptionGroups">
                                            <optgroup v-if="group.label" :key="group.label" :label="group.label">
                                                <option v-for="option in group.options" :key="option.value" :value="option.value">{{ option.label }}</option>
                                            </optgroup>
                                            <option v-for="option in group.label ? [] : group.options" :key="option.value" :value="option.value">{{ option.label }}</option>
                                        </template>
                                    </select>
                                </div>
                                <div class="pbv-selected-chip-row">
                                    <span v-for="value in filters.age" :key="value" class="pbv-selected-chip">
                                        <span class="pbv-selected-chip-text">{{ formatFacetValue('age', value) }}</span>
                                        <button type="button" :aria-label="`Remove ${formatFacetValue('age', value)}`" @click="removeFacet('age', value)">&times;</button>
                                    </span>
                                </div>
                            </div>

                            <div class="pbv-filter-group pbv-filter-group--phenotype">
                                <p class="pbv-filter-group-label">Phenotype</p>
                                <div class="pbv-add-row">
                                    <div class="pbv-pheno-suggest-wrap">
                                        <input
                                            v-model.trim="phenotypeQuery"
                                            type="text"
                                            aria-label="Search a phenotype category or term to add"
                                            placeholder="Search observed phenotypes"
                                            autocomplete="off"
                                            :disabled="!hasPhenotypeData"
                                            @focus="phenotypeSuggestOpen = true"
                                            @input="phenotypeSuggestOpen = true"
                                            @blur="phenotypeSuggestOpen = false"
                                            @keydown.enter.prevent="addTypedPhenotype"
                                        >
                                        <div v-if="phenotypeSuggestOpen && hasPhenotypeData" class="pbv-pheno-suggest">
                                            <template v-for="category in phenotypeSuggestions">
                                                <div :key="`category-${category.key}`" class="pbv-pheno-suggest-cat" @mousedown.prevent="addPhenotypeToken(`cat:${category.key}`)">
                                                    {{ category.label }} <span v-if="category.id" class="pbv-hp-code">{{ category.id }}</span> — any term
                                                </div>
                                                <div :key="`terms-${category.key}`" class="pbv-pheno-suggest-terms">
                                                    <div
                                                        v-for="term in category.terms"
                                                        :key="term.key"
                                                        class="pbv-pheno-suggest-term"
                                                        @mousedown.prevent="addPhenotypeToken(`term:${term.key}`)"
                                                    >
                                                        {{ term.label }}<span v-if="term.id"> [{{ term.id }}]</span>
                                                    </div>
                                                </div>
                                            </template>
                                            <div v-if="!phenotypeSuggestions.length" class="pbv-pheno-suggest-empty">No observed term matches “{{ phenotypeQuery }}”</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="pbv-selected-chip-row">
                                    <span v-for="token in filters.phenotype" :key="token" class="pbv-selected-chip">
                                        <span class="pbv-selected-chip-text">{{ formatPhenotypeChip(token) }}</span>
                                        <button type="button" :aria-label="`Remove ${formatPhenotypeChip(token)}`" @click="removeFacet('phenotype', token)">&times;</button>
                                    </span>
                                </div>
                            </div>
                        </div>

                    </section>
                    </section>

                    <section class="pbv-recompute-results pbv-phenotype-results">
                        <div class="pbv-result-block">
                            <div v-if="unlistedProfileTerms.length" class="pbv-unlisted-profile" aria-label="Applied profile terms outside the observed phenotype tree">
                                <span class="pbv-unlisted-profile-label">Applied profile <help-tooltip label="About applied profile highlighting" text="Yellow highlights identify terms in the currently Applied phenotype profile. Terms recorded in the current carrier selection are highlighted in the tree below. Other applied terms remain here as a reference; missing or unrecorded terms do not establish clinical absence. Applying a profile does not filter carriers." /></span>
                                <span v-for="term in unlistedProfileTerms" :key="term.id" class="pbv-unlisted-profile-term">{{ term.label }} <small>{{ term.id }}</small></span>
                                <span class="pbv-unlisted-profile-status" role="status">{{ unlistedProfileStatus }}</span>
                            </div>
                            <p v-if="!hasPhenotypeData && sampleMetadataStatus === 'loading'" class="pbv-empty-note">Loading observed HPO terms from sample metadata…</p>
                            <p v-else-if="!hasPhenotypeData" class="pbv-empty-note">No observed HPO terms are available for these carriers.</p>
                            <p v-else-if="!phenotypeCarrierSelection.present.length" class="pbv-empty-note">No recorded phenotype data are available for the current carrier selection.</p>
                            <template v-else>
                                <div class="pbv-pheno-header">
                                    <span>Observed phenotypes among carriers with phenotype data <help-tooltip label="About observed phenotypes" :text="observedPhenotypesHelp + ' Bar colour indicates hierarchy depth. Highlighted Profile terms are the applied HPO input. Parent counts include descendants and must not be added together.'" /></span>
                                    <button type="button" @click="sortTableColumn('phenotypes', 'count')">{{ phenotypeCarrierSelection.present.length > 1 ? 'Carriers / with data (%)' : 'Carriers / with data' }} <i>{{ tableSortIndicator('phenotypes', 'count') }}</i></button>
                                </div>
                                <button class="pbv-phenotype-root" :class="phenotypeProfileClass('HP:0000118')" type="button" :aria-expanded="String(phenotypeRootExpanded)" @click="phenotypeRootExpanded = !phenotypeRootExpanded">
                                    <b-icon-chevron-down v-if="phenotypeRootExpanded" aria-hidden="true" /><b-icon-chevron-right v-else aria-hidden="true" />
                                    <span>Phenotypic abnormality <small>HP:0000118</small></span>
                                </button>
                                <div v-for="(row, rowIndex) in phenotypeRootExpanded ? visiblePhenotypeRows : []" :key="row.key" class="pbv-pheno-branch" :class="{ 'is-expanded': expandedCategories.includes(row.key), 'is-last-branch': rowIndex === visiblePhenotypeRows.length - 1 }">
                                    <div class="pbv-pheno-row" :class="phenotypeProfileClass(row.id)">
                                        <button class="pbv-pheno-toggle" type="button" :aria-label="`${expandedCategories.includes(row.key) ? 'Collapse' : 'Expand'} ${row.label}`" :aria-expanded="expandedCategories.includes(row.key) ? 'true' : 'false'" @click="toggleCategory(row.key)">
                                            {{ expandedCategories.includes(row.key) ? '▾' : '▸' }}
                                        </button>
                                        <div class="pbv-bar-row pbv-bar-row--pheno" style="flex:1;margin-bottom:0;">
                                            <span>{{ row.label }}<span v-if="appliedProfileTerms.includes(row.id)" class="pbv-profile-node-tag">Profile</span><span v-if="row.id" class="pbv-hp-code">{{ row.id }}</span></span>
                                            <div class="pbv-bar-track"><div class="pbv-bar-fill" :style="{ width: `${row.pct}%`, backgroundColor: phenotypeDepthColor(0) }"></div></div>
                                            <strong>{{ row.count }} / {{ phenotypeCarrierSelection.present.length }}<template v-if="phenotypeCarrierSelection.present.length > 1"> ({{ row.pct }}%)</template></strong>
                                        </div>
                                    </div>
                                    <div v-if="expandedCategories.includes(row.key)" class="pbv-pheno-terms">
                                        <div v-for="term in visiblePhenotypeTerms(row)" :key="term.key" class="pbv-bar-row pbv-bar-row--nested" :class="phenotypeProfileClass(term.id)" :style="{ '--pbv-tree-depth': term.depth }">
                                            <span class="pbv-hpo-node-label">
                                                <span v-for="(guide, index) in term.treeGuides" :key="index" class="pbv-tree-guide"
                                                      :class="{ 'is-elbow': guide.elbow, 'is-last': guide.last, 'is-continuing': guide.continuing }" aria-hidden="true"></span>
                                                <button v-if="term.hasChildren" class="pbv-pheno-toggle" type="button"
                                                        :aria-label="`${expandedPhenotypeNodes.includes(term.id) ? 'Collapse' : 'Expand'} ${term.label}`"
                                                        :aria-expanded="expandedPhenotypeNodes.includes(term.id) ? 'true' : 'false'"
                                                        @click="togglePhenotypeNode(term.id)">{{ expandedPhenotypeNodes.includes(term.id) ? '▾' : '▸' }}</button>
                                                <span v-else class="pbv-hpo-leaf-marker">·</span>
                                                <span>{{ term.label }}<template v-if="term.id"> [{{ term.id }}]</template><span v-if="appliedProfileTerms.includes(term.id)" class="pbv-profile-node-tag">Profile</span></span>
                                            </span>
                                            <div class="pbv-bar-track"><div class="pbv-bar-fill" :style="{ width: `${term.pct}%`, backgroundColor: phenotypeDepthColor(term.depth) }"></div></div>
                                            <strong>{{ term.count }} / {{ phenotypeCarrierSelection.present.length }}<template v-if="phenotypeCarrierSelection.present.length > 1"> ({{ term.pct }}%)</template></strong>
                                        </div>
                                    </div>
                                </div>
                                <SummaryPager v-if="phenotypeRootExpanded" class="pbv-result-pagination" :page="resultPages.phenotypes" :total-pages="phenotypePageCount"
                                              label="Observed phenotype pages" input-id="pb-variant-phenotype-page"
                                              @change="setResultPage('phenotypes', $event)" />
                            </template>
                        </div>

                    </section>
                    </div>

                    </div>

                    <section class="pbv-recompute-results pbv-detail-results">



                        <details class="pbv-card pg2-card pbv-result-block">
                            <summary><span>Co-carried genes</span><help-tooltip label="About co-carried genes" :text="coGeneHelp" /><b-icon-chevron-down class="pbv-disclosure-chevron" aria-hidden="true" /></summary>
                            <div class="pbv-disclosure-body">
                            <div class="pbv-cooccur-section-heading">
                                <h3>Co-occurrence among this variant's carriers</h3>
                                <a href="#pbv-context-title" class="pbv-context-link-status"
                                   :class="{ 'is-active': contextMatch || contextAssociation }"
                                   title="The applied phenotype profile controls gene effects per 0.1 GRS in SD units and co-variant mean carrier rPheRS Z. Carrier overlap, Variant Score, and ClinVar are independent of the profile.">
                                    {{ contextMatch || contextAssociation ? 'Profile applied' : 'Test a phenotype profile' }} ↑
                                </a>
                            </div>
                            <p class="pbv-sub">Counts use the same {{ matchCount }} distinct-carrier selection shown above.</p>
                            <div class="pbv-cooccur-grid">
                                <article class="pbv-cooccur-card">
                                    <h3>Different-gene co-carriers <help-tooltip label="Co-gene analysis details" :text="coGeneAnalysisDetails" /></h3>
                                    <p v-if="coGeneAssociationStatus === 'error'" class="pbv-empty-note">Gene associations unavailable: {{ coGeneAssociationError }}</p>
                                    <p v-if="!hasCoGeneData && sampleMetadataStatus === 'loading'" class="pbv-empty-note">Loading sample gene lists…</p>
                                    <p v-else-if="!hasCoGeneData" class="pbv-empty-note">Not calculated — sample gene lists are unavailable.</p>
                                    <p v-else-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                                    <div v-else class="pbv-cooccur-table pbv-cooccur-table--genes">
                                        <div class="pbv-cooccur-head">
                                            <span><button type="button" @click="sortTableColumn('coGenes', 'gene')">Gene <i>{{ tableSortIndicator('coGenes', 'gene') }}</i></button></span>
                                            <span title="Shared carriers / selected target-variant carriers (overlap percentage)."><button type="button" @click="sortTableColumn('coGenes', 'count')">Carriers <i>{{ tableSortIndicator('coGenes', 'count') }}</i></button></span>
                                            <span title="Covariate-adjusted residual PheRS change in reference-cohort SD units per 0.1 increase in the selected Max/Sum gene burden score."><button class="pbv-effect-score-heading" type="button" @click="sortTableColumn('coGenes', 'beta')">Gene β (rPheRS SD) <i>{{ tableSortIndicator('coGenes', 'beta') }}</i></button><help-tooltip label="About Custom Gene beta" :text="help.customBeta" /></span>
                                            <span><button type="button" @click="sortTableColumn('coGenes', 'pValue')">P <i>{{ tableSortIndicator('coGenes', 'pValue') }}</i></button></span>
                                            <span title="Benjamini–Hochberg adjusted p-value across the target gene and all unfiltered co-genes."><button type="button" @click="sortTableColumn('coGenes', 'fdr')">FDR <i>{{ tableSortIndicator('coGenes', 'fdr') }}</i></button><help-tooltip label="About co-gene FDR" :text="coGeneFdrHelp" /></span>
                                        </div>
                                        <div class="pbv-cooccur-row pbv-cooccur-row--target">
                                            <span><a :href="`/pb_gene2.html?query=${variantIdentity.gene}`">{{ variantIdentity.gene }}</a> <small>Target gene</small></span>
                                            <span>{{ matchCount }} / {{ matchCount }} (100%)</span>
                                            <span>{{ geneAssociationCell(variantIdentity.gene, 'beta') }}</span>
                                            <span>{{ geneAssociationCell(variantIdentity.gene, 'p_value') }}</span>
                                            <span>{{ geneAssociationCell(variantIdentity.gene, 'fdr') }}</span>
                                        </div>
                                        <div v-for="row in visibleCooccurGeneRows" :key="row.gene" class="pbv-cooccur-row">
                                            <a :href="`/pb_gene2.html?query=${row.gene}`">{{ row.gene }}</a><span>{{ row.count }} / {{ matchCount }} ({{ row.pct }}%)</span><span>{{ geneAssociationCell(row.gene, 'beta') }}</span><span>{{ geneAssociationCell(row.gene, 'p_value') }}</span><span>{{ geneAssociationCell(row.gene, 'fdr') }}</span>
                                        </div>
                                        <p v-if="!cooccurGeneRows.length" class="pbv-empty-note">No different-gene co-carriers in the current selection.</p>
                                        <SummaryPager class="pbv-result-pagination" :page="resultPages.coGenes" :total-pages="coGenePageCount"
                                                      label="Different-gene co-carrier pages" input-id="pb-variant-cogene-page"
                                                      @change="setResultPage('coGenes', $event)" />
                                    </div>
                                </article>
                            </div>
                            </div>
                        </details>
                        <details class="pbv-card pg2-card pbv-result-block">
                            <summary><span>Other {{ variantIdentity.gene }} variants observed in these carriers</span> <help-tooltip label="About other variants" text="Target-variant carriers who also carry each other variant in this gene. Counts use the current carrier filters. Mean carrier rPheRS Z requires complete coverage among eligible co-carriers for the applied phenotype profile." /><b-icon-chevron-down class="pbv-disclosure-chevron" aria-hidden="true" /></summary>
                            <div class="pbv-disclosure-body">
                                    <p v-if="!hasCoVariantData" class="pbv-empty-note">Unavailable — the current API response has no same-gene co-variant field.</p>
                                    <p v-else-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                                    <p v-else-if="!cooccurVariantRows.length" class="pbv-empty-note">No other {{ variantIdentity.gene }} variants were observed among the current carrier selection.</p>
                                    <div v-else class="pbv-cooccur-table pbv-cooccur-table--variants">
                                        <div class="pbv-cooccur-head">
                                            <span><button type="button" @click="sortTableColumn('coVariants', 'id')">Variant <i>{{ tableSortIndicator('coVariants', 'id') }}</i></button></span>
                                            <span title="Carriers shared with the selected target variant, out of all selected target-variant carriers. The percentage uses the same denominator."><button type="button" @click="sortTableColumn('coVariants', 'count')">Carriers <i>{{ tableSortIndicator('coVariants', 'count') }}</i></button></span>
                                            <span title="LoFTEE HC = 1; otherwise AlphaMissense when available."><button type="button" @click="sortTableColumn('coVariants', 'variantScore')">Variant Score <i>{{ tableSortIndicator('coVariants', 'variantScore') }}</i></button></span>
                                            <span title="Mean of individual rPheRS Z-scores among current filtered target-variant carriers who also carry this variant, using the phenotype profile analysis sample setting. Shown only with complete eligible co-carrier coverage; the SD reference does not change with filters."><button class="pbv-mean-residual-heading" type="button" @click="sortTableColumn('coVariants', 'meanResidual')">Mean carrier rPheRS Z <i>{{ tableSortIndicator('coVariants', 'meanResidual') }}</i></button></span>
                                            <span><button type="button" @click="sortTableColumn('coVariants', 'clinvar')">ClinVar <i>{{ tableSortIndicator('coVariants', 'clinvar') }}</i></button></span>
                                        </div>
                                        <div v-for="row in visibleCooccurVariantRows" :key="row.id" class="pbv-cooccur-row">
                                            <a :href="`/pb_variant.html?query=${row.id}&gene=${row.gene || variantIdentity.gene}`">{{ row.id }}</a><span>{{ row.count }} / {{ matchCount }} ({{ row.pct }}%)</span><span>{{ row.variantScore == null ? 'Unavailable' : String(row.variantScore) }}</span>
                                            <span class="pbv-cooccur-residual" :title="`${row.scoredCarrierCount || 0} / ${row.eligibleCarrierCount || 0} eligible co-carriers scored for the selected phenotype profile${coGeneAnalysisSet === 'affected' ? ' (affected only)' : ''}.`">
                                                <template v-if="contextLoading">Calculating…</template>
                                                <template v-else-if="row.meanResidual != null">{{ displayMean(row.meanResidual) }}</template>
                                                <template v-else-if="!contextMatch && !contextAssociation && !contextError">No applied profile</template>
                                                <template v-else>Unavailable <small>{{ row.eligibleCarrierCount ? `${row.scoredCarrierCount || 0}/${row.eligibleCarrierCount} scored` : '0 eligible' }}</small></template>
                                            </span>
                                            <span :title="row.clinvar || 'Unavailable'">{{ row.clinvar || 'Unavailable' }}</span>
                                        </div>
                                        <SummaryPager class="pbv-result-pagination" :page="resultPages.coVariants" :total-pages="coVariantPageCount"
                                                      label="Other same-gene variant pages" input-id="pb-variant-covariant-page"
                                                      @change="setResultPage('coVariants', $event)" />
                                    </div>
                            </div>
                        </details>
                    </section>
                </template>
                <info-rail @reserve="infoReserved = $event" />
            </div>
        </div>

    </div>
</template>

<script>
import { createPbVariantState, pbVariantComputed, pbVariantMethods } from "./pageModel";
import HpoTermInput from "@/views/PbGene2/ProfileInput";
import HelpTooltip from "@/views/PbGene2/HelpTooltip";
import InfoRail from "@/views/PbGene2/InfoRail";
import CarrierDemographics from "@/views/PbGene2/Demographics";
import help from "@/views/PbGene2/evidenceHelp";
import layoutHelp from "./layoutHelp";
import { VARIANT_ANNOTATION_SOURCES } from "@/views/PbGene2/referenceProvenance";
import SummaryPager from "@/views/PbGene/SummaryPager";
import "@/views/PbGene/style.css";
import "./style.css";

export default {
    name: "PbVariantTemplate",
    components: { HpoTermInput, SummaryPager, HelpTooltip, InfoRail, CarrierDemographics },
    data() {
        return { ...createPbVariantState(), ...layoutHelp, infoReserved: false, phenotypeRootExpanded: true, help, sources: VARIANT_ANNOTATION_SOURCES };
    },
    computed: pbVariantComputed,
    watch: { variantHpoCountKey: {immediate: true, handler: 'loadVariantHpoCounts'} },
    beforeDestroy() { this.variantHpoRevision++; },
    mounted() {
        if (this.searchQuery) {
            this.loadLiveVariantData(false);
        }
    },
    methods: pbVariantMethods,
};
</script>
