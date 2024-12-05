/* PIGeAN Utilities
*/

export function toOldStyle(newStylePhenotype){
    let oldStyle = structuredClone(newStylePhenotype);
    oldStyle.description = newStylePhenotype.phenotype_name;
    oldStyle.name = newStylePhenotype.phenotype;
    oldStyle.group = newStylePhenotype.display_group;
    return oldStyle;
}

export function mapPhenotypes(allPhenotypes){
    let phenotypeMap = {};
    allPhenotypes.forEach(item => {
        phenotypeMap[item.phenotype] = toOldStyle(item);
    });
    return phenotypeMap;
}

export default {
    toOldStyle,
    mapPhenotypes
};
