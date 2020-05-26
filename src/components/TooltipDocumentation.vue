
<template>
    <div class="text-center">
        <div>
            <span id="tooltip-button-1" variant="primary" @click="show = !show">&#63;</span>
        </div>
        <b-tooltip :show.sync="show" target="tooltip-button-1" placement="top">
            <div class="tooltip">
                <documentation :name="name"></documentation>
            </div>
        </b-tooltip>
    </div>
</template>


<script>
import Vue from "vue";
import queryString from "query-string";
import * as showdown from "showdown";
import documentationParser from "@/utils/documentationUtils";

export default Vue.component("tooltip-documentation", {
    props: ["name", "group", "contentFill"],
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
                        const classMap = {
                            h1: "doc large-header",
                            h2: "doc medium-header",
                            h3: "doc small-header",
                            h4: "doc x-small-header",
                            p: "doc content",
                            ul: "doc list",
                            li: "doc item",
                            em: "doc italic",
                            strong: "doc bold",
                            a: "doc link"
                        };

                        const name_and_class_extensions = Object.keys(
                            classMap
                        ).map(key => ({
                            type: "output",
                            regex: new RegExp(`<${key}(.*)>`, "g"),
                            replace: `<${key} id="${this.name}" class="${classMap[key]}" $1>`
                        }));

                        const valid_tags = documentationParser.findTemplateTagsFromContent(
                            json.data[0].content
                        );
                        const fill_extensions = documentationParser.makeExtensions(
                            this.contentFill,
                            valid_tags
                        );

                        this.converter = new showdown.Converter({
                            extensions: [
                                ...fill_extensions,
                                ...name_and_class_extensions
                            ]
                        });
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

    methods: {}
});
</script>
