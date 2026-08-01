const {
    PB_VARIANT_IDENTIFIER_BY_VARIANT,
    PB_VARIANT_IDENTIFIER_REFERENCE,
} = require("./variantIdentifierReference.generated");

function clean(value) {
    return String(value == null ? "" : value).trim();
}

function canonicalVariantId(value) {
    return clean(value).replace(/,/g, "").replace(/^chr/i, "").toUpperCase();
}

function isVariantId(value) {
    return /^(?:chr)?(?:1\d?|2[0-2]?|[3-9]|X|Y|XY|MT?):\d+:[ACGT]+:[ACGT]+$/i.test(clean(value).replace(/,/g, ""));
}

function isRsid(value) {
    return /^rs\d+$/i.test(clean(value));
}

function resolveRsidReference(value) {
    return PB_VARIANT_IDENTIFIER_REFERENCE[clean(value).toLowerCase()] || null;
}

function resolveVariantReference(value) {
    return PB_VARIANT_IDENTIFIER_BY_VARIANT[canonicalVariantId(value)] || null;
}

function gnomadVariantHref(value) {
    if (!isVariantId(value)) return null;
    return `https://gnomad.broadinstitute.org/variant/${canonicalVariantId(value).replace(/:/g, "-")}?dataset=gnomad_r4`;
}

function splitHgvs(value) {
    const text = clean(value);
    const separator = text.indexOf(":");
    return separator < 0
        ? { accession: null, notation: text || null }
        : { accession: text.slice(0, separator) || null, notation: text.slice(separator + 1) || null };
}

function maneIds(geneInfo) {
    const ids = clean(geneInfo && geneInfo.maneSelect).replace(/^"|"$/g, "").split("|");
    return {
        ensembl: ids.find(id => /^ENST\d+(?:\.\d+)?$/.test(id)) || null,
        refseq: ids.find(id => /^N[MR]_\d+(?:\.\d+)?$/.test(id)) || null,
    };
}

function transcriptGene(row) {
    return clean(row && (row.symbol || row.gene_symbol || row.geneId)).toUpperCase();
}

function transcriptGeneChoices(rows) {
    return Array.from(new Set((rows || []).map(transcriptGene).filter(Boolean)));
}

function chooseTranscript(rows, geneInfo = {}) {
    const gene = clean(geneInfo.symbol).toUpperCase();
    const candidates = (rows || []).filter(row => !gene || transcriptGene(row) === gene);
    if (!candidates.length) return null;
    const mane = maneIds(geneInfo);
    const maneBase = clean(mane.ensembl).replace(/\.\d+$/, "");
    return candidates.find(row => clean(row.Feature || row.transcriptId).replace(/\.\d+$/, "") === maneBase)
        || candidates.find(row => String(row.pick) === "1")
        || candidates.find(row => clean(row.biotype) === "protein_coding")
        || candidates[0];
}

function buildTranscriptIdentity(rows, geneInfo = {}) {
    const row = chooseTranscript(rows, geneInfo);
    const mane = maneIds(geneInfo);
    if (!row) {
        return {
            hgvsc: null,
            hgvsp: null,
            ensemblTranscript: mane.ensembl,
            ensemblProtein: null,
            refseqTranscript: mane.refseq || clean(geneInfo.refseqAccession) || null,
            rsid: null,
        };
    }
    const hgvsc = splitHgvs(row.hgvsc || row.HGVSc);
    const hgvsp = splitHgvs(row.hgvsp || row.HGVSp);
    const transcriptBase = clean(hgvsc.accession || row.Feature || row.transcriptId).replace(/\.\d+$/, "");
    const maneBase = clean(mane.ensembl).replace(/\.\d+$/, "");
    const rsid = clean(row.rs_dbSNP || row.existing_variation || row.Existing_variation)
        .split(/[;,|]/)
        .find(value => /^rs\d+$/i.test(value)) || null;
    return {
        hgvsc: hgvsc.notation,
        hgvsp: hgvsp.notation,
        ensemblTranscript: hgvsc.accession || clean(row.Feature || row.transcriptId) || null,
        ensemblProtein: hgvsp.accession,
        refseqTranscript: transcriptBase && transcriptBase === maneBase
            ? mane.refseq
            : clean(geneInfo.refseqAccession) || null,
        rsid,
    };
}

module.exports = {
    buildTranscriptIdentity,
    canonicalVariantId,
    gnomadVariantHref,
    isRsid,
    isVariantId,
    resolveRsidReference,
    resolveVariantReference,
    splitHgvs,
    transcriptGeneChoices,
};
