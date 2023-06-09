<template>
    <div :class="wrapperClass + ' ' + contentID">
        <span
            v-if="isHover == false"
            :class="'help-content-caller no-icon-' + noIcon"
            @click="showHideHelpContent(contentID)"
        >
            <b-icon-plus-circle-fill></b-icon-plus-circle-fill>
        </span>
        <span
            v-if="isHover == true"
            :class="'help-content-caller hover no-icon-' + noIcon"
            @mouseover="getToolTipPosition(contentID)"
        >
            <b-icon-info-circle-fill></b-icon-info-circle-fill>
        </span>
        <div
            v-if="isHover == false"
            :id="contentID"
            class="help-content-modal hidden"
        >
            <span
                class="help-content-close"
                @click="showHideHelpContent(contentID)"
                >&#43;</span
            >
            <div
                class="help-content-wrapper"
                v-html="tooltipDocumentationContent"
            ></div>
        </div>

        <div
            v-if="isHover == true"
            :id="contentID"
            :class="'help-hover-content-modal no-icon-' + noIcon"
        >
            <div
                class="help-content-wrapper"
                v-html="tooltipDocumentationContent"
            ></div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import queryString from "query-string";
import * as showdown from "showdown";
import documentationParser from "@/utils/documentationUtils";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export default Vue.component("TooltipDocumentation", {
    components: {
        Documentation,
    },
    props: ["name", "group", "contentFill", "isHover", "noIcon"],
    data: (context) => {
        return {
            content: null,
            converter: null,
            show: false,
        };
    },
    computed: {
        tooltipDocumentationContent() {
            if (this.content) {
                return this.converter.makeHtml(this.content);
            } else {
                return "";
            }
        },
        contentID() {
            if (this.name) {
                let content = this.name + "_" + Math.random();

                return content.split(".").join("_");
            } else {
                return "";
            }
        },
        wrapperClass() {
            let content =
                this.isHover == true ? "help-content hover " : "help-content ";
            content += this.noIcon == true ? "no-icon-true" : "no-icon-false";
            return content;
        },
    },
    watch: {
        contentFill: function (newContentFill) {
            //create a new convertor that overides the one we are storing in data
            this.converter = documentationParser.makeConverter(
                this.content,
                newContentFill,
                this.name
            );
        },
    },

    mounted() {
        if (this.name) {
            let docGroup = this.group || "md";
            let qs = queryString.stringify({
                q: this.name,
                group: docGroup, //get this from state
            });
            let json = fetch(`${BIO_INDEX_HOST}/api/portal/documentation?${qs}`)
                .then((resp) => {
                    if (resp.status === 422) {
                        throw Error("missing parameters");
                        // throw Error("In Documentation"+' '+resp.json().detail[0].type+' '+resp.json().detail[0].msg+' '+resp.json().detail[0].loc);
                    }
                    if (resp.status === 200) {
                        return resp;
                    }
                })
                .then((resp) => resp.json())
                .then((json) => {
                    if (json.data.length > 0) {
                        this.converter = documentationParser.makeConverter(
                            json.data[0].content,
                            this.contentFill,
                            this.name
                        );

                        this.content = json.data[0].content;
                    } else {
                        throw new Error(
                            "No content returned for given name " +
                                this.name +
                                " and group " +
                                docGroup
                        );
                    }
                })
                .catch((e) => {
                    console.log(e);
                });
        }
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

<style>
@import url("/css/tooltipDocumentation.css");
</style>
