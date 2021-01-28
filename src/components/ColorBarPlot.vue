<template>
    <div :id="elementid">
        <div style="width: 800px">
            <br />
            <div v-if="this.category == 'Causal' " class="arrow-up causalclass"></div>
            <div v-if="this.category == 'Strong'" class="arrow-up strongclass"></div>
            <div v-if="this.category == 'Moderate'" class="arrow-up moderateclass"></div>
            <div v-if="this.category == 'Possible'" class="arrow-up possibleclass"></div>
            <div v-if="this.category == 'Potential'" class="arrow-up potentialclass"></div>
            <div v-if="this.category== 'Weak'" class="arrow-up weakclass"></div>
            <div v-if="this.category== 'Equivocal'" class="arrow-up equivocalclass"></div>
            <div v-if="this.category== 'No'" class="arrow-up noEvidenceclass"></div>
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
                        <div class="col-sm variationEquivocal">
                            <strong>Equivocal</strong>
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
