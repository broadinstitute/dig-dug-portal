<template>
    <div>
        <div class="page-info-wrapper">
            <div v-for="(row, i) in newFeaturesList" class="new-feature-item-wrapper">
                <h3 :id="'news_content_title'+row.nid">
                    <a href="javascript:;" v-on:click="setSeletedNews(row.nid)">{{row.title}}</a>
                </h3>
                <div>
                    <span v-html="row.body"></span>
                    <span>
                        <a href="javascript:;" v-on:click="setSeletedNews(row.nid)">Read more...</a>
                    </span>
                </div>
                <div
                    v-html="row.body_1"
                    :id="'news_content'+row.nid"
                    class="news-content-wrapper"
                    :class="selectedNews != null && row.nid == selectedNews? '':'hidden' "
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
    props: ["newFeatures", "nid"],
    data() {
        return {
            selectedNews: this.nid
        };
    },
    computed: {
        newFeaturesList: function() {
            let content = this.newFeatures;
            return content;
        }
    },
    updated: function() {
        if (this.selectedNews != null) {
            let element = document.getElementById(
                "news_content_title" + this.selectedNews
            );
            if (!!element) {
                element.scrollIntoView(true);
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest"
                });
            }
        }
    },
    methods: {
        ...uiUtils,
        setSeletedNews(nid) {
            this.selectedNews == nid
                ? (this.selectedNews = null)
                : (this.selectedNews = nid);
        }
    }
});
</script>

