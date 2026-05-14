<script>
// This file renders the top-of-page search controls and results toolbar, and
// provides the wrapper slot that the canvas and detail sections live inside.

export default {
    name: "LigerSearchSection",

    props: {
        viewModel: {
            type: Object,
            required: true
        }
    }
};
</script>

<template>
    <div class="liger-controls">
        <div class="liger-mode-group">
            <button
                class="liger-mode-button"
                :class="{ 'is-active': viewModel.searchType === 'trait' }"
                type="button"
                @click="viewModel.setSearchType('trait')"
            >
                Trait
            </button>
            <button
                class="liger-mode-button"
                :class="{ 'is-active': viewModel.searchType === 'gene' }"
                type="button"
                @click="viewModel.setSearchType('gene')"
            >
                Gene
            </button>
        </div>

        <div class="liger-search-group">
            <input
                :value="viewModel.searchTerm"
                class="liger-input"
                :placeholder="viewModel.searchType === 'trait' ? 'Search for a trait' : 'Search for a gene'"
                type="text"
                @input="viewModel.searchTerm = $event.target.value.trim()"
            />

            <div
                v-if="viewModel.searchMatches && Array.isArray(viewModel.searchMatches.data) && viewModel.searchMatches.data.length"
                class="liger-suggestion-list"
            >
                <button
                    v-for="match in viewModel.searchMatches.data"
                    :key="match"
                    class="liger-suggestion-button"
                    type="button"
                    @click="viewModel.selectSearchMatch(match)"
                >
                    {{ match }}
                </button>
            </div>
        </div>

        <div v-if="viewModel.isLoading" class="liger-status">
            Loading...
        </div>

        <div v-if="viewModel.errorMessage" class="liger-status">
            {{ viewModel.errorMessage }}
        </div>

        <div
            v-if="viewModel.searchHierarchy && viewModel.searchHierarchy.length"
            class="liger-results-tree"
        >
            <div class="liger-results-toolbar">
                <div class="liger-results-legend">
                    <div class="liger-results-legend-title">Legend</div>
                    <div class="liger-results-legend-items">
                        <template v-if="viewModel.browserMode === 'hierarchy'">
                            <div class="liger-entity-badge is-search">
                                {{ viewModel.searchType === "gene" ? "Gene" : "Trait" }}
                            </div>
                            <div class="liger-entity-badge is-dataset">Tissue</div>
                            <div class="liger-entity-badge is-cell-type">Cell Type</div>
                            <div class="liger-entity-badge is-model">Model</div>
                            <div class="liger-entity-badge is-factor">Gene Program</div>
                        </template>
                        <template v-else>
                            <div class="liger-entity-badge is-search">
                                {{ viewModel.searchType === "gene" ? "Gene" : "Trait" }}
                            </div>
                            <div class="liger-entity-badge is-factor">Shared Program</div>
                            <div class="liger-entity-badge is-model">Supporting Context</div>
                        </template>
                    </div>
                </div>

                <div class="liger-browser-mode-wrap">
                    <div class="liger-results-legend-title">Explore Mode</div>
                    <div class="liger-browser-mode-group">
                        <button
                            class="liger-mode-button liger-browser-mode-button"
                            :class="{ 'is-active': viewModel.browserMode === 'hierarchy' }"
                            type="button"
                            @click="viewModel.setBrowserMode('hierarchy')"
                        >
                            Heirarchy
                        </button>
                        <button
                            class="liger-mode-button liger-browser-mode-button"
                            :class="{ 'is-active': viewModel.browserMode === 'sharedPrograms' }"
                            type="button"
                            @click="viewModel.setBrowserMode('sharedPrograms')"
                        >
                            Shared Programs
                        </button>
                    </div>
                </div>
            </div>

            <slot name="results" />
        </div>
    </div>
</template>
