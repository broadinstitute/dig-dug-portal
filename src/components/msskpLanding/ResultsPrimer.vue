<template>
    <div class="msskp-landing-results-primer">
        <div class="msskp-landing-results-primer-row">
            <div class="msskp-landing-results-primer-label">
                <div class="msskp-landing-results-primer-title">
                    {{ entityType }}
                </div>
            </div>
            <div class="msskp-landing-results-primer-entity">
                {{ entityName }}
            </div>
        </div>
        <div
            v-for="category in categories"
            :key="category.title"
            class="msskp-landing-results-primer-row"
        >
            <div class="msskp-landing-results-primer-label">
                <div class="msskp-landing-results-primer-title">
                    {{ category.title }}
                </div>
                <div class="msskp-landing-results-primer-question">
                    {{ category.question }}
                </div>
            </div>
            <div class="msskp-landing-results-primer-options">
                <div
                    v-for="option in category.options"
                    :key="option"
                    class="msskp-landing-results-primer-option"
                >
                    {{ option }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("msskp-landing-results-primer", {
    props: {
        entityType: {
            type: String,
            default: "Gene",
        },
        entityName: {
            type: String,
            default: "WNT16",
        },
        categories: {
            type: Array,
            default() {
                return [
                    {
                        title: "Human Genetic Evidence",
                        question: "Is this gene implicated?",
                        options: ["HuGE", "Gene Associations", "Rare Variants"],
                    },
                    {
                        title: "Regional Genetics",
                        question: "What variants and locus support it?",
                        options: [
                            "Locus Plot",
                            "Variant Sifter",
                            "Credible Sets",
                        ],
                    },
                    {
                        title: "Functional Mechanisms",
                        question: "How might those variants act?",
                        options: [
                            "Variant Consequences",
                            "TF Binding",
                            "Effector Genes",
                        ],
                    },
                    {
                        title: "Biological Context",
                        question:
                            "Where is the gene active, what cell states and gene programs are associated with its expression, and how does gene expression compare between species?",
                        options: [
                            "Tissue Expression",
                            "Cell States",
                            "Single Cell",
                            "Human > Mouse Comparator",
                        ],
                    },
                    {
                        title: "Evidence Integration",
                        question: "What's the overall conclusion?",
                        options: ["Summary", "Supporting Datasets"],
                    },
                ];
            },
        },
    },
});
</script>

<style>
.msskp-landing-results-primer {
    padding: 25px;
    background-color: #cccccc;
    border-radius: 20px;
}

.msskp-landing-results-primer-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 20px;
    margin-bottom: 16px;
    align-items: start;
}

.msskp-landing-results-primer-title {
    font-weight: 700;
    font-size: 16px;
    line-height: 1.3;
}

.msskp-landing-results-primer-question {
    font-size: 14px;
    font-weight: 400;
    color: #333;
    margin-top: 2px;
}

.msskp-landing-results-primer-entity {
    font-size: 16px;
    padding: 2px 0;
}

.msskp-landing-results-primer-options {
    padding-left: 14px;
    border-left: #fff solid 1px;
}

.msskp-landing-results-primer-option {
    font-size: 15px;
    line-height: 1.6;
}
</style>
