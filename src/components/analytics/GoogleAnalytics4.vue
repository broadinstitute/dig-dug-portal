<template>
    <div id="analytics"></div>
</template>
<script>
import Vue from "vue";
import VueGtag from "vue-gtag";
import { GA4_ID } from "@/utils/runtimeConfig";

Vue.use(VueGtag, {
    config: {
        id: GA4_ID || "G-D3G6XZYGBR",
        params: { send_page_view: true },
    },
    appName: "HuGeAMP",
    pageTrackerScreenviewEnabled: true,
});

export default {
    name: "GoogleAnalytics",
};
</script>
