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
            <template v-if="activeModule === 'evaluate'">
                <div class="scp-hyp-card">
                    <div class="scp-hyp-head">
                        <span class="scp-hyp-title">Hypothesis</span>
                        <button type="button" class="scp-hyp-edit" @click="onEditHypothesis">Edit</button>
                    </div>
                    <p class="scp-hyp-text">{{ activeHypothesisText }}</p>
                </div>

                <div
                    v-if="hasKgContent || hasBiomarkerContent"
                    class="scp-module-tabs"
                    role="tablist"
                    aria-label="Module content"
                >
                    <button
                        type="button"
                        role="tab"
                        class="scp-module-tab"
                        :class="{ 'is-active': evaluateContentTab === 'evaluation' }"
                        :aria-selected="evaluateContentTab === 'evaluation' ? 'true' : 'false'"
                        @click="evaluateContentTab = 'evaluation'"
                    >
                        Evaluation
                    </button>
                    <button
                        type="button"
                        role="tab"
                        class="scp-module-tab"
                        :class="{ 'is-active': evaluateContentTab === 'kg' }"
                        :aria-selected="evaluateContentTab === 'kg' ? 'true' : 'false'"
                        @click="evaluateContentTab = 'kg'"
                    >
                        CFDE KG
                    </button>
                    <button
                        v-if="hasBiomarkerContent"
                        type="button"
                        role="tab"
                        class="scp-module-tab"
                        :class="{ 'is-active': evaluateContentTab === 'biomarker' }"
                        :aria-selected="evaluateContentTab === 'biomarker' ? 'true' : 'false'"
                        @click="evaluateContentTab = 'biomarker'"
                    >
                        Biomarker KB
                    </button>
                </div>

                <ScopeEvaluationPanel
                    v-show="!hasKgContent || evaluateContentTab === 'evaluation'"
                    :hypothesis-text="activeHypothesisText"
                    :preloaded-evaluation="pendingImportedEvaluation"
                    @evaluated="onEvaluated"
                    @loading="onEvaluateLoading"
                />
                <ScopeKgEvidenceTable
                    v-if="hasKgContent"
                    v-show="evaluateContentTab === 'kg'"
                    :evidence="kgEvidence"
                    :blocked-reason="kgEvidenceBlockedReason"
                    :relevance-loading="kgRelevanceLoading"
                />
                <ScopeBiomarkerEvidenceTable
                    v-if="hasBiomarkerContent"
                    v-show="evaluateContentTab === 'biomarker'"
                    :evidence="biomarkerEvidence"
                    :blocked-reason="biomarkerEvidenceBlockedReason"
                    :relevance-loading="biomarkerRelevanceLoading"
                />
            </template>
            <ScopeLiteratureLauncher
                v-if="activeModule === 'literature'"
                :hypothesis-text="activeHypothesisText"
                :preloaded-query="pendingImportedLiteratureQuery"
                @query-change="onLiteratureQueryChange"
                @loading="onLiteratureLoading"
            />
            <!-- Central Hypothesis State Hub + Modules A-D mount here -->

            <ScopeActionsPanel
                v-if="showActionsPanel"
                :next-steps="nextStepActions"
                :catalog-actions="catalogActions"
                :initial-tab="actionsPanelInitialTab"
                @run="onRunSuggestedAction"
                @close="onCloseActionsPanel"
            />

            <ScopeProgressOverlay :open="progressOverlayOpen" :steps="progressSteps" />
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
            @import-session="triggerImport"
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
import ScopeKgEvidenceTable from "@/components/researchPortal/customComponents/revealScope/ScopeKgEvidenceTable.vue";
import ScopeBiomarkerEvidenceTable from "@/components/researchPortal/customComponents/revealScope/ScopeBiomarkerEvidenceTable.vue";
import ScopeProgressOverlay from "@/components/researchPortal/customComponents/revealScope/ScopeProgressOverlay.vue";
import { ACTION_CATALOG } from "@/components/researchPortal/customComponents/revealScope/scopeActionsCatalog.js";
import { findKgEvidence } from "@/components/researchPortal/customComponents/revealScope/scopeKgEvidence.js";
import {
    classifyKgEvidenceRelevance,
    mergeRelevanceIntoRoutes,
} from "@/components/researchPortal/customComponents/revealScope/scopeKgRelevance.js";
import { findBiomarkerBridgeEvidence } from "@/components/researchPortal/customComponents/revealScope/scopeBiomarkerBridge.js";
import {
    classifyBiomarkerRelevance,
    mergeBiomarkerRelevance,
} from "@/components/researchPortal/customComponents/revealScope/scopeBiomarkerRelevance.js";
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
        ScopeKgEvidenceTable,
        ScopeBiomarkerEvidenceTable,
        ScopeProgressOverlay,
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
            kgSearchPendingAfterEvaluate: false,
            kgEvidence: null,
            kgEvidenceBlockedReason: null,
            kgRelevanceLoading: false,
            biomarkerEvidence: null,
            biomarkerEvidenceBlockedReason: null,
            biomarkerRelevanceLoading: false,
            evaluateContentTab: "evaluation",
            actionsPopupDismissed: false,
            actionsPanelForcedOpen: false,
            actionsPanelInitialTab: "next",
            exportModalOpen: false,
            defaultExportFilename: "",
            progressOverlayOpen: false,
            progressSteps: [],
        };
    },
    mounted: function () {},
    computed: {
        catalogActions() {
            return ACTION_CATALOG;
        },
        nextStepActions() {
            const canSearchKg = this.ranModules.includes("evaluate") && !this.hasMissingSlots;
            const canSearchBiomarker = Boolean(
                this.kgEvidence && this.kgEvidence.resolvedFactors && this.kgEvidence.resolvedFactors.length
            );
            const list = ACTION_CATALOG.filter((action) => {
                if (action.id === "runKgSearch" || action.id === "runBiomarkerSearch") {
                    return false;
                }
                if (action.id === "runLiterature") {
                    return !this.ranModules.includes("literature");
                }
                if (action.id === "runEvaluate") {
                    return !this.ranModules.includes("evaluate");
                }
                return true;
            });
            if (canSearchBiomarker) {
                const biomarkerAction = ACTION_CATALOG.find((action) => action.id === "runBiomarkerSearch");
                if (biomarkerAction) {
                    list.unshift(biomarkerAction);
                }
            }
            if (canSearchKg) {
                const kgAction = ACTION_CATALOG.find((action) => action.id === "runKgSearch");
                if (kgAction) {
                    list.unshift(kgAction);
                }
            }
            return list;
        },
        hasMissingSlots() {
            return Boolean(
                this.cachedEvaluation &&
                    this.cachedEvaluation.missingRequiredSlots &&
                    this.cachedEvaluation.missingRequiredSlots.length
            );
        },
        hasKgContent() {
            return Boolean(this.kgEvidence || this.kgEvidenceBlockedReason);
        },
        hasBiomarkerContent() {
            return Boolean(this.biomarkerEvidence || this.biomarkerEvidenceBlockedReason);
        },
        showActionsPanel() {
            if (this.actionsPanelForcedOpen) {
                return true;
            }
            return this.hasGeneratedContent && !this.actionsPopupDismissed && !this.hasMissingSlots;
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
                this.kgSearchPendingAfterEvaluate = false;
                this.kgEvidence = null;
                this.kgEvidenceBlockedReason = null;
                this.kgRelevanceLoading = false;
                this.biomarkerEvidence = null;
                this.biomarkerEvidenceBlockedReason = null;
                this.biomarkerRelevanceLoading = false;
                this.evaluateContentTab = "evaluation";
                this.actionsPopupDismissed = false;
                this.actionsPanelForcedOpen = false;
                this.actionsPanelInitialTab = "next";
                this.endProgress();
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
                this.actionsPanelInitialTab = "catalog";
                this.actionsPanelForcedOpen = true;
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
            if (payload.optionId === "evaluateAndSearchKg") {
                this.kgSearchPendingAfterEvaluate = true;
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
            if (actionId === "runKgSearch") {
                this.runSearchKgFromCache();
                return;
            }
            if (actionId === "runBiomarkerSearch") {
                this.runBiomarkerSearchFromCache();
                return;
            }
            if (actionId === "exportSession") {
                this.exportSession();
            }
        },
        runSearchKgFromCache() {
            if (!this.cachedEvaluation) {
                this.kgEvidenceBlockedReason = "Run Evaluate hypothesis first.";
                return;
            }
            if (this.activeModule !== "evaluate") {
                this.pendingImportedEvaluation = this.cachedEvaluation;
                this.activeModule = "evaluate";
                this.$nextTick(() => {
                    this.pendingImportedEvaluation = null;
                });
            }
            this.startKgEvidenceSearch(this.cachedEvaluation);
        },
        runBiomarkerSearchFromCache() {
            if (!this.kgEvidence || !this.kgEvidence.resolvedFactors || !this.kgEvidence.resolvedFactors.length) {
                this.biomarkerEvidenceBlockedReason = "Run Search CFDE KG first.";
                return;
            }
            if (this.activeModule !== "evaluate") {
                this.pendingImportedEvaluation = this.cachedEvaluation;
                this.activeModule = "evaluate";
                this.$nextTick(() => {
                    this.pendingImportedEvaluation = null;
                });
            }
            this.startBiomarkerSearch(this.cachedEvaluation);
        },
        runModule(moduleId) {
            this.hasGeneratedContent = true;
            this.activeModule = moduleId;
            this.kgEvidence = null;
            this.kgEvidenceBlockedReason = null;
            this.kgRelevanceLoading = false;
            this.biomarkerEvidence = null;
            this.biomarkerEvidenceBlockedReason = null;
            this.biomarkerRelevanceLoading = false;
            this.evaluateContentTab = "evaluation";
            this.actionsPopupDismissed = false;
            this.actionsPanelForcedOpen = false;
            this.actionsPanelInitialTab = "next";
            if (!this.ranModules.includes(moduleId)) {
                this.ranModules.push(moduleId);
            }
        },
        onCloseActionsPanel() {
            this.actionsPopupDismissed = true;
            this.actionsPanelForcedOpen = false;
        },
        onEditHypothesis() {
            this.welcomeInitialTab = "start";
            this.welcomeInitialHypothesisText = this.activeHypothesisText;
            this.welcomeOpen = true;
        },
        onEvaluated(evaluation) {
            this.cachedEvaluation = evaluation;
            if (!this.kgSearchPendingAfterEvaluate) {
                return;
            }
            this.kgSearchPendingAfterEvaluate = false;
            this.startKgEvidenceSearch(evaluation);
        },
        onEvaluateLoading(isLoading) {
            if (isLoading) {
                this.beginProgress([{ id: "evaluate", label: "Evaluating hypothesis…" }]);
            } else {
                this.endProgress();
            }
        },
        onLiteratureLoading(isLoading) {
            if (isLoading) {
                this.beginProgress([{ id: "literature", label: "Generating search terms…" }]);
            } else {
                this.endProgress();
            }
        },
        beginProgress(steps) {
            this.progressSteps = steps.map((step, index) => ({
                ...step,
                status: index === 0 ? "active" : "pending",
            }));
            this.progressOverlayOpen = true;
        },
        setStepStatus(stepId, status) {
            const index = this.progressSteps.findIndex((step) => step.id === stepId);
            if (index === -1) return;
            this.progressSteps.splice(index, 1, { ...this.progressSteps[index], status });
            if (status === "done" && this.progressSteps[index + 1]) {
                this.progressSteps.splice(index + 1, 1, {
                    ...this.progressSteps[index + 1],
                    status: "active",
                });
            }
        },
        endProgress() {
            this.progressOverlayOpen = false;
            this.progressSteps = [];
        },
        async startKgEvidenceSearch(evaluation) {
            const targetText = evaluation.slots.target.value;
            const targetResolvedId = evaluation.slots.target.resolvedId;
            const outcomeText = evaluation.slots.outcome.value;
            const outcomeResolvedId = evaluation.slots.outcome.resolvedId;
            this.evaluateContentTab = "kg";
            if (!targetText || !outcomeText) {
                this.kgEvidenceBlockedReason =
                    "Can't search the CFDE KG yet — the evaluation didn't identify a specific " +
                    "target and outcome. Fix the hypothesis (Edit) and try again.";
                return;
            }
            this.kgEvidenceBlockedReason = null;
            this.beginProgress([
                { id: "resolveFactors", label: "Resolving mechanism via biomarker search…" },
                { id: "queryRoutes", label: "Querying CFDE KG (3 evidence routes)…" },
            ]);
            try {
                this.kgEvidence = await findKgEvidence({
                    targetText,
                    targetResolvedId,
                    outcomeText,
                    outcomeResolvedId,
                    onStep: this.setStepStatus,
                });
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[reveal-scope] CFDE KG search failed", error);
                this.kgEvidenceBlockedReason = "CFDE KG search failed. Try again.";
                this.endProgress();
                return;
            }
            // Table renders now (kgEvidence is set) — the relevance triage below runs
            // as a background enrichment pass, not inside the blocking progress overlay.
            this.endProgress();
            this.runKgRelevanceTriage(evaluation);
        },
        async runKgRelevanceTriage(evaluation) {
            const kgEvidenceAtStart = this.kgEvidence;
            this.kgRelevanceLoading = true;
            try {
                const classifications = await classifyKgEvidenceRelevance({
                    hypothesisText: this.activeHypothesisText,
                    targetText: evaluation.slots.target.value,
                    targetResolvedId: evaluation.slots.target.resolvedId,
                    outcomeText: evaluation.slots.outcome.value,
                    outcomeResolvedId: evaluation.slots.outcome.resolvedId,
                    tissue: evaluation.slots.modifiers.tissue.value,
                    cellLine: evaluation.slots.modifiers.cell_line.value,
                    routes: kgEvidenceAtStart.routes,
                });
                // Bail if the user navigated away / re-ran something else while this was in flight.
                if (this.kgEvidence !== kgEvidenceAtStart || !classifications.length) {
                    return;
                }
                this.kgEvidence = {
                    ...this.kgEvidence,
                    routes: mergeRelevanceIntoRoutes(this.kgEvidence.routes, classifications),
                };
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[reveal-scope] KG relevance triage failed, showing unlabeled results", error);
            } finally {
                this.kgRelevanceLoading = false;
            }
        },
        async startBiomarkerSearch(evaluation) {
            this.evaluateContentTab = "biomarker";
            const resolvedFactors = this.kgEvidence && this.kgEvidence.resolvedFactors;
            if (!resolvedFactors || !resolvedFactors.length) {
                this.biomarkerEvidenceBlockedReason =
                    "Can't search Biomarker KB yet — no mechanism factor was resolved by the CFDE KG search. " +
                    "Run Search CFDE KG first.";
                return;
            }
            this.biomarkerEvidenceBlockedReason = null;
            const targetGeneSymbol = evaluation.slots.target.resolvedId || evaluation.slots.target.value;
            this.beginProgress([
                { id: "findDiseases", label: "Finding diseases sharing genes with the resolved mechanism…" },
                { id: "queryBiomarkers", label: "Querying Biomarker KB…" },
            ]);
            try {
                this.biomarkerEvidence = await findBiomarkerBridgeEvidence({
                    resolvedFactors,
                    targetGeneSymbol,
                    onStep: this.setStepStatus,
                });
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[reveal-scope] Biomarker KB search failed", error);
                this.biomarkerEvidenceBlockedReason = "Biomarker KB search failed. Try again.";
                this.endProgress();
                return;
            }
            this.endProgress();
            this.runBiomarkerRelevanceTriage(evaluation);
        },
        async runBiomarkerRelevanceTriage(evaluation) {
            const biomarkerEvidenceAtStart = this.biomarkerEvidence;
            this.biomarkerRelevanceLoading = true;
            try {
                const classifications = await classifyBiomarkerRelevance({
                    hypothesisText: this.activeHypothesisText,
                    targetText: evaluation.slots.target.value,
                    targetResolvedId: evaluation.slots.target.resolvedId,
                    outcomeText: evaluation.slots.outcome.value,
                    outcomeResolvedId: evaluation.slots.outcome.resolvedId,
                    biomarkers: biomarkerEvidenceAtStart.biomarkers,
                });
                if (this.biomarkerEvidence !== biomarkerEvidenceAtStart || !classifications.length) {
                    return;
                }
                this.biomarkerEvidence = {
                    ...this.biomarkerEvidence,
                    biomarkers: mergeBiomarkerRelevance(this.biomarkerEvidence.biomarkers, classifications),
                };
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[reveal-scope] Biomarker relevance triage failed, showing unlabeled results", error);
            } finally {
                this.biomarkerRelevanceLoading = false;
            }
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
                kgEvidence: this.kgEvidence,
                kgBlockedReason: this.kgEvidenceBlockedReason,
                biomarkerEvidence: this.biomarkerEvidence,
                biomarkerBlockedReason: this.biomarkerEvidenceBlockedReason,
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
                    this.kgEvidence = session.kgEvidence;
                    this.kgEvidenceBlockedReason = session.kgBlockedReason;
                    this.biomarkerEvidence = session.biomarkerEvidence;
                    this.biomarkerEvidenceBlockedReason = session.biomarkerBlockedReason;
                    this.evaluateContentTab =
                        session.biomarkerEvidence || session.biomarkerBlockedReason
                            ? "biomarker"
                            : session.kgEvidence || session.kgBlockedReason
                            ? "kg"
                            : "evaluation";
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

.scp-hyp-card {
    margin: 18px 18px 0;
    padding: 14px 16px;
    border-radius: 10px;
    background: #fff;
}

.scp-hyp-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
}

.scp-hyp-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue);
}

.scp-hyp-edit {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
}

.scp-hyp-edit:hover {
    color: var(--cfde-orange);
}

.scp-hyp-text {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink);
}

.scp-module-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 15px 18px 0;
}

.scp-module-tab {
    margin: 0;
    border: 1px solid var(--cfde-border);
    border-radius: 6px 6px 0 0;
    background: var(--cfde-bg);
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: var(--cfde-ink);
}

.scp-module-tab.is-active {
    background: #ffffff;
    border-bottom-color: #ffffff;
    color: var(--cfde-orange);
}
</style>
