/**
 * HTML report / handoff document assembly and clipboard text for Multi Query REVEAL mechanism
 * hypotheses. Most builders here need many small formatter dependencies from the shell (escapeHtml,
 * display-label helpers, session summaries) so they take `vm` as context, matching the pattern
 * already used by the shell's `dataPanelHelpers`/`resultsPanelHelpers` computed bundles.
 */

function getMechanismTopGenes(mechanism, limit = 10) {
    const genes = Array.isArray(mechanism?.candidate_genes) && mechanism.candidate_genes.length
        ? mechanism.candidate_genes
        : (Array.isArray(mechanism?.genes) ? mechanism.genes : []);
    return genes.slice(0, Math.max(1, limit));
}

function formatClipboardScore(value, digits = 3) {
    if (value == null || value === "" || Number.isNaN(Number(value))) return "—";
    return Number(value).toFixed(digits);
}

/**
 * Clipboard text aligned with Results card content.
 * @param {object} [options]
 * @param {boolean} [options.geneSetPath]
 * @param {(id: string) => string} [options.formatFactorLabel]
 */
function buildMechanismClipboardText(mechanism, idx, researchContext, topGenes, options = {}) {
    const geneSetPath = !!(options && options.geneSetPath);
    const formatFactorLabel =
        typeof options.formatFactorLabel === "function"
            ? options.formatFactorLabel
            : (id) => (id != null ? String(id) : "—");
    const context = researchContext != null ? String(researchContext).trim() : "";
    const genes = Array.isArray(topGenes) ? topGenes : getMechanismTopGenes(mechanism, 10);

    const nextSteps = Array.isArray(mechanism?.next_steps) ? mechanism.next_steps.slice(0, 3) : [];
    const nextStepsBlock = nextSteps.length
        ? nextSteps
              .map((s) => {
                  const cat =
                      s && s.category != null && String(s.category).trim() !== ""
                          ? String(s.category).trim()
                          : "Uncategorized";
                  const action =
                      s && s.action != null && String(s.action).trim() !== ""
                          ? String(s.action).trim()
                          : "—";
                  const reason =
                      s && s.reason != null && String(s.reason).trim() !== ""
                          ? ` (Reason: ${String(s.reason).trim()})`
                          : "";
                  return `[${cat}] ${action}${reason}`;
              })
              .join("\n")
        : "None listed.";
    const nextQueries = Array.isArray(mechanism?.next_queries) ? mechanism.next_queries.slice(0, 3) : [];
    const nextQueriesBlock = nextQueries.length
        ? nextQueries.map((q, i) => `${i + 1}. ${q}`).join("\n")
        : "None listed.";

    if (geneSetPath) {
        const topGenesBlock = genes.length
            ? genes
                  .map((g, i) => {
                      const gene = g && g.gene != null ? String(g.gene) : "—";
                      const roleGroup = g && g.group != null ? String(g.group) : "—";
                      const reason =
                          g && g.reason != null
                              ? String(g.reason)
                              : g && g.role != null
                                ? String(g.role)
                                : "—";
                      const inSearch =
                          g && g.is_input === true ? "Yes" : g && g.is_input === false ? "No" : "—";
                      const scores = (g && g.scores) || {};
                      const factorRel = formatClipboardScore(
                          scores.factor_relevance ?? scores.combined,
                          3
                      );
                      const geneScore = formatClipboardScore(
                          scores.gene_score ?? scores.functional,
                          3
                      );
                      return `${i + 1}. ${gene} [${roleGroup}] In search: ${inSearch}; Gene set cluster relevance: ${factorRel}; Gene score: ${geneScore}; Reason: ${reason}`;
                  })
                  .join("\n")
            : "None listed.";

        const spineNet = mechanism?.core_spine_network || {};
        const flowCaption =
            mechanism?.hypothesis_in_kg?.caption != null
                ? String(mechanism.hypothesis_in_kg.caption)
                : mechanism?.hypothesis_spine?.caption != null
                  ? String(mechanism.hypothesis_spine.caption)
                  : "";
        const flowEdges = Array.isArray(spineNet.edges)
            ? spineNet.edges
                  .slice(0, 12)
                  .map((e) => {
                      const from = e.source != null ? e.source : e.from;
                      const to = e.target != null ? e.target : e.to;
                      const pred = e.predicate || e.label || "";
                      return `${from} -> ${to}${pred ? ` (${pred})` : ""}`;
                  })
                  .join("\n")
            : "";

        const factorIds = Array.isArray(mechanism?.associated_factor_ids)
            ? mechanism.associated_factor_ids
            : [];
        const factorsBlock = factorIds.length
            ? factorIds.map((id) => `- ${formatFactorLabel(id)}`).join("\n")
            : "None listed.";

        const citedSets =
            Array.isArray(mechanism?.cited_gene_set_names) && mechanism.cited_gene_set_names.length
                ? mechanism.cited_gene_set_names
                : Array.isArray(mechanism?.relevant_gene_sets)
                  ? mechanism.relevant_gene_sets
                  : [];
        const setsBlock = citedSets.length
            ? citedSets.map((s) => `- ${s}`).join("\n")
            : "None listed.";

        const rationale =
            mechanism?.rationale != null && String(mechanism.rationale).trim()
                ? String(mechanism.rationale).trim()
                : "";

        const lines = [
            "Instruction for assistant:",
            "Act as an expert principal investigator and systems biologist. Use only the evidence below; mark assumptions explicitly.",
            "",
            `Research Context: ${context || "—"}`,
            "",
            `Hypothesis ${idx + 1}: ${mechanism?.group_name || "(unnamed)"}`,
            `${mechanism?.hypothesis || "—"}`,
            "",
        ];
        if (rationale) {
            lines.push("Biological rationale:", rationale, "");
        }
        lines.push(
            "Biological mechanism map:",
            `${flowCaption || "—"}`,
            `${flowEdges || ""}`,
            "",
            "Candidate genes:",
            topGenesBlock,
            "",
            "Associated gene set clusters:",
            factorsBlock,
            "",
            "Cited gene sets:",
            setsBlock,
            "",
            "Suggested Next Steps:",
            nextStepsBlock,
            "",
            "Next Queries:",
            nextQueriesBlock,
            "",
            "Task options:",
            "A) Critically evaluate biological plausibility.",
            "B) Draft a step-by-step experimental validation plan.",
            "C) Expand or refine next steps.",
            "D) Suggest confounders and alternative pathways."
        );
        return lines.join("\n");
    }

    const topGenesBlock = genes.length
        ? genes
              .map((g, i) => {
                  const score =
                      g && g.scores && (g.scores.combined ?? g.scores.c) != null
                          ? Number(g.scores.combined ?? g.scores.c).toFixed(2)
                          : "—";
                  const gene = g && g.gene != null ? String(g.gene) : "—";
                  const role = g && g.group != null ? String(g.group) : "—";
                  return `${i + 1}. ${gene} - ${role} (Combined: ${score})`;
              })
              .join("\n")
        : "None listed.";
    const flow = mechanism?.hypothesis_in_kg || {};
    const flowCaption = flow.caption != null ? String(flow.caption) : "";
    const spineNet = mechanism?.core_spine_network || {};
    const flowEdges = Array.isArray(spineNet.edges) && spineNet.edges.length
        ? spineNet.edges
              .slice(0, 8)
              .map((e) => {
                  const from = e.source != null ? e.source : e.from;
                  const to = e.target != null ? e.target : e.to;
                  const pred = e.predicate || e.label || "";
                  return `${from} -> ${to}${pred ? ` (${pred})` : ""}`;
              })
              .join("\n")
        : Array.isArray(flow.edges)
          ? flow.edges
                .slice(0, 8)
                .map((e) => `${e.from} -> ${e.to}${e.label ? ` (${e.label})` : ""}`)
                .join("\n")
          : "";

    return [
        "Instruction for assistant:",
        "Act as an expert principal investigator and systems biologist. Use only the evidence below; mark assumptions explicitly.",
        "",
        `Research Context: ${context || "—"}`,
        "",
        `Hypothesis ${idx + 1}: ${mechanism?.group_name || "(unnamed)"}`,
        `${mechanism?.hypothesis || "—"}`,
        "",
        "Rationale / Novelty:",
        `${mechanism?.novelty_explanation || mechanism?.novelty || "—"}`,
        "",
        "Biological Flow (Visual Spine):",
        `${flowCaption || "—"}`,
        `${flowEdges || ""}`,
        "",
        "Top Candidate Genes (max 10):",
        topGenesBlock,
        "",
        "Suggested Next Steps:",
        nextStepsBlock,
        "",
        "Next Queries:",
        nextQueriesBlock,
        "",
        "Task options:",
        "A) Critically evaluate biological plausibility.",
        "B) Draft a step-by-step experimental validation plan.",
        "C) Expand or refine next steps.",
        "D) Suggest confounders and alternative pathways.",
    ].join("\n");
}

