<template>
    <div>
        <div
            v-for="(value, key) in this.geneData"
            class="single-gene-view-info-box"
            :key="key"
        >
            <div v-html="key" class="key"></div>
            <div
                v-html="$parent.formatContent(key, value, 'top')"
                class="value"
            ></div>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("single-gene-view", {
    props: ["geneViewData", "renderConfig", "geneOfInterest"],
    data() {
        return {};
    },
    modules: {
        uiUtils,
        Formatters,
    },
    mounted: function () {},
    computed: {
        geneData() {
            //console.log(this.geneViewData);
            console.log(this.renderConfig);

            let filterBy = this.renderConfig.single_gene_view.filterBy;
            let data;

            this.geneViewData.map((g) => {
                if (
                    g[filterBy].toLowerCase() ==
                    this.geneOfInterest.toLowerCase()
                ) {
                    data = g;
                }
            });
            return data;
        },
    },
    watch: {},
    methods: {
        ...uiUtils,
    },
});

$(function () {});
</script>
