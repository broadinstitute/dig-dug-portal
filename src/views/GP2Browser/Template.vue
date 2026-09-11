<template>
    <div class="gp2-browser-page">
        <header class="gp2-project-header" role="banner">
            <a
                class="gp2-project-header__brand"
                href="https://gp2.broadinstitute.org/"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img
                    class="gp2-project-header__logo"
                    src="images/gp2_header_logo.svg"
                    alt="Global Parkinson's Genetics Program (GP2)"
                    width="200"
                    height="40"
                />
            </a>
        </header>

        <gp2-browser
            v-if="$parent.phenotypesInSession && $parent.phenotypesInSession.length"
            :phenotypes-in-use="$parent.phenotypesInSession"
            :utils-box="$parent.utilsBox"
            :section-configs="$parent.sectionConfigs"
        ></gp2-browser>
        <div v-else class="gp2-browser-loading">
            Loading phenotypes…
        </div>
    </div>
</template>

<script>
import GP2Browser from "@/components/researchPortal/customComponents/GP2Browser.vue";

export default {
    components: {
        GP2Browser,
    },
};
</script>

<style>
.gp2-browser-page {
    min-height: 100vh;
}

.gp2-browser-loading {
    padding: 2rem;
    color: #555;
}

.gp2-project-header {
    display: flex;
    align-items: center;
    padding: 10px 30px;
    background-color: #207163;
    color: #fff;
}

.gp2-project-header__brand {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    line-height: 0;
    text-decoration: none;
}

.gp2-project-header__logo {
    display: block;
    height: 40px;
    width: auto;
}

@media (max-width: 640px) {
    .gp2-project-header {
        padding: 10px 16px;
    }
}
</style>
