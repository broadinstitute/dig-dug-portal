// Mockup-only projection of the private BioIndex Gene variant index.
// The upstream rows contain sample identifiers; never forward the raw rows.

const MAX_PAGES = 100;
const MAX_VARIANTS = 10000;

function firstValue(row, names) {
    for (const name of names) {
        const value = row[name];
        if (value !== undefined && value !== null && value !== "") return value;
    }
    return null;
}

function plainText(value) {
    return typeof value === "string" || typeof value === "number"
        ? String(value).slice(0, 160)
        : "";
}

function firstAnnotationValue(row, names) {
    for (const name of names) {
        const text = plainText(row[name]).trim();
        if (text && !/^(?:na|n\/a|nan|unavailable|—|-)$/i.test(text)) return text;
    }
    return "";
}

function projectVariant(row) {
    const chrom = plainText(firstValue(row, ["chromosome", "CHROM", "chrom"])).replace(/^chr/i, "");
    const position = Number(firstValue(row, ["position", "POS", "pos"]));
    const ref = plainText(firstValue(row, ["reference", "REF", "ref"]));
    const alt = plainText(firstValue(row, ["alt", "ALT", "alternate"]));
    if (!/^(?:[0-9]{1,2}|X|Y|M|MT)$/.test(chrom) || !Number.isSafeInteger(position) || position < 1 ||
        !/^[ACGTN*.-]+$/i.test(ref) || !/^[ACGTN*.,-]+$/i.test(alt)) return null;

    return {
        id: `chr${chrom}:${position}:${ref}:${alt}`,
        position,
        consequence: plainText(firstValue(row, ["Consequence", "consequence", "most_severe_consequence"])),
        hgvsc: firstAnnotationValue(row, ["HGVSc", "hgvsc", "hgvs_c"]),
        hgvsp: firstAnnotationValue(row, ["HGVSp", "hgvsp", "hgvs_p"]),
        clinvar: plainText(firstValue(row, ["ClinVar_CLNSIG", "CLIN_SIG", "clinical_sig"])),
        gnomadAF: firstAnnotationValue(row, ["gnomAD_AF", "gnomad_AF", "gnomad_exome_af", "gnomADe_AF"]),
        revel: plainText(firstValue(row, ["REVEL", "revel"])),
        alphaMissense: plainText(firstValue(row, ["am_pathogenicity", "AlphaMissense", "alphamissense"])),
        loftee: plainText(firstValue(row, ["LoF", "LOFTEE", "lof"])),
    };
}

async function readBioIndexPage(baseUrl, path, params) {
    const url = new URL(path, `${baseUrl.replace(/\/$/, "")}/`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`BioIndex returned ${response.status}`);
    return response.json();
}

async function publicVariantsForGene(baseUrl, gene, start, end) {
    const variants = new Map();
    const inViewCarriers = new Set();
    const densitySets = start != null ? Array.from({ length: 60 }, () => new Set()) : [];
    let completeCarrierData = true;
    let page = await readBioIndexPage(baseUrl, "/api/bio/query/gene-variants-crdc", { q: gene });
    let pageNumber = 0;
    while (page) {
        pageNumber += 1;
        if (pageNumber > MAX_PAGES) throw new Error("BioIndex continuation limit exceeded");
        if (!Array.isArray(page.data)) throw new Error("Unexpected BioIndex response");
        for (const row of page.data) {
            const projected = projectVariant(row);
            if (projected) {
                const entry = variants.get(projected.id) || {
                    variant: projected,
                    sampleIds: new Set(),
                    reportedCarrierCount: 0,
                };
                if (!entry.variant.hgvsc && projected.hgvsc) entry.variant.hgvsc = projected.hgvsc;
                if (!entry.variant.hgvsp && projected.hgvsp) entry.variant.hgvsp = projected.hgvsp;
                if (!entry.variant.gnomadAF && projected.gnomadAF) entry.variant.gnomadAF = projected.gnomadAF;
                if (Array.isArray(row.samples)) {
                    for (const sample of row.samples) {
                        if (typeof sample === "string" && sample) entry.sampleIds.add(sample);
                    }
                }
                const reportedCount = Number(firstValue(row, ["carrier_count", "carrierCount", "n_carriers"]));
                if (Number.isSafeInteger(reportedCount) && reportedCount > entry.reportedCarrierCount) {
                    entry.reportedCarrierCount = reportedCount;
                }
                variants.set(projected.id, entry);
            }
            if (projected && (start == null || (projected.position >= start && projected.position <= end))) {
                if (!Array.isArray(row.samples)) {
                    completeCarrierData = false;
                } else {
                    const bin = start == null ? -1 : Math.min(59, Math.floor((projected.position - start) / Math.max(end - start + 1, 1) * 60));
                    for (const sample of row.samples) {
                        if (typeof sample !== "string" || !sample) continue;
                        inViewCarriers.add(sample);
                        if (bin >= 0) densitySets[bin].add(sample);
                    }
                }
            }
            if (variants.size > MAX_VARIANTS) throw new Error("BioIndex variant limit exceeded");
        }
        page = page.continuation
            ? await readBioIndexPage(baseUrl, "/api/bio/cont", { token: page.continuation })
            : null;
    }
    return {
        variants: [...variants.values()]
            .map(entry => ({
                ...entry.variant,
                carrierCount: entry.sampleIds.size || entry.reportedCarrierCount,
            }))
            .filter(row => row.carrierCount > 0)
            .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)),
        distinctCarriers: completeCarrierData ? inViewCarriers.size : null,
        carrierDensity: completeCarrierData ? densitySets.map(samples => samples.size) : [],
    };
}

module.exports = function registerPublicGeneVariantEndpoint(app, privateBioIndexBase) {
    app.get("/__public_gene_variants__", async (request, response) => {
        response.set("Cache-Control", "private, no-store");
        const gene = String(request.query.gene || "").trim().toUpperCase();
        if (!/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene)) {
            response.status(400).json({ error: "Enter a valid gene symbol." });
            return;
        }
        const start = request.query.start == null ? null : Number(request.query.start);
        const end = request.query.end == null ? null : Number(request.query.end);
        if ((start == null) !== (end == null) || (start != null &&
            (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end <= start))) {
            response.status(400).json({ error: "Enter a valid locus range." });
            return;
        }
        if (!privateBioIndexBase) {
            response.status(503).json({ error: "Public variant projection is unavailable in this server configuration." });
            return;
        }
        try {
            response.json({ gene, ...(await publicVariantsForGene(privateBioIndexBase, gene, start, end)) });
        } catch (error) {
            response.status(502).json({ error: "Variant annotations could not be loaded." });
        }
    });
};
