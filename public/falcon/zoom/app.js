// Reads window.parent.falconGlobalState safely. When this page is embedded
// under a genuinely cross-origin parent (e.g. this same-origin-only feature
// embedded in an external site), merely *accessing* an arbitrary property
// like .falconGlobalState on a cross-origin Window throws a SecurityError —
// `window.parent && window.parent.falconGlobalState` does NOT guard against
// this, since the property read itself is what throws, truthy-check or not.
// Found via a real cross-origin embed test: an uncaught SecurityError here
// (originally inline at the very start of UI.init(), before any page-specific
// setup ran) was silently blanking every page's content, not just this one
// feature — same-origin embeds (this app's own shell) never hit this at all.
function getParentFalconGlobalState() {
    try {
        return (window.parent && window.parent !== window) ? window.parent.falconGlobalState : null;
    } catch (err) {
        return null;
    }
}

// Theme-resolved chart colors. Plotly can't read CSS custom properties, so
// trace/annotation/legend colors have to be resolved in JS at render time —
// called per render (not cached) so a dark-mode toggle repaints correctly.
const FPC = () => (window.FalconPlotTheme ? FalconPlotTheme.colors() : {
    ink: '#111827', ink2: '#374151', line: '#d1d5db',
    mutedFill: '#e5e7eb', panelBg: 'rgba(255,255,255,0.8)', zeroFill: '#ffffff'
});

// Evidence-class hex, theme-aware. Hex rather than var() because callers feed
// Plotly and build `${c}22` alpha suffixes — neither resolves a CSS variable.
const FEC = () => (window.FalconPlotTheme ? FalconPlotTheme.evidenceColors() : {
    Clinical: '#e08a12', Effector: '#0f9d6b', Novel: '#6d4bd8',
    Repurposable: '#f15b51', Associated: '#2a4269'
});

// ==========================================
// 1. DATA STORE (Central State Management)
// ==========================================
const DataStore = {
    globalFilterActive: true,
    globalMinProb: 0.1,
    globalMinNegP: 1,
    currentTrait: null,
    datasets: {
        genes: { data: [], columns: [], isLoaded: false },
        variants: { data: [], columns: [], isLoaded: false },
        v2g: { data: [], isLoaded: false },
        clinicalTrials: { data: {}, isLoaded: false }
    },
    tableStates: {
        genes: { filteredData: [], currentPage: 1, sortCol: null, sortAsc: true, searchQuery: '' },
        variants: { filteredData: [], currentPage: 1, sortCol: null, sortAsc: true, searchQuery: '' }
    },
    plotFilters: {
        genes: { chr: 'All', minStart: null, maxEnd: null }
    }
};

// Navigate to another shell tab (same-origin iframe → parent). Falls back to a
// direct hash navigation when the page is opened standalone.
function navigateToApp(route, params) {
    try {
        if (window.parent && window.parent !== window && window.parent.FalconShell) {
            window.parent.FalconShell.navigate(route, params);
            return;
        }
    } catch (e) { /* cross-origin — fall through */ }
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    window.location.href = 'index.html#' + route + qs;
}

// ==========================================
// 2. CONFIGURATION
// ==========================================
const AppConfig = {
    tabs: [
        { id: 'tab-summary', label: 'Executive Summary', targetView: 'view-summary', dataset: 'both', requires: 'genes' },
        { id: 'tab-zoom', label: 'FALCON zoom', targetView: 'view-zoom-plot', dataset: 'zoom', requires: null },
        { id: 'tab-genes-plot', label: 'Genes Plot', targetView: 'view-genes-plot', dataset: 'genes', requires: 'genes', containerId: 'genes-scatter-plot-container' },
        { id: 'tab-variants-plot', label: 'Variants Plot', targetView: 'view-variants-plot', dataset: 'variants', requires: 'variants', containerId: 'variants-scatter-plot-container' },
        { id: 'tab-genes-table', label: 'Genes (Table)', targetView: 'view-table', dataset: 'genes', requires: 'genes' },
        { id: 'tab-variants-table', label: 'Variants (Table)', targetView: 'view-table', dataset: 'variants', requires: 'variants' }
    ],
    rowsPerPage: 15
};

// ==========================================
// 2.5 COLOR MANAGER
// ==========================================
const ColorManager = {
    clumpColorMap: new Map(),
    palette: [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
        '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
        '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'
    ],

    getColor(clumpId) {
        if (clumpId === "Unassigned (No Clump)") return '#d1d5db';
        if (!this.clumpColorMap.has(clumpId)) {
            const nextColorIndex = this.clumpColorMap.size % this.palette.length;
            this.clumpColorMap.set(clumpId, this.palette[nextColorIndex]);
        }
        return this.clumpColorMap.get(clumpId);
    }
};

// Wire a trait <input>+<suggestions-list> pair to search-as-you-type against
// FalconTraitIndex (description + code), showing the description as the
// primary label and the code as a small secondary one. On selection, the
// input displays the description while onSelectCode receives the trait CODE
// (what every BioIndex query must use). Shared by BioIndexLoader's
// #phenotype-search (falcon_zoom.html) and SummaryModule's
// #summary-trait-input (traits.html) — identical wiring, different targets.
function wireTraitAutocomplete(inputEl, listEl, onSelectCode) {
    if (!inputEl || !listEl) return;
    inputEl.addEventListener('input', () => {
        const q = inputEl.value.trim();
        if (q.length < 1 || !window.FalconTraitIndex) { listEl.style.display = 'none'; return; }
        const matches = FalconTraitIndex.search(q, 10);
        if (!matches.length) { listEl.style.display = 'none'; return; }
        listEl.innerHTML = matches.map(r =>
            `<div class="suggestion-item" data-code="${r.idName}" style="padding:8px 12px;cursor:pointer;">${r.description || r.idName} <small style="color:var(--ink-3);margin-left:6px;">${r.idName}</small></div>`
        ).join('');
        listEl.querySelectorAll('[data-code]').forEach(el => {
            el.onmouseover = () => el.style.backgroundColor = 'var(--surface-header)';
            el.onmouseout = () => el.style.backgroundColor = '';
            el.onclick = () => {
                const code = el.dataset.code;
                inputEl.value = FalconTraitIndex.describeCode(code);
                listEl.style.display = 'none';
                onSelectCode(code);
            };
        });
        listEl.style.display = 'block';
    });
    document.addEventListener('click', (e) => {
        if (e.target !== inputEl && !listEl.contains(e.target)) listEl.style.display = 'none';
    });
}

// ==========================================
// 3. BIOINDEX LOADER MODULE
// ==========================================
// VENDORED COPY — diverges from upstream falcon-web here on purpose.
// Upstream resolves this same-origin on HTTPS ("" + "/falcon/api/bio") because
// the FALCON site's own CloudFront proxies through to the HTTP-only BioIndex
// backend. This copy is served from the portal's origin instead, where that
// path doesn't exist, so it has to name the proxy host absolutely. HTTPS (no
// mixed-content block) and the backend returns `access-control-allow-origin: *`,
// so the cross-origin calls are fine. The model outputs themselves are only
// served by FALCON's backend — that API dependency is unavoidable; everything
// else in this folder is self-contained.
const FALCON_API_ORIGIN = "https://d26k96aakgfksz.cloudfront.net";
const FALCON_ENGINE = localStorage.getItem('falconEngine') === 'rs' ? 'falcon-rs' : 'falcon';
const BIOINDEX = FALCON_API_ORIGIN + "/" + FALCON_ENGINE + "/api/bio";
const BioIndexLoader = {
    baseUrl: `${BIOINDEX}/query/`,
    contUrl: `${BIOINDEX}/cont`,
    matchUrl: `${BIOINDEX}/match/gene-file-trait-sorted?q=`,
    geneMatchUrl: "https://bioindex.hugeamp.org/api/bio/match/gene?q=",

    init() {
        const searchInput = document.getElementById('phenotype-search');
        const autocompleteList = document.getElementById('autocomplete-list');

        if (searchInput) {
            wireTraitAutocomplete(searchInput, autocompleteList, (code) => this.loadPhenotypeData(code));
        }

        const geneInput = document.getElementById('zoom-gene');
        const geneList = document.getElementById('gene-autocomplete-list');
        if (geneInput && geneList) {
            geneInput.addEventListener('input', async (e) => {
                const val = e.target.value.trim();
                if (val.length < 2) {
                    geneList.style.display = 'none';
                    return;
                }

                try {
                    const response = await fetch(`${this.geneMatchUrl}${encodeURIComponent(val)}`);
                    const result = await response.json();
                    const rawMatches = result.data || result;
                    const matches = Array.isArray(rawMatches) ? rawMatches : [];
                    geneList.innerHTML = '';

                    matches.slice(0, 50).forEach(match => {
                        const label = typeof match === 'string' ? match : (match.gene || match.name || match.symbol || match);
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        div.style.padding = '8px 12px';
                        div.style.cursor = 'pointer';
                        div.textContent = label;
                        div.onmouseover = () => div.style.backgroundColor = 'var(--surface-header)';
                        div.onmouseout = () => div.style.backgroundColor = '';
                        div.onclick = () => {
                            geneInput.value = label;
                            geneList.style.display = 'none';
                        };
                        geneList.appendChild(div);
                    });
                    geneList.style.display = geneList.children.length > 0 ? 'block' : 'none';
                } catch (err) {
                    console.error('Gene autocomplete error:', err);
                    geneList.style.display = 'none';
                }
            });

            document.addEventListener('click', (e) => {
                if (e.target !== geneInput) {
                    geneList.style.display = 'none';
                }
            });
        }
    },

    async bioIndexFetch(endpoint, query) {
        // --- Dual-Track Routing ---
        const globalState = window.falconGlobalState || getParentFalconGlobalState();
        const traitName = (typeof DataStore !== 'undefined') ? DataStore.currentTrait : null;
        const queryTrait = query && typeof query === 'string' ? query.split(',')[0] : null;

        if (traitName && traitName.startsWith('local-') && globalState) {
            if (endpoint === 'gene-file-gene-sorted') {
                const geneName = query.toUpperCase();
                return (globalState.genes || []).filter(g => (g.GENE || '').toUpperCase() === geneName);
            }
            if (endpoint === 'v2g-file-gene-sorted') {
                const geneName = query.toUpperCase();
                return (globalState.v2g || []).filter(v => (v.Gene || v.GENE || '').toUpperCase() === geneName);
            }
            if (endpoint === 'gene-file-trait-sorted') {
                return globalState.genes || [];
            }
        }

        if (queryTrait && queryTrait.startsWith('local-') && globalState && globalState.traitName === queryTrait) {
            if (endpoint.includes('region-sorted')) {
                const parts = query.split(',');
                const regionStr = parts[1];
                const regMatch = regionStr ? regionStr.match(/(?:chr)?(\w+):(\d+)-(\d+)/i) : null;
                if (!regMatch) return [];

                const chr = regMatch[1];
                const start = parseInt(regMatch[2], 10);
                const end = parseInt(regMatch[3], 10);

                const inRegion = (row, sCol, eCol) => {
                    const rowChr = (row.CHR || '').toString().replace(/^chr/i, '');
                    const rowStart = parseInt(row[sCol], 10);
                    const rowEnd = parseInt(row[eCol] || row[sCol], 10);
                    return rowChr === chr && rowEnd >= start && rowStart <= end;
                };

                if (endpoint.includes('gene')) return (globalState.genes || []).filter(r => inRegion(r, 'START', 'END'));
                if (endpoint.includes('variant')) return (globalState.variants || []).filter(r => inRegion(r, 'POS', 'POS'));
                if (endpoint.includes('v2g')) return (globalState.v2g || []).filter(r => inRegion(r, 'POS', 'POS'));
            }

            if (endpoint.includes('gene')) return globalState.genes || [];
            if (endpoint.includes('variant')) return globalState.variants || [];
            if (endpoint.includes('v2g')) return globalState.v2g || [];
            return [];
        }
        // --- End Dual-Track ---

        let allData = [];
        let continuation = null;

        do {
            const url = new URL(`${this.baseUrl}${endpoint}`, location.origin);
            url.searchParams.set('q', query);
            if (continuation) {
                url.searchParams.set('continuation', continuation);
            }

            const response = await fetch(url);
            const result = await response.json();

            if (result.data) {
                allData = allData.concat(result.data);
            }
            continuation = result.continuation;
        } while (continuation);

        return allData;
    },

    async loadPhenotypeData(phenotype) {
        UI.setStatus(`Phenotype selected: ${phenotype}. Ready for FALCON zoom.`);
        document.getElementById('folder-name-text').textContent = phenotype;
        DataStore.currentTrait = phenotype;

        // We skip fetching all data for now to improve performance.
        // Mark genes as 'loaded' with empty data so the zoom tab becomes available.
        DataStore.datasets.genes.isLoaded = true;
        DataStore.datasets.genes.data = [];

        UI.buildTabs();

        const summaryTab = AppConfig.tabs.find(t => t.id === 'tab-summary');
        const zoomTab = AppConfig.tabs.find(t => t.id === 'tab-zoom');
        if (summaryTab) UI.activateTab(summaryTab);
        else if (zoomTab) UI.activateTab(zoomTab);
    }
};

const FileLoader = {
    ldFiles: [],
    init() { },
    parseFile(file, datasetName, callback) {
        DataStore.datasets[datasetName].data = [];
        DataStore.datasets[datasetName].columns = [];
        Papa.parse(file, {
            header: true, skipEmptyLines: true, delimiter: "\t",
            chunk: (results) => {
                DataStore.datasets[datasetName].data.push(...results.data);
                if (DataStore.datasets[datasetName].columns.length === 0 && results.meta.fields) {
                    DataStore.datasets[datasetName].columns = results.meta.fields;
                }
            },
            complete: () => {
                DataStore.datasets[datasetName].isLoaded = true;
                if (DataStore.tableStates[datasetName]) DataStore.tableStates[datasetName].filteredData = [...DataStore.datasets[datasetName].data];
                callback();
            },
            error: (err) => { console.error(`Error parsing ${datasetName}:`, err); callback(); }
        });
    }
};

const TableModule = {
    currentDataset: null,

    init() {
        this.searchInput = document.getElementById('search-input');

        this.thead = document.getElementById('table-head');
        this.tbody = document.getElementById('table-body');
        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
        this.pageInfo = document.getElementById('page-info');

        this.searchInput.addEventListener('input', (e) => this.updateFilterState('searchQuery', e.target.value.toLowerCase()));
        this.btnPrev.addEventListener('click', () => this.changePage(-1));
        this.btnNext.addEventListener('click', () => this.changePage(1));
    },

    loadDataset(datasetName) {
        this.currentDataset = datasetName;
        const state = DataStore.tableStates[datasetName];

        this.searchInput.value = state.searchQuery || '';
        this.applyFiltersAndSort();
    },

    updateFilterState(key, value) {
        DataStore.tableStates[this.currentDataset][key] = value;
        DataStore.tableStates[this.currentDataset].currentPage = 1;
        this.applyFiltersAndSort();
    },

    handleSort(col) {
        const state = DataStore.tableStates[this.currentDataset];
        if (state.sortCol === col) { state.sortAsc = !state.sortAsc; }
        else { state.sortCol = col; state.sortAsc = true; }

        UI.setStatus(`Sorting by ${col}...`);
        setTimeout(() => {
            this.applyFiltersAndSort();
            UI.setStatus(``);
        }, 10);
    },

    applyFiltersAndSort() {
        const state = DataStore.tableStates[this.currentDataset];
        const rawData = DataStore.datasets[this.currentDataset].data;

        const sq = state.searchQuery;

        state.filteredData = rawData.filter(row => {
            // Local Search Filter
            if (sq && !Object.values(row).some(val => val != null && val.toString().toLowerCase().includes(sq))) return false;

            // Global Filters
            if (DataStore.globalFilterActive) {
                const isVariants = this.currentDataset === 'variants';
                const prob = parseFloat(row['PROBABILITY']);
                let negP;

                if (isVariants) {
                    let pVal = parseFloat(row['P_VALUE']);
                    if (isNaN(pVal)) negP = NaN;
                    else if (pVal === 0) negP = Number.MIN_VALUE;
                    else negP = -Math.log10(pVal);
                } else {
                    negP = parseFloat(row['NEG_LOG_P']);
                }

                if (isNaN(prob) || prob < DataStore.globalMinProb || isNaN(negP) || negP < DataStore.globalMinNegP) {
                    return false;
                }
            }

            return true;
        });

        if (state.sortCol) {
            const col = state.sortCol;
            state.filteredData.sort((a, b) => {
                let valA = a[col] != null ? a[col].toString().toLowerCase() : '';
                let valB = b[col] != null ? b[col].toString().toLowerCase() : '';

                if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
                    return state.sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
                }
                if (valA < valB) return state.sortAsc ? -1 : 1;
                if (valA > valB) return state.sortAsc ? 1 : -1;
                return 0;
            });
        }

        this.renderHeaders();
        this.renderBody();
    },

    changePage(direction) {
        const state = DataStore.tableStates[this.currentDataset];
        state.currentPage += direction;
        this.renderBody();
    },

    renderHeaders() {
        this.thead.innerHTML = '';
        const state = DataStore.tableStates[this.currentDataset];
        const columns = DataStore.datasets[this.currentDataset].columns;
        const tr = document.createElement('tr');

        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col + (state.sortCol === col ? (state.sortAsc ? ' ↑' : ' ↓') : '');
            th.addEventListener('click', () => this.handleSort(col));
            tr.appendChild(th);
        });
        this.thead.appendChild(tr);
    },

    renderBody() {
        this.tbody.innerHTML = '';
        const state = DataStore.tableStates[this.currentDataset];
        const columns = DataStore.datasets[this.currentDataset].columns;

        const totalPages = Math.ceil(state.filteredData.length / AppConfig.rowsPerPage) || 1;
        if (state.currentPage > totalPages) state.currentPage = totalPages;
        if (state.currentPage < 1) state.currentPage = 1;

        const start = (state.currentPage - 1) * AppConfig.rowsPerPage;
        const pageData = state.filteredData.slice(start, start + AppConfig.rowsPerPage);

        pageData.forEach(row => {
            const tr = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = row[col] || '';
                tr.appendChild(td);
            });
            this.tbody.appendChild(tr);
        });

        this.pageInfo.textContent = `Page ${state.currentPage.toLocaleString()} of ${totalPages.toLocaleString()} (${state.filteredData.length.toLocaleString()} records)`;
        this.btnPrev.disabled = state.currentPage === 1;
        this.btnNext.disabled = state.currentPage === totalPages;
    }
};

