<template>
    <div class="scp-gaps" :class="{ 'scp-gaps--compact': compact }">
        <div
            v-if="!compact"
            class="scp-gaps-pipeline"
            aria-label="How knowledge-gap search works"
        >
            <p class="scp-gaps-pipeline-title">How this search works</p>
            <ol class="scp-gaps-pipeline-steps">
                <li class="scp-gaps-pipeline-step">
                    <span class="scp-gaps-pipeline-num">1</span>
                    <span class="scp-gaps-pipeline-text"
                        ><strong>Search terms</strong> — see the categorized queries on the
                        <em>Search terms</em> tab</span
                    >
                </li>
                <li class="scp-gaps-pipeline-step">
                    <span class="scp-gaps-pipeline-num">2</span>
                    <span class="scp-gaps-pipeline-text"
                        ><strong>Gap search</strong> — fuzzy match each term against DisMech knowledge gaps via REVEAL
                        QA</span
                    >
                </li>
                <li class="scp-gaps-pipeline-step">
                    <span class="scp-gaps-pipeline-num">3</span>
                    <span class="scp-gaps-pipeline-text"
                        ><strong>Results</strong> — gaps listed under each term, grouped by category</span
                    >
                </li>
            </ol>
            <p class="scp-gaps-pipeline-note">
                Selecting a gap for further SCOPE work is not wired yet.
            </p>
        </div>

        <div v-if="blockedReason" class="scp-gaps-callout" role="status">{{ blockedReason }}</div>

        <template v-else-if="groupResults && groupResults.length">
            <div class="scp-gaps-coverage">
                Searched <strong>{{ totalTerms }}</strong> term{{ totalTerms === 1 ? "" : "s" }} across
                <strong>{{ groupResults.length }}</strong> group{{ groupResults.length === 1 ? "" : "s" }}
                <template v-if="totalHits != null">
                    · <strong>{{ totalHits }}</strong> gap{{ totalHits === 1 ? "" : "s" }} returned
                </template>
            </div>

            <div
                v-if="showCategoryTabs"
                class="scp-gaps-category-tabs"
                role="tablist"
                aria-label="Knowledge gap categories"
            >
                <button
                    v-for="group in groupResults"
                    :key="group.id"
                    type="button"
                    role="tab"
                    class="scp-gaps-category-tab"
                    :class="{ 'is-active': activeCategoryId === group.id }"
                    :aria-selected="activeCategoryId === group.id ? 'true' : 'false'"
                    @click="activeCategoryId = group.id"
                >
                    {{ group.label }}
                </button>
            </div>

            <div
                v-if="activeGroup"
                class="scp-gaps-panel"
                :class="{ 'has-tabs': showCategoryTabs }"
                role="tabpanel"
            >
                <div
                    v-for="termCard in activeGroup.termResults"
                    :key="`${activeGroup.id}:${termCard.term}`"
                    class="scp-gaps-term-block"
                >
                    <div class="scp-gaps-term-head">
                        <span class="scp-gaps-card-term">{{ termCard.term }}</span>
                        <span v-if="termCard.error" class="scp-gaps-card-status is-error">Error</span>
                    </div>

                    <p v-if="termCard.error" class="scp-gaps-card-error">{{ termCard.error }}</p>

                    <ul v-else-if="termCard.gaps && termCard.gaps.length" class="scp-gaps-list">
                        <li
                            v-for="(gap, index) in termCard.gaps"
                            :key="gap.id || `${activeGroup.id}:${termCard.term}:${index}`"
                            class="scp-gaps-item"
                        >
                            <p class="scp-gaps-item-text">{{ gap.text || "(no gap text)" }}</p>
                            <div
                                v-if="gap.scope || gap.diseaseLabel"
                                class="scp-gaps-scope-row"
                            >
                                <span class="scp-gaps-scope-bubble">
                                    {{ gap.scope || gap.diseaseLabel }}
                                </span>
                            </div>

                            <div
                                v-if="hasDescriptionBody(gap)"
                                class="scp-gaps-disclosure"
                            >
                                <button
                                    type="button"
                                    class="scp-gaps-disclosure-toggle"
                                    :aria-expanded="isOpen(sectionKey(activeGroup, termCard, gap, index, 'desc')) ? 'true' : 'false'"
                                    @click="toggleSection(sectionKey(activeGroup, termCard, gap, index, 'desc'))"
                                >
                                    <span
                                        class="scp-gaps-disclosure-tri"
                                        :class="{ 'is-open': isOpen(sectionKey(activeGroup, termCard, gap, index, 'desc')) }"
                                        aria-hidden="true"
                                    >▶</span>
                                    Description / rationale
                                </button>
                                <div
                                    v-show="isOpen(sectionKey(activeGroup, termCard, gap, index, 'desc'))"
                                    class="scp-gaps-disclosure-body"
                                >
                                    <p v-if="gap.description" class="scp-gaps-item-body">
                                        {{ gap.description }}
                                    </p>
                                    <p
                                        v-if="gap.rationale"
                                        class="scp-gaps-item-body"
                                        :class="{ 'is-spaced': Boolean(gap.description) }"
                                    >
                                        {{ gap.rationale }}
                                    </p>
                                    <p
                                        v-if="gap.attachmentLabels && gap.attachmentLabels.length"
                                        class="scp-gaps-item-atts"
                                    >
                                        Mechanisms: {{ gap.attachmentLabels.slice(0, 3).join(", ")
                                        }}<template v-if="gap.attachmentLabels.length > 3">…</template>
                                    </p>
                                </div>
                            </div>

                            <div
                                v-if="gap.evidence && gap.evidence.length"
                                class="scp-gaps-disclosure"
                            >
                                <button
                                    type="button"
                                    class="scp-gaps-disclosure-toggle"
                                    :aria-expanded="isOpen(sectionKey(activeGroup, termCard, gap, index, 'ev')) ? 'true' : 'false'"
                                    @click="toggleSection(sectionKey(activeGroup, termCard, gap, index, 'ev'))"
                                >
                                    <span
                                        class="scp-gaps-disclosure-tri"
                                        :class="{ 'is-open': isOpen(sectionKey(activeGroup, termCard, gap, index, 'ev')) }"
                                        aria-hidden="true"
                                    >▶</span>
                                    Supporting evidence
                                    <span class="scp-gaps-disclosure-count">
                                        ({{ gap.evidence.length }})
                                    </span>
                                </button>
                                <div
                                    v-show="isOpen(sectionKey(activeGroup, termCard, gap, index, 'ev'))"
                                    class="scp-gaps-disclosure-body"
                                >
                                    <ul class="scp-gaps-evidence-list">
                                        <li
                                            v-for="(ev, evIndex) in gap.evidence"
                                            :key="evIndex"
                                            class="scp-gaps-evidence-item"
                                        >
                                            <p v-if="ev.snippet" class="scp-gaps-item-body">
                                                “{{ ev.snippet }}”
                                            </p>
                                            <p v-if="ev.explanation" class="scp-gaps-evidence-meta">
                                                {{ ev.explanation }}
                                            </p>
                                            <p class="scp-gaps-evidence-meta">
                                                <template v-if="ev.reference">{{ ev.reference }}</template>
                                                <template v-if="ev.reference && ev.referenceTitle">
                                                    —
                                                </template>
                                                <template v-if="ev.referenceTitle">{{
                                                    ev.referenceTitle
                                                }}</template>
                                                <template v-if="ev.supports">
                                                    · {{ ev.supports }}
                                                </template>
                                            </p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </li>
                    </ul>

                    <p v-else class="scp-gaps-card-empty">No knowledge gaps matched this term.</p>
                </div>
            </div>
        </template>

        <div v-else class="scp-gaps-callout" role="status">
            No knowledge-gap search results yet.
        </div>
    </div>
