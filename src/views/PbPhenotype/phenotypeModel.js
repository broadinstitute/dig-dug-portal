export const FREQUENCIES = [
    ["Obligate (100%)", "Obligate", 0.9950],
    ["Very frequent (99-80%)", "Very frequent", 0.8911],
    ["Frequent (79-30%)", "Frequent", 0.5446],
    ["Occasional (29-5%)", "Occasional", 0.1733],
    ["Very rare (<4-1%)", "Very rare", 0.0297],
];

export const TERM_COLORS = [
    ["#E69F00", "#c77f00", "#fdf1d6", "#f3d58a"],
    ["#56B4E9", "#1f7fb8", "#e4f3fb", "#b5dcf3"],
    ["#009E73", "#007a58", "#dcf3ec", "#9bd9c6"],
    ["#F0E442", "#9a8f00", "#fbf8d4", "#e8df7a"],
    ["#0072B2", "#0072B2", "#e0eef8", "#a6cbe8"],
    ["#CC79A7", "#a8558a", "#f8e9f2", "#ebc4da"],
    ["#000000", "#222222", "#ededed", "#c8c8c8"],
    ["#999999", "#777777", "#f0f0f0", "#cfcfcf"],
];

const frequencyWeight = Object.fromEntries(
    FREQUENCIES.map(([name, , weight]) => [name, weight])
);
const profileCache = new WeakMap();
export const CANDIDATE_SCORE_THRESHOLD = 0.10;
export const EXCLUDED_TERM_PENALTY = 0.5;
export const AGE_BANDS = [
    { label: "0", min: 0, max: 0 },
    { label: "1–2", min: 1, max: 2 },
    { label: "3–5", min: 3, max: 5 },
    { label: "6–9", min: 6, max: 9 },
    { label: "10–13", min: 10, max: 13 },
    { label: "14–17", min: 14, max: 17 },
    { label: "18+", min: 18, max: 100 },
];

export function validAge(value) {
    if ((typeof value !== "string" && typeof value !== "number") ||
        String(value).trim() === "") return null;
    const age = Number(value);
    return Number.isFinite(age) && age >= 0 && age <= 100 ? age : null;
}

export function ageBand(value) {
    const age = validAge(value);
    if (age == null) return "Unknown";
    const years = Math.floor(age);
    return AGE_BANDS.find((band) => years >= band.min && years <= band.max)?.label || "Unknown";
}

function profilesFor(reference) {
    if (!profileCache.has(reference)) {
        const profiles = new Map();
        const ancestorCache = new Map();
        const ancestorsOf = (id) => {
            if (ancestorCache.has(id)) return ancestorCache.get(id);
            const result = new Set();
            const pending = [...(reference.terms[id]?.[2] || [])];
            while (pending.length) {
                const parent = pending.pop();
                if (result.has(parent) || parent === id) continue;
                result.add(parent);
                pending.push(...(reference.terms[parent]?.[2] || []));
            }
            ancestorCache.set(id, result);
            return result;
        };
        Object.entries(reference.associations).forEach(
            ([hpoId, associations]) =>
                associations.forEach(([index, frequency, diagnostic]) => {
                    const weight = frequencyWeight[frequency];
                    if (!weight) return; // Orphanet Excluded (0%) has no score or penalty.
                    if (!profiles.has(index)) profiles.set(index, new Map());
                    const annotations = profiles.get(index);
                    const previous = annotations.get(hpoId);
                    if (!previous || weight > previous.weight) {
                        annotations.set(hpoId, {
                            hpoId, frequency, weight,
                            diagnostic: Boolean(diagnostic) || Boolean(previous?.diagnostic),
                        });
                    } else if (diagnostic) {
                        previous.diagnostic = true;
                    }
                })
        );
        const prepared = new Map();
        profiles.forEach((annotations, index) => {
            const profile = [...annotations.values()];
            // Evaluate every annotation against the full set simultaneously.
            const denominator = profile.reduce((sum, term) => {
                const relatedWinner = profile.some((other) =>
                    other !== term &&
                    (ancestorsOf(term.hpoId).has(other.hpoId) ||
                        ancestorsOf(other.hpoId).has(term.hpoId)) &&
                    (other.weight > term.weight ||
                        (other.weight === term.weight &&
                            ancestorsOf(other.hpoId).has(term.hpoId)))
                );
                return sum + (relatedWinner ? 0 : term.weight);
            }, 0);
            const matches = new Map();
            profile.forEach((term) => {
                [term.hpoId, ...ancestorsOf(term.hpoId)].forEach((id) => {
                    const previous = matches.get(id);
                    if (!previous || term.weight > previous.weight) {
                        matches.set(id, { ...term });
                    } else if (term.diagnostic) {
                        previous.diagnostic = true;
                    }
                });
            });
            prepared.set(index, { profile, denominator, matches });
        });
        profileCache.set(reference, prepared);
    }
    return profileCache.get(reference);
}

export function resolveHpoId(reference, query) {
    const id = String(query || "")
        .trim()
        .match(/^HP:\d{7}$/i);
    if (id) return id[0].toUpperCase();
    const name = String(query || "")
        .trim()
        .toLocaleLowerCase();
    return (
        Object.keys(reference.terms).find(
            (key) => reference.terms[key][0].toLocaleLowerCase() === name
        ) || ""
    );
}

