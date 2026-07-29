import {
    GE_TRACK_P_VALUE_MAX,
    countTrackFilteredGeTissues,
    listTrackFilteredGeTissuesByAnnotation,
} from "./variantSifterGlobalEnrichmentData.js";
import { VKS_CS2CT_MIN_OVERLAP_PPA } from "./variantSifterCs2ctApi.js";

export function buildGeRelevanceOfferMessage(session, catalog, { credibleSetCount = 0 } = {}) {
    const phenotype =
        session?.phenotype?.description ||
        session?.phenotype?.name ||
        "this phenotype";
    const ancestry = session?.ancestry || "Mixed";
    const tissueCount = catalog?.tissues?.length || 0;
    const csLabel =
        credibleSetCount > 0
            ? `${credibleSetCount} credible set${credibleSetCount === 1 ? "" : "s"}`
            : "available credible sets";

    return [
        `Global enrichment data is loaded for ${phenotype} (${ancestry}).`,
        `Tissue classification with CS2CT is optional.`,
        `Use Execute below to classify ${tissueCount} broad tissue categor${
            tissueCount === 1 ? "y" : "ies"
        } from ${csLabel} (overlap PPA ≥ ${VKS_CS2CT_MIN_OVERLAP_PPA}, locus-restricted),`,
        "or close this panel to keep enrichment p-value filtering only.",
    ].join(" ");
}

export function buildGeRelevanceIntroMessage(session, catalog) {
    const phenotype =
        session?.phenotype?.description ||
        session?.phenotype?.name ||
        "this phenotype";
    const ancestry = session?.ancestry || "Mixed";
    const tissueCount = catalog?.tissues?.length || 0;

    return [
        `Classifying which of ${tissueCount} broad tissue categor${
            tissueCount === 1 ? "y" : "ies"
        } match CS2CT evidence for ${phenotype} (${ancestry}).`,
        `Rows with overlap PPA < ${VKS_CS2CT_MIN_OVERLAP_PPA} or outside the searched region are excluded.`,
        `Annotation tracks keep CS2CT-matched tissues with enrichment p < ${GE_TRACK_P_VALUE_MAX} for that annotation.`,
        "Filtered tissues are listed by annotation in the Global enrich. drawer.",
    ].join(" ");
}

export function buildGeRelevanceRunningMessage() {
    return "Classifying phenotype-relevant tissues from CS2CT…";
}

export function buildGeRelevanceReportMessage({
    session,
    catalog,
    llmRelevance,
    annoData = {},
    geRows = [],
    classification = null,
}) {
    if (!llmRelevance?.llmUsed) {
        if (llmRelevance?.error) {
            return `${llmRelevance.error} Annotation tracks show tissues with enrichment p < ${GE_TRACK_P_VALUE_MAX} for each annotation.`;
        }
        return (
            `CS2CT tissue filtering was not applied. Annotation tracks show tissues with enrichment p < ${GE_TRACK_P_VALUE_MAX} for each annotation.`
        );
    }

    const phenotype =
        session?.phenotype?.description ||
        session?.phenotype?.name ||
        "phenotype";
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
    const starOptionCount = classification?.starOptions?.length || 0;

    const lines = [
        `Finished CS2CT tissue classification for ${phenotype} (${ancestry}).`,
        `Matched ${relevantTissues.length} tissue${relevantTissues.length === 1 ? "" : "s"} from filtered CS2CT rows (overlap PPA ≥ ${VKS_CS2CT_MIN_OVERLAP_PPA}).`,
        `Annotation tracks keep matched tissues with enrichment p < ${GE_TRACK_P_VALUE_MAX} for each annotation.`,
    ];

    if (relevantTissues.length) {
        lines.push(`Relevant tissues: ${relevantTissues.join(", ")}.`);
    }
    if (filteredCount) {
        lines.push(
            `${filteredCount} tissue row${filteredCount === 1 ? "" : "s"} filtered from tracks (listed by annotation in Global enrich.).`
        );
    }
    if (starOptionCount) {
        lines.push(
            `Optionally star overlap lead SNPs from ${starOptionCount} credible set${starOptionCount === 1 ? "" : "s"} below.`
        );
    }

    return lines.join(" ");
}

export function buildCs2ctStarPromptMessage(starOptions = []) {
    const count = starOptions.length;
    if (!count) {
        return "No overlap lead SNPs passed the CS2CT filters for starring.";
    }
    return [
        `Star overlap lead SNPs from the credible sets below?`,
        `Select all is available as the first option.`,
        `${count} credible set${count === 1 ? "" : "s"} have filtered lead SNPs.`,
    ].join(" ");
}
