<template>
    <div>
        <div v-if="rows > 0">
            <b-row>
                <b-col cols="9">
                    <div class="legends" v-show="tableData.length">
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
                    <csv-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="variant-consequences"
                    ></csv-download
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
                    :current-page="currentPage"
				    :per-page="perPage"
                    :tbody-tr-class="rowPickClass"
                    id="transcriptconsequence"
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
                            {{ consequenceFormatter(data.item.consequenceTerms) }}
                            <!--<span
                                v-for="(c, i) in data.item.consequenceTerms"
                                :key="c"
                                >{{ consequenceFormatter(c)
                                }}{{
                                    i < data.item.consequenceTerms.length - 1
                                        ? ", "
                                        : ""
                                }}</span
                            > -->
                        </div></template
                    >
                    <template #cell(siftPrediction)="data">
                        {{ siftFormatter(data.item.siftPrediction) }}
                    </template>
                    <template #cell(hgvsc)="data">
                        {{ hgvsFormatter(data.item.hgvsc) }}
                    </template>
                    <template #cell(hgvsp)="data">
                        {{ hgvsFormatter(data.item.hgvsp) }}
                    </template>
                </b-table>
                <b-pagination
                    class="pagination-sm justify-content-center"
                    v-model="currentPage"
                    :total-rows="rows"
                    :per-page="perPage"
                    aria-controls="transcriptconsequence"
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

export default Vue.component("transcript-consequence-table", {
    props: ["transcriptConsequences", "filter"],
    data() {
        return {
            fields: [
                {
                    key: "transcriptId",
                    label: "Feature",
                },
                /*{
                    key: "position",
                    label: "Position",
                },
                {
                    key: "aminoAcids",
                    label: "Amino Acids",
                },*/
                {
                    key: "consequenceTerms",
                    label: "Consequence",
                    tdClass: "border-color",
                },
                /*{
                    key: "hgncId",
                    label: "HGNC",
                },*/
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
                /*{
                    key: "gnomadGenomesPopmaxAf",
                    label: "gnomAD AF",
                },*/
            ],
            perPage: 10,
            currentPage: 1,
        };
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        sortedTranscriptConsequences() {
            //alert("sort function:"+this.transcriptConsequences.length);
            let picked = this.transcriptConsequences.filter(
                (a) => a.pick === "1"
            );
            let unpicked = this.transcriptConsequences.filter((a) => !a.pick);

            return picked
                .concat(unpicked)
                .sort((a, b) => a.pick=== "1")
                .map((cqs) => {
                    return {
                        _rowVariant: cqs.pick === "1" ? "success" : null,
                        ...cqs,
                    };
                });
        },
        tableData() {
            //let dataRows = this.sortedTranscriptConsequences;
            let dataRows = this.transcriptConsequences;
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
        hgvsFormatter(hgvs){
            let result = hgvs.split(":");
            if (result.length > 1){
                return result[1];
            } else {
                return hgvs;
            }
        }
    },
});
</script>
<style>
@import url("/css/table.css");
</style>
