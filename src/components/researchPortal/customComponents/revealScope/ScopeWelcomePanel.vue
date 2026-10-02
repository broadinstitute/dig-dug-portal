<template>
    <div
        v-if="open"
        class="scp-welcome-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div class="scp-welcome-modal" role="dialog" aria-modal="true" aria-labelledby="scp-welcome-title" @click.stop>
            <button
                v-if="dismissible"
                type="button"
                class="scp-welcome-close"
                aria-label="Close"
                @click="$emit('close')"
            >
                &times;
            </button>
            <header class="scp-welcome-head">
                <h2 id="scp-welcome-title" class="scp-welcome-title">
                    Welcome to
                    <span class="scp-welcome-brand">
                        <span class="scp-welcome-mark">REVEAL</span>
                        <span class="scp-welcome-name">SCOPE</span>
                    </span>
                </h2>
                <div class="scp-welcome-tabs" role="tablist" aria-label="Welcome sections">
                    <button
                        id="scp-welcome-tab-start"
                        type="button"
                        role="tab"
                        class="scp-welcome-tab"
                        :class="{ 'is-active': activeTab === 'start' }"
                        :aria-selected="activeTab === 'start' ? 'true' : 'false'"
                        aria-controls="scp-welcome-panel-start"
                        @click="activeTab = 'start'"
                    >
                        Start SCOPE
                    </button>
                    <button
                        id="scp-welcome-tab-import"
                        type="button"
                        role="tab"
                        class="scp-welcome-tab"
                        :class="{ 'is-active': activeTab === 'import' }"
                        :aria-selected="activeTab === 'import' ? 'true' : 'false'"
                        aria-controls="scp-welcome-panel-import"
                        @click="activeTab = 'import'"
                    >
                        Import session
                    </button>
                    <button
                        id="scp-welcome-tab-learn"
                        type="button"
                        role="tab"
                        class="scp-welcome-tab"
                        :class="{ 'is-active': activeTab === 'learn' }"
                        :aria-selected="activeTab === 'learn' ? 'true' : 'false'"
                        aria-controls="scp-welcome-panel-learn"
                        @click="activeTab = 'learn'"
                    >
                        Learn SCOPE
                    </button>
                </div>
            </header>

            <div
                v-show="activeTab === 'start'"
                id="scp-welcome-panel-start"
                role="tabpanel"
                aria-labelledby="scp-welcome-tab-start"
                class="scp-welcome-panel"
            >
                <div class="scp-welcome-option scp-welcome-search-wrapper">
                    <div class="scp-welcome-mode" role="radiogroup" aria-label="Input mode">
                        <label class="scp-welcome-mode-option">
                            <input v-model="inputMode" type="radio" value="freeText" />
                            Hypothesis / free text
                        </label>
                        <label class="scp-welcome-mode-option">
                            <input v-model="inputMode" type="radio" value="entities" />
                            Gene or mechanisms
                        </label>
                    </div>

                    <template v-if="inputMode === 'freeText'">
                        <textarea
                            v-model="hypothesisText"
                            class="scp-welcome-textarea"
                            rows="4"
                            placeholder="e.g. Knocking down GENE1 in HepG2 cells reduces expression of GENE2 under hypoxia"
                        ></textarea>
                    </template>

                    <template v-else>
                        <div class="scp-welcome-ac">
                            <input
                                v-model="entityQuery"
                                type="text"
                                class="scp-welcome-ac-input"
                                placeholder="Search genes or mechanisms…"
                                autocomplete="off"
                                @input="onEntityQueryInput"
                                @focus="entityMenuOpen = true"
                            />
                            <div
                                v-if="entityMenuOpen && showEntityMenu"
                                class="scp-welcome-ac-menu"
                                role="listbox"
                            >
                                <div v-if="entityLoading" class="scp-welcome-ac-status">Searching…</div>
                                <template v-else-if="!geneSuggestions.length && !mechanismSuggestions.length">
                                    <div class="scp-welcome-ac-status">No genes or mechanisms matched.</div>
                                </template>
                                <template v-else>
                                    <div v-if="geneSuggestions.length" class="scp-welcome-ac-group">
                                        <div class="scp-welcome-ac-group-title">Gene</div>
                                        <button
                                            v-for="gene in geneSuggestions"
                                            :key="'g:' + gene"
                                            type="button"
                                            role="option"
                                            class="scp-welcome-ac-item"
                                            @mousedown.prevent="selectGene(gene)"
                                        >
                                            {{ gene }}
                                        </button>
                                    </div>
                                    <div v-if="mechanismSuggestions.length" class="scp-welcome-ac-group">
                                        <div class="scp-welcome-ac-group-title">Mechanism</div>
                                        <button
                                            v-for="hit in mechanismSuggestions"
                                            :key="'m:' + (hit.iri || hit.id)"
                                            type="button"
                                            role="option"
                                            class="scp-welcome-ac-item"
                                            @mousedown.prevent="selectMechanism(hit)"
                                        >
                                            <span class="scp-welcome-ac-item-label">{{ hit.label }}</span>
                                            <span v-if="hit.cfdeDisease" class="scp-welcome-ac-item-meta">{{
                                                hit.cfdeDisease
                                            }}</span>
                                        </button>
                                    </div>
                                </template>
                            </div>
                        </div>

                        <div v-if="selectedEntities.length" class="scp-welcome-chips">
                            <button
                                v-for="entity in selectedEntities"
                                :key="entityKey(entity)"
                                type="button"
                                class="scp-welcome-chip"
                                :title="'Remove ' + entity.label"
                                @click="removeEntity(entity)"
                            >
                                <span class="scp-welcome-chip-kind">{{
                                    entity.type === "gene" ? "Gene" : "Mechanism"
                                }}</span>
                                <span class="scp-welcome-chip-label">{{ entity.label }}</span>
                                <span class="scp-welcome-chip-x" aria-hidden="true">&times;</span>
                            </button>
                        </div>
                    </template>
                </div>

                <div class="scp-welcome-options">
                    <button
                        type="button"
                        class="scp-welcome-option scp-welcome-option-action"
                        :disabled="!canRunKgSearch"
                        @click="onOptionSelect('searchCfdeKg')"
                    >
                        <span class="scp-welcome-option-title">Search CFDE KG</span>
                        <span class="scp-welcome-option-desc">
                            Extracts a target gene and mechanism/outcome from free text (or multiple
                            selections), then searches the CFDE knowledge graph. A single gene or
                            mechanism skips extraction and explores whatever is linked to that entity.
                        </span>
                    </button>
                    <button
                        type="button"
                        class="scp-welcome-option scp-welcome-option-action"
                        :disabled="!canRunGapSearch"
                        @click="onOptionSelect('searchKnowledgeGaps')"
                    >
                        <span class="scp-welcome-option-title">Search for knowledge gaps</span>
                        <span class="scp-welcome-option-desc">
                            Free text extracts categorized terms; a single gene/mechanism skips extraction
                            and searches that item only. Multiple selections run term extraction.
                        </span>
                    </button>
                    <button
                        type="button"
                        class="scp-welcome-option scp-welcome-option-action"
                        :disabled="!canRunEvaluate"
                        @click="onOptionSelect('evaluateHypothesis')"
                    >
                        <span class="scp-welcome-option-title">Evaluate hypothesis</span>
                        <span class="scp-welcome-option-desc">
                            Is your input a hypothesis? Checks it for precision and falsifiability and
                            shows the parsed target, perturbation, and outcome. Flags anything it can't
                            confidently score instead of guessing.
                        </span>
                    </button>
                </div>
            </div>

            <div
                v-show="activeTab === 'import'"
                id="scp-welcome-panel-import"
                role="tabpanel"
                aria-labelledby="scp-welcome-tab-import"
                class="scp-welcome-panel"
            >
                <button
                    type="button"
                    class="scp-welcome-option scp-welcome-option-import"
                    @click="onImportSessionClick"
                >
                    <span class="scp-welcome-option-title">Import session</span>
                    <span class="scp-welcome-option-desc">
                        Load a previously exported session and pick up where you left off.
                    </span>
                </button>
            </div>

            <div
                v-show="activeTab === 'learn'"
                id="scp-welcome-panel-learn"
                role="tabpanel"
                aria-labelledby="scp-welcome-tab-learn"
                class="scp-welcome-panel"
            >
                <p class="scp-welcome-intro">
                    SCOPE is a hub-and-spoke workbench, not a linear pipeline. Once a hypothesis is
                    parsed, run any of the four modules, in any order:
                </p>
                <div class="scp-welcome-options">
                    <div class="scp-welcome-option">
                        <span class="scp-welcome-option-title">A · Quality &amp; Syntax</span>
                        <span class="scp-welcome-option-desc">
                            Real-time rubric on precision and falsifiability, plus a slot inspector
                            to review or correct the parse.
                        </span>
                    </div>
                    <div class="scp-welcome-option">
                        <span class="scp-welcome-option-title">B · Literature Launcher</span>
                        <span class="scp-welcome-option-desc">
                            Editable search query and deep link to PubMed.
                        </span>
                    </div>
                    <div class="scp-welcome-option">
                        <span class="scp-welcome-option-title">C · KG Evidence &amp; Path Finder</span>
                        <span class="scp-welcome-option-desc">
                            Per-hop evidence against curated knowledge graphs, with coverage
                            metadata on every result.
                        </span>
                    </div>
                    <div class="scp-welcome-option">
                        <span class="scp-welcome-option-title">D · Dataset &amp; Workspace Provisioner</span>
                        <span class="scp-welcome-option-desc">
                            Hand off a gap to existing datasets or a generation protocol template.
                        </span>
                    </div>
                </div>
                <p class="scp-welcome-intro">
                    <strong>Bounded honesty:</strong> SCOPE only answers as much as it knows, and
                    always states its coverage explicitly.
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import { match } from "@/utils/bioIndexUtils";
import { searchCfdeFactors } from "@/components/researchPortal/customComponents/revealScope/scopeFactorSearch.js";

