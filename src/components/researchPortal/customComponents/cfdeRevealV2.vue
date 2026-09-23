<template>
    <div class="reveal-v2">
        <header class="rv2-header">
            <div class="rv2-brand">
                <span class="rv2-mark">REVEAL</span>
            </div>
            <RevealV2MenuBar @action="onMenuAction" />
        </header>

        <div class="rv2-stage">
            <RevealV2GeneKgPanel
                v-if="geneKg || geneKgLoading || geneKgError"
                :gene-kg="geneKg"
                :loading="geneKgLoading"
                :error="geneKgError"
            />

            <div v-else-if="lastSearch" class="rv2-search-summary">
                <div class="rv2-search-summary-head">
                    <span class="rv2-search-summary-type">{{ lastSearchLabel }}</span>
                    <span v-if="lastSearch.gene" class="rv2-search-summary-gene">
                        Gene: {{ lastSearch.gene }}
                    </span>
                </div>
                <p class="rv2-search-summary-query">{{ lastSearch.query }}</p>
                <p class="rv2-search-summary-count">
                    {{ (lastSearch.results && lastSearch.results.length) || 0 }} result(s)
                </p>
            </div>

            <p v-else class="rv2-placeholder">REVEAL workspace — start from the welcome panel.</p>
        </div>

        <RevealV2WelcomePanel
            :open="welcomeOpen"
            :dismissible="true"
            :focus-learn="welcomeFocusLearn"
            :initial-search-text="activeSearchText"
            @close="onWelcomeClose"
            @search="onWelcomeSearch"
            @import-session="onImportSession"
        />
    </div>
</template>

<script>
import RevealV2MenuBar from "@/components/researchPortal/customComponents/cfdeRevealV2/RevealV2MenuBar.vue";
import RevealV2WelcomePanel from "@/components/researchPortal/customComponents/cfdeRevealV2/RevealV2WelcomePanel.vue";
import RevealV2GeneKgPanel from "@/components/researchPortal/customComponents/cfdeRevealV2/RevealV2GeneKgPanel.vue";
import { fetchGeneKg } from "@/components/researchPortal/customComponents/cfdeRevealV2/revealV2GeneKg.js";

