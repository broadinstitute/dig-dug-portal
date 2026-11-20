export function pathogenicityClass(clinvar) {
    if (!clinvar) return "";
    const values = String(clinvar)
        .toLowerCase()
        .replace(/_/g, " ")
        .split(/[&,;|/]+/)
        .map(value => value.trim());
    if (values.some(value => value === "p" || /^pathogenic\b/.test(value))) {
        return "pbg-badge--pathogenic";
    }
    if (values.some(value => value === "lp" || /^likely pathogenic\b/.test(value))) {
        return "pbg-badge--likely-path";
    }
    if (values.some(value => value === "vus" || /^uncertain significance\b/.test(value))) {
        return "pbg-badge--vus";
    }
    return "";
}
