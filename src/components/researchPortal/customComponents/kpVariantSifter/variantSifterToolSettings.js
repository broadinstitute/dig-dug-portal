import { VARIANT_SIFTER_SECTIONS } from "./variantSifterSections.js";
import { LD_SERVER_DEFAULTS } from "./variantSifterLdServer.js";
import { resolveProjectQueryIndex } from "./variantSifterProjects.js";

export const VKS_DEFAULT_GENOME_BUILD = "GRCh37";

export const VKS_SETTINGS_TABS = [
    { id: "settings", label: "Settings" },
    { id: "apis", label: "APIs" },
    { id: "information", label: "Information" },
];

/** All section ids visible by default (checked). */
export function defaultVisibleSectionIds(sections = VARIANT_SIFTER_SECTIONS) {
    return (sections || []).map((section) => section.id);
}

export function normalizeVisibleSectionIds(ids, sections = VARIANT_SIFTER_SECTIONS) {
    const allowed = new Set((sections || []).map((section) => section.id));
    if (!Array.isArray(ids)) {
        return defaultVisibleSectionIds(sections);
    }
    const next = [...new Set(ids.filter((id) => allowed.has(id)))];
    return next.length ? next : defaultVisibleSectionIds(sections);
}

export function isSectionVisible(visibleSectionIds, sectionId) {
    if (!sectionId) {
        return false;
    }
    if (!Array.isArray(visibleSectionIds)) {
        return true;
    }
    return visibleSectionIds.includes(sectionId);
}

/**
 * BioIndex / companion APIs used by Variant Sifter (for Settings → APIs).
 * Relative `path` values are BioIndex routes; resolve with `buildToolApis(host)`.
 */
export const VKS_TOOL_APIS = [
    {
        id: "associations",
        name: "associations",
        service: "KP BioIndex",
        path: "/api/bio/query/associations",
        query: "phenotype,chr:start-end",
        purpose: "Mixed-ancestry association summary statistics for the searched locus.",
        sections: ["associations"],
    },
    {
        id: "ancestry-associations",
        name: "ancestry-associations",
        service: "KP BioIndex",
        path: "/api/bio/query/ancestry-associations",
        query: "phenotype,ancestry,chr:start-end",
        purpose: "Ancestry-specific association rows and availability probes.",
        sections: ["associations"],
    },
    {
        id: "credible-sets",
        name: "credible-sets",
        service: "KP BioIndex",
        path: "/api/bio/query/credible-sets",
        query: "phenotype[,ancestry],chr:start-end",
        purpose: "List fine-mapped credible sets overlapping the locus.",
        sections: ["credible-sets"],
    },
    {
        id: "credible-variants",
        name: "credible-variants",
        service: "KP BioIndex",
        path: "/api/bio/query/credible-variants",
        query: "phenotype,credibleSetId",
        purpose: "Member variants for selected credible sets.",
        sections: ["credible-sets"],
    },
    {
        id: "c2ct-credible-set",
        name: "c2ct-credible-set",
        service: "KP BioIndex",
        path: "/api/bio/query/c2ct-credible-set",
        query: "phenotype[,ancestry],credibleSetId",
        purpose:
            "CS2CT tissue / annotation evidence for credible sets (assistant tissue classification).",
        sections: ["global-enrichment", "credible-sets"],
    },
    {
        id: "genes",
        name: "genes",
        service: "KP BioIndex",
        path: "/api/bio/query/genes",
        query: "chr:start-end",
        purpose: "Gene symbols overlapping the locus (track layout).",
        sections: ["genes"],
    },
    {
        id: "gene-match",
        name: "gene",
        service: "KP BioIndex",
        path: "/api/bio/match/gene",
        query: "prefix",
        purpose: "Gene symbol autocomplete in search.",
        sections: ["associations"],
    },
    {
        id: "varid-lookup",
        name: "varIdLookup",
        service: "KP BioIndex",
        path: "/api/bio/varIdLookup/{varId}",
        query: "variant id",
        purpose: "Resolve a variant id to a genomic region for search.",
        sections: ["associations"],
    },
    {
        id: "global-enrichment",
        name: "global-enrichment",
        service: "KP BioIndex",
        path: "/api/bio/query/global-enrichment",
        query: "phenotype",
        purpose: "Tissue × annotation enrichment statistics for the phenotype.",
        sections: ["global-enrichment", "variant-to-gene-links"],
    },
    {
        id: "regions",
        name: "regions",
        service: "KP BioIndex",
        path: "/api/bio/query/regions",
        query: "chr:start-end",
        purpose: "Locus annotation / enriched-region intervals.",
        sections: ["global-enrichment"],
    },
    {
        id: "tissue-regions",
        name: "tissue-regions",
        service: "KP BioIndex",
        path: "/api/bio/query/tissue-regions",
        query: "tissue,chr:start-end",
        purpose: "Biosample-level annotation intervals for selected tissues.",
        sections: ["global-enrichment"],
    },
    {
        id: "gene-links",
        name: "gene-links",
        service: "KP BioIndex",
        path: "/api/bio/query/gene-links",
        query: "tissue,chr:start-end",
        purpose: "Variant-to-gene linking evidence by tissue and method.",
        sections: ["variant-to-gene-links"],
    },
    {
        id: "variant-links",
        name: "variant-links",
        service: "KP BioIndex",
        path: "/api/bio/query/variant-links",
        query: "chr:start-end",
        purpose: "SNP-to-gene linking evidence for the locus (synthetic tissue bucket).",
        sections: ["snp2gene-links"],
    },
    {
        id: "gene-annotations",
        name: "annotation/genes",
        service: "UMich LocusZoom portaldev",
        path: "https://portaldev.sph.umich.edu/api/v1/annotation/genes/",
        query: "gene_name in … (source 3 = GRCh37, source 1 = GRCh38)",
        purpose: "Exon / strand annotation for genes track drawing.",
        sections: ["genes"],
    },
    {
        id: "ld-server",
        name: "LD server",
        service: "UMich 1000 Genomes LD",
        path: `${LD_SERVER_DEFAULTS.baseUrl}/genome_builds/{build}/…`,
        query: `reference=${LD_SERVER_DEFAULTS.reference}, population, region`,
        purpose: "Pairwise LD (r²) scores relative to the reference variant.",
        sections: ["associations"],
    },
];

