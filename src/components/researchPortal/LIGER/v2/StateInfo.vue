<script>
import Vue from "vue";
import { pathValue, firstPathValue } from "../ligerApi";
import InfoTabs from "./InfoTabs.vue";
import TraitTable from "./TraitTable.vue";

// The Cell state tab's detail body.
//
// The header (identity, lede, expression figures, provenance) is always visible;
// everything else lives behind an inner tab, so the panel opens on a digest rather
// than on every table at once.
//
// Most of it needs no fetch: every field except traits comes from the
// `gene-program-cell-state-metadata-extended` row the canvas already loaded for its
// labels. Those rows are NESTED (`summary.`, `state.`, `curation.`, `marker_set.`,
// `scoring.`), so everything here reads through pathValue().
//
// Deliberately NOT shown, from the measured audit in ../DETAIL_DATA_CATALOGUE.md:
//
// - `summary.biological_description` / `short_description` -- the same text as the
//   lede on most states, a longer version of it on the rest.
// - `state.class`, `interpretation_status`, `release_class`, `portal_visibility`,
//   `qc_sensitivity`, `allow_hard_call`, `curation.provenance_warnings[]` --
//   pipeline classifications, not anything a portal reader can act on.
// - `quality.quality_badges[]` and `summary.portal_primary_badges[]` -- constants,
//   and identical to each other. The four curation constants collapse into one
//   provenance line instead of six badges.
export default Vue.component("StateInfo", {
    components: {
        InfoTabs,
        TraitTable
    },

    props: {
        state: {
            type: Object,
            required: true
        },
        metadata: {
            type: Object,
            default: null
        },
        matches: {
            type: Array,
            default: () => []
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
        },
        geneLabel: {
            type: String,
            default: ""
        }
    },

    data() {
        return {
            activeTab: "overview"
        };
    },

    computed: {
        tabs() {
            return [
                { key: "overview", label: "Overview" },
                { key: "markers", label: "Marker genes", count: this.markers.length },
                { key: "programs", label: "Associated programs", count: this.matches.length },
                { key: "traits", label: "Traits", count: this.traits ? this.traits.shown : null },
                { key: "methods", label: "Methods", count: this.methodRows.length + this.activityWeights.length }
            ];
        },

        lede() {
            return firstPathValue(this.metadata, [
                "summary.portal_user_summary",
                "summary.recommended_portal_summary"
            ]);
        },

        establishment() {
            return pathValue(this.metadata, "summary.portal_display_establishment");
        },

        // Four constants across every state, so they read as one provenance sentence
        // rather than four badges saying the same thing.
        provenance() {
            return [
                pathValue(this.metadata, "quality.quality_label"),
                pathValue(this.metadata, "curation.curated_by"),
                pathValue(this.metadata, "curation.curation_version"),
                pathValue(this.metadata, "curation.manual_review_status")
            ].filter((part) => !!part).join(" · ");
        },

        markers() {
            let markers = pathValue(this.metadata, "marker_set.markers");
            return Array.isArray(markers) ? markers : [];
        },

        markerGeneSetDescription() {
            return pathValue(this.metadata, "marker_set.gene_set_description");
        },

        // Rolled up from the markers, so they are linked on the chips rather than
        // listed separately -- a separate list restates the same papers with the
        // gene attribution thrown away.
        citations() {
            let seen = {};
            let out = [];

            this.markers.forEach((marker) => {
                (marker.citations || []).forEach((citation) => {
                    let id = citation.citation_id || citation.citation_label;

                    if (id && !seen[id]) {
                        seen[id] = true;
                        out.push(citation);
                    }
                });
            });

            return out;
        },

        geneGuidance() {
            return this.presentRows([
                ["If your gene is enriched here", "summary.gene_expression_interpretation"],
                ["Caveat", "summary.gene_expression_caveat"],
                ["What to check next", "summary.gene_expression_followup"],
                ["Do not conclude", "summary.gene_expression_overinterpretation_warning"]
            ]);
        },

        // The last two sat behind `||` fallbacks after their always-populated
        // gene-facing counterparts in v1, so neither was ever shown.
        stateGuidance() {
            return this.presentRows([
                ["How to use this state", "summary.recommended_portal_summary"],
                ["Composite caveat", "summary.interpretation_caveat"],
                ["Not a marker of", "summary.do_not_overinterpret_as"],
                ["Required supporting evidence", "summary.required_supporting_evidence"],
                ["Curation notes", "summary.curation_notes"]
            ]);
        },

        // Fully populated on every state and never rendered anywhere in v1.
        methodRows() {
            return this.presentRows([
                ["Primary score", "scoring.primary_score"],
                ["Secondary score", "scoring.secondary_score"],
                ["Score scope", "state.score_scope"],
                ["Hard-call policy", "scoring.hard_call_policy"],
                ["Hard-call notes", "state.hard_call_notes"],
                ["Methods", "summary.portal_methods_details"]
            ]);
        },

        activityWeights() {
            let weights = pathValue(this.metadata, "scoring.activity_weights");
            return Array.isArray(weights) ? weights : [];
        },

        topMatches() {
            return this.matches.slice(0, 4);
        },

        topMarkers() {
            return this.markers.slice(0, 8);
        },

        topTraits() {
            return this.traits ? this.traits.rows.slice(0, 5) : [];
        }
    },

    watch: {
        // A new entity should be read from the top.
        state() {
            this.activeTab = "overview";
        }
    },

    methods: {
        presentRows(pairs) {
            return pairs
                .map(([label, path]) => ({ label, value: pathValue(this.metadata, path) }))
                .filter((row) => !!row.value)
                .map((row) => ({ ...row, value: String(row.value) }));
        },

        markerCitations(marker) {
            return (marker.citations || []).filter((citation) => !!citation.url);
        }
    }
});
</script>

