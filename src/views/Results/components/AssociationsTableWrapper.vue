<template>
    <div>
        <associations-table
            v-if="associations"
            :associations="associations"
            :phenotypes="fullOverlappingPhenotypes"
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

export default Vue.component('associations-table-wrapper', {
    props: ['overlappingPhenotypes','locus','phenotypeMap'],
    data() {
        return {
            associations: null,
            fullOverlappingPhenotypes: this.overlappingPhenotypes.map(phenotype => this.phenotypeMap[phenotype]),
        }
    },
    components: {
        AssociationsTable
    },
    async created() {

        const tempPhenotypes = this.overlappingPhenotypes;  // .split(',').map(prePhenotype => prePhenotype.trim()) //.concat('HEIGHT');
        Promise.all(
            tempPhenotypes.map(async (phenotype) => {
                return await query('associations', `${phenotype},${this.locus}`, { limit: null });
            })
        ).then(results => {
            this.associations = results.flatMap(id => id);
            this.$emit('broadcast', this.associations);
        });

    },
})
</script>
