<template>
    <div>
        <div v-for="(row) in $store.state.kp4cd.frontContents">
            <div v-html="row.field_about_project">{{ row.field_about_project }}</div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("about-project-section", {});
</script>
