<template>
    <div v-html="menuContent" class="portal-menu-wrapper"></div>
</template>

<script>
import Vue from "vue";
import documentationParser from "@/utils/documentationUtils";

export default Vue.component("menu-item", {
    props: ["name", "contentFill", "contentMap"],

    data: (context) => {
        return {
            content: null,
            converter: null,
        };
    },

    computed: {
        menuContent() {
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
    watch: {

    },

    methods: {},
});
</script>
<style scoped>
.doc.link {
}

.doc.large-header {
}
.doc.medium-header {
}
.doc.small-header {
}
.doc.x-small-header {
}

.doc.content {
}

.doc.list {
}
.doc.item {
}

.doc.italic {
}
.doc.bold {
}
.tooltip {
    display: block !important;
    z-index: 10000;
}
</style>
