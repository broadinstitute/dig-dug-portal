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

export function resolveCredibleSetVariantList(setState) {
    if (!setState) {
        return [];
    }
    if (Array.isArray(setState.rawVariants) && setState.rawVariants.length) {
        return setState.rawVariants;
    }
    return setState.formattedVariants || [];
}

/**
 * Count loaded vs in-region variants for a selected credible set.
 */
export function countCredibleSetVariantsInRegion(setState, region) {
    const variants = resolveCredibleSetVariantList(setState);
    const loaded = variants.length;
    if (!region || !loaded) {
        return { loaded, inRegion: 0 };
    }
    const inRegion = variants.reduce(
        (count, variant) => count + (variantOverlapsRegion(variant, region) ? 1 : 0),
        0
    );
    return { loaded, inRegion };
}

export function credibleSetStateOverlapsRegion(setState, region) {
    if (!setState || !region) {
        return false;
    }

    return resolveCredibleSetVariantList(setState).some((variant) =>
        variantOverlapsRegion(variant, region)
    );
}

/**
 * Drop selected credible sets whose loaded variants no longer overlap the region.
 */
export function pruneCredibleSetsForRegion(credibleSetsState, region) {
    const selectedIds = (credibleSetsState?.selectedIds || []).filter((selectionKey) => {
        const setState = credibleSetsState?.variantsBySet?.[selectionKey];
        return credibleSetStateOverlapsRegion(setState, region);
    });

    const variantsBySet = {};
    selectedIds.forEach((selectionKey) => {
        const setState = credibleSetsState?.variantsBySet?.[selectionKey];
        if (setState) {
            variantsBySet[selectionKey] = setState;
        }
    });

    return {
        selectedIds,
        variantsBySet,
    };
}
