<template>
    <div>
        <div
            class="dataset-info-wrapper"
            v-if="datasetInfo && datasetInfo[0]"
            v-html="datasetInfo[0].body[0].value"
        ></div>
    </div>
</template>

<script>

export default {
    name: "dataset-info-section",
    props: ["datasetInfo"],
    mounted: function () {},
};
</script>

<style>
@import url("/css/datasetsInfo.css");
</style>
