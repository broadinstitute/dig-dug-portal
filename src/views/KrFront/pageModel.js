import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { clearClinicalFocus } from "../KrClinicalFocus/focusStore";

const searchModes = [
    { key: "cohort", label: "Search by sample ID", shortLabel: "Sample ID" },
    { key: "phenotype", label: "Search by phenotype profile", shortLabel: "Phenotype" },
    { key: "gene", label: "Search by gene", shortLabel: "Gene" },
    { key: "variant", label: "Search by variant", shortLabel: "Variant" },
];

const fixtures = {
    gene: {
        destination: "/pb_Gene.html",
        placeholder: "SLC6A7",
        fallback: "SLC6A7",
        examples: [
            "SLC6A7",
            "ADCY10",
        ],
        hint: "Use this to review gene-level carrier and observed-variant evidence.",
    },
    variant: {
        destination: "/pb_variant.html",
        placeholder: "chr12:102912793:CA:C",
        fallback: "chr12:102912793:CA:C",
        examples: ["chr12:102912793:CA:C"],
        hint: "Use this when you want exact-variant or same-gene carrier evidence. Counts should stay labeled by scope.",
    },
    phenotype: {
        destination: "/krPhenotype.html",
        placeholder:
            "Progressive muscle weakness [HP:0003323], Tremor [HP:0001337], Intellectual disability [HP:0001249], Narrow chest [HP:0000774]",
        fallback: "Progressive muscle weakness [HP:0003323], Tremor [HP:0001337], Intellectual disability [HP:0001249], Narrow chest [HP:0000774]",
        examples: ["Progressive muscle weakness [HP:0003323]"],
        hint: "Use this for a phenotype profile. Runtime PheRS/GRS can remain not calculated until backend support exists.",
    },
    cohort: {
        destination: "/krSample.html",
        queryParam: "sample_id",
        placeholder: "BCH-22-44945-01",
        fallback: "BCH-22-44945-01",
        examples: [
            "BCH-22-44945-01",
            "BCH-19-86295-01",
        ],
        hint: "Open the searched sample first, then inspect similar samples, profile references, and recurrent gene/variant evidence.",
    },
};

const workflows = [
    {
        key: "sample",
        kicker: "Sample ID-first workflow",
        title: "Searched sample hub",
        steps: [
            "Understand the sample phenotype and genotype profile",
            "Check similar samples or phenotype-defined groups",
            "Review disease profile references and recurrent gene or variant evidence",
        ],
    },
    {
        key: "phenotype",
        kicker: "Phenotype-first workflow",
        title: "Matched cohort signal",
        steps: [
            "Search an HPO profile without merging it with active context",
            "Inspect matched CRDC samples and co-observed phenotypes",
            "Overlay external disease or gene references after the cohort signal is visible",
        ],
    },
    {
        key: "variant",
        kicker: "Gene / variant-first workflow",
        title: "Carrier profile in context",
        steps: [
            "Review gene-level evidence or narrow to an exact variant and its carriers",
            "Inspect carrier HPO profile and carrier sample recurrence",
            "If context is active, compare context HPO terms to carrier HPO profiles",
        ],
    },
];

export function createFrontPageState() {
    return {
        activeMode: "cohort",
        query: "",
        confirmedSearchKey: "",
        pendingMessage: "",
        summaryOpen: false,
        contextPanelOpen: false,
        workflowReviewOpen: false,
        returnToWorkflowReview: false,
        searchModes,
        fixtures,
        workflows,
    };
}

export const frontComputed = {
        activeFixture() {
            return this.fixtures[this.activeMode];
        },
        activePlaceholder() {
            return this.activeFixture.placeholder;
        },
        activeExamples() {
            return this.activeFixture.examples;
        },
        activeModeLabel() {
            const mode = this.searchModes.find((item) => item.key === this.activeMode);
            return mode ? mode.shortLabel : "Search subject";
        },
        activeSearchValue() {
            return this.query;
        },
        searchSubjectConfirmed() {
            return Boolean(this.activeSearchValue) &&
                this.confirmedSearchKey === `${this.activeMode}:${this.activeSearchValue}`;
        },
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        contextStatusLabel() {
            if (!this.hasActiveContext) return "Search runs in CRDC discovery mode";

            const sourceId =
                this.clinicalFocus.orphaId ||
                this.clinicalFocus.mondoId ||
                this.clinicalFocus.sourceId;
            const termCount = this.clinicalFocus.contextTermCount || this.clinicalFocus.hpoTerms.length;
            const terms = `${termCount} HPO ${termCount === 1 ? "term" : "terms"}`;
            return [this.clinicalFocus.label, sourceId, terms].filter(Boolean).join(" · ");
        },
    };

export const frontMethods = {
        resetSearchSubject() {
            this.query = "";
            this.confirmedSearchKey = "";
            this.pendingMessage = "";
            this.workflowReviewOpen = false;
        },
        confirmSearchSubject() {
            if (!this.activeSearchValue) {
                this.confirmedSearchKey = "";
                this.pendingMessage = `Enter a ${this.activeModeLabel.toLowerCase()} to continue`;
                return;
            }
            this.confirmedSearchKey = `${this.activeMode}:${this.activeSearchValue}`;
            this.pendingMessage = `${this.activeModeLabel} search ready`;
        },
        openResults() {
            this.pendingMessage = "";

            if (!this.searchSubjectConfirmed) {
                this.pendingMessage = "Set the search subject before reviewing the workflow";
                return;
            }

            if (!this.activeFixture.destination) {
                this.pendingMessage = `Search captured, but this workflow does not have a target page yet: ${this.activeSearchValue}`;
                return;
            }

            this.workflowReviewOpen = true;
        },
        runWorkflow() {
            const value = this.activeSearchValue;

            const param = this.activeFixture.queryParam || "query";
            window.location.assign(
                `${this.activeFixture.destination}?${param}=${encodeURIComponent(value)}`
            );
        },
        closeWorkflowReview() {
            this.workflowReviewOpen = false;
        },
        openContextEditor(returnToWorkflowReview = false) {
            this.returnToWorkflowReview = returnToWorkflowReview;
            this.workflowReviewOpen = false;
            this.contextPanelOpen = true;
        },
        closeContextEditor() {
            this.contextPanelOpen = false;
            if (this.returnToWorkflowReview) this.workflowReviewOpen = true;
            this.returnToWorkflowReview = false;
        },
        clearContext() {
            clearClinicalFocus();
        },
        resetFront() {
            this.resetSearchSubject();
            this.activeMode = "cohort";
            this.contextPanelOpen = false;
            this.returnToWorkflowReview = false;
            clearClinicalFocus();
            this.pendingMessage = "Search and session context cleared";
        },
    };
