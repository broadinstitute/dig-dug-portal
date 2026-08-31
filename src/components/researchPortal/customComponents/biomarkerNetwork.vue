<template>
    <div class="reveal-kg-workspace biomarker-network">
        <header class="rkw-header">
            <div class="rkw-brand">
                <span class="rkw-mark">CFDE KG</span>
                <span class="rkw-title">&lt;-&gt; BiomarkerKB</span>
            </div>
            <div class="bn-header-ops">
                <div class="bn-ops-menu">
                    <button type="button" class="bn-ops-menu-toggle" aria-haspopup="true">
                        Session
                    </button>
                    <div class="bn-ops-menu-list" role="menu">
                        <button
                            type="button"
                            class="bn-ops-menu-item"
                            role="menuitem"
                            @click="resetSearch"
                        >
                            Reset search
                        </button>
                        <button
                            type="button"
                            class="bn-ops-menu-item"
                            role="menuitem"
                            @click="triggerSessionImport"
                        >
                            Import session
                        </button>
                        <button
                            type="button"
                            class="bn-ops-menu-item"
                            role="menuitem"
                            :disabled="!canExportSession"
                            @click="exportSession"
                        >
                            Export session
                        </button>
                    </div>
                </div>
                <input
                    ref="sessionImportInput"
                    type="file"
                    accept="application/json,.json"
                    class="d-none"
                    @change="onSessionImportFileChange"
                />
            </div>
        </header>

        <div class="bn-body">
            <div v-if="error && !loading && !biomarkerLoading" class="alert alert-danger py-2 mb-3">
                {{ error }}
            </div>

            <div class="bn-accordions">
                <section
                    class="bn-accordion bn-accordion--mechanism"
                    :class="{
                        'bn-accordion--open': mechanismAccordionOpen,
                        'bn-accordion--suggesting': suggestionsOpen,
                    }"
                >
                    <div class="bn-accordion-header">
                        <button
                            type="button"
                            class="bn-accordion-trigger"
                            :aria-expanded="mechanismAccordionOpen ? 'true' : 'false'"
                            @click="mechanismAccordionOpen = !mechanismAccordionOpen"
                        >
                            <span class="bn-accordion-title">
                                <span class="bn-accordion-step">1</span>
                                Mechanism
                            </span>
                            <span class="bn-accordion-chevron" aria-hidden="true" />
                        </button>
                    </div>
                    <div v-show="mechanismAccordionOpen" class="bn-accordion-panel">
                        <div class="bn-search-panel">
                            <div class="bn-search-row">
                                <div class="bn-input-wrap">
                                    <input
                                        id="bn-disease-input"
                                        ref="diseaseInput"
                                        type="text"
                                        class="form-control"
                                        :class="{ 'bn-query-input--clearable': showSearchClear }"
                                        v-model="userQuery"
                                        placeholder="Search a CFDE REVEAL mechanism (e.g. IL-12 signaling)"
                                        autocomplete="off"
                                        aria-label="Mechanism"
                                        @input="onQueryInput"
                                        @keydown.down.prevent="moveSuggestion(1)"
                                        @keydown.up.prevent="moveSuggestion(-1)"
                                        @keydown.enter.prevent="onEnter"
                                        @keydown.esc="closeSuggestions"
                                    />
                                    <button
                                        v-if="showSearchClear"
                                        type="button"
                                        class="bn-clear-bubble"
                                        aria-label="Clear search input"
                                        title="Clear search input"
                                        @click="clearSearchInput"
                                    >
                                        <b-icon icon="x" aria-hidden="true" />
                                    </button>
                                    <ul
                                        v-if="suggestionsOpen && (flatSuggestions.length || suggestionsLoading)"
                                        class="bn-suggestions"
                                        role="listbox"
                                    >
                                        <li
                                            v-if="suggestionsLoading && !flatSuggestions.length"
                                            class="bn-suggestion bn-suggestion--muted"
                                        >
                                            Searching mechanisms…
                                        </li>
                                        <li
                                            v-for="s in flatSuggestions"
                                            :key="'m-' + s.iri"
                                            class="bn-suggestion"
                                            :class="{ 'bn-suggestion--active': s.flatIndex === suggestionIndex }"
                                            role="option"
                                            @mousedown.prevent="selectSuggestion(s)"
                                        >
                                            <span class="bn-suggestion-label">{{ s.label }}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    class="bn-accordion"
                    :class="{ 'bn-accordion--open': diseasesAccordionOpen }"
                >
                    <div class="bn-accordion-header">
                        <button
                            type="button"
                            class="bn-accordion-trigger"
                            :aria-expanded="diseasesAccordionOpen ? 'true' : 'false'"
                            @click="diseasesAccordionOpen = !diseasesAccordionOpen"
                        >
                            <span class="bn-accordion-title">
                                <span class="bn-accordion-step">2</span>
                                Associated diseases
                                <span v-if="associatedDiseases.length" class="bn-accordion-count">
                                    {{ associatedDiseases.length }}
                                </span>
                            </span>
                            <span class="bn-accordion-chevron" aria-hidden="true" />
                        </button>
                        <div class="bn-accordion-actions" @click.stop>
                            <button
                                type="button"
                                class="btn btn-cfde btn-sm bn-find-diseases-btn"
                                :disabled="loading || !searchNeedle"
                                @click="runSearch"
                            >
                                {{
                                    loading
                                        ? "Finding associated diseases…"
                                        : "Find associated diseases"
                                }}
                            </button>
                        </div>
                    </div>
                    <div v-show="diseasesAccordionOpen" class="bn-accordion-panel">
                        <div
                            v-if="loading"
                            class="bn-status bn-status--loading"
                            role="status"
                        >
                            <span class="bn-spinner" aria-hidden="true" />
                            {{ loadingMessage || "Finding associated diseases…" }}
                        </div>
                        <template v-else-if="!searched">
                            <p class="bn-filter-empty">
                                Choose a mechanism in step 1, then click Find associated diseases.
                            </p>
                        </template>
                        <template v-else-if="!associatedDiseases.length">
                            <p class="bn-filter-empty">
                                No associated MONDO diseases for this mechanism.
                            </p>
                        </template>
                        <template v-else>
                                <div
                                    v-if="mechanismGraph.nodes.length"
                                    class="bn-mechanism-network"
                                >
                                    <biomarker-network-graph
                                        ref="mechNetwork"
                                        :key="'mech-net-' + mechanismNetworkKey"
                                        :graph="mechanismGraph"
                                        :height="480"
                                        :type-labels="mechanismLegendLabels"
                                        :genes-fetched-disease-ids="genesFetchedDiseaseIds"
                                        @view-shared-genes="onViewSharedGenesInNetwork"
                                        @hide-genes="onHideGenesInNetwork"
                                    />
                                </div>
                                <p class="bn-step-hint">
                                    Review associated diseases, then use Find biomarkers
                                    in step 3 for the checked ones.
                                </p>
                                <table class="table table-sm table-hover bn-table">
                                    <thead>
                                        <tr>
                                            <th scope="col" class="bn-check-col">
                                                <input
                                                    type="checkbox"
                                                    :checked="allDiseasesSelected"
                                                    :indeterminate.prop="someDiseasesSelected && !allDiseasesSelected"
                                                    aria-label="Select all diseases"
                                                    @change="toggleAllDiseases($event.target.checked)"
                                                />
                                            </th>
                                            <th scope="col">Disease</th>
                                            <th scope="col">
                                                Shared genes
                                                <b-icon
                                                    icon="info-circle"
                                                    class="bn-th-info"
                                                    v-b-tooltip.hover.top="'Number of the factor\'s top-loading genes that are also associated with this disease (via PIGEAN gene-to-trait scores).'"
                                                />
                                            </th>
                                            <th scope="col">Aggregated Pigean score</th>
                                            <th scope="col">Highest gene loading</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="row in diseasePageRows">
                                            <tr :key="row.disease">
                                                <td class="bn-check-col">
                                                    <input
                                                        type="checkbox"
                                                        :checked="isDiseaseSelected(row.disease)"
                                                        :aria-label="'Select ' + (row.diseaseLabel || row.disease)"
                                                        @change="setDiseaseSelected(row.disease, $event.target.checked)"
                                                    />
                                                </td>
                                                <td>
                                                    <a
                                                        v-if="row.disease"
                                                        :href="row.disease"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >{{ row.diseaseLabel || row.disease }}</a>
                                                    <span v-else>{{ row.diseaseLabel || "—" }}</span>
                                                </td>
                                                <td>
                                                    <a
                                                        href="#"
                                                        class="bn-shared-gene-toggle"
                                                        @click.prevent="toggleDiseaseGenes(row)"
                                                    >{{ row.sharedGeneCount }}</a>
                                                </td>
                                                <td>{{ formatScore(row.aggregatePigeanScore) }}</td>
                                                <td>{{ formatScore(row.highestFactorGeneLoading, 4) }}</td>
                                            </tr>
                                            <tr
                                                v-if="expandedDiseases[row.disease]"
                                                :key="row.disease + '-genes'"
                                                class="bn-subtable-row"
                                            >
                                                <td colspan="5">
                                                    <div
                                                        v-if="diseaseGenes[row.disease] === 'loading'"
                                                        class="text-center text-muted py-2"
                                                    >
                                                        Loading genes…
                                                    </div>
                                                    <div
                                                        v-else-if="diseaseGenes[row.disease] && diseaseGenes[row.disease].length"
                                                        class="bn-subtable-wrap"
                                                    >
                                                        <table class="table table-sm table-borderless table-striped mb-0 bn-subtable">
                                                            <thead>
                                                                <tr>
                                                                    <th>Gene</th>
                                                                    <th>Factor loading</th>
                                                                    <th>PIGEAN score</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr
                                                                    v-for="g in diseaseGenes[row.disease]"
                                                                    :key="g.gene"
                                                                >
                                                                    <td>{{ g.geneLabel || g.gene }}</td>
                                                                    <td>{{ formatScore(g.factorLoading, 4) }}</td>
                                                                    <td>{{ formatScore(g.pigeanScore) }}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <p v-else class="text-muted mb-0 py-1">
                                                        No gene data available.
                                                    </p>
                                                </td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                                <b-pagination
                                    v-if="associatedDiseases.length > perPage"
                                    class="pagination-sm justify-content-center mt-2"
                                    v-model="mechanismPage"
                                    :total-rows="associatedDiseases.length"
                                    :per-page="perPage"
                                    size="sm"
                                />
                        </template>
                    </div>
                </section>

                <section
                    class="bn-accordion"
                    :class="{ 'bn-accordion--open': biomarkersAccordionOpen }"
                >
                        <div class="bn-accordion-header">
                            <button
                                type="button"
                                class="bn-accordion-trigger"
                                :aria-expanded="biomarkersAccordionOpen ? 'true' : 'false'"
                                @click="biomarkersAccordionOpen = !biomarkersAccordionOpen"
                            >
                                <span class="bn-accordion-title">
                                    <span class="bn-accordion-step">3</span>
                                    Biomarkers
                                    <span v-if="biomarkersFetched" class="bn-accordion-count">
                                        {{ rows.length }}
                                    </span>
                                </span>
                                <span class="bn-accordion-chevron" aria-hidden="true" />
                            </button>
                            <div class="bn-accordion-actions" @click.stop>
                                <span
                                    v-if="associatedDiseases.length"
                                    class="bn-fetch-meta text-muted"
                                >
                                    {{ selectedDiseaseCount }} of
                                    {{ associatedDiseases.length }} diseases selected
                                </span>
                                <button
                                    type="button"
                                    class="btn btn-cfde btn-sm bn-find-biomarkers-btn"
                                    :disabled="biomarkerLoading || !selectedDiseaseCount"
                                    @click="fetchBiomarkers"
                                >
                                    {{ biomarkerLoading ? "Finding biomarkers…" : "Find biomarkers" }}
                                </button>
                            </div>
                        </div>
                        <div v-show="biomarkersAccordionOpen" class="bn-accordion-panel">
                            <div v-if="counts" class="bn-counts">
                                <span v-if="searchedFactorLabel" class="bn-disease-bubble">{{
                                    searchedFactorLabel
                                }}</span>
                                <span
                                    ><strong>{{ counts.diseaseCount }}</strong> associated
                                    diseases</span
                                >
                                <template v-if="biomarkersFetched">
                                    <span class="bn-counts-sep">·</span>
                                    <span
                                        ><strong>{{ counts.biomarkerCount }}</strong>
                                        biomarkers</span
                                    >
                                    <span v-if="truncatedFetch" class="bn-counts-sep">·</span>
                                    <span v-if="truncatedFetch" class="text-muted"
                                        >list truncated at limit {{ fetchLimit }}</span
                                    >
                                </template>
                            </div>
                            <div
                                v-if="biomarkerLoading"
                                class="bn-status bn-status--loading"
                                role="status"
                            >
                                <span class="bn-spinner" aria-hidden="true" />
                                {{ loadingMessage || "Finding biomarkers…" }}
                            </div>
                            <template v-else-if="!biomarkersFetched">
                                <p class="bn-filter-empty">
                                    Select diseases above, then click Find biomarkers.
                                </p>
                            </template>
                            <template v-else>
                                <div
                                    v-if="uniqueRoleLabels.length"
                                    class="bn-type-filters"
                                    role="group"
                                    aria-label="Filter by biomarker role"
                                >
                                    <span class="bn-type-filters-label">Roles:</span>
                                    <button
                                        v-for="label in uniqueRoleLabels"
                                        :key="label"
                                        type="button"
                                        class="bn-type-bubble"
                                        :class="{ 'bn-type-bubble--off': !isTypeVisible(label) }"
                                        :aria-pressed="isTypeVisible(label) ? 'true' : 'false'"
                                        @click="toggleTypeFilter(label)"
                                    >
                                        <b-icon
                                            :icon="isTypeVisible(label) ? 'eye-fill' : 'eye-slash'"
                                            aria-hidden="true"
                                        />
                                        {{ label }}
                                    </button>
                                </div>
                                <div
                                    v-if="showBiomarkerDiseaseFilters || sharedGeneMappingBubbleLabel"
                                    class="bn-disease-filters-block"
                                >
                                    <div
                                        v-if="showBiomarkerDiseaseFilters"
                                        class="bn-type-filters"
                                        role="group"
                                        aria-label="Filter biomarkers by disease"
                                    >
                                        <span class="bn-type-filters-label">Diseases:</span>
                                        <button
                                            v-for="d in uniqueBiomarkerDiseaseFilters"
                                            :key="'bio-' + d.iri"
                                            type="button"
                                            class="bn-type-bubble"
                                            :class="{ 'bn-type-bubble--off': !isDiseaseVisible(d.iri) }"
                                            :aria-pressed="isDiseaseVisible(d.iri) ? 'true' : 'false'"
                                            @click="toggleDiseaseFilter(d.iri)"
                                        >
                                            <b-icon
                                                :icon="isDiseaseVisible(d.iri) ? 'eye-fill' : 'eye-slash'"
                                                aria-hidden="true"
                                            />
                                            {{ d.label }}
                                        </button>
                                    </div>
                                    <div
                                        v-if="sharedGeneMappingBubbleLabel"
                                        class="bn-type-filters"
                                        role="group"
                                        aria-label="Filter biomarkers by shared gene overlap"
                                    >
                                        <span class="bn-type-filters-label">
                                            Associated gene to shared gene mapping:
                                        </span>
                                        <button
                                            type="button"
                                            class="bn-type-bubble"
                                            :class="{
                                                'bn-type-bubble--off': !mappedGeneOverlapFilter,
                                            }"
                                            :aria-pressed="mappedGeneOverlapFilter ? 'true' : 'false'"
                                            @click="toggleMappedGeneOverlapFilter"
                                        >
                                            <b-icon
                                                :icon="
                                                    mappedGeneOverlapFilter
                                                        ? 'eye-fill'
                                                        : 'eye-slash'
                                                "
                                                aria-hidden="true"
                                            />
                                            {{ sharedGeneMappingBubbleLabel }}
                                        </button>
                                    </div>
                                </div>
                                <p v-if="!rows.length" class="bn-filter-empty">
                                    No biomarkers found for the selected diseases.
                                </p>
                                <p v-else-if="!filteredRows.length" class="bn-filter-empty">
                                    No rows for the selected filters.
                                </p>
                                <div
                                    v-else
                                    class="bn-table-toolbar"
                                >
                                    <span class="bn-table-toolbar-label">Download table:</span>
                                    <button
                                        type="button"
                                        class="bn-table-download-btn"
                                        @click="downloadBiomarkerTable('csv')"
                                    >
                                        CSV
                                    </button>
                                    <button
                                        type="button"
                                        class="bn-table-download-btn"
                                        @click="downloadBiomarkerTable('tsv')"
                                    >
                                        TSV
                                    </button>
                                    <span class="bn-table-toolbar-meta text-muted">
                                        {{ filteredRows.length }} row{{ filteredRows.length === 1 ? "" : "s" }}
                                    </span>
                                </div>
                                <table v-if="filteredRows.length" class="table table-sm table-hover bn-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Biomarker</th>
                                            <th scope="col">Associated gene</th>
                                            <th scope="col">Roles</th>
                                            <th scope="col">Diseases</th>
                                            <th scope="col">
                                                Records
                                                <b-icon
                                                    icon="info-circle"
                                                    class="bn-th-info"
                                                    v-b-tooltip.hover.top="'Number of distinct BiomarkerKB assertion records linking this biomarker to the input diseases via any role (diagnostic, monitoring, prognostic, or susceptibility/risk).'"
                                                />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr
                                            v-for="(row, idx) in pageRows"
                                            :key="row.biomarker + '-' + idx"
                                        >
                                            <td>
                                                <a
                                                    v-if="row.biomarker"
                                                    :href="row.biomarker"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >{{ biomarkerDisplayLabel(row) }}</a>
                                                <span v-else>{{ biomarkerDisplayLabel(row) }}</span>
                                            </td>
                                            <td class="bn-gene-cell">
                                                <template v-if="rowAssociatedGenes(row).length">
                                                    <span
                                                        v-for="(gene, geneIdx) in rowAssociatedGenes(row)"
                                                        :key="row.biomarker + '-gene-' + gene + '-' + geneIdx"
                                                    >
                                                        <span v-if="geneIdx"> | </span>
                                                        <span
                                                            :class="{
                                                                'bn-gene-mapped': isRowGeneShared(row, gene),
                                                            }"
                                                        >{{ gene }}</span>
                                                    </span>
                                                </template>
                                                <span v-else>—</span>
                                            </td>
                                            <td>{{ row.roles || "—" }}</td>
                                            <td>{{ row.diseases || "—" }}</td>
                                            <td>{{ row.recordCount || "—" }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <b-pagination
                                    v-if="filteredRows.length > perPage"
                                    class="pagination-sm justify-content-center mt-2"
                                    v-model="currentPage"
                                    :total-rows="filteredRows.length"
                                    :per-page="perPage"
                                    size="sm"
                                />
                            </template>
                        </div>
                    </section>

                <section
                    class="bn-accordion"
                    :class="{ 'bn-accordion--open': mechanismLinkAccordionOpen }"
                >
                    <div class="bn-accordion-header">
                        <button
                            type="button"
                            class="bn-accordion-trigger"
                            :aria-expanded="mechanismLinkAccordionOpen ? 'true' : 'false'"
                            @click="toggleMechanismLinkAccordion"
                        >
                            <span class="bn-accordion-title">
                                <span class="bn-accordion-step">4</span>
                                Mechanistic feedback loop
                            </span>
                            <span class="bn-accordion-chevron" aria-hidden="true" />
                        </button>
                        <div class="bn-accordion-actions" @click.stop>
                            <button
                                type="button"
                                class="btn btn-cfde btn-sm"
                                :disabled="
                                    mechanismLinkLoading ||
                                    !biomarkersFetched ||
                                    !filteredRows.length
                                "
                                @click="generateMechanismLinkSummary"
                            >
                                {{
                                    mechanismLinkLoading
                                        ? "Generating…"
                                        : mechanismLinkSummary.status === "done"
                                          ? "Regenerate summary"
                                          : "Generate summary"
                                }}
                            </button>
                        </div>
                    </div>
                    <div v-show="mechanismLinkAccordionOpen" class="bn-accordion-panel">
                        <p v-if="!biomarkersFetched" class="bn-filter-empty">
                            Complete step 3 to generate a mechanistic feedback summary.
                        </p>
                        <p v-else-if="!filteredRows.length" class="bn-filter-empty">
                            No biomarker rows match the current filters.
                        </p>
                        <template v-else>
                            <div
                                v-if="mechanismLinkLoading"
                                class="bn-status bn-status--loading mb-2"
                                role="status"
                            >
                                <span class="bn-spinner" aria-hidden="true" />
                                {{ mechanismLinkStatus || "Generating mechanistic summary…" }}
                            </div>
                            <div
                                v-else-if="mechanismLinkSummary.status === 'error'"
                                class="alert alert-danger py-2 bn-mechanism-link-error"
                            >
                                {{ mechanismLinkSummary.error || "Summary generation failed." }}
                            </div>
                            <div
                                v-else-if="mechanismLinkSummary.status === 'done' && mechanismLinkSummary.data"
                                class="bn-mechanism-link-result-wrap"
                            >
                                <biomarker-mechanism-link-summary
                                    :summary="mechanismLinkSummary.data"
                                    :mechanism-label="searchedFactorLabel || lastNeedle || 'Mechanism'"
                                />
                            </div>
                            <p
                                v-else
                                class="bn-filter-empty mb-0"
                            >
                                Click Generate summary to run one LLM analysis over the full
                                filtered biomarker table.
                            </p>
                        </template>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import {
    canonicalGeneNodeId,
    normalizeGeneSymbol,
} from "./biomarkerNetwork/geneNodeIds.js";
import BiomarkerNetworkGraph from "./biomarkerNetwork/BiomarkerNetworkGraph.vue";
import BiomarkerMechanismLinkSummary from "./biomarkerNetwork/BiomarkerMechanismLinkSummary.vue";
import {
    buildDiseaseLabelIndex,
    formatSharedGeneMappingBubble,
    getRowSharedGeneMapping,
} from "./biomarkerNetwork/biomarkerLinkageGraph.js";
import {
    applyBiomarkerSessionImport,
    exportBiomarkerSession,
    parseBiomarkerSessionImportFile,
    sessionHasExportableContent,
} from "./biomarkerNetwork/biomarkerNetworkSession.js";
import { getFactorById, looksLikeFactorId } from "./biomarkerNetwork/biomarkerFactorCatalog.js";
import { searchBiomarkerFactors } from "./biomarkerNetwork/biomarkerFactorSearch.js";
import keyParams from "@/utils/keyParams";
import {
    listMondoDiseasesForFactor,
    listSharedGenesByDiseaseForFactor,
    listSharedGenesForFactorDisease,
} from "./biomarkerNetwork/cfdeKgSparql.js";
import { listBiomarkersForMondoDiseases } from "./biomarkerNetwork/biomarkerKbSparql.js";
import uiUtils from "@/utils/uiUtils";
import { createLLMClient } from "@/utils/llmClient";
import {
    BIOMARKER_MECHANISM_LINK_SYSTEM_PROMPT,
    buildMechanismLinkBatchInputFromVm,
} from "./biomarkerNetwork/biomarkerMechanismLinkPrompt.js";
import { fetchBiomarkerMechanismLinkSummary } from "./biomarkerNetwork/biomarkerMechanismLinkLlm.js";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

const PER_PAGE = 10;
const SUGGESTION_LIMIT = 12;
const SUGGESTION_DEBOUNCE_MS = 280;
const BIOMARKER_LIMIT = 100;

export default Vue.component("biomarker-network", {
    components: { BiomarkerNetworkGraph, BiomarkerMechanismLinkSummary },
    props: ["phenotypesInUse", "utilsBox", "sectionConfigs"],
    data() {
        return {
            userQuery: "",
            searchNeedle: "",
            lastNeedle: "",
            searchedFactorLabel: "",
            selectedFactorIri: "",
            selectedFactorId: null,
            factorSuggestions: [],
            suggestionsOpen: false,
            suggestionsLoading: false,
            suggestionIndex: -1,
            suggestionTimer: null,
            suggestionAbort: null,
            loading: false,
            loadingMessage: "",
            biomarkerLoading: false,
            error: "",
            searched: false,
            biomarkersFetched: false,
            counts: null,
            rows: [],
            associatedDiseases: [],
            selectedDiseaseIds: {},
            fetchLimit: 0,
            truncatedFetch: false,
            currentPage: 1,
            perPage: PER_PAGE,
            hiddenTypes: {},
            hiddenDiseases: {},
            mappedGeneOverlapFilter: false,
            diseasesAccordionOpen: false,
            mechanismAccordionOpen: true,
            biomarkersAccordionOpen: false,
            mechanismPage: 1,
            abortController: null,
            biomarkerAbortController: null,
            expandedDiseases: {},
            diseaseGenes: {},
            sharedGenesLoading: false,
            sharedGenesPreloadPromise: null,
            networkExpandedDiseases: {},
            /**
             * Gene-centric registry rebuilt into the network on every fetch:
             * { SYMBOL: { symbol, diseases: [{ disease, factorLoading, pigeanScore }] } }
             */
            geneRegistry: {},
            exportSessionBusy: false,
            mechanismLinkAccordionOpen: false,
            mechanismLinkLoading: false,
            mechanismLinkStatus: "",
            mechanismLinkSummary: {
                status: "idle",
                data: null,
                error: "",
                rowCount: 0,
                generatedAt: null,
            },
        };
    },
    computed: {
        flatSuggestions() {
            return (this.factorSuggestions || []).map((s, i) =>
                Object.assign({}, s, { kind: "mechanism", flatIndex: i })
            );
        },
        uniqueRoleLabels() {
            const seen = {};
            const labels = [];
            (this.rows || []).forEach((row) => {
                (row.roleList || []).forEach((label) => {
                    if (!label || seen[label]) return;
                    seen[label] = true;
                    labels.push(label);
                });
            });
            return labels.sort((a, b) => a.localeCompare(b));
        },
        uniqueBiomarkerDiseaseFilters() {
            const seen = {};
            const out = [];
            (this.rows || []).forEach((row) => {
                (row.diseaseList || []).forEach((label) => {
                    if (!label || seen[label]) return;
                    seen[label] = true;
                    out.push({ iri: label, label });
                });
            });
            return out.sort((a, b) => a.label.localeCompare(b.label));
        },
        showBiomarkerDiseaseFilters() {
            return this.uniqueBiomarkerDiseaseFilters.length > 1;
        },
        filteredRows() {
            let rows = this.roleAndDiseaseFilteredRows;
            if (this.mappedGeneOverlapFilter) {
                rows = rows.filter((row) => this.rowSharedGeneMapping(row).mappedCount > 0);
            }
            return rows;
        },
        roleAndDiseaseFilteredRows() {
            return (this.rows || []).filter((row) => {
                if (this.uniqueRoleLabels.length) {
                    const roles = row.roleList || [];
                    const anyVisible = roles.some((role) => this.isTypeVisible(role));
                    if (!anyVisible) return false;
                }
                if (!this.showBiomarkerDiseaseFilters) return true;
                const diseases = row.diseaseList || [];
                return diseases.some((label) => this.isDiseaseVisible(label));
            });
        },
        diseasePageRows() {
            const start = (this.mechanismPage - 1) * this.perPage;
            return (this.associatedDiseases || []).slice(start, start + this.perPage);
        },
        /**
         * Graph for step 2: only checked diseases (plus gene layer linked to them).
         * Unchecking a disease removes its node; checking adds it back.
         */
        mechanismGraph() {
            const factorLabel = this.searchedFactorLabel || this.lastNeedle || "Mechanism";
            const factorId = this.selectedFactorIri || "factor:root";
            const nodes = [{ id: factorId, label: factorLabel, type: "Factor" }];
            const edges = [];
            // Touch selection map so Vue tracks checkbox changes.
            const selection = this.selectedDiseaseIds || {};

            (this.associatedDiseases || []).forEach((d) => {
                const diseaseId = d.disease || `disease:${d.diseaseLabel}`;
                if (!diseaseId || selection[diseaseId] === false) return;

                nodes.push({
                    id: diseaseId,
                    label: d.diseaseLabel || d.disease,
                    type: "Phenotype",
                    metadata: {
                        aggregatePigeanScore: d.aggregatePigeanScore,
                        sharedGeneCount: d.sharedGeneCount,
                    },
                });
                // Once genes are shown for a disease, the factor reaches it
                // through those genes instead of a direct edge.
                if (!this.networkExpandedDiseases[diseaseId]) {
                    edges.push({
                        source: factorId,
                        target: diseaseId,
                        metadata: { edgeStrength: d.highestFactorGeneLoading },
                    });
                }
            });

            const diseaseIds = new Set(
                nodes.filter((n) => n.type === "Phenotype").map((n) => String(n.id))
            );
            Object.keys(this.geneRegistry).forEach((symKey) => {
                const entry = this.geneRegistry[symKey];
                if (!entry || !entry.diseases.length) return;
                const linked = entry.diseases.filter((d) => diseaseIds.has(String(d.disease)));
                if (!linked.length) return;

                const symbol = entry.symbol || symKey;
                const geneId = canonicalGeneNodeId(symbol);
                if (!geneId) return;

                let factorLoading = null;
                let topPigeanScore = null;
                linked.forEach((d) => {
                    factorLoading = this.maxAbsMetric(factorLoading, d.factorLoading);
                    topPigeanScore = this.maxAbsMetric(topPigeanScore, d.pigeanScore);
                });

                nodes.push({
                    id: geneId,
                    label: symbol,
                    type: "Gene",
                    metadata: {
                        geneSymbol: symbol,
                        factorLoading,
                        pigeanScore: topPigeanScore,
                        diseaseCount: linked.length,
                    },
                });
                edges.push({
                    source: factorId,
                    target: geneId,
                    metadata: { edgeStrength: factorLoading },
                });
                linked.forEach((d) => {
                    edges.push({
                        source: geneId,
                        target: d.disease,
                        metadata: { edgeStrength: d.pigeanScore },
                    });
                });
            });

            return { nodes, edges };
        },
        mechanismNetworkKey() {
            return [this.selectedFactorIri || "", this.searchedFactorLabel || ""].join("|");
        },
        genesFetchedDiseaseIds() {
            return Object.keys(this.networkExpandedDiseases || {}).filter(
                (id) => this.networkExpandedDiseases[id]
            );
        },
        mechanismLegendLabels() {
            return {
                Phenotype: "Disease",
                Factor: "Mechanism",
                Gene: "Gene",
            };
        },
        pageRows() {
            const start = (this.currentPage - 1) * this.perPage;
            return this.filteredRows.slice(start, start + this.perPage);
        },
        biomarkerTableExportRows() {
            return this.filteredRows.map((row) => {
                const genes = this.rowAssociatedGenes(row);
                const mapping = this.rowSharedGeneMapping(row);
                return {
                    Biomarker: this.biomarkerDisplayLabel(row),
                    "Associated gene": genes.length ? genes.join(" | ") : "",
                    "Mapped shared genes": mapping.mappedGenes.length
                        ? mapping.mappedGenes.join(" | ")
                        : "",
                    Roles: row.roles || "",
                    Diseases: row.diseases || "",
                    Records: row.recordCount != null ? row.recordCount : "",
                };
            });
        },
        selectedDiseaseCount() {
            return (this.associatedDiseases || []).filter((d) =>
                this.isDiseaseSelected(d.disease)
            ).length;
        },
        allDiseasesSelected() {
            const list = this.associatedDiseases || [];
            return list.length > 0 && list.every((d) => this.isDiseaseSelected(d.disease));
        },
        someDiseasesSelected() {
            return (this.associatedDiseases || []).some((d) => this.isDiseaseSelected(d.disease));
        },
        showSearchClear() {
            return Boolean((this.userQuery || "").trim());
        },
        canExportSession() {
            return sessionHasExportableContent(this);
        },
        diseaseByLabel() {
            return buildDiseaseLabelIndex(this.associatedDiseases);
        },
        aggregateSharedGeneMapping() {
            const associated = new Set();
            const mapped = new Set();
            (this.roleAndDiseaseFilteredRows || []).forEach((row) => {
                const mapping = getRowSharedGeneMapping(this.rowSharedGeneMappingInput(row));
                mapping.associatedGenes.forEach((gene) => {
                    const key = normalizeGeneSymbol(gene);
                    if (key) associated.add(key);
                });
                mapping.mappedGenes.forEach((gene) => {
                    const key = normalizeGeneSymbol(gene);
                    if (key) mapped.add(key);
                });
            });
            return {
                mappedCount: mapped.size,
                totalCount: associated.size,
            };
        },
        sharedGeneMappingBubbleLabel() {
            const { mappedCount, totalCount } = this.aggregateSharedGeneMapping;
            return formatSharedGeneMappingBubble(mappedCount, totalCount);
        },
        topMechanismGenesLabel() {
            const symbols = [];
            const seen = {};
            const add = (sym) => {
                const key = normalizeGeneSymbol(sym);
                if (!key || seen[key]) return;
                seen[key] = true;
                symbols.push(key);
            };

            Object.keys(this.geneRegistry || {}).forEach((symKey) => {
                const entry = this.geneRegistry[symKey];
                add(entry && entry.symbol ? entry.symbol : symKey);
            });

            const ranked = [];
            Object.values(this.diseaseGenes || {}).forEach((entries) => {
                (entries || []).forEach((entry) => {
                    const sym = this.geneDisplayLabel(entry);
                    if (!sym) return;
                    ranked.push({
                        sym,
                        loading: Math.abs(Number(entry && entry.factorGeneLoading) || 0),
                    });
                });
            });
            ranked.sort((a, b) => b.loading - a.loading);
            ranked.forEach((row) => add(row.sym));

            if (!symbols.length) return "None provided";
            return symbols.slice(0, 20).join(", ");
        },
    },
    created() {
        this.llmMechanismLink = createLLMClient({
            system_prompt: BIOMARKER_MECHANISM_LINK_SYSTEM_PROMPT,
            expectJson: true,
        });
    },
    watch: {
        mechanismLinkAccordionOpen(open) {
            if (open) {
                this.biomarkersAccordionOpen = false;
            }
        },
    },
    mounted() {
        const factorFromUrl = keyParams.factor != null ? String(keyParams.factor).trim() : "";
        if (!factorFromUrl) return;
        setTimeout(() => this.hydrateFromUrl(factorFromUrl), 0);
    },
    beforeDestroy() {
        this.cancelInFlight();
        this.cancelSuggestionLookup();
        if (this.suggestionTimer) clearTimeout(this.suggestionTimer);
        if (this.llmMechanismLink && typeof this.llmMechanismLink.abort === "function") {
            this.llmMechanismLink.abort();
        }
    },
    methods: {
        cancelInFlight() {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
            if (this.biomarkerAbortController) {
                this.biomarkerAbortController.abort();
                this.biomarkerAbortController = null;
            }
        },
        cancelSuggestionLookup() {
            if (this.suggestionAbort) {
                this.suggestionAbort.abort();
                this.suggestionAbort = null;
            }
        },
        async hydrateFromUrl(factorRef) {
            this.loading = true;
            this.loadingMessage = "Resolving mechanism from URL…";
            this.error = "";

            const catalog = looksLikeFactorId(factorRef) ? getFactorById(factorRef) : null;
            if (!catalog || !catalog.iri) {
                this.loading = false;
                this.loadingMessage = "";
                this.error = "Unknown mechanism in the URL.";
                return;
            }

            this.selectedFactorId = catalog.id;
            this.selectedFactorIri = catalog.iri;
            this.userQuery = catalog.label;
            this.searchNeedle = catalog.label;
            this.searchedFactorLabel = catalog.label;
            await this.runSearch({ allowWhileLoading: true });
        },
        onQueryInput() {
            this.searchNeedle = (this.userQuery || "").trim();
            if (this.selectedFactorIri) {
                const selected = (this.factorSuggestions || []).find(
                    (s) => s.iri === this.selectedFactorIri && s.label === this.searchNeedle
                );
                if (!selected && this.searchedFactorLabel !== this.searchNeedle) {
                    this.selectedFactorIri = "";
                    this.selectedFactorId = null;
                }
            }
            this.suggestionIndex = -1;
            if (this.suggestionTimer) clearTimeout(this.suggestionTimer);
            if (this.searchNeedle.length < 2) {
                this.cancelSuggestionLookup();
                this.factorSuggestions = [];
                this.suggestionsOpen = false;
                this.suggestionsLoading = false;
                return;
            }
            this.suggestionsOpen = true;
            this.suggestionsLoading = true;
            this.suggestionTimer = setTimeout(() => this.lookupFactorSuggestions(), SUGGESTION_DEBOUNCE_MS);
        },
        async lookupFactorSuggestions() {
            const needle = this.searchNeedle;
            this.cancelSuggestionLookup();
            const ac = new AbortController();
            this.suggestionAbort = ac;
            try {
                const hits = await searchBiomarkerFactors(needle, {
                    limit: SUGGESTION_LIMIT,
                    signal: ac.signal,
                });
                if (ac.signal.aborted) return;
                this.factorSuggestions = hits;
            } catch (e) {
                if (e && e.name === "AbortError") return;
                this.factorSuggestions = [];
            } finally {
                if (this.suggestionAbort === ac) this.suggestionAbort = null;
                this.suggestionsLoading = false;
            }
        },
        closeSuggestions() {
            this.suggestionsOpen = false;
            this.suggestionIndex = -1;
            this.suggestionsLoading = false;
        },
        /** Clears only the search input; session results stay intact. */
        clearSearchInput() {
            this.cancelSuggestionLookup();
            if (this.suggestionTimer) {
                clearTimeout(this.suggestionTimer);
                this.suggestionTimer = null;
            }
            this.closeSuggestions();
            this.userQuery = "";
            this.searchNeedle = "";
            this.factorSuggestions = [];
            this.$nextTick(() => {
                if (this.$refs.diseaseInput) this.$refs.diseaseInput.focus();
            });
        },
        resetSearch() {
            this.cancelInFlight();
            this.cancelSuggestionLookup();
            if (this.suggestionTimer) clearTimeout(this.suggestionTimer);
            this.closeSuggestions();
            this.userQuery = "";
            this.searchNeedle = "";
            this.lastNeedle = "";
            this.searchedFactorLabel = "";
            this.selectedFactorIri = "";
            this.selectedFactorId = null;
            this.factorSuggestions = [];
            this.loading = false;
            this.loadingMessage = "";
            this.biomarkerLoading = false;
            this.error = "";
            this.searched = false;
            this.biomarkersFetched = false;
            this.counts = null;
            this.rows = [];
            this.associatedDiseases = [];
            this.selectedDiseaseIds = {};
            this.fetchLimit = 0;
            this.truncatedFetch = false;
            this.currentPage = 1;
            this.mechanismPage = 1;
            this.hiddenTypes = {};
            this.hiddenDiseases = {};
            this.mappedGeneOverlapFilter = false;
            this.expandedDiseases = {};
            this.diseaseGenes = {};
            this.sharedGenesLoading = false;
            this.sharedGenesPreloadPromise = null;
            this.networkExpandedDiseases = {};
            this.geneRegistry = {};
            this.resetMechanismLinkSummary();
            this.mechanismLinkAccordionOpen = false;
            this.mechanismAccordionOpen = true;
            this.diseasesAccordionOpen = false;
            this.biomarkersAccordionOpen = false;
            keyParams.set({ disease: "", factor: "" });
            this.$nextTick(() => {
                if (this.$refs.diseaseInput) this.$refs.diseaseInput.focus();
            });
        },
        async exportSession() {
            if (!this.canExportSession || this.exportSessionBusy) return;
            this.exportSessionBusy = true;
            try {
                const result = await exportBiomarkerSession(this);
                if (result && result.reason === "cancelled") return;
                if (!result || !result.ok) {
                    this.error = "Could not export session.";
                }
            } catch (e) {
                console.error("Biomarker session export failed", e);
                this.error = (e && e.message) || "Could not export session.";
            } finally {
                this.exportSessionBusy = false;
            }
        },
        triggerSessionImport() {
            const input = this.$refs.sessionImportInput;
            if (!input) return;
            input.value = "";
            input.click();
        },
        async onSessionImportFileChange(event) {
            const file = event && event.target && event.target.files && event.target.files[0];
            if (event && event.target) event.target.value = "";
            if (!file) return;
            try {
                const payload = await parseBiomarkerSessionImportFile(file);
                this.resetSearch();
                applyBiomarkerSessionImport(this, payload, {
                    setKeyParams: (map) => keyParams.set(map),
                });
            } catch (e) {
                console.error("Biomarker session import failed", e);
                this.error = (e && e.message) || "Could not import session.";
            }
        },
        moveSuggestion(delta) {
            if (!this.suggestionsOpen || !this.flatSuggestions.length) return;
            const n = this.flatSuggestions.length;
            this.suggestionIndex = (this.suggestionIndex + delta + n) % n;
        },
        selectSuggestion(s) {
            this.selectedFactorIri = s.iri || "";
            this.selectedFactorId = s.id != null ? Number(s.id) : null;
            this.userQuery = s.label || "";
            this.searchNeedle = (this.userQuery || "").trim();
            this.closeSuggestions();
            this.$nextTick(() => {
                if (this.$refs.diseaseInput) this.$refs.diseaseInput.focus();
            });
        },
        onEnter() {
            if (
                this.suggestionsOpen &&
                this.suggestionIndex >= 0 &&
                this.flatSuggestions[this.suggestionIndex]
            ) {
                this.selectSuggestion(this.flatSuggestions[this.suggestionIndex]);
                return;
            }
            this.runSearch();
        },
        isDiseaseSelected(diseaseIri) {
            const key = String(diseaseIri || "");
            if (!key) return false;
            return this.selectedDiseaseIds[key] !== false;
        },
        setDiseaseSelected(diseaseIri, checked) {
            const key = String(diseaseIri || "");
            if (!key) return;
            this.$set(this.selectedDiseaseIds, key, !!checked);
        },
        toggleAllDiseases(checked) {
            const next = {};
            (this.associatedDiseases || []).forEach((d) => {
                if (d && d.disease) next[d.disease] = !!checked;
            });
            this.selectedDiseaseIds = next;
        },
        selectAllAssociatedDiseases() {
            this.toggleAllDiseases(true);
        },
        isTypeVisible(label) {
            return !this.hiddenTypes[label];
        },
        isDiseaseVisible(iri) {
            return !this.hiddenDiseases[iri];
        },
        clampPages() {
            const maxBio = Math.max(1, Math.ceil(this.filteredRows.length / this.perPage) || 1);
            if (this.currentPage > maxBio) this.currentPage = maxBio;
            const maxMech = Math.max(
                1,
                Math.ceil((this.associatedDiseases || []).length / this.perPage) || 1
            );
            if (this.mechanismPage > maxMech) this.mechanismPage = maxMech;
        },
        toggleTypeFilter(label) {
            if (this.hiddenTypes[label]) {
                this.$delete(this.hiddenTypes, label);
            } else {
                this.$set(this.hiddenTypes, label, true);
            }
            this.clampPages();
        },
        toggleDiseaseFilter(iri) {
            if (this.hiddenDiseases[iri]) {
                this.$delete(this.hiddenDiseases, iri);
            } else {
                this.$set(this.hiddenDiseases, iri, true);
            }
            this.clampPages();
        },
        toggleMappedGeneOverlapFilter() {
            this.mappedGeneOverlapFilter = !this.mappedGeneOverlapFilter;
            this.clampPages();
        },
        writeSearchParams(factorId) {
            const nextFactor =
                factorId != null && Number.isFinite(Number(factorId)) && Number(factorId) > 0
                    ? String(Number(factorId))
                    : "";
            if (!nextFactor) return;
            if (String(keyParams.factor || "") === nextFactor && !keyParams.disease) return;
            keyParams.set({ disease: "", factor: nextFactor });
        },
        biomarkerDisplayLabel(row) {
            const label = (row && row.biomarkerLabel) || "";
            if (/^https?:\/\//i.test(label)) {
                return (row && row.biomarkerIdentifier) || label;
            }
            return label || (row && row.biomarkerIdentifier) || "—";
        },
        biomarkerTableExportFilename() {
            const slug = String(this.searchedFactorLabel || this.lastNeedle || "biomarkers")
                .trim()
                .replace(/[^\w.-]+/g, "_")
                .replace(/^_+|_+$/g, "")
                .slice(0, 48);
            const date = new Date().toISOString().slice(0, 10);
            return `biomarker_network_${slug || "biomarkers"}_${date}`;
        },
        downloadBiomarkerTable(format) {
            const rows = this.biomarkerTableExportRows;
            if (!rows.length) return;
            const filename = this.biomarkerTableExportFilename();
            if (format === "tsv") {
                uiUtils.convertJson2Tsv(rows, filename);
            } else {
                uiUtils.convertJson2Csv(rows, filename);
            }
        },
        resetMechanismLinkSummary() {
            this.mechanismLinkSummary = {
                status: "idle",
                data: null,
                error: "",
                rowCount: 0,
                generatedAt: null,
            };
            this.mechanismLinkStatus = "";
            this.mechanismLinkLoading = false;
        },
        toggleMechanismLinkAccordion() {
            this.mechanismLinkAccordionOpen = !this.mechanismLinkAccordionOpen;
        },
        async generateMechanismLinkSummary() {
            if (
                this.mechanismLinkLoading ||
                !this.biomarkersFetched ||
                !this.filteredRows.length
            ) {
                return;
            }

            this.mechanismLinkAccordionOpen = true;
            this.mechanismLinkLoading = true;
            this.mechanismLinkSummary = {
                status: "loading",
                data: null,
                error: "",
                rowCount: this.filteredRows.length,
                generatedAt: null,
            };

            try {
                const batchInput = buildMechanismLinkBatchInputFromVm(this);
                const result = await fetchBiomarkerMechanismLinkSummary(this, batchInput, {
                    onStatus: (msg) => {
                        this.mechanismLinkStatus = msg;
                    },
                });
                if (!result.ok) {
                    throw result.error || new Error("Mechanistic summary request failed.");
                }
                this.mechanismLinkSummary = {
                    status: "done",
                    data: result.summary,
                    error: "",
                    rowCount: this.filteredRows.length,
                    generatedAt: new Date().toISOString(),
                };
            } catch (e) {
                this.mechanismLinkSummary = {
                    status: "error",
                    data: null,
                    error: (e && e.message) || "Mechanistic summary request failed.",
                    rowCount: this.filteredRows.length,
                    generatedAt: null,
                };
            } finally {
                this.mechanismLinkLoading = false;
                this.mechanismLinkStatus = "";
            }
        },
        formatScore(value, digits = 2) {
            if (value == null || value === "" || Number.isNaN(Number(value))) return "—";
            return Number(value).toFixed(digits);
        },
        async fetchSharedGenes(diseaseIri) {
            const key = diseaseIri;
            if (Array.isArray(this.diseaseGenes[key])) {
                return this.diseaseGenes[key];
            }
            if (this.sharedGenesPreloadPromise) {
                await this.sharedGenesPreloadPromise.catch(() => {});
            }
            if (Array.isArray(this.diseaseGenes[key])) {
                return this.diseaseGenes[key];
            }
            const genes = await listSharedGenesForFactorDisease(
                this.selectedFactorIri,
                diseaseIri
            );
            this.$set(this.diseaseGenes, key, genes);
            return genes;
        },
        async preloadSharedGenes(diseaseIris, signal) {
            const list = (diseaseIris || []).filter(Boolean);
            if (!this.selectedFactorIri || !list.length) return;

            this.sharedGenesLoading = true;
            const run = listSharedGenesByDiseaseForFactor(this.selectedFactorIri, list, {
                signal,
            })
                .then((grouped) => {
                    list.forEach((iri) => {
                        this.$set(this.diseaseGenes, iri, grouped[iri] || []);
                    });
                })
                .catch((e) => {
                    if (e && e.name === "AbortError") throw e;
                    list.forEach((iri) => {
                        if (!Array.isArray(this.diseaseGenes[iri])) {
                            this.$set(this.diseaseGenes, iri, []);
                        }
                    });
                })
                .finally(() => {
                    this.sharedGenesLoading = false;
                    if (this.sharedGenesPreloadPromise === run) {
                        this.sharedGenesPreloadPromise = null;
                    }
                });

            this.sharedGenesPreloadPromise = run;
            await run;
        },
        async toggleDiseaseGenes(row) {
            const key = row.disease;
            if (this.expandedDiseases[key]) {
                this.$set(this.expandedDiseases, key, false);
                return;
            }
            this.$set(this.expandedDiseases, key, true);
            if (!Array.isArray(this.diseaseGenes[key])) {
                this.$set(this.diseaseGenes, key, "loading");
                try {
                    await this.fetchSharedGenes(row.disease);
                } catch (e) {
                    this.$set(this.diseaseGenes, key, []);
                    return;
                }
            }
            const genes = this.diseaseGenes[key];
            if (Array.isArray(genes) && genes.length) {
                this.addGenesForDisease(key, genes);
            }
        },
        rowAssociatedGenes(row) {
            if (row && Array.isArray(row.geneList) && row.geneList.length) {
                return row.geneList;
            }
            return String((row && row.genes) || "")
                .split(" | ")
                .map((s) => s.trim())
                .filter(Boolean);
        },
        rowSharedGeneMappingInput(row) {
            return {
                associatedGenes: this.rowAssociatedGenes(row),
                diseaseLabels: (row && row.diseaseList) || [],
                diseaseByLabel: this.diseaseByLabel,
                diseaseGenes: this.diseaseGenes,
                geneDisplayLabel: (entry) => this.geneDisplayLabel(entry),
            };
        },
        rowSharedGeneMapping(row) {
            return getRowSharedGeneMapping(this.rowSharedGeneMappingInput(row));
        },
        isRowGeneShared(row, gene) {
            const symKey = normalizeGeneSymbol(gene);
            if (!symKey) return false;
            return this.rowSharedGeneMapping(row).mappedSymbolSet.has(symKey);
        },
        normalizeGeneId(g) {
            const label = this.geneDisplayLabel(g);
            const canonical = canonicalGeneNodeId(label);
            if (canonical) return canonical;
            const iri = g && g.gene != null ? String(g.gene).trim() : "";
            return iri || "";
        },
        geneDisplayLabel(g) {
            const label = g && g.geneLabel != null ? String(g.geneLabel).trim() : "";
            if (label) return label;
            const iri = g && g.gene != null ? String(g.gene).trim() : "";
            if (!iri) return "";
            const parts = iri.split(/[/#]/);
            const last = parts[parts.length - 1] || iri;
            return last.replace(/^NCBIGene:/i, "").replace(/^HGNC:/i, "") || last;
        },
        dedupeGenesById(genes) {
            const byId = new Map();
            (genes || []).forEach((g) => {
                const geneId = this.normalizeGeneId(g);
                if (!geneId) return;
                const existing = byId.get(geneId);
                if (!existing) {
                    byId.set(geneId, { ...g });
                    return;
                }
                existing.factorLoading = this.maxAbsMetric(
                    existing.factorLoading,
                    g.factorLoading
                );
                existing.pigeanScore = this.maxAbsMetric(existing.pigeanScore, g.pigeanScore);
                if (!existing.geneLabel && g.geneLabel) existing.geneLabel = g.geneLabel;
                if (!existing.gene && g.gene) existing.gene = g.gene;
            });
            return Array.from(byId.values());
        },
        maxAbsMetric(a, b) {
            const aNum = a == null || Number.isNaN(Number(a)) ? null : Math.abs(Number(a));
            const bNum = b == null || Number.isNaN(Number(b)) ? null : Math.abs(Number(b));
            if (aNum == null) return b;
            if (bNum == null) return a;
            return aNum >= bNum ? a : b;
        },
        normalizeDiseaseKey(diseaseIri) {
            return String(diseaseIri || "").trim();
        },
        /**
         * Step 1 / 5: fold a disease's shared genes into the gene-keyed registry.
         * Existing gene keys gain another entry in their diseases array.
         */
        mergeGenesIntoRegistry(diseaseIri, genes) {
            const diseaseId = this.normalizeDiseaseKey(diseaseIri);
            if (!diseaseId) return;

            (genes || []).forEach((g) => {
                const symbol = this.geneDisplayLabel(g);
                const symKey = String(symbol || "").trim().toUpperCase();
                if (!symKey) return;

                const entry = this.geneRegistry[symKey] || { symbol, diseases: [] };
                const diseases = entry.diseases.filter((d) => d.disease !== diseaseId);
                diseases.push({
                    disease: diseaseId,
                    factorLoading: g.factorLoading,
                    pigeanScore: g.pigeanScore,
                });
                this.$set(this.geneRegistry, symKey, {
                    symbol: entry.symbol || symbol,
                    diseases,
                });
            });
        },
        /**
         * Records a disease's genes. The network re-derives itself from this
         * state, so no direct graph manipulation is needed here.
         */
        addGenesForDisease(diseaseIri, genes) {
            const diseaseKey = this.normalizeDiseaseKey(diseaseIri);
            if (!diseaseKey || !Array.isArray(genes) || !genes.length) return;
            this.mergeGenesIntoRegistry(diseaseKey, this.dedupeGenesById(genes));
            this.$set(this.networkExpandedDiseases, diseaseKey, true);
        },
        async onViewSharedGenesInNetwork(payload) {
            const diseaseIri = payload && payload.nodeId;
            if (!diseaseIri) return;
            try {
                const genes = await this.fetchSharedGenes(diseaseIri);
                this.addGenesForDisease(diseaseIri, genes);
            } catch (e) {
                /* ignore */
            }
        },
        /**
         * Collapse a disease's gene layer: drop exclusive genes, keep genes that
         * still connect to other expanded diseases, and restore the direct
         * factor→disease edge.
         */
        onHideGenesInNetwork(payload) {
            const diseaseId = this.normalizeDiseaseKey(payload && payload.nodeId);
            if (!diseaseId || !this.networkExpandedDiseases[diseaseId]) return;

            Object.keys(this.geneRegistry).forEach((symKey) => {
                const entry = this.geneRegistry[symKey];
                if (!entry || !Array.isArray(entry.diseases)) return;
                const remaining = entry.diseases.filter((d) => d.disease !== diseaseId);
                if (!remaining.length) {
                    this.$delete(this.geneRegistry, symKey);
                } else if (remaining.length !== entry.diseases.length) {
                    this.$set(this.geneRegistry, symKey, {
                        symbol: entry.symbol,
                        diseases: remaining,
                    });
                }
            });

            this.$set(this.networkExpandedDiseases, diseaseId, false);
        },
        async resolveSelectedFactor(needle) {
            if (this.selectedFactorIri) {
                const match = (this.factorSuggestions || []).find(
                    (s) => s.iri === this.selectedFactorIri
                );
                if (match) return match;
                if (this.selectedFactorId != null) {
                    const catalog = getFactorById(this.selectedFactorId);
                    if (catalog && catalog.iri === this.selectedFactorIri) {
                        return {
                            id: catalog.id,
                            iri: catalog.iri,
                            label: catalog.label || this.searchedFactorLabel || needle,
                        };
                    }
                }
                return {
                    id: this.selectedFactorId,
                    iri: this.selectedFactorIri,
                    label: this.searchedFactorLabel || needle,
                };
            }
            const exact = (this.factorSuggestions || []).filter(
                (s) => String(s.label || "").toLowerCase() === needle.toLowerCase()
            );
            if (exact.length === 1) return exact[0];
            const hits = await searchBiomarkerFactors(needle, { limit: SUGGESTION_LIMIT });
            this.factorSuggestions = hits;
            const exactHits = hits.filter(
                (s) => String(s.label || "").toLowerCase() === needle.toLowerCase()
            );
            if (exactHits.length === 1) return exactHits[0];
            if (hits.length === 1) return hits[0];
            return null;
        },
        async runSearch(options = {}) {
            const needle = (this.userQuery || "").trim();
            if (!needle) return;
            if (this.loading && !options.allowWhileLoading) return;

            if (!options.allowWhileLoading) {
                this.loading = true;
                this.loadingMessage = "Looking up mechanism…";
            }
            this.error = "";

            let factor;
            try {
                factor = await this.resolveSelectedFactor(needle);
            } catch (e) {
                this.error = (e && e.message) || "Could not resolve mechanism.";
                this.loading = false;
                this.loadingMessage = "";
                return;
            }
            if (!factor || !factor.iri) {
                this.error = "Pick a mechanism from the list.";
                this.searched = false;
                this.biomarkersFetched = false;
                this.counts = null;
                this.rows = [];
                this.associatedDiseases = [];
                this.selectedDiseaseIds = {};
                this.searchedFactorLabel = "";
                this.suggestionsOpen = true;
                this.loading = false;
                this.loadingMessage = "";
                return;
            }

            this.selectedFactorIri = factor.iri;
            this.selectedFactorId = factor.id != null ? Number(factor.id) : this.selectedFactorId;
            this.searchedFactorLabel = factor.label || needle;
            this.writeSearchParams(this.selectedFactorId);

            this.cancelInFlight();
            const ac = new AbortController();
            this.abortController = ac;

            this.closeSuggestions();
            this.loading = true;
            this.biomarkerLoading = false;
            this.error = "";
            this.searched = true;
            this.biomarkersFetched = false;
            this.lastNeedle = needle;
            this.counts = null;
            this.rows = [];
            this.associatedDiseases = [];
            this.selectedDiseaseIds = {};
            this.truncatedFetch = false;
            this.fetchLimit = BIOMARKER_LIMIT;
            this.currentPage = 1;
            this.mechanismPage = 1;
            this.hiddenTypes = {};
            this.hiddenDiseases = {};
            this.mappedGeneOverlapFilter = false;
            this.expandedDiseases = {};
            this.diseaseGenes = {};
            this.sharedGenesLoading = false;
            this.sharedGenesPreloadPromise = null;
            this.networkExpandedDiseases = {};
            this.geneRegistry = {};
            this.resetMechanismLinkSummary();
            this.mechanismLinkAccordionOpen = false;
            this.mechanismAccordionOpen = false;
            this.diseasesAccordionOpen = true;
            this.biomarkersAccordionOpen = false;

            try {
                this.loadingMessage = "Finding associated diseases…";
                const diseases = await listMondoDiseasesForFactor(factor.iri, {
                    signal: ac.signal,
                });
                if (ac.signal.aborted) return;
                this.associatedDiseases = diseases;
                this.selectAllAssociatedDiseases();
                this.counts = {
                    biomarkerCount: 0,
                    diseaseCount: diseases.length,
                };
                this.loadingMessage = "Loading shared genes…";
                await this.preloadSharedGenes(
                    diseases.map((d) => d.disease).filter(Boolean),
                    ac.signal
                );
            } catch (e) {
                if (e && e.name === "AbortError") return;
                this.error = (e && e.message) || "Search failed.";
                this.counts = null;
                this.rows = [];
                this.associatedDiseases = [];
                this.selectedDiseaseIds = {};
            } finally {
                if (this.abortController === ac) this.abortController = null;
                this.loading = false;
                this.loadingMessage = "";
            }
        },
        async fetchBiomarkers() {
            if (this.biomarkerLoading || this.loading) return;
            const diseaseIris = (this.associatedDiseases || [])
                .map((d) => d.disease)
                .filter((iri) => iri && this.isDiseaseSelected(iri));
            if (!diseaseIris.length) {
                this.error = "Select at least one associated disease.";
                return;
            }

            if (this.biomarkerAbortController) {
                this.biomarkerAbortController.abort();
            }
            const ac = new AbortController();
            this.biomarkerAbortController = ac;

            this.error = "";
            this.biomarkerLoading = true;
            this.loadingMessage = "Finding biomarkers…";
            this.diseasesAccordionOpen = false;
            this.biomarkersAccordionOpen = true;
            this.rows = [];
            this.biomarkersFetched = false;
            this.truncatedFetch = false;
            this.currentPage = 1;
            this.hiddenTypes = {};
            this.hiddenDiseases = {};
            this.mappedGeneOverlapFilter = false;
            this.resetMechanismLinkSummary();
            this.mechanismLinkAccordionOpen = false;

            try {
                const rows = await listBiomarkersForMondoDiseases(diseaseIris, {
                    limit: BIOMARKER_LIMIT,
                    signal: ac.signal,
                });
                if (ac.signal.aborted) return;
                this.truncatedFetch = rows.length >= BIOMARKER_LIMIT;
                this.rows = rows;
                this.biomarkersFetched = true;
                this.counts = {
                    biomarkerCount: rows.length,
                    diseaseCount: (this.associatedDiseases || []).length,
                };
            } catch (e) {
                if (e && e.name === "AbortError") return;
                this.error = (e && e.message) || "Could not fetch biomarkers.";
                this.rows = [];
                this.biomarkersFetched = false;
                if (this.counts) {
                    this.counts = {
                        ...this.counts,
                        biomarkerCount: 0,
                    };
                }
            } finally {
                if (this.biomarkerAbortController === ac) this.biomarkerAbortController = null;
                this.biomarkerLoading = false;
                this.loadingMessage = "";
            }
        },
    },
});
</script>

<style scoped>
.biomarker-network {
    --cfde-orange: #e4572e;
    --cfde-blue: #1f4e79;
    --cfde-border: #e6e1d6;
    --cfde-bg: #f6f5f2;
    --cfde-muted: #6b6b6b;
    display: flex;
    flex-direction: column;
    min-height: 520px;
    height: auto;
    background: #fff;
    border: 1px solid var(--cfde-border);
    border-radius: 6px;
    overflow: visible;
}

.rkw-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--cfde-border);
    background: #ffffff;
}

.rkw-brand {
    display: flex;
    align-items: baseline;
    gap: 7px;
}

.rkw-mark {
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cfde-orange);
    font-size: 1.05rem;
}

