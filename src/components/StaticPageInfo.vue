<template>
    <div
        class="page-info-wrapper row"
        v-if="this.pageInfo[0]"
        v-html="this.pageInfo[0].body[0].value"
    ></div>
</template>

<script>
export default {
    name: "static-page-info-section",
    props: ["pageInfo"],
    mounted: function () {},
};
</script>

<style>
@import url("/css/staticPages.css");
</style>
