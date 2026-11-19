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
            <div v-if="synthesizing" class="gp2-lit-evidence-status">
                Generating literature synthesis…
            </div>
            <div v-else-if="synthesisError" class="gp2-lit-evidence-status gp2-lit-evidence-status-error">
                {{ synthesisError }}
            </div>
            <div v-else-if="knownFindings || knowledgeGaps" class="gp2-lit-evidence-sections">
                <section v-if="knownFindings" class="gp2-lit-evidence-section">
                    <h3>What the literature establishes</h3>
                    <p>{{ knownFindings }}</p>
                </section>
                <section v-if="knowledgeGaps" class="gp2-lit-evidence-section">
                    <h3>Knowledge gaps</h3>
                    <p>{{ knowledgeGaps }}</p>
                </section>
            </div>

            <ul class="gp2-lit-evidence-papers">
                <li v-for="paper in papers" :key="paper.pmid" class="gp2-lit-evidence-paper">
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
                            {{ paper.journal }}<span v-if="paper.journal && paper.pubdate"> · </span
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
    },
    data() {
        return {
            abstractExcerptLength: 220,
            expandedPmids: {},
        };
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
