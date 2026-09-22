<template>
    <section class="mskkp-landing-main">
        <div class="mskkp-landing-main-columns">
            <div class="mskkp-landing-main-about">
                The MSK-KP integrates multi-species comparisons and human
                genetic associations, functional genomics, and cellular context
                to help prioritize genes and mechanisms underlying
                musculoskeletal disease.
            </div>
            <!-- <mskkp-landing-results-primer></mskkp-landing-results-primer> -->
        </div>
    </section>
</template>

<script>
import Vue from "vue";
import MskkpLandingResultsPrimer from "@/components/mskkpLanding/ResultsPrimer.vue";

export default Vue.component("mskkp-landing-main", {
    components: {
        MskkpLandingResultsPrimer,
    },
    props: ["frontContents"],
});
</script>

<style>
.mskkp-landing-main {
    width: 100%;
    padding: 35px 50px;
    background-color: #ffffff;
    box-sizing: border-box;
}

.mskkp-landing-main-columns {
    display: block;
    text-align: center;
    width: 75%;
    margin: auto;
}

.mskkp-landing-main-about {
    font-family: "Roboto Slab", serif;
    color: #6060a4;
    font-weight: 600;
    font-size: 30px;
    line-height: 1.5;
    padding: 50px;
}
</style>
