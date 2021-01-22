<template>
    <div>
        <b-container>
            <criterion-list-group
                v-model="searchCriteria"
                :header="'Search Criteria'"
            >
                <filter-enumeration-control
                    ref="gene"
                    :field="'gene'"
                    placeholder="Select a gene ..."
                    :options="matchingGenes"
                    @input-change="lookupGenes($event)"
                >
                    <div class="label">Gene</div>
                </filter-enumeration-control>
            </criterion-list-group>
            <div class="function">
                <b-button variant="primary" @click="searchVariants"
                    >Search Variants</b-button
                >
            </div>
            <b-table></b-table>
        </b-container>
    </div>
</template>
<script>
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";

export default {
    name: "VariantSearch",
    components: {
        CriterionListGroup,
        FilterEnumeration,
    },
    data() {
        return {
            searchCriteria: [],
            matchingGenes: [],
        };
    },
    computed: {
        selectedGene() {
            return this.searchCriteria
                .filter((v) => {
                    return v.field === "gene";
                })
                .map((v) => v.threshold);
        },
    },
    methods: {
        async lookupGenes(input) {
            if (!!input) {
                let matches = await match("gene", input, { limit: 10 });
                this.matchingGenes = matches;
            }
        },
        searchVariants() {
            this.$store.dispatch("gene/query", {
                q: this.selectedGene,
            });
        },
    },
};
</script>
