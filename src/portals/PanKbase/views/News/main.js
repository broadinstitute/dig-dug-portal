import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import keyParams from "@/utils/keyParams";

new Vue({
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            feedUrl: "https://hugeampkpncms.org/rest/news_list?project=pankbase",
            itemUrl: "https://hugeampkpncms.org/rest/news?id=",
            newsItemUrl: "/news.html?id=",
            newsFeed: null,
            newsItem: null,
        };
    },
    computed: {},
    watch: {},
    async created() {
        if(keyParams.id){
            this.getNewsItem(keyParams.id);
        }else{
            this.getNews();
        }
        
    },
    methods: {
        async getNews(){
            const newsFeedUrl = this.feedUrl;
            const newsFeed = await fetch(newsFeedUrl).then(resp => { return resp.json();});
            newsFeed.forEach(item=>{
                //extract only the img element frforom thumbnail, wysiwyg html can be polluted sometimes
                item.field_thumbnail_image = new DOMParser().parseFromString(item.field_thumbnail_image, 'text/html').querySelector('img')?.outerHTML || '';
            })
            this.newsFeed = newsFeed; 
            console.log(this.newsFeed);
        },
        async getNewsItem(id){
            const newsItem = await fetch(this.itemUrl+id).then(resp => { return resp.json();});
            if(newsItem.length===0){
                console.log('no news data for id', id);
                this.getNews();
            }else{
                this.newsItem = newsItem;
            }
            console.log('newsItem', this.newsItem);
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
