<script>
import Vue from "vue";

// The gene autocomplete for the header band. Presentational plus keyboard
// navigation: the parent owns the debounce and the /api/bio/match/gene fetch, and
// passes suggestions down, so this component never talks to the network.
export default Vue.component("GeneSearch", {
    props: {
        // the raw text in the input
        value: {
            type: String,
            default: ""
        },
        // the gene that is actually loaded, which is not the same thing -- the input
        // can be mid-edit while a gene stays selected
        selectedGene: {
            type: String,
            default: ""
        },
        suggestions: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        noMatches: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: ""
        },
        exampleGenes: {
            type: Array,
            default: () => []
        }
    },

    data() {
        return {
            open: false,
            // -1 means "nothing highlighted"; Enter then submits the typed text
            // rather than a suggestion, which is how v1 behaved.
            activeIndex: -1
        };
    },

    computed: {
        suggestionLabels() {
            return this.suggestions.map((gene) => {
                if (typeof gene === "string") {
                    return gene.toUpperCase();
                }

                let label = gene.symbol || gene.gene_symbol || gene.name || gene.gene || gene.id || "";
                return String(label).toUpperCase();
            });
        },

        showPanel() {
            return this.open && (this.suggestions.length > 0 || this.loading || this.noMatches);
        }
    },

    watch: {
        suggestions() {
            // A fresh result set invalidates the highlight -- index 2 of the old
            // list is a different gene in the new one.
            this.activeIndex = -1;
        }
    },

    beforeDestroy() {
        this.unbindDocument();
    },

    methods: {
        onInput(event) {
            this.open = true;
            this.$emit("input", event.target.value);
        },

        onFocus() {
            this.open = true;
            this.bindDocument();
        },

        // Pointerdown rather than click, and on document, so the panel closes before
        // a click lands somewhere else in the header band.
        bindDocument() {
            if (this.documentListener) {
                return;
            }

            this.documentListener = (event) => {
                if (this.$el && !this.$el.contains(event.target)) {
                    this.close();
                }
            };
            document.addEventListener("pointerdown", this.documentListener);
        },

        unbindDocument() {
            if (!this.documentListener) {
                return;
            }

            document.removeEventListener("pointerdown", this.documentListener);
            this.documentListener = null;
        },

        close() {
            this.open = false;
            this.activeIndex = -1;
            this.unbindDocument();
        },

        onKeydown(event) {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                if (!this.suggestions.length) {
                    return;
                }

                event.preventDefault();
                this.open = true;

                let step = event.key === "ArrowDown" ? 1 : -1;
                let count = this.suggestions.length;
                // Wraps through -1, so arrowing back past the top returns to the
                // typed text instead of trapping the user in the list.
                this.activeIndex = ((this.activeIndex + 1 + step + count + 1) % (count + 1)) - 1;
                return;
            }

            if (event.key === "Enter") {
                event.preventDefault();

                if (this.activeIndex >= 0 && this.suggestionLabels[this.activeIndex]) {
                    this.pick(this.suggestionLabels[this.activeIndex]);
                    return;
                }

                this.close();
                this.$emit("submit", this.value);
                return;
            }

            if (event.key === "Escape") {
                if (this.open) {
                    // Only swallow Escape when it has a panel to close; otherwise it
                    // belongs to whatever else on the page is listening.
                    event.stopPropagation();
                    this.close();
                }
            }
        },

        pick(label) {
            this.close();
            this.$emit("select", label);
        }
    }
});
</script>

<template>
    <div class="gene-search" :class="{ 'is-open': showPanel }">
        <div class="band-label">Gene</div>

        <div class="search-row">
            <input
                ref="input"
                type="text"
                class="gene-input"
                :value="value"
                placeholder="Search a gene"
                autocomplete="off"
                spellcheck="false"
                role="combobox"
                aria-autocomplete="list"
                :aria-expanded="showPanel ? 'true' : 'false'"
                @input="onInput"
                @focus="onFocus"
                @keydown="onKeydown"
            />
            <button type="button" class="search-go" @click="$emit('submit', value)">
                <span v-if="loading" class="spinner" aria-hidden="true"></span>
                <span v-else>Go</span>
            </button>

            <div v-if="showPanel" class="suggestion-panel" role="listbox">
                <div v-if="loading && !suggestions.length" class="suggestion-note">Searching…</div>
                <div v-else-if="noMatches && !suggestions.length" class="suggestion-note">No matching genes</div>
                <button
                    v-for="(label, index) in suggestionLabels"
                    :key="label + index"
                    type="button"
                    class="suggestion"
                    :class="{ active: index === activeIndex }"
                    role="option"
                    :aria-selected="index === activeIndex ? 'true' : 'false'"
                    @mouseenter="activeIndex = index"
                    @click="pick(label)"
                >{{ label }}</button>
            </div>
        </div>

        <!-- No status line. `Showing PPARG` restated the value already sitting in
             the control above it and in the canvas heading beside it.

             What is left only renders when it has something to say, so this row
             collapses rather than reserving band height to hold a blank: an error,
             or -- before a gene is chosen -- the example genes, which are a control
             rather than a status and are the config's only way to offer a starting
             point. -->
        <div v-if="error" class="band-error">{{ error }}</div>
        <div v-else-if="!selectedGene && exampleGenes.length" class="band-examples">
            <span class="examples-label">Try</span>
            <button
                v-for="gene in exampleGenes"
                :key="gene"
                type="button"
                class="example-gene"
                @click="pick(gene)"
            >{{ gene }}</button>
        </div>
    </div>
</template>

<style scoped>
.gene-search{
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}
.band-label{
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--ce-muted);
}
.search-row{
    position: relative;
    display: flex;
    gap: 6px;
}
.gene-input{
    flex: 1;
    min-width: 0;
    height: 34px;
    padding: 0 10px;
    border: 1px solid var(--ce-line);
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--ce-ink);
}
.gene-input::placeholder{
    font-weight: 400;
    text-transform: none;
    color: var(--ce-muted);
}
.gene-input:focus{
    outline: none;
    border-color: var(--ce-accent);
    box-shadow: 0 0 0 3px var(--ce-accent-soft);
}
.search-go{
    width: 46px;
    height: 34px;
    border: none;
    border-radius: 8px;
    background: var(--ce-accent);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
.search-go:hover{ filter: brightness(1.08); }

.spinner{
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255,255,255,.45);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ce-spin .7s linear infinite;
}
@keyframes ce-spin{ to { transform: rotate(360deg); } }

.suggestion-panel{
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 52px;
    z-index: 30;
    max-height: 244px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid var(--ce-line);
    border-radius: 8px;
    box-shadow: 0 10px 26px rgba(23,38,43,.14);
    padding: 4px;
}
.suggestion{
    display: block;
    width: 100%;
    padding: 6px 8px;
    border: none;
    border-radius: 6px;
    background: none;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: var(--ce-ink);
    cursor: pointer;
}
.suggestion.active{
    background: var(--ce-accent-soft);
    color: var(--ce-accent);
}
.suggestion-note{
    padding: 6px 8px;
    font-size: 11px;
    color: var(--ce-muted);
}

/* Both only render when they have content, so neither reserves a row. */
.band-error{
    font-size: 11px;
    line-height: 16px;
    color: #b42318;
}
.band-examples{
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    line-height: 16px;
}
.examples-label{ color: var(--ce-muted); }
.example-gene{
    border: none;
    background: none;
    padding: 0;
    font-size: 11px;
    font-weight: 700;
    color: var(--ce-accent);
    cursor: pointer;
    text-decoration: underline;
}
</style>
