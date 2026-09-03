<template>
    <div class="reveal-scope">
        <header class="rs-header">
            <div class="rs-brand">
                <span class="rs-mark">REVEAL</span>
                <span class="rs-title">SCOPE</span>
            </div>
            <ScopeMenuBar @action="onMenuAction" />
        </header>

        <div class="rs-stage">
            <ScopeEvaluationPanel
                v-if="activeModule === 'evaluate'"
                :hypothesis-text="activeHypothesisText"
                :preloaded-evaluation="pendingImportedEvaluation"
                @edit="onEditHypothesis"
                @evaluated="onEvaluated"
            />
            <ScopeLiteratureLauncher
                v-if="activeModule === 'literature'"
                :hypothesis-text="activeHypothesisText"
                :preloaded-query="pendingImportedLiteratureQuery"
                @query-change="onLiteratureQueryChange"
            />
            <!-- Central Hypothesis State Hub + Modules A-D mount here -->

            <ScopeActionsPanel
                v-if="hasGeneratedContent && !actionsPopupDismissed && !hasMissingSlots"
                :next-steps="nextStepActions"
                :catalog-actions="catalogActions"
                @run="onRunSuggestedAction"
                @close="actionsPopupDismissed = true"
            />
        </div>

        <input
            ref="importFileInput"
            type="file"
            accept="application/json"
            class="rs-import-input"
            @change="onImportFileChange"
        />

        <ScopeWelcomePanel
            :open="welcomeOpen"
            :initial-tab="welcomeInitialTab"
            :initial-hypothesis-text="welcomeInitialHypothesisText"
            :dismissible="hasGeneratedContent"
            @select-option="onWelcomeSelectOption"
            @close="welcomeOpen = false"
        />

        <ScopeExportSessionModal
            :open="exportModalOpen"
            :default-filename="defaultExportFilename"
            @save="onConfirmExport"
            @close="exportModalOpen = false"
        />
    </div>
</template>

<script>
import Vue from "vue";
import ScopeMenuBar from "@/components/researchPortal/customComponents/revealScope/ScopeMenuBar.vue";
import ScopeWelcomePanel from "@/components/researchPortal/customComponents/revealScope/ScopeWelcomePanel.vue";
import ScopeLiteratureLauncher from "@/components/researchPortal/customComponents/revealScope/ScopeLiteratureLauncher.vue";
import ScopeEvaluationPanel from "@/components/researchPortal/customComponents/revealScope/ScopeEvaluationPanel.vue";
import ScopeActionsPanel from "@/components/researchPortal/customComponents/revealScope/ScopeActionsPanel.vue";
import ScopeExportSessionModal from "@/components/researchPortal/customComponents/revealScope/ScopeExportSessionModal.vue";
import { ACTION_CATALOG } from "@/components/researchPortal/customComponents/revealScope/scopeActionsCatalog.js";
import {
    buildSessionExport,
    saveSessionFile,
    defaultSessionFilename,
    parseSessionImport,
} from "@/components/researchPortal/customComponents/revealScope/scopeSessionFile.js";