function buildMechanismReportOneCardHtml(vm, m, idx, supImg, hypImg) {
    const geneSetPath = !!(vm && vm.searchPath === "genes");
    const genes = Array.isArray(m.candidate_genes || m.genes) ? (m.candidate_genes || m.genes) : [];
    const geneRows = genes.map((g) => {
        const scores = g.scores || {};
        const geneName = g.gene != null ? String(g.gene).trim() : "";
        const conn =
            m.gene_connections && geneName && m.gene_connections[geneName]
                ? m.gene_connections[geneName]
                : { gene_sets: [] };
        const gss = Array.isArray(conn.gene_sets) ? conn.gene_sets : [];
        if (geneSetPath) {
            const inSearch =
                typeof vm.isGeneInSearchSet === "function"
                    ? vm.isGeneInSearchSet(g)
                    : g.is_input === true
                      ? true
                      : g.is_input === false
                        ? false
                        : null;
            const anchor = inSearch === true ? "Yes" : inSearch === false ? "No" : "—";
            const factorRel = scores.factor_relevance ?? scores.combined ?? "—";
            const geneScore = scores.gene_score ?? scores.functional ?? "—";
            return `
                <tr>
                    <td>${vm.escapeHtml(g.gene || "—")}</td>
                    <td>${vm.escapeHtml(g.group || "—")}</td>
                    <td>${vm.escapeHtml(anchor)}</td>
                    <td>${vm.escapeHtml(g.reason != null ? g.reason : g.role || "—")}</td>
                    <td>${vm.escapeHtml(factorRel)}</td>
                    <td>${vm.escapeHtml(geneScore)}</td>
                    <td>${vm.escapeHtml(gss.length ? gss.join(", ") : "—")}</td>
                </tr>
            `;
        }
        return `
                <tr>
                    <td>${vm.escapeHtml(g.gene || "—")}</td>
                    <td>${vm.escapeHtml(g.group || "—")}</td>
                    <td>${vm.escapeHtml(g.reason != null ? g.reason : g.role || "—")}</td>
                    <td>${vm.escapeHtml(scores.combined ?? scores.c ?? "—")}</td>
                    <td>${vm.escapeHtml(scores.gwas ?? scores.g ?? "—")}</td>
                    <td>${vm.escapeHtml(scores.functional ?? scores.f ?? "—")}</td>
                    <td>${vm.escapeHtml(gss.length ? gss.join(", ") : "—")}</td>
                </tr>
            `;
    }).join("");
    const nextSteps = Array.isArray(m.next_steps) ? m.next_steps : [];
    const nextStepsSection =
        nextSteps.length > 0
            ? `
                <div class="report-subsection report-next-steps-block">
                    <h3>Recommended next steps</h3>
                    <ol class="report-next-steps-list">${nextSteps
                        .map(
                            (s) => `
                    <li>
                        <div><strong>${vm.escapeHtml(s.category || "—")}</strong></div>
                        <div><em>Action:</em> ${vm.escapeHtml(s.action || "—")}</div>
                        <div><em>Reason:</em> ${vm.escapeHtml(s.reason || "—")}</div>
                    </li>`
                        )
                        .join("")}</ol>
                </div>`
            : "";
    const nextQueries = Array.isArray(m.next_queries) ? m.next_queries : [];
    const nextQueriesSection =
        nextQueries.length > 0
            ? `
                <div class="report-subsection">
                    <h3>Next queries</h3>
                    <p class="report-fine-print">Click these in the app to continue exploring this mechanism with a focused follow-up search.</p>
                    <ol class="report-next-steps-list">${nextQueries
                        .map((q) => `<li>${vm.escapeHtml(q || "—")}</li>`)
                        .join("")}</ol>
                </div>`
            : "";
    const pathwayShiftSection = m.pathway_shift_rationale
        ? `<div class="report-subsection report-shift-callout"><strong>Why the hypothesis shifted</strong><p class="report-body-tight">${vm.escapeHtml(m.pathway_shift_rationale)}</p></div>`
        : "";
    const hasHypothesisMapVisual =
        (m.core_spine_network &&
            Array.isArray(m.core_spine_network.nodes) &&
            m.core_spine_network.nodes.length > 0) ||
        (hypImg && hypImg.dataUrl) ||
        !!(m.hypothesis_in_kg && m.hypothesis_in_kg.caption);
    const hypothesisMapSection = hasHypothesisMapVisual
        ? `
                <div class="report-subsection">
                    <h3>Biological mechanism map</h3>
                    ${
                        m.hypothesis_in_kg && m.hypothesis_in_kg.caption
                            ? `<p class="report-map-caption"><strong>Summary:</strong> ${vm.escapeHtml(m.hypothesis_in_kg.caption)}</p>`
                            : ""
                    }
                    ${
                        hypImg && hypImg.dataUrl
                            ? `
                        <div class="report-network-meta">${hypImg.nodeCount} nodes, ${hypImg.edgeCount} edges (${vm.escapeHtml(hypImg.format)})</div>
                        <img class="report-network-image" src="${hypImg.dataUrl}" alt="Biological mechanism map ${idx + 1}">
                    `
                            : '<div class="report-empty">No map image in this export. Open the Results tab, let the map render, and download the report again.</div>'
                    }
                </div>`
        : "";
    const noveltyLabel = geneSetPath ? "Novelty" : "Rationale";
    const noveltySection = !geneSetPath
        ? `<div class="report-subsection"><strong>${noveltyLabel}</strong><p class="report-body-tight">${vm.escapeHtml(m.novelty_explanation || m.novelty || "—")}</p></div>`
        : "";
    const rationaleSection =
        geneSetPath && m.rationale
            ? `<div class="report-subsection"><strong>Biological rationale</strong><p class="report-body-tight">${vm.escapeHtml(m.rationale)}</p></div>`
            : "";
    const geneTableHeader = geneSetPath
        ? `<tr>
                                    <th>Gene</th>
                                    <th>Gene role</th>
                                    <th>In search</th>
                                    <th>Reason</th>
                                    <th>Gene set cluster relevance</th>
                                    <th>Gene score</th>
                                    <th>Cited gene sets</th>
                                </tr>`
        : `<tr>
                                    <th>Gene</th>
                                    <th>Gene role</th>
                                    <th>Reason</th>
                                    <th>Combined</th>
                                    <th>GWAS</th>
                                    <th>Functional</th>
                                    <th>Relevant gene sets</th>
                                </tr>`;
    const evidenceSection = geneSetPath
        ? `
                <div class="report-subsection">
                    <h3>Cited gene set cluster evidence</h3>
                    <div class="report-subsection"><strong>Associated gene set clusters</strong>${vm.buildReportList(
                        m.associated_factor_ids && m.associated_factor_ids.length
                            ? m.associated_factor_ids
                            : (m.associated_pairs || []).map((p) => p.factor || p.phenotype),
                        (id) =>
                            typeof vm.getGeneSetFactorDisplayLabel === "function"
                                ? vm.getGeneSetFactorDisplayLabel(id)
                                : vm.getFactorClusterDisplayString(id)
                    )}</div>
                    <div class="report-subsection"><strong>Cited gene sets</strong>${vm.buildReportList(
                        vm.formatRelevantGeneSetsForDisplay(
                            m.cited_gene_set_names && m.cited_gene_set_names.length
                                ? m.cited_gene_set_names
                                : m.relevant_gene_sets || []
                        ),
                        (set) => `${set.gs}${set.program ? ` (${set.program})` : ""}`
                    )}</div>
                </div>`
        : `
                <div class="report-subsection">
                    <h3>Data network behind this hypothesis</h3>
                    <p class="report-fine-print">Connections from your selected phenotypes, genes, and gene sets (as in the app).</p>
                    ${supImg && supImg.dataUrl ? `
                        <div class="report-network-meta">${supImg.nodeCount} nodes, ${supImg.edgeCount} edges (${vm.escapeHtml(supImg.format)})</div>
                        <img class="report-network-image" src="${supImg.dataUrl}" alt="Data network ${idx + 1}">
                    ` : '<div class="report-empty">No network image available for this export.</div>'}
                </div>
                <div class="report-subsection">
                    <strong>Phenotypes tied to this network</strong>
                    ${vm.buildReportList(m.relevant_phenotypes, (id) => vm.getPhenotypeDisplay(id))}
                </div>
                <div class="report-subsection">
                    <strong>Related data categories</strong>
                    ${vm.buildReportList(m.redundant_associated_pairs, (pair) => `${vm.getPhenotypeDisplay(pair.phenotype)} - ${vm.getFactorClusterDisplayString(pair.factor)}`)}
                </div>
                <div class="report-subsection">
                    <strong>Gene sets in scope</strong>
                    ${vm.buildReportList(vm.formatRelevantGeneSetsForDisplay(m.relevant_gene_sets || []), (set) => `${set.gs}${set.program ? ` (${set.program})` : ""}`)}
                </div>`;
    const mechanismCardTitle = vm.escapeHtml(m.group_name || `Hypothesis ${idx + 1}`);
    const candidateGenesSection = `
                <div class="report-subsection">
                    <h3>Candidate genes (${genes.length})</h3>
                    ${genes.length ? `
                        <table class="report-table">
                            <thead>
                                ${geneTableHeader}
                            </thead>
                            <tbody>${geneRows}</tbody>
                        </table>
                    ` : '<div class="report-empty">No candidate genes listed.</div>'}
                </div>
                ${m.genes_collective_reason ? `<div class="report-subsection"><strong>How these genes work together</strong><p class="report-body-tight">${vm.escapeHtml(m.genes_collective_reason)}</p></div>` : ""}`;

    if (geneSetPath) {
        return `
            <section class="report-section report-card">
                <h2>${mechanismCardTitle}</h2>
                <div class="report-subsection"><strong>Mechanistic hypothesis</strong><p class="report-body-tight">${vm.escapeHtml(m.hypothesis || "—")}</p></div>
                ${pathwayShiftSection}
                ${rationaleSection}
                ${hypothesisMapSection}
                ${evidenceSection}
                ${candidateGenesSection}
                ${nextStepsSection}
                ${nextQueriesSection}
            </section>
        `;
    }

    return `
            <section class="report-section report-card">
                <h2>${mechanismCardTitle}</h2>
                <div class="report-subsection"><strong>Mechanistic hypothesis</strong><p class="report-body-tight">${vm.escapeHtml(m.hypothesis || "—")}</p></div>
                ${pathwayShiftSection}
                ${noveltySection}
                ${rationaleSection}
                ${hypothesisMapSection}
                ${m.relevance ? `<div class="report-subsection"><strong>Relevance</strong><p class="report-body-tight">${vm.escapeHtml(m.relevance)}</p></div>` : ""}
                ${candidateGenesSection}
                ${evidenceSection}
                ${nextStepsSection}
                ${nextQueriesSection}
            </section>
        `;
}

