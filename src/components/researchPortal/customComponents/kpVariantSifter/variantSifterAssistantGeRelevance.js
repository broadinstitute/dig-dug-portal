import {
    GE_TRACK_P_VALUE_MAX,
    countTrackFilteredGeTissues,
    listTrackFilteredGeTissuesByAnnotation,
} from "./variantSifterGlobalEnrichmentData.js";

export function buildGeRelevanceOfferMessage(session, catalog) {
    const phenotype = session?.phenotype?.name || "this phenotype";
    const ancestry = session?.ancestry || "Mixed";
    const tissueCount = catalog?.tissues?.length || 0;

    return [
        `Global enrichment data is loaded for ${phenotype} (${ancestry}).`,
        `Tissue classification with the LLM is optional.`,
        `Use Execute below to classify ${tissueCount} broad tissue categor${
            tissueCount === 1 ? "y" : "ies"
        }, or close this panel to keep enrichment p-value filtering only.`,
    ].join(" ");
}

export function buildGeRelevanceIntroMessage(session, catalog) {
    const phenotype = session?.phenotype?.name || "this phenotype";
    const ancestry = session?.ancestry || "Mixed";
    const tissueCount = catalog?.tissues?.length || 0;

    return [
        `Classifying which of ${tissueCount} broad tissue categor${
            tissueCount === 1 ? "y" : "ies"
        } are relevant to ${phenotype} (${ancestry}).`,
        "This uses phenotype–tissue relevance only (Variant Sifter has no novelty scores for these tissues).",
        `Annotation tracks keep tissues that are relevant and have enrichment p < ${GE_TRACK_P_VALUE_MAX} for that annotation.`,
        "Filtered tissues are listed by annotation in the Global enrich. drawer.",
    ].join(" ");
}

export function buildGeRelevanceRunningMessage() {
    return "Classifying phenotype-relevant tissues…";
}

export function buildGeRelevanceReportMessage({
    session,
    catalog,
    llmRelevance,
    annoData = {},
    geRows = [],
}) {
    if (!llmRelevance?.llmUsed) {
        if (llmRelevance?.error) {
            return `${llmRelevance.error} Annotation tracks show tissues with enrichment p < ${GE_TRACK_P_VALUE_MAX} for each annotation.`;
        }
        return (
            `LLM relevance filtering was not applied. Annotation tracks show tissues with enrichment p < ${GE_TRACK_P_VALUE_MAX} for each annotation.`
        );
    }

    const phenotype = session?.phenotype?.name || "phenotype";
    const ancestry = session?.ancestry || "Mixed";
    const relevantTissues = llmRelevance.relevantTissues || [];
    const mutedGroups = listTrackFilteredGeTissuesByAnnotation({
        annoData,
        geRows,
        phenotype: session?.phenotype?.name || "",
        ancestry,
        annotations: catalog?.annotations || null,
        llmRelevance,
    });
    const filteredCount = countTrackFilteredGeTissues(mutedGroups);

    const lines = [
        `Finished tissue relevance filtering for ${phenotype} (${ancestry}).`,
        `Classified ${relevantTissues.length} tissue${relevantTissues.length === 1 ? "" : "s"} as relevant.`,
        `Annotation tracks keep relevant tissues with enrichment p < ${GE_TRACK_P_VALUE_MAX} for each annotation.`,
    ];

    if (relevantTissues.length) {
        lines.push(`Relevant tissues: ${relevantTissues.join(", ")}.`);
    }
    if (filteredCount) {
        lines.push(
            `${filteredCount} tissue row${filteredCount === 1 ? "" : "s"} filtered from tracks (listed by annotation in Global enrich.).`
        );
    }

    return lines.join(" ");
}
