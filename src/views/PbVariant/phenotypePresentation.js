const { hpoPath } = require('./hpoHierarchy');

function phenotypeDataSelection(records, metadataById) {
    const present = [], absent = [], unknown = [];
    for (const record of records) {
        const metadata = metadataById[record.id];
        const value = metadata && metadata.phenotypeDataAvailable != null ? metadata.phenotypeDataAvailable
            : record.phenotypeDataAvailable != null ? record.phenotypeDataAvailable
            : record.phenotypes && record.phenotypes.length ? true : null;
        (value === true ? present : value === false ? absent : unknown).push(record);
    }
    return { present, absent, unknown, total: records.length };
}

function profileTermCounts(records, metadataById, terms) {
    const unique = [...new Map(records.map(record => [record.id, record])).values()];
    const metadata = unique.map(record => {
        const joined = metadataById[record.id];
        if (joined && Array.isArray(joined.phenotypes)) return joined.phenotypes;
        return record.phenotypes && record.phenotypes.length ? record.phenotypes : null;
    });
    return terms.map(id => ({
        id, total: unique.length, metadataCount: metadata.filter(Boolean).length,
        count: metadata.filter(categories => categories && categories.some(category =>
            category.id === id || category.terms.some(term => term.id === id))).length,
    }));
}

function profileTermClass(id, terms) {
    if (terms.includes(id)) return 'is-profile-term';
    return terms.some(term => hpoPath(term).slice(0, -1).includes(id)) ? 'is-profile-ancestor' : '';
}

const depthColors = ['#2563a6', '#167d8d', '#7460a6', '#b07038', '#587861', '#7f6279', '#526e8a', '#716d52'];
function phenotypeDepthColor(depth) {
    return depthColors[Math.min(Math.max(Number(depth) || 0, 0), depthColors.length - 1)];
}

module.exports = { profileTermCounts, profileTermClass, phenotypeDepthColor, phenotypeDataSelection };
