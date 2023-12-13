<template>
    <div id="FilterDiv" class="filtering-ui-wrapper container-fluid search-header">
        <div
            id="FilterContent"
            class="row filtering-ui-content search-header-content hidden"
        >
            <slot></slot>
        </div>
        <a
            v-on:click="() => this.showHideElement('FilterContent')"
            class="reset-page-parameters"
            href="javascript:;"
        >
            Add Filter
        </a>
    </div>
</template>

<script>
import Vue from "vue";

import uiUtils from "@/utils/uiUtils";

export default Vue.component("filter-wrapper", {
    props: ["datasetInfo"],

    mounted() {
        window.addEventListener("scroll", this.onScroll);
    },
    beforeDestroy() {
        window.removeEventListener("scroll", this.onScroll);
    },
    computed: {
        tableTop() {
            let eglTable = document.getElementById("FilterDiv");
            let rect = eglTable.getBoundingClientRect();
            let scrollTop = document.documentElement.scrollTop
                ? document.documentElement.scrollTop
                : document.body.scrollTop;

            let tableTop = rect.top + scrollTop;

            return tableTop;
        },
    },
    methods: {
        ...uiUtils,
        onScroll(e) {
            let windowTop = window.top.scrollY;

            let element = document.getElementById("FilterDiv");
            if (windowTop > this.tableTop) {
                if (!element.classList.contains("fixed-header")) {
                    element.classList.add("fixed-header");
                }
            } else {
                if (element.classList.contains("fixed-header")) {
                    element.classList.remove("fixed-header");
                }
            }
        },
    },
});
</script>

<style>
</style>
