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
        <div class="results-nav-container">
            <!-- Region Navs -->
            <!-- <results-nav v-for="(regionData, i) in regions"
                    :key="locusFrom(regionData)+i"
                    :queryKey="'regions'"
                    :showCompoundIndexes="true"
                    :inputValue="locusFrom(regionData)"
                    @pushQuery="$emit('pushQuery', $event)">
            </results-nav> -->
            <!-- TODO: Variant Navs -->
            <div v-for="variant in variantIDs" :key="variant">
                <a @click="$emit('pushQuery', { index: 'variant', queryString: `${variant}`})">{{ variant }}</a>
            </div>
            <!-- TODO: Gene Navs? -->
        </div>
    </div>

</template>

<script>
import Vue from "vue";
import ResultsNav from "../navs/ResultsNav"
import Formatters from "@/utils/formatters.js"
export default Vue.component("associations-results-sidebar", {
    props: ["associations"],
    components: {
        ResultsNav
    },
    computed: {
        variantIDs() {
            console.log(this.associations)
            return this.associations.map(association => association.varId);
        },
        genes() {
            console.log(this.associations)
            return this.associations.map(association => association.gene);
        }
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
