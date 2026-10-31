import approvedCatalog from "./profileGeneCatalog.generated.json";
import { fetchContextAssociations } from "../../utils/contextAssociationRequest";

const FULL_SCOPE = "all valid genes in approved score source";

export async function fetchProfileGeneAssociations(hpoIds, fetcher = fetch, catalog = approvedCatalog) {
    // Existing Gene/Variant servers already calculate the full source. Request its
    // complete symbol catalog so selection and BH retain the full testing scope.
    const genes = catalog.genes;
    if (!genes.length || genes.length > 25000 || new Set(genes).size !== genes.length)
        throw new Error("The complete gene-score catalog is unavailable.");
    const result = await fetchContextAssociations({
        gene: genes[0], terms: hpoIds, co_genes: genes.slice(1),
        score_type: "max", affected_only: false,
    }, fetcher);
    const rows = result.gene_associations || {};
    if (result.n_requested !== genes.length || Object.keys(rows).length !== genes.length ||
        genes.some((gene) => !Object.prototype.hasOwnProperty.call(rows, gene)) ||
        result.fdr_method !== "BH")
        throw new Error("Gene analysis did not return the complete gene-score catalog.");
    const valid = Object.entries(rows).filter(([, row]) =>
        row.status === "ok" && typeof row.p_value === "number" &&
        Number.isFinite(row.p_value) && row.p_value >= 0 && row.p_value <= 1
    );
    if (valid.length !== result.n_tests || valid.some(([, row]) =>
        typeof row.fdr !== "number" || !Number.isFinite(row.fdr) || row.fdr < 0 || row.fdr > 1
    )) throw new Error("Gene analysis returned incomplete multiple-testing results.");
    return {
        ...result,
        multiple_testing_scope: FULL_SCOPE,
        gene_associations: Object.fromEntries(valid),
        catalog_source: catalog.source,
        catalog_sha256: catalog.sha256,
    };
}
