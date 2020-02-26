<template>
    <div>
        <div v-bind="$store.state.kp4cd.frontContents">
            <div
                v-html="$store.state.kp4cd.frontContents[0].field_about_project"
            >{{ $store.state.kp4cd.frontContents[0].field_about_project }}</div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("about-project-section", {});
</script>
