
<template>
    <div class="text-center">
        <div>
            <b-button id="tooltip-button-1" variant="primary" @click="show = !show">I have a tooltip</b-button>
        </div>
        <b-tooltip :show.sync="show" target="tooltip-button-1" placement="top">Hello</b-tooltip>
    </div>
</template>


<script>
import Vue from "vue";
import { camelKebab } from "@/utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import queryString from "query-string";
import * as showdown from "showdown";
import { VTooltip } from "v-tooltip";
Vue.directive("tooltip", VTooltip);

export default Vue.component("tooltip-documentation", {
    props: ["name", "group"],
    //fetch
    //if group is not defined --> get it from the store
    // name and group should be defined

    data: context => {
        return {
            content: null,
            converter: null,
            msg: "hello",
            show: false
        };
    },

    mounted() {},
    computed: {
        documentationContent() {
            return "this.content;";
        }
    },

    methods: {}
});
</script>
<style >
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
