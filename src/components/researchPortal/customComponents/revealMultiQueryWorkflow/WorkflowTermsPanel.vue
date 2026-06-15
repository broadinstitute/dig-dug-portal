<template>
    <div style="display:flex; flex-direction: column; gap: 12px; color: #555;">
        <template v-if="extractionStep">
            <div style="display:flex; gap: 8px; align-items: center;">
                <b-spinner v-if="loadingSearchCriteria" small></b-spinner>
                <span v-else>♦</span>
                <span style="font-weight:bold">{{ extractionStep.title }}</span>
                <span>{{ extractionStepTimeLabel }}</span>
            </div>
            <div v-if="showTermsEditor" class="mt-2">
                <workflow-step-gate
                    v-if="gateActive && gateStepId === '1'"
                    tight
                    @continue="$emit('approve-gate')"
                >
                    Search terms and research context are extracted from your query. Please review terms, edit them if necessary. When you are ready, hit the Continue button.
                    <br />
                    We will use these terms to retrieve phenotype-gene set cluster and gene-set evidence data from the
                    <a
                        class="reveal-gate-link"
                        href="https://cfdeknowledge.org/r/kc_gsb?source=all&model=cfde"
                        target="_blank"
                        rel="noopener noreferrer"
                    >PIGEAN</a>
                    knowledge graph.
                </workflow-step-gate>
                <div
                    v-if="extractionAmbiguityCheck && extractionAmbiguityCheck.has_ambiguity && !extractionAmbiguityDismissed"
                    class="alert alert-warning py-2 px-3 reveal-extraction-section-gap"
                    role="alert"
                >
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="small pr-2">
                            <strong>Interpretation note:</strong>
                            {{ extractionAmbiguityCheck.warning_message }}
                            <div
                                v-if="extractionAmbiguityCheck.anti_anchor_terms && extractionAmbiguityCheck.anti_anchor_terms.length"
                                class="mt-1"
                            >
                                <strong>Detected anti-anchor terms:</strong>
                                {{ extractionAmbiguityCheck.anti_anchor_terms.join(", ") }}
                            </div>
                        </div>
                        <button
                            type="button"
                            class="close p-0 m-0"
                            aria-label="Dismiss"
                            @click="$emit('dismiss-ambiguity')"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                </div>
                <div v-if="usePerRouteSearchTermsEditor" class="reveal-shared-research-context-section">
                    <label class="small font-weight-bold text-muted mb-1 d-block">Shared research context</label>
                    <textarea
                        class="form-control form-control-sm"
                        :value="sharedResearchContext"
                        rows="4"
                        style="min-height: 6.5em; resize: vertical;"
                        placeholder="Enter research context"
                        :disabled="!termsEditable"
                        @input="$emit('update:sharedResearchContext', $event.target.value)"
                    ></textarea>
                </div>
                <div
                    v-if="multiQueryRoutes.length || alternativeQueries.length"
                    class="mt-3 d-flex flex-column flex-lg-row align-items-start"
                    style="gap: 16px;"
                >
                    <div v-if="multiQueryRoutes.length" style="flex: 1 1 70%; width: 100%;">
                        <div class="font-weight-bold small text-muted mb-2">Data retrieval directions</div>
                        <div class="d-flex flex-column" style="gap: 8px;">
                            <div
                                v-for="route in multiQueryRoutes"
                                :key="'multi-route-' + route.route_id"
                                class="p-2"
                            >
                                <div class="mb-1"><strong>{{ route.category }}</strong></div>
                                <div class="small mb-1">{{ route.biological_query_variation }}</div>
                                <div
                                    v-if="route.extracted_terms && route.extracted_terms.phenotype_terms && route.extracted_terms.phenotype_terms.length"
                                    class="small mb-1 d-flex flex-wrap align-items-baseline gap-1"
                                >
                                    <strong>Phenotypes:</strong>
                                    <span
                                        v-for="term in route.extracted_terms.phenotype_terms"
                                        :key="route.route_id + '-phen-' + term"
                                        class="pill"
                                    >{{ term }}</span>
                                </div>
                                <div
                                    v-if="route.extracted_terms && route.extracted_terms.mechanism_terms && route.extracted_terms.mechanism_terms.length"
                                    class="small mb-1 d-flex flex-wrap align-items-baseline gap-1"
                                >
                                    <strong>Mechanisms:</strong>
                                    <span
                                        v-for="term in route.extracted_terms.mechanism_terms"
                                        :key="route.route_id + '-mech-' + term"
                                        class="pill"
                                    >{{ term }}</span>
                                </div>
                                <div
                                    v-if="route.extracted_terms && route.extracted_terms.genes_of_interest && route.extracted_terms.genes_of_interest.length"
                                    class="small mb-1 d-flex flex-wrap align-items-baseline gap-1"
                                >
                                    <strong>Genes:</strong>
                                    <span
                                        v-for="term in route.extracted_terms.genes_of_interest"
                                        :key="route.route_id + '-gene-' + term"
                                        class="pill"
                                    >{{ term }}</span>
                                </div>
                                <div
                                    v-if="route.extracted_terms && route.extracted_terms.tissues && route.extracted_terms.tissues.length"
                                    class="small mb-1 d-flex flex-wrap align-items-baseline gap-1"
                                >
                                    <strong>Tissues:</strong>
                                    <span
                                        v-for="term in route.extracted_terms.tissues"
                                        :key="route.route_id + '-tissue-' + term"
                                        class="pill"
                                    >{{ term }}</span>
                                </div>
                                <div
                                    v-if="route.extracted_terms && route.extracted_terms.cell_types && route.extracted_terms.cell_types.length"
                                    class="small mb-1 d-flex flex-wrap align-items-baseline gap-1"
                                >
                                    <strong>Cell types:</strong>
                                    <span
                                        v-for="term in route.extracted_terms.cell_types"
                                        :key="route.route_id + '-cell-' + term"
                                        class="pill"
                                    >{{ term }}</span>
                                </div>
                                <div class="small text-muted">
                                    <strong>Embedding text:</strong> {{ route.sanitized_query }}
                                </div>
                                <div v-if="route.rationale" class="small text-muted mt-1">
                                    <strong>Rationale:</strong> {{ route.rationale }}
                                </div>
                                <div
                                    v-if="usePerRouteSearchTermsEditor && routeEditRow(route)"
                                    class="route-terms-edit-panel mt-2"
                                >
                                    <button
                                        type="button"
                                        class="route-terms-edit-toggle btn btn-link d-inline-flex align-items-center p-0 text-decoration-none"
                                        :aria-expanded="isRouteTermsEditExpanded(route.route_id) ? 'true' : 'false'"
                                        :aria-controls="'route-terms-edit-' + route.route_id"
                                        @click="$emit('toggle-route-terms-edit', route.route_id)"
                                    >
                                        <span class="font-weight-bold">Edit search terms</span>
                                        <b-icon
                                            :icon="isRouteTermsEditExpanded(route.route_id) ? 'chevron-up' : 'chevron-down'"
                                            class="ml-1"
                                            aria-hidden="true"
                                        ></b-icon>
                                    </button>
                                    <div
                                        v-show="isRouteTermsEditExpanded(route.route_id)"
                                        :id="'route-terms-edit-' + route.route_id"
                                        role="region"
                                        class="route-terms-edit-content mt-2 pt-2 border-top"
                                    >
                                        <b-table
                                            :items="routeRowEditFields"
                                            :fields="[
                                                { key: 'type', label: 'Type', thStyle: { width: '34%' } },
                                                { key: 'term', label: 'Term' }
                                            ]"
                                            small
                                            striped
                                            responsive="sm"
                                            head-variant="light"
                                            class="mb-0"
                                        >
                                            <template #cell(type)="row">
                                                <span>{{ row.item.type }}</span>
                                            </template>
                                            <template #cell(term)="row">
                                                <input
                                                    type="text"
                                                    class="form-control form-control-sm"
                                                    :value="routeEditRow(route)[row.item.key]"
                                                    placeholder="Comma-separated terms"
                                                    :disabled="!termsEditable"
                                                    @input="$emit('update-route-edit-field', {
                                                        route,
                                                        fieldKey: row.item.key,
                                                        value: $event.target.value,
                                                    })"
                                                />
                                            </template>
                                        </b-table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        v-if="alternativeQueries.length"
                        class="reveal-alt-queries-block mb-0"
                        style="flex: 1 1 30%; width: 100%;"
                    >
                        <div class="font-weight-bold small text-muted mb-1">Suggested pro-anchor paths</div>
                        <ul class="reveal-alt-query-links mb-0">
                            <li
                                v-for="(opt, idx) in alternativeQueries"
                                :key="'alt-below-' + idx + '-' + opt"
                            >
                                <a
                                    href="#"
                                    class="reveal-alt-query-link"
                                    @click.prevent="$emit('select-alternative-query', opt)"
                                >{{ opt }}</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <b-table
                    v-if="!usePerRouteSearchTermsEditor"
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
                            :disabled="!termsEditable"
                        ></textarea>
                        <input
                            v-else
                            type="text"
                            class="form-control form-control-sm"
                            v-model="row.item.term"
                            placeholder="Comma-separated terms"
                            :disabled="!termsEditable"
                        />
                    </template>
                </b-table>
            </div>
        </template>
    </div>