function buildMechanismReportSections(vm, mechanismImages) {
    const images = Array.isArray(mechanismImages) ? mechanismImages : [];
    return (vm.mechanisms || []).map((m, idx) => {
        const img = images[idx];
        const supImg =
            img && img.supporting
                ? img.supporting
                : img && img.dataUrl
                  ? img
                  : null;
        const hypImg = img && img.hypothesisMap ? img.hypothesisMap : null;
        return buildMechanismReportOneCardHtml(vm, m, idx, supImg, hypImg);
    }).join("");
}

/** Strip vis-only / internal fields from networks for handoff JSON. */
function sanitizeHandoffNetwork(net) {
    const n = net || {};
    const nodes = Array.isArray(n.nodes)
        ? n.nodes
            .map((node) => ({
                id: node.id != null ? String(node.id) : "",
                label: node.label != null ? String(node.label) : "",
                type:
                    node.type != null
                        ? String(node.type)
                        : node.group != null
                          ? String(node.group)
                          : "",
            }))
            .filter((x) => x.id)
        : [];
    const edges = Array.isArray(n.edges)
        ? n.edges
            .map((e) => ({
                source:
                    e.source != null ? String(e.source) : e.from != null ? String(e.from) : "",
                target:
                    e.target != null ? String(e.target) : e.to != null ? String(e.to) : "",
                label: e.label != null ? String(e.label) : "",
            }))
            .filter((x) => x.source && x.target)
        : [];
    return { nodes, edges };
}

