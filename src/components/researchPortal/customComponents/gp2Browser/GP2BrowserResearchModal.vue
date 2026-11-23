<template>
    <div
        v-if="open"
        class="gp2-research-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="$emit('close')"
    >
        <div class="gp2-research-panel">
            <header class="gp2-research-head">
                <h2 :id="titleId">{{ title }}</h2>
                <button
                    type="button"
                    class="gp2-research-close"
                    :aria-label="`Close ${title}`"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </header>
            <div class="gp2-research-body">
                <template v-if="panelId === 'genePrioritization'">
                    <div v-if="genePrioritizationState.loading" class="gp2-research-status">
                        Loading gene prioritization data…
                    </div>
                    <div v-else-if="genePrioritizationState.error" class="gp2-research-status gp2-research-status-error">
                        {{ genePrioritizationState.error }}
                    </div>
                    <template v-else>
                        <GP2BrowserGenePrioritizationFilters
                            :rows="genePrioritizationState.rows"
                            :filters="genePrioritizationFilters"
                            :has-search-region="Boolean(searchRegion)"
                            @update:filters="onGenePrioritizationFiltersUpdate"
                        />
                        <GP2BrowserGenePrioritizationTable
                            :rows="genePrioritizationFilteredRows"
                            :utils="utilsBox"
                            @navigate-region="$emit('navigate-region', $event)"
                        />
                    </template>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import GP2BrowserGenePrioritizationFilters from "./GP2BrowserGenePrioritizationFilters.vue";
import GP2BrowserGenePrioritizationTable from "./GP2BrowserGenePrioritizationTable.vue";
import {
    fetchGp2GenePrioritization,
    gp2GenePrioritizationDefaultFilters,
    gp2GenePrioritizationFilterRows,
} from "./gp2BrowserGenePrioritizationApi.js";

const RESEARCH_PANEL_TITLES = {
    genePrioritization: "Gene prioritization",
    associatedPhenotypes: "Associated phenotypes",
    literatureEvidence: "Literature evidence",
};

export default {
    name: "GP2BrowserResearchModal",
    components: {
        GP2BrowserGenePrioritizationFilters,
        GP2BrowserGenePrioritizationTable,
    },
    props: {
        panelId: {
            type: String,
            default: null,
        },
        utilsBox: {
            type: Object,
            default: null,
        },
        searchRegion: {
            type: Object,
            default: null,
        },
    },
    emits: ["close", "navigate-region"],
    data() {
        return {
            genePrioritizationState: {
                loading: false,
                loaded: false,
                error: null,
                rows: [],
            },
            genePrioritizationFilters: gp2GenePrioritizationDefaultFilters(),
        };
    },
    computed: {
        genePrioritizationFilteredRows() {
            return gp2GenePrioritizationFilterRows(
                this.genePrioritizationState.rows,
                this.genePrioritizationFilters,
                this.searchRegion
            );
        },
        open() {
            return Boolean(this.panelId && RESEARCH_PANEL_TITLES[this.panelId]);
        },
        title() {
            return (this.panelId && RESEARCH_PANEL_TITLES[this.panelId]) || "";
        },
        titleId() {
            return `gp2-research-title-${this.panelId || "panel"}`;
        },
    },
    watch: {
        panelId: {
            immediate: true,
            handler(panelId) {
                if (panelId === "genePrioritization") {
                    this.loadGenePrioritization();
                }
            },
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onKeyDown(event) {
            if (!this.open) {
                return;
            }
            if (event.key === "Escape") {
                this.$emit("close");
            }
        },
        onGenePrioritizationFiltersUpdate(filters) {
            this.genePrioritizationFilters = filters;
        },
        async loadGenePrioritization() {
            if (this.genePrioritizationState.loaded || this.genePrioritizationState.loading) {
                return;
            }
            this.genePrioritizationState.loading = true;
            this.genePrioritizationState.error = null;
            try {
                const rows = await fetchGp2GenePrioritization();
                this.genePrioritizationState.rows = rows;
                this.genePrioritizationState.loaded = true;
            } catch (error) {
                this.genePrioritizationState.error =
                    error?.message || "Failed to load gene prioritization data.";
            } finally {
                this.genePrioritizationState.loading = false;
            }
        },
    },
};
</script>

<style scoped>
.gp2-research-modal {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5vh 2.5vw;
    background: rgba(20, 22, 30, 0.28);
}

.gp2-research-panel {
    width: 95%;
    height: 95%;
    max-width: none;
    max-height: none;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.22);
    overflow: hidden;
}

.gp2-research-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    padding: 12px 16px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.gp2-research-head h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.gp2-research-close {
    border: none;
    background: transparent;
    font-size: 22px;
    line-height: 1;
    color: var(--cfde-muted, #6b6b6b);
    cursor: pointer;
    padding: 0 4px;
}

.gp2-research-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 14px 16px 18px;
}

.gp2-research-status {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-research-status-error {
    color: #ee3124;
}
</style>