// ==========================================
// 5. GENOMIC FILTER MODULE
// ==========================================
const GeneFilterModule = {
    chrBounds: new Map(),

    init() {
        this.grid = document.getElementById('chr-grid');
        this.regionSelector = document.getElementById('region-selector');
        this.resetBtn = document.getElementById('reset-gene-filter-btn');

        this.sliderMin = document.getElementById('slider-input-min');
        this.sliderMax = document.getElementById('slider-input-max');
        this.sliderRange = document.getElementById('slider-range');

        this.numMin = document.getElementById('region-num-min');
        this.numMax = document.getElementById('region-num-max');
        this.applyBtn = document.getElementById('apply-region-btn');

        if (this.sliderMin) this.sliderMin.addEventListener('input', () => this.syncSliders('min'));
        if (this.sliderMax) this.sliderMax.addEventListener('input', () => this.syncSliders('max'));

        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetFilter());
        if (this.applyBtn) this.applyBtn.addEventListener('click', () => {
            const f = DataStore.plotFilters.genes;
            f.minStart = parseInt(this.numMin.value);
            f.maxEnd = parseInt(this.numMax.value);
            PlotModule.renderScatterPlot('genes', 'genes-scatter-plot-container');
        });
    },

    populate() {
        if (!DataStore.datasets.genes.isLoaded || !this.grid) return;

        const data = DataStore.datasets.genes.data;
        this.chrBounds.clear();

        data.forEach(row => {
            const chr = row['CHR'] ? row['CHR'].toString().trim() : '';
            if (!chr) return;

            const start = parseInt(row['START']);
            const end = parseInt(row['END']);

            if (!this.chrBounds.has(chr)) {
                this.chrBounds.set(chr, { min: Infinity, max: -Infinity });
            }

            const bounds = this.chrBounds.get(chr);
            if (!isNaN(start) && start < bounds.min) bounds.min = start;
            if (!isNaN(end) && end > bounds.max) bounds.max = end;
        });

        const sortedChrs = Array.from(this.chrBounds.keys()).sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });

        this.grid.innerHTML = '';
        sortedChrs.forEach(chr => {
            const btn = document.createElement('button');
            btn.className = 'chr-btn';
            btn.textContent = `Chr ${chr}`;
            btn.addEventListener('click', () => this.selectChromosome(chr, btn));
            this.grid.appendChild(btn);
        });
    },

    selectChromosome(chr, btnElement) {
        document.querySelectorAll('.chr-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        this.regionSelector.style.display = 'block';
        this.resetBtn.style.display = 'block';

        const bounds = this.chrBounds.get(chr);
        const minBP = bounds.min === Infinity ? 0 : bounds.min;
        const maxBP = bounds.max === -Infinity ? 1000 : bounds.max;

        this.sliderMin.min = minBP; this.sliderMin.max = maxBP; this.sliderMin.value = minBP;
        this.sliderMax.min = minBP; this.sliderMax.max = maxBP; this.sliderMax.value = maxBP;

        this.numMin.value = minBP;
        this.numMax.value = maxBP;

        this.updateSliderTrack();

        const f = DataStore.plotFilters.genes;
        f.chr = chr;
        f.minStart = minBP;
        f.maxEnd = maxBP;
        PlotModule.renderScatterPlot('genes', 'genes-scatter-plot-container');
    },

    resetFilter() {
        document.querySelectorAll('.chr-btn').forEach(b => b.classList.remove('active'));
        this.regionSelector.style.display = 'none';
        this.resetBtn.style.display = 'none';

        DataStore.plotFilters.genes = { chr: 'All', minStart: null, maxEnd: null };
        PlotModule.renderScatterPlot('genes', 'genes-scatter-plot-container');
    },

    syncSliders(source) {
        let minVal = parseInt(this.sliderMin.value);
        let maxVal = parseInt(this.sliderMax.value);

        if (source === 'min' && minVal >= maxVal) {
            this.sliderMin.value = maxVal - 1;
            minVal = maxVal - 1;
        }
        if (source === 'max' && maxVal <= minVal) {
            this.sliderMax.value = minVal + 1;
            maxVal = minVal + 1;
        }

        this.numMin.value = minVal;
        this.numMax.value = maxVal;
        this.updateSliderTrack();
    },

    updateSliderTrack() {
        const min = parseInt(this.sliderMin.min);
        const max = parseInt(this.sliderMin.max);
        const val1 = parseInt(this.sliderMin.value);
        const val2 = parseInt(this.sliderMax.value);

        const percent1 = ((val1 - min) / (max - min)) * 100;
        const percent2 = ((val2 - min) / (max - min)) * 100;

        this.sliderRange.style.left = `${percent1}%`;
        this.sliderRange.style.width = `${percent2 - percent1}%`;
    }
};

// ==========================================
// 6. GLOBAL PLOT MODULE
// ==========================================
const PlotModule = {
    renderScatterPlot(datasetName, containerId) {
        const data = DataStore.datasets[datasetName].data;
        const container = document.getElementById(containerId);

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="padding: 20px;">No data loaded yet.</p>';
            return;
        }

        UI.setStatus(`Generating ${datasetName} plot...`);
        container.innerHTML = 'Loading plot...';

        setTimeout(() => {
            const isVariants = datasetName === 'variants';
            const keyProb = 'PROBABILITY';
            const keyNegP = isVariants ? 'P_VALUE' : 'NEG_LOG_P';
            const keyName = isVariants ? 'VARIANT' : 'GENE';
            const keyClump = 'CLUMP';
            const keyLead = isVariants ? 'LEAD_SNP' : 'NEAREST_TO_LEAD';
            const geneFilters = DataStore.plotFilters.genes;

            const getNegP = (row) => {
                if (!isVariants) return parseFloat(row[keyNegP]);
                let pVal = parseFloat(row[keyNegP]);
                if (isNaN(pVal)) return NaN;
                if (pVal === 0) pVal = Number.MIN_VALUE;
                return -Math.log10(pVal);
            };

            const topPerClump = new Map();

            // ---------------------------------------------------------
            // LOOP 1: Calculate Top Per Clump (Strict Criteria: AND logic)
            // ---------------------------------------------------------
            data.forEach((row, index) => {
                const prob = parseFloat(row[keyProb]);
                const negP = getNegP(row);

                // STRICT TOP CRITERIA: Keep ONLY if Prob >= 0.05 AND NegP >= 1
                if (isNaN(prob) || prob < 0.05 || isNaN(negP) || negP < 1) return;

                if (!isVariants && geneFilters.chr !== 'All') {
                    const rowChr = row['CHR'] ? row['CHR'].toString().trim() : '';
                    if (rowChr !== geneFilters.chr) return;

                    const rowStart = parseFloat(row['START']);
                    const rowEnd = parseFloat(row['END']);
                    if (!isNaN(rowStart) && rowStart > geneFilters.maxEnd) return;
                    if (!isNaN(rowEnd) && rowEnd < geneFilters.minStart) return;
                }

                let clumpId = row[keyClump] ? row[keyClump].toString().trim() : '';
                if (clumpId === '') clumpId = "Unassigned (No Clump)";

                if (!topPerClump.has(clumpId) || prob > topPerClump.get(clumpId).prob) {
                    topPerClump.set(clumpId, { index: index, prob: prob });
                }
            });

            const groups = new Map();
            const topTraceData = { x: [], y: [], text: [] };

            // ---------------------------------------------------------
            // LOOP 2: Render Traces (Uses Global Display Filters)
            // ---------------------------------------------------------
            data.forEach((row, index) => {
                const prob = parseFloat(row[keyProb]);
                const negP = getNegP(row);

                // Display logic remains governed entirely by the global filters
                if (DataStore.globalFilterActive) {
                    if (isNaN(prob) || prob < DataStore.globalMinProb || isNaN(negP) || negP < DataStore.globalMinNegP) return;
                }

                if (!isVariants && geneFilters.chr !== 'All') {
                    const rowChr = row['CHR'] ? row['CHR'].toString().trim() : '';
                    if (rowChr !== geneFilters.chr) return;

                    const rowStart = parseFloat(row['START']);
                    const rowEnd = parseFloat(row['END']);
                    if (!isNaN(rowStart) && rowStart > geneFilters.maxEnd) return;
                    if (!isNaN(rowEnd) && rowEnd < geneFilters.minStart) return;
                }

                if (!isNaN(prob) && !isNaN(negP)) {
                    const itemName = row[keyName] || row['RSID'] || row['SNP'] || 'Unknown';
                    let clumpId = row[keyClump] ? row[keyClump].toString().trim() : '';
                    if (clumpId === '') clumpId = "Unassigned (No Clump)";

                    if (!groups.has(clumpId)) {
                        groups.set(clumpId, { x: [], y: [], text: [], symbols: [], sizes: [] });
                    }

                    const group = groups.get(clumpId);
                    group.x.push(prob);
                    group.y.push(negP);

                    let markerShape = 'circle';
                    let markerSize = 8;
                    let isLead = false;

                    const leadVal = String(row[keyLead] || '').toLowerCase().trim();
                    if (leadVal === 'true' || leadVal === '1' || leadVal === 'yes') {
                        markerShape = 'star';
                        markerSize = 14;
                        isLead = true;
                    }

                    group.symbols.push(markerShape);
                    group.sizes.push(markerSize);

                    const isTop = (topPerClump.get(clumpId)?.index === index);

                    const typeLabel = isVariants ? 'Variant' : 'Gene';
                    const leadBadgeLabel = isVariants ? '⭐ Lead SNP' : '⭐ Lead Gene';
                    const topBadgeLabel = isVariants ? '🏆 Top Variant' : '🏆 Top Gene';

                    let extraBadges = '';
                    if (isLead) extraBadges += `<br><b>${leadBadgeLabel}</b>`;
                    if (isTop) extraBadges += `<br><b style="color:var(--ev-novel);">${topBadgeLabel}</b>`;

                    const hoverText = `${typeLabel}: ${itemName}${extraBadges}<br>Clump: ${clumpId}<br>Prob: ${prob}<br>NegP: ${negP.toFixed(4)}`;
                    group.text.push(hoverText);

                    if (isTop && clumpId !== "Unassigned (No Clump)") {
                        topTraceData.x.push(prob);
                        topTraceData.y.push(negP);
                        topTraceData.text.push(hoverText);
                    }
                }
            });

            const traces = [];
            const sortedClumps = Array.from(groups.keys()).sort();

            sortedClumps.forEach(clumpId => {
                const plotData = groups.get(clumpId);
                const trace = {
                    x: plotData.x,
                    y: plotData.y,
                    text: plotData.text,
                    name: clumpId,
                    mode: 'markers',
                    type: 'scattergl',
                    hoverinfo: 'text',
                    marker: {
                        symbol: plotData.symbols,
                        size: plotData.sizes,
                        opacity: 0.8,
                        color: ColorManager.getColor(clumpId)
                    }
                };
                traces.push(trace);
            });

            if (topTraceData.x.length > 0) {
                traces.push({
                    x: topTraceData.x,
                    y: topTraceData.y,
                    text: topTraceData.text,
                    name: isVariants ? 'Top Variants' : 'Top Genes',
                    mode: 'markers',
                    type: 'scattergl',
                    hoverinfo: 'text',
                    marker: { symbol: 'circle-open', size: 22, color: FEC().Novel, line: { width: 3 } }
                });
            }

            const layout = {
                xaxis: { title: 'PROBABILITY' },
                yaxis: { title: 'Negative Log10(P-Value)' },
                hovermode: 'closest',
                margin: { t: 30, l: 60, r: 20, b: 50 },
                showlegend: true,
                legend: {
                    title: { text: 'CLUMP ID' },
                    x: 1.02, y: 1, xanchor: 'left', yanchor: 'top',
                    bgcolor: FPC().panelBg, bordercolor: FPC().line, borderwidth: 1
                }
            };

            const config = { responsive: true, displaylogo: false };
            container.innerHTML = '';
            Plotly.newPlot(container, traces, layout, config);

            if (typeof InspectorModule !== 'undefined') {
                InspectorModule.bindToPlot(containerId);
            }

            UI.setStatus("");
        }, 10);
    }
};

