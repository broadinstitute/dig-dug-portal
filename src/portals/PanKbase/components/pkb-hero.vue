<template>
    <div class="pkb-hero">
        <div class="pkb-hero-bg">
            <div class="pkb-hero-title">
                <img src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/pkb-text-b.svg">
                <div>A centralized resource<br>of the human pancreas<br>for diabetes research.</div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("pkb-hero", {
    components: {},
    props: {},
    data() {
        return {};
    },
    created() {},
    computed: {},
    methods: {},
});
</script>

<style scoped>
.pkb-hero {
    width: 100%;
    height: 600px;
}
.pkb-hero-bg{
    background-image: url(../assets/pkb-hero-bg.png);
    background-repeat: no-repeat;
    height: calc(100% + 100px);
    margin: -100px 0 0 0;
    background-size: auto 1100px;
    background-position: center top;
    display:flex;
    justify-content: center;
}
.pkb-hero-title{
    font-size: 16px;
    line-height: 18px;
    font-weight: 700;
    display:flex;
    flex-direction: column;
    gap:10px;
    margin: 300px 0 0 300px;
}
.pkb-hero-title img{
    width:225px;
}
</style>