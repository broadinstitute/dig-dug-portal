<template>
    <div class="msskp-landing">
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            page="front"
        ></page-header>

        <msskp-landing-hero-banner
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :phenotypes="$parent.phenotypesInSession"
            :utils="$parent.utilsBox"
        ></msskp-landing-hero-banner>

        <msskp-landing-metrics
            :stats="$parent.statsArray"
        ></msskp-landing-metrics>

        <msskp-landing-main
            :front-contents="$parent.frontContents"
        ></msskp-landing-main>

        <msskp-landing-features></msskp-landing-features>

        <msskp-landing-community
            :disease-group="$parent.diseaseGroup"
            :news-feed="$store.state.kp4cd.newsFeed"
            :front-contents="$parent.frontContents"
        ></msskp-landing-community>

        <msskp-landing-support></msskp-landing-support>

        <msskp-landing-footer
            :disease-group="$parent.diseaseGroup"
        ></msskp-landing-footer>
    </div>
</template>
<style>
@import url("https://fonts.googleapis.com/css2?family=Raleway:wght@100..900&family=Roboto+Slab:wght@100..900&display=swap");

html,
body,
#app,
.msskp-landing {
    margin: 0;
    padding: 0;
}

body.kp-default {
    background-color: #fff;
}

.msskp-landing h2 {
    font-family: "Roboto Slab", serif;
    color: #6060a4;
}
</style>
