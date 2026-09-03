<template>
    <div class="scp-eval">
        <div class="scp-eval-axis scp-eval-hypothesis">
            <div class="scp-eval-axis-head">
                <span class="scp-eval-axis-title">Hypothesis</span>
                <button type="button" class="scp-eval-edit" @click="$emit('edit')">Edit</button>
            </div>
            <p class="scp-eval-axis-rationale">{{ hypothesisText }}</p>
        </div>

        <div class="scp-eval-status" v-if="loading">Evaluating hypothesis…</div>

        <template v-else>
            <div v-if="evaluation.missingRequiredSlots.length" class="scp-eval-callout" role="status">
                Missing {{ missingRequiredSlotsLabel }}
            </div>

            <div class="scp-eval-rubric">
                <div v-for="axis in rubricAxes" :key="axis.id" class="scp-eval-axis">
                    <div class="scp-eval-axis-head">
                        <span class="scp-eval-axis-title">{{ axis.label }}</span>
                        <span
                            class="scp-eval-axis-rating"
                            :class="{ 'is-unscored': !axis.data.scored }"
                        >
                            {{ axis.data.scored ? axis.data.rating : "Unscored — insufficient basis" }}
                        </span>
                    </div>
                    <p class="scp-eval-axis-rationale">{{ axis.data.rationale }}</p>
                </div>
            </div>

            <div class="scp-eval-slots">
                <div v-for="slot in requiredSlots" :key="slot.id" class="scp-eval-slot">
                    <span class="scp-eval-slot-label">{{ slot.label }}</span>
                    <span class="scp-eval-slot-value">{{ slot.data.value || "—" }}</span>
                    <span class="scp-eval-slot-confidence" :class="`is-${slot.data.confidence}`">
                        {{ slot.data.confidence }}
                    </span>
                </div>
                <div v-for="slot in modifierSlots" :key="slot.id" class="scp-eval-slot">
                    <span class="scp-eval-slot-label">{{ slot.label }}</span>
                    <span class="scp-eval-slot-value">{{ slot.data.value || "—" }}</span>
                    <span class="scp-eval-slot-confidence" :class="`is-${slot.data.confidence}`">
                        {{ slot.data.confidence }}
                    </span>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import {
    extractHypothesisEvaluation,
    emptyHypothesisEvaluation,
} from "./scopeHypothesisEvaluation.js";

const REQUIRED_SLOT_LABELS = {
    target: "Target",
    perturbation: "Perturbation",
    outcome: "Outcome",
};

const MODIFIER_LABELS = {
    cell_line: "Cell line",
    genetic_background: "Genetic background",
    dose_timepoint: "Dose / timepoint",
    tissue: "Tissue",
    comparator: "Comparator",
};

export default {
    name: "ScopeEvaluationPanel",
    props: {
        hypothesisText: {
            type: String,
            default: "",
        },
        preloadedEvaluation: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            loading: false,
            evaluation: emptyHypothesisEvaluation("Not yet evaluated."),
        };
    },
    computed: {
        rubricAxes() {
            return [
                { id: "precision", label: "Precision", data: this.evaluation.rubric.precision },
                { id: "falsifiability", label: "Falsifiability", data: this.evaluation.rubric.falsifiability },
            ];
        },
        requiredSlots() {
            return Object.keys(REQUIRED_SLOT_LABELS).map((id) => ({
                id,
                label: REQUIRED_SLOT_LABELS[id],
                data: this.evaluation.slots[id],
            }));
        },
        modifierSlots() {
            return Object.keys(MODIFIER_LABELS).map((id) => ({
                id,
                label: MODIFIER_LABELS[id],
                data: this.evaluation.slots.modifiers[id],
            }));
        },
        missingRequiredSlotsLabel() {
            return this.evaluation.missingRequiredSlots
                .map((id) => REQUIRED_SLOT_LABELS[id] || id)
                .join(", ");
        },
    },
    mounted() {
        if (this.preloadedEvaluation) {
            this.evaluation = this.preloadedEvaluation;
            this.$emit("evaluated", this.evaluation);
            return;
        }
        this.loadEvaluation();
    },
    methods: {
        async loadEvaluation() {
            this.loading = true;
            try {
                this.evaluation = await extractHypothesisEvaluation(this.hypothesisText);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[ScopeEvaluationPanel] evaluation failed", error);
                this.evaluation = emptyHypothesisEvaluation("Evaluation could not be completed.");
            } finally {
                this.loading = false;
                this.$emit("evaluated", this.evaluation);
            }
        },
    },
};
</script>

<style scoped>
.scp-eval {
    padding: 18px;
}

.scp-eval-status {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-eval-hypothesis {
    margin-bottom: 12px;
}

.scp-eval-edit {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
}

.scp-eval-edit:hover {
    color: var(--cfde-orange, #e07b39);
}

.scp-eval-callout {
    display: inline-block;
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    font-size: 13px;
    line-height: 1.35;
    padding: 8px 14px;
    border-radius: 999px;
    margin-bottom: 16px;
}

.scp-eval-rubric {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
}

.scp-eval-axis {
    padding: 14px 16px;
    border-radius: 10px;
    background: #fff;
}

.scp-eval-axis-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
}

.scp-eval-axis-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.scp-eval-axis-rating {
    font-size: 13px;
    font-weight: 600;
    text-transform: capitalize;
    color: var(--cfde-ink, #33363d);
}

.scp-eval-axis-rating.is-unscored {
    color: var(--cfde-muted, #6b6b6b);
    text-transform: none;
}

.scp-eval-axis-rationale {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.scp-eval-slots {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--cfde-border, #e6e1d6);
    border-radius: 10px;
    overflow: hidden;
}

.scp-eval-slot {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: #fff;
}

.scp-eval-slot-label {
    flex: 0 0 160px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.scp-eval-slot-value {
    flex: 1;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
}

.scp-eval-slot-confidence {
    flex: 0 0 auto;
    font-size: 13px;
    text-transform: capitalize;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-eval-slot-confidence.is-high {
    color: var(--cfde-blue, #2c5c97);
}
</style>
