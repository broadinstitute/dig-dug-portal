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
                <label class="bn-label" for="bn-disease-input">Disease or mechanism</label>
                <div class="bn-search-row">
                    <div class="bn-input-wrap">
                        <input
                            id="bn-disease-input"
                            ref="diseaseInput"
                            type="text"
                            class="form-control"
                            :class="{ 'bn-query-input--clearable': showSearchClear }"
                            v-model="userQuery"
                            placeholder="Search a disease or mechanism (e.g. Parkinson disease)"
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
                            v-if="suggestionsOpen && flatSuggestions.length"
                            class="bn-suggestions"
                            role="listbox"
                        >
                            <template v-if="groupedSuggestions.diseases.length">
                                <li class="bn-suggestion-group" role="presentation">Diseases</li>
                                <li
                                    v-for="s in groupedSuggestions.diseases"
                                    :key="'d-' + s.iri + '-' + s.label"
                                    class="bn-suggestion"
                                    :class="{ 'bn-suggestion--active': s.flatIndex === suggestionIndex }"
                                    role="option"
                                    @mousedown.prevent="selectSuggestion(s)"
                                >
                                    <span class="bn-suggestion-label">{{ s.label }}</span>
                                    <span class="bn-suggestion-id">{{ diseaseIdShort(s.iri) }}</span>
                                </li>
                            </template>
                            <template v-if="groupedSuggestions.mechanisms.length">
                                <li class="bn-suggestion-group" role="presentation">Mechanisms</li>
                                <li
                                    v-for="s in groupedSuggestions.mechanisms"
                                    :key="'m-' + s.factor"
                                    class="bn-suggestion"
                                    :class="{ 'bn-suggestion--active': s.flatIndex === suggestionIndex }"
                                    role="option"
                                    @mousedown.prevent="selectSuggestion(s)"
                                >
                                    <span class="bn-suggestion-label">{{ s.label }}</span>
                                </li>
                            </template>
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
                <span v-if="searchedDiseaseLabel" class="bn-disease-bubble">{{ searchedDiseaseLabel }}</span>
                <span
                    ><strong>{{ counts.biomarkerCount }}</strong> biomarkers</span
                >
                <span class="bn-counts-sep">·</span>
                <span
                    ><strong>{{ counts.geneCount }}</strong> unique genes</span
                >
                <span v-if="associatedFactors.length" class="bn-counts-sep">·</span>
                <span v-if="associatedFactors.length"
                    ><strong>{{ associatedFactors.length }}</strong> associated mechanisms</span
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
                        Associated mechanisms
                    </button>
                </div>

                <div v-show="activeTab === 'biomarkers'" class="bn-table-wrap" role="tabpanel">
                    <div
                        v-if="uniqueTypeLabels.length"
                        class="bn-type-filters"
                        role="group"
                        aria-label="Filter by biomarker type"
                    >
                        <span class="bn-type-filters-label">Biomarker type:</span>
                        <button
                            v-for="label in uniqueTypeLabels"
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
                                <th scope="col">Type</th>
                                <th scope="col">Gene</th>
                                <th scope="col">Disease</th>
                            </tr>
                        </thead>
                        <tbody>
            <tr v-for="(row, idx) in pageRows" :key="row.biomarker + '-' + row.disease + '-' + idx">
                                <td>
                                    <a
                                        v-if="row.biomarker"
                                        :href="row.biomarker"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >{{ row.biomarkerLabel || row.biomarker }}</a>
                                    <span v-else>{{ row.biomarkerLabel || "—" }}</span>
                                </td>
                                <td>
                                    <a
                                        v-if="row.bestType"
                                        :href="row.bestType"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >{{ row.bestTypeLabel || row.bestType }}</a>
                                    <span v-else class="text-muted">{{ row.bestTypeLabel || "—" }}</span>
                                </td>
                                <td>
                                    <a
                                        v-if="row.geneSymbol"
                                        :href="geneHref(row)"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >{{ row.geneSymbol }}</a>
                                    <span v-else class="text-muted">—</span>
                                </td>
                                <td>
                                    <a
                                        v-if="row.disease"
                                        href="#"
                                        @click.prevent="searchDisease({ iri: row.disease, label: rowDiseaseLabel(row) })"
                                    >{{ rowDiseaseLabel(row) }}</a>
                                    <span v-else class="text-muted">—</span>
                                </td>
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
                    <div
                        v-if="showFactorDiseaseFilters"
                        class="bn-type-filters"
                        role="group"
                        aria-label="Filter mechanisms by disease"
                    >
                        <span class="bn-type-filters-label">Diseases:</span>
                        <button
                            v-for="d in uniqueFactorDiseaseFilters"
                            :key="'fac-' + d.iri"
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
                    <p v-if="!associatedFactors.length" class="bn-filter-empty">
                        No associated mechanisms for this disease.
                    </p>
                    <p v-else-if="!filteredMechanismRows.length" class="bn-filter-empty">
                        No rows for the selected filters.
                    </p>
                    <template v-else>
                    <div
                        v-if="mechanismNetwork.nodes.length"
                        class="bn-mechanism-network"
                    >
                        <factor-base-reveal-network
                            :key="'mech-net-' + mechanismNetworkKey"
                            :network="mechanismNetwork"
                            :height="480"
                            keep-physics-enabled
                            preserve-edge-direction
                            :use-gene-role-colors="false"
                            :show-selected-anchor-legend="false"
                            :legend-type-labels="mechanismLegendLabels"
                        />
                    </div>
                    <table class="table table-sm table-hover bn-table">
                        <thead>
                            <tr>
                                <th scope="col">Mechanism</th>
                                <th scope="col">Disease</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in mechanismPageRows" :key="row.factor">
                                <td>{{ row.factor }}</td>
                                <td>
                                    <template v-for="(d, i) in visibleDiseasesForFactor(row)">
                                        <span :key="'sep-' + row.factor + '-' + d.iri" v-if="i">, </span>
                                        <a
                                            :key="row.factor + '-' + d.iri"
                                            href="#"
                                            @click.prevent="searchDisease(d)"
                                        >{{ d.label }}</a>
                                    </template>
                                    <span v-if="!visibleDiseasesForFactor(row).length" class="text-muted">—</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <b-pagination
                        v-if="filteredMechanismRows.length > perPage"
                        class="pagination-sm justify-content-center mt-2"
                        v-model="mechanismPage"
                        :total-rows="filteredMechanismRows.length"
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
import FactorBaseRevealNetwork from "./FactorBaseRevealNetwork2.vue";
import { getBiomarkerDiseaseFactorData } from "./biomarkerNetwork/biomarkerDiseaseFactors.js";
import keyParams from "@/utils/keyParams";
import {
    countBiomarkersForDisease,
    listBiomarkersForDisease,
} from "./biomarkerNetwork/biomarkerKbSparql.js";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

