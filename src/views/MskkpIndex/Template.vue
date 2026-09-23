<template>
    <div class="mskkp-landing">
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            page="front"
        ></page-header>

        <mskkp-landing-hero-banner
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :phenotypes="$parent.phenotypesInSession"
            :utils="$parent.utilsBox"
        ></mskkp-landing-hero-banner>

        <mskkp-landing-metrics
            :stats="$parent.statsArray"
        ></mskkp-landing-metrics>

        <mskkp-landing-main
            :front-contents="$parent.frontContents"
        ></mskkp-landing-main>

        <mskkp-landing-features></mskkp-landing-features>

        <mskkp-landing-community
            :disease-group="$parent.diseaseGroup"
            :news-feed="$store.state.kp4cd.newsFeed"
            :front-contents="$parent.frontContents"
        ></mskkp-landing-community>

        <mskkp-landing-support></mskkp-landing-support>

        <mskkp-landing-footer
            :disease-group="$parent.diseaseGroup"
        ></mskkp-landing-footer>
    </div>
</template>
<style>
@import url("https://fonts.googleapis.com/css2?family=Raleway:wght@100..900&family=Roboto+Slab:wght@100..900&display=swap");

html,
body,
#app,
.mskkp-landing {
    margin: 0;
    padding: 0;
}

body.kp-default {
    background-color: #fff;
}

.mskkp-landing h2 {
    font-family: "Roboto Slab", serif;
    color: #6060a4;
}
</style>
