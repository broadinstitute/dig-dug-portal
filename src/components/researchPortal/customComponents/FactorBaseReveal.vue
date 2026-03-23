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
                                                <div v-if="step.id === '1' && substep.id === '1.1' && stepApprovalGateActive && stepApprovalGateStepId === '1'">
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
                                                            ></textarea>
                                                            <input
                                                                v-else
                                                                type="text"
                                                                class="form-control form-control-sm"
                                                                v-model="row.item.term"
                                                                placeholder="Comma-separated terms"
                                                            />
                                                        </template>
                                                    </b-table>
                                                </div>
                                                <div v-if="step.id === '8' && substep.id === '8.1' && semanticGroupsForApproval && semanticGroupsForApproval.length">
                                                    <div class="table-responsive">
                                                        <table class="table table-sm table-striped table-bordered mb-2">
                                                            <thead class="thead-light">
                                                                <tr>
                                                                    <th style="width:70px;" class="text-center">Select</th>
                                                                    <th style="width:180px;">Group</th>
                                                                    <th>Phenotype-Gene set cluster</th>
                                                                    <th style="width:280px;">Rationale</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr v-for="group in semanticGroupsForApprovalRows" :key="group.key">
                                                                    <td class="text-center align-middle">
                                                                        <input
                                                                            type="checkbox"
                                                                            :checked="isSemanticGroupSelected(group.key)"
                                                                            @change="setSemanticGroupSelected(group.key, $event.target.checked)"
                                                                        />
                                                                    </td>
                                                                    <td class="align-middle">{{ group.group_name }}</td>
                                                                    <td class="align-middle">
                                                                        <div v-for="pair in group.associated_pairs" :key="`${group.key}-${pair.phenotype}-${pair.factor}`">
                                                                            <span>{{ pair.phenotype }} - {{ pair.factor }}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td class="align-middle">{{ group.grouping_rationale }}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div v-if="selectedSemanticGroupCount === 0" class="small text-danger mb-2">
                                                        Select at least one group to continue.
                                                    </div>
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
                                                :disabled="step.id === '8' && selectedSemanticGroupCount === 0"
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
                            <div
                                v-if="selectionDiffersFromFiltered"
                                class="mb-3 d-flex align-items-center"
                                style="gap:15px;"
                            >
                                <div class="font-weight-bold" style="color: #000000; font-size: 1.2em;">
                                    Regroup the selected gene set clusters?
                                </div>
                                <button
                                    class="btn btn-cfde"
                                    style="min-width: 120px;"
                                    :disabled="regroupingSelectedPairs"
                                    @click="regroupSelectedGeneSetClusters"
                                >
                                    <b-spinner v-if="regroupingSelectedPairs" small class="mr-1"></b-spinner>
                                    <span>{{ regroupingSelectedPairs ? 'Regrouping…' : 'Regroup' }}</span>
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
                                        <span class="pill" v-for="f in factorLabelsList" :key="f">{{ f }}</span>
                                    </div>
                                </div>
                                <span class="small text-muted">{{ display_phenotypes_factors ? 'show less' : 'show more' }}</span>
                            </div>
                            -->
                            <div :class="{ collapsed: !display_phenotypes_factors }" class="criteria-detail">
                            <div class="mt-2">
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
                                                                <div class="small text-muted mb-2">Gene Sets in cluster (top 5)</div>
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
                                                                    <template #cell(geneset)="row">
                                                                        <div class="truncate-cell" :title="row.item.geneset" style="max-width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                                            {{ row.item.geneset }}
                                                                        </div>
                                                                    </template>
                                                                    <template #cell(actions)="row">
                                                                        <button
                                                                            v-if="row.item.program === 'gtex'"
                                                                            class="btn btn-sm btn-outline-primary"
                                                                            @click="onGeneSetRowToggled(row)"
                                                                        >
                                                                            {{ row.detailsShowing ? 'Hide' : 'Show' }}
                                                                        </button>
                                                                    </template>  
                                                                    <template #row-details="row">
                                                                        <div style="padding: 10px;">
                                                                            <!--
                                                                            <a role="button" @click="getProvenance(row.item.geneset, row.item.program)">info</a>
                                                                            <pre>{{ gene_set_sources[row.item.geneset] }}</pre>
                                                                            -->
                                                                            <div v-if="gene_set_sources[row.item.geneset]">
                                                                                <b-card>
                                                                                    <a :href="gene_set_sources[row.item.geneset].geneSetUrl" target="_blank">{{ gene_set_sources[row.item.geneset].geneSet }}</a>

                                                                                    <ul>
                                                                                        <li v-for="(rel, i) in gene_set_sources[row.item.geneset].relations" :key="i" class="text-muted small">
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
                                                        <div class="small text-muted mb-2">Gene Sets in cluster (top 5)</div>
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
                                                            <template #cell(geneset)="row">
                                                                <div class="truncate-cell" :title="row.item.geneset" style="max-width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                                    {{ row.item.geneset }}
                                                                </div>
                                                            </template>
                                                            <template #cell(actions)="row">
                                                                <button
                                                                    v-if="row.item.program === 'gtex'"
                                                                    class="btn btn-sm btn-outline-primary"
                                                                    @click="onGeneSetRowToggled(row)"
                                                                >
                                                                    {{ row.detailsShowing ? 'Hide' : 'Show' }}
                                                                </button>
                                                            </template>  
                                                            <template #row-details="row">
                                                                <div style="padding: 10px;">
                                                                    <!--
                                                                    <a role="button" @click="getProvenance(row.item.geneset, row.item.program)">info</a>
                                                                    <pre>{{ gene_set_sources[row.item.geneset] }}</pre>
                                                                    -->
                                                                    <div v-if="gene_set_sources[row.item.geneset]">
                                                                        <b-card>
                                                                            <a :href="gene_set_sources[row.item.geneset].geneSetUrl" target="_blank">{{ gene_set_sources[row.item.geneset].geneSet }}</a>

                                                                            <ul>
                                                                                <li v-for="(rel, i) in gene_set_sources[row.item.geneset].relations" :key="i" class="text-muted small">
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
                                <div class="mt-4">
                                    <factor-base-reveal-heatmap
                                        ref="factorBaseRevealHeatmap"
                                        :factor-data="factorData"
                                        :factor-data-table-rows="factorDataTableRowsFiltered"
                                        :phenotype-description-by-id="phenotypeDescriptionById"
                                        height="500px"
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
                                                                <div v-for="phenotype in getRelevantPhenotypesDisplay(mechanism.relevant_phenotypes)" 
                                                                    class="small pill" :style="`background:${NODE_COLORS.Phenotype}; color:white`">
                                                                    {{ phenotype }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-if="(mechanism.relevant_factors && mechanism.relevant_factors.length)" class="mb-2">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-1">Relevant gene set clusters</div>
                                                            <div style="display:flex; flex-direction: column; gap:3px">
                                                                <div v-for="factor in mechanism.relevant_factors" class="small pill" 
                                                                    :style="`background:${NODE_COLORS.Factor}; color:white`">
                                                                    {{ factor }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-if="(mechanism.relevant_gene_sets && mechanism.relevant_gene_sets.length)" class="mb-2">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-1">Relevant gene sets</div>
                                                            <div class="small" style="white-space: normal; display:flex; flex-direction: column; gap:3px">
                                                                <div v-for="set in formatRelevantGeneSetsForDisplay(mechanism.relevant_gene_sets)">
                                                                    <div style="display:flex; gap:10px; justify-content: space-between; align-items: center;">
                                                                        <div class="pill" style="overflow: clip; text-overflow: ellipsis; max-width: 300px; word-wrap: normal;" :style="`background:${NODE_COLORS.Pathway}; color:white`" :title="set.desc">{{ set.gs }}</div>
                                                                        <div class="pill">{{ set.program }}</div>
                                                                    </div>
                                                                    <!--<div>{{ set.desc }}</div>-->
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        v-if="remainingSemanticGroupRows && remainingSemanticGroupRows.length"
                                        class="remaining-gene-clusters mt-4 pt-3 border-top"
                                    >
                                        <div class="font-weight-bold mb-2" style="color: #FF6600; font-size: 1.2em;">
                                            Remaining gene set cluster groups
                                        </div>
                                        <p class="text-muted small mb-3">
                                            These context-relevant semantic groups were identified but not selected for mechanistic hypothesis generation.
                                        </p>
                                        <div v-if="remainingGroupGenerateError" class="alert alert-danger small mb-3" role="alert">
                                            {{ remainingGroupGenerateError }}
                                        </div>
                                        <div class="table-responsive">
                                            <table class="table table-sm table-striped table-bordered mb-0">
                                                <thead class="thead-light">
                                                    <tr>
                                                        <th style="width:220px;">Group</th>
                                                        <th>Phenotype-Gene set cluster</th>
                                                        <th style="width:280px;">Rationale</th>
                                                        <th style="width:130px;">Hypothesis</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="(group, idx) in remainingSemanticGroupRows" :key="'rem-group-' + idx">
                                                        <td class="align-middle">
                                                            {{ group.group_name || `Group ${idx + 1}` }}
                                                        </td>
                                                        <td class="align-middle">
                                                            <div v-for="(pair, pidx) in (group.associated_pairs || [])" :key="'rem-pair-' + idx + '-' + pidx">
                                                                {{ pair.phenotype }} - {{ pair.factor }}
                                                            </div>
                                                        </td>
                                                        <td class="align-middle">
                                                            {{ group.grouping_rationale || '' }}
                                                        </td>
                                                        <td class="text-center align-middle">
                                                            <button
                                                                type="button"
                                                                class="btn btn-sm btn-cfde"
                                                                :disabled="generatingRemainingGroupKey === getRemainingGroupKey(group, idx)"
                                                                @click="generateHypothesisForRemainingGroup(group, idx)"
                                                            >
                                                                <b-spinner
                                                                    v-if="generatingRemainingGroupKey === getRemainingGroupKey(group, idx)"
                                                                    small
                                                                    class="mr-1"
                                                                ></b-spinner>
                                                                <template v-if="generatingRemainingGroupKey === getRemainingGroupKey(group, idx)">
                                                                    Generating… {{ formatRemainingGenerateElapsed() }}
                                                                </template>
                                                                <template v-else>Generate</template>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <!-- Remaining: included pairs not in any context-relevant semantic group, or grouped but not cited in mechanism evidence -->
                                    <div
                                        v-if="remainingGeneSetClusterRows.length"
                                        class="remaining-gene-clusters mt-5 pt-4 border-top"
                                    >
                                        <div class="font-weight-bold mb-2" style="color: #FF6600; font-size: 1.2em;">
                                            Remaining gene set clusters
                                        </div>
                                        <p class="text-muted small mb-3">
                                            These phenotype–gene set cluster pairs were <strong>included</strong> in your data selection but are listed here because they were
                                            <strong>not</strong> placed in any context-relevant semantic group, <strong>or</strong> they appear in a group but lack a matching Phenotype–Factor link in any hypothesis’s supporting evidence above.
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
                                                                                <div class="small text-muted mb-2">Gene Sets in cluster (top 5)</div>
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
                                                                                        <div class="truncate-cell" :title="gRow.item.geneset" style="max-width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                                                            {{ gRow.item.geneset }}
                                                                                        </div>
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
                                                                        <div class="small text-muted mb-2">Gene Sets in cluster (top 5)</div>
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
                                                                                <div class="truncate-cell" :title="gRow.item.geneset" style="max-width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                                                    {{ gRow.item.geneset }}
                                                                                </div>
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

        <!-- Incremental hypotheses: remind user more groups are still running (fixed to viewport) -->
        <div
            v-if="showMechanismHypothesisStreamBubble"
            class="mechanism-hypothesis-stream-bubble"
            role="status"
            aria-live="polite"
        >
            <div class="mechanism-hypothesis-stream-bubble__inner">
                <div class="mechanism-hypothesis-stream-bubble__title-row">
                    <span class="mechanism-hypothesis-stream-bubble__pulse" aria-hidden="true"></span>
                    <span class="mechanism-hypothesis-stream-bubble__title">Generating mechanistic hypotheses</span>
                </div>
                <p class="mechanism-hypothesis-stream-bubble__text">
                    Additional semantic groups are still being processed. You can keep reviewing results above.
                </p>
                <div v-if="mechanismHypothesisActiveGroupName" class="mechanism-hypothesis-stream-bubble__current">
                    <span class="mechanism-hypothesis-stream-bubble__current-label">Now:</span>
                    <strong>{{ mechanismHypothesisActiveGroupName }}</strong>
                </div>
                <div class="mechanism-hypothesis-stream-bubble__progress">
                    {{ mechanismHypothesisStreamDone }} of {{ mechanismHypothesisStreamTotal }} groups complete
                </div>
                <div class="mechanism-hypothesis-stream-bubble__elapsed">
                    Elapsed: {{ formatMechanismHypothesisStreamElapsed() }}
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
            loading_search_criteria: false,
            error_search_criteria: false,
            error_msg_search_criteria: "",
            allow_retry: true,
            searchTerm: "",
            lastPhenotypeTerms: [],
            lastMechanismTerms: [],
            /** Map phenotype id -> description for display; queries still use id. */
            phenotypeDescriptionById: {},
            matchedPhenotype: null,
            searchApis: {
                //phenotypes: "https://search.hugeamp.org/api/search/pgvector/phenotypes?q=$searchTerm&similarity_threshold=0.5",
                phenotypes: "https://search.hugeamp.org/api/search/pgvector/phenotypes-with-factors?q=$searchTerm",
                factors: "https://search.hugeamp.org/api/search/pgvector/factors?q=$searchTerm",
                phenotypeFactors: "https://search.hugeamp.org/api/search/pgvector/factors-and-phenotypes?q=$searchTerm&similarity_threshold=0.3&top_k=30",
                factor: "https://cfde-bi.hugeamp.org/api/bio/query/pigean-factor?limit=1000&q=$phenotype,cfde",
                phenotypeGeneSetFactor: "https://cfde-bi.hugeamp.org/api/bio/query/pigean-gene-set-factor?q=$phenotype,cfde,$factor",
                factorGenes: "https://cfde-bi.hugeamp.org/api/bio/query/pigean-gene-factor?q=$phenotype,cfde,$factor",
                pigeanJoinedGeneSets: "https://cfde-bi.hugeamp.org/api/bio/query/pigean-joined-gene-set?q=$phenotype,$geneSet,cfde",
            },
            factorData: {},
            /** Association path only: all associations from API (e.g. first 30) for table display; factorData still holds only top 10 selected. */
            associationPathTableData: [],
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
            /** Groups rendered in step-8 approval table; checkbox selection controls generation set. */
            semanticGroupsForApproval: [],
            semanticGroupSelectionByKey: {},
            /** Groups user left unchecked at step-8 review; shown as remaining grouped clusters. */
            remainingSemanticGroupRows: [],
            generatingRemainingGroupKey: "",
            remainingGroupGenerateError: "",
            /** While incremental hypotheses run: total groups, completed count, current LLM group label (top-right bubble). */
            mechanismHypothesisStreamTotal: 0,
            mechanismHypothesisStreamDone: 0,
            mechanismHypothesisActiveGroupName: "",
            /** Elapsed timer for multi-group hypothesis generation (bubble). */
            mechanismHypothesisStreamStartedAt: null,
            mechanismHypothesisStreamNow: Date.now(),
            mechanismHypothesisStreamTimerId: null,
            display_mechanisms: true,
            /** Row keys (phenotype|factor) for pairs user generated via "Generate" in Remaining section; removes row from that table. */
            adHocCoveredRowKeys: [],
            /**
             * After semantic grouping LLM: normalized keys `${phenotype}|${collapseWsLower(factorLabel)}` for pairs placed in at least one group.
             * null = grouping not completed this run (use mechanism-only remaining logic). [] = all pairs left ungrouped.
             */
            semanticGroupedPairKeys: null,
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
            regroupingSelectedPairs: false,
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
Deconstruct biological research queries into structured keywords for high-precision semantic search. Focus on extracting terms explicitly present in the text.

### JSON Schema
Return ONLY a JSON object:
{
  "phenotype_terms": ["Targeted list of explicit clinical diagnoses or systemic traits. Max 3."],
  "mechanism_terms": ["Targeted list of biological processes, pathways, or experimental assays. Max 3."],
  "search_type": "phenotypes | mechanisms | both",
  "research_context": "A concise (10-15 word) synthesis of the research intent."
}

### Extraction Logic & Constraints
1. **Strict Lexical Fidelity**: Extract ONLY terms explicitly mentioned or synonymous with specific words in the query. DO NOT infer high-level disease states (e.g., do not turn 'neurons' into 'neurodegeneration').
2. **Phenotype Definition**: Use 'phenotype_terms' ONLY for recognized clinical diagnoses, macro-level traits, or systemic disease states (e.g., "Alzheimer's disease", "Diabetes", "Obesity"). 
   - **CRITICAL**: Localized biological processes and molecular states (e.g., "inflammation", "signaling", "remodeling", "generation", "cell death") are ALWAYS 'mechanism_terms', even if they describe a pathological state of a tissue.
3. **Null Safety**: If a query contains only a phenotype or only a mechanism, the other list MUST be empty []. 
4. **Search Type Logic**: 
   - 'phenotypes': Query focuses strictly on a clinical disease or macro trait.
   - 'mechanisms': Query focuses on a pathway, gene function, cell type, assay, or localized process (e.g., inflammation).
   - 'both': Query explicitly links a biological process/assay to a specific clinical diagnosis.
5. **Exclusions**: Do not include "study", "data", "mouse", "human", or software names.
6. **Biological Guardrail**: If the query is unrelated to biology/medicine, return: {"error": "Query unrelated to biological research."}

### Example 1 (Mechanism Only)
Input: "adipose inflammation"
Output: {
  "phenotype_terms": [],
  "mechanism_terms": ["adipose inflammation", "inflammation", "adipose tissue"],
  "search_type": "mechanisms",
  "research_context": "Investigating inflammatory processes and signaling within adipose tissue environments."
}

### Example 2 (Both)
Input: "Mapping the effects of APOE4 on amyloid clearance in Alzheimer's patients"
Output: {
  "phenotype_terms": ["Alzheimer's disease"],
  "mechanism_terms": ["amyloid clearance", "APOE4", "proteostasis"],
  "search_type": "both",
  "research_context": "Investigating how the APOE4 variant impacts amyloid beta processing in Alzheimer's disease."
}`,

factorFilteringPrompt:`You are an expert bioinformatics data filter. 

You will be given:
1. A **Research Context** describing a biological problem.
2. A list of **Phenotype-to-Factor associations** in JSON format.

Your task:
1. Filter: Identify which Factors associated with each Phenotype are mechanistically relevant to the Research Context.
2. Selection: When multiple Factors are semantically similar or redundant (e.g., 'Lipid Transport' vs 'Lipid Metabolism'), you MUST select only ONE representative Factor from the provided list to represent that cluster.

---
## Strict Constraints
- USE ONLY ORIGINAL NAMES: You are forbidden from creating new category names or high-level summaries. Every string in 'relevant_factors' MUST be an exact match from the input list.
- Eliminate Redundancy: For overlapping concepts (e.g., several different 'Glucose' or 'Insulin' factors), pick the single most comprehensive Factor name present in the data.
- Return ONLY a JSON object.
- Group the selected Factors by their respective Phenotypes.

---
## Output Format (Strict JSON)
{
  "selected_associations": [
    {
      "phenotype": "Phenotype Name",
      "relevant_factors": ["Original Factor Name A", "Original Factor Name B"],
      "rationale": "Brief reason why these exact factor was chosen for this phenotype (mechanistic relevance to the research context)."
    }
  ]
}

---
## Guidelines
- Include a short "rationale" (1–2 sentences) for each phenotype explaining why the selected factors are relevant to the research context.
- Do not fabricate Factors. If the original list says 'Hormone Regulation Processes', use that; do not change it to 'Hormonal Signaling'.
- If a Phenotype has no relevant Factors for the context, omit it from the array.
- No preamble, no markdown blocks, no explanation.`,

phenotypeFactorsFilteringPrompt: `You are a bioinformatics data filter. You will be given:
1. A **Research Context** (e.g., disease mechanism, molecular pathway of interest).
2. **Phenotype–factor associations in CSV format** with columns: id, factor_label, phenotype, top_gene_sets, gene_set_description, score.

Your task: (1) Filter to only associations that are mechanistically relevant to the Research Context. (2) Sort the selected list by relevance (most relevant first). Use factor_label, phenotype, top_gene_sets, and gene_set_description when judging relevance. The gene_set_description column describes what the gene sets are about (use it to understand relevance when gene set ids are opaque).

---
## Constraints
- Return ONLY a single JSON object. No markdown code fences, no preamble, no explanation.
- Preserve the exact "id" for each selected item (from the CSV id column) so the client can map back.
- Order the "selected" array by relevance: first item = most relevant.
- You MUST return at least one item when the input has rows and any is plausibly related to the context.

---
## Output Format (strict JSON)
{
  "selected": [
    { "id": "EXACT_ID_FROM_INPUT", "rationale": "Brief reason why this association was selected and its relevance level." }
  ]
}

---
## Guidelines
- Include a short "rationale" for each selected item. Use only ids from the input CSV.
- Sort by relevance: put the most relevant association first, then the next, and so on.
- No preamble, no markdown blocks, no explanation.`,

mechanismGroupingSystemPrompt: `
You are an expert in bioinformatics. You will be given a Knowledge Graph (KG) as CSV rows (each row has a unique numeric 'id') plus a factor summary and **research context**.

### Task (grouping only)
**Semantic grouping:** Using the **research context**, decide which Phenotype–Factor (gene set cluster) pairs from \`associated_with\` rows (subject = phenotype id, object = factor / gene-set cluster label) **belong together** mechanistically. Form groups that share pathways, overlapping \`contains_gene\` evidence, related gene sets (\`linked_to_pathway\`, \`contributes_to_pathway\`), or coherent physiology **relevant to the research context**.

### Rules
1. **Research context first:** Only group pairs that are **plausibly tied to the stated research context**. Pairs that are weakly related or irrelevant to the context should be **omitted** from every group (they will be listed separately for the user as “remaining”).
2. **No forced coverage:** You do **not** need to assign every \`associated_with\` pair to a group. Omit pairs that do not fit any coherent, context-relevant cluster.
3. **No duplicate pairs:** The same (phenotype, factor) pair must appear in **at most one** group. Use the **exact** phenotype and factor strings from the CSV (subject and object columns).
4. **Thematic clustering:** Merge pairs that share mechanism **and** context relevance; prefer fewer, meaningful groups over many tiny ones.
5. **Names:** \`group_name\` is a short mechanistic theme label (you may invent it).
6. **Empty groups array:** If **no** pairs are strongly supported by the research context, return \`"groups": []\`.
7. **No hypotheses:** Do not write mechanistic hypotheses or gene lists here — only grouping.

### Output (strict JSON)
Return ONLY:
{
  "groups": [
    {
      "group_name": "Short mechanistic theme for this cluster",
      "associated_pairs": [
        { "phenotype": "Exact phenotype string from KG", "factor": "Exact factor label from KG" }
      ],
      "grouping_rationale": "One or two sentences on why these pairs belong together for this research context."
    }
  ]
}

No markdown fences, no preamble.
`,

mechanismHypothesisSystemPrompt: `
You are an expert in bioinformatics. Each request gives you **one fixed semantic group** of Phenotype–Factor (gene set cluster) pairs (do not change membership), plus (2) the KG as CSV with row \`id\`s, (3) factor summary JSON, and (4) research context.

### Task
Produce **exactly one** mechanistic hypothesis for that group. Return \`hypotheses\` as an array of **length 1** (only \`hypotheses[0]\`).

### Discovery logic (per group)
1. **Modifier rule:** Each hypothesis MUST relate a well-known gene (when present in the KG for that group) with at least one 'Functional (Novel)' category gene from the data where possible.
2. **Gene sets:** Explicitly connect factors in that group to the gene sets (pathways) in the KG (\`linked_to_pathway\`, \`contributes_to_pathway\`).
3. **Support priority:** Prefer genes with combined_score context in the data; prioritize strong functional signal where appropriate.
4. **Data fidelity:** Use only labels and categories present in the KG CSV.

### Output (strict JSON)
Return ONLY:
{
  "hypotheses": [
    {
      "group_name": "Headline (may refine the input group_name)",
      "associated_pairs": [ { "phenotype": "...", "factor": "..." } ],
      "hypothesis": "2–3 sentences.",
      "novelty": "Contrast canonical vs non-canonical emphasis.",
      "genes": [
        { "gene": "SYMBOL", "group": "High GWAS | High Functional | Balanced", "role": "Brief bridge role." }
      ],
      "supporting_row_ids": [0, 1, 2]
    }
  ]
}

The \`hypotheses\` array MUST contain exactly **one** element for the single group provided.

(Do NOT return 'scores' in genes; scores are filled by the system.)

### Guidelines
- **associated_pairs:** Must match the corresponding input group's \`associated_pairs\` exactly (same pairs; order may match).
- **Row referencing (Phenotype–Factor):** \`supporting_row_ids\` must include every \`associated_with\` row id for each pair in that hypothesis's group.
- **Row referencing (gene sets / pathways — mandatory):** Include all \`linked_to_pathway\` rows for factors in the group and all \`contributes_to_pathway\` rows for each listed gene that appear in the KG for that story; do not omit pathway rows.
- **Gene limits:** At least 5 high-impact candidate genes per hypothesis where the KG provides enough genes; otherwise as many as are strongly supported.
- **Sorting:** Order \`genes\` by impact (higher combined_score first when inferable from context).
`,
        };
    },
    computed: {
        factorDataTableRows() {
            if (this.associationPathTableData && this.associationPathTableData.length > 0) {
                return this.associationPathTableData.map((r) => {
                    const rowKey = this.getRowKey(r);
                    const included = Object.prototype.hasOwnProperty.call(this.pairSelectionOverrides, rowKey)
                        ? !!this.pairSelectionOverrides[rowKey]
                        : !!r.included;
                    return {
                        ...r,
                        included,
                        _rowKey: rowKey,
                        _showDetails: !!this.expandedFactorRowKeys[rowKey],
                    };
                });
            }
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
         * Set of normalized pair keys the semantic-grouping LLM placed in at least one group.
         * `null` if grouping has not finished this run; empty Set after `groups: []`.
         */
        semanticGroupedPairKeySet() {
            const arr = this.semanticGroupedPairKeys;
            if (arr == null) return null;
            return new Set(arr);
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
        /**
         * Included rows that are either (a) not placed in any semantic group for the research context, or
         * (b) placed in a group but not cited in any mechanism’s supporting evidence (or covered by ad-hoc generate).
         */
        remainingGeneSetClusterRows() {
            const mechKeys = this.mechanismResultPhenotypeFactorPairKeys;
            const semSet = this.semanticGroupedPairKeySet;
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
                if (semSet === null) {
                    return !mechCovers;
                }
                const inSemanticGroup =
                    semSet.has(`${p}|${this.collapseWsLower(fl)}`) ||
                    semSet.has(`${p}|${this.collapseWsLower(fid)}`);
                if (!inSemanticGroup) return true;
                return !mechCovers;
            });
        },
        remainingFactorDataTableRowsWithRationaleMeta() {
            const remKeys = new Set((this.remainingGeneSetClusterRows || []).map((r) => this.getRowKey(r)));
            return (this.factorDataTableRowsWithRationaleMeta || []).filter((r) => remKeys.has(this.getRowKey(r)));
        },
        /** Fixed top-right bubble: first card visible but more groups still generating. */
        showMechanismHypothesisStreamBubble() {
            const t = this.mechanismHypothesisStreamTotal;
            const d = this.mechanismHypothesisStreamDone;
            return t > 1 && d >= 1 && d < t;
        },
        semanticGroupsForApprovalRows() {
            return (this.semanticGroupsForApproval || []).map((g, idx) => ({
                key: this.semanticGroupApprovalKey(g, idx),
                group_name:
                    g && g.group_name != null && String(g.group_name).trim() !== ""
                        ? String(g.group_name).trim()
                        : `Group ${idx + 1}`,
                associated_pairs: Array.isArray(g && g.associated_pairs) ? g.associated_pairs : [],
                grouping_rationale:
                    g && g.grouping_rationale != null && String(g.grouping_rationale).trim() !== ""
                        ? String(g.grouping_rationale).trim()
                        : "",
            }));
        },
        selectedSemanticGroupCount() {
            return this.semanticGroupsForApprovalRows.filter((g) => !!this.semanticGroupSelectionByKey[g.key]).length;
        },
    },
    created() {
        this.llmExtract = createLLMClient({
            llm: "openai",
            model: "gpt-5-nano",
            system_prompt: this.extractSystemPropmpt
        });

        this.llmMechanismGrouping = createLLMClient({
            llm: "openai",
            model: "gpt-5-mini",
            system_prompt: this.mechanismGroupingSystemPrompt,
        });

        this.llmAnalyze = createLLMClient({
            llm: "openai",
            model: "gpt-5-mini",
            system_prompt: this.mechanismHypothesisSystemPrompt,
        });

        this.llmFilter = createLLMClient({
            llm: "openai",
            model: "gpt-5-nano",
            system_prompt: this.factorFilteringPrompt
        });

        this.llmPhenotypeFactorsFilter = createLLMClient({
            llm: "openai",
            model: "gpt-5-nano",
            system_prompt: this.phenotypeFactorsFilteringPrompt
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
        this.stopMechanismHypothesisStreamTimer();
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
        startMechanismHypothesisStreamTimer() {
            this.stopMechanismHypothesisStreamTimer();
            this.mechanismHypothesisStreamStartedAt = Date.now();
            this.mechanismHypothesisStreamNow = Date.now();
            this.mechanismHypothesisStreamTimerId = setInterval(() => {
                this.mechanismHypothesisStreamNow = Date.now();
            }, 250);
        },
        stopMechanismHypothesisStreamTimer() {
            if (this.mechanismHypothesisStreamTimerId != null) {
                clearInterval(this.mechanismHypothesisStreamTimerId);
                this.mechanismHypothesisStreamTimerId = null;
            }
            this.mechanismHypothesisStreamStartedAt = null;
        },
        /** Elapsed time for multi-group mechanistic hypothesis run (bubble). */
        formatMechanismHypothesisStreamElapsed() {
            if (this.mechanismHypothesisStreamStartedAt == null) return "";
            const ms = Math.max(0, (this.mechanismHypothesisStreamNow || Date.now()) - this.mechanismHypothesisStreamStartedAt);
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}m${String(seconds).padStart(2, "0")}s`;
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
        semanticGroupApprovalKey(group, idx) {
            const name = group && group.group_name != null ? String(group.group_name).trim() : "";
            return `${idx}|${name}`;
        },
        prepareSemanticGroupApproval(groups) {
            const safeGroups = Array.isArray(groups) ? JSON.parse(JSON.stringify(groups)) : [];
            const selection = {};
            safeGroups.forEach((g, idx) => {
                selection[this.semanticGroupApprovalKey(g, idx)] = true;
            });
            this.semanticGroupsForApproval = safeGroups;
            this.semanticGroupSelectionByKey = selection;
        },
        isSemanticGroupSelected(key) {
            return !!this.semanticGroupSelectionByKey[key];
        },
        setSemanticGroupSelected(key, selected) {
            this.$set(this.semanticGroupSelectionByKey, key, !!selected);
        },
        getSelectedSemanticGroupsForApproval() {
            return (this.semanticGroupsForApproval || [])
                .filter((g, idx) => !!this.semanticGroupSelectionByKey[this.semanticGroupApprovalKey(g, idx)])
                .map((g) => JSON.parse(JSON.stringify(g)));
        },
        getUnselectedSemanticGroupsForApproval() {
            return (this.semanticGroupsForApproval || [])
                .filter((g, idx) => !this.semanticGroupSelectionByKey[this.semanticGroupApprovalKey(g, idx)])
                .map((g) => JSON.parse(JSON.stringify(g)));
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
        async regroupSelectedGeneSetClusters() {
            if (this.regroupingSelectedPairs) return;
            this.regroupingSelectedPairs = true;
            try {
                const selectedRows = (this.factorDataTableRows || []).filter((r) => !!r.included);
                if (!selectedRows.length) return;
                for (const row of selectedRows) {
                    const genesLoaded = this.getGenesForFactor(row.phenotype, row.factor).length > 0;
                    const geneSetsLoaded = this.getGenesetForFactor(row.phenotype, row.factor).length > 0;
                    if (!genesLoaded || !geneSetsLoaded) {
                        await this.loadGenesForOneFactor(row.phenotype, row.factor, row);
                    }
                }
                const selectedFactorData = this.buildSelectedFactorDataFromRows(selectedRows);
                const phenotypes = Object.keys(selectedFactorData || {});
                if (!phenotypes.length) return;
                this.factorData = JSON.parse(JSON.stringify(selectedFactorData));
                this.normalizeHeatmapSelectionAfterRegroup();
                this.snapshotFilteredSelectionBaseline();
                this.mechanisms = null;
                this.mechanisms_summary = null;
                this.semanticGroupedPairKeys = null;
                this.error_mechanisms = false;
                this.error_msg_mechanisms = "";
                this.stepApprovalGateActive = false;
                this.stepApprovalGateStepId = "";
                this.stepApprovalGateMessage = "";
                this.stepApprovalGateResolver = null;
                this.loadComplete = false;
                this.steps = (this.steps || []).filter(
                    (s) => s && s.id !== "8" && s.id !== "8.2" && s.id !== "9" && s.type !== "error"
                );
                this.showTab = "process";
                this.setLoadStatus("Semantic groupings…");
                this.setStep({
                    id: "8",
                    title: "LLM: Semantic groupings of phenotype–gene set cluster pairs",
                });
                const kgTriples = this.transformMergedDataToKG(selectedFactorData, "factors");
                this.lastKgTriples = kgTriples;
                this.requestMechanismHypotheses(selectedFactorData, kgTriples);
            } finally {
                this.regroupingSelectedPairs = false;
            }
        },
        approveStepGate() {
            if (!this.stepApprovalGateActive) return;
            if (this.stepApprovalGateStepId === "8" && this.selectedSemanticGroupCount === 0) return;
            const gateStepId = this.stepApprovalGateStepId;
            if (this.stepApprovalGateStepId === "1") {
                this.applySearchCriteriaGateEdits();
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
        /** Return human-readable phenotype for display; use phenotype id for queries. */
        getPhenotypeDisplay(phenotypeId) {
            if (phenotypeId == null) return "";
            const desc = this.phenotypeDescriptionById && this.phenotypeDescriptionById[phenotypeId];
            return desc != null && desc !== "" ? String(desc) : String(phenotypeId);
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
        /**
         * Normalized keys `${phenotype}|${collapseWsLower(factor label)}` for pairs the grouping LLM assigned to groups.
         * @param {Array<{ associated_pairs?: Array<{phenotype,factor}> }>} groups
         * @returns {string[]}
         */
        buildSemanticGroupedPairKeysFromGroups(groups) {
            const out = [];
            const seen = new Set();
            (groups || []).forEach((g) => {
                (g.associated_pairs || []).forEach((p) => {
                    const phen = p.phenotype != null ? String(p.phenotype).trim() : "";
                    const fac = p.factor != null ? String(p.factor).trim() : "";
                    if (!phen || !fac) return;
                    const k = `${phen}|${this.collapseWsLower(fac)}`;
                    if (seen.has(k)) return;
                    seen.add(k);
                    out.push(k);
                });
            });
            return out;
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
         * Load genes for a single (phenotype, factor) on demand (e.g. when user expands an unselected factor row).
         * Finds the factor in allFactors or factors and populates its genes and phenotype.genes.
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
                if (!factorItem.top_gene_sets || String(factorItem.top_gene_sets).trim() === "") {
                    try {
                        const { top_gene_sets, gene_set_description, gene_set_program } =
                            await this.fetchGeneSetsForPhenotypeFactor(phenotype, factorItem.factor);
                        factorItem.top_gene_sets = top_gene_sets;
                        this.$set(factorItem, "gene_set_description", gene_set_description);
                        this.$set(factorItem, "gene_set_program", gene_set_program);
                    } catch (err) {
                        console.warn(`FactorBaseReveal: phenotypeGeneSetFactor failed for ${phenotype}/${factorItem.factor}`, err);
                    }
                }
                if (factorItem.genes && Object.keys(factorItem.genes).length > 0) return;
                const topGeneSetsStr = factorItem.top_gene_sets;
                const geneSetIds = (typeof topGeneSetsStr === "string" && topGeneSetsStr)
                    ? topGeneSetsStr.split(";").map((s) => s.trim()).filter(Boolean)
                    : [];
                for (const geneSet of geneSetIds) {
                    try {
                        const raw = await this.querySearchApi("pigeanJoinedGeneSets", { phenotype, geneSet });
                        const rows = raw && Array.isArray(raw.data) ? raw.data : [];
                        const geneList = [];
                        for (const row of rows) {
                            const gene = row.gene;
                            if (gene == null || gene === "") continue;
                            const combined = parseFloat(row.combined);
                            if (row.combined != null && !isNaN(combined) && combined < 3) continue;
                            geneList.push(gene);
                            if (this.factorData[phenotype].genes[gene] == null) {
                                this.$set(this.factorData[phenotype].genes, gene, {
                                    combined: row.combined,
                                    gwasSupport: row.log_bf,
                                    geneSetSupport: row.prior,
                                });
                            }
                            const factorVal = row.factor_value ?? row.relevance_to_factor ?? row.relevance;
                            const numVal = factorVal != null && factorVal !== "" && !isNaN(Number(factorVal))
                                ? Number(factorVal)
                                : (factorVal != null && factorVal !== "" ? factorVal : 1);
                            this.$set(factorItem.genes, gene, { factorRelevance: numVal, factor_value: numVal });
                        }
                        this.$set(factorItem.geneSets, geneSet, { genes: geneList });
                    } catch (err) {
                        console.warn(`FactorBaseReveal: pigeanJoinedGeneSets failed for ${phenotype}/${geneSet}`, err);
                    }
                }
                try {
                    const raw = await this.querySearchApi("factorGenes", { phenotype, factor: factorItem.factor });
                    const rows = raw && Array.isArray(raw.data) ? raw.data : [];
                    for (const row of rows) {
                        const gene = row.gene;
                        if (gene == null || !factorItem.genes || factorItem.genes[gene] == null) continue;
                        const fv = row.factor_value;
                        const numVal = fv != null && fv !== "" && !isNaN(Number(fv)) ? Number(fv) : fv;
                        if (numVal != null) {
                            this.$set(factorItem.genes[gene], "factor_value", numVal);
                            this.$set(factorItem.genes[gene], "factorRelevance", numVal);
                        }
                    }
                } catch (err) {
                    console.warn(`FactorBaseReveal: factorGenes failed for ${phenotype}/${factorItem.factor}`, err);
                }
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
            this.semanticGroupedPairKeys = null;
            this.stepApprovalGateActive = false;
            this.stepApprovalGateStepId = "";
            this.stepApprovalGateMessage = "";
            this.stepApprovalGateResolver = null;
            this.semanticGroupsForApproval = [];
            this.semanticGroupSelectionByKey = {};
            this.remainingSemanticGroupRows = [];
            this.generatingRemainingGroupKey = "";
            this.remainingGroupGenerateError = "";
            this.searchCriteriaEditRows = [];
            this.searchCriteriaEditRowsDefault = [];
            this.pairSelectionOverrides = {};
            this.llmFilteredPairKeysBaseline = [];
            this.regroupingSelectedPairs = false;
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
        /**
         * Phenotype path: when extraction has phenotype_terms. Resolve phenotypes → load factors → hydrate gene sets → filter factors by context → load genes & mechanisms.
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
                console.log("FactorBaseReveal: No phenotype terms, skipping phenotype search and factor load.");
                return;
            }
            try {
                this.setLoadStatus("Searching for similar phenotypes…");
                this.setStep({
                    id: "2",
                    title: "API: Searching for similar phenotypes"
                });

                this.genesAndFactorValuesLoaded = false;
                this.factorData = {};
                this.associationPathTableData = [];
                this.matchedPhenotype = null;
                this.lastKgTriples = [];
                this.mechanisms = null;
                this.semanticGroupedPairKeys = null;
                this.phenotypeDescriptionById = {};
                const phenotypeIdsToLoad = [];
                let firstMatched = null;
                //loop through each phenotype search term
                let idx = 0;
                for (let t = 0; t < phenotypeTerms.length; t++) {
                    const searchTerm = phenotypeTerms[t];
                    this.setLoadStatus(`Searching for similar phenotypes (${t + 1}/${phenotypeTerms.length}: ${searchTerm})…`);
                    //this.setLoadStep("API: Searching for similar phenotypes", `${t + 1}/${phenotypeTerms.length}: ${searchTerm}`);
                    this.setStep({
                        id: "2",
                        substep: {
                            id: `2.1.${idx}`,
                            title: `${searchTerm}`
                        }
                    })
                    
                    const phenoRes = await this.querySearchApi("phenotypes", { searchTerm });
                    console.log('raw phenotype search results', phenoRes);
                    const rawList = phenoRes.results || phenoRes.data || [];
                    const list = rawList.filter((item) => item.phenotype != null && (item.portal == null || item.portal !== "kp"));
                    console.log('filtered phenotype search results', list);
                    this.setStep({
                        id: "2",
                        substep: {
                            id: `2.1.${idx}`,
                            result: {
                                title: `Retrieved phenotypes with semantic similatiry to "${searchTerm}"`,
                                result: list
                            }
                        }
                    })
                    if (!list.length) {
                        console.warn("FactorBaseReveal: No items for term:", searchTerm);
                        continue;
                    }
                    //get factors for phenotype, lock in phenotype with hihest similarity score if it has factors
                    let chosen = null;
                    //this.setLoadStep("API: Searching for similar phenotypes", `Selecting phenotype with highest similarity score that has factors`);
                    this.setStep({
                        id: "2",
                        substep: {
                            id: `2.2.${idx}`,
                            title: `Selecting phenotype with highest similarity score for ${searchTerm}`
                        }
                    })
                    for (const item of list) {
                        
                        const phenotypeId = item.phenotype;
                        console.log("FactorBaseReveal: Trying phenotype:", phenotypeId);
                        try {
                            //TODO: this ran twice with only 1 phenotype in list, why?
                            const factorRes = await this.querySearchApi("factor", { phenotype: phenotypeId });
                            const data = factorRes && Array.isArray(factorRes.data) ? factorRes.data : [];
                            if (data.length > 0) {
                                chosen = item;
                                console.log("FactorBaseReveal: Using phenotype with factor data", "phenotype:", phenotypeId);
                                break;
                            }
                        } catch (err) {
                            console.warn("FactorBaseReveal: Factor API failed for phenotype", phenotypeId, err);
                        }
                    }
                    if (chosen && chosen.phenotype != null) {
                        if (!phenotypeIdsToLoad.includes(chosen.phenotype)) {
                            phenotypeIdsToLoad.push(chosen.phenotype);
                        }
                        this.setStep({
                            id: "2",
                            substep: {
                                id: `2.2.${idx}`,
                                result: {
                                    title: `Selected phenotype with highest similarity score for ${searchTerm}`,
                                    result: chosen.phenotype
                                }
                            }
                        })
                        this.$set(this.phenotypeDescriptionById, chosen.phenotype, (chosen.phenotype_name != null && chosen.phenotype_name !== "") ? chosen.phenotype_name : chosen.phenotype);
                        if (!firstMatched) firstMatched = chosen;
                    } else {
                        console.warn("FactorBaseReveal: No phenotype with factor data for term:", searchTerm, list.map((i) => ({ phenotype: i.phenotype })));
                    }
                    idx++;
                }
                if (!phenotypeIdsToLoad.length) {
                    this.setLoadStatus("No phenotype with factor data found for any term.", true);
                    this.loadComplete = true;
                    console.warn("FactorBaseReveal: No phenotype had factor data across all terms.", phenotypeTerms);
                    return;
                }
                this.matchedPhenotype = firstMatched != null ? { id: firstMatched.phenotype } : null;
                console.log('phenotypeIdsToLoad', phenotypeIdsToLoad);
                this.setStep({
                    id: "2",
                    substep: {
                        id: `2.3`,
                        title: "Phenotypes selected for further analysis.",
                        result: {
                            result: phenotypeIdsToLoad
                        }
                    }
                })
                await this.loadFactorDataForPhenotypes(phenotypeIdsToLoad);
            } catch (err) {
                console.warn("FactorBaseReveal: Phenotype search or factor load failed", err);
                this.setLoadStatus("Error: " + (err && err.message ? err.message : "search failed"), true);
                this.setStep({
                    type: "error",
                    title: "Phenotype search or factor load failed"
                })
                this.loadComplete = true;
            }
        },
        /**
         * Association path: when we have only mechanism_terms. phenotypeFactors API → hydrate gene sets for first N associations → LLM filter → top 10 → load genes & mechanisms.
         */
        async onResearchPhenotypeFactorsOnly() {
            const mechanismTerms = this.lastMechanismTerms && this.lastMechanismTerms.length
                ? this.lastMechanismTerms
                : (this.searchCriteria && this.searchCriteria[0] && this.searchCriteria[0].values)
                    ? this.searchCriteria[0].values.filter((v) => v && String(v) !== "(none extracted)")
                    : [];
            if (mechanismTerms.length === 0) {
                console.log("FactorBaseReveal: No mechanism terms, skipping association path.");
                return;
            }
            try {
                this.setLoadStatus("Fetching phenotype–factor associations…");
                this.setStep({
                    id: "2",
                    title: "API: Searching for phenotype–gene set cluster associations"
                })
                this.genesAndFactorValuesLoaded = false;
                this.factorData = {};
                this.associationPathTableData = [];
                this.matchedPhenotype = null;
                this.lastKgTriples = [];
                this.mechanisms = null;
                this.semanticGroupedPairKeys = null;
                this.phenotypeDescriptionById = {};

                const searchTerm = [...mechanismTerms, ...this.lastPhenotypeTerms].join(" ");
                const raw = await this.querySearchApi("phenotypeFactors", { searchTerm });
                const rawList = Array.isArray(raw) ? raw : (raw && (raw.data || raw.results)) ? (raw.data || raw.results) : [];
                const maxAssociationsToHydrate = 30;
                const listForHydration = rawList.slice(0, maxAssociationsToHydrate);
                this.setStep({
                    id: "2",
                    substep: {
                        id: "2.1",
                        title: searchTerm,
                        result: {
                            title: `Received ${rawList.length} associations, reduced to ${maxAssociationsToHydrate}`,
                            result: listForHydration
                        }
                    }
                })
                this.setLoadStatus("Fetching gene sets (phenotypeGeneSetFactor)…");
                this.setStep({
                    id: "3",
                    title: "API: Fetching gene sets for associations"
                })
                let idx = 0;
                for (const row of listForHydration) {
                    if (row.phenotype == null || row.factor == null) continue;
                    this.setStep({
                        id: "3",
                        substep: {
                            id: `3.1.${idx}`,
                            title: `${row.phenotype} / ${row.label}`
                        }
                    })
                    const { top_gene_sets, gene_set_description, gene_set_program } = await this.fetchGeneSetsForPhenotypeFactor(row.phenotype, row.factor);
                    row.top_gene_sets = top_gene_sets;
                    row.gene_set_description = gene_set_description;
                    row.gene_set_program = gene_set_program;
                    this.setStep({
                        id: "3",
                        substep: {
                            id: `3.1.${idx}`,
                            result: {
                                title: `Received top 5 gene sets for ${row.label} of ${row.phenotype}`,
                                result: {
                                    top_gene_sets,
                                    gene_set_description,
                                    gene_set_program
                                }
                            }
                        }
                    })
                    idx++;
                }
                const originalById = {};
                const collected = listForHydration.map((row) => {
                    const id = row.id;
                    if (id != null && row.phenotype != null && row.factor != null) {
                        originalById[id] = {
                            phenotype: row.phenotype,
                            factor: row.factor,
                            top_gene_sets: row.top_gene_sets,
                            gene_set_description: row.gene_set_description,
                            gene_set_program: row.gene_set_program,
                            label: row.label,
                        };
                    }
                    return {
                        id,
                        factor_label: row.label != null ? String(row.label) : "",
                        phenotype: row.phenotype != null ? String(row.phenotype) : "",
                        top_gene_sets: row.top_gene_sets != null ? String(row.top_gene_sets) : "",
                        gene_set_description: row.gene_set_description != null ? String(row.gene_set_description) : "",
                        score: row.score != null ? Number(row.score) : "",
                    };
                }).filter((o) => o.id != null);

                if (collected.length === 0) {
                    this.setLoadStatus("No phenotype–factor associations returned.", true);
                    this.setStep({
                        type: "error",
                        title: "No phenotype–factor associations returned."
                    })
                    this.loadComplete = true;
                    return;
                }

                const researchContext = (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values != null)
                    ? String(this.searchCriteria[1].values)
                    : "";
                this.setLoadStatus("Filtering by research context (CSV)…");
                this.setStep({
                    id: "4",
                    title: "LLM: Filtering gene set clusters by relevance to user query"
                })
                const csvString = this.flattenToCsv(collected, ["id", "factor_label", "phenotype", "top_gene_sets", "gene_set_description", "score"]);
                let selected = await this.filterPhenotypeFactorsByContext(csvString, researchContext);
                selected = selected.slice(0, 10);
                console.log('f-selected', selected);
                if (selected.length === 0) {
                    this.setLoadStatus("No associations selected for research context.", true);
                    this.setStep({
                        type: "error",
                        title: "No associations selected for research context."
                    })
                    this.loadComplete = true;
                    return;
                }
                this.setStep({
                    id: "4",
                    substep: {
                        id: `4.1`,
                        title: `Selecting factors for further analysis.`,
                        result: {
                            title: `Selected factors for further analysis.`,
                            result: selected
                        }
                    }
                })

                const seen = new Set();
                for (const item of selected) {
                    const orig = originalById[item.id];
                    if (!orig || orig.phenotype == null || orig.factor == null) continue;
                    const phenotype = String(orig.phenotype).trim();
                    const factor = String(orig.factor).trim();
                    const key = `${phenotype}|${factor}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    if (!this.factorData[phenotype]) {
                        this.$set(this.factorData, phenotype, { genes: {}, factors: [] });
                    }
                    const factors = this.factorData[phenotype].factors;
                    if (factors.some((f) => String(f.factor) === factor)) continue;
                    factors.push({
                        factor,
                        label: (orig.label != null && orig.label !== "") ? String(orig.label) : factor,
                        top_gene_sets: orig.top_gene_sets != null ? String(orig.top_gene_sets) : "",
                        gene_set_description: (orig.gene_set_description != null && String(orig.gene_set_description) !== "") ? String(orig.gene_set_description) : "",
                        gene_set_program: (orig.gene_set_program != null && String(orig.gene_set_program) !== "") ? String(orig.gene_set_program) : "",
                        genes: {},
                        geneSets: {},
                        selectionRationale: (item.rationale != null && String(item.rationale) !== "") ? String(item.rationale) : "",
                    });
                }
                const selectedIds = new Set(selected.map((s) => s.id));
                const selectedRationaleById = {};
                selected.forEach((s) => { selectedRationaleById[s.id] = (s.rationale != null && String(s.rationale) !== "") ? String(s.rationale) : ""; });
                this.associationPathTableData = listForHydration.map((row) => {
                    const orig = originalById[row.id];
                    if (!orig || orig.phenotype == null || orig.factor == null) {
                        return null;
                    }
                    const phenotype = String(orig.phenotype).trim();
                    const factor = String(orig.factor).trim();
                    const topGeneSetsStr = orig.top_gene_sets;
                    const topGeneSetsDisplay = (typeof topGeneSetsStr === "string" && topGeneSetsStr)
                        ? topGeneSetsStr.split(";").map((s) => s.trim()).filter(Boolean).join(", ")
                        : "";
                    const included = selectedIds.has(String(row.id));
                    const rationale = selectedRationaleById[row.id] != null ? selectedRationaleById[row.id] : "";
                    return {
                        phenotype,
                        factor,
                        factorLabel: (orig.label != null && orig.label !== "") ? String(orig.label) : factor,
                        top_gene_sets: topGeneSetsDisplay,
                        rationale,
                        isFiltered: included,
                        included,
                    };
                }).filter(Boolean);
                this.associationPathTableData.sort((a, b) => {
                    if (a.included !== b.included) return b.included ? 1 : -1;
                    return (a.phenotype || "").localeCompare(b.phenotype || "");
                });
                this.snapshotFilteredSelectionBaseline();

                const phenotypes = Object.keys(this.factorData).filter((p) => (this.factorData[p].factors || []).length > 0);
                if (phenotypes.length === 0) {
                    this.setLoadStatus("No phenotype–factor data to load.", true);
                    this.setStep({
                        type: "error",
                        title: "No phenotype–factor data to load."
                    })
                    this.loadComplete = true;
                    return;
                }
                this.matchedPhenotype = { id: phenotypes[0] };
                await this.loadGenesForFactorData(phenotypes);
            } catch (err) {
                console.warn("FactorBaseReveal: phenotypeFactors-only workflow failed", err);
                this.setLoadStatus("Error: " + (err && err.message ? err.message : "workflow failed"), true);
                this.setStep({
                    type: "error",
                    title: "Workflow failed"
                })
                this.loadComplete = true;
            }
        },
        /**
         * Flatten an array of objects to CSV (header row + data rows). Escapes fields containing comma or quote.
         * @param {Array<Object>} rows - e.g. [{ id, factor_label, phenotype, top_gene_sets, gene_set_description, score }, ...]
         * @param {string[]} columns - column keys in order
         * @returns {string}
         */
        flattenToCsv(rows, columns = ["id", "factor_label", "phenotype", "top_gene_sets", "gene_set_description", "score"]) {
            if (!Array.isArray(rows) || rows.length === 0) return columns.join(",");
            const escape = (val) => {
                const s = val != null ? String(val) : "";
                if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
                return s;
            };
            const header = columns.join(",");
            const dataRows = rows.map((row) => columns.map((col) => escape(row[col])).join(","));
            return [header, ...dataRows].join("\n");
        },
        /**
         * Filter phenotype–factor associations (provided as CSV string) by research context; LLM returns selected ids sorted by relevance.
         * Returns a Promise that resolves to an array of { id, rationale }, most relevant first (take first 10 in caller).
         */
        filterPhenotypeFactorsByContext(csvString, researchContext) {
            const userPrompt = `**Research Context:**\n${researchContext || "(none)"}\n\n**Phenotype–factor associations (CSV with columns: id, factor_label, phenotype, top_gene_sets, gene_set_description, score):**\n${csvString}\n\nUse factor_label, phenotype, top_gene_sets, and gene_set_description to judge relevance. The gene_set_description column explains what each gene set is about (gene set ids alone may not be meaningful). Filter to only associations relevant to the research context. Sort the selected list by relevance (most relevant first). Return ONLY a JSON object with a "selected" array; each element must have "id" (exact value from the CSV id column) and "rationale". Order the array by relevance (first = most relevant).`;
            return new Promise((resolve) => {
                this.llmPhenotypeFactorsFilter.sendPrompt({
                    userPrompt,
                    onResponse: (response) => {
                        const json = this.parseLLMResponse(response);
                        const selected = json && Array.isArray(json.selected) ? json.selected : [];
                        const out = selected.filter((item) => item && item.id != null).map((item) => ({
                            id: String(item.id),
                            rationale: (item.rationale != null && String(item.rationale).trim() !== "") ? String(item.rationale).trim() : "",
                        }));
                        resolve(out);
                    },
                    onError: (err) => {
                        console.warn("FactorBaseReveal: phenotypeFactors filter LLM error", err);
                        this.setStep({
                            type: 'error',
                            title: "Request failed or timed out.",
                        })
                        resolve([]);
                    },
                    onEnd: () => {},
                });
            });
        },
        /**
         * Step 11: Load genes (pigeanJoinedGeneSets), factor values (factorGenes), build KG, request mechanistic hypotheses.
         * Assumes this.factorData is already populated for the given phenotypes with factors (each having top_gene_sets, genes, geneSets).
         * @param {string[]} phenotypes - list of phenotype ids in factorData
         */
        async loadGenesForFactorData(phenotypes) {
            const list = phenotypes && phenotypes.length ? phenotypes : Object.keys(this.factorData || {});
            if (!list.length) return;

            this.setLoadStatus("Loading factor values (factor_value)…");
            //this.setLoadStep("API: Getting gene loadings for factors")
            this.setStep({
                id: "6",
                title: "API: Getting gene loadings for gene set clusters"
            })
            let idx = 0;
            for (const phenotype of list) {
                const factors = this.factorData[phenotype] && this.factorData[phenotype].factors || [];
                for (const factorItem of factors) {
                    this.setLoadStatus(`Loading factor values (${phenotype})…`);
                    //this.setLoadStep("API: Getting gene loadings for factors", `${phenotype} / ${factorItem.label}`);
                    this.setStep({
                        id: "6",
                        substep: {
                            id: `6.1.${idx}`,
                            title: `${phenotype} / ${factorItem.label}`
                        }
                    })
                    try {
                        const raw = await this.querySearchApi("factorGenes", {
                            phenotype,
                            factor: factorItem.factor,
                        });
                        const rows = raw && Array.isArray(raw.data) ? raw.data : [];
                        for (const row of rows) {
                            const gene = row.gene;
                            if (gene == null || !factorItem.genes || factorItem.genes[gene] == null) continue;
                            const fv = row.factor_value;
                            const numVal = fv != null && fv !== "" && !isNaN(Number(fv)) ? Number(fv) : fv;
                            if (numVal != null) {
                                this.$set(factorItem.genes[gene], "factor_value", numVal);
                                this.$set(factorItem.genes[gene], "factorRelevance", numVal);
                            }
                        }
                        this.setStep({
                            id: "6",
                            substep: {
                                id: `6.1.${idx}`,
                                result: {
                                    title: `Retrieved gene loadings for "${factorItem.label}" of "${phenotype}"`,
                                    result: rows
                                }
                            }
                        })
                    } catch (err) {
                        console.warn(`FactorBaseReveal: factorGenes API failed for ${phenotype}/${factorItem.factor}`, err);
                    }
                    idx++;
                }
            }

            this.setLoadStatus("Loading genes (from gene sets in top_gene_sets)…");
            //this.setLoadStep("API: Getting gene memberships for gene sets")
            this.setStep({
                id: "7",
                title: "API: Getting gene memberships for gene sets"
            })
            idx = 0;
            for (const phenotype of list) {
                const factors = this.factorData[phenotype] && this.factorData[phenotype].factors || [];
                for (const factorItem of factors) {
                    const topGeneSetsStr = factorItem.top_gene_sets;
                    const geneSetIds = (typeof topGeneSetsStr === "string" && topGeneSetsStr)
                        ? topGeneSetsStr.split(";").map((s) => s.trim()).filter(Boolean)
                        : [];
                    // TODO: factors can share gene sets; dedupe fetches if needed.
                    for (const geneSet of geneSetIds) {
                        this.setLoadStatus(`Loading genes (${phenotype})…`);
                        //this.setLoadStep("API: Getting gene memberships for gene sets", `${phenotype} / ${factorItem.label} / ${geneSet}`)
                        this.setStep({
                            id: "7",
                            substep: {
                                id: `7.1.${idx}`,
                                title: `${phenotype} / ${factorItem.label} / ${geneSet}`
                            }
                        })
                        try {
                            const raw = await this.querySearchApi("pigeanJoinedGeneSets", {
                                phenotype,
                                geneSet,
                            });
                            const rows = raw && Array.isArray(raw.data) ? raw.data : [];
                            const geneList = [];
                            const geneListFull = [];
                            for (const row of rows) {
                                const gene = row.gene;
                                if (gene == null || gene === "") continue;
                                const combined = parseFloat(row.combined);
                                // filter out genes with a combined score < 3
                                if (row.combined != null && !isNaN(combined) && combined < 3) continue;
                                geneList.push(gene);
                                geneListFull.push(row);
                                if (this.factorData[phenotype].genes[gene] == null) {
                                    this.$set(this.factorData[phenotype].genes, gene, {
                                        combined: row.combined,
                                        gwasSupport: row.log_bf,
                                        geneSetSupport: row.prior,
                                    });
                                }
                                if (factorItem.genes != null) {
                                    const factorVal = row.factor_value ?? row.relevance_to_factor ?? row.relevance;
                                    const numVal = factorVal != null && factorVal !== "" && !isNaN(Number(factorVal))
                                        ? Number(factorVal)
                                        : (factorVal != null && factorVal !== "" ? factorVal : 1);
                                    this.$set(factorItem.genes, gene, {
                                        factorRelevance: numVal,
                                        factor_value: numVal,
                                    });
                                }
                            }
                            if (factorItem.geneSets != null) {
                                this.$set(factorItem.geneSets, geneSet, { genes: geneList });
                            }
                            this.setStep({
                                id: "7",
                                substep: {
                                    id: `7.1.${idx}`,
                                    result: {
                                        title: `Retrieved genes and gene memberships for "${geneSet}" of "${phenotype}"`,
                                        result: structuredClone(geneListFull)
                                    }
                                }
                            })
                        } catch (err) {
                            console.warn(`FactorBaseReveal: pigeanJoinedGeneSets API failed for ${phenotype}/${geneSet}`, err);
                        }
                        idx++;
                    }
                }
            }

            /* TEMP */
            /*
            const allKgTriples = this.transformMergedDataToKG(this.factorData, 'allFactors');
            const allFlattened = this.flattenKGData(allKgTriples);
            const allRowIds = allFlattened.map(obj => obj.id);
            const supporting_network = this.buildNetworkFromFlattenedRowIds(allFlattened, allRowIds);
            this.all_supporting_network = supporting_network;
            */
            //console.log('TEMP allFlattened', allFlattened);
            /* END */

            this.genesAndFactorValuesLoaded = true;
            console.log("FactorBaseReveal: processed factorData", this.factorData);
            this.setLoadStatus("Converting to knowledge graph…");
            const kgTriples = this.transformMergedDataToKG(this.factorData, 'factors');
            console.log("FactorBaseReveal: KG triples", kgTriples);
            this.lastKgTriples = kgTriples;
            this.setLoadStatus("Semantic groupings…");
            this.setStep({
                id: "8",
                title: "LLM: Semantic groupings of phenotype–gene set cluster pairs",
            });
            this.requestMechanismHypotheses(this.factorData, kgTriples);
        },
        /**
         * Build factorData (factors, genes, geneSets) and KG triples for the given phenotype ids.
         * @param {string[]} phenotypeIds - e.g. ["Obesity"] from phenotype search first result id
         */
        async loadFactorDataForPhenotypes(phenotypeIds) {
            const phenotypes = phenotypeIds && phenotypeIds.length ? phenotypeIds : [];
            if (!phenotypes.length) return;
            for (const phenotype of phenotypes) {
                this.$set(this.factorData, phenotype, { genes: {}, factors: [] });
            }
            this.setLoadStatus("Loading factors…");
            //this.setLoadStep("API: Loading factors")
            this.setStep({
                id: "3",
                title: "API: Loading gene set clusters"
            })
            let idx = 0;
            for (const phenotype of phenotypes) {
                this.setLoadStatus(`Loading factors (${phenotype})…`);
                //this.setLoadStep("API: Loading factors", phenotype)
                this.setStep({
                    id: "3",
                    substep: {
                        id: `3.1.${idx}`,
                        title: phenotype
                    }
                })
                try {
                    const raw = await this.querySearchApi("factor", { phenotype });
                    this.setStep({
                        id: "3",
                        substep: {
                            id: `3.1.${idx}`,
                            result: {
                                title: `Retrieved factors for "${phenotype}"`,
                                result: raw.data
                            }
                        }
                    })
                    const normalized = this.normalizeFactorData(raw);
                    this.factorData[phenotype].factors = normalized;
                    this.$set(this.factorData[phenotype], "allFactors", [...normalized]);
                } catch (err) {
                    console.warn(`FactorBaseReveal: factor API failed for ${phenotype}`, err);
                }
                idx++;
            }

            this.setLoadStatus("Fetching gene sets (phenotypeGeneSetFactor)…");
            //this.setLoadStep("API: Fetching gene sets for factors");
            this.setStep({
                id: "4",
                title: "API: Fetching gene sets for gene set clusters"
            })
            idx = 0;
            for (const phenotype of phenotypes) {
                const factors = this.factorData[phenotype].factors || [];
                for (const factorItem of factors) {
                    this.setLoadStatus(`Fetching gene sets (${phenotype} / ${factorItem.factor})…`);
                    //this.setLoadStep("API: Fetching gene sets for factors", `${phenotype} / ${factorItem.label}`);
                    this.setStep({
                        id: "4",
                        substep:{
                            id: `4.1.${idx}`,
                            title: `${phenotype} / ${factorItem.label}`
                        }
                    })
                    const { top_gene_sets, gene_set_description, gene_set_program } = await this.fetchGeneSetsForPhenotypeFactor(phenotype, factorItem.factor);
                    this.setStep({
                        id: "4",
                        substep:{
                            id: `4.1.${idx}`,
                            result: {
                                title: `Retrieved top 5 gene sets for "${factorItem.label}" of "${phenotype}"`,
                                result: {
                                    top_gene_sets,
                                    gene_set_description,
                                    gene_set_program
                                }
                            }
                        }
                    })
                    factorItem.top_gene_sets = top_gene_sets;
                    this.$set(factorItem, "gene_set_description", gene_set_description);
                    this.$set(factorItem, "gene_set_program", gene_set_program);
                    idx++;
                }
            }

            this.setLoadStatus("Filtering gene set clusters…");
            this.setStep({
                id: "5",
                title: "LLM: Filtering gene set clusters by relevance to user query"
            })

            await this.filterFactorsByContext(phenotypes);

            const filteredPhenotypes = phenotypes.filter(
                (p) => (this.factorData[p] && this.factorData[p].factors || []).length > 0
            );
            if (filteredPhenotypes.length === 0) {
                this.setLoadStatus("No factors selected after filtering.", true);
                this.setStep({
                    type: "error",
                    title: "No factors selected after filtering."
                });
                this.loadComplete = true;
                return;
            }

            this.snapshotFilteredSelectionBaseline();
            await this.loadGenesForFactorData(filteredPhenotypes);
        },
        /**
         * Normalize strings for loose matching (case, whitespace).
         */
        collapseWsLower(s) {
            return String(s || "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, " ");
        },
        /**
         * Map LLM-returned phenotype string to factorData key (API id vs. display / paraphrase).
         */
        resolveLlmPhenotypeToFactorDataKey(llmPhenotype, dataKeys) {
            const s = String(llmPhenotype || "").trim();
            if (!s) return null;
            if (dataKeys.includes(s)) return s;
            const lower = s.toLowerCase();
            let k = dataKeys.find((x) => String(x).toLowerCase() === lower);
            if (k) return k;
            k = dataKeys.find((x) => {
                const disp = this.phenotypeDescriptionById[x];
                return disp && String(disp).trim().toLowerCase() === lower;
            });
            if (k) return k;
            k = dataKeys.find(
                (x) =>
                    String(x).toLowerCase().includes(lower) ||
                    lower.includes(String(x).toLowerCase())
            );
            return k || null;
        },
        /**
         * True if factor id/label matches any LLM-selected factor string (exact, case-insensitive, normalized, long-substring).
         */
        factorMatchesLlmAllowedSet(f, allowedRawSet) {
            if (!allowedRawSet || allowedRawSet.size === 0) return false;
            const idStr = String(f.factor);
            const labelStr = f.label != null ? String(f.label).trim() : "";
            const numId = Number(f.factor);
            const factorQueryVal = this.getFactorQueryValue(f.factor);
            for (const a of allowedRawSet) {
                const raw = String(a).trim();
                if (!raw) continue;
                if (idStr === raw || labelStr === raw) return true;
                if (factorQueryVal && (factorQueryVal === raw || factorQueryVal.toLowerCase() === raw.toLowerCase())) {
                    return true;
                }
                if (!isNaN(numId) && String(numId) === raw) return true;
                if (String(idStr).toLowerCase() === raw.toLowerCase()) return true;
                if (labelStr && labelStr.toLowerCase() === raw.toLowerCase()) return true;
                const na = this.collapseWsLower(raw);
                const nl = this.collapseWsLower(labelStr);
                if (na && nl && na === nl) return true;
                if (na.length >= 12 && nl.length >= 12 && (na.includes(nl) || nl.includes(na))) return true;
            }
            return false;
        },
        /**
         * Step 2: Filter factors by research context using factorFilteringPrompt.
         * Calls llmFilter with context + factor-phenotype list; keeps only factors whose ID is in the returned list.
         */
        filterFactorsByContext(phenotypes) {
            const researchContext =
                (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                    ? String(this.searchCriteria[1].values)
                    : "";
            const associations = [];
            phenotypes.forEach((phenotype) => {
                (this.factorData[phenotype].factors || []).forEach((f) => {
                    associations.push({
                        phenotype,
                        factor_id: f.factor,
                        label: f.label,
                        top_gene_sets: f.top_gene_sets,
                        gene_set_description: f.gene_set_description,
                    });
                });
            });
            if (associations.length === 0) return Promise.resolve();

            console.log('factorData', this.factorData)
            console.log('phenotypes', phenotypes)
            console.log('associations', associations)

            const userPrompt = `**Research Context:**\n${researchContext}\n\n**Phenotype-to-Factor associations (each may include top_gene_sets and gene_set_description):**\n${JSON.stringify(associations, null, 2)}\n\nUse top_gene_sets and gene_set_description (along with phenotype and factor label) to judge how relevant each association is to the research context. Filter to only associations relevant to the research context. Sort the selected associations by relevance (most relevant first). Within each phenotype, order the \"relevant_factors\" array by relevance (most relevant factor first). Return ONLY a JSON object with a \"selected_associations\" array: each element has \"phenotype\", \"relevant_factors\" (array of factor labels or factor_id values to keep, ordered by relevance), and \"rationale\" (brief reason why these factors were chosen). Use only factors from the input.\n\n**CRITICAL:** For each object, the \"phenotype\" string MUST be copied exactly from the \"phenotype\" field in the associations JSON above (same spelling and casing). For \"relevant_factors\", copy factor labels or factor_id values exactly from the input.`;

            return new Promise((resolve, reject) => {
                this.llmFilter.sendPrompt({
                    userPrompt,
                    onResponse: (response) => {
                        const json = this.parseLLMResponse(response);
                        console.log('LLM Factor filtering', json);

                        const allowedByPhenotype = {};
                        const rationaleByPhenotype = {};
                        const selected = json && Array.isArray(json.selected_associations) ? json.selected_associations : [];
                        selected.forEach((item) => {
                            const llmPhenotype = item.phenotype != null ? String(item.phenotype).trim() : "";
                            if (!llmPhenotype) return;
                            const dataKey = this.resolveLlmPhenotypeToFactorDataKey(llmPhenotype, phenotypes);
                            if (!dataKey) {
                                console.warn(
                                    "FactorBaseReveal: LLM phenotype did not match any factorData key; skipping row.",
                                    llmPhenotype,
                                    phenotypes
                                );
                                return;
                            }
                            const set = new Set();
                            const arr = item.relevant_factors;
                            if (Array.isArray(arr)) {
                                arr.forEach((v) => set.add(String(v).trim()));
                            }
                            if (item.rationale != null && String(item.rationale).trim() !== "") {
                                rationaleByPhenotype[dataKey] = String(item.rationale).trim();
                            }
                            if (set.size > 0) {
                                if (!allowedByPhenotype[dataKey]) allowedByPhenotype[dataKey] = new Set();
                                set.forEach((v) => allowedByPhenotype[dataKey].add(v));
                            }
                        });
                        if (Object.values(allowedByPhenotype).every((s) => !s || s.size === 0)) {
                            console.warn("FactorBaseReveal: factor filter returned no selected_associations; keeping all factors.");
                            resolve();
                            return;
                        }
                        this.setStep({
                            id: "5",
                            substep: {
                                id: "5.1",
                                title: "Selected factors for further analysis.",
                                result: {
                                    result: selected
                                }
                            }
                        })

                        phenotypes.forEach((phenotype) => {
                            const factors = this.factorData[phenotype].factors || [];
                            const allowed = allowedByPhenotype[phenotype];
                            if (rationaleByPhenotype[phenotype] != null) {
                                this.$set(this.factorData[phenotype], "filterRationale", rationaleByPhenotype[phenotype]);
                            }
                            // Strict filtering: when LLM does not select a phenotype, exclude all its factors.
                            if (!allowed || allowed.size === 0) {
                                this.factorData[phenotype].factors = [];
                                return;
                            }
                            this.factorData[phenotype].factors = factors.filter((f) =>
                                this.factorMatchesLlmAllowedSet(f, allowed)
                            );
                        });
                        console.log("FactorBaseReveal: filtered factors by context (per phenotype)", allowedByPhenotype);
                        resolve();
                    },
                    onError: (err) => {
                        console.warn("FactorBaseReveal: factor filter LLM error", err);
                        this.setStep({
                            type: 'error',
                            title: "Request failed or timed out.",
                        })
                        resolve();
                    },
                    onEnd: () => {
                        resolve();
                    },
                });
            });
        },
        retryMechanismHypotheses() {
            this.error_mechanisms = false;
            this.error_msg_mechanisms = "";
            this.setLoadStatus("Semantic groupings…");
            this.loadComplete = false;
            this.setStep({
                id: "8",
                title: "LLM: Semantic groupings of phenotype–gene set cluster pairs",
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
        /**
         * Shared KG + factor summary block for mechanism LLM steps (grouping and per-group hypotheses).
         */
        buildMechanismLlmContextBlock(kgBlock, factorSummary, researchContext) {
            return `**Knowledge graph (CSV):**\n\`\`\`\n${kgBlock}\n\`\`\`\n\n**Factor data summary:**\n\`\`\`json\n${factorSummary}\n\`\`\`\n\n**Research context:** ${researchContext}`;
        },
        /**
         * Two-phase mechanism generation: (1) semantic grouping LLM, (2) hypothesis LLM per group in one call.
         * KG is flattened CSV. Retries up to 3 times per phase on timeout.
         */
        requestMechanismHypotheses(factorData, kgTriples) {
            this.error_mechanisms = false;
            this.error_msg_mechanisms = "";
            this.semanticGroupedPairKeys = null;
            this.remainingSemanticGroupRows = [];
            this.generatingRemainingGroupKey = "";
            this.remainingGroupGenerateError = "";

            console.log("kgTriples", kgTriples);

            const researchContext =
                (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                    ? String(this.searchCriteria[1].values)
                    : "";
            const flattened = this.flattenKGData(kgTriples);
            this.lastFlattenedKG = flattened;
            const kgBlock = this.flattenedKGToCSV(flattened);
            console.log("FactorBaseReveal: mechanism LLM input KG CSV:", {
                rowCount: Array.isArray(flattened) ? flattened.length : 0,
                csvCharCount: kgBlock ? kgBlock.length : 0,
                csv: kgBlock,
            });
            const factorSummary = this.serializeFactorDataForPrompt(factorData);
            const baseContextSuffix = this.buildMechanismLlmContextBlock(kgBlock, factorSummary, researchContext);
            const groupingUserPrompt = `${baseContextSuffix}\n\nUsing the research context, form "groups" of Phenotype–Factor pairs from rows with predicate "associated_with" that belong together mechanistically. Omit pairs that are not context-relevant. Return ONLY JSON with a "groups" array as specified in your instructions (use [] if none qualify).`;
            const maxAttempts = 3;

            const runGroupingAttempt = (attempt) => {
                return new Promise((resolve) => {
                    let resolved = false;
                    const finish = (payload) => {
                        if (resolved) return;
                        resolved = true;
                        resolve(payload);
                    };
                    let groupsValidated = null;
                    this.llmMechanismGrouping.sendPrompt({
                        userPrompt: groupingUserPrompt,
                        onResponse: (response) => {
                            console.log("FactorBaseReveal: mechanism grouping LLM response", response);
                            const json = this.parseLLMResponse(response);
                            const groups = json && Array.isArray(json.groups) ? json.groups : null;
                            const valid =
                                groups != null &&
                                groups.every(
                                    (g) =>
                                        g &&
                                        typeof g === "object" &&
                                        Array.isArray(g.associated_pairs) &&
                                        g.associated_pairs.length > 0 &&
                                        g.associated_pairs.every(
                                            (p) =>
                                                p &&
                                                p.phenotype != null &&
                                                String(p.phenotype).trim() !== "" &&
                                                p.factor != null &&
                                                String(p.factor).trim() !== ""
                                        )
                                );
                            groupsValidated = valid ? groups : null;
                        },
                        onError: (err) => {
                            console.warn("FactorBaseReveal: mechanism grouping LLM error", err);
                            const isTimeout = this.isMechanismTimeoutError(err);
                            if (isTimeout && attempt < maxAttempts) {
                                finish({ retry: true, failed: false, err, groups: null });
                            } else {
                                finish({
                                    retry: false,
                                    failed: true,
                                    err,
                                    groups: null,
                                    isTimeout,
                                });
                            }
                        },
                        onEnd: () => {
                            if (resolved) return;
                            if (groupsValidated) {
                                finish({ retry: false, failed: false, err: null, groups: groupsValidated });
                            } else {
                                finish({
                                    retry: false,
                                    failed: true,
                                    err: new Error(
                                        "Semantic groupings returned no valid groups (check LLM JSON)."
                                    ),
                                    groups: null,
                                });
                            }
                        },
                    });
                });
            };

            /**
             * One LLM call for a single semantic group. Returns { retry, failed, err, hypothesis }.
             * Hypothesis is merged with fixed associated_pairs from the input group.
             */
            const runHypothesisAttemptForGroup = (attempt, group, groupIndex) => {
                const groupBlock = JSON.stringify(group, null, 2);
                const hypothesisUserPrompt = `**Fixed semantic group (single group — do not change membership):**\n\`\`\`json\n${groupBlock}\n\`\`\`\n\n${baseContextSuffix}\n\nReturn ONLY JSON with a "hypotheses" array of length **1** for this group (hypotheses[0] only).`;
                return new Promise((resolve) => {
                    let resolved = false;
                    const finish = (payload) => {
                        if (resolved) return;
                        resolved = true;
                        resolve(payload);
                    };
                    this.llmAnalyze.sendPrompt({
                        userPrompt: hypothesisUserPrompt,
                        onResponse: (response) => {
                            this.error_mechanisms = false;
                            console.log(
                                "FactorBaseReveal: mechanism hypothesis LLM response (group",
                                groupIndex,
                                ")",
                                response
                            );
                            const json = this.parseLLMResponse(response);
                            if (!json) {
                                finish({
                                    retry: false,
                                    failed: true,
                                    err: new Error("Could not parse LLM JSON for hypothesis."),
                                    hypothesis: null,
                                });
                                return;
                            }
                            if (json && typeof json.overall_summary === "string") {
                                this.mechanisms_summary = json.overall_summary;
                            } else {
                                this.mechanisms_summary = null;
                            }
                            let hypotheses = json && Array.isArray(json.hypotheses) ? json.hypotheses : [];
                            let h = hypotheses[0];
                            if (!h && json && json.hypothesis && typeof json.hypothesis === "object") {
                                h = json.hypothesis;
                            }
                            if (!h) {
                                finish({
                                    retry: false,
                                    failed: true,
                                    err: new Error("No hypothesis returned for this group (check LLM JSON)."),
                                    hypothesis: null,
                                });
                                return;
                            }
                            const g = group;
                            const out = { ...h };
                            if (Array.isArray(g.associated_pairs)) {
                                out.associated_pairs = JSON.parse(JSON.stringify(g.associated_pairs));
                            }
                            if (!out.group_name && g.group_name) out.group_name = g.group_name;
                            finish({ retry: false, failed: false, err: null, hypothesis: out });
                        },
                        onError: (err) => {
                            console.warn("FactorBaseReveal: mechanism hypothesis LLM error (group)", groupIndex, err);
                            const isTimeout = this.isMechanismTimeoutError(err);
                            if (isTimeout && attempt < maxAttempts) {
                                finish({ retry: true, failed: false, err, hypothesis: null });
                            } else {
                                finish({ retry: false, failed: true, err, hypothesis: null });
                            }
                        },
                        onEnd: () => {
                            if (resolved) return;
                            finish({
                                retry: false,
                                failed: true,
                                err: new Error("Incomplete LLM response for hypothesis."),
                                hypothesis: null,
                            });
                        },
                    });
                });
            };

            (async () => {
                let groups = null;
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    this.setLoadStatus(`Semantic groupings… (attempt ${attempt}/${maxAttempts})`);
                    const gr = await runGroupingAttempt(attempt);
                    if (gr.retry) continue;
                    if (gr.failed) {
                        this.error_mechanisms = true;
                        this.error_msg_mechanisms =
                            gr.err && gr.err.message
                                ? gr.err.message
                                : "Semantic groupings failed or returned invalid groups.";
                        this.setStep({
                            type: "error",
                            title: "Semantic groupings failed.",
                        });
                        this.setLoadStatus("Ready", true);
                        this.loadComplete = true;
                        return;
                    }
                    groups = gr.groups;
                    break;
                }
                if (!groups) {
                    this.error_mechanisms = true;
                    this.error_msg_mechanisms = "Semantic groupings failed after 3 attempts (timeout).";
                    this.setLoadStatus("Ready", true);
                    this.loadComplete = true;
                    return;
                }

                this.semanticGroupedPairKeys = this.buildSemanticGroupedPairKeysFromGroups(groups);
                this.prepareSemanticGroupApproval(groups);

                this.setStep({
                    id: "8",
                    substep: {
                        id: "8.1",
                        title: "Context-relevant semantic groups",
                        result: {
                            title: "Context-relevant grouped pairs (ungrouped pairs appear under Remaining)",
                            result: groups,
                        },
                    },
                });
                await this.waitForStepApproval(
                    "8",
                    "Review semantic groups before generating mechanistic hypotheses.",
                    true
                );
                this.remainingSemanticGroupRows = this.getUnselectedSemanticGroupsForApproval();
                groups = this.getSelectedSemanticGroupsForApproval();
                if (!groups || groups.length === 0) {
                    this.error_mechanisms = true;
                    this.error_msg_mechanisms = "No semantic groups selected for hypothesis generation.";
                    this.setStep({
                        type: "error",
                        title: "No semantic groups selected.",
                    });
                    this.setLoadStatus("Ready", true);
                    this.loadComplete = true;
                    return;
                }
                this.semanticGroupedPairKeys = this.buildSemanticGroupedPairKeysFromGroups(groups);
                this.setStep({
                    id: "8.2",
                    title: "LLM: Generating mechanistic hypotheses per group",
                });

                this.mechanismHypothesisStreamTotal = groups.length;
                this.mechanismHypothesisStreamDone = 0;
                this.mechanismHypothesisActiveGroupName = "";
                this.mechanisms = [];
                if (groups.length > 0) {
                    this.startMechanismHypothesisStreamTimer();
                }
                for (let gi = 0; gi < groups.length; gi++) {
                    const group = groups[gi];
                    const gName =
                        (group.group_name != null && String(group.group_name).trim() !== "")
                            ? String(group.group_name).trim()
                            : `Group ${gi + 1}`;
                    this.mechanismHypothesisActiveGroupName = gName;
                    this.setStep({
                        id: "8.2",
                        substep: {
                            id: `8.2.${gi + 1}`,
                            title: gName,
                        },
                    });
                    let got = null;
                    let lastFailed = null;
                    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                        this.setLoadStatus(
                            `Generating mechanistic hypothesis for: ${gName}… (attempt ${attempt}/${maxAttempts})`
                        );
                        const res = await runHypothesisAttemptForGroup(attempt, group, gi);
                        if (res.retry) continue;
                        if (res.failed) {
                            lastFailed = res.err;
                            break;
                        }
                        got = res.hypothesis;
                        break;
                    }
                    if (!got) {
                        this.stopMechanismHypothesisStreamTimer();
                        this.mechanismHypothesisStreamTotal = 0;
                        this.mechanismHypothesisStreamDone = 0;
                        this.mechanismHypothesisActiveGroupName = "";
                        this.error_mechanisms = true;
                        this.error_msg_mechanisms =
                            lastFailed && lastFailed.message
                                ? lastFailed.message
                                : "Mechanistic hypothesis generation failed for a group.";
                        this.setStep({
                            type: "error",
                            title: "Mechanistic hypothesis generation failed.",
                        });
                        this.setLoadStatus("Ready", true);
                        this.loadComplete = true;
                        return;
                    }
                    const normalized = this.normalizeMechanismHypotheses([got]);
                    this.mechanisms = [...(this.mechanisms || []), ...normalized];
                    this.mechanismHypothesisStreamDone = gi + 1;
                    if (gi === 0) {
                        this.showTab = "results";
                    }
                    this.setLoadStatus(`Generated ${gi + 1} of ${groups.length} mechanistic hypotheses…`);
                }

                this.stopMechanismHypothesisStreamTimer();
                this.mechanismHypothesisStreamTotal = 0;
                this.mechanismHypothesisStreamDone = 0;
                this.mechanismHypothesisActiveGroupName = "";
                this.setLoadStatus("Ready", true);
                this.setStep(
                    {
                        id: "9",
                        title: "Complete.",
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
        getRemainingGroupKey(group, idx) {
            const gName = group && group.group_name != null ? String(group.group_name).trim() : "";
            return `${idx}|${gName}`;
        },
        buildFactorDataForSemanticGroup(group) {
            if (!group || !Array.isArray(group.associated_pairs) || !group.associated_pairs.length) return null;
            const subset = {};
            const findFactorByLabelOrId = (pData, factorRaw) => {
                const target = this.collapseWsLower(factorRaw);
                const pool = [...(pData.factors || []), ...(pData.allFactors || [])];
                return pool.find((f) => {
                    const label = f.label != null ? String(f.label).trim() : "";
                    const idStr = f.factor != null ? String(f.factor).trim() : "";
                    return this.collapseWsLower(label) === target || this.collapseWsLower(idStr) === target;
                }) || null;
            };
            group.associated_pairs.forEach((pair) => {
                const phenotype = pair && pair.phenotype != null ? String(pair.phenotype).trim() : "";
                const factorLabel = pair && pair.factor != null ? String(pair.factor).trim() : "";
                if (!phenotype || !factorLabel) return;
                const pData = this.factorData && this.factorData[phenotype];
                if (!pData) return;
                const factorItem = findFactorByLabelOrId(pData, factorLabel);
                if (!factorItem) return;
                if (!subset[phenotype]) {
                    subset[phenotype] = { genes: {}, factors: [] };
                }
                if (subset[phenotype].factors.some((f) => String(f.factor) === String(factorItem.factor))) return;
                const factorClone = JSON.parse(JSON.stringify(factorItem));
                subset[phenotype].factors.push(factorClone);
                const genesInFactor = Object.keys(factorItem.genes || {});
                genesInFactor.forEach((g) => {
                    if (pData.genes && pData.genes[g] != null && subset[phenotype].genes[g] == null) {
                        subset[phenotype].genes[g] = JSON.parse(JSON.stringify(pData.genes[g]));
                    }
                });
            });
            const phenotypes = Object.keys(subset);
            if (!phenotypes.length) return null;
            const totalFactors = phenotypes.reduce((acc, p) => acc + ((subset[p] && subset[p].factors) ? subset[p].factors.length : 0), 0);
            return totalFactors > 0 ? subset : null;
        },
        generateHypothesisForRemainingGroup(group, idx) {
            if (!group || !Array.isArray(group.associated_pairs) || !group.associated_pairs.length) return;
            const groupKey = this.getRemainingGroupKey(group, idx);
            this.remainingGroupGenerateError = "";
            const subset = this.buildFactorDataForSemanticGroup(group);
            if (!subset) {
                this.remainingGroupGenerateError = "Could not build data for this group.";
                return;
            }
            const kgTriples = this.transformMergedDataToKG(subset, "factors");
            if (!kgTriples || !kgTriples.length) {
                this.remainingGroupGenerateError = "No knowledge graph triples for this group.";
                return;
            }
            this.generatingRemainingGroupKey = groupKey;
            this.startRemainingGenerateTimer();
            const flattened = this.flattenKGData(kgTriples);
            const researchContext =
                (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                    ? String(this.searchCriteria[1].values)
                    : "";
            const factorSummary = this.serializeFactorDataForPrompt(subset);
            const kgBlock = this.flattenedKGToCSV(flattened);
            const baseCtx = `**Knowledge graph (CSV):**\n\`\`\`\n${kgBlock}\n\`\`\`\n\n**Factor data summary:**\n\`\`\`json\n${factorSummary}\n\`\`\`\n\n**Research context:** ${researchContext}`;
            const fixedGroup = {
                group_name:
                    group.group_name != null && String(group.group_name).trim() !== ""
                        ? String(group.group_name).trim()
                        : `Remaining group ${idx + 1}`,
                associated_pairs: (group.associated_pairs || []).map((p) => ({
                    phenotype: p && p.phenotype != null ? String(p.phenotype).trim() : "",
                    factor: p && p.factor != null ? String(p.factor).trim() : "",
                })).filter((p) => p.phenotype && p.factor),
                grouping_rationale:
                    group.grouping_rationale != null && String(group.grouping_rationale).trim() !== ""
                        ? String(group.grouping_rationale).trim()
                        : "Generated from remaining semantic group table.",
            };
            const fullPrompt = `**Fixed semantic group (single group — do not change membership):**\n\`\`\`json\n${JSON.stringify(fixedGroup, null, 2)}\n\`\`\`\n\n${baseCtx}\n\nReturn ONLY JSON with a "hypotheses" array of length **1** for this group (hypotheses[0] only).`;

            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                this.generatingRemainingGroupKey = "";
                this.stopRemainingGenerateTimer();
            };

            this.llmAnalyze.sendPrompt({
                userPrompt: fullPrompt,
                onResponse: (response) => {
                    const json = this.parseLLMResponse(response);
                    if (!json) {
                        this.remainingGroupGenerateError = "Could not parse LLM response.";
                        return;
                    }
                    if (!Array.isArray(json.hypotheses) || !json.hypotheses.length) {
                        this.remainingGroupGenerateError =
                            typeof json.error === "string" && json.error
                                ? json.error
                                : "No hypotheses in response.";
                        return;
                    }
                    const normalized = this.normalizeMechanismHypotheses(json.hypotheses, flattened);
                    const prev = Array.isArray(this.mechanisms) ? this.mechanisms : [];
                    this.mechanisms = [...prev, ...normalized];
                    this.remainingSemanticGroupRows = (this.remainingSemanticGroupRows || []).filter((_, i) => i !== idx);
                    this.showTab = "results";
                },
                onError: (err) => {
                    console.warn("FactorBaseReveal: remaining-group mechanism LLM error", err);
                    this.remainingGroupGenerateError =
                        err && err.message ? err.message : "Request failed or timed out.";
                    finish();
                },
                onEnd: finish,
            });
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
            const singleGroup = {
                group_name: factorLabelForKg ? `${factorLabelForKg} × ${row.phenotype}` : `Remaining pair ${pairKey}`,
                associated_pairs: [
                    {
                        phenotype: String(row.phenotype).trim(),
                        factor: factorLabelForKg,
                    },
                ],
                grouping_rationale: "Generated from remaining phenotype–gene set cluster table.",
            };
            const fullPrompt = `**Fixed semantic group (single group — do not change membership):**\n\`\`\`json\n${JSON.stringify(singleGroup, null, 2)}\n\`\`\`\n\n${baseCtx}\n\nReturn ONLY JSON with a "hypotheses" array of length **1** for this group (hypotheses[0] only).`;

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
        /**
         * Query data using the configured searchApis entry.
         * @param {string} apiName - Key in searchApis (e.g. 'factor', 'factorGenes', 'factorGeneSets').
         * @param {Object} parameters - Key-value pairs to substitute in the URL (e.g. { phenotype: 'T2D', factor: 2 }).
         *   Placeholders in the URL like $phenotype, $factor are replaced by parameters.phenotype, parameters.factor.
         * @returns {Promise<Object>} - Parsed JSON response (typically { data: [...], ... }).
         */
        async querySearchApi(apiName, parameters = {}) {
            const baseUrl = this.searchApis[apiName];
            if (!baseUrl || typeof baseUrl !== "string") {
                throw new Error(`Unknown or missing API: ${apiName}`);
            }
            let url = baseUrl;
            Object.keys(parameters).forEach((key) => {
                const placeholder = `$${key}`;
                const value = parameters[key] != null ? String(parameters[key]) : "";
                url = url.split(placeholder).join(encodeURIComponent(value));
            });
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API ${apiName} failed: ${response.status} ${response.statusText}`);
            }
            return response.json();
        },

        /**
         * Fetch gene sets for a (phenotype, factor) via phenotypeGeneSetFactor API. Used on both phenotype and association paths.
         * Filters out gene_set_program === 'none'; takes the top 5 gene sets by beta_uncorrected (highest first).
         * @param {string} phenotype
         * @param {string} factor
         * @returns {Promise<{ top_gene_sets: string, gene_set_description: string }>}
         */
        async fetchGeneSetsForPhenotypeFactor(phenotype, factor) {
            const out = { top_gene_sets: "", gene_set_description: "", gene_set_program: "" };
            const maxGeneSetsPerFactor = 5;
            try {
                //get gene sets for phenotype/factor assoc.
                const raw = await this.querySearchApi("phenotypeGeneSetFactor", { phenotype, factor });
                const rows = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
                //filter out gene sets with "None" as program (MsigDB; mouse)
                const filtered = rows.filter((row) => {
                    const program = row.gene_set_program;
                    if (program == null) return true;
                    if (String(program).trim().toLowerCase() === "none") return false;
                    return true;
                });
                //sort desc. by beta uncorrected
                const withBeta = filtered.map((r) => {
                    const b = r.beta_uncorrected;
                    const num = b != null && b !== "" && !isNaN(Number(b)) ? Number(b) : null;
                    return { ...r, _beta: num };
                }).sort((a, b) => (b._beta ?? -1) - (a._beta ?? -1));
                //keep top N (5)
                const selected = withBeta.slice(0, maxGeneSetsPerFactor);

                const names = selected.map((r) => (r.gene_set != null ? String(r.gene_set).trim() : "")).filter(Boolean);
                const descs = selected.map((r) => (r.gene_set_description != null ? String(r.gene_set_description).trim() : "")).filter(Boolean);
                const programs = selected.map((r) => (r.gene_set_program != null ? String(r.gene_set_program).trim() : "")).filter(Boolean);
                out.top_gene_sets = names.join(";");
                out.gene_set_description = descs.join(" | ");
                out.gene_set_program = programs.join(" | ");
            } catch (err) {
                console.warn(`FactorBaseReveal: phenotypeGeneSetFactor failed for ${phenotype}/${factor}`, err);
            }
            return out;
        },

        /**
         * Normalize response from the factor API (pigean-factor).
         * Preserves only factor, label, top_gene_sets. (genes/geneSets live on factorData[phenotype].)
         * @param {Object} rawResponse - Raw API response (e.g. { data: [...] }).
         * @returns {Array} - Normalized list of factor records for use in the component.
         */
        normalizeFactorData(rawResponse) {
            const rows = rawResponse && Array.isArray(rawResponse.data) ? rawResponse.data : [];
            return rows.map((row) => ({
                factor: row.factor,
                label: row.label,
                top_gene_sets: row.top_gene_sets,
                genes: {},
                geneSets: {},
            }));
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

/* Fixed toast while incremental mechanism hypotheses still run (top-right avoids page footer clipping) */
.mechanism-hypothesis-stream-bubble {
    position: fixed;
    top: max(24px, env(safe-area-inset-top, 0px));
    right: max(24px, env(safe-area-inset-right, 0px));
    z-index: 10050;
    max-width: min(360px, calc(100vw - 32px));
    pointer-events: none;
}
.mechanism-hypothesis-stream-bubble__inner {
    background: #ff6600;
    color: #fff;
    padding: 14px 18px 16px;
    border-radius: 18px;
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.2);
}
.mechanism-hypothesis-stream-bubble__title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}
.mechanism-hypothesis-stream-bubble__pulse {
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
    animation: mechanism-stream-pulse 1.4s ease-out infinite;
}
@keyframes mechanism-stream-pulse {
    0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.55);
    }
    70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
    }
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
}
.mechanism-hypothesis-stream-bubble__title {
    font-weight: 700;
    font-size: 1.05rem;
    line-height: 1.25;
    letter-spacing: 0.01em;
}
.mechanism-hypothesis-stream-bubble__text {
    margin: 0 0 10px;
    font-size: 0.9rem;
    line-height: 1.45;
    opacity: 0.98;
}
.mechanism-hypothesis-stream-bubble__current {
    font-size: 0.88rem;
    line-height: 1.4;
    padding-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.35);
}
.mechanism-hypothesis-stream-bubble__current-label {
    opacity: 0.85;
    margin-right: 6px;
}
.mechanism-hypothesis-stream-bubble__progress {
    margin-top: 10px;
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0.95;
    letter-spacing: 0.02em;
}
.mechanism-hypothesis-stream-bubble__elapsed {
    margin-top: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    opacity: 0.92;
    letter-spacing: 0.03em;
}
</style>