// ==========================================
// 7. SUMMARY MODULE
// ==========================================
const SummaryModule = {
    state: {
        genes: { raw: [], filtered: [], page: 1, sortCol: 'rawProb', sortAsc: false, search: '', roleFilter: 'all', classFilter: 'all' },
        prior: 0.05,
        evidenceLabel: 'Strong',
        bfValue: 10,
        threshold: 0.3448,
        apiGenes: [],
        geneClasses: [],
        currentTrait: null
    },

    // Genome-wide significance cutoff: -log10(0.05 / 20,000 genes) ≈ 5.6 (Bonferroni-
    // corrected). Applied everywhere before any other filtering/classification so
    // every chart and table on this page only ever sees genome-wide-significant genes.
    GENOME_WIDE_NEG_LOG_P: 5.6,

    EVIDENCE_SCALE: [
        { label: 'Anecdotal', bf: 1.001 },
        { label: 'Moderate', bf: 3.16 },
        { label: 'Strong', bf: 10 },
        { label: 'Very Strong', bf: 31.6 },
        { label: 'Extreme', bf: 100 },
        { label: 'Compelling', bf: 316.2 },
        { label: 'Overwhelming', bf: 1000 },
        { label: 'Definitive', bf: 3162.3 }
    ],

    calcThreshold(prior, bf) {
        return (bf * prior) / ((1 - prior) + (bf * prior));
    },

    _aboutRequestId: 0,
    async _loadTraitAbout(trait) {
        if (!window.FalconDescriptions) return;
        const myRequest = ++this._aboutRequestId;
        const description = window.FalconTraitIndex ? FalconTraitIndex.describeCode(trait) : trait;
        const d = await FalconDescriptions.getTraitDescription(trait, description);
        if (myRequest !== this._aboutRequestId) return; // a newer trait selection superseded this one
        const el = document.getElementById('trait-about');
        if (!el) return; // panel was re-rendered/closed before this resolved
        if (d && d.definition) {
            el.innerHTML = `<strong>${description}</strong> — ${d.definition}`;
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    },

    async renderSummary() {
        const container = document.getElementById('summary-container');
        const desc = document.getElementById('summary-desc');
        if (!container) return;
        if (desc) desc.style.display = 'none';

        const trait = DataStore.currentTrait;
        if (!trait) {
            container.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">Please select a trait first.</p>';
            return;
        }

        this.state.currentTrait = trait;
        this.state.threshold = this.calcThreshold(this.state.prior, this.state.bfValue);

        container.innerHTML = this._buildHeaderHtml() + this._buildLoadingHtml() + `<div id="summary-content" style="display:none;"></div>`;

        this._setupOptionsListeners();
        this._loadTraitAbout(trait);

        if (!ClinicalNEffectorManager.isLoaded) {
            await ClinicalNEffectorManager.load();
        }

        await this._fetchAndRender(trait);
    },

    _buildHeaderHtml() {
        const threshold = this.calcThreshold(this.state.prior, this.state.bfValue);
        const evidenceOptions = this.EVIDENCE_SCALE.map(e =>
            `<option value="${e.bf}" ${e.label === this.state.evidenceLabel ? 'selected' : ''}>${e.label} (BF ≥ ${e.bf})</option>`
        ).join('');
        const rawTrait = this.state.currentTrait || '';
        const currentTrait = window.FalconTraitIndex ? FalconTraitIndex.describeCode(rawTrait) : rawTrait;

        return `
        <div style="background: var(--surface-panel); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 240px;">
                    <h4 style="margin: 0 0 6px; color: var(--ink); font-size: 1.3em; font-weight: 800;">Trait explorer</h4>
                    <div id="trait-plei" style="color: var(--ink-2); font-size: 0.95em;">Loading gene data for <strong>${currentTrait}</strong>…</div>
                    <p id="trait-about" style="display:none; font-size: 0.85em; color: var(--ink-2); margin: 10px 0 0; line-height: 1.6;"></p>
                </div>
                <div style="position: relative;">
                    <button id="summary-options-toggle" type="button" title="Analysis options"
                        style="border: 1px solid var(--border-color); background: var(--surface-raised); border-radius: 6px; padding: 8px 12px; cursor: pointer; font-size: 1.1em; line-height: 1;">⚙️</button>
                    <div id="summary-options-menu" style="display:none; position:absolute; top:calc(100% + 6px); right:0; z-index:100;
                        background:var(--surface-raised); border:1px solid var(--border-color); border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.12); padding:16px; width:240px;">
                        <label style="font-size: 0.82em; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 5px;">Prior Probability</label>
                        <select id="summary-prior-select" style="width:100%; box-sizing:border-box; padding: 7px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--surface-raised); font-size: 0.9em; margin-bottom: 12px;">
                            <option value="0.01" ${this.state.prior === 0.01 ? 'selected' : ''}>1% (FALCON default)</option>
                            <option value="0.05" ${this.state.prior === 0.05 ? 'selected' : ''}>5%</option>
                        </select>
                        <label style="font-size: 0.82em; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 5px;">Evidence Level (Jeffreys Scale)</label>
                        <select id="summary-evidence-select" style="width:100%; box-sizing:border-box; padding: 7px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--surface-raised); font-size: 0.9em;">
                            ${evidenceOptions}
                        </select>
                        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 0.82em; color: var(--ink-2);">
                            Posterior Threshold: <strong id="summary-threshold-display" style="color: var(--ok);">${threshold.toFixed(4)}</strong>
                        </div>
                    </div>
                </div>
            </div>
            <div style="position: relative; margin-top: 16px; max-width: 320px;">
                <label style="font-size: 0.82em; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 5px;">Trait</label>
                <input id="summary-trait-input" type="text" value="${currentTrait}"
                    placeholder="Search trait…"
                    style="width:100%; box-sizing:border-box; padding: 7px 10px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.9em;">
                <div id="summary-trait-list" style="display:none; position:absolute; top:100%; left:0; right:0; background:var(--surface-raised); border:1px solid var(--border-color); border-radius:4px; max-height:200px; overflow-y:auto; z-index:100; box-shadow:0 4px 12px rgba(0,0,0,0.1);"></div>
            </div>
        </div>`;
    },

    _buildLoadingHtml() {
        const ESTIMATED_GENES = 20000;
        const estSeconds = Math.round(ESTIMATED_GENES * 0.0015);
        return `
        <div id="summary-loading-section" style="background: var(--surface-panel); border: 1px solid var(--border-color); border-radius: 8px; padding: 30px 40px; margin-bottom: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <h4 style="color: var(--ink); margin: 0 0 8px;">Loading Gene Data...</h4>
            <p style="font-size: 0.85em; color: var(--ink-2); margin: 0 0 20px;">
                Fetching up to ~${ESTIMATED_GENES.toLocaleString()} genes for <strong>${DataStore.currentTrait || ''}</strong>.
                Estimated time: <strong>~${estSeconds}s</strong>
            </p>
            <div style="background: var(--track-bg); border-radius: 4px; height: 10px; overflow: hidden; max-width: 520px; margin: 0 auto 12px;">
                <div id="summary-progress-bar" style="background: #3b82f6; height: 100%; width: 0%; transition: width 0.4s ease; border-radius: 4px;"></div>
            </div>
            <p id="summary-progress-text" style="font-size: 0.82em; color: var(--ink-3); margin: 0;">Initializing...</p>
        </div>`;
    },

    _setupOptionsListeners() {
        const optToggle = document.getElementById('summary-options-toggle');
        const optMenu = document.getElementById('summary-options-menu');
        if (optToggle && optMenu) {
            optToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                optMenu.style.display = optMenu.style.display === 'block' ? 'none' : 'block';
            });
            document.addEventListener('click', (e) => {
                if (optMenu.style.display === 'block' && !optMenu.contains(e.target) && e.target !== optToggle) {
                    optMenu.style.display = 'none';
                }
            });
        }

        document.getElementById('summary-prior-select')?.addEventListener('change', (e) => {
            this.state.prior = parseFloat(e.target.value);
            this.state.threshold = this.calcThreshold(this.state.prior, this.state.bfValue);
            const el = document.getElementById('summary-threshold-display');
            if (el) el.textContent = this.state.threshold.toFixed(4);
            this._recomputeAndRefresh();
        });

        document.getElementById('summary-evidence-select')?.addEventListener('change', (e) => {
            this.state.bfValue = parseFloat(e.target.value);
            const found = this.EVIDENCE_SCALE.find(s => s.bf === this.state.bfValue);
            this.state.evidenceLabel = found ? found.label : 'Custom';
            this.state.threshold = this.calcThreshold(this.state.prior, this.state.bfValue);
            const el = document.getElementById('summary-threshold-display');
            if (el) el.textContent = this.state.threshold.toFixed(4);
            this._recomputeAndRefresh();
        });

        const traitInput = document.getElementById('summary-trait-input');
        const traitList = document.getElementById('summary-trait-list');
        if (traitInput && traitList) {
            wireTraitAutocomplete(traitInput, traitList, (code) => {
                this.state.currentTrait = code;
                this._fetchAndRender(code);
                this._loadTraitAbout(code);
            });
        }
    },

    _recomputeAndRefresh() {
        if (!this.state.apiGenes.length || !this.state.currentTrait) return;
        this._processApiData(this.state.apiGenes, this.state.currentTrait);
    },

    async _fetchAndRender(trait) {
        const loadingSection = document.getElementById('summary-loading-section');
        const progressBar = document.getElementById('summary-progress-bar');
        const progressText = document.getElementById('summary-progress-text');
        const contentSection = document.getElementById('summary-content');

        // --- Dual-Track Routing ---
        const globalState = window.falconGlobalState || getParentFalconGlobalState();
        if (trait && trait.startsWith('local-') && globalState && globalState.traitName === trait) {
            this.state.apiGenes = globalState.genes || [];
            if (loadingSection) loadingSection.style.display = 'none';
            if (contentSection) contentSection.style.display = 'block';
            this._processApiData(this.state.apiGenes, trait);
            return;
        }
        // --- End Dual Track Routing ---

        const ESTIMATED_TOTAL = 20000;
        const startTime = Date.now();
        let received = 0;
        let allData = [];

        try {
            const seen = new Set();
            const rowKey = r => `${r.GENE}|${r.CLUMP}|${r.CHR}`;

            // Page 1: query endpoint
            const firstUrl = new URL(`${BioIndexLoader.baseUrl}gene-file-trait-sorted`, location.origin);
            firstUrl.searchParams.set('q', trait);
            let result = await (await fetch(firstUrl)).json();

            let token = result.continuation || null;
            (result.data || []).forEach(r => { seen.add(rowKey(r)); allData.push(r); });
            received = allData.length;

            const updateProgress = () => {
                const pct = Math.min(99, Math.round((received / ESTIMATED_TOTAL) * 100));
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = elapsed > 0 ? received / elapsed : 0;
                const estRemaining = rate > 0 && received < ESTIMATED_TOTAL
                    ? Math.round((ESTIMATED_TOTAL - received) / rate) : null;
                if (progressBar) progressBar.style.width = pct + '%';
                if (progressText) progressText.textContent =
                    `Loaded ${received.toLocaleString()} / ~${ESTIMATED_TOTAL.toLocaleString()} genes` +
                    (estRemaining !== null ? ` — ~${estRemaining}s remaining` : '');
            };
            updateProgress();

            // Page 2+: continuation endpoint  /bio/cont?token=<token>
            while (token) {
                const contUrl = new URL(BioIndexLoader.contUrl, location.origin);
                contUrl.searchParams.set('token', token);
                result = await (await fetch(contUrl)).json();

                const batch = result.data || [];
                const newRows = batch.filter(r => !seen.has(rowKey(r)));

                if (newRows.length < batch.length) {
                    // Duplicates detected — server is cycling; stop immediately
                    console.warn(`Summary fetch: ${batch.length - newRows.length} duplicate records detected, stopping.`);
                    newRows.forEach(r => { seen.add(rowKey(r)); allData.push(r); });
                    break;
                }

                newRows.forEach(r => { seen.add(rowKey(r)); allData.push(r); });
                received = allData.length;
                token = result.continuation || null;
                updateProgress();

                if (!batch.length) break;
            }

            if (progressBar) progressBar.style.width = '100%';
            if (progressText) progressText.textContent = `Loaded ${received.toLocaleString()} genes. Processing...`;

            this.state.apiGenes = allData;

            if (loadingSection) loadingSection.style.display = 'none';
            if (contentSection) contentSection.style.display = 'block';

            this._processApiData(allData, trait);

        } catch (err) {
            console.error('Failed to load gene data from API:', err);
            if (loadingSection) loadingSection.innerHTML = `
                <p style="color: #dc2626; font-weight: bold;">Failed to load data</p>
                <p style="font-size: 0.85em; color: var(--ink-3);">${err.message}</p>`;
        }
    },

    _computeGeneClasses(genes, trait, threshold) {
        const traitNorm = (trait || '').toLowerCase().trim();

        const v2gSet = new Set();
        if (DataStore.datasets.v2g && DataStore.datasets.v2g.isLoaded) {
            DataStore.datasets.v2g.data.forEach(row => {
                const rowTrait = (row.PHENOTYPE || row.TRAIT || row.trait || '').toLowerCase().trim();
                if (rowTrait === traitNorm) {
                    const gene = row.GENE || row.gene;
                    if (gene) v2gSet.add(gene.toUpperCase().trim());
                }
            });
        }

        return genes.map(gene => {
            const geneName = (gene.GENE || gene.gene || '').toString().trim();
            const prob = parseFloat(gene.PROBABILITY || gene.probability || 0);
            const A = !isNaN(prob) && prob >= threshold;

            const leadVal = String(gene.NEAREST_TO_LEAD || '').toLowerCase().trim();
            const isLead = (leadVal === 'true' || leadVal === '1' || leadVal === 'yes');

            const gd = ClinicalNEffectorManager.getGeneData(geneName);

            // C_{i,j}: clinical trial exists for this exact trait
            const C = gd ? gd.clinical_trials.some(t =>
                (t.falcon_IdName || '').toLowerCase() === traitNorm
            ) : false;

            const clinicalStages = gd ? gd.clinical_trials
                .filter(t => (t.falcon_IdName || '').toLowerCase() === traitNorm)
                .map(t => t.Phase) : [];

            // E_{i,j}: in EGL or V2G for this trait (may coexist with C)
            const inEGL = gd ? gd.egl.some(e =>
                (e.falcon_IdName || '').toLowerCase() === traitNorm
            ) : false;
            const inV2G = v2gSet.has(geneName.toUpperCase());
            const E = inEGL || inV2G;

            // Novel_{i,j}: no clinical, no EGL, no V2G support
            const Novel = !(C || inEGL || inV2G);

            // RepA: associated, no clinical trial for this trait, but approved elsewhere
            const hasAnyApproval = gd ? gd.clinical_trials.some(t => t.Phase === 'APPROVAL') : false;
            const RepA = A && !C && hasAnyApproval;

            return {
                geneName,
                prob,
                clump: (gene.CLUMP || '').toString().trim() || 'Unassigned',
                negLogP: parseFloat(gene.NEG_LOG_P || 0),
                isLead,
                isTop: false,           // filled in below after clump-max pass
                A, C, E, Novel,
                CliA: C && A,
                EffA: E && A,
                NovA: Novel && A,
                RepA,
                AssociatedTop: false,  // filled below
                AssociatedLead: A && isLead,
                clinicalStages
            };
        });
    },

    _processApiData(genes, trait) {
        const contentSection = document.getElementById('summary-content');
        if (!contentSection) return;

        // Genome-wide significance filter — applied first so every downstream
        // chart/table (plots, Gene Intersection, Gene Probability Distribution,
        // Gene Signal Highlights, the plei counts) only ever sees these genes.
        genes = genes.filter(gene => parseFloat(gene.NEG_LOG_P || 0) >= this.GENOME_WIDE_NEG_LOG_P);

        const threshold = this.state.threshold;

        // Compute Top per clump (max prob, Prob≥0.05 AND NegLogP≥1)
        const topPerClump = new Map();
        genes.forEach((gene, idx) => {
            const prob = parseFloat(gene.PROBABILITY || 0);
            const negLogP = parseFloat(gene.NEG_LOG_P || 0);
            if (isNaN(prob) || prob < 0.05 || isNaN(negLogP) || negLogP < 1) return;
            const clump = (gene.CLUMP || '').toString().trim() || 'Unassigned';
            if (!topPerClump.has(clump) || prob > topPerClump.get(clump).prob) {
                topPerClump.set(clump, { idx, prob });
            }
        });

        const classified = this._computeGeneClasses(genes, trait, threshold);

        classified.forEach((gc, idx) => {
            gc.isTop = (topPerClump.get(gc.clump)?.idx === idx);
            gc.AssociatedTop = gc.A && gc.isTop;
        });

        this.state.geneClasses = classified;

        // Build table rows (any gene that is top, lead, or associated)
        const tableGenes = [];
        const traitNorm = trait.toLowerCase().trim();
        classified.forEach((gc, idx) => {
            if (!gc.A && !gc.isTop && !gc.isLead) return;
            const gene = genes[idx];
            const roles = [];
            if (gc.isTop && gc.isLead) { roles.push('🏆 Top', '⭐ Lead'); }
            else if (gc.isTop) { roles.push('🏆 Top'); }
            else if (gc.isLead) { roles.push('⭐ Lead'); }

            const pairClasses = [];
            if (gc.CliA) pairClasses.push('Clinical Associated');
            if (gc.EffA) pairClasses.push('Effector Associated');
            if (gc.NovA) pairClasses.push('Novel Associated');
            if (gc.RepA) pairClasses.push('Repurposable');
            if (!pairClasses.length && gc.A) pairClasses.push('Associated');
            const pairClass = pairClasses.join(' / ') || '—';

            const trials = ClinicalTrialsManager.getTrials(gc.geneName);

            const gd = ClinicalNEffectorManager.getGeneData(gc.geneName);
            const seenEgl = new Set();
            const eglEntries = gd ? gd.egl
                .filter(e => (e.falcon_IdName || '').toLowerCase() === traitNorm)
                .filter(e => {
                    const key = `${e.pmid}|${e.page_id}`;
                    if (seenEgl.has(key)) return false;
                    seenEgl.add(key);
                    return true;
                }) : [];

            // ClinicalNEffectorManager trials for this trait (fallback / supplement)
            const cneTrials = gd ? gd.clinical_trials.filter(
                t => (t.falcon_IdName || '').toLowerCase() === traitNorm
            ) : [];

            // For Repurposable genes show all clinical trials (other traits); otherwise trait-filtered
            const cneAllTrials = gd ? gd.clinical_trials : [];
            const allTrials = trials.length > 0 ? trials
                : gc.RepA ? cneAllTrials
                    : cneTrials;

            tableGenes.push({
                clump: gc.clump,
                color: ColorManager.getColor(gc.clump),
                name: gc.geneName,
                prob: gc.prob.toFixed(4),
                rawProb: gc.prob,
                rawSig: gc.negLogP,
                significance: gc.negLogP.toFixed(2),
                role: roles.join(' & ') || '—',
                pairClass,
                pairClasses,
                hasClinicalTrials: allTrials.length > 0,
                clinicalTrials: allTrials,
                hasEgl: eglEntries.length > 0,
                eglEntries,
                isNovel: gc.Novel,
                traits: null
            });
        });

        this.state.genes.raw = tableGenes;
        this._updateTraitPlei(trait, classified);

        contentSection.innerHTML = `
            <div id="summary-tables-container"></div>

            <div style="background: var(--surface-panel); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <h4 style="margin-top: 0; color: var(--ink); border-bottom: 2px solid var(--line); padding-bottom: 8px; font-size: 1.1em;">🧬 Gene Intersection</h4>
                <p style="font-size: 0.85em; color: var(--ink-2); line-height: 1.6; margin-bottom: 12px;">
                    Gene–trait pair classifications at the current posterior threshold (<strong id="gene-intersection-thresh">${threshold.toFixed(4)}</strong>).
                    <strong>Clinical</strong>: associated gene with a clinical trial for this trait.
                    <strong>Effector</strong>: associated gene in EGL or V2G (may overlap with Clinical).
                    <strong>Novel</strong>: associated gene with no clinical, EGL, or V2G support.
                    <strong>Repurposable</strong>: associated gene, no trial for this trait, but approved elsewhere.
                    Each column shows a distinct set combination; bar height = number of genes.
                </p>
                <div id="gene-intersection-container" style="height: 420px;"></div>
            </div>

            <div style="background: var(--surface-panel); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <h4 style="margin-top: 0; color: var(--ink); border-bottom: 2px solid var(--line); padding-bottom: 8px; font-size: 1.1em;">📊 Gene Probability Distribution</h4>
                <p style="font-size: 0.85em; color: var(--ink-2); line-height: 1.6; margin-bottom: 16px;">
                    Posterior probability distributions for each associated gene class at the current threshold.
                </p>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;">
                    <div>
                        <h5 style="margin: 0 0 6px; font-size: 0.88em; color: var(--ev-associated);">All Associations</h5>
                        <div id="dist-all-container" style="height: 240px;"></div>
                    </div>
                    <div>
                        <h5 style="margin: 0 0 6px; font-size: 0.88em; color: var(--ev-clinical);">Clinical Associated</h5>
                        <div id="dist-clinical-container" style="height: 240px;"></div>
                    </div>
                    <div>
                        <h5 style="margin: 0 0 6px; font-size: 0.88em; color: var(--ev-effector);">Effector Associated</h5>
                        <div id="dist-effector-container" style="height: 240px;"></div>
                    </div>
                    <div>
                        <h5 style="margin: 0 0 6px; font-size: 0.88em; color: var(--ev-novel);">Novel Associated</h5>
                        <div id="dist-novel-container" style="height: 240px;"></div>
                    </div>
                    <div>
                        <h5 style="margin: 0 0 6px; font-size: 0.88em; color: var(--ev-repurposable);">Repurposable</h5>
                        <div id="dist-repurposable-container" style="height: 240px;"></div>
                    </div>
                </div>
            </div>

            <div style="background: var(--surface-panel); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                    <input id="trait-gene-search" type="text" placeholder="Search genes…"
                        style="padding: 7px 10px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.9em; width: 220px;">
                </div>
                <div id="trait-genes-plot-container" style="height: 460px;"></div>
            </div>
        `;

        this._drawTraitGenesPlot(classified, '');
        const geneSearchInput = document.getElementById('trait-gene-search');
        if (geneSearchInput) {
            geneSearchInput.addEventListener('input', () => this._drawTraitGenesPlot(classified, geneSearchInput.value));
        }

        const tablesContainer = document.getElementById('summary-tables-container');
        this.buildInteractiveTable(
            tablesContainer,
            'genes',
            'Gene Signal Highlights',
            'NEG_LOG_P',
            `Genes associated at the current posterior threshold (probability ≥ <strong>${this.state.threshold.toFixed(4)}</strong>), plus each clump's 🏆 top-scoring and ⭐ lead-variant gene even if below that threshold — so this total can exceed the "with ${(this.state.evidenceLabel || 'Strong').toLowerCase()} support" counts elsewhere on the page. Filter by role, pair classification, or search by gene name.`
        );

        this._drawGeneIntersectionPlot('gene-intersection-container', classified);
        this._drawClassProbDistribution(classified);
    },

    _updateTraitPlei(trait, classified) {
        const el = document.getElementById('trait-plei');
        if (!el) return;
        const displayName = window.FalconTraitIndex ? FalconTraitIndex.describeCode(trait) : trait;
        const evidenceLabel = (this.state.evidenceLabel || 'Strong').toLowerCase();
        const allGenes = new Set(classified.map(g => g.geneName));
        const strongGenes = new Set(classified.filter(g => g.A).map(g => g.geneName));
        el.innerHTML = `<strong>${displayName}</strong> shows genetic support across <strong>${allGenes.size}</strong> genes · <strong style="color:#d9813a;">${strongGenes.size}</strong> with <strong style="color:#d9813a;">${evidenceLabel}</strong> support (probability ≥ ${this.state.threshold.toFixed(4)}).`;
    },

    _drawTraitGenesPlot(classified, query) {
        const div = document.getElementById('trait-genes-plot-container');
        if (!div) return;
        const evidenceLabel = (this.state.evidenceLabel || 'Strong').toLowerCase();
        const supported = classified.filter(g => g.A);
        const q = (query || '').trim().toLowerCase();
        const filtered = q ? supported.filter(g => g.geneName.toLowerCase().includes(q)) : supported;
        if (!filtered.length) {
            div.innerHTML = `<p style="padding:20px;color:var(--ink-3);">No genes with ${evidenceLabel} support match.</p>`;
            return;
        }
        const sorted = filtered.slice().sort((a, b) => b.prob - a.prob);
        const trace = {
            x: sorted.map(g => g.geneName), y: sorted.map(g => g.prob), type: 'bar',
            marker: {
                color: sorted.map(g => g.negLogP),
                colorscale: window.FalconPlotTheme ? FalconPlotTheme.continuous : 'Viridis',
                showscale: true, colorbar: { title: '−log10(P)', thickness: 12 }
            },
            text: sorted.map(g => `P: ${g.prob.toFixed(4)}`)
        };
        const base = window.FalconPlotTheme ? FalconPlotTheme.layout() : {};
        const layout = Object.assign({}, base, {
            title: { text: `Gene probability — ${evidenceLabel} support (colored by −log10 P-value)`, font: { size: 15, color: '#0c1c34' } },
            xaxis: Object.assign({}, base.xaxis, { title: '', tickangle: -40 }),
            yaxis: Object.assign({}, base.yaxis, { title: 'Probability', range: [0, 1] }),
            margin: { b: 130, t: 44, l: 56, r: 20 }
        });
        Plotly.newPlot(div, [trace], layout, window.FalconPlotTheme ? FalconPlotTheme.config : { responsive: true, displaylogo: false });
    },

    _drawGeneIntersectionPlot(containerId, classified) {
        const SET_KEYS = ['CliA', 'EffA', 'NovA', 'RepA'];
        const SET_NAMES = ['Clinical', 'Effector', 'Novel', 'Repurposable'];
        const _ec = FEC();
        const SET_COLORS = [_ec.Clinical, _ec.Effector, _ec.Novel, _ec.Repurposable];

        const totalA = classified.filter(gc => gc.A).length;

        // Build intersection counts keyed by 3-bit membership string
        const comboMap = new Map();
        classified.forEach(gc => {
            if (!gc.A) return;
            const key = SET_KEYS.map(k => gc[k] ? '1' : '0').join('');
            comboMap.set(key, (comboMap.get(key) || 0) + 1);
        });

        const combos = [...comboMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => ({ key, count, bits: key.split('').map(Number) }));

        const el = document.getElementById(containerId);
        if (!combos.length) {
            if (el) el.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-muted);">No associated genes at current threshold.</p>';
            return;
        }

        const xi = combos.map((_, i) => i);

        // Top panel: vertical bar chart
        const barTrace = {
            x: xi,
            y: combos.map(c => c.count),
            type: 'bar',
            marker: { color: FEC().Associated },
            xaxis: 'x', yaxis: 'y',
            hovertemplate: 'Count: %{y}<extra></extra>',
            showlegend: false
        };

        // Bottom panel: filled/empty dots per set row
        const dotColors = FPC();
        const dotTraces = SET_KEYS.map((_, si) => ({
            x: xi,
            y: xi.map(() => si),
            mode: 'markers',
            marker: {
                color: combos.map(c => c.bits[si] ? SET_COLORS[si] : dotColors.mutedFill),
                size: 16,
                symbol: 'circle',
                line: { color: combos.map(c => c.bits[si] ? SET_COLORS[si] : dotColors.line), width: 1.5 }
            },
            xaxis: 'x2', yaxis: 'y2',
            showlegend: false,
            hoverinfo: 'skip'
        }));

        // Vertical connector lines between filled dots in the same column
        const lineTraces = combos.map((c, xi_i) => {
            const active = c.bits.map((b, si) => b ? si : -1).filter(s => s >= 0);
            if (active.length < 2) return null;
            return {
                x: [xi_i, xi_i],
                y: [Math.min(...active), Math.max(...active)],
                mode: 'lines',
                line: { color: FPC().ink2, width: 3 },
                xaxis: 'x2', yaxis: 'y2',
                showlegend: false,
                hoverinfo: 'skip'
            };
        }).filter(Boolean);

        const layout = {
            xaxis: { showticklabels: false, domain: [0, 1], fixedrange: true },
            yaxis: { title: 'Count', domain: [0.48, 1], fixedrange: true },
            xaxis2: { showticklabels: false, domain: [0, 1], matches: 'x', fixedrange: true },
            yaxis2: {
                tickvals: [0, 1, 2, 3],
                ticktext: SET_NAMES,
                domain: [0, 0.42],
                autorange: 'reversed',
                fixedrange: true,
                tickfont: { size: 12 }
            },
            margin: { t: 30, l: 90, r: 30, b: 10 },
            annotations: [{
                text: `All associations: <b>${totalA}</b>`,
                x: 0.5, y: 1,
                xref: 'paper', yref: 'paper',
                xanchor: 'center', yanchor: 'bottom',
                showarrow: false,
                font: { size: 12, color: FPC().ink2 }
            }],
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            showlegend: false
        };

        Plotly.newPlot(containerId, [barTrace, ...dotTraces, ...lineTraces], layout,
            { displayModeBar: false, responsive: true });
    },

    _drawClassProbDistribution(classified) {
        const classes = [
            { id: 'dist-all-container', key: 'A', label: 'All Associations', color: FEC().Associated },
            { id: 'dist-clinical-container', key: 'CliA', label: 'Clinical Associated', color: FEC().Clinical },
            { id: 'dist-effector-container', key: 'EffA', label: 'Effector Associated', color: FEC().Effector },
            { id: 'dist-novel-container', key: 'NovA', label: 'Novel Associated', color: FEC().Novel },
            { id: 'dist-repurposable-container', key: 'RepA', label: 'Repurposable', color: FEC().Repurposable },
        ];

        classes.forEach(({ id, key, label, color }) => {
            const el = document.getElementById(id);
            if (!el) return;
            const probs = classified.filter(gc => gc[key] && !isNaN(gc.prob)).map(gc => gc.prob);
            if (!probs.length) {
                el.innerHTML = '<p style="text-align:center;padding:30px;color:var(--text-muted);font-size:0.85em;">No genes in this class.</p>';
                return;
            }
            Plotly.newPlot(id, [{
                y: probs,
                type: 'box',
                name: label,
                marker: { color },
                boxpoints: 'all',
                jitter: 0.3,
                pointpos: -1.8
            }], {
                margin: { t: 10, l: 50, r: 10, b: 40 },
                yaxis: { range: [-0.05, 1.05], title: 'Probability' },
                showlegend: false,
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)'
            }, { displayModeBar: false, responsive: true });
        });
    },

    buildInteractiveTable(container, type, title, sigLabel, description) {
        if (this.state[type].raw.length === 0) {
            container.innerHTML += `
                <div style="background: var(--surface-panel); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: var(--ink);">${title}</h4>
                    <p style="padding: 10px; background: var(--surface-header); border: 1px solid var(--line); border-radius: 4px; margin: 0;">No signals found at the current threshold.</p>
                </div>`;
            return;
        }

        this.state[type].search = '';
        this.state[type].page = 1;
        this.state[type].sortCol = 'rawProb';
        this.state[type].sortAsc = false;
        this.state[type].roleFilter = 'all';
        this.state[type].classFilter = 'all';

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin-bottom:30px; background:var(--surface-panel); border:1px solid var(--border-color); border-radius:8px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.04);';

        wrapper.innerHTML = `
            <div style="border-bottom: 2px solid var(--line); padding-bottom: 15px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 5px 0; color: var(--ink); font-size: 1.1em;">${title} <span id="summary-count-${type}" style="color:var(--text-muted); font-weight:normal; font-size:0.85em;"></span></h4>
                <p style="margin: 0; font-size: 0.9em; color: var(--ink-2); line-height: 1.5;">${description}</p>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                <label style="font-size: 0.85em; font-weight: bold; color: var(--text-muted); align-self: center;">Filters:</label>
                <select id="summary-role-${type}" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--surface-raised);">
                    <option value="all">All Roles</option>
                    <option value="top">🏆 Top Only</option>
                    <option value="lead">⭐ Lead Only</option>
                    <option value="both">🏆 Top &amp; ⭐ Lead</option>
                </select>
                <select id="summary-class-${type}" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--surface-raised);">
                    <option value="all">All Classifications</option>
                    <option value="Clinical Associated">Clinical Associated</option>
                    <option value="Effector Associated">Effector Associated</option>
                    <option value="Novel Associated">Novel Associated</option>
                    <option value="Repurposable">Repurposable</option>
                    <option value="Associated">Associated (other)</option>
                </select>
                <input type="text" id="summary-search-${type}" placeholder="Search genes..." style="width: 200px; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div class="table-wrapper">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead id="summary-head-${type}"></thead>
                    <tbody id="summary-body-${type}"></tbody>
                </table>
            </div>
            <div class="pagination">
                <button id="summary-prev-${type}" class="page-btn">Previous</button>
                <span id="summary-info-${type}">Page 0 of 0</span>
                <button id="summary-next-${type}" class="page-btn">Next</button>
            </div>
        `;
        container.appendChild(wrapper);

        document.getElementById(`summary-role-${type}`).addEventListener('change', (e) => {
            this.state[type].roleFilter = e.target.value;
            this.state[type].page = 1;
            this.refreshTable(type, sigLabel);
        });

        document.getElementById(`summary-class-${type}`).addEventListener('change', (e) => {
            this.state[type].classFilter = e.target.value;
            this.state[type].page = 1;
            this.refreshTable(type, sigLabel);
        });

        document.getElementById(`summary-search-${type}`).addEventListener('input', (e) => {
            this.state[type].search = e.target.value.toLowerCase();
            this.state[type].page = 1;
            this.refreshTable(type, sigLabel);
        });

        document.getElementById(`summary-prev-${type}`).addEventListener('click', () => {
            this.state[type].page--;
            this.refreshTable(type, sigLabel);
        });

        document.getElementById(`summary-next-${type}`).addEventListener('click', () => {
            this.state[type].page++;
            this.refreshTable(type, sigLabel);
        });

        this.refreshTable(type, sigLabel);
    },

    refreshTable(type, sigLabel) {
        const state = this.state[type];

        state.filtered = state.raw.filter(row => {
            if (state.roleFilter !== 'all') {
                if (state.roleFilter === 'top' && row.role !== '🏆 Top') return false;
                if (state.roleFilter === 'lead' && row.role !== '⭐ Lead') return false;
                if (state.roleFilter === 'both' && row.role !== '🏆 Top & ⭐ Lead') return false;
            }

            if (state.classFilter !== 'all') {
                const classes = row.pairClasses || [row.pairClass];
                if (!classes.includes(state.classFilter)) return false;
            }

            if (state.search) {
                const searchStr = state.search;
                const searchable = [row.name, row.clump, row.role, row.pairClass].filter(Boolean);
                if (!searchable.some(v => v.toLowerCase().includes(searchStr))) return false;
            }
            return true;
        });

        state.filtered.sort((a, b) => {
            const valA = a[state.sortCol];
            const valB = b[state.sortCol];
            if (state.sortCol === 'rawProb' || state.sortCol === 'rawSig') {
                return state.sortAsc ? valA - valB : valB - valA;
            }
            const sA = valA ? valA.toString().toLowerCase() : '';
            const sB = valB ? valB.toString().toLowerCase() : '';
            if (sA < sB) return state.sortAsc ? -1 : 1;
            if (sA > sB) return state.sortAsc ? 1 : -1;
            return 0;
        });

        const rowsPerPage = 10;
        const totalPages = Math.ceil(state.filtered.length / rowsPerPage) || 1;
        if (state.page > totalPages) state.page = totalPages;
        if (state.page < 1) state.page = 1;

        const start = (state.page - 1) * rowsPerPage;
        const pageData = state.filtered.slice(start, start + rowsPerPage);

        const thead = document.getElementById(`summary-head-${type}`);
        thead.innerHTML = '';
        const trHead = document.createElement('tr');
        trHead.style.backgroundColor = 'var(--surface-header)';

        const cols = [
            { id: 'name', label: 'Name' },
            { id: 'role', label: 'Role' },
            { id: 'pairClass', label: 'Classification' },
            { id: 'rawProb', label: 'PROBABILITY' },
            { id: 'rawSig', label: sigLabel },
            { id: 'hasClinicalTrials', label: 'Clinical Trials' },
            { id: 'hasEgl', label: 'Effector (EGL)' }
        ];

        cols.forEach(col => {
            const th = document.createElement('th');
            th.style.cssText = 'padding:12px; text-align:left; border-bottom:1px solid var(--line); cursor:pointer; white-space:nowrap;';
            th.textContent = col.label + (state.sortCol === col.id ? (state.sortAsc ? ' ↑' : ' ↓') : '');
            th.addEventListener('click', () => {
                if (state.sortCol === col.id) state.sortAsc = !state.sortAsc;
                else { state.sortCol = col.id; state.sortAsc = true; }
                this.refreshTable(type, sigLabel);
            });
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        const tbody = document.getElementById(`summary-body-${type}`);
        tbody.innerHTML = '';

        const validateTrait = this.state.currentTrait || DataStore.currentTrait || '';

        const _ec = FEC();
        const CLASS_COLORS = {
            'Clinical Associated': _ec.Clinical,
            'Effector Associated': _ec.Effector,
            'Novel Associated': _ec.Novel,
            'Repurposable': _ec.Repurposable,
            'Associated': _ec.Associated
        };

        pageData.forEach(item => {
            const classes = item.pairClasses?.length ? item.pairClasses : [item.pairClass];
            const classBadge = classes.map(cls => {
                const c = CLASS_COLORS[cls] || '#9ca3af';
                return `<span style="display:inline-block; padding:2px 8px; border-radius:9999px; background:${c}22; color:${c}; font-size:0.78em; font-weight:600; border:1px solid ${c}44; margin-right:3px;">${cls}</span>`;
            }).join('');

            const clinicalCellHtml = item.hasClinicalTrials
                ? `<td style="padding:12px; border-bottom:1px solid var(--line);">
                       <div style="display:flex; align-items:center; gap:8px;">
                           <span style="color:var(--ok-2); font-weight:bold;">Yes</span>
                           <button class="toggle-trials-btn" style="padding:3px 8px; font-size:0.78em; cursor:pointer; border:1px solid var(--border-color); border-radius:4px; background:var(--surface-raised);">View ▼</button>
                       </div>
                   </td>`
                : `<td style="padding:12px; border-bottom:1px solid var(--line);"><span style="color:var(--ink-3);">No</span></td>`;

            const eglCellHtml = item.hasEgl
                ? `<td style="padding:12px; border-bottom:1px solid var(--line);">
                       <div style="display:flex; align-items:center; gap:8px;">
                           <span style="color:var(--ok-2); font-weight:bold;">Yes</span>
                           <button class="toggle-egl-btn" style="padding:3px 8px; font-size:0.78em; cursor:pointer; border:1px solid var(--border-color); border-radius:4px; background:var(--surface-raised);">View ▼</button>
                       </div>
                   </td>`
                : `<td style="padding:12px; border-bottom:1px solid var(--line);"><span style="color:var(--ink-3);">No</span></td>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:12px; border-bottom:1px solid var(--line); font-family:monospace; font-size:1.05em;">
                    <a href="#" class="gene-validate-link" data-gene="${item.name}"
                       title="Validate ${item.name}${validateTrait ? ' / ' + validateTrait : ''} →"
                       style="color:var(--brand,#d9813a); text-decoration:none; font-weight:700; border-bottom:1px dashed rgba(217,129,58,.55); cursor:pointer;">${item.name}</a>
                </td>
                <td style="padding:12px; border-bottom:1px solid var(--line); white-space:nowrap;">${item.role}</td>
                <td style="padding:12px; border-bottom:1px solid var(--line);">${classBadge}</td>
                <td style="padding:12px; border-bottom:1px solid var(--line); font-weight:bold; color:var(--ok-2);">${item.prob}</td>
                <td style="padding:12px; border-bottom:1px solid var(--line);">${item.significance}</td>
                ${clinicalCellHtml}
                ${eglCellHtml}
            `;
            tbody.appendChild(tr);

            // Click the gene → open the Validate tab pre-filled with this gene + current trait
            tr.querySelector('.gene-validate-link')?.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToApp('validate', { gene: item.name, trait: validateTrait });
            });

            // Clinical trials expanded row
            if (item.hasClinicalTrials && item.clinicalTrials?.length > 0) {
                const trialsTr = document.createElement('tr');
                trialsTr.style.display = 'none';
                trialsTr.style.backgroundColor = 'var(--tint-info-row)';

                const isRepurposable = item.pairClasses?.includes('Repurposable');
                let trialsHtml = `
                    <table style="width:100%; font-size:0.88em; border-collapse:collapse; border:1px solid var(--tint-info-line);">
                        <thead><tr style="background:var(--tint-info-head);">
                            <th style="padding:7px; text-align:left; border-bottom:1px solid var(--tint-info-line);">Drug ID</th>
                            <th style="padding:7px; text-align:left; border-bottom:1px solid var(--tint-info-line);">Indication</th>
                            <th style="padding:7px; text-align:left; border-bottom:1px solid var(--tint-info-line);">Phase</th>
                            ${isRepurposable ? '<th style="padding:7px; text-align:left; border-bottom:1px solid var(--tint-info-line);">Trait</th>' : ''}
                        </tr></thead><tbody>`;
                item.clinicalTrials.forEach(t => {
                    trialsHtml += `<tr>
                        <td style="padding:7px; border-bottom:1px solid var(--tint-info-head);">${t.Drug_ID || ''}</td>
                        <td style="padding:7px; border-bottom:1px solid var(--tint-info-head);">${t.Indication_Name || ''}</td>
                        <td style="padding:7px; border-bottom:1px solid var(--tint-info-head);">${t.Phase || ''}</td>
                        ${isRepurposable ? `<td style="padding:7px; border-bottom:1px solid var(--tint-info-head);">${t.falcon_IdName || t.falcon_Description || ''}</td>` : ''}
                    </tr>`;
                });
                trialsHtml += '</tbody></table>';
                trialsTr.innerHTML = `<td colspan="7" style="padding:15px; border-bottom:1px solid var(--line); white-space:normal;">
                    <strong style="font-size:0.9em; display:block; margin-bottom:6px;">Clinical Trials for ${item.name}:${isRepurposable ? ' <span style="font-weight:normal; color:#f97316;">(approved for other traits)</span>' : ''}</strong>${trialsHtml}</td>`;
                tbody.appendChild(trialsTr);

                tr.querySelector('.toggle-trials-btn')?.addEventListener('click', () => {
                    const open = trialsTr.style.display !== 'none';
                    trialsTr.style.display = open ? 'none' : 'table-row';
                    const btn = tr.querySelector('.toggle-trials-btn');
                    btn.textContent = open ? 'View ▼' : 'Hide ▲';
                    btn.style.background = open ? '' : 'var(--tint-info-head)';
                });
            }

            // EGL expanded row
            if (item.hasEgl && item.eglEntries?.length > 0) {
                const eglTr = document.createElement('tr');
                eglTr.style.display = 'none';
                eglTr.style.backgroundColor = 'var(--tint-ok-row)';

                let eglHtml = `
                    <table style="width:100%; font-size:0.88em; border-collapse:collapse; border:1px solid var(--tint-ok-line);">
                        <thead><tr style="background:var(--tint-ok-head);">
                            <th style="padding:7px; text-align:left; border-bottom:1px solid var(--tint-ok-line);">Authors</th>
                            <th style="padding:7px; text-align:left; border-bottom:1px solid var(--tint-ok-line);">Trait</th>
                            <th style="padding:7px; text-align:left; border-bottom:1px solid var(--tint-ok-line);">PMID</th>
                            <th style="padding:7px; text-align:left; border-bottom:1px solid var(--tint-ok-line);">Citation</th>
                        </tr></thead><tbody>`;
                item.eglEntries.forEach(e => {
                    const pmidLink = e.pmid
                        ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/" target="_blank" style="color:var(--ok);">${e.pmid}</a>`
                        : '';
                    eglHtml += `<tr>
                        <td style="padding:7px; border-bottom:1px solid var(--ok-line);">${e.authors || ''}</td>
                        <td style="padding:7px; border-bottom:1px solid var(--ok-line);">${e.trait || ''}</td>
                        <td style="padding:7px; border-bottom:1px solid var(--ok-line);">${pmidLink}</td>
                        <td style="padding:7px; border-bottom:1px solid var(--ok-line); font-size:0.85em; color:var(--ink-2);">${e.citation || ''}</td>
                    </tr>`;
                });
                eglHtml += '</tbody></table>';
                eglTr.innerHTML = `<td colspan="7" style="padding:15px; border-bottom:1px solid var(--line); white-space:normal;">
                    <strong style="font-size:0.9em; display:block; margin-bottom:6px;">Effector Gene List (EGL) entries for ${item.name}:</strong>${eglHtml}</td>`;
                tbody.appendChild(eglTr);

                tr.querySelector('.toggle-egl-btn')?.addEventListener('click', () => {
                    const open = eglTr.style.display !== 'none';
                    eglTr.style.display = open ? 'none' : 'table-row';
                    const btn = tr.querySelector('.toggle-egl-btn');
                    btn.textContent = open ? 'View ▼' : 'Hide ▲';
                    btn.style.background = open ? '' : 'var(--tint-ok-head)';
                });
            }
        });

        document.getElementById(`summary-count-${type}`).textContent = `(${state.filtered.length} total)`;
        document.getElementById(`summary-info-${type}`).textContent = `Page ${state.page} of ${totalPages}`;
        document.getElementById(`summary-prev-${type}`).disabled = state.page === 1;
        document.getElementById(`summary-next-${type}`).disabled = state.page === totalPages;
    }
};

