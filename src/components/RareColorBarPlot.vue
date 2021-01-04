<template>
    <div :id="elementid">
        <div style="width: 700px">
            <br />
            <div v-if="this.category == 'CAUSAL' " class="arrow-up rarecausalclass"></div>
            <div v-if="this.category == 'STRONG'" class="arrow-up rarestrongclass"></div>
            <div v-if="this.category == 'MODERATE'" class="arrow-up raremoderateclass"></div>
            <div v-if="this.category == 'POSSIBLE'" class="arrow-up rarepossibleclass"></div>
            <div v-if="this.category == 'POTENTIAL'" class="arrow-up rarepotentialclass"></div>
            <div v-if="this.category== 'WEAK'" class="arrow-up rareweakclass"></div>
            <div v-if="this.category== 'NO'" class="arrow-up rarenoEvidenceclass"></div>
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

export default Vue.component("rare-color-bar-plot", {
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
