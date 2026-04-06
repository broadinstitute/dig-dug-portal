<template>
    <div>
        {{ tableData.length }} results
        <b-table
            small
            :items="tableData"
            :fields="fields"
            :sortable="true"
            :per-page="perPage"
            :current-page="currentPage"
        >
        </b-table>
    <b-pagination
        class="pagination-md justify-content-center"
        v-model="currentPage"
        :per-page="perPage"
        :total-rows="tableData.length">
    </b-pagination>    
    </div>
</template>
<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
import keyParams from "@/utils/keyParams";

const BIO_INDEX_HOST = "https://bioindex.pankbase.org";
export default Vue.component("donor-metadata-table", {
    components: {
        DataDownload,
    },
    props: [
        "metadata", "filter"
    ],
    data() {
        return {
            perPage: 10,
            currentPage: 1
        };
    },
    mounted(){
    },
    computed: {
        tableData() {
            let data = structuredClone(this.metadata);
            if (this.filter) {
                data = data.filter(this.filter);
            }
            return data;
        },
        fields(){
            let rawFields = 
                [
                    "Accession",
                    "Center Donor ID",
                    "RRID",
                    "Collections",
                    "Ethnicities",
                    "Age (years)",
                    "Gender","BMI",
                    "C-Peptide (ng/ml)",
                    "Derived diabetes status",
                    "Diabetes Duration (years)",
                    "Donation Type",
                    "HbA1C (percentage)",
                    "Cause of Death"
                ]
            return rawFields;
        }
    },
    methods: {},
    watch: {
        tableData(newData){
            let filteredDonors = newData.map(m => m.Accession);
            this.$emit("filteredDonors", filteredDonors);
        }
    }
});
</script>