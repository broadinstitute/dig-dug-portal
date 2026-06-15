<template>
    <div
        class="query-guidelines-content small text-secondary"
    >
        <h5 class="text-dark font-weight-bold mb-3">
            Best Practices for Structuring Search Queries
        </h5>
        <p class="mb-3">
            To maximize precision and retrieve actionable mechanisms, structure your query around the principles below. The hybrid engine combines exact-match (lexical) and conceptual (semantic) retrieval—clear, entity-aware wording helps you bypass generic &quot;canonical&quot; results and align the graph with your intent.
        </p>
        <p class="mb-3 small border-left pl-3 query-guidelines-four-checks">
            <strong class="text-dark">Four checks</strong> the extractor uses before suggesting alternate wording:
            explicit <strong>anchor</strong> (gene, protein, or concrete entity), a <strong>semantic net</strong> (mechanism or pathway concept),
            <strong>spatial</strong> anchoring (tissue or cell type), and a focused <strong>phenotypic</strong> outcome.
            When all four are satisfied, suggested queries are omitted on purpose.
        </p>

        <h6 class="text-dark font-weight-bold mt-3 mb-2">1. Anchor Your Query with Explicit Targets (Entity Forcing)</h6>
        <p class="mb-2">
            Purely conceptual searches are prone to the &quot;Canonical Shadow&quot;: the system may emphasize historically famous hub genes rather than the specific target you care about. If you are investigating a particular gene or protein, name it explicitly so the engine can anchor topology around that entity (this triggers structured gene targeting in extraction).
        </p>
        <ul class="mb-3 pl-3">
            <li><em>Suboptimal:</em> &quot;Find a kidney transporter mechanism…&quot; (tends toward heavily annotated, generic transporters).</li>
            <li><em>Optimal:</em> &quot;Find a kidney transporter mechanism involving SLC22A24…&quot; (anchors the network on your exact target).</li>
        </ul>

        <h6 class="text-dark font-weight-bold mt-3 mb-2">2. Define the Anatomical or Cellular Context (Spatial Anchoring)</h6>
        <p class="mb-2">
            Mechanisms are localized. State tissue, cell type, or subcellular compartment to avoid generic systemic hits and keep results tied to your area of interest.
        </p>
        <ul class="mb-3 pl-3">
            <li><em>Suboptimal:</em> &quot;Find a mechanism for metabolite handling.&quot;</li>
            <li><em>Optimal:</em> &quot;Find a mechanism for metabolite handling in the renal proximal tubule.&quot;</li>
        </ul>

        <h6 class="text-dark font-weight-bold mt-3 mb-2">3. Limit the Phenotypic Scope and Beware of &quot;Hub Gravity&quot;</h6>
        <p class="mb-2">
            Broad disease terms (e.g., &quot;heart disease&quot;) dilute the search vector—prefer specific traits or biomarkers (e.g., &quot;LDL cholesterol secretion&quot;). Also watch <strong class="text-dark">hub gravity</strong>: naming a highly pleiotropic hub (e.g., TP53 or SQSTM1) can pull in its most heavily annotated disease contexts and eclipse a narrower question. Prefer the most specific, localized mechanism you can state.
        </p>
        <ul class="mb-3 pl-3">
            <li><em>Suboptimal:</em> &quot;Find a mechanism that drives blood clotting and heart disease.&quot;</li>
            <li><em>Optimal:</em> &quot;Find a mechanism that alters the hepatic secretion of LDL cholesterol and fibrinogen.&quot;</li>
        </ul>

        <h6 class="text-dark font-weight-bold mt-3 mb-2">4. Use the &quot;Anchor + Semantic Net&quot; Formula</h6>
        <p class="mb-2">
            Combine an explicit target (<strong class="text-dark">the anchor</strong>) with a broader biochemical process (<strong class="text-dark">the semantic net</strong>) without over-constraining the clinical phenotype.
        </p>
        <p class="mb-2 font-weight-bold text-dark">
            Suggested template: &quot;Find a [Broad Mechanism / Semantic Net] involving [Explicit Gene Anchor] in [Cell/Tissue Type] that drives [Specific Biomarker/Phenotype].&quot;
        </p>
        <p class="mb-1 font-weight-bold text-dark small">Example of a fully optimized query:</p>
        <blockquote class="query-guidelines-example mb-3 pl-3 border-left">
            <em>&quot;Find a mitochondrial metabolic reprogramming mechanism involving the TRAP1 chaperone in vascular smooth muscle cells that drives cellular senescence.&quot;</em>
        </blockquote>

        <p class="mb-0 pt-2 border-top">
            <strong class="text-dark">Why this matters:</strong>
            These patterns teach you how to drive the hybrid pipeline: explicit entities engage exact-match and grounding behavior, while a clear semantic net keeps retrieval interpretable—moving away from generic LLM-style prompts toward queries tuned for this Discovery Engine.
        </p>
    </div>
</template>

<script>
export default {
    name: "WorkflowQueryGuidelines",
};
</script>

<style src="./mqSharedStyles.css"></style>
