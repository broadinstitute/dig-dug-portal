// Carrier frequency is a proportion of people; CRDC AF must never substitute for it.
function carrierFrequency(identity) {
    const count = Number(identity.distinctCarriers);
    const total = Number(identity.totalSampleUniverse);
    return identity.totalSampleUniverse != null && Number.isFinite(total) && total > 0
        && Number.isFinite(count) && count >= 0 && count <= total ? count / total : null;
}

function crdcSummaryFrequency(identity) {
    const raw = identity.crdcAF;
    const value = raw == null || String(raw).trim() === '' ? NaN : Number(raw);
    if (Number.isFinite(value) && value >= 0 && value <= 1 && ['allele', 'carrier'].includes(identity.crdcFrequencyKind)) {
        return { kind: identity.crdcFrequencyKind, value, label: `${identity.crdcFrequencyKind === 'allele' ? 'AF' : 'carrier frequency'} ${raw}` };
    }
    const frequency = carrierFrequency(identity);
    return frequency == null ? { kind: null, value: null, label: 'frequency unavailable' }
        : { kind: 'carrier', value: frequency, label: `carrier frequency ${Number(frequency.toPrecision(6))}` };
}

function carrierDemographicSummary(records, metadataById, status) {
    const ids = [...new Set(records.map(row => row.id))];
    const rows = ids.map(id => metadataById[id]).filter(Boolean);
    const countBy = (field, key = 'label', transform = value => value) => {
        const counts = new Map();
        rows.forEach(row => {
            const raw = row[field];
            const label = raw == null || /^(?:\s*|Unavailable|N\/?A|[-–—])$/i.test(String(raw))
                ? 'Unknown' : transform(raw);
            counts.set(label, (counts.get(label) || 0) + 1);
        });
        return [...counts].map(([label, count]) => ({ [key]: label, count }));
    };
    const projects = countBy('project', 'project');
    const fixedCategories = (field, labels, normalize) => {
        const counts = new Map(labels.map(label => [label, 0]));
        rows.forEach(row => {
            const label = normalize(String(row[field] == null ? '' : row[field]).trim().toLowerCase());
            counts.set(label, counts.get(label) + 1);
        });
        return labels.map(label => ({ label, count: counts.get(label) }));
    };
    projects.forEach(project => {
        project.investigators = [...new Set(rows.filter(row => row.project === project.project)
            .map(row => row.investigator).filter(value => value && !/^(?:Unavailable|Unknown|N\/?A)$/i.test(value)))];
    });
    return {
        status: status === 'ready' && rows.length === ids.length ? 'ready' : status === 'loading' ? 'loading' : 'partial',
        matchedMetadataCount: rows.length,
        geneCarrierDemographics: {
            byProject: projects,
            byAge: countBy('age', 'band'),
            bySex: fixedCategories('sex', ['Male', 'Female', 'Unknown'],
                value => /^(m|male)$/.test(value) ? 'Male' : /^(f|female)$/.test(value) ? 'Female' : 'Unknown'),
            byAffected: fixedCategories('affected', ['Yes', 'No', 'Unknown'],
                value => /^(y|yes|true|1|affected)$/.test(value) ? 'Yes' : /^(n|no|false|0|unaffected)$/.test(value) ? 'No' : 'Unknown'),
        },
    };
}

module.exports = { carrierFrequency, crdcSummaryFrequency, carrierDemographicSummary };
