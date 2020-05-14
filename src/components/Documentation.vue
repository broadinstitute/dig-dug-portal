<template>
    <!-- <div>{{documentation}}</div> -->
    <div v-html="test"></div>
</template>

<script>
import Vue from "vue";
import { camelKebab } from "@/utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import queryString from "query-string";
import * as showdown from "showdown";

export default Vue.component("documentation", {
    props: ["name", "group", "content_fill"],
    //fetch
    //if group is not defined --> get it from the store
    // name and group should be defined

    data: context => {
        return {
            content: null,
            converter: null
        };
    },

    created() {
        // fetch the documentation data and resolve it in data
        let docGroup = this.group || this.$store.getters["bioPortal/diseaseGroup"].name || "md";
        let qs = queryString.stringify({
            q: this.name,
            group: docGroup
        }); //get this from state
        let json = fetch(`${BIO_INDEX_HOST}/api/portal/documentation?${qs}`)
            .then(resp => resp.json())
            .then(json => {
                if (json.data.length > 0) {

                    const classMap = {
                        h1: 'doc large-header',
                        h2: 'doc medium-header',
                        h3: 'doc small-header',
                        h4: 'doc x-small-header',
                        p:  'doc content',
                        ul: 'doc list',
                        li: 'doc item',
                        em: 'doc italic',
                        strong: 'doc bold',
                        a: 'doc link',
                    }
                    
                    const class_extensions = Object.keys(classMap)
                        .map(key => ({
                            type: 'output',
                            regex: new RegExp(`<${key}(.*)>`, 'g'),
                            replace: `<${key} class="${classMap[key]}" $1>`
                        }));

                    const valid_tags = this.findTemplateTagsFromContent(
                        json.data[0].content
                    );
                    const fill_extensions = this.makeExtensions(
                        this.content_fill,
                        valid_tags
                    );

                    this.converter = new showdown.Converter({
                        extensions: [...fill_extensions, ...class_extensions]
                    });

                    this.content = json.data[0].content;

                } else {
                    console.error(
                        "No content returned for given name " +
                            this.name +
                            " and group " +
                            docGroup
                    );
                }
            });
    },
    computed: {
        //render the content as it is if not markdown
        //if else markdown - implemented by Kenneth
        documentation() {
            return this.content;
        },
        test() {
            if (!!this.content) {
                return this.converter.makeHtml(this.content);
            }
        }
    },

    methods: {
        findTemplateTagsFromContent(content) {
            let regexp = /{{([A-Za-z]+)}}/g;

            // we use a slice here because some browsers (firefox) don't support named capture groups in regexp
            // we are able to use a slice here because the structure is always padded by both `{{` and `}}`
            return [...content.matchAll(regexp)].map(m => m[0].slice(2, -2));
        },
        makeExtensions(content_fill, valid_tags) {
            const replacements = Object.entries(content_fill)
                .filter(fill => valid_tags.includes(fill[0]))
                .map(filler => ({
                    type: "lang",
                    regex: `{{${filler[0]}}}`,
                    replace: filler[1]
                }));
            return replacements;
        }
    }
});
</script>
