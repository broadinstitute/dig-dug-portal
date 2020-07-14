<template>
    <result-card :title="title">
        <template #content>
            <!-- TODO: For posterity: would be interesting for tables to have selectable rows to trigger side-effects (like modifying sidebar or prompting popups/navs) -->
            <associations-table
                :associations="associations"
                :phenotypes="[{
                    description:'Coronary artery disease',
                    dichotomous:1,
                    group:'CARDIOVASCULAR',
                    name:'CAD',
                }]"
            ></associations-table>
        </template>
    </result-card>
</template>
<script>
import Vue from "vue"
import ResultCard from "./ResultCard"
import AssociationsTable from "@/components/AssociationsTable"

export default Vue.component('associations-result-card', {
    // TODO: Phenotypes
    props: ["title", "associations", "locus"],
    mounted() {
        console.log('associations-result-card', this.locus)
    },
    components: {
        ResultCard,
        AssociationsTable,
    },
})
</script>
