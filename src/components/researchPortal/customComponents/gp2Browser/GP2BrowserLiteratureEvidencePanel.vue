<template>
    <div class="gp2-lit-evidence">
        <div
            v-if="synthesizing || kgLoading"
            class="gp2-lit-evidence-status"
            role="status"
            aria-live="polite"
        >
            {{
                progressLabel ||
                (synthesizing
                    ? "Extracting evidences from abstracts…"
                    : "Building the knowledge graph…")
            }}
        </div>
        <div
            v-if="synthesisError"
            class="gp2-lit-evidence-status gp2-lit-evidence-status-error"
            role="alert"
        >
            {{ synthesisError }}
        </div>

        <p class="gp2-lit-evidence-query">
            Searched PubMed for
            <strong>{{ genesSearched.join(", ") || "—" }}</strong>
            <span v-if="usedLocusDigest"> (genes from this locus digest)</span>
            <span v-else> (LD data unavailable; used a simpler gene set)</span>.
        </p>

        <p class="gp2-lit-evidence-variability-note" role="note">
            Note: re-running Literature evidence on the same locus can produce slightly
            different evidences, excerpts, and networks. The PubMed paper set is usually
            stable; wording and granularity can vary because synthesis is model-based.
        </p>

        <div class="gp2-lit-evidence-tabs" role="tablist">
            <button
                type="button"
                role="tab"
                class="gp2-lit-evidence-tab"
                :class="{ 'gp2-lit-evidence-tab-active': activeTab === 'evidences' }"
                @click="activeTab = 'evidences'"
            >
                Evidences
            </button>
            <button
                type="button"
                role="tab"
                class="gp2-lit-evidence-tab"
                :class="{ 'gp2-lit-evidence-tab-active': activeTab === 'excerpts' }"
                @click="activeTab = 'excerpts'"
            >
                Excerpts
            </button>
            <button
                type="button"
                role="tab"
                class="gp2-lit-evidence-tab"
                :class="{ 'gp2-lit-evidence-tab-active': activeTab === 'summaryDigest' }"
                @click="activeTab = 'summaryDigest'"
            >
                Summary digest
            </button>
        </div>

        <div v-show="activeTab === 'evidences'" class="gp2-lit-evidence-evidences-tab">
            <p v-if="!papers.length" class="gp2-lit-evidence-empty">
                No PubMed papers matched this search.
            </p>
            <template v-else>
                <section class="gp2-lit-evidence-network">
                    <h3>Knowledge graph</h3>
                    <GP2BrowserLiteratureKgNetwork
                        ref="kgNetwork"
                        :kg="kg"
                        :loading="kgLoading"
                        :error="kgError"
                        :visible="activeTab === 'evidences'"
                        @focus-claims="onFocusClaims"
                    />
                </section>

                <div class="gp2-lit-evidence-columns">
                    <section ref="claimsCol" class="gp2-lit-evidence-col">
                        <h3>Evidences</h3>
                        <ol v-if="claims.length" class="gp2-lit-evidence-list">
                            <li
                                v-for="(claim, claimIndex) in claims"
                                :id="claimAnchorId(claimIndex + 1)"
                                :key="`claim-${claimIndex}`"
                                :class="{
                                    'is-focused': focusedClaimNumbers.includes(claimIndex + 1),
                                }"
                            >
                                {{ claim.text }}
                                <GP2BrowserLiteratureFootnote
                                    v-if="claim.excerptNumbers.length"
                                    :numbers="claim.excerptNumbers"
                                    :excerpts-by-number="excerptsByNumber"
                                    :popover-width="columnWidth"
                                />
                            </li>
                        </ol>
                        <p v-else class="gp2-lit-evidence-empty">
                            No evidences could be extracted with a verified supporting excerpt.
                        </p>
                    </section>
                    <section class="gp2-lit-evidence-col">
                        <h3>Open questions</h3>
                        <ol v-if="gaps.length" class="gp2-lit-evidence-list">
                            <li v-for="(gap, gapIndex) in gaps" :key="`gap-${gapIndex}`">
                                {{ gap.text }}
                                <GP2BrowserLiteratureFootnote
                                    v-if="gap.excerptNumbers.length"
                                    :numbers="gap.excerptNumbers"
                                    :excerpts-by-number="excerptsByNumber"
                                    :popover-width="columnWidth"
                                />
                            </li>
                        </ol>
                        <p v-else class="gp2-lit-evidence-empty">No open questions identified yet.</p>
                    </section>
                </div>
            </template>
        </div>

        <div v-show="activeTab === 'excerpts'" class="gp2-lit-evidence-excerpts-tab">
            <ol v-if="excerpts.length" class="gp2-lit-evidence-excerpts-list">
                <li
                    v-for="excerpt in excerpts"
                    :id="excerptAnchorId(excerpt.number)"
                    :key="`excerpt-${excerpt.number}`"
                    class="gp2-lit-evidence-excerpt"
                >
                    <span class="gp2-lit-evidence-excerpt-number">{{ excerpt.number }}.</span>
                    <blockquote class="gp2-lit-evidence-excerpt-quote">
                        &ldquo;{{ excerpt.quote }}&rdquo;
                    </blockquote>
                    <div class="gp2-lit-evidence-excerpt-meta">
                        <a
                            class="gp2-lit-evidence-excerpt-title"
                            :href="`https://pubmed.ncbi.nlm.nih.gov/${excerpt.pmid}/`"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {{ excerptPaperTitle(excerpt) }}
                        </a>
                        <div class="gp2-lit-evidence-excerpt-sub">
                            PMID: {{ excerpt.pmid
                            }}<span v-if="excerptPaperMeta(excerpt)"> · {{ excerptPaperMeta(excerpt) }}</span
                            ><span v-if="excerptPaperAuthors(excerpt).length"><br /></span
                            >{{ excerptPaperAuthors(excerpt).join(", ") }}
                        </div>
                    </div>
                    <div
                        v-if="excerptPaperAbstract(excerpt)"
                        class="gp2-lit-evidence-excerpt-abstract"
                    >
                        <span
                            class="gp2-lit-evidence-excerpt-abstract-text"
                            v-html="highlightedAbstractHtml(excerpt)"
                        />
                        <button
                            v-if="excerptPaperAbstract(excerpt).length > abstractExcerptLength"
                            type="button"
                            class="gp2-lit-evidence-abstract-toggle"
                            @click="toggleAbstract(excerpt.pmid)"
                        >
                            {{ isExpanded(excerpt.pmid) ? "Show less" : "Read full abstract" }}
                        </button>
                    </div>
                </li>
            </ol>
            <p v-else class="gp2-lit-evidence-empty">No supporting excerpts extracted yet.</p>
        </div>

        <div v-show="activeTab === 'summaryDigest'" class="gp2-lit-evidence-digest-tab">
            <section class="gp2-lit-evidence-context">
                <div v-if="aiSummary" class="gp2-lit-evidence-ai-summary">
                    <h3>AI summary (stage 1)</h3>
                    <p class="gp2-lit-evidence-findings-note">
                        Generated before the PubMed search so the locus narrative is visible first.
                    </p>
                    <div class="gp2-lit-evidence-ai-summary-body">{{ aiSummary }}</div>
                </div>
                <p v-else class="gp2-lit-evidence-empty">
                    No AI summary was produced for this run (often because LD scores were
                    unavailable). Literature evidence may still use a fallback gene set.
                </p>

                <div v-if="digestFindings.length" class="gp2-lit-evidence-findings">
                    <h3>Locus digest facts used for the PubMed search</h3>
                    <p class="gp2-lit-evidence-findings-note">
                        Structured associations / LD / QTL facts that selected the search genes.
                    </p>
                    <ul>
                        <li
                            v-for="(finding, findingIndex) in digestFindings"
                            :key="`finding-${findingIndex}`"
                        >
                            {{ finding }}
                        </li>
                    </ul>
                </div>

                <div v-if="resolvedGeneReasons.length" class="gp2-lit-evidence-gene-reasons">
                    <h3>Why these genes were searched</h3>
                    <ul>
                        <li
                            v-for="entry in resolvedGeneReasons"
                            :key="`gene-reason-${entry.gene}`"
                        >
                            <strong>{{ entry.gene }}</strong>
                            — {{ entry.reasons.join("; ") }}
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import GP2BrowserLiteratureFootnote from "./GP2BrowserLiteratureFootnote.vue";
import GP2BrowserLiteratureKgNetwork from "./GP2BrowserLiteratureKgNetwork.vue";
import { formatAbstractWithHighlightedQuote } from "./gp2BrowserLiteratureEvidence.js";

