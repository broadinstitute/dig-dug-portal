<template>
    <div class="mat-header f-row spread-out align-v-center" :class="glass ? 'glass' : ''">
        <a class="logo f-row align-v-center"
           href="/matkp/"
        >
            <!--<div style="width:40px; height: 40px; background: dimgray;"></div>-->
            <img src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/matkplll.png">
            <span>MAT<span class="light">KP</span><span class="tagline">The place for fat.</span></span>
            
        </a>
        <div class="f-row menu">
            <a href="/matkp/datasets.html">Datasets</a>
            <a href="/matkp/cellbrowser.html">Cell Browser</a>
            <a href="/matkp/">Help</a>
            <a href="/matkp/">Collaborate</a>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("matkp-nav", {
    components: {
    },
    props: {
        glass: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            
        };
    },
    computed: {
    },
    created() {
    },
    methods: {
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
    color:#ff04a7;
}
</style>