<template>
    <section class="mskkp-landing-hero-banner">
        <img
            class="mskkp-landing-hero-logo"
            src="/images/MSKKP_logo.svg"
            alt="MSK-KP"
        />
        <p class="mskkp-landing-hero-tagline">
            Integrated multi-species genetic, genomic, and single cell evidence
            for musculoskeletal biology
        </p>
        <div class="mskkp-landing-hero-search">
            <div class="mskkp-landing-hero-search-label">
                Search gene, variant, region, phenotype or tissue
            </div>
            <research-single-search
                :single-search-config="null"
                :phenotypes="phenotypes"
                :utils="utils"
            ></research-single-search>
            <div class="mskkp-landing-hero-search-examples">
                <documentation
                    name="home.example"
                    :contentMap="$store.state.bioPortal.documentations"
                ></documentation>
            </div>
        </div>
    </section>
</template>

<script>
import Vue from "vue";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import Documentation from "@/components/Documentation.vue";

export default Vue.component("mskkp-landing-hero-banner", {
    props: ["diseaseGroup", "frontContents", "phenotypes", "utils"],
    components: {
        ResearchSingleSearch,
        Documentation,
    },
    mounted() {
        let searchInput = this.$el.querySelector("#byor_single_search");

        if (searchInput) {
            searchInput.setAttribute("autocomplete", "off");
            searchInput.setAttribute("spellcheck", "false");
            searchInput.setAttribute("placeholder", "");
        }
    },
});
</script>

<style>
.mskkp-landing-hero-banner {
    width: 100%;
    height: auto;
    background-color: #918bc3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 25px 20px;
    text-align: center;
    overflow: visible;
    position: relative;
    z-index: 2;
}

.mskkp-landing-hero-logo {
    max-height: 110px;
    width: auto;
    display: block;
    margin-top: 30px;
}

.mskkp-landing-hero-tagline {
    color: #fff;
    font-family: "Roboto Slab", serif;
    font-size: 24px;
    font-weight: 300;
    max-width: 680px;
    margin: 27px 0 33px;
    line-height: 1.35;
}

.mskkp-landing-hero-search-label,
.mskkp-landing-hero-search-examples {
    color: #bcafd6;
    font-size: 14px;
}

.mskkp-landing-hero-search {
    position: relative;
    z-index: 3;
    width: 100%;
    max-width: 680px;
}

.mskkp-landing-hero-search-label {
    margin-bottom: 8px;
}

.mskkp-landing-hero-search .byor-single-search-wrapper {
    position: relative;
    width: 100%;
    margin: 0 auto;
}

.mskkp-landing-hero-search .byor-single-search-wrapper input,
.mskkp-landing-hero-search .byor-single-search-results {
    width: 100% !important;
    box-sizing: border-box;
}

.mskkp-landing-hero-search .byor-single-search-wrapper input {
    display: block;
    height: 40px;
    border-radius: 5px;
    border: none;
    box-sizing: border-box;
    padding: 0 36px 0 12px;
    font-size: 16px;
    line-height: 40px;
}

.mskkp-landing-hero-search .byor-single-search-wrapper .reset-search {
    top: 12px;
    right: 8px;
}

.mskkp-landing-hero-search .single-search-option {
    margin: 5px 0;
}

.mskkp-landing-hero-search .single-search-option > a,
.mskkp-landing-hero-search .single-search-option .search-word-group a {
    color: #9654d4 !important;
    text-decoration: none;
}

.mskkp-landing-hero-search-examples {
    margin-top: 8px;
    width: 100%;
    max-width: 680px;
}

.mskkp-landing-hero-search-examples p {
    margin: 0;
}

.mskkp-landing-hero-search-examples a.doc {
    color: #bcafd6 !important;
    text-decoration: none;
}
</style>
