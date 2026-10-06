<template>
    <div>
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
                    <div class="pbg-toolbar-right">
                        <span v-if="geneQuery" class="pbv-toolbar-gene-label">{{ geneQuery }} gene</span>
                        <a :href="geneQuery ? `/pb_Gene.html?query=${geneQuery}` : '/pb_Gene.html'" class="pbg-nav-link">
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
                    <details class="pbg-context-disclosure" open>
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
                                    <h2 id="pbv-context-title">Run HPO context <abbr class="pbv-context-help" title="Calculate the carrier mean and the exact-variant association from individual residual PheRS across the analysis cohort." aria-label="Calculate the carrier mean and the exact-variant association from individual residual PheRS across the analysis cohort.">?</abbr></h2>
                                </div>
                                <span class="pbg-context-status" :class="{ 'pbg-context-status--active': activeContextTerms.length }">
                                    {{ activeContextTerms.length ? 'Context active' : 'No context' }}
                                </span>
                            </div>
                            <form class="pbg-context-form" @submit.prevent="runVariantContext">
                                <hpo-term-input v-model="contextInput"></hpo-term-input>
                                <label class="pbv-context-option">GRS <select v-model="contextScoreTypeInput" aria-label="Gene score aggregation"><option value="max">Max</option><option value="sum">Sum</option></select></label>
                                <label class="pbv-context-option">Samples <select v-model="contextAnalysisSetInput" aria-label="Analysis samples"><option value="all">All</option><option value="affected">Affected only</option></select></label>
                                <button type="submit" :disabled="contextLoading">{{ contextLoading ? 'Calculating' : 'Go' }}</button>
                            </form>
                            <p v-if="contextError" class="pbg-context-error" role="alert">{{ contextError }}</p>
                            <p v-if="contextWarning" class="pbv-context-warning" role="status">{{ contextWarning }}</p>
                            <div v-if="contextMatch || contextAssociation" class="pbg-context-results">
                                <div class="pbg-context-result-head pbv-context-result-grid">
                                    <span>HPOs used</span><span>Match Score</span><span>Carrier coverage</span><span>Effect Score (β)</span><span>p-value</span><span>Status</span>
                                </div>
                                <div class="pbg-context-result-row pbv-context-result-grid">
                                    <span>{{ activeContextTerms.join(', ') }}</span>
                                    <strong :class="{ 'pbg-unavailable-value': !contextMatch || contextMatch.matchScore == null }">{{ contextMatch ? displayMean(contextMatch.matchScore) : 'Unavailable' }}</strong>
                                    <span>{{ contextMatch ? `${contextMatch.scoredCarrierCount || 0} / ${contextMatch.carrierCount || 0} scored` : 'Unavailable' }}</span>
                                    <strong :class="{ 'pbg-unavailable-value': !contextAssociation || contextAssociation.beta == null }" :title="`One adjusted binary-carrier effect for this exact variant, calculated from individual residual PheRS in ${coGeneAnalysisSet === 'affected' ? 'affected samples' : 'all analysis samples'}.`">{{ contextAssociation ? displayMean(contextAssociation.beta) : 'Unavailable' }}</strong>
                                    <strong :class="{ 'pbg-unavailable-value': !contextAssociation || contextAssociation.pValue == null }" title="Unadjusted p-value for this exact variant's binary-carrier effect; not a per-sample value.">{{ contextAssociation ? displayPValue(contextAssociation.pValue) : 'Unavailable' }}</strong>
                                    <span>{{ contextMatch ? contextMatch.status : contextAssociation.status }}</span>
                                </div>
                            </div>
                            <p class="pbv-context-crossref">
                                <strong>Match Score</strong> is the carrier mean in the selected analysis samples, returned only with complete carrier coverage. <strong>Effect Score and p-value</strong> use binary carrier status in {{ coGeneAnalysisSet === 'affected' ? 'affected samples' : 'the full analysis cohort' }}. GRS Max/Sum applies to the gene associations below; a single binary variant has no GRS aggregation. Carrier-statistics filters below do not recalculate these results.
                                <span v-if="contextAssociation && contextAssociation.sampleCount">{{ variantAssociationModelLabel }}: {{ contextAssociation.sampleCount.toLocaleString() }} analysis samples, {{ contextAssociation.carrierCount == null ? 'unknown' : contextAssociation.carrierCount.toLocaleString() }} modeled carriers / {{ variantIdentity.distinctCarriers.toLocaleString() }} BioIndex carriers.</span>
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
                                    <div class="pbg-selected-kv-row pbv-variant-score-row">
                                        <span>LoFTEE <small v-if="variantScoreSource === 'loftee'" class="pbv-variant-score-source">(variant score)</small></span>
                                        <strong class="pbv-evidence-value" :class="[lofteeClass(variantIdentity.loftee), { 'pbv-variant-score-highlight': variantScoreSource === 'loftee' }]">
                                            {{ variantIdentity.loftee || 'Unavailable' }}<template v-if="variantScoreSource === 'loftee'"> = {{ variantScore.toFixed(2) }}</template>
                                        </strong>
                                    </div>
                                    <div class="pbg-selected-kv-row pbv-variant-score-row">
                                        <span>AlphaMissense <small v-if="variantScoreSource === 'alphaMissense'" class="pbv-variant-score-source">(variant score)</small></span>
                                        <strong :class="{ 'pbv-variant-score-highlight': variantScoreSource === 'alphaMissense' }">{{ variantIdentity.alphaMissense || 'Unavailable' }}</strong>
                                    </div>
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
                    <div class="pbv-carrier-heading-main">
                        <h2>Carrier statistics <abbr class="pbv-context-help" title="Filter this variant's carriers. Phenotype, sample, and co-occurrence results update together." aria-label="Filter this variant's carriers. Phenotype, sample, and co-occurrence results update together.">?</abbr></h2>
                        <div class="pbv-match-block" aria-live="polite">
                            <strong class="pbv-match-number">{{ matchCount }}</strong>
                            <span class="pbv-match-label">matching / {{ variantIdentity.distinctCarriers }} total</span>
                            <button v-if="filtersActive" class="pbv-clear-filters" type="button" @click="clearFilters">Clear filters</button>
                        </div>
                    </div>
                        <div class="pbv-carrier-heading-aside">
                            <details class="pbv-notes-details">
                                <summary>Data notes</summary>
                                <div class="pbv-notes-body">
                                    <p><strong>Source:</strong> {{ liveDataSource }} via the existing PB Gene adapter.</p>
                                    <p>Carrier rows are deduplicated by sample. Age, sex, project, affected status, observed HPO terms, and other genes are joined from private sample metadata by exact carrier ID.</p>
                                    <p>Phenotype branches follow the official HPO {{ hpoVersion }} is_a hierarchy. For terms with multiple parents, one valid parent path is shown. Branch counts roll up unique carriers with observed descendants.</p>
                                    <p>Co-genes exclude the current gene and use the same samples-info gene list as the PB Gene summary. GT remains Unavailable when the API does not provide it.</p>
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
                                <p class="pbv-filter-group-label">Age at enrollment</p>
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
                                <p class="pbv-facet-note">
                                    {{ hasPhenotypeData ? 'Choose an observed HPO term or press Enter for an exact match' : sampleMetadataStatus === 'loading' ? 'Loading observed HPO terms…' : 'No observed HPO terms available' }}
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

                    <div class="pbv-recompute-connector">recomputed for the current selection</div>

                    <section class="pbv-recompute-results">
                        <div class="pbv-result-block">
                            <h3>Observed phenotypes</h3>
                            <p class="pbv-sub">
                                {{ filtersActive ? `Among ${matchCount} of ${variantIdentity.distinctCarriers} carriers matching the current filter` : `Among all ${variantIdentity.distinctCarriers} carriers of this variant` }}
                                · HPO {{ hpoVersion }} parent–child hierarchy · click ▸ to expand a branch
                            </p>
                            <p v-if="!hasPhenotypeData && sampleMetadataStatus === 'loading'" class="pbv-empty-note">Loading observed HPO terms from sample metadata…</p>
                            <p v-else-if="!hasPhenotypeData" class="pbv-empty-note">No observed HPO terms are available for these carriers.</p>
                            <p v-else-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                            <template v-else>
                                <div class="pbv-pheno-row pbv-pheno-header">
                                    <span class="pbv-pheno-toggle" aria-hidden="true"></span>
                                    <div class="pbv-bar-row pbv-bar-row--pheno">
                                        <span></span><span></span>
                                        <button type="button" @click="sortTableColumn('phenotypes', 'count')">Count (%) <i>{{ tableSortIndicator('phenotypes', 'count') }}</i></button>
                                    </div>
                                </div>
                                <div v-for="row in visiblePhenotypeRows" :key="row.key">
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
                                        <div v-for="term in visiblePhenotypeTerms(row)" :key="term.key" class="pbv-bar-row pbv-bar-row--nested">
                                            <span class="pbv-hpo-node-label" :style="{ paddingLeft: `${Math.min(term.depth - 1, 7) * 0.85}rem` }">
                                                <button v-if="term.hasChildren" class="pbv-pheno-toggle" type="button"
                                                        :aria-label="`${expandedPhenotypeNodes.includes(term.id) ? 'Collapse' : 'Expand'} ${term.label}`"
                                                        :aria-expanded="expandedPhenotypeNodes.includes(term.id) ? 'true' : 'false'"
                                                        @click="togglePhenotypeNode(term.id)">{{ expandedPhenotypeNodes.includes(term.id) ? '▾' : '▸' }}</button>
                                                <span v-else class="pbv-hpo-leaf-marker">·</span>
                                                <span>{{ term.label }}<template v-if="term.id"> [{{ term.id }}]</template></span>
                                            </span>
                                            <div class="pbv-bar-track"><div class="pbv-bar-fill" :style="{ width: `${term.pct}%` }"></div></div>
                                            <strong>{{ term.count }} ({{ term.pct }}%)</strong>
                                        </div>
                                    </div>
                                </div>
                                <SummaryPager class="pbv-result-pagination" :page="resultPages.phenotypes" :total-pages="phenotypePageCount"
                                              label="Observed phenotype pages" input-id="pb-variant-phenotype-page"
                                              @change="setResultPage('phenotypes', $event)" />
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
                                · private sample rows use this selection
                            </p>
                            <p class="pbv-sample-score-note">
                                rPheRS is individual for each carrier under the selected HPO Context.
                                <span v-if="contextMatch && coGeneAnalysisSet === 'affected'">Only affected analysis samples receive a score in this run.</span>
                                <span v-if="contextMatch && !Object.keys(contextResidualById).length">This Context API has not returned individual residual PheRS values.</span>
                            </p>
                            <div class="pbv-carrier-table">
                                <div class="pbv-carrier-table-head">
                                    <strong>Carrier sample table</strong>
                                        <span>
                                            Private BioIndex detail
                                            <template v-if="sampleMetadataStatus === 'loading'"> · loading sample metadata {{ sampleMetadataCompleted }}/{{ carrierRecords.length }}</template>
                                            <template v-else-if="sampleMetadataStatus === 'ready' || sampleMetadataStatus === 'partial'"> · metadata matched {{ sampleMetadataMatched }}/{{ carrierRecords.length }}</template>
                                        </span>
                                </div>
                                <div class="pbv-carrier-table-body">
                                    <p v-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                                    <template v-else>
                                        <div class="pbg-selected-sample-table">
                                            <div class="pbg-selected-sample-head">
                                                <span><button type="button" @click="sortTableColumn('carriers', 'sample')">Sample <i>{{ tableSortIndicator('carriers', 'sample') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'age')">Age <i>{{ tableSortIndicator('carriers', 'age') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'sex')">Sex <i>{{ tableSortIndicator('carriers', 'sex') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'gt')">GT <i>{{ tableSortIndicator('carriers', 'gt') }}</i></button></span>
                                                <span class="pbv-rphers-head">
                                                    <button type="button" @click="sortTableColumn('carriers', 'residual')">rPheRS <i>{{ tableSortIndicator('carriers', 'residual') }}</i></button>
                                                    <abbr class="pbg-score-help" tabindex="0" title="Residual Phenotype Risk Score: this sample's score for the selected HPO Context after adjusting for its total number of recorded HPO terms. It can be negative. The Match Score above is the mean rPheRS among carriers." aria-label="What is rPheRS?">?</abbr>
                                                </span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'affected')">Affected <i>{{ tableSortIndicator('carriers', 'affected') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'project')">Project <i>{{ tableSortIndicator('carriers', 'project') }}</i></button></span>
                                            </div>
                                            <div v-for="carrier in visibleCarrierRows" :key="carrier.key" class="pbg-selected-sample-row">
                                                <a class="pbg-sample-link" :href="`/pb_sample.html?query=${encodeURIComponent(carrier.id)}`">{{ carrier.id }}</a>
                                                <span>{{ carrierAge(carrier) }}</span>
                                                <span>{{ carrierMetadataField(carrier, 'sex') }}</span>
                                                <span>{{ displayCarrierValue(carrier.genotype) }}</span>
                                                <span :title="contextMatch ? 'Individual residual PheRS for the selected HPO context; unavailable if this sample is outside the analysis roster.' : 'Run HPO Context to request matching.'">{{ carrierResidualScore(carrier) }}</span>
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

                        <div class="pbv-result-block">
                            <h3>Co-occurrence among this variant's carriers</h3>
                            <p class="pbv-sub">Counts use the same {{ matchCount }} distinct-carrier selection shown above.</p>
                            <div class="pbv-cooccur-grid">
                                <article class="pbv-cooccur-card">
                                    <h3>Different-gene co-carriers <abbr class="pbv-context-help" :title="`Gene scores use ${coGeneAnalysisSet === 'affected' ? 'affected CRDC samples' : 'the full CRDC cohort'} and the selected HPO context. Carrier overlap uses the current filters.`" :aria-label="`Gene scores use ${coGeneAnalysisSet === 'affected' ? 'affected CRDC samples' : 'the full CRDC cohort'} and the selected HPO context. Carrier overlap uses the current filters.`">?</abbr></h3>
                                    <p v-if="coGeneAssociationStatus === 'error'" class="pbv-empty-note">Gene associations unavailable: {{ coGeneAssociationError }}</p>
                                    <p v-else-if="coGeneAssociationStatus === 'ready'" class="pbv-sub">{{ coGeneAssociationSummary.nTests }} genes tested · Benjamini–Hochberg FDR across the target gene and all different-gene co-carriers.</p>
                                    <p v-if="!hasCoGeneData && sampleMetadataStatus === 'loading'" class="pbv-empty-note">Loading sample gene lists…</p>
                                    <p v-else-if="!hasCoGeneData" class="pbv-empty-note">Not calculated — sample gene lists are unavailable.</p>
                                    <p v-else-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                                    <div v-else class="pbv-cooccur-table pbv-cooccur-table--genes">
                                        <div class="pbv-cooccur-head">
                                            <span><button type="button" @click="sortTableColumn('coGenes', 'gene')">Gene <i>{{ tableSortIndicator('coGenes', 'gene') }}</i></button></span>
                                            <span title="Shared carriers / selected target-variant carriers (overlap percentage)."><button type="button" @click="sortTableColumn('coGenes', 'count')">Carriers <i>{{ tableSortIndicator('coGenes', 'count') }}</i></button></span>
                                            <span title="Full-cohort LM effect per unit of selected gene score."><button type="button" @click="sortTableColumn('coGenes', 'beta')">β <i>{{ tableSortIndicator('coGenes', 'beta') }}</i></button></span>
                                            <span><button type="button" @click="sortTableColumn('coGenes', 'pValue')">p-value <i>{{ tableSortIndicator('coGenes', 'pValue') }}</i></button></span>
                                            <span title="Benjamini–Hochberg adjusted p-value across the target gene and all unfiltered co-genes."><button type="button" @click="sortTableColumn('coGenes', 'fdr')">FDR <i>{{ tableSortIndicator('coGenes', 'fdr') }}</i></button></span>
                                        </div>
                                        <div class="pbv-cooccur-row pbv-cooccur-row--target">
                                            <span><a :href="`/pb_Gene.html?query=${variantIdentity.gene}`">{{ variantIdentity.gene }}</a> <small>Target gene</small></span>
                                            <span>{{ matchCount }} / {{ matchCount }} (100%)</span>
                                            <span>{{ geneAssociationCell(variantIdentity.gene, 'beta') }}</span>
                                            <span>{{ geneAssociationCell(variantIdentity.gene, 'p_value') }}</span>
                                            <span>{{ geneAssociationCell(variantIdentity.gene, 'fdr') }}</span>
                                        </div>
                                        <div v-for="row in visibleCooccurGeneRows" :key="row.gene" class="pbv-cooccur-row">
                                            <a :href="`/pb_Gene.html?query=${row.gene}`">{{ row.gene }}</a><span>{{ row.count }} / {{ matchCount }} ({{ row.pct }}%)</span><span>{{ geneAssociationCell(row.gene, 'beta') }}</span><span>{{ geneAssociationCell(row.gene, 'p_value') }}</span><span>{{ geneAssociationCell(row.gene, 'fdr') }}</span>
                                        </div>
                                        <p v-if="!cooccurGeneRows.length" class="pbv-empty-note">No different-gene co-carriers in the current selection.</p>
                                        <SummaryPager class="pbv-result-pagination" :page="resultPages.coGenes" :total-pages="coGenePageCount"
                                                      label="Different-gene co-carrier pages" input-id="pb-variant-cogene-page"
                                                      @change="setResultPage('coGenes', $event)" />
                                    </div>
                                </article>
                                <article class="pbv-cooccur-card">
                                    <h3>Other {{ variantIdentity.gene }} variants <abbr class="pbv-context-help" title="Target-variant carriers who also carry each other variant in this gene." aria-label="Target-variant carriers who also carry each other variant in this gene.">?</abbr></h3>
                                    <p v-if="!hasCoVariantData" class="pbv-empty-note">Unavailable — the current API response has no same-gene co-variant field.</p>
                                    <p v-else-if="!matchCount" class="pbv-empty-note">No carriers match the current filter combination.</p>
                                    <p v-else-if="!cooccurVariantRows.length" class="pbv-empty-note">No other {{ variantIdentity.gene }} variants were observed among the current carrier selection.</p>
                                    <div v-else class="pbv-cooccur-table pbv-cooccur-table--variants">
                                        <div class="pbv-cooccur-head">
                                            <span><button type="button" @click="sortTableColumn('coVariants', 'id')">Variant <i>{{ tableSortIndicator('coVariants', 'id') }}</i></button></span>
                                            <span title="Carriers shared with the selected target variant, out of all selected target-variant carriers. The percentage uses the same denominator."><button type="button" @click="sortTableColumn('coVariants', 'count')">Carriers <i>{{ tableSortIndicator('coVariants', 'count') }}</i></button></span>
                                            <span title="LoFTEE HC = 1; otherwise AlphaMissense when available."><button type="button" @click="sortTableColumn('coVariants', 'variantScore')">Variant Score <i>{{ tableSortIndicator('coVariants', 'variantScore') }}</i></button></span>
                                            <span><button type="button" @click="sortTableColumn('coVariants', 'clinvar')">ClinVar <i>{{ tableSortIndicator('coVariants', 'clinvar') }}</i></button></span>
                                        </div>
                                        <div v-for="row in visibleCooccurVariantRows" :key="row.id" class="pbv-cooccur-row">
                                            <a :href="`/pb_variant.html?query=${row.id}&gene=${row.gene || variantIdentity.gene}`">{{ row.id }}</a><span>{{ row.count }} / {{ matchCount }} ({{ row.pct }}%)</span><span>{{ row.variantScore == null ? 'Unavailable' : String(row.variantScore) }}</span><span :title="row.clinvar || 'Unavailable'">{{ row.clinvar || 'Unavailable' }}</span>
                                        </div>
                                        <SummaryPager class="pbv-result-pagination" :page="resultPages.coVariants" :total-pages="coVariantPageCount"
                                                      label="Other same-gene variant pages" input-id="pb-variant-covariant-page"
                                                      @change="setResultPage('coVariants', $event)" />
                                    </div>
                                </article>
                            </div>
                        </div>
                    </section>
                </template>
            </div>
        </div>

    </div>
</template>

<script>
import { createPbVariantState, pbVariantComputed, pbVariantMethods } from "./pageModel";
import HpoTermInput from "@/views/PbGene/HpoTermInput";
import SummaryPager from "@/views/PbGene/SummaryPager";
import "@/views/PbGene/style.css";
import "./style.css";

export default {
    name: "PbVariantTemplate",
    components: { HpoTermInput, SummaryPager },
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
