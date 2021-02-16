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
            <b-col class="divider"></b-col>
            <filter-enumeration-control
                ref="dataset"
                :field="'dataset'"
                placeholder="Select a dataset ..."
                :options="datasets"
                :multiple="true"
            >
                <div class="label">Dataset</div></filter-enumeration-control
            >
        </criterion-list-group>
        <div class="function">
            <b-button variant="primary" @click="searchVariants"
                >Search Variants</b-button
            >
        </div>
        <b-table
            :items="$options.testData"
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
import testData from "@/views/VariantSearch/data.json";

export default Vue.component("variant-search", {
    testData,
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
            datasets: ["dataset1", "dataset2"],
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
        selectedDataset() {
            return this.searchCriteria
                .filter((v) => {
                    return v.field === "dataset";
                })
                .map((v) => v.threshold);
        },
        baseFields() {
            let fields = Object.keys(testData[0]);
            return fields.filter((v) => v !== "datasets");
        },
        datasetFields() {
            let data1Fields = testData[0].datasets[0].data;
        },
        tableFields() {
            if (this.selectedDataset.length > 0) {
                return testData.filter((v) => {
                    console.log(v);

                    return v.datasets.every((d) => {
                        console.log("d", d.name);
                        console.log("selected", this.selectedDataset);
                        let ans = this.selectedDataset.includes(d.name);
                        console.log("ans", ans);
                        return ans;
                    });
                });
                //return testData[0].datasets;
            } else return [];
        },
        //This works to display all data fro BI
        // tableData() {
        //     if (
        //         this.$store.state.variants.data &&
        //         this.$store.state.variants.data.length
        //     ) {
        //         return this.$store.state.variants.data;
        //     } else {
        //         return [];
        //     }
        // },
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
