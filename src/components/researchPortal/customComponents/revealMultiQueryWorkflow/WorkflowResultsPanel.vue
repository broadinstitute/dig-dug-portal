<template>
    <div v-if="w" style="display:flex; flex-direction: column; gap: 12px;">
<div
                                v-if="w.isMechanismHypothesisLoading"
                                class="d-flex align-items-center gap-2 my-2"
                                style="color: #555;"
                            >
                                <b-spinner small></b-spinner>
                                <span class="font-weight-bold">LLM: Generating mechanistic hypotheses</span>
                                <span v-if="w.revealHypothesisStep" class="text-muted small">{{ w.formatTime(w.revealHypothesisStep.time) || w.currStepTime(w.revealHypothesisStep) }}</span>
                            </div>
                            <div
                                v-if="!w.isMechanismHypothesisLoading && w.error_mechanisms"
                                class="alert alert-danger d-flex align-items-center justify-content-between mt-2"
                                role="alert"
                            >
                                <span>{{ w.error_msg_mechanisms }}</span>
                                <button type="button" class="btn btn-sm btn-primary" @click="w.retryMechanismHypotheses">Retry</button>
                            </div>
                            <div v-if="!w.isMechanismHypothesisLoading && w.showMechanismResultsPanel">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="font-weight-bold" style="color: #FF6600; font-size: 1.2em;">
                                    <template v-if="w.mechanisms && w.mechanisms.length">Generated {{ w.mechanisms.length }} mechanistic hypotheses.</template>
                                    <template v-else>Mechanistic hypotheses</template>
                                </div>
                                <button
                                    v-if="w.canDownloadMechanismReport"
                                    class="btn btn-outline-secondary btn-sm"
                                    @click="w.downloadReport"
                                >
                                    Download report
                                </button>
                            </div>
                            <div
                                v-if="w.mechanismDiagnosticAssessment && w.mechanismDiagnosticAssessment.warning_flag"
                                class="alert alert-warning small mb-3"
                                role="status"
                            >
                                <div class="font-weight-bold text-dark mb-1">Diagnostic warning</div>
                                <div class="mb-0">{{ w.mechanismDiagnosticAssessment.warning_flag }}</div>
                                <div
                                    v-if="w.mechanismDiagnosticAssessment.suggested_optimized_query"
                                    class="mt-2 pt-2 border-top"
                                    style="border-color: rgba(0,0,0,0.08) !important;"
                                >
                                    <div class="font-weight-bold small mb-1">Suggested optimized query</div>
                                    <div class="small text-dark mb-2" style="white-space: pre-wrap;">{{ w.mechanismDiagnosticAssessment.suggested_optimized_query }}</div>
                                    <button
                                        type="button"
                                        class="btn btn-cfde btn-sm"
                                        @click="w.applySuggestedOptimizedQuery(w.mechanismDiagnosticAssessment.suggested_optimized_query)"
                                    >
                                        Use this query and run Reveal
                                    </button>
                                </div>
                            </div>
                            <div
                                v-if="w.mechanismDiagnosticAssessment && w.mechanismDiagnosticAssessment.can_generate_hypothesis === false"
                                class="alert alert-secondary border small mb-3"
                                role="status"
                            >
                                <div class="font-weight-bold text-dark mb-1">No hypothesis generated (diagnostic assessment)</div>
                                <p class="mb-2 small mb-0">{{ w.mechanismDiagnosticAssessment.rejection_reason || "The model declined to invent connections not supported by the retrieved graph." }}</p>
                                <div
                                    v-if="w.hypothesisGenerationMode === 'strict'"
                                    class="mt-2 pt-2 border-top"
                                    style="border-color: rgba(0,0,0,0.08) !important;"
                                >
                                    <p class="small mb-2">
                                        Retrieval and strict graph rules blocked a mechanism. You can run again in <strong>Relaxed</strong> mode to ask the model for a best-effort, explicitly warned hypothesis (still grounded in the retrieved CSV).
                                    </p>
                                    <button type="button" class="btn btn-cfde btn-sm" @click="w.retryMechanismHypothesesRelaxed">
                                        Try in relaxed (exploratory) mode
                                    </button>
                                </div>
                                <div v-if="w.mechanismDiagnosticAssessment.suggested_optimized_query" class="mt-2 pt-2 border-top">
                                    <div class="font-weight-bold small mb-1">Suggested optimized query</div>
                                    <div class="small text-dark mb-2" style="white-space: pre-wrap;">{{ w.mechanismDiagnosticAssessment.suggested_optimized_query }}</div>
                                    <button
                                        type="button"
                                        class="btn btn-cfde btn-sm"
                                        @click="w.applySuggestedOptimizedQuery(w.mechanismDiagnosticAssessment.suggested_optimized_query)"
                                    >
                                        Use this query and run Reveal
                                    </button>
                                </div>
                            </div>
                            <div v-if="w.mechanismResultsDetailVisible">
                            <div class="section-header d-flex justify-content-between align-items-start mb-2" @click="w.display_mechanisms = !w.display_mechanisms">
                                <div v-if="w.searchCriteria && w.searchCriteria[1]" class="text-muted">In the context of <strong>{{ w.searchCriteria[1].values }}</strong></div>
                                <!--<span class="small text-muted">{{ w.display_mechanisms ? 'show less' : 'show more' }}</span>-->
                            </div>
                            <div :class="{ collapsed: !w.display_mechanisms }" class="criteria-detail">
                                <div v-if="w.getReportSessionSummary() !== '—'" class="mb-4">
                                    <strong class="d-block mb-2" style="font-size: 1.1em;">Summary</strong>
                                    <div class="text-muted">{{ w.getReportSessionSummary() }}</div>
                                </div>
                                <div class="d-flex flex-column gap-4" style="gap:40px;">
                                    <div
                                        v-for="(mechanism, idx) in w.mechanisms"
                                        :key="idx"
                                        class="mechanism-card rounded border shadow-sm bg-light overflow-hidden"
                                    >
                                        <div
                                            v-if="w.hypothesisLastRunMode === 'relaxed' || w.mechanismDiagnosticAssessment && w.mechanismDiagnosticAssessment.exploratory_mode === true"
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
                                                    <div
                                                        v-if="mechanism.pathway_shift_rationale"
                                                        class="alert alert-warning py-2 px-3 mb-0 small"
                                                        role="status"
                                                    >
                                                        <strong>Why the hypothesis shifted:</strong>
                                                        {{ mechanism.pathway_shift_rationale }}<span class="ai-gen">AI</span>
                                                    </div>
                                                    <div class="">
                                                        <div class="font-weight-bold small text-uppercase text-muted mb-1">Rationale</div>
                                                        <div class="small">{{ mechanism.novelty_explanation || mechanism.novelty }}<span class="ai-gen">AI</span></div>
                                                    </div>
                                                    <div v-if="mechanism.cross_route_crosstalk_model" class="">
                                                        <div class="font-weight-bold small text-uppercase text-muted mb-1">Cross-route crosstalk model</div>
                                                        <div class="small">{{ mechanism.cross_route_crosstalk_model }}<span class="ai-gen">AI</span></div>
                                                    </div>
                                                    <div v-if="mechanism.cellular_assignment" class="">
                                                        <div class="font-weight-bold small text-uppercase text-muted mb-1">Cellular assignment</div>
                                                        <div class="small">{{ w.formatCellularAssignmentDisplay(mechanism.cellular_assignment) }}<span class="ai-gen">AI</span></div>
                                                    </div>
                                                    <div v-if="mechanism.depot_contrast" class="">
                                                        <div class="font-weight-bold small text-uppercase text-muted mb-1">Depot contrast</div>
                                                        <div class="small">{{ w.formatDepotContrastDisplay(mechanism.depot_contrast) }}<span class="ai-gen">AI</span></div>
                                                    </div>
                                                    <div v-if="mechanism.effect_direction_notes && mechanism.effect_direction_notes.length" class="">
                                                        <div class="font-weight-bold small text-uppercase text-muted mb-1">Effect direction notes</div>
                                                        <ul class="small mb-0 pl-3">
                                                            <li
                                                                v-for="(note, nidx) in mechanism.effect_direction_notes"
                                                                :key="'dir-' + idx + '-' + nidx + '-' + (note.gene || '')"
                                                            >
                                                                <strong>{{ note.gene }}</strong>: {{ note.direction || 'unknown' }}<span v-if="note.note"> — {{ note.note }}</span><span class="ai-gen">AI</span>
                                                            </li>
                                                        </ul>
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
                                                            :is-biolink-map="w.isMechanismUsingBiolinkMap(mechanism)"
                                                            :show-hypothesis-map-view-toggle="w.hasMechanismBiolinkNetwork(mechanism)"
                                                            :show-original-hypothesis-map="!w.isMechanismUsingBiolinkMap(mechanism)"
                                                            @hypothesis-original-map="
                                                                w.setMechanismMapViewMode(idx, $event ? 'original' : 'biolink')
                                                            "
                                                            @open-popup="w.openNetworkPopup(idx, { hypothesisMap: true })"
                                                        />
                                                    </div>
                                                    <p
                                                        v-if="w.isMechanismUsingBiolinkMap(mechanism)"
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
                                            <div v-if="w.candidateInventoryRows(mechanism.candidate_inventory).length" class="mb-3">
                                                <div class="font-weight-bold small text-uppercase text-muted mb-2">Evidence-derived candidate inventory</div>
                                                <b-table
                                                    small
                                                    striped
                                                    hover
                                                    responsive="sm"
                                                    head-variant="light"
                                                    :items="w.candidateInventoryRows(mechanism.candidate_inventory)"
                                                    :fields="[
                                                        { key: 'category', label: 'Role', thStyle: { width: '230px' } },
                                                        { key: 'symbol', label: 'Gene', thStyle: { width: '95px' } },
                                                        { key: 'provenance', label: 'Route provenance', thStyle: { width: '180px' } },
                                                        { key: 'reason', label: 'Reason / note' }
                                                    ]"
                                                >
                                                    <template #cell(symbol)="row">
                                                        <span class="small pill">{{ row.item.symbol }}</span>
                                                    </template>
                                                    <template #cell(provenance)="row">
                                                        <span>{{ row.item.provenance }}</span>
                                                    </template>
                                                </b-table>
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
                                                                    { key: 'gene_sets', label: 'Gene sets (selected row)', thStyle: { width: '180px' } },
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
                                                                    <span class="small pill" :style="w.mechanismGeneGroupPillStyle(row.item.group)">{{ row.item.gene }}</span>
                                                                </template>
                                                                <template #cell(gene_sets)="row">
                                                                    <span class="small">{{ (w.getGeneConnectionForMechanism(mechanism, row.item.gene).gene_sets || []).join(', ') || '—' }}</span>
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
                                                        @open-popup="w.openNetworkPopup(idx)"
                                                    />
                                                    <div class="mt-2" style="display:flex; flex-direction: column;">
                                                        <div v-if="(mechanism.relevant_phenotypes && mechanism.relevant_phenotypes.length)" class="mb-2">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-1">Relevant phenotypes</div>
                                                            <div style="display:flex; flex-direction: column; gap:3px">
                                                                <div
                                                                    v-for="(phenotypeLabel, pidx) in w.getRelevantPhenotypesDisplay(mechanism.relevant_phenotypes)"
                                                                    :key="'mech-' + idx + '-rphen-' + pidx + '-' + (phenotypeLabel || '')"
                                                                    class="small pill"
                                                                    :style="`background:${w.NODE_COLORS.Phenotype}; color:white`"
                                                                >
                                                                    {{ phenotypeLabel }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-if="(mechanism.redundant_associated_pairs && mechanism.redundant_associated_pairs.length)" class="mb-2">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-1">Related data categories</div>
                                                            <div style="display:flex; flex-wrap: wrap; gap:3px">
                                                                <div
                                                                    v-for="(pair, ridx) in mechanism.redundant_associated_pairs"
                                                                    :key="'mech-' + idx + '-red-' + ridx + '-' + (pair.factor || '')"
                                                                    class="small pill"
                                                                    style="background:#e2e3e5; color:#383d41;"
                                                                >
                                                                    {{ w.getPhenotypeDisplay(pair.phenotype) }} - {{ w.getFactorClusterDisplayString(pair.factor) }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-if="(mechanism.relevant_gene_sets && mechanism.relevant_gene_sets.length)" class="mb-2">
                                                            <div class="font-weight-bold small text-uppercase text-muted mb-1">Relevant gene sets</div>
                                                            <div class="small" style="white-space: normal; display:flex; flex-direction: column; gap:3px">
                                                                <div v-for="set in w.formatRelevantGeneSetsForDisplay(mechanism.relevant_gene_sets)" :key="set.gs">
                                                                    <div style="display:flex; gap:10px; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
                                                                        <a
                                                                            :href="w.cfdeExploreGeneSetHref(mechanism, set.gs, set.program)"
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            class="pill text-white text-decoration-none cfde-explore-geneset-link"
                                                                            style="overflow: clip; text-overflow: ellipsis; max-width: 300px; word-wrap: normal;"
                                                                            :style="`background:${w.NODE_COLORS.Pathway}`"
                                                                            :title="set.desc || set.gs"
                                                                        >{{ set.gs }}</a>
                                                                        <div class="d-flex flex-wrap align-items-center fbr-relevant-geneset-programs" style="gap:6px; max-width: min(100%, 560px); justify-content: flex-end;">
                                                                            <template v-if="w.c2m2GeneSetDownloadNodes(set.gs).length">
                                                                                <div class="fbr-program-download-wrap">
                                                                                    <div
                                                                                        class="pill text-white small d-inline-flex align-items-center fbr-program-download-trigger"
                                                                                        :style="{ background: w.NODE_COLORS.GeneSetProgramDownloads }"
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
                                                                                            v-for="(pn, nidx) in w.c2m2GeneSetDownloadNodes(set.gs)"
                                                                                            :key="'mech-' + idx + '-prov-menu-' + set.gs + '-' + nidx + '-' + pn.id"
                                                                                            :href="pn.dcc_url"
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            class="fbr-provenance-menu-link d-block px-2 py-1 small text-dark text-decoration-none"
                                                                                        >{{ pn.id }}</a>
                                                                                    </div>
                                                                                </div>
                                                                            </template>
                                                                            <span v-else-if="w.c2m2ProvenanceEntry(set.gs) && w.c2m2ProvenanceEntry(set.gs).status === 'loading'" class="text-muted small">Provenance…</span>
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
                                                            v-if="w.isNextStepExperimentalValidation(step)"
                                                            class="mt-2"
                                                        >
                                                            <button
                                                                type="button"
                                                                class="btn btn-cfde btn-sm"
                                                                @click.stop="w.openDesignProtocolForMechanism(mechanism, step)"
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
                                                            @click.prevent="w.onAlternativeQuerySelected(query)"
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
                                                    @click.stop="w.copyMechanismForLlm(mechanism, idx)"
                                                >
                                                    <b-icon icon="clipboard" class="mr-1"></b-icon>
                                                    {{ w.handoffCopiedMechanismIndex === idx ? 'Copied!' : 'Copy for LLM' }}
                                                </button>
                                                <button
                                                    type="button"
                                                    class="btn btn-sm btn-outline-secondary"
                                                    @click.stop="w.downloadMechanismHandoffPackage(mechanism, idx)"
                                                >
                                                    <b-icon icon="download" class="mr-1"></b-icon>
                                                    Download handoff data
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Remaining: included pairs not yet cited in hypothesis evidence -->
                                    <div
                                        v-if="w.remainingGeneSetClusterRows.length"
                                        class="remaining-gene-clusters mt-5 pt-4 border-top"
                                    >
                                        <div class="font-weight-bold mb-2" style="color: #FF6600; font-size: 1.2em;">
                                            Remaining gene set clusters
                                        </div>
                                        <p class="text-muted small mb-3">
                                            These phenotype-gene set cluster pairs were included in your data selection but are not yet covered by supporting evidence in the generated hypotheses.
                                        </p>
                                        <div v-if="w.remainingPairGenerateError" class="alert alert-danger small mb-3" role="alert">
                                            {{ w.remainingPairGenerateError }}
                                        </div>
                                        <div class="criteria-detail">
                                            <div>
                                                        <b-table-simple v-if="w.isPhenotypePath" small striped hover class="mb-0">
                                                            <thead variant="light">
                                                                <tr>
                                                                    <th style="width: 72px;">Included</th>
                                                                    <th style="width: auto;">Phenotype</th>
                                                                    <th style="width: auto;">Trait group</th>
                                                                    <th style="width: 300px;">Genes and gene sets in cluster</th>
                                                                    <th style="width: 130px;">Hypothesis</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody v-for="row in w.remainingFactorTableRowsPaged" :key="'rem-' + w.getRowKey(row)">
                                                                <tr>
                                                                    <td>
                                                                        <div class="text-center">
                                                                            <input type="checkbox" :checked="row.included" class="form-check-input d-inline-block" aria-label="Included" />
                                                                        </div>
                                                                    </td>
                                                                    <td>{{ w.getPhenotypeDisplay(row.phenotype) }}</td>
                                                                    <td>{{ w.getFactorClusterDisplay(row) }}</td>
                                                                    <td style="text-align: center;">
                                                                        <button
                                                                            class="btn btn-sm btn-outline-primary"
                                                                            @click="w.toggleFactorGenesRow({ item: row })"
                                                                        >
                                                                            {{ w.isFactorRowExpanded(row) ? 'Hide' : 'Show' }}
                                                                        </button>
                                                                    </td>
                                                                    <td class="text-center align-middle">
                                                                        <button
                                                                            type="button"
                                                                            class="btn btn-sm btn-cfde"
                                                                            :disabled="w.generatingRemainingRowKey === w.getRowKey(row)"
                                                                            @click="w.generateHypothesisForRemainingPair(row)"
                                                                        >
                                                                            <b-spinner v-if="w.generatingRemainingRowKey === w.getRowKey(row)" small class="mr-1"></b-spinner>
                                                                            <template v-if="w.generatingRemainingRowKey === w.getRowKey(row)">Generating… {{ w.formatRemainingGenerateElapsed() }}</template>
                                                                            <template v-else>Generate</template>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                                <tr v-if="w.isFactorRowExpanded(row)">
                                                                    <td colspan="5" class="p-0 border-0">
                                                                        <div class="bg-light" style="display:flex; gap: 20px; flex-wrap: wrap;">
                                                                            <div class="px-3 pt-2 pb-0 w-100">
                                                                                <factor-base-reveal-network
                                                                                    v-if="w.getFactorConnectivityNetwork(row) && w.getFactorConnectivityNetwork(row).nodes.length"
                                                                                    :network="w.getFactorConnectivityNetwork(row)"
                                                                                    :height="220"
                                                                                    :show-popup-button="true"
                                                                                    gene-node-metric-key="gwas_support"
                                                                                    gene-color-by-gwas-support
                                                                                    edge-distance-metric-key="functional_support"
                                                                                    @open-popup="w.openFactorConnectivityPopup(row)"
                                                                                />
                                                                            </div>
                                                                            <div v-if="w.getGenesetForFactor(row.phenotype, row.factor)" class="py-2 px-3" style="display:flex; flex:1; flex-direction: column;">
                                                                                <div class="small text-muted mb-2">Gene sets in cluster</div>
                                                                                <b-table
                                                                                    striped
                                                                                    hover
                                                                                    small
                                                                                    responsive="sm"
                                                                                    head-variant="light"
                                                                                    :items="w.getGenesetForFactor(row.phenotype, row.factor)"
                                                                                    :fields="[
                                                                                        { key: 'geneset', label: 'Gene Set', thClass: 'text-nowrap'},
                                                                                        { key: 'program', label: 'Program', thClass: 'text-nowrap'},
                                                                                        { key: 'actions', label: 'Source Data', thClass: 'text-nowrap'}
                                                                                    ]"
                                                                                >
                                                                                    <template #cell(geneset)="gRow">
                                                                                        <a
                                                                                            :href="w.cfdeExploreAssociationHref(row.phenotype, gRow.item.geneset, gRow.item.program)"
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
                                                                                            @click="w.onGeneSetRowToggled(gRow)"
                                                                                        >
                                                                                            {{ gRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                                        </button>
                                                                                    </template>
                                                                                    <template #row-details="gRow">
                                                                                        <div style="padding: 10px;">
                                                                                            <div v-if="w.gene_set_sources[gRow.item.geneset]">
                                                                                                <b-card>
                                                                                                    <a :href="w.gene_set_sources[gRow.item.geneset].geneSetUrl" target="_blank">{{ w.gene_set_sources[gRow.item.geneset].geneSet }}</a>
                                                                                                    <ul>
                                                                                                        <li v-for="(rel, i) in w.gene_set_sources[gRow.item.geneset].relations" :key="i" class="text-muted small">
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
                                                                                <div v-if="loadingGenesForFactor[w.getRowKey(row)]" class="small text-muted mb-2">Loading genes…</div>
                                                                                <div class="small text-muted mb-2">Genes share membership with anchor gene(s)</div>
                                                                                <b-table
                                                                                    v-if="!loadingGenesForFactor[w.getRowKey(row)]"
                                                                                    striped
                                                                                    hover
                                                                                    small
                                                                                    responsive="sm"
                                                                                    head-variant="light"
                                                                                    :items="w.getGenesForFactor(row.phenotype, row.factor)"
                                                                                    :fields="[
                                                                                        { key: 'gene', label: 'Gene', thStyle: { width: '100px' } },
                                                                                        { key: 'combined', label: 'Combined score', thStyle: { width: '110px' } },
                                                                                        { key: 'gwasSupport', label: 'GWAS support', thStyle: { width: '110px' } },
                                                                                        { key: 'geneSetSupport', label: 'Functional support', thStyle: { width: '120px' } }
                                                                                    ]"
                                                                                    :per-page="w.subtablePerPage"
                                                                                    :current-page="w.getSubtableCurrentPage(row)"
                                                                                />
                                                                                <b-pagination
                                                                                    v-if="!loadingGenesForFactor[w.getRowKey(row)] && w.getGenesForFactor(row.phenotype, row.factor).length > w.subtablePerPage"
                                                                                    v-model="w.subtableCurrentPages[w.getRowKey(row)]"
                                                                                    class="pagination-sm justify-content-center mt-2"
                                                                                    :total-rows="w.getGenesForFactor(row.phenotype, row.factor).length"
                                                                                    :per-page="w.subtablePerPage"
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
                                                                {{ w.getPhenotypeDisplay(row.item.phenotype) }}
                                                            </template>
                                                            <template #cell(factorLabel)="row">
                                                                {{ w.getFactorClusterDisplay(row.item) }}
                                                            </template>
                                                            <template #cell(rationale)="row">
                                                                <span v-if="row.item.rationale" class="small text-muted" style="white-space: normal;">{{ row.item.rationale }}</span>
                                                                <span v-else class="small text-muted">—</span>
                                                            </template>
                                                            <template #cell(view_genes)="row">
                                                                <button
                                                                    class="btn btn-sm btn-outline-primary"
                                                                    @click="w.toggleFactorGenesRow(row)"
                                                                >
                                                                    {{ w.isFactorRowExpanded(row.item) ? 'Hide' : 'Show' }}
                                                                </button>
                                                            </template>
                                                            <template #cell(hypothesis)="row">
                                                                <button
                                                                    type="button"
                                                                    class="btn btn-sm btn-cfde"
                                                                    :disabled="w.generatingRemainingRowKey === w.getRowKey(row.item)"
                                                                    @click="w.generateHypothesisForRemainingPair(row.item)"
                                                                >
                                                                    <b-spinner v-if="w.generatingRemainingRowKey === w.getRowKey(row.item)" small class="mr-1"></b-spinner>
                                                                    <template v-if="w.generatingRemainingRowKey === w.getRowKey(row.item)">Generating… {{ w.formatRemainingGenerateElapsed() }}</template>
                                                                    <template v-else>Generate</template>
                                                                </button>
                                                            </template>
                                                            <template #row-details="row">
                                                                <div class="bg-light" style="display:flex; gap: 20px; flex-wrap: wrap;">
                                                                    <div class="px-3 pt-2 pb-0 w-100">
                                                                        <factor-base-reveal-network
                                                                            v-if="w.getFactorConnectivityNetwork(row.item) && w.getFactorConnectivityNetwork(row.item).nodes.length"
                                                                            :network="w.getFactorConnectivityNetwork(row.item)"
                                                                            :height="220"
                                                                            :show-popup-button="true"
                                                                            gene-node-metric-key="gwas_support"
                                                                            gene-color-by-gwas-support
                                                                            edge-distance-metric-key="functional_support"
                                                                            @open-popup="w.openFactorConnectivityPopup(row.item)"
                                                                        />
                                                                    </div>
                                                                    <div v-if="w.getGenesetForFactor(row.item.phenotype, row.item.factor)" class="py-2 px-3" style="display:flex; flex:1; flex-direction: column;">
                                                                        <div class="small text-muted mb-2">Gene sets in cluster</div>
                                                                        <b-table
                                                                            striped
                                                                            hover
                                                                            small
                                                                            responsive="sm"
                                                                            head-variant="light"
                                                                            :items="w.getGenesetForFactor(row.item.phenotype, row.item.factor)"
                                                                            :fields="[
                                                                                { key: 'geneset', label: 'Gene Set', thClass: 'text-nowrap'},
                                                                                { key: 'program', label: 'Program', thClass: 'text-nowrap'},
                                                                                { key: 'actions', label: 'Source Data', thClass: 'text-nowrap'}
                                                                            ]"
                                                                        >
                                                                            <template #cell(geneset)="gRow">
                                                                                <a
                                                                                    :href="w.cfdeExploreAssociationHref(row.item.phenotype, gRow.item.geneset, gRow.item.program)"
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
                                                                                    @click="w.onGeneSetRowToggled(gRow)"
                                                                                >
                                                                                    {{ gRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                                </button>
                                                                            </template>
                                                                            <template #row-details="gRow">
                                                                                <div style="padding: 10px;">
                                                                                    <div v-if="w.gene_set_sources[gRow.item.geneset]">
                                                                                        <b-card>
                                                                                            <a :href="w.gene_set_sources[gRow.item.geneset].geneSetUrl" target="_blank">{{ w.gene_set_sources[gRow.item.geneset].geneSet }}</a>
                                                                                            <ul>
                                                                                                <li v-for="(rel, i) in w.gene_set_sources[gRow.item.geneset].relations" :key="i" class="text-muted small">
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
                                                                        <div class="small text-muted mb-2">Genes share membership with anchor gene(s)</div>
                                                                        <b-table
                                                                            striped
                                                                            hover
                                                                            small
                                                                            responsive="sm"
                                                                            head-variant="light"
                                                                            :items="w.getGenesForFactor(row.item.phenotype, row.item.factor)"
                                                                            :fields="[
                                                                                { key: 'gene', label: 'Gene', thStyle: { width: '100px' } },
                                                                                { key: 'combined', label: 'Combined score', thStyle: { width: '110px' } },
                                                                                { key: 'gwasSupport', label: 'GWAS support', thStyle: { width: '110px' } },
                                                                                { key: 'geneSetSupport', label: 'Functional support', thStyle: { width: '120px' } }
                                                                            ]"
                                                                            :per-page="w.subtablePerPage"
                                                                            :current-page="w.getSubtableCurrentPage(row.item)"
                                                                        />
                                                                        <b-pagination
                                                                            v-if="w.getGenesForFactor(row.item.phenotype, row.item.factor).length > w.subtablePerPage"
                                                                            v-model="w.subtableCurrentPages[w.getRowKey(row.item)]"
                                                                            class="pagination-sm justify-content-center mt-2"
                                                                            :total-rows="w.getGenesForFactor(row.item.phenotype, row.item.factor).length"
                                                                            :per-page="w.subtablePerPage"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </template>
                                                        </b-table>
                                                        <b-pagination
                                                            v-if="(w.isPhenotypePath ? w.remainingFactorDataTableRowsWithRationaleMeta.length : w.remainingGeneSetClusterRows.length) > w.mainTablePerPage"
                                                            v-model="w.remainingTableCurrentPage"
                                                            class="pagination-sm justify-content-center mt-2"
                                                            :total-rows="w.isPhenotypePath ? w.remainingFactorDataTableRowsWithRationaleMeta.length : w.remainingGeneSetClusterRows.length"
                                                            :per-page="w.mainTablePerPage"
                                                        />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                            </div>
    </div>
</template>

<script>
import FactorBaseRevealNetwork from "../FactorBaseRevealNetwork2.vue";

export default {
    name: "WorkflowResultsPanel",
    components: { FactorBaseRevealNetwork },
    inject: {
        mqWorkflow: { default: null },
    },
    computed: {
        w() {
            return this.mqWorkflow;
        },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
