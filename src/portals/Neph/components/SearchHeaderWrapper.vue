<template>
    <div class="filtering-ui-wrapper container-fluid search-header">
        <div
            id="pageSearchHeaderContent"
            class="row filtering-ui-content search-header-content hidden"
        >
            <slot></slot>
        </div>
        <a
            v-on:click="() => this.showHideElement('search-header-content')"
            class="reset-page-parameters"
            href="javascript:;"
        >
            <!-- Set page level parameters -->
            Search
        </a>
    </div>
</template>

<script>
import Vue from "vue";

import uiUtils from "@/utils/uiUtils";

export default Vue.component("search-header-wrapper", {
    props: ["datasetInfo"],

    mounted() {
        window.addEventListener("scroll", this.onScroll);
    },
    beforeDestroy() {
        window.removeEventListener("scroll", this.onScroll);
    },
    computed: {
        tableTop() {
            let eglTable = document.getElementsByClassName("search-header")[0];
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

            let element = document.getElementsByClassName("search-header")[0];
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
