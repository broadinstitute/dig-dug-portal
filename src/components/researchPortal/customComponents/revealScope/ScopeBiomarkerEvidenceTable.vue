<template>
    <div class="scp-bm">
        <div class="scp-bm-pipeline" aria-label="How mechanism-linked biomarker discovery works">
            <p class="scp-bm-pipeline-title">How this search works</p>
            <ol class="scp-bm-pipeline-steps">
                <li class="scp-bm-pipeline-step">
                    <span class="scp-bm-pipeline-num">1</span>
                    <span class="scp-bm-pipeline-text"
                        ><strong>Mechanism</strong> — resolve CFDE KG Factor(s) for the hypothesis outcome (reuses a
                        prior CFDE KG selection when available)</span
                    >
                </li>
                <li class="scp-bm-pipeline-step">
                    <span class="scp-bm-pipeline-num">2</span>
                    <span class="scp-bm-pipeline-text"
                        ><strong>Shared-gene diseases</strong> — find MONDO diseases that share top genes with that
                        mechanism</span
                    >
                </li>
                <li class="scp-bm-pipeline-step">
                    <span class="scp-bm-pipeline-num">3</span>
                    <span class="scp-bm-pipeline-text"
                        ><strong>Gene mapping</strong> — confirm shared genes for disease ranking, and highlight where
                        the hypothesis target appears among biomarker associated genes</span
                    >
                </li>
                <li class="scp-bm-pipeline-step">
                    <span class="scp-bm-pipeline-num">4</span>
                    <span class="scp-bm-pipeline-text"
                        ><strong>BiomarkerKB</strong> — fetch biomarkers linked to those diseases</span
                    >
                </li>
                <li
                    class="scp-bm-pipeline-step"
                    :class="{ 'scp-bm-pipeline-step--optional': !relevanceComplete }"
                >
                    <span class="scp-bm-pipeline-num">5</span>
                    <span class="scp-bm-pipeline-text">
                        <strong>Relevance to hypothesis</strong> — optional LLM labels for how each biomarker relates to
                        the hypothesis.
                        <span v-if="!relevanceComplete" class="scp-bm-pipeline-guide"
                            >To run this step, open the Actions panel and choose
                            <em>Classify biomarker relevance</em> (it appears at the top of Next steps after biomarkers
                            are fetched).</span
                        >
                    </span>
                </li>
            </ol>
            <p class="scp-bm-pipeline-note">
                This discovers biomarkers associated with the hypothesis mechanism via shared-gene diseases — not a
                direct search of Evaluation fields (tissue, cell line, etc.).
            </p>
        </div>

        <div v-if="blockedReason" class="scp-bm-callout" role="status">{{ blockedReason }}</div>

        <template v-else-if="evidence && evidence.biomarkers && evidence.biomarkers.length">
            <div class="scp-bm-coverage">
                <span v-if="factorLabels.length">Bridged via {{ factorLabels.join(", ") }}</span>
                <span class="scp-bm-toolbar-sep">·</span>
                <span
                    ><strong>{{ evidence.diseases.length }}</strong> associated disease{{
                        evidence.diseases.length === 1 ? "" : "s"
                    }}</span
                >
                <span class="scp-bm-toolbar-sep">·</span>
                <span
                    ><strong>{{ evidence.biomarkers.length }}</strong> biomarker{{
                        evidence.biomarkers.length === 1 ? "" : "s"
                    }}</span
                >
                <template v-if="evidence.truncated">
                    <span class="scp-bm-toolbar-sep">·</span>
                    <span class="text-muted">list truncated at limit {{ fetchLimit }}</span>
                </template>
            </div>
            <div v-if="relevanceLoading" class="scp-bm-relevance-status">
                <span class="scp-bm-relevance-marker"></span>
                Classifying relevance…
            </div>

            <div v-if="uniqueRoleLabels.length" class="scp-bm-type-filters" role="group" aria-label="Filter by biomarker role">
                <span class="scp-bm-type-filters-label">Roles:</span>
                <button
                    v-for="label in uniqueRoleLabels"
                    :key="label"
                    type="button"
                    class="scp-bm-type-bubble"
                    :class="{ 'scp-bm-type-bubble--off': !isRoleVisible(label) }"
                    :aria-pressed="isRoleVisible(label) ? 'true' : 'false'"
                    @click="toggleRoleFilter(label)"
                >
                    <b-icon :icon="isRoleVisible(label) ? 'eye-fill' : 'eye-slash'" aria-hidden="true" />
                    {{ label }}
                </button>
            </div>
            <div
                v-if="showDiseaseFilters"
                class="scp-bm-type-filters"
                role="group"
                aria-label="Filter biomarkers by disease"
            >
                <span class="scp-bm-type-filters-label">Diseases:</span>
                <button
                    v-for="label in uniqueDiseaseLabels"
                    :key="'disease-' + label"
                    type="button"
                    class="scp-bm-type-bubble"
                    :class="{ 'scp-bm-type-bubble--off': !isDiseaseVisible(label) }"
                    :aria-pressed="isDiseaseVisible(label) ? 'true' : 'false'"
                    @click="toggleDiseaseFilter(label)"
                >
                    <b-icon :icon="isDiseaseVisible(label) ? 'eye-fill' : 'eye-slash'" aria-hidden="true" />
                    {{ label }}
                </button>
            </div>
            <div
                v-if="targetGeneMappingBubbleLabel"
                class="scp-bm-type-filters"
                role="group"
                aria-label="Filter biomarkers by target gene among associated genes"
            >
                <span class="scp-bm-type-filters-label">Target gene to associated genes:</span>
                <button
                    type="button"
                    class="scp-bm-type-bubble"
                    :class="{ 'scp-bm-type-bubble--off': !targetGeneOverlapFilter }"
                    :aria-pressed="targetGeneOverlapFilter ? 'true' : 'false'"
                    @click="toggleTargetGeneOverlapFilter"
                >
                    <b-icon :icon="targetGeneOverlapFilter ? 'eye-fill' : 'eye-slash'" aria-hidden="true" />
                    {{ targetGeneMappingBubbleLabel }}
                </button>
            </div>

            <p v-if="!filteredBiomarkers.length" class="scp-bm-filter-empty">No rows for the selected filters.</p>
            <template v-else>
                <table class="scp-bm-table">
                    <thead>
                        <tr>
                            <th>Biomarker</th>
                            <th>Associated gene</th>
                            <th>Roles</th>
                            <th>Diseases</th>
                            <th>Records</th>
                            <th>Relevance</th>
                            <th>Relevance rationale</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(biomarker, index) in pagedBiomarkers" :key="biomarker.biomarker + '-' + index">
                            <td>
                                <a
                                    v-if="isUrl(biomarker.biomarker)"
                                    :href="biomarker.biomarker"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    >{{ biomarker.displayLabel }}</a
                                >
                                <span v-else>{{ biomarker.displayLabel }}</span>
                            </td>
                            <td class="scp-bm-gene-cell">
                                <template v-if="biomarker.geneList && biomarker.geneList.length">
                                    <span v-for="(gene, gIdx) in biomarker.geneList" :key="gene + '-' + gIdx">
                                        <span v-if="gIdx">&nbsp;|&nbsp;</span>
                                        <span
                                            :class="{ 'scp-bm-gene-shared': isTargetGene(gene) }"
                                            :title="
                                                isTargetGene(gene)
                                                    ? 'Matches the hypothesis target gene'
                                                    : null
                                            "
                                            >{{ gene }}</span
                                        >
                                    </span>
                                </template>
                                <span v-else>—</span>
                            </td>
                            <td>{{ biomarker.roles || "—" }}</td>
                            <td>{{ biomarker.diseases || "—" }}</td>
                            <td>{{ biomarker.recordCount || "—" }}</td>
                            <td>{{ relevanceLabelFor(biomarker) }}</td>
                            <td>{{ biomarker.relevance ? biomarker.relevance.rationale : "" }}</td>
                        </tr>
                    </tbody>
                </table>
                <b-pagination
                    v-if="filteredBiomarkers.length > perPage"
                    class="pagination-sm justify-content-center mt-2"
                    v-model="currentPage"
                    :total-rows="filteredBiomarkers.length"
                    :per-page="perPage"
                    size="sm"
                />
            </template>
        </template>
        <p v-else class="scp-bm-empty">
            No BiomarkerKB biomarkers found for diseases that share genes with the resolved mechanism.
        </p>
    </div>