</template>

<script>
export default {
    name: "ScopeKnowledgeGapsPanel",
    props: {
        /** Grouped search results: [{ id, label, description, termResults: [{ term, gaps, error }] }] */
        groupResults: {
            type: Array,
            default: null,
        },
        blockedReason: {
            type: String,
            default: null,
        },
        /** When true, hide the how-this-works pipeline (e.g. embedded under CFDE KG). */
        compact: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            openSections: {},
            activeCategoryId: null,
        };
    },
    watch: {
        groupResults: {
            immediate: true,
            handler(groups) {
                this.openSections = {};
                if (!Array.isArray(groups) || !groups.length) {
                    this.activeCategoryId = null;
                    return;
                }
                const stillValid = groups.some((g) => g && g.id === this.activeCategoryId);
                if (!stillValid) {
                    this.activeCategoryId = groups[0].id;
                }
            },
        },
    },
    computed: {
        showCategoryTabs() {
            return Array.isArray(this.groupResults) && this.groupResults.length > 1;
        },
        activeGroup() {
            if (!Array.isArray(this.groupResults) || !this.groupResults.length) {
                return null;
            }
            const match = this.groupResults.find((g) => g && g.id === this.activeCategoryId);
            return match || this.groupResults[0];
        },
        totalTerms() {
            if (!Array.isArray(this.groupResults)) {
                return 0;
            }
            return this.groupResults.reduce(
                (sum, group) => sum + (Array.isArray(group.termResults) ? group.termResults.length : 0),
                0
            );
        },
        totalHits() {
            if (!Array.isArray(this.groupResults)) {
                return null;
            }
            return this.groupResults.reduce((sum, group) => {
                if (!Array.isArray(group.termResults)) {
                    return sum;
                }
                return (
                    sum +
                    group.termResults.reduce((inner, card) => {
                        if (card.error || !Array.isArray(card.gaps)) {
                            return inner;
                        }
                        return inner + card.gaps.length;
                    }, 0)
                );
            }, 0);
        },
    },
    methods: {
        hasDescriptionBody(gap) {
            return Boolean(
                (gap && gap.description) ||
                    (gap && gap.rationale) ||
                    (gap && gap.attachmentLabels && gap.attachmentLabels.length)
            );
        },
        sectionKey(group, termCard, gap, index, kind) {
            const id = (gap && gap.id) || `${group.id}:${termCard.term}:${index}`;
            return `${id}:${kind}`;
        },
        isOpen(key) {
            return Boolean(this.openSections[key]);
        },
        toggleSection(key) {
            this.$set(this.openSections, key, !this.openSections[key]);
        },
    },
};
</script>

