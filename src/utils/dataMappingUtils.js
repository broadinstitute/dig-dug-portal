import { calcLog } from '@/utils/lz/lzUtils'
import { cloneDeep } from "lodash";

// function jsonTransform(schemaMap, inputJson, query) {
//     return jsonQuery(query, { data: inputJson }).map(schemaMap)
// };

export const translate = ({from = id => id, to}) => data => to(from(data))
// VALID: translate({ from: associationsFromVariants, to: associationsForLZ });
// VALID: translate({ to: associationsForIGV });
// !!!INCORRECT!!!: translate({ from: associationsFromVariants });


/* BioIndex Decompositions */
// name these like xFromY
export const associationsFromVariants = variants => {
    const associations = variants
            .filter(variants => variants.associations)
            .map(variants => variants.associations)
            .flatMap((associations, index) => {
                const fullAssociations = associations.map(association => ({
                    chromosome: variants[index].chromosome,
                    position: variants[index].position,
                    ...association,
                }))
                return fullAssociations;
            })
    return associations;
};

export const useDecompositions = {
    associationsFromVariants,
};

/* LocusZoom Datamapping */
// name these like xForY -> xForLZ
export const associationsForLZ = associations => {
    const translation = associations.map(association => ({
        id: association.varId,
        chr: association.chromosome,
        start: association.position,
        end: association.position,
        position: association.position,
        pvalue: association.pValue,
        log_pvalue: calcLog(association.pValue).toPrecision(4),
        variant: association.varId,
        ref_allele: association.varId,
        trait_group: association.trait_group || '',
        trait_label: association.trait_label || '',
    }));
    return translation

};

/* IGV Datamapping */
// name these like xForY -> xForIGV
export const associationsForIGV = associations => {
    return associations.map(association => {
        const annotation = cloneDeep(association);
        annotation['chromosome'] = undefined;
        annotation['position'] = undefined;
        return {
            chr: association.chromosome,
            start: association.position,
            end: association.position,
            ...annotation,
            log_pvalue: calcLog(association.pValue),
            // for GWAS:
            value: calcLog(association.pValue),
        }
    });
}

export const useTranslations = {
    associationsForLZ,
    associationsForIGV,
}