.rkw-title {
    font-weight: 600;
    color: var(--cfde-blue);
    font-size: 1.05rem;
}

.bn-header-ops {
    margin-left: auto;
    display: flex;
    align-items: center;
}

.bn-ops-menu {
    position: relative;
}

.bn-ops-menu::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    height: 8px;
}

.bn-ops-menu-toggle {
    padding: 4px 10px;
    border: 1px solid var(--cfde-border);
    border-radius: 6px;
    background: #fff;
    color: var(--cfde-blue);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
}

.bn-ops-menu-list {
    display: none;
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 40;
    min-width: 168px;
    padding: 4px;
    border: 1px solid #d5d5d5;
    border-radius: 5px;
    background: #fff;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.14);
}

.bn-ops-menu:hover .bn-ops-menu-list,
.bn-ops-menu:focus-within .bn-ops-menu-list {
    display: block;
}

.bn-ops-menu-item {
    display: block;
    width: 100%;
    padding: 7px 10px;
    border: 0;
    border-radius: 3px;
    background: transparent;
    text-align: left;
    font-size: 12px;
    color: #21618c;
    cursor: pointer;
}

.bn-ops-menu-item:hover:not(:disabled) {
    background: #f0f6fb;
}

.bn-ops-menu-item:disabled {
    color: #9aa5ad;
    cursor: not-allowed;
}

