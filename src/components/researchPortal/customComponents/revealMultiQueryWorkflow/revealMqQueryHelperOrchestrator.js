/**
 * Query Helper orchestration for Multi Query REVEAL: composes the guided-builder selection payload
 * into a query via `vm.llmQueryHelper`, then hands off to `startWorkflowFromExtractedTerms`.
 */

function buildHelperFallbackQuery({ phenotypes = [], factorLabels = [], genes = [], context = "" } = {}) {
    const p = (phenotypes || []).slice(0, 3).join(", ");
    const f = (factorLabels || []).slice(0, 3).join(", ");
    const g = (genes || []).slice(0, 5).join(", ");
    const pieces = [];
    if (p) pieces.push(`for phenotypes ${p}`);
    if (f) pieces.push(`involving factor clusters ${f}`);
    if (g) pieces.push(`with genes ${g}`);
    if (context) pieces.push(`in the context of ${String(context).trim()}`);
    return `Find candidate mechanisms ${pieces.join(" ")}`.trim();
}

async function continueWithQueryHelper(vm) {
    vm.queryHelperError = "";
    if (!vm.queryHelperCanContinue) return;
    const selectedPhenotypes = (vm.queryHelperSelectedPhenotypes || []).map((x) => ({
        id: String(x.value),
        label: String(x.label || x.value),
    }));
    const selectedFactors = (vm.queryHelperSelectedFactorRows || []).map((row) => ({
        phenotype_id: String(row.phenotypeId),
        phenotype_label: String(row.phenotypeLabel),
        factor_id: String(row.factorId),
        factor_label: String(
            vm.resolveCfdeFactorClusterDisplayLabel(row.factorLabel || row.factorLabelRaw || row.factorId) ||
                row.factorLabel ||
                row.factorId
        ),
        factor_label_raw: String(row.factorLabelRaw || row.factorLabel),
        top_gene_sets: String(row.topGeneSetsRaw || ""),
    }));
    const selectedMechanisms = [...(vm.queryHelperMechanismTerms || [])];
    const selectedGenes = [...(vm.queryHelperGenesOfInterest || [])];
    const contextDraft = String(vm.queryHelperDraftResearchContext || "").trim();
    const payload = {
        selected_phenotypes: selectedPhenotypes,
        selected_factors: selectedFactors,
        selected_mechanism_terms: selectedMechanisms,
        selected_genes_of_interest: selectedGenes,
        user_context_draft: contextDraft,
    };
    const deterministic = vm.buildHelperDeterministicTerms({
        selectedPhenotypes,
        selectedFactors,
        selectedMechanisms,
        selectedGenes,
    });
    const helperConstraintSpec = vm.buildHelperConstraintSpec({
        selectedFactors,
    });
    const hardConstraintLabelMap = {};
    selectedFactors.forEach((f) => {
        const k = `${String(f.phenotype_id)}|${String(f.factor_id)}`;
        hardConstraintLabelMap[k] = String(f.factor_label || f.factor_id);
    });
    vm.lastHardConstraintFactorLabelByPair = hardConstraintLabelMap;
    vm.lastRunUsedHardConstraint = !!helperConstraintSpec;
    const userPrompt = `Build query inputs from this selection payload so the resulting query can reconstruct the same phenotype/factor/gene intent:\n${JSON.stringify(payload, null, 2)}`;
    vm.queryHelperComposing = true;
    try {
        const response = await new Promise((resolve, reject) => {
            let done = false;
            const finish = (err, out) => {
                if (done) return;
                done = true;
                if (err) reject(err);
                else resolve(out);
            };
            vm.llmQueryHelper.sendPrompt({
                userPrompt,
                onResponse: (resp) => finish(null, resp),
                onError: (err) => finish(err || new Error("Failed to build helper query.")),
                onEnd: () => {
                    if (!done) finish(new Error("Incomplete helper LLM response."));
                },
            });
        });
        const json = vm.parseLLMResponse(response);
        if (!json || typeof json !== "object") {
            throw new Error("Could not parse helper LLM response.");
        }
        const phenotypeTerms = deterministic.phenotypeTermsForExtract;
        const mechanismTerms = deterministic.mechanismTerms;
        const genesOfInterest = deterministic.genesOfInterest.length
            ? deterministic.genesOfInterest
            : vm.normalizeLlmTermList(json.genes_of_interest);
        if (selectedGenes.length && !genesOfInterest.length) {
            throw new Error("Could not preserve selected genes. Please select genes from suggestions and try again.");
        }
        const researchContext =
            json.research_context != null && String(json.research_context).trim() !== ""
                ? String(json.research_context).trim()
                : contextDraft;
        const generatedQuery =
            json.generated_query != null && String(json.generated_query).trim() !== ""
                ? String(json.generated_query).trim()
                : buildHelperFallbackQuery({
                    phenotypes: selectedPhenotypes.map((p) => p.label),
                    factorLabels: selectedMechanisms.length
                        ? selectedMechanisms
                        : selectedFactors.map((f) => f.factor_label),
                    genes: genesOfInterest,
                    context: researchContext,
                });
        vm.queryHelperOpen = false;
        await vm.startWorkflowFromExtractedTerms({
            queryText: generatedQuery,
            phenotypeTerms,
            mechanismTerms,
            genesOfInterest,
            researchContext,
            retrievalPhenotypeTerms: deterministic.phenotypeTermsForRetrieval,
            helperConstraintSpec,
        });
    } catch (err) {
        vm.queryHelperError =
            err && err.message ? String(err.message) : "Failed to build query from helper selections.";
    } finally {
        vm.queryHelperComposing = false;
    }
}

export { buildHelperFallbackQuery, continueWithQueryHelper };
