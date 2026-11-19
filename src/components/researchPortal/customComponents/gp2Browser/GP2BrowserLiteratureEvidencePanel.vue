<template>
    <div class="gp2-lit-evidence">
        <p class="gp2-lit-evidence-query">
            Searched PubMed for <strong>{{ genesSearched.join(", ") }}</strong>
            <span v-if="usedLocusDigest"> (genes from this locus's AI-summary digest)</span>
            <span v-else> (LD data unavailable; used a simpler gene set)</span>.
        </p>

        <div v-if="!papers.length" class="gp2-lit-evidence-empty">
            No PubMed papers matched this search.
        </div>

        <template v-else>
            <button
                v-if="!loadMoreExhausted"
                type="button"
                class="gp2-lit-evidence-load-more"
                :disabled="loadingMore"
                @click="$emit('load-more')"
            >
                {{ loadingMore ? "Loading next 15…" : "Show next 15" }}
            </button>
            <div
                v-if="loadMoreError"
                class="gp2-lit-evidence-status gp2-lit-evidence-status-error"
            >
                {{ loadMoreError }}
            </div>

            <div
                v-for="(batch, batchIndex) in allBatches"
                :key="`batch-${batchIndex}`"
                class="gp2-lit-evidence-batch"
            >
                <div v-if="batch.synthesizing" class="gp2-lit-evidence-status">
                    Generating literature synthesis…
                </div>
                <div
                    v-else-if="batch.synthesisError"
                    class="gp2-lit-evidence-status gp2-lit-evidence-status-error"
                >
                    {{ batch.synthesisError }}
                </div>
                <div
                    v-else-if="batch.knownFindings || batch.knowledgeGaps"
                    class="gp2-lit-evidence-sections"
                >
                    <section v-if="batch.knownFindings" class="gp2-lit-evidence-section">
                        <h3>What the literature establishes</h3>
                        <p>{{ batch.knownFindings }}</p>
                    </section>
                    <section v-if="batch.knowledgeGaps" class="gp2-lit-evidence-section">
                        <h3>Knowledge gaps</h3>
                        <p>{{ batch.knowledgeGaps }}</p>
                    </section>
                </div>

                <div v-if="!batch.papers.length" class="gp2-lit-evidence-empty">
                    No more PubMed papers matched this search.
                </div>
                <ul v-else class="gp2-lit-evidence-papers">
                    <li v-for="paper in batch.papers" :key="paper.pmid" class="gp2-lit-evidence-paper">
                        <a
                            class="gp2-lit-evidence-paper-title"
                            :href="`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {{ paper.title || `PMID ${paper.pmid}` }}
                        </a>
                        <div class="gp2-lit-evidence-paper-body">
                            <div class="gp2-lit-evidence-paper-meta">
                                <span class="gp2-lit-evidence-paper-pmid">PMID: {{ paper.pmid }}</span
                                ><span v-if="paper.journal || paper.pubdate"> · </span
                                >{{ paper.journal }}<span v-if="paper.journal && paper.pubdate"> · </span
                                >{{ paper.pubdate }}<span v-if="paper.authors && paper.authors.length"><br /></span
                                >{{ (paper.authors || []).join(", ") }}
                            </div>
                            <div v-if="paper.abstract" class="gp2-lit-evidence-paper-abstract">
                                {{ isExpanded(paper.pmid) ? paper.abstract : abstractExcerpt(paper.abstract) }}
                                <button
                                    v-if="paper.abstract.length > abstractExcerptLength"
                                    type="button"
                                    class="gp2-lit-evidence-abstract-toggle"
                                    @click="toggleAbstract(paper.pmid)"
                                >
                                    {{ isExpanded(paper.pmid) ? "Show less" : "Read full abstract" }}
                                </button>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </template>
    </div>
</template>

<script>
export default {
    name: "GP2BrowserLiteratureEvidencePanel",
    props: {
        genesSearched: {
            type: Array,
            default: () => [],
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
        knownFindings: {
            type: String,
            default: "",
        },
        knowledgeGaps: {
            type: String,
            default: "",
        },
        /** Each "Show next 15" page, appended after the first page in fetch order. */
        moreBatches: {
            type: Array,
            default: () => [],
        },
        loadingMore: {
            type: Boolean,
            default: false,
        },
        loadMoreError: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            abstractExcerptLength: 220,
            expandedPmids: {},
        };
    },
    computed: {
        allBatches() {
            return [
                {
                    papers: this.papers,
                    synthesizing: this.synthesizing,
                    synthesisError: this.synthesisError,
                    knownFindings: this.knownFindings,
                    knowledgeGaps: this.knowledgeGaps,
                },
                ...this.moreBatches,
            ];
        },
        /** The most recently loaded "next 15" page came back empty — no more results. */
        loadMoreExhausted() {
            if (!this.moreBatches.length) {
                return false;
            }
            return this.moreBatches[this.moreBatches.length - 1].papers.length === 0;
        },
    },
    methods: {
        isExpanded(pmid) {
            return Boolean(this.expandedPmids[pmid]);
        },
        toggleAbstract(pmid) {
            this.expandedPmids = {
                ...this.expandedPmids,
                [pmid]: !this.expandedPmids[pmid],
            };
        },
        abstractExcerpt(abstract) {
            const text = String(abstract || "").trim();
            if (text.length <= this.abstractExcerptLength) {
                return text;
            }
            return `${text.slice(0, this.abstractExcerptLength).trim()}…`;
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

.gp2-lit-evidence-query {
    margin: 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-evidence-empty {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-evidence-papers {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.gp2-lit-evidence-paper {
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fafafa;
}

.gp2-lit-evidence-paper-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
    text-decoration: none;
}

.gp2-lit-evidence-paper-title:hover {
    text-decoration: underline;
}

.gp2-lit-evidence-paper-body {
    margin-top: 6px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 16px;
}

.gp2-lit-evidence-paper-meta {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-evidence-paper-pmid {
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-evidence-paper-abstract {
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
    white-space: pre-line;
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

.gp2-lit-evidence-status {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-evidence-status-error {
    color: #ee3124;
}

.gp2-lit-evidence-load-more {
    align-self: flex-start;
    padding: 6px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fff;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.gp2-lit-evidence-load-more:disabled {
    cursor: default;
    opacity: 0.6;
}

.gp2-lit-evidence-batch {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.gp2-lit-evidence-batch + .gp2-lit-evidence-batch {
    padding-top: 14px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
}

.gp2-lit-evidence-sections {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.gp2-lit-evidence-section {
    container-type: inline-size;
}

.gp2-lit-evidence-section h3 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.gp2-lit-evidence-section p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
    white-space: pre-line;
}

/* Each section's own paragraph flows into 2 text columns once that
   section itself (not the viewport) is wide enough to read comfortably
   that way. */
@container (min-width: 840px) {
    .gp2-lit-evidence-section p {
        column-count: 2;
        column-gap: 24px;
    }
}
</style>
