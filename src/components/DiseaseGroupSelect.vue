<template>
    <div class="disease-group-select">
        <select v-model="diseaseGroup" @change="changeDiseaseGroup(diseaseGroup);">
            <option v-for="group in diseaseGroups" v-bind:value="group.name">{{ group.description }}</option>
        </select>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import host from "@/utils/hostUtils";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("disease-group-select", {
    props: ["diseaseGroups"],

    data() {
        return {
            diseaseGroup: null
        };
    },

    methods: {
        changeDiseaseGroup(newGroup) {
            window.location.href = host.urlWithSubdomain(newGroup).href;
        }
    }
});
</script>
