<template>
    <div>
        <div class="page-info-wrapper">
            <div v-for="(row, i) in newFeaturesList" class="new-feature-item-wrapper">
                <h3>{{row.title}}</h3>
                <div>
                    <span v-html="row.body"></span>
                    <span>
                        <a
                            href="javascript:;"
                            v-on:click="showHideElement('news_content'+row.nid)"
                        >Read more...</a>
                    </span>
                </div>
                <div
                    v-html="row.body_1"
                    :id="'news_content'+row.nid"
                    class="news-content-wrapper hidden"
                ></div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("new-features-section", {
    props: ["newFeatures"],
    computed: {
        newFeaturesList: function() {
            let content = this.newFeatures;
            return content;
        }
    },
    mounted: function() {},
    methods: {
        ...uiUtils,
        showHideElement(ELEMENT) {
            uiUtils.showHideElement(ELEMENT);
        }
    }
});
</script>

<style>
@import url("/css/newFeatures.css");
</style>

