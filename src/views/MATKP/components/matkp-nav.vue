<template>
    <div class="mat-header f-row spread-out align-v-center">
        <a class="logo f-row align-v-center"
           href="/matkp/"
        >
            <div style="width:40px; height: 40px; background: dimgray;"></div>
            <!--<img src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/matkp_logo.png">-->
            <span>MAT<span class="light">KP</span></span>
        </a>
        <div class="f-row menu">
            <a href="/matkp/datasets.html">Datasets</a>
            <a href="/matkp/cellbrowser.html">Cell Browser</a>
            <a href="/matkp/">Help</a>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("matkp-nav", {
    components: {
    },
    props: [],
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
a, a:visited{
    color:white !important;
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
</style>