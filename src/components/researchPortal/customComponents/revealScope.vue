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
                    v-if="showContentTabs"
                    class="scp-module-tabs"
                    role="tablist"
                    aria-label="Module content"
                >
                    <button
                        v-if="showEvaluationTab"
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
                        v-if="hasKgContent"
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
                    <button
                        v-if="hasLiteratureContent"
                        type="button"
                        role="tab"
                        class="scp-module-tab"
                        :class="{ 'is-active': evaluateContentTab === 'explore' }"
                        :aria-selected="evaluateContentTab === 'explore' ? 'true' : 'false'"
                        @click="evaluateContentTab = 'explore'"
                    >
                        Explore options
                    </button>
                </div>

                <ScopeEvaluationPanel
                    v-if="showEvaluationTab"
                    v-show="!showContentTabs || evaluateContentTab === 'evaluation'"
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
                    :network-graph="kgNetworkGraph"
                />
                <ScopeBiomarkerEvidenceTable
                    v-if="hasBiomarkerContent"
                    v-show="evaluateContentTab === 'biomarker'"
                    :evidence="biomarkerEvidence"
                    :blocked-reason="biomarkerEvidenceBlockedReason"
                    :relevance-loading="biomarkerRelevanceLoading"
                />
                <ScopeLiteratureLauncher
                    v-if="hasLiteratureContent"
                    v-show="!showContentTabs || evaluateContentTab === 'explore'"
                    :hypothesis-text="activeHypothesisText"
                    :preloaded-query="pendingImportedLiteratureQuery"
                    @query-change="onLiteratureQueryChange"
                    @loading="onLiteratureLoading"
                />
            </template>
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
    </div>
</template>

<script>
import Vue from "vue";
import ScopeMenuBar from "@/components/researchPortal/customComponents/revealScope/ScopeMenuBar.vue";
import ScopeWelcomePanel from "@/components/researchPortal/customComponents/revealScope/ScopeWelcomePanel.vue";
import ScopeLiteratureLauncher from "@/components/researchPortal/customComponents/revealScope/ScopeLiteratureLauncher.vue";
import ScopeEvaluationPanel from "@/components/researchPortal/customComponents/revealScope/ScopeEvaluationPanel.vue";
import ScopeActionsPanel from "@/components/researchPortal/customComponents/revealScope/ScopeActionsPanel.vue";
import ScopeKgEvidenceTable from "@/components/researchPortal/customComponents/revealScope/ScopeKgEvidenceTable.vue";
import ScopeBiomarkerEvidenceTable from "@/components/researchPortal/customComponents/revealScope/ScopeBiomarkerEvidenceTable.vue";
import ScopeProgressOverlay from "@/components/researchPortal/customComponents/revealScope/ScopeProgressOverlay.vue";
import { ACTION_CATALOG } from "@/components/researchPortal/customComponents/revealScope/scopeActionsCatalog.js";
import { findKgEvidence, resolveMechanismFactors } from "@/components/researchPortal/customComponents/revealScope/scopeKgEvidence.js";
import { buildKgNetworkGraph } from "@/components/researchPortal/customComponents/revealScope/scopeKgNetworkGraph.js";
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
import { buildDesignHandoffUrl } from "@/components/researchPortal/customComponents/revealScope/scopeDesignHandoff.js";

