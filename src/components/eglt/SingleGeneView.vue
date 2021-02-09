<template>
    <div class="single-gene-view-wrapper">
        <div
            v-for="(value, key) in this.geneData"
            class="single-gene-view-info-box"
            :class="key"
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

Vue.use(BootstrapVueIcons);

export default Vue.component("single-gene-view", {
    props: ["geneViewData", "renderConfig", "geneOfInterest"],
    data() {
        return {};
    },
    modules: {
        uiUtils,
    },
    mounted: function () {},
    computed: {
        geneData() {
            if (this.geneOfInterest != undefined) {
                let filterByArr = this.renderConfig.single_gene_view.filterBy;
                let data;

                filterByArr.map((filterBy) => {
                    this.geneViewData.map((g) => {
                        if (
                            g[filterBy].toLowerCase() ==
                            this.geneOfInterest.toLowerCase()
                        ) {
                            data = g;
                        }
                    });
                });

                return data;
            } else {
                return {};
            }
        },
    },
    watch: {},
    methods: {
        ...uiUtils,
    },
});

$(function () {});
</script>
