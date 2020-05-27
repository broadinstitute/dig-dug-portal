
<template>
    <div class="text-center">
        <div>
            <span id="tooltip-button-1" variant="primary" @click="show = !show">&#63;</span>
        </div>
        <b-tooltip :show.sync="show" target="tooltip-button-1" placement="top">
            <div v-html="tooltipDocumentationContent"></div>
        </b-tooltip>
    </div>
</template>


<script>
import Vue from "vue";
import { camelKebab } from "@/utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import queryString from "query-string";
import * as showdown from "showdown";
import documentationParser from "@/utils/documentationUtils";
import Documentation from "@/components/Documentation.vue";

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

    methods: {}
});
</script>
