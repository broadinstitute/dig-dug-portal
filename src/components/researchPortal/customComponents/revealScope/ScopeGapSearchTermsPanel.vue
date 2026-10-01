<template>
    <div class="scp-gap-terms">
        <div class="scp-gap-terms-pipeline" aria-label="How search-term extraction works">
            <p class="scp-gap-terms-pipeline-title">How this works</p>
            <p class="scp-gap-terms-pipeline-note">
                A dedicated LLM pass extracts short DisMech retrieval phrases and places them into category groups.
                Gap hits for these terms appear on the <strong>Knowledge gaps</strong> tab.
            </p>
        </div>

        <div v-if="blockedReason" class="scp-gap-terms-callout" role="status">{{ blockedReason }}</div>

        <template v-else-if="groups && groups.length">
            <div class="scp-gap-terms-coverage">
                <strong>{{ totalTerms }}</strong> search term{{ totalTerms === 1 ? "" : "s" }} in
                <strong>{{ groups.length }}</strong> group{{ groups.length === 1 ? "" : "s" }}
            </div>

            <div class="scp-gap-terms-cards">
                <article v-for="group in groups" :key="group.id" class="scp-gap-terms-card">
                    <header class="scp-gap-terms-card-head">
                        <div>
                            <h3 class="scp-gap-terms-card-title">{{ group.label }}</h3>
                        </div>
                        <span class="scp-gap-terms-card-status">
                            {{ group.terms.length }} term{{ group.terms.length === 1 ? "" : "s" }}
                        </span>
                    </header>
                    <ul class="scp-gap-terms-list">
                        <li v-for="term in group.terms" :key="term" class="scp-gap-terms-item">
                            <span class="scp-gap-terms-chip">{{ term }}</span>
                        </li>
                    </ul>
                </article>
            </div>
        </template>

        <div v-else class="scp-gap-terms-callout" role="status">
            No search terms extracted yet.
        </div>
    </div>
</template>

<script>
export default {
    name: "ScopeGapSearchTermsPanel",
    props: {
        /** Non-empty groups: [{ id, label, description, terms: string[] }] */
        groups: {
            type: Array,
            default: null,
        },
        blockedReason: {
            type: String,
            default: null,
        },
    },
    computed: {
        totalTerms() {
            if (!Array.isArray(this.groups)) {
                return 0;
            }
            return this.groups.reduce(
                (sum, group) => sum + (Array.isArray(group.terms) ? group.terms.length : 0),
                0
            );
        },
    },
};
</script>

<style scoped>
.scp-gap-terms {
    padding: 18px;
    background-color: #ffffff;
    border-radius: 15px;
    border-top: solid 1px #dddddd;
}

.scp-gap-terms-pipeline {
    margin: 0 0 16px;
    padding: 12px 14px;
    background: #f7f8fa;
    border-radius: 8px;
    border: 1px solid #e8eaef;
}

.scp-gap-terms-pipeline-title {
    margin: 0 0 8px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #5a6070;
}

.scp-gap-terms-pipeline-note {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
    color: #2c3038;
}

.scp-gap-terms-callout {
    margin: 12px 0;
    padding: 12px 14px;
    background: #fff8f2;
    border: 1px solid #f0d4b8;
    border-radius: 8px;
    color: #5a4030;
    font-size: 0.9rem;
}

.scp-gap-terms-coverage {
    margin: 0 0 14px;
    font-size: 0.875rem;
    color: #4a5060;
}

.scp-gap-terms-cards {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.scp-gap-terms-card {
    border: 1px solid #e2e5eb;
    border-radius: 10px;
    background: rgb(246, 245, 242);
    padding: 14px 16px 12px;
}

.scp-gap-terms-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
}

.scp-gap-terms-card-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e222a;
}

.scp-gap-terms-card-status {
    flex-shrink: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: #5a6070;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.scp-gap-terms-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.scp-gap-terms-item {
    margin: 0;
}

.scp-gap-terms-chip {
    display: inline-block;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.85rem;
    padding: 6px 10px;
    border-radius: 8px;
    background: #fff;
    border: 1px solid #e2e5eb;
    color: #1e222a;
}
</style>
