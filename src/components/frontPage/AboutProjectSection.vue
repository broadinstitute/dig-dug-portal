<template>
    <div>
        <div v-html="frontContents.field_about_project"></div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("about-project-section", {
    props: ["frontContents"]
});
</script>
