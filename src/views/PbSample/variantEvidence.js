const PRESENT = (value) => value != null && value !== "" && value !== "—" && value !== "-";

function burdenPathogenicScore(variant) {
    if (variant.loftee === "HC") return { display: "1.00", title: "LoFTEE HC" };

    const alphaMissense = Number(variant.alphaMissense);
    if (PRESENT(variant.alphaMissense) && Number.isFinite(alphaMissense)) {
        return { display: alphaMissense.toFixed(2), title: "AlphaMissense score" };
    }
    if (PRESENT(variant.revel)) return { display: "—*", title: "REVEL available; excluded from this score" };
    return { display: "—", title: "No LoFTEE HC, AlphaMissense, or REVEL annotation" };
}

module.exports = { burdenPathogenicScore };