function joinBioIndexUrl(host, path) {
    const raw = String(path || "");
    if (/^https?:\/\//i.test(raw)) {
        return raw;
    }
    const base = String(host || "").replace(/\/+$/, "");
    const route = raw.startsWith("/") ? raw : `/${raw}`;
    return base ? `${base}${route}` : route;
}

/**
 * Resolve API catalog entries to full URLs using the portal BioIndex host
 * and optional project-specific host routing.
 */
export function buildToolApis(
    bioIndexHost,
    {
        projectId = "",
        defaultBioIndexHost = null,
        resolveHostForIndex = null,
    } = {}
) {
    const fallback = defaultBioIndexHost || bioIndexHost;
    return VKS_TOOL_APIS.map((api) => {
        let host = bioIndexHost;
        if (typeof resolveHostForIndex === "function") {
            host = resolveHostForIndex(api.name) || fallback;
        } else if (projectId) {
            host = fallback;
        }
        const resolvedName = resolveProjectQueryIndex(api.name, projectId);
        const path =
            resolvedName !== api.name &&
            typeof api.path === "string" &&
            api.path.includes(`/query/${api.name}`)
                ? api.path.replace(`/query/${api.name}`, `/query/${resolvedName}`)
                : api.path;
        const service =
            host && fallback && host !== fallback
                ? `Project BioIndex (${host})`
                : api.service;
        return {
            ...api,
            name: resolvedName,
            path,
            query:
                resolvedName === "associations" &&
                api.id === "ancestry-associations"
                    ? "phenotype,ancestry,chr:start-end (via associations)"
                    : api.query,
            service:
                /^https?:\/\//i.test(api.path) || api.id === "ld-server"
                    ? api.service
                    : service,
            url: joinBioIndexUrl(host || fallback, path),
        };
    });
}

export function buildToolInformation({ searchSession = null, genomeBuild = VKS_DEFAULT_GENOME_BUILD } = {}) {
    const region = searchSession?.region;
    const regionLabel = searchSession?.regionLabel
        || (region
            ? `${region.chr}:${Number(region.start).toLocaleString()}-${Number(region.end).toLocaleString()}`
            : null);

    return [
        {
            label: "Tool",
            value: "KP Variant Sifter",
        },
        {
            label: "Genome build",
            value: genomeBuild,
            detail:
                "Gene track coordinates, LD reference panels, and association locus queries default to this build.",
        },
        {
            label: "Gene locations",
            value: `BioIndex genes + portaldev annotations (${genomeBuild})`,
            detail:
                "Locus gene symbols come from BioIndex `genes`; exon structure uses the UMich annotation API for the same build.",
        },
        {
            label: "LD reference",
            value: `${LD_SERVER_DEFAULTS.reference} (${LD_SERVER_DEFAULTS.genomeBuild})`,
            detail: "Population is mapped from the selected ancestry for r² coloring.",
        },
        {
            label: "Phenotype",
            value: searchSession?.phenotype?.description
                || searchSession?.phenotype?.name
                || "—",
        },
        {
            label: "Ancestry",
            value: searchSession?.ancestry || "—",
        },
        {
            label: "Active region",
            value: regionLabel || "—",
        },
    ];
}
