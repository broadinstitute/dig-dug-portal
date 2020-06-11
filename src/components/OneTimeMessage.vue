<template>
    <div class="one-time-message">
        <span class="message-close" v-on:click="showHideHelpContent('one-time-message')">&#43;</span>
        <documentation :name="this.messageName"></documentation>
    </div>
</template>

<script>
import Vue from "vue";

import Documentation from "@/components/Documentation";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("one-time-message", {
    components: {
        Documentation
    },
    methods: {
        ...uiUtils,
        showHideHelpContent(ELEMENT) {
            uiUtils.showHideHelpContent(ELEMENT);
        }
    },
    props: ["messageName"]
});
</script>
<style>
@import url("/css/tooltipDocumentation.css");
</style>