export default {
    name: "GP2BrowserLiteratureEvidencePanel",
    components: {
        GP2BrowserLiteratureFootnote,
        GP2BrowserLiteratureKgNetwork,
    },
    props: {
        genesSearched: {
            type: Array,
            default: () => [],
        },
        /** Each: { gene, reasons: string[] }. */
        geneReasons: {
            type: Array,
            default: () => [],
        },
        /** Bullet strings of structured locus findings. */
        digestFindings: {
            type: Array,
            default: () => [],
        },
        /** Prose from the AI summary stage that precedes LE. */
        aiSummary: {
            type: String,
            default: null,
        },
        usedLocusDigest: {
            type: Boolean,
            default: false,
        },
        papers: {
            type: Array,
            default: () => [],
        },
        synthesizing: {
            type: Boolean,
            default: false,
        },
        synthesisError: {
            type: String,
            default: null,
        },
        progressLabel: {
            type: String,
            default: null,
        },
        /** Each: { text, excerptNumbers }. */
        claims: {
            type: Array,
            default: () => [],
        },
        /** Each: { number, pmid, quote } — a verified verbatim quote from `papers`. */
        excerpts: {
            type: Array,
            default: () => [],
        },
        /** Each: { text, excerptNumbers }. */
        gaps: {
            type: Array,
            default: () => [],
        },
        kg: {
            type: Object,
            default: null,
        },
        kgLoading: {
            type: Boolean,
            default: false,
        },
        kgError: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            activeTab: "evidences",
            columnWidth: null,
            abstractExcerptLength: 220,
            expandedPmids: {},
            focusedClaimNumbers: [],
            focusClearTimer: null,
        };
    },
    computed: {
        resolvedGeneReasons() {
            if (Array.isArray(this.geneReasons) && this.geneReasons.length) {
                return this.geneReasons;
            }
            return (this.genesSearched || []).map((gene) => ({
                gene,
                reasons: [
                    this.usedLocusDigest
                        ? "Included from the locus digest"
                        : "Fallback gene set (LD digest unavailable)",
                ],
            }));
        },
        excerptsByNumber() {
            const map = {};
            this.excerpts.forEach((excerpt) => {
                const paper = this.paperByPmid(excerpt.pmid);
                map[excerpt.number] = {
                    quote: excerpt.quote,
                    pmid: excerpt.pmid,
                    title: paper && paper.title,
                    journal: (paper && paper.journal) || "",
                    pubdate: (paper && paper.pubdate) || "",
                    authors: (paper && paper.authors) || [],
                    abstract: (paper && paper.abstract) || "",
                };
            });
            return map;
        },
    },
    mounted() {
        this.updateColumnWidth();
        window.addEventListener("resize", this.updateColumnWidth);
        if (typeof ResizeObserver !== "undefined" && this.$refs.claimsCol) {
            this.resizeObserver = new ResizeObserver(() => this.updateColumnWidth());
            this.resizeObserver.observe(this.$refs.claimsCol);
        }
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.updateColumnWidth);
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.focusClearTimer) {
            clearTimeout(this.focusClearTimer);
            this.focusClearTimer = null;
        }
    },
    methods: {
        /** Matches the excerpt popover's width to the claims/gaps column it's triggered from. */
        updateColumnWidth() {
            if (this.$refs.claimsCol) {
                this.columnWidth = this.$refs.claimsCol.clientWidth;
            }
        },
        claimAnchorId(number) {
            return `gp2-lit-claim-${number}`;
        },
        excerptAnchorId(number) {
            return `gp2-lit-excerpt-${number}`;
        },
        onFocusClaims(claimNumbers) {
            if (this.focusClearTimer) {
                clearTimeout(this.focusClearTimer);
                this.focusClearTimer = null;
            }
            this.focusedClaimNumbers = Array.isArray(claimNumbers)
                ? claimNumbers.map((number) => Number(number)).filter(Boolean)
                : [];
            if (!this.focusedClaimNumbers.length) {
                return;
            }
            this.$nextTick(() => {
                const first = this.focusedClaimNumbers[0];
                const el = first ? document.getElementById(this.claimAnchorId(first)) : null;
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            });
        },
        paperByPmid(pmid) {
            return this.papers.find((paper) => String(paper.pmid) === String(pmid)) || null;
        },
        excerptPaperTitle(excerpt) {
            const paper = this.paperByPmid(excerpt.pmid);
            return (paper && paper.title) || `PMID ${excerpt.pmid}`;
        },
        excerptPaperMeta(excerpt) {
            const paper = this.paperByPmid(excerpt.pmid);
            if (!paper) {
                return "";
            }
            return [paper.journal, paper.pubdate].filter(Boolean).join(" · ");
        },
        excerptPaperAuthors(excerpt) {
            const paper = this.paperByPmid(excerpt.pmid);
            return (paper && paper.authors) || [];
        },
        excerptPaperAbstract(excerpt) {
            const paper = this.paperByPmid(excerpt.pmid);
            return (paper && paper.abstract) || "";
        },
        isExpanded(pmid) {
            return Boolean(this.expandedPmids[pmid]);
        },
        toggleAbstract(pmid) {
            this.expandedPmids = {
                ...this.expandedPmids,
                [pmid]: !this.expandedPmids[pmid],
            };
        },
        highlightedAbstractHtml(excerpt) {
            const abstract = this.excerptPaperAbstract(excerpt);
            const expanded = this.isExpanded(excerpt.pmid);
            const { html } = formatAbstractWithHighlightedQuote(abstract, excerpt.quote, {
                maxLength: expanded ? null : this.abstractExcerptLength,
                markClass: "gp2-lit-abstract-mark",
            });
            return html;
        },
    },
};
</script>

