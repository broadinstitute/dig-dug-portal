<template>
    <div class="disease-group-select">
        <b-form-select
            v-model="selectedPortal"
            @change="changeDiseaseGroup(selectedPortal)"
        >
            <option
                v-for="group in visibleDiseaseGroups"
                :value="group.name"
                :key="group.name"
            >
                {{ group.description }}
            </option>
        </b-form-select>
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
            diseaseGroup:
                this.$store.getters["bioPortal/diseaseGroup"].portalGroup ||
                null,
          selectedPortal: "",
        };

    },

    computed: {
        visibleDiseaseGroups() {
            return this.diseaseGroups
                .filter(
                    (g) =>
                        g.name !== g.portalGroup &&
                        g.portalGroup === this.diseaseGroup
                )
                .sort((a, b) => (a.description > b.description ? 1 : -1));
        },
    },

    methods: {
        changeDiseaseGroup(newGroup) {
            window.location.href = host.urlWithSubdomain(newGroup).href;
        },
    },
});
</script>
