<template>
    <div v-if="w">
                    <b-modal
                        :visible="w.queryHelperOpen"
                        size="xl"
                        title="Guided Query Builder"
                        body-class="pb-4"
                        hide-footer
                        no-close-on-backdrop
                        @change="w.queryHelperOpen = $event"
                    >
                        <div class="small text-muted mb-3">
                            Build a targeted search from CFDE evidence. The AI will draft both a scientifically grounded query and a research context you can review before search.
                        </div>
                        <div class="form-group mb-3">
                            <label class="font-weight-bold mb-1">1. Select Target Phenotype or Disease</label>
                            <div class="small text-muted mb-1">
                                Start by anchoring your search to a specific physiological trait or disease state (e.g., Waist-to-hip ratio, Type 2 Diabetes).
                            </div>
                            <input
                                type="text"
                                class="form-control"
                                v-model="w.queryHelperPhenotypeInput"
                                placeholder="Type to search CFDE phenotypes..."
                            />
                            <ul
                                v-if="w.queryHelperPhenotypeSuggestions.length"
                                class="query-helper-suggest-list list-unstyled mt-2 mb-2 border rounded"
                            >
                                <li
                                    v-for="opt in w.queryHelperPhenotypeSuggestions"
                                    :key="'qh-pheno-' + opt.value"
                                    class="query-helper-suggest-item px-2 py-1"
                                >
                                    <button
                                        type="button"
                                        class="btn btn-link btn-sm p-0 text-left w-100"
                                        @click="w.onQueryHelperPickPhenotype(opt)"
                                    >
                                        <span class="font-weight-bold">{{ opt.label }}</span>
                                        <span class="text-muted"> ({{ opt.value }})</span>
                                    </button>
                                </li>
                            </ul>
                            <div v-if="w.queryHelperSelectedPhenotypes.length" class="d-flex flex-wrap mt-2">
                                <span
                                    v-for="item in w.queryHelperSelectedPhenotypes"
                                    :key="'qh-pheno-chip-' + item.value"
                                    class="pill query-helper-pill mr-2 mb-2"
                                >
                                    {{ item.label }}
                                    <button
                                        type="button"
                                        class="btn btn-link btn-sm p-0 ml-1"
                                        @click="w.removeQueryHelperPhenotype(item.value)"
                                        aria-label="Remove phenotype"
                                    >
                                        ×
                                    </button>
                                </span>
                            </div>
                            <div
                                v-if="w.queryHelperNoFactorPhenotypeLabels.length"
                                class="small text-warning mt-1"
                            >
                                No factors returned for: {{ w.queryHelperNoFactorPhenotypeLabels.join(", ") }}.
                            </div>
                        </div>

                        <div class="mb-1 font-weight-bold">2. Select Biological Mechanisms (Factors)</div>
                        <div v-if="w.queryHelperFactorRows.length" class="small text-muted mb-2">
                            Select 1-2 pathways to force the AI to investigate these specific mechanisms.
                        </div>
                        <div v-if="w.queryHelperLoadingFactors" class="small text-muted d-flex align-items-center mb-3">
                            <b-spinner small class="mr-2"></b-spinner>
                            Loading factors for selected phenotypes...
                        </div>
                        <div v-else-if="w.queryHelperFactorError" class="alert alert-warning py-2 mb-3">
                            {{ w.queryHelperFactorError }}
                        </div>
                        <div v-else-if="w.queryHelperFactorRows.length" class="mb-3">
                            <div class="form-group mb-2">
                                <input
                                    type="text"
                                    class="form-control form-control-sm"
                                    v-model="w.queryHelperClusterFilterInput"
                                    placeholder="Filter gene set clusters (comma-separated keywords)"
                                    @input="w.applyQueryHelperClusterFilterSelection"
                                />
                            </div>
                            <div class="table-responsive">
                                <table class="table table-sm table-striped mb-0">
                                    <thead class="thead-light">
                                        <tr>
                                            <th style="width: 90px;">
                                                <div class="d-flex align-items-center">
                                                    <input
                                                        type="checkbox"
                                                        class="query-helper-factor-checkbox mr-2"
                                                        :checked="w.queryHelperAllFactorsSelected"
                                                        :indeterminate.prop="w.queryHelperSomeFactorsSelected"
                                                        @change="w.toggleQueryHelperAllFactors($event)"
                                                    />
                                                    <span>Select</span>
                                                </div>
                                            </th>
                                            <th style="width: 260px;">Phenotype</th>
                                            <th>Gene set cluster</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="row in w.queryHelperFactorPageRows" :key="'qh-factor-' + row.key">
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    class="query-helper-factor-checkbox"
                                                    :checked="!!w.queryHelperFactorSelection[row.key]"
                                                    @change="w.toggleQueryHelperFactor(row.key, $event)"
                                                />
                                            </td>
                                            <td>{{ row.phenotypeLabel }}</td>
                                            <td>{{ row.factorLabel }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-if="w.queryHelperFactorRows.length > w.queryHelperFactorsPerPage" class="d-flex justify-content-end mt-2">
                                <b-pagination
                                    v-model="w.queryHelperFactorPage"
                                    :total-rows="w.queryHelperFactorRows.length"
                                    :per-page="w.queryHelperFactorsPerPage"
                                    size="sm"
                                    pills
                                />
                            </div>
                        </div>
                        <div v-else class="small text-muted mb-3">
                            {{ w.queryHelperSelectedPhenotypes.length ? 'No associated gene set clusters returned for selected phenotypes.' : 'First, select a phenotype above to view its associated biological mechanisms and pathways.' }}
                        </div>

                        <div class="form-group mb-3">
                            <label class="font-weight-bold mb-1">Additional mechanism terms (optional)</label>
                            <div class="small text-muted mb-1">
                                Add extra mechanism keywords not captured by selected pathways.
                            </div>
                            <input
                                type="text"
                                class="form-control"
                                v-model="w.queryHelperMechanismInput"
                                placeholder="Add an extra mechanism term, then press Enter"
                                @keydown.enter.prevent="w.addQueryHelperMechanismFromInput"
                            />
                            <div v-if="w.queryHelperMechanismTerms.length" class="d-flex flex-wrap mt-2">
                                <span
                                    v-for="term in w.queryHelperMechanismTerms"
                                    :key="'qh-mech-chip-' + term"
                                    class="pill query-helper-pill mr-2 mb-2"
                                >
                                    {{ term }}
                                    <button
                                        type="button"
                                        class="btn btn-link btn-sm p-0 ml-1"
                                        @click="w.removeQueryHelperMechanism(term)"
                                        aria-label="Remove mechanism term"
                                    >
                                        ×
                                    </button>
                                </span>
                            </div>
                        </div>

                        <div class="form-group mb-3">
                            <label class="font-weight-bold mb-1">3. Pin Specific Genes (Optional)</label>
                            <div class="small text-muted mb-1">
                                Leave empty to let the AI discover contextually novel genes. Pin specific genes to force the network to build a pathway around them.
                            </div>
                            <input
                                type="text"
                                class="form-control"
                                v-model="w.queryHelperGeneInput"
                                placeholder="Search and select a gene symbol"
                                @input="w.onQueryHelperGeneInput"
                                @keydown.enter.prevent="w.addQueryHelperGeneFromInput"
                            />
                            <ul
                                v-if="w.queryHelperGeneSuggestions.length"
                                class="query-helper-suggest-list list-unstyled mt-2 mb-2 border rounded"
                            >
                                <li
                                    v-for="gene in w.queryHelperGeneSuggestions"
                                    :key="'qh-gene-suggest-' + gene"
                                    class="query-helper-suggest-item px-2 py-1"
                                >
                                    <button
                                        type="button"
                                        class="btn btn-link btn-sm p-0 text-left w-100"
                                        @click="w.selectQueryHelperGeneSuggestion(gene)"
                                    >
                                        {{ gene }}
                                    </button>
                                </li>
                            </ul>
                            <div v-if="w.queryHelperGenesOfInterest.length" class="d-flex flex-wrap mt-2">
                                <span
                                    v-for="gene in w.queryHelperGenesOfInterest"
                                    :key="'qh-gene-chip-' + gene"
                                    class="pill query-helper-pill mr-2 mb-2"
                                >
                                    {{ gene }}
                                    <button
                                        type="button"
                                        class="btn btn-link btn-sm p-0 ml-1"
                                        @click="w.removeQueryHelperGene(gene)"
                                        aria-label="Remove gene"
                                    >
                                        ×
                                    </button>
                                </span>
                            </div>
                        </div>

                        <div v-if="w.queryHelperCanContinue" class="form-group mb-3">
                            <label class="font-weight-bold mb-1">Research context (optional draft)</label>
                            <textarea
                                v-model="w.queryHelperDraftResearchContext"
                                class="form-control"
                                rows="3"
                                placeholder="Optional: add context you want included when composing your query."
                            ></textarea>
                        </div>
                        <div v-if="w.queryHelperCanContinue" class="form-group mb-3">
                            <button
                                type="button"
                                class="btn btn-link p-0 d-flex align-items-center"
                                style="gap: 0.35rem;"
                                @click="w.queryHelperAdvancedOpen = !w.queryHelperAdvancedOpen"
                                :aria-expanded="w.queryHelperAdvancedOpen ? 'true' : 'false'"
                                aria-controls="query-helper-advanced-retrieval-options"
                            >
                                <span class="font-weight-bold">Advanced retrieval options</span>
                                <b-icon :icon="w.queryHelperAdvancedOpen ? 'chevron-up' : 'chevron-down'" aria-hidden="true"></b-icon>
                            </button>
                            <div v-if="w.queryHelperAdvancedOpen" id="query-helper-advanced-retrieval-options" class="mt-2 border rounded p-2">
                                <label class="d-flex align-items-center mb-1" style="gap: 0.5rem;">
                                    <input
                                        type="checkbox"
                                        :checked="w.queryHelperHardConstraintEnabled"
                                        :disabled="!w.queryHelperHardConstraintEligible"
                                        @change="w.queryHelperHardConstraintEnabled = !!($event && $event.target && $event.target.checked)"
                                    />
                                    <span class="font-weight-bold">Use helper selections as hard retrieval constraints</span>
                                </label>
                                <div class="small text-muted">
                                    Next, the LLM will extract search terms and generate research context for retrieval.
                                    When this option is enabled, your selected phenotype and gene set cluster choices are still enforced during data retrieval.
                                </div>
                                <div v-if="!w.queryHelperHardConstraintEligible" class="small text-muted mt-1">
                                    This option becomes available after selecting at least one phenotype and one gene set cluster.
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <div v-if="w.queryHelperError" class="small text-danger">{{ w.queryHelperError }}</div>
                            <div class="ml-auto d-flex align-items-center">
                                <button
                                    type="button"
                                    class="btn btn-outline-secondary mr-2"
                                    @click="w.queryHelperOpen = false"
                                    :disabled="w.queryHelperComposing"
                                >
                                    Cancel
                                </button>
                                <button
                                    v-if="w.queryHelperCanContinue"
                                    type="button"
                                    class="btn btn-cfde"
                                    @click="w.continueWithQueryHelper"
                                    :disabled="w.queryHelperComposing"
                                >
                                    <span v-if="w.queryHelperComposing">
                                        <b-spinner small class="mr-1"></b-spinner>
                                        Building...
                                    </span>
                                    <span v-else>Draft Query + Context</span>
                                </button>
                            </div>
                        </div>
                        <div v-if="w.queryHelperCanContinue" class="small text-muted text-right mt-1">
                            You can review and edit the drafted query and context before searching.
                        </div>
                    </b-modal>
    </div>
</template>

<script>
export default {
    name: "WorkflowQueryHelperModal",
    props: {
        shell: { type: Object, default: null },
    },
    computed: {
        w() {
            return this.shell;
        },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
