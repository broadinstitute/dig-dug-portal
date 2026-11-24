<template>
    <div class="gp2-gene-scores">
        <p v-if="!displayLoci.length" class="gp2-gene-scores-meta">
            No gene scores in this search region.
        </p>

        <div
            v-if="displayLoci.length && visibleEvidenceRows.length"
            class="gp2-gene-scores-board"
        >
            <!-- Locus titles sit above the aligned label/matrix grid. -->
            <div class="gp2-gene-scores-locus-titles">
                <div class="gp2-gene-scores-locus-titles-spacer" aria-hidden="true"></div>
                <div class="gp2-gene-scores-locus-titles-row">
                    <header
                        v-for="locus in displayLoci"
                        :key="`title-${locus.locusId}`"
                        class="gp2-gene-scores-locus-head"
                        :style="{ minWidth: locusMinWidth(locus) + 'px' }"
                    >
                        <h3>
                            Locus
                            {{
                                locus.locusNumber != null
                                    ? locus.locusNumber
                                    : ""
                            }}
                        </h3>
                        <span>{{ locus.regionLabel }}</span>
                    </header>
                </div>
            </div>

            <div class="gp2-gene-scores-aligned">
                <div class="gp2-gene-scores-row-labels" aria-hidden="true">
                    <div class="gp2-gene-scores-gene-head-spacer">Genes</div>
                    <div
                        v-for="evidence in visibleEvidenceRows"
                        :key="`label-${evidence.field}`"
                        class="gp2-gene-scores-row-label"
                    >
                        {{ evidence.label }}
                    </div>
                </div>

                <div class="gp2-gene-scores-loci">
                    <section
                        v-for="locus in displayLoci"
                        :key="locus.locusId"
                        class="gp2-gene-scores-locus"
                        :style="{ minWidth: locusMinWidth(locus) + 'px' }"
                    >
                        <div
                            class="gp2-gene-scores-matrix"
                            :style="{
                                gridTemplateColumns: `repeat(${Math.max(
                                    locus.genes.length,
                                    1
                                )}, minmax(72px, 1fr))`,
                                gridTemplateRows: matrixRowTemplate,
                            }"
                        >
                            <button
                                v-for="gene in locus.genes"
                                :key="`gh-${locus.locusId}-${gene.symbol}`"
                                type="button"
                                class="gp2-gene-scores-gene-col-head"
                                :class="{
                                    'is-clickable': canHighlightGene(gene),
                                    'is-highlighted': isGeneHighlighted(gene),
                                }"
                                :disabled="!canHighlightGene(gene)"
                                :title="geneHighlightTitle(gene)"
                                @click="onGeneClick(gene)"
                            >
                                {{ gene.symbol
                                }}{{ gene.trackGene ? "" : "*" }}
                            </button>
                            <div
                                v-for="cell in matrixCells(locus)"
                                :key="cell.key"
                                class="gp2-gene-scores-cell"
                            >
                                <span
                                    class="gp2-gene-scores-pill"
                                    :class="
                                        pillClass(cell.evidence, cell.scoreRow)
                                    "
                                    :style="
                                        pillStyle(cell.evidence, cell.scoreRow)
                                    "
                                >
                                    {{
                                        cellDisplay(
                                            cell.evidence,
                                            cell.scoreRow
                                        )
                                    }}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>

        <p
            v-else-if="displayLoci.length && !visibleEvidenceRows.length"
            class="gp2-gene-scores-footnote"
        >
            Turn on at least one score column in the Gene scores drawer.
        </p>

        <p v-if="hasUnmappedGenes" class="gp2-gene-scores-footnote">
            * Gene symbol has no match in the loaded gene track for this region.
        </p>
    </div>
</template>

<script>
import {
    locusSummaryCategoryColor,
    locusSummaryEvidenceCell,
    locusSummaryNormColor,
} from "./gp2BrowserLocusSummaryApi.js";

const COL_W = 88;
const GENE_HEAD_H = 28;
const ROW_H = 36;

