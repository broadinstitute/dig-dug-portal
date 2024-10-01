<template>
    <div>
        <p>Loading: {{ loading }}</p>
        <p>Error: {{ error }}</p>
        <b-table
            striped
            hover
            :items="data.results"
            :loading="loading"
            :fields="fields"
        >
            <template #cell(study1)="data">
                <span>{{ data.item.signal1.analysis.study.uuid }}</span>
            </template>
            <template #cell(trait1)="data">
                <span>{{ data.item.signal1.analysis.trait.uuid }}</span>
            </template>
            <template #cell(study2)="data">
                <span>{{ data.item.signal2.analysis.study.uuid }}</span>
            </template>
            <template #cell(trait2)="data">
                <span>{{ data.item.signal2.analysis.trait.uuid }}</span>
            </template>
            <template #cell(trait2type)="data">
                <span>{{ data.item.signal2.analysis.trait.type }}</span>
            </template>
            <template #cell(trait2tissue)="data">
                <span>{{ data.item.signal2.analysis.tissue }}</span>
            </template>
            <template #cell(trait1variant)="data">
                <span>{{ data.item.signal1.lead_variant.vid }}</span>
            </template>
            <template #cell(trait2variant)="data">
                <span>{{ data.item.signal2.lead_variant.vid }}</span>
            </template>
            <template #cell(trait1log)="data">
                <span>{{ data.item.signal1.neg_log_p }}</span>
            </template>
            <template #cell(trait2log)="data">
                <span>{{ data.item.signal2.neg_log_p }}</span>
            </template>
        </b-table>
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
                { key: "study1", label: "Study 1" },
                { key: "trait1", label: "Trait 1" },
                { key: "study2", label: "Study 2" },
                { key: "trait2", label: "Trait 2" },
                { key: "trait2type", label: "Trait 2 Type" },
                { key: "trait2tissue", label: "Trait 2 Tissue" },
                { key: "trait1variant", label: "Trait 1 Variant" },
                { key: "trait2variant", label: "Trait 2 Variant" },
                { key: "trait1log", label: "Trait 1 -log10p" },
                { key: "trait2log", label: "Trait 2 -log10p" },
                { key: "coloc_h4", label: "H4" },
                { key: "r2", label: "R2" },
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
