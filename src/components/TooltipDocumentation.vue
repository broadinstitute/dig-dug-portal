
<template>
    <div class="help-content">
        <span class="help-content-caller" v-on:click="showHideHelpContent(contentID)">&#63;</span>

        <div class="help-content-modal hidden" :id="contentID">
            <span class="help-content-close" v-on:click="showHideHelpContent(contentID)">&#43;</span>
            <div v-html="tooltipDocumentationContent" class="help-content-wrapper"></div>
        </div>
    </div>
</template>

<style>
@import url("/css/tooltipDocumentation.css");
</style>

<script>
import Vue from "vue";
import queryString from "query-string";
import * as showdown from "showdown";
import documentationParser from "@/utils/documentationUtils";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("tooltip-documentation", {
    props: ["name", "group", "contentFill"],
    components: {
        Documentation
    },
    data: context => {
        return {
            content: null,
            converter: null,
            show: false
        };
    },

    mounted() {
        if (!!this.name) {
            let docGroup = this.group || "md";
            let qs = queryString.stringify({
                q: this.name,
                group: docGroup //get this from state
            });
            let json = fetch(`${BIO_INDEX_HOST}/api/portal/documentation?${qs}`)
                .then(resp => {
                    if (resp.status === 422) {
                        throw Error("missing parameters");
                        // throw Error("In Documentation"+' '+resp.json().detail[0].type+' '+resp.json().detail[0].msg+' '+resp.json().detail[0].loc);
                    }
                    if (resp.status === 200) {
                        return resp;
                    }
                })
                .then(resp => resp.json())
                .then(json => {
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
                });
        }
    },
    computed: {
        tooltipDocumentationContent() {
            if (!!this.content) {
                return this.converter.makeHtml(this.content);
            }
        },
        contentID() {
            if (!!this.name) {
                let contentID = this.name + "." + Math.random();
                contentID.replace(/\./g, "_");
                return contentID;
            }
        }
    },
    watch: {
        contentFill: function(newContentFill) {
            //create a new convertor that overides the one we are storing in data
            this.converter = documentationParser.makeConverter(
                this.content,
                newContentFill,
                this.name
            );
        }
    },

    methods: {
        ...uiUtils,
        showHideHelpContent(ELEMENT) {
            uiUtils.showHideHelpContent(ELEMENT);
        }
    }
});
</script>
