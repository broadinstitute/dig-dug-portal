<template>
    <div>
        <div v-html="frontContents.field_about_portal"></div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("about-portal-section", {
    props: ["frontContents"]
});
</script>
