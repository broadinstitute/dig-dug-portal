<template>
    <div>
        <div v-if="rows > 0">
            <b-row>
                <b-col cols="9">
                    <div v-show="tableData.length" class="legends">
                        <strong class="mr-2">Impact:</strong>
                        <b-btn
                            disabled
                            variant="outline-danger"
                            size="sm"
                            class="mr-1 btn-mini"
                            >HIGH</b-btn
                        >
                        <b-btn
                            disabled
                            variant="outline-warning"
                            size="sm"
                            class="mr-1 btn-mini"
                            >MODERATE</b-btn
                        >
                        <b-btn
                            disabled
                            variant="outline-success"
                            size="sm"
                            class="mr-1 btn-mini"
                            >LOW</b-btn
                        >
                        <b-btn
                            disabled
                            variant="outline-secondary"
                            size="sm"
                            class="btn-mini"
                            >MODIFIER</b-btn
                        >
                    </div>
                </b-col>
                <b-col class="text-right mb-2">
                    <data-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="variant-consequences"
                    ></data-download
                ></b-col>
            </b-row>
            <div v-show="tableData.length">
                <b-table
                    hover
                    small
                    sort-icon-left
                    responsive="sm"
                    :items="tableData"
                    :fields="fields"
                    :per-page="perPage"
                    :current-page="currentPage"
                    :tbody-tr-class="rowPickClass"
                    ><template #cell(varId)="data">
                        <a :href="`/variant.html?variant=${data.item.varId}`">{{
                            data.item.varId
                        }}</a>
                    </template>
                    <template #head(transcriptId)="data">
                        <span class="external_source"
                            >Feature
                            <b-badge
                                pill
                                disabled
                                class="ml-1"
                                variant="secondary"
                                title="Link to external source."
                                >E</b-badge
                            ></span
                        >
                    </template>
                    <template #cell(transcriptId)="data">
                        <a
                            v-if="data.item.transcriptId"
                            :href="`https://grch37.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=${data.item.transcriptId}`"
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            >{{ data.item.transcriptId }}</a
                        >
                    </template>
                    <template #cell(position)="data">
                        {{
                            data.item.proteinStart !== data.item.proteinEnd
                                ? `${data.item.proteinStart}-${data.item.proteinEnd}`
                                : data.item.proteinStart
                        }}
                    </template>
                    <template #cell(consequenceTerms)="data">
                        <div class="border-color" :class="data.item.impact">
                            <span
                                v-for="(c, i) in data.item.consequenceTerms"
                                :key="c"
                                >{{ consequenceFormatter(c)
                                }}{{
                                    i < data.item.consequenceTerms.length - 1
                                        ? ", "
                                        : ""
                                }}</span
                            >
                        </div></template
                    >
                    <template #cell(hgvsc)="data">
                        {{ format_hgvsc(data.item.hgvsc) }}</template
                    >
                    <template #cell(hgvsp)="data">
                        {{ format_hgvsp(data.item.hgvsp) }}
                    </template>
                    <template #cell(siftPrediction)="data">
                        {{ siftFormatter(data.item.siftPrediction) }}
                    </template>
                </b-table>
                <b-pagination
                    v-if="rows > perPage"
                    v-model="currentPage"
                    class="pagination-sm justify-content-center"
                    :total-rows="rows"
                    :per-page="perPage"
                ></b-pagination>
            </div>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No predicted
                transcript consequences found.</b-alert
            >
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
export default Vue.component("TranscriptConsequenceTable", {
    components: {
        DataDownload,
    },
    props: ["transcriptConsequences", "filter"],
    data() {
        return {
            fields: [
                {
                    key: "transcriptId",
                    label: "Feature",
                },

                {
                    key: "consequenceTerms",
                    label: "Consequence",
                    tdClass: "border-color",
                },

                {
                    key: "hgvsc",
                    label: "HGVSc",
                },
                {
                    key: "hgvsp",
                    label: "HGVSp",
                },
                {
                    key: "polyphen2HdivPred",
                    label: "PolyPhen (HDIV)",
                },
                {
                    key: "polyphen2HvarPred",
                    label: "PolyPhen (HVAR)",
                },
                {
                    key: "siftPrediction",
                    label: "SIFT Prediction",
                },
                {
                    key: "lrtPred",
                    label: "LRT",
                },
                {
                    key: "mutationTaster",
                    label: "Mutation Taster",
                },
                {
                    key: "caddRawRankscore",
                    label: "CADD-Phred Score",
                },
            ],
            perPage: 5,
            currentPage: 1,
        };
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        sortedTranscriptConsequences() {
            let picked = this.transcriptConsequences.filter(
                (a) => a.pick === 1
            );
            let unpicked = this.transcriptConsequences.filter((a) => !a.pick);

            return picked
                .concat(unpicked)
                .sort((a, b) => a.pick === 1)
                .map((cqs) => {
                    return {
                        _rowVariant: cqs.pick === 1 ? "success" : null,
                        ...cqs,
                    };
                });
        },
        tableData() {
            let dataRows = this.sortedTranscriptConsequences;
            if (!!this.filter) {
                dataRows = dataRows.filter((association) => {
                    return this.filter(association);
                });
            }
            return dataRows;
        },
    },
    methods: {
        consequenceFormatter: Formatters.consequenceFormatter,
        siftFormatter(name) {
            return Formatters.snakeFormatter(name);
        },
        rowPickClass(item, type) {
            if (!item || type !== "row") return;
            if (item.pick === 1) return "row-pick";
        },
        format_hgvsc(hgvsc) {
            return hgvsc?.split(":")[1] || "";
        },
        format_hgvsp(hgvsp) {
            return hgvsp?.split(":")[1].replace("%3D", "=") || "";
        },
    },
});
</script>
<style>
@import url("/css/table.css");
</style>
