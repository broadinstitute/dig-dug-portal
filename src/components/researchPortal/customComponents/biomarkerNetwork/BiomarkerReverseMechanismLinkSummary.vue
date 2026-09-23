<template>
    <div v-if="summary" class="bn-mechanism-summary">
        <section class="bn-mechanism-summary__block">
            <h3 class="bn-mechanism-summary__heading">Overall summary</h3>
            <p class="bn-mechanism-summary__text">{{ summary.overall_summary || "—" }}</p>
            <div class="bn-mechanism-summary__meta">
                <span class="bn-mechanism-summary__badge">
                    Confidence: {{ summary.overall_confidence || "—" }}
                </span>
                <span class="bn-mechanism-summary__badge bn-mechanism-summary__badge--muted">
                    Grounding: {{ summary.grounding_level || "—" }}
                </span>
            </div>
            <p v-if="summary.confidence_rationale" class="bn-mechanism-summary__muted">
                {{ summary.confidence_rationale }}
            </p>
        </section>

        <section v-if="geneBridges.length" class="bn-mechanism-summary__block">
            <h3 class="bn-mechanism-summary__heading">Gene bridges</h3>
            <div
                v-for="(bridge, idx) in geneBridges"
                :key="'bridge-' + idx"
                class="bn-mechanism-summary__card"
            >
                <div class="bn-mechanism-summary__card-head">
                    <strong>{{ bridge.gene_symbol || "—" }}</strong>
                    <span class="bn-mechanism-summary__muted">
                        ·
                        {{ bridge.mechanism_count != null ? bridge.mechanism_count : "?" }}
                        mechanism{{ bridge.mechanism_count === 1 ? "" : "s" }}
                    </span>
                </div>
                <p class="bn-mechanism-summary__text">{{ bridge.connection_summary || "—" }}</p>
                <div class="bn-mechanism-summary__meta">
                    <span class="bn-mechanism-summary__badge">{{ bridge.confidence || "—" }}</span>
                    <span class="bn-mechanism-summary__badge bn-mechanism-summary__badge--muted">{{
                        bridge.grounding || "—"
                    }}</span>
                </div>
            </div>
        </section>

        <section v-if="highlighted.length" class="bn-mechanism-summary__block">
            <h3 class="bn-mechanism-summary__heading">Highlighted mechanisms</h3>
            <div
                v-for="(item, idx) in highlighted"
                :key="'mech-' + idx"
                class="bn-mechanism-summary__card"
            >
                <div class="bn-mechanism-summary__card-head">
                    <strong>{{ item.mechanism_label || "—" }}</strong>
                </div>
                <p class="bn-mechanism-summary__muted">
                    Support: {{ item.support || "—" }} · Genes: {{ formatGenes(item.genes) }}
                </p>
                <p class="bn-mechanism-summary__muted">Diseases: {{ item.diseases || "—" }}</p>
                <p class="bn-mechanism-summary__text">{{ item.brief_connection || "—" }}</p>
            </div>
        </section>

        <section v-if="causalSteps.length" class="bn-mechanism-summary__block">
            <h3 class="bn-mechanism-summary__heading">Proposed causal path</h3>
            <biomarker-mechanism-link-causal-network
                v-if="showCausalNetwork"
                variant="reverse"
                :summary="summary"
                :seed-biomarker-label="seedBiomarkerLabel"
            />
            <ul class="bn-mechanism-summary__steps">
                <li v-for="(step, idx) in causalSteps" :key="'step-' + idx">
                    <strong>{{ step.label }}:</strong> {{ step.text }}
                </li>
            </ul>
        </section>

        <section v-if="summary.disease_role_context" class="bn-mechanism-summary__block">
            <h3 class="bn-mechanism-summary__heading">Disease & role context</h3>
            <p class="bn-mechanism-summary__text">{{ summary.disease_role_context }}</p>
        </section>

        <section v-if="caveats.length" class="bn-mechanism-summary__block">
            <h3 class="bn-mechanism-summary__heading">Caveats & gaps</h3>
            <ul class="bn-mechanism-summary__list">
                <li v-for="(item, idx) in caveats" :key="'caveat-' + idx">{{ item }}</li>
            </ul>
        </section>
    </div>
</template>

<script>
import BiomarkerMechanismLinkCausalNetwork from "./BiomarkerMechanismLinkCausalNetwork.vue";
import {
    buildReverseCausalPathNetwork,
    causalPathNetworkHasContent,
} from "./biomarkerMechanismLinkNetwork.js";

const CAUSAL_LABELS = [
    ["step1_biomarker_gene_alteration", "Step 1 — Biomarker/gene alteration"],
    ["step2_disease_context", "Step 2 — Disease context"],
    ["step3_signaling_cellular_impact", "Step 3 — Signaling / cellular impact"],
    ["step4_mechanism_convergence", "Step 4 — Mechanism convergence"],
];

export default {
    name: "BiomarkerReverseMechanismLinkSummary",
    components: { BiomarkerMechanismLinkCausalNetwork },
    props: {
        summary: {
            type: Object,
            default: null,
        },
        seedBiomarkerLabel: {
            type: String,
            default: "Biomarker",
        },
    },
    computed: {
        geneBridges() {
            return Array.isArray(this.summary && this.summary.gene_bridges)
                ? this.summary.gene_bridges
                : [];
        },
        highlighted() {
            return Array.isArray(this.summary && this.summary.highlighted_mechanisms)
                ? this.summary.highlighted_mechanisms
                : [];
        },
        caveats() {
            return Array.isArray(this.summary && this.summary.caveats)
                ? this.summary.caveats.filter(Boolean)
                : [];
        },
        causalSteps() {
            const path =
                this.summary && this.summary.causal_path_summary
                    ? this.summary.causal_path_summary
                    : {};
            return CAUSAL_LABELS.map(([key, label]) => ({
                label,
                text: path[key] || "",
            })).filter((step) => String(step.text || "").trim());
        },
        showCausalNetwork() {
            return causalPathNetworkHasContent(
                buildReverseCausalPathNetwork(this.summary, this.seedBiomarkerLabel)
            );
        },
    },
    methods: {
        formatGenes(genes) {
            if (Array.isArray(genes)) return genes.filter(Boolean).join(", ") || "—";
            return String(genes || "").trim() || "—";
        },
    },
};
</script>

<style scoped>
.bn-mechanism-summary__block {
    margin-bottom: 14px;
}

.bn-mechanism-summary__block:last-child {
    margin-bottom: 0;
}

.bn-mechanism-summary__heading {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-blue, #1f4e79);
}

.bn-mechanism-summary__text {
    margin: 0 0 8px;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
}

.bn-mechanism-summary__muted {
    margin: 0 0 6px;
    font-size: 14px;
    line-height: 1.45;
    color: #666;
}

.bn-mechanism-summary__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
}

.bn-mechanism-summary__badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    background: #eef4fa;
    color: var(--cfde-blue, #1f4e79);
    font-size: 14px;
    font-weight: 600;
}

.bn-mechanism-summary__badge--muted {
    background: #f2f2f2;
    color: #555;
}

.bn-mechanism-summary__card {
    margin-bottom: 8px;
    padding: 8px 10px;
    border: 1px solid #ececec;
    border-radius: 4px;
    background: #fafafa;
}

.bn-mechanism-summary__card-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
}

.bn-mechanism-summary__steps,
.bn-mechanism-summary__list {
    margin: 0;
    padding-left: 1.15rem;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
}

.bn-mechanism-summary__steps li,
.bn-mechanism-summary__list li {
    margin-bottom: 4px;
}
</style>
