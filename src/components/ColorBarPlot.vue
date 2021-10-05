
<template>
    <div :id="elementid">
        <div class="color-bar-plot-wrapper">
            <!-- <span>
                 {{this.score}} HuGe score
            </span>-->
            <div class="container">
                <span
                    class="center"
                    style="font-weight:bold;white-space: nowrap;"
                >HuGe score {{this.score}} falls in {{this.category}} evidence range</span>
            </div>
            <span
                style="font-size:12px; padding:40px 145px 40px 145px; white-space: nowrap;"
            >Compelling: HuGe Score >= 350 | Extreme: >=100 | Very Strong: >=30 | Strong: >=10 | Moderate: >=3 | Anecdotal: >1 | No Evidence: <=1</span>
            <div class="row color-bars-wrapper">
                <div class="each-bar-section variationStrong">Compelling</div>
                <div class="each-bar-section variationModerate">Extreme</div>
                <div class="each-bar-section variationPossible">Very Strong</div>
                <div class="each-bar-section variationPotential">Strong</div>
                <div class="each-bar-section variationWeak">Moderate</div>
                <div class="each-bar-section variationEquivocal">Anecdotal</div>
                <div class="each-bar-section variationNoEvidence">No Evidence</div>
            </div>
            <div class="row">
                <div class="each-bar-section">
                    <div v-if="this.category == 'Compelling'" class="arrow-up causalclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'Extreme'" class="arrow-up strongclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'Very Strong'" class="arrow-up moderateclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'Strong'" class="arrow-up possibleclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'Moderate'" class="arrow-up potentialclass"></div>
                </div>
                <div class="each-bar-section">
                    <div v-if="this.category == 'Anecdotal'" class="arrow-up weakclass"></div>
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
        },
        score: {
            type: Number,
            required: false,
            default: 1
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
