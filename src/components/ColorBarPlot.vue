<template>
    <div :id="elementid">
        <div style="width: 700px">
            <br />
            <div
                v-if="determineCategory(this.bayesfactor) == 'CAUSAL' "
                class="arrow-up causalclass"
            ></div>
            <div
                v-if="determineCategory(this.bayesfactor) == 'STRONG'"
                class="arrow-up strongclass"
            ></div>
            <div
                v-if="determineCategory(this.bayesfactor) == 'MODERATE'"
                class="arrow-up moderateclass"
            ></div>
            <div
                v-if="determineCategory(this.bayesfactor) == 'POSSIBLE'"
                class="arrow-up possibleclass"
            ></div>
            <div
                v-if="determineCategory(this.bayesfactor) == 'POTENTIAL'"
                class="arrow-up potentialclass"
            ></div>
            <div v-if="determineCategory(this.bayesfactor) == 'WEAK'" class="arrow-up weakclass"></div>
            <div
                v-if="determineCategory (this.bayesfactor)== 'NO'"
                class="arrow-up noEvidenceclass"
            ></div>
            <div>
                <div class="container">
                    <div class="row">
                        <div class="col-sm variationCausal">
                            <strong>Causal</strong>
                        </div>
                        <div class="col-sm variationStrong">
                            <strong>Strong</strong>
                        </div>
                        <div class="col-sm variationModerate">
                            <strong>Moderate</strong>
                        </div>
                        <div class="col-sm variationPossible">
                            <strong>Possible</strong>
                        </div>
                        <div class="col-sm variationPotential">
                            <strong>Potential</strong>
                        </div>
                        <div class="col-sm variationWeak">
                            <strong>Weak</strong>
                        </div>
                        <div class="col- variationNoEvidence">
                            <strong>No Evidence</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<script>
import Vue from "vue";

export default Vue.component("color-bar-plot", {
    props: ["elementid", "bayesfactor"],

    data() {
        return {};
    },
    components: {},

    mounted() {},
    methods: {
        determineCategory(bayesfactor) {
            let category;
            if (bayesfactor < 2.1) {
                category = "NO";
            } else if (bayesfactor >= 2.1 && bayesfactor < 7.26) {
                category = "WEAK";
            } else if (bayesfactor >= 7.26 && bayesfactor < 16.5) {
                category = "POTENTIAL";
            } else if (bayesfactor >= 16.5 && bayesfactor < 36.3) {
                category = "POSSIBLE";
            } else if (bayesfactor >= 36.3 && bayesfactor < 82.5) {
                category = "MODERATE";
            } else if (bayesfactor >= 82.5 && bayesfactor < 1650) {
                category = "STRONG";
            } else if (bayesfactor >= 1650) {
                category = "CAUSAL";
            }
            return category;
        }
    },

    computed: {},

    watch: {}
});
</script>
