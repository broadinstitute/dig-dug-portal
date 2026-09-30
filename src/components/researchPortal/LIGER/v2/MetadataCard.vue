<script>
import Vue from "vue";
import DatasetInfo from "./DatasetInfo.vue";
import EntityList from "./EntityList.vue";
import ProgramInfo from "./ProgramInfo.vue";
import StateInfo from "./StateInfo.vue";

// The metadata card below the canvas. Same shape as the browser card above it: a
// band across the top, a body below.
//
// The band is three tabs rather than three selectors, laid out on the same
// three-equal-columns grid so the two cards read as one stack. The tabs mirror the
// canvas: what the data came from, then each of the two things on it.
//
// Only the Source data tab is built. The other two are declared so the shape of the
// card is visible and so their selection state can already be threaded through, but
// their bodies are placeholders.
export default Vue.component("MetadataCard", {
    components: {
        DatasetInfo,
        EntityList,
        ProgramInfo,
        StateInfo
    },

    props: {
        dataset: {
            type: Object,
            default: null
        },
        datasetId: {
            type: String,
            default: ""
        },
        browserUrl: {
            type: String,
            default: ""
        },
        loadingDataset: {
            type: Boolean,
            default: false
        },
        datasetError: {
            type: String,
            default: ""
        },
        // The dataset's cell types with this gene's expression in each -- the
        // reading that used to sit under the cell-type dropdown in the band above.
        cellTypes: {
            type: Array,
            default: () => []
        },
        cellTypeGene: {
            type: String,
            default: ""
        },
        loadingCellTypes: {
            type: Boolean,
            default: false
        },
        cellTypeError: {
            type: String,
            default: ""
        },
        // --- gene program tab ---
        programItems: {
            type: Array,
            default: () => []
        },
        selectedProgram: {
            type: Object,
            default: null
        },
        selectedProgramFactor: {
            type: Object,
            default: null
        },
        programDetail: {
            type: Object,
            default: null
        },
        qcMetadata: {
            type: Object,
            default: () => ({})
        },
        // states matching the selected program
        programMatches: {
            type: Array,
            default: () => []
        },
        loadingProgramDetail: {
            type: Boolean,
            default: false
        },
        programDetailError: {
            type: String,
            default: ""
        },
        programTraits: {
            type: Object,
            default: null
        },
        loadingProgramTraits: {
            type: Boolean,
            default: false
        },
        // When a state is selected but no program is, the program tab lists only the
        // programs matching that state. Mirror of statesForSelectedProgram.
        programsForSelectedState: {
            type: Array,
            default: () => []
        },

        // --- cell state tab ---
        stateItems: {
            type: Array,
            default: () => []
        },
        selectedState: {
            type: Object,
            default: null
        },
        selectedStateMetadata: {
            type: Object,
            default: null
        },
        // programs matching the selected state
        stateMatches: {
            type: Array,
            default: () => []
        },
        // When a program is selected but no state is, the state tab lists only the
        // states matching that program rather than all of them.
        statesForSelectedProgram: {
            type: Array,
            default: () => []
        },
        stateTraits: {
            type: Object,
            default: null
        },
        loadingStateTraits: {
            type: Boolean,
            default: false
        },

        traitError: {
            type: String,
            default: ""
        },
        // Controlled by the parent, so a selection made on the canvas can move the
        // card to the tab for the thing that was selected. Without that, selecting a
        // program while the card sits on Source data changes nothing the reader can
        // see.
        activeTab: {
            type: String,
            default: "source"
        },
        geneLabel: {
            type: String,
            default: ""
        }
    },

    computed: {
        tabs() {
            return [
                {
                    key: "source",
                    label: "Source data",
                    // The subtitle answers "what is behind this tab" before it is
                    // opened, which is what the selector values do in the card above.
                    note: this.datasetId || "No dataset in scope"
                },
                {
                    key: "program",
                    label: "Gene program",
                    note: this.selectedProgram
                        ? this.selectedProgram.label
                        : (this.programListItems.length
                            ? `${this.programListItems.length}${this.narrowedToState ? " matching" : " available"}`
                            : "None in scope")
                },
                {
                    key: "state",
                    label: "Cell state",
                    note: this.selectedState
                        ? this.selectedState.label
                        : (this.stateListItems.length
                            ? `${this.stateListItems.length}${this.narrowedToProgram ? " matching" : " available"}`
                            : "None in scope")
                }
            ];
        },

        // With one side selected and the other not, the empty side's pick-one list
        // narrows to what matches. The question at that point is "which of these
        // does the selected one connect to", not "what exists".
        //
        // Both directions, and both say so plus how to get back to the full set --
        // a silently filtered list is indistinguishable from a short one.
        narrowedToProgram() {
            return !this.selectedState && !!this.selectedProgram && this.statesForSelectedProgram.length > 0;
        },

        narrowedToState() {
            return !this.selectedProgram && !!this.selectedState && this.programsForSelectedState.length > 0;
        },

        stateListItems() {
            return this.narrowedToProgram ? this.statesForSelectedProgram : this.stateItems;
        },

        stateListNote() {
            if (this.narrowedToProgram) {
                return `Cell states matching ${this.selectedProgram.label}. Clear the gene program selection to see all ${this.stateItems.length}.`;
            }

            return "Select a cell state here or on the canvas above.";
        },

        programListItems() {
            return this.narrowedToState ? this.programsForSelectedState : this.programItems;
        },

        programListNote() {
            if (this.narrowedToState) {
                return `Gene programs matching ${this.selectedState.label}. Clear the cell state selection to see all ${this.programItems.length}.`;
            }

            return "Select a gene program here or on the canvas above.";
        }
    },

    methods: {
        selectTab(key) {
            this.$emit("update:active-tab", key);
        },

        // A cross-link from one entity's match table to the other entity also moves
        // to that entity's tab. Clicking "beta mature identity" inside a program's
        // match table is a request to read about that state, so leaving the reader
        // on the program tab with a silently-changed selection would be a dead end.
        crossLinkToState(item) {
            this.$emit("select-state", item);
            this.$emit("update:active-tab", "state");
        },

        crossLinkToProgram(item) {
            this.$emit("select-program", item);
            this.$emit("update:active-tab", "program");
        }
    }
});
</script>

