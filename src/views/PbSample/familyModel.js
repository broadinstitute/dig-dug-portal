const FAMILY_ROLE_ORDER = {
    case: 0,
    index: 0,
    twin: 1,
    sibling: 2,
    mother: 3,
    father: 3,
};

function familyIdFromSampleId(sampleId) {
    const match = /^(BCH-\d{2}-\d{5})-\d{2}$/i.exec(String(sampleId || "").trim());
    return match ? match[1].toUpperCase() : "";
}

function sortFamilyMembers(members) {
    return [...(members || [])].sort((a, b) => {
        const aRank = FAMILY_ROLE_ORDER[String(a.role || "").trim().toLowerCase()] ?? 4;
        const bRank = FAMILY_ROLE_ORDER[String(b.role || "").trim().toLowerCase()] ?? 4;
        return aRank - bRank || String(a.sampleId).localeCompare(String(b.sampleId));
    });
}

module.exports = { familyIdFromSampleId, sortFamilyMembers };
