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
                    <div class="gp2-lit-evidence-paper-meta">
                        {{ paper.journal }}<span v-if="paper.journal && paper.pubdate"> · </span
                        >{{ paper.pubdate }}<span v-if="paper.authors && paper.authors.length"> · </span
                        >{{ (paper.authors || []).join(", ") }}
                    </div>
                </li>
            </ul>

            <div v-if="synthesizing" class="gp2-lit-evidence-status">
                Generating literature synthesis…
            </div>
            <div v-else-if="synthesisError" class="gp2-lit-evidence-status gp2-lit-evidence-status-error">
                {{ synthesisError }}
            </div>
            <template v-else-if="knownFindings || knowledgeGaps">
                <section v-if="knownFindings" class="gp2-lit-evidence-section">
                    <h3>What the literature establishes</h3>
                    <p>{{ knownFindings }}</p>
                </section>
                <section v-if="knowledgeGaps" class="gp2-lit-evidence-section">
                    <h3>Knowledge gaps</h3>
                    <p>{{ knowledgeGaps }}</p>
                </section>
            </template>
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
};
</script>

<style scoped>
.gp2-lit-evidence {
    display: flex;
    flex-direction: column;
    gap: 14px;
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

.gp2-lit-evidence-paper-meta {
    margin-top: 2px;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-evidence-status {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-lit-evidence-status-error {
    color: #ee3124;
}

.gp2-lit-evidence-section h3 {
    margin: 0 0 4px;
    font-size: 13px;
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
</style>