<template>
    <div class="entity-info">
        <div class="info-head">
            <span class="head-swatch" :style="{ background: state.color }"></span>
            <div class="head-titles">
                <div class="info-eyebrow">Cell state</div>
                <h4 class="info-title">{{ state.label }}</h4>
                <div v-if="lede" class="info-lede">{{ lede }}</div>
            </div>

            <div class="head-metrics">
                <div class="metric">
                    <span class="metric-label">Expression</span>
                    <span class="metric-value">{{ state.absText }}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Specificity</span>
                    <span
                        class="metric-value"
                        :class="state.specDirection ? 'dir-' + state.specDirection : 'dir-none'"
                    >{{ state.specText }}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">p-value</span>
                    <span class="metric-value">{{ state.pValueText }}</span>
                </div>
                <div v-if="geneLabel" class="metric-note">for {{ geneLabel }}</div>
            </div>
        </div>

        <div v-if="!metadata" class="info-missing">
            No curation metadata loaded for this state. The expression figures above come from the
            expression index and are unaffected.
        </div>

        <info-tabs v-model="activeTab" :tabs="tabs" />

        <!-- Overview is a digest, not a dump: the full tables are behind their own
             tabs, so this is previews plus the guidance a reader needs first. -->
        <template v-if="activeTab === 'overview'">
            <div class="info-grid">
                <section class="info-section">
                    <h5 class="section-title">
                        Marker genes
                        <span class="section-note">Top {{ topMarkers.length }}</span>
                    </h5>
                    <div v-if="topMarkers.length" class="marker-chips">
                        <span v-for="marker in topMarkers" :key="marker.gene" class="marker">{{ marker.gene }}</span>
                    </div>
                    <div v-else class="section-empty">No marker set reported.</div>
                </section>

                <section class="info-section">
                    <h5 class="section-title">
                        Top matching programs
                        <span v-if="topMatches.length" class="section-note">Top {{ topMatches.length }} by GSEA P</span>
                    </h5>
                    <ul v-if="topMatches.length" class="preview-list">
                        <li v-for="match in topMatches" :key="match.key">
                            <span class="preview-text" :title="match.label">{{ match.label }}</span>
                        </li>
                    </ul>
                    <div v-else class="section-empty">
                        No program associations under the current edge filter.
                    </div>
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

            <section v-if="geneGuidance.length" class="info-section">
                <h5 class="section-title">
                    Interpreting <template v-if="geneLabel">{{ geneLabel }}</template><template v-else>a gene</template> in this state
                </h5>
                <dl class="guidance">
                    <template v-for="row in geneGuidance">
                        <dt :key="row.label + '-l'">{{ row.label }}</dt>
                        <dd :key="row.label + '-v'">{{ row.value }}</dd>
                    </template>
                </dl>
            </section>

            <section v-if="stateGuidance.length" class="info-section">
                <h5 class="section-title">How to read this state</h5>
                <dl class="guidance">
                    <template v-for="row in stateGuidance">
                        <dt :key="row.label + '-l'">{{ row.label }}</dt>
                        <dd :key="row.label + '-v'">{{ row.value }}</dd>
                    </template>
                </dl>
            </section>
        </template>

        <section v-else-if="activeTab === 'markers'" class="info-section">
            <h5 class="section-title">
                Marker genes
                <span class="section-count">{{ markers.length }}</span>
            </h5>
            <div v-if="markerGeneSetDescription" class="section-lead">{{ markerGeneSetDescription }}</div>

            <table v-if="markers.length" class="data-table">
                <thead>
                    <tr>
                        <th>Gene</th>
                        <th>Role</th>
                        <th>Evidence</th>
                        <th>Notes</th>
                        <th>Sources</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="marker in markers" :key="marker.gene">
                        <td class="marker-gene">{{ marker.gene }}</td>
                        <td>{{ marker.role || "—" }}</td>
                        <td>{{ marker.evidence_level || "—" }}</td>
                        <td>{{ marker.marker_notes || "—" }}</td>
                        <td>
                            <a
                                v-for="citation in markerCitations(marker)"
                                :key="citation.citation_id || citation.url"
                                class="cite-link"
                                :href="citation.url"
                                target="_blank"
                                rel="noopener"
                            >{{ citation.citation_label || citation.citation_id }}</a>
                            <span v-if="!markerCitations(marker).length">—</span>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-else class="section-empty">No marker set reported.</div>

            <div v-if="citations.length" class="section-foot">
                {{ citations.length }} distinct cited source<span v-if="citations.length !== 1">s</span>.
            </div>
        </section>

        <section v-else-if="activeTab === 'programs'" class="info-section">
            <h5 class="section-title">
                Associated gene programs
                <span class="section-count">{{ matches.length }}</span>
            </h5>
            <table v-if="matches.length" class="match-table">
                <thead>
                    <tr>
                        <th>Program</th>
                        <th class="num">GSEA P</th>
                        <th class="num">GSEA q</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="match in matches" :key="match.key" @click="$emit('select-program', match)">
                        <td>{{ match.label }}</td>
                        <td class="num">{{ match.gseaText }}</td>
                        <td class="num">{{ match.qText }}</td>
                    </tr>
                </tbody>
            </table>
            <!-- Not the same as "no association": the edges are filtered, and gsea_p
                 is null on a large fraction of heatmap rows. -->
            <div v-else class="section-empty">
                No program associations under the current edge filter.
            </div>
        </section>

        <section v-else-if="activeTab === 'traits'" class="info-section">
            <h5 class="section-title">Human genetic trait associations</h5>
            <trait-table :traits="traits" :loading="loadingTraits" :error="traitError" />
        </section>

        <section v-else class="info-section">
            <h5 class="section-title">Scoring and methods</h5>

            <dl v-if="methodRows.length" class="guidance">
                <template v-for="row in methodRows">
                    <dt :key="row.label + '-l'">{{ row.label }}</dt>
                    <dd :key="row.label + '-v'">{{ row.value }}</dd>
                </template>
            </dl>

            <template v-if="activityWeights.length">
                <h5 class="section-title sub">Activity weights</h5>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Component</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="weight in activityWeights" :key="weight.id || weight.label">
                            <td>{{ weight.label || weight.id }}</td>
                            <td>{{ weight.description || "—" }}</td>
                        </tr>
                    </tbody>
                </table>
            </template>

            <div v-if="!methodRows.length && !activityWeights.length" class="section-empty">
                No methods detail reported for this state.
            </div>
        </section>

        <div v-if="establishment || provenance" class="info-provenance">
            <span v-if="establishment" class="establishment">{{ establishment }}</span>
            <span v-if="provenance">{{ provenance }}</span>
        </div>
    </div>
</template>

<style scoped src="./entityInfo.css"></style>
