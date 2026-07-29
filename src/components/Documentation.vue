<template>
    <div v-html="documentationContent">
    </div>
</template>

<script>
import Vue from "vue";
import documentationParser from "@/utils/documentationUtils";

export default Vue.component("documentation", {
    props: ["name", "contentFill", "contentMap", "defaultContent"],

    data: context => {
        return {};
    },
    computed: {
        documentationContent() {
            let content = null;
            if (!!this.contentMap && !!this.contentMap[this.name]) {
                content = this.contentMap[this.name].content;
            }
            if (typeof content === "string") {
                content = content.trim();
            }
            if (!content && this.defaultContent) {
                content = this.defaultContent;
            }
            if (!content) {
                return "";
            }
            let contentFill = this.contentFill || {};
            let converter = documentationParser.makeConverter(
                content,
                contentFill,
                this.name
            );
            return converter.makeHtml(content);
        }
    },
});
</script>
<style scoped>
.tooltip {
    display: block !important;
    z-index: 10000;
}
</style>
