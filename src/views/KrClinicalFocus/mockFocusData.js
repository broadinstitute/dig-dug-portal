export const focusSourceOptions = [
    { key: "none", label: "No context" },
    { key: "orphanet", label: "Orphanet" },
    { key: "omim", label: "OMIM" },
    { key: "sample", label: "BCH sample ID" },
    { key: "investigator", label: "Investigator" },
    { key: "manual", label: "Manual HPO" },
];

export const mockFocusProfiles = {
    none: {
        source: "none",
        label: "No clinical context",
        sourceDetail: "No clinical context is used. Results are interpreted in discovery mode.",
        queryExample: "",
        sourceInputLabel: "No context",
        sourceInputPlaceholder: "",
        sourceInputHelp: "Search runs without a clinical comparison target.",
        hpoTerms: [],
    },
    orphanet: {
        source: "orphanet",
        label: "Kabuki syndrome-like Orphanet HPO profile",
        orphaId: "ORPHA:2322",
        sourceId: "ORPHA:2322",
        sourceDetail: "Mock profile resolved from an Orphanet disease label to disease HPO annotations.",
        queryExample: "Kabuki syndrome · ORPHA:2322",
        sourceInputLabel: "Orphanet disease",
        sourceInputPlaceholder: "e.g. Kabuki syndrome or ORPHA:2322",
        sourceInputHelp: "The disease label resolves to an HPO-term profile before comparison.",
        hpoTerms: [
            { id: "HP:0001263", label: "Developmental delay" },
            { id: "HP:0000175", label: "Cleft palate" },
            { id: "HP:0000347", label: "Micrognathia" },
            { id: "HP:0001252", label: "Hypotonia" },
        ],
    },
    omim: {
        source: "omim",
        label: "Kabuki syndrome [OMIM:147920] HPO profile",
        sourceDetail: "Mock profile resolved from OMIM metadata to disease HPO annotations. Future source: phenotype.hpoa.",
        queryExample: "Kabuki syndrome [OMIM:147920]",
        sourceInputLabel: "OMIM disease",
        sourceInputPlaceholder: "e.g. Kabuki syndrome or OMIM:147920",
        sourceInputHelp: "OMIM provides the disease identity; comparison uses the resolved HPO profile, not the OMIM name string.",
        hpoTerms: [
            { id: "HP:0001263", label: "Developmental delay" },
            { id: "HP:0000750", label: "Speech delay" },
            { id: "HP:0000252", label: "Microcephaly" },
            { id: "HP:0001250", label: "Seizure" },
        ],
    },
    sample: {
        source: "sample",
        label: "BCH-12-34210-01 sample HPO profile",
        sourceDetail: "Mock profile resolved from a BCH sample ID to observed sample HPO annotations.",
        queryExample: "BCH-12-34210-01",
        sourceInputLabel: "BCH sample ID",
        sourceInputPlaceholder: "e.g. BCH-12-34210-01",
        sourceInputHelp: "The sample ID resolves to that patient's HPO profile before comparison.",
        hpoTerms: [
            { id: "HP:0001263", label: "Developmental delay" },
            { id: "HP:0000175", label: "Cleft palate" },
            { id: "HP:0000750", label: "Speech delay" },
            { id: "HP:0001249", label: "Intellectual disability" },
        ],
    },
    investigator: {
        source: "investigator",
        label: "Investigator 2 phenotype signature",
        sourceDetail: "Mock profile resolved from an investigator group to an enriched HPO phenotype signature.",
        queryExample: "Investigator 2",
        sourceInputLabel: "Investigator group",
        sourceInputPlaceholder: "e.g. Investigator 2",
        sourceInputHelp: "The investigator group resolves to an enriched phenotype-signature HPO profile.",
        hpoTerms: [
            { id: "HP:0001263", label: "Developmental delay" },
            { id: "HP:0001510", label: "Growth delay" },
            { id: "HP:0011968", label: "Feeding difficulty" },
            { id: "HP:0000347", label: "Micrognathia" },
        ],
    },
    manual: {
        source: "manual",
        label: "Manual HPO context",
        sourceDetail: "User-edited HPO profile.",
        queryExample: "Developmental delay + cleft palate",
        sourceInputLabel: "Manual context label",
        sourceInputPlaceholder: "e.g. neurodevelopmental craniofacial profile",
        sourceInputHelp: "Manual context starts from editable HPO terms below.",
        hpoTerms: [
            { id: "HP:0001263", label: "Developmental delay" },
            { id: "HP:0000175", label: "Cleft palate" },
        ],
    },
};

export function createFocusFromTerms(label, terms) {
    return {
        source: "current-phenotype-query",
        label,
        sourceDetail: "Current phenotype search resolved to HPO query terms.",
        sourceQuery: label,
        hpoTerms: terms.map((term) => ({
            id: term.id,
            label: term.label,
        })),
    };
}
