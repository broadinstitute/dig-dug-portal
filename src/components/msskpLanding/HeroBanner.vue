<template>
    <section class="msskp-landing-hero-banner">
        <img
            class="msskp-landing-hero-logo"
            src="https://kp4cd.org/sites/default/files/vueportal/mskkp_front_logo.png"
            alt="MSK-KP"
        />
        <p class="msskp-landing-hero-tagline">
            Integrated multi-species genetic, genomic, and single cell evidence
            for musculoskeletal biology
        </p>
        <div class="msskp-landing-hero-search">
            <div class="msskp-landing-hero-search-label">
                Search gene, variant, region, phenotype or tissue
            </div>
            <input
                class="msskp-landing-hero-search-box"
                type="text"
            />
            <div class="msskp-landing-hero-search-examples">
                examples: WNT16 gene; WNT16 region; rs17284876;
                chr7:120,500,000-121,500,000; Osteoporosis; Bone
            </div>
        </div>
    </section>
</template>

<script>
import Vue from "vue";

export default Vue.component("msskp-landing-hero-banner", {
    props: ["diseaseGroup", "frontContents", "phenotypes", "utils"],
});
</script>

<style>
.msskp-landing-hero-banner {
    width: 100%;
    height: 350px;
    background-color: #918bc3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 25px 20px;
    text-align: center;
}

.msskp-landing-hero-logo {
    max-height: 90px;
    width: auto;
    display: block;
}

.msskp-landing-hero-tagline {
    color: #fff;
    font-size: 18px;
    font-weight: 300;
    max-width: 680px;
    margin: 27px 0 33px;
    line-height: 1.35;
}

.msskp-landing-hero-search-label,
.msskp-landing-hero-search-examples {
    color: #bcafd6;
    font-size: 14px;
}

.msskp-landing-hero-search-label {
    margin-bottom: 8px;
}

.msskp-landing-hero-search-box {
    width: 680px;
    height: 40px;
    border-radius: 5px;
    border: none;
    box-sizing: border-box;
    display: block;
    margin: 0 auto;
    padding: 0 12px;
}

.msskp-landing-hero-search-examples {
    margin-top: 8px;
    max-width: 680px;
}
</style>