const PER_PAGE = 10;
const SUGGESTION_LIMIT_PER_GROUP = 8;

export default Vue.component("biomarker-network", {
    components: { FactorBaseRevealNetwork },
    props: ["phenotypesInUse", "utilsBox", "sectionConfigs"],
    data() {
        return {
            userQuery: "",
            searchNeedle: "",
            lastNeedle: "",
            searchedDiseaseLabel: "",
            selectedDiseaseIri: "",
            selectedFactor: "",
            suggestionsOpen: false,
            suggestionIndex: -1,
            diseaseList: [],
            mechanismList: [],
            diseasesByIri: {},
            factorsByName: {},
            loading: false,
            loadingMessage: "",
            error: "",
            searched: false,
            counts: null,
            rows: [],
            fetchLimit: 0,
            truncatedFetch: false,
            currentPage: 1,
            perPage: PER_PAGE,
            hiddenTypes: {},
            hiddenDiseases: {},
            associatedFactors: [],
            activeTab: "biomarkers",
            mechanismPage: 1,
            abortController: null,
        };
    },
    computed: {
        groupedSuggestions() {
            const q = (this.userQuery || "").trim().toLowerCase();
            if (q.length < 2) {
                return { diseases: [], mechanisms: [], flat: [] };
            }
            const diseases = [];
            const list = this.diseaseList || [];
            for (let i = 0; i < list.length && diseases.length < SUGGESTION_LIMIT_PER_GROUP; i++) {
                const p = list[i];
                if ((p.searchText || "").includes(q) || String(p.label || "").toLowerCase().includes(q)) {
                    diseases.push(p);
                }
            }
            const mechanisms = [];
            const mlist = this.mechanismList || [];
            for (let i = 0; i < mlist.length && mechanisms.length < SUGGESTION_LIMIT_PER_GROUP; i++) {
                const p = mlist[i];
                if ((p.searchText || "").includes(q) || String(p.label || "").toLowerCase().includes(q)) {
                    mechanisms.push(p);
                }
            }
            const flat = diseases.concat(mechanisms).map((s, i) => Object.assign({}, s, { flatIndex: i }));
            const diseaseHits = flat.filter((s) => s.kind === "disease");
            const mechanismHits = flat.filter((s) => s.kind === "mechanism");
            return { diseases: diseaseHits, mechanisms: mechanismHits, flat };
        },
        flatSuggestions() {
            return this.groupedSuggestions.flat;
        },
        uniqueTypeLabels() {
            const seen = {};
            const labels = [];
            (this.rows || []).forEach((row) => {
                const label = this.rowTypeLabel(row);
                if (!seen[label]) {
                    seen[label] = true;
                    labels.push(label);
                }
            });
            return labels.sort((a, b) => a.localeCompare(b));
        },
        uniqueBiomarkerDiseaseFilters() {
            const seen = {};
            const out = [];
            (this.rows || []).forEach((row) => {
                const iri = row && row.disease;
                if (!iri || seen[iri]) return;
                seen[iri] = true;
                out.push({ iri, label: this.rowDiseaseLabel(row) });
            });
            return out.sort((a, b) => a.label.localeCompare(b.label));
        },
        uniqueFactorDiseaseFilters() {
            const seen = {};
            const out = [];
            (this.associatedFactors || []).forEach((row) => {
                (row.diseases || []).forEach((d) => {
                    if (!d || !d.iri || seen[d.iri]) return;
                    seen[d.iri] = true;
                    out.push({ iri: d.iri, label: d.label || d.iri });
                });
            });
            return out.sort((a, b) => a.label.localeCompare(b.label));
        },
        showBiomarkerDiseaseFilters() {
            return this.uniqueBiomarkerDiseaseFilters.length > 1;
        },
        showFactorDiseaseFilters() {
            return this.uniqueFactorDiseaseFilters.length > 1;
        },
        filteredRows() {
            return (this.rows || []).filter((row) => {
                if (!this.isTypeVisible(this.rowTypeLabel(row))) return false;
                if (!this.showBiomarkerDiseaseFilters) return true;
                return !row.disease || this.isDiseaseVisible(row.disease);
            });
        },
        filteredMechanismRows() {
            const rows = this.associatedFactors || [];
            if (!this.showFactorDiseaseFilters) return rows;
            return rows.filter((row) => this.visibleDiseasesForFactor(row).length > 0);
        },
        mechanismPageRows() {
            const start = (this.mechanismPage - 1) * this.perPage;
            return this.filteredMechanismRows.slice(start, start + this.perPage);
        },
        mechanismNetwork() {
            const searchLabel = this.searchedDiseaseLabel || this.lastNeedle || "Search";
            const searchId = "search:root";
            const nodes = [{ id: searchId, label: searchLabel, type: "Entity" }];
            const edges = [];
            const diseaseSeen = {};
            const factorSeen = {};
            (this.filteredMechanismRows || []).forEach((row) => {
                const factorId = `factor:${row.factor}`;
                if (!factorSeen[factorId]) {
                    factorSeen[factorId] = true;
                    nodes.push({ id: factorId, label: row.factor, type: "Factor" });
                }
                this.visibleDiseasesForFactor(row).forEach((d) => {
                    const diseaseId = `disease:${d.iri}`;
                    if (!diseaseSeen[diseaseId]) {
                        diseaseSeen[diseaseId] = true;
                        nodes.push({
                            id: diseaseId,
                            label: d.label || d.iri,
                            type: "Phenotype",
                        });
                        edges.push({
                            source: searchId,
                            target: diseaseId,
                            predicate: "",
                        });
                    }
                    edges.push({
                        source: diseaseId,
                        target: factorId,
                        predicate: "",
                    });
                });
            });
            return { nodes, edges };
        },
        mechanismNetworkKey() {
            const net = this.mechanismNetwork;
            return [
                this.searchedDiseaseLabel || "",
                (net.nodes || []).length,
                (net.edges || []).length,
                Object.keys(this.hiddenDiseases || {}).sort().join(","),
            ].join("|");
        },
        mechanismLegendLabels() {
            return {
                Entity: "Search",
                Phenotype: "Disease",
                Factor: "Mechanism",
            };
        },
        pageRows() {
            const start = (this.currentPage - 1) * this.perPage;
            return this.filteredRows.slice(start, start + this.perPage);
        },
        showResultTabs() {
            return this.searched && (this.rows.length > 0 || this.associatedFactors.length > 0);
        },
        showSearchClear() {
            return Boolean((this.userQuery || "").trim() || this.searched);
        },
    },
    mounted() {
        try {
            const data = getBiomarkerDiseaseFactorData();
            this.diseasesByIri = data.diseases || {};
            this.factorsByName = data.factors || {};
            this.diseaseList = data.diseaseOptions || [];
            this.mechanismList = data.mechanismOptions || [];
        } catch (e) {
            this.diseasesByIri = {};
            this.factorsByName = {};
            this.diseaseList = [];
            this.mechanismList = [];
        }
        const fromUrl = keyParams.disease != null ? String(keyParams.disease).trim() : "";
        const factorFromUrl = keyParams.factor != null ? String(keyParams.factor).trim() : "";
        if (!fromUrl && !factorFromUrl) return;
        if (factorFromUrl && fromUrl) {
            const mech = (this.mechanismList || []).find((m) => m.factor === factorFromUrl);
            if (mech) {
                this.userQuery = mech.label;
                this.searchNeedle = mech.label;
                this.selectedDiseaseIri = mech.iri;
                this.selectedFactor = mech.factor;
                this.$nextTick(() => this.runSearch());
                return;
            }
        }
        if (fromUrl) {
            this.userQuery = fromUrl;
            this.searchNeedle = fromUrl;
            const iri = this.resolveDiseaseIri(fromUrl);
            if (iri) {
                const match = (this.diseaseList || []).find((d) => d.iri === iri);
                if (match) {
                    this.userQuery = match.label;
                    this.searchNeedle = match.label;
                    this.selectedDiseaseIri = iri;
                    this.selectedFactor = "";
                }
            }
            this.$nextTick(() => this.runSearch());
        }
    },
    beforeDestroy() {
        this.cancelInFlight();
    },
    methods: {
        cancelInFlight() {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
        },
        onQueryInput() {
            this.searchNeedle = (this.userQuery || "").trim();
            if (this.selectedDiseaseIri) {
                const selected =
                    (this.mechanismList || []).find(
                        (d) =>
                            d.iri === this.selectedDiseaseIri &&
                            d.label === this.searchNeedle
                    ) ||
                    (this.diseaseList || []).find(
                        (d) =>
                            d.iri === this.selectedDiseaseIri &&
                            d.label === this.searchNeedle
                    );
                if (!selected) {
                    this.selectedDiseaseIri = "";
                    this.selectedFactor = "";
                }
            }
            this.suggestionsOpen = this.searchNeedle.length >= 2;
            this.suggestionIndex = -1;
        },
        closeSuggestions() {
            this.suggestionsOpen = false;
            this.suggestionIndex = -1;
        },
        resetSearch() {
            this.cancelInFlight();
            this.closeSuggestions();
            this.userQuery = "";
            this.searchNeedle = "";
            this.lastNeedle = "";
            this.searchedDiseaseLabel = "";
            this.selectedDiseaseIri = "";
            this.selectedFactor = "";
            this.loading = false;
            this.loadingMessage = "";
            this.error = "";
            this.searched = false;
            this.counts = null;
            this.rows = [];
            this.associatedFactors = [];
            this.fetchLimit = 0;
            this.truncatedFetch = false;
            this.currentPage = 1;
            this.mechanismPage = 1;
            this.hiddenTypes = {};
            this.hiddenDiseases = {};
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
            this.selectedDiseaseIri = s.iri || "";
            this.selectedFactor = s.kind === "mechanism" ? s.factor || "" : "";
            this.userQuery = s.label || "";
            this.searchNeedle = (this.userQuery || "").trim();
            this.closeSuggestions();
            this.$nextTick(() => {
                if (this.$refs.diseaseInput) this.$refs.diseaseInput.focus();
            });
        },
        diseaseIdShort(iri) {
            const s = String(iri || "");
            const parts = s.split("/");
            return parts[parts.length - 1] || s;
        },
        resolveDiseaseIri(query) {
            const q = (query || "").trim();
            if (!q) return "";
            if (this.selectedDiseaseIri) return this.selectedDiseaseIri;
            const all = (this.diseaseList || []).concat(this.mechanismList || []);
            const exact = all.find((d) => d.label === q);
            if (exact) return exact.iri;
            const lower = q.toLowerCase();
            const ci = all.filter((d) => String(d.label || "").toLowerCase() === lower);
            if (ci.length === 1) return ci[0].iri;
            const iriHits = [];
            const map = this.diseasesByIri || {};
            Object.keys(map).forEach((iri) => {
                const d = map[iri];
                const names = [d.disease].concat(d.cfdeDiseases || []);
                if (names.some((n) => String(n).toLowerCase() === lower)) iriHits.push(iri);
            });
            return iriHits.length === 1 ? iriHits[0] : "";
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
        rowTypeLabel(row) {
            return (row && row.bestTypeLabel) || "—";
        },
        isTypeVisible(label) {
            return !this.hiddenTypes[label];
        },
        isDiseaseVisible(iri) {
            return !this.hiddenDiseases[iri];
        },
        visibleDiseasesForFactor(row) {
            const diseases = (row && row.diseases) || [];
            if (!this.showFactorDiseaseFilters) return diseases;
            return diseases.filter((d) => d && d.iri && this.isDiseaseVisible(d.iri));
        },
        clampPages() {
            const maxBio = Math.max(1, Math.ceil(this.filteredRows.length / this.perPage) || 1);
            if (this.currentPage > maxBio) this.currentPage = maxBio;
            const maxMech = Math.max(
                1,
                Math.ceil(this.filteredMechanismRows.length / this.perPage) || 1
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
        writeSearchParams(diseaseIri, factor) {
            const rec = (this.diseasesByIri && this.diseasesByIri[diseaseIri]) || {};
            const diseaseLabel = rec.disease || "";
            const nextFactor = String(factor || "");
            if (
                String(keyParams.disease || "") === diseaseLabel &&
                String(keyParams.factor || "") === nextFactor
            ) {
                return;
            }
            keyParams.set({ disease: diseaseLabel, factor: nextFactor });
        },
        factorsForDisease(diseaseIri) {
            const rec = (this.diseasesByIri && this.diseasesByIri[diseaseIri]) || {};
            return (rec.factors || []).map((factor) => ({
                factor,
                diseases: this.diseasesForFactor(factor),
            }));
        },
        diseasesForFactor(factorName) {
            const rec = (this.factorsByName && this.factorsByName[factorName]) || {};
            const seen = {};
            const out = [];
            (rec.diseases || []).forEach((link) => {
                const iri = link && link.iri;
                if (!iri || seen[iri]) return;
                seen[iri] = true;
                out.push({
                    iri,
                    label: link.disease || link.cfdeDisease || iri,
                });
            });
            return out.sort((a, b) => a.label.localeCompare(b.label));
        },
        searchDisease(d) {
            if (!d || !d.iri) return;
            this.selectedDiseaseIri = d.iri;
            this.selectedFactor = "";
            this.userQuery = d.label || "";
            this.searchNeedle = this.userQuery;
            this.activeTab = "biomarkers";
            this.closeSuggestions();
            this.runSearch();
        },
        geneHref(row) {
            if (row.ncbiId) {
                return `https://www.ncbi.nlm.nih.gov/gene/${encodeURIComponent(row.ncbiId)}`;
            }
            return `/gene.html?gene=${encodeURIComponent(row.geneSymbol)}`;
        },
        rowDiseaseLabel(row) {
            if (!row) return "—";
            if (row.diseaseLabel) return row.diseaseLabel;
            const rec = row.disease && this.diseasesByIri && this.diseasesByIri[row.disease];
            return (rec && rec.disease) || row.disease || "—";
        },
        searchIrisForQuery(diseaseIri, factor) {
            if (factor) {
                const linked = this.diseasesForFactor(factor);
                const iris = [];
                const seen = {};
                linked.forEach((d) => {
                    if (!d.iri || seen[d.iri]) return;
                    seen[d.iri] = true;
                    iris.push(d.iri);
                });
                if (iris.length) return iris;
            }
            return diseaseIri ? [diseaseIri] : [];
        },
        associatedFactorsForIris(iris) {
            const seen = {};
            const out = [];
            (iris || []).forEach((iri) => {
                this.factorsForDisease(iri).forEach((row) => {
                    if (seen[row.factor]) return;
                    seen[row.factor] = true;
                    out.push(row);
                });
            });
            return out.sort((a, b) => a.factor.localeCompare(b.factor));
        },
        decorateBiomarkerRows(rows) {
            return (rows || []).map((row) => {
                if (row.diseaseLabel) return row;
                const rec = row.disease && this.diseasesByIri && this.diseasesByIri[row.disease];
                return Object.assign({}, row, {
                    diseaseLabel: (rec && rec.disease) || row.diseaseLabel || "",
                });
            });
        },
        async runSearch() {
            const needle = (this.userQuery || "").trim();
            if (!needle || this.loading) return;

            const diseaseIri = this.resolveDiseaseIri(needle);
            if (!diseaseIri) {
                this.error = "Pick a disease or mechanism from the list.";
                this.searched = false;
                this.counts = null;
                this.rows = [];
                this.associatedFactors = [];
                this.searchedDiseaseLabel = "";
                return;
            }

            const mechMatch = (this.mechanismList || []).find(
                (m) => m.label === needle && m.iri === diseaseIri
            );
            if (mechMatch) this.selectedFactor = mechMatch.factor;
            else if (!this.selectedFactor) this.selectedFactor = "";

            this.writeSearchParams(diseaseIri, this.selectedFactor);
            this.selectedDiseaseIri = diseaseIri;
            const rec = (this.diseasesByIri && this.diseasesByIri[diseaseIri]) || {};
            this.searchedDiseaseLabel = this.selectedFactor || rec.disease || needle;
            const searchIris = this.searchIrisForQuery(diseaseIri, this.selectedFactor);

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
            this.truncatedFetch = false;
            this.fetchLimit = 0;
            this.currentPage = 1;
            this.mechanismPage = 1;
            this.hiddenTypes = {};
            this.hiddenDiseases = {};
            this.activeTab = "biomarkers";
            this.associatedFactors = this.associatedFactorsForIris(searchIris);

            try {
                this.loadingMessage = "Counting biomarkers…";
                const counts = await countBiomarkersForDisease(searchIris, { signal: ac.signal });
                if (ac.signal.aborted) return;
                this.counts = counts;

                const rowCount = counts.rowCount || counts.biomarkerCount;
                if (!rowCount) {
                    this.loading = false;
                    this.loadingMessage = "";
                    return;
                }

                const limit = rowCount + 1;
                this.fetchLimit = limit;
                this.loadingMessage = `Fetching ${counts.biomarkerCount} biomarkers…`;
                const rows = await listBiomarkersForDisease(searchIris, {
                    limit,
                    signal: ac.signal,
                });
                if (ac.signal.aborted) return;

                this.truncatedFetch = rows.length > rowCount;
                this.rows = this.decorateBiomarkerRows(rows.slice(0, rowCount));
            } catch (e) {
                if (e && e.name === "AbortError") return;
                this.error = (e && e.message) || "Search failed.";
                this.counts = null;
                this.rows = [];
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