function sanitizeHandoffFlattenedRows(rows) {
    return (rows || []).map((row) => {
        const out = {
            subject: row.subject != null ? String(row.subject) : "",
            predicate: row.predicate != null ? String(row.predicate) : "",
            object: row.object != null ? String(row.object) : "",
        };
        Object.keys(row || {}).forEach((k) => {
            if (k === "id" || k === "subject" || k === "predicate" || k === "object") return;
            if (!/^context_/.test(k)) return;
            const v = row[k];
            out[k] = v != null ? String(v) : "";
        });
        return out;
    });
}

function sanitizeHandoffSelectionRows(rows) {
    return (rows || [])
        .map((r) => ({
            phenotype: r.phenotype != null ? String(r.phenotype) : "",
            trait_group:
                r.factorLabel != null && String(r.factorLabel).trim() !== ""
                    ? String(r.factorLabel).trim()
                    : r.factor != null
                      ? String(r.factor)
                      : "",
        }))
        .filter((x) => x.phenotype && x.trait_group);
}

function sanitizeHandoffCandidateGenes(mechanism) {
    const genes =
        Array.isArray(mechanism?.candidate_genes) && mechanism.candidate_genes.length
            ? mechanism.candidate_genes
            : Array.isArray(mechanism?.genes)
              ? mechanism.genes
              : [];
    return genes.map((g) => ({
        gene: g?.gene != null ? String(g.gene) : "",
        role: g?.group != null ? String(g.group) : "",
        reason:
            g?.reason != null ? String(g.reason) : g?.role != null ? String(g.role) : "",
        scores: {
            combined: g?.scores?.combined ?? g?.scores?.c ?? null,
            gwas: g?.scores?.gwas ?? g?.scores?.g ?? null,
            functional: g?.scores?.functional ?? g?.scores?.f ?? null,
        },
    }));
}

