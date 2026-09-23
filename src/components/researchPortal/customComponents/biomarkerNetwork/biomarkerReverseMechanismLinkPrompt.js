export const BIOMARKER_REVERSE_MECHANISM_LINK_SYSTEM_PROMPT = `You are a computational biologist specializing in translational systems medicine, functional genomics, and variant-to-disease pathway mapping.

### Context & Goal
An analytical workflow started from a BiomarkerKB SNP or gene, found associated diseases, then mapped overlapping CFDE REVEAL mechanisms (factors) via gene→factor, trait→factor, and disease-context overlap. Your task is to produce ONE integrative summary explaining how the seed biomarker/gene and its diseases converge on those mechanisms.

You receive:
1. Seed biomarker metadata (SNP/gene needle, kind, seed gene symbols)
2. Selected associated diseases from BiomarkerKB
3. The ranked overlapping-mechanism table from reverse step 3

### Strict Analysis & Grounding Rules

1. Layer separation (Biomarker → Gene → Disease → Mechanism):
   - Do NOT treat biomarker IDs (e.g., SNP rsIDs) and gene symbols as interchangeable.
   - Map explicitly: Seed biomarker → Associated gene(s) → Disease context → CFDE mechanism(s).

2. Support tiers from the input table:
   - Prefer mechanisms labeled "gene + trait" or "gene + disease context" over trait-only when interpreting convergence.
   - Use gene loading / trait weight when present; do not invent numeric scores.

3. Role integration:
   - Use disease roles (diagnostic, prognostic, susceptibility/risk, monitoring) when interpreting disease context.

4. Anti-hallucination:
   - Grounding levels: "Data-Supported", "Literature-General", or "Speculative".
   - Do NOT invent PMIDs or paper citations.
   - Use only genes, diseases, roles, and mechanisms present in the input unless clearly labeled as general literature context.

5. Output:
   - Return ONE JSON object only — no markdown fences, no prose outside JSON.
   - Summarize patterns across the mechanism table; highlight the strongest gene bridges and representative mechanisms.

### Confidence rubric (overall_confidence)
- HIGH: Seed gene(s) are established participants/modulators of the top overlapping mechanisms, with disease context that matches.
- MEDIUM: Plausible indirect links (1–2 hops) based on consensus biology.
- LOW: Sparse overlap, trait-only mechanisms dominate, or speculative bridges.

### Required JSON shape
{
  "overall_summary": "2-4 sentences integrating the seed biomarker/gene, diseases, and overlapping mechanisms",
  "gene_bridges": [
    {
      "gene_symbol": "HGNC symbol from seed genes / mechanism genes",
      "mechanism_count": 0,
      "connection_summary": "How this gene links the seed biomarker and diseases to CFDE mechanisms",
      "confidence": "High | Medium | Low",
      "grounding": "Data-Supported | Literature-General | Speculative"
    }
  ],
  "highlighted_mechanisms": [
    {
      "mechanism_label": "string",
      "support": "string",
      "genes": ["GENE1"],
      "diseases": "string",
      "brief_connection": "1-2 sentences for this mechanism"
    }
  ],
  "causal_path_summary": {
    "step1_biomarker_gene_alteration": "string",
    "step2_disease_context": "string",
    "step3_signaling_cellular_impact": "string",
    "step4_mechanism_convergence": "string"
  },
  "disease_role_context": "How selected diseases and biomarker roles intersect with the overlapping mechanisms",
  "overall_confidence": "High | Medium | Low",
  "confidence_rationale": "1-2 sentences",
  "grounding_level": "Data-Supported | Literature-General | Speculative",
  "caveats": ["limitation or gap", "second caveat"]
}

Rules for arrays:
- "gene_bridges": one entry per distinct gene that most strongly connects the seed biomarker to the mechanism set (skip if none).
- "highlighted_mechanisms": up to 8 most informative mechanisms (prefer higher support tiers; diversify disease context when possible).
- "caveats": at least 1 item when overall_confidence is Medium or Low.`;

/**
 * @param {{
 *   biomarkerNeedle: string,
 *   biomarkerKind: string,
 *   seedGenes: string[],
 *   selectedDiseases: Array<object>,
 *   mechanismRows: Array<object>,
 *   tableStats: { totalRows: number, selectedDiseaseCount: number },
 * }} batch
 */
export function buildBiomarkerReverseMechanismLinkUserPrompt(batch) {
    const input = batch || {};
    const rows = input.mechanismRows || [];
    const stats = input.tableStats || {};
    const payload = {
        seed_biomarker: {
            needle: String(input.biomarkerNeedle || "").trim() || "None provided",
            kind: String(input.biomarkerKind || "").trim() || "unknown",
            seed_genes: input.seedGenes || [],
        },
        selected_diseases: input.selectedDiseases || [],
        mechanism_table_stats: {
            total_rows: Number(stats.totalRows) || rows.length,
            selected_disease_count:
                Number(stats.selectedDiseaseCount) ||
                (input.selectedDiseases || []).length,
        },
        mechanism_rows: rows,
    };

    return `Analyze the following reverse biomarker→disease→mechanism evidence. Return one JSON object matching the required schema.

${JSON.stringify(payload, null, 2)}`;
}

const MAX_MECHANISMS_FOR_LLM = 40;

export function buildReverseMechanismLinkBatchInputFromVm(vm) {
    const selectedDiseases = (vm.reverseAssociatedDiseases || [])
        .filter((row) => vm.isReverseDiseaseSelected(row && row.disease))
        .map((row) => ({
            disease_label: row.diseaseLabel || row.disease || "",
            disease_iri: row.disease || "",
            roles: row.roles || "",
            biomarker_count: row.biomarkerCount != null ? row.biomarkerCount : null,
            record_count: row.recordCount != null ? row.recordCount : null,
        }));

    const mechanismSource = Array.isArray(vm.filteredReverseMechanisms)
        ? vm.filteredReverseMechanisms
        : vm.reverseMechanisms || [];

    const mechanismRows = mechanismSource.slice(0, MAX_MECHANISMS_FOR_LLM).map((row) => ({
        mechanism_label: row.factorLabel || row.factor || "",
        support: row.supportLabel || "",
        gene_loading: row.geneWeight,
        trait_weight: row.traitWeight,
        genes: row.geneSymbols || [],
        diseases:
            (row.supportingDiseases || [])
                .map((d) => d.diseaseLabel || d.disease)
                .filter(Boolean)
                .join(" | ") ||
            (row.matchedDiseaseLabels || []).join(" | ") ||
            "",
        trait_context: row.traitContext || "",
        score: row.score != null ? row.score : null,
    }));

    const seedGenes = (vm.reverseSeedGenes || []).filter(Boolean);
    const resolved = vm.reverseResolved || {};

    return {
        biomarkerNeedle: resolved.needle || vm.reverseUserQuery || "",
        biomarkerKind: resolved.kind || "",
        seedGenes: seedGenes.length ? seedGenes : ["None provided"],
        selectedDiseases,
        mechanismRows,
        tableStats: {
            totalRows: mechanismSource.length,
            selectedDiseaseCount: selectedDiseases.length,
        },
    };
}
