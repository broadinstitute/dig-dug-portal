// This file owns reusable Liger view state factories so resets stay
// consistent and the page logic does not have to repeat large object literals.

export function createInitialHierarchyPath() {
    return {
        dataset: null,
        cellType: null,
        model: null
    };
}

export function createInitialDetailPanel(type = null, key = null) {
    return {
        type,
        key
    };
}

export function createInitialBrowserCanvas(overrides = {}) {
    return {
        x: 0,
        y: 0,
        scale: 1,
        isDragging: false,
        isAnimating: false,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
        ...overrides
    };
}

export function createClearedResultsState() {
    return {
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
        factorModalData: null
    };
}

export function createSearchResetState() {
    return {
        browserMode: "hierarchy",
        searchTerm: "",
        selectedSearchValue: "",
        ...createClearedResultsState(),
        modelFactorDetails: {},
        modelFactorLoading: {},
        errorMessage: ""
    };
}
