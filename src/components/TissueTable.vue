<template>
    <div id="tissues">
        <b-table
            hover
            small
            responsive="sm"
            :items="tableData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
        </b-table>
        <b-pagination
            v-model="currentPage"
            :total-rows="tissueData.length"
            :per-page="perPage"
        >
        </b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
export default Vue.component("tissue-table", {
    props: {
        tissueData: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "gene",
                    label: "Gene",
                },
                {
                    key: "meanTpm",
                    label: "Mean TPM",
                },
                {
                    key: "evidence",
                    label: "Evidence",
                },
                {
                    key: "links",
                    label: "Gene Links",
                },
            ],
        };
    },
    computed: {
        tableData() {
            return this.tissueData;
        },
    },
});
</script>
