<script>
import Vue from "vue";
import {
    field,
    numericField,
    FACTOR_REPORT_GROUPS,
    factorStatusTone,
    GENE_LOADING_DEFINITION
} from "../ligerApi";
import { formatSignificance } from "./programAxis";
import InfoTabs from "./InfoTabs.vue";
import InfoTip from "./InfoTip.vue";
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
        InfoTip,
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
                // `count: 0` DISABLES a tab in InfoTabs, so a count may only be
                // given once its source has actually loaded. Passing the length of an
                // empty array while the fetch is still in flight makes the tab
                // unclickable exactly when a reader is trying to open it, and leaves
                // a legitimately empty one unable to say so.
                {
                    key: "genes",
                    label: "Gene loadings",
                    count: this.loadedCount("genes", this.geneLoadings.rows.length || this.topGeneFallback.length)
                },
                { key: "states", label: "Associated states", count: this.matches.length },
                // Never 0, so this tab is never disabled -- `|| null` where the
                // others pass their real count.
                //
                // Empty is the NORMAL case here: gene-set associations are loaded for
                // liver only, 10 of 161 scopes across the 12 tissues. A greyed-out
                // dead tab on the other 94% tells a reader nothing, and they cannot
                // open it to find out why. Enabled and empty, it says so.
                {
                    key: "genesets",
                    label: "Gene sets",
                    count: this.loadedCount("geneSets", this.geneSets.rows.length) || null
                },
                { key: "traits", label: "Traits", count: this.traits ? this.traits.shown : null },
                // Two tabs that both say QC, and they are different axes: this one is
                // "is this program trustworthy" (factor-level, the report), the next
                // is "which QC signatures is it enriched for" (signature-level). The
                // labels have to keep them apart.
                // The count is the FLAG count, and only when there is one. `count: 0`
                // disables a tab in InfoTabs, which would make the report
                // unreachable on exactly the programs that passed it -- and a clean
                // report is still worth reading. No badge, still clickable.
                {
                    key: "report",
                    label: "Factor QC",
                    count: this.factorReport && this.factorReport.flagged ? this.factorReport.nFlags : null
                },
                { key: "qc", label: "QC signatures", count: this.loadedCount("qc", this.qcRows.length) }
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
        },

        // From ligerApi, not written here: the canvas label over the gene link bundle
        // shows the same sentence, and two copies would drift.
        geneLoadingDefinition() {
            return GENE_LOADING_DEFINITION;
        },

        // The three explanations that used to be the canvas column-head tooltips.
        // They moved with their values when the columns came off the rows.
        //
        // `log10_cpk` is NAMED, not interpreted: it is the only expression field
        // these endpoints return, it behaves like a log of a log, and its exact
        // definition is an open question with the pipeline owner. Reporting the
        // backend's own naming asserts nothing. Do not relabel this as CPK.
        expressionHelp() {
            return `How strongly ${this.geneLabel || "the gene"} is expressed in this gene program.\n\n`
                + `Field: log10_cpk, as reported by the pipeline.`;
        },

        // Kept separate from the expression text, and from the cell-type one:
        // specificity's DENOMINATOR differs by card -- cell types measure against the
        // other cell types in the tissue, programs against the parent cell type --
        // and collapsing them into one string is how they come to disagree with the
        // data. Here it is the parent cell-type background.
        specificityHelp() {
            return `How specific ${this.geneLabel || "the gene"}'s expression is to this program,`
                + ` measured against the rest of the parent cell type.\n\n`
                + `Negative means the gene is expressed less in this program than across the cell`
                + ` type as a whole — the program is not where this gene's signal sits.\n\n`
                + `Field: log2fc_weighted_vs_all_parent, in log₂ fold change. It is a fold change,`
                + ` not a p-value.`;
        },

        // Says plainly that what it tests is unknown. That was asked twice on the
        // 10/02 call and went unanswered (punchlist 3.1), and it is why this value no
        // longer grays anything.
        pValueHelp() {
            return `Reported with the expression value. What this p-value tests has not been`
                + ` confirmed with the pipeline owner, so it is shown as reported and is not used`
                + ` to rank or to flag anything.\n\nIt underflows to 5e-324 for the strongest hits,`
                + ` so values at the floor are shown as <1e-300 rather than a falsely precise`
                + ` number.`;
        },

        // The factor QC report, rendered as reported.
        //
        // Deliberately uninterpreted. Several questions about this data are open with
        // Kyle -- what covariates `X` and `Y` are, whether trait covariates should
        // flag at all, why two checks come back `unknown` on ~10% of factors -- so
        // the card shows every check with its evidence and lets the reader judge.
        // Summarising it into a verdict here would bake in answers nobody has.
        //
        // The one thing it does assert is the pipeline's own distinction: the two
        // informational-only checks are marked as such, because a `clean` on those is
        // not a pass. One sampled factor reads `blacklist_status: clean` at r = 0.68.
        factorReport() {
            let row = this.program ? this.program.report : null;

            if (!row) {
                return null;
            }

            let groups = FACTOR_REPORT_GROUPS.map((group) => {
                let status = field(row, [group.status]);

                return {
                    key: group.key,
                    label: group.label,
                    flagging: group.flagging,
                    status: status || "—",
                    tone: factorStatusTone(status),
                    fields: group.fields
                        .map((item) => ({
                            key: item.key,
                            label: item.label,
                            value: this.reportValue(row, item.key)
                        }))
                        .filter((item) => item.value !== null)
                };
            });

            return {
                groups,
                verdict: String(field(row, ["overall_verdict"]) || ""),
                flagged: this.program.qcFlagged === true,
                flags: this.program.qcFlags || [],
                nFlags: numericField(row, ["n_flags"])
            };
        }
    },

    methods: {
        // `null` until the source has loaded, so InfoTabs leaves the tab enabled.
        // A zero that means "not fetched yet" and a zero that means "none reported"
        // are different facts and must not render the same.
        loadedCount(key, value) {
            return this.detail && Array.isArray(this.detail[key]) ? value : null;
        },

        // Numbers are rounded for reading; everything else passes through as a
        // string. `null` means the field is absent, and the row is dropped rather
        // than printed as an empty label -- the report's field set varies.
        reportValue(row, key) {
            let numeric = numericField(row, [key]);

            if (Number.isFinite(numeric)) {
                return Math.abs(numeric) < 0.001 && numeric !== 0
                    ? numeric.toExponential(2)
                    : String(Number(numeric.toFixed(4)));
            }

            let text = field(row, [key]);

            return text === null || text === undefined || text === "" ? null : String(text);
        },

        qcTitle(row) {
            // Newline-separated: InfoTip turns these into separate lines, and
            // `recommended_use` / `exclude_when` are sentences rather than labels.
            return [row.category, row.tier, row.recommendedUse, row.excludeWhen]
                .filter((part) => !!part)
                .join("\n");
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

            <!-- These three came off the canvas rows (punchlist 1.2). The card is
                 now the only place they appear, so it is also the only place their
                 explanations can live -- hence the tooltips, which moved here from
                 the EXP / SPEC column heads. -->
            <div class="head-metrics">
                <div class="metric">
                    <span class="metric-label">Expression</span>
                    <info-tip title="Expression" :text="expressionHelp">
                        <span class="metric-value help">{{ program.absText }}</span>
                    </info-tip>
                </div>
                <div class="metric">
                    <span class="metric-label">Specificity</span>
                    <info-tip title="Specificity" :text="specificityHelp">
                        <span
                            class="metric-value help"
                            :class="program.specDirection ? 'dir-' + program.specDirection : 'dir-none'"
                        >{{ program.specText }}</span>
                    </info-tip>
                </div>
                <div class="metric">
                    <span class="metric-label">p-value</span>
                    <info-tip title="p-value" :text="pValueHelp">
                        <span class="metric-value help">{{ program.pValueText }}</span>
                    </info-tip>
                </div>
                <div v-if="geneLabel" class="metric-note">for {{ geneLabel }}</div>
            </div>
        </div>

        <div v-if="error" class="info-missing">{{ error }}</div>

        <!-- A flagged program is normally hidden, so if one is on screen the reader
             either asked for it or deep-linked to it. Either way the reason belongs
             at the top of the card, not three tabs in. -->
        <div v-if="factorReport && factorReport.flagged" class="report-banner">
            <b>Flagged by the factor QC report.</b>
            <ul class="report-flags">
                <li v-for="flag in factorReport.flags" :key="flag.code">
                    {{ flag.label }}<template v-if="flag.detail"> — <code>{{ flag.detail }}</code></template>
                </li>
            </ul>
        </div>

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
                            <info-tip class="preview-text" display="block" cursor="inherit" :text="match.label">{{ match.label }}</info-tip>
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
                            <info-tip class="preview-text" display="block" cursor="inherit" :text="row.name">{{ row.name }}</info-tip>
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

                <!-- What the number means, above the table rather than in a tooltip:
                     "loading" is the one term on this tab a reader is most likely not
                     to share a definition for, and it is the column they are here to
                     read. -->
                <p class="section-intro">{{ geneLoadingDefinition }}</p>

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
            <div v-else class="section-empty">No gene set associations reported for this cell type.</div>
        </section>
        </template>

        <section v-else-if="activeTab === 'traits'" class="info-section">
            <h5 class="section-title">Human genetic trait associations</h5>
            <trait-table :traits="traits" :loading="loadingTraits" :error="traitError" />
        </section>

        <!-- Every check and its evidence, exactly as reported. No roll-up beyond the
             pipeline's own `overall_verdict`: what several of these fields mean is
             still an open question, and a card that summarised them would be
             asserting answers. -->
        <template v-else-if="activeTab === 'report'">
            <section class="info-section">
                <h5 class="section-title">
                    Factor QC report
                    <span v-if="factorReport" class="section-note">
                        Verdict: {{ factorReport.verdict || "—" }}
                    </span>
                </h5>

                <template v-if="factorReport">
                    <div class="report-groups">
                        <div v-for="group in factorReport.groups" :key="group.key" class="report-group">
                            <div class="report-head">
                                <span class="qc-dot" :class="group.tone"></span>
                                <span class="report-name">{{ group.label }}</span>
                                <span class="report-status">{{ group.status }}</span>
                                <!-- The pipeline's own distinction, kept visible.
                                     These two checks never contribute to the verdict,
                                     so a `clean` on them is not a pass. -->
                                <span v-if="!group.flagging" class="report-info-only">informational only</span>
                            </div>
                            <dl v-if="group.fields.length" class="pair-list">
                                <template v-for="item in group.fields">
                                    <dt :key="group.key + item.key + '-l'">{{ item.label }}</dt>
                                    <dd :key="group.key + item.key + '-v'">{{ item.value }}</dd>
                                </template>
                            </dl>
                        </div>
                    </div>

                    <div class="section-foot">
                        Six checks, of which four can raise a flag — activity, independence, technical
                        QC and cross-cell-type QC. Curated-state match and blacklist QC are reported
                        for context and never affect the verdict. All correlations are Spearman r.
                    </div>
                </template>

                <div v-else class="section-empty">
                    No factor QC report for this program.
                </div>
            </section>
        </template>

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
                                <info-tip :text="qcTitle(row)">{{ row.label }}</info-tip>
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
    font-size: 11px;
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

/* The head metrics are the only place these three values appear now, so they are
   also the only place to explain them. */
.metric-value.help{
    cursor: help;
}

.qc-evidence{
    margin-bottom: 8px;
    font-size: 12px;
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
/* A check that reports a finding rather than a quality (curated-state match), and
   one that could not be run at all. Neither is a pass or a failure, so neither gets
   a color that reads as one -- `unknown` is hollow because there is no result. */
.qc-dot.neutral{ background: var(--ce-muted); }
.qc-dot.unknown{
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--ce-muted);
}

/* Why this program is on screen at all, since flagged programs are hidden by
   default. Reads as a caveat, not an error: the row is real data. */
.report-banner{
    margin: 10px 0 0;
    padding: 8px 10px;
    border-left: 3px solid #d9a400;
    background: #fdf6e3;
    font-size: 12px;
    line-height: 1.5;
    color: var(--ce-ink);
}
.report-flags{
    margin: 4px 0 0;
    padding-left: 16px;
}
.report-flags code{
    font-size: 11px;
    word-break: break-all;
}

.report-groups{
    display: grid;
    gap: 10px;
}
.report-group{
    padding-bottom: 9px;
    border-bottom: 1px solid var(--ce-line);
}
.report-group:last-child{
    border-bottom: none;
    padding-bottom: 0;
}
.report-head{
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
}
.report-name{
    font-size: 12px;
    font-weight: 700;
    color: var(--ce-ink);
}
/* The API's own string, not a prettified version of it: the reader may be comparing
   this against the pipeline's report or asking the pipeline owner about it. */
.report-status{
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--ce-muted);
}
.report-info-only{
    padding: 0 5px;
    border-radius: 999px;
    background: var(--ce-sunken);
    font-size: 11px;
    color: var(--ce-muted);
    white-space: nowrap;
}

.qc-category,
.qc-tier{
    font-size: 11px;
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