export function resolveHpoIds(reference, query) {
    return [
        ...new Set(
            String(query || "")
                .split(/[,;|]+/)
                .map((part) => resolveHpoId(reference, part))
                .filter(Boolean)
        ),
    ];
}

export function diseaseRows(reference, queryIds, excludedIds = []) {
    if (!queryIds.length) return [];
    return [...profilesFor(reference)]
        .map(([index, { profile, denominator, matches }]) => {
            const [code, name, genes] = reference.diseases[index];
            const singleTermAnnotation = queryIds.length === 1
                ? profile.find((item) => item.hpoId === queryIds[0])
                : null;
            if (queryIds.length === 1 && !singleTermAnnotation) return null;
            const matchedIds = queryIds.filter((id) => matches.has(id));
            if (!matchedIds.length) return null;
            const numerator = queryIds.reduce(
                (sum, id) => sum + (matches.get(id)?.weight || 0), 0
            );
            const diseaseCoverage = denominator ? Math.min(1, numerator / denominator) : 0;
            const queryCoverage = numerator / queryIds.length;
            const rawScore = diseaseCoverage + queryCoverage
                ? 2 * diseaseCoverage * queryCoverage / (diseaseCoverage + queryCoverage)
                : 0;
            const penalizedBy = excludedIds.filter((id) =>
                queryIds.length === 1
                    ? profile.some((item) => item.hpoId === id)
                    : matches.has(id)
            );
            const penaltyWeight = Math.max(
                0, ...penalizedBy.map((id) =>
                    queryIds.length === 1
                        ? profile.find((item) => item.hpoId === id).weight
                        : matches.get(id).weight
                )
            );
            const score = Math.max(0, rawScore - EXCLUDED_TERM_PENALTY * penaltyWeight);
            return {
                code,
                name,
                genes,
                profile,
                matchedIds,
                penalizedBy,
                diagnostic: singleTermAnnotation
                    ? singleTermAnnotation.diagnostic
                    : matchedIds.some((id) => matches.get(id).diagnostic),
                frequency: singleTermAnnotation?.frequency || matches.get(queryIds[0])?.frequency || "",
                denominator,
                numerator,
                diseaseCoverage,
                queryCoverage,
                rawScore,
                penaltyWeight,
                score,
            };
        })
        .filter(Boolean)
        .sort((a, b) =>
            queryIds.length === 1
                ? (frequencyWeight[b.frequency] || 0) -
                      (frequencyWeight[a.frequency] || 0) ||
                  a.penalizedBy.length - b.penalizedBy.length ||
                  Number(b.diagnostic) - Number(a.diagnostic) ||
                  a.name.localeCompare(b.name)
                : b.score - a.score ||
                  b.queryCoverage - a.queryCoverage ||
                  a.name.localeCompare(b.name)
        );
}

// Binary entropy ranks terms that most evenly split the current top candidates.
export function narrowingTerms(rows, queryIds, excludedIds, limit = 8) {
    const top = rows.slice(0, 10);
    if (top.length < 2) return [];
    const counts = new Map();
    top.forEach((row) =>
        row.profile.forEach((item) => {
            if (
                queryIds.includes(item.hpoId) ||
                excludedIds.includes(item.hpoId)
            )
                return;
            if (!counts.has(item.hpoId))
                counts.set(item.hpoId, {
                    hpoId: item.hpoId,
                    diseaseNames: [],
                    count: 0,
                });
            const entry = counts.get(item.hpoId);
            entry.count += 1;
            entry.diseaseNames.push(row.name);
        })
    );
    return [...counts.values()]
        .filter((item) => item.count < top.length)
        .map((item) => {
            const p = item.count / top.length;
            return {
                ...item,
                total: top.length,
                gain: -p * Math.log2(p) - (1 - p) * Math.log2(1 - p),
            };
        })
        .sort(
            (a, b) =>
                b.gain - a.gain ||
                b.count - a.count ||
                a.hpoId.localeCompare(b.hpoId)
        )
        .slice(0, limit);
}

export function sampleMatchCount(sample) {
    const match = String(sample.matches || "").match(/^(\d+)\/(\d+)$/);
    return match ? Number(match[1]) : null;
}

export function formatStatistic(value) {
    const number = Number(value);
    if (value == null || !Number.isFinite(number)) return "—";
    return number === 0
        ? "0"
        : Math.abs(number) < 0.001
        ? number.toExponential(2)
        : Number(number.toPrecision(3)).toString();
}

export function sortTableRows(rows, sort, selectors) {
    const selector = selectors[sort.key];
    if (!selector) return rows;
    const direction = sort.dir === "desc" ? -1 : 1;
    return rows.map((row, index) => ({ row, index })).sort((a, b) => {
        const left = selector(a.row);
        const right = selector(b.row);
        const leftMissing = left == null || Number.isNaN(left);
        const rightMissing = right == null || Number.isNaN(right);
        if (leftMissing || rightMissing)
            return Number(leftMissing) - Number(rightMissing) || a.index - b.index;
        const comparison = typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
        return direction * comparison || a.index - b.index;
    }).map(({ row }) => row);
}