<template>
    <div class="metadata-card">
        <div class="tab-band" role="tablist">
            <template v-for="(tab, index) in tabs">
                <div v-if="index > 0" :key="tab.key + '-divider'" class="band-divider" aria-hidden="true"></div>

                <button
                    :key="tab.key"
                    type="button"
                    class="tab"
                    :class="{ active: activeTab === tab.key }"
                    role="tab"
                    :aria-selected="activeTab === tab.key ? 'true' : 'false'"
                    @click="selectTab(tab.key)"
                >
                    <span class="tab-label">{{ tab.label }}</span>
                    <span class="tab-note">{{ tab.note }}</span>
                </button>
            </template>
        </div>

        <div class="metadata-body">
            <dataset-info
                v-if="activeTab === 'source'"
                :dataset="dataset"
                :dataset-id="datasetId"
                :browser-url="browserUrl"
                :loading="loadingDataset"
                :error="datasetError"
                :cell-types="cellTypes"
                :cell-type-gene="cellTypeGene"
                :loading-cell-types="loadingCellTypes"
                :cell-type-error="cellTypeError"
            />

            <template v-else-if="activeTab === 'program'">
                <div v-if="selectedProgram" class="body-bar">
                    <button type="button" class="back-link" @click="$emit('clear-program')">
                        ← All gene programs
                    </button>
                </div>
                <program-info
                    v-if="selectedProgram"
                    :program="selectedProgram"
                    :factor="selectedProgramFactor"
                    :detail="programDetail"
                    :qc-metadata="qcMetadata"
                    :matches="programMatches"
                    :gene-label="geneLabel"
                    :loading="loadingProgramDetail"
                    :error="programDetailError"
                    :traits="programTraits"
                    :loading-traits="loadingProgramTraits"
                    :trait-error="traitError"
                    @select-state="crossLinkToState"
                />
                <entity-list
                    v-else
                    title="Select a gene program"
                    match-label="States"
                    :note="programListNote"
                    :items="programListItems"
                    :empty-text="narrowedToState
                        ? 'No gene programs match the selected cell state.'
                        : 'No gene programs in the current scope.'"
                    @select="$emit('select-program', $event)"
                />
            </template>

            <template v-else>
                <div v-if="selectedState" class="body-bar">
                    <button type="button" class="back-link" @click="$emit('clear-state')">
                        ← All cell states
                    </button>
                </div>
                <state-info
                    v-if="selectedState"
                    :state="selectedState"
                    :metadata="selectedStateMetadata"
                    :matches="stateMatches"
                    :gene-label="geneLabel"
                    :traits="stateTraits"
                    :loading-traits="loadingStateTraits"
                    :trait-error="traitError"
                    @select-program="crossLinkToProgram"
                />
                <entity-list
                    v-else
                    title="Select a cell state"
                    match-label="Programs"
                    :note="stateListNote"
                    :items="stateListItems"
                    :empty-text="narrowedToProgram
                        ? 'No cell states match the selected gene program.'
                        : 'No cell states in the current scope.'"
                    @select="$emit('select-state', $event)"
                />
            </template>
        </div>
    </div>
