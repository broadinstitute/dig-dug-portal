export const focusSourceOptions = [
    { key: "none", label: "No context" },
    { key: "manual", label: "HPO terms" },
    { key: "orphanet", label: "Orphanet" },
    { key: "mondo", label: "MONDO" },
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
        label: "Orphanet HPO profile",
        sourceDetail: "Select an Orphanet disease to load its HPO annotations.",
        queryExample: "",
        sourceInputLabel: "Orphanet disease",
        sourceInputPlaceholder: "Search disease name or ID, e.g. ORPHA:1934",
        sourceInputHelp: "The disease label resolves to an HPO-term profile before comparison.",
        hpoTerms: [],
    },
    mondo: {
        source: "mondo",
        label: "MONDO disease concept HPO profile",
        sourceDetail: "Select a MONDO concept with an Orphanet mapping to load its HPO annotations.",
        queryExample: "",
        sourceInputLabel: "MONDO disease concept",
        sourceInputPlaceholder: "Search disease name or ID, e.g. MONDO:...",
        sourceInputHelp: "MONDO supplies the disease concept; mapped Orphanet annotations supply the HPO profile.",
        hpoTerms: [],
    },
    manual: {
        source: "manual",
        label: "Selected HPO context",
        sourceDetail: "HPO terms selected by term name or HP identifier.",
        queryExample: "",
        sourceInputLabel: "Context label (optional)",
        sourceInputPlaceholder: "e.g. neurodevelopmental phenotype",
        sourceInputHelp: "Add HPO terms by name or HP identifier below.",
        hpoTerms: [],
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
