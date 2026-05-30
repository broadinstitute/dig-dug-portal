import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";

const searchModes = [
    { key: "cohort", label: "Search by sample ID", shortLabel: "Sample ID" },
    { key: "phenotype", label: "Search by phenotype profile", shortLabel: "Phenotype" },
    { key: "variant", label: "Search by variant / gene", shortLabel: "Variant / gene" },
];

const fixtures = {
    variant: {
        destination: "/krVariant.html",
        placeholder: "chr5:150203773:T:A / SLC6A7",
        fallback: "chr5:150203773:T:A",
        examples: [
            "chr5:150203773:T:A",
            "SLC6A7",
            "exact variant carrier set",
        ],
        hint: "Use this when you want exact-variant or same-gene carrier evidence. Counts should stay labeled by scope.",
    },
    phenotype: {
        destination: "/krPhenotype.html",
        placeholder:
            "Progressive muscle weakness [HP:0003323], Tremor [HP:0001337], Intellectual disability [HP:0001249], Narrow chest [HP:0000774]",
        fallback: "Progressive muscle weakness [HP:0003323], Tremor [HP:0001337], Intellectual disability [HP:0001249], Narrow chest [HP:0000774]",
        examples: [
            "Progressive muscle weakness [HP:0003323]",
            "Tremor [HP:0001337]",
            "Intellectual disability [HP:0001249], Narrow chest [HP:0000774]",
        ],
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
        kicker: "Variant-first workflow",
        title: "Carrier profile in context",
        steps: [
            "Separate exact queried-variant, same-gene, and nearby-region evidence",
            "Inspect carrier HPO profile and carrier sample recurrence",
            "If context is active, compare context HPO terms to carrier HPO profiles",
        ],
    },
];

export function createFrontPageState() {
    return {
        activeMode: "cohort",
        query: "",
        pendingMessage: "",
        summaryOpen: false,
        contextPanelOpen: false,
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
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        contextStatusLabel() {
            if (!this.hasActiveContext) return "Search runs in CRDC discovery mode";

            const sourceId =
                this.clinicalFocus.orphaId ||
                this.clinicalFocus.mondoId ||
                this.clinicalFocus.decipherId ||
                this.clinicalFocus.sourceId;
            const termCount = this.clinicalFocus.contextTermCount || this.clinicalFocus.hpoTerms.length;
            const terms = `${termCount} HPO terms`;
            return [this.clinicalFocus.label, sourceId, terms].filter(Boolean).join(" · ");
        },
    };

export const frontMethods = {
        openResults() {
            const value = this.query || this.activeFixture.fallback;
            this.pendingMessage = "";

            if (!this.activeFixture.destination) {
                this.pendingMessage = `Search captured, but this workflow does not have a target page yet: ${value}`;
                return;
            }

            const param = this.activeFixture.queryParam || "query";
            window.location.assign(
                `${this.activeFixture.destination}?${param}=${encodeURIComponent(value)}`
            );
        },
    };
