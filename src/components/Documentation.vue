<template>
    <div v-html="documentationContent">
    </div>
</template>

<script>
import Vue from "vue";
import documentationParser from "@/utils/documentationUtils";

export default Vue.component("documentation", {
    props: ["name", "contentFill", "contentMap"],

    data: context => {
        return {};
    },
    computed: {
        documentationContent() {
            if (!!this.contentMap && !!this.contentMap[this.name]){
                let content = this.contentMap[this.name].content;
                let contentFill = this.contentFill || {};
                let converter = documentationParser.makeConverter(
                    content,
                    contentFill,
                    this.name
                );
                return converter.makeHtml(content);
            }
            return "";
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
