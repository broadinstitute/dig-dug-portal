<template>
    <div style="display:flex; flex-direction: column; gap: 12px;">
<div
                                v-if="isMechanismHypothesisLoading"
                                class="d-flex align-items-center gap-2 my-2"
                                style="color: #555;"
                            >
                                <b-spinner small></b-spinner>
                                <span class="font-weight-bold">LLM: Generating mechanistic hypotheses</span>
                                <span v-if="revealHypothesisStep" class="text-muted">{{ helpers.formatTime(revealHypothesisStep.time) || helpers.currStepTime(revealHypothesisStep) }}</span>
                            </div>
                            <div
                                v-if="!isMechanismHypothesisLoading && errorMechanisms"
                                class="alert alert-danger d-flex align-items-center justify-content-between mt-2"
                                role="alert"
                            >
                                <span>{{ errorMsgMechanisms }}</span>
                                <button type="button" class="btn btn-sm btn-primary" @click="$emit('retry-hypotheses')">Retry</button>
                            </div>
                            <div v-if="!isMechanismHypothesisLoading && showMechanismResultsPanel">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="font-weight-bold" style="color: #FF6600;">
                                    <template v-if="mechanisms && mechanisms.length">Generated {{ mechanisms.length }} mechanistic hypotheses.</template>
                                    <template v-else>Mechanistic hypotheses</template>
                                </div>
                                <button
                                    v-if="canDownloadMechanismReport"
                                    class="btn btn-outline-secondary btn-sm"
                                    @click="$emit('download-report')"
                                >
                                    Download report
                                </button>
                            </div>
                            <div
                                v-if="mechanismDiagnosticAssessment && mechanismDiagnosticAssessment.warning_flag"
                                class="alert alert-warning mb-3"
                                role="status"
                            >
                                <div class="font-weight-bold text-dark mb-1">Diagnostic warning</div>
                                <div class="mb-0">{{ mechanismDiagnosticAssessment.warning_flag }}</div>
                                <div
                                    v-if="mechanismDiagnosticAssessment.suggested_optimized_query"
                                    class="mt-2 pt-2 border-top"
                                    style="border-color: rgba(0,0,0,0.08) !important;"
                                >
                                    <div class="font-weight-bold mb-1">Suggested optimized query</div>
                                    <div class="text-dark mb-2" style="white-space: pre-wrap;">{{ mechanismDiagnosticAssessment.suggested_optimized_query }}</div>
                                    <button
                                        type="button"
                                        class="btn btn-cfde btn-sm"
                                        @click="$emit('apply-suggested-query', mechanismDiagnosticAssessment.suggested_optimized_query)"
                                    >
                                        Use this query and run Reveal
                                    </button>
                                </div>
                            </div>
                            <div
                                v-if="mechanismDiagnosticAssessment && mechanismDiagnosticAssessment.can_generate_hypothesis === false"
                                class="alert alert-secondary border mb-3"
                                role="status"
                            >
                                <div class="font-weight-bold text-dark mb-1">No hypothesis generated (diagnostic assessment)</div>
                                    <p class="mb-0">{{ mechanismDiagnosticAssessment.rejection_reason || (isGeneSetEntryMode ? "The model declined to invent connections not supported by the factorization feed." : "The model declined to invent connections not supported by the retrieved graph.") }}</p>
                                <div
                                    v-if="hypothesisGenerationMode === 'strict'"
                                    class="mt-2 pt-2 border-top"
                                    style="border-color: rgba(0,0,0,0.08) !important;"
                                >
                                    <p class="mb-2">
                                        <template v-if="isGeneSetEntryMode">
                                            Strict factorization rules blocked a mechanism. You can run again in <strong>Relaxed</strong> mode to ask the model for a best-effort, explicitly warned hypothesis (still grounded in the slim gene-set feed).
                                        </template>
                                        <template v-else>
                                            Retrieval and strict graph rules blocked a mechanism. You can run again in <strong>Relaxed</strong> mode to ask the model for a best-effort, explicitly warned hypothesis (still grounded in the retrieved CSV).
                                        </template>
                                    </p>
                                    <button type="button" class="btn btn-cfde btn-sm" @click="$emit('retry-hypotheses-relaxed')">
                                        Try in relaxed (exploratory) mode
                                    </button>
                                </div>
                                <div v-if="mechanismDiagnosticAssessment.suggested_optimized_query" class="mt-2 pt-2 border-top">
                                    <div class="font-weight-bold mb-1">Suggested optimized query</div>
                                    <div class="text-dark mb-2" style="white-space: pre-wrap;">{{ mechanismDiagnosticAssessment.suggested_optimized_query }}</div>
                                    <button
                                        type="button"
                                        class="btn btn-cfde btn-sm"
                                        @click="$emit('apply-suggested-query', mechanismDiagnosticAssessment.suggested_optimized_query)"
                                    >
                                        Use this query and run Reveal
                                    </button>
                                </div>
                            </div>
                            <div v-if="mechanismResultsDetailVisible">
                            <div class="section-header d-flex justify-content-between align-items-start mb-2" @click="displayMechanisms = !displayMechanisms">
                                <div v-if="researchContext" class="text-muted">In the context of <strong>{{ researchContext }}</strong></div>
                                <!--<span class="small text-muted">{{ displayMechanisms ? 'show less' : 'show more' }}</span>-->
                            </div>
                            <div :class="{ collapsed: !displayMechanisms }" class="criteria-detail">
                                <div v-if="reportSessionSummary !== '—'" class="mb-4">
                                    <strong class="d-block mb-2 mechanism-card-title">Summary</strong>
                                    <div class="text-muted">{{ reportSessionSummary }}</div>
                                </div>
                                <div class="d-flex flex-column gap-4" style="gap:40px;">
                                    <div
                                        v-for="(mechanism, idx) in mechanisms"
                                        :key="idx"
                                        class="mechanism-card rounded border shadow-sm bg-light overflow-hidden"
                                    >
                                        <div
                                            v-if="hypothesisLastRunMode === 'relaxed' || mechanismDiagnosticAssessment && mechanismDiagnosticAssessment.exploratory_mode === true"
                                            class="px-3 py-2 mb-0 border-bottom"
                                            style="background: #fff8e6; border-color: #f0d060 !important; color: #5c4a00;"
                                            role="status"
                                        >
                                            <strong>Exploratory hypothesis.</strong>
                                            <template v-if="isGeneSetEntryMode">
                                                This run used relaxed mode: check diagnostic warnings—interpretation may bridge sparse gene set cluster membership not proven by dense gene-set overlap.
                                            </template>
                                            <template v-else>
                                                This run used relaxed mode: check diagnostic warnings and Biolink map edge validation—speculative interpretation may bridge gaps not proven by single-hop graph evidence.
                                            </template>
                                        </div>
                                        <div class="mechanism-card-header px-3 py-3 bg-secondary text-white d-flex align-items-center flex-wrap gap-2">
                                            <div class="mechanism-card-title">{{ mechanism.group_name }}</div>
                                        </div>
                                        <div style="display:flex; flex-direction: column; gap:20px; padding:20px">
                                            <!-- Shared single-column card (gene-set + free-text aligned) -->
                                            <div
                                                class="mechanism-hypothesis-block"
                                                :class="{ 'has-pathway-shift': !!mechanism.pathway_shift_rationale }"
                                            >
                                                <div class="mechanism-hypothesis-main">
                                                    <div class="mechanism-section-label mb-1">Mechanistic hypothesis</div>
                                                    <div>{{ mechanism.hypothesis }}</div>
                                                    <div
                                                        v-if="isGeneSetEntryMode && mechanism.rationale"
                                                        class="mt-3"
                                                    >
                                                        <div class="mechanism-section-label mb-1">Biological rationale</div>
                                                        <div>{{ mechanism.rationale }}</div>
                                                    </div>
                                                    <div
                                                        v-else-if="!isGeneSetEntryMode && (mechanism.novelty_explanation || mechanism.novelty)"
                                                        class="mt-3"
                                                    >
                                                        <div class="mechanism-section-label mb-1">Rationale</div>
                                                        <div>{{ mechanism.novelty_explanation || mechanism.novelty }}</div>
                                                    </div>
                                                </div>
                                                <div
                                                    v-if="mechanism.pathway_shift_rationale"
                                                    class="mechanism-hypothesis-shift alert alert-warning py-2 px-3 mb-0"
                                                    role="status"
                                                >
                                                    <strong>Why the hypothesis shifted:</strong>
                                                    {{ mechanism.pathway_shift_rationale }}
                                                </div>
                                            </div>
                                            <div v-if="!isGeneSetEntryMode && mechanism.relevance">
                                                <div class="mechanism-section-label mb-1">Relevance</div>
                                                <div>{{ mechanism.relevance }}</div>
                                            </div>
                                            <div
                                                v-if="mechanism.core_spine_network && mechanism.core_spine_network.nodes && mechanism.core_spine_network.nodes.length"
                                            >
                                                <div class="mechanism-section-label mb-2">
                                                    Hypothesis map (biological mechanism)
                                                </div>
                                                <div
                                                    v-if="mechanism.hypothesis_in_kg && mechanism.hypothesis_in_kg.caption"
                                                    class="mechanism-hypothesis-caption mb-2"
                                                >
                                                    <span
                                                        v-for="(seg, sidx) in splitHypothesisCaption(mechanism.hypothesis_in_kg.caption)"
                                                        :key="'cap-' + idx + '-' + sidx"
                                                        class="mechanism-hypothesis-caption-item"
                                                    >
                                                        <span
                                                            v-if="sidx > 0"
                                                            class="mechanism-hypothesis-caption-sep"
                                                            aria-hidden="true"
                                                        >→</span>
                                                        <span class="pill mechanism-hypothesis-caption-pill">{{ seg }}</span>
                                                    </span>
                                                </div>
                                                <div style="min-height: 220px;">
                                                    <factor-base-reveal-network
                                                        :ref="'mechanismHypothesisMap-' + idx"
                                                        :key="'core-spine-' + idx + '-' + (mechanism.group_name || '')"
                                                        :network="mechanism.core_spine_network"
                                                        :genes="mechanism.candidate_genes || mechanism.genes || []"
                                                        :width="640"
                                                        :height="280"
                                                        :show-popup-button="true"
                                                        :is-mechanism-flow-map="true"
                                                        :is-biolink-map="helpers.isMechanismUsingBiolinkMap(mechanism)"
                                                        :show-hypothesis-map-view-toggle="helpers.hasMechanismBiolinkNetwork(mechanism)"
                                                        :show-original-hypothesis-map="!helpers.isMechanismUsingBiolinkMap(mechanism)"
                                                        @hypothesis-original-map="
                                                            $emit('set-mechanism-map-view', idx, $event ? 'original' : 'biolink')
                                                        "
                                                        @open-popup="$emit('open-network-popup', { index: idx, hypothesisMap: true })"
                                                    />
                                                </div>
                                                <p
                                                    v-if="helpers.isMechanismUsingBiolinkMap(mechanism)"
                                                    class="text-muted mt-2 mb-0"
                                                >
                                                    Nodes in this view are mapped to Biolink Model categories (classes), and edges are labeled with Biolink predicates to standardize relationship types across knowledge graphs.
                                                    Edge support is then checked through the NCATS Biomedical Data Translator using TRAPI queries against Translator knowledge sources.
                                                </p>
                                            </div>
                                            <div
                                                v-if="
                                                    (mechanism.associated_factor_ids && mechanism.associated_factor_ids.length) ||
                                                    (mechanism.cited_gene_set_names && mechanism.cited_gene_set_names.length) ||
                                                    (mechanism.relevant_gene_sets && mechanism.relevant_gene_sets.length) ||
                                                    (mechanism.associated_pairs && mechanism.associated_pairs.length) ||
                                                    (!isGeneSetEntryMode && mechanism.relevant_phenotypes && mechanism.relevant_phenotypes.length) ||
                                                    (!isGeneSetEntryMode && mechanism.redundant_associated_pairs && mechanism.redundant_associated_pairs.length)
                                                "
                                                class="mechanism-evidence-columns"
                                            >
                                                <div
                                                    v-if="
                                                        (!isGeneSetEntryMode && mechanism.relevant_phenotypes && mechanism.relevant_phenotypes.length) ||
                                                        (mechanism.associated_factor_ids && mechanism.associated_factor_ids.length) ||
                                                        (mechanism.associated_pairs && mechanism.associated_pairs.length)
                                                    "
                                                    class="mechanism-evidence-half"
                                                >
                                                    <div
                                                        v-if="!isGeneSetEntryMode && mechanism.relevant_phenotypes && mechanism.relevant_phenotypes.length"
                                                    >
                                                        <div class="mechanism-section-label mb-1">Relevant phenotypes</div>
                                                        <div class="reveal-evidence-chips">
                                                            <div
                                                                v-for="(phenotypeLabel, pidx) in helpers.getRelevantPhenotypesDisplay(mechanism.relevant_phenotypes)"
                                                                :key="'mech-' + idx + '-rphen-' + pidx + '-' + (phenotypeLabel || '')"
                                                                class="pill text-white"
                                                                :style="`background:${nodeColors.Phenotype}`"
                                                            >
                                                                {{ phenotypeLabel }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        v-if="mechanism.associated_factor_ids && mechanism.associated_factor_ids.length"
                                                        :class="{ 'mt-3': !isGeneSetEntryMode && mechanism.relevant_phenotypes && mechanism.relevant_phenotypes.length }"
                                                    >
                                                        <div class="mechanism-section-label mb-1">Associated gene set clusters</div>
                                                        <div class="reveal-evidence-chips">
                                                            <div
                                                                v-for="(fid, fidx) in mechanism.associated_factor_ids"
                                                                :key="'mech-' + idx + '-afid-' + fidx + '-' + fid"
                                                                class="pill text-white"
                                                                :style="`background:${nodeColors.Factor || '#6c757d'}`"
                                                                :title="String(fid)"
                                                            >
                                                                {{ helpers.getGeneSetFactorDisplayLabel(fid) }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        v-else-if="mechanism.associated_pairs && mechanism.associated_pairs.length"
                                                        :class="{ 'mt-3': !isGeneSetEntryMode && mechanism.relevant_phenotypes && mechanism.relevant_phenotypes.length }"
                                                    >
                                                        <div class="mechanism-section-label mb-1">Associated gene set clusters</div>
                                                        <div class="reveal-evidence-chips">
                                                            <div
                                                                v-for="(pair, ridx) in mechanism.associated_pairs"
                                                                :key="'mech-' + idx + '-ap-' + ridx + '-' + (pair.factor || '')"
                                                                class="pill text-white"
                                                                :style="`background:${nodeColors.Factor || '#6c757d'}`"
                                                                :title="String(pair.factor || pair.phenotype || '')"
                                                            >
                                                                {{ helpers.getGeneSetFactorDisplayLabel(pair.factor || pair.phenotype) }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    v-if="(mechanism.cited_gene_set_names && mechanism.cited_gene_set_names.length) || (mechanism.relevant_gene_sets && mechanism.relevant_gene_sets.length)"
                                                    class="mechanism-evidence-half"
                                                >
                                                    <div class="mechanism-section-label mb-1">{{ isGeneSetEntryMode ? 'Cited gene sets' : 'Cited / relevant gene sets' }}</div>
                                                    <div style="white-space: normal; display:flex; flex-direction: column; gap:6px">
                                                        <div
                                                            v-for="set in helpers.formatRelevantGeneSetsForDisplay(mechanism.cited_gene_set_names && mechanism.cited_gene_set_names.length ? mechanism.cited_gene_set_names : mechanism.relevant_gene_sets)"
                                                            :key="'mech-' + idx + '-cgs-' + set.gs"
                                                        >
                                                            <div style="display:flex; gap:10px; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
                                                                <a
                                                                    :href="helpers.cfdeExploreGeneSetHref(mechanism, set.gs, set.program)"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    class="pill text-white text-decoration-none cfde-explore-geneset-link"
                                                                    style="overflow: clip; text-overflow: ellipsis; max-width: 360px;"
                                                                    :style="`background:${nodeColors.Pathway}`"
                                                                    :title="set.desc || set.gs"
                                                                >{{ set.gs }}</a>
                                                                <div class="d-flex flex-wrap align-items-center fbr-relevant-geneset-programs" style="gap:6px; max-width: min(100%, 560px); justify-content: flex-end;">
                                                                    <template v-if="helpers.c2m2GeneSetDownloadNodes(set.gs).length">
                                                                        <div class="fbr-program-download-wrap">
                                                                            <div
                                                                                class="pill text-white d-inline-flex align-items-center fbr-program-download-trigger"
                                                                                :style="{ background: nodeColors.GeneSetProgramDownloads }"
                                                                                role="button"
                                                                                tabindex="0"
                                                                                :title="(set.program || 'Data files') + ' — hover for download links'"
                                                                            >
                                                                                <span class="fbr-program-download-label">{{ set.program || "Data files" }}</span>
                                                                                <b-icon icon="three-dots-vertical" class="fbr-program-download-icon ml-1 flex-shrink-0" aria-hidden="true" />
                                                                            </div>
                                                                            <div class="fbr-program-download-menu border rounded bg-white shadow-sm">
                                                                                <div class="fbr-program-download-menu-heading px-2 pt-2 pb-1 text-muted text-uppercase">Open or download</div>
                                                                                <a
                                                                                    v-for="(pn, nidx) in helpers.c2m2GeneSetDownloadNodes(set.gs)"
                                                                                    :key="'mech-' + idx + '-cgs-prov-' + set.gs + '-' + nidx + '-' + pn.id"
                                                                                    :href="pn.dcc_url"
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    class="fbr-provenance-menu-link d-block px-2 py-1 text-dark text-decoration-none"
                                                                                >{{ pn.id }}</a>
                                                                            </div>
                                                                        </div>
                                                                    </template>
                                                                    <span
                                                                        v-else-if="helpers.c2m2ProvenanceEntry(set.gs) && helpers.c2m2ProvenanceEntry(set.gs).status === 'loading'"
                                                                        class="text-muted"
                                                                    >Provenance…</span>
                                                                    <template v-else>
                                                                        <div v-if="set.program" class="pill">{{ set.program }}</div>
                                                                    </template>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    v-if="!isGeneSetEntryMode && mechanism.redundant_associated_pairs && mechanism.redundant_associated_pairs.length"
                                                    class="mechanism-evidence-full"
                                                >
                                                    <div class="mechanism-section-label mb-1">Related data categories</div>
                                                    <div class="reveal-evidence-chips">
                                                        <div
                                                            v-for="(pair, ridx) in mechanism.redundant_associated_pairs"
                                                            :key="'mech-' + idx + '-red-' + ridx + '-' + (pair.factor || '')"
                                                            class="pill"
                                                            style="background:#e2e3e5; color:#383d41;"
                                                        >
                                                            {{ helpers.getPhenotypeDisplay(pair.phenotype) }} - {{ helpers.getFactorClusterDisplayString(pair.factor) }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                v-if="(mechanism.candidate_genes && mechanism.candidate_genes.length) || (mechanism.genes && mechanism.genes.length)"
                                            >
                                                <div class="mechanism-section-label mb-2">Candidate genes ({{ (mechanism.candidate_genes || mechanism.genes || []).length }})</div>
                                                <!-- Gene-set columns -->
                                                <b-table
                                                    v-if="isGeneSetEntryMode"
                                                    striped
                                                    hover
                                                    responsive="sm"
                                                    head-variant="light"
                                                    :items="mechanism.candidate_genes || mechanism.genes || []"
                                                    :fields="[
                                                        { key: 'gene', label: 'Gene', thStyle: { width: '90px' }},
                                                        { key: 'group', label: 'Gene role', thStyle: { width: '200px' } },
                                                        { key: 'in_search', label: 'In search', thStyle: { width: '80px' } },
                                                        { key: 'reason', label: 'Reason' },
                                                        { key: 'gene_sets', label: 'Cited gene sets', thStyle: { width: '180px' } },
                                                        { key: 'scores_factor_relevance', label: 'Gene set cluster relevance', thStyle: { width: '110px' } },
                                                        { key: 'scores_gene_score', label: 'Gene score', thStyle: { width: '90px' } }
                                                    ]"
                                                >
                                                    <template #head(reason)>
                                                        Reason
                                                    </template>
                                                    <template #cell(in_search)="row">
                                                        {{ helpers.isGeneInSearchSet(row.item) === true ? 'Yes' : (helpers.isGeneInSearchSet(row.item) === false ? 'No' : '—') }}
                                                    </template>
                                                    <template #cell(scores_factor_relevance)="row">
                                                        {{ row.item.scores && (row.item.scores.factor_relevance != null || row.item.scores.combined != null) ? Number(row.item.scores.factor_relevance ?? row.item.scores.combined).toFixed(3) : '—' }}
                                                    </template>
                                                    <template #cell(scores_gene_score)="row">
                                                        {{ row.item.scores && (row.item.scores.gene_score != null || row.item.scores.functional != null) ? Number(row.item.scores.gene_score ?? row.item.scores.functional).toFixed(3) : '—' }}
                                                    </template>
                                                    <template #cell(reason)="row">
                                                        {{ row.item.reason != null ? row.item.reason : row.item.role }}
                                                    </template>
                                                    <template #cell(gene)="row">
                                                        <span
                                                            class="pill mechanism-gene-symbol"
                                                            :style="helpers.mechanismGeneGroupPillStyle(row.item.group)"
                                                        >{{ row.item.gene }}</span>
                                                    </template>
                                                    <template #cell(gene_sets)="row">
                                                        <span class="mechanism-gene-sets-cell">
                                                            {{
                                                                helpers.formatGeneSetNamesForTableWrap(
                                                                    visibleCandidateGeneSets(mechanism, row.item.gene, idx)
                                                                )
                                                            }}
                                                            <button
                                                                v-if="getCandidateGeneSetsList(mechanism, row.item.gene).length > 5"
                                                                type="button"
                                                                class="mechanism-gene-sets-toggle"
                                                                :aria-expanded="isCandidateGeneSetsExpanded(idx, row.item.gene) ? 'true' : 'false'"
                                                                :aria-label="isCandidateGeneSetsExpanded(idx, row.item.gene) ? 'Show fewer gene sets' : 'Show more gene sets'"
                                                                @click="toggleCandidateGeneSets(idx, row.item.gene)"
                                                            >{{ isCandidateGeneSetsExpanded(idx, row.item.gene) ? '-' : '+' }}</button>
                                                        </span>
                                                    </template>
                                                    <template #cell(group)="row">
                                                        {{ row.item.group || "—" }}
                                                    </template>
                                                </b-table>
                                                <!-- Free-text columns -->
                                                <b-table
                                                    v-else
                                                    class="mechanism-candidate-genes-table"
                                                    striped
                                                    hover
                                                    responsive="sm"
                                                    head-variant="light"
                                                    :items="mechanism.candidate_genes || mechanism.genes || []"
                                                    :fields="[
                                                        { key: 'gene', label: 'Gene', thStyle: { width: '15%' }, tdClass: 'align-top' },
                                                        { key: 'group', label: 'Gene role', thStyle: { width: '20%' }, tdClass: 'align-top' },
                                                        { key: 'reason', label: 'Reason', thStyle: { width: '20%' }, tdClass: 'align-top' },
                                                        { key: 'gene_sets', label: 'Gene sets (selected row)', thStyle: { width: '45%' }, tdClass: 'align-top' }
                                                    ]"
                                                >
                                                    <template #head(reason)>
                                                        Reason
                                                    </template>
                                                    <template #cell(reason)="row">
                                                        {{ row.item.reason != null ? row.item.reason : row.item.role }}
                                                    </template>
                                                    <template #cell(gene)="row">
                                                        <span
                                                            class="pill mechanism-gene-symbol"
                                                            :style="helpers.mechanismGeneGroupPillStyle(row.item.group)"
                                                        >{{ row.item.gene }}</span>
                                                    </template>
                                                    <template #cell(gene_sets)="row">
                                                        <span class="mechanism-gene-sets-cell">
                                                            {{
                                                                helpers.formatGeneSetNamesForTableWrap(
                                                                    visibleCandidateGeneSets(mechanism, row.item.gene, idx)
                                                                )
                                                            }}
                                                            <button
                                                                v-if="getCandidateGeneSetsList(mechanism, row.item.gene).length > 5"
                                                                type="button"
                                                                class="mechanism-gene-sets-toggle"
                                                                :aria-expanded="isCandidateGeneSetsExpanded(idx, row.item.gene) ? 'true' : 'false'"
                                                                :aria-label="isCandidateGeneSetsExpanded(idx, row.item.gene) ? 'Show fewer gene sets' : 'Show more gene sets'"
                                                                @click="toggleCandidateGeneSets(idx, row.item.gene)"
                                                            >{{ isCandidateGeneSetsExpanded(idx, row.item.gene) ? '-' : '+' }}</button>
                                                        </span>
                                                    </template>
                                                    <template #cell(group)="row">
                                                        {{ row.item.group || "—" }}
                                                    </template>
                                                </b-table>
                                            </div>
                                            <div v-if="!isGeneSetEntryMode && mechanism.genes_collective_reason">
                                                <div class="mechanism-section-label mb-1">Genes collective reason</div>
                                                <div class="bg-warning bg-opacity-25 p-2 rounded">{{ mechanism.genes_collective_reason }}</div>
                                            </div>
                                            <div
                                                v-if="!isGeneSetEntryMode && (mechanism.supporting_network || mechanism.network) && ((mechanism.supporting_network || mechanism.network).nodes || (mechanism.supporting_network || mechanism.network).edges)"
                                            >
                                                <div class="mechanism-section-label mb-2">Supporting network</div>
                                                <div class="text-muted mb-2">
                                                    {{ ((mechanism.supporting_network || mechanism.network).nodes || []).length }} nodes,
                                                    {{ ((mechanism.supporting_network || mechanism.network).edges || []).length }} edges
                                                </div>
                                                <div style="min-height: 220px;">
                                                    <factor-base-reveal-network
                                                        :key="'support-' + (mechanism.group_name || idx)"
                                                        :ref="'mechanismNetwork-' + idx"
                                                        :network="mechanism.supporting_network || mechanism.network"
                                                        :genes="mechanism.candidate_genes || mechanism.genes || []"
                                                        :width="640"
                                                        :height="360"
                                                        :show-popup-button="true"
                                                        keep-physics-enabled
                                                        :use-gene-role-colors="false"
                                                        highlight-anchor-genes
                                                        @open-popup="$emit('open-network-popup', { index: idx, hypothesisMap: false })"
                                                    />
                                                </div>
                                            </div>
                                            <div v-if="mechanism.next_steps && mechanism.next_steps.length" class="mt-2 mb-1 border-top pt-3">
                                                <div class="mechanism-section-label mb-2">Recommended next steps</div>
                                                <div class="d-flex flex-column" style="gap:8px">
                                                    <div
                                                        v-for="(step, sidx) in mechanism.next_steps"
                                                        :key="'step-' + idx + '-' + sidx"
                                                        class="p-2 border rounded bg-white"
                                                        style="border-left: 4px solid #f16822 !important;"
                                                    >
                                                        <span class="badge badge-secondary mr-2 mb-1">{{ step.category }}</span><br />
                                                        <strong class="text-dark">{{ step.action }}</strong>
                                                        <span class="text-muted"> {{ step.reason }}</span>
                                                        <div
                                                            v-if="helpers.isNextStepExperimentalValidation(step)"
                                                            class="mt-2"
                                                        >
                                                            <button
                                                                type="button"
                                                                class="btn btn-cfde btn-sm"
                                                                @click.stop="$emit('open-design-protocol', mechanism, step)"
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
                                                <div class="mechanism-section-label mb-1">Explore further (next queries)</div>
                                                <ul class="reveal-alt-query-links mb-0">
                                                    <li
                                                        v-for="(query, qidx) in mechanism.next_queries"
                                                        :key="'nq-' + idx + '-' + qidx"
                                                    >
                                                        <a
                                                            href="#"
                                                            class="reveal-alt-query-link"
                                                            @click.prevent="$emit('select-alternative-query', query)"
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
                                                    @click.stop="$emit('copy-mechanism-for-llm', mechanism, idx)"
                                                >
                                                    <b-icon icon="clipboard" class="mr-1"></b-icon>
                                                    {{ handoffCopiedMechanismIndex === idx ? 'Copied!' : 'Copy for LLM' }}
                                                </button>
                                                <button
                                                    type="button"
                                                    class="btn btn-sm btn-outline-secondary"
                                                    @click.stop="$emit('download-mechanism-handoff', mechanism, idx)"
                                                >
                                                    <b-icon icon="download" class="mr-1"></b-icon>
                                                    Download handoff data
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Remaining: included pairs not yet cited in hypothesis evidence -->
                                    <div
                                        v-if="remainingRows.length"
                                        class="remaining-gene-clusters mt-5 pt-4 border-top"
                                    >
                                        <div class="font-weight-bold mb-2" style="color: #FF6600;">
                                            Remaining gene set clusters
                                        </div>
                                        <p class="text-muted mb-3">
                                            These phenotype-gene set cluster pairs were included in your data selection but are not yet covered by supporting evidence in the generated hypotheses.
                                        </p>
                                        <div v-if="remainingPairGenerateError" class="alert alert-danger mb-3" role="alert">
                                            {{ remainingPairGenerateError }}
                                        </div>
                                        <div class="criteria-detail">
                                            <div>
                                                        <b-table-simple v-if="isPhenotypePath" striped hover class="mb-0">
                                                            <thead variant="light">
                                                                <tr>
                                                                    <th style="width: 72px;">Included</th>
                                                                    <th style="width: auto;">Phenotype</th>
                                                                    <th style="width: auto;">Gene set cluster</th>
                                                                    <th style="width: 300px;">Genes and gene sets in cluster</th>
                                                                    <th style="width: 130px;">Hypothesis</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody v-for="row in remainingFactorTableRowsPaged" :key="'rem-' + helpers.getRowKey(row)">
                                                                <tr>
                                                                    <td>
                                                                        <div class="text-center">
                                                                            <input type="checkbox" :checked="row.included" class="form-check-input d-inline-block" aria-label="Included" />
                                                                        </div>
                                                                    </td>
                                                                    <td>{{ helpers.getPhenotypeDisplay(row.phenotype) }}</td>
                                                                    <td>{{ helpers.getFactorClusterDisplay(row) }}</td>
                                                                    <td style="text-align: center;">
                                                                        <button
                                                                            class="btn btn-sm btn-outline-primary"
                                                                            @click="$emit('toggle-factor-row', { item: row })"
                                                                        >
                                                                            {{ helpers.isFactorRowExpanded(row) ? 'Hide' : 'Show' }}
                                                                        </button>
                                                                    </td>
                                                                    <td class="text-center align-middle">
                                                                        <button
                                                                            type="button"
                                                                            class="btn btn-sm btn-cfde"
                                                                            :disabled="generatingRemainingRowKey === helpers.getRowKey(row)"
                                                                            @click="$emit('generate-remaining-pair', row)"
                                                                        >
                                                                            <b-spinner v-if="generatingRemainingRowKey === helpers.getRowKey(row)" small class="mr-1"></b-spinner>
                                                                            <template v-if="generatingRemainingRowKey === helpers.getRowKey(row)">Generating… {{ helpers.formatRemainingGenerateElapsed() }}</template>
                                                                            <template v-else>Generate</template>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                                <tr v-if="helpers.isFactorRowExpanded(row)">
                                                                    <td colspan="5" class="p-0 border-0">
                                                                        <div class="bg-light" style="display:flex; gap: 20px; flex-wrap: wrap;">
                                                                            <div class="px-3 pt-2 pb-0 w-100">
                                                                                <factor-base-reveal-network
                                                                                    v-if="helpers.getFactorConnectivityNetwork(row) && helpers.getFactorConnectivityNetwork(row).nodes.length"
                                                                                    :network="helpers.getFactorConnectivityNetwork(row)"
                                                                                    :height="220"
                                                                                    :show-popup-button="true"
                                                                                    keep-physics-enabled
                                                                                    gene-node-metric-key="gwas_support"
                                                                                    gene-color-by-gwas-support
                                                                                    edge-distance-metric-key="functional_support"
                                                                                    @open-popup="$emit('open-factor-connectivity', row)"
                                                                                />
                                                                            </div>
                                                                            <div v-if="helpers.getGenesetForFactor(row.phenotype, row.factor)" class="py-2 px-3" style="display:flex; flex:1; flex-direction: column;">
                                                                                <div class="text-muted mb-2">Gene sets in cluster</div>
                                                                                <b-table
                                                                                    striped
                                                                                    hover
                                                                                    responsive="sm"
                                                                                    head-variant="light"
                                                                                    :items="helpers.getGenesetForFactor(row.phenotype, row.factor)"
                                                                                    :fields="[
                                                                                        { key: 'geneset', label: 'Gene Set', thClass: 'text-nowrap'},
                                                                                        { key: 'program', label: 'Program', thClass: 'text-nowrap'},
                                                                                        { key: 'actions', label: 'Source Data', thClass: 'text-nowrap'}
                                                                                    ]"
                                                                                >
                                                                                    <template #cell(geneset)="gRow">
                                                                                        <a
                                                                                            :href="helpers.cfdeExploreAssociationHref(row.phenotype, gRow.item.geneset, gRow.item.program)"
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
                                                                                            @click="$emit('gene-set-row-toggle', gRow)"
                                                                                        >
                                                                                            {{ gRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                                        </button>
                                                                                    </template>
                                                                                    <template #row-details="gRow">
                                                                                        <div style="padding: 10px;">
                                                                                            <div v-if="geneSetSources[gRow.item.geneset]">
                                                                                                <b-card>
                                                                                                    <a :href="geneSetSources[gRow.item.geneset].geneSetUrl" target="_blank">{{ geneSetSources[gRow.item.geneset].geneSet }}</a>
                                                                                                    <ul>
                                                                                                        <li v-for="(rel, i) in geneSetSources[gRow.item.geneset].relations" :key="i" class="text-muted">
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
                                                                                <div v-if="loadingGenesForFactor[helpers.getRowKey(row)]" class="text-muted mb-2">Loading genes…</div>
                                                                                <div class="text-muted mb-2">Genes share membership with anchor gene(s)</div>
                                                                                <b-table
                                                                                    v-if="!loadingGenesForFactor[helpers.getRowKey(row)]"
                                                                                    striped
                                                                                    hover
                                                                                    responsive="sm"
                                                                                    head-variant="light"
                                                                                    :items="helpers.getGenesForFactor(row.phenotype, row.factor)"
                                                                                    :fields="[
                                                                                        { key: 'gene', label: 'Gene', thStyle: { width: '100px' } },
                                                                                        { key: 'combined', label: 'Combined score', thStyle: { width: '110px' } },
                                                                                        { key: 'gwasSupport', label: 'GWAS support', thStyle: { width: '110px' } },
                                                                                        { key: 'geneSetSupport', label: 'Functional support', thStyle: { width: '120px' } }
                                                                                    ]"
                                                                                    :per-page="subtablePerPage"
                                                                                    :current-page="helpers.getSubtableCurrentPage(row)"
                                                                                />
                                                                                <b-pagination
                                                                                    v-if="!loadingGenesForFactor[helpers.getRowKey(row)] && helpers.getGenesForFactor(row.phenotype, row.factor).length > subtablePerPage"
                                                                                    :value="subtableCurrentPages[helpers.getRowKey(row)]" @input="$emit('update:subtable-page', { rowKey: helpers.getRowKey(row), page: $event })"
                                                                                    class="pagination-sm justify-content-center mt-2"
                                                                                    :total-rows="helpers.getGenesForFactor(row.phenotype, row.factor).length"
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
                                                                { key: 'hypothesis', label: 'Hypothesis', thStyle: { width: '130px' } }
                                                            ]"
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
                                                                {{ helpers.getPhenotypeDisplay(row.item.phenotype) }}
                                                            </template>
                                                            <template #cell(factorLabel)="row">
                                                                {{ helpers.getFactorClusterDisplay(row.item) }}
                                                            </template>
                                                            <template #cell(rationale)="row">
                                                                <span v-if="row.item.rationale" class="text-muted" style="white-space: normal;">{{ row.item.rationale }}</span>
                                                                <span v-else class="text-muted">—</span>
                                                            </template>
                                                            <template #cell(view_genes)="row">
                                                                <button
                                                                    class="btn btn-sm btn-outline-primary"
                                                                    @click="$emit('toggle-factor-row', row)"
                                                                >
                                                                    {{ helpers.isFactorRowExpanded(row.item) ? 'Hide' : 'Show' }}
                                                                </button>
                                                            </template>
                                                            <template #cell(hypothesis)="row">
                                                                <button
                                                                    type="button"
                                                                    class="btn btn-sm btn-cfde"
                                                                    :disabled="generatingRemainingRowKey === helpers.getRowKey(row.item)"
                                                                    @click="$emit('generate-remaining-pair', row.item)"
                                                                >
                                                                    <b-spinner v-if="generatingRemainingRowKey === helpers.getRowKey(row.item)" small class="mr-1"></b-spinner>
                                                                    <template v-if="generatingRemainingRowKey === helpers.getRowKey(row.item)">Generating… {{ helpers.formatRemainingGenerateElapsed() }}</template>
                                                                    <template v-else>Generate</template>
                                                                </button>
                                                            </template>
                                                            <template #row-details="row">
                                                                <div class="bg-light" style="display:flex; gap: 20px; flex-wrap: wrap;">
                                                                    <div class="px-3 pt-2 pb-0 w-100">
                                                                        <factor-base-reveal-network
                                                                            v-if="helpers.getFactorConnectivityNetwork(row.item) && helpers.getFactorConnectivityNetwork(row.item).nodes.length"
                                                                            :network="helpers.getFactorConnectivityNetwork(row.item)"
                                                                            :height="220"
                                                                            :show-popup-button="true"
                                                                            keep-physics-enabled
                                                                            gene-node-metric-key="gwas_support"
                                                                            gene-color-by-gwas-support
                                                                            edge-distance-metric-key="functional_support"
                                                                            @open-popup="$emit('open-factor-connectivity', row.item)"
                                                                        />
                                                                    </div>
                                                                    <div v-if="helpers.getGenesetForFactor(row.item.phenotype, row.item.factor)" class="py-2 px-3" style="display:flex; flex:1; flex-direction: column;">
                                                                        <div class="text-muted mb-2">Gene sets in cluster</div>
                                                                        <b-table
                                                                            striped
                                                                            hover
                                                                            responsive="sm"
                                                                            head-variant="light"
                                                                            :items="helpers.getGenesetForFactor(row.item.phenotype, row.item.factor)"
                                                                            :fields="[
                                                                                { key: 'geneset', label: 'Gene Set', thClass: 'text-nowrap'},
                                                                                { key: 'program', label: 'Program', thClass: 'text-nowrap'},
                                                                                { key: 'actions', label: 'Source Data', thClass: 'text-nowrap'}
                                                                            ]"
                                                                        >
                                                                            <template #cell(geneset)="gRow">
                                                                                <a
                                                                                    :href="helpers.cfdeExploreAssociationHref(row.item.phenotype, gRow.item.geneset, gRow.item.program)"
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
                                                                                    @click="$emit('gene-set-row-toggle', gRow)"
                                                                                >
                                                                                    {{ gRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                                </button>
                                                                            </template>
                                                                            <template #row-details="gRow">
                                                                                <div style="padding: 10px;">
                                                                                    <div v-if="geneSetSources[gRow.item.geneset]">
                                                                                        <b-card>
                                                                                            <a :href="geneSetSources[gRow.item.geneset].geneSetUrl" target="_blank">{{ geneSetSources[gRow.item.geneset].geneSet }}</a>
                                                                                            <ul>
                                                                                                <li v-for="(rel, i) in geneSetSources[gRow.item.geneset].relations" :key="i" class="text-muted">
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
                                                                        <div class="text-muted mb-2">Genes share membership with anchor gene(s)</div>
                                                                        <b-table
                                                                            striped
                                                                            hover
                                                                            responsive="sm"
                                                                            head-variant="light"
                                                                            :items="helpers.getGenesForFactor(row.item.phenotype, row.item.factor)"
                                                                            :fields="[
                                                                                { key: 'gene', label: 'Gene', thStyle: { width: '100px' } },
                                                                                { key: 'combined', label: 'Combined score', thStyle: { width: '110px' } },
                                                                                { key: 'gwasSupport', label: 'GWAS support', thStyle: { width: '110px' } },
                                                                                { key: 'geneSetSupport', label: 'Functional support', thStyle: { width: '120px' } }
                                                                            ]"
                                                                            :per-page="subtablePerPage"
                                                                            :current-page="helpers.getSubtableCurrentPage(row.item)"
                                                                        />
                                                                        <b-pagination
                                                                            v-if="helpers.getGenesForFactor(row.item.phenotype, row.item.factor).length > subtablePerPage"
                                                                            :value="subtableCurrentPages[helpers.getRowKey(row.item)]" @input="$emit('update:subtable-page', { rowKey: helpers.getRowKey(row.item), page: $event })"
                                                                            class="pagination-sm justify-content-center mt-2"
                                                                            :total-rows="helpers.getGenesForFactor(row.item.phenotype, row.item.factor).length"
                                                                            :per-page="subtablePerPage"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </template>
                                                        </b-table>
                                                        <b-pagination
                                                            v-if="(isPhenotypePath ? remainingTableRowCount : remainingRows.length) > mainTablePerPage"
                                                            :value="remainingTableCurrentPage" @input="$emit('update:remainingTableCurrentPage', $event)"
                                                            class="pagination-sm justify-content-center mt-2"
                                                            :total-rows="isPhenotypePath ? remainingTableRowCount : remainingRows.length"
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
</template>


<script>
import FactorBaseRevealNetwork from "../FactorBaseRevealNetwork2.vue";

export default {
    name: "WorkflowResultsPanel",
    components: { FactorBaseRevealNetwork },
    props: {
        isMechanismHypothesisLoading: { type: Boolean, default: false },
        revealHypothesisStep: { type: Object, default: null },
        errorMechanisms: { type: Boolean, default: false },
        errorMsgMechanisms: { type: String, default: "" },
        showMechanismResultsPanel: { type: Boolean, default: false },
        mechanisms: { type: Array, default: () => [] },
        canDownloadMechanismReport: { type: Boolean, default: false },
        mechanismDiagnosticAssessment: { type: Object, default: null },
        hypothesisGenerationMode: { type: String, default: "strict" },
        mechanismResultsDetailVisible: { type: Boolean, default: true },
        displayMechanisms: { type: Boolean, default: true },
        researchContext: { type: String, default: "" },
        reportSessionSummary: { type: String, default: "—" },
        hypothesisLastRunMode: { type: String, default: null },
        remainingRows: { type: Array, default: () => [] },
        remainingFactorTableRowsPaged: { type: Array, default: () => [] },
        remainingGeneSetClusterRowsPaged: { type: Array, default: () => [] },
        remainingTableRowCount: { type: Number, default: 0 },
        remainingPairGenerateError: { type: String, default: "" },
        generatingRemainingRowKey: { type: String, default: "" },
        handoffCopiedMechanismIndex: { type: Number, default: -1 },
        isPhenotypePath: { type: Boolean, default: false },
        isGeneSetEntryMode: { type: Boolean, default: false },
        mainTablePerPage: { type: Number, default: 10 },
        remainingTableCurrentPage: { type: Number, default: 1 },
        subtablePerPage: { type: Number, default: 10 },
        subtableCurrentPages: { type: Object, default: () => ({}) },
        loadingGenesForFactor: { type: Object, default: () => ({}) },
        geneSetSources: { type: Object, default: () => ({}) },
        nodeColors: { type: Object, default: () => ({}) },
        helpers: { type: Object, required: true },
    },
    data() {
        return {
            /** Keys: `${mechanismIndex}:${gene}` → expanded gene-set list in candidate table. */
            expandedCandidateGeneSets: {},
        };
    },
    methods: {
        /** Split hypothesis map caption on arrows into pill segments. */
        splitHypothesisCaption(caption) {
            const raw = caption != null ? String(caption).trim() : "";
            if (!raw) return [];
            const parts = raw
                .split(/\s*(?:→|->|⇒)\s*/)
                .map((p) => p.trim())
                .filter(Boolean);
            return parts.length ? parts : [raw];
        },
        candidateGeneSetsKey(mechIdx, gene) {
            return `${mechIdx}:${gene != null ? String(gene) : ""}`;
        },
        getCandidateGeneSetsList(mechanism, gene) {
            const conn = this.helpers.getGeneConnectionForMechanism(mechanism, gene);
            return Array.isArray(conn && conn.gene_sets) ? conn.gene_sets : [];
        },
        isCandidateGeneSetsExpanded(mechIdx, gene) {
            return !!this.expandedCandidateGeneSets[this.candidateGeneSetsKey(mechIdx, gene)];
        },
        toggleCandidateGeneSets(mechIdx, gene) {
            const key = this.candidateGeneSetsKey(mechIdx, gene);
            this.$set(this.expandedCandidateGeneSets, key, !this.expandedCandidateGeneSets[key]);
        },
        visibleCandidateGeneSets(mechanism, gene, mechIdx) {
            const list = this.getCandidateGeneSetsList(mechanism, gene);
            if (list.length <= 5 || this.isCandidateGeneSetsExpanded(mechIdx, gene)) return list;
            return list.slice(0, 5);
        },
    },
};
</script>
<style src="./mqSharedStyles.css"></style>
