<template>
    <div class="factor-base-reveal">
        <div class="card mdkp-card" style="margin: 0 0 50px 0;">
            <div class="card-body" style="display:flex; flex-direction: column; gap:30px">
                <div style="display:flex; gap:20px">
                    <div><img src="https://hugeampkpncms.org/sites/default/files/users/user32/kc_icons/kc_reveal.png" style="height:100px"/></div>
                    <div style="display:flex; flex-direction: column;">
                        <div style="font-size: 2em; font-weight: bold;">CFDE REVEAL</div>
                        <div style="font-size: 1.5em; font-weight: bold;">Tell us what you're researching. We'll surface candidate genes and mechanisms you may not have considered.</div>
                        <div style="font-size: 1.2em;">All results are grounded in <a role="button" @click="showByorTab()">computational analyses of biological data</a>. An LLM is used to find, filter, and interpret findings in the context of your research.</div>
                    </div>
                </div>

                <div class="d-flex flex-column gap-2">
                    <div class="d-flex justify-content-end align-items-center">
                        <div
                            class="reveal-hypothesis-mode-toggle small"
                            title="Strict: graph-grounded “say no” rules. Relaxed: best-effort mechanisms with explicit gap warnings (entities still limited to the retrieved CSV)."
                        >
                            <span
                                class="reveal-mode-label reveal-mode-label-strict"
                                :class="hypothesisGenerationMode === 'strict' ? 'font-weight-bold text-dark' : 'text-muted'"
                            >Strict</span>
                            <!-- Slot reserves space: B-V switch draws ::before with left: ~-2.25rem over the control’s left edge. -->
                            <div class="reveal-switch-slot">
                                <b-form-checkbox
                                    v-model="hypothesisModeRelaxedSwitch"
                                    switch
                                    class="reveal-mode-switch mb-0"
                                    aria-label="Toggle relaxed exploratory hypothesis mode"
                                />
                            </div>
                            <span
                                class="reveal-mode-label reveal-mode-label-relaxed"
                                :class="hypothesisGenerationMode === 'relaxed' ? 'font-weight-bold text-dark' : 'text-muted'"
                            >Relaxed</span>
                        </div>
                    </div>
                    <div class="d-flex gap-2" style="position: relative;">
                        <input
                            type="text"
                            class="form-control"
                            ref="queryInput"
                            v-model="userQuery"
                            :placeholder="searchInputPlaceholder"
                            @focus="onQueryInputFocus"
                            @blur="onQueryInputBlur"
                            @input="onQueryInput"
                            @keydown.enter.prevent="queryParse()"
                            style="padding: 10px 150px 10px 10px; font-size: 11pt; height: auto;"
                        />
                        <button class="btn btn-cfde" style="min-width: 120px; position: absolute; right: 10px; top: 50%; transform: translateY(-50%);" @click="queryParse()">Reveal</button>
                    </div>
                    <div class="query-guidelines-panel">
                        <button
                            type="button"
                            class="query-guidelines-toggle btn btn-link w-100 d-flex align-items-center text-decoration-none text-right"
                            :aria-expanded="queryGuidelinesExpanded ? 'true' : 'false'"
                            aria-controls="query-guidelines-content"
                            id="query-guidelines-label"
                            @click="queryGuidelinesExpanded = !queryGuidelinesExpanded"
                        >
                            <span>How to build your query</span>
                        </button>
                        <div
                            v-show="queryGuidelinesExpanded"
                            id="query-guidelines-content"
                            role="region"
                            aria-labelledby="query-guidelines-label"
                            class="query-guidelines-content px-3 pb-3 small text-secondary border-top"
                        >
                            <h5 class="text-dark font-weight-bold mt-3 mb-3">Best Practices for Structuring Search Queries</h5>
                            <p class="mb-3">
                                To maximize precision and retrieve actionable mechanisms, structure your query around the principles below. The hybrid engine combines exact-match (lexical) and conceptual (semantic) retrieval—clear, entity-aware wording helps you bypass generic &quot;canonical&quot; results and align the graph with your intent.
                            </p>
                            <p class="mb-3 small border-left pl-3" style="border-left: 3px solid #f16822;">
                                <strong class="text-dark">Four checks</strong> the extractor uses before suggesting alternate wording:
                                explicit <strong>anchor</strong> (gene, protein, or concrete entity), a <strong>semantic net</strong> (mechanism or pathway concept),
                                <strong>spatial</strong> anchoring (tissue or cell type), and a focused <strong>phenotypic</strong> outcome.
                                When all four are satisfied, suggested queries are omitted on purpose.
                            </p>

                            <h6 class="text-dark font-weight-bold mt-3 mb-2">1. Anchor Your Query with Explicit Targets (Entity Forcing)</h6>
                            <p class="mb-2">
                                Purely conceptual searches are prone to the &quot;Canonical Shadow&quot;: the system may emphasize historically famous hub genes rather than the specific target you care about. If you are investigating a particular gene or protein, name it explicitly so the engine can anchor topology around that entity (this triggers structured gene targeting in extraction).
                            </p>
                            <ul class="mb-3 pl-3">
                                <li><em>Suboptimal:</em> &quot;Find a kidney transporter mechanism…&quot; (tends toward heavily annotated, generic transporters).</li>
                                <li><em>Optimal:</em> &quot;Find a kidney transporter mechanism involving SLC22A24…&quot; (anchors the network on your exact target).</li>
                            </ul>

                            <h6 class="text-dark font-weight-bold mt-3 mb-2">2. Define the Anatomical or Cellular Context (Spatial Anchoring)</h6>
                            <p class="mb-2">
                                Mechanisms are localized. State tissue, cell type, or subcellular compartment to avoid generic systemic hits and keep results tied to your area of interest.
                            </p>
                            <ul class="mb-3 pl-3">
                                <li><em>Suboptimal:</em> &quot;Find a mechanism for metabolite handling.&quot;</li>
                                <li><em>Optimal:</em> &quot;Find a mechanism for metabolite handling in the renal proximal tubule.&quot;</li>
                            </ul>

                            <h6 class="text-dark font-weight-bold mt-3 mb-2">3. Limit the Phenotypic Scope and Beware of &quot;Hub Gravity&quot;</h6>
                            <p class="mb-2">
                                Broad disease terms (e.g., &quot;heart disease&quot;) dilute the search vector—prefer specific traits or biomarkers (e.g., &quot;LDL cholesterol secretion&quot;). Also watch <strong class="text-dark">hub gravity</strong>: naming a highly pleiotropic hub (e.g., TP53 or SQSTM1) can pull in its most heavily annotated disease contexts and eclipse a narrower question. Prefer the most specific, localized mechanism you can state.
                            </p>
                            <ul class="mb-3 pl-3">
                                <li><em>Suboptimal:</em> &quot;Find a mechanism that drives blood clotting and heart disease.&quot;</li>
                                <li><em>Optimal:</em> &quot;Find a mechanism that alters the hepatic secretion of LDL cholesterol and fibrinogen.&quot;</li>
                            </ul>

                            <h6 class="text-dark font-weight-bold mt-3 mb-2">4. Use the &quot;Anchor + Semantic Net&quot; Formula</h6>
                            <p class="mb-2">
                                Combine an explicit target (<strong class="text-dark">the anchor</strong>) with a broader biochemical process (<strong class="text-dark">the semantic net</strong>) without over-constraining the clinical phenotype.
                            </p>
                            <p class="mb-2 font-weight-bold text-dark">
                                Suggested template: &quot;Find a [Broad Mechanism / Semantic Net] involving [Explicit Gene Anchor] in [Cell/Tissue Type] that drives [Specific Biomarker/Phenotype].&quot;
                            </p>
                            <p class="mb-1 font-weight-bold text-dark small">Example of a fully optimized query:</p>
                            <blockquote class="query-guidelines-example mb-3 pl-3 border-left">
                                <em>&quot;Find a mitochondrial metabolic reprogramming mechanism involving the TRAP1 chaperone in vascular smooth muscle cells that drives cellular senescence.&quot;</em>
                            </blockquote>

                            <p class="mb-0 pt-2 border-top">
                                <strong class="text-dark">Why this matters:</strong>
                                These patterns teach you how to drive the hybrid pipeline: explicit entities engage exact-match and grounding behavior, while a clear semantic net keeps retrieval interpretable—moving away from generic LLM-style prompts toward queries tuned for this Discovery Engine.
                            </p>
                        </div>
                    </div>
                </div>

                <!--
                <div v-if="loading_search_criteria" class="load-indicator mb-3 d-flex align-items-center gap-2">
                    <b-spinner small></b-spinner>
                    <span class="text-muted">Extracting research criteria based on your query…</span>
                </div>
                <div v-if="error_search_criteria" class="alert alert-danger d-flex align-items-center justify-content-between">
                    <span>{{ error_msg_search_criteria }}</span>
                    <button v-if="allow_retry" class="btn btn-sm btn-primary" @click="beginFlow()">Retry</button>
                </div>
                <div v-if="error_mechanisms" class="alert alert-danger d-flex align-items-center justify-content-between mt-2">
                    <span><strong>Error:</strong> {{ error_msg_mechanisms }}</span>
                    <button class="btn btn-sm btn-primary" @click="retryMechanismHypotheses()">Retry</button>
                </div>
                -->
                
                <template v-if="false">
                    <div v-if="searchCriteria && searchCriteria.length" class="mt-3">
                        <div class="font-weight-bold mb-2" style="color: #FF6600; font-size: 1.1em;">Extracted research criteria from your Query</div>
                        <div class="section-header d-flex justify-content-between align-items-start mb-2" @click="display_search_criteria = !display_search_criteria">
                            <div class="d-flex flex-column gap-2" style="max-width: calc(100% - 100px);">
                                <!-- og
                                <div class="d-flex flex-wrap align-items-baseline gap-2">
                                    <strong>Search Terms:</strong>
                                    <span class="pill" v-for="item in searchCriteria[0].values" :key="item">{{ item }}</span>
                                </div>
                                -->
                                <div class="d-flex flex-wrap align-items-baseline gap-2">
                                    <strong>Phenotype Terms:</strong>
                                    <span class="pill" v-for="item in lastPhenotypeTerms" :key="item">{{ item }}</span>
                                </div>
                                <div class="d-flex flex-wrap align-items-baseline gap-2">
                                    <strong>Mechanism Terms:</strong>
                                    <span class="pill" v-for="item in lastMechanismTerms" :key="item">{{ item }}</span>
                                </div>
                                <div class="d-flex flex-wrap align-items-baseline gap-2">
                                    <strong>Your Research Context:</strong>
                                    <span class="pill">{{ searchCriteria[1].values }}</span>
                                </div>
                            </div>
                            <span class="small text-muted">{{ display_search_criteria ? 'show less' : 'show more' }}</span>
                        </div>
                        <div :class="{ collapsed: !display_search_criteria }" class="criteria-detail">
                            <div class="d-flex justify-content-end mb-2">
                                <button v-if="!edit_search_criteria" class="btn btn-info btn-sm" @click="editSearchCriteria()">✎ Edit search criteria</button>
                                <div v-else class="d-flex gap-1">
                                    <button class="btn btn-warning btn-sm" @click="cancelEditSearchCriteria()">Cancel</button>
                                    <button class="btn btn-success btn-sm" @click="saveSearchCriteria()">Save search criteria</button>
                                </div>
                            </div>
                            <p class="small font-weight-bold mb-2">The values below will be used to inform subsequent steps.</p>
                            <b-table
                                :items="searchCriteria"
                                :fields="[
                                    { key: 'search_criteria', label: 'Search Criteria' },
                                    { key: 'values', label: 'Values' },
                                    { key: 'why', label: 'Why' },
                                    { key: 'purpose', label: 'Purpose' }
                                ]"
                                small
                                striped
                                hover
                                responsive="sm"
                                head-variant="light"
                            >
                                <template #cell(values)="row">
                                    <span v-if="Array.isArray(row.item.values)" class="d-inline-flex flex-wrap gap-1">
                                        <span
                                            class="pill"
                                            :class="{ editable: edit_search_criteria }"
                                            v-for="item in row.item.values"
                                            :key="item"
                                            @click="edit_search_criteria && removeSearchTerm(item)"
                                        >{{ item }}</span>
                                        <input
                                            v-if="edit_search_criteria"
                                            class="pill new"
                                            placeholder="+"
                                            @keyup.enter="addSearchTerm($event)"
                                            @blur="addSearchTerm($event)"
                                        />
                                    </span>
                                    <textarea
                                        v-else
                                        class="pill form-control"
                                        style="width:100%; field-sizing: content; min-height: 2.5em;"
                                        :disabled="!edit_search_criteria"
                                        v-model="row.item.values"
                                    ></textarea>
                                </template>
                                <template #cell(why)="data">
                                    <span v-html="data.value"></span>
                                </template>
                            </b-table>
                            <div class="d-flex justify-content-end mt-2">
                                <button
                                    class="btn btn-primary"
                                    :disabled="edit_search_criteria"
                                    @click="onResearch()"
                                >
                                    {{ searchMode === 'step' ? 'Continue' : 'Re-search' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </template>

                <div v-if="steps && steps.length" style="display:flex; flex-direction: column;">
                    <div v-if="workflowErrorSteps.length" class="mb-2">
                        <div
                            v-for="(errStep, ei) in workflowErrorSteps"
                            :key="'reveal-wf-err-' + ei + '-' + (errStep.title || '')"
                            class="alert alert-danger py-2 small mb-1"
                            role="alert"
                        >
                            <strong>Error:</strong> {{ errStep.title }}
                        </div>
                    </div>
                    <div style="display:flex; gap:20px">
                        <h4
                            class="reveal-tab"
                            :class="{ 'tab-active': showTab === 'terms' }"
                            @click="showTab = 'terms'"
                        >
                            Search terms
                        </h4>
                        <h4
                            class="reveal-tab"
                            :class="{ 'tab-active': showTab === 'data', 'tab-inactive': !revealDataTabEnabled }"
                            @click="revealDataTabEnabled && (showTab = 'data')"
                        >
                            Data
                        </h4>
                        <h4
                            class="reveal-tab"
                            :class="{ 'tab-active': showTab === 'results', 'tab-inactive': !revealResultsTabEnabled }"
                            @click="revealResultsTabEnabled && (showTab = 'results')"
                        >
                            Results
                        </h4>
                    </div>
                    <div>
                        <div
                            v-if="showTab === 'terms'"
                            style="display:flex; flex-direction: column; gap: 12px; color: #555;"
                        >
                            <template v-if="revealExtractionStep">
                                <div style="display:flex; gap: 8px; align-items: center;">
                                    <b-spinner v-if="loading_search_criteria" small></b-spinner>
                                    <span v-else>♦</span>
                                    <span style="font-weight:bold">{{ revealExtractionStep.title }}</span>
                                    <span>{{ formatTime(revealExtractionStep.time) || currStepTime(revealExtractionStep) }}</span>
                                </div>
                                <div
                                    v-for="(substep, ii) in revealExtractionSubstepsForTermsTab"
                                    :key="'ext-' + (substep && substep.id != null ? substep.id : ii) + '-' + ii"
                                    class="mt-2"
                                >
                                    <div
                                        v-if="searchCriteriaEditRows.length && ((stepApprovalGateActive && stepApprovalGateStepId === '1') || searchCriteriaExtractionGateDone)"
                                    >
                                        <b-table
                                            :items="searchCriteriaEditRows"
                                            :fields="[
                                                { key: 'type', label: 'Type', thStyle: { width: '34%' } },
                                                { key: 'term', label: 'Term' }
                                            ]"
                                            small
                                            striped
                                            responsive="sm"
                                            head-variant="light"
                                            class="mb-2"
                                        >
                                            <template #cell(type)="row">
                                                <span>{{ row.item.type }}</span>
                                            </template>
                                            <template #cell(term)="row">
                                                <textarea
                                                    v-if="row.item.type === 'Research context'"
                                                    class="form-control form-control-sm"
                                                    v-model="row.item.term"
                                                    rows="4"
                                                    style="min-height: 6.5em; resize: vertical;"
                                                    placeholder="Enter research context"
                                                    :disabled="!(stepApprovalGateActive && stepApprovalGateStepId === '1')"
                                                ></textarea>
                                                <input
                                                    v-else
                                                    type="text"
                                                    class="form-control form-control-sm"
                                                    v-model="row.item.term"
                                                    placeholder="Comma-separated terms"
                                                    :disabled="!(stepApprovalGateActive && stepApprovalGateStepId === '1')"
                                                />
                                            </template>
                                        </b-table>
                                        <div
                                            v-if="lastAlternativeQueries.length"
                                            class="reveal-alt-queries-block mt-2 mb-0"
                                        >
                                            <div class="font-weight-bold small text-muted mb-1">Alternative queries</div>
                                            <ul class="reveal-alt-query-links mb-0">
                                                <li
                                                    v-for="(opt, idx) in lastAlternativeQueries"
                                                    :key="'alt-below-' + idx + '-' + opt"
                                                >
                                                    <a
                                                        href="#"
                                                        class="reveal-alt-query-link"
                                                        @click.prevent="onAlternativeQuerySelected(opt)"
                                                    >{{ opt }}</a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    v-if="stepApprovalGateActive && stepApprovalGateStepId === '1'"
                                    style="display:flex; flex-direction:column; gap:8px; margin-top:10px;"
                                >
                                    <div class="text-muted" style="font-size: 11pt; font-weight: 700;">
                                        Extracted search terms and research context. Review terms, then continue.
                                    </div>
                                    <div style="display:flex; gap:10px;">
                                        <button class="btn btn-outline-secondary btn-sm" @click="resetSearchCriteriaGateEdits">
                                            Reset
                                        </button>
                                        <button class="btn btn-cfde btn-sm" @click="approveStepGate">
                                            Continue with current query
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <div
                            v-if="showTab === 'data'"
                            style="display:flex; flex-direction: column; gap: 12px; color: #555;"
                        >
                            <div v-for="step in revealDataSteps" :key="'reveal-data-' + step.id" class="status">
                                <div style="display:flex; gap: 5px; align-items: center;">
                                    <b-spinner v-if="dataStepShowsSpinner(step)" small></b-spinner>
                                    <span v-else-if="dataStepShowsGatePause(step)">▶</span>
                                    <span v-else-if="step.substeps && step.substeps.length">▼</span>
                                    <span v-else>♦</span>
                                    <span style="font-weight:bold">{{ step.title }}</span>
                                    <span>{{ formatTime(step.time) || currStepTime(step) }}</span>
                                </div>
                                <div class="sub-status mt-1" style="display:flex; flex-direction: column; padding-left: 18px;">
                                    <div
                                        v-for="(substep, ii) in (step.substeps || [])"
                                        :key="'ds-' + step.id + '-' + (substep && substep.id != null ? substep.id : ii) + '-' + ii"
                                        class="mb-2"
                                    >
                                        <div class="small font-weight-bold mb-1">{{ substep.title }}</div>
                                        <div
                                            v-if="substep.result && (substep.result.title || (substep.id !== '2.h2' && substep.result.result != null))"
                                            style="padding-left: 8px;"
                                        >
                                            <div v-if="substep.result.title" v-html="substep.result.title"></div>
                                            <pre
                                                v-if="substep.id !== '2.h2' && substep.result.result != null"
                                                style="background: #eee; padding: 10px; max-height: 160px; resize:vertical; overflow: auto;"
                                            >{{ substep.result.result }}</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <div v-if="(genesAndFactorValuesLoaded || loadComplete) && factorDataTableRows.length">
                            <div
                                class="border rounded bg-white p-3 mb-3"
                                style="border-color: #dee2e6 !important;"
                                role="status"
                            >
                                <div class="d-flex justify-content-end align-items-start mb-2">
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                                        :disabled="!lastHybridSearchResponse"
                                        @click="downloadLastHybridSearchRawJson"
                                    >
                                        <b-icon icon="download" class="mr-1" aria-hidden="true" />
                                        Raw data
                                    </button>
                                </div>
                                <div class="font-weight-bold mb-3" style="color: #FF6600; font-size: 1.2em;">
                                    Selected {{ phenotypeCount }} phenotype{{ phenotypeCount !== 1 ? 's' : '' }} and {{ factorCount }} gene set cluster{{ factorCount !== 1 ? 's' : '' }} relevant to research context.
                                </div>
                                <ul v-if="hybridSearchMetaSummaryLines.length" class="mb-0 pl-3 text-secondary small">
                                    <li v-for="(line, idx) in hybridSearchMetaSummaryLines" :key="`hybrid-meta-${idx}`">{{ line }}</li>
                                </ul>
                                <div v-else class="small text-muted mb-0 font-italic">No hybrid diagnostics available.</div>
                            </div>
                            <div
                                v-if="stepApprovalGateActive && stepApprovalGateStepId === '2'"
                                class="mb-3"
                            >
                                <div class="text-muted mb-2" style="font-size: 11pt; font-weight: 700;">{{ stepApprovalGateMessage }}</div>
                                <button class="btn btn-cfde btn-sm" @click="approveStepGate">
                                    Continue
                                </button>
                            </div>
                            <!--
                            <div class="section-header d-flex justify-content-between align-items-start mb-2" @click="display_phenotypes_factors = !display_phenotypes_factors">
                                <div class="d-flex flex-column gap-2" style="max-width: calc(100% - 100px);">
                                    <div class="d-flex flex-wrap align-items-baseline gap-2">
                                        <strong>Phenotype:</strong>
                                        <span class="pill" v-for="p in phenotypeList" :key="p">{{ getPhenotypeDisplay(p) }}</span>
                                    </div>
                                    <div class="d-flex flex-wrap align-items-baseline gap-2">
                                        <strong>Factors:</strong>
                                        <span class="pill" v-for="f in factorLabelsListDisplay" :key="f">{{ f }}</span>
                                    </div>
                                </div>
                                <span class="small text-muted">{{ display_phenotypes_factors ? 'show less' : 'show more' }}</span>
                            </div>
                            -->
                            <div class="criteria-detail">
                            <div class="mt-2">
                                <div class="mb-4" style="margin-top:20px;">
                                    <factor-base-reveal-heatmap
                                        ref="factorBaseRevealHeatmap"
                                        :factor-data="factorData"
                                        :factor-data-table-rows="factorDataTableRowsFiltered"
                                        :phenotype-description-by-id="phenotypeDescriptionById"
                                        height="auto"
                                    />
                                </div>
                                    <!-- Phenotype path: Selected Rationale section above table -->
                                    <div v-if="isPhenotypePath && phenotypeRationaleList.length" class="mb-3">
                                        <div class="font-weight-bold small text-muted mb-2">Selected Rationale</div>
                                        <ul class="list-unstyled small text-muted mb-0">
                                            <li v-for="item in phenotypeRationaleList" :key="item.phenotype" class="mb-2">
                                                <strong>{{ getPhenotypeDisplay(item.phenotype) }}:</strong> {{ item.rationale }}
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <!-- Phenotype path: custom table, no rationale column -->
                                        <b-table-simple v-if="isPhenotypePath" small striped hover class="mb-0">
                                            <thead variant="light">
                                                <tr>
                                                    <th style="width: 72px;">Included</th>
                                                    <th style="width: auto;">Phenotype</th>
                                                    <th style="width: auto;">Trait group</th>
                                                    <!--<th style="width: auto;">Top gene sets</th>-->
                                                    <th style="width: 300px;">Genes and gene sets in cluster</th>
                                                </tr>
                                            </thead>
                                            <tbody v-for="row in mainFactorTableRowsPaged" :key="getRowKey(row)">
                                                <tr>
                                                    <td>
                                                        <div class="text-center">
                                                    <input
                                                        type="checkbox"
                                                        :checked="isPairIncluded(row)"
                                                        class="form-check-input d-inline-block"
                                                        aria-label="Included"
                                                        @change="onPairIncludedToggle(row, $event.target.checked)"
                                                    />
                                                        </div>
                                                    </td>
                                                    <td>{{ getPhenotypeDisplay(row.phenotype) }}</td>
                                                    <td>{{ getFactorClusterDisplay(row) }}</td>
                                                    <!--
                                                    <td>
                                                        <div style="display:flex; flex-direction: column; gap: 3px">
                                                            <div v-for="(geneset, index) in row.top_gene_sets" class="small" style="display: flex; gap: 5px">
                                                                <span>{{ geneset }}</span>
                                                                <span>[{{ row.top_gene_set_programs[index] }}]</span>
                                                                <a role="button" v-if="row.top_gene_set_programs[index] === 'gtex'" @click="getProvenance(geneset, row.top_gene_set_programs[index])">info</a>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    -->
                                                    <td style="text-align: center;">
                                                        <button
                                                            class="btn btn-sm btn-outline-primary"
                                                            @click="toggleFactorGenesRow({ item: row })"
                                                        >
                                                            {{ isFactorRowExpanded(row) ? 'Hide' : 'Show' }}
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr v-if="isFactorRowExpanded(row)">
                                                    <td colspan="4" class="p-0 border-0">
                                                        <div class="bg-light" style="display:flex; gap: 20px;">
                                                            <div v-if="getGenesetForFactor(row.phenotype, row.factor)" class="py-2 px-3" style="display:flex; flex:1; flex-direction: column;">
                                                                <div class="small text-muted mb-2">Gene sets in cluster</div>
                                                                <!--
                                                                <div v-for="gs in getGenesetForFactor(row.phenotype, row.factor)" class="small" style="display: flex; gap: 5px">
                                                                    <span>{{ gs.geneset }}</span>
                                                                    <span>[{{ gs.program }}]</span>
                                                                    <a role="button" v-if="gs.program === 'gtex'" @click="getProvenance(gs.geneset, gs.program)">info</a>
                                                                </div>
                                                                -->
                                                                <b-table
                                                                    striped
                                                                    hover
                                                                    small
                                                                    responsive="sm"
                                                                    head-variant="light"
                                                                    :items="getGenesetForFactor(row.phenotype, row.factor)"
                                                                    :fields="[
                                                                        { key: 'geneset', label: 'Gene Set', thClass: 'text-nowrap'},
                                                                        { key: 'program', label: 'Program', thClass: 'text-nowrap'},
                                                                        { key: 'actions', label: 'Source Data', thClass: 'text-nowrap'}
                                                                    ]"
                                                                >
                                                                    <template #cell(geneset)="gsRow">
                                                                        <a
                                                                            :href="cfdeExploreAssociationHref(row.phenotype, gsRow.item.geneset, gsRow.item.program)"
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            class="cfde-explore-geneset-link truncate-cell d-inline-block"
                                                                            :title="gsRow.item.geneset"
                                                                            style="max-width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                                        >{{ gsRow.item.geneset }}</a>
                                                                    </template>
                                                                    <template #cell(actions)="gsRow">
                                                                        <button
                                                                            v-if="gsRow.item.program === 'gtex'"
                                                                            class="btn btn-sm btn-outline-primary"
                                                                            @click="onGeneSetRowToggled(gsRow)"
                                                                        >
                                                                            {{ gsRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                        </button>
                                                                    </template>  
                                                                    <template #row-details="gsRow">
                                                                        <div style="padding: 10px;">
                                                                            <!--
                                                                            <a role="button" @click="getProvenance(gsRow.item.geneset, gsRow.item.program)">info</a>
                                                                            <pre>{{ gene_set_sources[gsRow.item.geneset] }}</pre>
                                                                            -->
                                                                            <div v-if="gene_set_sources[gsRow.item.geneset]">
                                                                                <b-card>
                                                                                    <a :href="gene_set_sources[gsRow.item.geneset].geneSetUrl" target="_blank">{{ gene_set_sources[gsRow.item.geneset].geneSet }}</a>

                                                                                    <ul>
                                                                                        <li v-for="(rel, i) in gene_set_sources[gsRow.item.geneset].relations" :key="i" class="text-muted small">
                                                                                            <div>
                                                                                                <strong>{{rel.method.predicate}}: </strong><a :href="rel.file.dcc_url" target="_blank">{{ rel.file.filename }}</a>
                                                                                            </div>
                                                                                            <div>
                                                                                                via 
                                                                                                <a :href="rel.method.script" target="_blank">{{ rel.method.type }}</a>
                                                                                                ({{ rel.method.direction }})
                                                                                            </div>
                                                                                        </li>
                                                                                    </ul>
                                                                                </b-card>
                                                                            </div>
                                                                            <div v-else>
                                                                                no data available yet.
                                                                            </div>
                                                                        </div>
                                                                    </template>  
                                                                </b-table>
                                                            </div>
                                                            <div class="subtable-container py-2 px-3" style="flex:1">
                                                                <div v-if="loadingGenesForFactor[getRowKey(row)]" class="small text-muted mb-2">Loading genes…</div>
                                                                <div v-else class="small text-muted mb-2">Genes in factor ({{ getGenesForFactor(row.phenotype, row.factor).length }} rows)</div>
                                                                <b-table
                                                                    v-if="!loadingGenesForFactor[getRowKey(row)]"
                                                                    striped
                                                                    hover
                                                                    small
                                                                    responsive="sm"
                                                                    head-variant="light"
                                                                    :items="getGenesForFactor(row.phenotype, row.factor)"
                                                                    :fields="[
                                                                        { key: 'gene', label: 'Gene', thStyle: { width: '100px' } },
                                                                        { key: 'combined', label: 'Combined score', thStyle: { width: '110px' } },
                                                                        { key: 'gwasSupport', label: 'GWAS support', thStyle: { width: '110px' } },
                                                                        { key: 'geneSetSupport', label: 'Functional support', thStyle: { width: '120px' } }
                                                                    ]"
                                                                    :per-page="subtablePerPage"
                                                                    :current-page="getSubtableCurrentPage(row)"
                                                                />
                                                                <b-pagination
                                                                    v-if="!loadingGenesForFactor[getRowKey(row)] && getGenesForFactor(row.phenotype, row.factor).length > subtablePerPage"
                                                                    v-model="subtableCurrentPages[getRowKey(row)]"
                                                                    class="pagination-sm justify-content-center mt-2"
                                                                    :total-rows="getGenesForFactor(row.phenotype, row.factor).length"
                                                                    :per-page="subtablePerPage"
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </b-table-simple>
                                        <!-- Association path: standard b-table, one rationale per row -->
                                        <b-table
                                            v-else
                                            :items="mainFactorTableRowsPaged"
                                            primary-key="_rowKey"
                                            :fields="[
                                                { key: 'included', label: 'Included', thStyle: { width: '72px' }, stickyColumn: false },
                                                { key: 'phenotype', label: 'Phenotype', thStyle: { width: '120px' } },
                                                { key: 'factorLabel', label: 'Trait group', thStyle: { width: '180px' } },
                                                //{ key: 'top_gene_sets', label: 'Top gene sets', thStyle: { width: 'auto' } },
                                                { key: 'rationale', label: 'Selection rationale', thStyle: { width: '220px' } },
                                                { key: 'view_genes', label: 'Genes and gene sets in cluster', thStyle: { width: '140px' } }
                                            ]"
                                            small
                                            striped
                                            hover
                                            head-variant="light"
                                        >
                                            <template #cell(included)="row">
                                                <div class="text-center">
                                                    <input
                                                        type="checkbox"
                                                        :checked="isPairIncluded(row.item)"
                                                        class="form-check-input d-inline-block"
                                                        aria-label="Included in selection"
                                                        @change="onPairIncludedToggle(row.item, $event.target.checked)"
                                                    />
                                                </div>
                                            </template>
                                            <template #cell(phenotype)="row">
                                                {{ getPhenotypeDisplay(row.item.phenotype) }}
                                            </template>
                                            <template #cell(factorLabel)="row">
                                                {{ getFactorClusterDisplay(row.item) }}
                                            </template>
                                            <template #cell(top_gene_sets)="row">
                                                <span class="small">{{ row.item.top_gene_sets }}</span>
                                            </template>
                                            <template #cell(rationale)="row">
                                                <span v-if="row.item.rationale" class="small text-muted" style="white-space: normal;">{{ row.item.rationale }}</span>
                                                <span v-else class="small text-muted">—</span>
                                            </template>
                                            <template #cell(view_genes)="row">
                                                <button
                                                    class="btn btn-sm btn-outline-primary"
                                                    @click="toggleFactorGenesRow(row)"
                                                >
                                                    {{ isFactorRowExpanded(row.item) ? 'Hide' : 'Show' }}
                                                </button>
                                            </template>
                                            <template #row-details="row">
                                                <div class="bg-light" style="display:flex; gap: 20px;">
                                                    <div v-if="getGenesetForFactor(row.item.phenotype, row.item.factor)" class="py-2 px-3" style="display:flex; flex:1; flex-direction: column;">
                                                        <div class="small text-muted mb-2">Gene sets in cluster</div>
                                                        <!--
                                                        <div v-for="gs in getGenesetForFactor(row.phenotype, row.factor)" class="small" style="display: flex; gap: 5px">
                                                            <span>{{ gs.geneset }}</span>
                                                            <span>[{{ gs.program }}]</span>
                                                            <a role="button" v-if="gs.program === 'gtex'" @click="getProvenance(gs.geneset, gs.program)">info</a>
                                                        </div>
                                                        -->
                                                        <b-table
                                                            striped
                                                            hover
                                                            small
                                                            responsive="sm"
                                                            head-variant="light"
                                                            :items="getGenesetForFactor(row.item.phenotype, row.item.factor)"
                                                            :fields="[
                                                                { key: 'geneset', label: 'Gene Set', thClass: 'text-nowrap'},
                                                                { key: 'program', label: 'Program', thClass: 'text-nowrap'},
                                                                { key: 'actions', label: 'Source Data', thClass: 'text-nowrap'}
                                                            ]"
                                                        >
                                                            <template #cell(geneset)="gsRow">
                                                                <a
                                                                    :href="cfdeExploreAssociationHref(row.item.phenotype, gsRow.item.geneset, gsRow.item.program)"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    class="cfde-explore-geneset-link truncate-cell d-inline-block"
                                                                    :title="gsRow.item.geneset"
                                                                    style="max-width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                                >{{ gsRow.item.geneset }}</a>
                                                            </template>
                                                            <template #cell(actions)="gsRow">
                                                                <button
                                                                    v-if="gsRow.item.program === 'gtex'"
                                                                    class="btn btn-sm btn-outline-primary"
                                                                    @click="onGeneSetRowToggled(gsRow)"
                                                                >
                                                                    {{ gsRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                </button>
                                                            </template>  
                                                            <template #row-details="gsRow">
                                                                <div style="padding: 10px;">
                                                                    <!--
                                                                    <a role="button" @click="getProvenance(gsRow.item.geneset, gsRow.item.program)">info</a>
                                                                    <pre>{{ gene_set_sources[gsRow.item.geneset] }}</pre>
                                                                    -->
                                                                    <div v-if="gene_set_sources[gsRow.item.geneset]">
                                                                        <b-card>
                                                                            <a :href="gene_set_sources[gsRow.item.geneset].geneSetUrl" target="_blank">{{ gene_set_sources[gsRow.item.geneset].geneSet }}</a>

                                                                            <ul>
                                                                                <li v-for="(rel, i) in gene_set_sources[gsRow.item.geneset].relations" :key="i" class="text-muted small">
                                                                                    <div>
                                                                                        <strong>{{rel.method.predicate}}: </strong><a :href="rel.file.dcc_url" target="_blank">{{ rel.file.filename }}</a>
                                                                                    </div>
                                                                                    <div>
                                                                                        via 
                                                                                        <a :href="rel.method.script" target="_blank">{{ rel.method.type }}</a>
                                                                                        ({{ rel.method.direction }})
                                                                                    </div>
                                                                                </li>
                                                                            </ul>
                                                                        </b-card>
                                                                    </div>
                                                                    <div v-else>
                                                                        no data available yet.
                                                                    </div>
                                                                </div>
                                                            </template>  
                                                        </b-table>
                                                    </div>
                                                    <div class="subtable-container py-2" style="flex:1">
                                                        <div class="small text-muted mb-2">Genes in factor ({{ getGenesForFactor(row.item.phenotype, row.item.factor).length }} rows)</div>
                                                        <b-table
                                                            striped
                                                            hover
                                                            small
                                                            responsive="sm"
                                                            head-variant="light"
                                                            :items="getGenesForFactor(row.item.phenotype, row.item.factor)"
                                                            :fields="[
                                                                { key: 'gene', label: 'Gene', thStyle: { width: '100px' } },
                                                                { key: 'combined', label: 'Combined score', thStyle: { width: '110px' } },
                                                                { key: 'gwasSupport', label: 'GWAS support', thStyle: { width: '110px' } },
                                                                { key: 'geneSetSupport', label: 'Functional support', thStyle: { width: '120px' } }
                                                            ]"
                                                            :per-page="subtablePerPage"
                                                            :current-page="getSubtableCurrentPage(row.item)"
                                                        />
                                                        <b-pagination
                                                            v-if="getGenesForFactor(row.item.phenotype, row.item.factor).length > subtablePerPage"
                                                            v-model="subtableCurrentPages[getRowKey(row.item)]"
                                                            class="pagination-sm justify-content-center mt-2"
                                                            :total-rows="getGenesForFactor(row.item.phenotype, row.item.factor).length"
                                                            :per-page="subtablePerPage"
                                                        />
                                                    </div>
                                                </div>
                                            </template>
                                        </b-table>
                                        <b-pagination
                                            v-if="(isPhenotypePath ? factorDataTableRowsWithRationaleMeta.length : factorDataTableRows.length) > mainTablePerPage"
                                            v-model="mainTableCurrentPage"
                                            class="pagination-sm justify-content-center mt-2"
                                            :total-rows="isPhenotypePath ? factorDataTableRowsWithRationaleMeta.length : factorDataTableRows.length"
                                            :per-page="mainTablePerPage"
                                        />
                                    </div>
                            </div>
                            </div>
                        </div>
                        </div>
    
                        <div v-if="showTab === 'results'" style="display:flex; flex-direction: column; gap: 12px;">
                            <div
                                v-if="isMechanismHypothesisLoading"
                                class="d-flex align-items-center gap-2 my-2"
                                style="color: #555;"
                            >
                                <b-spinner small></b-spinner>
                                <span class="font-weight-bold">LLM: Generating mechanistic hypotheses</span>
                                <span v-if="revealHypothesisStep" class="text-muted small">{{ formatTime(revealHypothesisStep.time) || currStepTime(revealHypothesisStep) }}</span>
                            </div>
                            <div
                                v-if="!isMechanismHypothesisLoading && error_mechanisms"
                                class="alert alert-danger d-flex align-items-center justify-content-between mt-2"
                                role="alert"
                            >
                                <span>{{ error_msg_mechanisms }}</span>
                                <button type="button" class="btn btn-sm btn-primary" @click="retryMechanismHypotheses">Retry</button>
                            </div>
                            <div v-if="!isMechanismHypothesisLoading && showMechanismResultsPanel">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="font-weight-bold" style="color: #FF6600; font-size: 1.2em;">
                                    <template v-if="mechanisms && mechanisms.length">Generated {{ mechanisms.length }} mechanistic hypotheses.</template>
                                    <template v-else>Mechanistic hypotheses</template>
                                </div>
                                <button
                                    v-if="canDownloadMechanismReport"
                                    class="btn btn-outline-secondary btn-sm"
                                    @click="downloadReport"
                                >
                                    Download report
                                </button>
                            </div>
                            <div
                                v-if="mechanismDiagnosticAssessment && mechanismDiagnosticAssessment.warning_flag"
                                class="alert alert-warning small mb-3"
                                role="status"
                            >
                                <div class="font-weight-bold text-dark mb-1">Diagnostic warning</div>
                                <div class="mb-0">{{ mechanismDiagnosticAssessment.warning_flag }}</div>
                                <div
                                    v-if="mechanismDiagnosticAssessment.suggested_optimized_query"
                                    class="mt-2 pt-2 border-top"
                                    style="border-color: rgba(0,0,0,0.08) !important;"
                                >
                                    <div class="font-weight-bold small mb-1">Suggested optimized query</div>
                                    <div class="small text-dark mb-2" style="white-space: pre-wrap;">{{ mechanismDiagnosticAssessment.suggested_optimized_query }}</div>
                                    <button
                                        type="button"
                                        class="btn btn-cfde btn-sm"
                                        @click="applySuggestedOptimizedQuery(mechanismDiagnosticAssessment.suggested_optimized_query)"
                                    >
                                        Use this query and run Reveal
                                    </button>
                                </div>
                            </div>
                            <div
                                v-if="mechanismDiagnosticAssessment && mechanismDiagnosticAssessment.can_generate_hypothesis === false"
                                class="alert alert-secondary border small mb-3"
                                role="status"
                            >
                                <div class="font-weight-bold text-dark mb-1">No hypothesis generated (diagnostic assessment)</div>
                                <p class="mb-2 small mb-0">{{ mechanismDiagnosticAssessment.rejection_reason || "The model declined to invent connections not supported by the retrieved graph." }}</p>
                                <div
                                    v-if="hypothesisGenerationMode === 'strict'"
                                    class="mt-2 pt-2 border-top"
                                    style="border-color: rgba(0,0,0,0.08) !important;"
                                >
                                    <p class="small mb-2">
                                        Retrieval and strict graph rules blocked a mechanism. You can run again in <strong>Relaxed</strong> mode to ask the model for a best-effort, explicitly warned hypothesis (still grounded in the retrieved CSV).
                                    </p>
                                    <button type="button" class="btn btn-cfde btn-sm" @click="retryMechanismHypothesesRelaxed">
                                        Try in relaxed (exploratory) mode
                                    </button>
                                </div>
                                <div v-if="mechanismDiagnosticAssessment.suggested_optimized_query" class="mt-2 pt-2 border-top">
                                    <div class="font-weight-bold small mb-1">Suggested optimized query</div>
                                    <div class="small text-dark mb-2" style="white-space: pre-wrap;">{{ mechanismDiagnosticAssessment.suggested_optimized_query }}</div>
                                    <button
                                        type="button"
                                        class="btn btn-cfde btn-sm"
                                        @click="applySuggestedOptimizedQuery(mechanismDiagnosticAssessment.suggested_optimized_query)"
                                    >
                                        Use this query and run Reveal
                                    </button>
                                </div>
                            </div>
                            <div v-if="mechanismResultsDetailVisible">
                            <div class="section-header d-flex justify-content-between align-items-start mb-2" @click="display_mechanisms = !display_mechanisms">
                                <div v-if="searchCriteria && searchCriteria[1]" class="text-muted">In the context of <strong>{{ searchCriteria[1].values }}</strong></div>
                                <!--<span class="small text-muted">{{ display_mechanisms ? 'show less' : 'show more' }}</span>-->
                            </div>
                            <div :class="{ collapsed: !display_mechanisms }" class="criteria-detail">
                                <div v-if="mechanisms_summary" class="mb-4">
                                    <strong class="d-block mb-2" style="font-size: 1.1em;">Summary</strong>
                                    <div class="text-muted">{{ mechanisms_summary }}</div>
                                </div>
                                <div class="d-flex flex-column gap-4" style="gap:40px;">
                                    <div
                                        v-for="(mechanism, idx) in mechanisms"
                                        :key="idx"
                                        class="mechanism-card rounded border shadow-sm bg-light overflow-hidden"
                                    >
                                        <div
                                            v-if="hypothesisLastRunMode === 'relaxed' || mechanismDiagnosticAssessment && mechanismDiagnosticAssessment.exploratory_mode === true"
                                            class="px-3 py-2 small mb-0 border-bottom"
                                            style="background: #fff8e6; border-color: #f0d060 !important; color: #5c4a00;"
                                            role="status"
                                        >
                                            <strong>Exploratory hypothesis.</strong>
                                            This run used relaxed mode: check diagnostic warnings and Biolink map edge validation—speculative interpretation may bridge gaps not proven by single-hop graph evidence.
                                        </div>
                                        <div class="mechanism-card-header px-3 py-3 bg-secondary text-white d-flex align-items-center flex-wrap gap-2">
                                            <div class="font-weight-bold" style="font-size: 1.1em;">{{ mechanism.group_name }}</div>
                                        </div>
                                        <div class="" style="display:flex; flex-direction: column; gap:20px; padding:20px">
                                            <div
                                                class="d-flex flex-column flex-lg-row align-items-stretch"
                                                style="gap: 20px;"
                                            >
                                                <div class="mechanism-hypothesis-rationale-col flex-grow-1" style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 16px;">
                                                    <div class="">
                                                        <div class="font-weight-bold small text-uppercase text-muted mb-1">Mechanistic hypothesis</div>
                                                        <div class="font-size-1">{{ mechanism.hypothesis }}<span class="ai-gen">AI</span></div>
                                                    </div>
                                                    <div class="">
                                                        <div class="font-weight-bold small text-uppercase text-muted mb-1">Rationale</div>
                                                        <div class="small">{{ mechanism.novelty_explanation || mechanism.novelty }}<span class="ai-gen">AI</span></div>
                                                    </div>
                                                </div>
                                                <div
                                                    v-if="mechanism.core_spine_network && mechanism.core_spine_network.nodes && mechanism.core_spine_network.nodes.length"
                                                    class="mechanism-hypothesis-map-col flex-grow-1"
                                                    style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column;"
                                                >
                                                    <div class="font-weight-bold small text-uppercase text-muted mb-2">
                                                        Hypothesis map (biological mechanism)
                                                    </div>
                                                    <p v-if="mechanism.hypothesis_in_kg && mechanism.hypothesis_in_kg.caption" class="small text-muted mb-2">
                                                        {{ mechanism.hypothesis_in_kg.caption }}<span class="ai-gen">AI</span>
                                                    </p>
                                                    <div class="bg-white border rounded flex-grow-1" style="min-height: 220px;">
                                                        <factor-base-reveal-network
                                                            :ref="'mechanismHypothesisMap-' + idx"
                                                            :key="'core-spine-' + idx + '-' + (mechanism.group_name || '')"
                                                            :network="mechanism.core_spine_network"
                                                            :genes="mechanism.candidate_genes || mechanism.genes || []"
                                                            :width="640"
                                                            :height="280"
                                                            :show-popup-button="true"
                                                            :is-mechanism-flow-map="true"
                                                            :is-biolink-map="isMechanismUsingBiolinkMap(mechanism)"
                                                            :show-hypothesis-map-view-toggle="hasMechanismBiolinkNetwork(mechanism)"
                                                            :show-original-hypothesis-map="!isMechanismUsingBiolinkMap(mechanism)"
                                                            @hypothesis-original-map="
                                                                setMechanismMapViewMode(idx, $event ? 'original' : 'biolink')
                                                            "
                                                            @open-popup="openNetworkPopup(idx, { hypothesisMap: true })"
                                                        />
                                                    </div>
                                                    <p
                                                        v-if="isMechanismUsingBiolinkMap(mechanism)"
                                                        class="small text-muted mt-2 mb-0"
                                                    >
                                                        Nodes in this view are mapped to Biolink Model categories (classes), and edges are labeled with Biolink predicates to standardize relationship types across knowledge graphs.
                                                        Edge support is then checked through the NCATS Biomedical Data Translator using TRAPI queries against Translator knowledge sources.
                                                    </p>
                                                </div>
                                            </div>
                                            <div v-if="mechanism.relevance" class="mb-3">
                                                <div class="font-weight-bold small text-uppercase text-muted mb-1">Relevance</div>
                                                <div class="small">{{ mechanism.relevance }}</div>
                                            </div>
                                            <div style="display:flex; flex-direction: row; gap:20px">
                                                <div style="display:flex; flex-direction: column; flex:1; overflow-x: auto;">
                                                    <div class="mb-3">
                                                        <template v-if="(mechanism.candidate_genes && mechanism.candidate_genes.length) || (mechanism.genes && mechanism.genes.length)">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-2">Candidate genes ({{ (mechanism.candidate_genes || mechanism.genes || []).length }})</div>
                                                            <!--
                                                            <div class="candidate-genes-legend mb-2 small">
                                                                <span class="candidate-genes-legend-pill ai-generated">AI Generated</span>
                                                                <span class="candidate-genes-legend-pill raw-data">From Raw Data</span>
                                                            </div>
                                                            -->
                                                            <b-table
                                                                small
                                                                striped
                                                                hover
                                                                responsive="sm"
                                                                head-variant="light"
                                                                :items="mechanism.candidate_genes || mechanism.genes || []"
                                                                :fields="[
                                                                    { key: 'gene', label: 'Gene', thStyle: { width: '90px' }},
                                                                    { key: 'group', label: 'Gene role', thStyle: { width: '200px' } },
                                                                    { key: 'reason', label: 'Reason' },
                                                                    { key: 'scores_combined', label: 'Combined', thStyle: { width: '85px' } },
                                                                    { key: 'scores_gwas', label: 'GWAS', thStyle: { width: '75px' } },
                                                                    { key: 'scores_functional', label: 'Functional', thStyle: { width: '90px' } }
                                                                ]"
                                                            >
                                                                <template #cell(scores_combined)="row">
                                                                    {{ row.item.scores && (row.item.scores.combined != null || row.item.scores.c != null) ? Number(row.item.scores.combined ?? row.item.scores.c).toFixed(2) : '—' }}
                                                                </template>
                                                                <template #cell(scores_gwas)="row">
                                                                    {{ row.item.scores && (row.item.scores.gwas != null || row.item.scores.g != null) ? Number(row.item.scores.gwas ?? row.item.scores.g).toFixed(2) : '—' }}
                                                                </template>
                                                                <template #cell(scores_functional)="row">
                                                                    {{ row.item.scores && (row.item.scores.functional != null || row.item.scores.f != null) ? Number(row.item.scores.functional ?? row.item.scores.f).toFixed(2) : '—' }}
                                                                </template>
                                                                <template #cell(reason)="row">
                                                                    {{ row.item.reason != null ? row.item.reason : row.item.role }}<span class="ai-gen">AI</span>
                                                                </template>
                                                                <template #cell(gene)="row">
                                                                    <span class="small pill" :style="mechanismGeneGroupPillStyle(row.item.group)">{{ row.item.gene }}</span>
                                                                </template>
                                                                <template #cell(group)="row">
                                                                    <span class="small">{{ row.item.group || "—" }}</span>
                                                                </template>
                                                            </b-table>
                                                        </template>
                                                    </div>
                                                    <div v-if="mechanism.genes_collective_reason" class="mb-3">
                                                        <div class="font-weight-bold small text-uppercase text-muted mb-1">Genes collective reason</div>
                                                        <div class="bg-warning bg-opacity-25 p-2 rounded small">{{ mechanism.genes_collective_reason }}</div>
                                                    </div>
                                                </div>
                                                <div v-if="(mechanism.supporting_network || mechanism.network) && ((mechanism.supporting_network || mechanism.network).nodes || (mechanism.supporting_network || mechanism.network).edges)" class="" style="flex:1">
                                                    <div class="font-weight-bold small text-uppercase text-muted mb-2">Supporting network</div>
                                                    <div class="small text-muted mb-2">
                                                        {{ ((mechanism.supporting_network || mechanism.network).nodes || []).length }} nodes,
                                                        {{ ((mechanism.supporting_network || mechanism.network).edges || []).length }} edges
                                                    </div>
                                                    <factor-base-reveal-network
                                                        :key="mechanism.group_name || idx"
                                                        :ref="'mechanismNetwork-' + idx"
                                                        :network="mechanism.supporting_network || mechanism.network"
                                                        :genes="mechanism.candidate_genes || mechanism.genes || []"
                                                        :width="640"
                                                        :height="360"
                                                        :show-popup-button="true"
                                                        @open-popup="openNetworkPopup(idx)"
                                                    />
                                                    <div class="mt-2" style="display:flex; flex-direction: column;">
                                                        <div v-if="(mechanism.relevant_phenotypes && mechanism.relevant_phenotypes.length)" class="mb-2">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-1">Relevant phenotypes</div>
                                                            <div style="display:flex; flex-direction: column; gap:3px">
                                                                <div
                                                                    v-for="(phenotypeLabel, pidx) in getRelevantPhenotypesDisplay(mechanism.relevant_phenotypes)"
                                                                    :key="'mech-' + idx + '-rphen-' + pidx + '-' + (phenotypeLabel || '')"
                                                                    class="small pill"
                                                                    :style="`background:${NODE_COLORS.Phenotype}; color:white`"
                                                                >
                                                                    {{ phenotypeLabel }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-if="(mechanism.redundant_associated_pairs && mechanism.redundant_associated_pairs.length)" class="mb-2">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-1">Supplementary / Similar Clusters</div>
                                                            <div style="display:flex; flex-wrap: wrap; gap:3px">
                                                                <div
                                                                    v-for="(pair, ridx) in mechanism.redundant_associated_pairs"
                                                                    :key="'mech-' + idx + '-red-' + ridx + '-' + (pair.factor || '')"
                                                                    class="small pill"
                                                                    style="background:#e2e3e5; color:#383d41;"
                                                                >
                                                                    {{ getPhenotypeDisplay(pair.phenotype) }} - {{ getFactorClusterDisplayString(pair.factor) }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-if="(mechanism.relevant_gene_sets && mechanism.relevant_gene_sets.length)" class="mb-2">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-1">Relevant gene sets</div>
                                                            <div class="small" style="white-space: normal; display:flex; flex-direction: column; gap:3px">
                                                                <div v-for="set in formatRelevantGeneSetsForDisplay(mechanism.relevant_gene_sets)" :key="set.gs">
                                                                    <div style="display:flex; gap:10px; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
                                                                        <a
                                                                            :href="cfdeExploreGeneSetHref(mechanism, set.gs, set.program)"
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            class="pill text-white text-decoration-none cfde-explore-geneset-link"
                                                                            style="overflow: clip; text-overflow: ellipsis; max-width: 300px; word-wrap: normal;"
                                                                            :style="`background:${NODE_COLORS.Pathway}`"
                                                                            :title="set.desc || set.gs"
                                                                        >{{ set.gs }}</a>
                                                                        <div class="d-flex flex-wrap align-items-center fbr-relevant-geneset-programs" style="gap:6px; max-width: min(100%, 560px); justify-content: flex-end;">
                                                                            <template v-if="c2m2GeneSetDownloadNodes(set.gs).length">
                                                                                <div class="fbr-program-download-wrap">
                                                                                    <div
                                                                                        class="pill text-white small d-inline-flex align-items-center fbr-program-download-trigger"
                                                                                        :style="{ background: NODE_COLORS.GeneSetProgramDownloads }"
                                                                                        role="button"
                                                                                        tabindex="0"
                                                                                        :title="(set.program || 'Data files') + ' — hover for download links'"
                                                                                    >
                                                                                        <span class="fbr-program-download-label">{{ set.program || "Data files" }}</span>
                                                                                        <b-icon icon="three-dots-vertical" class="fbr-program-download-icon ml-1 flex-shrink-0" aria-hidden="true" />
                                                                                    </div>
                                                                                    <div class="fbr-program-download-menu border rounded bg-white shadow-sm">
                                                                                        <div class="fbr-program-download-menu-heading px-2 pt-2 pb-1 text-muted small text-uppercase">Open or download</div>
                                                                                        <a
                                                                                            v-for="(pn, nidx) in c2m2GeneSetDownloadNodes(set.gs)"
                                                                                            :key="'mech-' + idx + '-prov-menu-' + set.gs + '-' + nidx + '-' + pn.id"
                                                                                            :href="pn.dcc_url"
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            class="fbr-provenance-menu-link d-block px-2 py-1 small text-dark text-decoration-none"
                                                                                        >{{ pn.id }}</a>
                                                                                    </div>
                                                                                </div>
                                                                            </template>
                                                                            <span v-else-if="c2m2ProvenanceEntry(set.gs) && c2m2ProvenanceEntry(set.gs).status === 'loading'" class="text-muted small">Provenance…</span>
                                                                            <template v-else>
                                                                                <div v-if="set.program" class="pill">{{ set.program }}</div>
                                                                            </template>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div v-if="mechanism.next_steps && mechanism.next_steps.length" class="mt-2 mb-1 border-top pt-3">
                                                <div class="font-weight-bold small text-uppercase text-muted mb-2">Recommended next steps</div>
                                                <div class="d-flex flex-column" style="gap:8px">
                                                    <div
                                                        v-for="(step, sidx) in mechanism.next_steps"
                                                        :key="'step-' + idx + '-' + sidx"
                                                        class="p-2 border rounded bg-white"
                                                        style="border-left: 4px solid #f16822 !important;"
                                                    >
                                                        <span class="badge badge-secondary mr-2 mb-1">{{ step.category }}</span><br />
                                                        <strong class="text-dark" style="font-size: 0.95em;">{{ step.action }}</strong>
                                                        <span class="small text-muted"> {{ step.reason }}</span>
                                                        <div
                                                            v-if="isNextStepExperimentalValidation(step)"
                                                            class="mt-2"
                                                        >
                                                            <button
                                                                type="button"
                                                                class="btn btn-cfde btn-sm"
                                                                @click.stop="openDesignProtocolForMechanism(mechanism, step)"
                                                            >
                                                                Design experiment protocol
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                v-if="mechanism.next_queries && mechanism.next_queries.length"
                                                class="reveal-alt-queries-block mt-3 mb-0 border-top pt-3"
                                            >
                                                <div class="font-weight-bold small text-muted mb-1">Explore further (next queries)</div>
                                                <ul class="reveal-alt-query-links mb-0">
                                                    <li
                                                        v-for="(query, qidx) in mechanism.next_queries"
                                                        :key="'nq-' + idx + '-' + qidx"
                                                    >
                                                        <a
                                                            href="#"
                                                            class="reveal-alt-query-link"
                                                            @click.prevent="onAlternativeQuerySelected(query)"
                                                        >{{ query }}</a>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div
                                                class="mechanism-llm-handoff-actions d-flex flex-wrap align-items-center mt-3 pt-3 border-top"
                                                style="gap: 8px;"
                                            >
                                                <button
                                                    type="button"
                                                    class="btn btn-sm btn-outline-secondary"
                                                    @click.stop="copyMechanismForLlm(mechanism, idx)"
                                                >
                                                    <b-icon icon="clipboard" class="mr-1"></b-icon>
                                                    {{ handoffCopiedMechanismIndex === idx ? 'Copied!' : 'Copy for LLM' }}
                                                </button>
                                                <button
                                                    type="button"
                                                    class="btn btn-sm btn-outline-secondary"
                                                    @click.stop="downloadMechanismHandoffPackage(mechanism, idx)"
                                                >
                                                    <b-icon icon="download" class="mr-1"></b-icon>
                                                    Download handoff data
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Remaining: included pairs not yet cited in hypothesis evidence -->
                                    <div
                                        v-if="remainingGeneSetClusterRows.length"
                                        class="remaining-gene-clusters mt-5 pt-4 border-top"
                                    >
                                        <div class="font-weight-bold mb-2" style="color: #FF6600; font-size: 1.2em;">
                                            Remaining gene set clusters
                                        </div>
                                        <p class="text-muted small mb-3">
                                            These phenotype-gene set cluster pairs were included in your data selection but are not yet covered by supporting evidence in the generated hypotheses.
                                        </p>
                                        <div v-if="remainingPairGenerateError" class="alert alert-danger small mb-3" role="alert">
                                            {{ remainingPairGenerateError }}
                                        </div>
                                        <div class="criteria-detail">
                                            <div>
                                                        <b-table-simple v-if="isPhenotypePath" small striped hover class="mb-0">
                                                            <thead variant="light">
                                                                <tr>
                                                                    <th style="width: 72px;">Included</th>
                                                                    <th style="width: auto;">Phenotype</th>
                                                                    <th style="width: auto;">Trait group</th>
                                                                    <th style="width: 300px;">Genes and gene sets in cluster</th>
                                                                    <th style="width: 130px;">Hypothesis</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody v-for="row in remainingFactorTableRowsPaged" :key="'rem-' + getRowKey(row)">
                                                                <tr>
                                                                    <td>
                                                                        <div class="text-center">
                                                                            <input type="checkbox" :checked="row.included" class="form-check-input d-inline-block" aria-label="Included" />
                                                                        </div>
                                                                    </td>
                                                                    <td>{{ getPhenotypeDisplay(row.phenotype) }}</td>
                                                                    <td>{{ getFactorClusterDisplay(row) }}</td>
                                                                    <td style="text-align: center;">
                                                                        <button
                                                                            class="btn btn-sm btn-outline-primary"
                                                                            @click="toggleFactorGenesRow({ item: row })"
                                                                        >
                                                                            {{ isFactorRowExpanded(row) ? 'Hide' : 'Show' }}
                                                                        </button>
                                                                    </td>
                                                                    <td class="text-center align-middle">
                                                                        <button
                                                                            type="button"
                                                                            class="btn btn-sm btn-cfde"
                                                                            :disabled="generatingRemainingRowKey === getRowKey(row)"
                                                                            @click="generateHypothesisForRemainingPair(row)"
                                                                        >
                                                                            <b-spinner v-if="generatingRemainingRowKey === getRowKey(row)" small class="mr-1"></b-spinner>
                                                                            <template v-if="generatingRemainingRowKey === getRowKey(row)">Generating… {{ formatRemainingGenerateElapsed() }}</template>
                                                                            <template v-else>Generate</template>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                                <tr v-if="isFactorRowExpanded(row)">
                                                                    <td colspan="5" class="p-0 border-0">
                                                                        <div class="bg-light" style="display:flex; gap: 20px;">
                                                                            <div v-if="getGenesetForFactor(row.phenotype, row.factor)" class="py-2 px-3" style="display:flex; flex:1; flex-direction: column;">
                                                                                <div class="small text-muted mb-2">Gene sets in cluster</div>
                                                                                <b-table
                                                                                    striped
                                                                                    hover
                                                                                    small
                                                                                    responsive="sm"
                                                                                    head-variant="light"
                                                                                    :items="getGenesetForFactor(row.phenotype, row.factor)"
                                                                                    :fields="[
                                                                                        { key: 'geneset', label: 'Gene Set', thClass: 'text-nowrap'},
                                                                                        { key: 'program', label: 'Program', thClass: 'text-nowrap'},
                                                                                        { key: 'actions', label: 'Source Data', thClass: 'text-nowrap'}
                                                                                    ]"
                                                                                >
                                                                                    <template #cell(geneset)="gRow">
                                                                                        <a
                                                                                            :href="cfdeExploreAssociationHref(row.phenotype, gRow.item.geneset, gRow.item.program)"
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            class="cfde-explore-geneset-link truncate-cell d-inline-block"
                                                                                            :title="gRow.item.geneset"
                                                                                            style="max-width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                                                        >{{ gRow.item.geneset }}</a>
                                                                                    </template>
                                                                                    <template #cell(actions)="gRow">
                                                                                        <button
                                                                                            v-if="gRow.item.program === 'gtex'"
                                                                                            class="btn btn-sm btn-outline-primary"
                                                                                            @click="onGeneSetRowToggled(gRow)"
                                                                                        >
                                                                                            {{ gRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                                        </button>
                                                                                    </template>
                                                                                    <template #row-details="gRow">
                                                                                        <div style="padding: 10px;">
                                                                                            <div v-if="gene_set_sources[gRow.item.geneset]">
                                                                                                <b-card>
                                                                                                    <a :href="gene_set_sources[gRow.item.geneset].geneSetUrl" target="_blank">{{ gene_set_sources[gRow.item.geneset].geneSet }}</a>
                                                                                                    <ul>
                                                                                                        <li v-for="(rel, i) in gene_set_sources[gRow.item.geneset].relations" :key="i" class="text-muted small">
                                                                                                            <div>
                                                                                                                <strong>{{rel.method.predicate}}: </strong><a :href="rel.file.dcc_url" target="_blank">{{ rel.file.filename }}</a>
                                                                                                            </div>
                                                                                                            <div>
                                                                                                                via
                                                                                                                <a :href="rel.method.script" target="_blank">{{ rel.method.type }}</a>
                                                                                                                ({{ rel.method.direction }})
                                                                                                            </div>
                                                                                                        </li>
                                                                                                    </ul>
                                                                                                </b-card>
                                                                                            </div>
                                                                                            <div v-else>no data available yet.</div>
                                                                                        </div>
                                                                                    </template>
                                                                                </b-table>
                                                                            </div>
                                                                            <div class="subtable-container py-2 px-3" style="flex:1">
                                                                                <div v-if="loadingGenesForFactor[getRowKey(row)]" class="small text-muted mb-2">Loading genes…</div>
                                                                                <div v-else class="small text-muted mb-2">Genes in factor ({{ getGenesForFactor(row.phenotype, row.factor).length }} rows)</div>
                                                                                <b-table
                                                                                    v-if="!loadingGenesForFactor[getRowKey(row)]"
                                                                                    striped
                                                                                    hover
                                                                                    small
                                                                                    responsive="sm"
                                                                                    head-variant="light"
                                                                                    :items="getGenesForFactor(row.phenotype, row.factor)"
                                                                                    :fields="[
                                                                                        { key: 'gene', label: 'Gene', thStyle: { width: '100px' } },
                                                                                        { key: 'combined', label: 'Combined score', thStyle: { width: '110px' } },
                                                                                        { key: 'gwasSupport', label: 'GWAS support', thStyle: { width: '110px' } },
                                                                                        { key: 'geneSetSupport', label: 'Functional support', thStyle: { width: '120px' } }
                                                                                    ]"
                                                                                    :per-page="subtablePerPage"
                                                                                    :current-page="getSubtableCurrentPage(row)"
                                                                                />
                                                                                <b-pagination
                                                                                    v-if="!loadingGenesForFactor[getRowKey(row)] && getGenesForFactor(row.phenotype, row.factor).length > subtablePerPage"
                                                                                    v-model="subtableCurrentPages[getRowKey(row)]"
                                                                                    class="pagination-sm justify-content-center mt-2"
                                                                                    :total-rows="getGenesForFactor(row.phenotype, row.factor).length"
                                                                                    :per-page="subtablePerPage"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </b-table-simple>
                                                        <b-table
                                                            v-else
                                                            :items="remainingGeneSetClusterRowsPaged"
                                                            primary-key="_rowKey"
                                                            :fields="[
                                                                { key: 'included', label: 'Included', thStyle: { width: '72px' }, stickyColumn: false },
                                                                { key: 'phenotype', label: 'Phenotype', thStyle: { width: '120px' } },
                                                                { key: 'factorLabel', label: 'Trait group', thStyle: { width: '180px' } },
                                                                { key: 'rationale', label: 'Selection rationale', thStyle: { width: '220px' } },
                                                                { key: 'view_genes', label: 'Genes and gene sets in cluster', thStyle: { width: '140px' } },
                                                                { key: 'hypothesis', label: 'Hypothesis', thStyle: { width: '130px' } }
                                                            ]"
                                                            small
                                                            striped
                                                            hover
                                                            head-variant="light"
                                                        >
                                                            <template #cell(included)="row">
                                                                <div class="text-center">
                                                                    <input type="checkbox" :checked="row.item.included" class="form-check-input d-inline-block" aria-label="Included in selection" />
                                                                </div>
                                                            </template>
                                                            <template #cell(phenotype)="row">
                                                                {{ getPhenotypeDisplay(row.item.phenotype) }}
                                                            </template>
                                                            <template #cell(factorLabel)="row">
                                                                {{ getFactorClusterDisplay(row.item) }}
                                                            </template>
                                                            <template #cell(rationale)="row">
                                                                <span v-if="row.item.rationale" class="small text-muted" style="white-space: normal;">{{ row.item.rationale }}</span>
                                                                <span v-else class="small text-muted">—</span>
                                                            </template>
                                                            <template #cell(view_genes)="row">
                                                                <button
                                                                    class="btn btn-sm btn-outline-primary"
                                                                    @click="toggleFactorGenesRow(row)"
                                                                >
                                                                    {{ isFactorRowExpanded(row.item) ? 'Hide' : 'Show' }}
                                                                </button>
                                                            </template>
                                                            <template #cell(hypothesis)="row">
                                                                <button
                                                                    type="button"
                                                                    class="btn btn-sm btn-cfde"
                                                                    :disabled="generatingRemainingRowKey === getRowKey(row.item)"
                                                                    @click="generateHypothesisForRemainingPair(row.item)"
                                                                >
                                                                    <b-spinner v-if="generatingRemainingRowKey === getRowKey(row.item)" small class="mr-1"></b-spinner>
                                                                    <template v-if="generatingRemainingRowKey === getRowKey(row.item)">Generating… {{ formatRemainingGenerateElapsed() }}</template>
                                                                    <template v-else>Generate</template>
                                                                </button>
                                                            </template>
                                                            <template #row-details="row">
                                                                <div class="bg-light" style="display:flex; gap: 20px;">
                                                                    <div v-if="getGenesetForFactor(row.item.phenotype, row.item.factor)" class="py-2 px-3" style="display:flex; flex:1; flex-direction: column;">
                                                                        <div class="small text-muted mb-2">Gene sets in cluster</div>
                                                                        <b-table
                                                                            striped
                                                                            hover
                                                                            small
                                                                            responsive="sm"
                                                                            head-variant="light"
                                                                            :items="getGenesetForFactor(row.item.phenotype, row.item.factor)"
                                                                            :fields="[
                                                                                { key: 'geneset', label: 'Gene Set', thClass: 'text-nowrap'},
                                                                                { key: 'program', label: 'Program', thClass: 'text-nowrap'},
                                                                                { key: 'actions', label: 'Source Data', thClass: 'text-nowrap'}
                                                                            ]"
                                                                        >
                                                                            <template #cell(geneset)="gRow">
                                                                                <a
                                                                                    :href="cfdeExploreAssociationHref(row.item.phenotype, gRow.item.geneset, gRow.item.program)"
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    class="cfde-explore-geneset-link truncate-cell d-inline-block"
                                                                                    :title="gRow.item.geneset"
                                                                                    style="max-width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                                                >{{ gRow.item.geneset }}</a>
                                                                            </template>
                                                                            <template #cell(actions)="gRow">
                                                                                <button
                                                                                    v-if="gRow.item.program === 'gtex'"
                                                                                    class="btn btn-sm btn-outline-primary"
                                                                                    @click="onGeneSetRowToggled(gRow)"
                                                                                >
                                                                                    {{ gRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                                </button>
                                                                            </template>
                                                                            <template #row-details="gRow">
                                                                                <div style="padding: 10px;">
                                                                                    <div v-if="gene_set_sources[gRow.item.geneset]">
                                                                                        <b-card>
                                                                                            <a :href="gene_set_sources[gRow.item.geneset].geneSetUrl" target="_blank">{{ gene_set_sources[gRow.item.geneset].geneSet }}</a>
                                                                                            <ul>
                                                                                                <li v-for="(rel, i) in gene_set_sources[gRow.item.geneset].relations" :key="i" class="text-muted small">
                                                                                                    <div>
                                                                                                        <strong>{{rel.method.predicate}}: </strong><a :href="rel.file.dcc_url" target="_blank">{{ rel.file.filename }}</a>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        via
                                                                                                        <a :href="rel.method.script" target="_blank">{{ rel.method.type }}</a>
                                                                                                        ({{ rel.method.direction }})
                                                                                                    </div>
                                                                                                </li>
                                                                                            </ul>
                                                                                        </b-card>
                                                                                    </div>
                                                                                    <div v-else>no data available yet.</div>
                                                                                </div>
                                                                            </template>
                                                                        </b-table>
                                                                    </div>
                                                                    <div class="subtable-container py-2" style="flex:1">
                                                                        <div class="small text-muted mb-2">Genes in factor ({{ getGenesForFactor(row.item.phenotype, row.item.factor).length }} rows)</div>
                                                                        <b-table
                                                                            striped
                                                                            hover
                                                                            small
                                                                            responsive="sm"
                                                                            head-variant="light"
                                                                            :items="getGenesForFactor(row.item.phenotype, row.item.factor)"
                                                                            :fields="[
                                                                                { key: 'gene', label: 'Gene', thStyle: { width: '100px' } },
                                                                                { key: 'combined', label: 'Combined score', thStyle: { width: '110px' } },
                                                                                { key: 'gwasSupport', label: 'GWAS support', thStyle: { width: '110px' } },
                                                                                { key: 'geneSetSupport', label: 'Functional support', thStyle: { width: '120px' } }
                                                                            ]"
                                                                            :per-page="subtablePerPage"
                                                                            :current-page="getSubtableCurrentPage(row.item)"
                                                                        />
                                                                        <b-pagination
                                                                            v-if="getGenesForFactor(row.item.phenotype, row.item.factor).length > subtablePerPage"
                                                                            v-model="subtableCurrentPages[getRowKey(row.item)]"
                                                                            class="pagination-sm justify-content-center mt-2"
                                                                            :total-rows="getGenesForFactor(row.item.phenotype, row.item.factor).length"
                                                                            :per-page="subtablePerPage"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </template>
                                                        </b-table>
                                                        <b-pagination
                                                            v-if="(isPhenotypePath ? remainingFactorDataTableRowsWithRationaleMeta.length : remainingGeneSetClusterRows.length) > mainTablePerPage"
                                                            v-model="remainingTableCurrentPage"
                                                            class="pagination-sm justify-content-center mt-2"
                                                            :total-rows="isPhenotypePath ? remainingFactorDataTableRowsWithRationaleMeta.length : remainingGeneSetClusterRows.length"
                                                            :per-page="mainTablePerPage"
                                                        />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!--
                <p v-if="!searchCriteria && !loading_search_criteria && !error_search_criteria" class="text-muted mb-0">Enter a research question above and click Search to extract search terms and context.</p>
                -->
                <!--
                <div v-if="loadStatus" class="load-indicator mt-3 mb-2">
                    <b-spinner v-if="!loadComplete" small class="mr-2"></b-spinner>
                    <span :class="loadComplete ? 'text-success' : 'text-muted'">{{ loadStatus }}{{ loadStepSeconds > 0 ? ' (' + loadStepSeconds + 's)' : '' }}</span>
                </div>
                -->
            </div>
        </div>

        <div v-if="all_supporting_network" 
        style="position: absolute; z-index: 999; top: 200px; right: 50px">
            <factor-base-reveal-network
                :key="999"
                :ref="'mechanismNetwork-' + 999"
                :network="all_supporting_network"
                :genes="[]"
                :width="640"
                :height="360"
                :show-popup-button="true"
                @open-popup="openNetworkPopup(999)"
            />
        </div>

        <!-- Network viz popup: 90% window size -->
        <div
            v-if="
                networkPopupMechanismIndex !== null &&
                mechanisms &&
                mechanisms[networkPopupMechanismIndex] &&
                (!networkPopupIsHypothesisMap ||
                    (mechanisms[networkPopupMechanismIndex].core_spine_network &&
                        mechanisms[networkPopupMechanismIndex].core_spine_network.nodes &&
                        mechanisms[networkPopupMechanismIndex].core_spine_network.nodes.length))
            "
            class="network-popup-overlay"
            @click.self="closeNetworkPopup"
        >
            <div class="network-popup-box">
                <div class="network-popup-header d-flex justify-content-between align-items-center">
                    <span class="font-weight-bold">{{
                        networkPopupIsHypothesisMap ? "Hypothesis map (biological mechanism)" : "Supporting network"
                    }}</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" aria-label="Close" @click="closeNetworkPopup">
                        <b-icon icon="x"></b-icon>
                    </button>
                </div>
                <div class="network-popup-body">
                    <factor-base-reveal-network
                        :key="'popup-' + networkPopupMechanismIndex + '-' + (networkPopupIsHypothesisMap ? 'hypothesis' : 'supporting')"
                        :network="
                            networkPopupIsHypothesisMap
                                ? mechanisms[networkPopupMechanismIndex].core_spine_network
                                : mechanisms[networkPopupMechanismIndex].supporting_network ||
                                  mechanisms[networkPopupMechanismIndex].network
                        "
                        :genes="mechanisms[networkPopupMechanismIndex].candidate_genes || mechanisms[networkPopupMechanismIndex].genes || []"
                        :width="popupNetworkWidth"
                        :height="popupNetworkHeight"
                        :show-popup-button="false"
                        :is-mechanism-flow-map="networkPopupIsHypothesisMap"
                        :is-biolink-map="networkPopupIsHypothesisMap && isMechanismUsingBiolinkMap(mechanisms[networkPopupMechanismIndex])"
                        :show-hypothesis-map-view-toggle="
                            networkPopupIsHypothesisMap &&
                            hasMechanismBiolinkNetwork(mechanisms[networkPopupMechanismIndex])
                        "
                        :show-original-hypothesis-map="
                            networkPopupIsHypothesisMap &&
                            !isMechanismUsingBiolinkMap(mechanisms[networkPopupMechanismIndex])
                        "
                        @hypothesis-original-map="
                            setMechanismMapViewMode(
                                networkPopupMechanismIndex,
                                $event ? 'original' : 'biolink'
                            )
                        "
                    />
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import BootstrapVue from "bootstrap-vue";
import keyParams from "@/utils/keyParams";
import { createLLMClient } from "@/utils/llmClient";
import { kcURL, resolveCfdePhenotypeLabel, resolveCfdeFactorClusterDisplayLabel } from "@/utils/cfdeUtils";
import uiUtils from "@/utils/uiUtils";
import { colorForGeneRole } from "@/utils/factorRevealGeneColors";

import FactorBaseRevealNetwork from "./FactorBaseRevealNetwork2.vue";
import FactorBaseRevealHeatmap from "./FactorBaseRevealHeatmap2.vue";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { divide } from "lodash";

Vue.use(BootstrapVueIcons);
Vue.use(BootstrapVue);

export default Vue.component("factor-base-reveal", {
    components: { FactorBaseRevealNetwork, FactorBaseRevealHeatmap },
    props: {},
    data() {
        return {
            userQuery: "",
            searchMode: "auto",
            /** Rotating best-practice placeholder examples (Strict Anchor + Semantic Net + Context + Phenotype). */
            placeholderExamples: [
                "Describe what you're researching or curious about...",
                "e.g., Find a microglial phagocytosis mechanism involving TREM2 in the cortex linked to amyloid-beta clearance.",
                "e.g., Find a short-chain fatty acid receptor mechanism involving FFAR3 in the intestinal epithelium that alters systemic insulin sensitivity.",
                "e.g., Find a lipid droplet biogenesis mechanism involving GPAM in hepatocytes that drives triglyceride accumulation and NAFLD.",
            ],
            currentPlaceholderIndex: 0,
            placeholderIntervalId: null,
            placeholderRotationPaused: false,
            /** Avoid pausing rotation from the component's initial programmatic focus(). */
            suppressNextQueryFocusPause: false,
            /** Collapsed by default; expands query-building documentation below the search box. */
            queryGuidelinesExpanded: false,
            searchCriteria: null,
            display_search_criteria: false,
            edit_search_criteria: false,
            prev_search_criteria: null,
            searchCriteriaEditRows: [],
            searchCriteriaEditRowsDefault: [],
            lastAlternativeQueries: [],
            /** Gene symbols from LLM extraction (and gate edits), forwarded to hybrid-search as genes_of_interest. */
            lastGenesOfInterest: [],
            /** Latest hybrid-search response meta (lexical fusion, genes-of-interest resolution). */
            lastHybridSearchMeta: {},
            /** Full JSON body from the last successful hybrid-search API (for raw download). */
            lastHybridSearchResponse: null,
            /** After user continues past step-1 review, keep extracted-terms table available when re-expanding the substep. */
            searchCriteriaExtractionGateDone: false,
            loading_search_criteria: false,
            error_search_criteria: false,
            error_msg_search_criteria: "",
            allow_retry: true,
            searchTerm: "",
            lastPhenotypeTerms: [],
            lastMechanismTerms: [],
            /** Map phenotype id -> description for display; queries still use id. */
            phenotypeDescriptionById: {},
            factorData: {},
            loadStatus: "",
            statusSteps: [],
            steps: [],
            stepsTime: null,
            stepsTimer: null,
            stepsPausedAt: null,
            now: Date.now(),
            loadComplete: false,
            genesAndFactorValuesLoaded: false,
            loadStepSeconds: 0,
            loadStepTimerId: null,
            lastKgTriples: [],
            lastFlattenedKG: null,
            error_mechanisms: false,
            error_msg_mechanisms: "",
            mechanisms: null,
            mechanisms_summary: null,
            /** Last mechanism index whose copy-to-clipboard succeeded (for transient "Copied!" state). */
            handoffCopiedMechanismIndex: null,
            handoffCopiedResetTimerId: null,
            /** Per-card loading state for post-hoc Biolink mapping calls. */
            biolinkMappingByMechanism: {},
            /** Per-card: TRAPI edge validation running after Biolink nodes are mapped. */
            biolinkTrapiValidatingByMechanism: {},
            /** Bumped when a mechanism is remapped; stale TRAPI runs stop patching. */
            biolinkTrapiValidationGeneration: {},
            /** Cache: normalized free-text label -> { curie, resolverLabel } from Name Resolution. */
            biolinkNameResolveByLabelCache: {},
            /** Cache: CURIE -> normalized node details from NodeNormalizer. */
            biolinkNodeByCurieCache: {},
            /** From mechanism LLM when can_generate_hypothesis is false or partial warnings. */
            mechanismDiagnosticAssessment: null,
            /** User approval gates at key workflow breakpoints. */
            stepApprovalGateActive: false,
            stepApprovalGateStepId: "",
            stepApprovalGateMessage: "",
            stepApprovalGateResolver: null,
            display_mechanisms: true,
            /** Row keys (phenotype|factor) for pairs user generated via "Generate" in Remaining section; removes row from that table. */
            adHocCoveredRowKeys: [],
            /** While set, matching row's Generate shows loading. */
            generatingRemainingRowKey: "",
            /** Start time (ms) for elapsed display on remaining-cluster Generate. */
            remainingGenerateStartedAt: null,
            /** Updated on interval while generating so elapsed time is reactive. */
            remainingGenerateNow: Date.now(),
            remainingGenerateTimerId: null,
            remainingPairGenerateError: "",
            pairSelectionOverrides: {},
            llmFilteredPairKeysBaseline: [],
            display_phenotypes_factors: true,
            subtablePerPage: 10,
            subtableCurrentPages: {},
            mainTablePerPage: 10,
            mainTableCurrentPage: 1,
            remainingTableCurrentPage: 1,
            expandedFactorRowKeys: {},
            loadingGenesForFactor: {},
            /** When set, show network viz in a floating overlay at 90% window size. Value = mechanism index. */
            networkPopupMechanismIndex: null,
            /** When true, overlay shows core_spine_network (hypothesis map); when false, supporting network. */
            networkPopupIsHypothesisMap: false,
            popupNetworkWidth: 960,
            popupNetworkHeight: 640,

            /** Reveal hybrid-search API base (production: search.hugeamp.org; override via VUE_APP_REVEAL_HYBRID_BASE_URL for local dev). */
            hybridSearchBaseUrl: (typeof process !== "undefined" && process.env && process.env.VUE_APP_REVEAL_HYBRID_BASE_URL)
                ? String(process.env.VUE_APP_REVEAL_HYBRID_BASE_URL).replace(/\/$/, "")
                : "https://search.hugeamp.org",
            /**
             * Biolink API base for Name Resolution + NodeNorm + TRAPI edge validation.
             * Defaults to search.hugeamp.org deployment; override via VUE_APP_REVEAL_BIOLINK_PROXY_BASE_URL for local dev.
             * Example dev: VUE_APP_REVEAL_BIOLINK_PROXY_BASE_URL=http://localhost:3000
             */
            revealBiolinkProxyBaseUrl: (typeof process !== "undefined" && process.env && process.env.VUE_APP_REVEAL_BIOLINK_PROXY_BASE_URL)
                ? String(process.env.VUE_APP_REVEAL_BIOLINK_PROXY_BASE_URL).replace(/\/$/, "")
                : (typeof process !== "undefined" && process.env && process.env.VUE_APP_REVEAL_HYBRID_BASE_URL)
                    ? String(process.env.VUE_APP_REVEAL_HYBRID_BASE_URL).replace(/\/$/, "")
                : "https://search.hugeamp.org",
            /** When false, omit query_embedding; backend embeds (ALLOW_SERVER_SIDE_EMBEDDING). When true, FE must call Ollama and send query_embedding. */
            hybridSearchUseClientEmbedding: (typeof process !== "undefined" && process.env && process.env.VUE_APP_HYBRID_CLIENT_EMBEDDING === "true"),
            /** POST timeout for hybrid search (ms); server may run DB + Ollama. */
            hybridSearchTimeoutMs: 120000,
            ollamaEmbedUrl: (typeof process !== "undefined" && process.env && process.env.VUE_APP_OLLAMA_EMBED_URL)
                ? String(process.env.VUE_APP_OLLAMA_EMBED_URL)
                : "http://127.0.0.1:11434/api/embed",
            hybridEmbedModel: "mxbai-embed-large",
            hybridEmbedExpectedDim: 1024,

            all_supporting_network: null,
            gene_set_sources: {},

            NODE_COLORS: {
                Phenotype: "#e41a1c",
                Factor: "#377eb8",
                Pathway: "#4daf4a",
                Gene: "#984ea3",
                /** C2M2 provenance bubbles (distinct from pathway / gene-set green). */
                C2M2Provenance: "#3182ce",
                /** Program pill when C2M2 file downloads are available (hover for menu). */
                GeneSetProgramDownloads: "#6f42c1",
            },
            /**
             * c2m2-provenance API: { [geneSetId]: { status: 'loading'|'ok'|'empty'|'error', nodes: [{ id, dcc_url, labels }] } }
             */
            c2m2ProvenanceByGeneSet: {},

            showTab: 'terms',
            /** After user continues past KG gate, enable the Results tab until the next full reset. */
            revealResultsTabUnlocked: false,

extractSystemPrompt:`
You are an expert biomedical bioinformatics assistant. Your task is to parse a user's biological query and extract the core concepts into a strict JSON format with five fields: "phenotype_terms" (array of strings), "genes_of_interest" (array of strings), "mechanism_terms" (comma-separated string), "research_context" (string), and "suggested_queries" (array of strings). You must output ONLY raw, valid JSON. Do not wrap your response in markdown code blocks or include any conversational text.

CRITICAL INSTRUCTIONS FOR "phenotype_terms" (THE NULL SAFETY RULE):
1. Mechanistic Queries: If the user is asking about a specific biological mechanism, intracellular pathway, cell type, or molecular interaction, you MUST leave the "phenotype_terms" array EMPTY []. This applies even if a broad disease is mentioned anywhere in the prompt; the presence of a mechanism always overrides the disease.
2. Broad Disease Queries: ONLY populate the "phenotype_terms" array if the user is asking a purely generic, broad question about a disease or trait (e.g., "Find genes for Type 2 Diabetes") with no specific mechanism attached.

INSTRUCTIONS FOR "genes_of_interest":
Extract specific, explicit gene or protein symbols mentioned by the user (e.g., TRAP1, CNDP2, SIRT1, PCSK9). Output this as an array of strings formatted exactly as mentioned (e.g., ["TRAP1", "SIRT1"]). Do NOT put metabolites (e.g., lactate), broad protein classes (e.g., kinases), or pathways in this list. If no specific genes are explicitly mentioned in the query, leave the array EMPTY [].

INSTRUCTIONS FOR "mechanism_terms":
Extract the core biological mechanisms, specific metabolites, or molecular targets EXPLICITLY mentioned in the query. DO NOT over-expand the list with downstream pathways, unmentioned gene families, or tangentially related biological processes (e.g., if the user asks about TRAP1, do not list every senescence pathway). Distill the user's intent into a STRICT MAXIMUM of 3 to 5 highly precise, comma-separated search terms to ensure targeted exact-matching. 

INSTRUCTIONS FOR "research_context":
Write a clear, 1-2 sentence summary of the biological investigation including both the mechanisms and diseases.

CRITICAL INSTRUCTIONS FOR "suggested_queries":
First, strictly evaluate the user's query against the following four Optimal Query Guidelines:
1. Anchor: Explicitly names a specific gene, protein, metabolite, or cellular structure/state to force graph anchoring.
2. Semantic Net: Defines a specific conceptual biochemical mechanism or pathway.
3. Spatial Anchoring: Specifies a tissue, cell type, or anatomical location.
4. Phenotypic Scope: Limits the outcome to a specific clinical trait, biomarker, or focused disease state.

EVALUATION ACTION:
- If the user's query successfully meets ALL FOUR of these guidelines, it is already fully optimized. You MUST leave the "suggested_queries" array EMPTY [] to avoid confusing the user with redundant alternatives.
- If the user's query FAILS ANY of these guidelines (e.g., it is a broad disease search, lacks a tissue context, or lacks a specific anchor), generate 2 to 3 highly specific, optimized alternative search queries based on their original intent. These suggestions MUST strictly follow the "Anchor + Semantic Net" formula:
"Find a [Broad Mechanism/Semantic Net] involving [Explicit Anchor] in [Cell/Tissue Type] that drives [Specific Biomarker/Phenotype]."

OUT OF DOMAIN INSTRUCTION:
If the user's query is not related to biology or bioinformatics, return empty arrays for phenotype_terms, genes_of_interest, and suggested_queries; use empty strings for mechanism_terms and research_context.

EXAMPLES:

User: "Find an oxidative phosphorylation mechanism involving TRAP1 in vascular smooth muscle cells that promotes atherosclerosis."
Output:
{
  "phenotype_terms": [],
  "genes_of_interest": ["TRAP1"],
  "mechanism_terms": "oxidative phosphorylation, mitochondrial dysfunction, metabolic reprogramming",
  "research_context": "Investigating how the TRAP1 mitochondrial chaperone alters oxidative phosphorylation in vascular smooth muscle cells to drive atherosclerosis.",
  "suggested_queries": [] 
}
// (Note: suggested_queries is empty because the user's prompt perfectly met all 4 Optimal Query Guidelines.)

User: "Find a microbiome-metabolite mechanism linking host signaling to insulin resistance."
Output:
{
  "phenotype_terms": [],
  "genes_of_interest": [],
  "mechanism_terms": "gut microbiota-derived metabolites, short-chain fatty acids (SCFAs), microbial metabolite receptors",
  "research_context": "Investigating how gut microbiome-derived metabolites modulate host signaling pathways to influence insulin resistance and Type 2 Diabetes.",
  "suggested_queries": [
    "Find a short-chain fatty acid receptor mechanism involving GPR43 in the intestinal epithelium that alters systemic insulin sensitivity.",
    "Find a secondary bile acid signaling mechanism involving FXR in hepatocytes linked to glucose tolerance."
  ]
}
// (Note: suggested_queries populated because the user lacked a specific anchor and tissue context.)

User: "What are the genes for early-onset Alzheimer's disease?"
Output:
{
  "phenotype_terms": ["Alzheimer's disease", "early-onset Alzheimer's", "dementia", "neurodegeneration"],
  "genes_of_interest": [],
  "mechanism_terms": "",
  "research_context": "Investigating the primary genetic drivers and risk factors associated with early-onset Alzheimer's disease.",
  "suggested_queries": [
    "Find a microglial phagocytosis mechanism involving TREM2 in the cortex linked to amyloid-beta clearance.",
    "Find a lipid transport mechanism involving APOE in astrocytes associated with early-onset neurodegeneration."
  ]
}
`,

mechanismHypothesisSystemPrompt: `
You are an expert in bioinformatics. Each request gives you (1) UI-selected phenotype–gene-set-cluster identifiers for grouping (\`associated_pairs\` must match those strings), (2) a **phenotype / gene / gene-set** knowledge graph as CSV with row \`id\`s (no separate gene-set-cluster nodes—only phenotypes, gene sets as pathway objects, and genes), (3) a JSON summary of phenotypes with merged genes and gene-set names from hybrid retrieval, plus critical metadata about requested/missing genes, and (4) research context.

### Task
Produce one or more mechanistic hypotheses across the provided pairs, OR strictly reject the prompt if graph topology fails to support the query. 

### Discovery logic
1. **Modifier rule:** Each hypothesis MUST relate a well-known gene (when present in the KG for that group) with at least one 'Functional (Novel)' category gene from the data where possible.
2. **Gene sets:** The CSV links phenotypes to gene sets with \`associated_with\` (phenotype subject, gene set object), genes to gene sets with \`contributes_to_pathway\`, and phenotypes to genes with \`contains_gene\`. Treat those as the full pathway layer—there is no factor/cluster node between phenotype and gene set.
3. **Support priority:** Prefer genes with \`context_combined_score\` on \`contains_gene\` rows; prioritize strong functional signal where appropriate.
4. **Data fidelity:** Use only labels and categories present in the KG CSV.
5. **Site of Action Constraint:** The mechanistic hypothesis MUST take place in the specific anatomical location defined in the research context. Do not shift the mechanism to a different organ simply because the provided gene sets originate from there. If the data comes from a different organ, explain how the products of those genes circulate to influence the target anatomical site.

### STRICT ANTI-HALLUCINATION DIRECTIVES (THE "SAY NO" RULES)
Before building a hypothesis, you MUST evaluate the provided JSON \`meta\` block and graph topology. LLMs naturally try to invent biological cross-talk—DO NOT DO THIS. You must rely STRICTLY on the data. If the data triggers any of the following cases, adjust the \`diagnostic_assessment\` object accordingly.

* **Case 1: The "Missing Edge" Phenomenon (Dropped Entities)**
  * *Trigger:* \`genes_of_interest_missing_from_response\` is NOT empty.
  * *Action:* * If ALL requested genes are missing: Set \`can_generate_hypothesis\` to false. Set \`rejection_reason\` to: "While [Missing Genes] were queried, the Knowledge Graph topology does not contain strong enough direct edges linking them to the retrieved phenotypes, gene sets, and genes. No mechanism can be confirmed." Leave \`hypotheses\` empty.
    * If PARTIAL HIT (some found, some missing): Set \`can_generate_hypothesis\` to true. Set \`warning_flag\` to: "Note: While [Found Genes] anchored the mechanism, [Missing Genes] lacked sufficient graph edges to be included in this specific network." Generate hypothesis using ONLY found genes.

* **Case 2: The "Unmapped Entity" (Absent from Database)**
  * *Trigger:* \`genes_of_interest_absent_from_db\` is NOT empty.
  * *Action:* (Same logic as Case 1: Reject if all are absent. Warn and proceed if partial hit).

* **Case 3: The "Hub Gravity" Hijack (Phenotypic Disconnect)**
  * *Trigger:* Compare gene set names and phenotype terms in the CSV and JSON summary to the user's queried phenotype in research context. If retrieved gene sets and annotations belong to a distinct, unrelated disease domain (e.g., user asks for "Diabetes" but the graph is dominated by unrelated domains), you MUST reject. Do not invent cross-talk.
  * *Action:* Set \`can_generate_hypothesis\` to false. Set \`rejection_reason\` to: "The retrieved graph is dominated by pathways and gene associations distant from [Queried Phenotype]; the targeted mechanism is eclipsed by stronger canonical edges." Leave \`hypotheses\` empty.

* **Case 4: The "Canonical Shadow" Warning (Missing Anchor)**
  * *Trigger:* The \`genes_of_interest_requested\` array in the metadata is empty [].
  * *Action:* Set \`can_generate_hypothesis\` to true. Set \`warning_flag\` to: "Your query relied on broad concepts without a specific gene anchor. Consequently, the graph retrieved heavily weighted canonical pathways. For more specific or novel results, try explicitly naming a target gene." Generate the hypothesis.

### SUGGESTED OPTIMIZED QUERY
If you trigger any of the 4 cases above, you MUST generate a \`suggested_optimized_query\` based on the \`research_context\`. Use the "Anchor + Semantic Net" formula:
"Find a [Broad Mechanism/Semantic Net] involving [Explicit Gene Anchor] in [Cell/Tissue Type] that drives [Specific Biomarker/Phenotype]."

### Visual topology (biological mechanism map)
To help the user quickly understand the biological mechanism, distill your hypothesis narrative into a **causal flow chart** (pathway cartography). This is **not** a copy of the database graph: do **not** build the map from CSV row IDs or gene-set library names alone.
- Create custom nodes for key biological entities (e.g. Genes, Metabolites, Cellular processes, Phenotypes). Use short, meaningful labels consistent with your hypothesis text.
- Create **directed** edges with a short **action label** (e.g. \`"activates"\`, \`"cleaves"\`, \`"increases"\`, \`"inhibits"\`, \`"mediates"\`).
- Keep the map **simple**: **3 to 6 nodes** maximum, strictly linear or branching. Focus on the biological story, not data provenance.
- Provide \`hypothesis_in_kg.caption\`: one short sentence summarizing the biological flow shown in the map.

### Actionable next steps
Provide **3** concrete, distinct next steps the user can take to validate or explore this hypothesis.
- \`category\`: Must be one of: \`"Experimental Validation"\`, \`"In Silico Profiling"\`, \`"Literature Review"\`, \`"Drug Repurposing"\`.
- \`action\`: A short, specific action (e.g., "Knockdown TREM2 in human microglia").
- \`reason\`: Why this step would support or refute the mechanism.

### NEW: Follow-up Queries (Next Queries)
Provide 2 to 3 optimized follow-up queries that allow the user to dig deeper into the specific biology of this hypothesis.
- These queries MUST follow the "Anchor + Semantic Net" formula: "Find a [Mechanism] involving [Gene Anchor] in [Tissue] that regulates [Phenotype]."
- Focus these queries on testing the downstream consequences, interacting genes, or specific cellular processes you just proposed.

### Output (strict JSON)
Return ONLY valid JSON in the following structure:
{
  "data_tracing_scratchpad": "Briefly list the CSV row IDs you use: \`associated_with\` (phenotype→gene set), \`contains_gene\` (phenotype→gene), and \`contributes_to_pathway\` (gene→gene set) for the hypothesis. Do not use outside knowledge.",
  "diagnostic_assessment": {
    "can_generate_hypothesis": true,
    "rejection_reason": "String or null. Populate if an absolute rejection in Case 1, 2, or 3 is triggered.",
    "warning_flag": "String or null. Populate if a partial hit in Case 1/2, or the missing anchor in Case 4 is triggered.",
    "suggested_optimized_query": "String or null. MUST be populated if a rejection or warning occurs.",
    "exploratory_mode": "Boolean; set true when relaxed/exploratory mode instructions apply (omitted in strict mode)."
  },
  "hypotheses": [
    {
      "group_name": "Short mechanistic headline",
      "associated_pairs": [ { "phenotype": "...", "factor": "..." } ],
      "hypothesis": "2–3 sentences.",
      "novelty": "Contrast canonical vs non-canonical emphasis.",
      "hypothesis_in_kg": {
        "caption": "Short explanation of the biological flow.",
        "nodes": [
          { "id": "n1", "label": "TREM2", "group": "Gene" },
          { "id": "n2", "label": "Lipid sensing", "group": "Process" },
          { "id": "n3", "label": "Aβ clearance", "group": "Process" },
          { "id": "n4", "label": "Dementia risk", "group": "Phenotype" }
        ],
        "edges": [
          { "from": "n1", "to": "n2", "label": "mediates" },
          { "from": "n2", "to": "n3", "label": "increases" },
          { "from": "n3", "to": "n4", "label": "reduces" }
        ]
      },
      "next_steps": [
        { "category": "Experimental Validation", "action": "...", "reason": "..." }
      ],
      "next_queries": [
        "Find a lipid scavenger receptor mechanism involving CD36 in microglia that drives amyloid-beta uptake.",
        "Find a lipid transport mechanism involving APOE in astrocytes that modulates neuroinflammation."
      ],
      "genes": [
        { 
         "gene": "SYMBOL", 
         "group": "Primary Mechanistic Candidate OR Supporting Canonical Network", 
         "role": "Brief bridge role.",
         "source_row_id": "Must match a 'contains_gene' row ID from the provided CSV exactly."
        }
      ],
      "supporting_row_ids": [0, 1, 2]
    }
  ]
}

### Guidelines
- **hypotheses array:** MUST contain at least one element UNLESS \`can_generate_hypothesis\` is false.
- **associated_pairs:** Must match phenotype / \`factor\` strings exactly from the UI list (those are gene-set-cluster labels used for grouping even though the CSV graph omits cluster nodes).
- **Row referencing (phenotype → gene set):** For each phenotype in the story, \`supporting_row_ids\` must include every \`associated_with\` row that links that phenotype to a gene set you rely on.
- **Row referencing (phenotype → gene):** Include every \`contains_gene\` row for genes you name, for the phenotypes in scope.
- **Row referencing (gene → gene set):** Include all \`contributes_to_pathway\` rows for those genes to the gene sets in your story; do not omit pathway rows.
- **hypothesis_in_kg (mechanism map):** \`nodes\` and \`edges\` must form a consistent DAG: every \`from\` / \`to\` must match a node \`id\`. Use **3–6 nodes**. \`group\` classifies the entity (e.g. \`Gene\`, \`Process\`, \`Phenotype\`, \`Metabolite\`). Omit \`hypothesis_in_kg\` only if you cannot summarize the hypothesis as a simple causal map without fabricating biology.
- **next_steps:** Always provide exactly **3** items when \`hypotheses\` is non-empty, each with valid \`category\`, \`action\`, and \`reason\`.
- **Gene limits:** At least 5 high-impact candidate genes per hypothesis where the KG provides enough genes. Order by impact.

CRITICAL EVALUATION INSTRUCTION (BEATING THE CANONICAL BIAS):
Because broad phenotypes have massive statistical weight, top retrieved genes are often canonical disease drivers. Your job is to act as a strict semantic filter.
1. MECHANISTIC PRIORITIZATION: Elevate any gene in the retrieved list that directly executes the requested biochemical mechanism.
2. CANONICAL SEGREGATION: You must explicitly segregate genes in the JSON output using the "group" field. Assign them as either "Primary Mechanistic Candidate" (directly executes the requested mechanism) or "Supporting Canonical Network" (generic hubs providing downstream phenotypic context).
`,
            /** strict | relaxed — relaxed appends mechanismHypothesisExploratoryModeSuffix for the mechanism LLM only. */
            hypothesisGenerationMode: "strict",
            /** Mirrors the mode used for the last completed mechanism hypothesis LLM call (card banner). */
            hypothesisLastRunMode: null,
            mechanismHypothesisExploratoryModeSuffix: `
### EXPLORATORY (RELAXED) MODE — ACTIVE FOR THIS REQUEST
The user enabled **relaxed / exploratory** hypothesis generation. Apply these **OVERRIDES** to the **STRICT ANTI-HALLUCINATION DIRECTIVES** above. **Data fidelity still applies:** use only genes, gene sets, phenotypes, and \`contains_gene\` / \`associated_with\` / \`contributes_to_pathway\` relationships present in the provided CSV—you must not invent entities that are absent from that graph.

**Case 1 — all requested genes missing from response (\`genes_of_interest_missing_from_response\` covers the full request):** Do **not** reject solely for this reason if the CSV still has a coherent phenotype–gene set–gene structure. Set \`can_generate_hypothesis\` to **true**. Build the best mechanism you can from **supported** subgraphs. In \`warning_flag\`, start with \`Exploratory mode:\` and explain which queried genes are missing from the merged response and that the story does not chain those genes through direct edges.

**Case 2 — all requested genes absent from DB (\`genes_of_interest_absent_from_db\` covers the full request):** Same as Case 1: prefer **proceed** with \`can_generate_hypothesis\` **true** when the CSV is non-empty and interpretable; document absent symbols in \`warning_flag\`.

**Case 3 — hub gravity / phenotypic disconnect:** Prefer **proceed** rather than reject. Set \`can_generate_hypothesis\` to **true** when any usable CSV structure exists. State the domain mismatch explicitly in \`warning_flag\` and keep \`data_tracing_scratchpad\` and \`supporting_row_ids\` tied to real rows. Do not fabricate cross-domain edges missing from the CSV.

**diagnostic_assessment object:** Include \`"exploratory_mode": true\` (boolean) on every response under relaxed mode. Merge exploratory warnings into \`warning_flag\` (do not leave \`warning_flag\` null when you would have strictly rejected or issued a strong Case 3 warning).

**suggested_optimized_query:** Still supply when it would help the user tighten their question; relaxed mode does not remove this obligation.
`,
        };
    },
    computed: {
        searchInputPlaceholder() {
            const list = Array.isArray(this.placeholderExamples) ? this.placeholderExamples : [];
            if (!list.length) return "Describe what you're researching or curious about...";
            const idx = Math.max(0, Math.min(this.currentPlaceholderIndex, list.length - 1));
            return String(list[idx] || list[0]);
        },
        hypothesisModeRelaxedSwitch: {
            get() {
                return this.hypothesisGenerationMode === "relaxed";
            },
            set(v) {
                this.hypothesisGenerationMode = v ? "relaxed" : "strict";
            },
        },
        /** Full system prompt for mechanism hypothesis LLM (strict base ± exploratory suffix). */
        mechanismHypothesisSystemPromptEffective() {
            if (this.hypothesisGenerationMode === "relaxed") {
                return `${this.mechanismHypothesisSystemPrompt}\n\n${this.mechanismHypothesisExploratoryModeSuffix}`;
            }
            return this.mechanismHypothesisSystemPrompt;
        },
        factorDataTableRows() {
            const rows = [];
            const data = this.factorData || {};
            const filteredByPhenotype = {};
            Object.keys(data).forEach((p) => {
                const factors = data[p].factors || [];
                const set = new Set();
                factors.forEach((f) => {
                    if (f.factor != null) set.add(String(f.factor));
                    if (f.label != null && String(f.label).trim() !== "") set.add(String(f.label).trim());
                });
                filteredByPhenotype[p] = set;
            });
            Object.keys(data).forEach((phenotype) => {
                const factors = data[phenotype].factors || [];
                const allFactors = data[phenotype].allFactors || factors;
                const phenotypeRationale = data[phenotype].filterRationale;
                const filteredSet = filteredByPhenotype[phenotype];
                allFactors.forEach((f) => {
                    const topGeneSetsStr = f.top_gene_sets;
                    const topGeneSetProgramsStr = f.gene_set_program;
                    const topGeneSetsDisplay = (typeof topGeneSetsStr === "string" && topGeneSetsStr)
                        ? topGeneSetsStr.split(";").map((s) => s.trim()).filter(Boolean).join(", ")
                        : "";
                    const topGeneSets = (typeof topGeneSetsStr === "string" && topGeneSetsStr)
                        ? topGeneSetsStr.split(";").map((s) => s.trim()).filter(Boolean)
                        : "";
                    const topGeneSetPrograms = (typeof topGeneSetProgramsStr === "string" && topGeneSetProgramsStr)
                        ? topGeneSetProgramsStr.split("|").map((s) => s.trim()).filter(Boolean)
                        : "";
                    const rationale = (f.selectionRationale != null && f.selectionRationale !== "")
                        ? f.selectionRationale
                        : (phenotypeRationale != null && phenotypeRationale !== "" ? phenotypeRationale : "");
                    const isIncluded = !filteredSet || filteredSet.size === 0
                        ? true
                        : (filteredSet.has(String(f.factor)) || (f.label != null && filteredSet.has(String(f.label).trim())));
                    const rowKey = `${phenotype}|${f.factor}`;
                    const included = Object.prototype.hasOwnProperty.call(this.pairSelectionOverrides, rowKey)
                        ? !!this.pairSelectionOverrides[rowKey]
                        : isIncluded;
                    rows.push({
                        phenotype,
                        factor: f.factor,
                        factorLabel: f.label != null ? f.label : f.factor,
                        factorLabelFromApi:
                            f.labelFromApi != null && String(f.labelFromApi).trim() !== ""
                                ? String(f.labelFromApi).trim()
                                : null,
                        top_gene_sets: topGeneSets,
                        top_gene_set_programs: topGeneSetPrograms,
                        rationale,
                        isFiltered: isIncluded,
                        included,
                        _rowKey: rowKey,
                        _showDetails: !!this.expandedFactorRowKeys[rowKey],
                    });
                });
            });
            rows.sort((a, b) => {
                const aIncluded = a.included ? 1 : 0;
                const bIncluded = b.included ? 1 : 0;
                if (bIncluded !== aIncluded) return bIncluded - aIncluded;
                return (a.phenotype || "").localeCompare(b.phenotype || "");
            });
            return rows;
        },
        isPhenotypePath() {
            const data = this.factorData || {};
            return Object.keys(data).some((p) => (data[p].allFactors || []).length > 0);
        },
        phenotypeRationaleList() {
            if (!this.isPhenotypePath) return [];
            const data = this.factorData || {};
            return Object.keys(data)
                .filter((p) => {
                    const r = data[p].filterRationale;
                    return r != null && String(r).trim() !== "";
                })
                .map((p) => ({ phenotype: p, rationale: String(data[p].filterRationale).trim() }));
        },
        factorDataTableRowsWithRationaleMeta() {
            const source = this.factorDataTableRows || [];
            if (!this.isPhenotypePath) return source;
            const rows = source.map((r) => ({ ...r, rationaleRowspan: 1, showRationaleTd: true }));
            let i = 0;
            while (i < rows.length) {
                if (!rows[i].included) break;
                const phenotype = rows[i].phenotype;
                let j = i;
                while (j < rows.length && rows[j].included && rows[j].phenotype === phenotype) j++;
                const count = j - i;
                rows[i].rationaleRowspan = count;
                rows[i].showRationaleTd = true;
                for (let k = i + 1; k < j; k++) {
                    rows[k].rationaleRowspan = 0;
                    rows[k].showRationaleTd = false;
                }
                i = j;
            }
            return rows;
        },
        factorDataTableRowsFiltered() {
            return (this.factorDataTableRows || []).filter((r) => r.isFiltered);
        },
        mainFactorTableRowsPaged() {
            const rows = this.isPhenotypePath
                ? (this.factorDataTableRowsWithRationaleMeta || [])
                : (this.factorDataTableRows || []);
            const start = (Math.max(1, this.mainTableCurrentPage) - 1) * this.mainTablePerPage;
            return rows.slice(start, start + this.mainTablePerPage);
        },
        remainingFactorTableRowsPaged() {
            const rows = this.remainingFactorDataTableRowsWithRationaleMeta || [];
            const start = (Math.max(1, this.remainingTableCurrentPage) - 1) * this.mainTablePerPage;
            return rows.slice(start, start + this.mainTablePerPage);
        },
        remainingGeneSetClusterRowsPaged() {
            const rows = this.remainingGeneSetClusterRows || [];
            const start = (Math.max(1, this.remainingTableCurrentPage) - 1) * this.mainTablePerPage;
            return rows.slice(start, start + this.mainTablePerPage);
        },
        currentSelectedPairKeys() {
            return (this.factorDataTableRows || [])
                .filter((r) => !!r.included)
                .map((r) => this.getRowKey(r))
                .filter(Boolean);
        },
        selectionDiffersFromFiltered() {
            const baseline = new Set((this.llmFilteredPairKeysBaseline || []).map((k) => String(k)));
            const current = new Set((this.currentSelectedPairKeys || []).map((k) => String(k)));
            if (baseline.size !== current.size) return true;
            for (const k of baseline) {
                if (!current.has(k)) return true;
            }
            return false;
        },
        /** Results tab: hypotheses cards or explicit LLM rejection (no hallucination). */
        showMechanismResultsPanel() {
            if (!this.loadComplete || this.error_mechanisms) return false;
            if (this.mechanisms && this.mechanisms.length) return true;
            const d = this.mechanismDiagnosticAssessment;
            return !!(d && d.can_generate_hypothesis === false);
        },
        /** Hide mechanism narrative (context, summary, cards, remaining clusters) when LLM rejected with no hypotheses. */
        mechanismResultsDetailVisible() {
            const d = this.mechanismDiagnosticAssessment;
            return !(d && d.can_generate_hypothesis === false);
        },
        workflowErrorSteps() {
            return (this.steps || []).filter((s) => s && s.type === "error");
        },
        revealExtractionStep() {
            const list = this.steps || [];
            return list.find((s) => s && s.type !== "error" && s.id === "1") || null;
        },
        /** Only extraction-review substep(s); keeps Search terms tab from showing other step payloads. */
        revealExtractionSubstepsForTermsTab() {
            const step = this.revealExtractionStep;
            if (!step || !Array.isArray(step.substeps)) return [];
            return step.substeps.filter((s) => s && String(s.id) === "1.1");
        },
        revealDataSteps() {
            return (this.steps || []).filter(
                (s) => s && s.type !== "error" && s.id === "2"
            );
        },
        isMechanismHypothesisLoading() {
            if (this.loadComplete) return false;
            return (this.steps || []).some((s) => s && s.id === "4");
        },
        revealHypothesisStep() {
            const list = this.steps || [];
            return list.find((s) => s && s.id === "4") || null;
        },
        revealDataTabEnabled() {
            if (this.searchCriteriaExtractionGateDone) return true;
            return this.revealDataSteps.length > 0;
        },
        revealResultsTabEnabled() {
            if (this.revealResultsTabUnlocked) return true;
            if ((this.steps || []).some((s) => s && s.id === "4")) return true;
            if (this.loadComplete && (this.error_mechanisms || this.showMechanismResultsPanel)) return true;
            return false;
        },
        /** ZIP report exists only after at least one hypothesis card was generated. */
        canDownloadMechanismReport() {
            return Array.isArray(this.mechanisms) && this.mechanisms.length > 0;
        },
        phenotypeCount() {
            const rows = this.factorDataTableRowsFiltered || [];
            return new Set(rows.map((r) => r.phenotype)).size;
        },
        factorCount() {
            return (this.factorDataTableRowsFiltered || []).length;
        },
        phenotypeList() {
            const rows = this.factorDataTableRowsFiltered || [];
            return [...new Set(rows.map((r) => r.phenotype))].sort();
        },
        factorLabelsList() {
            const rows = this.factorDataTableRowsFiltered || [];
            return [...new Set(rows.map((r) => r.factorLabel))].sort();
        },
        /** Human-readable gene-set cluster labels for pills (CFDE maps + fallback to raw id). */
        factorLabelsListDisplay() {
            const rows = this.factorDataTableRowsFiltered || [];
            return [...new Set(rows.map((r) => this.getFactorClusterDisplay(r)))].sort();
        },
        /**
         * Phenotype–table-row keys cited in mechanism results: inferred from supporting_row_ids
         * plus merged factorData (hybrid KG has no cluster nodes; edges are phenotype–gene set / gene).
         */
        mechanismResultPhenotypeFactorPairKeys() {
            const keys = new Set();
            const flat = this.lastFlattenedKG;
            const mechs = this.mechanisms || [];
            const data = this.factorData || {};
            if (!mechs.length) return keys;
            for (const m of mechs) {
                if (m._fromRemainingPair && Array.isArray(m._remainingPairCoverKeys)) {
                    m._remainingPairCoverKeys.forEach((k) => keys.add(k));
                    continue;
                }
                if (!flat || !flat.length) continue;
                if (!Array.isArray(m.supporting_row_ids) || !m.supporting_row_ids.length) continue;
                const idSet = new Set(m.supporting_row_ids.map(Number));
                this.addTableRowKeysFromCitedFlatRows(keys, flat, idSet, data);
            }
            return keys;
        },
        /** Included rows not yet cited in mechanism supporting evidence (or covered by ad-hoc generate). */
        remainingGeneSetClusterRows() {
            const mechKeys = this.mechanismResultPhenotypeFactorPairKeys;
            const adHoc = new Set(this.adHocCoveredRowKeys || []);
            return (this.factorDataTableRows || []).filter((r) => {
                if (!r.included) return false;
                if (adHoc.has(this.getRowKey(r))) return false;
                const p = String(r.phenotype).trim();
                const fl = r.factorLabel != null ? String(r.factorLabel).trim() : "";
                const fid = r.factor != null ? String(r.factor).trim() : "";
                const mechCovers =
                    mechKeys.has(`${p}|${this.collapseWsLower(fl)}`) ||
                    mechKeys.has(`${p}|${this.collapseWsLower(fid)}`);
                return !mechCovers;
            });
        },
        remainingFactorDataTableRowsWithRationaleMeta() {
            const remKeys = new Set((this.remainingGeneSetClusterRows || []).map((r) => this.getRowKey(r)));
            return (this.factorDataTableRowsWithRationaleMeta || []).filter((r) => remKeys.has(this.getRowKey(r)));
        },
        /** Human-readable lines for hybrid-search meta (fusion, genes of interest resolution). */
        hybridSearchMetaSummaryLines() {
            const m = this.lastHybridSearchMeta || {};
            const lines = [];
            if (m.lexical_fusion_used === true) {
                lines.push("Lexical fusion was used (dense retrieval + Postgres full-text search, merged with RRF).");
            }
            if (Array.isArray(m.genes_of_interest_requested) && m.genes_of_interest_requested.length) {
                lines.push(`Genes of interest sent to the server: ${m.genes_of_interest_requested.join(", ")}.`);
            }
            if (Array.isArray(m.genes_of_interest_absent_from_db) && m.genes_of_interest_absent_from_db.length) {
                lines.push(
                    `No row in genes_to_factors for: ${m.genes_of_interest_absent_from_db.join(", ")} (cannot be fabricated).`
                );
            }
            if (Array.isArray(m.genes_of_interest_missing_from_response) && m.genes_of_interest_missing_from_response.length) {
                lines.push(
                    `Not present on any factor gene list after merge: ${m.genes_of_interest_missing_from_response.join(", ")} (e.g. factor budget or data gaps).`
                );
            }
            return lines;
        },
    },
    watch: {
        mechanisms: {
            handler(val) {
                if (Array.isArray(val) && val.length) {
                    this.$nextTick(() => this.prefetchC2m2ProvenanceForMechanisms());
                }
            },
            deep: true,
            immediate: true,
        },
    },
    created() {
        this.llmExtract = createLLMClient({
            llm: "openai",
            model: "gpt-5-mini",
            system_prompt: this.extractSystemPrompt
        });

        this.llmAnalyze = createLLMClient({
            llm: "openai",
            model: "gpt-5-mini",
            system_prompt: this.mechanismHypothesisSystemPrompt,
        });

    },
    async mounted() {
        if (keyParams.query) {
            this.userQuery = keyParams.query;
        }
        this.currentPlaceholderIndex = 0;
        this.startPlaceholderRotation();
        this.$nextTick(() => {
            if (this.$refs.queryInput) {
                this.suppressNextQueryFocusPause = true;
                this.$refs.queryInput.focus();
            }
        });
    },
    beforeDestroy() {
        this.stopStepTimer();
        this.stopRemainingGenerateTimer();
        this.stopPlaceholderRotation();
        if (typeof this.stepApprovalGateResolver === "function") {
            this.stepApprovalGateResolver();
            this.stepApprovalGateResolver = null;
        }
    },
    methods: {
         showByorTab(){
            const TAB = 'research_method';
			const CONTENT = 'research_method_content';
			const TAB_WRAPPER = 'rp_tabs';
			const CONTENT_WRAPPER = 'rp_tabs_contents';
            uiUtils.showTabContent(TAB, CONTENT, TAB_WRAPPER, CONTENT_WRAPPER);
        },
        startPlaceholderRotation() {
            if (this.placeholderIntervalId != null) return;
            if (String(this.userQuery || "").trim()) return;
            this.placeholderIntervalId = setInterval(() => {
                if (this.placeholderRotationPaused) return;
                if (String(this.userQuery || "").trim()) return;
                const n = Array.isArray(this.placeholderExamples) ? this.placeholderExamples.length : 0;
                if (!n) return;
                this.currentPlaceholderIndex = (this.currentPlaceholderIndex + 1) % n;
            }, 7000);
        },
        stopPlaceholderRotation() {
            if (this.placeholderIntervalId != null) {
                clearInterval(this.placeholderIntervalId);
                this.placeholderIntervalId = null;
            }
        },
        onQueryInputFocus() {
            if (this.suppressNextQueryFocusPause) {
                this.suppressNextQueryFocusPause = false;
                return;
            }
            this.placeholderRotationPaused = true;
        },
        onQueryInputBlur() {
            this.suppressNextQueryFocusPause = false;
            if (String(this.userQuery || "").trim()) return;
            this.placeholderRotationPaused = false;
            this.startPlaceholderRotation();
        },
        onQueryInput() {
            if (String(this.userQuery || "").trim()) {
                this.placeholderRotationPaused = true;
                return;
            }
            this.placeholderRotationPaused = false;
            this.startPlaceholderRotation();
        },
        /**
         * CFDE C2M2 provenance API. Returns json.data (array) or null.
         * @see https://cfde-dev.hugeampkpnbi.org/api/bio/query/c2m2-provenance
         */
        async fetchProvenance(geneset) {
            const q = encodeURIComponent(String(geneset || "").trim());
            if (!q) return null;
            const url = `https://cfde-dev.hugeampkpnbi.org/api/bio/query/c2m2-provenance?q=${q}`;
            try {
                const res = await fetch(url);
                if (!res.ok) return null;
                const json = await res.json();
                return Array.isArray(json.data) ? json.data : null;
            } catch (e) {
                return null;
            }
        },
        /** Deduped nodes with dcc_url for provenance pills (Flattens data[].nodes). */
        flattenC2m2ProvenanceNodes(data) {
            if (!data || !data.length) return [];
            const out = [];
            const seen = new Set();
            data.forEach((entry) => {
                (entry.nodes || []).forEach((n) => {
                    const url = n.dcc_url != null ? String(n.dcc_url).trim() : "";
                    const id = n.id != null ? String(n.id) : "";
                    if (!url || !id) return;
                    if (seen.has(id)) return;
                    seen.add(id);
                    out.push({
                        id,
                        dcc_url: url,
                        labels: Array.isArray(n.labels) ? n.labels : [],
                    });
                });
            });
            return out;
        },
        c2m2ProvenanceEntry(geneSetId) {
            const key = geneSetId != null ? String(geneSetId) : "";
            return (key && this.c2m2ProvenanceByGeneSet[key]) || null;
        },
        /** Nodes with a DCC URL for the hover "download options" menu (relevant gene sets row). */
        c2m2GeneSetDownloadNodes(geneSetId) {
            const ent = this.c2m2ProvenanceEntry(geneSetId);
            if (!ent || ent.status !== "ok" || !Array.isArray(ent.nodes)) return [];
            return ent.nodes.filter((n) => n && n.dcc_url != null && String(n.dcc_url).trim() !== "");
        },
        truncateProvenanceNodeLabel(id, maxLen = 38) {
            const s = String(id || "");
            if (s.length <= maxLen) return s;
            return `${s.slice(0, Math.max(0, maxLen - 1))}…`;
        },
        async ensureC2m2ProvenanceForGeneSet(geneSetId) {
            const key = String(geneSetId || "").trim();
            if (!key) return;
            const cur = this.c2m2ProvenanceByGeneSet[key];
            if (cur && (cur.status === "loading" || cur.status === "ok" || cur.status === "empty" || cur.status === "error")) {
                return;
            }
            this.$set(this.c2m2ProvenanceByGeneSet, key, { status: "loading", nodes: [] });
            try {
                const data = await this.fetchProvenance(key);
                const nodes = this.flattenC2m2ProvenanceNodes(data);
                this.$set(this.c2m2ProvenanceByGeneSet, key, {
                    status: nodes.length ? "ok" : "empty",
                    nodes,
                });
            } catch (e) {
                this.$set(this.c2m2ProvenanceByGeneSet, key, { status: "error", nodes: [] });
            }
        },
        prefetchC2m2ProvenanceForMechanisms() {
            const mechs = this.mechanisms;
            if (!Array.isArray(mechs)) return;
            const ids = new Set();
            mechs.forEach((m) => {
                (m.relevant_gene_sets || []).forEach((gs) => {
                    const id = String(gs || "").trim();
                    if (id) ids.add(id);
                });
            });
            ids.forEach((id) => this.ensureC2m2ProvenanceForGeneSet(id));
        },
        formatProvenance(entry) {
            const nodesById = Object.fromEntries(
                entry.nodes.map(n => [n.id, n])
            )

            const geneSetNode = entry.nodes.find(n =>
                n.labels.includes('GeneSet')
            )

            const relations = entry.edges.map(edge => {
                const fileNode = nodesById[edge.object]

                return {
                    file: {
                        filename: fileNode?.properties?.filename,
                        id: fileNode?.properties?.persistent_id,
                        size: fileNode?.properties?.size_in_bytes,
                        dcc_url: fileNode?.dcc_url
                    },
                    method: {
                        script: edge.context?.script,
                        direction: edge.context?.direction,
                        type: edge.context?.type,
                        predicate: edge.predicate
                    }
                }
            })

            return {
                geneSet: geneSetNode?.properties?.name,
                geneSetUrl: geneSetNode?.properties?.parent_url,
                relations
            }
        },
        async onGeneSetRowToggled(row){
            row.toggleDetails();
            //if (!row._showDetails) return;
            const key = row.item.geneset;
            if(this.gene_set_sources[key]) {
                return;
            }
            const data = await this.fetchProvenance(key);
            const result = data && data.length>0 ? this.formatProvenance(data[0]) : null
            this.$set(this.gene_set_sources, key, result);
        },
        downloadLastHybridSearchRawJson() {
            const payload = this.lastHybridSearchResponse;
            if (!payload || typeof payload !== "object") return;
            try {
                const json = JSON.stringify(payload, null, 2);
                const blob = new Blob([json], { type: "application/json;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `hybrid-search-response-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                /* ignore */
            }
        },
        async downloadReport() {
            if (!this.canDownloadMechanismReport) return;
            const prevTab = this.showTab;
            try {
                if (this.showTab !== "results") {
                    this.showTab = "results";
                    await this.$nextTick();
                    await this.$nextTick();
                }
                const researchContext =
                    (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                        ? String(this.searchCriteria[1].values)
                        : "";
                const mechanismImages = await this.collectMechanismReportImages();
                const html = this.buildHtmlReportDocument({
                    researchContext,
                    mechanismImages,
                    factorSummary: this.serializeFactorDataForPrompt(this.factorData || {}),
                    rawKgCsv: this.lastFlattenedKG && this.lastFlattenedKG.length
                        ? this.flattenedKGToCSV(this.lastFlattenedKG)
                        : "",
                });
                const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "factor-base-reveal-report.html";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch {
            } finally {
                if (this.showTab !== prevTab) {
                    this.showTab = prevTab;
                }
            }
        },
        /**
         * Capture a FactorBaseRevealNetwork instance as PNG (preferred) or SVG.
         * @param {string} refKey - this.$refs key (e.g. mechanismNetwork-0, mechanismHypothesisMap-0).
         * @param {{ nodes?: Array, edges?: Array }} net - For meta counts only.
         * @returns {Promise<{ dataUrl: string, format: string, nodeCount: number, edgeCount: number } | null>}
         */
        async exportNetworkImageFromRef(refKey, net) {
            const compRef = this.$refs[refKey];
            const comp = Array.isArray(compRef) ? compRef[0] : compRef;
            if (!comp) return null;
            let blob = null;
            let format = "png";
            if (typeof comp.exportPng === "function") {
                blob = await comp.exportPng(3);
                format = "png";
            }
            if (!blob && typeof comp.exportSvg === "function") {
                blob = await comp.exportSvg();
                format = "svg";
            }
            if (!blob) return null;
            const dataUrl = await this.blobToDataUrl(blob);
            const n = net || {};
            return {
                dataUrl,
                format,
                nodeCount: Array.isArray(n.nodes) ? n.nodes.length : 0,
                edgeCount: Array.isArray(n.edges) ? n.edges.length : 0,
            };
        },
        async collectMechanismReportImages() {
            await this.$nextTick();
            return Promise.all(
                (this.mechanisms || []).map(async (m, idx) => {
                    const supportingNet = m.supporting_network || m.network || {};
                    const hypothesisNet = m.core_spine_network || { nodes: [], edges: [] };
                    const [supporting, hypothesisMap] = await Promise.all([
                        this.exportNetworkImageFromRef(`mechanismNetwork-${idx}`, supportingNet),
                        this.exportNetworkImageFromRef(`mechanismHypothesisMap-${idx}`, hypothesisNet),
                    ]);
                    return { idx, supporting, hypothesisMap };
                })
            );
        },
        blobToDataUrl(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        },
        escapeHtml(value) {
            return String(value == null ? "" : value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        },
        buildReportList(items, transform = (x) => x) {
            const list = Array.isArray(items) ? items.map(transform).filter(Boolean) : [];
            if (!list.length) return '<span class="report-empty">—</span>';
            return `<ul>${list.map((item) => `<li>${this.escapeHtml(item)}</li>`).join("")}</ul>`;
        },
        buildReportGeneTableHtml(genes) {
            const rows = Array.isArray(genes) ? genes : [];
            if (!rows.length) return '<div class="report-empty">No genes listed.</div>';
            return `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Gene</th>
                            <th>Combined</th>
                            <th>GWAS</th>
                            <th>Functional</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((g) => `
                            <tr>
                                <td>${this.escapeHtml(g.gene)}</td>
                                <td>${this.escapeHtml(g.combined || "—")}</td>
                                <td>${this.escapeHtml(g.gwasSupport || "—")}</td>
                                <td>${this.escapeHtml(g.geneSetSupport || "—")}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        },
        buildReportGeneSetTableHtml(geneSets) {
            const rows = Array.isArray(geneSets) ? geneSets : [];
            if (!rows.length) return '<div class="report-empty">No gene sets listed.</div>';
            return `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Gene set</th>
                            <th>Program</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((gs) => `
                            <tr>
                                <td>${this.escapeHtml(gs.geneset || "—")}</td>
                                <td>${this.escapeHtml(gs.program || "—")}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        },
        buildReportFactorCards(rows, title) {
            const items = Array.isArray(rows) ? rows : [];
            const summaryTable = items.length ? `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Phenotype</th>
                            <th>Trait group</th>
                            <th>Included</th>
                            <th>Rationale</th>
                            <th>Gene sets</th>
                            <th>Genes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((row) => `
                            <tr>
                                <td>${this.escapeHtml(this.getPhenotypeDisplay(row.phenotype || ""))}</td>
                                <td>${this.escapeHtml(this.getFactorClusterDisplay(row))}</td>
                                <td>${row.included ? "Yes" : "No"}</td>
                                <td>${this.escapeHtml(row.rationale || "—")}</td>
                                <td>${this.escapeHtml(this.getGenesetForFactor(row.phenotype, row.factor).length)}</td>
                                <td>${this.escapeHtml(this.getGenesForFactor(row.phenotype, row.factor).length)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            ` : '<div class="report-empty">No rows available.</div>';
            const cards = items.map((row) => {
                const phenotype = this.getPhenotypeDisplay(row.phenotype || "");
                const genes = this.getGenesForFactor(row.phenotype, row.factor);
                const geneSets = this.getGenesetForFactor(row.phenotype, row.factor);
                return `
                    <article class="report-card">
                        <h4>${this.escapeHtml(phenotype)} | ${this.escapeHtml(this.getFactorClusterDisplay(row))}</h4>
                        <div class="report-keyvals">
                            <div><strong>Included:</strong> ${row.included ? "Yes" : "No"}</div>
                            <div><strong>Rationale:</strong> ${this.escapeHtml(row.rationale || "—")}</div>
                        </div>
                        <div class="report-subsection">
                            <h5>Gene sets in cluster</h5>
                            ${this.buildReportGeneSetTableHtml(geneSets)}
                        </div>
                        <div class="report-subsection">
                            <h5>Genes in factor</h5>
                            ${this.buildReportGeneTableHtml(genes)}
                        </div>
                    </article>
                `;
            }).join("");
            return `
                <section class="report-section">
                    <h2>${this.escapeHtml(title)}</h2>
                    ${summaryTable}
                    <div class="report-subsection"></div>
                    ${cards || '<div class="report-empty">No rows available.</div>'}
                </section>
            `;
        },
        /**
         * One mechanism card for HTML reports (full report + per-hypothesis handoff).
         * @param {*} m - mechanism object
         * @param {number} idx - zero-based index
         * @param {{ dataUrl?: string, format?: string, nodeCount?: number, edgeCount?: number } | null} supImg - supporting network export
         * @param {{ dataUrl?: string, format?: string, nodeCount?: number, edgeCount?: number } | null} hypImg - biological flow map export
         */
        buildMechanismReportOneCardHtml(m, idx, supImg, hypImg) {
            const genes = Array.isArray(m.candidate_genes || m.genes) ? (m.candidate_genes || m.genes) : [];
            const geneRows = genes.map((g) => {
                const scores = g.scores || {};
                const geneName = g.gene != null ? String(g.gene).trim() : "";
                const conn =
                    m.gene_connections && geneName && m.gene_connections[geneName]
                        ? m.gene_connections[geneName]
                        : { gene_sets: [] };
                const gss = Array.isArray(conn.gene_sets) ? conn.gene_sets : [];
                return `
                        <tr>
                            <td>${this.escapeHtml(g.gene || "—")}</td>
                            <td>${this.escapeHtml(g.group || "—")}</td>
                            <td>${this.escapeHtml(g.reason != null ? g.reason : g.role || "—")}</td>
                            <td>${this.escapeHtml(scores.combined ?? scores.c ?? "—")}</td>
                            <td>${this.escapeHtml(scores.gwas ?? scores.g ?? "—")}</td>
                            <td>${this.escapeHtml(scores.functional ?? scores.f ?? "—")}</td>
                            <td>${this.escapeHtml(gss.length ? gss.join(", ") : "—")}</td>
                        </tr>
                    `;
            }).join("");
            const nextSteps = Array.isArray(m.next_steps) ? m.next_steps : [];
            const nextStepsSection =
                nextSteps.length > 0
                    ? `
                        <div class="report-subsection report-next-steps-block">
                            <h3>Recommended next steps</h3>
                            <ol class="report-next-steps-list">${nextSteps
                                .map(
                                    (s) => `
                            <li>
                                <div><strong>${this.escapeHtml(s.category || "—")}</strong></div>
                                <div><em>Action:</em> ${this.escapeHtml(s.action || "—")}</div>
                                <div><em>Reason:</em> ${this.escapeHtml(s.reason || "—")}</div>
                            </li>`
                                )
                                .join("")}</ol>
                        </div>`
                    : "";
            const nextQueries = Array.isArray(m.next_queries) ? m.next_queries : [];
            const nextQueriesSection =
                nextQueries.length > 0
                    ? `
                        <div class="report-subsection">
                            <h3>Next queries</h3>
                            <p class="report-fine-print">Click these in the app to continue exploring this mechanism with a focused follow-up search.</p>
                            <ol class="report-next-steps-list">${nextQueries
                                .map((q) => `<li>${this.escapeHtml(q || "—")}</li>`)
                                .join("")}</ol>
                        </div>`
                    : "";
            const hasHypothesisMapVisual =
                (m.core_spine_network &&
                    Array.isArray(m.core_spine_network.nodes) &&
                    m.core_spine_network.nodes.length > 0) ||
                (hypImg && hypImg.dataUrl) ||
                !!(m.hypothesis_in_kg && m.hypothesis_in_kg.caption);
            const hypothesisMapSection = hasHypothesisMapVisual
                ? `
                        <div class="report-subsection">
                            <h3>Biological mechanism map</h3>
                            ${
                                m.hypothesis_in_kg && m.hypothesis_in_kg.caption
                                    ? `<p class="report-map-caption"><strong>Summary:</strong> ${this.escapeHtml(m.hypothesis_in_kg.caption)}</p>`
                                    : ""
                            }
                            ${
                                hypImg && hypImg.dataUrl
                                    ? `
                                <div class="report-network-meta">${hypImg.nodeCount} nodes, ${hypImg.edgeCount} edges (${this.escapeHtml(hypImg.format)})</div>
                                <img class="report-network-image" src="${hypImg.dataUrl}" alt="Biological mechanism map ${idx + 1}">
                            `
                                    : '<div class="report-empty">No map image in this export. Open the Results tab, let the map render, and download the report again.</div>'
                            }
                        </div>`
                : "";
            const mechanismCardTitle = this.escapeHtml(m.group_name || `Hypothesis ${idx + 1}`);
            return `
                    <section class="report-section report-card">
                        <h2>${mechanismCardTitle}</h2>
                        <div class="report-subsection"><strong>Mechanistic hypothesis</strong><p class="report-body-tight">${this.escapeHtml(m.hypothesis || "—")}</p></div>
                        <div class="report-subsection"><strong>Rationale</strong><p class="report-body-tight">${this.escapeHtml(m.novelty_explanation || m.novelty || "—")}</p></div>
                        ${hypothesisMapSection}
                        ${m.relevance ? `<div class="report-subsection"><strong>Relevance</strong><p class="report-body-tight">${this.escapeHtml(m.relevance)}</p></div>` : ""}
                        <div class="report-subsection">
                            <h3>Candidate genes (${genes.length})</h3>
                            ${genes.length ? `
                                <table class="report-table">
                                    <thead>
                                        <tr>
                                            <th>Gene</th>
                                            <th>Gene role</th>
                                            <th>Reason</th>
                                            <th>Combined</th>
                                            <th>GWAS</th>
                                            <th>Functional</th>
                                            <th>Relevant gene sets</th>
                                        </tr>
                                    </thead>
                                    <tbody>${geneRows}</tbody>
                                </table>
                            ` : '<div class="report-empty">No candidate genes listed.</div>'}
                        </div>
                        ${m.genes_collective_reason ? `<div class="report-subsection"><strong>How these genes work together</strong><p class="report-body-tight">${this.escapeHtml(m.genes_collective_reason)}</p></div>` : ""}
                        <div class="report-subsection">
                            <h3>Data network behind this hypothesis</h3>
                            <p class="report-fine-print">Connections from your selected phenotypes, genes, and gene sets (as in the app).</p>
                            ${supImg && supImg.dataUrl ? `
                                <div class="report-network-meta">${supImg.nodeCount} nodes, ${supImg.edgeCount} edges (${this.escapeHtml(supImg.format)})</div>
                                <img class="report-network-image" src="${supImg.dataUrl}" alt="Data network ${idx + 1}">
                            ` : '<div class="report-empty">No network image available for this export.</div>'}
                        </div>
                        <div class="report-subsection">
                            <strong>Phenotypes tied to this network</strong>
                            ${this.buildReportList(m.relevant_phenotypes, (id) => this.getPhenotypeDisplay(id))}
                        </div>
                        <div class="report-subsection">
                            <strong>Related trait-group clusters</strong>
                            ${this.buildReportList(m.redundant_associated_pairs, (pair) => `${this.getPhenotypeDisplay(pair.phenotype)} - ${this.getFactorClusterDisplayString(pair.factor)}`)}
                        </div>
                        <div class="report-subsection">
                            <strong>Gene sets in scope</strong>
                            ${this.buildReportList(this.formatRelevantGeneSetsForDisplay(m.relevant_gene_sets || []), (set) => `${set.gs}${set.program ? ` (${set.program})` : ""}`)}
                        </div>
                        ${nextStepsSection}
                        ${nextQueriesSection}
                    </section>
                `;
        },
        buildMechanismReportSections(mechanismImages) {
            const images = Array.isArray(mechanismImages) ? mechanismImages : [];
            return (this.mechanisms || []).map((m, idx) => {
                const img = images[idx];
                const supImg =
                    img && img.supporting
                        ? img.supporting
                        : img && img.dataUrl
                          ? img
                          : null;
                const hypImg = img && img.hypothesisMap ? img.hypothesisMap : null;
                return this.buildMechanismReportOneCardHtml(m, idx, supImg, hypImg);
            }).join("");
        },
        /** Strip vis-only / internal fields from networks for handoff JSON. */
        sanitizeHandoffNetwork(net) {
            const n = net || {};
            const nodes = Array.isArray(n.nodes)
                ? n.nodes
                    .map((node) => ({
                        id: node.id != null ? String(node.id) : "",
                        label: node.label != null ? String(node.label) : "",
                        type:
                            node.type != null
                                ? String(node.type)
                                : node.group != null
                                  ? String(node.group)
                                  : "",
                    }))
                    .filter((x) => x.id)
                : [];
            const edges = Array.isArray(n.edges)
                ? n.edges
                    .map((e) => ({
                        source:
                            e.source != null ? String(e.source) : e.from != null ? String(e.from) : "",
                        target:
                            e.target != null ? String(e.target) : e.to != null ? String(e.to) : "",
                        label: e.label != null ? String(e.label) : "",
                    }))
                    .filter((x) => x.source && x.target)
                : [];
            return { nodes, edges };
        },
        sanitizeHandoffFlattenedRows(rows) {
            return (rows || []).map((row) => {
                const out = {
                    subject: row.subject != null ? String(row.subject) : "",
                    predicate: row.predicate != null ? String(row.predicate) : "",
                    object: row.object != null ? String(row.object) : "",
                };
                Object.keys(row || {}).forEach((k) => {
                    if (k === "id" || k === "subject" || k === "predicate" || k === "object") return;
                    if (!/^context_/.test(k)) return;
                    const v = row[k];
                    out[k] = v != null ? String(v) : "";
                });
                return out;
            });
        },
        sanitizeHandoffSelectionRows(rows) {
            return (rows || [])
                .map((r) => ({
                    phenotype: r.phenotype != null ? String(r.phenotype) : "",
                    trait_group:
                        r.factorLabel != null && String(r.factorLabel).trim() !== ""
                            ? String(r.factorLabel).trim()
                            : r.factor != null
                              ? String(r.factor)
                              : "",
                }))
                .filter((x) => x.phenotype && x.trait_group);
        },
        sanitizeHandoffCandidateGenes(mechanism) {
            const genes =
                Array.isArray(mechanism?.candidate_genes) && mechanism.candidate_genes.length
                    ? mechanism.candidate_genes
                    : Array.isArray(mechanism?.genes)
                      ? mechanism.genes
                      : [];
            return genes.map((g) => ({
                gene: g?.gene != null ? String(g.gene) : "",
                role: g?.group != null ? String(g.group) : "",
                reason:
                    g?.reason != null ? String(g.reason) : g?.role != null ? String(g.role) : "",
                scores: {
                    combined: g?.scores?.combined ?? g?.scores?.c ?? null,
                    gwas: g?.scores?.gwas ?? g?.scores?.g ?? null,
                    functional: g?.scores?.functional ?? g?.scores?.f ?? null,
                },
            }));
        },
        sanitizeHandoffGeneConnections(gc) {
            if (!gc || typeof gc !== "object") return null;
            const out = {};
            Object.keys(gc).forEach((gene) => {
                const entry = gc[gene];
                if (!entry || typeof entry !== "object") return;
                out[String(gene)] = {
                    gene_sets: Array.isArray(entry.gene_sets) ? entry.gene_sets.map((s) => String(s)) : [],
                };
            });
            return Object.keys(out).length ? out : null;
        },
        buildMechanismHandoffAppendixObject({
            idx,
            mechanism,
            researchContext,
            supportingNet,
            hypothesisNet,
            supportingRows,
            assocRows,
            supportingImage,
            hypothesisImage,
        }) {
            const flowCap =
                mechanism?.hypothesis_in_kg?.caption != null
                    ? String(mechanism.hypothesis_in_kg.caption)
                    : "";
            return {
                handoff_version: 1,
                generated_at: new Date().toISOString(),
                your_question: this.userQuery || "",
                research_context: researchContext || "",
                session_mechanisms_summary: this.mechanisms_summary || "",
                extracted_terms: {
                    phenotype_terms: [...(this.lastPhenotypeTerms || [])],
                    mechanism_terms: [...(this.lastMechanismTerms || [])],
                    genes_of_interest: [...(this.lastGenesOfInterest || [])],
                },
                hypothesis: {
                    index: idx + 1,
                    title: mechanism?.group_name != null ? String(mechanism.group_name) : "",
                    mechanistic_hypothesis: mechanism?.hypothesis != null ? String(mechanism.hypothesis) : "",
                    rationale:
                        mechanism?.novelty_explanation != null
                            ? String(mechanism.novelty_explanation)
                            : mechanism?.novelty != null
                              ? String(mechanism.novelty)
                              : "",
                    relevance: mechanism?.relevance != null ? String(mechanism.relevance) : "",
                    biological_flow_summary: flowCap,
                    genes_collective_reason:
                        mechanism?.genes_collective_reason != null
                            ? String(mechanism.genes_collective_reason)
                            : "",
                    candidate_genes: this.sanitizeHandoffCandidateGenes(mechanism),
                    gene_set_links_by_gene: this.sanitizeHandoffGeneConnections(mechanism?.gene_connections),
                    next_steps: Array.isArray(mechanism?.next_steps)
                        ? mechanism.next_steps.map((s) => ({
                            category: s?.category != null ? String(s.category) : "",
                            action: s?.action != null ? String(s.action) : "",
                            reason: s?.reason != null ? String(s.reason) : "",
                        }))
                        : [],
                    next_queries: Array.isArray(mechanism?.next_queries)
                        ? mechanism.next_queries.map((q) => String(q))
                        : [],
                    related_phenotypes: Array.isArray(mechanism?.relevant_phenotypes)
                        ? mechanism.relevant_phenotypes.map((id) => this.getPhenotypeDisplay(id))
                        : [],
                    related_trait_group_clusters: Array.isArray(mechanism?.redundant_associated_pairs)
                        ? mechanism.redundant_associated_pairs.map((pair) => ({
                            phenotype: this.getPhenotypeDisplay(pair.phenotype),
                            trait_group: this.getFactorClusterDisplayString(pair.factor),
                        }))
                        : [],
                    relevant_gene_sets: (
                        this.formatRelevantGeneSetsForDisplay(mechanism?.relevant_gene_sets || []) || []
                    ).map((set) => ({
                        gene_set: set.gs,
                        program: set.program || "",
                    })),
                },
                evidence: {
                    supporting_kg_facts: this.sanitizeHandoffFlattenedRows(supportingRows),
                    ui_phenotype_trait_rows: this.sanitizeHandoffSelectionRows(assocRows),
                    data_network: this.sanitizeHandoffNetwork(supportingNet),
                    biological_flow_network: this.sanitizeHandoffNetwork(hypothesisNet),
                },
                exports: {
                    supporting_network_image: supportingImage
                        ? {
                            format: supportingImage.format,
                            node_count: supportingImage.nodeCount,
                            edge_count: supportingImage.edgeCount,
                            included_in_html: !!supportingImage.dataUrl,
                        }
                        : null,
                    biological_flow_image: hypothesisImage
                        ? {
                            format: hypothesisImage.format,
                            node_count: hypothesisImage.nodeCount,
                            edge_count: hypothesisImage.edgeCount,
                            included_in_html: !!hypothesisImage.dataUrl,
                        }
                        : null,
                },
            };
        },
        /**
         * Print-friendly single-hypothesis handoff HTML; JSON appendix via separate download link (data URL).
         */
        buildMechanismHandoffHtmlDocument({
            idx,
            mechanism,
            researchContext,
            supportingImage,
            hypothesisImage,
            appendix,
        }) {
            const slug = String(mechanism.group_name || `hypothesis-${idx + 1}`)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 80);
            const jsonStr = JSON.stringify(appendix, null, 2);
            const jsonDownloadHref = `data:application/json;charset=utf-8,${encodeURIComponent(jsonStr)}`;
            const jsonFilename = `reveal-handoff-appendix-${slug || `hypothesis-${idx + 1}`}.json`;
            const overview = `
                <section class="report-section">
                    <h2>Overview</h2>
                    <p class="report-fine-print">Context for this hypothesis handoff (one card from your session).</p>
                    <table class="report-table">
                        <tbody>
                            <tr><th>Your question</th><td>${this.escapeHtml(this.userQuery || "—")}</td></tr>
                            <tr><th>Research context</th><td>${this.escapeHtml(researchContext || "—")}</td></tr>
                            <tr><th>Phenotypes or diseases (extracted)</th><td>${this.escapeHtml((this.lastPhenotypeTerms || []).join(", ") || "—")}</td></tr>
                            <tr><th>Biological mechanisms (extracted)</th><td>${this.escapeHtml((this.lastMechanismTerms || []).join(", ") || "—")}</td></tr>
                            <tr><th>Genes you named (extracted)</th><td>${this.escapeHtml((this.lastGenesOfInterest || []).join(", ") || "—")}</td></tr>
                            <tr><th>Summary of findings (session)</th><td>${this.escapeHtml(this.mechanisms_summary || "—")}</td></tr>
                        </tbody>
                    </table>
                </section>
            `;
            const card = this.buildMechanismReportOneCardHtml(
                mechanism,
                idx,
                supportingImage,
                hypothesisImage
            );
            const appendixBlock = `
                <section class="report-section report-page-break">
                    <h2>Machine-readable appendix</h2>
                    <p class="report-fine-print">Compact JSON for tools, scripting, or archiving. Internal-only debugging fields are omitted.</p>
                    <p class="report-handoff-json-actions">
                        <a class="report-json-download" download="${this.escapeHtml(jsonFilename)}" href="${jsonDownloadHref}">Download JSON appendix</a>
                    </p>
                    <p class="report-fine-print report-print-hide">Use the button above in your browser to save the JSON file. Printed pages omit this control.</p>
                </section>
            `;
            const titleSafe = this.escapeHtml(
                mechanism.group_name || `Hypothesis handoff ${idx + 1}`
            );
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reveal handoff — ${titleSafe}</title>
    <style>
        html, body { margin: 0; padding: 0; background: #f5f6f8; color: #1f2933; }
        body, body * { box-sizing: border-box; }
        body, p, li, td, th, div, span, a, button, input, textarea, pre { font-size: 11pt; font-family: Arial, Helvetica, sans-serif; line-height: 1.45; }
        .report { max-width: 1180px; margin: 0 auto; padding: 24px; background: #fff; }
        .report-header { border-bottom: 2px solid #f16822; padding-bottom: 16px; margin-bottom: 24px; }
        .report-header h1 { font-size: 22pt; margin: 0 0 8px; }
        .report-header p { margin: 0; }
        .report-section { margin-bottom: 28px; }
        .report-section h2 { font-size: 18pt; margin: 0 0 12px; color: #f16822; }
        .report-section h3 { font-size: 15pt; margin: 0 0 8px; }
        .report-card { border: 1px solid #d8dee4; border-radius: 8px; padding: 18px; background: #fafbfc; margin-bottom: 18px; }
        .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .report-table th, .report-table td { border: 1px solid #d8dee4; padding: 8px 10px; text-align: left; vertical-align: top; word-break: break-word; }
        .report-table th { background: #f3f4f6; width: 24%; }
        .report-subsection { margin-bottom: 14px; }
        .report-empty { color: #667; font-style: italic; }
        .report-network-image { max-width: 100%; width: 100%; height: auto; border: 1px solid #d8dee4; border-radius: 6px; background: #fff; }
        .report-network-meta { margin-bottom: 8px; color: #555; }
        .report-map-caption { margin: 0 0 10px; }
        .report-body-tight { margin: 6px 0 0; }
        .report-fine-print { margin: 0 0 12px; font-size: 10pt; color: #555; }
        .report-next-steps-block { border-top: 1px solid #d8dee4; padding-top: 14px; margin-top: 8px; }
        .report-next-steps-list { margin: 0; padding-left: 1.35rem; }
        .report-next-steps-list li { margin-bottom: 12px; }
        .report-next-steps-list li em { font-style: normal; font-weight: 600; color: #374151; }
        .report-page-break { page-break-before: always; }
        .report-json-download {
            display: inline-block;
            margin-top: 4px;
            padding: 8px 14px;
            background: #f16822;
            color: #fff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
        }
        .report-json-download:hover { filter: brightness(0.95); }
        .report-handoff-json-actions { margin: 0; }
        @media print {
            html, body { background: #fff; }
            .report { max-width: none; padding: 0; }
            .report-card, .report-section { break-inside: avoid; }
            .report-print-hide { display: none; }
            .report-json-download { display: none; }
        }
    </style>
</head>
<body>
    <div class="report">
        <header class="report-header">
            <h1>Reveal — hypothesis handoff</h1>
            <p>${this.escapeHtml(mechanism.group_name || `Hypothesis ${idx + 1}`)} · generated ${this.escapeHtml(new Date().toLocaleString())}</p>
        </header>
        ${overview}
        ${card}
        ${appendixBlock}
    </div>
</body>
</html>`;
        },
        buildHtmlReportDocument({ researchContext, mechanismImages, factorSummary, rawKgCsv }) {
            const extractedTerms = `
                <section class="report-section">
                    <h2>Terms taken from your question</h2>
                    <p class="report-fine-print">What the app pulled out to run the search and build your results.</p>
                    <table class="report-table">
                        <tbody>
                            <tr><th>Phenotypes or diseases</th><td>${this.escapeHtml((this.lastPhenotypeTerms || []).join(", ") || "—")}</td></tr>
                            <tr><th>Biological mechanisms</th><td>${this.escapeHtml((this.lastMechanismTerms || []).join(", ") || "—")}</td></tr>
                            <tr><th>Genes you named</th><td>${this.escapeHtml((this.lastGenesOfInterest || []).join(", ") || "—")}</td></tr>
                            <tr><th>Your research context</th><td>${this.escapeHtml(researchContext || "—")}</td></tr>
                            <tr><th>Alternative ways to ask</th><td>${(this.lastAlternativeQueries || []).length ? this.buildReportList(this.lastAlternativeQueries) : '<span class="report-empty">None suggested.</span>'}</td></tr>
                        </tbody>
                    </table>
                </section>
            `;
            const hybridMeta = `
                <section class="report-section">
                    <h2>Notes on how your search was run</h2>
                    <p class="report-fine-print">Technical detail: how genes and terms were matched to the database (for transparency).</p>
                    ${this.hybridSearchMetaSummaryLines.length
                        ? this.buildReportList(this.hybridSearchMetaSummaryLines)
                        : '<div class="report-empty">No extra notes for this run.</div>'}
                </section>
            `;
            const mechanismDiag = this.mechanismDiagnosticAssessment
                ? `
                    <section class="report-section">
                        <h2>Hypothesis generation: eligibility and messages</h2>
                        <p class="report-fine-print">Whether the app could propose mechanisms from your data, and any guidance from the analysis.</p>
                        <table class="report-table">
                            <tbody>
                                <tr><th>Hypotheses produced</th><td>${this.escapeHtml(this.mechanismDiagnosticAssessment.can_generate_hypothesis)}</td></tr>
                                <tr><th>Heads-up</th><td>${this.escapeHtml(this.mechanismDiagnosticAssessment.warning_flag || "—")}</td></tr>
                                <tr><th>If none were produced, why</th><td>${this.escapeHtml(this.mechanismDiagnosticAssessment.rejection_reason || "—")}</td></tr>
                                <tr><th>Suggested follow-up question</th><td>${this.escapeHtml(this.mechanismDiagnosticAssessment.suggested_optimized_query || "—")}</td></tr>
                            </tbody>
                        </table>
                    </section>
                `
                : "";
            const altQueriesCell =
                (this.lastAlternativeQueries || []).length > 0
                    ? this.buildReportList(this.lastAlternativeQueries)
                    : '<span class="report-empty">None suggested.</span>';
            const summarySection = `
                <section class="report-section">
                    <h2>Overview</h2>
                    <p class="report-fine-print">High-level snapshot of your question, extracted search terms, and this session’s results.</p>
                    <table class="report-table">
                        <tbody>
                            <tr><th>Your question</th><td>${this.escapeHtml(this.userQuery || "—")}</td></tr>
                            <tr><th>Research context</th><td>${this.escapeHtml(researchContext || "—")}</td></tr>
                            <tr><th>Phenotypes or diseases (extracted)</th><td>${this.escapeHtml((this.lastPhenotypeTerms || []).join(", ") || "—")}</td></tr>
                            <tr><th>Biological mechanisms (extracted)</th><td>${this.escapeHtml((this.lastMechanismTerms || []).join(", ") || "—")}</td></tr>
                            <tr><th>Genes you named (extracted)</th><td>${this.escapeHtml((this.lastGenesOfInterest || []).join(", ") || "—")}</td></tr>
                            <tr><th>Alternative ways to ask</th><td>${altQueriesCell}</td></tr>
                            <tr><th>Summary of findings</th><td>${this.escapeHtml(this.mechanisms_summary || "—")}</td></tr>
                            <tr><th>Phenotypes in your selection</th><td>${this.escapeHtml(this.phenotypeCount)}</td></tr>
                            <tr><th>Trait-group (gene set) clusters in your selection</th><td>${this.escapeHtml(this.factorCount)}</td></tr>
                            <tr><th>Mechanism cards in this report</th><td>${this.escapeHtml((this.mechanisms || []).length)}</td></tr>
                        </tbody>
                    </table>
                </section>
            `;
            const appendix = `
                <section class="report-section report-page-break">
                    <h2>Appendix: technical summary (JSON)</h2>
                    <p class="report-fine-print">Machine-readable merge of phenotypes, gene sets, and scores.</p>
                    <pre class="report-pre">${this.escapeHtml(factorSummary || "{}")}</pre>
                </section>
                <section class="report-section">
                    <h2>Appendix: knowledge graph table (CSV)</h2>
                    <p class="report-fine-print">The relationship table used when proposing mechanisms.</p>
                    <pre class="report-pre">${this.escapeHtml(rawKgCsv || "")}</pre>
                </section>
            `;
            const mechanismHypothesesSection = `
        <section class="report-section">
            <h2>Suggested mechanisms</h2>
            <p class="report-fine-print">Each card matches what you see under Results: hypothesis text, map, genes, data network, and optional next steps.</p>
            ${this.buildMechanismReportSections(mechanismImages)}
        </section>`;
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Factor-based Reveal Report</title>
    <style>
        html, body { margin: 0; padding: 0; background: #f5f6f8; color: #1f2933; }
        body, body * { box-sizing: border-box; }
        body, p, li, td, th, div, span, a, button, input, textarea, pre { font-size: 11pt; font-family: Arial, Helvetica, sans-serif; line-height: 1.45; }
        .report { max-width: 1180px; margin: 0 auto; padding: 24px; background: #fff; }
        .report-header { border-bottom: 2px solid #f16822; padding-bottom: 16px; margin-bottom: 24px; }
        .report-header h1 { font-size: 24pt; margin: 0 0 8px; }
        .report-header p { margin: 0; }
        .report-section { margin-bottom: 28px; }
        .report-section h2 { font-size: 18pt; margin: 0 0 12px; color: #f16822; }
        .report-section h3 { font-size: 15pt; margin: 0 0 8px; }
        .report-section h4 { font-size: 14pt; margin: 0 0 10px; }
        .report-section h5 { font-size: 11pt; margin: 0 0 8px; }
        .report-card { border: 1px solid #d8dee4; border-radius: 8px; padding: 18px; background: #fafbfc; margin-bottom: 18px; }
        .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .report-table th, .report-table td { border: 1px solid #d8dee4; padding: 8px 10px; text-align: left; vertical-align: top; word-break: break-word; }
        .report-table th { background: #f3f4f6; width: 24%; }
        .report-subsection { margin-bottom: 14px; }
        .report-empty { color: #667; font-style: italic; }
        .report-network-image { max-width: 100%; width: 100%; height: auto; border: 1px solid #d8dee4; border-radius: 6px; background: #fff; }
        .report-network-meta { margin-bottom: 8px; color: #555; }
        .report-map-caption { margin: 0 0 10px; }
        .report-body-tight { margin: 6px 0 0; }
        .report-fine-print { margin: 0 0 12px; font-size: 10pt; color: #555; }
        .report-next-steps-block { border-top: 1px solid #d8dee4; padding-top: 14px; margin-top: 8px; }
        .report-next-steps-list { margin: 0; padding-left: 1.35rem; }
        .report-next-steps-list li { margin-bottom: 12px; }
        .report-next-steps-list li em { font-style: normal; font-weight: 600; color: #374151; }
        .report-pre { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; background: #f7f7f8; border: 1px solid #d8dee4; padding: 12px; border-radius: 6px; }
        .report-keyvals > div { margin-bottom: 6px; }
        .report-page-break { page-break-before: always; }
        @media print {
            html, body { background: #fff; }
            .report { max-width: none; padding: 0; }
            .report-card, .report-section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="report">
        <header class="report-header">
            <h1>Factor-based Reveal Report</h1>
            <p>Generated ${this.escapeHtml(new Date().toLocaleString())}</p>
        </header>
        ${summarySection}
        ${hybridMeta}
        ${mechanismDiag}
        ${mechanismHypothesesSection}
        ${this.buildReportFactorCards(this.factorDataTableRowsFiltered || [], "Your selected phenotypes and trait groups")}
        ${this.buildReportFactorCards(this.remainingGeneSetClusterRows || [], "Clusters not yet covered by a hypothesis card")}
        ${extractedTerms}
        ${appendix}
    </div>
</body>
</html>`;
        },
        startStepTimer() {
            this.stopStepTimer();
            this.loadStepSeconds = 0;
            this.loadStepTimerId = setInterval(() => {
                this.loadStepSeconds += 1;
            }, 1000);
        },
        stopStepTimer() {
            if (this.loadStepTimerId != null) {
                clearInterval(this.loadStepTimerId);
                this.loadStepTimerId = null;
            }
        },
        startRemainingGenerateTimer() {
            this.stopRemainingGenerateTimer();
            this.remainingGenerateStartedAt = Date.now();
            this.remainingGenerateNow = Date.now();
            this.remainingGenerateTimerId = setInterval(() => {
                this.remainingGenerateNow = Date.now();
            }, 250);
        },
        stopRemainingGenerateTimer() {
            if (this.remainingGenerateTimerId != null) {
                clearInterval(this.remainingGenerateTimerId);
                this.remainingGenerateTimerId = null;
            }
            this.remainingGenerateStartedAt = null;
        },
        /** Elapsed time label for remaining-cluster Generate (same style as step timer). */
        formatRemainingGenerateElapsed() {
            if (this.remainingGenerateStartedAt == null) return "";
            const ms = Math.max(0, (this.remainingGenerateNow || Date.now()) - this.remainingGenerateStartedAt);
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}m${String(seconds).padStart(2, "0")}s`;
        },
        setLoadStatus(msg, stopTimer = false) {
            this.loadStatus = msg;
            //this.setLoadStep(`----${msg}`);
            if (stopTimer) this.stopStepTimer();
            else this.startStepTimer();
        },
        setLoadStep(msg, subMsg, time){
            const index = this.statusSteps.findIndex(o => o.msg === msg);
            if(index>-1){
                this.statusSteps[index].subMsg.push(subMsg);
            }else{
                this.statusSteps.push({
                    msg: msg,
                    subMsg: [subMsg],
                    expanded: false
                });
            }
        },
        setStep(step, toggleTimer=false){
            if(step.type==='error'){
                this.steps.push({
                    type: step.type,
                    title: step.title
                })
                if(this.stepsTimer){
                    clearInterval(this.stepsTimer);
                    this.stepsTimer = null;
                    this.now = now;
                }
                return;
            }

            const ID = step.id;
            if(!ID) {
                return;
            }

            const now = Date.now()
            if(toggleTimer){
                if(this.steps?.length===0){
                    //start this.stepsTimer
                    this.stepsTime = now;
                    this.stepsTimer = setInterval(() => {
                        this.now = Date.now();
                    }, 500);
                }else{
                    //stop this.stepsTimer
                    clearInterval(this.stepsTimer);
                    this.stepsTimer = null;
                    this.now = now;
                }
            }

            let IDidx = this.steps.findIndex(o => o.id === ID);
            if(IDidx === -1){
                this.steps.push({
                    id: ID,
                    title: step.title,
                    substeps: [],
                    expanded: false,
                    timeStart: now,
                    time: null,
                })
                IDidx = this.steps.length-1;

                if(this.stepsTimer && this.steps.length > 1){
                    const prev = this.steps[IDidx - 1];
                    prev.time = now - prev.timeStart;
                }
            }
            if(step.substep){
                const sID = step.substep.id;
                if(!sID) {
                    return;
                }
                const sIDidx = this.steps[IDidx].substeps.findIndex(o => o.id === sID);
                if(sIDidx === -1){
                    this.steps[IDidx].substeps.push({
                        id: sID,
                        title: step.substep.title,
                        result: step.substep.result,
                        expanded: false
                    })
                }else{
                    this.steps[IDidx].substeps[sIDidx].result = step.substep.result;
                }
            }
        },
        formatTime(ms) {
            if (!ms) return null;
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            if(seconds<0) return null;
            return `${String(minutes)}m${String(seconds).padStart(2, '0')}s`;
        },
        currStepTime(step){
            return this.formatTime(this.now - step.timeStart);
        },
        /**
         * Hypothesis retry: step 4 already exists and setStep(..., true) on completion stopped stepsTimer.
         * Reset elapsed origin, clear completion substeps, and restart the interval so UI time updates again.
         */
        restartMechanismHypothesisStepTimer() {
            const idx = (this.steps || []).findIndex((s) => s && s.id === "4");
            const t = Date.now();
            if (idx !== -1) {
                this.$set(this.steps[idx], "timeStart", t);
                this.$set(this.steps[idx], "time", null);
                this.$set(this.steps[idx], "substeps", []);
            }
            this.now = t;
            this.stepsPausedAt = null;
            if (this.stepsTimer) {
                clearInterval(this.stepsTimer);
                this.stepsTimer = null;
            }
            this.stepsTimer = setInterval(() => {
                this.now = Date.now();
            }, 500);
        },
        expandStepById(stepId) {
            const idx = this.steps.findIndex((s) => s.id === stepId);
            if (idx !== -1) {
                this.$set(this.steps[idx], "expanded", true);
            }
        },
        expandStepToResult(stepId) {
            const idx = this.steps.findIndex((s) => s.id === stepId);
            if (idx === -1) return;
            this.$set(this.steps[idx], "expanded", true);
            (this.steps[idx].substeps || []).forEach((substep, subIdx) => {
                if (substep && substep.result) {
                    this.$set(this.steps[idx].substeps[subIdx], "expanded", true);
                }
            });
        },
        waitForStepApproval(stepId, message, expandToResult = false) {
            const sid = String(stepId);
            if (sid === "1") this.showTab = "terms";
            else if (sid === "2") this.showTab = "data";
            if (expandToResult) this.expandStepToResult(stepId);
            else this.expandStepById(stepId);
            this.pauseStepsElapsedForReview();
            this.stepApprovalGateActive = true;
            this.stepApprovalGateStepId = String(stepId);
            this.stepApprovalGateMessage = message || "Review this step, then continue.";
            this.setLoadStatus("Waiting for your approval to continue…", true);
            return new Promise((resolve) => {
                this.stepApprovalGateResolver = resolve;
            });
        },
        pauseStepsElapsedForReview() {
            if (this.stepsPausedAt != null) return;
            this.stepsPausedAt = Date.now();
            if (this.stepsTimer) {
                clearInterval(this.stepsTimer);
                this.stepsTimer = null;
            }
            this.now = this.stepsPausedAt;
        },
        resumeStepsElapsedAfterReview() {
            if (this.stepsPausedAt == null) return;
            const resumedAt = Date.now();
            const pausedMs = Math.max(0, resumedAt - this.stepsPausedAt);
            if (this.stepsTime != null) {
                this.stepsTime += pausedMs;
            }
            (this.steps || []).forEach((s) => {
                if (s && s.time == null && s.timeStart != null) {
                    s.timeStart += pausedMs;
                }
            });
            this.stepsPausedAt = null;
            this.now = resumedAt;
            this.stepsTimer = setInterval(() => {
                this.now = Date.now();
            }, 500);
        },
        buildSearchCriteriaEditRows() {
            const phen = Array.isArray(this.lastPhenotypeTerms) ? this.lastPhenotypeTerms : [];
            const mech = Array.isArray(this.lastMechanismTerms) ? this.lastMechanismTerms : [];
            const goi = Array.isArray(this.lastGenesOfInterest) ? this.lastGenesOfInterest : [];
            const researchContext =
                this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values != null
                    ? String(this.searchCriteria[1].values)
                    : "";
            this.searchCriteriaEditRows = [
                { type: "Phenotype terms", term: phen.join(", ") },
                { type: "Mechanism terms", term: mech.join(", ") },
                { type: "Genes of interest", term: goi.join(", ") },
                { type: "Research context", term: researchContext },
            ];
            this.searchCriteriaEditRowsDefault = JSON.parse(JSON.stringify(this.searchCriteriaEditRows));
        },
        resetSearchCriteriaGateEdits() {
            this.searchCriteriaEditRows = JSON.parse(JSON.stringify(this.searchCriteriaEditRowsDefault || []));
        },
        applySearchCriteriaGateEdits() {
            const rows = Array.isArray(this.searchCriteriaEditRows) ? this.searchCriteriaEditRows : [];
            const phenotypeRow = rows.find((r) => r && r.type === "Phenotype terms");
            const mechanismRow = rows.find((r) => r && r.type === "Mechanism terms");
            const goiRow = rows.find((r) => r && r.type === "Genes of interest");
            const contextRow = rows.find((r) => r && r.type === "Research context");
            const phenotypeTerms = String((phenotypeRow && phenotypeRow.term) || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            const mechanismTerms = String((mechanismRow && mechanismRow.term) || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            const genesOfInterest = String((goiRow && goiRow.term) || "")
                .split(/[,;\n]/)
                .map((s) => s.trim())
                .filter(Boolean);
            const researchContext = contextRow ? String(contextRow.term || "").trim() : "";

            this.lastPhenotypeTerms = phenotypeTerms;
            this.lastMechanismTerms = mechanismTerms;
            this.lastGenesOfInterest = genesOfInterest;
            const searchTerms = [...phenotypeTerms, ...mechanismTerms];
            this.searchTerm = searchTerms.join(", ");
            this.searchCriteria = [
                {
                    search_criteria: "Search Terms",
                    values: searchTerms.length ? searchTerms : ["(none extracted)"],
                    why: "We extracted this from your search query.",
                    purpose:
                        "These terms will be used to search for related phenotype↔signature associations via semantic search.",
                },
                {
                    search_criteria: "Research Context",
                    values: researchContext || "(none extracted)",
                    why: "We inferred this from your search query.",
                    purpose:
                        "This context will be used to tailor mechanistic hypotheses to your research.",
                },
            ];
        },
        normalizeAlternativeQueries(raw) {
            if (raw == null) return [];
            if (Array.isArray(raw)) {
                return raw
                    .map((q) => String(q || "").trim())
                    .filter(Boolean);
            }
            const s = String(raw).trim();
            if (!s) return [];
            return s
                .split(/\n|;/)
                .map((q) => q.replace(/^\d+[\).\s-]+/, "").trim())
                .filter(Boolean);
        },
        onAlternativeQuerySelected(query) {
            const nextQuery = String(query || "").trim();
            if (!nextQuery) return;
            this.userQuery = nextQuery;
            if (this.stepApprovalGateActive && this.stepApprovalGateStepId === "1") {
                this.cancelStepGate(false);
            }
            this.queryParse();
        },
        /**
         * From mechanism diagnostics: fill the main search box and restart the workflow (extraction-first via queryParse).
         */
        applySuggestedOptimizedQuery(text) {
            let q = text != null ? String(text).trim() : "";
            if (!q && this.mechanismDiagnosticAssessment && this.mechanismDiagnosticAssessment.suggested_optimized_query) {
                q = String(this.mechanismDiagnosticAssessment.suggested_optimized_query).trim();
            }
            if (!q) return;
            this.userQuery = q;
            this.showTab = "terms";
            this.queryParse();
            this.$nextTick(() => {
                const el = this.$refs.queryInput;
                if (el) el.focus();
            });
        },
        cancelStepGate(approved = false) {
            const resolver = this.stepApprovalGateResolver;
            this.stepApprovalGateActive = false;
            this.stepApprovalGateStepId = "";
            this.stepApprovalGateMessage = "";
            this.stepApprovalGateResolver = null;
            this.resumeStepsElapsedAfterReview();
            if (typeof resolver === "function") resolver(!!approved);
        },
        isPairIncluded(row) {
            const key = this.getRowKey(row);
            if (!key) return false;
            if (Object.prototype.hasOwnProperty.call(this.pairSelectionOverrides, key)) {
                return !!this.pairSelectionOverrides[key];
            }
            return !!(row && row.included);
        },
        onPairIncludedToggle(row, checked) {
            const key = this.getRowKey(row);
            if (!key) return;
            this.$set(this.pairSelectionOverrides, key, !!checked);
        },
        snapshotFilteredSelectionBaseline() {
            const currentRows = this.factorDataTableRows || [];
            const nextOverrides = {};
            const baseline = [];
            currentRows.forEach((r) => {
                const key = this.getRowKey(r);
                if (!key) return;
                const included = !!r.included;
                nextOverrides[key] = included;
                if (included) baseline.push(key);
            });
            this.pairSelectionOverrides = nextOverrides;
            this.llmFilteredPairKeysBaseline = baseline;
        },
        normalizeHeatmapSelectionAfterRegroup() {
            this.$nextTick(() => {
                const ref = this.$refs.factorBaseRevealHeatmap;
                const comp = Array.isArray(ref) ? ref[0] : ref;
                if (!comp) return;
                const opts = Array.isArray(comp.phenotypeOptions) ? comp.phenotypeOptions : [];
                if (!opts.length) {
                    comp.selectedPhenotype = "";
                    return;
                }
                if (!opts.some((o) => o && o.value === comp.selectedPhenotype)) {
                    comp.selectedPhenotype = opts[0].value;
                }
            });
        },
        buildSelectedFactorDataFromRows(rows) {
            const subset = {};
            (rows || []).forEach((row) => {
                const phenotype = row && row.phenotype != null ? String(row.phenotype).trim() : "";
                if (!phenotype) return;
                const pData = this.factorData && this.factorData[phenotype];
                if (!pData) return;
                const factors = pData.factors || [];
                const allFactors = pData.allFactors || [];
                const factorItem =
                    factors.find((x) => x.factor === row.factor || String(x.factor) === String(row.factor)) ||
                    allFactors.find((x) => x.factor === row.factor || String(x.factor) === String(row.factor));
                if (!factorItem) return;
                if (!subset[phenotype]) subset[phenotype] = { genes: {}, factors: [] };
                if (!subset[phenotype].factors.some((f) => String(f.factor) === String(factorItem.factor))) {
                    subset[phenotype].factors.push(JSON.parse(JSON.stringify(factorItem)));
                }
                Object.keys(factorItem.genes || {}).forEach((g) => {
                    if (pData.genes && pData.genes[g] != null && subset[phenotype].genes[g] == null) {
                        subset[phenotype].genes[g] = JSON.parse(JSON.stringify(pData.genes[g]));
                    }
                });
            });
            return subset;
        },
        globalStepIndexForStep(step) {
            return (this.steps || []).findIndex((s) => s === step);
        },
        dataStepShowsSpinner(step) {
            const idx = this.globalStepIndexForStep(step);
            if (idx < 0) return false;
            return idx === this.steps.length - 1 && !this.loadComplete && !this.stepApprovalGateActive;
        },
        dataStepShowsGatePause(step) {
            const idx = this.globalStepIndexForStep(step);
            if (idx < 0) return false;
            return idx === this.steps.length - 1 && !this.loadComplete && this.stepApprovalGateActive;
        },
        approveStepGate() {
            if (!this.stepApprovalGateActive) return;
            const gateStepId = this.stepApprovalGateStepId;
            if (this.stepApprovalGateStepId === "1") {
                this.applySearchCriteriaGateEdits();
                this.searchCriteriaExtractionGateDone = true;
                this.showTab = "data";
            } else if (gateStepId === "2") {
                this.revealResultsTabUnlocked = true;
                this.showTab = "results";
            }
            const stepIdx = this.steps.findIndex((s) => s && s.id === gateStepId);
            if (stepIdx !== -1) {
                this.$set(this.steps[stepIdx], "expanded", false);
                const substeps = this.steps[stepIdx].substeps || [];
                substeps.forEach((_, subIdx) => {
                    this.$set(this.steps[stepIdx].substeps[subIdx], "expanded", false);
                });
            }
            this.cancelStepGate(true);
            this.setLoadStatus("Continuing workflow…");
        },
        toggleStep(i, ii=null){
            if(ii !== null){
                this.steps[i].substeps[ii].expanded = !this.steps[i].substeps[ii].expanded
            }else{
                this.steps[i].expanded = !this.steps[i].expanded
            }
        },
        toggleStatus(i) {
            this.statusSteps[i].expanded = !this.statusSteps[i].expanded
        },
        /** Return human-readable phenotype for display; use phenotype id for queries. Does not mutate stored data. */
        getPhenotypeDisplay(phenotypeId) {
            if (phenotypeId == null) return "";
            const idStr = String(phenotypeId).trim();
            if (!idStr) return "";
            const desc = this.phenotypeDescriptionById && this.phenotypeDescriptionById[phenotypeId];
            if (desc != null && String(desc).trim() !== "") return String(desc).trim();
            const cfdeLabel = resolveCfdePhenotypeLabel(phenotypeId);
            if (cfdeLabel) return String(cfdeLabel);
            return idStr;
        },
        /** Gene set cluster group column: resolve hybrid `label` (stored as factorLabel) via CFDE maps. */
        getFactorClusterDisplay(row) {
            if (!row) return "";
            const key =
                row.factorLabel != null && String(row.factorLabel).trim() !== ""
                    ? String(row.factorLabel).trim()
                    : row.factor != null
                      ? String(row.factor).trim()
                      : "";
            return resolveCfdeFactorClusterDisplayLabel(key);
        },
        /** Pills / KG strings: same resolution as table (Orphanet_*, gcat_*, etc.). */
        getFactorClusterDisplayString(raw) {
            return resolveCfdeFactorClusterDisplayLabel(raw);
        },
        /** Comma-separated list of phenotype descriptions for on-screen report. */
        getRelevantPhenotypesDisplay(phenotypeIds) {
            if (!Array.isArray(phenotypeIds) || !phenotypeIds.length) return "";
            return phenotypeIds.map((id) => this.getPhenotypeDisplay(id));
        },
        /** Format relevant gene sets for display: "id (description)" when description exists. */
        formatRelevantGeneSetsForDisplay(geneSetIds) {
            if (!Array.isArray(geneSetIds) || !geneSetIds.length) return "";
            const infoMap = this.buildGeneSetInfoMap();
            return geneSetIds.map((gs) => {
                const info = infoMap[gs];
                const desc = (info.description != null && String(info.description).trim() !== "") ? String(info.description).trim() : "";
                const program = (info.gene_set_program != null && String(info.gene_set_program).trim() !== "") ? String(info.gene_set_program).trim() : "";
                const geneSet = {};
                geneSet.gs = gs;
                if (desc) geneSet.desc = desc;
                if (program) geneSet.program = program;
                return geneSet;
            })
            /*
            return geneSetIds.map((gs) => {
                const info = infoMap[gs];
                if (!info) return gs;
                const desc = (info.description != null && String(info.description).trim() !== "") ? String(info.description).trim() : "";
                const program = (info.gene_set_program != null && String(info.gene_set_program).trim() !== "") ? String(info.gene_set_program).trim() : "";
                if (desc && program) return `${gs} (${desc}, ${program})`;
                if (desc) return `${gs} (${desc})`;
                if (program) return `${gs} (${program})`;
                return gs;
            }).join(", ");
            */
        },
        /**
         * Build a map from gene set id to { description, gene_set_program } using factorData.
         * @returns {{ [geneSetId: string]: { description: string, gene_set_program: string } }}
         */
        buildGeneSetInfoMap() {
            const map = {};
            const data = this.factorData || {};
            Object.keys(data).forEach((phenotype) => {
                const factors = data[phenotype] && data[phenotype].factors || [];
                factors.forEach((f) => {
                    const ids = (typeof f.top_gene_sets === "string" && f.top_gene_sets)
                        ? f.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                        : [];
                    const descs = (typeof f.gene_set_description === "string" && f.gene_set_description)
                        ? f.gene_set_description.split(/\s*\|\s*/).map((s) => s.trim())
                        : [];
                    const programs = (typeof f.gene_set_program === "string" && f.gene_set_program)
                        ? f.gene_set_program.split(/\s*\|\s*/).map((s) => s.trim())
                        : [];
                    ids.forEach((id, i) => {
                        if (!id) return;
                        if (!map[id]) {
                            map[id] = { description: descs[i] != null ? descs[i] : "", gene_set_program: programs[i] != null ? programs[i] : "" };
                        } else {
                            if ((descs[i] != null && descs[i] !== "") && !map[id].description) map[id].description = descs[i];
                            if ((programs[i] != null && programs[i] !== "") && !map[id].gene_set_program) map[id].gene_set_program = programs[i];
                        }
                    });
                });
            });
            return map;
        },
        /**
         * Build a map from gene set id to description using factorData (top_gene_sets and gene_set_description per factor).
         * @returns {{ [geneSetId: string]: string }}
         */
        buildGeneSetDescriptionMap() {
            const infoMap = this.buildGeneSetInfoMap();
            const map = {};
            Object.keys(infoMap).forEach((id) => { map[id] = infoMap[id].description || ""; });
            return map;
        },
        /** True if factorData[phenotypeKey] lists this gene set on any factor's top_gene_sets. */
        factorDataHasGeneSet(phenotypeKey, geneSetId) {
            const g = geneSetId != null ? String(geneSetId).trim() : "";
            if (!g || !this.factorData || !this.factorData[phenotypeKey]) return false;
            const factors = (this.factorData[phenotypeKey].factors || []);
            return factors.some((f) => {
                const ids = (typeof f.top_gene_sets === "string" && f.top_gene_sets)
                    ? f.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                    : [];
                return ids.includes(g);
            });
        },
        /**
         * Phenotype **id** for Explore associations (not display name). Picks relevant phenotypes whose factor data include this gene set when possible.
         */
        resolvePhenotypeIdForCfdeExploreAssociation(mechanism, geneSetId) {
            const g = geneSetId != null ? String(geneSetId).trim() : "";
            if (!g) return "";
            const rel = Array.isArray(mechanism && mechanism.relevant_phenotypes) ? mechanism.relevant_phenotypes : [];
            if (rel.length === 1) return String(rel[0]);
            for (let i = 0; i < rel.length; i++) {
                const pid = String(rel[i]);
                if (this.factorDataHasGeneSet(pid, g)) return pid;
            }
            const data = this.factorData || {};
            const keys = Object.keys(data);
            for (let i = 0; i < keys.length; i++) {
                if (this.factorDataHasGeneSet(keys[i], g)) return keys[i];
            }
            if (rel.length) return String(rel[0]);
            return keys.length ? keys[0] : "";
        },
        resolveSourceForCfdeExploreGeneSet(geneSetId) {
            const infoMap = this.buildGeneSetInfoMap();
            const id = geneSetId != null ? String(geneSetId).trim() : "";
            const info = id ? infoMap[id] : null;
            const prog = info && info.gene_set_program != null ? String(info.gene_set_program).trim() : "";
            return prog || "cfde";
        },
        /** Research context for CFDE Explore / Design (`researchContext` query param in cfdeExplore.vue). */
        getRevealResearchContextForExplore() {
            if (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values != null) {
                return String(this.searchCriteria[1].values).trim();
            }
            return "";
        },
        /**
         * CFDE Explore: `associations`, optional `hypothesis` + `researchContext` (same names as utilsBox.keyParams in cfdeExplore).
         */
        cfdeExploreAssociationHref(phenotypeId, geneSetId, program, hypothesisOptional) {
            const p = phenotypeId != null ? String(phenotypeId).trim() : "";
            const g = geneSetId != null ? String(geneSetId).trim() : "";
            const s = (program != null && String(program).trim() !== "") ? String(program).trim() : "cfde";
            if (!g) return "#";
            const triple = `${p},${g},${s}`;
            const params = new URLSearchParams();
            params.set("associations", triple);
            const hypothesis = hypothesisOptional != null ? String(hypothesisOptional).trim() : "";
            if (hypothesis) params.set("hypothesis", hypothesis);
            const researchContext = this.getRevealResearchContextForExplore();
            if (researchContext) params.set("researchContext", researchContext);
            return kcURL(`/r/cfde_explore?${params.toString()}`);
        },
        /** Hypothesis-card gene set link; includes mechanism hypothesis when present. */
        cfdeExploreGeneSetHref(mechanism, geneSetId, explicitProgram) {
            const phenotype = this.resolvePhenotypeIdForCfdeExploreAssociation(mechanism, geneSetId);
            const geneSet = geneSetId != null ? String(geneSetId).trim() : "";
            if (!geneSet) return "#";
            const source =
                (explicitProgram != null && String(explicitProgram).trim() !== "")
                    ? String(explicitProgram).trim()
                    : this.resolveSourceForCfdeExploreGeneSet(geneSet);
            const hypothesis = mechanism && mechanism.hypothesis != null ? String(mechanism.hypothesis).trim() : "";
            return this.cfdeExploreAssociationHref(phenotype, geneSet, source, hypothesis);
        },
        isNextStepExperimentalValidation(step) {
            const c = step && step.category != null ? String(step.category).trim().toLowerCase() : "";
            return c === "experimental validation";
        },
        /** Plain text for cfde_design ?constraints= from one next_steps item (no category line). */
        formatExperimentalValidationStepForDesignConstraints(step) {
            if (!step || typeof step !== "object") return "";
            const action = step.action != null ? String(step.action).trim() : "";
            const reason = step.reason != null ? String(step.reason).trim() : "";
            const lines = [];
            if (action) lines.push(`Action: ${action}`);
            if (reason) lines.push(`Reason: ${reason}`);
            return lines.join("\n");
        },
        /**
         * Open DESIGN in a new tab. Pass optional `experimentalValidationStep` to send `constraints` (that step's text).
         */
        openDesignProtocolForMechanism(mechanism, experimentalValidationStep) {
            if (!mechanism || typeof mechanism !== "object") return;

            const researchContext = this.getRevealResearchContextForExplore();
            const hypothesis = mechanism.hypothesis != null ? String(mechanism.hypothesis) : "";
            const genesRaw = Array.isArray(mechanism.candidate_genes) && mechanism.candidate_genes.length
                ? mechanism.candidate_genes
                : (Array.isArray(mechanism.genes) ? mechanism.genes : []);
            const genes = Array.from(
                new Set(
                    genesRaw
                        .map((item) => {
                            if (typeof item === "string") return item.trim();
                            if (item && item.gene != null) return String(item.gene).trim();
                            return "";
                        })
                        .filter(Boolean)
                )
            ).join(",");

            const params = new URLSearchParams();
            params.set("researchContext", researchContext);
            params.set("hypothesis", hypothesis);
            params.set("genes", genes);
            if (
                experimentalValidationStep &&
                this.isNextStepExperimentalValidation(experimentalValidationStep)
            ) {
                const cons = this.formatExperimentalValidationStepForDesignConstraints(
                    experimentalValidationStep
                );
                if (cons) params.set("constraints", cons);
            }

            const designUrl = kcURL(`/r/cfde_design?${params.toString()}`);
            window.open(designUrl, "_blank", "noopener");
        },
        getMechanismTopGenes(mechanism, limit = 10) {
            const genes = Array.isArray(mechanism?.candidate_genes) && mechanism.candidate_genes.length
                ? mechanism.candidate_genes
                : (Array.isArray(mechanism?.genes) ? mechanism.genes : []);
            return genes.slice(0, Math.max(1, limit));
        },
        buildMechanismClipboardText(mechanism, idx) {
            const context =
                (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                    ? String(this.searchCriteria[1].values).trim()
                    : "";
            const topGenes = this.getMechanismTopGenes(mechanism, 10);
            const topGenesBlock = topGenes.length
                ? topGenes.map((g, i) => {
                    const score = g && g.scores && (g.scores.combined ?? g.scores.c) != null
                        ? Number(g.scores.combined ?? g.scores.c).toFixed(2)
                        : "—";
                    const gene = g && g.gene != null ? String(g.gene) : "—";
                    const role = g && g.group != null ? String(g.group) : "—";
                    return `${i + 1}. ${gene} - ${role} (Combined: ${score})`;
                }).join("\n")
                : "None listed.";
            const flow = mechanism?.hypothesis_in_kg || {};
            const flowCaption = flow.caption != null ? String(flow.caption) : "";
            const flowEdges = Array.isArray(flow.edges)
                ? flow.edges.slice(0, 8).map((e) => `${e.from} -> ${e.to}${e.label ? ` (${e.label})` : ""}`).join("\n")
                : "";
            const nextSteps = Array.isArray(mechanism?.next_steps) ? mechanism.next_steps.slice(0, 3) : [];
            const nextStepsBlock = nextSteps.length
                ? nextSteps.map((s) => {
                    const cat = s && s.category != null && String(s.category).trim() !== ""
                        ? String(s.category).trim()
                        : "Uncategorized";
                    const action = s && s.action != null && String(s.action).trim() !== ""
                        ? String(s.action).trim()
                        : "—";
                    const reason = s && s.reason != null && String(s.reason).trim() !== ""
                        ? ` (Reason: ${String(s.reason).trim()})`
                        : "";
                    return `[${cat}] ${action}${reason}`;
                }).join("\n")
                : "None listed.";
            const nextQueries = Array.isArray(mechanism?.next_queries) ? mechanism.next_queries.slice(0, 3) : [];
            const nextQueriesBlock = nextQueries.length
                ? nextQueries.map((q, i) => `${i + 1}. ${q}`).join("\n")
                : "None listed.";

            return [
                "Instruction for assistant:",
                "Act as an expert principal investigator and systems biologist. Use only the evidence below; mark assumptions explicitly.",
                "",
                `Research Context: ${context || "—"}`,
                "",
                `Hypothesis ${idx + 1}: ${mechanism?.group_name || "(unnamed)"}`,
                `${mechanism?.hypothesis || "—"}`,
                "",
                "Rationale / Novelty:",
                `${mechanism?.novelty_explanation || mechanism?.novelty || "—"}`,
                "",
                "Biological Flow (Visual Spine):",
                `${flowCaption || "—"}`,
                `${flowEdges || ""}`,
                "",
                "Top Candidate Genes (max 10):",
                topGenesBlock,
                "",
                "Suggested Next Steps:",
                nextStepsBlock,
                "",
                "Next Queries:",
                nextQueriesBlock,
                "",
                "Task options:",
                "A) Critically evaluate biological plausibility.",
                "B) Draft a step-by-step experimental validation plan.",
                "C) Expand or refine next steps.",
                "D) Suggest confounders and alternative pathways.",
            ].join("\n");
        },
        isMechanismBiolinkMapped(mechanism) {
            return !!(
                mechanism &&
                mechanism.biolink_map_meta &&
                Number(mechanism.biolink_map_meta.mappedNodeCount || 0) > 0
            );
        },
        hasMechanismBiolinkNetwork(mechanism) {
            return !!(
                mechanism &&
                mechanism.biolink_core_spine_network &&
                Array.isArray(mechanism.biolink_core_spine_network.nodes) &&
                mechanism.biolink_core_spine_network.nodes.length > 0
            );
        },
        isMechanismUsingBiolinkMap(mechanism) {
            return !!(
                mechanism &&
                mechanism.map_view_mode === "biolink" &&
                this.hasMechanismBiolinkNetwork(mechanism)
            );
        },
        cloneNetworkForMapView(net) {
            const n = net || {};
            return {
                ...(n || {}),
                nodes: Array.isArray(n.nodes) ? n.nodes.map((x) => ({ ...x })) : [],
                edges: Array.isArray(n.edges) ? n.edges.map((x) => ({ ...x })) : [],
            };
        },
        setMechanismMapViewMode(idx, mode) {
            if (!Array.isArray(this.mechanisms) || !this.mechanisms[idx]) return;
            const mechanism = this.mechanisms[idx];
            const next = { ...mechanism };
            if (mode === "biolink" && this.hasMechanismBiolinkNetwork(mechanism)) {
                next.map_view_mode = "biolink";
                next.core_spine_network = this.cloneNetworkForMapView(mechanism.biolink_core_spine_network);
            } else {
                const original = mechanism.original_core_spine_network || mechanism.core_spine_network || { nodes: [], edges: [] };
                next.map_view_mode = "original";
                next.core_spine_network = this.cloneNetworkForMapView(original);
            }
            this.$set(this.mechanisms, idx, next);
        },
        normalizeBiolinkLookupLabel(label) {
            return String(label == null ? "" : label).trim().replace(/\s+/g, " ").toLowerCase();
        },
        classifyBiolinkNodeType(className, fallbackType = "Entity") {
            const c = String(className || "").toLowerCase().replace(/\s+/g, "");
            if (c.includes("gene") || c.includes("protein")) return "Gene";
            if (
                c.includes("smallmolecule") ||
                c.includes("chemicalentity") ||
                c.includes("chemical_substance") ||
                c.includes("molecular_entity") ||
                c.includes("chemical")
            ) return "Metabolite";
            if (c.includes("biologicalprocess") || c.includes("pathway") || c.includes("activity")) return "Process";
            if (c.includes("phenotypicfeature") || c.includes("disease") || c.includes("trait")) return "Phenotype";
            if (c.includes("cell")) return "Cell";
            if (c.includes("drug")) return "Drug";
            return fallbackType || "Entity";
        },
        inferBiolinkPredicate(actionLabel) {
            const s = String(actionLabel || "").trim().toLowerCase();
            if (!s) return "biolink:related_to";
            if (/inhibit|suppress|downreg|reduce|decrease|block/.test(s)) return "biolink:decreases_activity_of";
            if (/activat|increase|upreg|promot|induce|trigger/.test(s)) return "biolink:increases_activity_of";
            if (/cleav|degrad/.test(s)) return "biolink:affects";
            if (/mediat|modulat|regulat/.test(s)) return "biolink:regulates";
            return "biolink:related_to";
        },
        /**
         * Name Resolution responses vary (array of hits, bulk map keyed by query, matches[], etc.).
         * @returns {{ curie: string | null, resolverLabel: string }}
         */
        extractTopHitFromNameResolutionResponse(json, queryLabel) {
            const q = String(queryLabel || "").trim();
            let arr = null;
            if (Array.isArray(json)) {
                arr = json;
            } else if (json && typeof json === "object") {
                if (q && Array.isArray(json[q])) arr = json[q];
                if (!arr && q) {
                    const lk = Object.keys(json).find((k) => k.toLowerCase() === q.toLowerCase());
                    if (lk && Array.isArray(json[lk])) arr = json[lk];
                }
                if (!arr && Array.isArray(json.matches)) arr = json.matches;
                if (!arr && Array.isArray(json.results)) arr = json.results;
                if (!arr && Array.isArray(json.items)) arr = json.items;
            }
            if (!arr || !arr.length) return { curie: null, resolverLabel: "" };
            const top = arr[0];
            if (!top || typeof top !== "object") return { curie: null, resolverLabel: "" };
            const curie = top.curie || top.identifier || top.id || null;
            const resolverLabel =
                top.label != null && String(top.label).trim() !== "" ? String(top.label).trim() : "";
            return {
                curie: curie != null ? String(curie) : null,
                resolverLabel,
            };
        },
        /**
         * NCATS Name Resolution: prefers query-string style POST (see NameResolution docs);
         * JSON-body variants are attempted as fallback.
         * @returns {{ curie: string | null, resolverLabel: string }}
         */
        async resolveLabelViaNameResolution(label) {
            const key = this.normalizeBiolinkLookupLabel(label);
            if (!key) return { curie: null, resolverLabel: "" };
            if (Object.prototype.hasOwnProperty.call(this.biolinkNameResolveByLabelCache, key)) {
                return this.biolinkNameResolveByLabelCache[key];
            }
            const text = String(label || "").trim();
            if (!text) {
                const empty = { curie: null, resolverLabel: "" };
                this.$set(this.biolinkNameResolveByLabelCache, key, empty);
                return empty;
            }
            const proxyBase = this.revealBiolinkProxyBaseUrl;
            if (proxyBase) {
                let best = { curie: null, resolverLabel: "" };
                try {
                    const resp = await this.fetchWithTimeout(
                        `${proxyBase}/api/reveal/biolink/name-lookup`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Accept: "application/json" },
                            body: JSON.stringify({ label: text, limit: 8 }),
                        },
                        30000
                    );
                    if (resp.ok) {
                        const json = await resp.json().catch(() => null);
                        best = this.extractTopHitFromNameResolutionResponse(json, text);
                    }
                } catch {
                }
                this.$set(this.biolinkNameResolveByLabelCache, key, best);
                return best;
            }
            const attempts = [];
            const bases = [
                "https://name-resolution-sri.renci.org/lookup",
                "https://name-resolution-sri.renci.org/1.3/lookup",
            ];
            bases.forEach((base) => {
                const qs = new URLSearchParams({ string: text, limit: "8" }).toString();
                attempts.push({
                    url: `${base}?${qs}`,
                    init: { method: "POST", headers: { Accept: "application/json" } },
                });
                attempts.push({
                    url: `${base}?${qs}`,
                    init: { method: "GET", headers: { Accept: "application/json" } },
                });
            });
            attempts.push({
                url: "https://name-resolution-sri.renci.org/1.3/lookup",
                init: {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ string: text, offset: 0, limit: 8 }),
                },
            });
            attempts.push({
                url: "https://name-resolution-sri.renci.org/1.3/lookup",
                init: {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ strings: [text], offset: 0, limit: 8 }),
                },
            });
            let best = { curie: null, resolverLabel: "" };
            for (const { url, init } of attempts) {
                try {
                    const resp = await this.fetchWithTimeout(url, init, 30000);
                    if (!resp.ok) continue;
                    const json = await resp.json().catch(() => null);
                    const hit = this.extractTopHitFromNameResolutionResponse(json, text);
                    if (hit.curie) {
                        best = hit;
                        break;
                    }
                    if (!best.resolverLabel && hit.resolverLabel) best = { ...hit };
                } catch {
                }
            }
            this.$set(this.biolinkNameResolveByLabelCache, key, best);
            return best;
        },
        /** When NodeNorm omits types, infer a Biolink-style category from CURIE prefix for coloring. */
        inferBiolinkClassHintFromCurie(curie) {
            const c = String(curie || "").trim();
            if (!c) return "";
            const u = c.toUpperCase();
            if (/^(NCBIGENE|HGNC|ENSEMBL|ENSG|UNIPROT|PR):/i.test(c) || /^OMIM:/i.test(c)) return "biolink:Gene";
            if (/^(PUBCHEM|CHEBI|CHEMBL|DRUGBANK|HMDB|KEGG\.COMPOUND|MESH):/i.test(u)) return "biolink:SmallMolecule";
            if (/^(GO|REACTOME|WIKIPATHWAYS|PW):/i.test(c)) return "biolink:BiologicalProcess";
            if (/^(HP|MONDO|DOID|EFO|UMLS|SNOMED|NCIT):/i.test(c)) return "biolink:PhenotypicFeature";
            return "";
        },
        pickPrimaryBiolinkType(types) {
            const list = Array.isArray(types) ? types.map((t) => String(t || "").trim()).filter(Boolean) : [];
            if (!list.length) return "";
            const tagged = list.find((t) => /biolink:/i.test(t));
            return String(tagged || list[0]);
        },
        findNormalizedNodeEntry(normPayload, requestedCurie) {
            const req = String(requestedCurie || "").trim();
            if (!req || !normPayload || typeof normPayload !== "object") return null;
            if (normPayload[req]) return normPayload[req];
            const lower = req.toLowerCase();
            const key = Object.keys(normPayload).find((k) => String(k).toLowerCase() === lower);
            return key ? normPayload[key] : null;
        },
        async fetchBiolinkNodeDetails(curies) {
            const need = (curies || [])
                .map((c) => String(c || "").trim())
                .filter((c) => c && !Object.prototype.hasOwnProperty.call(this.biolinkNodeByCurieCache, c));
            if (need.length) {
                try {
                    const proxyBase = this.revealBiolinkProxyBaseUrl;
                    const normUrl = proxyBase
                        ? `${proxyBase}/api/reveal/biolink/normalize-nodes`
                        : "https://nodenormalization-sri.renci.org/1.3/get_normalized_nodes";
                    const resp = await this.fetchWithTimeout(
                        normUrl,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Accept: "application/json" },
                            body: JSON.stringify({ curies: need }),
                        },
                        30000
                    );
                    const json = await resp.json().catch(() => ({}));
                    if (resp.ok && json && typeof json === "object") {
                        need.forEach((curie) => {
                            const entry = this.findNormalizedNodeEntry(json, curie);
                            this.$set(this.biolinkNodeByCurieCache, curie, entry);
                        });
                    } else {
                        need.forEach((curie) => this.$set(this.biolinkNodeByCurieCache, curie, null));
                    }
                } catch {
                    need.forEach((curie) => this.$set(this.biolinkNodeByCurieCache, curie, null));
                }
            }
            const out = {};
            (curies || []).forEach((curie) => {
                const key = String(curie || "").trim();
                if (!key) return;
                out[key] = this.biolinkNodeByCurieCache[key] ?? null;
            });
            return out;
        },
        /** TRAPI message: treat non-empty results as evidence the constrained edge can be supported by Translator. */
        trapiKnowledgeIndicatesEdgeSupport(trapiJson) {
            if (!trapiJson || typeof trapiJson !== "object" || trapiJson.error === true) return false;
            const msg = trapiJson.message;
            if (!msg || typeof msg !== "object") return false;
            const results = msg.results;
            if (Array.isArray(results) && results.length > 0) return true;
            return false;
        },
        trapiCategoriesArray(biolinkClass) {
            const c = String(biolinkClass || "").trim();
            return c ? [c] : ["biolink:NamedThing"];
        },
        isTrapiGeneLikeCategory(biolinkClass) {
            const c = String(biolinkClass || "").toLowerCase();
            return c.includes("gene") || c.includes("protein");
        },
        isTrapiDiseaseLikeCategory(biolinkClass) {
            const c = String(biolinkClass || "").toLowerCase();
            return (
                c.includes("disease") ||
                c.includes("phenotyp") ||
                c.includes("condition") ||
                c.includes("syndrome")
            );
        },
        async trapiRelayPostTrapiMessage(trapiEnvelope) {
            const base = this.revealBiolinkProxyBaseUrl;
            if (!base) return null;
            try {
                const resp = await this.fetchWithTimeout(
                    `${base}/api/reveal/biolink/trapi-query`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Accept: "application/json" },
                        body: JSON.stringify(trapiEnvelope),
                    },
                    35000
                );
                if (!resp.ok) return null;
                return await resp.json().catch(() => null);
            } catch {
                return null;
            }
        },
        /**
         * One-hop TRAPI via the REVEAL Biolink endpoint. Tries several QGs: inferred predicate, related_to,
         * standard gene↔disease predicates, swapped ends, and relaxed NamedThing categories —
         * because many KPs never index biolink:related_to for Gene–Disease pairs.
         * @returns {Promise<boolean>}
         */
        async edgeSupportedByTrapiRelay(subjectId, subjectBiolinkCategory, objectId, objectBiolinkCategory, predicate) {
            if (!this.revealBiolinkProxyBaseUrl) return false;
            const sId = String(subjectId || "").trim();
            const oId = String(objectId || "").trim();
            if (!sId || !oId || sId === oId) return false;

            const catA = this.trapiCategoriesArray(subjectBiolinkCategory);
            const catB = this.trapiCategoriesArray(objectBiolinkCategory);
            const nt = ["biolink:NamedThing"];
            const predPrimary =
                String(predicate || "biolink:related_to").trim() || "biolink:related_to";

            const aGene = this.isTrapiGeneLikeCategory(subjectBiolinkCategory);
            const aDis = this.isTrapiDiseaseLikeCategory(subjectBiolinkCategory);
            const bGene = this.isTrapiGeneLikeCategory(objectBiolinkCategory);
            const bDis = this.isTrapiDiseaseLikeCategory(objectBiolinkCategory);

            /** @type {{ n0: string, c0: string[], n1: string, c1: string[], p: string }[]} */
            const plan = [];
            const add = (n0, c0, n1, c1, p) => {
                const pr = String(p || "biolink:related_to").trim() || "biolink:related_to";
                plan.push({ n0, c0: [...c0], n1, c1: [...c1], p: pr });
            };

            add(sId, catA, oId, catB, predPrimary);
            if (predPrimary !== "biolink:related_to") add(sId, catA, oId, catB, "biolink:related_to");

            if (aGene && bDis) add(sId, catA, oId, catB, "biolink:gene_associated_with_condition");
            if (aDis && bGene) add(sId, catA, oId, catB, "biolink:condition_associated_with_gene");

            add(oId, catB, sId, catA, "biolink:related_to");

            if (bGene && aDis) add(oId, catB, sId, catA, "biolink:gene_associated_with_condition");
            if (bDis && aGene) add(oId, catB, sId, catA, "biolink:condition_associated_with_gene");

            add(sId, nt, oId, nt, "biolink:related_to");
            add(oId, nt, sId, nt, "biolink:related_to");

            if (aGene && bDis) add(sId, nt, oId, nt, "biolink:gene_associated_with_condition");
            if (aDis && bGene) add(sId, nt, oId, nt, "biolink:condition_associated_with_gene");

            const seen = new Set();
            for (const t of plan) {
                const body = {
                    message: {
                        query_graph: {
                            nodes: {
                                n0: { ids: [t.n0], categories: t.c0 },
                                n1: { ids: [t.n1], categories: t.c1 },
                            },
                            edges: {
                                e0: {
                                    subject: "n0",
                                    object: "n1",
                                    predicates: [t.p],
                                },
                            },
                        },
                    },
                };
                const sig = JSON.stringify(body.message.query_graph);
                if (seen.has(sig)) continue;
                seen.add(sig);
                const json = await this.trapiRelayPostTrapiMessage(body);
                if (this.trapiKnowledgeIndicatesEdgeSupport(json)) return true;
            }
            return false;
        },
        edgeEndpointIdsFromMappedNode(node) {
            if (!node || !node.metadata || typeof node.metadata !== "object") return { subId: "", biolinkClass: "" };
            const m = node.metadata;
            const subId = String(m.primary_identifier || m.curie || "").trim();
            const biolinkClass = String(m.biolink_class || "").trim();
            return { subId, biolinkClass };
        },
        /**
         * Run one edge through Translator (relay); used for progressive and batch validation.
         */
        async validateSingleMappedBiolinkEdge(edge, nodeById) {
            const srcKey =
                edge.source != null
                    ? String(edge.source)
                    : edge.from != null
                      ? String(edge.from)
                      : "";
            const tgtKey =
                edge.target != null
                    ? String(edge.target)
                    : edge.to != null
                      ? String(edge.to)
                      : "";
            const srcNode = nodeById[srcKey];
            const tgtNode = nodeById[tgtKey];
            const a = this.edgeEndpointIdsFromMappedNode(srcNode);
            const b = this.edgeEndpointIdsFromMappedNode(tgtNode);
            const pred = String(edge.predicate || "biolink:related_to").trim() || "biolink:related_to";
            let validated = false;
            let checkedDelta = 0;
            let supportedDelta = 0;
            let skippedDelta = 0;
            if (a.subId && b.subId) {
                checkedDelta = 1;
                validated = await this.edgeSupportedByTrapiRelay(
                    a.subId,
                    a.biolinkClass,
                    b.subId,
                    b.biolinkClass,
                    pred
                );
                if (validated) supportedDelta = 1;
            } else {
                skippedDelta = 1;
            }
            const builtEdge = {
                ...edge,
                dashes: !validated,
                metadata: {
                    ...(edge.metadata || {}),
                    inferred_edge: !validated,
                    ...(a.subId && b.subId
                        ? { trapi_validated: validated }
                        : { trapi_validation_skipped: true }),
                },
            };
            return { builtEdge, checkedDelta, supportedDelta, skippedDelta };
        },
        /**
         * After Biolink node mapping, check each edge against Translator via REVEAL Biolink API (batch).
         */
        async validateBiolinkMappedEdgesViaRelay(mappedNodes, mappedEdges) {
            const proxyBase = this.revealBiolinkProxyBaseUrl;
            if (!proxyBase) {
                return { edges: mappedEdges, trapiStats: null };
            }
            const nodeById = {};
            (mappedNodes || []).forEach((n) => {
                if (n && n.id != null) nodeById[String(n.id)] = n;
            });
            const out = [];
            let checked = 0;
            let supported = 0;
            let skipped = 0;
            for (const edge of mappedEdges || []) {
                const { builtEdge, checkedDelta, supportedDelta, skippedDelta } =
                    await this.validateSingleMappedBiolinkEdge(edge, nodeById);
                checked += checkedDelta;
                supported += supportedDelta;
                skipped += skippedDelta;
                out.push(builtEdge);
            }
            return { edges: out, trapiStats: { checked, supported, skipped } };
        },
        /** Edges-only visual state for TRAPI progress: skip network reclone when unchanged (e.g. empty TRAPI results). */
        biolinkEdgeVisualSignature(edges) {
            const list = Array.isArray(edges) ? edges : [];
            return JSON.stringify(
                list.map((e) => {
                    const src =
                        e.source != null
                            ? String(e.source)
                            : e.from != null
                              ? String(e.from)
                              : "";
                    const tgt =
                        e.target != null
                            ? String(e.target)
                            : e.to != null
                              ? String(e.to)
                              : "";
                    const md = e.metadata || {};
                    return {
                        src,
                        tgt,
                        dashes: !!e.dashes,
                        inferred: !!md.inferred_edge,
                        validated: !!md.trapi_validated,
                    };
                })
            );
        },
        patchMechanismBiolinkTrapiProgress(idx, edges, mappedNodes, trapiStats) {
            const m = this.mechanisms[idx];
            if (!m || !m.biolink_core_spine_network) return;
            const prevEdges = m.biolink_core_spine_network.edges;
            const sigPrev = this.biolinkEdgeVisualSignature(prevEdges);
            const sigNext = this.biolinkEdgeVisualSignature(edges);
            if (sigPrev === sigNext) {
                this.$set(this.mechanisms, idx, {
                    ...m,
                    biolink_map_meta: {
                        ...m.biolink_map_meta,
                        trapi_edge_validation: { ...trapiStats },
                    },
                });
                return;
            }
            const mappedNetwork = {
                ...m.biolink_core_spine_network,
                nodes: mappedNodes,
                edges,
            };
            const next = {
                ...m,
                biolink_core_spine_network: this.cloneNetworkForMapView(mappedNetwork),
                biolink_map_meta: {
                    ...m.biolink_map_meta,
                    trapi_edge_validation: { ...trapiStats },
                },
            };
            if (next.map_view_mode === "biolink") {
                next.core_spine_network = this.cloneNetworkForMapView(mappedNetwork);
            }
            this.$set(this.mechanisms, idx, next);
        },
        async runBiolinkTrapiValidationForMechanism(idx, gen) {
            if (!this.revealBiolinkProxyBaseUrl) return;
            if ((this.biolinkTrapiValidationGeneration[idx] || 0) !== gen) return;
            const m0 = this.mechanisms[idx];
            if (!m0?.biolink_core_spine_network?.nodes) return;
            const initialEdges0 = Array.isArray(m0.biolink_core_spine_network.edges)
                ? m0.biolink_core_spine_network.edges
                : [];
            if (initialEdges0.length === 0) return;
            this.$set(this.biolinkTrapiValidatingByMechanism, idx, true);
            try {
                const m = this.mechanisms[idx];
                if (!m?.biolink_core_spine_network?.nodes) return;
                const baseNet = m.biolink_core_spine_network;
                const mappedNodes = baseNet.nodes;
                const initialEdges = Array.isArray(baseNet.edges) ? baseNet.edges : [];
                const nodeById = {};
                mappedNodes.forEach((n) => {
                    if (n && n.id != null) nodeById[String(n.id)] = n;
                });
                const out = [];
                let checked = 0;
                let supported = 0;
                let skipped = 0;
                for (let i = 0; i < initialEdges.length; i++) {
                    if ((this.biolinkTrapiValidationGeneration[idx] || 0) !== gen) return;
                    const edge = initialEdges[i];
                    const { builtEdge, checkedDelta, supportedDelta, skippedDelta } =
                        await this.validateSingleMappedBiolinkEdge(edge, nodeById);
                    checked += checkedDelta;
                    supported += supportedDelta;
                    skipped += skippedDelta;
                    out.push(builtEdge);
                }
                if ((this.biolinkTrapiValidationGeneration[idx] || 0) !== gen) return;
                this.patchMechanismBiolinkTrapiProgress(idx, out, mappedNodes, {
                    checked,
                    supported,
                    skipped,
                });
            } finally {
                if ((this.biolinkTrapiValidationGeneration[idx] || 0) === gen) {
                    this.$set(this.biolinkTrapiValidatingByMechanism, idx, false);
                }
            }
        },
        queueBiolinkTrapiValidation(idx, gen) {
            if (!this.revealBiolinkProxyBaseUrl) return;
            void this.runBiolinkTrapiValidationForMechanism(idx, gen);
        },
        /**
         * NameRes + NodeNorm → show Biolink map immediately (dashed edges), then TRAPI validation in the background.
         */
        async mapMechanismBiolinkPhase1Only(idx) {
            const mechanism = Array.isArray(this.mechanisms) ? this.mechanisms[idx] : null;
            if (!mechanism || !mechanism.core_spine_network || !Array.isArray(mechanism.core_spine_network.nodes)) {
                return;
            }
            const nextGen = (this.biolinkTrapiValidationGeneration[idx] || 0) + 1;
            this.$set(this.biolinkTrapiValidationGeneration, idx, nextGen);
            const gen = nextGen;
            this.$set(this.biolinkTrapiValidatingByMechanism, idx, false);
            this.$set(this.biolinkMappingByMechanism, idx, true);
            try {
                const src = mechanism.original_core_spine_network || mechanism.core_spine_network || {};
                const nodes = Array.isArray(src.nodes) ? src.nodes : [];
                const edges = Array.isArray(src.edges) ? src.edges : [];
                if (!nodes.length) return;

                const resolveByLabel = {};
                for (const node of nodes) {
                    const label = String(node.label || node.id || "").trim();
                    if (!label) continue;
                    if (!Object.prototype.hasOwnProperty.call(resolveByLabel, label)) {
                        resolveByLabel[label] = await this.resolveLabelViaNameResolution(label);
                    }
                }
                const curies = [...new Set(Object.values(resolveByLabel).map((r) => r.curie).filter(Boolean))];
                const normByCurie = await this.fetchBiolinkNodeDetails(curies);

                let mappedNodeCount = 0;
                let unmappedNodeCount = 0;
                const mappedNodes = nodes.map((node) => {
                    const originalLabel = String(node.label || node.id || "").trim();
                    const nameHit = resolveByLabel[originalLabel] || { curie: null, resolverLabel: "" };
                    const curie = nameHit.curie || null;
                    const resolverLabel = nameHit.resolverLabel || "";
                    const normalized = curie ? this.findNormalizedNodeEntry(normByCurie, curie) : null;
                    const normId = normalized && normalized.id ? normalized.id : {};
                    const types = normalized && Array.isArray(normalized.type) ? normalized.type : [];
                    let biolinkClass = this.pickPrimaryBiolinkType(types);
                    if (!biolinkClass && curie) biolinkClass = this.inferBiolinkClassHintFromCurie(curie);
                    const normalizedLabel =
                        normId.label != null && String(normId.label).trim() !== ""
                            ? String(normId.label).trim()
                            : "";
                    const preferredId =
                        normId.identifier != null && String(normId.identifier).trim() !== ""
                            ? String(normId.identifier).trim()
                            : curie || "";
                    const hasNodeNorm = !!(normalized && (normId.identifier || normId.label));
                    const displayLabel =
                        normalizedLabel ||
                        (hasNodeNorm ? preferredId : "") ||
                        resolverLabel ||
                        originalLabel ||
                        String(node.id || "");
                    const metadata = {
                        ...(node.metadata || {}),
                        original_label: originalLabel,
                    };
                    if (curie) metadata.curie = String(curie);
                    if (preferredId) metadata.primary_identifier = preferredId;
                    if (biolinkClass) metadata.biolink_class = biolinkClass;
                    if (resolverLabel && resolverLabel !== displayLabel) {
                        metadata.name_resolver_label = resolverLabel;
                    }
                    const resolvedLexically = !!curie;
                    if (resolvedLexically) mappedNodeCount += 1;
                    else unmappedNodeCount += 1;
                    if (!resolvedLexically) metadata.biolink_unmapped = true;
                    const nextType = resolvedLexically
                        ? this.classifyBiolinkNodeType(biolinkClass, node.type || "Entity")
                        : (node.type || "Entity");
                    return {
                        ...node,
                        type: nextType,
                        label: displayLabel,
                        metadata,
                    };
                });
                const mappedEdges = edges.map((edge) => {
                    const action = String(edge.label || edge.predicate || "").trim();
                    return {
                        ...edge,
                        label: action || String(edge.label || edge.predicate || ""),
                        predicate: this.inferBiolinkPredicate(action),
                        dashes: true,
                        metadata: {
                            ...(edge.metadata || {}),
                            biolink_mapped: true,
                            inferred_edge: true,
                        },
                    };
                });

                const mappedNetwork = {
                    ...src,
                    nodes: mappedNodes,
                    edges: mappedEdges,
                };
                const mCurrent = this.mechanisms[idx];
                if (!mCurrent) return;
                if ((this.biolinkTrapiValidationGeneration[idx] || 0) !== gen) return;

                const originalStored = mechanism.original_core_spine_network
                    ? this.cloneNetworkForMapView(mechanism.original_core_spine_network)
                    : this.cloneNetworkForMapView(src);
                const nextMechanism = {
                    ...mCurrent,
                    original_core_spine_network: originalStored,
                    biolink_core_spine_network: this.cloneNetworkForMapView(mappedNetwork),
                    /** Default to Biolink spine after phase-1 mapping; users can toggle back to original map. */
                    map_view_mode: "biolink",
                    core_spine_network: this.cloneNetworkForMapView(mappedNetwork),
                    biolink_map_meta: {
                        mappedNodeCount,
                        unmappedNodeCount,
                        totalNodeCount: nodes.length,
                        mappedAt: new Date().toISOString(),
                    },
                };
                this.$set(this.mechanisms, idx, nextMechanism);
                this.queueBiolinkTrapiValidation(idx, gen);
            } finally {
                this.$set(this.biolinkMappingByMechanism, idx, false);
            }
        },
        async autoMapAllMechanismsToBiolink() {
            const arr = this.mechanisms;
            if (!Array.isArray(arr) || !arr.length) return;
            const jobs = [];
            for (let i = 0; i < arr.length; i++) {
                const m = arr[i];
                if (!m?.core_spine_network?.nodes?.length) continue;
                if (this.hasMechanismBiolinkNetwork(m)) continue;
                jobs.push(this.mapMechanismBiolinkPhase1Only(i));
            }
            await Promise.all(jobs);
        },
        async copyMechanismForLlm(mechanism, idx) {
            const text = this.buildMechanismClipboardText(mechanism, idx);
            try {
                if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                    await navigator.clipboard.writeText(text);
                } else {
                    throw new Error("Clipboard API unavailable");
                }
            } catch (e) {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.setAttribute("readonly", "");
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            this.handoffCopiedMechanismIndex = idx;
            if (this.handoffCopiedResetTimerId != null) clearTimeout(this.handoffCopiedResetTimerId);
            this.handoffCopiedResetTimerId = setTimeout(() => {
                this.handoffCopiedMechanismIndex = null;
                this.handoffCopiedResetTimerId = null;
            }, 1800);
        },
        getMechanismAssociatedSelectionRows(mechanism) {
            const pairs = Array.isArray(mechanism?.associated_pairs) ? mechanism.associated_pairs : [];
            if (!pairs.length) return [];
            const normalize = (s) => String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, " ");
            const pairSet = new Set(
                pairs.map((p) => `${normalize(p.phenotype)}|${normalize(p.factor)}`)
            );
            return (this.factorDataTableRowsFiltered || []).filter((r) => {
                const p = normalize(r.phenotype);
                const f1 = normalize(r.factorLabel);
                const f2 = normalize(r.factor);
                return pairSet.has(`${p}|${f1}`) || pairSet.has(`${p}|${f2}`);
            });
        },
        async downloadMechanismHandoffPackage(mechanism, idx) {
            if (!mechanism || typeof mechanism !== "object") return;
            const context =
                (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                    ? String(this.searchCriteria[1].values).trim()
                    : "";
            const supportingNet = mechanism.supporting_network || mechanism.network || { nodes: [], edges: [] };
            const hypothesisNet = mechanism.core_spine_network || { nodes: [], edges: [] };
            const [supportingImage, hypothesisImage] = await Promise.all([
                this.exportNetworkImageFromRef(`mechanismNetwork-${idx}`, supportingNet),
                this.exportNetworkImageFromRef(`mechanismHypothesisMap-${idx}`, hypothesisNet),
            ]);
            const supportIds = Array.isArray(mechanism.supporting_row_ids)
                ? mechanism.supporting_row_ids.map(Number).filter((n) => !Number.isNaN(n))
                : [];
            const supportSet = new Set(supportIds);
            const supportingRows = Array.isArray(this.lastFlattenedKG)
                ? this.lastFlattenedKG.filter((r) => supportSet.has(Number(r.id)))
                : [];
            const assocRows = this.getMechanismAssociatedSelectionRows(mechanism);
            const appendix = this.buildMechanismHandoffAppendixObject({
                idx,
                mechanism,
                researchContext: context,
                supportingNet,
                hypothesisNet,
                supportingRows,
                assocRows,
                supportingImage,
                hypothesisImage,
            });
            const html = this.buildMechanismHandoffHtmlDocument({
                idx,
                mechanism,
                researchContext: context,
                supportingImage,
                hypothesisImage,
                appendix,
            });
            try {
                const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const slug = String(mechanism.group_name || `hypothesis-${idx + 1}`)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                    .slice(0, 80);
                a.download = `reveal-handoff-${slug || `hypothesis-${idx + 1}`}-${new Date().toISOString().replace(/[:.]/g, "-")}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch {
            }
        },
        openNetworkPopup(mechanismIndex, options = {}) {
            this.networkPopupMechanismIndex = mechanismIndex;
            this.networkPopupIsHypothesisMap = !!(options && options.hypothesisMap);
            this.popupNetworkWidth = Math.max(400, Math.round((typeof window !== "undefined" && window.innerWidth) ? window.innerWidth * 0.9 : 960));
            this.popupNetworkHeight = Math.max(300, Math.round((typeof window !== "undefined" && window.innerHeight) ? window.innerHeight * 0.9 - 56 : 640));
        },
        closeNetworkPopup() {
            this.networkPopupMechanismIndex = null;
            this.networkPopupIsHypothesisMap = false;
        },
        getRowKey(item) {
            if (!item || item.phenotype == null || item.factor == null) return "";
            return `${item.phenotype}|${item.factor}`;
        },
        getSubtableCurrentPage(item) {
            const key = this.getRowKey(item);
            return (this.subtableCurrentPages || {})[key] || 1;
        },
        toggleFactorGenesRow(row) {
            if (!row) return;
            const key = this.getRowKey(row.item);
            if (!this.subtableCurrentPages[key]) {
                this.$set(this.subtableCurrentPages, key, 1);
            }
            const willExpand = !this.expandedFactorRowKeys[key];
            this.$set(this.expandedFactorRowKeys, key, willExpand);
            if (row.item) {
                this.$set(row.item, "_showDetails", willExpand);
            }
            if (willExpand && this.getGenesForFactor(row.item.phenotype, row.item.factor).length === 0) {
                this.loadGenesForOneFactor(row.item.phenotype, row.item.factor, row.item);
            }
        },
        isFactorRowExpanded(item) {
            return !!this.expandedFactorRowKeys[this.getRowKey(item)];
        },
        getGenesetForFactor(phenotype, factor){
            const data = this.factorData || {};
            const pData = data[phenotype];
            if (!pData) return [];
            const factors = pData.factors || [];
            const allFactors = pData.allFactors || [];
            const f = factors.find((x) => x.factor === factor || String(x.factor) === String(factor))
                || allFactors.find((x) => x.factor === factor || String(x.factor) === String(factor));
            if (!f) return [];
            const topGeneSetsStr = f.top_gene_sets;
            const topGeneSetProgramsStr = f.gene_set_program;
            const topGeneSets = (typeof topGeneSetsStr === "string" && topGeneSetsStr)
                ? topGeneSetsStr.split(";").map((s) => s.trim()).filter(Boolean)
                : [];
            const topGeneSetPrograms = (typeof topGeneSetProgramsStr === "string" && topGeneSetProgramsStr)
                ? topGeneSetProgramsStr.split("|").map((s) => s.trim()).filter(Boolean)
                : [];
            const result = topGeneSets.map((g, i) => ({
                geneset: g,
                program: topGeneSetPrograms[i]
            }));
            return result;
        },
        getGenesForFactor(phenotype, factor) {
            const data = this.factorData || {};
            const pData = data[phenotype];
            if (!pData) return [];
            const factors = pData.factors || [];
            const allFactors = pData.allFactors || [];
            const f = factors.find((x) => x.factor === factor || String(x.factor) === String(factor))
                || allFactors.find((x) => x.factor === factor || String(x.factor) === String(factor));
            if (!f || !f.genes) return [];
            const globalGenes = pData.genes || {};
            const rows = Object.keys(f.genes).map((geneName) => {
                const rel = f.genes[geneName];
                const global = globalGenes[geneName] || {};
                const rawVal = rel.factor_value ?? rel.factorRelevance;
                const factorValue = rawVal != null && rawVal !== ""
                    ? (typeof rawVal === "number" && !isNaN(rawVal) ? Number(rawVal).toFixed(3) : String(rawVal))
                    : "—";
                const numForSort = typeof rawVal === "number" && !isNaN(rawVal)
                    ? rawVal
                    : (rel.factorRelevance != null && !isNaN(Number(rel.factorRelevance))
                        ? Number(rel.factorRelevance)
                        : 0);
                const pinned = rel.includedFromRequest === true;
                return {
                    gene: geneName,
                    userRequested: pinned ? "Yes" : "—",
                    factorRelevance: factorValue,
                    combined: global.combined != null ? Number(global.combined).toFixed(2) : "—",
                    gwasSupport: global.gwasSupport != null ? Number(global.gwasSupport).toFixed(2) : "—",
                    geneSetSupport: global.geneSetSupport != null ? Number(global.geneSetSupport).toFixed(2) : "—",
                    _sortPin: pinned ? 1 : 0,
                    _sortAbs: Math.abs(numForSort),
                };
            });
            rows.sort((a, b) => {
                if (b._sortPin !== a._sortPin) return b._sortPin - a._sortPin;
                return b._sortAbs - a._sortAbs;
            });
            return rows.map((r) => ({
                gene: r.gene,
                userRequested: r.userRequested,
                factorRelevance: r.factorRelevance,
                combined: r.combined,
                gwasSupport: r.gwasSupport,
                geneSetSupport: r.geneSetSupport,
            }));
        },
        /**
         * Ensure row expansion state for a single (phenotype, factor) without extra API loading.
         * Hybrid retrieval already provides factor, gene set, and gene payloads.
         */
        async loadGenesForOneFactor(phenotype, factorId, rowMeta = null) {
            const key = this.getRowKey({ phenotype, factor: factorId });
            if (this.loadingGenesForFactor && this.loadingGenesForFactor[key]) return;
            if (!this.factorData) this.factorData = {};
            if (!this.factorData[phenotype]) {
                this.$set(this.factorData, phenotype, { genes: {}, factors: [], allFactors: [] });
            }
            const pData = this.factorData[phenotype];
            const factors = pData.factors || [];
            const allFactors = pData.allFactors || [];
            let factorItem = factors.find((x) => x.factor === factorId || String(x.factor) === String(factorId))
                || allFactors.find((x) => x.factor === factorId || String(x.factor) === String(factorId));
            if (!factorItem && rowMeta) {
                if (!pData.allFactors) this.$set(pData, "allFactors", []);
                factorItem = {
                    factor: factorId,
                    label:
                        rowMeta.factorLabel != null && String(rowMeta.factorLabel).trim() !== ""
                            ? String(rowMeta.factorLabel).trim()
                            : String(factorId),
                    labelFromApi:
                        rowMeta.factorLabelFromApi != null && String(rowMeta.factorLabelFromApi).trim() !== ""
                            ? String(rowMeta.factorLabelFromApi).trim()
                            : null,
                    top_gene_sets: "",
                    gene_set_description: "",
                    gene_set_program: "",
                    genes: {},
                    geneSets: {},
                };
                pData.allFactors.push(factorItem);
            }
            if (!factorItem) return;
            if (!factorItem.genes) this.$set(factorItem, "genes", {});
            if (!factorItem.geneSets) this.$set(factorItem, "geneSets", {});
            this.$set(this.loadingGenesForFactor, key, true);
            try {
                return;
            } finally {
                this.$set(this.loadingGenesForFactor, key, false);
            }
        },
        queryParse() {
            if (!this.userQuery || !this.userQuery.trim()) return;
            if (this.stepApprovalGateActive) {
                this.cancelStepGate(false);
            }
            this.loadComplete = false;
            this.searchCriteria = null;
            this.mechanisms = null;
            this.mechanisms_summary = null;
            this.mechanismDiagnosticAssessment = null;
            this.hypothesisLastRunMode = null;
            this.lastAlternativeQueries = [];
            this.lastGenesOfInterest = [];
            this.lastHybridSearchMeta = {};
            this.lastHybridSearchResponse = null;
            this.searchCriteriaEditRows = [];
            this.searchCriteriaEditRowsDefault = [];
            this.searchCriteriaExtractionGateDone = false;
            this.pairSelectionOverrides = {};
            this.llmFilteredPairKeysBaseline = [];
            this.error_search_criteria = false;
            this.mainTableCurrentPage = 1;
            this.remainingTableCurrentPage = 1;
            this.steps = [];
            this.stepsTime = null;
            this.stepsTimer = null;
            this.stepsPausedAt = null;
            this.now = Date.now();
            this.showTab = 'terms';
            this.revealResultsTabUnlocked = false;
            this.get_set_sources = [],
            this.beginFlow();
        },
        beginFlow() {
            this.loading_search_criteria = true;
            this.error_search_criteria = false;
            this.allow_retry = true;
            this.setStep({
                id: "1",
                title: "LLM: Extracting search terms from user query",
                substep: {
                    id: "1.1",
                    title: `${this.userQuery.trim()}`
                }
            }, true);
            this.llmExtract.sendPrompt({
                userPrompt: this.userQuery.trim(),
                onResponse: this.onExtractResponse,
                onError: this.onExtractError,
                onEnd: this.onExtractEnd,
                onState: this.onExtractState,
            });
        },
        parseLLMResponse(rawString) {
            const cleanString = (rawString || "")
                .replace(/```json|```/g, "")
                .replace(/[\r\n]+/g, " ")
                .trim();
            try {
                return JSON.parse(cleanString);
            } catch (e) {
                this.setStep({
                    type: "error",
                    title: "Malformed response from LLM"
                })
                return null;
            }
        },
        async onExtractResponse(response) {
            this.loading_search_criteria = false;
            if (!response) return;
            const json = this.parseLLMResponse(response);
            if (!json) {
                this.error_search_criteria = true;
                this.error_msg_search_criteria = "Could not parse extraction result.";
                return;
            }
            if (json.error) {
                this.error_search_criteria = true;
                this.error_msg_search_criteria = json.error;
                this.allow_retry = false;
                return;
            }

            console.log("FactorBaseReveal: extraction LLM raw object", json);

            const phenotypeTerms = this.normalizeLlmTermList(json.phenotype_terms);
            const mechanismTerms = this.normalizeLlmTermList(json.mechanism_terms);
            const genesOfInterest = this.normalizeLlmTermList(json.genes_of_interest);
            const alternativeQueries = this.normalizeAlternativeQueries(
                json.suggested_queries != null
                    ? json.suggested_queries
                    : (json.alternative_queries != null
                        ? json.alternative_queries
                        : json.alternativeQueries)
            );

            const searchTerms = [...phenotypeTerms, ...mechanismTerms];

            const researchContext = typeof json.research_context === "string" ? json.research_context : "";
            
            this.searchCriteria = [
                {
                    search_criteria: "Search Terms",
                    values: searchTerms.length ? searchTerms : ["(none extracted)"],
                    why: "We extracted this from your search query.",
                    purpose:
                        "These terms will be used to search for related phenotype↔signature associations via semantic search.",
                },
                {
                    search_criteria: "Research Context",
                    values: researchContext || "(none extracted)",
                    why: "We inferred this from your search query.",
                    purpose:
                        "This context will be used to tailor mechanistic hypotheses to your research.",
                },
            ];

            this.searchTerm = searchTerms.join(", ");

            this.lastPhenotypeTerms = phenotypeTerms;
            this.lastMechanismTerms = mechanismTerms;
            this.lastGenesOfInterest = genesOfInterest;
            this.lastAlternativeQueries = alternativeQueries;

            this.setStep({
                id: "1",
                substep: {
                    id: "1.1",
                    result: {
                        title: "Extracted search terms and research context. Review terms, then continue.",
                        result: {
                            phenotypeTerms,
                            mechanismTerms,
                            genesOfInterest,
                            researchContext,
                            alternativeQueries
                        }
                    }
                }
            })
            this.buildSearchCriteriaEditRows();

            const approved = await this.waitForStepApproval(
                "1",
                "Review terms and continue when ready.",
                true
            );
            if (!approved) return;

            if (this.searchMode === "auto") {
                this.onResearch();
            }
        },
        onExtractError(err) {
            this.loading_search_criteria = false;
            this.error_search_criteria = true;
            this.error_msg_search_criteria = err && err.message ? err.message : "An error occurred.";
            this.setStep({
                type: 'error',
                title: "Request failed or timed out.",
            })
        },
        onExtractEnd() {
            this.loading_search_criteria = false;
        },
        onExtractState(/* state */) {},
        editSearchCriteria() {
            this.prev_search_criteria = JSON.parse(JSON.stringify(this.searchCriteria));
            this.edit_search_criteria = true;
        },
        cancelEditSearchCriteria() {
            this.edit_search_criteria = false;
            this.searchCriteria = JSON.parse(JSON.stringify(this.prev_search_criteria));
        },
        saveSearchCriteria() {
            this.edit_search_criteria = false;
            const terms = this.searchCriteria[0].values;
            this.searchTerm = Array.isArray(terms) ? terms.join(", ") : String(terms);
        },
        removeSearchTerm(term) {
            if (!this.edit_search_criteria || !this.searchCriteria || !this.searchCriteria[0]) return;
            const idx = this.searchCriteria[0].values.indexOf(term);
            if (idx !== -1) this.searchCriteria[0].values.splice(idx, 1);
        },
        addSearchTerm(event) {
            if (!this.edit_search_criteria || !this.searchCriteria || !this.searchCriteria[0]) return;
            const val = event.target && event.target.value ? event.target.value.trim() : "";
            if (val) {
                this.searchCriteria[0].values.push(val);
            }
            if (event.target) {
                event.target.value = "";
                event.target.blur();
            }
        },
        buildHybridQueryText({ phenotypeTerms = [], mechanismTerms = [], researchContext = "" } = {}) {
            const skip = (s) => !s || s === "(none extracted)";
            const parts = [...(mechanismTerms || []), ...(phenotypeTerms || []), researchContext]
                .map((v) => String(v || "").trim())
                .filter((v) => !skip(v));
            return parts.join("\n");
        },
        /**
         * LLM may return null, a string (comma-separated), or an array for term fields.
         */
        normalizeLlmTermList(raw) {
            if (raw == null) return [];
            if (Array.isArray(raw)) {
                return raw
                    .map((t) => String(t || "").trim())
                    .filter((t) => t && t !== "(none extracted)");
            }
            const s = String(raw).trim();
            if (!s || s === "(none extracted)") return [];
            return s
                .split(/[,;]|\n/)
                .map((x) => x.trim())
                .filter(Boolean);
        },
        /**
         * Backend requires non-empty phenotype_terms (hard filter). Derive from mechanisms, context, or the raw user query when the LLM left phenotypes empty.
         */
        resolveHybridPhenotypeFilterTerms(phenotypeTerms, mechanismTerms, researchContext) {
            const NONE = "(none extracted)";
            const trimmedP = (phenotypeTerms || [])
                .map((t) => String(t || "").trim())
                .filter((t) => t && t !== NONE);
            if (trimmedP.length) return trimmedP;
            const m = Array.isArray(mechanismTerms) ? mechanismTerms : [];
            if (m.length) return [...m];
            let ctx = researchContext != null ? String(researchContext).trim() : "";
            if (ctx === NONE) ctx = "";
            if (ctx.length) {
                const first = ctx.split(/[.;\n]/)[0].trim();
                if (first) return [first.slice(0, 256)];
            }
            const q = String(this.userQuery || "").trim();
            if (q) return [q.slice(0, 256)];
            return [];
        },
        /**
         * Server rule: need query_embedding OR non-empty mechanism_terms OR non-whitespace research_context
         * (phenotype_terms alone is not enough without embedding when server-side embedding is off).
         */
        prepareHybridSearchRequestFields(phenotypeTerms, mechanismTerms, researchContext, queryEmbedding) {
            const NONE = "(none extracted)";
            const phenotype_terms = (phenotypeTerms || [])
                .map((t) => String(t || "").trim())
                .filter((t) => t && t !== NONE);
            let mechanism_terms = (mechanismTerms || [])
                .map((t) => String(t || "").trim())
                .filter((t) => t && t !== NONE);
            let research_context = researchContext != null ? String(researchContext).trim() : "";
            if (research_context === NONE) research_context = "";

            const hasEmbedding = Array.isArray(queryEmbedding) && queryEmbedding.length > 0;
            const hasMech = mechanism_terms.length > 0;
            const hasContext = research_context.length > 0;
            if (!hasEmbedding && !hasMech && !hasContext) {
                research_context = `Phenotype-focused retrieval: ${phenotype_terms.join("; ")}.`;
            }

            return { phenotype_terms, mechanism_terms, research_context };
        },
        buildHybridSearchRequestBody(phenotypeTerms, mechanismTerms, researchContext, queryEmbedding, genesOfInterest = null) {
            const useClient = !!this.hybridSearchUseClientEmbedding;
            const fields = this.prepareHybridSearchRequestFields(
                phenotypeTerms,
                mechanismTerms,
                researchContext,
                useClient ? queryEmbedding : null
            );
            const goi = this.normalizeLlmTermList(genesOfInterest != null ? genesOfInterest : this.lastGenesOfInterest);
            const body = {
                phenotype_terms: fields.phenotype_terms,
                genes_of_interest: goi,
                mechanism_terms: fields.mechanism_terms,
                research_context: fields.research_context,
            };
            if (useClient && Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
                body.query_embedding = queryEmbedding;
            }
            return body;
        },
        async fetchWithTimeout(url, options = {}, timeoutMs) {
            const ms = timeoutMs != null ? timeoutMs : this.hybridSearchTimeoutMs;
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), ms);
            try {
                return await fetch(url, { ...options, signal: controller.signal });
            } finally {
                clearTimeout(tid);
            }
        },
        hybridSearchErrorMessage(status, json) {
            if (json == null || typeof json !== "object") {
                return `HTTP ${status}`;
            }
            if (typeof json.message === "string" && json.message.trim()) return json.message.trim();
            if (typeof json.detail === "string" && json.detail.trim()) return json.detail.trim();
            if (json.detail != null && typeof json.detail === "object") {
                try {
                    return JSON.stringify(json.detail);
                } catch (e) {
                    return String(json.detail);
                }
            }
            if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
            try {
                return JSON.stringify(json);
            } catch (e) {
                return `HTTP ${status}`;
            }
        },
        async fetchHybridQueryEmbedding(queryText) {
            const text = String(queryText || "").trim();
            if (!text) throw new Error("Client embedding requires non-empty query text for embedding.");
            const embResp = await this.fetchWithTimeout(
                this.ollamaEmbedUrl,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: this.hybridEmbedModel,
                        input: text,
                    }),
                },
                this.hybridSearchTimeoutMs
            );
            const embJson = await embResp.json().catch(() => ({}));
            const embedding = embJson && Array.isArray(embJson.embeddings) ? embJson.embeddings[0] : null;
            if (!embResp.ok) {
                throw new Error(`Embedding API failed: ${embResp.status} ${JSON.stringify(embJson)}`);
            }
            const dim = this.hybridEmbedExpectedDim;
            if (!Array.isArray(embedding) || embedding.length !== dim) {
                throw new Error(`Invalid embedding from Ollama: expected ${dim} floats (${this.hybridEmbedModel}).`);
            }
            return embedding;
        },
        async callHybridRevealSearch({ queryEmbedding, phenotypeTerms, mechanismTerms, researchContext, genesOfInterest }) {
            const base = String(this.hybridSearchBaseUrl || "").replace(/\/$/, "");
            const url = `${base}/api/reveal/hybrid-search`;
            const body = this.buildHybridSearchRequestBody(
                phenotypeTerms,
                mechanismTerms,
                researchContext,
                queryEmbedding,
                genesOfInterest
            );
            if (!body.phenotype_terms.length) {
                throw new Error("422 phenotype_terms is required and must be non-empty.");
            }
            let resp;
            try {
                resp = await this.fetchWithTimeout(
                    url,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    },
                    this.hybridSearchTimeoutMs
                );
            } catch (err) {
                if (err && err.name === "AbortError") {
                    throw new Error("504 Hybrid search request timed out. Try again or increase hybridSearchTimeoutMs.");
                }
                throw err;
            }
            const json = await resp.json().catch(() => ({}));
            if (resp.ok && json && json.status === "success") {
                console.log("FactorBaseReveal: hybrid search raw response", json);
                return json;
            }
            const detail = this.hybridSearchErrorMessage(resp.status, json);
            if (resp.status === 404) {
                throw new Error(`404 ${detail}`);
            }
            if (resp.status === 422) {
                throw new Error(`422 ${detail}`);
            }
            if (resp.status === 504) {
                throw new Error(`504 ${detail || "Hybrid search timed out."}`);
            }
            if (resp.status >= 500) {
                throw new Error(`500 ${detail}`);
            }
            throw new Error(`Hybrid search failed at ${url}: ${resp.status} ${detail}`);
        },
        normalizeHybridFactorsToFactorData(hybridJson, phenotypeTerms = []) {
            const out = {};
            const data = hybridJson && hybridJson.data ? hybridJson.data : {};
            const factors = Array.isArray(data.factors) ? data.factors : [];
            const fallbackPhenotype = data.phenotype != null
                ? String(data.phenotype).trim()
                : ((phenotypeTerms && phenotypeTerms[0]) ? String(phenotypeTerms[0]).trim() : "");

            factors.forEach((item, idx) => {
                const phenotype = item && item.phenotype != null && String(item.phenotype).trim() !== ""
                    ? String(item.phenotype).trim()
                    : fallbackPhenotype;
                if (!phenotype) return;
                if (!out[phenotype]) out[phenotype] = { genes: {}, factors: [], allFactors: [] };

                const factorId = item && item.factor_id != null && String(item.factor_id).trim() !== ""
                    ? String(item.factor_id).trim()
                    : `factor${idx + 1}`;
                const explicitApiLabel = item && item.label != null && String(item.label).trim() !== ""
                    ? String(item.label).trim()
                    : "";
                const factorLabel = explicitApiLabel || factorId;
                const topGeneSets = Array.isArray(item && item.top_gene_sets)
                    ? item.top_gene_sets.map((s) => String(s || "").trim()).filter(Boolean)
                    : (item && item.top_gene_sets != null ? String(item.top_gene_sets).split(/[;,]/).map((s) => s.trim()).filter(Boolean) : []);
                const geneSetPrograms = Array.isArray(item && item.gene_set_programs)
                    ? item.gene_set_programs.map((s) => String(s || "").trim()).filter(Boolean)
                    : (item && item.gene_set_program != null ? String(item.gene_set_program).split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean) : []);

                const factorObj = {
                    factor: factorId,
                    label: factorLabel,
                    labelFromApi: explicitApiLabel !== "" ? explicitApiLabel : null,
                    top_gene_sets: topGeneSets.join(";"),
                    gene_set_description: "",
                    gene_set_program: geneSetPrograms.join(" | "),
                    genes: {},
                    geneSets: {},
                };

                topGeneSets.forEach((gs) => {
                    factorObj.geneSets[gs] = { genes: [] };
                });

                const genes = Array.isArray(item && item.genes) ? item.genes : [];
                genes.forEach((g) => {
                    const gene = g && g.gene != null ? String(g.gene).trim() : "";
                    if (!gene) return;
                    const rel = g && g.relevance != null && !isNaN(Number(g.relevance)) ? Number(g.relevance) : null;
                    const includedFromRequest = g && g.included_from_request === true;
                    factorObj.genes[gene] = {
                        factorRelevance: rel != null ? rel : 1,
                        factor_value: rel,
                        includedFromRequest,
                    };
                    if (out[phenotype].genes[gene] == null) {
                        out[phenotype].genes[gene] = {
                            combined: g && g.combined_score != null ? g.combined_score : null,
                            gwasSupport: g && g.gwas_support != null ? g.gwas_support : null,
                            geneSetSupport: g && g.functional_support != null ? g.functional_support : null,
                        };
                    }
                });

                out[phenotype].factors.push(factorObj);
            });

            Object.keys(out).forEach((p) => {
                out[p].allFactors = [...(out[p].factors || [])];
            });
            return out;
        },
        async runHybridRetrievalWorkflow({ phenotypeTerms = [], mechanismTerms = [], researchContext = "" } = {}) {
            const NONE = "(none extracted)";
            let ctx = researchContext != null ? String(researchContext).trim() : "";
            if (ctx === NONE) ctx = "";

            const rawPhenos = this.normalizeLlmTermList(phenotypeTerms);
            const mechs = this.normalizeLlmTermList(mechanismTerms);

            const phenos = this.resolveHybridPhenotypeFilterTerms(rawPhenos, mechs, ctx);
            if (!phenos.length) return false;

            this.setStep({
                id: "2",
                title: "Retrieving data",
            });

            let queryEmbedding = null;
            if (this.hybridSearchUseClientEmbedding) {
                let queryText = this.buildHybridQueryText({
                    phenotypeTerms: phenos,
                    mechanismTerms: mechs,
                    researchContext: ctx,
                });
                if (!queryText) queryText = String(this.userQuery || "").trim();
                if (!queryText) return false;
                this.setLoadStatus("Hybrid retrieval: generating embedding (client)…");
                queryEmbedding = await this.fetchHybridQueryEmbedding(queryText);
                this.setStep({
                    id: "2",
                    substep: {
                        id: "2.h1",
                        title: "Client embedding",
                        result: {
                            result: {
                                dims: queryEmbedding.length,
                                model: this.hybridEmbedModel,
                                embedding_provider_used: "client",
                            },
                        },
                    },
                });
            } else {
                this.setLoadStatus("Hybrid retrieval: calling API (server-side embedding)…");
            }

            this.setLoadStatus("Hybrid retrieval: searching factors and gene sets…");
            const hybridJson = await this.callHybridRevealSearch({
                queryEmbedding,
                phenotypeTerms: phenos,
                mechanismTerms: mechs,
                researchContext: ctx,
                genesOfInterest: this.normalizeLlmTermList(this.lastGenesOfInterest),
            });
            const normalized = this.normalizeHybridFactorsToFactorData(hybridJson, phenos);
            const phenotypes = Object.keys(normalized).filter((p) => (normalized[p].factors || []).length > 0);
            if (!phenotypes.length) return false;

            this.factorData = normalized;
            const data = hybridJson && hybridJson.data ? hybridJson.data : {};
            const meta = hybridJson && hybridJson.meta ? hybridJson.meta : {};
            this.lastHybridSearchMeta = meta && typeof meta === "object" ? { ...meta } : {};
            this.lastHybridSearchResponse =
                hybridJson != null && typeof hybridJson === "object"
                    ? JSON.parse(JSON.stringify(hybridJson))
                    : null;
            this.setStep({
                id: "2",
                substep: {
                    id: "2.h2",
                    title: "Retrieved result",
                    result: {
                        result: {
                            phenotype: data.phenotype != null ? data.phenotype : phenotypes[0],
                            queried_phenotypes: data.queried_phenotypes,
                            phenotype_count: phenotypes.length,
                            factor_count: phenotypes.reduce((acc, p) => acc + ((normalized[p].factors || []).length), 0),
                            meta,
                        },
                    },
                },
            });

            this.snapshotFilteredSelectionBaseline();
            this.genesAndFactorValuesLoaded = true;
            this.setLoadStatus("Building knowledge graph from hybrid results…");
            const kgTriples = this.transformMergedDataToKG(this.factorData, "factors");
            this.lastKgTriples = kgTriples;
            await this.waitForStepApproval(
                "2",
                "Knowledge graph is ready. Continue to generate mechanistic hypotheses?",
                true
            );
            this.setLoadStatus("Generating hypotheses…");
            this.setStep({
                id: "4",
                title: "LLM: Generating mechanistic hypotheses",
            });
            this.requestMechanismHypotheses(this.factorData, kgTriples);
            return true;
        },
        /**
         * Hybrid-only retrieval path:
         * POST https://search.hugeamp.org/api/reveal/hybrid-search (or VUE_APP_REVEAL_HYBRID_BASE_URL + /api/reveal/hybrid-search).
         * Body: phenotype_terms, genes_of_interest, mechanism_terms, research_context; optional query_embedding if VUE_APP_HYBRID_CLIENT_EMBEDDING=true.
         */
        async onResearch(phenotypeTermsFromExtract) {
            const rawPhenotype = phenotypeTermsFromExtract != null
                ? phenotypeTermsFromExtract
                : this.lastPhenotypeTerms && this.lastPhenotypeTerms.length
                    ? this.lastPhenotypeTerms
                    : (this.searchCriteria && this.searchCriteria[0] && this.searchCriteria[0].values)
                        ? this.searchCriteria[0].values.filter((v) => v && String(v) !== "(none extracted)")
                        : [];
            const phenotypeTerms = this.normalizeLlmTermList(rawPhenotype);
            try {
                this.genesAndFactorValuesLoaded = false;
                this.factorData = {};
                this.lastHybridSearchMeta = {};
                this.lastHybridSearchResponse = null;
                this.lastKgTriples = [];
                this.mechanisms = null;
                this.mechanismDiagnosticAssessment = null;
                this.hypothesisLastRunMode = null;
                this.phenotypeDescriptionById = {};
                const researchContext = (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values != null)
                    ? String(this.searchCriteria[1].values)
                    : "";
                const usedHybrid = await this.runHybridRetrievalWorkflow({
                    phenotypeTerms,
                    mechanismTerms: this.normalizeLlmTermList(this.lastMechanismTerms),
                    researchContext,
                });
                if (!usedHybrid) {
                    throw new Error("Hybrid retrieval returned no phenotype–factor results.");
                }
            } catch (err) {
                const msg = err && err.message ? String(err.message) : "";
                const isNoResults = /(^|\s)404(\s|$)|no phenotype.?factor results|no results found|no phenotype matches/i.test(msg);
                const isValidation = /(^|\s)422(\s|$)/.test(msg);
                const isTimeout = /(^|\s)504(\s|$)|timed out|AbortError/i.test(msg);
                if (isNoResults) {
                    this.setLoadStatus("No exact matches found for those terms.", true);
                    this.setStep({
                        type: "error",
                        title: "No results found. Try rephrasing your phenotype (e.g., 'Heart Disease' instead of 'CAD') or using broader terms."
                    });
                } else if (isValidation) {
                    this.setLoadStatus("Request could not be validated. Check phenotype terms and research context.", true);
                    this.setStep({
                        type: "error",
                        title: msg.replace(/^\s*422\s*/, "") || "Invalid hybrid search request (422)."
                    });
                } else if (isTimeout) {
                    this.setLoadStatus("Hybrid search timed out. Try again in a moment.", true);
                    this.setStep({
                        type: "error",
                        title: "Hybrid search timed out (504). The database or embedding service may be busy."
                    });
                } else {
                    this.setLoadStatus("Error: " + (err && err.message ? err.message : "hybrid retrieval failed"), true);
                    this.setStep({
                        type: "error",
                        title: "Hybrid retrieval failed due to a server error."
                    });
                }
                this.loadComplete = true;
            }
        },
        /**
         * Kept as an alias for callers that used the mechanism-only hybrid path; resolution of empty phenotype_terms happens inside runHybridRetrievalWorkflow.
         */
        async onResearchPhenotypeFactorsOnly() {
            return this.onResearch();
        },
        /**
         * Map cited flattened KG rows plus merged factorData to main-table keys used by remaining-row coverage
         * (phenotype|collapsed factor id or cluster label).
         */
        /** Gene-set-cluster display strings under phenotype that list geneSymbol in merged factor gene maps. */
        factorLabelsForPhenotypeGene(factorData, phenotype, geneSymbol) {
            const pData = factorData && factorData[phenotype];
            const out = [];
            if (!pData || !Array.isArray(pData.factors)) return out;
            const g = String(geneSymbol || "").trim();
            if (!g) return out;
            pData.factors.forEach((f) => {
                if (!f || !f.genes || !Object.prototype.hasOwnProperty.call(f.genes, g)) return;
                out.push(
                    f.label != null && String(f.label).trim() !== ""
                        ? String(f.label).trim()
                        : String(f.factor).trim()
                );
            });
            return out;
        },
        addTableRowKeysFromCitedFlatRows(keysSet, flat, idSet, factorData) {
            (flat || []).forEach((row) => {
                if (!idSet.has(Number(row.id))) return;
                const pred = String(row.predicate || "").trim();
                const sub = row.subject != null ? String(row.subject).trim() : "";
                const obj = row.object != null ? String(row.object).trim() : "";
                Object.keys(factorData || {}).forEach((pheno) => {
                    const pData = factorData[pheno];
                    if (!pData || !Array.isArray(pData.factors)) return;
                    pData.factors.forEach((f) => {
                        const fid = f.factor != null ? String(f.factor).trim() : "";
                        if (!fid) return;
                        const gss =
                            typeof f.top_gene_sets === "string" && f.top_gene_sets
                                ? f.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                                : [];
                        const geneKeys = Object.keys(f.genes || {});
                        let hit = false;
                        if (pred === "associated_with" && sub === pheno && gss.includes(obj)) hit = true;
                        if (pred === "contains_gene" && sub === pheno && geneKeys.includes(obj)) hit = true;
                        if (pred === "contributes_to_pathway" && geneKeys.includes(sub) && gss.includes(obj)) {
                            hit = true;
                        }
                        if (!hit) return;
                        keysSet.add(`${pheno}|${this.collapseWsLower(fid)}`);
                        if (f.label != null && String(f.label).trim() !== "") {
                            keysSet.add(`${pheno}|${this.collapseWsLower(String(f.label).trim())}`);
                        }
                    });
                });
            });
        },
        /**
         * Flatten an array of objects to CSV (header row + data rows). Escapes fields containing comma or quote.
         * @param {Array<Object>} rows - e.g. [{ id, factor_label, phenotype, top_gene_sets, gene_set_description, score }, ...]
         * @param {string[]} columns - column keys in order
         * @returns {string}
         */
        collapseWsLower(s) {
            return String(s || "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, " ");
        },

        retryMechanismHypothesesRelaxed() {
            this.hypothesisGenerationMode = "relaxed";
            this.retryMechanismHypotheses();
        },
        retryMechanismHypotheses() {
            this.error_mechanisms = false;
            this.error_msg_mechanisms = "";
            this.mechanismDiagnosticAssessment = null;
            this.setLoadStatus("Generating hypotheses…");
            this.loadComplete = false;
            this.showTab = "results";
            this.revealResultsTabUnlocked = true;
            this.setStep({
                id: "4",
                title: "LLM: Generating mechanistic hypotheses",
            });
            this.restartMechanismHypothesisStepTimer();
            const triples = this.lastKgTriples && this.lastKgTriples.length
                ? this.lastKgTriples
                : this.transformMergedDataToKG(this.factorData, 'factors');
            if (triples.length) this.lastKgTriples = triples;
            this.requestMechanismHypotheses(this.factorData, triples);
        },
        /**
         * Treat as timeout/retriable: 504, Gateway Timeout, or network/CORS errors that often accompany backend timeout.
         */
        isMechanismTimeoutError(err) {
            if (!err) return false;
            const status = err.status;
            if (status === 504) return true;
            const msg = (err.message || "").toString();
            return /504|Gateway Timeout|timeout|Timeout|Failed to fetch|Load failed|net::ERR_FAILED|CORS|Access-Control/i.test(msg);
        },
        /**
         * Flattens KG triples into tabular rows (id, subject, predicate, object, context_*).
         * Used to produce CSV for the LLM prompt to save tokens.
         * @param {Array} data - Array of { subject, predicate, object, context? } triples.
         * @returns {Array} - Flat objects ready for CSV.
         */
        flattenKGData(data) {
            return (data || []).map((entry, index) => {
                const flattened = {
                    id: index,
                    subject: entry.subject ?? "",
                    predicate: entry.predicate ?? "",
                    object: entry.object ?? "",
                };
                if (entry.context && typeof entry.context === "object") {
                    Object.keys(entry.context).forEach((key) => {
                        const v = entry.context[key];
                        flattened[`context_${key}`] =
                            v != null && typeof v === "object" ? JSON.stringify(v) : (v != null ? String(v) : "");
                    });
                }
                return flattened;
            });
        },
        /**
         * Converts flattened KG rows to a CSV string (header + rows, quoted as needed).
         * @param {Array} flattened - Array of flat objects from flattenKGData.
         * @returns {string} - CSV string.
         */
        flattenedKGToCSV(flattened) {
            if (!flattened || flattened.length === 0) return "";
            const escape = (val) => {
                const s = val == null ? "" : String(val);
                if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
                return s;
            };
            const keys = Object.keys(flattened[0]);
            const header = keys.map(escape).join(",");
            const rows = flattened.map((row) => keys.map((k) => escape(row[k])).join(","));
            return [header, ...rows].join("\n");
        },
        /** Shared KG + phenotype/gene/gene-set summary for mechanism hypothesis LLM calls (no gene-set-cluster layer in KG). */
        buildMechanismLlmContextBlock(kgBlock, phenoGeneSetSummary, researchContext) {
            return `**Knowledge graph (CSV):**\n\`\`\`\n${kgBlock}\n\`\`\`\n\n**Phenotype / genes / gene sets (from hybrid; clusters are not separate graph nodes):**\n\`\`\`json\n${phenoGeneSetSummary}\n\`\`\`\n\n**Research context:** ${researchContext}`;
        },
        /**
         * Single-pass mechanism generation: generate hypotheses directly from the hybrid KG package.
         * No factor filtering, semantic grouping, or per-group generation phases.
         */
        requestMechanismHypotheses(factorData, kgTriples) {
            this.error_mechanisms = false;
            this.error_msg_mechanisms = "";
            this.mechanismDiagnosticAssessment = null;

            const researchContext =
                (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                    ? String(this.searchCriteria[1].values)
                    : "";
            const flattened = this.flattenKGData(kgTriples);
            this.lastFlattenedKG = flattened;
            const kgBlock = this.flattenedKGToCSV(flattened);
            const phenoSummary = this.serializeFactorDataForPrompt(factorData);
            const baseContextSuffix = this.buildMechanismLlmContextBlock(kgBlock, phenoSummary, researchContext);
            const selectedPairs = (this.factorDataTableRowsFiltered || []).map((r) => ({
                phenotype: String(r.phenotype || "").trim(),
                factor: String((r.factorLabel != null && String(r.factorLabel).trim() !== "") ? r.factorLabel : r.factor || "").trim(),
            })).filter((p) => p.phenotype && p.factor);
            const hybridMetaJson = JSON.stringify(this.lastHybridSearchMeta || {}, null, 2);
            const modeLine =
                this.hypothesisGenerationMode === "relaxed"
                    ? "\n\n**Mode:** EXPLORATORY (RELAXED) — apply the relaxed overrides in your system prompt; set diagnostic_assessment.exploratory_mode to true.\n"
                    : "";
            const hypothesesUserPrompt = `**UI-selected phenotype–gene-set-cluster rows (grouping / associated_pairs must match these labels; the CSV graph has phenotypes, gene sets, and genes only):**\n\`\`\`json\n${JSON.stringify(selectedPairs, null, 2)}\n\`\`\`\n\n**Hybrid retrieval meta (use for diagnostic_assessment / Case 1–4):**\n\`\`\`json\n${hybridMetaJson}\n\`\`\`\n\n${baseContextSuffix}\n${modeLine}\nGenerate hypotheses per your system instructions. Return ONLY JSON including diagnostic_assessment. The hypotheses array must be non-empty only when can_generate_hypothesis is true; otherwise leave hypotheses empty and follow rejection / warning / suggested_optimized_query rules.`;
            const maxAttempts = 3;
            const systemPromptForRun = this.mechanismHypothesisSystemPromptEffective;

            (async () => {
                let parsed = null;
                let lastFailed = null;
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    this.setLoadStatus(`Generating mechanistic hypotheses… (attempt ${attempt}/${maxAttempts})`);
                    const res = await new Promise((resolve) => {
                        let done = false;
                        const finish = (payload) => {
                            if (done) return;
                            done = true;
                            resolve(payload);
                        };
                        this.llmAnalyze.sendPrompt({
                            systemPrompt: systemPromptForRun,
                            userPrompt: hypothesesUserPrompt,
                            onResponse: (response) => {
                                console.log("FactorBaseReveal: hypotheses LLM raw response", response);
                                const json = this.parseLLMResponse(response);
                                if (!json) {
                                    finish({ retry: false, failed: true, err: new Error("Could not parse LLM JSON.") });
                                    return;
                                }
                                finish({ retry: false, failed: false, err: null, json });
                            },
                            onError: (err) => {
                                const isTimeout = this.isMechanismTimeoutError(err);
                                if (isTimeout && attempt < maxAttempts) {
                                    finish({ retry: true, failed: false, err });
                                } else {
                                    finish({ retry: false, failed: true, err });
                                }
                            },
                            onEnd: () => {
                                if (done) return;
                                finish({ retry: false, failed: true, err: new Error("Incomplete LLM response.") });
                            },
                        });
                    });
                    if (res.retry) continue;
                    if (res.failed) {
                        lastFailed = res.err;
                        break;
                    }
                    parsed = res.json;
                    break;
                }

                if (!parsed) {
                    this.hypothesisLastRunMode = null;
                    this.error_mechanisms = true;
                    this.error_msg_mechanisms =
                        lastFailed && lastFailed.message
                            ? lastFailed.message
                            : "Mechanistic hypothesis generation failed.";
                    this.setStep({
                        type: "error",
                        title: "Mechanistic hypothesis generation failed.",
                    });
                    this.setLoadStatus("Ready", true);
                    this.loadComplete = true;
                    return;
                }

                const modeSnapshot = this.hypothesisGenerationMode;
                this.hypothesisLastRunMode = modeSnapshot;

                const diag =
                    parsed.diagnostic_assessment != null && typeof parsed.diagnostic_assessment === "object"
                        ? parsed.diagnostic_assessment
                        : null;
                this.mechanismDiagnosticAssessment = diag;

                if (parsed && typeof parsed.overall_summary === "string") {
                    this.mechanisms_summary = parsed.overall_summary;
                } else {
                    this.mechanisms_summary = null;
                }
                const hypotheses = Array.isArray(parsed.hypotheses)
                    ? parsed.hypotheses
                    : (parsed.hypothesis && typeof parsed.hypothesis === "object" ? [parsed.hypothesis] : []);
                if (!hypotheses.length) {
                    if (diag && diag.can_generate_hypothesis === false) {
                        this.mechanisms = [];
                        if (!this.mechanisms_summary && typeof diag.rejection_reason === "string" && diag.rejection_reason.trim()) {
                            this.mechanisms_summary = diag.rejection_reason.trim();
                        }
                        this.setLoadStatus("Ready", true);
                        this.setStep(
                            {
                                id: "4",
                                substep: {
                                    id: "4.9",
                                    title: "Complete (no hypothesis; diagnostics).",
                                },
                            },
                            true
                        );
                        this.loadComplete = true;
                        this.showTab = "results";
                        return;
                    }
                    this.error_mechanisms = true;
                    this.error_msg_mechanisms = "No hypotheses were returned.";
                    this.setStep({
                        type: "error",
                        title: "No mechanistic hypotheses returned.",
                    });
                    this.setLoadStatus("Ready", true);
                    this.loadComplete = true;
                    return;
                }

                this.mechanisms = this.normalizeMechanismHypotheses(hypotheses);
                this.$nextTick(() => {
                    void this.autoMapAllMechanismsToBiolink();
                });
                this.setLoadStatus("Ready", true);
                this.setStep(
                    {
                        id: "4",
                        substep: {
                            id: "4.9",
                            title: "Complete.",
                        },
                    },
                    true
                );
                this.loadComplete = true;
                this.showTab = "results";
            })();
        },
        /**
         * Build factorData containing only one (phenotype, factor) for ad-hoc mechanism generation.
         * @param {{ phenotype: string, factor: string|number }} row - Table row with phenotype and factor id.
         * @returns {Object|null} - Same shape as factorData slice, or null if not found.
         */
        buildSinglePairFactorData(row) {
            if (!row || row.phenotype == null || row.factor == null) return null;
            const phenotype = String(row.phenotype).trim();
            const factorId = row.factor;
            const pData = this.factorData && this.factorData[phenotype];
            if (!pData) return null;
            const factors = pData.factors || [];
            const factorItem = factors.find((x) => x.factor === factorId || String(x.factor) === String(factorId));
            if (!factorItem) return null;
            const genesInFactor = Object.keys(factorItem.genes || {});
            const globalGenes = pData.genes || {};
            const subsetGlobal = {};
            genesInFactor.forEach((g) => {
                if (globalGenes[g] != null) {
                    subsetGlobal[g] = JSON.parse(JSON.stringify(globalGenes[g]));
                }
            });
            const factorClone = JSON.parse(JSON.stringify(factorItem));
            return {
                [phenotype]: {
                    genes: subsetGlobal,
                    factors: [factorClone],
                },
            };
        },
        /**
         * Generate mechanistic hypothesis for one remaining phenotype–factor pair (same LLM step as main run, subset data only).
         */
        generateHypothesisForRemainingPair(row) {
            if (!row || row.phenotype == null || row.factor == null) return;
            const pairKey = this.getRowKey(row);
            this.remainingPairGenerateError = "";
            const subset = this.buildSinglePairFactorData(row);
            if (!subset) {
                this.remainingPairGenerateError = "Could not build data for this pair.";
                return;
            }
            const kgTriples = this.transformMergedDataToKG(subset, "factors");
            if (!kgTriples || !kgTriples.length) {
                this.remainingPairGenerateError = "No knowledge graph triples for this pair.";
                return;
            }
            this.generatingRemainingRowKey = pairKey;
            this.startRemainingGenerateTimer();
            const flattened = this.flattenKGData(kgTriples);
            const researchContext =
                (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                    ? String(this.searchCriteria[1].values)
                    : "";
            const factorSummary = this.serializeFactorDataForPrompt(subset);
            const kgBlock = this.flattenedKGToCSV(flattened);
            const baseCtx = `**Knowledge graph (CSV):**\n\`\`\`\n${kgBlock}\n\`\`\`\n\n**Factor data summary:**\n\`\`\`json\n${factorSummary}\n\`\`\`\n\n**Research context:** ${researchContext}`;
            const factorLabelForKg =
                row.factorLabel != null && String(row.factorLabel).trim() !== ""
                    ? String(row.factorLabel).trim()
                    : row.factor != null
                      ? String(row.factor).trim()
                      : "";
            const singlePairRequest = {
                group_name: factorLabelForKg ? `${factorLabelForKg} × ${row.phenotype}` : `Remaining pair ${pairKey}`,
                associated_pairs: [
                    {
                        phenotype: String(row.phenotype).trim(),
                        factor: factorLabelForKg,
                    },
                ],
            };
            const hybridMetaJson = JSON.stringify(this.lastHybridSearchMeta || {}, null, 2);
            const pairModeLine =
                this.hypothesisGenerationMode === "relaxed"
                    ? "\n\n**Mode:** EXPLORATORY (RELAXED) — apply relaxed system-prompt overrides; set diagnostic_assessment.exploratory_mode to true.\n"
                    : "";
            const fullPrompt = `**Fixed phenotype-factor request (single pair):**\n\`\`\`json\n${JSON.stringify(singlePairRequest, null, 2)}\n\`\`\`\n\n**Hybrid retrieval meta (diagnostic_assessment / Case 1–4):**\n\`\`\`json\n${hybridMetaJson}\n\`\`\`\n\n${baseCtx}${pairModeLine}\n\nReturn ONLY JSON per your system instructions: include diagnostic_assessment. When can_generate_hypothesis is true, the "hypotheses" array must contain exactly one element for this pair. When false, hypotheses must be empty and rejection fields populated. Include warning_flag / suggested_optimized_query whenever required by the prompt.`;
            const systemPromptForPair = this.mechanismHypothesisSystemPromptEffective;

            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                this.generatingRemainingRowKey = "";
                this.stopRemainingGenerateTimer();
            };

            this.llmAnalyze.sendPrompt({
                systemPrompt: systemPromptForPair,
                userPrompt: fullPrompt,
                onResponse: (response) => {
                    console.log("FactorBaseReveal: hypotheses LLM raw response", response);
                    const json = this.parseLLMResponse(response);
                    if (!json) {
                        this.remainingPairGenerateError = "Could not parse LLM response.";
                        return;
                    }
                    if (!Array.isArray(json.hypotheses) || !json.hypotheses.length) {
                        const rd = json.diagnostic_assessment;
                        if (rd && rd.can_generate_hypothesis === false && typeof rd.rejection_reason === "string" && rd.rejection_reason.trim()) {
                            let msg = rd.rejection_reason.trim();
                            if (typeof rd.suggested_optimized_query === "string" && rd.suggested_optimized_query.trim()) {
                                msg += ` Suggested query: ${rd.suggested_optimized_query.trim()}`;
                            }
                            this.remainingPairGenerateError = msg;
                            return;
                        }
                        this.remainingPairGenerateError =
                            typeof json.error === "string" && json.error
                                ? json.error
                                : "No hypotheses in response.";
                        return;
                    }
                    const p = String(row.phenotype).trim();
                    const fl = row.factorLabel != null ? String(row.factorLabel).trim() : "";
                    const fid = row.factor != null ? String(row.factor).trim() : "";
                    const coverKeys = [];
                    if (fl) coverKeys.push(`${p}|${this.collapseWsLower(fl)}`);
                    if (fid) coverKeys.push(`${p}|${this.collapseWsLower(fid)}`);
                    const normalized = this.normalizeMechanismHypotheses(json.hypotheses, flattened).map((m) => ({
                        ...m,
                        _fromRemainingPair: true,
                        _remainingPairCoverKeys: [...new Set(coverKeys)],
                    }));
                    const prev = Array.isArray(this.mechanisms) ? this.mechanisms : [];
                    this.mechanisms = [...prev, ...normalized];
                    this.$nextTick(() => {
                        void this.autoMapAllMechanismsToBiolink();
                    });
                    if (!this.adHocCoveredRowKeys.includes(pairKey)) {
                        this.adHocCoveredRowKeys = [...this.adHocCoveredRowKeys, pairKey];
                    }
                },
                onError: (err) => {
                    this.remainingPairGenerateError =
                        err && err.message ? err.message : "Request failed or timed out.";
                    finish();
                },
                onEnd: finish,
            });
        },
        /**
         * Extract relevant phenotype ids, gene-set-cluster labels (inferred from merged factorData), and gene set names
         * from flattened KG rows by supporting row ids (hybrid KG: phenotype–gene set via associated_with).
         * @param {Object} [factorData] - Merged phenotype/factor payload; when omitted, relevant_factors stays empty.
         */
        extractRelevantFactorsAndGeneSetsFromFlattened(flattened, rowIds, factorData) {
            const idSet = new Set((rowIds || []).map(Number).filter((n) => !isNaN(n)));
            const rows = (flattened || []).filter((r) => idSet.has(Number(r.id)));
            const phenotypes = new Set();
            const geneSets = new Set();
            const inferredFactors = new Set();
            const ASSOCIATED_WITH = "associated_with";
            const CONTAINS_GENE = "contains_gene";
            const CONTRIBUTES_TO_PATHWAY = "contributes_to_pathway";
            rows.forEach((row) => {
                const pred = row.predicate != null ? String(row.predicate).trim() : "";
                const sub = row.subject != null ? String(row.subject).trim() : "";
                const obj = row.object != null ? String(row.object).trim() : "";
                if (pred === ASSOCIATED_WITH && sub) phenotypes.add(sub);
                if (pred === ASSOCIATED_WITH && obj) geneSets.add(obj);
                if (pred === CONTRIBUTES_TO_PATHWAY && obj) geneSets.add(obj);
            });
            if (factorData) {
                (flattened || []).forEach((row) => {
                    if (!idSet.has(Number(row.id))) return;
                    const pred = String(row.predicate || "").trim();
                    const sub = row.subject != null ? String(row.subject).trim() : "";
                    const obj = row.object != null ? String(row.object).trim() : "";
                    Object.keys(factorData).forEach((pheno) => {
                        const pData = factorData[pheno];
                        if (!pData || !Array.isArray(pData.factors)) return;
                        pData.factors.forEach((f) => {
                            const fid = f.factor != null ? String(f.factor).trim() : "";
                            if (!fid) return;
                            const gss =
                                typeof f.top_gene_sets === "string" && f.top_gene_sets
                                    ? f.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                                    : [];
                            const geneKeys = Object.keys(f.genes || {});
                            let hit = false;
                            if (pred === ASSOCIATED_WITH && sub === pheno && gss.includes(obj)) hit = true;
                            if (pred === CONTAINS_GENE && sub === pheno && geneKeys.includes(obj)) hit = true;
                            if (pred === CONTRIBUTES_TO_PATHWAY && geneKeys.includes(sub) && gss.includes(obj)) {
                                hit = true;
                            }
                            if (!hit) return;
                            inferredFactors.add(
                                f.label != null && String(f.label).trim() !== ""
                                    ? String(f.label).trim()
                                    : fid
                            );
                        });
                    });
                });
            }
            return {
                relevant_phenotypes: [...phenotypes].sort(),
                relevant_factors: [...inferredFactors].sort(),
                relevant_gene_sets: [...geneSets].sort(),
            };
        },
        /**
         * Build per-gene connections (gene-set-cluster labels + gene sets) from flattened KG rows by supporting ids.
         * Cluster labels are recovered from factorData for contains_gene (phenotype → gene) edges.
         */
        extractGeneConnectionsFromFlattened(flattened, rowIds, factorData) {
            const idSet = new Set((rowIds || []).map(Number).filter((n) => !isNaN(n)));
            const rows = (flattened || []).filter((r) => idSet.has(Number(r.id)));
            const map = {};
            const CONTAINS_GENE = "contains_gene";
            const CONTRIBUTES_TO_PATHWAY = "contributes_to_pathway";

            const ensure = (gene) => {
                const g = String(gene || "").trim();
                if (!g) return null;
                if (!map[g]) map[g] = { factors: new Set(), gene_sets: new Set() };
                return g;
            };

            rows.forEach((row) => {
                const pred = row.predicate != null ? String(row.predicate).trim() : "";
                const sub = row.subject != null ? String(row.subject).trim() : "";
                const obj = row.object != null ? String(row.object).trim() : "";
                if (pred === CONTAINS_GENE) {
                    const gene = ensure(obj);
                    if (gene && sub) {
                        if (factorData) {
                            this.factorLabelsForPhenotypeGene(factorData, sub, obj).forEach((lb) =>
                                map[gene].factors.add(lb)
                            );
                        }
                    }
                } else if (pred === CONTRIBUTES_TO_PATHWAY) {
                    const gene = ensure(sub);
                    if (gene && obj) map[gene].gene_sets.add(obj);
                }
            });

            const out = {};
            Object.keys(map).forEach((gene) => {
                out[gene] = {
                    factors: [...map[gene].factors].sort(),
                    gene_sets: [...map[gene].gene_sets].sort(),
                };
            });
            return out;
        },
        /**
         * LLM biological mechanism map: nodes (id, label, group) and edges (from, to, label) → network for vis.
         * @param {Object} hik - hypothesis_in_kg from LLM.
         * @returns {{ nodes: Array, edges: Array } | null}
         */
        buildMechanismFlowNetworkFromHypothesisKg(hik) {
            if (!hik || typeof hik !== "object") return null;
            const rawNodes = Array.isArray(hik.nodes) ? hik.nodes : [];
            const rawEdges = Array.isArray(hik.edges) ? hik.edges : [];
            if (!rawNodes.length || !rawEdges.length) return null;

            const GROUP_ALIASES = {
                gene: "Gene",
                protein: "Gene",
                phenotype: "Phenotype",
                disease: "Phenotype",
                metabolite: "Metabolite",
                process: "Process",
                cell: "Cell",
                drug: "Drug",
                pathway_db: "Pathway",
                "gene set": "Pathway",
                geneset: "Pathway",
            };

            const normalizeGroup = (g) => {
                const s = g != null ? String(g).trim() : "";
                if (!s) return "Entity";
                const low = s.toLowerCase();
                if (GROUP_ALIASES[low]) return GROUP_ALIASES[low];
                return s.charAt(0).toUpperCase() + s.slice(1);
            };

            const customNodes = [];
            const seenNodeIds = new Set();
            for (let i = 0; i < rawNodes.length && customNodes.length < 12; i++) {
                const n = rawNodes[i];
                if (!n || n.id == null || String(n.id).trim() === "") continue;
                const id = String(n.id).trim();
                if (seenNodeIds.has(id)) continue;
                seenNodeIds.add(id);
                const label = n.label != null && String(n.label).trim() !== "" ? String(n.label).trim() : id;
                customNodes.push({
                    id,
                    label,
                    type: normalizeGroup(n.group != null ? n.group : n.type),
                    metadata: {},
                });
            }

            const nodeIds = new Set(customNodes.map((n) => n.id));
            const customEdges = rawEdges
                .filter((e) => e != null && e.from != null && e.to != null)
                .map((e) => {
                    const source = String(e.from).trim();
                    const target = String(e.to).trim();
                    const predRaw =
                        e.label != null && String(e.label).trim() !== ""
                            ? String(e.label).trim()
                            : e.predicate != null
                              ? String(e.predicate).trim()
                              : "";
                    return { source, target, predicate: predRaw };
                })
                .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

            if (customNodes.length < 2 || customEdges.length === 0) return null;
            return { nodes: customNodes, edges: customEdges };
        },
        /**
         * Build network { nodes, edges } from flattened KG rows by row ids (for LLM response with supporting_row_ids).
         * @param {Array} flattened - Flat rows from flattenKGData (id, subject, predicate, object, context_*).
         * @param {Array<number>} rowIds - Row id values from LLM (supporting_row_ids).
         * @returns {{ nodes: Array, edges: Array }} - Shape expected by FactorBaseRevealNetwork.
         */
        buildNetworkFromFlattenedRowIds(flattened, rowIds) {
            const idSet = new Set((rowIds || []).map(Number).filter((n) => !isNaN(n)));
            const rows = (flattened || []).filter((r) => idSet.has(Number(r.id)));
            const CONTEXT_TO_TYPES = {
                PhenotypeToGeneSet: { subject: "Phenotype", object: "Pathway" },
                PhenotypeToGene: { subject: "Phenotype", object: "Gene" },
                GeneToPathway: { subject: "Gene", object: "Pathway" },
                PhenotypeToFactor: { subject: "Phenotype", object: "Factor" },
                FactorToPathway: { subject: "Factor", object: "Pathway" },
                FactorToGene: { subject: "Factor", object: "Gene" },
            };
            const nodesMap = new Map();
            const edges = [];

            const pickLabelFromApi = (row) =>
                row.context_label_from_api != null && String(row.context_label_from_api).trim() !== ""
                    ? String(row.context_label_from_api).trim()
                    : null;

            rows.forEach((row) => {
                const ctxType = row.context_type != null ? String(row.context_type).trim() : "";
                const types = CONTEXT_TO_TYPES[ctxType] || { subject: "Factor", object: "Gene" };
                const subId = row.subject != null ? String(row.subject).trim() : "";
                const objId = row.object != null ? String(row.object).trim() : "";
                if (subId && !nodesMap.has(subId)) {
                    const meta = {};
                    const lfSub = pickLabelFromApi(row);
                    if (types.subject === "Factor" && lfSub) meta.labelFromApi = lfSub;
                    nodesMap.set(subId, {
                        id: subId,
                        label: subId,
                        type: types.subject,
                        metadata: meta,
                    });
                } else if (subId) {
                    const lfSub = pickLabelFromApi(row);
                    if (types.subject === "Factor" && lfSub) {
                        const n = nodesMap.get(subId);
                        if (n && n.type === "Factor" && !n.metadata.labelFromApi) n.metadata.labelFromApi = lfSub;
                    }
                }
                if (objId) {
                    const meta = {};
                    if (row.context_combined_score != null) meta.combined_score = row.context_combined_score;
                    if (row.context_gwas_support != null) meta.gwas_support = row.context_gwas_support;
                    if (row.context_functional_support != null) meta.functional_support = row.context_functional_support;
                    if (row.context_category != null) meta.category = row.context_category;
                    if (row.context_factor_relevance != null) meta.factor_relevance = row.context_factor_relevance;
                    const lfObj = pickLabelFromApi(row);
                    if (types.object === "Factor" && lfObj) meta.labelFromApi = lfObj;
                    if (nodesMap.has(objId)) {
                        if (Object.keys(meta).length) Object.assign(nodesMap.get(objId).metadata, meta);
                    } else {
                        nodesMap.set(objId, { id: objId, label: objId, type: types.object, metadata: meta });
                    }
                }
                if (subId && objId) {
                    edges.push({
                        source: subId,
                        target: objId,
                        predicate: row.predicate != null ? String(row.predicate) : "",
                    });
                }
            });

            return {
                nodes: Array.from(nodesMap.values()),
                edges,
            };
        },
        /**
         * Keep only Gene nodes whose symbols appear in candidate_genes; drop other genes and edges that reference them.
         * Phenotype / Pathway (gene set) nodes are unchanged; legacy Factor nodes, if present, are unchanged.
         */
        filterSupportingNetworkToCandidateGenes(network, candidateGenes) {
            const nodesIn = network && Array.isArray(network.nodes) ? network.nodes : [];
            const edgesIn = network && Array.isArray(network.edges) ? network.edges : [];
            const allowed = new Set();
            (candidateGenes || []).forEach((g) => {
                const sym = g && g.gene != null ? String(g.gene).trim() : "";
                if (sym) allowed.add(sym.toUpperCase());
            });
            if (allowed.size === 0) return { nodes: nodesIn, edges: edgesIn };

            const geneSymbolKey = (n) => {
                const id = n && n.id != null ? String(n.id).trim() : "";
                const label = n && n.label != null ? String(n.label).trim() : "";
                return (id || label).toUpperCase();
            };

            const nodes = nodesIn.filter((n) => {
                if (!n || n.type !== "Gene") return true;
                return allowed.has(geneSymbolKey(n));
            });
            const nodeIds = new Set(nodes.map((n) => n.id));
            const edges = edgesIn.filter((e) => e && nodeIds.has(e.source) && nodeIds.has(e.target));
            return { nodes, edges };
        },
        /**
         * Get combined, gwas, functional scores for a gene from flattened KG (contains_gene rows with context_*).
         * @param {Array} flattened - Flat rows from flattenKGData.
         * @param {string} geneSymbol - Gene symbol (object of contains_gene row).
         * @returns {{ combined: number|null, gwas: number|null, functional: number|null }}
         */
        getGeneScoresFromFlattenedKG(flattened, geneSymbol) {
            const sym = String(geneSymbol || "").trim();
            const rows = (flattened || []).filter(
                (r) =>
                    String(r.predicate || "").trim() === "contains_gene" &&
                    String(r.object || "").trim() === sym
            );
            if (!rows.length) return { combined: null, gwas: null, functional: null };
            const num = (v) => (v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : null);
            let best = rows[0];
            let bestC = num(best.context_combined_score);
            for (let i = 1; i < rows.length; i++) {
                const r = rows[i];
                const c = num(r.context_combined_score);
                if (c != null && (bestC == null || c > bestC)) {
                    best = r;
                    bestC = c;
                }
            }
            return {
                combined: num(best.context_combined_score),
                gwas: num(best.context_gwas_support),
                functional: num(best.context_functional_support),
            };
        },
        /** Pill colors for mechanism hypothesis gene rows (legacy GWAS/functional buckets + new canonical segregation labels). */
        /** Gene pill colors match supporting network nodes (see @/utils/factorRevealGeneColors). */
        mechanismGeneGroupPillStyle(group) {
            return { background: colorForGeneRole(group), color: "#fff" };
        },
        /**
         * Normalize mechanism hypotheses for display. LLM returns genes (no scores); we attach scores from the KG.
         * @param {Array} hypotheses - Raw hypotheses from LLM.
         * @param {Array|null|undefined} flattenedOverride - If provided, use for scoring/networks instead of lastFlattenedKG (ad-hoc single-pair runs).
         */
        normalizeMechanismHypotheses(hypotheses, flattenedOverride) {
            const flattened =
                flattenedOverride !== undefined && flattenedOverride !== null ? flattenedOverride : this.lastFlattenedKG;
            return (hypotheses || []).map((h) => {
                const out = { ...h };
                if (Array.isArray(h.genes) && out.candidate_genes == null) {
                    const withScores = h.genes.map((g) => {
                        const scoresFromKg = flattened ? this.getGeneScoresFromFlattenedKG(flattened, g.gene) : { combined: null, gwas: null, functional: null };
                        return {
                            gene: g.gene,
                            group: g.group,
                            scores: {
                                combined: scoresFromKg.combined,
                                gwas: scoresFromKg.gwas,
                                functional: scoresFromKg.functional,
                            },
                            reason: g.role != null ? g.role : g.reason,
                        };
                    });
                    const primaryBoost = (row) => (/primary mechanistic/i.test(String(row.group || "")) ? 1 : 0);
                    withScores.sort((a, b) => {
                        const pb = primaryBoost(b) - primaryBoost(a);
                        if (pb !== 0) return pb;
                        return (b.scores?.combined ?? -Infinity) - (a.scores?.combined ?? -Infinity);
                    });
                    out.candidate_genes = withScores;
                }
                if (h.novelty != null && out.novelty_explanation == null) out.novelty_explanation = h.novelty;
                if (h.network != null && out.supporting_network == null) out.supporting_network = h.network;
                if (
                    (out.supporting_network == null || !out.supporting_network.nodes?.length) &&
                    Array.isArray(h.supporting_row_ids) &&
                    flattened &&
                    flattened.length > 0
                ) {
                    out.supporting_network = this.buildNetworkFromFlattenedRowIds(flattened, h.supporting_row_ids);
                }
                if (Array.isArray(h.supporting_row_ids) && flattened && flattened.length > 0) {
                    const fd = this.factorData || {};
                    const { relevant_phenotypes, relevant_factors, relevant_gene_sets } =
                        this.extractRelevantFactorsAndGeneSetsFromFlattened(flattened, h.supporting_row_ids, fd);
                    out.relevant_phenotypes = relevant_phenotypes;
                    out.relevant_factors = relevant_factors;
                    out.relevant_gene_sets = relevant_gene_sets;
                    out.gene_connections = this.extractGeneConnectionsFromFlattened(flattened, h.supporting_row_ids, fd);
                }
                const candForNet = out.candidate_genes || h.candidate_genes;
                if (
                    Array.isArray(candForNet) &&
                    candForNet.length > 0 &&
                    out.supporting_network &&
                    Array.isArray(out.supporting_network.nodes) &&
                    out.supporting_network.nodes.length > 0
                ) {
                    out.supporting_network = this.filterSupportingNetworkToCandidateGenes(
                        out.supporting_network,
                        candForNet
                    );
                }
                out.next_steps = Array.isArray(h.next_steps) ? h.next_steps : [];
                out.next_queries = Array.isArray(h.next_queries) ? h.next_queries : [];
                out.hypothesis_in_kg =
                    h.hypothesis_in_kg != null && typeof h.hypothesis_in_kg === "object"
                        ? { ...h.hypothesis_in_kg }
                        : null;
                out.core_spine_network = null;
                const hik = h.hypothesis_in_kg;
                if (
                    hik &&
                    Array.isArray(hik.nodes) &&
                    hik.nodes.length > 0 &&
                    Array.isArray(hik.edges) &&
                    hik.edges.length > 0
                ) {
                    const flow = this.buildMechanismFlowNetworkFromHypothesisKg(hik);
                    if (flow && flow.nodes.length && flow.edges.length) {
                        out.core_spine_network = flow;
                        if (out.hypothesis_in_kg && typeof out.hypothesis_in_kg === "object") {
                            const cap =
                                out.hypothesis_in_kg.caption != null ? String(out.hypothesis_in_kg.caption) : "";
                            out.hypothesis_in_kg = cap ? { caption: cap } : null;
                        }
                    }
                } else if (
                    flattened &&
                    flattened.length > 0 &&
                    hik &&
                    Array.isArray(hik.core_spine_row_ids) &&
                    hik.core_spine_row_ids.length > 0
                ) {
                    const flatIdSet = new Set(
                        (flattened || []).map((r) => Number(r.id)).filter((n) => !Number.isNaN(n))
                    );
                    const supportSet = new Set(
                        (Array.isArray(h.supporting_row_ids) ? h.supporting_row_ids : [])
                            .map(Number)
                            .filter((n) => !Number.isNaN(n))
                    );
                    let spineIds = hik.core_spine_row_ids
                        .map(Number)
                        .filter((id) => !Number.isNaN(id) && flatIdSet.has(id) && supportSet.has(id));
                    if (spineIds.length === 0) {
                        spineIds = hik.core_spine_row_ids
                            .map(Number)
                            .filter((id) => !Number.isNaN(id) && flatIdSet.has(id));
                    }
                    spineIds = spineIds.slice(0, 8);
                    if (spineIds.length > 0) {
                        out.core_spine_network = this.buildNetworkFromFlattenedRowIds(flattened, spineIds);
                    }
                }
                return out;
            });
        },
        /**
         * Compact JSON for the mechanism prompt: per phenotype, merged gene-set names, global gene scores map (no per-cluster list).
         */
        serializeFactorDataForPrompt(factorData) {
            const summary = {};
            Object.keys(factorData || {}).forEach((phenotype) => {
                const p = factorData[phenotype];
                if (!p) return;
                const geneSets = new Set();
                (p.factors || []).forEach((f) => {
                    if (typeof f.top_gene_sets !== "string" || !f.top_gene_sets) return;
                    f.top_gene_sets.split(";").forEach((s) => {
                        const t = s.trim();
                        if (t) geneSets.add(t);
                    });
                });
                summary[phenotype] = {
                    gene_count: Object.keys(p.genes || {}).length,
                    merged_gene_sets: [...geneSets].sort(),
                    genes: p.genes || {},
                };
            });
            return JSON.stringify(summary, null, 2);
        },
        /**
         * Builds a factor-free KG from merged hybrid data: phenotype–gene set (\`associated_with\`),
         * phenotype–gene (\`contains_gene\`), gene–gene set (\`contributes_to_pathway\`). Per-cluster
         * rows in factor arrays are merged and deduped at the phenotype layer.
         * @param {Object} mergedData - factorData: { [phenotype]: { genes: {}, factors: [] } }
         * @returns {Array<{ subject, predicate, object, context }>}
         */
        transformMergedDataToKG(mergedData, factorsKey) {
            const triples = [];
            const seenPhenoGs = new Set();
            const phenoGeneTriple = new Map();
            const seenGeneGs = new Set();

            Object.keys(mergedData || {}).forEach((phenotypeName) => {
                const pData = mergedData[phenotypeName];
                if (!pData || !Array.isArray(pData[factorsKey])) return;

                pData[factorsKey].forEach((factorObj) => {
                    const geneSets = (typeof factorObj.top_gene_sets === "string" && factorObj.top_gene_sets)
                        ? factorObj.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                        : [];

                    geneSets.forEach((gsName) => {
                        const pgKey = `${phenotypeName}\u0000${gsName}`;
                        if (seenPhenoGs.has(pgKey)) return;
                        seenPhenoGs.add(pgKey);
                        triples.push({
                            subject: phenotypeName,
                            predicate: "associated_with",
                            object: gsName,
                            context: { type: "PhenotypeToGeneSet" },
                        });
                    });

                    const factorGenes = factorObj.genes || {};
                    const genesInFactor = Object.keys(factorGenes)
                        .map((gName) => ({
                            name: gName,
                            relevance: factorGenes[gName] && factorGenes[gName].factorRelevance != null
                                ? factorGenes[gName].factorRelevance
                                : 0,
                            includedFromRequest: !!(factorGenes[gName] && factorGenes[gName].includedFromRequest),
                        }))
                        .sort((a, b) => {
                            if (b.includedFromRequest !== a.includedFromRequest) {
                                return (b.includedFromRequest ? 1 : 0) - (a.includedFromRequest ? 1 : 0);
                            }
                            return Math.abs(b.relevance) - Math.abs(a.relevance);
                        });

                    const globalGenes = pData.genes || {};

                    genesInFactor.forEach((gene) => {
                        const globalGeneStats = globalGenes[gene.name] || {};
                        const gwasSupport = globalGeneStats.gwasSupport;
                        const geneSetSupport = globalGeneStats.geneSetSupport;
                        const category = (gwasSupport != null && geneSetSupport != null && gwasSupport > geneSetSupport)
                            ? "Genetic (Established)"
                            : "Functional (Novel)";

                        const newCtx = {
                            type: "PhenotypeToGene",
                            factor_relevance: gene.relevance,
                            combined_score: globalGeneStats.combined,
                            gwas_support: gwasSupport,
                            functional_support: geneSetSupport,
                            category,
                            included_from_request: gene.includedFromRequest === true,
                        };
                        const gKey = `${phenotypeName}\u0000${gene.name}`;
                        const existing = phenoGeneTriple.get(gKey);
                        const scoreNew = newCtx.combined_score != null && !isNaN(Number(newCtx.combined_score))
                            ? Number(newCtx.combined_score)
                            : -Infinity;
                        const scoreOld = existing && existing.context.combined_score != null
                            ? Number(existing.context.combined_score)
                            : -Infinity;
                        if (!existing) {
                            const t = {
                                subject: phenotypeName,
                                predicate: "contains_gene",
                                object: gene.name,
                                context: newCtx,
                            };
                            phenoGeneTriple.set(gKey, t);
                            triples.push(t);
                        } else if (scoreNew > scoreOld) {
                            existing.context = newCtx;
                        }

                        const factorGeneSets = factorObj.geneSets || {};
                        let geneLinkedToSomePathway = false;
                        geneSets.forEach((gsName) => {
                            const members = factorGeneSets[gsName] && Array.isArray(factorGeneSets[gsName].genes)
                                ? factorGeneSets[gsName].genes
                                : [];
                            if (!members.includes(gene.name)) return;
                            geneLinkedToSomePathway = true;
                            const ggKey = `${gene.name}\u0000${gsName}`;
                            if (seenGeneGs.has(ggKey)) return;
                            seenGeneGs.add(ggKey);
                            triples.push({
                                subject: gene.name,
                                predicate: "contributes_to_pathway",
                                object: gsName,
                                context: {
                                    type: "GeneToPathway",
                                    context_phenotype: phenotypeName,
                                },
                            });
                        });
                        if (!geneLinkedToSomePathway && geneSets.length > 0) {
                            const fallbackGs = geneSets[0];
                            if (!factorObj.geneSets) {
                                this.$set(factorObj, "geneSets", {});
                            }
                            if (!factorObj.geneSets[fallbackGs]) {
                                this.$set(factorObj.geneSets, fallbackGs, { genes: [] });
                            }
                            const gsEntry = factorObj.geneSets[fallbackGs];
                            const gens = Array.isArray(gsEntry.genes) ? [...gsEntry.genes] : [];
                            if (!gens.includes(gene.name)) {
                                gens.push(gene.name);
                                this.$set(gsEntry, "genes", gens);
                            }
                            const ggKey = `${gene.name}\u0000${fallbackGs}`;
                            if (!seenGeneGs.has(ggKey)) {
                                seenGeneGs.add(ggKey);
                                triples.push({
                                    subject: gene.name,
                                    predicate: "contributes_to_pathway",
                                    object: fallbackGs,
                                    context: {
                                        type: "GeneToPathway",
                                        context_phenotype: phenotypeName,
                                        linkage_fallback: true,
                                    },
                                });
                            }
                        }
                    });
                });
            });

            return triples;
        },
        /**
         * Normalize factor id for matching API response rows to factor objects. API may return
         * factor as number (1) while we store 'factor1'; this returns the numeric part for comparison.
         * Request query must use full id: q=$phenotype,2,small,factor1 (not 1).
         * @param {string|number} factor - factor id (e.g. 'factor1', 2)
         * @returns {string} - numeric part if pattern factorN, else string form (for matching only)
         */
        getFactorQueryValue(factor) {
            if (factor == null) return "";
            const s = String(factor).trim();
            const m = s.match(/^factor(\d+)$/i);
            return m ? m[1] : s;
        },
    },
});
</script>

<style scoped>
.factor-base-reveal {
    --reveal-min-font-size: 11pt;
}
.factor-base-reveal .small,
.factor-base-reveal .btn-sm,
.factor-base-reveal .form-control-sm,
.factor-base-reveal .text-muted,
.factor-base-reveal .page-link,
.factor-base-reveal td,
.factor-base-reveal th,
.factor-base-reveal label,
.factor-base-reveal li,
.factor-base-reveal a,
.factor-base-reveal p,
.factor-base-reveal input,
.factor-base-reveal textarea,
.factor-base-reveal select,
.factor-base-reveal button {
    font-size: max(var(--reveal-min-font-size), 1em);
}
.closed {
    overflow: hidden;
    height: 50px;
    box-shadow: inset 0px -20px 20px -20px #ccc;
}

.reveal-tab {
    border-bottom: 5px solid transparent;
    cursor: pointer;
}
.reveal-tab:not(.tab-inactive):not(.tab-active):hover {
    border-bottom: 5px solid #f1682280;
}
.tab-active {
    border-bottom: 5px solid #f16822;
    cursor: default;
}
.tab-inactive {
    opacity: 0.5;
    cursor: default;
}

.btn-cfde {
  background-color: #f16822;
  border-color: #f16822;
  color: #fff;
}
.btn-cfde:hover,
.btn-cfde:focus,
.btn-cfde:active {
  background-color: #d15618;
  border-color: #f16822;
  color: #fff;
}
.btn-outline-cfde {
    background: #fff;
    border-color: #f16822;
    color: #f16822;
}
.btn-outline-cfde:hover,
.btn-outline-cfde:focus,
.btn-outline-cfde:active {
    background: #f16822;
    border-color: #f16822;
    color: #fff;
}

.pill {
    display: inline-block;
    padding: 0.25em 0.6em;
    border-radius: 1em;
    background: #e9ecef;
    width: fit-content;
}
.pill.editable {
    cursor: pointer;
}
.pill.new {
    width: 2em;
    padding: 0.25em;
}
.cfde-explore-geneset-link {
    cursor: pointer;
}
.cfde-explore-geneset-link:hover {
    filter: brightness(1.08);
    text-decoration: underline;
}

.reveal-alt-query-links {
    list-style-type: disc;
    padding-left: 1.25rem;
    margin: 0;
}
.reveal-alt-query-links li {
    margin: 0 0 0.35rem 0;
}
.reveal-alt-query-links li:last-child {
    margin-bottom: 0;
}
.reveal-alt-query-link {
    color: #f16822 !important;
    font-style: italic;
    cursor: pointer;
    text-decoration: none;
    white-space: normal;
    line-height: 1.35;
}
.reveal-alt-query-link:hover,
.reveal-alt-query-link:focus {
    color: #d15618 !important;
    text-decoration: underline;
}

.ai-gen {
    display: inline;
    background: #cce5ff;
    color: #004085;
    padding: 0 3px;
    border-radius: 3px;
    font-size: inherit;
    margin: 0 0 0 3px;
    position: relative;
    border: 0;
    line-height: inherit;
}
.ai-gen:hover::after {
    content: 'Written by a AI';
    position: absolute;
    background: #cce5ff;
    color: #004085;
    width: max-content;
    padding: 0 3px;
    top: 0;
    left: 0;
    font-size: inherit;
    line-height: initial;
    border-radius: 3px;
}
.criteria-detail.collapsed {
    display: none;
}
.section-header {
    cursor: pointer;
}
.mechanism-card {
    border: 1px solid #dee2e6;
}
.mechanism-card-header {
    background: #6c757d;
}
.network-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
}
.network-popup-box {
    width: 90vw;
    height: 90vh;
    max-width: 100%;
    max-height: 100%;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.network-popup-header {
    flex-shrink: 0;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #dee2e6;
    background: #f8f9fa;
}
.network-popup-body {
    flex: 1;
    min-height: 0;
    padding: 1rem;
    overflow: auto;
}

/* Candidate genes table: header color coding and legend */
.candidate-genes-legend {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}
.candidate-genes-legend-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.2em 0.5em;
    border-radius: 4px;
    font-size: 11pt;
    font-weight: 500;
}
.candidate-genes-legend-pill.ai-generated {
    background: #cce5ff;
    color: #004085;
}
.candidate-genes-legend-pill.raw-data {
    background: #e2e3e5;
    color: #383d41;
}
::v-deep .candidate-genes-th-ai {
    background: #cce5ff !important;
    color: #004085;
}
::v-deep .candidate-genes-th-raw {
    background: #e2e3e5 !important;
    color: #383d41;
}

.query-guidelines-panel {
    width: 100%;
}
.query-guidelines-toggle {
    border: none;
    box-shadow: none;
    padding: 0.35rem 0;
    background: transparent;
}
.query-guidelines-toggle:hover,
.query-guidelines-toggle:focus {
    text-decoration: none;
    background: transparent;
}
.query-guidelines-content {
    overflow: visible;
}
.query-guidelines-example {
    border-left: 3px solid #f16822;
    margin: 0;
}

/* Relevant gene sets: program source pill + hover menu for C2M2 file links */
.fbr-program-download-wrap {
    position: relative;
    display: inline-block;
    max-width: 100%;
}
.fbr-program-download-trigger {
    cursor: default;
    max-width: min(280px, 100%);
}
.fbr-program-download-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}
.fbr-program-download-menu {
    display: none;
    position: absolute;
    z-index: 1060;
    right: 0;
    top: 100%;
    margin-top: -1px;
    min-width: 220px;
    max-width: min(500px, 85vw);
}
.fbr-program-download-wrap:hover .fbr-program-download-menu,
.fbr-program-download-wrap:focus-within .fbr-program-download-menu {
    display: block;
}
.fbr-program-download-menu-heading {
    font-size: 0.65rem;
    letter-spacing: 0.04em;
}
.fbr-provenance-menu-link {
    word-break: break-word;
}
.fbr-provenance-menu-link:hover {
    background: #f3f4f6;
}

/* Strict / Relaxed toggle: B-V .custom-switch positions the track with negative left (~2.25rem); keep that bleed inside .reveal-switch-slot only. */
.reveal-hypothesis-mode-toggle {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 0.35rem;
    max-width: 100%;
}
.reveal-hypothesis-mode-toggle .reveal-mode-label {
    flex: 0 0 auto;
    white-space: nowrap;
    line-height: 1.25;
    user-select: none;
}
.reveal-hypothesis-mode-toggle .reveal-mode-label-strict {
    text-align: right;
    padding-right: 0.2rem;
}
.reveal-hypothesis-mode-toggle .reveal-mode-label-relaxed {
    min-width: 3.25rem;
    text-align: left;
    padding-left: 0.2rem;
}
.reveal-hypothesis-mode-toggle .reveal-switch-slot {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Room for switch track drawn left of the control’s box (BS4 custom-switch). */
    /*- ;min-width: 3.5rem;
    padding: 0 0.35rem 0 2.65rem;*/
    margin-left: 30px;
    margin-right: -10px;
    box-sizing: content-box;
}
.reveal-hypothesis-mode-toggle .reveal-mode-switch {
    flex: 0 0 auto;
    margin: 0;
    padding: 0;
}

</style>
