<template>
    <div>
        <h1>Colocus Component</h1>
        <p>Gene Name: {{ geneName }}</p>
        <p>Loading: {{ loading }}</p>
        <p>Error: {{ error }}</p>
        <p>Data: {{ data }}</p>
        <b-table
            striped
            hover
            :items="data.results"
            :loading="loading"
        ></b-table>
    </div>
</template>

<script>
import Vue from "vue";
export default Vue.component("ColocusTable", {
    props: {
        geneName: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            loading: false,
            error: null,
            data: null,
            fields: [
                { key: "gene", label: "Gene" },
                { key: "coloc", label: "Coloc" },
                { key: "pval", label: "P-Value" },
                { key: "uuid", label: "ID" },
            ],
        };
    },
    mounted() {
        this.fetchData();
    },
    methods: {
        fetchData() {
            this.loading = true;
            fetch(
                `https://staging.amp.colocus.app/api/v1/coloc/?genes=${this.geneName}`
            )
                .then((response) => response.json())
                .then((data) => {
                    this.loading = false;
                    this.data = data;
                })
                .catch((error) => {
                    this.loading = false;
                    this.error = error.message;
                });
        },
    },
});
</script>

<style scoped></style>
