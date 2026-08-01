<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body pbg-page pbv-page">
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
                    <div v-if="geneQuery" class="pbg-toolbar-right">
                        <span class="pbv-toolbar-gene-label">{{ geneQuery }} gene</span>
                        <a :href="`/pb_Gene.html?query=${geneQuery}`" class="pbg-nav-link">Gene view →</a>
                    </div>
                </div>

                <p v-if="searchError" class="pbg-context-error" role="alert">{{ searchError }}</p>
                <p v-else-if="!variantAvailable && !searchLoading" class="pbg-context-empty">
                    Enter an exact <code>chr:pos:ref:alt</code> ID or an <code>rsID</code>. Gene context is resolved automatically when available.
                </p>

                <template v-if="variantAvailable">
                    <details class="pbg-context-disclosure">
                        <summary>
                            <strong>HPO Context</strong>
                            <span class="pbg-context-summary-sub">exact-variant Match Score</span>
                            <span class="pbg-context-summary-pill">
                                {{ contextLoading ? 'Calculating' : contextMatch && contextMatch.matchScore != null ? displayMean(contextMatch.matchScore) : contextMatch ? contextMatch.status : 'On-demand tool' }}
                            </span>
                        </summary>
                        <section class="pbg-context-card" aria-labelledby="pbv-context-title">
                            <div class="pbg-context-head">
                                <div>
                                    <h2 id="pbv-context-title">Run HPO context</h2>
                                    <p>Calculate the mean residual PheRS across every unique carrier of this exact variant.</p>
                                </div>
                                <span class="pbg-context-status" :class="{ 'pbg-context-status--active': activeContextTerms.length }">
                                    {{ activeContextTerms.length ? 'Context active' : 'No context' }}
                                </span>
                            </div>
                            <form class="pbg-context-form" @submit.prevent="runVariantContext">
                                <input
                                    v-model.trim="contextInput"
                                    type="text"
                                    aria-label="HPO context terms"
                                    autocomplete="off"
                                    spellcheck="false"
                                    placeholder="Enter HPO terms, e.g. HP:0001250, HP:0000133"
                                >
                                <button type="submit" :disabled="contextLoading">{{ contextLoading ? 'Calculating' : 'Go' }}</button>
                            </form>
                            <div v-if="contextTermDetails.length" class="pbg-context-imported-terms" aria-label="Selected HPO context">
                                <span v-for="term in contextTermDetails" :key="term.id">
                                    <strong>{{ term.label }}</strong>
                                    <code>{{ term.id }}</code>
                                </span>
                            </div>
                            <p v-if="contextError" class="pbg-context-error" role="alert">{{ contextError }}</p>
                            <div v-if="contextMatch" class="pbg-context-results">
                                <div class="pbg-context-result-head pbv-context-result-grid">
                                    <span>HPOs entered</span><span>Exact-variant Match Score</span><span>Carrier coverage</span><span>Status</span>
                                </div>
                                <div class="pbg-context-result-row pbv-context-result-grid">
                                    <span>{{ activeContextTerms.join(', ') }}</span>
                                    <strong :class="{ 'pbg-unavailable-value': contextMatch.matchScore == null }">{{ displayMean(contextMatch.matchScore) }}</strong>
                                    <span>{{ contextMatch.scoredCarrierCount || 0 }} / {{ contextMatch.carrierCount || 0 }} scored</span>
                                    <span>{{ contextMatch.status }}</span>
                                </div>
                            </div>
                            <p v-else class="pbg-context-empty">Enter an HPO context and select Go to calculate this variant's carrier mean.</p>
                            <p class="pbv-context-crossref">
                                <strong>Match Score is not correlation or association.</strong> It is returned only when every carrier in the Context API carrier set has a residual PheRS; no partial mean is shown. Carrier-statistics filters below do not change this server aggregate.
                            </p>
                        </section>
                    </details>

                    <section class="pbg-hero-card pbv-identity-card">
                        <div class="pbg-selected-variant-evidence">
                            <p class="pbg-section-label">Variant identity</p>
                            <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;margin-bottom:0.35rem;">
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
                                    <div class="pbg-selected-kv-row"><span>Consequence</span><strong>{{ variantIdentity.consequence || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row"><span>HGVSc</span><strong :class="{ 'pbg-unavailable-value': !variantIdentity.hgvsc }">{{ variantIdentity.hgvsc || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row"><span>HGVSp</span><strong :class="{ 'pbg-unavailable-value': !variantIdentity.hgvsp }">{{ variantIdentity.hgvsp || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row"><span>NCBI RefSeq transcript</span><strong :class="{ 'pbg-unavailable-value': !variantIdentity.refseqTranscript }">{{ variantIdentity.refseqTranscript || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row"><span>Ensembl transcript</span><strong :class="{ 'pbg-unavailable-value': !variantIdentity.ensemblTranscript }">{{ variantIdentity.ensemblTranscript || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row"><span>Ensembl protein</span><strong :class="{ 'pbg-unavailable-value': !variantIdentity.ensemblProtein }">{{ variantIdentity.ensemblProtein || 'Unavailable' }}</strong></div>
                                </div>
                                <div>
                                    <div class="pbg-selected-kv-row"><span>CRDC AF (DP20)</span><strong>{{ variantIdentity.crdcAF || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row">
                                        <span>gnomAD AF</span>
                                        <a
                                            v-if="variantIdentity.gnomadHref"
                                            class="pbg-table-link"
                                            :href="variantIdentity.gnomadHref"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >{{ variantIdentity.gnomadAF || 'View in gnomAD' }} ↗</a>
                                        <strong v-else class="pbg-unavailable-value">Unavailable</strong>
                                    </div>
                                    <div class="pbg-selected-kv-row">
                                        <span>ClinVar</span>
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
                                    <div class="pbg-selected-kv-row">
                                        <span>LoFTEE</span>
                                        <strong class="pbv-evidence-value" :class="lofteeClass(variantIdentity.loftee)">
                                            {{ variantIdentity.loftee || 'Unavailable' }}
                                        </strong>
                                    </div>
                                    <div class="pbg-selected-kv-row"><span>AlphaMissense</span><strong>{{ variantIdentity.alphaMissense || 'Unavailable' }}</strong></div>
                                    <div class="pbg-selected-kv-row"><span>REVEL</span><strong>{{ variantIdentity.revel || 'Unavailable' }}</strong></div>
                                </div>
                            </div>
                        </div>

                        <div class="pbv-gene-side-col">
                            <div class="pbv-identity-summary" aria-label="Variant carrier and gene summary">
                                <div class="pbv-identity-stat">
                                    <span>Distinct carriers</span>
                                    <strong>{{ variantIdentity.distinctCarriers.toLocaleString() }}</strong>
                                    <small>people with this exact variant</small>
                                    <em v-if="!isUnavailableValue(variantIdentity.totalSampleUniverse)">of {{ Number(variantIdentity.totalSampleUniverse).toLocaleString() }} CRDC samples</em>
                                    <em v-else>CRDC cohort denominator unavailable</em>
                                </div>
                                <a class="pbv-identity-gene" :href="`/pb_Gene.html?query=${variantIdentity.gene}`">
                                    <span>Gene</span>
                                    <strong>{{ variantIdentity.gene }}</strong>
                                    <small>{{ geneContext.carrierCount }} distinct gene carriers · {{ geneContext.observedVariantCount }} observed variants</small>
                                </a>
                            </div>
                            <details class="pbv-gene-side-panel">
                                <summary>
                                    <strong class="pbv-gene-side-heading">{{ geneContext.symbol }} — gene info</strong>
                                    <span class="pbv-gene-side-note">
                                        {{ geneContext.carrierCount }} gene carriers · {{ geneContext.observedVariantCount }} observed variants
                                    </span>
                                </summary>
                                <div class="pbv-gene-side-body">
                                    <div class="pbv-gene-stat-row"><span>P/LP variants</span><strong>{{ geneContext.plpVariantCount }}</strong></div>
                                    <hr class="pbv-gene-side-hr">
                                    <p class="pbv-condition-label">DDG2P</p>
                                    <p v-if="genePanelInfo.ddg2p.support" class="pbv-condition-row-item">
                                        {{ genePanelInfo.ddg2p.confidenceCategories || 'Supported' }}
                                        <small v-for="name in genePanelInfo.ddg2p.diseaseNames" :key="name">{{ name }}</small>
                                    </p>
                                    <p v-else class="pbv-gene-annotation-none">No entry</p>

                                    <p class="pbv-condition-label">PanelApp</p>
                                    <p v-if="genePanelInfo.panelapp.greenSupport" class="pbv-condition-row-item">
                                        {{ genePanelInfo.panelapp.panelCount }} diagnostic-grade panel{{ genePanelInfo.panelapp.panelCount === 1 ? '' : 's' }}
                                        <small v-if="genePanelInfo.panelapp.panelNames.length">{{ genePanelInfo.panelapp.panelNames.join(' · ') }}</small>
                                        <small v-if="genePanelInfo.panelapp.modesOfInheritance">MOI: {{ genePanelInfo.panelapp.modesOfInheritance }}</small>
                                    </p>
                                    <p v-else class="pbv-gene-annotation-none">No diagnostic-grade panel association found</p>

                                    <p class="pbv-condition-label">Pathway</p>
                                    <div v-if="genePanelInfo.pathways.count" class="pbv-pathway-summary">
                                        <p v-for="name in genePanelInfo.pathways.displayNames" :key="name">{{ name }}</p>
                                        <small v-if="genePanelInfo.pathways.moreCount">+{{ genePanelInfo.pathways.moreCount }} more in full gene view</small>
                                    </div>
                                    <p v-else class="pbv-gene-annotation-none">No annotation</p>
                                </div>
                            </details>
                            <a :href="`/pb_Gene.html?query=${geneContext.symbol}`" class="pbg-nav-link pbv-gene-side-link">
                                Full {{ geneContext.symbol }} gene view →
                            </a>
                        </div>
                    </section>

                    <section class="pbv-carrier-workspace-card">
                    <div class="pbv-carrier-heading">
                        <h2>Carrier statistics</h2>
                        <div class="pbv-carrier-heading-aside">
                            <p>Filter this variant's carriers. Phenotype, sample, and co-occurrence results update together.</p>
                            <details class="pbv-notes-details">
                                <summary>Data notes</summary>
                                <div class="pbv-notes-body">
                                    <p><strong>Source:</strong> {{ liveDataSource }} via the existing PB Gene adapter.</p>
                                    <p>Carrier rows are deduplicated by sample internally. The authorized carrier table renders only the fields already returned by the private BioIndex; missing metadata remains Unavailable.</p>
                                    <p>The filter workspace consumes optional age, sex, investigator, affected, proband, observed-HPO category/term, and co-occurrence fields. A field stays Unavailable until the authorized API supplies it; no fixture fallback is used.</p>
                                </div>
                            </details>
                        </div>
                    </div>

                    <section class="pbv-filter-bar-card" aria-label="Carrier statistics filters">
                        <div class="pbv-filter-groups">
                            <div v-for="facet in simpleFacetDefinitions" :key="facet.key" class="pbv-filter-group">
                                <p class="pbv-filter-group-label">{{ facet.label }}</p>
                                <div class="pbv-add-row">
                                    <select
                                        v-model="filterDrafts[facet.key]"
                                        :aria-label="`Select ${facet.label} to add`"
                                        :title="carrierFacetOptions[facet.key].length ? '' : 'Unavailable from the current API'"
                                        :disabled="!carrierFacetOptions[facet.key].length"
                                    >
                                        <option value="">All</option>
                                        <option v-for="option in carrierFacetOptions[facet.key]" :key="option.value" :value="option.value">
                                            {{ option.label }}
                                        </option>
                                    </select>
                                    <button class="pbv-add-btn" type="button" aria-label="Add" :disabled="!filterDrafts[facet.key]" @click="addFacet(facet.key)">+</button>
                                </div>
                                <div class="pbv-selected-chip-row">
                                    <span v-for="value in filters[facet.key]" :key="value" class="pbv-selected-chip">
                                        {{ formatFacetValue(facet.key, value) }}
                                        <button type="button" :aria-label="`Remove ${formatFacetValue(facet.key, value)}`" @click="removeFacet(facet.key, value)">&times;</button>
                                    </span>
                                </div>
                            </div>

                            <div class="pbv-filter-group">
                                <p class="pbv-filter-group-label">Age at enrollment</p>
                                <div class="pbv-add-row">
                                    <select v-model="filterDrafts.age" aria-label="Select an age band or exact age to add" :title="ageOptions.length ? '' : 'Unavailable from the current API'" :disabled="!ageOptions.length">
                                        <option value="">All</option>
                                        <template v-for="group in ageOptionGroups">
                                            <optgroup v-if="group.label" :key="group.label" :label="group.label">
                                                <option v-for="option in group.options" :key="option.value" :value="option.value">{{ option.label }}</option>
                                            </optgroup>
                                            <option v-for="option in group.label ? [] : group.options" :key="option.value" :value="option.value">{{ option.label }}</option>
                                        </template>
                                    </select>
                                    <button class="pbv-add-btn" type="button" aria-label="Add" :disabled="!filterDrafts.age" @click="addFacet('age')">+</button>
                                </div>
                                <div class="pbv-selected-chip-row">
                                    <span v-for="value in filters.age" :key="value" class="pbv-selected-chip">
                                        {{ formatFacetValue('age', value) }}
                                        <button type="button" :aria-label="`Remove ${formatFacetValue('age', value)}`" @click="removeFacet('age', value)">&times;</button>
                                    </span>
                                </div>
                            </div>

                            <div class="pbv-filter-group pbv-filter-group--phenotype">
                                <p class="pbv-filter-group-label">Phenotype</p>
                                <p class="pbv-facet-note">
                                    {{ hasPhenotypeData ? 'Search categories or terms observed among this variant’s carriers' : 'Unavailable from the current API' }}
                                </p>
                                <div class="pbv-add-row">
                                    <div class="pbv-pheno-suggest-wrap">
                                        <input
                                            v-model.trim="phenotypeQuery"
                                            type="text"
                                            aria-label="Search a phenotype category or term to add"
                                            placeholder="Type to search…"
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
                                    <button class="pbv-add-btn" type="button" aria-label="Add" :disabled="!phenotypeExactMatch" @click="addTypedPhenotype">+</button>
                                </div>
                                <div class="pbv-selected-chip-row">
                                    <span v-for="token in filters.phenotype" :key="token" class="pbv-selected-chip">
                                        {{ formatPhenotypeChip(token) }}
                                        <button type="button" :aria-label="`Remove ${formatPhenotypeChip(token)}`" @click="removeFacet('phenotype', token)">&times;</button>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="pbv-match-block" aria-live="polite">
                            <div>
                                <strong class="pbv-match-number">{{ matchCount }}</strong>
                                <span class="pbv-match-label">matching / {{ variantIdentity.distinctCarriers }} total</span>
                            </div>
                            <span class="pbv-match-sub">exact-variant carriers</span>
                            <button v-if="filtersActive" class="pbv-clear-filters" type="button" @click="clearFilters">Clear filters</button>
                        </div>
                    </section>
                    </section>

                    <div class="pbv-recompute-connector">recomputed for the current selection</div>

                    <section class="pbv-recompute-results">
                        <div class="pbv-result-block">
                            <h3>Phenotype categories</h3>
                            <p class="pbv-sub">
                                {{ filtersActive ? `Among ${matchCount} of ${variantIdentity.distinctCarriers} carriers matching the current filter` : `Among all ${variantIdentity.distinctCarriers} carriers of this variant` }}
                                · click ▸ to see specific HPO terms
                            </p>
                            <p v-if="!hasPhenotypeData" class="pbv-empty-note">Unavailable — the current carrier API response has no observed HPO category or term fields.</p>
                            <p v-else-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                            <template v-else>
                                <div v-for="row in phenotypeRows" :key="row.key">
                                    <div class="pbv-pheno-row">
                                        <button class="pbv-pheno-toggle" type="button" :aria-expanded="expandedCategories.includes(row.key) ? 'true' : 'false'" @click="toggleCategory(row.key)">
                                            {{ expandedCategories.includes(row.key) ? '▾' : '▸' }}
                                        </button>
                                        <div class="pbv-bar-row pbv-bar-row--pheno" style="flex:1;margin-bottom:0;">
                                            <span>{{ row.label }}<span v-if="row.id" class="pbv-hp-code">{{ row.id }}</span></span>
                                            <div class="pbv-bar-track"><div class="pbv-bar-fill" :style="{ width: `${row.pct}%` }"></div></div>
                                            <strong>{{ row.count }} ({{ row.pct }}%)</strong>
                                        </div>
                                    </div>
                                    <div v-if="expandedCategories.includes(row.key)" class="pbv-pheno-terms">
                                        <div v-for="term in row.terms" :key="term.key" class="pbv-bar-row pbv-bar-row--nested">
                                            <span>{{ term.label }}<template v-if="term.id"> [{{ term.id }}]</template></span>
                                            <div class="pbv-bar-track"><div class="pbv-bar-fill" :style="{ width: `${term.pct}%` }"></div></div>
                                            <strong>{{ term.count }} ({{ term.pct }}%)</strong>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <div class="pbv-result-block pbv-carrier-result-block">
                            <div class="pbv-result-heading">
                                <h3>Carrier samples</h3>
                                <div class="pbv-carrier-inline-scores">
                                    <span class="pbv-carrier-inline-score"
                                          :title="contextScoreAvailableForSelection ? `${contextMatch.scoredCarrierCount || 0} / ${contextMatch.carrierCount || 0} context carriers scored · ${contextMatch.status}` : 'Run HPO Context above to calculate the exact-variant carrier mean.'">
                                        <small>Mean residual PheRS</small>
                                        <strong :class="{ 'pbg-unavailable-value': !contextScoreAvailableForSelection }">
                                            {{ contextScoreAvailableForSelection ? displayMean(contextMatch.matchScore) : 'Unavailable' }}
                                        </strong>
                                    </span>
                                    <span class="pbv-carrier-inline-score"
                                          :title="`${carrierGrsSummary.scoredCount} / ${carrierGrsSummary.totalCount} selected carriers with a computable gene burden.`">
                                        <small>
                                            Mean carrier GRS
                                            <abbr class="pbg-score-help" title="Mean, among the current carrier selection, of each sample's sum of Burden Pathogenic Scores across carried variants in this gene. LoFTEE HC and AlphaMissense contribute; REVEL-only variants do not." aria-label="Mean carrier GRS calculation">?</abbr>
                                        </small>
                                        <strong :class="{ 'pbg-unavailable-value': carrierGrsSummary.value == null }">{{ displayMean(carrierGrsSummary.value) }}</strong>
                                    </span>
                                </div>
                            </div>
                            <p class="pbv-sub">
                                {{ matchCount }} matching / {{ variantIdentity.distinctCarriers }} total distinct carriers of this exact variant
                                · scores and private sample rows use this same selection
                            </p>
                            <div class="pbv-carrier-table">
                                <div class="pbv-carrier-table-head">
                                    <strong>Carrier sample table</strong>
                                    <span>Private BioIndex detail · 3 rows at a time</span>
                                </div>
                                <div class="pbv-carrier-table-body">
                                    <p v-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                                    <template v-else>
                                        <div class="pbg-selected-sample-table">
                                            <div class="pbg-selected-sample-head">
                                                <span>Sample</span><span>Age</span><span>Sex</span><span>GT</span><span>Co-genes</span><span>Investigator</span><span>Affected</span><span>Proband</span><span>GenDx</span>
                                            </div>
                                            <div v-for="carrier in visibleCarrierRows" :key="carrier.key" class="pbg-selected-sample-row">
                                                <a class="pbg-sample-link" :href="`/krSample.html?query=${carrier.id}`">{{ carrier.id }}</a>
                                                <span>{{ carrierAge(carrier) }}</span>
                                                <span>{{ displayCarrierValue(carrier.sex) }}</span>
                                                <span>{{ displayCarrierValue(carrier.genotype) }}</span>
                                                <span>{{ carrierCoGeneCount(carrier) }}</span>
                                                <span>{{ displayCarrierValue(carrier.investigator) }}</span>
                                                <span>{{ displayCarrierValue(carrier.affected) }}</span>
                                                <span>{{ displayCarrierValue(carrier.proband) }}</span>
                                                <span :class="{ 'pbg-gendx-conflict': carrier.gendxConflict }" :title="carrier.gendxNote || carrier.gendx || ''">{{ displayCarrierValue(carrier.gendx) }}</span>
                                            </div>
                                        </div>
                                        <div v-if="hiddenCarrierCount || showCountCarrierSamples > 3" class="pbg-show-more-row">
                                            <button v-if="hiddenCarrierCount" class="pbg-show-more-btn" type="button" @click="showMoreCarrierSamples">
                                                +3 more ({{ hiddenCarrierCount }} remaining)
                                            </button>
                                            <button v-if="showCountCarrierSamples > 3" class="pbg-show-more-btn pbg-show-less-btn" type="button" @click="showLessCarrierSamples">
                                                Show first 3
                                            </button>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <div class="pbv-result-block">
                            <h3>Co-occurrence among this variant's carriers</h3>
                            <p class="pbv-sub">Counts use the same {{ matchCount }} distinct-carrier selection shown above.</p>
                            <div class="pbv-cooccur-grid">
                                <article class="pbv-cooccur-card">
                                    <h3>Different-gene co-carriers</h3>
                                    <p class="pbv-sub">Qualifying variants carried by the current carrier selection</p>
                                    <p v-if="!hasCoGeneData" class="pbv-empty-note">Not calculated — the current API does not provide carrier-to-gene data. This does not mean zero co-carrier genes.</p>
                                    <p v-else-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                                    <p v-else-if="!cooccurGeneRows.length" class="pbv-empty-note">No different-gene co-carriers were observed among the current carrier selection.</p>
                                    <div v-else class="pbv-cooccur-table">
                                        <div class="pbv-cooccur-head"><span>Gene</span><span>Carriers</span><span>%</span><span>Note</span></div>
                                        <div v-for="row in cooccurGeneRows" :key="row.gene" class="pbv-cooccur-row">
                                            <a :href="`/pb_Gene.html?query=${row.gene}`">{{ row.gene }}</a><span>{{ row.count }} / {{ matchCount }}</span><span>{{ row.pct }}%</span><span>{{ row.note || '—' }}</span>
                                        </div>
                                    </div>
                                </article>
                                <article class="pbv-cooccur-card">
                                    <h3>Other {{ variantIdentity.gene }} variants</h3>
                                    <p class="pbv-sub">Target-variant carriers who also carry each other variant in this gene</p>
                                    <p v-if="!hasCoVariantData" class="pbv-empty-note">Unavailable — the current API response has no same-gene co-variant field.</p>
                                    <p v-else-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                                    <p v-else-if="!cooccurVariantRows.length" class="pbv-empty-note">No other {{ variantIdentity.gene }} variants were observed among the current carrier selection.</p>
                                    <div v-else class="pbv-cooccur-table">
                                        <div class="pbv-cooccur-head"><span>Variant</span><span>Carriers</span><span>%</span><span>Class.</span></div>
                                        <div v-for="row in visibleCooccurVariantRows" :key="row.id" class="pbv-cooccur-row">
                                            <a :href="`/pb_variant.html?query=${row.id}&gene=${row.gene || variantIdentity.gene}`">{{ row.id }}</a><span>{{ row.count }} / {{ matchCount }}</span><span>{{ row.pct }}%</span><span>{{ row.classification || '—' }}</span>
                                        </div>
                                        <div v-if="hiddenCooccurVariantCount || showCountCoVariants > 10" class="pbg-show-more-row">
                                            <button
                                                v-if="hiddenCooccurVariantCount"
                                                class="pbg-show-more-btn"
                                                type="button"
                                                @click="showMoreCoVariants"
                                            >
                                                +10 more ({{ hiddenCooccurVariantCount }} remaining)
                                            </button>
                                            <button
                                                v-if="showCountCoVariants > 10"
                                                class="pbg-show-more-btn pbg-show-less-btn"
                                                type="button"
                                                @click="showLessCoVariants"
                                            >
                                                Show first 10
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </div>
                    </section>
                </template>
            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import { createPbVariantState, pbVariantComputed, pbVariantMethods } from "./pageModel";
import "@/views/PbGene/style.css";
import "./style.css";

export default {
    name: "PbVariantTemplate",
    data() {
        return createPbVariantState();
    },
    computed: pbVariantComputed,
    mounted() {
        if (this.searchQuery) {
            this.loadLiveVariantData(false);
        }
    },
    methods: pbVariantMethods,
};
</script>
