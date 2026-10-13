// Trait association rows for the two detail panels.
//
// Both trait endpoints return the same three fields -- `trait`, `beta`,
// `beta_uncorrected` -- and the trait value is a raw internal code. `BSandFG` means
// nothing on its own, so everything here is about making it readable through the
// `/api/portal/phenotypes?q=md` join.
//
// Grouped by phenotype `group`, because the group is what makes a bare code legible.
// Traits with no phenotype match fall into ONE `Other` bucket rather than one bucket
// each, which is what made v1's grouping usable at ~350 rows.

import { traitKey, traitBeta, traitBetaUncorrected, phenotypeForTrait } from "../ligerApi";

const TOP_TRAIT_ROWS = 25;
const UNGROUPED = "Other";

// Ranked by |beta|: these are effect sizes, and a strong negative association is as
// interesting as a strong positive one.
export function buildTraitRows(rows = [], phenotypeIndex = {}, { limit = TOP_TRAIT_ROWS, requireLabel = true } = {}) {
    let total = 0;
    let unlabeled = 0;

    let ranked = rows
        .map((row) => {
            let key = traitKey(row);
            let phenotype = key ? phenotypeForTrait(phenotypeIndex, key) : null;
            let beta = traitBeta(row);

            return {
                key,
                phenotype,
                // Description is the readable name; falling back to the raw code
                // means the row is still identifiable rather than blank.
                label: (phenotype && phenotype.description) || key,
                group: (phenotype && phenotype.group) || UNGROUPED,
                hasLabel: !!(phenotype && phenotype.description),
                beta,
                betaUncorrected: traitBetaUncorrected(row)
            };
        })
        .filter((row) => !!row.key && Number.isFinite(row.beta));

    total = ranked.length;
    unlabeled = ranked.filter((row) => !row.hasLabel).length;

    // Whether to drop traits that did not join a phenotype. They are real rows, but
    // a table of raw codes is not readable -- v1 filters them for the same reason.
    // The count is reported either way so the filter is never silent.
    let visible = requireLabel ? ranked.filter((row) => row.hasLabel) : ranked;

    visible = visible
        .sort((a, b) => Math.abs(b.beta) - Math.abs(a.beta))
        .slice(0, limit);

    return {
        rows: visible,
        groups: groupRows(visible),
        total,
        unlabeled,
        shown: visible.length
    };
}

// Empty groups are dropped; group order follows the strongest trait in each, so the
// most relevant group is first rather than whichever sorts alphabetically.
function groupRows(rows) {
    let byGroup = {};

    rows.forEach((row) => {
        (byGroup[row.group] = byGroup[row.group] || []).push(row);
    });

    return Object.keys(byGroup)
        .map((name) => ({
            name,
            rows: byGroup[name],
            strongest: Math.max(...byGroup[name].map((row) => Math.abs(row.beta)))
        }))
        .sort((a, b) => b.strongest - a.strongest);
}
