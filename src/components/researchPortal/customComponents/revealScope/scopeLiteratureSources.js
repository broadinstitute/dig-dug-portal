export const LITERATURE_SOURCES = [
    {
        id: "pubmed",
        label: "PubMed",
        buildUrl(query) {
            return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`;
        },
    },
];
