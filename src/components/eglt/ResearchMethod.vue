<template>
    <div class="research-method-wrapper" v-html="this.researchMethod[0]['body']"></div>
    <!--<div class="row">{{this.researchMethod[0]['body']}}</div>-->
</template>

<script>
import Vue from "vue";

export default Vue.component("research-method-section", {
    props: ["researchMethod"],
    mounted: function() {}
});
</script>

