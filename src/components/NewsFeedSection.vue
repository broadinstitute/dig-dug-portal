<template>
    <div id="news-feed">
        <h2 style="font-family:'Oswald'; font-size: 30px; margin-top:5px;">What's new</h2>
        <ul class="news-items">
            <li v-for="item in filteredNews" v-on:click="onSwitchNews(item.news_number)">
                <span v-html="item.title" style="font-weight:600;">{{ item.title }}</span>
                <span v-html="item.body">{{ item.body }}</span>
                <span>
                    ...
                    <a
                        :href="'http://kp4cd.org/new_features/'+$store.state.diseaseGroup+'?nid='+item.nid"
                        target="_blank"
                    >Read more</a>
                </span>
            </li>
        </ul>
        <div class="news-items-ui">
            <a
                href="javascript:;"
                v-for="item in newsIndex"
                v-on:click="onSwitchNews(item)"
                :class="item == 1? 'on-view':''"
            >{{ item }}</a>
        </div>
        <a
            href="http://www.kp4cd.org/new_features/mdkp"
            target="_blank"
            style="display: block; position: absolute; bottom: -5px; font-weight: 600;"
        >View news archive ></a>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

export default Vue.component("news-feed-section", {
    props: ["newsItems"],
    data() {
        return {
            newsIndex: [1, 2, 3, 4]
        };
    },
    methods: {
        onSwitchNews: function(NEWSINDEX) {
            let newsNum = NEWSINDEX == 5 ? 1 : NEWSINDEX;

            $(".news-items-ui")
                .find("a")
                .each(function() {
                    $(this).removeClass("on-view");
                });

            $(".news-items-ui")
                .find("a")
                .eq(newsNum - 1)
                .addClass("on-view");

            $(".news-items")
                .find("li")
                .each(function() {
                    $(this).css("display", "none");
                });

            $(".news-items")
                .find("li")
                .eq(newsNum - 1)
                .toggle("slow");
        }
    },
    computed: {
        filteredNews() {
            let filteredPortalNews = [];
            let portal = this.$store.state.diseaseGroup;
            let newsNum = 0;
            $.each(this.$store.state.kp4cd.newsFeed, function(index, news) {
                if (newsNum < 4) {
                    let newsBody = news.body.split(" ").slice(0, 15);
                    let numWords = 10;
                    let joinedNewsBody = newsBody.join(" ");

                    let tempNews = {
                        title: news.title + ": ",
                        body: joinedNewsBody,
                        nid: news.nid,
                        news_number: newsNum + 2
                    };

                    if (portal == "md") {
                        filteredPortalNews.push(tempNews);
                        newsNum++;
                    } else {
                        if (news.field_portals.indexOf(portal) >= 0) {
                            filteredPortalNews.push(tempNews);
                            newsNum++;
                        }
                    }
                }
            });
            return filteredPortalNews;
        }
    }
});
</script>
