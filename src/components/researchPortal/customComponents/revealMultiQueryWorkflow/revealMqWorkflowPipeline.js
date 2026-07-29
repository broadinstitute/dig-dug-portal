/**
 * Unified orchestration façade for Multi Query REVEAL: extraction -> retrieval -> hypothesis.
 * The shell imports only this module (not the three phase files directly), so callers see
 * one orchestration layer even though each phase's logic still lives in its own file.
 */

import * as extraction from "./revealMqWorkflowOrchestrator.js";
import * as retrieval from "./revealMqRetrievalOrchestrator.js";
import * as hypothesis from "./revealMqHypothesisOrchestrator.js";

function beginExtractionFlow(vm, options = {}) {
    return extraction.beginExtractionFlow(vm, {
        ...options,
        onApproved: options.onApproved || ((terms, opts) => retrieval.onResearch(vm, terms, opts)),
    });
}

function startWorkflowFromExtractedTerms(vm, options = {}) {
    return extraction.startWorkflowFromExtractedTerms(vm, {
        ...options,
        onApproved: options.onApproved || ((terms, opts) => retrieval.onResearch(vm, terms, opts)),
    });
}

const processExtractionResponse = extraction.processExtractionResponse;
const handleExtractionError = extraction.handleExtractionError;
const resetWorkflowStateForNewRun = extraction.resetWorkflowStateForNewRun;
const isExtractionTimeoutError = extraction.isExtractionTimeoutError;

const onResearch = retrieval.onResearch;
const runHybridRetrievalWorkflow = retrieval.runHybridRetrievalWorkflow;
const runMultiQueryRetrievalWorkflow = retrieval.runMultiQueryRetrievalWorkflow;
const fetchMultiQueryRouteEvidence = retrieval.fetchMultiQueryRouteEvidence;
const handleHybridRetrievalError = retrieval.handleHybridRetrievalError;

const generateHypothesisForRemainingPair = hypothesis.generateHypothesisForRemainingPair;
const requestMechanismHypotheses = hypothesis.requestMechanismHypotheses;
const retryMechanismHypotheses = hypothesis.retryMechanismHypotheses;
const retryMechanismHypothesesRelaxed = hypothesis.retryMechanismHypothesesRelaxed;
const resumeImportedWorkflowAfterDataGate = hypothesis.resumeImportedWorkflowAfterDataGate;
const beginMechanismHypothesisGeneration = hypothesis.beginMechanismHypothesisGeneration;
const buildHypothesesUserPrompt = hypothesis.buildHypothesesUserPrompt;

export {
    beginExtractionFlow,
    beginMechanismHypothesisGeneration,
    buildHypothesesUserPrompt,
    fetchMultiQueryRouteEvidence,
    generateHypothesisForRemainingPair,
    handleExtractionError,
    handleHybridRetrievalError,
    isExtractionTimeoutError,
    onResearch,
    processExtractionResponse,
    requestMechanismHypotheses,
    resetWorkflowStateForNewRun,
    resumeImportedWorkflowAfterDataGate,
    retryMechanismHypotheses,
    retryMechanismHypothesesRelaxed,
    runHybridRetrievalWorkflow,
    runMultiQueryRetrievalWorkflow,
    startWorkflowFromExtractedTerms,
};
