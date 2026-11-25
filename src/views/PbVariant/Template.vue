<template>
    <div class="pb-guide-page">
        <portal-guide section="variant" />
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
                                    {{ clinvarDisplayLabel(variantIdentity.classification) }}
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
                                        >{{ clinvarDisplayLabel(variantIdentity.clinvar) }} ↗</a>
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

                    <section class="pbv-card pg2-card pbv-carrier-information" :data-genotype="selectedGenotypeSegment" aria-labelledby="pbv-crdc-carriers-title">
                    <section class="pbv-crdc-carriers" aria-labelledby="pbv-crdc-carriers-title">
                        <div class="pbv-section-heading pbv-crdc-heading">
                            <h2 id="pbv-crdc-carriers-title"><strong class="pbv-crdc-count">{{ genotypeCarrierCount.toLocaleString() }}</strong> {{ genotypeCarrierCount === 1 ? 'carrier' : 'carriers' }} observed in CRDC <help-tooltip label="About observed CRDC carriers" :text="help.carrierSummary" /></h2>
                            <div class="pbv-crdc-selection">
                                <span class="pbv-genotype-caption">Genotype</span>
                                <div class="pbv-genotype-segments" role="group" aria-label="Carrier genotype">
                                    <button v-for="option in genotypeSegments" :key="option.value" type="button" :aria-pressed="String(selectedGenotypeSegment === option.value)" :class="{ 'is-selected': selectedGenotypeSegment === option.value }" @click="selectGenotypeSegment(option.value)">
                                        <span class="pbv-genotype-segment-label">{{ option.label }}</span>
                                        <span class="pbv-genotype-segment-count">{{ option.count.toLocaleString() }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p v-if="genotypeLookupFailed" class="pbv-genotype-hint" role="alert">GT lookup unavailable. Check the genotype service.</p>
                        <div class="pbv-crdc-overview">
                            <carrier-demographics :summary="carrierDemographicSummary" :carrier-count="genotypeCarrierCount" :scope="variantIdentity.canonicalId + ':' + genotypeSelection.join(',')" compact inline-project-search numbered-project-pager />
                        </div>
                    </section>

                    <hr class="pbv-carrier-divider">
                    <section class="pbv-workspace" :class="{ 'pbv-single-phenotype-carrier': phenotypeCarrierSelection.present.length <= 1 }">
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
                                    <span v-for="token in filters.phenotype" :key="token" class="pbv-selected-chip pbv-phenotype-filter-chip">
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
                            <p v-if="!hasPhenotypeData && sampleMetadataStatus === 'loading'" class="pbv-empty-note">Loading observed HPO terms from sample metadata…</p>
                            <p v-else-if="!hasPhenotypeData" class="pbv-empty-note">No observed HPO terms are available for these carriers.</p>
                            <p v-else-if="!phenotypeCarrierSelection.present.length" class="pbv-empty-note">No recorded phenotype data are available for the current carrier selection.</p>
                            <template v-else>
                                <div class="pbv-pheno-header">
                                    <span>Observed phenotypes among carriers with phenotype data <help-tooltip label="About observed phenotypes" :text="observedPhenotypesHelp + ' Bar colour indicates hierarchy depth. Purple Filter highlights identify Carrier phenotypes selections. Parent counts include descendants and must not be added together.'" /></span>
                                    <button type="button" @click="sortTableColumn('phenotypes', 'count')">{{ phenotypeCarrierSelection.present.length > 1 ? 'Carriers / with data (%)' : 'Carriers / with data' }} <i>{{ tableSortIndicator('phenotypes', 'count') }}</i></button>
                                </div>
                                <div class="pbv-phenotype-root" :class="phenotypeTreeClass('HP:0000118')">
                                    <button class="pbv-phenotype-name" type="button" :aria-expanded="String(phenotypeRootExpanded)" @click="phenotypeRootExpanded = !phenotypeRootExpanded"><b-icon-chevron-down v-if="phenotypeRootExpanded" aria-hidden="true" /><b-icon-chevron-right v-else aria-hidden="true" />Phenotypic abnormality</button>
                                    <small><a class="pbv-hpo-link" :href="phenotypeHref('HP:0000118')" @click.stop>HP:0000118</a></small>
                                </div>
                                <div v-for="(row, rowIndex) in phenotypeRootExpanded ? visiblePhenotypeRows : []" :key="row.key" class="pbv-pheno-branch" :class="{ 'is-expanded': expandedCategories.includes(row.key), 'is-last-branch': rowIndex === visiblePhenotypeRows.length - 1 }">
                                    <div class="pbv-pheno-row" :class="phenotypeTreeClass(row.id)">
                                        <button class="pbv-pheno-toggle" type="button" :aria-label="`${expandedCategories.includes(row.key) ? 'Collapse' : 'Expand'} ${row.label}`" :aria-expanded="expandedCategories.includes(row.key) ? 'true' : 'false'" @click="toggleCategory(row.key)">
                                            {{ expandedCategories.includes(row.key) ? '▾' : '▸' }}
                                        </button>
                                        <div class="pbv-bar-row pbv-bar-row--pheno" style="flex:1;margin-bottom:0;">
                                            <span><button class="pbv-phenotype-name" type="button" :aria-expanded="String(expandedCategories.includes(row.key))" @click="toggleCategory(row.key)">{{ row.label }}</button><span v-if="phenotypeFilterClass(row.id) === 'is-filter-term'" class="pbv-filter-node-tag">Filter</span><a v-if="row.id" class="pbv-hp-code pbv-hpo-link" :href="phenotypeHref(row.id)" @click.stop>{{ row.id }}</a></span>
                                            <div class="pbv-bar-track"><div class="pbv-bar-fill" :style="{ width: `${row.pct}%`, backgroundColor: phenotypeDepthColor(0) }"></div></div>
                                            <strong>{{ row.count }} / {{ phenotypeCarrierSelection.present.length }}<template v-if="phenotypeCarrierSelection.present.length > 1"> ({{ row.pct }}%)</template></strong>
                                        </div>
                                    </div>
                                    <div v-if="expandedCategories.includes(row.key)" class="pbv-pheno-terms">
                                        <div v-for="term in visiblePhenotypeTerms(row)" :key="term.key" class="pbv-bar-row pbv-bar-row--nested" :class="phenotypeTreeClass(term.id)" :style="{ '--pbv-tree-depth': term.depth }">
                                            <span class="pbv-hpo-node-label">
                                                <span v-for="(guide, index) in term.treeGuides" :key="index" class="pbv-tree-guide"
                                                      :class="{ 'is-elbow': guide.elbow, 'is-last': guide.last, 'is-continuing': guide.continuing }" aria-hidden="true"></span>
                                                <button v-if="term.hasChildren" class="pbv-pheno-toggle" type="button"
                                                        :aria-label="`${expandedPhenotypeNodes.includes(term.id) ? 'Collapse' : 'Expand'} ${term.label}`"
                                                        :aria-expanded="expandedPhenotypeNodes.includes(term.id) ? 'true' : 'false'"
                                                        @click="togglePhenotypeNode(term.id)">{{ expandedPhenotypeNodes.includes(term.id) ? '▾' : '▸' }}</button>
                                                <span v-else class="pbv-hpo-leaf-marker">·</span>
                                                <span><button v-if="term.hasChildren" class="pbv-phenotype-name" type="button" :aria-expanded="String(expandedPhenotypeNodes.includes(term.id))" @click="togglePhenotypeNode(term.id)">{{ term.label }}</button><template v-else>{{ term.label }}</template><template v-if="term.id"> [<a class="pbv-hpo-link" :href="phenotypeHref(term.id)" @click.stop>{{ term.id }}</a>]</template><span v-if="phenotypeFilterClass(term.id) === 'is-filter-term'" class="pbv-filter-node-tag">Filter</span></span>
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

                    </section>

                    </section>

                    <section class="pbv-card pg2-card pbv-profile pbv-carrier-samples" aria-labelledby="pbv-context-title">
                        <div class="pbv-section-heading pbv-carrier-samples-heading">
                            <h2 id="pbv-context-title">{{ genotypeCarrierCount.toLocaleString() }} {{ genotypeCarrierCount === 1 ? 'carrier sample' : 'carrier samples' }}</h2><span class="pbv-internal-tag">Internal only</span>
                            <div ref="carrierSamplesTabs" class="pbv-carrier-sample-tabs" role="tablist" aria-label="Carrier sample views" @keydown="handleCarrierSamplesTabKeydown">
                                <button id="pbv-carrier-details-tab" type="button" role="tab" :aria-selected="String(carrierSamplesTab === 'carriers')" :tabindex="carrierSamplesTab === 'carriers' ? 0 : -1" aria-controls="pbv-all-carrier-details" @click="carrierSamplesTab = 'carriers'">Carrier details</button>
                                <button id="pbv-phenotype-profile-tab" type="button" role="tab" :aria-selected="String(carrierSamplesTab === 'profile')" :tabindex="carrierSamplesTab === 'profile' ? 0 : -1" aria-controls="pbv-phenotype-profile-panel" @click="carrierSamplesTab = 'profile'">Phenotype profile</button>
                            </div>
                        </div>
                        <div v-show="carrierSamplesTab === 'carriers'" id="pbv-all-carrier-details" class="pbv-all-carrier-details" role="tabpanel" aria-labelledby="pbv-carrier-details-tab" tabindex="0">
                            <p class="pbv-all-carrier-caption">All carriers in the current genotype selection, including samples without phenotype scores.</p>
                            <p v-if="sampleMetadataStatus === 'loading'" class="pbv-all-carrier-caption" role="status">Loading sample details…</p>
                            <p v-if="!genotypeCarrierCount" class="pbv-empty-note">No carriers match the genotype selection.</p>
                            <template v-else>
                                <div class="pbv-all-carrier-scroll">
                                    <table class="pbv-all-carrier-table" aria-label="All carrier sample details">
                                        <thead><tr>
                                            <th scope="col"><button type="button" @click="sortTableColumn('allCarriers', 'sample')">Sample <i>{{ tableSortIndicator('allCarriers', 'sample') }}</i></button></th>
                                            <th scope="col"><button type="button" @click="sortTableColumn('allCarriers', 'age')">Age <i>{{ tableSortIndicator('allCarriers', 'age') }}</i></button></th>
                                            <th scope="col"><button type="button" @click="sortTableColumn('allCarriers', 'sex')">Sex <i>{{ tableSortIndicator('allCarriers', 'sex') }}</i></button></th>
                                            <th scope="col"><button type="button" @click="sortTableColumn('allCarriers', 'gt')">GT <i>{{ tableSortIndicator('allCarriers', 'gt') }}</i></button> <help-tooltip label="All carrier genotype source" :text="genotypeSourceHelp" /></th>
                                            <th scope="col"><button type="button" @click="sortTableColumn('allCarriers', 'hpoCount')">Total HPO terms <i>{{ tableSortIndicator('allCarriers', 'hpoCount') }}</i></button> <help-tooltip label="All carrier total HPO terms" text="Parent-expanded HPO count from the scoring input matrix. Known empty phenotype records display 0; unavailable counts remain unavailable. This count does not require a phenotype profile or establish scoring eligibility." /></th>
                                            <th scope="col"><button type="button" @click="sortTableColumn('allCarriers', 'affected')">Affected <i>{{ tableSortIndicator('allCarriers', 'affected') }}</i></button></th>
                                            <th scope="col"><button type="button" @click="sortTableColumn('allCarriers', 'project')">Project <i>{{ tableSortIndicator('allCarriers', 'project') }}</i></button></th>
                                        </tr></thead>
                                        <tbody><tr v-for="carrier in visibleAllCarrierRows" :key="carrier.key">
                                            <td><a class="pbg-sample-link" :href="`/pb_sample.html?query=${encodeURIComponent(carrier.id)}`">{{ carrier.id }}</a></td>
                                            <td>{{ carrierAge(carrier) }}</td>
                                            <td>{{ carrierMetadataField(carrier, 'sex') }}</td>
                                            <td>{{ displayCarrierValue(carrier.genotype) }}</td>
                                            <td>{{ carrierHpoCount(carrier) }}</td>
                                            <td>{{ carrierMetadataField(carrier, 'affected') }}</td>
                                            <td>{{ carrierMetadataField(carrier, 'project') }}</td>
                                        </tr></tbody>
                                    </table>
                                </div>
                                <SummaryPager v-if="allCarrierPageCount > 1" class="pbv-result-pagination" :page="resultPages.allCarriers" :total-pages="allCarrierPageCount"
                                              label="All carrier sample pages" input-id="pb-variant-all-carrier-page"
                                              @change="setResultPage('allCarriers', $event)" />
                            </template>
                        </div>
                        <div v-show="carrierSamplesTab === 'profile'" id="pbv-phenotype-profile-panel" role="tabpanel" aria-labelledby="pbv-phenotype-profile-tab" tabindex="0">
                        <div class="pbv-profile-methods-row"><span class="pbv-methods"><help-tooltip label="Phenotype profile methods" :text="profileMethods" /> Methods</span></div>
                        <form class="pbv-profile-form" @submit.prevent="applyVariantProfile">
                            <label id="pg2-profile-input-label" class="pbv-profile-label">Phenotype profile</label>
                            <hpo-term-input ref="profile" v-model="contextInput" link-hpo-ids />
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
                        <p v-if="variantAssociationReason(contextAssociation)" class="pbv-context-warning" role="status">{{ variantAssociationReason(contextAssociation) }}</p>
                        <div class="pbv-profile-results-scroll">
                            <table class="pbv-profile-results" aria-label="Phenotype profile results">
                                <colgroup><col class="pbv-profile-expand-col"><col class="pbv-profile-name-col"><col><col><col><col><col class="pbv-profile-settings-col"><col class="pbv-profile-expand-col"></colgroup>
                                <thead><tr>
                                    <th><span class="pbv-sr-only">Expand samples</span></th>
                                    <th>Phenotype profile</th>
                                    <th>Carriers with<br>profile HPO <help-tooltip label="About carriers with profile HPO" :text="variantHpoCountTitle" /></th>
                                    <th>Mean carrier<br>rPheRS Z <help-tooltip label="About mean carrier rPheRS Z" :text="help.meanZ" /></th>
                                    <th>β (rPheRS SD) <help-tooltip label="About variant beta" :text="help.variantBeta" /></th>
                                    <th>P <help-tooltip label="About variant P-value" :text="help.variantP" /></th>
                                    <th>Settings <help-tooltip label="Applied analysis details" :text="profileSettingsHelp" /></th>
                                    <th><span class="pbv-sr-only">Delete result</span></th>
                                </tr></thead>
                                <tbody v-for="run in profileRuns" :key="run.id">
                                    <tr class="pbv-profile-result-row" :class="{ 'is-expanded': expandedProfileRunId === run.id }">
                                        <td><button type="button" class="pbv-profile-expand" :aria-label="'Carrier samples for ' + run.label" :aria-expanded="String(expandedProfileRunId === run.id)" :aria-controls="'pbv-carrier-sample-details-' + run.id" @click="toggleProfileSamples(run)"><b-icon-chevron-down v-if="expandedProfileRunId === run.id" aria-hidden="true" /><b-icon-chevron-right v-else aria-hidden="true" /></button></td>
                                        <td><div class="pbv-result-terms"><span v-for="id in run.terms" :key="id" class="pbv-result-term">{{ profileTermLabel(id) }} <a :href="phenotypeHref(id)">{{ id }}</a></span></div><help-tooltip v-if="run.warning" label="Profile analysis warning" :text="run.warning" /></td>
                                        <td>{{ profileHpoCountDisplay(run) }}</td>
                                        <td>{{ run.match ? displayMeanZ(run.match.matchScore) : 'Unavailable' }}</td>
                                        <td>{{ variantAssociationDisplay(run.association, 'beta') }} <help-tooltip v-if="variantAssociationReason(run.association)" label="Why beta and P are not estimable" :text="variantAssociationReason(run.association)" /></td>
                                        <td>{{ variantAssociationDisplay(run.association, 'pValue') }}</td>
                                        <td class="pbv-profile-result-settings">{{ run.genotypeLabel || 'All' }} genotypes · {{ run.analysisSet === 'affected' ? 'Affected only' : 'All samples' }} · {{ run.scoreType === 'sum' ? 'Sum' : 'Max' }} <help-tooltip label="Profile analysis details" :text="run.analysisDetails" /><button type="button" class="pbv-profile-action" :disabled="contextLoading || searchLoading" :aria-label="'Re-run ' + run.label" title="Re-run" @click="rerunVariantProfile(run)"><b-icon-arrow-clockwise aria-hidden="true" /></button></td>
                                        <td><button type="button" class="pbv-profile-action" :disabled="contextLoading || searchLoading" :aria-label="'Delete result for ' + run.label" title="Delete result" @click="deleteVariantProfile(run)"><b-icon-x aria-hidden="true" /></button></td>
                                    </tr>
                                    <tr v-if="expandedProfileRunId === run.id" class="pbv-profile-detail-row"><td colspan="8" class="pbv-profile-detail-cell">
                        <div v-if="expandedProfileRunId === run.id" :id="'pbv-carrier-sample-details-' + run.id" class="pbv-carrier-sample-details" role="region" aria-label="Individual carrier samples">
                            <p class="pbv-profile-samples-caption"><strong>Carrier samples for this profile</strong> · {{ profileScoredCarriers.length }} scored carriers<template v-if="tableSort.carriers.key === 'residual' && tableSort.carriers.dir === 'desc'"> · rPheRS Z, highest first</template></p>
                            <div class="pbv-carrier-table" role="region" aria-label="Carrier sample table">
                                <div class="pbv-carrier-table-body">
                                    <p v-if="!profileScoredCarriers.length" class="pbv-empty-note">No individual carrier scores are available for this profile.</p>
                                    <template v-else>
                                        <div class="pbg-selected-sample-table">
                                            <div class="pbg-selected-sample-head">
                                                <span><button type="button" @click="sortTableColumn('carriers', 'sample')">Sample <i>{{ tableSortIndicator('carriers', 'sample') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'age')">Age <i>{{ tableSortIndicator('carriers', 'age') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'sex')">Sex <i>{{ tableSortIndicator('carriers', 'sex') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'gt')">GT <i>{{ tableSortIndicator('carriers', 'gt') }}</i></button> <help-tooltip label="Carrier genotype source" :text="genotypeSourceHelp" /></span>
                                                <span class="pbv-rphers-head">
                                                    <button type="button" @click="sortTableColumn('carriers', 'residual')">rPheRS Z-score <i>{{ tableSortIndicator('carriers', 'residual') }}</i></button>
                                                    <help-tooltip label="What is an rPheRS Z-score?" :text="help.individualZ" />
                                                </span>
                                                <span>Profile terms matched <help-tooltip label="About matched profile terms" text="Number of input profile terms recorded in this carrier’s HPO hierarchy. This is distinct from scoring eligibility and total HPO terms." /></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'hpoCount')">Total HPO terms <i>{{ tableSortIndicator('carriers', 'hpoCount') }}</i></button> <help-tooltip label="About total HPO terms" text="The n_terms value used by residual PheRS: the row sum of the parent-expanded binary HPO input matrix, independent of the applied profile. A known empty phenotype record is shown as 0 even when the sample is outside the scoring matrix. Unknown counts remain unavailable; 0 does not establish scoring eligibility." /></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'affected')">Affected <i>{{ tableSortIndicator('carriers', 'affected') }}</i></button></span>
                                                <span><button type="button" @click="sortTableColumn('carriers', 'project')">Project <i>{{ tableSortIndicator('carriers', 'project') }}</i></button></span>
                                            </div>
                                            <div v-for="carrier in visibleCarrierRows" :key="carrier.key" class="pbg-selected-sample-row">
                                                <a class="pbg-sample-link" :href="`/pb_sample.html?query=${encodeURIComponent(carrier.id)}`">{{ carrier.id }}</a>
                                                <span>{{ carrierAge(carrier) }}</span>
                                                <span>{{ carrierMetadataField(carrier, 'sex') }}</span>
                                                <span>{{ displayCarrierValue(carrier.genotype) }}</span>
                                                <span :title="contextMatch ? 'Individual rPheRS Z-score for the selected HPO context; unavailable if this sample is outside the analysis roster or reference scores are unavailable.' : 'Test a phenotype profile to request matching.'">{{ displayMean(expandedProfileResiduals[String(carrier.id).toLowerCase()]) }}</span>
                                                <span>{{ profileTermsMatched(carrier, run) }}</span>
                                                <span>{{ carrierHpoCount(carrier) }}</span>
                                                <span>{{ carrierMetadataField(carrier, 'affected') }}</span>
                                                <span :title="carrierMetadataField(carrier, 'project')">{{ carrierMetadataField(carrier, 'project') }}</span>
                                            </div>
                                        </div>
                                        <p class="pbv-profile-samples-note">{{ genotypeCarrierCount - profileScoredCarriers.length }} carriers without an available score are not listed. Scores depend on HPO data, analysis eligibility and the scoring reference.</p>
                                        <SummaryPager class="pbv-result-pagination" :page="resultPages.carriers" :total-pages="carrierPageCount"
                                                      label="Carrier sample pages" input-id="pb-variant-carrier-page"
                                                      @change="setResultPage('carriers', $event)" />
                                    </template>
                                </div>
                            </div>
                        </div>

                                    </td></tr>
                                </tbody>
                                <tbody v-if="!profileRuns.length"><tr><td colspan="8" class="pbv-profile-prompt">{{ contextLoading ? 'Calculating phenotype profile…' : 'Add a phenotype profile and select Apply.' }}</td></tr></tbody>
                            </table>
                        </div>
                        </div>
                    </section>


                </template>
                <info-rail @reserve="infoReserved = $event" />
            </div>
        </div>

    </div>
</template>

<script>
import PortalGuide from "@/components/pb/PortalGuide.vue";
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
    components: { PortalGuide, HpoTermInput, SummaryPager, HelpTooltip, InfoRail, CarrierDemographics },
    data() {
        return { ...createPbVariantState(), ...layoutHelp, infoReserved: false, phenotypeRootExpanded: true, help, sources: VARIANT_ANNOTATION_SOURCES };
    },
    computed: pbVariantComputed,
    watch: {
        variantHpoCountKey: {immediate: true, handler: 'loadVariantHpoCounts'},
        carrierPhenotypeRevealKey: {immediate: true, handler() { this.revealFilteredPhenotypes(); }},
    },
    beforeDestroy() { this.variantHpoRevision++; },
    mounted() {
        if (this.searchQuery) {
            this.loadLiveVariantData(false);
        }
    },
    methods: pbVariantMethods,
};
</script>
