<template>
    <div :id="elementid">
        <div style="width: 700px">
            <br />
            <div v-if="this.category == 'CAUSAL' " class="arrow-up causalclass"></div>
            <div v-if="this.category == 'STRONG'" class="arrow-up strongclass"></div>
            <div v-if="this.category == 'MODERATE'" class="arrow-up moderateclass"></div>
            <div v-if="this.category == 'POSSIBLE'" class="arrow-up possibleclass"></div>
            <div v-if="this.category == 'POTENTIAL'" class="arrow-up potentialclass"></div>
            <div v-if="this.category == 'WEAK'" class="arrow-up weakclass"></div>
            <div v-if="this.category == 'NO'" class="arrow-up noEvidenceclass"></div>
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
    props: {
        category: {
            type: String,
            required: true,
            default: "NO"
        },
        elementid: {
            type: String
        }
    },

    data() {
        return {};
    },
    components: {},

    mounted() {},
    methods: {},

    computed: {},

    watch: {}
});
</script>
