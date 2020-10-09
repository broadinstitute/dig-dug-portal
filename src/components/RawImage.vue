<template>
    <div class="img">
        <img v-show="loaded" ref="im" class="card-img-top" />
        <p class="card-text" v-if="documentation && loaded">
            <documentation
                :name="documentation"
                :content-fill="contentFill"
            ></documentation>
        </p>
        <b-alert
            v-else-if="unauthorized && !user"
            class="unauthorized"
            show
            variant="warning"
        >
            <b-icon icon="exclamation-triangle"></b-icon>Please
            <a href="/login" @click="saveCurrentPage">log in</a> with an
            authorized Google account to see this content.
        </b-alert>
        <b-alert
            v-else-if="unauthorized && !!user"
            class="unauthorized"
            show
            variant="warning"
        >
            <b-icon icon="exclamation-triangle"></b-icon>You don't have
            permission to view this content. <br />Please contact us if you
            believe you should've given access.
        </b-alert>
        <b-alert v-else-if="failed" class="failed" show variant="danger">
            <b-icon icon="exclamation-triangle"></b-icon>Failed to load
        </b-alert>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Documentation from "@/components/Documentation.vue";
import { request } from "@/utils/bioIndexUtils.js";
import { userMixin } from "@/mixins/userMixin";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
export default Vue.component("raw-img", {
    props: ["src", "documentation", "contentFill"],
    mixins: [userMixin],
    components: {
        Documentation,
    },
    data() {
        return {
            status: null,
        };
    },
    mounted() {
        this.getImage();
    },
    computed: {
        loaded() {
            return this.status === 200;
        },
        unauthorized() {
            return this.status === 401;
        },
        failed() {
            return !!this.status && !this.loaded && !this.unauthorized;
        },
    },
    methods: {
        getImage() {
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
                    if (!!blob && !!im) {
                        im.src = URL.createObjectURL(blob);
                    }
                });
        },
    },
    watch: {
        src: {
            handler: "getImage",
            immediate: true,
        },
    },
});
</script>
