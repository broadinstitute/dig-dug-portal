<template>
    <div class="img">
        <img v-show="loaded && !loading" ref="im" class="card-img-top" />
        <b-skeleton-wrapper :loading="loading">
            <template v-slot:loading>
                <b-skeleton-img no-aspect height="300px"></b-skeleton-img>
            </template>

            <p v-if="documentation && loaded" class="card-text">
                <documentation
                    :name="documentation"
                    :content-fill="contentFill"
                    :contentMap="$store.state.bioPortal.documentations"
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
            <b-alert v-else-if="!!customFailureMsg" class="unauthorized" show variant="warning">
                {{this.customFailureMsg}}
            </b-alert>
            <b-alert v-else-if="failed" class="failed" show variant="danger">
                <b-icon icon="exclamation-triangle"></b-icon> Failed to load
            </b-alert>
        </b-skeleton-wrapper>
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
    props: ["src", "documentation", "contentFill", "customFailureMsg"],
    mixins: [userMixin],
    components: {
        Documentation,
    },
    data() {
        return {
            status: null,
            loading: false,
        };
    },
    mounted() {
        this.$store.state.manhattanPlotAvailable = true;
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
            let hasFailed = !!this.status && !this.loaded && !this.unauthorized;
            return hasFailed;
        },
    },
    methods: {
        getImage() {
            let that = this;
            let im = this.$refs.im;
            this.loading = true;

            request(this.src)
                .then((resp) => {
                    that.status = resp.status;

                    if (resp.status === 200) {
                        this.$store.state.manhattanPlotAvailable = true;
                        return resp.blob();
                    }
                })
                .then((blob) => {
                    if (!!blob) {
                        this.$store.state.manhattanPlotAvailable = true;
                        im.src = URL.createObjectURL(blob);
                    } else {
                        this.$store.state.manhattanPlotAvailable = false;
                    }
                    this.loading = false;
                });
        },
    },
    watch: {
        src: {
            handler: "getImage",
        },
    },
});
</script>
