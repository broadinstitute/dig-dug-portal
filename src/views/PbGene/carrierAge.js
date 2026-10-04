export function normalizeCarrierAge(value) {
    const text = String(value == null ? "" : value).trim();
    if (!/^\d+(?:\.\d+)?$/.test(text)) return "Unknown";
    const age = Number(text);
    return Number.isFinite(age) && age >= 0 && age <= 100 ? String(age) : "Unknown";
}

const AGE_BANDS = ["0", "1-2", "3-5", "6-9", "10-13", "14-17", "18+", "Unknown"];

export function carrierAgeBand(value) {
    const text = String(value == null ? "" : value).trim();
    if (AGE_BANDS.includes(text)) return text;
    const ageText = normalizeCarrierAge(value);
    if (ageText === "Unknown") return "Unknown";
    const age = Number(ageText);
    if (age < 1) return "0";
    if (age < 3) return "1-2";
    if (age < 6) return "3-5";
    if (age < 10) return "6-9";
    if (age < 14) return "10-13";
    if (age < 18) return "14-17";
    return "18+";
}

export function normalizeCarrierAgeDemographics(demographics) {
    const source = demographics || {};
    const ages = new Map();
    (source.byAge || []).forEach(row => {
        const count = Number(row && row.count);
        if (!Number.isFinite(count) || count <= 0) return;
        const label = carrierAgeBand(row.band);
        ages.set(label, (ages.get(label) || 0) + count);
    });
    return {
        ...source,
        byAge: AGE_BANDS.filter(band => ages.has(band))
            .map(band => ({ band, count: ages.get(band) })),
    };
}
