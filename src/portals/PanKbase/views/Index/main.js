import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/layout.css"
import "../../assets/pkb-styles.css"

Vue.config.productionTip = false;

import pbkHeader from "../../components/pkb-header.vue"
import pkbFooter from "../../components/pkb-footer.vue"

new Vue({
    data: {
    },

    components: {
        pbkHeader,
        pkbFooter
    },

    created() {
        this.injectFavicon('https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/favicon-32x32.png');
        this.injectFont('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap');
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        injectFavicon(faviconUrl) { //todo: make util
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link')
                favicon.setAttribute('rel', 'icon')
                favicon.setAttribute('type', 'image/png')
                favicon.setAttribute('id', 'alex')
                document.head.appendChild(favicon)
            }
            favicon.setAttribute('href', faviconUrl);
        },
        injectFont(fontUrl){ //todo: make util
			const linkTag = document.createElement('link');
			linkTag.rel = 'stylesheet';
			linkTag.href = fontUrl;
			document.head.appendChild(linkTag);
			linkTag.onload = () => {
			};
		}
    },

    computed: {
        
    },

    watch: {

    }
}).$mount("#app");