.bn-body {
    padding: 18px 20px 28px;
}

.bn-label {
    display: block;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 6px;
}

.bn-search-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.bn-input-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
}

.bn-query-input--clearable {
    padding-right: 44px;
}

.bn-clear-bubble {
    position: absolute;
    top: 50%;
    right: 8px;
    z-index: 2;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--cfde-blue);
    background: var(--cfde-blue);
    color: #fff;
    border-radius: 999px;
    line-height: 1;
    cursor: pointer;
}

.bn-clear-bubble >>> .b-icon {
    width: 14px;
    height: 14px;
}

.bn-find-diseases-btn,
.bn-find-biomarkers-btn {
    white-space: nowrap;
}

.bn-suggestions {
    position: absolute;
    z-index: 20;
    left: 0;
    right: 0;
    top: calc(100% + 2px);
    margin: 0;
    padding: 4px 0;
    list-style: none;
    background: #fff;
    border: 1px solid var(--cfde-border);
    border-radius: 4px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    max-height: 320px;
    overflow: auto;
}

.bn-suggestion-group {
    padding: 8px 12px 4px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--cfde-muted);
}

.bn-suggestion {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 12px;
    cursor: pointer;
    font-size: 0.9rem;
}

.bn-suggestion:hover,
.bn-suggestion--active {
    background: var(--cfde-bg);
}