function sanitizeHandoffGeneConnections(gc) {
    if (!gc || typeof gc !== "object") return null;
    const out = {};
    Object.keys(gc).forEach((gene) => {
        const entry = gc[gene];
        if (!entry || typeof entry !== "object") return;
        out[String(gene)] = {
            gene_sets: Array.isArray(entry.gene_sets) ? entry.gene_sets.map((s) => String(s)) : [],
        };
    });
    return Object.keys(out).length ? out : null;
}

function buildMechanismHandoffAppendixObject(vm, {
    idx,
    mechanism,
    researchContext,
    supportingNet,
    hypothesisNet,
    supportingRows,
    assocRows,
    supportingImage,
    hypothesisImage,
}) {
    const flowCap =
        mechanism?.hypothesis_in_kg?.caption != null
            ? String(mechanism.hypothesis_in_kg.caption)
            : "";
    return {
        handoff_version: 1,
        generated_at: new Date().toISOString(),
        your_question: vm.userQuery || "",
        research_context: researchContext || "",
        session_mechanisms_summary: vm.getReportSessionSummary(),
        extracted_terms: {
            phenotype_terms: [...(vm.lastPhenotypeTerms || [])],
            mechanism_terms: [...(vm.lastMechanismTerms || [])],
            genes_of_interest: [...(vm.lastGenesOfInterest || [])],
        },
        hypothesis: {
            index: idx + 1,
            title: mechanism?.group_name != null ? String(mechanism.group_name) : "",
            mechanistic_hypothesis: mechanism?.hypothesis != null ? String(mechanism.hypothesis) : "",
            rationale:
                mechanism?.novelty_explanation != null
                    ? String(mechanism.novelty_explanation)
                    : mechanism?.novelty != null
                      ? String(mechanism.novelty)
                      : "",
            relevance: mechanism?.relevance != null ? String(mechanism.relevance) : "",
            biological_flow_summary: flowCap,
            genes_collective_reason:
                mechanism?.genes_collective_reason != null
                    ? String(mechanism.genes_collective_reason)
                    : "",
            candidate_genes: sanitizeHandoffCandidateGenes(mechanism),
            gene_set_links_by_gene: sanitizeHandoffGeneConnections(mechanism?.gene_connections),
            next_steps: Array.isArray(mechanism?.next_steps)
                ? mechanism.next_steps.map((s) => ({
                    category: s?.category != null ? String(s.category) : "",
                    action: s?.action != null ? String(s.action) : "",
                    reason: s?.reason != null ? String(s.reason) : "",
                }))
                : [],
            next_queries: Array.isArray(mechanism?.next_queries)
                ? mechanism.next_queries.map((q) => String(q))
                : [],
            related_phenotypes: Array.isArray(mechanism?.relevant_phenotypes)
                ? mechanism.relevant_phenotypes.map((id) => vm.getPhenotypeDisplay(id))
                : [],
            related_data_category_clusters: Array.isArray(mechanism?.redundant_associated_pairs)
                ? mechanism.redundant_associated_pairs.map((pair) => ({
                    phenotype: vm.getPhenotypeDisplay(pair.phenotype),
                    data_category: vm.getFactorClusterDisplayString(pair.factor),
                }))
                : [],
            relevant_gene_sets: (
                vm.formatRelevantGeneSetsForDisplay(mechanism?.relevant_gene_sets || []) || []
            ).map((set) => ({
                gene_set: set.gs,
                program: set.program || "",
            })),
        },
        evidence: {
            supporting_kg_facts: sanitizeHandoffFlattenedRows(supportingRows),
            ui_phenotype_trait_rows: sanitizeHandoffSelectionRows(assocRows),
            data_network: sanitizeHandoffNetwork(supportingNet),
            biological_flow_network: sanitizeHandoffNetwork(hypothesisNet),
        },
        exports: {
            supporting_network_image: supportingImage
                ? {
                    format: supportingImage.format,
                    node_count: supportingImage.nodeCount,
                    edge_count: supportingImage.edgeCount,
                    included_in_html: !!supportingImage.dataUrl,
                }
                : null,
            biological_flow_image: hypothesisImage
                ? {
                    format: hypothesisImage.format,
                    node_count: hypothesisImage.nodeCount,
                    edge_count: hypothesisImage.edgeCount,
                    included_in_html: !!hypothesisImage.dataUrl,
                }
                : null,
        },
    };
}

