<script>
import Vue from "vue";
import { field, numericField, programSelfLabelsAsQc } from "../ligerApi";
import { formatSignificance } from "./programAxis";
import InfoTabs from "./InfoTabs.vue";
import TraitTable from "./TraitTable.vue";

const TOP_GENE_ROWS = 30;
const TOP_GENE_SET_ROWS = 25;

// The Gene program tab's detail body.
//
// Program-level metadata is thin by nature. `gene-program-factor` returns exactly
// six fields -- dataset, cell_type, model, factor, label, top_genes -- and that is
// the whole surface. There is no rationale, no suggested label, no quality class.
//
// **Do not reintroduce a quality badge.** v1 showed one read from
// `suggested_program_quality_class` / `quality_class` / `release_recommendation` /
// `qc_recommendation`, none of which any index returns, falling back to a regex over
// `match_class`, which the heatmap does not return either -- so it printed the
// constant "Exploratory biological" on every program in every tissue while looking
// like an API verdict.
//
// The honest replacement is here: the factorization's own `label`, which for islet
// beta calls 7 of 10 programs QC or artifact programs, plus counted QC enrichment.
export default Vue.component("ProgramInfo", {
    components: {
        InfoTabs,
        TraitTable
    },

    props: {
        // the buildExpressionItems() item for this program
        program: {
            type: Object,
            required: true
        },
        // its gene-program-factor row, when one loaded
        factor: {
            type: Object,
            default: null
        },
        // { genes, geneSets, qc } -- the on-demand per-program fetches
        detail: {
            type: Object,
            default: null
        },
        // qc_signature_id -> gene-program-qc-metadata-extended row
        qcMetadata: {
            type: Object,
            default: () => ({})
        },
        // [{ key, label, color, gseaText, qText }] -- states matching this program
        matches: {
            type: Array,
            default: () => []
        },
        geneLabel: {
            type: String,
            default: ""
        },
        loading: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: ""
        },
        // buildTraitRows() result
        traits: {
            type: Object,
            default: null
        },
        loadingTraits: {
            type: Boolean,
            default: false
        },
        traitError: {
            type: String,
            default: ""
        }
    },

    data() {
        return {
            activeTab: "overview"
        };
    },

    watch: {
        // A new entity should be read from the top.
        program() {
            this.activeTab = "overview";
        }
    },

    computed: {
        tabs() {
            return [
                { key: "overview", label: "Overview" },
                { key: "genes", label: "Gene loadings", count: this.geneLoadings.rows.length || this.topGeneFallback.length },
                { key: "states", label: "Associated states", count: this.matches.length },
                { key: "genesets", label: "Gene sets", count: this.geneSets.rows.length },
                { key: "traits", label: "Traits", count: this.traits ? this.traits.shown : null },
                { key: "qc", label: "QC signatures", count: this.qcRows.length }
            ];
        },

        topGenePreview() {
            return this.geneLoadings.rows.length
                ? this.geneLoadings.rows.slice(0, 8).map((row) => row.gene)
                : this.topGeneFallback.slice(0, 8);
        },

        topMatches() {
            return this.matches.slice(0, 4);
        },

        topGeneSets() {
            return this.geneSets.rows.slice(0, 4);
        },

        topTraits() {
            return this.traits ? this.traits.rows.slice(0, 5) : [];
        },

        selfLabel() {
            return this.factor ? String(field(this.factor, ["label"]) || "") : "";
        },

        // Reported as what it is -- the factorization's own description of itself --
        // rather than dressed up as a curation verdict.
        selfLabelIsQc() {
            return programSelfLabelsAsQc(this.selfLabel);
        },

        model() {
            return this.factor ? String(field(this.factor, ["model"]) || "") : "";
        },

        // Ranked gene loadings. Rows with a loading of exactly 0 are dropped (45 of
        // 4940 on Factor1) -- a zero loading is not a top gene.
        // Ranked gene loadings, with the SEARCHED GENE pinned to the top.
        //
        // The whole question a reader brings here is "where does my gene sit in this
        // program", and it usually is not in the top 30 -- so it is lifted out and
        // shown first, carrying its true rank so the pin cannot be mistaken for it
        // being the strongest.
        //
        // The searched gene keeps its row even when its loading is 0 or negative.
        // Ordinary rows are filtered to positive loadings (45 of 4940 on Factor1 are
        // exactly 0, and a zero loading is not a top gene), but for the gene the
        // reader asked about, "measured, and it is zero here" is the answer.
        geneLoadings() {
            let rows = this.detail && Array.isArray(this.detail.genes) ? this.detail.genes : [];
            let wanted = String(this.geneLabel || "").toUpperCase();

            let all = rows
                .map((row) => ({
                    gene: String(field(row, ["gene"]) || ""),
                    value: numericField(row, ["value", "loading"])
                }))
                .filter((row) => !!row.gene && Number.isFinite(row.value));

            // Rank is over every measured gene, positive or not, so it answers
            // "position out of N" against the list the reader is told the size of.
            let ranked = all.slice().sort((a, b) => b.value - a.value);
            let positive = ranked.filter((row) => row.value > 0);

            let searchedIndex = wanted
                ? ranked.findIndex((row) => row.gene.toUpperCase() === wanted)
                : -1;
            let searched = searchedIndex >= 0
                ? { ...ranked[searchedIndex], rank: searchedIndex + 1, isSearched: true }
                : null;

            let top = positive
                .slice(0, TOP_GENE_ROWS)
                .map((row, index) => ({ ...row, rank: index + 1 }));

            // Never twice: if it already made the top N, mark that row instead of
            // pinning a duplicate above it.
            if (searched) {
                let existing = top.find((row) => row.gene.toUpperCase() === wanted);

                if (existing) {
                    existing.isSearched = true;
                    searched = null;
                }
            }

            return {
                rows: top,
                searched,
                total: positive.length,
                measured: ranked.length,
                // The gene is in this program's index but has no loading at all.
                searchedMissing: !!wanted && searchedIndex < 0 && all.length > 0
            };
        },

        // Fallback for when the loading index is empty: `top_genes` is an ordered
        // semicolon string, so it gives rank and gene and nothing else. It does NOT
        // get a synthetic score -- v1 printed one counted down from the list length,
        // which was invented in the component.
        topGeneFallback() {
            if (this.geneLoadings.rows.length || !this.factor) {
                return [];
            }

            return String(field(this.factor, ["top_genes"]) || "")
                .split(";")
                .map((gene) => gene.trim())
                .filter((gene) => !!gene)
                .slice(0, TOP_GENE_ROWS);
        },

        geneSets() {
            let rows = this.detail && Array.isArray(this.detail.geneSets) ? this.detail.geneSets : [];

            let ranked = rows
                .map((row) => ({
                    name: String(field(row, ["gene_set"]) || ""),
                    beta: numericField(row, ["beta"])
                }))
                .filter((row) => !!row.name && Number.isFinite(row.beta))
                .sort((a, b) => Math.abs(b.beta) - Math.abs(a.beta));

            return {
                rows: ranked.slice(0, TOP_GENE_SET_ROWS),
                total: ranked.length
            };
        },

        // QC signature enrichment. Both gsea_p and gsea_q are always present on these
        // rows, unlike the program/state heatmap.
        qcRows() {
            let rows = this.detail && Array.isArray(this.detail.qc) ? this.detail.qc : [];

            return rows
                .map((row) => {
                    let id = String(field(row, ["state_name", "qc_signature_id"]) || "");
                    let meta = this.qcMetadata[id] || null;
                    let p = numericField(row, ["gsea_p"]);
                    let q = numericField(row, ["gsea_q"]);

                    return {
                        id,
                        label: (meta && field(meta, ["display_name"])) || id,
                        category: meta ? field(meta, ["category"]) : null,
                        tier: meta ? field(meta, ["tier"]) : null,
                        recommendedUse: meta ? field(meta, ["recommended_use"]) : null,
                        excludeWhen: meta ? field(meta, ["exclude_when"]) : null,
                        p,
                        q,
                        pText: formatSignificance(p),
                        qText: formatSignificance(q),
                        // Straight from the values, not from a fallback chain: red
                        // when q clears, yellow when only p does, green otherwise.
                        tone: Number.isFinite(q) && q < 0.05
                            ? "bad"
                            : (Number.isFinite(p) && p < 0.05 ? "warn" : "ok")
                    };
                })
                .filter((row) => !!row.id)
                .sort((a, b) => (a.p === null) - (b.p === null) || a.p - b.p);
        },

        // Counts, not a verdict. This is what replaced the fabricated badge.
        qcEvidence() {
            let rows = this.qcRows;

            return {
                tested: rows.length,
                atQ: rows.filter((row) => row.tone === "bad").length,
                atP: rows.filter((row) => row.tone !== "ok").length
            };
        },

        hasQcData() {
            return !!(this.detail && Array.isArray(this.detail.qc));
        }
    },

    methods: {
        qcTitle(row) {
            return [row.category, row.tier, row.recommendedUse, row.excludeWhen]
                .filter((part) => !!part)
                .join(" · ");
        }
    }
});
</script>

