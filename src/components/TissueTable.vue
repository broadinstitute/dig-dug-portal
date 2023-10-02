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
        <b-pagination> </b-pagination>
    </div>
</template>

<script>
export default {
    name: "TissueTable",
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
                    key: "minTpm",
                    label: "P-Value",
                },
                {
                    key: "nSamples",
                    label: "Samples",
                },
                {
                    key: "evidence",
                    label: "Gene Expression Evidence",
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
};
</script>
