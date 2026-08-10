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
                <div
                    v-if="multiQueryRoutes.length || alternativeQueries.length || usePerRouteSearchTermsEditor"
                    class="mt-3 d-flex flex-column flex-lg-row align-items-start"
                    style="gap: 16px;"
                >
                    <div v-if="multiQueryRoutes.length" style="flex: 1 1 70%; width: 100%;">
                        <div class="font-weight-bold small text-muted mb-2">Best matching data retrieval direction</div>
                        <div v-if="recommendedRoute" class="mb-3">
                            <workflow-route-direction-card
                                :route="recommendedRoute"
                                :selected="isRouteSelected(recommendedRoute.route_id)"
                                :show-select="!isRouteSelected(recommendedRoute.route_id)"
                                :selectable="termsEditable"
                                :show-terms-editor="usePerRouteSearchTermsEditor && !!routeEditRow(recommendedRoute)"
                                :edit-row="routeEditRow(recommendedRoute)"
                                :terms-editable="termsEditable"
                                @select="$emit('select-route', $event)"
                                @update-route-edit-field="$emit('update-route-edit-field', $event)"
                            />
                        </div>
                        <div v-if="otherRoutes.length" class="reveal-other-directions">
                            <button
                                type="button"
                                class="route-terms-edit-toggle btn btn-link d-inline-flex align-items-center p-0 text-decoration-none mb-2"
                                :aria-expanded="otherDirectionsOpen ? 'true' : 'false'"
                                aria-controls="reveal-other-directions-panel"
                                @click.stop.prevent="toggleOtherDirections"
                            >
                                <span class="font-weight-bold">Other directions ({{ otherRoutes.length }})</span>
                                <b-icon
                                    :icon="otherDirectionsOpen ? 'chevron-up' : 'chevron-down'"
                                    class="ml-1"
                                    aria-hidden="true"
                                ></b-icon>
                            </button>
                            <div
                                v-if="otherDirectionsOpen"
                                id="reveal-other-directions-panel"
                                role="region"
                                class="d-flex flex-column"
                                style="gap: 8px;"
                            >
                                <workflow-route-direction-card
                                    v-for="route in otherRoutes"
                                    :key="'multi-route-other-' + route.route_id"
                                    :route="route"
                                    :selected="isRouteSelected(route.route_id)"
                                    show-select
                                    :selectable="termsEditable"
                                    :show-terms-editor="usePerRouteSearchTermsEditor && !!routeEditRow(route)"
                                    :edit-row="routeEditRow(route)"
                                    :terms-editable="termsEditable"
                                    @select="$emit('select-route', $event)"
                                    @update-route-edit-field="$emit('update-route-edit-field', $event)"
                                />
                            </div>
                        </div>
                    </div>
                    <div
                        v-if="usePerRouteSearchTermsEditor || alternativeQueries.length"
                        class="reveal-terms-side-column mb-0"
                        style="flex: 1 1 30%; width: 100%;"
                    >
                        <div
                            v-if="usePerRouteSearchTermsEditor"
                            class="reveal-shared-research-context-section mb-3"
                        >
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
                            v-if="alternativeQueries.length"
                            class="reveal-alt-queries-block mb-0"
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
import WorkflowRouteDirectionCard from "./WorkflowRouteDirectionCard.vue";
import { getRouteEditRow } from "./revealMqRouteEdit.js";

export default {
    name: "WorkflowTermsPanel",
    components: { WorkflowStepGate, WorkflowRouteDirectionCard },
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
        selectedRouteId: { type: String, default: "" },
        alternativeQueries: { type: Array, default: () => [] },
    },
    data() {
        return {
            otherDirectionsOpen: false,
        };
    },
    computed: {
        showTermsEditor() {
            return (
                (this.searchCriteriaEditRows.length || this.multiQueryRouteEditRows.length) &&
                ((this.gateActive && this.gateStepId === "1") || this.extractionGateDone)
            );
        },
        termsEditable() {
            return this.gateActive && this.gateStepId === "1";
        },
        sortedRoutes() {
            return [...(this.multiQueryRoutes || [])].sort(
                (a, b) => Number((a && a.fit_rank) || 99) - Number((b && b.fit_rank) || 99)
            );
        },
        recommendedRoute() {
            if (!this.sortedRoutes.length) return null;
            return this.sortedRoutes.find((r) => Number(r.fit_rank) === 1) || this.sortedRoutes[0];
        },
        otherRoutes() {
            const rec = this.recommendedRoute;
            if (!rec) return this.sortedRoutes.slice();
            return this.sortedRoutes.filter((r) => r && r.route_id !== rec.route_id);
        },
    },
    methods: {
        routeEditRow(route) {
            return getRouteEditRow(route, this.multiQueryRouteEditRows);
        },
        isRouteSelected(routeId) {
            return String(this.selectedRouteId || "") === String(routeId || "");
        },
        toggleOtherDirections() {
            this.otherDirectionsOpen = !this.otherDirectionsOpen;
        },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
