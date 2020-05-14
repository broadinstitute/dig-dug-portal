<template>
    <div v-html="test"></div>
</template>
<script>
import Vue from "vue";
import * as showdown from "showdown";
export default  Vue.component("markdown", {
    props: ["content", "content_fill"],
    data() {
        return {
            converter: null,
        }
    },
    created() {
        const valid_tags = this.findTemplateTagsFromContent(this.content);
        const fill_extensions = this.makeExtensions(this.content_fill, valid_tags);
        this.converter = new showdown.Converter({
            extensions: fill_extensions
        });
    },
    computed: {
        test() {
            return this.converter.makeHtml(this.content);
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
            const replacements = Object.entries(content_fill).filter(fill => valid_tags.includes(fill[0])).map(
                filler => ({
                    type: 'lang',
                    regex: `{{${filler[0]}}}`,
                    replace: filler[1],
                })
            );
            return replacements;
        },
    }
});
</script>
