import { listMutedGeTissues } from "./variantSifterGlobalEnrichmentData.js";

export function buildGeRelevanceIntroMessage(session, catalog) {
    const phenotype = session?.phenotype?.name || "this phenotype";
    const ancestry = session?.ancestry || "Mixed";
    const tissueCount = catalog?.tissues?.length || 0;

    return [
        `Global enrichment data is loaded for ${phenotype} (${ancestry}).`,
        `I will classify which of ${tissueCount} broad tissue categor${tissueCount === 1 ? "y" : "ies"} are relevant to this phenotype.`,
        "This uses phenotype–tissue relevance only (Variant Sifter has no novelty scores for these tissues).",
        "Annotation types stay visible; muted tissues are de-emphasized on the GE plot.",
        "You can re-enable muted tissues from the Global enrich. drawer.",
    ].join(" ");
}

export function buildGeRelevanceRunningMessage() {
    return "Classifying phenotype-relevant tissues…";
}

export function buildGeRelevanceReportMessage({
    session,
    catalog,
    llmRelevance,
    enabledMutedTissues = [],
}) {
    if (!llmRelevance?.llmUsed) {
        if (llmRelevance?.error) {
            return `${llmRelevance.error} Showing full global enrichment data without tissue filtering.`;
        }
        return (
            "LLM relevance filtering was not applied. All tissues and annotations are shown without muting."
        );
    }

    const phenotype = session?.phenotype?.name || "phenotype";
    const ancestry = session?.ancestry || "Mixed";
    const relevantTissues = llmRelevance.relevantTissues || [];
    const mutedTissues = listMutedGeTissues(catalog?.tissues || [], {
        llmRelevance,
        enabledMutedTissues,
    });

    const lines = [
        `Finished tissue relevance filtering for ${phenotype} (${ancestry}).`,
        `Highlighted ${relevantTissues.length} tissue${relevantTissues.length === 1 ? "" : "s"}.`,
    ];

    if (relevantTissues.length) {
        lines.push(`Tissues: ${relevantTissues.join(", ")}.`);
    }
    if (mutedTissues.length) {
        lines.push(
            `Muted ${mutedTissues.length} tissue${mutedTissues.length === 1 ? "" : "s"} at low emphasis.`
        );
    }

    return lines.join(" ");
}
