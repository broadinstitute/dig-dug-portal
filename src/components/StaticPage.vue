<template>
    <div>
        <div class="page-info-wrapper" v-html="this.pageInfo[0].body[0].value"></div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("page-info-section", {
    props: ["pageInfo"],
    mounted: function() {}
});
</script>

<style>
@import url("/css/datasetsInfo.css");
</style>
