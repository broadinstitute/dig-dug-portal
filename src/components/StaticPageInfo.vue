<template>
    <div class="page-info-wrapper row" v-html="this.pageInfo[0].body[0].value"></div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("static-page-info-section", {
    props: ["pageInfo"],
    mounted: function() {}
});
</script>

<style>
@import url("/css/staticPages.css");
</style>
