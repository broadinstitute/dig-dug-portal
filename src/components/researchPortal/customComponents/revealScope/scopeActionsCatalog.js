export const ACTION_CATALOG = [
    {
        id: "runEvaluate",
        label: "Evaluate hypothesis",
        description:
            "Scores precision and falsifiability and shows the parsed target, perturbation, and outcome.",
    },
    {
        id: "runKgSearch",
        label: "Search CFDE KG",
        description:
            "Searches the CFDE knowledge graph for gene–trait evidence using the parsed target and outcome.",
    },
    {
        id: "classifyKgRelevance",
        label: "Classify CFDE KG relevance",
        description:
            "Optional LLM pass that labels each CFDE KG evidence edge as on-topic, mismatched context, or unrelated to the hypothesis.",
    },
    {
        id: "runBiomarkerSearch",
        label: "Discover mechanism-linked biomarkers",
        description:
            "Resolves hypothesis mechanisms (or reuses CFDE KG selection), finds shared-gene diseases, then lists BiomarkerKB biomarkers — can run independently of Search CFDE KG.",
    },
    {
        id: "classifyBiomarkerRelevance",
        label: "Classify biomarker relevance",
        description:
            "Optional LLM pass that labels each fetched biomarker as on-topic, mismatched context, or unrelated to the hypothesis.",
    },
    {
        id: "designExperimentProtocol",
        label: "Design experiment protocol",
        description: "Sends the evaluated hypothesis and its components to REVEAL DESIGN, in a new tab.",
    },
    {
        id: "exportCfdeKgForCanvas",
        label: "Export CFDE KG for REVEAL CANVAS",
        description:
            "Downloads the CFDE KG network as a handoff file you can Import graph into REVEAL CANVAS.",
    },
    {
        id: "openRevealCanvas",
        label: "Open REVEAL CANVAS for node inspection",
        description:
            "Opens REVEAL CANVAS in a new tab — use Manage → Import graph with a SCOPE handoff file you exported earlier.",
    },
    {
        id: "runLiterature",
        label: "Search literature",
        description: "Turns the hypothesis into several editable PubMed search combinations you can open and review.",
    },
    {
        id: "exportSession",
        label: "Export session",
        description: "Saves the hypothesis and everything generated so far to a file you name.",
    },
];