// ==========================================
// 7.4 CLINICAL TRIALS MANAGER
// ==========================================
const ClinicalTrialsManager = {
    data: {},
    isLoaded: false,

    async loadFromFile(file) {
        if (this.isLoaded) {
            console.log("Clinical trials data already loaded. Skipping.");
            return;
        }

        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        if (!this.data) this.data = {};

                        results.data.forEach(row => {
                            // 1. Check if the row has a Gene_Name
                            if (!row.Gene_Name) return;

                            // 2. Normalize the string: Uppercase and remove surrounding spaces
                            const gene = row.Gene_Name.toString().toUpperCase().trim();

                            if (!this.data[gene]) this.data[gene] = [];
                            this.data[gene].push(row);
                        });

                        this.isLoaded = true;

                        if (typeof DataStore !== 'undefined' && DataStore.datasets) {
                            DataStore.datasets.clinicalTrials.data = this.data;
                            DataStore.datasets.clinicalTrials.isLoaded = true;
                        }

                        console.log("Clinical trials data processed and loaded successfully!");
                        resolve();

                    } catch (processingError) {
                        console.error("Error while mapping parsed data:", processingError);
                        reject(processingError);
                    }
                },
                error: (err) => {
                    console.error("PapaParse failed to parse the CSV:", err);
                    reject(err);
                }
            });
        });
    },

    getTrials(geneName) {
        // 3. Normalize the search query to match the stored data exactly
        if (!geneName) return [];
        const normalizedQuery = geneName.toString().toUpperCase().trim();
        return this.data[normalizedQuery] || [];
    }
};

