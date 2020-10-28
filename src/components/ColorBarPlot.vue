<template>
    <div>
        <div style="width: 600px">
            <br />
            <div
                v-if="
                                        $parent.rareVariationCategoryAndScore
                                            .categoryScore +
                                            $parent
                                                .commonVariationCategoryAndScore
                                                .categoryScore >=
                                        5
                                    "
                class="arrow-up causalclass"
            ></div>
            <div
                v-if="
                                        $parent.rareVariationCategoryAndScore
                                            .categoryScore +
                                            $parent
                                                .commonVariationCategoryAndScore
                                                .categoryScore ==
                                        4
                                    "
                class="arrow-up strongclass"
            ></div>
            <div
                v-if="
                                        $parent.rareVariationCategoryAndScore
                                            .categoryScore +
                                            $parent
                                                .commonVariationCategoryAndScore
                                                .categoryScore ==
                                        3
                                    "
                class="arrow-up moderateclass"
            ></div>
            <div
                v-if="
                                        $parent.rareVariationCategoryAndScore
                                            .categoryScore +
                                            $parent
                                                .commonVariationCategoryAndScore
                                                .categoryScore ==
                                        2
                                    "
                class="arrow-up possibleclass"
            ></div>
            <div
                v-if="
                                        $parent.rareVariationCategoryAndScore
                                            .categoryScore +
                                            $parent
                                                .commonVariationCategoryAndScore
                                                .categoryScore ==
                                        1
                                    "
                class="arrow-up weakclass"
            ></div>
            <div
                v-if="
                                        $parent.rareVariationCategoryAndScore
                                            .categoryScore +
                                            $parent
                                                .commonVariationCategoryAndScore
                                                .categoryScore <
                                        1
                                    "
                class="arrow-up noEvidenceclass"
            ></div>
            <div
                v-if="
                                        $parent.rareVariationCategoryAndScore
                                            .categoryScore +
                                            $parent
                                                .commonVariationCategoryAndScore
                                                .categoryScore ==
                                        0
                                    "
                class="arrow-up noEvidenceclass"
            ></div>
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
    props: ["categoryScore", "category"],

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