const DEBOUNCE_MS = 250;

export default {
    name: "ScopeWelcomePanel",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        initialTab: {
            type: String,
            default: "start",
            validator(value) {
                return value === "start" || value === "import" || value === "learn";
            },
        },
        dismissible: {
            type: Boolean,
            default: true,
        },
        initialHypothesisText: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            activeTab: "start",
            inputMode: "freeText",
            hypothesisText: this.initialHypothesisText,
            selectedEntities: [],
            entityQuery: "",
            entityMenuOpen: false,
            entityTimer: null,
            geneSuggestions: [],
            geneLoading: false,
            geneAbort: null,
            mechanismSuggestions: [],
            mechanismLoading: false,
            mechanismAbort: null,
        };
    },
    computed: {
        canRunEvaluate() {
            return this.inputMode === "freeText" && Boolean(this.hypothesisText.trim());
        },
        canRunGapSearch() {
            if (this.inputMode === "freeText") {
                return Boolean(this.hypothesisText.trim());
            }
            return this.selectedEntities.length > 0;
        },
        canRunKgSearch() {
            if (this.inputMode === "freeText") {
                return Boolean(this.hypothesisText.trim());
            }
            return this.selectedEntities.length > 0;
        },
        entityLoading() {
            return this.geneLoading || this.mechanismLoading;
        },
        showEntityMenu() {
            return (
                this.entityLoading ||
                this.geneSuggestions.length > 0 ||
                this.mechanismSuggestions.length > 0 ||
                this.entityQuery.trim().length >= 2
            );
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.activeTab = this.initialTab;
                this.hypothesisText = this.initialHypothesisText;
            }
        },
        initialTab(tab) {
            if (this.open) {
                this.activeTab = tab;
            }
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("mousedown", this.onDocMouseDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
        document.removeEventListener("mousedown", this.onDocMouseDown);
        this.clearEntityTimer();
        this.abortGene();
        this.abortMechanism();
    },
    methods: {
        entityKey(entity) {
            if (!entity) return "";
            if (entity.type === "gene") {
                return `gene:${String(entity.label || "").toUpperCase()}`;
            }
            return `mechanism:${entity.iri || entity.id || entity.label}`;
        },
        onEntityQueryInput() {
            this.entityMenuOpen = true;
            this.clearEntityTimer();
            const q = this.entityQuery.trim();
            if (q.length < 2) {
                this.abortGene();
                this.abortMechanism();
                this.geneSuggestions = [];
                this.mechanismSuggestions = [];
                this.geneLoading = false;
                this.mechanismLoading = false;
                return;
            }
            this.geneLoading = true;
            this.mechanismLoading = true;
            this.entityTimer = setTimeout(() => {
                this.runGeneSearch(q);
                this.runMechanismSearch(q);
            }, DEBOUNCE_MS);
        },
        async runGeneSearch(q) {
            this.abortGene();
            const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
            this.geneAbort = controller;
            try {
                const matches = await match("gene", q, { limit: 10 });
                if (controller && controller.signal.aborted) return;
                if (this.entityQuery.trim() !== q) return;
                const list = Array.isArray(matches) ? matches : [];
                this.geneSuggestions = list
                    .map((item) =>
                        typeof item === "string" ? item : item && (item.name || item.symbol || item)
                    )
                    .filter((s) => typeof s === "string" && s.trim())
                    .map((s) => s.trim());
            } catch (_err) {
                if (controller && controller.signal.aborted) return;
                this.geneSuggestions = [];
            } finally {
                if (!controller || !controller.signal.aborted) {
                    this.geneLoading = false;
                }
            }
        },
        async runMechanismSearch(q) {
            this.abortMechanism();
            const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
            this.mechanismAbort = controller;
            try {
                const hits = await searchCfdeFactors(q, {
                    limit: 12,
                    signal: controller ? controller.signal : undefined,
                });
                if (controller && controller.signal.aborted) return;
                if (this.entityQuery.trim() !== q) return;
                this.mechanismSuggestions = hits;
            } catch (_err) {
                if (controller && controller.signal.aborted) return;
                this.mechanismSuggestions = [];
            } finally {
                if (!controller || !controller.signal.aborted) {
                    this.mechanismLoading = false;
                }
            }
        },
        selectGene(gene) {
            const label = String(gene || "").trim();
            if (!label) return;
            this.addEntity({ type: "gene", label, id: label });
            this.entityQuery = "";
            this.geneSuggestions = [];
            this.mechanismSuggestions = [];
            this.entityMenuOpen = false;
        },
        selectMechanism(hit) {
            if (!hit || !hit.label) return;
            this.addEntity({
                type: "mechanism",
                label: hit.label,
                id: hit.id,
                iri: hit.iri,
                factor: hit.factor || "",
                cfdeDisease: hit.cfdeDisease || "",
            });
            this.entityQuery = "";
            this.geneSuggestions = [];
            this.mechanismSuggestions = [];
            this.entityMenuOpen = false;
        },
        addEntity(entity) {
            const key = this.entityKey(entity);
            if (this.selectedEntities.some((e) => this.entityKey(e) === key)) {
                return;
            }
            this.selectedEntities = [...this.selectedEntities, entity];
        },
        removeEntity(entity) {
            const key = this.entityKey(entity);
            this.selectedEntities = this.selectedEntities.filter((e) => this.entityKey(e) !== key);
        },
        buildHypothesisText() {
            if (this.inputMode === "freeText") {
                return this.hypothesisText.trim();
            }
            return this.selectedEntities
                .map((e) => e.label)
                .filter(Boolean)
                .join(", ");
        },
        onOptionSelect(optionId) {
            const hypothesisText = this.buildHypothesisText();
            if (!hypothesisText) {
                return;
            }
            if (optionId !== "searchKnowledgeGaps" && optionId !== "searchCfdeKg" && this.inputMode === "entities") {
                return;
            }
            this.$emit("select-option", {
                optionId,
                hypothesisText,
                inputMode: this.inputMode,
                selectedEntities:
                    this.inputMode === "entities"
                        ? this.selectedEntities.map((e) => ({ ...e }))
                        : [],
            });
            this.$emit("close");
        },
        onImportSessionClick() {
            this.$emit("import-session");
        },
        onBackdropClick(event) {
            if (event.target !== event.currentTarget || !this.dismissible) {
                return;
            }
            this.$emit("close");
        },
        onKeyDown(event) {
            if (this.open && event.key === "Escape" && this.dismissible) {
                event.preventDefault();
                this.$emit("close");
            }
        },
        onDocMouseDown(event) {
            if (!this.open) return;
            const root = this.$el;
            if (!root || !(root instanceof Element)) return;
            if (!root.contains(event.target)) return;
            if (!(event.target.closest && event.target.closest(".scp-welcome-ac"))) {
                this.entityMenuOpen = false;
            }
        },
        clearEntityTimer() {
            if (this.entityTimer) {
                clearTimeout(this.entityTimer);
                this.entityTimer = null;
            }
        },
        abortGene() {
            if (this.geneAbort) {
                this.geneAbort.abort();
                this.geneAbort = null;
            }
        },
        abortMechanism() {
            if (this.mechanismAbort) {
                this.mechanismAbort.abort();
                this.mechanismAbort = null;
            }
        },
    },
};
</script>

