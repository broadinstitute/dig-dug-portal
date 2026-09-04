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
                    <span class="scp-welcome-option-title">Hypothesis</span>
                    <textarea
                        v-model="hypothesisText"
                        class="scp-welcome-textarea"
                        rows="4"
                        placeholder="e.g. Knocking down GENE1 in HepG2 cells reduces expression of GENE2 under hypoxia"
                    ></textarea>
                </div>

                <div class="scp-welcome-options">
                    <button
                        type="button"
                        class="scp-welcome-option scp-welcome-option-action"
                        :disabled="!hypothesisText.trim()"
                        @click="onOptionSelect('evaluateHypothesis')"
                    >
                        <span class="scp-welcome-option-title">Evaluate hypothesis</span>
                        <span class="scp-welcome-option-desc">
                            Checks the hypothesis for precision and falsifiability and shows the
                            parsed target, perturbation, and outcome. Flags anything it can't
                            confidently score instead of guessing.
                        </span>
                    </button>
                    <button
                        type="button"
                        class="scp-welcome-option scp-welcome-option-action"
                        :disabled="!hypothesisText.trim()"
                        @click="onOptionSelect('searchLiterature')"
                    >
                        <span class="scp-welcome-option-title">Search literature</span>
                        <span class="scp-welcome-option-desc">
                            Turns the hypothesis into an editable PubMed search query. You review
                            and edit before clicking through.
                        </span>
                    </button>
                    <button
                        type="button"
                        class="scp-welcome-option scp-welcome-option-action"
                        :disabled="!hypothesisText.trim()"
                        @click="onOptionSelect('evaluateAndSearchKg')"
                    >
                        <span class="scp-welcome-option-title">Evaluate hypothesis + Search CFDE KG</span>
                        <span class="scp-welcome-option-desc">
                            Scores the hypothesis first, then searches the CFDE knowledge graph
                            for gene–trait evidence using the parsed target and outcome.
                        </span>
                    </button>
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
                return value === "start" || value === "learn";
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
            hypothesisText: this.initialHypothesisText,
        };
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
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onOptionSelect(optionId) {
            const text = this.hypothesisText.trim();
            if (!text) {
                return;
            }
            this.$emit("select-option", { optionId, hypothesisText: text });
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
    width: min(520px, 100%);
    max-height: min(90vh, 720px);
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

.scp-welcome-textarea {
    width: 100%;
    resize: vertical;
    font-size: 13px;
    font-family: inherit;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fff;
}
</style>
