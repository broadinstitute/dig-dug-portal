<template>
    <div class="gp2-gene-scores-drawer">
        <p class="vks-ui-intro">
            Choose which gene-score columns appear in the Gene scores section.
            Genes are grouped by locus for the current search region.
        </p>

        <div v-if="loading" class="vks-ui-status">Loading gene scores…</div>
        <div v-else-if="error" class="vks-ui-error" role="alert">{{ error }}</div>
        <template v-else>
            <section class="vks-ui-section">
                <p class="vks-ui-section-title">Score columns</p>
                <ul
                    class="gp2-gene-scores-check-list"
                    role="group"
                    aria-label="Gene score columns"
                >
                    <li
                        v-for="column in scoreColumns"
                        :key="column.field"
                        class="gp2-gene-scores-check-item"
                    >
                        <label class="gp2-gene-scores-check">
                            <input
                                type="checkbox"
                                :checked="isFieldVisible(column.field)"
                                @change="onToggleField(column.field, $event)"
                            />
                            <span>{{ column.label }}</span>
                        </label>
                    </li>
                </ul>
                <div class="vks-ui-btn-row">
                    <button
                        type="button"
                        class="vks-ui-btn vks-ui-btn--secondary"
                        @click="selectAll"
                    >
                        All columns
                    </button>
                    <button
                        type="button"
                        class="vks-ui-btn vks-ui-btn--secondary"
                        @click="selectNone"
                    >
                        None
                    </button>
                </div>
            </section>

            <p class="vks-ui-status">
                {{ locusCount.toLocaleString() }} locus{{
                    locusCount === 1 ? "" : "es"
                }}
                · {{ geneCount.toLocaleString() }} gene{{
                    geneCount === 1 ? "" : "s"
                }}
                · {{ visibleCount }} of {{ scoreColumns.length }} columns shown
            </p>
        </template>
    </div>
</template>

<script>
import { GP2_LOCUS_SUMMARY_EVIDENCE_ROWS } from "./gp2BrowserLocusSummaryApi.js";

export default {
    name: "GP2BrowserGeneScoresDrawer",
    props: {
        geneScoresState: {
            type: Object,
            default: () => ({
                loading: false,
                error: null,
                rows: [],
                visibleFields: [],
            }),
        },
    },
    computed: {
        loading() {
            return Boolean(this.geneScoresState?.loading);
        },
        error() {
            return this.geneScoresState?.error || null;
        },
        scoreColumns() {
            return GP2_LOCUS_SUMMARY_EVIDENCE_ROWS;
        },
        visibleFields() {
            return Array.isArray(this.geneScoresState?.visibleFields)
                ? this.geneScoresState.visibleFields
                : this.scoreColumns.map((column) => column.field);
        },
        visibleCount() {
            return this.visibleFields.length;
        },
        locusCount() {
            const ids = new Set();
            (this.geneScoresState?.rows || []).forEach((row) => {
                const id = String(row?.Locus_ID || "").trim();
                if (id) {
                    ids.add(id);
                }
            });
            return ids.size;
        },
        geneCount() {
            return (this.geneScoresState?.rows || []).length;
        },
    },
    methods: {
        isFieldVisible(field) {
            return this.visibleFields.includes(field);
        },
        emitVisibleFields(next) {
            this.$emit("update:visibleFields", next);
        },
        onToggleField(field, event) {
            const checked = Boolean(event?.target?.checked);
            const next = new Set(this.visibleFields);
            if (checked) {
                next.add(field);
            } else {
                next.delete(field);
            }
            // Preserve column order from the canonical evidence row list.
            this.emitVisibleFields(
                this.scoreColumns
                    .map((column) => column.field)
                    .filter((id) => next.has(id))
            );
        },
        selectAll() {
            this.emitVisibleFields(this.scoreColumns.map((column) => column.field));
        },
        selectNone() {
            this.emitVisibleFields([]);
        },
    },
};
</script>

<style scoped>
.gp2-gene-scores-drawer {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.gp2-gene-scores-check-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.gp2-gene-scores-check-item {
    margin: 0;
}

.gp2-gene-scores-check {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    line-height: 1.35;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
}

.gp2-gene-scores-check input {
    margin-top: 2px;
}
</style>
