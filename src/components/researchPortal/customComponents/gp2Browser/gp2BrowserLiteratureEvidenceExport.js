/**
 * Build / download a standalone HTML report of Literature evidence results,
 * including an embedded knowledge-graph SVG when available.
 */
import { formatAbstractWithHighlightedQuote } from "./gp2BrowserLiteratureEvidence.js";

function escapeHtml(text) {
    return String(text == null ? "" : text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function paperMeta(paper) {
    return [paper?.journal, paper?.pubdate].filter(Boolean).join(" · ");
}

function paperByPmid(papers, pmid) {
    return (papers || []).find((paper) => String(paper.pmid) === String(pmid)) || null;
}

function slugifyFilenamePart(value) {
    return (
        String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80) || "locus"
    );
}

/**
 * @param {object} input
 * @param {string|null} input.regionLabel
 * @param {string|null} input.phenotype
 * @param {string|null} input.query
 * @param {string[]} input.genesSearched
 * @param {Array<{gene:string,reasons:string[]}>} input.geneReasons
 * @param {string[]} input.digestFindings
 * @param {string|null} input.aiSummary
 * @param {boolean} input.usedLocusDigest
 * @param {Array} input.papers
 * @param {Array} input.claims
 * @param {Array} input.excerpts
 * @param {Array} input.gaps
 * @param {string} input.networkSvg  raw SVG markup (may be empty)
 */
export function buildGp2LiteratureEvidenceHtml(input) {
    const {
        regionLabel = "",
        phenotype = "",
        query = "",
        genesSearched = [],
        geneReasons = [],
        digestFindings = [],
        aiSummary = "",
        usedLocusDigest = false,
        papers = [],
        claims = [],
        excerpts = [],
        gaps = [],
        networkSvg = "",
    } = input || {};

    const generatedAt = new Date().toISOString();
    const geneList = genesSearched.length ? genesSearched.join(", ") : "—";

    const claimsHtml = claims.length
        ? `<ol>${claims
              .map((claim) => {
                  const nums = (claim.excerptNumbers || []).join(", ");
                  return `<li>${escapeHtml(claim.text)}${
                      nums ? ` <sup>[${escapeHtml(nums)}]</sup>` : ""
                  }</li>`;
              })
              .join("")}</ol>`
        : "<p class=\"empty\">No evidences extracted.</p>";

    const gapsHtml = gaps.length
        ? `<ol>${gaps
              .map((gap) => {
                  const nums = (gap.excerptNumbers || []).join(", ");
                  return `<li>${escapeHtml(gap.text)}${
                      nums ? ` <sup>[${escapeHtml(nums)}]</sup>` : ""
                  }</li>`;
              })
              .join("")}</ol>`
        : "<p class=\"empty\">No open questions identified.</p>";

    const excerptsHtml = excerpts.length
        ? excerpts
              .map((excerpt) => {
                  const paper = paperByPmid(papers, excerpt.pmid);
                  const title = (paper && paper.title) || `PMID ${excerpt.pmid}`;
                  const meta = paperMeta(paper);
                  const authors = (paper && paper.authors) || [];
                  const abstract = (paper && paper.abstract) || "";
                  const { html: abstractHtml } = formatAbstractWithHighlightedQuote(
                      abstract,
                      excerpt.quote,
                      { maxLength: null, markClass: "mark" }
                  );
                  return `<article class="excerpt">
  <div class="excerpt-num">${escapeHtml(excerpt.number)}.</div>
  <blockquote>“${escapeHtml(excerpt.quote)}”</blockquote>
  <p class="meta"><a href="https://pubmed.ncbi.nlm.nih.gov/${escapeHtml(
      excerpt.pmid
  )}/">${escapeHtml(title)}</a></p>
  <p class="sub">PMID: ${escapeHtml(excerpt.pmid)}${
                      meta ? ` · ${escapeHtml(meta)}` : ""
                  }${authors.length ? `<br>${escapeHtml(authors.join(", "))}` : ""}</p>
  ${abstract ? `<div class="abstract">${abstractHtml}</div>` : ""}
</article>`;
              })
              .join("\n")
        : "<p class=\"empty\">No supporting excerpts.</p>";

    const papersHtml = papers.length
        ? `<ol class="papers">${papers
              .map((paper) => {
                  const meta = paperMeta(paper);
                  const authors = paper.authors || [];
                  return `<li>
  <a href="https://pubmed.ncbi.nlm.nih.gov/${escapeHtml(paper.pmid)}/">${escapeHtml(
                      paper.title || `PMID ${paper.pmid}`
                  )}</a>
  <div class="sub">PMID: ${escapeHtml(paper.pmid)}${
                      meta ? ` · ${escapeHtml(meta)}` : ""
                  }${authors.length ? `<br>${escapeHtml(authors.join(", "))}` : ""}</div>
</li>`;
              })
              .join("")}</ol>`
        : "<p class=\"empty\">No PubMed papers returned.</p>";

    const findingsHtml = digestFindings.length
        ? `<ul>${digestFindings
              .map((finding) => `<li>${escapeHtml(finding)}</li>`)
              .join("")}</ul>`
        : "<p class=\"empty\">No locus digest findings.</p>";

    const reasonsHtml = geneReasons.length
        ? `<ul>${geneReasons
              .map(
                  (entry) =>
                      `<li><strong>${escapeHtml(entry.gene)}</strong> — ${escapeHtml(
                          (entry.reasons || []).join("; ")
                      )}</li>`
              )
              .join("")}</ul>`
        : `<p class="empty">Searched genes: ${escapeHtml(geneList)}</p>`;

    const networkBlock = networkSvg
        ? `<div class="network">${networkSvg}</div>`
        : "<p class=\"empty\">No knowledge graph was available for this run.</p>";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Literature evidence — ${escapeHtml(regionLabel || phenotype || "locus")}</title>
<style>
  body { font-family: Helvetica, Arial, sans-serif; color: #33363d; margin: 24px; line-height: 1.45; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  h2 { font-size: 16px; margin: 28px 0 10px; border-bottom: 1px solid #e6e1d6; padding-bottom: 6px; }
  h3 { font-size: 14px; margin: 18px 0 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ai-badge { display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 999px; border: 1px solid rgba(224,123,57,0.45); background: #fff6ef; color: #b85a1a; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
  .meta-line, .sub, .empty, .note { color: #6b6b6b; font-size: 13px; }
  .note { margin: 10px 0 0; padding: 8px 12px; border-left: 4px solid #e07b39; background: #fff6ef; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 800px) { .two-col { grid-template-columns: 1fr; } }
  .network { overflow: auto; border: 1px solid #e6e1d6; border-radius: 8px; padding: 12px; background: #fafafa; }
  .network svg { max-width: 100%; height: auto; display: block; }
  .excerpt { border: 1px solid #e6e1d6; border-radius: 6px; padding: 10px 12px; margin: 0 0 12px; background: #fafafa; }
  .excerpt-num { font-weight: 700; color: #2c5c97; }
  blockquote { margin: 4px 0 8px; font-style: italic; }
  a { color: #2c5c97; }
  .abstract { margin-top: 8px; padding-top: 8px; border-top: 1px solid #e6e1d6; font-size: 13px; white-space: pre-line; }
  mark.mark, .mark { background: #ffe08a; font-weight: 600; padding: 0 2px; border-radius: 3px; }
  .ai-summary { white-space: pre-wrap; background: #f7f8fa; border: 1px solid #e6e1d6; border-radius: 6px; padding: 12px; }
  .papers { padding-left: 18px; }
  .papers li { margin-bottom: 10px; }
</style>
</head>
<body>
  <h1>Literature evidence</h1>
  <p class="meta-line">
    Region: <strong>${escapeHtml(regionLabel || "—")}</strong>
    · Phenotype: <strong>${escapeHtml(phenotype || "—")}</strong>
    · Generated: ${escapeHtml(generatedAt)}
  </p>
  <p class="meta-line">
    Searched PubMed for <strong>${escapeHtml(geneList)}</strong>
    ${
        usedLocusDigest
            ? "(genes from this locus digest)"
            : "(LD data unavailable; used a simpler gene set)"
    }.
  </p>
  ${query ? `<p class="meta-line">Query: <code>${escapeHtml(query)}</code></p>` : ""}
  <p class="note">
    Re-running Literature evidence on the same locus can produce slightly different
    evidences, excerpts, and networks. The PubMed paper set is usually stable; wording
    and granularity can vary because synthesis is model-based.
  </p>

  <h2>Summary digest</h2>
  <h3>AI summary (stage 1) <span class="ai-badge" title="Generated with AI">AI</span></h3>
  ${
      aiSummary
          ? `<div class="ai-summary">${escapeHtml(aiSummary)}</div>`
          : "<p class=\"empty\">No AI summary was produced for this run.</p>"
  }
  <h3>Locus digest facts used for the PubMed search</h3>
  ${findingsHtml}
  <h3>Why these genes were searched</h3>
  ${reasonsHtml}

  <h2>Knowledge graph <span class="ai-badge" title="Generated with AI">AI</span></h2>
  ${networkBlock}

  <h2>Evidences and open questions</h2>
  <div class="two-col">
    <section>
      <h3>Evidences <span class="ai-badge" title="Generated with AI">AI</span></h3>
      ${claimsHtml}
    </section>
    <section>
      <h3>Open questions <span class="ai-badge" title="Generated with AI">AI</span></h3>
      ${gapsHtml}
    </section>
  </div>

  <h2>Excerpts <span class="ai-badge" title="Generated with AI">AI</span></h2>
  ${excerptsHtml}

  <h2>PubMed papers returned</h2>
  <p class="meta-line">${papers.length} paper${papers.length === 1 ? "" : "s"}</p>
  ${papersHtml}
</body>
</html>`;
}

export function downloadGp2LiteratureEvidenceHtml(input) {
    const html = buildGp2LiteratureEvidenceHtml(input);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const regionPart = slugifyFilenamePart(input?.regionLabel || input?.phenotype);
    const stamp = new Date().toISOString().slice(0, 10);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gp2-literature-evidence-${regionPart}-${stamp}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}
