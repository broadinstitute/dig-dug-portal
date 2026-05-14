import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";

new Vue({
    components: {

    },
    
    mixins: [pankbaseMixin],

    data() {
        return {
            infoPageId: '',
            title: null,
            info: null,
            isLoading: false,
            errorMessage: "",
            searchType: "trait",
            searchTerm: "",
            selectedSearchValue: "",
            searchMatches: null,
            searchResults: null,
            searchHierarchy: null,
            expandedGroups: {},
            activeHierarchyPath: {
                dataset: null,
                cellType: null,
                model: null
            },
            activeDetailPanel: {
                type: null,
                key: null
            },
            browserCanvas: {
                x: 0,
                y: 0,
                scale: 1,
                isDragging: false,
                isAnimating: false,
                startX: 0,
                startY: 0,
                originX: 0,
                originY: 0
            },
            browserCanvasAnimationTimer: null,
            modelFactorDetails: {},
            modelFactorLoading: {},
            factorModalData: null,
            searchDebounceMs: 250,
            searchDebounceTimer: null,
            suppressNextSearchWatch: false,

            // Keep the default context close to the examples we validated while
            // exploring the API. This gives us a reliable baseline for early UI work.
            ligerDefaults: {
                dataset: "scRNA",
                cellType: "Delta",
                model: "mouse_msigdb",
                factor: "Factor4"
            },
            ligerDatasetMetadata: {
                "islet_of_Langerhans_scRNA_v3-3": {
                    datasetName: "2. Single cell expression map of pancreatic islets using data from HPAP, IIDP and Prodo",
                    datasetId: "islet_of_Langerhans_scRNA_v3-3",
                    previous_versions: {
                        v1: "https://doi.org/10.5281/zenodo.15588240"
                    },
                    source: "PanKbase",
                    species: "Human",
                    tissue: "islet of Langerhans",
                    depot: "",
                    depot2: "",
                    method: "scRNAseq",
                    platform: "10x genomics",
                    summary: "This dataset represents the islet of Langerhans tissue from human samples from HPAP, IIDP and Prodo",
                    doi: "https://zenodo.org/records/15596314",
                    pmid: "",
                    contact: "",
                    authors: "Ha T.H. Vu, Han Sun, Seth Sharp, Parul Kudtarkar, Liza Brusman, Julie Jurgens, The PanKbase Consortium, Jason Flannick, Noel Burtt, Shuibing Chen, Jie Liu, Jean-Pilippe Cartailler, Benjamin F. Voight, Michael Lee Stitzel, Marcela Brissova, Anna L. Gloyn, Kyle Gaulton, Stephen C.J. Parker",
                    download: "https://pankbase-data-v1.s3.us-west-2.amazonaws.com/analysis_resources/single_cell_objects/060425_scRNA_v3.3.rds",
                    genMods: "No modifications",
                    otherProperties: [""],
                    development_stage__ontology_label: [],
                    organism_age__group: [],
                    cell_cycle__phase: [],
                    disease__ontology_label: ["Diabetes"],
                    bmi__group: [],
                    library_preparation_protocol__ontology_label: [],
                    organ__ontology_label: ["islets"],
                    race__ontology_label: [""],
                    tissue__ontology_label: ["islet of Langerhans"],
                    species__ontology_label: ["Homo sapiens"],
                    ethnicity__ontology_label: [""],
                    fat__type: [],
                    organism_age__unit__ontology_label: [""],
                    sex: [""],
                    bmi__unit__ontology_label: [""],
                    mouse_strain__ontology_label: [],
                    diet__schedule: [],
                    diet__type: [],
                    totalDonors: 140,
                    totalCells: 448935
                }
            },

            // Centralize endpoint names here so the UI layer can stay focused on
            // user interactions instead of string-building.
            ligerApi: {
                baseUrl: "https://private.hugeampkpnbi.org/api/bio",
                queryEndpoints: {
                    factors: "pankbase-scb-factor",
                    factorGenes: "pankbase-scb-gene-factor",
                    factorTraits: "pankbase-scb-trait-factor",
                    factorGeneSets: "pankbase-scb-gene-set-factor",
                    factorCells: "pankbase-scb-cell-factor",
                    graphEdges: "pankbase-scb-graph-all-edges"
                },
                matchEndpoints: {
                    graphEdges: "pankbase-scb-graph-all-edges"
                }
            },

            // These caches are intentionally simple for now. Once the UI is in place,
            // we can decide whether cache invalidation should be route-based, session-
            // based, or fully reactive to filter changes.
            ligerApiCache: {
                factors: {},
                factorGenes: {},
                factorTraits: {},
                factorGeneSets: {},
                factorCells: {},
                graphTraitMatches: {},
                graphGeneMatches: {},
                graphTraitResults: {},
                graphGeneResults: {}
            }
        }
            
    },

    mounted() {
        this.injectScript("https://cdn.jsdelivr.net/npm/d3@7");
        window.addEventListener("pointermove", this.handleBrowserCanvasPointerMove);
        window.addEventListener("pointerup", this.handleBrowserCanvasPointerUp);
        window.addEventListener("pointercancel", this.handleBrowserCanvasPointerUp);
    },

    beforeDestroy() {
        window.removeEventListener("pointermove", this.handleBrowserCanvasPointerMove);
        window.removeEventListener("pointerup", this.handleBrowserCanvasPointerUp);
        window.removeEventListener("pointercancel", this.handleBrowserCanvasPointerUp);

        if (this.browserCanvasAnimationTimer) {
            clearTimeout(this.browserCanvasAnimationTimer);
            this.browserCanvasAnimationTimer = null;
        }
    },

    async created() {
    },

    watch: {
        searchTerm() {
            this.scheduleMatchLookup();
        }
    },

    computed: {
    },

    methods: {  
        // Generic API helpers -------------------------------------------------
        async getPageInfo(){
            const content = await getTextContent(this.infoPageId, false, true);
            console.log('content', content);
            this.title = content.title;
            this.info = content.body;
        },
        injectScript(scriptPath) {
            // Dynamically create a <script> tag to load library from CDN
            const script = document.createElement("script");
            script.src = scriptPath;
            script.onload = () => {
                //console.log("Library loaded", scriptPath);
            };
            script.onerror = () => {
                //console.error("Error loading library", scriptPath);
            };
            document.head.appendChild(script);
        },
        buildLigerApiUrl(mode, endpoint, queryParts, extraParams = {}) {
            const searchParams = new URLSearchParams();
            searchParams.set("q", queryParts.join(","));

            Object.entries(extraParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    searchParams.set(key, value);
                }
            });

            return `${this.ligerApi.baseUrl}/${mode}/${endpoint}?${searchParams.toString()}`;
        },
        buildLigerCacheKey(queryParts, extraParams = {}) {
            const extraKey = Object.entries(extraParams)
                .filter(([, value]) => value !== undefined && value !== null && value !== "")
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                .map(([key, value]) => `${key}=${value}`)
                .join("::");

            return extraKey ? `${queryParts.join("::")}::${extraKey}` : queryParts.join("::");
        },
        async fetchLigerJson(url) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Liger API request failed: ${response.status} ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                // Leave the logging in place for now. During UI wiring this will make it
                // much easier to separate API failures from rendering bugs.
                console.error("Liger API fetch error:", error);
                throw error;
            }
        },
        async fetchCachedLigerResource(cacheGroup, queryParts, urlBuilder, extraParams = {}) {
            const cacheKey = this.buildLigerCacheKey(queryParts, extraParams);

            if (this.ligerApiCache[cacheGroup][cacheKey]) {
                return this.ligerApiCache[cacheGroup][cacheKey];
            }

            const url = urlBuilder(queryParts, extraParams);
            const payload = await this.fetchLigerJson(url);
            this.$set(this.ligerApiCache[cacheGroup], cacheKey, payload);

            return payload;
        },

        // Query parsing helpers -----------------------------------------------
        buildFactorContext({ dataset, cellType, model, factor }) {
            const context = [dataset, cellType, model];

            if (factor) {
                context.push(factor);
            }

            return context;
        },
        parseGraphFactorValue(factorValue) {
            const [dataset, cellType, model, factor] = (factorValue || "").split(";");

            // The graph search endpoint encodes factor context into one string.
            // Breaking it out once here will keep the UI code much cleaner later.
            return {
                dataset: dataset || null,
                cellType: cellType || null,
                model: model || null,
                factor: factor || null
            };
        },
        normalizeGraphEdges(edges = []) {
            return edges.map((edge) => {
                const factorContext = this.parseGraphFactorValue(edge.n2_value);

                return {
                    ...edge,
                    factorContext
                };
            });
        },
        normalizeFactorRows(rows = []) {
            return rows.map((row) => ({
                ...row,
                top_cells_list: this.splitCommaSeparatedValues(row.top_cells),
                top_gene_sets_list: Array.isArray(row.top_gene_sets) ? row.top_gene_sets : [],
                top_genes_list: Array.isArray(row.top_genes) ? row.top_genes : [],
                top_traits_list: Array.isArray(row.top_traits) ? row.top_traits : []
            }));
        },
        splitCommaSeparatedValues(value) {
            if (!value) return [];
            return value.split(",").map((item) => item.trim()).filter(Boolean);
        },
        buildDetailScoreItems(labels = [], rows = []) {
            return labels.map((label, index) => {
                const row = rows[index] || {};

                return {
                    label,
                    value: row.value ?? null,
                    pValue: row.pValue ?? row.p_value ?? null,
                    beta: row.beta ?? null
                };
            });
        },

        // Factor catalog + detail methods ------------------------------------
        async fetchLigerFactors({ dataset, cellType, model }) {
            const queryParts = this.buildFactorContext({ dataset, cellType, model });
            const payload = await this.fetchCachedLigerResource(
                "factors",
                queryParts,
                (parts) => this.buildLigerApiUrl("query", this.ligerApi.queryEndpoints.factors, parts)
            );

            return {
                ...payload,
                data: this.normalizeFactorRows(payload.data || [])
            };
        },
        async fetchLigerFactorGenes({ dataset, cellType, model, factor, limit }) {
            const queryParts = this.buildFactorContext({ dataset, cellType, model, factor });
            return await this.fetchCachedLigerResource(
                "factorGenes",
                queryParts,
                (parts, extraParams) => this.buildLigerApiUrl("query", this.ligerApi.queryEndpoints.factorGenes, parts, extraParams),
                { limit }
            );
        },
        async fetchLigerFactorTraits({ dataset, cellType, model, factor, limit }) {
            const queryParts = this.buildFactorContext({ dataset, cellType, model, factor });
            return await this.fetchCachedLigerResource(
                "factorTraits",
                queryParts,
                (parts, extraParams) => this.buildLigerApiUrl("query", this.ligerApi.queryEndpoints.factorTraits, parts, extraParams),
                { limit }
            );
        },
        async fetchLigerFactorGeneSets({ dataset, cellType, model, factor, limit }) {
            const queryParts = this.buildFactorContext({ dataset, cellType, model, factor });
            return await this.fetchCachedLigerResource(
                "factorGeneSets",
                queryParts,
                (parts, extraParams) => this.buildLigerApiUrl("query", this.ligerApi.queryEndpoints.factorGeneSets, parts, extraParams),
                { limit }
            );
        },
        async fetchLigerFactorCells({ dataset, cellType, model, factor }) {
            const queryParts = this.buildFactorContext({ dataset, cellType, model, factor });
            return await this.fetchCachedLigerResource(
                "factorCells",
                queryParts,
                (parts) => this.buildLigerApiUrl("query", this.ligerApi.queryEndpoints.factorCells, parts)
            );
        },
        async fetchLigerFactorBundle({ dataset, cellType, model, factor }) {
            // Future UI note: this is the main drill-down bundle the factor detail
            // panel will likely call after a user selects a factor from search results.
            const [traits, geneSets, cells] = await Promise.all([
                this.fetchLigerFactorTraits({ dataset, cellType, model, factor }),
                this.fetchLigerFactorGeneSets({ dataset, cellType, model, factor }),
                this.fetchLigerFactorCells({ dataset, cellType, model, factor })
            ]);

            return {
                traits,
                geneSets,
                cells
            };
        },
        async fetchLigerFactorDetailScores({ dataset, cellType, model, factor, summary }) {
            const topGenes = summary?.top_genes_list || [];
            const topTraits = summary?.top_traits_list || [];
            const topGeneSets = summary?.top_gene_sets_list || [];

            const [genePayload, traitPayload, geneSetPayload] = await Promise.all([
                topGenes.length
                    ? this.fetchLigerFactorGenes({ dataset, cellType, model, factor, limit: topGenes.length })
                    : Promise.resolve({ data: [] }),
                topTraits.length
                    ? this.fetchLigerFactorTraits({ dataset, cellType, model, factor, limit: topTraits.length })
                    : Promise.resolve({ data: [] }),
                topGeneSets.length
                    ? this.fetchLigerFactorGeneSets({ dataset, cellType, model, factor, limit: topGeneSets.length })
                    : Promise.resolve({ data: [] })
            ]);

            return {
                topGenes: this.buildDetailScoreItems(topGenes, genePayload.data || []),
                topTraits: this.buildDetailScoreItems(topTraits, traitPayload.data || []),
                topGeneSets: this.buildDetailScoreItems(topGeneSets, geneSetPayload.data || [])
            };
        },

        // Search + graph methods ---------------------------------------------
        async searchLigerTraitMatches(searchTerm) {
            const queryParts = ["trait", searchTerm];
            return await this.fetchCachedLigerResource(
                "graphTraitMatches",
                queryParts,
                (parts) => this.buildLigerApiUrl("match", this.ligerApi.matchEndpoints.graphEdges, parts)
            );
        },
        async searchLigerGeneMatches(searchTerm) {
            const queryParts = ["gene", searchTerm];
            return await this.fetchCachedLigerResource(
                "graphGeneMatches",
                queryParts,
                (parts) => this.buildLigerApiUrl("match", this.ligerApi.matchEndpoints.graphEdges, parts)
            );
        },
        async fetchLigerTraitGraphResults(trait) {
            const queryParts = ["trait", trait];
            const payload = await this.fetchCachedLigerResource(
                "graphTraitResults",
                queryParts,
                (parts) => this.buildLigerApiUrl("query", this.ligerApi.queryEndpoints.graphEdges, parts)
            );

            return {
                ...payload,
                data: this.normalizeGraphEdges(payload.data || [])
            };
        },
        async fetchLigerGeneGraphResults(gene) {
            const queryParts = ["gene", gene];
            const payload = await this.fetchCachedLigerResource(
                "graphGeneResults",
                queryParts,
                (parts) => this.buildLigerApiUrl("query", this.ligerApi.queryEndpoints.graphEdges, parts)
            );

            return {
                ...payload,
                data: this.normalizeGraphEdges(payload.data || [])
            };
        },
        async fetchLigerSearchResults({ searchType, searchTerm }) {
            if (searchType === "trait") {
                return await this.fetchLigerTraitGraphResults(searchTerm);
            }

            if (searchType === "gene") {
                return await this.fetchLigerGeneGraphResults(searchTerm);
            }

            throw new Error(`Unsupported Liger search type: ${searchType}`);
        },
        async fetchLigerSearchMatches({ searchType, searchTerm }) {
            if (searchType === "trait") {
                return await this.searchLigerTraitMatches(searchTerm);
            }

            if (searchType === "gene") {
                return await this.searchLigerGeneMatches(searchTerm);
            }

            throw new Error(`Unsupported Liger search type: ${searchType}`);
        },

        // Small convenience method for early testing and future mounted hooks.
        // We don't need to call it yet, but it gives us one simple path to
        // validate that the page can talk to the APIs end-to-end.
        async fetchDefaultLigerFactorContext() {
            return await this.fetchLigerFactors({
                dataset: this.ligerDefaults.dataset,
                cellType: this.ligerDefaults.cellType,
                model: this.ligerDefaults.model
            });
        },
        setSearchType(nextSearchType) {
            if (this.searchType === nextSearchType) {
                return;
            }

            this.searchType = nextSearchType;

            // Keep the mode switch explicit instead of relying on a watcher.
            // That makes it much easier to guarantee the next request uses the
            // right mode, especially with debounced search calls in flight.
            this.resetSearchState();
        },
        buildFactorContextKey({ dataset, cellType, model }) {
            return [dataset, cellType, model].join("::");
        },
        buildHierarchyGroupKey(level, parts) {
            return [level, ...parts].join("::");
        },
        groupSearchEdgesByHierarchy(edges = []) {
            const hierarchyMap = new Map();

            edges.forEach((edge) => {
                const { dataset, cellType, model, factor } = edge.factorContext || {};

                if (!dataset || !cellType || !model || !factor) {
                    return;
                }

                if (!hierarchyMap.has(dataset)) {
                    hierarchyMap.set(dataset, new Map());
                }

                const datasetMap = hierarchyMap.get(dataset);

                if (!datasetMap.has(cellType)) {
                    datasetMap.set(cellType, new Map());
                }

                const cellTypeMap = datasetMap.get(cellType);

                if (!cellTypeMap.has(model)) {
                    cellTypeMap.set(model, []);
                }

                cellTypeMap.get(model).push({
                    factor: factor,
                    score: edge.value,
                    scoreField: edge.value_field,
                    edge
                });
            });

            return Array.from(hierarchyMap.entries()).map(([dataset, cellTypesMap]) => ({
                dataset,
                cellTypes: Array.from(cellTypesMap.entries()).map(([cellType, modelsMap]) => ({
                    cellType,
                    models: Array.from(modelsMap.entries()).map(([model, factors]) => ({
                        model,
                        factors
                    }))
                }))
            }));
        },
        buildSearchHierarchy(searchPayload) {
            return this.groupSearchEdgesByHierarchy(searchPayload?.data || []);
        },
        isHierarchyItemActive(level, value, context = {}) {
            if (level === "searchRoot") {
                return Boolean(this.getSearchRootDisplayValue());
            }

            if (level === "dataset") {
                return this.activeHierarchyPath.dataset === value;
            }

            if (level === "cellType") {
                return this.activeHierarchyPath.dataset === context.dataset
                    && this.activeHierarchyPath.cellType === value;
            }

            if (level === "model") {
                return this.activeHierarchyPath.dataset === context.dataset
                    && this.activeHierarchyPath.cellType === context.cellType
                    && this.activeHierarchyPath.model === value;
            }

            return false;
        },
        setActiveDetailPanel(type, key) {
            this.activeDetailPanel = {
                type,
                key
            };
        },
        async selectHierarchyItem(level, context = {}) {
            if (level === "searchRoot") {
                this.setActiveDetailPanel("searchRoot", `${this.searchType}::${this.selectedSearchValue || this.searchTerm}`);
                this.fitAndCenterBrowserCanvas();
                return;
            }

            if (level === "dataset") {
                this.activeHierarchyPath = {
                    dataset: context.dataset || null,
                    cellType: null,
                    model: null
                };
                this.setActiveDetailPanel("dataset", context.dataset || null);
                this.fitAndCenterBrowserCanvas();
                return;
            }

            if (level === "cellType") {
                this.activeHierarchyPath = {
                    dataset: context.dataset || null,
                    cellType: context.cellType || null,
                    model: null
                };
                this.setActiveDetailPanel("cellType", [context.dataset, context.cellType].join("::"));
                this.fitAndCenterBrowserCanvas();
                return;
            }

            if (level === "model") {
                this.activeHierarchyPath = {
                    dataset: context.dataset || null,
                    cellType: context.cellType || null,
                    model: context.model || null
                };
                this.setActiveDetailPanel("model", [context.dataset, context.cellType, context.model].join("::"));
                this.fitAndCenterBrowserCanvas();
                await this.ensureModelFactorDetails(context.dataset, context.cellType, context.model);
                this.fitAndCenterBrowserCanvas();
            }
        },
        getSearchRootDisplayValue() {
            return this.selectedSearchValue || this.searchTerm || "";
        },
        resolveDatasetMetadataId(dataset) {
            if (dataset === "scRNA") {
                return "islet_of_Langerhans_scRNA_v3-3";
            }

            return dataset;
        },
        getDatasetMetadata(dataset) {
            return this.ligerDatasetMetadata[this.resolveDatasetMetadataId(dataset)] || null;
        },
        getDatasetDisplayLabel(dataset) {
            return this.getDatasetMetadata(dataset)?.tissue || dataset;
        },
        getDatasetDisplaySubLabel(dataset) {
            return dataset;
        },
        getVisibleDetailPanels() {
            const panels = [];
            const searchValue = this.getSearchRootDisplayValue();

            if (searchValue) {
                panels.push({
                    type: "searchRoot",
                    key: `${this.searchType}::${searchValue}`,
                    badgeClass: "is-search",
                    badgeLabel: this.searchType === "gene" ? "Gene" : "Trait",
                    value: searchValue,
                    placeholder: `${this.searchType === "gene" ? "Gene" : "Trait"} detail placeholder`
                });
            }

            if (this.activeHierarchyPath.dataset) {
                const datasetMetadata = this.getDatasetMetadata(this.activeHierarchyPath.dataset);
                panels.push({
                    type: "dataset",
                    key: this.activeHierarchyPath.dataset,
                    badgeClass: "is-dataset",
                    badgeLabel: "Tissue",
                    value: this.getDatasetDisplayLabel(this.activeHierarchyPath.dataset),
                    placeholder: "Dataset detail placeholder",
                    metadata: datasetMetadata
                });
            }

            if (this.activeHierarchyPath.cellType) {
                panels.push({
                    type: "cellType",
                    key: [this.activeHierarchyPath.dataset, this.activeHierarchyPath.cellType].join("::"),
                    badgeClass: "is-cell-type",
                    badgeLabel: "Cell Type",
                    value: this.activeHierarchyPath.cellType,
                    placeholder: "Cell type detail placeholder"
                });
            }

            if (this.activeHierarchyPath.model) {
                panels.push({
                    type: "model",
                    key: [this.activeHierarchyPath.dataset, this.activeHierarchyPath.cellType, this.activeHierarchyPath.model].join("::"),
                    badgeClass: "is-model",
                    badgeLabel: "Model",
                    value: this.activeHierarchyPath.model,
                    placeholder: "Model detail placeholder"
                });
            }

            if (this.factorModalData) {
                panels.push({
                    type: "geneProgram",
                    key: this.factorModalData.factorContextKey,
                    badgeClass: "is-factor",
                    badgeLabel: "Gene Program",
                    value: this.factorModalData.summary?.label || this.factorModalData.factor
                });
            }

            return panels;
        },
        isDetailPanelActive(panel) {
            return this.activeDetailPanel.type === panel.type && this.activeDetailPanel.key === panel.key;
        },
        getActiveDatasetGroup() {
            return (this.searchHierarchy || []).find(
                (datasetGroup) => datasetGroup.dataset === this.activeHierarchyPath.dataset
            ) || null;
        },
        getActiveCellTypeGroup() {
            const datasetGroup = this.getActiveDatasetGroup();

            if (!datasetGroup) {
                return null;
            }

            return (datasetGroup.cellTypes || []).find(
                (cellTypeGroup) => cellTypeGroup.cellType === this.activeHierarchyPath.cellType
            ) || null;
        },
        getActiveModelGroup() {
            const cellTypeGroup = this.getActiveCellTypeGroup();

            if (!cellTypeGroup) {
                return null;
            }

            return (cellTypeGroup.models || []).find(
                (modelGroup) => modelGroup.model === this.activeHierarchyPath.model
            ) || null;
        },
        getBrowserViewportElement() {
            return this.$el?.querySelector(".liger-browser-viewport") || null;
        },
        getBrowserContentElement() {
            return this.$el?.querySelector(".liger-browser-content") || null;
        },
        setBrowserCanvasAnimationState(isAnimating) {
            if (this.browserCanvasAnimationTimer) {
                clearTimeout(this.browserCanvasAnimationTimer);
                this.browserCanvasAnimationTimer = null;
            }

            this.browserCanvas = {
                ...this.browserCanvas,
                isAnimating
            };

            if (isAnimating) {
                this.browserCanvasAnimationTimer = setTimeout(() => {
                    this.browserCanvas = {
                        ...this.browserCanvas,
                        isAnimating: false
                    };
                    this.browserCanvasAnimationTimer = null;
                }, 220);
            }
        },
        animateBrowserCanvasTo({ x, y, scale = this.browserCanvas.scale }) {
            this.setBrowserCanvasAnimationState(true);
            this.browserCanvas = {
                ...this.browserCanvas,
                x,
                y,
                scale,
                isDragging: false,
                isAnimating: true
            };
        },
        isEventOverBrowserColumn(event) {
            return Boolean(event.target?.closest(".liger-browser-column"));
        },
        startBrowserCanvasPan(event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            if (this.isEventOverBrowserColumn(event)) {
                return;
            }

            this.setBrowserCanvasAnimationState(false);
            this.browserCanvas = {
                ...this.browserCanvas,
                isDragging: true,
                startX: event.clientX,
                startY: event.clientY,
                originX: this.browserCanvas.x,
                originY: this.browserCanvas.y
            };
        },
        handleBrowserCanvasPointerMove(event) {
            if (!this.browserCanvas.isDragging) {
                return;
            }

            this.browserCanvas = {
                ...this.browserCanvas,
                x: this.browserCanvas.originX + (event.clientX - this.browserCanvas.startX),
                y: this.browserCanvas.originY + (event.clientY - this.browserCanvas.startY)
            };
        },
        canScrollBrowserList(listElement, deltaY) {
            if (!listElement || listElement.scrollHeight <= listElement.clientHeight) {
                return false;
            }

            if (deltaY < 0) {
                return listElement.scrollTop > 0;
            }

            if (deltaY > 0) {
                return listElement.scrollTop + listElement.clientHeight < listElement.scrollHeight;
            }

            return false;
        },
        normalizeWheelDelta(deltaY) {
            const limitedDelta = Math.max(-120, Math.min(120, deltaY));
            return limitedDelta / 120;
        },
        handleBrowserCanvasWheel(event) {
            if (this.isEventOverBrowserColumn(event)) {
                return;
            }

            const scrollableList = event.target?.closest(".liger-browser-list");

            if (scrollableList && this.canScrollBrowserList(scrollableList, event.deltaY)) {
                return;
            }

            const viewportElement = this.getBrowserViewportElement();
            const contentElement = this.getBrowserContentElement();

            if (!viewportElement || !contentElement) {
                return;
            }

            event.preventDefault();

            const normalizedDelta = this.normalizeWheelDelta(event.deltaY);
            const zoomMultiplier = 1 - (normalizedDelta * 0.045);
            const nextScale = Math.min(2.25, Math.max(0.55, this.browserCanvas.scale * zoomMultiplier));

            if (nextScale === this.browserCanvas.scale) {
                return;
            }

            const viewportRect = viewportElement.getBoundingClientRect();
            const pointerX = event.clientX - viewportRect.left;
            const pointerY = event.clientY - viewportRect.top;
            const contentX = (pointerX - this.browserCanvas.x) / this.browserCanvas.scale;
            const contentY = (pointerY - this.browserCanvas.y) / this.browserCanvas.scale;

            this.browserCanvas = {
                ...this.browserCanvas,
                scale: nextScale,
                x: pointerX - (contentX * nextScale),
                y: pointerY - (contentY * nextScale),
                isAnimating: false
            };
        },
        handleBrowserCanvasPointerUp() {
            if (!this.browserCanvas.isDragging) {
                return;
            }

            this.browserCanvas = {
                ...this.browserCanvas,
                isDragging: false
            };
        },
        fitAndCenterBrowserCanvas() {
            this.$nextTick(() => {
                const viewportElement = this.getBrowserViewportElement();
                const contentElement = this.getBrowserContentElement();

                if (!viewportElement || !contentElement) {
                    return;
                }

                const contentWidth = contentElement.offsetWidth;
                const contentHeight = contentElement.offsetHeight;

                if (!contentWidth || !contentHeight) {
                    return;
                }

                const padding = 40;
                const availableWidth = Math.max(viewportElement.clientWidth - padding, 1);
                const availableHeight = Math.max(viewportElement.clientHeight - padding, 1);
                const fittedScale = Math.min(1.15, availableWidth / contentWidth, availableHeight / contentHeight);

                this.animateBrowserCanvasTo({
                    x: (viewportElement.clientWidth - (contentWidth * fittedScale)) / 2,
                    y: (viewportElement.clientHeight - (contentHeight * fittedScale)) / 2,
                    scale: fittedScale
                });
            });
        },
        isGroupExpanded(groupKey) {
            return Boolean(this.expandedGroups[groupKey]);
        },
        async toggleGroup(groupKey, loader = null) {
            const nextExpandedState = !this.isGroupExpanded(groupKey);
            this.$set(this.expandedGroups, groupKey, nextExpandedState);

            if (nextExpandedState && loader) {
                await loader();
            }
        },
        getModelFactorDetails(dataset, cellType, model) {
            const factorContextKey = this.buildFactorContextKey({ dataset, cellType, model });
            return this.modelFactorDetails[factorContextKey] || {};
        },
        getFactorSummary(dataset, cellType, model, factor) {
            return this.getModelFactorDetails(dataset, cellType, model)[factor] || null;
        },
        isModelFactorLoading(dataset, cellType, model) {
            const factorContextKey = this.buildFactorContextKey({ dataset, cellType, model });
            return Boolean(this.modelFactorLoading[factorContextKey]);
        },
        async ensureModelFactorDetails(dataset, cellType, model) {
            const factorContextKey = this.buildFactorContextKey({ dataset, cellType, model });

            if (this.modelFactorDetails[factorContextKey]) {
                return this.modelFactorDetails[factorContextKey];
            }

            if (this.modelFactorLoading[factorContextKey]) {
                return this.modelFactorDetails[factorContextKey] || {};
            }

            try {
                this.$set(this.modelFactorLoading, factorContextKey, true);

                // Progressive loading note: only fetch factor summaries once the
                // user opens a specific model branch. That keeps the first result
                // render lightweight even when a query hits many contexts.
                const factorPayload = await this.fetchLigerFactors({ dataset, cellType, model });
                const factorMap = (factorPayload.data || []).reduce((lookup, factorRow) => {
                    lookup[factorRow.factor] = factorRow;
                    return lookup;
                }, {});

                this.$set(this.modelFactorDetails, factorContextKey, factorMap);
                return factorMap;
            } finally {
                this.$set(this.modelFactorLoading, factorContextKey, false);
            }
        },
        resetSearchState() {
            this.searchTerm = "";
            this.selectedSearchValue = "";
            this.searchMatches = null;
            this.searchResults = null;
            this.searchHierarchy = null;
            this.expandedGroups = {};
            this.activeHierarchyPath = {
                dataset: null,
                cellType: null,
                model: null
            };
            this.activeDetailPanel = {
                type: null,
                key: null
            };
            this.browserCanvas = {
                ...this.browserCanvas,
                x: 0,
                y: 0,
                scale: 1,
                isDragging: false,
                isAnimating: false
            };
            this.modelFactorDetails = {};
            this.modelFactorLoading = {};
            this.factorModalData = null;
            this.errorMessage = "";

            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
                this.searchDebounceTimer = null;
            }
        },
        scheduleMatchLookup() {
            if (this.suppressNextSearchWatch) {
                this.suppressNextSearchWatch = false;
                return;
            }

            const normalizedSearchTerm = (this.searchTerm || "").trim();
            const searchType = this.searchType;
            this.selectedSearchValue = "";
            this.errorMessage = "";

            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
                this.searchDebounceTimer = null;
            }

            if (!normalizedSearchTerm) {
                this.searchMatches = null;
                this.searchResults = null;
                this.searchHierarchy = null;
                this.expandedGroups = {};
                this.activeHierarchyPath = {
                    dataset: null,
                    cellType: null,
                    model: null
                };
                this.activeDetailPanel = {
                    type: null,
                    key: null
                };
                this.browserCanvas = {
                    ...this.browserCanvas,
                    x: 0,
                    y: 0,
                    scale: 1,
                    isDragging: false,
                    isAnimating: false
                };
                this.factorModalData = null;
                this.isLoading = false;
                return;
            }

            // Debouncing keeps the UI responsive and prevents firing a network
            // request on every individual keystroke.
            this.searchDebounceTimer = setTimeout(() => {
                this.runSearchMatchLookup({
                    searchType,
                    searchTerm: normalizedSearchTerm
                });
            }, this.searchDebounceMs);
        },
        async runSearchMatchLookup({ searchType = this.searchType, searchTerm = this.searchTerm } = {}) {
            const normalizedSearchTerm = (searchTerm || "").trim();

            if (!normalizedSearchTerm) {
                this.searchMatches = null;
                return;
            }

            this.isLoading = true;
            this.errorMessage = "";

            try {
                // Keep matches separate from exact results. The UI will likely
                // evolve into a typeahead later, and having distinct state now
                // will make that transition simpler.
                this.searchMatches = await this.fetchLigerSearchMatches({
                    searchType,
                    searchTerm: normalizedSearchTerm
                });
            } catch (error) {
                this.errorMessage = error.message || "Unable to load search matches.";
            } finally {
                this.isLoading = false;
            }
        },
        async runExactSearch({ searchType = this.searchType, searchTerm = this.searchTerm } = {}) {
            const normalizedSearchTerm = (searchTerm || "").trim();

            if (!normalizedSearchTerm) {
                this.searchResults = null;
                this.searchHierarchy = null;
                this.expandedGroups = {};
                this.activeHierarchyPath = {
                    dataset: null,
                    cellType: null,
                    model: null
                };
                this.activeDetailPanel = {
                    type: null,
                    key: null
                };
                this.browserCanvas = {
                    ...this.browserCanvas,
                    x: 0,
                    y: 0,
                    scale: 1,
                    isDragging: false,
                    isAnimating: false
                };
                this.factorModalData = null;
                this.errorMessage = "Enter a trait or gene search term first.";
                return;
            }

            this.isLoading = true;
            this.errorMessage = "";

            try {
                // This exact-search payload is the backbone for the results UI.
                // We enrich it right away so the template can stay purely presentational.
                this.searchResults = await this.fetchLigerSearchResults({
                    searchType,
                    searchTerm: normalizedSearchTerm
                });
                this.searchHierarchy = this.buildSearchHierarchy(this.searchResults);
                this.expandedGroups = {};
                this.activeHierarchyPath = {
                    dataset: null,
                    cellType: null,
                    model: null
                };
                this.activeDetailPanel = {
                    type: "searchRoot",
                    key: `${searchType}::${normalizedSearchTerm}`
                };
                this.browserCanvas = {
                    ...this.browserCanvas,
                    x: 0,
                    y: 0,
                    scale: 1,
                    isDragging: false,
                    isAnimating: false
                };
                this.modelFactorDetails = {};
                this.modelFactorLoading = {};
                this.factorModalData = null;
                this.fitAndCenterBrowserCanvas();
            } catch (error) {
                this.errorMessage = error.message || "Unable to load exact search results.";
            } finally {
                this.isLoading = false;
            }
        },
        async selectSearchMatch(matchValue) {
            const searchType = this.searchType;
            this.suppressNextSearchWatch = true;
            this.searchTerm = matchValue;
            this.selectedSearchValue = matchValue;
            this.searchMatches = null;
            await this.runExactSearch({
                searchType,
                searchTerm: matchValue
            });
        },
        async openFactorModal({ dataset, cellType, model, factor, score, scoreField }) {
            const summary = this.getFactorSummary(dataset, cellType, model, factor);
            const factorContextKey = [dataset, cellType, model, factor].join("::");

            this.factorModalData = {
                dataset,
                cellType,
                model,
                factor,
                score,
                scoreField,
                summary,
                factorContextKey,
                detailLoading: true,
                detailScores: {
                    topGenes: this.buildDetailScoreItems(summary?.top_genes_list || [], []),
                    topTraits: this.buildDetailScoreItems(summary?.top_traits_list || [], []),
                    topGeneSets: this.buildDetailScoreItems(summary?.top_gene_sets_list || [], [])
                }
            };
            this.setActiveDetailPanel("geneProgram", factorContextKey);

            try {
                const detailScores = await this.fetchLigerFactorDetailScores({
                    dataset,
                    cellType,
                    model,
                    factor,
                    summary
                });

                if (this.factorModalData?.factorContextKey !== factorContextKey) {
                    return;
                }

                this.factorModalData = {
                    ...this.factorModalData,
                    detailLoading: false,
                    detailScores
                };
            } catch (error) {
                if (this.factorModalData?.factorContextKey !== factorContextKey) {
                    return;
                }

                this.factorModalData = {
                    ...this.factorModalData,
                    detailLoading: false
                };
            }
        },
        closeFactorModal() {
            this.factorModalData = null;
            if (this.activeHierarchyPath.model) {
                this.setActiveDetailPanel(
                    "model",
                    [this.activeHierarchyPath.dataset, this.activeHierarchyPath.cellType, this.activeHierarchyPath.model].join("::")
                );
            }
        },

    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