export default {
    name: "GP2BrowserGeneScoresPanel",
    props: {
        model: {
            type: Object,
            required: true,
        },
        /** Evidence field ids currently shown (drawer toggles). */
        visibleFields: {
            type: Array,
            default: null,
        },
        /** Active gene-region highlights from plot markers. */
        geneRegionMarkers: {
            type: Array,
            default: () => [],
        },
    },
    computed: {
        displayLoci() {
            return this.model?.loci || [];
        },
        visibleEvidenceRows() {
            const rows = this.model?.evidenceRows || [];
            if (!Array.isArray(this.visibleFields)) {
                return rows;
            }
            const allowed = new Set(this.visibleFields);
            return rows.filter((row) => allowed.has(row.field));
        },
        matrixRowTemplate() {
            const evidenceRows = this.visibleEvidenceRows.length;
            return `${GENE_HEAD_H}px repeat(${evidenceRows}, ${ROW_H}px)`;
        },
        hasUnmappedGenes() {
            return this.displayLoci.some((locus) =>
                locus.genes.some((gene) => !gene.trackGene)
            );
        },
        highlightedGeneNames() {
            return new Set(
                (this.geneRegionMarkers || [])
                    .map((marker) =>
                        String(
                            marker?.geneName ||
                                marker?.gene_name ||
                                marker?.symbol ||
                                ""
                        )
                            .trim()
                            .toUpperCase()
                    )
                    .filter(Boolean)
            );
        },
    },
    methods: {
        locusMinWidth(locus) {
            return Math.max(220, (locus.genes?.length || 1) * COL_W);
        },
        canHighlightGene(gene) {
            return (
                Boolean(gene?.symbol) &&
                Number.isFinite(Number(gene?.start)) &&
                Number.isFinite(Number(gene?.end)) &&
                Number(gene.start) !== Number(gene.end)
            );
        },
        isGeneHighlighted(gene) {
            const key = String(gene?.symbol || "")
                .trim()
                .toUpperCase();
            return Boolean(key) && this.highlightedGeneNames.has(key);
        },
        geneHighlightTitle(gene) {
            if (!this.canHighlightGene(gene)) {
                return `${gene.symbol} (no gene-track match)`;
            }
            return this.isGeneHighlighted(gene)
                ? `Clear highlight for ${gene.symbol}`
                : `Highlight ${gene.symbol} on genes track and plots`;
        },
        onGeneClick(gene) {
            if (!this.canHighlightGene(gene)) {
                return;
            }
            this.$emit("toggle-gene-region", {
                geneName: gene.symbol,
                start: Number(gene.start),
                end: Number(gene.end),
            });
        },
        matrixCells(locus) {
            const cells = [];
            this.visibleEvidenceRows.forEach((evidence) => {
                (locus.genes || []).forEach((gene) => {
                    cells.push({
                        key: `${locus.locusId}-${evidence.field}-${gene.symbol}`,
                        evidence,
                        scoreRow: gene.scoreRow,
                    });
                });
            });
            return cells;
        },
        cellDisplay(evidence, scoreRow) {
            return locusSummaryEvidenceCell(scoreRow, evidence).display;
        },
        pillClass(evidence, scoreRow) {
            const cell = locusSummaryEvidenceCell(scoreRow, evidence);
            if (cell.display === "—") {
                return "is-empty";
            }
            if (cell.kind === "category") {
                return "is-category";
            }
            return "";
        },
        pillStyle(evidence, scoreRow) {
            const cell = locusSummaryEvidenceCell(scoreRow, evidence);
            if (cell.display === "—") {
                return {};
            }
            if (cell.kind === "category") {
                return {
                    background: locusSummaryCategoryColor(cell.value),
                    color: "#fff",
                };
            }
            if (cell.kind === "norm") {
                const bg = locusSummaryNormColor(cell.value);
                return {
                    background: bg,
                    color: Number(cell.value) >= 0.55 ? "#fff" : "#1f3d2a",
                };
            }
            if (cell.kind === "score") {
                return {
                    background: locusSummaryNormColor(
                        Math.min(1, Number(cell.value) / 5)
                    ),
                    color: "#1f3d2a",
                };
            }
            return {};
        },
    },
};
</script>

<style scoped>
.gp2-gene-scores {
    --gs-label-w: 150px;
    --gs-gene-h: 28px;
    --gs-row-h: 36px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}

.gp2-gene-scores-meta {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.gp2-gene-scores-board {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
    overflow-x: auto;
    padding-bottom: 6px;
}

.gp2-gene-scores-locus-titles {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    min-width: max-content;
}

.gp2-gene-scores-locus-titles-spacer {
    flex: 0 0 var(--gs-label-w);
}

.gp2-gene-scores-locus-titles-row {
    display: flex;
    align-items: flex-end;
    gap: 14px;
}

.gp2-gene-scores-aligned {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: max-content;
}

.gp2-gene-scores-row-labels {
    flex: 0 0 var(--gs-label-w);
    display: flex;
    flex-direction: column;
    position: sticky;
    left: 0;
    z-index: 2;
    background: #fff;
}

.gp2-gene-scores-gene-head-spacer {
    box-sizing: border-box;
    display: flex;
    align-items: flex-end;
    height: var(--gs-gene-h);
    padding: 0 8px 4px 0;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--cfde-blue, #2c5c97);
}

.gp2-gene-scores-row-label {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    height: var(--gs-row-h);
    padding: 0 8px 0 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--cfde-muted, #6b6b6b);
    border-bottom: 1px solid #f0eee8;
}

.gp2-gene-scores-loci {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    flex: 1 1 auto;
}

.gp2-gene-scores-locus {
    flex: 0 0 auto;
    border: none;
    background: #fff;
    padding: 0 8px;
}

.gp2-gene-scores-locus-head {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    padding: 0 4px 8px;
}

.gp2-gene-scores-locus-head h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--cfde-ink, #33363d);
}

.gp2-gene-scores-locus-head span {
    font-size: 11px;
    line-height: 1.2;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-gene-scores-matrix {
    display: grid;
    column-gap: 6px;
    row-gap: 0;
}

.gp2-gene-scores-gene-col-head {
    box-sizing: border-box;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    height: var(--gs-gene-h);
    margin: 0;
    padding: 0 0 4px;
    border: 0;
    background: transparent;
    text-align: center;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--cfde-blue, #2c5c97);
}

.gp2-gene-scores-gene-col-head.is-clickable {
    cursor: pointer;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
}

.gp2-gene-scores-gene-col-head.is-clickable:hover {
    color: var(--cfde-ink, #1b365d);
}

.gp2-gene-scores-gene-col-head.is-highlighted {
    color: #d32f2f;
}

.gp2-gene-scores-gene-col-head:disabled {
    cursor: default;
    opacity: 0.72;
    text-decoration: none;
}

.gp2-gene-scores-cell {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--gs-row-h);
    border-bottom: 1px solid #f0eee8;
}

.gp2-gene-scores-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 52px;
    max-width: 100%;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
    background: #eef2f0;
    color: #1f3d2a;
    text-align: center;
}

.gp2-gene-scores-pill.is-empty {
    background: transparent;
    color: #9aa3ad;
    font-weight: 600;
}

.gp2-gene-scores-pill.is-category {
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.gp2-gene-scores-footnote {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
