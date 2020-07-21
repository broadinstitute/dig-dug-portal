<template>
    <div>
        <!--
            List of Toolbar Objects defined by their incoming data
                Assort between different data types
                    Match to Variant, to Region, to Gene, or Phenotype
                    Produce Menu
                       With Links/Options to Satisfy Full Queries
                       With Links/Options to Satisfy Partial Queries
                          And autocompletes that provide already-hit options prioritized first
        -->

        <!--
            For Regions:
            * Region => go to other region card
            - Annotation-Method (!!!)
            - Tissue => go to tissue card
         -->

        <div class="results-nav-container">
            <!-- Region Navs -->
            <results-nav v-for="(regionData, i) in regions"
                        :key="locusFrom(regionData)+i"
                        :queryKey="'regions'"
                        :showCompoundIndexes="true"
                        :inputValue="locusFrom(regionData)"
                        @pushQuery="$emit('pushQuery', $event)">
            </results-nav>
            <!-- TODO: Annotation-Method Navs -->
            <results-nav v-for="(annotationWithMethod, i) in annotationsWithMethods"
                        :key="annotationWithMethod+i"
                        :queryKey="'annotated-regions'"
                        :showCompoundIndexes="true"
                        :inputValue="locusFrom(regionData)"
                        @pushQuery="$emit('pushQuery', $event)">
            </results-nav>
            <!-- TODO: Tissue Navs? -->
        </div>
    </div>

</template>

<script>
import Vue from "vue";
import ResultsNav from "../navs/ResultsNav"
import Formatters from "@/utils/formatters.js"
export default Vue.component("regions-results-sidebar", {
    props: ["regions"],
    components: {
        ResultsNav
    },
    methods: {
         locusFrom({ chromosome, start, end}) {
            return Formatters.locusFormatter(chromosome, start, end);
        }
    }
})
</script>
<style scoped>
    .results-nav-container {
        height: 500px;
        width: 200%;
        overflow-y: scroll;
    }
</style>
