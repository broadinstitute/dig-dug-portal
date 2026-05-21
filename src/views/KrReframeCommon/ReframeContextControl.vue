<template>
    <div class="glens-reframe-context-control" @click.stop>
        <button
            class="glens-reframe-context-info"
            type="button"
            aria-label="Context interpretation guide"
            @click="infoOpen = !infoOpen; editorOpen = false"
        >
            i
        </button>
        <span class="glens-reframe-context-status">
            {{ hasActiveContext ? "Context active" : "No context" }}
        </span>
        <span class="glens-reframe-divider">|</span>
        <button
            class="glens-reframe-context-action"
            type="button"
            @click="editorOpen = !editorOpen; infoOpen = false"
        >
            {{ hasActiveContext ? "Edit Context" : "Set Context" }}
        </button>

        <div v-if="infoOpen" class="glens-reframe-context-popover glens-reframe-context-popover--info">
            <button
                class="glens-reframe-popover-close"
                type="button"
                aria-label="Close context guide"
                @click="infoOpen = false"
            >
                ×
            </button>
            <p class="glens-reframe-popover-kicker">Core question</p>
            <p>{{ hasActiveContext ? activeQuestion : baselineQuestion }}</p>
            <p class="glens-reframe-popover-kicker">Purpose</p>
            <p>{{ hasActiveContext ? activePurpose : baselinePurpose }}</p>
            <p class="glens-reframe-context-note">
                Active context is HPO phenotype-based. Variant and gene pages compare it to carrier or gene/disease phenotype profiles.
            </p>
        </div>

        <div v-if="editorOpen" class="glens-reframe-context-popover glens-reframe-context-popover--editor">
            <button
                class="glens-reframe-popover-close"
                type="button"
                aria-label="Close context editor"
                @click="editorOpen = false"
            >
                ×
            </button>
            <clinical-focus-bar
                class="glens-reframe-focus-bar"
                :open-editor-on-mount="true"
                :hide-summary="true"
                @focus-confirmed="handleFocusChanged"
                @focus-cancelled="editorOpen = false"
            ></clinical-focus-bar>
            <button
                v-if="hasActiveContext"
                class="glens-reframe-remove-context"
                type="button"
                @click="removeContext"
            >
                Clear context
            </button>
        </div>
    </div>
</template>

<script>
import ClinicalFocusBar from "../KrClinicalFocus/ClinicalFocusBar.vue";
import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { clearClinicalFocus, onClinicalFocusChange, readClinicalFocus } from "../KrClinicalFocus/focusStore";

export default {
    name: "ReframeContextControl",
    components: {
        ClinicalFocusBar,
    },
    props: {
        baselineQuestion: {
            type: String,
            required: true,
        },
        baselinePurpose: {
            type: String,
            required: true,
        },
        activeQuestion: {
            type: String,
            required: true,
        },
        activePurpose: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            clinicalFocus: readClinicalFocus(),
            infoOpen: false,
            editorOpen: false,
            unsubscribeClinicalFocus: null,
        };
    },
    computed: {
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
    },
    mounted() {
        this.unsubscribeClinicalFocus = onClinicalFocusChange((focus) => {
            this.clinicalFocus = focus;
            this.$emit("focus-changed", focus);
        });
        document.addEventListener("click", this.closePopovers);
    },
    beforeDestroy() {
        if (this.unsubscribeClinicalFocus) this.unsubscribeClinicalFocus();
        document.removeEventListener("click", this.closePopovers);
    },
    methods: {
        closePopovers() {
            this.infoOpen = false;
            this.editorOpen = false;
        },
        handleFocusChanged() {
            this.clinicalFocus = readClinicalFocus();
            this.editorOpen = false;
            this.$emit("focus-changed", this.clinicalFocus);
        },
        removeContext() {
            clearClinicalFocus();
            this.clinicalFocus = readClinicalFocus();
            this.editorOpen = false;
            this.$emit("focus-changed", this.clinicalFocus);
        },
    },
};
</script>