<template>
    <div class="entity-info">
        <div class="info-head">
            <div class="head-titles">
                <div class="info-eyebrow">Gene program</div>
                <h4 class="info-title">{{ program.label }}</h4>
                <div class="info-lede">
                    A factorization-inferred program. There is no curation record behind it — the
                    description below is the factorization's own label for itself.
                </div>
                <div class="info-sub">
                    <code>{{ program.key }}</code>
                    <template v-if="model"> · {{ model }}</template>
                </div>
            </div>

            <div class="head-metrics">
                <div class="metric">
                    <span class="metric-label">Expression</span>
                    <span class="metric-value">{{ program.absText }}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Specificity</span>
                    <span
                        class="metric-value"
                        :class="program.specDirection ? 'dir-' + program.specDirection : 'dir-none'"
                    >{{ program.specText }}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">p-value</span>
                    <span class="metric-value">{{ program.pValueText }}</span>
                </div>
                <div v-if="geneLabel" class="metric-note">for {{ geneLabel }}</div>
            </div>
        </div>

        <div v-if="selfLabel" class="self-label" :class="{ qc: selfLabelIsQc }">
            <span class="self-label-key">Factorization label</span>
            <span class="self-label-value">{{ selfLabel }}</span>
            <span v-if="selfLabelIsQc" class="self-label-flag">
                This program describes itself as a QC or artifact program.
            </span>
        </div>

        <div v-if="error" class="info-missing">{{ error }}</div>

        <info-tabs v-model="activeTab" :tabs="tabs" />

        <!-- Overview is a digest, not a dump: the full tables are behind their own
             tabs, so this is previews and the counts that say whether a tab is worth
             opening. Every preview names its selection rule; these RANK, they do not
             filter, so the note is the statistic and never a threshold. -->
        <template v-if="activeTab === 'overview'">
            <div class="info-grid">
                <section class="info-section">
                    <h5 class="section-title">
                        Top genes
                        <span v-if="topGenePreview.length" class="section-note">Top {{ topGenePreview.length }} by loading</span>
                    </h5>
                    <div v-if="topGenePreview.length" class="marker-chips">
                        <span v-for="gene in topGenePreview" :key="gene" class="marker">{{ gene }}</span>
                    </div>
                    <div v-else-if="loading" class="section-empty">Loading…</div>
                    <div v-else class="section-empty">No gene loadings reported.</div>
                </section>

                <section class="info-section">
                    <h5 class="section-title">
                        Top associated states
                        <span v-if="topMatches.length" class="section-note">Top {{ topMatches.length }} by GSEA P</span>
                    </h5>
                    <ul v-if="topMatches.length" class="preview-list">
                        <li v-for="match in topMatches" :key="match.key">
                            <span class="swatch" :style="{ background: match.color }"></span>
                            <span class="preview-text" :title="match.label">{{ match.label }}</span>
                        </li>
                    </ul>
                    <div v-else class="section-empty">
                        No state associations under the current edge filter.
                    </div>
                </section>

                <section class="info-section">
                    <h5 class="section-title">
                        Top gene sets
                        <span v-if="topGeneSets.length" class="section-note">Top {{ topGeneSets.length }} by |beta|</span>
                    </h5>
                    <ul v-if="topGeneSets.length" class="preview-list">
                        <li v-for="row in topGeneSets" :key="row.name">
                            <span class="preview-text" :title="row.name">{{ row.name }}</span>
                        </li>
                    </ul>
                    <div v-else-if="loading" class="section-empty">Loading…</div>
                    <div v-else class="section-empty">No gene set associations reported.</div>
                </section>

                <section class="info-section">
                    <h5 class="section-title">
                        Top trait anchors
                        <span v-if="topTraits.length" class="section-note">Top {{ topTraits.length }} by |beta|</span>
                    </h5>
                    <dl v-if="topTraits.length" class="pair-list">
                        <template v-for="trait in topTraits">
                            <dt :key="trait.key + '-l'">{{ trait.label }}</dt>
                            <dd :key="trait.key + '-v'">{{ trait.group }}</dd>
                        </template>
                    </dl>
                    <div v-else-if="loadingTraits" class="section-empty">Loading…</div>
                    <div v-else class="section-empty">No trait associations reported.</div>
                </section>
            </div>

            <!-- Counts, not a verdict -- the honest replacement for v1's fabricated
                 quality badge. Shown on the overview because it is a caveat on the
                 whole program, not one of its biological associations. -->
            <section v-if="qcEvidence.tested" class="info-section">
                <h5 class="section-title">QC evidence</h5>
                <div class="qc-evidence">
                    {{ qcEvidence.tested }} signatures tested ·
                    <b>{{ qcEvidence.atQ }}</b> enriched at q &lt; 0.05 ·
                    <b>{{ qcEvidence.atP }}</b> at P &lt; 0.05
                </div>
            </section>
        </template>

        <template v-else-if="activeTab === 'genes'">
            <section class="info-section">
                <h5 class="section-title">
                    Top gene loadings
                    <span v-if="geneLoadings.total" class="section-count">{{ geneLoadings.rows.length }}</span>
                    <span v-if="geneLoadings.total" class="section-note">
                        of {{ geneLoadings.total.toLocaleString() }} with a positive loading
                    </span>
                </h5>

                <div v-if="loading && !geneLoadings.rows.length" class="section-empty">Loading…</div>

                <table v-else-if="geneLoadings.rows.length" class="data-table">
                    <thead>
                        <tr>
                            <th class="num rank">#</th>
                            <th>Gene</th>
                            <th class="num">Loading</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- The searched gene, pinned above the ranking so its score
                             can be read against the rest. It carries its real rank,
                             so being first here is not mistaken for being strongest.
                             Rendered in its own tbody-less group with a rule under
                             it, not merged into the list. -->
                        <tr v-if="geneLoadings.searched" class="searched-row">
                            <td class="num rank">{{ geneLoadings.searched.rank }}</td>
                            <td>
                                {{ geneLoadings.searched.gene }}
                                <span class="searched-flag">your gene</span>
                            </td>
                            <td class="num">{{ geneLoadings.searched.value.toFixed(2) }}</td>
                        </tr>

                        <tr
                            v-for="row in geneLoadings.rows"
                            :key="row.gene"
                            :class="{ 'searched-row inline': row.isSearched }"
                        >
                            <td class="num rank">{{ row.rank }}</td>
                            <td>
                                {{ row.gene }}
                                <span v-if="row.isSearched" class="searched-flag">your gene</span>
                            </td>
                            <td class="num">{{ row.value.toFixed(2) }}</td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="geneLoadings.searched" class="section-foot">
                    {{ geneLabel }} ranks {{ geneLoadings.searched.rank }} of
                    {{ geneLoadings.measured.toLocaleString() }} measured genes in this program.
                </div>
                <div v-else-if="geneLoadings.searchedMissing" class="section-foot">
                    {{ geneLabel }} has no loading reported in this program.
                </div>

                <!-- The loading index returned nothing, so all that is left is the
                     ordered string from gene-program-factor: rank and gene only. -->
                <template v-else-if="topGeneFallback.length">
                    <div class="marker-chips">
                        <span v-for="gene in topGeneFallback" :key="gene" class="marker">{{ gene }}</span>
                    </div>
                    <div class="section-foot">
                        Ranked order only — the loading index returned no values for this program.
                    </div>
                </template>

                <div v-else class="section-empty">No gene loadings reported.</div>
            </section>
        </template>

        <template v-else-if="activeTab === 'states'">
            <section class="info-section">
                <h5 class="section-title">
                    Associated cell states
                    <span v-if="matches.length" class="section-count">{{ matches.length }}</span>
                </h5>

                <table v-if="matches.length" class="match-table">
                    <thead>
                        <tr>
                            <th>Cell state</th>
                            <th class="num">GSEA P</th>
                            <th class="num">GSEA q</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="match in matches" :key="match.key" @click="$emit('select-state', match)">
                            <td>
                                <span class="swatch" :style="{ background: match.color }"></span>
                                {{ match.label }}
                            </td>
                            <td class="num">{{ match.gseaText }}</td>
                            <td class="num">{{ match.qText }}</td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="section-empty">
                    No state associations under the current edge filter.
                </div>
            </section>
        </template>

        <template v-else-if="activeTab === 'genesets'">
        <section class="info-section">
            <h5 class="section-title">
                Gene set associations
                <span v-if="geneSets.total" class="section-count">{{ geneSets.rows.length }}</span>
                <span v-if="geneSets.total" class="section-note">
                    of {{ geneSets.total.toLocaleString() }}, by |beta|
                </span>
            </h5>

            <div v-if="loading && !geneSets.rows.length" class="section-empty">Loading…</div>
            <table v-else-if="geneSets.rows.length" class="data-table">
                <thead>
                    <tr>
                        <th>Gene set</th>
                        <th class="num">Beta</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in geneSets.rows" :key="row.name">
                        <td>{{ row.name }}</td>
                        <td class="num">{{ row.beta.toFixed(3) }}</td>
                    </tr>
                </tbody>
            </table>
            <div v-else class="section-empty">No gene set associations reported.</div>
        </section>
        </template>

        <section v-else-if="activeTab === 'traits'" class="info-section">
            <h5 class="section-title">Human genetic trait associations</h5>
            <trait-table :traits="traits" :loading="loadingTraits" :error="traitError" />
        </section>

        <template v-else>
        <section class="info-section">
            <h5 class="section-title">
                QC signatures
                <span v-if="qcEvidence.tested" class="section-count">{{ qcEvidence.tested }}</span>
            </h5>

            <div v-if="loading && !qcRows.length" class="section-empty">Loading…</div>

            <template v-else-if="qcRows.length">
                <!-- Counts, not a verdict. An empty QC result says so rather than
                     asserting a pass the API never reported. -->
                <div class="qc-evidence">
                    {{ qcEvidence.tested }} signatures tested ·
                    <b>{{ qcEvidence.atQ }}</b> enriched at q &lt; 0.05 ·
                    <b>{{ qcEvidence.atP }}</b> at P &lt; 0.05
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Signature</th>
                            <th>Tier</th>
                            <th class="num">GSEA P</th>
                            <th class="num">GSEA q</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in qcRows" :key="row.id">
                            <td>
                                <span class="qc-dot" :class="row.tone"></span>
                                <span :title="qcTitle(row)">{{ row.label }}</span>
                                <span v-if="row.category" class="qc-category">{{ row.category }}</span>
                            </td>
                            <td class="qc-tier">{{ row.tier || "—" }}</td>
                            <td class="num">{{ row.pText }}</td>
                            <td class="num">{{ row.qText }}</td>
                        </tr>
                    </tbody>
                </table>
            </template>

            <div v-else-if="hasQcData" class="section-empty">
                No QC signature enrichment reported for this program.
            </div>
            <div v-else class="section-empty">QC signatures not loaded.</div>
        </section>
        </template>
    </div>