<style scoped>
.scp-gaps {
    padding: 18px;
    background-color: #ffffff;
    border-radius: 15px;
    border-top: solid 1px #dddddd;
}

.scp-gaps.scp-gaps--compact,
.scp-gaps--compact {
    padding: 0;
    background: transparent;
    border-radius: 0;
    border-top: none;
}

.scp-gaps-pipeline {
    margin: 0 0 16px;
    padding: 12px 14px;
    background: #f7f8fa;
    border-radius: 8px;
    border: 1px solid #e8eaef;
}

.scp-gaps-pipeline-title {
    margin: 0 0 8px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #5a6070;
}

.scp-gaps-pipeline-steps {
    margin: 0;
    padding: 0;
    list-style: none;
}

.scp-gaps-pipeline-step {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 0 0 6px;
    font-size: 0.875rem;
    line-height: 1.4;
    color: #2c3038;
}

.scp-gaps-pipeline-num {
    flex: 0 0 1.4rem;
    width: 1.4rem;
    height: 1.4rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #e07b39;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
}

.scp-gaps-pipeline-note {
    margin: 8px 0 0;
    font-size: 0.8rem;
    color: #6a7080;
}

.scp-gaps-callout {
    margin: 12px 0;
    padding: 12px 14px;
    background: #fff8f2;
    border: 1px solid #f0d4b8;
    border-radius: 8px;
    color: #5a4030;
    font-size: 0.9rem;
}

.scp-gaps-coverage {
    margin: 0 0 14px;
    font-size: 0.875rem;
    color: #4a5060;
}

.scp-gaps-category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 0 0 -1px;
}

.scp-gaps-category-tab {
    margin: 0;
    border: 1px solid #e2e5eb;
    border-radius: 6px 6px 0 0;
    background: #f7f8fa;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: #4a5060;
}

.scp-gaps-category-tab.is-active {
    background: #ffffff;
    border-bottom-color: #ffffff;
    color: #e07b39;
}

.scp-gaps-panel {
    border: 1px solid #e2e5eb;
    border-radius: 10px;
    background: #fff;
    padding: 14px 16px 12px;
}

.scp-gaps-panel.has-tabs {
    border-radius: 0 10px 10px 10px;
}

.scp-gaps-card-term {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e222a;
}

.scp-gaps-card-status {
    flex-shrink: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: #5a6070;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.scp-gaps-card-status.is-error {
    color: #b33a2b;
}

.scp-gaps-term-block {
    padding: 12px 0;
    border-top: 1px solid #eef0f4;
}

.scp-gaps-term-block:first-of-type {
    border-top: none;
    padding-top: 0;
}

.scp-gaps-term-head {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 25px;
    border-bottom: solid 0.5px #dddddd;
}

.scp-gaps-card-error,
.scp-gaps-card-empty {
    margin: 0;
    font-size: 0.875rem;
    color: #6a7080;
}

.scp-gaps-card-error {
    color: #b33a2b;
}

.scp-gaps-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.scp-gaps-item {
    padding: 12px 0;
    border-top: 1px solid #eef0f4;
}

.scp-gaps-item:first-child {
    border-top: none;
    padding-top: 0;
}

.scp-gaps-item-text {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.45;
    color: #1e222a;
}

.scp-gaps-scope-row {
    margin: 0 0 8px;
}

.scp-gaps-scope-bubble {
    display: inline-block;
    max-width: 100%;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(224, 123, 57, 0.12);
    border: 1px solid rgba(224, 123, 57, 0.35);
    color: #c45f1f;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.3;
}

.scp-gaps-disclosure {
    margin-top: 4px;
}

.scp-gaps-disclosure-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 4px 0;
    border: none;
    background: transparent;
    color: #3a4050;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    cursor: pointer;
}

.scp-gaps-disclosure-toggle:hover {
    color: #e07b39;
}

.scp-gaps-disclosure-tri {
    display: inline-block;
    font-size: 10px;
    line-height: 1;
    transition: transform 0.15s ease;
    color: #6a7080;
}

.scp-gaps-disclosure-tri.is-open {
    transform: rotate(90deg);
}

.scp-gaps-disclosure-count {
    font-weight: 500;
    color: #6a7080;
}

.scp-gaps-disclosure-body {
    margin: 4px 0 8px 16px;
}

.scp-gaps-item-body {
    margin: 0;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.45;
    color: #5a6070;
    white-space: pre-wrap;
}

.scp-gaps-item-body.is-spaced {
    margin-top: 10px;
}

.scp-gaps-item-atts {
    margin: 8px 0 0;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.4;
    color: #5a6070;
}

.scp-gaps-evidence-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.scp-gaps-evidence-item {
    padding: 8px 0;
    border-top: 1px solid #eef0f4;
}

.scp-gaps-evidence-item:first-child {
    border-top: none;
    padding-top: 0;
}

.scp-gaps-evidence-meta {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.35;
    color: #6a7080;
}
</style>
