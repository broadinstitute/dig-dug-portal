<template>
    <div>
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
        <b-table
            :items="tableData"
            :per-page="perPage"
            :current-page="currentPage"
        ></b-table>
        <b-pagination
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
            aria-controls="my-table"
        ></b-pagination>
    </div>
</template>
<script>
import Vue from "vue";
import { match } from "@/utils/bioIndexUtils";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";

export default Vue.component("variant-search", {
    components: {
        CriterionListGroup,
        FilterEnumeration,
    },
    data() {
        return {
            searchCriteria: [],
            matchingGenes: [],
            perPage: 10,
            currentPage: 1,
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
        tableData() {
            if (
                this.$store.state.variants.data &&
                this.$store.state.variants.data.length
            ) {
                return this.$store.state.variants.data;
            } else {
                return [];
            }
        },
        rows() {
            if (this.tableData) return this.tableData.length;
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
            this.$store.dispatch("variants/query", {
                q: this.selectedGene,
            });
        },
    },
});
</script>
