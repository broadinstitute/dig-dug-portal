/* PIGeAN Utilities
*/

export function toOldStyle(newStylePhenotype){
    let oldStyle = structuredClone(newStylePhenotype);
    oldStyle.description = newStylePhenotype.phenotype_name;
    oldStyle.name = newStylePhenotype.phenotype;
    oldStyle.group = newStylePhenotype.display_group.replaceAll(" ", "_");
    return oldStyle;
}

export function mapPhenotypes(allPhenotypes){
    let phenotypeMap = {};
    allPhenotypes.forEach(item => {
        phenotypeMap[item.phenotype] = toOldStyle(item);
    });
    return phenotypeMap;
}

export const TOOLTIP_MAP = {
    "DIRECT_SUPPORT": "Direct genetic support measures the involvement of a gene in the phenotype inferred directly from genetic associations nearby the gene. Direct support scores are expressed as log of Bayes factor.",
    "INDIRECT_SUPPORT": "Indirect genetic support measures the involvement of a gene in the phenotype based on genetic associations nearby other genes that are functionally similar to the gene. Indirect support scores are expressed as log of Bayes factor.",
    "COMBINED_SUPPORT": "Direct genetic support measures the involvement of a gene in the phenotype inferred directly from genetic associations nearby the gene. Indirect genetic support measures the involvement of a gene in the phenotype based on genetic associations nearby other genes that are functionally similar to the gene. Combined genetic support is the combination of direct and indirect support. All support scores are expressed as log of Bayes factor.",
    "LATENT_GENETIC": "A latent genetic factor, a proxy for a genetically anchored “mechanism”, of a phenotype is a set of genes with similar functions and genetic associations with the phenotype. Each factor is defined by gene loadings (how likely a gene is involved in the factor) and gene set loadings (how well a gene set represents the factor).",
    "FACTOR_RELEVANCE": "Factor relevance measures how “important” the genetic factor is to the phenotype.",
    "LOADING_ON_FACTOR": "The loading of a gene on a factor measures how likely a gene participates in the factor. The loading of a gene annotation on a factor measures how well the gene annotation represents the (unobserved / latent) factor.",
    "MARGINAL_EFFECT": "The marginal effect of a gene annotation measures its relevance to the phenotype when considered in isolation. All gene annotation effects are expressed in units of log-odds of probabilities: >0.01 = significant, >0.1 = strongly significant, and >1.0 = among the strongest for any phenotype and any gene set.",
    "JOINT_EFFECT": "The joint effect of a gene annotation measures its relevance to the phenotype when considered together with all other gene annotations in the model. All gene annotation effects are expressed in units of log-odds of probabilities: >0.01 = significant, >0.1 = strongly significant, and >1.0 = among the strongest for any phenotype and any gene set. Gene annotations with high marginal effects but weak joint effects are relevant to the phenotype but likely correlated with other gene annotations that are more relevant to the phenotype."
};

export default {
    toOldStyle,
    mapPhenotypes,
    TOOLTIP_MAP
};
