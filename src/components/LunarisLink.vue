<template>
    <div class="lunaris-link-wrapper" v-if="diseaseGroup && trait">
        <a class="lunaris-link">
            <div class="options-4-actions">
                <div>
                    <a
                        href="javascript:;"
                        @click="showHideElement('lunaris-modal-wrapper')"
                    >Download data with Lunaris API</a>
                </div>
                <div>
                    <a
                        :href="'http://34.71.240.244:8080/lunaris/lunaris.html?chr='+chr+'&begin='+begin+'&end='+end+'&trait='+trait.name"
                        target="_blank"
                    >Go to Lunaris for more options</a>
                </div>
            </div>
            <!--

            <tooltip-documentation
                name="test.tooltip.index.regionexample"
                :group="diseaseGroup.name"
                :isHover="true"
                :noIcon="true"
            ></tooltip-documentation>
            -->
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
                <p>
                    <button
                        v-on:click="this.lunarisCaller"
                        class="btn btn-primary btn-sm"
                    >Download data</button>
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
        uiUtils
    },
    props: [
        "diseaseGroup",
        "chr",
        "begin",
        "end",
        "trait",
        "dataContent",
        "lunarisCaller"
    ],
    data() {
        return {
            dataFromLunaris: null
        };
    },
    mounted: function() {},
    methods: {
        showHideElement(CLASS) {
            uiUtils.showHideElement(CLASS);
        },
        copyDataContent() {
            let copyText = document.getElementById("dataFromLunaris");
            copyText.select();
            document.execCommand("copy");
        }
    }
});
</script>

<style>
@import url("/css/lunaris.css");
</style>

