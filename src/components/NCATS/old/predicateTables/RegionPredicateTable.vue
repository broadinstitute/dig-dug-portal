<template>
    <translator-predicate-table
        :title="title"
        :geneSymbol="this.regionQuery"
        :field="field">
    </translator-predicate-table>
</template>
<script>
import Vue from "vue"
import PredicateTable from "@/components/NCATS/old/PredicateTable"
export default Vue.component('translator-region-predicate-table', {
    props: ["title", "chr", "start", "end", "region", "field", "filter"],
    components: {
        PredicateTable
    },
    computed: {
        regionQuery() {
            return !!this.region ? `chr${this.region}` :`chr${this.chr}:${this.commaNotation(this.start)}-${this.commaNotation(this.end)}`
        }
    },
    methods: {
        commaNotation(largeNumber) {
            function addCommas(intNum) {
                // first convert number to string using javascript's casting
                // regex: destruct a string into its digits and every third digit. replace every third digit with that digit and a comma.
                return (intNum + '').replace(/(\d)(?=(\d{3})+$)/g, '$1,');
            }
            return addCommas(largeNumber)
        }
    }
})
</script>