export default Vue.component("reveal-scope", {
    components: {
        ScopeMenuBar,
        ScopeWelcomePanel,
        ScopeLiteratureLauncher,
        ScopeEvaluationPanel,
        ScopeActionsPanel,
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
            kgNetworkGraph: null,
            biomarkerEvidence: null,
            biomarkerEvidenceBlockedReason: null,
            biomarkerRelevanceLoading: false,
            evaluateContentTab: "evaluation",
            actionsPopupDismissed: false,
            actionsPanelForcedOpen: false,
            actionsPanelInitialTab: "next",
            progressOverlayOpen: false,
            progressSteps: [],
        };
    },
    mounted: function () {},
    computed: {
        isEvaluateDone() {
            return Boolean(this.cachedEvaluation);
        },
        isLiteratureDone() {
            return this.ranModules.includes("literature");
        },
        catalogActions() {
            return ACTION_CATALOG.filter((action) => {
                if (action.id === "runEvaluate") {
                    return !this.isEvaluateDone;
                }
                if (action.id === "runLiterature") {
                    return !this.isLiteratureDone;
                }
                if (action.id === "runKgSearch") {
                    return !this.hasKgContent;
                }
                if (action.id === "runBiomarkerSearch") {
                    return !this.hasBiomarkerContent;
                }
                if (action.id === "classifyKgRelevance") {
                    return this.canClassifyKgRelevance;
                }
                if (action.id === "classifyBiomarkerRelevance") {
                    return this.canClassifyBiomarkerRelevance;
                }
                if (action.id === "designExperimentProtocol") {
                    return this.isEvaluateDone;
                }
                return true;
            });
        },
        nextStepActions() {
            const canSearchKg = this.ranModules.includes("evaluate") && !this.hasMissingSlots && !this.hasKgContent;
            const canSearchBiomarker =
                this.ranModules.includes("evaluate") && !this.hasMissingSlots && !this.hasBiomarkerContent;
            const list = ACTION_CATALOG.filter((action) => {
                if (
                    action.id === "runKgSearch" ||
                    action.id === "runBiomarkerSearch" ||
                    action.id === "classifyKgRelevance" ||
                    action.id === "classifyBiomarkerRelevance"
                ) {
                    return false;
                }
                if (action.id === "runLiterature") {
                    return !this.isLiteratureDone;
                }
                if (action.id === "runEvaluate") {
                    return !this.isEvaluateDone;
                }
                if (action.id === "designExperimentProtocol") {
                    return this.isEvaluateDone;
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
            if (this.canClassifyKgRelevance) {
                const classifyKgAction = ACTION_CATALOG.find((action) => action.id === "classifyKgRelevance");
                if (classifyKgAction) {
                    list.unshift(classifyKgAction);
                }
            }
            if (this.canClassifyBiomarkerRelevance) {
                const classifyAction = ACTION_CATALOG.find((action) => action.id === "classifyBiomarkerRelevance");
                if (classifyAction) {
                    list.unshift(classifyAction);
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
        hasKgRelevance() {
            const routes = this.kgEvidence && this.kgEvidence.routes;
            if (!Array.isArray(routes)) return false;
            return routes.some(
                (route) =>
                    Array.isArray(route.edges) && route.edges.some((edge) => edge && edge.relevance)
            );
        },
        canClassifyKgRelevance() {
            const routes = this.kgEvidence && this.kgEvidence.routes;
            const hasEdges =
                Array.isArray(routes) &&
                routes.some((route) => Array.isArray(route.edges) && route.edges.length);
            return Boolean(hasEdges && !this.hasKgRelevance && !this.kgRelevanceLoading);
        },
        hasBiomarkerContent() {
            return Boolean(this.biomarkerEvidence || this.biomarkerEvidenceBlockedReason);
        },
        hasBiomarkerRelevance() {
            const biomarkers = this.biomarkerEvidence && this.biomarkerEvidence.biomarkers;
            return Boolean(Array.isArray(biomarkers) && biomarkers.some((b) => b && b.relevance));
        },
        canClassifyBiomarkerRelevance() {
            const biomarkers = this.biomarkerEvidence && this.biomarkerEvidence.biomarkers;
            return (
                Boolean(Array.isArray(biomarkers) && biomarkers.length) &&
                !this.hasBiomarkerRelevance &&
                !this.biomarkerRelevanceLoading
            );
        },
        hasLiteratureContent() {
            return this.ranModules.includes("literature") || Boolean(this.cachedLiteratureQuery);
        },
        showEvaluationTab() {
            return (
                this.ranModules.includes("evaluate") ||
                Boolean(this.cachedEvaluation) ||
                this.hasKgContent ||
                this.hasBiomarkerContent
            );
        },
        showContentTabs() {
            const tabCount =
                (this.showEvaluationTab ? 1 : 0) +
                (this.hasKgContent ? 1 : 0) +
                (this.hasBiomarkerContent ? 1 : 0) +
                (this.hasLiteratureContent ? 1 : 0);
            return tabCount >= 2;
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
                this.kgNetworkGraph = null;
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
            // A hypothesis-text edit invalidates every prior module output — without this,
            // an edited hypothesis would keep hiding Actions-panel options as "already done"
            // for a hypothesis that no longer matches what's on screen.
            if (payload.hypothesisText !== this.activeHypothesisText) {
                this.ranModules = [];
                this.cachedEvaluation = null;
                this.cachedLiteratureQuery = null;
                this.kgEvidence = null;
                this.kgEvidenceBlockedReason = null;
                this.kgNetworkGraph = null;
                this.biomarkerEvidence = null;
                this.biomarkerEvidenceBlockedReason = null;
            }
            this.activeHypothesisText = payload.hypothesisText;
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
                this.runLiteratureSearch();
                return;
            }
            if (actionId === "runKgSearch") {
                this.runSearchKgFromCache();
                return;
            }
            if (actionId === "classifyKgRelevance") {
                this.runKgRelevanceFromCache();
                return;
            }
            if (actionId === "runBiomarkerSearch") {
                this.runBiomarkerSearchFromCache();
                return;
            }
            if (actionId === "classifyBiomarkerRelevance") {
                this.runBiomarkerRelevanceFromCache();
                return;
            }
            if (actionId === "designExperimentProtocol") {
                this.openDesignExperimentProtocol();
                return;
            }
            if (actionId === "exportSession") {
                this.exportSession();
            }
        },
        openDesignExperimentProtocol() {
            if (!this.cachedEvaluation) {
                return;
            }
            const url = buildDesignHandoffUrl({
                hypothesisText: this.activeHypothesisText,
                evaluation: this.cachedEvaluation,
            });
            window.open(url, "_blank", "noopener");
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
            if (!this.cachedEvaluation) {
                this.biomarkerEvidenceBlockedReason = "Run Evaluate hypothesis first.";
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
        runLiteratureSearch() {
            // Keep Evaluation / CFDE KG / Biomarker KB in place — literature is an Explore
            // options tab inside the evaluate workspace, not a module swap that clears them.
            this.hasGeneratedContent = true;
            if (!this.ranModules.includes("literature")) {
                this.ranModules.push("literature");
            }
            if (this.activeModule !== "evaluate") {
                if (this.cachedEvaluation) {
                    this.pendingImportedEvaluation = this.cachedEvaluation;
                }
                this.activeModule = "evaluate";
                this.$nextTick(() => {
                    this.pendingImportedEvaluation = null;
                });
            }
            this.evaluateContentTab = "explore";
            this.actionsPopupDismissed = false;
            this.actionsPanelForcedOpen = false;
            this.actionsPanelInitialTab = "next";
        },
        runModule(moduleId) {
            this.hasGeneratedContent = true;
            this.activeModule = moduleId;
            this.kgEvidence = null;
            this.kgEvidenceBlockedReason = null;
            this.kgRelevanceLoading = false;
            this.kgNetworkGraph = null;
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
                this.beginProgress([{ id: "evaluate", label: "Evaluating the hypothesis." }]);
            } else {
                this.endProgress();
            }
        },
        onLiteratureLoading(isLoading) {
            if (isLoading) {
                this.beginProgress([{ id: "literature", label: "Generating PubMed search terms." }]);
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
                this.kgNetworkGraph = null;
                return;
            }
            this.kgEvidenceBlockedReason = null;
            this.kgNetworkGraph = null;
            this.beginProgress([
                { id: "resolveFactors", label: "Finding the top 25 mechanism candidates for the hypothesis outcome." },
                { id: "selectFactor", label: "Selecting up to 5 mechanisms most relevant to the hypothesis." },
                { id: "queryRoutes", label: "Querying the CFDE KG across the three evidence routes." },
                { id: "buildNetwork", label: "Building the Gene / Gene set / Factor / Trait network." },
            ]);
            try {
                this.kgEvidence = await findKgEvidence({
                    targetText,
                    targetResolvedId,
                    outcomeText,
                    outcomeResolvedId,
                    hypothesisText: this.activeHypothesisText,
                    onStep: this.setStepStatus,
                });
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[reveal-scope] CFDE KG search failed", error);
                this.kgEvidenceBlockedReason = "CFDE KG search failed. Try again.";
                this.endProgress();
                return;
            }
            try {
                this.kgNetworkGraph = await buildKgNetworkGraph(this.kgEvidence);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[reveal-scope] KG network graph build failed, showing routes without it", error);
                this.kgNetworkGraph = null;
            }
            this.setStepStatus("buildNetwork", "done");
            this.endProgress();
            // Relevance triage is optional — offer it as a top Next step after fetch.
            this.actionsPopupDismissed = false;
            this.actionsPanelForcedOpen = true;
            this.actionsPanelInitialTab = "next";
        },
        runKgRelevanceFromCache() {
            if (!this.canClassifyKgRelevance || !this.cachedEvaluation) {
                return;
            }
            this.evaluateContentTab = "kg";
            this.runKgRelevanceTriage(this.cachedEvaluation);
        },
        async runKgRelevanceTriage(evaluation) {
            const kgEvidenceAtStart = this.kgEvidence;
            if (
                !kgEvidenceAtStart ||
                !Array.isArray(kgEvidenceAtStart.routes) ||
                !kgEvidenceAtStart.routes.some((route) => route.edges && route.edges.length)
            ) {
                return;
            }
            this.kgRelevanceLoading = true;
            this.beginProgress([
                { id: "classifyKgRelevance", label: "Classifying CFDE KG evidence relevance to the hypothesis." },
            ]);
            this.setStepStatus("classifyKgRelevance", "active");
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
                this.setStepStatus("classifyKgRelevance", "done");
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[reveal-scope] KG relevance triage failed, showing unlabeled results", error);
                this.setStepStatus("classifyKgRelevance", "error");
            } finally {
                this.kgRelevanceLoading = false;
                this.endProgress();
            }
        },
        async startBiomarkerSearch(evaluation) {
            this.evaluateContentTab = "biomarker";
            this.biomarkerEvidenceBlockedReason = null;
            const targetGeneSymbol = evaluation.slots.target.resolvedId || evaluation.slots.target.value;
            const outcomeText = evaluation.slots.outcome && evaluation.slots.outcome.value;
            if (!targetGeneSymbol || !outcomeText) {
                this.biomarkerEvidenceBlockedReason =
                    "Can't discover mechanism-linked biomarkers yet — the evaluation didn't identify a specific " +
                    "target and outcome. Fix the hypothesis (Edit) and try again.";
                return;
            }

            let resolvedFactors = this.kgEvidence && this.kgEvidence.resolvedFactors;
            const progressSteps = [];
            const needsMechanismResolve = !(resolvedFactors && resolvedFactors.length);
            if (needsMechanismResolve) {
                progressSteps.push(
                    {
                        id: "resolveFactors",
                        label: "Finding the top 25 mechanism candidates for the hypothesis outcome.",
                    },
                    {
                        id: "selectFactor",
                        label: "Selecting up to 5 mechanisms most relevant to the hypothesis.",
                    }
                );
            }
            progressSteps.push(
                {
                    id: "findDiseases",
                    label: "Finding diseases that share genes with the hypothesis mechanism.",
                },
                {
                    id: "mapSharedGenes",
                    label: "Mapping shared genes between the mechanism and those diseases.",
                },
                {
                    id: "queryBiomarkers",
                    label: "Fetching BiomarkerKB biomarkers linked to those diseases.",
                }
            );
            this.beginProgress(progressSteps);

            if (needsMechanismResolve) {
                try {
                    const resolved = await resolveMechanismFactors({
                        hypothesisText: this.activeHypothesisText,
                        targetText: evaluation.slots.target.value,
                        targetResolvedId: evaluation.slots.target.resolvedId,
                        outcomeText,
                        outcomeResolvedId: evaluation.slots.outcome.resolvedId,
                        onStep: this.setStepStatus,
                    });
                    resolvedFactors = resolved.resolvedFactors;
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.warn("[reveal-scope] Mechanism resolve for Biomarker search failed", error);
                    this.biomarkerEvidenceBlockedReason =
                        "Couldn't resolve a mechanism for biomarker discovery. Try again.";
                    this.endProgress();
                    return;
                }
            }

            if (!resolvedFactors || !resolvedFactors.length) {
                this.biomarkerEvidenceBlockedReason =
                    "Can't discover mechanism-linked biomarkers — no mechanism Factor matched the hypothesis outcome.";
                this.endProgress();
                return;
            }

            try {
                this.biomarkerEvidence = await findBiomarkerBridgeEvidence({
                    resolvedFactors,
                    targetGeneSymbol,
                    onStep: this.setStepStatus,
                });
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[reveal-scope] Biomarker KB search failed", error);
                this.biomarkerEvidenceBlockedReason = "Mechanism-linked biomarker search failed. Try again.";
                this.endProgress();
                return;
            }
            this.endProgress();
            // Relevance triage is optional — offer it as the top Next step after fetch.
            this.actionsPopupDismissed = false;
            this.actionsPanelForcedOpen = true;
            this.actionsPanelInitialTab = "next";
        },
        runBiomarkerRelevanceFromCache() {
            if (!this.canClassifyBiomarkerRelevance || !this.cachedEvaluation) {
                return;
            }
            this.evaluateContentTab = "biomarker";
            this.runBiomarkerRelevanceTriage(this.cachedEvaluation);
        },
        async runBiomarkerRelevanceTriage(evaluation) {
            const biomarkerEvidenceAtStart = this.biomarkerEvidence;
            if (
                !biomarkerEvidenceAtStart ||
                !Array.isArray(biomarkerEvidenceAtStart.biomarkers) ||
                !biomarkerEvidenceAtStart.biomarkers.length
            ) {
                return;
            }
            this.biomarkerRelevanceLoading = true;
            this.beginProgress([
                { id: "classifyRelevance", label: "Classifying biomarker relevance to the hypothesis." },
            ]);
            this.setStepStatus("classifyRelevance", "active");
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
                this.setStepStatus("classifyRelevance", "done");
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[reveal-scope] Biomarker relevance triage failed, showing unlabeled results", error);
                this.setStepStatus("classifyRelevance", "error");
            } finally {
                this.biomarkerRelevanceLoading = false;
                this.endProgress();
            }
        },
        onLiteratureQueryChange(query) {
            this.cachedLiteratureQuery = query;
        },
        exportSession() {
            const sessionData = buildSessionExport({
                hypothesisText: this.activeHypothesisText,
                ranModules: this.ranModules,
                evaluation: this.cachedEvaluation,
                literatureQuery: this.cachedLiteratureQuery,
                kgEvidence: this.kgEvidence,
                kgBlockedReason: this.kgEvidenceBlockedReason,
                kgNetworkGraph: this.kgNetworkGraph,
                biomarkerEvidence: this.biomarkerEvidence,
                biomarkerBlockedReason: this.biomarkerEvidenceBlockedReason,
            });
            saveSessionFile(sessionData, defaultSessionFilename());
        },
        async rebuildKgNetworkGraphFromEvidence() {
            const evidenceAtStart = this.kgEvidence;
            try {
                const graph = await buildKgNetworkGraph(evidenceAtStart);
                if (this.kgEvidence === evidenceAtStart) {
                    this.kgNetworkGraph = graph;
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[reveal-scope] KG network graph rebuild on import failed", error);
            }
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
                    this.kgNetworkGraph = session.kgNetworkGraph;
                    this.biomarkerEvidence = session.biomarkerEvidence;
                    this.biomarkerEvidenceBlockedReason = session.biomarkerBlockedReason;
                    if (!this.kgNetworkGraph && this.kgEvidence) {
                        this.rebuildKgNetworkGraphFromEvidence();
                    }
                    this.evaluateContentTab =
                        session.biomarkerEvidence || session.biomarkerBlockedReason
                            ? "biomarker"
                            : session.kgEvidence || session.kgBlockedReason
                            ? "kg"
                            : session.literatureQuery
                            ? "explore"
                            : "evaluation";
                    this.pendingImportedEvaluation = session.evaluation;
                    this.pendingImportedLiteratureQuery = session.literatureQuery;
                    if (
                        session.ranModules.includes("evaluate") ||
                        session.evaluation ||
                        session.kgEvidence ||
                        session.kgBlockedReason ||
                        session.biomarkerEvidence ||
                        session.biomarkerBlockedReason ||
                        session.literatureQuery ||
                        session.ranModules.includes("literature")
                    ) {
                        this.activeModule = "evaluate";
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
    margin-bottom: -1px;
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
