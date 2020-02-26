<template>
    <div>
        <div v-bind="$store.state.kp4cd.frontContents">
            <div
                v-html="$store.state.kp4cd.frontContents[0].field_about_portal"
            >{{ $store.state.kp4cd.frontContents[0].field_about_portal }}</div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("about-portal-section", {});
</script>