</template>

<script>
import { BIOMARKER_KB_FETCH_LIMIT } from "@/components/researchPortal/customComponents/revealScope/scopeBiomarkerKbSparql.js";

const PER_PAGE = 10;

const RELEVANCE_LABELS = {
    on_topic: "On topic",
    same_domain_mismatched_context: "Same domain, mismatched context",
    unrelated: "Unrelated",
};

/** Sort rank so on_topic sorts first, unrelated last; not-yet-triaged biomarkers keep their original order (tie at the end). */
const RELEVANCE_RANK = {
    on_topic: 0,
    same_domain_mismatched_context: 1,
    unrelated: 2,
};

function relevanceRank(biomarker) {
    const label = biomarker && biomarker.relevance && biomarker.relevance.label;
    return Object.prototype.hasOwnProperty.call(RELEVANCE_RANK, label)
        ? RELEVANCE_RANK[label]
        : Number.MAX_SAFE_INTEGER;
}

export default {
    name: "ScopeBiomarkerEvidenceTable",
    props: {
        evidence: {
            type: Object,
            default: null,
        },
        blockedReason: {
            type: String,
            default: null,
        },
        relevanceLoading: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            perPage: PER_PAGE,
            fetchLimit: BIOMARKER_KB_FETCH_LIMIT,
            currentPage: 1,
            hiddenRoles: {},
            hiddenDiseases: {},
            targetGeneOverlapFilter: false,
        };
    },
    computed: {
        factorLabels() {
            if (!this.evidence || !Array.isArray(this.evidence.diseases)) return [];
            return Array.from(new Set(this.evidence.diseases.map((d) => d.factorLabel).filter(Boolean)));
        },
        relevanceComplete() {
            const biomarkers = this.evidence && this.evidence.biomarkers;
            return Boolean(Array.isArray(biomarkers) && biomarkers.some((b) => b && b.relevance));
        },
        targetGeneSymbol() {
            return String((this.evidence && this.evidence.targetGeneSymbol) || "")
                .trim()
                .toUpperCase();
        },
        uniqueRoleLabels() {
            if (!this.evidence || !Array.isArray(this.evidence.biomarkers)) return [];
            const seen = new Set();
            const labels = [];
            this.evidence.biomarkers.forEach((b) => {
                (b.roleList || []).forEach((label) => {
                    if (!label || seen.has(label)) return;
                    seen.add(label);
                    labels.push(label);
                });
            });
            return labels.sort((a, b) => a.localeCompare(b));
        },
        uniqueDiseaseLabels() {
            if (!this.evidence || !Array.isArray(this.evidence.biomarkers)) return [];
            const seen = new Set();
            const labels = [];
            this.evidence.biomarkers.forEach((b) => {
                (b.diseaseList || []).forEach((label) => {
                    if (!label || seen.has(label)) return;
                    seen.add(label);
                    labels.push(label);
                });
            });
            return labels.sort((a, b) => a.localeCompare(b));
        },
        showDiseaseFilters() {
            return this.uniqueDiseaseLabels.length > 1;
        },
        sortedBiomarkers() {
            if (!this.evidence || !Array.isArray(this.evidence.biomarkers)) return [];
            return this.evidence.biomarkers.slice().sort((a, b) => relevanceRank(a) - relevanceRank(b));
        },
        roleAndDiseaseFilteredBiomarkers() {
            return this.sortedBiomarkers.filter((b) => {
                if (this.uniqueRoleLabels.length) {
                    const roles = b.roleList || [];
                    if (!roles.some((r) => this.isRoleVisible(r))) return false;
                }
                if (this.showDiseaseFilters) {
                    const diseases = b.diseaseList || [];
                    if (!diseases.some((d) => this.isDiseaseVisible(d))) return false;
                }
                return true;
            });
        },
        filteredBiomarkers() {
            let rows = this.roleAndDiseaseFilteredBiomarkers;
            if (this.targetGeneOverlapFilter) {
                rows = rows.filter((b) => b.includesTargetGene);
            }
            return rows;
        },
        aggregateTargetGeneMapping() {
            const associated = new Set();
            let targetMapped = false;
            this.roleAndDiseaseFilteredBiomarkers.forEach((b) => {
                (b.geneList || []).forEach((gene) => {
                    const key = String(gene || "")
                        .trim()
                        .toUpperCase();
                    if (!key) return;
                    associated.add(key);
                    if (this.targetGeneSymbol && key === this.targetGeneSymbol) {
                        targetMapped = true;
                    }
                });
            });
            return {
                mappedCount: targetMapped ? 1 : 0,
                totalCount: associated.size,
            };
        },
        targetGeneMappingBubbleLabel() {
            if (!this.targetGeneSymbol) return "";
            const { mappedCount, totalCount } = this.aggregateTargetGeneMapping;
            if (!totalCount) return "";
            return `${mappedCount} / ${totalCount}`;
        },
        pagedBiomarkers() {
            const start = (this.currentPage - 1) * this.perPage;
            return this.filteredBiomarkers.slice(start, start + this.perPage);
        },
    },
    watch: {
        evidence() {
            this.currentPage = 1;
            this.hiddenRoles = {};
            this.hiddenDiseases = {};
            this.targetGeneOverlapFilter = false;
        },
    },
    methods: {
        isUrl(value) {
            return /^https?:\/\//i.test(String(value || ""));
        },
        isTargetGene(gene) {
            return Boolean(this.targetGeneSymbol && String(gene || "").toUpperCase() === this.targetGeneSymbol);
        },
        isRoleVisible(label) {
            return !this.hiddenRoles[label];
        },
        isDiseaseVisible(label) {
            return !this.hiddenDiseases[label];
        },
        toggleRoleFilter(label) {
            if (this.hiddenRoles[label]) {
                this.$delete(this.hiddenRoles, label);
            } else {
                this.$set(this.hiddenRoles, label, true);
            }
            this.currentPage = 1;
        },
        toggleDiseaseFilter(label) {
            if (this.hiddenDiseases[label]) {
                this.$delete(this.hiddenDiseases, label);
            } else {
                this.$set(this.hiddenDiseases, label, true);
            }
            this.currentPage = 1;
        },
        toggleTargetGeneOverlapFilter() {
            this.targetGeneOverlapFilter = !this.targetGeneOverlapFilter;
            this.currentPage = 1;
        },
        relevanceLabelFor(biomarker) {
            if (this.relevanceLoading) return "…";
            if (!biomarker.relevance) return "—";
            return RELEVANCE_LABELS[biomarker.relevance.label] || biomarker.relevance.label;
        },
    },
};
</script>