</template>

<script>
import WorkflowStepGate from "./WorkflowStepGate.vue";
import { ROUTE_ROW_EDIT_FIELDS, getRouteEditRow } from "./revealMqRouteEdit.js";

export default {
    name: "WorkflowTermsPanel",
    components: { WorkflowStepGate },
    props: {
        extractionStep: { type: Object, default: null },
        extractionStepTimeLabel: { type: String, default: "" },
        loadingSearchCriteria: { type: Boolean, default: false },
        gateActive: { type: Boolean, default: false },
        gateStepId: { type: String, default: "" },
        searchCriteriaEditRows: { type: Array, default: () => [] },
        multiQueryRouteEditRows: { type: Array, default: () => [] },
        extractionGateDone: { type: Boolean, default: false },
        extractionAmbiguityCheck: { type: Object, default: null },
        extractionAmbiguityDismissed: { type: Boolean, default: false },
        usePerRouteSearchTermsEditor: { type: Boolean, default: false },
        sharedResearchContext: { type: String, default: "" },
        multiQueryRoutes: { type: Array, default: () => [] },
        alternativeQueries: { type: Array, default: () => [] },
        routeTermsEditAccordionOpen: { type: Object, default: () => ({}) },
    },
    computed: {
        routeRowEditFields() {
            return ROUTE_ROW_EDIT_FIELDS;
        },
        showTermsEditor() {
            return (
                (this.searchCriteriaEditRows.length || this.multiQueryRouteEditRows.length) &&
                ((this.gateActive && this.gateStepId === "1") || this.extractionGateDone)
            );
        },
        termsEditable() {
            return this.gateActive && this.gateStepId === "1";
        },
    },
    methods: {
        routeEditRow(route) {
            return getRouteEditRow(route, this.multiQueryRouteEditRows);
        },
        isRouteTermsEditExpanded(routeId) {
            return !!this.routeTermsEditAccordionOpen[String(routeId || "")];
        },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
