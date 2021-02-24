<template>
    <div :id="elementid">
        <div class="color-bar-plot-wrapper">
            <div class="row color-bars-wrapper">
                <div class="each-bar-section variationCausal">Causal</div>
                <div class="each-bar-section variationStrong">Strong</div>
                <div class="each-bar-section variationModerate">Moderate</div>
                <div class="each-bar-section variationPossible">Possible</div>
                <div class="each-bar-section variationPotential">Potential</div>
                <div class="each-bar-section variationWeak">Weak</div>
                <div class="each-bar-section variationEquivocal">Equivocal</div>
                <div class="each-bar-section variationNoEvidence">No Evidence</div>
            </div>
            <div class="row">
                <div class="each-bar-section">
                    <div v-if="this.category == 'Causal'" class="arrow-up causalclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'Strong'" class="arrow-up strongclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'Moderate'" class="arrow-up moderateclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'Possible'" class="arrow-up possibleclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'Potential'" class="arrow-up potentialclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'Weak'" class="arrow-up weakclass"></div>
                </div>
                 <div class="each-bar-section">
                    <div v-if="this.category == 'Equivocal'" class="arrow-up equivocalclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'No'" class="arrow-up noEvidenceclass"></div>
                </div>
            </div>
        </div>
    </div>
</template>


<script>
import Vue from "vue";

export default Vue.component("color-bar-plot", {
    props: {
        elementid: {
            type: String
        },
        category: {
            type: String,
            required: true,
            default: "NO"
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
