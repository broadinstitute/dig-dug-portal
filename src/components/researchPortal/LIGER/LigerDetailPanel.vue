<script>
import Vue from "vue";

// The state / program metadata body, shared by the slide-out drawer and the
// in-card detail pane in the cell state and gene program sections. It is a
// component rather than duplicated markup because the two renderings must not
// drift: this is the same content, in two places, at the same time.
//
// It renders content only. The header (title, badges, close) belongs to whoever
// is hosting it, since a drawer header and an in-card pane header are not the
// same thing.
export default Vue.component("LigerDetailPanel", {
    props: {
        content: {
            type: Object,
            default: null
        },
        loading: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            // "See N more" state is per-rendering, not per-record, so it lives
            // here and resets whenever the record changes.
            showAllQcBadges: false,
            showAllGeneSets: false,
        };
    },

    computed: {
        aiSuggestedLabelTooltip() {
            return "AI was used to generate this program label. See rationale for more detail.";
        }
    },

    watch: {
        content() {
            this.showAllQcBadges = false;
            this.showAllGeneSets = false;
        }
    },

    methods: {
        formatMetric(value) {
            if (!Number.isFinite(value)) {
                return "0.00";
            }

            return value.toFixed(2);
        },
        formatPValue(value) {
            if (!Number.isFinite(value)) {
                return "";
            }

            if (value === 0) {
                return "0";
            }

            if (Math.abs(value) < 0.001) {
                return value.toExponential(2);
            }

            return value.toFixed(3);
        },
        // Collapse to the first two clean QC results: a wall of green badges
        // says nothing the first two do not.
        collapsedProgramQcBadgeCount(badges = []) {
            let goodCount = 0;

            for (let i = 0; i < badges.length; i++) {
                if (badges[i] && badges[i].tone === "good") {
                    goodCount += 1;

                    if (goodCount === 2) {
                        return i + 1;
                    }
                }
            }

            return badges.length;
        },
        visibleProgramQcBadges(badges = []) {
            if (this.showAllQcBadges) {
                return badges;
            }

            return badges.slice(0, this.collapsedProgramQcBadgeCount(badges));
        },
        hiddenProgramQcBadgeCount(badges = []) {
            return Math.max(0, badges.length - this.visibleProgramQcBadges(badges).length);
        },
        visibleProgramGeneSetRows(rows = []) {
            if (this.showAllGeneSets) {
                return rows;
            }

            return rows.slice(0, 25);
        },
        hiddenProgramGeneSetRowCount(rows = []) {
            return Math.max(0, rows.length - this.visibleProgramGeneSetRows(rows).length);
        }
    }
});
</script>