export default Vue.component("reveal-scope", {
    components: {
        ScopeMenuBar,
        ScopeWelcomePanel,
        ScopeLiteratureLauncher,
        ScopeEvaluationPanel,
        ScopeActionsPanel,
        ScopeExportSessionModal,
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
            welcomeInitialTab: "start",
            welcomeInitialHypothesisText: "",
            hasGeneratedContent: false,
            activeModule: null,
            activeHypothesisText: "",
            ranModules: [],
            cachedEvaluation: null,
            cachedLiteratureQuery: null,
            pendingImportedEvaluation: null,
            pendingImportedLiteratureQuery: null,
            actionsPopupDismissed: false,
            exportModalOpen: false,
            defaultExportFilename: "",
        };
    },
    mounted: function () {},
    computed: {
        catalogActions() {
            return ACTION_CATALOG;
        },
        nextStepActions() {
            return ACTION_CATALOG.filter((action) => {
                if (action.id === "runLiterature") {
                    return !this.ranModules.includes("literature");
                }
                if (action.id === "runEvaluate") {
                    return !this.ranModules.includes("evaluate");
                }
                return true;
            });
        },
        hasMissingSlots() {
            return Boolean(
                this.cachedEvaluation &&
                    this.cachedEvaluation.missingRequiredSlots &&
                    this.cachedEvaluation.missingRequiredSlots.length
            );
        },
    },
    watch: {},
    methods: {
        onMenuAction(payload) {
            if (payload.menu === "session" && payload.action === "resetSession") {
                this.welcomeInitialTab = "start";
                this.welcomeInitialHypothesisText = "";
                this.welcomeOpen = true;
                this.hasGeneratedContent = false;
                this.activeModule = null;
                this.activeHypothesisText = "";
                this.ranModules = [];
                this.cachedEvaluation = null;
                this.cachedLiteratureQuery = null;
                this.actionsPopupDismissed = false;
                return;
            }
            if (payload.menu === "help" && payload.action === "learnScope") {
                this.welcomeInitialTab = "learn";
                this.welcomeOpen = true;
                return;
            }
            if (payload.menu === "session" && payload.action === "exportSession") {
                this.exportSession();
                return;
            }
            if (payload.menu === "session" && payload.action === "importSession") {
                this.triggerImport();
                return;
            }
            if (payload.menu === "actions") {
                this.onRunSuggestedAction(payload.action);
                return;
            }
            // eslint-disable-next-line no-console
            console.log("reveal-scope menu action", payload);
        },
        onWelcomeSelectOption(payload) {
            this.activeHypothesisText = payload.hypothesisText;
            if (payload.optionId === "searchLiterature") {
                this.runModule("literature");
                return;
            }
            if (payload.optionId === "evaluateHypothesis") {
                this.runModule("evaluate");
                return;
            }
            // eslint-disable-next-line no-console
            console.log("reveal-scope welcome option selected", payload);
        },
        onRunSuggestedAction(actionId) {
            if (actionId === "runEvaluate") {
                this.runModule("evaluate");
                return;
            }
            if (actionId === "runLiterature") {
                this.runModule("literature");
                return;
            }
            if (actionId === "exportSession") {
                this.exportSession();
            }
        },
        runModule(moduleId) {
            this.hasGeneratedContent = true;
            this.activeModule = moduleId;
            this.actionsPopupDismissed = false;
            if (!this.ranModules.includes(moduleId)) {
                this.ranModules.push(moduleId);
            }
        },
        onEditHypothesis() {
            this.welcomeInitialTab = "start";
            this.welcomeInitialHypothesisText = this.activeHypothesisText;
            this.welcomeOpen = true;
        },
        onEvaluated(evaluation) {
            this.cachedEvaluation = evaluation;
        },
        onLiteratureQueryChange(query) {
            this.cachedLiteratureQuery = query;
        },
        exportSession() {
            this.defaultExportFilename = defaultSessionFilename();
            this.exportModalOpen = true;
        },
        onConfirmExport(filename) {
            const sessionData = buildSessionExport({
                hypothesisText: this.activeHypothesisText,
                ranModules: this.ranModules,
                evaluation: this.cachedEvaluation,
                literatureQuery: this.cachedLiteratureQuery,
            });
            saveSessionFile(sessionData, filename);
            this.exportModalOpen = false;
        },
        triggerImport() {
            this.$refs.importFileInput.click();
        },
        onImportFileChange(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const session = parseSessionImport(reader.result);
                    this.activeHypothesisText = session.hypothesisText;
                    this.ranModules = session.ranModules;
                    this.hasGeneratedContent = session.ranModules.length > 0;
                    this.cachedEvaluation = session.evaluation;
                    this.cachedLiteratureQuery = session.literatureQuery;
                    this.pendingImportedEvaluation = session.evaluation;
                    this.pendingImportedLiteratureQuery = session.literatureQuery;
                    if (session.ranModules.includes("evaluate")) {
                        this.activeModule = "evaluate";
                        this.welcomeOpen = false;
                    } else if (session.ranModules.includes("literature")) {
                        this.activeModule = "literature";
                        this.welcomeOpen = false;
                    } else {
                        this.activeModule = null;
                        this.welcomeInitialTab = "start";
                        this.welcomeInitialHypothesisText = session.hypothesisText;
                        this.welcomeOpen = true;
                    }
                    this.$nextTick(() => {
                        this.pendingImportedEvaluation = null;
                        this.pendingImportedLiteratureQuery = null;
                    });
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.warn("[reveal-scope] failed to import session", error);
                } finally {
                    event.target.value = "";
                }
            };
            reader.readAsText(file);
        },
    },
});
</script>

<style>
.reveal-scope {
    --cfde-orange: #e07b39;
    --cfde-orange-dark: #c2662b;
    --cfde-orange-soft: #fbeee3;
    --cfde-blue: #2c5c97;
    --cfde-border: #e6e1d6;
    --cfde-bg: #f6f5f2;
    --cfde-ink: #33363d;
    --cfde-muted: #6b6b6b;

    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
    color: var(--cfde-ink);
}

.rs-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 0 18px 12px 18px;
    border-bottom: 1px solid var(--cfde-border);
    background: #ffffff;
}

.rs-brand {
    display: flex;
    align-items: baseline;
    gap: 7px;
}

.rs-mark {
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cfde-orange);
    font-size: 1.05rem;
}

.rs-title {
    font-weight: 600;
    color: var(--cfde-blue);
    font-size: 1.05rem;
}

.rs-stage {
    position: relative;
    flex: 1;
    overflow: auto;
    background: var(--cfde-bg);
}

.rs-import-input {
    display: none;
}
</style>