<style scoped>
.scp-bm {
    padding: 18px;
    background-color: #ffffff;
    border-radius: 15px;
    border-top: solid 1px #dddddd;
}

.scp-bm-pipeline {
    margin: 0 0 16px;
    padding: 14px 16px;
    border-radius: 10px;
    background: rgb(246, 245, 242);
}

.scp-bm-pipeline-title {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.scp-bm-pipeline-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.scp-bm-pipeline-step {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.scp-bm-pipeline-num {
    flex: 0 0 22px;
    height: 22px;
    width: 22px;
    border-radius: 999px;
    background: var(--cfde-blue, #2c5c97);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    line-height: 22px;
    text-align: center;
}

.scp-bm-pipeline-step--optional .scp-bm-pipeline-num {
    background: var(--cfde-orange, #e07b39);
}

.scp-bm-pipeline-text {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
}

.scp-bm-pipeline-guide {
    display: block;
    margin-top: 4px;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-bm-pipeline-note {
    margin: 12px 0 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-bm-callout {
    display: inline-block;
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    font-size: 13px;
    line-height: 1.35;
    padding: 8px 14px;
    border-radius: 999px;
}

.scp-bm-coverage {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
    margin-bottom: 8px;
}

.scp-bm-toolbar-sep {
    margin: 0 6px;
}

.scp-bm-empty {
    margin: 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-bm-filter-empty {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-bm-relevance-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
    margin-bottom: 16px;
}

.scp-bm-relevance-marker {
    flex: 0 0 10px;
    height: 10px;
    width: 10px;
    border-radius: 999px;
    background: var(--cfde-orange, #e07b39);
    animation: scp-bm-relevance-pulse 1.1s ease-in-out infinite;
}

@keyframes scp-bm-relevance-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.4;
    }
}

.scp-bm-type-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 14px;
}

.scp-bm-type-filters-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-bm-type-bubble {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--cfde-blue, #2c5c97);
    background: var(--cfde-blue, #2c5c97);
    color: #fff;
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 12px;
    line-height: 1.3;
    cursor: pointer;
}

.scp-bm-type-bubble >>> .b-icon {
    width: 0.85em;
    height: 0.85em;
}

.scp-bm-type-bubble:hover,
.scp-bm-type-bubble:focus {
    opacity: 0.92;
}

.scp-bm-type-bubble--off {
    background: #fff;
    color: var(--cfde-muted, #6b6b6b);
    border-color: var(--cfde-border, #e6e1d6);
    text-decoration: line-through;
}

.scp-bm-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.scp-bm-table th,
.scp-bm-table td {
    text-align: left;
    padding: 6px 10px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.scp-bm-table th {
    color: var(--cfde-blue, #2c5c97);
    font-weight: 600;
}

.scp-bm-table td {
    color: var(--cfde-ink, #33363d);
}

.scp-bm-gene-cell {
    white-space: nowrap;
}

.scp-bm-gene-shared {
    font-weight: 700;
    color: var(--cfde-orange, #e07b39);
}
</style>
