<template>
    <div class="reveal-kg-workspace biomarker-network">
        <header class="rkw-header">
            <div class="rkw-brand">
                <span class="rkw-mark">CFDE KG</span>
                <span class="rkw-title">&lt;-&gt; BiomarkerKB</span>
            </div>
        </header>

        <div class="bn-body">
            <div class="bn-search-panel">
                <label class="bn-label" for="bn-disease-input">Mechanism</label>
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
                            aria-label="Reset search"
                            title="Reset search"
                            @click="resetSearch"
                        >
                            <b-icon icon="x" aria-hidden="true" />
                        </button>
                        <ul
                            v-if="suggestionsOpen && (flatSuggestions.length || suggestionsLoading)"
                            class="bn-suggestions"
                            role="listbox"
                        >
                            <li v-if="suggestionsLoading && !flatSuggestions.length" class="bn-suggestion bn-suggestion--muted">
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
                    <button
                        type="button"
                        class="btn btn-cfde bn-search-btn"
                        :disabled="loading || !searchNeedle"
                        @click="runSearch"
                    >
                        Search
                    </button>
                </div>
            </div>

            <div v-if="loading" class="bn-status bn-status--loading" role="status">
                <span class="bn-spinner" aria-hidden="true" />
                {{ loadingMessage }}
            </div>
            <div v-else-if="error" class="alert alert-danger py-2 mb-3">{{ error }}</div>

            <div v-if="counts && !loading" class="bn-counts">
                <span v-if="searchedFactorLabel" class="bn-disease-bubble">{{ searchedFactorLabel }}</span>
                <span
                    ><strong>{{ counts.biomarkerCount }}</strong> biomarkers</span
                >
                <span class="bn-counts-sep">·</span>
                <span
                    ><strong>{{ counts.diseaseCount }}</strong> associated diseases</span
                >
                <span v-if="truncatedFetch" class="bn-counts-sep">·</span>
                <span v-if="truncatedFetch" class="text-muted"
                    >list truncated at limit {{ fetchLimit }}</span
                >
            </div>

            <div v-if="showResultTabs && !loading" class="bn-results">
                <div class="bn-tabs" role="tablist">
                    <button
                        type="button"
                        class="bn-tab"
                        :class="{ 'bn-tab--active': activeTab === 'biomarkers' }"
                        role="tab"
                        :aria-selected="activeTab === 'biomarkers' ? 'true' : 'false'"
                        @click="activeTab = 'biomarkers'"
                    >
                        Biomarkers
                    </button>
                    <button
                        type="button"
                        class="bn-tab"
                        :class="{ 'bn-tab--active': activeTab === 'mechanisms' }"
                        role="tab"
                        :aria-selected="activeTab === 'mechanisms' ? 'true' : 'false'"
                        @click="activeTab = 'mechanisms'"
                    >
                        Associated diseases
                    </button>
                </div>

                <div v-show="activeTab === 'biomarkers'" class="bn-table-wrap" role="tabpanel">
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
                    <p v-if="!rows.length" class="bn-filter-empty">
                        No biomarkers found for “{{ lastNeedle }}”.
                    </p>
                    <p v-else-if="!filteredRows.length" class="bn-filter-empty">
                        No rows for the selected filters.
                    </p>
                    <table v-else class="table table-sm table-hover bn-table">
                        <thead>
                            <tr>
                                <th scope="col">Biomarker</th>
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
            <tr v-for="(row, idx) in pageRows" :key="row.biomarker + '-' + idx">
                                <td>
                                    <a
                                        v-if="row.biomarker"
                                        :href="row.biomarker"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >{{ biomarkerDisplayLabel(row) }}</a>
                                    <span v-else>{{ biomarkerDisplayLabel(row) }}</span>
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
                </div>

                <div v-if="activeTab === 'mechanisms'" class="bn-table-wrap" role="tabpanel">
                    <p v-if="!associatedDiseases.length" class="bn-filter-empty">
                        No associated MONDO diseases for this mechanism.
                    </p>
                    <template v-else>
                    <div
                        v-if="mechanismNetwork.nodes.length"
                        class="bn-mechanism-network"
                    >
                        <factor-base-reveal-network
                            ref="mechNetwork"
                            :key="'mech-net-' + mechanismNetworkKey"
                            :network="mechanismNetwork"
                            :height="480"
                            keep-physics-enabled
                            preserve-edge-direction
                            :use-gene-role-colors="false"
                            :show-selected-anchor-legend="false"
                            :legend-type-labels="mechanismLegendLabels"
                            phenotype-node-metric-key="aggregatePigeanScore"
                            gene-node-metric-key="pigeanScore"
                            edge-distance-metric-key="edgeStrength"
                            disease-node-menu-enabled
                            :genes-fetched-disease-ids="genesFetchedDiseaseIds"
                            @view-shared-genes="onViewSharedGenesInNetwork"
                        />
                    </div>
                    <table class="table table-sm table-hover bn-table">
                        <thead>
                            <tr>
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
                            <tr v-if="expandedDiseases[row.disease]" :key="row.disease + '-genes'" class="bn-subtable-row">
                                <td colspan="4">
                                    <div v-if="diseaseGenes[row.disease] === 'loading'" class="text-center text-muted py-2">
                                        Loading genes…
                                    </div>
                                    <div v-else-if="diseaseGenes[row.disease] && diseaseGenes[row.disease].length" class="bn-subtable-wrap">
                                        <table class="table table-sm table-borderless table-striped mb-0 bn-subtable">
                                            <thead>
                                                <tr>
                                                    <th>Gene</th>
                                                    <th>Factor loading</th>
                                                    <th>PIGEAN score</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="g in diseaseGenes[row.disease]" :key="g.gene">
                                                    <td>{{ g.geneLabel || g.gene }}</td>
                                                    <td>{{ formatScore(g.factorLoading, 4) }}</td>
                                                    <td>{{ formatScore(g.pigeanScore) }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <p v-else class="text-muted mb-0 py-1">No gene data available.</p>
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
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import {
    canonicalGeneNodeId,
} from "./biomarkerNetwork/geneNodeIds.js";
import FactorBaseRevealNetwork from "./FactorBaseRevealNetwork2.vue";
import keyParams from "@/utils/keyParams";
import {
    getFactorLabel,
    searchFactorsByLabel,
    listMondoDiseasesForFactor,
    listSharedGenesForFactorDisease,
} from "./biomarkerNetwork/cfdeKgSparql.js";
import { listBiomarkersForMondoDiseases } from "./biomarkerNetwork/biomarkerKbSparql.js";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

const PER_PAGE = 10;
const SUGGESTION_LIMIT = 12;
const SUGGESTION_DEBOUNCE_MS = 280;
const BIOMARKER_LIMIT = 100;

export default Vue.component("biomarker-network", {
    components: { FactorBaseRevealNetwork },
    props: ["phenotypesInUse", "utilsBox", "sectionConfigs"],
    data() {
        return {
            userQuery: "",
            searchNeedle: "",
            lastNeedle: "",
            searchedFactorLabel: "",
            selectedFactorIri: "",
            factorSuggestions: [],
            suggestionsOpen: false,
            suggestionsLoading: false,
            suggestionIndex: -1,
            suggestionTimer: null,
            suggestionAbort: null,
            loading: false,
            loadingMessage: "",
            error: "",
            searched: false,
            counts: null,
            rows: [],
            associatedDiseases: [],
            fetchLimit: 0,
            truncatedFetch: false,
            currentPage: 1,
            perPage: PER_PAGE,
            hiddenTypes: {},
            hiddenDiseases: {},
            activeTab: "biomarkers",
            mechanismPage: 1,
            abortController: null,
            expandedDiseases: {},
            diseaseGenes: {},
            networkExpandedDiseases: {},
            networkGeneIds: {},
            networkGeneMeta: {},
            /**
             * Gene-centric registry rebuilt into the network on every fetch:
             * { SYMBOL: { symbol, diseases: [{ disease, factorLoading, pigeanScore }] } }
             */
            geneRegistry: {},
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
        mechanismNetwork() {
            const factorLabel = this.searchedFactorLabel || this.lastNeedle || "Mechanism";
            const factorId = this.selectedFactorIri || "factor:root";
            const nodes = [{ id: factorId, label: factorLabel, type: "Factor" }];
            const edges = [];
            (this.associatedDiseases || []).forEach((d) => {
                const diseaseId = d.disease || `disease:${d.diseaseLabel}`;
                nodes.push({
                    id: diseaseId,
                    label: d.diseaseLabel || d.disease,
                    type: "Phenotype",
                    metadata: {
                        aggregatePigeanScore: d.aggregatePigeanScore,
                        sharedGeneCount: d.sharedGeneCount,
                    },
                });
                edges.push({
                    source: factorId,
                    target: diseaseId,
                    predicate: "",
                    metadata: {
                        edgeStrength: d.highestFactorGeneLoading,
                    },
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
        showResultTabs() {
            return this.searched && (this.rows.length > 0 || this.associatedDiseases.length > 0);
        },
        showSearchClear() {
            return Boolean((this.userQuery || "").trim() || this.searched);
        },
    },
    mounted() {
        const factorFromUrl = keyParams.factor != null ? String(keyParams.factor).trim() : "";
        if (!factorFromUrl) return;
        this.selectedFactorIri = factorFromUrl;
        setTimeout(() => this.hydrateFromUrl(factorFromUrl), 0);
    },
    beforeDestroy() {
        this.cancelInFlight();
        this.cancelSuggestionLookup();
        if (this.suggestionTimer) clearTimeout(this.suggestionTimer);
    },
    methods: {
        cancelInFlight() {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
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
            let label = "";
            try {
                const timeout = new Promise((_, rej) =>
                    setTimeout(() => rej(new Error("timeout")), 8000)
                );
                label = await Promise.race([getFactorLabel(factorRef), timeout]);
            } catch (_) {
                // label stays empty — proceed with the hash as display text
            }
            this.userQuery = label || factorRef;
            this.searchNeedle = this.userQuery;
            if (label) this.searchedFactorLabel = label;
            await this.runSearch({ allowWhileLoading: true });
            if (!this.searchedFactorLabel || this.searchedFactorLabel === factorRef) {
                try {
                    const retryLabel = await getFactorLabel(factorRef);
                    if (retryLabel) {
                        this.searchedFactorLabel = retryLabel;
                        this.userQuery = retryLabel;
                    }
                } catch (_) {}
            }
        },
        onQueryInput() {
            this.searchNeedle = (this.userQuery || "").trim();
            if (this.selectedFactorIri) {
                const selected = (this.factorSuggestions || []).find(
                    (s) => s.iri === this.selectedFactorIri && s.label === this.searchNeedle
                );
                if (!selected && this.searchedFactorLabel !== this.searchNeedle) {
                    this.selectedFactorIri = "";
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
                const hits = await searchFactorsByLabel(needle, {
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
            this.factorSuggestions = [];
            this.loading = false;
            this.loadingMessage = "";
            this.error = "";
            this.searched = false;
            this.counts = null;
            this.rows = [];
            this.associatedDiseases = [];
            this.fetchLimit = 0;
            this.truncatedFetch = false;
            this.currentPage = 1;
            this.mechanismPage = 1;
            this.hiddenTypes = {};
            this.hiddenDiseases = {};
            this.expandedDiseases = {};
            this.diseaseGenes = {};
            this.networkExpandedDiseases = {};
            this.networkGeneIds = {};
            this.networkGeneMeta = {};
            this.geneRegistry = {};
            this.activeTab = "biomarkers";
            keyParams.set({ disease: "", factor: "" });
            this.$nextTick(() => {
                if (this.$refs.diseaseInput) this.$refs.diseaseInput.focus();
            });
        },
        moveSuggestion(delta) {
            if (!this.suggestionsOpen || !this.flatSuggestions.length) return;
            const n = this.flatSuggestions.length;
            this.suggestionIndex = (this.suggestionIndex + delta + n) % n;
        },
        selectSuggestion(s) {
            this.selectedFactorIri = s.iri || "";
            this.userQuery = s.label || "";
            this.searchNeedle = (this.userQuery || "").trim();
            this.closeSuggestions();
            this.$nextTick(() => {
                if (this.$refs.diseaseInput) this.$refs.diseaseInput.focus();
            });
        },
        factorHash(iri) {
            const s = String(iri || "");
            const parts = s.split("/");
            return parts[parts.length - 1] || s;
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
        writeSearchParams(factorIri) {
            const nextFactor = this.factorHash(factorIri);
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
        formatScore(value, digits = 2) {
            if (value == null || value === "" || Number.isNaN(Number(value))) return "—";
            return Number(value).toFixed(digits);
        },
        async fetchSharedGenes(diseaseIri) {
            const key = diseaseIri;
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
                await this.addGenesForDisease(key, genes);
            }
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
         * Steps 2 / 3: gene nodes plus factor→gene and gene→disease edges,
         * derived entirely from the registry.
         */
        buildGeneElementsFromRegistry() {
            const factorId = this.selectedFactorIri;
            const nodes = [];
            const edges = [];

            Object.keys(this.geneRegistry).forEach((symKey) => {
                const entry = this.geneRegistry[symKey];
                if (!entry || !entry.diseases.length) return;
                const symbol = entry.symbol || symKey;
                const nodeId = canonicalGeneNodeId(symbol);
                if (!nodeId) return;

                let factorLoading = null;
                let topPigeanScore = null;
                entry.diseases.forEach((d) => {
                    factorLoading = this.maxAbsMetric(factorLoading, d.factorLoading);
                    topPigeanScore = this.maxAbsMetric(topPigeanScore, d.pigeanScore);
                });

                nodes.push({
                    id: nodeId,
                    label: symbol,
                    type: "Gene",
                    metadata: {
                        geneSymbol: symbol,
                        factorLoading,
                        pigeanScore: topPigeanScore,
                        diseaseCount: entry.diseases.length,
                    },
                });

                edges.push({
                    source: factorId,
                    target: nodeId,
                    metadata: { edgeStrength: factorLoading },
                });
                entry.diseases.forEach((d) => {
                    edges.push({
                        source: nodeId,
                        target: d.disease,
                        metadata: { edgeStrength: d.pigeanScore },
                    });
                });
            });

            return { nodes, edges };
        },
        async addGenesForDisease(diseaseIri, genes) {
            const diseaseKey = this.normalizeDiseaseKey(diseaseIri);
            if (!diseaseKey || !Array.isArray(genes) || !genes.length) return;

            const net = this.$refs.mechNetwork;
            if (!net || typeof net.replaceGeneNodes !== "function") return;

            this.mergeGenesIntoRegistry(diseaseKey, this.dedupeGenesById(genes));
            this.$set(this.networkExpandedDiseases, diseaseKey, true);

            const { nodes, edges } = this.buildGeneElementsFromRegistry();

            this.networkGeneIds = {};
            this.networkGeneMeta = {};
            nodes.forEach((n) => {
                this.$set(this.networkGeneIds, n.id, true);
                this.$set(this.networkGeneMeta, n.id, { ...n.metadata });
            });

            // Steps 6 / 2 / 3 / 4: drop the whole gene layer, rebuild it, re-settle physics.
            net.replaceGeneNodes(nodes, edges, {
                factorId: this.selectedFactorIri,
                diseaseIds: Object.keys(this.networkExpandedDiseases).filter(
                    (id) => this.networkExpandedDiseases[id]
                ),
            });
        },
        async onViewSharedGenesInNetwork(payload) {
            const diseaseIri = payload && payload.nodeId;
            if (!diseaseIri) return;
            try {
                const genes = await this.fetchSharedGenes(diseaseIri);
                await this.addGenesForDisease(diseaseIri, genes);
            } catch (e) {
                /* ignore */
            }
        },
        async resolveSelectedFactor(needle) {
            if (this.selectedFactorIri) {
                const match = (this.factorSuggestions || []).find(
                    (s) => s.iri === this.selectedFactorIri
                );
                if (match) return match;
                const label = this.searchedFactorLabel || needle;
                return { iri: this.selectedFactorIri, label };
            }
            const exact = (this.factorSuggestions || []).filter(
                (s) => String(s.label || "").toLowerCase() === needle.toLowerCase()
            );
            if (exact.length === 1) return exact[0];
            const hits = await searchFactorsByLabel(needle, { limit: SUGGESTION_LIMIT });
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
                this.counts = null;
                this.rows = [];
                this.associatedDiseases = [];
                this.searchedFactorLabel = "";
                this.suggestionsOpen = true;
                this.loading = false;
                this.loadingMessage = "";
                return;
            }

            this.selectedFactorIri = factor.iri;
            this.searchedFactorLabel = factor.label || needle;
            this.writeSearchParams(factor.iri);

            this.cancelInFlight();
            const ac = new AbortController();
            this.abortController = ac;

            this.closeSuggestions();
            this.loading = true;
            this.error = "";
            this.searched = true;
            this.lastNeedle = needle;
            this.counts = null;
            this.rows = [];
            this.associatedDiseases = [];
            this.truncatedFetch = false;
            this.fetchLimit = BIOMARKER_LIMIT;
            this.currentPage = 1;
            this.mechanismPage = 1;
            this.hiddenTypes = {};
            this.hiddenDiseases = {};
            this.expandedDiseases = {};
            this.diseaseGenes = {};
            this.networkExpandedDiseases = {};
            this.networkGeneIds = {};
            this.networkGeneMeta = {};
            this.geneRegistry = {};
            this.activeTab = "biomarkers";

            try {
                this.loadingMessage = "Finding associated diseases…";
                const diseases = await listMondoDiseasesForFactor(factor.iri, {
                    signal: ac.signal,
                });
                if (ac.signal.aborted) return;
                this.associatedDiseases = diseases;
                const diseaseIris = diseases.map((d) => d.disease).filter(Boolean);

                if (!diseaseIris.length) {
                    this.counts = { biomarkerCount: 0, diseaseCount: 0 };
                    return;
                }

                this.loadingMessage = "Fetching biomarkers…";
                const rows = await listBiomarkersForMondoDiseases(diseaseIris, {
                    limit: BIOMARKER_LIMIT,
                    signal: ac.signal,
                });
                if (ac.signal.aborted) return;
                this.truncatedFetch = rows.length >= BIOMARKER_LIMIT;
                this.rows = rows;
                this.counts = {
                    biomarkerCount: rows.length,
                    diseaseCount: diseases.length,
                };
            } catch (e) {
                if (e && e.name === "AbortError") return;
                this.error = (e && e.message) || "Search failed.";
                this.counts = null;
                this.rows = [];
                this.associatedDiseases = [];
            } finally {
                if (this.abortController === ac) this.abortController = null;
                this.loading = false;
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
    overflow: hidden;
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

.bn-search-btn {
    min-width: 110px;
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
    margin: 12px 0 14px;
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

.bn-results {
    margin-top: 4px;
}

.bn-tabs {
    display: flex;
    gap: 0;
    margin: 0 0 14px;
    border-bottom: 1px solid var(--cfde-border);
}

.bn-tab {
    background: none;
    border: 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    padding: 8px 14px;
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--cfde-muted);
    cursor: pointer;
}

.bn-tab--active {
    color: var(--cfde-orange);
    border-bottom-color: var(--cfde-orange);
}

.bn-table-wrap {
    margin-top: 4px;
}

.bn-mechanism-network {
    margin: 35px 0 16px;
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
