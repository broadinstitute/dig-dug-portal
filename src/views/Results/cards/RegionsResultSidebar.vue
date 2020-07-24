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
            <!-- TODO: Method is a filter! do we want to pass filters to pushQuery? -->
            <!-- <results-nav v-for="(annotationWithMethod, i) in annotationWithMethod"
                        :key="annotationWithMethod+i"
                        :queryKey="'annotated-regions'"
                        :showCompoundIndexes="true"
                        :inputValue="locusFrom(regionData)"
                        @pushQuery="$emit('pushQuery', $event)">
            </results-nav> -->

            <!-- TODO: making this generic? i.e. a tooltip? -->
            <!-- TODO: Method is a filter! do we want to pass filters to pushQuery? -->
            <div v-for="annotation in annotations" :key="annotation">
                <a @click="$emit('pushQuery', { index: 'annotated-regions', queryString: `${annotation},${metadata.locusOrGene}`})">{{annotation}}</a>
            </div>

        </div>
    </div>

</template>

<script>
import Vue from "vue";
import ResultsNav from "../navs/ResultsNav"
import Formatters from "@/utils/formatters.js"
import _ from "lodash";

export default Vue.component("regions-results-sidebar", {
    props: ["regions", "metadata"],
    components: {
        ResultsNav
    },
    computed: {
        annotations() {
            return _.uniq(this.regions.map(region => region.annotation))
        },
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
        width: 150%;
        overflow-y: scroll;
    }
</style>
