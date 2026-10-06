<template>
    <section class="mskkp-landing-support">
        <h2 class="mskkp-landing-support-header">Our Partners</h2>
        <p class="mskkp-landing-support-intro">
            The MSK-KP is a collaboration among the following organizations,
            which also provide funding and/or governance:
        </p>
        <div class="mskkp-landing-support-logos">
            <div
                v-for="(row, rowIndex) in partnerLogoRows"
                :key="'partner-' + rowIndex"
                class="mskkp-landing-support-logo-row"
            >
                <div
                    v-for="logo in row"
                    :key="logo.src"
                    class="mskkp-landing-support-logo"
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

        <h3 class="mskkp-landing-support-subheader">
            Other NIAMS-funded Knowledge Bases and Data Repositories
        </h3>
        <div class="mskkp-landing-support-logos">
            <div class="mskkp-landing-support-logo-row">
                <div
                    v-for="logo in niamsLogos"
                    :key="logo.src"
                    class="mskkp-landing-support-logo"
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

export default Vue.component("mskkp-landing-support", {
    data() {
        return {
            partnerLogos: [
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
            ],
            niamsLogos: [
                {
                    alt: "OAI CORE Knowledgebase",
                    href: "https://nda.nih.gov/oai",
                    src: "/images/oai_logo.png",
                    height: "90px",
                },
                {
                    alt: "ROSSA — Rodent Open Science Skeletal Archive",
                    href: "https://rossa.dev.i3.uconn.edu/",
                    src: "/images/rossa_logo.png",
                    height: "55px",
                },
            ],
        };
    },
    computed: {
        partnerLogoRows() {
            const rows = [];
            for (let i = 0; i < this.partnerLogos.length; i += 5) {
                rows.push(this.partnerLogos.slice(i, i + 5));
            }
            return rows;
        },
    },
});
</script>

<style>
.mskkp-landing-support {
    width: 100%;
    background-color: #ffffff;
    padding: 35px 50px;
    box-sizing: border-box;
    text-align: center;
}

.mskkp-landing-support-header {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 12px;
    text-align: center;
}

.mskkp-landing-support-intro {
    font-size: 16px;
    margin: 0 0 24px;
}

.mskkp-landing-support-subheader {
    font-size: 16px;
    font-weight: 700;
    margin: 28px 0 16px;
    text-align: center;
}

.mskkp-landing-support-logos {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.mskkp-landing-support-logo-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
}

.mskkp-landing-support-logo img {
    width: auto;
    max-width: 100%;
    display: block;
    margin: 10px 0;
}
</style>