<style scoped>
.gp2-lit-evidence {
    display: flex;
    flex-direction: column;
    gap: 14px;
    /* 50% more than the modal body's own 14px 16px 18px padding, added on
       top of it (scoped to this panel, not the shared modal). */
    padding: 7px 8px 9px;
}

.gp2-lit-evidence-digest-tab,
.gp2-lit-evidence-context {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.gp2-lit-evidence-ai-summary h3,
.gp2-lit-evidence-findings h3,
.gp2-lit-evidence-gene-reasons h3 {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-evidence-ai-summary-body {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
    white-space: pre-line;
}

.gp2-lit-evidence-findings-note {
    margin: 0 0 6px;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-evidence-findings ul,
.gp2-lit-evidence-gene-reasons ul {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-evidence-query {
    margin: 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-evidence-variability-note {
    margin: 10px 0 0;
    padding: 8px 12px;
    border: 1px solid rgba(224, 123, 57, 0.35);
    border-left: 4px solid var(--cfde-orange, #e07b39);
    border-radius: 8px;
    background: #fff6ef;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-evidence-empty {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-evidence-status {
    margin: 0 0 12px;
    padding: 10px 14px;
    border: 1px solid rgba(44, 92, 151, 0.28);
    border-left: 4px solid var(--cfde-blue, #2c5c97);
    border-radius: 8px;
    background: #eef4fb;
    box-shadow: 0 1px 2px rgba(51, 54, 61, 0.06);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-evidence-status-error {
    border-color: rgba(238, 49, 36, 0.35);
    border-left-color: #ee3124;
    background: #fdeeee;
    color: #9f1c14;
}

.gp2-lit-evidence-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.gp2-lit-evidence-tab {
    padding: 6px 14px;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-muted, #6b6b6b);
    cursor: pointer;
}

.gp2-lit-evidence-tab-active {
    color: var(--cfde-blue, #2c5c97);
    border-bottom-color: var(--cfde-blue, #2c5c97);
}

.gp2-lit-evidence-evidences-tab {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.gp2-lit-evidence-network {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.gp2-lit-evidence-network h3,
.gp2-lit-evidence-col h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-evidence-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px 24px;
    align-items: start;
}

.gp2-lit-evidence-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.gp2-lit-evidence-list {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-evidence-list > li {
    scroll-margin-top: 12px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.gp2-lit-evidence-list > li.is-focused {
    background: #fbeee3;
}

.gp2-lit-evidence-excerpts-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.gp2-lit-evidence-excerpt {
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fafafa;
    scroll-margin-top: 12px;
}

.gp2-lit-evidence-excerpt-number {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.gp2-lit-evidence-excerpt-quote {
    margin: 4px 0 6px;
    padding: 0;
    border: none;
    font-size: 13px;
    line-height: 1.5;
    font-style: italic;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-evidence-excerpt-meta {
    font-size: 13px;
}

.gp2-lit-evidence-excerpt-title {
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    text-decoration: none;
}

.gp2-lit-evidence-excerpt-title:hover {
    text-decoration: underline;
}

.gp2-lit-evidence-excerpt-sub {
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-evidence-excerpt-abstract {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
    white-space: pre-line;
}

.gp2-lit-evidence-excerpt-abstract-text >>> .gp2-lit-abstract-mark {
    padding: 0 2px;
    border-radius: 3px;
    background: #ffe08a;
    color: inherit;
    font-style: normal;
    font-weight: 600;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
}

.gp2-lit-evidence-abstract-toggle {
    display: inline;
    margin-left: 4px;
    padding: 0;
    border: none;
    background: none;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
    text-decoration: underline;
}

@media (max-width: 720px) {
    .gp2-lit-evidence-columns {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
