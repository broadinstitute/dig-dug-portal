<template>
    <div v-html="menuContent" class="portal-menu-wrapper"></div>
</template>

<script>
import Vue from "vue";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import documentationParser from "@/utils/documentationUtils";
import queryString from "query-string";

export default Vue.component("menu-item", {
    props: ["name", "group", "contentFill", "menu", "link"],

    data: (context) => {
        return {
            content: null,
            converter: null,
        };
    },

    mounted() {
        if (!!this.name) {
            // fetch the documentation data and resolve it in data
            let docGroup = !!this.group ? this.group : "md";

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
                });
        }
    },
    computed: {
        menuContent() {
            if (!!this.content) {
                return this.converter.makeHtml(this.content);
            }
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
