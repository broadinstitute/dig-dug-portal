import { applyPortalVariantData } from "./portalVariantData.generated";
import { applyPortalVariantNewData } from "./portalVariantNewData.generated";

export const krVariantFixturePipeline = [
    {
        key: "base-db-fixture",
        description: "Base RDS export for the variant page.",
        apply: applyPortalVariantData,
    },
    {
        key: "carrier-correction-fixture",
        description: "Promoted correction layer for exact-variant and same-gene carrier sets.",
        apply: applyPortalVariantNewData,
    },
];

export function applyKrVariantFixturePipeline(baseState) {
    return krVariantFixturePipeline.reduce(
        (state, fixtureStep) => fixtureStep.apply(state),
        baseState
    );
}