.bn-suggestion--muted {
    color: var(--cfde-muted);
    cursor: default;
}

.bn-suggestion-id {
    color: var(--cfde-muted);
    font-size: 0.8rem;
    flex-shrink: 0;
}

.bn-status {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 16px 0;
    color: var(--cfde-muted);
}

.bn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #d0d0d0;
    border-top-color: var(--cfde-orange);
    border-radius: 50%;
    animation: bn-spin 0.7s linear infinite;
}

@keyframes bn-spin {
    to {
        transform: rotate(360deg);
    }
}

.bn-counts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 14px;
    font-size: 0.95rem;
}

.bn-counts-sep {
    margin: 0 2px;
    color: var(--cfde-muted);
}

.bn-disease-bubble {
    display: inline-block;
    border: 1px solid var(--cfde-blue);
    background: var(--cfde-blue);
    color: #fff;
    border-radius: 999px;
    padding: 3px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.3;
}

.bn-accordions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.bn-accordion {
    border: 1px solid var(--cfde-border);
    border-radius: 6px;
    background: #fff;
    overflow: hidden;
}

.bn-accordion--mechanism.bn-accordion--open {
    overflow: visible;
    position: relative;
    z-index: 5;
}

.bn-accordion--mechanism.bn-accordion--suggesting {
    z-index: 30;
}

