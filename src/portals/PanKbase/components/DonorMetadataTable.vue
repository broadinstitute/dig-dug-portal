<template>
    <div>
        <div class="download-button">
            <data-download
                :data="tableData"
                filename="pankbase_functional_donor_metadata_filtered">
            </data-download>
        </div>
        {{ tableData.length }} results
        <b-table
            small
            :items="tableData"
            :fields="fields"
            :sortable="true"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template #cell(Accession)="r">
                <a :href="`https://data.pankbase.org/human-donors/${r.item.Accession}/`">
                    {{ r.item.Accession }}
                </a>
            </template>
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
        "metadata", "filter", "fieldsObject", "minSuffix"
    ],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            processedMetadata: [],
        };
    },
    mounted(){
        this.processedMetadata = this.preprocessData(this.metadata);
    },
    computed: {
        tableData() {
            let data = structuredClone(this.processedMetadata);
            if (this.filter) {
                data = data.filter(this.filter);
            }
            return data;
        },
        fields(){
            return Object.values(this.fieldsObject).filter(f => !f.isMinimum);
        }
    },
    methods: {
        preprocessData(inputData){
            // duplicate fields to allow filtering on two thresholds (min and max)
            let rangeFields = Object.values(this.fieldsObject).filter(f => !!f.isMinimum);
            for (let i = 0; i < inputData.length; i++){
                let entry = inputData[i];
                for(let j = 0; j < rangeFields.length; j++){
                    let field = rangeFields[j];
                    let newFieldName = `${field.key}${this.minSuffix}`;
                    entry[newFieldName] = entry[field.key];
                }
            }
            return inputData;
        }
    },
    watch: {
        tableData(newData){
            let filteredDonors = newData.map(m => m.Accession);
            this.$emit("filteredDonors", filteredDonors);
        }
    }
});
</script>
<style scoped>
    .download-button {
        display: flex;
        justify-content: right;
    }
</style>