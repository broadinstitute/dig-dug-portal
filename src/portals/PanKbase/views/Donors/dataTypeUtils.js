const DEFAULT_DATA_TYPE_DETAILS = {
    description: "Data available for this donor cohort in PanKbase.",
    explorerButtons: [],
    libraryButton: null,
};

const DATA_TYPE_ALIASES = {
    bulk_RNA_seq: "bulk_RNA-seq",
    "single_nuclear_ATAC-seq": "single_nucleus_ATAC-seq",
};

const DATA_TYPE_DETAILS = {
    dynamic_perifusion: {
        label: "Dynamic perifusion",
        description: "measurement of pancreatic islet function",
        explorerButtons: [
            {
                label: "Functional Browser",
                href: "/functional.html",
                includeFiltersInUrl: true,
            },
        ],
        libraryButton: {
            label: "Data Library",
            href: "https://data.pankbase.org/search/?type=AnalysisSet&assay_titles=an+analyte+assay+that+measures+the+abundance+of+a+hormone"
        },
    },
    "bulk_RNA-seq": {
        label: "Bulk RNA-seq",
        description: "bulk measurement of gene transcript abundance, either from tissue or sorted cells",
        libraryButton: {
            label: "Data Library",
            href: "https://data.pankbase.org/search/?type=AnalysisSet&query=RNA-seq",
        },
    },
    "single_cell_RNA-seq": {
        label: "Single-cell RNA-seq",
        description: "single cell measurement of gene transcript abundance",
        explorerButtons: [
            {
                label: "Single Cell Browser",
                href: "/single-cell.html",
            },
            {
                label: "DE Browser",
                href: "/diff-exp.html",
            },
        ],
        libraryButton: {
            label: "Data Library",
            href: "https://data.pankbase.org/search/?type=AnalysisSet&query=scRNA",
        },
    },
    "single_nucleus_ATAC-seq": {
        label: "Single-nucleus ATAC-seq",
        description: "single cell measurement of accessible/open chromatin",
        explorerButtons: [
            {
                label: "Genome Browser",
                href: "/atacseq.html",
            },
        ],
        libraryButton: {
            label: "Data Library",
            href: "https://data.pankbase.org/search/?type=AnalysisSet&query=snATAC",
        },
    },
};

export function normalizeDataTypeValue(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
        return "";
    }

    const normalized = trimmed
        .replace(/single_nuclear/gi, "single_nucleus")
        .replace(/_RNA_seq\b/g, "_RNA-seq")
        .replace(/_ATAC_seq\b/g, "_ATAC-seq");

    return DATA_TYPE_ALIASES[normalized] || normalized;
}

export function getDataTypeDetails(value) {
    const normalized = normalizeDataTypeValue(value);
    return DATA_TYPE_DETAILS[normalized] || DEFAULT_DATA_TYPE_DETAILS;
}

export function formatDataTypeLabel(value) {
    const normalized = normalizeDataTypeValue(value);
    const details = getDataTypeDetails(normalized);
    if (details.label) {
        return details.label;
    }

    const baseLabel = normalized
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!baseLabel) {
        return "";
    }

    const normalizedLabel = baseLabel
        .replace(/\bsingle[\s-]+cell\b/gi, "Single-cell")
        .replace(/\bsingle[\s-]+nuclear\b/gi, "Single-nucleus")
        .replace(/\bsingle[\s-]+nucleus\b/gi, "Single-nucleus");

    return normalizedLabel.charAt(0).toUpperCase() + normalizedLabel.slice(1);
}
