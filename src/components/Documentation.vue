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
        return {
            content: null,
            converter: null
        };
    },
    computed: {
        documentationContent() {
            if (!!this.contentMap){
                let content = this.contentMap[this.name].content;
                let converter = documentationParser.makeConverter(
                    content,
                    this.contentFill,
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