</template>

<style scoped src="./entityInfo.css"></style>

<style scoped>
.self-label{
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 5px 10px;
    margin-top: 12px;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--ce-sunken);
}
.self-label.qc{
    background: #fdf3e6;
}
.self-label-key{
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--ce-muted);
}
.self-label-value{
    font-size: 12px;
    font-weight: 700;
    color: var(--ce-ink);
}
.self-label-flag{
    font-size: 11px;
    color: #9a5b00;
}

/* The pinned searched gene. A rule under it, so the ranking below still reads as a
   ranking rather than starting at an arbitrary row. */
.searched-row{
    background: var(--ce-accent-soft);
}
.searched-row:not(.inline) td{
    border-bottom: 2px solid var(--ce-accent);
    font-weight: 700;
}
.searched-row.inline td{
    font-weight: 700;
}
.searched-flag{
    margin-left: 6px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--ce-accent);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    white-space: nowrap;
}
/* `.num` zeroes the right padding so the LAST column hugs the table's right edge.
   The rank is the first column, where that rule left the number jammed against the
   gene name -- so it takes its padding back.

   Qualified with `.data-table th/td` rather than left as a bare `.rank`, because
   `.data-table td` is the more specific selector for `color` and was overriding the
   muted grey this rule has always claimed to set. */
.data-table th.rank,
.data-table td.rank{
    width: 34px;
    padding-right: 14px;
    color: var(--ce-muted);
    font-weight: 400;
}

.qc-evidence{
    margin-bottom: 8px;
    font-size: 11px;
    color: var(--ce-muted);
}
.qc-evidence b{ color: var(--ce-ink); }

.qc-dot{
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    margin-right: 6px;
}
.qc-dot.ok{ background: #2e9e6b; }
.qc-dot.warn{ background: #d9a400; }
.qc-dot.bad{ background: #d92d20; }

.qc-category,
.qc-tier{
    font-size: 10px;
    color: var(--ce-muted);
}
.qc-category{ margin-left: 7px; }

.swatch{
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    margin-right: 6px;
}
</style>
