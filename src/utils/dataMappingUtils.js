import { calcLog } from '@/utils/lz/lzUtils'
import { cloneDeep } from "lodash";

function jsonTransform(schemaMap, inputJson, query) {
    return jsonQuery(query, { data: inputJson }).map(schemaMap)
};

export const translate = ({from = id => id, to}) => data => to(from(data))
// VALID: translate({ from: associationsFromVariants, to: associationsForLZ });
// VALID: translate({ to: associationsForIGV });
// !!!INCORRECT!!!: translate({ from: associationsFromVariants });


/* BioIndex Decompositions */
export const associationsFromVariants = variants => {
    return _.flatten(variants
                .map(variants => variants.associations)
                .map((association, index) => ({
                    chromosome: variants[index].chromosome,
                    position: variants[index].position,
                    ...association,
                }))
            )
};

export const useDecompositions = {
    associationsFromVariants,
};

/* LocusZoom Datamapping */
export const associationsForLZ = associations => {
    const translation = associations.map(association => ({
        id: association.varId,
        chr: association.chromosome,
        start: association.position,
        end: association.position,
        position: association.position,
        pvalue: association.pValue,
        log_pvalue: calcLog(association.pValue),
        variant: association.varId,
        ref_allele: association.varId,
        trait_group: association.phenotype,
        trait_label: association.phenotype,
    }));
    console.log('translation', translation);
    return translation

};

/* IGV Datamapping */
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
        }
    });
}

export const useTranslations = {
    associationsForLZ,
    associationsForIGV,
}