// ==========================================
// 7.5 GENE TRAIT FETCHER (API Integration)
// ==========================================
const GeneTraitFetcher = {
    targetCatalog: "https://hugeampkpncms.org/rest/data?pageid=Gene_page_PEGLs_475",
    proxyBase: "https://api.codetabs.com/v1/proxy?quest=",
    pageIdToData: {},
    isLoaded: false,
    cache: {}, // Store fetched traits to avoid redundant API calls

    async init() {
        if (this.isLoaded) return;
        console.log("Initializing fetcher and downloading master catalog...");
        try {
            const fetchUrl = this.proxyBase + encodeURIComponent(this.targetCatalog);
            const response = await fetch(fetchUrl);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const json = await response.json();
            const csvData = json[0]['field_data_points'];

            return new Promise((resolve, reject) => {
                Papa.parse(csvData, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        results.data.forEach(row => {
                            this.pageIdToData[row['Page ID']] = row;
                        });
                        this.isLoaded = true;
                        console.log("Catalog loaded successfully!");
                        resolve();
                    },
                    error: (err) => {
                        console.error("PapaParse error:", err);
                        reject(err);
                    }
                });
            });
        } catch (err) {
            console.error("Failed to load catalog:", err);
        }
    },

    async getTraitsForGene(geneName) {
        // Return from cache if already fetched
        if (this.cache[geneName]) return this.cache[geneName];

        if (!this.isLoaded) await this.init();
        const targetGeneUrl = `https://hugeampkpncms.org/rest/egls?gene=${encodeURIComponent(geneName)}`;
        const fetchUrl = this.proxyBase + encodeURIComponent(targetGeneUrl);

        try {
            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const geneData = await response.json();

            const results = [];
            geneData.forEach(item => {
                const pageId = item['field_page_id'];
                const rowData = this.pageIdToData[pageId];

                if (rowData) {
                    results.push({
                        page_id: pageId,
                        trait: rowData['Trait'] || 'N/A',
                        pmid: rowData['PMID'] || 'N/A',
                        citation: rowData['Citation'] || 'N/A',
                        authors: rowData['short_name'] || 'N/A'
                    });
                }
            });
            // Store results in cache
            this.cache[geneName] = results;
            return results;
        } catch (err) {
            console.error(`Failed to fetch data for gene ${geneName}:`, err);
            return [];
        }
    }
};

// ==========================================
// 7.6 CLINICAL + EFFECTOR (EGL) MANAGER
// ==========================================
const ClinicalNEffectorManager = {
    data: {},       // keyed by uppercase gene name → { gene, clinical_trials[], egl[] }
    isLoaded: false,

    async load() {
        if (this.isLoaded) return;
        try {
            const response = await fetch('./data/clinical_n_effector.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            text.trim().split('\n').forEach(line => {
                const l = line.trim();
                if (!l) return;
                try {
                    const obj = JSON.parse(l);
                    if (obj.gene) this.data[obj.gene.toUpperCase().trim()] = obj;
                } catch (_) { }
            });
            this.isLoaded = true;
        } catch (err) {
            console.error('ClinicalNEffectorManager: failed to load', err);
        }
    },

    getGeneData(geneName) {
        if (!geneName) return null;
        return this.data[geneName.toUpperCase().trim()] || null;
    }
};

