<template>
    <div class="reveal-kg-workspace biomarker-network">
        <header class="rkw-header">
            <div class="rkw-brand">
                <span class="rkw-mark">REVEAL</span>
                <span class="rkw-title">Biomarker</span>
            </div>
        </header>

        <div class="bn-body">
            <div class="bn-search-panel">
                <label class="bn-label" for="bn-disease-input">Disease</label>
                <div class="bn-search-row">
                    <div class="bn-input-wrap">
                        <input
                            id="bn-disease-input"
                            ref="diseaseInput"
                            type="text"
                            class="form-control"
                            v-model="userQuery"
                            placeholder="Search a disease (e.g. Crohn disease, systemic lupus erythematosus)"
                            autocomplete="off"
                            @input="onQueryInput"
                            @keydown.down.prevent="moveSuggestion(1)"
                            @keydown.up.prevent="moveSuggestion(-1)"
                            @keydown.enter.prevent="onEnter"
                            @keydown.esc="closeSuggestions"
                        />
                        <ul
                            v-if="suggestionsOpen && phenotypeSuggestions.length"
                            class="bn-suggestions"
                            role="listbox"
                        >
                            <li
                                v-for="(s, i) in phenotypeSuggestions"
                                :key="s.id"
                                class="bn-suggestion"
                                :class="{ 'bn-suggestion--active': i === suggestionIndex }"
                                role="option"
                                @mousedown.prevent="selectSuggestion(s)"
                            >
                                <span class="bn-suggestion-label">{{ s.label }}</span>
                                <span class="bn-suggestion-id">{{ s.id }}</span>
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
                <p class="bn-hint">
                    Counts BiomarkerKB markers for the disease first, then loads the list
                    (limit = biomarker count + 1).
                </p>
            </div>

            <div v-if="loading" class="bn-status bn-status--loading" role="status">
                <span class="bn-spinner" aria-hidden="true" />
                {{ loadingMessage }}
            </div>
            <div v-else-if="error" class="alert alert-danger py-2 mb-3">{{ error }}</div>
            <div
                v-else-if="searched && !rows.length"
                class="alert alert-warning py-2 mb-3"
            >
                No biomarkers found for “{{ lastNeedle }}”.
            </div>

            <div v-if="counts && !loading" class="bn-counts">
                <span
                    ><strong>{{ counts.biomarkerCount }}</strong> biomarkers</span
                >
                <span class="bn-counts-sep">·</span>
                <span
                    ><strong>{{ counts.geneCount }}</strong> unique genes</span
                >
                <span v-if="truncatedFetch" class="bn-counts-sep">·</span>
                <span v-if="truncatedFetch" class="text-muted"
                    >list truncated at limit {{ fetchLimit }}</span
                >
            </div>

            <div v-if="pageRows.length" class="bn-table-wrap">
                <table class="table table-sm table-hover bn-table">
                    <thead>
                        <tr>
                            <th scope="col">Gene</th>
                            <th scope="col">dbSNP</th>
                            <th scope="col">Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, idx) in pageRows" :key="row.biomarker + '-' + idx">
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
                                    v-if="row.rsId && row.biomarker"
                                    :href="row.biomarker"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >{{ row.rsId }}</a>
                                <span v-else-if="row.rsId">{{ row.rsId }}</span>
                                <span v-else class="text-muted">—</span>
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
                        </tr>
                    </tbody>
                </table>

                <b-pagination
                    v-if="rows.length > perPage"
                    class="pagination-sm justify-content-center mt-2"
                    v-model="currentPage"
                    :total-rows="rows.length"
                    :per-page="perPage"
                    size="sm"
                />
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue } from "bootstrap-vue";
import { getCfdePhenotypesInList } from "@/utils/cfdeUtils";
import {
    countBiomarkersForDisease,
    listBiomarkersForDisease,
} from "./biomarkerNetwork/biomarkerKbSparql.js";

Vue.use(BootstrapVue);

const PER_PAGE = 10;
const SUGGESTION_LIMIT = 12;

export default Vue.component("biomarker-network", {
    props: ["phenotypesInUse", "utilsBox", "sectionConfigs"],
    data() {
        return {
            userQuery: "",
            searchNeedle: "",
            lastNeedle: "",
            suggestionsOpen: false,
            suggestionIndex: -1,
            phenotypeList: [],
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
            abortController: null,
        };
    },
    computed: {
        phenotypeSuggestions() {
            const q = (this.userQuery || "").trim().toLowerCase();
            if (q.length < 2) return [];
            const list = this.phenotypeList || [];
            const hits = [];
            for (let i = 0; i < list.length && hits.length < SUGGESTION_LIMIT; i++) {
                const p = list[i];
                const label = String(p.label || "").toLowerCase();
                const id = String(p.id || "").toLowerCase();
                if (label.includes(q) || id.includes(q)) hits.push(p);
            }
            return hits;
        },
        pageRows() {
            const start = (this.currentPage - 1) * this.perPage;
            return this.rows.slice(start, start + this.perPage);
        },
    },
    mounted() {
        try {
            this.phenotypeList = getCfdePhenotypesInList() || [];
        } catch (e) {
            this.phenotypeList = [];
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
            this.suggestionsOpen = this.searchNeedle.length >= 2;
            this.suggestionIndex = -1;
        },
        closeSuggestions() {
            this.suggestionsOpen = false;
            this.suggestionIndex = -1;
        },
        moveSuggestion(delta) {
            if (!this.suggestionsOpen || !this.phenotypeSuggestions.length) return;
            const n = this.phenotypeSuggestions.length;
            this.suggestionIndex = (this.suggestionIndex + delta + n) % n;
        },
        selectSuggestion(s) {
            this.userQuery = s.label || s.id || "";
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
                this.phenotypeSuggestions[this.suggestionIndex]
            ) {
                this.selectSuggestion(this.phenotypeSuggestions[this.suggestionIndex]);
                return;
            }
            this.runSearch();
        },
        geneHref(row) {
            if (row.ncbiId) {
                return `https://www.ncbi.nlm.nih.gov/gene/${encodeURIComponent(row.ncbiId)}`;
            }
            return `/gene.html?gene=${encodeURIComponent(row.geneSymbol)}`;
        },
        async runSearch() {
            const needle = (this.userQuery || "").trim();
            if (!needle || this.loading) return;

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

            try {
                this.loadingMessage = "Counting biomarkers…";
                const counts = await countBiomarkersForDisease(needle, { signal: ac.signal });
                if (ac.signal.aborted) return;
                this.counts = counts;

                if (!counts.biomarkerCount) {
                    this.loading = false;
                    this.loadingMessage = "";
                    return;
                }

                const limit = counts.biomarkerCount + 1;
                this.fetchLimit = limit;
                this.loadingMessage = `Fetching ${counts.biomarkerCount} biomarkers…`;
                const rows = await listBiomarkersForDisease(needle, {
                    limit,
                    signal: ac.signal,
                });
                if (ac.signal.aborted) return;

                this.truncatedFetch = rows.length > counts.biomarkerCount;
                this.rows = rows.slice(0, counts.biomarkerCount);
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

.bn-search-btn {
    min-width: 110px;
    white-space: nowrap;
}

.bn-hint {
    margin: 8px 0 0;
    font-size: 0.85rem;
    color: var(--cfde-muted);
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
    max-height: 260px;
    overflow: auto;
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
    margin: 12px 0 14px;
    font-size: 0.95rem;
}

.bn-counts-sep {
    margin: 0 8px;
    color: var(--cfde-muted);
}

.bn-table-wrap {
    margin-top: 4px;
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
