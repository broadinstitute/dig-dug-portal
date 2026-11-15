const PRESENT = (value) => value != null && value !== "" && value !== "—" && value !== "-";

function burdenScoreValue(variant) {
    if (variant.loftee === 'HC') return 1;
    return PRESENT(variant.alphaMissense) && Number.isFinite(Number(variant.alphaMissense)) ? Number(variant.alphaMissense) : null;
}

function burdenScoreSource(variant) {
    if (variant.loftee === 'HC') return 'HC';
    if (burdenScoreValue(variant) != null) return 'AM';
    if (PRESENT(variant.revel) && Number.isFinite(Number(variant.revel))) return 'REVEL';
    return 'none';
}

function burdenPathogenicScore(variant) {
    if (variant.loftee === "HC") return { display: "1.00", title: "LoFTEE HC" };

    const alphaMissense = burdenScoreValue(variant);
    if (alphaMissense != null) {
        return { display: alphaMissense.toFixed(2), title: "AlphaMissense score" };
    }
    if (burdenScoreSource(variant) === 'REVEL') return { display: "—*", title: "REVEL available; excluded from this score" };
    return { display: "—", title: "No LoFTEE HC, AlphaMissense, or REVEL annotation" };
}

function variantScoreExplanation(variant) {
    const value = burdenScoreValue(variant);
    if (value == null) return burdenPathogenicScore(variant).title + '. No numeric score is assigned; genotype does not supply a missing annotation.';
    const label = burdenScoreSource(variant) === 'HC' ? 'LoFTEE HC' : 'AlphaMissense';
    let text = `${label} variant score = ${value}; displayed as ${value.toFixed(2)}. This is the annotation score, without genotype multiplication.`;
    const alleles = String(variant.genotype || '').split(/[|/]/);
    if (alleles.length <= 2 && alleles.every(allele => /^[01]$/.test(allele))) {
        const dosage = alleles.filter(allele => allele === '1').length;
        const weighted = Number((value * dosage).toPrecision(12));
        text += ` GT ${variant.genotype} has ${dosage} alternate ${dosage === 1 ? 'copy' : 'copies'}. For a separate dosage-weighted aggregation, ${value} × ${dosage} = ${weighted}; that is not the value shown in this column.`;
    }
    return text;
}

module.exports = { burdenPathogenicScore, burdenScoreValue, burdenScoreSource, variantScoreExplanation };