// ==========================================
// 8. FALCON ZOOM & LD MATRIX MODULE (Heavy Debug Instrumentation)
// ==========================================
// ==========================================
// 8. FALCON zoom & LD MATRIX MODULE
// ==========================================
const FalconZoomModule = {
    ldCache: {},
    showLD: true,
    showGeneTracks: true,
    ldChunkSize: 1000000,
    ldMinR2: 0,
    ldStretch: 0.1,
    tableRows: { genes: [], variants: [], v2g: [], ld: [] },
    tableFilterVariant: null,
    tableStates: {
        genes: { page: 1, search: '', sortCol: null, sortAsc: true },
        variants: { page: 1, search: '', sortCol: null, sortAsc: true },
        v2g: { page: 1, search: '', sortCol: null, sortAsc: true },
        ld: { page: 1, search: '', sortCol: null, sortAsc: true }
    },
    rowsPerPage: 10,

    init() {
        document.getElementById('btn-run-zoom').addEventListener('click', () => {
            this.runAnalysis();
        });
        document.getElementById('btn-show-ld')?.addEventListener('click', () => {
            this.showLD = true;
            this.runAnalysis();
        });
        const toggleBtn = document.getElementById('btn-toggle-gene-tracks');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.showGeneTracks = !this.showGeneTracks;
                toggleBtn.textContent = this.showGeneTracks ? "Hide Gene Tracks" : "Show Gene Tracks";
                this.runAnalysis();
            });
        }
        ['genes', 'variants', 'v2g', 'ld'].forEach(type => {
            const input = document.getElementById(`zoom-table-search-${type}`);
            if (!input) return;
            input.addEventListener('input', (event) => {
                this.tableStates[type].search = event.target.value;
                this.tableStates[type].page = 1;
                this.renderZoomTable(type);
            });
        });

        // Add ResizeObserver to handle plot resizing when container becomes visible
        const plotContainer = document.getElementById('zoom-scatter-plot-container');
        if (plotContainer) {
            const resizeObserver = new ResizeObserver(() => {
                if (plotContainer.classList.contains('js-plotly-plot')) {
                    Plotly.Plots.resize(plotContainer);
                }
            });
            resizeObserver.observe(plotContainer);
        }
    },

    setStatus(msg) {
        const statusEl = document.getElementById('zoom-status');
        if (statusEl) statusEl.textContent = msg;
    },

    async loadGeneLocData() {
        if (this.geneLocData) return this.geneLocData;
        try {
            const response = await fetch('./data/gene_loc_37.tsv');
            const text = await response.text();
            const lines = text.split('\n');
            const headers = lines[0].split('\t').map(h => h.trim());
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cols = lines[i].split('\t').map(c => c.trim());
                const row = {};
                headers.forEach((h, idx) => {
                    row[h] = cols[idx];
                });
                data.push({
                    gene: row['GENE'],
                    chr: row['CHR'],
                    start: parseInt(row['START']),
                    end: parseInt(row['END']),
                    direction: row['DIRECTION']
                });
            }
            this.geneLocData = data;
            return data;
        } catch (err) {
            console.error('Failed to load gene_loc_37.tsv', err);
            return [];
        }
    },

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    getVariantKey(row, pos) {
        return String(row['RSID'] || row['VARIANT'] || row['SNP'] || `Pos:${pos}`);
    },

    getVariantAliases(row) {
        const pos = parseInt(row?.['POS']);
        return new Set([
            row?.['RSID'],
            row?.['VARIANT'],
            row?.['SNP'],
            !isNaN(pos) ? `Pos:${pos}` : null
        ].filter(Boolean).map(v => String(v)));
    },

    rowMatchesVariant(row, variantAliases, linkedGenes = new Set()) {
        if (!row || !variantAliases) return false;
        const rowValues = ['RSID', 'VARIANT', 'SNP'].map(key => row[key]).filter(Boolean).map(v => String(v));
        if (rowValues.some(value => variantAliases.has(value))) return true;
        const pos = parseInt(row['POS']);
        if (!isNaN(pos) && variantAliases.has(`Pos:${pos}`)) return true;
        const gene = row['GENE'] || row['ID'];
        return gene && linkedGenes.has(String(gene));
    },

    getLinkedGenesForVariant(row, v2gRows = []) {
        const genes = new Set();
        for (let i = 1; i <= 10; i++) {
            if (row?.[`GENE_${i}`]) genes.add(String(row[`GENE_${i}`]));
        }
        const aliases = this.getVariantAliases(row);
        v2gRows.forEach(v2g => {
            const v2gVariant = v2g['VARIANT'] || v2g['SNP'] || v2g['RSID'];
            if (v2gVariant && aliases.has(String(v2gVariant)) && v2g['GENE']) {
                genes.add(String(v2g['GENE']));
            }
        });
        return genes;
    },

    rowDetailsHtml(meta) {
        const row = meta?.row || {};
        const rows = Object.keys(row).sort().map(key => {
            return `<tr><td style="font-weight:bold; padding:3px 8px 3px 0; vertical-align:top;">${this.escapeHtml(key)}</td><td style="padding:3px 0; word-break:break-word;">${this.escapeHtml(row[key])}</td></tr>`;
        }).join('');

        return `
            <div style="margin-bottom: 10px; font-weight: bold; color: var(--ink);">
                ${this.escapeHtml(meta?.variantKey || 'Variant')} (${this.escapeHtml(meta?.source || 'selection')})
            </div>
            <table style="border-collapse: collapse; width: 100%;">${rows}</table>
        `;
    },

    updateZoomTables(rows, selectedVariant = null) {
        this.tableRows = rows;
        this.tableFilterVariant = selectedVariant;
        ['genes', 'variants', 'v2g'].forEach(type => {
            this.tableStates[type].page = 1;
            this.renderZoomTable(type);
        });
    },

    filteredTableRows(type) {
        const state = this.tableStates[type];
        let rows = [...(this.tableRows[type] || [])];

        if (this.tableFilterVariant && type !== 'ld') {
            const aliases = this.getVariantAliases(this.tableFilterVariant);
            const linkedGenes = this.getLinkedGenesForVariant(this.tableFilterVariant, this.tableRows.v2g || []);
            rows = rows.filter(row => this.rowMatchesVariant(row, aliases, linkedGenes));
        }

        const q = (state.search || '').trim().toLowerCase();
        if (q) {
            rows = rows.filter(row => Object.values(row).some(value => String(value ?? '').toLowerCase().includes(q)));
        }

        if (state.sortCol) {
            rows.sort((a, b) => {
                const aVal = a[state.sortCol];
                const bVal = b[state.sortCol];
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);
                let cmp;
                if (!isNaN(aNum) && !isNaN(bNum)) cmp = aNum - bNum;
                else cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
                return state.sortAsc ? cmp : -cmp;
            });
        }

        return rows;
    },

    renderZoomTable(type) {
        const table = document.getElementById(`zoom-table-${type}`);
        const pager = document.getElementById(`zoom-table-page-${type}`);
        if (!table || !pager) return;

        const rows = this.filteredTableRows(type);
        const columns = [...new Set(rows.flatMap(row => Object.keys(row)))];
        const totalPages = Math.max(1, Math.ceil(rows.length / this.rowsPerPage));
        const state = this.tableStates[type];
        state.page = Math.min(Math.max(1, state.page), totalPages);
        const start = (state.page - 1) * this.rowsPerPage;
        const pageRows = rows.slice(start, start + this.rowsPerPage);

        if (columns.length === 0) {
            table.innerHTML = '<tbody><tr><td>No rows available.</td></tr></tbody>';
            pager.innerHTML = '';
            return;
        }

        const headers = columns.map(col => {
            const sortMark = state.sortCol === col ? (state.sortAsc ? ' ▲' : ' ▼') : '';
            return `<th data-col="${this.escapeHtml(col)}">${this.escapeHtml(col)}${sortMark}</th>`;
        }).join('');
        const bodyRows = pageRows.map(row => {
            return `<tr>${columns.map(col => `<td>${this.escapeHtml(row[col] ?? '')}</td>`).join('')}</tr>`;
        }).join('');
        table.innerHTML = `<thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody>`;

        table.querySelectorAll('th').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.getAttribute('data-col');
                if (state.sortCol === col) state.sortAsc = !state.sortAsc;
                else {
                    state.sortCol = col;
                    state.sortAsc = true;
                }
                this.renderZoomTable(type);
            });
        });

        const filterText = this.tableFilterVariant ? ` filtered by ${this.escapeHtml(this.getVariantKey(this.tableFilterVariant, parseInt(this.tableFilterVariant.POS)))}` : '';
        pager.innerHTML = `
            <span>${rows.length} rows${filterText} | Page ${state.page} of ${totalPages}</span>
            <button data-dir="prev" ${state.page <= 1 ? 'disabled' : ''}>Previous</button>
            <button data-dir="next" ${state.page >= totalPages ? 'disabled' : ''}>Next</button>
        `;
        pager.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                state.page += btn.getAttribute('data-dir') === 'next' ? 1 : -1;
                this.renderZoomTable(type);
            });
        });
    },

    async selectVariant(meta, point, plotContainer, plotType, baseShapes, variantPoints) {
        if (!meta || !meta.row) return;

        if (typeof InspectorModule !== 'undefined') {
            InspectorModule.showData(this.rowDetailsHtml(meta));
        }
        this.tableFilterVariant = meta.row;
        ['genes', 'variants', 'v2g'].forEach(type => {
            this.tableStates[type].page = 1;
            this.renderZoomTable(type);
        });

        if (plotType !== 'overlay') return;

        const partners = await this.fetchLDForVariant(
            this.currentChr,
            meta.variantKey,
            parseInt(meta.row.POS),
            this.currentPlotStart,
            this.currentPlotEnd,
            meta.row
        );
        this.tableRows.ld = partners;
        this.tableStates.ld.page = 1;
        this.renderZoomTable('ld');
        this.renderLDRugPlot(plotContainer, partners);

        const ldTitle = document.querySelector('.zoom-table-card[data-table="ld"] .zoom-table-header h4');
        if (ldTitle) {
            ldTitle.textContent = `LD Partner Data: ${this.getVariantKey(meta.row, meta.row.POS)}`;
        }

        const selectedKey = meta.variantKey;
        const selectedSource = meta.source;
        const counterpartSource = selectedSource === 'raw' ? 'falcon' : 'raw';
        const selectedPoints = variantPoints.filter(item => item.variantKey === selectedKey);
        const counterpart = selectedPoints.find(item => item.source === counterpartSource);
        const selected = selectedPoints.find(item => item.source === selectedSource) || {
            x: point.x,
            y: point.y,
            source: selectedSource,
            variantKey: selectedKey
        };
        const emphasized = new Set(selectedPoints.map(item => `${item.source}:${item.traceIndex}:${item.pointIndex}`));

        if (point.curveNumber !== undefined && point.pointNumber !== undefined) {
            emphasized.add(`${selectedSource}:${point.curveNumber}:${point.pointNumber}`);
        }

        const updates = {};
        const traceIndices = [];
        plotContainer.data.forEach((trace, traceIndex) => {
            if (!trace.customdata || trace.customdata.length === 0) return;
            const opacity = trace.customdata.map((item, pointIndex) => {
                const source = item?.source || '';
                const key = `${source}:${traceIndex}:${pointIndex}`;
                return emphasized.has(key) || item?.variantKey === selectedKey ? 1 : 0.12;
            });
            updates['marker.opacity'] = updates['marker.opacity'] || [];
            updates['marker.opacity'].push(opacity);
            traceIndices.push(traceIndex);
        });

        if (traceIndices.length > 0) {
            Plotly.restyle(plotContainer, updates, traceIndices);
        }

        const oldHighlightTraces = [];
        plotContainer.data.forEach((trace, traceIndex) => {
            if (trace.name === 'Selected variant') oldHighlightTraces.push(traceIndex);
        });
        if (oldHighlightTraces.length > 0) {
            await Plotly.deleteTraces(plotContainer, oldHighlightTraces);
        }

        const highlightShapes = baseShapes.concat([{
            type: 'line', xref: 'x', yref: 'paper',
            x0: selected.x, x1: selected.x, y0: 0, y1: 1,
            line: { color: FPC().ink, width: 2, dash: 'dot' }
        }]);
        const highlightX = [selected.x];
        const highlightY = [selected.y];
        const highlightText = [`Selected ${selectedSource.toUpperCase()}`];
        if (counterpart) {
            highlightX.push(counterpart.x);
            highlightY.push(counterpart.y);
            highlightText.push(`Corresponding ${counterpartSource.toUpperCase()}`);
        }

        await Plotly.relayout(plotContainer, { shapes: highlightShapes });
        await Plotly.addTraces(plotContainer, [{
            x: highlightX,
            y: highlightY,
            text: highlightText,
            name: 'Selected variant',
            mode: 'markers',
            type: 'scatter',
            hoverinfo: 'text',
            marker: {
                size: 18,
                symbol: 'circle-open',
                color: '#f59e0b',
                line: { color: '#f59e0b', width: 3 }
            },
            showlegend: false
        }]);
    },

    async clearSelection(plotContainer, plotType, baseShapes) {
        this.tableFilterVariant = null;
        this.tableRows.ld = [];
        ['genes', 'variants', 'v2g', 'ld'].forEach(type => {
            this.tableStates[type].page = 1;
            this.renderZoomTable(type);
        });

        const ldTitle = document.querySelector('.zoom-table-card[data-table="ld"] .zoom-table-header h4');
        if (ldTitle) {
            ldTitle.textContent = 'LD Partner Data';
        }

        const oldHighlightTraces = [];
        const traceIndices = [];
        const opacityValues = [];
        plotContainer.data.forEach((trace, traceIndex) => {
            if (trace.name === 'Selected variant' || (trace.name && trace.name.startsWith('LD Rug Plot'))) {
                oldHighlightTraces.push(traceIndex);
            }
            if (trace.customdata && trace.customdata.length > 0) {
                traceIndices.push(traceIndex);
                opacityValues.push(trace.name === 'Raw input' ? 0.7 : 1);
            }
        });

        if (oldHighlightTraces.length > 0) {
            await Plotly.deleteTraces(plotContainer, oldHighlightTraces);
        }
        if (traceIndices.length > 0) {
            await Plotly.restyle(plotContainer, { 'marker.opacity': opacityValues }, traceIndices);
        }
        await Plotly.relayout(plotContainer, { shapes: baseShapes });
    },

    bindZoomSelection(containerId, plotType, baseShapes, variantPoints, yMax) {
        const plotContainer = document.getElementById(containerId);
        if (!plotContainer) return;
        plotContainer.removeAllListeners?.('plotly_click');
        plotContainer._falconLastVariantClickAt = 0;

        plotContainer.onclick = () => {
            setTimeout(() => {
                if (Date.now() - plotContainer._falconLastVariantClickAt > 250) {
                    this.clearSelection(plotContainer, plotType, baseShapes);
                }
            }, 0);
        };

        plotContainer.on('plotly_click', async (data) => {
            const point = data.points && data.points[0];
            const meta = point?.customdata;
            if (!meta || !meta.row) return;
            plotContainer._falconLastVariantClickAt = Date.now();

            await this.selectVariant(meta, point, plotContainer, plotType, baseShapes, variantPoints);
        });
    },

    async loadLDChunk(chr, bin) {
        const chrLabel = String(chr).replace(/^chr/i, '');
        const chunkStart = Math.max(0, bin);
        const chunkEnd = chunkStart + this.ldChunkSize;
        const chunkKey = `chr${chrLabel}_${chunkStart}_${chunkEnd}`;
        if (this.ldCache[chunkKey]) return this.ldCache[chunkKey];

        const chunkUrl = `data/ld_chunks/chr${chrLabel}/chr${chrLabel}_${chunkStart}_${chunkEnd}.ld`;
        const response = await fetch(chunkUrl);
        if (!response.ok) return [];
        const text = await response.text();

        return new Promise((resolve, reject) => {
            const dataArray = [];
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                delimiter: "\t",
                step: function (row) {
                    if (row && row.data) {
                        const bpA = parseInt(row.data['BP_A']);
                        const bpB = parseInt(row.data['BP_B']);
                        const r2 = parseFloat(row.data['R2']);
                        if (!isNaN(bpA) && !isNaN(bpB) && !isNaN(r2)) {
                            dataArray.push({
                                bpA: bpA, bpB: bpB,
                                snpA: row.data['SNP_A'], snpB: row.data['SNP_B'], r2: r2
                            });
                        }
                    }
                },
                complete: () => {
                    this.ldCache[chunkKey] = dataArray;
                    resolve(dataArray);
                },
                error: (err) => reject(err)
            });
        });
    },

    async buildLDTrace({ chr, plotStart, plotEnd, validRsids, validBPs }) {
        if (!validRsids || validRsids.size === 0 || !validBPs || validBPs.size === 0) return null;

        const startBin = Math.max(0, Math.floor(plotStart / this.ldChunkSize) * this.ldChunkSize);
        const endBin = Math.max(0, Math.floor(plotEnd / this.ldChunkSize) * this.ldChunkSize);
        let combinedLD = [];
        let filesFound = 0;

        for (let bin = startBin; bin <= endBin; bin += this.ldChunkSize) {
            const chunkData = await this.loadLDChunk(chr, bin);
            if (chunkData.length > 0) {
                filesFound++;
                combinedLD = combinedLD.concat(chunkData);
            }
        }

        if (combinedLD.length === 0) {
            this.setStatus(`No LD chunks found for Chr ${chr}:${plotStart}-${plotEnd}.`);
            return null;
        }

        this.setStatus(`Loaded ${filesFound} LD chunk${filesFound === 1 ? '' : 's'} for this region. Rendering LD...`);
        combinedLD.sort((a, b) => b.bpA - a.bpA);

        const rawBPs = Array.from(validBPs).sort((a, b) => a - b);
        const plotWidth = plotEnd - plotStart;
        const maxAllowedStretch = plotWidth * 0.05;
        const bumperRadius = Math.max(10, maxAllowedStretch * this.ldStretch);
        const axisBPs = [];

        if (rawBPs.length > 0) {
            axisBPs.push(rawBPs[0] - bumperRadius);
            for (let i = 0; i < rawBPs.length; i++) {
                axisBPs.push(rawBPs[i]);
                if (i < rawBPs.length - 1) {
                    const dist = rawBPs[i + 1] - rawBPs[i];
                    if (dist > 2 * bumperRadius) {
                        axisBPs.push(rawBPs[i] + bumperRadius);
                        axisBPs.push(rawBPs[i + 1] - bumperRadius);
                    }
                }
            }
            axisBPs.push(rawBPs[rawBPs.length - 1] + bumperRadius);
        }

        const n = axisBPs.length;
        if (n === 0) return null;

        const bpToIndex = new Map(axisBPs.map((bp, i) => [bp, i]));
        const zMatrix = Array(n).fill(null).map(() => Array(n).fill(0.0));
        const textMatrix = Array(n).fill(null).map(() => Array(n).fill('No LD data'));
        const startIndex = this.findStartIndex(combinedLD, plotEnd);
        let mappedCount = 0;

        for (let i = startIndex; i < combinedLD.length; i++) {
            const row = combinedLD[i];
            if (row.bpA < plotStart) break;
            if (row.bpB < plotStart || row.bpB > plotEnd) continue;
            if (row.r2 < this.ldMinR2 || !validRsids.has(row.snpA) || !validRsids.has(row.snpB)) continue;
            if (!bpToIndex.has(row.bpA) || !bpToIndex.has(row.bpB)) continue;

            const idxA = bpToIndex.get(row.bpA);
            const idxB = bpToIndex.get(row.bpB);
            zMatrix[idxA][idxB] = row.r2;
            zMatrix[idxB][idxA] = row.r2;

            const hoverStr = `<b>SNP A:</b> ${row.snpA} (${row.bpA})<br><b>SNP B:</b> ${row.snpB} (${row.bpB})<br><b>R2:</b> ${row.r2.toFixed(3)}`;
            textMatrix[idxA][idxB] = hoverStr;
            textMatrix[idxB][idxA] = hoverStr;
            mappedCount++;
        }

        if (mappedCount === 0) return null;

        return {
            x: axisBPs,
            y: axisBPs,
            z: zMatrix,
            text: textMatrix,
            type: 'heatmap',
            xaxis: 'x',
            yaxis: 'y2',
            name: 'LD Correlation',
            hoverinfo: 'text',
            colorscale: [
                [0.0, FPC().zeroFill], [0.0001, FPC().zeroFill],
                [0.0001, '#1e3a8a'], [0.2, '#1e3a8a'],
                [0.2, '#7dd3fc'], [0.4, '#7dd3fc'],
                [0.4, '#fcd34d'], [0.6, '#fcd34d'],
                [0.6, '#f97316'], [0.8, '#f97316'],
                [0.8, '#ef4444'], [1.0, '#ef4444']
            ],
            zmin: 0,
            zmax: 1,
            showscale: true,
            colorbar: {
                title: 'R2',
                thickness: 15,
                len: 0.3,
                y: 0.15,
                tickvals: [0, 0.2, 0.4, 0.6, 0.8, 1.0]
            }
        };
    },

    findStartIndex(arr, targetBP) {
        let left = 0; let right = arr.length - 1; let result = -1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (arr[mid].bpA <= targetBP) { result = mid; right = mid - 1; }
            else { left = mid + 1; }
        }
        return result === -1 ? arr.length : result;
    },

    async fetchLDForVariant(chr, variantKey, pos, plotStart, plotEnd, metaRow) {
        const bin = Math.floor(pos / this.ldChunkSize) * this.ldChunkSize;
        const chunkData = await this.loadLDChunk(chr, bin);
        const partners = [];
        const variantAliases = this.getVariantAliases(metaRow);

        chunkData.forEach(d => {
            let partnerSnp = null;
            let partnerPos = null;

            if (variantAliases.has(d.snpA)) {
                partnerSnp = d.snpB;
                partnerPos = d.bpB;
            } else if (variantAliases.has(d.snpB)) {
                partnerSnp = d.snpA;
                partnerPos = d.bpA;
            }

            if (partnerSnp && partnerPos >= plotStart && partnerPos <= plotEnd) {
                partners.push({
                    SNP: partnerSnp,
                    POS: partnerPos,
                    R2: d.r2
                });
            }
        });
        return partners;
    },

    renderLDRugPlot(plotContainer, ldPartners) {
        const tracePrefix = 'LD Rug Plot';
        const existingIndices = [];
        plotContainer.data.forEach((t, i) => {
            if (t.name && t.name.startsWith(tracePrefix)) existingIndices.push(i);
        });
        if (existingIndices.length > 0) {
            Plotly.deleteTraces(plotContainer, existingIndices);
        }

        if (!ldPartners || ldPartners.length === 0) return;

        const bins = [
            { min: 0.8, max: 1.1, color: '#ef4444' },
            { min: 0.6, max: 0.8, color: '#f97316' },
            { min: 0.4, max: 0.6, color: '#fcd34d' },
            { min: 0.2, max: 0.4, color: '#7dd3fc' },
            { min: 0.0001, max: 0.2, color: '#1e3a8a' }
        ];

        const traces = bins.map(bin => {
            const x = [];
            const y = [];
            const text = [];
            ldPartners.forEach(p => {
                if (p.R2 >= bin.min && p.R2 < bin.max) {
                    x.push(p.POS, p.POS, null);
                    y.push(0, 1, null);
                    text.push(`Partner: ${p.SNP}<br>R2: ${p.R2.toFixed(3)}`, `Partner: ${p.SNP}<br>R2: ${p.R2.toFixed(3)}`, null);
                }
            });
            if (x.length === 0) return null;
            return {
                x: x, y: y, text: text,
                name: `${tracePrefix} (${bin.min})`,
                mode: 'lines', type: 'scatter', yaxis: 'y2', hoverinfo: 'text',
                line: { color: bin.color, width: 3 },
                showlegend: false
            };
        }).filter(Boolean);

        if (traces.length > 0) {
            Plotly.addTraces(plotContainer, traces);
        }
    },

    async runAnalysis() {
        const btn = document.getElementById('btn-run-zoom');
        if (btn) { btn.disabled = true; btn.textContent = "Running Analysis..."; btn.style.opacity = "0.7"; }

        try {
            const targetGeneInput = document.getElementById('zoom-gene').value.trim();
            const boundary = parseInt(document.getElementById('zoom-boundary').value) || 500000;
            const focus = document.getElementById('zoom-focus').value;
            const plotType = document.getElementById('zoom-plot-type').value;
            const phenotype = DataStore.currentTrait || document.getElementById('folder-name-text').textContent;

            if (!targetGeneInput) { this.setStatus("Error: Target Gene is required."); return; }
            if (!phenotype) { this.setStatus("Error: Select a Phenotype first."); return; }

            this.setStatus(`Fetching gene info for ${targetGeneInput}...`);

            // Fetch target gene data to get coordinates
            const geneResults = await BioIndexLoader.bioIndexFetch('gene-file-gene-sorted', targetGeneInput);
            const geneRow = geneResults.find(r => (r['GENE'] || '').toUpperCase() === targetGeneInput.toUpperCase());

            if (!geneRow) {
                this.setStatus(`Error: Gene '${targetGeneInput}' not found in FALCON database.`);
                return;
            }

            const chr = geneRow['CHR'] ? geneRow['CHR'].toString().trim() : '';
            const geneStart = parseInt(geneRow['START']);
            const geneEnd = parseInt(geneRow['END']);

            if (!chr || isNaN(geneStart) || isNaN(geneEnd)) {
                this.setStatus(`Error: Coordinate data missing for gene ${targetGeneInput}.`);
                return;
            }

            const plotStart = geneStart - boundary;
            const plotEnd = geneEnd + boundary;
            const region = `${chr}:${plotStart}-${plotEnd}`;

            this.currentChr = chr;
            this.currentPlotStart = plotStart;
            this.currentPlotEnd = plotEnd;

            this.setStatus(`Fetching region data for ${phenotype} ${region}...`);

            // Fetch region-specific genes and variants
            const v2gPromise = BioIndexLoader.bioIndexFetch('v2g-file-region-sorted', `${phenotype},${region}`).catch(err => {
                console.warn('V2G region fetch failed:', err);
                return [];
            });
            const [regGenes, regVars, regV2g] = await Promise.all([
                BioIndexLoader.bioIndexFetch('gene-file-region-sorted', `${phenotype},${region}`),
                BioIndexLoader.bioIndexFetch('variant-file-region-sorted', `${phenotype},${region}`),
                v2gPromise
            ]);
            this.updateZoomTables({ genes: regGenes, variants: regVars, v2g: regV2g }, null);

            const tracesData = {
                raw: { x: [], y: [], text: [], customdata: [] },
                unlinked: { x: [], y: [], text: [], symbols: [], sizes: [], customdata: [] },
                genes: {},
                clumps: new Map(),
                validRsids: new Set(),
                validBPs: new Set()
            };

            const geneColors = {};

            // Determine which genes to show based on 'focus'
            let genesToPlot = (focus === 'gene') ? [geneRow] : regGenes;

            genesToPlot.forEach((g, i) => {
                const gName = g['GENE'];
                if (!gName) return;
                geneColors[gName] = ColorManager.palette[i % ColorManager.palette.length];
                tracesData.genes[gName] = { x: [], y: [], text: [], symbols: [], sizes: [], customdata: [] };
            });

            regVars.forEach(row => {
                const pos = parseInt(row['POS']);
                if (isNaN(pos)) return;
                const rsid = this.getVariantKey(row, pos);

                if (row['RSID']) tracesData.validRsids.add(row['RSID']);
                if (row['VARIANT']) tracesData.validRsids.add(row['VARIANT']);
                if (row['SNP']) tracesData.validRsids.add(row['SNP']);
                tracesData.validRsids.add(rsid);

                const clumpStr = row['CLUMP'];
                let clumpLabel = '';
                if (clumpStr && String(clumpStr).trim() !== '') {
                    const clumpId = String(clumpStr).trim();
                    clumpLabel = `<br><b>Clump:</b> ${clumpId}`;
                    const parts = clumpId.split('_');
                    if (parts.length >= 3) {
                        const cStart = parseInt(parts[1]);
                        const cEnd = parseInt(parts[2]);
                        if (!isNaN(cStart) && !isNaN(cEnd)) {
                            tracesData.clumps.set(clumpId, {
                                start: Math.max(Math.min(cStart, cEnd), plotStart),
                                end: Math.min(Math.max(cStart, cEnd), plotEnd),
                                id: clumpId
                            });
                        }
                    }
                }

                const rawP = parseFloat(row['GWAS_P']);
                if (!isNaN(rawP) && rawP > 0) {
                    const rawNegP = -Math.log10(rawP);
                    tracesData.raw.x.push(pos);
                    tracesData.raw.y.push(rawNegP);
                    tracesData.raw.text.push(`<b>${rsid}</b>${clumpLabel}<br>Pos: ${pos}<br>GWAS_P: ${rawP.toExponential(2)}<br>NegP: ${rawNegP.toFixed(2)}`);
                    tracesData.raw.customdata.push({
                        source: 'raw',
                        variantKey: rsid,
                        row: row,
                        x: pos,
                        y: rawNegP
                    });
                }

                const prob = parseFloat(row['PROBABILITY']);
                const pVal = parseFloat(row['P_VALUE']);
                let negP = NaN;
                if (!isNaN(pVal) && pVal > 0) negP = -Math.log10(pVal);
                else if (pVal === 0) negP = 300;
                if (isNaN(negP)) return;

                if (DataStore.globalFilterActive && (prob < DataStore.globalMinProb || negP < DataStore.globalMinNegP)) return;

                const leadVal = String(row['LEAD_SNP'] || '').toLowerCase().trim();
                const isLead = (leadVal === 'true' || leadVal === '1' || leadVal === 'yes');
                const extraBadges = isLead ? '<br><b>Lead SNP</b>' : '';
                const hoverText = `<b>${rsid}</b>${extraBadges}${clumpLabel}<br>Pos: ${pos}<br>Prob: ${prob}<br>P_VALUE: ${pVal === 0 ? '0' : pVal.toExponential(2)}<br>NegP: ${negP.toFixed(2)}`;
                let linked = false;
                const falconMeta = {
                    source: 'falcon',
                    variantKey: rsid,
                    row: row,
                    x: pos,
                    y: negP
                };

                // BioIndex variant payload often includes GENE_1, LINK_SC_1 etc.
                for (let i = 1; i <= 3; i++) {
                    const gName = row[`GENE_${i}`];
                    if (gName && tracesData.genes[gName]) {
                        tracesData.genes[gName].x.push(pos);
                        tracesData.genes[gName].y.push(negP);
                        tracesData.genes[gName].text.push(hoverText + `<br>Linked to: <b>${gName}</b>`);
                        tracesData.genes[gName].symbols.push(isLead ? 'star' : 'circle');
                        tracesData.genes[gName].sizes.push(isLead ? 16 : 9);
                        tracesData.genes[gName].customdata.push({ ...falconMeta, linkedGene: gName });
                        linked = true;
                        break;
                    }
                }

                if (!linked) {
                    tracesData.unlinked.x.push(pos);
                    tracesData.unlinked.y.push(negP);
                    tracesData.unlinked.text.push(hoverText);
                    tracesData.unlinked.symbols.push(isLead ? 'star' : 'circle');
                    tracesData.unlinked.sizes.push(isLead ? 14 : 6);
                    tracesData.unlinked.customdata.push(falconMeta);
                }
                tracesData.validBPs.add(pos);
            });

            const traces = [];
            if (plotType === 'raw' || plotType === 'overlay') {
                traces.push({
                    x: tracesData.raw.x, y: tracesData.raw.y, text: tracesData.raw.text,
                    customdata: tracesData.raw.customdata,
                    name: 'Raw input', mode: 'markers', type: 'scattergl', hoverinfo: 'text',
                    marker: { size: 6, color: FPC().ink2, opacity: 0.7 }
                });
            }

            if (plotType === 'falcon' || plotType === 'overlay') {
                traces.push({
                    x: tracesData.unlinked.x, y: tracesData.unlinked.y, text: tracesData.unlinked.text,
                    customdata: tracesData.unlinked.customdata,
                    name: 'FALCON (Unlinked)', mode: 'markers', type: 'scattergl', hoverinfo: 'text',
                    marker: { size: tracesData.unlinked.sizes, symbol: tracesData.unlinked.symbols, color: '#a1a1aa' }
                });
                Object.keys(tracesData.genes).forEach(gName => {
                    const gTrace = tracesData.genes[gName];
                    if (gTrace.x.length > 0) {
                        traces.push({
                            x: gTrace.x, y: gTrace.y, text: gTrace.text, name: gName,
                            customdata: gTrace.customdata,
                            mode: 'markers', type: 'scattergl', hoverinfo: 'text',
                            marker: { size: gTrace.sizes, symbol: gTrace.symbols, color: geneColors[gName] }
                        });
                    }
                });
            }

            let maxY = 0;
            const updateMaxY = (values) => {
                if (values && values.length > 0) maxY = Math.max(maxY, Math.max(...values.filter(v => !isNaN(v))));
            };
            updateMaxY(tracesData.raw.y);
            updateMaxY(tracesData.unlinked.y);
            Object.values(tracesData.genes).forEach(gTrace => updateMaxY(gTrace.y));

            const shapes = [];
            const annotations = [];
            // Minimum visible width for a gene's location bar, in BP. Some BioIndex
            // engines (e.g. falcon-rs) report a single anchor position instead of a
            // true gene span (START === END), which otherwise collapses the shape/
            // line below to zero width and makes the gene bar invisible.
            const minGeneWidth = (plotEnd - plotStart) * 0.004;
            genesToPlot.forEach(g => {
                const gName = g['GENE'];
                const start = parseInt(g['START']);
                const end = parseInt(g['END']);
                if (!gName || isNaN(start) || isNaN(end)) return;

                let clippedStart = Math.max(Math.min(start, end), plotStart);
                let clippedEnd = Math.min(Math.max(start, end), plotEnd);
                if (clippedEnd - clippedStart < minGeneWidth) {
                    const mid = (clippedStart + clippedEnd) / 2;
                    clippedStart = Math.max(plotStart, mid - minGeneWidth / 2);
                    clippedEnd = Math.min(plotEnd, mid + minGeneWidth / 2);
                }
                const centerBP = clippedStart + (clippedEnd - clippedStart) / 2;
                const color = geneColors[gName] || '#2563eb';
                const geneHoverText = Object.entries(g)
                    .filter(([, v]) => v != null && v !== '')
                    .map(([k, v]) => `<b>${k}</b>: ${v}`)
                    .join('<br>');

                shapes.push({
                    type: 'rect', xref: 'x', yref: 'y domain',
                    x0: clippedStart, x1: clippedEnd, y0: 0, y1: 1,
                    fillcolor: color, opacity: 0.08,
                    line: { width: 2, dash: 'dash', color: color },
                    layer: 'below'
                });
                annotations.push({
                    x: centerBP, y: 0, xref: 'x', yref: 'y domain',
                    text: `<b>${gName}</b>`, showarrow: false,
                    font: { size: 12, color: color }, textangle: -45,
                    xanchor: 'right', yanchor: 'top'
                });
                traces.push({
                    x: [clippedStart, clippedEnd], y: [0, 0], text: [geneHoverText, geneHoverText],
                    name: `${gName} location`, mode: 'lines',
                    line: { width: 8, color: color }, hoverinfo: 'text',
                    showlegend: false
                });
            });

            const baseClumpY = maxY > 0 ? maxY * 1.08 : 10;
            const clumpYStep = maxY > 0 ? maxY * 0.07 : 1;
            const clumpTrace = {
                x: [], y: [], hovertext: [], text: [], name: 'Clumps',
                mode: 'lines+markers+text', type: 'scatter',
                marker: { symbol: [], size: [], color: '#2563eb' },
                line: { color: '#2563eb', width: 2 },
                hoverinfo: 'text', showlegend: false
            };
            const occupiedLevels = [];
            const sortedClumps = Array.from(tracesData.clumps.entries()).sort((a, b) => a[1].start - b[1].start);
            sortedClumps.forEach(([clumpId, bounds]) => {
                const start = bounds.start;
                const end = bounds.end;
                if (isNaN(start) || isNaN(end) || start >= end) return;

                let level = 0;
                const buffer = (plotEnd - plotStart) * 0.01;
                while (level < occupiedLevels.length && start < occupiedLevels[level] + buffer) level++;
                occupiedLevels[level] = end;

                const currentClumpY = baseClumpY + (level * clumpYStep);
                const mid = start + (end - start) / 2;
                const hoverStr = `<b>Clump ID:</b> ${clumpId}<br><b>Coordinates:</b> Chr ${chr}:${start.toLocaleString()}-${end.toLocaleString()}<br><b>Length:</b> ${(end - start).toLocaleString()} BP`;

                shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: start, x1: start, y0: 0, y1: 1, line: { color: 'rgba(107, 114, 128, 0.45)', width: 2, dash: 'dash' } });
                shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: end, x1: end, y0: 0, y1: 1, line: { color: 'rgba(37, 99, 235, 0.45)', width: 2, dash: 'dash' } });
                clumpTrace.x.push(start, mid, end, null);
                clumpTrace.y.push(currentClumpY, currentClumpY, currentClumpY, null);
                clumpTrace.marker.symbol.push('triangle-right', 'circle', 'triangle-left', 'circle');
                clumpTrace.marker.size.push(10, 0, 10, 0);
                clumpTrace.hovertext.push(hoverStr, hoverStr, hoverStr, null);
                clumpTrace.text.push('', '', '', null);
            });
            if (clumpTrace.x.length > 0) {
                traces.push(clumpTrace);
            }

            const topClumpY = occupiedLevels.length > 0 ? baseClumpY + ((occupiedLevels.length - 1) * clumpYStep) : maxY;
            const yMax = Math.max(maxY, topClumpY) * 1.08 || 10;
            const ldTrace = this.showLD ? await this.buildLDTrace({
                chr,
                plotStart,
                plotEnd,
                validRsids: tracesData.validRsids,
                validBPs: tracesData.validBPs
            }) : null;
            const hasLD = Boolean(ldTrace);
            if (hasLD) traces.push(ldTrace);

            const isOverlay = (plotType === 'overlay');

            // Adjust height depending on whether we show gene tracks
            let plotHeight = 640;
            if (hasLD || isOverlay) {
                plotHeight = this.showGeneTracks ? 1000 : 850;
            } else {
                plotHeight = this.showGeneTracks ? 800 : 640;
            }

            const plotContainer = document.getElementById('zoom-scatter-plot-container');
            if (plotContainer) plotContainer.style.height = `${plotHeight}px`;

            const _theme = window.FalconPlotTheme;
            const layout = {
                title: { text: `FALCON zoom: ${targetGeneInput} in ${phenotype} (Chr ${chr})`, font: { size: 15, color: '#0c1c34' } },
                plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', height: plotHeight,
                font: _theme ? _theme.font : { family: '-apple-system, system-ui, sans-serif', color: '#33445f' },
                colorway: _theme ? _theme.palette : undefined,
                xaxis: { title: 'Position (BP)', range: [plotStart, plotEnd], gridcolor: 'rgba(12,28,52,.07)', linecolor: 'rgba(12,28,52,.15)', zeroline: false },
                yaxis: {
                    title: 'Negative Log10(P-Value)',
                    range: [0, yMax],
                    domain: (hasLD || isOverlay) ? (this.showGeneTracks ? [0.25, 1] : [0.08, 1]) : (this.showGeneTracks ? [0.19, 1] : [0, 1]),
                    gridcolor: 'rgba(12,28,52,.07)', linecolor: 'rgba(12,28,52,.15)',
                    zeroline: false
                },
                margin: { t: 60, l: 60, r: (hasLD || isOverlay) ? 70 : 20, b: 90 },
                hovermode: 'closest',
                shapes: shapes,
                annotations: annotations,
                legend: { x: 1.02, y: 1, bgcolor: 'rgba(255,255,255,.6)', bordercolor: 'rgba(12,28,52,.1)', borderwidth: 1 }
            };

            if (hasLD || isOverlay) {
                layout.yaxis2 = {
                    title: isOverlay ? 'LD partners' : 'Correlated BP',
                    domain: this.showGeneTracks ? [0.17, 0.21] : [0, 0.04],
                    range: isOverlay ? [0, 1] : [plotStart, plotEnd],
                    showgrid: false,
                    zeroline: false,
                    showticklabels: !isOverlay
                };
            }

            if (this.showGeneTracks) {
                // Fetch and prepare gene tracks
                const geneData = await this.loadGeneLocData();
                const currentChrNorm = chr.toLowerCase().replace(/^chr/, '');
                const regionGenes = geneData.filter(g => {
                    const gChrNorm = (g.chr || '').toLowerCase().replace(/^chr/, '');
                    return gChrNorm === currentChrNorm && g.end >= plotStart && g.start <= plotEnd;
                });

                // Interval packing/lane assignment algorithm
                regionGenes.sort((a, b) => a.start - b.start);
                const tracks = [];
                const geneTracks = [];
                const buffer = (plotEnd - plotStart) * 0.05; // 5% buffer to leave space for text labels

                regionGenes.forEach(g => {
                    let assignedTrack = -1;
                    for (let i = 0; i < tracks.length; i++) {
                        if (g.start > tracks[i] + buffer) {
                            assignedTrack = i;
                            tracks[i] = g.end;
                            break;
                        }
                    }
                    if (assignedTrack === -1) {
                        assignedTrack = tracks.length;
                        tracks.push(g.end);
                    }
                    geneTracks.push({ gene: g, track: assignedTrack });
                });

                const maxTrack = tracks.length;

                layout.yaxis3 = {
                    title: { text: 'Genes', font: { size: 12, color: '#33445f' } },
                    domain: [0, 0.15],
                    range: [Math.max(1, maxTrack) - 0.5, -0.5], // Top track is 0, goes downwards
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false,
                    fixedrange: true
                };

                const activeGeneColors = {};
                Object.entries(geneColors || {}).forEach(([name, color]) => {
                    activeGeneColors[name.toUpperCase()] = color;
                });

                // Add gene track traces to the plot
                geneTracks.forEach(({ gene, track }) => {
                    const color = activeGeneColors[gene.gene.toUpperCase()] || '#9ca3af';

                    // 1. Gene span line
                    traces.push({
                        x: [gene.start, gene.end],
                        y: [track, track],
                        xaxis: 'x',
                        yaxis: 'y3',
                        mode: 'lines',
                        line: {
                            width: 6,
                            color: color
                        },
                        hoverinfo: 'skip',
                        showlegend: false
                    });

                    // 2. Transcription direction marker & Label
                    const midpoint = (gene.start + gene.end) / 2;
                    const arrowSymbol = gene.direction === '+' ? 'triangle-right' : (gene.direction === '-' ? 'triangle-left' : 'circle');

                    traces.push({
                        x: [midpoint],
                        y: [track],
                        xaxis: 'x',
                        yaxis: 'y3',
                        mode: 'markers+text',
                        marker: {
                            symbol: arrowSymbol,
                            size: 10,
                            color: color
                        },
                        text: [gene.gene],
                        textposition: 'top center',
                        textfont: {
                            size: 10,
                            color: FPC().ink2,
                            weight: 'bold'
                        },
                        hoverinfo: 'text',
                        hovertext: `<b>Gene:</b> ${gene.gene}<br><b>Coordinates:</b> Chr ${gene.chr}:${gene.start.toLocaleString()}-${gene.end.toLocaleString()}<br><b>Direction:</b> ${gene.direction === '+' ? 'Forward (+)' : 'Reverse (-)'}`,
                        showlegend: false
                    });
                });
            }

            const config = { responsive: true, displaylogo: false };
            await Plotly.newPlot('zoom-scatter-plot-container', traces, layout, config);
            const variantPoints = [];
            traces.forEach((trace, traceIndex) => {
                if (!trace.customdata) return;
                trace.customdata.forEach((meta, pointIndex) => {
                    if (!meta) return;
                    variantPoints.push({
                        ...meta,
                        x: trace.x[pointIndex],
                        y: trace.y[pointIndex],
                        traceIndex: traceIndex,
                        pointIndex: pointIndex
                    });
                });
            });
            this.bindZoomSelection('zoom-scatter-plot-container', plotType, shapes, variantPoints, yMax);

            // Auto-select the top variant (max negative log p-value)
            if (variantPoints.length > 0) {
                let topVariant = variantPoints[0];
                variantPoints.forEach(p => {
                    if (p.y > topVariant.y) topVariant = p;
                });
                this.selectVariant(topVariant, topVariant, plotContainer, plotType, shapes, variantPoints);
            }

            let totalMarkers = 0;
            if (plotType === 'raw' || plotType === 'overlay') totalMarkers += tracesData.raw.x.length;
            if (plotType === 'falcon' || plotType === 'overlay') {
                totalMarkers += tracesData.unlinked.x.length;
                Object.values(tracesData.genes).forEach(gTrace => { totalMarkers += gTrace.x.length; });
            }
            const ldMsg = this.showLD ? (hasLD ? ' LD shown.' : ' No matching LD pairs found for displayed variants.') : '';
            this.setStatus(`Analysis complete. Found ${totalMarkers} markers in region.${ldMsg}`);

        } catch (err) {
            console.error(err);
            this.setStatus(`Error: ${err.message}`);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = "Run Analysis"; btn.style.opacity = "1"; }
        }
    }
};
const InspectorModule = {
    init() {
        this.panel = document.getElementById('data-inspector');
        this.header = document.getElementById('inspector-header');
        this.body = document.getElementById('inspector-body');
        this.content = document.getElementById('inspector-content');
        this.copyBtn = document.getElementById('inspector-copy-btn');
        this.isExpanded = false;

        this.header?.addEventListener('click', () => {
            this.setExpanded(!this.isExpanded);
        });

        document.getElementById('inspector-close-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            this.panel.style.display = 'none';
        });

        this.copyBtn.addEventListener('click', () => {
            const plainText = this.content.innerText;
            navigator.clipboard.writeText(plainText).then(() => {
                const originalText = this.copyBtn.innerHTML;
                this.copyBtn.innerHTML = '✅ Copied!';
                this.copyBtn.style.background = 'var(--ok-line)';
                this.copyBtn.style.borderColor = 'var(--ok-2)';

                setTimeout(() => {
                    this.copyBtn.innerHTML = originalText;
                    this.copyBtn.style.background = 'var(--surface-card)';
                    this.copyBtn.style.borderColor = 'var(--line)';
                }, 1500);
            });
        });
    },

    setExpanded(isExpanded) {
        this.isExpanded = isExpanded;
        if (this.body) this.body.style.display = isExpanded ? 'block' : 'none';
        if (this.panel) this.panel.style.width = isExpanded ? 'min(520px, calc(100vw - 40px))' : '260px';
    },

    showData(rawHtml) {
        this.content.innerHTML = rawHtml;
        this.setExpanded(false);
        this.panel.style.display = 'block';
    },

    bindToPlot(containerId) {
        const plotContainer = document.getElementById(containerId);
        if (!plotContainer) return;

        plotContainer.on('plotly_click', (data) => {
            if (data.points && data.points.length > 0) {
                const point = data.points[0];
                const htmlText = point.text || point.hovertext || 'No data available for this point.';
                this.showData(htmlText);
            }
        });
    }
};
// ==========================================
// 11. UI & ROUTING CONTROLLER
// ==========================================
const UI = {
    async init() {
        const page = document.body?.dataset?.page;
        if (window.FalconTraitIndex) await FalconTraitIndex.load();

        let globalTrait = getParentFalconGlobalState()?.traitName || null;

        if (page === 'traits') {
            BioIndexLoader.init();
            const trait = new URLSearchParams(location.search).get('trait') || globalTrait || 'Asthma';
            const phenoInput = document.getElementById('phenotype-search');
            if (phenoInput) phenoInput.value = window.FalconTraitIndex ? FalconTraitIndex.describeCode(trait) : trait;

            await BioIndexLoader.loadPhenotypeData(trait);
            if (typeof SummaryModule !== 'undefined') {
                SummaryModule.renderSummary();
            }
            return;
        }

        if (page === 'zoom') {
            BioIndexLoader.init();
            if (typeof FalconZoomModule !== 'undefined') FalconZoomModule.init();
            if (typeof InspectorModule !== 'undefined') InspectorModule.init();

            const probInput = document.getElementById('global-prob-input');
            const negPInput = document.getElementById('global-negp-input');
            if (probInput) {
                probInput.addEventListener('change', (e) => {
                    DataStore.globalMinProb = parseFloat(e.target.value) || 0;
                });
            }
            if (negPInput) {
                negPInput.addEventListener('change', (e) => {
                    DataStore.globalMinNegP = parseFloat(e.target.value) || 0;
                });
            }

            const zp = new URLSearchParams(location.search);
            const zTrait = zp.get('trait') || globalTrait || 'HDL';
            const zGene = zp.get('gene') || 'ABCA1';
            const phenotypeInput = document.getElementById('phenotype-search');
            const geneInput = document.getElementById('zoom-gene');
            if (phenotypeInput) phenotypeInput.value = window.FalconTraitIndex ? FalconTraitIndex.describeCode(zTrait) : zTrait;
            if (geneInput) geneInput.value = zGene;
            const bEl = document.getElementById('zoom-boundary'); if (bEl && zp.get('boundary')) bEl.value = zp.get('boundary');
            const fEl = document.getElementById('zoom-focus'); if (fEl && zp.get('focus')) fEl.value = zp.get('focus');
            const pEl = document.getElementById('zoom-plot-type'); if (pEl && zp.get('plot')) pEl.value = zp.get('plot');

            await BioIndexLoader.loadPhenotypeData(zTrait);
            await FalconZoomModule.runAnalysis();
            return;
        }

        // Legacy full init (trait_view.html)
        TableModule.init();
        BioIndexLoader.init();

        if (typeof GeneFilterModule !== 'undefined') GeneFilterModule.init();
        if (typeof FalconZoomModule !== 'undefined') FalconZoomModule.init();
        if (typeof InspectorModule !== 'undefined') InspectorModule.init();

        const probInput = document.getElementById('global-prob-input');
        const negPInput = document.getElementById('global-negp-input');

        const reRenderActiveTab = () => {
            const activeTabBtn = document.querySelector('.tab-btn.active');
            if (activeTabBtn) {
                const tabConfig = AppConfig.tabs.find(t => t.id === activeTabBtn.id);
                if (tabConfig) this.activateTab(tabConfig);
            }
        };

        if (probInput) {
            probInput.addEventListener('change', (e) => {
                DataStore.globalMinProb = parseFloat(e.target.value) || 0;
                reRenderActiveTab();
            });
        }

        if (negPInput) {
            negPInput.addEventListener('change', (e) => {
                DataStore.globalMinNegP = parseFloat(e.target.value) || 0;
                reRenderActiveTab();
            });
        }

        this.buildTabs();
        const zoomTab = AppConfig.tabs.find(t => t.id === 'tab-zoom');
        if (zoomTab) this.activateTab(zoomTab);

        const phenotypeInput = document.getElementById('phenotype-search');
        const geneInput = document.getElementById('zoom-gene');

        let startTrait = 'HDL';
        const zoomParentGlobalState = getParentFalconGlobalState();
        if (zoomParentGlobalState && zoomParentGlobalState.traitName) {
            startTrait = zoomParentGlobalState.traitName;
        }

        if (phenotypeInput) phenotypeInput.value = window.FalconTraitIndex ? FalconTraitIndex.describeCode(startTrait) : startTrait;
        if (geneInput) geneInput.value = 'ABCA1';

        await BioIndexLoader.loadPhenotypeData(startTrait);

        if (document.body.dataset.page === 'traits' && typeof SummaryModule !== 'undefined') {
            SummaryModule.renderSummary();
        } else {
            await FalconZoomModule.runAnalysis();
        }
    },

    setStatus(msg) {
        const el = document.getElementById('status');
        if (el) el.textContent = msg;
    },

    buildTabs() {
        const container = document.getElementById('tab-navigation');
        if (!container) return;
        container.innerHTML = '';
        AppConfig.tabs.forEach(tabConfig => {
            const btn = document.createElement('button');
            btn.className = 'tab-btn';
            btn.textContent = tabConfig.label;
            btn.id = tabConfig.id;
            if (tabConfig.requires && !DataStore.datasets[tabConfig.requires].isLoaded) {
                btn.disabled = true;
            } else {
                btn.addEventListener('click', () => this.activateTab(tabConfig));
            }
            container.appendChild(btn);
        });
    },

    activateTab(tabConfig) {
        const targetView = document.getElementById(tabConfig.targetView);
        if (!targetView) return;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(tabConfig.id);
        if (activeBtn) activeBtn.classList.add('active');
        document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
        targetView.classList.add('active');

        if (tabConfig.targetView === 'view-table') {
            TableModule.loadDataset(tabConfig.dataset);
        } else if (tabConfig.targetView.includes('plot') && tabConfig.targetView !== 'view-zoom-plot') {
            PlotModule.renderScatterPlot(tabConfig.dataset, tabConfig.containerId);
        } else if (tabConfig.targetView === 'view-summary') {
            SummaryModule.renderSummary();
        }
    }
};

