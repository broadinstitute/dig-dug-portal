/**
 * Credible-set overlap helpers for region pan / shift.
 */

function resolveVariantPosition(variant) {
    const position = Number(variant?.position ?? variant?.Position);
    return Number.isFinite(position) ? position : null;
}

function resolveVariantChromosome(variant, region) {
    return variant?.chromosome ?? variant?.chr ?? region?.chr ?? null;
}

export function variantOverlapsRegion(variant, region) {
    if (!variant || !region) {
        return false;
    }

    const position = resolveVariantPosition(variant);
    if (position == null) {
        return false;
    }

    const chromosome = resolveVariantChromosome(variant, region);
    if (
        chromosome != null &&
        region.chr != null &&
        String(chromosome) !== String(region.chr)
    ) {
        return false;
    }

    return position >= region.start && position <= region.end;
}

export function credibleSetStateOverlapsRegion(setState, region) {
    if (!setState || !region) {
        return false;
    }

    const variants = setState.rawVariants?.length
        ? setState.rawVariants
        : setState.formattedVariants || [];

    return variants.some((variant) => variantOverlapsRegion(variant, region));
}

/**
 * Drop selected credible sets whose loaded variants no longer overlap the region.
 */
export function pruneCredibleSetsForRegion(credibleSetsState, region) {
    const selectedIds = (credibleSetsState?.selectedIds || []).filter((credibleSetId) => {
        const setState = credibleSetsState?.variantsBySet?.[credibleSetId];
        return credibleSetStateOverlapsRegion(setState, region);
    });

    const variantsBySet = {};
    selectedIds.forEach((credibleSetId) => {
        const setState = credibleSetsState?.variantsBySet?.[credibleSetId];
        if (setState) {
            variantsBySet[credibleSetId] = setState;
        }
    });

    return {
        selectedIds,
        variantsBySet,
    };
}