<style scoped>
.scp-welcome-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.scp-welcome-modal {
    position: relative;
    width: min(560px, 100%);
    max-height: min(90vh, 780px);
    display: flex;
    flex-direction: column;
    padding: 24px 26px 26px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.scp-welcome-close {
    position: absolute;
    top: 10px;
    right: 12px;
    z-index: 1;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    padding: 4px 8px;
}

.scp-welcome-head h2 {
    margin: 0 0 12px;
}

.scp-welcome-title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35em;
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.scp-welcome-brand {
    display: inline-flex;
    align-items: baseline;
    gap: 7px;
}

.scp-welcome-mark {
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cfde-orange, #e07b39);
}

.scp-welcome-name {
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.scp-welcome-tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    border-radius: 8px;
    background: #f6f5f2;
}

.scp-welcome-tab {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
    font-weight: 600;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
}

.scp-welcome-tab.is-active {
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    box-shadow: 0 1px 3px rgba(20, 22, 30, 0.08);
}

.scp-welcome-panel {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    margin-top: 15px;
}

.scp-welcome-intro {
    margin: 0 0 16px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-welcome-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
}

.scp-welcome-option {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    text-align: left;
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--cfde-bg, #f6f5f2);
}

.scp-welcome-search-wrapper {
    margin-bottom: 15px;
}

.scp-welcome-mode {
    display: flex;
    flex-wrap: wrap;
    gap: 14px 18px;
    margin-bottom: 12px;
}

.scp-welcome-mode-option {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
}

.scp-welcome-ac {
    position: relative;
    width: 100%;
}

.scp-welcome-ac-input,
.scp-welcome-textarea {
    width: 100%;
    font-size: 13px;
    font-family: inherit;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fff;
}

.scp-welcome-textarea {
    resize: vertical;
}

.scp-welcome-ac-menu {
    position: absolute;
    z-index: 5;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    margin: 0;
    padding: 4px 0;
    max-height: 280px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.12);
}

