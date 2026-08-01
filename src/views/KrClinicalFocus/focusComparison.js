export function hasClinicalFocus(focus) {
    return !!(focus && Array.isArray(focus.hpoTerms) && focus.hpoTerms.length);
}

const defaultSubjects = {
    sample: "searched sample",
    phenotype: "current phenotype query",
    variant: "queried variant / gene carriers",
};

function subjectLabel(pageType, context = {}) {
    return context.subjectLabel || defaultSubjects[pageType] || "current search";
}

export function buildFocusInsight(pageType, focus, context = {}) {
    const searchSubject = subjectLabel(pageType, context);

    if (hasClinicalFocus(focus)) {
        const termCount = focus.hpoTerms.length;
        const focusLabel = `${focus.label} · ${termCount} HPO terms`;

        const matchCopy = {
            sample: {
                title: "Joint interpretation",
                headline: "Sample interpreted against the current clinical context",
                body: "The sample remains the search subject. The context changes the interpretation layer: phenotype-neighbor evidence, investigator affinity, disease hypotheses, and gene/variant evidence are read against the active context profile.",
                metric: `4 / ${termCount} context terms matched`,
                changes: [
                    "Primary sample overview and nearest-patient retrieval remain sample-centered.",
                    "Context highlights which findings support or conflict with the chosen clinical context.",
                    "Candidate genes and variants are treated as supporting evidence, not automatic diagnosis calls.",
                ],
            },
            phenotype: {
                title: "Joint interpretation",
                headline: "Phenotype search compared with the current clinical context",
                body: "The current phenotype query and the clinical context are intentionally kept separate. The query finds matching CRDC samples; the context explains whether those matches support the comparison target.",
                metric: "2 shared context terms",
                changes: [
                    "Phenotype retrieval still uses the searched HPO terms as the query.",
                    "The context is an external comparator for overlap, missing features, and related disease context.",
                    "Use this phenotype search as context only when the query itself should become the comparison target.",
                ],
            },
            variant: {
                title: "Joint interpretation",
                headline: "Carrier phenotype profile interpreted against the current clinical context",
                body: "The variant or gene remains the search subject. Carrier samples are summarized into an HPO profile and compared with the context to decide whether carrier phenotypes fit that clinical context.",
                metric: "5 context terms in carrier profile",
                changes: [
                    "Carrier count, locus evidence, and variant annotations remain variant-centered.",
                    "Context changes which carrier phenotypes and disease hypotheses are emphasized.",
                    "A match supports review of the variant in that context; it is not a diagnosis by itself.",
                ],
            },
        }[pageType];

        return {
            mode: "focused",
            focusLabel,
            searchSubject,
            focusSubject: focusLabel,
            operator: "×",
            ...matchCopy,
            secondaryTitle: "Other contexts worth checking",
            secondaryBody: "Other disease or cohort contexts can remain collapsed as secondary hypotheses; they should not be presented as diagnoses.",
        };
    }

    const suggestionCopy = {
        sample: {
            title: "Discovery mode",
            headline: "Suggested contexts from this sample",
            body: "No clinical context is set. The sample page keeps the normal sample-centered result and suggests possible disease, cohort, and gene contexts worth checking.",
            metric: "suggestions only",
            changes: [
                "Search result is not constrained by a predefined focus.",
                "Suggested contexts come from sample HPO profile, similar patients, and genetic evidence.",
                "Suggestions are review targets, not diagnoses.",
            ],
        },
        phenotype: {
            title: "Discovery mode",
            headline: "Suggested contexts from this phenotype search",
            body: "No clinical context is set. The phenotype page keeps the normal retrieval result and suggests contexts that may help interpret the query profile.",
            metric: "exploratory",
            changes: [
                "Patient retrieval uses the searched phenotype terms.",
                "Co-observed phenotypes and molecular evidence suggest possible contexts worth checking.",
                "A phenotype query can be promoted to the active context if needed.",
            ],
        },
        variant: {
            title: "Discovery mode",
            headline: "Suggested contexts from variant/gene carriers",
            body: "No clinical context is set. The variant page keeps the normal variant-centered result and suggests contexts from aggregate carrier phenotypes.",
            metric: "exploratory",
            changes: [
                "Variant recurrence and carrier summaries remain the primary result.",
                "Carrier HPO profiles suggest possible clinical contexts worth checking.",
                "Suggestions should be reviewed against disease annotations and reported clinical evidence.",
            ],
        },
    }[pageType];

    return {
        mode: "exploratory",
        focusLabel: "No clinical context set",
        searchSubject,
        focusSubject: "No clinical context set",
        operator: "×",
        ...suggestionCopy,
        secondaryTitle: "",
        secondaryBody: "",
    };
}