</template>

<style scoped>
.metadata-card{
    display: flex;
    flex-direction: column;
    border: 1px solid var(--ce-line);
    border-radius: 14px;
    background: #fff;
    overflow: hidden;
}

/* Same three-column grid as the scope band in the card above, so the two bands line
   up -- but with no gap or band padding, because the tab has to fill its whole
   column. The indent lives inside the button instead. That is what lets the active
   underline and the hover background run edge to edge rather than stopping short of
   the card edge and the divider. */
.tab-band{
    display: grid;
    grid-template-columns: 1fr 1px 1fr 1px 1fr;
    align-items: stretch;
    background: var(--ce-sunken);
    border-bottom: 1px solid var(--ce-line);
}
.band-divider{
    align-self: stretch;
    background: var(--ce-line);
}

.tab{
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 12px 18px 10px;
    border: none;
    /* Sits on top of the band's own 1px bottom border rather than adding to it, so
       switching tabs does not shift the body down. */
    border-bottom: 3px solid transparent;
    margin-bottom: -1px;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: background-color .12s ease;
}
.tab-label{
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--ce-muted);
}
.tab-note{
    font-size: 13px;
    font-weight: 700;
    color: var(--ce-ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
/* Only the inactive tabs respond to hover -- the active one is already where you
   are, so lighting it up would say nothing. */
.tab:not(.active):hover{
    background: #e7eef1;
}
.tab:not(.active):hover .tab-label{ color: var(--ce-ink); }

.tab.active{
    border-bottom-color: var(--ce-accent);
    background: #fff;
}
.tab.active .tab-label{ color: var(--ce-accent); }
.tab:focus-visible{
    outline: 2px solid var(--ce-accent);
    outline-offset: -2px;
}

.metadata-body{
    min-height: 180px;
}

/* Getting back to the list is the only navigation this card has, so it is a real
   control at the top of the body rather than something hidden in the detail. */
.body-bar{
    padding: 10px 18px 0;
}
.back-link{
    padding: 0;
    border: none;
    background: none;
    font-size: 11px;
    font-weight: 700;
    color: var(--ce-accent);
    cursor: pointer;
}
.back-link:hover{ text-decoration: underline; }

.tab-placeholder{
    padding: 40px 18px;
    text-align: center;
}
.placeholder-title{
    font-size: 13px;
    font-weight: 700;
    color: var(--ce-ink);
}
.placeholder-text{
    margin-top: 4px;
    font-size: 12px;
    color: var(--ce-muted);
}
</style>
