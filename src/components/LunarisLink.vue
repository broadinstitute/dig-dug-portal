<template>
    <div class="lunaris-link-wrapper" v-if="diseaseGroup && trait">
        <a class="lunaris-link">
            <div class="options-4-actions">
                <div>
                    <a
                        href="javascript:;"
                        @click="loadDataFromLunaris('lunaris-modal-wrapper')"
                        >Download data with Lunaris API</a
                    >
                </div>
                <div>
                    <a
                        :href="
                            'https://lunaris.hugeamp.org/lunaris/lunaris.html?chr=' +
                            chr +
                            '&begin=' +
                            begin +
                            '&end=' +
                            end +
                            '&trait=' +
                            trait.name
                        "
                        target="_blank"
                        >Open Lunaris for more options &nbsp;</a
                    >
                </div>
            </div>
        </a>
        <div class="lunaris-modal-wrapper hidden">
            <span
                class="lunaris-modal-close"
                v-on:click="showHideElement('lunaris-modal-wrapper')"
                >&#43;</span
            >
            <div class="lunaris-modal-parameters">
                {{
                    "Region: " +
                    this.chr +
                    " : " +
                    this.begin +
                    " - " +
                    this.end
                }}
                {{ "&nbsp;&nbsp;|&nbsp;&nbsp;Phenotype: " + this.trait.name }}
            </div>

            <div id="loading_lunaris_data" class="hidden">Loading Data...</div>
            <button
                v-on:click="this.copyDataContent"
                class="btn btn-secondary btn-sm copy-data-btn"
            >
                Copy data
            </button>
            <textarea class="lunaris-modal-textarea" id="dataFromLunaris">{{
                this.dataContent
            }}</textarea>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("lunaris-link", {
    modules: {
        uiUtils,
    },
    props: ["diseaseGroup", "chr", "begin", "end", "trait", "dataContent"],
    data() {
        return {
            dataFromLunaris: null,
        };
    },
    mounted: function () {},
    watch: {
        "$store.state.lunaris.dataFromLunaris"(data) {
            console.log("data is there!!");
            uiUtils.hideElement("loading_lunaris_data");
            uiUtils.showElement("lunaris-modal-textarea");
            uiUtils.showElement("copy-data-btn");
        },
    },
    methods: {
        loadDataFromLunaris(CLASS) {
            uiUtils.showHideElement(CLASS);
            uiUtils.showElement("loading_lunaris_data");
            uiUtils.hideElement("copy-data-btn");
            uiUtils.hideElement("lunaris-modal-textarea");
            //this.lunarisCaller();
            let arg = {
                id: "requestFilterTsv",
                regions: {},
                recipe: {
                    read: {
                        file:
                            "gs://fc-6fe31e1f-2c36-411c-bf23-60656d621184/data/t2d/associations.tsv.gz",
                        idField: "var_id",
                        tool: "IndexedRecordReader",
                    },
                    filter: {
                        from: "read",
                        field: "phenotype",
                        stringValue: null,
                        tool: "RecordsFilter",
                    },
                    write: {
                        from: "filter",
                        file: "responseFilterTsv.tsv",
                        tool: "TSVWriter",
                    },
                },
            };

            let CHR = this.chr;
            let BEGIN = this.begin;
            let END = this.end;
            let TRAIT = this.trait.name;

            arg.regions[CHR] = [{ begin: BEGIN, end: END }];
            arg.recipe.filter.stringValue = TRAIT;

            this.$store.dispatch("lunaris/getDataFromLunaris", arg);
        },
        showHideElement(CLASS) {
            uiUtils.showHideElement(CLASS);
        },
        copyDataContent() {
            let copyText = document.getElementById("dataFromLunaris");
            copyText.select();
            document.execCommand("copy");
        },
    },
});
</script>

<style>
@import url("/css/lunaris.css");
</style>