/**
 * Print-friendly single-hypothesis handoff HTML; JSON appendix via separate download link (data URL).
 */
function buildMechanismHandoffHtmlDocument(vm, {
    idx,
    mechanism,
    researchContext,
    supportingImage,
    hypothesisImage,
    appendix,
}) {
    const slug = String(mechanism.group_name || `hypothesis-${idx + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
    const jsonStr = JSON.stringify(appendix, null, 2);
    const jsonDownloadHref = `data:application/json;charset=utf-8,${encodeURIComponent(jsonStr)}`;
    const jsonFilename = `reveal-handoff-appendix-${slug || `hypothesis-${idx + 1}`}.json`;
    const overview = `
        <section class="report-section">
            <h2>Overview</h2>
            <p class="report-fine-print">Context for this hypothesis handoff (one card from your session).</p>
            <table class="report-table">
                <tbody>
                    <tr><th>Your question</th><td>${vm.escapeHtml(vm.userQuery || "—")}</td></tr>
                    <tr><th>Research context</th><td>${vm.escapeHtml(researchContext || "—")}</td></tr>
                    <tr><th>Phenotypes or diseases (extracted)</th><td>${vm.escapeHtml((vm.lastPhenotypeTerms || []).join(", ") || "—")}</td></tr>
                    <tr><th>Biological mechanisms (extracted)</th><td>${vm.escapeHtml((vm.lastMechanismTerms || []).join(", ") || "—")}</td></tr>
                    ${vm.reportGeneAnchorRows()}
                    <tr><th>Summary of findings (session)</th><td>${vm.escapeHtml(vm.getReportSessionSummary())}</td></tr>
                </tbody>
            </table>
        </section>
    `;
    const card = buildMechanismReportOneCardHtml(
        vm,
        mechanism,
        idx,
        supportingImage,
        hypothesisImage
    );
    const appendixBlock = `
        <section class="report-section report-page-break">
            <h2>Machine-readable appendix</h2>
            <p class="report-fine-print">Compact JSON for tools, scripting, or archiving. Internal-only debugging fields are omitted.</p>
            <p class="report-handoff-json-actions">
                <a class="report-json-download" download="${vm.escapeHtml(jsonFilename)}" href="${jsonDownloadHref}">Download JSON appendix</a>
            </p>
            <p class="report-fine-print report-print-hide">Use the button above in your browser to save the JSON file. Printed pages omit this control.</p>
        </section>
    `;
    const titleSafe = vm.escapeHtml(
        mechanism.group_name || `Hypothesis handoff ${idx + 1}`
    );
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reveal handoff — ${titleSafe}</title>
<style>
html, body { margin: 0; padding: 0; background: #f5f6f8; color: #1f2933; }
body, body * { box-sizing: border-box; }
body, p, li, td, th, div, span, a, button, input, textarea, pre { font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 1.45; }
.report { max-width: 1180px; margin: 0 auto; padding: 24px; background: #fff; }
.report-header { border-bottom: 2px solid #f16822; padding-bottom: 16px; margin-bottom: 24px; }
.report-header h1 { font-size: 28px; margin: 0 0 8px; }
.report-header p { margin: 0; font-size: 14px; }
.report-section { margin-bottom: 28px; }
.report-section h2 { font-size: 22px; margin: 0 0 12px; color: #f16822; }
.report-section h3 { font-size: 18px; margin: 0 0 8px; }
.report-card { border: 1px solid #d8dee4; border-radius: 8px; padding: 18px; background: #fafbfc; margin-bottom: 18px; }
.report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.report-table th, .report-table td { border: 1px solid #d8dee4; padding: 8px 10px; text-align: left; vertical-align: top; word-break: break-word; font-size: 14px; }
.report-table th { background: #f3f4f6; width: 24%; }
.report-subsection { margin-bottom: 14px; font-size: 14px; }
.report-shift-callout { border: 1px solid #f4c27a; background: #fff8e6; border-radius: 6px; padding: 10px 12px; }
.report-empty { color: #667; font-style: italic; font-size: 14px; }
.report-network-image { max-width: 100%; width: 100%; height: auto; border: 1px solid #d8dee4; border-radius: 6px; background: #fff; }
.report-network-meta { margin-bottom: 8px; color: #555; font-size: 14px; }
.report-map-caption { margin: 0 0 10px; font-size: 14px; }
.report-body-tight { margin: 6px 0 0; font-size: 14px; }
.report-fine-print { margin: 0 0 12px; font-size: 14px; color: #555; }
.report-next-steps-block { border-top: 1px solid #d8dee4; padding-top: 14px; margin-top: 8px; }
.report-next-steps-list { margin: 0; padding-left: 1.35rem; font-size: 14px; }
.report-next-steps-list li { margin-bottom: 12px; font-size: 14px; }
.report-next-steps-list li em { font-style: normal; font-weight: 600; color: #374151; }
.report-page-break { page-break-before: always; }
.report-json-download {
    display: inline-block;
    margin-top: 4px;
    padding: 8px 14px;
    background: #f16822;
    color: #fff !important;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
}
.report-json-download:hover { filter: brightness(0.95); }
.report-handoff-json-actions { margin: 0; }
@media print {
    html, body { background: #fff; }
    .report { max-width: none; padding: 0; }
    .report-card, .report-section { break-inside: avoid; }
    .report-print-hide { display: none; }
    .report-json-download { display: none; }
}
</style>
</head>
<body>
<div class="report">
    <header class="report-header">
        <h1>Reveal — hypothesis handoff</h1>
        <p>${vm.escapeHtml(mechanism.group_name || `Hypothesis ${idx + 1}`)} · generated ${vm.escapeHtml(new Date().toLocaleString())}</p>
    </header>
    ${overview}
    ${card}
    ${appendixBlock}
</div>
</body>
</html>`;
}

function buildHtmlReportDocument(vm, { researchContext, mechanismImages, factorSummary, rawKgCsv }) {
    const extractedTerms = `
        <section class="report-section">
            <h2>Terms taken from your question</h2>
            <p class="report-fine-print">What the app pulled out to run the search and build your results.</p>
            <table class="report-table">
                <tbody>
                    <tr><th>Phenotypes or diseases</th><td>${vm.escapeHtml((vm.lastPhenotypeTerms || []).join(", ") || "—")}</td></tr>
                    <tr><th>Biological mechanisms</th><td>${vm.escapeHtml((vm.lastMechanismTerms || []).join(", ") || "—")}</td></tr>
                    ${vm.reportGeneAnchorRows()}
                    <tr><th>Your research context</th><td>${vm.escapeHtml(researchContext || "—")}</td></tr>
                    <tr><th>Alternative ways to ask</th><td>${(vm.lastAlternativeQueries || []).length ? vm.buildReportList(vm.lastAlternativeQueries) : '<span class="report-empty">None suggested.</span>'}</td></tr>
                </tbody>
            </table>
        </section>
    `;
    const hybridMeta = `
        <section class="report-section">
            <h2>Notes on how your search was run</h2>
            <p class="report-fine-print">Technical detail: how genes and terms were matched to the database (for transparency).</p>
            ${vm.hybridSearchMetaSummaryLines.length
                ? vm.buildReportList(vm.hybridSearchMetaSummaryLines)
                : '<div class="report-empty">No extra notes for this run.</div>'}
        </section>
    `;
    const mechanismDiag = vm.mechanismDiagnosticAssessment
        ? `
            <section class="report-section">
                <h2>Hypothesis generation: eligibility and messages</h2>
                <p class="report-fine-print">Whether the app could propose mechanisms from your data, and any guidance from the analysis.</p>
                <table class="report-table">
                    <tbody>
                        <tr><th>Hypotheses produced</th><td>${vm.escapeHtml(vm.mechanismDiagnosticAssessment.can_generate_hypothesis)}</td></tr>
                        <tr><th>Heads-up</th><td>${vm.escapeHtml(vm.mechanismDiagnosticAssessment.warning_flag || "—")}</td></tr>
                        <tr><th>If none were produced, why</th><td>${vm.escapeHtml(vm.mechanismDiagnosticAssessment.rejection_reason || "—")}</td></tr>
                        <tr><th>Suggested follow-up question</th><td>${vm.escapeHtml(vm.mechanismDiagnosticAssessment.suggested_optimized_query || "—")}</td></tr>
                    </tbody>
                </table>
            </section>
        `
        : "";
    const altQueriesCell =
        (vm.lastAlternativeQueries || []).length > 0
            ? vm.buildReportList(vm.lastAlternativeQueries)
            : '<span class="report-empty">None suggested.</span>';
    const summarySection = `
        <section class="report-section">
            <h2>Overview</h2>
            <p class="report-fine-print">High-level snapshot of your question, extracted search terms, and this session's results.</p>
            <table class="report-table">
                <tbody>
                    <tr><th>Your question</th><td>${vm.escapeHtml(vm.userQuery || "—")}</td></tr>
                    <tr><th>Research context</th><td>${vm.escapeHtml(researchContext || "—")}</td></tr>
                    <tr><th>Phenotypes or diseases (extracted)</th><td>${vm.escapeHtml((vm.lastPhenotypeTerms || []).join(", ") || "—")}</td></tr>
                    <tr><th>Biological mechanisms (extracted)</th><td>${vm.escapeHtml((vm.lastMechanismTerms || []).join(", ") || "—")}</td></tr>
                    ${vm.reportGeneAnchorRows()}
                    <tr><th>Alternative ways to ask</th><td>${altQueriesCell}</td></tr>
                    <tr><th>Summary of findings</th><td>${vm.escapeHtml(vm.getReportSessionSummary())}</td></tr>
                    <tr><th>Phenotypes in your selection</th><td>${vm.escapeHtml(vm.phenotypeCount)}</td></tr>
                    <tr><th>Data categories (gene set clusters) in your selection</th><td>${vm.escapeHtml(vm.factorCount)}</td></tr>
                    <tr><th>Mechanism cards in this report</th><td>${vm.escapeHtml((vm.mechanisms || []).length)}</td></tr>
                </tbody>
            </table>
        </section>
    `;
    const appendix = `
        <section class="report-section report-page-break">
            <h2>Appendix: technical summary (JSON)</h2>
            <p class="report-fine-print">Machine-readable merge of phenotypes, gene sets, and scores.</p>
            <pre class="report-pre">${vm.escapeHtml(factorSummary || "{}")}</pre>
        </section>
        <section class="report-section">
            <h2>Appendix: knowledge graph table (CSV)</h2>
            <p class="report-fine-print">The relationship table used when proposing mechanisms.</p>
            <pre class="report-pre">${vm.escapeHtml(rawKgCsv || "")}</pre>
        </section>
    `;
    const mechanismHypothesesSection = `
<section class="report-section">
    <h2>Suggested mechanisms</h2>
    <p class="report-fine-print">Each card matches what you see under Results: hypothesis text, map, genes, data network, and optional next steps.</p>
    ${buildMechanismReportSections(vm, mechanismImages)}
</section>`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Factor-based Reveal Report</title>
<style>
html, body { margin: 0; padding: 0; background: #f5f6f8; color: #1f2933; }
body, body * { box-sizing: border-box; }
body, p, li, td, th, div, span, a, button, input, textarea, pre { font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 1.45; }
.report { max-width: 1180px; margin: 0 auto; padding: 24px; background: #fff; }
.report-header { border-bottom: 2px solid #f16822; padding-bottom: 16px; margin-bottom: 24px; }
.report-header h1 { font-size: 28px; margin: 0 0 8px; }
.report-header p { margin: 0; font-size: 14px; }
.report-section { margin-bottom: 28px; }
.report-section h2 { font-size: 22px; margin: 0 0 12px; color: #f16822; }
.report-section h3 { font-size: 18px; margin: 0 0 8px; }
.report-section h4 { font-size: 16px; margin: 0 0 10px; }
.report-section h5 { font-size: 14px; margin: 0 0 8px; }
.report-card { border: 1px solid #d8dee4; border-radius: 8px; padding: 18px; background: #fafbfc; margin-bottom: 18px; }
.report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.report-table th, .report-table td { border: 1px solid #d8dee4; padding: 8px 10px; text-align: left; vertical-align: top; word-break: break-word; font-size: 14px; }
.report-table th { background: #f3f4f6; width: 24%; }
.report-subsection { margin-bottom: 14px; font-size: 14px; }
.report-empty { color: #667; font-style: italic; font-size: 14px; }
.report-network-image { max-width: 100%; width: 100%; height: auto; border: 1px solid #d8dee4; border-radius: 6px; background: #fff; }
.report-network-meta { margin-bottom: 8px; color: #555; font-size: 14px; }
.report-map-caption { margin: 0 0 10px; font-size: 14px; }
.report-body-tight { margin: 6px 0 0; font-size: 14px; }
.report-fine-print { margin: 0 0 12px; font-size: 14px; color: #555; }
.report-next-steps-block { border-top: 1px solid #d8dee4; padding-top: 14px; margin-top: 8px; }
.report-next-steps-list { margin: 0; padding-left: 1.35rem; font-size: 14px; }
.report-next-steps-list li { margin-bottom: 12px; font-size: 14px; }
.report-next-steps-list li em { font-style: normal; font-weight: 600; color: #374151; }
.report-pre { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; background: #f7f7f8; border: 1px solid #d8dee4; padding: 12px; border-radius: 6px; font-size: 14px; }
.report-keyvals > div { margin-bottom: 6px; font-size: 14px; }
.report-page-break { page-break-before: always; }
@media print {
    html, body { background: #fff; }
    .report { max-width: none; padding: 0; }
    .report-card, .report-section { break-inside: avoid; }
}
</style>
</head>
<body>
<div class="report">
    <header class="report-header">
        <h1>Factor-based Reveal Report</h1>
        <p>Generated ${vm.escapeHtml(new Date().toLocaleString())}</p>
    </header>
    ${summarySection}
    ${hybridMeta}
    ${mechanismDiag}
    ${mechanismHypothesesSection}
    ${vm.buildReportFactorCards(vm.factorDataTableRowsFiltered || [], "Your selected phenotypes and data categories")}
    ${vm.buildReportFactorCards(vm.remainingGeneSetClusterRows || [], "Clusters not yet covered by a hypothesis card")}
    ${extractedTerms}
    ${appendix}
</div>
</body>
</html>`;
}

export {
    buildHtmlReportDocument,
    buildMechanismClipboardText,
    buildMechanismHandoffAppendixObject,
    buildMechanismHandoffHtmlDocument,
    buildMechanismReportOneCardHtml,
    buildMechanismReportSections,
    getMechanismTopGenes,
    sanitizeHandoffCandidateGenes,
    sanitizeHandoffFlattenedRows,
    sanitizeHandoffGeneConnections,
    sanitizeHandoffNetwork,
    sanitizeHandoffSelectionRows,
};
