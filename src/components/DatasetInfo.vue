<template>
    <div>
        <div class="dataset-info-wrapper" v-html="datasetInfo[0].body[0].value"></div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("dataset-info-section", {
    props: ["datasetInfo"]
});
</script>

<style>
@import url("/css/datasetsInfo.css");
</style>
