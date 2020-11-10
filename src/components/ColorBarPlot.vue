<template>
    <div>
        <div style="width: 700px">
            <br />
            <div v-if="this.category == 'CAUSAL' " class="arrow-up causalclass"></div>
            <div v-if="this.category == 'STRONG'" class="arrow-up strongclass"></div>
            <div v-if="this.category == 'MODERATE'" class="arrow-up moderateclass"></div>
            <div v-if="this.category == 'POSSIBLE'" class="arrow-up possibleclass"></div>
            <div v-if="this.category == 'WEAK'" class="arrow-up weakclass"></div>
            <div v-if="this.category == 'in GWAS'" class="arrow-up inGWASclass"></div>
            <div v-if="this.category == 'No'" class="arrow-up noEvidenceclass"></div>
            <div>
                <div class="container">
                    <div class="row">
                        <div class="col-sm combinedVariationCausal">
                            <strong>Causal</strong>
                        </div>
                        <div class="col-sm combinedVariationStrong">
                            <strong>Strong</strong>
                        </div>
                        <div class="col-sm combinedVariationModerate">
                            <strong>Moderate</strong>
                        </div>
                        <div class="col-sm combinedVariationPossible">
                            <strong>Possible</strong>
                        </div>
                        <div class="col-sm combinedVariationWeak">
                            <strong>Weak</strong>
                        </div>

                        <div class="col-sm combinedVariationInGWAS">
                            <strong>In GWAS</strong>
                        </div>

                        <div class="col- combinedVariationNoEvidence">
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
    props: ["category"],

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
