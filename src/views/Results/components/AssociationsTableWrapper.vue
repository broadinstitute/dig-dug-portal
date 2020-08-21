<template>
    <div>
        <associations-table
            v-if="associations && fullOverlappingPhenotypes"
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
import { isEqual } from "lodash";

export default Vue.component('associations-table-wrapper', {
    props: ['overlappingPhenotypes','locus','phenotypeMap'],
    data() {
        return {
            associations: null,
            fullOverlappingPhenotypes: null,
        }
    },
    components: {
        AssociationsTable
    },
    async created() {
        console.log('created', this.overlappingPhenotypes)
        this.getAssociationsForPhenotypes(this.overlappingPhenotypes);
    },
    methods: {
        getAssociationsForPhenotypes(phenotypes) {
            Promise.all(
                phenotypes.map(async (phenotype) => {
                    return await query('associations', `${phenotype},${this.locus}`, { limit: null });
                })
            ).then(results => {
                this.fullOverlappingPhenotypes = phenotypes.map(phenotype => this.phenotypeMap[phenotype]),
                this.associations = results.flatMap(id => id);
                this.$emit('broadcast', this.associations);
            });
        }
    },
    watch: {
        overlappingPhenotypes(newOverlappingPhenotypes, oldOverlappingPhenotypes) {
            if(!isEqual(newOverlappingPhenotypes, oldOverlappingPhenotypes)) {
                this.associations = null;
                this.getAssociationsForPhenotypes(newOverlappingPhenotypes);
            }
        }
    }
})
</script>
