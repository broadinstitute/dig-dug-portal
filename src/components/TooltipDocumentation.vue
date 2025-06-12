
<template>
    <div :class="this.wrapperClass + ' ' + contentID">
        <span
            v-if="this.isHover == false"
            :class="'help-content-caller no-icon-' + this.noIcon"
            v-on:click="showHideHelpContent(contentID)"
        >
            <b-icon-plus-circle-fill></b-icon-plus-circle-fill>
        </span>
        <span
            v-if="this.isHover == true"
            :class="'help-content-caller hover no-icon-' + this.noIcon"
            @mouseover="getToolTipPosition(contentID)"
        >
            <b-icon-info-circle-fill></b-icon-info-circle-fill>
        </span>
        <div
            v-if="this.isHover == false"
            class="help-content-modal hidden"
            :id="contentID"
        >
            <span
                class="help-content-close"
                v-on:click="showHideHelpContent(contentID)"
                >&#43;</span
            >
            <div
                v-html="tooltipDocumentationContent"
                class="help-content-wrapper"
            ></div>
        </div>

        <div
            v-if="this.isHover == true"
            :class="'help-hover-content-modal no-icon-' + this.noIcon"
            :id="contentID"
        >
            <div
                v-html="!!supplyText ? supplyText : tooltipDocumentationContent"
                class="help-content-wrapper"
            ></div>
        </div>
    </div>
</template>

<style>
@import url("/css/tooltipDocumentation.css");
</style>

<script>
import Vue from "vue";
import documentationParser from "@/utils/documentationUtils";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export default Vue.component("tooltip-documentation", {
    props: ["name", "group", "contentFill", "contentMap", "isHover", "noIcon", "supplyText"],
    components: {
        Documentation,
    },
    data: (context) => {
        return {
            content: null,
            converter: null,
            show: false,
        };
    },
    computed: {
        tooltipDocumentationContent() {
            if (!!this.contentMap && !!this.contentMap[this.name]){
                let content = this.contentMap[this.name].content;
                let contentFill = this.contentFill || {};
                let converter = documentationParser.makeConverter(
                    content,
                    contentFill,
                    this.name
                );
                let textContent = converter.makeHtml(content);
                return textContent.replaceAll('href="/', 'href="https://a2f.hugeamp.org/')
                    .replaceAll('href="(/', 'href="https://a2f.hugeamp.org/');
            }
            return "";
        },
        contentID() {
            if (!!this.name) {
                let content = this.name + "_" + Math.random();

                return content.split(".").join("_");
            }
        },
        wrapperClass() {
            let content =
                this.isHover == true ? "help-content hover " : "help-content ";
            content += this.noIcon == true ? "no-icon-true" : "no-icon-false";
            return content;
        },
    },
    methods: {
        ...uiUtils,
        showHideHelpContent(ELEMENT) {
            uiUtils.showHideHelpContent(ELEMENT);
        },
        getToolTipPosition(ELEMENT) {
            uiUtils.getToolTipPosition(ELEMENT);
        },
    },
});
</script>
