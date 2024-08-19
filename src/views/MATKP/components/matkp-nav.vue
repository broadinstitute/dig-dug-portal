<template>
    <div class="mat-header f-row spread-out align-v-center" :class="glass ? 'glass' : ''">
        <a class="logo f-row align-v-center" href="/matkp/">
            <img src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/matkplll.png">
            <span style="font-weight: 600">MAT<span style="font-weight:300">KP</span><span class="tagline">The place for fat.</span></span>
        </a>
        <div class="f-row menu">
            <a href="/matkp/datasets.html">Datasets</a>
            <a href="/matkp/cellbrowser2.html">Cell Browser</a>
            <a href="/matkp/">Help</a>
            <a href="/matkp/">Collaborate</a>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("matkp-nav", {
    components: {},
    props: {
        glass: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {};
    },
    computed: {},
    created() {
        this.injectFavicon('https://hugeampkpncms.org/sites/default/files/users/user32/matkp/favicon-32x32.png');
        this.injectFont('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');
    },
    methods: {
        injectFavicon(faviconUrl) { //todo: make util
            //faviconUrl eg: https://hugeampkpncms.org/sites/default/files/users/user32/matkp/favicon-32x32.png
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link')
                favicon.setAttribute('rel', 'icon')
                favicon.setAttribute('type', 'image/png')
                document.head.appendChild(favicon)
            }
            favicon.setAttribute('href', faviconUrl);
        },
        injectFont(fontUrl){ //todo: make util
            //fontUrl eg: https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap
			const linkTag = document.createElement('link');
			linkTag.rel = 'stylesheet';
			linkTag.href = fontUrl;
			document.head.appendChild(linkTag);
			linkTag.onload = () => {
			};
		}
    },
});
</script>
<style scoped>
.mat-header{
    padding: 5px 20px;
}
.mat-header a, .mat-header a:visited{
    color:white !important;
    text-decoration: none;
}
.mat-header.glass{
    background:#ffffff20;
    backdrop-filter: blur(10px);
    position:absolute;
    width:100vw;
    z-index:1;
    box-shadow: 0 0 10px 0 #42424220;
}
.mat-header.glass a, 
.mat-header.glass a:visited{
    color:black !important;
    text-decoration: none;
}
.logo{
    height:40px;
    gap: 10px;
    font-size: 22px;
}
.logo img{
    height:inherit;
}
.menu{
    font-size:14px;
    gap: 10px;
}
.menu a:hover{
    text-decoration: underline;
}
.tagline{
    color:#ffd10c; 
    font-size:12px; 
    margin:0 0 0 10px; 
    font-style:italic
}
.glass .tagline{
    color:#ff6c02;
}
</style>