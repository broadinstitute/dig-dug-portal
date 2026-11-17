// Carrier summaries computed from the carrier rows already loaded from the
// GeneResult data link (gene-variants-crdc + gene-samples + samples-info).
import { carrierAgeBand } from "./carrierAge";

const MISSING = /^(?:unavailable|unknown|n\/?a|none|[-–—])$/i;
const isMissing = value => value == null || value === "" || MISSING.test(String(value).trim());

function hpoIdsOf(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (isMissing(value)) return null;
    return String(value).split(/[,;|\s]+/).filter(id => /^HP:\d+$/i.test(id));
}

function sexLabel(value) {
    const text = String(value == null ? "" : value).trim().toLowerCase();
    if (text === "f" || text === "female") return "Female";
    if (text === "m" || text === "male") return "Male";
    return "Unknown";
}

function affectedLabel(value) {
    const text = String(value == null ? "" : value).trim().toLowerCase();
    if (["yes", "y", "true", "1", "affected"].includes(text)) return "Yes";
    if (["no", "n", "false", "0", "unaffected"].includes(text)) return "No";
    return "Unknown";
}

function count(map, key, extra) {
    const entry = map.get(key) || { count: 0, ...extra };
    entry.count++;
    map.set(key, entry);
}

// detailOf(sample) -> loaded samples-info detail ({age, sex, hpo, project, ...}) or undefined.
export function buildCarrierSummary(samples, detailOf = () => undefined) {
    const unique = new Map();
    (samples || []).forEach(sample => { if (sample && sample.id != null && !unique.has(sample.id)) unique.set(sample.id, sample); });
    const ages = new Map(), sexes = new Map(), affected = new Map(), probands = new Map(), projects = new Map(), investigators = new Map();
    const phenotypes = new Map();
    let phenotypeMetadataCount = 0;
    unique.forEach(sample => {
        const detail = detailOf(sample) || {};
        const field = name => (detail[name] != null && !isMissing(detail[name]) ? detail[name] : sample[name]);
        count(ages, carrierAgeBand(field("age")));
        count(sexes, sexLabel(field("sex")));
        count(affected, affectedLabel(field("affected")));
        count(probands, /proband/i.test(String(field("proband") || "")) && !/non/i.test(String(field("proband"))) ? "Proband" : "Unknown");
        const investigator = isMissing(field("group")) ? "" : String(field("group"));
        const project = isMissing(field("project")) ? (investigator || "Unknown") : String(field("project"));
        count(projects, project, { investigators: new Set() });
        if (investigator) projects.get(project).investigators.add(investigator);
        count(investigators, investigator || "Unknown");
        const hpo = hpoIdsOf(field("hpo"));
        if (hpo) {
            phenotypeMetadataCount++;
            new Set(hpo).forEach(id => phenotypes.set(id, (phenotypes.get(id) || 0) + 1));
        }
    });
    const rows = (map, key) => [...map].map(([label, entry]) => ({ [key]: label, count: entry.count }))
        .sort((a, b) => b.count - a.count || String(a[key]).localeCompare(String(b[key])));
    return {
        status: "ready",
        carrierTotal: unique.size,
        matchedMetadataCount: unique.size,
        phenotypeMetadataCount,
        observedPhenotypes: [...phenotypes].map(([hpoId, n]) => ({ hpoId, count: n })).sort((a, b) => b.count - a.count || a.hpoId.localeCompare(b.hpoId)),
        coCarrierGenes: [],
        geneCarrierDemographics: {
            byProject: [...projects].map(([project, entry]) => ({ project, count: entry.count, investigators: [...entry.investigators] }))
                .sort((a, b) => b.count - a.count || a.project.localeCompare(b.project)),
            byAge: rows(ages, "band"),
            bySex: rows(sexes, "label"),
            byAffected: rows(affected, "label"),
            byProband: rows(probands, "label"),
            byInvestigator: rows(investigators, "inv"),
        },
    };
}

export { hpoIdsOf, isMissing };
