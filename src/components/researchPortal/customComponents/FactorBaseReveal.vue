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
                    <div class="d-flex align-items-baseline justify-content-between">
                        <!--
                        <label class="font-weight-bold text-secondary mb-0">Describe what you're researching or curious about:</label>
                        <fieldset class="d-flex align-items-center gap-2 mb-0">
                            <span class="small">mode:</span>
                            <div class="d-flex align-items-center gap-1">
                                <input type="radio" id="search_auto" name="search_mode" value="auto" v-model="searchMode"/>
                                <label for="search_auto" class="mb-0 small">auto</label>
                            </div>
                            <div class="d-flex align-items-center gap-1">
                                <input type="radio" id="search_step" name="search_mode" value="step" v-model="searchMode"/>
                                <label for="search_step" class="mb-0 small">step</label>
                            </div>
                        </fieldset>
                        -->
                    </div>
                    <div class="d-flex gap-2" style="position: relative;">
                        <input
                            type="text"
                            class="form-control"
                            ref="queryInput"
                            v-model="userQuery"
                            placeholder="Describe what you're researching or curious about"
                            @keydown.enter.prevent="queryParse()"
                            style="padding: 10px 150px 10px 10px; font-size: 14px; height: auto;"
                        />
                        <button class="btn btn-cfde" style="min-width: 120px; position: absolute; right: 10px; top: 50%; transform: translateY(-50%);" @click="queryParse()">Reveal</button>
                    </div>
                    <a role="button" class="small text-primary" @click="display_examples = !display_examples" style="padding: 5px 10px;">
                        {{ display_examples ? 'hide' : 'show' }} examples
                    </a>
                    <div v-if="display_examples" class="d-flex flex-wrap gap-2" style="padding:0 10px;">
                        <span
                            v-for="ex in exampleQueries"
                            :key="ex"
                            class="pill query-sample"
                            @click="userQuery = ex"
                        >{{ ex }}</span>
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
                    <div style="display:flex; gap:20px">
                        <h4 class="reveal-tab" 
                            :class="{'tab-active':showTab==='process'}" 
                            @click="showTab='process'">
                            Process
                        </h4>
                        <h4 class="reveal-tab" 
                            :class="{'tab-active':showTab==='data', 'tab-inactive': !loadComplete}" 
                            @click="showTab='data'">
                            Data
                        </h4>
                        <h4 class="reveal-tab" 
                            :class="{'tab-active':showTab==='results', 'tab-inactive': !loadComplete}" 
                            @click="showTab='results'">
                            Results
                        </h4>
                    </div>
                    <div>
                        <div style="display:flex; flex-direction: column; gap:5px; color: #555;" :style="`display: ${showTab==='process'?'flex':'none'}`">
                            <div v-if="loadComplete" class="font-weight-bold" style="color: #FF6600; font-size: 1.2em;">Process took {{ currTotalTime() }}</div>
                            <div v-for="(step, i) in steps" class="status" :key="i">
                                <template v-if="step.type!=='error'">
                                    <div @click="step.substeps.length>0 && i!==steps.length-1 ? toggleStep(i) : null" 
                                        style="display:flex; gap: 5px; align-items: center;" 
                                        :style="`cursor: ${step.substeps.length>0 && i!==steps.length-1?'pointer':'default'}`"
                                    >
                                        <b-spinner v-if="i===steps.length-1 && !loadComplete && !stepApprovalGateActive" small></b-spinner>
                                        <span v-else-if="i===steps.length-1 && !loadComplete && stepApprovalGateActive">▶</span>
                                        <span v-else-if="step.substeps.length>0">{{ step.expanded ? "▼" : "▶" }}</span>
                                        <span v-else>♦</span>
                                        <span style="font-weight:bold">{{ step.title }}</span>
                                        <span>{{ formatTime(step.time) || currStepTime(step) }}</span>
                                        <span v-if="i === steps.length - 1 && step.substeps.length">
                                            {{ step.substeps[step.substeps.length - 1].title }}
                                        </span>
                                    </div>
                                    <div v-if="step.expanded" class="sub-status" style="display:flex; flex-direction: column;">
                                        <div v-for="(substep, ii) in step.substeps" style="padding:0 0 0 18px">
                                            <div @click="toggleStep(i, ii)" style="cursor: pointer;">
                                                <span v-if="substep.result">{{ substep.expanded ? "▼" : "▶" }} </span>
                                                {{ substep.title }}
                                            </div>
                                            <div v-if="substep.result && substep.expanded" style="padding:0 0 0 18px">
                                                <div v-if="!(step.id === '1' && substep.id === '1.1')" v-html="substep.result.title"></div>
                                                <div
                                                    v-if="step.id === '1' && substep.id === '1.1' && searchCriteriaEditRows.length && ((stepApprovalGateActive && stepApprovalGateStepId === '1') || searchCriteriaExtractionGateDone)"
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
                                                </div>
                                                <pre v-else-if="!(step.id === '1' && substep.id === '1.1')" style="background: #eee; padding: 10px; height: 100px; resize:vertical; overflow: auto;">{{ substep.result.result }}</pre>
                                                <div
                                                    v-if="stepApprovalGateActive && stepApprovalGateStepId === '1' && step.id === '1' && substep.id === '1.1'"
                                                    style="display:flex; flex-direction:column; gap:8px; margin-top:10px;"
                                                >
                                                    <div class="text-muted" style="font-size: 1rem; font-weight: 700;">
                                                        Extracted search terms and research context. Review terms, then continue.
                                                    </div>
                                                    <div style="display:flex; gap:10px;">
                                                        <button class="btn btn-outline-secondary btn-sm" @click="resetSearchCriteriaGateEdits">
                                                            Reset
                                                        </button>
                                                        <button class="btn btn-cfde btn-sm" @click="approveStepGate">
                                                            Continue
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            v-if="stepApprovalGateActive && stepApprovalGateStepId === step.id && step.id !== '1'"
                                            style="padding: 10px 0 0 18px;"
                                        >
                                            <div class="text-muted mb-2" style="font-size: 1rem; font-weight: 700;">{{ stepApprovalGateMessage }}</div>
                                            <button
                                                class="btn btn-cfde btn-sm"
                                                @click="approveStepGate"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </div>
                                </template>
                                <template v-else>
                                    <div style="display:flex; gap: 5px; align-items: center;">
                                        <span style="font-weight:bold; color: red">Error: {{ step.title }}</span>
                                    </div>
                                </template>
                            </div>
                            <div v-if="!loadComplete">Total process time: {{ currTotalTime() }}</div>
                        </div>

                        <div v-if="(genesAndFactorValuesLoaded || loadComplete) && factorDataTableRows.length" :style="`display: ${showTab==='data'?'block':'none'}`">
                            <div class="font-weight-bold mb-2" style="color: #FF6600; font-size: 1.2em;">Selected {{ phenotypeCount }} phenotype{{ phenotypeCount !== 1 ? 's' : '' }} and {{ factorCount }} gene set clusters{{ factorCount !== 1 ? 's' : '' }} relevant to research context.</div>
                            <!--
                            <div class="section-header d-flex justify-content-between align-items-start mb-2" @click="display_phenotypes_factors = !display_phenotypes_factors">
                                <div class="d-flex flex-column gap-2" style="max-width: calc(100% - 100px);">
                                    <div class="d-flex flex-wrap align-items-baseline gap-2">
                                        <strong>Phenotype:</strong>
                                        <span class="pill" v-for="p in phenotypeList" :key="p">{{ getPhenotypeDisplay(p) }}</span>
                                    </div>
                                    <div class="d-flex flex-wrap align-items-baseline gap-2">
                                        <strong>Factors:</strong>
                                        <span class="pill" v-for="f in factorLabelsList" :key="f">{{ f }}</span>
                                    </div>
                                </div>
                                <span class="small text-muted">{{ display_phenotypes_factors ? 'show less' : 'show more' }}</span>
                            </div>
                            -->
                            <div :class="{ collapsed: !display_phenotypes_factors }" class="criteria-detail">
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
                                                    <th style="width: auto;">Gene set cluster</th>
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
                                                    <td>{{ row.factorLabel }}</td>
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
                                                    <td colspan="5" class="p-0 border-0">
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
                                                                        { key: 'factorRelevance', label: 'Relevant to cluster', thStyle: { width: '120px' } },
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
                                                { key: 'factorLabel', label: 'Gene set cluster', thStyle: { width: '180px' } },
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
                                                                { key: 'factorRelevance', label: 'Relevant to cluster', thStyle: { width: '120px' } },
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
    
                        <div v-if="mechanisms && mechanisms.length" :style="`display: ${showTab==='results'?'block':'none'}`">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="font-weight-bold" style="color: #FF6600; font-size: 1.2em;">Generated {{ mechanisms.length }} mechanistic hypotheses.</div>
                                <button class="btn btn-outline-secondary btn-sm" @click="downloadReport">
                                    Download report
                                </button>
                            </div>
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
                                        <div class="mechanism-card-header px-3 py-3 bg-secondary text-white d-flex align-items-center flex-wrap gap-2">
                                            <div class="font-weight-bold" style="font-size: 1.1em;">{{ mechanism.group_name }}</div>
                                            <button
                                                class="btn btn-cfde btn-sm ml-auto"
                                                @click.stop="openDesignProtocolForMechanism(mechanism)"
                                            >
                                                Design experiment protocol
                                            </button>
                                        </div>
                                        <div class="" style="display:flex; flex-direction: column; gap:20px; padding:20px">
                                            <div class="" style="display:flex; gap:20px">
                                                <div class="" style="flex:1">
                                                    <div class="font-weight-bold small text-uppercase text-muted mb-1">Mechanistic hypothesis</div>
                                                    <div class="font-size-1">{{ mechanism.hypothesis }}<span class="ai-gen">AI</span></div>
                                                </div>
                                                <div class="" style="flex:1">
                                                    <div class="font-weight-bold small text-uppercase text-muted mb-1">Rationale</div>
                                                    <div class="small">{{ mechanism.novelty_explanation || mechanism.novelty }}<span class="ai-gen">AI</span></div>
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
                                                                    //{ key: 'group', label: 'Group', thStyle: { width: '110px' } },
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
                                                                    <span class="small pill" :style="`background:${row.item.group==='Balanced'?'#984ea3':row.item.group==='High Functional'?'#7570b3':row.item.group==='High GWAS'?'#d95f02':'#acacad'}; color:white`">{{ row.item.gene }}</span>
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
                                                        <div v-if="(mechanism.relevant_factors && mechanism.relevant_factors.length)" class="mb-2">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-1">Relevant gene set clusters</div>
                                                            <div style="display:flex; flex-direction: column; gap:3px">
                                                                <div
                                                                    v-for="(factor, fidx) in mechanism.relevant_factors"
                                                                    :key="'mech-' + idx + '-rfac-' + fidx + '-' + (factor || '')"
                                                                    class="small pill"
                                                                    :style="`background:${NODE_COLORS.Factor}; color:white`"
                                                                >
                                                                    {{ factor }}
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
                                                                    {{ getPhenotypeDisplay(pair.phenotype) }} - {{ pair.factor }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-if="(mechanism.relevant_gene_sets && mechanism.relevant_gene_sets.length)" class="mb-2">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-1">Relevant gene sets</div>
                                                            <div class="small" style="white-space: normal; display:flex; flex-direction: column; gap:3px">
                                                                <div v-for="set in formatRelevantGeneSetsForDisplay(mechanism.relevant_gene_sets)" :key="set.gs">
                                                                    <div style="display:flex; gap:10px; justify-content: space-between; align-items: center;">
                                                                        <a
                                                                            :href="cfdeExploreGeneSetHref(mechanism, set.gs, set.program)"
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            class="pill text-white text-decoration-none cfde-explore-geneset-link"
                                                                            style="overflow: clip; text-overflow: ellipsis; max-width: 300px; word-wrap: normal;"
                                                                            :style="`background:${NODE_COLORS.Pathway}`"
                                                                            :title="set.desc || set.gs"
                                                                        >{{ set.gs }}</a>
                                                                        <div class="pill">{{ set.program }}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
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
                                                                    <th style="width: auto;">Gene set cluster</th>
                                                                    <th style="width: 300px;">Genes and gene sets in cluster</th>
                                                                    <th style="width: 130px;">Hypothesis.</th>
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
                                                                    <td>{{ row.factorLabel }}</td>
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
                                                                    <td colspan="6" class="p-0 border-0">
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
                                                                                        { key: 'factorRelevance', label: 'Relevant to cluster', thStyle: { width: '120px' } },
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
                                                                { key: 'factorLabel', label: 'Gene set cluster', thStyle: { width: '180px' } },
                                                                { key: 'rationale', label: 'Selection rationale', thStyle: { width: '220px' } },
                                                                { key: 'view_genes', label: 'Genes and gene sets in cluster', thStyle: { width: '140px' } },
                                                                { key: 'hypothesis', label: 'Hypothesis.', thStyle: { width: '130px' } }
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
                                                                                { key: 'factorRelevance', label: 'Relevant to cluster', thStyle: { width: '120px' } },
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
        <div v-if="networkPopupMechanismIndex !== null && mechanisms && mechanisms[networkPopupMechanismIndex]" class="network-popup-overlay" @click.self="closeNetworkPopup">
            <div class="network-popup-box">
                <div class="network-popup-header d-flex justify-content-between align-items-center">
                    <span class="font-weight-bold">Supporting network</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" aria-label="Close" @click="closeNetworkPopup">
                        <b-icon icon="x"></b-icon>
                    </button>
                </div>
                <div class="network-popup-body">
                    <factor-base-reveal-network
                        :key="'popup-' + networkPopupMechanismIndex"
                        :network="mechanisms[networkPopupMechanismIndex].supporting_network || mechanisms[networkPopupMechanismIndex].network"
                        :genes="mechanisms[networkPopupMechanismIndex].candidate_genes || mechanisms[networkPopupMechanismIndex].genes || []"
                        :width="popupNetworkWidth"
                        :height="popupNetworkHeight"
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
import JSZip from "jszip";

import keyParams from "@/utils/keyParams";
import { createLLMClient } from "@/utils/llmClient";
import { kcURL, resolveCfdePhenotypeLabel } from "@/utils/cfdeUtils";
import uiUtils from "@/utils/uiUtils";

import FactorBaseRevealNetwork from "./FactorBaseRevealNetwork.vue";
import FactorBaseRevealHeatmap from "./FactorBaseRevealHeatmap.vue";

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
            display_examples: false,
            exampleQueries: [
                "What novel genes might be candidates for rare congenital myopathies",
                "I'm looking to find mechanisms that underlie body mass index in humans",
                "What are druggable targets for obesity?",
            ],
            searchCriteria: null,
            display_search_criteria: false,
            edit_search_criteria: false,
            prev_search_criteria: null,
            searchCriteriaEditRows: [],
            searchCriteriaEditRowsDefault: [],
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
            popupNetworkWidth: 960,
            popupNetworkHeight: 640,

            all_supporting_network: null,
            gene_set_sources: {},

            NODE_COLORS: {
                Phenotype: "#e41a1c",
                Factor: "#377eb8",
                Pathway: "#4daf4a",
                Gene: "#984ea3",
            },

            showTab: 'process',

extractSystemPropmpt: `### Task
Deconstruct biological research queries into structured keywords for high-precision semantic search. Focus on mapping user input to canonical scientific nomenclature, providing broad search variations, and strictly balancing term counts to prevent semantic vector dilution.

### JSON Schema
Return ONLY a JSON object:
{
  "phenotype_terms": ["List of formal clinical diagnoses, PLUS broad root keywords and common variations to maximize database text-matching. Max 6."],
  "mechanism_terms": ["Expanded list of biological processes, biochemical pathways, cell types, or localized anatomies. Max 6."],
  "search_type": "phenotypes | mechanisms | both",
  "research_context": "A concise (10-20 word) synthesis of the research intent, explicitly stating the target organ, tissue, or cell type."
}

### Extraction Logic & Constraints
1. **Phenotype Keyword Expansion (CRITICAL)**: Because 'phenotype_terms' are used for strict database text-matching, provide variations. Break compound traits into root words. 
   - *Example:* "waist-to-hip ratio" -> ["waist-to-hip ratio", "waist", "hip", "waist-hip", "adiposity"].
2. **Mechanism Keyword Expansion & Vector Balancing (CRITICAL)**: Expand cellular processes and anatomical terms into their deeper biochemical components and specific cell-types. 
   - *Example:* "senescence" -> ["cellular senescence", "cell cycle arrest", "senescence-associated secretory phenotype", "SASP", "oxidative stress"].
   - *Example:* "vascular smooth muscle" -> ["vascular smooth muscle cells", "VSMC", "myofibroblast-like phenotype", "arterial intima"].
3. **Semantic Parity (The Golden Rule)**: Never let the number of 'phenotype_terms' drastically outnumber 'mechanism_terms'. If you generate 5 phenotypes, you MUST generate at least 4-5 mechanism terms to ensure the mathematical vector heavily prioritizes the specific biology over the generic disease.
4. **Canonicalization & Formalization**: Upgrade colloquial biological terms to formal equivalents (e.g., "fat" to "adipose tissue", "BBB" to "blood-brain barrier").
5. **Anatomical Anchoring**: If a target organ/tissue is mentioned, explicitly include that precise anatomical context in the 'research_context' string.
6. **Null Safety**: If a query contains only a phenotype or only a mechanism, the other list MUST be empty [].
7. **Exclusions**: Omit broad stop-words like "study", "data", "mouse", "mechanisms", or software names.

### Example 1 (Mechanism Only)
Input: "Find an endothelial glycocalyx / O-glycosylation mechanism linked to BBB maintenance."
Output: {
  "phenotype_terms": [],
  "mechanism_terms": ["endothelial glycocalyx", "O-linked glycosylation", "blood-brain barrier maintenance", "tight junctions", "cerebral endothelium"],
  "search_type": "mechanisms",
  "research_context": "Investigating how the endothelial glycocalyx and O-linked glycosylation regulate cerebral endothelium and blood-brain barrier integrity."
}

### Example 2 (Both with Expansion and Parity)
Input: "Find a vascular smooth-muscle senescence mechanism linked to atherosclerosis."
Output: {
  "phenotype_terms": ["atherosclerosis", "atherosclerotic plaque", "coronary artery disease", "atheroma"],
  "mechanism_terms": ["vascular smooth muscle cell senescence", "VSMC", "cellular senescence", "senescence-associated secretory phenotype", "SASP", "arterial wall remodeling"],
  "search_type": "both",
  "research_context": "Investigating how vascular smooth muscle cell senescence in the arterial wall contributes to atherosclerotic plaque development."
}`,

mechanismHypothesisSystemPrompt: `
You are an expert in bioinformatics. Each request gives you a full set of context-relevant Phenotype–Factor (gene set cluster) pairs, plus (2) the KG as CSV with row \`id\`s, (3) factor summary JSON, and (4) research context.

### Task
Produce one or more mechanistic hypotheses across the provided pairs. Return \`hypotheses\` as a non-empty array.

### Discovery logic
1. **Modifier rule:** Each hypothesis MUST relate a well-known gene (when present in the KG for that group) with at least one 'Functional (Novel)' category gene from the data where possible.
2. **Gene sets:** Explicitly connect factors in that group to the gene sets (pathways) in the KG (\`linked_to_pathway\`, \`contributes_to_pathway\`).
3. **Support priority:** Prefer genes with combined_score context in the data; prioritize strong functional signal where appropriate.
4. **Data fidelity:** Use only labels and categories present in the KG CSV.
5. Site of Action Constraint: The mechanistic hypothesis MUST take place in the specific anatomical location defined in the research context. Do not shift the mechanism to a different organ simply because the provided gene sets originate from there. If the data comes from a different organ, explain how the products of those genes circulate to influence the target anatomical site.

### Output (strict JSON)
Return ONLY:
{
  "data_tracing_scratchpad": "Briefly list the specific row IDs from the CSV that connect the phenotype to the factor, and the factor to the highest-scoring genes. Do not use outside knowledge.",
  "hypotheses": [
    {
      "group_name": "Short mechanistic headline",
      "associated_pairs": [ { "phenotype": "...", "factor": "..." } ],
      "hypothesis": "2–3 sentences.",
      "novelty": "Contrast canonical vs non-canonical emphasis.",
      "genes": [
        { 
         "gene": "SYMBOL", 
         "group": "High GWAS | High Functional | Balanced", 
         "role": "Brief bridge role.",
         "source_row_id": "Must match a 'contains_gene' row ID from the provided CSV exactly."
  }
      ],
      "supporting_row_ids": [0, 1, 2]
    }
  ]
}

The \`hypotheses\` array MUST contain at least one element.

(Do NOT return 'scores' in genes; scores are filled by the system.)

### Guidelines
- **associated_pairs:** Must match phenotype/factor pairs exactly from the provided list.
- **Row referencing (Phenotype–Factor):** \`supporting_row_ids\` must include every \`associated_with\` row id for each pair in the core \`associated_pairs\` array.
- **Row referencing (gene sets / pathways — mandatory):** Include all \`linked_to_pathway\` rows for factors in the group and all \`contributes_to_pathway\` rows for each listed gene that appear in the KG for that story; do not omit pathway rows.
- **Gene limits:** At least 5 high-impact candidate genes per hypothesis where the KG provides enough genes; otherwise as many as are strongly supported.
- **Sorting:** Order \`genes\` by impact (higher combined_score first when inferable from context).
`,
        };
    },
    computed: {
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
            console.log('factorDataTableRowsWithRationaleMeta', rows)
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
        /**
         * Phenotype–factor pairs cited in mechanism results: from flattened KG rows
         * (predicate associated_with) referenced by each hypothesis supporting_row_ids.
         */
        mechanismResultPhenotypeFactorPairKeys() {
            const keys = new Set();
            const flat = this.lastFlattenedKG;
            const mechs = this.mechanisms || [];
            if (!mechs.length) return keys;
            for (const m of mechs) {
                if (m._fromRemainingPair && Array.isArray(m._remainingPairCoverKeys)) {
                    m._remainingPairCoverKeys.forEach((k) => keys.add(k));
                    continue;
                }
                if (!flat || !flat.length) continue;
                if (!Array.isArray(m.supporting_row_ids) || !m.supporting_row_ids.length) continue;
                const idSet = new Set(m.supporting_row_ids.map(Number));
                flat.forEach((row) => {
                    if (!idSet.has(Number(row.id))) return;
                    if (String(row.predicate).trim() !== "associated_with") return;
                    const p = row.subject != null ? String(row.subject).trim() : "";
                    const f = row.object != null ? String(row.object).trim() : "";
                    if (p && f) keys.add(`${p}|${this.collapseWsLower(f)}`);
                });
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
    },
    created() {
        this.llmExtract = createLLMClient({
            llm: "openai",
            model: "gpt-5-mini",
            system_prompt: this.extractSystemPropmpt
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
        this.$nextTick(() => {
            if (this.$refs.queryInput) this.$refs.queryInput.focus();
        });
    },
    beforeDestroy() {
        this.stopStepTimer();
        this.stopRemainingGenerateTimer();
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
        async fetchProvenance(geneset){
            const url = `https://cfde-dev.hugeampkpnbi.org/api/bio/query/c2m2-provenance?q=${geneset}`
            const res = await fetch(url);
            if (!res.ok) {
                console.log('provenance fetch err')
            }
            const json = await res.json();
            return json.data;
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
            console.log('onGeneSetRowToggled', row.item);
            console.log('gene_set_sources', this.gene_set_sources);
            //if (!row._showDetails) return;
            const key = row.item.geneset;
            if(this.gene_set_sources[key]) {
                console.log('available')
                return;
            }
            const data = await this.fetchProvenance(key);
            const result = data && data.length>0 ? this.formatProvenance(data[0]) : null
            this.$set(this.gene_set_sources, key, result);
        },
        async downloadReport() {
            if (!this.mechanisms || !this.mechanisms.length) return;
            try {
                const zip = new JSZip();

                const researchContext =
                    (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                        ? String(this.searchCriteria[1].values)
                        : "";

                let report = "";
                report += "Factor-based reveal mechanistic report\n";
                report += "======================================\n\n";
                if (researchContext) {
                    report += `Research context: ${researchContext}\n\n`;
                }
                if (this.mechanisms_summary) {
                    report += "Overall summary:\n";
                    report += `${this.mechanisms_summary}\n\n`;
                }
                this.mechanisms.forEach((m, idx) => {
                    report += `Mechanism ${idx + 1}: ${m.group_name || "(unnamed)"}\n`;
                    if (m.hypothesis) {
                        report += `  Mechanistic hypothesis: ${m.hypothesis}\n`;
                    }
                    if (m.novelty_explanation || m.novelty) {
                        report += `  Rationale: ${m.novelty_explanation || m.novelty}\n`;
                    }
                    if (m.relevance) {
                        report += `  Relevance: ${m.relevance}\n`;
                    }
                    if (Array.isArray(m.relevant_phenotypes) && m.relevant_phenotypes.length) {
                        const phenotypeLabels = m.relevant_phenotypes.map((id) => this.getPhenotypeDisplay(id));
                        report += `  RELEVANT PHENOTYPES: ${phenotypeLabels.join(", ")}\n`;
                    }
                    if (Array.isArray(m.relevant_factors) && m.relevant_factors.length) {
                        report += `  RELEVANT FACTORS: ${m.relevant_factors.join(", ")}\n`;
                    }
                    if (Array.isArray(m.relevant_gene_sets) && m.relevant_gene_sets.length) {
                        const geneSetInfoMap = this.buildGeneSetInfoMap();
                        const geneSetLines = m.relevant_gene_sets.map((gs) => {
                            const info = geneSetInfoMap[gs];
                            if (!info) return gs;
                            const desc = (info.description != null && String(info.description).trim() !== "") ? String(info.description).trim() : "";
                            const program = (info.gene_set_program != null && String(info.gene_set_program).trim() !== "") ? String(info.gene_set_program).trim() : "";
                            if (desc && program) return `${gs} (${desc}, ${program})`;
                            if (desc) return `${gs} (${desc})`;
                            if (program) return `${gs} (${program})`;
                            return gs;
                        });
                        report += `  RELEVANT GENE SETS: ${geneSetLines.join(", ")}\n`;
                    }

                    const genes = m.candidate_genes || m.genes || [];
                    if (genes.length) {
                        report += "  Candidate genes (matching table columns):\n";
                        report += "    Gene | Group | Reason | Combined | GWAS | Functional | Relevant factors | Relevant gene sets\n";
                        genes.forEach((g) => {
                            const scores = g.scores || {};
                            const combined = scores.combined ?? scores.c;
                            const gwas = scores.gwas ?? scores.g;
                            const functional = scores.functional ?? scores.f;
                            const reason = g.reason != null ? g.reason : g.role;
                            const geneName = g.gene != null ? String(g.gene).trim() : "";
                            const conn =
                                m.gene_connections &&
                                geneName &&
                                m.gene_connections[geneName]
                                    ? m.gene_connections[geneName]
                                    : { factors: [], gene_sets: [] };
                            const relFactors =
                                Array.isArray(conn.factors) && conn.factors.length
                                    ? conn.factors.join(", ")
                                    : "-";
                            const relGeneSets =
                                Array.isArray(conn.gene_sets) && conn.gene_sets.length
                                    ? conn.gene_sets.join(", ")
                                    : "-";
                            report += `    ${geneName || "-"} | ${g.group || "-"} | ${reason || "-"} | ${combined ?? "-"} | ${gwas ?? "-"} | ${functional ?? "-"} | ${relFactors} | ${relGeneSets}\n`;
                        });
                    }

                    if (m.genes_collective_reason) {
                        report += `  Genes collective reason: ${m.genes_collective_reason}\n`;
                    }

                    const net = m.supporting_network || m.network;
                    if (net && (Array.isArray(net.nodes) || Array.isArray(net.edges))) {
                        const nodeCount = Array.isArray(net.nodes) ? net.nodes.length : 0;
                        const edgeCount = Array.isArray(net.edges) ? net.edges.length : 0;
                        report += `  Supporting network: ${nodeCount} nodes, ${edgeCount} edges\n`;
                    }

                    report += "\n";
                });

                zip.file("report.txt", report);

                const imagePromises = (this.mechanisms || []).map(async (m, idx) => {
                    const refKey = `mechanismNetwork-${idx}`;
                    const compRef = this.$refs[refKey];
                    const comp = Array.isArray(compRef) ? compRef[0] : compRef;
                    if (comp && typeof comp.exportPng === "function") {
                        const blob = await comp.exportPng(3);
                        if (blob) {
                            zip.file(`mechanism-network-${idx + 1}.png`, blob);
                        }
                        if (typeof comp.exportSvg === "function") {
                            const svgBlob = await comp.exportSvg();
                            if (svgBlob) {
                                zip.file(`mechanism-network-${idx + 1}.svg`, svgBlob);
                            }
                        }
                    }
                });

                await Promise.all(imagePromises);

                const blob = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "factor-base-reveal-report.zip";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.warn("FactorBaseReveal: downloadReport failed", err);
            }
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
                console.warn(`Step is missing id`)
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
                    console.warn(`Step ${ID} is missing substep id`)
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
        currTotalTime() {
            return this.formatTime(this.now - this.stepsTime);
        },
        currStepTime(step){
            return this.formatTime(this.now - step.timeStart);
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
            this.showTab = "process";
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
            const researchContext =
                this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values != null
                    ? String(this.searchCriteria[1].values)
                    : "";
            this.searchCriteriaEditRows = [
                { type: "Phenotype terms", term: phen.join(", ") },
                { type: "Mechanism terms", term: mech.join(", ") },
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
            const contextRow = rows.find((r) => r && r.type === "Research context");
            const phenotypeTerms = String((phenotypeRow && phenotypeRow.term) || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            const mechanismTerms = String((mechanismRow && mechanismRow.term) || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            const researchContext = contextRow ? String(contextRow.term || "").trim() : "";

            this.lastPhenotypeTerms = phenotypeTerms;
            this.lastMechanismTerms = mechanismTerms;
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
        approveStepGate() {
            if (!this.stepApprovalGateActive) return;
            const gateStepId = this.stepApprovalGateStepId;
            if (this.stepApprovalGateStepId === "1") {
                this.applySearchCriteriaGateEdits();
                this.searchCriteriaExtractionGateDone = true;
            }
            const resolver = this.stepApprovalGateResolver;
            this.stepApprovalGateActive = false;
            this.stepApprovalGateStepId = "";
            this.stepApprovalGateMessage = "";
            this.stepApprovalGateResolver = null;
            const stepIdx = this.steps.findIndex((s) => s && s.id === gateStepId);
            if (stepIdx !== -1) {
                this.$set(this.steps[stepIdx], "expanded", false);
                const substeps = this.steps[stepIdx].substeps || [];
                substeps.forEach((_, subIdx) => {
                    this.$set(this.steps[stepIdx].substeps[subIdx], "expanded", false);
                });
            }
            this.resumeStepsElapsedAfterReview();
            this.setLoadStatus("Continuing workflow…");
            if (typeof resolver === "function") resolver();
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
        openDesignProtocolForMechanism(mechanism) {
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

            const designUrl = kcURL(`/r/cfde_design?${params.toString()}`);
            window.open(designUrl, "_blank", "noopener");
        },
        openNetworkPopup(mechanismIndex) {
            this.networkPopupMechanismIndex = mechanismIndex;
            this.popupNetworkWidth = Math.max(400, Math.round((typeof window !== "undefined" && window.innerWidth) ? window.innerWidth * 0.9 : 960));
            this.popupNetworkHeight = Math.max(300, Math.round((typeof window !== "undefined" && window.innerHeight) ? window.innerHeight * 0.9 - 56 : 640));
        },
        closeNetworkPopup() {
            this.networkPopupMechanismIndex = null;
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
            //console.log('getGenesetForFactor', f);
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
            return Object.keys(f.genes).map((geneName) => {
                const rel = f.genes[geneName];
                const global = globalGenes[geneName] || {};
                const rawVal = rel.factor_value ?? rel.factorRelevance;
                const factorValue = rawVal != null && rawVal !== ""
                    ? (typeof rawVal === "number" && !isNaN(rawVal) ? Number(rawVal).toFixed(3) : String(rawVal))
                    : "—";
                return {
                    gene: geneName,
                    factorRelevance: factorValue,
                    combined: global.combined != null ? Number(global.combined).toFixed(2) : "—",
                    gwasSupport: global.gwasSupport != null ? Number(global.gwasSupport).toFixed(2) : "—",
                    geneSetSupport: global.geneSetSupport != null ? Number(global.geneSetSupport).toFixed(2) : "—",
                };
            });
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
            this.loadComplete = false;
            this.searchCriteria = null;
            this.mechanisms = null;
            this.mechanisms_summary = null;
            this.stepApprovalGateActive = false;
            this.stepApprovalGateStepId = "";
            this.stepApprovalGateMessage = "";
            this.stepApprovalGateResolver = null;
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
            this.showTab = 'process';
            this.display_examples = false;
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
                console.error("FactorBaseReveal: Failed to parse LLM JSON", e);
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

            console.log("FactorBaseReveal: JSON", json);
            console.log('phenoptype terms', json.phenotype_terms)
            console.log('mechanism terms', json.mechanism_terms)

            const searchTerms = [
                ...(Array.isArray(json.phenotype_terms) ? json.phenotype_terms : []),
                ...(Array.isArray(json.mechanism_terms) ? json.mechanism_terms : []),
            ].filter(Boolean);

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
            
            const phenotypeTerms = Array.isArray(json.phenotype_terms) ? json.phenotype_terms : [];
            const mechanismTerms = Array.isArray(json.mechanism_terms) ? json.mechanism_terms : [];

            this.lastPhenotypeTerms = phenotypeTerms;
            this.lastMechanismTerms = mechanismTerms;

            this.setStep({
                id: "1",
                substep: {
                    id: "1.1",
                    result: {
                        title: "Extracted search terms and research context. Review terms, then continue.",
                        result: {
                            phenotypeTerms,
                            mechanismTerms,
                            researchContext
                        }
                    }
                }
            })
            this.buildSearchCriteriaEditRows();

            await this.waitForStepApproval(
                "1",
                "Review terms and continue when ready.",
                true
            );

            if (this.searchMode === "auto") {
                if (mechanismTerms.length > 0) {
                    this.onResearchPhenotypeFactorsOnly();
                } else if (phenotypeTerms.length > 0) {
                    this.onResearch(phenotypeTerms);
                }
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
            return [...(mechanismTerms || []), ...(phenotypeTerms || []), researchContext]
                .map((v) => String(v || "").trim())
                .filter(Boolean)
                .join("\n");
        },
        async fetchHybridQueryEmbedding(queryText) {
            const text = String(queryText || "").trim();
            if (!text) throw new Error("Hybrid search requires non-empty query text for embedding.");
            const embResp = await fetch("http://127.0.0.1:11434/api/embed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "mxbai-embed-large",
                    input: text,
                }),
            });
            const embJson = await embResp.json().catch(() => ({}));
            const embedding = embJson && Array.isArray(embJson.embeddings) ? embJson.embeddings[0] : null;
            if (!embResp.ok) {
                throw new Error(`Embedding API failed: ${embResp.status} ${JSON.stringify(embJson)}`);
            }
            if (!Array.isArray(embedding) || embedding.length !== 1024) {
                throw new Error("Invalid embedding from Ollama: expected 1024 floats from mxbai-embed-large.");
            }
            return embedding;
        },
        async callHybridRevealSearch({ queryEmbedding, phenotypeTerms, mechanismTerms, researchContext }) {
            const payload = {
                query_embedding: queryEmbedding,
                phenotype_terms: phenotypeTerms,
                mechanism_terms: mechanismTerms,
                research_context: researchContext,
            };
            const url = "http://127.0.0.1:8000/api/reveal/hybrid-search";
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await resp.json().catch(() => ({}));
            if (!resp.ok || !json || json.status !== "success") {
                throw new Error(`Hybrid search failed at ${url}: ${resp.status} ${JSON.stringify(json)}`);
            }
            return json;
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
                const factorLabel = item && item.label != null && String(item.label).trim() !== ""
                    ? String(item.label).trim()
                    : factorId;
                const topGeneSets = Array.isArray(item && item.top_gene_sets)
                    ? item.top_gene_sets.map((s) => String(s || "").trim()).filter(Boolean)
                    : (item && item.top_gene_sets != null ? String(item.top_gene_sets).split(/[;,]/).map((s) => s.trim()).filter(Boolean) : []);
                const geneSetPrograms = Array.isArray(item && item.gene_set_programs)
                    ? item.gene_set_programs.map((s) => String(s || "").trim()).filter(Boolean)
                    : (item && item.gene_set_program != null ? String(item.gene_set_program).split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean) : []);

                const factorObj = {
                    factor: factorId,
                    label: factorLabel,
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
                    factorObj.genes[gene] = {
                        factorRelevance: rel != null ? rel : 1,
                        factor_value: rel,
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
            if (!Array.isArray(phenotypeTerms) || phenotypeTerms.length === 0) return false;
            const queryText = this.buildHybridQueryText({ phenotypeTerms, mechanismTerms, researchContext });
            if (!queryText) return false;

            this.setLoadStatus("Hybrid retrieval: generating embedding…");
            this.setStep({
                id: "2",
                title: "API: Hybrid retrieval of phenotype–gene set cluster associations",
            });
            const embedding = await this.fetchHybridQueryEmbedding(queryText);
            this.setStep({
                id: "2",
                substep: {
                    id: "2.h1",
                    title: "Generated query embedding",
                    result: { result: { dims: embedding.length, model: "mxbai-embed-large" } },
                },
            });

            this.setLoadStatus("Hybrid retrieval: searching factors and gene sets…");
            const hybridJson = await this.callHybridRevealSearch({
                queryEmbedding: embedding,
                phenotypeTerms,
                mechanismTerms,
                researchContext,
            });
            const normalized = this.normalizeHybridFactorsToFactorData(hybridJson, phenotypeTerms);
            const phenotypes = Object.keys(normalized).filter((p) => (normalized[p].factors || []).length > 0);
            if (!phenotypes.length) return false;

            this.factorData = normalized;
            this.setStep({
                id: "2",
                substep: {
                    id: "2.h2",
                    title: "Hybrid retrieval result",
                    result: {
                        result: {
                            phenotype: hybridJson && hybridJson.data ? hybridJson.data.phenotype : phenotypes[0],
                            phenotype_count: phenotypes.length,
                            factor_count: phenotypes.reduce((acc, p) => acc + ((normalized[p].factors || []).length), 0),
                        },
                    },
                },
            });

            this.snapshotFilteredSelectionBaseline();
            this.genesAndFactorValuesLoaded = true;
            this.setLoadStatus("Building knowledge graph from hybrid results…");
            const kgTriples = this.transformMergedDataToKG(this.factorData, "factors");
            this.lastKgTriples = kgTriples;
            this.setStep({
                id: "3",
                title: "KG: Building and flattening knowledge graph for LLM",
                substep: {
                    id: "3.1",
                    title: "Generated KG triples and flattened rows",
                    result: {
                        result: {
                            triple_count: Array.isArray(kgTriples) ? kgTriples.length : 0,
                            phenotype_count: phenotypes.length,
                        },
                    },
                },
            });
            await this.waitForStepApproval(
                "3",
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
         * Uses local embedding + local hybrid-search backend to get phenotype↔factor↔gene-set candidates,
         * then builds KG and runs hypothesis generation.
         */
        async onResearch(phenotypeTermsFromExtract) {
            const phenotypeTerms = phenotypeTermsFromExtract != null
                ? phenotypeTermsFromExtract
                : this.lastPhenotypeTerms.length
                    ? this.lastPhenotypeTerms
                    : (this.searchCriteria && this.searchCriteria[0] && this.searchCriteria[0].values)
                        ? this.searchCriteria[0].values.filter((v) => v && String(v) !== "(none extracted)")
                        : [];
            if (phenotypeTerms.length === 0) {
                if (this.lastMechanismTerms && this.lastMechanismTerms.length > 0) {
                    return this.onResearchPhenotypeFactorsOnly();
                }
                console.log("FactorBaseReveal: No phenotype terms, skipping hybrid retrieval.");
                return;
            }
            try {
                this.genesAndFactorValuesLoaded = false;
                this.factorData = {};
                this.lastKgTriples = [];
                this.mechanisms = null;
                this.phenotypeDescriptionById = {};
                const researchContext = (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values != null)
                    ? String(this.searchCriteria[1].values)
                    : "";
                const usedHybrid = await this.runHybridRetrievalWorkflow({
                    phenotypeTerms,
                    mechanismTerms: this.lastMechanismTerms || [],
                    researchContext,
                });
                if (!usedHybrid) {
                    throw new Error("Hybrid retrieval returned no phenotype–factor results.");
                }
            } catch (err) {
                console.warn("FactorBaseReveal: Hybrid retrieval workflow failed", err);
                const msg = err && err.message ? String(err.message) : "";
                const isNoResults = /(^|\s)404(\s|$)|no phenotype.?factor results|no results found/i.test(msg);
                if (isNoResults) {
                    this.setLoadStatus("No exact matches found for those terms.", true);
                    this.setStep({
                        type: "error",
                        title: "No results found. Try rephrasing your phenotype (e.g., 'Heart Disease' instead of 'CAD') or using broader terms."
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
         * Mechanism-only entry now routes to the same hybrid-only retrieval workflow.
         */
        async onResearchPhenotypeFactorsOnly() {
            const mechanismTerms = this.lastMechanismTerms && this.lastMechanismTerms.length
                ? this.lastMechanismTerms
                : (this.searchCriteria && this.searchCriteria[0] && this.searchCriteria[0].values)
                    ? this.searchCriteria[0].values.filter((v) => v && String(v) !== "(none extracted)")
                    : [];
            if (mechanismTerms.length === 0) {
                console.log("FactorBaseReveal: No mechanism terms, skipping hybrid retrieval.");
                return;
            }
            try {
                this.genesAndFactorValuesLoaded = false;
                this.factorData = {};
                this.lastKgTriples = [];
                this.mechanisms = null;
                this.phenotypeDescriptionById = {};
                const hybridResearchContext = (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values != null)
                    ? String(this.searchCriteria[1].values)
                    : "";
                const usedHybrid = await this.runHybridRetrievalWorkflow({
                    phenotypeTerms: this.lastPhenotypeTerms && this.lastPhenotypeTerms.length
                        ? this.lastPhenotypeTerms
                        : mechanismTerms,
                    mechanismTerms,
                    researchContext: hybridResearchContext,
                });
                if (!usedHybrid) {
                    throw new Error("Hybrid retrieval returned no phenotype–factor results.");
                }
            } catch (err) {
                console.warn("FactorBaseReveal: Hybrid retrieval workflow failed (mechanism path)", err);
                const msg = err && err.message ? String(err.message) : "";
                const isNoResults = /(^|\s)404(\s|$)|no phenotype.?factor results|no results found/i.test(msg);
                if (isNoResults) {
                    this.setLoadStatus("No exact matches found for those terms.", true);
                    this.setStep({
                        type: "error",
                        title: "No results found. Try rephrasing your phenotype (e.g., 'Heart Disease' instead of 'CAD') or using broader terms."
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

        retryMechanismHypotheses() {
            this.error_mechanisms = false;
            this.error_msg_mechanisms = "";
            this.setLoadStatus("Generating hypotheses…");
            this.loadComplete = false;
            this.setStep({
                id: "4",
                title: "LLM: Generating mechanistic hypotheses",
            });
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
        /** Shared KG + factor summary block for mechanism hypothesis LLM calls. */
        buildMechanismLlmContextBlock(kgBlock, factorSummary, researchContext) {
            return `**Knowledge graph (CSV):**\n\`\`\`\n${kgBlock}\n\`\`\`\n\n**Factor data summary:**\n\`\`\`json\n${factorSummary}\n\`\`\`\n\n**Research context:** ${researchContext}`;
        },
        /**
         * Single-pass mechanism generation: generate hypotheses directly from the hybrid KG package.
         * No factor filtering, semantic grouping, or per-group generation phases.
         */
        requestMechanismHypotheses(factorData, kgTriples) {
            this.error_mechanisms = false;
            this.error_msg_mechanisms = "";

            const researchContext =
                (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                    ? String(this.searchCriteria[1].values)
                    : "";
            const flattened = this.flattenKGData(kgTriples);
            this.lastFlattenedKG = flattened;
            const kgBlock = this.flattenedKGToCSV(flattened);
            const factorSummary = this.serializeFactorDataForPrompt(factorData);
            const baseContextSuffix = this.buildMechanismLlmContextBlock(kgBlock, factorSummary, researchContext);
            const selectedPairs = (this.factorDataTableRowsFiltered || []).map((r) => ({
                phenotype: String(r.phenotype || "").trim(),
                factor: String((r.factorLabel != null && String(r.factorLabel).trim() !== "") ? r.factorLabel : r.factor || "").trim(),
            })).filter((p) => p.phenotype && p.factor);
            const hypothesesUserPrompt = `**Phenotype–Factor pairs to explain:**\n\`\`\`json\n${JSON.stringify(selectedPairs, null, 2)}\n\`\`\`\n\n${baseContextSuffix}\n\nGenerate hypotheses directly for these pairs. Return ONLY JSON with a non-empty "hypotheses" array.`;
            const maxAttempts = 3;

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
                            userPrompt: hypothesesUserPrompt,
                            onResponse: (response) => {
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

                if (parsed && typeof parsed.overall_summary === "string") {
                    this.mechanisms_summary = parsed.overall_summary;
                } else {
                    this.mechanisms_summary = null;
                }
                const hypotheses = Array.isArray(parsed.hypotheses)
                    ? parsed.hypotheses
                    : (parsed.hypothesis && typeof parsed.hypothesis === "object" ? [parsed.hypothesis] : []);
                if (!hypotheses.length) {
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
            const fullPrompt = `**Fixed phenotype-factor request (single pair):**\n\`\`\`json\n${JSON.stringify(singlePairRequest, null, 2)}\n\`\`\`\n\n${baseCtx}\n\nReturn ONLY JSON with a "hypotheses" array of length **1** for this pair (hypotheses[0] only).`;

            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                this.generatingRemainingRowKey = "";
                this.stopRemainingGenerateTimer();
            };

            this.llmAnalyze.sendPrompt({
                userPrompt: fullPrompt,
                onResponse: (response) => {
                    const json = this.parseLLMResponse(response);
                    if (!json) {
                        this.remainingPairGenerateError = "Could not parse LLM response.";
                        return;
                    }
                    if (!Array.isArray(json.hypotheses) || !json.hypotheses.length) {
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
                    if (!this.adHocCoveredRowKeys.includes(pairKey)) {
                        this.adHocCoveredRowKeys = [...this.adHocCoveredRowKeys, pairKey];
                    }
                },
                onError: (err) => {
                    console.warn("FactorBaseReveal: remaining-pair mechanism LLM error", err);
                    this.remainingPairGenerateError =
                        err && err.message ? err.message : "Request failed or timed out.";
                    finish();
                },
                onEnd: finish,
            });
        },
        /**
         * Extract relevant phenotype ids, factor labels, and gene set names from flattened KG rows by supporting row ids.
         * Phenotypes: from associated_with (subject). Factors: from associated_with (object) and linked_to_pathway/contains_gene (subject). Gene sets: from linked_to_pathway and contributes_to_pathway (object).
         * @param {Array} flattened - Flat rows from flattenKGData.
         * @param {Array<number>} rowIds - supporting_row_ids from LLM.
         * @returns {{ relevant_phenotypes: string[], relevant_factors: string[], relevant_gene_sets: string[] }}
         */
        extractRelevantFactorsAndGeneSetsFromFlattened(flattened, rowIds) {
            const idSet = new Set((rowIds || []).map(Number).filter((n) => !isNaN(n)));
            const rows = (flattened || []).filter((r) => idSet.has(Number(r.id)));
            const phenotypes = new Set();
            const factors = new Set();
            const geneSets = new Set();
            const ASSOCIATED_WITH = "associated_with";
            const LINKED_TO_PATHWAY = "linked_to_pathway";
            const CONTAINS_GENE = "contains_gene";
            const CONTRIBUTES_TO_PATHWAY = "contributes_to_pathway";
            rows.forEach((row) => {
                const pred = row.predicate != null ? String(row.predicate).trim() : "";
                const sub = row.subject != null ? String(row.subject).trim() : "";
                const obj = row.object != null ? String(row.object).trim() : "";
                if (pred === ASSOCIATED_WITH && sub) phenotypes.add(sub);
                if (pred === ASSOCIATED_WITH && obj) factors.add(obj);
                if ((pred === LINKED_TO_PATHWAY || pred === CONTAINS_GENE) && sub) factors.add(sub);
                if ((pred === LINKED_TO_PATHWAY || pred === CONTRIBUTES_TO_PATHWAY) && obj) geneSets.add(obj);
            });
            return {
                relevant_phenotypes: [...phenotypes].sort(),
                relevant_factors: [...factors].sort(),
                relevant_gene_sets: [...geneSets].sort(),
            };
        },
        /**
         * Build per-gene connections (factors + gene sets) from flattened KG rows by supporting ids.
         * - Factors directly connected to a gene: Factor --contains_gene--> Gene
         * - Gene sets directly connected to a gene: Gene --contributes_to_pathway--> GeneSet
         * @param {Array} flattened
         * @param {Array<number>} rowIds
         * @returns {{ [gene: string]: { factors: string[], gene_sets: string[] } }}
         */
        extractGeneConnectionsFromFlattened(flattened, rowIds) {
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
                    if (gene && sub) map[gene].factors.add(sub);
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
         * Build network { nodes, edges } from flattened KG rows by row ids (for LLM response with supporting_row_ids).
         * @param {Array} flattened - Flat rows from flattenKGData (id, subject, predicate, object, context_*).
         * @param {Array<number>} rowIds - Row id values from LLM (supporting_row_ids).
         * @returns {{ nodes: Array, edges: Array }} - Shape expected by FactorBaseRevealNetwork.
         */
        buildNetworkFromFlattenedRowIds(flattened, rowIds) {
            const idSet = new Set((rowIds || []).map(Number).filter((n) => !isNaN(n)));
            const rows = (flattened || []).filter((r) => idSet.has(Number(r.id)));
            const CONTEXT_TO_TYPES = {
                PhenotypeToFactor: { subject: "Phenotype", object: "Factor" },
                FactorToPathway: { subject: "Factor", object: "Pathway" },
                FactorToGene: { subject: "Factor", object: "Gene" },
                GeneToPathway: { subject: "Gene", object: "Pathway" },
            };
            const nodesMap = new Map();
            const edges = [];

            rows.forEach((row) => {
                const ctxType = row.context_type != null ? String(row.context_type).trim() : "";
                const types = CONTEXT_TO_TYPES[ctxType] || { subject: "Factor", object: "Gene" };
                const subId = row.subject != null ? String(row.subject).trim() : "";
                const objId = row.object != null ? String(row.object).trim() : "";
                if (subId && !nodesMap.has(subId)) {
                    nodesMap.set(subId, {
                        id: subId,
                        label: subId,
                        type: types.subject,
                        metadata: {},
                    });
                }
                if (objId) {
                    const meta = {};
                    if (row.context_combined_score != null) meta.combined_score = row.context_combined_score;
                    if (row.context_gwas_support != null) meta.gwas_support = row.context_gwas_support;
                    if (row.context_functional_support != null) meta.functional_support = row.context_functional_support;
                    if (row.context_category != null) meta.category = row.context_category;
                    if (row.context_factor_relevance != null) meta.factor_relevance = row.context_factor_relevance;
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
         * Phenotype / Factor / Pathway (gene set) nodes are unchanged.
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
            const row = (flattened || []).find(
                (r) => String(r.predicate || "").trim() === "contains_gene" && String(r.object || "").trim() === String(geneSymbol || "").trim()
            );
            if (!row) return { combined: null, gwas: null, functional: null };
            const num = (v) => (v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : null);
            return {
                combined: num(row.context_combined_score),
                gwas: num(row.context_gwas_support),
                functional: num(row.context_functional_support),
            };
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
                    withScores.sort((a, b) => (b.scores?.combined ?? -Infinity) - (a.scores?.combined ?? -Infinity));
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
                    const { relevant_phenotypes, relevant_factors, relevant_gene_sets } = this.extractRelevantFactorsAndGeneSetsFromFlattened(
                        flattened,
                        h.supporting_row_ids
                    );
                    out.relevant_phenotypes = relevant_phenotypes;
                    out.relevant_factors = relevant_factors;
                    out.relevant_gene_sets = relevant_gene_sets;
                    out.gene_connections = this.extractGeneConnectionsFromFlattened(flattened, h.supporting_row_ids);
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
                return out;
            });
        },
        /**
         * Serialize factorData into a compact JSON summary for the LLM prompt (phenotypes, factors, gene counts, pathway names, gene set descriptions).
         */
        serializeFactorDataForPrompt(factorData) {
            const summary = {};
            Object.keys(factorData || {}).forEach((phenotype) => {
                const p = factorData[phenotype];
                if (!p) return;
                const factors = (p.factors || []).map((f) => ({
                    label: f.label,
                    factor: f.factor,
                    top_gene_sets: f.top_gene_sets,
                    gene_set_description: f.gene_set_description != null ? String(f.gene_set_description) : "",
                    gene_count: Object.keys(f.genes || {}).length,
                    pathway_names: Object.keys(f.geneSets || {}),
                }));
                summary[phenotype] = {
                    gene_count: Object.keys(p.genes || {}).length,
                    factors,
                };
            });
            return JSON.stringify(summary, null, 2);
        },
        /**
         * Transforms the merged Phenotype-Factor-Gene-Pathway data into a Knowledge Graph (triples).
         * @param {Object} mergedData - factorData: { [phenotype]: { genes: {}, factors: [] } }
         * @returns {Array} - Triples { subject, predicate, object, context }
         */
        transformMergedDataToKG(mergedData, factorsKey) {
            const triples = [];

            Object.keys(mergedData || {}).forEach((phenotypeName) => {
                const pData = mergedData[phenotypeName];
                if (!pData || !Array.isArray(pData[factorsKey])) return;

                pData[factorsKey].forEach((factorObj) => {
                    const factorLabel = factorObj.label;

                    triples.push({
                        subject: phenotypeName,
                        predicate: "associated_with",
                        object: factorLabel,
                        context: {
                            type: "PhenotypeToFactor",
                            original_factor_id: factorObj.factor,
                        },
                    });

                    const geneSets = (typeof factorObj.top_gene_sets === "string" && factorObj.top_gene_sets)
                        ? factorObj.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                        : [];

                    geneSets.forEach((gsName) => {
                        triples.push({
                            subject: factorLabel,
                            predicate: "linked_to_pathway",
                            object: gsName,
                            context: { type: "FactorToPathway" },
                        });
                    });

                    const factorGenes = factorObj.genes || {};
                    const genesInFactor = Object.keys(factorGenes)
                        .map((gName) => ({
                            name: gName,
                            relevance: factorGenes[gName] && factorGenes[gName].factorRelevance != null
                                ? factorGenes[gName].factorRelevance
                                : 0,
                        }))
                        .sort((a, b) => Math.abs(b.relevance) - Math.abs(a.relevance));

                    const globalGenes = pData.genes || {};

                    genesInFactor.forEach((gene) => {
                        const globalGeneStats = globalGenes[gene.name] || {};
                        const gwasSupport = globalGeneStats.gwasSupport;
                        const geneSetSupport = globalGeneStats.geneSetSupport;
                        const category = (gwasSupport != null && geneSetSupport != null && gwasSupport > geneSetSupport)
                            ? "Genetic (Established)"
                            : "Functional (Novel)";

                        triples.push({
                            subject: factorLabel,
                            predicate: "contains_gene",
                            object: gene.name,
                            context: {
                                type: "FactorToGene",
                                factor_relevance: gene.relevance,
                                combined_score: globalGeneStats.combined,
                                gwas_support: gwasSupport,
                                functional_support: geneSetSupport,
                                category,
                            },
                        });

                        const factorGeneSets = factorObj.geneSets || {};
                        let geneLinkedToSomePathway = false;
                        geneSets.forEach((gsName) => {
                            const members = factorGeneSets[gsName] && Array.isArray(factorGeneSets[gsName].genes)
                                ? factorGeneSets[gsName].genes
                                : [];
                            if (!members.includes(gene.name)) return;
                            geneLinkedToSomePathway = true;
                            triples.push({
                                subject: gene.name,
                                predicate: "contributes_to_pathway",
                                object: gsName,
                                context: { type: "GeneToPathway", context_factor: factorLabel },
                            });
                        });
                        /**
                         * Ensure each gene under a factor has at least one pathway/gene-set edge in the KG so
                         * Factor–GeneSet–Gene linkage exists for the LLM (linked_to_pathway + contributes_to_pathway).
                         * Uses the first top gene set when membership lists omit the gene (API / threshold mismatch).
                         */
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
                            triples.push({
                                subject: gene.name,
                                predicate: "contributes_to_pathway",
                                object: fallbackGs,
                                context: {
                                    type: "GeneToPathway",
                                    context_factor: factorLabel,
                                    linkage_fallback: true,
                                },
                            });
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
.query-sample {
    cursor: pointer;
}
.query-sample:hover {
    background: #dee2e6;
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
    font-size: 0.85em;
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

</style>
