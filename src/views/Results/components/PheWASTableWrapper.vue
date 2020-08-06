<template>
    <div>
        <phewas-table
            :associations="associations"
            :phenotypeMap="phenotypeMap"
        ></phewas-table>
    </div>
</template>
<script>
import Vue from "vue"
import PheWASTable from "@/components/PheWASTable.vue"

import { query } from "@/utils/bioIndexUtils"

export default Vue.component('phewas-table-wrapper', {
    props: ['varId','phenotypeMap'],
    data() {
        return {
            associations: null,
        }
    },
    components: {
        PheWASTable
    },
    async created() {
        await query('phewas-associations', this.varId, { limit: null, finishHandler: results => { this.associations = results.data } })
    },
})
</script>
