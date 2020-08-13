<template>
    <div>
        <associations-table
            v-if="associations"
            :associations="associations"
            :phenotypes="phenotypes"
        ></associations-table>
        <div v-else-if="!associations">
            Loading
        </div>
    </div>
</template>
<script>
import Vue from "vue"
import AssociationsTable from "@/components/AssociationsTable.vue"

import { query } from "@/utils/bioIndexUtils"

export default Vue.component('phenotype-associations-table-wrapper', {
    props: ['phenotype','phenotypeMap'],
    data() {
        return {
            associations: null,
            phenotypes: [this.phenotypeMap[this.phenotype]]
        }
    },
    components: {
        AssociationsTable
    },
    async created() {
        await query('gwas-associations', this.phenotype, { limit: null, finishHandler: results => { this.associations = results.data } })
    },
})
</script>