.bn-accordion-header {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #faf9f7;
}

.bn-accordion--open .bn-accordion-header {
    border-bottom: 1px solid var(--cfde-border);
}

.bn-accordion-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    min-width: 0;
    padding: 11px 14px;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
}

.bn-accordion-trigger:hover {
    background: #f3f1ec;
}

.bn-accordion--open .bn-accordion-trigger {
    border-bottom: 0;
}

.bn-accordion-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    padding: 8px 14px 8px 0;
}

.bn-accordion-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--cfde-blue);
}

.bn-accordion-step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--cfde-orange);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
}

.bn-accordion-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    padding: 1px 7px;
    border-radius: 999px;
    background: #e8eef5;
    color: var(--cfde-blue);
    font-size: 0.75rem;
    font-weight: 600;
}

.bn-accordion-chevron {
    width: 8px;
    height: 8px;
    border-right: 2px solid #888;
    border-bottom: 2px solid #888;
    transform: rotate(45deg);
    transition: transform 0.15s ease;
}

.bn-accordion--open .bn-accordion-chevron {
    transform: rotate(-135deg);
}

.bn-accordion-panel {
    padding: 14px 14px 16px;
}

.bn-step-hint {
    margin: 0 0 12px;
    font-size: 0.86rem;
    color: var(--cfde-muted);
}

