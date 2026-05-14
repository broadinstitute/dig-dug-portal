import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import { createLigerApiCache, ligerApiConfig, ligerDefaults } from "./ligerConfig";
import {
    buildDetailScoreItems,
    buildFactorContext,
    fetchLigerDatasetMetadata,
    fetchLigerFactorDetailScores,
    fetchLigerFactors,
    fetchLigerSearchMatches,
    fetchLigerSearchResults
} from "./ligerApi";
import {
    buildFactorContextKey,
    buildSearchHierarchy,
    buildSharedProgramGroups,
    buildVisibleDetailPanels,
    getActiveCellTypeGroup,
    getActiveDatasetGroup,
    getActiveModelGroup,
    getAllHierarchyModelContexts,
    getDatasetDisplayLabel,
    getDatasetDisplaySubLabel,
    getDatasetMetadata,
    getSearchRootDisplayValue,
    isHierarchyItemActive,
    isSharedSearchRootActive
} from "./ligerHierarchy";
import {
    createClearedResultsState,
    createInitialBrowserCanvas,
    createInitialDetailPanel,
    createInitialHierarchyPath,
    createSearchResetState
} from "./ligerState";

new Vue({
    mixins: [pankbaseMixin],

    data() {
        return {
            infoPageId: '',
            title: null,
            info: null,
            isLoading: false,
            errorMessage: "",
            searchType: "trait",
            browserMode: "hierarchy",
            searchTerm: "",
            selectedSearchValue: "",
            searchMatches: null,
            searchResults: null,
            searchHierarchy: null,
            expandedGroups: {},
            activeHierarchyPath: createInitialHierarchyPath(),
            activeDetailPanel: createInitialDetailPanel(),
            sharedProgramVisibility: "shared",
            activeSharedProgramKey: null,
            activeSharedProgramContextKey: null,
            sharedProgramsLoading: false,
            browserCanvas: createInitialBrowserCanvas(),
            browserCanvasAnimationTimer: null,
            modelFactorDetails: {},
            modelFactorLoading: {},
            factorModalData: null,
            searchDebounceMs: 250,
            searchDebounceTimer: null,
            suppressNextSearchWatch: false,
            canvasSectionApi: null,
            detailsSectionApi: null,

            ligerDefaults,
            ligerDatasetMetadata: {},
            ligerApi: ligerApiConfig,
            ligerApiCache: createLigerApiCache()
        }
            
    },

    mounted() {
        this.injectScript("https://cdn.jsdelivr.net/npm/d3@7");
    },

    beforeDestroy() {
        if (this.browserCanvasAnimationTimer) {
            clearTimeout(this.browserCanvasAnimationTimer);
            this.browserCanvasAnimationTimer = null;
        }
    },

    async created() {
        this.ensureDatasetMetadataLoaded();
    },

    watch: {
        searchTerm() {
            this.scheduleMatchLookup();
        }
    },

    computed: {
        sharedProgramGroups() {
            return buildSharedProgramGroups(this.searchHierarchy || [], {
                getFactorSummary: (...args) => this.getFactorSummary(...args),
                getDatasetDisplayLabel: (...args) => this.getDatasetDisplayLabel(...args),
                getDatasetDisplaySubLabel: (...args) => this.getDatasetDisplaySubLabel(...args)
            }, {
                includeSingletonPrograms: this.sharedProgramVisibility === "all"
            });
        },
        activeSharedProgramGroup() {
            return this.sharedProgramGroups.find(
                (group) => group.key === this.activeSharedProgramKey
            ) || null;
        }
    },

    methods: {  
        // Generic API helpers -------------------------------------------------
        async getPageInfo(){
            const content = await getPankbaseContent(this.infoPageId, false, true);
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
        buildFactorContext({ dataset, cellType, model, factor }) {
            return buildFactorContext({ dataset, cellType, model, factor });
        },
        buildDetailScoreItems(labels = [], rows = []) {
            return buildDetailScoreItems(labels, rows);
        },
        async fetchLigerFactors({ dataset, cellType, model }) {
            return await fetchLigerFactors({
                apiConfig: this.ligerApi,
                apiCache: this.ligerApiCache,
                dataset,
                cellType,
                model
            });
        },
        async fetchLigerDatasetMetadata() {
            return await fetchLigerDatasetMetadata({
                apiConfig: this.ligerApi,
                apiCache: this.ligerApiCache
            });
        },
        async fetchLigerFactorDetailScores({ dataset, cellType, model, factor, summary }) {
            return await fetchLigerFactorDetailScores({
                apiConfig: this.ligerApi,
                apiCache: this.ligerApiCache,
                dataset,
                cellType,
                model,
                factor,
                summary
            });
        },
        async fetchLigerSearchResults({ searchType, searchTerm }) {
            return await fetchLigerSearchResults({
                apiConfig: this.ligerApi,
                apiCache: this.ligerApiCache,
                searchType,
                searchTerm
            });
        },
        async fetchLigerSearchMatches({ searchType, searchTerm }) {
            return await fetchLigerSearchMatches({
                apiConfig: this.ligerApi,
                apiCache: this.ligerApiCache,
                searchType,
                searchTerm
            });
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
        async ensureDatasetMetadataLoaded() {
            if (Object.keys(this.ligerDatasetMetadata || {}).length) {
                return this.ligerDatasetMetadata;
            }

            try {
                const datasetMetadata = await this.fetchLigerDatasetMetadata();
                this.ligerDatasetMetadata = datasetMetadata || {};
            } catch (error) {
                console.error("Unable to load Liger dataset metadata:", error);
                this.ligerDatasetMetadata = {};
            }

            return this.ligerDatasetMetadata;
        },
        registerCanvasSectionApi(api) {
            this.canvasSectionApi = api;
        },
        registerDetailsSectionApi(api) {
            this.detailsSectionApi = api;
        },
        clearBrowserCanvasAnimationTimer() {
            if (this.browserCanvasAnimationTimer) {
                clearTimeout(this.browserCanvasAnimationTimer);
                this.browserCanvasAnimationTimer = null;
            }
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
        async setBrowserMode(nextBrowserMode) {
            if (this.browserMode === nextBrowserMode) {
                return;
            }

            const selectedSharedContext = this.activeSharedProgramContextKey
                ? this.activeSharedProgramGroup?.contexts.find(
                    (context) => context.key === this.activeSharedProgramContextKey
                ) || null
                : null;

            this.browserMode = nextBrowserMode;
            this.factorModalData = null;
            this.activeDetailPanel = createInitialDetailPanel();

            if (nextBrowserMode === "sharedPrograms") {
                this.activeHierarchyPath = createInitialHierarchyPath();
                await this.ensureSharedProgramModeReady();

                if (this.sharedProgramGroups.length) {
                    this.activeSharedProgramKey = this.sharedProgramGroups[0].key;
                    this.setActiveDetailPanel("searchRoot", `${this.searchType}::${this.getSearchRootDisplayValue()}`);
                }
            } else {
                if (selectedSharedContext) {
                    this.activeHierarchyPath = {
                        dataset: selectedSharedContext.dataset,
                        cellType: selectedSharedContext.cellType,
                        model: selectedSharedContext.model
                    };
                    await this.ensureModelFactorDetails(
                        selectedSharedContext.dataset,
                        selectedSharedContext.cellType,
                        selectedSharedContext.model
                    );
                    const openFactorModalPromise = this.openFactorModal({
                        dataset: selectedSharedContext.dataset,
                        cellType: selectedSharedContext.cellType,
                        model: selectedSharedContext.model,
                        factor: selectedSharedContext.factor,
                        score: selectedSharedContext.score,
                        scoreField: selectedSharedContext.scoreField
                    });
                    this.fitAndCenterBrowserCanvas();
                    await openFactorModalPromise;
                } else {
                    this.activeHierarchyPath = createInitialHierarchyPath();
                    this.setActiveDetailPanel("searchRoot", `${this.searchType}::${this.getSearchRootDisplayValue()}`);
                }

                this.activeSharedProgramKey = null;
                this.activeSharedProgramContextKey = null;
            }

            this.fitAndCenterBrowserCanvas();
        },
        buildFactorContextKey({ dataset, cellType, model }) {
            return buildFactorContextKey({ dataset, cellType, model });
        },
        buildSearchHierarchy(searchPayload) {
            return buildSearchHierarchy(searchPayload);
        },
        isHierarchyItemActive(level, value, context = {}) {
            return isHierarchyItemActive(this, level, value, context);
        },
        setActiveDetailPanel(type, key) {
            this.activeDetailPanel = {
                type,
                key
            };
        },
        async selectHierarchyItem(level, context = {}) {
            if (level === "searchRoot") {
                this.factorModalData = null;
                this.activeSharedProgramContextKey = null;
                this.setActiveDetailPanel("searchRoot", `${this.searchType}::${this.selectedSearchValue || this.searchTerm}`);
                this.fitAndCenterBrowserCanvas();
                return;
            }

            if (level === "dataset") {
                this.factorModalData = null;
                this.activeSharedProgramContextKey = null;
                this.activeHierarchyPath = createInitialHierarchyPath();
                this.activeHierarchyPath.dataset = context.dataset || null;
                this.setActiveDetailPanel("dataset", context.dataset || null);
                this.fitAndCenterBrowserCanvas();
                return;
            }

            if (level === "cellType") {
                this.factorModalData = null;
                this.activeSharedProgramContextKey = null;
                this.activeHierarchyPath = createInitialHierarchyPath();
                this.activeHierarchyPath.dataset = context.dataset || null;
                this.activeHierarchyPath.cellType = context.cellType || null;
                this.setActiveDetailPanel("cellType", [context.dataset, context.cellType].join("::"));
                this.fitAndCenterBrowserCanvas();
                return;
            }

            if (level === "model") {
                this.factorModalData = null;
                this.activeSharedProgramContextKey = null;
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
            return getSearchRootDisplayValue(this);
        },
        getDatasetMetadata(dataset) {
            return getDatasetMetadata(this.ligerDatasetMetadata, dataset);
        },
        getDatasetDisplayLabel(dataset) {
            return getDatasetDisplayLabel(this.ligerDatasetMetadata, dataset);
        },
        getDatasetDisplaySubLabel(dataset) {
            return getDatasetDisplaySubLabel(dataset);
        },
        getVisibleDetailPanels() {
            return buildVisibleDetailPanels({
                searchType: this.searchType,
                browserMode: this.browserMode,
                activeSharedProgramContextKey: this.activeSharedProgramContextKey,
                activeHierarchyPath: this.activeHierarchyPath,
                factorModalData: this.factorModalData,
                ligerDatasetMetadata: this.ligerDatasetMetadata,
                selectedSearchValue: this.selectedSearchValue,
                searchTerm: this.searchTerm
            });
        },
        isDetailPanelActive(panel) {
            return this.activeDetailPanel.type === panel.type && this.activeDetailPanel.key === panel.key;
        },
        isSharedSearchRootActive() {
            return isSharedSearchRootActive(this);
        },
        getActiveDatasetGroup() {
            return getActiveDatasetGroup(this.searchHierarchy || [], this.activeHierarchyPath);
        },
        getActiveCellTypeGroup() {
            return getActiveCellTypeGroup(this.searchHierarchy || [], this.activeHierarchyPath);
        },
        getActiveModelGroup() {
            return getActiveModelGroup(this.searchHierarchy || [], this.activeHierarchyPath);
        },
        getAllHierarchyModelContexts() {
            return getAllHierarchyModelContexts(this.searchHierarchy || []);
        },
        async ensureSharedProgramModeReady() {
            const modelContexts = this.getAllHierarchyModelContexts();

            if (!modelContexts.length) {
                return;
            }

            this.sharedProgramsLoading = true;

            try {
                await Promise.all(
                    modelContexts.map((context) => this.ensureModelFactorDetails(
                        context.dataset,
                        context.cellType,
                        context.model
                    ))
                );
            } finally {
                this.sharedProgramsLoading = false;
            }
        },
        isSharedProgramGroupActive(groupKey) {
            return this.activeSharedProgramKey === groupKey;
        },
        isSharedProgramContextActive(contextKey) {
            return this.activeSharedProgramContextKey === contextKey;
        },
        setSharedProgramVisibility(nextVisibility) {
            if (this.sharedProgramVisibility === nextVisibility) {
                return;
            }

            this.sharedProgramVisibility = nextVisibility;
            this.ensureActiveSharedProgramSelection();
            this.fitAndCenterBrowserCanvas();
        },
        ensureActiveSharedProgramSelection() {
            if (!this.sharedProgramGroups.length) {
                this.activeSharedProgramKey = null;
                this.activeSharedProgramContextKey = null;
                this.factorModalData = null;
                this.setActiveDetailPanel("searchRoot", `${this.searchType}::${this.getSearchRootDisplayValue()}`);
                return;
            }

            const activeGroupExists = this.sharedProgramGroups.some(
                (group) => group.key === this.activeSharedProgramKey
            );

            if (!activeGroupExists) {
                this.activeSharedProgramKey = this.sharedProgramGroups[0].key;
                this.activeSharedProgramContextKey = null;
                this.factorModalData = null;
                this.setActiveDetailPanel("searchRoot", `${this.searchType}::${this.getSearchRootDisplayValue()}`);
                return;
            }

            const activeGroup = this.activeSharedProgramGroup;

            if (!activeGroup?.contexts.some((context) => context.key === this.activeSharedProgramContextKey)) {
                this.activeSharedProgramContextKey = null;
            }
        },
        selectSharedProgramGroup(groupKey) {
            this.activeSharedProgramKey = groupKey;
            this.activeSharedProgramContextKey = null;
            this.activeHierarchyPath = createInitialHierarchyPath();
            this.factorModalData = null;
            this.setActiveDetailPanel("searchRoot", `${this.searchType}::${this.getSearchRootDisplayValue()}`);
            this.fitAndCenterBrowserCanvas();
        },
        async openSharedProgramContext(context) {
            this.activeSharedProgramKey = this.activeSharedProgramKey || context.label || context.factor;
            this.activeSharedProgramContextKey = context.key;
            this.activeHierarchyPath = {
                dataset: context.dataset,
                cellType: context.cellType,
                model: context.model
            };

            await this.ensureModelFactorDetails(context.dataset, context.cellType, context.model);
            await this.openFactorModal({
                dataset: context.dataset,
                cellType: context.cellType,
                model: context.model,
                factor: context.factor,
                score: context.score,
                scoreField: context.scoreField
            });
            this.fitAndCenterBrowserCanvas();
        },
        fitAndCenterBrowserCanvas() {
            this.canvasSectionApi?.fitAndCenterBrowserCanvas?.();
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
            this.clearBrowserCanvasAnimationTimer();
            Object.assign(this, createSearchResetState());

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
                this.clearBrowserCanvasAnimationTimer();
                Object.assign(this, createClearedResultsState());
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
                this.clearBrowserCanvasAnimationTimer();
                Object.assign(this, createClearedResultsState());
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
                this.clearBrowserCanvasAnimationTimer();
                this.searchHierarchy = this.buildSearchHierarchy(this.searchResults);
                this.expandedGroups = {};
                this.activeHierarchyPath = createInitialHierarchyPath();
                this.activeDetailPanel = createInitialDetailPanel("searchRoot", `${searchType}::${normalizedSearchTerm}`);
                this.activeSharedProgramKey = null;
                this.activeSharedProgramContextKey = null;
                this.sharedProgramsLoading = false;
                this.browserCanvas = createInitialBrowserCanvas();
                this.modelFactorDetails = {};
                this.modelFactorLoading = {};
                this.factorModalData = null;

                if (this.browserMode === "sharedPrograms") {
                    await this.ensureSharedProgramModeReady();

                    this.ensureActiveSharedProgramSelection();
                }

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
            return await this.detailsSectionApi?.openFactorModal?.({ dataset, cellType, model, factor, score, scoreField });
        },
        closeFactorModal() {
            this.detailsSectionApi?.closeFactorModal?.();
        },

    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
