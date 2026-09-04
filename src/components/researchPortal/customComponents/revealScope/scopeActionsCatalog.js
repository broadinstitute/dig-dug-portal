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
        id: "runBiomarkerSearch",
        label: "Search Biomarker KB",
        description:
            "Bridges the resolved mechanism to shared-gene diseases, then searches BiomarkerKB for biomarkers on those diseases.",
    },
    {
        id: "runLiterature",
        label: "Search literature",
        description: "Turns the hypothesis into an editable PubMed search query you can open and review.",
    },
    {
        id: "exportSession",
        label: "Export session",
        description: "Saves the hypothesis and everything generated so far to a file you name.",
    },
];