.bn-check-col {
    width: 36px;
    text-align: center;
    vertical-align: middle;
}

.bn-fetch-meta {
    font-size: 0.8rem;
    white-space: nowrap;
}

.bn-mechanism-network {
    margin: 8px 0 16px;
}

.bn-type-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 14px;
}

.bn-type-filters-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--cfde-muted);
}

.bn-type-bubble {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--cfde-blue);
    background: var(--cfde-blue);
    color: #fff;
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 0.8rem;
    line-height: 1.3;
    cursor: pointer;
}

.bn-type-bubble >>> .b-icon {
    width: 0.85em;
    height: 0.85em;
}

.bn-type-bubble:hover,
.bn-type-bubble:focus {
    opacity: 0.92;
}

.bn-type-bubble--off {
    background: #fff;
    color: var(--cfde-muted);
    border-color: var(--cfde-border);
    text-decoration: line-through;
}

.bn-filter-empty {
    margin: 0 0 8px;
    color: var(--cfde-muted);
    font-size: 0.9rem;
}

.bn-table-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 6px 10px;
    margin-bottom: 8px;
}

.bn-table-toolbar-label {
    font-size: 12px;
    font-weight: 600;
    color: #444;
}

.bn-table-toolbar-meta {
    font-size: 11px;
}