UI.init();

// ==========================================
// 12. LOCAL DATA MESSAGE LISTENER
// ==========================================
window.applyFalconLocalData = function (payload) {
    if (typeof DataStore !== 'undefined') {
        DataStore.datasets.genes.data = payload.genes || [];
        DataStore.datasets.genes.columns = payload.genes.length ? Object.keys(payload.genes[0]) : [];
        DataStore.datasets.genes.isLoaded = true;

        DataStore.datasets.variants.data = payload.variants || [];
        DataStore.datasets.variants.columns = payload.variants.length ? Object.keys(payload.variants[0]) : [];
        DataStore.datasets.variants.isLoaded = true;

        DataStore.datasets.v2g.data = payload.v2g || [];
        DataStore.datasets.v2g.isLoaded = true;

        DataStore.currentTrait = payload.traitName;

        if (DataStore.tableStates) {
            if (DataStore.tableStates.genes) DataStore.tableStates.genes.filteredData = [...DataStore.datasets.genes.data];
            if (DataStore.tableStates.variants) DataStore.tableStates.variants.filteredData = [...DataStore.datasets.variants.data];
        }
    }

    const phenotypeSearch = document.getElementById('phenotype-search');
    if (phenotypeSearch) phenotypeSearch.value = payload.traitName;

    const summaryTraitInput = document.getElementById('summary-trait-input');
    if (summaryTraitInput) {
        summaryTraitInput.value = payload.traitName;
        if (typeof SummaryModule !== 'undefined' && SummaryModule.renderSummary && document.body.dataset.page === 'traits') {
            SummaryModule.renderSummary();
        }
    }

    const folderNameText = document.getElementById('folder-name-text');
    if (folderNameText) {
        folderNameText.textContent = payload.traitName;
        // The text is intentionally not displayed per user feedback
    }

    if (typeof UI !== 'undefined' && UI.buildTabs) {
        UI.buildTabs();
        if (document.body.dataset.page === 'zoom') {
            const zoomTab = AppConfig.tabs.find(t => t.id === 'tab-zoom');
            if (zoomTab) UI.activateTab(zoomTab);
        }
    }
};

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FALCON_LOCAL_DATA_LOAD') {
        window.applyFalconLocalData(event.data.payload);
    }
});

// Check if there is already a global state loaded from a previous tab
const bootGlobalState = getParentFalconGlobalState();
if (bootGlobalState) {
    window.applyFalconLocalData(bootGlobalState);
}
