<template>
    <div>
        <div v-for="(row) in $store.state.kp4cd.frontContents">
            <div v-html="row.field_about_portal">{{ row.field_about_portal }}</div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("about-portal-section", {});
</script>