.bn-table-download-btn {
    border: solid 1px #aaa;
    background-color: #fff;
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 12px;
    line-height: 1.4;
    color: #333;
}

.bn-table-download-btn:hover {
    cursor: pointer;
    background-color: #eee;
}

.bn-mechanism-link-card {
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 10px;
    background: #fafafa;
}

.bn-mechanism-link-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
}

.bn-mechanism-link-genes {
    font-size: 12px;
}

.bn-mechanism-link-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--cfde-muted);
}

.bn-mechanism-link-result-wrap {
    margin-top: 4px;
    padding: 10px 12px;
    border-radius: 4px;
    background: #fff;
    border: 1px solid #ececec;
}

.bn-table th {
    border-top: 0;
    white-space: nowrap;
}

.bn-th-info {
    margin-left: 4px;
    color: var(--cfde-muted);
    cursor: help;
    font-size: 0.82em;
    vertical-align: middle;
}
.bn-subtable-row td {
    padding: 0 !important;
    background: transparent;
}
.bn-subtable-wrap {
    margin: 6px 12px 8px;
    padding: 6px 8px;
    background: #efefef;
    border-radius: 4px;
}
.bn-subtable {
    font-size: 0.86em;
    width: 100%;
}
.bn-subtable >>> thead th {
    background: #e3e3e3;
    font-weight: 600;
}
.bn-subtable >>> tbody tr:nth-of-type(odd) {
    background: #f4f4f4;
}
.bn-shared-gene-toggle {
    color: var(--cfde-blue);
    text-decoration: none;
}
.bn-shared-gene-toggle:hover,
.bn-shared-gene-toggle:focus {
    text-decoration: none;
}

.bn-gene-mapped {
    color: var(--cfde-orange);
    font-weight: 600;
}

.bn-disease-filters-block {
    margin-bottom: 4px;
}

.bn-table td {
    vertical-align: top;
    word-break: break-word;
}

.bn-table a {
    color: var(--cfde-blue);
}

.btn-cfde {
    background: var(--cfde-orange);
    border-color: var(--cfde-orange);
    color: #fff;
}

.btn-cfde:hover,
.btn-cfde:focus,
.btn-cfde:active {
    background: #c94822;
    border-color: #c94822;
    color: #fff;
}

.btn-cfde:disabled {
    opacity: 0.65;
}
</style>
