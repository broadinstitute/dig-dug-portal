<template>
    <div>
        <img v-show="loaded" ref="im" class="card-img-top" />
        <p class="card-text" v-if="documentation && loaded">
            <documentation :name="documentation" :content-fill="contentFill"></documentation>
        </p>
        <div v-else-if="status === 401">Unauthorized</div>
        <div v-else-if="status">Failed to load</div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import Documentation from "@/components/Documentation.vue";
import { request } from "@/utils/bioIndexUtils.js";

export default Vue.component("raw-img", {
    props: ["src", "documentation", "contentFill"],

    components: {
        Documentation,
    },

    data() {
        return {
            status: null,
        };
    },

    mounted() {
        let that = this;
        let im = this.$refs.im;

        request(this.src)
            .then((resp) => {
                that.status = resp.status;

                if (resp.status === 200) {
                    return resp.blob();
                }
            })
            .then((blob) => {
                if (!!blob) {
                    im.src = URL.createObjectURL(blob);
                }
            });
    },

    computed: {
        loaded() {
            return this.status === 200;
        },
        unauthorized() {
            return this.status === 401;
        },
    },
});
</script>
