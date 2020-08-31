<template>
    <div class="lunaris-link-wrapper" v-if="diseaseGroup && trait">
        <a class="lunaris-link">
            <div class="options-4-actions">
                <div>
                    <a
                        href="javascript:;"
                        @click="loadDataFromLunaris('lunaris-modal-wrapper')"
                    >Download data with Lunaris API</a>
                </div>
                <div>
                    <a
                        :href="'https://lunaris.hugeamp.org/lunaris/lunaris.html?chr='+chr+'&begin='+begin+'&end='+end+'&trait='+trait.name"
                        target="_blank"
                    >Open Lunaris for more options &nbsp;</a>
                    <!--<tooltip-documentation
                        name="test.tooltip.index.regionexample"
                        :group="diseaseGroup.name"
                        :isHover="false"
                    ></tooltip-documentation>-->
                </div>
            </div>
        </a>
        <div class="lunaris-modal-wrapper hidden">
            <span
                class="lunaris-modal-close"
                v-on:click="showHideElement('lunaris-modal-wrapper')"
            >&#43;</span>
            <div class="lunaris-modal-parameters">
                <p>
                    {{"Region: "+this.chr + " : " + this.begin + " - " + this.end }}
                    {{"&nbsp;&nbsp;|&nbsp;&nbsp;Phenotype: "+this.trait.name}}
                </p>
            </div>
            <button
                v-on:click="this.copyDataContent"
                class="btn btn-secondary btn-sm copy-data-btn"
            >Copy data</button>
            <textarea class="lunaris-modal-textarea" id="dataFromLunaris">{{this.dataContent}}</textarea>
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
    methods: {
        loadDataFromLunaris(CLASS) {
            uiUtils.showHideElement(CLASS);
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

            let CHR = this.$store.state.chr;
            let BEGIN = this.$store.state.start;
            let END = this.$store.state.end;
            let TRAIT = this.$store.state.phenotype.name;

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

