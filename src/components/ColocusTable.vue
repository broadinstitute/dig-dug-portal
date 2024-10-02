<template>
    <div>
        <p>Loading: {{ loading }}</p>
        <p>Error: {{ error }}</p>
        <b-table
            striped
            hover
            :items="data ? data.results : []"
            :loading="loading"
            :fields="fields"
            ><template #head(study1)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>
            <template #cell(study1)="data">
                <span>{{ data.item.signal1.analysis.study.uuid }}</span>
            </template>

            <template #head(trait1)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>
            <template #cell(trait1)="data">
                <a
                    :href="`/phenotype.html?phenotype=${data.item.signal1.analysis.trait.phenotype.kp_id}`"
                >
                    {{ data.item.signal1.analysis.trait.phenotype.kp_id }}
                </a>
            </template>

            <template #head(study2)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>
            <template #cell(study2)="data">
                <span>{{ data.item.signal2.analysis.study.uuid }}</span>
            </template>

            <template #head(trait2)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>
            <template #cell(trait2)="data">
                <span v-html="trait2Link(data.item.signal2)"></span>
            </template>

            <template #head(trait2type)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>
            <template #cell(trait2type)="data">
                <span>{{
                    formatType(data.item.signal2.analysis.trait.biomarker_type)
                }}</span>
            </template>

            <template #head(trait2tissue)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>
            <template #cell(trait2tissue)="data">
                <span>{{ data.item.signal2.analysis.tissue }}</span>
            </template>

            <template #head(trait1variant)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>
            <template #cell(trait1variant)="data">
                <a
                    :href="`/variant.html?variant=${data.item.signal1.lead_variant.vid}`"
                >
                    {{ data.item.signal1.lead_variant.vid }}
                </a>
            </template>

            <template #head(trait2variant)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>
            <template #cell(trait2variant)="data">
                <a
                    :href="`/variant.html?variant=${data.item.signal2.lead_variant.vid}`"
                >
                    {{ data.item.signal2.lead_variant.vid }}
                </a>
            </template>

            <template #head(trait1log)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>
            <template #cell(trait1log)="data">
                <span>{{ data.item.signal1.neg_log_p }}</span>
            </template>

            <template #head(trait2log)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>
            <template #cell(trait2log)="data">
                <span>{{ data.item.signal2.neg_log_p }}</span>
            </template>

            <template #head(coloc_h4)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
            </template>

            <template #head(r2)="data">
                <span v-b-tooltip :title="data.field.desc">{{
                    data.field.label
                }}</span>
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
                {
                    key: "study1",
                    label: "Study 1",
                    desc: "Study from which the first signal comes",
                },
                {
                    key: "trait1",
                    label: "Trait 1",
                    desc: "	Associated trait for the first signal",
                },
                {
                    key: "study2",
                    label: "Study 2",
                    desc: "Study from which the second signal comes",
                },
                {
                    key: "trait2",
                    label: "Trait 2",
                    desc: "Associated trait for the second signal",
                },
                {
                    key: "trait2type",
                    label: "Trait 2 Type",
                    desc: "Trait 2's type",
                },
                {
                    key: "trait2tissue",
                    label: "Trait 2 Tissue",
                    desc: "Tissue in which trait 2 is measured",
                },
                {
                    key: "trait1variant",
                    label: "Trait 1 Variant",
                    desc: "Lead variant associated with trait 1",
                },
                {
                    key: "trait2variant",
                    label: "Trait 2 Variant",
                    desc: "Lead variant associated with trait 2",
                },
                {
                    key: "trait1log",
                    label: "Trait 1 -log10p",
                    desc: "-log10(p-value) of association between lead variant and trait 1",
                },
                {
                    key: "trait2log",
                    label: "Trait 2 -log10p",
                    desc: "-log10(p-value) of association between lead variant and trait 2",
                },
                {
                    key: "coloc_h4",
                    label: "H4",
                    desc: "Posterior probability of H4 from coloc",
                },
                {
                    key: "r2",
                    label: "R2",
                    desc: "Linkage disequilibrium (r2) between the two lead variants",
                },
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
        formatType(traitType) {
            return traitType.replace("-expression", "");
        },
        trait2Link(signal2) {
            const gene =
                signal2.analysis.trait.gene.symbol ||
                signal2.analysis.trait.uuid;
            return `<a href="/gene.html?gene=${gene}">${gene}</a>`;
        },
    },
});
</script>

<style scoped></style>