<template>
    <div class="liger-detail-panel">
        <div v-if="loading" class="empty-state">Loading details...</div>

        <template v-else-if="content && content.type === 'state'">
            <div class="drawer-panel">
                <h3>What this state represents</h3>
                <p>{{ content.summaryDescription }}</p>
                <dl class="drawer-field-grid">
                    <template v-for="field in content.summaryFields">
                        <dt :key="`${field.label}-dt`">{{ field.label }}</dt>
                        <dd :key="`${field.label}-dd`">{{ field.value }}</dd>
                    </template>
                </dl>
            </div>

            <div class="drawer-panel">
                <h3>What this means for your gene</h3>
                <dl v-if="content.interpretationRows.length" class="drawer-field-grid">
                    <template v-for="field in content.interpretationRows">
                        <dt :key="`${field.label}-dt`">{{ field.label }}</dt>
                        <dd :key="`${field.label}-dd`">{{ field.value }}</dd>
                    </template>
                </dl>
                <div v-else class="empty-state">No interpretation metadata available.</div>
            </div>

            <div class="drawer-panel">
                <h3>Marker genes</h3>
                <div v-if="content.markerDetail.markers.length" class="drawer-marker-list">
                    <span
                        v-for="gene in content.markerDetail.markers"
                        :key="gene"
                        class="drawer-marker"
                    >
                        {{ gene }}
                    </span>
                </div>
                <div v-else class="empty-state">No marker genes returned.</div>
                <details v-if="content.markerDetail.provenance.length" class="drawer-details">
                    <summary>Show marker provenance</summary>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Gene</th>
                                    <th>Role</th>
                                    <th>Evidence</th>
                                    <th>Marker notes</th>
                                    <th>Source type</th>
                                    <th>Citations</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in content.markerDetail.provenance" :key="`${row.gene}-${row.role}`">
                                    <td>{{ row.gene }}</td>
                                    <td>{{ row.role }}</td>
                                    <td>{{ row.evidence }}</td>
                                    <td>{{ row.notes }}</td>
                                    <td>{{ row.sourceType }}</td>
                                    <td>{{ row.citations }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </details>
            </div>

            <div class="drawer-panel">
                <h3>Curation and references</h3>
                <dl v-if="content.referenceDetail.curationRows.length" class="drawer-field-grid">
                    <template v-for="field in content.referenceDetail.curationRows">
                        <dt :key="`${field.label}-dt`">{{ field.label }}</dt>
                        <dd :key="`${field.label}-dd`">{{ field.value }}</dd>
                    </template>
                </dl>
                <ul v-if="content.referenceDetail.references.length" class="drawer-reference-list">
                    <li v-for="reference in content.referenceDetail.references" :key="reference.label">
                        <a v-if="reference.url" :href="reference.url" target="_blank" rel="noreferrer">{{ reference.label }}</a>
                        <span v-else>{{ reference.label }}</span>
                        <span v-if="reference.suffix" class="drawer-reference-suffix">({{ reference.suffix }})</span>
                    </li>
                </ul>
                <div v-else class="empty-state">No state-level citations available.</div>
            </div>

            <div v-if="content.relatedPrograms.length" class="drawer-panel">
                <h3>Related programs with GSEA P &lt; 0.05</h3>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Program</th>
                                <th>GSEA P</th>
                                <th>GSEA Q</th>
                                <th>Cell coactivity</th>
                                <th>Match score</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="row in content.relatedPrograms"
                                :key="row.programId"
                                class="clickable-cell"
                                @click="$emit('open-program', row.programId, row.row)"
                            >
                                <td>{{ row.programLabel }}</td>
                                <td>{{ formatPValue(row.gseaP) }}</td>
                                <td>{{ formatPValue(row.gseaQ) }}</td>
                                <td>{{ formatMetric(row.coactivity) }}</td>
                                <td>{{ formatMetric(row.matchScore) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="drawer-panel">
                <h3>Human genetic trait anchors</h3>
                <div v-if="content.traitRows.length" class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Trait</th>
                                <th>Joint beta</th>
                                <th>Marginal beta</th>
                                <th>Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in content.traitRows" :key="row.trait">
                                <td>{{ row.trait }}</td>
                                <td>{{ formatMetric(row.beta) }}</td>
                                <td>{{ formatMetric(row.betaUncorrected) }}</td>
                                <td>{{ row.method }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="empty-state">No state-level PIGEAN rows returned for this state in the current API.</div>
            </div>
        </template>

        <template v-else-if="content && content.type === 'program'">
            <div class="drawer-panel">
                <h3>Program summary</h3>
                <p>{{ content.summaryText }}</p>
                <dl class="drawer-field-grid">
                    <template v-for="field in content.summaryFields">
                        <dt :key="`${field.label}-dt`">
                            <span v-if="field.label === 'Suggested label'" class="drawer-inline-value">
                                <span>{{ field.label }}</span>
                                <span class="drawer-ai-tooltip">
                                    <span class="drawer-ai-pill">AI</span>
                                    <span class="drawer-ai-tooltip-bubble">{{ aiSuggestedLabelTooltip }}</span>
                                </span>
                            </span>
                            <span v-else>{{ field.label }}</span>
                        </dt>
                        <dd :key="`${field.label}-dd`">
                            <span>{{ field.value }}</span>
                        </dd>
                    </template>
                </dl>
                <div class="drawer-badge-row drawer-qc-row">
                    <span
                        v-for="badge in visibleProgramQcBadges(content.qcBadges)"
                        :key="badge.text"
                        class="drawer-qc-tooltip"
                    >
                        <span
                            class="drawer-badge"
                            :class="badge.tone"
                        >
                            {{ badge.text }}
                        </span>
                        <span v-if="badge.tooltip" class="drawer-qc-tooltip-bubble">
                            <strong>{{ badge.tooltip.displayName }}</strong>
                            <span><strong>Category:</strong> {{ badge.tooltip.category }}</span>
                            <span><strong>Marker genes:</strong> {{ badge.tooltip.markerGenes.join(', ') }}</span>
                        </span>
                    </span>
                </div>
                <button
                    v-if="hiddenProgramQcBadgeCount(content.qcBadges) > 0 && !showAllProgramQcBadges"
                    class="drawer-link-button"
                    @click="showAllProgramQcBadges = true"
                >
                    See {{ hiddenProgramQcBadgeCount(content.qcBadges) }} more
                </button>
                <div class="drawer-mini">QC bubble colors: green = QC GSEA P &gt;= 0.05, yellow = QC GSEA P &lt; 0.05, red = QC GSEA q &lt; 0.05</div>
            </div>

            <div class="drawer-panel">
                <h3>Best curated state matches</h3>
                <div v-if="content.curatedMatches.length" class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>State</th>
                                <th>GSEA P</th>
                                <th>GSEA q</th>
                                <th>-log10(q)</th>
                                <th>Correlation</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="row in content.curatedMatches"
                                :key="`${row.stateId}-${row.programId || ''}`"
                                class="clickable-cell"
                                @click="$emit('open-state', row.stateId, row.row)"
                            >
                                <td>{{ row.stateLabel }}</td>
                                <td>{{ formatPValue(row.gseaP) }}</td>
                                <td>{{ formatPValue(row.gseaQ) }}</td>
                                <td>{{ formatMetric(row.negLogQ) }}</td>
                                <td>{{ formatMetric(row.correlation) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="empty-state">No curated state matches with GSEA P &lt; 0.05.</div>
            </div>

            <div class="drawer-panel">
                <h3>Top gene loadings</h3>
                <div v-if="content.topGenes.rows.length" class="table-wrap">
                    <table v-if="content.topGenes.mode === 'loading'">
                        <thead>
                            <tr>
                                <th>Gene</th>
                                <th>Loading</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in content.topGenes.rows" :key="row.gene">
                                <td>{{ row.gene }}</td>
                                <td>{{ formatMetric(row.loading) }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <table v-else>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Gene</th>
                                <th>Rank score</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in content.topGenes.rows" :key="`${row.gene}-${row.rank}`">
                                <td>{{ row.rank }}</td>
                                <td>{{ row.gene }}</td>
                                <td>{{ row.rankScore }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="empty-state">No positive program gene loadings returned.</div>
            </div>

            <div class="drawer-panel">
                <h3>Top anchor traits</h3>
                <div v-if="content.traitRows.length" class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Trait</th>
                                <th>Joint beta</th>
                                <th>Marginal beta</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in content.traitRows" :key="row.trait">
                                <td>{{ row.trait }}</td>
                                <td>{{ formatMetric(row.beta) }}</td>
                                <td>{{ formatMetric(row.betaUncorrected) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="empty-state">No program trait anchors returned.</div>
            </div>

            <div class="drawer-panel">
                <h3>Gene set associations</h3>
                <template v-if="content.geneSetRows.length">
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Gene set</th>
                                    <th>Joint beta</th>
                                    <th>Marginal beta</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in visibleProgramGeneSetRows(content.geneSetRows)" :key="row.geneSet">
                                    <td>{{ row.geneSet }}</td>
                                    <td>{{ formatMetric(row.beta) }}</td>
                                    <td>{{ formatMetric(row.betaUncorrected) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <button
                        v-if="hiddenProgramGeneSetRowCount(content.geneSetRows) > 0 && !showAllProgramGeneSets"
                        class="drawer-link-button"
                        @click="showAllProgramGeneSets = true"
                    >
                        See {{ hiddenProgramGeneSetRowCount(content.geneSetRows) }} more
                    </button>
                </template>
                <div v-else class="empty-state">No program gene set associations returned.</div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.liger-detail-panel{
    display: flex;
    flex-direction: column;
    gap: 16px;
    font-family: Open Sans, sans-serif;
    font-size: 14px;
}
.liger-detail-panel h1,
.liger-detail-panel h2,
.liger-detail-panel h3,
.liger-detail-panel h4,
.liger-detail-panel h5,
.liger-detail-panel h6{
    margin-bottom: 0px !important;
}
.empty-state{
    padding: 5px 10px;
    font-size: 13px;
    color: #4e4e4e;
}
.drawer-panel{
    border: 1px solid #edf0f7;
    border-radius: 12px;
    padding: 16px;
    background: #fff;
}
.drawer-panel h3{
    margin-bottom: 10px !important;
}
.drawer-field-grid{
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    gap: 10px 14px;
    margin: 0;
}
.drawer-field-grid dt{
    font-weight: 700;
    color: #1f2937;
}
.drawer-field-grid dd{
    margin: 0;
    color: #374151;
}
.drawer-inline-value{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.drawer-ai-tooltip{
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: help;
}
.drawer-ai-pill{
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    background: #e8f1fb;
    color: #175cd3;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .02em;
}
.drawer-ai-tooltip-bubble{
    position: absolute;
    left: 50%;
    bottom: calc(100% + 10px);
    width: 280px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #16324f;
    color: white;
    text-align: left;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.45;
    box-shadow: 0 10px 24px rgba(0, 0, 0, .18);
    opacity: 0;
    visibility: hidden;
    transform: translate(-50%, 4px);
    transition: opacity .14s ease, transform .14s ease, visibility .14s ease;
    pointer-events: none;
    z-index: 20;
}
.drawer-ai-tooltip-bubble::after{
    content: "";
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: #16324f transparent transparent transparent;
}
.drawer-ai-tooltip:hover .drawer-ai-tooltip-bubble,
.drawer-ai-tooltip:focus-within .drawer-ai-tooltip-bubble{
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, 0);
}
.drawer-badge-row{
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}
.drawer-badge{
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
}
.drawer-badge.good{
    background: #e7f7ed;
    color: #0f7b39;
}
.drawer-badge.warn{
    background: #fff4d6;
    color: #9a6700;
}
.drawer-badge.bad{
    background: #fde7e9;
    color: #b42318;
}
.drawer-badge.blue{
    background: #e8f1fb;
    color: #175cd3;
}
.drawer-qc-tooltip{
    position: relative;
    display: inline-flex;
}
.drawer-qc-tooltip-bubble{
    position: absolute;
    left: 50%;
    bottom: calc(100% + 10px);
    width: 320px;
    max-width: min(320px, calc(100vw - 32px));
    padding: 10px 12px;
    border-radius: 10px;
    background: #16324f;
    color: white;
    text-align: left;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.45;
    box-shadow: 0 10px 24px rgba(0, 0, 0, .18);
    opacity: 0;
    visibility: hidden;
    transform: translate(-50%, 4px);
    transition: opacity .14s ease, transform .14s ease, visibility .14s ease;
    pointer-events: none;
    z-index: 20;
}
.drawer-qc-tooltip-bubble::after{
    content: "";
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: #16324f transparent transparent transparent;
}
.drawer-qc-tooltip-bubble strong{
    display: block;
}
.drawer-qc-tooltip-bubble span{
    display: block;
    margin-top: 4px;
}
.drawer-qc-tooltip:hover .drawer-qc-tooltip-bubble,
.drawer-qc-tooltip:focus-within .drawer-qc-tooltip-bubble{
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, 0);
}
.drawer-link-button{
    margin-top: 10px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #175cd3;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
}
.drawer-link-button:hover{
    text-decoration: underline;
}
.drawer-marker-list{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.drawer-marker{
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #1f2937;
    font-size: 12px;
    font-weight: 700;
}
.drawer-reference-list{
    margin: 0;
    padding-left: 18px;
}
.drawer-reference-suffix{
    color: #6b7280;
    font-size: 12px;
}
.drawer-details{
    margin-top: 12px;
}
.drawer-mini{
    margin-top: 10px;
    font-size: 12px;
    color: #4e4e4e;
}
.drawer-qc-row{
    margin-top: 12px;
}
.table-wrap{
    overflow-x: auto;
}
.table-wrap table {
    width: 100%;
}
.table-wrap table tr th {
    white-space: nowrap;
}
.table-wrap table tr th, .table-wrap table tr td {
    padding: 0 5px;
}
.table-wrap table tr td:first-child {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.clickable-cell{
    cursor: pointer;
}
.clickable-cell:hover {
    background: #ddd;
}
@media (max-width: 900px) {
    .drawer-field-grid{
        grid-template-columns: 1fr;
    }
}
</style>