export default {
    name: "cfdeRevealV2",
    components: {
        RevealV2MenuBar,
        RevealV2WelcomePanel,
        RevealV2GeneKgPanel,
    },
    props: {
        phenotypesInUse: {
            type: [Array, Object],
            default: () => [],
        },
        utilsBox: {
            type: Object,
            default: () => ({}),
        },
        sectionConfigs: {
            type: [Array, Object],
            default: () => ({}),
        },
    },
    data() {
        return {
            welcomeOpen: true,
            welcomeFocusLearn: false,
            activeSearchText: "",
            lastSearch: null,
            geneKg: null,
            geneKgLoading: false,
            geneKgError: null,
            geneKgAbort: null,
            geneKgSeq: 0,
        };
    },
    computed: {
        lastSearchLabel() {
            if (!this.lastSearch) return "";
            if (this.lastSearch.mode === "gene+mechanism") {
                return "Mechanism search (gene + mechanism)";
            }
            if (this.lastSearch.searchType === "gene") {
                return "Gene search";
            }
            return "Mechanism search";
        },
    },
    beforeDestroy() {
        this.abortGeneKg();
    },
    methods: {
        onMenuAction(payload) {
            if (!payload || !payload.menu) {
                return;
            }
            if (payload.menu === "session" && payload.action === "importSession") {
                this.onImportSession();
                return;
            }
            if (payload.menu === "session" && payload.action === "exportSession") {
                // Placeholder until session export is wired.
                return;
            }
            if (payload.menu === "session" && payload.action === "resetSession") {
                this.abortGeneKg();
                this.activeSearchText = "";
                this.lastSearch = null;
                this.geneKg = null;
                this.geneKgLoading = false;
                this.geneKgError = null;
                this.welcomeFocusLearn = false;
                this.welcomeOpen = true;
                return;
            }
            if (payload.menu === "actions" && payload.action === "open") {
                // Placeholder until Actions panel is added.
                return;
            }
            if (payload.menu === "help" && payload.action === "learnReveal") {
                this.welcomeFocusLearn = true;
                this.welcomeOpen = true;
                return;
            }
            if (payload.menu === "help" && payload.action === "documentation") {
                // Placeholder until docs link is decided.
                return;
            }
        },
        onWelcomeClose() {
            this.welcomeOpen = false;
            this.welcomeFocusLearn = false;
        },
        onWelcomeSearch(payload) {
            this.lastSearch = payload || null;
            this.activeSearchText = (payload && payload.query) || "";
            this.welcomeOpen = false;
            this.welcomeFocusLearn = false;

            const gene =
                (payload && payload.gene) ||
                (payload &&
                    payload.searchType === "gene" &&
                    payload.results &&
                    payload.results[0] &&
                    payload.results[0].label) ||
                null;

            if (payload && payload.searchType === "gene" && gene) {
                this.loadGeneKg(gene);
                return;
            }

            this.abortGeneKg();
            this.geneKg = null;
            this.geneKgLoading = false;
            this.geneKgError = null;
        },
        async loadGeneKg(geneSymbol) {
            const seq = ++this.geneKgSeq;
            this.abortGeneKg();
            const controller =
                typeof AbortController !== "undefined" ? new AbortController() : null;
            this.geneKgAbort = controller;
            this.geneKgLoading = true;
            this.geneKgError = null;
            this.geneKg = null;
            try {
                const kg = await fetchGeneKg(geneSymbol, {
                    signal: controller && controller.signal,
                });
                if (seq !== this.geneKgSeq) return;
                this.geneKg = kg;
            } catch (error) {
                if (controller && error && error.name === "AbortError") return;
                if (seq !== this.geneKgSeq) return;
                this.geneKg = null;
                this.geneKgError = "Failed to load CFDE KG associations for this gene.";
                // eslint-disable-next-line no-console
                console.warn("[cfdeRevealV2] fetchGeneKg failed", error);
            } finally {
                if (seq === this.geneKgSeq) {
                    this.geneKgLoading = false;
                    this.geneKgAbort = null;
                }
            }
        },
        abortGeneKg() {
            if (this.geneKgAbort) {
                this.geneKgAbort.abort();
                this.geneKgAbort = null;
            }
        },
        onImportSession() {
            // Placeholder until session import is wired.
        },
    },
};
</script>

<style scoped>
.reveal-v2 {
    --cfde-orange: #e07b39;
    --cfde-orange-dark: #c2662b;
    --cfde-orange-soft: #fbeee3;
    --cfde-blue: #2c5c97;
    --cfde-border: #e6e1d6;
    --cfde-bg: #f6f5f2;
    --cfde-ink: #33363d;
    --cfde-muted: #6b6b6b;

    color: var(--cfde-ink);
    min-height: 320px;
}

.rv2-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--cfde-border);
    background: #fff;
}

.rv2-brand {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.rv2-mark {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cfde-orange);
}

.rv2-stage {
    padding: 24px 18px;
    background: var(--cfde-bg);
}

.rv2-placeholder {
    margin: 0;
    font-size: 14px;
    color: var(--cfde-muted);
}

.rv2-search-summary {
    padding: 16px 18px;
    background: #fff;
    border: 1px solid var(--cfde-border);
    border-radius: 10px;
}

.rv2-search-summary-head {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-bottom: 8px;
}

.rv2-search-summary-type {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue);
}

.rv2-search-summary-gene {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-orange);
}

.rv2-search-summary-query {
    margin: 0 0 6px;
    font-size: 14px;
    color: var(--cfde-ink);
}

.rv2-search-summary-count {
    margin: 0;
    font-size: 13px;
    color: var(--cfde-muted);
}
</style>
