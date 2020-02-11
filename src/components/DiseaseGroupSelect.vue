<template>
    <div class="disease-group-select">
        <select v-model="diseaseGroup" @change="onDiseaseGroupChange(diseaseGroup);">
            <option v-for="group in groups" v-bind:value="group.value">{{ group.text }}</option>
        </select>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
// Install BootstrapVue
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("disease-group-select", {
    data() {
        return {
            diseaseGroup: this.$store.state.diseaseGroup,
            groups: [
                { text: "Metabolic Disorders", value: "md" },
                { text: "Type 2 Diabetes", value: "t2d" },
                { text: "Cardiovascular Disease", value: "cvd" },
                { text: "Cerebrovascular Disease", value: "cd" },
                { text: "Sleep Disorder", value: "sleep" }
            ]
        };
    },
    methods: {
        onDiseaseGroupChange: function(selectedDiseaseGroup) {
            window.location.href = "./?group=" + selectedDiseaseGroup;
        }
    }
});
</script>