.scp-welcome-ac-group {
    padding: 4px 0 6px;
}

.scp-welcome-ac-group + .scp-welcome-ac-group {
    border-top: 1px solid #eef0f4;
}

.scp-welcome-ac-group-title {
    padding: 6px 12px 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--cfde-blue, #2c5c97);
}

.scp-welcome-ac-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    margin: 0;
    padding: 8px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    text-align: left;
    color: var(--cfde-ink, #33363d);
}

.scp-welcome-ac-item:hover {
    background: #f6f5f2;
}

.scp-welcome-ac-item-label {
    font-weight: 600;
}

.scp-welcome-ac-item-meta {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-welcome-ac-status {
    padding: 8px 12px;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-welcome-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
}

.scp-welcome-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    border: 1px solid rgba(224, 123, 57, 0.35);
    background: rgba(224, 123, 57, 0.1);
    color: #c45f1f;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 12px;
    line-height: 1.3;
    cursor: pointer;
}

.scp-welcome-chip-kind {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 10px;
    opacity: 0.85;
}

.scp-welcome-chip-label {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 280px;
}

.scp-welcome-chip-x {
    font-size: 14px;
    line-height: 1;
    opacity: 0.75;
}

.scp-welcome-option-action {
    background: var(--cfde-orange-soft, #fbeee3);
    border: 1px solid var(--cfde-border, #e6e1d6);
    cursor: pointer;
}

.scp-welcome-option-action:hover:not(:disabled) {
    border-color: var(--cfde-blue, #2c5c97);
}

.scp-welcome-option-action:disabled {
    opacity: 0.5;
    cursor: default;
}

.scp-welcome-option-import {
    background: #fff;
    border: 1px solid var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.scp-welcome-option-import:hover {
    background: var(--cfde-blue, #2c5c97);
}

.scp-welcome-option-import:hover .scp-welcome-option-title,
.scp-welcome-option-import:hover .scp-welcome-option-desc {
    color: #fff;
}

.scp-welcome-option-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.scp-welcome-option-desc {
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}
</style>
