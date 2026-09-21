<template>
    <section class="msskp-landing-main">
        <div class="msskp-landing-main-columns">
            <div class="msskp-landing-main-about">
                The MSK-KP integrates multi-species comparisons and human
                genetic associations, functional genomics, and cellular context
                to help prioritize genes and mechanisms underlying
                musculoskeletal disease.
            </div>
            <!-- <msskp-landing-results-primer></msskp-landing-results-primer> -->
        </div>
    </section>
</template>

<script>
import Vue from "vue";
import MsskpLandingResultsPrimer from "@/components/msskpLanding/ResultsPrimer.vue";

export default Vue.component("msskp-landing-main", {
    components: {
        MsskpLandingResultsPrimer,
    },
    props: ["frontContents"],
});
</script>

<style>
.msskp-landing-main {
    width: 100%;
    padding: 35px 50px;
    background-color: #ffffff;
    box-sizing: border-box;
}

.msskp-landing-main-columns {
    display: block;
    text-align: center;
    width: 75%;
    margin: auto;
}

.msskp-landing-main-about {
    font-family: "Roboto Slab", serif;
    color: #6060a4;
    font-weight: 600;
    font-size: 30px;
    line-height: 1.5;
    padding: 50px;
}
</style>
