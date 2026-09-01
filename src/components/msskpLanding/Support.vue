<template>
    <section class="msskp-landing-support">
        <h2 class="msskp-landing-support-header">Our Partners</h2>
        <p class="msskp-landing-support-intro">
            The MSK-KP is a collaboration among the following organizations,
            which also provide funding and/or governance:
        </p>
        <div class="msskp-landing-support-logos">
            <div
                v-for="(row, rowIndex) in logoRows"
                :key="rowIndex"
                class="msskp-landing-support-logo-row"
            >
                <div
                    v-for="logo in row"
                    :key="logo.src"
                    class="msskp-landing-support-logo"
                >
                    <a
                        v-if="logo.href"
                        :href="logo.href"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            :src="logo.src"
                            :alt="logo.alt"
                            :style="{ height: logo.height }"
                        />
                    </a>
                    <img
                        v-else
                        :src="logo.src"
                        :alt="logo.alt"
                        :style="{ height: logo.height }"
                    />
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import Vue from "vue";

export default Vue.component("msskp-landing-support", {
    data() {
        return {
            logos: [
                {
                    alt: "IFMRS",
                    href: "http://www.ifmrs.org",
                    src:
                        "https://kp4cd.org/sites/default/files/vueportal/IFMRS_logo_large.jpeg",
                    height: "50px",
                },
                {
                    alt: "ASBMR",
                    href: "http://www.asbmr.org",
                    src:
                        "https://kp4cd.org/sites/default/files/vueportal/ASBMR_logo.png",
                    height: "70px",
                },
                {
                    alt: "ICMH",
                    href: null,
                    src:
                        "https://kp4cd.org/sites/default/files/vueportal/ICMH_logo.png",
                    height: "45px",
                },
                {
                    alt: "Cancer & Bone Society",
                    href: "http://www.cancerandbone.org/",
                    src:
                        "https://kp4cd.org/sites/default/files/vueportal/CABS_logo_small.png",
                    height: "85px",
                },
                {
                    alt: "ETH Zürich",
                    href: "https://ethz.ch/en.html",
                    src:
                        "https://kp4cd.org/sites/default/files/vueportal/ETH_ZURICH.png",
                    height: "40px",
                },
                {
                    alt: "University of Colorado Orthopedics",
                    href: "https://www.cuanschutz.edu",
                    src:
                        "https://kp4cd.org/sites/default/files/vueportal/u_of_colorado.png",
                    height: "80px",
                },
                {
                    alt: "ORS",
                    href: "https://www.ors.org/",
                    src:
                        "https://kp4cd.org/sites/default/files/vueportal/ORS_logo.jpeg",
                    height: "50px",
                },
                {
                    alt: "ECTS",
                    href: "https://ectsoc.org/",
                    src:
                        "https://kp4cd.org/sites/default/files/vueportal/ECTS_logo.jpeg",
                    height: "45px",
                },
                {
                    alt: "JSBMR",
                    href: "https://ectsoc.org/",
                    src:
                        "https://kp4cd.org/sites/default/files/vueportal/JSBMR_logo_cropped.png",
                    height: "85px",
                },
                {
                    alt: "Broad Institute",
                    href: "https://www.broadinstitute.org",
                    src:
                        "https://kp4cd.org/sites/default/files/vueportal/BroadInstLogoforDigitalRGB.png",
                    height: "40px",
                },
                {
                    alt: "OAI",
                    href: "https://nda.nih.gov/oai",
                    src: "/images/oai_logo.svg",
                    height: "50px",
                },
            ],
        };
    },
    computed: {
        logoRows() {
            const rows = [];
            for (let i = 0; i < this.logos.length; i += 5) {
                rows.push(this.logos.slice(i, i + 5));
            }
            return rows;
        },
    },
});
</script>

<style>
.msskp-landing-support {
    width: 100%;
    background-color: #ffffff;
    padding: 35px 50px;
    box-sizing: border-box;
    text-align: center;
}

.msskp-landing-support-header {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 12px;
    text-align: center;
}

.msskp-landing-support-intro {
    font-size: 16px;
    margin: 0 0 24px;
}

.msskp-landing-support-logos {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.msskp-landing-support-logo-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

.msskp-landing-support-logo img {
    width: auto;
    max-width: 100%;
    display: block;
    margin: 10px 0;
}
</style>
