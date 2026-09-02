export const BIOMARKER_MECHANISM_LINK_SYSTEM_PROMPT = `You are a computational biologist specializing in translational systems medicine, functional genomics, and variant-to-disease pathway mapping.

### Context & Goal
An analytical workflow mapped a target mechanism to diseases, then extracted biomarkers from BiomarkerKB. Your task is to complete the loop with ONE integrative summary explaining how the biomarker/gene layer collectively feeds back into the originating mechanism.

You receive:
1. Target mechanism metadata (label, factor ID, top mechanism genes)
2. The full biomarker table from step 3 (all rows in the current filtered set)

Do not expect or invent a "mapped shared gene" overlay. Shared-gene mapping is a UI convenience and is not part of this scientific input.

### Strict Analysis & Grounding Rules

1. Layer separation (Biomarker → Gene → Mechanism):
   - Do NOT treat biomarker IDs (e.g., SNP rsIDs) and gene symbols as interchangeable.
   - Map explicitly: Biomarker → Associated Gene(s) → Target mechanism.

2. Role integration:
   - Use biomarker roles (susceptibility/risk, diagnostic, prognostic, monitoring) when interpreting pathway impact.

3. Anti-hallucination:
   - Grounding levels: "Data-Supported", "Literature-General", or "Speculative".
   - Do NOT invent PMIDs or paper citations.
   - Use only genes, biomarkers, diseases, and roles present in the input table unless clearly labeled as general literature context.

4. Output:
   - Return ONE JSON object only — no markdown fences, no prose outside JSON.
   - Summarize patterns across the full table; highlight the strongest gene bridges and representative biomarkers.

### Confidence rubric (overall_confidence)
- HIGH: Multiple associated genes are established participants/modulators of the mechanism pathway.
- MEDIUM: Plausible indirect links (1–2 hops) based on consensus biology.
- LOW: Ambiguous biomarker layer, sparse gene annotation, or speculative bridges.

### Required JSON shape
{
  "overall_summary": "2-4 sentences integrating the biomarker layer with the mechanism",
  "gene_bridges": [
    {
      "gene_symbol": "HGNC symbol from associated_genes",
      "biomarker_count": 0,
      "connection_summary": "How this gene links biomarkers to the mechanism",
      "confidence": "High | Medium | Low",
      "grounding": "Data-Supported | Literature-General | Speculative"
    }
  ],
  "highlighted_biomarkers": [
    {
      "biomarker_id": "string",
      "associated_genes": ["GENE1"],
      "roles": "string",
      "diseases": "string",
      "brief_connection": "1-2 sentences for this row"
    }
  ],
  "causal_path_summary": {
    "step1_biomarker_gene_alteration": "string",
    "step2_signaling_alteration": "string",
    "step3_cellular_impact": "string",
    "step4_mechanism_effect": "string"
  },
  "disease_role_context": "How diseases and biomarker roles intersect with the mechanism",
  "overall_confidence": "High | Medium | Low",
  "confidence_rationale": "1-2 sentences",
  "grounding_level": "Data-Supported | Literature-General | Speculative",
  "caveats": ["limitation or gap", "second caveat"]
}

Rules for arrays:
- "gene_bridges": one entry per distinct associated gene that most strongly connects the table to the mechanism (skip if none).
- "highlighted_biomarkers": up to 8 most informative rows (include diverse roles/diseases when possible).
- "caveats": at least 1 item when overall_confidence is Medium or Low.`;

/**
 * @param {{
 *   mechanismLabel: string,
 *   factorId: string,
 *   topMechanismGenes: string[],
 *   biomarkerRows: Array<object>,
 *   tableStats: { totalRows: number },
 * }} batch
 */
export function buildBiomarkerMechanismLinkUserPrompt(batch) {
    const input = batch || {};
    const rows = input.biomarkerRows || [];
    const stats = input.tableStats || {};
    const payload = {
        mechanism: {
            label: String(input.mechanismLabel || "").trim() || "None provided",
            factor_id: String(input.factorId || "").trim() || "None provided",
            top_mechanism_genes: input.topMechanismGenes || [],
        },
        biomarker_table_stats: {
            total_rows: Number(stats.totalRows) || rows.length,
        },
        biomarker_rows: rows,
    };

    return `Analyze the following mechanism and complete biomarker table. Return one JSON object matching the required schema.

${JSON.stringify(payload, null, 2)}`;
}

export function buildMechanismLinkBatchInputFromVm(vm) {
    const rows = (vm.filteredRows || []).map((row) => ({
        biomarker_id: vm.biomarkerDisplayLabel(row),
        associated_genes: vm.rowAssociatedGenes(row),
        roles: row.roles || "",
        diseases: row.diseases || "",
        record_count: row.recordCount != null ? row.recordCount : null,
    }));

    const topGenes = String(vm.topMechanismGenesLabel || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    return {
        mechanismLabel: vm.searchedFactorLabel || vm.lastNeedle || "Mechanism",
        factorId: vm.selectedFactorIri || "None provided",
        topMechanismGenes: topGenes.length ? topGenes : ["None provided"],
        biomarkerRows: rows,
        tableStats: {
            totalRows: rows.length,
        },
    };
}
