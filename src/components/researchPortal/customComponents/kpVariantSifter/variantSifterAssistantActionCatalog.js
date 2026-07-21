/** User-facing catalog of Variant Sifter assistant actions (Actions tab).
 * Pattern adapted from Canvas (`revealKgAssistantActionCatalog` on cfde-main):
 * Actions documents capabilities; Request runs steps and free-text plans.
 */

export const VKS_ASSISTANT_ACTION_CATALOG_SECTIONS = [
    {
        section: "Commands",
        intro:
            "Direct workspace actions—session, panels, and guides. No LLM reasoning required. You can type similar requests on the Request tab.",
        groups: [
            {
                group: "Session & files",
                actions: [
                    {
                        id: "export_session",
                        label: "Export session",
                        description: "Download the current Variant Sifter session as JSON.",
                        runnable: true,
                        examples: ["Export this session", "Download session JSON"],
                    },
                    {
                        id: "import_session",
                        label: "Import session",
                        description: "Open the import flow to restore a saved session file.",
                        runnable: true,
                        examples: ["Import a session", "Load a saved session"],
                    },
                    {
                        id: "reset_search",
                        label: "Reset search",
                        description: "Clear the current locus search and return to the start screen.",
                        runnable: true,
                        examples: ["Reset the search", "Start a new search", "Clear the workspace"],
                    },
                ],
            },
            {
                group: "Panels & view",
                actions: [
                    {
                        id: "zoom_in",
                        label: "Zoom in",
                        description:
                            "Zoom the region view in by one step (same control as the header zoom slider).",
                        runnable: true,
                        examples: ["Zoom in", "Zoom in on the locus", "Increase zoom"],
                    },
                    {
                        id: "zoom_out",
                        label: "Zoom out",
                        description:
                            "Zoom the region view out by one step, or expand beyond the searched region when already at full locus.",
                        runnable: true,
                        examples: ["Zoom out", "Zoom out of the locus", "Decrease zoom"],
                    },
                    {
                        id: "toggle_data_table",
                        label: "Data table",
                        description: "Open or close the associations data table panel.",
                        runnable: true,
                        examples: ["Open the data table", "Close the data table", "Show data table"],
                    },
                    {
                        id: "open_getting_around",
                        label: "Getting Around",
                        description: "Open the workspace orientation guide.",
                        runnable: true,
                        examples: ["Open Getting Around", "Show the workspace guide"],
                    },
                    {
                        id: "open_global_enrichment",
                        label: "Open Global enrich.",
                        description: "Open the Global enrichment drawer (annotations, tissues, filters).",
                        runnable: true,
                        examples: [
                            "Open global enrichment",
                            "Show the GE drawer",
                            "Open Global enrich",
                        ],
                    },
                    {
                        id: "open_associations",
                        label: "Open Associations",
                        description: "Open the Associations section drawer.",
                        runnable: true,
                        examples: ["Open associations", "Show associations filters"],
                    },
                    {
                        id: "open_credible_sets",
                        label: "Open Credible sets",
                        description: "Open the Credible sets section drawer.",
                        runnable: true,
                        examples: ["Open credible sets", "Show credible set list"],
                    },
                    {
                        id: "open_genes",
                        label: "Open Genes",
                        description: "Open the Genes section drawer.",
                        runnable: true,
                        examples: ["Open genes", "Show gene filters"],
                    },
                ],
            },
        ],
    },
    {
        section: "Research",
        intro:
            "Optional research steps offered when locus data loads. Tissue classification uses CS2CT; understudied bottom-line variants use phenotype-wide meta-analysis types for the active ancestry. Run one step, then the other remains available.",
        groups: [
            {
                group: "Global enrichment",
                actions: [
                    {
                        id: "filter_ge_relevance",
                        label: "Classify tissues by phenotype relevance",
                        description:
                            "Optional. Use CS2CT (c2ct-credible-set) for all credible sets in the locus to find phenotype-relevant tissues (overlap PPA ≥ 0.5, within the searched region). Annotation tracks then keep matched tissues with enrichment p below the Settings / Filters threshold. You can optionally star the filtered overlap lead SNPs by credible set afterward.",
                        runnable: true,
                        autoOnSearch: false,
                        examples: [
                            "Classify tissues by phenotype relevance",
                            "Highlight tissues relevant to type 2 diabetes",
                            "Mute unrelated tissues for this locus",
                            "Filter global enrichment by relevance",
                        ],
                    },
                ],
            },
            {
                group: "Associations",
                actions: [
                    {
                        id: "find_understudied_bottom_line",
                        label: "Find understudied bottom-line variants in this locus",
                        description:
                            "Optional. Load phenotype-wide associations for the active ancestry, keep variants that are genome-wide significant only in the Knowledge Portal bottom-line meta-analysis (not also in min_p / largest), restrict to the searched region, list them in Assist, and optionally star them.",
                        runnable: true,
                        autoOnSearch: false,
                        examples: [
                            "Find understudied bottom-line variants in this locus",
                            "Show bottom-line only variants in the region",
                            "Find understudied GWAS hits",
                        ],
                    },
                ],
            },
        ],
    },
];

/** Flat list for matching and welcome examples (Canvas-compatible helper). */
export function listVksAssistantActions() {
    const actions = [];
    VKS_ASSISTANT_ACTION_CATALOG_SECTIONS.forEach((section) => {
        (section.groups || []).forEach((group) => {
            (group.actions || []).forEach((action) => {
                actions.push({ ...action, section: section.section, group: group.group });
            });
        });
    });
    return actions;
}

export function findAssistantAction(actionId) {
    return listVksAssistantActions().find((action) => action.id === actionId) || null;
}

/** @deprecated Prefer VKS_ASSISTANT_ACTION_CATALOG_SECTIONS */
export const VKS_ASSISTANT_ACTION_CATALOG = VKS_ASSISTANT_ACTION_CATALOG_SECTIONS.flatMap(
    (section) => section.groups || []
);

/**
 * Lightweight free-text → action match for Request tab Run.
 * Full LLM planning can replace this later (Canvas-style).
 */
export function matchVksAssistantRequest(text) {
    const raw = String(text || "").trim();
    if (!raw) {
        return [];
    }
    const normalized = raw.toLowerCase();
    const matched = [];

    listVksAssistantActions().forEach((action) => {
        const needles = [
            action.label,
            ...(action.examples || []),
            action.id.replace(/_/g, " "),
        ]
            .map((item) => String(item || "").toLowerCase())
            .filter(Boolean);

        if (needles.some((needle) => normalized.includes(needle) || needle.includes(normalized))) {
            matched.push(action);
        }
    });

    // Prefer more specific research actions when overlapping keywords hit.
    const unique = [];
    const seen = new Set();
    matched.forEach((action) => {
        if (seen.has(action.id)) {
            return;
        }
        seen.add(action.id);
        unique.push(action);
    });
    return unique;
}

export function buildVksAssistantWelcomeExamples() {
    return [
        "Classify tissues by phenotype relevance",
        "Find understudied bottom-line variants in this locus",
        "Zoom in",
        "Zoom out",
        "Open Global enrich.",
        "Open the data table",
        "Export this session",
    ];
}
